import { and, desc, eq, ilike, type SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { auditEvent } from '$lib/server/db/schema';
import { assertRole } from '$lib/server/authz/caller';

export const load: PageServerLoad = async ({ locals, url }) => {
	assertRole(locals.caller, 'owner', 'admin', 'support', 'analyst');
	const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
	const pageSize = 100;

	const actionFilter = url.searchParams.get('action')?.trim() || '';
	const actorFilter = url.searchParams.get('actor')?.trim() || '';
	const targetFilter = url.searchParams.get('target')?.trim() || '';

	const conditions: SQL[] = [];
	if (actionFilter) conditions.push(ilike(auditEvent.action, `%${actionFilter}%`));
	if (actorFilter) conditions.push(eq(auditEvent.actorUserId, actorFilter));
	if (targetFilter) conditions.push(ilike(auditEvent.targetKind, `%${targetFilter}%`));

	const where = conditions.length ? and(...conditions) : undefined;

	const rows = await db
		.select()
		.from(auditEvent)
		.where(where)
		.orderBy(desc(auditEvent.at))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		events: rows,
		page,
		pageSize,
		filters: { action: actionFilter, actor: actorFilter, target: targetFilter }
	};
};
