import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { assertRole, AuthzError } from '$lib/server/authz/caller';
import { complianceService, ComplianceError } from '$lib/server/services/compliance';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

const cancelSchema = z.object({
	id: z.string().min(1),
	note: z.string().min(3, 'note must be at least 3 characters').max(500)
});

const executeSchema = z.object({
	id: z.string().min(1),
	confirm: z.string().refine((v) => v === 'HARD-DELETE', {
		message: 'type HARD-DELETE to confirm'
	})
});

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support');
	const pending = await complianceService.listPending(locals.caller);
	const userIds = Array.from(new Set(pending.map((r) => r.userId)));
	const users = userIds.length
		? await db
				.select({ id: user.id, email: user.email, name: user.name })
				.from(user)
				.where(inArray(user.id, userIds))
		: [];
	const byId = new Map(users.map((u) => [u.id, u]));

	const rows = pending.map((r) => ({
		...r,
		userEmail: byId.get(r.userId)?.email ?? null,
		userName: byId.get(r.userId)?.name ?? null
	}));

	return { rows };
};

export const actions: Actions = {
	adminCancel: async ({ request, locals }) => {
		const fd = await request.formData();
		const parsed = cancelSchema.safeParse({
			id: fd.get('id')?.toString() ?? '',
			note: fd.get('note')?.toString() ?? ''
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
		}
		try {
			await complianceService.adminCancel(locals.caller, parsed.data);
			return { success: true, cancelledId: parsed.data.id };
		} catch (err) {
			if (err instanceof AuthzError) return fail(403, { message: err.message });
			if (err instanceof ComplianceError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},

	executeDeletion: async ({ request, locals }) => {
		const fd = await request.formData();
		const parsed = executeSchema.safeParse({
			id: fd.get('id')?.toString() ?? '',
			confirm: fd.get('confirm')?.toString() ?? ''
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
		}
		try {
			await complianceService.executeDeletion(locals.caller, { id: parsed.data.id });
			return { success: true, executedId: parsed.data.id };
		} catch (err) {
			if (err instanceof AuthzError) return fail(403, { message: err.message });
			if (err instanceof ComplianceError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},

	runSweep: async ({ locals }) => {
		try {
			assertRole(locals.caller, 'owner');
		} catch (err) {
			if (err instanceof AuthzError) return fail(403, { message: err.message });
			throw err;
		}
		const result = await complianceService.runSweep();
		return {
			success: true,
			sweep: {
				scanned: result.scanned,
				deleted: result.deleted.length,
				failed: result.failed.length
			}
		};
	}
};
