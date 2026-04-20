import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { supportTicket, supportTicketMessage, user } from '$lib/server/db/schema';
import { assertAuthenticated, assertRole, AuthzError, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';
import { resendService } from './resend';
import { MissingConfigError } from './settings';
import { log } from '$lib/server/log';

export type SupportTicketRow = typeof supportTicket.$inferSelect;
export type SupportTicketMessageRow = typeof supportTicketMessage.$inferSelect;

export const TICKET_CATEGORIES = ['billing', 'access', 'bug', 'feature', 'other'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF_ROLES = ['owner', 'admin', 'support'] as const;

export class SupportError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'SupportError';
		this.httpStatus = httpStatus;
	}
}

function isStaff(caller: Caller): boolean {
	return caller.roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
}

async function sendMemberReplyEmail(
	ticket: SupportTicketRow,
	body: string,
	staffCaller: Caller
): Promise<void> {
	const text =
		`We replied to your Trade Flex support ticket.\n\n` +
		`Ticket: ${ticket.subject}\n\n` +
		`${body}\n\n` +
		`— Trade Flex support\n` +
		`Reply to this email or visit /account/support to continue the conversation.`;
	try {
		const r = await resendService.send({
			to: ticket.contactEmail,
			subject: `Re: ${ticket.subject}`,
			text,
			tags: [
				{ name: 'kind', value: 'support_reply' },
				{ name: 'ticket', value: ticket.id },
				{ name: 'actor', value: staffCaller.userId ?? 'unknown' }
			]
		});
		if (!r.sent) log.warn('support.reply.email_not_sent', { reason: r.error });
	} catch (err) {
		if (err instanceof MissingConfigError) {
			log.info('support.reply.email_skipped_no_key');
			return;
		}
		log.warn('support.reply.email_exception', {
			reason: err instanceof Error ? err.message : String(err)
		});
	}
}

export interface CreateParams {
	subject: string;
	body: string;
	category?: TicketCategory;
	contactEmail?: string;
}

