<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>4.4 Seed script — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 4 · Contacts CRUD"
	title="4.4 · Seed script — realistic data, one command"
	lede="Empty tables hide bugs. A seed script that produces a few hundred realistic contacts makes pagination, search, and role-gated views behave like production on day one."
>
	<section>
		<h2>Why a real seed beats a fixture</h2>
		<p>
			Fixtures (five rows, perfect data) hide three classes of bug: empty-state pagination, Unicode
			in names, and time-zone skew in <code>createdAt</code>. A seed script that inserts 200 contacts
			with varied shapes catches all of them before the first PR.
		</p>
		<Aside type="tip">
			<p>
				Seed scripts belong in the repo, not in migrations. Migrations describe <em>schema</em>;
				seeds describe <em>data for local + CI</em>. Never seed production.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The script</h2>
		<CodeBlock title="scripts/seed.ts" lang="ts">
			{`import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { contact } from '../src/lib/server/db/schema';

const FIRST = ['Ada', 'Linus', 'Grace', 'Ken', 'Margaret', 'Barbara', 'Alan', '中村', 'José'];
const LAST  = ['Lovelace', 'Torvalds', 'Hopper', 'Thompson', 'Hamilton', 'Liskov', 'Turing'];
const TAGS  = [['lead'], ['customer'], ['lead', 'vip'], ['unsubscribed'], []];

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

async function main() {
  const rows = Array.from({ length: 200 }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const ageDays = Math.floor(Math.random() * 365);
    return {
      email: \`\${first.toLowerCase()}.\${last.toLowerCase()}\${i}@example.test\`,
      name: \`\${first} \${last}\`,
      tags: pick(TAGS),
      createdAt: new Date(Date.now() - ageDays * 86_400_000)
    };
  });

  await db.insert(contact).values(rows).onConflictDoNothing();
  console.log(\`seeded \${rows.length} contacts\`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				<code>@example.test</code> is reserved by IANA and guaranteed to never resolve — safe for
				test data. Never use <code>@example.com</code> (a real domain owned by IANA). Never use a
				real person's address, even yours.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Wire it to a script</h2>
		<CodeBlock title="course/package.json (excerpt)" lang="json">
			{`{
  "scripts": {
    "seed": "tsx scripts/seed.ts",
    "seed:reset": "tsx scripts/seed.ts --reset"
  }
}`}
		</CodeBlock>
		<p>
			<code>tsx</code> executes the TypeScript directly — no compile step. Add <code>tsx</code> under
			<code>devDependencies</code> if it's not there yet: <code>pnpm add -D tsx</code>.
		</p>
	</section>

	<section>
		<h2>A reset guard</h2>
		<p>
			Sometimes you want to start fresh. <code>--reset</code> truncates first, but <em>only</em> if
			the database URL hostname is <code>localhost</code> — a three-line insurance policy that
			prevents a catastrophic mistake.
		</p>
		<CodeBlock title="scripts/seed.ts (excerpt)" lang="ts">
			{`if (process.argv.includes('--reset')) {
  const url = new URL(process.env.DATABASE_URL!);
  if (url.hostname !== 'localhost' && !url.hostname.endsWith('.neon.tech')) {
    throw new Error(\`refusing to truncate non-local db: \${url.hostname}\`);
  }
  await db.delete(contact);
  console.log('truncated contact');
}`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				The Neon-branch allowlist is deliberate: CI's Neon branch is a fresh hostname on every PR, so
				truncating it is safe. Your production database's hostname is <em>not</em> on the list, and
				the seed will refuse to run.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Verify</h2>
		<CodeBlock title="bash" lang="bash">
			{`pnpm seed
# seeded 200 contacts

psql $DATABASE_URL -c "select count(*) from contact"
#  count
# -------
#    200`}
		</CodeBlock>
		<p>
			Now open <code>/admin/marketing</code>. Pagination works. Sort order is stable. The three
			"unsubscribed" entries render the grey badge. You can demo the feature to a stakeholder
			without apologising for the empty state.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Seed in development, never in production. Scripts, not migrations.</li>
			<li><code>@example.test</code> for addresses, <code>Math.random</code> for age.</li>
			<li>Volume (200+) exposes pagination bugs fixtures can't.</li>
			<li>A hostname allowlist on <code>--reset</code> is the cheapest catastrophe-proofing there is.</li>
		</ul>
	</section>
</CoursePage>
