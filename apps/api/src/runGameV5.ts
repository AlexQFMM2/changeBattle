import type {BattlePreferenceV4, FormalCompetitionModeV4, PlayerItemInstanceV4, ShowdownPlayerIdV4, StatTableV4, TrainingAllianceV4, TrainingCoinLogEntryV4, TrainingMoveSlotV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4, TrainingRuleSetV4} from "./training.js";
import type {FormalBattleResultFinalizeReasonV4, FormalGameModeV4, FormalMedicalInsuranceStateV4, FormalMedicalInsuranceTierViewV4, FormalGameRunV4, FormalPokemonExchangeViewV4, FormalRoundNpcSnapshotV4, FormalRoundPlanV4, FormalSettlementReasonV4, FormalShopProductViewV4, FormalStarterCandidateV4, FormalTrainingGroundApplyInputV4, FormalTrainingGroundLessonViewV4} from "./formalGame.js";
import type {LocalPokemonV4, LocalTeamV4} from "./training.js";
import type {PlayerVaultV4, UserProfileV2} from "./index.js";

export type PlayerInstanceIdV5 = string;
export type PokemonInstanceIdV5 = string;
export type BagInstanceIdV5 = string;
export type ItemInstanceIdV5 = string;
export type GameNodeIdV5 = string;
export type CommandIdV5 = string;

export type RunGamePhaseV5 = "lobby" | "starter" | "rest" | "battle" | "settlement";
export type RunGameStatusV5 =
  | "not_started"
  | "starter_selecting"
  | "round_preparing"
  | "resting"
  | "battle_preparing"
  | "battling"
  | "battle_settling"
  | "settlement_ready"
  | "ended"
  | "closed";

export type RunGameConfigV5 = {
  mode: FormalGameModeV4;
  competitionMode: FormalCompetitionModeV4;
  ruleSet: TrainingRuleSetV4;
  seed: string;
  createdByMemberId: string;
  battlePreference: BattlePreferenceV4;
};

export type RunGameCommandLogResultV5 = Record<string, unknown> | null;

const DEFAULT_SYSTEM_ITEMS_BY_RULE_SET_V5: Record<TrainingRuleSetV4, string[]> = {
  standard: [],
  gen7: ["system-mega-stone", "system-z-crystal"],
  gen8: ["system-dynamax-band"],
  gen9: ["system-tera-orb"],
};

const MANAGED_SYSTEM_ITEM_IDS_V5 = new Set(Object.values(DEFAULT_SYSTEM_ITEMS_BY_RULE_SET_V5).flat());

export type PlayerInstanceV5 = {
  playerId: PlayerInstanceIdV5;
  slot: ShowdownPlayerIdV4;
  kind: "human" | "npc";
  controller: "local" | "ai" | "script";
  alliance: TrainingAllianceV4;
  ownerMemberId?: string;
  roomCustomId?: string;
  name: string;
  avatar: string;
  backImage?: string;
  profileSnapshot?: UserProfileV2;
  starChartSnapshot?: FormalGameRunV4["starChartSnapshot"];
  npcProfile?: {
    trainerId: string;
    rank: "rookie" | "trainer" | "gym_leader" | "elite" | "champion" | "villain" | "boss";
    rankLabel: string;
    aiProfile: {
      difficulty: "easy" | "normal" | "hard" | "expert" | "boss";
      strategy: "balanced" | "aggressive" | "defensive" | "stall" | "setup" | "random";
    };
  };
  money: number;
  bagId: BagInstanceIdV5;
  localTeamPokemonIds: PokemonInstanceIdV5[];
  ready: boolean;
  connectionState: "online" | "offline" | "disconnected";
  createdAt: string;
  updatedAt: string;
};

export type PokemonInstanceV5 = {
  pokemonId: PokemonInstanceIdV5;
  ownerPlayerId: PlayerInstanceIdV5;
  localPokemon: LocalPokemonV4;
  createdAt: string;
  updatedAt: string;
};

