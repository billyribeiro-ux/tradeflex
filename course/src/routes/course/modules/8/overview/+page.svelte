<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>8.1 Products + pricing page — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 8 · Products + pricing page"
	title="8.1 · Products + pricing page"
	lede="The pricing page is where your funnel crystallises. One source of truth for amounts (Stripe), a graceful fallback when Stripe is unreachable, and a month/year toggle that doesn't lie about the savings."
>
	<section>
		<h2>Why Stripe is the source of truth</h2>
		<p>
			Hard-coding prices in code means your pricing page ships out-of-sync the moment Finance
			changes a plan. The fix: read from Stripe at request time, cache by lookup key, fall back to a
			static snapshot only if Stripe is unreachable.
		</p>
		<Aside type="tip">
			<p>
				<strong>Lookup keys, not price IDs, in your code.</strong> Price IDs change when you archive
				and re-create a price. Lookup keys are stable strings you assign (<code
					>tradeflex_monthly</code
				>, <code>tradeflex_yearly</code>) — rotate prices behind them without touching the frontend.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Server load</h2>
		<CodeBlock title="src/routes/(marketing)/pricing/+page.server.ts" lang="ts">
			{`export const load: PageServerLoad = async ({ url }) => {
  const gate = url.searchParams.get('gate');
  const livePlans = await billingService.listPlans();
  const monthly = livePlans.find((p) => p.lookupKey === 'tradeflex_monthly');
  const yearly  = livePlans.find((p) => p.lookupKey === 'tradeflex_yearly');
  const source: 'stripe' | 'static-snapshot' =
    monthly && yearly ? 'stripe' : 'static-snapshot';

  const plans: PlanCard[] = [
    { id: 'free',    /* always static */                                },
    { id: 'monthly', priceMonthly: monthly ? toDollars(monthly.amountCents) : 49,  /* … */ },
    { id: 'yearly',  priceYearly:  yearly  ? toDollars(yearly.amountCents)  : 399, /* … */ }
  ];
  return { plans, source, gate };
};`}
		</CodeBlock>
		<p>
			If <code>STRIPE_SECRET_KEY</code> isn't set yet (fresh install), <code>listPlans</code>
			returns
			<code>[]</code> without throwing, and the static snapshot wins. The page still renders; only the
			data source changes.
		</p>
	</section>

	<section>
		<h2>Month ↔ year toggle</h2>
		<p>
			The toggle should switch which card is "featured" and the visible price; it must not
			<em>lie</em> about savings. Compute the actual savings from the two real amounts, not a marketing
			round number.
		</p>
		<CodeBlock title="+page.svelte" lang="svelte">
			{`let billing = $state<'month' | 'year'>('year');

const monthlyAmt = $derived(data.plans.find(p => p.id === 'monthly')?.priceMonthly ?? 0);
const yearlyAmt  = $derived(data.plans.find(p => p.id === 'yearly')?.priceYearly ?? 0);
const savings    = $derived(Math.max(0, monthlyAmt * 12 - yearlyAmt));`}
		</CodeBlock>
	</section>

	<section>
		<h2>Form POST into checkout</h2>
		<p>
			The "Start monthly" / "Start yearly" button is a <code>&lt;form method="post"&gt;</code> that
			targets <code>/api/billing/checkout</code> with <code>priceId</code> in the body. The endpoint creates
			a Checkout Session and redirects (303) to Stripe. No client JS needed to start the purchase.
		</p>
		<CodeBlock title="+page.svelte" lang="svelte">
			{`{#if plan.cta.priceId && plan.cta.href === '/api/billing/checkout'}
  <form method="post" action="/api/billing/checkout">
    <input type="hidden" name="priceId" value={plan.cta.priceId} />
    <button class="btn-primary" type="submit">{plan.cta.label}</button>
  </form>
{:else}
  <a class="btn-primary" href={plan.cta.href}>{plan.cta.label}</a>
{/if}`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Progressive enhancement: the form works with JS disabled. With JS on, wrap it in
				<code>use:enhance</code> and intercept the JSON variant to show a loading state. Either way, the
				Stripe redirect is authoritative.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The "gate" banner</h2>
		<p>
			When a non-member bounces off <code>/alerts</code>, we redirect them to
			<code>/pricing?gate=alerts</code>. The <code>gate</code> search param gets surfaced as a banner
			at the top of the page: "Alerts are members-only — pick a plan below." It's a one-line check that
			turns a 403 into a funnel.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Read Stripe; fall back to static. Never hard-code prices in JS.</li>
			<li>Reference prices by lookup key, not ID.</li>
			<li>Toggle the card, not the truth. Savings come from the real numbers.</li>
			<li>Form post + 303 redirect = JS-optional purchase flow.</li>
			<li>Reuse the gate URL to convert denied access into a pricing view.</li>
		</ul>
	</section>
</CoursePage>
