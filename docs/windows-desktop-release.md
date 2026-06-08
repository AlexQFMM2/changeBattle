# Windows Desk Release 流程

这份文档记录 Desk 的 Windows 便携 release 包生成流程。后续发版按这里走，目标是生成和旧版 `0.1.4` / `0.1.5` 一样结构的包。

## 最终产物

最终要上传的是：

```text
ChangeBattle-Desk-portable-vX.Y.Z.zip
```

这个 zip 是便携版 Electron 桌面包。用户解压后直接双击：

```text
ChangeBattle-Desk.cmd
```

用户机器不需要安装 Node.js、npm、pnpm、Python。

## Windows 机器路径

当前 Windows 构建机器：

```text
ssh win10@172.16.10.41
```

固定工作路径：

```text
D:\changeBattle
D:\changeBattle\changeBattle
D:\changeBattle\electron-runtime\electron\electron.exe
D:\changeBattle\pokemon-showdown\dist\sim\index.js
```

含义：

```text
D:\changeBattle\changeBattle
```

源码目录，用来执行 build 和 package。

```text
D:\changeBattle\electron-runtime\electron
```

已准备好的 Windows Electron runtime，里面必须有 `electron.exe`。

```text
D:\changeBattle\pokemon-showdown
```

已构建好的 Pokemon Showdown runtime，里面必须有 `dist\sim\index.js`。

## 一定不要搞混的文件

源码同步包：

```text
changeBattle-src-X.Y.Z.tgz
```

这个只是为了把 Linux 上的源码同步到 Windows。它不是 release 包。打开后会看到源码目录，比如 `apps`、`packages`、`tools`、`package.json`、`pnpm-workspace.yaml` 等。

不要上传它。

真正的 Desk release 包：

```text
ChangeBattle-Desk-portable-vX.Y.Z.zip
```

只有这个才是上传到 GitHub Release 的 Desk 便携包。

## 正确 zip 结构

正确的 Desk zip 应该和 `0.1.4` / `0.1.5` 一样。顶层 release 目录里应包含：

```text
apps
assets
data
runtime
vendor
ChangeBattle-Desk.cmd
README.md
RELEASE-README.md
docs
plan.md
```

关键文件：

```text
ChangeBattle-Desk-portable-vX.Y.Z\ChangeBattle-Desk.cmd
ChangeBattle-Desk-portable-vX.Y.Z\apps\desktop\out\main\main.js
ChangeBattle-Desk-portable-vX.Y.Z\runtime\electron\electron.exe
ChangeBattle-Desk-portable-vX.Y.Z\vendor\pokemon-showdown\dist\sim\index.js
ChangeBattle-Desk-portable-vX.Y.Z\RELEASE-README.md
```

`RELEASE-README.md` 里的版本必须和 zip 文件名一致。

## 资产打包提醒

`tools/package_desktop_release.py` 会排除旧残留素材目录，避免便携包继续膨胀：

```text
assets/pokemon-green
assets/battle-effects-pack
assets/battle/stage
```

当前运行时宝可梦图片主要来自 `assets/pokemon-pack`，其次来自 `assets/pokemon-showdown`；战斗背景只应来自 `assets/battle-backgrounds/backgrounds.csv` 中登记的当前背景。

## 1. 本地准备

在 Linux 本地仓库：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
git status --short
```

注意：不要把无关本地修改误提交，比如用户临时改的 `docs/rule.md`。除非这次 release 明确要包含它。

发版前需要把这些版本号改成目标版本：

```text
package.json
apps/desktop/package.json
packages/shared/package.json
packages/game-service/package.json
```

发版前确认 `assets/battle-backgrounds` 只保留 `backgrounds.csv` 和当前 10 张背景：

```text
backgrounds.csv
grassland.png
forest.png
lakeside.png
tropical-beach.png
ocean-rafts.png
ceremonial-stage.png
snowfield.png
neon-downtown.png
champion-stage.png
mountain-route.png
```

可用这个命令快速检查：

```bash
find assets/battle-backgrounds -maxdepth 1 -type f -printf '%f\n' | sort
```

本地验证：

```bash
pnpm typecheck
pnpm --filter @changebattle/desktop build
pnpm --filter @changebattle/desktop test:talents
pnpm --filter @changebattle/game-service test:trainer-items
python3 -m py_compile changeBattle-cli/play.py
```

提交并推送：

```bash
git add <本次 release 文件>
git commit -m "Release desktop X.Y.Z"
git push origin main
git rev-parse --short HEAD
```

记下短 commit，例如：

```text
8fc28a8
```

后面打包时会写进 `RELEASE-README.md`。

## 2. 同步源码到 Windows

推荐用 `git archive` 从已经提交的 `HEAD` 生成源码包。这样不会把 Linux 的 `node_modules`、`release`、`saves`、未提交文件一起带过去。

在 Linux：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
git archive --format=tar.gz -o /tmp/changeBattle-X.Y.Z-src.tgz HEAD
scp /tmp/changeBattle-X.Y.Z-src.tgz win10@172.16.10.41:D:/changeBattle/changeBattle-src-X.Y.Z.tgz
```

在 Windows 侧解包到源码目录：

