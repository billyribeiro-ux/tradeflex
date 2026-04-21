import type { Cookies } from '@sveltejs/kit';
import { stripe, type StripePrice } from '$lib/server/stripe';

const COOKIE = 'tf_cart';
const COOKIE_OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: true,
	maxAge: 60 * 60 * 24 * 30
};
const MAX_ITEMS = 10;
const MAX_QTY = 5;

export interface CartItem {
	priceId: string;
	qty: number;
}

export interface PricedLine extends CartItem {
	productName: string;
	interval: 'month' | 'year' | 'one_time';
	unitAmountCents: number;
	lineTotalCents: number;
	currency: string;
}

export interface CartSummary {
	items: PricedLine[];
	currency: string;
	dueTodayCents: number;
	recurringMonthlyCents: number;
	recurringYearlyCents: number;
	oneTimeCents: number;
	empty: boolean;
}

function parse(raw: string | undefined): CartItem[] {
	if (!raw) return [];
	try {
		const v = JSON.parse(raw) as unknown;
		if (!Array.isArray(v)) return [];
		return v
			.filter(
				(x): x is CartItem =>
					x != null &&
					typeof x === 'object' &&
					typeof (x as CartItem).priceId === 'string' &&
					typeof (x as CartItem).qty === 'number'
			)
			.slice(0, MAX_ITEMS)
			.map((x) => ({
				priceId: x.priceId,
				qty: Math.max(1, Math.min(MAX_QTY, Math.floor(x.qty)))
			}));
	} catch {
		return [];
	}
}

function serialize(items: CartItem[]): string {
	return JSON.stringify(items);
}

function coalesce(items: CartItem[]): CartItem[] {
	const byId = new Map<string, number>();
	for (const i of items) byId.set(i.priceId, (byId.get(i.priceId) ?? 0) + i.qty);
	return [...byId.entries()].map(([priceId, qty]) => ({
		priceId,
		qty: Math.max(1, Math.min(MAX_QTY, qty))
	}));
}

export const cartService = {
	read(cookies: Cookies): CartItem[] {
		return parse(cookies.get(COOKIE));
	},

	write(cookies: Cookies, items: CartItem[]) {
		const normalized = coalesce(items).slice(0, MAX_ITEMS);
		if (normalized.length === 0) {
			cookies.delete(COOKIE, { path: '/' });
			return [];
		}
		cookies.set(COOKIE, serialize(normalized), COOKIE_OPTS);
		return normalized;
	},

	add(cookies: Cookies, item: CartItem) {
		const items = parse(cookies.get(COOKIE));
		items.push(item);
		return cartService.write(cookies, items);
	},

	remove(cookies: Cookies, priceId: string) {
		const items = parse(cookies.get(COOKIE)).filter((i) => i.priceId !== priceId);
		return cartService.write(cookies, items);
	},

	clear(cookies: Cookies) {
		cookies.delete(COOKIE, { path: '/' });
	},

	async summarize(items: CartItem[]): Promise<CartSummary> {
		if (items.length === 0) return emptySummary();
		let prices: StripePrice[];
		try {
			prices = await stripe.listActivePrices();
		} catch {
			return emptySummary();
		}
		const byId = new Map(prices.map((p) => [p.id, p]));

		const lines: PricedLine[] = [];
		for (const it of items) {
			const p = byId.get(it.priceId);
			if (!p || !p.active) continue;
			const unit = p.unit_amount ?? 0;
			const productName = typeof p.product === 'string' ? p.product : (p.product?.name ?? 'Item');
			const interval = p.recurring ? p.recurring.interval : 'one_time';
			lines.push({
				priceId: p.id,
				qty: it.qty,
				productName,
				interval,
				unitAmountCents: unit,
				lineTotalCents: unit * it.qty,
				currency: p.currency.toUpperCase()
			});
		}

		const currency = lines[0]?.currency ?? 'USD';
		const monthly = lines
			.filter((l) => l.interval === 'month')
			.reduce((s, l) => s + l.lineTotalCents, 0);
		const yearly = lines
			.filter((l) => l.interval === 'year')
			.reduce((s, l) => s + l.lineTotalCents, 0);
		const oneTime = lines
			.filter((l) => l.interval === 'one_time')
			.reduce((s, l) => s + l.lineTotalCents, 0);

		return {
			items: lines,
			currency,
			dueTodayCents: monthly + yearly + oneTime,
			recurringMonthlyCents: monthly,
			recurringYearlyCents: yearly,
			oneTimeCents: oneTime,
			empty: lines.length === 0
		};
	}
};

function emptySummary(): CartSummary {
	return {
		items: [],
		currency: 'USD',
		dueTodayCents: 0,
		recurringMonthlyCents: 0,
		recurringYearlyCents: 0,
		oneTimeCents: 0,
		empty: true
	};
}
