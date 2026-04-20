<script lang="ts">
	const samples = [
		{
			symbol: 'AAPL',
			kind: 'equity',
			direction: 'long',
			thesis:
				'Clean break of the 10-day high on a pullback session, with RSI divergence. Earnings are two weeks out — room to run.',
			entry: '182.50',
			stop: '179.80',
			target: '188.00',
			sizing: '0.5R'
		},
		{
			symbol: 'SPY',
			kind: 'options',
			direction: 'short',
			thesis:
				'Failed breakout at prior weekly high, VIX diverging up. Puts offer defined risk into month-end rebalancing.',
			entry: '490 put, 21DTE @ $3.10',
			stop: 'SPY 492.50',
			target: '485.00',
			sizing: '1 contract per 50k'
		}
	];
</script>

<svelte:head><title>Alerts preview — Trade Flex</title></svelte:head>

<section class="head">
	<h1>What an alert looks like</h1>
	<p>
		Two redacted samples from last month. Members get these in real time — inside the web app, in
		the macOS app, and optionally by email.
	</p>
</section>

<section class="list">
	{#each samples as a}
		<article class="alert">
			<header>
				<span class="sym">{a.symbol}</span>
				<span class="pill kind">{a.kind}</span>
				<span class="pill dir {a.direction}">{a.direction}</span>
			</header>
			<p>{a.thesis}</p>
			<dl>
				<div>
					<dt>Entry</dt>
					<dd>{a.entry}</dd>
				</div>
				<div>
					<dt>Stop</dt>
					<dd>{a.stop}</dd>
				</div>
				<div>
					<dt>Target</dt>
					<dd>{a.target}</dd>
				</div>
				<div>
					<dt>Sizing</dt>
					<dd>{a.sizing}</dd>
				</div>
			</dl>
		</article>
	{/each}
</section>

<section class="cta">
	<h2>See the next one live</h2>
	<a href="/register" class="btn">Start membership — $49/mo →</a>
</section>

<style>
	.head {
		max-width: 820px;
		margin: 0 auto;
		padding: var(--space-9) var(--space-6) var(--space-5);
		text-align: center;
	}
	.head h1 {
		font-size: var(--fs-4xl);
		margin: 0 0 var(--space-3);
	}
	.head p {
		color: var(--color-text-muted);
	}
	.list {
		max-width: 720px;
		margin: 0 auto;
		padding: var(--space-5) var(--space-6);
		display: grid;
		gap: var(--space-4);
	}
	.alert {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.alert header {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		margin-bottom: var(--space-3);
	}
	.sym {
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
	.pill.dir.long {
		color: var(--color-success);
		border-color: color-mix(in oklab, var(--color-success) 50%, var(--color-border));
	}
	.pill.dir.short {
		color: var(--color-danger);
		border-color: color-mix(in oklab, var(--color-danger) 50%, var(--color-border));
	}
	dl {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg);
		border-radius: var(--radius-md);
		margin: var(--space-3) 0 0;
	}
	dl div {
		display: flex;
		flex-direction: column;
	}
	dt {
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
	}
	dd {
		margin: 0;
		font-family: var(--ff-mono);
		font-weight: 600;
	}
	.cta {
		text-align: center;
		padding: var(--space-8) var(--space-6);
	}
	.cta h2 {
		font-size: var(--fs-2xl);
		margin: 0 0 var(--space-4);
	}
	.btn {
		display: inline-block;
		padding: var(--space-3) var(--space-5);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
	}
	@media (max-width: 600px) {
		dl {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
