<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>5.1 Overview — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 5 · Stripe fundamentals"
	title="5.1 · Overview"
	lede="Before a line of checkout code, pin down the ten Stripe terms you'll type a hundred times. Every later module builds on these."
>
	<section>
		<h2>The ten terms</h2>
		<dl class="terms">
			<dt>Account</dt><dd>Your Stripe company. Has a test mode and a live mode. Everything you do in test mode is free and doesn't send real email.</dd>
			<dt>Product</dt><dd>The thing you sell ("Trade Flex Membership"). Has a name, description, images. Prices hang off a product.</dd>
			<dt>Price</dt><dd>How much the product costs, with which currency, billed how (once, monthly, yearly). <strong>Code references prices, not products.</strong></dd>
			<dt>Lookup key</dt><dd>A stable string you set on a price ("tradeflex_monthly") so your code doesn't hardcode the auto-generated <code>price_…</code> id.</dd>
			<dt>Customer</dt><dd>A stored payment method attached to an email. One customer per member.</dd>
			<dt>Checkout Session</dt><dd>A short-lived URL where Stripe collects card details + creates the subscription. You redirect to it; Stripe redirects back.</dd>
			<dt>Subscription</dt><dd>The recurring billing record — status transitions through <code>trialing</code>, <code>active</code>, <code>past_due</code>, <code>canceled</code>.</dd>
			<dt>Invoice</dt><dd>A bill. Subscriptions auto-generate one per billing cycle. Refunds attach to invoices.</dd>
			<dt>Event</dt><dd>A webhook payload Stripe sends when anything happens (<code>checkout.session.completed</code>, <code>invoice.paid</code>, etc.). Idempotent by <code>event.id</code>.</dd>
			<dt>Customer Portal</dt><dd>Stripe-hosted page where members manage their own subscription — cancel, update card, switch plan. One API call to open it.</dd>
		</dl>
	</section>

	<section>
		<h2>What Modules 5–9 ship</h2>
		<ul>
			<li><strong>5:</strong> Account setup, CLI, products, prices, lookup keys. No code.</li>
			<li><strong>6:</strong> Minimal Stripe REST client, webhook endpoint with HMAC verification.</li>
			<li><strong>7:</strong> Billing service (checkout, portal, subscription sync), webhook dispatch.</li>
			<li><strong>8:</strong> Pricing page reads from Stripe via lookup keys.</li>
			<li><strong>9:</strong> Both trial flavors, test clocks, portal from /account.</li>
		</ul>
	</section>

	<section>
		<Aside type="tip">
			<p>
				We avoid the <code>stripe</code> npm SDK and call the REST API via <code>fetch</code>. Reasons:
				one less dependency to trust, the same code runs on edge runtimes that don't ship Node crypto,
				and the surface we need is tiny (5 endpoints). Ship the SDK if you ever need Payment Intents
				or multi-party marketplaces — not for a membership.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Product = what it is. Price = how it's billed. Code references prices by <em>lookup key</em>.</li>
			<li>Customer Portal solves cancel/update-card for free — don't build those screens yourself.</li>
			<li>Webhooks are idempotent on <code>event.id</code>. Store then process.</li>
		</ul>
		<h3>Next up</h3>
		<p><a href="/course/modules/5/dashboard-and-cli">5.2 · Dashboard + CLI →</a></p>
	</section>
</CoursePage>

<style>
	.terms {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: var(--space-2) var(--space-4);
		margin: 0;
	}
	.terms dt {
		font-family: var(--ff-mono);
		font-weight: 600;
		color: var(--color-text);
	}
	.terms dd {
		margin: 0;
		color: var(--color-text-muted);
	}
	@media (max-width: 600px) {
		.terms {
			grid-template-columns: 1fr;
		}
		.terms dd {
			margin-bottom: var(--space-2);
		}
	}
</style>
