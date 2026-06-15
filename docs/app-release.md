# Android App Release 流程

这份文档记录 ChangeBattle Mobile Android APK 的生成流程。它只服务自用 Android 安装包，不上架，不做 iOS。Desk 桌面端仍按 [`windows-desktop-release.md`](./windows-desktop-release.md) 发便携 zip。

## 当前边界

当前 `apps/mobile` 已经是可构建的 Capacitor Android 工程，能生成 APK，并开始接入真实 `game-runtime`、mobile data bundle 和 mobile Showdown bundle。

重要限制：

- APK 已不再按 mock/scaffold 作为目标；后续问题应按真实 App runtime 排查。
- APK 可用于安装体验、横屏触摸、资源路径、启动页、签名、bridge 形态和基础真实流程验证。
- 完整本地游玩仍需要持续真机/模拟器 smoke。当前不要只看构建通过就判定 App release 可用。
- Android 模拟器截图和自动化点击流程见 [`android-emulator-smoke.md`](./android-emulator-smoke.md)。

## 当前 APK 问题记录

这组记录用于避免下一轮重复定位同一类问题。记录日期：2026-06-12。

已修复/已定位：

- `开始游戏` 曾报 `Module not found in bundle: ../data/random-battles/gen9/teams`。原因是 mobile Showdown bundle 没带 `random-battles/**/teams.js`，并且动态 glob 没有被 esbuild 正确保留；已在 mobile Showdown bundle/smoke 中补齐随机队伍模块，并用 `Teams.generate("gen9randombattle")` 校验 6 只队伍。
- Mobile 候选队曾大量 fallback 到皮卡丘形态。原因是 `pokemon_tiers.csv` 只走同步读取，而 mobile `DataProvider` 只有异步读取；已补 async tier loading。
- 公共 `assets/` 资源曾在 APK 中缺失，导致图片和 BGM 不加载。后续打包必须确认 mobile static copy 同时带上 `apps/desktop/src/assets` 中被 Vite 引用的资源，以及项目公共 `assets/` 中由 `assetUrl()` 访问的资源。

当前待修：

- 普通流程选完人后直接进入战斗页，预期应先进入第 1 场前的休整页。
- 进入战斗后存在敌方/宝可梦显示为 `?`、血量不显示、点击“战斗”不弹技能菜单的问题。优先怀疑是普通流程跳过首个休整页后 run/battle session 状态不一致，但需要用模拟器实际点按和 logcat 确认。
- 路由中转页视频在 Android WebView 上会短暂露出原生视频播放按钮。预期修法不是禁用或隐藏视频加载，而是在转场层最上方盖一个约 1 秒的黑色遮罩，等 WebView 原生控件闪现阶段过去后再淡出。
- 星图右侧描述移动端已能显示，但样式和触摸布局仍需要按真机截图继续修。

排查原则：

- 先用模拟器实际走一遍：新建存档 -> 开始游戏 -> 选队 -> 进入休整/战斗。
- 资源问题先看 APK 内是否包含文件，再看 `assetUrl()` 返回路径，不要只改前端引用。
- 战斗页问题先看 runtime 返回的 battle state/request，再看 UI 显示层。
- 不要为了掩盖 Android WebView 视频控件问题而关闭视频本身；用高层遮罩处理闪屏。

## 最终产物

debug 包：

```text
ChangeBattle-Mobile-debug-vX.Y.Z.apk
```

release 自签名包：

```text
ChangeBattle-Mobile-vX.Y.Z.apk
```

APK 不进 git，统一放在：

```text
release/
```

Windows 构建机统一输出目录：

```text
D:\changeBattle\release
```

## Windows 构建机目录

当前 Windows 构建机：

```text
ssh win10@172.16.10.41
```

`D:\changeBattle` 根目录只保留：

```text
D:\changeBattle\changeBattle   当前源码工作目录
D:\changeBattle\release        源码同步包、Desk zip、App APK 等输出
D:\changeBattle\signing        Android 私有签名文件
```

不要把旧源码、旧 Desk portable、临时 tgz 或 APK 平铺在 `D:\changeBattle` 根目录。

## Windows Android 环境

当前已验证环境：

```text
Android Studio: G:\ANDROID
Android SDK: G:\SDK
JDK 21: D:\jdk-21.0.11
Gradle wrapper: apps\mobile\android\gradle\wrapper\gradle-wrapper.properties
```

构建 APK 时固定设置：

```cmd
set ANDROID_HOME=G:\SDK
set ANDROID_SDK_ROOT=G:\SDK
set JAVA_HOME=D:\jdk-21.0.11
set PATH=D:\jdk-21.0.11\bin;G:\SDK\platform-tools;%PATH%
```

