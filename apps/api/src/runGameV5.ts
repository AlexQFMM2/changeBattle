import type {BattlePreferenceV4, FormalCompetitionModeV4, PlayerItemInstanceV4, ShowdownPlayerIdV4, TrainingAllianceV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4, TrainingRuleSetV4} from "./training.js";
import type {FormalGameModeV4, FormalMedicalInsuranceStateV4, FormalGameRunV4, FormalRoundNpcSnapshotV4, FormalRoundPlanV4, FormalStarterCandidateV4} from "./formalGame.js";
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
  commandLog: Record<CommandIdV5, {revision: number; commandName: string; result: unknown; createdAt: string}>;
  finalResult?: unknown;
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
      [selfBagId]: {bagId: selfBagId, ownerPlayerId: selfPlayerId, maxSize: 50, itemInstanceIds: [], battleBagEnabled: Boolean(input.starterRun.battlePreference.battleBagEnabled), createdAt: iso, updatedAt: iso},
    },
    itemInstancesById: {},
    gameMap: {nodes: []},
    roundPlan: [],
    currentNodeId: null,
    restState: {},
    commandLog: {},
  });
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

export function ingestFormalRunCompatStateV5(run: RunGameV5, compatRun: FormalGameRunV4, commandName: string, commandId: string, result: unknown = {}, now = new Date()): RunGameV5 {
  const repeated = run.commandLog[commandId];
  if (repeated) return run;
  const iso = now.toISOString();
  const playersById = {...run.playersById};
  const pokemonById = {...run.pokemonById};
  const bagsById = {...run.bagsById};
  const itemInstancesById = {...run.itemInstancesById};
  const self = requirePlayer(run, run.selfPlayerId);
  const currentCompatNode = compatRun.restRunSnapshot?.gameMap.find(node => node.id === compatRun.restRunSnapshot?.currentNodeId)
    || compatRun.restRunSnapshot?.gameMap.find(node => node.state === "ready" || node.state === "running" || node.state === "preparing")
    || null;
  const currentV5Node = run.gameMap.nodes.find(node => node.nodeId === (currentCompatNode?.id || run.currentNodeId || ""));
  const slotEntries: Array<[PlayerInstanceIdV5, TrainingPlayerDraftV4]> = [];
  const selfDraft = compatRun.restRunSnapshot?.players.p1 || (compatRun.playerTeam ? draftFromTeam("p1", self, compatRun.playerTeam) : null);
  if (selfDraft) slotEntries.push([self.playerId, selfDraft]);
  if (currentCompatNode && currentV5Node) {
    (["p2", "p3", "p4"] as ShowdownPlayerIdV4[]).forEach(slot => {
      const playerId = currentV5Node.slots[slot];
      const draft = currentCompatNode.participants[slot] || compatRun.restRunSnapshot?.players[slot];
      if (playerId && draft) slotEntries.push([playerId, draft]);
    });
  }
  for (const [playerId, draft] of slotEntries) {
    upsertPlayerDraftEntities({playersById, pokemonById, bagsById, itemInstancesById}, playerId, draft, iso, run.matchId, currentCompatNode?.id || run.currentNodeId || "rest");
  }
  const nextSelf = playersById[self.playerId] || self;
  playersById[self.playerId] = {
    ...nextSelf,
    money: Math.max(0, Math.floor(Number(compatRun.money || 0))),
    starChartSnapshot: compatRun.starChartSnapshot || nextSelf.starChartSnapshot,
    updatedAt: iso,
  };
  const nodes = run.gameMap.nodes.map(node => {
    const compatNode = compatRun.restRunSnapshot?.gameMap.find(entry => entry.id === node.nodeId);
    return compatNode ? {
      ...node,
      state: compatNode.state,
      battleGame: compatNode.battleGame,
      startedAt: compatNode.startedAt,
      endedAt: compatNode.endedAt,
    } : node;
  });
  const status = statusFromCompatRun(compatRun, run.status);
  return assertRunGameV5RedLines({
    ...run,
    status,
    phase: phaseFromStatus(status),
    revision: run.revision + 1,
    updatedAt: iso,
    playersById,
    pokemonById,
    bagsById,
    itemInstancesById,
    gameMap: {nodes},
    currentNodeId: compatRun.restRunSnapshot?.currentNodeId || run.currentNodeId,
    restState: {
      ...run.restState,
      shopByNodeId: compatRun.shopByNodeId,
      trainingGroundByNodeId: compatRun.trainingGroundByNodeId,
      roundSettlementByNodeId: compatRun.roundSettlementByNodeId,
      exchangeByNodeId: compatRun.exchangeByNodeId,
      medicalInsuranceOfferSeen: Boolean(compatRun.medicalInsuranceOfferSeen),
      medicalInsurance: compatRun.medicalInsurance || null,
      restPreviewUnlocks: compatRun.restRunSnapshot?.restPreviewUnlocks,
      coinLog: compatRun.restRunSnapshot?.coinLog,
      battleLog: compatRun.restRunSnapshot?.battleLog,
    },
    finalResult: compatRun.settlement ? {
      settlementId: compatRun.settlement.id,
      settlement: compatRun.settlement,
      settledAt: compatRun.settledAt,
    } : run.finalResult,
    commandLog: appendCommandLog(run, commandId, commandName, result, iso, run.revision + 1),
  });
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
    status: run.status === "battling" ? "battling" : run.status === "battle_preparing" ? "battlePreparing" : "resting",
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
    result: null,
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
    medicalInsuranceOfferSeen: Boolean(run.restState.medicalInsuranceOfferSeen || run.restState.medicalInsurance),
    medicalInsurance: run.restState.medicalInsurance || null,
    settlement: null,
    settled: false,
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

function draftFromTeam(slot: ShowdownPlayerIdV4, player: PlayerInstanceV5, localTeam: LocalTeamV4): TrainingPlayerDraftV4 {
  return {
    playerId: slot,
    name: player.name,
    avatar: player.avatar,
    backImage: player.backImage,
    controller: player.controller,
    alliance: player.alliance,
    localTeam,
    bag: {maxSize: 50, items: []},
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
  return {...run.commandLog, [commandId]: {revision, commandName, result, createdAt}};
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
