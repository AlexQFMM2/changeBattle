# ChangeBattle V2 Windows Desktop Release

本文档记录 ChangeBattle V2 Windows Desktop 便携包的发布流程。范围只包含 V2 Desk portable zip，不包含 Web、Android、安装器或签名发布。桌面端支持读取远端 `latest.json`：常规游戏代码变化会自动下载增量文件、校验、替换，并提示玩家重启后生效；运行时和启动器变化仍要求下载完整包。

当前流程已废弃“随包本地 BattleService / Showdown vendor”路线：Desk/Web/Android 统一调用公网 Battle API `https://api.65h26i.top/changebattle/battle`，公共图片、音频和 Showdown sprites/fx 统一走 COS/CDN。Windows portable 包不再包含 `vendor/pokemon-showdown` 或 `vendor/showdown-client`。

当前已验证 release 基线：

```text
0.1.1  增量更新初始化版本，旧正式包默认追 stable。
0.1.2  已验证 0.1.1 -> 0.1.2 自动增量更新。
0.1.3  已验证 0.1.2 -> 0.1.3 自动增量更新；当前 stable latest。
source: v2@1c8bd4e6
generated: 2026-07-06 Asia/Shanghai
size: 约 598 MiB
stable latest: http://119.45.240.157/changebattle/latest.json
stable site:   http://119.45.240.157/changebattle/
beta latest:   http://119.45.240.157/changebattle-beta/latest.json
beta site:     http://119.45.240.157/changebattle-beta/
```

## Release Artifact

发布产物命名：

```text
ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
```

玩家解压后运行：

```text
ChangeBattle-V2-Desk.cmd
```

玩家机器不需要安装 Node.js、pnpm、Python 或源码依赖。便携包内会包含 Electron runtime、desktop build output、启动器资源和必要代码；公共 assets 走 CDN，战斗服务走公网 Battle API。

## Launcher Shape

当前 portable 包用 `ChangeBattle-V2-Desk.cmd` 作为启动入口。它只负责：

- 使用 `%~dp0` 定位 portable root。
- 设置 `CHANGEBATTLE_PROJECT_ROOT`、更新通道和 portable root。
- 调用包内 `runtime\electron\electron.exe` 启动 `apps\desktop`。

这不代表 Electron 不能做 `.exe`。VSCode 也是 Electron，但它使用完整应用 launcher/安装器/签名链路，所以用户看到的是 `Code.exe`。V2 当前保留 `.cmd` 是为了方便 fallback/debug；正式入口优先使用小型 `ChangeBattle V2.exe` launcher。安装器、签名、安装器级自动更新仍不属于本文档当前 release 范围。

## Windows Build Host

Windows 构建机：

```text
win10@172.16.10.41
```

V2 使用独立目录，避免污染 V1 release 环境：

```text
D:\changeBattleV2\changeBattleV2       从 git archive 解出的 V2 source tree
D:\changeBattleV2\release              上传的源码包、资源包、最终 portable zip
D:\changeBattleV2\electron-runtime     Windows Electron runtime
```

Electron runtime 可以复用 V1 已准备好的 runtime：

```powershell
Copy-Item -Recurse -Force D:\changeBattle\electron-runtime\electron D:\changeBattleV2\electron-runtime\electron
```

release 脚本不会临时下载 Electron。如果缺少：

```text
D:\changeBattleV2\electron-runtime\electron\electron.exe
```

Windows 构建会直接失败。

## Branch / Channel

长期分支和更新通道：

```text
release 分支 -> stable 正式通道 -> http://119.45.240.157/changebattle/
v2 分支      -> beta 测试通道   -> http://119.45.240.157/changebattle-beta/
hotfix/*    -> 从 release 临时切出，通常先 beta 验证，再回 release 发 stable
update 分支  -> 更新系统/发布流程专项分支，验证后合回 v2
```

