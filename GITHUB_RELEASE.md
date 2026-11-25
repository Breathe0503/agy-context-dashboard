# AGY Context Dashboard v1.0.2

## v1.0.2 更新内容

- **新对话底栏展开修复（[#90](https://github.com/wycocoyu/agy-context-dashboard/pull/90)）**：在尚未发送消息的空对话中，配额数据加载完成后立即展开完整底栏状态条。
- **工程与社区协作完善（[#91](https://github.com/wycocoyu/agy-context-dashboard/pull/91)）**：新增发版版本同步预检脚本 `tools/prepare-release.py`、Release 新晋贡献者自动致谢、社区 PR 引导至 `dev` 的门禁与双语 `CONTRIBUTING.md` 贡献指南。

## 安装与升级

- **桌面端扩展包**：下载 `antigrative-dashboard-1.0.2.zip`，运行 `python3 manage.py install` 或 `python3 manage.py upgrade`（详情见 [README.md](README.md)）。
- **IDE 扩展包**：下载 `antigrative-dashboard-ide-1.0.2.vsix`，在 IDE 扩展视图选择「从 VSIX 安装」。

---

## What changed in v1.0.2

- **Empty-conversation strip expansion ([#90](https://github.com/wycocoyu/agy-context-dashboard/pull/90))**: Expand the full inline status strip in empty conversations once quota metrics are loaded.
- **Release & community workflow ([#91](https://github.com/wycocoyu/agy-context-dashboard/pull/91))**: Added `tools/prepare-release.py` (`npm run release:prep`), automatic `New Contributors` release notes, `dev`-first PR target guard, and bilingual `CONTRIBUTING.md` with Issue/PR templates.

## Install or update

- **Desktop App bundle**: Download `antigrative-dashboard-1.0.2.zip` and run `python3 manage.py install` or `python3 manage.py upgrade` (see [README.en.md](README.en.md)).
- **IDE extension**: Download `antigrative-dashboard-ide-1.0.2.vsix` and choose **Install from VSIX…** in the IDE Extensions view.
