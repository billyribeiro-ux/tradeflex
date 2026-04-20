<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>7.1 Billing services — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 7 · Billing services"
	title="7.1 · Billing services"
	lede="Module 6 received webhook events; Module 7 turns them into first-class state our app can reason about: customers, subscriptions, grace periods, and a one-click portal session."
>
	<section>
		<h2>New tables</h2>
		<CodeBlock title="src/lib/server/db/schema.ts" lang="ts">
{`export const customer = pgTable('customer', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  status: text('status').notNull(),            // trialing, active, past_due, canceled
  priceLookupKey: text('price_lookup_key'),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  graceUntil: timestamp('grace_until'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>The webhook dispatcher</h2>
		<p>
			Module 6 stored every event in <code>webhook_delivery</code>. Module 7 adds a small dispatcher
			that reads unprocessed rows, fans them out to handlers, and stamps <code>processedAt</code> on
			success or <code>error</code> on failure.
		</p>
		<CodeBlock title="src/lib/server/services/webhooks.ts" lang="ts">
{`const handlers: Record<string, (event: StripeEvent) => Promise<void>> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'customer.subscription.created': handleSubscriptionUpsert,
  'customer.subscription.updated': handleSubscriptionUpsert,
  'customer.subscription.deleted': handleSubscriptionCanceled,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoiceFailed
};

export async function drainWebhookDeliveries() {
  const pending = await db.select().from(webhookDelivery)
    .where(and(isNull(webhookDelivery.processedAt), isNull(webhookDelivery.error)))
    .limit(50);

  for (const row of pending) {
    const handler = handlers[row.eventType];
    if (!handler) { await markProcessed(row.id); continue; }
    try {
      await handler(row.payload as StripeEvent);
      await markProcessed(row.id);
    } catch (err) {
      await markErrored(row.id, String(err));
    }
  }
}`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Why a separate dispatcher? Because Stripe's retry timing is measured in minutes, our
				failures should never break the 200 we return from the webhook endpoint. Split
				acknowledgement (fast, always 200) from processing (idempotent, retriable).
			</p>
		</Aside>
	</section>

	<section>
		<h2>Grace periods, the human touch</h2>
		<p>
			When <code>invoice.payment_failed</code> fires, Stripe retries for ~21 days. During that window
			we don't revoke access immediately — we write <code>graceUntil = now + 7 days</code> and surface
			a gentle banner on <code>/account</code>. If the retry eventually succeeds, the banner clears.
			If not, the grace window expires and entitlement flips off.
		</p>
	</section>

	<section>
		<h2>Customer Portal</h2>
		<CodeBlock title="entry point" lang="ts">
{`// /account/+page.server.ts action
export const actions = {
  portal: async ({ locals, url }) => {
    const customer = await customersService.forCaller(locals.caller);
    if (!customer) return fail(400, { error: 'no stripe customer yet' });
    const portalUrl = await billingService.openPortal(locals.caller, {
      customerId: customer.stripeCustomerId,
      returnUrl: \`\${url.origin}/account\`
    });
    throw redirect(303, portalUrl);
  }
};`}
		</CodeBlock>
		<p>
			One action. Stripe hosts cancel + card update + plan switch + invoice download. We never build
			those screens — they are Stripe's job.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Two tables: <code>customer</code> and <code>subscription</code>. That's it.</li>
			<li>Webhook endpoint acks fast, stores; dispatcher processes.</li>
			<li>Grace periods absorb retries; entitlement only flips at the grace edge.</li>
			<li>Portal is one call. Don't build your own cancel screen.</li>
		</ul>
	</section>
</CoursePage>
