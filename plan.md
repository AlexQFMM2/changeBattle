# Battle Core Implementation Plan

按顺序推进基础对战核心。每完成一步，在标题前打 `[x]`，未完成保持 `[ ]`。

## Progress

- [x] 1. 真实宝可梦生成
- [x] 2. 伤害计算器
- [x] 3. 简单 3v3 对局
- [x] 4. 命中率与会心
- [x] 5. 变化招和复杂招式第一批
- [ ] 6. 复杂招式与变化招第二批
- [ ] 7. 异常状态第一批
- [ ] 8. 特性
- [ ] 9. 携带道具
- [ ] 10. 天气、场地、空间、撒钉等复杂效果
- [ ] 11. 单局宝可梦对战闭环

## 1. 真实宝可梦生成

状态：已完成。

目标：从模板宝可梦生成 50 级真实宝可梦实例。

已实现：

- `core/generator.py`
- `generate_pokemon_instance(template, natures, rng=None, ev_style=None)`
- `generate_random_pokemon_instance(pokemon_templates, natures, rng=None)`
- 性格从 `data/natures.jsonl` 随机选择。
- 个体值固定全 31。
- 努力值从预设模板选择，单项不超过 252，总和不超过 510。
- 能力值调用 `calculate_stats(...)`。
- 第一阶段暂不生成技能、特性、道具。

EV 模板：

- `physical_fast`: `attack=252, speed=252, hp=4`
- `special_fast`: `special_attack=252, speed=252, hp=4`
- `physical_bulk`: `hp=252, defense=252, special_defense=4`
- `special_bulk`: `hp=252, special_defense=252, defense=4`
- `balanced`: `hp=252, attack=84, defense=84, special_attack=84, special_defense=4`

验证：

```bash
python3 tests/test_core_stats.py
python3 tests/test_core_generator.py
```

## 2. 伤害计算器

状态：已完成。

目标：实现第一版伤害计算，只处理能造成常规伤害的物理/特殊招式。

已实现：

- `core/damage.py`
- `calculate_damage(attacker, defender, move, type_chart, rng=None)`
- `load_type_chart(rows)`
- `type_effectiveness(move_type_id, defender, type_chart)`
- `stab_multiplier(attacker, move_type_id)`
- 输入：攻击方实例、防御方实例、招式、随机数源。
- 支持物理/特殊攻防选择。
- 支持招式威力、等级 50、本系加成、属性克制、随机伤害波动。
- 暂不支持特性、道具、天气、场地、异常、能力等级变化。
- 变化招、固定伤害、一击必杀等先不进入伤害计算。

验证：

```bash
python3 tests/test_core_stats.py
python3 tests/test_core_generator.py
python3 tests/test_core_damage.py
```

已覆盖：

- 一般打幽灵伤害为 0。
- 电打水为 2 倍。
- 火打水为 0.5 倍。
- 本系有 1.5 倍。
- 固定 seed 伤害可复现。

## 3. 简单 3v3 对局

状态：已完成。

目标：双方 3 只宝可梦可以完成一局基础对战。

已实现：

- `core/battle.py`
- `changeBattle-cli/play.py`
- `create_battle_state(player_team, enemy_team)`
- `execute_turn(state, player_action, enemy_action, type_chart, rng=None)`
- `make_move_action(move_index)`
- `make_switch_action(target_index)`
- 支持使用招式和换人。
- 支持速度线、招式优先度、HP 扣减、濒死、强制换人、胜负判定。
- CLI 第一版敌方行动随机选择可用招式。
- 不接入完整 AI。

验证：

```bash
python3 tests/test_core_stats.py
python3 tests/test_core_generator.py
python3 tests/test_core_damage.py
python3 tests/test_core_battle.py
python3 changeBattle-cli/play.py --seed 123
```

已覆盖：

- 速度高者先动。
- 优先度高者先动。
- 换人后新宝可梦承受攻击。
- HP 为 0 后不能行动。
- 三只全部濒死判负。

## 4. 命中率与会心

状态：已完成。

目标：让基础攻击存在命中失败和会心波动。

已实现：

- 命中率读取招式 `accuracy`。
- `accuracy=None` 视为必中。
- 会心默认概率 `1/24`。
- 会心倍率默认 `1.5`。
- 固定 seed 可测试命中、miss、会心。
- `calculate_damage(...)` 返回 `hit`、`critical`、`critical_multiplier`。
- `battle` 流程中 miss 不扣血但消耗 PP。
- CLI 会显示未命中和会心提示。

验证：

```bash
python3 tests/test_core_stats.py
python3 tests/test_core_generator.py
python3 tests/test_core_damage.py
python3 tests/test_core_battle.py
python3 changeBattle-cli/play.py --seed 123
```

## 5. 变化招和复杂招式第一批

状态：已完成。

目标：在基础伤害闭环后，开始处理少量非直接伤害招式。

已实现：

- `core/move_effects.py`
- 未实现效果的变化招不进入 CLI 生成池。
- 第一批支持回复类和简单能力变化类。
- 所有招式仍必须来自宝可梦自己的 `learnsets_usum`。
- 能力等级支持 `attack`、`defense`、`special_attack`、`special_defense`、`speed`。
- 能力等级上限/下限为 `+6/-6`。
- 伤害计算读取攻击、防御、特攻、特防等级变化。
- 速度线读取速度等级变化。
- 变化招 miss 不生效但消耗 PP。
- CLI 会显示回复和能力变化。

