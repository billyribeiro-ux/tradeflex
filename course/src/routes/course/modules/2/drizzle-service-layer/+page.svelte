<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';

	const dbClient = `// src/lib/server/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$lib/server/env';
import * as schema from './schema';

const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 10 : 3,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });
export type DB = typeof db;`;

	const caller = `// src/lib/server/authz/caller.ts
export type Role = 'owner' | 'admin' | 'support' | 'content'
  | 'finance' | 'analyst' | 'read_only';

export interface Caller {
  userId: string | null;
  roles: readonly Role[];
  entitlements: readonly string[];
  impersonatorUserId?: string | null;
  requestId: string;
}

export class AuthnError extends Error {
  readonly httpStatus = 401;
  constructor(msg = 'Authentication required') { super(msg); this.name = 'AuthnError'; }
}

export class AuthzError extends Error {
  readonly httpStatus = 403;
  constructor(msg = 'Forbidden') { super(msg); this.name = 'AuthzError'; }
}

export function assertAuthenticated(
  caller: Caller
): asserts caller is Caller & { userId: string } {
  if (!caller.userId) throw new AuthnError();
}

export function assertRole(caller: Caller, ...allowed: Role[]) {
  assertAuthenticated(caller);
  if (!caller.roles.some((r) => allowed.includes(r))) throw new AuthzError();
}`;

	const service = `// src/lib/server/services/profile.ts
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export const profileService = {
  async getForCaller(caller: Caller) {
    assertAuthenticated(caller);
    const rows = await db.select().from(profile)
      .where(eq(profile.userId, caller.userId)).limit(1);
    return rows[0] ?? null;
  },

  async upsertForCaller(caller: Caller, patch: ProfilePatch) {
    assertAuthenticated(caller);
    const [row] = await db.insert(profile)
      .values({ userId: caller.userId, ...patch })
      .onConflictDoUpdate({
        target: profile.userId,
        set: { ...patch, updatedAt: new Date() }
      })
      .returning();

    await writeAudit(caller, {
      action: 'profile.upsert',
      targetKind: 'profile',
      targetId: caller.userId,
      metadata: { fields: Object.keys(patch) }
    });
    return row;
  }
};`;

	const callsite = `// src/routes/account/+page.server.ts
import { profileService } from '$lib/server/services/profile';

export const load = async ({ locals }) => {
  const profile = await profileService.getForCaller(locals.caller);
  return { profile };
};`;
</script>

<svelte:head>
	<title>2.3 Drizzle client + service layer — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 2 · SvelteKit + data layer"
	title="2.3 · Drizzle client + service layer"
	lede="One Drizzle instance, server-only imports, and a Caller object that travels with every call. This is where authorization stops being a decoration and becomes structural."
>
	<section>
		<h2>One client, one module</h2>
		<p>
			A Drizzle client wraps a <code>postgres-js</code> connection pool. Instantiating it twice
			means two pools, double the connections, and subtle bugs when transactions span the wrong
			one. We create it exactly once, in <code>src/lib/server/db/index.ts</code>, and import it
			from there.
		</p>
		<CodeBlock lang="ts" title="src/lib/server/db/index.ts" code={dbClient} />
		<Aside type="caution" title="Server-only imports">
			<p>
				The path <code>$lib/server</code> is special in SvelteKit: anything under it is rejected at
				build time if a client bundle imports it. Keep all database code under <code>$lib/server</code>.
				If you see <code>Cannot import "$lib/server/db" into client bundle</code>, that's the
				safety net firing — a page component is trying to query the DB directly. Move the call
				into <code>+page.server.ts</code> or a remote function.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The Caller: identity as a value</h2>
		<p>
			Every service function takes a <code>Caller</code> as its first argument. The Caller is the
			answer to the question "who is doing this?" — it carries the user id, their roles, any
			capability entitlements from their plan, the request id for correlation, and an optional
			<code>impersonatorUserId</code> when an admin is acting on a member's behalf.
		</p>
		<CodeBlock lang="ts" title="src/lib/server/authz/caller.ts" code={caller} />
		<p>
			Compare with the alternatives:
		</p>
		<ul>
			<li>
				<strong>Postgres Row-Level Security (RLS).</strong> Every query runs as the user, policies
				enforce visibility in the database. Safer in a vacuum, but it leaks auth into SQL, makes
				impersonation awkward, makes background jobs awkward, and locks you out of batch admin
				work. We considered it and explicitly rejected it in ADR 0008.
			</li>
			<li>
				<strong>Middleware that mutates request context.</strong> Classic Express pattern. It's
				invisible — you can't look at a function signature and know whether it requires auth. A
				Caller argument is visible: every service signature says <code>(caller: Caller, ...)</code>.
			</li>
			<li>
				<strong>"Just check session in every route."</strong> Works for a weekend project. At
				Trade Flex scale there are dozens of write paths; missing one is a vulnerability.
			</li>
		</ul>
	</section>

	<section>
		<h2>Anatomy of a service</h2>
		<p>
			A service module is a plain object of async functions. Each function:
		</p>
		<ol>
			<li>Takes a <code>Caller</code> first.</li>
			<li>Asserts what it needs up front (<code>assertAuthenticated</code>, <code>assertRole</code>, <code>assertEntitlement</code>). These throw typed errors that the request pipeline converts to 401/403.</li>
			<li>Does the Drizzle query.</li>
			<li>On any state change, writes an audit row before returning.</li>
		</ol>
		<CodeBlock lang="ts" title="src/lib/server/services/profile.ts" code={service} />
	</section>

	<section>
		<h2>How routes use it</h2>
		<p>
			<code>locals.caller</code> is populated by the request pipeline (next page). A route hands it
			straight to the service and trusts the service to enforce rules.
		</p>
		<CodeBlock lang="ts" code={callsite} />
		<p>
			This is the full discipline: routes don't talk to Drizzle, services don't talk to request
			context. The service is testable in isolation with a synthetic Caller.
		</p>
	</section>

	<section>
		<h2>Audit by default</h2>
		<p>
			Every write goes through <code>writeAudit</code>. The audit row captures
			<code>actorUserId</code>, <code>impersonatorUserId</code>, <code>action</code>,
			<code>targetKind</code>, <code>targetId</code>, arbitrary metadata, and the
			<code>requestId</code>. This is not optional — it's what lets you answer "who changed this?"
			three months later when a member is unhappy.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>One Drizzle client, imported from <code>$lib/server/db</code>, never instantiated twice.</li>
			<li>Every service function takes a <code>Caller</code> and asserts requirements before querying.</li>
			<li>Routes hand <code>locals.caller</code> to services; services own authorization and audit.</li>
			<li>RLS was considered and rejected: service-layer auth is visible, testable, and friendly to impersonation + background jobs.</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href="/course/modules/2/request-pipeline">2.4 · Request pipeline + load →</a>
		</p>
	</section>
</CoursePage>
