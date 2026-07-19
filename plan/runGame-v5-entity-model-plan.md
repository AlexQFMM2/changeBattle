# RunGame V5 实体化数据模型重构计划

## Summary

RunGame V5 的目标是把正式游戏状态从“一个到处复制完整对象的大 JSON”改成“实体 + 引用”的权威模型。

核心原则：

```text
Player 拥有玩家运行态。
PokemonInstance 拥有宝可梦运行态。
Bag / ItemInstance 拥有背包和道具运行态。
GameMap / Round / Battle 只引用实体 ID，不复制实体内容。
页面需要完整对象时，由服务端组装 view；view 不能反向当存档权威。
```

这次重构要解决当前 `TrainingRunGameV4` 的根问题：`gameMap[].participants` / `roundPlan[].participants` 里保存了完整 `TrainingPlayerDraftV4`，导致同一个玩家的 `localTeam / bag / coins / Pokemon` 被复制到多个位置，服务端化后出现“保存的是 Player，开战却读到旧 node participant”的状态撕裂。

## Red Lines

以下规则是红线，后续实现、review、测试都按这些判断：

- `gameMap` 不允许保存完整 `Player`。
- `gameMap` 不允许保存 `localTeam`。
- `gameMap` 不允许保存 `bag`。
- `gameMap` 不允许保存 `coins / money`。
- `gameMap` 不允许保存完整 `PokemonInstance` 或完整 `ItemInstance`。
- `roundPlan` 不允许保存完整 `Player`。
- `roundPlan` 不允许保存完整 `localTeam / bag / PokemonInstance / ItemInstance`。
- `BattleRecord` 不允许成为 Player/Pokemon/Bag 的第二份权威；它只保存战斗输入引用、选择记录、结果和必要快照索引。
- `View` 不允许写回 Redis 作为权威 RunGame；View 只是服务端根据实体组装出的展示结果。
- 同一个会变化的字段只能有一个权威位置。
- `Player.localTeamPokemonIds` 是队伍顺序唯一权威。
- `Player.bagId` 是玩家背包唯一入口。
- `Player.money` 是金币余额唯一权威。
- `PokemonInstance.hp/status/pp/heldItemInstanceId` 是宝可梦局内状态唯一权威。
- `Bag.itemInstanceIds` 和 `ItemInstance` 是背包内容唯一权威。
- 开战生成 Showdown team 只能走 `node.slots -> playerId -> Player.localTeamPokemonIds -> PokemonInstance`。
- C 端任何会和服务端交互的确认操作都必须等待服务端返回，期间显示遮罩加载弹窗；结果只允许是成功、失败、超时三类。
- 服务端确认操作不能后台静默同步后继续让玩家操作；失败或超时时本地权威状态不能提交。
- 同一个确认动作必须有稳定 `commandId`；超时后重试不得重复扣钱、重复结算或重复增加 revision。

## Target Model

### RunGameV5

```ts
type RunGameV5 = {
  version: 5;
  runId: string;
  roomId: string;
  matchId: string;

  status:
    | "not_started"
    | "starter_selecting"
    | "resting"
    | "battle_preparing"
    | "battling"
    | "battle_settling"
    | "settlement_ready"
    | "ended"
    | "closed";

  phase:
    | "lobby"
    | "starter"
    | "rest"
    | "battle"
    | "settlement";

  revision: number;
  createdAt: string;
  updatedAt: string;

  config: RunGameConfigV5;

  playersById: Record<PlayerInstanceId, PlayerInstanceV5>;
  pokemonById: Record<PokemonInstanceId, PokemonInstanceV5>;
  bagsById: Record<BagInstanceId, BagInstanceV5>;
  itemInstancesById: Record<ItemInstanceId, ItemInstanceV5>;

  gameMap: GameMapV5;
  currentNodeId: GameNodeId | null;

  economy: EconomyStateV5;
  battleRecordsByNodeId: Record<GameNodeId, BattleRecordV5>;
  roundRecordsByNodeId: Record<GameNodeId, RoundRecordV5>;

  commandLog: Record<CommandId, CommandResultRecordV5>;
  eventLog: RunGameEventV5[];

  finalResult?: FinalResultV5;
};
```

第一版 Redis 可以仍然按 `cb:run:{runId}` 保存整个 `RunGameV5` JSON，不急着拆成多个 Redis key。实体化是数据结构边界，不要求第一刀就物理拆库。

### RunGameConfigV5

对局偏好属于 Match / RunGame 配置快照，不属于 Player，也不属于 GameMap。

```ts
type RunGameConfigV5 = {
  mode: "singles" | "doubles" | "coop";
  ruleSet: "gen9" | "gen8" | "gen7";
  competitionMode: "group" | "top8" | "single_run";
  seed: string;
  createdByMemberId: string;

  battlePreference: {
    regionRestriction?: string;
    battleEnvironment?: string;
    legendaryAllowed: boolean;
    battleBagEnabled: boolean;
    npcTeamPreference?: string;
    difficultyProfile?: string;
  };
};
```

房间页里创建对局时编辑偏好；确认创建 Match 后保存为配置快照。已创建的 Match 不受外部设置变化影响。

### PlayerInstanceV5

玩家实例是局内 Player 权威状态。真人玩家和 NPC 都是 Player。

```ts
type PlayerInstanceV5 = {
  playerId: string;
  slot: "p1" | "p2" | "p3" | "p4";

  kind: "human" | "npc";
  controller: "local" | "ai" | "script";

  ownerMemberId?: string;
  roomCustomId?: string;

  name: string;
  avatar: string;

  profileSnapshot?: UserProfileSnapshotV5;
  starChartSnapshot?: StarChartSnapshotV5;
  npcProfile?: NpcPlayerProfileV5;

  money: number;
  bagId: string;
  localTeamPokemonIds: string[];

  ready: boolean;
  connectionState: "online" | "offline" | "disconnected";

  createdAt: string;
  updatedAt: string;
};
```

### NpcPlayerProfileV5

AI/NPC 的等级、身份、策略写在 NPC Player 上。

```ts
type NpcPlayerProfileV5 = {
  trainerId: string;

  rank:
    | "rookie"
    | "trainer"
    | "gym_leader"
    | "elite"
    | "champion"
    | "villain"
    | "boss";

  rankLabel: string; // 菜鸟 / 普通训练家 / 馆主 / 精英 / 冠军 / Boss

  aiProfile: {
    difficulty: "easy" | "normal" | "hard" | "expert" | "boss";
    strategy: "balanced" | "aggressive" | "defensive" | "stall" | "setup" | "random";
    mistakeRate?: number;
    switchRate?: number;
    itemUseRate?: number;
  };

  teamProfile: {
    preference: "balanced" | "type_theme" | "weather" | "stall" | "offense" | "boss_signature";
    targetLevel: number;
    teamSize: number;
    allowedSpeciesPoolId?: string;
    signaturePokemonId?: string;
  };

  generatedBy: {
    nodeId: string;
    seed: string;
    generatedAt: string;
  };
};
```

NPC 生成流程：

```text
生成 NPC Player
  -> 写入 playersById
生成 NPC PokemonInstance
  -> 写入 pokemonById
  -> NPC Player.localTeamPokemonIds 引用这些 pokemonId
生成 NPC Bag/ItemInstance
  -> 写入 bagsById / itemInstancesById
GameMap node.slots.p2 = npcPlayerId
```

### PokemonInstanceV5

宝可梦实例是独立实体。

```ts
type PokemonInstanceV5 = {
  pokemonId: string;
  ownerPlayerId: string;

  speciesId: string;
  nickname?: string;
  level: number;
  shiny?: boolean;

  nature: string;
  abilityId: string;
  ivs: StatTable;
  evs: StatTable;

  moves: PokemonMoveInstanceV5[];

  maxHp: number;
  hp: number;
  status: string;
  friendship?: number;
  honorBadges?: string[];

  heldItemInstanceId?: string;

  origin: {
    source: "starter" | "exchange" | "vault" | "npc_generated" | "soulmate_egg";
    sourcePlayerPokemonId?: string;
    generatedByNodeId?: string;
  };

  locks?: {
    ivs?: Partial<Record<StatId, boolean>>;
    evs?: Partial<Record<StatId, boolean>>;
    moves?: Partial<Record<number, boolean>>;
  };

  createdAt: string;
  updatedAt: string;
};
```

