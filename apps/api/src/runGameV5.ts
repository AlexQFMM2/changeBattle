import type {BattlePreferenceV4, FormalCompetitionModeV4, PlayerItemInstanceV4, ShowdownPlayerIdV4, StatTableV4, TrainingAllianceV4, TrainingBattleLogEntryV4, TrainingCoinLogEntryV4, TrainingMoveSlotV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4, TrainingRuleSetV4, TrainingStatusV4} from "./training.js";
import type {FormalBattleResultFinalizeReasonV4, FormalGameModeV4, FormalMedicalInsuranceStateV4, FormalMedicalInsuranceTierViewV4, FormalGameRunV4, FormalPokemonExchangeViewV4, FormalRoundNpcSnapshotV4, FormalRoundPlanV4, FormalSettlementReasonV4, FormalShopProductViewV4, FormalStarterCandidateV4, FormalTrainingGroundApplyInputV4, FormalTrainingGroundLessonViewV4} from "./formalGame.js";
import type {LocalPokemonV4, LocalTeamV4} from "./training.js";
import type {PlayerVaultV4, UserProfileV2} from "./index.js";
import {createBattleGameFromNodeDraft, type BattleGameV4, type BattleSessionCreateInputV4, type BattleSessionSnapshotV4, type BattleTeamPokemonStateV4} from "./battle.js";
import {starChartHasRuntimeEffectV4} from "./starChart.js";

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

export type RunGamePlayerViewV5 = Omit<PlayerInstanceV5, "profileSnapshot" | "starChartSnapshot"> & {
  profileId?: string;
  teamSize: number;
};

export type RunGamePokemonViewV5 = PokemonInstanceV5;
export type RunGameItemViewV5 = ItemInstanceV5;

