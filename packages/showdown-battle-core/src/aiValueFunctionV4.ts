import type {
  BattleAiCapabilityProfileV4,
  BattleAiOutcomeBucketV4,
  ShowdownPlayerIdV4,
} from "./types.js";
import {createShowdownDexService, toDexId} from "@changebattle-v2/showdown-dex-core";
import type {BattleAiRoleTagSubtypeV4, BattleAiTeamRoleAnalysisV4} from "./aiTeamRoleAnalyzerV4.js";
import {battleAiActsBeforeBySpeedV4, type BattleAiSpeedFieldStateV4, type BattleAiSpeedStateV4} from "./aiSpeedStateV4.js";
import {
  battleAiDamageBucketForEstimateV4,
  battleAiDamageBucketScoreV4,
  battleAiOutcomeBucketScoreV4,
  type BattleAiDamageBucketV4,
} from "./aiOutcomeBucketsV4.js";
import type {BattleAiStrategicContextV4} from "./aiStrategicContextV4.js";

export type BattleAiValueCandidateV4 = {
  choice: string;
  score: number;
  kind: string;
  diagnostics?: Record<string, unknown>;
};

export type BattleAiNumericPokemonForValueV4 = {
  playerId: ShowdownPlayerIdV4;
  activeIndex: number;
  hp: number;
  maxHp: number;
  fainted: boolean;
  speciesId?: string;
  types?: string[];
  item?: string;
  ability?: string;
  status?: string;
  stats?: Record<string, number>;
  estimatedStats?: boolean;
  speed?: BattleAiSpeedStateV4;
};

export type BattleAiHazardLayerStateV4 = {
  stealthRock: number;
  spikes: number;
  toxicSpikes: number;
  stickyWeb: number;
};

export type BattleAiSideResourceStateV4 = {
  totalPokemonCount: number;
  aliveCount: number;
  faintedCount: number;
  lowHpCount: number;
  totalHpRatio: number;
  activeHpRatio: number;
  benchHpRatio: number;
  winConditionAlive: boolean;
  winConditionHealthy: boolean;
  activeIsWinCondition: boolean;
  hazards: BattleAiHazardLayerStateV4;
};

export type BattleAiSinglesNumericStateForValueV4 = {
  self: BattleAiNumericPokemonForValueV4;
  foe: BattleAiNumericPokemonForValueV4;
  selfResources?: BattleAiSideResourceStateV4;
  foeResources?: BattleAiSideResourceStateV4;
  fieldSpeed?: BattleAiSpeedFieldStateV4;
};

export type BattleAiValueBreakdownV4 = Record<string, number>;

export type BattleAiSinglesLeafValueInputV4 = {
  state: BattleAiSinglesNumericStateForValueV4;
  own: BattleAiValueCandidateV4;
  foe: BattleAiValueCandidateV4;
  initialState: BattleAiSinglesNumericStateForValueV4;
  buckets: BattleAiOutcomeBucketV4[];
  capabilities: BattleAiCapabilityProfileV4;
  roleAnalysis?: BattleAiTeamRoleAnalysisV4;
  currentWeather?: BattleAiRoleTagSubtypeV4;
  strategicContext?: BattleAiStrategicContextV4;
};

export type BattleAiSinglesLeafValueResultV4 = {
  score: number;
  breakdown: BattleAiValueBreakdownV4;
};

