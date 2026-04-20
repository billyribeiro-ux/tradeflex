import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.caller.userId) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}
	const adminRoles = ['owner', 'admin', 'support', 'content', 'finance', 'analyst'] as const;
	const isStaff = locals.caller.roles.some((r) => adminRoles.includes(r as never));
	if (!isStaff) {
		throw error(403, 'Admin access required.');
	}
	return {
		caller: {
			userId: locals.caller.userId,
			roles: locals.caller.roles,
			impersonatorUserId: locals.caller.impersonatorUserId ?? null
		},
		email: locals.user?.email ?? null
	};
};
