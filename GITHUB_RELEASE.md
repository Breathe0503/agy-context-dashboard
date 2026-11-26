# Antigrative Dashboard v1.0.6

## v1.0.6 更新内容

- **修复 Antigravity IDE VSIX 启动崩溃、Jetski 挂载与跨项目统计缺失（[#119](https://github.com/wycocoyu/agy-context-dashboard/issues/119)）**：
  - 将缺失的运行时依赖 `compat/host-theme.mjs` 与 `compat/remote-ssh.mjs` 补入 `ide/package.py` 打包白名单及 `tools/publish-release.py` 校验清单，并在 `tests/test_ide.py` 新增解包 `.vsix` 实启动与依赖闭包回归测试。
  - 在 `ide/webview-targets.mjs` 与 `compat/runtime-ui.mjs` 中白名单放行 Jetski `iframe#jetski-frame` 的 `#t=<hex>` token fragment（含 CDP `Page.Frame.urlFragment` 拆分形态），修复 Antigravity IDE（`hostVersion 1.13.0`）卡在 `waiting-for-composer` 的问题。
  - 在 `sidecars/panel/local-conversations.mjs` 与 `sidecars/panel/transcript.mjs` 中支持识别 IDE 2.6 的 `.ide_migration` 迁移标记以扫描统一的 `~/.gemini/antigravity` 目录，修复跨项目历史用量漏统计。（深色模式 `--primary` 对比度问题已拆分至 [#120](https://github.com/wycocoyu/agy-context-dashboard/issues/120) 跟进。）
- **包含未发布的 v1.0.5 功能与稳定性修复**：
  - **仅周额度与仅缓存命中率显示模式（[#113](https://github.com/wycocoyu/agy-context-dashboard/issues/113)）**：新增 `weekly` 额度显示与三档 `cacheChipMode`（`仅总量` / `总量+命中` / `仅命中`），兼容旧版 `inlineCacheHit` 配置。
  - **窄屏平滑降级与 Orchestrator 排版保真**：调整窄屏降级顺序并拆分 `tight-text` 与 `snug-text`，对齐 `check-density-motion.mjs` 多档密度过渡校验。
  - **设置弹窗单行对齐与统计条留白优化**：放宽设置弹窗至 `540px` 并固定标题单行，放宽回复末尾统计条底部内边距。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.6.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.6.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.6

- **Fix Antigravity IDE VSIX startup crash, Jetski attachment, and migrated local conversation discovery ([#119](https://github.com/wycocoyu/agy-context-dashboard/issues/119))**:
  - Added missing runtime modules `compat/host-theme.mjs` and `compat/remote-ssh.mjs` to `ide/package.py` and `tools/publish-release.py`, and added an unpacked-VSIX dependency closure + collector boot test in `tests/test_ide.py`.
  - Whitelisted Jetski `#t=<hex>` token fragments and CDP `Page.Frame.urlFragment` in `ide/webview-targets.mjs` and `compat/runtime-ui.mjs`, fixing `waiting-for-composer` on Antigravity IDE (`hostVersion 1.13.0`).
  - Updated `sidecars/panel/local-conversations.mjs` and `sidecars/panel/transcript.mjs` to follow IDE 2.6 `.ide_migration` to `~/.gemini/antigravity` while preserving symlink isolation. (Low-contrast dark-mode `--primary` is tracked separately in [#120](https://github.com/wycocoyu/agy-context-dashboard/issues/120).)
- **Includes unpublished v1.0.5 improvements & CI fixes**:
  - **Weekly-only quota & hit-rate-only cache modes ([#113](https://github.com/wycocoyu/agy-context-dashboard/issues/113))**: Added `weekly` to `quotaDisplay` and upgraded inline cache display to 3-way `cacheChipMode` (`tokens` / `both` / `hit`) with full `inlineCacheHit` backward compatibility.
  - **Smoother inline narrow-width density fallback & Orchestrator spacing**: Reordered narrow-width fallback, separated `tight-text` from `snug-text`, and aligned `check-density-motion.mjs` transition bounds.
  - **Settings popover & per-turn footer polish**: Widened Settings popover (`492px` -> `540px`) with single-line labels and increased `.ag-pulse-turn-footer` bottom padding (`6px 0 8px`).

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.6.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.6.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
