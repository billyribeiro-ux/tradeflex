import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { z } from 'zod';

const serverSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres URL'),
	DATABASE_URL_DIRECT: z.string().url().optional(),
	BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
	APP_ENCRYPTION_KEY: z
		.string()
		.regex(/^[0-9a-f]{64}$/i, 'APP_ENCRYPTION_KEY must be 32 bytes hex-encoded (64 chars)')
		.optional(),
	ORIGIN: z.string().url().default('http://localhost:5173'),
	GITHUB_CLIENT_ID: z.string().optional(),
	GITHUB_CLIENT_SECRET: z.string().optional(),
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),
	RESEND_API_KEY: z.string().optional(),
	BUNNY_STREAM_LIBRARY_ID: z.string().optional(),
	BUNNY_STREAM_API_KEY: z.string().optional(),
	BUNNY_TOKEN_AUTH_KEY: z.string().optional()
});

const publicSchema = z.object({
	PUBLIC_APP_NAME: z.string().default('Trade Flex'),
	PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional()
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

function parseOrDie<T>(
	name: string,
	schema: z.ZodType<T>,
	raw: Record<string, string | undefined>
): T {
	const result = schema.safeParse(raw);
	if (!result.success) {
		const formatted = result.error.issues
			.map((i) => `  • ${i.path.join('.') || '<root>'}: ${i.message}`)
			.join('\n');
		throw new Error(`[env] ${name} failed validation:\n${formatted}`);
	}
	return result.data;
}

let _env: ServerEnv | null = null;
let _pub: PublicEnv | null = null;

function lazyProxy<T extends object>(resolve: () => T): T {
	return new Proxy({} as T, {
		get(_t, prop) {
			const target = resolve() as unknown as Record<string | symbol, unknown>;
			return target[prop];
		},
		has(_t, prop) {
			const target = resolve() as unknown as Record<string | symbol, unknown>;
			return prop in target;
		},
		ownKeys() {
			return Reflect.ownKeys(resolve() as object);
		},
		getOwnPropertyDescriptor(_t, prop) {
			return Reflect.getOwnPropertyDescriptor(resolve() as object, prop);
		}
	});
}

export const env: ServerEnv = lazyProxy(() => {
	if (!_env) _env = parseOrDie('server env', serverSchema, privateEnv);
	return _env;
});

export const pub: PublicEnv = lazyProxy(() => {
	if (!_pub) _pub = parseOrDie('public env', publicSchema, publicEnv);
	return _pub;
});
