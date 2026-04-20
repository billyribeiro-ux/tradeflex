<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>12.2 Neon branches + rollback — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 12 · CI/CD + production"
	title="12.2 · Neon branches + rollback"
	lede="A database branch per PR gives you Postgres isolation without the cost of a fleet. Pair that with forward-compatible migrations and rollback stops being a drama."
>
	<section>
		<h2>Why a branch per PR, not a shared dev DB</h2>
		<p>
			A shared dev database looks cheap until two PRs touch the same table on the same afternoon.
			Then one developer's migration is quietly running against a schema the other PR expects to be
			different, and the only signal is a confused CI failure. A Neon branch per PR costs nothing
			extra on the free tier and gives each PR its own copy of production's schema + sample data,
			frozen at the branch point.
		</p>
		<Aside type="tip">
			<p>
				Neon branches are copy-on-write. The parent's blocks are shared until the child writes;
				creating a branch is metadata-fast (usually under 2 seconds) regardless of the parent's
				size. This is the property that makes "branch per PR" viable.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Creating the branch in CI</h2>
		<CodeBlock title=".github/workflows/ci.yml (excerpt)" lang="yaml">
			{`- name: Create Neon preview branch
  id: neon
  run: |
    BRANCH="pr-\${{ github.event.pull_request.number }}"
    neonctl branches create \\
      --name "$BRANCH" \\
      --project-id "\${{ secrets.NEON_PROJECT_ID }}" \\
      --parent main \\
      --output json > branch.json
    echo "url=$(jq -r '.connection_uris[0].connection_uri' branch.json)" >> $GITHUB_OUTPUT
  env:
    NEON_API_KEY: \${{ secrets.NEON_API_KEY }}

- name: Apply migrations (dry-run)
  run: pnpm drizzle-kit migrate --dialect postgresql
  env:
    DATABASE_URL: \${{ steps.neon.outputs.url }}

- name: Tear down Neon branch
  if: always()
  run: neonctl branches delete "pr-\${{ github.event.pull_request.number }}"
  env:
    NEON_API_KEY: \${{ secrets.NEON_API_KEY }}`}
		</CodeBlock>
		<p>
			<code>if: always()</code> on the teardown matters. Without it, a failing migration leaves the branch
			behind and your Neon project accumulates dead branches. With it, even a crash deletes the branch
			on the way out.
		</p>
	</section>

	<section>
		<h2>Forward-compatible migrations — the one rule</h2>
		<p>
			A forward-compatible migration is one where the <strong>old</strong> application code can
			still run against the <strong>new</strong> schema. That's the property that makes zero-downtime
			deploys safe: for a few seconds during the rollout, some pods are old and some are new, and both
			need to keep serving.
		</p>
		<ul>
			<li>Adding a nullable column ✓ — old code ignores it, new code uses it.</li>
			<li>
				Adding a <code>NOT NULL</code> column <em>without a default</em> ✗ — old code inserting will fail.
			</li>
			<li>
				Renaming a column ✗ — old code still selects the old name. Instead, add new + dual-write +
				ship code that reads the new + backfill + drop old, across 3 deploys.
			</li>
			<li>Dropping a column ✗ — same problem in reverse. Stop reading first, then drop.</li>
		</ul>
		<Aside type="caution">
			<p>
				If you have ever shipped a rename in a single PR and "it worked," it worked because the
				rollout was fast enough that you didn't notice the 5xx spike. Don't mistake absence of a bug
				report for correctness.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Rollback is a revert, not a migration</h2>
		<p>
			Because every migration is forward-compatible, rolling back means redeploying the previous
			commit — the old code still works against the new schema. You do <strong>not</strong> write a down-migration
			and run it against production. Down-migrations are for local development only; in production, the
			schema moves forward and only forward.
		</p>
		<CodeBlock title="One-liner rollback" lang="bash">
			{`# Find the previous deploy
vercel list --meta-branch=main --limit 2

# Promote it
vercel promote <deployment-url> --scope=<team>`}
		</CodeBlock>
		<p>
			If the bad commit added a new column and your new code writes to it, the rollback is still
			safe: old code will not write to it, new rows stop appearing, no existing row is harmed. The
			column stays in the schema, unused, until a future PR drops it following the
			add-new/dual-write/drop-old dance.
		</p>
	</section>

	<section>
		<h2>When rollback is not enough</h2>
		<p>
			There is one shape of bug where rollback alone is not enough: a migration that corrupted data.
			Example: a backfill that miscomputed a subscription's <code>current_period_end</code>. The
			code is rolled back, but the bad rows remain.
		</p>
		<p>
			Handle this with an audit table and a replay script. Every service call writes an
			<code>audit_event</code>
			row; if a bad backfill ships, you replay the pre-bug audit entries to recompute the affected rows.
			That audit table is the one you built in Module 2 — this is why it pays rent.
		</p>
	</section>

	<section>
		<h2>What's next</h2>
		<p>
			Module 13 closes the course with UX polish: toasts that survive redirects, intent preservation
			through login, and a short motion system that respects
			<code>prefers-reduced-motion</code>. Small things, but they're the difference between "this
			works" and "this feels like a product."
		</p>
	</section>
</CoursePage>
