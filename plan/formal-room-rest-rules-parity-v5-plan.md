# Formal Room V5 休整规则对齐修复计划：训练 / 随机 / 商店

## Summary

正式 room 主线已经切到服务端 `RunGameV5` + scoped view + 轻量 command。当前暴露出的新问题不是“前端在算规则”，而是 V5 后端休整规则里仍有临时简化实现：训练自习、商店出货/补货、重随等随机逻辑没有完全复用旧版成熟规则，并且部分玩法随机把客户端 `commandId` 放进 seed，导致前端协议或点击实现变化会影响随机结果。

本计划目标是把正式 room V5 的休整玩法规则对齐旧版体验，同时保持 C/S 红线：前端只提交玩家意图，后端独立计算结果；不恢复 `formalRun/restRunSnapshot` 传输；不让客户端 commandId 影响玩法随机。

## Root Cause

已确认的关键差异：

- V4 自习 seed：`run.seed + node.id + lessonRoll + selfStudyRoll + pokemonId`。
- V5 自习 seed：`run.config.seed + currentNodeId + commandId + pokemonId`。
- V4 商店初始出货：按星图行数、当前回合、金币、队伍血量/异常/PP/持有物空位/物攻特攻倾向等上下文加权随机。
- V5 商店初始出货：`createBasicRestShopV5()` 固定基础 catalog。
- V4 商店补货：购买后用 `createFormalShopSlot()` 和完整 `createFormalShopRestockContext()` 自动补同一 slot。
- V5 商店补货：目前只做了简化补货，不再售罄，但没有完整权重上下文。
- V4 重随：使用服务端 run seed、node、pokemon、时间/服务端状态计算，并重算 HP 比例。
- V5 重随：使用 `commandId` 参与 seed，随机稳定性和客户端协议耦合。

核心红线：`commandId` 只能用于幂等，不允许参与训练收益、商店出货、重随、交换候选等玩法随机。

## Key Changes

- **抽纯规则层**
  - 新增或迁移一组后端纯规则 helper，建议放在 API 内部 rule module 或后续下沉到 `packages/changebattle-v2-core`：
    - `buildFormalTrainingRuleContext()`
    - `applyFormalSelfStudyRule()`
    - `applyFormalMoveLessonRule()`
    - `buildFormalShopRestockContextFromV5()`
    - `createFormalShopSlotFromRuleContext()`
    - `createFormalRestShopFromRuleContext()`
    - `rerollFormalStatsWithinTotalFromRuleContext()`
  - 规则 helper 输入必须是小型上下文 DTO，不接受完整 `FormalGameRunV4` 作为正式 room 权威输入。
  - V4 legacy 可以继续包装完整 run 调用这些 helper；V5 正式 room 从实体组装小 context 后调用同一套规则。

- **训练规则对齐**
  - `applyTrainingLessonV5()` 保持实体级写回，只替换内部规则计算。
  - 自习收益复用 V4 逻辑：事件 `normal/focused/playful`、动态 IV/EV gain、稳定区间星图、性格风险星图、HP ratio 重算。
  - 自习 seed 改为服务端稳定字段：`run.config.seed / currentNodeId / lessonRoll / selfStudyRoll / pokemonId`，不得包含 `commandId`。
  - 招式学习继续由后端校验 move pool、已学会、替换槽、锁定槽；结果只返回小 result + rest scoped view。
  - 训练完成后只更新目标 `PokemonInstance`、`Player.money`、训练状态 roll、小型 coinLog。

- **商店出货和补货对齐**
  - 删除正式 room 主线中的固定 `createBasicRestShopV5()` 逻辑。
  - prepare round 时从 V5 实体构造 shop context，按旧版 `FORMAL_SHOP_CATEGORY_ORDER`、星图 rows、pending settlement、队伍压力和权重生成商店。
  - `shop.buy` 成功后按同一 category/slot 自动补货，复用完整权重上下文；不能只按 pool hash 简化随机。
  - 补货 seed 使用服务端稳定 roll：`run seed / nodeId / category / slot index / shop restock roll`，不得使用 `commandId`。
  - 购买失败、金币不足、背包满不改变商店、不推进 restock roll。

