<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in — Trade Flex</title></svelte:head>

<header>
	<h2>Welcome back</h2>
	<p>Sign in to your Trade Flex account.</p>
</header>

<form
	method="post"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	<input type="hidden" name="next" value={data.next} />

	<label class="field">
		<span>Email</span>
		<input type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
	</label>

	<label class="field">
		<span>Password</span>
		<input type="password" name="password" autocomplete="current-password" required />
	</label>

	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}

	<button class="btn-primary" type="submit" disabled={submitting}>
		{submitting ? 'Signing in…' : 'Sign in'}
	</button>
</form>

<div class="divider"><span>or</span></div>

<form method="post" action="?/github" use:enhance>
	<button class="btn-ghost" type="submit">Continue with GitHub</button>
</form>

<p class="foot">
	No account yet? <a href="/register">Create one →</a><br />
	<a class="muted" href="/forgot">Forgot password?</a>
</p>

<style>
	header h2 {
		font-size: var(--fs-2xl);
		margin: 0 0 var(--space-1);
	}
	header p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-5);
	}
	form {
		display: grid;
		gap: var(--space-3);
	}
	.field {
		display: grid;
		gap: var(--space-1);
	}
	.field span {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.field input {
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font-size: var(--fs-md);
	}
	.field input:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 25%, transparent);
	}
	.btn-primary {
		padding: var(--space-3) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: transform var(--dur-1) var(--ease-out-quart);
	}
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-ghost {
		width: 100%;
		padding: var(--space-3) var(--space-4);
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
		font-size: var(--fs-sm);
		margin: 0;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--color-text-subtle);
		font-size: var(--fs-sm);
		margin: var(--space-5) 0;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-border);
	}
	.foot {
		margin-top: var(--space-5);
		text-align: center;
		color: var(--color-text-muted);
	}
	.foot a {
		color: var(--color-text);
	}
	.muted {
		color: var(--color-text-subtle) !important;
	}
</style>
