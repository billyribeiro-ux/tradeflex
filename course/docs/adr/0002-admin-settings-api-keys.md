# ADR 0002 — API keys via admin settings (encrypted at rest)

**Status:** Accepted
**Date:** 2026-04-20

## Context

Trade Flex depends on third-party credentials (Stripe secret, Stripe webhook signing secret, Resend API key, Bunny Stream library key + token origin, GitHub OAuth client secret, Neon prod connection string, etc.). The owner wants to enter these through the admin UI rather than ship-blocking on them at build time. We need a pattern that is:

1. Secure at rest (encryption, not plaintext DB).
2. Bootstrappable from `.env` so local dev isn't blocked.
3. Safe against accidental disclosure (no plaintext back to the client).
4. Rotatable (rotating `APP_ENCRYPTION_KEY` must re-encrypt stored rows).
5. Auditable (every read/write a secret triggers an audit event).

## Decision

Build a `setting` table with two columns for sensitive values: `valueEncrypted` (AES-256-GCM) and `valueMask` (e.g. `sk_live_…••••1234`).

**Resolution order** at runtime:

1. If a `setting` row exists for the key and is not marked disabled → decrypt and use it.
2. Else fall back to `process.env[KEY]`.
3. Else throw a typed `MissingConfigError` that surfaces in `/admin/settings/integrations` with a prominent CTA.

**Encryption primitive:** AES-256-GCM with 96-bit IV, 128-bit tag. `APP_ENCRYPTION_KEY` is 32 bytes, hex-encoded in Vercel env. AAD binds `(setting.id, version)` to prevent row-swap.

**Access control:**

- Only users with `owner` role may read decrypted values, and only via a server-side service (never returned to client).
- `admin | finance` roles may rotate keys (write new value, old value invalidated).
- Every read/write emits an `audit_event` with action `setting.read` / `setting.write`.

**Rotation:** when `APP_ENCRYPTION_KEY` is rotated, a migration job re-encrypts every sensitive row under the new key. Old key retained for one migration cycle.

**Keys under this regime (non-exhaustive):**
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_TOKEN_AUTH_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `DATABASE_URL`.

## Alternatives considered

- **Vercel env only.** Simpler but requires developer/owner to redeploy for every rotation and blocks non-technical owner changes. Rejected.
- **Doppler / Infisical.** Extra vendor + cost + onboarding. Deferred — can be added behind the same `getSetting(key)` seam later.
- **Browser-held keys.** Disastrous. Rejected.

## Consequences

- Owner can type keys into the admin UI on day one without redeploy.
- Secrets never appear in client bundles or response bodies.
- One seam (`$lib/server/settings.ts`) encapsulates the resolution; replacing with Doppler later is a one-file change.
- Dev mode still works offline with `.env` only — no live DB required for local bootstrap.
