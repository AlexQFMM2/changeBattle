# ChangeBattle V2 0.1.32 Beta Release Notes

version: 0.1.32
tag:     desk-debug-v0.1.32
branch:  v2

GitHub Release:

https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.32

Desktop portable:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.32/ChangeBattle-V2-Desk-portable-debug-v0.1.32.zip

Android debug APK:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.32/ChangeBattle-V2-Android-debug-v0.1.32.apk

线上 beta 更新：

latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/

## 本版重点

- 优化正式 starter 候选基础页：恢复 2x2 四技能卡布局，保留原游戏面板视觉。
- 移除基础页里的图鉴、身高、体重弱信息，把空间让给技能决策信息。
- 基础页技能卡不显示 PP，优先展示技能名、分类、类型、威力和命中；完整技能 tab 仍保留 PP。
- 组件预览补充真实技能数据，防止候选详情页空技能导致视觉回归漏检。
- 本轮只改 Web UI 展示，不改 Battle API 服务端规则和线上 API 容器。

## 验收记录

- `web typecheck` 已通过。
- `git diff --check` 已通过。
- ChromeAutomation 已在组件预览验证 2x2 技能卡展示。

## 发布边界

- 完整 Desktop zip 和 Android APK 挂 GitHub Release。
- 线上 beta 服务器只发布 `latest.json / index.html / manifests / objects`，不托管完整 zip/apk。
- 本版未改 API 服务端代码，不需要更新线上 Battle API 容器。
