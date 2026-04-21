<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head>
	<title>1.2 Repo + tooling — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 1 · Project setup"
	title="1.2 · Repo + tooling"
	lede="Turn the SvelteKit scaffold into the Trade Flex repo: pin tools, commit the docs, and make the working state reproducible for anyone who clones it."
>
	<section>
		<h2>What you&rsquo;ll learn</h2>
		<ul>
			<li>
				What each of these tools does: <code>git</code>, <code>pnpm</code>, <code>corepack</code>,
				<code>.nvmrc</code>, <code>.npmrc</code>, <code>.prettierrc</code>.
			</li>
			<li>How to pin Node + pnpm so every contributor (and CI) runs the same versions.</li>
			<li>Why we commit the <code>docs/</code> tree before we write a single feature.</li>
			<li>What a <strong>conventional commit message</strong> is and why it matters later.</li>
		</ul>
	</section>

	<section>
		<h2>Why pin versions</h2>
		<p>
			When a teammate (or a CI runner, or your future self) clones this repo, they need the same
			Node version, the same <code>pnpm</code> version, and the same lockfile to get the same build. Without
			pinning, you get &ldquo;works on my machine&rdquo; bugs that waste hours.
		</p>
		<p>
			Three files do this for us: <code>.nvmrc</code> (Node version),
			<code>package.json</code>&rsquo;s
			<code>packageManager</code> field (pnpm version, enforced by <code>corepack</code>), and
			<code>pnpm-lock.yaml</code> (exact dependency versions).
		</p>
	</section>

	<section>
		<h2>Steps</h2>

		<Steps>
			<li>
				<h4>Verify Node 24 is installed</h4>
				<p>We standardize on Node 24 (LTS as of April 2026). Check what you have:</p>
				<CodeBlock lang="bash">$ node --version</CodeBlock>
				<p>Expected:</p>
				<CodeBlock lang="text">v24.x.x</CodeBlock>
				<p>
					If it says anything older, install Node 24 via <a
						href="https://github.com/nvm-sh/nvm"
						target="_blank"
						rel="noopener noreferrer">nvm</a
					>
					or <a href="https://volta.sh" target="_blank" rel="noopener noreferrer">Volta</a> and re-check.
				</p>
			</li>

			<li>
				<h4>Pin Node via .nvmrc</h4>
				<CodeBlock title=".nvmrc" lang="text">24</CodeBlock>
				<p>
					Anyone with <code>nvm</code> installed can now run <code>nvm use</code> in this folder and land
					on the right version.
				</p>
			</li>

			<li>
				<h4>Pin pnpm via corepack</h4>
				<p>
					<strong>Corepack</strong> ships with Node. It reads the <code>packageManager</code> field
					in <code>package.json</code> and uses exactly that version of pnpm.
				</p>
				<CodeBlock lang="bash">$ corepack enable</CodeBlock>
				<p>Then make sure <code>package.json</code> has:</p>
				<CodeBlock title="package.json (partial)" lang="json"
					>{`{
  "name": "tradeflex",
  "packageManager": "pnpm@10.18.0"
}`}</CodeBlock
				>
			</li>

			<li>
				<h4>Install dependencies</h4>
				<CodeBlock lang="bash">$ pnpm install</CodeBlock>
				<p>Expected:</p>
				<CodeBlock lang="text"
					>Packages: +N Progress: resolved N, reused N, downloaded 0, added N, done Done in 4.2s
					using pnpm v10.18.0</CodeBlock
				>
			</li>

			<li>
				<h4>Initialize git (if not already)</h4>
				<CodeBlock lang="bash"
					>$ git init $ git add . $ git commit -m "chore: initial scaffold + docs"</CodeBlock
				>
				<p>
					The message follows the <a
						href="https://www.conventionalcommits.org"
						target="_blank"
						rel="noopener noreferrer">Conventional Commits</a
					>
					convention (<code>chore</code>, <code>feat</code>, <code>fix</code>,
					<code>docs</code>, …). Later, our CI generates release notes from these prefixes — so
					being consistent now pays off.
				</p>
			</li>

			<li>
				<h4>Smoke-test the build</h4>
				<CodeBlock lang="bash">$ pnpm dev</CodeBlock>
				<p>Expected (abridged):</p>
				<CodeBlock lang="text"
					>VITE v8.x ready in 412 ms ➜ Local: http://localhost:5173/ ➜ Network: use --host to expose
					➜ press h to show help</CodeBlock
				>
				<p>
					Open <code>http://localhost:5173/course</code> — you should see the Trade Flex course
					home. Press <kbd>⌘K</kbd> to verify search, toggle the theme via the icon in the top bar, and
					click into the CLI reference.
				</p>
			</li>

			<li>
				<h4>Lock down the commit</h4>
				<CodeBlock lang="bash">$ pnpm check $ pnpm lint $ pnpm test:unit -- --run</CodeBlock>
				<p>
					All three should exit green. If one doesn&rsquo;t, fix before moving on — we don&rsquo;t
					accumulate broken state in this course.
				</p>
			</li>
		</Steps>
	</section>

	<Aside type="tip" title="Why docs before code">
		<p>
			You wrote a PRD, a roadmap, a domain model, a threat model, an observability plan, and eight
			ADRs <em>before</em> writing an API route. That is not ceremony. It is the PE7 habit of
			closing decisions in writing so that future-you (or a reviewer, or a teammate) can audit
			<em>why</em> a choice was made, not just what. If you skip this, the first time a decision is questioned,
			you re-litigate from memory. Don&rsquo;t.
		</p>
	</Aside>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Node pinned via <code>.nvmrc</code>, pnpm pinned via <code>corepack</code>.</li>
			<li>Initial commit contains the scaffold + docs, following Conventional Commits.</li>
			<li>
				Dev server renders the course home; <code>pnpm check / lint / test:unit</code> all green.
			</li>
		</ul>

		<h3>Verify you&rsquo;re done</h3>
		<ul>
			<li><code>node --version</code> prints <code>v24.x</code>.</li>
			<li><code>pnpm --version</code> matches the pinned <code>packageManager</code> value.</li>
			<li><code>git log --oneline</code> shows at least one commit.</li>
			<li>Dev server renders <code>/course</code> and <code>/course/cli-reference</code>.</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href={resolve('/course/modules/1/neon-dev-branch')}>1.3 · Neon dev branch →</a>
		</p>
	</section>
</CoursePage>
