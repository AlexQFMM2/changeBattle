# ChangeBattle V2 Core Data Migration Plan

## Summary

把项目自建静态配置表逐步迁入 `packages/changebattle-v2-core`，让 `apps/api` 专注运行规则、状态机和存档适配，`apps/web` 专注展示交互。Showdown 原始数据继续留在 `packages/showdown-dex-core`，图片、视频、音频等资源继续留在 `assets`。

本计划只迁移“我们自己的配置数据”，不迁移 Showdown dex 数据，不迁移 React UI，不迁移 localStorage/desktop adapter。

## Boundary

### Move To Core

- 描述“有什么”的自建静态表。
- 不依赖 `window`、React、storage、battle session 的配置。
- 可被 API 和 Web 共同消费的类型、分类、文案、权重、池子。

### Keep In Apps API

- 描述“怎么运行”的逻辑。
- run normalize、购买/出售交易、星图解锁、奖励结算、战斗应用。
- 存档读写、localStorage、desktop bridge。
- 任何需要服务对象、随机上下文、当前 run 状态的函数。

### Keep In Showdown Dex Core

- `pokedex.ts`
- `moves.ts`
- `items.ts`
- `abilities.ts`
- `learnsets.ts`
- `trainers.ts`
- `typechart.ts`
- Showdown 原始文本、别名和 dex 内部索引。

## Target Shape

```txt
packages/changebattle-v2-core/
  src/
    index.ts
    formalShopCatalog.ts
    formalGameCatalog.ts
    starChartCatalog.ts
    formalSpeciesRanks.ts
    restCenterCatalog.ts
```

`apps/api` 从 `@changebattle-v2/core` 读取 catalog，再执行生成、normalize、交易和存档。

`apps/web` 只在确实需要共享展示配置时直接读取 core；业务状态仍优先通过 `@changebattle-v2/api` 类型与接口进入。

## Migration Checklist

### Phase 0: Package Baseline

- [x] 新建 `packages/changebattle-v2-core/package.json`。
- [x] 新建 `packages/changebattle-v2-core/tsconfig.json`。
- [x] 新建 `packages/changebattle-v2-core/src/index.ts`。
- [x] 在 workspace 中确认 `packages/*` 会包含 core package。
- [x] `apps/api` 增加 `@changebattle-v2/core` workspace dependency。
- [x] 跑通 `pnpm --dir changeBattleV2 --filter @changebattle-v2/core typecheck`。
- [x] 跑通 `pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck`。
- [x] 跑通 `pnpm --dir changeBattleV2 typecheck`。

### Phase 1: Formal Shop Catalog

- [x] 迁移 `FormalShopCategoryV4` 到 `formalShopCatalog.ts`。
- [x] 迁移 `FORMAL_SHOP_CATEGORY_LABELS`。
- [x] 迁移 `FORMAL_SHOP_CATEGORY_ORDER`。
- [x] 迁移 `FORMAL_SHOP_ITEM_POOL`。
- [x] 迁移 `FORMAL_SHOP_SLOTS_PER_CATEGORY`。
- [x] `apps/api/src/formalGame.ts` 从 `@changebattle-v2/core` import shop catalog。
- [x] `apps/api/src/formalGame.ts` 继续 re-export `FormalShopCategoryV4`，避免 Web 侧大面积改 import。
- [x] 补充商店 catalog smoke test 或类型级断言，确保每个分类至少有 3 个商品。
- [x] 决定 `FORMAL_SHOP_SELL_RATE` 是否迁入 core。当前作为固定经济配置迁入 core；若后续由设施、星图或事件动态计算，再改为规则输入。

### Phase 2: Shop Product View / DTO

- [x] 在 core 定义 `FormalShopProductV4` 或 `FormalShopProductViewV4` 类型。
- [x] 明确字段：
  - `slotId`
  - `itemID`
  - `type`
  - `name`
  - `price`
  - `summary`
  - `stock`
  - `iconUrl?`
  - `iconStyle?`
- [x] 把技能机器显示名规则统一沉淀到 API helper 或 core 纯函数。
- [x] 把价格 fallback、summary fallback 从 `TrainingRestShopBuyList` 移出。
- [x] `TrainingRestShopBuyList` 改为优先渲染统一商品 view。
- [x] 保留购买交易仍使用 `slotId`，不要让前端自行推断库存位。

### Phase 3: Formal Game Static Config

- [x] 梳理 `apps/api/src/formalGame.ts` 中的纯配置常量。
- [x] 迁移正式模式基础数字配置，例如：
  - round count
  - starting money
  - starter candidate count
  - round reward / income / settlement 参数
- [x] 迁移纯 label 字典，例如：
  - starter role labels
  - team preference labels
  - shop category labels 若 Phase 1 未覆盖新需求
- [x] 保留依赖当前 run 或当前 profile 的计算函数在 API。
- [x] 每迁一组常量后跑 `api typecheck` 和 formal smoke test。

