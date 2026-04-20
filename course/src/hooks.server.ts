import type { Handle, HandleServerError } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { anonymousCaller } from '$lib/server/authz/caller';
import { resolveCaller } from '$lib/server/authz/resolve-caller';
import { impersonationService, IMPERSONATION_COOKIE } from '$lib/server/services/impersonation';
import { log, reportError } from '$lib/server/log';

function newRequestId(): string {
	return crypto.randomUUID();
}

const handleRequestId: Handle = async ({ event, resolve }) => {
	const incoming = event.request.headers.get('x-request-id');
	const requestId = incoming && /^[a-zA-Z0-9-]{8,128}$/.test(incoming) ? incoming : newRequestId();
	event.locals.requestId = requestId;
	event.locals.caller = anonymousCaller(requestId);
	const response = await resolve(event);
	response.headers.set('x-request-id', requestId);
	return response;
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};

const handleCaller: Handle = async ({ event, resolve }) => {
	const realUserId = event.locals.user?.id ?? null;
	const impCookie = event.cookies.get(IMPERSONATION_COOKIE);
	let effectiveUserId = realUserId;
	let impersonatorUserId: string | null = null;
	if (realUserId && impCookie) {
		const row = await impersonationService.resolveFromCookie(realUserId, impCookie);
		if (row) {
			effectiveUserId = row.targetUserId;
			impersonatorUserId = realUserId;
		} else {
			// Cookie is stale/revoked/expired — clear it so the admin sees a clean UI.
			event.cookies.delete(IMPERSONATION_COOKIE, { path: '/' });
		}
	}
	event.locals.caller = await resolveCaller(
		effectiveUserId,
		event.locals.requestId,
		impersonatorUserId
	);
	return resolve(event);
};

const handleLogging: Handle = async ({ event, resolve }) => {
	const start = performance.now();
	const { method } = event.request;
	const path = event.url.pathname;
	try {
		const response = await resolve(event);
		const latencyMs = Math.round(performance.now() - start);
		log.info('http', {
			requestId: event.locals.requestId,
			userId: event.locals.caller?.userId ?? null,
			method,
			path,
			status: response.status,
			latencyMs
		});
		return response;
	} catch (err) {
		const latencyMs = Math.round(performance.now() - start);
		reportError(err, {
			requestId: event.locals.requestId,
			userId: event.locals.caller?.userId ?? null,
			method,
			path,
			latencyMs
		});
		throw err;
	}
};

function sequence(...handlers: Handle[]): Handle {
	return handlers.reduce(
		(acc, h) =>
			async ({ event, resolve }) =>
				acc({ event, resolve: (ev) => h({ event: ev, resolve }) })
	);
}

export const handle: Handle = sequence(
	handleRequestId,
	handleLogging,
	handleBetterAuth,
	handleCaller
);

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId ?? 'unknown';
	reportError(error, {
		requestId,
		userId: event.locals.caller?.userId ?? null,
		method: event.request.method,
		path: event.url.pathname,
		status
	});
	return { message: status >= 500 ? 'Internal error' : message, requestId };
};
