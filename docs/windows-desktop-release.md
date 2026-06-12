# Windows Desk Release 流程

这份文档只记录 Desk 桌面端 Windows 便携包的生成流程。Android APK 走 [`app-release.md`](./app-release.md)，不要把两个 release 流程混在一起。

## 最终产物

Desk 正式产物是：

```text
ChangeBattle-Desk-portable-vX.Y.Z.zip
```

这是便携版 Electron 桌面包。用户解压后双击：

```text
ChangeBattle-Desk.cmd
```

用户机器不需要安装 Node.js、npm、pnpm、Python。

## Windows 构建机目录

当前 Windows 构建机：

```text
ssh win10@172.16.10.41
```

`D:\changeBattle` 根目录只保留这些内容：

```text
D:\changeBattle\changeBattle       当前源码工作目录
D:\changeBattle\release            源码同步包、Desk zip、App APK 等输出
D:\changeBattle\electron-runtime   Desk release 需要的 Windows Electron runtime
D:\changeBattle\vendor             Desk release 需要的外部 runtime，例如 Pokemon Showdown
D:\changeBattle\signing            Android 私有签名文件，只给 App release 用
```

不要再把旧源码、旧 portable 解压目录、临时 tgz、APK 或 zip 平铺在 `D:\changeBattle` 根目录。

重要：`electron-runtime` 和 `vendor` 不是杂物。它们是 Desk release 环境，清理目录时不要删除。

## 前置环境

Windows 构建机需要：

```text
Node.js / pnpm
Python 3
可用的 Electron Windows runtime
可用的 Pokemon Showdown build
```

Electron runtime 优先来自 `apps\desktop\node_modules\electron\dist`。如果缺失，先执行 `pnpm install`，不要让 release 脚本现场下载 Electron。

实际经验：pnpm 10 可能因为 ignored build scripts 没有执行 Electron postinstall，导致：

```text
apps\desktop\node_modules\electron\dist\electron.exe
```

不存在。此时使用固定外部 runtime：

```text
D:\changeBattle\electron-runtime\electron\electron.exe
```

手动下载地址：

```text
https://github.com/electron/electron/releases/download/v38.8.6/electron-v38.8.6-win32-x64.zip
```

下载到：

```text
C:\Users\win10\Downloads\electron-v38.8.6-win32-x64.zip
```

解压：

```bash
ssh win10@172.16.10.41 "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Remove-Item -Recurse -Force D:\changeBattle\electron-runtime -ErrorAction SilentlyContinue; New-Item -ItemType Directory -Force D:\changeBattle\electron-runtime\electron | Out-Null; Expand-Archive -Force C:\Users\win10\Downloads\electron-v38.8.6-win32-x64.zip D:\changeBattle\electron-runtime\electron; Test-Path D:\changeBattle\electron-runtime\electron\electron.exe\""
```

打包时设置：

```text
ELECTRON_RUNTIME_PATH=D:\changeBattle\electron-runtime\electron
```

Pokemon Showdown 不是当前 workspace 依赖。打包 Desk 时必须准备一个已经构建好的 Showdown 路径，并用 `SHOWDOWN_PATH` 或 `--showdown-path` 指向它。推荐固定放在：

```text
D:\changeBattle\vendor\pokemon-showdown
```

如果缺少：

```text
dist\sim\index.js
node_modules\ts-chacha20
```

就先停止并补环境，不要现场临时下载或重做。

当前 Linux 本机可用 Showdown runtime：

```text
/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown
```

如果 Windows 上缺 `D:\changeBattle\vendor\pokemon-showdown`，可以从本机打包同步：

```bash
tar --exclude='.git' -czf /tmp/pokemon-showdown-runtime.tgz -C /home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown .
scp /tmp/pokemon-showdown-runtime.tgz win10@172.16.10.41:D:/changeBattle/release/pokemon-showdown-runtime.tgz
ssh win10@172.16.10.41 "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Remove-Item -Recurse -Force D:\changeBattle\vendor\pokemon-showdown -ErrorAction SilentlyContinue; New-Item -ItemType Directory -Force D:\changeBattle\vendor\pokemon-showdown | Out-Null; tar -xzf D:\changeBattle\release\pokemon-showdown-runtime.tgz -C D:\changeBattle\vendor\pokemon-showdown; if (Test-Path D:\changeBattle\vendor\pokemon-showdown\dist\sim\index.js) { 'showdown sim ok' } else { 'showdown sim missing' }; if (Test-Path D:\changeBattle\vendor\pokemon-showdown\node_modules\ts-chacha20) { 'ts-chacha20 ok' } else { 'ts-chacha20 missing' }\""
```

