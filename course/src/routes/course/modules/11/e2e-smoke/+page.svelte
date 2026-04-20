<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>11.2 E2E smoke tests — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 11 · Testing"
	title="11.2 · E2E smoke tests"
	lede="A smoke test answers one question: did the deploy leave the lights on? Not 'is every button correct' — those are unit tests. Smoke tests are your canary for each preview URL."
>
	<section>
		<h2>What a smoke test is</h2>
		<p>
			A smoke test opens a page on the actual built app and asserts one or two things about it.
			Fast, no login, no state, no cleanup. If a smoke test fails on a preview URL, something is
			fundamentally broken — imports, CSS, a route — and you should not click "merge."
		</p>
		<Aside type="tip">
			<p>
				The point of smoke tests is <strong>where they run</strong>, not how thorough they are. Run
				them on every preview deploy, not just locally. A test that passes on <code>localhost</code>
				but never runs on Vercel is not a test — it's a wish.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Smoke test: the marketing home</h2>
		<CodeBlock title="src/routes/(marketing)/home.e2e.ts" lang="ts">
			{`import { expect, test } from '@playwright/test';

test('marketing home renders hero and primary CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.locator('a').filter({ hasText: /start|trial|pricing|join/i }).first()
  ).toBeVisible();
});

test('contact form renders', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
});`}
		</CodeBlock>
		<p>
			Two assertions per test. No fixtures. If the hero heading or the CTA is missing, the build
			shipped something wrong. If the contact form lost its email input, a refactor broke the page
			without a compile error. Both are cases where the build passes but the user sees a broken app
			— exactly what smoke tests exist to catch.
		</p>
	</section>

	<section>
		<h2>Smoke test: pricing + the gate banner</h2>
		<CodeBlock title="src/routes/(marketing)/pricing/pricing.e2e.ts" lang="ts">
			{`import { expect, test } from '@playwright/test';

test('pricing page renders both plans and a CTA', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('body')).toContainText(/month|year/i);
});

test('gate banner appears when redirected from /alerts', async ({ page }) => {
  await page.goto('/pricing?gate=alerts');
  await expect(page.locator('body')).toContainText(/alerts|membership|access/i);
});`}
		</CodeBlock>
		<p>
			The second test is the interesting one. In Module 10 we built a redirect from
			<code>/alerts</code>
			to <code>/pricing?gate=alerts</code> for unauthenticated visitors. That gate banner is the only
			explanation the user gets for the redirect — so we assert it renders. If someone later removes the
			banner thinking it's cosmetic, this test catches it.
		</p>
	</section>

	<section>
		<h2>Running them against a preview</h2>
		<CodeBlock title="Terminal" lang="bash">
			{`# Local build + preview (what CI does)
pnpm build && pnpm preview &
pnpm test:e2e

# Against a Vercel preview URL (what deploy.yml should do)
PLAYWRIGHT_BASE_URL=https://tradeflex-<hash>.vercel.app pnpm test:e2e`}
		</CodeBlock>
		<p>
			Locally, <code>playwright.config.ts</code> starts <code>pnpm preview</code> on port 4173 and
			points tests at it. In CI we override <code>PLAYWRIGHT_BASE_URL</code> to hit the real preview URL
			— so we test the thing we're about to ship, not a local build of the same SHA.
		</p>
		<Aside type="caution">
			<p>
				Smoke tests should <strong>not</strong> hit your production DB or Stripe account. Either deploy
				the preview with a branch DB + Stripe test mode, or skip any test that writes state. A smoke test
				that accidentally creates a real subscription is a support ticket.
			</p>
		</Aside>
	</section>

	<section>
		<h2>What's next</h2>
		<p>
			Module 12 wires these tests into CI: the PR lane runs them on every Vercel preview URL, and
			the main lane runs them one more time against production after <code
				>vercel deploy --prod</code
			>. The same two-assertion test file does double duty — canary for previews, post-deploy sanity
			for production.
		</p>
	</section>
</CoursePage>
