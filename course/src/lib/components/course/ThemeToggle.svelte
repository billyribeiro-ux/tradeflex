<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'light' | 'dark' | 'system';
	let theme = $state<Theme>('system');

	onMount(() => {
		const saved = localStorage.getItem('tf-theme') as Theme | null;
		theme = saved ?? 'system';
		apply(theme);
	});

	function apply(next: Theme) {
		const root = document.documentElement;
		if (next === 'system') {
			root.removeAttribute('data-theme');
		} else {
			root.setAttribute('data-theme', next);
		}
	}

	function cycle() {
		theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
		localStorage.setItem('tf-theme', theme);
		apply(theme);
	}

	const icon = $derived(theme === 'light' ? '☼' : theme === 'dark' ? '☾' : '◐');
	const label = $derived(
		theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System theme'
	);
</script>

<button type="button" class="toggle" onclick={cycle} aria-label={label} title={label}>
	<span aria-hidden="true">{icon}</span>
</button>

<style>
	.toggle {
		display: inline-grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--fs-md);
		transition:
			background var(--dur-1) var(--ease-out-expo),
			border-color var(--dur-1) var(--ease-out-expo),
			transform var(--dur-1) var(--ease-out-expo);
	}

	.toggle:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
		transform: translateY(-1px);
	}
</style>
