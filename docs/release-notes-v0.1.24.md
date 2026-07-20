# ChangeBattle V2 0.1.24 Beta Release Notes

```text
version: 0.1.24
branch:  v2
channel: beta/debug
tag:     desk-debug-v0.1.24
date:    2026-07-20
```

GitHub Release:

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.24
```

完整包资产：

```text
Desktop portable:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.24/ChangeBattle-V2-Desk-portable-debug-v0.1.24.zip

Android debug APK:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.24/ChangeBattle-V2-Android-debug-v0.1.24.apk
```

线上 beta 更新：

```text
latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/
```

## 主要变化

- 正式 room 主线完成 RunGame V5 C/S 收口：服务端权威实体化，客户端只消费 scoped view 和轻量 command。
- 正式 room 不再传输、保存、展示依赖大 `FormalGameRunV4` / `restRunSnapshot`。
- legacy `/rooms/:id/formal/*`、`syncDraft/restAction`、聚合 `rest-action` 已硬隔离为 dev/legacy 入口。
- 休整页恢复原游戏 UI，数据源改为 V5 scoped rest view。
- 修复点击“我的队伍”黑屏：旧 UI 读取队伍字段前会在 UI 边界做 V5 展示归一化。
- 修复 Desktop release 构建前置依赖，确保 `showdown-dex-core` 等包先构建。
- beta 线上下载页和 `latest.json.fullPackage.url` 指向 GitHub Release，线上服务器不托管完整 zip/apk。

## 校验摘要

- `package.json.version = 0.1.24`
- `latest.json.version = 0.1.24`
- Desktop zip SHA256: `95be63bb56f532bbd91d7e3e09d87ab9a7bbf0f5a291046a2dcb565b2486d209`
- Android APK SHA256: `36d12114ca42f184c3d7ecf83362f4cedda15533a241a91c19e5dbe6a42afcc0`

## 注意事项

- 这是 beta/debug 版本，不是 stable 覆盖发布。
- Android 当前仍是 debug APK，没有桌面端同款增量更新机制。
- 公共图片、音频、sprites/fx 继续走 `https://assets.65h26i.top/beta/`。
- Desktop 离线服务使用本机 Battle API + MemoryRedisLike，不恢复旧本地正式流程。
