# ChangeBattle V2 Windows Desktop Release

本文档记录 ChangeBattle V2 Windows Desktop 便携包的发布流程。范围只包含 V2 Desk portable zip，不包含 Web、Android、安装器、签名发布或自动覆盖安装。桌面端支持启动时检查远端 `latest.json` 并提示玩家打开下载页，但不会在本机自动下载/替换程序。

当前已验证 release：

```text
ChangeBattle-V2-Desk-portable-v0.1.0.zip
source: v2@2b600e22
generated: 2026-07-05 00:23 Asia/Shanghai
size: 597 MiB
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

玩家机器不需要安装 Node.js、pnpm、Python 或源码依赖。便携包内会包含 Electron runtime、desktop build output、前端静态资源、Pokemon Showdown runtime vendor 和 Showdown client playback vendor。

## Launcher Shape

当前 portable 包用 `ChangeBattle-V2-Desk.cmd` 作为启动入口。它只负责：

- 使用 `%~dp0` 定位 portable root。
- 设置 `CHANGEBATTLE_PROJECT_ROOT`、`CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT`、`CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT`。
- 调用包内 `runtime\electron\electron.exe` 启动 `apps\desktop`。

这不代表 Electron 不能做 `.exe`。VSCode 也是 Electron，但它使用完整应用 launcher/安装器/签名链路，所以用户看到的是 `Code.exe`。V2 当前选择 `.cmd` 是为了先稳定 portable 目录结构、vendor 路径和离线运行。后续如果只想隐藏 `.cmd`，优先做小型 `ChangeBattle-V2-Desk.exe` launcher 复用同一套目录结构；安装器、签名、自动更新仍不属于本文档当前 release 范围。

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

## One-Command Release

Linux 侧从仓库根目录执行：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
./tools/build_release_on_windows.sh 0.1.0
```

这个脚本会完成：

1. 使用 `git archive HEAD` 生成源码包。
2. 打包本地 `assets/`，因为资源目录不进入 git archive。
3. 打包 Showdown runtime 的本地 `node_modules/ts-chacha20`。
4. 上传到 Windows 构建机。
5. 重建 `D:\changeBattleV2\changeBattleV2` source tree。
6. 运行 Windows release checks。
7. 构建 desktop。
8. 生成 portable zip。
9. 把 zip 拉回 Linux 本地：

```text
changeBattleV2/release/ChangeBattle-V2-Desk-portable-v0.1.0.zip
```

Windows 侧最终产物：

```text
D:\changeBattleV2\release\ChangeBattle-V2-Desk-portable-v0.1.0.zip
```

2026-07-04 重新验证的包同时已拉回 Linux：

```text
/home/alexqfmm/workPlace/pokemon/changeBattleV2/release/ChangeBattle-V2-Desk-portable-v0.1.0.zip
```

本次 release 在首次构建时暴露了 desktop player vault split table 缺少 `itemStoragePageCount/pokemonStoragePageCount` 的类型问题；已在 `f8ec6aac` 修复，并通过 Windows release checks、desktop build、IPC bundle、renderer assets 和 formal worker smoke。

未跟踪目录例如 `debug/`、`release/` 不会进入源码包，也不要提交。

如果要在生成 portable zip 后同步更新提示清单，使用：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
./tools/build_release_and_publish_update.sh 0.1.0
```

这个命令会先执行普通 release，然后生成并发布：

```text
release/changebattle/latest.json
release/changebattle/index.html
```

到更新服务器：

```text
https://65h26i.top/changebattle/latest.json
https://65h26i.top/changebattle/
```

发布脚本只上传 `latest.json` 和下载页，不上传约 600 MiB 的 portable zip。真实下载链接应放到 `downloadPageUrl` 或 `mirrors`，例如网盘、GitHub Release 或其它下载页。

常用环境变量：

```bash
CHANGEBATTLE_DOWNLOAD_PAGE_URL="https://65h26i.top/changebattle/"
CHANGEBATTLE_RELEASE_MIRRORS="123网盘=https://example.com/pan-link"
CHANGEBATTLE_RELEASE_NOTES=$'修复战斗流程问题\n调整正式模式平衡'
CHANGEBATTLE_UPDATE_HOST="ubuntu@119.45.240.157"
CHANGEBATTLE_UPDATE_WEB_ROOT="/home/ubuntu/webApp/changebattle"
```

如果只想重新生成/发布更新清单，不重新打包：

```bash
./tools/publish_desktop_update_manifest.sh 0.1.0
```

如果只想本地生成清单并检查内容：

```bash
node tools/generate_desktop_update_manifest.mjs 0.1.0
```

## Manual Windows Build

如果只想手动在 Windows 侧构建，先从 Linux 同步源码：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
./tools/send_release_source_to_windows.sh 0.1.0
```

