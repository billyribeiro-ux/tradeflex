import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, '/account');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';
		const name = form.get('name')?.toString().trim() ?? '';

		if (!email || !password || !name) {
			return fail(400, { email, name, message: 'Name, email, and password are required.' });
		}
		if (password.length < 10) {
			return fail(400, { email, name, message: 'Password must be at least 10 characters.' });
		}

		try {
			await auth.api.signUpEmail({
				body: { email, password, name }
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { email, name, message: err.message || 'Registration failed.' });
			}
			return fail(500, { email, name, message: 'Unexpected error.' });
		}

		throw redirect(303, '/account');
	}
};
