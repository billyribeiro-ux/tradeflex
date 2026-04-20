import type { PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import { settingsService } from '$lib/server/services/settings';

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support');
	const resendConfigured = Boolean(await settingsService.get('RESEND_API_KEY'));
	const fromAddress = await settingsService.get('RESEND_FROM');
	return { resendConfigured, fromAddress: fromAddress ?? null };
};
