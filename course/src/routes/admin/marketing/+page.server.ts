import { z } from 'zod';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { contactsService } from '$lib/server/services/contacts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
	const pageSize = 50;
	const contacts = await contactsService.list(locals.caller, {
		limit: pageSize,
		offset: (page - 1) * pageSize
	});
	return { contacts, page, pageSize };
};

const idSchema = z.object({ id: z.string().min(1) });

export const actions: Actions = {
	unsubscribe: async ({ request, locals }) => {
		const form = await request.formData();
		const parsed = idSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { error: 'invalid' });
		await contactsService.unsubscribe(locals.caller, parsed.data.id);
		return { ok: true };
	}
};
