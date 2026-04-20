<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		videoGuid: string;
		title?: string;
		aspect?: number;
	}

	let { videoGuid, title = 'Video', aspect = 16 / 9 }: Props = $props();

	type State =
		| { kind: 'loading' }
		| { kind: 'ready'; url: string; expiresAt: number }
		| { kind: 'blocked'; status: number; message: string };

	let state = $state<State>({ kind: 'loading' });
	let refreshTimer: ReturnType<typeof setTimeout> | null = null;

	async function fetchSignedUrl() {
		state = { kind: 'loading' };
		try {
			const res = await fetch(`/api/video/${encodeURIComponent(videoGuid)}/signed-url`, {
				headers: { accept: 'application/json' }
			});
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				state = {
					kind: 'blocked',
					status: res.status,
					message: text || res.statusText || 'Could not load video'
				};
				return;
			}
			const body = (await res.json()) as { url: string; expiresAt: number };
			state = { kind: 'ready', url: body.url, expiresAt: body.expiresAt };

			// Refresh 60s before the token expires so playback doesn't stall mid-lesson.
			const ttlMs = body.expiresAt * 1000 - Date.now() - 60_000;
			if (refreshTimer) clearTimeout(refreshTimer);
			if (ttlMs > 0) refreshTimer = setTimeout(fetchSignedUrl, ttlMs);
		} catch (err) {
			state = {
				kind: 'blocked',
				status: 0,
				message: err instanceof Error ? err.message : 'Network error'
			};
		}
	}

	onMount(() => {
		fetchSignedUrl();
		return () => {
			if (refreshTimer) clearTimeout(refreshTimer);
		};
	});

	const paddingBottom = $derived(`${(1 / aspect) * 100}%`);
</script>

<div class="wrap" style="padding-bottom: {paddingBottom}">
	{#if state.kind === 'loading'}
		<div class="panel">Loading video…</div>
	{:else if state.kind === 'ready'}
		<iframe
			{title}
			src={state.url}
			loading="lazy"
			allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
			allowfullscreen
		></iframe>
	{:else if state.kind === 'blocked' && state.status === 403}
		<div class="panel">
			<strong>Member-only video.</strong>
			<span>This lesson unlocks with an active Trade Flex membership.</span>
			<a href="/pricing">See plans</a>
		</div>
	{:else if state.kind === 'blocked' && state.status === 401}
		<div class="panel">
			<strong>Sign in required.</strong>
			<a href="/login">Log in</a>
		</div>
	{:else if state.kind === 'blocked' && state.status === 503}
		<div class="panel">
			<strong>Video hosting not configured.</strong>
			<span>An admin needs to set Bunny Stream keys in settings.</span>
		</div>
	{:else if state.kind === 'blocked'}
		<div class="panel">
			<strong>Could not load video.</strong>
			<span>{state.message}</span>
			<button type="button" onclick={fetchSignedUrl}>Retry</button>
		</div>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
		width: 100%;
		height: 0;
		background: var(--color-surface-2);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	iframe,
	.panel {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-5);
		text-align: center;
		color: var(--color-text-muted);
	}
	.panel strong {
		color: var(--color-text);
	}
	.panel a {
		color: var(--color-accent);
		text-decoration: underline;
	}
	.panel button {
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		cursor: pointer;
	}
</style>
