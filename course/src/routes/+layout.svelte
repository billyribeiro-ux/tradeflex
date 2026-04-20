<script lang="ts">
	import '$lib/styles/index.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastHost from '$lib/components/toast/ToastHost.svelte';
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

{@render children()}
<ToastHost />
