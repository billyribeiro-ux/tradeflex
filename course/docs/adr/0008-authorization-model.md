# ADR 0008 — Service-layer authorization (not Postgres RLS)

**Status:** Accepted
**Date:** 2026-04-20

## Context

The course outline (originally Supabase-shaped) leans on Postgres Row Level Security. Our stack is Neon + Drizzle + Better Auth — not Supabase. We need an auth-z model that gives the same guarantees (no unauthorized row access, entitlement-gated content, role-aware mutation) without RLS policies.

## Decision

**Every DB read and write goes through a typed service in `src/lib/server/services/`.** Routes, load functions, remote functions, form actions — none of them touch Drizzle directly. The service enforces:

1. **Identity** — `caller.userId` resolved from the Better Auth session (or `null` for public).
2. **Role** — `caller.roles` looked up in `role_assignment`.
3. **Entitlement** — derived entitlement capabilities for the caller, rebuilt on subscription state changes.
4. **Per-resource predicate** — e.g. "contact belongs to caller's workspace AND caller has `marketing` role or higher."

If any check fails, the service throws `AuthzError` which maps to `403` at the HTTP layer — no silent filter.

**Service shape:**

```ts
// src/lib/server/services/contacts.ts
export const contactsService = {
  async list(caller: Caller, filters: ContactFilters) {
    assertRole(caller, 'marketing', 'admin', 'owner');
    return db.select().from(contact).where(eq(contact.workspaceId, caller.workspaceId));
  },
  async create(caller: Caller, input: NewContact) { … },
  async update(caller: Caller, id: string, patch: ContactPatch) { … },
  async remove(caller: Caller, id: string) { … }
};
```

All services:

- Accept a `Caller` argument first (never infer from globals).
- Return typed rows (inferred from Drizzle schema).
- Emit `audit_event` rows for state-changing ops.
- Swallow no errors.

## Why

- **Stack fit.** Better Auth + Drizzle don't ship an RLS bridge; rolling one is more code than the alternative.
- **Testability.** A service is a plain function; we unit-test with an in-memory DB or a Neon test branch.
- **Readability.** Policies live next to the code that uses them. No "which policy is hiding this row?" debugging.
- **Portability.** If we ever swap DBs (unlikely but cheap to preserve optionality), RLS would be lost anyway.

## Rejected

- **Postgres RLS.** Natural in Supabase, awkward outside. Requires app role management at the DB layer we'd have to invent.
- **CASL / casbin / oso.** Extra abstraction, still needs service layer anyway. Deferred until policy complexity demands it.

## Consequences

- Every module of the course has a "service" page that teaches the pattern explicitly. Module 1's auth-z page walks the reader through the RLS → service-layer pivot so they understand why the outline's "RLS Policies" page became a "service-layer auth-z" page.
- Adding an `audit_event` is a one-liner in every service method — a helper makes it trivial.
- Accidental direct-Drizzle-use from a route is caught by an ESLint rule forbidding imports of `$lib/server/db` outside `$lib/server/services/**`.
