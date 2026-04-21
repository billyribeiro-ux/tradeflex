import type { PageServerLoad } from './$types';
import { cartService } from '$lib/server/services/cart';

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Stripe redirects with payment_intent_client_secret and redirect_status
	// in the query string. We clear the cart optimistically — the webhook is
	// the source of truth for fulfillment.
	cartService.clear(cookies);
	return {
		redirectStatus: url.searchParams.get('redirect_status'),
		paymentIntentId: url.searchParams.get('payment_intent')
	};
};
