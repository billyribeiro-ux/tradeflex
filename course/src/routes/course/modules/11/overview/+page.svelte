<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>11.1 Testing — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 11 · Testing"
	title="11.1 · Testing"
	lede="Three test layers, each with a narrow job. Unit for services, integration for DB + Stripe-mock, E2E for the user-visible journey. No layer should try to do another's job."
>
	<section>
		<h2>The pyramid we actually use</h2>
		<ul>
			<li><strong>Unit (Vitest).</strong> Pure-function services. Fast. Run on every save.</li>
			<li>
				<strong>Integration (Vitest + live Neon branch).</strong> Service → DB round-trip. Run on PR.
			</li>
			<li>
				<strong>E2E (Playwright).</strong> Auth, CRUD, checkout redirect. Run on every preview deploy.
			</li>
		</ul>
		<Aside type="tip">
			<p>
				Don't mock the database. A past employer mocked Postgres and shipped a broken migration
				because mocked tests passed. Use a real Neon branch per PR and throw it away after.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Unit: a services test</h2>
		<CodeBlock title="src/lib/server/services/subscriptions.test.ts" lang="ts">
			{`import { describe, it, expect } from 'vitest';

describe('hasActiveEntitlement rule', () => {
  const rule = (sub: { status: string; graceUntil: Date | null } | null) => {
    if (!sub) return false;
    if (sub.status === 'active' || sub.status === 'trialing') return true;
    if (sub.graceUntil && sub.graceUntil > new Date()) return true;
    return false;
  };

  it('returns true for active', () => expect(rule({ status: 'active', graceUntil: null })).toBe(true));
  it('returns true for trialing', () => expect(rule({ status: 'trialing', graceUntil: null })).toBe(true));
  it('returns false for canceled without grace', () =>
    expect(rule({ status: 'canceled', graceUntil: null })).toBe(false));
  it('returns true for canceled within grace', () =>
    expect(rule({ status: 'canceled', graceUntil: new Date(Date.now() + 60_000) })).toBe(true));
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>Integration: a Drizzle round-trip</h2>
		<CodeBlock title="src/lib/server/services/customers.integration.test.ts" lang="ts">
			{`import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '$lib/server/db';
import { customer, user } from '$lib/server/db/schema';
import { customersService } from '$lib/server/services/customers';

describe('customersService', () => {
  const userId = 'test-user-' + Date.now();
  beforeAll(async () => {
    await db.insert(user).values({ id: userId, email: \`\${userId}@ex.local\` });
  });

  it('upserts from Stripe and reads back', async () => {
    await customersService.upsertFromStripe(userId, 'cus_test_1', null);
    const caller = { userId, roles: [], entitlements: [], requestId: 't' };
    const row = await customersService.forCaller(caller);
    expect(row?.stripeCustomerId).toBe('cus_test_1');
  });
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>E2E: the checkout redirect</h2>
		<p>
			We don't test through Stripe's Checkout UI — that's Stripe's job. We assert that our POST
			returns a 303 to a <code>checkout.stripe.com</code> URL. Anything past that is a third-party surface.
		</p>
		<CodeBlock title="e2e/checkout.spec.ts" lang="ts">
			{`import { test, expect } from '@playwright/test';

test('signed-in user reaches Stripe checkout', async ({ page, request }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\\/account/);

  const res = await request.post('/api/billing/checkout', {
    data: { priceId: process.env.TEST_PRICE_ID! },
    headers: { 'content-type': 'application/json' },
    maxRedirects: 0
  }).catch((e) => e.response);

  const body = await res.json();
  expect(body.url).toMatch(/^https:\\/\\/checkout\\.stripe\\.com\\//);
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>Commands</h2>
		<CodeBlock title="pnpm scripts" lang="bash">
			{`pnpm test:unit              # vitest watch
pnpm test:unit -- --run     # one-shot (CI)
pnpm test:e2e               # playwright, uses preview URL
pnpm test:integration       # vitest + real Neon branch`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Three layers, no overlap.</li>
			<li>Real DB for integration, real Stripe only for the boundary assertion.</li>
			<li>E2E stops at the Stripe-hosted surface. You own nothing past it.</li>
			<li>Every test that fails in CI must be reproducible locally — no snowflakes.</li>
		</ul>
	</section>
</CoursePage>
