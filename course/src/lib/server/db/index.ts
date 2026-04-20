import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

function init(): Db {
	if (_db) return _db;
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	const client = postgres(env.DATABASE_URL);
	_db = drizzle(client, { schema });
	return _db;
}

export const db = new Proxy({} as Db, {
	get(_t, prop) {
		const target = init() as unknown as Record<string | symbol, unknown>;
		const value = target[prop];
		return typeof value === 'function'
			? (value as (...a: unknown[]) => unknown).bind(target)
			: value;
	}
});
