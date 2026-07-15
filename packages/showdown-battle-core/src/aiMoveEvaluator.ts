// Battle V4 AI move scoring follows Pokemon Showdown battle data semantics:
// move/type/species facts come from showdown-dex-core, while this file only
// translates the current snapshot/request into a bounded one-turn estimate.
import {
  createShowdownDexService,
  getShowdownTypeEffectivenessV4,
  toDexId,
  type DexMoveDetail,
  type DexPokemonDetail,
  type DexStatId,
  type ShowdownDexService,
} from "@changebattle-v2/showdown-dex-core";
import type {
  BattleAiProfileV4,
  BattleServiceActivePokemonV4,
  BattleServiceMoveRequestV4,
  BattleServiceRequestV4,
  BattleServiceSidePokemonV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
} from "./types.js";
import type {ShowdownSpecialChoiceV4} from "./showdownCommand.js";

export type BattleAiMoveEvaluationV4 = {
  expectedDamageRange: {min: number; max: number; average: number};
  expectedDamageRatio: number;
  typeMultiplier: number;
  stab: number;
  accuracy: number;
  koChance: number;
  targetScore: number;
  utilityScore: number;
  finalScore: number;
  diagnostics: Record<string, unknown>;
};

export type BattleAiMoveTargetOverrideV4 = {
  playerId: ShowdownPlayerIdV4;
  row: BattleServiceSidePokemonV4;
  activeIndex?: number;
};

export type BattleAiMoveEvaluatorContextV4 = {
  request: BattleServiceRequestV4;
  snapshot: BattleServiceSnapshotV4;
  playerId: ShowdownPlayerIdV4;
  activeIndex: number;
  move: BattleServiceMoveRequestV4;
  targetLoc?: string;
  targetOverride?: BattleAiMoveTargetOverrideV4;
  special?: ShowdownSpecialChoiceV4 | null;
  aiProfile?: BattleAiProfileV4 | null;
  timeBudgetMs?: number;
  dex?: ShowdownDexService;
};

type BattleAiCombatantV4 = {
  playerId: ShowdownPlayerIdV4;
  activeIndex: number;
  row?: BattleServiceSidePokemonV4;
  active?: BattleServiceActivePokemonV4;
  speciesId: string;
  details: string;
  condition: string;
  level: number;
  hp: number;
  maxHp: number;
  status: string;
  item: string;
  ability: string;
  stats?: Record<string, number>;
  species?: DexPokemonDetail | null;
  estimatedStats: boolean;
};

const DEFAULT_DEX = createShowdownDexService();
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const SPREAD_TARGETS = new Set(["allAdjacent", "allAdjacentFoes"]);

