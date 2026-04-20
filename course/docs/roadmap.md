# Trade Flex — Roadmap

Phases mirror the in-repo course's module ordering so the build log == the teaching log.

## Phase 0 — Homework (docs-only)

PRD, roadmap, domain model, threat model, observability plan, ADRs 0001–0008. **No code beyond the existing scaffold.**

**Deliverables:** `docs/` tree, this roadmap, ADRs committed.

## Phase 1 — Design system + course shell

- PE7 CSS tokens (color light/dark, space, radius, motion, type, shadow, z).
- Base stylesheet + reset.
- Logo + brand primitives.
- Course-site 3-pane layout, theme toggle, ⌘K search stub, prev/next, manifest-driven sidebar.
- CLI reference page (Module 0 / page 1).

**Exit:** course site renders at `/course`; CLI reference reads cleanly; light/dark works; reduced-motion respected.

## Phase 2 — Module 1–2: project setup + data layer

- Typed env loader (Zod).
- Neon dev branch wiring + Docker Compose fallback.
- Drizzle schema: `profile` keyed to Better Auth `user.id`, service-layer auth-z primitives.
- Course pages: 1.1–1.5 + 2.1–2.3.

**Exit:** can register, log in, update profile, pass `pnpm check`.

## Phase 3 — Module 3: auth + account

Login, magic link, remember-me, route guards, account page (profile, avatar upload to Vercel Blob, email/password change, 2FA, delete, export, session revoke), logout + nav state.

**Exit:** full account lifecycle works end-to-end. Playwright covers it.

## Phase 4 — Module 4: contacts CRUD + marketing admin prelude

Contacts table, Superforms + Zod, modal UX polish, seed script, admin-only bulk seed. First cut of `/admin/marketing/contacts`.

**Exit:** admin can CRUD, search, tag, export contacts.

## Phase 5 — Module 5–6: Stripe fundamentals + integration

Stripe products + prices via CLI + committed seed script; webhook endpoint + signature verify + idempotency; `stripe listen` forwarding script; data-mirror decision doc.

**Exit:** webhook receives test events; our tables mirror required fields.

## Phase 6 — Module 7–8: billing services + pricing page

`products`, `customers`, `subscriptions` services; marketing pricing page reads Stripe; month↔year toggle with "Save $X" pill.

**Exit:** pricing page matches Stripe live; no hardcoded amounts anywhere.

## Phase 7 — Module 9: checkout + trials + portal

Stripe hosted Checkout two-column flow; both trial flavors; test clocks; prevent-multiple-trials; Customer Portal configured + "Manage billing" link; success/cancel URLs handled via webhooks (not client).

**Exit:** full paid + trial paths tested via Stripe test cards + test clock.

## Phase 8 — Module 10: tier-based access control

`validateTier` server/client helpers; entitlement map editor in admin; UI upgrade CTAs + disabled states; prevent-multiple-plans.

**Exit:** accessing a gated resource without entitlement is denied by service + UI.

## Phase 9 — Module 11: testing

Playwright auth/CRUD/checkout flows + Vitest service + schema tests. Coverage targets set; CI gates.

**Exit:** every happy path + two failure paths tested.

## Phase 10 — Module 12: CI/CD to production

GitHub Actions workflows (PR + main lanes), Neon branches per PR, Vercel preview + prod, rollback recipe, prod key rotation.

**Exit:** merging to main auto-deploys to Vercel prod with migration gate.

## Phase 11 — Module 13 + remaining admin + alerts + email inbox + macOS

Toasts, redirects, Stripe branding; weekly alerts composer + delivery; Resend inbox (outbound + inbound ADR resolution); marketing campaigns + ebook CTA wire-through; remaining admin categories; Tauri macOS wrapper.

**Exit:** every item in `tradeflex_admin_control_surface.md` either shipped or deliberately deferred with ADR.

## Phase 12 — Bonus Module: custom multi-step checkout

Sign In → Billing → Payment tabs + persistent cart sidebar + recurring-totals breakdown, using Stripe Payment Element. Documented as a bonus, opt-in path.

**Exit:** both hosted-checkout (v1) and custom-checkout (bonus) paths ship.

## Phase 13 — Push + deploy

`gh repo create tradeflex` → push → `vercel link` → `vercel deploy --prod` → hand back the `*.vercel.app` URL.
