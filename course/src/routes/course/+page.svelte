<script lang="ts">
	import { courseModules } from '$lib/course/manifest';
	import Card from '$lib/components/course/Card.svelte';
	import Badge from '$lib/components/course/Badge.svelte';
	import LinkButton from '$lib/components/course/LinkButton.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head>
	<title>Trade Flex — build it from scratch, PE7-grade</title>
	<meta
		name="description"
		content="A build-as-you-read course: ship a Stripe-powered SvelteKit membership product, two paid courses, and a macOS companion app to production — explained like you have never shipped before."
	/>
</svelte:head>

<section class="hero">
	<div class="hero-body">
		<Badge tone="accent">v1 · 2026</Badge>
		<h1>Build Trade Flex, step by step.</h1>
		<p class="lede">
			A Principal Engineer Level 7+ walkthrough for shipping a real SaaS — auth, payments, courses,
			weekly alerts, email, admin, CI/CD, and a macOS app — on SvelteKit 2, Neon, Drizzle, Better
			Auth, Stripe, and Resend. Every build step is a page. Every command shows its output.
		</p>
		<div class="actions">
			<LinkButton href="/course/cli-reference" variant="primary">Start with the CLI reference →</LinkButton>
			<LinkButton href="#modules" variant="secondary">Jump to modules</LinkButton>
		</div>

		<dl class="facts">
			<div>
				<dt>Stack</dt>
				<dd>SvelteKit 2 · Svelte 5 · Neon · Drizzle · Better Auth · Stripe · Resend · PE7 CSS</dd>
			</div>
			<div>
				<dt>Hosting</dt>
				<dd>Vercel · Neon branches per PR · GitHub Actions CI/CD</dd>
			</div>
			<div>
				<dt>Ship target</dt>
				<dd>Production deploy on a Vercel temp domain at the end</dd>
			</div>
		</dl>
	</div>
</section>

<Aside type="tip" title="How to read this course">
	<p>
		Every page opens with <em>what you&rsquo;ll learn</em> and <em>why it matters</em>, walks you
		through commands <strong>and</strong> their expected output, and closes with a recap, a
		&ldquo;verify you&rsquo;re done&rdquo; checklist, and a link to the next page. If you&rsquo;re
		new to the terminal, start with the CLI reference.
	</p>
</Aside>

<section id="modules" class="modules">
	<h2>Modules</h2>
	<p class="muted">
		Pages appear here as they are published. Empty modules below are scheduled; they will light up
		as the course is authored.
	</p>

	<div class="grid">
		{#each courseModules as m (m.key)}
			<Card
				title={m.title}
				icon={m.order === 99 ? '★' : String(m.order).padStart(2, '0')}
				href={m.pages[0]?.href}
			>
				<p>{m.summary}</p>
				<div class="meta">
					{#if m.pages.length > 0}
						<Badge tone="accent">{m.pages.length} page{m.pages.length === 1 ? '' : 's'}</Badge>
					{:else}
						<Badge tone="muted">Coming up</Badge>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</section>

<style>
	.hero {
		padding: var(--space-7) 0 var(--space-7);
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-7);
	}

	.hero-body {
		max-width: 760px;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.hero h1 {
		font-size: var(--fs-5xl);
		letter-spacing: -0.03em;
	}

	.lede {
		font-size: var(--fs-lg);
		color: var(--color-text-muted);
		line-height: var(--lh-relaxed);
		max-width: 60ch;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
		margin-top: var(--space-3);
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-4);
		margin-top: var(--space-5);
		padding-top: var(--space-5);
		border-top: 1px dashed var(--color-border);
	}

	.facts dt {
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 4px;
	}

	.facts dd {
		margin: 0;
		font-size: var(--fs-sm);
		color: var(--color-text);
	}

	.modules {
		margin-bottom: var(--space-8);
	}

	.muted {
		color: var(--color-text-muted);
		margin-bottom: var(--space-5);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-4);
	}

	.meta {
		margin-top: var(--space-3);
	}
</style>
