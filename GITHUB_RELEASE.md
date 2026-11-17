# AGY Context Dashboard (Antigrative Dashboard) v0.9.1

Release `v0.9.1` for [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License, integrating upstream `v0.9.1` updates ([`#14`](https://github.com/wycocoyu/agy-context-dashboard/issues/14)) while preserving all `v0.8.13`–`v0.8.16` model, macOS discovery, and CLI `agy 1.5.x` enhancements.

## What changed in v0.9.1

- **Quota pace forecast & per-window token tracking (`compat/i18n.cjs`, `sidecars/panel/usage.mjs`, `usage-disk-worker.mjs`, `compat/inline-widget.cjs`, `sidecars/panel/app.js`):** Linear depletion forecasting with hatched projected tails (`.track-forecast`), `.pace-badge` status outlooks, per-window observed tokens + proportional full-capacity estimates (`quotaWindows`), clickable sibling quota rows, 4s-cooldown hover quota refresh, and live `composerModel` tracking.
- **Speed & cache card redesign (`minimal` vs `cat`) & direct update trigger (`sidecars/panel/metrics.mjs`, `history.mjs`, `compat/preferences.mjs`, `compat/update-ui.cjs`):** `peakTps`, `recentTps`, `lastActiveAt`, persisted `speedStyle` toggle (`minimal` sparkline / `cat` pixel cat), 3-segment cache breakdown bars, and a direct **Check for updates** trigger button.
- **All-local / current-account usage scope & unauthenticated local persistence (`sidecars/panel/store.mjs`, `usage.mjs`, `compat/usage-ui.cjs`):** `LOCAL_SCOPE` local ledger persistence when signed out, animated `All local` / `Current account` scope toggle (`usageScope`), sticky header/scrollable body layout, and table-row hover chart highlights.
- **Multi-composer strips & host font sync (`compat/inline-widget.cjs`, `compat/theme.cjs`, `compat/host-theme.mjs`, `compat/runtime-ui.mjs`):** Independent strip instances per visible composer (main, subagent, side questions) with React Fiber `cascadeId` fallback, spring expand from compact new sessions, and sanitized `--pulse-font` / `--pulse-font-mono` host font matching.
- **Full Antigravity IDE `2.6.0` support (`ide/webview-targets.mjs`, `ide/discovery.mjs`, `ide/client.mjs`, `ide/runtime.mjs`, `ide/surface.cjs`, `ide/main.mjs`):** Nested `jetski-frame` Webview discovery & attachment alongside `agy --hub` lineage and Windows TUN port fallback.
- **Preserved `v0.8.13`–`v0.8.16` fork features:** Retains `Gemini 4` (`1,048,576`), `GPT-6.1 Sol` (`1,050,000`), `Claude 4.5` (`200K`) / `Claude 4.6–5.5` (`1M`), `word/` / `@tag` / `perplexity/*` normalization, unified `3p` `Claude` labels, macOS `language_server.native` matching, `agy 1.5.x` CLI `statusLine` support, and `install --with-cli`.

## Install or update

- **Antigravity App:** open context details → **Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.9.1.zip` and run `python manage.py install` (or pass `--with-cli`; use `python3` on Linux/macOS).
- **Antigravity CLI (`statusLine`):** run `python manage.py install-cli` (or `--with-cli` with Desktop install; `python3` on Linux/macOS), then reopen `agy`.
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.9.1.vsix` using **Install from VSIX…**. This is separate from the App installer.
- Fully quit and reopen the corresponding host after installation. Keep using the IDE's loopback debugging launch arguments when required.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.
