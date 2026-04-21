<script lang="ts">
	import { resolve } from '$app/paths';

	const features = [
		{
			title: 'Real-time alerts',
			body: 'Options and equities setups pushed the moment they trigger. Audio, desktop, and email — your choice.'
		},
		{
			title: 'Two full courses',
			body: 'Price Action Simplified and Options 101. Written and video lessons with quizzes and a member-only Q&A.'
		},
		{
			title: 'Risk-first framing',
			body: 'Every alert comes with stop, invalidation, and sizing guidance. No moonshot screenshots.'
		},
		{
			title: 'macOS companion',
			body: 'Desktop alerts without a browser tab. Deep links into the web app for details and history.'
		},
		{
			title: 'Transparent performance',
			body: 'Every alert logged, every outcome reconciled. Monthly performance reports sent to all members.'
		},
		{
			title: 'No fluff community',
			body: 'Discussion threads tied to each alert. No pump, no shill, no "to the moon".'
		}
	];

	const testimonials = [
		{
			quote:
				'The risk framing alone pays for the membership. I finally stopped trading my biases and started trading setups.',
			author: 'A. Patel',
			role: 'Day trader, 3 years'
		},
		{
			quote:
				"The courses are the clearest I've seen. Options 101 untangled what three YouTube channels couldn't.",
			author: 'M. Okafor',
			role: 'Swing trader'
		}
	];
</script>

<svelte:head><title>Trade Flex — Alerts + education for serious traders</title></svelte:head>

<section class="hero">
	<div class="hero-inner">
		<span class="pill">New · Options 101 bonus lessons</span>
		<h1>Trade smarter. Learn faster.</h1>
		<p class="lede">
			Trade Flex is the alerts + education platform built by a working trader, engineered to the
			standard your capital deserves. Real-time setups, clear risk, and two full courses — one
			subscription.
		</p>
		<div class="cta-row">
			<a href={resolve('/register')} class="btn-primary-lg">Start for $49/mo</a>
			<a href={resolve('/pricing')} class="btn-ghost-lg">See pricing →</a>
		</div>
		<p class="sub">
			Cancel anytime · 14-day trial option · <a href={resolve('/courses')}>See course library</a>
		</p>
	</div>
	<div class="hero-visual" aria-hidden="true">
		<div class="glow"></div>
		<div class="chart"></div>
	</div>
</section>

<section class="bar">
	<div class="bar-inner">
		<div class="stat"><strong>6,400+</strong><span>members</span></div>
		<div class="stat"><strong>230+</strong><span>alerts last quarter</span></div>
		<div class="stat"><strong>2</strong><span>full courses</span></div>
		<div class="stat"><strong>&lt; 2s</strong><span>alert-to-notify</span></div>
	</div>
</section>

