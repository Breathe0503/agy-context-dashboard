# AGY Context Dashboard (Antigrative Dashboard) v0.9.6

Release `v0.9.6` for [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License, adding **Antigravity Desktop `2.34.0+` daemon CSRF credential discovery** and syncing upstream `v0.9.9`–`v0.9.10` discovery hardening and context UI enhancements while retaining all `v0.9.5` launch self-healing, default-on `autoRelaunchDebug`, `Gemini 4` / `GPT-6.1 Sol` / `Claude 4.5–5.5`, macOS `language_server.native`, `agy 1.5.x` CLI `statusLine`, and IDE `2.6.0` capabilities.

## What changed in v0.9.6

- **Antigravity Desktop `2.34.0+` daemon CSRF credential discovery (`sidecars/panel/discovery.mjs`, `sidecars/panel/client.mjs`, `ide/client.mjs`):** Antigravity `2.34.0` removes `--csrf_token` from `language_server` command-line arguments and writes `{ pid, httpsPort, httpPort, lsVersion, csrfToken }` under `~/.gemini/<appDataDir>/daemon/*.json`. Adds `resolveDaemonCredential` to fall back to PID-matched, live-port-verified daemon metadata while keeping full backward compatibility with `<= 2.33.x`.
- **Context compaction count & threshold colors (`compat/inline-widget.cjs`, `compat/i18n.cjs`, `sidecars/panel/{app.js,index.html,styles.css}`):** Displays `🗜 {n}×` / `🗜 {n} 次` badges when `transcriptStats.compactionMarkers > 0`, highlights context ring & progress bar at `>= 75%` warning and `>= 90%` danger thresholds, preserves dynamic `[data-card]` chip titles during `localize()`, and disposes `speedStyle` on `pagehide`.
- **Discovery lease verification & error deduplication (`sidecars/panel/`, `ide/discovery.mjs`, `compat/i18n.cjs`, `compat/inline-widget.cjs`):** Renews 15s discovery leases via live PID + loopback port checks (`verifyCachedServer`), sanitizes discovery command timeouts/failures (`discoveryCommandError`) across `zh-CN` / `zh-TW` / `en`, and renders global connection/quota errors once in `#quota-error`.

## Install or update

- **Antigravity App:** open context details → **Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.9.6.zip` and run `python3 manage.py install` (Windows: `python manage.py install`; add `--with-launcher` on macOS for a zero-relaunch Dock app and `--with-cli` to sync CLI `statusLine`).
- **Antigravity CLI (`statusLine`):** run `python3 manage.py install-cli` (Windows: `python`; or `--with-cli` with Desktop install), then reopen `agy`.
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.9.6.vsix` using **Install from VSIX…**. This is separate from the App installer.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.
