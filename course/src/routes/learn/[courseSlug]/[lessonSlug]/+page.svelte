<script lang="ts">
	import { resolve } from '$app/paths';
	import BunnyPlayer from '$lib/components/video/BunnyPlayer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{data.lesson.title} — {data.course.title}</title></svelte:head>

<div class="shell">
	<aside class="side">
		<a class="back" href={resolve(`/learn/${data.course.slug}`)}>← {data.course.title}</a>
		<div class="lesson-head">
			<span class="pos">Lesson {data.lesson.position + 1}</span>
			<h1>{data.lesson.title}</h1>
		</div>
		{#if data.lesson.summary}
			<p class="summary">{data.lesson.summary}</p>
		{/if}
	</aside>

	<main class="main">
		{#if !data.hasAccess}
			<div class="gate">
				<h2>This lesson is locked</h2>
				<p>Unlock all lessons with a Trade Flex membership.</p>
				<a class="btn primary" href={resolve('/pricing')}>See plans</a>
			</div>
		{:else if data.lesson.bunnyVideoGuid}
			<BunnyPlayer
				endpoint={`/api/lesson/${data.lesson.id}/signed-url`}
				title={data.lesson.title}
			/>
		{:else}
			<div class="gate">
				<h2>Video coming soon</h2>
				<p>The instructor hasn't linked a video to this lesson yet.</p>
			</div>
		{/if}

		<nav class="pager">
			{#if data.prev}
				<a href={resolve(`/learn/${data.course.slug}/${data.prev.slug}`)}>
					<span class="label">Previous</span>
					<span class="title">{data.prev.title}</span>
				</a>
			{:else}
				<span></span>
			{/if}
			{#if data.next}
				<a class="next" href={resolve(`/learn/${data.course.slug}/${data.next.slug}`)}>
					<span class="label">Next</span>
					<span class="title">{data.next.title}</span>
				</a>
			{/if}
		</nav>
	</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: var(--space-6);
		align-items: start;
	}
	@media (max-width: 900px) {
		.shell {
			grid-template-columns: 1fr;
		}
	}
	.side {
		position: sticky;
		top: var(--space-4);
	}
	.back {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.lesson-head {
		margin-top: var(--space-3);
	}
	.pos {
		color: var(--color-text-subtle);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.lesson-head h1 {
		font-size: var(--fs-2xl);
		margin: var(--space-1) 0 0;
	}
	.summary {
		color: var(--color-text-muted);
		margin-top: var(--space-3);
	}
	.gate {
		padding: var(--space-7);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-align: center;
	}
	.gate h2 {
		margin: 0 0 var(--space-2);
		font-size: var(--fs-xl);
	}
	.gate p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
	}
	.btn {
		display: inline-block;
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-sm);
		text-decoration: none;
		font-weight: 600;
	}
	.btn.primary {
		background: var(--color-accent);
		color: var(--color-on-accent, #000);
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: var(--space-3);
		margin-top: var(--space-5);
	}
	.pager a {
		flex: 1;
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.pager .next {
		text-align: right;
	}
	.pager .label {
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.pager .title {
		font-weight: 500;
	}
</style>
