# Formal Room V5 休整 KISS 收口清单

## Summary

按 `rules.md` 重新审视正式 room 休整链路后，当前最需要收口的是：商店/prepare-round 仍存在 V4 compat 桥和双路径，前端 room 休整展示仍把 V5 scoped view 转成 V4-shaped display model，导致简单玩法被复杂迁移残留拖住。

新的硬规则：V4 只能作为体验参考，不能作为 V5 正式 room 的底座。生成下一场对手应抽成 V5-native 中间层：输入玩家画像、回合轮次、模式、规则、seed 和候选来源，输出“下一场参赛方 JSON”。参赛方可以是 NPC、AI 队友、真人玩家或未来联机玩家；正式 room 只消费这个中间层结果并实体化。

本清单只定义问题、红线、修复顺序和验收方式；不要求本次文档更新同时修改业务代码。

## Red Lines

- [ ] 正式 room 休整主线不得使用 `FormalGameRunV4`、`TrainingRunGameV4`、`formalRun`、`restRunSnapshot`、`formalRunDraft`、`syncDraft` 作为权威、传输、存储或 fallback。
- [ ] 不允许同一个正式 room 操作存在两个官方路径；迁移残留必须删除或放进 legacy/dev/test adapter。
- [ ] V5 不调用 V4 formal run API 来生成权威数据；不能通过“包一层小 DTO 调旧 `prepareFormalRoundPlan()`”伪装成 V5。
- [ ] NPC/对手生成和商店生成一样，必须是 V5-native 小输入小输出规则：`context -> JSON -> entity/view`。
- [ ] “下一场参赛方”中间层必须支持 NPC 和玩家两类来源，不能把 `npc` 写死成 round 生成的唯一概念。
- [ ] 商店不是大对象：当前节点约 15 个商品应直接作为 `RestViewV5` 的小切片返回，不得因此恢复 full run，也不得让前端生成商品。
- [ ] `commandId` 只做幂等，不能参与训练、商店、重随、交换、战斗、结算随机。
- [ ] UI 是成品游戏界面。修数据来源时保留原休整页场景、NPC 对话、动画、卡片和布局，不把游戏 UI 替换成调试面板。

## Problems Found

### P0: 缺少 V5-native “下一场参赛方”中间层

- [ ] 当前设计把“下一场对手/NPC 队伍生成”封在 V4 `formalGame.ts` 的 full run 流程里，V5 只能通过 compat bridge 借用。
- [ ] 这说明 V5 迁移时没有先建立自己的规则层，只是把 V4 大对象藏到了后端。
- [ ] 修复目标：新增 V5-native participant generation layer，例如 `formalOpponentGenerationV5.ts`。
- [ ] 输入 DTO：`seed`、`roundIndex`、`nodeId`、`mode`、`ruleSet`、`battlePreference`、`competitionMode`、`playerProfile/teamProfile`、`difficulty`、`usedSpecies`、`sourceCandidates`。
- [ ] 输出 DTO：`GeneratedParticipantV5[]`，每个包含 `slot`、`sourceKind: "npc" | "player" | "ai-ally"`、`playerProfile`、`team`、`bag`、`npcProfile?`、`diagnostics`。
- [ ] 正式 room prepare 只把 `GeneratedParticipantV5` 实体化为 `PlayerInstance/PokemonInstance/Bag/ItemInstance`；不接收 full `FormalGameRunV4`。
- [ ] 未来联机玩家接入时，只需把玩家 candidate 放进同一个 participant layer，不新开 room prepare 路径。

### P0: `prepare-round` 正式路径仍走 compat formalRun

