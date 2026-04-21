<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	let billing = $state<'month' | 'year'>('year');

	const faqs = [
		{
			q: 'Can I cancel anytime?',
			a: 'Yes. Cancel from your account page; you keep access until the period ends.'
		},
		{
			q: 'Is there a trial?',
			a: 'Yes — both a 14-day trial with card up-front and a 7-day no-card preview are available at signup.'
		},
		{
			q: 'What payment methods?',
			a: 'All major cards, Apple Pay, Google Pay, and Link via Stripe. ACH on request for yearly.'
		},
		{
			q: 'Refunds?',
			a: 'Yes — 30-day money-back on yearly, no questions asked. Monthly plans are cancel-anytime.'
		},
		{
			q: 'Is this financial advice?',
			a: 'No. Trade Flex is education and alerts. All trades are your own decisions. Trading involves risk of loss.'
		}
	];

	function priceOf(plan: (typeof data.plans)[number]) {
		if (plan.id === 'free') return { amount: 0, period: '' };
		if (billing === 'month' && plan.priceMonthly != null)
			return { amount: plan.priceMonthly, period: '/mo' };
		if (billing === 'year' && plan.priceYearly != null)
			return { amount: plan.priceYearly, period: '/yr' };
		return null;
	}
</script>

<svelte:head><title>Pricing — Trade Flex</title></svelte:head>

{#if data.gate === 'alerts'}
	<aside class="gate" role="status">
		<strong>Alerts are members-only.</strong>
		<span>Pick a plan below to unlock real-time alerts and the full courses.</span>
	</aside>
{/if}

<section class="head">
	<h1>One membership. Everything.</h1>
	<p>Alerts + courses + macOS app. Cancel anytime.</p>
	<div class="toggle" role="tablist" aria-label="Billing period">
		<button
			role="tab"
			aria-selected={billing === 'month'}
			class:active={billing === 'month'}
			onclick={() => (billing = 'month')}>Monthly</button
		>
		<button
			role="tab"
			aria-selected={billing === 'year'}
			class:active={billing === 'year'}
			onclick={() => (billing = 'year')}>Yearly <span class="save">Save $189</span></button
		>
	</div>
</section>

<section class="grid">
	{#each data.plans as plan (plan.id)}
		{@const p = priceOf(plan)}
		{#if p}
			<div class="plan" class:featured={plan.id === 'yearly' && billing === 'year'}>
				{#if plan.badge && billing === 'year'}
					<span class="badge">{plan.badge}</span>
				{/if}
				<h2>{plan.name}</h2>
				<p class="tagline">{plan.tagline}</p>
				<div class="price">
					<span class="amount">${p.amount}</span>
					<span class="period">{p.period}</span>
				</div>
				{#if plan.savingsNote && billing === 'year'}
					<p class="savings">{plan.savingsNote}</p>
				{/if}
				{#if plan.cta.priceId && plan.cta.href === '/api/billing/checkout'}
					<form method="POST" action="/api/billing/checkout" class="cta-form">
						<input type="hidden" name="priceId" value={plan.cta.priceId} />
						<button type="submit" class="btn-primary">{plan.cta.label}</button>
					</form>
					<a class="btn-alt" href={resolve(`/checkout?add=${plan.cta.priceId}`)}>
						Use custom checkout →
					</a>
				{:else}
					<a class="btn-primary" href={resolve(plan.cta.href)}>{plan.cta.label}</a>
				{/if}
				<ul>
					{#each plan.features as f (f)}
						<li>{f}</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</section>

<section class="faq">
	<h2>Questions</h2>
	<div class="faq-grid">
		{#each faqs as faq (faq.q)}
			<details>
				<summary>{faq.q}</summary>
				<p>{faq.a}</p>
			</details>
		{/each}
	</div>
</section>

<style>
	.gate {
		max-width: var(--layout-max);
		margin: var(--space-4) auto 0;
		padding: var(--space-3) var(--space-4);
		background: color-mix(in oklab, var(--color-accent) 10%, transparent);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-md);
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		color: var(--color-text);
	}
	.head {
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-9) var(--space-6) var(--space-6);
		text-align: center;
	}
	.head h1 {
		font-size: var(--fs-4xl);
		margin: 0 0 var(--space-2);
		letter-spacing: -0.02em;
	}
	.head p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-5);
	}
	.toggle {
		display: inline-flex;
		background: var(--color-surface-2);
		padding: 4px;
		border-radius: var(--radius-pill);
		gap: 4px;
		border: 1px solid var(--color-border);
	}
	.toggle button {
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: none;
		border-radius: var(--radius-pill);
		color: var(--color-text-muted);
		cursor: pointer;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.toggle button.active {
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: var(--shadow-1);
	}
	.save {
		font-size: var(--fs-xs);
		color: var(--color-accent);
		font-weight: 600;
	}

	.grid {
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-6);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-4);
	}
	.plan {
		position: relative;
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.plan.featured {
		border-color: var(--color-accent);
		box-shadow:
			0 0 0 3px color-mix(in oklab, var(--color-accent) 15%, transparent),
			var(--shadow-3);
		transform: translateY(-6px);
	}
	.badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		padding: 2px var(--space-3);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		font-weight: 600;
	}
	.plan h2 {
		font-size: var(--fs-xl);
		margin: 0;
	}
	.tagline {
		color: var(--color-text-muted);
		margin: 0;
		min-height: 3em;
	}
	.price {
		display: flex;
		align-items: baseline;
		gap: var(--space-1);
		margin: var(--space-2) 0;
	}
	.amount {
		font-size: var(--fs-5xl);
		font-weight: 700;
		letter-spacing: -0.03em;
	}
	.period {
		color: var(--color-text-muted);
		font-size: var(--fs-md);
	}
	.savings {
		color: var(--color-accent);
		font-size: var(--fs-sm);
		font-weight: 500;
		margin: -10px 0 0;
	}
	.btn-primary {
		display: inline-block;
		text-align: center;
		padding: var(--space-3) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		border: none;
		cursor: pointer;
		font: inherit;
		font-weight: 600;
		width: 100%;
	}
	.cta-form {
		margin: 0;
	}
	.btn-alt {
		display: inline-block;
		text-align: center;
		margin-top: var(--space-2);
		padding: var(--space-2) var(--space-3);
		color: var(--color-accent);
		text-decoration: none;
		font-size: var(--fs-sm);
		font-weight: 500;
	}
	.btn-alt:hover {
		text-decoration: underline;
	}
	.plan ul {
		list-style: none;
		padding: 0;
		margin: var(--space-3) 0 0;
		display: grid;
		gap: var(--space-2);
	}
	.plan li {
		padding-left: var(--space-5);
		position: relative;
		color: var(--color-text-muted);
	}
	.plan li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: var(--color-accent);
		font-weight: 700;
	}

	.faq {
		max-width: 780px;
		margin: var(--space-8) auto;
		padding: 0 var(--space-6);
	}
	.faq h2 {
		font-size: var(--fs-2xl);
		text-align: center;
		margin: 0 0 var(--space-5);
	}
	.faq-grid {
		display: grid;
		gap: var(--space-2);
	}
	.faq details {
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	.faq summary {
		font-weight: 500;
		cursor: pointer;
	}
	.faq p {
		color: var(--color-text-muted);
		margin: var(--space-2) 0 0;
	}
</style>
