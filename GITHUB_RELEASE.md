# Antigrative Dashboard v1.0.5

## v1.0.5 更新内容

- **仅周额度与仅缓存命中率显示模式（[#113](https://github.com/wycocoyu/agy-context-dashboard/issues/113)）**：在底栏设置弹窗、缓存浮卡与宿主系统设置中，为「额度显示」新增 `仅周`（`weekly`），并将底栏缓存升级为三档 `cacheChipMode`（`仅总量` / `总量+命中` / `仅命中`），兼容旧版 `inlineCacheHit` 配置。
- **窄屏平滑降级顺序与 Orchestrator 排版保真**：调整窄屏优先藏轮数（`tight-text`）再藏命中率（`trim-hit`），最后才收起双数字额度（`dense-text`）；并将「藏轮数」与「微缩字号/间距（`snug-text`）」拆档，让 3 芯片保持原本 `11px` / `3px` 宽松间距，4 芯片 `Orchestrator` 也能同时保留命中率与双数字额度。
- **设置弹窗单行对齐与统计条留白优化**：放宽设置弹窗至 `540px` 并固定标题单行不折行（`white-space: nowrap`），同时把回复末尾统计条底部内边距放宽至 `padding: 6px 0 8px`。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.5.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.5.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.5

- **Weekly-only quota & hit-rate-only cache modes ([#113](https://github.com/wycocoyu/agy-context-dashboard/issues/113))**: Added `weekly` to `quotaDisplay` and upgraded inline cache display to a 3-way `cacheChipMode` (`tokens` / `both` / `hit`) across the inline Settings popover, `Token · Cache` card, and Antigravity System Settings, with full backward compatibility for existing `inlineCacheHit` preferences.
- **Smoother inline narrow-width density fallback & Orchestrator spacing**: Reordered narrow-width fallback to hide context rounds (`tight-text`) before trimming cache hit (`trim-hit`) and dual quota (`dense-text`), separated airy `tight-text` from compact `snug-text` so 3-chip bars keep `11px` / `3px` spacing while 4-chip `Orchestrator` bars retain both cache hit rate and dual quota at `758px`.
- **Settings popover & per-turn footer polish**: Widened the Settings popover (`492px` -> `540px`), rebalanced column widths with single-line labels (`white-space: nowrap`), and increased `.ag-pulse-turn-footer` bottom breathing room (`padding: 6px 0 8px`).

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.5.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.5.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
