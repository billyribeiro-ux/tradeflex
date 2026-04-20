import { db } from '$lib/server/db';
import { auditEvent } from '$lib/server/db/schema';
import type { Caller } from '$lib/server/authz/caller';

export interface AuditEntry {
	action: string;
	targetKind: string;
	targetId?: string | null;
	metadata?: Record<string, unknown>;
}

export async function writeAudit(caller: Caller, entry: AuditEntry) {
	await db.insert(auditEvent).values({
		id: crypto.randomUUID(),
		actorUserId: caller.userId,
		impersonatorUserId: caller.impersonatorUserId ?? null,
		action: entry.action,
		targetKind: entry.targetKind,
		targetId: entry.targetId ?? null,
		metadata: { requestId: caller.requestId, ...(entry.metadata ?? {}) }
	});
}
