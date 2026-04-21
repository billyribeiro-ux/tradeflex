<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import Steps from '$lib/components/course/Steps.svelte';
</script>

<svelte:head><title>4.2 Schema + service — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 4 · Contacts CRUD"
	title="4.2 · Schema + service"
	lede="Table, service, public endpoint. Three files. We write them in that order because the service is the contract; routes consume it, tests exercise it."
>
	<section>
		<Steps>
			<li>Add the <code>contact</code> table to <code>src/lib/server/db/schema.ts</code>.</li>
			<li>Push the schema to your Neon dev branch with <code>pnpm db:push</code>.</li>
			<li>Write <code>contactsService.captureLead</code> (idempotent, validated).</li>
			<li>
				Wire <code>POST /api/leads</code> that calls the service, returns 200 whether the contact is new
				or already existed.
			</li>
		</Steps>
	</section>

	<section>
		<h2>The table</h2>
		<CodeBlock title="src/lib/server/db/schema.ts" lang="ts">
			{`export const contact = pgTable('contact', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  source: text('source').notNull(),
  name: text('name'),
  tags: jsonb('tags').notNull().default([]),
  optedIn: boolean('opted_in').notNull().default(true),
  unsubscribedAt: timestamp('unsubscribed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({})
});`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				<strong>No unique index on email</strong> at the schema level — dedup logic lives in the
				service so that we can record a <code>domain_event</code> for the duplicate attempt instead of
				letting Postgres raise. It is also one less migration to manage if we ever allow the same email
				in multiple sources (ebook vs podcast) under separate rows.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The service</h2>
		<CodeBlock title="src/lib/server/services/contacts.ts" lang="ts">
			{`export const contactsService = {
  async captureLead(input: CaptureLeadInput) {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      throw new Error('Invalid email address.');
    }
    const existing = await db.select().from(contact)
      .where(eq(contact.email, email)).limit(1);
    if (existing[0]) return { id: existing[0].id, created: false };

    const id = crypto.randomUUID();
    await db.insert(contact).values({
      id, email,
      source: input.source,
      name: input.name ?? null,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {}
    });
    return { id, created: true };
  },
  // list + unsubscribe — staff only, covered in 4.3
};`}
		</CodeBlock>
	</section>

	<section>
		<h2>The endpoint</h2>
		<CodeBlock title="src/routes/api/leads/+server.ts" lang="ts">
			{`export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const body = await readBody(request);
  const result = await contactsService.captureLead({
    email: body.email,
    source: body.source ?? 'landing_ebook',
    name: body.name,
    metadata: {
      ip: getClientAddress(),
      ua: request.headers.get('user-agent') ?? null
    }
  });
  return json({ ok: true, ...result });
};`}
		</CodeBlock>
		<Aside type="note">
			<p>
				<code>readBody</code> tolerates both JSON and <code>application/x-www-form-urlencoded</code> —
				the landing form posts as form-data for progressive enhancement; the API accepts both.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Schema first. Service second. Routes last.</li>
			<li>
				Idempotency lives in the service, not the table — so duplicates can be observed, not
				errored.
			</li>
			<li>The public endpoint is thin: read body, call service, return JSON.</li>
		</ul>
		<h3>Next up</h3>
		<p><a href={resolve('/course/modules/4/admin-inbox')}>4.3 · Admin inbox + unsubscribe →</a></p>
	</section>
</CoursePage>
