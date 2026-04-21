import { stripe } from '$lib/server/stripe';
import type { Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';
import type { CartItem, CartSummary } from './cart';

export class CheckoutError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'CheckoutError';
		this.httpStatus = httpStatus;
	}
}

export interface CheckoutSessionPayload {
	clientSecret: string;
	kind: 'payment_intent' | 'subscription';
	subscriptionId?: string;
	paymentIntentId?: string;
	customerId: string;
}

function idem(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}

function recurringItems(summary: CartSummary): CartItem[] {
	return summary.items
		.filter((l) => l.interval !== 'one_time')
		.map((l) => ({ priceId: l.priceId, qty: l.qty }));
}

function oneTimeAmountCents(summary: CartSummary): number {
	return summary.items
		.filter((l) => l.interval === 'one_time')
		.reduce((s, l) => s + l.lineTotalCents, 0);
}

export const checkoutService = {
	async createSession(
		caller: Caller,
		params: {
			email: string;
			name?: string;
			summary: CartSummary;
		}
	): Promise<CheckoutSessionPayload> {
		if (params.summary.empty || params.summary.items.length === 0) {
			throw new CheckoutError('Your cart is empty.', 400);
		}
		const hasRecurring = params.summary.items.some((l) => l.interval !== 'one_time');
		const hasOneTime = params.summary.items.some((l) => l.interval === 'one_time');
		if (hasRecurring && hasOneTime) {
			throw new CheckoutError(
				'Mixed one-off + recurring items are not supported in a single checkout. Split into two orders.',
				400
			);
		}

		const customer = await stripe.createCustomer(
			{
				email: params.email,
				name: params.name,
				metadata: caller.userId ? { userId: caller.userId } : undefined
			},
			{ idempotencyKey: idem('cust') }
		);

		if (hasRecurring) {
			const recurring = recurringItems(params.summary);
			if (recurring.length === 0) throw new CheckoutError('No recurring items to charge.', 400);
			const sub = await stripe.createSubscription(
				{
					customerId: customer.id,
					priceIds: recurring.flatMap((r) => Array(r.qty).fill(r.priceId)),
					metadata: caller.userId ? { userId: caller.userId } : undefined
				},
				{ idempotencyKey: idem('sub') }
			);
			const intent = sub.latest_invoice?.payment_intent;
			const clientSecret = typeof intent === 'object' ? intent?.client_secret : null;
			if (!clientSecret) {
				throw new CheckoutError(
					'Stripe did not return a payment intent for the subscription.',
					502
				);
			}
			await writeAudit(caller, {
				action: 'checkout.session.create',
				targetKind: 'stripe_subscription',
				targetId: sub.id,
				metadata: {
					kind: 'subscription',
					customerId: customer.id,
					priceIds: recurring.map((r) => r.priceId)
				}
			});
			return {
				clientSecret,
				kind: 'subscription',
				subscriptionId: sub.id,
				customerId: customer.id
			};
		}

		const amount = oneTimeAmountCents(params.summary);
		if (amount <= 0) throw new CheckoutError('Cart total must be greater than zero.', 400);
		const pi = await stripe.createPaymentIntent(
			{
				amountCents: amount,
				currency: params.summary.currency,
				customerId: customer.id,
				receiptEmail: params.email,
				metadata: {
					...(caller.userId ? { userId: caller.userId } : {}),
					priceIds: params.summary.items.map((l) => l.priceId).join(',')
				}
			},
			{ idempotencyKey: idem('pi') }
		);
		if (!pi.client_secret) {
			throw new CheckoutError('Stripe did not return a client secret.', 502);
		}
		await writeAudit(caller, {
			action: 'checkout.session.create',
			targetKind: 'stripe_payment_intent',
			targetId: pi.id,
			metadata: {
				kind: 'payment_intent',
				customerId: customer.id,
				amountCents: amount,
				currency: params.summary.currency
			}
		});
		return {
			clientSecret: pi.client_secret,
			kind: 'payment_intent',
			paymentIntentId: pi.id,
			customerId: customer.id
		};
	}
};
