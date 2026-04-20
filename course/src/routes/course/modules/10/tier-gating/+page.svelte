<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>10.1 Tier-based access control — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 10 · Tier access control"
	title="10.1 · Tier-based access control"
	lede="The subscription table tells us who paid. The access-control layer tells us what they can see and do. Three rules, used everywhere, decided by one function."
>
	<section>
		<h2>Three rules</h2>
		<ol>
			<li><strong>Pages</strong> gate via <code>+page.server.ts load</code>. Redirect on miss.</li>
			<li><strong>Endpoints</strong> gate at the top of the handler. Return structured error on miss.</li>
			<li><strong>Services</strong> never gate on their own. The caller decides; services enforce by <em>scope</em> (eg. "your own rows"), not by tier.</li>
		</ol>
		<Aside type="tip">
			<p>
				Services stay tier-blind on purpose. When you add a new tier later, you won't hunt
				through services rewriting conditionals — the gate sits at the edge.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The entitlement function</h2>
		<p>
			Every gate calls the same method. No copy-paste of <code>status === 'active'</code> checks
			scattered across the codebase. When the rule changes (eg. adding legacy grandfathered
			members), you change it in one place.
		</p>
		<CodeBlock title="src/lib/server/services/subscriptions.ts" lang="ts">
{`const ACTIVE_STATUSES = new Set(['active', 'trialing']);

async hasActiveEntitlement(caller: Caller): Promise<boolean> {
  if (!caller.userId) return false;
  const sub = await this.forCaller(caller);
  if (!sub) return false;
  if (ACTIVE_STATUSES.has(sub.status)) return true;
  if (sub.graceUntil && sub.graceUntil > new Date()) return true;
  return false;
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>Page gate</h2>
		<CodeBlock title="src/routes/alerts/+page.server.ts" lang="ts">
{`const STAFF_ROLES = new Set(['owner', 'admin', 'content', 'support']);

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.caller.userId) throw redirect(303, \`/login?next=\${encodeURIComponent(url.pathname)}\`);
  const isStaff = locals.caller.roles.some((r) => STAFF_ROLES.has(r));
  if (!isStaff) {
    const entitled = await subscriptionsService.hasActiveEntitlement(locals.caller);
    if (!entitled) throw redirect(303, '/pricing?gate=alerts');
  }
  const alerts = await alertsService.listForMember(locals.caller, 50);
  return { alerts };
};`}
		</CodeBlock>
	</section>

	<section>
		<h2>Endpoint gate</h2>
		<p>
			For JSON endpoints, never redirect — return <code>402 Payment Required</code> with a body
			that names the missing entitlement. Clients can map 402 to "show upsell modal" without
			needing to parse a redirect.
		</p>
		<CodeBlock title="pattern" lang="ts">
{`export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.caller.userId) throw error(401, 'sign in required');
  const entitled = await subscriptionsService.hasActiveEntitlement(locals.caller);
  if (!entitled) {
    return json({ error: 'entitlement required', entitlement: 'member' }, { status: 402 });
  }
  // … serve the data
};`}
		</CodeBlock>
	</section>

	<section>
		<h2>Preventing multiple plans</h2>
		<p>
			A single customer should never have two overlapping active subscriptions. Our checkout
			handler reads <code>customer.forCaller</code> and, if a live subscription exists, redirects
			to the portal instead of starting a new session.
		</p>
		<CodeBlock title="guard in startCheckout" lang="ts">
{`async startCheckout(caller, params) {
  const existing = await subscriptionsService.forCaller(caller);
  if (existing && ACTIVE_STATUSES.has(existing.status)) {
    // user already pays — send them to portal to switch plans
    throw new AlreadySubscribedError(existing.stripeSubscriptionId);
  }
  // … create session
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>UI limits</h2>
		<p>
			Gating isn't only backend. The pricing banner, the locked-content card on <code>/courses</code>,
			and the greyed-out "Create alert" button on the marketing site all read the same entitlement.
			A single <code>data.entitled</code> boolean in the root <code>+layout.server.ts</code> is
			often the cleanest spread point.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Pages redirect; endpoints 402; services stay tier-blind.</li>
			<li>One function decides entitlement. Reuse it everywhere.</li>
			<li>Prevent duplicate active subscriptions at the checkout boundary, not after the fact.</li>
			<li>Gate in the UI too — but the UI is never the source of truth.</li>
		</ul>
	</section>
</CoursePage>
