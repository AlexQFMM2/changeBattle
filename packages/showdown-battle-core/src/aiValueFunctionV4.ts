import type {
  BattleAiCapabilityProfileV4,
  BattleAiOutcomeBucketV4,
  ShowdownPlayerIdV4,
} from "./types.js";
import type {BattleAiRoleTagSubtypeV4, BattleAiTeamRoleAnalysisV4} from "./aiTeamRoleAnalyzerV4.js";
import type {BattleAiSpeedFieldStateV4, BattleAiSpeedStateV4} from "./aiSpeedStateV4.js";
import {battleAiOutcomeBucketScoreV4} from "./aiOutcomeBucketsV4.js";

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
};

export type BattleAiSinglesLeafValueResultV4 = {
  score: number;
  breakdown: BattleAiValueBreakdownV4;
};

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
    candidateTieBreak,
  };
  return {
    score: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown,
  };
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

function candidateKoChance(candidate: BattleAiValueCandidateV4): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate.diagnostics).map(entry => Number(entry.koChance))) ?? 0;
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