- [ ] `apps/api/src/server.ts:1191` 仍调用 `formalApi.prepareFormalRoundPlan(buildFormalRunCompatViewV5(match.runGameV5!))`，再 `ingestPreparedRoundPlanV5()` 写回 V5。
- [ ] `apps/api/src/runGameV5.ts:827` 的 `ingestPreparedRoundPlanV5()` 读取 `preparedRun.restRunSnapshot.gameMap`、`currentNodeId`、`coinLog`、`battleLog`。
- [ ] 这就是“为什么还有两个路径”的核心原因：正式 room prepare 不是一个纯 V5 prepare，而是 V4 计划结果再 ingest。
- [ ] 修复目标：新增/收口为一个 `prepareRestRoundV5(run, commandId)`，内部只调用 V5 participant layer 和 V5 shop helper，生成 `roundPlan/gameMap/trainingGround/shop/exchange`。
- [ ] 修复目标：`buildFormalRunCompatViewV5()` 只能留在 legacy/test adapter，`server.ts` 正式命令不得 import 或调用。
- [ ] 修复目标：`prepareRoundPlanFromDraftsV5()` 若保留，也只能接收 `GeneratedParticipantV5` 或 legacy/test draft，不作为正式主路径。

### P0: `prepare-battle` 合作 AI 队友仍走 compat battle session

- [ ] `apps/api/src/server.ts:1347` 在 coop 模式缺少 `p3` 时调用 `formalApi.prepareFormalBattleSession(buildFormalRunCompatViewV5(battleRunGameV5))`。
- [ ] `apps/api/src/server.ts:1351` 再把 compat `coopAllyDraft` 交给 `ingestFormalCoopAllyV5()`。
- [ ] 这和 prepare-round 是同一种污染：V5 为了生成参赛方，又绕回 V4 runtime API。
- [ ] 修复目标：合作 AI 队友也走同一个 `GeneratedParticipantV5` 中间层，sourceKind 为 `"ai-ally"`。
- [ ] 修复目标：`prepare-battle` 只能从当前 V5 node slots 构建 battle session；如果缺少必要 slot，应调用 V5 participant layer 补齐，而不是调用 V4 battle preparation。

### P0: 商店生成存在 fallback 补丁，不是唯一规则入口

- [ ] `apps/api/src/runGameV5.ts:844` 先读 `preparedRun.shopByNodeId`，没有才临时调用 `createFormalRestShopFromRuleContextV5()`。
- [ ] 这个 fallback 能缓解空商店，但不是根因修复；它仍把正式商店绑在 compat prepare 是否产出 `shopByNodeId` 上。
- [ ] `apps/api/src/runGameV5.ts:937` 的 `prepareRoundPlanFromDraftsV5()` 也生成 shop，形成第二条 prepare 语义。
- [ ] 修复目标：只有一个正式 V5 `getShopListV5(context)` / `createRestShopV5(context)`，prepare round 和 `shop.refresh` 共用它。
- [ ] 修复目标：购买后只标记 slot 售罄；刷新整店花 50 金币，递增服务端 roll，重新生成当前节点完整 shop。
- [ ] 修复目标：删除或 legacy-only 隔离 slot-level restock / compat shop fallback。

### P1: Rest scoped view 结构还不够直观

- [ ] `apps/api/src/runGameV5.ts:417` 返回 `rest: restStateForScopedRestViewV5(...)`，当前 shop 隐藏在 `rest.shopByNodeId[currentNode.id]`。
- [ ] `apps/api/src/runGameV5.ts:447`、`apps/api/src/runGameV5.ts:448` 直接返回完整 `coinLog/battleLog` 数组，后续长期运行可能增长。
- [ ] 修复目标：`RestViewV5` 明确暴露当前页需要的小切片：`shop`、`trainingGround`、`team`、`bag`、`currentNode`、`nextPreview`、`roundSettlement`、`recentCoinLog`、`recentBattleLog`。
- [ ] 修复目标：日志切片有上限，例如最近 20 条；完整历史只在专门调试/记录接口查看。

### P1: Battle view/display 仍是 V4-shaped 展示 adapter

