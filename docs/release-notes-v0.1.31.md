# ChangeBattle V2 0.1.31 Beta Release Notes

version: 0.1.31
tag:     desk-debug-v0.1.31
branch:  v2

GitHub Release:

https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.31

Desktop portable:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.31/ChangeBattle-V2-Desk-portable-debug-v0.1.31.zip

Android debug APK:

https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.31/ChangeBattle-V2-Android-debug-v0.1.31.apk

线上 beta 更新：

latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/

## 本版重点

- 优化正式 starter 候选详情页：基础信息页直接展示 4 个技能卡，减少基础信息 / 技能标签来回切换。
- 优化休整训练场批量自习 UI：自习轮数改为左右箭头步进，限制为 1-5 轮并受当前金币可负担上限约束。
- 本轮只改 Web UI 展示和交互，不改 Battle API 服务端规则和线上 API 容器。

## 验收记录

- `web typecheck` 已通过。
- `git diff --check` 已通过。
- 用户已本地验证 UI 调整。

## 发布边界

- 完整 Desktop zip 和 Android APK 挂 GitHub Release。
- 线上 beta 服务器只发布 `latest.json / index.html / manifests / objects`，不托管完整 zip/apk。
- 本版未改 API 服务端代码，不需要更新线上 Battle API 容器。
