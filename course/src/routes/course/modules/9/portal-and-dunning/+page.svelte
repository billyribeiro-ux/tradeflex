<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>9.2 Customer portal + dunning — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 9 · Pricing, checkout, billing"
	title="9.2 · Customer portal + dunning"
	lede="Once a subscription exists, self-service is non-negotiable. Stripe's Customer Portal gives you cancel/update/invoice history for free — but dunning is where your code actually has to do work."
>
	<section>
		<h2>The portal in ten seconds</h2>
		<p>
			A Stripe-hosted page where a logged-in customer can update card, cancel, switch plan, and
			download invoices. You never render any of that yourself; you just mint a short-lived portal
			session and redirect to its <code>url</code>. When they're done, Stripe sends them back to
			your <code>return_url</code>.
		</p>
		<CodeBlock title="Account page — Manage button" lang="svelte">
			{'<' +
				`script lang="ts">
  import { enhance } from '$app/forms';
</` +
				`script>

<form method="post" action="?/portal" use:enhance>
  <button class="btn-primary">Manage billing</button>
</form>`}
		</CodeBlock>
		<p>
			The form POSTs to the <code>portal</code> action we added in
			<code>/account/+page.server.ts</code>. That action resolves the customer row for the caller,
			calls <code>billingService.openPortal()</code>, and <code>throw redirect(303, url)</code>.
			Three lines of route handler, zero UI code.
		</p>
	</section>

	<section>
		<h2>What dunning means</h2>
		<p>
			Dunning is the collection cycle Stripe runs when a recurring invoice fails to charge. By
			default Stripe retries the card four times over three weeks; if all four retries fail, the
			subscription moves to <code>unpaid</code> or <code>canceled</code> depending on your
			<em>Smart Retries</em>
			settings. Your job during that window: keep the user's access intact on the first failure, warn
			them, and cut access cleanly when Stripe gives up.
		</p>
		<Aside type="tip">
			<p>
				Do not cut access on the first <code>invoice.payment_failed</code>. That event fires every
				retry. If you cancel on the first one, users get locked out despite Stripe still trying to
				charge them — which looks like a bug to them and costs you recoverable revenue.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The grace-until pattern</h2>
		<p>
			Store a <code>grace_until</code> timestamp on the subscription row. On the first failed
			invoice, set it to <code>now + 7 days</code>. The entitlement check treats
			<code>status === 'past_due' &amp;&amp; grace_until &gt; now</code>
			as entitled. When Stripe eventually fires <code>customer.subscription.deleted</code> (or
			<code>status</code>
			becomes <code>unpaid</code>), you clear the grace and the gate flips on the next request.
		</p>
		<CodeBlock title="src/lib/server/services/subscriptions.ts (excerpt)" lang="ts">
			{`async hasActiveEntitlement(caller: Caller): Promise<boolean> {
  assertAuthenticated(caller);
  const sub = await this.forCaller(caller);
  if (!sub) return false;
  if (sub.status === 'active' || sub.status === 'trialing') return true;
  if (sub.graceUntil && sub.graceUntil > new Date()) return true;
  return false;
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>Replaying a dunning cycle in 30 seconds</h2>
		<p>
			Module 9.1 introduced test clocks. They pay rent again here: you can simulate a full 21-day
			retry cycle in under a minute.
		</p>
		<CodeBlock title="Terminal" lang="bash">
			{`# Create a clock frozen at today
CLOCK=$(stripe test_helpers test_clocks create --frozen-time $(date +%s) --query id)

# Create a customer + subscription attached to that clock
# (with an intentionally-failing test card like 4000000000000341)

# Advance 3 days — first retry
stripe test_helpers test_clocks advance "$CLOCK" --frozen-time $(($(date +%s) + 3*86400))

# Advance 21 days total — Stripe gives up, fires customer.subscription.deleted
stripe test_helpers test_clocks advance "$CLOCK" --frozen-time $(($(date +%s) + 21*86400))`}
		</CodeBlock>
		<p>
			Your webhook handler runs the entire cycle in order, in real time. Every
			<code>invoice.payment_failed</code>, every <code>customer.subscription.updated</code>, finally
			a <code>customer.subscription.deleted</code>. If your grace logic is right, the entitlement
			flip at the end should line up with the final event.
		</p>
	</section>

	<section>
		<h2>What customer-visible communication looks like</h2>
		<ul>
			<li>
				<strong>First failure.</strong> Email: "We couldn't charge your card — we'll keep trying for
				a week. <a href="/account">Update your card</a>." Banner on the dashboard with the same
				message and a grace countdown.
			</li>
			<li>
				<strong>Final failure.</strong> Email: "Your subscription has been canceled because the card
				on file failed. <a href="/pricing">Resubscribe any time</a>." Banner gone; alerts redirect
				to pricing.
			</li>
		</ul>
		<p>
			Both emails are dispatched from the webhook handler in response to Stripe events — not from a
			cron job — so they're immediate and traceable to the exact event that triggered them.
		</p>
	</section>

	<section>
		<h2>What's next</h2>
		<p>
			Module 10 covers tier-based access control — the gate we've been alluding to throughout this
			module — and why the service layer stays tier-blind while the routes do all the redirecting.
		</p>
	</section>
</CoursePage>
