import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { lesson } from '$lib/server/db/schema';
import { coursesService, CourseError } from '$lib/server/services/courses';
import { bunnyService, BunnyError } from '$lib/server/services/bunny';
import { MissingConfigError } from '$lib/server/services/settings';
import { assertRole } from '$lib/server/authz/caller';
import { writeAudit } from '$lib/server/services/audit';

/**
 * Issues a short-lived Bunny TUS credential so the browser can upload the
 * video bytes directly to Bunny — avoids Vercel's request-body ingress cap
 * (~4.5 MB) for large lessons.
 *
 * Flow:
 *   1. Role check + lesson exists.
 *   2. Create Bunny video record, generate TUS signature.
 *   3. Eagerly persist GUID on the lesson — if the browser then fails mid
 *      upload, admin can retry and the GUID gets replaced on next presign.
 *   4. Audit `lesson.video.direct_upload.presign`.
 */
export const POST: RequestHandler = async ({ params, locals, request }) => {
	try {
		assertRole(locals.caller, 'owner', 'admin', 'content');
	} catch {
		throw error(403, 'forbidden');
	}

	const [row] = await db
		.select({ id: lesson.id, title: lesson.title })
		.from(lesson)
		.where(eq(lesson.id, params.id))
		.limit(1);
	if (!row) throw error(404, 'lesson not found');

	let body: { title?: string } = {};
	try {
		body = (await request.json()) as { title?: string };
	} catch {
		// Empty body is fine — fall back to the lesson title below.
	}
	const title = (body.title && body.title.slice(0, 200)) || row.title;

	try {
		const ticket = await bunnyService.createDirectUploadTicket({ title });
		await coursesService.updateLesson(locals.caller, row.id, {
			bunnyVideoGuid: ticket.videoGuid
		});
		await writeAudit(locals.caller, {
			action: 'lesson.video.direct_upload.presign',
			targetKind: 'lesson',
			targetId: row.id,
			metadata: { guid: ticket.videoGuid, expires: ticket.authorizationExpire }
		});
		return json(ticket);
	} catch (err) {
		if (err instanceof BunnyError) throw error(err.httpStatus, err.message);
		if (err instanceof CourseError) throw error(err.httpStatus, err.message);
		if (err instanceof MissingConfigError) throw error(503, err.message);
		throw err;
	}
};
