import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { complianceService } from '$lib/server/services/compliance';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.caller.userId) error(401, 'sign in first');
	const payload = await complianceService.exportForCaller(locals.caller);
	const body = JSON.stringify(payload, null, 2);
	const filename = `tradeflex-export-${locals.caller.userId}-${Date.now()}.json`;
	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
