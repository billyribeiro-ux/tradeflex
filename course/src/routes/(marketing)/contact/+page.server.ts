import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';
import { contactsService } from '$lib/server/services/contacts';
import { log } from '$lib/server/log';

const schema = z.object({
	email: z.string().email('Enter a valid email.'),
	name: z.string().max(80).optional(),
	topic: z.enum(['support', 'press', 'partnership', 'other']).default('other'),
	message: z.string().min(10, 'Tell us a little more — at least 10 characters.').max(2000)
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const fd = await request.formData();
		const raw = {
			email: fd.get('email')?.toString().trim() ?? '',
			name: fd.get('name')?.toString().trim() || undefined,
			topic: fd.get('topic')?.toString() ?? 'other',
			message: fd.get('message')?.toString() ?? ''
		};
		const parsed = schema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				message: parsed.error.issues[0]?.message ?? 'Invalid input.'
			});
		}
		try {
			await contactsService.captureLead({
				email: parsed.data.email,
				source: `contact-${parsed.data.topic}`,
				name: parsed.data.name ?? null,
				tags: ['contact-form', parsed.data.topic],
				metadata: { message: parsed.data.message }
			});
			log.info('contact.form.submitted', {
				requestId: locals.requestId,
				topic: parsed.data.topic,
				email: parsed.data.email
			});
			return { success: true };
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Could not send. Try again.';
			return fail(400, { values: raw, message: msg });
		}
	}
};
