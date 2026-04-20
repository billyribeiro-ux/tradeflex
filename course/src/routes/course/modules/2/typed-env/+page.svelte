<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Steps from '$lib/components/course/Steps.svelte';

	const envSchema = `// src/lib/server/env.ts
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a postgres connection URL'),
  DATABASE_URL_DIRECT: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be ≥ 32 chars'),
  APP_ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  ORIGIN: z.string().url().default('http://localhost:5173'),
  // Optional integrations — filled in via /admin/settings/integrations,
  // .env is only a bootstrap fallback.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  BUNNY_STREAM_LIBRARY_ID: z.string().optional(),
  BUNNY_STREAM_API_KEY: z.string().optional()
});

const publicSchema = z.object({
  PUBLIC_APP_NAME: z.string().default('Trade Flex'),
  PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional()
});

type ServerEnv = z.infer<typeof serverSchema>;
type PublicEnv = z.infer<typeof publicSchema>;

function parseOrDie<T>(label: string, schema: z.ZodType<T>, source: Record<string, string | undefined>): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => \`  - \${i.path.join('.') || '(root)'}: \${i.message}\`)
      .join('\\n');
    throw new Error(\`Invalid \${label}:\\n\${issues}\`);
  }
  return result.data;
}

export const env: ServerEnv = parseOrDie('server env', serverSchema, privateEnv);
export const pub: PublicEnv = parseOrDie('public env', publicSchema, publicEnv);`;

	const crashOutput = `Error: Invalid server env:
  - DATABASE_URL: DATABASE_URL must be a postgres connection URL
  - BETTER_AUTH_SECRET: BETTER_AUTH_SECRET must be ≥ 32 chars`;

	const usage = `import { env } from '$lib/server/env';

// Fully typed — DATABASE_URL is guaranteed to exist and be a URL
const client = postgres(env.DATABASE_URL);`;
</script>

<svelte:head>
	<title>2.2 Typed env with Zod — Trade Flex</title>
</svelte:head>

<CoursePage
	module="Module 2 · SvelteKit + data layer"
	title="2.2 · Typed env with Zod"
	lede="Parse every environment variable at boot. Missing config should crash before the first request, not after the first paying customer."
>
	<section>
		<h2>The problem with <code>process.env</code></h2>
		<p>
			SvelteKit exposes env vars via <code>$env/dynamic/private</code> and
			<code>$env/static/private</code>. Both give you
			<code>Record&lt;string, string | undefined&gt;</code>. Every consumer has to decide what to do
			if the value is missing — and most forget.
		</p>
		<p>The classic bug:</p>
		<CodeBlock
			lang="ts"
			code={`// This compiles. This runs. This is broken.
const client = postgres(process.env.DATABASE_URL!);  // ← the bang hides a time bomb`}
		/>
		<p>
			The <code>!</code> lies to the compiler. In production, if <code>DATABASE_URL</code> is unset
			or misspelled, <code>postgres(undefined)</code> throws deep inside a query — which your error
			tracker reports as "connection refused to <code>undefined</code>." Hours burned.
		</p>
	</section>

	<section>
		<h2>The fix: parse once, at boot</h2>
		<p>
			We use a Zod schema to validate every variable the server needs, and we run it at import time.
			If anything is missing or malformed, the module throws, and SvelteKit refuses to serve a
			single request. You see the error in your dev terminal — not in Sentry.
		</p>
		<CodeBlock lang="ts" title="src/lib/server/env.ts" code={envSchema} />
	</section>

	<section>
		<h2>Why <code>$env/dynamic/private</code> and not <code>static</code></h2>
		<p>
			SvelteKit offers two flavors. <code>static</code> is evaluated at build time;
			<code>dynamic</code>
			is read from <code>process.env</code> at runtime. We want dynamic because:
		</p>
		<ul>
			<li>
				<strong>Secrets rotate.</strong> Rotating a Stripe key shouldn't require a rebuild.
			</li>
			<li>
				<strong>The admin-settings table overrides env.</strong> Values can come from DB at runtime
				(see <code>settings.ts</code>). A build-time snapshot would defeat that.
			</li>
			<li>
				<strong>Vercel preview deployments</strong> inject env per-environment at runtime. Dynamic picks
				that up; static does not.
			</li>
		</ul>
		<Aside type="caution" title="Client-side env = public only">
			<p>
				<code>PUBLIC_*</code> variables are the only ones you can read in browser code. Anything
				else stays server-side. That's why the schema is split into <code>serverSchema</code> and
				<code>publicSchema</code>. Put a secret under <code>PUBLIC_</code> by mistake and it ships to
				every page-view.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Required vs optional</h2>
		<p>
			<code>DATABASE_URL</code> and <code>BETTER_AUTH_SECRET</code> are required — the app is
			useless without them. Integration secrets (<code>STRIPE_SECRET_KEY</code>,
			<code>RESEND_API_KEY</code>, etc.) are all <code>optional()</code>, because those keys are
			managed primarily from the <code>/admin/settings/integrations</code> surface we ship in a
			later module. <code>.env</code> is a bootstrap fallback for local dev only.
		</p>
		<p>
			The rule of thumb: if the app cannot serve a 200 from <code>/</code> without the value, it's required.
			If it can degrade — showing a banner like "Stripe is not configured yet" — it's optional.
		</p>
	</section>

	<section>
		<h2>What it looks like when it fails</h2>
		<Steps>
			<li>
				Open <code>.env</code> and comment out <code>DATABASE_URL</code>.
			</li>
			<li>
				Run <code>pnpm dev</code>.
			</li>
			<li>
				The process dies with:
				<CodeBlock lang="text" code={crashOutput} />
			</li>
		</Steps>
		<p>
			No request ever made it to the database. The failure is loud, specific, and fixable in 30
			seconds.
		</p>
	</section>

	<section>
		<h2>Using it from the rest of the app</h2>
		<CodeBlock lang="ts" code={usage} />
		<p>
			Everywhere else in the codebase, import <code>env</code> from <code>$lib/server/env</code>.
			Never touch <code>process.env</code> or <code>$env/dynamic/private</code> directly outside of that
			file — grep for it in code review.
		</p>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Parse env at boot with Zod; treat the app as unusable if required values are missing.</li>
			<li>
				Use <code>dynamic</code>, not <code>static</code>, so secrets can rotate and admin-settings
				can override.
			</li>
			<li>
				Optional keys belong to integrations managed from the admin UI; <code>.env</code> is dev bootstrap.
			</li>
			<li><code>env</code> is the only thing downstream code should import.</li>
		</ul>

		<h3>Next up</h3>
		<p>
			<a href="/course/modules/2/drizzle-service-layer">2.3 · Drizzle client + service layer →</a>
		</p>
	</section>
</CoursePage>
