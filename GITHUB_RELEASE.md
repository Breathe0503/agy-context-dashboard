# Antigrative Dashboard v0.8.13

First community continuation release at `wycocoyu/antigrative-dashboard` under the MIT License after the original upstream repository (`YOU-SHOULD-KNOW-ME/antigrative-dashboard`) went offline. This release preserves existing UI behavior, user settings, `history-v1` snapshots and `usage-v1` ledgers.

## What changed

- **Updater & repository retargeting:** Point `compat/update-worker.py`, `ide/package.json`, and installation/release links to `wycocoyu/antigrative-dashboard` so in-app **Check for updates** checks this repository.
- **macOS native server discovery:** Support `language_server.native` process names in `sidecars/panel/discovery.mjs` and cover it in `sidecars/panel/tests/platform.test.mjs`.
- **New model recognition & 1M+ provider references:** Add model normalization and verified official context-window references (`docs/CONTEXT_LIMITS.md`, `sidecars/panel/context.mjs`) for `Gemini 4 Hydrogen`, `Gemini 4 Argon`, `Gemini 4 Carbon` (`1,048,576`) and `GPT-6.1 Sol` (`1,050,000`), while keeping active occupancy strictly bound to the host-reported `maxContextTokens`.

## Install or update

- **Antigravity App:** open context details → **⋯ → Check for updates** (available once `v0.8.13` or later is installed). Alternatively, extract `antigrative-dashboard-0.8.13.zip` and run `python manage.py install` (`python3` on Linux/macOS).
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.8.13.vsix` using **Install from VSIX…**. This is separate from the App installer.
- Fully quit and reopen the corresponding host after installation. Keep using the IDE's loopback debugging launch arguments when required.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.

## Verification and limits

Local checks run before tagging `v0.8.13`:

- **Node (`npm test`):** 335 passed, 0 failed.
- **IDE unit tests (`node --test ide/tests/*.test.mjs`):** 11 passed, 0 failed.
- **Python (`python3 -m unittest discover -s tests`):** 80 passed, 2 skipped (82 total).
- **Real worker update & memory budget scripts:** `npm run test:update-process`, `check-transcript-resources.mjs`, and `check-trajectory-resources.mjs --expect-budget-rejection` passed; `manage.py package` and `ide/package.py` outputs verified via `tools/publish-release.py`.

Windows/Linux/macOS CI gates run in GitHub Actions during release publication. Local Playwright browser UI checks were not run locally (no local `playwright` install) and rely on the CI matrix.