export type BagInstanceV5 = {
  bagId: BagInstanceIdV5;
  ownerPlayerId: PlayerInstanceIdV5;
  maxSize: number;
  itemInstanceIds: ItemInstanceIdV5[];
  battleBagEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ItemInstanceV5 = {
  itemInstanceId: ItemInstanceIdV5;
  ownerBagId: BagInstanceIdV5;
  item: PlayerItemInstanceV4;
  createdAt: string;
  updatedAt: string;
};

export type StarterCandidateRefV5 = Omit<FormalStarterCandidateV4, "pokemon"> & {
  pokemonId: PokemonInstanceIdV5;
};

export type GameMapNodeV5 = {
  nodeId: GameNodeIdV5;
  index: number;
  state: TrainingRunGameNodeV4["state"];
  mode: FormalGameModeV4;
  ruleSet: TrainingRuleSetV4;
  seed: string;
  slots: Partial<Record<ShowdownPlayerIdV4, PlayerInstanceIdV5>>;
  battleGame: TrainingRunGameNodeV4["battleGame"];
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
};

export type RoundPlanV5 = {
  nodeId: GameNodeIdV5;
  index: number;
  mode: FormalGameModeV4;
  ruleSet: TrainingRuleSetV4;
  difficulty: FormalRoundPlanV4["difficulty"];
  seed: string;
  npcRefs: string[];
  slots: Partial<Record<ShowdownPlayerIdV4, PlayerInstanceIdV5>>;
  diagnostics: string[];
};

export type RunGameV5 = {
  version: 5;
  runId: string;
  roomId: string;
  matchId: string;
  status: RunGameStatusV5;
  phase: RunGamePhaseV5;
  revision: number;
  createdAt: string;
  updatedAt: string;
  config: RunGameConfigV5;
  selfPlayerId: PlayerInstanceIdV5;
  profileId: string;
  streak: number;
  coopPartnerPreference?: FormalGameRunV4["coopPartnerPreference"];
  starterCandidates: StarterCandidateRefV5[];
  selectedStarterIndexes: number[];
  playersById: Record<PlayerInstanceIdV5, PlayerInstanceV5>;
  pokemonById: Record<PokemonInstanceIdV5, PokemonInstanceV5>;
  bagsById: Record<BagInstanceIdV5, BagInstanceV5>;
  itemInstancesById: Record<ItemInstanceIdV5, ItemInstanceV5>;
  gameMap: {nodes: GameMapNodeV5[]};
  roundPlan: RoundPlanV5[];
  currentNodeId: GameNodeIdV5 | null;
  restState: {
    shopByNodeId?: FormalGameRunV4["shopByNodeId"];
    trainingGroundByNodeId?: FormalGameRunV4["trainingGroundByNodeId"];
    roundSettlementByNodeId?: FormalGameRunV4["roundSettlementByNodeId"];
    exchangeByNodeId?: FormalGameRunV4["exchangeByNodeId"];
    medicalInsuranceOfferSeen?: boolean;
    medicalInsurance?: FormalMedicalInsuranceStateV4 | null;
    restPreviewUnlocks?: TrainingRunGameV4["restPreviewUnlocks"];
    coinLog?: TrainingRunGameV4["coinLog"];
    battleLog?: TrainingRunGameV4["battleLog"];
  };
  soulmateState?: {
    eggClaimedAt?: string;
    eggCandidateId?: string;
    playerPokemonId?: string;
    friendshipSettlementByNodeId?: FormalGameRunV4["soulmateFriendshipSettlementByNodeId"];
    honorSettlementByNodeId?: FormalGameRunV4["soulmateHonorSettlementByNodeId"];
    battleEvolutionByNodeId?: FormalGameRunV4["soulmateBattleEvolutionByNodeId"];
  };
  commandLog: Record<CommandIdV5, {revision: number; commandName: string; result: RunGameCommandLogResultV5; createdAt: string}>;
  finalResult?: {
    settlementId: string;
    settlement: NonNullable<FormalGameRunV4["settlement"]>;
    settledAt?: string;
    summary?: Record<string, unknown>;
  };
};

export function createRunGameV5FromStarterRun(input: {
  roomId: string;
  matchId: string;
  createdByMemberId: string;
  roomCustomId?: string;
  profileSnapshot: UserProfileV2;
  playerVaultSnapshot?: PlayerVaultV4 | null;
  starterRun: FormalGameRunV4;
  now?: Date;
}): RunGameV5 {
  const now = input.now || new Date();
  const iso = now.toISOString();
  const selfPlayerId = `player:${input.matchId}:self`;
  const selfBagId = `bag:${selfPlayerId}`;
  const pokemonById: Record<PokemonInstanceIdV5, PokemonInstanceV5> = {};
  const selfSystemItems = createSystemItemInstancesForRuleSetV5(input.starterRun.battlePreference.ruleSet, selfBagId, input.matchId, iso);
  const starterCandidates = input.starterRun.starterCandidates.map((candidate, index) => {
    const pokemonId = `candidate:${input.matchId}:${index + 1}`;
    pokemonById[pokemonId] = {
      pokemonId,
      ownerPlayerId: "candidate-pool",
      localPokemon: {...candidate.pokemon, localPokemonId: pokemonId, heldItemInstanceId: undefined},
      createdAt: iso,
      updatedAt: iso,
    };
    const {pokemon: _pokemon, ...rest} = candidate;
    return {...rest, pokemonId};
  });
  return assertRunGameV5RedLines({
    version: 5,
    runId: input.starterRun.id,
    roomId: input.roomId,
    matchId: input.matchId,
    status: "starter_selecting",
    phase: "starter",
    revision: 1,
    createdAt: input.starterRun.createdAt || iso,
    updatedAt: iso,
    config: {
      mode: input.starterRun.mode,
      competitionMode: input.starterRun.competitionMode,
      ruleSet: input.starterRun.battlePreference.ruleSet,
      seed: input.starterRun.seed,
      createdByMemberId: input.createdByMemberId,
      battlePreference: input.starterRun.battlePreference,
    },
    selfPlayerId,
    profileId: input.starterRun.profileId,
    streak: input.starterRun.streak,
    coopPartnerPreference: input.starterRun.coopPartnerPreference,
    starterCandidates,
    selectedStarterIndexes: [],
    playersById: {
      [selfPlayerId]: {
        playerId: selfPlayerId,
        slot: "p1",
        kind: "human",
        controller: "local",
        alliance: "near",
        ownerMemberId: input.createdByMemberId,
        roomCustomId: input.roomCustomId,
        name: input.profileSnapshot.name || "玩家",
        avatar: input.profileSnapshot.avatarAsset || "",
        backImage: input.profileSnapshot.backAsset,
        profileSnapshot: input.profileSnapshot,
        starChartSnapshot: input.starterRun.starChartSnapshot,
        money: input.starterRun.money,
        bagId: selfBagId,
        localTeamPokemonIds: [],
        ready: false,
        connectionState: "online",
        createdAt: iso,
        updatedAt: iso,
      },
    },
    pokemonById,
    bagsById: {
      [selfBagId]: {bagId: selfBagId, ownerPlayerId: selfPlayerId, maxSize: 50, itemInstanceIds: selfSystemItems.map(item => item.itemInstanceId), battleBagEnabled: Boolean(input.starterRun.battlePreference.battleBagEnabled), createdAt: iso, updatedAt: iso},
    },
    itemInstancesById: Object.fromEntries(selfSystemItems.map(item => [item.itemInstanceId, item])),
    gameMap: {nodes: []},
    roundPlan: [],
    currentNodeId: null,
    restState: {},
    commandLog: {},
  });
}

export function ensureDefaultSystemItemsForSelfV5(run: RunGameV5, now = new Date()): RunGameV5 {
  const self = requirePlayer(run, run.selfPlayerId);
  const bag = run.bagsById[self.bagId];
  if (!bag) return run;
  const iso = now.toISOString();
  const managedItems = new Set(DEFAULT_SYSTEM_ITEMS_BY_RULE_SET_V5[run.config.ruleSet] || []);
  const retainedItemIds = bag.itemInstanceIds.filter(itemInstanceId => {
    const item = run.itemInstancesById[itemInstanceId]?.item;
    return !item || !MANAGED_SYSTEM_ITEM_IDS_V5.has(item.itemID) || managedItems.has(item.itemID);
  });
  const existingItemIds = new Set(retainedItemIds.map(itemInstanceId => run.itemInstancesById[itemInstanceId]?.item.itemID).filter(Boolean));
  const additions = [...managedItems].filter(itemID => !existingItemIds.has(itemID));
  if (!additions.length && retainedItemIds.length === bag.itemInstanceIds.length) return run;
  const openSlots = Math.max(0, bag.maxSize - retainedItemIds.length);
  const addedItems = additions.slice(0, openSlots).map((itemID, index) => createSystemItemInstanceV5(itemID, self.bagId, run.matchId, iso, retainedItemIds.length + index));
  return assertRunGameV5RedLines({
    ...run,
    updatedAt: iso,
    bagsById: {
      ...run.bagsById,
      [self.bagId]: {
        ...bag,
        itemInstanceIds: [...retainedItemIds, ...addedItems.map(item => item.itemInstanceId)],
        updatedAt: iso,
      },
    },
    itemInstancesById: {
      ...run.itemInstancesById,
      ...Object.fromEntries(addedItems.map(item => [item.itemInstanceId, item])),
    },
  });
}

function createSystemItemInstancesForRuleSetV5(ruleSet: TrainingRuleSetV4, bagId: BagInstanceIdV5, matchId: string, iso: string): ItemInstanceV5[] {
  return (DEFAULT_SYSTEM_ITEMS_BY_RULE_SET_V5[ruleSet] || []).map((itemID, index) => createSystemItemInstanceV5(itemID, bagId, matchId, iso, index));
}

function createSystemItemInstanceV5(itemID: string, bagId: BagInstanceIdV5, matchId: string, iso: string, index: number): ItemInstanceV5 {
  const itemInstanceId = `item:${matchId}:self-system:${itemID}:${index + 1}`;
  return {
    itemInstanceId,
    ownerBagId: bagId,
    item: createSystemPlayerItemV5(itemID, itemInstanceId),
    createdAt: iso,
    updatedAt: iso,
  };
}

function createSystemPlayerItemV5(itemID: string, itemInstanceId: string): PlayerItemInstanceV4 {
  const names: Record<string, string> = {
    "system-mega-stone": "Mega系统",
    "system-z-crystal": "Z招式系统",
    "system-dynamax-band": "极巨化系统",
    "system-tera-orb": "太晶系统",
  };
  return {
    id: itemInstanceId,
    itemID,
    name: names[itemID] || itemID,
    image: "",
    cost: 0,
    canSale: false,
    type: "system",
    canBattleUse: false,
    canUse: false,
    canUseToPokemon: false,
    canTake: false,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
    systemReforgeKind: itemID === "system-mega-stone" ? "mega" : itemID === "system-z-crystal" ? "z-crystal" : itemID === "system-tera-orb" ? "tera" : undefined,
  };
}

export function selectStarterPokemonV5(run: RunGameV5, selectedIndexes: number[], requiredCount: number, commandId: string, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[commandId];
  if (repeated) return run;
  const uniqueIndexes = Array.from(new Set(selectedIndexes.map(index => Math.floor(Number(index))).filter(index => Number.isFinite(index))));
  if (uniqueIndexes.length !== requiredCount) throw new Error(`需要选择 ${requiredCount} 只宝可梦。`);
  const selectedPokemonIds = uniqueIndexes.map(index => run.starterCandidates[index]?.pokemonId);
  if (selectedPokemonIds.some(pokemonId => !pokemonId || !run.pokemonById[pokemonId])) throw new Error("选择中包含不存在的候选宝可梦。");
  const iso = now.toISOString();
  const self = requirePlayer(run, run.selfPlayerId);
  const pokemonById = {...run.pokemonById};
  for (const pokemonId of selectedPokemonIds) {
    const pokemon = pokemonById[pokemonId!]!;
    pokemonById[pokemonId!] = {
      ...pokemon,
      ownerPlayerId: self.playerId,
      localPokemon: {
        ...pokemon.localPokemon,
        localPokemonId: pokemonId!,
        itemId: pokemon.localPokemon.itemId || "",
        heldItemInstanceId: undefined,
        entryHp: pokemon.localPokemon.maxHp,
        entryStatus: "",
      },
      updatedAt: iso,
    };
  }
  return assertRunGameV5RedLines({
    ...run,
    status: "round_preparing",
    phase: "starter",
    revision: run.revision + 1,
    updatedAt: iso,
    selectedStarterIndexes: uniqueIndexes,
    pokemonById,
    playersById: {
      ...run.playersById,
      [self.playerId]: {...self, localTeamPokemonIds: selectedPokemonIds as string[], updatedAt: iso},
    },
    commandLog: appendCommandLog(run, commandId, "select-starters", {selectedIndexes: uniqueIndexes}, iso, run.revision + 1),
  });
}

export function ingestPreparedRoundPlanV5(run: RunGameV5, preparedRun: FormalGameRunV4, commandId: string, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[commandId];
  if (repeated) return run;
  const iso = now.toISOString();
  const self = requirePlayer(run, run.selfPlayerId);
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  const bagsById = {...run.bagsById};
  const itemInstancesById = {...run.itemInstancesById};
  const roundPlan = preparedRun.roundPlan.map(round => {
    const slots: Partial<Record<ShowdownPlayerIdV4, PlayerInstanceIdV5>> = {p1: self.playerId};
    const npcRefs: string[] = [];
    (["p2", "p3", "p4"] as ShowdownPlayerIdV4[]).forEach(slot => {
      const draft = round.participants[slot];
      if (!draft) return;
      const playerId = `player:${run.matchId}:${round.id}:${slot}`;
      slots[slot] = playerId;
      npcRefs.push(playerId);
      upsertPlayerDraftEntities({playersById, pokemonById, bagsById, itemInstancesById}, playerId, draft, iso, run.matchId, round.id);
    });
    return {
      nodeId: round.id,
      index: round.index,
      mode: round.mode,
      ruleSet: round.ruleSet,
      difficulty: round.difficulty,
      seed: round.seed,
      npcRefs,
      slots,
      diagnostics: [...round.diagnostics],
    };
  });
  const nodes = (preparedRun.restRunSnapshot?.gameMap || []).map(node => {
    const plan = roundPlan.find(entry => entry.nodeId === node.id);
    return {
      nodeId: node.id,
      index: node.index,
      state: node.state,
      mode: preparedRun.mode,
      ruleSet: node.ruleSet,
      seed: node.seed,
      slots: plan?.slots || {p1: self.playerId},
      battleGame: node.battleGame,
      createdAt: node.createdAt,
      startedAt: node.startedAt,
      endedAt: node.endedAt,
    };
  });
  return assertRunGameV5RedLines({
    ...run,
    status: "resting",
    phase: "rest",
    revision: run.revision + 1,
    updatedAt: iso,
    playersById,
    pokemonById,
    bagsById,
    itemInstancesById,
    roundPlan,
    gameMap: {nodes},
    currentNodeId: preparedRun.restRunSnapshot?.currentNodeId || nodes[0]?.nodeId || null,
    restState: {
      ...run.restState,
      shopByNodeId: preparedRun.shopByNodeId,
      trainingGroundByNodeId: preparedRun.trainingGroundByNodeId,
      roundSettlementByNodeId: preparedRun.roundSettlementByNodeId,
      exchangeByNodeId: preparedRun.exchangeByNodeId,
      restPreviewUnlocks: preparedRun.restRunSnapshot?.restPreviewUnlocks,
      coinLog: preparedRun.restRunSnapshot?.coinLog,
      battleLog: preparedRun.restRunSnapshot?.battleLog,
    },
    commandLog: appendCommandLog(run, commandId, "prepare-round", {nodeCount: nodes.length}, iso, run.revision + 1),
  });
}

export function reorderPlayerTeamV5(run: RunGameV5, pokemonIds: string[], commandId: string, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[commandId];
  if (repeated) return run;
  const self = requirePlayer(run, run.selfPlayerId);
  const current = self.localTeamPokemonIds;
  const unique = Array.from(new Set(pokemonIds.map(value => String(value || "").trim()).filter(Boolean)));
  if (unique.length !== current.length) throw new Error("队伍顺序不完整。");
  const currentSet = new Set(current);
  if (unique.some(pokemonId => !currentSet.has(pokemonId))) throw new Error("队伍顺序包含不存在的宝可梦。");
  const iso = now.toISOString();
  return assertRunGameV5RedLines({
    ...run,
    revision: run.revision + 1,
    updatedAt: iso,
    playersById: {
      ...run.playersById,
      [self.playerId]: {...self, localTeamPokemonIds: unique, updatedAt: iso},
    },
    commandLog: appendCommandLog(run, commandId, "team.reorder", {pokemonIds: unique}, iso, run.revision + 1),
  });
}

export function applyTrainingLessonV5(run: RunGameV5, input: FormalTrainingGroundApplyInputV4, lesson: FormalTrainingGroundLessonViewV4, moveSummary: Partial<TrainingMoveSlotV4> | null, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  if (self.money < lesson.fee) throw new Error("金币不足，先去赚一点再来上课吧。");
  const pokemonId = String(input.pokemonId || "");
  if (!pokemonId || !self.localTeamPokemonIds.includes(pokemonId)) throw new Error("请选择要进入课堂的宝可梦。");
  const current = requirePokemon(run, pokemonId);
  const iso = now.toISOString();
  const before = current.localPokemon;
  const updatedPokemon = lesson.kind === "self-study"
    ? applySelfStudyPokemonPatchV5(before, run, commandId)
    : applyMoveLessonPokemonPatchV5(before, input, moveSummary);
  const message = lesson.kind === "self-study"
    ? `${displayPokemonNameV5(before)}踏踏实实自习了一节课，数值稳步提升。${lesson.completeText}`
    : `${displayPokemonNameV5(before)}学会了${moveSummary?.nameZh || moveSummary?.name || input.moveId}。${lesson.completeText}`;
  const balanceAfter = Math.max(0, Math.floor(Number(self.money || 0)) - Math.max(0, Math.floor(Number(lesson.fee || 0))));
  const currentNodeId = run.currentNodeId || "rest";
  const trainingState = run.restState.trainingGroundByNodeId?.[currentNodeId] || {nodeId: currentNodeId, lessonRoll: 0, selfStudyRoll: 0, updatedAt: iso};
  const result = {
    actionType: "training.apply",
    message,
    pokemonId,
    lessonId: lesson.lessonId,
    lessonKind: lesson.kind,
    fee: lesson.fee,
    balanceAfter,
  };
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {
        ...run.playersById,
        [self.playerId]: {...self, money: balanceAfter, updatedAt: iso},
      },
      pokemonById: {
        ...run.pokemonById,
        [pokemonId]: {...current, localPokemon: updatedPokemon, updatedAt: iso},
      },
      restState: {
        ...run.restState,
        trainingGroundByNodeId: {
          ...(run.restState.trainingGroundByNodeId || {}),
          [currentNodeId]: {
            ...trainingState,
            selfStudyRoll: Math.max(0, Math.floor(Number(trainingState.selfStudyRoll || 0))) + (lesson.kind === "self-study" ? 1 : 0),
            updatedAt: iso,
          },
        },
        coinLog: appendCoinLogV5(run.restState.coinLog || [], {
          id: `coin:${commandId}`,
          key: `training:${commandId}`,
          at: iso,
          roundIndex: currentRoundIndexV5(run),
          kind: "expense",
          amount: -Math.max(0, Math.floor(Number(lesson.fee || 0))),
          balanceBefore: self.money,
          balanceAfter,
          source: "training-ground",
          label: `训练场 ${lesson.teacherLabel}`,
        }),
      },
      commandLog: appendCommandLog(run, commandId, "training.apply", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function healSelfTeamV5(run: RunGameV5, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const cost = Math.max(1, Math.floor(250 * Number(run.restState.medicalInsurance?.recoveryShopPriceMultiplier ?? 1)));
  if (self.money < cost) throw new Error("金币不足，无法进行全队治疗。");
  const iso = now.toISOString();
  const healedPokemonIds: string[] = [];
  const pokemonById = {...run.pokemonById};
  for (const pokemonId of self.localTeamPokemonIds) {
    const entry = pokemonById[pokemonId];
    if (!entry) continue;
    const pokemon = entry.localPokemon;
    const maxHp = Math.max(1, Math.floor(Number(pokemon.maxHp || 1)));
    const nextMoves = pokemon.moves.map(move => ({...move, remainingPp: Math.max(0, Math.floor(Number(move.maxPp || move.remainingPp || 0)))}));
    const changed = pokemon.entryHp !== maxHp || Boolean(pokemon.entryStatus) || pokemon.moves.some((move, index) => move.remainingPp !== nextMoves[index]?.remainingPp);
    if (changed) healedPokemonIds.push(pokemonId);
    pokemonById[pokemonId] = {...entry, localPokemon: {...pokemon, maxHp, entryHp: maxHp, entryStatus: "", moves: nextMoves}, updatedAt: iso};
  }
  const balanceAfter = Math.max(0, Math.floor(Number(self.money || 0)) - cost);
  const result = {actionType: "team.heal", message: healedPokemonIds.length ? `花费 ${cost} 金币，全队已恢复到满状态。` : `花费 ${cost} 金币，全队状态已确认。`, cost, healedPokemonIds, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      pokemonById,
      restState: {
        ...run.restState,
        coinLog: appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "rest-heal", "休息室全队治疗", -cost, self.money, balanceAfter, currentRoundIndexV5(run), iso)),
      },
      commandLog: appendCommandLog(run, commandId, "team.heal", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function buyShopProductV5(run: RunGameV5, product: FormalShopProductViewV4, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const bag = run.bagsById[self.bagId];
  if (!bag) throw new Error("缺少玩家背包。");
  const price = Math.max(0, Math.floor(Number(product.price || 0)));
  if (product.stock <= 0) throw new Error("该商品已经售罄。");
  if (price <= 0) throw new Error("该商品暂不可购买。");
  if (self.money < price) throw new Error("金币不足。");
  if (bag.itemInstanceIds.length >= bag.maxSize) throw new Error("背包已满。");
  const iso = now.toISOString();
  const itemInstanceId = `item:${run.matchId}:shop:${commandId}`;
  const item: PlayerItemInstanceV4 = createPlayerItemFromProductV5(product, itemInstanceId, currentRoundIndexV5(run));
  const balanceAfter = self.money - price;
  const nextShopByNodeId = decrementShopStockV5(run, product.slotId, iso);
  const result = {actionType: "shop.buy", message: `已购买 ${product.name}。`, itemInstanceId, itemID: product.itemID, price, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      bagsById: {...run.bagsById, [bag.bagId]: {...bag, itemInstanceIds: [...bag.itemInstanceIds, itemInstanceId], updatedAt: iso}},
      itemInstancesById: {...run.itemInstancesById, [itemInstanceId]: {itemInstanceId, ownerBagId: bag.bagId, item, createdAt: iso, updatedAt: iso}},
      restState: {
        ...run.restState,
        shopByNodeId: nextShopByNodeId,
        coinLog: appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "shop", `购买 ${product.name}`, -price, self.money, balanceAfter, currentRoundIndexV5(run), iso)),
      },
      commandLog: appendCommandLog(run, commandId, "shop.buy", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function sellBagItemsV5(run: RunGameV5, itemInstanceIds: string[], commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const bag = run.bagsById[self.bagId];
  if (!bag) throw new Error("缺少玩家背包。");
  const selected = new Set(itemInstanceIds.map(value => String(value || "")).filter(Boolean));
  if (!selected.size) throw new Error("请选择要卖出的道具。");
  const heldItemIds = new Set(self.localTeamPokemonIds.map(pokemonId => run.pokemonById[pokemonId]?.localPokemon.heldItemInstanceId).filter(Boolean) as string[]);
  const soldIds: string[] = [];
  let total = 0;
  const retainedIds = bag.itemInstanceIds.filter(itemInstanceId => {
    if (!selected.has(itemInstanceId) || heldItemIds.has(itemInstanceId)) return true;
    const item = run.itemInstancesById[itemInstanceId]?.item;
    const price = item?.canSale ? Math.max(0, Math.floor(Number(item.cost || 0) * 0.5)) : 0;
    if (!item || price <= 0) return true;
    soldIds.push(itemInstanceId);
    total += price;
    return false;
  });
  if (!soldIds.length || total <= 0) throw new Error("选中的道具不可出售。");
  const iso = now.toISOString();
  const itemInstancesById = {...run.itemInstancesById};
  soldIds.forEach(itemInstanceId => {
    delete itemInstancesById[itemInstanceId];
  });
  const balanceAfter = Math.min(999999, Math.floor(Number(self.money || 0)) + total);
  const result = {actionType: "shop.sell", message: `已卖出 ${soldIds.length} 件道具，获得 ${total} 金币。`, itemInstanceIds: soldIds, total, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      bagsById: {...run.bagsById, [bag.bagId]: {...bag, itemInstanceIds: retainedIds, updatedAt: iso}},
      itemInstancesById,
      restState: {
        ...run.restState,
        coinLog: appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "shop", `出售 ${soldIds.length} 件道具`, total, self.money, balanceAfter, currentRoundIndexV5(run), iso)),
      },
      commandLog: appendCommandLog(run, commandId, "shop.sell", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function commitSelfBagMutationV5(run: RunGameV5, input: {commandName: string; commandId: string; message: string; bagItems?: PlayerItemInstanceV4[]; pokemonUpdates?: LocalPokemonV4[]; result?: Record<string, unknown>}, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const bag = run.bagsById[self.bagId];
  if (!bag) throw new Error("缺少玩家背包。");
  const iso = now.toISOString();
  const pokemonById = {...run.pokemonById};
  for (const pokemon of input.pokemonUpdates || []) {
    const pokemonId = String(pokemon.localPokemonId || "");
    if (!pokemonId || !self.localTeamPokemonIds.includes(pokemonId) || !pokemonById[pokemonId]) continue;
    pokemonById[pokemonId] = {...pokemonById[pokemonId]!, localPokemon: pokemon, updatedAt: iso};
  }
  let bagsById = run.bagsById;
  let itemInstancesById = run.itemInstancesById;
  if (input.bagItems) {
    const nextItems = input.bagItems.map((item, index) => ({...item, id: item.id || `item:${run.matchId}:${input.commandId}:${index + 1}`}));
    const nextIds = nextItems.map(item => item.id);
    itemInstancesById = {...run.itemInstancesById};
    for (const itemInstanceId of bag.itemInstanceIds) {
      if (!nextIds.includes(itemInstanceId)) delete itemInstancesById[itemInstanceId];
    }
    for (const item of nextItems) {
      itemInstancesById[item.id] = {
        itemInstanceId: item.id,
        ownerBagId: bag.bagId,
        item,
        createdAt: itemInstancesById[item.id]?.createdAt || iso,
        updatedAt: iso,
      };
    }
    bagsById = {...run.bagsById, [bag.bagId]: {...bag, itemInstanceIds: nextIds, updatedAt: iso}};
  }
  const result = {
    actionType: input.commandName,
    message: input.message,
    ...(input.result || {}),
  };
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      pokemonById,
      bagsById,
      itemInstancesById,
      commandLog: appendCommandLog(run, input.commandId, input.commandName, result, iso, run.revision + 1),
    }),
    result,
  };
}

export function rerollSelfPokemonStatsV5(run: RunGameV5, input: {pokemonId: string; part?: unknown; lockedStats?: unknown[]}, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const pokemonId = String(input.pokemonId || "");
  if (!pokemonId || !self.localTeamPokemonIds.includes(pokemonId)) throw new Error("请选择要调整的宝可梦。");
  const current = requirePokemon(run, pokemonId);
  const part = input.part === "evs" ? "evs" : "ivs";
  const locked = new Set((input.lockedStats || []).map(value => String(value || "")).filter(Boolean));
  const cost = 80 + locked.size * 40;
  if (self.money < cost) throw new Error("金币不足。");
  const iso = now.toISOString();
  const stats = part === "ivs" ? normalizeStatsV5(current.localPokemon.ivs, 31) : normalizeStatsV5(current.localPokemon.evs, 0);
  const total = Object.values(stats).reduce((sum, value) => sum + value, 0);
  const nextStats = rerollStatsKeepingTotalV5(stats, part === "ivs" ? 31 : 252, total, locked, `${run.config.seed}:${pokemonId}:${part}:${commandId}`);
  const nextPokemon = {...current.localPokemon, [part]: nextStats};
  const balanceAfter = self.money - cost;
  const result = {actionType: "pokemon.reroll-stats", message: `花费 ${cost} 金币，${part === "ivs" ? "个体值" : "努力值"}已重新分配。`, pokemonId, part, cost, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      pokemonById: {...run.pokemonById, [pokemonId]: {...current, localPokemon: nextPokemon, updatedAt: iso}},
      restState: {
        ...run.restState,
        coinLog: appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "team-reroll", `随机${part === "ivs" ? "个体值" : "努力值"}`, -cost, self.money, balanceAfter, currentRoundIndexV5(run), iso)),
      },
      commandLog: appendCommandLog(run, commandId, "pokemon.reroll-stats", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function unlockOpponentPreviewV5(run: RunGameV5, unlockKey: string, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const key = String(unlockKey || "").trim();
  if (!key) throw new Error("请选择要打听的宝可梦。");
  const self = requirePlayer(run, run.selfPlayerId);
  if (run.restState.restPreviewUnlocks?.[key]) return {run, result: {actionType: "opponent-preview.unlock", message: "这只宝可梦的情报已经解锁。", cost: 0, unlockKey: key}};
  const cost = 10;
  if (self.money < cost) throw new Error("金币不足。");
  const iso = now.toISOString();
  const balanceAfter = self.money - cost;
  const result = {actionType: "opponent-preview.unlock", message: `花费 ${cost} 金币，已了解这只宝可梦的情报。`, cost, unlockKey: key, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      restState: {
        ...run.restState,
        restPreviewUnlocks: {...(run.restState.restPreviewUnlocks || {}), [key]: true},
        coinLog: appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "opponent-rumor", "打听对手情报", -cost, self.money, balanceAfter, currentRoundIndexV5(run), iso)),
      },
      commandLog: appendCommandLog(run, commandId, "opponent-preview.unlock", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function chooseMedicalInsuranceV5(run: RunGameV5, tier: FormalMedicalInsuranceTierViewV4 | null, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const iso = now.toISOString();
  if (!tier) {
    const result = {actionType: "insurance.buy", message: "已跳过本轮医疗保险。", choice: "decline"};
    return {
      run: assertRunGameV5RedLines({
        ...run,
        revision: run.revision + 1,
        updatedAt: iso,
        restState: {...run.restState, medicalInsuranceOfferSeen: true},
        commandLog: appendCommandLog(run, commandId, "insurance.buy", result, iso, run.revision + 1),
      }),
      result,
    };
  }
  const self = requirePlayer(run, run.selfPlayerId);
  if (self.money < tier.cost) throw new Error("金币不足。");
  const balanceAfter = self.money - tier.cost;
  const insurance = {tier: tier.tier, cost: tier.cost, reviveCostPerPokemon: tier.reviveCostPerPokemon, recoveryShopPriceMultiplier: tier.recoveryShopPriceMultiplier, purchasedAt: iso};
  const result = {actionType: "insurance.buy", message: `已购买${tier.label}。`, tier: tier.tier, cost: tier.cost, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      restState: {
        ...run.restState,
        medicalInsuranceOfferSeen: true,
        medicalInsurance: insurance,
        coinLog: appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "medical-insurance", `购买${tier.label}`, -tier.cost, self.money, balanceAfter, currentRoundIndexV5(run), iso)),
      },
      commandLog: appendCommandLog(run, commandId, "insurance.buy", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function exchangeSelfPokemonV5(run: RunGameV5, input: {sourcePokemonId: string; targetPokemon: LocalPokemonV4; view: FormalPokemonExchangeViewV4}, commandId: string, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const sourcePokemonId = String(input.sourcePokemonId || "");
  if (!sourcePokemonId || !self.localTeamPokemonIds.includes(sourcePokemonId)) throw new Error("请选择我方队伍中的宝可梦。");
  if (!input.view.available || !input.view.nodeId) throw new Error(input.view.message || "当前不能交换。");
  const cost = Math.max(0, Math.floor(Number(input.view.nextCost || 0)));
  if (self.money < cost) throw new Error("金币不足。");
  const current = requirePokemon(run, sourcePokemonId);
  const iso = now.toISOString();
  const received = {
    ...input.targetPokemon,
    localPokemonId: sourcePokemonId,
    heldItemInstanceId: undefined,
    itemId: "",
  };
  const previousState = run.restState.exchangeByNodeId?.[input.view.nodeId] || {nodeId: input.view.nodeId, records: [], updatedAt: iso};
  const record = {
    id: `exchange:${commandId}`,
    nodeId: input.view.nodeId,
    playerId: "p1" as const,
    opponentPlayerId: input.view.opponentPlayerId,
    sourcePokemonId,
    targetPokemonId: input.targetPokemon.localPokemonId,
    receivedPokemonId: sourcePokemonId,
    replacedPokemonId: current.localPokemon.localPokemonId,
    cost,
    createdAt: iso,
  };
  const balanceAfter = self.money - cost;
  const result = {actionType: "pokemon.exchange", message: `已交换 ${input.targetPokemon.nameZh || input.targetPokemon.name || input.targetPokemon.speciesId}。`, sourcePokemonId, targetPokemonId: input.targetPokemon.localPokemonId, cost, balanceAfter};
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: iso,
      playersById: {...run.playersById, [self.playerId]: {...self, money: balanceAfter, updatedAt: iso}},
      pokemonById: {...run.pokemonById, [sourcePokemonId]: {...current, localPokemon: received, updatedAt: iso}},
      restState: {
        ...run.restState,
        exchangeByNodeId: {
          ...(run.restState.exchangeByNodeId || {}),
          [input.view.nodeId]: {...previousState, records: [...previousState.records, record], updatedAt: iso},
        },
        coinLog: cost > 0 ? appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "pokemon-exchange", `交换 ${input.targetPokemon.nameZh || input.targetPokemon.name}`, -cost, self.money, balanceAfter, currentRoundIndexV5(run), iso)) : run.restState.coinLog,
      },
      commandLog: appendCommandLog(run, commandId, "pokemon.exchange", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function commitSoulmateEggClaimV5(run: RunGameV5, input: {commandId: string; formalRun: FormalGameRunV4; candidateId: string; message: string}, now = new Date()): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const claimedAt = input.formalRun.soulmateEggClaimedAt || now.toISOString();
  const result = {
    actionType: "soulmate-egg.claim",
    message: input.message,
    candidateId: input.formalRun.soulmateEggCandidateId || input.candidateId,
    playerPokemonId: input.formalRun.soulmatePlayerPokemonId || "",
  };
  return {
    run: assertRunGameV5RedLines({
      ...run,
      revision: run.revision + 1,
      updatedAt: claimedAt,
      soulmateState: {
        ...(run.soulmateState || {}),
        eggClaimedAt: claimedAt,
        eggCandidateId: input.formalRun.soulmateEggCandidateId || input.candidateId,
        playerPokemonId: input.formalRun.soulmatePlayerPokemonId || "",
        friendshipSettlementByNodeId: input.formalRun.soulmateFriendshipSettlementByNodeId || run.soulmateState?.friendshipSettlementByNodeId,
        honorSettlementByNodeId: input.formalRun.soulmateHonorSettlementByNodeId || run.soulmateState?.honorSettlementByNodeId,
        battleEvolutionByNodeId: input.formalRun.soulmateBattleEvolutionByNodeId || run.soulmateState?.battleEvolutionByNodeId,
      },
      commandLog: appendCommandLog(run, input.commandId, "soulmate-egg.claim", result, claimedAt, run.revision + 1),
    }),
    result,
  };
}

export function markBattleRunningV5(run: RunGameV5, input: {nodeId: string; battleGameId: string; commandId: string}, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return run;
  const iso = now.toISOString();
  return assertRunGameV5RedLines({
    ...run,
    status: "battling",
    phase: "battle",
    revision: run.revision + 1,
    updatedAt: iso,
    gameMap: {
      nodes: run.gameMap.nodes.map(node => node.nodeId === input.nodeId ? {
        ...node,
        state: "running",
        startedAt: node.startedAt || iso,
        battleGame: {id: input.battleGameId, status: "running"},
      } : node),
    },
    currentNodeId: input.nodeId || run.currentNodeId,
    commandLog: appendCommandLog(run, input.commandId, "prepare-battle", {nodeId: input.nodeId, battleGameId: input.battleGameId}, iso, run.revision + 1),
  });
}

export function applyBattleFinalizedResultV5(run: RunGameV5, input: {compatRun: FormalGameRunV4; commandId: string; destination: "rest" | "settlement"; reason?: FormalBattleResultFinalizeReasonV4; settlementNotice?: string}, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return run;
  const iso = now.toISOString();
  const compatRest = input.compatRun.restRunSnapshot;
  const currentNodeId = compatRest?.currentNodeId || run.currentNodeId;
  const self = requirePlayer(run, run.selfPlayerId);
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  const currentCompatNode = currentNodeId ? compatRest?.gameMap.find(node => node.id === currentNodeId) : null;
  const currentNode = currentNodeId ? run.gameMap.nodes.find(node => node.nodeId === currentNodeId) : null;

  if (compatRest && currentNode) {
    for (const [slot, playerId] of Object.entries(currentNode.slots) as Array<[ShowdownPlayerIdV4, string | undefined]>) {
      if (!playerId) continue;
      const draft = currentCompatNode?.participants?.[slot] || compatRest.players[slot];
      if (!draft || !playersById[playerId]) continue;
      playersById[playerId] = {...playersById[playerId]!, updatedAt: iso};
      for (const compatPokemon of draft.localTeam.pokemon || []) {
        const pokemonId = String(compatPokemon.localPokemonId || "");
        if (!pokemonId || !pokemonById[pokemonId] || pokemonById[pokemonId]!.ownerPlayerId !== playerId) continue;
        pokemonById[pokemonId] = {...pokemonById[pokemonId]!, localPokemon: compatPokemon, updatedAt: iso};
      }
    }
  }

  playersById[self.playerId] = {
    ...playersById[self.playerId]!,
    money: clampIntV5(input.compatRun.money, 0, 999999, self.money),
    updatedAt: iso,
  };

  const nodeById = new Map((compatRest?.gameMap || []).map(node => [node.id, node]));
  const gameMap = {
    nodes: run.gameMap.nodes.map(node => {
      const compatNode = nodeById.get(node.nodeId);
      if (!compatNode) return node;
      return {
        ...node,
        state: compatNode.state,
        battleGame: compatNode.battleGame,
        startedAt: compatNode.startedAt || node.startedAt,
        endedAt: compatNode.endedAt || node.endedAt || (compatNode.state === "won" || compatNode.state === "lost" ? iso : undefined),
      };
    }),
  };
  const status = statusFromCompatRun(input.compatRun, input.destination === "settlement" ? "settlement_ready" : "resting");
  const nextStatus = input.destination === "settlement" ? "settlement_ready" : status === "battling" || status === "battle_preparing" ? "resting" : status;
  return assertRunGameV5RedLines({
    ...run,
    status: nextStatus,
    phase: input.destination === "settlement" ? "settlement" : "rest",
    revision: run.revision + 1,
    updatedAt: iso,
    playersById,
    pokemonById,
    gameMap,
    currentNodeId,
    restState: {
      ...run.restState,
      shopByNodeId: input.compatRun.shopByNodeId || run.restState.shopByNodeId,
      trainingGroundByNodeId: input.compatRun.trainingGroundByNodeId || run.restState.trainingGroundByNodeId,
      roundSettlementByNodeId: input.compatRun.roundSettlementByNodeId || run.restState.roundSettlementByNodeId,
      exchangeByNodeId: input.compatRun.exchangeByNodeId || run.restState.exchangeByNodeId,
      medicalInsuranceOfferSeen: Boolean(input.compatRun.medicalInsuranceOfferSeen || run.restState.medicalInsuranceOfferSeen),
      medicalInsurance: input.compatRun.medicalInsurance || run.restState.medicalInsurance || null,
      restPreviewUnlocks: compatRest?.restPreviewUnlocks || run.restState.restPreviewUnlocks,
      coinLog: compatRest?.coinLog || run.restState.coinLog,
      battleLog: compatRest?.battleLog || run.restState.battleLog,
    },
    commandLog: appendCommandLog(run, input.commandId, "finalize-battle", {
      destination: input.destination,
      reason: input.reason || null,
      settlementNotice: input.settlementNotice || "",
      nodeId: currentNodeId || null,
    }, iso, run.revision + 1),
  });
}

export function commitFinalSettlementV5(run: RunGameV5, input: {commandId: string; formalRun: FormalGameRunV4; reason: FormalSettlementReasonV4; summary: Record<string, unknown>}, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return run;
  if (!input.formalRun.settlement?.id) throw new Error("RunGameV5 final settlement missing settlement.");
  const iso = now.toISOString();
  const self = requirePlayer(run, run.selfPlayerId);
  const compatRest = input.formalRun.restRunSnapshot;
  const gameMap = {
    nodes: run.gameMap.nodes.map(node => {
      const compatNode = compatRest?.gameMap.find(entry => entry.id === node.nodeId);
      if (!compatNode) return node;
      return {
        ...node,
        state: compatNode.state,
        battleGame: compatNode.battleGame,
        startedAt: compatNode.startedAt || node.startedAt,
        endedAt: compatNode.endedAt || node.endedAt || (compatNode.state === "won" || compatNode.state === "lost" ? iso : undefined),
      };
    }),
  };
  return assertRunGameV5RedLines({
    ...run,
    status: "ended",
    phase: "settlement",
    revision: run.revision + 1,
    updatedAt: iso,
    playersById: {
      ...run.playersById,
      [self.playerId]: {...self, money: clampIntV5(input.formalRun.money, 0, 999999, self.money), updatedAt: iso},
    },
    gameMap,
    restState: {
      ...run.restState,
      coinLog: compatRest?.coinLog || run.restState.coinLog,
      battleLog: compatRest?.battleLog || run.restState.battleLog,
    },
    finalResult: {
      settlementId: input.formalRun.settlement.id,
      settlement: input.formalRun.settlement,
      settledAt: input.formalRun.settledAt,
      summary: input.summary,
    },
    commandLog: appendCommandLog(run, input.commandId, "finalize-run", {
      settlementId: input.formalRun.settlement.id,
      reason: input.reason,
      summary: input.summary,
    }, iso, run.revision + 1),
  });
}

export function buildBattleSessionFormalRunV5(run: RunGameV5): FormalGameRunV4 {
  return buildFormalRunCompatViewV5(run);
}

export function buildFormalRunCompatViewV5(run: RunGameV5): FormalGameRunV4 {
  const self = requirePlayer(run, run.selfPlayerId);
  const playerTeam = teamForPlayer(run, self, `formal-player-team-${run.runId}`, "正式游戏初始队伍");
  const roundPlan = run.roundPlan.map(round => {
    const participants = participantsForSlots(run, round.slots);
    return {
      id: round.nodeId,
      index: round.index,
      mode: round.mode,
      ruleSet: round.ruleSet,
      difficulty: round.difficulty,
      seed: round.seed,
      npcs: round.npcRefs.map(playerId => npcSnapshotForPlayer(run.playersById[playerId], round.nodeId)).filter((npc): npc is FormalRoundNpcSnapshotV4 => Boolean(npc)),
      participants,
      diagnostics: [...round.diagnostics, "compat-view:read-only"],
    };
  });
  const gameMap = run.gameMap.nodes.map(node => ({
    id: node.nodeId,
    index: node.index,
    state: node.state,
    p1: node.slots.p1 ? "p1" : null,
    p2: node.slots.p2 ? "p2" : null,
    p3: node.slots.p3 ? "p3" : null,
    p4: node.slots.p4 ? "p4" : null,
    mode: node.mode,
    ruleSet: node.ruleSet,
    seed: node.seed,
    participants: participantsForSlots(run, node.slots),
    battleGame: node.battleGame,
    createdAt: node.createdAt,
    startedAt: node.startedAt,
    endedAt: node.endedAt,
  } satisfies TrainingRunGameNodeV4));
  const currentNodeSlots = run.gameMap.nodes.find(node => node.nodeId === run.currentNodeId)?.slots || {p1: run.selfPlayerId};
  const scenarioPlayers = Object.values(participantsForSlots(run, currentNodeSlots)).filter(Boolean) as TrainingPlayerDraftV4[];
  const restRunSnapshot: TrainingRunGameV4 | null = gameMap.length ? {
    version: 1,
    id: `compat-rest-${run.runId}`,
    source: "training",
    status: run.status === "ended" ? "ended" : run.status === "settlement_ready" ? "battleEndedPendingSettlement" : run.status === "battling" ? "battling" : run.status === "battle_preparing" ? "battlePreparing" : "resting",
    profileId: run.profileId,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    scenario: {
      id: `compat-scenario-${run.runId}`,
      name: "正式房间对局",
      mode: run.config.mode,
      ruleSet: run.config.ruleSet,
      battleCount: gameMap.length,
      players: scenarioPlayers,
      selectedNpcIds: {},
    },
    players: participantsForSlots(run, currentNodeSlots),
    currentNodeId: run.currentNodeId,
    gameMap,
    result: run.status === "ended" && run.finalResult?.settlement ? {
      outcome: run.finalResult.settlement.outcome,
      reason: run.finalResult.settlement.reason,
    } : null,
    battlePreference: run.config.battlePreference,
    competitionMode: run.config.competitionMode,
    restPreviewUnlocks: run.restState.restPreviewUnlocks,
    coinLog: run.restState.coinLog,
    battleLog: run.restState.battleLog,
  } : null;
  return {
    version: 1,
    id: run.runId,
    source: "formal",
    mode: run.config.mode,
    competitionMode: run.config.competitionMode,
    status: run.status === "starter_selecting" ? "starterSelecting" : run.status === "round_preparing" ? "roundPlanPending" : run.status === "ended" ? "ended" : "resting",
    profileId: run.profileId,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    seed: run.config.seed,
    streak: run.streak,
    battlePreference: run.config.battlePreference,
    starChartSnapshot: self.starChartSnapshot || ({} as FormalGameRunV4["starChartSnapshot"]),
    coopPartnerPreference: run.coopPartnerPreference,
    starterCandidates: run.starterCandidates.map(candidate => ({...candidate, pokemon: requirePokemon(run, candidate.pokemonId).localPokemon})),
    selectedStarterIndexes: [...run.selectedStarterIndexes],
    playerTeam: self.localTeamPokemonIds.length ? playerTeam : null,
    roundPlan,
    restRunSnapshot,
    currentRoundIndex: gameMap.find(node => node.id === run.currentNodeId)?.index || 0,
    money: self.money,
    shopByNodeId: run.restState.shopByNodeId,
    trainingGroundByNodeId: run.restState.trainingGroundByNodeId,
    roundSettlementByNodeId: run.restState.roundSettlementByNodeId,
    exchangeByNodeId: run.restState.exchangeByNodeId,
    soulmateEggClaimedAt: run.soulmateState?.eggClaimedAt,
    soulmateEggCandidateId: run.soulmateState?.eggCandidateId,
    soulmatePlayerPokemonId: run.soulmateState?.playerPokemonId,
    soulmateFriendshipSettlementByNodeId: run.soulmateState?.friendshipSettlementByNodeId,
    soulmateHonorSettlementByNodeId: run.soulmateState?.honorSettlementByNodeId,
    soulmateBattleEvolutionByNodeId: run.soulmateState?.battleEvolutionByNodeId,
    medicalInsuranceOfferSeen: Boolean(run.restState.medicalInsuranceOfferSeen || run.restState.medicalInsurance),
    medicalInsurance: run.restState.medicalInsurance || null,
    settlement: run.finalResult?.settlement || null,
    settled: run.status === "ended" || Boolean(run.finalResult?.settlement),
    settledAt: run.finalResult?.settledAt,
  };
}

export function assertRunGameV5RedLines(run: RunGameV5): RunGameV5 {
  const forbidden = /"participants"|"localTeam"|"bag"|"money"|"pokemon"|"items"/;
  const mapJson = JSON.stringify(run.gameMap);
  const roundJson = JSON.stringify(run.roundPlan);
  if (forbidden.test(mapJson)) throw new Error("RunGameV5 redline violation: gameMap contains entity payload fields.");
  if (forbidden.test(roundJson)) throw new Error("RunGameV5 redline violation: roundPlan contains entity payload fields.");
  return run;
}

function upsertPlayerDraftEntities(
  store: Pick<RunGameV5, "playersById" | "pokemonById" | "bagsById" | "itemInstancesById">,
  playerId: string,
  draft: TrainingPlayerDraftV4,
  iso: string,
  matchId: string,
  nodeId: string,
): void {
  const bagId = `bag:${playerId}`;
  const itemInstanceIds = draft.bag.items.map((item, index) => {
    const itemInstanceId = item.id || `item:${matchId}:${nodeId}:${draft.playerId}:${index + 1}`;
    store.itemInstancesById[itemInstanceId] = {itemInstanceId, ownerBagId: bagId, item: {...item, id: itemInstanceId}, createdAt: iso, updatedAt: iso};
    return itemInstanceId;
  });
  const pokemonIds = draft.localTeam.pokemon.map((pokemon, index) => {
    const pokemonId = `${playerId}:pokemon:${index + 1}`;
    store.pokemonById[pokemonId] = {
      pokemonId,
      ownerPlayerId: playerId,
      localPokemon: {...pokemon, localPokemonId: pokemonId},
      createdAt: iso,
      updatedAt: iso,
    };
    return pokemonId;
  });
  store.bagsById[bagId] = {
    bagId,
    ownerPlayerId: playerId,
    maxSize: draft.bag.maxSize,
    itemInstanceIds,
    battleBagEnabled: draft.bag.battleBagEnabled,
    createdAt: iso,
    updatedAt: iso,
  };
  const previous = store.playersById[playerId];
  store.playersById[playerId] = {
    ...previous,
    playerId,
    slot: draft.playerId,
    kind: draft.controller === "ai" ? "npc" : "human",
    controller: draft.controller,
    alliance: draft.alliance,
    name: draft.name,
    avatar: draft.avatar,
    backImage: draft.backImage,
    npcProfile: draft.controller === "ai" ? npcProfileFromDraft(draft, nodeId) : undefined,
    money: previous?.money || 0,
    bagId,
    localTeamPokemonIds: pokemonIds,
    ready: previous?.ready || false,
    connectionState: previous?.connectionState || (draft.controller === "ai" ? "online" : "disconnected"),
    createdAt: previous?.createdAt || iso,
    updatedAt: iso,
  };
}

function statusFromCompatRun(run: FormalGameRunV4, fallback: RunGameStatusV5): RunGameStatusV5 {
  if (run.settled || run.status === "ended") return "ended";
  const restStatus = run.restRunSnapshot?.status || "";
  if (restStatus === "battlePreparing") return "battle_preparing";
  if (restStatus === "battling") return "battling";
  if (restStatus === "battleEndedPendingSettlement" || restStatus === "settling") return "settlement_ready";
  if (run.restRunSnapshot) return "resting";
  if (run.playerTeam) return "round_preparing";
  return fallback;
}

function phaseFromStatus(status: RunGameStatusV5): RunGamePhaseV5 {
  if (status === "battling" || status === "battle_preparing" || status === "battle_settling") return "battle";
  if (status === "ended" || status === "settlement_ready") return "settlement";
  if (status === "starter_selecting" || status === "round_preparing") return "starter";
  return "rest";
}

function appendCommandLog(run: RunGameV5, commandId: string, commandName: string, result: unknown, createdAt: string, revision: number): RunGameV5["commandLog"] {
  return {...run.commandLog, [commandId]: {revision, commandName, result: sanitizeCommandLogResultV5(result), createdAt}};
}

function sanitizeCommandLogResultV5(result: unknown): RunGameCommandLogResultV5 {
  if (result == null) return null;
  if (typeof result !== "object" || Array.isArray(result)) return {value: result};
  const json = JSON.stringify(result);
  const forbidden = /"(?:run|formalRun|restRunSnapshot|gameMap|participants|localTeam|bag|pokemon|items)"\s*:/;
  if (forbidden.test(json)) {
    throw new Error("RunGameV5 redline violation: commandLog result contains large authority payload.");
  }
  if (Buffer.byteLength(json, "utf8") > 16 * 1024) {
    throw new Error("RunGameV5 redline violation: commandLog result is too large.");
  }
  return result as Record<string, unknown>;
}

function applySelfStudyPokemonPatchV5(pokemon: LocalPokemonV4, run: RunGameV5, commandId: string): LocalPokemonV4 {
  const seed = `${run.config.seed}:${run.currentNodeId || "rest"}:${commandId}:${pokemon.localPokemonId}`;
  const statOrder = shuffleStatsV5(seed);
  const ivs = spreadStatGainV5(normalizeStatsV5(pokemon.ivs, 31), 31, 3, statOrder);
  const evs = spreadStatGainV5(normalizeStatsV5(pokemon.evs, 0), 252, 12, statOrder);
  return {
    ...pokemon,
    ivs,
    evs,
  };
}

function applyMoveLessonPokemonPatchV5(pokemon: LocalPokemonV4, input: FormalTrainingGroundApplyInputV4, moveSummary: Partial<TrainingMoveSlotV4> | null): LocalPokemonV4 {
  const moveId = String(input.moveId || moveSummary?.moveId || "");
  if (!moveId) throw new Error("请选择要学习的招式。");
  if (pokemon.moves.some(move => String(move.moveId || "").toLowerCase() === moveId.toLowerCase())) {
    throw new Error(`${displayPokemonNameV5(pokemon)}已经会这个招式了。`);
  }
  const replaceMoveIndex = Math.floor(Number(input.replaceMoveIndex ?? -1));
  if (replaceMoveIndex < 0 || replaceMoveIndex >= pokemon.moves.length) throw new Error("请选择要替换的招式。");
  if (pokemon.locks?.moves?.[replaceMoveIndex]) throw new Error("这个招式槽被锁定，不能替换。");
  const nextMove: TrainingMoveSlotV4 = {
    moveId,
    name: moveSummary?.name || moveId,
    nameZh: moveSummary?.nameZh || moveSummary?.name || moveId,
    type: moveSummary?.type || "",
    category: moveSummary?.category || "",
    power: Math.max(0, Math.floor(Number(moveSummary?.power || 0))),
    accuracy: moveSummary?.accuracy ?? null,
    pp: Math.max(1, Math.floor(Number(moveSummary?.pp || 10))),
    maxPp: Math.max(1, Math.floor(Number(moveSummary?.maxPp || moveSummary?.pp || 10))),
    remainingPp: Math.max(1, Math.floor(Number(moveSummary?.remainingPp || moveSummary?.pp || 10))),
  };
  return {
    ...pokemon,
    moves: pokemon.moves.map((move, index) => index === replaceMoveIndex ? nextMove : move),
  };
}

function normalizeStatsV5(stats: Partial<StatTableV4> | undefined, fallback: number): StatTableV4 {
  return {
    hp: clampIntV5(stats?.hp, 0, fallback, fallback),
    atk: clampIntV5(stats?.atk, 0, fallback, fallback),
    def: clampIntV5(stats?.def, 0, fallback, fallback),
    spa: clampIntV5(stats?.spa, 0, fallback, fallback),
    spd: clampIntV5(stats?.spd, 0, fallback, fallback),
    spe: clampIntV5(stats?.spe, 0, fallback, fallback),
  };
}

function spreadStatGainV5(stats: StatTableV4, cap: number, gain: number, order: Array<keyof StatTableV4>): StatTableV4 {
  const next = {...stats};
  let remaining = Math.max(0, Math.floor(Number(gain || 0)));
  for (let pass = 0; pass < 6 && remaining > 0; pass += 1) {
    for (const stat of order) {
      if (remaining <= 0) break;
      if (next[stat] >= cap) continue;
      next[stat] += 1;
      remaining -= 1;
    }
  }
  return next;
}

function rerollStatsKeepingTotalV5(stats: StatTableV4, cap: number, total: number, locked: Set<string>, seed: string): StatTableV4 {
  const order = shuffleStatsV5(seed);
  const next: StatTableV4 = {...stats};
  const unlocked = order.filter(stat => !locked.has(stat));
  if (!unlocked.length) return next;
  for (const stat of unlocked) next[stat] = 0;
  let remaining = Math.max(0, Math.floor(Number(total || 0))) - Object.entries(next).reduce((sum, [stat, value]) => locked.has(stat) ? sum + value : sum, 0);
  let state = hashNumberV5(seed);
  while (remaining > 0 && unlocked.some(stat => next[stat] < cap)) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const stat = unlocked[state % unlocked.length]!;
    if (next[stat] >= cap) continue;
    next[stat] += 1;
    remaining -= 1;
  }
  return next;
}

function shuffleStatsV5(seed: string): Array<keyof StatTableV4> {
  const stats: Array<keyof StatTableV4> = ["hp", "atk", "def", "spa", "spd", "spe"];
  let state = hashNumberV5(seed);
  for (let index = stats.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [stats[index], stats[swapIndex]] = [stats[swapIndex]!, stats[index]!];
  }
  return stats;
}

function hashNumberV5(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function appendCoinLogV5(log: TrainingCoinLogEntryV4[], entry: TrainingCoinLogEntryV4): TrainingCoinLogEntryV4[] {
  if (log.some(item => item.key === entry.key)) return log;
  return [...log, entry].slice(-200);
}

function coinLogEntryV5(commandId: string, source: string, label: string, amount: number, balanceBefore: number, balanceAfter: number, roundIndex: number, at: string): TrainingCoinLogEntryV4 {
  return {
    id: `coin:${commandId}`,
    key: `${source}:${commandId}`,
    at,
    roundIndex,
    kind: amount > 0 ? "income" : amount < 0 ? "expense" : "adjustment",
    amount,
    balanceBefore,
    balanceAfter,
    source,
    label,
  };
}

function createPlayerItemFromProductV5(product: FormalShopProductViewV4, itemInstanceId: string, roundIndex: number): PlayerItemInstanceV4 {
  const itemType = product.type === "recovery" ? "medicine" : product.type === "parenting" ? "misc" : product.type;
  return {
    id: itemInstanceId,
    itemID: product.itemID,
    name: product.name || product.itemID,
    image: product.iconUrl || "",
    cost: Math.max(0, Math.floor(Number(product.price || 0))),
    canSale: true,
    type: itemType,
    canBattleUse: product.type === "battle" || product.type === "recovery" || product.type === "berry",
    canUse: product.type === "recovery" || product.type === "training" || product.type === "tm",
    canUseToPokemon: product.type === "recovery" || product.type === "training" || product.type === "tm" || product.type === "evolution",
    canTake: product.type === "berry" || product.type === "battle",
    effectRound: null,
    getRound: roundIndex,
    maxUseCount: null,
    useCount: 0,
  };
}

function decrementShopStockV5(run: RunGameV5, slotId: string, updatedAt: string): RunGameV5["restState"]["shopByNodeId"] {
  const shopByNodeId = run.restState.shopByNodeId;
  if (!shopByNodeId || !run.currentNodeId || !shopByNodeId[run.currentNodeId]) return shopByNodeId;
  const shop = shopByNodeId[run.currentNodeId]!;
  return {
    ...shopByNodeId,
    [run.currentNodeId]: {
      ...shop,
      categories: Object.fromEntries(Object.entries(shop.categories).map(([category, items]) => [
        category,
        items.map(item => item.slotId === slotId ? {...item, stock: Math.max(0, Math.floor(Number(item.stock || 0)) - 1), updatedAt} : item),
      ])) as typeof shop.categories,
      updatedAt,
    },
  };
}

function currentRoundIndexV5(run: RunGameV5): number {
  return Math.max(0, Math.floor(Number(run.gameMap.nodes.find(node => node.nodeId === run.currentNodeId)?.index || 0)));
}

function displayPokemonNameV5(pokemon: LocalPokemonV4): string {
  return pokemon.nickname || pokemon.nameZh || pokemon.name || pokemon.speciesId || "宝可梦";
}

function clampIntV5(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function requirePlayer(run: RunGameV5, playerId: string): PlayerInstanceV5 {
  const player = run.playersById[playerId];
  if (!player) throw new Error(`缺少玩家实体：${playerId}`);
  return player;
}

function requirePokemon(run: RunGameV5, pokemonId: string): PokemonInstanceV5 {
  const pokemon = run.pokemonById[pokemonId];
  if (!pokemon) throw new Error(`缺少宝可梦实体：${pokemonId}`);
  return pokemon;
}

function teamForPlayer(run: RunGameV5, player: PlayerInstanceV5, id: string, name: string): LocalTeamV4 {
  return {
    id,
    name,
    pokemon: player.localTeamPokemonIds.map(pokemonId => requirePokemon(run, pokemonId).localPokemon),
  };
}

function bagForPlayer(run: RunGameV5, player: PlayerInstanceV5): TrainingPlayerDraftV4["bag"] {
  const bag = run.bagsById[player.bagId];
  if (!bag) return {maxSize: 50, items: []};
  return {
    maxSize: bag.maxSize,
    battleBagEnabled: bag.battleBagEnabled,
    items: bag.itemInstanceIds.map(itemInstanceId => run.itemInstancesById[itemInstanceId]?.item).filter((item): item is PlayerItemInstanceV4 => Boolean(item)),
  };
}

function draftForPlayer(run: RunGameV5, playerId: string): TrainingPlayerDraftV4 | null {
  const player = run.playersById[playerId];
  if (!player) return null;
  return {
    playerId: player.slot,
    name: player.name,
    avatar: player.avatar,
    backImage: player.backImage,
    controller: player.controller,
    alliance: player.alliance,
    localTeam: teamForPlayer(run, player, `team:${player.playerId}`, `${player.name}的队伍`),
    bag: bagForPlayer(run, player),
  };
}

function participantsForSlots(run: RunGameV5, slots: Partial<Record<ShowdownPlayerIdV4, string>>): Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> {
  const entries = (["p1", "p2", "p3", "p4"] as ShowdownPlayerIdV4[]).flatMap(slot => {
    const playerId = slots[slot];
    const draft = playerId ? draftForPlayer(run, playerId) : null;
    return draft ? [[slot, draft] as const] : [];
  });
  return Object.fromEntries(entries) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
}

function npcSnapshotForPlayer(player: PlayerInstanceV5 | undefined, nodeId: string): FormalRoundNpcSnapshotV4 | null {
  if (!player || player.kind !== "npc") return null;
  return {
    id: player.npcProfile?.trainerId || player.playerId,
    trainerId: player.npcProfile?.trainerId || player.playerId,
    trainerType: player.npcProfile?.rank === "boss" ? "villain" : player.npcProfile?.rank === "champion" ? "champion" : player.npcProfile?.rank === "elite" ? "elite" : "normal",
    name: player.name,
    avatar: player.avatar,
    playerId: player.slot,
    battlePreference: "balanced",
    teamPreference: "balanced",
    powerProfile: player.npcProfile?.rank === "boss" ? "boss" : player.npcProfile?.rank === "champion" ? "champion" : player.npcProfile?.rank === "elite" ? "elite" : "normal",
    isBoss: player.npcProfile?.rank === "boss",
    diagnostics: [`v5-player:${player.playerId}`, `node:${nodeId}`],
  };
}

function npcProfileFromDraft(draft: TrainingPlayerDraftV4, nodeId: string): PlayerInstanceV5["npcProfile"] {
  const rank = /冠军/.test(draft.name) ? "champion" : /馆主/.test(draft.name) ? "gym_leader" : /Boss|首领|反派/.test(draft.name) ? "boss" : "trainer";
  const rankLabel = rank === "champion" ? "冠军" : rank === "gym_leader" ? "馆主" : rank === "boss" ? "Boss" : "普通训练家";
  return {
    trainerId: draft.name || draft.playerId,
    rank,
    rankLabel,
    aiProfile: {
      difficulty: rank === "boss" ? "boss" : rank === "champion" ? "expert" : rank === "gym_leader" ? "hard" : "normal",
      strategy: "balanced",
    },
  };
}
