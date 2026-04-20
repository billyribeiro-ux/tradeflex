import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailMessage } from '$lib/server/db/schema';
import { assertRole, type Caller } from '$lib/server/authz/caller';
import { writeAudit } from './audit';
import { resendService } from './resend';
import { settingsService, MissingConfigError } from './settings';
import { log } from '$lib/server/log';

export type EmailMessageRow = typeof emailMessage.$inferSelect;

export class EmailError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'EmailError';
		this.httpStatus = httpStatus;
	}
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function threadKeyFor(to: string, subject: string): string {
	const normalisedSubject = subject
		.replace(/^\s*(re|fw|fwd):\s*/i, '')
		.trim()
		.toLowerCase();
	return `${to.toLowerCase()}|${normalisedSubject}`;
}

export interface SendParams {
	to: string;
	subject: string;
	text: string;
}

export interface ThreadSummary {
	threadKey: string;
	toAddress: string;
	subject: string;
	lastAt: Date;
	messageCount: number;
	lastStatus: string;
}

export const emailService = {
	async send(caller: Caller, params: SendParams): Promise<EmailMessageRow> {
		assertRole(caller, 'owner', 'admin', 'support');
		const to = params.to.trim();
		const subject = params.subject.trim();
		const text = params.text.trim();
		if (!EMAIL_RE.test(to)) throw new EmailError('invalid recipient email');
		if (subject.length < 1) throw new EmailError('subject required');
		if (text.length < 1) throw new EmailError('body required');

		let from: string;
		try {
			from =
				(await settingsService.get('RESEND_FROM')) ?? 'Trade Flex <no-reply@send.tradeflex.app>';
		} catch {
			from = 'Trade Flex <no-reply@send.tradeflex.app>';
		}

		const id = crypto.randomUUID();
		const threadKey = threadKeyFor(to, subject);

		let sendResult: Awaited<ReturnType<typeof resendService.send>>;
		try {
			sendResult = await resendService.send({
				to,
				subject,
				text,
				tags: [
					{ name: 'kind', value: 'admin_outbound' },
					{ name: 'actor', value: caller.userId ?? 'unknown' }
				]
			});
		} catch (err) {
			if (err instanceof MissingConfigError) {
				throw new EmailError('Resend API key not configured', 503);
			}
			throw err;
		}

		const [row] = await db
			.insert(emailMessage)
			.values({
				id,
				direction: 'outbound',
				toAddress: to,
				fromAddress: from,
				subject,
				text,
				resendId: sendResult.id ?? null,
				threadKey,
				sentByUserId: caller.userId ?? null,
				status: sendResult.sent ? 'sent' : 'failed',
				errorReason: sendResult.sent ? null : (sendResult.error ?? 'unknown'),
				metadata: {}
			})
			.returning();

		await writeAudit(caller, {
			action: 'email.send',
			targetKind: 'email',
			targetId: id,
			metadata: { to, subject, status: row.status }
		});

		if (!sendResult.sent) {
			log.warn('email.send.not_sent', { reason: sendResult.error });
		}
		return row;
	},

	async listThreads(caller: Caller, opts: { limit?: number } = {}): Promise<ThreadSummary[]> {
		assertRole(caller, 'owner', 'admin', 'support');
		const limit = Math.min(opts.limit ?? 50, 200);
		const rows = await db
			.select({
				threadKey: emailMessage.threadKey,
				toAddress: sql<string>`max(${emailMessage.toAddress})`,
				subject: sql<string>`max(${emailMessage.subject})`,
				lastAt: sql<Date>`max(${emailMessage.createdAt})`,
				messageCount: sql<number>`count(*)::int`,
				lastStatus: sql<string>`(
					select status from ${emailMessage} m2
					where m2.thread_key = ${emailMessage.threadKey}
					order by m2.created_at desc
					limit 1
				)`
			})
			.from(emailMessage)
			.groupBy(emailMessage.threadKey)
			.orderBy(sql`max(${emailMessage.createdAt}) desc`)
			.limit(limit);
		return rows;
	},

	async listThread(caller: Caller, threadKey: string): Promise<EmailMessageRow[]> {
		assertRole(caller, 'owner', 'admin', 'support');
		return db
			.select()
			.from(emailMessage)
			.where(eq(emailMessage.threadKey, threadKey))
			.orderBy(desc(emailMessage.createdAt));
	}
};
