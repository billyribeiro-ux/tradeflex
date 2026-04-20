<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Logo from '$lib/components/brand/Logo.svelte';
	let { children }: { children: Snippet } = $props();

	const nav = [
		{ href: '/pricing', label: 'Pricing' },
		{ href: '/alerts-preview', label: 'Alerts' },
		{ href: '/courses', label: 'Courses' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/course', label: 'Build log' }
	];

	const current = $derived(page.url.pathname);
</script>

<div class="mkt">
	<header class="top">
		<a class="brand" href="/"><Logo variant="lockup" /></a>
		<nav>
			{#each nav as item}
				<a href={item.href} class:active={current.startsWith(item.href)}>{item.label}</a>
			{/each}
		</nav>
		<div class="cta">
			<a href="/login" class="btn-ghost">Sign in</a>
			<a href="/register" class="btn-primary">Get started</a>
		</div>
	</header>

	<main>{@render children()}</main>

	<footer class="foot">
		<div class="foot-inner">
			<div>
				<Logo />
				<p class="tag">Alerts + education for serious traders.</p>
			</div>
			<div>
				<h4>Product</h4>
				<a href="/pricing">Pricing</a>
				<a href="/alerts-preview">Alerts</a>
				<a href="/courses">Courses</a>
			</div>
			<div>
				<h4>Company</h4>
				<a href="/about">About</a>
				<a href="/blog">Blog</a>
				<a href="/contact">Contact</a>
			</div>
			<div>
				<h4>Legal</h4>
				<a href="/legal/terms">Terms</a>
				<a href="/legal/privacy">Privacy</a>
				<a href="/legal/disclaimer">Risk disclaimer</a>
			</div>
		</div>
		<div class="small">© {new Date().getFullYear()} Trade Flex. Trading involves risk.</div>
	</footer>
</div>

<style>
	.mkt {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
	}
	.top {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		background: color-mix(in oklab, var(--color-bg) 85%, transparent);
		backdrop-filter: blur(12px);
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
	}
	.brand {
		color: var(--color-text);
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: var(--space-2);
		margin-left: var(--space-5);
	}
	nav a {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	nav a:hover,
	nav a.active {
		color: var(--color-text);
		background: var(--color-surface-2);
	}
	.cta {
		display: flex;
		gap: var(--space-2);
		margin-left: auto;
	}
	.btn-ghost {
		padding: var(--space-2) var(--space-4);
		color: var(--color-text);
		text-decoration: none;
		border-radius: var(--radius-md);
	}
	.btn-primary {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		text-decoration: none;
		border-radius: var(--radius-md);
		font-weight: 500;
	}
	main {
		flex: 1;
	}
	.foot {
		border-top: 1px solid var(--color-border);
		padding: var(--space-7) var(--space-6) var(--space-5);
		background: var(--color-surface-2);
		margin-top: var(--space-9);
	}
	.foot-inner {
		max-width: var(--layout-max);
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1.3fr 1fr 1fr 1fr;
		gap: var(--space-6);
	}
	.foot h4 {
		font-size: var(--fs-sm);
		margin: 0 0 var(--space-3);
		color: var(--color-text);
	}
	.foot a {
		display: block;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
		padding: var(--space-1) 0;
	}
	.foot a:hover {
		color: var(--color-text);
	}
	.tag {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin: var(--space-2) 0 0;
		max-width: 30ch;
	}
	.small {
		max-width: var(--layout-max);
		margin: var(--space-6) auto 0;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
		color: var(--color-text-subtle);
		font-size: var(--fs-xs);
		text-align: center;
	}
	@media (max-width: 780px) {
		.top nav {
			display: none;
		}
		.foot-inner {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