- **重随规则对齐**
  - `rerollSelfPokemonStatsV5()` 继续只修改目标 `PokemonInstance` 和 `Player.money`。
  - 重随费用复用旧版 `formalRestPokemonStatRerollCost()`。
  - 重随随机复用旧版 `rerollStatsWithinTotal()` 语义，并保留锁定属性、总值不变、cap 限制、HP ratio 重算。
  - seed 使用服务端稳定字段：`run seed / nodeId / pokemonId / part / stat reroll roll`，不得使用 `commandId`。

- **交换规则复查**
  - 核对 V5 `pokemon.exchange` 是否完整覆盖旧版：
    - 交换次数、二次交换费用。
    - 灵魂伴侣保护。
    - `exchange_full_hp`。
    - `exchange_power_boost`。
    - `exchange_keep_item`。
    - 候选来源和上一场对手队伍。
  - 若发现候选生成或强化仍依赖 V4-shaped run，拆成小 context helper；正式 V5 不回传/保存完整 run。

- **随机与幂等边界**
  - `commandId` 只用于：
    - 重复请求复用已提交结果。
    - commandLog key。
    - 小型 idempotency record。
  - `commandId` 不用于：
    - 训练收益。
    - 商店初始出货。
    - 商店补货。
    - 重随分布。
    - 交换候选。
    - NPC 队伍/赛程生成。
  - 同一个 gameplay state 下，前端按钮实现、路由、重试策略、commandId 生成方式变化，不应改变玩法随机。

## Redlines

- 正式 room 主线不得恢复：
  - `formalRun`
  - `restRunSnapshot`
  - `formalRunDraft`
  - `syncDraft`
  - 聚合 `rest-action`
  - 客户端保存或上传大 run/view
- 正式 room rule helper 不得把完整 `FormalGameRunV4` 当权威输入。
- 玩法随机不得包含 `commandId`、客户端时间、浏览器本地状态。
- 前端不得计算训练收益、商店出货、补货、重随结果；只能提交玩家选择。
- 失败/超时不提交本地权威状态，只保留提示。
- ChromeAutomation 休整验收必须覆盖成功路径和失败路径。若自然局初始金币为 0 或状态不足，必须通过主页/设置里的测试模式或测试种子/测试资金进入可支付状态，再点击训练、商店、重随等成功路径；不得只因金币不足就把 UI 验收降级为失败路径。

## Checklist

- [x] 扫描并列出 V5 休整规则中所有 `commandId` 参与随机的地方。
- [x] 抽出训练自习纯规则 helper：`apps/api/src/formalRestRules.ts`。
- [x] V5 `training.apply` 自习改用服务端 roll seed，复用 V4 事件/收益/星图逻辑。
- [x] 增加训练随机边界测试：同 gameplay state、不同 `commandId` 下自习结果一致。
- [x] 抽出商店 restock context 小 DTO。
- [x] V5 prepare round 商店改为按完整权重生成，不再固定 catalog。
- [x] V5 `shop.buy` 自动补货改为完整权重补货。
- [x] 增加商店随机边界测试：同 gameplay state、不同 `commandId` 下补货结果一致。
- [x] V5 重随改用服务端 roll seed，移除 `commandId` seed。
- [x] 增加重随随机边界测试：同 gameplay state、不同 `commandId` 下重随结果一致。
- [x] 复查并修正交换规则与星图 flag：半血/满血、保留道具、精英教育、服务端 exchange roll 已补齐。
- [x] 增加 redline 测试：玩法随机 seed 不包含 `commandId`。
- [x] API smoke 覆盖训练 2-3 次、购买补货、重随、交换、battle/finalize 红线。
- [x] ChromeAutomation 覆盖训练/商店/重随/刷新恢复/战斗闭环；交换节点未必每轮出现，后续可加固定种子专项验收。
- [ ] ChromeAutomation 补一次测试模式/测试资金下的休整成功路径：自习 2-3 次、商店购买并自动补货、重随成功、治疗成功或已满提示、背包使用/携带/卸下。

### 2026-07-20 Implementation Notes

