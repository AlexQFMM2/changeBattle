import type {BattlePreferenceV4, FormalCompetitionModeV4, TrainingModeV4, TrainingRuleSetV4} from "./battlePreference.js";
import type {BagStateV4} from "./bagState.js";
import type {TrainingBattleLogEntryV4} from "./battleLog.js";
import type {TrainingCoinLogEntryV4} from "./coinLog.js";
import type {LocalTeamV4} from "./pokemonInstance.js";

export type ShowdownPlayerIdV4 = "p1" | "p2" | "p3" | "p4";

export type TrainingControllerV4 = "local" | "ai" | "script";

export type TrainingAllianceV4 = "near" | "far";

export type TrainingRunStatusV4 = "configuring" | "resting" | "battlePreparing" | "battling" | "settling" | "battleEndedPendingSettlement" | "ended" | "blocked";

export type TrainingRunNodeStateV4 = "locked" | "ready" | "preparing" | "running" | "won" | "lost" | "skipped" | "blocked";

export type TrainingRunGameV4 = {
  version: 1;
  id: string;
  source: "training";
  status: TrainingRunStatusV4;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  scenario: TrainingScenarioV4;
  players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
  currentNodeId: string | null;
  gameMap: TrainingRunGameNodeV4[];
  result: TrainingRunResultV4 | null;
  battlePreference: BattlePreferenceV4;
  competitionMode?: FormalCompetitionModeV4;
  restPreviewUnlocks?: Record<string, true>;
  coinLog?: TrainingCoinLogEntryV4[];
  battleLog?: TrainingBattleLogEntryV4[];
};

export type TrainingBattleGamePlaceholderV4 = {
  id: string;
  status: "creating" | "running" | "ended" | "blocked";
} | null;

export type TrainingRunGameNodeV4 = {
  id: string;
  index: number;
  state: TrainingRunNodeStateV4;
  p1: ShowdownPlayerIdV4 | null;
  p2: ShowdownPlayerIdV4 | null;
  p3: ShowdownPlayerIdV4 | null;
  p4: ShowdownPlayerIdV4 | null;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  seed: string;
  participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
  battleGame: TrainingBattleGamePlaceholderV4;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
};

export type TrainingRunResultV4 = {
  outcome: "win" | "loss" | "abandoned";
  reason: string;
} | null;

export type TrainingScenarioV4 = {
  id: string;
  name: string;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  battleCount: number;
  players: TrainingPlayerDraftV4[];
  selectedNpcIds: Partial<Record<ShowdownPlayerIdV4, string>>;
};

export type TrainingPlayerDraftV4 = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  avatar: string;
  backImage?: string;
  controller: TrainingControllerV4;
  alliance: TrainingAllianceV4;
  localTeam: LocalTeamV4;
  bag: BagStateV4;
};

export const TRAINING_RUN_STATUSES_V4: TrainingRunStatusV4[] = ["configuring", "resting", "battlePreparing", "battling", "settling", "battleEndedPendingSettlement", "ended", "blocked"];

export const TRAINING_RUN_NODE_STATES_V4: TrainingRunNodeStateV4[] = ["locked", "ready", "preparing", "running", "won", "lost", "skipped", "blocked"];

export function normalizeTrainingRunStatusV4(status: unknown, gameMap: TrainingRunGameNodeV4[] = []): TrainingRunStatusV4 {
  return TRAINING_RUN_STATUSES_V4.includes(status as TrainingRunStatusV4)
    ? status as TrainingRunStatusV4
    : gameMap.length ? "resting" : "configuring";
}

export function normalizeTrainingRunNodeStateV4(state: unknown, index = 0): TrainingRunNodeStateV4 {
  return TRAINING_RUN_NODE_STATES_V4.includes(state as TrainingRunNodeStateV4)
    ? state as TrainingRunNodeStateV4
    : index === 0 ? "ready" : "locked";
}

export function isTrainingRunPendingSettlementV4(run: Pick<TrainingRunGameV4, "status"> | null | undefined): boolean {
  return run?.status === "battleEndedPendingSettlement";
}

export function isTrainingRunEndedV4(run: Pick<TrainingRunGameV4, "status"> | null | undefined): boolean {
  return run?.status === "ended" || run?.status === "blocked";
}

export function getCurrentTrainingNodeV4(run: Pick<TrainingRunGameV4, "currentNodeId" | "gameMap"> | null | undefined): TrainingRunGameNodeV4 | null {
  if (!run) return null;
  return run.gameMap.find(node => node.id === run.currentNodeId)
    || run.gameMap.find(node => node.state === "ready" || node.state === "running" || node.state === "preparing")
    || null;
}

export function getNextTrainingNodeV4(run: Pick<TrainingRunGameV4, "currentNodeId" | "gameMap"> | null | undefined): TrainingRunGameNodeV4 | null {
  if (!run) return null;
  const current = getCurrentTrainingNodeV4(run);
  return run.gameMap.find(node => node.index > (current?.index ?? -1) && node.state === "locked") || null;
}
