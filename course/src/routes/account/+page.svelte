<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	let toast = $state<string | null>(null);

	$effect(() => {
		if (form && 'success' in form && form.success) {
			toast = 'Profile saved';
			const t = setTimeout(() => (toast = null), 2500);
			return () => clearTimeout(t);
		}
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
			<input
				name="displayName"
				required
				value={prevValues.displayName || (p?.displayName ?? '')}
			/>
		</label>

		<label class="field">
			<span>Bio</span>
			<textarea name="bio" rows="3" maxlength="500"
				>{prevValues.bio || (p?.bio ?? '')}</textarea
			>
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
						<input
							type="radio"
							name="theme"
							value={t}
							checked={(p?.theme ?? 'system') === t}
						/>
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

{#if toast}
	<div class="toast" role="status">{toast}</div>
{/if}

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
	.toast {
		position: fixed;
		bottom: var(--space-5);
		right: var(--space-5);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-3);
		z-index: var(--z-toast);
	}
</style>
