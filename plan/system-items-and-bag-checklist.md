# System Items And Bag Checklist

## Count Verification

初始范围：

```txt
Default system item definitions = 4
Bag model batch = 1
Dex virtual category batch = 1
Special loadout batch = 1
Showdown compile batch = 1
Battle V4 request-driven UI batch = 1
Diagnostics batch = 1
```

本清单追踪系统战斗道具、道具实例体系、统一背包组件，以及已经接入的恢复/训练/TM 道具效果。商店经济、系统重铸和完整携带道具触发规则仍在后续批次追踪。

## Current Batch: Bag Instance + Training UI + Rest UI + Battle Bag Effects

- [x] `BagStateV4` 采用 `{ maxSize, items, battleBagEnabled }`，默认容量 50。 | priority: P0 | source: training-model | adapter: native | notes: implemented + typecheck
- [x] 训练配置页新增背包管理，可添加 Dex 道具实例。 | priority: P0 | source: training-config-ui | adapter: native | notes: non-stack item instances + typecheck
- [x] 训练配置页支持删除道具实例。 | priority: P0 | source: training-config-ui | adapter: native | notes: non-stack item instances + typecheck
- [x] 训练配置页支持编辑 `cost/effectRound/getRound/maxUseCount/useCount/canSale`。 | priority: P1 | source: training-config-ui | adapter: native | notes: instance fields + typecheck
- [x] 训练配置页支持保存 `battleBagEnabled` 开关。 | priority: P1 | source: training-config-ui | adapter: native | notes: placeholder switch + typecheck
- [x] 训练配置页容量按 `当前数量/最大容量` 显示并阻止超容量添加。 | priority: P0 | source: training-config-ui | adapter: native | notes: maxSize 50 + typecheck
- [x] 训练配置页支持生成测试背包，覆盖恢复、PP、树果、训练、TM、携带和系统道具。 | priority: P1 | source: training-config-ui | adapter: native | notes: expanded seed items
- [x] 切换规则或 normalize 时按 ruleSet 补发默认系统战斗道具。 | priority: P0 | source: rule-defaults | adapter: native | notes: gen7/gen8/gen9/standard + typecheck
- [x] 休整页背包从 count 展示切换为实例列表。 | priority: P0 | source: rest-ui | adapter: native | notes: non-stack item detail + typecheck
- [x] 休整页详情展示完整实例字段。 | priority: P0 | source: rest-ui | adapter: native | notes: id/itemID/type/cost/flags/rounds/useCount + typecheck
- [x] 休整页和 Battle V4 共用 `PlayerBagPanel`。 | priority: P0 | source: shared-ui | adapter: native | notes: rest uses full bag, battle filters canBattleUse
- [x] 休整页支持携带、替换、卸下和丢弃普通道具。 | priority: P0 | source: rest-ui | adapter: native | notes: updates draft only, no autosave
- [x] 休整页支持恢复类道具立即使用：HP、复活、状态、PP、树果恢复。 | priority: P0 | source: item-effects | adapter: native | notes: consumes item instance on success
- [x] 休整页支持训练道具立即使用：EV、性格、特性、等级、IV 王冠。 | priority: P0 | source: item-effects | adapter: native | notes: consumes item instance on success
- [x] 图鉴/API 支持按学习来源获取技能：自学、教授、遗传、技能机器。 | priority: P0 | source: dex-api | adapter: native | notes: shared source for TM legality and future NPC move services
- [x] 训练配置页初始随机技能和休整页随机技能只从自学池抽取。 | priority: P0 | source: training-team | adapter: native | notes: no TM/egg/tutor leakage into random free moves
- [x] 休整页支持 TM 技能机器立即使用与独立技能替换弹窗。 | priority: P0 | source: item-effects | adapter: native | notes: machine learnset legality + consumes TM instance on success
- [x] 休整页背包成功使用道具显示非阻塞 toast。 | priority: P2 | source: rest-ui | adapter: native | notes: persistent status still used for failure/manual-save reminder
- [x] Battle V4 主指令区新增“背包”按钮。 | priority: P1 | source: battle-v4-ui | adapter: native | notes: placeholder only + typecheck
- [x] Battle V4 `battleBagEnabled=false` 点击提示“战斗背包未开启”。 | priority: P1 | source: battle-v4-ui | adapter: native | notes: no item choice submitted + typecheck
- [x] Battle V4 `battleBagEnabled=true` 显示可战斗使用道具列表。 | priority: P1 | source: battle-v4-ui | adapter: native | notes: shared PlayerBagPanel filters canBattleUse + typecheck
- [x] Battle V4 支持恢复类道具占用当前 active 行动槽并先手结算。 | priority: P0 | source: battle-service | adapter: native | notes: submitTrainerItem + item-effects smoke + typecheck
- [x] Battle V4 使用道具成功后消耗对应 `Player.bag` 实例。 | priority: P0 | source: battle-service | adapter: native | notes: recovery item path implemented
- [x] Battle V4 场上 HP 恢复输出 heal 事件。 | priority: P1 | source: battle-animation | adapter: native | notes: existing timeline can play heal animation
- [ ] 系统战斗道具 Mega/Z/太晶重铸列表。 | priority: P1 | source: future-rest-ui | adapter: pending | notes:
- [ ] 携带/战斗道具有效回合、使用次数报废和自动销毁。 | priority: P1 | source: future-item-lifecycle | adapter: pending | notes:

