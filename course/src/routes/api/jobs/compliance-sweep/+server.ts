import { json, error } from '@sveltejs/kit';
import { complianceService } from '$lib/server/services/compliance';
import { settingsService } from '$lib/server/services/settings';
import type { RequestHandler } from './$types';

// GDPR hard-delete sweep. Triggered by Vercel Cron (sets `x-vercel-cron: 1`)
// on the schedule in vercel.json, or manually via `Authorization: Bearer
// CRON_SECRET`. Either credential is enough. Any unauthenticated hit is 401 —
// the endpoint drops real user records.
const isVercelCron = (req: Request) => req.headers.get('x-vercel-cron') === '1';

async function isAuthorized(req: Request): Promise<boolean> {
	if (isVercelCron(req)) return true;
	const auth = req.headers.get('authorization');
	if (!auth?.startsWith('Bearer ')) return false;
	const presented = auth.slice('Bearer '.length).trim();
	const expected = await settingsService.get('CRON_SECRET');
	if (!expected || presented.length === 0) return false;
	// constant-time compare
	if (presented.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < presented.length; i++) {
		diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}

export const GET: RequestHandler = async ({ request }) => {
	if (!(await isAuthorized(request))) throw error(401, 'unauthorized');
	const result = await complianceService.runSweep();
	return json({ ok: true, at: new Date().toISOString(), ...result });
};

export const POST: RequestHandler = async ({ request }) => {
	if (!(await isAuthorized(request))) throw error(401, 'unauthorized');
	const result = await complianceService.runSweep();
	return json({ ok: true, at: new Date().toISOString(), ...result });
};
