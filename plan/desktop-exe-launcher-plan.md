# Desktop EXE Launcher 改造计划

## Summary

把 Windows Desktop portable 包从“玩家双击 `ChangeBattle-V2-Desk.cmd`”改造成“玩家双击 `ChangeBattle V2.exe`”。最终目标是启动时不弹 cmd 黑框，文件、任务栏和窗口图标都使用固定应用图标，并继续复用当前 portable 目录结构、离线 vendor、beta/stable 更新清单和 debug release 流程。

固定应用图标当前保留为仓库内小型资源：

```text
apps/desktop/resources/app-icon.png
```

运行时随机宝可梦小图标可以作为后续彩蛋单独做；本计划优先保证产品入口稳定、无黑框、图标一致。

## Current State

- 当前 release 包入口是 `ChangeBattle-V2-Desk.cmd`。
- `.cmd` 设置 portable 所需环境变量后，调用：

  ```text
  runtime\electron\electron.exe apps\desktop
  ```

- 这个方案已经验证了 portable 目录结构、Showdown vendor 路径、renderer 静态资源和 update manifest，但用户体验仍像开发启动器：
  - 双击 `.cmd` 可能出现 cmd 窗口。
  - 文件图标不是 ChangeBattle 自己的应用图标。
  - 任务栏/Alt+Tab/快捷方式图标不稳定，容易显示 Electron 默认图标。

## Goals

- 玩家入口变成 `ChangeBattle V2.exe` 或 `ChangeBattle-V2-Desk.exe`。
- 双击启动不显示 cmd/console 黑框。
- exe 文件图标固定使用 `apps/desktop/resources/app-icon.png` 生成的 `.ico`。
- Electron 窗口图标、任务栏 AppUserModelID、release 包入口和 README 统一。
- 现有 portable zip 结构尽量保持不变：
  - `apps/desktop/out`
  - `runtime/electron`
  - `vendor/pokemon-showdown`
  - `vendor/showdown-client`
  - `update-manifest.json`
- beta/debug 包仍走 `CHANGEBATTLE_RELEASE_CHANNEL=beta`。
- 保留 `.cmd` 作为 fallback/debug 入口一段时间，但 release README 默认引导玩家点 exe。

## Non-Goals

- 本轮不做安装器、代码签名、自动覆盖安装。
- 本轮不引入七牛云或对象存储分发。
- 本轮不改现有 desktop 自动更新策略，仍然只提示下载页/清单，不自动替换程序。
- 本轮不强制做随机宝可梦图标；随机图标后续可作为运行时窗口/托盘彩蛋。

## Design Options

### Option A: 小型原生 Launcher EXE

新增一个极小 Windows GUI 子系统 launcher：

- 程序名：`ChangeBattle V2.exe`。
- 启动后定位自身目录作为 portable root。
- 设置当前 `.cmd` 里已有的环境变量：
  - `CHANGEBATTLE_PROJECT_ROOT`
  - `CHANGEBATTLE_DESKTOP_VERSION`
  - `CHANGEBATTLE_PORTABLE_ROOT`
  - `CHANGEBATTLE_PORTABLE_UPDATE_ENABLED`
  - `CHANGEBATTLE_RELEASE_CHANNEL`
  - `CHANGEBATTLE_UPDATE_MANIFEST_URLS`
  - `CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT`
  - `CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT`
- 使用 Windows API 启动：

  ```text
  runtime\electron\electron.exe apps\desktop
  ```

- 创建进程时隐藏窗口，避免 cmd/console：
  - 使用 GUI subsystem。
  - `CreateProcessW` 不经 `cmd.exe`。
  - 设置合适的 `STARTUPINFO` / no console flags。

优点：

- 改动小，保留当前 portable 布局。
- 不需要立即迁移到 electron-builder。
- release 包可继续由 `tools/package_desktop_release.py` 组装。
- 后续可继续把 `.cmd` 作为 fallback。

风险：

- 需要维护一个 Windows launcher 小工程。
- launcher 和 `.cmd` 的环境变量逻辑要避免漂移。
- exe 图标需要在 launcher 构建阶段嵌入。

### Option B: 完整 Electron 应用打包

