<script lang="ts">
	import '$lib/styles/index.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastHost from '$lib/components/toast/ToastHost.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="color-scheme" content="light dark" />
</svelte:head>

{@render children()}
<ToastHost />
