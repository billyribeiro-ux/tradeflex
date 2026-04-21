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
	},

	/**
	 * Creates a video record in the configured Bunny Stream library. Returns
	 * the assigned GUID. The caller then streams the actual bytes to
	 * `uploadVideoStream(guid, stream)`.
	 */
	async createVideoRecord(params: { title: string }): Promise<{ guid: string }> {
		const libraryId = await settingsService.require('BUNNY_STREAM_LIBRARY_ID');
		const accessKey = await settingsService.require('BUNNY_STREAM_API_KEY');
		const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
			method: 'POST',
			headers: {
				AccessKey: accessKey,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({ title: params.title })
		});
		if (!res.ok) {
			throw new BunnyError(
				`Bunny createVideo failed (${res.status}): ${await res.text()}`,
				res.status === 401 ? 503 : 502
			);
		}
		const json = (await res.json()) as { guid: string };
		if (!VIDEO_GUID_RE.test(json.guid)) {
			throw new BunnyError('Bunny returned an invalid GUID', 502);
		}
		return { guid: json.guid };
	},

	/**
	 * Uploads the bytes of a video to a previously created Bunny video record.
	 * Streams the request body through without buffering in memory.
	 */
	async uploadVideoStream(
		videoGuid: string,
		body: ReadableStream<Uint8Array> | ArrayBuffer | Blob,
		contentType = 'application/octet-stream'
	): Promise<void> {
		if (!VIDEO_GUID_RE.test(videoGuid)) throw new BunnyError('invalid video guid');
		const libraryId = await settingsService.require('BUNNY_STREAM_LIBRARY_ID');
		const accessKey = await settingsService.require('BUNNY_STREAM_API_KEY');
		const init: RequestInit & { duplex?: 'half' } = {
			method: 'PUT',
			headers: {
				AccessKey: accessKey,
				'Content-Type': contentType,
				Accept: 'application/json'
			},
			body: body as BodyInit,
			duplex: 'half'
		};
		const res = await fetch(
			`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
			init as RequestInit
		);
		if (!res.ok) {
			throw new BunnyError(
				`Bunny upload failed (${res.status}): ${await res.text()}`,
				res.status === 401 ? 503 : 502
			);
		}
	}
};
