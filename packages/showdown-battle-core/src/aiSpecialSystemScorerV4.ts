import {toDexId} from "@changebattle-v2/showdown-dex-core";
import type {
  BattleServiceMoveRequestV4,
  BattleServiceRequestV4,
  BattleServiceSidePokemonV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
} from "./types.js";
import type {ShowdownSpecialChoiceV4} from "./showdownCommand.js";
import type {BattleAiMoveEvaluationV4} from "./aiMoveEvaluator.js";
import type {BattleAiTeamRoleAnalysisV4, BattleAiRoleTagSubtypeV4} from "./aiTeamRoleAnalyzerV4.js";

export type BattleAiSpecialSystemTagV4 =
  | "mega"
  | "zmove"
  | "dynamax"
  | "dynamax-survival"
  | "max-guard"
  | "max-speed"
  | "max-physical-boost"
  | "max-special-boost"
  | "max-defense-boost"
  | "max-special-defense-boost"
  | "max-weather"
  | "max-terrain"
  | "max-defense-drop"
  | "max-special-defense-drop"
  | "max-speed-drop"
  | "max-offense-drop"
  | "gmax-residual"
  | "gmax-aurora-veil"
  | "gmax-status"
  | "gmax-hazard"
  | "gmax-clear-field"
  | "gmax-ignore-protect"
  | "terastallize"
  | "tera-offense"
  | "tera-defensive"
  | "tera-wincon";

export type BattleAiSpecialSystemScoreV4 = {
  score: number;
  tags: BattleAiSpecialSystemTagV4[];
  breakdown: Record<string, number>;
};

export type BattleAiSpecialSystemScoreInputV4 = {
  request: BattleServiceRequestV4;
  snapshot: BattleServiceSnapshotV4;
  playerId: ShowdownPlayerIdV4;
  activeIndex: number;
  move: BattleServiceMoveRequestV4;
  special: ShowdownSpecialChoiceV4 | null;
  evaluation: BattleAiMoveEvaluationV4;
  roleAnalysis?: BattleAiTeamRoleAnalysisV4;
};

const MAX_MOVE_EFFECT_BY_ID: Record<string, {tag: BattleAiSpecialSystemTagV4; fieldSubtype?: BattleAiRoleTagSubtypeV4}> = {
  maxairstream: {tag: "max-speed"},
  maxknuckle: {tag: "max-physical-boost"},
  maxooze: {tag: "max-special-boost"},
  maxsteelspike: {tag: "max-defense-boost"},
  maxquake: {tag: "max-special-defense-boost"},
  maxgeyser: {tag: "max-weather", fieldSubtype: "rain"},
  maxflare: {tag: "max-weather", fieldSubtype: "sun"},
  maxrockfall: {tag: "max-weather", fieldSubtype: "sand"},
  maxhailstorm: {tag: "max-weather", fieldSubtype: "snow"},
  maxlightning: {tag: "max-terrain", fieldSubtype: "electric"},
  maxmindstorm: {tag: "max-terrain", fieldSubtype: "psychic"},
  maxovergrowth: {tag: "max-terrain", fieldSubtype: "grassy"},
  maxstarfall: {tag: "max-terrain", fieldSubtype: "misty"},
  maxphantasm: {tag: "max-defense-drop"},
  maxdarkness: {tag: "max-special-defense-drop"},
  maxstrike: {tag: "max-speed-drop"},
  maxwyrmwind: {tag: "max-offense-drop"},
  maxflutterby: {tag: "max-offense-drop"},
};

const GMAX_EFFECT_BY_ID: Record<string, BattleAiSpecialSystemTagV4> = {
  gmaxvineash: "gmax-residual",
  gmaxwildfire: "gmax-residual",
  gmaxcannonade: "gmax-residual",
  gmaxvolcalith: "gmax-residual",
  gmaxbefuddle: "gmax-status",
  gmaxstunshock: "gmax-status",
  gmaxmalodor: "gmax-status",
  gmaxsmite: "gmax-status",
  gmaxsnooze: "gmax-status",
  gmaxresonance: "gmax-aurora-veil",
  gmaxstonesurge: "gmax-hazard",
  gmaxsteelsurge: "gmax-hazard",
  gmaxwindrage: "gmax-clear-field",
  gmaxoneblow: "gmax-ignore-protect",
  gmaxrapidflow: "gmax-ignore-protect",
};

export function scoreBattleAiSpecialSystemV4(input: BattleAiSpecialSystemScoreInputV4): BattleAiSpecialSystemScoreV4 {
  if (!input.special) return emptyScore();
  if (input.special === "mega" || input.special === "megax" || input.special === "megay" || input.special === "ultra") {
    return scoreMega();
  }
  if (input.special === "zmove") {
    return scoreZMove(input);
  }
  if (input.special === "max") {
    return scoreDynamax(input);
  }
  if (input.special === "terastallize") {
    return scoreTerastallize(input);
  }
  return emptyScore();
}

