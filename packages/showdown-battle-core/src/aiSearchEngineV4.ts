import type {
  BattleAiFeatureVectorV4,
  BattleAiLevelV4,
  BattleAiProfileV4,
  BattleAiSearchDebugV4,
  BattleServiceRequestV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
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
  request?: BattleServiceRequestV4;
  snapshot?: BattleServiceSnapshotV4;
  playerId?: ShowdownPlayerIdV4;
  generateCandidatesForPlayer?: (playerId: ShowdownPlayerIdV4, request: BattleServiceRequestV4) => BattleAiCandidateV4[];
};

type BattleAiNumericPokemonV4 = {
  playerId: ShowdownPlayerIdV4;
  activeIndex: number;
  hp: number;
  maxHp: number;
  fainted: boolean;
};

type BattleAiNumericStateV4 = {
  self: BattleAiNumericPokemonV4;
  foe: BattleAiNumericPokemonV4;
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
      debug: {...debugBase, elapsedMs: Date.now() - startedAt, truncatedReason: "no-candidates", candidateCount: 0},
    };
  }
  if (canRunSinglesDepth2(input, budget)) {
    const result = searchSinglesDepth2(input, budget, startedAt);
    if (result) return result;
  }
  const candidate = input.pickBestCandidate(input.candidates);
  const elapsedMs = Date.now() - startedAt;
  const timedOut = elapsedMs > budget.maxMs;
  return {
    candidate,
    debug: {
      ...debugBase,
      elapsedMs,
      candidateCount: input.candidates.length,
      truncatedReason: timedOut ? "timeout" : budget.maxDepth > 1 ? "not-enabled" : undefined,
    },
  };
}

function canRunSinglesDepth2(input: BattleAiSearchInputV4, budget: BattleAiSearchBudgetV4): boolean {
  return Boolean(
    budget.maxDepth >= 2 &&
    input.request &&
    input.snapshot &&
    input.playerId &&
    input.generateCandidatesForPlayer &&
    input.snapshot.mode === "singles" &&
    input.request.active?.length === 1 &&
    !input.request.teamPreview &&
    !input.request.forceSwitch?.some(Boolean),
  );
}

function searchSinglesDepth2(input: BattleAiSearchInputV4, budget: BattleAiSearchBudgetV4, startedAt: number): BattleAiSearchResultV4 | null {
  const request = input.request!;
  const snapshot = input.snapshot!;
  const playerId = input.playerId!;
  const state = buildSinglesNumericState(snapshot, playerId);
  const foePlayerId = state?.foe.playerId;
  const foeRequest = foePlayerId ? snapshot.requests[foePlayerId] : undefined;
  if (!state || !foePlayerId || !foeRequest || foeRequest.active?.length !== 1 || foeRequest.teamPreview || foeRequest.forceSwitch?.some(Boolean)) {
    return null;
  }
  const foeCandidates = input.generateCandidatesForPlayer!(foePlayerId, foeRequest)
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, budget.foeTopK);
  if (!foeCandidates.length) return null;

  const ownCandidates = input.candidates
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, budget.ownTopK);
  let visitedNodes = 0;
  let best: {candidate: BattleAiCandidateV4; reply: BattleAiCandidateV4; leafScore: number} | null = null;
  let truncatedReason: BattleAiSearchDebugV4["truncatedReason"];

  for (const candidate of ownCandidates) {
    if (Date.now() - startedAt > budget.maxMs) {
      truncatedReason = "timeout";
      break;
    }
    const afterSelf = applyCandidateDamage(state, candidate, "self");
    let worstReply: BattleAiCandidateV4 | null = null;
    let worstLeaf = Number.POSITIVE_INFINITY;
    for (const reply of foeCandidates) {
      visitedNodes += 1;
      if (visitedNodes >= budget.maxNodes) {
        truncatedReason = "max-nodes";
        break;
      }
      if (Date.now() - startedAt > budget.maxMs) {
        truncatedReason = "timeout";
        break;
      }
      const afterReply = applyCandidateDamage(afterSelf, reply, "foe");
      const leafScore = scoreSinglesLeafState(afterReply, candidate, reply);
      if (leafScore < worstLeaf) {
        worstLeaf = leafScore;
        worstReply = reply;
      }
    }
    if (worstReply && (!best || worstLeaf > best.leafScore)) {
      best = {candidate, reply: worstReply, leafScore: worstLeaf};
    }
    if (truncatedReason) break;
  }

  if (!best) return null;
  const elapsedMs = Date.now() - startedAt;
  return {
    candidate: best.candidate,
    debug: {
      strategy: "minimax",
      maxDepth: budget.maxDepth,
      searchedDepth: 2,
      visitedNodes,
      elapsedMs,
      truncatedReason,
      candidateCount: ownCandidates.length,
      replyCount: foeCandidates.length,
      leafScore: roundSearchScore(best.leafScore),
      principalVariation: [
        {role: "self", choice: best.candidate.choice, score: roundSearchScore(best.candidate.score)},
        {role: "foe", choice: best.reply.choice, score: roundSearchScore(best.reply.score)},
      ],
    },
  };
}

