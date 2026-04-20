<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="filetree">
	<header>
		<span class="dots" aria-hidden="true">
			<span style="background:#ff6b6b"></span>
			<span style="background:#e9a23b"></span>
			<span style="background:#22c48c"></span>
		</span>
		<span class="label">Project structure</span>
	</header>
	<pre><code>{@render children()}</code></pre>
</div>

<style>
	.filetree {
		margin: var(--space-5) 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 8px 12px;
		background: var(--color-surface-2);
		border-bottom: 1px solid var(--color-border);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
	}

	.dots {
		display: inline-flex;
		gap: 6px;
	}

	.dots span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	pre {
		margin: 0;
		padding: var(--space-4);
		background: transparent;
		color: var(--color-text);
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		line-height: var(--lh-snug);
		overflow-x: auto;
	}
</style>
