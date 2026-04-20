<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head>
	<title>1.5 Profiles + authorization — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 1 · Project setup"
	title="1.5 · Profiles + authorization"
	lede="Add a profile table keyed 1:1 to the Better Auth user, introduce the service-layer pattern, and build the primitive every later module will use."
>
	<section>
		<h2>What you&rsquo;ll learn</h2>
		<ul>
			<li>
				Why <code>user</code> (from Better Auth) and <code>profile</code> (our data) are two tables, not
				one.
			</li>
			<li>
				What <strong>Row Level Security (RLS)</strong> is — because the original course outline uses
				it — and why our stack uses <em>service-layer authorization</em> instead.
			</li>
			<li>
				How a typed <code>Caller</code> object threads identity + roles + entitlements through every write.
			</li>
			<li>How to emit an <code>audit_event</code> row on every state-changing call, for free.</li>
		</ul>
	</section>

	<section>
		<h2>Two tables, not one</h2>
		<p>
			<code>user</code> is owned by Better Auth. It stores email, name, image, verification state.
			<strong>Never edit the generated <code>auth.schema.ts</code></strong> — it will be regenerated whenever
			auth config changes, and your edits would be overwritten.
		</p>
		<p>
			<code>profile</code> is our data about the user — bio, timezone, avatar blob key, notification
			preferences, theme. It has a 1:1 foreign key to <code>user.id</code>. Separating them means
			upgrading Better Auth (which controls <code>user</code>) does not touch our columns.
		</p>
	</section>

	<section>
		<h2>RLS vs service-layer: the pivot</h2>
		<p>
			A traditional Postgres-native approach is <strong>Row Level Security (RLS)</strong>: you write
			SQL policies on each table that the database itself evaluates per query, using claims from the
			current session. It works well when your auth system, your DB, and your app all agree on how
			to thread identity (Supabase is built around this).
		</p>
		<p>
			Our stack is Better Auth + Neon + Drizzle. Better Auth identity lives in the SvelteKit
			request, not in a Postgres session variable, so RLS policies would have to be invented from
			scratch. Instead, we use <strong>service-layer authorization</strong>: every read and write
			goes through a typed service function that takes a <code>Caller</code> argument and enforces the
			check in application code.
		</p>
		<p>This has three properties worth calling out:</p>
		<ol>
			<li>
				Policies live next to the code that uses them — no &ldquo;which policy is hiding this
				row?&rdquo; debugging.
			</li>
			<li>Services are plain functions — unit tests are trivial.</li>
			<li>If we ever swap DBs, the auth-z logic travels with us.</li>
		</ol>
	</section>

	<section>
		<h2>Steps</h2>

		<Steps>
			<li>
				<h4>Add the profile table to our schema</h4>
				<p>
					Open <code>src/lib/server/db/schema.ts</code> and add a <code>profile</code> table
					alongside the demo <code>task</code> table:
				</p>
				<CodeBlock title="src/lib/server/db/schema.ts" lang="ts"
					>{`import { pgTable, serial, integer, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const task = pgTable('task', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  priority: integer('priority').notNull().default(1)
});

export const profile = pgTable('profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  bio: text('bio'),
  timezone: text('timezone').notNull().default('UTC'),
  avatarBlobKey: text('avatar_blob_key'),
  avatarShape: text('avatar_shape').notNull().default('circle'),
  notificationPrefs: jsonb('notification_prefs').notNull().default({}),
  theme: text('theme').notNull().default('system'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const auditEvent = pgTable('audit_event', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id'),
  action: text('action').notNull(),
  targetKind: text('target_kind').notNull(),
  targetId: text('target_id'),
  metadata: jsonb('metadata').notNull().default({}),
  at: timestamp('at').notNull().defaultNow()
});

export * from './auth.schema';`}</CodeBlock
				>
			</li>

			<li>
				<h4>Generate and apply the migration</h4>
				<CodeBlock lang="bash"
					>$ pnpm db:generate $ DATABASE_URL=$DATABASE_URL_DIRECT pnpm db:migrate</CodeBlock
				>
			</li>

			<li>
				<h4>Define the Caller type</h4>
				<p>
					A <code>Caller</code> is the authenticated identity making a service call: user id + roles +
					entitlements. Every service method takes it as the first argument, so no service ever reads
					auth state from a global.
				</p>
				<CodeBlock title="src/lib/server/authz/caller.ts" lang="ts"
					>{`export type Role = 'owner' | 'admin' | 'support' | 'content' | 'finance' | 'analyst' | 'read_only';

export interface Caller {
  userId: string | null;
  roles: readonly Role[];
  entitlements: readonly string[];
  impersonatorUserId?: string;
  requestId: string;
}

export const anonymousCaller = (requestId: string): Caller => ({
  userId: null,
  roles: [],
  entitlements: [],
  requestId
});

export class AuthzError extends Error {
  readonly httpStatus = 403;
  constructor(message = 'forbidden') {
    super(message);
    this.name = 'AuthzError';
  }
}

export function assertAuthenticated(caller: Caller): asserts caller is Caller & { userId: string } {
  if (!caller.userId) throw new AuthzError('authentication required');
}

export function assertRole(caller: Caller, ...allowed: Role[]) {
  assertAuthenticated(caller);
  if (!caller.roles.some((r) => allowed.includes(r))) {
    throw new AuthzError(\`role required: \${allowed.join(' | ')}\`);
  }
}`}</CodeBlock
				>
			</li>

			<li>
				<h4>Write the profile service</h4>
				<CodeBlock title="src/lib/server/services/profile.ts" lang="ts"
					>{`import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from '$lib/server/services/audit';

export const profileService = {
  async getForCaller(caller: Caller) {
    assertAuthenticated(caller);
    const rows = await db.select().from(profile).where(eq(profile.userId, caller.userId)).limit(1);
    return rows[0] ?? null;
  },

  async upsertForCaller(
    caller: Caller,
    patch: Partial<typeof profile.$inferInsert>
  ) {
    assertAuthenticated(caller);
    const [row] = await db
      .insert(profile)
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
};`}</CodeBlock
				>
			</li>

			<li>
				<h4>Write the audit helper</h4>
				<CodeBlock title="src/lib/server/services/audit.ts" lang="ts"
					>{`import { db } from '$lib/server/db';
import { auditEvent } from '$lib/server/db/schema';
import type { Caller } from '$lib/server/authz/caller';

export async function writeAudit(
  caller: Caller,
  entry: { action: string; targetKind: string; targetId?: string; metadata?: Record<string, unknown> }
) {
  await db.insert(auditEvent).values({
    id: crypto.randomUUID(),
    actorUserId: caller.userId,
    action: entry.action,
    targetKind: entry.targetKind,
    targetId: entry.targetId,
    metadata: { requestId: caller.requestId, ...(entry.metadata ?? {}) }
  });
}`}</CodeBlock
				>
			</li>

			<li>
				<h4>Forbid direct DB imports from routes</h4>
				<p>
					This is what keeps the pattern honest over time. Add to <code>eslint.config.js</code>:
				</p>
				<CodeBlock title="eslint.config.js (rule snippet)" lang="js"
					>{`{
  files: ['src/routes/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['$lib/server/db', '$lib/server/db/*'],
          message: 'Routes must go through a service in $lib/server/services/**, never the db client directly.'
        }
      ]
    }]
  }
}`}</CodeBlock
				>
				<p>
					Now a reviewer does not have to catch accidental direct-Drizzle-use by hand — ESLint does
					it for every PR.
				</p>
			</li>
		</Steps>
	</section>

	<Aside type="tip" title="Why a Caller object, not locals.session">
		<p>
			<code>locals.session</code> is a request-scoped thing that SvelteKit hands you in routes and
			<code>load</code> functions. Passing it directly into services couples your services to
			SvelteKit types. A <code>Caller</code> is a tiny, transport-agnostic value object — the same
			service function is callable from a cron, a Tauri native call, or a test, without dragging in
			<code>RequestEvent</code>.
		</p>
	</Aside>

	<section>
		<h2>Recap</h2>
		<ul>
			<li><code>profile</code> is our data; <code>user</code> stays under Better Auth.</li>
			<li>
				Service layer, not RLS. Every write threads a <code>Caller</code> and emits an audit event.
			</li>
			<li>
				ESLint forbids importing <code>$lib/server/db</code> from routes — the rule is mechanical, not
				cultural.
			</li>
		</ul>

		<h3>Verify you&rsquo;re done</h3>
		<ul>
			<li><code>pnpm check</code> green.</li>
			<li>
				<code>drizzle/</code> contains a second migration adding <code>profile</code> +
				<code>audit_event</code>.
			</li>
			<li>
				Calling <code>profileService.upsertForCaller</code> (from a scratch script or a test) inserts
				a row and an audit event.
			</li>
		</ul>

		<h3>Next up</h3>
		<p>
			Module 2 lands the typed env loader, the production Drizzle client, and the
			load/remote-function patterns that every later page relies on.
		</p>
	</section>
</CoursePage>