export function evaluateBattleAiMoveV4(input: BattleAiMoveEvaluatorContextV4): BattleAiMoveEvaluationV4 {
  const dex = input.dex || DEFAULT_DEX;
  const move = safeMoveDetail(dex, input.move.id || input.move.move);
  const user = combatantForActive(input.request, input.snapshot, input.playerId, input.activeIndex, dex);
  const targets = targetCombatantsForMove(input.request, input.snapshot, input.playerId, input.activeIndex, input.targetLoc, input.targetOverride, move, dex);
  const damaging = Boolean(move && move.power > 0 && move.categoryId !== "status");
  const targetOverrideApplied = Boolean(input.targetOverride && targets.some(target => target.row === input.targetOverride?.row));
  const targetEvaluations = targets.map(target => evaluateAgainstTarget({dex, move, user, target, special: input.special, damaging, request: input.request, snapshot: input.snapshot}));
  const best = targetEvaluations.slice().sort((a, b) => b.finalScore - a.finalScore)[0];
  const combined = combineTargetEvaluations(targetEvaluations, best, move);
  const utilityScore = utilityScoreForMove(move, input.request, input.activeIndex, user);
  const finalScore = combined.finalScore + utilityScore;
  const moveType = move ? effectiveMoveType(move, input.special, user) : "";
  return {
    expectedDamageRange: combined.expectedDamageRange,
    expectedDamageRatio: combined.expectedDamageRatio,
    typeMultiplier: best?.typeMultiplier ?? 1,
    stab: best?.stab ?? 1,
    accuracy: moveAccuracy(move),
    koChance: combined.koChance,
    targetScore: combined.targetScore,
    utilityScore,
    finalScore,
    diagnostics: {
      moveId: move?.id || toDexId(input.move.id || input.move.move),
      moveType,
      category: move?.categoryId || "",
      target: move?.target || input.move.target || "",
      targetLoc: input.targetLoc || "",
      userSpeciesId: user.speciesId,
      targetSpeciesIds: targets.map(target => target.speciesId),
      targetSlots: targets.map(target => target.active?.slot || ""),
      targetIdents: targets.map(target => target.active?.ident || target.row?.ident || ""),
      targetCount: targets.length,
      targetOverride: targetOverrideApplied || undefined,
      targetOverrideIdent: targetOverrideApplied ? input.targetOverride?.row.ident || null : undefined,
      typeMultiplier: best?.typeMultiplier ?? 1,
      stab: best?.stab ?? 1,
      accuracy: moveAccuracy(move),
      koChance: combined.koChance,
      expectedDamageRatio: combined.expectedDamageRatio,
      abilityImmunity: best?.diagnostics.abilityImmunity || undefined,
      estimatedStats: user.estimatedStats || targets.some(target => target.estimatedStats),
      special: input.special || null,
    },
  };
}

function evaluateAgainstTarget(input: {
  dex: ShowdownDexService;
  move: DexMoveDetail | null;
  user: BattleAiCombatantV4;
  target: BattleAiCombatantV4;
  special?: ShowdownSpecialChoiceV4 | null;
  damaging: boolean;
  request: BattleServiceRequestV4;
  snapshot: BattleServiceSnapshotV4;
}): BattleAiMoveEvaluationV4 {
  const {move, user, target} = input;
  if (!move || !input.damaging) {
    return emptyEvaluation({targetSpeciesId: target.speciesId, reason: "non-damaging"});
  }
  const moveType = effectiveMoveType(move, input.special, user);
  const basePower = effectiveBasePower(move, input.special);
  const defenderTypes = target.species?.types || [];
  const effectiveness = getShowdownTypeEffectivenessV4(moveType, defenderTypes);
  const immunity = abilityImmunity(target, moveType);
  const typeMultiplier = immunity ? 0 : effectiveness.multiplier;
  const stab = stabModifier(user, moveType, input.special);
  const accuracy = moveAccuracy(move);
  const category = move.categoryId === "special" ? "special" : "physical";
  const userStats = effectiveStats(user);
  const targetStats = effectiveStats(target);
  const attack = Math.max(1, category === "special" ? userStats.spa : burnAdjustedAttack(user, userStats.atk, move));
  const defense = Math.max(1, category === "special" ? specialDefense(input.snapshot, target, targetStats.spd) : targetStats.def);
  const level = Math.max(1, user.level || 50);
  const weather = weatherModifier(input.snapshot, moveType);
  const terrain = terrainModifier(input.snapshot, moveType, move.target || "");
  const spread = SPREAD_TARGETS.has(move.target || "") && (input.request.active || []).length > 1 ? 0.75 : 1;
  const item = itemModifier(user, move);
  const ability = abilityModifier(user, move, input.snapshot);
  const base = Math.floor(Math.floor(Math.floor((2 * level / 5 + 2) * basePower * attack / defense) / 50) + 2);
  const maxDamage = Math.max(0, Math.floor(base * stab * typeMultiplier * weather * terrain * spread * item * ability));
  const minDamage = Math.max(0, Math.floor(maxDamage * 0.85));
  const average = (minDamage + maxDamage) / 2;
  const targetHp = Math.max(1, target.hp || target.maxHp || 1);
  const expectedDamageRatio = average / targetHp;
  const koChance = maxDamage <= 0 ? 0 : minDamage >= targetHp ? 1 : maxDamage >= targetHp ? Math.max(0.15, (maxDamage - targetHp + 1) / Math.max(1, maxDamage - minDamage + 1)) : 0;
  const targetScore = average * accuracy / 100 + expectedDamageRatio * 62 + koChance * 90 + typeScore(typeMultiplier) + (stab > 1 ? 12 : 0);
  return {
    expectedDamageRange: {min: minDamage, max: maxDamage, average},
    expectedDamageRatio,
    typeMultiplier,
    stab,
    accuracy,
    koChance,
    targetScore,
    utilityScore: 0,
    finalScore: targetScore,
    diagnostics: {
      targetSpeciesId: target.speciesId,
      defenderTypes,
      abilityImmunity: immunity || undefined,
      attack,
      defense,
      basePower,
      weather,
      terrain,
      spread,
      item,
      ability,
    },
  };
}

