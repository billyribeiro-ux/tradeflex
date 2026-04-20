import { Resend } from 'resend';
import { settingsService } from './settings';
import { log } from '$lib/server/log';

export class ResendError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 502) {
		super(message);
		this.name = 'ResendError';
		this.httpStatus = httpStatus;
	}
}

export interface SendEmailInput {
	to: string | string[];
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
	tags?: { name: string; value: string }[];
}

const DEFAULT_FROM = 'Trade Flex <no-reply@send.tradeflex.app>';

async function client(): Promise<Resend> {
	const key = await settingsService.require('RESEND_API_KEY');
	return new Resend(key);
}

export const resendService = {
	/**
	 * Sends a transactional email. Swallows Resend errors into structured logs
	 * so a failed send never breaks the caller's flow (e.g. deletion request
	 * still succeeds even if the confirmation email bounces).
	 */
	async send(input: SendEmailInput): Promise<{ sent: boolean; id?: string; error?: string }> {
		try {
			const from = (await settingsService.get('RESEND_FROM')) ?? DEFAULT_FROM;
			const r = await client();
			const { data, error } = await r.emails.send({
				from,
				to: input.to,
				subject: input.subject,
				text: input.text,
				html: input.html,
				replyTo: input.replyTo,
				tags: input.tags
			});
			if (error) {
				log.warn('resend.send.error', { reason: error.message });
				return { sent: false, error: error.message };
			}
			return { sent: true, id: data?.id };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			log.warn('resend.send.exception', { reason: message });
			return { sent: false, error: message };
		}
	}
};
