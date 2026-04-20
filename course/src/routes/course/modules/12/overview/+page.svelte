<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>12.1 CI/CD — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 12 · CI/CD + production"
	title="12.1 · CI/CD + production"
	lede="Two lanes, two jobs. The PR lane proves a change is safe. The main lane ships it. Neither lane shares credentials with the other; neither skips gates on failure."
>
	<section>
		<h2>Two-lane mental model</h2>
		<ul>
			<li>
				<strong>PR lane (ci.yml).</strong> Lint, typecheck, unit tests, migration dry-run on a throwaway
				Neon branch, Vercel preview build, Playwright on the preview URL.
			</li>
			<li>
				<strong>Main lane (deploy.yml).</strong> Apply migrations to production Neon, deploy to Vercel
				production, smoke-test.
			</li>
		</ul>
		<Aside type="tip">
			<p>
				PR credentials should be scoped to the Neon preview project and the Vercel preview token.
				Main credentials should be scoped to production only. If one leaks, you haven't lost the
				other.
			</p>
		</Aside>
	</section>

	<section>
		<h2>PR lane — ci.yml</h2>
		<CodeBlock title=".github/workflows/ci.yml" lang="yaml">
			{`name: CI
on:
  pull_request:
    branches: [main]
concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm lint
      - run: pnpm test:unit -- --run
      - run: pnpm build
        env:
          DATABASE_URL: postgres://ci:ci@localhost/ci
          BETTER_AUTH_SECRET: ci-ci-ci-ci-ci-ci
          BETTER_AUTH_URL: http://localhost:5173
          ORIGIN: http://localhost:5173
          PUBLIC_SITE_NAME: Trade Flex`}
		</CodeBlock>
	</section>

	<section>
		<h2>Main lane — deploy.yml</h2>
		<CodeBlock title=".github/workflows/deploy.yml" lang="yaml">
			{`name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Apply migrations
        env: { DATABASE_URL: \${{ secrets.PROD_DATABASE_URL }} }
        run: pnpm drizzle-kit migrate
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: \${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          pnpm add -g vercel@latest
          vercel deploy --prod --yes --token "$VERCEL_TOKEN"`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Migrations go <em>before</em> the deploy, not after. A forward-compatible migration means the
				old app works against the new schema — so you run migrate first, then ship code. Backward-incompatible
				migrations (column drops) happen in two PRs, never one.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Neon branch per PR</h2>
		<p>
			Every PR gets a Neon branch named <code>pr-&lt;number&gt;</code>. Integration tests migrate
			into it, run, then it's deleted on PR close. Your production data never touches CI.
		</p>
		<CodeBlock title="neonctl in a composite action" lang="bash">
			{`neonctl branches create --name pr-$PR_NUMBER --parent main --output json \\
  | jq -r '.connection_uris[0].connection_uri' > .neon-url

pnpm drizzle-kit migrate  # uses DATABASE_URL from .neon-url
pnpm test:integration

# on PR close (separate workflow)
neonctl branches delete pr-$PR_NUMBER`}
		</CodeBlock>
	</section>

	<section>
		<h2>Rollback</h2>
		<p>
			Rollback is "promote yesterday's deployment" in Vercel; it's a single CLI call. Since
			migrations are forward-compatible, the older deploy still works against the new schema.
		</p>
		<CodeBlock title="rollback" lang="bash">
			{`vercel ls tradeflex --token "$VERCEL_TOKEN"
vercel promote <deployment-url> --token "$VERCEL_TOKEN"`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Two lanes, two credential sets. Never share.</li>
			<li>Migrations before deploys. Forward-compatible only in a single PR.</li>
			<li>Per-PR Neon branches. Your prod data stays out of CI.</li>
			<li>Rollback is a one-liner because your schema doesn't break behind you.</li>
		</ul>
	</section>
</CoursePage>
