# ChangeBattle V2 0.1.27 Beta Release Notes

```text
version: 0.1.27
branch:  v2
channel: beta/debug
tag:     desk-debug-v0.1.27
date:    2026-07-24
```

GitHub Release:

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-v0.1.27
```

完整包资产：

```text
Desktop portable:
https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-v0.1.27/ChangeBattle-V2-Desk-portable-debug-v0.1.27.zip
```

线上 beta 更新：

```text
latest.json: http://119.45.240.157/changebattle-beta/latest.json
download:    http://119.45.240.157/changebattle-beta/
```

## 主要变化

- 修复 Desk 纯离线模式开始战斗失败：portable 现在携带 Pokemon Showdown `sim` runtime 和 `ts-chacha20`，嵌入式 Battle API 可在 `MemoryRedisLike` 下真实创建 BattleStream。
- 正式 room 恢复历史 NPC 生成器和固定七轮赛程，不再使用训练场随机小池临时生成对手。
- 恢复菜鸟、普通、精英、馆主、四天王、冠军和反派头目的等级差、Power Profile、Boss 队伍、立绘和带 seed 的 25% 反派替换。
- AI profile 从正式 NPC 生成器贯通到 BattleStream；馆主、四天王、冠军不再统一退化为 `normal`，合作模式 `p3` 搭档使用正式精英 AI。
- 休整页和战斗页统一使用 V5 NPC 权威姓名/立绘；战斗叙事层不再重复显示当前发言训练家的站位图和对话头像。
- Desktop 增量对象池新增 `vendor/` 管理，0.1.26 beta 客户端可增量下载离线 Showdown runtime；完整 portable 同时发布到 GitHub Release。

## 校验摘要

- `package.json.version = 0.1.27`
- Desktop zip SHA256：`e591786ee11b7aa3657afcf55776f62b1f645d5bfa0a99c9eba62ba96c3b7302`（150,611,817 bytes）。
- 全仓 `pnpm typecheck`、正式游戏 smoke 和 portable Showdown runtime smoke 已通过。
- Desk 离线 HTTP smoke 已覆盖 `singles/doubles/coop × standard/gen7/gen8/gen9` 共 12 条完整流程。
- 每条流程均完成 starter、prepare-round、prepare-battle 并进入 `running`；合作模式确认 `p3 aiLevel = elite`。

## 注意事项

- 这是 beta/debug Desktop 版本，不覆盖 stable 通道。
- Android debug APK 本轮不重新构建，当前 Android 基线仍为 0.1.26。
- 公共图片、音频、sprites/fx 继续走 `https://assets.65h26i.top/beta/`，不进入 Desktop 增量对象池。
- Desktop 离线服务继续使用嵌入式 Battle API + MemoryRedisLike，不恢复旧本地正式流程。