- [ ] `apps/web/src/components/battle-v4/BattleV4Page.tsx` 的 room path 使用 `battleDisplayFromRoomBattleViewV5()`，但内部构造 `TrainingPlayerDraftV4`。
- [ ] 这不一定造成大对象传输，但会继续让战斗 UI 以 V4 draft 概念理解 V5 battle participant。
- [ ] 修复目标：定义 `RoomBattleDisplayContextV5`，直接消费 `RunGameBattleViewV5.participants/selfBag/battleBackground/stageLabel`。
- [ ] 修复目标：BattleV4Page 如继续承载旧 UI，应拆出 room-only display adapter，命名不能伪装成 `TrainingRunGameV4`。
- [ ] 修复目标：叙事训练家解析支持 participant source/profile，不再依赖 `selectedNpcIds + TrainingPlayerDraftV4`。

### P1: 前端 room 休整和 legacy 休整仍混在一个装配块

- [ ] `apps/web/src/App.tsx:1698` 同时构造 `roomRestDisplayModel` 和 `legacyFormalRestDisplayModel`，再传给同一个 `TrainingRestNewPage`。
- [ ] `apps/web/src/App.tsx:1714` 仍给页面传 `run={formalRestDisplayModel.legacyRun}`，依靠 `formalRoomCredential` guard 避免写回。
- [ ] `apps/web/src/App.tsx:1874` shop controller 同时保留 room V5 command 和 legacy 本地购买循环。
- [ ] `apps/web/src/App.tsx:1922` training controller 同时处理 room 小 result 和 legacy V4 result。
- [ ] 修复目标：拆 `RoomTrainingRestPageAdapter` 和 `LegacyTrainingRestPageAdapter`。两者复用同一套成品 UI 场景组件，但 controller/result contract 分开。
- [ ] 修复目标：room adapter 不接收 `run`、不保存 `restRunSnapshot`、不调用 `api.saveFormalGameRun()`。

### P1: Formal transition pages 仍是 room/legacy 双模式组件

- [ ] `FormalRoundTransitionPage` room 分支已走 `rooms.matches.commands.prepareRound`，但同文件仍包含 legacy `prepareFormalRoundPlan()` 和 full run 保存逻辑。
- [ ] `FormalBattleTransitionPage` room 分支已走 `rooms.matches.commands.prepareBattle`，但同文件仍包含 legacy `prepareFormalBattleSession()`、`markFormalRestBattleState()`、`saveFormalGameRun()`。
- [ ] 修复目标：拆 `FormalRoomRoundTransitionPage` / `FormalLegacyRoundTransitionPage`，以及 `FormalRoomBattleTransitionPage` / `FormalLegacyBattleTransitionPage`。
- [ ] 修复目标：room transition 文案不要再写“休整快照 / BattleGame V4”这种旧运行层暗示；只描述等待服务端 scoped view / battle session。

### P1: Room display model 仍是 V4-shaped

- [ ] `apps/web/src/components/training/TrainingRestRoomDisplayModel.ts:9`、`:10` 引入 `TrainingPlayerDraftV4` / `TrainingRunGameV4`。
- [ ] `apps/web/src/components/training/TrainingRestRoomDisplayModel.ts:24`、`:31`、`:42` 等字段用 V4 类型表达 room 展示。
- [ ] `apps/web/src/components/training/TrainingRestRoomDisplayModel.ts:102` 把 V5 player/team/bag 转成 `TrainingPlayerDraftV4`。
- [ ] 修复目标：定义 V5-native `RoomRestPlayerViewModel`、`RoomRestTeamViewModel`、`RoomRestNodeViewModel`、`RoomRestShopViewModel`。
- [ ] 修复目标：legacy mapper 可以继续输出 V4 shape；room mapper 不再把 V5 scoped view 先伪装成 V4 再显示。

### P1: 商店 UI 已有购物车，但仍保留单买 fallback 和 restock 动画语义

- [ ] `apps/web/src/components/training/TrainingRestShopScene.tsx` 同时支持 `onBuy` 和 `onBuyCart`，`buyCartViaSingleProductFallback()` 会循环单买。
- [ ] 组件中仍有 `restockingSlotId`、`pendingRestockRef`、`SHOP_RESTOCK_ANIMATION_MS` 等补货动画残留。
- [ ] 修复目标：正式 room UI 只走 `shop.buy-cart` 与 `shop.refresh`；单买 fallback 仅 legacy/local 可用。
- [ ] 修复目标：购买成功表现为售罄，刷新成功表现为整店换货；不要再暗示“买完自动补货”。

