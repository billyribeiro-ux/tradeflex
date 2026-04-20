<script lang="ts">
	import Logo from '$lib/components/brand/Logo.svelte';

	let { children } = $props();
</script>

<div class="auth-shell">
	<aside class="panel">
		<a class="brand" href="/"><Logo variant="lockup" /></a>
		<h1>Trade smarter. Learn faster.</h1>
		<p>
			Trade Flex is the alerts + education platform engineered for serious traders. Members get
			real-time alerts, the full course library, and a community that takes risk management as
			seriously as setups.
		</p>
		<ul>
			<li>Real-time options and equities alerts</li>
			<li>Two full courses: Price Action Simplified + Options 101</li>
			<li>macOS desktop companion</li>
		</ul>
	</aside>

	<main class="form-area">
		<div class="form-card">
			{@render children()}
		</div>
		<p class="legal">
			By continuing you agree to the <a href="/legal/terms">Terms</a> and
			<a href="/legal/privacy">Privacy Policy</a>.
		</p>
	</main>
</div>

<style>
	.auth-shell {
		min-height: 100svh;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
	}

	@media (max-width: 900px) {
		.auth-shell {
			grid-template-columns: 1fr;
		}
		.panel {
			display: none;
		}
	}

	.panel {
		background: linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%);
		padding: var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		border-right: 1px solid var(--color-border);
	}

	.panel .brand {
		display: inline-flex;
		align-items: center;
		color: var(--color-text);
		text-decoration: none;
	}

	.panel h1 {
		font-size: var(--fs-2xl);
		line-height: 1.15;
		margin: var(--space-4) 0 0;
		max-width: 18ch;
	}

	.panel p {
		color: var(--color-text-muted);
		max-width: 42ch;
	}

	.panel ul {
		list-style: none;
		padding: 0;
		margin: var(--space-4) 0 0;
		display: grid;
		gap: var(--space-2);
	}

	.panel li {
		color: var(--color-text-muted);
		padding-left: var(--space-5);
		position: relative;
	}

	.panel li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-accent);
	}

	.form-area {
		padding: var(--space-8);
		display: grid;
		place-items: center;
	}

	.form-card {
		width: 100%;
		max-width: 420px;
	}

	.legal {
		margin-top: var(--space-6);
		color: var(--color-text-subtle);
		font-size: var(--fs-sm);
		text-align: center;
	}
	.legal a {
		color: var(--color-text-muted);
	}
</style>
