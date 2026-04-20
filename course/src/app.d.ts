import type { User, Session } from 'better-auth/minimal';
import type { Caller } from '$lib/server/authz/caller';

declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			caller: Caller;
			requestId: string;
		}

		interface Error {
			message: string;
			requestId?: string;
		}
	}
}

export {};
