<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>12.3 Vercel + pnpm monorepo — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 12 · CI/CD + production"
	title="12.3 · Deploying a pnpm monorepo to Vercel"
	lede="When the SvelteKit app lives inside a subdirectory, Vercel's defaults stop applying. Three small files — vercel.json, a root package.json, and a workflow without a version collision — make the build reproducible."
>
	<section>
		<h2>The failure modes you will hit</h2>
		<p>
			Every time we've wired a monorepo into Vercel, we've hit exactly the same three errors.
			Knowing what each one looks like makes the fix obvious.
		</p>
		<CodeBlock title="Failure 1: wrong directory" lang="bash">
			{`sh: line 1: vite: command not found
Error: Command "vite build" exited with 127`}
		</CodeBlock>
		<p>
			Vercel ran <code>npm install</code> at repo root, where there's no <code>package.json</code>,
			so <code>vite</code> was never installed.
		</p>
		<CodeBlock title="Failure 2: lockfile ahead of the pnpm CLI" lang="bash">
			{`WARN  Ignoring not compatible lockfile at /vercel/path0/course/pnpm-lock.yaml
ERROR  Headless installation requires a pnpm-lock.yaml file`}
		</CodeBlock>
		<p>
			Our lockfile is v9 (written by pnpm 10). Vercel's default pnpm was older and refused to read
			it.
		</p>
		<CodeBlock title="Failure 3: two sources of truth" lang="bash">
			{`Error: Multiple versions of pnpm specified:
  - version 10 in the GitHub Action config with the key "version"
  - version pnpm@10.33.0 in the package.json with the key "packageManager"`}
		</CodeBlock>
		<p>
			Once you pin <code>packageManager</code>, the <code>version:</code> input on
			<code>pnpm/action-setup</code> becomes a conflict, not a backstop.
		</p>
	</section>

	<section>
		<h2>Fix 1: <code>vercel.json</code> at repo root</h2>
		<p>
			Tell Vercel the app lives in <code>course/</code>, and give it exactly three commands: install
			pnpm, install deps, build.
		</p>
		<CodeBlock title="vercel.json" lang="json">
			{`{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm i -g pnpm@10.33.0 && cd course && pnpm install --frozen-lockfile && pnpm build",
  "installCommand": "echo noop — install runs inside course/",
  "outputDirectory": "course/.vercel/output",
  "framework": null
}`}
		</CodeBlock>
		<p>
			<code>outputDirectory</code> points at <code>course/.vercel/output</code> because
			<code>@sveltejs/adapter-vercel</code> writes there. <code>framework: null</code> disables Vercel's
			auto-detection — we're explicit about every command.
		</p>
		<Aside type="tip">
			<p>
				<code>npm i -g pnpm@10.33.0</code> is the crude but reliable install. Corepack also works if you
				remember to enable it; a one-line npm install avoids that class of surprise.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Fix 2: pin <code>packageManager</code></h2>
		<p>
			Two files, the same line. Locally it keeps your CLI and the lockfile in sync; on CI it's the
			one place workflows read.
		</p>
		<CodeBlock title="package.json (repo root)" lang="json">
			{`{
  "name": "tradeflex-monorepo",
  "private": true,
  "packageManager": "pnpm@10.33.0"
}`}
		</CodeBlock>
		<CodeBlock title="course/package.json" lang="json">
			{`{
  "name": "tradeflex",
  "packageManager": "pnpm@10.33.0",
  "type": "module"
  // ...
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>Fix 3: drop <code>version:</code> from the workflow</h2>
		<p>
			Once <code>packageManager</code> is the source of truth, the <code>version:</code> input is
			redundant <em>and</em> forbidden. Delete the key; do not delete the step.
		</p>
		<CodeBlock title=".github/workflows/ci.yml" lang="yaml">
			{`- uses: actions/checkout@v4

- uses: pnpm/action-setup@v4
  # no "version:" here — package.json packageManager rules

- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: pnpm
    cache-dependency-path: course/pnpm-lock.yaml`}
		</CodeBlock>
	</section>

	<section>
		<h2>Why this ordering matters</h2>
		<p>
			Put the <code>version:</code> line back and Vercel preview still works, but GitHub Actions
			refuses to install. Remove <code>packageManager</code> and Vercel's old pnpm still fails.
			Remove <code>vercel.json</code> and nothing installs. Each fix is independent — the total setup
			has to include all three.
		</p>
		<Aside type="caution">
			<p>
				If you ever bump pnpm, bump both <code>packageManager</code> fields <em>and</em> the
				hard-coded version in <code>vercel.json</code>'s <code>buildCommand</code>. A grep for
				<code>pnpm@</code> catches all three.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Fix 4: build-time env for SSR bootstrap</h2>
		<p>
			Better Auth (and most auth libs) initialize at module load, which means they run during
			<code>vite build</code>'s SSR pass — before any runtime env is injected. Give the build benign
			placeholders under <code>build.env</code> so it compiles. Real values come from your Vercel project's
			Environment Variables settings at runtime.
		</p>
		<CodeBlock title="vercel.json (excerpt)" lang="json">
			{`{
  "build": {
    "env": {
      "BETTER_AUTH_SECRET": "build-placeholder-thirty-two-chars-min-xxx",
      "ORIGIN": "https://tradeflex.vercel.app",
      "DATABASE_URL": "postgres://build:build@localhost:5432/build"
    }
  }
}`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				These placeholders are for the build phase only. Never set real secrets in
				<code>vercel.json</code> — it's checked into git. Real values belong in the Vercel project
				settings (or <code>vercel env add</code>), scoped to the right environment.
			</p>
		</Aside>
	</section>

	<section>
		<h2>What you verify once it is green</h2>
		<ul>
			<li>Every PR opens a Vercel Preview URL with the latest <code>feat/</code> commit.</li>
			<li>
				Merging to <code>main</code> fires <code>deploy.yml</code> which runs migrations then
				<code>vercel deploy --prod</code>.
			</li>
			<li>
				<code>vercel inspect &lt;dpl-id&gt; --logs</code> is your first stop on any failure — it shows
				the command Vercel actually ran.
			</li>
		</ul>
	</section>
</CoursePage>
