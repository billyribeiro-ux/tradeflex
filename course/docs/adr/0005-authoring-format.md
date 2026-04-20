# ADR 0005 — Course authoring in MDsveX

**Status:** Accepted
**Date:** 2026-04-20

## Context

Every build step becomes a course page (per `tradeflex_course_authoring_rules.md`). We need an authoring format that:

- Renders Markdown content with headings, code blocks, asides, tables.
- Lets us embed Svelte components inline (interactive demos, the `<Steps>` / `<Aside>` / `<FileTree>` primitives).
- Plays cleanly with SvelteKit's filesystem routing so `/course/modules/1/overview` is just a file.
- Supports syntax-highlighted code with filename headers + diff lines (the Expressive-Code-style look).

## Decision

**MDsveX** with the Shiki highlighter and custom layouts.

- `mdsvex.config.js` at the repo root wires Shiki (theme: `github-dark-default` + `github-light-default` switched by CSS class), a rehype plugin for heading anchors, and a remark plugin for our `:::aside tip` directive syntax that expands to `<Aside type="tip">`.
- Course pages live at `src/routes/course/**/+page.svx` with frontmatter `title`, `module`, `order`, `tags`, `cli?`.
- A `courseManifest.ts` reads frontmatter at build via `import.meta.glob('/src/routes/course/**/+page.svx', { eager: true })` to produce the sidebar + prev/next mapping — single source of truth, no duplicated lists.

Code blocks:

- ` ```ts title="src/lib/foo.ts" {2-4} add=3 del=5 ` renders with filename header, line numbers, highlighted + added + removed lines, copy button. Implemented by the `CodeBlock.svelte` component driven by Shiki's decoration API.

## Alternatives considered

- **Plain Markdown via `marked` / a glob loader.** No inline Svelte components without a custom bridge. Rejected — loses the `<Steps>` / `<Aside>` ergonomics.
- **Astro Starlight.** Correct visual reference but wrong framework; would fracture the repo. Rejected per `tradeflex_course_design_reference.md`.
- **MDX.** Wrong framework (React). Rejected.

## Consequences

- Course page authors get real components + real Markdown, no toolchain gap.
- The Expressive-Code look is reproduced in our own `CodeBlock.svelte` — no external dep, tokens stay on PE7 CSS.
- Build-time glob means adding a page is one file; no sidebar hand-editing.
- Shiki is heavy but runs at build; runtime stays lean.