构建时通过 `CHANGEBATTLE_RELEASE_CHANNEL=stable|beta` 选择通道。portable 包的 `ChangeBattle-V2-Desk.cmd` 会写入对应 `CHANGEBATTLE_UPDATE_MANIFEST_URLS`，所以 stable 包不会吃 beta 更新，beta 包也不会影响正式玩家。

不要维护长期 `debug` 分支。正式版修复测试用 `hotfix/*` 临时分支，并用 beta 通道发测试包。

## One-Command Release

Linux 侧从仓库根目录执行：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_on_windows.sh 0.1.4
```

这个脚本会完成：

1. 使用 `git archive HEAD` 生成源码包。
2. 上传到 Windows 构建机。
3. 重建 `D:\changeBattleV2\changeBattleV2` source tree。
4. 运行 Windows release checks。
5. 构建 desktop。
6. 生成 portable zip。
7. 生成 `update-manifest.json`、`files.json` 和增量文件目录。

公共 assets 已走 COS/CDN，BattleService 已走公网 API，这个脚本不再打包 assets、Showdown vendor 或本地 BattleService 文件。
10. 把 zip 拉回 Linux 本地：

```text
changeBattleV2/release/ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
changeBattleV2/release/changebattle/manifests/vX.Y.Z/files.json
changeBattleV2/release/changebattle/files/vX.Y.Z/
```

Windows 侧最终产物：

```text
D:\changeBattleV2\release\ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
```

未跟踪目录例如 `debug/`、`release/` 不会进入源码包，也不要提交。

如果要在生成 portable zip 后同步更新提示清单，使用：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_and_publish_update.sh 0.1.4
```

这个命令会先执行普通 release，然后生成并发布：

```text
release/changebattle/latest.json
release/changebattle/index.html
release/changebattle/manifests/vX.Y.Z/files.json
release/changebattle/files/vX.Y.Z/
```

到更新服务器：

```text
stable: http://119.45.240.157/changebattle/latest.json
beta:   http://119.45.240.157/changebattle-beta/latest.json
```

发布脚本只上传 `latest.json`、游戏官网页面、截图、`manifests/` 和 `files/`，不上传约 600 MiB 的 portable zip。真实完整包下载链接应放到 `officialSiteUrl`、`fullPackage` 或 `mirrors`，例如网盘、GitHub Release 或其它下载页。

服务器目录：

```text
/home/ubuntu/webApp/changebattle/       stable
/home/ubuntu/webApp/changebattle-beta/  beta
  latest.json
  index.html
  image/
  manifests/vX.Y.Z/files.json
  files/vX.Y.Z/...
```

常用环境变量：

```bash
CHANGEBATTLE_RELEASE_CHANNEL="beta"
CHANGEBATTLE_OFFICIAL_SITE_URL="http://119.45.240.157/changebattle-beta/"
CHANGEBATTLE_RELEASE_MIRRORS="123网盘=https://example.com/pan-link"
CHANGEBATTLE_RELEASE_NOTES=$'修复战斗流程问题\n调整正式模式平衡'
CHANGEBATTLE_FULL_PACKAGE_URL="https://github.com/xxx/releases/download/v0.1.4/ChangeBattle-V2-Desk-portable-v0.1.4.zip"
CHANGEBATTLE_UPDATE_HOST="ubuntu@119.45.240.157"
CHANGEBATTLE_UPDATE_WEB_ROOT="/home/ubuntu/webApp/changebattle-beta"
```

正式发布通常在 `release` 分支执行：

```bash
git switch release
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_on_windows.sh 0.1.4
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh 0.1.4
```

如果本次包含 Electron runtime、launcher、updater 等不能增量替换的变化，生成清单时加：

```bash
node tools/generate_desktop_update_manifest.mjs 0.1.4 --requires-full-package --requires-full-package-reason "本版本包含启动器或运行时更新"
```

如果只想重新生成/发布更新清单，不重新打包：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/publish_desktop_update_manifest.sh 0.1.4
```

如果只想本地生成清单并检查内容：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=beta node tools/generate_desktop_update_manifest.mjs 0.1.4
```

