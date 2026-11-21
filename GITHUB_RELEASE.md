# AGY Context Dashboard v0.9.6

`wycocoyu/agy-context-dashboard` `v0.9.6`（MIT 协议）修复 **Antigravity Desktop `2.34.0+` 凭据断连**，并同步上游 `v0.9.9`–`v0.9.10` 上下文提示与探测稳定性优化。

## 更新内容

- **适配 `2.34.0+` daemon 凭据**：自动从 `~/.gemini/<appDataDir>/daemon/*.json` 双校验读取凭据，兼容移除 `--csrf_token` 的新版与 `<= 2.33.x`。
- **上下文压缩与容量预警**：新增压缩次数徽标，上下文圆环与进度条按 `75%` 黄色、`90%` 红色分档预警。
- **探测保活与报错去重**：15 秒租约到期先验活端口再重扫，探测失败三语脱敏并收敛至单栏提示。

## 安装或更新

- **Antigravity 桌面 App**：上下文详情 → **检查更新**（`v0.8.14+`），或解压 `antigrative-dashboard-0.9.6.zip` 后运行 `python3 manage.py install`（Windows 用 `python`）。
- **Antigravity CLI / 独立 IDE**：CLI 运行 `python3 manage.py install-cli`；IDE 安装 `antigrative-dashboard-ide-0.9.6.vsix`。现有配置与统计自动保留。

---

## What changed in v0.9.6

- **Antigravity `2.34.0+` daemon auth:** Reads PID- and port-verified metadata from `~/.gemini/<appDataDir>/daemon/*.json` when `--csrf_token` is omitted, while keeping `<= 2.33.x` compatibility.
- **Compaction badge & threshold colors:** Shows context compaction count badges and highlights the context ring and bar at `>= 75%` warning and `>= 90%` danger thresholds.
- **Discovery lease & deduplicated errors:** Verifies live PID and loopback port before rescanning, sanitizes probe errors across `en` / `zh-CN` / `zh-TW`, and renders global errors once in `#quota-error`.

## Install or update

- **Antigravity App:** Open context details → **Check for updates** (`v0.8.14+`), or extract `antigrative-dashboard-0.9.6.zip` and run `python3 manage.py install` (`python` on Windows).
- **Antigravity CLI / Standalone IDE:** Run `python3 manage.py install-cli` for CLI `statusLine`, or install `antigrative-dashboard-ide-0.9.6.vsix` via **Install from VSIX…**. Settings, history, and SHA-256 verification remain intact.
