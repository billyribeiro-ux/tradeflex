<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let subject = $state('');
	let body = $state('');
	let category = $state<'billing' | 'access' | 'bug' | 'feature' | 'other'>('other');
	let submitting = $state(false);

	$effect(() => {
		if (form?.error) {
			subject = form.subject ?? subject;
			body = form.body ?? body;
			category = (form.category as typeof category) ?? category;
		}
	});

	function fmt(d: Date | string) {
		return new Date(d).toLocaleDateString();
	}
</script>

<svelte:head><title>Support — Trade Flex</title></svelte:head>

<h1>Support</h1>
<p class="lede">Open a ticket and we'll reply by email.</p>

<section class="new">
	<h2>New ticket</h2>
	{#if form?.error}
		<p class="err">{form.error}</p>
	{/if}
	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<label>
			<span>Subject</span>
			<input name="subject" bind:value={subject} required minlength="3" />
		</label>
		<label>
			<span>Category</span>
			<select name="category" bind:value={category}>
				<option value="billing">Billing</option>
				<option value="access">Account access</option>
				<option value="bug">Bug</option>
				<option value="feature">Feature request</option>
				<option value="other">Other</option>
			</select>
		</label>
		<label>
			<span>Describe the problem</span>
			<textarea
				name="body"
				bind:value={body}
				rows="6"
				required
				minlength="10"
				placeholder="Share steps to reproduce, what you expected, and what actually happened."
			></textarea>
		</label>
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? 'Opening…' : 'Open ticket'}
		</button>
	</form>
</section>

<section class="existing">
	<h2>Your tickets</h2>
	{#if data.tickets.length === 0}
		<p class="muted">No tickets yet.</p>
	{:else}
		<ul>
			{#each data.tickets as t (t.id)}
				<li>
					<a href={resolve(`/account/support/${t.id}`)}>
						<div class="row-subj">{t.subject}</div>
						<div class="row-meta">
							<span class="pill status-{t.status}">{t.status.replace('_', ' ')}</span>
							<span class="muted">{t.category} · opened {fmt(t.createdAt)}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-1);
	}
	.lede {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-5);
	}
	section {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-5);
		margin-bottom: var(--space-4);
	}
	section h2 {
		margin: 0 0 var(--space-4);
		font-size: var(--fs-lg);
	}
	.err {
		color: var(--color-danger);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-3);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-sm);
	}
	label span {
		color: var(--color-text-muted);
	}
	input,
	select,
	textarea {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
	}
	textarea {
		resize: vertical;
	}
	.btn-primary {
		padding: var(--space-2) var(--space-5);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		align-self: flex-start;
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.existing ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.existing li a {
		display: block;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: inherit;
	}
	.existing li a:hover {
		background: var(--color-surface-2);
	}
	.row-subj {
		font-weight: 500;
	}
	.row-meta {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		margin-top: var(--space-1);
	}
	.pill {
		display: inline-block;
		padding: 1px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		text-transform: capitalize;
	}
	.status-open {
		color: var(--color-warning);
		border-color: color-mix(in oklab, var(--color-warning) 40%, transparent);
		background: color-mix(in oklab, var(--color-warning) 15%, transparent);
	}
	.status-in_progress {
		color: var(--color-accent);
		border-color: color-mix(in oklab, var(--color-accent) 40%, transparent);
		background: color-mix(in oklab, var(--color-accent) 15%, transparent);
	}
	.status-resolved {
		color: var(--color-success);
		border-color: color-mix(in oklab, var(--color-success) 40%, transparent);
		background: color-mix(in oklab, var(--color-success) 15%, transparent);
	}
	.muted {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
</style>