function combineTargetEvaluations(evaluations: BattleAiMoveEvaluationV4[], best: BattleAiMoveEvaluationV4 | undefined, move: DexMoveDetail | null): Pick<BattleAiMoveEvaluationV4, "expectedDamageRange" | "expectedDamageRatio" | "koChance" | "targetScore" | "finalScore"> {
  if (!evaluations.length || !best) {
    return {expectedDamageRange: {min: 0, max: 0, average: 0}, expectedDamageRatio: 0, koChance: 0, targetScore: 0, finalScore: 0};
  }
  if (!move || !SPREAD_TARGETS.has(move.target || "")) {
    return best;
  }
  const totalAverage = evaluations.reduce((sum, entry) => sum + entry.expectedDamageRange.average, 0);
  const totalScore = evaluations.reduce((sum, entry) => sum + entry.targetScore, 0);
  const maxKoChance = Math.max(...evaluations.map(entry => entry.koChance));
  return {
    expectedDamageRange: {
      min: evaluations.reduce((sum, entry) => sum + entry.expectedDamageRange.min, 0),
      max: evaluations.reduce((sum, entry) => sum + entry.expectedDamageRange.max, 0),
      average: totalAverage,
    },
    expectedDamageRatio: evaluations.reduce((sum, entry) => sum + entry.expectedDamageRatio, 0),
    koChance: maxKoChance,
    targetScore: totalScore,
    finalScore: totalScore,
  };
}

function targetCombatantsForMove(
  request: BattleServiceRequestV4,
  snapshot: BattleServiceSnapshotV4,
  playerId: ShowdownPlayerIdV4,
  activeIndex: number,
  targetLoc: string | undefined,
  targetOverride: BattleAiMoveTargetOverrideV4 | undefined,
  move: DexMoveDetail | null,
  dex: ShowdownDexService,
): BattleAiCombatantV4[] {
  const foePlayerIds = snapshot.players.filter(player => player.playerId !== playerId && player.alliance !== snapshot.players.find(entry => entry.playerId === playerId)?.alliance).map(player => player.playerId);
  const foeActives = snapshot.active.filter(active => foePlayerIds.includes(active.playerId) && !active.fainted);
  const ownActives = snapshot.active.filter(active => active.playerId === playerId && !active.fainted);
  const activeCount = Math.max(1, request.active?.length || 1);
  const target = move?.target || "";
  if (target === "self") return [combatantForActive(request, snapshot, playerId, activeIndex, dex)];
  if (target === "allAdjacent" || target === "allAdjacentFoes") {
    const foes = foeActives.map((active, index) => combatantFromSnapshotActive(active, index, dex, snapshot));
    if (target === "allAdjacentFoes") return foes;
    const allies = ownActives
      .map((active, index) => ({active, index}))
      .filter(entry => entry.index !== activeIndex)
      .map(entry => combatantFromSnapshotActive(entry.active, entry.index, dex, snapshot));
    return [...foes, ...allies];
  }
  if (targetOverride && targetAllowsOverride(target)) {
    return [combatantFromRow(targetOverride.row, targetOverride.playerId, targetOverride.activeIndex ?? activeIndex, dex)];
  }
  const parsedFoeLoc = targetLoc?.startsWith("+") ? Number(targetLoc.slice(1)) - 1 : Number.NaN;
  const parsedAllyLoc = targetLoc?.startsWith("-") ? Math.abs(Number(targetLoc)) - 1 : Number.NaN;
  if (Number.isFinite(parsedAllyLoc) && parsedAllyLoc >= 0) {
    const ally = ownActives[parsedAllyLoc];
    if (ally) return [combatantFromSnapshotActive(ally, parsedAllyLoc, dex, snapshot)];
  }
  const targetIndex = Number.isFinite(parsedFoeLoc) && parsedFoeLoc >= 0 ? parsedFoeLoc : Math.min(activeIndex, activeCount - 1);
  const active = foeActives[targetIndex] || foeActives[0];
  if (active) return [combatantFromSnapshotActive(active, targetIndex, dex, snapshot)];
  const fallbackRow = request.side?.pokemon?.find(row => !row.active && !row.fainted && !row.condition.includes("fnt"));
  return [combatantFromRow(fallbackRow, "p1", 0, dex)];
}

