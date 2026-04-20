import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import {
	supportService,
	SupportError,
	TICKET_PRIORITIES,
	TICKET_STATUSES,
	type TicketPriority,
	type TicketStatus
} from '$lib/server/services/support';

export const load: PageServerLoad = async ({ locals, params }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support');
	try {
		return await supportService.getWithMessages(locals.caller, params.id);
	} catch (err) {
		if (err instanceof SupportError) throw error(err.httpStatus, err.message);
		throw err;
	}
};

export const actions: Actions = {
	reply: async ({ request, locals, params }) => {
		assertRole(locals.caller, 'owner', 'admin', 'support');
		const form = await request.formData();
		const body = String(form.get('body') ?? '');
		const visibility = form.get('visibility') === 'internal' ? 'internal' : 'public';
		try {
			await supportService.addMessage(locals.caller, {
				ticketId: params.id,
				body,
				visibility
			});
		} catch (err) {
			if (err instanceof SupportError) return fail(err.httpStatus, { error: err.message, body });
			throw err;
		}
		return { success: true };
	},

	setStatus: async ({ request, locals, params }) => {
		assertRole(locals.caller, 'owner', 'admin', 'support');
		const form = await request.formData();
		const status = String(form.get('status') ?? '');
		if (!(TICKET_STATUSES as readonly string[]).includes(status)) {
			return fail(400, { error: 'invalid status' });
		}
		await supportService.setStatus(locals.caller, {
			ticketId: params.id,
			status: status as TicketStatus
		});
		return { success: true };
	},

	setPriority: async ({ request, locals, params }) => {
		assertRole(locals.caller, 'owner', 'admin', 'support');
		const form = await request.formData();
		const priority = String(form.get('priority') ?? '');
		if (!(TICKET_PRIORITIES as readonly string[]).includes(priority)) {
			return fail(400, { error: 'invalid priority' });
		}
		await supportService.setPriority(locals.caller, {
			ticketId: params.id,
			priority: priority as TicketPriority
		});
		return { success: true };
	}
};
