import type { PageServerLoad, Actions } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import { settingsService } from '$lib/server/services/settings';
import { subscriptionsService } from '$lib/server/services/subscriptions';
import { db } from '$lib/server/db';
import { subscription, user } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

const STATUS_ORDER = ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'];

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'finance', 'support', 'analyst');
	const stripeKey = await settingsService.get('STRIPE_SECRET_KEY');

	const rows = await db
		.select({
			id: subscription.id,
			stripeSubscriptionId: subscription.stripeSubscriptionId,
			status: subscription.status,
			priceLookupKey: subscription.priceLookupKey,
			priceId: subscription.priceId,
			currentPeriodEnd: subscription.currentPeriodEnd,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
			graceUntil: subscription.graceUntil,
			updatedAt: subscription.updatedAt,
			userId: subscription.userId,
			userEmail: user.email
		})
		.from(subscription)
		.leftJoin(user, eq(user.id, subscription.userId))
		.orderBy(desc(subscription.updatedAt))
		.limit(200);

	const counts = rows.reduce<Record<string, number>>((acc, r) => {
		acc[r.status] = (acc[r.status] ?? 0) + 1;
		return acc;
	}, {});
	const summary = STATUS_ORDER.filter((s) => counts[s]).map((s) => ({
		status: s,
		count: counts[s]
	}));

	return { stripeConfigured: Boolean(stripeKey), rows, summary };
};

export const actions: Actions = {
	grantGrace: async ({ request, locals }) => {
		assertRole(locals.caller, 'owner', 'admin', 'finance');
		const fd = await request.formData();
		const subId = fd.get('stripeSubscriptionId')?.toString() ?? '';
		const days = Number(fd.get('days') ?? 7);
		if (!subId || !Number.isFinite(days) || days <= 0) {
			return fail(400, { message: 'stripeSubscriptionId and days (positive) are required.' });
		}
		try {
			await subscriptionsService.adminGrantGrace(locals.caller, subId, days);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to grant grace.';
			return fail(400, { message: msg });
		}
		return { success: true, subId, days };
	}
};
