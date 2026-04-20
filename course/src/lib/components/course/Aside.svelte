<script lang="ts">
	import type { Snippet } from 'svelte';

	type Kind = 'note' | 'tip' | 'caution' | 'danger';

	interface Props {
		type?: Kind;
		title?: string;
		children: Snippet;
	}

	let { type = 'note', title, children }: Props = $props();

	const labels: Record<Kind, string> = {
		note: 'Note',
		tip: 'Tip',
		caution: 'Caution',
		danger: 'Danger'
	};

	const icons: Record<Kind, string> = {
		note: 'ℹ',
		tip: '★',
		caution: '!',
		danger: '✕'
	};
</script>

<aside class="aside" data-type={type} role={type === 'danger' || type === 'caution' ? 'alert' : 'note'}>
	<div class="header">
		<span class="icon" aria-hidden="true">{icons[type]}</span>
		<span class="label">{title ?? labels[type]}</span>
	</div>
	<div class="body">
		{@render children()}
	</div>
</aside>

<style>
	.aside {
		margin: var(--space-5) 0;
		padding: var(--space-4) var(--space-5);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--tone, var(--color-info));
		background: color-mix(in oklab, var(--tone, var(--color-info)) 8%, var(--color-surface));
		color: var(--color-text);
	}

	.aside[data-type='note'] {
		--tone: var(--color-info);
	}
	.aside[data-type='tip'] {
		--tone: var(--color-accent);
	}
	.aside[data-type='caution'] {
		--tone: var(--color-warning);
	}
	.aside[data-type='danger'] {
		--tone: var(--color-danger);
	}

	.header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 600;
		color: var(--tone);
		margin-bottom: var(--space-2);
		font-size: var(--fs-sm);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.icon {
		display: inline-grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: var(--radius-pill);
		background: color-mix(in oklab, var(--tone) 18%, transparent);
		font-size: 11px;
		font-weight: 700;
	}

	.body :global(p:first-child) {
		margin-top: 0;
	}

	.body :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
