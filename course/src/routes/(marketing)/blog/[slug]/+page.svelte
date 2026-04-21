<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const p = $derived(data.post);
	const paragraphs = $derived(p.body.split('\n\n').filter(Boolean));
</script>

<svelte:head>
	<title>{p.title} — Trade Flex</title>
	<meta name="description" content={p.excerpt} />
</svelte:head>

<article class="wrap">
	<a class="back" href={resolve('/blog')}>← Back to blog</a>

	<header>
		<time datetime={p.publishedAt}>
			{new Date(p.publishedAt).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</time>
		<h1>{p.title}</h1>
		<p class="meta">
			<span>{p.author}</span><span>·</span><span>{p.readingMinutes} min read</span>
		</p>
	</header>

	<div class="body">
		{#each paragraphs as para, i (i)}
			<p>
				{#each para.split(/(\*\*[^*]+\*\*)/g) as part, j (j)}
					{#if part.startsWith('**') && part.endsWith('**')}
						<strong>{part.slice(2, -2)}</strong>
					{:else}
						{part}
					{/if}
				{/each}
			</p>
		{/each}
	</div>

	<footer>
		<p class="cta">
			Enjoyed this? Trade Flex is where we put these ideas into practice.
			<a href={resolve('/pricing')}>See the membership →</a>
		</p>
	</footer>
</article>

<style>
	.wrap {
		max-width: 680px;
		margin: 0 auto;
		padding: var(--space-9) var(--space-6);
	}
	.back {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.back:hover {
		color: var(--color-accent);
	}
	header {
		margin: var(--space-5) 0 var(--space-7);
	}
	time {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	header h1 {
		font-size: var(--fs-3xl);
		margin: var(--space-2) 0 var(--space-3);
		line-height: var(--lh-tight);
	}
	.meta {
		display: flex;
		gap: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin: 0;
	}
	.body {
		font-size: var(--fs-lg);
		line-height: var(--lh-relaxed);
	}
	.body p {
		margin: 0 0 var(--space-5);
	}
	footer {
		margin-top: var(--space-8);
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-border);
	}
	.cta {
		color: var(--color-text-muted);
	}
	.cta a {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: 600;
	}
</style>
