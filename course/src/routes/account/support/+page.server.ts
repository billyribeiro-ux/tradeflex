import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assertAuthenticated } from '$lib/server/authz/caller';
import { supportService, SupportError, TICKET_CATEGORIES } from '$lib/server/services/support';

export const load: PageServerLoad = async ({ locals }) => {
	assertAuthenticated(locals.caller);
	const tickets = await supportService.listForCaller(locals.caller);
	return { tickets };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		assertAuthenticated(locals.caller);
		const form = await request.formData();
		const subject = String(form.get('subject') ?? '');
		const body = String(form.get('body') ?? '');
		const rawCategory = String(form.get('category') ?? 'other');
		const category = (TICKET_CATEGORIES as readonly string[]).includes(rawCategory)
			? (rawCategory as (typeof TICKET_CATEGORIES)[number])
			: 'other';

		try {
			const row = await supportService.create(locals.caller, { subject, body, category });
			throw redirect(303, `/account/support/${row.id}`);
		} catch (err) {
			if (err instanceof SupportError) {
				return fail(err.httpStatus, { error: err.message, subject, body, category });
			}
			throw err;
		}
	}
};