function targetAllowsOverride(target: string): boolean {
  const normalized = String(target || "").toLowerCase();
  return normalized !== "self" && !normalized.includes("ally") && normalized !== "alladjacent" && normalized !== "alladjacentfoes";
}

function combatantForActive(request: BattleServiceRequestV4, snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4, activeIndex: number, dex: ShowdownDexService): BattleAiCombatantV4 {
  const row = activeSidePokemonRow(request, activeIndex);
  const active = snapshot.active.filter(entry => entry.playerId === playerId && !entry.fainted)[activeIndex];
  return combatantFromRowAndActive(row, active, playerId, activeIndex, dex);
}

function combatantFromSnapshotActive(active: BattleServiceActivePokemonV4, activeIndex: number, dex: ShowdownDexService, snapshot?: BattleServiceSnapshotV4): BattleAiCombatantV4 {
  return combatantFromRowAndActive(sideRowForActive(snapshot, active), active, active.playerId, activeIndex, dex);
}

function combatantFromRow(row: BattleServiceSidePokemonV4 | undefined, playerId: ShowdownPlayerIdV4, activeIndex: number, dex: ShowdownDexService): BattleAiCombatantV4 {
  return combatantFromRowAndActive(row, undefined, playerId, activeIndex, dex);
}

function combatantFromRowAndActive(row: BattleServiceSidePokemonV4 | undefined, active: BattleServiceActivePokemonV4 | undefined, playerId: ShowdownPlayerIdV4, activeIndex: number, dex: ShowdownDexService): BattleAiCombatantV4 {
  const details = active?.details || row?.details || "";
  const speciesId = speciesIdFromDetails(bestSpeciesSource(row, active, details));
  const species = safeSpeciesDetail(dex, speciesId);
  const condition = active?.condition || row?.condition || "";
  const hpInfo = hpFromCondition(condition, active?.hp, active?.maxHp);
  return {
    playerId,
    activeIndex,
    row,
    active,
    speciesId: species?.id || speciesId,
    details,
    condition,
    level: levelFromDetails(details),
    hp: hpInfo.hp,
    maxHp: hpInfo.maxHp,
    status: active?.status || statusFromCondition(condition),
    item: row?.item || "",
    ability: row?.ability || row?.baseAbility || "",
    stats: row?.stats,
    species,
    estimatedStats: !row?.stats,
  };
}

function bestSpeciesSource(row: BattleServiceSidePokemonV4 | undefined, active: BattleServiceActivePokemonV4 | undefined, fallback: string): string {
  const activeSpeciesId = toDexId(active?.species || "");
  const activeDetailsId = speciesIdFromDetails(active?.details || "");
  const rowDetailsId = speciesIdFromDetails(row?.details || "");
  if (activeDetailsId && activeDetailsId !== activeSpeciesId) return active?.details || fallback;
  if (rowDetailsId && rowDetailsId !== activeSpeciesId) return row?.details || fallback;
  return active?.details || row?.details || active?.species || fallback;
}

