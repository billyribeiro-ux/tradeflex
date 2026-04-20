export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
	id: string;
	kind: ToastKind;
	message: string;
	expiresAt: number;
}

const toasts = $state<Toast[]>([]);

function schedulePrune(id: string, ms: number) {
	if (typeof window === 'undefined') return;
	window.setTimeout(() => {
		const idx = toasts.findIndex((t) => t.id === id);
		if (idx !== -1) toasts.splice(idx, 1);
	}, ms);
}

export const toast = {
	get list() {
		return toasts;
	},
	push(kind: ToastKind, message: string, ttlMs = 4000) {
		const id = crypto.randomUUID();
		toasts.push({ id, kind, message, expiresAt: Date.now() + ttlMs });
		schedulePrune(id, ttlMs);
		return id;
	},
	info(message: string, ttlMs?: number) {
		return this.push('info', message, ttlMs);
	},
	success(message: string, ttlMs?: number) {
		return this.push('success', message, ttlMs);
	},
	error(message: string, ttlMs?: number) {
		return this.push('error', message, ttlMs ?? 6000);
	},
	dismiss(id: string) {
		const idx = toasts.findIndex((t) => t.id === id);
		if (idx !== -1) toasts.splice(idx, 1);
	}
};
