# 星图天赋效果静态化迁移

## 目标

星图节点的展示信息和运行时效果必须在同一份静态 catalog 中维护。`effects` 继续作为 UI 文案，`runtimeEffects` 作为业务判断来源；业务代码仍然显式 `if/else` 处理具体效果，不引入自动效果执行器。

## 维护规则

- 新增天赋时，必须同时补齐 `effects` 和 `runtimeEffects`。
- 删除天赋时，删除 catalog 节点、对应业务 `if` 分支和测试断言。
- 不再为已删除天赋保留 `starChartHasXxx` 空 helper。
- 常驻规则不要放入星图效果，例如商店自动补货使用 `FORMAL_SHOP_AUTO_RESTOCK_ENABLED`。

## 当前效果表

| 节点 | runtimeEffects | 生效入口 | 测试覆盖 |
| --- | --- | --- | --- |
| 多多益善 I-IV | `starter_candidate_bonus: 1` | 开局候选数量 `starterCandidateCountForStarChart` | `formal-game-smoke` 候选数量 6 到 10 |
| 旅途基金 / 精英基金 / 冠军基金 | `starting_money: 500/1000/1500` | 正式流程初始金币 `formalStartingMoneyForStarChartV4` | `formal-game-smoke` 初始金币档位 |
| 专项特训 | `special_training_lock` | 休整页能力锁 UI | `formal-game-smoke` helper 与 runtime effect |
| 东亚教育 | `self_study_probability_tuning` | 训练场自习概率 | `formal-game-smoke` helper |
| 琳琅柜台 I-II | `shop_row_bonus: 1` | 商店每类商品行数 | `formal-game-smoke` 商店行数 1 到 3 |
| 随身携带 | `carry_prep_items: 3` | `FormalRoundTransitionPage -> applyFormalCarryPrepItems` | `formal-game-smoke` helper 与 runtime effect |
| 胜利分红 | `settlement_bp_dividend: 0.01` | 最终结算额外 BP | `formal-game-smoke` helper |
| 小道消息 | `opponent_preview_unlock` | 休整页对手情报 | `formal-game-smoke` helper |
| 无损交换 | `exchange_full_hp` | 胜利后交换 | `formal-game-smoke` helper |
| 精英教育 | `exchange_power_boost: 1` | 胜利后交换 | `formal-game-smoke` helper |
| 顺手牵羊 | `exchange_keep_item` | 胜利后交换 | `formal-game-smoke` helper |
| 换一送一 | `second_exchange` | 胜利后第二次交换 | `formal-game-smoke` helper |
| 医疗保险 | `medical_insurance` | 医疗保险购买入口与效果查询 | `formal-game-smoke` helper |
| 专业急诊 | `post_battle_revive_half_hp` | 战后濒死复活 | `formal-game-smoke` helper |
| 普通门诊 | `post_battle_heal_alive_quarter_hp: 0.25` | 战后非濒死治疗 | `formal-game-smoke` helper |

## 已移除效果

以下天赋不再保留 catalog 节点、导出常量或空 helper：

- 货架回声：自动补货已改为常驻规则。
- 急救背包：开局赠送好伤药已移除。
- 起航套装：开局赠送携带物已移除。
- 招式预习：开局赠送 TM 已移除。
- 熟能生巧：胜利后未濒死升级已移除。

## API 约定

- `getUnlockedStarChartRuntimeEffectsV4(chart)` 返回所有已点亮节点声明的运行时效果。
- `starChartHasRuntimeEffectV4(chart, effectId)` 用于布尔效果判断。
- `starChartRuntimeEffectValuesV4(chart, effectId)` 用于数值效果聚合。
- 旧的语义 helper 只保留给外部调用和 UI 可读性；内部实现必须读取 `runtimeEffects`，不能再硬编码节点 ID。
