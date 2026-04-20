<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmt(d: Date | string) {
		return new Date(d).toLocaleString();
	}
</script>

<svelte:head><title>Audit log — Admin</title></svelte:head>

<header class="hd">
	<h1>Audit log</h1>
	<p>Every write through the service layer lands here. Page {data.page}.</p>
</header>

<div class="list">
	{#each data.events as e (e.id)}
		<article class="event">
			<div class="top">
				<span class="action">{e.action}</span>
				<time>{fmt(e.at)}</time>
			</div>
			<div class="meta">
				<span><strong>target:</strong> {e.targetKind}{e.targetId ? ` · ${e.targetId}` : ''}</span>
				<span><strong>actor:</strong> {e.actorUserId ?? 'anon'}</span>
				{#if e.impersonatorUserId}
					<span class="imp">via {e.impersonatorUserId}</span>
				{/if}
			</div>
			{#if e.metadata && Object.keys(e.metadata as object).length}
				<pre>{JSON.stringify(e.metadata, null, 2)}</pre>
			{/if}
		</article>
	{/each}
	{#if data.events.length === 0}
		<div class="empty">
			No audit events yet. Take any action through the admin and it lands here.
		</div>
	{/if}
</div>

<nav class="pager">
	{#if data.page > 1}<a href="?page={data.page - 1}">← prev</a>{/if}
	{#if data.events.length === data.pageSize}<a href="?page={data.page + 1}">next →</a>{/if}
</nav>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-5);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.event {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-3);
	}
	.action {
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		background: var(--color-surface-2);
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
	}
	time {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin-top: var(--space-2);
	}
	.imp {
		color: var(--color-warning);
	}
	pre {
		margin: var(--space-2) 0 0;
		padding: var(--space-2);
		background: var(--color-surface-2);
		border-radius: var(--radius-sm);
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		overflow-x: auto;
	}
	.empty {
		padding: var(--space-6);
		text-align: center;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	.pager {
		display: flex;
		justify-content: space-between;
		margin-top: var(--space-4);
	}
	.pager a {
		color: var(--color-accent);
		text-decoration: none;
		padding: var(--space-2) var(--space-3);
	}
</style>
