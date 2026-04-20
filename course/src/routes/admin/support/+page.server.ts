import type { PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import { supportService, TICKET_STATUSES, type TicketStatus } from '$lib/server/services/support';

export const load: PageServerLoad = async ({ locals, url }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support');
	const statusParam = url.searchParams.get('status');
	const status =
		statusParam && (TICKET_STATUSES as readonly string[]).includes(statusParam)
			? (statusParam as TicketStatus)
			: undefined;
	const tickets = await supportService.listForAdmin(locals.caller, { status });
	return { tickets, filter: status ?? 'all' };
};
