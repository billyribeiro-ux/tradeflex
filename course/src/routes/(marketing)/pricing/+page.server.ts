import type { PageServerLoad } from './$types';

export interface PlanCard {
	id: 'free' | 'monthly' | 'yearly';
	name: string;
	tagline: string;
	priceMonthly: number | null;
	priceYearly: number | null;
	savingsNote?: string;
	cta: { label: string; href: string };
	features: string[];
	badge?: string;
}

/**
 * Stripe is the source of truth for prices in production. Until Stripe is
 * wired in Modules 5–9, we read from a hard-coded snapshot here so the page
 * renders. Swapping this to read from the billingService is a 20-line change.
 */
export const load: PageServerLoad = () => {
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
			priceMonthly: 49,
			priceYearly: null,
			cta: { label: 'Start monthly', href: '/register?plan=monthly' },
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
			priceYearly: 399,
			savingsNote: 'Save $189 vs monthly',
			cta: { label: 'Start yearly', href: '/register?plan=yearly' },
			badge: 'Best value',
			features: [
				'Everything in Membership',
				'2 months free (effective $33/mo)',
				'Priority support response',
				'Early access to new course drops'
			]
		}
	];

	return { plans, source: 'static-snapshot' as const };
};