const DEFAULT_DEX = createShowdownDexService();
const PROTECT_MOVES = new Set(["protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "silktrap", "burningbulwark"]);
const RECOVERY_MOVES = new Set(["recover", "roost", "slackoff", "moonlight", "synthesis", "softboiled", "milkdrink", "wish", "shoreup"]);
const SETUP_MOVES = new Set(["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "quiverdance", "shellsmash", "growth", "coil"]);
const WEATHER_MOVES = new Set(["raindance", "sunnyday", "sandstorm", "snowscape", "hail"]);
const TERRAIN_MOVES = new Set(["electricterrain", "grassyterrain", "psychicterrain", "mistyterrain"]);
const SPEED_FIELD_MOVES = new Set(["tailwind", "trickroom", "icywind", "electroweb", "stringshot"]);

export function evaluateBattleAiSinglesLeafValueV4(input: BattleAiSinglesLeafValueInputV4): BattleAiSinglesLeafValueResultV4 {
  const selfRatio = hpRatio(input.state.self);
  const foeRatio = hpRatio(input.state.foe);
  const selfResources = input.state.selfResources;
  const foeResources = input.state.foeResources;
  const initialSelfResources = input.initialState.selfResources;
  const initialFoeResources = input.initialState.foeResources;
  const activeHp = selfRatio * 120 - foeRatio * 120;
  const koSwing = (input.state.foe.fainted ? 140 : 0) - (input.state.self.fainted ? 170 : 0);
  const candidateTieBreak = input.own.score * 0.12 - input.foe.score * 0.04;
  const bucket = input.capabilities.useOutcomeBuckets ? battleAiOutcomeBucketScoreV4(input.buckets) : 0;
  const role = input.capabilities.useSwitchValue ? roleValueBonus(input) : 0;
  const teamHp = resourceRatio(selfResources?.totalHpRatio) * 52 - resourceRatio(foeResources?.totalHpRatio) * 52;
  const alive = ((selfResources?.aliveCount || 0) - (foeResources?.aliveCount || 0)) * 18;
  const lowHpPressure = (foeResources?.lowHpCount || 0) * 10 - (selfResources?.lowHpCount || 0) * 8;
  const winCondition = winConditionValue(input);
  const hazard = hazardValue(input, initialSelfResources, initialFoeResources);
  const speed = speedValue(input);
  const field = fieldValue(input);
  const risk = riskValue(input);
  const threat = threatValue(input);
  const specialMove = specialMoveValue(input);
  const stability = stabilityValue(input);
  const strategic = strategicValue(input);
  const breakdown = {
    activeHp,
    teamHp,
    alive,
    lowHpPressure,
    koSwing,
    bucket,
    role,
    winCondition,
    hazard,
    speed,
    field,
    risk,
    threat,
    specialMove,
    stability,
    strategic,
    candidateTieBreak,
  };
  return {
    score: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
  };
}

function strategicValue(input: BattleAiSinglesLeafValueInputV4): number {
  const context = input.strategicContext;
  if (!context) return 0;
  const currentThreat = context.currentFoeThreat;
  const ownDamage = expectedDamageRatio(input.own);
  const ownKo = candidateKoChance(input.own) >= 1 || input.state.foe.fainted || input.buckets.includes("ko");
  const foeDamage = expectedDamageRatio(input.foe);
  const foeStableKo = input.state.self.fainted || input.buckets.includes("self-ko-risk") || candidateKoChance(input.foe) >= 1 && candidateAccuracy(input.foe) >= 90;
  const specialTags = candidateSpecialSystemTags(input.own);
  let value = 0;

  if (currentThreat?.active) {
    const threatScale = Math.max(0.75, Math.min(1.5, currentThreat.score / 48));
    if (ownKo) value += 24 * threatScale;
    else if (ownDamage >= 0.55 || input.buckets.includes("threaten-ko")) value += 11 * threatScale;
  }
  if (currentThreat && !currentThreat.active && context.foeThreats[0]?.ident === currentThreat.ident && ownKo && input.initialState.foeResources?.aliveCount && input.initialState.foeResources.aliveCount > 1) {
    value -= 4;
  }

  if (input.initialState.selfResources?.activeIsWinCondition) {
    if (foeStableKo && !ownKo && input.own.kind !== "switch") value -= 26;
    if (input.own.kind === "switch" && input.buckets.includes("safe-switch")) value += 14;
  }
  if (input.state.selfResources?.winConditionHealthy) value += 8;
  if (input.initialState.selfResources?.winConditionHealthy && !input.state.selfResources?.winConditionHealthy) value -= 14;

  if (specialTags.includes("dynamax")) {
    const clearDynamaxValue = ownKo ||
      specialTags.includes("dynamax-survival") && (foeStableKo || foeDamage >= 0.55) ||
      specialTags.some(tag => ["max-speed", "max-weather", "max-defense-boost", "max-special-defense-boost", "gmax-aurora-veil", "gmax-residual", "gmax-hazard", "gmax-ignore-protect"].includes(tag));
    if (clearDynamaxValue) {
      value += 12;
    } else if (context.resourceAdvice.holdDynamax) {
      value -= 24;
    }
  }
  if (specialTags.includes("terastallize")) {
    const clearTeraValue = ownKo ||
      specialTags.includes("tera-defensive") && (foeStableKo || foeDamage >= 0.45) ||
      specialTags.includes("tera-wincon") && ownDamage >= 0.45 ||
      specialTags.includes("tera-offense") && ownDamage >= 0.65;
    if (clearTeraValue) {
      value += 10;
    } else if (context.resourceAdvice.holdTera || lowValueSpecial(input.own)) {
      value -= 22;
    }
  }

  return value;
}

function speedValue(input: BattleAiSinglesLeafValueInputV4): number {
  const field = input.initialState.fieldSpeed || input.state.fieldSpeed;
  const selfSpeed = input.state.self.speed || input.initialState.self.speed;
  const foeSpeed = input.state.foe.speed || input.initialState.foe.speed;
  if (!field || !selfSpeed || !foeSpeed) return 0;
  const ownPriority = movePriority(candidateMoveId(input.own));
  const foePriority = movePriority(candidateMoveId(input.foe));
  const ownKo = candidateKoChance(input.own) >= 1 || input.state.foe.fainted || input.buckets.includes("ko");
  const foeKo = candidateKoChance(input.foe) >= 1 || input.state.self.fainted || input.buckets.includes("self-ko-risk");
  const priorityDelta = ownPriority - foePriority;
  if (priorityDelta > 0) return ownKo ? 28 : 8;
  if (priorityDelta < 0) return foeKo ? -30 : -8;
  const actsBefore = battleAiActsBeforeBySpeedV4(selfSpeed, foeSpeed, field);
  if (actsBefore === true && ownKo) return 30;
  if (actsBefore === false && foeKo) return -36;
  if (actsBefore === true && expectedDamageRatio(input.own) >= 0.45) return 10;
  if (actsBefore === false && expectedDamageRatio(input.foe) >= 0.45) return -12;
  return 0;
}

function fieldValue(input: BattleAiSinglesLeafValueInputV4): number {
  const moveId = candidateMoveId(input.own);
  let value = 0;
  if (WEATHER_MOVES.has(moveId)) value += weatherSubtypeFromMove(moveId) && input.roleAnalysis && teamHasHealthyAbuser(input.roleAnalysis, weatherSubtypeFromMove(moveId)!) ? 18 : -8;
  if (TERRAIN_MOVES.has(moveId)) value += 8;
  if (SPEED_FIELD_MOVES.has(moveId)) value += setupWindow(input) ? 14 : -6;
  if (input.initialState.fieldSpeed?.trickRoom && input.state.self.speed && input.state.foe.speed && input.state.self.speed.effectiveSpeed < input.state.foe.speed.effectiveSpeed) {
    value += 8;
  }
  return value;
}

function riskValue(input: BattleAiSinglesLeafValueInputV4): number {
  const ownAccuracy = candidateAccuracy(input.own);
  const foeAccuracy = candidateAccuracy(input.foe);
  const ownKoChance = candidateKoChance(input.own);
  const foeKoChance = candidateKoChance(input.foe);
  let value = 0;
  if (ownKoChance >= 1 && ownAccuracy >= 90) value += 12;
  if (ownKoChance > 0 && ownAccuracy < 85) value -= Math.max(8, (100 - ownAccuracy) * 0.45);
  if (foeKoChance > 0 && foeAccuracy < 85) value += Math.max(6, (100 - foeAccuracy) * 0.25);
  if (input.buckets.includes("unsafe-switch") || input.buckets.includes("self-ko-risk")) value -= 18;
  if (input.buckets.includes("safe-switch")) value += 10;
  return value;
}

function threatValue(input: BattleAiSinglesLeafValueInputV4): number {
  const ownDamageRatio = expectedDamageRatio(input.own);
  const foeDamageRatio = expectedDamageRatio(input.foe);
  let value = 0;
  if (input.state.foe.fainted) value += 18;
  if (ownDamageRatio >= 0.65) value += 12;
  if ((input.initialState.foeResources?.lowHpCount || 0) >= 2 && (input.state.foe.fainted || ownDamageRatio >= 0.35)) value += 10;
  if (foeDamageRatio >= 0.65) value -= 12;
  if (input.state.self.fainted) value -= 18;
  return value;
}

function stabilityValue(input: BattleAiSinglesLeafValueInputV4): number {
  const ownBucket = damageBucketForCandidate(input.own);
  const foeBucket = damageBucketForCandidate(input.foe);
  const ownMoveId = candidateMoveId(input.own);
  const foeDamage = expectedDamageRatio(input.foe);
  const ownKo = candidateKoChance(input.own) >= 1 || input.state.foe.fainted || input.buckets.includes("ko");
  const foeStableKo = input.state.self.fainted ||
    input.buckets.includes("self-ko-risk") ||
    foeBucket === "guaranteed-ko" ||
    foeBucket === "possible-ko" && candidateAccuracy(input.foe) >= 90;
  let value = battleAiDamageBucketScoreV4(ownBucket) * 0.18 - battleAiDamageBucketScoreV4(foeBucket) * 0.16;

  if (ownBucket === "immune" && !isSupportLikeMove(ownMoveId)) value -= 42;
  if (ownBucket === "negligible" && !isSupportLikeMove(ownMoveId) && candidateKoChance(input.own) <= 0) value -= 14;
  if (foeStableKo && !ownKo && input.own.kind !== "switch" && !PROTECT_MOVES.has(ownMoveId)) value -= 26;
  if (
    input.initialState.selfResources?.activeIsWinCondition &&
    !ownKo &&
    input.own.kind !== "switch" &&
    !PROTECT_MOVES.has(ownMoveId) &&
    (foeDamage >= 0.45 || foeStableKo)
  ) {
    value -= 22;
  }
  if (input.own.kind === "switch" && input.buckets.includes("safe-switch")) value += 12;
  if (input.own.kind === "switch" && input.buckets.includes("unsafe-switch")) value -= 18;
  if ((SETUP_MOVES.has(ownMoveId) || WEATHER_MOVES.has(ownMoveId) || TERRAIN_MOVES.has(ownMoveId) || SPEED_FIELD_MOVES.has(ownMoveId)) && foeStableKo) {
    value -= 18;
  }
  return value;
}

function specialMoveValue(input: BattleAiSinglesLeafValueInputV4): number {
  const moveId = candidateMoveId(input.own);
  const selfHp = hpRatio(input.initialState.self);
  const foeKoChance = candidateKoChance(input.foe);
  const ownKoChance = candidateKoChance(input.own);
  const specialTags = candidateSpecialSystemTags(input.own);
  const actsBefore = input.initialState.fieldSpeed
    ? battleAiActsBeforeBySpeedV4(input.initialState.self.speed, input.initialState.foe.speed, input.initialState.fieldSpeed)
    : null;
  let specialValue = specialSystemContextValue(input, specialTags, actsBefore);
  if (PROTECT_MOVES.has(moveId)) {
    if (foeKoChance >= 1 || input.buckets.includes("self-ko-risk")) return specialValue + 22;
    if (ownKoChance >= 1) return specialValue - 18;
    return specialValue + (selfHp < 0.35 ? 8 : -8);
  }
  if (RECOVERY_MOVES.has(moveId)) {
    if (selfHp > 0.75) return specialValue - 14;
    if (foeKoChance < 1 && selfHp <= 0.5) return specialValue + 24;
    return specialValue + (selfHp <= 0.65 ? 10 : -4);
  }
  if (SETUP_MOVES.has(moveId)) {
    if (selfHp <= 0.35 || foeKoChance >= 1 || actsBefore === false && expectedDamageRatio(input.foe) >= 0.45) return specialValue - 24;
    return specialValue + 18 + (input.state.selfResources?.winConditionHealthy ? 8 : 0);
  }
  if (moveId === "suckerpunch") {
    const foeMoveId = candidateMoveId(input.foe);
    const foeAttacks = expectedDamageRatio(input.foe) > 0 || candidateKoChance(input.foe) > 0;
    return specialValue + (foeAttacks && !PROTECT_MOVES.has(foeMoveId) && !SETUP_MOVES.has(foeMoveId) ? 18 : -16);
  }
  if (movePriority(moveId) > 0 && ownKoChance >= 1) specialValue += 18;
  return specialValue;
}

function specialSystemContextValue(
  input: BattleAiSinglesLeafValueInputV4,
  tags: string[],
  actsBefore: boolean | null,
): number {
  if (!tags.length) return 0;
  let value = 0;
  const foeKoChance = candidateKoChance(input.foe);
  const ownKoChance = candidateKoChance(input.own);
  const foeDamage = expectedDamageRatio(input.foe);
  if (tags.includes("dynamax")) value += 6;
  if (tags.includes("dynamax-survival")) {
    if (foeKoChance >= 1 || input.buckets.includes("self-ko-risk")) value += 28;
    else if (foeDamage >= 0.55) value += 16;
    else value += 6;
  }
  if (tags.includes("max-guard")) {
    if (foeKoChance >= 1 || input.buckets.includes("self-ko-risk")) value += 26;
    if (ownKoChance >= 1) value -= 22;
  }
  if (tags.includes("max-speed")) {
    if (actsBefore === false) value += 28;
    else if (ownKoChance >= 1) value += 16;
    else value += 10;
  }
  if (tags.includes("max-physical-boost") || tags.includes("max-special-boost")) {
    value += setupWindow(input) ? 16 : 8;
  }
  if (tags.includes("max-defense-boost") || tags.includes("max-special-defense-boost")) {
    value += foeDamage >= 0.45 || foeKoChance > 0 ? 18 : 8;
  }
  if (tags.includes("max-weather") || tags.includes("max-terrain")) value += 8;
  if (tags.includes("max-defense-drop") || tags.includes("max-special-defense-drop") || tags.includes("max-speed-drop")) value += expectedDamageRatio(input.own) >= 0.35 ? 10 : 4;
  if (tags.includes("max-offense-drop")) value += foeDamage >= 0.35 ? 10 : 4;
  if (tags.includes("gmax-residual") || tags.includes("gmax-hazard")) value += (input.state.foeResources?.aliveCount || 1) > 1 ? 12 : 4;
  if (tags.includes("gmax-aurora-veil")) value += foeDamage >= 0.35 ? 18 : 10;
  if (tags.includes("gmax-status") || tags.includes("gmax-ignore-protect") || tags.includes("gmax-clear-field")) value += 8;
  if (tags.includes("tera-offense")) value += ownKoChance >= 1 ? 14 : expectedDamageRatio(input.own) >= 0.5 ? 8 : 2;
  if (tags.includes("tera-defensive")) value += foeKoChance >= 1 || input.buckets.includes("self-ko-risk") ? 22 : foeDamage >= 0.45 ? 10 : 0;
  if (tags.includes("tera-wincon")) value += input.state.selfResources?.activeIsWinCondition ? 8 : 0;
  return value;
}

function roleValueBonus(input: BattleAiSinglesLeafValueInputV4): number {
  const analysis = input.roleAnalysis;
  if (!analysis) return 0;
  const weatherMove = weatherSubtypeFromMove(candidateMoveId(input.own));
  let bonus = 0;
  if (weatherMove) {
    bonus += teamHasHealthyAbuser(analysis, weatherMove) ? 24 : -14;
  }
  if (input.own.kind === "switch") {
    const target = pokemonForSwitchCandidate(analysis, input.own);
    if (target) {
      if (input.currentWeather && hasTag(target, "weather-abuser", input.currentWeather)) bonus += 36;
      if (hpRatio(input.initialState.self) < 0.35 && (hasTag(target, "pivot") || hasTag(target, "wall"))) bonus += 22;
      if (target.hpRatio < 0.35 && isWinCondition(target)) bonus -= 24;
      if (target.hpRatio < 0.35 && input.state.self.fainted) bonus -= 36;
    }
  } else if (
    input.currentWeather &&
    activeSetterMatchesWeather(analysis, input.currentWeather) &&
    teamHasHealthyAbuser(analysis, input.currentWeather) &&
    candidateKoChance(input.own) < 1
  ) {
    bonus -= 18;
  }
  return bonus;
}

function winConditionValue(input: BattleAiSinglesLeafValueInputV4): number {
  const self = input.state.selfResources;
  const initialSelf = input.initialState.selfResources;
  if (!self) return 0;
  let value = 0;
  if (self.winConditionAlive) value += self.winConditionHealthy ? 18 : 6;
  if (initialSelf?.winConditionAlive && !self.winConditionAlive) value -= 64;
  if (self.activeIsWinCondition && hpRatio(input.state.self) >= 0.45) value += 10;
  if (self.activeIsWinCondition && input.state.self.fainted) value -= 76;
  return value;
}

function hazardValue(
  input: BattleAiSinglesLeafValueInputV4,
  initialSelfResources: BattleAiSideResourceStateV4 | undefined,
  initialFoeResources: BattleAiSideResourceStateV4 | undefined,
): number {
  const ownMoveId = candidateMoveId(input.own);
  const foeBenchCount = Math.max(0, (input.state.foeResources?.aliveCount || 1) - (input.state.foe.fainted ? 0 : 1));
  let value = 0;
  if (isHazardMove(ownMoveId)) {
    value += foeBenchCount >= 2 ? 18 : foeBenchCount === 1 ? 8 : -24;
  }
  if (isHazardRemovalMove(ownMoveId)) {
    value += totalHazardLayers(initialSelfResources?.hazards) > 0 ? 22 : -8;
  }
  const foeHazardGain = totalHazardLayers(input.state.foeResources?.hazards) - totalHazardLayers(initialFoeResources?.hazards);
  const selfHazardGain = totalHazardLayers(input.state.selfResources?.hazards) - totalHazardLayers(initialSelfResources?.hazards);
  value += foeHazardGain * 8 - selfHazardGain * 8;
  return value;
}

function hpRatio(pokemon: BattleAiNumericPokemonForValueV4): number {
  return pokemon.hp / Math.max(1, pokemon.maxHp);
}

function resourceRatio(value: number | undefined): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? Number(value) : 0));
}

function candidateMoveId(candidate: BattleAiValueCandidateV4): string {
  return String(flattenedDiagnostics(candidate.diagnostics)[0]?.moveId || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function candidateAccuracy(candidate: BattleAiValueCandidateV4): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate.diagnostics).map(entry => Number(entry.accuracy))) ?? 100;
}

