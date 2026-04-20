<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Marketing contacts — Admin</title></svelte:head>

<header class="hd">
	<h1>Marketing contacts</h1>
	<p>
		Leads captured from the ebook CTA + any other opt-in form. {data.contacts.length} shown · page
		{data.page}.
	</p>
</header>

<div class="table">
	<div class="row row-head">
		<div>Email</div>
		<div>Source</div>
		<div>Captured</div>
		<div>Status</div>
		<div></div>
	</div>
	{#each data.contacts as c (c.id)}
		<div class="row">
			<div class="email">{c.email}{#if c.name}<span class="name"> · {c.name}</span>{/if}</div>
			<div><span class="pill">{c.source}</span></div>
			<div class="when">{new Date(c.createdAt).toLocaleDateString()}</div>
			<div>
				{#if c.optedIn}
					<span class="status ok">opted-in</span>
				{:else}
					<span class="status off">unsubscribed</span>
				{/if}
			</div>
			<div class="actions">
				{#if c.optedIn}
					<form method="POST" action="?/unsubscribe" use:enhance>
						<input type="hidden" name="id" value={c.id} />
						<button type="submit">Unsubscribe</button>
					</form>
				{/if}
			</div>
		</div>
	{/each}
	{#if data.contacts.length === 0}
		<div class="empty">No contacts yet. The ebook form on the marketing site feeds this list.</div>
	{/if}
</div>

<nav class="pager">
	{#if data.page > 1}<a href="?page={data.page - 1}">← prev</a>{/if}
	{#if data.contacts.length === data.pageSize}<a href="?page={data.page + 1}">next →</a>{/if}
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
	.table {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr auto;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		align-items: center;
		border-top: 1px solid var(--color-border);
	}
	.row-head {
		background: var(--color-surface-2);
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-top: none;
	}
	.email {
		font-weight: 500;
	}
	.name {
		color: var(--color-text-muted);
		font-weight: 400;
	}
	.pill {
		display: inline-block;
		padding: 2px var(--space-2);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		font-family: var(--ff-mono);
	}
	.when {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.status.ok {
		color: var(--color-success);
		font-size: var(--fs-sm);
	}
	.status.off {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.actions button {
		padding: var(--space-1) var(--space-3);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		color: var(--color-text);
		cursor: pointer;
	}
	.actions button:hover {
		color: var(--color-danger);
	}
	.empty {
		padding: var(--space-6);
		text-align: center;
		color: var(--color-text-muted);
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
