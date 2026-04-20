<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>7.3 Grace period — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 7 · Billing services"
	title="7.3 · Grace period — how a failed charge becomes a second chance, not a logout"
	lede="Cards fail for a hundred boring reasons — expiry, address change, issuer fraud rules. The move is never a hard cut-off. Extend access by N days, nudge the user, and let Stripe's retry schedule do the heavy lifting. One timestamp column, one branch in the entitlement function."
>
	<section>
		<h2>The shape of the problem</h2>
		<p>
			When <code>invoice.payment_failed</code> arrives, Stripe has already queued a retry (default
			1 / 3 / 5 / 7 days, up to 21). The subscription status is still <code>past_due</code>, not
			<code>canceled</code>. Cutting access immediately means a user whose card just expired is locked
			out while their next charge is scheduled for tomorrow.
		</p>
		<Aside type="tip">
			<p>
				The default retry window is <strong>21 days</strong>. A 7-day grace period is generous
				enough to cover every realistic re-auth and short enough that you don't bleed a month's
				revenue to every bad card.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The column</h2>
		<CodeBlock title="src/lib/server/db/schema.ts" lang="ts">
			{`export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),                         // sub_...
  userId: uuid('user_id').notNull().references(() => user.id),
  status: text('status').notNull(),                    // active | past_due | canceled | ...
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  graceUntil: timestamp('grace_until', { withTimezone: true }),    // null when healthy
  priceId: text('price_id').notNull()
});`}
		</CodeBlock>
		<p>
			<code>graceUntil</code> is nullable by design — a healthy subscription simply has no grace
			timestamp. Once we set it, it decides everything downstream until the next
			<code>invoice.paid</code> event clears it.
		</p>
	</section>

	<section>
		<h2>The event handlers</h2>
		<p>Two handlers, one column. Everything else derives from these.</p>
		<CodeBlock title="src/lib/server/billing/events.ts" lang="ts">
			{`const GRACE_DAYS = 7;

export async function onInvoicePaymentFailed(event) {
  const sub = event.data.object.subscription;
  const graceUntil = new Date(Date.now() + GRACE_DAYS * 86_400_000);
  await db
    .update(subscription)
    .set({ status: 'past_due', graceUntil })
    .where(eq(subscription.id, sub));
  await notify.paymentFailed(sub, { graceUntil });
}

export async function onInvoicePaid(event) {
  const sub = event.data.object.subscription;
  await db
    .update(subscription)
    .set({ status: 'active', graceUntil: null })
    .where(eq(subscription.id, sub));
}`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				Don't roll your own retry. Stripe retries <em>and</em> emails the user through Smart Retries
				and recovery emails. Your job is only to keep access open while Stripe works. Duplicating
				the retry logic is where this feature goes from "one column" to "a system."
			</p>
		</Aside>
	</section>

	<section>
		<h2>The entitlement function</h2>
		<p>
			One function, two branches, used by every gate. Page guards, endpoint guards, UI hints — they
			all read from this and nothing else.
		</p>
		<CodeBlock title="src/lib/server/billing/entitlement.ts" lang="ts">
			{`export type Entitlement =
  | { ok: true; tier: 'monthly' | 'yearly'; expiresAt: Date }
  | { ok: false; reason: 'none' | 'expired' };

export async function entitlementFor(userId: string): Promise<Entitlement> {
  const sub = await findActiveSubscription(userId);
  if (!sub) return { ok: false, reason: 'none' };

  const now = new Date();
  if (sub.status === 'active' && sub.currentPeriodEnd > now) {
    return { ok: true, tier: tierFor(sub.priceId), expiresAt: sub.currentPeriodEnd };
  }
  if (sub.status === 'past_due' && sub.graceUntil && sub.graceUntil > now) {
    return { ok: true, tier: tierFor(sub.priceId), expiresAt: sub.graceUntil };
  }
  return { ok: false, reason: 'expired' };
}`}
		</CodeBlock>
		<p>
			Notice what's <em>not</em> here: no UI copy, no logging, no email trigger. Entitlement answers
			one question (does this user have access, and until when) so that every caller can decide what
			to do about a denial in its own context.
		</p>
	</section>

	<section>
		<h2>Surface it in the UI</h2>
		<p>
			When <code>graceUntil</code> is set, <code>/account</code> should show a calm banner —
			not a red alarm. Users whose card expired don't want to be yelled at; they want a clear
			next step.
		</p>
		<CodeBlock title="src/routes/account/+page.svelte (excerpt)" lang="svelte">
			{`{#if data.subscription.graceUntil}
  <section class="grace-banner" role="status">
    <h3>Your payment didn't go through</h3>
    <p>
      We're retrying your card automatically. Your access continues through
      <time datetime={data.subscription.graceUntil.toISOString()}>
        {formatDate(data.subscription.graceUntil)}
      </time>.
    </p>
    <form method="post" action="?/openPortal">
      <button class="btn-primary">Update payment method</button>
    </form>
  </section>
{/if}`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				One button. Opening the Stripe Customer Portal gives the user card-update, tax-id edit, and
				receipt history in one place — no custom form, no PAN in your app, no PCI scope creep.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Verify with a test clock</h2>
		<p>
			Stripe test clocks let you advance time in a sandbox. Ten minutes of real time = 30 days of
			simulated billing. Enough to replay a complete 21-day dunning cycle during your lunch.
		</p>
		<CodeBlock title="bash" lang="bash">
			{`# Create a test clock + customer on that clock
stripe test_helpers test_clocks create --frozen-time $(date +%s)
stripe customers create --test-clock tclk_...

# Attach a card that will fail:
stripe payment_methods attach pm_card_chargeCustomerFail --customer cus_...

# Create the subscription, then advance the clock past the billing date:
stripe test_helpers test_clocks advance --frozen-time $(date -v+1d +%s) tclk_...

# invoice.payment_failed fires. Check your DB:
psql $DATABASE_URL -c "select status, grace_until from subscription where id = 'sub_...'"

# Attach a working card + advance again:
stripe payment_methods attach pm_card_visa --customer cus_...
stripe test_helpers test_clocks advance --frozen-time $(date -v+2d +%s) tclk_...

# invoice.paid fires. grace_until back to null, status back to active.`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				<strong>One column, <code>grace_until</code>.</strong> Null when healthy, timestamp when
				dunning.
			</li>
			<li>
				<strong>Two event handlers.</strong>
				<code>invoice.payment_failed</code> sets it; <code>invoice.paid</code> clears it.
			</li>
			<li>
				<strong>One entitlement function.</strong> Every gate — pages, endpoints, UI — asks it, no
				one else.
			</li>
			<li>
				<strong>The UI is a status message, not an alert.</strong> Card failures are a normal event
				for long-lived subscriptions.
			</li>
			<li>
				<strong>Test clocks replay the whole cycle in ten minutes.</strong> Run this before ship, not
				after.
			</li>
		</ul>
	</section>
</CoursePage>
