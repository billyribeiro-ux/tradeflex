# Trade Flex — Observability Plan (v1)

**No Sentry** (user rule). We self-roll the minimum that meets a PE7 bar, with clean seams to swap in a hosted tool later.

## Pillars

### 1. Structured logs

- Every server request logged at the edge of `hooks.server.ts` with: `request_id`, `method`, `path`, `status`, `latency_ms`, `user_id?`, `impersonator_id?`, `ip_hash`, `ua_hash`.
- `request_id` is a ULID generated per request, set on `locals.requestId`, echoed in `X-Request-Id` response header, propagated into every downstream log line for that request.
- Output format: single-line JSON to stdout (Vercel captures it). Keys stable, values safe for grep.

### 2. Domain events table

- Append-only `domain_event` row for every business-meaningful action: `video.started`, `subscription.created`, `alert.published`, `trial.expired`, `webhook.stripe.received`, etc.
- Payload is typed per event; schema versioned.
- This is the audit + analytics substrate; we don't rerun logs to answer product questions.

### 3. Webhook delivery log

- `webhook_delivery` row on every inbound webhook (Stripe, Resend, Bunny). Status transitions: `received → processing → processed | failed`. Retries keyed on `(provider, event.id)`.

### 4. Error beacon

- `POST /api/beacon/error` endpoint: accepts client-side unhandled errors, rate-limited, stored in `domain_event` with type `client.error`. No PII in the payload.
- Server-side errors captured by SvelteKit `handleError` hook → `domain_event` with type `server.error` + stack trimmed.

### 5. Health + smoke

- `GET /api/health` returns 200 if DB is reachable + last Stripe webhook was processed within N minutes.
- Post-deploy CI step hits `/api/health` on the Vercel URL.

## Dashboards (admin)

- **Observability → Requests** — recent requests, p50/p95/p99 latency per route, error rate. Built on a materialized view over stored log lines (or Vercel Log Drains later).
- **Observability → Events** — domain events stream with filters.
- **Observability → Webhooks** — inbound by provider + status + replay button.
- **Observability → Health** — current health + last 24h incident timeline.

## Seams for future swap

- All structured logs pass through a single `log()` helper in `$lib/server/log.ts` — swap target (Datadog / Axiom / Highlight) behind it without touching callers.
- Error hooks funnel through `reportError()` in `$lib/server/errors.ts`.

## Explicitly deferred

- Hosted APM (Datadog/NewRelic/Highlight) — not v1. Capture as ADR if volume warrants.
- RUM / session replay — not v1. Privacy review required before adoption.
- Distributed tracing — overkill for a single Vercel function tier. Revisit if we add a worker tier.