第一批白名单：

- `Swords Dance`
- `Tail Whip`
- `Leer`
- `Growl`
- `Growth`
- `Agility`
- `Screech`
- `Recover`
- `Amnesia`
- `Soft-Boiled`
- `Milk Drink`
- `Slack Off`
- `Iron Defense`
- `Bulk Up`
- `Calm Mind`
- `Dragon Dance`
- `Roost`
- `Nasty Plot`
- `Quiver Dance`
- `Shell Smash`

验证：

```bash
python3 tests/test_core_stats.py
python3 tests/test_core_generator.py
python3 tests/test_core_damage.py
python3 tests/test_core_battle.py
python3 changeBattle-cli/play.py --seed 123
```

已覆盖：

- 剑舞后物理伤害提高。
- 降低对方防御后物理伤害提高。
- 回复招不会超过最大 HP。
- 敏捷后速度线改变。
- 变化招 miss 不改变能力等级但消耗 PP。
- 能力等级最高 clamp 到 `+6`。

## 6. 复杂招式与变化招第二批

状态：未开始。

目标：在进入异常状态前，先把常见的非异常复杂招式补到一个可玩的范围。

计划：

- 扩展 `core/move_effects.py`，把招式效果拆成更清晰的效果类型。
- 仍然采用白名单策略：实现一个效果，才允许对应招式进入生成池。
- 固定伤害类：`Seismic Toss`、`Night Shade` 等，按等级或固定数值结算。
- 多段攻击类：2-5 次、固定 2 次，伤害日志记录每段命中和总伤害。
- 吸血类：根据造成伤害回复 HP，例如 `Absorb`、`Giga Drain`。
- 反伤/自伤类：例如舍身类 recoil，命中后按伤害比例扣自己 HP。
- 先制/后制与特殊优先级已经读 `priority`，本阶段补充需要特殊处理的例外。
- 充能/蓄力第一批：先做简单的两回合招式状态，不急着处理所有例外。
- 换人类/强制换人类先做白名单，和当前强制换人流程复用。
- 保护类可以先做 `Protect` 最小版，后续再加连续使用成功率衰减。
- 回复类补充天气/条件无关的常见招式，条件复杂的先不进池。
- 未实现的变化招、固定伤害、一击必杀、多段、吸血、反伤、复制、偷取、场地类招式继续排除出 CLI 生成池。
- 每类效果至少加一个固定 seed 测试，确保伤害、PP、HP、胜负判定和日志一致。

暂缓到后续阶段：

- 异常状态相关招式。
- 天气、场地、空间、撒钉等战场持续效果。
- 特性、道具导致的招式改写。
- 双打相关招式目标。
- AI 对复杂招式的策略选择。

## 7. 异常状态第一批

状态：未开始。

目标：在变化招和常见复杂招式基础上，加入第一批会影响行动和持续回合的异常/临时状态。

计划：

- 新增状态结构，区分主异常和临时状态。
- 主异常第一批：睡眠、麻痹、冰冻。
- 临时状态第一批：混乱、迷人。
- 睡眠/催眠：按回合计数，睡眠中大部分招式不能行动。
- 麻痹：降低速度，并有概率无法行动。
- 冰冻：有概率解冻，冰冻中不能行动。
- 混乱：有概率自伤或正常行动。
- 迷人：有概率无法行动。
- 加入少量能施加这些状态的招式白名单。
- 固定 seed 可测试状态命中、行动阻断、回合消耗和解除。
- 暂不做烧伤、中毒、剧毒、畏缩、束缚等，后续再扩展。

## 8. 特性

状态：未开始。

目标：开始为真实宝可梦生成并应用合法特性。

计划：

- 实例生成开始选择合法特性。
- 特性只能来自模板中的普通特性/隐藏特性。
- 第一批只实现少量高影响特性。
- 未实现特性可以显示但不生效，并记录在 battle log。

## 9. 携带道具

状态：未开始。

目标：开始为真实宝可梦生成并应用携带道具。

计划：

- 实例生成开始选择合法可携带道具。
- 第一批只实现少量通用道具。
- 未实现道具可以显示但不生效。

## 10. 天气、场地、空间、撒钉等复杂效果

状态：未开始。

目标：引入战场状态。

计划：

- 新增 battle field 状态。
- 支持天气、场地、戏法空间、隐形岩等持续效果。
- 等基础对局稳定后再实现。

## 11. 单局宝可梦对战闭环

状态：未开始。

目标：CLI 接入 `core`，完成一局可玩的 3v3 对战。

计划：

- 随机生成双方 3 只宝可梦。
- 玩家选择技能或换人。
- 敌方随机行动。
- 打到胜负结束。
- 输出战斗日志。

## Defaults

- 默认规则池：Gen7 / Ultra Sun。
- 默认等级：50。
- 第一版 IV：固定全 31。
- 第一版特性、道具、技能：按阶段逐步加入，不提前实现。
- 每一步完成后补测试，并更新本文件勾选状态。
