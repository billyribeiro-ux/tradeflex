import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AuthzError, AuthnError } from '$lib/server/authz/caller';
import { bunnyService, BunnyError } from '$lib/server/services/bunny';
import { MissingConfigError } from '$lib/server/services/settings';
import { log } from '$lib/server/log';

export const GET: RequestHandler = async ({ params, locals }) => {
	const videoGuid = params.videoGuid;
	try {
		const { url, expiresAt } = await bunnyService.signedEmbedUrlFor(locals.caller, videoGuid);
		return json({ url, expiresAt });
	} catch (err) {
		if (err instanceof AuthnError) throw error(401, err.message);
		if (err instanceof AuthzError) throw error(403, err.message);
		if (err instanceof BunnyError) throw error(err.httpStatus, err.message);
		if (err instanceof MissingConfigError) {
			log.warn('bunny.signed_url.missing_config', { reason: err.message });
			throw error(503, 'video not configured');
		}
		log.warn('bunny.signed_url.unexpected', {
			reason: err instanceof Error ? err.message : String(err)
		});
		throw error(500, 'could not sign url');
	}
};
