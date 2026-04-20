import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthzError, type Caller, type Role } from '$lib/server/authz/caller';
import { RefundStateError } from './refunds';

// The service talks to the DB + Stripe. We stub both at the module boundary so
// the two-person invariant can be exercised as a pure decision function.
//
// Shape of what we stub:
// - db.select()...for('update') → returns a single row
// - db.insert().values().returning() → returns [row]
// - db.update().set().where().returning() → returns [row]
// - db.transaction(fn) → calls fn with the same stubbed `tx`
// - stripe.createRefund → resolves to a fake refund

type Row = {
	id: string;
	stripePaymentIntentId: string;
	amountCents: number;
	currency: string;
	reason: string;
	status: 'pending' | 'approved' | 'denied' | 'failed';
	requestedByUserId: string;
	requestedAt: Date;
	decidedByUserId: string | null;
	decidedAt: Date | null;
	decisionNote: string | null;
	stripeRefundId: string | null;
	idempotencyKey: string;
	stripeChargeId: string | null;
	stripeCustomerId: string | null;
	subjectUserId: string | null;
};

const hoisted = vi.hoisted(() => {
	const state = { currentRow: null as unknown };
	const stripeCreateRefund = vi.fn();
	return { state, stripeCreateRefund };
});

vi.mock('$lib/server/db', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const makeQueryChain = (finalRows: () => unknown[]): any => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const chain: Record<string, any> = {};
		const methods = [
			'select',
			'from',
			'where',
			'orderBy',
			'limit',
			'offset',
			'set',
			'values',
			'insert',
			'update',
			'delete',
			'for',
			'onConflictDoUpdate'
		];
		for (const m of methods) chain[m] = () => chain;
		chain.returning = () => finalRows();
		chain.then = (resolve: (v: unknown) => unknown) => resolve(finalRows());
		return chain;
	};

	const rows = () => (hoisted.state.currentRow ? [hoisted.state.currentRow] : []);
	const db = {
		select: () => makeQueryChain(rows),
		insert: () => makeQueryChain(rows),
		update: () => makeQueryChain(rows),
		transaction: async (fn: (tx: unknown) => unknown) => fn(db)
	};
	return { db };
});

vi.mock('$lib/server/stripe', () => ({
	stripe: { createRefund: hoisted.stripeCreateRefund },
	StripeRequestError: class StripeRequestError extends Error {
		httpStatus = 402;
	}
}));

// Now import after mocks are wired.
const { refundsService } = await import('./refunds');

const makeCaller = (userId: string, roles: readonly Role[] = ['finance']): Caller => ({
	userId,
	roles,
	entitlements: [],
	impersonatorUserId: null,
	requestId: 'req-test'
});

const basePending = (): Row => ({
	id: 'rr_1',
	stripePaymentIntentId: 'pi_test',
	amountCents: 1000,
	currency: 'usd',
	reason: 'customer asked',
	status: 'pending',
	requestedByUserId: 'user_a',
	requestedAt: new Date(),
	decidedByUserId: null,
	decidedAt: null,
	decisionNote: null,
	stripeRefundId: null,
	idempotencyKey: 'refund:rr_1',
	stripeChargeId: null,
	stripeCustomerId: null,
	subjectUserId: null
});

describe('refundsService — two-person rule', () => {
	beforeEach(() => {
		hoisted.state.currentRow = basePending();
		hoisted.stripeCreateRefund.mockReset();
		hoisted.stripeCreateRefund.mockResolvedValue({
			id: 're_123',
			amount: 1000,
			currency: 'usd',
			payment_intent: 'pi_test',
			charge: 'ch_test',
			status: 'succeeded'
		});
	});

	it('blocks the requester from approving their own refund', async () => {
		const requester = makeCaller('user_a');
		await expect(refundsService.approve(requester, { id: 'rr_1' })).rejects.toBeInstanceOf(
			AuthzError
		);
		expect(hoisted.stripeCreateRefund).not.toHaveBeenCalled();
	});

	it('blocks the requester from denying their own refund', async () => {
		const requester = makeCaller('user_a');
		await expect(
			refundsService.deny(requester, { id: 'rr_1', note: 'changed mind' })
		).rejects.toBeInstanceOf(AuthzError);
	});

	it('allows a different approver to approve', async () => {
		const approver = makeCaller('user_b', ['finance']);
		await refundsService.approve(approver, { id: 'rr_1' });
		expect(hoisted.stripeCreateRefund).toHaveBeenCalledTimes(1);
		expect(hoisted.stripeCreateRefund).toHaveBeenCalledWith(
			expect.objectContaining({ paymentIntentId: 'pi_test', amountCents: 1000 }),
			{ idempotencyKey: 'refund:rr_1' }
		);
	});

	it('rejects approval when request is not pending', async () => {
		hoisted.state.currentRow = { ...basePending(), status: 'approved' };
		const approver = makeCaller('user_b');
		await expect(refundsService.approve(approver, { id: 'rr_1' })).rejects.toBeInstanceOf(
			RefundStateError
		);
	});

	it('requires a note to deny', async () => {
		const approver = makeCaller('user_b');
		await expect(refundsService.deny(approver, { id: 'rr_1', note: '' })).rejects.toBeInstanceOf(
			RefundStateError
		);
	});

	it('refuses callers without approver roles', async () => {
		const supportAgent = makeCaller('user_b', ['support']);
		await expect(refundsService.approve(supportAgent, { id: 'rr_1' })).rejects.toThrow(
			/role required/
		);
	});
});
