import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { course, courseEnrollment, lesson } from '$lib/server/db/schema';
import { assertAuthenticated, assertRole, AuthzError, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';
import { subscriptionsService } from './subscriptions';

export type CourseRow = typeof course.$inferSelect;
export type LessonRow = typeof lesson.$inferSelect;
export type EnrollmentRow = typeof courseEnrollment.$inferSelect;

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const LESSON_STATUSES = ['draft', 'published'] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STAFF_ROLES = ['owner', 'admin', 'content'] as const;

export class CourseError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'CourseError';
		this.httpStatus = httpStatus;
	}
}

function isStaff(caller: Caller): boolean {
	return caller.roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
}

function assertSlug(slug: string) {
	if (!SLUG_RE.test(slug)) throw new CourseError('slug must be lowercase kebab-case');
}

async function assertCourseSlugFree(slug: string, exceptId?: string) {
	const existing = await db.select({ id: course.id }).from(course).where(eq(course.slug, slug));
	if (existing.some((r) => r.id !== exceptId)) {
		throw new CourseError('course slug already taken');
	}
}

async function assertLessonSlugFree(courseId: string, slug: string, exceptId?: string) {
	const existing = await db
		.select({ id: lesson.id })
		.from(lesson)
		.where(and(eq(lesson.courseId, courseId), eq(lesson.slug, slug)));
	if (existing.some((r) => r.id !== exceptId)) {
		throw new CourseError('lesson slug already taken in this course');
	}
}

