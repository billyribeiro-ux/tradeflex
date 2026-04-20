<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/toast/store.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let cancellingId = $state<string | null>(null);
	let note = $state('');

	$effect(() => {
		if (form && 'success' in form && form.success) {
			toast.success('Deletion cancelled.');
			cancellingId = null;
			note = '';
		}
	});

	function daysLeft(scheduledFor: Date | string) {
		const ms = new Date(scheduledFor).getTime() - Date.now();
		return Math.ceil(ms / (24 * 60 * 60 * 1000));
	}
</script>

<svelte:head><title>Compliance — Trade Flex admin</title></svelte:head>

<header class="head">
	<h1>Compliance</h1>
	<p class="muted">
		Pending account deletions. Users get a 30-day grace window — admins can override and cancel with
		a note (audited). Admins cannot cancel their own pending deletion.
	</p>
</header>

{#if form && 'message' in form && form.message}
	<p class="error" role="alert">{form.message}</p>
{/if}

{#if data.rows.length === 0}
	<p class="empty">No pending deletions.</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>User</th>
				<th>Reason</th>
				<th>Requested</th>
				<th>Runs on</th>
				<th>Days left</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as r (r.id)}
				<tr>
					<td>
						<div class="who">
							<span class="email">{r.userEmail ?? r.userId}</span>
							{#if r.userName}<span class="name">{r.userName}</span>{/if}
						</div>
					</td>
					<td class="reason">{r.reason ?? '—'}</td>
					<td>{new Date(r.requestedAt).toLocaleDateString()}</td>
					<td>{new Date(r.scheduledFor).toLocaleDateString()}</td>
					<td>
						<span class:urgent={daysLeft(r.scheduledFor) <= 3}>
							{daysLeft(r.scheduledFor)}
						</span>
					</td>
					<td class="action-cell">
						{#if cancellingId === r.id}
							<form method="post" action="?/adminCancel" use:enhance class="cancel-form">
								<input type="hidden" name="id" value={r.id} />
								<input
									name="note"
									bind:value={note}
									placeholder="Why are you cancelling? (audited)"
									required
									minlength="3"
								/>
								<button class="btn-danger" type="submit">Confirm cancel</button>
								<button
									class="btn-link"
									type="button"
									onclick={() => {
										cancellingId = null;
										note = '';
									}}
								>
									back
								</button>
							</form>
						{:else}
							<button
								class="btn-ghost"
								type="button"
								onclick={() => {
									cancellingId = r.id;
									note = '';
								}}
							>
								Cancel deletion
							</button>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.head h1 {
		margin: 0 0 var(--space-1);
		font-size: var(--fs-2xl);
	}
	.muted {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-6);
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
	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	th,
	td {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		border-bottom: 1px solid var(--color-border);
		vertical-align: top;
	}
	thead th {
		background: var(--color-surface-2);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-subtle);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.email {
		font-weight: 500;
	}
	.name {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.reason {
		max-width: 320px;
		color: var(--color-text-muted);
	}
	.urgent {
		color: var(--color-danger);
		font-weight: 600;
	}
	.action-cell {
		min-width: 220px;
	}
	.cancel-form {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}
	.cancel-form input {
		flex: 1;
		min-width: 180px;
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
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
	.btn-ghost:hover {
		border-color: var(--color-border-strong);
	}
	.btn-danger {
		padding: var(--space-2) var(--space-3);
		background: var(--color-danger);
		color: #fff;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--fs-sm);
		font-weight: 600;
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
	.error {
		color: var(--color-danger);
		background: color-mix(in oklab, var(--color-danger) 10%, transparent);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}
</style>
