import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { log } from '$lib/server/log';

export const GET: RequestHandler = async ({ locals }) => {
	const started = Date.now();
	const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

	try {
		const t0 = Date.now();
		await db.execute(sql`select 1`);
		checks.db = { ok: true, ms: Date.now() - t0 };
	} catch (err) {
		checks.db = { ok: false, error: err instanceof Error ? err.message : 'unknown' };
	}

	const ok = Object.values(checks).every((c) => c.ok);
	const status = ok ? 200 : 503;
	const body = {
		status: ok ? 'ok' : 'degraded',
		checks,
		totalMs: Date.now() - started,
		requestId: locals.requestId
	};
	if (!ok) log.warn('health.check.failed', { totalMs: body.totalMs, requestId: body.requestId });
	return json(body, { status });
};
