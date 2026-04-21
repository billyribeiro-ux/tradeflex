<script lang="ts">
	import Logo from '$lib/components/brand/Logo.svelte';
	import { resolve } from '$app/paths';
	let { children } = $props();
</script>

<div class="shell">
	<header class="top">
		<a class="brand" href={resolve('/')}><Logo /></a>
		<nav>
			<a href={resolve('/alerts')}>Alerts</a>
			<a href={resolve('/account')} class="active">Account</a>
			<a href="/account/billing">Billing</a>
			<a href={resolve('/course')}>Build log</a>
		</nav>
	</header>
	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
	}
	.top {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-3) var(--space-6);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	.brand {
		color: var(--color-text);
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: var(--space-2);
		margin-left: auto;
	}
	nav a {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		text-decoration: none;
	}
	nav a:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	nav a.active {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.content {
		max-width: 960px;
		width: 100%;
		margin: 0 auto;
		padding: var(--space-7) var(--space-6);
	}
</style>
