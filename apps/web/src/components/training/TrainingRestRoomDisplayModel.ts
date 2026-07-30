import type {
  FormalPokemonExchangeViewV4,
  FormalRestShopV4,
  FormalRoundSettlementV4,
  FormalTrainingGroundLessonViewV4,
  RunGameRestNodeViewV5,
  RunGameRestViewV5,
  ShowdownPlayerIdV4,
  TrainingPlayerDraftV4,
  TrainingRunGameV4,
} from "@changebattle-v2/api";

export type RoomTrainingRestNextPreviewModel = {
  mode: TrainingRunGameV4["scenario"]["mode"];
  trainers: TrainingPlayerDraftV4[];
  rank: string;
  nodeId: string;
  unlocks: TrainingRunGameV4["restPreviewUnlocks"];
};

export type RoomRestDisplayModel = {
  source: "room-v5";
  id: string;
  status: TrainingRunGameV4["status"];
  mode: TrainingRunGameV4["scenario"]["mode"];
  legacyRun: null;
  team: TrainingPlayerDraftV4["localTeam"] | null;
  bag: TrainingPlayerDraftV4["bag"] | null;
  player: TrainingPlayerDraftV4 | null;
  money: number;
  currentNode: TrainingRunGameV4["gameMap"][number] | null;
  map: TrainingRunGameV4["gameMap"];
  nextPreview: RoomTrainingRestNextPreviewModel | null;
  pendingSettlement: boolean;
  roundSettlement: FormalRoundSettlementV4 | null;
  exchange: FormalPokemonExchangeViewV4 | null;
  shop: FormalRestShopV4 | null;
  trainingGround: {
    lessons: FormalTrainingGroundLessonViewV4[];
    lesson: FormalTrainingGroundLessonViewV4 | null;
  };
  restPreviewUnlocks: TrainingRunGameV4["restPreviewUnlocks"];
  battleLog: TrainingRunGameV4["battleLog"];
  coinLog: TrainingRunGameV4["coinLog"];
};

export function trainingRestDisplayFromRestViewV5(input: {
  view: RunGameRestViewV5;
  seenRoundSettlementNodeIds?: Record<string, true>;
}): RoomRestDisplayModel {
  const {view} = input;
  const players = playersFromViewV5(view);
  const currentNode = currentNodeFromViewV5(view, players);
  const gameMap = [view.currentNode, view.nextNode]
    .filter((entry, index, list): entry is RunGameRestNodeViewV5 => Boolean(entry && list.findIndex(item => item?.nodeId === entry.nodeId) === index))
    .map(nodeFromViewV5(players));
  const self = players.p1 || playerForSelfViewV5(view);
  const roundSettlement = latestUnreadRoundSettlementFromViewV5(view, input.seenRoundSettlementNodeIds || {});
  return {
    source: "room-v5",
    id: view.runId,
    status: roomStatusForTrainingRestV5(view),
    mode: currentNode?.mode || view.config.mode,
    legacyRun: null,
    team: self?.localTeam || null,
    bag: self?.bag || null,
    player: self,
    money: Math.max(0, Math.floor(Number(view.selfPlayer?.money || 0))),
    currentNode,
    map: gameMap,
    nextPreview: nextPreviewFromViewV5(view, players),
    pendingSettlement: view.status === "settlement_ready" || view.phase === "settlement",
    roundSettlement,
    exchange: view.exchange || null,
    shop: view.shop || null,
    trainingGround: {
      lessons: view.trainingGround?.lessons || [],
      lesson: view.trainingGround?.lesson || null,
    },
    restPreviewUnlocks: view.rest.restPreviewUnlocks,
    battleLog: view.recentBattleLog || [],
    coinLog: view.recentCoinLog || [],
  };
}

function roomStatusForTrainingRestV5(view: RunGameRestViewV5): TrainingRunGameV4["status"] {
  if (view.status === "settlement_ready" || view.phase === "settlement") return "battleEndedPendingSettlement";
  if (view.status === "battling") return "battling";
  if (view.status === "battle_preparing") return "battlePreparing";
  if (view.status === "ended") return "ended";
  return "resting";
}

function playersFromViewV5(view: RunGameRestViewV5): Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> {
  return Object.fromEntries(view.players.map(player => [player.slot, playerDraftFromViewV5(view, player)])) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
}

function playerForSelfViewV5(view: RunGameRestViewV5): TrainingPlayerDraftV4 | null {
  return view.selfPlayer ? playerDraftFromViewV5(view, view.selfPlayer) : null;
}

function playerDraftFromViewV5(view: RunGameRestViewV5, player: RunGameRestViewV5["players"][number]): TrainingPlayerDraftV4 {
  const isSelf = player.playerId === view.selfPlayerId;
  const bag = isSelf && view.bag ? {
    maxSize: view.bag.maxSize,
    battleBagEnabled: view.bag.battleBagEnabled,
    items: view.bag.items.map(item => item.item),
  } : {maxSize: 50, items: []};
  return {
    playerId: player.slot,
    name: player.name,
    avatar: player.avatar,
    backImage: player.backImage,
    controller: player.controller,
    alliance: player.alliance,
    localTeam: {
      id: `team:${player.playerId}`,
      name: `${player.name || player.slot}的队伍`,
      pokemon: player.team.map(entry => entry.localPokemon),
    },
    bag,
  };
}

function nodeFromViewV5(players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>) {
  return (node: RunGameRestNodeViewV5): TrainingRunGameV4["gameMap"][number] => ({
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
    participants: {
      p1: node.slots.p1 ? players.p1 : undefined,
      p2: node.slots.p2 ? players.p2 : undefined,
      p3: node.slots.p3 ? players.p3 : undefined,
      p4: node.slots.p4 ? players.p4 : undefined,
    },
    battleGame: node.battleGame,
    createdAt: node.createdAt,
    startedAt: node.startedAt,
    endedAt: node.endedAt,
  });
}

function currentNodeFromViewV5(view: RunGameRestViewV5, players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>): TrainingRunGameV4["gameMap"][number] | null {
  const node = view.currentNode || view.nextNode || null;
  return node ? nodeFromViewV5(players)(node) : null;
}

function latestUnreadRoundSettlementFromViewV5(view: RunGameRestViewV5, seen: Record<string, true>): FormalRoundSettlementV4 | null {
  const settlements = Object.values(view.rest.roundSettlementByNodeId || {});
  settlements.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
  return settlements.find(settlement => !seen[`${view.runId}:${settlement.nodeId}`]) || null;
}

function nextPreviewFromViewV5(view: RunGameRestViewV5, players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>): RoomTrainingRestNextPreviewModel | null {
  const current = view.currentNode || view.nextNode || null;
  if (!current) return null;
  const trainers = [current.slots.p2 ? players.p2 : null, current.slots.p4 ? players.p4 : null]
    .filter((entry): entry is TrainingPlayerDraftV4 => Boolean(entry));
  return {
    mode: current.mode || view.config.mode,
    trainers,
    rank: formalRoundStageLabel(current.index || 0),
    nodeId: current.nodeId || view.currentNodeId || "preview",
    unlocks: view.rest.restPreviewUnlocks,
  };
}

function formalRoundStageLabel(index: number): string {
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
