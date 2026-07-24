import {
  FORMAL_MEDICAL_INSURANCE_TIERS,
  formalTrainingGroundLessonFeeV4,
  formalTrainingGroundLessonForRollV4,
  formalTrainingGroundLessonKindFromIdV4,
  formalTrainingGroundLessonTableV4,
} from "@changebattle-v2/core";
import type {DexStatId} from "@changebattle-v2/showdown-dex-core";
import type {BattlePreferenceV4, FormalCompetitionModeV4, PlayerItemInstanceV4, ShowdownPlayerIdV4, StatTableV4, TrainingAllianceV4, TrainingBattleLogEntryV4, TrainingCoinLogEntryV4, TrainingMoveSlotV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4, TrainingRuleSetV4, TrainingStatusV4} from "./training.js";
import type {FormalBattleResultFinalizeReasonV4, FormalGameModeV4, FormalMedicalInsuranceOfferV4, FormalMedicalInsuranceStateV4, FormalMedicalInsuranceTierViewV4, FormalGameRunV4, FormalPokemonExchangeViewV4, FormalRoundNpcSnapshotV4, FormalRoundPlanV4, FormalSettlementReasonV4, FormalShopItemV4, FormalShopProductViewV4, FormalStarterCandidateV4, FormalTrainingGroundApplyInputV4, FormalTrainingGroundLessonViewV4} from "./formalGame.js";
import type {LocalPokemonV4, LocalTeamV4} from "./training.js";
import type {PlayerVaultV4, UserProfileV2} from "./index.js";
import {createBattleGameFromNodeDraft, type BattleGameV4, type BattleSessionCreateInputV4, type BattleSessionSnapshotV4, type BattleTeamPokemonStateV4} from "./battle.js";
import {formalTrainingGroundDiscountForStarChartV4, starChartHasMedicalInsuranceV4, starChartHasRuntimeEffectV4} from "./starChart.js";
import {
  applyFormalSelfStudyRuleV5,
  createFormalRestShopFromRuleContextV5,
  formalRestPokemonStatRerollCostV5,
  prepareExchangedPokemonFromRuleContextV5,
  rerollFormalStatsWithinTotalFromRuleContextV5,
  restockFormalShopSlotFromRuleContextV5,
  type FormalRestRulesMaxHpCalculatorV5,
} from "./formalRestRules.js";

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
    trainerType: FormalRoundNpcSnapshotV4["trainerType"];
    rank: "rookie" | "trainer" | "gym_leader" | "elite" | "champion" | "villain" | "boss";
    rankLabel: string;
    powerProfile: FormalRoundNpcSnapshotV4["powerProfile"];
    teamPreference: FormalRoundNpcSnapshotV4["teamPreference"];
    battlePreference: FormalRoundNpcSnapshotV4["battlePreference"];
    isBoss: boolean;
    aiProfile: NonNullable<TrainingPlayerDraftV4["aiProfile"]>;
    generatedBy: {
      nodeId: string;
      seed: string;
      generatedAt: string;
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
    shopRestockRollBySlotId?: Record<string, number>;
    statRerollRollByKey?: Record<string, number>;
    exchangeRollByNodeId?: Record<string, number>;
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
  team: RunGamePokemonViewV5[];
};

export type RunGamePokemonViewV5 = PokemonInstanceV5;
export type RunGameItemViewV5 = ItemInstanceV5;

export type RunGameRestPokemonViewV5 = {
  pokemonId: PokemonInstanceIdV5;
  ownerPlayerId: PlayerInstanceIdV5;
  localPokemon: LocalPokemonV4;
};

export type RunGameRestPlayerViewV5 = Omit<RunGamePlayerViewV5, "team"> & {
  team: RunGameRestPokemonViewV5[];
};

export type RunGameBagViewV5 = {
  bagId: BagInstanceIdV5;
  ownerPlayerId: PlayerInstanceIdV5;
  maxSize: number;
  battleBagEnabled?: boolean;
  itemInstanceIds: ItemInstanceIdV5[];
  items: RunGameItemViewV5[];
} | null;

export type RunGameTrainingGroundViewV5 = {
  nodeId: GameNodeIdV5;
  lessons: FormalTrainingGroundLessonViewV4[];
  lesson: FormalTrainingGroundLessonViewV4 | null;
} | null;

export type ViewScopeNameV5 = "summary" | "starter" | "rest" | "battle" | "settlement";

export type RunGameV5RuleOptions = {
  calculateMaxHp?: FormalRestRulesMaxHpCalculatorV5;
};

export type RunGameSummaryViewV5 = {
  version: 5;
  runId: string;
  roomId: string;
  matchId: string;
  status: RunGameStatusV5;
  phase: RunGamePhaseV5;
  revision: number;
  updatedAt: string;
  currentNodeId: GameNodeIdV5 | null;
};

export type RunGameStarterViewV5 = RunGameSummaryViewV5 & {
  config: Pick<RunGameConfigV5, "mode" | "competitionMode" | "ruleSet" | "seed">;
  selectedIndexes: number[];
  candidates: Array<StarterCandidateRefV5 & {pokemon: RunGamePokemonViewV5 | null}>;
};

