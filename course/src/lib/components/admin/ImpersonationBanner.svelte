<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let {
		impersonatorUserId,
		targetUserId
	}: { impersonatorUserId: string; targetUserId: string | null } = $props();

	let stopping = $state(false);
	let error = $state<string | null>(null);

	async function stop() {
		stopping = true;
		error = null;
		try {
			const res = await fetch('/api/impersonation/stop', { method: 'POST' });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			await invalidateAll();
			// Full reload so session/caller-derived UI resets cleanly.
			location.href = '/admin/members';
		} catch (e) {
			error = e instanceof Error ? e.message : 'stop failed';
			stopping = false;
		}
	}
</script>

<div class="banner" role="status" aria-live="polite">
	<div class="body">
		<strong>Impersonation active</strong>
		<span>
			Viewing as <code>{targetUserId}</code> · real user <code>{impersonatorUserId}</code>
		</span>
	</div>
	<button type="button" onclick={stop} disabled={stopping}>
		{stopping ? 'Stopping…' : 'Stop impersonation'}
	</button>
	{#if error}
		<span class="err">{error}</span>
	{/if}
</div>

<style>
	.banner {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-4);
		background: var(--color-warn, #d97706);
		color: white;
		font-size: var(--font-size-sm);
	}
	.body {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		flex: 1;
		flex-wrap: wrap;
	}
	code {
		font-family: var(--font-mono);
		background: rgba(0, 0, 0, 0.2);
		padding: 0 4px;
		border-radius: 3px;
	}
	button {
		padding: var(--space-1) var(--space-3);
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: var(--radius-sm);
		background: rgba(0, 0, 0, 0.2);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.err {
		color: #fee2e2;
	}
</style>
