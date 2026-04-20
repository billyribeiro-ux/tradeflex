<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>6.3 Idempotent webhooks — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 6 · Stripe + SvelteKit"
	title="6.3 · Idempotent webhook handler"
	lede="Stripe will replay every event. Sometimes deliberately (manual resend), sometimes by accident (your handler returned 500 after writing a row). The fix is one unique index and one early return — and it changes how you think about every async pipeline after."
>
	<section>
		<h2>Why replay is not optional</h2>
		<p>
			Stripe retries failed deliveries for up to 3 days with exponential backoff. It also lets the
			dashboard operator hit "Resend" manually. If your handler writes a row then 500s because of an
			unrelated downstream, you'll see the same event again — and the row can be written twice.
		</p>
		<Aside type="tip">
			<p>
				The test question for idempotency: <strong>if this handler runs twice, is the resulting
					database state identical to running it once?</strong> If no, you have a bug waiting to
				ship.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The table</h2>
		<p>
			One row per event, with the Stripe event id as the primary key. The
			<code>payload</code> column stores the raw JSON for replay during incident triage.
		</p>
		<CodeBlock title="src/lib/server/db/schema.ts" lang="ts">
			{`export const stripeEvent = pgTable('stripe_event', {
  id: text('id').primaryKey(),                 // evt_1Pxxx — from Stripe
  type: text('type').notNull(),                // e.g. invoice.paid
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  payload: jsonb('payload').notNull(),
  lastError: text('last_error')
});`}
		</CodeBlock>
		<p>
			<code>processedAt</code> is nullable by design: the row exists from the moment we receive the
			event, but only gets a timestamp once the side effects succeed. This lets you query "events
			received but never processed" — the cleanest incident signal Stripe gives you.
		</p>
	</section>

	<section>
		<h2>The handler</h2>
		<CodeBlock title="src/routes/api/stripe/webhook/+server.ts" lang="ts">
			{`import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { stripeEvent } from '$lib/server/db/schema';
import { verifyStripeSignature } from '$lib/server/billing/webhook';
import { dispatchEvent } from '$lib/server/billing/events';

export const POST: RequestHandler = async ({ request }) => {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) throw error(400, 'missing signature');

  let event;
  try {
    event = verifyStripeSignature(rawBody, sig);
  } catch (e) {
    throw error(400, \`invalid signature: \${String(e)}\`);
  }

  // Step 1 — record-or-skip. Unique PK makes this atomic.
  const inserted = await db
    .insert(stripeEvent)
    .values({ id: event.id, type: event.type, payload: event })
    .onConflictDoNothing()
    .returning({ id: stripeEvent.id });

  if (inserted.length === 0) {
    // Already seen. Stripe re-sent it; we acknowledge and move on.
    return new Response('ok', { status: 200 });
  }

  // Step 2 — side effects. Wrap in try so we can record the error.
  try {
    await dispatchEvent(event);
    await db
      .update(stripeEvent)
      .set({ processedAt: new Date() })
      .where(eq(stripeEvent.id, event.id));
  } catch (e) {
    await db
      .update(stripeEvent)
      .set({ lastError: String(e) })
      .where(eq(stripeEvent.id, event.id));
    throw error(500, 'handler failed');
  }

  return new Response('ok', { status: 200 });
};`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				Read the request body once as <code>text()</code>, not <code>json()</code>. Stripe's HMAC is
				computed over the raw bytes; any JSON roundtrip will change whitespace and break the
				signature check.
			</p>
		</Aside>
	</section>

	<section>
		<h2>What the two-step does</h2>
		<p>
			Step 1 is the idempotency guarantee: the unique primary key makes <code>insert … do nothing</code>
			atomic. If two concurrent Stripe deliveries race, exactly one row lands; the other returns an
			empty array. Step 2 runs side effects only on first sight.
		</p>
		<p>
			If step 2 throws, the row is kept (now with <code>last_error</code>) and we return 500. Stripe
			will retry. On retry, step 1 finds the row and returns early — but we haven't replayed the
			side effects. To recover, <em>manually</em> replay by reading the stored
			<code>payload</code> and calling <code>dispatchEvent</code> again. This is the pattern.
		</p>
		<Aside type="tip">
			<p>
				The alternative — "let the retry re-run side effects" — is tempting but wrong. Stripe
				retries happen at unpredictable intervals; your downstream (email, DB, Redis) has to be
				idempotent end-to-end. Centralising idempotency at the event boundary means every downstream
				can stay naive.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Verify</h2>
		<CodeBlock title="two terminals" lang="bash">
			{`# terminal 1
stripe listen --forward-to localhost:5173/api/stripe/webhook

# terminal 2
stripe trigger invoice.paid
# forwards evt_... to your webhook. Check the DB:

psql $DATABASE_URL -c "select id, type, processed_at from stripe_event order by received_at desc limit 5"

# Now replay by hand:
stripe events resend evt_...

# The DB should still have exactly one row for that event id.`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				<strong>Record first, act second.</strong> The unique PK on the event id is the entire
				idempotency story.
			</li>
			<li>
				<strong>One raw read.</strong> <code>request.text()</code>, not <code>json()</code> — the
				HMAC is byte-exact.
			</li>
			<li>
				<strong>Store the payload.</strong> When something goes wrong, you can't ask Stripe for the
				event twice without a manual resend; the DB row is your tape.
			</li>
			<li>
				<strong><code>processedAt</code> is the signal.</strong> Null means "received but not
				processed" — the cleanest "we have a bug" query in the whole billing surface.
			</li>
		</ul>
	</section>
</CoursePage>
