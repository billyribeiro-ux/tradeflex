import type { RequestHandler } from './$types';
import { notificationBus, type NotificationEvent } from '$lib/server/events/bus';

// Server-Sent Events stream. One connection per tab. Heartbeats every 20s keep
// intermediaries from closing the socket. The client reconnects automatically
// on failure (EventSource default). Requires an authenticated session — the
// admin bell and the member toast both consume this same stream and filter
// client-side by role.
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.caller.userId) {
		return new Response('authentication required', { status: 401 });
	}

	let unsubscribe: (() => void) | null = null;
	let heartbeat: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const encoder = new TextEncoder();
			const send = (data: string) => {
				try {
					controller.enqueue(encoder.encode(data));
				} catch {
					// controller closed — nothing to do
				}
			};

			send(`retry: 5000\n\n`);
			send(`: connected ${new Date().toISOString()}\n\n`);

			unsubscribe = notificationBus.subscribe((evt: NotificationEvent) => {
				send(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`);
			});

			heartbeat = setInterval(() => send(`: heartbeat ${Date.now()}\n\n`), 20_000);
		},
		cancel() {
			unsubscribe?.();
			if (heartbeat) clearInterval(heartbeat);
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'x-accel-buffering': 'no'
		}
	});
};