调整队伍顺序只改：

```ts
playersById[playerId].localTeamPokemonIds = nextPokemonIds;
```

### BagInstanceV5 / ItemInstanceV5

背包和道具实例独立。

```ts
type BagInstanceV5 = {
  bagId: string;
  ownerPlayerId: string;
  maxSize: number;
  itemInstanceIds: string[];
};

type ItemInstanceV5 = {
  itemInstanceId: string;
  ownerPlayerId: string;
  bagId: string;

  itemId: string;
  quantity: number;

  kind: "medicine" | "held" | "battle" | "tm" | "berry" | "system" | "misc";
  canSell: boolean;
  locked?: boolean;

  origin: {
    source: "starter_bag" | "shop_buy" | "battle_reward" | "vault_import" | "system";
    commandId?: string;
    nodeId?: string;
  };

  createdAt: string;
  updatedAt: string;
};
```

携带道具只改 `PokemonInstance.heldItemInstanceId`；背包内容仍然由 `Bag.itemInstanceIds` 管。

### GameMapV5

GameMap 只描述赛程节点、状态和 slot 到 Player 的绑定。

```ts
type GameMapV5 = {
  nodesById: Record<GameNodeId, GameNodeV5>;
  nodeOrder: GameNodeId[];
};

type GameNodeV5 = {
  nodeId: string;
  index: number;

  state:
    | "locked"
    | "ready"
    | "battle_preparing"
    | "battling"
    | "won"
    | "lost"
    | "skipped"
    | "closed";

  mode: "singles" | "doubles" | "coop";
  ruleSet: string;
  seed: string;

  slots: Partial<Record<"p1" | "p2" | "p3" | "p4", PlayerInstanceId>>;

  npcGenerationPlan?: Partial<Record<"p2" | "p3" | "p4", {
    trainerId?: string;
    trainerRank?: NpcPlayerProfileV5["rank"];
    seed: string;
  }>>;

  battleRecordId?: string;

  createdAt: string;
  startedAt?: string;
  endedAt?: string;
};
```

`npcGenerationPlan` 只表示计划生成什么 NPC。生成完成后，NPC 权威信息落到 `playersById[playerId].npcProfile`，队伍落到 `pokemonById`，背包落到 `bagsById / itemInstancesById`，GameMap 只保留 playerId 引用。

### EconomyStateV5

金币余额在 `Player.money`，金币流水在 `economy.coinLedger`。

```ts
type EconomyStateV5 = {
  coinLedger: CoinLedgerEntryV5[];
};

type CoinLedgerEntryV5 = {
  ledgerId: string;
  commandId: string;

  playerId: string;
  nodeId?: string;

  reason:
    | "shop_buy"
    | "shop_sell"
    | "heal"
    | "training"
    | "exchange_fee"
    | "opponent_preview"
    | "insurance_buy"
    | "battle_reward"
    | "settlement_reward"
    | "refund"
    | "debug";

  amount: number;
  balanceBefore: number;
  balanceAfter: number;

  relatedItemInstanceIds?: string[];
  relatedPokemonIds?: string[];

  createdAt: string;
};
```

所有加钱/扣钱 command 必须同时更新 `Player.money` 和追加 `CoinLedgerEntryV5`。同 `commandId` 重试不能重复写流水。

### BattleRecordV5

战斗记录保存协议和结果，不保存第二份 Player/Pokemon 权威状态。

```ts
type BattleRecordV5 = {
  battleRecordId: string;
  nodeId: string;

  sessionId: string;
  battleGameId: string;

  status:
    | "preparing"
    | "running"
    | "finished"
    | "finalized"
    | "lost_session";

  participants: Partial<Record<"p1" | "p2" | "p3" | "p4", PlayerInstanceId>>;

  startedAt: string;
  finishedAt?: string;
  finalizedAt?: string;

  turnRecords: BattleTurnRecordV5[];
  choiceRecords: BattleChoiceRecordV5[];

  result?: {
    winnerSlot?: "p1" | "p2" | "p3" | "p4";
    outcome: "win" | "loss" | "surrender" | "draw";
    reason: string;
  };

  snapshotRef?: {
    kind: "memory" | "redis" | "object_storage";
    key: string;
  };

  timelineRef?: {
    kind: "redis" | "object_storage";
    key: string;
  };
};

type BattleChoiceRecordV5 = {
  commandId: string;
  playerId: string;
  turn: number;
  rqid?: string;
  choice: string;
  accepted: boolean;
  createdAt: string;
};

type BattleTurnRecordV5 = {
  turn: number;
  startedAt: string;
  endedAt?: string;
  summary: string[];
};
```

战斗结束后，`finalize-battle` 根据 battle result 更新实体：

- 更新 `PokemonInstance.hp/status/pp`。
- 更新 `Player.money` 和 `economy.coinLedger`。
- 更新 `GameNode.state`。
- 更新 `BattleRecord.status/result`。
- 生成或更新 `RoundRecordV5`。

## Command Model

所有改变状态的操作通过 command 修改实体。

```ts
type CommandEnvelopeV5 = {
  commandId: string;
  baseRevision: number;
  actorMemberId: string;
  payload: RunGameCommandV5;
};
```

休整 command 第一批：

```ts
type RestCommandV5 =
  | {type: "team.reorder"; playerId: string; pokemonIds: string[]}
  | {type: "team.heal"; playerId: string}
  | {type: "pokemon.exchange"; playerId: string; sourcePokemonId: string; targetPokemonId: string}
  | {type: "shop.buy"; playerId: string; productId: string}
  | {type: "shop.sell"; playerId: string; itemInstanceIds: string[]}
  | {type: "training.apply"; playerId: string; pokemonId: string; lessonId: string}
  | {type: "bag.use"; playerId: string; itemInstanceId: string; targetPokemonId?: string}
  | {type: "bag.equip"; playerId: string; itemInstanceId: string; pokemonId: string}
  | {type: "bag.unequip"; playerId: string; pokemonId: string}
  | {type: "opponentPreview.unlock"; playerId: string; nodeId: string}
  | {type: "insurance.buy"; playerId: string}
  | {type: "soulmateEgg.claim"; playerId: string; candidateId: string};
```

响应：

```ts
type CommandResultV5 =
  | {
      ok: true;
      revision: number;
      phase: RunGameV5["phase"];
      view: RunGameViewV5;
    }
  | {
      ok: false;
      error: string;
      message: string;
      retryable: boolean;
      currentRevision?: number;
      view?: RunGameViewV5;
    };
```

## View Model

客户端消费 view，不直接消费 Redis 权威结构。

```ts
type RunGameViewV5 = {
  runId: string;
  revision: number;
  phase: RunGameV5["phase"];

  selfPlayer: PlayerViewV5;
  players: PlayerViewV5[];

  currentNode?: GameNodeViewV5;
  gameMap: GameMapViewV5;

  restView?: RestViewV5;
  battleView?: BattleViewV5;
  settlementView?: SettlementViewV5;
};
```

迁移期允许服务端提供：

```ts
buildFormalRunCompatView(runGameV5): FormalGameRunV4
```

但兼容 view 只能给旧组件展示，不能写回 Redis 当权威 RunGame。

## Migration Plan

1. 新增 `RunGameV5` 类型和本文档红线，不立刻删除 V4。
2. 新增 V5 创建器：创建 Match 时生成 `RunGameV5`，包括 human Player、starter Pokemon、Bag、ItemInstance。
3. 新增 NPC 生成器：生成 NPC Player、PokemonInstance、Bag/ItemInstance，GameMap node 只绑定 npc playerId。
4. 新增 `buildRunGameViewV5()`，给 C 端页面提供 view。
5. 新增 `buildFormalRunCompatView()`，短期兼容旧休整页和战斗页展示。
6. `prepare-battle` 改为从 `node.slots -> playersById -> localTeamPokemonIds -> pokemonById` 构建 Showdown team。
7. 休整操作改成 V5 command，先覆盖排序、治疗、交换、购买、训练。
8. 背包、出售、打听、保险、灵魂蛋等后续 command 化，全部只修改实体。
9. `finalize-battle` 改成把战斗结果写回 `PokemonInstance / Player / Economy / BattleRecord / GameNode`。
10. `finalize-run` 从 V5 实体生成 settlement summary、profile delta、vault delta。
11. C 端逐页去掉对 `formalRun.restRunSnapshot.gameMap.participants.*.localTeam` 的依赖。
12. 冻结旧 `/rooms/:roomId/formal/*` 主线，所有新流程只走 match-scoped command。
13. 删除 V4 冗余快照写回逻辑。