用 electron-builder/electron-packager 生成真正的 app exe，再把 vendor 和必要内置资源按 extraResources 放进去。

优点：

- 更接近 VSCode/QQ 这类产品形态。
- exe 图标、AppUserModelID、资源目录可以标准化。

风险：

- 对现有自定义 release 结构改动更大。
- 需要重新验证增量清单、vendor 路径、CDN 资源策略和 Windows 构建耗时。
- 容易把“无 cmd 启动”这个目标扩大成完整安装器工程。

### Recommendation

首版选 Option A。先用小型 GUI launcher 解决用户可见问题，稳定后再评估是否迁移完整 Electron 打包体系。

## Key Changes

### 1. 图标资产

- 从 `apps/desktop/resources/app-icon.png` 生成 Windows `.ico`。
- 推荐输出位置：

  ```text
  release/desktop-launcher/app-icon.ico
  ```

- `.ico` 包含常用尺寸：
  - `16x16`
  - `24x24`
  - `32x32`
  - `48x48`
  - `64x64`
  - `128x128`
  - `256x256`

### 2. Desktop Main 图标与 AppUserModelID

在 `apps/desktop/electron/main.ts` 中补齐：

- `app.setAppUserModelId("com.changebattle.v2")`
- `BrowserWindow({ icon })`
- 必要时窗口创建后 `mainWindow.setIcon(iconPath)`

图标解析需要同时支持：

- 开发环境源码路径。
- release portable 中的 `apps/desktop/out` 相对路径。
- launcher/exe 启动时的 portable root。

### 3. 新增 Windows GUI Launcher

新增 launcher 工程，候选位置：

```text
apps/desktop-launcher/windows/
```

或：

```text
tools/windows/desktop-launcher/
```

职责：

- 定位 exe 所在目录为 portable root。
- 校验必要文件存在：
  - `runtime\electron\electron.exe`
  - `apps\desktop\out\main\main.js`
  - `vendor\pokemon-showdown\sim\index.js`
  - `vendor\showdown-client\js\battle.js`
- 设置现有 `.cmd` 等价环境变量。
- 调用 Electron runtime 启动 desktop app。
- 不依赖 Node.js、pnpm、Python。
- 失败时不要弹 cmd；可以用 MessageBox 展示缺失文件，或写入 launcher log 后提示。

### 4. Release 打包脚本

更新 `tools/package_desktop_release.py`：

- 把 launcher exe 复制到 stage root：

  ```text
  ChangeBattle V2.exe
  ```

- 继续写入 `ChangeBattle-V2-Desk.cmd` 作为 fallback。
- `validate_zip` 必须校验 exe 存在。
- `RELEASE-README.md` 默认启动说明改为双击 exe。
- `update-manifest.json` / file manifest 把 exe 纳入 managed files。

更新 `tools/windows/build-desk-release.ps1`：

- 在 desktop build 前或 packaging 前构建 launcher exe。
- 校验 launcher exe 图标资源存在。
- zip validation 增加：

  ```text
  $Prefix/ChangeBattle V2.exe
  ```

### 5. Debug / Beta 行为

- beta/debug 包文件名继续保持：

  ```text
  ChangeBattle-V2-Desk-portable-debug-vX.Y.Z.zip
  ```

- 包内默认入口仍是同一个 exe。
- debug 差异只体现在 release channel、日志、更新清单和可诊断性，不再体现在 cmd 启动方式上。

### 6. 日志与错误处理

launcher 失败时写日志到：

```text
logs\launcher.log
```

或用户数据目录：

```text
%APPDATA%\@changebattle-v2\desktop\logs\launcher.log
```

日志至少包含：

- portable root
- electron exe path
- desktop app path
- channel
- manifest urls
- CreateProcess 错误码

Electron 主进程已有日志继续走现有 `console` 输出；后续可单独收口到文件日志。

## Runtime Random Pokemon Icon Follow-Up

如果后续想做“每次打开后表现为随机宝可梦小图标”：

- exe/快捷方式固定图标仍保持关都徽章。
- Electron `BrowserWindow` 运行时随机选择一张小图。
- 随机图标只影响窗口/任务栏/托盘，不能保证替换 Windows 文件图标。
- 不做全图鉴随机，先预生成一批知名宝可梦统一尺寸 PNG：

  ```text
  assets/runtime/app-icons/pokemon/*.png
  ```