<section class="features">
	<div class="section-head">
		<h2>Everything a trader actually uses</h2>
		<p>
			No dashboards you'll never open, no features we added because a competitor has them. Each of
			these was requested by members and earned its place.
		</p>
	</div>
	<div class="feature-grid">
		{#each features as f (f.title)}
			<div class="feature">
				<h3>{f.title}</h3>
				<p>{f.body}</p>
			</div>
		{/each}
	</div>
</section>

<section class="testimonials">
	<div class="section-head">
		<h2>What members say</h2>
	</div>
	<div class="t-grid">
		{#each testimonials as t (t.author)}
			<figure class="t">
				<blockquote>"{t.quote}"</blockquote>
				<figcaption>
					<strong>{t.author}</strong>
					<span>{t.role}</span>
				</figcaption>
			</figure>
		{/each}
	</div>
</section>

<section class="ebook">
	<div class="ebook-inner">
		<div>
			<span class="pill">Free</span>
			<h2>The Options 101 Starter Guide</h2>
			<p>
				A 40-page PDF covering the five setups you'll see most often this week, with entry, stop,
				and sizing rules. No fluff, no upsell.
			</p>
		</div>
		<form method="post" action="/api/leads" class="ebook-form">
			<input type="email" name="email" placeholder="you@example.com" required />
			<button type="submit" class="btn-primary-lg">Send me the PDF</button>
			<small>We'll email the PDF and two more lessons. Unsubscribe anytime.</small>
		</form>
	</div>
</section>

<section class="final-cta">
	<h2>Start today. See the next alert live.</h2>
	<p>$49/month, $399/year (save $189), cancel anytime.</p>
	<a href={resolve('/register')} class="btn-primary-lg">Create account →</a>
</section>

<style>
	.hero {
		position: relative;
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-9) var(--space-6) var(--space-8);
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: var(--space-8);
		align-items: center;
	}
	.hero-inner {
		position: relative;
		z-index: 1;
	}
	.hero h1 {
		font-size: var(--fs-5xl);
		line-height: var(--lh-tight);
		margin: var(--space-4) 0 var(--space-4);
		letter-spacing: -0.02em;
	}
	.lede {
		font-size: var(--fs-lg);
		color: var(--color-text-muted);
		max-width: 52ch;
		line-height: var(--lh-relaxed);
		margin: 0 0 var(--space-6);
	}
	.pill {
		display: inline-block;
		padding: 4px var(--space-3);
		border-radius: var(--radius-pill);
		background: color-mix(in oklab, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
		font-size: var(--fs-sm);
		font-weight: 500;
	}
	.cta-row {
		display: flex;
		gap: var(--space-3);
		align-items: center;
	}
	.btn-primary-lg {
		padding: var(--space-4) var(--space-5);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		text-decoration: none;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: var(--fs-md);
		cursor: pointer;
		transition: transform var(--dur-2) var(--ease-out-quart);
	}
	.btn-primary-lg:hover {
		transform: translateY(-1px);
	}
	.btn-ghost-lg {
		padding: var(--space-4) var(--space-5);
		color: var(--color-text);
		text-decoration: none;
		font-weight: 500;
	}
	.sub {
		margin-top: var(--space-4);
		color: var(--color-text-subtle);
		font-size: var(--fs-sm);
	}
	.sub a {
		color: var(--color-text-muted);
	}

	.hero-visual {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-xl);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		overflow: hidden;
	}
	.glow {
		position: absolute;
		inset: -40%;
		background: radial-gradient(
			circle at 30% 30%,
			color-mix(in oklab, var(--color-accent) 40%, transparent),
			transparent 60%
		);
	}
	.chart {
		position: absolute;
		inset: 0;
		background:
			repeating-linear-gradient(
				to right,
				color-mix(in oklab, var(--color-border-strong) 40%, transparent) 0 1px,
				transparent 1px 60px
			),
			repeating-linear-gradient(
				to bottom,
				color-mix(in oklab, var(--color-border-strong) 40%, transparent) 0 1px,
				transparent 1px 40px
			);
		mask: linear-gradient(to top, transparent, black 30%);
	}

	.bar {
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-2);
	}
	.bar-inner {
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-5) var(--space-6);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-5);
	}
	.stat {
		display: grid;
		gap: var(--space-1);
		text-align: center;
	}
	.stat strong {
		font-size: var(--fs-2xl);
	}
	.stat span {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}

	.features,
	.testimonials,
	.ebook,
	.final-cta {
		max-width: var(--layout-max);
		margin: var(--space-8) auto;
		padding: 0 var(--space-6);
	}
	.section-head {
		text-align: center;
		margin-bottom: var(--space-6);
	}
	.section-head h2 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	.section-head p {
		color: var(--color-text-muted);
		max-width: 60ch;
		margin: 0 auto;
	}
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-4);
	}
	.feature {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.feature h3 {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-2);
	}
	.feature p {
		color: var(--color-text-muted);
		margin: 0;
	}

	.t-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--space-4);
	}
	.t {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		margin: 0;
	}
	.t blockquote {
		margin: 0 0 var(--space-4);
		font-size: var(--fs-lg);
		line-height: var(--lh-snug);
	}
	.t figcaption {
		display: flex;
		gap: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.t figcaption strong {
		color: var(--color-text);
	}

	.ebook {
		padding: var(--space-7) var(--space-6);
		background: linear-gradient(
			135deg,
			var(--color-surface-2) 0%,
			color-mix(in oklab, var(--color-accent) 8%, var(--color-surface-2)) 100%
		);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}
	.ebook-inner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-6);
		align-items: center;
	}
	.ebook h2 {
		font-size: var(--fs-2xl);
		margin: var(--space-2) 0 var(--space-2);
	}
	.ebook-form {
		display: grid;
		gap: var(--space-2);
	}
	.ebook-form input {
		padding: var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--fs-md);
	}
	.ebook-form small {
		color: var(--color-text-subtle);
		font-size: var(--fs-xs);
	}

	.final-cta {
		text-align: center;
		padding: var(--space-8) var(--space-6);
	}
	.final-cta h2 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	.final-cta p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-5);
	}

	@media (max-width: 780px) {
		.hero {
			grid-template-columns: 1fr;
			padding-top: var(--space-7);
		}
		.hero-visual {
			order: -1;
			aspect-ratio: 16 / 10;
		}
		.bar-inner {
			grid-template-columns: repeat(2, 1fr);
		}
		.ebook-inner {
			grid-template-columns: 1fr;
		}
	}
</style>
