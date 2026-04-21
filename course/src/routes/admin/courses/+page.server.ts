import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { coursesService, CourseError } from '$lib/server/services/courses';
import { assertRole } from '$lib/server/authz/caller';

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'content', 'analyst');
	const courses = await coursesService.listForAdmin(locals.caller);
	return { courses };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const fd = await request.formData();
		const slug = fd.get('slug')?.toString() ?? '';
		const title = fd.get('title')?.toString() ?? '';
		const tagline = fd.get('tagline')?.toString() ?? '';
		const priceDollars = Number(fd.get('priceDollars') ?? 0);
		try {
			const row = await coursesService.createCourse(locals.caller, {
				slug,
				title,
				tagline,
				priceCents: Math.round(priceDollars * 100)
			});
			return { created: true, id: row.id };
		} catch (err) {
			if (err instanceof CourseError) {
				return fail(err.httpStatus, {
					values: { slug, title, tagline, priceDollars },
					message: err.message
				});
			}
			throw err;
		}
	}
};
