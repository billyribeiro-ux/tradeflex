<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Logo from '$lib/components/brand/Logo.svelte';
	import NotificationBell from '$lib/components/admin/NotificationBell.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const navGroups = [
		{
			label: 'Overview',
			items: [{ href: '/admin', label: 'Dashboard' }]
		},
		{
			label: 'People',
			items: [
				{ href: '/admin/members', label: 'Members' },
				{ href: '/admin/roles', label: 'Roles' }
			]
		},
		{
			label: 'Commerce',
			items: [
				{ href: '/admin/subscriptions', label: 'Subscriptions' },
				{ href: '/admin/payments', label: 'Payments' },
				{ href: '/admin/billing/refunds', label: 'Refunds' }
			]
		},
		{
			label: 'Content',
			items: [
				{ href: '/admin/courses', label: 'Courses' },
				{ href: '/admin/alerts', label: 'Alerts' }
			]
		},
		{
			label: 'Communications',
			items: [
				{ href: '/admin/inbox', label: 'Inbox' },
				{ href: '/admin/marketing', label: 'Marketing' }
			]
		},
		{
			label: 'Platform',
			items: [
				{ href: '/admin/settings/integrations', label: 'Integrations' },
				{ href: '/admin/settings/branding', label: 'Branding' },
				{ href: '/admin/compliance', label: 'Compliance' },
				{ href: '/admin/feature-flags', label: 'Feature flags' },
				{ href: '/admin/audit', label: 'Audit log' }
			]
		}
	];

	const current = $derived(page.url.pathname);
</script>

<div class="admin-shell">
	<aside class="side">
		<a class="brand" href="/admin"><Logo /></a>
		<div class="who">
			<div class="email">{data.email}</div>
			<div class="roles">{data.caller.roles.join(', ') || 'no roles'}</div>
		</div>

		{#each navGroups as group}
			<div class="group">
				<div class="group-label">{group.label}</div>
				{#each group.items as item}
					<a
						class="nav-item"
						class:active={current === item.href || current.startsWith(item.href + '/')}
						href={item.href}
					>
						{item.label}
					</a>
				{/each}
			</div>
		{/each}

		<form method="post" action="/logout" class="logout">
			<button type="submit">Sign out</button>
		</form>
	</aside>

	<main class="main">
		<div class="topbar">
			<NotificationBell />
		</div>
		{@render children()}
	</main>
</div>

<style>
	.admin-shell {
		min-height: 100svh;
		display: grid;
		grid-template-columns: 260px 1fr;
	}

	.side {
		background: var(--color-surface-2);
		border-right: 1px solid var(--color-border);
		padding: var(--space-4) var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		position: sticky;
		top: 0;
		max-height: 100svh;
		overflow-y: auto;
	}

	.brand {
		padding: var(--space-2);
		color: var(--color-text);
		text-decoration: none;
	}

	.who {
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	.email {
		font-weight: 500;
		font-size: var(--fs-sm);
		word-break: break-all;
	}
	.roles {
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		margin-top: var(--space-1);
	}

	.group-label {
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		padding: var(--space-1) var(--space-2);
		margin-top: var(--space-2);
	}

	.nav-item {
		display: block;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.nav-item:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}
	.nav-item.active {
		background: var(--color-surface);
		color: var(--color-text);
		font-weight: 500;
		box-shadow: inset 2px 0 0 var(--color-accent);
	}

	.logout {
		margin-top: auto;
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}
	.logout button {
		width: 100%;
		padding: var(--space-2);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		cursor: pointer;
	}
	.logout button:hover {
		color: var(--color-text);
	}

	.main {
		padding: var(--space-7) var(--space-6);
		max-width: 1280px;
		width: 100%;
	}
	.topbar {
		display: flex;
		justify-content: flex-end;
		margin: calc(var(--space-7) * -1) calc(var(--space-6) * -1) var(--space-5);
		padding: var(--space-3) var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	@media (max-width: 900px) {
		.admin-shell {
			grid-template-columns: 1fr;
		}
		.side {
			position: static;
			max-height: none;
		}
	}
</style>
