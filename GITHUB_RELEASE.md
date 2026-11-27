# Antigrative Dashboard v1.0.8

## v1.0.8 更新内容

- **多窗口 Antigravity IDE 2.6 CDP 端口恢复与按窗口 `agy --hub` 精准路由（[#128](https://github.com/wycocoyu/agy-context-dashboard/pull/128)）**：
  - 在 `ide/discovery.mjs` 新增 `discoverIdeDebugPorts()`，并在 `ide/runtime.mjs` 中当新启动窗口短暂覆盖 `DevToolsActivePort` 导致 `ECONNREFUSED` 时自动探测并缓存存活的 CDP 调试端口，避免所有窗口状态条消失并卡在 `reconnecting`。
  - 在 `compat/runtime-ui.mjs`、`ide/main.mjs`、`ide/client.mjs` 与 `ide/discovery.mjs` 中按每个 webview 的 `connection.origin` 端口维护最多 4 个 LRU 缓存的 `hubStores`，将多窗口并发对话请求准确路由至各自所属的 `agy --hub` 实例，防止串台或另一窗口显示「尚无请求」。
- **周额度预计耗尽时间按当日活跃对话时长折算（[#128](https://github.com/wycocoyu/agy-context-dashboard/pull/128)）**：
  - 在 `sidecars/panel/usage.mjs` 与 `sidecars/panel/usage-disk-worker.mjs` 中汇总当日活跃对话总时长（`dailyWorkHours`），并在 `sidecars/panel/app.js`、`compat/inline-widget.cjs` 与 `compat/i18n.cjs` 中按实际日均活跃时长折算周额度耗尽预测，同时在悬停提示中展示推算依据。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.8.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.8.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.8

- **Multi-window Antigravity IDE 2.6 CDP port recovery & per-window `agy --hub` routing ([#128](https://github.com/wycocoyu/agy-context-dashboard/pull/128))**:
  - Added `discoverIdeDebugPorts()` in `ide/discovery.mjs` and fallback CDP port probing/caching in `ide/runtime.mjs` so launching a second IDE window that briefly overwrites `DevToolsActivePort` (`ECONNREFUSED`) no longer drops existing status strips or leaves them stuck in `reconnecting`.
  - Routed each IDE webview snapshot via its `connection.origin` port across `compat/runtime-ui.mjs`, `ide/main.mjs`, `ide/client.mjs`, and `ide/discovery.mjs` using up to 4 LRU-cached `hubStores`, ensuring concurrent chats across multiple IDE windows target their own `agy --hub` instance.
- **Weekly quota depletion forecast scaled by daily active conversation duration ([#128](https://github.com/wycocoyu/agy-context-dashboard/pull/128))**:
  - Aggregated daily active conversation duration (`dailyWorkHours`) in `sidecars/panel/usage.mjs` and `sidecars/panel/usage-disk-worker.mjs`, scaling weekly quota depletion forecasts by actual daily active duration across `sidecars/panel/app.js`, `compat/inline-widget.cjs`, and `compat/i18n.cjs` with basis details in hover tooltips.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.8.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.8.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
