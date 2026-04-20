import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { alertsService } from '$lib/server/services/alerts';
import { assertRole } from '$lib/server/authz/caller';
import type { Actions, PageServerLoad } from './$types';

const publishSchema = z.object({
	symbol: z.string().min(1).max(12),
	kind: z.enum(['options', 'equity', 'macro']),
	direction: z.enum(['long', 'short', 'watch']),
	thesis: z.string().min(10).max(2000),
	entry: z.string().optional().nullable(),
	stop: z.string().optional().nullable(),
	target: z.string().optional().nullable(),
	sizingHint: z.string().optional().nullable(),
	visibility: z.enum(['public', 'members']).default('members')
});

const closeSchema = z.object({
	id: z.string().uuid(),
	outcome: z.enum(['win', 'loss', 'scratch']),
	note: z.string().max(500).optional()
});

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'content', 'analyst');
	const alerts = await alertsService.listForAdmin(locals.caller, 100);
	return { alerts };
};

export const actions: Actions = {
	publish: async ({ request, locals }) => {
		const fd = await request.formData();
		const parsed = publishSchema.safeParse({
			symbol: fd.get('symbol'),
			kind: fd.get('kind'),
			direction: fd.get('direction'),
			thesis: fd.get('thesis'),
			entry: fd.get('entry') || null,
			stop: fd.get('stop') || null,
			target: fd.get('target') || null,
			sizingHint: fd.get('sizingHint') || null,
			visibility: fd.get('visibility') || 'members'
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}
		await alertsService.publish(locals.caller, parsed.data);
		throw redirect(303, '/admin/alerts');
	},
	close: async ({ request, locals }) => {
		const fd = await request.formData();
		const parsed = closeSchema.safeParse({
			id: fd.get('id'),
			outcome: fd.get('outcome'),
			note: fd.get('note') || undefined
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
		}
		await alertsService.close(locals.caller, parsed.data);
		return { success: true };
	},
	unpublish: async ({ request, locals }) => {
		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		await alertsService.unpublish(locals.caller, id);
		return { success: true };
	}
};
