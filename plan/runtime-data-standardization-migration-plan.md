# Runtime Data Standardization Migration Plan

## Summary

把 ChangeBattle V2 的运行时实例数据结构标准化到 `packages/changebattle-v2-core`，让 Web 前端、API facade、Desktop IPC 和后续灵魂伴侣系统都只通过 package 导出的类型与 helper 读写核心数据。

当前问题不是“前端完全自己定义数据”，而是大量运行时结构集中在 `apps/api`，前端和 desktop 通过 `@changebattle-v2/api` 间接使用。随着正式流程、商店、战斗记录、金币流水、局外养成继续增加，`apps/api` 会越来越像 domain core。下一步需要把“存档级结构 + 标准 helper”迁到 `packages/changebattle-v2-core`，`apps/api` 只负责编排流程和调用 helper。

## Layer Contract

这是本计划的硬边界，后续迁移和 AI agent 执行都必须先按这组规则判断。

### `packages/changebattle-v2-core`

只放：

- 类型定义。
- 静态配置和 catalog。
- 纯函数。
- normalize / migration helper。
- 无副作用 query / summary / display helper。

禁止：

- 直接访问 browser / `window` / `localStorage`。
- 直接访问 Electron / IPC。
- 直接访问 Node `fs` / `crypto` / `path`。
- 直接创建或推进 battle session runtime。
- 直接保存状态或写文件。

### `apps/api`

负责：

- 运行时流程编排。
- run 状态推进。
- 调用 battle service。
- 调用 storage adapter。
- Web/Desktop 共用 facade。
- 组合 core helper 形成完整业务动作。

要求：

- 可以 import core helper。
- 不能重新定义 core 已有结构。
- 复杂展示/统计/helper 如果可复用，应先补 core，再在 API 调用。

### `apps/web`

负责：

- UI 展示。
- 用户交互。
- 页面状态。

禁止：

- 手写复杂数据推导。
- 手写宝可梦展示名、结伴候选、金币 summary、battleLog summary 等可复用规则。
- 直接理解或重组复杂存档结构。

要求：

- 需要展示名、候选筛选、summary 时调用 core/api helper。

### `apps/desktop`

负责：

- 桌面壳。
- IPC。
- 本地 split save。
- 文件、加密、压缩、manifest。

禁止：

- 定义游戏规则。
- 推导业务字段。

## Target Boundary

- `packages/changebattle-v2-core`：定义标准类型、normalize、create、query、summary helper。
- `apps/api`：组合正式流程、战斗服务、结算、存档 adapter、Web/Desktop facade。
- `apps/web`：展示和交互，只调用 API 或 core helper，不手写复杂结构判断。
- `apps/desktop`：继续保存/读取标准结构，不新增业务结构。

## Migration Decision

### Must Move To Core

这些是标准数据格式、静态规则或纯 helper，应该迁移到 `packages/changebattle-v2-core`。

