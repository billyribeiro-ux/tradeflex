import { env } from './env';

const subtle = globalThis.crypto.subtle;

function requireKey(): Uint8Array {
	if (!env.APP_ENCRYPTION_KEY) {
		throw new Error(
			'APP_ENCRYPTION_KEY is not set — required for encrypted settings. Generate with: `openssl rand -hex 32`'
		);
	}
	const hex = env.APP_ENCRYPTION_KEY;
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
	if (!keyPromise) {
		const raw = requireKey();
		keyPromise = subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, [
			'encrypt',
			'decrypt'
		]);
	}
	return keyPromise;
}

function toB64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64');
}

function fromB64(b64: string): Uint8Array {
	return new Uint8Array(Buffer.from(b64, 'base64'));
}

export interface EncryptedBlob {
	ciphertext: string;
	iv: string;
	aad?: string;
}

export async function encrypt(plaintext: string, aad?: string): Promise<EncryptedBlob> {
	const key = await getKey();
	const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
	const params: AesGcmParams = { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer };
	if (aad) params.additionalData = new TextEncoder().encode(aad).buffer as ArrayBuffer;

	const pt = new TextEncoder().encode(plaintext);
	const cipherBuffer = await subtle.encrypt(params, key, pt.buffer as ArrayBuffer);
	return {
		ciphertext: toB64(new Uint8Array(cipherBuffer)),
		iv: toB64(iv),
		aad
	};
}

export async function decrypt(blob: EncryptedBlob): Promise<string> {
	const key = await getKey();
	const ivBytes = fromB64(blob.iv);
	const params: AesGcmParams = { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer };
	if (blob.aad) params.additionalData = new TextEncoder().encode(blob.aad).buffer as ArrayBuffer;

	const ctBytes = fromB64(blob.ciphertext);
	const plainBuffer = await subtle.decrypt(params, key, ctBytes.buffer as ArrayBuffer);
	return new TextDecoder().decode(plainBuffer);
}

export function mask(value: string, visible = 4): string {
	if (!value) return '';
	if (value.length <= visible) return '•'.repeat(value.length);
	return `${value.slice(0, 3)}${'•'.repeat(Math.min(8, value.length - visible - 3))}${value.slice(-visible)}`;
}