### P1: 背包 V5 command 仍使用 V4 bag shape 作为内部上下文

- [ ] `apps/api/src/server.ts` 的 `requireFormalBagActionContextV5()` / `applyBagUseEffectV5()` 使用 `TrainingPlayerDraftV4["bag"]` 拼内部上下文。
- [ ] 目前提交仍是实体级写回，没有发现 full run 传输；但类型层继续把 V5 背包规则绑定到 V4 draft bag。
- [ ] 修复目标：新增 `BagMutationContextV5`，字段为 `bagId`、`items: PlayerItemInstanceV4[]`、`team: LocalPokemonV4[]`、`item?`、`pokemon?`。
- [ ] 修复目标：item effect helper 可以复用纯函数，但 V5 command 不再暴露 `TrainingPlayerDraftV4["bag"]` 类型。

### P1: 训练/重随/交换规则需要继续做 KISS 审核

- [ ] `apps/api/src/formalRestRules.ts` 已有服务端小 context helper，这是正确方向，但命名仍大量带 `V4` 来源，需要确认只是复用纯规则，不是恢复 V4 权威。
- [ ] `training.apply` 批量自习必须只改目标 `PokemonInstance`、`Player.money`、`trainingGround.selfStudyRoll`、小型 coinLog/result。
- [ ] `pokemon.reroll-stats` 必须只改目标 `PokemonInstance`、`Player.money`、reroll roll、小型 coinLog/result。
- [ ] `pokemon.exchange` 必须使用服务端 exchange view/context，不能从前端传整只对手队伍作为权威。
- [ ] 修复目标：每个规则 helper 输入都是小 DTO，随机 seed 使用 `run seed + nodeId + server roll + target id`，不含 `commandId`、客户端时间、浏览器状态。

### P1: V4 规则参考需要反向依赖，不是 V5 依赖 V4

- [ ] 如果要复用成熟算法，必须把算法本身抽成 pure rule module；V4 legacy 可以反过来调用 pure module。
- [ ] V5 正式路径不得 import legacy adapter 或调用 `formalApi.prepareFormalRoundPlan()`、`formalApi.prepareFormalBattleSession()` 来获得参赛方/队伍。
- [ ] 旧 V4 的 full run、rest snapshot、roundPlan participants 只能作为测试对照或历史参考，不能作为 V5 runtime input。
- [ ] 修复目标：对“NPC 生成、商店生成、训练收益、重随、交换”分别标注 source-of-truth module，避免以后再次把 V4 runtime 当规则层。

### P1: Final result response 仍有 compat formalRun 出口

- [ ] `apps/api/src/server.ts:1990` 的 `finalResultResponse()` 仍会把 `finalResult.formalRun || formalRunOverride || activeMatch?.formalRun` 返回成 `formalRun`。
- [ ] V5 room 当前通常是 null，但这个出口本身会让正式 room final-result API 留下 full run fallback。
- [ ] 修复目标：V5 room final-result response 固定只返回 `profile/playerVault/settlementId/summary/room`；legacy final result 另走 dev/legacy endpoint 或显式 legacy response。
- [ ] 修复目标：`FormalRoomFinalResultV1.formalRun` 在 V5 path 中删除或保持 always-null 并从 response type 中拆出。

### P2: 旧 compat helper 虽未主用，但仍在正式模块附近暴露

- [ ] `apps/api/src/runGameV5.ts` 仍导出 `applyBattleFinalizedResultV5(input.compatRun)`。
- [ ] `apps/api/src/runGameV5.ts` 仍导出 `ingestPreparedRoundPlanV5()`，smoke 中也直接用 compat builder 覆盖 V5 红线测试。
- [ ] 修复目标：这些 helper 移到 `runGameV5CompatLegacy.ts` 或 `formal-game-smoke` 专用 legacy test adapter；正式 `runGameV5.ts` 不导出 compat-ingest 函数。
- [ ] 修复目标：V5 smoke 不再用 `buildFormalRunCompatViewV5(v5Run)` 证明 V5；应直接走 V5 participant/shop/battle/finalize API。

