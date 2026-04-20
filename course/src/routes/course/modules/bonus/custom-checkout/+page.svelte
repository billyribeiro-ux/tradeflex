<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>Bonus · Custom multi-step checkout — Trade Flex</title></svelte:head>

<CoursePage
	module="Bonus · Custom multi-step checkout"
	title="B.1 · Custom multi-step checkout"
	lede="Stripe-hosted Checkout is the right default. But when you need full brand control and a persistent cart — like Simpler Trading — you build it yourself with the Payment Element. Three tabs, one cart, zero surprises."
>
	<section>
		<h2>Why build this</h2>
		<p>
			Hosted Checkout is two clicks away from your customer seeing "stripe.com" — that's fine for
			most SaaS. But if you are running a bundle funnel (membership + a course + an ebook on the
			same cart), you want:
		</p>
		<ul>
			<li>A persistent cart visible on every step.</li>
			<li>Recurring-totals breakdown ("$49 every month + $199 once").</li>
			<li>Your own branding and copy.</li>
			<li>The ability to ask for identity fields, phone, or trade-experience surveys.</li>
		</ul>
		<Aside type="tip">
			<p>
				Don't ship both. If you ship hosted <em>and</em> custom, you end up with two sets of
				edge-case bugs, two webhook pathways, and two sources of "why did the user not convert".
			</p>
		</Aside>
	</section>

	<section>
		<h2>Three tabs</h2>
		<ol>
			<li>
				<strong>Sign in.</strong> Existing member? Log in. New? Create an account right here; no
				redirect. Better Auth's API supports both in a single form.
			</li>
			<li>
				<strong>Billing address.</strong> Country, ZIP, name. Stripe uses this for tax and AVS.
			</li>
			<li>
				<strong>Payment.</strong> Stripe Payment Element (cards, Apple Pay, Google Pay, Link, ACH).
			</li>
		</ol>
	</section>

	<section>
		<h2>Skeleton</h2>
		<CodeBlock title="src/routes/checkout/+page.svelte" lang="svelte">
{'<' + `script lang="ts">
  import CartSidebar from '$lib/components/checkout/CartSidebar.svelte';
  import SignInTab from '$lib/components/checkout/SignInTab.svelte';
  import BillingTab from '$lib/components/checkout/BillingTab.svelte';
  import PaymentTab from '$lib/components/checkout/PaymentTab.svelte';

  let step = $state<'signin' | 'billing' | 'payment'>('signin');
` + '<' + `/script>

<div class="layout">
  <main>
    <nav class="tabs">
      <button class:active={step === 'signin'}   onclick={() => (step = 'signin')}>1 · Sign in</button>
      <button class:active={step === 'billing'}  onclick={() => (step = 'billing')}>2 · Billing</button>
      <button class:active={step === 'payment'}  onclick={() => (step = 'payment')}>3 · Payment</button>
    </nav>

    {#if step === 'signin'}  <SignInTab onnext={() => (step = 'billing')} /> {/if}
    {#if step === 'billing'} <BillingTab onnext={() => (step = 'payment')} /> {/if}
    {#if step === 'payment'} <PaymentTab /> {/if}
  </main>

  <aside><CartSidebar /></aside>
</div>`}
		</CodeBlock>
	</section>

	<section>
		<h2>Payment Element, server-side</h2>
		<CodeBlock title="src/routes/api/checkout/setup/+server.ts" lang="ts">
{`import { json } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';

export const POST = async ({ request, locals }) => {
  const { priceId } = await request.json();
  // create subscription with payment_behavior=default_incomplete
  const sub = await stripe.createSubscription({
    customer: /* stripe customer for this user */,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  const clientSecret = sub.latest_invoice.payment_intent.client_secret;
  return json({ subscriptionId: sub.id, clientSecret });
};`}
		</CodeBlock>
	</section>

	<section>
		<h2>Payment Element, client-side</h2>
		<CodeBlock title="PaymentTab.svelte" lang="svelte">
{'<' + `script lang="ts">
  import { onMount } from 'svelte';
  import { loadStripe } from '@stripe/stripe-js';
  import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

  let mount: HTMLDivElement;
  let clientSecret = $state<string>('');
  let stripe: Awaited<ReturnType<typeof loadStripe>> = null;
  let elements: ReturnType<NonNullable<typeof stripe>['elements']> | null = null;

  onMount(async () => {
    const res = await fetch('/api/checkout/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ priceId: 'price_xxx' })
    });
    const body = await res.json();
    clientSecret = body.clientSecret;

    stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
    elements = stripe!.elements({ clientSecret, appearance: { theme: 'night' } });
    const el = elements.create('payment');
    el.mount(mount);
  });

  async function submit() {
    const { error } = await stripe!.confirmPayment({
      elements: elements!,
      confirmParams: { return_url: \`\${location.origin}/account?checkout=success\` }
    });
    if (error) alert(error.message);
  }
` + '<' + `/script>

<div bind:this={mount}></div>
<button onclick={submit}>Pay</button>`}
		</CodeBlock>
	</section>

	<section>
		<h2>Persistent cart with recurring totals</h2>
		<p>
			The sidebar subtotal shows two lines: <strong>due today</strong> and <strong>recurring</strong>.
			That distinction is what separates a SaaS-grade checkout from an e-commerce one.
		</p>
		<CodeBlock title="CartSidebar.svelte — totals" lang="svelte">
{`{@const dueToday = cart.reduce((n, l) => n + (l.type === 'one_time' ? l.amount : 0), 0)}
{@const recurringMonthly = cart.reduce((n, l) => n + (l.interval === 'month' ? l.amount : 0), 0)}
{@const recurringYearly = cart.reduce((n, l) => n + (l.interval === 'year' ? l.amount : 0), 0)}

<dl>
  <dt>Due today</dt><dd>{fmt(dueToday)}</dd>
  {#if recurringMonthly}<dt>Then each month</dt><dd>{fmt(recurringMonthly)}</dd>{/if}
  {#if recurringYearly}<dt>Then each year</dt><dd>{fmt(recurringYearly)}</dd>{/if}
</dl>`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Three tabs, one cart, Payment Element under the hood.</li>
			<li>Server creates an incomplete subscription and returns the client secret.</li>
			<li>Cart shows due-today and recurring separately — the clearest possible total.</li>
			<li>Only ship this when hosted Checkout can't give you what the funnel demands.</li>
		</ul>
	</section>
</CoursePage>
