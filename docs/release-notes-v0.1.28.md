# ChangeBattle V2 0.1.28 Beta Release Notes

```text
version: 0.1.28
branch:  v2
channel: beta/debug
tag:     desk-debug-v0.1.28
date:    2026-07-24
```

GitHub Release:

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.28
```

完整包资产：

```text
Desktop portable:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.28/ChangeBattle-V2-Desk-portable-debug-v0.1.28.zip
```

线上 beta 更新：

```text
latest.json: https://65h26i.top/changebattle-beta/latest.json
download:    https://65h26i.top/changebattle-beta/
```

## 主要变化

- 修复正式休整页 scoped view 刷新成功后，React effect 清理与 Promise `finally` 竞争，导致“正在同步房间视图”遮罩永久残留、无法继续进入战斗的问题。
- 修复同时覆盖官方服务器和 Desk 纯离线模式；两种模式继续共享同一套 V5 scoped view 和轻量 command 客户端逻辑。
- Desk `changebattle-asset` 协议在本地缓存文件读取失败时会重新从 CDN 下载，不再直接中断资源请求。
- 资源协议异常日志现在包含完整 protocol URL、相对资源路径、CDN URL 和底层错误，避免 DevTools 只显示无法定位的 `changebattle-asset:1`。
- 延续 0.1.27 的正式 NPC 固定赛程、强度、立绘、AI profile，以及 portable Showdown runtime 修复。

## 校验摘要

- `package.json.version = 0.1.28`
- Desktop zip SHA256：`e684cbc782101dd00c7ed6fe3902641db137a21505d09666d896acb82c805076`（150,612,123 bytes）。
- Web/Desktop typecheck、Desktop production build、IPC bundle、renderer asset 和 asset resolver 检查已通过。
- Desk 离线 HTTP smoke 已覆盖 `singles/doubles/coop × standard/gen7/gen8/gen9` 共 12 条完整流程。
- 每条流程均完成 starter、prepare-round、prepare-battle 并进入 `running`；合作模式确认 `p3 aiLevel = elite`。
- 线上 CDN 的休整音乐、战斗音乐和转场视频均已验证返回 HTTP 200；官方 Battle API health 为 healthy/Redis ok。

## 注意事项

- 这是 beta/debug Desktop 版本，不覆盖 stable 通道。
- Android debug APK 本轮不重新构建，当前 Android 基线仍为 0.1.26。
- 公共图片、音频、sprites/fx 继续走 `https://assets.65h26i.top/beta/`，不进入 Desktop 增量对象池。
- 0.1.27 客户端可以通过 beta 内容哈希对象池增量更新到 0.1.28。
