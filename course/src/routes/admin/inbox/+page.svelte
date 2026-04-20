<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Inbox — Admin</title></svelte:head>

<header class="hd">
	<h1>Inbox</h1>
	<p>Resend-backed conversation log: replies to member emails, bounces, complaints.</p>
</header>

{#if !data.resendConfigured}
	<div class="callout warn">
		<strong>Resend not configured.</strong> Add <code>RESEND_API_KEY</code> and
		<code>RESEND_FROM</code> in <a href="/admin/settings/integrations">Integrations</a> to start
		sending and receiving through the inbox.
	</div>
{:else}
	<div class="callout ok">
		Resend configured. From address: <code>{data.fromAddress ?? 'not set'}</code>.
	</div>
{/if}

<section class="layout">
	<aside class="threads">
		<input type="search" placeholder="Search threads…" disabled />
		<div class="thread-list empty">
			<p>Threads will appear as members reply to transactional mail and as you reach out via <code>/admin/members</code>.</p>
		</div>
	</aside>
	<section class="thread-view empty">
		<p>Select a thread to reply. Drafts autosave. Replies are audited + traced by message-id.</p>
	</section>
</section>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-5);
	}
	.callout {
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-warning);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		margin-bottom: var(--space-5);
	}
	.callout.ok {
		border-left-color: var(--color-success);
	}
	.callout a {
		color: var(--color-accent);
	}
	code {
		font-family: var(--ff-mono);
		background: var(--color-surface-2);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
	}
	.layout {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: var(--space-4);
		min-height: 500px;
	}
	.threads {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.threads input {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
	}
	.thread-list {
		flex: 1;
	}
	.thread-view {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-6);
	}
	.empty {
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
