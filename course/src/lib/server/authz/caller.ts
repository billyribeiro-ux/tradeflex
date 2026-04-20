export type Role =
	| 'owner'
	| 'admin'
	| 'support'
	| 'content'
	| 'finance'
	| 'analyst'
	| 'read_only';

export interface Caller {
	userId: string | null;
	roles: readonly Role[];
	entitlements: readonly string[];
	impersonatorUserId?: string | null;
	requestId: string;
}

export const anonymousCaller = (requestId: string): Caller => ({
	userId: null,
	roles: [],
	entitlements: [],
	impersonatorUserId: null,
	requestId
});

export class AuthzError extends Error {
	readonly httpStatus = 403;
	constructor(message = 'forbidden') {
		super(message);
		this.name = 'AuthzError';
	}
}

export class AuthnError extends Error {
	readonly httpStatus = 401;
	constructor(message = 'authentication required') {
		super(message);
		this.name = 'AuthnError';
	}
}

export function assertAuthenticated(
	caller: Caller
): asserts caller is Caller & { userId: string } {
	if (!caller.userId) throw new AuthnError();
}

export function assertRole(caller: Caller, ...allowed: Role[]) {
	assertAuthenticated(caller);
	if (!caller.roles.some((r) => allowed.includes(r))) {
		throw new AuthzError(`role required: ${allowed.join(' | ')}`);
	}
}

export function hasEntitlement(caller: Caller, capability: string): boolean {
	return caller.entitlements.includes(capability);
}

export function assertEntitlement(caller: Caller, capability: string) {
	assertAuthenticated(caller);
	if (!hasEntitlement(caller, capability)) {
		throw new AuthzError(`entitlement required: ${capability}`);
	}
}
