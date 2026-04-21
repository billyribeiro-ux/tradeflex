<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head><title>Roles — Admin</title></svelte:head>

<header class="hd">
	<h1>Roles</h1>
	<p>
		What each staff role can do. Granted per-user under <a href={resolve('/admin/members')}
			>Members</a
		>.
	</p>
</header>

<div class="grid">
	<article class="card">
		<h2>owner</h2>
		<p class="sub">
			One person. Can grant any role, write encrypted settings, impersonate, refund.
		</p>
		<ul>
			<li>All admin scopes</li>
			<li>Encrypted setting writes (Stripe/Resend/Bunny secrets)</li>
			<li>Role grant + revoke</li>
			<li>Impersonation</li>
			<li>Refunds &gt; $500 (with two-person approval)</li>
		</ul>
	</article>
	<article class="card">
		<h2>admin</h2>
		<p class="sub">Day-to-day ops. Can do anything except key rotation + role grants.</p>
		<ul>
			<li>Member list + edit</li>
			<li>Subscription management (cancel, grace, portal)</li>
			<li>Alerts publish/close</li>
			<li>Plain settings writes (from-address, feature flags)</li>
		</ul>
	</article>
	<article class="card">
		<h2>support</h2>
		<p class="sub">Member-facing. Reads heavy; tightly-scoped writes.</p>
		<ul>
			<li>Read members + subscriptions</li>
			<li>Reply via inbox</li>
			<li>Unsubscribe contacts</li>
			<li>Grant 7-day grace on past-due subs</li>
		</ul>
	</article>
	<article class="card">
		<h2>content</h2>
		<p class="sub">Course + alert publishing.</p>
		<ul>
			<li>Alerts publish/close</li>
			<li>Course lesson edit</li>
			<li>Blog + marketing copy</li>
		</ul>
	</article>
	<article class="card">
		<h2>finance</h2>
		<p class="sub">Read-only across commerce + settings, write on refunds.</p>
		<ul>
			<li>Read subscriptions + payments</li>
			<li>Initiate refunds (≤ $500)</li>
			<li>Export invoices</li>
		</ul>
	</article>
	<article class="card">
		<h2>analyst</h2>
		<p class="sub">Read-only everywhere.</p>
		<ul>
			<li>Read members, subs, payments, alerts</li>
			<li>Read audit log</li>
		</ul>
	</article>
	<article class="card">
		<h2>read_only</h2>
		<p class="sub">Board/investor view. No PII, no individual member data.</p>
		<ul>
			<li>Read aggregated metrics (MRR, active subs)</li>
			<li>Read published alerts + courses</li>
			<li>No audit log access</li>
		</ul>
	</article>
</div>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-5);
	}
	.hd a {
		color: var(--color-accent);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--space-4);
	}
	.card {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.card h2 {
		font-family: var(--ff-mono);
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-1);
	}
	.sub {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin: 0 0 var(--space-3);
	}
	.card ul {
		margin: 0;
		padding-left: var(--space-4);
		color: var(--color-text-muted);
		line-height: var(--lh-relaxed);
	}
</style>
