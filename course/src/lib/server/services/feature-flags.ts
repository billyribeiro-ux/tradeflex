import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { featureFlag } from '$lib/server/db/schema';
import { assertRole, type Caller, type Role } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export type FeatureFlagRow = typeof featureFlag.$inferSelect;

export interface FlagUpsertInput {
	key: string;
	description?: string;
	enabled?: boolean;
	enabledForRoles?: Role[];
	enabledForUserIds?: string[];
}

const KEY_PATTERN = /^[a-z][a-z0-9]*(?:[-.][a-z0-9]+)*$/;

function validateKey(key: string) {
	if (!KEY_PATTERN.test(key) || key.length > 80) {
		throw new FeatureFlagError(
			'key must be lowercase dotted or hyphenated (e.g. sse.notifications)'
		);
	}
}

export class FeatureFlagError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'FeatureFlagError';
		this.httpStatus = httpStatus;
	}
}

export const featureFlagsService = {
	/**
	 * Evaluate a flag for the current caller. Cheap — single-row lookup.
	 * Missing flags default to `false` so new flag keys never accidentally
	 * expose unfinished features. Call sites must create the row first.
	 */
	async isEnabled(caller: Caller, key: string): Promise<boolean> {
		const [row] = await db.select().from(featureFlag).where(eq(featureFlag.key, key)).limit(1);
		if (!row) return false;
		if (row.enabled) return true;
		if (!caller.userId) return false;
		const userIds = (row.enabledForUserIds ?? []) as string[];
		if (userIds.includes(caller.userId)) return true;
		const roles = (row.enabledForRoles ?? []) as string[];
		return caller.roles.some((r) => roles.includes(r));
	},

	async list(caller: Caller): Promise<FeatureFlagRow[]> {
		assertRole(caller, 'owner', 'admin', 'analyst', 'read_only');
		return db.select().from(featureFlag).orderBy(featureFlag.key);
	},

	async upsert(caller: Caller, input: FlagUpsertInput): Promise<FeatureFlagRow> {
		assertRole(caller, 'owner', 'admin');
		validateKey(input.key);
		const now = new Date();
		const values = {
			key: input.key,
			description: input.description?.trim() ?? '',
			enabled: input.enabled ?? false,
			enabledForRoles: input.enabledForRoles ?? [],
			enabledForUserIds: input.enabledForUserIds ?? [],
			updatedByUserId: caller.userId,
			updatedAt: now,
			createdAt: now
		};
		const [row] = await db
			.insert(featureFlag)
			.values(values)
			.onConflictDoUpdate({
				target: featureFlag.key,
				set: {
					description: values.description,
					enabled: values.enabled,
					enabledForRoles: values.enabledForRoles,
					enabledForUserIds: values.enabledForUserIds,
					updatedByUserId: values.updatedByUserId,
					updatedAt: values.updatedAt
				}
			})
			.returning();
		await writeAudit(caller, {
			action: 'feature_flag.upsert',
			targetKind: 'feature_flag',
			targetId: row.key,
			metadata: {
				enabled: row.enabled,
				roles: row.enabledForRoles,
				userIds: row.enabledForUserIds
			}
		});
		return row;
	},

	async delete(caller: Caller, key: string): Promise<void> {
		assertRole(caller, 'owner');
		await db.delete(featureFlag).where(eq(featureFlag.key, key));
		await writeAudit(caller, {
			action: 'feature_flag.delete',
			targetKind: 'feature_flag',
			targetId: key,
			metadata: {}
		});
	}
};
