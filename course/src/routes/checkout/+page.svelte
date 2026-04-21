<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Step = 'account' | 'billing' | 'payment';
	// svelte-ignore state_referenced_locally
	let step = $state<Step>(data.signedIn ? 'billing' : 'account');
	// svelte-ignore state_referenced_locally
	let email = $state(data.email ?? '');
	// svelte-ignore state_referenced_locally
	let fullName = $state(data.name ?? '');
	let addressLine = $state('');
	let city = $state('');
	let region = $state('');
	let postal = $state('');
	let country = $state('US');
	let status = $state<'idle' | 'loading_intent' | 'ready' | 'confirming' | 'error'>('idle');
	let errorMsg = $state<string | null>(null);

	let stripe: Stripe | null = null;
	let elements: StripeElements | null = null;
	let paymentEl: HTMLDivElement | null = $state(null);
	let intentKind = $state<'payment_intent' | 'subscription' | null>(null);

	const stepLabels: Array<{ id: Step; label: string; n: number }> = [
		{ id: 'account', label: 'Sign in', n: 1 },
		{ id: 'billing', label: 'Billing', n: 2 },
		{ id: 'payment', label: 'Payment', n: 3 }
	];

	function fmt(cents: number, currency: string) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(cents / 100);
	}

	function intervalLabel(interval: 'month' | 'year' | 'one_time') {
		if (interval === 'month') return '/mo';
		if (interval === 'year') return '/yr';
		return '';
	}

	async function removeItem(priceId: string) {
		const res = await fetch('/api/checkout/cart', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ priceId })
		});
		if (res.ok) await invalidateAll();
	}

	function goTo(target: Step) {
		if (target === 'account') {
			step = 'account';
			return;
		}
		if (target === 'billing') {
			if (!email) {
				step = 'account';
				return;
			}
			step = 'billing';
			return;
		}
		if (target === 'payment') {
			if (!email || !fullName || !addressLine || !city || !postal || !country) {
				errorMsg = 'Please complete billing details before continuing.';
				return;
			}
			errorMsg = null;
			step = 'payment';
			initPaymentElement();
		}
	}

	async function initPaymentElement() {
		if (data.summary.empty) return;
		status = 'loading_intent';
		errorMsg = null;
		try {
			const res = await fetch('/api/checkout/intent', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, name: fullName })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `Failed to create payment intent (${res.status})`);
			}
			const payload = (await res.json()) as {
				clientSecret: string;
				kind: 'payment_intent' | 'subscription';
				publishableKey: string;
			};
			intentKind = payload.kind;
			stripe = await loadStripe(payload.publishableKey);
			if (!stripe) throw new Error('Stripe.js failed to load.');
			elements = stripe.elements({
				clientSecret: payload.clientSecret,
				appearance: { theme: 'night', labels: 'floating' }
			});
			const pe = elements.create('payment', { layout: 'tabs' });
			if (paymentEl) pe.mount(paymentEl);
			status = 'ready';
		} catch (err) {
			status = 'error';
			errorMsg = err instanceof Error ? err.message : 'Something went wrong.';
		}
	}

	$effect(() => {
		if (step === 'payment' && status === 'ready' && paymentEl && elements) {
			// re-mount if navigated back and forth
		}
	});

	async function submitPayment() {
		if (!stripe || !elements) {
			errorMsg = 'Payment form not ready. Refresh and try again.';
			return;
		}
		status = 'confirming';
		errorMsg = null;
		const { error: stripeError } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${page.url.origin}/checkout/success`,
				payment_method_data: {
					billing_details: {
						name: fullName,
						email,
						address: {
							line1: addressLine,
							city,
							state: region,
							postal_code: postal,
							country
						}
					}
				}
			}
		});
		if (stripeError) {
			status = 'error';
			errorMsg = stripeError.message ?? 'Payment failed.';
		} else {
			// Stripe will redirect on success via return_url.
			await goto('/checkout/success');
		}
	}
</script>

<svelte:head><title>Checkout — Trade Flex</title></svelte:head>

<div class="wrap">
	<main class="main">
		<h1>Checkout</h1>
		<ol class="steps" aria-label="Checkout steps">
			{#each stepLabels as s}
				<li
					class:active={step === s.id}
					class:done={stepLabels.findIndex((x) => x.id === step) > s.n - 1}
				>
					<button type="button" class="tab" onclick={() => goTo(s.id)}>
						<span class="num">{s.n}</span>
						<span>{s.label}</span>
					</button>
				</li>
			{/each}
		</ol>

		{#if step === 'account'}
			<section class="panel">
				<h2>Your email</h2>
				<p class="hint">We send your receipt and login link here.</p>
				<label>
					Email
					<input type="email" bind:value={email} autocomplete="email" required />
				</label>
				{#if !data.signedIn}
					<p class="muted">
						Already have an account? <a href="/login?next=/checkout">Sign in</a> first.
					</p>
				{/if}
				<div class="row">
					<button type="button" class="primary" onclick={() => goTo('billing')} disabled={!email}>
						Continue to billing
					</button>
				</div>
			</section>
		{:else if step === 'billing'}
			<section class="panel">
				<h2>Billing details</h2>
				<label>
					Full name
					<input bind:value={fullName} autocomplete="name" required />
				</label>
				<label>
					Address
					<input bind:value={addressLine} autocomplete="address-line1" required />
				</label>
				<div class="grid2">
					<label>
						City
						<input bind:value={city} autocomplete="address-level2" required />
					</label>
					<label>
						State / Region
						<input bind:value={region} autocomplete="address-level1" />
					</label>
				</div>
				<div class="grid2">
					<label>
						Postal code
						<input bind:value={postal} autocomplete="postal-code" required />
					</label>
					<label>
						Country
						<input bind:value={country} autocomplete="country" required maxlength="2" />
					</label>
				</div>
				{#if errorMsg}<p class="err">{errorMsg}</p>{/if}
				<div class="row">
					<button type="button" class="ghost" onclick={() => goTo('account')}>Back</button>
					<button type="button" class="primary" onclick={() => goTo('payment')}>
						Continue to payment
					</button>
				</div>
			</section>
		{:else}
			<section class="panel">
				<h2>Payment</h2>
				{#if data.summary.empty}
					<p class="muted">Your cart is empty. <a href="/pricing">Browse plans</a>.</p>
				{:else if status === 'loading_intent'}
					<p class="muted">Preparing secure payment form…</p>
				{:else if status === 'error'}
					<p class="err">{errorMsg}</p>
					<button type="button" class="primary" onclick={initPaymentElement}>Retry</button>
				{/if}
				<div bind:this={paymentEl} class="payment-mount"></div>
				{#if status === 'ready' || status === 'confirming'}
					<div class="row">
						<button type="button" class="ghost" onclick={() => goTo('billing')}>Back</button>
						<button
							type="button"
							class="primary"
							onclick={submitPayment}
							disabled={status === 'confirming'}
						>
							{status === 'confirming'
								? 'Processing…'
								: intentKind === 'subscription'
									? `Start membership — ${fmt(data.summary.dueTodayCents, data.summary.currency)}`
									: `Pay ${fmt(data.summary.dueTodayCents, data.summary.currency)}`}
						</button>
					</div>
				{/if}
			</section>
		{/if}
	</main>

	<aside class="cart" aria-label="Order summary">
		<h2>Order</h2>
		{#if data.summary.empty}
			<p class="muted">No items yet. <a href="/pricing">Pick a plan</a>.</p>
		{:else}
			<ul class="lines">
				{#each data.summary.items as line}
					<li>
						<div class="meta">
							<div class="name">{line.productName}</div>
							<div class="sub">
								{fmt(line.unitAmountCents, line.currency)}{intervalLabel(line.interval)}
								{#if line.qty > 1}&times; {line.qty}{/if}
							</div>
						</div>
						<div class="amt">{fmt(line.lineTotalCents, line.currency)}</div>
						<button
							type="button"
							class="remove"
							aria-label="Remove"
							onclick={() => removeItem(line.priceId)}
						>
							×
						</button>
					</li>
				{/each}
			</ul>
			<dl class="totals">
				{#if data.summary.oneTimeCents > 0}
					<div>
						<dt>One-time</dt>
						<dd>{fmt(data.summary.oneTimeCents, data.summary.currency)}</dd>
					</div>
				{/if}
				{#if data.summary.recurringMonthlyCents > 0}
					<div>
						<dt>Then monthly</dt>
						<dd>{fmt(data.summary.recurringMonthlyCents, data.summary.currency)}/mo</dd>
					</div>
				{/if}
				{#if data.summary.recurringYearlyCents > 0}
					<div>
						<dt>Then yearly</dt>
						<dd>{fmt(data.summary.recurringYearlyCents, data.summary.currency)}/yr</dd>
					</div>
				{/if}
				<div class="grand">
					<dt>Due today</dt>
					<dd>{fmt(data.summary.dueTodayCents, data.summary.currency)}</dd>
				</div>
			</dl>
			<p class="legal">
				Payments are processed by Stripe. Cancel anytime from your account. Recurring charges
				continue until you cancel.
			</p>
		{/if}
	</aside>
</div>

<style>
	.wrap {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 360px;
		gap: var(--space-6);
		max-width: var(--layout-max);
		margin: 0 auto;
		padding: var(--space-6);
	}
	@media (max-width: 900px) {
		.wrap {
			grid-template-columns: 1fr;
		}
	}
	h1 {
		font-size: var(--fs-3xl);
		margin: 0 0 var(--space-4);
	}
	.steps {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-5);
		display: flex;
		gap: var(--space-2);
	}
	.steps li {
		flex: 1;
	}
	.tab {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		cursor: pointer;
		font: inherit;
	}
	.steps li.active .tab {
		border-color: var(--color-accent);
		color: var(--color-text);
	}
	.steps li.done .tab {
		color: var(--color-success);
	}
	.num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		background: var(--color-surface-2);
		font-size: var(--fs-xs);
		font-weight: 700;
	}
	.steps li.active .num {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}
	.panel {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.panel h2 {
		font-size: var(--fs-lg);
		margin: 0;
	}
	.hint {
		color: var(--color-text-muted);
		margin: 0;
		font-size: var(--fs-sm);
	}
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	input {
		padding: var(--space-2) var(--space-3);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-size: var(--fs-md);
		text-transform: none;
		letter-spacing: 0;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}
	.row {
		display: flex;
		gap: var(--space-3);
		justify-content: space-between;
		margin-top: var(--space-2);
	}
	.primary {
		padding: var(--space-3) var(--space-4);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: 0;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		font: inherit;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.ghost {
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		cursor: pointer;
		font: inherit;
	}
	.err {
		color: var(--color-danger);
		margin: 0;
		font-size: var(--fs-sm);
	}
	.muted {
		color: var(--color-text-muted);
		margin: 0;
		font-size: var(--fs-sm);
	}
	.payment-mount {
		min-height: 260px;
		padding: var(--space-2) 0;
	}

	.cart {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		height: max-content;
		position: sticky;
		top: var(--space-4);
	}
	.cart h2 {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-3);
	}
	.lines {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.lines li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-2) 0;
		border-bottom: 1px dashed var(--color-border);
	}
	.name {
		font-weight: 600;
	}
	.sub {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.amt {
		font-weight: 600;
	}
	.remove {
		background: transparent;
		border: 0;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--fs-lg);
		line-height: 1;
		padding: 0 var(--space-1);
	}
	.remove:hover {
		color: var(--color-danger);
	}
	.totals {
		margin: var(--space-3) 0 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.totals div {
		display: flex;
		justify-content: space-between;
		font-size: var(--fs-sm);
		color: var(--color-text-muted);
	}
	.totals dt,
	.totals dd {
		margin: 0;
	}
	.totals .grand {
		font-size: var(--fs-md);
		color: var(--color-text);
		font-weight: 700;
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-2);
	}
	.legal {
		margin: var(--space-3) 0 0;
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
	}
</style>