如果只想更新完整包下载链接，不想重传 `files/`，先用 `CHANGEBATTLE_RELEASE_MIRRORS` 重新生成 `latest.json/index.html`，然后只覆盖服务器两个入口文件：

```bash
scp release/changebattle/latest.json release/changebattle/index.html ubuntu@119.45.240.157:/tmp/changebattle-update-manifest/
ssh ubuntu@119.45.240.157 "sudo install -m 0644 /tmp/changebattle-update-manifest/latest.json /home/ubuntu/webApp/changebattle/latest.json && sudo install -m 0644 /tmp/changebattle-update-manifest/index.html /home/ubuntu/webApp/changebattle/index.html"
```

## Manual Windows Build

如果只想手动在 Windows 侧构建，先从 Linux 同步源码：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
./tools/send_release_source_to_windows.sh 0.1.4
```

然后在 Windows 构建机运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattleV2\build-desk-release.ps1 -Version 0.1.4 -Channel beta
```

## Windows Release Checks

Windows release 脚本会执行：

```text
pnpm install
pnpm --filter @changebattle-v2/core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/api test:formal-game
pnpm typecheck
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
pnpm --filter @changebattle-v2/desktop test:renderer-assets
pnpm --filter @changebattle-v2/desktop test:formal-worker
python tools\package_desktop_release.py
```

其中 desktop 专用检查含义如下：

- `test:ipc-bundle`
  - 确认 `main.js` 包含 `formalGame:createWithStarterCandidates` IPC handler。
  - 确认 `main.js` 包含桌面端更新检查和原生更新提示。
  - 确认 `preload.cjs` 暴露 `createFormalGameWithStarterCandidates` bridge。
  - 确认 `formalComputeWorker.js` 包含 `createFormalGameWithStarterCandidates` worker method。
  - 禁止 desktop main/preload/worker bundle 中残留 `@changebattle-v2/...` runtime import。
  - 禁止 worker bundle 中残留 `react` import，避免 portable 包运行时找不到 `react`。
  - 禁止 `file:///D:/` 这类硬编码绝对路径。
- `test:renderer-assets`
  - 扫描 renderer HTML/JS/CSS，禁止 `/showdown/...`、`/npc/...` 等根路径资源引用。
  - 禁止 `file:///D:/...` 资源引用。
- `test:formal-worker`
  - 直接启动 build 后的 `formalComputeWorker.js`。
  - 调用 `createFormalGameWithStarterCandidates`。
  - 确认正式开局候选生成成功。
  - 确认返回的 sprite URL 不是根路径、Windows 绝对路径或 `file:` URL。

这些检查用于防止“本地 dev 正常、portable 运行缺依赖或资源路径失效”的问题回归。

## Portable Package Layout

portable zip 内部结构：

```text
ChangeBattle-V2-Desk-portable-vX.Y.Z/
  ChangeBattle-V2-Desk.cmd
  RELEASE-README.md
  update-manifest.json
  apps/
    desktop/
      package.json
      out/
        main/
          main.js
          formalComputeWorker.js
        preload/
          preload.cjs
        renderer/
          index.html
          ...
  runtime/
    electron/
      electron.exe
      ...
  resources/
    app-icon.ico
    app-icon.png
```

`ChangeBattle-V2-Desk.cmd` 使用 `%~dp0` 计算 portable root，不允许写死 `D:\...` 目录：

```text
APP_ROOT=<cmd 所在目录>
ELECTRON_EXE=<APP_ROOT>\runtime\electron\electron.exe
DESKTOP_APP=<APP_ROOT>\apps\desktop
```

启动前会设置：

```text
CHANGEBATTLE_PROJECT_ROOT=<APP_ROOT>
CHANGEBATTLE_PORTABLE_ROOT=<APP_ROOT>
CHANGEBATTLE_PORTABLE_UPDATE_ENABLED=1
CHANGEBATTLE_RELEASE_CHANNEL=<stable|beta>
CHANGEBATTLE_UPDATE_MANIFEST_URLS=<channel latest.json>
```

