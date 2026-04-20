import type { PageServerLoad } from './$types';
import { billingService } from '$lib/server/services/billing';

export interface PlanCard {
	id: 'free' | 'monthly' | 'yearly';
	name: string;
	tagline: string;
	priceMonthly: number | null;
	priceYearly: number | null;
	savingsNote?: string;
	cta: { label: string; href: string; priceId?: string };
	features: string[];
	badge?: string;
}

/**
 * If Stripe is configured and has prices with lookup_keys
 * `tradeflex_monthly` and `tradeflex_yearly`, we read amounts + price IDs
 * from Stripe. Otherwise we fall back to a hard-coded snapshot so the page
 * still renders on a fresh install.
 */
export const load: PageServerLoad = async ({ url }) => {
	const gate = url.searchParams.get('gate');
	const livePlans = await billingService.listPlans();
	const monthly = livePlans.find((p) => p.lookupKey === 'tradeflex_monthly');
	const yearly = livePlans.find((p) => p.lookupKey === 'tradeflex_yearly');
	const source: 'stripe' | 'static-snapshot' = monthly && yearly ? 'stripe' : 'static-snapshot';

	const plans: PlanCard[] = [
		{
			id: 'free',
			name: 'Free',
			tagline: 'Try the platform, read the blog, grab the ebook.',
			priceMonthly: 0,
			priceYearly: 0,
			cta: { label: 'Create account', href: '/register' },
			features: [
				'Read-only public alerts feed',
				'Free ebook: Options 101 Starter',
				'Weekly market-open email',
				'No credit card required'
			]
		},
		{
			id: 'monthly',
			name: 'Membership',
			tagline: 'Everything. Pay monthly.',
			priceMonthly: monthly ? Math.round(monthly.amountCents / 100) : 49,
			priceYearly: null,
			cta: {
				label: 'Start monthly',
				href: monthly ? '/api/billing/checkout' : '/register?plan=monthly',
				priceId: monthly?.priceId
			},
			features: [
				'Real-time alerts (options + equities)',
				'Full access to both courses',
				'macOS companion app',
				'Member-only Q&A threads',
				'Monthly performance reconciliation'
			]
		},
		{
			id: 'yearly',
			name: 'Membership — yearly',
			tagline: 'Everything. Save $189/year.',
			priceMonthly: null,
			priceYearly: yearly ? Math.round(yearly.amountCents / 100) : 399,
			savingsNote: 'Save $189 vs monthly',
			cta: {
				label: 'Start yearly',
				href: yearly ? '/api/billing/checkout' : '/register?plan=yearly',
				priceId: yearly?.priceId
			},
			badge: 'Best value',
			features: [
				'Everything in Membership',
				'2 months free (effective $33/mo)',
				'Priority support response',
				'Early access to new course drops'
			]
		}
	];

	return { plans, source, gate };
};
