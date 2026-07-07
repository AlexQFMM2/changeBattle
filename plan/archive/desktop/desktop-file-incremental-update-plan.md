# Desktop 文件级增量更新 B 计划

## Summary

当前 Windows desktop portable 每次发布都需要玩家重新下载约 600 MiB 的完整包。B 计划采用“文件级增量更新”，不做 zip 二进制差分：发布端为每个 release 生成文件清单和变更文件包，客户端根据本地文件 hash 只下载变化文件。目标是在保留完整包兜底的同时，让常规小版本更新从数百 MiB 降到几十 MiB。

本计划分阶段推进：

- 阶段 1：发布端先具备文件清单、变更计算和游戏官网展示能力；Desk 启动时后台检查更新并记录状态，不执行下载替换。
- 阶段 2：Desk 启动时后台检查更新；发现可增量更新时打开更新下载页，自动下载增量数据包、校验、替换可管理文件，并提示玩家重启后生效。
- 阶段 3：再处理正式 `.exe` launcher，隐藏 `.cmd` 黑窗，作为体验优化，不阻塞增量更新。

## Goals

- 保留现有完整 portable zip 发布流程，任何时候都能回退全量下载。
- 增量更新以文件为单位，不对 zip 本身做二进制 patch。
- 第一版只增量更新普通游戏代码和资源：`apps/`、`assets/`、`vendor/`、`package.json`、`update-manifest.json`。
- 第一版不增量更新 Electron runtime、launcher exe、updater exe；这些变化要求下载完整包。
- 更新清单和版本判断继续由 `@changebattle-v2/core` 管纯规则。
- Electron 主进程负责网络请求、下载、校验、替换编排。
- Web 端不做更新 UI；标题页按钮只作为 desktop 环境下的“前往游戏官网”入口。更新下载页只在 Desktop 环境显示。
- 第一版只支持 Windows portable 目录结构。

## Non Goals

- 不做自动静默更新。
- 不在运行中替换 exe/dll。
- 不依赖百度网盘做程序内增量下载。
- 不做跨平台 updater。
- 不做复杂多版本二进制差分。
- 第一版不处理 `runtime/electron/`、`ChangeBattle-V2-Desk.exe`、`ChangeBattle-V2-Updater.exe` 的增量替换。

## 设计原则

- **完整包兜底**：增量失败时明确提示玩家去下载完整包。
- **先校验后替换**：所有下载文件必须通过 sha256 校验。
- **先下载到临时目录**：不直接覆盖当前可用文件。
- **尽量不动用户存档**：更新清单只覆盖程序目录，不触碰用户数据目录。
- **普通更新优先**：常规 JS、HTML、CSS、图片、音乐、Showdown vendor 数据走增量；运行时和启动器变化走完整包。
- **可观测**：每次检查、下载、校验、替换失败都要有清晰错误原因。
- **可中断**：下载中断后可以重新开始，不留下半替换状态。

## 目录结构建议

发布包解压后的最终结构建议逐步稳定为：

```text
ChangeBattle-V2-Desk/
  ChangeBattle-V2-Desk.exe
  ChangeBattle-V2-Desk.cmd
  ChangeBattle-V2-Debug.cmd
  apps/
  assets/
  resources/
  package.json
  update-manifest.json
```

其中：

- `ChangeBattle-V2-Desk.exe` 是正式玩家入口，必须是无控制台窗口的 launcher。
- `ChangeBattle-V2-Desk.cmd` 可保留为兼容入口，后续也可以改成只调用 exe。
- `ChangeBattle-V2-Debug.cmd` 用于排查缺文件、环境变量、Electron 启动失败等问题，允许显示黑窗和 pause。
- `update-manifest.json` 记录当前安装目录内受更新系统管理的文件。
- 用户存档、调试输出、日志等不进入该清单。
- 大资源文件如音乐、截图、Showdown 数据单独列入清单，只有变化时才下载。

## 第一版增量边界

第一版只覆盖普通游戏代码和资源，目标是解决最常见的小版本更新流量问题。

允许增量更新：

```text
apps/
assets/
vendor/
package.json
update-manifest.json
```

不允许增量更新：

