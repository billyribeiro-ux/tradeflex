import { fail, redirect, error } from '@sveltejs/kit';
import { z } from 'zod';
import { profileService } from '$lib/server/services/profile';
import { customersService } from '$lib/server/services/customers';
import { subscriptionsService } from '$lib/server/services/subscriptions';
import { billingService } from '$lib/server/services/billing';
import { complianceService, ComplianceError } from '$lib/server/services/compliance';
import { MissingConfigError } from '$lib/server/services/settings';
import { setFlash } from '$lib/server/flash';
import type { Actions, PageServerLoad } from './$types';

const profileSchema = z.object({
	displayName: z.string().min(1, 'Display name is required').max(80),
	bio: z.string().max(500).optional().default(''),
	timezone: z.string().default('UTC'),
	theme: z.enum(['system', 'light', 'dark']).default('system'),
	marketingOptIn: z.boolean().default(false)
});

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.caller.userId) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	const [profile, customer, subscription, pendingDeletion] = await Promise.all([
		profileService.getForCaller(locals.caller),
		customersService.forCaller(locals.caller),
		subscriptionsService.forCaller(locals.caller),
		complianceService.pendingForCaller(locals.caller)
	]);
	const entitled = await subscriptionsService.hasActiveEntitlement(locals.caller);
	return {
		profile,
		user: locals.user,
		customer,
		subscription,
		entitled,
		pendingDeletion
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.caller.userId) return fail(401, { message: 'Not signed in.' });

		const fd = await request.formData();
		const raw = {
			displayName: fd.get('displayName')?.toString() ?? '',
			bio: fd.get('bio')?.toString() ?? '',
			timezone: fd.get('timezone')?.toString() || 'UTC',
			theme: fd.get('theme')?.toString() ?? 'system',
			marketingOptIn: fd.get('marketingOptIn') === 'on'
		};

		const parsed = profileSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				message: parsed.error.issues[0]?.message ?? 'Invalid input.'
			});
		}

		await profileService.upsertForCaller(locals.caller, parsed.data);
		return { success: true, savedAt: new Date().toISOString() };
	},

	portal: async ({ locals, url, cookies }) => {
		if (!locals.caller.userId) return fail(401, { message: 'Not signed in.' });
		const customer = await customersService.forCaller(locals.caller);
		if (!customer)
			return fail(400, { message: 'No Stripe customer yet — start a checkout first.' });
		let portalUrl: string;
		try {
			portalUrl = await billingService.openPortal(locals.caller, {
				customerId: customer.stripeCustomerId,
				returnUrl: `${url.origin}/account`
			});
		} catch (err) {
			if (err instanceof MissingConfigError) throw error(503, err.message);
			const msg = err instanceof Error ? err.message : 'Portal unavailable.';
			return fail(400, { message: msg });
		}
		setFlash(cookies, { kind: 'info', message: 'Opening Stripe billing portal…' });
		throw redirect(303, portalUrl);
	},

	requestDeletion: async ({ request, locals }) => {
		if (!locals.caller.userId) return fail(401, { message: 'Not signed in.' });
		const fd = await request.formData();
		const reason = fd.get('reason')?.toString() ?? '';
		try {
			await complianceService.requestDeletion(locals.caller, { reason });
			return { success: true, deletionRequested: true };
		} catch (err) {
			if (err instanceof ComplianceError) return fail(err.httpStatus, { message: err.message });
			throw err;
		}
	},

	cancelDeletion: async ({ locals }) => {
		if (!locals.caller.userId) return fail(401, { message: 'Not signed in.' });
		await complianceService.cancelDeletion(locals.caller);
		return { success: true, deletionCancelled: true };
	}
};