Phase 3 notes:

- `DEFAULT_FORMAL_RUN_KEY` 本轮不迁移：它是 Web/localStorage 存档 adapter key，不是游戏配置。
- `STAT_IDS` 本轮不迁移：它绑定 `DexStatId`，后续在 core 类型整理阶段统一处理更稳。
- `STARTER_ALLOWED_RANKS` 本轮不迁移：它依赖正式物种 rank 类型，留到 Formal Species Rank Data 阶段一起处理。
- `DEFAULT_SYSTEM_ITEMS_BY_RULE_SET` 本轮不迁移：它依赖 `TrainingRuleSetV4` 和系统背包生成逻辑，仍属于 API 运行时装配边界。

### Phase 4: Star Chart Catalog

- [x] 梳理 `apps/api/src/starChart.ts` 中的节点定义、消耗、分组和文案。
- [x] 新建/沉淀 Star Chart catalog 到 core 公共入口。
- [x] 迁移纯节点 catalog。
- [x] API 中保留：
  - normalize chart state
  - unlock node
  - battle point 扣除
  - profile patch
- [x] 确保 catalog 不依赖 profile/runtime。
- [x] 跑 `test:formal-game` 或相关 smoke，确认星图解锁不变。

Phase 4 notes:

- `STAR_CHART_NODES_V4`、`MORE_CHOICES_NODE_IDS`、`MAX_BP_V4` 和星图展示类型已迁入 core。
- `STAR_CHART_NODE_BY_ID_V4` 作为 API 派生索引保留在 API。

### Phase 5: Formal Species Rank Data

- [x] 梳理 `apps/api/src/formalSpeciesRanks.ts`。
- [x] 判断哪些是自建 rank 数据，哪些是从 dex 派生。
- [x] 迁移自建 rank catalog 到 `formalSpeciesRanks.ts` in core。
- [x] API 继续负责基于 dex/detail 的过滤、候选生成和随机选择。
- [x] 跑 starter candidate 相关 smoke。

Phase 5 notes:

- `FormalPokemonSpeciesRankEntries` 和 `FormalPokemonSpeciesRankById` 已迁入 `@changebattle-v2/core/formalSpeciesRanks` 子路径。
- `apps/api/src/formalSpeciesRanks.ts` 保留为薄 re-export，避免 API 内部和外部 import 路径断裂。
- `STARTER_ALLOWED_RANKS` 仍留在 API，因为它是 starter 生成规则的一部分。

### Phase 6: Rest Center Catalog

- [x] 梳理休整中心公共入口配置。
- [x] 只迁移稳定配置，例如功能 id、label、icon asset path、启用状态。
- [x] 不迁移 React 组件映射、CSS class、动画状态。
- [x] 确认 `商店 / 队伍 / 背包 / 保存` 等入口可以通过统一 catalog 表达。
- [x] Web 侧按需消费 core catalog，但页面状态仍留在组件内。

Phase 6 notes:

- 休整入口 catalog 已迁入 core，并由 API re-export 给 Web 使用。
- Web 仍通过 `@changebattle-v2/api` 消费，暂不新增直接 core 依赖。
- 交换、教授、遗传等未启用入口不进入默认 catalog。

### Phase 7: Cleanup

- [x] 删除 API 中迁移后残留的重复常量。
- [x] 清理不再需要的局部 label helper。
- [x] 更新 import 路径，避免 API 和 Web 各维护一份同名表。
- [x] 更新 README 或架构文档，说明数据边界：
  - `showdown-dex-core`: Showdown / Pokemon base data
  - `changebattle-v2-core`: ChangeBattle self-owned config data
  - `apps/api`: runtime rules and storage
  - `apps/web`: UI
  - `assets`: binary/static media

## Validation

每个 phase 完成后至少运行：

```bash
pnpm --dir changeBattleV2 --filter @changebattle-v2/core typecheck
pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck
git -C changeBattleV2 diff --check
```

涉及正式模式、商店、星图时额外运行：

```bash
pnpm --dir changeBattleV2 --filter @changebattle-v2/api test:formal-game
```

大迁移阶段结束后运行：

```bash
pnpm --dir changeBattleV2 typecheck
```

## Open Questions

- `FORMAL_SHOP_SELL_RATE` 已作为固定经济配置迁入 core；如果卖出倍率未来由设施、星图或事件动态修改，再改成规则输入或运行时派生。
- 商品价格是否继续以 dex `cost` 为默认值，还是 core 商品表拥有 shop-only `price` override？
- 商品 summary 是否允许覆盖 dex description？如果允许，core 商品表应加入 `summaryOverride`。
- Web 短期继续只依赖 API，避免前端 import 面扩大；长期共享更多 UI catalog 时再直接引入 core。

## Suggested Next Step

数据迁移计划已收尾。正式商店第一版也已完成；下一步按正式玩法计划推进训练场设施：传授技能、蛋技能、自主训练。
