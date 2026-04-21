<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Courses — Trade Flex</title></svelte:head>

<header class="hd">
	<h1>Courses</h1>
	{#if data.hasMembership}
		<p class="status">You have full access through your Trade Flex membership.</p>
	{:else if data.signedIn}
		<p class="status muted">
			Your individual enrollments are shown below. <a href="/pricing">Upgrade to a membership</a> for
			full access.
		</p>
	{:else}
		<p class="status muted"><a href="/login">Sign in</a> to access your courses.</p>
	{/if}
</header>

<div class="grid">
	{#each data.courses as c}
		<article class="card" class:locked={!c.hasAccess}>
			<h2>{c.title}</h2>
			<p class="tagline">{c.tagline}</p>
			{#if c.summary}<p class="summary">{c.summary}</p>{/if}
			<footer>
				{#if c.hasAccess}
					<a class="btn primary" href="/learn/{c.slug}">Start lesson</a>
				{:else}
					<span class="price">${(c.priceCents / 100).toFixed(0)}</span>
					<a class="btn" href="/learn/{c.slug}">Preview curriculum</a>
				{/if}
			</footer>
		</article>
	{/each}
	{#if data.courses.length === 0}
		<p class="empty">No courses are published yet. Check back soon.</p>
	{/if}
</div>

<style>
	.hd {
		margin-bottom: var(--space-5);
	}
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	.status {
		color: var(--color-accent);
		margin: 0;
	}
	.status.muted {
		color: var(--color-text-muted);
	}
	.status a {
		color: var(--color-accent);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-4);
	}
	.card {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.card.locked {
		background: color-mix(in oklab, var(--color-surface) 100%, var(--color-surface-2) 0%);
	}
	.card h2 {
		font-size: var(--fs-lg);
		margin: 0;
	}
	.tagline {
		color: var(--color-text-muted);
		margin: 0;
	}
	.summary {
		font-size: var(--fs-sm);
		color: var(--color-text);
		margin: 0;
	}
	footer {
		margin-top: auto;
		padding-top: var(--space-3);
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}
	.price {
		font-weight: 700;
		font-size: var(--fs-lg);
	}
	.btn {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.btn.primary {
		background: var(--color-accent);
		color: var(--color-on-accent, #000);
		border-color: transparent;
		font-weight: 600;
	}
	.empty {
		grid-column: 1 / -1;
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-7);
	}
</style>
