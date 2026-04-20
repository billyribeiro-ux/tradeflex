<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head>
	<title>1.3 Neon dev branch — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 1 · Project setup"
	title="1.3 · Neon dev branch"
	lede="Create a Neon Postgres project, make a cheap dev branch, wire its connection string into .env, and run your first query."
>
	<section>
		<h2>What you&rsquo;ll learn</h2>
		<ul>
			<li>What <strong>Neon</strong> is: a serverless Postgres where branches are near-free copies of your database.</li>
			<li>Why we never develop against a shared dev database.</li>
			<li>How to authenticate <code>neonctl</code>, create a project, and read its connection string.</li>
			<li>
				How to pick between a <strong>pooled</strong> and <strong>direct</strong> connection
				string and why it matters for long-running queries like migrations.
			</li>
		</ul>
	</section>

	<section>
		<h2>What is Neon, in one paragraph</h2>
		<p>
			<strong>Neon</strong> is a Postgres service that separates compute from storage. Your data
			lives in object storage; compute spins up on demand. Because the storage is copy-on-write,
			creating a <em>branch</em> of a database is nearly instant and costs almost nothing. That
			lets each pull request get its own isolated database clone — a pattern we will use heavily in
			Module 12 (CI/CD).
		</p>

		<p>
			For local dev, you have two choices. Either you point your laptop at a <em>dev branch</em> on
			Neon (pro: zero local setup, same engine as prod; con: needs internet), or you run Postgres
			locally via Docker Compose (pro: fully offline; con: another daemon to manage). Default is
			the Neon dev branch. The Docker fallback is documented in the repo README.
		</p>
	</section>

	<section>
		<h2>Steps</h2>

		<Steps>
			<li>
				<h4>Install neonctl</h4>
				<CodeBlock lang="bash">$ pnpm add -g neonctl
$ neonctl --version</CodeBlock>
				<p>Expected:</p>
				<CodeBlock lang="text">neonctl 2.x.x</CodeBlock>
			</li>

			<li>
				<h4>Authenticate</h4>
				<CodeBlock lang="bash">$ neonctl auth</CodeBlock>
				<p>
					This opens a browser tab, you approve, and it writes a token to
					<code>~/.config/neonctl/credentials.json</code>. Close the tab when it says
					&ldquo;authentication complete.&rdquo;
				</p>
			</li>

			<li>
				<h4>Create the project</h4>
				<CodeBlock lang="bash">$ neonctl projects create --name tradeflex --region-id aws-us-east-2</CodeBlock>
				<p>
					Pick the region closest to where you will host on Vercel. Expected output (trimmed):
				</p>
				<CodeBlock lang="text">id        proud-cloud-1234567
name      tradeflex
region    aws-us-east-2
branches  1 (main)
created   2026-04-20T…</CodeBlock>
			</li>

			<li>
				<h4>Create a dev branch off main</h4>
				<CodeBlock lang="bash">$ neonctl branches create --name dev --parent main</CodeBlock>
				<p>
					&ldquo;Main&rdquo; here is the Neon branch name (equivalent to a trunk), not Git main. The
					dev branch is a zero-copy clone.
				</p>
			</li>

			<li>
				<h4>Read the connection string</h4>
				<CodeBlock lang="bash">$ neonctl connection-string dev --pooled</CodeBlock>
				<p>Expected (yours will differ):</p>
				<CodeBlock lang="text">postgresql://tradeflex_owner:****@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require</CodeBlock>
				<p>
					The <code>-pooler</code> hostname is the <strong>pooled</strong> endpoint (PgBouncer
					transaction mode) — short requests only. Long transactions, including
					<code>drizzle-kit migrate</code>, need the <strong>direct</strong> endpoint:
				</p>
				<CodeBlock lang="bash">$ neonctl connection-string dev</CodeBlock>
			</li>

			<li>
				<h4>Wire it into .env</h4>
				<p>
					Open <code>.env</code> and set <code>DATABASE_URL</code> to the pooled string for runtime
					and <code>DATABASE_URL_DIRECT</code> to the direct string for migrations:
				</p>
				<CodeBlock title=".env" lang="dotenv">{`DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require&pgbouncer=true"
DATABASE_URL_DIRECT="postgresql://…neon.tech/neondb?sslmode=require"`}</CodeBlock>
				<Aside type="danger" title="Never commit .env">
					<p>
						<code>.env</code> is already in <code>.gitignore</code>. The <code>.env.example</code>
						file is the only version you commit, and it only contains <em>variable names</em> with
						empty values.
					</p>
				</Aside>
			</li>

			<li>
				<h4>Smoke-test the connection</h4>
				<CodeBlock lang="bash">$ pnpm dlx @neondatabase/cli@latest psql $DATABASE_URL -c "SELECT version();"</CodeBlock>
				<p>Expected:</p>
				<CodeBlock lang="text">             version
---------------------------------
 PostgreSQL 16.x on x86_64-…
(1 row)</CodeBlock>
			</li>
		</Steps>
	</section>

	<Aside type="tip" title="Naming branches">
		<p>
			In Module 12, CI will create a <code>pr-&lt;number&gt;</code> branch per pull request
			automatically. For now, your one local dev branch is called <code>dev</code>. Keep
			<code>main</code> untouched — treat it as production-shaped.
		</p>
	</Aside>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Neon branches are near-free copies, so each surface (local dev, each PR, prod) gets its own.</li>
			<li>Pooled endpoint for runtime; direct endpoint for migrations.</li>
			<li>Connection string lives in <code>.env</code>, never Git.</li>
		</ul>

		<h3>Verify you&rsquo;re done</h3>
		<ul>
			<li><code>neonctl branches list</code> shows <code>main</code> and <code>dev</code>.</li>
			<li><code>SELECT version()</code> returns a row.</li>
			<li><code>.env</code> has both <code>DATABASE_URL</code> and <code>DATABASE_URL_DIRECT</code>.</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href="/course/modules/1/better-auth-schema">1.4 · Better Auth schema →</a>
		</p>
	</section>
</CoursePage>
