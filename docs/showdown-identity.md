# Showdown Identity

这份文档记录 ChangeBattle 如何在本地队伍、整局 NPC 预生成数据、Pokemon Showdown 队伍和战斗结束回写之间保持宝可梦身份稳定。

## 核心定义

- `showdown_id`：ChangeBattle 宝可梦对象自己的稳定身份。它跟随宝可梦对象移动，不跟随槽位。
- `PokemonSet.pokeball`：写入 Pokemon Showdown 的传输字段。进入对战打包前必须等于 `showdown_id`。
- Showdown `ident`：协议里的展示标签，例如 `p1: Charizard`。它不能作为唯一身份，因为同名、同物种和形态变化都可能冲突。
- 对战内状态提交必须使用 `side + showdown_id`。如果事件缺少可靠身份，只能展示文本，不应猜测更新当前 active 的 HP、异常、替身或濒死状态。

`showdown_id` 使用 Showdown 支持的合法球种 id。当前共享池为 `SHOWDOWN_ID_POOL`，只要求在同一支队伍内唯一。

## 玩家身份池

每个 run 保存一个玩家身份池：

```ts
showdown_id_pool: {
  available: string[];
  used: string[];
}
```

规则：

- 开始挑战时，玩家队伍 raw/display/state 三份数据都写入同一个 `showdown_id`。
- 首发调整、排序、技能调整、携带道具调整、性格/特性/个体/努力重置都不改变 `showdown_id`。
- 新宝可梦进入玩家队伍时，从 `available` 队首取一个新 id。
- 被换出的玩家宝可梦，其旧 id 放回 `available` 队尾。
- `raw.showdown_id`、`raw.pokeball`、`display.showdown_id`、`state.showdown_id` 必须保持一致。

这套池只管理玩家当前 run。NPC 的 `showdown_id` 不进入玩家池。

## 整局 NPC 预生成

开始挑战后一次性生成整局 `planned_battles`，每个条目保存：

```ts
{
  battle_no,
  route_type,
  route_stage,
  route_route,
  generation_stage,
  enemy_team_pool_id,
  enemy_trainer,
  enemy_raw,
  enemy_display,
  battle_background
}
```

`startNextBattle()` 只按 `battle_no` 读取预生成条目，不再临场重新随机 NPC、队伍或背景。

NPC 队伍同样写入 `showdown_id`，但只要求该 NPC 队伍内唯一。普通 NPC、Gym、Elite4、Champion 都遵守同一结构。若指名挑战或 reroute 明确改变后续 Boss，需要刷新对应 planned battle，而不是在开战时临时替换。

## Showdown Side 识别

Desk 单机目前通常会把玩家队伍写入 Showdown `p1`，但业务逻辑不能依赖这个默认值。

战斗启动后，服务层读取 Showdown request 中双方 `side.pokemon[].pokeball`，并与本地玩家队伍做匹配：

- 优先用 `pokeball/showdown_id + species/details` 匹配。
- 若 `p1` 匹配玩家队伍，则 `playerSide = "p1"`、`enemySide = "p2"`。
- 若 `p2` 匹配玩家队伍，则 `playerSide = "p2"`、`enemySide = "p1"`。
- 若双方分数相同或都无法确认，报明确调试错误，不静默按 p1 继续。

`choose()`、`chooseTrainerItem()`、`getPlayerState()`、`syncPlayerState()`、敌方 AI 选择和 `request.wait` 自动推进，都必须通过 `playerSide/enemySide` 寻址。

## Showdown 队伍写入

进入 Showdown 前统一执行：

```ts
PokemonSet.pokeball = PokemonSet.showdown_id
```

这里的 `pokeball` 不是外观球种，而是身份传输字段。后续如果要做外观球种，应新增单独字段，不复用身份字段。

## 战斗结束回写

战斗结束或休整页同步状态时：

- 优先按 `pokeball/showdown_id` 对齐本地玩家队伍。
- 只在同一个 `showdown_id` 命中时写回 HP、PP、异常、濒死和携带道具状态。
- 同名、同物种、同形态宝可梦不能按槽位或英文名猜测回写。
- 敌方记录、交换候选、Boss 图鉴可保留敌方 `showdown_id`，但这些 id 不参与玩家池管理。

## Timeline 提交规则

Timeline event 可以保留 Showdown 原始 `side/targetSide`，但状态提交必须同时确认：

- side 对应当前展示阵营；
- `source_showdown_id` 或 `target_showdown_id` 能匹配当前 active；
- 不匹配时跳过 UI 状态 mutation，只展示消息。

这条规则用于避免“敌方上一只已经倒下，旧 HP 事件套到下一只身上”的串位问题。