然后在 Windows 构建机运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattleV2\build-desk-release.ps1 -Version 0.1.0
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
          assets/
          aboutIcon/
          board/
          npc/
          showdown/
          runtime/
          ...
  runtime/
    electron/
      electron.exe
      ...
  vendor/
    pokemon-showdown/
      sim/
      data/
      lib/
      config/
      node_modules/
        ts-chacha20/
    showdown-client/
      js/
        battle.js
        battle-scene-stub.js
        ...
```

`ChangeBattle-V2-Desk.cmd` 使用 `%~dp0` 计算 portable root，不允许写死 `D:\...` 目录：

```text
APP_ROOT=<cmd 所在目录>
ELECTRON_EXE=<APP_ROOT>\runtime\electron\electron.exe
DESKTOP_APP=<APP_ROOT>\apps\desktop
SHOWDOWN_VENDOR=<APP_ROOT>\vendor\pokemon-showdown
SHOWDOWN_CLIENT_VENDOR=<APP_ROOT>\vendor\showdown-client\js
```

启动前会设置：

```text
CHANGEBATTLE_PROJECT_ROOT=<APP_ROOT>
CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT=<APP_ROOT>\vendor\pokemon-showdown
CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT=<APP_ROOT>\vendor\showdown-client\js
```

## Resource Path Rules

V2 Desk portable 必须支持移动解压目录后继续运行，因此资源路径规则是：

- renderer 资源使用相对路径，例如 `./showdown/...`、`./npc/...`。
- 不允许 renderer bundle 中出现 `/showdown/...`、`/npc/...` 这类根路径资源。
- 不允许出现 `file:///D:/...`。
- 不允许业务数据里写死 Windows 盘符。
- CSS 里的资源也要走相对路径或构建后的 portable 资源路径。

如果新增资源引用，优先使用 web 侧的 `assetUrl()` / `showdownAssetPrefix()` 等统一 helper。

## Showdown Vendor

Pokemon Showdown runtime 不直接 bundle 成单个 JS 文件，而是作为 vendor 目录随包发布：

```text
vendor/pokemon-showdown
```

原因是 Showdown sim 运行时会动态读取 sibling 文件，例如：

```text
sim/
data/
lib/
config/
node_modules/ts-chacha20/
```

release 下由环境变量定位：

```text
CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT=<portable root>\vendor\pokemon-showdown
```

dev/source 下仍可 fallback 到：

```text
packages/showdown-battle-core/vendor/showdown
```

Battle playback timeline compiler 还需要 Showdown client replay 文件，作为另一个 vendor 目录随包发布：

```text
vendor/showdown-client/js
```

release 下由环境变量定位：

```text
CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT=<portable root>\vendor\showdown-client\js
```

dev/source 下 fallback 到：

```text
packages/showdown-battle-core/vendor/showdown-client/js
```

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

dev 模式下 `start_desk` 会先启动：

```text
http://127.0.0.1:5191
```

portable release 不能依赖这个外部 HTTP 服务。桌面端应通过 preload 暴露：

```text
window.changeBattleV2.battleService
```

renderer 中的 `api.battleService` 在 desktop runtime 下必须使用这个 IPC bridge，由 Electron main process 内置的 `createInMemoryBattleService()` 创建和维护 battle session。

如果点击“结束休整”后 Console 出现：

```text
ERR_CONNECTION_REFUSED http://127.0.0.1:5191
```

说明 renderer 没有拿到 desktop battle service bridge，或者 `createChangeBattleV2Api()` 没有注入 `battleServiceClient`。

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

并确认 `window.changeBattleV2.battleService` 已经由 preload 暴露，`App.tsx` 在 desktop runtime 下把它注入到 `createChangeBattleV2Api({battleServiceClient})`。

### Showdown vendor 找不到

确认 portable 包内存在：

```text
vendor/pokemon-showdown/sim/index.js
vendor/pokemon-showdown/node_modules/ts-chacha20/package.json
```

确认 `ChangeBattle-V2-Desk.cmd` 设置了：

```text
CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT=<portable root>\vendor\pokemon-showdown
```

### 运行的不是新版包

因为 release 过程中 Windows 侧和 Linux 侧都有 zip，容易拿错。以这两个位置为准：

```text
D:\changeBattleV2\release\ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
changeBattleV2/release/ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
```

解压后可查看 `RELEASE-README.md` 中的 commit 信息确认版本。
