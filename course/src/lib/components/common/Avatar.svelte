<script lang="ts">
	interface Props {
		src?: string | null;
		shape?: string | null;
		label?: string | null;
		size?: number;
	}

	let { src, shape = 'circle', label, size = 32 }: Props = $props();

	const initial = $derived((label ?? '?').trim().charAt(0).toUpperCase() || '?');
	const isCircle = $derived((shape ?? 'circle') === 'circle');
</script>

<span
	class="avatar"
	class:circle={isCircle}
	style="width: {size}px; height: {size}px; font-size: {Math.round(size * 0.42)}px;"
	aria-hidden="true"
>
	{#if src}
		<img {src} alt="" />
	{:else}
		<span>{initial}</span>
	{/if}
</span>

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		flex-shrink: 0;
		color: var(--color-text-muted);
		font-weight: 600;
		vertical-align: middle;
	}
	.avatar.circle {
		border-radius: 50%;
	}
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
