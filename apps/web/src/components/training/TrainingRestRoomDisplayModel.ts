import type {
  FormalPokemonExchangeViewV4,
  FormalRestShopV4,
  FormalRoundSettlementV4,
  FormalTrainingGroundLessonViewV4,
  RunGameRestNodeViewV5,
  RunGameRestViewV5,
} from "@changebattle-v2/api";

export type RoomRestPokemonDisplayModel = RunGameRestViewV5["team"][number];
export type RoomRestItemDisplayModel = NonNullable<RunGameRestViewV5["bag"]>["items"][number];
export type RoomRestPlayerDisplayModel = RunGameRestViewV5["players"][number];

export type RoomRestNextPreviewModel = {
  mode: RunGameRestViewV5["config"]["mode"];
  trainers: RoomRestPlayerDisplayModel[];
  rank: string;
  nodeId: string;
  unlocks: RunGameRestViewV5["rest"]["restPreviewUnlocks"];
};

export type RoomRestDisplayModel = {
  source: "room-v5";
  id: string;
  status: RunGameRestViewV5["status"];
  mode: RunGameRestViewV5["config"]["mode"];
  selfPlayerId: string;
  selfPlayer: RoomRestPlayerDisplayModel | null;
  team: RoomRestPokemonDisplayModel[];
  bag: RunGameRestViewV5["bag"];
  money: number;
  currentNode: RunGameRestNodeViewV5 | null;
  map: RunGameRestNodeViewV5[];
  nextPreview: RoomRestNextPreviewModel | null;
  pendingSettlement: boolean;
  roundSettlement: FormalRoundSettlementV4 | null;
  exchange: FormalPokemonExchangeViewV4 | null;
  shop: FormalRestShopV4 | null;
  trainingGround: {
    lessons: FormalTrainingGroundLessonViewV4[];
    lesson: FormalTrainingGroundLessonViewV4 | null;
  };
  restPreviewUnlocks: RunGameRestViewV5["rest"]["restPreviewUnlocks"];
  battleLog: RunGameRestViewV5["rest"]["battleLog"];
  coinLog: RunGameRestViewV5["rest"]["coinLog"];
};

export function trainingRestDisplayFromRestViewV5(input: {
  view: RunGameRestViewV5;
  seenRoundSettlementNodeIds?: Record<string, true>;
}): RoomRestDisplayModel {
  const {view} = input;
  const currentNode = view.currentNode || view.nextNode || null;
  const map = [view.currentNode, view.nextNode]
    .filter((entry, index, list): entry is RunGameRestNodeViewV5 => Boolean(entry && list.findIndex(item => item?.nodeId === entry.nodeId) === index));
  const roundSettlement = latestUnreadRoundSettlementFromViewV5(view, input.seenRoundSettlementNodeIds || {});
  return {
    source: "room-v5",
    id: view.runId,
    status: view.status,
    mode: currentNode?.mode || view.config.mode,
    selfPlayerId: view.selfPlayerId,
    selfPlayer: view.selfPlayer,
    team: view.team,
    bag: view.bag,
    money: Math.max(0, Math.floor(Number(view.selfPlayer?.money || 0))),
    currentNode,
    map,
    nextPreview: nextPreviewFromViewV5(view),
    pendingSettlement: view.status === "settlement_ready" || view.phase === "settlement",
    roundSettlement,
    exchange: view.exchange || null,
    shop: currentNode?.nodeId ? view.rest.shopByNodeId?.[currentNode.nodeId] || null : null,
    trainingGround: {
      lessons: view.trainingGround?.lessons || [],
      lesson: view.trainingGround?.lesson || null,
    },
    restPreviewUnlocks: view.rest.restPreviewUnlocks,
    battleLog: view.rest.battleLog,
    coinLog: view.rest.coinLog,
  };
}

function latestUnreadRoundSettlementFromViewV5(view: RunGameRestViewV5, seen: Record<string, true>): FormalRoundSettlementV4 | null {
  const settlements = Object.values(view.rest.roundSettlementByNodeId || {});
  settlements.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
  return settlements.find(settlement => !seen[`${view.runId}:${settlement.nodeId}`]) || null;
}

function nextPreviewFromViewV5(view: RunGameRestViewV5): RoomRestNextPreviewModel | null {
  const current = view.currentNode || view.nextNode || null;
  if (!current) return null;
  const playersById = new Map(view.players.map(player => [player.playerId, player]));
  const trainers = [current.slots.p2, current.slots.p4]
    .map(playerId => playerId ? playersById.get(playerId) || null : null)
    .filter((entry): entry is RoomRestPlayerDisplayModel => Boolean(entry));
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
