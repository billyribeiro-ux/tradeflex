<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'default' | 'accent' | 'info' | 'warning' | 'danger' | 'muted';
		children: Snippet;
	}

	let { tone = 'default', children }: Props = $props();
</script>

<span class="badge" data-tone={tone}>{@render children()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: var(--radius-pill);
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		border: 1px solid var(--tone-border, var(--color-border));
		background: var(--tone-bg, var(--color-surface-2));
		color: var(--tone-fg, var(--color-text-muted));
	}

	.badge[data-tone='accent'] {
		--tone-bg: color-mix(in oklab, var(--color-accent) 15%, transparent);
		--tone-fg: var(--color-accent);
		--tone-border: color-mix(in oklab, var(--color-accent) 30%, transparent);
	}

	.badge[data-tone='info'] {
		--tone-bg: color-mix(in oklab, var(--color-info) 15%, transparent);
		--tone-fg: var(--color-info);
		--tone-border: color-mix(in oklab, var(--color-info) 30%, transparent);
	}

	.badge[data-tone='warning'] {
		--tone-bg: color-mix(in oklab, var(--color-warning) 15%, transparent);
		--tone-fg: var(--color-warning);
		--tone-border: color-mix(in oklab, var(--color-warning) 30%, transparent);
	}

	.badge[data-tone='danger'] {
		--tone-bg: color-mix(in oklab, var(--color-danger) 15%, transparent);
		--tone-fg: var(--color-danger);
		--tone-border: color-mix(in oklab, var(--color-danger) 30%, transparent);
	}

	.badge[data-tone='muted'] {
		--tone-fg: var(--color-text-subtle);
	}
</style>
