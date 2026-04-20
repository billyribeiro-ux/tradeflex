<script lang="ts">
	import '$lib/styles/index.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastHost from '$lib/components/toast/ToastHost.svelte';
	import ImpersonationBanner from '$lib/components/admin/ImpersonationBanner.svelte';
	import { toast } from '$lib/toast/store.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	$effect(() => {
		if (data.flash) toast.push(data.flash.kind, data.flash.message);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="color-scheme" content="light dark" />
</svelte:head>

<a href="#main-content" class="skip-link">Skip to main content</a>
{#if data.impersonation}
	<ImpersonationBanner
		impersonatorUserId={data.impersonation.impersonatorUserId}
		targetUserId={data.impersonation.targetUserId}
	/>
{/if}
<div id="main-content">
	{@render children()}
</div>
<ToastHost />

<style>
	.skip-link {
		position: absolute;
		top: -40px;
		left: var(--space-3);
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: var(--radius-md);
		font-weight: 600;
		z-index: 1000;
	}
	.skip-link:focus-visible {
		top: var(--space-3);
	}
	#main-content {
		display: contents;
	}
</style>
