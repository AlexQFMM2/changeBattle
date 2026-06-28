# Battle V4 Battle Preference Plan

## Summary

对局偏好按 V1 思路作为全局 profile 配置保存，并在创建 V4 runGame 时固化到 run 内。固化后的 run 配置是正式游戏里队伍生成、特殊系统、神战和战斗背包的约束来源；后续修改全局偏好不追溯影响已经创建的 run。

## Current State

- V2 新增 `BattlePreferenceV4`，包含地区偏好、规则预设、推导出的特殊系统、神战开关、战斗背包开关。
- 主菜单新增 `对局偏好` 页面入口，页面包含 `地区专爱 / 战斗系统 / 神战 / 战斗背包` 四个页签。
- `UserProfileV2` 保存全局偏好；旧 profile normalize 时自动补默认值。
- 新建 run 时从 profile 拷贝偏好，并同步 `scenario.ruleSet`、系统道具和玩家 `bag.battleBagEnabled`。
- 战斗页读取 run 内偏好；关闭战斗背包时隐藏背包入口并阻止打开。

## Rules

- 地区偏好只允许 1-9 世代，至少保留 3 个地区。
- 系统偏好第一版跟随规则预设，不支持跨代任意混开：
  - `standard`：无特殊系统。
  - `gen7`：Mega + Z 招式。
  - `gen8`：极巨化。
  - `gen9`：太晶化。
- `enabledBattleSystems` 始终由 `ruleSet` 推导，不作为独立真实来源。
- 神战和地区偏好当前先存储并固化；正式队伍生成器接入时再转成物种过滤条件。

## Next Steps

- 正式游戏创建入口接入后，确保它使用 profile 偏好创建 run。
- 队伍生成器正式写入 NPC/玩家队伍时，读取 run 内 `allowedGenerations` 和 `legendaryBattle`。
- 如果未来需要混合特殊系统，再新增独立 ruleset/Showdown format 策略，而不是直接让 UI 开关绕过 `ruleSet`。
