# AGY Context Dashboard v1.0.3

## v1.0.3 更新内容

- **修复 758px 主输入框偶发收缩为纯图标（[#97](https://github.com/wycocoyu/agy-context-dashboard/issues/97)，[#98](https://github.com/wycocoyu/agy-context-dashboard/pull/98)）**：在 `compact-text` 与 `icons-only` 之间新增 `tight-text` 渐进缓冲档，遇到 `Orchestrator` 长模型名或运行中出现停止按钮时优先隐藏次要配额窗口与 `tok/s` 后缀，保留速度数值、Token 总量、缓存命中率、主配额与上下文百分比；同时修复密度切换时位移芯片误触发 hover 劫持已打开浮层的问题。
- **缓存命中率 4 档配色与运行时热重注入（[#88](https://github.com/wycocoyu/agy-context-dashboard/issues/88)，[#93](https://github.com/wycocoyu/agy-context-dashboard/pull/93)）**：统一缓存命中率配色选择器，新增可选的 4 档命中率阶梯着色与渲染层热重注入支持。
- **文档精简与排版修复（[#94](https://github.com/wycocoyu/agy-context-dashboard/pull/94)，[#95](https://github.com/wycocoyu/agy-context-dashboard/pull/95)）**：精简 README 冗余段落并修复加粗语法分隔符问题。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.3.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.3.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.3

- **Prevent abrupt `icons-only` collapse in 758px composer ([#97](https://github.com/wycocoyu/agy-context-dashboard/issues/97), [#98](https://github.com/wycocoyu/agy-context-dashboard/pull/98))**: Added a `tight-text` intermediate density tier between `compact-text` and `icons-only` that trims secondary quota window text and `tok/s` unit suffixes while keeping speed numbers, token totals, cache hit rate, primary quota window, and context percentage visible with long model names or the running stop button, plus a 300ms hover-hijack guard during density transitions.
- **4-tier cache hit-rate colors & runtime hot-reinject ([#88](https://github.com/wycocoyu/agy-context-dashboard/issues/88), [#93](https://github.com/wycocoyu/agy-context-dashboard/pull/93))**: Unified the cache hit-rate color picker, added optional 4-tier hit-rate colors, and added runtime hot-reinject for updated renderer assets.
- **README cleanup ([#94](https://github.com/wycocoyu/agy-context-dashboard/pull/94), [#95](https://github.com/wycocoyu/agy-context-dashboard/pull/95))**: Trimmed verbose README sections and fixed bold delimiter rendering.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.3.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.3.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
