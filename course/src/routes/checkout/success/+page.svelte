<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const ok = $derived(data.redirectStatus === 'succeeded' || !data.redirectStatus);
</script>

<svelte:head><title>Thanks — Trade Flex</title></svelte:head>

<div class="wrap">
	{#if ok}
		<h1>Thanks — you're in.</h1>
		<p>
			Your payment is being confirmed. Membership and course access unlock the moment Stripe reports
			the charge as succeeded (usually within seconds).
		</p>
		<div class="actions">
			<a class="primary" href={resolve('/learn')}>Start learning</a>
			<a class="ghost" href={resolve('/account')}>View account</a>
		</div>
	{:else}
		<h1>Payment status: {data.redirectStatus}</h1>
		<p>
			Something held up the charge. Your card may need verification. Check your email from Stripe or
			return to the checkout to try again.
		</p>
		<div class="actions">
			<a class="primary" href={resolve('/checkout')}>Back to checkout</a>
		</div>
	{/if}
	{#if data.paymentIntentId}
		<p class="meta">Reference: {data.paymentIntentId}</p>
	{/if}
</div>

<style>
	.wrap {
		max-width: 640px;
		margin: var(--space-8) auto;
		padding: var(--space-6);
		text-align: center;
	}
	h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-3);
	}
	p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
	}
	.actions {
		display: inline-flex;
		gap: var(--space-3);
	}
	.primary {
		padding: var(--space-3) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-md);
		font-weight: 600;
		text-decoration: none;
	}
	.ghost {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
	}
	.meta {
		margin-top: var(--space-5);
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
	}
</style>
