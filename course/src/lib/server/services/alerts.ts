import { eq, desc, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { alert } from '$lib/server/db/schema';
import { assertRole, type Caller } from '$lib/server/authz/caller';
import { notificationBus } from '$lib/server/events/bus';
import { writeAudit } from './audit';

export type AlertKind = 'options' | 'equity' | 'macro';
export type AlertDirection = 'long' | 'short' | 'watch';
export type AlertStatus = 'published' | 'closed' | 'stopped_out' | 'unpublished';
export type AlertVisibility = 'public' | 'members';

export interface PublishAlertInput {
	symbol: string;
	kind: AlertKind;
	direction: AlertDirection;
	thesis: string;
	entry?: string | null;
	stop?: string | null;
	target?: string | null;
	sizingHint?: string | null;
	visibility?: AlertVisibility;
}

export interface CloseAlertInput {
	id: string;
	outcome: 'win' | 'loss' | 'scratch';
	note?: string;
}

export const alertsService = {
	async publish(caller: Caller, input: PublishAlertInput): Promise<string> {
		assertRole(caller, 'owner', 'admin', 'content');
		const id = crypto.randomUUID();
		await db.insert(alert).values({
			id,
			symbol: input.symbol.toUpperCase(),
			kind: input.kind,
			direction: input.direction,
			thesis: input.thesis,
			entry: input.entry ?? null,
			stop: input.stop ?? null,
			target: input.target ?? null,
			sizingHint: input.sizingHint ?? null,
			visibility: input.visibility ?? 'members',
			publishedByUserId: caller.userId
		});
		await writeAudit(caller, {
			action: 'alert.publish',
			targetKind: 'alert',
			targetId: id,
			metadata: { symbol: input.symbol, kind: input.kind }
		});
		notificationBus.publish({
			type: 'alert.published',
			at: new Date().toISOString(),
			alertId: id,
			symbol: input.symbol.toUpperCase(),
			direction: input.direction,
			kind: input.kind,
			visibility: input.visibility ?? 'members'
		});
		return id;
	},

	async close(caller: Caller, input: CloseAlertInput): Promise<void> {
		assertRole(caller, 'owner', 'admin', 'content');
		const statusByOutcome = {
			win: 'closed',
			loss: 'stopped_out',
			scratch: 'closed'
		} as const;
		await db
			.update(alert)
			.set({
				status: statusByOutcome[input.outcome],
				outcome: input.outcome,
				outcomeNote: input.note ?? null,
				closedAt: new Date()
			})
			.where(eq(alert.id, input.id));
		await writeAudit(caller, {
			action: 'alert.close',
			targetKind: 'alert',
			targetId: input.id,
			metadata: { outcome: input.outcome }
		});
		notificationBus.publish({
			type: 'alert.closed',
			at: new Date().toISOString(),
			alertId: input.id,
			outcome: input.outcome
		});
	},

	async unpublish(caller: Caller, id: string): Promise<void> {
		assertRole(caller, 'owner', 'admin');
		await db.update(alert).set({ status: 'unpublished' }).where(eq(alert.id, id));
		await writeAudit(caller, { action: 'alert.unpublish', targetKind: 'alert', targetId: id });
		notificationBus.publish({
			type: 'alert.unpublished',
			at: new Date().toISOString(),
			alertId: id
		});
	},

	async listForMember(caller: Caller, limit = 50) {
		const canSeeMembers = !!caller.userId;
		if (canSeeMembers) {
			return db
				.select()
				.from(alert)
				.where(eq(alert.status, 'published'))
				.orderBy(desc(alert.publishedAt))
				.limit(limit);
		}
		return db
			.select()
			.from(alert)
			.where(and(eq(alert.status, 'published'), eq(alert.visibility, 'public')))
			.orderBy(desc(alert.publishedAt))
			.limit(limit);
	},

	async listForAdmin(caller: Caller, limit = 100) {
		assertRole(caller, 'owner', 'admin', 'content', 'analyst');
		return db.select().from(alert).orderBy(desc(alert.publishedAt)).limit(limit);
	}
};
