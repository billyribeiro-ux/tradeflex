<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>9.1 Trials + test clocks — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 9 · Pricing, checkout, billing"
	title="9.1 · Trials + test clocks"
	lede="Stripe Checkout supports two trial flavors out of the box: card-upfront (lower abuse) and no-card (higher conversion). Test clocks let you simulate weeks of subscription life in seconds."
>
	<section>
		<h2>The two trial flavors</h2>
		<ul>
			<li>
				<strong>Card upfront, 14 days.</strong> User enters a card now; no charge until day 14. Fewer
				free-riders, a trained credit-card instinct, and Stripe's fraud signals kick in immediately.
			</li>
			<li>
				<strong>No card, 7 days.</strong> User creates an account, gets 7 days of access with no card
				on file. Day 7 we prompt for payment — if they don't enter one, access expires. Highest top-of-funnel
				conversion; lowest end-of-trial conversion. Use for cold traffic.
			</li>
		</ul>
		<Aside type="tip">
			<p>
				Don't offer both to the same segment. Pick one per channel and measure. "Should I offer
				both" is a bikeshed; "which one converts my paid Google traffic" is the real question.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Card-upfront trial — one parameter</h2>
		<p>
			Checkout Sessions accept <code>subscription_data[trial_period_days]</code>. Our
			<code>billingService.startCheckout</code> wraps it.
		</p>
		<CodeBlock title="src/routes/api/billing/checkout/+server.ts" lang="ts">
			{`const schema = z.object({
  priceId: z.string().min(1),
  trial: z.enum(['none', 'card_upfront', 'no_card']).optional().default('none')
});
// …
const trialDays =
  parsed.data.trial === 'card_upfront' ? 14
  : parsed.data.trial === 'no_card' ? 7
  : undefined;
checkoutUrl = await billingService.startCheckout(locals.caller, {
  priceId: parsed.data.priceId,
  successUrl: \`\${url.origin}/account?checkout=success\`,
  cancelUrl: \`\${url.origin}/pricing?checkout=canceled\`,
  email: locals.user?.email,
  trialDays
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>No-card trial — deferred card</h2>
		<p>
			For the no-card flavor, create the subscription with <code
				>payment_behavior='default_incomplete'</code
			>
			and <code>trial_period_days=7</code>, mark it as needing a card, and watch for
			<code>customer.subscription.updated</code> on day 7 with status <code>incomplete</code>.
			Prompt the user to add a card from <code>/account</code>; a <code>SetupIntent</code> collects
			the card and the subscription activates on the next <code>invoice.paid</code>.
		</p>
		<Aside type="tip">
			<p>
				The no-card flavor is more code but the pattern is the same: webhooks drive state, the UI
				reads <code>subscription.status</code>, and the entitlement rule already covers
				<code>trialing</code>. You don't rewrite entitlements — you extend checkout.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Test clocks</h2>
		<p>
			A test clock is a Stripe-hosted simulated clock attached to a test-mode customer. You create
			one, attach a customer to it, start their subscription, then advance the clock to simulate "14
			days later" — Stripe fires real webhook events against your endpoint as if time had passed.
		</p>
		<CodeBlock title="stripe CLI — cycle a trial end" lang="bash">
			{`# 1. Create a clock
stripe test_helpers/test_clocks create \\
  --name "trial_e2e" --frozen_time $(date +%s)

# 2. Create a customer attached to it
stripe customers create \\
  --test_clock clock_XXX \\
  --email trial@test.local

# 3. Check out with trial_period_days=14 and priceId
# (use the checkout URL your app returns, NOT the CLI)

# 4. Advance 15 days
stripe test_helpers/test_clocks advance \\
  clock_XXX --frozen_time $(date -v+15d +%s)

# 5. Watch events stream; confirm your webhook drains them
stripe listen --forward-to localhost:5173/api/stripe/webhook`}
		</CodeBlock>
	</section>

	<section>
		<h2>What to test with a clock</h2>
		<ul>
			<li>
				Trial-to-paid conversion: card charges on day 14, status flips <code>trialing → active</code
				>.
			</li>
			<li>Trial-with-no-card expiration: status flips <code>trialing → incomplete</code>.</li>
			<li>Proration on plan switch mid-period.</li>
			<li>Retry schedule on <code>invoice.payment_failed</code>: 3 attempts over ~21 days.</li>
			<li>
				Cancel at period end: status stays <code>active</code> until
				<code>current_period_end</code>, then flips <code>canceled</code>.
			</li>
		</ul>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Two trial flavors, one parameter in the Checkout Session.</li>
			<li>Entitlement rule already handles <code>trialing</code>; no extra code.</li>
			<li>Test clocks compress a 21-day dunning cycle into a 30-second test.</li>
			<li>If you can't replay the lifecycle in test, you can't trust it in prod.</li>
		</ul>
	</section>
</CoursePage>