| 数据/能力 | 当前主要位置 | 迁移后位置 | 判断理由 |
| --- | --- | --- | --- |
| `BattlePreferenceV4` / `FormalCompetitionModeV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/battlePreference.ts` | 标准偏好结构和默认值，跨 profile/run/web/api 使用。 |
| `LocalTeamV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/pokemonInstance.ts` | 标准队伍实例结构，跨休整、战斗、结算、结伴使用。 |
| `LocalPokemonV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/pokemonInstance.ts` | 标准宝可梦实例结构，应配套 display/identity/normalize helper。 |
| `TrainingMoveSlotV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/pokemonInstance.ts` | 实例招式槽和 PP 状态，战斗/休整/箱子都会用。 |
| `StatTableV4` / `LocalPokemonLocksV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/pokemonInstance.ts` | 个体/努力/锁定属于数据标准，不属于流程。 |
| `PlayerItemInstanceV4` / `PlayerItemTypeV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/itemInstance.ts` | 局内背包道具实例标准结构。 |
| `BagStateV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/bagState.ts` | 背包容器和 normalize/helper 是标准能力。 |
| `PlayerVaultV4` | `apps/api/src/index.ts` | `packages/changebattle-v2-core/src/playerVault.ts` | 玩家全局仓库 schema，长期存档标准。 |
| `PlayerItemRecordV4` | `apps/api/src/index.ts` | `packages/changebattle-v2-core/src/playerVault.ts` | 玩家全局道具背包聚合记录。 |
| `PlayerPokemonRecordV4` / `PlayerPokemonMoveRecordV4` | `apps/api/src/index.ts` | `packages/changebattle-v2-core/src/playerVault.ts` | 玩家全局宝可梦箱子长期记录。 |
| `UserProfileV2` / profile normalize | `apps/api/src/index.ts` | `packages/changebattle-v2-core/src/userProfile.ts` | 玩家档案是全局长期存档 schema。 |
| `TrainingCoinLogEntryV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/coinLog.ts` | 金币流水 schema、summary 是纯数据能力。 |
| `TrainingBattleLogEntryV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/battleLog.ts` | 战斗流水 schema、summary、候选筛选是纯数据能力。 |
| `TrainingRunStatusV4` / `TrainingRunNodeStateV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/runGame.ts` | 状态枚举是 schema 的一部分。 |
| `TrainingRunGameV4` / `TrainingRunGameNodeV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/runGame.ts` | run 快照 schema 可以迁；创建/推进流程不迁。 |
| `TrainingScenarioV4` / `TrainingPlayerDraftV4` | `apps/api/src/training.ts` | `packages/changebattle-v2-core/src/runGame.ts` | 场景/玩家草案 schema 可以迁；随机生成流程不迁。 |
| `FormalRoundSettlementV4` | `apps/api/src/formalGame.ts` | `packages/changebattle-v2-core/src/formalSettlement.ts` | 单轮结算结果 schema。 |
| `FormalGameSettlementV4` / `FormalSettlementPokemonStatsV4` | `apps/api/src/formalGame.ts` | `packages/changebattle-v2-core/src/formalSettlement.ts` | 最终结算 schema 和 summary helper。 |
| 灵魂伴侣记录/候选 | 尚未实现 | `packages/changebattle-v2-core/src/soulmate.ts` | 新功能的标准 schema 和纯 helper。 |

### Move Later / Only Pure Parts

这些模块可以迁类型、状态和纯 helper，但运行时流程继续留在 `apps/api`。

| 模块 | 可迁移到 core | 留在 api 的部分 |
| --- | --- | --- |
| 正式商店 | `FormalRestShopV4`、商品 view type、价格/summary helper | 购买/出售流程、扣钱、加道具、补货推进 |
| 训练场 | lesson/state/result type、费用/展示 helper | 上课流程、扣钱、修改宝可梦、推进课程 |
| 交换/结伴过渡 | exchange state/record/view type、候选展示 helper | 判断当前 run 是否允许交换、执行交换并写 run |
| `FormalGameRunV4` | 顶层 schema 和 normalize，后期迁 | `createFormalGameRun`、`prepareFormalRoundPlan`、`finalizeFormalBattleResult` |
| `FormalRoundPlanV4` | round plan schema、难度/地区配置 helper | 生成下一轮、调用随机队伍、根据 run 状态推进 |
| Star chart state | 点亮状态、runtime effect query helper | 根据 run 流程实际应用效果 |

### Do Not Move To Core

这些属于运行时、平台或表现层，禁止迁到 `packages/changebattle-v2-core`。

| 内容 | 当前位置 | 原因 |
| --- | --- | --- |
| `createFormalGameRun` / `prepareFormalBattleSession` / `finalizeFormalBattleResult` | `apps/api/src/formalGame.ts` | 运行时流程编排，会调用 battle/storage。 |
| `createTrainingRunApi` 和 storage adapter | `apps/api/src/training.ts` | 应用服务和存储 facade。 |
| `BattleSessionSnapshotV4` / `ShowdownPlaybackTimelineV4` / battle session runtime | `packages/showdown-battle-core`、`apps/api/src/battle.ts` | 属于 battle runtime，不是 ChangeBattle 存档 core。 |
| Web `localStorage` adapter | `apps/api/src/*` | 平台存储实现，不是纯函数。 |
| Desktop split save / AES / gzip / manifest | `apps/desktop/electron/desktopSaveStore.ts` | 平台存储实现，不进 core。 |
| React page state / props / modal state | `apps/web/src/**` | 表现层状态，不进 core。 |
| 动画 visual state / scheduler | `apps/web/src/components/battle-v4/**` | 表现层/播放层，不是存档 schema。 |

