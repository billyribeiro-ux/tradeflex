<script lang="ts">
	import { onMount } from 'svelte';

	interface TocItem {
		id: string;
		text: string;
		level: number;
	}

	let items: TocItem[] = $state([]);
	let activeId: string | undefined = $state();

	onMount(() => {
		const article = document.querySelector('article.course-content');
		if (!article) return;

		const headings = Array.from(article.querySelectorAll('h2, h3'));
		items = headings.map((h) => {
			if (!h.id) {
				h.id = (h.textContent ?? '')
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, '')
					.replace(/\s+/g, '-');
			}
			return {
				id: h.id,
				text: h.textContent ?? '',
				level: Number(h.tagName.substring(1))
			};
		});

		const observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						activeId = e.target.id;
						break;
					}
				}
			},
			{ rootMargin: '0px 0px -70% 0px', threshold: 0 }
		);
		headings.forEach((h) => observer.observe(h));
		return () => observer.disconnect();
	});
</script>

{#if items.length > 0}
	<aside class="toc" aria-label="On this page">
		<h6>On this page</h6>
		<ol>
			{#each items as it (it.id)}
				<li class:active={activeId === it.id} data-level={it.level}>
					<a href={`#${it.id}`}>{it.text}</a>
				</li>
			{/each}
		</ol>
	</aside>
{/if}

<style>
	.toc {
		padding: var(--space-5) var(--space-4);
		font-size: var(--fs-sm);
	}

	h6 {
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--space-3);
	}

	ol {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		border-left: 1px solid var(--color-border);
	}

	li a {
		display: block;
		padding: 4px 12px;
		color: var(--color-text-muted);
		text-decoration: none;
		border-left: 2px solid transparent;
		margin-left: -1px;
		transition: color var(--dur-1) var(--ease-out-expo), border-color var(--dur-1) var(--ease-out-expo);
	}

	li[data-level='3'] a {
		padding-left: 24px;
		font-size: var(--fs-xs);
	}

	li a:hover {
		color: var(--color-text);
	}

	li.active a {
		color: var(--color-accent);
		border-left-color: var(--color-accent);
	}
</style>