function activeSidePokemonRow(request: BattleServiceRequestV4, activeIndex: number): BattleServiceSidePokemonV4 | undefined {
  const normalizedRow = (request as BattleServiceRequestV4 & {activeSidePokemon?: Array<BattleServiceSidePokemonV4 | null>}).activeSidePokemon?.[activeIndex];
  if (normalizedRow) return normalizedRow;
  const activeRows = request.side?.pokemon?.filter(row => row.active) || [];
  return activeRows[activeIndex] || request.side?.pokemon?.[activeIndex];
}

function sideRowForActive(snapshot: BattleServiceSnapshotV4 | undefined, active: BattleServiceActivePokemonV4): BattleServiceSidePokemonV4 | undefined {
  const rows = snapshot?.requests?.[active.playerId]?.side?.pokemon || snapshot?.debug.latestSidePokemon?.[active.playerId] || [];
  const activeSpecies = toDexId(active.species || speciesIdFromDetails(active.details));
  return rows.find(row => row.active && toDexId(speciesIdFromDetails(row.details)) === activeSpecies)
    || rows.find(row => row.active)
    || rows.find(row => toDexId(speciesIdFromDetails(row.details)) === activeSpecies);
}

function safeMoveDetail(dex: ShowdownDexService, raw: string | undefined): DexMoveDetail | null {
  const id = toDexId(raw);
  if (!id) return null;
  try {
    return dex.getMoveDetail(id);
  } catch {
    return null;
  }
}

function safeSpeciesDetail(dex: ShowdownDexService, raw: string): DexPokemonDetail | null {
  const id = toDexId(raw);
  if (!id) return null;
  for (const candidate of speciesIdCandidates(raw, id)) {
    try {
      return dex.getPokemonDetail(candidate);
    } catch {
      // Try the next cosmetic/base forme fallback.
    }
  }
  return null;
}

function speciesIdCandidates(raw: string, id: string): string[] {
  const candidates = [id];
  const seasonalBase = id.replace(/(spring|summer|autumn|winter)$/i, "");
  if (seasonalBase && seasonalBase !== id) candidates.push(seasonalBase);
  const baseFromHyphen = toDexId(String(raw || "").split(",")[0]?.split("-")[0] || "");
  if (baseFromHyphen && baseFromHyphen !== id) candidates.push(baseFromHyphen);
  return [...new Set(candidates)];
}

function effectiveStats(combatant: BattleAiCombatantV4): Record<DexStatId, number> {
  const rowStats = (combatant.stats || {}) as Partial<Record<DexStatId, number>>;
  const base = (combatant.species?.baseStats || {}) as Partial<Record<DexStatId, number>>;
  return Object.fromEntries(STAT_IDS.map(stat => {
    const rowValue = Number(rowStats[stat]);
    if (Number.isFinite(rowValue) && rowValue > 0) return [stat, rowValue];
    const baseValue = Number(base[stat] || (stat === "hp" ? 80 : 75));
    if (stat === "hp") return [stat, Math.floor(((2 * baseValue + 31) * combatant.level) / 100) + combatant.level + 10];
    return [stat, Math.floor(((2 * baseValue + 31) * combatant.level) / 100) + 5];
  })) as Record<DexStatId, number>;
}

function effectiveMoveType(move: DexMoveDetail, special: ShowdownSpecialChoiceV4 | null | undefined, user: BattleAiCombatantV4): string {
  if (special === "terastallize" && move.id === "terablast" && user.row?.teraType) return user.row.teraType;
  if (move.id === "revelationdance") return user.species?.types[0] || move.typeId || move.type || "Normal";
  return move.typeId || move.type || "Normal";
}

function stabModifier(user: BattleAiCombatantV4, moveType: string, special: ShowdownSpecialChoiceV4 | null | undefined): number {
  const moveTypeId = toDexId(moveType);
  const originalTypes = user.species?.types.map(toDexId) || [];
  const teraType = toDexId(user.row?.teraType || "");
  if (special === "terastallize" && teraType) {
    if (moveTypeId === teraType && originalTypes.includes(moveTypeId)) return 2;
    if (moveTypeId === teraType || originalTypes.includes(moveTypeId)) return 1.5;
    return 1;
  }
  return originalTypes.includes(moveTypeId) ? 1.5 : 1;
}