## Save/Load Boundary

存档迁移只迁“数据结构和 normalize/migration helper”，不迁具体存储实现。

继续留在应用层：

- Web `localStorage` adapter：`apps/api/src/index.ts`、`apps/api/src/training.ts`、`apps/api/src/formalGame.ts`。
- Desktop IPC bridge：`apps/web/src/App.tsx`、`apps/desktop/electron/preload.ts`、`apps/desktop/electron/main.ts`。
- Desktop split save 和加密压缩：`apps/desktop/electron/desktopSaveStore.ts`。
- 存档路径、表文件名、manifest、AES/GCM、gzip、atomic write。

迁移到 `packages/changebattle-v2-core`：

- 存档 JSON 的标准 schema。
- 存档版本号和默认值。
- `normalizeProfileV4`、`normalizePlayerVaultV4`、`normalizeTrainingRunGameV4`、`normalizeFormalGameRunV4`。
- 旧字段兼容、缺字段补齐、未来字段升级。

读写规则：

- 所有 load 后必须调用 core normalize，再进入 UI/API 流程。
- 所有 save 前必须调用 core normalize，再交给 Web/Desktop adapter。
- adapter 只负责“从哪里读、写到哪里、是否加密/分表”，不能负责业务字段推导。
- core 不能 import `window`、`node:fs`、`node:crypto`、Electron IPC 或任何平台 API。

目标读档形态：

```ts
const raw = readStorage();
return raw ? normalizeFormalGameRunV4(raw) : null;
```

目标存档形态：

```ts
const next = normalizeFormalGameRunV4(run);
writeStorage(next);
return clone(next);
```

## Target Package Files

新增或调整 `packages/changebattle-v2-core/src/`：

```text
battlePreference.ts
userProfile.ts
runGame.ts
pokemonInstance.ts
itemInstance.ts
bagState.ts
coinLog.ts
battleLog.ts
playerVault.ts
formalSettlement.ts
soulmate.ts
saveData.ts
```

并在 `packages/changebattle-v2-core/src/index.ts` 统一导出。

## Standard Helper List

### Pokemon Instance

- `getPokemonDisplayNameV4(pokemon)`：统一显示名，优先 `nickname`，再 `nameZh`，再 `name`，最后 `speciesId`。
- `getPokemonIdentityKeyV4(pokemon)`：统一宝可梦归因 key，优先 `pokeballId/showdownIdentityToken/localPokemonId`。
- `normalizeLocalPokemonV4(pokemon)`：补齐缺失字段，兼容旧存档。
- `cloneLocalPokemonV4(pokemon)`：避免 UI 直接改引用。
- `localPokemonToPlayerPokemonRecordV4(pokemon, options)`：局内实例转局外仓库记录。

### Item And Bag

- `createPlayerItemInstanceV4(itemID, options)`：标准化创建道具实例。
- `normalizePlayerItemInstanceV4(item)`：补齐旧字段。
- `normalizeBagStateV4(bag, options)`：背包 normalize。
- `bagFindItemByInstanceIdV4(bag, id)`：按实例 ID 查找。
- `bagAddItemInstanceV4(bag, item)`：返回新背包。
- `bagRemoveItemInstancesV4(bag, ids)`：返回新背包和移除列表。

### Coin Log

- `createCoinLogEntryV4(input)`：标准金币流水构造。
- `appendCoinLogEntryV4(log, input)`：追加并计算 balance。
- `summarizeCoinLogV4(log)`：收入、支出、净收益、余额。
- `filterCoinLogByRoundV4(log, roundIndex)`：按回合筛选。

### Battle Log

- `normalizeBattleLogEntryV4(entry)`：兼容旧流水。
- `summarizeBattleLogByPokemonV4(entries)`：输出/承伤/治疗/KDA 聚合。
- `getBattleLogParticipantKeysV4(entries)`：获取本局参与宝可梦。
- `getPokemonEligibleForSoulmateV4(entries, team)`：筛选“本局使用过且造成过伤害”的结伴候选。

