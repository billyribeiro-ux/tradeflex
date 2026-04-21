<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';

	const hooks = `// src/hooks.server.ts
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { anonymousCaller } from '$lib/server/authz/caller';
import { resolveCaller } from '$lib/server/authz/resolve-caller';
import { log, reportError } from '$lib/server/log';

const handleRequestId: Handle = async ({ event, resolve }) => {
  const incoming = event.request.headers.get('x-request-id');
  const requestId = incoming && /^[a-zA-Z0-9-]{8,128}$/.test(incoming)
    ? incoming
    : crypto.randomUUID();
  event.locals.requestId = requestId;
  event.locals.caller = anonymousCaller(requestId);
  const response = await resolve(event);
  response.headers.set('x-request-id', requestId);
  return response;
};

const handleLogging: Handle = async ({ event, resolve }) => {
  const start = performance.now();
  try {
    const response = await resolve(event);
    log.info('http', {
      requestId: event.locals.requestId,
      userId: event.locals.caller?.userId ?? null,
      method: event.request.method,
      path: event.url.pathname,
      status: response.status,
      latencyMs: Math.round(performance.now() - start)
    });
    return response;
  } catch (err) {
    reportError(err, {
      requestId: event.locals.requestId,
      path: event.url.pathname,
      latencyMs: Math.round(performance.now() - start)
    });
    throw err;
  }
};

const handleCaller: Handle = async ({ event, resolve }) => {
  event.locals.caller = await resolveCaller(
    event.locals.user?.id ?? null,
    event.locals.requestId
  );
  return resolve(event);
};

export const handle: Handle = sequence(
  handleRequestId,
  handleLogging,
  handleBetterAuth,
  handleCaller
);

export const handleError: HandleServerError = ({ error, event, status }) => {
  reportError(error, { requestId: event.locals.requestId, path: event.url.pathname, status });
  return { message: status >= 500 ? 'Internal error' : 'Request failed',
           requestId: event.locals.requestId };
};`;

	const appLocals = `// src/app.d.ts
import type { Caller } from '$lib/server/authz/caller';

declare global {
  namespace App {
    interface Locals {
      user?: User;
      session?: Session;
      caller: Caller;      // ← always defined, never nullable
      requestId: string;
    }
    interface Error {
      message: string;
      requestId?: string;  // ← rendered on +error.svelte, users can quote it back
    }
  }
}`;

	const logLine = `{"level":"info","msg":"http","at":"2026-04-20T18:22:14.031Z","requestId":"4e7c…","userId":"01J…","method":"GET","path":"/account","status":200,"latencyMs":42}`;

	const load = `// src/routes/account/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { profileService } from '$lib/server/services/profile';

export const load = async ({ locals, url }) => {
  if (!locals.caller.userId) {
    throw redirect(303, \`/auth/login?next=\${encodeURIComponent(url.pathname)}\`);
  }
  const profile = await profileService.getForCaller(locals.caller);
  return { profile };
};`;
</script>

<svelte:head>
	<title>2.4 Request pipeline + load — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 2 · SvelteKit + data layer"
	title="2.4 · Request pipeline + load"
	lede="hooks.server.ts is where a raw HTTP request becomes something load functions can trust: a request id, a logged trail, and a resolved Caller."
>
	<section>
		<h2>What hooks.server.ts is</h2>
		<p>
			In SvelteKit, <code>src/hooks.server.ts</code> exports a <code>handle</code> function that wraps
			every server request. It's the one place guaranteed to run before any route, any load, any form
			action, any remote function. That makes it the natural home for cross-cutting concerns.
		</p>
		<p>We stack four handlers, in order:</p>
		<ol>
			<li>
				<strong>handleRequestId</strong> — generate or reuse a request id, attach a placeholder anonymous
				Caller, and echo the id back on the response.
			</li>
			<li>
				<strong>handleLogging</strong> — wrap the rest of the pipeline in a try/catch so every request
				produces exactly one structured log line, even on error.
			</li>
			<li>
				<strong>handleBetterAuth</strong> — resolve the session; populate <code>locals.user</code>.
			</li>
			<li>
				<strong>handleCaller</strong> — turn <code>locals.user.id</code> into a full
				<code>Caller</code> with roles fetched from the DB.
			</li>
		</ol>
	</section>

	<section>
		<h2>The code</h2>
		<CodeBlock lang="ts" title="src/hooks.server.ts (excerpt)" code={hooks} />
		<Aside type="tip" title="Why sequence() order matters">
			<p>
				Request id must be first so every downstream log line has it. Logging wraps auth so auth
				failures are still logged. Auth runs before Caller because Caller reads <code
					>locals.user</code
				>. If you reorder, you'll see <code>requestId: undefined</code> in logs — a classic symptom.
			</p>
		</Aside>
	</section>

	<section>
		<h2>App.Locals is a contract</h2>
		<p>
			The shape of <code>locals</code> is declared once, in <code>src/app.d.ts</code>. Making
			<code>caller</code> and <code>requestId</code> <em>non-optional</em> is deliberate — by the time
			any route runs, the pipeline guarantees both are present. No route needs to check.
		</p>
		<CodeBlock lang="ts" code={appLocals} />
	</section>

	<section>
		<h2>What a request looks like in logs</h2>
		<p>
			Every request produces one JSON line. Pipe it into <code>jq</code> locally, or into your log
			backend of choice in prod (Axiom, Datadog, Loki — see the observability plan). The
			<code>requestId</code> matches the one we echo in the response header, so a user quoting an error
			id gets you straight to the log row.
		</p>
		<CodeBlock lang="json" code={logLine} />
	</section>

	<section>
		<h2>Load functions: the read path</h2>
		<p>
			A <code>+page.server.ts</code> file exports <code>load</code>; SvelteKit runs it on the server
			before rendering the page. This is where reads happen.
		</p>
		<CodeBlock lang="ts" code={load} />
		<p>Three rules for every load:</p>
		<ol>
			<li>
				<strong
					>Never import <code>$lib/server/db</code> or a service from <code>+page.ts</code>.</strong
				>
				The <code>.ts</code> (no <code>.server</code>) variant runs on the client too — the build
				will block the import, but keep the rule in your head.
			</li>
			<li>
				<strong>Pass <code>locals.caller</code> to the service.</strong> Never re-derive identity.
			</li>
			<li>
				<strong>Throw <code>redirect</code> or <code>error</code>, don't return them.</strong> They are
				special: returning would send the response literal to the client.
			</li>
		</ol>
	</section>

	<section>
		<h2>Errors, correlation, and the user</h2>
		<p>
			<code>handleError</code> is SvelteKit's last-resort catch. Ours calls <code>reportError</code>
			with the request id and returns a <code>{`{ message, requestId }`}</code> shape that
			<code>+error.svelte</code> renders. If a member sees "Something went wrong — reference
			<code>4e7c-…</code>", support can paste that id into the log backend and land on the exact
			line.
		</p>
		<p>
			This is Trade Flex's answer to "we don't use Sentry." We don't need a SaaS to read our own
			logs — we just need the correlation to survive from browser to server to storage.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				<code>hooks.server.ts</code> stacks four handlers: request id → logging → Better Auth → Caller.
			</li>
			<li>
				<code>locals.caller</code> and <code>locals.requestId</code> are non-optional by contract.
			</li>
			<li>
				Every request emits exactly one structured log line; every error carries a request id the
				user can quote.
			</li>
			<li>
				Load functions read via services; they never touch the DB directly and never re-derive
				identity.
			</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href={resolve('/course/modules/2/remote-functions')}>2.5 · Remote functions + actions →</a>
		</p>
	</section>
</CoursePage>
