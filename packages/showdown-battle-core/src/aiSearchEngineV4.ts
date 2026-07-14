import type {
  BattleAiCapabilityProfileV4,
  BattleAiFeatureVectorV4,
  BattleAiLevelV4,
  BattleAiOutcomeBucketV4,
  BattleAiProfileV4,
  BattleAiSearchDebugV4,
  BattleServiceMoveRequestV4,
  BattleServiceRequestV4,
  BattleServiceSidePokemonV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
  TrainingModeV4,
} from "./types.js";
import type {BattleAiRoleTagSubtypeV4, BattleAiTeamRoleAnalysisV4} from "./aiTeamRoleAnalyzerV4.js";
import {evaluateBattleAiMoveV4} from "./aiMoveEvaluator.js";
import {parseShowdownChoiceCommandV4, type ShowdownSpecialChoiceV4} from "./showdownCommand.js";
import {
  evaluateBattleAiSinglesLeafValueV4,
  type BattleAiSideResourceStateV4,
  type BattleAiSinglesNumericStateForValueV4,
  type BattleAiValueBreakdownV4,
} from "./aiValueFunctionV4.js";
import {battleAiOutcomeBucketScoreV4} from "./aiOutcomeBucketsV4.js";
import {buildBattleAiSpeedFieldStateV4, buildBattleAiSpeedStateV4} from "./aiSpeedStateV4.js";

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
  capabilities?: BattleAiCapabilityProfileV4;
  roleAnalysis?: BattleAiTeamRoleAnalysisV4;
  generateCandidatesForPlayer?: (playerId: ShowdownPlayerIdV4, request: BattleServiceRequestV4) => BattleAiCandidateV4[];
};

type BattleAiNumericStateV4 = BattleAiSinglesNumericStateForValueV4;

type BattleAiCandidateOutcomeV4 = {
  choice: string;
  buckets: BattleAiOutcomeBucketV4[];
  score: number;
};

type BattleAiSwitchTargetEstimateV4 = {
  switchChoice: string;
  replyChoice: string;
  targetIdent?: string;
  estimatedDamage: number;
  koChance: number;
};

const AI_SEARCH_BUDGETS: Record<BattleAiLevelV4, BattleAiSearchBudgetV4> = {
  rookie: {maxDepth: 1, maxMs: 300, ownTopK: 3, foeTopK: 2, maxNodes: 100, maxJointActions: 4},
  normal: {maxDepth: 2, maxMs: 1_000, ownTopK: 4, foeTopK: 3, maxNodes: 300, maxJointActions: 6},
  elite: {maxDepth: 3, maxMs: 2_000, ownTopK: 4, foeTopK: 3, maxNodes: 800, maxJointActions: 8},
  gymLeader: {maxDepth: 4, maxMs: 5_000, ownTopK: 5, foeTopK: 4, maxNodes: 1_500, maxJointActions: 10},
  eliteFour: {maxDepth: 5, maxMs: 8_000, ownTopK: 5, foeTopK: 4, maxNodes: 3_000, maxJointActions: 12},
  champion: {maxDepth: 6, maxMs: 10_000, ownTopK: 6, foeTopK: 5, maxNodes: 5_000, maxJointActions: 12},
};

const AI_EFFECTIVE_DEPTH_BY_MODE: Record<TrainingModeV4, Partial<Record<BattleAiLevelV4, BattleAiSearchBudgetV4["maxDepth"]>>> = {
  singles: {
    gymLeader: 2,
    eliteFour: 4,
    champion: 6,
  },
  doubles: {
    gymLeader: 1,
    eliteFour: 2,
    champion: 3,
  },
  coop: {
    gymLeader: 1,
    eliteFour: 2,
    champion: 3,
  },
};

const AI_CAPABILITY_PROFILES: Record<BattleAiLevelV4, BattleAiCapabilityProfileV4> = {
  rookie: {
    useMinimax: false,
    useRoleAnalysis: false,
    useOutcomeBuckets: false,
    useSwitchValue: false,
    useDynamicDepth: false,
    useOpponentSwitchReply: false,
    riskTolerance: 0.8,
  },
  normal: {
    useMinimax: false,
    useRoleAnalysis: false,
    useOutcomeBuckets: false,
    useSwitchValue: false,
    useDynamicDepth: false,
    useOpponentSwitchReply: false,
    riskTolerance: 0.55,
  },
  elite: {
    useMinimax: false,
    useRoleAnalysis: false,
    useOutcomeBuckets: false,
    useSwitchValue: false,
    useDynamicDepth: false,
    useOpponentSwitchReply: false,
    riskTolerance: 0.35,
  },
  gymLeader: {
    useMinimax: true,
    useRoleAnalysis: true,
    useOutcomeBuckets: true,
    useSwitchValue: true,
    useDynamicDepth: false,
    useOpponentSwitchReply: true,
    riskTolerance: 0.22,
  },
  eliteFour: {
    useMinimax: true,
    useRoleAnalysis: true,
    useOutcomeBuckets: true,
    useSwitchValue: true,
    useDynamicDepth: true,
    useOpponentSwitchReply: true,
    riskTolerance: 0.16,
  },
  champion: {
    useMinimax: true,
    useRoleAnalysis: true,
    useOutcomeBuckets: true,
    useSwitchValue: true,
    useDynamicDepth: true,
    useOpponentSwitchReply: true,
    riskTolerance: 0.1,
  },
};

