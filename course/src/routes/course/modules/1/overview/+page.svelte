<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import FileTree from '$lib/components/course/FileTree.svelte';
</script>

<svelte:head>
	<title>1.1 Overview — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 1 · Project setup"
	title="1.1 · Overview"
	lede="What Module 1 builds, why the order is what it is, and how you will know you're done."
>
	<section>
		<h2>What you&rsquo;ll learn</h2>
		<p>
			In Module 1 you will turn a default SvelteKit scaffold into the foundation of Trade Flex. By
			the end, you will have a repo that is versioned, tooled, connected to a real Postgres database
			on <strong>Neon</strong>, wired to <strong>Better Auth</strong>, and ready to accept its first
			signed-up user.
		</p>
		<p>
			This is the cheapest module to get right, and the most expensive to get wrong. Spend the time
			here — everything after depends on it.
		</p>
	</section>

	<section>
		<h2>Why this order</h2>
		<p>
			A production app is a stack of concerns. Each layer assumes the layer beneath works. Build
			them bottom-up:
		</p>
		<ol>
			<li>
				<strong>Repo + tooling</strong> — you cannot commit progress without Git in place, and you cannot
				reproduce a build without pinned tools.
			</li>
			<li>
				<strong>Database</strong> — every later feature reads or writes somewhere. A dev branch on Neon
				gives you an isolated, cheap copy of Postgres you can safely break.
			</li>
			<li>
				<strong>Auth</strong> — every authenticated surface needs a <code>user</code> row. Better Auth
				writes them; we generate its schema and migrate it first.
			</li>
			<li>
				<strong>Profile + authorization primitives</strong> — everything user-facing will key off the
				profile row, and everything data-facing will go through the service layer. Land the pattern now.
			</li>
		</ol>
	</section>

	<section>
		<h2>The shape of the repo by the end of this module</h2>
		<FileTree>
			{`tradeflex/
├── docs/
│   ├── prd.md
│   ├── roadmap.md
│   ├── domain-model.md
│   ├── threat-model.md
│   ├── observability-plan.md
│   └── adr/
│       ├── 0001-stack-lock.md
│       ├── 0002-admin-settings-api-keys.md
│       └── …
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts           ← Better Auth config (already there)
│   │   │   ├── db/
│   │   │   │   ├── index.ts      ← Drizzle client
│   │   │   │   ├── schema.ts     ← app tables (task demo for now)
│   │   │   │   └── auth.schema.ts ← Better Auth tables
│   │   │   └── services/
│   │   │       └── profile.ts    ← new, the first service-layer example
│   │   ├── styles/
│   │   │   ├── tokens.css        ← PE7 CSS design tokens
│   │   │   ├── reset.css
│   │   │   └── base.css
│   │   └── components/
│   │       ├── brand/Logo.svelte
│   │       └── course/ …         ← course-site primitives
│   ├── hooks.server.ts           ← Better Auth handle (already there)
│   └── routes/
│       ├── +layout.svelte        ← loads styles
│       └── course/ …
├── drizzle.config.ts
├── .env                          ← dev secrets (gitignored)
├── .env.example                  ← committed template
└── package.json                  ← name: tradeflex
`}
		</FileTree>
	</section>

	<section>
		<h2>What you will ship at the end of Module 1</h2>
		<ul>
			<li>A repo named <code>tradeflex</code> with Git history and a committed docs tree.</li>
			<li>A Neon project with a dev branch you can connect to from your laptop.</li>
			<li>Better Auth tables migrated into that dev branch.</li>
			<li>
				A <code>profile</code> table keyed to the Better Auth <code>user.id</code>, backed by a
				typed service, with an audit trail on every write.
			</li>
			<li>Green <code>pnpm check</code>, green <code>pnpm lint</code>, zero TypeScript errors.</li>
		</ul>
	</section>

	<Aside type="note" title="No frontend yet">
		<p>
			Module 1 does not build any user-facing pages beyond what the scaffold already has. That is on
			purpose. We are landing the plumbing. Module 3 is when the member-facing auth UI lands.
		</p>
	</Aside>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Module 1 builds the foundation: repo, tooling, database, auth, service-layer pattern.</li>
			<li>Order is bottom-up; every later module depends on these primitives.</li>
			<li>By the end you will have migrated tables on Neon and a working service-layer example.</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href="/course/modules/1/repo-and-tooling">1.2 · Repo + tooling →</a>
		</p>
	</section>
</CoursePage>
