# Pokemon Power Profile Distribution

## Summary

本文定义 V2 正式游戏的数值强度分布。V2 不沿用 V1 `tier1/tier2/tier3/tier4/champion` 命名，统一使用 `powerProfile`：

```ts
type PokemonPowerProfileV4 = "rookie" | "normal" | "elite" | "boss" | "champion";
```

`powerProfile` 决定等级、IV/EV 初始生成区间、性格策略和基础养成强度。每只宝可梦实例会保存自己的 `powerProfile`、`ivTotalCap`、`evTotalCap` 作为成长记录；随机重分配按当前 IV/EV 实际总和重新分配，不再用旧数值等级 cap 截断当前成长。训练场自习和药剂可以提高当前数值，但仍遵守宝可梦规则上限：IV 单项 31，EV 单项 252，EV 总和 510。携带道具不写死在数值档里，而由 owner 与正式游戏规则决定：

- `owner=player`：生成宝可梦默认不携带道具。
- `owner=npc`：可按 NPC 类型、道具池、规则系统和正式游戏配置携带道具。

`speciesRank` 和 `powerProfile` 可以独立组合。例如 `speciesRank=rank6` 的准神可以套 `powerProfile=rookie`，表示物种很强但培养较差；`speciesRank=rank3` 的战术物种也可以套 `powerProfile=boss`。

## Profiles

### rookie

- 目标：菜鸟、低压普通敌人、早期低强度候选。
- 等级：Lv 45-50。
- IV 总量上限：50-90。
- EV 总量上限：100-200。
- 性格：偏中性，优先 `Serious`，也允许少量随机性格。
- 玩家生成：不携带道具。
- NPC 生成：默认不携带关键道具，可按低阶普通道具池少量携带非系统道具。

### normal

- 目标：一般 NPC、普通战斗主体、玩家初始中档候选。
- 等级：Lv 49-53。
- IV 总量上限：80-120。
- EV 总量上限：80-280。
- 性格：随机性格。
- 玩家生成：不携带道具。
- NPC 生成：允许携带普通战斗道具或消耗类道具。

### elite

- 目标：精英 NPC、高阶普通敌人、低阶 boss 的普通队员。
- 等级：Lv 52-55。
- IV 总量上限：110-150。
- EV 总量上限：260-400。
- 性格：优先使用 Showdown set 性格；没有时随机。
- 玩家生成：不携带道具。
- NPC 生成：允许携带战斗道具；可按规则系统配置 Mega/Z/极巨/太晶资源。

### boss

- 目标：馆主、四天王、邪恶头领的核心队员。
- 等级：Lv 56-60。
- IV 总量上限：140-180。
- EV 总量上限：390-510。
- 性格：优先使用 Showdown set 性格；没有时随机。
- 玩家生成：不携带道具。
- NPC 生成：允许携带高质量战斗道具；boss 队伍可拥有对应规则系统的关键资源。

### champion

- 目标：冠军、邪恶头领王牌、最终高压 boss。
- 等级：Lv 61-65。
- IV 总量上限：186。
- EV 总量上限：510。
- 性格：优先使用 Showdown set 性格；没有时随机。
- 玩家生成：不携带道具。
- NPC 生成：允许携带高质量战斗道具；可使用规则系统允许的最高规格配置。

## Owner Item Rule

V2 正式游戏把“数值强度”和“携带道具”拆开。

玩家侧：

- 随机生成、交换获得、奖励获得的宝可梦默认不自动生成携带道具。
- 玩家要携带道具，必须通过背包系统、重铸系统或休整设施显式获得。
- 这样可以避免随机生成绕过 V2 背包生命周期。

NPC 侧：

- NPC 宝可梦可以在生成时拥有携带道具。
- NPC 携带物不需要创建玩家背包实例。
- Mega 石、Z 纯晶、极巨手环、太晶珠等系统资源必须按 `battlePreference.ruleSet` 和正式游戏规则生成。
- gen7 环境必须保障 NPC 队伍至少有 1 个可 Mega 宝可梦并持有映射 Mega 石；Z 纯晶专属 Z 优先，并在需要时补齐 `requiredMoveId`。
- gen8 环境 NPC 默认获得极巨手环；gen9 环境 NPC 默认获得太晶珠。
- 交换时 Mega 石和 Z 纯晶不随宝可梦带走。

## Distribution Usage

正式游戏第一版推荐用法：

- 菜鸟 NPC：主要使用 `rookie`。
- 一般 NPC：主要使用 `normal`，少量 `rookie` 或 `elite`。
- 精英 NPC：主要使用 `elite`。
- 馆主：队伍核心使用 `boss`，补位可用 `elite`。
- 四天王：主要使用 `boss`，王牌可用 `champion`。
- 冠军：主要使用 `champion`。
- 邪恶头领：按剧情强度在 `boss` 与 `champion` 间选择。

玩家初始分配最高只到 `elite`；`boss` 与 `champion` 主要由训练场自主学习或高强度 NPC 使用。各阶段区间允许重叠，下限不需要高于上一阶段上限；阶段提升代表上限空间变大，而不是必定碾压上一档。

训练场自主学习使用 `30% / 60% / 10%` 作为贪玩、普通自习、认真学习的基础概率，但最终概率会受到性格权重影响；后续星图偏移也可以叠加到同一个权重入口。训练后的等级按事件直接增加，不强制回填到新 `powerProfile` 的生成等级区间。

7 场正式游戏的具体 `powerProfile` 分布由 NPC/队伍生成器负责，不在本文硬编码。本文只定义档位语义、实例上限和 owner 道具边界。

## Migration Notes

- V1 的数值档同时绑定等级、IV、EV、性格和携带道具；V2 拆开为 `powerProfile` 与 owner item rule。
- V1 旧字段只作为迁移输入或兼容说明，不作为 V2 新模型命名。
- 后续实现时需要用纯函数测试锁定 IV/EV 总量、等级范围、owner 道具分离和 Showdown set 性格继承策略。
