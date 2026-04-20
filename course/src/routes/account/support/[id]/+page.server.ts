import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assertAuthenticated } from '$lib/server/authz/caller';
import { supportService, SupportError } from '$lib/server/services/support';

export const load: PageServerLoad = async ({ locals, params }) => {
	assertAuthenticated(locals.caller);
	try {
		return await supportService.getWithMessages(locals.caller, params.id);
	} catch (err) {
		if (err instanceof SupportError) throw error(err.httpStatus, err.message);
		throw err;
	}
};

export const actions: Actions = {
	reply: async ({ request, locals, params }) => {
		assertAuthenticated(locals.caller);
		const form = await request.formData();
		const body = String(form.get('body') ?? '');
		try {
			await supportService.addMessage(locals.caller, { ticketId: params.id, body });
		} catch (err) {
			if (err instanceof SupportError) return fail(err.httpStatus, { error: err.message, body });
			throw err;
		}
		return { success: true };
	}
};
