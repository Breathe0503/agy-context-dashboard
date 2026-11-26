# Antigrative Dashboard v1.0.4

## v1.0.4 更新内容

- **输入框底部独立一行模式（[#112](https://github.com/wycocoyu/agy-context-dashboard/issues/112)）**：在底栏设置弹窗与宿主系统设置新增「底栏位置（同行嵌入 / 底部独立一行）」，超长模型名与双数字场景下不再挤压模型选择器，非纵向容器自动安全回退。
- **每轮回复末尾统计条与跳转高亮（[#79](https://github.com/wycocoyu/agy-context-dashboard/issues/79)）**：在每轮回复操作栏上方新增单行轻量统计（模型名 / 输入 / 输出 / 缓存 / 均速，复用 `classifyRates()` 质量过滤），支持 Fail-Closed 防错位校验、默认开启/一键关闭，以及悬停齿轮直接跳转设置并高亮对应开关。
- **密度降级保真与双数字配额优化（[#106](https://github.com/wycocoyu/agy-context-dashboard/issues/106)）**：在 `compact-text` 优先保住上下文轮数/标签与双数字配额，新增 `dense-text` 缓冲档位，并在角标配额模式省略冗余 `5h` 前缀。
- **宿主系统设置集成与品牌统一（[#102](https://github.com/wycocoyu/agy-context-dashboard/issues/102)，[#108](https://github.com/wycocoyu/agy-context-dashboard/issues/108)，[#110](https://github.com/wycocoyu/agy-context-dashboard/pull/110)）**：将插件设置直接整合进宿主 System Settings 侧边栏，并统一用户侧品牌名称为 Antigravity Dashboard。
- **模型用量图与短采样诊断优化（[#67](https://github.com/wycocoyu/agy-context-dashboard/issues/67)，[#82](https://github.com/wycocoyu/agy-context-dashboard/pull/82)，[#103](https://github.com/wycocoyu/agy-context-dashboard/issues/103)，[#111](https://github.com/wycocoyu/agy-context-dashboard/pull/111)）**：优化 Usage by Model 堆叠柱配色、紧凑柱条与双行图例折叠，并区分短窗口采样与缓冲突发。
- **安装器热重启修复（`manage.py`）**：修复 `restart_active_sidecar()` 读取真实 `sidecar_data` 目录并增加 `main.mjs` 进程核验，恢复 `@lifecycle_operation` 到 `install()`。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.4.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.4.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.4

- **Optional dedicated footer row layout ([#112](https://github.com/wycocoyu/agy-context-dashboard/issues/112))**: Added `barPlacement` (`inline` / `footer`) in both the inline Settings popover and Antigravity System Settings, freeing the full composer width below the toolbar with a `1px` top divider and automatic fallback on non-vertical layouts.
- **Per-turn reply telemetry footer ([#79](https://github.com/wycocoyu/agy-context-dashboard/issues/79))**: Added an optional single-line per-turn telemetry summary (`model`, `In/Out`, `Cache%`, `Avg tok/s` filtered by `classifyRates()`, trilingual labels) above each completed assistant reply toolbar with Fail-Closed alignment and a hover-only gear shortcut that jumps to and highlights the `turnFooter` row in Settings.
- **5-tier density fallback & quota visibility ([#106](https://github.com/wycocoyu/agy-context-dashboard/issues/106))**: Prioritized context rounds/label and both quota windows in `compact-text`, added `dense-text` tier before `icons-only`, omitted redundant `5h` prefix in `compact` quota mode, and respected host `min-width`.
- **System Settings integration & branding ([#102](https://github.com/wycocoyu/agy-context-dashboard/issues/102), [#108](https://github.com/wycocoyu/agy-context-dashboard/issues/108), [#110](https://github.com/wycocoyu/agy-context-dashboard/pull/110))**: Integrated Antigravity Dashboard settings into Antigravity System Settings and unified user-facing branding to Antigravity Dashboard.
- **Usage chart polish & rate diagnostics ([#67](https://github.com/wycocoyu/agy-context-dashboard/issues/67), [#82](https://github.com/wycocoyu/agy-context-dashboard/pull/82), [#103](https://github.com/wycocoyu/agy-context-dashboard/issues/103), [#111](https://github.com/wycocoyu/agy-context-dashboard/pull/111))**: Refined Usage by Model chart palette, dense embedded bars, and 2-row foldable legend, and split short-window samples and buffered bursts from uncertain timing.
- **Sidecar hot-restart & installer lock fix (`manage.py`)**: Fixed `restart_active_sidecar()` to read `active-sidecar.json` from the real `sidecar_data` directory with PID verification (`main.mjs`) and restored `@lifecycle_operation` on `install()`.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.4.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.4.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
