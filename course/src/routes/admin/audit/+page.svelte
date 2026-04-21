<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmt(d: Date | string) {
		return new Date(d).toLocaleString();
	}

	function pageHref(n: number): string {
		const parts: string[] = [];
		if (data.filters.action) parts.push(`action=${encodeURIComponent(data.filters.action)}`);
		if (data.filters.actor) parts.push(`actor=${encodeURIComponent(data.filters.actor)}`);
		if (data.filters.target) parts.push(`target=${encodeURIComponent(data.filters.target)}`);
		parts.push(`page=${n}`);
		return resolve(`/admin/audit?${parts.join('&')}`);
	}
</script>

<svelte:head><title>Audit log — Admin</title></svelte:head>

<header class="hd">
	<h1>Audit log</h1>
	<p>Every write through the service layer lands here. Page {data.page}.</p>
</header>

<form class="filters" method="get">
	<label>
		<span>Action</span>
		<input name="action" value={data.filters.action} placeholder="e.g. subscription.grace" />
	</label>
	<label>
		<span>Actor user ID</span>
		<input name="actor" value={data.filters.actor} placeholder="exact match" />
	</label>
	<label>
		<span>Target kind</span>
		<input name="target" value={data.filters.target} placeholder="e.g. subscription" />
	</label>
	<button type="submit" class="btn-primary">Filter</button>
	{#if data.filters.action || data.filters.actor || data.filters.target}
		<a class="clear" href={resolve('/admin/audit')}>Clear</a>
	{/if}
</form>

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
	{#if data.page > 1}<a href={pageHref(data.page - 1)} rel="external">← prev</a>{/if}
	{#if data.events.length === data.pageSize}
		<a href={pageHref(data.page + 1)} rel="external">next →</a>
	{/if}
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
	.filters {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) auto auto;
		gap: var(--space-3);
		align-items: end;
		margin-bottom: var(--space-4);
	}
	.filters label {
		display: grid;
		gap: var(--space-1);
	}
	.filters label span {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
	}
	.filters input {
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
	}
	.filters .btn-primary {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
	}
	.filters .clear {
		align-self: center;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.filters .clear:hover {
		color: var(--color-text);
	}
	@media (max-width: 720px) {
		.filters {
			grid-template-columns: 1fr;
		}
	}
</style>
