<script lang="ts">
	import Logo from '$lib/components/brand/Logo.svelte';
	import Sidebar from '$lib/components/course/Sidebar.svelte';
	import ThemeToggle from '$lib/components/course/ThemeToggle.svelte';
	import SearchStub from '$lib/components/course/SearchStub.svelte';

	let { children } = $props();

	let mobileOpen = $state(false);
</script>

<div class="shell">
	<header class="topbar">
		<div class="left">
			<button
				type="button"
				class="menu"
				aria-label="Open navigation"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				<span aria-hidden="true">☰</span>
			</button>
			<a href="/course" class="brand" aria-label="Trade Flex course home">
				<Logo variant="lockup" size={24} />
			</a>
			<span class="tag">Course</span>
		</div>
		<div class="right">
			<SearchStub />
			<a class="external" href="https://github.com" aria-label="Source on GitHub">GitHub</a>
			<ThemeToggle />
		</div>
	</header>

	<div class="body">
		<aside class="nav" class:open={mobileOpen}>
			<Sidebar />
		</aside>

		<main class="main">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		background: var(--color-bg);
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: 10px 20px;
		height: var(--header-h);
		background: color-mix(in oklab, var(--color-bg) 85%, transparent);
		backdrop-filter: saturate(160%) blur(8px);
		border-bottom: 1px solid var(--color-border);
	}

	.left,
	.right {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.brand {
		text-decoration: none;
	}

	.tag {
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		padding: 2px 8px;
		border-radius: var(--radius-pill);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.external {
		font-size: var(--fs-sm);
		color: var(--color-text-muted);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}
	.external:hover {
		color: var(--color-text);
		background: var(--color-surface-2);
	}

	.menu {
		display: none;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.body {
		display: grid;
		grid-template-columns: var(--sidebar-w) 1fr;
		max-width: var(--layout-max);
		margin: 0 auto;
		width: 100%;
		flex: 1;
	}

	.nav {
		border-right: 1px solid var(--color-border);
		position: sticky;
		top: var(--header-h);
		align-self: start;
		height: calc(100svh - var(--header-h));
		overflow-y: auto;
	}

	.main {
		min-width: 0;
		padding: var(--space-6) var(--space-6);
	}

	@media (max-width: 880px) {
		.menu {
			display: inline-flex;
		}

		.body {
			grid-template-columns: 1fr;
		}

		.nav {
			position: fixed;
			top: var(--header-h);
			left: 0;
			bottom: 0;
			width: min(320px, 85vw);
			background: var(--color-surface);
			z-index: var(--z-dropdown);
			transform: translateX(-100%);
			transition: transform var(--dur-3) var(--ease-out-expo);
			box-shadow: var(--shadow-3);
		}

		.nav.open {
			transform: translateX(0);
		}

		.main {
			padding: var(--space-5) var(--space-4);
		}
	}
</style>
