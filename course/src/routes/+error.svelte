<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went wrong.');
	const isNotFound = $derived(status === 404);
</script>

<svelte:head><title>{status} — Trade Flex</title></svelte:head>

<main class="wrap">
	<p class="status">Error {status}</p>
	<h1>{isNotFound ? 'This page does not exist.' : message}</h1>
	<p class="lede">
		{#if isNotFound}
			The URL you followed may be out of date, or the page was renamed. The nav below gets you back
			to somewhere useful.
		{:else}
			We logged the error with its request id. If this keeps happening, reply to your latest Trade
			Flex email and we'll look into it.
		{/if}
	</p>

	<nav class="links">
		<a href="/">Home</a>
		<a href="/pricing">Pricing</a>
		<a href="/course">Course</a>
		<a href="/contact">Contact</a>
	</nav>
</main>

<style>
	.wrap {
		max-width: 56ch;
		margin: 0 auto;
		padding: var(--space-9) var(--space-6);
		text-align: center;
	}
	.status {
		color: var(--color-text-muted);
		font-family: var(--ff-mono);
		letter-spacing: 0.06em;
		margin: 0 0 var(--space-2);
	}
	h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-3);
	}
	.lede {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-6);
	}
	.links {
		display: flex;
		gap: var(--space-4);
		justify-content: center;
		flex-wrap: wrap;
	}
	.links a {
		color: var(--color-accent);
		text-decoration: none;
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-weight: 600;
	}
	.links a:hover {
		border-color: var(--color-accent);
	}
</style>
