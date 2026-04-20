import { eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contact } from '$lib/server/db/schema';
import { assertRole, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';

export interface CaptureLeadInput {
	email: string;
	source: string;
	name?: string | null;
	tags?: string[];
	metadata?: Record<string, unknown>;
}

export const contactsService = {
	async captureLead(input: CaptureLeadInput): Promise<{ id: string; created: boolean }> {
		const email = input.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			throw new Error('Invalid email address.');
		}

		const existing = await db.select().from(contact).where(eq(contact.email, email)).limit(1);
		if (existing[0]) {
			return { id: existing[0].id, created: false };
		}

		const id = crypto.randomUUID();
		await db.insert(contact).values({
			id,
			email,
			source: input.source,
			name: input.name ?? null,
			tags: input.tags ?? [],
			metadata: input.metadata ?? {}
		});
		return { id, created: true };
	},

	async list(caller: Caller, opts: { limit?: number; offset?: number } = {}) {
		assertRole(caller, 'owner', 'admin', 'support', 'content');
		const rows = await db
			.select()
			.from(contact)
			.orderBy(desc(contact.createdAt))
			.limit(opts.limit ?? 50)
			.offset(opts.offset ?? 0);
		return rows;
	},

	async unsubscribe(caller: Caller, id: string): Promise<void> {
		assertRole(caller, 'owner', 'admin', 'support');
		await db
			.update(contact)
			.set({ optedIn: false, unsubscribedAt: new Date() })
			.where(eq(contact.id, id));
		await writeAudit(caller, {
			action: 'contact.unsubscribe',
			targetKind: 'contact',
			targetId: id
		});
	}
};
