import { and, desc, isNull, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { webhookDelivery, customer as customerTable } from '$lib/server/db/schema';
import { customersService } from './customers';
import { subscriptionsService, type StripeSubscriptionShape } from './subscriptions';
import { log, reportError } from '$lib/server/log';

interface StripeEvent {
	id: string;
	type: string;
	data?: { object?: Record<string, unknown> };
}

type Handler = (event: StripeEvent) => Promise<void>;

async function handleCheckoutCompleted(event: StripeEvent): Promise<void> {
	const session = event.data?.object as
		| {
				client_reference_id?: string | null;
				customer?: string | null;
				subscription?: string | null;
		  }
		| undefined;
	const userId = session?.client_reference_id ?? undefined;
	const stripeCustomerId = session?.customer ?? undefined;
	if (userId && stripeCustomerId) {
		await customersService.upsertFromStripe(userId, stripeCustomerId, null);
	}
}

async function handleSubscriptionUpsert(event: StripeEvent): Promise<void> {
	const sub = event.data?.object as (StripeSubscriptionShape & { customer?: string }) | undefined;
	if (!sub?.id || !sub.customer) return;

	const rows = await db
		.select()
		.from(customerTable)
		.where(eq(customerTable.stripeCustomerId, sub.customer))
		.limit(1);
	const match = rows[0];
	if (!match) {
		log.warn('subscription.webhook.orphan', {
			stripeSubscriptionId: sub.id,
			stripeCustomerId: sub.customer
		});
		return;
	}
	await subscriptionsService.upsertFromStripe(match.userId, sub, null);
}

const handlers: Record<string, Handler> = {
	'checkout.session.completed': handleCheckoutCompleted,
	'customer.subscription.created': handleSubscriptionUpsert,
	'customer.subscription.updated': handleSubscriptionUpsert,
	'customer.subscription.deleted': handleSubscriptionUpsert,
	'invoice.paid': async () => {
		/* marker — customer.subscription.updated usually follows */
	},
	'invoice.payment_failed': async () => {
		/* grace-period orchestrator lands in Module 9 */
	}
};

export const webhooksService = {
	async drain(maxBatch = 50): Promise<{ processed: number; failed: number }> {
		const pending = await db
			.select()
			.from(webhookDelivery)
			.where(and(isNull(webhookDelivery.processedAt), isNull(webhookDelivery.error)))
			.orderBy(desc(webhookDelivery.receivedAt))
			.limit(maxBatch);

		let processed = 0;
		let failed = 0;
		for (const row of pending) {
			const handler = handlers[row.eventType];
			if (!handler) {
				await db
					.update(webhookDelivery)
					.set({ processedAt: new Date() })
					.where(eq(webhookDelivery.id, row.id));
				processed++;
				continue;
			}
			try {
				await handler(row.payload as unknown as StripeEvent);
				await db
					.update(webhookDelivery)
					.set({ processedAt: new Date() })
					.where(eq(webhookDelivery.id, row.id));
				processed++;
			} catch (err) {
				reportError(err, { webhookDeliveryId: row.id, eventType: row.eventType });
				await db
					.update(webhookDelivery)
					.set({ error: err instanceof Error ? err.message : String(err) })
					.where(eq(webhookDelivery.id, row.id));
				failed++;
			}
		}
		return { processed, failed };
	}
};
