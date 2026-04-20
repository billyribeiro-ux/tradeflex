<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showNew = $state(false);

	function fmt(d: Date | string | null) {
		if (!d) return '';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(d));
	}
</script>

<svelte:head><title>Alerts — Admin</title></svelte:head>

<header class="head">
	<div>
		<h1>Alerts</h1>
		<p>Publish, close, and unpublish setups. Every write is audited.</p>
	</div>
	<button class="btn-primary" onclick={() => (showNew = !showNew)}>
		{showNew ? 'Close' : 'New alert'}
	</button>
</header>

{#if showNew}
	<section class="card new">
		<h2>Publish new alert</h2>
		<form
			method="post"
			action="?/publish"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					showNew = false;
				};
			}}
		>
			<div class="grid">
				<label class="f">
					<span>Symbol</span>
					<input name="symbol" required placeholder="AAPL" maxlength="12" />
				</label>
				<label class="f">
					<span>Kind</span>
					<select name="kind">
						<option value="options">Options</option>
						<option value="equity">Equity</option>
						<option value="macro">Macro</option>
					</select>
				</label>
				<label class="f">
					<span>Direction</span>
					<select name="direction">
						<option value="long">Long</option>
						<option value="short">Short</option>
						<option value="watch">Watch</option>
					</select>
				</label>
				<label class="f">
					<span>Visibility</span>
					<select name="visibility">
						<option value="members">Members only</option>
						<option value="public">Public</option>
					</select>
				</label>
				<label class="f wide">
					<span>Thesis</span>
					<textarea name="thesis" required rows="4" minlength="10" maxlength="2000"></textarea>
				</label>
				<label class="f">
					<span>Entry</span>
					<input name="entry" placeholder="e.g. 182.50" />
				</label>
				<label class="f">
					<span>Stop</span>
					<input name="stop" placeholder="e.g. 179.80" />
				</label>
				<label class="f">
					<span>Target</span>
					<input name="target" placeholder="e.g. 188.00" />
				</label>
				<label class="f">
					<span>Sizing hint</span>
					<input name="sizingHint" placeholder="e.g. 0.25R, 2 contracts" />
				</label>
			</div>
			{#if form && 'message' in form && form.message}
				<p class="error">{form.message}</p>
			{/if}
			<div class="actions">
				<button class="btn-primary" type="submit">Publish</button>
			</div>
		</form>
	</section>
{/if}

<section class="table">
	<div class="row heading">
		<div>Symbol</div>
		<div>Kind</div>
		<div>Dir</div>
		<div>Status</div>
		<div>Published</div>
		<div>Actions</div>
	</div>
	{#each data.alerts as a}
		<div class="row">
			<div class="sym">{a.symbol}</div>
			<div>{a.kind}</div>
			<div>{a.direction}</div>
			<div>
				<span class="status-pill" data-status={a.status}>{a.status.replace('_', ' ')}</span>
			</div>
			<div class="time">{fmt(a.publishedAt)}</div>
			<div class="acts">
				{#if a.status === 'published'}
					<form method="post" action="?/close" use:enhance>
						<input type="hidden" name="id" value={a.id} />
						<select name="outcome">
							<option value="win">Win</option>
							<option value="loss">Loss</option>
							<option value="scratch">Scratch</option>
						</select>
						<button type="submit">Close</button>
					</form>
					<form method="post" action="?/unpublish" use:enhance>
						<input type="hidden" name="id" value={a.id} />
						<button type="submit" class="danger">Unpublish</button>
					</form>
				{/if}
			</div>
		</div>
	{/each}
</section>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-5);
	}
	.head h1 {
		margin: 0;
		font-size: var(--fs-2xl);
	}
	.head p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}
	.btn-primary {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
	}
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
		margin-bottom: var(--space-5);
	}
	.card h2 {
		margin: 0 0 var(--space-4);
		font-size: var(--fs-lg);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}
	.f {
		display: grid;
		gap: var(--space-1);
	}
	.f.wide {
		grid-column: 1 / -1;
	}
	.f span {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.f input,
	.f select,
	.f textarea {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-text);
		font: inherit;
	}
	.f input:focus-visible,
	.f textarea:focus-visible,
	.f select:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: var(--shadow-focus);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-4);
	}
	.error {
		color: var(--color-danger);
		margin: var(--space-3) 0 0;
	}

	.table {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.row {
		display: grid;
		grid-template-columns: 100px 100px 80px 140px 160px 1fr;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		align-items: center;
		border-bottom: 1px solid var(--color-border);
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row.heading {
		background: var(--color-surface-2);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-subtle);
	}
	.sym {
		font-family: var(--ff-mono);
		font-weight: 600;
	}
	.time {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.status-pill {
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		color: var(--color-text-muted);
		text-transform: capitalize;
	}
	.status-pill[data-status='published'] {
		border-color: color-mix(in oklab, var(--color-success) 50%, var(--color-border));
		color: var(--color-success);
	}
	.status-pill[data-status='stopped_out'] {
		border-color: color-mix(in oklab, var(--color-danger) 50%, var(--color-border));
		color: var(--color-danger);
	}
	.acts {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	.acts form {
		display: inline-flex;
		gap: var(--space-1);
	}
	.acts select,
	.acts button {
		padding: 4px var(--space-2);
		font-size: var(--fs-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-text);
		cursor: pointer;
	}
	.acts button.danger {
		border-color: color-mix(in oklab, var(--color-danger) 40%, var(--color-border));
		color: var(--color-danger);
	}
</style>
