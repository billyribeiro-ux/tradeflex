<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Admin — Trade Flex</title></svelte:head>

<header>
	<h1>Dashboard</h1>
	<p>Welcome, {data.email}. Your roles: <code>{data.caller.roles.join(', ') || 'none'}</code>.</p>
</header>

<section class="grid">
	<a class="tile" href={resolve('/admin/settings/integrations')}>
		<h2>Integrations</h2>
		<p>Stripe, Resend, Bunny, GitHub OAuth. Keys are encrypted at rest.</p>
	</a>
	<a class="tile" href={resolve('/admin/settings/branding')}>
		<h2>Branding</h2>
		<p>Logo, palette, email-header colors, marketing-site overrides.</p>
	</a>
	<a class="tile" href={resolve('/admin/members')}>
		<h2>Members</h2>
		<p>Search, impersonate, block, refund, delete — always audited.</p>
	</a>
	<a class="tile" href={resolve('/admin/roles')}>
		<h2>Roles</h2>
		<p>Grant/revoke owner, admin, content, support, analyst.</p>
	</a>
	<a class="tile" href={resolve('/admin/subscriptions')}>
		<h2>Subscriptions</h2>
		<p>Plans, trials, cancellations, dunning, test clocks.</p>
	</a>
	<a class="tile" href={resolve('/admin/payments')}>
		<h2>Payments</h2>
		<p>Successful charges, refunds, failed retries, invoice PDFs.</p>
	</a>
	<a class="tile" href={resolve('/admin/courses')}>
		<h2>Courses</h2>
		<p>Modules, lessons, video sources, previews.</p>
	</a>
	<a class="tile" href={resolve('/admin/alerts')}>
		<h2>Alerts</h2>
		<p>Publish, schedule, stop-out, unpublish. Member notifications.</p>
	</a>
	<a class="tile" href={resolve('/admin/inbox')}>
		<h2>Email inbox</h2>
		<p>Incoming Resend replies, outbound deliverability, suppression list.</p>
	</a>
	<a class="tile" href={resolve('/admin/marketing')}>
		<h2>Marketing</h2>
		<p>Leads, campaigns, ebook downloads, contact-form triage.</p>
	</a>
	<a class="tile" href={resolve('/admin/audit')}>
		<h2>Audit log</h2>
		<p>Every write, who did it, when, and from where.</p>
	</a>
</section>

<style>
	header h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	header p {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-6);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--space-4);
	}
	.tile {
		display: block;
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		color: var(--color-text);
		text-decoration: none;
		transition: border-color var(--dur-2) var(--ease-out-quart);
	}
	.tile:hover {
		border-color: var(--color-border-strong);
	}
	.tile h2 {
		margin: 0 0 var(--space-2);
		font-size: var(--fs-lg);
	}
	.tile p {
		color: var(--color-text-muted);
		margin: 0;
		font-size: var(--fs-sm);
	}
</style>
