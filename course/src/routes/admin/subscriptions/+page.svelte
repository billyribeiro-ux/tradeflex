<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Subscriptions — Admin</title></svelte:head>

<header class="hd">
	<h1>Subscriptions</h1>
	<p>Live Stripe-backed view — cancel, refund, reconcile.</p>
</header>

{#if !data.stripeConfigured}
	<div class="callout">
		<strong>Stripe not configured.</strong> Add <code>STRIPE_SECRET_KEY</code> under
		<a href="/admin/settings/integrations">Integrations</a> to unlock live subscription data.
		The UI is ready; it's waiting on the key.
	</div>
{:else}
	<div class="callout ok">
		Stripe key detected. Live subscription sync ships with Module 7 — the UI will populate the
		moment that ships.
	</div>
{/if}

<section class="preview">
	<h2>What this page will show</h2>
	<ul>
		<li>Every active, trialing, past-due, and canceled subscription</li>
		<li>Monthly / yearly plan split</li>
		<li>MRR snapshot with 30-day delta</li>
		<li>Row actions: refund last invoice, cancel at period end, grant grace period, generate portal link</li>
		<li>Every action writes an audit row; two-person approval for refunds &gt; $500</li>
	</ul>
</section>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-5);
	}
	.callout {
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-warning);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		margin-bottom: var(--space-5);
	}
	.callout.ok {
		border-left-color: var(--color-success);
	}
	.callout a {
		color: var(--color-accent);
	}
	code {
		font-family: var(--ff-mono);
		background: var(--color-surface-2);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
	}
	.preview {
		padding: var(--space-4);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	.preview h2 {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-3);
	}
	.preview ul {
		color: var(--color-text-muted);
		line-height: var(--lh-relaxed);
	}
</style>
