<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let body = $state('');
	let visibility = $state<'public' | 'internal'>('public');
	let sending = $state(false);

	$effect(() => {
		if (form?.error && form?.body) body = form.body;
	});

	const statuses = ['open', 'in_progress', 'resolved', 'closed'] as const;
	const priorities = ['low', 'normal', 'high', 'urgent'] as const;

	function fmt(d: Date | string) {
		return new Date(d).toLocaleString();
	}
</script>

<svelte:head><title>{data.ticket.subject} — Support</title></svelte:head>

<div class="breadcrumb"><a href="/admin/support">← All tickets</a></div>

<header class="hd">
	<div>
		<h1>{data.ticket.subject}</h1>
		<p class="muted">
			from <strong>{data.ticket.contactEmail}</strong>
			· opened {fmt(data.ticket.createdAt)}
		</p>
	</div>
	<div class="meta-forms">
		<form method="POST" action="?/setStatus" use:enhance>
			<label>
				<span>Status</span>
				<select name="status" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
					{#each statuses as s (s)}
						<option value={s} selected={data.ticket.status === s}>{s.replace('_', ' ')}</option>
					{/each}
				</select>
			</label>
		</form>
		<form method="POST" action="?/setPriority" use:enhance>
			<label>
				<span>Priority</span>
				<select name="priority" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
					{#each priorities as p (p)}
						<option value={p} selected={data.ticket.priority === p}>{p}</option>
					{/each}
				</select>
			</label>
		</form>
	</div>
</header>

<section class="thread">
	{#each data.messages as m (m.id)}
		<article class="msg msg-{m.authorKind}" class:internal={m.visibility === 'internal'}>
			<header>
				<span class="who">
					{#if m.authorKind === 'staff'}
						Staff
					{:else if m.authorKind === 'member'}
						{data.ticket.contactEmail}
					{:else}
						Guest
					{/if}
				</span>
				<span class="when">{fmt(m.createdAt)}</span>
				{#if m.visibility === 'internal'}<span class="internal-tag">internal note</span>{/if}
			</header>
			<pre>{m.body}</pre>
		</article>
	{/each}
</section>

{#if form?.error}
	<div class="err">{form.error}</div>
{/if}

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
	<input type="hidden" name="visibility" value={visibility} />
	<div class="tabs">
		<button
			type="button"
			class:active={visibility === 'public'}
			onclick={() => (visibility = 'public')}
		>
			Reply to customer
		</button>
		<button
			type="button"
			class:active={visibility === 'internal'}
			onclick={() => (visibility = 'internal')}
		>
			Internal note
		</button>
	</div>
	<textarea
		name="body"
		bind:value={body}
		rows="6"
		required
		placeholder={visibility === 'public'
			? 'Reply to the member (they will be emailed)…'
			: 'Private note visible only to staff…'}
	></textarea>
	<div class="actions">
		<button type="submit" class="btn-primary" disabled={sending}>
			{sending ? 'Sending…' : visibility === 'public' ? 'Send reply' : 'Add note'}
		</button>
		{#if visibility === 'public'}
			<span class="hint">Emails {data.ticket.contactEmail} via Resend</span>
		{/if}
	</div>
</form>

<style>
	.breadcrumb a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.hd {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--space-4);
		margin: var(--space-3) 0 var(--space-5);
		flex-wrap: wrap;
	}
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.muted {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
		font-size: var(--fs-sm);
	}
	.meta-forms {
		display: flex;
		gap: var(--space-3);
	}
	.meta-forms label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
	}
	.meta-forms select {
		padding: var(--space-1) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
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
	.msg.internal {
		background: color-mix(in oklab, var(--color-warning) 8%, var(--color-surface));
		border-left: 3px solid var(--color-warning);
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
	.internal-tag {
		padding: 1px var(--space-2);
		background: color-mix(in oklab, var(--color-warning) 20%, transparent);
		border-radius: var(--radius-pill);
		color: var(--color-warning);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.msg pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: var(--ff-sans);
	}
	.err {
		color: var(--color-danger);
		padding: var(--space-3);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-3);
	}
	.reply {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}
	.tabs {
		display: flex;
		gap: var(--space-1);
		margin-bottom: var(--space-3);
	}
	.tabs button {
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-border);
		background: transparent;
		border-radius: var(--radius-pill);
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--fs-sm);
	}
	.tabs button.active {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-color: transparent;
	}
	textarea {
		width: 100%;
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
		resize: vertical;
	}
	.actions {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-top: var(--space-3);
	}
	.btn-primary {
		padding: var(--space-2) var(--space-5);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.hint {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
</style>
