import { createHash } from 'node:crypto';
import { settingsService } from './settings';
import { assertAuthenticated, AuthzError, type Caller } from '$lib/server/authz/caller';
import { subscriptionsService } from './subscriptions';

export class BunnyError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'BunnyError';
		this.httpStatus = httpStatus;
	}
}

const VIDEO_GUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const DEFAULT_TTL_SECONDS = 60 * 60 * 4; // 4h — long enough to finish a lesson.

interface SignArgs {
	videoGuid: string;
	libraryId: string;
	securityKey: string;
	expires: number;
}

/**
 * Generates a Bunny Stream token-authenticated embed URL.
 *
 * Bunny's library-level token auth expects:
 *   token = sha256_hex(securityKey + videoGuid + expires)
 *   URL  = https://iframe.mediadelivery.net/embed/{libraryId}/{videoGuid}?token=…&expires=…
 *
 * Separated from `signedEmbedUrlFor` so tests can exercise the signing without
 * touching the settings service or subscription state.
 */
export function signEmbedUrl(args: SignArgs): string {
	if (!VIDEO_GUID_RE.test(args.videoGuid)) {
		throw new BunnyError('invalid video guid');
	}
	const hashBase = `${args.securityKey}${args.videoGuid}${args.expires}`;
	const token = createHash('sha256').update(hashBase).digest('hex');
	const params = new URLSearchParams({
		token,
		expires: String(args.expires)
	});
	return `https://iframe.mediadelivery.net/embed/${args.libraryId}/${args.videoGuid}?${params.toString()}`;
}

/**
 * Signs an embed URL with no authorization — callers are expected to have
 * already decided the caller is allowed to see the video. Used by the
 * lesson endpoint where `coursesService.assertLessonAccess` already
 * covered the access check.
 */
async function signForAuthorizedCaller(
	videoGuid: string,
	opts: { ttlSeconds?: number } = {}
): Promise<{ url: string; expiresAt: number }> {
	const libraryId = await settingsService.require('BUNNY_STREAM_LIBRARY_ID');
	const securityKey = await settingsService.require('BUNNY_STREAM_API_KEY');

	const ttl = Math.min(Math.max(opts.ttlSeconds ?? DEFAULT_TTL_SECONDS, 30), 60 * 60 * 24);
	const expires = Math.floor(Date.now() / 1000) + ttl;
	const url = signEmbedUrl({ videoGuid, libraryId, securityKey, expires });
	return { url, expiresAt: expires };
}

export const bunnyService = {
	/**
	 * Resolves a signed embed URL for a caller if they hold an active
	 * membership. For course-enrolled-but-not-subscribed callers, use the
	 * lesson-scoped endpoint which delegates to `signForPreAuthorizedCaller`
	 * after its own access check.
	 */
	async signedEmbedUrlFor(
		caller: Caller,
		videoGuid: string,
		opts: { ttlSeconds?: number } = {}
	): Promise<{ url: string; expiresAt: number }> {
		assertAuthenticated(caller);
		const entitled = await subscriptionsService.hasActiveEntitlement(caller);
		if (!entitled) {
			throw new AuthzError('active membership required');
		}
		return signForAuthorizedCaller(videoGuid, opts);
	},

	/**
	 * For callers already authorized by a different path (e.g. single-course
	 * purchase via courseEnrollment). The caller of this method is responsible
	 * for the access check; this only signs.
	 */
	async signForPreAuthorizedCaller(
		videoGuid: string,
		opts: { ttlSeconds?: number } = {}
	): Promise<{ url: string; expiresAt: number }> {
		if (!VIDEO_GUID_RE.test(videoGuid)) throw new BunnyError('invalid video guid');
		return signForAuthorizedCaller(videoGuid, opts);
	}
};
