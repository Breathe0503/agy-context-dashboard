# AGY Context Dashboard (Antigrative Dashboard) v0.8.15

Upstream `v0.8.20` merge release for [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License (`#2`), preserving all `v0.8.13`–`v0.8.14` community fork features (`language_server.native`, Gemini 4 & GPT-6.1 Sol 1M+ provider context references with host-reported `maxContextTokens` occupancy, existing UI behavior, user settings, `history-v1` snapshots and `usage-v1` ledgers).

## What changed in v0.8.15

- **SQLite background collection & disk-backed usage ledger:** Added bounded worker-thread statistics acquisition (`background-worker.mjs`, `background-statistics.mjs`, `disk-statistics.mjs`, `collection-state.mjs`, `usage-disk-worker.mjs`) using `node:sqlite`, streaming RPC reads (`streamTrajectoryPage`), cancellation guards, disk/memory budgets, `.sqlite` `usage-v1` ledger migration (preserving legacy `.json` imports and `previousTaskUsage` recovery), and live progress status in the UI.
- **Gemini 4 Argon weekly quota:** Added dedicated `gemini-argon-wtu` weekly quota group handling (`metrics.mjs`, `compat/i18n.cjs`, `compat/inline-widget.cjs`, `sidecars/panel/app.js`), flat-bucket family separation, nested `remaining.*` fallbacks, and dynamic 5h/weekly window rendering.
- **Subagent tab isolation & nested IDE webviews:** Isolated sidebar subagent composer ownership (`[data-testid="subagent-tab-conversation"]`), enforced `selectLatest: false` for inline snapshot lookups, added `allowNested`/`sourceForTarget` support for IDE webviews, and enforced synchronous binding revocation in `compat/runtime-ui.mjs`.
- **Updater `DirectoryAnchor`, discovery hardening & panel badge:** Added physical directory anchoring (`DirectoryAnchor`) and `install-location` / `plan-expired` guidance in the updater, `httpLogPorts` + TUN-aware `netstatSnapshot` + bounded `probeLoopbackPort` / `discoverWindowsPorts` in Windows discovery, the verified version badge in the panel header (`panel-source.mjs`), and updated IDE/release packaging allowlists (`ide/package.py`, `tools/publish-release.py`).
- **Preserved `wycocoyu/agy-context-dashboard` fork identity:** Kept internal plugin ID (`antigravity-pulse`), archive names (`antigrative-dashboard-0.8.15.zip` / `antigrative-dashboard-ide-0.8.15.vsix`), repository/updater URLs, `language_server.native` macOS discovery, and Gemini 4 / GPT-6.1 Sol 1M+ references.

## Install or update

- **Antigravity App:** open context details → **⋯ → Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.8.15.zip` and run `python manage.py install` (`python3` on Linux/macOS).
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.8.15.vsix` using **Install from VSIX…**. This is separate from the App installer.
- Fully quit and reopen the corresponding host after installation. Keep using the IDE's loopback debugging launch arguments when required.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.

## Verification and limits

Local checks run on macOS before tagging `v0.8.15`:

- **Node (`npm test`):** 462 passed, 0 failed.
- **IDE unit tests (`node --test ide/tests/*.test.mjs`):** 11 passed, 0 failed.
- **Python (`python3 -m unittest discover -s tests`):** 80 passed, 2 skipped on macOS (82 total).
- **Real worker update & memory budget scripts:** `npm run test:update-process`, `check-transcript-resources.mjs`, and `check-trajectory-resources.mjs` (`640 1024` and `--expect-budget-rejection`) passed; `manage.py package` and `ide/package.py` outputs verified via `tools/publish-release.py`.

Windows/Linux/macOS CI gates run in GitHub Actions during release publication. Local Playwright browser UI checks were not run locally (no local `playwright` install) and rely on the CI matrix.
