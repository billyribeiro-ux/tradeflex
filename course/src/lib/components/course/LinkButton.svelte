<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		variant?: 'primary' | 'secondary' | 'ghost';
		external?: boolean;
		children: Snippet;
	}

	let { href, variant = 'primary', external = false, children }: Props = $props();
</script>

<a
	class="btn"
	data-variant={variant}
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
>
	{@render children()}
	{#if external}
		<span class="ext" aria-hidden="true">↗</span>
	{/if}
</a>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 10px 18px;
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: var(--fs-sm);
		text-decoration: none;
		line-height: 1;
		transition:
			transform var(--dur-1) var(--ease-out-expo),
			background-color var(--dur-2) var(--ease-out-expo),
			color var(--dur-2) var(--ease-out-expo),
			border-color var(--dur-2) var(--ease-out-expo);
		border: 1px solid transparent;
		will-change: transform;
	}

	.btn:hover {
		transform: translateY(-1px);
	}

	.btn[data-variant='primary'] {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}
	.btn[data-variant='primary']:hover {
		background: color-mix(in oklab, var(--color-accent) 88%, #000);
	}

	.btn[data-variant='secondary'] {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border-strong);
	}
	.btn[data-variant='secondary']:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.btn[data-variant='ghost'] {
		background: transparent;
		color: var(--color-text-muted);
	}
	.btn[data-variant='ghost']:hover {
		color: var(--color-text);
		background: var(--color-surface-2);
	}

	.ext {
		font-size: 0.85em;
		opacity: 0.75;
	}
</style>
