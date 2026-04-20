import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import { settingsService } from '$lib/server/services/settings';
import { emailService, EmailError } from '$lib/server/services/email';
import { setFlash } from '$lib/server/flash';

export const load: PageServerLoad = async ({ locals, url }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support');
	const resendConfigured = Boolean(await settingsService.get('RESEND_API_KEY'));
	const fromAddress = await settingsService.get('RESEND_FROM');
	const threads = await emailService.listThreads(locals.caller, { limit: 60 });

	const openKey = url.searchParams.get('thread');
	const openThread = openKey ? await emailService.listThread(locals.caller, openKey) : [];

	return {
		resendConfigured,
		fromAddress: fromAddress ?? null,
		threads,
		openKey,
		openThread
	};
};

export const actions: Actions = {
	send: async ({ request, locals, cookies }) => {
		assertRole(locals.caller, 'owner', 'admin', 'support');
		const form = await request.formData();
		const to = String(form.get('to') ?? '');
		const subject = String(form.get('subject') ?? '');
		const text = String(form.get('text') ?? '');
		try {
			const row = await emailService.send(locals.caller, { to, subject, text });
			setFlash(cookies, {
				kind: row.status === 'sent' ? 'success' : 'error',
				message:
					row.status === 'sent'
						? `Email sent to ${to}`
						: `Email log saved but Resend rejected: ${row.errorReason ?? 'unknown'}`
			});
			return { success: true, threadKey: row.threadKey };
		} catch (err) {
			if (err instanceof EmailError) {
				if (err.httpStatus >= 500) throw error(err.httpStatus, err.message);
				return fail(err.httpStatus, { error: err.message, to, subject, text });
			}
			throw err;
		}
	}
};