`CHANGEBATTLE_PORTABLE_UPDATE_ENABLED=1` 只在 portable 包里设置。dev 环境即使拉到远端更新，也不会替换仓库文件。stable 包追正式 `latest.json`，beta 包追测试 `latest.json`。

## Incremental Update Layout

发布端会同步以下目录到服务器：

```text
/home/ubuntu/webApp/changebattle/       stable
/home/ubuntu/webApp/changebattle-beta/  beta
  latest.json
  index.html
  manifests/vX.Y.Z/files.json
  files/vX.Y.Z/...
```

第一版允许增量管理：

```text
apps/
resources/
package.json
```

第一版禁止增量管理：

```text
runtime/electron/
ChangeBattle-V2-Desk.exe
ChangeBattle-V2-Desk.cmd
ChangeBattle-V2-Debug.cmd
ChangeBattle-V2-Updater.exe
ChangeBattle-V2-Updater.cmd
```

Desk 更新流程：

1. 启动后后台读取 `latest.json`。
2. 读取本地 `update-manifest.json` 和远端 `files.json`。
3. 根据 sha256 计算变化文件和增量大小。
4. 下载到 `.update-staging/`。
5. 校验 sha256。
6. 替换前备份到 `.update-backup/`。
7. 替换成功后写入新的 `update-manifest.json`。
8. 提示玩家重启游戏后生效。

如果缺少本地基线、远端标记 `requiresFullPackage`、校验失败或替换失败，桌面端会提示去游戏官网下载完整包。

## Resource Path Rules

V2 Desk portable 必须支持移动解压目录后继续运行，因此资源路径规则是：

- renderer 资源使用相对路径，例如 `./showdown/...`、`./npc/...`。
- 不允许 renderer bundle 中出现 `/showdown/...`、`/npc/...` 这类根路径资源。
- 不允许出现 `file:///D:/...`。
- 不允许业务数据里写死 Windows 盘符。
- CSS 里的资源也要走相对路径或构建后的 portable 资源路径。

如果新增资源引用，优先使用 web 侧的 `assetUrl()` / `showdownAssetPrefix()` 等统一 helper。

## Showdown Vendor（已废弃）

旧 portable 包曾经随包发布 `vendor/pokemon-showdown` 和 `vendor/showdown-client`，由 Electron main process 内置 in-memory BattleService。这个路径已经废弃。

当前 release 路线：

- Desk/Web/Android 统一调用公网 Battle API：`https://api.65h26i.top/changebattle/battle`。
- Pokemon Showdown runtime 只需要存在于服务器 Battle API 容器内。
- Desktop portable 不再复制、校验或管理 `vendor/pokemon-showdown`、`vendor/showdown-client`。
- 本地 in-memory BattleService 只允许作为开发调试 fallback，通过显式环境变量开启，不进入正式 release 依赖链。

## Workspace Package Bundling

`@changebattle-v2/api`、`@changebattle-v2/core`、`@changebattle-v2/showdown-battle-core`、`@changebattle-v2/showdown-dex-core` 是 workspace package。desktop build 配置会把它们打进 main/preload/worker bundle，不依赖 portable 包里的 `node_modules`。

需要特别注意：Node worker 不应该通过 API 主入口间接带入 React。

曾经出现的问题：

```text
Error invoking remote method 'formalGame:createWithStarterCandidates':
Cannot find package 'react' imported from ...\formalComputeWorker.js
```

根因是 `apps/api/src/index.ts` 导出了 `useDexHook`，而 `useDexHook` 引入了 React。worker 从 API 主入口 import 时，bundle 顶部残留了：

```js
import "react";
```

portable 包没有 `node_modules/react`，所以正式游戏创建失败。修复原则：

- API 主入口保持 runtime-safe，不导出 React hook。
- React hook 使用专用入口文件，不进入 desktop worker 依赖链。
- `test:ipc-bundle` 必须禁止 `react` 出现在 desktop main/preload/worker bundle 中。

## Desktop Battle Runtime

