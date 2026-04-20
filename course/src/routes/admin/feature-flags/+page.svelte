<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/toast/store.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const ROLES = ['owner', 'admin', 'support', 'content', 'finance', 'analyst', 'read_only'];

	let showNew = $state(false);
	let editingKey = $state<string | null>(null);

	$effect(() => {
		if (!form || !('success' in form) || !form.success) return;
		if ('upsertedKey' in form && form.upsertedKey) {
			toast.success(`Saved ${form.upsertedKey}`);
			showNew = false;
			editingKey = null;
		} else if ('deletedKey' in form && form.deletedKey) {
			toast.success(`Deleted ${form.deletedKey}`);
			editingKey = null;
		}
	});

	function rolesOf(row: { enabledForRoles: unknown }): string[] {
		return (row.enabledForRoles ?? []) as string[];
	}
	function userIdsOf(row: { enabledForUserIds: unknown }): string[] {
		return (row.enabledForUserIds ?? []) as string[];
	}
</script>

<svelte:head><title>Feature flags — Trade Flex admin</title></svelte:head>

<header class="head">
	<div>
		<h1>Feature flags</h1>
		<p class="muted">
			Platform kill switches + staged rollout. A flag with <code>enabled=true</code> is on for everyone.
			Otherwise it's gated by the role and user-ID overrides below — exactly one match is enough.
		</p>
	</div>
	{#if !showNew}
		<button class="btn-primary" type="button" onclick={() => (showNew = true)}> + New flag </button>
	{/if}
</header>

{#if form && 'message' in form && form.message}
	<p class="error" role="alert">{form.message}</p>
{/if}

{#if showNew}
	<section class="card">
		<h2>Create flag</h2>
		<form method="post" action="?/upsert" use:enhance class="flag-form">
			<label class="field">
				<span>Key</span>
				<input
					name="key"
					placeholder="e.g. sse.notifications"
					pattern="[a-z][a-z0-9]*([-.][a-z0-9]+)*"
					required
					maxlength="80"
				/>
			</label>
			<label class="field">
				<span>Description</span>
				<input name="description" maxlength="500" />
			</label>
			<label class="checkbox">
				<input type="checkbox" name="enabled" />
				<span>Globally enabled</span>
			</label>
			<fieldset class="field">
				<legend>Enabled for roles</legend>
				<div class="role-grid">
					{#each ROLES as role}
						<label class="role">
							<input type="checkbox" name="enabledForRoles" value={role} />
							<span>{role}</span>
						</label>
					{/each}
				</div>
			</fieldset>
			<label class="field">
				<span>User IDs (comma or whitespace separated)</span>
				<input name="enabledForUserIds" placeholder="usr_abc, usr_def" />
			</label>
			<div class="actions">
				<button class="btn-primary" type="submit">Create</button>
				<button class="btn-link" type="button" onclick={() => (showNew = false)}>Cancel</button>
			</div>
		</form>
	</section>
{/if}

{#if data.flags.length === 0 && !showNew}
	<p class="empty">No flags yet — create one to gate a feature.</p>
{:else if data.flags.length > 0}
	<section class="flags">
		{#each data.flags as f (f.key)}
			<article class="card" class:on={f.enabled}>
				{#if editingKey === f.key}
					<form method="post" action="?/upsert" use:enhance class="flag-form">
						<input type="hidden" name="key" value={f.key} />
						<h3><code>{f.key}</code></h3>
						<label class="field">
							<span>Description</span>
							<input name="description" maxlength="500" value={f.description} />
						</label>
						<label class="checkbox">
							<input type="checkbox" name="enabled" checked={f.enabled} />
							<span>Globally enabled</span>
						</label>
						<fieldset class="field">
							<legend>Enabled for roles</legend>
							<div class="role-grid">
								{#each ROLES as role}
									<label class="role">
										<input
											type="checkbox"
											name="enabledForRoles"
											value={role}
											checked={rolesOf(f).includes(role)}
										/>
										<span>{role}</span>
									</label>
								{/each}
							</div>
						</fieldset>
						<label class="field">
							<span>User IDs</span>
							<input
								name="enabledForUserIds"
								value={userIdsOf(f).join(', ')}
								placeholder="usr_abc, usr_def"
							/>
						</label>
						<div class="actions">
							<button class="btn-primary" type="submit">Save</button>
							<button class="btn-link" type="button" onclick={() => (editingKey = null)}>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<header class="row-head">
						<div>
							<h3><code>{f.key}</code></h3>
							{#if f.description}<p class="row-desc">{f.description}</p>{/if}
						</div>
						<span class="badge" class:on={f.enabled}>
							{f.enabled ? 'ON' : 'targeted'}
						</span>
					</header>
					<dl class="targeting">
						<div>
							<dt>Roles</dt>
							<dd>
								{#if rolesOf(f).length}
									{rolesOf(f).join(', ')}
								{:else}—{/if}
							</dd>
						</div>
						<div>
							<dt>User IDs</dt>
							<dd>
								{#if userIdsOf(f).length}
									{userIdsOf(f).join(', ')}
								{:else}—{/if}
							</dd>
						</div>
						<div>
							<dt>Updated</dt>
							<dd>{new Date(f.updatedAt).toLocaleString()}</dd>
						</div>
					</dl>
					<div class="row-actions">
						<button class="btn-ghost" type="button" onclick={() => (editingKey = f.key)}>
							Edit
						</button>
						<form method="post" action="?/delete" use:enhance style="display: inline;">
							<input type="hidden" name="key" value={f.key} />
							<button
								class="btn-link danger"
								type="submit"
								onclick={(e) => {
									if (!confirm(`Delete flag "${f.key}"?`)) e.preventDefault();
								}}
							>
								Delete
							</button>
						</form>
					</div>
				{/if}
			</article>
		{/each}
	</section>
{/if}

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}
	.head h1 {
		margin: 0 0 var(--space-1);
		font-size: var(--fs-2xl);
	}
	.muted {
		color: var(--color-text-muted);
		margin: 0;
		max-width: 72ch;
	}
	.empty {
		color: var(--color-text-muted);
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		text-align: center;
	}
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		margin-bottom: var(--space-4);
	}
	.card.on {
		border-color: color-mix(in oklab, var(--color-accent) 35%, var(--color-border));
	}
	.card h2,
	.card h3 {
		margin: 0 0 var(--space-3);
		font-size: var(--fs-lg);
	}
	.card h3 code {
		font-size: inherit;
	}
	.row-head {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--space-4);
		margin-bottom: var(--space-3);
	}
	.row-head h3 {
		margin: 0;
	}
	.row-desc {
		margin: var(--space-1) 0 0;
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.badge {
		font-size: var(--fs-xs);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.badge.on {
		background: color-mix(in oklab, var(--color-accent) 15%, transparent);
		color: var(--color-accent);
	}
	.targeting {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-3);
		margin: 0 0 var(--space-3);
	}
	.targeting dt {
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-subtle);
		margin-bottom: var(--space-1);
	}
	.targeting dd {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--color-text);
		word-break: break-all;
	}
	.flag-form {
		display: grid;
		gap: var(--space-3);
	}
	.field {
		display: grid;
		gap: var(--space-1);
		border: none;
		padding: 0;
		margin: 0;
	}
	.field > span,
	.field > legend {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.field input {
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
	}
	.checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.checkbox input {
		accent-color: var(--color-accent);
	}
	.role-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: var(--space-2);
	}
	.role {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--fs-sm);
		cursor: pointer;
	}
	.role:has(input:checked) {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 8%, transparent);
	}
	.role input {
		accent-color: var(--color-accent);
	}
	.actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}
	.row-actions {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}
	.btn-primary {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
	}
	.btn-ghost {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font-size: var(--fs-sm);
		cursor: pointer;
	}
	.btn-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-text-muted);
		text-decoration: underline;
		cursor: pointer;
		font: inherit;
	}
	.btn-link.danger {
		color: var(--color-danger);
	}
	.error {
		color: var(--color-danger);
		background: color-mix(in oklab, var(--color-danger) 10%, transparent);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}
</style>
