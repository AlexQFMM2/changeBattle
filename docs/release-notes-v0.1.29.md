# ChangeBattle V2 0.1.29 Beta Release Notes

```text
version: 0.1.29
branch:  v2
channel: beta/debug
tag:     desk-debug-v0.1.29
date:    2026-07-27
```

GitHub Release:

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.29
```

完整包资产：

```text
Desktop portable:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.29/ChangeBattle-V2-Desk-portable-debug-v0.1.29.zip
```

线上 beta 更新：

```text
latest.json: https://65h26i.top/changebattle-beta/latest.json
download:    https://65h26i.top/changebattle-beta/
```

## 主要变化

- 修复战斗页没有背景音乐的问题。BGM 播放引擎现在跨首页、休整、转场和战斗路由持续挂载，控制按钮隐藏时不再销毁音频实例。
- 官方 V5 房间直接使用战斗/休整 scoped view 中的权威 `npcProfile.isBoss` 判断 Boss 音乐；合作模式会检查全部远端 NPC。
- 恢复历史战斗背景规则：冠军固定使用冠军舞台，其余训练家从另外 9 张背景中按 seed、轮次、trainer ID、队伍流派和强度稳定选择。
- V5 battle scoped view 现在保留 NPC 的 `trainerId`、`trainerType`、`isBoss`、AI 和生成信息；官方 Redis 与 Desk `MemoryRedisLike` 使用同一背景和 Boss 判断逻辑。
- 战斗技能动画预览沿用当前战斗背景，不再固定显示冠军舞台。

## 校验摘要

- `package.json.version = 0.1.29`
- Desktop zip SHA256：pending GitHub Actions。
- Core 背景选择器测试、API/Web/Desktop typecheck、Desktop production build、IPC bundle 和 renderer asset 检查已通过。
- 正式游戏 smoke 已验证 V5 battle view 保留权威 NPC profile、非冠军不使用冠军舞台、同一 run/round 背景幂等。
- Desk 离线 HTTP smoke 已覆盖 `singles/doubles/coop × standard/gen7/gen8/gen9` 共 12 条完整流程；每条流程均完成 starter、prepare-round、prepare-battle 并进入 `running`。

## 注意事项

- 这是 beta/debug Desktop 版本，不覆盖 stable 通道。
- Android debug APK 本轮不重新构建，当前 Android 基线仍为 0.1.26。
- 公共图片、音频、sprites/fx 继续走 `https://assets.65h26i.top/beta/`，不进入 Desktop 增量对象池。
- 0.1.28 客户端可以通过 beta 内容哈希对象池增量更新到 0.1.29。
