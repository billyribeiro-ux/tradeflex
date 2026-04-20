# ADR 0003 — Reuse existing scaffold, rename in place

**Status:** Accepted
**Date:** 2026-04-20

## Context

A SvelteKit scaffold already exists at `/Users/billyribeiro/Desktop/fullstack-svelte/course` with Better Auth + Drizzle + Playwright + Vitest + adapter-vercel already wired, and a dev `BETTER_AUTH_SECRET` generated. Starting fresh with `gh repo create tradeflex` would force us to re-run `sv create`, regenerate the auth schema, reinstall deps, and re-configure everything already working.

## Decision

Keep the directory. Rename the package from `course` to `tradeflex` in `package.json`. Treat this directory as the Trade Flex monorepo root. The in-repo course site lives under `/course` route, not as the repo name.

When we `gh repo create`, we create the remote as `tradeflex`, point the local at it, and push. The directory name on disk stays `course/` for now — not worth the churn of moving, and nothing outside this machine depends on it.

## Alternatives considered

- **Fresh repo.** Clean slate, but re-does work already validated. Rejected.
- **Rename directory to `tradeflex/`.** No functional benefit; breaks any IDE state, terminal history, memory references. Rejected.

## Consequences

- Git history starts here. No prior commits to carry.
- All memory references to "the scaffold" map to this directory.
- Push step (Phase 13) creates the GitHub remote and wires Vercel.
