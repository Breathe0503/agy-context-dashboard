# AGY Context Dashboard v1.0.0

## v1.0.0 更新内容

- **底栏指标自定义（[#60](https://github.com/wycocoyu/agy-context-dashboard/issues/60)）**：支持按需开启/隐藏 `Speed`、`Total`、`Quota`、`Context` 四项底栏指标，支持拖拽或点击 `↑`/`↓` 调整顺序，支持 Context 圆环在 `轮次`、`名称` 与 `精简` 间切换，并在面板底部提供防锁死自定义入口。
- **上下文轮次、步数抽屉与数字格式（[#53](https://github.com/wycocoyu/agy-context-dashboard/issues/53)、[#59](https://github.com/wycocoyu/agy-context-dashboard/pull/59)）**：新增 `{rounds} 轮 · {steps} 步` 中性白标胶囊与 5 分类步数展开抽屉，底栏 Context 补充 `· {n}轮`，并将小于 `10,000` 的 4 位整数改为无千位分隔显示。
- **Orchestrator/Swarm 拆分、Insights 与中文化（[#57](https://github.com/wycocoyu/agy-context-dashboard/issues/57)）**：拆分 Orchestrator Planner/Executor 统计，升级 Swarm 双行成员列表与 `Active`/`All` 筛选，打磨 Insights 4 张分布卡片，调整顶部页签顺序（`Session` / `Insights` / `Daily/Weekly` / `Models`），并完善中文提示与多语言说明。
- **用量趋势图优化（[#61](https://github.com/wycocoyu/agy-context-dashboard/issues/61)）**：优化 Day/Week/Month 柱状图 X 轴刻度、选中态对比度与图例顺序。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.0.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.0.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.0

- **Customizable inline status bar ([#60](https://github.com/wycocoyu/agy-context-dashboard/issues/60))**: Show or hide individual bottom chips (`Speed`, `Total`, `Quota`, `Context`), reorder them via drag-and-drop or `↑`/`↓` buttons, switch the Context ring between `rounds`, `label`, and `compact`, and access bar customization from the panel footer without lockout.
- **Context rounds, step breakdown drawer & number formatting ([#53](https://github.com/wycocoyu/agy-context-dashboard/issues/53), [#59](https://github.com/wycocoyu/agy-context-dashboard/pull/59))**: Added a neutral `{rounds} 轮 · {steps} 步` pill with an expandable 5-bucket step drawer, inline `· {n}轮` suffix, and ungrouped 4-digit integers under `10,000`.
- **Orchestrator/Swarm split, Insights & localization ([#57](https://github.com/wycocoyu/agy-context-dashboard/issues/57))**: Separated Orchestrator Planner/Executor tracking, added a two-line Swarm roster with `Active`/`All` filtering, polished the 4 Insights distribution cards, reordered top-level tabs (`Session`, `Insights`, `Daily/Weekly`, `Models`), and refined Chinese localization.
- **Usage chart polish ([#61](https://github.com/wycocoyu/agy-context-dashboard/issues/61))**: Improved Day/Week/Month bar chart x-axis ticks, active pill contrast, and legend ordering.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.0.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.0.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
