<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let toast = $state<string | null>(null);
	$effect(() => {
		if (form && 'success' in form && form.success) {
			toast = `Granted ${form.days}d grace on ${form.subId}`;
			const t = setTimeout(() => (toast = null), 3000);
			return () => clearTimeout(t);
		}
	});

	function fmtDate(d: Date | string | null): string {
		if (!d) return '—';
		const date = typeof d === 'string' ? new Date(d) : d;
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<svelte:head><title>Subscriptions — Admin</title></svelte:head>

<header class="hd">
	<h1>Subscriptions</h1>
	<p>Live view of every subscription the webhook pipeline has seen.</p>
</header>

{#if !data.stripeConfigured}
	<div class="callout">
		<strong>Stripe not configured.</strong> Add <code>STRIPE_SECRET_KEY</code> under
		<a href="/admin/settings">Settings</a>. Webhooks will still ingest events, but the Portal + Checkout links need the key.
	</div>
{/if}

{#if data.summary.length}
	<section class="summary">
		{#each data.summary as s}
			<div class="stat">
				<span class="label">{s.status}</span>
				<strong>{s.count}</strong>
			</div>
		{/each}
	</section>
{/if}

{#if form && 'message' in form && form.message}
	<p class="error" role="alert">{form.message}</p>
{/if}

{#if data.rows.length === 0}
	<div class="empty">
		<p>No subscriptions yet. They'll appear here the moment a webhook lands.</p>
	</div>
{:else}
	<div class="tbl-wrap">
		<table>
			<thead>
				<tr>
					<th>User</th>
					<th>Status</th>
					<th>Plan</th>
					<th>Renews</th>
					<th>Grace</th>
					<th>Updated</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as row}
					<tr>
						<td>
							<span class="email">{row.userEmail ?? row.userId}</span>
							<span class="subid">{row.stripeSubscriptionId}</span>
						</td>
						<td><span class="chip chip-{row.status}">{row.status}</span></td>
						<td>{row.priceLookupKey ?? row.priceId ?? '—'}</td>
						<td>
							{fmtDate(row.currentPeriodEnd)}
							{#if row.cancelAtPeriodEnd}<span class="chip chip-warning">cancels</span>{/if}
						</td>
						<td>{fmtDate(row.graceUntil)}</td>
						<td>{fmtDate(row.updatedAt)}</td>
						<td>
							<form method="post" action="?/grantGrace" use:enhance class="inline">
								<input type="hidden" name="stripeSubscriptionId" value={row.stripeSubscriptionId} />
								<input type="number" name="days" value="7" min="1" max="90" aria-label="Days of grace" />
								<button type="submit" class="btn-ghost">Grant grace</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if toast}
	<div class="toast" role="status">{toast}</div>
{/if}

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
	.callout a { color: var(--color-accent); }
	code {
		font-family: var(--ff-mono);
		background: var(--color-surface-2);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
	}
	.summary {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
		flex-wrap: wrap;
	}
	.stat {
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 7rem;
	}
	.stat .label {
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		text-transform: capitalize;
	}
	.stat strong { font-size: var(--fs-xl); }
	.empty {
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		text-align: center;
	}
	.tbl-wrap {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--fs-sm);
	}
	th, td {
		padding: var(--space-3);
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}
	th {
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-weight: 600;
	}
	tr:last-child td { border-bottom: none; }
	.email { display: block; font-weight: 600; }
	.subid { display: block; color: var(--color-text-muted); font-size: var(--fs-xs); font-family: var(--ff-mono); }
	.chip {
		display: inline-block;
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.chip-active, .chip-trialing {
		background: color-mix(in oklab, var(--color-success) 15%, transparent);
		color: var(--color-success);
	}
	.chip-past_due, .chip-unpaid {
		background: color-mix(in oklab, var(--color-warning) 15%, transparent);
		color: var(--color-warning);
	}
	.chip-canceled, .chip-incomplete, .chip-warning {
		background: color-mix(in oklab, var(--color-danger) 15%, transparent);
		color: var(--color-danger);
	}
	.inline {
		display: flex;
		gap: var(--space-1);
		align-items: center;
	}
	.inline input[type='number'] {
		width: 4rem;
		padding: 4px var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-text);
		font: inherit;
	}
	.btn-ghost {
		padding: 4px var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		cursor: pointer;
		font: inherit;
	}
	.btn-ghost:hover { border-color: var(--color-border-strong); }
	.error {
		color: var(--color-danger);
		margin-bottom: var(--space-4);
	}
	.toast {
		position: fixed;
		bottom: var(--space-5);
		right: var(--space-5);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-3);
		z-index: var(--z-toast);
	}
</style>
