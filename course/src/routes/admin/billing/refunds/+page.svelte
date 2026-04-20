<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const viewerId = $derived(data.viewerId);
	const pending = $derived(data.requests.filter((r) => r.status === 'pending'));
	const history = $derived(data.requests.filter((r) => r.status !== 'pending'));

	function fmt(d: Date | string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleString();
	}

	function money(cents: number, currency: string): string {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: currency.toUpperCase()
		}).format(cents / 100);
	}
</script>

<svelte:head><title>Refunds — Admin</title></svelte:head>

<header class="hd">
	<h1>Refund requests</h1>
	<p>
		Two-person rule: whoever files the request cannot approve it. Approvals run a real Stripe refund
		with the request ID as the idempotency key.
	</p>
</header>

{#if form && 'message' in form && form.message}
	<p class="error" role="alert"><strong>{form.action}:</strong> {form.message}</p>
{:else if form && 'ok' in form && form.ok}
	<p class="ok" role="status">
		{#if 'stripeRefundId' in form && form.stripeRefundId}
			Refund approved · Stripe id <code>{form.stripeRefundId}</code>
		{:else if 'denied' in form}
			Request denied.
		{:else}
			Refund request filed.
		{/if}
	</p>
{/if}

<section class="card">
	<h2>File a new request</h2>
	<form method="post" action="?/request" use:enhance class="grid">
		<label>
			<span>Payment intent</span>
			<input name="paymentIntentId" required placeholder="pi_..." pattern="pi_.+" />
		</label>
		<label>
			<span>Amount (cents)</span>
			<input name="amountCents" type="number" min="1" required />
		</label>
		<label>
			<span>Currency</span>
			<input name="currency" value="usd" required maxlength="3" />
		</label>
		<label>
			<span>Customer id (optional)</span>
			<input name="customerId" placeholder="cus_..." />
		</label>
		<label>
			<span>Subject user id (optional)</span>
			<input name="subjectUserId" />
		</label>
		<label class="full">
			<span>Reason</span>
			<textarea name="reason" required rows="2" minlength="3"></textarea>
		</label>
		<div class="actions full">
			<button type="submit">File request</button>
		</div>
	</form>
</section>

<section>
	<h2>Pending ({pending.length})</h2>
	{#if pending.length === 0}
		<p class="empty">Nothing awaiting decision.</p>
	{:else}
		<ul class="list">
			{#each pending as r (r.id)}
				{@const selfFiled = r.requestedByUserId === viewerId}
				<li class="req">
					<div class="top">
						<strong>{money(r.amountCents, r.currency)}</strong>
						<code>{r.stripePaymentIntentId}</code>
						<span class="dim">· filed {fmt(r.requestedAt)}</span>
					</div>
					<p class="reason">{r.reason}</p>
					<div class="meta">
						<span>Requester: <code>{r.requestedByUserId}</code></span>
						{#if selfFiled}
							<span class="chip chip-warn">you filed this · approval blocked</span>
						{/if}
					</div>
					<div class="row">
						<form method="post" action="?/approve" use:enhance class="inline">
							<input type="hidden" name="id" value={r.id} />
							<input name="note" placeholder="Approval note (optional)" />
							<button type="submit" disabled={selfFiled} class="btn-approve">Approve</button>
						</form>
						<form method="post" action="?/deny" use:enhance class="inline">
							<input type="hidden" name="id" value={r.id} />
							<input name="note" required placeholder="Denial reason (required)" />
							<button type="submit" disabled={selfFiled} class="btn-deny">Deny</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section>
	<h2>History ({history.length})</h2>
	{#if history.length === 0}
		<p class="empty">No decided requests yet.</p>
	{:else}
		<ul class="list">
			{#each history as r (r.id)}
				<li class="req req-{r.status}">
					<div class="top">
						<span class="chip chip-{r.status}">{r.status}</span>
						<strong>{money(r.amountCents, r.currency)}</strong>
						<code>{r.stripePaymentIntentId}</code>
						{#if r.stripeRefundId}
							<span class="dim">· refund <code>{r.stripeRefundId}</code></span>
						{/if}
					</div>
					<p class="reason">{r.reason}</p>
					{#if r.decisionNote}
						<p class="note">Decision: {r.decisionNote}</p>
					{/if}
					<div class="meta">
						<span>Filed <code>{r.requestedByUserId}</code> · {fmt(r.requestedAt)}</span>
						{#if r.decidedByUserId}
							<span>Decided <code>{r.decidedByUserId}</code> · {fmt(r.decidedAt)}</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.hd {
		margin-block-end: var(--space-6);
	}
	.hd h1 {
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin-block-start: var(--space-2);
		max-inline-size: 60ch;
	}
	section + section {
		margin-block-start: var(--space-8);
	}
	h2 {
		font-size: var(--font-size-lg);
		margin-block-end: var(--space-3);
	}
	.card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-5);
		background: var(--color-surface);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-3);
	}
	.grid label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
	}
	.grid .full {
		grid-column: 1 / -1;
	}
	.grid input,
	.grid textarea {
		font: inherit;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-raised);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
	}
	.actions button {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: 0;
		cursor: pointer;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.req {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		background: var(--color-surface);
	}
	.req-approved {
		border-left: 4px solid var(--color-success, #16a34a);
	}
	.req-denied {
		border-left: 4px solid var(--color-danger, #b91c1c);
	}
	.req-failed {
		border-left: 4px solid var(--color-warn, #d97706);
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: baseline;
	}
	.top code,
	.meta code {
		font-size: var(--font-size-sm);
	}
	.dim {
		color: var(--color-text-muted);
	}
	.reason {
		margin: var(--space-2) 0 var(--space-3);
	}
	.note {
		margin: 0 0 var(--space-2);
		font-style: italic;
		color: var(--color-text-muted);
	}
	.meta {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
	.row {
		display: flex;
		gap: var(--space-3);
		margin-block-start: var(--space-3);
		flex-wrap: wrap;
	}
	.inline {
		display: flex;
		gap: var(--space-2);
		flex: 1;
		min-inline-size: 260px;
	}
	.inline input[name='note'] {
		flex: 1;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}
	.inline button {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		border: 0;
		cursor: pointer;
	}
	.btn-approve {
		background: var(--color-success, #16a34a);
		color: white;
	}
	.btn-deny {
		background: var(--color-danger, #b91c1c);
		color: white;
	}
	.btn-approve:disabled,
	.btn-deny:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.chip {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: var(--font-size-xs);
		background: var(--color-surface-raised);
		border: 1px solid var(--color-border);
	}
	.chip-warn {
		background: var(--color-warn-bg, #fef3c7);
		border-color: var(--color-warn, #d97706);
	}
	.chip-approved {
		background: #dcfce7;
		border-color: #16a34a;
	}
	.chip-denied {
		background: #fee2e2;
		border-color: #b91c1c;
	}
	.chip-failed {
		background: #fef3c7;
		border-color: #d97706;
	}
	.ok {
		color: var(--color-success, #16a34a);
	}
	.error {
		color: var(--color-danger, #b91c1c);
	}
	.empty {
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
