import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { roleAssignment } from '$lib/server/db/schema';
import type { Caller, Role } from './caller';

export async function resolveCaller(
	userId: string | null,
	requestId: string,
	impersonatorUserId: string | null = null
): Promise<Caller> {
	if (!userId) {
		return {
			userId: null,
			roles: [],
			entitlements: [],
			impersonatorUserId: null,
			requestId
		};
	}

	const roles = await db
		.select({ role: roleAssignment.role })
		.from(roleAssignment)
		.where(eq(roleAssignment.userId, userId));

	return {
		userId,
		roles: roles.map((r) => r.role as Role),
		entitlements: [],
		impersonatorUserId,
		requestId
	};
}
