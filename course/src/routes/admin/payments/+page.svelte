<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmt(d: Date | string) {
		return new Date(d).toLocaleString();
	}
</script>

<svelte:head><title>Payments — Admin</title></svelte:head>

<header class="hd">
	<h1>Payments</h1>
	<p>Live Stripe webhook delivery log. {data.events.length} shown · page {data.page}.</p>
</header>

{#if !data.stripeConfigured}
	<div class="callout warn">
		<strong>Stripe key missing.</strong> Add <code>STRIPE_SECRET_KEY</code> in
		<a href="/admin/settings/integrations">Integrations</a> before checkouts will work.
	</div>
{:else if !data.webhookConfigured}
	<div class="callout warn">
		<strong>Webhook secret missing.</strong> Deliveries here are accepted but flagged
		<code>unverified-signature</code>. Set <code>STRIPE_WEBHOOK_SECRET</code> to harden the
		endpoint.
	</div>
{:else}
	<div class="callout ok">
		Stripe + webhook secret configured. Deliveries below are cryptographically verified.
	</div>
{/if}

<div class="list">
	{#each data.events as e (e.id)}
		<article class="evt" class:err={e.error}>
			<div class="top">
				<span class="type">{e.eventType}</span>
				<time>{fmt(e.receivedAt)}</time>
			</div>
			<div class="meta">
				<span><strong>event:</strong> {e.eventId}</span>
				<span><strong>provider:</strong> {e.provider}</span>
				{#if e.processedAt}
					<span class="ok">processed · {fmt(e.processedAt)}</span>
				{:else}
					<span class="pending">not processed</span>
				{/if}
				{#if e.error}
					<span class="err-text">{e.error}</span>
				{/if}
			</div>
		</article>
	{/each}
	{#if data.events.length === 0}
		<div class="empty">
			No webhook deliveries yet. Run <code>stripe listen --forward-to
			{' '}your-domain/api/stripe/webhook</code> and trigger an event with
			<code>stripe trigger checkout.session.completed</code>.
		</div>
	{/if}
</div>

<nav class="pager">
	{#if data.page > 1}<a href="?page={data.page - 1}">← prev</a>{/if}
	{#if data.events.length === data.pageSize}<a href="?page={data.page + 1}">next →</a>{/if}
</nav>

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
	.callout.warn a {
		color: var(--color-accent);
	}
	code {
		font-family: var(--ff-mono);
		background: var(--color-surface-2);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
		font-size: 0.9em;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.evt {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
	}
	.evt.err {
		border-left: 3px solid var(--color-danger);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-3);
	}
	.type {
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		background: var(--color-surface-2);
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
	}
	time {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin-top: var(--space-2);
	}
	.meta .ok {
		color: var(--color-success);
	}
	.meta .pending {
		color: var(--color-text-subtle);
	}
	.err-text {
		color: var(--color-danger);
	}
	.empty {
		padding: var(--space-6);
		text-align: center;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	.pager {
		display: flex;
		justify-content: space-between;
		margin-top: var(--space-4);
	}
	.pager a {
		color: var(--color-accent);
		text-decoration: none;
		padding: var(--space-2) var(--space-3);
	}
</style>
