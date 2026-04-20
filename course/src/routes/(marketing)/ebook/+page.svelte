<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
	const prev: { email: string; name: string } = $derived.by(() => {
		if (form && 'values' in form && form.values) {
			const v = form.values as Record<string, unknown>;
			return {
				email: typeof v.email === 'string' ? v.email : '',
				name: typeof v.name === 'string' ? v.name : ''
			};
		}
		return { email: '', name: '' };
	});
</script>

<svelte:head>
	<title>Free ebook: Options 101 Starter — Trade Flex</title>
	<meta
		name="description"
		content="Options 101 Starter — a 40-page PDF covering the exact mental model we use to price risk before every trade."
	/>
</svelte:head>

<section class="wrap">
	<div class="grid">
		<div class="cover">
			<div class="book">
				<span class="label">Trade Flex Free Download</span>
				<strong>Options 101 Starter</strong>
				<span class="sub">The pricing-risk primer</span>
			</div>
		</div>

		<div class="copy">
			<h1>Options 101 Starter</h1>
			<p class="lede">
				A 40-page PDF covering the exact mental model we use before every options trade:
				probability, risk, sizing, and when to walk away.
			</p>
			<ul class="points">
				<li>The "three questions" we ask before any setup</li>
				<li>Why most beginner strategies are short gamma in disguise</li>
				<li>A sizing worksheet you can use from the next trading day</li>
				<li>Six common mistakes, with real trade logs</li>
			</ul>

			{#if form && 'success' in form && form.success}
				<div class="success" role="status">
					<p>
						<strong>{form.created ? "Thanks — you're on the list." : 'Welcome back.'}</strong>
					</p>
					<p>Your download is ready.</p>
					<a class="btn-primary" href={form.downloadUrl}>Download PDF →</a>
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
						<span>Your name (optional)</span>
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
							placeholder="you@you.com"
						/>
					</label>

					<label class="checkbox">
						<input type="checkbox" name="optIn" checked />
						<span>Send me weekly trading notes (no spam, unsubscribe any time).</span>
					</label>

					{#if form && 'message' in form && form.message}
						<p class="error" role="alert">{form.message}</p>
					{/if}

					<button class="btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Sending…' : 'Get the ebook'}
					</button>
					<p class="note">
						By signing up you agree to our <a href="/legal/privacy">privacy policy</a>. We don't
						share your email.
					</p>
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
	.grid {
		display: grid;
		gap: var(--space-7);
		grid-template-columns: 1fr;
		align-items: start;
	}
	@media (min-width: 840px) {
		.grid {
			grid-template-columns: 340px 1fr;
		}
	}
	.cover {
		display: flex;
		justify-content: center;
	}
	.book {
		aspect-ratio: 3 / 4;
		width: 100%;
		max-width: 300px;
		background: linear-gradient(
			135deg,
			var(--color-accent) 0%,
			color-mix(in oklab, var(--color-accent) 70%, var(--color-bg)) 100%
		);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-shadow: var(--shadow-3);
	}
	.book .label {
		font-size: var(--fs-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.8;
	}
	.book strong {
		font-size: var(--fs-2xl);
		line-height: var(--lh-tight);
	}
	.book .sub {
		font-size: var(--fs-sm);
		opacity: 0.85;
	}
	.copy h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-3);
		line-height: var(--lh-tight);
	}
	.lede {
		color: var(--color-text-muted);
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-4);
		line-height: var(--lh-relaxed);
	}
	.points {
		margin: 0 0 var(--space-5);
		padding-left: var(--space-5);
		color: var(--color-text);
		line-height: var(--lh-relaxed);
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
	.field input {
		padding: var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font: inherit;
	}
	.field input:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: var(--shadow-focus);
	}
	.checkbox {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		color: var(--color-text);
		font-size: var(--fs-sm);
	}
	.checkbox input {
		accent-color: var(--color-accent);
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
		text-decoration: none;
		display: inline-block;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.error {
		color: var(--color-danger);
		margin: 0;
	}
	.note {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		margin: 0;
	}
	.note a {
		color: var(--color-accent);
	}
	.success {
		padding: var(--space-5);
		border: 1px solid var(--color-success);
		border-radius: var(--radius-lg);
		background: color-mix(in oklab, var(--color-success) 8%, transparent);
		display: grid;
		gap: var(--space-3);
		justify-items: start;
	}
	.success p {
		margin: 0;
	}
</style>
