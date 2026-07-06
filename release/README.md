# ChangeBattle V2 Release Workspace

这里是本地发版工作台，放 Windows desktop portable 包、更新清单、增量文件、官网页面和发版说明。

`release/` 目前是本地生成目录，默认不进 git。正式流程和长期文档仍以 `docs/windows-desktop-release.md` 为准；这里放一份常用流程，方便每次发版时直接看。

## 日常发版流程

发布通道分两套：

```text
release 分支 -> stable 正式通道 -> http://119.45.240.157/changebattle/
v2 分支      -> beta 测试通道   -> http://119.45.240.157/changebattle-beta/
```

推荐顺序：

1. 生成 Windows portable release，同时生成文件级增量清单。
2. 手动把 zip 上传到百度网盘、GitHub Release 或其它镜像。
3. 用镜像链接生成 `latest.json` 和游戏官网页面。
4. 发布 `latest.json`、官网页面、截图、`manifests/` 和 `files/` 到线上网站。

也就是：

```text
release zip + files.json -> 网盘/GitHub -> latest.json + index.html -> 线上网站
```

## 1. 生成 Release

在仓库根目录执行：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_on_windows.sh 0.1.2
```

产物会拉回到：

```text
release/ChangeBattle-V2-Desk-portable-v0.1.0.zip
release/changebattle/manifests/v0.1.0/files.json
release/changebattle/files/v0.1.0/
```

portable 包根目录会包含 `update-manifest.json`。Desk 启动后会用它和远端 `files.json` 对比，常规游戏代码/资源变化会自动下载增量文件、校验、替换，并提示重启后生效。

构建脚本会把对应通道的更新地址写进 `ChangeBattle-V2-Desk.cmd`：

```text
stable -> CHANGEBATTLE_UPDATE_MANIFEST_URLS=http://119.45.240.157/changebattle/latest.json
beta   -> CHANGEBATTLE_UPDATE_MANIFEST_URLS=http://119.45.240.157/changebattle-beta/latest.json
```

## 2. 上传下载镜像

把 zip 上传到：

- 百度网盘
- GitHub Release
- 其它备用镜像

拿到下载链接后，用 `名称=链接` 的格式写进环境变量。多个镜像用换行分隔。

示例：

```bash
export CHANGEBATTLE_RELEASE_MIRRORS=$'百度网盘=https://example.com/baidu\nGitHub Release=https://github.com/xxx/releases/download/v0.1.0/ChangeBattle-V2-Desk-portable-v0.1.0.zip'
```

## 3. 生成 latest.json 和官网页面

只本地生成、不发布：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta node tools/generate_desktop_update_manifest.mjs 0.1.2
```

生成文件：

```text
release/changebattle/latest.json
release/changebattle/index.html
release/changebattle/image/
release/changebattle/manifests/
release/changebattle/files/
```

说明：

- `latest.json` 给桌面端启动自检使用。
- `index.html` 是玩家打开的游戏官网。
- `image/` 是下载页轮播截图。
- `manifests/` 和 `files/` 是桌面端自动增量更新使用的直链资源。
- SHA-256 会从本地 zip 自动计算。
- 标题页按钮是“前往游戏官网”，不会触发手动检查更新。

可选更新说明：

```bash
export CHANGEBATTLE_RELEASE_NOTES=$'新增标题页手动检查更新\n下载页改为 HTTPS\n修复若干正式模式问题'
```

## 4. 更新线上网站

生成并发布：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/publish_desktop_update_manifest.sh 0.1.2
```

线上地址：

```text
stable: http://119.45.240.157/changebattle/
beta:   http://119.45.240.157/changebattle-beta/
```

发布脚本只上传小文件和截图，不上传 600 MiB 左右的 zip。
发布脚本会上传当前本地已有的 `manifests/` 和 `files/`，但不会删除线上旧版本目录。

## 一键打包并发布清单

如果镜像链接已经准备好，可以直接：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_and_publish_update.sh 0.1.2
```

这个命令会先生成 release zip，再发布 `latest.json` 和下载页。

正式发布通常在 `release` 分支执行：

```bash
git switch release
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_on_windows.sh 0.1.2
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh 0.1.2
```

## 下载页预览

本地预览文件：

```text
release/changebattle/preview-download-page.html
```

下载页模板和截图源：

```text
tools/release/download-page-template.html
tools/release/download-page-images/
```

生成脚本会从 `tools/release/download-page-template.html` 生成下载页，并把 `tools/release/download-page-images/` 同步到 `release/changebattle/image/`。

## 详细教程

完整 release 教程副本：

```text
release/docs/windows-desktop-release.md
```

仓库主文档：

```text
docs/windows-desktop-release.md
```