```bash
ssh win10@172.16.10.41 "cd /d D:\\changeBattle\\changeBattle && tar -xzf D:\\changeBattle\\changeBattle-src-X.Y.Z.tgz"
```

确认 Windows 源码版本正确：

```bash
ssh win10@172.16.10.41 "cd /d D:\\changeBattle\\changeBattle && type package.json && type apps\\desktop\\package.json"
```

再次强调：`changeBattle-src-X.Y.Z.tgz` 只是同步源码用，不是 release 包。

## 3. Windows 上构建 Desk

执行：

```bash
ssh win10@172.16.10.41 "cd /d D:\\changeBattle\\changeBattle && pnpm --filter @changebattle/desktop build"
```

期望输出包含：

```text
apps\desktop\out\main\main.js
apps\desktop\out\preload\preload.mjs
apps\desktop\out\renderer\index.html
```

## 4. Windows 上生成便携 zip

使用已有脚本：

```text
tools\package_desktop_release.py
```

它会生成：

```text
D:\changeBattle\changeBattle\release\ChangeBattle-Desk-portable-vX.Y.Z.zip
```

通过 SSH 执行：

```bash
ssh win10@172.16.10.41 "cd /d D:\\changeBattle\\changeBattle && set ELECTRON_RUNTIME_PATH=D:\\changeBattle\\electron-runtime\\electron&& set SHOWDOWN_PATH=D:\\changeBattle\\pokemon-showdown&& set CHANGEBATTLE_COMMIT=<commit>&& python tools\\package_desktop_release.py --showdown-path D:\\changeBattle\\pokemon-showdown"
```

把 `<commit>` 替换成前面记录的短 commit。

注意：

- `ELECTRON_RUNTIME_PATH` 必须指向含有 `electron.exe` 的目录。
- `SHOWDOWN_PATH` 必须指向含有 `dist\sim\index.js` 的目录。
- 如果路径错了，脚本可能失败，或者尝试下载 Electron runtime。

如果想像旧包一样放一份到 `D:\changeBattle` 根目录，生成后可选复制：

```bash
ssh win10@172.16.10.41 "copy /Y D:\\changeBattle\\changeBattle\\release\\ChangeBattle-Desk-portable-vX.Y.Z.zip D:\\changeBattle\\ChangeBattle-Desk-portable-vX.Y.Z.zip"
```

## 5. 校验 zip

检查文件大小：

```bash
ssh win10@172.16.10.41 "cd /d D:\\changeBattle\\changeBattle && dir release\\ChangeBattle-Desk-portable-vX.Y.Z.zip"
```

检查关键文件：

```bash
ssh win10@172.16.10.41 "cd /d D:\\changeBattle\\changeBattle && python -c \"import zipfile; z=zipfile.ZipFile(r'release\\ChangeBattle-Desk-portable-vX.Y.Z.zip'); names=set(z.namelist()); wanted=['ChangeBattle-Desk-portable-vX.Y.Z/ChangeBattle-Desk.cmd','ChangeBattle-Desk-portable-vX.Y.Z/RELEASE-README.md','ChangeBattle-Desk-portable-vX.Y.Z/apps/desktop/out/main/main.js','ChangeBattle-Desk-portable-vX.Y.Z/runtime/electron/electron.exe','ChangeBattle-Desk-portable-vX.Y.Z/vendor/pokemon-showdown/dist/sim/index.js']; print('\\n'.join(f'{w}: {w in names}' for w in wanted)); print(z.read('ChangeBattle-Desk-portable-vX.Y.Z/RELEASE-README.md').decode('utf-8').splitlines()[0:8]); z.close()\""
```

每个关键文件都应该输出 `True`。

`RELEASE-README.md` 前几行应该包含：

```text
Version: X.Y.Z
```

如果用 WinRAR/资源管理器打开，看到的是 `packages`、`tools`、`pnpm-workspace.yaml`、`.gitignore` 这类源码文件，说明打开错了，打开的是源码同步包，不是 Desk release 包。

## 6. 拉回 Linux

把最终 release 包复制回本地：

```bash
scp win10@172.16.10.41:D:/changeBattle/changeBattle/release/ChangeBattle-Desk-portable-vX.Y.Z.zip /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Desk-portable-vX.Y.Z.zip
```

本地确认：

```bash
ls -lh /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Desk-portable-vX.Y.Z.zip
```

## 7. 上传 GitHub Release

上传这个：

```text
ChangeBattle-Desk-portable-vX.Y.Z.zip
```

不要上传这个：

```text
changeBattle-src-X.Y.Z.tgz
```

## 快速检查清单

- 版本号已同步到所有 package 文件。
- 本地检查通过。
- release commit 已推送到 `origin/main`。
- Windows 源码来自已提交的 `HEAD`。
- Windows 上 `pnpm --filter @changebattle/desktop build` 通过。
- `tools\package_desktop_release.py` 生成了 `ChangeBattle-Desk-portable-vX.Y.Z.zip`。
- zip 内有 `runtime/electron/electron.exe`。
- zip 内有 `vendor/pokemon-showdown/dist/sim/index.js`。
- zip 内有 `apps/desktop/out/main/main.js`。
- `RELEASE-README.md` 显示 `Version: X.Y.Z`。
- 本地 `release/` 下有最终 zip。
