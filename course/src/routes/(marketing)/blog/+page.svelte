<script lang="ts">
	import { posts } from '$lib/blog/posts';
</script>

<svelte:head><title>Blog — Trade Flex</title></svelte:head>

<section class="wrap">
	<header>
		<h1>Blog</h1>
		<p class="lede">Essays on trading, risk, and the craft of building Trade Flex.</p>
	</header>

	<ul class="list">
		{#each posts as p}
			<li>
				<a href="/blog/{p.slug}">
					<time datetime={p.publishedAt}>
						{new Date(p.publishedAt).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
					<h2>{p.title}</h2>
					<p>{p.excerpt}</p>
					<div class="meta">
						<span>{p.author}</span>
						<span>·</span>
						<span>{p.readingMinutes} min read</span>
						{#each p.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</a>
			</li>
		{/each}
	</ul>
</section>

<style>
	.wrap {
		max-width: 760px;
		margin: 0 auto;
		padding: var(--space-9) var(--space-6);
	}
	header h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	.lede {
		color: var(--color-text-muted);
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-7);
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-5);
	}
	.list a {
		display: block;
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition:
			border-color var(--dur-2) var(--ease-out-quart),
			transform var(--dur-2) var(--ease-out-quart);
	}
	.list a:hover {
		border-color: var(--color-accent);
		transform: translateY(-1px);
	}
	time {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.list h2 {
		font-size: var(--fs-xl);
		margin: var(--space-1) 0 var(--space-2);
	}
	.list p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3);
		line-height: var(--lh-relaxed);
	}
	.meta {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		align-items: center;
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
	}
	.tag {
		padding: 2px var(--space-2);
		background: var(--color-surface-2);
		border-radius: var(--radius-pill);
	}
	@media (prefers-reduced-motion: reduce) {
		.list a {
			transition: none;
		}
		.list a:hover {
			transform: none;
		}
	}
</style>
