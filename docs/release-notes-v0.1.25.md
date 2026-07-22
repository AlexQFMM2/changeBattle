# ChangeBattle V2 0.1.25 Beta Release Notes

```text
version: 0.1.25
branch:  v2
channel: beta/debug
tag:     desk-debug-v0.1.25
date:    2026-07-21
```

GitHub Release:

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.25
```

完整包资产：

```text
Desktop portable:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.25/ChangeBattle-V2-Desk-portable-debug-v0.1.25.zip

Android debug APK:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.25/ChangeBattle-V2-Android-debug-v0.1.25.apk
```

线上 beta 更新：

```text
latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/
```

## 主要变化

- 修复正式房间休整训练结果黑屏：room 模式使用 V5 小 result contract，不再伪造或读取 V4 `result.run.restRunSnapshot`。
- 对齐正式 room V5 休整规则：训练自习、商店出货/补货、重随随机由服务端权威计算，`commandId` 只用于幂等，不参与玩法随机。
- 修复离线 V5 对手 NPC 立绘：正式 room 战斗页优先使用服务端 participant canonical visual，不再把头像小图误当对手战斗立绘。
- 修复战斗提交失败后 UI 停在“提交中”：失败会显示 `提交失败：...` 并清除 busy。
- 修复投降提交失败仍继续进入结算流：失败时留在战斗页，恢复投降提交状态，不做假结算。
- 修复休整“打听/解锁情报”异常时无明确提示的问题。
- 保持正式 room C/S 红线：response 继续是 scoped view、小 result、battle summary、final summary，不恢复 `formalRun/restRunSnapshot` 传输。

## 校验摘要

- `package.json.version = 0.1.25`
- `latest.json.version = 0.1.25`
- Desktop zip SHA256: `4306623dbde738455f74ae4fc6cd9bd8c74a548c8098ff0b2cf93ca787284127`
- Android APK SHA256: `bfb7550a1b77bd01896fc7bcdfa2d546a2db1711ca49851de30ca25bd0973092`
- API typecheck / Web typecheck / `git diff --check` 已通过。
- `showdown-battle-core test -- --runInBand` 已通过，覆盖 AI move、AI switch、特殊系统、force switch 和 self-play smoke。
- 本地 memory Battle API 正式 room 多回合 smoke 已通过：创建房间 -> 创建对局 -> starter -> rest -> prepare battle -> 连续 `battle-choice`，服务端日志出现 `battle-ai-choice`，最终 `winner:p1`，未卡在 wait/submitting。

## 注意事项

- 这是 beta/debug 版本，不是 stable 覆盖发布。
- Android 当前仍是 debug APK，没有桌面端同款增量更新机制。
- 公共图片、音频、sprites/fx 继续走 `https://assets.65h26i.top/beta/`。
- Desktop 离线服务使用本机 Battle API + MemoryRedisLike，不恢复旧本地正式流程；应用重启后未结算离线 room 不恢复。
