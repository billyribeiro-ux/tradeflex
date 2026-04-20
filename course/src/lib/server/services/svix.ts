import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Svix-signed webhook payload (Resend uses this format). The secret
 * is the `whsec_…` value shown in the provider dashboard; we strip the prefix
 * and treat the remainder as base64.
 *
 * Signatures are sent as a space-separated list of `v1,<sig>` entries so
 * providers can rotate without breaking old signers — we accept a match on
 * any entry.
 */
export function verifySvixSignature(params: {
	secret: string;
	id: string;
	timestamp: string;
	signatureHeader: string;
	rawBody: string;
}): boolean {
	const { secret, id, timestamp, signatureHeader, rawBody } = params;
	const cleanSecret = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
	let secretBytes: Buffer;
	try {
		secretBytes = Buffer.from(cleanSecret, 'base64');
	} catch {
		return false;
	}
	if (secretBytes.length === 0) return false;

	const toSign = `${id}.${timestamp}.${rawBody}`;
	const expected = createHmac('sha256', secretBytes).update(toSign).digest('base64');

	for (const part of signatureHeader.split(' ')) {
		const comma = part.indexOf(',');
		if (comma < 0) continue;
		const sig = part.slice(comma + 1).trim();
		if (sig.length !== expected.length) continue;
		try {
			if (timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return true;
		} catch {
			// Length mismatch would throw — guarded above, but be safe.
		}
	}
	return false;
}
