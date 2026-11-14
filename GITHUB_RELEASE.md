# AGY Context Dashboard (Antigrative Dashboard) v0.8.14

Repository rename and metadata alignment release at [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License (continuing from `YOU-SHOULD-KNOW-ME/antigrative-dashboard` `v0.8.12`), preserving all `v0.8.13` fixes (`language_server.native`, Gemini 4 & GPT-6.1 Sol 1M+ provider context references), existing UI behavior, user settings, `history-v1` snapshots and `usage-v1` ledgers.

## What changed in v0.8.14

- **Renamed repository & retargeted updater:** Renamed the continuation repository to `wycocoyu/agy-context-dashboard` for better discoverability across Antigravity (`agy`) and DSH communities, and updated `compat/update-worker.py`, `ide/package.json`, READMEs and release links to match the new repository path so in-app **Check for updates** works seamlessly.
- **Zero-breakage compatibility:** Retained the internal plugin ID (`antigravity-pulse`) and archive naming (`antigrative-dashboard-0.8.14.zip` / `antigrative-dashboard-ide-0.8.14.vsix`) so existing settings and history stay intact.

## Install or update

- **Antigravity App:** open context details → **⋯ → Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.8.14.zip` and run `python manage.py install` (`python3` on Linux/macOS).
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.8.14.vsix` using **Install from VSIX…**. This is separate from the App installer.
- Fully quit and reopen the corresponding host after installation. Keep using the IDE's loopback debugging launch arguments when required.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.

## Verification and limits

Local checks run before tagging `v0.8.14`:

- **Node (`npm test`):** 335 passed, 0 failed.
- **IDE unit tests (`node --test ide/tests/*.test.mjs`):** 11 passed, 0 failed.
- **Python (`python3 -m unittest discover -s tests`):** 80 passed, 2 skipped (82 total).
- **Real worker update & memory budget scripts:** `npm run test:update-process`, `check-transcript-resources.mjs`, and `check-trajectory-resources.mjs --expect-budget-rejection` passed; `manage.py package` and `ide/package.py` outputs verified via `tools/publish-release.py`.

Windows/Linux/macOS CI gates run in GitHub Actions during release publication. Local Playwright browser UI checks were not run locally (no local `playwright` install) and rely on the CI matrix.
