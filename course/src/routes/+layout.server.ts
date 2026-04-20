import type { LayoutServerLoad } from './$types';
import { readFlash } from '$lib/server/flash';

export const load: LayoutServerLoad = async ({ cookies }) => {
	return { flash: readFlash(cookies) };
};
