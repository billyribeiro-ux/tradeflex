<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let composeTo = $state('');
	let composeSubject = $state('');
	let composeText = $state('');
	let sending = $state(false);

	$effect(() => {
		if (form?.error) {
			composeTo = form.to ?? composeTo;
			composeSubject = form.subject ?? composeSubject;
			composeText = form.text ?? composeText;
		}
	});

	function fmt(d: Date | string) {
		const dt = typeof d === 'string' ? new Date(d) : d;
		const diff = Date.now() - dt.getTime();
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		return dt.toLocaleDateString();
	}
</script>

<svelte:head><title>Inbox — Admin</title></svelte:head>

<header class="hd">
	<div>
		<h1>Inbox</h1>
		<p>Compose transactional email, review history, trace every send.</p>
	</div>
	{#if data.resendConfigured}
		<span class="chip ok">Resend ready · from <code>{data.fromAddress ?? 'default'}</code></span>
	{:else}
		<span class="chip warn">
			Resend not configured — <a href={resolve('/admin/settings/integrations')}>add key</a>
		</span>
	{/if}
</header>

{#if form?.error}
	<div class="callout err">{form.error}</div>
{/if}

<section class="layout">
	<aside class="threads">
		<header>
			<h2>Threads</h2>
			<span class="muted">{data.threads.length}</span>
		</header>
		{#if data.threads.length === 0}
			<p class="empty">No sends yet. Compose one →</p>
		{:else}
			<ul>
				{#each data.threads as t (t.threadKey)}
					{@const active = data.openKey === t.threadKey}
					<li class:active>
						<a href={resolve(`/admin/inbox?thread=${encodeURIComponent(t.threadKey)}`)}>
							<div class="to">{t.toAddress}</div>
							<div class="subject">{t.subject}</div>
							<div class="meta">
								<span>{fmt(t.lastAt)}</span>
								<span class="dot"></span>
								<span>{t.messageCount} msg</span>
								<span class="dot"></span>
								<span class="status status-{t.lastStatus}">{t.lastStatus}</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</aside>

	<section class="right">
		{#if data.openKey && data.openThread.length > 0}
			<article class="thread-view">
				<header class="thread-head">
					<h2>{data.openThread[0].subject}</h2>
					<p class="muted">to {data.openThread[0].toAddress}</p>
					<a class="close" href={page.url.pathname}>Close</a>
				</header>
				<ul class="messages">
					{#each data.openThread as m (m.id)}
						<li class="msg msg-{m.direction}">
							<div class="msg-head">
								<span class="dir">{m.direction === 'outbound' ? '→ Sent' : '← Received'}</span>
								<span class="muted">{fmt(m.createdAt)}</span>
								<span class="status status-{m.status}">{m.status}</span>
							</div>
							{#if m.status === 'failed' && m.errorReason}
								<div class="err-line">Resend error: {m.errorReason}</div>
							{/if}
							<pre>{m.text}</pre>
						</li>
					{/each}
				</ul>
			</article>
		{/if}

		<article class="compose">
			<header class="compose-head">
				<h2>{data.openKey ? 'Reply' : 'Compose'}</h2>
				<p class="muted">Audited · tagged · every send persisted.</p>
			</header>
			<form
				method="POST"
				action="?/send"
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update({ reset: true });
						composeTo = '';
						composeSubject = '';
						composeText = '';
						sending = false;
					};
				}}
			>
				<label>
					<span>To</span>
					<input
						name="to"
						type="email"
						bind:value={composeTo}
						required
						placeholder="member@example.com"
					/>
				</label>
				<label>
					<span>Subject</span>
					<input
						name="subject"
						type="text"
						bind:value={composeSubject}
						required
						placeholder="Your Trade Flex subscription"
					/>
				</label>
				<label>
					<span>Message</span>
					<textarea
						name="text"
						bind:value={composeText}
						required
						rows="8"
						placeholder="Write a clear, plain-text message…"
					></textarea>
				</label>
				<div class="actions">
					<button type="submit" class="btn-primary" disabled={sending || !data.resendConfigured}>
						{sending ? 'Sending…' : 'Send'}
					</button>
					{#if !data.resendConfigured}
						<span class="hint">Resend must be configured in Integrations first.</span>
					{/if}
				</div>
			</form>
		</article>
	</section>
</section>

<style>
	.hd {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
		flex-wrap: wrap;
	}
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-pill);
		font-size: var(--fs-sm);
		border: 1px solid var(--color-border);
	}
	.chip.ok {
		border-color: color-mix(in oklab, var(--color-success) 40%, transparent);
		color: var(--color-success);
	}
	.chip.warn {
		border-color: color-mix(in oklab, var(--color-warning) 40%, transparent);
		color: var(--color-warning);
	}
	.chip a {
		color: inherit;
		text-decoration: underline;
	}
	.callout.err {
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-danger);
		background: color-mix(in oklab, var(--color-danger) 8%, transparent);
		color: var(--color-danger);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-4);
	}
	.layout {
		display: grid;
		grid-template-columns: 340px 1fr;
		gap: var(--space-4);
		align-items: start;
	}
	.threads {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		max-height: 70vh;
		overflow: auto;
	}
	.threads header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: var(--space-3);
	}
	.threads h2 {
		margin: 0;
		font-size: var(--fs-lg);
	}
	.threads ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.threads li a {
		display: block;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: inherit;
	}
	.threads li a:hover {
		background: var(--color-surface-2);
	}
	.threads li.active a {
		background: var(--color-surface-2);
		outline: 1px solid var(--color-accent);
	}
	.to {
		font-weight: 500;
		font-size: var(--fs-sm);
	}
	.subject {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		margin-top: var(--space-1);
	}
	.dot {
		width: 3px;
		height: 3px;
		background: currentColor;
		border-radius: 50%;
		opacity: 0.5;
	}
	.right {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.thread-view,
	.compose {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-5);
	}
	.thread-head {
		position: relative;
		margin-bottom: var(--space-4);
	}
	.thread-head h2 {
		margin: 0;
		font-size: var(--fs-lg);
	}
	.close {
		position: absolute;
		right: 0;
		top: 0;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.messages {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.msg {
		padding: var(--space-3);
		border-radius: var(--radius-sm);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
	}
	.msg-head {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--space-2);
	}
	.dir {
		font-weight: 500;
		color: var(--color-text);
	}
	.msg pre {
		margin: 0;
		white-space: pre-wrap;
		font-family: var(--ff-sans);
		font-size: var(--fs-sm);
	}
	.err-line {
		color: var(--color-danger);
		font-size: var(--fs-xs);
		margin-bottom: var(--space-2);
	}
	.status {
		padding: 1px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.status-sent {
		background: color-mix(in oklab, var(--color-success) 15%, transparent);
		color: var(--color-success);
	}
	.status-failed {
		background: color-mix(in oklab, var(--color-danger) 15%, transparent);
		color: var(--color-danger);
	}
	.compose-head {
		margin-bottom: var(--space-4);
	}
	.compose-head h2 {
		margin: 0;
		font-size: var(--fs-lg);
	}
	.compose form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.compose label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-sm);
	}
	.compose label span {
		color: var(--color-text-muted);
	}
	.compose input,
	.compose textarea {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font: inherit;
	}
	.compose textarea {
		resize: vertical;
		font-family: var(--ff-sans);
	}
	.actions {
		display: flex;
		gap: var(--space-3);
		align-items: center;
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
	.muted {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.empty {
		color: var(--color-text-muted);
		padding: var(--space-4);
		text-align: center;
	}
	code {
		font-family: var(--ff-mono);
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