- 首版图标池只包含九个世代的御三家，加皮卡丘、伊布，共 29 个：
  - Gen 1：`bulbasaur`、`charmander`、`squirtle`
  - Gen 2：`chikorita`、`cyndaquil`、`totodile`
  - Gen 3：`treecko`、`torchic`、`mudkip`
  - Gen 4：`turtwig`、`chimchar`、`piplup`
  - Gen 5：`snivy`、`tepig`、`oshawott`
  - Gen 6：`chespin`、`fennekin`、`froakie`
  - Gen 7：`rowlet`、`litten`、`popplio`
  - Gen 8：`grookey`、`scorbunny`、`sobble`
  - Gen 9：`sprigatito`、`fuecoco`、`quaxly`
  - Mascot：`pikachu`、`eevee`
- 推荐尺寸：
  - PNG 原图：`256x256`，透明背景，主体居中。
  - 可选额外生成 `64x64`，用于托盘或低分屏。
- 选择规则：
  - 默认每次启动随机。
  - 后续可加 profile seed，让同一存档当天固定一个图标，避免任务栏频繁跳变。
- 这属于彩蛋，不阻塞无 cmd exe 改造。

## Test Plan

### 本地静态检查

```bash
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
pnpm --filter @changebattle-v2/desktop test:renderer-assets
pnpm --filter @changebattle-v2/desktop test:formal-worker
```

### Release Preflight

```bash
bash -n tools/build_release_on_windows.sh
bash -n tools/publish_desktop_update_manifest.sh
python3 -m py_compile tools/package_desktop_release.py
```

### Windows 构建验证

```powershell
pnpm --filter @changebattle-v2/desktop build
python tools\package_desktop_release.py --electron-runtime-path D:\changeBattleV2\electron-runtime\electron --keep-stage
```

检查 stage 目录：

```text
release\ChangeBattle-V2-Desk-portable-debug-vX.Y.Z\ChangeBattle V2.exe
release\ChangeBattle-V2-Desk-portable-debug-vX.Y.Z\ChangeBattle-V2-Desk.cmd
release\ChangeBattle-V2-Desk-portable-debug-vX.Y.Z\runtime\electron\electron.exe
```

### 手测

- 双击 `ChangeBattle V2.exe` 能启动游戏。
- 启动过程没有 cmd 黑框。
- 任务管理器中可以看到 Electron 进程，但没有多余 `cmd.exe` 持续存在。
- 窗口标题、任务栏图标、Alt+Tab 图标使用关都徽章或预期 icon。
- 解压到带空格和中文的路径后仍能启动。
- 缺少 `runtime\electron\electron.exe` 时，launcher 给出可理解错误，不闪退。
- fallback `ChangeBattle-V2-Desk.cmd` 仍可启动，便于排查。
- beta/debug 包仍能检查更新，manifest url 指向 `changebattle-beta/latest.json`。

## Rollout Plan

1. 新增 icon 生成脚本或手工生成 `.ico`，提交固定图标资产。
2. 在 Electron main 中补 `AppUserModelID` 和窗口 icon。
3. 新增 Windows GUI launcher，并在 Windows 构建机验证单独启动。
4. 更新 packaging 脚本，把 exe 放到 portable root 并保留 `.cmd` fallback。
5. 更新 release 文档和 zip validation。
6. 打 beta/debug 包手测。
7. 确认无 cmd 黑框后，把 README 默认启动入口改为 exe。

## Open Questions

- launcher 工程使用 C#、C++、Rust 还是 Go？
  - C# 构建方便，但目标机可能涉及 .NET runtime，除非用 self-contained。
  - C++ Win32 最小、无 runtime 依赖，但工程维护略硬。
  - Rust/Go 单文件方便，但会引入构建链。
- exe 名称最终用 `ChangeBattle V2.exe` 还是 `ChangeBattle-V2-Desk.exe`？
- 是否需要保留 `.cmd` 在玩家包根目录，还是移动到 `debug/` 或 `tools/`？
- 是否需要在本轮顺手把 Electron 主进程日志写到文件？
