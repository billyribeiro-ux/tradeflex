<script lang="ts">
	const courses = [
		{
			slug: 'price-action-simplified',
			title: 'Price Action Simplified',
			lessons: 42,
			hours: 9.5,
			price: 799,
			tagline: 'The setups, the risk, the rules. No indicator-soup.',
			included: 'Included with Membership'
		},
		{
			slug: 'options-101',
			title: 'Options 101',
			lessons: 58,
			hours: 13,
			price: 999,
			tagline: 'From ATM calls to defined-risk spreads. Clear math, honest expected value.',
			included: 'Included with Membership'
		}
	];
</script>

<svelte:head><title>Courses — Trade Flex</title></svelte:head>

<section class="head">
	<h1>The course library</h1>
	<p>
		Two full courses, included with every membership. Buy them once if you just want the education,
		or subscribe to get the alerts too.
	</p>
</section>

<section class="grid">
	{#each courses as c}
		<article class="card">
			<h2>{c.title}</h2>
			<p class="tag">{c.tagline}</p>
			<dl>
				<div>
					<dt>Lessons</dt>
					<dd>{c.lessons}</dd>
				</div>
				<div>
					<dt>Watch time</dt>
					<dd>{c.hours}h</dd>
				</div>
				<div>
					<dt>Included</dt>
					<dd>{c.included}</dd>
				</div>
			</dl>
			<div class="cta">
				<a class="btn-primary" href="/register">Subscribe — $49/mo</a>
				<a class="btn-ghost" href="/checkout/course/{c.slug}">Buy course · ${c.price}</a>
			</div>
		</article>
	{/each}
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
		margin: 0;
	}
	.grid {
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-6);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--space-4);
	}
	.card {
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}
	.card h2 {
		font-size: var(--fs-2xl);
		margin: 0 0 var(--space-2);
	}
	.tag {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-4);
	}
	dl {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-bg);
		border-radius: var(--radius-md);
		margin: 0 0 var(--space-4);
	}
	dl div {
		display: flex;
		flex-direction: column;
	}
	dt {
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	.cta {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	.btn-primary,
	.btn-ghost {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 500;
	}
	.btn-primary {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}
	.btn-ghost {
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}
</style>