## Tests Required

- 创建 RunGameV5 后，`gameMap` JSON 中不得出现 `localTeam`、`bag`、`money`。
- 创建 NPC 后，NPC 完整信息必须在 `playersById[npcPlayerId]`，GameMap 只能引用 `npcPlayerId`。
- 队伍排序只改变 `Player.localTeamPokemonIds`，不改变 GameMap 结构。
- 购买只改变 `Player.money`、`Bag.itemInstanceIds`、`ItemInstance` 和 `coinLedger`。
- 治疗只改变目标 Player 队伍里的 `PokemonInstance.hp/status/pp` 和金币流水。
- 开战生成 Showdown team 时，使用 Player 当前队伍顺序。
- 同 `commandId` 重试不重复扣钱、不重复生成道具、不重复改队伍。
- `baseRevision` 旧时拒绝写入，并返回当前 view。
- `buildFormalRunCompatView()` 生成的 V4 view 不允许被直接保存成 V5 权威。

## Stop Point

第一刀只要求完成服务端 V5 权威结构和 view/compat adapter，不要求一次性把所有旧页面删干净。

验收口径：

```text
服务端 Redis 里的 RunGameV5 不再在 gameMap/roundPlan 复制 Player/localTeam/bag。
进入战斗时，Showdown team 来自 Player.localTeamPokemonIds 当前顺序。
旧页面通过 view/compat 暂时可用，但不能反向污染权威数据。
```

## V5 Redline Scanner Checklist

扫描时间：2026-07-19。
目的：把“流程能跑通”和“V5 权威模型真的完成”拆开验收。下面清单没有全部 `[x]` 前，不能再声称 C/S 正式流程已经完成。

### 红线明确

红线第一遍：

- `buildFormalRunCompatViewV5()` 只能生成展示 view，不能作为 command 写入源。
- `ingestFormalRunCompatStateV5()` 不能留在新 room 主线 command 中。
- `RunGameV5.commandLog` 只能保存小型幂等结果，不能保存 `run`、`formalRun`、`restRunSnapshot`、`gameMap`、`participants`。
- `Room.finalResult` 只能保存轻量 final result、profile/vault delta、settlement summary；不能长期保存完整 `formalRun`。
- `/rooms/:roomId/formal/*`、`formalRunDraft`、`syncDraft` 只能作为 legacy/dev 路径，不能被 Web/Desktop/Android 正式 room 主线调用。

红线第二遍：

- 不允许 view 反向写回 Redis。
- 不允许 compat V4 run 反向摄取成 V5 权威。
- 不允许 commandLog 存大对象。
- 不允许 room 主线调用旧 V4 rest helper 推进状态。
- 不允许通过提高 `CHANGEBATTLE_ROOM_MAX_BYTES` 掩盖数据结构错误。

红线第三遍：

- `Player.localTeamPokemonIds` 是队伍顺序唯一权威。
- `Player.money` 是金币余额唯一权威。
- `PokemonInstance` 是宝可梦局内状态唯一权威。
- `Bag / ItemInstance` 是背包与道具唯一权威。
- `GameMap / RoundPlan / BattleRecord` 只引用实体 ID，不复制实体内容。

### 扫描命令

后续每次 V5 收口都必须跑这些扫描，命中项必须逐条解释：

```bash
rg -n "buildFormalRunCompatViewV5|ingestFormalRunCompatStateV5|formalRunDraft|sync-draft|syncDraft|result\\.run|commandLog|formalRunFromMatch|publicMatch|advanceRoomMatchV5|buildFormalMatchView" apps/api/src apps/web/src -g '*.ts' -g '*.tsx'
rg -n "applyFormalTrainingGroundLesson|healFormalRestTeam|buyFormalRestShopItem|sellFormalRestBagItems|exchangeFormalRestPokemon|rerollFormalRestPokemonStats|unlockFormalRestOpponentPreview|chooseFormalMedicalInsurance|claimFormalSoulmateEgg|applyFormalBagUseAction|applyFormalBagEquipAction|applyFormalBagUnequipAction|applyFormalBagDiscardAction" apps/api/src/server.ts apps/api/src/formalGame.ts apps/web/src/App.tsx
rg -n "saveFormalGameRun|loadFormalGameRun|deleteFormalGameRun|persistServerConfirmedFormalRun|applyFormalRunView|setFormalRun\\(" apps/web/src/App.tsx apps/web/src -g '*.tsx' -g '*.ts'
rg -n "restActionResults|draftSyncResults|finalResult|activeBattle|formalRun:" apps/api/src/server.ts apps/api/src/runGameV5.ts
```

### 当前扫描结果