- 新增 `formalRestRules.ts`，正式 V5 从小 DTO 计算训练、商店、重随、交换规则；不接受完整 `FormalGameRunV4` 作为正式 room 权威输入。
- `commandId` 仅用于幂等和 commandLog。训练、商店补货、重随、交换都改为 `run seed + nodeId + 服务端 roll + 目标实体` 组合。
- 商店初始出货和购买补货改为 V4 category order、星图 rows、队伍压力/PP/异常/持有物空位等权重上下文。
- 交换对齐旧版体验：默认半血并清状态/丢道具；星图 flag 下可满血、保留道具、精英教育强化。V5 仍保留实体 `pokemonId` 稳定，不复用 V4 的 `Date.now()` local id。
- 已通过：`api/web/desktop/mobile/showdown-battle-core typecheck`、`api test:formal-game`、`git diff --check`、名字级 redline。`restRunSnapshot` 的剩余命中集中在 legacy V4、测试和非 room 兼容路径，正式 scoped C/S 响应未恢复大对象。
- ChromeAutomation 已覆盖自然局 0 金币下的失败提示和完整战斗/结算闭环；但这不能替代成功路径。后续休整 UI/规则验收必须先打开测试模式或测试资金，确保训练、商店购买/补货、重随等成功提交路径都被实际点击。

## Test Plan

### Static

```bash
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/mobile typecheck
pnpm --filter @changebattle-v2/showdown-battle-core typecheck
pnpm --filter @changebattle-v2/api test:formal-game
git diff --check
```

### Redline Scan

```bash
rg "commandId.*seed|seed.*commandId|\\$\\{commandId\\}" apps/api/src/runGameV5.ts apps/api/src -g '*.ts'
rg "createBasicRestShopV5|restockPurchasedShopSlotV5|applySelfStudyPokemonPatchV5|rerollStatsKeepingTotalV5" apps/api/src/runGameV5.ts
rg "formalRunDraft|syncDraft|rooms\\.matches\\.commands\\.restAction|view\\.formalRun|restRunSnapshot" apps/api/src apps/web/src -g '*.ts' -g '*.tsx'
```

允许命中必须是 legacy/dev-only、测试断言、或已明确迁移待删的旧 helper；正式 room 主线命中继续修。

### API Smoke

- 创建 room -> 创建 match -> ready/start -> starter -> prepare round -> rest scope。
- 连续自习 2-3 次：
  - 每次只修改目标 `PokemonInstance`、`Player.money`、训练 roll、coinLog。
  - selfStudyRoll 单调递增。
  - 同 commandId 重试不重复扣钱、不重复增益。
  - 新 commandId 只代表新一次训练，不改变上一条已提交结果。
- 商店：
  - 初始出货按星图 rows 和局面上下文生成。
  - 购买成功后同 slot 自动补货。
  - 金币不足/背包满不补货、不推进 roll。
  - 连续购买同 category 多次不会出现固定三件循环。
- 重随：
  - 锁定属性不变。
  - 总值保持。
  - HP 按新 maxHp ratio 重算。
  - 同 commandId 重试幂等。
- 交换：
  - 没有上一场胜利时不可交换。
  - 胜利后候选为上一场对手。
  - 二次交换、保留道具、满血、强化 flag 按星图生效。
- 所有响应不包含 `formalRun/restRunSnapshot/runGameV5/playersById/pokemonById/bagsById/itemInstancesById`。

### ChromeAutomation 验收

- 启动本地 Battle API + Redis 或 memory API，启动 Web dev。
- 验收开始前若自然局金币不足，先在主页打开测试模式或使用测试种子/测试资金，保证休整页至少能支付训练、商店购买、重随、治疗中的成功路径。失败路径要测，但不能替代成功路径。
- 完整流程：
  1. 主页 -> 创建房间 -> 创建单局对局。
  2. starter -> rest。
  3. 自习训练 2-3 次，检查结果面板、金币、队伍数值变化。
  4. 招式学习一次，检查替换槽和结果面板。
  5. 商店购买同一类多次，确认购买后自动补货且 UI 不售罄卡死。
  6. 重随一次，检查锁定属性和扣钱。
  7. 若有可交换场景，交换一次；否则记录“当前节点不可交换”为预期。
  8. 刷新 rest，确认从 `GET view?scope=rest` 恢复。
  9. battle -> 投降或胜利 -> settlement -> 返回房间。
- Network 审计：view/command 响应无大对象字段。
- localStorage 审计：无 room run/view 大缓存。
- 截图留档：rest、训练结果、商店补货、重随面板、battle、settlement。

## Assumptions

- 本轮不恢复 V4 大对象，不做兼容兜底。
- 旧 V4 逻辑可以作为规则来源，但必须抽成小 context 纯函数供 V5 使用。
- 正式 room 权威仍是 `RunGameV5`，Redis 第一版仍可单 key 保存权威 run；本计划只修玩法规则和传输边界。
- 如果旧版本身存在明显不合理随机，可以另开平衡计划；本轮默认先对齐旧版成熟体验。
