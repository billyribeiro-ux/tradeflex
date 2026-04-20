<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { toast } from '$lib/toast/store.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	let confirmingDeletion = $state(false);

	$effect(() => {
		if (!form) return;
		if ('deletionRequested' in form && form.deletionRequested) {
			toast.success('Account deletion scheduled — you have 30 days to cancel.');
			confirmingDeletion = false;
		} else if ('deletionCancelled' in form && form.deletionCancelled) {
			toast.success('Deletion cancelled.');
		} else if ('success' in form && form.success) {
			toast.success('Profile saved');
		}
	});

	const deletionDeadline = $derived.by(() => {
		const d = data.pendingDeletion?.scheduledFor;
		if (!d) return null;
		return new Date(d);
	});
	const daysLeft = $derived.by(() => {
		if (!deletionDeadline) return null;
		const ms = deletionDeadline.getTime() - Date.now();
		return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
	});

	const p = $derived(data.profile);
	const prevValues: { displayName: string; bio: string; timezone: string } = $derived.by(() => {
		if (form && 'values' in form && form.values) {
			const v = form.values as Record<string, unknown>;
			return {
				displayName: typeof v.displayName === 'string' ? v.displayName : '',
				bio: typeof v.bio === 'string' ? v.bio : '',
				timezone: typeof v.timezone === 'string' ? v.timezone : ''
			};
		}
		return { displayName: '', bio: '', timezone: '' };
	});
</script>

<svelte:head><title>Account — Trade Flex</title></svelte:head>

<header class="page-head">
	<div>
		<h1>Account</h1>
		<p class="lede">Signed in as <strong>{data.user?.email}</strong></p>
	</div>
	<form method="post" action="/logout" use:enhance>
		<button class="btn-ghost" type="submit">Sign out</button>
	</form>
</header>

