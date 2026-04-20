<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const allRoles = [
		'owner',
		'admin',
		'support',
		'content',
		'finance',
		'analyst',
		'read_only'
	] as const;

	let grantFor = $state<string | null>(null);
	let chosenRole = $state<(typeof allRoles)[number]>('support');
</script>

<svelte:head><title>Members — Admin</title></svelte:head>

<header class="hd">
	<div>
		<h1>Members</h1>
		<p>{data.members.length} shown · page {data.page}</p>
	</div>
</header>

<div class="table">
	<div class="row row-head">
		<div>Email / name</div>
		<div>Roles</div>
		<div>Joined</div>
		<div></div>
	</div>
	{#each data.members as m (m.userId)}
		<div class="row">
			<div class="who">
				<div class="email">{m.email}</div>
				<div class="name">{m.displayName ?? m.name ?? '—'}</div>
			</div>
			<div class="roles">
				{#if m.roles.length}
					{#each m.roles as r}
						<form method="POST" action="?/revoke" use:enhance class="pill pill-role">
							<input type="hidden" name="userId" value={m.userId} />
							<input type="hidden" name="role" value={r} />
							<span>{r}</span>
							<button type="submit" title="Revoke role">×</button>
						</form>
					{/each}
				{:else}
					<span class="empty">member</span>
				{/if}
			</div>
			<div class="joined">{new Date(m.createdAt).toLocaleDateString()}</div>
			<div class="actions">
				{#if grantFor === m.userId}
					<form method="POST" action="?/grant" use:enhance class="grant">
						<input type="hidden" name="userId" value={m.userId} />
						<select name="role" bind:value={chosenRole}>
							{#each allRoles as r}
								<option value={r}>{r}</option>
							{/each}
						</select>
						<button type="submit" class="btn-primary">Grant</button>
						<button type="button" onclick={() => (grantFor = null)}>Cancel</button>
					</form>
				{:else}
					<button onclick={() => (grantFor = m.userId)}>+ role</button>
				{/if}
			</div>
		</div>
	{/each}
	{#if data.members.length === 0}
		<div class="empty-state">No members yet.</div>
	{/if}
</div>

<nav class="pager">
	{#if data.page > 1}
		<a href="?page={data.page - 1}">← prev</a>
	{/if}
	{#if data.members.length === data.pageSize}
		<a href="?page={data.page + 1}">next →</a>
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
	.table {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.row {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr auto;
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
		font-size: var(--fs-sm);
	}
	.roles {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	.pill-role {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: 2px var(--space-2);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		margin: 0;
	}
	.pill-role button {
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--fs-sm);
		padding: 0 var(--space-1);
	}
	.pill-role button:hover {
		color: var(--color-danger);
	}
	.empty {
		color: var(--color-text-subtle);
		font-size: var(--fs-xs);
	}
	.joined {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.actions button,
	.grant button {
		padding: var(--space-1) var(--space-3);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
		color: var(--color-text);
		cursor: pointer;
	}
	.btn-primary {
		background: var(--color-accent) !important;
		color: var(--color-accent-contrast) !important;
		border-color: transparent !important;
	}
	.grant {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}
	.grant select {
		padding: var(--space-1) var(--space-2);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
	}
	.empty-state {
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
