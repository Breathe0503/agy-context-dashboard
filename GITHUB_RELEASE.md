# AGY Context Dashboard (Antigrative Dashboard) v0.9.3

Release `v0.9.3` for [`wycocoyu/agy-context-dashboard`](https://github.com/wycocoyu/agy-context-dashboard) under the MIT License, making **Antigravity Desktop `2.33.0+` automatic debug-port recovery enabled by default** ([`#19`](https://github.com/wycocoyu/agy-context-dashboard/issues/19)) and clarifying the `2.33.0+` behavior at the top of the README while retaining every `v0.9.2`, `v0.9.1`, and `v0.8.13`–`v0.8.16` capability.

## What changed in v0.9.3

- **Default-on `autoRelaunchDebug` recovery for inline desktop installs (`sidecars/panel/main.mjs`, `sidecars/panel/app.js`, [`#19`](https://github.com/wycocoyu/agy-context-dashboard/issues/19)):** Switch `autoRelaunchDebug` from opt-in (`default OFF`) to opt-out (`default ON`, enabled whenever `!prefs?.error && prefs?.autoRelaunchDebug !== false`). Opening Antigravity `2.33.0+` without debug flags—or after an in-app `quitAndInstall()` update restart—automatically triggers a guarded relaunch (`60s` cooldown + PID dedupe) with `--remote-debugging-port=0 --remote-debugging-address=127.0.0.1` so the inline status bar attaches automatically without manual clicks. Uncheck the toggle in the Side Panel (**+ → Extensions → Antigrative Dashboard**) at any time to persist `autoRelaunchDebug: false`.
- **Top-of-README notice (`README.md`, `README.en.md`, `COMPATIBILITY.md`):** Document Antigravity `2.33.0+`'s opt-in `--remote-debugging-port`, `quitAndInstall()` CLI flag loss, `ElectronAsarIntegrity` constraints, default-on auto-recovery, and zero-relaunch `Antigravity (Debug)` launcher usage right at the top of both READMEs.
- **Included `v0.9.2` & `v0.9.1` highlights:** Cross-platform desktop debug launcher (`install --with-launcher` / `install-launcher` / `launch [--relaunch]`), `missing-debug-port` diagnostics, quota pace forecasting & per-window token tracking, `minimal` / `cat` speed card styles, `All local` / `Current account` usage scope toggle, multi-composer strips with host font sync, Antigravity IDE `2.6.0` nested Webview support, `Gemini 4` / `GPT-6.1 Sol` / `Claude 4.5–5.5` compatibility, macOS `language_server.native` matching, and `agy 1.5.x` CLI `statusLine` parity.

## Install or update

- **Antigravity App:** open context details → **Check for updates** (available from `v0.8.14` onward). Alternatively, extract `antigrative-dashboard-0.9.3.zip` and run `python manage.py install --with-launcher` (add `--with-cli` to also sync CLI `statusLine`; use `python3` on Linux/macOS).
- **Antigravity CLI (`statusLine`):** run `python manage.py install-cli` (or `--with-cli` with Desktop install; `python3` on Linux/macOS), then reopen `agy`.
- **Standalone Antigravity IDE:** install `antigrative-dashboard-ide-0.9.3.vsix` using **Install from VSIX…**. This is separate from the App installer.
- For Antigravity Desktop `2.33.0+`, daily launches via the generated debug launcher (`Antigravity (Debug)`) avoid any extra startup relaunch; regular Dock/shortcut launches and post-update `quitAndInstall()` restarts now auto-recover by default unless turned off in the Side Panel.
- Existing settings, language choices, `history-v1` and `usage-v1` are preserved. SHA-256 checksum files accompany both packages.