- [x] `RunGameV5` 基础实体容器已存在：`playersById / pokemonById / bagsById / itemInstancesById / gameMap.slots / roundPlan.slots`。
- [x] `select-starters` 已走实体引用：starter candidate 的完整 Pokemon 转为 `pokemonById`，玩家队伍写 `Player.localTeamPokemonIds`。
- [x] `team.reorder` 已是实体级写入：只改 `Player.localTeamPokemonIds`，commandLog 只存 `pokemonIds`。
- [x] `sync-draft` match command 当前直接返回 410，不接受整份正式流程草稿。
- [x] `saveRoom()` 有 1MB 房间大小保护，能暴露大对象污染问题。
- [ ] `rest-action` 仍违反红线：`apps/api/src/server.ts` 中 `rest-action` 先 `buildFormalRunCompatViewV5()`，再 `applyFormalRestActionToRun()`，再 `ingestFormalRunCompatStateV5()` 写回。
- [ ] `training.apply` 仍违反红线：当前调用 `formalApi.applyFormalTrainingGroundLesson(run, input)`，返回 `{ok, run, message, lesson}`，其中 `run` 是完整 V4 `FormalGameRunV4`。
- [ ] `team.heal` 仍违反红线：当前调用 `formalApi.healFormalRestTeam(run)`，返回完整 V4 run。
- [ ] `pokemon.exchange` 仍违反红线：当前调用 `formalApi.exchangeFormalRestPokemon(run, ...)`，返回完整 V4 run。
- [ ] `shop.buy` 仍违反红线：当前调用 `formalApi.buyFormalRestShopItem(run, slotId)`，返回完整 V4 run。
- [ ] `shop.sell` 仍违反红线：当前调用 `formalApi.sellFormalRestBagItems(run, itemInstanceIds)`，返回完整 V4 run。
- [ ] `pokemon.reroll-stats` 仍违反红线：当前调用 `formalApi.rerollFormalRestPokemonStats(run, input)`，返回完整 V4 run。
- [ ] `opponent-preview.unlock` 仍违反红线：当前调用 `formalApi.unlockFormalRestOpponentPreview(run, input)`，返回完整 V4 run。
- [ ] `insurance.buy` 仍违反红线：当前调用 `formalApi.chooseFormalMedicalInsurance(run, choice)`，返回完整 V4 run。
- [ ] `soulmate-egg.claim` 仍违反红线：当前调用 `formalApi.claimFormalSoulmateEgg(run, playerVaultSnapshot, ...)`，返回完整 V4 run，并混入外部 vault snapshot。
- [ ] `bag.use` 仍违反红线：当前 `applyFormalBagUseAction()` 读取 `p1.localTeam / p1.bag` 并用 `patchFormalBagActionP1()` 写回 V4 player/gameMap participants。
- [ ] `bag.equip` 仍违反红线：当前 `applyFormalBagEquipAction()` 修改 V4 `localTeam` 后 patch 回 rest snapshot。
- [ ] `bag.unequip` 仍违反红线：当前 `applyFormalBagUnequipAction()` 修改 V4 `localTeam` 后 patch 回 rest snapshot。
- [ ] `bag.discard` 仍违反红线：当前 `applyFormalBagDiscardAction()` 修改 V4 `bag/localTeam` 后 patch 回 rest snapshot。
- [ ] `commandLog` 类型仍过宽：`result: unknown` 允许完整 `result.run` 被保存。
- [ ] `appendCommandLog()` 未做大对象红线检查：没有拒绝 `run/formalRun/restRunSnapshot/gameMap/participants/localTeam/bag/pokemon/items`。
- [ ] `ingestFormalRunCompatStateV5()` 本身是污染入口：从 compat run 读取 `restRunSnapshot.players`、`gameMap.participants`、`money`、`coinLog`、`battleLog` 后写入 V5。
- [ ] `prepare-round` 仍通过 `formalApi.prepareFormalRoundPlan(formalRunFromMatch(match))` 生成旧 V4 round，再 `ingestPreparedRoundPlanV5()`；短期可作为 NPC 生成桥，但必须标成迁移债，不能扩张。
- [ ] `prepare-battle` 仍生成 compat run 后调用 `formalApi.prepareFormalBattleSession(compatRun)`；必须确认 Showdown team 的最终来源只走 `node.slots -> Player.localTeamPokemonIds -> PokemonInstance`，否则返工。
- [ ] `finalize-battle` 仍违反红线：当前 `buildFormalRunCompatViewV5()` -> `formalApi.finalizeFormalBattleResultV4()` -> `ingestFormalRunCompatStateV5()`，不是实体级写回 HP/status/PP/money/BattleRecord/GameNode。
- [ ] `finalize-run` 仍违反红线：当前 `buildFormalRunCompatViewV5()` -> `formalApi.prepareFormalSettlement()` -> `ingestFormalRunCompatStateV5()`，并把完整 `formalRun` 放进 `finalResult`。
- [ ] `finalResultResponse()` 仍返回 `finalResult.formalRun`；结算恢复路径还依赖完整 compat run。
- [ ] `publicMatch()` 当前对每个 match 都生成 `formalRunFromMatch(match)`；公共 room payload 可能携带完整 compat `formalRun`，需要改为轻量 match summary + 当前 view 按需返回。
- [ ] `publicRoom()` 当前包含 `formalRun` 和 `matches.publicMatch()`；必须拆成轻量 room index，避免房间列表/WS 广播带完整 run。
- [ ] `broadcastRoomUpdated()` / WS payload 当前带 `formalRun`；必须改成 revision + room summary，页面需要时自己 GET match view。
- [ ] legacy `/rooms/:roomId/formal/sync-draft`、`/formal/rest-action`、旧 battle/finalize endpoint 仍在 server 中；必须明确隔离为 legacy，正式 room 主线不可调用。
- [ ] `postService.ts` 仍注册 `rooms.syncDraft`、`rooms.restAction` 等 legacy action；正式 room 主线不得 import/调用，最终应移出共享正式 API facade。
- [ ] `apps/api/src/index.ts` 仍暴露 `syncFormalRoomDraft / submitFormalRoomRestAction / prepareFormalRoomBattle` 等 draft 型 API；正式 room C 端不得调用，最终应标 legacy 或删除。
- [ ] `apps/web/src/App.tsx` 中 room rest command 成功后仍消费 `response.data.view.formalRun`；短期可展示，长期要改为 `RunGameViewV5`。
- [ ] `apps/web/src/App.tsx` 中非 room legacy 分支还调用旧 `api.*Formal*` helper；训练场/legacy 可保留，但必须和 room 主线有硬边界。
- [ ] `FormalBattleTransitionPage / FormalBattleResultTransitionPage / FormalSettlementTransitionPage / FormalStarterSelectPage / FormalRoundTransitionPage` 仍有 `saveFormalGameRun()` 路径；必须确认 room 模式不会落入本地大缓存。
- [ ] `TrainingRestNewPage` 和子组件仍以 `result.run.restRunSnapshot` 驱动局部更新；room 模式必须由服务端 command response 覆盖 view，不能把组件产物当权威。
- [ ] 缺少“执行两次训练后 Redis room size 稳定”的自动测试。
- [ ] 缺少“commandLog 不含完整 run/formalRun/restRunSnapshot”的自动测试。
- [ ] 缺少“publicRoom / WS 不带完整 formalRun”的自动测试。
- [ ] 缺少“finalize-run 后只保留轻量结果索引，1 分钟后清完整 runGameV5”的自动测试。

### 任务明确

第一批必须改完，不允许跳过：

- [ ] 新增 V5 command result 类型，`commandLog.result` 改成受限小对象。
- [ ] 给 `appendCommandLog()` 加红线断言：拒绝 `run/formalRun/restRunSnapshot/gameMap/participants/localTeam/bag/pokemon/items`。
- [ ] 删除新 room 主线对 `ingestFormalRunCompatStateV5()` 的调用；保留时必须只在 legacy/dev 或一次性迁移脚本中。
- [ ] 拆掉 `rest-action` 大分发，改为每个 action 一个 V5 实体 command。
- [ ] `training.apply`：只改目标 `PokemonInstance.localPokemon.ivs/evs/nature/maxHp/entryHp`、`Player.money`、小型 coin ledger、training state。
- [ ] `team.heal`：只改 self team 引用到的 `PokemonInstance` HP/status/PP、`Player.money`、coin ledger。
- [ ] `shop.buy`：只改 `Player.money`、`Bag.itemInstanceIds`、`ItemInstance`、shop state、coin ledger。
- [ ] `shop.sell`：只改 `Player.money`、`Bag.itemInstanceIds`、`ItemInstance`、coin ledger。
- [ ] `pokemon.reroll-stats`：只改目标 `PokemonInstance` stats、`Player.money`、coin ledger。
- [ ] `pokemon.exchange`：只改 `Player.localTeamPokemonIds` / `PokemonInstance` ownership 或新增替换实体、exchange state、coin ledger。
- [ ] `bag.use/equip/unequip/discard`：只改 `PokemonInstance`、`Bag`、`ItemInstance`。
- [ ] `opponent-preview.unlock / insurance.buy / soulmate-egg.claim` 改为 V5 小状态写入，不回传整份 run。
- [ ] `prepare-battle` 改为实体级构建 Showdown team；旧 V4 battle preparation helper 只能作为纯计算工具，不能成为权威写路径。
- [ ] `battle-choice` 记录小型 `BattleChoiceRecordV5`，不写完整 snapshot/timeline 到 room。
- [ ] `finalize-battle` 实体级写回 `PokemonInstance / Player / Economy / BattleRecord / GameNode / RoundRecord`。
- [ ] `finalize-run` 从 V5 实体生成 settlement summary/profile delta/vault delta，不存完整 formalRun。
- [ ] `ack-final-result` 标记 match ended，并按清理规则移除完整 runGameV5，只保留轻量 match index/result summary。
- [ ] `publicRoom / publicMatch / WS` 改为轻量输出；完整展示只能通过 `GET match view`。
- [ ] C 端 room 页面改为消费 `RunGameViewV5`，compat formalRun 只作为组件适配层内存对象，不能保存、不能回传。

### 计划明确

执行顺序固定：

1. 先锁红线：改 `commandLog` 类型和断言，新增测试，确保再也塞不进完整 run。
2. 再拆休整：按 `training.apply -> team.heal -> shop.buy/sell -> bag.* -> reroll/exchange -> preview/insurance/soulmate` 顺序逐个实体化。
3. 再拆战斗：`prepare-battle -> battle-choice -> finalize-battle` 全部从实体读写。
4. 再拆结算：`finalize-run -> final-result -> ack-final-result` 轻量化。
5. 再拆输出：`publicRoom / publicMatch / WS / match view` 分清 summary 与 view。
6. 最后清前端：room 主线不再依赖 `formalRunDraft`、不写本地大 `formalRun`、不把组件 draft 当权威。

每一刀的完成定义：

- [ ] `pnpm --filter @changebattle-v2/api typecheck`
- [ ] `pnpm --filter @changebattle-v2/web typecheck`
- [ ] `pnpm --filter @changebattle-v2/desktop typecheck`
- [ ] `pnpm --filter @changebattle-v2/mobile typecheck`
- [ ] `git diff --check`
- [ ] redline scanner 无未解释的新命中。
- [ ] API smoke 覆盖该 command 的成功、失败、超时/重试幂等。
- [ ] Redis room JSON size 在重复执行该 command 后稳定，不能线性塞整份 run。

最终完成定义：

