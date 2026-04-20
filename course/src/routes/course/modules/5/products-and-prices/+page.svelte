<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>5.3 Products + prices — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 5 · Stripe fundamentals"
	title="5.3 · Products + prices + lookup keys"
	lede="Create the product once, the prices twice (monthly + yearly), and give each price a lookup key so your code never hardcodes an id."
>
	<section>
		<h2>Create the product</h2>
		<CodeBlock title="terminal" lang="sh">
{`stripe products create \\
  --name "Trade Flex Membership" \\
  --description "Real-time alerts, both courses, macOS companion."`}
		</CodeBlock>
		<p>Response includes <code>id: prod_…</code>. Keep the terminal open; we'll reference it in the next two commands.</p>
	</section>

	<section>
		<h2>Create the prices</h2>
		<CodeBlock lang="sh">
{`# Monthly: $49/mo
stripe prices create \\
  --product prod_xxx \\
  --unit-amount 4900 \\
  --currency usd \\
  -d "recurring[interval]=month" \\
  --lookup-key tradeflex_monthly \\
  --nickname "Membership monthly"

# Yearly: $399/yr (effectively $33/mo)
stripe prices create \\
  --product prod_xxx \\
  --unit-amount 39900 \\
  --currency usd \\
  -d "recurring[interval]=year" \\
  --lookup-key tradeflex_yearly \\
  --nickname "Membership yearly"`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				<strong>Lookup keys are the contract.</strong> Code looks up <code>tradeflex_monthly</code>, not
				<code>price_1Qb…</code>. When you rotate a price (new amount, new terms), you create a new price
				object, swap the lookup key onto it, and every code path Just Works. No redeploy needed.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Verify</h2>
		<CodeBlock lang="sh">
{`stripe prices list --lookup-keys tradeflex_monthly --expand data.product

# Expected: a single price, unit_amount 4900, currency usd, recurring.interval=month,
# product.name="Trade Flex Membership".`}
		</CodeBlock>
		<p>
			Reload <a href="/pricing">/pricing</a>. If your Stripe key is in
			<a href="/admin/settings/integrations">Integrations</a>, the CTAs become real checkout buttons
			pointing at <code>/api/billing/checkout</code> with the live price id.
		</p>
	</section>

	<section>
		<h2>How our code uses this</h2>
		<CodeBlock title="src/lib/server/services/billing.ts" lang="ts">
{`async listPlans(): Promise<PlanSnapshot[]> {
  const prices = await stripe.listActivePrices();
  return prices.map(p => ({
    priceId: p.id,
    productName: /* resolved via expand */,
    interval: p.recurring ? p.recurring.interval : 'one_time',
    amountCents: p.unit_amount ?? 0,
    currency: p.currency.toUpperCase(),
    lookupKey: p.lookup_key,
    nickname: p.nickname
  }));
}`}
		</CodeBlock>
		<p>
			Pricing page then does <code>plans.find(p =&gt; p.lookupKey === 'tradeflex_monthly')</code>.
			Never <code>p.priceId === 'price_1Qb…'</code>.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>One product per offering. One price per billing cadence.</li>
			<li>Lookup keys decouple code from Stripe ids — the whole point.</li>
			<li>Test mode has no quota: create and delete as many products as you need.</li>
		</ul>
		<h3>Next up</h3>
		<p><a href="/course/modules/6/overview">6.1 · Stripe + SvelteKit →</a></p>
	</section>
</CoursePage>
