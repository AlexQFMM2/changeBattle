import type {
  ChangeBattleV2Api,
  FormalGameRunV4,
  FormalRestShopV4,
  FormalPokemonExchangeViewV4,
  FormalRoundSettlementV4,
  FormalTrainingGroundLessonViewV4,
  ShowdownPlayerIdV4,
  TrainingPlayerDraftV4,
  TrainingRunGameV4,
} from "@changebattle-v2/api";

export type TrainingRestNextPreviewModel = {
  mode: TrainingRunGameV4["scenario"]["mode"];
  trainers: TrainingPlayerDraftV4[];
  rank: string;
  nodeId: string;
  unlocks: TrainingRunGameV4["restPreviewUnlocks"];
};

export type TrainingRestDisplayModel = {
  source: "legacy-v4";
  id: string;
  status: TrainingRunGameV4["status"];
  mode: TrainingRunGameV4["scenario"]["mode"];
  legacyRun: TrainingRunGameV4;
  team: TrainingPlayerDraftV4["localTeam"] | null;
  bag: TrainingPlayerDraftV4["bag"] | null;
  player: TrainingPlayerDraftV4 | null;
  money: number;
  currentNode: TrainingRunGameV4["gameMap"][number] | null;
  map: TrainingRunGameV4["gameMap"];
  nextPreview: TrainingRestNextPreviewModel | null;
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

export function trainingRestDisplayFromTrainingRunV4(input: {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  formalRun?: FormalGameRunV4 | null;
  roundSettlement?: FormalRoundSettlementV4 | null;
  money?: number;
}): TrainingRestDisplayModel {
  const {api, run, formalRun} = input;
  const player = run.players.p1 || null;
  const currentNode = run.gameMap.find(node => node.id === run.currentNodeId)
    || run.gameMap.find(node => node.state === "ready" || node.state === "running")
    || run.gameMap[0]
    || null;
  return {
    source: "legacy-v4",
    id: run.id,
    status: run.status,
    mode: currentNode?.mode || run.scenario.mode,
    legacyRun: run,
    team: player?.localTeam || null,
    bag: player?.bag || null,
    player,
    money: Math.max(0, Math.floor(Number(input.money ?? 0))),
    currentNode,
    map: run.gameMap,
    nextPreview: nextPreviewFromTrainingRunV4(run),
    pendingSettlement: run.status === "battleEndedPendingSettlement",
    roundSettlement: input.roundSettlement || null,
    exchange: null,
    shop: formalRun ? api.getFormalRestShop(formalRun) : null,
    trainingGround: {
      lessons: formalRun ? api.getFormalTrainingGroundLessons(formalRun) : [],
      lesson: formalRun ? api.getFormalTrainingGroundLesson(formalRun) : null,
    },
    restPreviewUnlocks: run.restPreviewUnlocks,
    battleLog: run.battleLog,
    coinLog: run.coinLog,
  };
}

function nextPreviewFromTrainingRunV4(run: TrainingRunGameV4): TrainingRestNextPreviewModel | null {
  const current = run.gameMap.find(node => node.id === run.currentNodeId) || run.gameMap.find(node => node.state === "ready") || run.gameMap[0] || null;
  if (!current) return null;
  const farIds = [current.p2, current.p4].filter(Boolean) as ShowdownPlayerIdV4[];
  const trainers = farIds
    .map(playerId => current.participants[playerId] || run.players[playerId])
    .filter((entry): entry is TrainingPlayerDraftV4 => Boolean(entry));
  return {
    mode: current.mode || run.scenario.mode,
    trainers,
    rank: formalRoundStageLabel(current.index || 0),
    nodeId: current.id || run.currentNodeId || "preview",
    unlocks: run.restPreviewUnlocks,
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