### P2: 正式 room 红线扫描还没有固定成常规验收

- [ ] 增加或更新 smoke/redline 脚本，扫描正式 room 响应、command result、commandLog。
- [ ] 禁止字段：`formalRun`、`restRunSnapshot`、`runGameV5`、`playersById`、`pokemonById`、`bagsById`、`itemInstancesById`、`commandLog`。
- [ ] 禁止正式路径命中：`buildFormalRunCompatViewV5(match.runGameV5)`、`preparedRun.shopByNodeId`、`formalRunDraft`、`syncDraft`、`rooms.matches.commands.restAction`。
- [ ] 额外禁止正式路径命中：`prepareFormalBattleSession(buildFormalRunCompatViewV5`、`applyBattleFinalizedResultV5(`、`finalResultResponse(... formalRun`。

### P2: ChromeAutomation 验收纪律要改成真实成功路径

- [ ] 启动当前 workspace 的 API，不使用旧长驻服务；先检查 health 和 API base URL。
- [ ] 使用测试模式或测试 seed/资金，验证训练、购物车、刷新、重随的成功路径，不再只测 0 金币失败路径。
- [ ] 点击弹窗要按真实用户路径关闭，例如“课程结束/返回休息室”，不要 DOM 强点后续场景造成假问题。
- [ ] 每次声称通过前检查 Network 与 localStorage，确认没有 forbidden big object。

## Implementation Order

1. [ ] 先建立 V5-native “下一场参赛方”中间层：`context -> GeneratedParticipantV5[]`，NPC 和玩家来源都走这个接口。
2. [ ] 改服务端 prepare-round：删除正式路径上的 compat prepare，落一个纯 V5 `prepareRestRoundV5()`。
3. [ ] 收口商店：一个 `getShopListV5(context)`，prepare/refresh 共用；购买只售罄；刷新整店。
4. [ ] 明确 `RestViewV5` 当前页切片：直接给当前 shop，不让 UI 到 `shopByNodeId` 里猜。
5. [ ] 拆 front-end room/legacy transition adapter：round/battle transition 不再双模式混写。
6. [ ] 拆前端 room/legacy rest adapter：保留原 UI 场景和 CSS，只换输入/回调 contract。
7. [ ] 把 `TrainingRestRoomDisplayModel` 改成 V5-native 类型，不再构造 `TrainingRunGameV4`/`TrainingPlayerDraftV4`。
8. [ ] 把 battle room display 改成 V5-native context，不再构造 `TrainingPlayerDraftV4`。
9. [ ] 清理 shop UI 的正式 room 单买 fallback 与补货动画语义。
10. [ ] 隔离 runGameV5 compat ingest/finalize helper 和 V5 smoke 中的 compat builder。
11. [ ] 加红线扫描和 API smoke 断言。
12. [ ] 跑 ChromeAutomation 完整休整成功路径。

## Verification Plan

### Static

- [ ] `pnpm --filter @changebattle-v2/api typecheck`
- [ ] `pnpm --filter @changebattle-v2/web typecheck`
- [ ] `pnpm --filter @changebattle-v2/desktop typecheck`
- [ ] `pnpm --filter @changebattle-v2/mobile typecheck`
- [ ] `pnpm --filter @changebattle-v2/api test:formal-game`
- [ ] `git diff --check`

### Redline

