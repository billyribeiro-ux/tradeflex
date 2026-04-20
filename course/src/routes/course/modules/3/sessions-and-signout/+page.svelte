<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';

	const logout = `// src/routes/(auth)/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const load = () => {
  throw redirect(303, '/');
};

export const actions = {
  default: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    throw redirect(303, '/');
  }
};`;

	const cookie = `Set-Cookie: better-auth.session_token=ey…;
  Path=/;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Max-Age=604800;`;
</script>

<svelte:head><title>3.4 Sessions + sign-out — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 3 · User auth"
	title="3.4 · Sessions + sign-out"
	lede="A session is just a row in the database and a signed cookie. Understanding what lives where is how you debug the weird cases."
>
	<section>
		<h2>What Better Auth stores</h2>
		<p>On successful login, Better Auth writes a row to the <code>session</code> table:</p>
		<ul>
			<li><code>id</code> — opaque identifier (referenced by the cookie)</li>
			<li><code>userId</code> — foreign key to <code>user</code></li>
			<li><code>expiresAt</code> — absolute expiry; renewed on activity</li>
			<li><code>ipAddress</code>, <code>userAgent</code> — for the "active sessions" UI we'll add later</li>
		</ul>
		<p>
			Then it sets a signed, HttpOnly cookie pointing to that session. The cookie never contains user
			data; it's a pointer to a server-side row.
		</p>
		<CodeBlock lang="http" code={cookie} />
	</section>

	<section>
		<h2>Why HttpOnly + SameSite=Lax</h2>
		<ul>
			<li><strong>HttpOnly</strong>: JavaScript cannot read it. XSS can't steal the token.</li>
			<li><strong>Secure</strong>: ships only over HTTPS (in production).</li>
			<li><strong>SameSite=Lax</strong>: blocks cross-origin <em>writes</em> that would otherwise ride on the cookie — the core CSRF defence.</li>
		</ul>
		<Aside type="caution" title="If you ever see the session cookie in document.cookie">
			<p>
				Something has turned <code>HttpOnly</code> off. That is a security incident, not a DX
				convenience. The session token is never legitimately visible to page scripts.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Sign-out</h2>
		<CodeBlock lang="ts" code={logout} />
		<p>Two things happen:</p>
		<ol>
			<li>Better Auth's server API deletes the session row.</li>
			<li>Better Auth sets <code>Max-Age=0</code> on the cookie, evicting it from the browser.</li>
		</ol>
		<p>
			Both are required. Deleting only the row leaves a stale cookie that points at nothing (harmless
			but confusing). Deleting only the cookie leaves the row live until <code>expiresAt</code> — and
			if an attacker has the cookie value, they still have a valid session. Do both.
		</p>
	</section>

	<section>
		<h2>Module 3 wrap-up</h2>
		<p>
			You now have a working, gated, audited auth surface. Every sign-up, sign-in, and profile edit
			goes through the service layer; every write produces an audit row; every request produces a log
			line with a request id. Future features plug in on top of these invariants instead of
			reinventing them.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>A session is a DB row plus a signed, HttpOnly cookie that references it.</li>
			<li>HttpOnly + Secure + SameSite=Lax is the CSRF/XSS minimum — never weaken without reason.</li>
			<li>Sign-out must clear both the row and the cookie.</li>
		</ul>

		<h3>Next up</h3>
		<p><a href="/course/modules/4/overview">4.1 · Contacts CRUD overview →</a> <em>(arrives next turn)</em></p>
	</section>
</CoursePage>
