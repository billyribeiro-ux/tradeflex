<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';

	interface Props {
		title?: string;
		icon?: string;
		href?: string;
		children: Snippet;
	}

	let { title, icon, href, children }: Props = $props();
</script>

{#if href}
	<a class="card" href={resolve(href)}>
		<div class="head">
			{#if icon}<span class="icon" aria-hidden="true">{icon}</span>{/if}
			{#if title}<h4>{title}</h4>{/if}
		</div>
		<div class="body">{@render children()}</div>
	</a>
{:else}
	<div class="card">
		<div class="head">
			{#if icon}<span class="icon" aria-hidden="true">{icon}</span>{/if}
			{#if title}<h4>{title}</h4>{/if}
		</div>
		<div class="body">{@render children()}</div>
	</div>
{/if}

<style>
	.card {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
		transition:
			transform var(--dur-2) var(--ease-out-expo),
			border-color var(--dur-2) var(--ease-out-expo),
			box-shadow var(--dur-2) var(--ease-out-expo);
	}

	a.card:hover {
		transform: translateY(-2px);
		border-color: var(--color-accent);
		box-shadow: var(--shadow-2);
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.head :global(h4) {
		margin: 0;
		font-size: var(--fs-lg);
	}

	.icon {
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		background: color-mix(in oklab, var(--color-accent) 15%, transparent);
		color: var(--color-accent);
		font-size: var(--fs-md);
	}

	.body {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		line-height: var(--lh-normal);
	}
</style>
