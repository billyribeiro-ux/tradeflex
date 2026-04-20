import { z } from 'zod';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { membersService } from '$lib/server/services/members';

const roles = ['owner', 'admin', 'support', 'content', 'finance', 'analyst', 'read_only'] as const;
const mutationSchema = z.object({
	userId: z.string().min(1),
	role: z.enum(roles)
});

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
	const pageSize = 50;
	const members = await membersService.list(locals.caller, {
		limit: pageSize,
		offset: (page - 1) * pageSize
	});
	return { members, page, pageSize };
};

export const actions: Actions = {
	grant: async ({ request, locals }) => {
		const form = await request.formData();
		const parsed = mutationSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { error: 'invalid input' });
		await membersService.grantRole(locals.caller, parsed.data.userId, parsed.data.role);
		return { ok: true };
	},
	revoke: async ({ request, locals }) => {
		const form = await request.formData();
		const parsed = mutationSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { error: 'invalid input' });
		await membersService.revokeRole(locals.caller, parsed.data.userId, parsed.data.role);
		return { ok: true };
	}
};
