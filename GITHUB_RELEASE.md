# Antigrative Dashboard v1.0.8-ide.1

## v1.0.8-ide.1 更新内容

- **修复点击对话尾部设置按钮后 IDE 状态条消失的问题**：
  - 将 `compat/inline-widget.cjs` 设置弹窗中定位行项的 `targetRow.scrollIntoView()` 替换为直接计算并更新 `#pulse-settings-body.scrollTop`，避免嵌套 iframe 触发外层 VS Code webview 容器偏移。
  - 将 `ide/webview-targets.mjs` 中 `agentOverlayProbe()` 的容器边界偏移容差从 `> 3px` 放宽至 `> 8px`，避免宿主微小偏移导致状态条被误判隐藏并卸载。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.8-ide.1.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.8-ide.1.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.8-ide.1

- **Fix IDE status bar disappearing after clicking the per-turn footer settings gear**:
  - Replaced `targetRow.scrollIntoView()` in `compat/inline-widget.cjs` with direct `#pulse-settings-body.scrollTop` adjustment so scrolling inside the nested Jetski iframe never shifts the outer VS Code webview container.
  - Relaxed the `agentOverlayProbe()` bounding rect tolerance in `ide/webview-targets.mjs` from `> 3px` to `> 8px` to prevent transient unmount on minor host container shifts.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.8-ide.1.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.8-ide.1.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