## P0: Types And Registry

- [x] 新增 `PlayerBagV4` 类型。 | priority: P0 | source: data-model | adapter: native | notes: actual exported type is `BagStateV4`
- [x] 新增 `PlayerItemInstanceV4` 类型，字段包含 `id/itemID/name/image/cost/canSale/type/canBattleUse/canUse/canUseToPokemon/canTake/effectRound/getRound/maxUseCount/useCount`。 | priority: P0 | source: data-model | adapter: native | notes: implemented
- [x] 新增 `PlayerItemTypeV4` 枚举或 union。 | priority: P0 | source: data-model | adapter: native | notes: union implemented
- [ ] 新增 `ItemDefinitionV4` 静态定义类型。 | priority: P0 | source: data-model | adapter: pending | notes:
- [ ] 新增 `SpecialSystemKindV4` 类型：`mega/zmove/dynamax/terastallize`。 | priority: P0 | source: data-model | adapter: pending | notes:
- [x] 新增 `DEFAULT_SYSTEM_ITEMS` registry。 | priority: P0 | source: item-registry | adapter: native | notes: system entries in dex item overlay
- [x] 定义 `system-mega-stone`：通用Mega石。 | priority: P0 | source: item-registry | adapter: native | notes: dex overlay
- [x] 定义 `system-z-crystal`：通用Z纯晶。 | priority: P0 | source: item-registry | adapter: native | notes: dex overlay
- [x] 定义 `system-dynamax-band`：极巨化手环。 | priority: P0 | source: item-registry | adapter: native | notes: dex overlay
- [x] 定义 `system-tera-orb`：通用太晶珠。 | priority: P0 | source: item-registry | adapter: native | notes: dex overlay

## P0: Item Instance Helpers

- [x] 实现 `createItemInstanceV4(itemID, round, overrides?)`。 | priority: P0 | source: item-instance | adapter: native | notes: API exposed as `createItemInstance(itemID, options?)`
- [ ] 实现 `itemInstanceExpiredV4(item, currentRound)`。 | priority: P0 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `canSaleItemInstanceV4(item)`。 | priority: P1 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `canUseItemInstanceV4(item)`。 | priority: P1 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `canTakeItemInstanceV4(item)`。 | priority: P1 | source: item-instance | adapter: pending | notes:
- [x] 实现道具实例不堆叠测试：同 `itemID` 多个实例必须有不同 `id`。 | priority: P0 | source: tests | adapter: native | notes: identity-sync smoke

## P0: Player Bag Integration

- [x] `TrainingPlayerDraftV4` 增加 `bag: PlayerBagV4`。 | priority: P0 | source: training-model | adapter: native | notes: actual type is `BagStateV4`
- [x] 创建训练 run 时初始化每个 player bag。 | priority: P0 | source: training-create | adapter: native | notes: default maxSize 50
- [x] normalize 时缺少 bag 的 player 自动补默认 bag；开发期不兼容旧 `{ itemId, count }` 堆叠格式。 | priority: P0 | source: normalization | adapter: native | notes: normalize player
- [x] bag 默认 `maxSize` 第一版设为 30 或配置项。 | priority: P1 | source: training-model | adapter: native | notes: user requested default 50
- [x] 保存训练 run 时保留 item instance 全字段。 | priority: P0 | source: persistence | adapter: native | notes: stored in training run draft

## P0: System Item Default Rules

- [x] Gen7 默认发放通用Mega石 + 通用Z纯晶。 | priority: P0 | source: rule-defaults | adapter: native | notes: implemented
- [x] Gen8 默认发放极巨化手环。 | priority: P0 | source: rule-defaults | adapter: native | notes: implemented
- [x] Gen9 默认发放通用太晶珠；standard 不发放。 | priority: P0 | source: rule-defaults | adapter: native | notes: aligned with current implementation plan
- [ ] 花活/调试模式支持四个系统战斗道具都发放。 | priority: P1 | source: rule-defaults | adapter: pending | notes:
- [x] 默认系统战斗道具不作为普通携带物直接 `canTake`。 | priority: P0 | source: item-registry | adapter: native | notes: dex overlay flags

## P1: Dex Integration

- [ ] `QuickDexModal` 新增 web 侧虚拟分类 `系统道具`。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统道具分类展示 4 个默认系统战斗道具。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统战斗道具详情展示名称、图标、类型、说明。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统战斗道具详情展示 `canSale/canBattleUse/canUse/canUseToPokemon/canTake`。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统战斗道具可搜索中文名、英文名、系统类型。 | priority: P2 | source: web-dex | adapter: pending | notes:
- [ ] 不修改 dex-core 公共 `DexCategory`。 | priority: P1 | source: web-dex | adapter: pending | notes:

