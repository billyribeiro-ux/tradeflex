import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { setting } from '$lib/server/db/schema';
import { env } from '$lib/server/env';
import { assertRole, type Caller } from '$lib/server/authz/caller';
import { encrypt, decrypt, mask } from '$lib/server/crypto';
import { writeAudit } from './audit';

const cache = new Map<string, { value: string; cachedAt: number }>();
const CACHE_TTL_MS = 60_000;

function envFallback(key: string): string | undefined {
	return (env as Record<string, string | undefined>)[key];
}

export const settingsService = {
	async get(key: string): Promise<string | undefined> {
		const cached = cache.get(key);
		if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.value;

		const rows = await db.select().from(setting).where(eq(setting.key, key)).limit(1);
		const row = rows[0];

		if (row) {
			let value: string | undefined;
			if (row.encrypted && row.valueCiphertext && row.valueIv) {
				value = await decrypt({
					ciphertext: row.valueCiphertext,
					iv: row.valueIv,
					aad: row.valueAad ?? undefined
				});
			} else if (row.valuePlain != null) {
				value = row.valuePlain;
			}
			if (value !== undefined) {
				cache.set(key, { value, cachedAt: Date.now() });
				return value;
			}
		}

		const fallback = envFallback(key);
		if (fallback) cache.set(key, { value: fallback, cachedAt: Date.now() });
		return fallback;
	},

	async require(key: string): Promise<string> {
		const v = await this.get(key);
		if (!v) {
			throw new MissingConfigError(
				`Setting "${key}" is not configured. Set it in /admin/settings/integrations or in the environment.`
			);
		}
		return v;
	},

	async listMasked(caller: Caller) {
		assertRole(caller, 'owner', 'admin');
		const rows = await db.select().from(setting);
		return rows.map((r) => ({
			key: r.key,
			encrypted: r.encrypted,
			mask: r.valueMask ?? null,
			updatedAt: r.updatedAt,
			updatedByUserId: r.updatedByUserId
		}));
	},

	async setEncrypted(caller: Caller, key: string, plaintext: string): Promise<void> {
		assertRole(caller, 'owner');
		const blob = await encrypt(plaintext, `setting:${key}`);
		await db
			.insert(setting)
			.values({
				key,
				valueCiphertext: blob.ciphertext,
				valueIv: blob.iv,
				valueAad: blob.aad,
				valueMask: mask(plaintext),
				encrypted: true,
				updatedByUserId: caller.userId,
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: setting.key,
				set: {
					valueCiphertext: blob.ciphertext,
					valueIv: blob.iv,
					valueAad: blob.aad,
					valueMask: mask(plaintext),
					valuePlain: null,
					encrypted: true,
					updatedByUserId: caller.userId,
					updatedAt: new Date()
				}
			});

		cache.delete(key);

		await writeAudit(caller, {
			action: 'setting.write',
			targetKind: 'setting',
			targetId: key,
			metadata: { encrypted: true }
		});
	},

	async setPlain(caller: Caller, key: string, value: string): Promise<void> {
		assertRole(caller, 'owner', 'admin');
		await db
			.insert(setting)
			.values({
				key,
				valuePlain: value,
				valueMask: value,
				encrypted: false,
				updatedByUserId: caller.userId,
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: setting.key,
				set: {
					valuePlain: value,
					valueMask: value,
					valueCiphertext: null,
					valueIv: null,
					valueAad: null,
					encrypted: false,
					updatedByUserId: caller.userId,
					updatedAt: new Date()
				}
			});

		cache.delete(key);

		await writeAudit(caller, {
			action: 'setting.write',
			targetKind: 'setting',
			targetId: key,
			metadata: { encrypted: false }
		});
	},

	invalidateCache(key?: string) {
		if (key) cache.delete(key);
		else cache.clear();
	}
};

export class MissingConfigError extends Error {
	readonly httpStatus = 503;
	constructor(message: string) {
		super(message);
		this.name = 'MissingConfigError';
	}
}
