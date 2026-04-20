import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { profileService } from '$lib/server/services/profile';
import type { Actions, PageServerLoad } from './$types';

const profileSchema = z.object({
	displayName: z.string().min(1, 'Display name is required').max(80),
	bio: z.string().max(500).optional().default(''),
	timezone: z.string().default('UTC'),
	theme: z.enum(['system', 'light', 'dark']).default('system'),
	marketingOptIn: z.boolean().default(false)
});

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.caller.userId) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	const profile = await profileService.getForCaller(locals.caller);
	return {
		profile,
		user: locals.user
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.caller.userId) return fail(401, { message: 'Not signed in.' });

		const fd = await request.formData();
		const raw = {
			displayName: fd.get('displayName')?.toString() ?? '',
			bio: fd.get('bio')?.toString() ?? '',
			timezone: fd.get('timezone')?.toString() || 'UTC',
			theme: fd.get('theme')?.toString() ?? 'system',
			marketingOptIn: fd.get('marketingOptIn') === 'on'
		};

		const parsed = profileSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				message: parsed.error.issues[0]?.message ?? 'Invalid input.'
			});
		}

		await profileService.upsertForCaller(locals.caller, parsed.data);
		return { success: true, savedAt: new Date().toISOString() };
	}
};
