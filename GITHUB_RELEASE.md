# Antigrative Dashboard v1.0.7-ide.1

## v1.0.7-ide.1 更新内容

- **修复多窗口 Antigravity IDE 2.6 CDP 端口覆盖与按窗口路由 `agy --hub`**：
  - 当使用 `--remote-debugging-port=0` 启动第 2 个 IDE 窗口导致 `DevToolsActivePort` 被短命进程覆盖为死端口时，自动发现并缓存运行中 `Antigravity IDE` 主进程的真实回环 CDP 端口（`ide/discovery.mjs`、`ide/runtime.mjs`）。
  - 多窗口共享同一 Electron 主进程存在多个 `agy --hub` 时，按监听状态与最小 PID 稳定选取，并将每个 Jetski Webview 的实时快照精准路由到该窗口专属的 `agy --hub` 端口（`compat/runtime-ui.mjs`、`ide/client.mjs`、`ide/main.mjs`），解决另一窗口正在对话却显示「尚无请求」的问题。
- **周额度耗尽预测按当日总对话时长自动折算（免配置）**：
  - 在 `sidecars/panel/usage.mjs` 与 `sidecars/panel/usage-disk-worker.mjs` 中自动按 15 分钟空闲断层统计当日总对话时长（`todayActiveMs` / `dailyWorkHours`，当日无记录时回退近 7 个活跃日均值），并用于周额度耗尽预测折算（5h 窗口不受影响）。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.7-ide.1.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.7-ide.1.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.7-ide.1

- **Multi-window Antigravity IDE 2.6 CDP recovery & per-window `agy --hub` routing**:
  - Automatically recover and cache the running IDE root's live loopback CDP port when launching an additional IDE window with `--remote-debugging-port=0` overwrites `DevToolsActivePort` with a short-lived ephemeral port.
  - Deterministically select a live `agy --hub` under the shared Electron root and route each Jetski webview's live snapshot to its own hub port so concurrent IDE windows show real-time context and cache metrics.
- **Weekly quota depletion forecast scaled by daily active conversation duration**:
  - Automatically compute today's active conversation duration (15-minute idle gap clustering, 7-day active fallback) in both JSON and SQLite usage summaries and scale weekly quota depletion forecasts accordingly (5h window unchanged).

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.7-ide.1.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.7-ide.1.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