function abilityImmunity(target: BattleAiCombatantV4, moveType: string): string | null {
  const ability = toDexId(target.ability);
  const type = toDexId(moveType);
  if (ability === "levitate" && type === "ground") return "Levitate";
  if (ability === "flashfire" && type === "fire") return "Flash Fire";
  if (ability === "voltabsorb" && type === "electric") return "Volt Absorb";
  if (ability === "lightningrod" && type === "electric") return "Lightning Rod";
  if (ability === "motordrive" && type === "electric") return "Motor Drive";
  if (ability === "waterabsorb" && type === "water") return "Water Absorb";
  if (ability === "stormdrain" && type === "water") return "Storm Drain";
  if (ability === "dryskin" && type === "water") return "Dry Skin";
  if (ability === "sapsipper" && type === "grass") return "Sap Sipper";
  if (ability === "eartheater" && type === "ground") return "Earth Eater";
  if (ability === "wellbakedbody" && type === "fire") return "Well-Baked Body";
  return null;
}

function effectiveBasePower(move: DexMoveDetail, special: ShowdownSpecialChoiceV4 | null | undefined): number {
  if (special === "zmove") return Math.max(100, Math.min(200, Math.round((move.power || 1) * 1.75)));
  if (special === "max") return Math.max(90, Math.min(150, move.power >= 100 ? 150 : move.power >= 75 ? 130 : 110));
  return Math.max(0, Number(move.power || 0));
}

function moveAccuracy(move: DexMoveDetail | null): number {
  if (!move) return 80;
  return move.accuracy === null ? 100 : Math.max(1, Math.min(100, Number(move.accuracy || 100)));
}

function burnAdjustedAttack(user: BattleAiCombatantV4, attack: number, move: DexMoveDetail): number {
  if (user.status !== "brn") return attack;
  if (["facade"].includes(move.id)) return attack;
  return Math.floor(attack / 2);
}

function specialDefense(snapshot: BattleServiceSnapshotV4, target: BattleAiCombatantV4, spd: number): number {
  const sand = snapshot.rawLog.slice().reverse().find(line => line.includes("|-weather|") || line.includes("|upkeep"));
  const sandActive = Boolean(sand?.toLowerCase().includes("sandstorm"));
  if (!sandActive || !target.species?.types.map(toDexId).includes("rock")) return spd;
  return Math.floor(spd * 1.5);
}

function weatherModifier(snapshot: BattleServiceSnapshotV4, moveType: string): number {
  const weatherLine = snapshot.rawLog.slice().reverse().find(line => line.includes("|-weather|"));
  const weather = weatherLine?.toLowerCase() || "";
  const type = toDexId(moveType);
  if ((weather.includes("sunnyday") || weather.includes("harsh sunlight")) && type === "fire") return 1.5;
  if ((weather.includes("sunnyday") || weather.includes("harsh sunlight")) && type === "water") return 0.5;
  if ((weather.includes("raindance") || weather.includes("rain")) && type === "water") return 1.5;
  if ((weather.includes("raindance") || weather.includes("rain")) && type === "fire") return 0.5;
  return 1;
}

function terrainModifier(snapshot: BattleServiceSnapshotV4, moveType: string, target: string): number {
  const terrainLine = snapshot.rawLog.slice().reverse().find(line => line.includes("|-fieldstart|") || line.includes("|-fieldend|"));
  if (!terrainLine || terrainLine.includes("|-fieldend|")) return 1;
  const line = terrainLine.toLowerCase();
  const type = toDexId(moveType);
  if (line.includes("electricterrain") && type === "electric") return 1.3;
  if (line.includes("grassyterrain") && type === "grass") return 1.3;
  if (line.includes("psychicterrain") && type === "psychic") return 1.3;
  return 1;
}

