<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>8.2 Building the pricing page — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 8 · Products + pricing page"
	title="8.2 · Building the pricing page, end to end"
	lede="Three files, one endpoint: a server load that reads Stripe, a page that renders cards without lying about savings, and a POST handler that turns a click into a hosted Checkout Session."
>
	<section>
		<h2>Shape the data before you render it</h2>
		<p>
			The page layer should never reach into Stripe. Instead, <code>billingService.listPlans</code>
			returns normalized <code>Plan</code> objects; the <code>+page.server.ts</code> massages them
			into <code>PlanCard</code> view-models. If Stripe is unreachable, we fall back to a static snapshot
			— the page still renders, only the data source changes.
		</p>
		<CodeBlock title="src/lib/server/billing/types.ts" lang="ts">
			{`export type Plan = {
  id: string;
  lookupKey: 'tradeflex_monthly' | 'tradeflex_yearly';
  priceId: string;
  amountCents: number;
  interval: 'month' | 'year';
};

export type PlanCard = {
  id: 'free' | 'monthly' | 'yearly';
  name: string;
  priceMonthly?: number;
  priceYearly?: number;
  features: string[];
  cta: { label: string; href: string; priceId?: string };
  featured?: boolean;
};`}
		</CodeBlock>
	</section>

	<section>
		<h2>The server load</h2>
		<p>
			One call, one fallback branch, one return. The <code>source</code> field lets us render a small
			"using cached pricing" badge when Stripe is down — a signal to ops, invisible to happy-path users.
		</p>
		<CodeBlock title="src/routes/(marketing)/pricing/+page.server.ts" lang="ts">
			{`import type { PageServerLoad } from './$types';
import { billingService } from '$lib/server/billing';
import type { PlanCard } from '$lib/server/billing/types';

const STATIC_MONTHLY = 49;
const STATIC_YEARLY  = 399;

export const load: PageServerLoad = async ({ url }) => {
  const gate = url.searchParams.get('gate');
  let livePlans = [];
  try {
    livePlans = await billingService.listPlans();
  } catch (e) {
    console.warn('pricing.load: Stripe unreachable, using snapshot', { err: String(e) });
  }
  const monthly = livePlans.find((p) => p.lookupKey === 'tradeflex_monthly');
  const yearly  = livePlans.find((p) => p.lookupKey === 'tradeflex_yearly');
  const source: 'stripe' | 'static-snapshot' =
    monthly && yearly ? 'stripe' : 'static-snapshot';

  const plans: PlanCard[] = [
    {
      id: 'free',
      name: 'Free',
      priceMonthly: 0,
      features: ['Delayed alerts', 'Public course preview'],
      cta: { label: 'Create account', href: '/register' }
    },
    {
      id: 'monthly',
      name: 'Monthly',
      priceMonthly: monthly ? monthly.amountCents / 100 : STATIC_MONTHLY,
      features: ['Real-time alerts', 'Full course', 'Chat support'],
      cta: {
        label: 'Start monthly',
        href: '/api/billing/checkout',
        priceId: monthly?.priceId
      }
    },
    {
      id: 'yearly',
      name: 'Yearly',
      priceYearly: yearly ? yearly.amountCents / 100 : STATIC_YEARLY,
      features: ['Everything in Monthly', 'Two months free', 'Priority support'],
      cta: {
        label: 'Start yearly',
        href: '/api/billing/checkout',
        priceId: yearly?.priceId
      },
      featured: true
    }
  ];

  return { plans, source, gate };
};`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				The try/catch is deliberate. <code>listPlans</code> can throw on network error or a stale
				<code>STRIPE_SECRET_KEY</code>. Swallowing it here keeps the marketing surface up; the
				<code>source</code> telemetry field is how ops notices.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The view — three cards, one toggle</h2>
		<p>
			<code>$derived</code> reads the two amounts off <code>data.plans</code> and computes real
			savings. No marketing round numbers, no lies. If yearly drops below
			<code>monthly × 12</code>, the savings pill updates automatically.
		</p>
		<CodeBlock title="src/routes/(marketing)/pricing/+page.svelte (script)" lang="ts">
			{`import type { PageData } from './$types';
let { data }: { data: PageData } = $props();

let billing = $state<'month' | 'year'>('year');

const monthlyAmt = $derived(data.plans.find((p) => p.id === 'monthly')?.priceMonthly ?? 0);
const yearlyAmt  = $derived(data.plans.find((p) => p.id === 'yearly')?.priceYearly ?? 0);
const savings    = $derived(Math.max(0, monthlyAmt * 12 - yearlyAmt));`}
		</CodeBlock>
		<CodeBlock title="src/routes/(marketing)/pricing/+page.svelte (template)" lang="svelte">
			{`{#if data.gate === 'alerts'}
  <div class="banner">Alerts are members-only. Pick a plan below to continue.</div>
{/if}

<div class="toggle" role="tablist" aria-label="Billing period">
  <button role="tab" aria-selected={billing === 'month'} onclick={() => (billing = 'month')}>
    Monthly
  </button>
  <button role="tab" aria-selected={billing === 'year'} onclick={() => (billing = 'year')}>
    Yearly
    {#if savings > 0}<span class="save">Save ${'$'}{savings}</span>{/if}
  </button>
</div>

<section class="cards">
  {#each data.plans as plan (plan.id)}
    <article class="card" class:featured={plan.featured}>
      <h3>{plan.name}</h3>
      <p class="price">
        ${'$'}{billing === 'year' ? (plan.priceYearly ?? plan.priceMonthly) : plan.priceMonthly}
        <span class="per">/{billing}</span>
      </p>
      <ul>
        {#each plan.features as f}<li>{f}</li>{/each}
      </ul>
      {#if plan.cta.priceId}
        <form method="post" action="/api/billing/checkout">
          <input type="hidden" name="priceId" value={plan.cta.priceId} />
          <button type="submit" class="btn-primary">{plan.cta.label}</button>
        </form>
      {:else}
        <a class="btn-primary" href={plan.cta.href}>{plan.cta.label}</a>
      {/if}
    </article>
  {/each}
</section>

{#if data.source === 'static-snapshot'}
  <p class="ops-note" aria-live="polite">Pricing shown from snapshot — refresh in a moment.</p>
{/if}`}
		</CodeBlock>
	</section>

	<section>
		<h2>The checkout endpoint</h2>
		<p>
			POSTed form data in, 303 redirect to Stripe out. The endpoint is <em>three</em> lines of real work:
			resolve the caller's customer id, create a session, send the Location header. Everything else —
			logging, auth, rate limits — belongs in middleware.
		</p>
		<CodeBlock title="src/routes/api/billing/checkout/+server.ts" lang="ts">
			{`import type { RequestHandler } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { billingService } from '$lib/server/billing';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
  const caller = locals.caller;
  if (!caller) throw redirect(303, '/login?next=/pricing');

  const form = await request.formData();
  const priceId = form.get('priceId');
  if (typeof priceId !== 'string' || !priceId) throw error(400, 'priceId required');

  const session = await billingService.createCheckoutSession(caller, {
    priceId,
    successUrl: \`\${env.ORIGIN}/account?checkout=success\`,
    cancelUrl:  \`\${env.ORIGIN}/pricing?checkout=cancelled\`
  });
  throw redirect(303, session.url);
};`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				Never put <code>successUrl</code> / <code>cancelUrl</code> values on the client. A malicious
				actor could point them at their own domain and harvest query params. Build them on the
				server from <code>env.ORIGIN</code>.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Verify</h2>
		<ol>
			<li>
				<code>stripe listen --forward-to localhost:5173/api/stripe/webhook</code> in one terminal.
			</li>
			<li>
				Load <code>/pricing</code>, click <strong>Start monthly</strong>. You land on Stripe's
				hosted checkout with the right price.
			</li>
			<li>
				Enter test card <code>4242 4242 4242 4242</code> → you return to <code>/account</code> with
				<code>?checkout=success</code>.
			</li>
			<li>
				Check <code>stripe listen</code>: <code>checkout.session.completed</code> and
				<code>customer.subscription.created</code> both fire. Your webhook handler writes a row.
			</li>
			<li>
				Toggle off Stripe (empty <code>STRIPE_SECRET_KEY</code>) and reload. Static prices render,
				the snapshot note appears, the page is still up.
			</li>
		</ol>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				<strong>Shape data in <code>+page.server.ts</code></strong> — pages never call Stripe.
			</li>
			<li>
				<strong>Try/catch the Stripe call</strong> so an outage is a cosmetic downgrade, not a 500.
			</li>
			<li>
				<strong>Compute savings from the real numbers</strong> — <code>$derived</code> takes care of it.
			</li>
			<li>
				<strong>Form POST into a 303</strong> — JS-optional purchase, no API design needed.
			</li>
			<li>
				<strong>Success/cancel URLs are server-built</strong> — never trust them from the client.
			</li>
		</ul>
	</section>
</CoursePage>
