import { z } from 'zod';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { membersService } from '$lib/server/services/members';
import {
	impersonationService,
	IMPERSONATION_COOKIE,
	IMPERSONATION_TTL_MS,
	ImpersonationError
} from '$lib/server/services/impersonation';
import { AuthzError, AuthnError } from '$lib/server/authz/caller';

const impersonateSchema = z.object({
	targetUserId: z.string().min(1),
	reason: z.string().min(5)
});

const roles = ['owner', 'admin', 'support', 'content', 'finance', 'analyst', 'read_only'] as const;
const mutationSchema = z.object({
	userId: z.string().min(1),
	role: z.enum(roles)
});

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
	const pageSize = 50;
	const q = url.searchParams.get('q')?.trim() ?? '';
	const members = await membersService.list(locals.caller, {
		limit: pageSize,
		offset: (page - 1) * pageSize,
		q: q || undefined
	});
	return { members, page, pageSize, q };
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
	},
	impersonate: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const parsed = impersonateSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) return fail(400, { error: 'invalid input' });
		try {
			const row = await impersonationService.start(locals.caller, parsed.data);
			cookies.set(IMPERSONATION_COOKIE, row.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: Math.floor(IMPERSONATION_TTL_MS / 1000)
			});
			return { ok: true, impersonating: row.targetUserId };
		} catch (err) {
			if (err instanceof AuthnError) return fail(401, { error: err.message });
			if (err instanceof AuthzError) return fail(403, { error: err.message });
			if (err instanceof ImpersonationError) return fail(err.httpStatus, { error: err.message });
			throw err;
		}
	}
};
