import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customer } from '$lib/server/db/schema';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export type CustomerRow = typeof customer.$inferSelect;

export const customersService = {
	async forCaller(caller: Caller): Promise<CustomerRow | null> {
		assertAuthenticated(caller);
		const rows = await db
			.select()
			.from(customer)
			.where(eq(customer.userId, caller.userId))
			.limit(1);
		return rows[0] ?? null;
	},

	async upsertFromStripe(
		userId: string,
		stripeCustomerId: string,
		actor: Caller | null
	): Promise<void> {
		await db
			.insert(customer)
			.values({ userId, stripeCustomerId })
			.onConflictDoUpdate({
				target: customer.userId,
				set: { stripeCustomerId }
			});
		if (actor) {
			await writeAudit(actor, {
				action: 'customer.upsert',
				targetKind: 'customer',
				targetId: userId,
				metadata: { stripeCustomerId }
			});
		}
	}
};
