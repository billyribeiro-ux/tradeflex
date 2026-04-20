# ADR 0001 — Stack lock

**Status:** Accepted
**Date:** 2026-04-20

## Context

Before any code ships, we freeze the dependency set to avoid drift mid-build. The user's instruction ("All libraries latest as of April 20, 2026") means we pin versions at the moment each package is first introduced and record the pin here.

## Decision

Locked to the following for v1:

| Layer            | Tool                                  |
| ---------------- | ------------------------------------- |
| Framework        | SvelteKit 2 + Svelte 5                |
| Language         | TypeScript (strict)                   |
| Runtime          | Node 24                               |
| Package manager  | pnpm                                  |
| Bundler          | Vite                                  |
| Host             | Vercel (`@sveltejs/adapter-vercel`)   |
| Database         | Neon Postgres                         |
| ORM + migrations | Drizzle ORM + drizzle-kit             |
| Auth             | Better Auth (email/password + GitHub) |
| Payments         | Stripe (hosted Checkout in v1)        |
| Email            | Resend (outbound)                     |
| Styling          | PE7 CSS (**not** Tailwind)            |
| Validation       | Zod                                   |
| Forms            | SvelteKit Superforms                  |
| Icons            | Phosphor via Iconify                  |
| Motion           | GSAP + Motion + Svelte transitions    |
| GPU effects      | Motion GPU (WGSL shaders)             |
| Dev inspector    | Svelte Agentation (dev-only)          |
| Testing          | Vitest + Playwright                   |
| Lint + format    | ESLint + Prettier                     |
| Blob storage     | Vercel Blob (avatars)                 |
| Video (gated)    | Bunny Stream (signed URLs)            |
| Video (public)   | YouTube (`youtube-nocookie.com`)      |
| macOS wrapper    | Tauri                                 |
| Course authoring | MDsveX                                |

## Not chosen, and why

- **Tailwind** — user override to PE7 CSS.
- **Supabase** — replaced by Neon + Drizzle + Better Auth end-to-end.
- **Sentry** — user rule; self-rolled observability (see `docs/observability-plan.md`).
- **Valibot** — Zod specified by user.
- **Prisma** — Drizzle chosen; thinner runtime + migration ergonomics better fit the teaching bar.

## Consequences

- Onboarding new contributors is cheap: one `pnpm install` + one `.env`.
- Cross-cutting choices (ORM, styling, forms) are consistent across modules; course pages don't need to reintroduce alternatives.
- Any swap (e.g. adding SaaS observability later) touches a single seam, not the whole codebase.
