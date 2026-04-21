import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { cartService } from '$lib/server/services/cart';
import { checkoutService, CheckoutError } from '$lib/server/services/checkout';
import { MissingConfigError, settingsService } from '$lib/server/services/settings';

const schema = z.object({
	email: z.string().email(),
	name: z.string().max(120).optional()
});

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	const body = (await request.json()) as unknown;
	const parsed = schema.safeParse(body);
	if (!parsed.success) throw error(400, 'email is required');

	const items = cartService.read(cookies);
	if (items.length === 0) throw error(400, 'cart empty');
	const summary = await cartService.summarize(items);
	if (summary.empty) throw error(400, 'cart items are no longer available');

	const pk = await settingsService.get('STRIPE_PUBLISHABLE_KEY');
	if (!pk) {
		throw error(
			503,
			'STRIPE_PUBLISHABLE_KEY is not configured. Set it in /admin/settings/integrations.'
		);
	}

	try {
		const session = await checkoutService.createSession(locals.caller, {
			email: parsed.data.email,
			name: parsed.data.name,
			summary
		});
		return json({
			clientSecret: session.clientSecret,
			kind: session.kind,
			publishableKey: pk
		});
	} catch (err) {
		if (err instanceof CheckoutError) throw error(err.httpStatus, err.message);
		if (err instanceof MissingConfigError) throw error(503, err.message);
		throw err;
	}
};