function scoreMega(): BattleAiSpecialSystemScoreV4 {
  return {score: 34, tags: ["mega"], breakdown: {mega: 34}};
}

function scoreZMove(input: BattleAiSpecialSystemScoreInputV4): BattleAiSpecialSystemScoreV4 {
  const ko = input.evaluation.koChance >= 1 ? 24 : input.evaluation.koChance > 0 ? 12 : 0;
  const damage = input.evaluation.expectedDamageRatio >= 0.5 ? 10 : 0;
  return {score: 22 + ko + damage, tags: ["zmove"], breakdown: {zmoveBase: 22, zmoveKo: ko, zmoveDamage: damage}};
}

function scoreDynamax(input: BattleAiSpecialSystemScoreInputV4): BattleAiSpecialSystemScoreV4 {
  const moveId = toDexId(input.move.id || input.move.move);
  const effect = maxMoveEffect(moveId, input.evaluation.diagnostics.moveType);
  const tags: BattleAiSpecialSystemTagV4[] = ["dynamax"];
  const breakdown: Record<string, number> = {dynamaxBase: 34};
  const hpRatio = activeHpRatio(input.request, input.activeIndex);
  const survival = hpRatio <= 0.5 ? 28 : hpRatio <= 0.75 ? 16 : 8;
  breakdown.dynamaxSurvival = survival;
  tags.push("dynamax-survival");

  if (moveId === "maxguard") {
    breakdown.maxGuard = hpRatio <= 0.45 ? 28 : 10;
    tags.push("max-guard");
  } else if (effect) {
    tags.push(effect.tag);
    breakdown[effect.tag] = maxMoveEffectScore(effect.tag, input, effect.fieldSubtype);
  }

  const gmax = GMAX_EFFECT_BY_ID[moveId];
  if (gmax) {
    tags.push(gmax);
    breakdown[gmax] = gmaxEffectScore(gmax, input);
  }

  return {score: sumBreakdown(breakdown), tags: unique(tags), breakdown};
}

function scoreTerastallize(input: BattleAiSpecialSystemScoreInputV4): BattleAiSpecialSystemScoreV4 {
  const row = activeRow(input.request, input.activeIndex);
  const teraType = toDexId(row?.teraType || "");
  const moveType = toDexId(String(input.evaluation.diagnostics.moveType || ""));
  const tags: BattleAiSpecialSystemTagV4[] = ["terastallize"];
  const breakdown: Record<string, number> = {teraBase: 8};
  const offensive = input.evaluation.koChance >= 1
    ? 32
    : input.evaluation.expectedDamageRatio >= 0.5
      ? 22
      : teraType && teraType === moveType
        ? 12
        : 0;
  if (offensive > 0) {
    tags.push("tera-offense");
    breakdown.teraOffense = offensive;
  }
  const hpRatio = activeHpRatio(input.request, input.activeIndex);
  if (hpRatio <= 0.45) {
    tags.push("tera-defensive");
    breakdown.teraDefensive = 14;
  }
  if (activeIsWinCondition(input.roleAnalysis)) {
    tags.push("tera-wincon");
    breakdown.teraWincon = hpRatio > 0.35 ? 12 : -8;
  }
  if (offensive <= 0 && hpRatio > 0.7 && !activeIsWinCondition(input.roleAnalysis)) {
    breakdown.teraLowValuePenalty = -12;
  }
  return {score: sumBreakdown(breakdown), tags: unique(tags), breakdown};
}

function maxMoveEffect(moveId: string, rawMoveType: unknown): {tag: BattleAiSpecialSystemTagV4; fieldSubtype?: BattleAiRoleTagSubtypeV4} | null {
  const direct = MAX_MOVE_EFFECT_BY_ID[moveId];
  if (direct) return direct;
  const type = toDexId(String(rawMoveType || ""));
  if (type === "flying") return {tag: "max-speed"};
  if (type === "fighting") return {tag: "max-physical-boost"};
  if (type === "poison") return {tag: "max-special-boost"};
  if (type === "steel") return {tag: "max-defense-boost"};
  if (type === "ground") return {tag: "max-special-defense-boost"};
  if (type === "water") return {tag: "max-weather", fieldSubtype: "rain"};
  if (type === "fire") return {tag: "max-weather", fieldSubtype: "sun"};
  if (type === "rock") return {tag: "max-weather", fieldSubtype: "sand"};
  if (type === "ice") return {tag: "max-weather", fieldSubtype: "snow"};
  if (type === "electric") return {tag: "max-terrain", fieldSubtype: "electric"};
  if (type === "psychic") return {tag: "max-terrain", fieldSubtype: "psychic"};
  if (type === "grass") return {tag: "max-terrain", fieldSubtype: "grassy"};
  if (type === "fairy") return {tag: "max-terrain", fieldSubtype: "misty"};
  if (type === "ghost") return {tag: "max-defense-drop"};
  if (type === "dark") return {tag: "max-special-defense-drop"};
  if (type === "normal") return {tag: "max-speed-drop"};
  if (type === "dragon" || type === "bug") return {tag: "max-offense-drop"};
  return null;
}

