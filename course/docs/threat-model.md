# Trade Flex — Threat Model (STRIDE, v1)

Applied per trust boundary. Assumes Vercel edge → SvelteKit node → Neon Postgres, with Stripe, Resend, Bunny, and Vercel Blob as external boundaries.

## Trust boundaries

1. Unauthenticated browser ↔ public marketing site.
2. Authenticated browser ↔ member app.
3. Staff browser ↔ admin app.
4. Stripe ↔ webhook endpoint.
5. Resend ↔ webhook endpoint (delivery/bounce/complaint + optional inbound).
6. Bunny Stream ↔ signed playback URLs.
7. Admin UI ↔ `setting` table (secret storage).
8. CI runner ↔ Neon prod (migration apply).

## Per-surface STRIDE

### Auth (Better Auth)

- **Spoofing** — credential stuffing. **Mitigation:** rate-limit login, breached-password check on sign-up, 2FA available, CAPTCHA on excessive failures only.
- **Tampering** — session cookie tampering. **Mitigation:** Better Auth signed+HttpOnly cookies; `SameSite=Lax`; rotate `BETTER_AUTH_SECRET` on compromise.
- **Repudiation** — user denies an action. **Mitigation:** audit log every state change with IP + UA.
- **Information disclosure** — email enumeration. **Mitigation:** uniform error messages on login + password reset.
- **DoS** — login flood. **Mitigation:** IP + account rate limits; queue-based slowdown rather than hard block.
- **Elevation** — role escalation. **Mitigation:** service-layer auth-z on every role-sensitive call; no role derived from client-sent data.

### Payments (Stripe)

- **Tampering** — forged webhook. **Mitigation:** `stripe.webhooks.constructEvent` signature check with current + previous signing secret.
- **Repudiation** — "I didn't buy that." **Mitigation:** Stripe is source of truth; our mirror is read-only from webhooks.
- **Info disclosure** — card data. **Mitigation:** never touch PAN; hosted Checkout in v1, Payment Element in bonus. PCI SAQ A scope.
- **Elevation** — entitlement without payment. **Mitigation:** entitlements rebuilt from subscription state only; no manual grants outside admin with audit.

### Admin impersonation

- **Tampering** — impersonation session escaping. **Mitigation:** impersonation session has `impersonator_id` claim; every audit event records both. UI banner always visible.
- **Elevation** — support role impersonating owner. **Mitigation:** role matrix prevents impersonating higher-tier accounts; configurable ceiling per role.

### Webhook ingress (Stripe / Resend / Bunny)

- **Spoofing** — unauthenticated replay. **Mitigation:** signature verification on every provider; idempotency keyed on `(provider, event.id)` persisted.
- **DoS** — flood. **Mitigation:** async queue + bounded worker; 202 ACK fast, process slow.

### Video gating (Bunny)

- **Info disclosure** — public URL for paid video. **Mitigation:** signed URLs, short TTL, per-session token; origin allowlist on Bunny side.
- **Elevation** — YouTube used for gated content. **Mitigation:** admin UI validation + service-layer check rejects `provider = 'youtube'` for lessons with `entitlementRequired`.

### Email (Resend)

- **Spoofing** — outbound impersonation. **Mitigation:** SPF/DKIM/DMARC on sending subdomain; DMARC `p=reject` once warm.
- **Info disclosure** — sending to suppressed address. **Mitigation:** suppression check before every send.
- **Tampering** — one-click-unsubscribe forgery. **Mitigation:** HMAC-signed unsubscribe links keyed per recipient.

### Secret storage (admin settings)

- **Info disclosure** — plaintext secret in DB. **Mitigation:** AEAD (AES-256-GCM) with `APP_ENCRYPTION_KEY` in Vercel env; rotate key → re-encrypt all rows in a migration job.
- **Tampering** — ciphertext swap. **Mitigation:** AEAD detects it; additional authenticated data binds row id + version.
- **Elevation** — non-owner reads secret. **Mitigation:** only owner role may decrypt; UI shows mask + "rotate" for other roles.

### CI → prod migration

- **Tampering** — malicious migration in PR. **Mitigation:** branch protection requires review; migration dry-run on Neon branch gate.
- **DoS** — accidental long lock on prod. **Mitigation:** expand-backfill-contract pattern; statement timeout; rollback recipe documented.

## Top residual risks (v1)

1. Lost `APP_ENCRYPTION_KEY` ⇒ all settings secrets unreadable. **Control:** key is also stored in the team password manager + offline backup.
2. Webhook endpoint flakiness ⇒ drifted mirror. **Control:** nightly reconciliation job against Stripe (planned Phase 11).
3. Single-region DB ⇒ regional outage. **Accepted** for v1; HA/region planning deferred.
