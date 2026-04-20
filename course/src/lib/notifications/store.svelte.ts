export interface Notification {
	id: string;
	type: 'alert.published' | 'alert.closed' | 'alert.unpublished';
	at: string;
	title: string;
	body: string;
	href?: string;
	read: boolean;
}

const MAX_KEEP = 50;

const items = $state<Notification[]>([]);
let connected = $state(false);
let source: EventSource | null = null;

function push(n: Omit<Notification, 'id' | 'read'>) {
	items.unshift({ ...n, id: crypto.randomUUID(), read: false });
	if (items.length > MAX_KEEP) items.length = MAX_KEEP;
}

function handleEvent(type: Notification['type'], raw: string) {
	try {
		const payload = JSON.parse(raw);
		if (type === 'alert.published') {
			push({
				type,
				at: payload.at,
				title: `New alert: ${payload.symbol}`,
				body: `${payload.direction} ${payload.kind}`,
				href: '/admin/alerts'
			});
		} else if (type === 'alert.closed') {
			push({
				type,
				at: payload.at,
				title: `Alert closed`,
				body: `outcome: ${payload.outcome}`,
				href: '/admin/alerts'
			});
		} else if (type === 'alert.unpublished') {
			push({
				type,
				at: payload.at,
				title: `Alert unpublished`,
				body: payload.alertId,
				href: '/admin/alerts'
			});
		}
	} catch {
		// malformed payload — skip silently
	}
}

export const notifications = {
	get list() {
		return items;
	},
	get unreadCount() {
		return items.filter((n) => !n.read).length;
	},
	get connected() {
		return connected;
	},
	markAllRead() {
		for (const n of items) n.read = true;
	},
	clear() {
		items.length = 0;
	},
	connect() {
		if (typeof window === 'undefined' || source) return;
		source = new EventSource('/api/notifications/stream');
		source.addEventListener('open', () => (connected = true));
		source.addEventListener('error', () => (connected = false));
		for (const t of ['alert.published', 'alert.closed', 'alert.unpublished'] as const) {
			source.addEventListener(t, (e) => handleEvent(t, (e as MessageEvent).data));
		}
	},
	disconnect() {
		source?.close();
		source = null;
		connected = false;
	}
};
