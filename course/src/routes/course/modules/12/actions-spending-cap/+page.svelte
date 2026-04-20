<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>12.4 Actions spending cap — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 12 · CI/CD + production"
	title="12.4 · GitHub Actions spending cap — the invisible CI blocker"
	lede="A private repo on the free plan gets 2,000 Actions minutes per month. Cross that line and every workflow silently queues forever — no red X, no email, just nothing happens. Here's how to recognize it and two ways to fix it."
>
	<section>
		<h2>The symptom</h2>
		<p>
			You push to a branch. GitHub says "Some checks haven't completed yet." Hours later, they still
			haven't run. The Actions tab shows the workflow queued, not failed. <code>gh run list</code>
			returns empty for the most recent runs.
		</p>
		<Aside type="caution">
			<p>
				There is no visible failure. A workflow that needs 3 minutes to run will sit "queued" for
				hours or days without firing. If you haven't explicitly checked the Billing page, you will
				think your CI is "just slow."
			</p>
		</Aside>
	</section>

	<section>
		<h2>How to recognize it</h2>
		<CodeBlock title="bash" lang="bash">
			{`# List the last five workflow runs. If the latest are stuck in "queued"
# for more than ~30 seconds, spending cap is the likely cause.
gh run list --repo billyribeiro-ux/tradeflex --limit 5

# Confirm via the billing endpoint (org owners only):
gh api /users/$(gh api /user --jq .login)/settings/billing/actions --jq '{
  used: .total_minutes_used,
  included: .included_minutes,
  overage: .minutes_used_breakdown
}'`}
		</CodeBlock>
		<p>
			If <code>used</code> ≥ <code>included</code> and <code>overage</code> is null, you're hitting
			the cap with no spending allowance set. That's the blocker.
		</p>
	</section>

	<section>
		<h2>Fix A — make the repo public</h2>
		<p>
			Public repos get <strong>unlimited</strong> Actions minutes on all plans. If your code is
			open-source-friendly (no secrets checked in, no commercial restriction), flipping the
			visibility is the cleanest fix.
		</p>
		<CodeBlock title="bash" lang="bash">
			{`gh repo edit billyribeiro-ux/tradeflex --visibility public --accept-visibility-change-consequences

# Re-trigger the stuck workflow:
gh run rerun <run-id> --repo billyribeiro-ux/tradeflex`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Before making a private repo public, grep for anything sensitive one more time:
				<code>gh secret list</code> (secrets stay private — only the code goes public),
				<code>git log -p | grep -iE "password|secret|token|key"</code>, and
				<code>git log --all --oneline</code> to catch branches you might have forgotten about.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Fix B — raise the Actions spending limit</h2>
		<p>
			If the repo needs to stay private, set a non-zero monthly spending cap. $5/month buys ~2,500
			extra minutes at the Linux rate — more than most hobby projects need.
		</p>
		<CodeBlock title="bash" lang="bash">
			{`# There's no CLI for this yet — it's a dashboard-only setting.
# https://github.com/settings/billing/spending_limit

# Verify after change:
gh api /users/$(gh api /user --jq .login)/settings/billing/actions`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				Set a specific limit, not "unlimited." A runaway matrix job can burn $100 in a few hours;
				a $10 cap caps the blast radius.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Prevention: keep the bill low</h2>
		<ul>
			<li>
				<strong>Cache aggressively.</strong> <code>actions/setup-node</code> with
				<code>cache: pnpm</code> typically saves 20–40 seconds per run. The Playwright browser
				cache we added in 11.3 saves another 15 seconds.
			</li>
			<li>
				<strong>Cancel in-progress on new pushes.</strong> Add a concurrency group so a second push
				to the same branch cancels the first — no point running tests against stale code.
			</li>
			<li>
				<strong>Skip forks and doc-only PRs.</strong> A <code>paths-ignore</code> clause keeps
				README edits off the paid clock.
			</li>
		</ul>
		<CodeBlock title=".github/workflows/ci.yml (excerpt)" lang="yaml">
			{`on:
  pull_request:
    paths-ignore: ['**.md', 'docs/**']
  push:
    branches: [main]
    paths-ignore: ['**.md', 'docs/**']

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				Silent CI ≠ broken workflow. Check the Actions billing before the YAML.
			</li>
			<li>
				Public repo = unlimited. Spending limit = private + pay. Pick one.
			</li>
			<li>
				Cache + cancel-in-progress + <code>paths-ignore</code> keep the meter low.
			</li>
		</ul>
	</section>
</CoursePage>