## P1: Special System Loadout

- [ ] 新增 `PlayerSpecialSystemLoadoutV4` 类型。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 支持通用Mega石分配到单只宝可梦。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 支持通用Mega石映射为真实 Mega 石 `mappedItemId`。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 支持通用Z纯晶分配到单只宝可梦。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 支持通用Z纯晶映射为真实 Z 纯晶 `mappedItemId`。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 支持极巨化手环 player 级资格。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 支持通用太晶珠 player 级资格与 `teraType` 配置。 | priority: P1 | source: loadout | adapter: pending | notes:
- [ ] 校验一个 player 同一场只能分配一个 Mega 系统资格。 | priority: P1 | source: validation | adapter: pending | notes:
- [ ] 校验一个 player 同一场只能分配一个 Z 系统资格。 | priority: P1 | source: validation | adapter: pending | notes:
- [ ] 校验太晶珠属性存在且可序列化到 Showdown set。 | priority: P1 | source: validation | adapter: pending | notes:

## P1: Showdown Team Compilation

- [ ] 编译 Showdown team 时将通用Mega石映射成真实 Mega 石 item。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
- [ ] 编译 Showdown team 时将通用Z纯晶映射成真实 Z 纯晶 item。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
- [ ] Mega/Z 映射时更新对应系统战斗道具实例 `useCount += 1`。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
- [ ] 极巨化手环不占宝可梦 item。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
- [ ] 通用太晶珠不占宝可梦 item。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
- [ ] 通用太晶珠属性写入 Showdown set `teraType`。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
- [ ] 编译结果 diagnostics 输出 mapped item 与 generated set item。 | priority: P1 | source: diagnostics | adapter: pending | notes:

## P0: Battle V4 Request-Driven Special UI

- [ ] Battle V4 特殊系统按钮不再按 gen 硬过滤。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] Mega 按钮只看 `canMegaEvo/canMegaEvoX/canMegaEvoY`。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] Z 按钮只看 `canZMove/zMoves`。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] 极巨化按钮只看 `canDynamax/maxMoves`。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] 太晶化按钮只看 `canTerastallize`。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] 灰色按钮点击提示 `Showdown request 未返回入口`。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] 保留同一个 player 同一个 request 内的 `alreadyMega/alreadyZ/alreadyMax/alreadyTera` 互斥。 | priority: P0 | source: web-command-ui | adapter: pending | notes:
- [ ] 合作模式不跨 player 误禁用特殊系统。 | priority: P0 | source: web-command-ui | adapter: pending | notes:

## P2: Diagnostics

- [ ] diagnostics 导出 player bag snapshot。 | priority: P2 | source: diagnostics | adapter: pending | notes:
- [ ] diagnostics 导出 system item instances。 | priority: P2 | source: diagnostics | adapter: pending | notes:
- [ ] diagnostics 导出 special system loadout。 | priority: P2 | source: diagnostics | adapter: pending | notes:
- [ ] diagnostics 导出 Showdown request `can*` 字段摘要。 | priority: P2 | source: diagnostics | adapter: pending | notes:
- [ ] diagnostics 导出 selected special suffix 与 displayed move。 | priority: P2 | source: diagnostics | adapter: pending | notes:

## Test Plan

- [x] `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`。 | priority: P0 | source: verification | adapter: passed | notes:
- [x] `pnpm --dir changeBattleV2 typecheck`。 | priority: P0 | source: verification | adapter: passed | notes:
- [x] `pnpm --dir changeBattleV2 --filter @changebattle-v2/api test:item-effects`。 | priority: P0 | source: verification | adapter: passed | notes: recovery + training item smoke
- [x] `pnpm --dir changeBattleV2 test:identity-sync`。 | priority: P1 | source: verification | adapter: passed | notes:
- [x] `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test`。 | priority: P1 | source: verification | adapter: passed | notes:
- [ ] 手动验收 Gen7：Mega/Z 由系统战斗道具映射后 Showdown request 返回入口。 | priority: P1 | source: manual | adapter: pending | notes:
- [ ] 手动验收 Gen8：极巨化按钮由 Showdown request 返回入口决定。 | priority: P1 | source: manual | adapter: pending | notes:
- [ ] 手动验收 Gen9：太晶化属性来自通用太晶珠并显示到按钮/状态条。 | priority: P1 | source: manual | adapter: pending | notes:
- [ ] 手动验收合作模式：P1/P2 特殊系统可用性独立看各自 request。 | priority: P1 | source: manual | adapter: pending | notes:

## Non-Goals

- [ ] 第一版不实现完整商店。 | priority: P3 | source: non-goal | adapter: pending | notes:
- [ ] 第一版不实现全部普通道具效果。 | priority: P3 | source: non-goal | adapter: pending | notes: recovery + training + TM implemented; system reforging pending
