import { stripe } from '$lib/server/stripe';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export interface PlanSnapshot {
	priceId: string;
	productName: string;
	interval: 'month' | 'year' | 'one_time';
	amountCents: number;
	currency: string;
	lookupKey: string | null;
	nickname: string | null;
}

export const billingService = {
	async listPlans(): Promise<PlanSnapshot[]> {
		try {
			const prices = await stripe.listActivePrices();
			return prices.map((p) => {
				const product = typeof p.product === 'string' ? { id: p.product, name: p.product } : p.product;
				return {
					priceId: p.id,
					productName: product.name,
					interval: p.recurring ? p.recurring.interval : 'one_time',
					amountCents: p.unit_amount ?? 0,
					currency: p.currency.toUpperCase(),
					lookupKey: p.lookup_key ?? null,
					nickname: p.nickname ?? null
				};
			});
		} catch {
			return [];
		}
	},

	async startCheckout(
		caller: Caller,
		params: {
			priceId: string;
			successUrl: string;
			cancelUrl: string;
			email?: string;
			trialDays?: number;
		}
	): Promise<string> {
		const session = await stripe.createCheckoutSession({
			priceId: params.priceId,
			successUrl: params.successUrl,
			cancelUrl: params.cancelUrl,
			mode: 'subscription',
			customerEmail: params.email,
			clientReferenceId: caller.userId ?? undefined,
			allowPromotionCodes: true,
			trialDays: params.trialDays
		});
		if (!session.url) throw new Error('Stripe did not return a checkout URL.');
		await writeAudit(caller, {
			action: 'billing.checkout.start',
			targetKind: 'checkout_session',
			targetId: session.id,
			metadata: { priceId: params.priceId, trialDays: params.trialDays ?? null }
		});
		return session.url;
	},

	async openPortal(
		caller: Caller,
		params: { customerId: string; returnUrl: string }
	): Promise<string> {
		assertAuthenticated(caller);
		const session = await stripe.createPortalSession(params);
		await writeAudit(caller, {
			action: 'billing.portal.open',
			targetKind: 'portal_session',
			targetId: session.id,
			metadata: { customerId: params.customerId }
		});
		return session.url;
	}
};
