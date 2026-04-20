<script lang="ts">
	import type { Snippet } from 'svelte';
	import Badge from './Badge.svelte';
	import PrevNext from './PrevNext.svelte';
	import TableOfContents from './TableOfContents.svelte';

	interface Props {
		module: string;
		title: string;
		lede: string;
		children: Snippet;
	}

	let { module, title, lede, children }: Props = $props();
</script>

<div class="page">
	<article class="course-content prose">
		<header class="page-head">
			<Badge tone="muted">{module}</Badge>
			<h1>{title}</h1>
			<p class="lede">{lede}</p>
		</header>

		{@render children()}

		<PrevNext />
	</article>

	<TableOfContents />
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--toc-w);
		gap: var(--space-6);
		max-width: calc(var(--content-max) + var(--toc-w) + 64px);
	}

	.page-head {
		margin-bottom: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.page-head h1 {
		font-size: var(--fs-4xl);
	}

	.lede {
		font-size: var(--fs-lg);
		color: var(--color-text-muted);
		line-height: var(--lh-relaxed);
		margin-top: var(--space-2);
	}

	@media (max-width: 1100px) {
		.page {
			grid-template-columns: 1fr;
		}
	}
</style>
