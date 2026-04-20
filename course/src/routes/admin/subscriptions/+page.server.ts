import type { PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import { settingsService } from '$lib/server/services/settings';

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'finance', 'support', 'analyst');
	const stripeKey = await settingsService.get('STRIPE_SECRET_KEY');
	return { stripeConfigured: Boolean(stripeKey) };
};
