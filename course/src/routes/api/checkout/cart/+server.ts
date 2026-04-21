import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { cartService } from '$lib/server/services/cart';

const addSchema = z.object({
	priceId: z.string().min(1).max(200),
	qty: z.number().int().min(1).max(5).optional().default(1)
});

const removeSchema = z.object({
	priceId: z.string().min(1).max(200)
});

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = (await request.json()) as unknown;
	const parsed = addSchema.safeParse(body);
	if (!parsed.success) throw error(400, 'priceId required');
	const items = cartService.add(cookies, { priceId: parsed.data.priceId, qty: parsed.data.qty });
	return json({ items });
};

export const DELETE: RequestHandler = async ({ request, cookies, url }) => {
	let priceId = url.searchParams.get('priceId');
	if (!priceId) {
		try {
			const body = (await request.json()) as unknown;
			const parsed = removeSchema.safeParse(body);
			if (parsed.success) priceId = parsed.data.priceId;
		} catch {
			// ignore
		}
	}
	if (!priceId) {
		cartService.clear(cookies);
		return json({ items: [] });
	}
	const items = cartService.remove(cookies, priceId);
	return json({ items });
};

export const GET: RequestHandler = async ({ cookies }) => {
	return json({ items: cartService.read(cookies) });
};