export function battleAiCapabilityForLevelV4(level: BattleAiLevelV4): BattleAiCapabilityProfileV4 {
  return {...AI_CAPABILITY_PROFILES[level]};
}

export function battleAiSearchBudgetForLevelV4(level: BattleAiLevelV4, timeBudgetMs?: number): BattleAiSearchBudgetV4 {
  const budget = AI_SEARCH_BUDGETS[level];
  return {
    ...budget,
    maxMs: Math.max(0, Math.min(budget.maxMs, timeBudgetMs ?? budget.maxMs)),
  };
}

export function battleAiEffectiveSearchBudgetForModeV4(level: BattleAiLevelV4, mode: TrainingModeV4 | undefined, timeBudgetMs?: number): BattleAiSearchBudgetV4 {
  const budget = battleAiSearchBudgetForLevelV4(level, timeBudgetMs);
  const effectiveDepth = mode ? AI_EFFECTIVE_DEPTH_BY_MODE[mode]?.[level] : undefined;
  return {
    ...budget,
    maxDepth: effectiveDepth ?? (level === "rookie" || level === "normal" || level === "elite" ? 1 : budget.maxDepth),
  };
}

export function chooseBattleAiActionBySearchV4(input: BattleAiSearchInputV4): BattleAiSearchResultV4 {
  const startedAt = Date.now();
  const budget = battleAiEffectiveSearchBudgetForModeV4(input.profile.level, input.snapshot?.mode, input.timeBudgetMs);
  const capabilities = input.capabilities || battleAiCapabilityForLevelV4(input.profile.level);
  const debugBase = {
    strategy: "numeric-guard" as const,
    maxDepth: budget.maxDepth,
    searchedDepth: input.candidates.length ? 1 : 0,
    visitedNodes: Math.min(input.candidates.length, budget.maxNodes),
    capabilities,
  };
  if (!input.candidates.length) {
    return {
      candidate: null,
      debug: {...debugBase, elapsedMs: Date.now() - startedAt, truncatedReason: "no-candidates", candidateCount: 0},
    };
  }
  if (canRunSinglesDepth2(input, budget, capabilities)) {
    const result = searchSinglesDepth2(input, budget, capabilities, startedAt);
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

function canRunSinglesDepth2(input: BattleAiSearchInputV4, budget: BattleAiSearchBudgetV4, capabilities: BattleAiCapabilityProfileV4): boolean {
  return Boolean(
    capabilities.useMinimax &&
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

function searchSinglesDepth2(
  input: BattleAiSearchInputV4,
  budget: BattleAiSearchBudgetV4,
  capabilities: BattleAiCapabilityProfileV4,
  startedAt: number,
): BattleAiSearchResultV4 | null {
  const request = input.request!;
  const snapshot = input.snapshot!;
  const playerId = input.playerId!;
  const state = buildSinglesNumericState(snapshot, playerId, input.roleAnalysis);
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
  const ownOutcomes = capabilities.useOutcomeBuckets
    ? ownCandidates.map(candidate => outcomeForOwnCandidate(input, state, candidate))
    : [];
  let visitedNodes = 0;
  let best: {candidate: BattleAiCandidateV4; reply: BattleAiCandidateV4; leafScore: number; breakdown: BattleAiValueBreakdownV4; buckets: BattleAiOutcomeBucketV4[]} | null = null;
  let truncatedReason: BattleAiSearchDebugV4["truncatedReason"];
  const targetOverrideEstimates: BattleAiSwitchTargetEstimateV4[] = [];
  const searchedOutcomes: BattleAiCandidateOutcomeV4[] = [];

  for (const [index, candidate] of ownCandidates.entries()) {
    if (Date.now() - startedAt > budget.maxMs) {
      truncatedReason = "timeout";
      break;
    }
    const ownOutcome = ownOutcomes[index] || {choice: candidate.choice, buckets: [], score: 0};
    const afterSelf = applyOwnCandidateState(state, candidate, input);
    let worstReply: BattleAiCandidateV4 | null = null;
    let worstLeaf = Number.POSITIVE_INFINITY;
    let worstState = afterSelf;
    let worstBuckets: BattleAiOutcomeBucketV4[] = ownOutcome.buckets;
    if (afterSelf.foe.fainted) {
      worstReply = foeCandidates[0] || null;
      const leaf = scoreSinglesLeafState(afterSelf, candidate, worstReply || candidate, input, state, ownOutcome.buckets, capabilities);
      worstLeaf = leaf.score;
      worstBuckets = ownOutcome.buckets;
    }
    for (const reply of foeCandidates) {
      if (afterSelf.foe.fainted) break;
      visitedNodes += 1;
      if (visitedNodes >= budget.maxNodes) {
        truncatedReason = "max-nodes";
        break;
      }
      if (Date.now() - startedAt > budget.maxMs) {
        truncatedReason = "timeout";
        break;
      }
      const replyResult = applyFoeReplyState(afterSelf, reply, candidate, input, foePlayerId, foeRequest);
      const afterReply = replyResult.state;
      if (replyResult.targetOverrideEstimate && targetOverrideEstimates.length < 12) {
        targetOverrideEstimates.push(replyResult.targetOverrideEstimate);
      }
      const replyBuckets = capabilities.useOutcomeBuckets ? outcomeForReply(state, afterSelf, afterReply, candidate, reply, replyResult.targetOverrideEstimate) : [];
      const buckets = uniqueBuckets([...ownOutcome.buckets, ...replyBuckets]);
      const leaf = scoreSinglesLeafState(afterReply, candidate, reply, input, state, buckets, capabilities);
      const leafScore = leaf.score;
      if (leafScore < worstLeaf) {
        worstLeaf = leafScore;
        worstReply = reply;
        worstState = afterReply;
        worstBuckets = buckets;
      }
    }
    if (worstReply && (!best || worstLeaf > best.leafScore)) {
      const leaf = scoreSinglesLeafState(worstState, candidate, worstReply, input, state, worstBuckets, capabilities);
      searchedOutcomes.push({choice: candidate.choice, buckets: worstBuckets, score: battleAiOutcomeBucketScoreV4(worstBuckets)});
      best = {candidate, reply: worstReply, leafScore: worstLeaf, breakdown: leaf.breakdown, buckets: worstBuckets};
    } else if (worstReply) {
      searchedOutcomes.push({choice: candidate.choice, buckets: worstBuckets, score: battleAiOutcomeBucketScoreV4(worstBuckets)});
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
      capabilities,
      leafScore: roundSearchScore(best.leafScore),
      valueBreakdown: roundValueBreakdown(best.breakdown),
      principalVariation: [
        {role: "self", choice: best.candidate.choice, score: roundSearchScore(best.candidate.score)},
        {role: "foe", choice: best.reply.choice, score: roundSearchScore(best.reply.score)},
      ],
      outcomeBuckets: capabilities.useOutcomeBuckets
        ? debugOutcomeBuckets([
            ...ownOutcomes,
            ...searchedOutcomes,
          ])
        : undefined,
      targetOverrideEstimates: targetOverrideEstimates.length
        ? targetOverrideEstimates.map(estimate => ({
            ...estimate,
            estimatedDamage: roundSearchScore(estimate.estimatedDamage),
            koChance: roundSearchScore(estimate.koChance),
          }))
        : undefined,
    },
  };
}

function buildSinglesNumericState(snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4, roleAnalysis?: BattleAiTeamRoleAnalysisV4): BattleAiNumericStateV4 | null {
  const self = snapshot.active.find(active => active.playerId === playerId && !active.fainted);
  const foe = snapshot.active.find(active => active.playerId !== playerId && !active.fainted);
  if (!self || !foe) return null;
  const selfRow = activeSideRow(snapshot.requests[playerId], self);
  const foeRow = activeSideRow(snapshot.requests[foe.playerId], foe);
  const fieldSpeed = buildBattleAiSpeedFieldStateV4(snapshot);
  const selfSpeed = buildBattleAiSpeedStateV4({snapshot, playerId, active: self, row: selfRow});
  const foeSpeed = buildBattleAiSpeedStateV4({snapshot, playerId: foe.playerId, active: foe, row: foeRow});
  const selfPokemon = {
    playerId: self.playerId,
    activeIndex: 0,
    hp: Math.max(0, self.hp || hpFromCondition(self.condition)),
    maxHp: Math.max(1, self.maxHp || maxHpFromCondition(self.condition)),
    fainted: self.fainted,
    speciesId: selfSpeed.speciesId,
    types: selfSpeed.types,
    item: selfSpeed.item,
    ability: selfSpeed.ability,
    status: selfSpeed.status || self.status || undefined,
    stats: selfSpeed.stats,
    estimatedStats: selfSpeed.estimatedStats,
    speed: selfSpeed,
  };
  const foePokemon = {
    playerId: foe.playerId,
    activeIndex: 0,
    hp: Math.max(0, foe.hp || hpFromCondition(foe.condition)),
    maxHp: Math.max(1, foe.maxHp || maxHpFromCondition(foe.condition)),
    fainted: foe.fainted,
    speciesId: foeSpeed.speciesId,
    types: foeSpeed.types,
    item: foeSpeed.item,
    ability: foeSpeed.ability,
    status: foeSpeed.status || foe.status || undefined,
    stats: foeSpeed.stats,
    estimatedStats: foeSpeed.estimatedStats,
    speed: foeSpeed,
  };
  return {
    self: selfPokemon,
    foe: foePokemon,
    selfResources: buildSideResourceState(snapshot, playerId, selfPokemon, roleAnalysis),
    foeResources: buildSideResourceState(snapshot, foe.playerId, foePokemon),
    fieldSpeed,
  };
}

function activeSideRow(request: BattleServiceRequestV4 | undefined, active: {ident: string; species: string; details: string}): BattleServiceSidePokemonV4 | undefined {
  const rows = request?.side?.pokemon || [];
  return rows.find(row => row.active) ||
    rows.find(row => normalizeId(row.ident) === normalizeId(active.ident)) ||
    rows.find(row => normalizeId(row.details.split(",")[0] || "") === normalizeId(active.species || active.details.split(",")[0] || ""));
}

function buildSideResourceState(
  snapshot: BattleServiceSnapshotV4,
  playerId: ShowdownPlayerIdV4,
  activePokemon: BattleAiNumericStateV4["self"],
  roleAnalysis?: BattleAiTeamRoleAnalysisV4,
): BattleAiSideResourceStateV4 {
  const rows = snapshot.requests[playerId]?.side?.pokemon?.length
    ? snapshot.requests[playerId]!.side!.pokemon
    : snapshot.debug.latestSidePokemon?.[playerId] || [];
  const normalizedRows = rows.length ? rows : [{
    ident: `${playerId}: active`,
    details: "",
    condition: `${activePokemon.hp}/${activePokemon.maxHp}`,
    active: true,
    fainted: activePokemon.fainted,
  }];
  const totalPokemonCount = Math.max(1, normalizedRows.length);
  let aliveCount = 0;
  let faintedCount = 0;
  let lowHpCount = 0;
  let totalRatio = 0;
  let benchRatioSum = 0;
  let benchCount = 0;
  let activeHpRatio = hpRatio(activePokemon);
  let winConditionAlive = false;
  let winConditionHealthy = false;
  let activeIsWinCondition = false;
  for (const [rowIndex, row] of normalizedRows.entries()) {
    const fainted = Boolean(row.fainted || row.condition.includes("fnt"));
    const ratio = fainted ? 0 : hpRatioFromCondition(row.condition);
    totalRatio += ratio;
    if (fainted) {
      faintedCount += 1;
    } else {
      aliveCount += 1;
      if (ratio <= 0.3) lowHpCount += 1;
    }
    if (row.active) activeHpRatio = ratio;
    if (!row.active) {
      benchRatioSum += ratio;
      benchCount += 1;
    }
    const roleEntry = roleAnalysis ? Object.values(roleAnalysis.pokemon).find(entry => entry.rowIndex === rowIndex) : undefined;
    const winCondition = roleEntry ? isWinCondition(roleEntry) : false;
    if (winCondition && !fainted) {
      winConditionAlive = true;
      if (ratio >= 0.45) winConditionHealthy = true;
    }
    if (winCondition && row.active) activeIsWinCondition = true;
  }
  return {
    totalPokemonCount,
    aliveCount,
    faintedCount,
    lowHpCount,
    totalHpRatio: totalRatio / totalPokemonCount,
    activeHpRatio,
    benchHpRatio: benchCount ? benchRatioSum / benchCount : 0,
    winConditionAlive,
    winConditionHealthy,
    activeIsWinCondition,
    hazards: {
      stealthRock: sideHazardLayers(snapshot, playerId, "stealthrock"),
      spikes: sideHazardLayers(snapshot, playerId, "spikes"),
      toxicSpikes: sideHazardLayers(snapshot, playerId, "toxicspikes"),
      stickyWeb: sideHazardLayers(snapshot, playerId, "stickyweb"),
    },
  };
}

function applyOwnCandidateState(state: BattleAiNumericStateV4, candidate: BattleAiCandidateV4, input: BattleAiSearchInputV4): BattleAiNumericStateV4 {
  const switchRow = pokemonRowForSwitchCandidate(input.request, candidate);
  if (switchRow) {
    const hp = hpFromCondition(switchRow.condition);
    const maxHp = maxHpFromCondition(switchRow.condition);
    const speed = input.snapshot && input.playerId
      ? buildBattleAiSpeedStateV4({snapshot: input.snapshot, playerId: input.playerId, row: switchRow})
      : state.self.speed;
    const self = {
      ...state.self,
      hp: Math.max(0, hp),
      maxHp: Math.max(1, maxHp),
      fainted: Boolean(switchRow.fainted || switchRow.condition.includes("fnt") || hp <= 0),
      speciesId: speed?.speciesId,
      types: speed?.types,
      item: speed?.item,
      ability: speed?.ability,
      status: speed?.status,
      stats: speed?.stats,
      estimatedStats: speed?.estimatedStats,
      speed,
    };
    return {
      ...state,
      self,
      foe: state.foe,
      selfResources: updateResourceForSwitch(state.selfResources, self, input.roleAnalysis, candidate),
    };
  }
  return applyCandidateDamage(state, candidate, "self");
}

function applyFoeReplyState(
  state: BattleAiNumericStateV4,
  reply: BattleAiCandidateV4,
  own: BattleAiCandidateV4,
  input: BattleAiSearchInputV4,
  foePlayerId: ShowdownPlayerIdV4,
  foeRequest: BattleServiceRequestV4,
): {state: BattleAiNumericStateV4; targetOverrideEstimate?: BattleAiSwitchTargetEstimateV4} {
  const targetOverrideEstimate = evaluateReplyAgainstSwitchTarget(input, foePlayerId, foeRequest, own, reply);
  if (!targetOverrideEstimate) {
    return {state: applyCandidateDamage(state, reply, "foe")};
  }
  const hp = Math.max(0, state.self.hp - targetOverrideEstimate.estimatedDamage);
  return {
    state: {
      ...state,
      self: {...state.self, hp, fainted: hp <= 0},
      foe: state.foe,
      selfResources: updateResourceForActiveDamage(state.selfResources, state.self, {...state.self, hp, fainted: hp <= 0}),
    },
    targetOverrideEstimate,
  };
}

function evaluateReplyAgainstSwitchTarget(
  input: BattleAiSearchInputV4,
  foePlayerId: ShowdownPlayerIdV4,
  foeRequest: BattleServiceRequestV4,
  own: BattleAiCandidateV4,
  reply: BattleAiCandidateV4,
): BattleAiSwitchTargetEstimateV4 | undefined {
  const switchRow = pokemonRowForSwitchCandidate(input.request, own);
  if (!switchRow || !input.snapshot || !input.playerId || reply.kind !== "move") return undefined;
  const parsedReply = parseShowdownChoiceCommandV4(reply.choice);
  if (!parsedReply || parsedReply.kind !== "move") return undefined;
  const move = moveRequestForParsedReply(foeRequest, parsedReply.index, parsedReply.special);
  if (!move) return undefined;
  const evaluation = evaluateBattleAiMoveV4({
    request: foeRequest,
    snapshot: input.snapshot,
    playerId: foePlayerId,
    activeIndex: 0,
    move,
    targetLoc: parsedReply.target,
    special: parsedReply.special,
    targetOverride: {playerId: input.playerId, row: switchRow, activeIndex: 0},
  });
  const category = String(evaluation.diagnostics.category || "");
  if (category === "status" || evaluation.expectedDamageRange.average <= 0) return undefined;
  return {
    switchChoice: own.choice,
    replyChoice: reply.choice,
    targetIdent: switchRow.ident,
    estimatedDamage: Math.max(0, evaluation.expectedDamageRange.average),
    koChance: Math.max(0, Math.min(1, evaluation.koChance)),
  };
}

function moveRequestForParsedReply(
  request: BattleServiceRequestV4,
  moveIndex: number,
  special: ShowdownSpecialChoiceV4 | undefined,
): BattleServiceMoveRequestV4 | undefined {
  const active = request.active?.[0];
  const index = moveIndex - 1;
  if (!active || index < 0) return undefined;
  if (special === "zmove") {
    const zMove = active.zMoves?.[index] || active.canZMove?.[index];
    if (zMove) return zMove;
  }
  if (special === "max") {
    const maxMoves = active.maxMoves;
    const maxMove = Array.isArray(maxMoves) ? maxMoves[index] : maxMoves?.maxMoves?.[index];
    if (maxMove) return maxMove;
  }
  return active.moves?.[index];
}

function pokemonRowForSwitchCandidate(request: BattleServiceRequestV4 | undefined, candidate: BattleAiCandidateV4): BattleServiceSidePokemonV4 | undefined {
  if (candidate.kind !== "switch") return undefined;
  const parsed = parseShowdownChoiceCommandV4(candidate.choice);
  if (!parsed || parsed.kind !== "switch") return undefined;
  const row = request?.side?.pokemon?.[parsed.index - 1];
  if (!row || row.active || row.fainted || row.condition.includes("fnt")) return undefined;
  return row;
}

function applyCandidateDamage(state: BattleAiNumericStateV4, candidate: BattleAiCandidateV4, actor: "self" | "foe"): BattleAiNumericStateV4 {
  const targetKey = actor === "self" ? "foe" : "self";
  const target = state[targetKey];
  const damage = expectedDamage(candidate, target.maxHp);
  const hp = Math.max(0, target.hp - damage);
  const updatedTarget = {...target, hp, fainted: hp <= 0};
  return {
    ...state,
    [targetKey]: updatedTarget,
    [`${targetKey}Resources`]: updateResourceForActiveDamage(state[`${targetKey}Resources`], target, updatedTarget),
  };
}

function updateResourceForActiveDamage(
  resources: BattleAiSideResourceStateV4 | undefined,
  before: BattleAiNumericStateV4["self"],
  after: BattleAiNumericStateV4["self"],
): BattleAiSideResourceStateV4 | undefined {
  if (!resources) return undefined;
  const beforeRatio = hpRatio(before);
  const afterRatio = hpRatio(after);
  const totalPokemonCount = Math.max(1, resources.totalPokemonCount);
  const wasLow = !before.fainted && beforeRatio <= 0.3;
  const isLow = !after.fainted && afterRatio <= 0.3;
  const faintedDelta = before.fainted === after.fainted ? 0 : after.fainted ? 1 : -1;
  return {
    ...resources,
    aliveCount: Math.max(0, resources.aliveCount - faintedDelta),
    faintedCount: Math.max(0, resources.faintedCount + faintedDelta),
    lowHpCount: Math.max(0, resources.lowHpCount + (isLow ? 1 : 0) - (wasLow ? 1 : 0)),
    totalHpRatio: clampRatio(resources.totalHpRatio + (afterRatio - beforeRatio) / totalPokemonCount),
    activeHpRatio: afterRatio,
    winConditionAlive: resources.winConditionAlive && !(resources.activeIsWinCondition && after.fainted),
    winConditionHealthy: resources.winConditionHealthy && !(resources.activeIsWinCondition && afterRatio < 0.45),
  };
}

function updateResourceForSwitch(
  resources: BattleAiSideResourceStateV4 | undefined,
  switchedIn: BattleAiNumericStateV4["self"],
  roleAnalysis: BattleAiTeamRoleAnalysisV4 | undefined,
  candidate: BattleAiCandidateV4,
): BattleAiSideResourceStateV4 | undefined {
  if (!resources) return undefined;
  const target = roleAnalysis ? pokemonForSwitchCandidate(roleAnalysis, candidate) : null;
  const activeIsWinCondition = Boolean(target && isWinCondition(target));
  return {
    ...resources,
    activeHpRatio: hpRatio(switchedIn),
    activeIsWinCondition,
    winConditionHealthy: resources.winConditionHealthy || activeIsWinCondition && hpRatio(switchedIn) >= 0.45,
  };
}

function scoreSinglesLeafState(
  state: BattleAiNumericStateV4,
  own: BattleAiCandidateV4,
  foe: BattleAiCandidateV4,
  input: BattleAiSearchInputV4,
  initialState: BattleAiNumericStateV4,
  buckets: BattleAiOutcomeBucketV4[],
  capabilities: BattleAiCapabilityProfileV4,
): {score: number; breakdown: BattleAiValueBreakdownV4} {
  return evaluateBattleAiSinglesLeafValueV4({
    state,
    own,
    foe,
    initialState,
    buckets,
    capabilities,
    roleAnalysis: input.roleAnalysis,
    currentWeather: currentWeather(input.snapshot),
  });
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

function outcomeForOwnCandidate(
  input: BattleAiSearchInputV4,
  state: BattleAiNumericStateV4,
  candidate: BattleAiCandidateV4,
): BattleAiCandidateOutcomeV4 {
  const buckets: BattleAiOutcomeBucketV4[] = [];
  const damage = expectedDamage(candidate, state.foe.maxHp);
  const koChance = candidateKoChance(candidate);
  const moveId = candidateMoveId(candidate);
  const weatherMove = weatherSubtypeFromMove(moveId);
  const analysis = input.roleAnalysis;
  const weather = currentWeather(input.snapshot);

  if (koChance >= 1 || damage >= state.foe.hp) {
    buckets.push("ko");
  } else if (koChance > 0 || damage >= state.foe.hp * 0.65 || damage / Math.max(1, state.foe.maxHp) >= 0.45) {
    buckets.push("threaten-ko");
  }
  if (weatherMove) {
    buckets.push("setup-weather");
    if (analysis && teamHasHealthyAbuser(analysis, weatherMove)) buckets.push("enable-wincon");
  }
  if (isHazardMove(moveId) && hazardCanProgress(input, moveId)) buckets.push("hazard-progress");
  if (isStatusProgressMove(moveId)) buckets.push("status-progress");

  if (analysis && candidate.kind === "switch") {
    const target = pokemonForSwitchCandidate(analysis, candidate);
    if (activeIsWinCondition(analysis) && state.self.hp / Math.max(1, state.self.maxHp) < 0.45) {
      buckets.push("preserve-wincon");
    }
    if (target && target.hpRatio > 0.45 && (isWinCondition(target) || weather && hasTag(target, "weather-abuser", weather))) {
      buckets.push("enable-wincon");
    }
  }
  return {choice: candidate.choice, buckets: uniqueBuckets(buckets), score: battleAiOutcomeBucketScoreV4(buckets)};
}

function outcomeForReply(
  initialState: BattleAiNumericStateV4,
  afterSelf: BattleAiNumericStateV4,
  afterReply: BattleAiNumericStateV4,
  own: BattleAiCandidateV4,
  reply: BattleAiCandidateV4,
  targetOverrideEstimate?: BattleAiSwitchTargetEstimateV4,
): BattleAiOutcomeBucketV4[] {
  const buckets: BattleAiOutcomeBucketV4[] = [];
  if (afterSelf.foe.fainted) return buckets;
  const replyDamage = Math.max(0, afterSelf.self.hp - afterReply.self.hp);
  const replyDamageRatio = replyDamage / Math.max(1, afterSelf.self.maxHp || initialState.self.maxHp);
  const replyKoChance = targetOverrideEstimate?.koChance ?? candidateKoChance(reply);
  if (afterReply.self.fainted) buckets.push("self-ko-risk");
  if (!afterSelf.foe.fainted && afterSelf.foe.hp / Math.max(1, afterSelf.foe.maxHp) <= 0.3 && (afterReply.self.fainted || replyDamageRatio >= 0.45)) {
    buckets.push("revenge-kill-risk");
  }
  if (own.kind === "switch") {
    if (!afterReply.self.fainted && replyDamageRatio <= 0.3 && replyKoChance < 1) {
      buckets.push("safe-switch");
    } else if (afterReply.self.fainted || replyDamageRatio >= 0.45 || replyKoChance >= 1) {
      buckets.push("unsafe-switch");
    }
  }
  return uniqueBuckets(buckets);
}

function debugOutcomeBuckets(outcomes: BattleAiCandidateOutcomeV4[]): BattleAiSearchDebugV4["outcomeBuckets"] {
  const byChoice = new Map<string, BattleAiCandidateOutcomeV4>();
  for (const outcome of outcomes) {
    const existing = byChoice.get(outcome.choice);
    const buckets = uniqueBuckets([...(existing?.buckets || []), ...outcome.buckets]);
    byChoice.set(outcome.choice, {choice: outcome.choice, buckets, score: battleAiOutcomeBucketScoreV4(buckets)});
  }
  return [...byChoice.values()]
    .filter(outcome => outcome.buckets.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(outcome => ({...outcome, score: roundSearchScore(outcome.score)}));
}

function uniqueBuckets(buckets: BattleAiOutcomeBucketV4[]): BattleAiOutcomeBucketV4[] {
  return [...new Set(buckets)];
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

function hpRatio(pokemon: BattleAiNumericStateV4["self"]): number {
  return pokemon.hp / Math.max(1, pokemon.maxHp);
}

function hpRatioFromCondition(condition: string): number {
  const hp = hpFromCondition(condition);
  const maxHp = maxHpFromCondition(condition);
  return maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
}

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function roundSearchScore(score: number): number {
  return Math.round(score * 100) / 100;
}

function roundValueBreakdown(breakdown: BattleAiValueBreakdownV4): BattleAiValueBreakdownV4 {
  return Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, roundSearchScore(value)]));
}

function hazardCanProgress(input: BattleAiSearchInputV4, moveId: string): boolean {
  const foePlayerId = input.playerId && input.snapshot ? opponentPlayerId(input.snapshot, input.playerId) : undefined;
  if (!foePlayerId) return true;
  const maxLayers = hazardMaxLayers(moveId);
  if (maxLayers <= 0) return false;
  const currentLayers = sideHazardLayers(input.snapshot, foePlayerId, moveId);
  if (currentLayers >= maxLayers) return false;
  const foeRequest = input.snapshot?.requests[foePlayerId];
  const aliveFoes = (foeRequest?.side?.pokemon || []).filter(row => !row.active && !row.fainted && !String(row.condition || "").includes("fnt")).length;
  return aliveFoes >= 1 || !foeRequest;
}

function opponentPlayerId(snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4): ShowdownPlayerIdV4 | undefined {
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  return snapshot.players.find(entry => entry.playerId !== playerId && entry.alliance !== player?.alliance)?.playerId;
}

function sideHazardLayers(snapshot: BattleServiceSnapshotV4 | undefined, playerId: ShowdownPlayerIdV4, moveId: string): number {
  const hazard = hazardProtocolName(moveId);
  if (!snapshot || !hazard) return 0;
  let layers = 0;
  for (const line of snapshot.rawLog || []) {
    const normalized = line.toLowerCase();
    if (normalized.includes("|-sideend|") && normalized.includes(playerId) && normalizeId(normalized).includes(hazard)) {
      layers = 0;
    }
    if (normalized.includes("|-sidestart|") && normalized.includes(playerId) && normalizeId(normalized).includes(hazard)) {
      layers = Math.min(hazardMaxLayers(moveId), layers + 1);
    }
  }
  return layers;
}

function hazardProtocolName(moveId: string): string | null {
  if (moveId === "stealthrock") return "stealthrock";
  if (moveId === "spikes") return "spikes";
  if (moveId === "toxicspikes") return "toxicspikes";
  if (moveId === "stickyweb") return "stickyweb";
  return null;
}

function hazardMaxLayers(moveId: string): number {
  if (moveId === "spikes") return 3;
  if (moveId === "toxicspikes") return 2;
  if (moveId === "stealthrock" || moveId === "stickyweb") return 1;
  return 0;
}

function isHazardMove(moveId: string): boolean {
  return hazardMaxLayers(moveId) > 0;
}

function isStatusProgressMove(moveId: string): boolean {
  return ["thunderwave", "willowisp", "toxic", "spore", "sleeppowder", "stunspore", "glare", "yawn"].includes(moveId);
}

function activeIsWinCondition(analysis: BattleAiTeamRoleAnalysisV4): boolean {
  return Object.values(analysis.pokemon).some(entry => entry.active && isWinCondition(entry));
}

function isWinCondition(pokemon: BattleAiTeamRoleAnalysisV4["pokemon"][string]): boolean {
  return pokemon.tags.some(tag => ["weather-abuser", "setup-sweeper", "revenge-killer", "priority-user"].includes(tag.kind));
}

function currentWeather(snapshot: BattleServiceSnapshotV4 | undefined): BattleAiRoleTagSubtypeV4 | undefined {
  const line = snapshot?.rawLog.slice().reverse().find(entry => entry.includes("|-weather|"))?.toLowerCase() || "";
  if (line.includes("raindance") || line.includes("rain")) return "rain";
  if (line.includes("sunnyday") || line.includes("harsh sunlight") || line.includes("sun")) return "sun";
  if (line.includes("sandstorm")) return "sand";
  if (line.includes("snow") || line.includes("hail")) return "snow";
  return undefined;
}

function weatherSubtypeFromMove(moveId: string): BattleAiRoleTagSubtypeV4 | undefined {
  if (moveId === "raindance") return "rain";
  if (moveId === "sunnyday") return "sun";
  if (moveId === "sandstorm") return "sand";
  if (moveId === "snowscape" || moveId === "hail") return "snow";
  return undefined;
}

function candidateMoveId(candidate: BattleAiCandidateV4): string {
  return String(flattenedDiagnostics(candidate.diagnostics)[0]?.moveId || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function candidateKoChance(candidate: BattleAiCandidateV4): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate.diagnostics).map(entry => Number(entry.koChance))) ?? 0;
}

function pokemonForSwitchCandidate(analysis: BattleAiTeamRoleAnalysisV4, candidate: BattleAiCandidateV4) {
  const match = candidate.choice.match(/^switch\s+(\d+)/);
  if (!match) return null;
  const rowIndex = Number(match[1]) - 1;
  return Object.values(analysis.pokemon).find(entry => entry.rowIndex === rowIndex) || null;
}

function teamHasHealthyAbuser(analysis: BattleAiTeamRoleAnalysisV4, subtype: BattleAiRoleTagSubtypeV4): boolean {
  return Object.values(analysis.pokemon).some(entry => !entry.active && !entry.fainted && entry.hpRatio > 0.35 && hasTag(entry, "weather-abuser", subtype));
}

function hasTag(
  pokemon: BattleAiTeamRoleAnalysisV4["pokemon"][string],
  kind: string,
  subtype?: BattleAiRoleTagSubtypeV4,
): boolean {
  return pokemon.tags.some(tag => tag.kind === kind && (!subtype || tag.subtype === subtype));
}

function normalizeId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
