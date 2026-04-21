/**
 * Minimal Stripe REST client. We intentionally avoid the stripe SDK here so that
 * the app runs without an extra dependency during bootstrap — the admin can
 * enter the secret key at runtime via /admin/settings/integrations.
 *
 * This is not a full SDK. It supports the ~5 calls we need for checkout +
 * portal + webhook metadata. Add methods as new course modules need them.
 */

import { settingsService, MissingConfigError } from './services/settings';

const API = 'https://api.stripe.com/v1';

interface StripeError {
	error?: { message?: string; type?: string; code?: string };
}

function formEncode(obj: Record<string, unknown>, prefix = ''): string {
	const parts: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		if (v === undefined || v === null) continue;
		const key = prefix ? `${prefix}[${k}]` : k;
		if (Array.isArray(v)) {
			v.forEach((item, i) => {
				if (typeof item === 'object' && item !== null) {
					parts.push(formEncode(item as Record<string, unknown>, `${key}[${i}]`));
				} else {
					parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
				}
			});
		} else if (typeof v === 'object') {
			parts.push(formEncode(v as Record<string, unknown>, key));
		} else {
			parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
		}
	}
	return parts.filter(Boolean).join('&');
}

async function stripeCall<T>(
	method: string,
	path: string,
	body?: Record<string, unknown>,
	opts?: { idempotencyKey?: string }
): Promise<T> {
	const key = await settingsService.get('STRIPE_SECRET_KEY');
	if (!key) {
		throw new MissingConfigError(
			'Stripe is not configured. Set STRIPE_SECRET_KEY in /admin/settings/integrations.'
		);
	}
	const headers: Record<string, string> = {
		Authorization: `Bearer ${key}`,
		'Stripe-Version': '2024-12-18.acacia'
	};
	if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
	let url = `${API}${path}`;
	let payload: string | undefined;
	if (body && method !== 'GET') {
		payload = formEncode(body);
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
	} else if (body && method === 'GET') {
		const qs = formEncode(body);
		if (qs) url += `?${qs}`;
	}
	const res = await fetch(url, { method, headers, body: payload });
	const json = (await res.json()) as T & StripeError;
	if (!res.ok) {
		const msg = json.error?.message ?? `Stripe ${method} ${path} failed (${res.status})`;
		throw new StripeRequestError(msg, res.status, json.error?.code);
	}
	return json as T;
}

export class StripeRequestError extends Error {
	readonly httpStatus: number;
	readonly code?: string;
	constructor(message: string, httpStatus: number, code?: string) {
		super(message);
		this.name = 'StripeRequestError';
		this.httpStatus = httpStatus;
		this.code = code;
	}
}

export interface StripePrice {
	id: string;
	product: string | { id: string; name: string };
	unit_amount: number | null;
	currency: string;
	recurring?: { interval: 'month' | 'year'; interval_count: number } | null;
	lookup_key?: string | null;
	nickname?: string | null;
	active: boolean;
}

export interface StripeCheckoutSession {
	id: string;
	url: string | null;
	customer: string | null;
	subscription: string | null;
	payment_intent: string | null;
}

export interface StripePortalSession {
	id: string;
	url: string;
}

export interface StripeRefund {
	id: string;
	amount: number;
	currency: string;
	payment_intent: string | null;
	charge: string | null;
	status: string;
}

export interface StripeCustomer {
	id: string;
	email: string | null;
}

export interface StripePaymentIntent {
	id: string;
	status: string;
	client_secret: string | null;
	amount: number;
	currency: string;
	customer: string | null;
}

export interface StripeSubscription {
	id: string;
	status: string;
	customer: string;
	latest_invoice: null | {
		id: string;
		payment_intent: null | string | { id: string; client_secret: string | null; status: string };
	};
}

export const stripe = {
	async listActivePrices(): Promise<StripePrice[]> {
		const res = await stripeCall<{ data: StripePrice[] }>('GET', '/prices', {
			active: 'true',
			expand: ['data.product'],
			limit: 100
		});
		return res.data;
	},

	async createCheckoutSession(params: {
		priceId: string;
		successUrl: string;
		cancelUrl: string;
		mode: 'subscription' | 'payment';
		customerEmail?: string;
		clientReferenceId?: string;
		allowPromotionCodes?: boolean;
		trialDays?: number;
	}): Promise<StripeCheckoutSession> {
		const body: Record<string, unknown> = {
			mode: params.mode,
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			line_items: [{ price: params.priceId, quantity: 1 }],
			allow_promotion_codes: params.allowPromotionCodes ? 'true' : undefined,
			client_reference_id: params.clientReferenceId,
			customer_email: params.customerEmail
		};
		if (params.mode === 'subscription' && params.trialDays) {
			body.subscription_data = { trial_period_days: params.trialDays };
		}
		return stripeCall<StripeCheckoutSession>('POST', '/checkout/sessions', body);
	},

	async createPortalSession(params: {
		customerId: string;
		returnUrl: string;
	}): Promise<StripePortalSession> {
		return stripeCall<StripePortalSession>('POST', '/billing_portal/sessions', {
			customer: params.customerId,
			return_url: params.returnUrl
		});
	},

	async createCustomer(
		params: { email: string; name?: string; metadata?: Record<string, string> },
		opts?: { idempotencyKey?: string }
	): Promise<StripeCustomer> {
		return stripeCall<StripeCustomer>(
			'POST',
			'/customers',
			{ email: params.email, name: params.name, metadata: params.metadata },
			opts
		);
	},

	async createPaymentIntent(
		params: {
			amountCents: number;
			currency: string;
			customerId?: string;
			receiptEmail?: string;
			metadata?: Record<string, string>;
			automaticPaymentMethods?: boolean;
		},
		opts: { idempotencyKey: string }
	): Promise<StripePaymentIntent> {
		const body: Record<string, unknown> = {
			amount: params.amountCents,
			currency: params.currency.toLowerCase(),
			customer: params.customerId,
			receipt_email: params.receiptEmail,
			metadata: params.metadata
		};
		if (params.automaticPaymentMethods !== false) {
			body.automatic_payment_methods = { enabled: 'true' };
		}
		return stripeCall<StripePaymentIntent>('POST', '/payment_intents', body, opts);
	},

	async createSubscription(
		params: {
			customerId: string;
			priceIds: string[];
			metadata?: Record<string, string>;
			trialDays?: number;
		},
		opts: { idempotencyKey: string }
	): Promise<StripeSubscription> {
		const body: Record<string, unknown> = {
			customer: params.customerId,
			items: params.priceIds.map((p) => ({ price: p })),
			payment_behavior: 'default_incomplete',
			payment_settings: { save_default_payment_method: 'on_subscription' },
			expand: ['latest_invoice.payment_intent'],
			metadata: params.metadata,
			trial_period_days: params.trialDays
		};
		return stripeCall<StripeSubscription>('POST', '/subscriptions', body, opts);
	},

	async createRefund(
		params: {
			paymentIntentId: string;
			amountCents?: number;
			reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
			metadata?: Record<string, string>;
		},
		opts: { idempotencyKey: string }
	): Promise<StripeRefund> {
		const body: Record<string, unknown> = {
			payment_intent: params.paymentIntentId,
			amount: params.amountCents,
			reason: params.reason,
			metadata: params.metadata
		};
		return stripeCall<StripeRefund>('POST', '/refunds', body, opts);
	}
};
