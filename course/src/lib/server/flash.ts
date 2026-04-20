import type { Cookies } from '@sveltejs/kit';

export type FlashKind = 'info' | 'success' | 'error';
export interface Flash {
	kind: FlashKind;
	message: string;
}

const NAME = 'flash';

export function setFlash(cookies: Cookies, flash: Flash): void {
	cookies.set(NAME, JSON.stringify(flash), {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		maxAge: 60
	});
}

export function readFlash(cookies: Cookies): Flash | null {
	const raw = cookies.get(NAME);
	if (!raw) return null;
	cookies.delete(NAME, { path: '/' });
	try {
		const parsed = JSON.parse(raw) as Flash;
		if (!parsed || typeof parsed.message !== 'string') return null;
		if (parsed.kind !== 'info' && parsed.kind !== 'success' && parsed.kind !== 'error') return null;
		return parsed;
	} catch {
		return null;
	}
}
