import type { LayoutServerLoad } from './$types';
import { readFlash } from '$lib/server/flash';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	const impersonation = locals.caller?.impersonatorUserId
		? {
				impersonatorUserId: locals.caller.impersonatorUserId,
				targetUserId: locals.caller.userId
			}
		: null;
	return { flash: readFlash(cookies), impersonation };
};
