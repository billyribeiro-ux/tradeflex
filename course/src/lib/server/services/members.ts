import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';
import { profile, roleAssignment } from '$lib/server/db/schema';
import { assertRole, type Caller, type Role } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export interface MemberRow {
	userId: string;
	email: string;
	name: string | null;
	displayName: string | null;
	createdAt: Date;
	roles: Role[];
}

const STAFF_READ: Role[] = ['owner', 'admin', 'support', 'analyst'];

export const membersService = {
	async list(caller: Caller, opts: { limit?: number; offset?: number } = {}): Promise<MemberRow[]> {
		assertRole(caller, ...STAFF_READ);
		const limit = Math.min(opts.limit ?? 50, 200);
		const offset = Math.max(opts.offset ?? 0, 0);

		const rows = await db
			.select({
				userId: user.id,
				email: user.email,
				name: user.name,
				displayName: profile.displayName,
				createdAt: user.createdAt
			})
			.from(user)
			.leftJoin(profile, eq(profile.userId, user.id))
			.orderBy(desc(user.createdAt))
			.limit(limit)
			.offset(offset);

		const ids = rows.map((r) => r.userId);
		const roles = ids.length
			? await db
					.select({ userId: roleAssignment.userId, role: roleAssignment.role })
					.from(roleAssignment)
					.where(sql`${roleAssignment.userId} = ANY(${ids})`)
			: [];

		const byUser = new Map<string, Role[]>();
		for (const r of roles) {
			const list = byUser.get(r.userId) ?? [];
			list.push(r.role as Role);
			byUser.set(r.userId, list);
		}
		return rows.map((r) => ({ ...r, roles: byUser.get(r.userId) ?? [] }));
	},

	async grantRole(caller: Caller, userId: string, role: Role) {
		assertRole(caller, 'owner');
		await db.insert(roleAssignment).values({
			id: crypto.randomUUID(),
			userId,
			role,
			grantedByUserId: caller.userId
		});
		await writeAudit(caller, {
			action: 'member.role.grant',
			targetKind: 'user',
			targetId: userId,
			metadata: { role }
		});
	},

	async revokeRole(caller: Caller, userId: string, role: Role) {
		assertRole(caller, 'owner');
		await db
			.delete(roleAssignment)
			.where(sql`${roleAssignment.userId} = ${userId} AND ${roleAssignment.role} = ${role}`);
		await writeAudit(caller, {
			action: 'member.role.revoke',
			targetKind: 'user',
			targetId: userId,
			metadata: { role }
		});
	}
};
