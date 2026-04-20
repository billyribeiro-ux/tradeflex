<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>11.3 Component tests in a real browser — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 11 · Testing"
	title="11.3 · Component tests in a real browser"
	lede="JSDOM lies about layout, focus, and CSS. `vitest-browser-svelte` runs your .svelte.test.ts files in Chromium, so a button that looks disabled in JSDOM but is actually click-through in prod fails the test where it should."
>
	<section>
		<h2>Two test projects, one config</h2>
		<p>
			<code>vitest.config.ts</code> already defines two projects: <code>client</code> (browser) and
			<code>server</code> (Node). The split matters — pure logic tests don't need a browser, so they
			run in Node and finish in milliseconds. Only <code>.svelte.test.ts</code> files boot Chromium.
		</p>
		<CodeBlock title="vitest.config.ts" lang="ts">
			{`projects: [
  {
    test: {
      name: 'client',
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: 'chromium', headless: true }]
      },
      include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
      exclude: ['src/lib/server/**']
    }
  },
  {
    test: {
      name: 'server',
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
    }
  }
]`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				The naming convention is deliberate: <code>foo.test.ts</code> = server/Node test,
				<code>foo.svelte.test.ts</code> = browser test. You can see at a glance where a test runs
				— and the file-extension filter means no loose config can accidentally route a server-only
				module through Chromium.
			</p>
		</Aside>
	</section>

	<section>
		<h2>A first browser test</h2>
		<p>
			A component we already wrote — <code>PrevNext.svelte</code> — has four states: both links
			present, only prev, only next, neither. A single browser test proves all four render the right
			DOM with working hrefs.
		</p>
		<CodeBlock title="src/lib/components/course/PrevNext.svelte.test.ts" lang="ts">
			{`import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import PrevNext from './PrevNext.svelte';

const prev = { href: '/a', title: '1. Intro' };
const next = { href: '/c', title: '3. Next' };

test('renders both links when both are provided', async () => {
  const screen = render(PrevNext, { prev, next });
  await expect.element(screen.getByRole('link', { name: /intro/i }))
    .toHaveAttribute('href', '/a');
  await expect.element(screen.getByRole('link', { name: /next/i }))
    .toHaveAttribute('href', '/c');
});

test('renders only next when prev is undefined', async () => {
  const screen = render(PrevNext, { next });
  await expect.element(screen.getByRole('link', { name: /next/i })).toBeVisible();
  await expect.element(screen.queryByRole('link', { name: /intro/i })).toBeNull();
});`}
		</CodeBlock>
		<p>
			<code>render</code> returns a <em>screen</em> object keyed on real DOM queries —
			<code>getByRole</code>, <code>getByText</code>, <code>queryByRole</code>. These query in
			ways a user and a screen reader would; they're the same selectors Playwright's
			<code>@testing-library</code>-style APIs use.
		</p>
		<Aside type="caution">
			<p>
				<strong>Always prefer role/text queries over CSS or data-testid.</strong> A
				<code>data-testid</code> test lets you pass with a <code>&lt;div&gt;</code> that a screen
				reader can't see; a role test fails until the component is accessible. Accessibility
				comes free with the test style.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Testing interactions</h2>
		<p>
			The command palette opens on <kbd>⌘</kbd>+<kbd>K</kbd>, filters on typed input, and picks
			the active row on <kbd>Enter</kbd>. That's three keyboard behaviours and one state change —
			exactly the sort of thing JSDOM will silently lie about.
		</p>
		<CodeBlock title="src/lib/components/course/SearchStub.svelte.test.ts" lang="ts">
			{`import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import SearchStub from './SearchStub.svelte';

test('opens on cmd+k and focuses the input', async () => {
  const screen = render(SearchStub);
  await screen.locator('body').press('Meta+k');
  await expect.element(screen.getByRole('dialog')).toBeVisible();
  await expect.element(screen.getByRole('combobox')).toBeFocused();
});

test('filters as you type and picks on Enter', async () => {
  const screen = render(SearchStub);
  await screen.locator('body').press('Meta+k');
  await screen.getByRole('combobox').fill('webhook');
  // 6.3 Idempotent webhook is the only match containing "webhook"
  await expect.element(screen.getByRole('option', { name: /webhook/i })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				<code>toBeFocused</code> only works in a real browser. JSDOM's
				<code>document.activeElement</code> lies about focus in ways that pass tests but break
				keyboard navigation in production. This is why we run in Chromium.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Running them</h2>
		<CodeBlock title="bash" lang="bash">
			{`# First time — installs chromium (~150 MB). Subsequent runs use the cache.
pnpm exec playwright install chromium

pnpm test:unit
# client project runs .svelte.test.ts files in chromium
# server project runs everything else in Node

pnpm test:unit -- --run  # CI-style; no watch, exits on completion`}
		</CodeBlock>
		<p>
			On CI, the workflow caches <code>~/.cache/ms-playwright</code> keyed on the lockfile hash.
			First PR on a new lockfile downloads chromium once; every subsequent PR hits the cache and
			skips the ~15 seconds.
		</p>
	</section>

	<section>
		<h2>When to reach for which test</h2>
		<ul>
			<li>
				<strong>Pure function (currency, date math, URL builder)</strong> → Node unit test. Fast,
				cheap, runs in a millisecond.
			</li>
			<li>
				<strong>Component with DOM, events, or focus</strong> → browser test. One-second startup,
				real DOM, real focus.
			</li>
			<li>
				<strong>Full user journey (sign-up → checkout → member area)</strong> → Playwright E2E on a
				preview URL. Covered in 11.2.
			</li>
		</ul>
		<Aside type="tip">
			<p>
				<strong>A failed browser test is usually an accessibility bug.</strong>
				If your test can't find a role, a real user can't find it either. Fix the component, not
				the test.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				<code>.svelte.test.ts</code> runs in Chromium, everything else runs in Node — file extension
				decides.
			</li>
			<li>Use role/text queries; they test the component and its accessibility at the same time.</li>
			<li>Trust <code>toBeFocused</code> and <code>toBeVisible</code> in the browser. Don't trust them in JSDOM.</li>
			<li>CI caches the chromium install by lockfile hash — download once per lockfile change.</li>
		</ul>
	</section>
</CoursePage>
