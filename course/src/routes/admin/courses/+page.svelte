<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Courses — Admin</title></svelte:head>

<header class="hd">
	<h1>Courses</h1>
	<p>Standalone courses (separate from the live membership drip).</p>
</header>

<div class="grid">
	{#each data.courses as c}
		<article class="card">
			<div class="top">
				<h2>{c.title}</h2>
				<span class="status" data-status={c.status}>{c.status}</span>
			</div>
			<dl>
				<div><dt>Price</dt><dd>${c.priceUsd}</dd></div>
				<div><dt>Lessons</dt><dd>{c.lessons}</dd></div>
				<div><dt>Students</dt><dd>{c.students}</dd></div>
			</dl>
			<div class="actions">
				<button disabled>Edit curriculum</button>
				<button disabled>Publish</button>
			</div>
		</article>
	{/each}
</div>

<section class="note">
	<h2>What ships next</h2>
	<ul>
		<li>Lesson CRUD (Bunny video id, duration, prerequisites)</li>
		<li>Publish / unpublish + drip schedule</li>
		<li>Per-student progress + quiz attempts</li>
		<li>Preview-as-student role toggle</li>
	</ul>
</section>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-5);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-4);
	}
	.card {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	.card h2 {
		font-size: var(--fs-lg);
		margin: 0;
	}
	.status {
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: var(--color-surface-2);
		color: var(--color-text-muted);
	}
	.status[data-status='live'] {
		background: color-mix(in oklab, var(--color-success) 20%, transparent);
		color: var(--color-success);
	}
	dl {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--space-2);
		margin: 0 0 var(--space-4);
	}
	dt {
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	.actions {
		display: flex;
		gap: var(--space-2);
	}
	.actions button {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}
	.note {
		margin-top: var(--space-7);
		padding: var(--space-4);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
	}
	.note h2 {
		font-size: var(--fs-md);
		margin: 0 0 var(--space-2);
		color: var(--color-text);
	}
</style>
