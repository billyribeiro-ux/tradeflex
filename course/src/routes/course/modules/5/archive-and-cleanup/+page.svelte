<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>5.4 Archive + cleanup — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 5 · Stripe fundamentals"
	title="5.4 · Archive + cleanup — prices are forever, but not everywhere"
	lede="Stripe prices can't be deleted, only archived. That one detail decides how you roll price changes: never edit, always create a new price behind the same lookup key, then archive the old one."
>
	<section>
		<h2>Why prices are immutable</h2>
		<p>
			A price that has ever been attached to a subscription is part of accounting history. Stripe
			locks its <code>unit_amount</code> forever so historical invoices, receipts, and refunds stay
			accurate. "Update this price" is not a real operation; you <em>must</em> create a new one.
		</p>
		<Aside type="tip">
			<p>
				Lookup keys are the indirection that makes this manageable. Your code references
				<code>tradeflex_monthly</code>; the <em>actual</em> price behind that key gets rotated underneath.
				No deploy, no downtime.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The rotation dance</h2>
		<ol>
			<li>Create the new price with the same <code>lookup_key</code> as the old one.</li>
			<li>Archive the old price (<code>active=false</code>).</li>
			<li>
				Stripe atomically moves the lookup key to the new price (a lookup key can only attach to one
				active price at a time).
			</li>
		</ol>
		<CodeBlock title="bash" lang="bash">
			{`# Inspect the current state
stripe prices list --lookup-keys tradeflex_monthly

# Create the new price. --transfer-lookup-keys claims the key atomically.
stripe prices create \\
  --product prod_... \\
  --unit-amount 5900 \\
  --currency usd \\
  --recurring '{"interval":"month"}' \\
  --lookup-key tradeflex_monthly \\
  --transfer-lookup-keys

# Archive the old one
stripe prices update price_OLD_ID --active=false`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				<code>--transfer-lookup-keys</code> is the whole trick. Without it, the create call fails with
				"lookup_key already in use." With it, Stripe reassigns the key to the new price in the same call
				— no window of ambiguity.
			</p>
		</Aside>
	</section>

	<section>
		<h2>What happens to existing subscriptions</h2>
		<p>
			<strong>Nothing, immediately.</strong> A subscription is attached to a price by ID, not by lookup
			key. Rotating the key doesn't change what existing subs pay at renewal. They keep paying the old
			price until you explicitly migrate them — or until Stripe bills the next period, where you can opt
			them into the new price via a subscription update with proration.
		</p>
		<CodeBlock title="bash" lang="bash">
			{`# Migrate a single subscription to the new price at next renewal, no proration:
stripe subscriptions update sub_... \\
  --items '[{"id":"si_...","price":"price_NEW_ID"}]' \\
  --proration-behavior=none

# Or bulk-migrate everyone on the old price:
stripe subscriptions list --price=price_OLD_ID --limit=100 \\
  | jq -r '.data[].id' \\
  | xargs -I {} stripe subscriptions update {} \\
      --items "[{\\"id\\":\\"si_...\\",\\"price\\":\\"price_NEW_ID\\"}]" \\
      --proration-behavior=none`}
		</CodeBlock>
	</section>

	<section>
		<h2>Cleaning up test-mode sprawl</h2>
		<p>
			Test mode will accumulate dozens of throwaway products and prices as you experiment. A short
			script that lists archived/test entities and deletes what it safely can keeps the dashboard
			usable.
		</p>
		<CodeBlock title="scripts/stripe-cleanup.ts" lang="ts">
			{`import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_TEST_KEY!, { apiVersion: '2024-06-20' });

// Test-mode products with no active prices can be deleted outright.
for await (const product of stripe.products.list({ active: false, limit: 100 })) {
  const prices = await stripe.prices.list({ product: product.id, active: true });
  if (prices.data.length === 0) {
    await stripe.products.del(product.id);
    console.log('deleted', product.name, product.id);
  } else {
    console.log('keeping (has active price)', product.name);
  }
}`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				Hard-code the test key check. <code>stripe.products.del</code> in live mode will throw if
				the product has any history, but you do not want to rely on Stripe's safety net — gate the
				script on <code>STRIPE_TEST_KEY</code> at the top.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Prices are immutable. Create new, archive old, never edit.</li>
			<li>
				<code>--transfer-lookup-keys</code> swaps the key atomically — your code keeps working through
				the rotation.
			</li>
			<li>
				Existing subscriptions stay on the old price ID. Migrate them explicitly if you want them on
				the new one.
			</li>
			<li>Test-mode dashboard sprawl is solved by a script, not by discipline.</li>
		</ul>
	</section>
</CoursePage>
