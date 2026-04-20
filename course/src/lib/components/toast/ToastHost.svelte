<script lang="ts">
	import { toast } from '$lib/toast/store.svelte';
</script>

<div class="host" role="region" aria-live="polite" aria-label="Notifications">
	{#each toast.list as t (t.id)}
		<div class="toast" data-kind={t.kind}>
			<span class="msg">{t.message}</span>
			<button
				type="button"
				class="dismiss"
				aria-label="Dismiss notification"
				onclick={() => toast.dismiss(t.id)}
			>
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.host {
		position: fixed;
		right: var(--space-4);
		bottom: var(--space-4);
		display: grid;
		gap: var(--space-2);
		z-index: var(--z-toast, 60);
		max-width: min(90vw, 420px);
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-left: 3px solid var(--color-accent);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md, 0 6px 18px rgba(0, 0, 0, 0.18));
		font-size: var(--fs-sm);
	}
	.toast[data-kind='success'] {
		border-left-color: var(--color-success);
	}
	.toast[data-kind='error'] {
		border-left-color: var(--color-danger);
	}
	.msg {
		flex: 1;
	}
	.dismiss {
		border: 0;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 var(--space-1);
	}
	.dismiss:hover {
		color: var(--color-text);
	}
	@media (prefers-reduced-motion: no-preference) {
		.toast {
			animation: slide-in 220ms var(--ease-out-quart, ease-out);
		}
	}
	@keyframes slide-in {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
