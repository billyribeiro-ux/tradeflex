import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { webhookDelivery } from '$lib/server/db/schema';
import { assertRole } from '$lib/server/authz/caller';
import { settingsService } from '$lib/server/services/settings';

export const load: PageServerLoad = async ({ locals, url }) => {
	assertRole(locals.caller, 'owner', 'admin', 'finance', 'analyst', 'support');
	const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
	const pageSize = 100;
	const events = await db
		.select()
		.from(webhookDelivery)
		.orderBy(desc(webhookDelivery.receivedAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);
	const stripeConfigured = Boolean(await settingsService.get('STRIPE_SECRET_KEY'));
	const webhookConfigured = Boolean(await settingsService.get('STRIPE_WEBHOOK_SECRET'));
	return { events, page, pageSize, stripeConfigured, webhookConfigured };
};