export const supportService = {
	async create(caller: Caller, params: CreateParams): Promise<SupportTicketRow> {
		const subject = params.subject.trim();
		const body = params.body.trim();
		if (subject.length < 3) throw new SupportError('subject too short');
		if (body.length < 10) throw new SupportError('description too short');

		let contactEmail = params.contactEmail?.trim().toLowerCase() ?? '';
		let subjectUserId: string | null = null;

		if (caller.userId) {
			subjectUserId = caller.userId;
			if (!contactEmail) {
				const [u] = await db
					.select({ email: user.email })
					.from(user)
					.where(eq(user.id, caller.userId))
					.limit(1);
				contactEmail = u?.email?.toLowerCase() ?? '';
			}
		}
		if (!EMAIL_RE.test(contactEmail)) {
			throw new SupportError('contact email required');
		}

		const category: TicketCategory = TICKET_CATEGORIES.includes(
			(params.category ?? 'other') as TicketCategory
		)
			? (params.category as TicketCategory)
			: 'other';

		const id = crypto.randomUUID();
		const [row] = await db
			.insert(supportTicket)
			.values({
				id,
				subjectUserId,
				contactEmail,
				subject,
				category,
				priority: 'normal',
				status: 'open'
			})
			.returning();

		await db.insert(supportTicketMessage).values({
			id: crypto.randomUUID(),
			ticketId: id,
			authorUserId: caller.userId ?? null,
			authorKind: caller.userId ? 'member' : 'anonymous',
			visibility: 'public',
			body
		});

		await writeAudit(caller, {
			action: 'support.ticket.create',
			targetKind: 'support_ticket',
			targetId: id,
			metadata: { subject, category }
		});

		return row;
	},

	async listForAdmin(
		caller: Caller,
		opts: { status?: TicketStatus; limit?: number } = {}
	): Promise<SupportTicketRow[]> {
		assertRole(caller, 'owner', 'admin', 'support');
		const limit = Math.min(opts.limit ?? 100, 500);
		const where = opts.status ? eq(supportTicket.status, opts.status) : undefined;
		const q = db.select().from(supportTicket);
		return where
			? q.where(where).orderBy(desc(supportTicket.updatedAt)).limit(limit)
			: q.orderBy(desc(supportTicket.updatedAt)).limit(limit);
	},

	async listForCaller(caller: Caller): Promise<SupportTicketRow[]> {
		assertAuthenticated(caller);
		return db
			.select()
			.from(supportTicket)
			.where(eq(supportTicket.subjectUserId, caller.userId))
			.orderBy(desc(supportTicket.updatedAt));
	},

	async getWithMessages(
		caller: Caller,
		id: string
	): Promise<{ ticket: SupportTicketRow; messages: SupportTicketMessageRow[] }> {
		const [ticket] = await db.select().from(supportTicket).where(eq(supportTicket.id, id)).limit(1);
		if (!ticket) throw new SupportError('not found', 404);

		const staff = isStaff(caller);
		if (!staff) {
			assertAuthenticated(caller);
			if (ticket.subjectUserId !== caller.userId) throw new AuthzError('not your ticket');
		}

		const messages = await db
			.select()
			.from(supportTicketMessage)
			.where(
				staff
					? eq(supportTicketMessage.ticketId, id)
					: and(
							eq(supportTicketMessage.ticketId, id),
							eq(supportTicketMessage.visibility, 'public')
						)
			)
			.orderBy(supportTicketMessage.createdAt);

		return { ticket, messages };
	},

	async addMessage(
		caller: Caller,
		params: { ticketId: string; body: string; visibility?: 'public' | 'internal' }
	): Promise<SupportTicketMessageRow> {
		const body = params.body.trim();
		if (body.length < 1) throw new SupportError('empty message');

		const [ticket] = await db
			.select()
			.from(supportTicket)
			.where(eq(supportTicket.id, params.ticketId))
			.limit(1);
		if (!ticket) throw new SupportError('not found', 404);

		const staff = isStaff(caller);
		if (!staff) {
			assertAuthenticated(caller);
			if (ticket.subjectUserId !== caller.userId) throw new AuthzError('not your ticket');
			if (params.visibility === 'internal') throw new AuthzError('members cannot post internal');
		}

		const visibility = staff ? (params.visibility ?? 'public') : 'public';
		const authorKind = staff ? 'staff' : 'member';

		const id = crypto.randomUUID();
		const [row] = await db
			.insert(supportTicketMessage)
			.values({
				id,
				ticketId: params.ticketId,
				authorUserId: caller.userId ?? null,
				authorKind,
				visibility,
				body
			})
			.returning();

		// Staff reply on an open ticket bumps status forward.
		const shouldBumpStatus = staff && visibility === 'public' && ticket.status === 'open';
		await db
			.update(supportTicket)
			.set({
				updatedAt: new Date(),
				status: shouldBumpStatus ? 'in_progress' : ticket.status
			})
			.where(eq(supportTicket.id, params.ticketId));

		await writeAudit(caller, {
			action: 'support.ticket.message',
			targetKind: 'support_ticket',
			targetId: params.ticketId,
			metadata: { visibility, authorKind }
		});

		if (staff && visibility === 'public') {
			await sendMemberReplyEmail(ticket, body, caller);
		}

		return row;
	},

	async setStatus(
		caller: Caller,
		params: { ticketId: string; status: TicketStatus }
	): Promise<void> {
		assertRole(caller, 'owner', 'admin', 'support');
		if (!TICKET_STATUSES.includes(params.status)) throw new SupportError('invalid status');
		const now = new Date();
		await db
			.update(supportTicket)
			.set({
				status: params.status,
				updatedAt: now,
				resolvedAt: params.status === 'resolved' ? now : null,
				closedAt: params.status === 'closed' ? now : null
			})
			.where(eq(supportTicket.id, params.ticketId));
		await writeAudit(caller, {
			action: 'support.ticket.status',
			targetKind: 'support_ticket',
			targetId: params.ticketId,
			metadata: { status: params.status }
		});
	},

	async setPriority(
		caller: Caller,
		params: { ticketId: string; priority: TicketPriority }
	): Promise<void> {
		assertRole(caller, 'owner', 'admin', 'support');
		if (!TICKET_PRIORITIES.includes(params.priority)) throw new SupportError('invalid priority');
		await db
			.update(supportTicket)
			.set({ priority: params.priority, updatedAt: new Date() })
			.where(eq(supportTicket.id, params.ticketId));
		await writeAudit(caller, {
			action: 'support.ticket.priority',
			targetKind: 'support_ticket',
			targetId: params.ticketId,
			metadata: { priority: params.priority }
		});
	}
};
