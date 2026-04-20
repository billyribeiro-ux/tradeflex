import { json, error, redirect, isRedirect, isHttpError } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { billingService } from '$lib/server/services/billing';
import { MissingConfigError } from '$lib/server/services/settings';

const schema = z.object({
	priceId: z.string().min(1),
	trial: z.enum(['none', 'card_upfront', 'no_card']).optional().default('none')
});

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const contentType = request.headers.get('content-type') ?? '';
	let body: Record<string, unknown>;
	if (contentType.includes('application/json')) {
		body = (await request.json()) as Record<string, unknown>;
	} else {
		body = Object.fromEntries(await request.formData());
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) throw error(400, 'priceId is required');

	let checkoutUrl: string;
	try {
		const trialDays =
			parsed.data.trial === 'card_upfront' ? 14 : parsed.data.trial === 'no_card' ? 7 : undefined;
		checkoutUrl = await billingService.startCheckout(locals.caller, {
			priceId: parsed.data.priceId,
			successUrl: `${url.origin}/account?checkout=success`,
			cancelUrl: `${url.origin}/pricing?checkout=canceled`,
			email: locals.user?.email,
			trialDays
		});
	} catch (err) {
		if (isRedirect(err) || isHttpError(err)) throw err;
		if (err instanceof MissingConfigError) throw error(503, err.message);
		const msg = err instanceof Error ? err.message : 'checkout failed';
		throw error(400, msg);
	}

	if (contentType.includes('application/json')) {
		return json({ url: checkoutUrl });
	}
	throw redirect(303, checkoutUrl);
};
