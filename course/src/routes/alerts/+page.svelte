<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function formatDate(d: Date | string | null) {
		if (!d) return '';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(d));
	}

	function directionColor(dir: string) {
		if (dir === 'long') return 'long';
		if (dir === 'short') return 'short';
		return 'watch';
	}
</script>

<svelte:head><title>Alerts — Trade Flex</title></svelte:head>

<div class="shell">
	<header>
		<h1>Alerts</h1>
		<p class="lede">
			Real-time setups. Every alert carries entry, stop, and sizing context. Outcomes are reconciled
			and published monthly.
		</p>
	</header>

	{#if data.alerts.length === 0}
		<div class="empty">
			<p>No alerts yet. New setups post here the moment they trigger.</p>
		</div>
	{:else}
		<ol class="feed">
			{#each data.alerts as a (a.id)}
				<li class="alert" data-status={a.status}>
					<div class="top-row">
						<span class="symbol">{a.symbol}</span>
						<span class="pill kind">{a.kind}</span>
						<span class="pill direction {directionColor(a.direction)}">{a.direction}</span>
						{#if a.status === 'stopped_out'}
							<span class="pill danger">Stopped out</span>
						{:else if a.status === 'closed'}
							<span class="pill closed">Closed</span>
						{/if}
						<time class="time">{formatDate(a.publishedAt)}</time>
					</div>
					<p class="thesis">{a.thesis}</p>
					<dl class="levels">
						{#if a.entry}
							<div>
								<dt>Entry</dt>
								<dd>{a.entry}</dd>
							</div>
						{/if}
						{#if a.stop}
							<div>
								<dt>Stop</dt>
								<dd>{a.stop}</dd>
							</div>
						{/if}
						{#if a.target}
							<div>
								<dt>Target</dt>
								<dd>{a.target}</dd>
							</div>
						{/if}
						{#if a.sizingHint}
							<div>
								<dt>Sizing</dt>
								<dd>{a.sizingHint}</dd>
							</div>
						{/if}
					</dl>
					{#if a.outcomeNote}
						<p class="outcome">
							<strong>Outcome:</strong>
							{a.outcomeNote}
						</p>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.shell {
		max-width: 820px;
		margin: 0 auto;
		padding: var(--space-7) var(--space-6);
	}
	header h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	.lede {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-6);
	}
	.empty {
		padding: var(--space-7);
		text-align: center;
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
	}
	.feed {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-4);
	}
	.alert {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.alert[data-status='stopped_out'] {
		border-left: 3px solid var(--color-danger);
	}
	.alert[data-status='closed'] {
		opacity: 0.78;
	}
	.top-row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}
	.symbol {
		font-family: var(--ff-mono);
		font-weight: 700;
		font-size: var(--fs-lg);
	}
	.pill {
		padding: 2px var(--space-2);
		font-size: var(--fs-xs);
		border-radius: var(--radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 600;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
	}
	.pill.direction.long {
		border-color: color-mix(in oklab, var(--color-success) 50%, var(--color-border));
		color: var(--color-success);
	}
	.pill.direction.short {
		border-color: color-mix(in oklab, var(--color-danger) 50%, var(--color-border));
		color: var(--color-danger);
	}
	.pill.direction.watch {
		border-color: color-mix(in oklab, var(--color-info) 50%, var(--color-border));
		color: var(--color-info);
	}
	.pill.danger {
		background: color-mix(in oklab, var(--color-danger) 15%, transparent);
		color: var(--color-danger);
		border-color: transparent;
	}
	.pill.closed {
		background: var(--color-surface-2);
	}
	.time {
		margin-left: auto;
		font-size: var(--fs-sm);
		color: var(--color-text-subtle);
	}
	.thesis {
		margin: var(--space-3) 0;
		color: var(--color-text);
	}
	.levels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg);
		border-radius: var(--radius-md);
	}
	.levels div {
		display: flex;
		flex-direction: column;
	}
	.levels dt {
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.levels dd {
		margin: 0;
		font-family: var(--ff-mono);
		font-weight: 600;
	}
	.outcome {
		margin: var(--space-3) 0 0;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
</style>
