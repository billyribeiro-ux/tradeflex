import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { impersonationService, IMPERSONATION_COOKIE } from '$lib/server/services/impersonation';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	const id = cookies.get(IMPERSONATION_COOKIE);
	if (!id) {
		// No active impersonation — treat as idempotent success.
		return json({ ok: true });
	}
	try {
		await impersonationService.stop(locals.caller, { id });
	} catch (err) {
		if (err instanceof Error) error(403, err.message);
		throw err;
	} finally {
		cookies.delete(IMPERSONATION_COOKIE, { path: '/' });
	}
	return json({ ok: true });
};
