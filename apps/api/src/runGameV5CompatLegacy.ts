// Legacy/test-only adapter. Do not import this file from formal room runtime routes.
// Formal room C/S mainline must use scoped V5 views and entity commands only.
import type {FormalGameRunV4, FormalRoundNpcSnapshotV4} from "./formalGame.js";
import type {LocalTeamV4, PlayerItemInstanceV4, ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4} from "./training.js";
import type {PlayerInstanceV5, PokemonInstanceV5, RunGameV5} from "./runGameV5.js";

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

function npcSnapshotForPlayer(player: PlayerInstanceV5 | undefined, nodeId: string): FormalRoundNpcSnapshotV4 | null {
  if (!player || player.kind !== "npc") return null;
  return {
    id: player.npcProfile?.trainerId || player.playerId,
    trainerId: player.npcProfile?.trainerId || player.playerId,
    trainerType: player.npcProfile?.trainerType || "normal",
    name: player.name,
    avatar: player.avatar,
    playerId: player.slot,
    battlePreference: player.npcProfile?.battlePreference || "balanced",
    teamPreference: player.npcProfile?.teamPreference || "balanced",
    powerProfile: player.npcProfile?.powerProfile || "normal",
    aiProfile: player.npcProfile?.aiProfile || {level: "normal", preference: "balanced"},
    isBoss: player.npcProfile?.isBoss || false,
    diagnostics: [`v5-player:${player.playerId}`, `node:${nodeId}`],
  };
}
