<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<ol class="steps">
	{@render children()}
</ol>

<style>
	.steps {
		counter-reset: step;
		list-style: none;
		padding: 0;
		margin: var(--space-5) 0;
		border-left: 1px dashed var(--color-border-strong);
	}

	.steps :global(> li) {
		counter-increment: step;
		position: relative;
		padding: 0 0 var(--space-6) var(--space-6);
		margin-left: 14px;
	}

	.steps :global(> li::before) {
		content: counter(step);
		position: absolute;
		left: -16px;
		top: 0;
		width: 28px;
		height: 28px;
		display: inline-grid;
		place-items: center;
		background: var(--color-surface);
		color: var(--color-accent);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-pill);
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		font-weight: 600;
	}

	.steps :global(> li:last-child) {
		padding-bottom: 0;
	}

	.steps :global(h4) {
		margin: 0 0 var(--space-2);
		font-size: var(--fs-lg);
	}
</style>
