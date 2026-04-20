<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		lang?: string;
		code?: string;
		children?: Snippet;
	}

	let { title, lang = 'text', code, children }: Props = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		const text = code ?? getTextFromSlot();
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1800);
		} catch {
			/* clipboard blocked — silent */
		}
	}

	function getTextFromSlot(): string {
		if (typeof document === 'undefined') return '';
		const el = document.activeElement?.closest('.codeblock')?.querySelector('code');
		return el?.textContent ?? '';
	}
</script>

<figure class="codeblock">
	<header>
		<span class="meta">
			{#if title}
				<span class="title">{title}</span>
			{/if}
			<span class="lang">{lang}</span>
		</span>
		<button type="button" class="copy" onclick={copy} aria-label="Copy code">
			{copied ? 'Copied' : 'Copy'}
		</button>
	</header>
	<pre><code class={`lang-${lang}`}
			>{#if code}{code}{:else if children}{@render children()}{/if}</code
		></pre>
</figure>

<style>
	.codeblock {
		margin: var(--space-5) 0;
		border-radius: var(--radius-md);
		background: var(--color-code-bg);
		border: 1px solid var(--color-border);
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: 8px 12px;
		background: color-mix(in oklab, var(--color-code-bg) 85%, var(--color-surface-2));
		border-bottom: 1px solid color-mix(in oklab, var(--color-code-text) 10%, transparent);
		font-size: var(--fs-xs);
		color: color-mix(in oklab, var(--color-code-text) 70%, transparent);
	}

	.meta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		font-family: var(--ff-mono);
	}

	.title {
		color: var(--color-code-text);
	}

	.lang {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.7;
	}

	.copy {
		color: var(--color-code-text);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		background: transparent;
		font-size: var(--fs-xs);
		font-family: var(--ff-mono);
		transition:
			background var(--dur-1) var(--ease-out-expo),
			border-color var(--dur-1) var(--ease-out-expo);
	}

	.copy:hover {
		background: color-mix(in oklab, var(--color-code-text) 10%, transparent);
		border-color: color-mix(in oklab, var(--color-code-text) 20%, transparent);
	}

	pre {
		margin: 0;
		padding: var(--space-4);
		background: transparent;
		color: var(--color-code-text);
		overflow-x: auto;
		font-size: var(--fs-sm);
	}

	code {
		font-family: var(--ff-mono);
		line-height: var(--lh-snug);
	}
</style>
