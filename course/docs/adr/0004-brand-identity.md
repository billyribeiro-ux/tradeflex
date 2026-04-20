# ADR 0004 — Brand identity (logo, palette, typography)

**Status:** Accepted
**Date:** 2026-04-20

## Context

User delegated brand design: "make any logo you decide." We need a palette that plays well with financial-data UIs (dense tables, charts, red/green price deltas) without looking like every other trading SaaS.

## Decision

**Logo mark.** A stylized "TF" monogram where the `T` crossbar becomes a rising candlestick. Two-color lockup: mark + wordmark "TRADE FLEX." Ships as SVG with `currentColor`, size-independent, single-path where possible.

**Palette.** Tokens defined in `src/lib/styles/tokens.css`.

| Token                | Light mode       | Dark mode        | Use                           |
| -------------------- | ---------------- | ---------------- | ----------------------------- |
| `--color-bg`         | `#fafaf9`        | `#0b0d10`        | Page background               |
| `--color-surface`    | `#ffffff`        | `#12151a`        | Cards, panels                 |
| `--color-surface-2`  | `#f4f4f2`        | `#181c22`        | Inset surfaces                |
| `--color-border`     | `#e6e4df`        | `#232831`        | Hairline borders              |
| `--color-text`       | `#0b0d10`        | `#eef0f3`        | Primary text                  |
| `--color-text-muted` | `#5b6470`        | `#9aa4b2`        | Secondary text                |
| `--color-accent`     | `#0ea06b`        | `#22c48c`        | Primary action (green — up)   |
| `--color-accent-2`   | `#134e4a`        | `#5eead4`        | Emphasis, links               |
| `--color-danger`     | `#d64545`        | `#ff6b6b`        | Destructive / price down      |
| `--color-warning`    | `#b97a00`        | `#e9a23b`        | Caution                       |
| `--color-info`       | `#2a6dd8`        | `#6aa6ff`        | Informational                 |

**Typography.**
- UI + body: **Inter Variable** (self-hosted via `@fontsource-variable/inter`).
- Numeric + tabular: Inter with `font-variant-numeric: tabular-nums`.
- Code + shell: **JetBrains Mono** (self-hosted via `@fontsource-variable/jetbrains-mono`).

Scale (fluid clamps):
- `--fs-xs` 12px · `--fs-sm` 14px · `--fs-md` 16px · `--fs-lg` 18px · `--fs-xl` 22px · `--fs-2xl` 28px · `--fs-3xl` 36px · `--fs-4xl` 48px.

**Motion.**
- Easing: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);` as default.
- Duration: `--dur-1: 120ms` · `--dur-2: 200ms` · `--dur-3: 320ms` · `--dur-4: 480ms`.
- All transitions respect `prefers-reduced-motion: reduce` → collapse to 0ms.

**Radius + shadow.**
- `--radius-sm 6px`, `--radius-md 10px`, `--radius-lg 14px`, `--radius-pill 999px`.
- `--shadow-1` hairline, `--shadow-2` card, `--shadow-3` overlay, `--shadow-4` modal.

## Consequences

- Editable via `/admin/settings/branding` (palette keys write through to CSS custom properties on `<html>` via a server-rendered style block). Swapping brand colors is a settings change, not a redeploy.
- All components consume tokens; no hardcoded hex anywhere in components or course pages.
- Dark mode is first-class; default follows `prefers-color-scheme` with a user override persisted in `profile.theme`.
