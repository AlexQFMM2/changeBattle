import type {
  BattleAiFeatureVectorV4,
  BattleAiLevelV4,
  BattleAiProfileV4,
  BattleAiSearchDebugV4,
} from "./types.js";

export type BattleAiCandidateV4 = {
  choice: string;
  score: number;
  features: BattleAiFeatureVectorV4;
  kind: "team" | "switch" | "move" | "pass";
  activeIndex?: number;
  diagnostics?: Record<string, unknown>;
};

export type BattleAiSearchBudgetV4 = {
  maxDepth: 1 | 2 | 3 | 4 | 5 | 6;
  maxMs: number;
  ownTopK: number;
  foeTopK: number;
  maxNodes: number;
  maxJointActions: number;
};

export type BattleAiSearchResultV4 = {
  candidate: BattleAiCandidateV4 | null;
  debug: BattleAiSearchDebugV4;
};

export type BattleAiSearchInputV4 = {
  candidates: BattleAiCandidateV4[];
  profile: Required<BattleAiProfileV4>;
  timeBudgetMs?: number;
  pickBestCandidate: (candidates: BattleAiCandidateV4[]) => BattleAiCandidateV4 | null;
};

const AI_SEARCH_BUDGETS: Record<BattleAiLevelV4, BattleAiSearchBudgetV4> = {
  rookie: {maxDepth: 1, maxMs: 300, ownTopK: 3, foeTopK: 2, maxNodes: 100, maxJointActions: 4},
  normal: {maxDepth: 2, maxMs: 1_000, ownTopK: 4, foeTopK: 3, maxNodes: 300, maxJointActions: 6},
  elite: {maxDepth: 3, maxMs: 2_000, ownTopK: 4, foeTopK: 3, maxNodes: 800, maxJointActions: 8},
  gymLeader: {maxDepth: 4, maxMs: 5_000, ownTopK: 5, foeTopK: 4, maxNodes: 1_500, maxJointActions: 10},
  eliteFour: {maxDepth: 5, maxMs: 8_000, ownTopK: 5, foeTopK: 4, maxNodes: 3_000, maxJointActions: 12},
  champion: {maxDepth: 6, maxMs: 10_000, ownTopK: 6, foeTopK: 5, maxNodes: 5_000, maxJointActions: 12},
};

export function battleAiSearchBudgetForLevelV4(level: BattleAiLevelV4, timeBudgetMs?: number): BattleAiSearchBudgetV4 {
  const budget = AI_SEARCH_BUDGETS[level];
  return {
    ...budget,
    maxMs: Math.max(0, Math.min(budget.maxMs, timeBudgetMs ?? budget.maxMs)),
  };
}

export function chooseBattleAiActionBySearchV4(input: BattleAiSearchInputV4): BattleAiSearchResultV4 {
  const startedAt = Date.now();
  const budget = battleAiSearchBudgetForLevelV4(input.profile.level, input.timeBudgetMs);
  const debugBase = {
    strategy: "numeric-guard" as const,
    maxDepth: budget.maxDepth,
    searchedDepth: input.candidates.length ? 1 : 0,
    visitedNodes: Math.min(input.candidates.length, budget.maxNodes),
  };
  if (!input.candidates.length) {
    return {
      candidate: null,
      debug: {...debugBase, elapsedMs: Date.now() - startedAt, truncatedReason: "no-candidates"},
    };
  }
  const candidate = input.pickBestCandidate(input.candidates);
  const elapsedMs = Date.now() - startedAt;
  const timedOut = elapsedMs > budget.maxMs;
  return {
    candidate,
    debug: {
      ...debugBase,
      elapsedMs,
      truncatedReason: timedOut ? "timeout" : budget.maxDepth > 1 ? "not-enabled" : undefined,
    },
  };
}
