import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailMessage, contact, webhookDelivery } from '$lib/server/db/schema';
import { settingsService } from '$lib/server/services/settings';
import { verifySvixSignature } from '$lib/server/services/svix';
import { log } from '$lib/server/log';

interface ResendEvent {
	type: string;
	created_at: string;
	data: {
		email_id?: string;
		to?: string[];
		from?: string;
		subject?: string;
		bounce?: { message?: string; type?: string };
		complaint?: { type?: string };
	};
}

const MAX_AGE_MS = 5 * 60 * 1000;

async function recordDelivery(
	eventId: string,
	eventType: string,
	payload: unknown
): Promise<{ firstTime: boolean }> {
	const existing = await db
		.select({ id: webhookDelivery.id })
		.from(webhookDelivery)
		.where(and(eq(webhookDelivery.provider, 'resend'), eq(webhookDelivery.eventId, eventId)))
		.limit(1);
	if (existing.length > 0) return { firstTime: false };
	await db.insert(webhookDelivery).values({
		id: crypto.randomUUID(),
		provider: 'resend',
		eventId,
		eventType,
		payload: payload as object,
		processedAt: new Date()
	});
	return { firstTime: true };
}

async function applyEvent(evt: ResendEvent): Promise<void> {
	const emailId = evt.data.email_id;
	if (!emailId) return;

	// Map the Resend event type to our stored status. Keep the richest state
	// we have — don't downgrade "complained" back to "delivered" etc.
	const statusMap: Record<string, string | undefined> = {
		'email.sent': 'sent',
		'email.delivered': 'delivered',
		'email.delivery_delayed': 'delayed',
		'email.bounced': 'bounced',
		'email.complained': 'complained',
		'email.opened': undefined,
		'email.clicked': undefined
	};
	const nextStatus = statusMap[evt.type];
	if (nextStatus) {
		await db
			.update(emailMessage)
			.set({
				status: nextStatus,
				errorReason:
					evt.type === 'email.bounced'
						? (evt.data.bounce?.message ?? 'bounced')
						: evt.type === 'email.complained'
							? (evt.data.complaint?.type ?? 'complained')
							: null
			})
			.where(eq(emailMessage.resendId, emailId));
	}

	// Bounce or complaint means the address is un-mailable — suppress any
	// matching marketing contact so future blasts skip it.
	if (evt.type === 'email.bounced' || evt.type === 'email.complained') {
		const addresses = (evt.data.to ?? []).map((a) => a.toLowerCase());
		for (const email of addresses) {
			await db
				.update(contact)
				.set({
					optedIn: false,
					unsubscribedAt: new Date()
				})
				.where(eq(contact.email, email));
		}
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const secret = await settingsService.get('RESEND_WEBHOOK_SECRET');
	const svixId = request.headers.get('svix-id');
	const svixTimestamp = request.headers.get('svix-timestamp');
	const svixSignature = request.headers.get('svix-signature');
	const rawBody = await request.text();

	if (!svixId || !svixTimestamp || !svixSignature) {
		return new Response('missing signing headers', { status: 400 });
	}
	const tsMs = Number(svixTimestamp) * 1000;
	if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > MAX_AGE_MS) {
		return new Response('stale timestamp', { status: 400 });
	}
	if (!secret) {
		// Not configured yet: log and 202 so Resend doesn't hammer retries
		// while the operator is still setting the secret in /admin/settings.
		log.warn('resend.webhook.secret_missing');
		return new Response('secret not configured', { status: 202 });
	}
	if (
		!verifySvixSignature({
			secret,
			id: svixId,
			timestamp: svixTimestamp,
			signatureHeader: svixSignature,
			rawBody
		})
	) {
		return new Response('bad signature', { status: 401 });
	}

	let evt: ResendEvent;
	try {
		evt = JSON.parse(rawBody);
	} catch {
		return new Response('invalid json', { status: 400 });
	}

	const { firstTime } = await recordDelivery(svixId, evt.type, evt);
	if (!firstTime) {
		return new Response(JSON.stringify({ idempotent: true }), {
			headers: { 'content-type': 'application/json' }
		});
	}

	try {
		await applyEvent(evt);
	} catch (err) {
		log.warn('resend.webhook.apply_failed', {
			reason: err instanceof Error ? err.message : String(err)
		});
		// Swallow so Resend doesn't retry forever on a poisoned event —
		// the webhookDelivery row is the audit trail.
	}

	return new Response(JSON.stringify({ ok: true }), {
		headers: { 'content-type': 'application/json' }
	});
};
