import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { auditEvent } from '$lib/server/db/schema';
import { assertRole } from '$lib/server/authz/caller';

export const load: PageServerLoad = async ({ locals, url }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support', 'analyst');
	const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
	const pageSize = 100;
	const rows = await db
		.select()
		.from(auditEvent)
		.orderBy(desc(auditEvent.at))
		.limit(pageSize)
		.offset((page - 1) * pageSize);
	return { events: rows, page, pageSize };
};
