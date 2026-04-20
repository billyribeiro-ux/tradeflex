<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { notifications } from '$lib/notifications/store.svelte';

	let open = $state(false);

	onMount(() => notifications.connect());
	onDestroy(() => notifications.disconnect());

	function toggle() {
		open = !open;
		if (open) notifications.markAllRead();
	}

	function formatWhen(iso: string) {
		const diff = Date.now() - new Date(iso).getTime();
		if (diff < 60_000) return 'just now';
		if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
		if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
		return new Date(iso).toLocaleString();
	}
</script>

<div class="bell-wrap">
	<button
		class="bell"
		type="button"
		aria-label="Notifications"
		aria-expanded={open}
		onclick={toggle}
	>
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
			<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
		</svg>
		{#if notifications.unreadCount > 0}
			<span class="dot" aria-label="{notifications.unreadCount} unread">
				{notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
			</span>
		{/if}
		<span class="pulse" class:on={notifications.connected} aria-hidden="true"></span>
	</button>

	{#if open}
		<div class="panel" role="dialog" aria-label="Recent notifications">
			<header class="panel-head">
				<strong>Notifications</strong>
				<button class="clear" type="button" onclick={() => notifications.clear()}>Clear</button>
			</header>
			{#if notifications.list.length === 0}
				<p class="empty">No notifications yet.</p>
			{:else}
				<ul class="items">
					{#each notifications.list as n (n.id)}
						<li>
							{#if n.href}
								<a href={n.href} onclick={() => (open = false)}>
									<div class="title">{n.title}</div>
									<div class="body">{n.body}</div>
									<time>{formatWhen(n.at)}</time>
								</a>
							{:else}
								<div class="title">{n.title}</div>
								<div class="body">{n.body}</div>
								<time>{formatWhen(n.at)}</time>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.bell-wrap {
		position: relative;
	}
	.bell {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		cursor: pointer;
	}
	.bell:hover {
		color: var(--color-text);
	}
	.dot {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 18px;
		height: 18px;
		padding: 0 var(--space-1);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border-radius: 9px;
		font-size: var(--fs-xs);
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	.pulse {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-text-subtle);
	}
	.pulse.on {
		background: var(--color-success, #16a34a);
	}
	.panel {
		position: absolute;
		top: calc(100% + var(--space-2));
		right: 0;
		width: 320px;
		max-height: 420px;
		overflow-y: auto;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.35));
		z-index: 40;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	.clear {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: var(--fs-xs);
		cursor: pointer;
		text-decoration: underline;
	}
	.empty {
		padding: var(--space-5) var(--space-4);
		margin: 0;
		color: var(--color-text-muted);
		text-align: center;
		font-size: var(--fs-sm);
	}
	.items {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.items li {
		border-bottom: 1px solid var(--color-border);
	}
	.items li:last-child {
		border-bottom: none;
	}
	.items li :global(a),
	.items li > div:first-child {
		display: block;
		padding: var(--space-3) var(--space-4);
		color: var(--color-text);
		text-decoration: none;
	}
	.items li :global(a:hover) {
		background: var(--color-surface-2);
	}
	.title {
		font-size: var(--fs-sm);
		font-weight: 500;
	}
	.body {
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		margin-top: 2px;
	}
	time {
		display: block;
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		margin-top: var(--space-1);
	}
</style>