### Player Vault

- `normalizePlayerVaultV4(vault)`：局外仓库标准化。
- `addPlayerPokemonRecordV4(vault, pokemon)`：写入局外宝可梦。
- `addPlayerItemRecordsV4(vault, items)`：写入局外道具。
- `playerPokemonRecordToLocalPokemonV4(record, options)`：后续局外带入局内。

### Save Data

- `normalizeProfileV4(profile)`：玩家档案标准化。
- `normalizeTrainingRunGameV4(run)`：训练/休整 run 标准化。
- `normalizeFormalGameRunV4(run)`：正式 run 标准化。
- `normalizeSaveTableV4(tableName, value)`：可选的统一表 normalize 入口。
- `SAVE_DATA_SCHEMA_VERSION_V4`：存档 schema 版本号，不等于 desktop split save 文件版本。

### Soulmate

- `createSoulmateCandidateListV4(input)`：从 battleLog/team 等纯数据输入生成候选，不直接依赖 API 流程。
- `createSoulmatePokemonRecordV4(input)`：生成长期伙伴，包含 1/8 闪光概率。
- `renameSoulmatePokemonV4(record, nickname)`：改名。
- `getSoulmateDisplayNameV4(record)`：展示名。
- `normalizeSoulmatePokemonRecordV4(record)`：兼容旧数据。

## Migration Phases

### Phase 0: Guardrails

- 不改变玩家可见行为。
- 不改存档文件路径。
- 不一次性迁移所有正式 run 逻辑。
- 每迁一个结构，先在 core 导出类型和 helper，再让 `apps/api` 从 core import。
- Web 端禁止新增复杂结构判断；必要展示逻辑优先补 core helper。

### Phase 1: BattlePreference / UserProfile / PlayerVault

目标：先迁全局长期存档入口和偏好结构，建立 package 作为 schema 来源。

步骤：

- 新增 `battlePreference.ts`，从 `apps/api/src/training.ts` 迁出：
  - `TrainingModeV4`
  - `TrainingRuleSetV4`
  - `FormalCompetitionModeV4`
  - `BattleSystemPreferenceV4`
  - `BattlePreferenceV4`
  - `normalizeBattlePreferenceV4`
- 新增 `userProfile.ts`，从 `apps/api/src/index.ts` 迁出：
  - `UserProfileV2`
  - battle points / profile normalize 相关纯 helper
  - profile 默认值和旧字段兼容
- 新增 `playerVault.ts`，从 `apps/api/src/index.ts` 迁出：
  - `PlayerItemRecordV4`
  - `PlayerPokemonMoveRecordV4`
  - `PlayerPokemonRecordV4`
  - `PlayerVaultV4`
  - `PlayerVaultMergeResultV4`
  - `normalizePlayerVaultV4`
- `apps/api` 从 core import 并 re-export，保持 Web/Desktop 旧 import 不爆。

验收：

- Web profile / player vault 可读写。
- Desktop split save `profile.dat` / `player_item.dat` / `player_pokemon.dat` 可读写。
- 对局偏好页、正式 run 创建、single/standard 模式显示不变。

### Phase 2: Pokemon / Item / Bag 基础实例

目标：先把最常用、最容易被灵魂伴侣复用的实例结构抽到 core。

步骤：

- 新增 `pokemonInstance.ts`，从 `apps/api/src/training.ts` 迁出：
  - `TrainingGenderV4`
  - `TrainingStatusV4`
  - `LocalTeamV4`
  - `LocalPokemonV4`
  - `TrainingMoveSlotV4`
  - `StatTableV4`
  - `LocalPokemonLocksV4`
- 在 `LocalPokemonV4` 保留 `nickname?: string`，新增 `getPokemonDisplayNameV4`，后续 UI 不再手写显示名 fallback。
- 新增 `itemInstance.ts`，迁出：
  - `PlayerItemTypeV4`
  - `PlayerItemInstanceV4`
- 新增 `bagState.ts`，迁出：
  - `BagStateV4`
  - `normalizeBagStateV4`
