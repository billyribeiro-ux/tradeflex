<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>7.2 Entitlements + gating — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 7 · Billing services"
	title="7.2 · Entitlements + gating"
	lede="A subscription row only matters if it blocks or unblocks a feature. This page wires the entitlement check into /alerts and surfaces membership state on /account."
>
	<section>
		<h2>The entitlement rule</h2>
		<p>
			A caller is entitled if <strong>any</strong> of these are true:
		</p>
		<ul>
			<li>Their subscription status is <code>active</code> or <code>trialing</code>.</li>
			<li>Their <code>grace_until</code> timestamp is still in the future.</li>
			<li>
				They hold a staff role (<code>owner</code>, <code>admin</code>, <code>content</code>,
				<code>support</code>).
			</li>
		</ul>
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
		<Aside type="tip">
			<p>
				Keep this check in <em>one</em> function. Every gate in the app should call the same method so
				a future refactor (say, adding a bundle entitlement) is a one-line change.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Gating /alerts</h2>
		<p>
			The alerts feed is the product. Free users see the pricing page with a clear reason; staff
			bypass the gate so we can QA in production.
		</p>
		<CodeBlock title="src/routes/alerts/+page.server.ts" lang="ts">
			{`const STAFF_ROLES = new Set(['owner', 'admin', 'content', 'support']);

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.caller.userId) {
    throw redirect(303, \`/login?next=\${encodeURIComponent(url.pathname)}\`);
  }
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
		<h2>Surfacing state on /account</h2>
		<p>
			The account page loads the subscription and customer row alongside the profile. A member sees
			their plan, renewal date, and a single button to open the Stripe Customer Portal. Anyone
			without a customer yet sees a link to /pricing.
		</p>
		<CodeBlock title="src/routes/account/+page.server.ts" lang="ts">
			{`const [profile, customer, subscription] = await Promise.all([
  profileService.getForCaller(locals.caller),
  customersService.forCaller(locals.caller),
  subscriptionsService.forCaller(locals.caller)
]);
const entitled = await subscriptionsService.hasActiveEntitlement(locals.caller);
return { profile, user: locals.user, customer, subscription, entitled };`}
		</CodeBlock>
	</section>

	<section>
		<h2>Why redirect, not 403</h2>
		<p>
			A 403 on <code>/alerts</code> would be correct — the caller has no right to the resource — but
			it's a dead end. Redirecting to <code>/pricing?gate=alerts</code> is a conversion funnel: the user
			lands on a page explaining why, with the plans one click away.
		</p>
		<Aside type="tip">
			<p>
				Do <em>not</em> redirect API endpoints this way. A JSON endpoint returning 302 confuses clients.
				Endpoint handlers should return 402 Payment Required or 403 Forbidden with a body that names the
				missing entitlement.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>One function decides entitlement; every gate calls it.</li>
			<li>Page gates redirect; endpoint gates return a structured error.</li>
			<li>Staff roles always bypass the gate — you need to test in prod.</li>
			<li>
				Grace windows extend access past a failed payment; the rule handles them automatically.
			</li>
		</ul>
	</section>
</CoursePage>
