<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';

	const registerAction = `// src/routes/(auth)/register/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';

export const load = ({ locals }) => {
  if (locals.user) throw redirect(303, '/account');
  return {};
};

export const actions = {
  default: async ({ request }) => {
    const fd = await request.formData();
    const email = fd.get('email')?.toString().trim() ?? '';
    const password = fd.get('password')?.toString() ?? '';
    const name = fd.get('name')?.toString().trim() ?? '';

    if (!email || !password || !name)
      return fail(400, { email, name, message: 'All fields required.' });
    if (password.length < 10)
      return fail(400, { email, name, message: 'Password must be ≥ 10 chars.' });

    try {
      await auth.api.signUpEmail({ body: { email, password, name } });
    } catch (err) {
      if (err instanceof APIError)
        return fail(400, { email, name, message: err.message });
      return fail(500, { email, name, message: 'Unexpected error.' });
    }
    throw redirect(303, '/account');
  }
};`;

	const loginAction = `// src/routes/(auth)/login/+page.server.ts
export const actions = {
  default: async ({ request }) => {
    const fd = await request.formData();
    const email = fd.get('email')?.toString().trim() ?? '';
    const password = fd.get('password')?.toString() ?? '';
    const next = fd.get('next')?.toString() || '/account';

    try {
      await auth.api.signInEmail({ body: { email, password } });
    } catch (err) {
      if (err instanceof APIError)
        return fail(400, { email, message: err.message });
      return fail(500, { email, message: 'Unexpected error.' });
    }
    throw redirect(303, next);
  },
  github: async () => {
    const result = await auth.api.signInSocial({
      body: { provider: 'github', callbackURL: '/account' }
    });
    if (result.url) throw redirect(303, result.url);
    return fail(400, { message: 'GitHub sign-in failed.' });
  }
};`;
</script>

<svelte:head><title>3.2 Register + login — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 3 · User auth"
	title="3.2 · Register + login"
	lede="Two form actions. Zero client-side password handling. Better Auth owns the crypto; our job is the UX around it."
>
	<section>
		<h2>Register</h2>
		<p>
			A classic SvelteKit form action: parse the body, validate, call <code>auth.api.signUpEmail</code>,
			redirect on success. Errors come back as structured <code>APIError</code>s from Better Auth — we
			surface the message and repopulate the non-sensitive fields so the user doesn't lose their typed
			email.
		</p>
		<CodeBlock lang="ts" code={registerAction} />
		<Aside type="caution" title="Never echo passwords back">
			<p>
				Notice <code>password</code> is not in any <code>fail()</code> payload. If validation fails
				the user re-types it. Echoing a password through the server response to the client is the
				kind of detail review tools will catch — better to build the habit now.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Login</h2>
		<p>
			Same shape, plus a second action for the GitHub OAuth button. Better Auth returns a redirect
			URL for the provider's consent screen; we forward the browser to it with a 303.
		</p>
		<CodeBlock lang="ts" code={loginAction} />
	</section>

	<section>
		<h2>The <code>next</code> parameter</h2>
		<p>
			The login page reads <code>?next=/some/path</code> and round-trips it through a hidden form
			field. When a member clicks a protected link while logged out, the route guard redirects them to
			<code>/login?next=/where/they/were-going</code>. Better login UX, one extra form field.
		</p>
	</section>

	<section>
		<h2>Progressive enhancement with <code>use:enhance</code></h2>
		<p>
			<code>use:enhance</code> intercepts the form submit and performs it over fetch, so the page
			doesn't reload. Critically, if JS hasn't loaded yet (slow network, script error), the form still
			submits the normal way — the server action handles both cases identically. That's why we don't
			ship a separate JSON endpoint for auth.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Both actions use <code>request.formData()</code> directly; Superforms lands in the contacts module.</li>
			<li>Better Auth handles password hashing, session creation, and OAuth.</li>
			<li>Never echo a password back in a <code>fail()</code> payload.</li>
			<li><code>?next=</code> round-trips through a hidden field for post-login redirects.</li>
		</ul>

		<h3>Next up</h3>
		<p><a href="/course/modules/3/route-guards">3.3 · Route guards + account →</a></p>
	</section>
</CoursePage>
