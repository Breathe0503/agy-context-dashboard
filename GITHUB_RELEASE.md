# AGY Context Dashboard (Antigrative Dashboard) v0.8.16

Release `v0.8.16` for [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License, shipping Claude compatibility & unified `3p` quota normalization ([`#3`](https://github.com/wycocoyu/agy-context-dashboard/issues/3), [`#6`](https://github.com/wycocoyu/agy-context-dashboard/pull/6)) and Antigravity CLI `statusLine` sync with `v0.8.15` and `agy 1.5.x` ([`#4`](https://github.com/wycocoyu/agy-context-dashboard/issues/4), [`#7`](https://github.com/wycocoyu/agy-context-dashboard/pull/7)) on top of the `v0.8.15` (`v0.8.20` upstream merge) baseline, while keeping existing user settings, `history-v1` snapshots, and `usage-v1` ledgers intact.

## What changed in v0.8.16

- **Claude 4.5–5.5 compatibility, alias normalization & unified `3p` `Claude` quota label (`#3`, `#6`):** Added `200K` (Claude 4.5) and `1M` (Claude 4.6–5.5) provider context references (`sidecars/panel/context.mjs`, `docs/CONTEXT_LIMITS.md`) while keeping occupancy strictly bound to host-reported `maxContextTokens`; normalized `word/` wrappers, `@default` / `@YYYYMMDD` date tags, and `perplexity/*` slugs consistently across desktop, CLI, and usage ledgers (`sidecars/panel/usage.mjs`, `usage-disk-worker.mjs`, `compat/usage-ui.cjs`) at read/render time without mutating stored files; unified the shared `3p` quota group label to `Claude` (`compat/i18n.cjs`).
- **CLI `statusLine` sync with `v0.8.15` & `agy 1.5.x` (`#4`, `#7`):** Synced `cli/metrics.mjs`, `cli/render.mjs`, `cli/statusline.mjs`, and `docs/CLI.md` with dedicated `Argon` weekly quota rows (`gemini-argon-wtu` / `gemini-argon-wtu-weekly`), `3p` `Claude` terracotta labeling (`#DA7756`), `zh-TW` localization, `--details` subagent summaries, and first-party `agy 1.5.x` (`1.5.5`–`1.5.9`) cache-rate calculation when `cache_creation_input_tokens` is `0`.
- **Unified Desktop + CLI install & staleness detection (`manage.py`, `cli/lifecycle.py`):** Added `install --with-cli`, recorded CLI version metadata in `installation.json`, surfaced `sourceVersion` and `stale` status in `status` / `status-cli`, and added non-destructive stale-CLI hints during desktop installs.

## Install or update

- **Antigravity App:** open context details → **⋯ → Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.8.16.zip` and run `python manage.py install` (or pass `--with-cli`; use `python3` on Linux/macOS).
- **Antigravity CLI (`statusLine`):** run `python manage.py install-cli` (or `--with-cli` with Desktop install; `python3` on Linux/macOS), then reopen `agy`.
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.8.16.vsix` using **Install from VSIX…**. This is separate from the App installer.
- Fully quit and reopen the corresponding host after installation. Keep using the IDE's loopback debugging launch arguments when required.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.

## Verification and limits

Local checks run on macOS (`Antigravity 2.32.1`, `agy 1.5.9`) before tagging `v0.8.16`:

- **Node (`npm test`):** 471 passed, 0 failed.
- **IDE unit tests (`node --test ide/tests/*.test.mjs`):** 11 passed, 0 failed.
- **Python (`python3 -m unittest discover -s tests`):** 82 passed, 2 Windows-specific tests skipped on macOS (84 total).
- **Real worker update, memory budget scripts & packaging:** `npm run test:update-process`, `check-transcript-resources.mjs`, `check-trajectory-resources.mjs` (`640 1024` and `--expect-budget-rejection`), `python3 manage.py package`, `python3 ide/package.py`, and `tools/publish-release.py` `checked_assets('v0.8.16')` passed.
- **Live host runtime check:** Verified post-restart sidecar runtime attachment (`mounted` / `live`) on macOS Antigravity Desktop `2.32.1` and `agy 1.5.9` CLI statusLine installation.

Windows/Linux/macOS CI gates (including Playwright Chromium UI suites across `test:ui`, `check-ide-ui.mjs`, `test:usage-ui`, and `test:panel-ui`) run in GitHub Actions during release publication. Standalone IDE `.vsix` and Linux signed-in GUI acceptance remain separate from local macOS Desktop verification.