如果缺 SDK、JDK、Gradle wrapper 或依赖下载卡住，停止并补环境，不要临时换版本或重做工程。

## 签名文件

release APK 必须签名。签名文件只放 Windows 本机，不进 git：

```text
D:\changeBattle\signing\changebattle-mobile-release.jks
D:\changeBattle\signing\signing.properties
```

`signing.properties` 格式：

```properties
storeFile=D:\\changeBattle\\signing\\changebattle-mobile-release.jks
storePassword=<本机私有密码>
keyAlias=changebattle-mobile
keyPassword=<本机私有密码>
```

生成 keystore：

```cmd
D:\jdk-21.0.11\bin\keytool.exe -genkeypair -v ^
  -keystore D:\changeBattle\signing\changebattle-mobile-release.jks ^
  -alias changebattle-mobile ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000 ^
  -storepass <本机私有密码> ^
  -keypass <本机私有密码> ^
  -dname "CN=ChangeBattle, OU=Personal, O=ChangeBattle, L=Local, ST=Local, C=CN"
```

后续升级同一个 App 必须继续使用同一个 keystore。丢失 keystore 后，手机上已安装的旧 App 不能被新包覆盖升级。

## 版本号

当前版本：

```text
versionName: 0.8.2
versionCode: 802
```

需要同步检查：

```text
package.json
apps/mobile/package.json
apps/mobile/android/app/build.gradle
```

建议规则：

```text
0.6.0 -> versionCode 600
0.6.1 -> versionCode 601
0.6.2 -> versionCode 602
0.6.3 -> versionCode 603
0.6.4 -> versionCode 604
0.6.5 -> versionCode 605
0.6.6 -> versionCode 606
0.6.7 -> versionCode 607
0.6.8 -> versionCode 608
0.6.9 -> versionCode 609
0.6.10 -> versionCode 610
0.6.11 -> versionCode 611
0.6.12 -> versionCode 612
0.6.13 -> versionCode 613
0.7.0 -> versionCode 700
0.7.9 -> versionCode 709
0.8.0 -> versionCode 800
0.8.1 -> versionCode 801
0.8.2 -> versionCode 802
1.0.0 -> versionCode 1000
```

`versionCode` 只能递增，不能回退。

## 1. 本地检查

在 Linux 本地仓库：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
git status --short
pnpm --filter @changebattle/mobile build
pnpm typecheck
```

提交并推送：

```bash
git add <本次 mobile release 文件>
git commit -m "Build mobile release X.Y.Z"
git push origin main
git rev-parse --short HEAD
```

## 快速自动化脚本

如果只是按已提交的 `HEAD` 生成新版本，优先使用脚本。

Linux 本机同步源码到 Windows：

```bash
tools/send_release_source_to_windows.sh X.Y.Z
```

不传版本号时脚本会提示输入。它会校验版本、要求 git 工作区干净、预检资源 registry 与 `assets/runtime` 已生成、生成 `git archive` 源码包、上传并替换 Windows 源码目录，同时把 Windows release 脚本复制到 `D:\changeBattle`。

Windows 构建 APK：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattle\build-mobile-release.ps1
```

也可以直接传版本号：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File D:\changeBattle\build-mobile-release.ps1 -Version X.Y.Z
```

脚本会安装依赖、构建 mobile web、同步 Capacitor、生成 release APK、复制到 `D:\changeBattle\release`，校验 APK 内的资源 registry 和 `assets/runtime`，并用 SDK 里的 `apksigner` 校验签名。

## 2. 同步源码到 Windows

推荐从已提交的 `HEAD` 生成源码包：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattle
git archive --format=tar.gz -o /tmp/changeBattle-mobile-src-X.Y.Z.tgz HEAD
scp /tmp/changeBattle-mobile-src-X.Y.Z.tgz win10@172.16.10.41:D:/changeBattle/release/changeBattle-mobile-src-X.Y.Z.tgz
```

替换 Windows 源码目录：

```bash
ssh win10@172.16.10.41 "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Get-ChildItem -Force D:\changeBattle\changeBattle | Remove-Item -Recurse -Force; tar -xzf D:\changeBattle\release\changeBattle-mobile-src-X.Y.Z.tgz -C D:\changeBattle\changeBattle\""
```