- `apps/api/src/training.ts` 改为从 `@changebattle-v2/core` import 这些类型/helper，再 re-export 保持旧 API 兼容。
- 替换 Web 中显式展示名逻辑为 `getPokemonDisplayNameV4`。

验收：

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/core typecheck`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`
- 旧存档能正常打开休整页、背包、队伍页、战斗页。

### Phase 3: Save/Load Normalize 标准化

目标：Web 和 Desktop 读写仍保持现有机制，但所有存档进出都走 core normalize。

步骤：

- 新增 `saveData.ts`，先从 API 侧迁出或包装：
  - `normalizeProfileV4`
  - `normalizePlayerVaultV4`
  - `normalizeTrainingRunGameV4`
  - `normalizeFormalGameRunV4`
- Web adapter 修改：
  - `createBrowserUserProfileAdapter` load/save 调 `normalizeProfileV4`。
  - `createBrowserPlayerVaultAdapter` load/save 调 `normalizePlayerVaultV4`。
  - `createBrowserTrainingRunAdapter` load/save 调 `normalizeTrainingRunGameV4`。
  - `createBrowserFormalGameRunAdapter` load/save 调 `normalizeFormalGameRunV4`。
- Desktop adapter/bridge 修改：
  - `createDesktopUserProfileAdapter` load/save 调 `normalizeProfileV4`。
  - `createDesktopPlayerVaultAdapter` load/save 调 `normalizePlayerVaultV4`。
  - `createDesktopTrainingRunAdapter` load/save 调 `normalizeTrainingRunGameV4`。
  - `createDesktopFormalGameRunAdapter` load/save 调 `normalizeFormalGameRunV4`。
- `DesktopSaveStoreV2` 继续只管文件、加密、分表；不在 store 内做业务字段推导。

验收：

- Web 旧 localStorage 存档可读。
- Desktop split save 旧表可读。
- `trainingRun/formalRun` 读取后能补齐 `battleEndedPendingSettlement`、`competitionMode`、`coinLog/battleLog` 等默认字段。
- 保存前后 JSON schema 稳定，不出现 UI 临时字段。

### Phase 4: RunGame Snapshot 标准化

目标：把 `TrainingRunGameV4` 的顶层 schema 和状态 helper 固化到 core，但创建/推进 run 的流程继续留在 API。

步骤：

- 新增 `runGame.ts`，迁出：
  - `TrainingRunStatusV4`
  - `TrainingRunNodeStateV4`
  - `TrainingRunGameV4`
  - `TrainingRunGameNodeV4`
  - `TrainingRunResultV4`
  - `TrainingScenarioV4`
  - `TrainingPlayerDraftV4`
- 新增纯状态/query helper：
  - `isTrainingRunPendingSettlementV4`
  - `isTrainingRunEndedV4`
  - `getCurrentTrainingNodeV4`
  - `getNextTrainingNodeV4`
  - `normalizeTrainingRunGameV4`
- `apps/api/src/training.ts` 保留：
  - `createTrainingRunApi`
  - `createTrainingRunGame`
  - `createTrainingRunFromScenario`
  - `enterTrainingRest`
  - `randomizeTeam`
  - NPC catalog / scenario runtime 生成

验收：

- 单局模式正常创建、战斗、最终休整、去结算。
- 普通赛事前几场仍进入普通休整，最后胜利进入待结算休整。
- 失败/投降仍进入结算。

### Phase 5: CoinLog / BattleLog 标准化

目标：金币流水、战斗流水、结算统计、灵魂伴侣候选统一口径。

步骤：

- 新增 `coinLog.ts`，迁出：
  - `TrainingCoinLogEntryV4`
  - 金币流水 summary/helper
- 新增 `battleLog.ts`，迁出：
  - `TrainingBattleLogEntryV4`
  - battleLog 聚合 helper
- `apps/api/src/formalGame.ts` 中结算统计改为调用 core helper。
- 灵魂伴侣候选筛选使用 `getPokemonEligibleForSoulmateV4`，不在前端扫数组。

验收：

- 商店购买/出售金币流水不变。
- 训练场扣费流水不变。
- 战后 500 奖励和濒死救助扣费不变。
- 最终结算输出/承伤/治疗/KDA/评分不回退。