export const coursesService = {
	async listPublic(): Promise<CourseRow[]> {
		return db
			.select()
			.from(course)
			.where(eq(course.status, 'published'))
			.orderBy(asc(course.position), desc(course.publishedAt));
	},

	async listForAdmin(caller: Caller): Promise<CourseRow[]> {
		assertRole(caller, 'owner', 'admin', 'content', 'analyst');
		return db.select().from(course).orderBy(asc(course.position), desc(course.updatedAt));
	},

	async getBySlug(
		caller: Caller,
		slug: string
	): Promise<{ course: CourseRow; lessons: LessonRow[]; hasAccess: boolean }> {
		const [c] = await db.select().from(course).where(eq(course.slug, slug)).limit(1);
		if (!c) throw new CourseError('course not found', 404);
		const staff = isStaff(caller);
		if (c.status !== 'published' && !staff) throw new CourseError('course not found', 404);

		const hasAccess = staff ? true : await this.checkAccess(caller, c.id);
		const whereLessons = staff
			? eq(lesson.courseId, c.id)
			: and(eq(lesson.courseId, c.id), eq(lesson.status, 'published'));
		const lessons = await db
			.select()
			.from(lesson)
			.where(whereLessons)
			.orderBy(asc(lesson.position), asc(lesson.createdAt));

		return { course: c, lessons, hasAccess };
	},

	async getLesson(
		caller: Caller,
		courseSlug: string,
		lessonSlug: string
	): Promise<{ course: CourseRow; lesson: LessonRow; hasAccess: boolean }> {
		const [c] = await db.select().from(course).where(eq(course.slug, courseSlug)).limit(1);
		if (!c) throw new CourseError('course not found', 404);
		const staff = isStaff(caller);
		if (c.status !== 'published' && !staff) throw new CourseError('course not found', 404);

		const [l] = await db
			.select()
			.from(lesson)
			.where(and(eq(lesson.courseId, c.id), eq(lesson.slug, lessonSlug)))
			.limit(1);
		if (!l) throw new CourseError('lesson not found', 404);
		if (l.status !== 'published' && !staff) throw new CourseError('lesson not found', 404);

		const hasAccess = staff ? true : await this.checkAccess(caller, c.id);
		return { course: c, lesson: l, hasAccess };
	},

	/**
	 * Access = active Trade Flex membership *or* an explicit enrollment row
	 * (course purchase / admin grant). Admin-granted enrollments may carry
	 * `accessExpiresAt`; unset means lifetime.
	 */
	async checkAccess(caller: Caller, courseId: string): Promise<boolean> {
		if (!caller.userId) return false;
		const entitled = await subscriptionsService.hasActiveEntitlement(caller);
		if (entitled) return true;

		const rows = await db
			.select({
				accessExpiresAt: courseEnrollment.accessExpiresAt
			})
			.from(courseEnrollment)
			.where(
				and(eq(courseEnrollment.userId, caller.userId), eq(courseEnrollment.courseId, courseId))
			)
			.limit(1);
		if (rows.length === 0) return false;
		const expires = rows[0].accessExpiresAt;
		return !expires || expires > new Date();
	},

	async listEnrollmentsForCaller(caller: Caller): Promise<CourseRow[]> {
		assertAuthenticated(caller);
		const enrollments = await db
			.select({ courseId: courseEnrollment.courseId })
			.from(courseEnrollment)
			.where(eq(courseEnrollment.userId, caller.userId));
		if (enrollments.length === 0) return [];
		return db
			.select()
			.from(course)
			.where(
				inArray(
					course.id,
					enrollments.map((e) => e.courseId)
				)
			);
	},

	async createCourse(
		caller: Caller,
		params: {
			slug: string;
			title: string;
			tagline?: string;
			summary?: string;
			priceCents?: number;
		}
	): Promise<CourseRow> {
		assertRole(caller, 'owner', 'admin', 'content');
		const slug = params.slug.trim().toLowerCase();
		assertSlug(slug);
		if (params.title.trim().length < 3) throw new CourseError('title too short');
		await assertCourseSlugFree(slug);

		const id = crypto.randomUUID();
		const [row] = await db
			.insert(course)
			.values({
				id,
				slug,
				title: params.title.trim(),
				tagline: params.tagline?.trim() ?? '',
				summary: params.summary?.trim() ?? '',
				priceCents: Math.max(0, params.priceCents ?? 0),
				status: 'draft'
			})
			.returning();
		await writeAudit(caller, {
			action: 'course.create',
			targetKind: 'course',
			targetId: id,
			metadata: { slug, title: row.title }
		});
		return row;
	},

	async updateCourse(
		caller: Caller,
		id: string,
		patch: Partial<{
			slug: string;
			title: string;
			tagline: string;
			summary: string;
			priceCents: number;
			status: CourseStatus;
			position: number;
			coverBlobKey: string | null;
		}>
	): Promise<CourseRow> {
		assertRole(caller, 'owner', 'admin', 'content');
		const [current] = await db.select().from(course).where(eq(course.id, id)).limit(1);
		if (!current) throw new CourseError('course not found', 404);

		const update: Partial<typeof course.$inferInsert> = { updatedAt: new Date() };
		if (patch.slug !== undefined) {
			const slug = patch.slug.trim().toLowerCase();
			assertSlug(slug);
			await assertCourseSlugFree(slug, id);
			update.slug = slug;
		}
		if (patch.title !== undefined) update.title = patch.title.trim();
		if (patch.tagline !== undefined) update.tagline = patch.tagline.trim();
		if (patch.summary !== undefined) update.summary = patch.summary.trim();
		if (patch.priceCents !== undefined) update.priceCents = Math.max(0, patch.priceCents);
		if (patch.position !== undefined) update.position = patch.position;
		if (patch.coverBlobKey !== undefined) update.coverBlobKey = patch.coverBlobKey;
		if (patch.status !== undefined) {
			if (!COURSE_STATUSES.includes(patch.status)) throw new CourseError('invalid status');
			update.status = patch.status;
			if (patch.status === 'published' && !current.publishedAt) {
				update.publishedAt = new Date();
			}
		}

		const [row] = await db.update(course).set(update).where(eq(course.id, id)).returning();
		await writeAudit(caller, {
			action: 'course.update',
			targetKind: 'course',
			targetId: id,
			metadata: patch as Record<string, unknown>
		});
		return row;
	},

	async deleteCourse(caller: Caller, id: string): Promise<void> {
		assertRole(caller, 'owner', 'admin');
		const [current] = await db.select().from(course).where(eq(course.id, id)).limit(1);
		if (!current) throw new CourseError('course not found', 404);
		await db.delete(course).where(eq(course.id, id));
		await writeAudit(caller, {
			action: 'course.delete',
			targetKind: 'course',
			targetId: id,
			metadata: { slug: current.slug, title: current.title }
		});
	},

	async createLesson(
		caller: Caller,
		params: {
			courseId: string;
			slug: string;
			title: string;
			summary?: string;
			bunnyVideoGuid?: string | null;
			durationSeconds?: number;
			position?: number;
		}
	): Promise<LessonRow> {
		assertRole(caller, 'owner', 'admin', 'content');
		const slug = params.slug.trim().toLowerCase();
		assertSlug(slug);
		if (params.title.trim().length < 3) throw new CourseError('title too short');

		const [parent] = await db
			.select({ id: course.id })
			.from(course)
			.where(eq(course.id, params.courseId))
			.limit(1);
		if (!parent) throw new CourseError('course not found', 404);

		await assertLessonSlugFree(params.courseId, slug);

		// New lessons append to the end by default — operator can reorder later.
		let position = params.position;
		if (position === undefined) {
			const [last] = await db
				.select({ position: lesson.position })
				.from(lesson)
				.where(eq(lesson.courseId, params.courseId))
				.orderBy(desc(lesson.position))
				.limit(1);
			position = (last?.position ?? -1) + 1;
		}

		const id = crypto.randomUUID();
		const [row] = await db
			.insert(lesson)
			.values({
				id,
				courseId: params.courseId,
				slug,
				title: params.title.trim(),
				summary: params.summary?.trim() ?? '',
				bunnyVideoGuid: params.bunnyVideoGuid ?? null,
				durationSeconds: Math.max(0, params.durationSeconds ?? 0),
				position,
				status: 'draft'
			})
			.returning();
		await writeAudit(caller, {
			action: 'lesson.create',
			targetKind: 'lesson',
			targetId: id,
			metadata: { courseId: params.courseId, slug }
		});
		return row;
	},

	async updateLesson(
		caller: Caller,
		id: string,
		patch: Partial<{
			slug: string;
			title: string;
			summary: string;
			bunnyVideoGuid: string | null;
			durationSeconds: number;
			position: number;
			status: LessonStatus;
		}>
	): Promise<LessonRow> {
		assertRole(caller, 'owner', 'admin', 'content');
		const [current] = await db.select().from(lesson).where(eq(lesson.id, id)).limit(1);
		if (!current) throw new CourseError('lesson not found', 404);

		const update: Partial<typeof lesson.$inferInsert> = { updatedAt: new Date() };
		if (patch.slug !== undefined) {
			const slug = patch.slug.trim().toLowerCase();
			assertSlug(slug);
			await assertLessonSlugFree(current.courseId, slug, id);
			update.slug = slug;
		}
		if (patch.title !== undefined) update.title = patch.title.trim();
		if (patch.summary !== undefined) update.summary = patch.summary.trim();
		if (patch.bunnyVideoGuid !== undefined) update.bunnyVideoGuid = patch.bunnyVideoGuid;
		if (patch.durationSeconds !== undefined) {
			update.durationSeconds = Math.max(0, patch.durationSeconds);
		}
		if (patch.position !== undefined) update.position = patch.position;
		if (patch.status !== undefined) {
			if (!LESSON_STATUSES.includes(patch.status)) throw new CourseError('invalid status');
			update.status = patch.status;
		}

		const [row] = await db.update(lesson).set(update).where(eq(lesson.id, id)).returning();
		await writeAudit(caller, {
			action: 'lesson.update',
			targetKind: 'lesson',
			targetId: id,
			metadata: patch as Record<string, unknown>
		});
		return row;
	},

	async deleteLesson(caller: Caller, id: string): Promise<void> {
		assertRole(caller, 'owner', 'admin', 'content');
		const [current] = await db.select().from(lesson).where(eq(lesson.id, id)).limit(1);
		if (!current) throw new CourseError('lesson not found', 404);
		await db.delete(lesson).where(eq(lesson.id, id));
		await writeAudit(caller, {
			action: 'lesson.delete',
			targetKind: 'lesson',
			targetId: id,
			metadata: { courseId: current.courseId, slug: current.slug }
		});
	},

	async grantEnrollment(
		caller: Caller,
		params: { userId: string; courseId: string; source?: string; accessExpiresAt?: Date | null }
	): Promise<EnrollmentRow> {
		assertRole(caller, 'owner', 'admin');
		// Idempotent — a second grant just returns the existing row rather than
		// blowing up with a duplicate-key error.
		const existing = await db
			.select()
			.from(courseEnrollment)
			.where(
				and(
					eq(courseEnrollment.userId, params.userId),
					eq(courseEnrollment.courseId, params.courseId)
				)
			)
			.limit(1);
		if (existing.length > 0) return existing[0];

		const id = crypto.randomUUID();
		const [row] = await db
			.insert(courseEnrollment)
			.values({
				id,
				userId: params.userId,
				courseId: params.courseId,
				source: params.source ?? 'admin_grant',
				grantedByUserId: caller.userId ?? null,
				accessExpiresAt: params.accessExpiresAt ?? null
			})
			.returning();
		await writeAudit(caller, {
			action: 'course.enroll.grant',
			targetKind: 'course_enrollment',
			targetId: id,
			metadata: {
				courseId: params.courseId,
				userId: params.userId,
				source: row.source
			}
		});
		return row;
	},

	async revokeEnrollment(caller: Caller, id: string): Promise<void> {
		assertRole(caller, 'owner', 'admin');
		const [current] = await db
			.select()
			.from(courseEnrollment)
			.where(eq(courseEnrollment.id, id))
			.limit(1);
		if (!current) throw new CourseError('enrollment not found', 404);
		await db.delete(courseEnrollment).where(eq(courseEnrollment.id, id));
		await writeAudit(caller, {
			action: 'course.enroll.revoke',
			targetKind: 'course_enrollment',
			targetId: id,
			metadata: { courseId: current.courseId, userId: current.userId }
		});
	},

	/**
	 * Signed-URL helper used by the lesson video endpoint. Enforces that the
	 * caller has access to the owning course before delegating to bunnyService.
	 * Throws AuthzError on no-access so the endpoint can map it to 403.
	 */
	async assertLessonAccess(caller: Caller, lessonId: string): Promise<LessonRow> {
		assertAuthenticated(caller);
		const [l] = await db.select().from(lesson).where(eq(lesson.id, lessonId)).limit(1);
		if (!l) throw new CourseError('lesson not found', 404);
		if (l.status !== 'published' && !isStaff(caller)) {
			throw new CourseError('lesson not found', 404);
		}
		const ok = await this.checkAccess(caller, l.courseId);
		if (!ok) throw new AuthzError('no access to this course');
		return l;
	}
};
