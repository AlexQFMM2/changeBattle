# ChangeBattle V2 0.1.26 Beta Release Notes

```text
version: 0.1.26
branch:  v2
channel: beta/debug
tag:     desk-debug-v0.1.26
date:    2026-07-22
```

GitHub Release:

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.26
```

完整包资产：

```text
Desktop portable:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.26/ChangeBattle-V2-Desk-portable-debug-v0.1.26.zip

Android debug APK:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.26/ChangeBattle-V2-Android-debug-v0.1.26.apk
```

线上 beta 更新：

```text
latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/
```

## 主要变化

- 按新版本重新发布 0.1.25 后续热修，避免同版本覆盖线上 beta。
- 修复正式房间休整训练结果黑屏：room 模式使用 V5 小 result contract，不再伪造或读取 V4 `result.run.restRunSnapshot`。
- 对齐正式 room V5 休整规则：训练自习、商店出货/补货、重随随机由服务端权威计算，`commandId` 只用于幂等，不参与玩法随机。
- 修复离线 V5 对手 NPC 立绘：正式 room 战斗页优先使用服务端 participant canonical visual，不再把头像小图误当对手战斗立绘。
- 修复战斗提交失败后 UI 停在“提交中”：失败会显示 `提交失败：...` 并清除 busy。
- 修复投降提交失败仍继续进入结算流：失败时留在战斗页，恢复投降提交状态，不做假结算。
- 修复休整“打听/解锁情报”异常时无明确提示的问题。
- 保持正式 room C/S 红线：response 继续是 scoped view、小 result、battle summary、final summary，不恢复 `formalRun/restRunSnapshot` 传输。

## 校验摘要

- `package.json.version = 0.1.26`
- `latest.json.version = 0.1.26`
- Desktop zip SHA256: `TBD after build`
- Android APK SHA256: `TBD after build`
- API typecheck / Web typecheck / `git diff --check` 需通过。
- GitHub Actions `Release Debug Desktop` 需通过，并生成 `changebattle-beta-update-metadata-v0.1.26`。
- Android debug APK 由 Windows builder 构建后上传同一个 GitHub Release。

## 注意事项

- 这是 beta/debug 版本，不是 stable 覆盖发布。
- Android 当前仍是 debug APK，没有桌面端同款增量更新机制。
- 公共图片、音频、sprites/fx 继续走 `https://assets.65h26i.top/beta/`。
- Desktop 离线服务使用本机 Battle API + MemoryRedisLike，不恢复旧本地正式流程；应用重启后未结算离线 room 不恢复。
