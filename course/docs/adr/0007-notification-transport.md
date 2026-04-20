# ADR 0007 — Notification-bell transport = SSE

**Status:** Accepted (default)
**Date:** 2026-04-20

## Context

The admin top-bar notification bell needs real-time unread counts and entries across tabs. Two candidates: Server-Sent Events (SSE) or WebSockets (WS).

## Decision

**SSE** (`/api/notifications/stream`). The client opens an `EventSource`; the server emits JSON events as notifications are persisted; heartbeat every 25s. Reconnection is automatic.

## Why

- Notifications are **server → client** only. No client message back needed.
- SSE works over plain HTTP/2, no upgrade handshake, simpler ops.
- Vercel supports long-lived streaming responses within runtime limits; we emit an explicit `end` + client auto-reconnect before the limit.
- One fewer protocol surface = smaller threat model.

## Rejected

- **WS.** Would add a persistent bidirectional channel we don't need. If a future feature (e.g. collaborative inbox cursors) needs it, revisit.
- **Polling.** Trivial but wastes requests and feels sluggish at PE7 bar.

## Consequences

- Unread count persisted in `notification_unread_count` (materialized cache); SSE pushes deltas, client applies them, reload fetches authoritative snapshot.
- Fallback to polling every 30s if `EventSource` not available (older browsers / hostile networks).
- A11y: bell badge announces via `aria-live="polite"` when count increments.
