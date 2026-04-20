import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { subscription } from '$lib/server/db/schema';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export type SubscriptionRow = typeof subscription.$inferSelect;

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export interface StripeSubscriptionShape {
	id: string;
	status: string;
	current_period_end?: number;
	cancel_at_period_end?: boolean;
	items?: { data?: Array<{ price?: { id?: string; lookup_key?: string | null } }> };
}

export const subscriptionsService = {
	async forCaller(caller: Caller): Promise<SubscriptionRow | null> {
		assertAuthenticated(caller);
		const rows = await db
			.select()
			.from(subscription)
			.where(eq(subscription.userId, caller.userId))
			.orderBy(desc(subscription.updatedAt))
			.limit(1);
		return rows[0] ?? null;
	},

	async hasActiveEntitlement(caller: Caller): Promise<boolean> {
		if (!caller.userId) return false;
		const sub = await this.forCaller(caller);
		if (!sub) return false;
		if (ACTIVE_STATUSES.has(sub.status)) return true;
		if (sub.graceUntil && sub.graceUntil > new Date()) return true;
		return false;
	},

	async upsertFromStripe(
		userId: string,
		data: StripeSubscriptionShape,
		actor: Caller | null
	): Promise<void> {
		const price = data.items?.data?.[0]?.price;
		const periodEnd = data.current_period_end
			? new Date(data.current_period_end * 1000)
			: null;

		await db
			.insert(subscription)
			.values({
				id: crypto.randomUUID(),
				userId,
				stripeSubscriptionId: data.id,
				status: data.status,
				priceLookupKey: price?.lookup_key ?? null,
				priceId: price?.id ?? null,
				currentPeriodEnd: periodEnd,
				cancelAtPeriodEnd: data.cancel_at_period_end ?? false
			})
			.onConflictDoUpdate({
				target: subscription.stripeSubscriptionId,
				set: {
					status: data.status,
					priceLookupKey: price?.lookup_key ?? null,
					priceId: price?.id ?? null,
					currentPeriodEnd: periodEnd,
					cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
					updatedAt: new Date()
				}
			});

		if (actor) {
			await writeAudit(actor, {
				action: 'subscription.sync',
				targetKind: 'subscription',
				targetId: data.id,
				metadata: { status: data.status, priceLookupKey: price?.lookup_key ?? null }
			});
		}
	},

	async grantGrace(caller: Caller, subscriptionId: string, days: number): Promise<void> {
		assertAuthenticated(caller);
		const graceUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
		await db
			.update(subscription)
			.set({ graceUntil, updatedAt: new Date() })
			.where(
				and(
					eq(subscription.stripeSubscriptionId, subscriptionId),
					eq(subscription.userId, caller.userId)
				)
			);
		await writeAudit(caller, {
			action: 'subscription.grace',
			targetKind: 'subscription',
			targetId: subscriptionId,
			metadata: { days }
		});
	},

	async adminGrantGrace(
		actor: Caller,
		stripeSubscriptionId: string,
		days: number
	): Promise<void> {
		assertAuthenticated(actor);
		const graceUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
		await db
			.update(subscription)
			.set({ graceUntil, updatedAt: new Date() })
			.where(eq(subscription.stripeSubscriptionId, stripeSubscriptionId));
		await writeAudit(actor, {
			action: 'subscription.grace.admin',
			targetKind: 'subscription',
			targetId: stripeSubscriptionId,
			metadata: { days }
		});
	}
};
