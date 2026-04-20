import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { AuthzError } from '$lib/server/authz/caller';
import { featureFlagsService, FeatureFlagError } from '$lib/server/services/feature-flags';
import type { Actions, PageServerLoad } from './$types';

const ROLE_VALUES = [
	'owner',
	'admin',
	'support',
	'content',
	'finance',
	'analyst',
	'read_only'
] as const;

const upsertSchema = z.object({
	key: z.string().min(1).max(80),
	description: z.string().max(500).default(''),
	enabled: z.boolean().default(false),
	enabledForRoles: z.array(z.enum(ROLE_VALUES)).default([]),
	enabledForUserIds: z.array(z.string().min(1)).default([])
});

export const load: PageServerLoad = async ({ locals }) => {
	const flags = await featureFlagsService.list(locals.caller);
	return { flags };
};

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const fd = await request.formData();
		const rolesRaw = fd.getAll('enabledForRoles').map((v) => v.toString());
		const userIdsRaw = (fd.get('enabledForUserIds')?.toString() ?? '')
			.split(/[,\s]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		const parsed = upsertSchema.safeParse({
			key: fd.get('key')?.toString() ?? '',
			description: fd.get('description')?.toString() ?? '',
			enabled: fd.get('enabled') === 'on',
			enabledForRoles: rolesRaw,
			enabledForUserIds: userIdsRaw
		});
		if (!parsed.success) {
			return fail(400, {
				message: parsed.error.issues[0]?.message ?? 'Invalid input.',
				key: fd.get('key')?.toString() ?? ''
			});
		}
		try {
			const row = await featureFlagsService.upsert(locals.caller, parsed.data);
			return { success: true, upsertedKey: row.key };
		} catch (err) {
			if (err instanceof AuthzError) return fail(403, { message: err.message });
			if (err instanceof FeatureFlagError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},

	delete: async ({ request, locals }) => {
		const fd = await request.formData();
		const key = fd.get('key')?.toString() ?? '';
		if (!key) return fail(400, { message: 'key required' });
		try {
			await featureFlagsService.delete(locals.caller, key);
			return { success: true, deletedKey: key };
		} catch (err) {
			if (err instanceof AuthzError) return fail(403, { message: err.message });
			if (err instanceof FeatureFlagError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	}
};
