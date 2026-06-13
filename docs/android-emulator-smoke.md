# Android 模拟器 SSH Smoke

这份文档记录如何从 Linux 通过 SSH 操作 Windows 构建机，启动 Android 模拟器、安装 APK、截图、点按并收集日志。目标是让 App 问题能被实际复现，而不是只靠真机口述或构建结果判断。

## 环境

Windows 构建机：

```text
win10@172.16.10.41
```

常用路径：

```text
D:\changeBattle\changeBattle   源码目录
D:\changeBattle\release        APK 和截图输出
G:\SDK                         Android SDK
D:\jdk-21.0.11                 JDK 21
```

常用工具：

```text
G:\SDK\emulator\emulator.exe
G:\SDK\platform-tools\adb.exe
G:\SDK\build-tools\35.0.0\apksigner.bat
```

当前可用 Android 14 AVD：

```text
Pixel_7_Pro_API_34
```

如需查看全部 AVD：

```bash
ssh win10@172.16.10.41 "G:\SDK\emulator\emulator.exe -list-avds"
```

## 启动模拟器

后台无窗口启动 Android 14 模拟器：

```bash
ssh win10@172.16.10.41 "G:\SDK\emulator\emulator.exe -avd Pixel_7_Pro_API_34 -no-window -no-snapshot -no-audio -gpu off -feature -Vulkan"
```

如果命令保持前台不返回，可以另开一个终端继续执行后续 adb 命令。也可以在 Windows 上手动打开 Android Studio 的 Device Manager。

等待系统启动完成：

```bash
ssh win10@172.16.10.41 "powershell -NoProfile -Command \"for (\$i=0; \$i -lt 50; \$i++) { \$v = & 'G:\SDK\platform-tools\adb.exe' shell getprop sys.boot_completed 2>\$null; if (\$v -match '1') { Write-Output 'booted'; exit 0 }; Start-Sleep -Seconds 3 }; exit 1\""
```

确认设备：

```bash
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe devices"
```

注意：不要在 SSH 脚本里用 Windows `timeout /t` 等交互命令，它在非交互环境里可能直接报错。需要等待时，在 Linux 侧分多条 SSH 命令并使用 `sleep`。

## 安装 APK

安装 release APK：

```bash
ssh win10@172.16.10.41 "cmd /c G:\SDK\platform-tools\adb.exe install -r D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk"
```

清空 App 数据并启动：

```bash
ssh win10@172.16.10.41 "cmd /c G:\SDK\platform-tools\adb.exe shell pm clear com.changebattle.mobile"
ssh win10@172.16.10.41 "cmd /c G:\SDK\platform-tools\adb.exe shell am start -n com.changebattle.mobile/.MainActivity"
```

如果只是覆盖安装并保留存档，不要执行 `pm clear`。

## 截图

保存模拟器截图到 Windows release 目录：

```bash
ssh win10@172.16.10.41 "cmd /c G:\SDK\platform-tools\adb.exe exec-out screencap -p > D:\changeBattle\release\smoke.png"
```

拉回 Linux 查看：

```bash
scp win10@172.16.10.41:/D:/changeBattle/release/smoke.png /tmp/smoke.png
```

本地打开截图或交给 Codex `view_image` 检查：

```bash
ls -lh /tmp/smoke.png
```

坐标以模拟器真实分辨率为准。当前 Pixel 7 Pro 横屏通常是：

```text
2400x1080
```

不要用截图查看器缩放后的坐标直接点按。

## 自动点按 smoke

常用命令格式：

```bash
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input tap X Y"
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input text Test"
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input keyevent ENTER"
```

历史可用点位示例，后续 UI 改动后需要重新截图校准：

```bash
# 标题页：开始新游戏
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input tap 560 635"

# 存档槽：第一个槽位
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input tap 730 580"

# 输入训练师名
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input text Test"
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input keyevent ENTER"

# 资料页下一步
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input tap 1990 865"

# 确认创建
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input tap 1815 865"

# 主菜单：开始游戏
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe shell input tap 2205 610"
```

建议每次关键点击后都截图一次，避免继续在错误页面上盲点。

## 日志

清空日志：

```bash
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe logcat -c"
```

抓取最近日志：

```bash
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe logcat -d > D:\changeBattle\release\logcat.txt"
scp win10@172.16.10.41:/D:/changeBattle/release/logcat.txt /tmp/changebattle-logcat.txt
```

常用过滤方向：

```bash
rg -i "changebattle|capacitor|chromium|console|error|exception|showdown|asset|audio|video|random" /tmp/changebattle-logcat.txt
```

如果要实时看日志，可以在单独终端执行：

```bash
ssh win10@172.16.10.41 "G:\SDK\platform-tools\adb.exe logcat"
```

## APK 校验

签名校验：

```bash
ssh win10@172.16.10.41 "G:\SDK\build-tools\35.0.0\apksigner.bat verify --verbose D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk"
```

查看 APK 内是否包含资源：

```bash
ssh win10@172.16.10.41 "powershell -NoProfile -Command \"Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::OpenRead('D:\changeBattle\release\ChangeBattle-Mobile-vX.Y.Z.apk').Entries | Where-Object { \$_.FullName -match 'runtime|resource_registry|sprite_index|audio|showdown|pokemon' } | Select-Object -First 80 -ExpandProperty FullName\""
```

至少应看到 `assets/public/data/*resource_registry.json`、`assets/public/data/sprite_index_map.json`、`assets/public/assets/runtime/pokemon/` 和 `assets/public/assets/runtime/items/` 下的文件。资源不显示时优先确认 APK 内文件存在，再确认运行时 URL。视频能显示只说明 Vite 引用进来的 `apps/desktop/src/assets` 被打包了，不代表公共 `assets/` 一定被 mobile static copy 带进 APK。

## 当前重点 smoke 场景

每个 APK 至少跑：

- 冷启动后标题页视频和图片显示正常。
- 新建存档时键盘弹出不会压扁或扭曲 `640x320` 游戏画布。
- 主菜单点击“开始游戏”不报错。
- 开局候选不是 fallback 到单一宝可梦。
- 选完队伍后应进入第 1 场前休整页，而不是直接进战斗页。
- 战斗页宝可梦、敌方、HP、指令 request 正常；点击“战斗”能打开技能菜单。
- 路由中转页不露出 Android 原生视频播放按钮。
- 退出 App 后重开能恢复休整页 checkpoint。

当前未通过的场景应同步记录到 [`app-release.md`](./app-release.md) 和根目录 `plan.md`。