- [ ] 执行两次训练、两次购买、两次治疗、两次背包操作后，room size 不接近 `CHANGEBATTLE_ROOM_MAX_BYTES`。
- [ ] Redis 中 `runGameV5.commandLog` 不含完整 `run/formalRun/restRunSnapshot/gameMap/participants/localTeam/bag`。
- [ ] Redis 中 `gameMap/roundPlan` 不含完整 Player/Pokemon/Bag/Item。
- [ ] `publicRoom`、WS `room.updated` 不携带完整 `formalRun`。
- [ ] 刷新后页面通过 `GET match view` 恢复，不通过本地大 run 恢复。
- [ ] ChromeAutomation 完整跑通：创建房间 -> 创建对局 -> starter -> rest -> 训练两次 -> 购买/治疗/背包 -> battle -> victory/surrender -> settlement -> 返回房间。
- [ ] ChromeAutomation 不能只跑一次主链路；每个确认型 command 都要多点几次，覆盖重复提交、业务失败、网络失败/超时重试和数据体积稳定性。
- [ ] ChromeAutomation 多次点击清单至少包含：训练连续 2-3 次、治疗重复/金币不足或已满路径、商店购买多次、出售多次、背包使用/携带/卸下/丢弃、队伍排序保存两次、重随/交换/打听/保险/灵魂蛋、战斗多回合出招、投降、胜利闭环、结算刷新恢复和返回房间。
- [ ] ChromeAutomation 每轮关键操作后抽查服务端 room JSON size 与 `runGameV5.commandLog`，确认没有完整 `run/formalRun/restRunSnapshot/gameMap/participants/localTeam/bag` 被写入。

## V5 收口执行记录（2026-07-19）

本轮按“正式 room 主线 V5 权威、compat 只读展示”的红线收口。下面是本轮已完成项；旧 legacy/local 训练场路径仍可存在，但不得作为正式 room 主线调用依据。

### 已完成红线

- [x] `RunGameV5.commandLog.result` 改为受限小对象类型 `RunGameCommandLogResultV5`。
- [x] `appendCommandLog()` 增加红线断言，拒绝 `run/formalRun/restRunSnapshot/gameMap/participants/localTeam/bag/pokemon/items` 等大对象字段。
- [x] `appendCommandLog()` 增加 16KB 大小限制，防止幂等结果偷偷塞完整 view/run。
- [x] `assertRunGameV5RedLines()` 校验 `gameMap/roundPlan` 不得包含 `participants/localTeam/bag/money/pokemon/items`。
- [x] `rest-action` match-scoped 主线已拆到 V5 实体 command，不再通过 `applyFormalRestActionToRun()` + compat ingest 写回。
- [x] `training.apply` 只改目标 `PokemonInstance.localPokemon`、`Player.money`、训练状态和小型 coin log。
- [x] `team.heal` 只改 self team 引用到的 `PokemonInstance` 状态、`Player.money` 和 coin log。
- [x] `shop.buy/sell` 只改 `Player.money`、`Bag.itemInstanceIds`、`ItemInstance`、shop state 和 coin log。
- [x] `bag.use/equip/unequip/discard` 通过 V5 实体提交函数写 `PokemonInstance / Bag / ItemInstance`，不写回 `gameMap.participants`。
- [x] `pokemon.reroll-stats`、`pokemon.exchange`、`opponent-preview.unlock`、`insurance.buy`、`soulmate-egg.claim` 已接入 V5 小状态写入。
- [x] `prepare-battle` 从 V5 run 构建 battle formal run，并通过 `markBattleRunningV5()` 记录小型 battle id，不把 snapshot/timeline 存入 room。
- [x] `finalize-battle` 通过 `applyBattleFinalizedResultV5()` 实体级写回，不再调用 compat ingest。
- [x] `finalize-run` 通过 `commitFinalSettlementV5()` 生成轻量 `finalResult`，`Room.finalResult.formalRun` 不再长期保存完整 run。
- [x] `ack-final-result` 标记 match ended 后清理 `match.runGameV5` 和 `match.formalRun`，房间只保留 ended match summary。
- [x] `publicRoom()`、`publicMatch()`、WS `room.ready/room.updated` 不携带完整 `formalRun/runGameV5`。
- [x] 普通 `GET /rooms/:roomId/matches/:matchId` 改成轻量 detail；完整展示数据走 `GET /matches/:matchId/view` 或当前 command response。
- [x] Room 模式下 C 端不把 compat `formalRun` 持久化到本地大缓存，只保留内存展示 view。

### 自动测试覆盖

- [x] `pnpm --filter @changebattle-v2/api test:formal-game` 增加 V5 redline smoke：
  - [x] 创建 V5 run、select starters、prepare round。
  - [x] 连续训练 3 次，单次 JSON 增长小于 2500 bytes。
  - [x] `commandLog` 不含完整 `run/formalRun/restRunSnapshot/gameMap/participants/localTeam/bag/pokemon/items`。
  - [x] `gameMap/roundPlan` 不含完整实体字段。
  - [x] `finalize-battle/finalize-run` commandLog 不含大对象。
  - [x] `RunGameV5.finalResult` 不含完整 compat run。

### ChromeAutomation 验收记录

- [x] 启动当前 worktree memory Battle API：`127.0.0.1:5192/changebattle/battle`。
- [x] 启动 Web dev：`127.0.0.1:5188`，并指向当前 memory API。
- [x] 首页二级菜单没有“继续游戏/对局偏好”，创建房间后才连接服务器。
- [x] 创建房间成功，房间页展示 Room ID、游客 ID、成员列表。
- [x] 创建对局面板有“返回上一步”，偏好项独立展示。
- [x] ready/start 后进入 starter select，按钮为“返回房间”。
- [x] select starters -> prepare round -> rest 未卡住。
- [x] 保险 decline command 成功。
- [x] 训练 command 连续执行 2 次，金币正常变化，未出现 `room_too_large`。
- [x] 商店购买成功，出售成功，金币正常变化。
- [x] 治疗成功，金币正常变化。
- [x] 队伍排序按“草稿调整 -> 保存顺序”提交；保存后顺序变为咚咚鼠第一。
- [x] prepare battle 后战斗首发为咚咚鼠，证明 Showdown team 顺序来自 `Player.localTeamPokemonIds`。
- [x] 投降二次确认成功，battle result transition -> settlement transition -> settlement 跑通。
- [x] 结算页按钮为“返回房间”。
- [x] 返回房间后 match 显示“已结束”，房间仍保留。
- [x] ack 后 `GET /rooms/:roomId` public JSON 约 1892 bytes；room 无 `formalRun`，ended match 无 `formalRun/runGameV5`，仅有 `settlementSummary`。
- [x] Chrome localStorage 中无大 formal run 缓存，只剩 room credential 和 settlement 幂等标记。

### 必跑检查结果

- [x] `pnpm --filter @changebattle-v2/api typecheck`
- [x] `pnpm --filter @changebattle-v2/web typecheck`
- [x] `pnpm --filter @changebattle-v2/desktop typecheck`
- [x] `pnpm --filter @changebattle-v2/mobile typecheck`
- [x] `pnpm --filter @changebattle-v2/showdown-battle-core typecheck`
- [x] `pnpm typecheck`
- [x] `pnpm --filter @changebattle-v2/api test:formal-game`
- [x] `git diff --check`

### 剩余边界说明

- [ ] `buildFormalRunCompatViewV5()` 仍作为旧 UI 展示 DTO 生成器存在；红线是只读展示，不能回写 Redis 权威。
- [ ] `prepare-round` 和部分 battle/settlement 计算仍会临时调用 V4 formal helper 作为纯计算器；写回点必须保持 V5 实体函数。
- [ ] Legacy `/rooms/:roomId/formal/*`、`postService rooms.syncDraft/restAction`、本地训练场 helper 仍保留给 legacy/dev；正式 room 主线不得调用。
- [ ] `TrainingRestNewPage` 仍消费 compat `formalRun` 渲染；下一阶段应拆成真正的 `RunGameViewV5` 分片展示，进一步减少 command response payload。

## 下一阶段：Scoped View Snapshot 懒加载展示计划

### Summary

正式 room C/S 的最终形态不是“客户端缓存一份总 `RunGameViewV5`”，而是“客户端只缓存当前页面需要看的 V5 view snapshot”。服务端仍保存完整权威 `RunGameV5`；客户端只保存 room credential、matchId、revision、phase、当前看过的页面 view 切片和本地 UI 草稿。

核心规则：

