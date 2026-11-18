# AGY Context Dashboard (Antigrative Dashboard) v0.9.2

Release `v0.9.2` for [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License, adding **Antigravity Desktop `2.33.0+` opt-in debug port adaptation** ([`#17`](https://github.com/wycocoyu/agy-context-dashboard/issues/17), [`#18`](https://github.com/wycocoyu/agy-context-dashboard/pull/18)) while retaining every `v0.9.1` and `v0.8.13`–`v0.8.16` capability.

## What changed in v0.9.2

- **Cross-platform Desktop Debug Launcher & CLI diagnostics (`compat/desktop_launcher.py`, `manage.py`):** Antigravity `2.33.0+` disables `--remote-debugging-port` by default and deletes `DevToolsActivePort` on normal startup, while macOS `ElectronAsarIntegrity` forbids modifying `app.asar`. Added `install --with-launcher`, `install-launcher`, `uninstall-launcher`, `launch [--relaunch]`, and `debugPortAvailable` / `launcher` / `debugPortHint` in `manage.py status` (generating `~/Applications/Antigravity (Debug).app` on macOS, `Launch Antigravity (Debug).cmd` on Windows, and `antigravity-pulse-debug.desktop` on Linux).
- **Side Panel `missing-debug-port` diagnostics & post-update relaunch (`compat/runtime-ui.mjs`, `compat/debug-relaunch.mjs`, `compat/debug-relaunch-worker.mjs`, `compat/preferences.mjs`, `compat/i18n.cjs`, `sidecars/panel/{main.mjs,app.js,styles.css}`):** Surface `reason: 'missing-debug-port'` when `DevToolsActivePort` is missing, expose `POST /api/relaunch-debug` with a detached quit-wait-0-PIDs-then-relaunch worker, and add a localized **Relaunch with Debug Port** button plus opt-in **Auto-relaunch when debug port is missing** toggle (`60s` cooldown guard) in the official Side Panel for `quitAndInstall()` app update restarts.
- **Included `v0.9.1` highlights:** Quota pace forecasting & per-window token tracking, `minimal` / `cat` speed card styles, `All local` / `Current account` usage scope toggle, multi-composer strips with host font sync, Antigravity IDE `2.6.0` nested Webview support, `Gemini 4` / `GPT-6.1 Sol` / `Claude 4.5–5.5` compatibility, macOS `language_server.native` matching, and `agy 1.5.x` CLI `statusLine` parity.

## Install or update

- **Antigravity App:** open context details → **Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.9.2.zip` and run `python manage.py install --with-launcher` (add `--with-cli` to also sync CLI `statusLine`; use `python3` on Linux/macOS).
- **Antigravity CLI (`statusLine`):** run `python manage.py install-cli` (or `--with-cli` with Desktop install; `python3` on Linux/macOS), then reopen `agy`.
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.9.2.vsix` using **Install from VSIX…**. This is separate from the App installer.
- For Antigravity Desktop `2.33.0+`, use the generated debug launcher or `python3 manage.py launch --relaunch` (or the Side Panel **Relaunch with Debug Port** button after an app update).
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.
