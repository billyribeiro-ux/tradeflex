import { eq } from 'drizzle-orm';
import { put, del } from '@vercel/blob';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { assertAuthenticated, type Caller } from '$lib/server/authz/caller';
import { settingsService } from './settings';
import { writeAudit } from './audit';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export class AvatarError extends Error {
	readonly httpStatus: number;
	constructor(message: string, httpStatus = 400) {
		super(message);
		this.name = 'AvatarError';
		this.httpStatus = httpStatus;
	}
}

export const avatarsService = {
	async upload(caller: Caller, file: File): Promise<string> {
		assertAuthenticated(caller);
		if (!ALLOWED_TYPES.has(file.type)) {
			throw new AvatarError('Avatar must be PNG, JPEG, or WebP.');
		}
		if (file.size > MAX_BYTES) {
			throw new AvatarError('Avatar must be under 2 MB.');
		}
		const token = await settingsService.require('BLOB_READ_WRITE_TOKEN');

		const ext = file.type.split('/')[1] ?? 'bin';
		const pathname = `avatars/${caller.userId}/${Date.now()}.${ext}`;
		const { url } = await put(pathname, file, {
			access: 'public',
			contentType: file.type,
			addRandomSuffix: false,
			token
		});

		const existing = await db
			.select({ avatarBlobKey: profile.avatarBlobKey })
			.from(profile)
			.where(eq(profile.userId, caller.userId))
			.limit(1);
		const priorUrl = existing[0]?.avatarBlobKey;

		await db
			.insert(profile)
			.values({ userId: caller.userId, avatarBlobKey: url })
			.onConflictDoUpdate({
				target: profile.userId,
				set: { avatarBlobKey: url, updatedAt: new Date() }
			});

		if (priorUrl && priorUrl !== url) {
			try {
				await del(priorUrl, { token });
			} catch {
				// best-effort; don't block the upload on cleanup failure
			}
		}

		await writeAudit(caller, {
			action: 'profile.avatar.upload',
			targetKind: 'profile',
			targetId: caller.userId,
			metadata: { bytes: file.size, contentType: file.type }
		});

		return url;
	},

	async remove(caller: Caller): Promise<void> {
		assertAuthenticated(caller);
		const rows = await db
			.select({ avatarBlobKey: profile.avatarBlobKey })
			.from(profile)
			.where(eq(profile.userId, caller.userId))
			.limit(1);
		const url = rows[0]?.avatarBlobKey;
		if (!url) return;
		const token = await settingsService.require('BLOB_READ_WRITE_TOKEN');

		await db
			.update(profile)
			.set({ avatarBlobKey: null, updatedAt: new Date() })
			.where(eq(profile.userId, caller.userId));

		try {
			await del(url, { token });
		} catch {
			// orphaned blob is acceptable; the DB is authoritative
		}

		await writeAudit(caller, {
			action: 'profile.avatar.remove',
			targetKind: 'profile',
			targetId: caller.userId,
			metadata: {}
		});
	}
};
