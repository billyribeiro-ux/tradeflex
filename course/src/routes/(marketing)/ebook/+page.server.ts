import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';
import { contactsService } from '$lib/server/services/contacts';

const schema = z.object({
	email: z.string().email('Enter a valid email address.'),
	name: z.string().max(80).optional(),
	optIn: z.boolean().default(true)
});

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const raw = {
			email: fd.get('email')?.toString().trim() ?? '',
			name: fd.get('name')?.toString().trim() || undefined,
			optIn: fd.get('optIn') !== 'off'
		};
		const parsed = schema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				message: parsed.error.issues[0]?.message ?? 'Invalid input.'
			});
		}
		try {
			const { created } = await contactsService.captureLead({
				email: parsed.data.email,
				source: 'ebook-options-101',
				name: parsed.data.name ?? null,
				tags: ['ebook', 'options-101'],
				metadata: { marketingOptIn: parsed.data.optIn }
			});
			return {
				success: true,
				created,
				downloadUrl: '/assets/options-101-starter.pdf'
			};
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Could not save. Try again.';
			return fail(400, { values: raw, message: msg });
		}
	}
};
