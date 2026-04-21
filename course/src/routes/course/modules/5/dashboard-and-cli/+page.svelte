<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head><title>5.2 Dashboard + CLI — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 5 · Stripe fundamentals"
	title="5.2 · Dashboard + CLI"
	lede="Sign up, flip into test mode, install the CLI. Ten minutes and you're done — the rest of this module is building products on top."
>
	<section>
		<Steps>
			<li>
				Create a Stripe account at <a href="https://dashboard.stripe.com/register" rel="noreferrer"
					>dashboard.stripe.com/register</a
				>.
			</li>
			<li>
				Top-right: toggle <strong>Test mode</strong> ON. Every screen should now show the "Test" pill.
			</li>
			<li>Install the CLI. On macOS: <code>brew install stripe/stripe-cli/stripe</code>.</li>
			<li>
				Authenticate: <code>stripe login</code> — opens a browser, pairs the CLI with your test account.
			</li>
			<li>
				Grab your test secret key from <strong>Developers → API keys</strong>. Paste into
				<a href={resolve('/admin/settings/integrations')}>/admin/settings/integrations</a>.
			</li>
		</Steps>
	</section>

	<section>
		<h2>Verify with `stripe listen`</h2>
		<CodeBlock title="terminal" lang="sh">
			stripe listen --forward-to http://localhost:5173/api/stripe/webhook
		</CodeBlock>
		<p>Expected output:</p>
		<CodeBlock lang="text">
			{`> Ready! You are using Stripe API Version [2024-12-18.acacia]. Your webhook signing secret is whsec_…
> Use the secret to verify events at your webhook endpoint.`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Copy that <code>whsec_…</code> and paste it into <code>STRIPE_WEBHOOK_SECRET</code> in
				Integrations. The <code>stripe listen</code> secret is stable across runs on the same machine
				— you set it once.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Send a test event</h2>
		<CodeBlock title="separate terminal" lang="sh">
			stripe trigger checkout.session.completed
		</CodeBlock>
		<p>
			You should see a <code>checkout.session.completed</code> line in the
			<code>stripe listen</code>
			tab, and a matching row at <a href={resolve('/admin/payments')}>/admin/payments</a> with a green
			"verified" indicator.
		</p>
	</section>

	<section>
		<h2>Useful CLI shortcuts</h2>
		<CodeBlock lang="sh">
			{`stripe logs tail                     # stream API request logs
stripe products list                 # list products (test mode)
stripe prices list --lookup-keys tradeflex_monthly
stripe trigger invoice.paid
stripe customers create --email test@example.com
stripe payment_methods create --type card --card.token tok_visa`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Test mode is a complete separate world — nothing you do there touches real money.</li>
			<li>The CLI does two things you'll use daily: forward webhooks, trigger events.</li>
			<li>
				Settings integrations is where the secret key lives — never in <code>.env</code> once you're past
				localhost.
			</li>
		</ul>
		<h3>Next up</h3>
		<p><a href={resolve('/course/modules/5/products-and-prices')}>5.3 · Products + prices →</a></p>
	</section>
</CoursePage>
