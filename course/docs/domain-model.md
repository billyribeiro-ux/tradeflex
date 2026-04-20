# Trade Flex — Domain Model

All entities live in Postgres (Neon) via Drizzle ORM. Identifiers are `text` ULIDs unless a third party mandates otherwise (Stripe uses its own opaque IDs; we keep them as `text` foreign references).

## Identity

- **user** — Better Auth–managed (`id`, `email`, `emailVerified`, `name`, `image`, `createdAt`, `updatedAt`).
- **session** — Better Auth–managed.
- **account** — Better Auth–managed (OAuth linkage).
- **verification** — Better Auth–managed (email + magic link tokens).
- **profile** — app-owned, keyed 1:1 to `user.id`. Fields: `displayName`, `bio`, `timezone`, `avatarBlobKey`, `avatarShape` (enum, default `circle`), `marketingOptIn`, `notificationPrefs` (jsonb), `twoFactorEnabled`.
- **role_assignment** — `user.id` × role (`owner | admin | support | content | finance | analyst | read_only`). Users can hold multiple roles; permission is the union.

## Commerce

- **product** — Stripe-mirrored. `stripeProductId`, `name`, `kind` (`membership | course | ebook`), `archived`.
- **price** — Stripe-mirrored. `stripePriceId`, `productId` FK, `currency`, `unitAmount`, `interval` (`null | month | year`), `trialDays`, `lookupKey`, `active`.
- **customer** — Stripe-mirrored. `stripeCustomerId`, `userId` FK.
- **subscription** — Stripe-mirrored. `stripeSubscriptionId`, `customerId` FK, `priceId` FK, `status`, `currentPeriodEnd`, `trialEnd`, `cancelAt`, `canceledAt`.
- **invoice** — Stripe-mirrored. `stripeInvoiceId`, `customerId`, `subscriptionId?`, `status`, `amountPaid`, `hostedInvoiceUrl`.
- **payment** — Stripe-mirrored. `stripePaymentIntentId`, `invoiceId?`, `amount`, `status`, `failureReason?`.
- **entitlement** — derived. `userId`, `capability` (`read:alerts | watch:course:<id> | …`), `source` (`stripe:sub:<id>` / `manual:comp`), `expiresAt?`. Rebuilt on every relevant webhook.

## Content

- **course** — `id`, `slug`, `title`, `tagline`, `heroVideoRef?`, `price` (via product), `accessModel` (`lifetime | drip`), `published`.
- **section** — belongs to course.
- **lesson** — belongs to section; has `videoRef` (provider + providerRef + duration + captions + poster).
- **attachment** — downloadable resources per lesson.
- **enrollment** — `userId` × `courseId`, `source` (`purchase | grant | gift | comp`), `startedAt`.
- **progress** — `userId` × `lessonId`, `positionSec`, `completedAt?`.

## Alerts

- **alert** — weekly or ad-hoc. `title`, `body` (MDsveX), `publishedAt?`, `entitlementRequired` (capability string), `authorUserId`. Revisions stored.
- **alert_ack** — per-user read receipt.

## Email + Marketing

- **contact** — marketing-only lead. `email`, `firstName?`, `lastName?`, `source`, `utm` (jsonb), `consentAt`, `marketingOptIn`, `doiState` (`pending | confirmed | unsubscribed`), `tags` (text[]).
- **thread** — admin inbox. `subject`, `assigneeUserId?`, `status` (`open | snoozed | archived`), `labels` (text[]).
- **message** — belongs to thread. `direction` (`in | out`), `fromAddr`, `toAddrs`, `headers`, `bodyText`, `bodyHtml`, `resendMessageId?`, `inReplyTo?`, `references?`.
- **suppression** — `email`, `reason`.
- **campaign** — scheduled broadcast. Metrics: opens, clicks, bounces, complaints, unsubscribes.

## Platform

- **audit_event** — `actorUserId`, `action`, `targetKind`, `targetId`, `metadata` (jsonb), `ip`, `ua`, `at`. Append-only.
- **domain_event** — app-emitted events (e.g. `video.progress_75`). Append-only.
- **webhook_delivery** — `provider` (`stripe | resend | bunny`), `eventId`, `receivedAt`, `processedAt?`, `error?`, `payload` (jsonb).
- **notification** — `userId` (staff target), `category`, `title`, `body`, `deepLink`, `readAt?`.
- **notification_unread_count** — materialized cache per (userId, category).
- **setting** — key/value app settings; values containing secrets are encrypted (`valueEncrypted` + `valueMask`).
- **api_key_rotation** — audit log for secret rotations.
- **feature_flag** — server-evaluated flags with owner + expiry.

## Key invariants

- `subscription.status` in (`trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`) drives entitlement rebuilds.
- No write path skips audit logging except explicit read/search paths.
- No secret value appears in plaintext outside the encrypted column + the in-memory decrypted cache (short TTL).
- Every webhook handler is idempotent keyed on `(provider, event.id)`.