```text
runtime/electron/
ChangeBattle-V2-Desk.exe
ChangeBattle-V2-Desk.cmd
ChangeBattle-V2-Debug.cmd
ChangeBattle-V2-Updater.exe
ChangeBattle-V2-Updater.cmd
```

处理规则：

- 如果远端版本只变更允许目录，桌面端可以提示和执行增量更新。
- 如果远端版本涉及不允许目录，桌面端必须提示“该版本需要下载完整包”。
- 发布脚本仍可为完整包计算所有文件 hash，但 `files.json` 第一版只发布允许增量管理的文件。
- `latest.json` 可增加 `requiresFullPackageReason` 或类似字段，用来解释为什么本次不能增量。
- Electron 版本升级、启动器升级、updater 升级统一走完整包，避免 Windows 文件锁和半升级风险。

## 阶段 3：Windows 启动入口体验优化

当前 release 使用 `ChangeBattle-V2-Desk.cmd` 启动，会短暂弹出控制台黑窗。这个问题不影响文件级增量更新主链路，因此放到阶段 3 处理。后续应新增小型 Windows launcher：

```text
ChangeBattle-V2-Desk.exe
```

要求：

- 双击启动时不显示控制台窗口。
- 使用 exe 所在目录作为 portable root。
- 设置与当前 `.cmd` 相同的环境变量：
  - `CHANGEBATTLE_PROJECT_ROOT`
  - `CHANGEBATTLE_DESKTOP_VERSION`
  - `CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT`
  - `CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT`
- 启动包内 Electron runtime：

```text
runtime/electron/electron.exe apps/desktop
```

- 启动失败时弹出系统消息框，说明缺失的关键文件或失败原因。
- 不写死安装路径，移动 portable 目录后仍可运行。
- `.cmd` debug 入口继续保留，方便用户反馈“打不开”时收集控制台输出。

实现方式建议：

- 第一版使用一个极小的 Rust / Go / C# WinExe launcher，编译为 Windows GUI subsystem，避免控制台窗口。
- release 打包脚本负责把 launcher exe 放到 portable 根目录。
- 完整包 smoke 需要断言 `ChangeBattle-V2-Desk.exe` 存在，并继续断言 debug cmd 存在。
- 增量更新系统不要在主进程运行时覆盖当前 launcher exe；如 exe 需要升级，第一版直接要求下载完整包。

## Manifest 设计

`latest.json` 继续作为入口清单，但增加增量更新信息：

```json
{
  "manifestVersion": 1,
  "channel": "stable",
  "version": "0.1.1",
  "officialSiteUrl": "https://example.com/changebattle/",
  "fullPackage": {
    "url": "https://example.com/releases/ChangeBattle-V2-Desk-portable-v0.1.1.zip",
    "sha256": "...",
    "size": 625000000
  },
  "fileManifestUrl": "https://example.com/changebattle/manifests/v0.1.1/files.json",
  "incrementalBaseUrl": "https://example.com/changebattle/files/v0.1.1/",
  "requiresFullPackage": false,
  "requiresFullPackageReason": ""
}
```

版本文件清单 `files.json`：

```json
{
  "manifestVersion": 1,
  "version": "0.1.1",
  "files": [
    {
      "path": "apps/desktop/out/main/main.js",
      "sha256": "...",
      "size": 428000,
      "url": "apps/desktop/out/main/main.js"
    },
    {
      "path": "assets/music/battle.mp3",
      "sha256": "...",
      "size": 6200000,
      "url": "assets/music/battle.mp3"
    }
  ]
}
```

说明：

- `path` 使用 `/` 分隔，相对 portable 根目录。
- 禁止 `..`、绝对路径、空路径。
- `url` 可以是相对 `incrementalBaseUrl` 的路径，也可以是完整 URL。
- 客户端必须校验 `path` 安全性，避免任意文件覆盖。

## 阶段 1：发布端清单 + 预计增量大小

### 目标

先把发布端和规则层打牢，让每次 release 都能产出：

- 完整包 zip
- `latest.json`
- `files.json`
- 可直接托管的文件镜像目录
- 游戏官网上的增量信息

Desk 启动后台检查时，可以记录：

```text
发现新版本 0.1.1
预计增量下载：38.2 MiB
完整包大小：596.8 MiB
```

