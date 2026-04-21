<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const filters: { key: string; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'open', label: 'Open' },
		{ key: 'in_progress', label: 'In progress' },
		{ key: 'resolved', label: 'Resolved' },
		{ key: 'closed', label: 'Closed' }
	];

	function fmt(d: Date | string) {
		const dt = typeof d === 'string' ? new Date(d) : d;
		const diff = Date.now() - dt.getTime();
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		return dt.toLocaleDateString();
	}
</script>

<svelte:head><title>Support — Admin</title></svelte:head>

<header class="hd">
	<div>
		<h1>Support</h1>
		<p>{data.tickets.length} {data.filter === 'all' ? 'total' : data.filter} tickets</p>
	</div>
	<nav class="tabs">
		{#each filters as f (f.key)}
			<a
				class:active={data.filter === f.key}
				href={f.key === 'all'
					? resolve('/admin/support')
					: resolve(`/admin/support?status=${f.key}`)}
			>
				{f.label}
			</a>
		{/each}
	</nav>
</header>

<div class="table">
	<div class="row row-head">
		<div>Subject</div>
		<div>From</div>
		<div>Category</div>
		<div>Priority</div>
		<div>Status</div>
		<div>Updated</div>
	</div>
	{#each data.tickets as t (t.id)}
		<a class="row" href={resolve(`/admin/support/${t.id}`)}>
			<div class="subj">{t.subject}</div>
			<div class="muted">{t.contactEmail}</div>
			<div><span class="pill">{t.category}</span></div>
			<div><span class="pill pri-{t.priority}">{t.priority}</span></div>
			<div><span class="pill status-{t.status}">{t.status.replace('_', ' ')}</span></div>
			<div class="muted">{fmt(t.updatedAt)}</div>
		</a>
	{/each}
	{#if data.tickets.length === 0}
		<div class="empty">No tickets match this filter.</div>
	{/if}
</div>

<style>
	.hd {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
		flex-wrap: wrap;
	}
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}
	.tabs {
		display: flex;
		gap: var(--space-1);
	}
	.tabs a {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.tabs a.active {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-color: transparent;
	}
	.table {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.row {
		display: grid;
		grid-template-columns: 2.5fr 2fr 1fr 1fr 1fr 1fr;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		align-items: center;
		border-top: 1px solid var(--color-border);
		text-decoration: none;
		color: inherit;
	}
	.row:hover {
		background: var(--color-surface-2);
	}
	.row-head {
		background: var(--color-surface-2);
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-top: none;
	}
	.row-head:hover {
		background: var(--color-surface-2);
	}
	.subj {
		font-weight: 500;
	}
	.muted {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.pill {
		display: inline-block;
		padding: 1px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		text-transform: capitalize;
	}
	.status-open {
		background: color-mix(in oklab, var(--color-warning) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-warning) 40%, transparent);
		color: var(--color-warning);
	}
	.status-in_progress {
		background: color-mix(in oklab, var(--color-accent) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-accent) 40%, transparent);
		color: var(--color-accent);
	}
	.status-resolved {
		background: color-mix(in oklab, var(--color-success) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-success) 40%, transparent);
		color: var(--color-success);
	}
	.status-closed {
		opacity: 0.6;
	}
	.pri-urgent {
		background: color-mix(in oklab, var(--color-danger) 20%, transparent);
		border-color: var(--color-danger);
		color: var(--color-danger);
	}
	.pri-high {
		background: color-mix(in oklab, var(--color-warning) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-warning) 40%, transparent);
	}
	.pri-low {
		opacity: 0.7;
	}
	.empty {
		padding: var(--space-6);
		text-align: center;
		color: var(--color-text-muted);
	}
</style>
