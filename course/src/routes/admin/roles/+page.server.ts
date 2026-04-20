import type { PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';

export const load: PageServerLoad = ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support', 'analyst');
	return {};
};
