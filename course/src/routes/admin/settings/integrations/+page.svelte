<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state<string | null>(null);
	let toast = $state<string | null>(null);

	$effect(() => {
		if (form && 'success' in form && form.success) {
			toast = `Saved ${form.key}`;
			editing = null;
			const t = setTimeout(() => (toast = null), 2500);
			return () => clearTimeout(t);
		}
	});

	const groups = $derived.by(() => {
		const byGroup: Record<string, typeof data.rows> = {};
		for (const r of data.rows) {
			(byGroup[r.group] ??= []).push(r);
		}
		return Object.entries(byGroup);
	});
</script>

<svelte:head><title>Integrations — Admin</title></svelte:head>

<header>
	<h1>Integrations</h1>
	<p>
		API keys and shared configuration. Encrypted values are stored with AES-256-GCM using
		<code>APP_ENCRYPTION_KEY</code>. Missing keys fall back to <code>.env</code> at boot.
	</p>
</header>

{#each groups as [groupName, rows]}
	<section class="group">
		<h2>{groupName}</h2>
		<div class="rows">
			{#each rows as row}
				<div class="row">
					<div class="meta">
						<div class="key">
							<code>{row.key}</code>
							{#if row.encrypted}
								<span class="pill encrypted">encrypted</span>
							{:else}
								<span class="pill plain">plain</span>
							{/if}
							{#if row.configured}
								<span class="pill ok">configured</span>
							{:else}
								<span class="pill missing">not set</span>
							{/if}
						</div>
						<div class="label">{row.label}</div>
						<div class="help">{row.help}</div>
						{#if row.configured}
							<div class="status">
								Current: <code class="mask">{row.mask ?? '••••'}</code> ·
								<span class="dim">updated {row.updatedAt ?? 'recently'}</span>
							</div>
						{/if}
					</div>

					<div class="edit">
						{#if editing === row.key}
							<form
								method="post"
								action="?/save"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="key" value={row.key} />
								<input
									type={row.encrypted ? 'password' : 'text'}
									name="value"
									placeholder={row.encrypted ? 'Paste new secret' : 'Enter value'}
									autocomplete="off"
									required
								/>
								<div class="btns">
									<button class="btn-primary" type="submit">Save</button>
									<button class="btn-ghost" type="button" onclick={() => (editing = null)}
										>Cancel</button
									>
								</div>
							</form>
						{:else}
							<button class="btn-ghost" type="button" onclick={() => (editing = row.key)}>
								{row.configured ? 'Rotate' : 'Set'}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</section>
{/each}

{#if toast}
	<div class="toast" role="status">{toast}</div>
{/if}

<style>
	header h1 {
		font-size: var(--fs-2xl);
		margin: 0 0 var(--space-2);
	}
	header p {
		color: var(--color-text-muted);
		max-width: 60ch;
		margin: 0 0 var(--space-6);
	}
	.group {
		margin-bottom: var(--space-6);
	}
	.group h2 {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-3);
	}
	.rows {
		display: grid;
		gap: var(--space-3);
	}
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-4);
		align-items: start;
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	.key {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}
	.key code {
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
	}
	.label {
		margin-top: var(--space-1);
		font-weight: 500;
	}
	.help {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin-top: var(--space-1);
	}
	.status {
		margin-top: var(--space-2);
		font-size: var(--fs-sm);
		color: var(--color-text-muted);
	}
	.mask {
		font-family: var(--ff-mono);
		color: var(--color-text);
	}
	.dim {
		color: var(--color-text-subtle);
	}
	.pill {
		font-size: var(--fs-xs);
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--color-surface-2);
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}
	.pill.encrypted {
		border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-border));
		color: var(--color-accent);
	}
	.pill.ok {
		border-color: color-mix(in oklab, var(--color-success) 50%, var(--color-border));
		color: var(--color-success);
	}
	.pill.missing {
		border-color: color-mix(in oklab, var(--color-warning) 50%, var(--color-border));
		color: var(--color-warning);
	}
	.edit form {
		display: grid;
		gap: var(--space-2);
	}
	.edit input {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-family: var(--ff-mono);
		background: var(--color-bg);
		color: var(--color-text);
		min-width: 280px;
	}
	.btns {
		display: flex;
		gap: var(--space-2);
	}
	.btn-primary {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-weight: 500;
	}
	.btn-ghost {
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--color-text);
	}
	.btn-ghost:hover {
		border-color: var(--color-border-strong);
	}
	.toast {
		position: fixed;
		bottom: var(--space-5);
		right: var(--space-5);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-3);
		z-index: var(--z-toast);
	}
</style>