### Phase 6: Formal Settlement Schema

目标：只迁正式结算 schema 和 summary helper，不迁正式流程编排。

步骤：

- 新增 `formalSettlement.ts`，迁出：
  - `FormalRoundSettlementV4`
  - `FormalSettlementReasonV4`
  - `FormalGameSettlementV4`
  - `FormalSettlementPokemonStatsV4`
- 新增 helper：
  - `isFormalRunPendingSettlementV4`
  - `isFormalRunSettledV4`
  - `summarizeFormalSettlementV4`
- `FormalGameRunV4` 先留在 `apps/api/src/formalGame.ts`，避免一次迁移过大。

验收：

- 最终结算页类型不变。
- Desktop formal worker 类型不爆。
- settlement smoke 测试通过。

### Phase 7: Soulmate First-Class Model

目标：灵魂伴侣从第一天就是 core 标准结构，不写散。

步骤：

- 新增 `soulmate.ts`：
  - `PlayerSoulmatePokemonRecordV4`
  - `SoulmateCandidateV4`
  - `SoulmateChooseInputV4`
  - `SoulmateChooseResultV4`
  - `SoulmateRenameInputV4`
- 实现：
  - `createSoulmateCandidateListV4`
  - `createSoulmatePokemonRecordV4`
  - `renameSoulmatePokemonV4`
  - `getSoulmateDisplayNameV4`
- `PlayerVaultV4` 增加 `soulmates?: PlayerSoulmatePokemonRecordV4[]` 或单独 `soulmatePokemon` 字段；具体命名在实现前定。
- `FormalGameRunV4` 可增加本局带走对象字段，例如 `claimedSoulmate?: PlayerSoulmatePokemonRecordV4`，但只保存选择结果，不把候选 UI 状态塞进 run。

验收：

- 最终休整页点击“结伴”能读取候选。
- 候选只来自本局使用过且造成过伤害的宝可梦。
- 选择后 1/8 概率闪光。
- 可改名，展示走 display helper。
- 点击“去结算”后局外 vault 能保存长期伙伴。

### Phase 8: Facilities And LeagueLoop Pure Schema

目标：仅在灵魂伴侣主线稳定后，再迁正式设施和联盟循环赛需要的 schema/纯 helper。

可迁：

- `FormalRestShopV4`、商品 view type、商店 summary helper。
- `FormalTrainingGroundStateV4`、lesson view type、费用展示 helper。
- `FormalPokemonExchangeStateV4`、exchange record/view type。
- `FormalRoundPlanV4`、地区/轮次/难度配置 helper。

继续留 API：

- 购买/出售流程。
- 上课流程。
- 交换流程。
- 生成下一轮/推进 run。
- 联盟循环赛运行时推进。

## Compatibility Rules

- `apps/api` 在迁移期间继续 re-export 旧类型名，避免一次性改爆 Web/Desktop。
- 旧存档字段缺失时，normalize helper 必须补默认值。
- 不能删除 `nickname`、`localPokemonId`、`pokeballId`、`showdownIdentityToken`、`showdownId` 这类身份字段。
- 战斗归因继续以稳定 identity key 为准，不能用展示名反推身份。
- 前端新增展示逻辑时优先查 core helper；没有 helper 就先补 helper。

## Test Plan

- Core:
  - `@changebattle-v2/core typecheck`
  - 新增 normalize/helper 单测或 smoke，覆盖 pokemon/item/bag/vault/log。
- API:
  - `@changebattle-v2/api typecheck`
  - `@changebattle-v2/api test:formal-game`
  - 重点覆盖旧存档 normalize、金币流水、battleLog 聚合、最终结算。
- Web:
  - `@changebattle-v2/web typecheck`
  - 手测队伍页、背包页、休整页、战斗页、最终休整页。
- Desktop:
  - `@changebattle-v2/desktop typecheck`
  - split save 读取 profile/vault/trainingRun/formalRun。

## Non-Goals

- 本计划不直接实现完整灵魂伴侣 UI。
- 本计划不重写 Showdown battle service。
- 本计划不把所有正式流程函数迁入 core；流程编排仍留 `apps/api`。
- 本计划不改变存档路径和发布更新逻辑。
