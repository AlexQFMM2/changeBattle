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
