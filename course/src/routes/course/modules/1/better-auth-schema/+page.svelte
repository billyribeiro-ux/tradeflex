<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head>
	<title>1.4 Better Auth schema — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 1 · Project setup"
	title="1.4 · Better Auth schema"
	lede="Generate the Better Auth tables from config, migrate them into your Neon dev branch, and sign up your first user."
>
	<section>
		<h2>What you&rsquo;ll learn</h2>
		<ul>
			<li>What <strong>Better Auth</strong> is and how it differs from hand-rolled auth.</li>
			<li>How the <code>better-auth generate</code> CLI reads your config and writes a Drizzle schema.</li>
			<li>What <strong>migrations</strong> are and why we version them.</li>
			<li>How the <code>hooks.server.ts</code> handle hydrates <code>locals.session</code> for every request.</li>
		</ul>
	</section>

	<section>
		<h2>What Better Auth is</h2>
		<p>
			<strong>Better Auth</strong> is a TypeScript-native auth library. You declare what providers
			you support (email/password, OAuth, magic link, 2FA) in a single config file, and it gives
			you back: a server-side handler that plugs into SvelteKit hooks, a client-side helper for
			sign-up/sign-in, a CLI that writes the SQL schema, and sensible defaults (secure cookies,
			CSRF, rate limiting).
		</p>
		<p>
			We chose it over rolling our own because every line of auth code you write is a line that
			will be audited, exploited, or regretted. Libraries for the boring parts, custom for the
			parts that differ.
		</p>
	</section>

	<section>
		<h2>The config is already there</h2>
		<p>
			Open <code>src/lib/server/auth.ts</code>. It wires Drizzle as the adapter, declares
			<code>emailAndPassword</code> and <code>socialProviders.github</code>, and adds the
			<code>sveltekitCookies</code> plugin. You do not need to edit it now — we extend it in Module
			3 with magic link + 2FA.
		</p>
	</section>

	<section>
		<h2>Steps</h2>

		<Steps>
			<li>
				<h4>Generate the schema</h4>
				<p>The repo ships with a script for this:</p>
				<CodeBlock lang="bash">$ pnpm auth:schema</CodeBlock>
				<p>
					Under the hood this runs <code
						>better-auth generate --config src/lib/server/auth.ts --output
						src/lib/server/db/auth.schema.ts --yes</code
					>. Expected (abridged):
				</p>
				<CodeBlock lang="text">✓ Read config src/lib/server/auth.ts
✓ Writing schema with 4 tables to src/lib/server/db/auth.schema.ts
  ├─ user
  ├─ session
  ├─ account
  └─ verification</CodeBlock>

				<Aside type="caution" title="If this command fails">
					<p>
						The generator imports your auth config, which imports the DB client, which tries to
						parse <code>DATABASE_URL</code>. If <code>DATABASE_URL</code> is still the placeholder
						from <code>.env.example</code>, the command errors out. Fix: complete step 1.3 first
						(real Neon connection string in <code>.env</code>).
					</p>
				</Aside>
			</li>

			<li>
				<h4>Generate a SQL migration from the schema</h4>
				<CodeBlock lang="bash">$ pnpm db:generate</CodeBlock>
				<p>Expected:</p>
				<CodeBlock lang="text">drizzle-kit: v0.31.x
✓ Reading schema src/lib/server/db/schema.ts
✓ Creating migration drizzle/0000_init.sql</CodeBlock>
				<p>
					Open <code>drizzle/0000_init.sql</code>. You should see <code>CREATE TABLE</code>
					statements for <code>user</code>, <code>session</code>, <code>account</code>,
					<code>verification</code>, plus the demo <code>task</code> table that was already in the
					scaffold.
				</p>
			</li>

			<li>
				<h4>Apply the migration to your dev branch</h4>
				<CodeBlock lang="bash">$ DATABASE_URL=$DATABASE_URL_DIRECT pnpm db:migrate</CodeBlock>
				<p>
					We deliberately use the <em>direct</em> connection string for migrations — the pooled
					endpoint disallows long transactions.
				</p>
				<p>Expected:</p>
				<CodeBlock lang="text">Reading migrations from drizzle/
Applying 0000_init.sql…
✓ Done</CodeBlock>
			</li>

			<li>
				<h4>Verify the tables exist</h4>
				<CodeBlock lang="bash">$ pnpm db:studio</CodeBlock>
				<p>
					This opens Drizzle Studio in your browser — an inspector for your schema and data.
					Confirm <code>user</code>, <code>session</code>, <code>account</code>,
					<code>verification</code>, and <code>task</code> are listed.
				</p>
			</li>

			<li>
				<h4>Boot the server + sign up (via the Better Auth API)</h4>
				<p>
					We have not built a sign-up UI yet — that lands in Module 3. For now, hit the Better
					Auth API directly to prove it works:
				</p>
				<CodeBlock lang="bash">$ pnpm dev</CodeBlock>
				<p>In another terminal:</p>
				<CodeBlock
					lang="bash"
					code={`$ curl -X POST http://localhost:5173/api/auth/sign-up/email \\
    -H 'content-type: application/json' \\
    -d '{"email":"you@example.com","password":"a-long-dev-password","name":"You"}'`}
				/>
				<p>Expected (abridged):</p>
				<CodeBlock
					lang="text"
					code={`{"user":{"id":"01J…","email":"you@example.com","name":"You","emailVerified":false,…},"session":{…}}`}
				/>
				<p>
					Refresh Drizzle Studio: you should see one row in <code>user</code> and one in
					<code>session</code>.
				</p>
			</li>
		</Steps>
	</section>

	<Aside type="note" title="Why this is safe to commit">
		<p>
			<code>drizzle/0000_init.sql</code> goes into Git. It is the canonical history of how the
			schema evolved. Never edit an already-applied migration — always add a new one. Module 12
			makes this a CI-enforced rule.
		</p>
	</Aside>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Better Auth reads your config and writes a Drizzle schema via CLI.</li>
			<li>Drizzle-kit generates a SQL migration, which is versioned in Git.</li>
			<li>
				Migrations run against the <em>direct</em> connection string; the app runs against the
				<em>pooled</em> one.
			</li>
			<li>A <code>curl</code> to <code>/api/auth/sign-up/email</code> creates a real user row.</li>
		</ul>

		<h3>Verify you&rsquo;re done</h3>
		<ul>
			<li><code>src/lib/server/db/auth.schema.ts</code> exists and exports 4 tables.</li>
			<li><code>drizzle/0000_init.sql</code> is committed.</li>
			<li>Drizzle Studio shows 5 tables.</li>
			<li>The <code>curl</code> sign-up returns a user row.</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href="/course/modules/1/profiles-and-authorization">1.5 · Profiles + authorization →</a>
		</p>
	</section>
</CoursePage>
