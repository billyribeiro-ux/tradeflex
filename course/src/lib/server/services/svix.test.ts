import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifySvixSignature } from './svix';

// Build a legit signature using the documented Svix scheme so we can prove
// the verifier accepts correct ones and rejects every kind of tamper.
function signWith(secret: string, id: string, timestamp: string, rawBody: string): string {
	const cleanSecret = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
	const sig = createHmac('sha256', Buffer.from(cleanSecret, 'base64'))
		.update(`${id}.${timestamp}.${rawBody}`)
		.digest('base64');
	return `v1,${sig}`;
}

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

describe('verifySvixSignature', () => {
	const id = 'msg_test_123';
	const timestamp = '1700000000';
	const body = JSON.stringify({ type: 'email.delivered', data: { email_id: 'abc' } });

	it('accepts a signature computed with the correct secret', () => {
		const header = signWith(SECRET, id, timestamp, body);
		expect(
			verifySvixSignature({ secret: SECRET, id, timestamp, signatureHeader: header, rawBody: body })
		).toBe(true);
	});

	it('rejects a tampered body', () => {
		const header = signWith(SECRET, id, timestamp, body);
		expect(
			verifySvixSignature({
				secret: SECRET,
				id,
				timestamp,
				signatureHeader: header,
				rawBody: body + ' '
			})
		).toBe(false);
	});

	it('rejects a wrong secret', () => {
		const header = signWith(SECRET, id, timestamp, body);
		expect(
			verifySvixSignature({
				secret: 'whsec_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
				id,
				timestamp,
				signatureHeader: header,
				rawBody: body
			})
		).toBe(false);
	});

	it('accepts when any v1 entry in a rotated list matches', () => {
		const real = signWith(SECRET, id, timestamp, body);
		const fake = 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
		const header = `${fake} ${real}`;
		expect(
			verifySvixSignature({ secret: SECRET, id, timestamp, signatureHeader: header, rawBody: body })
		).toBe(true);
	});

	it('rejects header with no v1 entry', () => {
		expect(
			verifySvixSignature({
				secret: SECRET,
				id,
				timestamp,
				signatureHeader: 'garbage',
				rawBody: body
			})
		).toBe(false);
	});
});