<section class="card">
	<h2>Profile</h2>
	<p class="muted">Your display name and preferences. Changes are audited.</p>

	<form
		method="post"
		action="?/save"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<label class="field">
			<span>Display name</span>
			<input name="displayName" required value={prevValues.displayName || (p?.displayName ?? '')} />
		</label>

		<label class="field">
			<span>Bio</span>
			<textarea name="bio" rows="3" maxlength="500">{prevValues.bio || (p?.bio ?? '')}</textarea>
		</label>

		<label class="field">
			<span>Timezone</span>
			<input
				name="timezone"
				placeholder="e.g. America/New_York"
				value={prevValues.timezone || (p?.timezone ?? 'UTC')}
			/>
		</label>

		<fieldset class="field">
			<legend>Theme</legend>
			<div class="radio-row">
				{#each ['system', 'light', 'dark'] as t}
					<label class="radio">
						<input type="radio" name="theme" value={t} checked={(p?.theme ?? 'system') === t} />
						<span>{t}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		<label class="checkbox">
			<input type="checkbox" name="marketingOptIn" checked={p?.marketingOptIn ?? false} />
			<span>Send me product updates and trading insights.</span>
		</label>

		{#if form && 'message' in form && form.message}
			<p class="error" role="alert">{form.message}</p>
		{/if}

		<div class="actions">
			<button class="btn-primary" type="submit" disabled={submitting}>
				{submitting ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	</form>
</section>

<section class="card" style="margin-top: var(--space-5);">
	<h2>Membership</h2>
	{#if data.subscription}
		<p class="muted">
			Status <strong>{data.subscription.status}</strong>
			{#if data.subscription.priceLookupKey}· plan <strong
					>{data.subscription.priceLookupKey}</strong
				>{/if}
			{#if data.subscription.currentPeriodEnd}
				· renews {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
			{/if}
		</p>
		{#if data.entitled}
			<p class="ok">You have access to member-only features like /alerts.</p>
		{:else}
			<p class="warn">Your membership is paused. Update payment to restore access.</p>
		{/if}
	{:else}
		<p class="muted">You don't have an active membership yet.</p>
	{/if}

	<div class="billing-actions">
		{#if data.customer}
			<form method="post" action="?/portal" use:enhance>
				<button class="btn-primary" type="submit">Open billing portal</button>
			</form>
		{:else}
			<a class="btn-primary" href="/pricing">View plans</a>
		{/if}
	</div>
</section>

<section class="card danger" style="margin-top: var(--space-5);">
	<h2>Privacy &amp; data</h2>
	<p class="muted">
		Export your data at any time. Deletion has a 30-day grace period — you can cancel from here
		before it runs.
	</p>

	{#if data.pendingDeletion && daysLeft !== null}
		<div class="pending-deletion">
			<p style="margin: 0 0 var(--space-2);">
				<strong>Account deletion scheduled.</strong>
				Your data will be removed in <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong>
				{#if deletionDeadline}
					(on {deletionDeadline.toLocaleDateString()}){/if}.
			</p>
			<form method="post" action="?/cancelDeletion" use:enhance>
				<button class="btn-primary" type="submit">Cancel deletion</button>
			</form>
		</div>
	{/if}

	<div class="privacy-row">
		<a class="btn-ghost" href="/account/export" download>Export my data (JSON)</a>

		{#if !data.pendingDeletion}
			{#if confirmingDeletion}
				<form method="post" action="?/requestDeletion" use:enhance class="privacy-row">
					<textarea
						class="reason"
						name="reason"
						rows="2"
						placeholder="Optional: tell us why (audited, not required)"
					></textarea>
					<button class="btn-danger" type="submit">Confirm deletion</button>
					<button class="btn-link" type="button" onclick={() => (confirmingDeletion = false)}>
						Cancel
					</button>
				</form>
			{:else}
				<button class="btn-danger-ghost" type="button" onclick={() => (confirmingDeletion = true)}>
					Request account deletion
				</button>
			{/if}
		{/if}
	</div>

	{#if form && 'message' in form && form.message}
		<p class="error" role="alert" style="margin-top: var(--space-3);">{form.message}</p>
	{/if}
</section>

<style>
	.page-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
	}
	.page-head h1 {
		margin: 0;
		font-size: var(--fs-2xl);
	}
	.lede {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
	}
	.card h2 {
		margin: 0 0 var(--space-1);
		font-size: var(--fs-xl);
	}
	.muted {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-5);
	}
	form {
		display: grid;
		gap: var(--space-4);
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
		padding: 0;
	}
	.field input,
	.field textarea {
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
	}
	.field input:focus-visible,
	.field textarea:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: var(--shadow-focus);
	}
	.radio-row {
		display: flex;
		gap: var(--space-2);
	}
	.radio {
		flex: 1;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}
	.radio:has(input:checked) {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 8%, transparent);
	}
	.radio input {
		accent-color: var(--color-accent);
	}
	.radio span {
		text-transform: capitalize;
	}
	.checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text);
	}
	.checkbox input {
		accent-color: var(--color-accent);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
	}
	.btn-primary {
		padding: var(--space-3) var(--space-5);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-ghost {
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		cursor: pointer;
	}
	.btn-ghost:hover {
		border-color: var(--color-border-strong);
	}
	.error {
		color: var(--color-danger);
		margin: 0;
	}
	.ok {
		color: var(--color-success, #16a34a);
		margin: var(--space-1) 0 0;
	}
	.warn {
		color: var(--color-warning, #d97706);
		margin: var(--space-1) 0 0;
	}
	.billing-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}
	.billing-actions a.btn-primary {
		text-decoration: none;
		display: inline-block;
	}
	.danger {
		border-color: color-mix(in oklab, var(--color-danger) 35%, var(--color-border));
	}
	.danger h2 {
		color: var(--color-danger);
	}
	.privacy-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
	}
	.btn-danger {
		padding: var(--space-3) var(--space-5);
		background: var(--color-danger);
		color: #fff;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
	}
	.btn-danger-ghost {
		padding: var(--space-3) var(--space-5);
		background: transparent;
		border: 1px solid var(--color-danger);
		color: var(--color-danger);
		border-radius: var(--radius-md);
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
	.pending-deletion {
		background: color-mix(in oklab, var(--color-danger) 10%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-danger) 35%, var(--color-border));
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}
	.pending-deletion strong {
		color: var(--color-danger);
	}
	textarea.reason {
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
		min-width: 320px;
	}
</style>