function buildSinglesNumericState(snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4): BattleAiNumericStateV4 | null {
  const self = snapshot.active.find(active => active.playerId === playerId && !active.fainted);
  const foe = snapshot.active.find(active => active.playerId !== playerId && !active.fainted);
  if (!self || !foe) return null;
  return {
    self: {
      playerId: self.playerId,
      activeIndex: 0,
      hp: Math.max(0, self.hp || hpFromCondition(self.condition)),
      maxHp: Math.max(1, self.maxHp || maxHpFromCondition(self.condition)),
      fainted: self.fainted,
    },
    foe: {
      playerId: foe.playerId,
      activeIndex: 0,
      hp: Math.max(0, foe.hp || hpFromCondition(foe.condition)),
      maxHp: Math.max(1, foe.maxHp || maxHpFromCondition(foe.condition)),
      fainted: foe.fainted,
    },
  };
}

function applyCandidateDamage(state: BattleAiNumericStateV4, candidate: BattleAiCandidateV4, actor: "self" | "foe"): BattleAiNumericStateV4 {
  const targetKey = actor === "self" ? "foe" : "self";
  const target = state[targetKey];
  const damage = expectedDamage(candidate, target.maxHp);
  const hp = Math.max(0, target.hp - damage);
  return {
    self: state.self,
    foe: state.foe,
    [targetKey]: {...target, hp, fainted: hp <= 0},
  };
}

function scoreSinglesLeafState(state: BattleAiNumericStateV4, own: BattleAiCandidateV4, foe: BattleAiCandidateV4): number {
  const selfRatio = state.self.hp / Math.max(1, state.self.maxHp);
  const foeRatio = state.foe.hp / Math.max(1, state.foe.maxHp);
  const koSwing = (state.foe.fainted ? 140 : 0) - (state.self.fainted ? 170 : 0);
  return selfRatio * 120 - foeRatio * 120 + koSwing + own.score * 0.12 - foe.score * 0.04;
}

function expectedDamage(candidate: BattleAiCandidateV4, targetMaxHp: number): number {
  const diagnostics = flattenedDiagnostics(candidate.diagnostics);
  const directAverage = firstFiniteNumber(diagnostics.map(entry => nestedNumber(entry, ["expectedDamageRange", "average"])));
  if (directAverage !== null) return directAverage;
  const ratio = firstFiniteNumber(diagnostics.map(entry => Number(entry.expectedDamageRatio)));
  if (ratio !== null) return Math.max(0, ratio * targetMaxHp);
  const koChance = firstFiniteNumber(diagnostics.map(entry => Number(entry.koChance)));
  if (koChance !== null && koChance >= 1) return targetMaxHp;
  return Math.max(0, candidate.features.damage || 0);
}

function flattenedDiagnostics(diagnostics: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!diagnostics) return [];
  if (Array.isArray(diagnostics.parts)) {
    return diagnostics.parts.flatMap(part => flattenedDiagnostics(isRecord(part) ? part : undefined));
  }
  return [diagnostics];
}

function nestedNumber(entry: Record<string, unknown>, path: string[]): number {
  let value: unknown = entry;
  for (const key of path) {
    if (!isRecord(value)) return Number.NaN;
    value = value[key];
  }
  return Number(value);
}

function firstFiniteNumber(values: number[]): number | null {
  for (const value of values) {
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function hpFromCondition(condition: string): number {
  const [hp] = condition.split("/");
  return Number(hp) || 0;
}

function maxHpFromCondition(condition: string): number {
  const [, maxHp] = condition.split("/");
  return Number(maxHp) || 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function roundSearchScore(score: number): number {
  return Math.round(score * 100) / 100;
}
