import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { settingsService } from '$lib/server/services/settings';

/**
 * Tauri updater manifest endpoint. The desktop client polls this URL on
 * startup and again on a schedule. Expected contract (Tauri v2):
 *
 *   204 No Content  -> already on latest; no update
 *   200 application/json with {
 *     version: string,
 *     pub_date: ISO-8601,
 *     notes: string,
 *     platforms: { [key: string]: { signature: string, url: string } }
 *   }
 *
 * For v1 we read the latest release metadata from encrypted settings so it
 * can be rotated without a redeploy. Keys:
 *   DESKTOP_LATEST_VERSION
 *   DESKTOP_LATEST_PUB_DATE
 *   DESKTOP_LATEST_NOTES
 *   DESKTOP_LATEST_URL_DARWIN_AARCH64
 *   DESKTOP_LATEST_URL_DARWIN_X86_64
 *   DESKTOP_LATEST_SIG_DARWIN_AARCH64
 *   DESKTOP_LATEST_SIG_DARWIN_X86_64
 *
 * When `DESKTOP_LATEST_VERSION` is unset we return 204 so the client stays
 * on its current build. That keeps the scaffold safe to deploy before any
 * signed release manifest exists.
 */
const TARGET_TO_KEY: Record<string, { url: string; sig: string }> = {
	'darwin-aarch64': {
		url: 'DESKTOP_LATEST_URL_DARWIN_AARCH64',
		sig: 'DESKTOP_LATEST_SIG_DARWIN_AARCH64'
	},
	'darwin-x86_64': {
		url: 'DESKTOP_LATEST_URL_DARWIN_X86_64',
		sig: 'DESKTOP_LATEST_SIG_DARWIN_X86_64'
	}
};

function semverGt(a: string, b: string): boolean {
	const pa = a.split('.').map((n) => parseInt(n, 10));
	const pb = b.split('.').map((n) => parseInt(n, 10));
	for (let i = 0; i < 3; i++) {
		const av = pa[i] ?? 0;
		const bv = pb[i] ?? 0;
		if (av > bv) return true;
		if (av < bv) return false;
	}
	return false;
}

export const GET: RequestHandler = async ({ params }) => {
	const keys = TARGET_TO_KEY[params.target];
	if (!keys) throw error(400, `unsupported target: ${params.target}`);

	const latest = await settingsService.get('DESKTOP_LATEST_VERSION');
	if (!latest) return new Response(null, { status: 204 });

	if (!semverGt(latest, params.currentVersion)) {
		return new Response(null, { status: 204 });
	}

	const [url, sig, pubDate, notes] = await Promise.all([
		settingsService.get(keys.url),
		settingsService.get(keys.sig),
		settingsService.get('DESKTOP_LATEST_PUB_DATE'),
		settingsService.get('DESKTOP_LATEST_NOTES')
	]);

	if (!url || !sig) {
		// Configuration is partial — treat as no update rather than break the client.
		return new Response(null, { status: 204 });
	}

	return json({
		version: latest,
		pub_date: pubDate ?? new Date().toISOString(),
		notes: notes ?? '',
		platforms: {
			[params.target]: { url, signature: sig }
		}
	});
};
