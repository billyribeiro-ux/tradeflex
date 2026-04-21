import { error, fail, redirect } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { course, courseEnrollment, lesson, user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { coursesService, CourseError } from '$lib/server/services/courses';
import { assertRole } from '$lib/server/authz/caller';

export const load: PageServerLoad = async ({ params, locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'content', 'analyst');
	const [row] = await db.select().from(course).where(eq(course.id, params.id)).limit(1);
	if (!row) throw error(404, 'course not found');

	const lessons = await db
		.select()
		.from(lesson)
		.where(eq(lesson.courseId, row.id))
		.orderBy(asc(lesson.position), asc(lesson.createdAt));

	const enrollments = await db
		.select({
			id: courseEnrollment.id,
			userId: courseEnrollment.userId,
			source: courseEnrollment.source,
			grantedAt: courseEnrollment.grantedAt,
			accessExpiresAt: courseEnrollment.accessExpiresAt,
			email: user.email
		})
		.from(courseEnrollment)
		.leftJoin(user, eq(courseEnrollment.userId, user.id))
		.where(eq(courseEnrollment.courseId, row.id))
		.orderBy(desc(courseEnrollment.grantedAt))
		.limit(200);

	return { course: row, lessons, enrollments };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const fd = await request.formData();
		try {
			await coursesService.updateCourse(locals.caller, params.id, {
				slug: fd.get('slug')?.toString(),
				title: fd.get('title')?.toString(),
				tagline: fd.get('tagline')?.toString(),
				summary: fd.get('summary')?.toString(),
				priceCents: fd.get('priceDollars')
					? Math.round(Number(fd.get('priceDollars')) * 100)
					: undefined
			});
			return { updated: true };
		} catch (err) {
			if (err instanceof CourseError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},
	publish: async ({ params, locals }) => {
		try {
			await coursesService.updateCourse(locals.caller, params.id, { status: 'published' });
			return { published: true };
		} catch (err) {
			if (err instanceof CourseError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},
	unpublish: async ({ params, locals }) => {
		await coursesService.updateCourse(locals.caller, params.id, { status: 'draft' });
		return { unpublished: true };
	},
	archive: async ({ params, locals }) => {
		await coursesService.updateCourse(locals.caller, params.id, { status: 'archived' });
		return { archived: true };
	},
	deleteCourse: async ({ params, locals }) => {
		try {
			await coursesService.deleteCourse(locals.caller, params.id);
		} catch (err) {
			if (err instanceof CourseError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
		throw redirect(303, '/admin/courses');
	},
	createLesson: async ({ request, params, locals }) => {
		const fd = await request.formData();
		try {
			await coursesService.createLesson(locals.caller, {
				courseId: params.id,
				slug: fd.get('slug')?.toString() ?? '',
				title: fd.get('title')?.toString() ?? '',
				summary: fd.get('summary')?.toString() ?? '',
				bunnyVideoGuid: fd.get('bunnyVideoGuid')?.toString() || null,
				durationSeconds: Number(fd.get('durationSeconds') ?? 0)
			});
			return { lessonCreated: true };
		} catch (err) {
			if (err instanceof CourseError)
				return fail(err.httpStatus, { message: err.message, lessonForm: true });
			throw err;
		}
	},
	updateLesson: async ({ request, locals }) => {
		const fd = await request.formData();
		const id = fd.get('lessonId')?.toString();
		if (!id) return fail(400, { message: 'missing lesson id' });
		try {
			await coursesService.updateLesson(locals.caller, id, {
				slug: fd.get('slug')?.toString(),
				title: fd.get('title')?.toString(),
				summary: fd.get('summary')?.toString(),
				bunnyVideoGuid: fd.get('bunnyVideoGuid')?.toString() || null,
				durationSeconds: fd.get('durationSeconds') ? Number(fd.get('durationSeconds')) : undefined,
				position: fd.get('position') ? Number(fd.get('position')) : undefined
			});
			return { lessonUpdated: true };
		} catch (err) {
			if (err instanceof CourseError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},
	publishLesson: async ({ request, locals }) => {
		const id = (await request.formData()).get('lessonId')?.toString();
		if (!id) return fail(400, { message: 'missing lesson id' });
		await coursesService.updateLesson(locals.caller, id, { status: 'published' });
		return { lessonPublished: true };
	},
	unpublishLesson: async ({ request, locals }) => {
		const id = (await request.formData()).get('lessonId')?.toString();
		if (!id) return fail(400, { message: 'missing lesson id' });
		await coursesService.updateLesson(locals.caller, id, { status: 'draft' });
		return { lessonUnpublished: true };
	},
	deleteLesson: async ({ request, locals }) => {
		const id = (await request.formData()).get('lessonId')?.toString();
		if (!id) return fail(400, { message: 'missing lesson id' });
		try {
			await coursesService.deleteLesson(locals.caller, id);
		} catch (err) {
			if (err instanceof CourseError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
		return { lessonDeleted: true };
	},
	grantEnrollment: async ({ request, params, locals }) => {
		const fd = await request.formData();
		const email = fd.get('email')?.toString().trim().toLowerCase();
		if (!email) return fail(400, { message: 'email required', enrollmentForm: true });
		const [target] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);
		if (!target) return fail(404, { message: 'no user with that email', enrollmentForm: true });
		try {
			await coursesService.grantEnrollment(locals.caller, {
				userId: target.id,
				courseId: params.id,
				source: 'admin_grant'
			});
			return { enrollmentGranted: true };
		} catch (err) {
			if (err instanceof CourseError)
				return fail(err.httpStatus, { message: err.message, enrollmentForm: true });
			throw err;
		}
	},
	revokeEnrollment: async ({ request, locals }) => {
		const id = (await request.formData()).get('enrollmentId')?.toString();
		if (!id) return fail(400, { message: 'missing enrollment id' });
		try {
			await coursesService.revokeEnrollment(locals.caller, id);
		} catch (err) {
			if (err instanceof CourseError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
		return { enrollmentRevoked: true };
	}
};
