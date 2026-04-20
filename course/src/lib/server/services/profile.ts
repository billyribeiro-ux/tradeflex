import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export type Profile = typeof profile.$inferSelect;
export type ProfileInsert = typeof profile.$inferInsert;
export type ProfilePatch = Partial<Omit<ProfileInsert, 'userId' | 'createdAt' | 'updatedAt'>>;

export const profileService = {
	async getForCaller(caller: Caller): Promise<Profile | null> {
		assertAuthenticated(caller);
		const rows = await db.select().from(profile).where(eq(profile.userId, caller.userId)).limit(1);
		return rows[0] ?? null;
	},

	async upsertForCaller(caller: Caller, patch: ProfilePatch): Promise<Profile> {
		assertAuthenticated(caller);
		const [row] = await db
			.insert(profile)
			.values({ userId: caller.userId, ...patch })
			.onConflictDoUpdate({
				target: profile.userId,
				set: { ...patch, updatedAt: new Date() }
			})
			.returning();

		await writeAudit(caller, {
			action: 'profile.upsert',
			targetKind: 'profile',
			targetId: caller.userId,
			metadata: { fields: Object.keys(patch) }
		});

		return row;
	}
};