## 3. Windows 安装依赖与同步 Capacitor

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && pnpm install"
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && pnpm --filter @changebattle/mobile build"
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && pnpm --filter @changebattle/mobile sync"
```

如果 `pnpm install` 需要联网但网络不可用，停止并说明缺依赖。

## 4. 生成 debug APK

debug 包用于快速安装 smoke：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle\apps\mobile\android && set ANDROID_HOME=G:\SDK&& set ANDROID_SDK_ROOT=G:\SDK&& set JAVA_HOME=D:\jdk-21.0.11&& set PATH=D:\jdk-21.0.11\bin;G:\SDK\platform-tools;%PATH%&& gradlew.bat assembleDebug"
ssh win10@172.16.10.41 "copy /Y D:\changeBattle\changeBattle\apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk D:\changeBattle\release\ChangeBattle-Mobile-debug-vX.Y.Z.apk"
```

拉回 Linux：

```bash
scp win10@172.16.10.41:D:/changeBattle/release/ChangeBattle-Mobile-debug-vX.Y.Z.apk /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Mobile-debug-vX.Y.Z.apk
```

## 5. 生成 release APK

确认签名文件存在：

```bash
ssh win10@172.16.10.41 "dir D:\changeBattle\signing\changebattle-mobile-release.jks && type D:\changeBattle\signing\signing.properties"
```

生成 release APK：

```bash
ssh win10@172.16.10.41 "cd /d D:\changeBattle\changeBattle && set ANDROID_HOME=G:\SDK&& set ANDROID_SDK_ROOT=G:\SDK&& set JAVA_HOME=D:\jdk-21.0.11&& set PATH=D:\jdk-21.0.11\bin;G:\SDK\platform-tools;%PATH%&& set CHANGEBATTLE_ANDROID_SIGNING_PROPERTIES=D:\changeBattle\signing\signing.properties&& pnpm mobile:apk:release"
```

脚本输出：

```text
D:\changeBattle\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk
```

复制到统一输出目录：

```bash
ssh win10@172.16.10.41 "copy /Y D:\changeBattle\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk"
```

拉回 Linux：

```bash
scp win10@172.16.10.41:D:/changeBattle/release/ChangeBattle-Mobile-vX.Y.Z.apk /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Mobile-vX.Y.Z.apk
```

## 6. APK 校验

检查文件：

```bash
ls -lh /home/alexqfmm/workPlace/pokemon/changeBattle/release/ChangeBattle-Mobile-vX.Y.Z.apk
ssh win10@172.16.10.41 "dir D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk"
```

用 `apksigner` 校验签名，如果 SDK build-tools 提供该命令：

```bash
ssh win10@172.16.10.41 "G:\SDK\build-tools\35.0.0\apksigner.bat verify --verbose D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk"
```

如果 build-tools 版本不同，先查看：

```bash
ssh win10@172.16.10.41 "dir G:\SDK\build-tools"
```

## 7. 真机安装 smoke

手动安装或使用 adb：

```bash
ssh win10@172.16.10.41 "set PATH=G:\SDK\platform-tools;%PATH%&& adb install -r D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk"
```

最低 smoke：

- App 名称显示为 `ChangeBattle`。
- 图标不是 Capacitor 默认图标。
- 横屏启动。
- 标题页、主菜单、候选队伍、休整页、战斗页能点击。
- Android 返回键不会直接破坏存档。
- 退出后重开仍能读取 mobile 本地存档。

如果需要在 Windows 构建机上开 Android 模拟器、截图、自动点击，请按 [`android-emulator-smoke.md`](./android-emulator-smoke.md) 执行。

## 快速检查清单

- `D:\changeBattle` 根目录只保留 `changeBattle`、`release`、`signing`。
- `D:\changeBattle\signing` 有 keystore 和 `signing.properties`。
- 版本号、`versionName`、`versionCode` 已更新。
- 本地 `pnpm --filter @changebattle/mobile build` 通过。
- 本地 `pnpm typecheck` 通过。
- Windows `pnpm install`、mobile build、Capacitor sync 通过。
- release APK 已签名。
- APK 内有 `assets/public/data/pokemon_resource_registry.json`、`assets/public/data/item_resource_registry.json`、`assets/public/data/sprite_index_map.json`。
- APK 内有 `assets/public/assets/runtime/pokemon/` 和 `assets/public/assets/runtime/items/`。
- APK 内没有 `assets/public/assets/pokemon-showdown/`、`assets/public/assets/pokemon-pack/`、`assets/public/assets/items-pack/`、`assets/public/assets/items/`、`assets/public/assets/pokemon-custom/`。
- APK 已复制到 Windows `D:\changeBattle\release` 和 Linux `release/`。
- 真机 smoke 通过。