portable release 不再依赖本地 HTTP 服务，也不再默认使用 Electron main process 内置的 `createInMemoryBattleService()`。桌面端启动后应通过 `desktopApp:getBattleServiceConfig` 获取 Battle API 配置，默认返回：

```text
https://api.65h26i.top/changebattle/battle
```

`window.changeBattleV2.battleService` 只保留为显式开发 fallback。只有设置 `CHANGEBATTLE_DESKTOP_ALLOW_LOCAL_BATTLE_SERVICE=1` 且未配置服务器 URL 时，renderer 才允许把本地 IPC bridge 注入 `createChangeBattleV2Api({battleServiceClient})`。

如果点击“结束休整”后 Console 出现：

```text
ERR_CONNECTION_REFUSED http://127.0.0.1:5191
```

说明 portable 包仍在走旧本地服务路径。检查 `desktopApp:getBattleServiceConfig` 是否返回公网 Battle API，并确认没有设置 `CHANGEBATTLE_DESKTOP_ALLOW_LOCAL_BATTLE_SERVICE=1`。

## Local Pre-Release Checklist

发布前建议在 Linux 本地先跑：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
pnpm --filter @changebattle-v2/desktop test:renderer-assets
pnpm --filter @changebattle-v2/desktop test:asset-resolver
pnpm --filter @changebattle-v2/desktop test:formal-worker
pnpm --filter @changebattle-v2/showdown-battle-core test
pnpm --filter @changebattle-v2/api test:formal-game
pnpm typecheck
git diff --check
git status --short
```

如果这些通过，再提交代码并跑 Windows release。

## Manual Verification

拿到 zip 后，在 Windows 上手测：

1. 解压到任意目录，不要求固定在 `D:\changeBattleV2`。
2. 双击 `ChangeBattle-V2-Desk.cmd`。
3. 标题页图片、按钮、背景正常显示。
4. 创建正式游戏能生成开局候选。
5. 进入休息室/休整页，公告栏、队伍、商店、训练场、治疗和交换入口显示正常。
6. 进入战斗，Pokemon sprite、背景、技能动画资源正常显示。
7. 存档写入 Electron userData，不写入 portable 解压目录。

若正式流程报错，打开 Electron 菜单：

```text
View -> Toggle Developer Tools
```

查看 Console 中：

```text
[changebattle-v2:web] formal game preparation failed
[changebattle-v2:desktop] formal compute worker failed
```

这两类日志会打印 worker 返回的真实错误栈。

## Common Troubleshooting

### 图片或 sprite 不显示

优先检查 renderer bundle 是否出现根路径或绝对路径：

```bash
pnpm --filter @changebattle-v2/desktop test:renderer-assets
```

### 正式游戏创建失败

优先检查 worker 是否能独立运行：

```bash
pnpm --filter @changebattle-v2/desktop test:formal-worker
```

如果报 `Cannot find package 'react'`，说明 React 又漏进 worker bundle。检查：

```bash
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
```

### 结束休整后创建战斗失败

如果 Console 里有：

```text
ERR_CONNECTION_REFUSED http://127.0.0.1:5191
```

说明 portable 包还在请求 dev battle service。检查：

```bash
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
pnpm --filter @changebattle-v2/showdown-battle-core test
```

并确认 `desktopApp:getBattleServiceConfig` 返回公网 Battle API。打包版不应该请求 `127.0.0.1:5191`，除非显式设置了开发 fallback 环境变量。

### Battle API 访问失败

确认公网接口可用：

```bash
curl -sS https://api.65h26i.top/changebattle/battle/health
```

如果 health 正常但桌面创建战斗失败，优先看服务器容器日志里的 `session-created` / `choice-submitted` / `battle-ai-choice` JSON 行。

### 运行的不是新版包

因为 release 过程中 Windows 侧和 Linux 侧都有 zip，容易拿错。以这两个位置为准：

```text
D:\changeBattleV2\release\ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
changeBattleV2/release/ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
```

解压后可查看 `RELEASE-README.md` 中的 commit 信息确认版本。
