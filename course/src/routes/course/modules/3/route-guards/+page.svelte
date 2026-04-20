<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';

	const guard = `// src/routes/account/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { profileService } from '$lib/server/services/profile';

export const load = async ({ locals, url }) => {
  if (!locals.caller.userId) {
    throw redirect(303, \`/login?next=\${encodeURIComponent(url.pathname)}\`);
  }
  const profile = await profileService.getForCaller(locals.caller);
  return { profile, user: locals.user };
};`;

	const save = `export const actions = {
  save: async ({ request, locals }) => {
    if (!locals.caller.userId) return fail(401, { message: 'Not signed in.' });

    const fd = await request.formData();
    const raw = {
      displayName: fd.get('displayName')?.toString() ?? '',
      bio: fd.get('bio')?.toString() ?? '',
      timezone: fd.get('timezone')?.toString() || 'UTC',
      theme: fd.get('theme')?.toString() ?? 'system',
      marketingOptIn: fd.get('marketingOptIn') === 'on'
    };

    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) {
      return fail(400, { values: raw, message: parsed.error.issues[0]?.message });
    }

    await profileService.upsertForCaller(locals.caller, parsed.data);
    return { success: true, savedAt: new Date().toISOString() };
  }
};`;
</script>

<svelte:head><title>3.3 Route guards + account — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 3 · User auth"
	title="3.3 · Route guards + account"
	lede="Gate the member surface at the load function. The action re-checks, because the guard and the write are two different requests."
>
	<section>
		<h2>The one-liner guard</h2>
		<p>
			A protected page is just a load function that throws a redirect when <code>locals.caller.userId</code>
			is null. No middleware, no decorator — plain throw.
		</p>
		<CodeBlock lang="ts" code={guard} />
		<Aside type="tip" title="Redirect preserves intent">
			<p>
				By passing <code>url.pathname</code> through the <code>next</code> param, a guest clicking a
				protected link lands back on the right page after signing in. Without that round-trip, login
				always kicks you to <code>/account</code> — which feels like the app forgot what you wanted.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Don't trust the page load in the action</h2>
		<p>
			A load function proves you were signed in <em>when the page rendered</em>. It says nothing about
			whether you're still signed in when the form submits. The action re-checks — otherwise a
			long-idle tab can submit a write with a stale session.
		</p>
		<CodeBlock lang="ts" code={save} />
		<p>
			The pattern: <strong>guards are defence in depth</strong>. Load guards protect the read;
			action guards protect the write; the service layer guards the query. Any one of them missing is
			a bug, but together they're redundant — which is what safety looks like.
		</p>
	</section>

	<section>
		<h2>Why <code>locals.caller</code> and not <code>locals.user</code>?</h2>
		<p>
			<code>locals.user</code> is the Better Auth user row. It's great for UI ("signed in as <code>user.email</code>"),
			but it carries no role information, no entitlements, no request id. <code>locals.caller</code>
			is the value we built in Module 2 — it is the thing services want. Mixing the two is how
			role-check bugs sneak in.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Gate member pages with a redirect in the load function; preserve the destination via <code>next</code>.</li>
			<li>Re-check auth in the action; load guards do not cover writes.</li>
			<li>Prefer <code>locals.caller</code> for anything that enforces rules; <code>locals.user</code> is for UI only.</li>
		</ul>

		<h3>Next up</h3>
		<p><a href="/course/modules/3/sessions-and-signout">3.4 · Sessions + sign-out →</a></p>
	</section>
</CoursePage>
