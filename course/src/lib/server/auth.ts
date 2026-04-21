import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

type BetterAuth = ReturnType<typeof betterAuth>;

let _auth: BetterAuth | null = null;

function build(): BetterAuth {
	const githubId = env.GITHUB_CLIENT_ID;
	const githubSecret = env.GITHUB_CLIENT_SECRET;
	return betterAuth({
		baseURL: env.ORIGIN,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'pg' }),
		emailAndPassword: { enabled: true },
		...(githubId && githubSecret
			? { socialProviders: { github: { clientId: githubId, clientSecret: githubSecret } } }
			: {}),
		plugins: [
			sveltekitCookies(getRequestEvent) // must remain last
		]
	});
}

export const auth = new Proxy({} as BetterAuth, {
	get(_t, prop) {
		if (!_auth) _auth = build();
		return (_auth as unknown as Record<string | symbol, unknown>)[prop];
	},
	has(_t, prop) {
		if (!_auth) _auth = build();
		return prop in (_auth as object);
	}
});