## 版本号

发版前同步更新这些版本号：

```text
package.json
apps/desktop/package.json
apps/mobile/package.json
packages/shared/package.json
packages/game-service/package.json
```

Desk zip 文件名使用同一个 `X.Y.Z`。

## 1. 本地检查

在 Linux 本地仓库：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
git status --short
pnpm typecheck
pnpm --filter @changebattle/desktop build
pnpm --filter @changebattle/desktop test:talents
pnpm --filter @changebattle/game-service test:trainer-items
```

CLI 已经是历史入口，不再作为主 release 阻塞项。需要时可额外跑：

```bash
python3 -m py_compile changeBattle-cli/play.py
```

提交并推送：

```bash
git add <本次 release 文件>
git commit -m "Release desktop X.Y.Z"
git push origin main
git rev-parse --short HEAD
```

记下短 commit，后面写入 `RELEASE-README.md`。

## 快速自动化脚本

如果只是按已提交的 `HEAD` 生成新版本，优先使用脚本，避免手动重复敲 SSH 命令。

Linux 本机同步源码到 Windows：

```bash
tools/send_release_source_to_windows.sh X.Y.Z
```

不传版本号时脚本会提示输入。脚本会：

- 校验 `package.json` 版本等于输入版本。
- 要求 git 工作区干净。
- 用 `git archive HEAD` 生成 `changeBattle-src-X.Y.Z.tgz`。
- 上传源码包到 `D:\changeBattle\release`。
- 替换 `D:\changeBattle\changeBattle`。
- 把 Windows release 脚本复制到 `D:\changeBattle` 根目录。
- 写入 `.changebattle-release-commit`，供 Desk release README 使用。

Windows 构建 Desk：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattle\build-desk-release.ps1
```

也可以直接传版本号：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattle\build-desk-release.ps1 -Version X.Y.Z
```

脚本会安装依赖、构建 Desktop、打包便携 zip、复制到 `D:\changeBattle\release`，并校验启动脚本、Electron runtime、Showdown runtime 和 `docs/` 排除规则。

## 2. 同步源码到 Windows

推荐只从已提交的 `HEAD` 生成源码包，避免把本地 `node_modules`、`release`、`saves`、未提交改动带过去。

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
git archive --format=tar.gz -o /tmp/changeBattle-src-X.Y.Z.tgz HEAD
scp /tmp/changeBattle-src-X.Y.Z.tgz win10@172.16.10.41:D:/changeBattle/release/changeBattle-src-X.Y.Z.tgz
```

在 Windows 侧替换源码目录：

```bash
ssh win10@172.16.10.41 "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Get-ChildItem -Force D:\changeBattle\changeBattle | Remove-Item -Recurse -Force; tar -xzf D:\changeBattle\release\changeBattle-src-X.Y.Z.tgz -C D:\changeBattle\changeBattle\""
```

确认源码版本：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && type package.json && type apps\desktop\package.json"
```

再次强调：`changeBattle-src-X.Y.Z.tgz` 是源码同步包，不是 release 包。

## 3. Windows 安装依赖与构建

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && pnpm install"
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && pnpm --filter @changebattle/desktop build"
```

如果 `pnpm install` 输出类似：

```text
Ignored build scripts: electron, esbuild
```

先继续跑 desktop build。若 build 能过但缺 `electron.exe`，按前置环境里的 Electron 手动 zip 方式恢复。

期望输出包含：

```text
apps\desktop\out\main\main.js
apps\desktop\out\preload\preload.mjs
apps\desktop\out\renderer\index.html
```

如果 `pnpm install` 需要联网但网络不可用，停止并说明缺依赖，不要现场换方案。

## 4. 生成 Desk 便携 zip