export type RunGameRestNodeViewV5 = {
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

export type RunGameRestViewV5 = RunGameSummaryViewV5 & {
  config: RunGameConfigV5;
  selfPlayerId: PlayerInstanceIdV5;
  selfPlayer: RunGameRestPlayerViewV5 | null;
  players: RunGameRestPlayerViewV5[];
  team: RunGameRestPokemonViewV5[];
  bag: RunGameBagViewV5;
  currentNode: RunGameRestNodeViewV5 | null;
  nextNode: RunGameRestNodeViewV5 | null;
  rest: RunGameV5["restState"];
  trainingGround: RunGameTrainingGroundViewV5;
  exchange: FormalPokemonExchangeViewV4 | null;
};

export type RunGameBattleParticipantViewV5 = {
  playerId: PlayerInstanceIdV5;
  slot: ShowdownPlayerIdV4;
  name: string;
  avatar: string;
  backImage?: string;
  controller: PlayerInstanceV5["controller"];
  alliance: TrainingAllianceV4;
  team: RunGamePokemonViewV5[];
};

export type RunGameBattleViewV5 = RunGameSummaryViewV5 & {
  config: RunGameConfigV5;
  activeBattle: {
    sessionId: string;
    nodeId: GameNodeIdV5;
    battleGameId?: string;
    status: "creating" | "running" | "finalized" | "blocked" | "lost_session";
    expectedTurn?: number;
    expectedRqid?: string;
  } | null;
  mode: FormalGameModeV4;
  ruleSet: TrainingRuleSetV4;
  stageLabel: string;
  participants: Partial<Record<ShowdownPlayerIdV4, RunGameBattleParticipantViewV5>>;
  selfBag: RunGameBagViewV5;
  battlePreference: BattlePreferenceV4;
};

export type RunGameSettlementViewV5 = RunGameSummaryViewV5 & {
  finalResult: RunGameV5["finalResult"] | null;
  settlement: NonNullable<RunGameV5["finalResult"]>["settlement"] | null;
};

export type RunGameScopedViewV5 =
  | RunGameSummaryViewV5
  | RunGameStarterViewV5
  | RunGameRestViewV5
  | RunGameBattleViewV5
  | RunGameSettlementViewV5;

export function viewScopeForRunGameV5(run: RunGameV5): ViewScopeNameV5 {
  if (run.finalResult || run.status === "settlement_ready" || run.status === "ended" || run.phase === "settlement") return "settlement";
  if (run.status === "battle_preparing" || run.status === "battling" || run.status === "battle_settling" || run.phase === "battle") return "battle";
  if (run.status === "round_preparing" || run.status === "resting" || run.phase === "rest") return "rest";
  if (run.status === "starter_selecting" || run.phase === "starter") return "starter";
  return "summary";
}

export function buildScopedFormalRoomViewV5(run: RunGameV5, scope: ViewScopeNameV5 = viewScopeForRunGameV5(run), activeBattle?: {sessionId?: string; nodeId?: string; battleGameId?: string; status?: string} | null): RunGameScopedViewV5 {
  if (scope === "starter") return buildStarterViewV5(run);
  if (scope === "rest") return buildRestViewV5(run);
  if (scope === "battle") return buildBattleViewV5(run, activeBattle);
  if (scope === "settlement") return buildSettlementViewV5(run);
  return buildSummaryViewV5(run);
}

export function buildSummaryViewV5(run: RunGameV5): RunGameSummaryViewV5 {
  return {
    version: 5,
    runId: run.runId,
    roomId: run.roomId,
    matchId: run.matchId,
    status: run.status,
    phase: run.phase,
    revision: run.revision,
    updatedAt: run.updatedAt,
    currentNodeId: run.currentNodeId,
  };
}

export function buildStarterViewV5(run: RunGameV5): RunGameStarterViewV5 {
  return {
    ...buildSummaryViewV5(run),
    config: {
      mode: run.config.mode,
      competitionMode: run.config.competitionMode,
      ruleSet: run.config.ruleSet,
      seed: run.config.seed,
    },
    selectedIndexes: [...run.selectedStarterIndexes],
    candidates: run.starterCandidates.map(candidate => ({
      ...candidate,
      pokemon: run.pokemonById[candidate.pokemonId] || null,
    })),
  };
}

export function buildRestViewV5(run: RunGameV5): RunGameRestViewV5 {
  const self = run.playersById[run.selfPlayerId] || null;
  const bag = self ? run.bagsById[self.bagId] || null : null;
  const currentNode = currentRestNodeV5(run);
  const nextNode = run.gameMap.nodes.find(node => node.state === "ready") || currentNode || null;
  const relevantPlayers = restRelevantPlayersV5(run, [currentNode, nextNode]);
  return {
    ...buildSummaryViewV5(run),
    config: run.config,
    selfPlayerId: run.selfPlayerId,
    selfPlayer: self ? restPlayerViewV5(run, self) : null,
    players: relevantPlayers.map(player => restPlayerViewV5(run, player)),
    team: self ? self.localTeamPokemonIds.map(pokemonId => run.pokemonById[pokemonId]).filter((entry): entry is PokemonInstanceV5 => Boolean(entry)).map(restPokemonViewV5) : [],
    bag: bag ? {
      bagId: bag.bagId,
      ownerPlayerId: bag.ownerPlayerId,
      maxSize: bag.maxSize,
      battleBagEnabled: bag.battleBagEnabled,
      itemInstanceIds: [...bag.itemInstanceIds],
      items: bag.itemInstanceIds.map(itemInstanceId => run.itemInstancesById[itemInstanceId]).filter((entry): entry is ItemInstanceV5 => Boolean(entry)),
    } : null,
    currentNode: currentNode ? restNodeViewV5(currentNode) : null,
    nextNode: nextNode ? restNodeViewV5(nextNode) : null,
    rest: restStateForScopedRestViewV5(run, [currentNode, nextNode]),
    trainingGround: currentNode ? {
      nodeId: currentNode.nodeId,
      lessons: getTrainingGroundLessonsV5(run),
      lesson: getTrainingGroundLessonForInputV5(run, {}),
    } : null,
    exchange: safePokemonExchangeViewV5(run)?.available ? safePokemonExchangeViewV5(run) : null,
  };
}

function restRelevantPlayersV5(run: RunGameV5, nodes: Array<GameMapNodeV5 | null>): PlayerInstanceV5[] {
  const playerIds = new Set<PlayerInstanceIdV5>([run.selfPlayerId]);
  for (const node of nodes) {
    for (const playerId of Object.values(node?.slots || {})) {
      if (playerId) playerIds.add(playerId);
    }
  }
  return [...playerIds].map(playerId => run.playersById[playerId]).filter((entry): entry is PlayerInstanceV5 => Boolean(entry));
}

function restStateForScopedRestViewV5(run: RunGameV5, nodes: Array<GameMapNodeV5 | null>): RunGameV5["restState"] {
  const nodeIds = new Set(nodes.map(node => node?.nodeId).filter((entry): entry is string => Boolean(entry)));
  return {
    shopByNodeId: filterRecordByKeysV5(run.restState.shopByNodeId, nodeIds),
    trainingGroundByNodeId: filterRecordByKeysV5(run.restState.trainingGroundByNodeId, nodeIds),
    roundSettlementByNodeId: filterRecordByKeysV5(run.restState.roundSettlementByNodeId, nodeIds),
    exchangeByNodeId: filterRecordByKeysV5(run.restState.exchangeByNodeId, nodeIds),
    medicalInsuranceOfferSeen: run.restState.medicalInsuranceOfferSeen,
    medicalInsurance: run.restState.medicalInsurance || null,
    restPreviewUnlocks: run.restState.restPreviewUnlocks ? {...run.restState.restPreviewUnlocks} : undefined,
    coinLog: run.restState.coinLog ? [...run.restState.coinLog] : undefined,
    battleLog: run.restState.battleLog ? [...run.restState.battleLog] : undefined,
  };
}

function filterRecordByKeysV5<T>(record: Record<string, T> | undefined, keys: Set<string>): Record<string, T> | undefined {
  if (!record) return undefined;
  const entries = Object.entries(record).filter(([key]) => keys.has(key));
  return entries.length ? Object.fromEntries(entries) as Record<string, T> : undefined;
}

export function buildBattleViewV5(run: RunGameV5, activeBattle?: {sessionId?: string; nodeId?: string; battleGameId?: string; status?: string} | null): RunGameBattleViewV5 {
  const node = currentRestNodeV5(run) || run.gameMap.nodes.find(entry => entry.nodeId === run.currentNodeId) || null;
  const self = run.playersById[run.selfPlayerId] || null;
  const bag = self ? run.bagsById[self.bagId] || null : null;
  const participants: Partial<Record<ShowdownPlayerIdV4, RunGameBattleParticipantViewV5>> = {};
  for (const [slot, playerId] of Object.entries(node?.slots || {}) as Array<[ShowdownPlayerIdV4, PlayerInstanceIdV5 | undefined]>) {
    const player = playerId ? run.playersById[playerId] : null;
    if (!player) continue;
    participants[slot] = {
      playerId: player.playerId,
      slot: player.slot,
      name: player.name,
      avatar: player.avatar,
      backImage: player.backImage,
      controller: player.controller,
      alliance: player.alliance,
      team: player.localTeamPokemonIds.map(pokemonId => run.pokemonById[pokemonId]).filter((entry): entry is PokemonInstanceV5 => Boolean(entry)),
    };
  }
  return {
    ...buildSummaryViewV5(run),
    config: run.config,
    activeBattle: activeBattle?.sessionId ? {
      sessionId: activeBattle.sessionId,
      nodeId: activeBattle.nodeId || node?.nodeId || run.currentNodeId || "",
      battleGameId: activeBattle.battleGameId,
      status: battleViewStatusV5(activeBattle.status),
    } : null,
    mode: node?.mode || run.config.mode,
    ruleSet: node?.ruleSet || run.config.ruleSet,
    stageLabel: formalRoundStageLabelV5(node?.index ?? 0),
    participants,
    selfBag: bag ? {
      bagId: bag.bagId,
      ownerPlayerId: bag.ownerPlayerId,
      maxSize: bag.maxSize,
      battleBagEnabled: bag.battleBagEnabled,
      itemInstanceIds: [...bag.itemInstanceIds],
      items: bag.itemInstanceIds.map(itemInstanceId => run.itemInstancesById[itemInstanceId]).filter((entry): entry is ItemInstanceV5 => Boolean(entry)),
    } : null,
    battlePreference: run.config.battlePreference,
  };
}

export function buildSettlementViewV5(run: RunGameV5): RunGameSettlementViewV5 {
  return {
    ...buildSummaryViewV5(run),
    finalResult: run.finalResult || null,
    settlement: run.finalResult?.settlement || null,
  };
}

function restNodeViewV5(node: GameMapNodeV5): RunGameRestNodeViewV5 {
  return {
    nodeId: node.nodeId,
    index: node.index,
    state: node.state,
    mode: node.mode,
    ruleSet: node.ruleSet,
    seed: node.seed,
    slots: {...node.slots},
    battleGame: node.battleGame,
    createdAt: node.createdAt,
    startedAt: node.startedAt,
    endedAt: node.endedAt,
  };
}

function battleViewStatusV5(status: string | undefined): NonNullable<RunGameBattleViewV5["activeBattle"]>["status"] {
  if (status === "creating" || status === "running" || status === "finalized" || status === "blocked" || status === "lost_session") return status;
  return "running";
}

function formalRoundStageLabelV5(index: number): string {
  return [
    "小组赛揭幕战",
    "小组赛出线战",
    "十六强赛",
    "八强争夺战",
    "四强争夺战",
    "半决赛",
    "决赛",
  ][Math.max(0, Math.min(6, index))] || `第 ${index + 1} 场`;
}

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

function safePokemonExchangeViewV5(run: RunGameV5): FormalPokemonExchangeViewV4 | null {
  try {
    return getPokemonExchangeViewV5(run);
  } catch {
    return null;
  }
}

function playerViewV5(run: RunGameV5, player: PlayerInstanceV5): RunGamePlayerViewV5 {
  const {profileSnapshot: _profileSnapshot, starChartSnapshot: _starChartSnapshot, ...publicPlayer} = player;
  return {
    ...publicPlayer,
    profileId: player.profileSnapshot?.id || (player.playerId === run.selfPlayerId ? run.profileId : undefined),
    localTeamPokemonIds: [...player.localTeamPokemonIds],
    teamSize: player.localTeamPokemonIds.length,
    team: player.localTeamPokemonIds.map(pokemonId => run.pokemonById[pokemonId]).filter((entry): entry is PokemonInstanceV5 => Boolean(entry)),
  };
}

function restPlayerViewV5(run: RunGameV5, player: PlayerInstanceV5): RunGameRestPlayerViewV5 {
  const {team: _team, ...publicPlayer} = playerViewV5(run, player);
  return {
    ...publicPlayer,
    team: player.localTeamPokemonIds.map(pokemonId => run.pokemonById[pokemonId]).filter((entry): entry is PokemonInstanceV5 => Boolean(entry)).map(restPokemonViewV5),
  };
}

function restPokemonViewV5(pokemon: PokemonInstanceV5): RunGameRestPokemonViewV5 {
  return {
    pokemonId: pokemon.pokemonId,
    ownerPlayerId: pokemon.ownerPlayerId,
    localPokemon: {...pokemon.localPokemon},
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
      const npcSnapshot = round.npcs.find(npc => npc.playerId === slot);
      const playerId = `player:${run.matchId}:${round.id}:${slot}`;
      slots[slot] = playerId;
      npcRefs.push(playerId);
      upsertPlayerDraftEntities({playersById, pokemonById, bagsById, itemInstancesById}, playerId, draft, iso, run.matchId, round.id, npcSnapshot, round.seed);
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

export function prepareRoundPlanFromDraftsV5(run: RunGameV5, input: {
  rounds: Array<{participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>; mode?: FormalGameModeV4; ruleSet?: TrainingRuleSetV4; seed?: string}>;
  commandId: string;
}, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[input.commandId];
  if (repeated) return run;
  const iso = now.toISOString();
  const self = requirePlayer(run, run.selfPlayerId);
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  const bagsById = {...run.bagsById};
  const itemInstancesById = {...run.itemInstancesById};
  const rounds = input.rounds.length ? input.rounds : [{participants: {}}];
  const roundPlan: RoundPlanV5[] = [];
  const nodes: GameMapNodeV5[] = [];
  rounds.forEach((round, index) => {
    const nodeId = `round:${run.matchId}:${index + 1}`;
    const mode = round.mode || run.config.mode;
    const ruleSet = round.ruleSet || run.config.ruleSet;
    const seed = round.seed || `${run.config.seed}:round:${index + 1}`;
    const slots: Partial<Record<ShowdownPlayerIdV4, PlayerInstanceIdV5>> = {p1: self.playerId};
    const npcRefs: string[] = [];
    (["p2", "p3", "p4"] as ShowdownPlayerIdV4[]).forEach(slot => {
      const draft = round.participants[slot];
      if (!draft) return;
      const playerId = `player:${run.matchId}:${nodeId}:${slot}`;
      slots[slot] = playerId;
      npcRefs.push(playerId);
      upsertPlayerDraftEntities({playersById, pokemonById, bagsById, itemInstancesById}, playerId, draft, iso, run.matchId, nodeId);
    });
    roundPlan.push({
      nodeId,
      index,
      mode,
      ruleSet,
      difficulty: index >= rounds.length - 1 ? "champion" : index >= 4 ? "elite4" : index >= 2 ? "gym" : "normal",
      seed,
      npcRefs,
      slots,
      diagnostics: ["v5-direct-round-plan"],
    });
    nodes.push({
      nodeId,
      index,
      state: index === 0 ? "ready" : "locked",
      mode,
      ruleSet,
      seed,
      slots,
      battleGame: null,
      createdAt: iso,
    });
  });
  const shopTeam = selfTeamPokemonFromEntitiesV5({...run, playersById, pokemonById}, self.playerId);
  const shopByNodeId = Object.fromEntries(nodes.map(node => [node.nodeId, createFormalRestShopFromRuleContextV5({
    seed: run.config.seed,
    nodeId: node.nodeId,
    roundIndex: node.index,
    money: self.money,
    team: shopTeam,
    starChart: self.starChartSnapshot,
    pendingSettlement: false,
    updatedAt: iso,
  })]));
  const trainingGroundByNodeId = Object.fromEntries(nodes.map(node => [node.nodeId, {nodeId: node.nodeId, lessonRoll: 0, selfStudyRoll: 0, updatedAt: iso}]));
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
    currentNodeId: nodes[0]?.nodeId || null,
    restState: {
      ...run.restState,
      shopByNodeId,
      trainingGroundByNodeId,
      restPreviewUnlocks: run.restState.restPreviewUnlocks || {},
      coinLog: run.restState.coinLog || [],
      battleLog: run.restState.battleLog || [],
    },
    commandLog: appendCommandLog(run, input.commandId, "prepare-round", {nodeCount: nodes.length}, iso, run.revision + 1),
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

export function applyTrainingLessonV5(run: RunGameV5, input: FormalTrainingGroundApplyInputV4, lesson: FormalTrainingGroundLessonViewV4, moveSummary: Partial<TrainingMoveSlotV4> | null, commandId: string, now = new Date(), options: RunGameV5RuleOptions = {}): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  if (self.money < lesson.fee) throw new Error("金币不足，先去赚一点再来上课吧。");
  const pokemonId = String(input.pokemonId || "");
  if (!pokemonId || !self.localTeamPokemonIds.includes(pokemonId)) throw new Error("请选择要进入课堂的宝可梦。");
  const current = requirePokemon(run, pokemonId);
  const iso = now.toISOString();
  const before = current.localPokemon;
  const currentNodeId = run.currentNodeId || "rest";
  const trainingState = run.restState.trainingGroundByNodeId?.[currentNodeId] || {nodeId: currentNodeId, lessonRoll: 0, selfStudyRoll: 0, updatedAt: iso};
  const selfStudy = lesson.kind === "self-study"
    ? applyFormalSelfStudyRuleV5({
      seed: run.config.seed,
      nodeId: currentNodeId,
      lessonRoll: trainingState.lessonRoll,
      selfStudyRoll: trainingState.selfStudyRoll,
      pokemon: before,
      starChart: self.starChartSnapshot,
      calculateMaxHp: options.calculateMaxHp,
    })
    : null;
  const updatedPokemon = lesson.kind === "self-study"
    ? selfStudy!.pokemon
    : applyMoveLessonPokemonPatchV5(before, input, moveSummary);
  const message = lesson.kind === "self-study"
    ? `${displayPokemonNameV5(before)}${selfStudy!.messageText}。${lesson.completeText}`
    : `${displayPokemonNameV5(before)}学会了${moveSummary?.nameZh || moveSummary?.name || input.moveId}。${lesson.completeText}`;
  const balanceAfter = Math.max(0, Math.floor(Number(self.money || 0)) - Math.max(0, Math.floor(Number(lesson.fee || 0))));
  const result = {
    actionType: "training.apply",
    message,
    pokemonId,
    lessonId: lesson.lessonId,
    lessonKind: lesson.kind,
    fee: lesson.fee,
    balanceAfter,
    ...(selfStudy ? {selfStudyEvent: selfStudy.event, selfStudyChange: selfStudy.change} : {}),
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
  const restockedShop = restockPurchasedShopSlotFromRulesV5(run, product.slotId, balanceAfter, iso);
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
        shopByNodeId: restockedShop.shopByNodeId,
        shopRestockRollBySlotId: restockedShop.shopRestockRollBySlotId,
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

export function rerollSelfPokemonStatsV5(run: RunGameV5, input: {pokemonId: string; part?: unknown; lockedStats?: unknown[]}, commandId: string, now = new Date(), options: RunGameV5RuleOptions = {}): {run: RunGameV5; result: Record<string, unknown>} {
  const repeated = run.commandLog[commandId];
  if (repeated) return {run, result: repeated.result || {reused: true}};
  const self = requirePlayer(run, run.selfPlayerId);
  const pokemonId = String(input.pokemonId || "");
  if (!pokemonId || !self.localTeamPokemonIds.includes(pokemonId)) throw new Error("请选择要调整的宝可梦。");
  const current = requirePokemon(run, pokemonId);
  const part = input.part === "evs" ? "evs" : "ivs";
  const lockedStats = normalizeStatLockListForV5(input.lockedStats);
  const cost = formalRestPokemonStatRerollCostV5(lockedStats.length);
  if (self.money < cost) throw new Error("金币不足。");
  const iso = now.toISOString();
  const currentNodeId = run.currentNodeId || "rest";
  const rerollKey = `${currentNodeId}:${pokemonId}:${part}`;
  const rerollRoll = Math.max(0, Math.floor(Number(run.restState.statRerollRollByKey?.[rerollKey] || 0)));
  const nextPokemon = rerollFormalStatsWithinTotalFromRuleContextV5({
    seed: run.config.seed,
    nodeId: currentNodeId,
    pokemon: current.localPokemon,
    part,
    lockedStats,
    rerollRoll,
    calculateMaxHp: options.calculateMaxHp,
  });
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
        statRerollRollByKey: {
          ...(run.restState.statRerollRollByKey || {}),
          [rerollKey]: rerollRoll + 1,
        },
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

export function getMedicalInsuranceOfferV5(run: RunGameV5): FormalMedicalInsuranceOfferV4 {
  const self = requirePlayer(run, run.selfPlayerId);
  const available = starChartHasMedicalInsuranceV4(self.starChartSnapshot);
  const purchased = run.restState.medicalInsurance || null;
  const seen = Boolean(run.restState.medicalInsuranceOfferSeen || purchased);
  return {
    available,
    seen,
    purchased,
    tiers: FORMAL_MEDICAL_INSURANCE_TIERS.map(tier => ({...tier})),
    message: purchased
      ? `已购买${medicalInsuranceTierLabelV5(purchased.tier)}。`
      : available
        ? "可以在第一场战斗前购买一次医疗保险。"
        : "需要点亮星图「医疗保险」后才能购买。",
  };
}

export function getMedicalInsuranceTierForChoiceV5(run: RunGameV5, choice: unknown): FormalMedicalInsuranceTierViewV4 | null {
  const offer = getMedicalInsuranceOfferV5(run);
  if (!offer.available) throw new Error(offer.message);
  if (offer.purchased) throw new Error("本局已经购买过医疗保险。");
  if (offer.seen) throw new Error("本局医疗保险机会已经处理过。");
  const normalized = String(choice || "basic");
  if (normalized === "decline") return null;
  const tier = offer.tiers.find(entry => entry.tier === normalized);
  if (!tier) throw new Error("未知的医疗保险档位。");
  return tier;
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

export function getTrainingGroundLessonsV5(run: RunGameV5): FormalTrainingGroundLessonViewV4[] {
  const node = currentRestNodeV5(run);
  if (!node) return [];
  return formalTrainingGroundLessonTableV4().map(lesson => trainingGroundLessonViewV5(run, node.nodeId, lesson, `${node.nodeId}:lesson:${lesson.kind}`));
}

export function getTrainingGroundLessonForInputV5(run: RunGameV5, input: Partial<FormalTrainingGroundApplyInputV4>): FormalTrainingGroundLessonViewV4 | null {
  const node = currentRestNodeV5(run);
  if (!node) return null;
  const lessons = getTrainingGroundLessonsV5(run);
  const requestedKind = input.lessonKind || formalTrainingGroundLessonKindFromIdV4(input.lessonId || "");
  if (requestedKind) return lessons.find(lesson => lesson.kind === requestedKind) || null;
  const state = run.restState.trainingGroundByNodeId?.[node.nodeId] || {nodeId: node.nodeId, lessonRoll: 0, selfStudyRoll: 0, updatedAt: run.updatedAt};
  const lessonRoll = Math.max(0, Math.floor(Number(state.lessonRoll || 0)));
  const lesson = formalTrainingGroundLessonForRollV4(run.config.seed, node.nodeId, lessonRoll);
  return trainingGroundLessonViewV5(run, node.nodeId, lesson, `${node.nodeId}:lesson:${lessonRoll}:${lesson.kind}`);
}

export function exchangeSelfPokemonV5(run: RunGameV5, input: {sourcePokemonId: string; targetPokemon: LocalPokemonV4; view: FormalPokemonExchangeViewV4}, commandId: string, now = new Date(), options: RunGameV5RuleOptions = {}): {run: RunGameV5; result: Record<string, unknown>} {
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
  const previousState = run.restState.exchangeByNodeId?.[input.view.nodeId] || {nodeId: input.view.nodeId, records: [], updatedAt: iso};
  const sourceIndex = self.localTeamPokemonIds.indexOf(sourcePokemonId);
  const exchangeRoll = Math.max(0, Math.floor(Number(run.restState.exchangeRollByNodeId?.[input.view.nodeId] || 0)));
  const received = prepareExchangedPokemonFromRuleContextV5({
    seed: run.config.seed,
    nodeId: input.view.nodeId,
    pokemon: input.targetPokemon,
    slotIndex: sourceIndex,
    exchangeRoll,
    flags: input.view.flags,
    receivedPokemonId: sourcePokemonId,
    calculateMaxHp: options.calculateMaxHp,
  });
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
        exchangeRollByNodeId: {
          ...(run.restState.exchangeRollByNodeId || {}),
          [input.view.nodeId]: exchangeRoll + 1,
        },
        coinLog: cost > 0 ? appendCoinLogV5(run.restState.coinLog || [], coinLogEntryV5(commandId, "pokemon-exchange", `交换 ${input.targetPokemon.nameZh || input.targetPokemon.name}`, -cost, self.money, balanceAfter, currentRoundIndexV5(run), iso)) : run.restState.coinLog,
      },
      commandLog: appendCommandLog(run, commandId, "pokemon.exchange", result, iso, run.revision + 1),
    }),
    result,
  };
}

export function getPokemonExchangeViewV5(run: RunGameV5, input: {playerId?: ShowdownPlayerIdV4} = {}): FormalPokemonExchangeViewV4 {
  const playerSlot = input.playerId === "p3" ? "p3" : "p1";
  const opponentSlot = playerSlot === "p3" ? "p4" : "p2";
  const wonNode = latestWonExchangeNodeV5(run);
  const flags = pokemonExchangeFlagsV5(run);
  const empty = (message: string): FormalPokemonExchangeViewV4 => ({
    available: false,
    message,
    nodeId: wonNode?.nodeId || null,
    playerId: playerSlot,
    opponentPlayerId: opponentSlot,
    player: playerDraftForSlotV5(run, playerSlot),
    opponent: wonNode ? playerDraftForSlotV5(run, opponentSlot, wonNode) : null,
    exchangeCount: 0,
    maxExchangeCount: flags.secondExchange ? 2 : 1,
    nextCost: 0,
    secondExchangeCost: 200,
    flags,
  });
  if (!run.gameMap.nodes.length) return empty("当前没有可交换的休整队伍。");
  if (!wonNode) return empty("还没有可交换的上一场对手。");
  const player = playerDraftForSlotV5(run, playerSlot);
  const opponent = playerDraftForSlotV5(run, opponentSlot, wonNode);
  if (!player) return empty("缺少我方队伍。");
  if (!opponent) return empty("缺少上一场对位对手队伍。");
  const visiblePlayer = {
    ...player,
    localTeam: {
      ...player.localTeam,
      pokemon: player.localTeam.pokemon.filter(pokemon => !isProtectedSoulmatePokemonV5(pokemon)),
    },
  };
  const exchangeCount = run.restState.exchangeByNodeId?.[wonNode.nodeId]?.records.length || 0;
  const maxExchangeCount = flags.secondExchange ? 2 : 1;
  const nextCost = exchangeCount === 0 ? 0 : exchangeCount === 1 && flags.secondExchange ? 200 : 0;
  const available = exchangeCount < maxExchangeCount;
  return {
    available,
    message: available ? "选择双方宝可梦后即可交换。" : "本场胜利后的交换次数已经用完。",
    nodeId: wonNode.nodeId,
    playerId: playerSlot,
    opponentPlayerId: opponentSlot,
    player: visiblePlayer,
    opponent,
    exchangeCount,
    maxExchangeCount,
    nextCost,
    secondExchangeCost: 200,
    flags,
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

export function ingestFormalCoopAllyV5(
  run: RunGameV5,
  draft: TrainingPlayerDraftV4,
  npcSnapshot: FormalRoundNpcSnapshotV4 | undefined,
  now = new Date(),
): RunGameV5 {
  const node = currentRestNodeV5(run);
  if (!node || node.slots.p3) return run;
  const iso = now.toISOString();
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  const bagsById = {...run.bagsById};
  const itemInstancesById = {...run.itemInstancesById};
  const playerId = `player:${run.matchId}:${node.nodeId}:p3`;
  upsertPlayerDraftEntities(
    {playersById, pokemonById, bagsById, itemInstancesById},
    playerId,
    draft,
    iso,
    run.matchId,
    node.nodeId,
    npcSnapshot,
    node.seed,
  );
  return assertRunGameV5RedLines({
    ...run,
    updatedAt: iso,
    playersById,
    pokemonById,
    bagsById,
    itemInstancesById,
    gameMap: {
      nodes: run.gameMap.nodes.map(entry => entry.nodeId === node.nodeId
        ? {...entry, slots: {...entry.slots, p3: playerId}}
        : entry),
    },
    roundPlan: run.roundPlan.map(entry => entry.nodeId === node.nodeId
      ? {...entry, slots: {...entry.slots, p3: playerId}, npcRefs: entry.npcRefs.includes(playerId) ? entry.npcRefs : [...entry.npcRefs, playerId]}
      : entry),
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
  npcSnapshot?: FormalRoundNpcSnapshotV4,
  seed = "",
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
  const isNpc = draft.controller === "ai" || draft.controller === "script";
  store.playersById[playerId] = {
    ...previous,
    playerId,
    slot: draft.playerId,
    kind: isNpc ? "npc" : "human",
    controller: draft.controller,
    alliance: draft.alliance,
    name: draft.name,
    avatar: draft.avatar,
    backImage: draft.backImage,
    npcProfile: isNpc ? npcProfileFromDraft(draft, nodeId, seed, iso, npcSnapshot) : undefined,
    money: previous?.money || 0,
    bagId,
    localTeamPokemonIds: pokemonIds,
    ready: previous?.ready || false,
    connectionState: previous?.connectionState || (isNpc ? "online" : "disconnected"),
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

function restockPurchasedShopSlotFromRulesV5(run: RunGameV5, slotId: string, moneyAfterPurchase: number, updatedAt: string): Pick<RunGameV5["restState"], "shopByNodeId" | "shopRestockRollBySlotId"> {
  const shopByNodeId = run.restState.shopByNodeId;
  if (!shopByNodeId || !run.currentNodeId || !shopByNodeId[run.currentNodeId]) {
    return {shopByNodeId, shopRestockRollBySlotId: run.restState.shopRestockRollBySlotId};
  }
  const self = requirePlayer(run, run.selfPlayerId);
  const shop = shopByNodeId[run.currentNodeId]!;
  const restockRoll = Math.max(0, Math.floor(Number(run.restState.shopRestockRollBySlotId?.[slotId] || 0)));
  const restocked = restockFormalShopSlotFromRuleContextV5({
    seed: run.config.seed,
    nodeId: run.currentNodeId,
    roundIndex: currentRoundIndexV5(run),
    money: moneyAfterPurchase,
    team: selfTeamPokemonFromEntitiesV5(run, self.playerId),
    starChart: self.starChartSnapshot,
    pendingSettlement: false,
    updatedAt,
    shop,
    slotId,
    restockRoll,
  });
  return {
    shopRestockRollBySlotId: restocked.restocked
      ? {...(run.restState.shopRestockRollBySlotId || {}), [slotId]: restockRoll + 1}
      : run.restState.shopRestockRollBySlotId,
    shopByNodeId: {
      ...shopByNodeId,
      [run.currentNodeId]: restocked.shop,
    },
  };
}

function medicalInsuranceTierLabelV5(tier: string): string {
  if (tier === "premium") return "高级医疗保险";
  if (tier === "basic") return "基础医疗保险";
  return "医疗保险";
}

function currentRestNodeV5(run: RunGameV5): GameMapNodeV5 | null {
  return (run.currentNodeId ? run.gameMap.nodes.find(node => node.nodeId === run.currentNodeId) : null)
    || run.gameMap.nodes.find(node => node.state === "ready" || node.state === "running")
    || run.gameMap.nodes[0]
    || null;
}

function selfTeamPokemonFromEntitiesV5(run: RunGameV5, playerId: string): LocalPokemonV4[] {
  const player = run.playersById[playerId];
  if (!player) return [];
  return player.localTeamPokemonIds
    .map(pokemonId => run.pokemonById[pokemonId]?.localPokemon || null)
    .filter((pokemon): pokemon is LocalPokemonV4 => Boolean(pokemon));
}

function normalizeStatLockListForV5(values: unknown[] | undefined): DexStatId[] {
  const valid = new Set<DexStatId>(["hp", "atk", "def", "spa", "spd", "spe"]);
  return Array.from(new Set((values || [])
    .map(value => String(value || ""))
    .filter((value): value is DexStatId => valid.has(value as DexStatId))));
}

function trainingGroundLessonViewV5(
  run: RunGameV5,
  nodeId: string,
  lesson: Omit<FormalTrainingGroundLessonViewV4, "lessonId">,
  lessonId: string,
): FormalTrainingGroundLessonViewV4 {
  const node = run.gameMap.nodes.find(entry => entry.nodeId === nodeId);
  const self = requirePlayer(run, run.selfPlayerId);
  return {
    ...lesson,
    lessonId,
    fee: formalTrainingGroundLessonFeeV4(lesson.fee, {
      roundIndex: node?.index ?? currentRoundIndexV5(run),
      groupStageDiscount: formalTrainingGroundDiscountForStarChartV4(self.starChartSnapshot),
    }),
  };
}

function latestWonExchangeNodeV5(run: RunGameV5): GameMapNodeV5 | null {
  const current = currentRestNodeV5(run);
  const currentIndex = current?.index ?? run.gameMap.nodes.length;
  return run.gameMap.nodes
    .filter(node => node.state === "won" && node.index < currentIndex)
    .sort((left, right) => right.index - left.index)[0]
    || null;
}

function playerDraftForSlotV5(run: RunGameV5, slot: ShowdownPlayerIdV4, node?: GameMapNodeV5 | null): TrainingPlayerDraftV4 | null {
  const playerId = (node?.slots || currentRestNodeV5(run)?.slots || {})[slot]
    || Object.values(run.playersById).find(player => player.slot === slot)?.playerId
    || "";
  return playerId ? draftForPlayer(run, playerId) : null;
}

function pokemonExchangeFlagsV5(run: RunGameV5): FormalPokemonExchangeViewV4["flags"] {
  const self = requirePlayer(run, run.selfPlayerId);
  return {
    lossless: starChartHasRuntimeEffectV4(self.starChartSnapshot, "exchange_full_hp"),
    eliteEducation: starChartHasRuntimeEffectV4(self.starChartSnapshot, "exchange_power_boost"),
    itemSteal: starChartHasRuntimeEffectV4(self.starChartSnapshot, "exchange_keep_item"),
    secondExchange: starChartHasRuntimeEffectV4(self.starChartSnapshot, "second_exchange"),
  };
}

function isProtectedSoulmatePokemonV5(pokemon: Pick<LocalPokemonV4, "formalSourceKind" | "originKind"> | null | undefined): boolean {
  return pokemon?.formalSourceKind === "soulmate-vault" || pokemon?.originKind === "soulmate";
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
    aiProfile: player.npcProfile?.aiProfile,
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

function npcProfileFromDraft(
  draft: TrainingPlayerDraftV4,
  nodeId: string,
  seed: string,
  generatedAt: string,
  snapshot?: FormalRoundNpcSnapshotV4,
): PlayerInstanceV5["npcProfile"] {
  const trainerType = snapshot?.trainerType || "normal";
  const {rank, rankLabel} = npcRankForTrainerTypeV5(trainerType);
  return {
    trainerId: snapshot?.trainerId || `generated:${trainerType}:${nodeId}:${draft.playerId}`,
    trainerType,
    rank,
    rankLabel,
    powerProfile: snapshot?.powerProfile || "normal",
    teamPreference: snapshot?.teamPreference || "balanced",
    battlePreference: snapshot?.battlePreference || "balanced",
    isBoss: snapshot?.isBoss || false,
    aiProfile: snapshot?.aiProfile || draft.aiProfile || {level: "normal", preference: "balanced"},
    generatedBy: {
      nodeId,
      seed,
      generatedAt,
    },
  };
}

function npcRankForTrainerTypeV5(trainerType: FormalRoundNpcSnapshotV4["trainerType"]): Pick<NonNullable<PlayerInstanceV5["npcProfile"]>, "rank" | "rankLabel"> {
  if (trainerType === "rookie") return {rank: "rookie", rankLabel: "菜鸟训练家"};
  if (trainerType === "elite") return {rank: "elite", rankLabel: "精英训练家"};
  if (trainerType === "gym") return {rank: "gym_leader", rankLabel: "馆主"};
  if (trainerType === "elite4") return {rank: "boss", rankLabel: "四天王"};
  if (trainerType === "champion") return {rank: "champion", rankLabel: "冠军"};
  if (trainerType === "villain") return {rank: "villain", rankLabel: "反派头目"};
  return {rank: "trainer", rankLabel: "普通训练家"};
}
