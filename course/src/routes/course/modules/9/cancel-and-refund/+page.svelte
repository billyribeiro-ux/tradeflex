<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>9.3 Cancel + refund — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 9 · Pricing, checkout, billing"
	title="9.3 · Cancel + refund — two knobs, four decisions"
	lede="Every cancellation is actually four decisions: stop billing now or at period end, refund or not, prorate or not, keep or revoke access. Get them wrong and you'll owe a user money or a retention team an apology."
>
	<section>
		<h2>The four knobs</h2>
		<ul>
			<li>
				<strong>When</strong> — cancel <em>immediately</em> (no more invoices) or <em>at period end</em>
				(honour what they paid for).
			</li>
			<li>
				<strong>Refund</strong> — none, full, or prorated against unused days.
			</li>
			<li>
				<strong>Proration credit</strong> — whether the refund becomes Stripe <em>credit</em>
				(applied to any future invoice) or a real money return via the original payment method.
			</li>
			<li>
				<strong>Entitlement</strong> — does access stop immediately or match "when"?
			</li>
		</ul>
		<Aside type="tip">
			<p>
				The most common pair for a self-serve portal is <strong>at period end + no refund +
					keep access until the end</strong>. You keep every dollar they paid, and they keep what
				they bought. No one is surprised.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Pattern A — cancel at period end</h2>
		<p>This is what the Stripe Customer Portal does by default. A one-line update flips the flag.</p>
		<CodeBlock title="src/lib/server/billing/cancel.ts" lang="ts">
			{`export async function cancelAtPeriodEnd(caller: Caller, subId: string) {
  assertRole(caller, 'member', 'admin');
  const sub = await stripe.subscriptions.update(subId, {
    cancel_at_period_end: true,
    cancellation_details: { comment: \`Requested by \${caller.userId}\` }
  });
  await writeAudit(caller, {
    type: 'subscription.cancel_at_period_end',
    subjectId: subId,
    metadata: { currentPeriodEnd: sub.current_period_end }
  });
}`}
		</CodeBlock>
		<p>
			Stripe will deliver <code>customer.subscription.updated</code> with
			<code>cancel_at_period_end: true</code>; your webhook handler writes that to the subscription
			row, and the <code>/account</code> page shows "ends on {'{'}date{'}'}" with an
			"Undo cancellation" button that flips the flag back.
		</p>
	</section>

	<section>
		<h2>Pattern B — cancel immediately with a prorated refund</h2>
		<p>
			Use this for a goodwill exit — a misfire signup, a user who was double-charged, a policy
			refund. Stripe computes the unused-time credit; you tell it to pay that credit back to the
			original payment method instead of keeping it as Stripe balance.
		</p>
		<CodeBlock title="src/lib/server/billing/cancel.ts" lang="ts">
			{`export async function cancelImmediateWithProratedRefund(
  caller: Caller,
  subId: string,
  reason: string
) {
  assertRole(caller, 'admin');                 // admin-only by default
  const sub = await stripe.subscriptions.cancel(subId, {
    prorate: true,
    invoice_now: true                          // issues the final invoice w/ the prorated credit
  });

  // Stripe creates a credit note. Convert it to a refund against the last paid invoice.
  const invoices = await stripe.invoices.list({ subscription: subId, limit: 1 });
  const lastPaid = invoices.data.find((i) => i.status === 'paid');
  if (lastPaid?.charge) {
    await stripe.refunds.create({
      charge: lastPaid.charge,
      amount: sub.latest_invoice.total > 0 ? sub.latest_invoice.total : undefined,
      reason: 'requested_by_customer',
      metadata: { cancel_reason: reason, acted_by: caller.userId }
    });
  }
  await writeAudit(caller, {
    type: 'subscription.cancel_and_refund',
    subjectId: subId,
    metadata: { reason }
  });
}`}
		</CodeBlock>
		<Aside type="caution">
			<p>
				<strong>Two-person approval for refunds above $500.</strong> A single-admin refund loop is a
				fraud vector — an attacker with one admin account can cash out customer charges. Either
				require a second approver on a hard threshold, or route large refunds through a separate
				"approved" queue that only a finance role can clear.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Entitlement under cancellation</h2>
		<p>
			The <code>entitlementFor</code> function already handles this — if the subscription is
			<code>canceled</code> but <code>currentPeriodEnd</code> is in the future, a "cancel at period
			end" user still has access until that date. Immediate cancel with refund flips the
			subscription to <code>canceled</code> and rolls <code>currentPeriodEnd</code> to now, and
			entitlement goes to <code>{'{'}ok: false{'}'}</code>.
		</p>
		<CodeBlock title="src/lib/server/billing/entitlement.ts (excerpt)" lang="ts">
			{`if (sub.status === 'canceled') {
  if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd > now) {
    return { ok: true, tier: tierFor(sub.priceId), expiresAt: sub.currentPeriodEnd };
  }
  return { ok: false, reason: 'expired' };
}`}
		</CodeBlock>
	</section>

	<section>
		<h2>Admin confirmation UI — the last line of defence</h2>
		<p>
			Before calling Pattern B from the admin surface, force the operator to type the dollar amount
			they're about to refund. Costs a second; prevents a typo refunding $19,900 instead of $19.
		</p>
		<CodeBlock title="src/routes/admin/subscriptions/[id]/+page.svelte" lang="svelte">
			{`<form method="post" action="?/cancelAndRefund" use:enhance>
  <p>
    This will cancel <strong>{sub.userEmail}</strong> and refund
    <strong>${'$'}{formatDollars(sub.unusedCreditCents)}</strong>.
  </p>
  <label>
    Type the dollar amount to confirm:
    <input name="confirmAmount" type="text" required />
  </label>
  <button class="btn-danger" type="submit">Cancel + refund</button>
</form>`}
		</CodeBlock>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Self-serve cancel = at period end, no refund, keep access. No surprises.</li>
			<li>
				Admin cancel + refund = <code>prorate: true</code>, then
				<code>refunds.create</code> against the last paid charge.
			</li>
			<li>
				<code>cancelAtPeriodEnd + currentPeriodEnd &gt; now</code> keeps entitlement alive through
				the paid window.
			</li>
			<li>
				Big refunds need a confirm-the-amount UI and, above a threshold, a second approver. One is
				a typo-catcher, the other is a fraud-catcher.
			</li>
		</ul>
	</section>
</CoursePage>