function itemModifier(user: BattleAiCombatantV4, move: DexMoveDetail): number {
  const item = toDexId(user.item);
  const type = toDexId(move.type || move.typeId);
  if (!item) return 1;
  if (item === "lifeorb") return 1.3;
  if (item === "choicespecs" && move.categoryId === "special") return 1.5;
  if (item === "choiceband" && move.categoryId === "physical") return 1.5;
  if (item === `${type}gem`) return 1.3;
  return 1;
}

function abilityModifier(user: BattleAiCombatantV4, move: DexMoveDetail, snapshot: BattleServiceSnapshotV4): number {
  const ability = toDexId(user.ability);
  const type = toDexId(move.type || move.typeId);
  if (!ability) return 1;
  if (ability === "adaptability" && user.species?.types.map(toDexId).includes(type)) return 4 / 3;
  if (ability === "sandforce" && rawWeather(snapshot).includes("sandstorm") && ["rock", "ground", "steel"].includes(type)) return 1.3;
  if (ability === "technician" && move.power > 0 && move.power <= 60) return 1.5;
  return 1;
}

function utilityScoreForMove(move: DexMoveDetail | null, _request: BattleServiceRequestV4, _activeIndex: number, user: BattleAiCombatantV4): number {
  if (!move || move.power > 0 || move.categoryId !== "status") return 0;
  const id = move.id;
  const hpRatio = user.maxHp > 0 ? user.hp / user.maxHp : 1;
  if (["protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "wideguard", "quickguard"].includes(id)) return hpRatio < 0.5 ? 42 : 18;
  if (["recover", "roost", "rest", "synthesis", "moonlight", "morningsun", "softboiled", "slackoff", "wish"].includes(id)) return hpRatio < 0.5 ? 55 : 8;
  if (["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "growth", "shellsmash"].includes(id)) return hpRatio > 0.55 ? 32 : 8;
  if (["raindance", "sunnyday", "sandstorm", "hail", "snowscape"].includes(id)) return 24;
  if (["trickroom", "tailwind", "icywind", "electroweb", "stringshot"].includes(id)) return 26;
  if (["thunderwave", "willowisp", "toxic", "yawn", "taunt", "encore"].includes(id)) return 25;
  return 12;
}

function emptyEvaluation(diagnostics: Record<string, unknown>): BattleAiMoveEvaluationV4 {
  return {
    expectedDamageRange: {min: 0, max: 0, average: 0},
    expectedDamageRatio: 0,
    typeMultiplier: 1,
    stab: 1,
    accuracy: 100,
    koChance: 0,
    targetScore: 0,
    utilityScore: 0,
    finalScore: 0,
    diagnostics,
  };
}

function typeScore(multiplier: number): number {
  if (multiplier <= 0) return -90;
  if (multiplier >= 4) return 48;
  if (multiplier >= 2) return 28;
  if (multiplier <= 0.25) return -42;
  if (multiplier <= 0.5) return -24;
  return 0;
}

function hpFromCondition(condition: string, activeHp?: number, activeMaxHp?: number): {hp: number; maxHp: number} {
  if (condition.includes("fnt")) return {hp: 0, maxHp: activeMaxHp || 1};
  const match = /^(\d+)\/(\d+)/.exec(condition);
  if (match) return {hp: Number(match[1]), maxHp: Number(match[2]) || 1};
  if (typeof activeHp === "number" && typeof activeMaxHp === "number") return {hp: activeHp, maxHp: activeMaxHp || 1};
  return {hp: 100, maxHp: 100};
}

function speciesIdFromDetails(details: string): string {
  const raw = String(details || "").split(",")[0] || "";
  return toDexId(raw);
}

function levelFromDetails(details: string): number {
  const match = /(?:^|,\s*)L(\d+)/i.exec(details);
  return match ? Number(match[1]) || 50 : 50;
}

function statusFromCondition(condition: string): string {
  const match = /\s([a-z]{2,3})$/.exec(condition);
  return match?.[1] || "";
}

function rawWeather(snapshot: BattleServiceSnapshotV4): string {
  return snapshot.rawLog.slice().reverse().find(line => line.includes("|-weather|"))?.toLowerCase() || "";
}