function candidateKoChance(candidate: BattleAiValueCandidateV4): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate.diagnostics).map(entry => Number(entry.koChance))) ?? 0;
}

function expectedDamageRatio(candidate: BattleAiValueCandidateV4): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate.diagnostics).map(entry => Number(entry.expectedDamageRatio))) ?? 0;
}

function candidateTypeMultiplier(candidate: BattleAiValueCandidateV4): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate.diagnostics).map(entry => Number(entry.typeMultiplier))) ?? 1;
}

function damageBucketForCandidate(candidate: BattleAiValueCandidateV4): BattleAiDamageBucketV4 {
  return battleAiDamageBucketForEstimateV4({
    typeMultiplier: candidateTypeMultiplier(candidate),
    expectedDamageRatio: expectedDamageRatio(candidate),
    koChance: candidateKoChance(candidate),
  });
}

function candidateSpecialSystemTags(candidate: BattleAiValueCandidateV4): string[] {
  return flattenedDiagnostics(candidate.diagnostics).flatMap(entry => Array.isArray(entry.specialSystemTags) ? entry.specialSystemTags.map(String) : []);
}

function lowValueSpecial(candidate: BattleAiValueCandidateV4): boolean {
  return flattenedDiagnostics(candidate.diagnostics)
    .some(entry => isRecord(entry.specialSystemBreakdown) && Number(entry.specialSystemBreakdown.teraLowValuePenalty || 0) < 0);
}