但阶段 1 不执行程序内下载和替换，也不要求玩家在标题页点击“检查更新”。

### Core

新增或扩展 `desktopUpdateCatalog.ts`：

- `DesktopUpdateFileManifestV4`
- `DesktopUpdateManagedFileV4`
- `parseDesktopUpdateFileManifestV4(raw)`
- `validateDesktopUpdateManagedPathV4(path)`
- `compareDesktopUpdateFileManifestsV4(local, remote)`
- `estimateDesktopIncrementalDownloadSizeV4(local, remote)`

规则只做纯计算：

- 版本比较
- manifest 解析
- 文件路径合法性
- 根据 sha256 计算变化文件
- 统计预计下载大小

### Release Scripts

新增脚本：

```text
tools/generate_desktop_file_manifest.mjs
```

职责：

- 扫描 portable 解压目录或 release staging 目录。
- 排除用户数据、日志、debug、临时文件。
- 只收集第一版允许增量更新的目录和文件。
- 如果发现 runtime/launcher/updater 等不允许目录相对上一版本发生变化，生成完整包要求标记。
- 计算每个文件的 sha256 和 size。
- 输出 `release/changebattle/manifests/vX.Y.Z/files.json`。
- 同步受管理文件到 `release/changebattle/files/vX.Y.Z/`。

扩展现有脚本：

- `generate_desktop_update_manifest.mjs` 写入 `fileManifestUrl` 和 `incrementalBaseUrl`。
- `publish_desktop_update_manifest.sh` 上传 `manifests/` 和 `files/`。
- 游戏官网展示完整包大小、预计增量能力说明。

### Desktop

Desk 启动后台检查流程：

- 启动后延迟短时间拉取 `latest.json`，避免阻塞首屏。
- 如果 `latest.json` 标记该版本需要完整包，记录状态；必要时打开更新下载页并提示前往游戏官网查看完整包下载。
- 如果包含 `fileManifestUrl`，尝试拉取远端 `files.json`。
- 读取本地 `update-manifest.json`。
- 计算预计增量大小。
- 阶段 1 只记录状态，不自动下载。
- 标题页按钮不再做“检查更新”，只打开游戏官网。

阶段 1 不下载增量文件。

### Test Plan

- Core：
  - 路径校验拒绝 `../x`、绝对路径、空路径。
  - manifest 缺字段时报错。
  - local/remote sha256 相同不计入下载。
  - sha256 变化时计入下载大小。
- Scripts：
  - 生成的 `files.json` 包含 `apps/desktop/out/main/main.js`、renderer 产物和资源文件。
  - 生成目录不包含 debug、logs、user data。
  - 生成目录不包含 `runtime/electron/` 和 launcher/updater 文件。
  - runtime/launcher/updater 变化时标记该版本需要完整包。
  - `latest.json` 包含 `fileManifestUrl` 和 `incrementalBaseUrl`。
- Desktop：
  - 没有本地 manifest 时回退完整包提示。
  - 有本地 manifest 时能展示预计增量大小。
  - latest 标记需要完整包时不尝试增量。
  - 远端 files manifest 拉取失败时仍能打开游戏官网。
  - 标题页按钮只打开游戏官网，不触发检查更新。

## 阶段 2：程序内下载 + 替换 + 提示重启

### 目标

实现真正的文件级增量更新：

1. Desk 启动后后台检查更新。
2. 对比本地/远端 manifest。
3. 发现可增量更新时打开更新下载页。
4. 自动下载变化文件到临时目录。
5. 校验 sha256。
6. 替换第一版增量边界内的可管理文件。
7. 写入新的本地 `update-manifest.json`。
8. 提示玩家“更新已完成，重启后生效”。

### 更新方式

第一版不做外部 updater，也不替换运行中的 exe/runtime。Desk 只处理普通游戏代码和资源：

```text
apps/
assets/
vendor/
package.json
update-manifest.json
```

原因：

- 这些文件不属于 launcher/runtime，替换风险低。
- 替换后当前进程可能仍在使用旧 JS/资源，因此只提示重启，不自动重启。
- 如果本次版本涉及 `runtime/electron/`、launcher 或 updater，直接走完整包。

替换流程：

