<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import FileTree from '$lib/components/course/FileTree.svelte';
</script>

<svelte:head>
	<title>2.1 Overview — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 2 · SvelteKit + data layer"
	title="2.1 · Overview"
	lede="Before any feature ships we harden the seams between the app and everything outside it: env, database, requests, caller identity."
>
	<section>
		<h2>What Module 2 does</h2>
		<p>
			Module 1 stood up the primitives. Module 2 wraps them in the three things every production
			SvelteKit app needs and most tutorials skip:
		</p>
		<ol>
			<li>
				A <strong>typed environment</strong>. Every variable is parsed with a Zod schema at boot. If
				<code>DATABASE_URL</code> is missing, the app refuses to start — not 40 requests in.
			</li>
			<li>
				A <strong>single Drizzle client</strong> imported only from <code>$lib/server</code>, and a
				<strong>service layer</strong> that owns every read and write. Routes call services; services
				call the DB. Never the reverse.
			</li>
			<li>
				A <strong>request pipeline</strong> that stamps a request id, resolves a <code>Caller</code>
				object (the actor + their roles), logs a structured line per request, and catches every unhandled
				error with a correlation id the user can read off the screen.
			</li>
		</ol>
	</section>

	<section>
		<h2>Why this matters</h2>
		<p>
			The three hardest classes of production bug in an early-stage app are: <em
				>missing config that only trips in prod</em
			>, <em>a query that assumed the wrong user</em>, and
			<em>an error the user saw but you can't find in logs</em>. Module 2 kills all three by
			construction.
		</p>
		<Aside type="tip" title="PE7 lens">
			<p>
				Every piece of code we write after this module assumes three invariants: the env is valid,
				every DB access flows through a <code>Caller</code>, every error is correlated to a request
				id. If we don't land those invariants now, we will be writing defensive checks in every
				feature for the rest of the course.
			</p>
		</Aside>
	</section>

	<section>
		<h2>What's already in the repo</h2>
		<p>
			You do not write this module from zero — the scaffolding is already sitting under <code
				>src/lib/server</code
			>. Module 2 is the guided tour that teaches you what each file does and why.
		</p>
		<FileTree>
			{`src/
├── lib/server/
│   ├── env.ts                 ← Zod-parsed env (2.2)
│   ├── log.ts                 ← structured JSON logger (2.4)
│   ├── crypto.ts              ← AES-GCM for encrypted settings
│   ├── db/
│   │   ├── index.ts           ← Drizzle client (server-only) (2.3)
│   │   ├── schema.ts          ← app tables (2.3)
│   │   └── auth.schema.ts     ← Better Auth tables
│   ├── authz/
│   │   ├── caller.ts          ← Caller + assertRole/assertAuthenticated (2.3)
│   │   └── resolve-caller.ts  ← user id → roles + entitlements (2.4)
│   └── services/
│       ├── audit.ts           ← writeAudit()
│       ├── profile.ts         ← profileService (2.5)
│       └── settings.ts        ← admin-settings key store (2.5)
├── hooks.server.ts            ← request id + log + Caller (2.4)
└── app.d.ts                   ← App.Locals.caller, .requestId (2.4)
`}
		</FileTree>
	</section>

	<section>
		<h2>How to verify this module</h2>
		<ul>
			<li>
				Delete <code>DATABASE_URL</code> from <code>.env</code>. Run <code>pnpm dev</code>. The app
				refuses to boot with a readable error naming the variable.
			</li>
			<li>
				Make a request against any route. Check the terminal: one JSON log line with <code
					>requestId</code
				>, <code>method</code>, <code>path</code>, <code>status</code>, <code>latencyMs</code>.
			</li>
			<li>
				In any <code>+page.server.ts</code>, read <code>locals.caller</code>. Type checker confirms
				it is always defined. <code>locals.caller.userId</code> is <code>string | null</code> — nullable
				on purpose.
			</li>
		</ul>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				Module 2 lands three invariants: typed env, service-layer DB access, and a request pipeline
				with Caller + logging.
			</li>
			<li>Each invariant eliminates a whole class of production bug.</li>
			<li>
				The code is already in the repo; these pages walk you through <em>why</em> each file is shaped
				the way it is.
			</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href="/course/modules/2/typed-env">2.2 · Typed env with Zod →</a>
		</p>
	</section>
</CoursePage>
