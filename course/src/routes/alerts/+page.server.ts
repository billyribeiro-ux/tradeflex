import { redirect } from '@sveltejs/kit';
import { alertsService } from '$lib/server/services/alerts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.caller.userId) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	const alerts = await alertsService.listForMember(locals.caller, 50);
	return { alerts };
};
