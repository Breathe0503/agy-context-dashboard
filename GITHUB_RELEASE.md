# Antigrative Dashboard v1.0.9

## v1.0.9 更新内容

- **全面校准 Gemini 4 / 3.x / 2.5 与 Claude 5.5 公开参考计价（[#134](https://github.com/wycocoyu/agy-context-dashboard/issues/134), [#136](https://github.com/wycocoyu/agy-context-dashboard/pull/136), [#137](https://github.com/wycocoyu/agy-context-dashboard/pull/137)）**：
  - 将 `Gemini 4 Hydrogen`（`$1.50 / $0.075 / $7.50`）、`Neon`（`$3.00 / $0.15 / $15.00`）、`Argon` 与 `Carbon`（`2026-11-30` 前 `$2.00 / $0.10 / $10.00`，`2026-12-01` 起 `$4.00 / $0.20 / $20.00`）从老一代 Gemini 2.5 规则中拆出，统一 Gemini 系列 `cacheWrite = $0` 并补入 `MODEL_PLACEHOLDER_M578`（`Gemini 4 Hydrogen (Sonar)`）。
  - 新增 `Claude Opus 5.5`（`$4.00 / $0.20 / $5.00 / $20.00`）并修正宿主占位符归属（`M368`、`M400..M402`、`M406` 归入 Opus 5.5，`M377`、`M403..M405`、`M407` 归入 Sonnet 5.5），同步校准 `Claude Sonnet 5.5`、`Claude Haiku 5.5`（含 `>100K` 长上下文阶梯）、`Gemini 3.6/3.7/3.8 Flash`、`Flash-Lite` 与 `Gemini 3.1/2.5 Pro` 费率，并在 `insights.mjs` 中按日保留历史切价前账单精度。
- **修复独立底栏（`footer`）模式被角落悬浮控件误遮挡与卡死恢复问题（[#135](https://github.com/wycocoyu/agy-context-dashboard/pull/135)）**：
  - 在 `compat/inline-widget.cjs` 的 `footer` 模式下按实际可见 `.bar` 元素范围（而非整行 `100%` 空白外边距）检测外部角标碰撞，并在测量密度档位时临时移除 `data-layout`，解决从 `blocked` 切换回 `ready` 的恢复死锁。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.9.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.9.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.9

- **Calibrated Gemini 4 / 3.x / 2.5 & Claude 5.5 public reference pricing ([#134](https://github.com/wycocoyu/agy-context-dashboard/issues/134), [#136](https://github.com/wycocoyu/agy-context-dashboard/pull/136), [#137](https://github.com/wycocoyu/agy-context-dashboard/pull/137))**:
  - Split `Gemini 4 Hydrogen` (`$1.50 / $0.075 / $7.50`), `Neon` (`$3.00 / $0.15 / $15.00`), `Argon`, and `Carbon` (`$2.00 / $0.10 / $10.00` through `2026-11-30`, stepping up to `$4.00 / $0.20 / $20.00` on `2026-12-01`) from legacy Gemini 2.5 rules, set Gemini `cacheWrite` to `$0`, and mapped `MODEL_PLACEHOLDER_M578` (`Gemini 4 Hydrogen (Sonar)`).
  - Added `Claude Opus 5.5` (`$4.00 / $0.20 / $5.00 / $20.00`) and fixed host placeholder mappings (`M368`, `M400..M402`, `M406` -> Opus 5.5; `M377`, `M403..M405`, `M407` -> Sonnet 5.5), calibrated `Claude Sonnet 5.5`, `Claude Haiku 5.5` (`<=100K` / `>100K`), `Gemini 3.6/3.7/3.8 Flash`, `Flash-Lite`, and `Gemini 3.1/2.5 Pro`, and added dated per-day pricing aggregation in `insights.mjs`.
- **Full-width footer strip corner-overlay & blocked-layout recovery fix ([#135](https://github.com/wycocoyu/agy-context-dashboard/pull/135))**:
  - Hit-test external corner controls against rendered `.bar` chip bounds instead of empty 100%-wide wrapper margins in `footer` mode, and temporarily clear `data-layout` while probing density tiers so `data-layout="blocked"` recovers cleanly.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.9.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.9.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
