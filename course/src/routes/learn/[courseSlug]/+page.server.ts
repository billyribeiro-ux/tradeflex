import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { coursesService, CourseError } from '$lib/server/services/courses';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const { course, lessons, hasAccess } = await coursesService.getBySlug(
			locals.caller,
			params.courseSlug
		);
		return { course, lessons, hasAccess };
	} catch (err) {
		if (err instanceof CourseError) throw error(err.httpStatus, err.message);
		throw err;
	}
};