function movePriority(moveId: string): number {
  if (!moveId) return 0;
  try {
    return Number(DEFAULT_DEX.getMoveDetail(toDexId(moveId)).priority || 0);
  } catch {
    if (moveId === "suckerpunch") return 1;
    if (["quickattack", "aquajet", "machpunch", "bulletpunch", "iceshard", "shadowsneak", "vacuumwave"].includes(moveId)) return 1;
    if (moveId === "extremespeed") return 2;
    return 0;
  }
}

function flattenedDiagnostics(diagnostics: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!diagnostics) return [];
  if (Array.isArray(diagnostics.parts)) {
    return diagnostics.parts.flatMap(part => flattenedDiagnostics(isRecord(part) ? part : undefined));
  }
  return [diagnostics];
}

function firstFiniteNumber(values: number[]): number | null {
  for (const value of values) {
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function setupWindow(input: BattleAiSinglesLeafValueInputV4): boolean {
  return hpRatio(input.initialState.self) > 0.45 && candidateKoChance(input.foe) < 1 && expectedDamageRatio(input.foe) < 0.55;
}

function isSupportLikeMove(moveId: string): boolean {
  return PROTECT_MOVES.has(moveId) ||
    RECOVERY_MOVES.has(moveId) ||
    SETUP_MOVES.has(moveId) ||
    WEATHER_MOVES.has(moveId) ||
    TERRAIN_MOVES.has(moveId) ||
    SPEED_FIELD_MOVES.has(moveId) ||
    isHazardMove(moveId) ||
    isHazardRemovalMove(moveId);
}

function pokemonForSwitchCandidate(analysis: BattleAiTeamRoleAnalysisV4, candidate: BattleAiValueCandidateV4) {
  const match = candidate.choice.match(/^switch\s+(\d+)/);
  if (!match) return null;
  const rowIndex = Number(match[1]) - 1;
  return Object.values(analysis.pokemon).find(entry => entry.rowIndex === rowIndex) || null;
}

function teamHasHealthyAbuser(analysis: BattleAiTeamRoleAnalysisV4, subtype: BattleAiRoleTagSubtypeV4): boolean {
  return Object.values(analysis.pokemon).some(entry => !entry.active && !entry.fainted && entry.hpRatio > 0.35 && hasTag(entry, "weather-abuser", subtype));
}

function activeSetterMatchesWeather(analysis: BattleAiTeamRoleAnalysisV4, weather: BattleAiRoleTagSubtypeV4): boolean {
  return Object.values(analysis.pokemon).some(entry => entry.active && hasTag(entry, "weather-setter", weather));
}

function isWinCondition(pokemon: BattleAiTeamRoleAnalysisV4["pokemon"][string]): boolean {
  return pokemon.tags.some(tag => ["weather-abuser", "setup-sweeper", "revenge-killer", "priority-user"].includes(tag.kind));
}

function hasTag(
  pokemon: BattleAiTeamRoleAnalysisV4["pokemon"][string],
  kind: string,
  subtype?: BattleAiRoleTagSubtypeV4,
): boolean {
  return pokemon.tags.some(tag => tag.kind === kind && (!subtype || tag.subtype === subtype));
}

function weatherSubtypeFromMove(moveId: string): BattleAiRoleTagSubtypeV4 | undefined {
  if (moveId === "raindance") return "rain";
  if (moveId === "sunnyday") return "sun";
  if (moveId === "sandstorm") return "sand";
  if (moveId === "snowscape" || moveId === "hail") return "snow";
  return undefined;
}

function isHazardMove(moveId: string): boolean {
  return ["stealthrock", "spikes", "toxicspikes", "stickyweb"].includes(moveId);
}

function isHazardRemovalMove(moveId: string): boolean {
  return ["defog", "rapidspin", "mortalspin", "tidyup"].includes(moveId);
}

function totalHazardLayers(hazards: BattleAiHazardLayerStateV4 | undefined): number {
  if (!hazards) return 0;
  return hazards.stealthRock + hazards.spikes + hazards.toxicSpikes + hazards.stickyWeb;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