```text
RunGameV5 = 服务端权威实体，只在服务端存。
ViewScopeV5 = 服务端按页面现算的展示切片，只给客户端看。
ClientCache = 客户端缓存看过的切片，不当权威，不上传。
Command = 客户端确认意图；成功后返回目标 scope view。
WS = revision 通知；不直接 patch 复杂状态。
```

这一步要彻底替换当前仍偏“总视图”的 `formalRoomViewV5`，并删除 room 模式里最后的 `roomBattleDisplayRunFromViewV5()` 伪 V4 战斗展示适配。

### 新红线

红线第一遍：

- 正式 room 客户端可以缓存 `ViewScopeV5`，不能缓存 `RunGameV5`。
- 正式 room 客户端不能缓存或构造 `TrainingRunGameV4` / `FormalGameRunV4` 作为展示主数据。
- 正式 room 客户端不能上传 `ViewScopeV5`，更不能把 view 当 command 写入源。
- HTTP command 成功前不能替换服务端确认 view snapshot。
- HTTP command 失败/超时时必须保留旧 view snapshot，只显示错误或保留本地草稿等待重试。
- WS 只通知 `revision/phase/scope invalidation`，不能携带完整 view，也不能直接修改页面复杂状态。
- 刷新恢复必须通过 room credential + `GET view?scope=...`，不能通过 localStorage 大对象恢复。

红线第二遍：

- `GET match view` 默认不能返回 starter/rest/battle/settlement 全部切片。
- `command` 成功只能返回本命令目标 scope 的完整 view，或小型 result；第一阶段不做复杂 patch merge。
- `BattleV4Page` room 模式不能接收 `TrainingRunGameV4`。
- `roomBattleDisplayRunFromViewV5()` 必须删除，不允许用 V5 拼 V4 外壳。
- `TrainingRestDisplayModel` room 模式不能使用 `TrainingRunGameV4["gameMap"]` 形状作为主模型；可以保留 legacy mapper 给训练场。

红线第三遍：

- 服务端 `RunGameV5` 可以单 key 聚合存 Redis；返回给客户端的 scoped view 必须是页面切片。
- `BattleViewV5` 可以返回当前战斗展示所需 participants/selfBag/activeBattle，但不能返回 `playersById/pokemonById/bagsById/itemInstancesById/gameMap/roundPlan` 全量。
- `RestViewV5` 可以返回当前休整页所需 team/bag/shop/training/preview，但不能返回完整 run。
- `SettlementViewV5` 只能返回 final result/profile delta/vault delta/summary，不能返回完整 run。

### 目标 API

第一版保留当前 path，新增 `scope` 参数：

```text
GET /rooms/:roomId/matches/:matchId/view?scope=summary
GET /rooms/:roomId/matches/:matchId/view?scope=starter
GET /rooms/:roomId/matches/:matchId/view?scope=rest
GET /rooms/:roomId/matches/:matchId/view?scope=battle
GET /rooms/:roomId/matches/:matchId/view?scope=settlement
```

响应统一：

```ts
type MatchScopedViewResponseV5<T> = {
  revision: number;
  phase: RunGamePhaseV5;
  scope: ViewScopeNameV5;
  room: RoomSummaryV5;
  match: MatchSummaryV5;
  view: T;
};
```

命令响应统一：

```ts
type MatchCommandResponseV5<TView, TResult = Record<string, unknown>> = {
  revision: number;
  phase: RunGamePhaseV5;
  scope: ViewScopeNameV5;
  view: TView;
  result: TResult;
  reused?: boolean;
};
```

第一阶段 command 成功返回目标 scope 的完整 view：

```text
select-starters -> starter 或 round transition summary
prepare-round -> rest
team.reorder -> rest
training.apply -> rest
shop.buy/sell -> rest
team.heal -> rest
bag.* -> rest
prepare-battle -> battle
battle-choice -> battle snapshot/choice result，小型 result
finalize-battle -> rest 或 settlement
finalize-run -> settlement
ack-final-result -> summary/room
```

暂不做细粒度 patch：

```text
不先返回 {patch, invalidates}
不在客户端合并复杂 patch
不做 optimistic authority
```

### 目标 View 切片

#### SummaryViewV5

```ts
type SummaryViewV5 = {
  room: RoomSummaryV5;
  match: MatchSummaryV5;
  revision: number;
  phase: RunGamePhaseV5;
};
```

用途：房间页、对局列表、返回房间后的 ended summary。

#### StarterViewV5

```ts
type StarterViewV5 = {
  runId: string;
  matchId: string;
  revision: number;
  selectedIndexes: number[];
  candidates: Array<{
    candidateId: string;
    pokemonId: string;
    pokemon: PokemonDisplayV5;
  }>;
  pickLimit: number;
};
```

用途：starter select 页面。不得包含 rest/map/bag/battle/settlement。

#### RestViewV5

```ts
type RestViewV5 = {
  runId: string;
  matchId: string;
  revision: number;
  selfPlayer: PlayerRestSummaryV5;
  team: PokemonDisplayV5[];
  bag: BagDisplayV5 | null;
  money: number;
  currentNode: NodeRestSummaryV5 | null;
  nextOpponentPreview: OpponentPreviewViewV5 | null;
  shop: ShopViewV5 | null;
  trainingGround: TrainingGroundViewV5 | null;
  exchange: ExchangeViewV5 | null;
  medical: MedicalViewV5 | null;
  roundSettlement: RoundSettlementViewV5 | null;
  coinLog: CoinLogEntryViewV5[];
  battleLog: BattleLogEntryViewV5[];
};
```

用途：休整页。不得包含完整 `gameMap/roundPlan/playersById/pokemonById/bagsById/itemInstancesById`。

#### BattleViewV5

```ts
type BattleViewV5 = {
  runId: string;
  matchId: string;
  revision: number;
  activeBattle: {
    sessionId: string;
    nodeId: string;
    battleGameId?: string;
    status: "creating" | "running" | "finalized" | "blocked" | "lost_session";
    expectedTurn?: number;
    expectedRqid?: string;
  } | null;
  mode: "singles" | "doubles" | "coop";
  ruleSet: string;
  stageLabel: string;
  participants: Partial<Record<"p1" | "p2" | "p3" | "p4", BattleParticipantViewV5>>;
  selfBag: BattleBagViewV5 | null;
  battlePreference: {
    ruleSet: string;
    battleBagEnabled: boolean;
    specialSystem?: string;
  };
};
```

用途：战斗页 UI 显示和 battle service 恢复。战斗局面本身继续从 battle service snapshot/timeline 获取，不塞进 RunGame view。

#### SettlementViewV5

```ts
type SettlementViewV5 = {
  settlementId: string;
  reason: FormalSettlementReasonV4;
  summary: Record<string, unknown>;
  profileDelta: Record<string, unknown>;
  vaultDelta: Record<string, unknown>;
  claimedAt?: string;
};
```

用途：结算页展示和返回房间 ack。不得包含完整 `formalRun`。

### 目标客户端状态

```ts
type FormalRoomClientCacheV5 = {
  roomCredential: {
    roomId: string;
    roomToken: string;
    selfMemberId?: string;
  } | null;

  matchId: string | null;
  revision: number;
  phase: RunGamePhaseV5 | null;

  views: {
    summary?: SummaryViewV5;
    starter?: StarterViewV5;
    rest?: RestViewV5;
    battle?: BattleViewV5;
    settlement?: SettlementViewV5;
  };

  stale: Partial<Record<ViewScopeNameV5, number>>;

  pendingCommand: {
    commandId: string;
    commandName: string;
    scope: ViewScopeNameV5;
    startedAt: string;
  } | null;

  localDraft: {
    selectedStarterIndexes?: number[];
    restReorderPokemonIds?: string[];
    selectedPokemonId?: string;
    selectedShopCategoryId?: string;
    battleChoiceDraft?: unknown;
  };
};
```

页面加载策略：

```text
进入页面
  -> 如果当前 scope view 不存在：GET view?scope=scope
  -> 如果 current revision < known revision：GET view?scope=scope
  -> 否则直接展示缓存

收到 WS match.updated revision
  -> stale[currentScope] = revision
  -> 当前页面需要最新数据时 GET view?scope=currentScope

发 command
  -> pendingCommand = command
  -> 显示遮罩
  -> 成功：替换 views[targetScope]，更新 revision/phase，清 pending
  -> 失败：保留旧 view，清 pending，toast 业务错误
  -> 超时：保留旧 view，清 pending，toast 网络异常
```

