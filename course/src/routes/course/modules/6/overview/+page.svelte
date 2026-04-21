<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>6.1 Stripe + SvelteKit — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 6 · Stripe + SvelteKit"
	title="6.1 · Stripe + SvelteKit"
	lede="A ~120-line Stripe REST client we own. No SDK, no surprises, edge-runtime-safe. Runtime key from the settings service — no boot-time env dependency."
>
	<section>
		<h2>Why not the npm SDK?</h2>
		<ul>
			<li>
				<strong>Footprint:</strong> the <code>stripe</code> package pulls in ~2MB and Node crypto shims.
			</li>
			<li>
				<strong>Edge:</strong> SvelteKit routes can run on edge runtimes; <code>fetch</code> works there,
				the SDK does not.
			</li>
			<li>
				<strong>Surface:</strong> a membership needs five endpoints. Writing them ourselves is less code
				than learning the SDK's typing quirks.
			</li>
			<li>
				<strong>Auditability:</strong> every network call is visible in our own source — no vendored layer.
			</li>
		</ul>
	</section>

	<section>
		<h2>The client, in full</h2>
		<CodeBlock title="src/lib/server/stripe.ts" lang="ts">
			{`async function stripeCall<T>(method, path, body) {
  const key = await settingsService.get('STRIPE_SECRET_KEY');
  if (!key) throw new MissingConfigError(
    'Stripe is not configured. Set STRIPE_SECRET_KEY in /admin/settings/integrations.'
  );
  const headers = {
    Authorization: \`Bearer \${key}\`,
    'Stripe-Version': '2024-12-18.acacia'
  };
  // formEncode turns { foo: { bar: 1 } } into foo[bar]=1,
  // which is what Stripe expects.
  const payload = body && method !== 'GET' ? formEncode(body) : undefined;
  if (payload) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const res = await fetch(\`https://api.stripe.com/v1\${path}\`, {
    method, headers, body: payload
  });
  const json = await res.json();
  if (!res.ok) throw new StripeRequestError(json.error?.message, res.status);
  return json;
}`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				The key is loaded <strong>per-call</strong> from <code>settingsService.get</code>, which
				caches for 60 seconds. So rotating the key in the admin takes effect within a minute — no
				redeploy.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Form-encoding is the weird part</h2>
		<p>
			Stripe's API predates JSON-first design. It wants <code
				>application/x-www-form-urlencoded</code
			>
			with bracketed keys:
		</p>
		<CodeBlock lang="text"
			>line_items[0][price]=price_123&line_items[0][quantity]=1&mode=subscription</CodeBlock
		>
		<p>
			Our <code>formEncode</code> recurses over objects + arrays and emits the bracketed form. It is
			the only "clever" code in the client; everything else is straight <code>fetch</code>.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Fetch client + HMAC webhook verification — ~150 lines, no deps.</li>
			<li>Key lookup is dynamic; rotating the admin setting takes effect in ≤60s.</li>
			<li>
				API version is pinned in the header so Stripe can't silently break the response shape.
			</li>
		</ul>
		<h3>Next up</h3>
		<p>
			<a href={resolve('/course/modules/6/checkout-and-webhook')}>6.2 · Checkout + webhook →</a>
		</p>
	</section>
</CoursePage>
