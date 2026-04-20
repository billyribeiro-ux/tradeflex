import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { refundRequest } from '$lib/server/db/schema';
import { assertRole, AuthzError, type Caller } from '$lib/server/authz/caller';
import { stripe, StripeRequestError } from '$lib/server/stripe';
import { writeAudit } from './audit';

export type RefundRequestRow = typeof refundRequest.$inferSelect;

export class RefundStateError extends Error {
	readonly httpStatus = 409;
	constructor(message: string) {
		super(message);
		this.name = 'RefundStateError';
	}
}

const REQUESTER_ROLES = ['owner', 'admin', 'support', 'finance'] as const;
const APPROVER_ROLES = ['owner', 'finance'] as const;

export const refundsService = {
	async list(caller: Caller): Promise<RefundRequestRow[]> {
		assertRole(caller, 'owner', 'admin', 'finance', 'support', 'analyst');
		return db.select().from(refundRequest).orderBy(desc(refundRequest.requestedAt)).limit(200);
	},

	async request(
		caller: Caller,
		params: {
			paymentIntentId: string;
			chargeId?: string | null;
			customerId?: string | null;
			subjectUserId?: string | null;
			amountCents: number;
			currency: string;
			reason: string;
		}
	): Promise<RefundRequestRow> {
		assertRole(caller, ...REQUESTER_ROLES);
		if (!params.paymentIntentId.startsWith('pi_')) {
			throw new RefundStateError('paymentIntentId must start with pi_');
		}
		if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
			throw new RefundStateError('amountCents must be a positive integer');
		}
		if (params.reason.trim().length < 3) {
			throw new RefundStateError('reason is required');
		}
		const id = crypto.randomUUID();
		const [row] = await db
			.insert(refundRequest)
			.values({
				id,
				stripePaymentIntentId: params.paymentIntentId,
				stripeChargeId: params.chargeId ?? null,
				stripeCustomerId: params.customerId ?? null,
				subjectUserId: params.subjectUserId ?? null,
				amountCents: params.amountCents,
				currency: params.currency.toLowerCase(),
				reason: params.reason.trim(),
				status: 'pending',
				requestedByUserId: caller.userId!,
				idempotencyKey: `refund:${id}`
			})
			.returning();
		await writeAudit(caller, {
			action: 'refund.request',
			targetKind: 'refund_request',
			targetId: id,
			metadata: {
				paymentIntentId: params.paymentIntentId,
				amountCents: params.amountCents,
				currency: params.currency
			}
		});
		return row;
	},

	async approve(caller: Caller, params: { id: string; note?: string }): Promise<RefundRequestRow> {
		assertRole(caller, ...APPROVER_ROLES);

		return await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(refundRequest)
				.where(eq(refundRequest.id, params.id))
				.limit(1)
				.for('update');
			if (!row) throw new RefundStateError('refund request not found');
			if (row.status !== 'pending') {
				throw new RefundStateError(`refund is already ${row.status}`);
			}
			if (row.requestedByUserId === caller.userId) {
				throw new AuthzError('two-person rule: requester cannot approve their own refund');
			}

			let refundId: string;
			try {
				const refund = await stripe.createRefund(
					{
						paymentIntentId: row.stripePaymentIntentId,
						amountCents: row.amountCents,
						reason: 'requested_by_customer',
						metadata: {
							refund_request_id: row.id,
							requested_by: row.requestedByUserId,
							approved_by: caller.userId!
						}
					},
					{ idempotencyKey: row.idempotencyKey }
				);
				refundId = refund.id;
			} catch (e) {
				const msg = e instanceof StripeRequestError ? e.message : 'Stripe refund failed';
				await tx
					.update(refundRequest)
					.set({
						status: 'failed',
						decidedByUserId: caller.userId,
						decidedAt: new Date(),
						decisionNote: `${params.note ?? ''}\nStripe error: ${msg}`.trim()
					})
					.where(and(eq(refundRequest.id, params.id), eq(refundRequest.status, 'pending')));
				throw e;
			}

			const [updated] = await tx
				.update(refundRequest)
				.set({
					status: 'approved',
					decidedByUserId: caller.userId,
					decidedAt: new Date(),
					decisionNote: params.note?.trim() || null,
					stripeRefundId: refundId
				})
				.where(and(eq(refundRequest.id, params.id), eq(refundRequest.status, 'pending')))
				.returning();
			if (!updated) throw new RefundStateError('refund state changed during approval');

			await writeAudit(caller, {
				action: 'refund.approve',
				targetKind: 'refund_request',
				targetId: row.id,
				metadata: {
					stripeRefundId: refundId,
					requestedBy: row.requestedByUserId,
					amountCents: row.amountCents
				}
			});
			return updated;
		});
	},

	async deny(caller: Caller, params: { id: string; note: string }): Promise<RefundRequestRow> {
		assertRole(caller, ...APPROVER_ROLES);
		if (params.note.trim().length < 3) {
			throw new RefundStateError('denial requires a note');
		}
		return await db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(refundRequest)
				.where(eq(refundRequest.id, params.id))
				.limit(1)
				.for('update');
			if (!row) throw new RefundStateError('refund request not found');
			if (row.status !== 'pending') {
				throw new RefundStateError(`refund is already ${row.status}`);
			}
			if (row.requestedByUserId === caller.userId) {
				throw new AuthzError('two-person rule: requester cannot deny their own refund');
			}
			const [updated] = await tx
				.update(refundRequest)
				.set({
					status: 'denied',
					decidedByUserId: caller.userId,
					decidedAt: new Date(),
					decisionNote: params.note.trim()
				})
				.where(and(eq(refundRequest.id, params.id), eq(refundRequest.status, 'pending')))
				.returning();
			if (!updated) throw new RefundStateError('refund state changed during denial');
			await writeAudit(caller, {
				action: 'refund.deny',
				targetKind: 'refund_request',
				targetId: row.id,
				metadata: { requestedBy: row.requestedByUserId }
			});
			return updated;
		});
	}
};