如果 Showdown 固定在 `D:\changeBattle\vendor\pokemon-showdown`：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && set SHOWDOWN_PATH=D:\changeBattle\vendor\pokemon-showdown&& set CHANGEBATTLE_COMMIT=<commit>&& python tools\package_desktop_release.py --showdown-path D:\changeBattle\vendor\pokemon-showdown"
```

推荐显式指定 Electron runtime 和 Showdown runtime，避免脚本尝试下载：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && set ELECTRON_RUNTIME_PATH=D:\changeBattle\electron-runtime\electron&& set SHOWDOWN_PATH=D:\changeBattle\vendor\pokemon-showdown&& set CHANGEBATTLE_COMMIT=<commit>&& python tools\package_desktop_release.py --showdown-path D:\changeBattle\vendor\pokemon-showdown"
```

脚本会先生成：

```text
D:\changeBattle\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip
```

再复制一份到统一输出目录：

```bash
ssh win10@172.16.10.41 "copy /Y D:\changeBattle\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip D:\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip"
```

## 5. 校验 zip

检查文件大小：

```bash
ssh win10@172.16.10.41 "dir D:\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip"
```

检查关键文件：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && python -c \"import zipfile; z=zipfile.ZipFile(r'D:\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip'); names=set(z.namelist()); wanted=['ChangeBattle-Desk-portable-vX.Y.Z/ChangeBattle-Desk.cmd','ChangeBattle-Desk-portable-vX.Y.Z/RELEASE-README.md','ChangeBattle-Desk-portable-vX.Y.Z/apps/desktop/out/main/main.js','ChangeBattle-Desk-portable-vX.Y.Z/runtime/electron/electron.exe','ChangeBattle-Desk-portable-vX.Y.Z/vendor/pokemon-showdown/dist/sim/index.js']; print('\\n'.join(f'{w}: {w in names}' for w in wanted)); print('\\n'.join(z.read('ChangeBattle-Desk-portable-vX.Y.Z/RELEASE-README.md').decode('utf-8').splitlines()[0:8])); z.close()\""
```

每个关键文件都应该输出 `True`。

检查内部文档没有进入 zip：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && python -c \"import zipfile; z=zipfile.ZipFile(r'D:\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip'); print(any(name.startswith('ChangeBattle-Desk-portable-vX.Y.Z/docs/') for name in z.namelist())); z.close()\""
```

这里应该输出 `False`。

如果打开 zip 看到的是 `packages`、`tools`、`pnpm-workspace.yaml`、`.gitignore` 这类源码文件，说明打开错了，打开的是源码同步包。

## 6. 拉回 Linux

```bash
scp win10@172.16.10.41:D:/changeBattle/release/ChangeBattle-Desk-portable-vX.Y.Z.zip /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Desk-portable-vX.Y.Z.zip
ls -lh /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Desk-portable-vX.Y.Z.zip
```

## 快速检查清单

- `D:\changeBattle` 根目录只保留 `changeBattle`、`release`、`electron-runtime`、`vendor`、`signing`。
- 版本号已同步到所有 package 文件。
- 本地检查通过。
- release commit 已推送到 `origin/main`。
- Windows 源码来自已提交的 `HEAD`。
- Windows 上 `pnpm install` 和 desktop build 通过。
- `D:\changeBattle\electron-runtime\electron\electron.exe` 存在。
- `SHOWDOWN_PATH` 指向已构建好的 Pokemon Showdown。
- `D:\changeBattle\vendor\pokemon-showdown\dist\sim\index.js` 存在。
- `D:\changeBattle\vendor\pokemon-showdown\node_modules\ts-chacha20` 存在。
- `tools\package_desktop_release.py` 生成了 `ChangeBattle-Desk-portable-vX.Y.Z.zip`。
- zip 内有 `runtime/electron/electron.exe`。
- zip 内有 `vendor/pokemon-showdown/dist/sim/index.js`。
- zip 内有 `apps/desktop/out/main/main.js`。
- zip 内没有 `docs/`。
- `RELEASE-README.md` 显示 `Version: X.Y.Z`。
- Linux 本地 `release/` 下有最终 zip。
