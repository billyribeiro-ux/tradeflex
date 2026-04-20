import { EventEmitter } from 'node:events';

export type NotificationEvent =
	| {
			type: 'alert.published';
			at: string;
			alertId: string;
			symbol: string;
			direction: string;
			kind: string;
			visibility: 'public' | 'members';
	  }
	| { type: 'alert.closed'; at: string; alertId: string; outcome: 'win' | 'loss' | 'scratch' }
	| { type: 'alert.unpublished'; at: string; alertId: string };

// In-process fan-out. Fine for a single Node server and good enough for
// single-instance Vercel deployments. When we scale to multiple instances the
// publisher swaps to a pub/sub transport (Postgres LISTEN/NOTIFY or Redis) —
// subscribers keep this same API.
class NotificationBus extends EventEmitter {
	constructor() {
		super();
		this.setMaxListeners(0);
	}
	publish(evt: NotificationEvent) {
		this.emit('event', evt);
	}
	subscribe(handler: (evt: NotificationEvent) => void) {
		this.on('event', handler);
		return () => this.off('event', handler);
	}
}

export const notificationBus = new NotificationBus();
