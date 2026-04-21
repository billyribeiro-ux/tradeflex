# Trade Flex — macOS companion (Tauri 2)

Thin native wrapper around the deployed Trade Flex web app. Reasons:

- **Desktop notifications for alerts** — macOS Notification Center via `tauri-plugin-notification` instead of browser permission prompts.
- **Deep links** — `tradeflex://alert/…` opens the app to the right spot; `tauri-plugin-deep-link` + `single-instance` focuses an existing window instead of opening a second one.
- **Persistent session** — the app keeps a cookie jar that survives browser privacy mode.
- **Menu bar + auto-updates** — native chrome, signed delta updates via `tauri-plugin-updater`.

## One-time setup

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# JS tooling
pnpm install
pnpm add -D @tauri-apps/cli@^2

# Xcode CLT (one-time, macOS)
xcode-select --install
```

## Dev loop

```bash
pnpm dev
```

This boots Tauri pointing at the live production web app at
`https://app.tradeflex.dev` (configured in `src-tauri/tauri.conf.json`).
Change the window URL to `http://localhost:5173` locally if you want to
iterate against the SvelteKit dev server.

## Release build

```bash
# Apple Silicon + Intel universal .app and .dmg
pnpm build:universal

# Output: src-tauri/target/universal-apple-darwin/release/bundle/
```

## Icons

Icons under `src-tauri/icons/` are placeholders. Replace with the production
logo assets (1024×1024 source PNG) and regenerate sizes with:

```bash
pnpm tauri icon path/to/source.png
```

## Signing & notarization

- Set `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
  `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID` in the build environment.
- Tauri runs `codesign` + `xcrun notarytool` automatically when these are set.

## Auto-updates

`tauri.conf.json` points the updater at
`https://app.tradeflex.dev/api/desktop/updates/{{target}}/{{current_version}}`.
Serve signed update manifests from that endpoint (see Tauri v2 updater docs
for the JSON shape). Replace `pubkey` in `tauri.conf.json` with your production
public key before the first release.