function maxMoveEffectScore(
  tag: BattleAiSpecialSystemTagV4,
  input: BattleAiSpecialSystemScoreInputV4,
  fieldSubtype?: BattleAiRoleTagSubtypeV4,
): number {
  const category = toDexId(String(input.evaluation.diagnostics.category || ""));
  switch (tag) {
    case "max-speed":
      return 42;
    case "max-physical-boost":
      return category === "physical" ? 30 : 18;
    case "max-special-boost":
      return category === "special" ? 30 : 18;
    case "max-defense-boost":
    case "max-special-defense-boost":
      return activeHpRatio(input.request, input.activeIndex) <= 0.65 ? 30 : 20;
    case "max-weather":
      return fieldSubtype && teamHasHealthyAbuser(input.roleAnalysis, fieldSubtype) ? 34 : 18;
    case "max-terrain":
      return fieldSubtype && teamHasTerrainAbuser(input.roleAnalysis, fieldSubtype) ? 28 : 16;
    case "max-defense-drop":
    case "max-special-defense-drop":
      return input.evaluation.expectedDamageRatio >= 0.35 ? 24 : 14;
    case "max-speed-drop":
      return 24;
    case "max-offense-drop":
      return 18;
    default:
      return 0;
  }
}

function gmaxEffectScore(tag: BattleAiSpecialSystemTagV4, input: BattleAiSpecialSystemScoreInputV4): number {
  switch (tag) {
    case "gmax-residual":
      return (input.snapshot.active.filter(active => active.playerId !== input.playerId && !active.fainted).length > 0) ? 32 : 18;
    case "gmax-aurora-veil":
      return 42;
    case "gmax-status":
      return 28;
    case "gmax-hazard":
      return 30;
    case "gmax-clear-field":
      return 20;
    case "gmax-ignore-protect":
      return 30;
    default:
      return 0;
  }
}

function teamHasHealthyAbuser(analysis: BattleAiTeamRoleAnalysisV4 | undefined, subtype: BattleAiRoleTagSubtypeV4): boolean {
  if (!analysis) return false;
  return Object.values(analysis.pokemon).some(pokemon =>
    !pokemon.fainted &&
    pokemon.hpRatio > 0.35 &&
    pokemon.tags.some(tag => tag.kind === "weather-abuser" && tag.subtype === subtype),
  );
}

function teamHasTerrainAbuser(analysis: BattleAiTeamRoleAnalysisV4 | undefined, subtype: BattleAiRoleTagSubtypeV4): boolean {
  if (!analysis) return false;
  return Object.values(analysis.pokemon).some(pokemon =>
    !pokemon.fainted &&
    pokemon.hpRatio > 0.35 &&
    pokemon.tags.some(tag => tag.kind === "terrain-abuser" && tag.subtype === subtype),
  );
}

function activeIsWinCondition(analysis: BattleAiTeamRoleAnalysisV4 | undefined): boolean {
  if (!analysis) return false;
  return Object.values(analysis.pokemon).some(pokemon =>
    pokemon.active &&
    pokemon.tags.some(tag => ["weather-abuser", "terrain-abuser", "setup-sweeper", "revenge-killer", "priority-user"].includes(tag.kind)),
  );
}

function activeRow(request: BattleServiceRequestV4, activeIndex: number): BattleServiceSidePokemonV4 | undefined {
  const activeRows = request.side?.pokemon?.filter(row => row.active) || [];
  return activeRows[activeIndex] || request.side?.pokemon?.[activeIndex];
}

function activeHpRatio(request: BattleServiceRequestV4, activeIndex: number): number {
  const condition = activeRow(request, activeIndex)?.condition || "";
  if (condition.includes("fnt")) return 0;
  const match = /^(\d+)\/(\d+)/.exec(condition);
  if (!match) return 1;
  const hp = Number(match[1]);
  const max = Number(match[2]);
  return max > 0 ? Math.max(0, Math.min(1, hp / max)) : 1;
}

function emptyScore(): BattleAiSpecialSystemScoreV4 {
  return {score: 0, tags: [], breakdown: {}};
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sumBreakdown(breakdown: Record<string, number>): number {
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
}
