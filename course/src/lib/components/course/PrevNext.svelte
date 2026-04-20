<script lang="ts">
	import { page } from '$app/state';
	import { findAdjacent } from '$lib/course/manifest';

	const adj = $derived(findAdjacent(page.url.pathname));
</script>

<nav class="prevnext" aria-label="Course pagination">
	{#if adj.prev}
		<a class="cell prev" href={adj.prev.href}>
			<span class="dir">← Previous</span>
			<span class="title">{adj.prev.title}</span>
		</a>
	{:else}
		<span></span>
	{/if}
	{#if adj.next}
		<a class="cell next" href={adj.next.href}>
			<span class="dir">Next →</span>
			<span class="title">{adj.next.title}</span>
		</a>
	{:else}
		<span></span>
	{/if}
</nav>

<style>
	.prevnext {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
		margin-top: var(--space-7);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--space-4) var(--space-5);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		text-decoration: none;
		transition:
			transform var(--dur-2) var(--ease-out-expo),
			border-color var(--dur-2) var(--ease-out-expo);
	}

	.cell:hover {
		transform: translateY(-2px);
		border-color: var(--color-accent);
	}

	.cell.next {
		text-align: right;
	}

	.dir {
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.title {
		font-size: var(--fs-md);
		font-weight: 500;
		color: var(--color-text);
	}
</style>
