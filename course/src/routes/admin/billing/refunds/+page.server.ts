import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { refundsService, RefundStateError } from '$lib/server/services/refunds';
import { AuthzError, AuthnError } from '$lib/server/authz/caller';

function messageFor(err: unknown): { status: number; message: string } {
	if (err instanceof AuthnError) return { status: 401, message: err.message };
	if (err instanceof AuthzError) return { status: 403, message: err.message };
	if (err instanceof RefundStateError) return { status: err.httpStatus, message: err.message };
	return { status: 500, message: err instanceof Error ? err.message : 'unexpected error' };
}

export const load: PageServerLoad = async ({ locals }) => {
	const requests = await refundsService.list(locals.caller);
	return { requests, viewerId: locals.caller.userId };
};

export const actions: Actions = {
	request: async ({ request, locals }) => {
		const form = await request.formData();
		try {
			const row = await refundsService.request(locals.caller, {
				paymentIntentId: String(form.get('paymentIntentId') ?? ''),
				chargeId: (form.get('chargeId') as string) || null,
				customerId: (form.get('customerId') as string) || null,
				subjectUserId: (form.get('subjectUserId') as string) || null,
				amountCents: Number(form.get('amountCents') ?? 0),
				currency: String(form.get('currency') ?? 'usd'),
				reason: String(form.get('reason') ?? '')
			});
			return { ok: true, created: row.id };
		} catch (err) {
			const { status, message } = messageFor(err);
			return fail(status, { action: 'request', message });
		}
	},

	approve: async ({ request, locals }) => {
		const form = await request.formData();
		try {
			const row = await refundsService.approve(locals.caller, {
				id: String(form.get('id') ?? ''),
				note: (form.get('note') as string) || undefined
			});
			return { ok: true, approved: row.id, stripeRefundId: row.stripeRefundId };
		} catch (err) {
			const { status, message } = messageFor(err);
			return fail(status, { action: 'approve', message });
		}
	},

	deny: async ({ request, locals }) => {
		const form = await request.formData();
		try {
			const row = await refundsService.deny(locals.caller, {
				id: String(form.get('id') ?? ''),
				note: String(form.get('note') ?? '')
			});
			return { ok: true, denied: row.id };
		} catch (err) {
			const { status, message } = messageFor(err);
			return fail(status, { action: 'deny', message });
		}
	}
};
