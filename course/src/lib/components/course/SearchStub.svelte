<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { coursePages } from '$lib/course/manifest';

	let open = $state(false);
	let query = $state('');
	let inputEl: HTMLInputElement | undefined = $state();
	let active = $state(0);

	const results = $derived(
		query.trim().length === 0
			? coursePages.slice(0, 8)
			: coursePages
					.filter((p) => {
						const q = query.toLowerCase();
						return (
							p.title.toLowerCase().includes(q) ||
							(p.summary ?? '').toLowerCase().includes(q) ||
							p.module.toLowerCase().includes(q)
						);
					})
					.slice(0, 12)
	);

	$effect(() => {
		void query;
		active = 0;
	});

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				open = true;
			} else if (e.key === 'Escape') {
				open = false;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		if (open) {
			queueMicrotask(() => inputEl?.focus());
		}
	});

	function pick(href: string) {
		open = false;
		query = '';
		goto(href);
	}
</script>

<button type="button" class="trigger" onclick={() => (open = true)} aria-label="Search (⌘K)">
	<span aria-hidden="true">⌕</span>
	<span class="placeholder">Search the course</span>
	<kbd>⌘K</kbd>
</button>

{#if open}
	<div
		class="scrim"
		role="dialog"
		aria-modal="true"
		aria-label="Search"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) open = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				open = false;
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				active = Math.min(active + 1, Math.max(results.length - 1, 0));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				active = Math.max(active - 1, 0);
			} else if (e.key === 'Enter') {
				const hit = results[active];
				if (hit) {
					e.preventDefault();
					pick(hit.href);
				}
			}
		}}
	>
		<div class="panel">
			<input
				bind:this={inputEl}
				bind:value={query}
				type="search"
				placeholder="Search course pages…"
				aria-label="Search query"
			/>
			<ul class="results" role="listbox">
				{#each results as r, i (r.href)}
					<li class:active={i === active} role="option" aria-selected={i === active}>
						<button type="button" onclick={() => pick(r.href)} onmouseenter={() => (active = i)}>
							<span class="title">{r.title}</span>
							{#if r.summary}<span class="summary">{r.summary}</span>{/if}
						</button>
					</li>
				{:else}
					<li class="empty">No matches for "{query}"</li>
				{/each}
			</ul>
			<footer>
				<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
				<span><kbd>↵</kbd> open</span>
				<span><kbd>Esc</kbd> close</span>
			</footer>
		</div>
	</div>
{/if}

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 8px 10px 8px 12px;
		min-width: 240px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		transition: border-color var(--dur-1) var(--ease-out-expo);
	}

	.trigger:hover {
		border-color: var(--color-accent);
	}

	.placeholder {
		flex: 1;
		text-align: left;
	}

	kbd {
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text-muted);
	}

	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(11, 13, 16, 0.55);
		backdrop-filter: blur(4px);
		z-index: var(--z-modal);
		display: grid;
		place-items: start center;
		padding-top: 10vh;
	}

	.panel {
		width: min(640px, 92vw);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-4);
		overflow: hidden;
	}

	.panel input {
		display: block;
		width: 100%;
		padding: 16px 20px;
		border: 0;
		background: transparent;
		color: var(--color-text);
		font-size: var(--fs-lg);
		outline: none;
		border-bottom: 1px solid var(--color-border);
	}

	.results {
		list-style: none;
		margin: 0;
		padding: var(--space-2);
		max-height: 50vh;
		overflow: auto;
	}

	.results li button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text);
		text-align: left;
		transition: background var(--dur-1) var(--ease-out-expo);
	}

	.results li button:hover,
	.results li button:focus-visible {
		background: var(--color-surface-2);
	}

	.results li.active button {
		background: var(--color-surface-2);
		outline: 1px solid var(--color-accent);
	}

	.results .title {
		font-size: var(--fs-md);
		font-weight: 500;
	}

	.results .summary {
		font-size: var(--fs-sm);
		color: var(--color-text-muted);
	}

	.empty {
		padding: 20px;
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}

	footer {
		display: flex;
		gap: var(--space-4);
		padding: 10px 16px;
		border-top: 1px solid var(--color-border);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		background: var(--color-surface-2);
	}
</style>
