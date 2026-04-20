<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
	const prev: { email: string; name: string; topic: string; message: string } = $derived.by(() => {
		if (form && 'values' in form && form.values) {
			const v = form.values as Record<string, unknown>;
			return {
				email: typeof v.email === 'string' ? v.email : '',
				name: typeof v.name === 'string' ? v.name : '',
				topic: typeof v.topic === 'string' ? v.topic : 'other',
				message: typeof v.message === 'string' ? v.message : ''
			};
		}
		return { email: '', name: '', topic: 'other', message: '' };
	});
</script>

<svelte:head><title>Contact — Trade Flex</title></svelte:head>

<section class="wrap">
	<header>
		<h1>Contact</h1>
		<p class="lede">
			Support requests, press, partnerships — send a note and we'll get back within one business
			day.
		</p>
	</header>

	<div class="grid">
		<div>
			<h2>Direct email</h2>
			<ul class="direct">
				<li>Support <a href="mailto:support@tradeflex.app">support@tradeflex.app</a></li>
				<li>Press + partnerships <a href="mailto:hello@tradeflex.app">hello@tradeflex.app</a></li>
				<li>Members can also open a ticket under <em>Account → Help</em>.</li>
			</ul>
		</div>

		<div>
			{#if form && 'success' in form && form.success}
				<div class="success" role="status">
					<strong>Thanks — we got it.</strong>
					<p>We aim to reply within one business day.</p>
				</div>
			{:else}
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
						<span>Topic</span>
						<select name="topic" value={prev.topic}>
							<option value="support">Support</option>
							<option value="press">Press</option>
							<option value="partnership">Partnership</option>
							<option value="other">Other</option>
						</select>
					</label>

					<label class="field">
						<span>Your name</span>
						<input name="name" value={prev.name} autocomplete="name" />
					</label>

					<label class="field">
						<span>Your email</span>
						<input
							name="email"
							type="email"
							required
							autocomplete="email"
							value={prev.email}
						/>
					</label>

					<label class="field">
						<span>Message</span>
						<textarea name="message" rows="5" required maxlength="2000">{prev.message}</textarea>
					</label>

					{#if form && 'message' in form && form.message}
						<p class="error" role="alert">{form.message}</p>
					{/if}

					<button class="btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Sending…' : 'Send message'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</section>

<style>
	.wrap {
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-9) var(--space-6);
	}
	header h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	.lede {
		color: var(--color-text-muted);
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-7);
	}
	.grid {
		display: grid;
		gap: var(--space-7);
		grid-template-columns: 1fr;
	}
	@media (min-width: 760px) {
		.grid {
			grid-template-columns: 1fr 1.4fr;
		}
	}
	.direct {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
		color: var(--color-text-muted);
	}
	.direct a {
		color: var(--color-accent);
		display: block;
		font-weight: 600;
		word-break: break-all;
	}
	h2 {
		font-size: var(--fs-xl);
		margin: 0 0 var(--space-3);
	}
	form {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}
	.field {
		display: grid;
		gap: var(--space-1);
	}
	.field span {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.field input,
	.field select,
	.field textarea {
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
	}
	.field input:focus-visible,
	.field select:focus-visible,
	.field textarea:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: var(--shadow-focus);
	}
	.btn-primary {
		padding: var(--space-3) var(--space-5);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		justify-self: start;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.error {
		color: var(--color-danger);
		margin: 0;
	}
	.success {
		padding: var(--space-5);
		border: 1px solid var(--color-success);
		border-radius: var(--radius-lg);
		background: color-mix(in oklab, var(--color-success) 8%, transparent);
		display: grid;
		gap: var(--space-2);
	}
	.success p {
		margin: 0;
		color: var(--color-text-muted);
	}
</style>
