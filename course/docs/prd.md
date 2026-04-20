# Trade Flex — Product Requirements (v1)

**Owner:** Billy Ribeiro
**Status:** Draft, greenlit 2026-04-20
**Quality bar:** Principal Engineer Level 7+ / Google-Microsoft-Netflix-Apple engineering

## 1. Problem

Retail options + stock traders pay for weekly alert services and education, but most vendors ship janky Wordpress-era dashboards. Trade Flex is the PE7-grade alternative: a membership service with weekly alerts, two flagship courses, a macOS companion app, and a marketing site — all owned end-to-end.

## 2. Users

- **Members** — paying subscribers who consume weekly alerts + optional course purchases.
- **Students** — one-time course buyers (may convert to members).
- **Leads** — visitors who hand over an email for the free ebook; land in marketing contacts.
- **Staff** — owner + support + content/finance/analyst roles; operate the platform.
- **Owner** — Billy; wants full control of every surface.

## 3. Products + pricing

Pricing is pulled from Stripe at runtime. **No hardcoded prices in code.** Source of truth is always the Stripe Price object; the app mirrors what it needs for auth-z and display.

| Product                          | Price                            | Mechanism                                  |
| -------------------------------- | -------------------------------- | ------------------------------------------ |
| Weekly Alerts — Monthly          | $49 / month                      | Stripe recurring subscription              |
| Weekly Alerts — Yearly           | $399 / year                      | Stripe recurring, month↔year toggle        |
| Course: Price Action Simplified  | $799                             | Stripe one-time                            |
| Course: Options 101              | $999                             | Stripe one-time                            |
| Free ebook                       | Free (email required)            | Resend send + marketing contact row        |

Trials: both flavors supported.
- With credit card: `trial_period_days` on the Price.
- Without credit card: `subscription_data.trial_period_days` + `payment_method_collection: 'if_required'`, card capture prompted before expiry.

## 4. Surfaces

1. **Marketing site** — landing, pricing, alert previews, course pages, legal, ebook CTA, blog.
2. **Member app** — account, billing portal link, alert feed, course library, notifications, toasts.
3. **Admin dashboard** (owner + staff) — identity/roles, members, subscriptions, payments, courses, weekly alerts, email inbox (Resend-backed), marketing contacts, CMS, settings, audit log, support tooling, compliance workflows. Notification bell in top bar. Avatars first-class everywhere.
4. **macOS app** — Tauri-wrapped build of the member app with native chrome + deep links.
5. **In-repo course site** — teaches readers how this exact app was built, step by step.

## 5. Stack (locked)

SvelteKit 2 + Svelte 5 + TypeScript strict · pnpm + Vite + Node 24 · Vercel + `adapter-vercel` · Neon Postgres + Drizzle ORM · Better Auth (email/password + GitHub OAuth) · Stripe (hosted Checkout + Customer Portal + Webhooks + Test Clocks) · Resend (outbound) · PE7 CSS (no Tailwind) · Zod · SvelteKit Superforms · Phosphor via Iconify · Playwright + Vitest · GSAP + Motion + Svelte native transitions · Motion GPU (WGSL shaders) for brand moments · Svelte Agentation (dev-only inspector) · Vercel Blob for avatars · Bunny Stream (paid/gated video) + YouTube (public-only) · Tauri (macOS) · MDsveX (course authoring).

## 6. Authorization model

**Not** Postgres RLS. Every DB access goes through a typed service that enforces caller identity + role + entitlement. Entitlement map: Stripe Price ID → in-app capability. Audit events written for every state-changing operation.

## 7. API keys + secrets

Delivered via an admin **Settings → Integrations** page. Keys encrypted at rest using an AEAD derived from `APP_ENCRYPTION_KEY`. On first boot, values read from `.env`; once an admin saves them in the UI, DB takes precedence. Keys never rendered back to the client in cleartext — masked display + rotate action.

## 8. Non-goals (v1)

- SSO (SAML/OIDC) — Better Auth covers what we need.
- Mobile apps beyond macOS — web is responsive.
- On-prem / self-host.
- Multi-region DB.
- Stripe Connect marketplace flows.
- Anything Supabase.

## 9. Success criteria

- A new visitor can sign up, start a trial (both flavors), pay, consume an alert, and cancel — in one sitting, without support.
- Staff can block a member, refund a charge, cancel a subscription (immediate or end-of-period), reply to an inbound email, and rotate an API key — all from the admin UI.
- Every build step is a readable course page; a reader who has never shipped prod can follow along and deploy a clone.
- CI green on every PR; main lane auto-deploys to Vercel.
- Lighthouse ≥ 95 (performance, a11y, best-practices, SEO) on marketing + member surfaces.
- Zero PII in client bundles; zero hardcoded prices; zero silently dropped scope from `tradeflex_admin_control_surface.md`.
