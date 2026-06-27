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

本清单只追踪系统道具与道具实例体系，不追踪普通药品、树果、商店经济与完整战斗背包。

## P0: Types And Registry

- [ ] 新增 `PlayerBagV4` 类型。 | priority: P0 | source: data-model | adapter: pending | notes:
- [ ] 新增 `PlayerItemInstanceV4` 类型，字段包含 `id/itemID/name/image/cost/canSale/type/canBattleUse/canUse/canUseToPokemon/canTake/effectRound/getRound/maxUseCount/useCount`。 | priority: P0 | source: data-model | adapter: pending | notes:
- [ ] 新增 `PlayerItemTypeV4` 枚举或 union。 | priority: P0 | source: data-model | adapter: pending | notes:
- [ ] 新增 `ItemDefinitionV4` 静态定义类型。 | priority: P0 | source: data-model | adapter: pending | notes:
- [ ] 新增 `SpecialSystemKindV4` 类型：`mega/zmove/dynamax/terastallize`。 | priority: P0 | source: data-model | adapter: pending | notes:
- [ ] 新增 `DEFAULT_SYSTEM_ITEMS` registry。 | priority: P0 | source: item-registry | adapter: pending | notes:
- [ ] 定义 `system-mega-stone`：通用Mega石。 | priority: P0 | source: item-registry | adapter: pending | notes:
- [ ] 定义 `system-z-crystal`：通用Z纯晶。 | priority: P0 | source: item-registry | adapter: pending | notes:
- [ ] 定义 `system-dynamax-band`：极巨化手环。 | priority: P0 | source: item-registry | adapter: pending | notes:
- [ ] 定义 `system-tera-orb`：通用太晶珠。 | priority: P0 | source: item-registry | adapter: pending | notes:

## P0: Item Instance Helpers

- [ ] 实现 `createItemInstanceV4(itemID, round, overrides?)`。 | priority: P0 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `itemInstanceExpiredV4(item, currentRound)`。 | priority: P0 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `canSaleItemInstanceV4(item)`。 | priority: P1 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `canUseItemInstanceV4(item)`。 | priority: P1 | source: item-instance | adapter: pending | notes:
- [ ] 实现 `canTakeItemInstanceV4(item)`。 | priority: P1 | source: item-instance | adapter: pending | notes:
- [ ] 实现道具实例不堆叠测试：同 `itemID` 多个实例必须有不同 `id`。 | priority: P0 | source: tests | adapter: pending | notes:

## P0: Player Bag Integration

- [ ] `TrainingPlayerDraftV4` 增加 `bag: PlayerBagV4`。 | priority: P0 | source: training-model | adapter: pending | notes:
- [ ] 创建训练 run 时初始化每个 player bag。 | priority: P0 | source: training-create | adapter: pending | notes:
- [ ] 加载老 run 时 migration：缺少 bag 的 player 自动补默认 bag。 | priority: P0 | source: migration | adapter: pending | notes:
- [ ] bag 默认 `maxSize` 第一版设为 30 或配置项。 | priority: P1 | source: training-model | adapter: pending | notes:
- [ ] 保存训练 run 时保留 item instance 全字段。 | priority: P0 | source: persistence | adapter: pending | notes:

## P0: System Item Default Rules

- [ ] Gen7 默认发放通用Mega石 + 通用Z纯晶。 | priority: P0 | source: rule-defaults | adapter: pending | notes:
- [ ] Gen8 默认发放极巨化手环。 | priority: P0 | source: rule-defaults | adapter: pending | notes:
- [ ] Gen9 / standard 默认发放通用太晶珠。 | priority: P0 | source: rule-defaults | adapter: pending | notes:
- [ ] 花活/调试模式支持四个系统道具都发放。 | priority: P1 | source: rule-defaults | adapter: pending | notes:
- [ ] 默认系统道具不作为普通携带物直接 `canTake`。 | priority: P0 | source: item-registry | adapter: pending | notes:

## P1: Dex Integration

- [ ] `QuickDexModal` 新增 web 侧虚拟分类 `系统道具`。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统道具分类展示 4 个默认系统道具。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统道具详情展示名称、图标、类型、说明。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统道具详情展示 `canSale/canBattleUse/canUse/canUseToPokemon/canTake`。 | priority: P1 | source: web-dex | adapter: pending | notes:
- [ ] 系统道具可搜索中文名、英文名、系统类型。 | priority: P2 | source: web-dex | adapter: pending | notes:
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
- [ ] Mega/Z 映射时更新对应系统道具实例 `useCount += 1`。 | priority: P1 | source: showdown-compile | adapter: pending | notes:
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

- [ ] `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`。 | priority: P0 | source: verification | adapter: pending | notes:
- [ ] `pnpm --dir changeBattleV2 typecheck`。 | priority: P0 | source: verification | adapter: pending | notes:
- [ ] `pnpm --dir changeBattleV2 test:identity-sync`。 | priority: P1 | source: verification | adapter: pending | notes:
- [ ] `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core test`。 | priority: P1 | source: verification | adapter: pending | notes:
- [ ] 手动验收 Gen7：Mega/Z 由系统道具映射后 Showdown request 返回入口。 | priority: P1 | source: manual | adapter: pending | notes:
- [ ] 手动验收 Gen8：极巨化按钮由 Showdown request 返回入口决定。 | priority: P1 | source: manual | adapter: pending | notes:
- [ ] 手动验收 Gen9：太晶化属性来自通用太晶珠并显示到按钮/状态条。 | priority: P1 | source: manual | adapter: pending | notes:
- [ ] 手动验收合作模式：P1/P2 特殊系统可用性独立看各自 request。 | priority: P1 | source: manual | adapter: pending | notes:

## Non-Goals

- [ ] 第一版不实现完整商店。 | priority: P3 | source: non-goal | adapter: pending | notes:
- [ ] 第一版不实现战斗背包药品使用。 | priority: P3 | source: non-goal | adapter: pending | notes:
- [ ] 第一版不实现全部普通道具效果。 | priority: P3 | source: non-goal | adapter: pending | notes:
