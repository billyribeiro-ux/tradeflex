import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		const next = url.searchParams.get('next') ?? '/account';
		throw redirect(303, next);
	}
	return {
		next: url.searchParams.get('next') ?? '/account'
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';
		const next = form.get('next')?.toString() || '/account';

		if (!email || !password) {
			return fail(400, { email, message: 'Email and password are required.' });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password }
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { email, message: err.message || 'Sign-in failed.' });
			}
			return fail(500, { email, message: 'Unexpected error.' });
		}

		throw redirect(303, next);
	},
	github: async () => {
		const result = await auth.api.signInSocial({
			body: { provider: 'github', callbackURL: '/account' }
		});
		if (result.url) throw redirect(303, result.url);
		return fail(400, { message: 'GitHub sign-in failed.' });
	}
};
