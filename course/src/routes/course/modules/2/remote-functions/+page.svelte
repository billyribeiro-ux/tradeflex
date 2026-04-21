<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';

	const action = `// src/routes/account/+page.server.ts
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { profileService } from '$lib/server/services/profile';

const schema = z.object({
  displayName: z.string().min(1).max(80),
  timezone: z.string().default('UTC')
});

export const load = async ({ locals }) => {
  const profile = await profileService.getForCaller(locals.caller);
  const form = await superValidate(profile ?? undefined, zod(schema));
  return { form };
};

export const actions = {
  save: async ({ request, locals }) => {
    const form = await superValidate(request, zod(schema));
    if (!form.valid) return fail(400, { form });
    await profileService.upsertForCaller(locals.caller, form.data);
    return { form };
  }
};`;

	const remote = `// src/lib/server/remote/profile.remote.ts
import { form, command, query } from '$app/server';
import { z } from 'zod';
import { profileService } from '$lib/server/services/profile';

export const getMyProfile = query(async (_input, event) => {
  return profileService.getForCaller(event.locals.caller);
});

export const saveProfile = form(
  z.object({
    displayName: z.string().min(1).max(80),
    timezone: z.string().default('UTC')
  }),
  async (data, event) => {
    return profileService.upsertForCaller(event.locals.caller, data);
  }
);

export const deleteAvatar = command(
  z.object({}),
  async (_input, event) => {
    return profileService.clearAvatar(event.locals.caller);
  }
);`;

	const consume = [
		'<!-- src/routes/account/+page.svelte -->',
		'<' + 'script lang="ts">',
		"  import { saveProfile, getMyProfile } from '$lib/server/remote/profile.remote';",
		'',
		'  const profile = getMyProfile();',
		'<' + '/script>',
		'',
		'<form {...saveProfile}>',
		'  <label>',
		'    Display name',
		'    <input name="displayName" value={profile.current?.displayName ?? \'\'} />',
		'  </label>',
		'  <button type="submit">Save</button>',
		'</form>'
	].join('\n');
</script>

<svelte:head>
	<title>2.5 Remote functions + actions — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 2 · SvelteKit + data layer"
	title="2.5 · Remote functions + actions"
	lede="SvelteKit gives you two shapes for the write path. Both enforce server-side authorization via the same service layer. Neither is a REST endpoint."
>
	<section>
		<h2>Three shapes, one rule</h2>
		<p>Trade Flex has exactly three legitimate ways to call server code from a page:</p>
		<ol>
			<li>
				<strong>Load functions</strong> — reads that run during navigation (covered on the previous page).
			</li>
			<li>
				<strong>Form actions</strong> — the classic SvelteKit way to handle form submissions with progressive-enhancement.
			</li>
			<li>
				<strong>Remote functions</strong> — typed RPC from client to server, introduced in SvelteKit
				2. They come in three flavors: <code>query</code>, <code>form</code>, and
				<code>command</code>.
			</li>
		</ol>
		<p>
			All three paths land in a service. No route code queries the DB directly. No route code checks
			roles directly. That is the rule that keeps the service-layer invariant intact.
		</p>
		<Aside type="danger" title="No standalone REST/JSON endpoints for app state">
			<p>
				We do not add <code>+server.ts</code> routes for reads/writes the app itself consumes — they
				skip CSRF protection, they're not type-checked across the client/server boundary, and
				they're easy to call from other origins. The only <code>+server.ts</code> files in Trade Flex
				are for third-party webhooks (Stripe, Resend) and a handful of health endpoints.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Form actions: the default</h2>
		<p>
			For form submissions, form actions are the first thing to reach for. They work without JS,
			they integrate cleanly with Superforms + Zod, and they're what every tutorial in the SvelteKit
			docs assumes.
		</p>
		<CodeBlock lang="ts" title="src/routes/account/+page.server.ts" code={action} />
		<p>
			The flow: Superforms validates against a Zod schema, the action returns <code>fail(400)</code>
			if validation fails, otherwise it hands the validated data to the service. Authorization lives inside
			the service — the route never checks a role.
		</p>
	</section>

	<section>
		<h2>Remote functions: when RPC fits better</h2>
		<p>
			Remote functions are the right choice when the call doesn't map naturally to a form submission
			— for example, a "delete avatar" button, a "resend verification email" link, or a query that a
			component needs on mount that isn't part of the page's load. They are end-to-end typed: the
			client call-site gets the exact return type of the server function.
		</p>
		<CodeBlock lang="ts" title="src/lib/server/remote/profile.remote.ts" code={remote} />
		<p>Each variant has a narrow purpose:</p>
		<ul>
			<li>
				<code>query</code> — a typed read. Call from a component; the result is reactive.
			</li>
			<li>
				<code>form</code> — like a form action but importable into any component. Pairs with a Zod schema
				for the body.
			</li>
			<li>
				<code>command</code> — an imperative write that isn't a form (e.g., "delete avatar").
			</li>
		</ul>
	</section>

	<section>
		<h2>Consuming a remote function</h2>
		<CodeBlock lang="svelte" code={consume} />
		<p>
			Notice what's <em>not</em> here: no <code>fetch</code>, no hand-written URL, no response
			parsing. The remote function is a typed import; the framework wires up the HTTP underneath.
			Renaming the server function fails the client build — a refactor invariant that REST endpoints
			can't offer.
		</p>
	</section>

	<section>
		<h2>Choosing between them</h2>
		<p>When picking between form actions and remote functions, ask:</p>
		<ul>
			<li>Is it a form submission on a specific page? → <strong>form action</strong>.</li>
			<li>
				Does a component need to invoke it independently of any page? → <strong
					>remote function</strong
				>.
			</li>
			<li>
				Is it a read that isn't part of initial page data? → <strong
					>remote <code>query</code></strong
				>.
			</li>
			<li>Is it an imperative "do this" click? → <strong>remote <code>command</code></strong>.</li>
		</ul>
		<p>
			Both paths converge on the service layer. Both get logged, audited, and authorization-checked
			the same way. The choice is ergonomic, not structural.
		</p>
	</section>

	<section>
		<h2>Module 2 wrap-up</h2>
		<p>With Module 2 landed, every later module inherits four invariants:</p>
		<ol>
			<li>Env is parsed at boot; missing config crashes loudly.</li>
			<li>Drizzle has exactly one client, imported only from <code>$lib/server</code>.</li>
			<li>
				Every request has a <code>Caller</code> and a <code>requestId</code>, and produces one log
				line.
			</li>
			<li>
				Every read + write funnels through a service that takes the Caller and enforces its own
				rules.
			</li>
		</ol>
		<p>
			From here on, the rest of the course is features — and every feature re-uses this plumbing
			rather than re-inventing it.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				Form actions are the default for form submissions; remote functions are the default for
				everything else.
			</li>
			<li>No <code>+server.ts</code> routes for app state — only webhooks and health checks.</li>
			<li>
				Both paths land in the same service layer and inherit its authorization + audit guarantees.
			</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href={resolve('/course/modules/3/overview')}>3.1 · User auth overview →</a>
			&nbsp;<em>(lands in the next build turn)</em>
		</p>
	</section>
</CoursePage>
