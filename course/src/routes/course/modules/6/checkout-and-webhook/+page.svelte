<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head><title>6.2 Checkout + webhook — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 6 · Stripe + SvelteKit"
	title="6.2 · Checkout + webhook"
	lede="Two endpoints. One outgoing (create a checkout session, redirect), one incoming (receive webhooks, verify, store). Together they are the whole billing ingress/egress."
>
	<section>
		<h2>Checkout: the outgoing path</h2>
		<CodeBlock title="src/routes/api/billing/checkout/+server.ts" lang="ts">
			{`export const POST: RequestHandler = async ({ request, locals, url }) => {
  const body = await readBody(request);            // json or form-data
  const { priceId } = schema.parse(body);
  const checkoutUrl = await billingService.startCheckout(locals.caller, {
    priceId,
    successUrl: \`\${url.origin}/account?checkout=success\`,
    cancelUrl: \`\${url.origin}/pricing?checkout=canceled\`,
    email: locals.user?.email
  });
  throw redirect(303, checkoutUrl);   // form POST → redirect to Stripe
};`}
		</CodeBlock>
		<p>
			The pricing page uses this as a form action — progressive enhancement: JS off still works.
		</p>
	</section>

	<section>
		<h2>Webhook: the incoming path</h2>
		<Steps>
			<li>Read the raw body — signature verification needs the exact bytes Stripe sent.</li>
			<li>Look up <code>STRIPE_WEBHOOK_SECRET</code> from settings.</li>
			<li>
				HMAC-SHA256 the <code>{`\${timestamp}.\${rawBody}`}</code> string with the secret; compare
				to the <code>v1=</code> part of the signature header.
			</li>
			<li>
				Store the event in <code>webhook_delivery</code> (idempotent on <code>eventId</code>).
			</li>
			<li>Return 200. Dispatch to handlers happens async in Module 7.</li>
		</Steps>
		<CodeBlock title="verify + store" lang="ts">
			{`const rawBody = await request.text();
const verified = await verifySignature(rawBody, request.headers.get('stripe-signature'));
const event = JSON.parse(rawBody) as StripeEvent;

await db.insert(webhookDelivery).values({
  id: crypto.randomUUID(),
  provider: 'stripe',
  eventId: event.id,
  eventType: event.type,
  payload: event,
  processedAt: null,
  error: verified ? null : 'unverified-signature'
}).onConflictDoNothing();    // idempotent on eventId

return json({ received: true });`}
		</CodeBlock>
	</section>

	<section>
		<h2>HMAC, using the Web Crypto API</h2>
		<CodeBlock title="verifySignature" lang="ts">
			{`const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(secret),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
);
const mac = await crypto.subtle.sign(
  'HMAC', key,
  new TextEncoder().encode(\`\${timestamp}.\${rawBody}\`)
);
const hex = Array.from(new Uint8Array(mac))
  .map(b => b.toString(16).padStart(2, '0')).join('');
return hex === signature;`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				<strong>Never trust the parsed body until you've verified.</strong> We read raw text first, then
				parse. If verification fails we still record the attempt — so a bad actor DOS-spamming your endpoint
				shows up in the admin, flagged, instead of being silently dropped.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Try it</h2>
		<CodeBlock lang="sh">
			{`# Tab 1
stripe listen --forward-to http://localhost:5173/api/stripe/webhook

# Tab 2
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted`}
		</CodeBlock>
		<p>
			Refresh <a href="/admin/payments">/admin/payments</a>. Three rows, green verification, event
			types matching what you triggered.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				Checkout is a redirect. The success URL carries a query string; the <code
					>checkout.session.completed</code
				> event is the source of truth.
			</li>
			<li>Webhook verification is HMAC-SHA256 over <code>{`\${timestamp}.\${rawBody}`}</code>.</li>
			<li>Store first, handle later — never lose an event, even if your handler crashes.</li>
		</ul>
		<h3>Up next</h3>
		<p>
			Module 7 turns stored webhook rows into subscription state: customer sync, subscription table,
			grace periods, cancel at period end.
		</p>
	</section>
</CoursePage>
