<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let body = $state('');
	let sending = $state(false);

	$effect(() => {
		if (form?.error && form?.body) body = form.body;
	});

	function fmt(d: Date | string) {
		return new Date(d).toLocaleString();
	}

	const canReply = $derived(data.ticket.status !== 'closed' && data.ticket.status !== 'resolved');
</script>

<svelte:head><title>{data.ticket.subject} — Support</title></svelte:head>

<div class="breadcrumb"><a href="/account/support">← All tickets</a></div>

<header>
	<h1>{data.ticket.subject}</h1>
	<p class="muted">
		<span class="pill status-{data.ticket.status}">{data.ticket.status.replace('_', ' ')}</span>
		· opened {fmt(data.ticket.createdAt)}
	</p>
</header>

<section class="thread">
	{#each data.messages as m (m.id)}
		<article class="msg msg-{m.authorKind}">
			<header>
				<span class="who">{m.authorKind === 'staff' ? 'Trade Flex support' : 'You'}</span>
				<span class="when">{fmt(m.createdAt)}</span>
			</header>
			<pre>{m.body}</pre>
		</article>
	{/each}
</section>

{#if canReply}
	{#if form?.error}<p class="err">{form.error}</p>{/if}
	<form
		method="POST"
		action="?/reply"
		class="reply"
		use:enhance={() => {
			sending = true;
			return async ({ update }) => {
				await update({ reset: true });
				body = '';
				sending = false;
			};
		}}
	>
		<label>
			<span>Add a message</span>
			<textarea name="body" bind:value={body} rows="5" required></textarea>
		</label>
		<button type="submit" class="btn-primary" disabled={sending}>
			{sending ? 'Sending…' : 'Send'}
		</button>
	</form>
{:else}
	<p class="muted closed-note">
		This ticket is {data.ticket.status}. Open a new ticket if you need more help.
	</p>
{/if}

<style>
	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	h1 {
		font-size: var(--fs-2xl);
		margin: var(--space-3) 0 var(--space-1);
	}
	.muted {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin: 0 0 var(--space-4);
	}
	.pill {
		display: inline-block;
		padding: 1px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		border: 1px solid var(--color-border);
		text-transform: capitalize;
	}
	.status-open {
		color: var(--color-warning);
		background: color-mix(in oklab, var(--color-warning) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-warning) 40%, transparent);
	}
	.status-in_progress {
		color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-accent) 40%, transparent);
	}
	.status-resolved {
		color: var(--color-success);
		background: color-mix(in oklab, var(--color-success) 15%, transparent);
		border-color: color-mix(in oklab, var(--color-success) 40%, transparent);
	}
	.thread {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}
	.msg {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		background: var(--color-surface);
	}
	.msg-staff {
		background: color-mix(in oklab, var(--color-accent) 4%, var(--color-surface));
		border-left: 3px solid var(--color-accent);
	}
	.msg header {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-2);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
	}
	.who {
		font-weight: 500;
		color: var(--color-text);
	}
	.msg pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: var(--ff-sans);
	}
	.err {
		color: var(--color-danger);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-3);
	}
	.reply {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.reply label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-sm);
	}
	.reply label span {
		color: var(--color-text-muted);
	}
	textarea {
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
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
	.closed-note {
		padding: var(--space-4);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		text-align: center;
	}
</style>
