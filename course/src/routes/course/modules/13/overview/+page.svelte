<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>13.1 UX extras — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 13 · UX extras"
	title="13.1 · UX extras"
	lede="Small touches, big difference. Toasts that speak in verbs, redirects that preserve intent, and a branded Stripe Checkout that doesn't feel like leaving your site."
>
	<section>
		<h2>Toasts that survive redirects</h2>
		<p>
			A classic bug: the user saves a form, you redirect, and the "Saved" toast is lost because the
			page reloads. Fix: pass toast state through the URL (a single
			<code>?saved=profile</code> query param) and let the layout consume it on mount.
		</p>
		<CodeBlock title="src/routes/+layout.svelte" lang="svelte">
			{'<' +
				`script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let toast = $state<string | null>(null);
  $effect(() => {
    const key = $page.url.searchParams.get('saved');
    if (!key) return;
    toast = { profile: 'Profile saved', checkout: 'Membership activated' }[key] ?? null;
    // strip the param so a refresh doesn't re-toast
    const u = new URL($page.url);
    u.searchParams.delete('saved');
    goto(u.pathname + u.search, { replaceState: true });
    const t = setTimeout(() => (toast = null), 2500);
    return () => clearTimeout(t);
  });
` +
				'<' +
				`/script>`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Verbs, not nouns. "Profile saved" beats "Success". "Membership activated" beats "Thank you".
				Tell the user what the system just did, in the past tense.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Redirects that preserve intent</h2>
		<p>
			When a gate kicks, the user lost where they were going. Always preserve the
			<code>next=</code> query parameter through login and through checkout, so after the ceremony we
			land them where they were trying to go.
		</p>
		<CodeBlock title="gate pattern" lang="ts">
			{`if (!locals.caller.userId) {
  throw redirect(303, \`/login?next=\${encodeURIComponent(url.pathname + url.search)}\`);
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>Branding the Stripe Checkout</h2>
		<p>
			In your Stripe dashboard: <em>Settings → Branding</em>. Upload your logo, icon, and the two
			accent colors. Every hosted Checkout and Portal page will then carry your brand. Do this
			<em>before</em> your first live customer lands on Checkout; they'll read "stripe.com" in the address
			bar but the page will look like yours.
		</p>
	</section>

	<section>
		<h2>Reduced motion, always</h2>
		<p>
			Every animation we add gates on <code>prefers-reduced-motion</code>. The site never violates
			the user's OS-level accessibility preference — GSAP flourishes disable, transitions collapse
			to snap-in, WGSL shaders swap to a static gradient.
		</p>
		<CodeBlock title="src/lib/motion.ts" lang="ts">
			{`export function prefersReduced(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// inside a component:
$effect(() => {
  if (prefersReduced()) return;
  gsap.from(el, { y: 20, opacity: 0, duration: 0.4 });
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>Empty states that sell</h2>
		<p>
			The empty <code>/alerts</code> list for a fresh member shouldn't say "No alerts." It should say
			"You'll see real-time setups here. Usually 1–3 per trading day." An empty state is an expectation-setter.
			Don't waste it.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Toasts survive redirects via the URL, self-destruct on consume.</li>
			<li>Every gate preserves <code>next=</code>.</li>
			<li>Stripe branding is five minutes of dashboard work. Do it before launch.</li>
			<li>Reduced-motion is a default, not a toggle.</li>
			<li>Empty states are sales copy.</li>
		</ul>
	</section>
</CoursePage>
