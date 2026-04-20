<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>10.2 Response patterns when denied — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 10 · Tier-based access control"
	title="10.2 · Response patterns — redirect, 402, or degrade"
	lede="The entitlement function has two outputs: yes and no. What you do with the 'no' depends on the surface — and getting it wrong is how apps feel either hostile or broken. Three patterns cover every case."
>
	<section>
		<h2>The three patterns</h2>
		<p>
			Every denied request should land on exactly one of these. Mix them up and users end up staring
			at blank screens or JSON dumps; apply them consistently and denials feel like part of the
			product.
		</p>
		<ul>
			<li>
				<strong>Redirect</strong> — for pages a human is navigating to with a browser. Send them somewhere
				that explains what happened and gives them a next step.
			</li>
			<li>
				<strong>402 Payment Required</strong> — for endpoints consumed by fetch, forms, or remote functions.
				The client code decides what to show; the server just answers truthfully.
			</li>
			<li>
				<strong>Graceful degrade</strong> — for mixed pages where part of the UI is free and part is gated.
				Render the page; hide or shade the gated bit with an explicit "upgrade" affordance.
			</li>
		</ul>
	</section>

	<section>
		<h2>Pattern 1 — redirect (navigated pages)</h2>
		<p>
			Page loads are browser navigations. A user typed or clicked a URL; they expect a rendered
			page. Bouncing them to <code>/pricing?gate=alerts</code> turns the 403 into a funnel step.
		</p>
		<CodeBlock title="src/routes/alerts/+page.server.ts" lang="ts">
			{`import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { entitlementFor } from '$lib/server/billing/entitlement';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.caller) throw redirect(303, '/login?next=/alerts');

  const ent = await entitlementFor(locals.caller.userId);
  if (!ent.ok) throw redirect(303, '/pricing?gate=alerts');

  return { /* ... */ };
};`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Two-tiered redirect: unauthenticated → <code>/login?next=...</code>, authenticated but
				unentitled → <code>/pricing?gate=...</code>. The query params let the landing page show the
				right message ("you were trying to reach X — sign in" vs. "X is members-only").
			</p>
		</Aside>
	</section>

	<section>
		<h2>Pattern 2 — 402 (endpoints)</h2>
		<p>
			<code>402 Payment Required</code> is a registered HTTP status specifically for this case. It has
			sat mostly unused for 30 years and is making a comeback as SaaS enforces tiered access. Use it:
			the semantic is exact and clients can branch on it cleanly.
		</p>
		<CodeBlock title="src/routes/api/alerts/stream/+server.ts" lang="ts">
			{`import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { entitlementFor } from '$lib/server/billing/entitlement';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.caller) throw error(401, 'auth required');

  const ent = await entitlementFor(locals.caller.userId);
  if (!ent.ok) {
    throw error(402, {
      code: 'subscription_required',
      message: 'Live alerts require an active membership.',
      upgradeUrl: '/pricing?gate=alerts'
    });
  }

  // serve the stream
  return json({ /* ... */ });
};`}
		</CodeBlock>
		<p>
			The body shape is a contract with the client. Always include a machine-readable
			<code>code</code>, a human-readable <code>message</code>, and a <code>upgradeUrl</code> — that's
			enough to render a toast, an inline banner, or a modal without another request.
		</p>
	</section>

	<section>
		<h2>Pattern 3 — graceful degrade</h2>
		<p>
			The account page is half-public, half-gated: a user should see their own profile, but the
			"Edit alert preferences" control belongs to members. Rendering the page and shading the gated
			section is kinder than redirecting away from it.
		</p>
		<CodeBlock title="src/routes/account/+page.svelte (excerpt)" lang="svelte">
			{`{#if data.entitlement.ok}
  <AlertPreferencesEditor prefs={data.prefs} />
{:else}
  <section class="locked" aria-label="Members-only feature">
    <h3>Alert preferences</h3>
    <p>Available on any paid plan. Your alerts and thresholds live here.</p>
    <a class="btn-primary" href="/pricing?gate=alert-prefs">See plans</a>
  </section>
{/if}`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				<strong>Degrade is a UX pattern, not a security one.</strong> Even when the UI is hidden, the
				endpoint that would update preferences must still check entitlement and return 402 on denial.
				Never rely on "the button isn't there" as the only gate.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Client-side handling of 402</h2>
		<p>
			A fetch call that gets 402 should land in a small, shared handler that renders a toast with
			the upgrade URL. This is the one-way ratchet: every new endpoint that throws 402 automatically
			gets the right UI for free.
		</p>
		<CodeBlock title="src/lib/client/fetch.ts" lang="ts">
			{`import { toast } from '$lib/client/toast';
import { goto } from '$app/navigation';

export async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.status === 402) {
    const body = await res.json();
    toast.error(body.message ?? 'Upgrade required', {
      action: { label: 'See plans', onClick: () => goto(body.upgradeUrl) }
    });
    throw new Error('subscription_required');
  }
  return res;
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>The decision in one line</h2>
		<ul>
			<li>
				Is this a whole-page navigation? → <strong>Redirect</strong>.
			</li>
			<li>
				Is this an endpoint a client called? → <strong>402</strong>.
			</li>
			<li>
				Is this one section on a mixed page? → <strong>Degrade</strong>, plus 402 on the actions.
			</li>
		</ul>
		<Aside type="tip">
			<p>
				The shared rule behind all three: <strong
					>the server never lies and never goes silent</strong
				>. The difference is only who consumes the truth — a browser, a script, or the page that's
				already open.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Three patterns cover every denial surface: redirect, 402, degrade.</li>
			<li>
				<code>entitlementFor</code> stays the same; only the response shape changes per surface.
			</li>
			<li>
				402 body is a contract: <code>code</code>, <code>message</code>, <code>upgradeUrl</code>.
			</li>
			<li>Degrade is UX, not security. The endpoint under it still returns 402.</li>
		</ul>
	</section>
</CoursePage>
