import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { BunnyError, signEmbedUrl } from './bunny';

describe('signEmbedUrl', () => {
	const videoGuid = 'aabbccdd-eeff-0011-2233-445566778899';
	const libraryId = '123456';
	const securityKey = 'sec-xyz';
	const expires = 1_800_000_000;

	test('emits token = sha256_hex(securityKey + videoGuid + expires)', () => {
		const expected = createHash('sha256')
			.update(`${securityKey}${videoGuid}${expires}`)
			.digest('hex');
		const url = signEmbedUrl({ videoGuid, libraryId, securityKey, expires });
		const parsed = new URL(url);
		expect(parsed.searchParams.get('token')).toBe(expected);
	});

	test('includes library id and guid in the path', () => {
		const url = signEmbedUrl({ videoGuid, libraryId, securityKey, expires });
		expect(url).toContain(`/embed/${libraryId}/${videoGuid}?`);
		expect(url.startsWith('https://iframe.mediadelivery.net/')).toBe(true);
	});

	test('passes expires through as querystring', () => {
		const url = signEmbedUrl({ videoGuid, libraryId, securityKey, expires });
		const parsed = new URL(url);
		expect(parsed.searchParams.get('expires')).toBe(String(expires));
	});

	test('signing is deterministic for fixed inputs', () => {
		const a = signEmbedUrl({ videoGuid, libraryId, securityKey, expires });
		const b = signEmbedUrl({ videoGuid, libraryId, securityKey, expires });
		expect(a).toBe(b);
	});

	test('different security keys produce different tokens', () => {
		const a = signEmbedUrl({ videoGuid, libraryId, securityKey: 'a', expires });
		const b = signEmbedUrl({ videoGuid, libraryId, securityKey: 'b', expires });
		const ta = new URL(a).searchParams.get('token');
		const tb = new URL(b).searchParams.get('token');
		expect(ta).not.toBe(tb);
	});

	test('rejects malformed video guid', () => {
		expect(() =>
			signEmbedUrl({ videoGuid: 'not-a-guid', libraryId, securityKey, expires })
		).toThrow(BunnyError);
	});
});