- [ ] `rg "buildFormalRunCompatViewV5\\(match\\.runGameV5\\)|preparedRun\\.shopByNodeId|formalRunDraft|syncDraft|rooms\\.matches\\.commands\\.restAction" apps/api/src apps/web/src -g '*.ts' -g '*.tsx'`
- [ ] `rg "prepareFormalRoundPlan\\(|prepareFormalBattleSession\\(|runGameV5CompatLegacy" apps/api/src/server.ts apps/api/src/runGameV5.ts apps/api/src/formal-room* apps/api/src/*V5*.ts`
- [ ] `rg "applyBattleFinalizedResultV5|ingestPreparedRoundPlanV5|buildFormalRunCompatViewV5\\(v5Run\\)|finalResultResponse" apps/api/src/runGameV5.ts apps/api/src/server.ts apps/api/src/formal-game-smoke.ts`
- [ ] `rg "formalRun|restRunSnapshot|runGameV5|playersById|pokemonById|bagsById|itemInstancesById|commandLog" <captured-room-responses-and-command-results>`
- [ ] `rg "TrainingRunGameV4|TrainingPlayerDraftV4|legacyRun" apps/web/src/components/training/TrainingRestRoomDisplayModel.ts apps/web/src/App.tsx`
- [ ] `rg "TrainingRunGameV4|TrainingPlayerDraftV4|legacyRun" apps/web/src/components/battle-v4/BattleV4Page.tsx apps/web/src/components/formal/FormalBattleTransitionPage.tsx apps/web/src/components/formal/FormalRoundTransitionPage.tsx`

### API Smoke

- [ ] 创建 room -> match -> ready/start -> starter -> `prepare-round` -> `GET view?scope=rest`。
- [ ] `prepare-round` 断言下一场 `node.slots` 来自 `GeneratedParticipantV5` 实体化，NPC/player source 都保留 sourceKind。
- [ ] 固定 seed/round/player profile，生成下一场 NPC 结果可复现；同一 context 不依赖 `commandId`。
- [ ] coop `prepare-battle` 缺少 p3 时通过 V5 participant layer 生成 AI 队友，不调用 V4 battle preparation。
- [ ] Rest view 直接包含当前 shop，商品数量与分类符合规则，且响应无 forbidden big object。
- [ ] `shop.buy-cart`：多选成功一次，原子扣钱/加道具/slot 售罄；重复 commandId 不重复扣钱。
- [ ] `shop.refresh`：扣 50，server roll +1，当前节点整店重刷；金币不足失败不推进 roll。
- [ ] `training.apply`：自习 2 轮成功，扣总费用，`selfStudyRoll +2`，只改目标 PokemonInstance。
- [ ] `pokemon.reroll-stats`：固定 seed + roll 可复现，commandId 变化不影响随机结果。
- [ ] `pokemon.exchange`：只接受 source/target id，小 result + scoped rest view 返回。
- [ ] `finalize-battle` 和 `finalize-run` 响应无 compat run；`final-result` endpoint 对 V5 room 不返回 `formalRun`。

### ChromeAutomation

- [ ] 启动当前 source API，例如 memory 模式 `127.0.0.1:5192`，Web `127.0.0.1:5188` 指向该 API。
- [ ] health 明确显示当前服务与 storage 类型，避免测到旧服务。
- [ ] 用测试模式/测试资金跑：主页 -> 创建房间 -> 创建对局 -> starter -> rest。
- [ ] 自习 2 轮成功，正常点击结果弹窗结束。
- [ ] 商店商品可见，购物车多选一次购买，买后售罄，刷新整店成功。
- [ ] 重随、治疗、背包、排序至少各点一次。
- [ ] 进入战斗 smoke，确认休整改动没有破坏后续流程。
- [ ] Network/localStorage 审计无 forbidden big object。

## Do Not Do

- [ ] 不恢复 full `formalRun/restRunSnapshot` 来修商店或 UI。
- [ ] 不通过 “V5 小 wrapper -> V4 formal run API” 来生成下一场对手。
- [ ] 不把 NPC 写死成 prepare-round 的唯一参赛方来源；中间层必须能接玩家/联机 candidate。
- [ ] 不让前端生成、补货、定价或提交商品对象作为权威。
- [ ] 不用通用 helper 兜底脏数据或兼容坏结构；修 writer/validator/主路径。
- [ ] 不把原休整 UI 换成简化 debug 面板。
- [ ] 不把“失败提示路径能显示”当成成功路径验收。
- [ ] 不在未确认 GitHub Actions 触发规则前推 release 相关分支。
