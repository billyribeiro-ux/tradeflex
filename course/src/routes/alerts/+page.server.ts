import { redirect } from '@sveltejs/kit';
import { alertsService } from '$lib/server/services/alerts';
import { subscriptionsService } from '$lib/server/services/subscriptions';
import type { PageServerLoad } from './$types';

const STAFF_ROLES = new Set(['owner', 'admin', 'content', 'support']);

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.caller.userId) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	const isStaff = locals.caller.roles.some((r) => STAFF_ROLES.has(r));
	if (!isStaff) {
		const entitled = await subscriptionsService.hasActiveEntitlement(locals.caller);
		if (!entitled) {
			throw redirect(303, '/pricing?gate=alerts');
		}
	}
	const alerts = await alertsService.listForMember(locals.caller, 50);
	return { alerts };
};
