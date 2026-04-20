import { and, eq, isNull, lte, desc, gt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	accountDeletion,
	auditEvent,
	alert,
	contact,
	profile,
	refundRequest,
	subscription,
	user
} from '$lib/server/db/schema';
import { assertAuthenticated, assertRole, AuthzError, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export type AccountDeletionRow = typeof accountDeletion.$inferSelect;

export const DELETION_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export class ComplianceError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'ComplianceError';
		this.httpStatus = httpStatus;
	}
}

export interface DataExport {
	generatedAt: string;
	subjectUserId: string;
	user: unknown;
	profile: unknown;
	subscriptions: unknown[];
	contactsOwned: unknown[];
	alertsPublished: unknown[];
	refundRequestsFiled: unknown[];
	auditAsActor: unknown[];
}

export const complianceService = {
	async exportForCaller(caller: Caller): Promise<DataExport> {
		assertAuthenticated(caller);
		const uid = caller.userId;
		const [u] = await db.select().from(user).where(eq(user.id, uid)).limit(1);
		const [p] = await db.select().from(profile).where(eq(profile.userId, uid)).limit(1);
		const subs = await db
			.select()
			.from(subscription)
			.where(eq(subscription.userId, uid))
			.orderBy(desc(subscription.createdAt));
		// contacts are leads — most users won't have any, but staff may.
		const contacts = await db
			.select()
			.from(contact)
			.where(eq(contact.email, u?.email ?? '__none__'));
		const alerts = await db
			.select()
			.from(alert)
			.where(eq(alert.publishedByUserId, uid))
			.orderBy(desc(alert.publishedAt));
		const refunds = await db
			.select()
			.from(refundRequest)
			.where(eq(refundRequest.requestedByUserId, uid))
			.orderBy(desc(refundRequest.requestedAt));
		const audits = await db
			.select()
			.from(auditEvent)
			.where(eq(auditEvent.actorUserId, uid))
			.orderBy(desc(auditEvent.at))
			.limit(1000);

		await writeAudit(caller, {
			action: 'compliance.export',
			targetKind: 'user',
			targetId: uid,
			metadata: { rows: subs.length + alerts.length + refunds.length + audits.length }
		});

		return {
			generatedAt: new Date().toISOString(),
			subjectUserId: uid,
			user: u ?? null,
			profile: p ?? null,
			subscriptions: subs,
			contactsOwned: contacts,
			alertsPublished: alerts,
			refundRequestsFiled: refunds,
			auditAsActor: audits
		};
	},

	async requestDeletion(caller: Caller, params: { reason?: string }): Promise<AccountDeletionRow> {
		assertAuthenticated(caller);
		const uid = caller.userId;
		const existing = await this.getPendingForUser(uid);
		if (existing) {
			throw new ComplianceError('deletion already scheduled', 409);
		}
		const id = crypto.randomUUID();
		const scheduledFor = new Date(Date.now() + DELETION_GRACE_MS);
		const [row] = await db
			.insert(accountDeletion)
			.values({
				id,
				userId: uid,
				scheduledFor,
				reason: params.reason?.trim() || null
			})
			.returning();
		await writeAudit(caller, {
			action: 'compliance.deletion.request',
			targetKind: 'user',
			targetId: uid,
			metadata: { scheduledFor, reason: params.reason?.trim() ?? null }
		});
		return row;
	},

	async cancelDeletion(caller: Caller): Promise<void> {
		assertAuthenticated(caller);
		const uid = caller.userId;
		const pending = await this.getPendingForUser(uid);
		if (!pending) return;
		await db
			.update(accountDeletion)
			.set({ cancelledAt: new Date() })
			.where(eq(accountDeletion.id, pending.id));
		await writeAudit(caller, {
			action: 'compliance.deletion.cancel',
			targetKind: 'user',
			targetId: uid,
			metadata: { requestedAt: pending.requestedAt }
		});
	},

	async getPendingForUser(userId: string): Promise<AccountDeletionRow | null> {
		const rows = await db
			.select()
			.from(accountDeletion)
			.where(
				and(
					eq(accountDeletion.userId, userId),
					isNull(accountDeletion.cancelledAt),
					isNull(accountDeletion.executedAt)
				)
			)
			.limit(1);
		return rows[0] ?? null;
	},

	async listPending(caller: Caller): Promise<AccountDeletionRow[]> {
		assertRole(caller, 'owner', 'admin', 'support');
		return db
			.select()
			.from(accountDeletion)
			.where(and(isNull(accountDeletion.cancelledAt), isNull(accountDeletion.executedAt)))
			.orderBy(desc(accountDeletion.scheduledFor));
	},

	async listDueForSweep(now = new Date()): Promise<AccountDeletionRow[]> {
		return db
			.select()
			.from(accountDeletion)
			.where(
				and(
					isNull(accountDeletion.cancelledAt),
					isNull(accountDeletion.executedAt),
					lte(accountDeletion.scheduledFor, now)
				)
			);
	},

	/**
	 * Automated cron sweep: deletes every past-grace row transactionally and
	 * writes a system-attributed audit row per deletion. Returns per-row
	 * outcomes so the caller (cron endpoint) can report a summary. Does NOT
	 * re-use `executeDeletion` because that one requires a human owner; the
	 * sweep is system-attributed (`actorUserId: null`) and has no caller.
	 */
	async runSweep(
		now = new Date()
	): Promise<{ scanned: number; deleted: string[]; failed: { id: string; error: string }[] }> {
		const due = await this.listDueForSweep(now);
		const deleted: string[] = [];
		const failed: { id: string; error: string }[] = [];
		for (const row of due) {
			try {
				await db.transaction(async (tx) => {
					const updated = await tx
						.update(accountDeletion)
						.set({ executedAt: new Date() })
						.where(and(eq(accountDeletion.id, row.id), isNull(accountDeletion.executedAt)))
						.returning();
					if (updated.length === 0) {
						throw new Error('row already executed');
					}
					await tx.delete(user).where(eq(user.id, row.userId));
				});
				await db.insert(auditEvent).values({
					id: crypto.randomUUID(),
					actorUserId: null,
					impersonatorUserId: null,
					action: 'compliance.deletion.sweep',
					targetKind: 'user',
					targetId: row.userId,
					metadata: {
						id: row.id,
						scheduledFor: row.scheduledFor.toISOString(),
						reason: row.reason ?? null,
						via: 'cron'
					}
				});
				deleted.push(row.userId);
			} catch (err) {
				failed.push({ id: row.id, error: err instanceof Error ? err.message : String(err) });
			}
		}
		return { scanned: due.length, deleted, failed };
	},

	async adminCancel(caller: Caller, params: { id: string; note: string }): Promise<void> {
		assertRole(caller, 'owner', 'admin');
		if (params.note.trim().length < 3) {
			throw new ComplianceError('admin cancel requires a note');
		}
		const [row] = await db
			.select()
			.from(accountDeletion)
			.where(eq(accountDeletion.id, params.id))
			.limit(1);
		if (!row) throw new ComplianceError('not found', 404);
		if (row.cancelledAt || row.executedAt) {
			throw new ComplianceError('already resolved', 409);
		}
		// Cannot be the subject of the cancellation you are approving — keeps
		// admin accountability honest (you can't silently cancel your own request).
		if (row.userId === caller.userId) {
			throw new AuthzError('admins cannot cancel their own deletion');
		}
		await db
			.update(accountDeletion)
			.set({ cancelledAt: new Date() })
			.where(eq(accountDeletion.id, row.id));
		await writeAudit(caller, {
			action: 'compliance.deletion.admin_cancel',
			targetKind: 'user',
			targetId: row.userId,
			metadata: { id: row.id, note: params.note.trim() }
		});
	},

	/**
	 * Hard-delete a past-grace pending row. Relies on `user.id` CASCADE FKs for
	 * profile/session/account/customer/subscription/impersonation/roleAssignment/
	 * accountDeletion itself. Financial + audit records are intentionally NOT
	 * FK'd to user.id and survive as dangling references.
	 *
	 * Guarded: owner-only, row must be past `scheduledFor`, not already resolved,
	 * and the caller cannot execute their own row (same accountability rule as
	 * adminCancel).
	 */
	async executeDeletion(caller: Caller, params: { id: string }): Promise<void> {
		assertRole(caller, 'owner');
		const [row] = await db
			.select()
			.from(accountDeletion)
			.where(eq(accountDeletion.id, params.id))
			.limit(1);
		if (!row) throw new ComplianceError('not found', 404);
		if (row.cancelledAt || row.executedAt) {
			throw new ComplianceError('already resolved', 409);
		}
		if (row.scheduledFor.getTime() > Date.now()) {
			throw new ComplianceError('still in grace window', 409);
		}
		if (row.userId === caller.userId) {
			throw new AuthzError('cannot execute your own account deletion');
		}

		await db.transaction(async (tx) => {
			const updated = await tx
				.update(accountDeletion)
				.set({ executedAt: new Date() })
				.where(and(eq(accountDeletion.id, row.id), isNull(accountDeletion.executedAt)))
				.returning();
			if (updated.length === 0) {
				throw new ComplianceError('row state changed during execution', 409);
			}
			await tx.delete(user).where(eq(user.id, row.userId));
		});

		await writeAudit(caller, {
			action: 'compliance.deletion.execute',
			targetKind: 'user',
			targetId: row.userId,
			metadata: { id: row.id, scheduledFor: row.scheduledFor, reason: row.reason ?? null }
		});
	},

	/**
	 * Pending deletions by the caller's own userId that are still in the grace
	 * window. Surfaced on /account so the user sees the countdown.
	 */
	async pendingForCaller(caller: Caller): Promise<AccountDeletionRow | null> {
		if (!caller.userId) return null;
		const rows = await db
			.select()
			.from(accountDeletion)
			.where(
				and(
					eq(accountDeletion.userId, caller.userId),
					isNull(accountDeletion.cancelledAt),
					isNull(accountDeletion.executedAt),
					gt(accountDeletion.scheduledFor, new Date())
				)
			)
			.limit(1);
		return rows[0] ?? null;
	}
};
