import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthzError, AuthnError } from '$lib/server/authz/caller';
import { bunnyService, BunnyError } from '$lib/server/services/bunny';
import { coursesService, CourseError } from '$lib/server/services/courses';
import { MissingConfigError } from '$lib/server/services/settings';
import { log } from '$lib/server/log';

/**
 * Lesson-scoped signed URL. Differs from /api/video/[guid]/signed-url in two
 * ways: the guid is looked up from the lesson row server-side (clients never
 * need to know it), and access is granted to anyone with course enrollment,
 * not just active members. The lesson row is the source of truth for which
 * Bunny video backs the lesson.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const lessonRow = await coursesService.assertLessonAccess(locals.caller, params.id);
		if (!lessonRow.bunnyVideoGuid) {
			throw error(404, 'no video attached to this lesson');
		}
		const { url, expiresAt } = await bunnyService.signForPreAuthorizedCaller(
			lessonRow.bunnyVideoGuid
		);
		return json({ url, expiresAt });
	} catch (err) {
		if (err instanceof AuthnError) throw error(401, err.message);
		if (err instanceof AuthzError) throw error(403, err.message);
		if (err instanceof CourseError) throw error(err.httpStatus, err.message);
		if (err instanceof BunnyError) throw error(err.httpStatus, err.message);
		if (err instanceof MissingConfigError) {
			log.warn('lesson.signed_url.missing_config', { reason: err.message });
			throw error(503, 'video not configured');
		}
		if (err && typeof err === 'object' && 'status' in err) throw err;
		log.warn('lesson.signed_url.unexpected', {
			reason: err instanceof Error ? err.message : String(err)
		});
		throw error(500, 'could not sign url');
	}
};
