import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { impersonation, roleAssignment } from '$lib/server/db/schema';
import { assertRole, AuthzError, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export type ImpersonationRow = typeof impersonation.$inferSelect;

export const IMPERSONATION_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const IMPERSONATION_COOKIE = 'tf_imp';

export class ImpersonationError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'ImpersonationError';
		this.httpStatus = httpStatus;
	}
}

async function hasRole(userId: string, role: string): Promise<boolean> {
	const rows = await db
		.select({ role: roleAssignment.role })
		.from(roleAssignment)
		.where(and(eq(roleAssignment.userId, userId), eq(roleAssignment.role, role)))
		.limit(1);
	return rows.length > 0;
}

async function activeSession(impersonatorUserId: string): Promise<ImpersonationRow | null> {
	const rows = await db
		.select()
		.from(impersonation)
		.where(
			and(
				eq(impersonation.impersonatorUserId, impersonatorUserId),
				isNull(impersonation.revokedAt),
				gt(impersonation.expiresAt, new Date())
			)
		)
		.limit(1);
	return rows[0] ?? null;
}

export const impersonationService = {
	async start(
		caller: Caller,
		params: { targetUserId: string; reason: string }
	): Promise<ImpersonationRow> {
		assertRole(caller, 'owner', 'admin');
		if (!caller.userId) throw new AuthzError('not authenticated');

		if (params.targetUserId === caller.userId) {
			throw new ImpersonationError('cannot impersonate yourself');
		}
		if (params.reason.trim().length < 5) {
			throw new ImpersonationError('reason is required (min 5 chars)');
		}

		// Hard rule: no one can impersonate an owner. The blast radius is too wide.
		if (await hasRole(params.targetUserId, 'owner')) {
			throw new AuthzError('cannot impersonate an owner');
		}

		// One active session per admin — revoke any prior one implicitly so the
		// cookie handoff stays clean.
		const prior = await activeSession(caller.userId);
		if (prior) {
			await db
				.update(impersonation)
				.set({ revokedAt: new Date() })
				.where(eq(impersonation.id, prior.id));
			await writeAudit(caller, {
				action: 'impersonation.superseded',
				targetKind: 'impersonation',
				targetId: prior.id,
				metadata: { targetUserId: prior.targetUserId }
			});
		}

		const id = crypto.randomUUID();
		const now = new Date();
		const expiresAt = new Date(now.getTime() + IMPERSONATION_TTL_MS);
		const [row] = await db
			.insert(impersonation)
			.values({
				id,
				impersonatorUserId: caller.userId,
				targetUserId: params.targetUserId,
				reason: params.reason.trim(),
				issuedAt: now,
				expiresAt
			})
			.returning();

		await writeAudit(caller, {
			action: 'impersonation.start',
			targetKind: 'user',
			targetId: params.targetUserId,
			metadata: { impersonationId: id, reason: params.reason.trim(), expiresAt }
		});
		return row;
	},

	async stop(caller: Caller, params: { id: string }): Promise<void> {
		if (!caller.userId) throw new AuthzError('not authenticated');
		// The person whose real identity is driving the session (caller.impersonatorUserId
		// when actively impersonating, else caller.userId) is the only one who can end it.
		const realUserId = caller.impersonatorUserId ?? caller.userId;
		const [row] = await db
			.select()
			.from(impersonation)
			.where(eq(impersonation.id, params.id))
			.limit(1);
		if (!row) return; // idempotent — already gone
		if (row.impersonatorUserId !== realUserId) {
			throw new AuthzError('only the impersonator can end the session');
		}
		if (row.revokedAt) return;
		await db
			.update(impersonation)
			.set({ revokedAt: new Date() })
			.where(eq(impersonation.id, params.id));
		await writeAudit(caller, {
			action: 'impersonation.stop',
			targetKind: 'impersonation',
			targetId: row.id,
			metadata: { targetUserId: row.targetUserId }
		});
	},

	/**
	 * Returns the active impersonation row referenced by the cookie, if it is
	 * still valid and belongs to the given real user. Hook uses this to resolve
	 * the effective caller.
	 */
	async resolveFromCookie(
		realUserId: string,
		impersonationId: string
	): Promise<ImpersonationRow | null> {
		const [row] = await db
			.select()
			.from(impersonation)
			.where(eq(impersonation.id, impersonationId))
			.limit(1);
		if (!row) return null;
		if (row.impersonatorUserId !== realUserId) return null;
		if (row.revokedAt) return null;
		if (row.expiresAt.getTime() <= Date.now()) return null;
		return row;
	}
};
