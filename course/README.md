# Trade Flex

Alerts membership + 2 courses + macOS companion. Built in SvelteKit 2, Svelte 5, Drizzle, Better Auth, Stripe, Resend.

## Stack

- **SvelteKit 2** on `@sveltejs/adapter-vercel`
- **Svelte 5.55** (runes, snippets)
- **TypeScript** strict
- **Neon Postgres** via `drizzle-orm` + `postgres` driver
- **Better Auth** (email/password + GitHub OAuth)
- **Zod** for env + input validation
- **PE7 design tokens** (no Tailwind)

## Local dev

```sh
pnpm install
cp .env.example .env   # fill in DATABASE_URL + BETTER_AUTH_SECRET
pnpm db:push           # apply schema to your Neon branch
pnpm dev
```

## Scripts

| Command            | Does                              |
| ------------------ | --------------------------------- |
| `pnpm dev`         | start Vite dev server             |
| `pnpm build`       | production build (Vercel adapter) |
| `pnpm check`       | svelte-check typecheck            |
| `pnpm lint`        | prettier + eslint                 |
| `pnpm test:unit`   | vitest                            |
| `pnpm test:e2e`    | playwright                        |
| `pnpm db:push`     | push Drizzle schema to DB         |
| `pnpm db:generate` | generate SQL migration            |

## Layout

- `src/routes/(marketing)/` — public site (landing, pricing, alerts preview, blog, legal)
- `src/routes/(auth)/` — login, register, logout
- `src/routes/account/` — member area (profile, billing stub)
- `src/routes/alerts/` — gated alert feed
- `src/routes/admin/` — staff control surface (settings, alerts, etc.)
- `src/routes/course/` — in-repo course teaching the build
- `src/lib/server/` — env, db, auth, services, crypto, logging
- `docs/` — PRD, roadmap, domain model, threat model, ADRs

## Env

See `.env.example`. Non-secret defaults are fine for a first boot; secrets (Stripe, Resend, Bunny, OAuth) can be entered through **Admin → Settings → Integrations** at runtime — they're AES-256-GCM encrypted at rest and fall back to `.env` on first launch.

## Docs

Start at `docs/prd.md` and `docs/roadmap.md`. ADRs in `docs/adr/` record the stack and architecture decisions.
