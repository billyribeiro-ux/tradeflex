<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>13.2 Toasts that survive redirects — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 13 · UX extras"
	title="13.2 · Toasts that survive redirects"
	lede="A $state-rune toast store is trivial when everything happens on one page. The interesting part is making 'Profile saved' still appear after a 303 redirect. Two patterns do the job."
>
	<section>
		<h2>The store we actually ship</h2>
		<CodeBlock title="src/lib/toast/store.svelte.ts" lang="ts">
			{`export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  expiresAt: number;
}

const toasts = $state<Toast[]>([]);

export const toast = {
  get list() {
    return toasts;
  },
  push(kind: ToastKind, message: string, ttlMs = 4000) {
    const id = crypto.randomUUID();
    toasts.push({ id, kind, message, expiresAt: Date.now() + ttlMs });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        const idx = toasts.findIndex((t) => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
      }, ttlMs);
    }
    return id;
  },
  success(msg: string, ttlMs?: number) {
    return this.push('success', msg, ttlMs);
  },
  error(msg: string, ttlMs?: number) {
    return this.push('error', msg, ttlMs ?? 6000);
  },
  dismiss(id: string) {
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.splice(idx, 1);
  }
};`}
		</CodeBlock>
		<p>
			The <code>.svelte.ts</code> extension is the key. It tells the Svelte compiler to treat this
			file as a rune module, so <code>$state</code> compiles correctly outside of a component. Mount
			<code>&lt;ToastHost&gt;</code>
			once in the root layout and every route can call
			<code>toast.success()</code>
			without passing props.
		</p>
	</section>

	<section>
		<h2>Pattern 1 — client-side, after form success</h2>
		<p>
			When you use <code>use:enhance</code> and return success, the page updates in place.
			<code>$effect</code>
			on the <code>form</code> prop fires the toast.
		</p>
		<CodeBlock title="+page.svelte" lang="svelte">
			{'<' +
				`script lang="ts">
  import { toast } from '$lib/toast/store.svelte';
  let { form } = $props();
  $effect(() => {
    if (form && 'success' in form && form.success) toast.success('Profile saved');
  });
</` +
				`script>`}
		</CodeBlock>
		<p>
			This works because the redirect never happens — <code>use:enhance</code> prevents the full navigation
			and merges the action result back into the current page. The toast renders immediately.
		</p>
	</section>

	<section>
		<h2>Pattern 2 — flash cookie, when the action redirects</h2>
		<p>
			Some actions must redirect. Portal sessions. Stripe Checkout. Any action that throws
			<code>redirect(303, ...)</code>. A <code>use:enhance</code> handler can't keep state across a
			full navigation; <code>$state</code> resets. For this case we use a one-shot cookie that survives
			one round-trip.
		</p>
		<CodeBlock title="src/lib/server/flash.ts" lang="ts">
			{`import type { Cookies } from '@sveltejs/kit';

type Flash = { kind: 'success' | 'error' | 'info'; message: string };

export function setFlash(cookies: Cookies, flash: Flash) {
  cookies.set('flash', JSON.stringify(flash), {
    path: '/',
    httpOnly: false, // read by client on next request
    sameSite: 'lax',
    maxAge: 60
  });
}

export function readFlash(cookies: Cookies): Flash | null {
  const raw = cookies.get('flash');
  if (!raw) return null;
  cookies.delete('flash', { path: '/' });
  try {
    return JSON.parse(raw) as Flash;
  } catch {
    return null;
  }
}`}
		</CodeBlock>
		<p>Then in the action:</p>
		<CodeBlock title="+page.server.ts" lang="ts">
			{`portal: async ({ cookies, locals }) => {
  const url = await billingService.openPortal(locals.caller, {...});
  setFlash(cookies, { kind: 'info', message: 'Opening Stripe portal…' });
  throw redirect(303, url);
}`}
		</CodeBlock>
		<p>
			And in <code>hooks.server.ts</code> or the root <code>+layout.server.ts</code>, read it once
			and pass it down:
		</p>
		<CodeBlock title="src/routes/+layout.server.ts" lang="ts">
			{`import { readFlash } from '$lib/server/flash';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  return { flash: readFlash(cookies) };
};`}
		</CodeBlock>
		<p>
			In the root layout component, <code>$effect</code> watches for the flash and pushes it to the toast
			store. The cookie is deleted on read, so it fires exactly once.
		</p>
	</section>

	<section>
		<h2>Preserving the <code>next=</code> intent</h2>
		<p>
			When a route redirects to <code>/login</code> we pass the original URL so the user lands back where
			they wanted after sign-in.
		</p>
		<CodeBlock title="src/routes/account/+page.server.ts (excerpt)" lang="ts">
			{`export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.caller.userId) {
    throw redirect(303, '/login?next=' + encodeURIComponent(url.pathname + url.search));
  }
  // ...
};`}
		</CodeBlock>
		<p>
			The login page reads <code>url.searchParams.get('next')</code> and, after a successful sign-in,
			redirects there. Two rules:
		</p>
		<ul>
			<li>
				<strong>Always <code>encodeURIComponent</code>.</strong> A <code>next</code> value with its
				own <code>?foo=bar</code> will otherwise corrupt your query string.
			</li>
			<li>
				<strong>Validate that <code>next</code> starts with <code>/</code>.</strong> Never redirect
				to an absolute URL — that's an open-redirect vulnerability.
				<code>if (!next.startsWith('/')) next = '/'</code> is enough.
			</li>
		</ul>
		<Aside type="caution">
			<p>
				Do not trust <code>next</code> to be safe just because your login form built it. An attacker
				can construct
				<code>https://tradeflex.app/login?next=https://evil.example.com</code>
				and mail it to a user. If you don't guard against that, you've built them a phishing lever.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Reduced-motion first</h2>
		<p>
			<code>&lt;ToastHost&gt;</code>'s slide-in is wrapped in
			<code>@media (prefers-reduced-motion: no-preference)</code>, which means by default — on
			operating systems that report reduced-motion — the toast just appears. Same goes for any
			animation you ship: motion is an opt-in, not a default.
		</p>
		<CodeBlock title="ToastHost.svelte style" lang="css">
			{`@media (prefers-reduced-motion: no-preference) {
  .toast {
    animation: slide-in 220ms var(--ease-out-quart, ease-out);
  }
}`}
		</CodeBlock>
		<p>
			This is one rule we follow through the whole app: animate only when the user hasn't asked us
			not to. Motion that respects <code>prefers-reduced-motion</code> is invisible polish; motion that
			ignores it is an accessibility bug.
		</p>
	</section>

	<section>
		<h2>What's next</h2>
		<p>
			That closes the course scope. From here: add more alert types, swap the ebook lead magnet for
			a real PDF, build the macOS Tauri wrapper, and keep the course pages evergreen as the product
			grows. The same manifest + <code>&lt;CoursePage&gt;</code> primitives carry any amount of future
			teaching without a refactor.
		</p>
	</section>
</CoursePage>
