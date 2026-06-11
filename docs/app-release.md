# Android App Release 流程

这份文档记录 ChangeBattle Mobile Android APK 的生成流程。它只服务自用 Android 安装包，不上架，不做 iOS。Desk 桌面端仍按 [`windows-desktop-release.md`](./windows-desktop-release.md) 发便携 zip。

## 当前边界

当前 `apps/mobile` 已经是可构建的 Capacitor Android 工程，能生成 APK 并打开真实 React UI。

重要限制：

- 当前 mobile bridge 仍是本地 smoke/scaffold，完整 Desk game runtime / Showdown 战斗服务还没有迁移到移动端。
- APK 可用于安装体验、横屏触摸、资源路径、启动页、签名和 bridge 形态验证。
- 完整本地游玩需要后续把 Electron main 中的游戏业务 API 抽成跨平台 runtime。

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
versionName: 0.6.2
versionCode: 602
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
0.7.0 -> versionCode 700
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
- 标题页、主菜单、候选队伍、战斗页能点击。
- Android 返回键不会直接破坏存档。
- 退出后重开仍能读取 mobile 本地存档。

## 快速检查清单

- `D:\changeBattle` 根目录只保留 `changeBattle`、`release`、`signing`。
- `D:\changeBattle\signing` 有 keystore 和 `signing.properties`。
- 版本号、`versionName`、`versionCode` 已更新。
- 本地 `pnpm --filter @changebattle/mobile build` 通过。
- 本地 `pnpm typecheck` 通过。
- Windows `pnpm install`、mobile build、Capacitor sync 通过。
- release APK 已签名。
- APK 已复制到 Windows `D:\changeBattle\release` 和 Linux `release/`。
- 真机 smoke 通过。
