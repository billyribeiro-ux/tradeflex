import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailMessage, webhookDelivery } from '$lib/server/db/schema';
import { settingsService } from '$lib/server/services/settings';
import { verifySvixSignature } from '$lib/server/services/svix';
import { extractTicketToken, supportService } from '$lib/server/services/support';
import { log } from '$lib/server/log';

const MAX_AGE_MS = 5 * 60 * 1000;

interface InboundEvent {
	type: string;
	created_at?: string;
	data: {
		email_id?: string;
		from?: string;
		to?: string | string[];
		subject?: string;
		text?: string;
		html?: string;
		headers?: Record<string, string>;
	};
}

// Best-effort quote stripping: cut at the first "On <date>, <someone> wrote:"
// line that most mail clients insert above the quoted history. Leaves the
// original text untouched when the marker isn't found.
function stripQuote(text: string): string {
	const lines = text.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const l = lines[i].trim();
		if (/^On .+wrote:$/i.test(l)) return lines.slice(0, i).join('\n').trim();
		if (/^-----Original Message-----/i.test(l)) return lines.slice(0, i).join('\n').trim();
	}
	return text.trim();
}

function addressFrom(raw: string | undefined): string {
	if (!raw) return '';
	// "Display Name <user@domain>" → "user@domain"
	const m = raw.match(/<([^>]+)>/);
	return (m ? m[1] : raw).trim().toLowerCase();
}

async function recordDelivery(
	eventId: string,
	eventType: string,
	payload: unknown
): Promise<{ firstTime: boolean }> {
	const existing = await db
		.select({ id: webhookDelivery.id })
		.from(webhookDelivery)
		.where(
			and(eq(webhookDelivery.provider, 'resend_inbound'), eq(webhookDelivery.eventId, eventId))
		)
		.limit(1);
	if (existing.length > 0) return { firstTime: false };
	await db.insert(webhookDelivery).values({
		id: crypto.randomUUID(),
		provider: 'resend_inbound',
		eventId,
		eventType,
		payload: payload as object,
		processedAt: new Date()
	});
	return { firstTime: true };
}

async function landAsInboundEmail(evt: InboundEvent, fromEmail: string): Promise<void> {
	const toRaw = Array.isArray(evt.data.to) ? evt.data.to[0] : evt.data.to;
	await db.insert(emailMessage).values({
		id: crypto.randomUUID(),
		direction: 'inbound',
		fromAddress: fromEmail,
		toAddress: addressFrom(toRaw) || 'unknown',
		subject: evt.data.subject ?? '(no subject)',
		text: evt.data.text ?? '',
		html: evt.data.html ?? null,
		resendId: evt.data.email_id ?? null,
		threadKey: `inbound:${fromEmail}`,
		sentByUserId: null,
		status: 'received',
		errorReason: null,
		metadata: { via: 'resend_inbound' }
	});
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
		log.warn('resend.inbound.secret_missing');
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

	let evt: InboundEvent;
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
		const fromEmail = addressFrom(evt.data.from);
		const subject = evt.data.subject ?? '';
		const token = extractTicketToken(subject);

		if (token) {
			const ticket = await supportService.findByToken(token);
			if (ticket) {
				const body = stripQuote(evt.data.text ?? '');
				await supportService.ingestInboundReply({
					ticketId: ticket.id,
					fromEmail,
					body
				});
				return new Response(JSON.stringify({ ok: true, routed: 'ticket', id: ticket.id }), {
					headers: { 'content-type': 'application/json' }
				});
			}
			log.info('resend.inbound.token_no_match', { token });
		}

		// No token or no ticket match — store the raw inbound email so it's
		// visible in the admin inbox rather than silently dropped.
		await landAsInboundEmail(evt, fromEmail);
		return new Response(JSON.stringify({ ok: true, routed: 'inbox' }), {
			headers: { 'content-type': 'application/json' }
		});
	} catch (err) {
		log.warn('resend.inbound.apply_failed', {
			reason: err instanceof Error ? err.message : String(err)
		});
		// Swallow — delivery row is the audit trail, and retrying would produce
		// duplicate support messages since Resend retries on 5xx.
		return new Response(JSON.stringify({ ok: true, routed: 'error' }), {
			headers: { 'content-type': 'application/json' }
		});
	}
};
