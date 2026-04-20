# ADR 0006 — macOS delivery via Tauri

**Status:** Accepted (default)
**Date:** 2026-04-20

## Context

Trade Flex ships a macOS companion. Options: native Swift app, Electron, Tauri. User deferred to assistant default.

## Decision

**Tauri** wraps the SvelteKit build. The macOS app is the member surface (alerts feed, course player, notifications) with native window chrome + deep-link handling + notification center integration.

## Why

- Shares ~100% of the UI with web — zero duplicate component work.
- Binary size ≈ 10–20× smaller than Electron (native WebKit vs bundled Chromium).
- First-class Rust plugin surface for macOS APIs we'll want (native notifications, secure enclave for refresh tokens, sleep/wake events to pause videos).
- Signed + notarized releases are scriptable in CI (Apple Developer cert in GitHub Actions secrets).

## Rejected

- **Native Swift.** Quality ceiling is higher but build cost + duplicate UI work dominate. Revisit in v2 if Tauri ceiling is hit.
- **Electron.** Binary weight + memory footprint + security posture worse than Tauri for our needs.

## Consequences

- Separate workspace (`apps/macos/`) with a Tauri shell. Added in Phase 11 (not v1 critical path).
- Shared ViewModel/service layer lives in `packages/core/` when we split; until then, web-only.
- Auto-update via Tauri updater pointing at a GitHub Releases feed.
