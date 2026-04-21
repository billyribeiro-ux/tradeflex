<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function durationLabel(seconds: number) {
		if (seconds < 60) return `${seconds}s`;
		const m = Math.round(seconds / 60);
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		const rem = m % 60;
		return `${h}h ${rem}m`;
	}
</script>

<svelte:head><title>{data.course.title} — Trade Flex</title></svelte:head>

<header class="hd">
	<a class="back" href={resolve('/learn')}>← All courses</a>
	<h1>{data.course.title}</h1>
	<p class="tagline">{data.course.tagline}</p>
	{#if !data.hasAccess}
		<div class="gate">
			<strong>Preview mode.</strong>
			Curriculum is visible; lessons unlock with a Trade Flex membership or an individual purchase.
			<a href={resolve('/pricing')}>See plans</a>
		</div>
	{/if}
</header>

{#if data.course.summary}
	<section class="summary">
		<p>{data.course.summary}</p>
	</section>
{/if}

<section class="lessons">
	<h2>Lessons ({data.lessons.length})</h2>
	<ol>
		{#each data.lessons as l (l.id)}
			<li>
				{#if data.hasAccess}
					<a href={resolve(`/learn/${data.course.slug}/${l.slug}`)}>
						<span class="num">{l.position + 1}</span>
						<span class="title">{l.title}</span>
						{#if l.durationSeconds > 0}
							<span class="dur">{durationLabel(l.durationSeconds)}</span>
						{/if}
					</a>
				{:else}
					<div class="locked">
						<span class="num">{l.position + 1}</span>
						<span class="title">{l.title}</span>
						<span class="lock" aria-hidden="true">🔒</span>
					</div>
				{/if}
			</li>
		{/each}
		{#if data.lessons.length === 0}
			<li class="empty">No lessons yet.</li>
		{/if}
	</ol>
</section>

<style>
	.hd {
		margin-bottom: var(--space-5);
	}
	.back {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: var(--space-2) 0 var(--space-1);
	}
	.tagline {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3);
	}
	.gate {
		padding: var(--space-3);
		background: color-mix(in oklab, var(--color-accent) 8%, transparent);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-md);
		color: var(--color-text);
	}
	.gate a {
		color: var(--color-accent);
	}
	.summary {
		margin-bottom: var(--space-5);
		color: var(--color-text-muted);
		max-width: 64ch;
	}
	.lessons h2 {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-3);
	}
	.lessons ol {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.lessons a,
	.lessons .locked {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
	}
	.lessons a:hover {
		border-color: var(--color-accent);
	}
	.lessons .locked {
		color: var(--color-text-muted);
		cursor: not-allowed;
	}
	.num {
		flex-shrink: 0;
		width: var(--space-6);
		height: var(--space-6);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		font-weight: 600;
	}
	.title {
		flex: 1;
		font-weight: 500;
	}
	.dur {
		color: var(--color-text-subtle);
		font-size: var(--fs-sm);
	}
	.empty {
		color: var(--color-text-muted);
		padding: var(--space-5);
		text-align: center;
	}
</style>