### 任务清单

#### 阶段 1：服务端 scoped view DTO

- [ ] 定义 `ViewScopeNameV5 = "summary" | "starter" | "rest" | "battle" | "settlement"`。
- [ ] 定义 `SummaryViewV5 / StarterViewV5 / RestViewV5 / BattleViewV5 / SettlementViewV5` 类型。
- [ ] 拆 `buildRunGameViewV5()` 为：
  - [ ] `buildSummaryViewV5(run, room, match)`
  - [ ] `buildStarterViewV5(run)`
  - [ ] `buildRestViewV5(run)`
  - [ ] `buildBattleViewV5(run)`
  - [ ] `buildSettlementViewV5(run)`
- [ ] `GET /matches/:matchId/view?scope=...` 按 scope 返回对应切片。
- [ ] 未传 scope 时只返回 `summary`，或临时返回当前 phase 对应 scope；不得默认返回全部切片。
- [ ] `buildFormalMatchView()` 不再返回总 `viewV5`，改为返回 `scope/view`。
- [ ] API smoke 增加响应体扫描：任意 scope 响应不得含 `formalRun/restRunSnapshot/runGameV5/playersById/pokemonById/bagsById/itemInstancesById`。

#### 阶段 2：command 返回目标 scope

- [ ] `select-starters` 返回 starter/summary 小 view，不返回总 view。
- [ ] `prepare-round` 返回 `RestViewV5`。
- [ ] `team.reorder` 返回 `RestViewV5`。
- [ ] `training.apply` 返回 `RestViewV5`。
- [ ] `shop.buy/sell` 返回 `RestViewV5`。
- [ ] `team.heal` 返回 `RestViewV5`。
- [ ] `bag.use/equip/unequip/discard` 返回 `RestViewV5`。
- [ ] `pokemon.reroll-stats / pokemon.exchange / opponent-preview.unlock / insurance.buy / soulmate-egg.claim` 返回 `RestViewV5`。
- [ ] `prepare-battle` 返回 `BattleViewV5`，其中 `activeBattle.sessionId` 必须可用于恢复。
- [ ] `finalize-battle` 按 destination 返回 `RestViewV5` 或 `SettlementViewV5`。
- [ ] `finalize-run` 返回 `SettlementViewV5`。
- [ ] `ack-final-result` 返回 `SummaryViewV5` 或 room/match summary。
- [ ] command response 不再包 `view: {viewV5: full}`。

#### 阶段 3：前端 client cache

- [ ] 新增 `FormalRoomClientCacheV5` 或 `useFormalRoomClientCache()`。
- [ ] 用 `formalRoomClientCache.views` 替代 `formalRoomViewV5`。
- [ ] `applyFormalRoomViewV5()` 改成 `applyFormalRoomScopedView(scope, response)`。
- [ ] App route guard 按 `phase + current scope` 判断，不依赖总 view。
- [ ] room shell WS 收到 revision 只标记 stale，不直接修改复杂 view。
- [ ] 刷新 starter/rest/battle/settlement 页面时只 GET 当前 scope。
- [ ] localStorage 只保存 room credential / 小型 command id / settlement idempotency marker，不保存 scoped view 大对象。

#### 阶段 4：页面逐个切 scope

- [ ] RoomLobbyPage 只吃 summary/room/match summary。
- [ ] FormalStarterSelectPage 只吃 `StarterViewV5`。
- [ ] FormalRoundTransitionPage command 成功后写 `RestViewV5`，跳 `/formal/rest`。
- [ ] TrainingRestNewPage room 模式只吃 `RestViewV5`，不再通过 `TrainingRestDisplayModel` 使用 `TrainingRunGameV4["gameMap"]` 形状。
- [ ] TrainingRestDisplayModel 保留 legacy V4 mapper，但 room mapper 改为纯 `RestViewV5 -> RestDisplayModel`。
- [ ] TrainingRestNextPreviewPanel 只吃 `OpponentPreviewViewV5`，legacy 适配留在训练场入口。
- [ ] TrainingRestNewBagPanel room 模式只吃 `BagDisplayV5 / PokemonDisplayV5[]`。
- [ ] FormalBattleTransitionPage command 成功后写 `BattleViewV5`，跳 `/formal/battle`。
- [ ] BattleV4Page 新增纯 V5 props：`battleView: BattleViewV5`。
- [ ] BattleV4Page room 模式不再接收 `run: TrainingRunGameV4`。
- [ ] 删除 `roomBattleDisplayRunFromViewV5()`。
- [ ] 训练场入口新增 `battleViewFromTrainingRunV4(run)`，只在 training/legacy 内部使用。
- [ ] FormalBattleResultTransitionPage 根据 command destination 写 rest/settlement scope。
- [ ] FormalSettlementTransitionPage / FormalSettlementPage 只吃 `SettlementViewV5`。

#### 阶段 5：删除或硬隔离总 view 入口

- [ ] 删除正式 room 主线的总 `RunGameViewV5` 返回路径。
- [ ] `RunGameViewV5` 如果保留，只作为 internal 聚合测试类型，不导出给 Web 正式主线。
- [ ] `buildFormalRunCompatViewV5()` 只允许 legacy/dev-only 或训练场 adapter 使用。
- [ ] redline scanner 加入：
  - [ ] `formalRoomViewV5`
  - [ ] `roomBattleDisplayRunFromViewV5`
  - [ ] `view.viewV5`
  - [ ] `TrainingRunGameV4` in `BattleV4Page` room path
  - [ ] `buildFormalRunCompatViewV5(match.runGameV5)`

### 当前检查结果（2026-07-19）

本次检查命令：

```bash
rg -n "RunGameViewV5|viewV5|formalRoomViewV5|roomBattleDisplayRunFromViewV5|TrainingRunGameV4|formalRunDraft|syncDraft|view\\.formalRun|restRunSnapshot|BattleV4Page" \
  apps/api/src/server.ts apps/api/src/runGameV5.ts apps/web/src/App.tsx apps/web/src/components \
  -g '*.ts' -g '*.tsx'
```

当前状态：

- [x] 正式 room C/S 传输主线已不返回 `view.formalRun`。
- [x] 正式 room 休整展示已基本从 `viewV5` 派生，不再用 `previewRun` 字段。
- [x] `formalRunDraft/syncDraft` 只剩服务端 legacy/dev-only 路径；默认 `CHANGEBATTLE_ENABLE_LEGACY_FORMAL_ROUTES=false` 会 410。
- [x] ChromeAutomation 已跑到 battle command panel，localStorage 只剩小 room credential。
- [ ] 服务端 `RunGameViewV5` 仍是总视图：`starter/map/rest/trainingGround/exchange/settlement` 聚合在一个 DTO。
- [ ] `buildFormalMatchView()` 仍返回 `{viewV5}` 总字段。
- [ ] App 仍维护 `formalRoomViewV5` 总 view 状态。
- [ ] App 仍通过 `applyFormalRoomViewV5(response.data.view.viewV5)` 更新总 view。
- [ ] App route guard 仍以 `formalRoomViewV5.phase/status` 为核心。
- [ ] `roomBattleDisplayRunFromViewV5()` 仍存在，会把 V5 view 拼成 `TrainingRunGameV4` 给 BattleV4Page。
- [ ] `BattleV4Page` props 仍要求 `run: TrainingRunGameV4`。
- [ ] `TrainingRestDisplayModel` room mapper 仍用 `TrainingRunGameV4["gameMap"]` / `TrainingPlayerDraftV4` 形状做中间展示结构。
- [ ] `TrainingRestNewPage` legacy callback 仍出现 `result.run.restRunSnapshot`，但 room 模式已有 serverCommitted guard；下一阶段要进一步按 scope 分离。
- [ ] `FormalBattleTransitionPage / FormalBattleResultTransitionPage` legacy 分支仍使用 `restRunSnapshot`，允许保留给非-room/legacy，但 room 分支不能落入。
- [ ] `FormalSettlementPage` 仍有 `run?.restRunSnapshot` fallback；room 模式应只使用 `SettlementViewV5`。

### 验收标准

阶段完成前必须满足：