- 下载变化文件到 `.update-staging/`。
- 每个文件校验 sha256。
- 替换前把旧文件备份到 `.update-backup/`。
- 替换允许目录内的文件。
- 写入新的 `update-manifest.json`。
- 清理 staging。
- 弹窗提示玩家关闭并重新打开游戏。
- 若替换失败，尝试从 backup 回滚；回滚失败时提示下载完整包修复。

### Desktop 主进程

新增 IPC：

- `desktopApp:openOfficialSite`
- `desktopApp:getUpdateStatus`

后台更新职责：

- 启动后自动检查。
- 有可增量更新时打开更新下载页并自动下载。
- 支持下载进度。
- 支持取消。
- 每个文件单独校验 sha256。
- 失败时保留错误原因，不进入应用阶段。

### UI

标题页按钮：

```text
前往游戏官网
```

行为：

- 只打开 `officialSiteUrl`。
- 不触发检查更新，不触发下载。

更新下载页：

```text
发现新版本 0.1.1
正在下载增量更新包...
增量下载约 38.2 MiB，完整包约 596.8 MiB。
```

状态：

- `检查更新中`
- `发现新版本`
- `下载中`
- `校验中`
- `替换中`
- `更新完成，重启后生效`
- `更新失败，本次继续使用当前版本`

下载中按钮：

- `后台下载`
- `取消`
- `前往游戏官网`

完整包版本或增量不可用时：

```text
发现新版本 0.1.1
该版本需要下载完整包。
```

按钮：

- `前往游戏官网`
- `稍后`

下载完成后：

```text
更新已完成，重启游戏后生效。
```

按钮：

- `我知道了`
- `前往游戏官网`

后台增量更新失败时：

```text
更新下载失败，本次继续使用当前版本。
```

按钮：

- `我知道了`
- `前往游戏官网`

### 安全与回滚

- 只允许替换 manifest 管理的相对路径。
- 替换前备份原文件。
- 如果替换失败，尝试恢复备份。
- 如果恢复失败，提示完整包修复。
- 永远不删除用户存档目录。
- update staging 目录启动时可以清理过期残留。

### Test Plan

- 下载一个变化文件并校验成功。
- sha256 错误时拒绝应用。
- 网络中断时不替换文件。
- 替换成功后本地 manifest 更新。
- 替换失败时尝试回滚。
- 缺少本地 manifest 时回退完整包下载。
- 正在运行的 exe/dll 不被主进程直接覆盖。
- 标题页“前往游戏官网”不触发更新检查。

## 资源托管策略

增量更新需要直链托管，百度网盘不适合程序内下载。

推荐顺序：

1. 腾讯云 COS 或服务器静态目录：直链稳定，可控。
2. GitHub Release Assets：适合完整包和少量文件，国内速度不稳定。
3. Cloudflare R2/Pages：便宜好用，但国内访问稳定性要实测。
4. 百度网盘：只作为完整包人工下载镜像。

备案通过前：

- 完整包继续放百度网盘/GitHub。
- 增量文件可以先只生成，不对外启用。
- `latest.json` 可以保留 `fileManifestUrl` 字段，但桌面端阶段 1 只提示、不下载。

## Open Questions

- Portable 包最终稳定目录结构是否需要调整。
- 哪些目录应被 update manifest 管理。
- 是否允许删除远端 manifest 中已经不存在的旧文件。
- 是否需要支持从任意旧版本增量到最新，还是只支持最近 N 个版本。
- 增量文件托管最终选服务器、COS、GitHub Release 还是组合。

## Suggested Milestones

### Milestone 1

- Core 增加 file manifest 类型和纯规则。
- Release 脚本生成 `files.json`。
- 游戏官网显示完整包和增量能力说明。

### Milestone 2

- Desk 启动时后台读取本地/远端 manifest。
- 发现更新时打开更新下载页并显示预计增量大小。
- 无本地 manifest 时优雅回退。

### Milestone 3

- 下载增量文件到 staging。
- 校验 sha256。
- 替换第一版增量边界内的文件。
- 展示“更新已完成，重启后生效”。

### Milestone 4

- 增加备份和回滚。
- 下载/替换进度 UI。
- 失败时提示完整包修复。
