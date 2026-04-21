<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Create account — Trade Flex</title></svelte:head>

<header>
	<h2>Create your account</h2>
	<p>Join thousands of traders using Trade Flex.</p>
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
	<label class="field">
		<span>Full name</span>
		<input name="name" autocomplete="name" required value={form?.name ?? ''} />
	</label>

	<label class="field">
		<span>Email</span>
		<input type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
	</label>

	<label class="field">
		<span>Password</span>
		<input type="password" name="password" autocomplete="new-password" required minlength="10" />
		<small>At least 10 characters.</small>
	</label>

	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}

	<button class="btn-primary" type="submit" disabled={submitting}>
		{submitting ? 'Creating…' : 'Create account'}
	</button>
</form>

<p class="foot">
	Already have an account? <a href={resolve('/login')}>Sign in →</a>
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
	.field small {
		color: var(--color-text-subtle);
		font-size: var(--fs-xs);
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
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.error {
		color: var(--color-danger);
		font-size: var(--fs-sm);
		margin: 0;
	}
	.foot {
		margin-top: var(--space-5);
		text-align: center;
		color: var(--color-text-muted);
	}
	.foot a {
		color: var(--color-text);
	}
</style>
