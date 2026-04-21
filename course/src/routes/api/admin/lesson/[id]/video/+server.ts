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
 * Streams a video upload straight through to Bunny Stream:
 *   1. Load the lesson, confirm staff role.
 *   2. Create a Bunny video record using the lesson title as the title.
 *   3. PUT the request body to Bunny as the video bytes.
 *   4. Persist the resulting GUID on the lesson row via coursesService.updateLesson.
 *
 * The request body is streamed through — the bytes never sit in memory on
 * this server beyond an HTTP chunk.
 */
export const POST: RequestHandler = async ({ request, params, locals, url }) => {
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

	const contentType = request.headers.get('content-type') ?? 'application/octet-stream';
	const explicitTitle = url.searchParams.get('title');
	const title = (explicitTitle && explicitTitle.slice(0, 200)) || row.title;

	try {
		const { guid } = await bunnyService.createVideoRecord({ title });

		if (!request.body) throw error(400, 'request body is empty');
		await bunnyService.uploadVideoStream(guid, request.body, contentType);

		await coursesService.updateLesson(locals.caller, row.id, { bunnyVideoGuid: guid });
		await writeAudit(locals.caller, {
			action: 'lesson.video.upload',
			targetKind: 'lesson',
			targetId: row.id,
			metadata: { guid, contentType }
		});

		return json({ guid });
	} catch (err) {
		if (err instanceof BunnyError) throw error(err.httpStatus, err.message);
		if (err instanceof CourseError) throw error(err.httpStatus, err.message);
		if (err instanceof MissingConfigError) throw error(503, err.message);
		throw err;
	}
};
