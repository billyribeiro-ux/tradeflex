import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { webhookDelivery } from '$lib/server/db/schema';
import { settingsService } from '$lib/server/services/settings';
import { webhooksService } from '$lib/server/services/webhooks';
import { log, reportError } from '$lib/server/log';

/**
 * Stripe webhook ingress.
 *
 * Signature verification uses STRIPE_WEBHOOK_SECRET from settings when present;
 * otherwise we accept the payload but flag it as "unverified" in the delivery
 * record. In production STRIPE_WEBHOOK_SECRET must be set — the admin UI
 * surfaces that requirement.
 */

interface StripeEvent {
	id: string;
	type: string;
	data?: { object?: Record<string, unknown> };
	created?: number;
}

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
	if (!header) return false;
	const secret = await settingsService.get('STRIPE_WEBHOOK_SECRET');
	if (!secret) return false;

	const parts = Object.fromEntries(
		header.split(',').map((kv) => {
			const [k, v] = kv.split('=');
			return [k, v];
		})
	);
	const timestamp = parts.t;
	const signature = parts.v1;
	if (!timestamp || !signature) return false;

	const key = await globalThis.crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const mac = await globalThis.crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(`${timestamp}.${rawBody}`)
	);
	const hex = Array.from(new Uint8Array(mac))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return hex === signature;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const rawBody = await request.text();
	const header = request.headers.get('stripe-signature');
	const verified = await verifySignature(rawBody, header);

	let event: StripeEvent;
	try {
		event = JSON.parse(rawBody) as StripeEvent;
	} catch {
		throw error(400, 'invalid JSON');
	}
	if (!event.id || !event.type) throw error(400, 'malformed event');

	await db
		.insert(webhookDelivery)
		.values({
			id: crypto.randomUUID(),
			provider: 'stripe',
			eventId: event.id,
			eventType: event.type,
			payload: event as unknown as Record<string, unknown>,
			processedAt: null,
			error: verified ? null : 'unverified-signature'
		})
		.onConflictDoNothing();

	log.info('stripe.webhook.received', {
		requestId: locals.requestId,
		eventId: event.id,
		eventType: event.type,
		verified
	});

	if (verified) {
		try {
			await webhooksService.drain(10);
		} catch (err) {
			reportError(err, { requestId: locals.requestId, phase: 'webhook.drain' });
		}
	}

	return json({ received: true });
};