export type RunGameViewV5 = {
  version: 5;
  runId: string;
  roomId: string;
  matchId: string;
  status: RunGameStatusV5;
  phase: RunGamePhaseV5;
  revision: number;
  updatedAt: string;
  config: RunGameConfigV5;
  selfPlayerId: PlayerInstanceIdV5;
  selfPlayer: RunGamePlayerViewV5 | null;
  players: RunGamePlayerViewV5[];
  team: RunGamePokemonViewV5[];
  bag: {
    bagId: BagInstanceIdV5;
    ownerPlayerId: PlayerInstanceIdV5;
    maxSize: number;
    battleBagEnabled?: boolean;
    itemInstanceIds: ItemInstanceIdV5[];
    items: RunGameItemViewV5[];
  } | null;
  starter: {
    selectedIndexes: number[];
    candidates: Array<StarterCandidateRefV5 & {pokemon: RunGamePokemonViewV5 | null}>;
  };
  map: {
    currentNodeId: GameNodeIdV5 | null;
    nodes: GameMapNodeV5[];
    roundPlan: RoundPlanV5[];
  };
  rest: RunGameV5["restState"];
  settlement: RunGameV5["finalResult"] | null;
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

export function buildRunGameViewV5(run: RunGameV5): RunGameViewV5 {
  const self = run.playersById[run.selfPlayerId] || null;
  const bag = self ? run.bagsById[self.bagId] || null : null;
  return {
    version: 5,
    runId: run.runId,
    roomId: run.roomId,
    matchId: run.matchId,
    status: run.status,
    phase: run.phase,
    revision: run.revision,
    updatedAt: run.updatedAt,
    config: run.config,
    selfPlayerId: run.selfPlayerId,
    selfPlayer: self ? playerViewV5(run, self) : null,
    players: Object.values(run.playersById).map(player => playerViewV5(run, player)),
    team: self ? self.localTeamPokemonIds.map(pokemonId => run.pokemonById[pokemonId]).filter((entry): entry is PokemonInstanceV5 => Boolean(entry)) : [],
    bag: bag ? {
      bagId: bag.bagId,
      ownerPlayerId: bag.ownerPlayerId,
      maxSize: bag.maxSize,
      battleBagEnabled: bag.battleBagEnabled,
      itemInstanceIds: [...bag.itemInstanceIds],
      items: bag.itemInstanceIds.map(itemInstanceId => run.itemInstancesById[itemInstanceId]).filter((entry): entry is ItemInstanceV5 => Boolean(entry)),
    } : null,
    starter: {
      selectedIndexes: [...run.selectedStarterIndexes],
      candidates: run.starterCandidates.map(candidate => ({
        ...candidate,
        pokemon: run.pokemonById[candidate.pokemonId] || null,
      })),
    },
    map: {
      currentNodeId: run.currentNodeId,
      nodes: run.gameMap.nodes.map(node => ({...node, slots: {...node.slots}})),
      roundPlan: run.roundPlan.map(round => ({...round, slots: {...round.slots}, npcRefs: [...round.npcRefs], diagnostics: [...round.diagnostics]})),
    },
    rest: {
      ...run.restState,
      coinLog: run.restState.coinLog ? [...run.restState.coinLog] : undefined,
      battleLog: run.restState.battleLog ? [...run.restState.battleLog] : undefined,
    },
    settlement: run.finalResult || null,
  };
}

function playerViewV5(run: RunGameV5, player: PlayerInstanceV5): RunGamePlayerViewV5 {
  const {profileSnapshot: _profileSnapshot, starChartSnapshot: _starChartSnapshot, ...publicPlayer} = player;
  return {
    ...publicPlayer,
    profileId: player.profileSnapshot?.id || (player.playerId === run.selfPlayerId ? run.profileId : undefined),
    localTeamPokemonIds: [...player.localTeamPokemonIds],
    teamSize: player.localTeamPokemonIds.length,
  };
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

export function prepareBattleSessionFromRunGameV5(run: RunGameV5): {battleGame: BattleGameV4; sessionInput: BattleSessionCreateInputV4} {
  const node = run.currentNodeId
    ? run.gameMap.nodes.find(entry => entry.nodeId === run.currentNodeId)
    : run.gameMap.nodes.find(entry => entry.state === "ready" || entry.state === "preparing" || entry.state === "running") || run.gameMap.nodes[0];
  if (!node) throw new Error("当前没有可进入的正式战斗节点。");
  const participants = participantsForSlots(run, node.slots);
  if (!participants.p1) throw new Error("缺少玩家战斗实体。");
  const trainingNode: TrainingRunGameNodeV4 = {
    id: node.nodeId,
    index: node.index,
    state: node.state,
    p1: participants.p1 ? "p1" : null,
    p2: participants.p2 ? "p2" : null,
    p3: participants.p3 ? "p3" : null,
    p4: participants.p4 ? "p4" : null,
    mode: node.mode,
    ruleSet: node.ruleSet,
    seed: node.seed,
    participants,
    battleGame: node.battleGame,
    createdAt: node.createdAt,
    startedAt: node.startedAt,
    endedAt: node.endedAt,
  };
  return createBattleGameFromNodeDraft({
    runId: run.runId,
    node: trainingNode,
    playersById: participants,
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

export function finalizeBattleResultFromSnapshotV5(run: RunGameV5, input: {snapshot: BattleSessionSnapshotV4; commandId: string; reason?: FormalBattleResultFinalizeReasonV4; settlementNotice?: string}, now = new Date()): {run: RunGameV5; result: {destination: "rest" | "settlement"; reason?: FormalBattleResultFinalizeReasonV4; settlementNotice?: string}} {
  const repeated = run.commandLog[input.commandId];
  if (repeated) {
    const result = repeated.result as {destination?: "rest" | "settlement"; reason?: FormalBattleResultFinalizeReasonV4; settlementNotice?: string} | null | undefined;
    return {run, result: {destination: result?.destination || "settlement", reason: result?.reason, settlementNotice: result?.settlementNotice}};
  }

  const snapshot = input.snapshot;
  const iso = now.toISOString();
  const currentNode = run.gameMap.nodes.find(node => node.nodeId === snapshot.nodeId)
    || (run.currentNodeId ? run.gameMap.nodes.find(node => node.nodeId === run.currentNodeId) : null)
    || run.gameMap.nodes.find(node => node.state === "running" || node.state === "preparing" || node.state === "ready")
    || run.gameMap.nodes[0];
  if (!currentNode) throw new Error("当前没有可结算的战斗节点。");

  const synced = syncBattleSnapshotEntitiesV5(run, snapshot, currentNode, iso);
  const p1Won = snapshot.winner === "p1" || snapshot.winner === "p3";
  const forcedLoss = input.reason === "surrender";
  const won = !forcedLoss && snapshot.status === "ended" && p1Won;
  const finalReason: FormalBattleResultFinalizeReasonV4 | undefined = forcedLoss
    ? "surrender"
    : won ? undefined : "loss";

  let playersById = synced.playersById;
  let pokemonById = synced.pokemonById;
  let restState: RunGameV5["restState"] = {
    ...run.restState,
    battleLog: appendBattleSummaryLogV5(run.restState.battleLog || [], snapshot, currentNode.nodeId, won, input.commandId, iso),
  };

  let currentNodeId = run.currentNodeId || currentNode.nodeId;
  const nextNodes = run.gameMap.nodes.map(node => {
    if (node.nodeId !== currentNode.nodeId) return node;
    return {
      ...node,
      state: snapshot.status === "ended" ? (won ? "won" as const : "lost" as const) : "running" as const,
      battleGame: {
        id: node.battleGame?.id || snapshot.id,
        status: snapshot.status === "ended" ? "ended" as const : snapshot.status === "blocked" ? "blocked" as const : "running" as const,
      },
      startedAt: node.startedAt || snapshot.createdAt,
      endedAt: snapshot.status === "ended" ? iso : node.endedAt,
    };
  });
  const nodeIndex = nextNodes.findIndex(node => node.nodeId === currentNode.nodeId);

  if (won) {
    const settlement = settleWonBattleRoundEntitiesV5({...run, playersById, pokemonById, gameMap: {nodes: nextNodes}, restState}, currentNode, input.commandId, iso);
    playersById = settlement.playersById;
    pokemonById = settlement.pokemonById;
    restState = settlement.restState;
    if (nodeIndex >= 0 && nextNodes[nodeIndex + 1]?.state === "locked") {
      nextNodes[nodeIndex + 1] = {...nextNodes[nodeIndex + 1]!, state: "ready"};
    }
    currentNodeId = nextNodes[nodeIndex + 1]?.nodeId || currentNode.nodeId;
  }

  const completeAfterUnlock = won && nextNodes.length > 0 && nextNodes.every(node => node.state === "won");
  const destination: "rest" | "settlement" = finalReason || completeAfterUnlock ? "settlement" : "rest";
  const nextStatus: RunGameStatusV5 = destination === "settlement" ? "settlement_ready" : "resting";
  const result = {
    destination,
    reason: finalReason || (destination === "settlement" ? "complete" as const : undefined),
    settlementNotice: input.settlementNotice || "",
    nodeId: currentNode.nodeId,
  };

  return {
    run: assertRunGameV5RedLines({
      ...run,
      status: nextStatus,
      phase: destination === "settlement" ? "settlement" : "rest",
      revision: run.revision + 1,
      updatedAt: iso,
      playersById,
      pokemonById,
      gameMap: {nodes: nextNodes},
      currentNodeId,
      restState,
      commandLog: appendCommandLog(run, input.commandId, "finalize-battle", result, iso, run.revision + 1),
    }),
    result,
  };
}

function syncBattleSnapshotEntitiesV5(run: RunGameV5, snapshot: BattleSessionSnapshotV4, node: GameMapNodeV5, updatedAt: string): Pick<RunGameV5, "playersById" | "pokemonById"> {
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  for (const snapshotPlayer of snapshot.players) {
    const playerId = node.slots[snapshotPlayer.playerId];
    const player = playerId ? playersById[playerId] : null;
    if (!player) continue;
    let changed = false;
    for (const pokemonId of player.localTeamPokemonIds) {
      const entry = pokemonById[pokemonId];
      if (!entry || entry.ownerPlayerId !== player.playerId) continue;
      const teamIndex = snapshotPlayer.teamMapping?.find(mapping => mapping.localPokemonId === pokemonId)?.teamIndex
        ?? snapshotPlayer.draft.localTeam.pokemon.findIndex(pokemon => pokemon.localPokemonId === pokemonId);
      const draftPokemon = snapshotPlayer.draft.localTeam.pokemon.find(pokemon => pokemon.localPokemonId === pokemonId) || (teamIndex >= 0 ? snapshotPlayer.draft.localTeam.pokemon[teamIndex] : null);
      const state = battlePokemonStateForV5(snapshot, snapshotPlayer.playerId, pokemonId, teamIndex, snapshotPlayer.teamMapping || []);
      const nextPokemon = syncLocalPokemonFromBattleStateV5(entry.localPokemon, draftPokemon || null, state);
      if (nextPokemon !== entry.localPokemon) {
        pokemonById[pokemonId] = {...entry, localPokemon: nextPokemon, updatedAt};
        changed = true;
      }
    }
    if (changed) playersById[player.playerId] = {...player, updatedAt};
  }
  return {playersById, pokemonById};
}

function battlePokemonStateForV5(snapshot: BattleSessionSnapshotV4, playerId: ShowdownPlayerIdV4, pokemonId: string, teamIndex: number, mappings: Array<{localPokemonId?: string; showdownIdentityToken?: string; showdownId?: string; pokeballId?: string; teamIndex?: number}>): BattleTeamPokemonStateV4 | null {
  const state = snapshot.teamStateByPlayer?.[playerId];
  if (!state) return null;
  const mapping = mappings.find(entry => entry.localPokemonId === pokemonId)
    || mappings.find(entry => typeof entry.teamIndex === "number" && entry.teamIndex === teamIndex);
  const tokens = [
    pokemonId,
    mapping?.showdownIdentityToken,
    mapping?.showdownId,
    mapping?.pokeballId,
  ].map(tokenV5).filter(Boolean);
  for (const token of tokens) {
    const entry = state.pokemonByToken[token];
    if (entry) return entry;
  }
  return Object.values(state.pokemonByToken).find(entry => entry.localPokemonId === pokemonId) || null;
}

function syncLocalPokemonFromBattleStateV5(current: LocalPokemonV4, draftPokemon: LocalPokemonV4 | null, state: BattleTeamPokemonStateV4 | null): LocalPokemonV4 {
  let next = current;
  if (draftPokemon) {
    const draftMoves = localMoveSlotsEqualV5(draftPokemon.moves, current.moves) ? current.moves : draftPokemon.moves || current.moves;
    next = {
      ...next,
      moves: draftMoves,
      itemId: draftPokemon.itemId,
      heldItemInstanceId: draftPokemon.heldItemInstanceId,
      friendship: draftPokemon.friendship ?? next.friendship,
    };
  }
  if (!state) return next === current ? current : next;
  const maxHp = Math.max(1, Math.floor(Number(next.maxHp || current.maxHp || state.maxHp || 1)));
  const hp = state.fainted || state.hp <= 0
    ? 0
    : state.maxHp && state.maxHp !== maxHp
      ? Math.max(1, Math.round(state.hp / Math.max(1, state.maxHp) * maxHp))
      : clampIntV5(state.hp, 0, maxHp, next.entryHp);
  const moves = syncMovePpFromBattleStateV5(next.moves, state.moves || []);
  const entryStatus = normalizeBattleStatusV5(state.status);
  if (next.entryHp === hp && next.entryStatus === entryStatus && moves === next.moves) return next === current ? current : next;
  return {
    ...next,
    maxHp,
    entryHp: hp,
    entryStatus,
    moves,
  };
}

function settleWonBattleRoundEntitiesV5(run: RunGameV5, wonNode: GameMapNodeV5, commandId: string, at: string): Pick<RunGameV5, "playersById" | "pokemonById" | "restState"> {
  if (run.restState.roundSettlementByNodeId?.[wonNode.nodeId]) {
    return {playersById: run.playersById, pokemonById: run.pokemonById, restState: run.restState};
  }
  const self = requirePlayer(run, run.selfPlayerId);
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  const revivedPokemonIds: string[] = [];
  const emergencyHealedPokemonIds: string[] = [];
  const outpatientHealedPokemonIds: string[] = [];
  const leveledPokemonIds: string[] = [];
  const hasEmergencyCare = starChartHasRuntimeEffectV4(self.starChartSnapshot, "post_battle_revive_half_hp");
  const hasOutpatientCare = starChartHasRuntimeEffectV4(self.starChartSnapshot, "post_battle_heal_alive_quarter_hp");

  for (const pokemonId of self.localTeamPokemonIds) {
    const entry = pokemonById[pokemonId];
    if (!entry) continue;
    const pokemon = entry.localPokemon;
    const maxHp = Math.max(1, Math.floor(Number(pokemon.maxHp || 1)));
    const beforeHp = clampIntV5(pokemon.entryHp, 0, maxHp, maxHp);
    let nextPokemon = {...pokemon, entryHp: beforeHp, maxHp};
    if (beforeHp <= 0) {
      revivedPokemonIds.push(pokemonId);
      const targetHp = hasEmergencyCare ? Math.ceil(maxHp / 2) : 1;
      nextPokemon = {...nextPokemon, entryHp: clampIntV5(targetHp, 1, maxHp, 1)};
      if (hasEmergencyCare) emergencyHealedPokemonIds.push(pokemonId);
    } else if (hasOutpatientCare && beforeHp < maxHp) {
      const healedHp = clampIntV5(beforeHp + Math.ceil(maxHp / 4), 0, maxHp, beforeHp);
      if (healedHp > beforeHp) {
        nextPokemon = {...nextPokemon, entryHp: healedHp};
        outpatientHealedPokemonIds.push(pokemonId);
      }
    }
    if (nextPokemon !== pokemon) pokemonById[pokemonId] = {...entry, localPokemon: nextPokemon, updatedAt: at};
  }

  const reviveCostPerPokemon = Math.max(0, Math.floor(Number(run.restState.medicalInsurance?.reviveCostPerPokemon ?? 50)));
  const reviveCost = revivedPokemonIds.length * reviveCostPerPokemon;
  const rewardCoins = 500;
  const balanceBefore = self.money;
  const balanceAfter = clampIntV5(balanceBefore + rewardCoins - reviveCost, 0, 999999, balanceBefore);
  playersById[self.playerId] = {...self, money: balanceAfter, updatedAt: at};
  const settlement = {
    nodeId: wonNode.nodeId,
    rewardCoins,
    reviveCost,
    netCoins: rewardCoins - reviveCost,
    revivedPokemonIds,
    emergencyHealedPokemonIds,
    outpatientHealedPokemonIds,
    leveledPokemonIds,
    createdAt: at,
  };
  let coinLog = appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(`${commandId}:reward`, "round-settlement", `第 ${wonNode.index + 1} 场胜利奖励`, rewardCoins, balanceBefore, clampIntV5(balanceBefore + rewardCoins, 0, 999999, balanceBefore), wonNode.index, at));
  if (reviveCost > 0) {
    coinLog = appendCoinLogV5(coinLog, coinLogEntryV5(`${commandId}:medical`, "round-settlement", `第 ${wonNode.index + 1} 场工厂医疗`, -reviveCost, clampIntV5(balanceBefore + rewardCoins, 0, 999999, balanceBefore), balanceAfter, wonNode.index, at));
  }
  return {
    playersById,
    pokemonById,
    restState: {
      ...run.restState,
      roundSettlementByNodeId: {
        ...(run.restState.roundSettlementByNodeId || {}),
        [wonNode.nodeId]: settlement,
      },
      coinLog,
    },
  };
}

function appendBattleSummaryLogV5(log: TrainingBattleLogEntryV4[], snapshot: BattleSessionSnapshotV4, nodeId: string, won: boolean, commandId: string, at: string): TrainingBattleLogEntryV4[] {
  const key = `battle-finalize:${snapshot.id}:${commandId}`;
  if (log.some(entry => entry.key === key)) return log;
  const entry: TrainingBattleLogEntryV4 = {
    id: key,
    key,
    at,
    sessionId: snapshot.id,
    nodeId,
    turn: Math.max(0, Math.floor(Number(snapshot.turn || 0))),
    rawLogIndex: Math.max(0, snapshot.rawLog.length),
    eventType: "win",
    sourcePlayerId: snapshot.winner || undefined,
    rawLine: won ? "|win|p1" : `|win|${snapshot.winner || "opponent"}`,
  };
  return [...log, entry].slice(-500);
}

function syncMovePpFromBattleStateV5(moves: TrainingMoveSlotV4[], stateMoves: Array<{moveId: string; remainingPp: number; maxPp: number}>): TrainingMoveSlotV4[] {
  if (!stateMoves.length) return moves;
  let changed = false;
  const byMoveId = new Map(stateMoves.map(move => [tokenV5(move.moveId), move]));
  const next = moves.map(move => {
    const patch = byMoveId.get(tokenV5(move.moveId));
    if (!patch) return move;
    const remainingPp = clampIntV5(patch.remainingPp, 0, Math.max(1, patch.maxPp || move.maxPp || move.pp || 1), move.remainingPp);
    const maxPp = Math.max(1, Math.floor(Number(patch.maxPp || move.maxPp || move.pp || 1)));
    if (move.remainingPp === remainingPp && move.maxPp === maxPp) return move;
    changed = true;
    return {...move, remainingPp, maxPp};
  });
  return changed ? next : moves;
}

function localMoveSlotsEqualV5(left: LocalPokemonV4["moves"] | undefined, right: LocalPokemonV4["moves"] | undefined): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((move, index) => {
    const other = right[index];
    return Boolean(other) &&
      move.moveId === other.moveId &&
      move.maxPp === other.maxPp &&
      move.remainingPp === other.remainingPp &&
      move.pp === other.pp;
  });
}

function normalizeBattleStatusV5(status: unknown): TrainingStatusV4 {
  const text = String(status || "").trim().toLowerCase();
  if (!text || text === "none") return "";
  return ["brn", "par", "psn", "tox", "slp", "frz"].includes(text) ? text as TrainingStatusV4 : "";
}

function tokenV5(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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

export function prepareFinalSettlementFromRunGameV5(run: RunGameV5, reason: FormalSettlementReasonV4, now = new Date()): NonNullable<FormalGameRunV4["settlement"]> {
  const iso = now.toISOString();
  const self = requirePlayer(run, run.selfPlayerId);
  const wonRounds = run.gameMap.nodes.filter(node => node.state === "won").length;
  const totalRounds = Math.max(1, run.gameMap.nodes.length || run.roundPlan.length || 1);
  const completedAll = run.gameMap.nodes.length > 0 && wonRounds >= run.gameMap.nodes.length;
  const outcome = reason === "abandon" ? "abandoned" : completedAll ? "win" : "loss";
  const coinSummary = summarizeCoinLogV5(run.restState.coinLog || []);
  const pokemonStats = buildSettlementPokemonStatsV5(run, self);
  const mvp = pokemonStats[0] || null;
  const baseBpGained = run.roundPlan
    .filter(round => run.gameMap.nodes.find(node => node.nodeId === round.nodeId)?.state === "won")
    .reduce((sum, round) => sum + Math.round(bpCoefficientForDifficultyV5(round.difficulty) * Math.max(1, run.streak + 1)), 0);
  const victoryDividendBp = starChartHasRuntimeEffectV4(self.starChartSnapshot, "settlement_bp_dividend")
    ? Math.floor(clampIntV5(self.money, 0, 999999, 0) * 0.01)
    : 0;
  return {
    id: `formal-settlement:${run.matchId}:${run.revision + 1}`,
    outcome,
    reason,
    bpGained: baseBpGained + victoryDividendBp,
    wonRounds,
    totalRounds,
    coinSummary: {
      income: coinSummary.income,
      expense: coinSummary.expense,
      net: coinSummary.net,
      balance: self.money,
    },
    pokemonStats,
    mvpPokemonKey: mvp?.pokemonKey || "",
    diagnostics: [
      ...(pokemonStats.length ? [] : ["no-player-pokemon-stats"]),
      ...(victoryDividendBp > 0 ? [`victory-dividend:+${victoryDividendBp}bp`] : []),
      "v5-settlement",
    ],
    createdAt: iso,
  };
}

export function commitFinalSettlementFromRunGameV5(run: RunGameV5, input: {commandId: string; settlement: NonNullable<FormalGameRunV4["settlement"]>; reason: FormalSettlementReasonV4; summary: Record<string, unknown>}, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return run;
  if (!input.settlement.id) throw new Error("RunGameV5 final settlement missing settlement.");
  const iso = now.toISOString();
  return assertRunGameV5RedLines({
    ...run,
    status: "ended",
    phase: "settlement",
    revision: run.revision + 1,
    updatedAt: iso,
    finalResult: {
      settlementId: input.settlement.id,
      settlement: input.settlement,
      settledAt: input.settlement.claimedAt || iso,
      summary: input.summary,
    },
    commandLog: appendCommandLog(run, input.commandId, "finalize-run", {
      settlementId: input.settlement.id,
      reason: input.reason,
      summary: input.summary,
    }, iso, run.revision + 1),
  });
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
  if (json.length > 16 * 1024) {
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

function summarizeCoinLogV5(log: TrainingCoinLogEntryV4[]): {income: number; expense: number; net: number} {
  return log.reduce((acc, entry) => {
    const amount = Math.floor(Number(entry.amount || 0));
    if (amount > 0) acc.income += amount;
    if (amount < 0) acc.expense += Math.abs(amount);
    acc.net += amount;
    return acc;
  }, {income: 0, expense: 0, net: 0});
}

function buildSettlementPokemonStatsV5(run: RunGameV5, self: PlayerInstanceV5): NonNullable<FormalGameRunV4["settlement"]>["pokemonStats"] {
  const usedRounds = run.gameMap.nodes.filter(node => node.state === "won" || node.state === "lost").map(node => node.index);
  const values = self.localTeamPokemonIds.flatMap((pokemonId, index) => {
    const entry = run.pokemonById[pokemonId];
    if (!entry) return [];
    const pokemon = entry.localPokemon;
    const fainted = Math.floor(Number(pokemon.entryHp || 0)) <= 0;
    const mvpScore = Math.max(0, run.gameMap.nodes.filter(node => node.state === "won").length * 10 - index);
    return [{
      pokemonKey: pokemon.localPokemonId || pokemonId,
      localPokemonId: pokemon.localPokemonId || pokemonId,
      speciesId: pokemon.speciesId,
      name: pokemon.name || pokemon.speciesId,
      nameZh: pokemon.nameZh || pokemon.name || pokemon.speciesId,
      iconUrl: pokemon.iconUrl,
      iconStyle: pokemon.iconStyle,
      spriteUrl: pokemon.spriteUrl,
      shiny: Boolean(pokemon.shiny),
      kills: 0,
      deaths: fainted ? 1 : 0,
      assists: 0,
      damageDealt: 0,
      damageTaken: 0,
      healing: 0,
      usedRounds,
      kdaScore: fainted ? 0 : 1,
      mvpScore,
      isMvp: false,
    }];
  });
  values.sort((left, right) => right.mvpScore - left.mvpScore || left.nameZh.localeCompare(right.nameZh, "zh-Hans-CN"));
  if (values[0]) values[0].isMvp = true;
  return values;
}

function bpCoefficientForDifficultyV5(difficulty: FormalRoundPlanV4["difficulty"]): number {
  if (difficulty === "gym") return 1;
  if (difficulty === "elite4") return 1.5;
  if (difficulty === "champion" || difficulty === "villain") return 1.8;
  return 0.5;
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
