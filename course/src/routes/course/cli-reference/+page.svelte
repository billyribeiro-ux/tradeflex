<script lang="ts">
	import Aside from '$lib/components/course/Aside.svelte';
	import Badge from '$lib/components/course/Badge.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import PrevNext from '$lib/components/course/PrevNext.svelte';
	import TableOfContents from '$lib/components/course/TableOfContents.svelte';
</script>

<svelte:head>
	<title>CLI Reference — Trade Flex</title>
</svelte:head>

<div class="page">
	<article class="course-content prose">
		<header class="page-head">
			<Badge tone="muted">Module 0 · Before you start</Badge>
			<h1>CLI Reference</h1>
			<p class="lede">
				A living index of every command you will type in this course — what it does, what to expect
				back, and the gotcha that costs people an hour the first time.
			</p>
		</header>

		<section>
			<h2>What you&rsquo;ll learn</h2>
			<p>
				This page is not a tutorial you read once. It is a reference you return to. Every time a
				later module asks you to run something in the terminal, it will link back here for the
				definition. You will learn:
			</p>
			<ul>
				<li>
					What a <strong>command-line interface (CLI)</strong> is and why we prefer it over dashboards.
				</li>
				<li>
					The 12 CLIs you will install and use: <code>git</code>, <code>gh</code>,
					<code>pnpm</code>, <code>vercel</code>, <code>stripe</code>, <code>neonctl</code>,
					<code>drizzle-kit</code>, <code>playwright</code>, <code>vitest</code>,
					<code>resend</code>, <code>bunnycdn</code>, <code>tauri</code>.
				</li>
				<li>The expected output of each of the commands you will run most often.</li>
			</ul>
		</section>

		<section>
			<h2>Why the CLI</h2>
			<p>
				A <strong>CLI</strong> (command-line interface) is a program you drive by typing text. It does
				one thing: reads your input, does the work, prints the result. Nothing hidden, nothing clicked.
			</p>
			<p>We prefer CLIs over web dashboards for three reasons:</p>
			<ol>
				<li>
					<strong>Reproducible</strong>: a command you can paste into a README or a CI script runs
					the same way next time. A click sequence through a dashboard doesn&rsquo;t.
				</li>
				<li>
					<strong>Inspectable</strong>: when something fails, a CLI prints a message you can read. A
					dashboard shows a spinner.
				</li>
				<li>
					<strong>Scriptable</strong>: every build, every deploy, every rotation of a secret is one
					line in a script we check into Git.
				</li>
			</ol>

			<Aside type="tip" title="Shell conventions in this course">
				<p>
					We use <strong>zsh</strong> on macOS (the default). Every command block starts with
					<code>$</code> — that&rsquo;s the shell prompt, not part of what you type. Copy the text
					<em>after</em> the <code>$</code>.
				</p>
			</Aside>
		</section>

		<section>
			<h2>git — version control</h2>
			<p>
				<strong>Git</strong> is a version-control system: it tracks every change you make to a file so
				you can go back, branch off, and collaborate. You&rsquo;ll use it on every module.
			</p>

			<h3>Common commands</h3>

			<CodeBlock title="Initialize + first commit" lang="bash"
				>$ git init $ git add . $ git commit -m "chore: initial scaffold"</CodeBlock
			>

			<p>Expected output (abridged):</p>

			<CodeBlock lang="text"
				>Initialized empty Git repository in /Users/you/path/.git/ [main (root-commit) 7f2d1a0]
				chore: initial scaffold 127 files changed, 4219 insertions(+)</CodeBlock
			>

			<CodeBlock title="Status + diff" lang="bash"
				>$ git status $ git diff $ git log --oneline --graph --decorate -10</CodeBlock
			>

			<CodeBlock title="Branch + merge" lang="bash"
				>$ git switch -c feature/auth $ git switch main $ git merge --no-ff feature/auth</CodeBlock
			>

			<Aside type="caution" title="No --force-with-lease on main">
				<p>
					Never rewrite published history on <code>main</code>. We document the rollback recipe in
					Module 12 (CI/CD); it does not involve <code>git push --force</code>.
				</p>
			</Aside>
		</section>

		<section>
			<h2>gh — GitHub CLI</h2>
			<p>
				<code>gh</code> is the official GitHub CLI. It authenticates once, then lets you create repos,
				open pull requests, read issues, and manage releases without leaving the terminal.
			</p>

			<CodeBlock title="Install + authenticate (macOS)" lang="bash"
				>$ brew install gh $ gh auth login</CodeBlock
			>

			<p>Follow the interactive prompts; pick HTTPS and a web-browser login.</p>

			<CodeBlock title="Create the Trade Flex repo + push" lang="bash"
				>$ gh repo create tradeflex --private --source=. --remote=origin --push</CodeBlock
			>

			<p>Expected output:</p>

			<CodeBlock lang="text"
				>✓ Created repository YOUR-USER/tradeflex on GitHub ✓ Added remote
				https://github.com/YOUR-USER/tradeflex.git ✓ Pushed commits to
				https://github.com/YOUR-USER/tradeflex.git</CodeBlock
			>

			<CodeBlock title="Open a PR" lang="bash">$ gh pr create --fill --web</CodeBlock>
		</section>

		<section>
			<h2>pnpm — package manager</h2>
			<p>
				<code>pnpm</code> installs JavaScript packages. It is faster and more disk-efficient than
				<code>npm</code> because it stores each version once on disk and hard-links it into each
				project&rsquo;s <code>node_modules</code>.
			</p>

			<CodeBlock title="Install + daily use" lang="bash"
				>$ corepack enable $ pnpm install $ pnpm dev $ pnpm check $ pnpm lint $ pnpm test:unit --
				--run</CodeBlock
			>

			<Aside type="note">
				<p>
					<code>corepack enable</code> (built into Node 16+) pins <code>pnpm</code> to the version
					recorded in <code>package.json</code>&rsquo;s <code>packageManager</code> field — so every contributor
					gets the same tool without manually installing it.
				</p>
			</Aside>
		</section>

		<section>
			<h2>vercel — deploy + env</h2>
			<p>
				<code>vercel</code> is Vercel&rsquo;s deployment CLI. It links a local project to a Vercel project,
				pulls environment variables, and ships preview or production builds.
			</p>

			<CodeBlock title="Install + authenticate" lang="bash"
				>$ pnpm add -g vercel $ vercel login</CodeBlock
			>

			<CodeBlock title="Link local → Vercel project" lang="bash"
				>$ vercel link $ vercel git connect</CodeBlock
			>

			<CodeBlock title="Pull env to local .env" lang="bash"
				>$ vercel env pull .env.local $ vercel env add STRIPE_SECRET_KEY production</CodeBlock
			>

			<CodeBlock title="Preview deploy + prod deploy" lang="bash"
				>$ vercel $ vercel deploy --prod</CodeBlock
			>

			<p>
				After <code>--prod</code> you get back a URL ending in <code>.vercel.app</code>.
				That&rsquo;s the temporary domain we ship v1 on.
			</p>
		</section>

		<section>
			<h2>stripe — payments CLI</h2>
			<p>
				The Stripe CLI creates products and prices, forwards live webhooks to your local dev server,
				and simulates events (charges, trial-end, disputes) for testing.
			</p>

			<CodeBlock title="Install + login (macOS)" lang="bash"
				>$ brew install stripe/stripe-cli/stripe $ stripe login</CodeBlock
			>

			<CodeBlock title="Forward webhooks to local dev" lang="bash"
				>$ stripe listen --forward-to localhost:5173/api/stripe/webhook</CodeBlock
			>

			<p>Expected output:</p>

			<CodeBlock lang="text"
				>> Ready! Your webhook signing secret is whsec_abc… (^C to quit) > 2026-04-20 10:02:11
				--&gt; customer.subscription.created [evt_1OabcD…]</CodeBlock
			>

			<CodeBlock title="Trigger a test event" lang="bash"
				>$ stripe trigger checkout.session.completed</CodeBlock
			>

			<Aside type="caution" title="Test mode vs live mode">
				<p>
					Until Phase 10, stay in <strong>test mode</strong> (the CLI defaults to it after
					<code>stripe login</code>). Live keys only land in Vercel prod env, never on your laptop.
				</p>
			</Aside>
		</section>

		<section>
			<h2>neonctl — Neon Postgres branches</h2>
			<p>
				<code>neonctl</code> manages Neon projects + branches. A <strong>branch</strong> in Neon is a
				zero-copy clone of a database; we use one per PR to run migration dry-runs without touching prod.
			</p>

			<CodeBlock title="Install + authenticate" lang="bash"
				>$ pnpm add -g neonctl $ neonctl auth</CodeBlock
			>

			<CodeBlock title="Create a branch for a PR" lang="bash"
				>$ neonctl branches create --name pr-42 --parent main $ neonctl connection-string pr-42
				--pooled</CodeBlock
			>

			<p>The second command prints a connection string you pass to migration dry-run in CI.</p>
		</section>

		<section>
			<h2>drizzle-kit — schema + migrations</h2>
			<p>
				<code>drizzle-kit</code> generates SQL migrations from your TypeScript schema and applies
				them. It ships as a dev dependency, so you call it via <code>pnpm</code>.
			</p>

			<CodeBlock title="From schema → SQL migration file" lang="bash">$ pnpm db:generate</CodeBlock>

			<p>Expected output:</p>

			<CodeBlock lang="text"
				>drizzle-kit: v0.31.x ✓ Reading schema src/lib/server/db/schema.ts ✓ Creating migration
				drizzle/0001_add_profile.sql</CodeBlock
			>

			<CodeBlock title="Apply against the current DATABASE_URL" lang="bash"
				>$ pnpm db:migrate</CodeBlock
			>

			<CodeBlock title="Inspect tables interactively" lang="bash">$ pnpm db:studio</CodeBlock>
		</section>

		<section>
			<h2>playwright — end-to-end tests</h2>
			<p>
				<strong>Playwright</strong> drives a real browser (Chromium, Firefox, WebKit) against your app.
				We use it to test sign-up, checkout, and admin flows end-to-end.
			</p>

			<CodeBlock title="Install browsers (one-time)" lang="bash"
				>$ pnpm exec playwright install</CodeBlock
			>

			<CodeBlock title="Run the suite" lang="bash">$ pnpm test:e2e $ pnpm test:e2e --ui</CodeBlock>

			<p>
				<code>--ui</code> opens an interactive test runner with a live DOM snapshot for each step — invaluable
				when a test fails in CI.
			</p>
		</section>

		<section>
			<h2>vitest — unit + integration</h2>
			<p>
				<strong>Vitest</strong> runs Vite-native tests. We use it for service-layer logic, schema round-trips,
				and anything that doesn&rsquo;t need a browser.
			</p>

			<CodeBlock title="Run once / watch" lang="bash"
				>$ pnpm test:unit -- --run $ pnpm test:unit</CodeBlock
			>

			<p>Expected output on a green run:</p>

			<CodeBlock lang="text">
				✓ src/lib/server/services/contacts.test.ts (8) ✓
				src/lib/server/services/subscriptions.test.ts (12) Test Files 2 passed (2) Tests 20 passed
				(20)</CodeBlock
			>
		</section>

		<section>
			<h2>resend — email</h2>
			<p>
				<code>resend</code> has a small CLI and a richer REST API. We mostly use the API, but the CLI
				is handy for local smoke tests.
			</p>

			<CodeBlock title="Send a test email" lang="bash"
				>$ pnpm dlx resend send --from 'hello@send.tradeflex.app' \ --to 'you@example.com' \
				--subject 'Hello from Trade Flex' \ --text 'It works.'</CodeBlock
			>
		</section>

		<section>
			<h2>bunnycdn — video uploads</h2>
			<p>
				Bunny Stream hosts gated video. We upload lesson masters via the API (wrapped in a small npm
				helper) and rotate signed embed URLs per viewer session.
			</p>

			<CodeBlock title="Upload a lesson" lang="bash"
				>$ pnpm dlx @bunnycdn/stream upload \ --library $BUNNY_STREAM_LIBRARY_ID \ --title 'Price
				Action — Lesson 1' \ ./lesson-01.mp4</CodeBlock
			>

			<Aside type="danger" title="Never use YouTube for gated content">
				<p>
					YouTube unlisted is <em>not</em> access control. Any URL that leaks stays watchable. Only use
					YouTube for the public landing hero and free previews. Bunny Stream for every paid lesson.
				</p>
			</Aside>
		</section>

		<section>
			<h2>tauri — macOS app</h2>
			<p>
				Tauri wraps our web build into a native macOS binary. It lands in Phase 11; the commands are
				here so the reference is complete.
			</p>

			<CodeBlock title="Dev" lang="bash">$ pnpm tauri dev</CodeBlock>

			<CodeBlock title="Build signed + notarized release" lang="bash"
				>$ pnpm tauri build --target universal-apple-darwin</CodeBlock
			>
		</section>

		<section>
			<h2>Recap</h2>
			<ul>
				<li>The CLI is your primary control surface — reproducible, inspectable, scriptable.</li>
				<li>
					You installed (or will install): <code>git</code>, <code>gh</code>, <code>pnpm</code>,
					<code>vercel</code>, <code>stripe</code>, <code>neonctl</code>, <code>drizzle-kit</code>,
					<code>playwright</code>, <code>vitest</code>, <code>resend</code>, <code>bunnycdn</code>,
					<code>tauri</code>.
				</li>
				<li>
					Every later page assumes you can come back to this reference when a command looks
					unfamiliar.
				</li>
			</ul>

			<h3>Verify you&rsquo;re done</h3>
			<ul>
				<li><code>git --version</code> prints a version.</li>
				<li><code>gh auth status</code> says you&rsquo;re logged in.</li>
				<li><code>pnpm --version</code> prints <code>10.x</code> or newer.</li>
				<li><code>vercel --version</code> prints a version.</li>
				<li><code>stripe --version</code> prints a version.</li>
			</ul>

			<h3>Next up</h3>
			<p>
				<a href="/course">Back to the module overview →</a> — Module 1 begins with the project setup page:
				we turn the existing scaffold into the Trade Flex repo and wire it to Neon.
			</p>
		</section>

		<PrevNext />
	</article>

	<TableOfContents />
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--toc-w);
		gap: var(--space-6);
		max-width: calc(var(--content-max) + var(--toc-w) + 64px);
	}

	.page-head {
		margin-bottom: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.page-head h1 {
		font-size: var(--fs-4xl);
	}

	.lede {
		font-size: var(--fs-lg);
		color: var(--color-text-muted);
		line-height: var(--lh-relaxed);
		margin-top: var(--space-2);
	}

	@media (max-width: 1100px) {
		.page {
			grid-template-columns: 1fr;
		}
	}
</style>