- [ ] `rg "formalRoomViewV5|roomBattleDisplayRunFromViewV5|view\\.viewV5" apps/web/src` 在正式 room 主线无命中。
- [ ] `BattleV4Page` room path 不再传 `TrainingRunGameV4`。
- [ ] `GET view?scope=rest` 响应不含 starter/battle/settlement。
- [ ] `GET view?scope=battle` 响应不含 rest/shop/training/full map。
- [ ] `command shop.buy/team.reorder/training.apply` 只返回 rest scope。
- [ ] `command prepare-battle` 只返回 battle scope。
- [ ] 刷新 `/formal/rest` 只拉 rest scope。
- [ ] 刷新 `/formal/battle` 只拉 battle scope + battle snapshot/timeline。
- [ ] localStorage 不保存 scoped view，更不保存 run。
- [ ] ChromeAutomation 完整跑：room -> starter -> rest -> 多次 rest command -> battle -> settlement -> room。
- [ ] ChromeAutomation Network/HTTP smoke 扫描所有 view/command 响应，无 `formalRun/restRunSnapshot/runGameV5/playersById/pokemonById/bagsById/itemInstancesById`。

### 执行顺序

1. 服务端先拆 scope DTO 和 `GET view?scope=...`。
2. command response 改成返回目标 scope。
3. 前端新增 client cache，保留旧总 view 作为临时 fallback。
4. starter/rest 页面切到 scoped cache。
5. battle 页面新增 `BattleViewV5` props，删除 `roomBattleDisplayRunFromViewV5()`。
6. settlement 页面切到 `SettlementViewV5`。
7. 删除正式主线总 view fallback。
8. 跑静态、HTTP smoke、ChromeAutomation 完整验收。

### 复查版落地清单（2026-07-19）

本段用于下一轮真正开工时逐项打勾。原则是先把传输边界变成 scoped view，再把 UI 展示依赖从 V4 形状拆掉，最后删除临时 fallback。不能因为页面能跑就跳过红线扫描。

#### 当前命中点

- [ ] `apps/api/src/runGameV5.ts` 仍导出聚合型 `RunGameViewV5`。
  - 命中：`export type RunGameViewV5`。
  - 命中：`export function buildRunGameViewV5(run: RunGameV5): RunGameViewV5`。
  - 要改：拆成 `SummaryViewV5 / StarterViewV5 / RestViewV5 / BattleViewV5 / SettlementViewV5` 与 scope builder。
- [ ] `apps/api/src/server.ts` 仍用聚合 view 构造 match view。
  - 命中：`buildFormalMatchView()` 内部 `buildRunGameViewV5(match.runGameV5)`。
  - 命中：`formalRoomPhaseFromState(..., viewV5)` 依赖聚合 view 判断 phase。
  - 要改：`buildFormalMatchView()` 改为 `buildScopedMatchView(scope)`；phase 从 `runGameV5.status/phase` 直接判断。
- [ ] `apps/web/src/App.tsx` 仍维护聚合 view cache。
  - 命中：`const [formalRoomViewV5, setFormalRoomViewV5]`。
  - 命中：`applyFormalRoomViewV5(response.data.view.viewV5)`。
  - 命中：route guard 和页面 props 多处依赖 `formalRoomViewV5.phase/status/rest/settlement`。
  - 要改：替换为 `formalRoomClientCache.views.{summary,starter,rest,battle,settlement}`。
- [ ] `apps/web/src/App.tsx` 仍有 V5 拼 V4 的战斗展示适配。
  - 命中：`roomBattleDisplayRunFromViewV5(view: RunGameViewV5): TrainingRunGameV4`。
  - 要改：删除该函数；room battle 页面只传 `BattleViewV5`。
- [ ] `apps/web/src/components/battle-v4/BattleV4Page.tsx` 仍把 `TrainingRunGameV4` 作为唯一 props。
  - 命中：`BattleV4PageProps.run: TrainingRunGameV4`。
  - 命中：`onRunChange: (run: TrainingRunGameV4) => void`。
  - 要改：拆出 `BattleRoomDisplayModel` 或 `BattleViewV5` props；训练场才继续走 V4 props。
- [ ] `apps/web/src/components/formal/*TransitionPage.tsx` 仍接收和回传聚合 `RunGameViewV5`。
  - 命中：`FormalStarterSelectPage`、`FormalRoundTransitionPage`、`FormalBattleTransitionPage`、`FormalBattleResultTransitionPage`、`FormalSettlementTransitionPage` 中 `result.data.view.viewV5`。
  - 要改：command success 返回 `{scope, view}` 后，页面只写目标 scope。
- [ ] `apps/web/src/components/training/TrainingRestDisplayModel.ts` 的 room mapper 仍使用 V4 类型当中间结构。
  - 命中：`TrainingRunGameV4["gameMap"]`。
  - 命中：`TrainingPlayerDraftV4`。
  - 要改：定义纯 `RestDisplayModel` 子类型，legacy mapper 内部才接触 V4。
- [ ] `apps/web/src/components/training/TrainingRestNewPage.tsx` 仍暴露 legacy `run/onRunChange/onSaveRunSnapshot` props。
  - 命中：`run?: TrainingRunGameV4 | null`。
  - 命中：`result.run.restRunSnapshot`。
  - 要改：room 入口传 `displayModel + serverCommitted controllers`，legacy 入口才传 `run`。

#### 实施任务

- [ ] 新增 `ViewScopeNameV5` 和 scoped response 类型。
- [ ] 服务端 `GET match view` 支持 `scope=summary|starter|rest|battle|settlement`。
- [ ] 服务端 no-scope 默认只返回当前 phase scope 或 summary，严禁返回全集。
- [ ] command response 从 `view: {viewV5}` 改为 `{scope, view, result}`。
- [ ] 前端新增 `FormalRoomClientCacheV5`，集中管理 credential、matchId、revision、phase、scoped views、stale、pendingCommand、localDraft。
- [ ] starter 页面改吃 `StarterViewV5`。
- [ ] rest 页面改吃 `RestViewV5`，`TrainingRestDisplayModel` room mapper 不再用 V4 map/player 类型。
- [ ] battle transition 改吃 `BattleViewV5`，战斗页 room path 不再传 `TrainingRunGameV4`。
- [ ] settlement 页面改吃 `SettlementViewV5`，不再需要 `run?.restRunSnapshot` fallback。
- [ ] 删除 `roomBattleDisplayRunFromViewV5()`。
- [ ] 删除或硬隔离正式 room 主线的 `formalRoomViewV5 / view.viewV5`。
- [ ] 补 HTTP smoke 响应扫描：`formalRun/restRunSnapshot/runGameV5/playersById/pokemonById/bagsById/itemInstancesById` 均不得出现。
- [ ] 补 ChromeAutomation network 检查：view/command 响应没有大对象，localStorage 没有 room run/view 大缓存。

#### 红线扫描必须清零

阶段结束时，以下命令在正式 room 主线不能有未解释命中：

```bash
rg -n "formalRoomViewV5|roomBattleDisplayRunFromViewV5|view\\.viewV5" apps/web/src -g '*.ts' -g '*.tsx'
rg -n "buildRunGameViewV5\\(|RunGameViewV5|buildFormalRunCompatViewV5\\(match\\.runGameV5\\)" apps/api/src apps/web/src -g '*.ts' -g '*.tsx'
rg -n "formalRunDraft|syncDraft|rooms\\.restAction|rooms\\.prepareBattle|view\\.formalRun" apps/api/src apps/web/src -g '*.ts' -g '*.tsx'
```

允许命中必须满足：

- [ ] 训练场或 legacy/dev-only 文件内部。
- [ ] 有明确注释说明不属于正式 room 主线。
- [ ] 正式 Web/Desktop/Android room 入口不会 import 或调用。
- [ ] ChromeAutomation network 和 API smoke 证明响应体没有大对象。

#### 下一轮完成定义

- [ ] C 端只保存 credential、matchId、revision、phase、当前页面 scoped view 和 UI 草稿。
- [ ] C 端不保存、不构造、不上传 `FormalGameRunV4 / TrainingRunGameV4` 作为 room 主线展示状态。
- [ ] S 端返回给 room 主线的 view/command 响应都是 scoped DTO。
- [ ] 战斗页 room path 使用 `BattleViewV5 + battle service snapshot/timeline` 展示。
- [ ] 休整页 room path 使用 `RestViewV5` 展示。
- [ ] 结算页 room path 使用 `SettlementViewV5` 展示。
- [ ] 静态检查、红线扫描、API smoke、ChromeAutomation 完整闭环全部通过。
