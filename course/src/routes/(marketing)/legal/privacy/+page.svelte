<svelte:head><title>Privacy — Trade Flex</title></svelte:head>

<section class="wrap">
	<h1>Privacy Policy</h1>
	<p class="muted">Last updated: April 2026</p>
	<h2>What we collect</h2>
	<ul>
		<li>Account: email, name, password hash (never the password).</li>
		<li>Billing: handled by Stripe; we store a customer id, not a card.</li>
		<li>Usage: page-view logs with a request id, for debugging and abuse prevention.</li>
		<li>Email: addresses submitted to the ebook form, with explicit opt-in.</li>
	</ul>
	<h2>What we don't do</h2>
	<ul>
		<li>Sell your data. Ever.</li>
		<li>Share with advertisers.</li>
		<li>Store full card numbers (Stripe handles that).</li>
	</ul>
	<h2>Your rights</h2>
	<p>
		Request export or deletion from Account → Privacy. Deletion is immediate and irreversible.
		Export arrives by email within 24 hours.
	</p>
</section>

<style>
	.wrap {
		max-width: 720px;
		margin: 0 auto;
		padding: var(--space-9) var(--space-6);
	}
	h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-2);
	}
	h2 {
		font-size: var(--fs-xl);
		margin: var(--space-6) 0 var(--space-3);
	}
	p,
	li {
		line-height: var(--lh-relaxed);
	}
	.muted {
		color: var(--color-text-muted);
	}
</style>
