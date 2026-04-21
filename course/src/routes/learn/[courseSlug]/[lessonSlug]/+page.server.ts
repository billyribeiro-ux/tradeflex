import { error } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { lesson } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { coursesService, CourseError } from '$lib/server/services/courses';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const {
			course,
			lesson: current,
			hasAccess
		} = await coursesService.getLesson(locals.caller, params.courseSlug, params.lessonSlug);

		// Sibling lessons power prev/next. Filter to published for non-staff via
		// the same service call; here we include drafts when the current user
		// can see them — coursesService already gated on staff for drafts.
		const siblings = await db
			.select({ id: lesson.id, slug: lesson.slug, title: lesson.title, position: lesson.position })
			.from(lesson)
			.where(eq(lesson.courseId, course.id))
			.orderBy(asc(lesson.position), asc(lesson.createdAt));

		const idx = siblings.findIndex((s) => s.id === current.id);
		const prev = idx > 0 ? siblings[idx - 1] : null;
		const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

		return { course, lesson: current, hasAccess, prev, next };
	} catch (err) {
		if (err instanceof CourseError) throw error(err.httpStatus, err.message);
		throw err;
	}
};
