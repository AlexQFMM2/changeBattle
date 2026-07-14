import type {TrainingModeV4, TrainingRuleSetV4, ShowdownPlayerIdV4, BattleAiLevelV4} from "./types.js";
import {loadShowdownTeamsV4} from "./showdownVendor.js";

export type ShowdownRandomTeamPokemonSetV4 = {
  name: string;
  species: string;
  item?: string;
  ability: string;
  moves: string[];
  nature: string;
  gender?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  level: number;
  shiny?: boolean;
  happiness?: number;
  pokeball?: string;
  hpType?: string;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  teraType?: string;
};

export type ShowdownTeamArchetypeV4 =
  | "balanced"
  | "rain"
  | "sun"
  | "sand"
  | "snow"
  | "trick-room"
  | "tailwind"
  | "terrain"
  | "hazard-stack"
  | "poison-stall"
  | "baton-pass"
  | "setup-offense";

export type ShowdownPokemonFilterV4 = {
  speciesIds?: string[];
  excludedSpeciesIds?: string[];
};

export type ShowdownRandomTeamGeneratorInputV4 = {
  ruleSet?: TrainingRuleSetV4;
  mode?: TrainingModeV4;
  formatOverride?: string;
  seed?: string | number | number[];
  teamSize?: number;
  playerId?: ShowdownPlayerIdV4;
  localTeamName?: string;
  pokemonFilter?: string[] | ShowdownPokemonFilterV4;
  teamArchetype?: ShowdownTeamArchetypeV4;
  archetypeAttempts?: number;
  strictArchetype?: boolean;
  aiLevel?: BattleAiLevelV4;
};

export type ShowdownRandomTeamGeneratorDiagnosticsV4 = {
  ok: boolean;
  requestedRuleSet: TrainingRuleSetV4;
  resolvedRuleSet: Exclude<TrainingRuleSetV4, "standard">;
  requestedMode: TrainingModeV4;
  formatId: string | null;
  fallbackFormatId?: string;
  seed: number[] | null;
  teamSize: number | null;
  pokemonFilter: {
    requestedSpeciesIds: string[];
    excludedSpeciesIds: string[];
    matchedSpeciesIds: string[];
  } | null;
  archetype: {
    id: ShowdownTeamArchetypeV4;
    attempts: number;
    bestScore: number;
    structureScore?: number;
    fulfilledRequirements?: string[];
    missingRequirements?: string[];
    matchedPoolSize: number;
  } | null;
  moveQuality: {
    aiLevel: BattleAiLevelV4;
    minMoveSlots: number;
    maxMoveSlots: number;
    adjustedPokemon: string[];
  } | null;
  messages: string[];
  elapsedMs: number;
};

export type ShowdownRandomTeamGeneratorResultV4 = {
  formatId: string | null;
  pokemonSets: ShowdownRandomTeamPokemonSetV4[];
  packedTeam: string;
  exportedTeam: string;
  diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4;
};

type ShowdownTeamsApiV4 = {
  Teams: {
    generate(format: string, options?: {seed?: number[] | null} | null): ShowdownRandomTeamPokemonSetV4[];
    getGenerator(format: string, seed?: number[] | null): ShowdownRandomTeamGeneratorLikeV4;
    pack(team: ShowdownRandomTeamPokemonSetV4[] | null): string;
    export(team: ShowdownRandomTeamPokemonSetV4[]): string;
  };
};

let showdownTeamsPromise: Promise<ShowdownTeamsApiV4["Teams"]> | null = null;

async function getShowdownTeams(): Promise<ShowdownTeamsApiV4["Teams"]> {
  if (typeof window !== "undefined") {
    throw new Error("Showdown 随机队伍生成器只能在 Node 环境运行；浏览器启动路径不会加载 vendor。");
  }
  showdownTeamsPromise ||= loadShowdownTeamsV4() as Promise<ShowdownTeamsApiV4["Teams"]>;
  return showdownTeamsPromise;
}

type ShowdownRandomSetDataV4 = {
  level?: number;
  sets?: Array<{
    role?: string;
    movepool?: string[];
    abilities?: string[];
    teraTypes?: string[];
  }>;
};

type ShowdownRandomTeamGeneratorLikeV4 = {
  getTeam(options?: unknown): ShowdownRandomTeamPokemonSetV4[];
  randomSets?: Record<string, ShowdownRandomSetDataV4>;
  randomDoublesSets?: Record<string, ShowdownRandomSetDataV4>;
  randomMegaSets?: Record<string, ShowdownRandomSetDataV4>;
  randomFactorySets?: Record<string, ShowdownRandomSetDataV4>;
  randomBSSFactorySets?: Record<string, ShowdownRandomSetDataV4>;
  random1v1FactorySets?: Record<string, ShowdownRandomSetDataV4>;
};

type RandomSetTableNameV4 =
  | "randomSets"
  | "randomDoublesSets"
  | "randomMegaSets"
  | "randomFactorySets"
  | "randomBSSFactorySets"
  | "random1v1FactorySets";

type ShowdownTeamArchetypeStructureV4 = {
  score: number;
  fulfilledRequirements: string[];
  missingRequirements: string[];
};

const FORMAT_BY_RULESET_MODE: Record<Exclude<TrainingRuleSetV4, "standard">, Record<TrainingModeV4, string | null>> = {
  gen9: {
    singles: "[Gen 9] Random Battle",
    doubles: "[Gen 9] Random Doubles Battle",
    coop: "[Gen 9] Multi Random Battle",
  },
  gen8: {
    singles: "[Gen 8] Random Battle",
    doubles: "[Gen 8] Random Doubles Battle",
    coop: "[Gen 8] Multi Random Battle",
  },
  gen7: {
    singles: "[Gen 7] Random Battle",
    doubles: null,
    coop: null,
  },
};

export async function generateShowdownRandomTeamV4(input: ShowdownRandomTeamGeneratorInputV4 = {}): Promise<ShowdownRandomTeamGeneratorResultV4> {
  const startedAt = Date.now();
  const requestedRuleSet = input.ruleSet || "standard";
  const resolvedRuleSet = requestedRuleSet === "standard" ? "gen9" : requestedRuleSet;
  const requestedMode = input.mode || "singles";
  const nativeFormatId = FORMAT_BY_RULESET_MODE[resolvedRuleSet][requestedMode];
  const formatId = input.formatOverride || nativeFormatId;
  const seed = normalizeSeed(input.seed);
  const pokemonFilter = normalizePokemonFilter(input.pokemonFilter);
  const teamArchetype = input.teamArchetype || "balanced";
  const attempts = teamArchetype === "balanced" && !pokemonFilter.requestedSpeciesIds.length && !pokemonFilter.excludedSpeciesIds.length
    ? 1
    : clampInt(input.archetypeAttempts || 16, 1, 64);
  const diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4 = {
    ok: false,
    requestedRuleSet,
    resolvedRuleSet,
    requestedMode,
    formatId,
    fallbackFormatId: input.formatOverride && input.formatOverride !== nativeFormatId ? input.formatOverride : undefined,
    seed,
    teamSize: input.teamSize ? clampInt(input.teamSize, 1, 6) : null,
    pokemonFilter: null,
    archetype: null,
    moveQuality: null,
    messages: [],
    elapsedMs: 0,
  };

  if (!formatId) {
    diagnostics.messages.push(`${resolvedRuleSet} ${requestedMode} 暂无可用的 Showdown 随机队伍格式。`);
    diagnostics.elapsedMs = Date.now() - startedAt;
    return {formatId, pokemonSets: [], packedTeam: "", exportedTeam: "", diagnostics};
  }

  try {
    if (input.formatOverride && input.formatOverride !== nativeFormatId) {
      diagnostics.messages.push(`${resolvedRuleSet} ${requestedMode} 使用 fallback format: ${input.formatOverride}`);
    }
    const teamsApi = await getShowdownTeams();
    let best: {team: ShowdownRandomTeamPokemonSetV4[]; score: number; structure: ShowdownTeamArchetypeStructureV4; matchedPoolSize: number} | null = null;
    const fallbackMessages = new Set<string>();
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const attemptSeed = seedForAttempt(seed, attempt);
      const generator = teamsApi.getGenerator(formatId, attemptSeed);
      let poolDiagnostics = applyGeneratorPoolFilters(generator, {
        mode: requestedMode,
        pokemonFilter,
        teamArchetype,
        strictArchetype: Boolean(input.strictArchetype),
      });
      if (attempt === 0) {
        diagnostics.pokemonFilter = poolDiagnostics.pokemonFilter;
        diagnostics.archetype = {
          id: teamArchetype,
          attempts,
          bestScore: 0,
          matchedPoolSize: poolDiagnostics.archetypeMatchedPoolSize,
        };
        diagnostics.messages.push(...poolDiagnostics.messages);
      }
      let team = safeGenerateTeam(generator);
      if (!team.length && input.strictArchetype) {
        fallbackMessages.add(`${teamArchetype} strict archetype pool could not produce a team; retried with scored soft archetype generation.`);
        const fallbackGenerator = teamsApi.getGenerator(formatId, attemptSeed);
        poolDiagnostics = applyGeneratorPoolFilters(fallbackGenerator, {
          mode: requestedMode,
          pokemonFilter,
          teamArchetype,
          strictArchetype: false,
        });
        team = safeGenerateTeam(fallbackGenerator);
      }
      const normalizedTeam = team.map(normalizeGeneratedSet);
      const structure = evaluateTeamStructureForArchetype(normalizedTeam, teamArchetype);
      const score = scoreTeamForArchetype(normalizedTeam, teamArchetype, structure);
      if (!best || score > best.score || (score === best.score && team.length > best.team.length)) {
        best = {team: normalizedTeam, score, structure, matchedPoolSize: poolDiagnostics.archetypeMatchedPoolSize};
      }
    }
    diagnostics.messages.push(...fallbackMessages);
    const generated = applyAiLevelMoveQualityToTeam(best?.team || [], input.aiLevel, seed, teamArchetype);
    const pokemonSets = input.teamSize ? generated.slice(0, clampInt(input.teamSize, 1, 6)) : generated;
    const finalStructure = evaluateTeamStructureForArchetype(pokemonSets, teamArchetype);
    const finalScore = scoreTeamForArchetype(pokemonSets, teamArchetype, finalStructure);
    const packedTeam = teamsApi.pack(pokemonSets);
    const exportedTeam = teamsApi.export(pokemonSets);
    diagnostics.ok = pokemonSets.length > 0;
    diagnostics.teamSize = pokemonSets.length;
    if (diagnostics.archetype && best) {
      diagnostics.archetype.bestScore = finalScore;
      diagnostics.archetype.structureScore = finalStructure.score;
      diagnostics.archetype.fulfilledRequirements = finalStructure.fulfilledRequirements;
      diagnostics.archetype.missingRequirements = finalStructure.missingRequirements;
      diagnostics.archetype.matchedPoolSize = best.matchedPoolSize;
    }
    if (!pokemonSets.length) diagnostics.messages.push("Showdown 生成结果为空。");
    diagnostics.moveQuality = moveQualityDiagnostics(pokemonSets, input.aiLevel);
    diagnostics.elapsedMs = Date.now() - startedAt;
    return {formatId, pokemonSets, packedTeam, exportedTeam, diagnostics};
  } catch (error) {
    diagnostics.messages.push(error instanceof Error ? error.message : String(error));
    diagnostics.elapsedMs = Date.now() - startedAt;
    return {formatId, pokemonSets: [], packedTeam: "", exportedTeam: "", diagnostics};
  }
}

export async function serializeShowdownTeamV4(team: ShowdownRandomTeamPokemonSetV4[]): Promise<{packedTeam: string; exportedTeam: string}> {
  const teamsApi = await getShowdownTeams();
  return {
    packedTeam: teamsApi.pack(team),
    exportedTeam: teamsApi.export(team),
  };
}

export function resolveShowdownRandomTeamFormatV4(ruleSet: TrainingRuleSetV4 = "standard", mode: TrainingModeV4 = "singles"): string | null {
  const resolvedRuleSet = ruleSet === "standard" ? "gen9" : ruleSet;
  return FORMAT_BY_RULESET_MODE[resolvedRuleSet][mode];
}

function normalizePokemonFilter(filter: ShowdownRandomTeamGeneratorInputV4["pokemonFilter"]): Required<ShowdownPokemonFilterV4> & {requestedSpeciesIds: string[]} {
  const rawSpecies = Array.isArray(filter) ? filter : filter?.speciesIds || [];
  const excluded = Array.isArray(filter) ? [] : filter?.excludedSpeciesIds || [];
  return {
    speciesIds: uniqueIds(rawSpecies),
    requestedSpeciesIds: uniqueIds(rawSpecies),
    excludedSpeciesIds: uniqueIds(excluded),
  };
}

function applyGeneratorPoolFilters(
  generator: ShowdownRandomTeamGeneratorLikeV4,
  input: {
    mode: TrainingModeV4;
    pokemonFilter: ReturnType<typeof normalizePokemonFilter>;
    teamArchetype: ShowdownTeamArchetypeV4;
    strictArchetype: boolean;
  },
): {
  pokemonFilter: NonNullable<ShowdownRandomTeamGeneratorDiagnosticsV4["pokemonFilter"]>;
  archetypeMatchedPoolSize: number;
  messages: string[];
} {
  const requested = new Set(input.pokemonFilter.requestedSpeciesIds);
  const excluded = new Set(input.pokemonFilter.excludedSpeciesIds);
  const matchedSpeciesIds = new Set<string>();
  const archetypeMatchedSpeciesIds = new Set<string>();
  const messages: string[] = [];

  for (const tableName of randomSetTableNames(input.mode)) {
    const table = generator[tableName];
    if (!table) continue;
    const hardFilteredEntries = Object.entries(table).filter(([speciesId]) => {
      const id = toID(speciesId);
      if (requested.size && !requested.has(id)) return false;
      if (excluded.has(id)) return false;
      matchedSpeciesIds.add(id);
      return true;
    });
    const archetypeEntries = hardFilteredEntries.filter(([speciesId, data]) => {
      const matched = scoreRandomSetDataForArchetype(speciesId, data, input.teamArchetype) > 0;
      if (matched) archetypeMatchedSpeciesIds.add(toID(speciesId));
      return matched;
    });
    const useArchetypePool = input.strictArchetype && input.teamArchetype !== "balanced" && archetypeEntries.length >= Math.min(4, hardFilteredEntries.length);
    const nextEntries = useArchetypePool ? archetypeEntries : hardFilteredEntries;
    generator[tableName] = Object.fromEntries(nextEntries);
  }

  if (requested.size && !matchedSpeciesIds.size) {
    messages.push("宝可梦过滤池没有匹配到当前 Showdown 随机队伍格式中的可生成物种。");
  }
  if (input.teamArchetype !== "balanced" && !archetypeMatchedSpeciesIds.size) {
    messages.push(`${input.teamArchetype} 队伍类型没有匹配到可用随机 set，已仅按普通随机队伍评分尝试。`);
  }

  return {
    pokemonFilter: {
      requestedSpeciesIds: Array.from(requested),
      excludedSpeciesIds: Array.from(excluded),
      matchedSpeciesIds: Array.from(matchedSpeciesIds).sort(),
    },
    archetypeMatchedPoolSize: archetypeMatchedSpeciesIds.size,
    messages,
  };
}

function randomSetTableNames(mode: TrainingModeV4): RandomSetTableNameV4[] {
  const common: RandomSetTableNameV4[] = [
    "randomSets",
    "randomDoublesSets",
    "randomMegaSets",
    "randomFactorySets",
    "randomBSSFactorySets",
    "random1v1FactorySets",
  ];
  return mode === "doubles" || mode === "coop"
    ? ["randomDoublesSets", ...common.filter(name => name !== "randomDoublesSets")]
    : common;
}

function normalizeSeed(seed: ShowdownRandomTeamGeneratorInputV4["seed"]): number[] | null {
  if (Array.isArray(seed)) {
    const numbers = seed.filter(value => Number.isFinite(value)).map(value => value >>> 0);
    return numbers.length ? padSeed(numbers) : null;
  }
  if (typeof seed === "number" && Number.isFinite(seed)) return seedFromString(String(seed));
  if (typeof seed === "string" && seed.trim()) return seedFromString(seed.trim());
  return null;
}

function seedForAttempt(seed: number[] | null, attempt: number): number[] | null {
  if (!seed) return attempt ? seedFromString(`attempt-${attempt}`) : null;
  if (!attempt) return seed;
  return seed.map((value, index) => (value + Math.imul(attempt + 1, 0x9e3779b1 + index * 97)) >>> 0);
}

function normalizeGeneratedSet(set: ShowdownRandomTeamPokemonSetV4): ShowdownRandomTeamPokemonSetV4 {
  return {
    ...set,
    name: set.name || set.species,
    item: set.item || "",
    ability: set.ability || "",
    moves: Array.isArray(set.moves) ? set.moves : [],
    nature: set.nature || "Serious",
    level: set.level || 50,
    evs: set.evs || {},
    ivs: set.ivs || {},
  };
}

function applyAiLevelMoveQualityToTeam(
  team: ShowdownRandomTeamPokemonSetV4[],
  aiLevel: BattleAiLevelV4 | undefined,
  seed: number[] | null,
  archetype: ShowdownTeamArchetypeV4,
): ShowdownRandomTeamPokemonSetV4[] {
  if (!aiLevel) return team;
  const moveSlots = moveSlotsForAiLevel(aiLevel);
  return team.map((set, index) => {
    const moves = uniqueIds(set.moves || []);
    if (moves.length <= moveSlots) return {...set, moves};
    return {
      ...set,
      moves: chooseMovesForAiLevel(set, moves, moveSlots, archetype, `${(seed || []).join(":")}:${aiLevel}:${index}`),
    };
  });
}

function moveSlotsForAiLevel(aiLevel: BattleAiLevelV4): number {
  switch (aiLevel) {
    case "rookie":
      return 2;
    case "normal":
    case "elite":
      return 3;
    case "gymLeader":
    case "eliteFour":
    case "champion":
      return 4;
  }
}

function chooseMovesForAiLevel(
  set: ShowdownRandomTeamPokemonSetV4,
  moves: string[],
  moveSlots: number,
  archetype: ShowdownTeamArchetypeV4,
  seedKey: string,
): string[] {
  const scored = moves.map((move, index) => ({
    move,
    index,
    score: movePriorityForArchetype(move, set, archetype) + deterministicJitter(`${seedKey}:${set.species}:${move}`),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored
    .slice(0, Math.max(1, Math.min(4, moveSlots)))
    .sort((a, b) => a.index - b.index)
    .map(entry => entry.move);
}

function movePriorityForArchetype(move: string, set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4): number {
  const moveId = toID(move);
  let score = 1;
  if (isHighValueGeneralMove(moveId)) score += 4;
  if (isPriorityMoveId(moveId)) score += 2;
  if (isRecoveryMoveId(moveId)) score += 2;
  switch (archetype) {
    case "rain":
      if (["raindance", "hurricane", "thunder", "weatherball", "hydropump", "surf", "liquidation", "waterfall"].includes(moveId)) score += 6;
      if (isRainSetter(set) && moveId === "raindance") score += 8;
      break;
    case "sun":
      if (["sunnyday", "solarbeam", "solarblade", "weatherball", "flamethrower", "fireblast", "heatwave"].includes(moveId)) score += 6;
      if (isSunSetter(set) && moveId === "sunnyday") score += 8;
      break;
    case "trick-room":
      if (moveId === "trickroom") score += 12;
      if (["gyroball", "bodypress", "curse"].includes(moveId)) score += 4;
      break;
    case "sand":
      if (["sandstorm", "earthquake", "earthpower", "stoneedge", "rockslide", "shoreup"].includes(moveId)) score += 4;
      break;
    case "snow":
      if (["snowscape", "hail", "auroraveil", "blizzard", "freezedry", "icebeam"].includes(moveId)) score += 5;
      break;
    case "tailwind":
      if (moveId === "tailwind") score += 10;
      break;
    case "terrain":
      if (["electricterrain", "grassyterrain", "mistyterrain", "psychicterrain", "expandingforce", "terrainpulse"].includes(moveId)) score += 5;
      break;
    case "hazard-stack":
      if (["stealthrock", "spikes", "toxicspikes", "stickyweb"].includes(moveId)) score += 10;
      break;
    case "poison-stall":
      if (["toxic", "toxicspikes", "protect", "substitute", "recover", "roost", "wish", "haze"].includes(moveId)) score += 5;
      break;
    case "baton-pass":
      if (moveId === "batonpass") score += 10;
      break;
    case "setup-offense":
      if (isSetupMoveId(moveId)) score += 8;
      break;
    case "balanced":
      break;
  }
  return score;
}

function isHighValueGeneralMove(moveId: string): boolean {
  return [
    "stealthrock", "spikes", "toxicspikes", "stickyweb", "rapidspin", "defog",
    "uturn", "voltswitch", "partingshot", "knockoff", "protect",
    "toxic", "willowisp", "thunderwave",
    "swordsdance", "nastyplot", "dragondance", "quiverdance", "calmmind", "shellsmash", "bulkup",
  ].includes(moveId);
}

function isSetupMoveId(moveId: string): boolean {
  return ["swordsdance", "nastyplot", "dragondance", "quiverdance", "calmmind", "shellsmash", "bulkup", "irondefense", "coil"].includes(moveId);
}

function isRecoveryMoveId(moveId: string): boolean {
  return ["recover", "roost", "slackoff", "wish", "moonlight", "synthesis", "shoreup"].includes(moveId);
}

function isPriorityMoveId(moveId: string): boolean {
  return ["aquajet", "extremespeed", "suckerpunch", "iceshard", "machpunch", "bulletpunch", "shadowsneak", "vacuumwave", "firstimpression"].includes(moveId);
}

function moveQualityDiagnostics(
  pokemonSets: ShowdownRandomTeamPokemonSetV4[],
  aiLevel: BattleAiLevelV4 | undefined,
): ShowdownRandomTeamGeneratorDiagnosticsV4["moveQuality"] {
  if (!aiLevel) return null;
  const moveCounts = pokemonSets.map(set => set.moves?.length || 0);
  if (!moveCounts.length) {
    return {aiLevel, minMoveSlots: 0, maxMoveSlots: 0, adjustedPokemon: []};
  }
  return {
    aiLevel,
    minMoveSlots: Math.min(...moveCounts),
    maxMoveSlots: Math.max(...moveCounts),
    adjustedPokemon: pokemonSets.filter(set => (set.moves?.length || 0) < 4).map(set => set.species),
  };
}

function deterministicJitter(seedKey: string): number {
  const seed = seedFromString(seedKey);
  return ((seed[0] || 0) % 1000) / 10000;
}

function safeGenerateTeam(generator: ShowdownRandomTeamGeneratorLikeV4): ShowdownRandomTeamPokemonSetV4[] {
  try {
    return generator.getTeam(null) || [];
  } catch {
    return [];
  }
}

function scoreRandomSetDataForArchetype(speciesId: string, data: ShowdownRandomSetDataV4, archetype: ShowdownTeamArchetypeV4): number {
  if (archetype === "balanced") return 1;
  let score = 0;
  for (const set of data.sets || []) {
    score = Math.max(score, scoreSignalsForArchetype(archetype, {
      speciesId,
      ability: (set.abilities || []).join(" "),
      moves: set.movepool || [],
      role: set.role || "",
    }));
  }
  return score;
}

function scoreTeamForArchetype(team: ShowdownRandomTeamPokemonSetV4[], archetype: ShowdownTeamArchetypeV4, structure = evaluateTeamStructureForArchetype(team, archetype)): number {
  if (archetype === "balanced") return team.length;
  const signalScore = team.reduce((total, set) => total + scoreSignalsForArchetype(archetype, {
    speciesId: set.species,
    ability: set.ability,
    moves: set.moves || [],
    role: "",
  }), 0);
  return signalScore + structure.score;
}

function evaluateTeamStructureForArchetype(team: ShowdownRandomTeamPokemonSetV4[], archetype: ShowdownTeamArchetypeV4): ShowdownTeamArchetypeStructureV4 {
  if (archetype === "balanced") {
    return {score: team.length, fulfilledRequirements: ["balanced-team"], missingRequirements: []};
  }
  const fulfilled: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const mark = (ok: boolean, requirement: string, points: number) => {
    if (ok) {
      fulfilled.push(requirement);
      score += points;
    } else {
      missing.push(requirement);
      score -= Math.ceil(points * 0.6);
    }
  };
  const has = (predicate: (set: ShowdownRandomTeamPokemonSetV4) => boolean): boolean => team.some(predicate);
  const count = (predicate: (set: ShowdownRandomTeamPokemonSetV4) => boolean): number => team.filter(predicate).length;
  switch (archetype) {
    case "rain":
      mark(has(isRainSetter), "rain-setter", 18);
      mark(has(isRainAbuser), "rain-abuser", 12);
      score += Math.min(6, count(hasWaterPressure) * 2);
      if (has(set => isConflictingWeatherSetter(set, "rain"))) {
        missing.push("avoid-conflicting-weather-setter");
        score -= 18;
      }
      if (has(isRainCoverageMember)) {
        fulfilled.push("off-plan-coverage");
        score += 5;
      }
      break;
    case "sun":
      mark(has(isSunSetter), "sun-setter", 18);
      mark(has(isSunAbuser), "sun-abuser", 12);
      score += Math.min(6, count(hasSunPressure) * 2);
      if (has(set => isConflictingWeatherSetter(set, "sun"))) {
        missing.push("avoid-conflicting-weather-setter");
        score -= 18;
      }
      if (has(isSunCoverageMember)) {
        fulfilled.push("off-plan-coverage");
        score += 5;
      }
      break;
    case "sand":
      mark(has(isSandSetter), "sand-setter", 18);
      if (has(set => isConflictingWeatherSetter(set, "sand"))) {
        missing.push("avoid-conflicting-weather-setter");
        score -= 14;
      }
      if (has(isSandAbuser)) {
        fulfilled.push("sand-abuser");
        score += 10;
      } else {
        mark(count(isSandCoreMember) >= 2, "sand-core", 8);
      }
      score += Math.min(6, count(hasSandPressure) * 2);
      break;
    case "snow":
      mark(has(isSnowSetter), "snow-setter", 18);
      mark(hasMoveInTeam(team, "auroraveil") || has(isSnowAbuser), "aurora-veil-or-snow-abuser", 10);
      if (has(set => isConflictingWeatherSetter(set, "snow"))) {
        missing.push("avoid-conflicting-weather-setter");
        score -= 14;
      }
      score += Math.min(6, count(hasSnowPressure) * 2);
      break;
    case "trick-room":
      mark(has(isTrickRoomSetter), "trick-room-setter", 22);
      mark(count(isBulkyOrSlowAttacker) >= 1, "slow-or-bulky-attacker", 10);
      if (has(isTrickRoomFailsafe)) {
        fulfilled.push("outside-trick-room-failsafe");
        score += 6;
      }
      break;
    case "tailwind":
      mark(hasMoveInTeam(team, "tailwind"), "tailwind-setter", 20);
      mark(count(isFastPressure) >= 1, "fast-pressure", 8);
      break;
    case "terrain":
      mark(has(isTerrainSetter), "terrain-setter", 18);
      mark(has(isTerrainAbuser), "terrain-abuser", 8);
      break;
    case "hazard-stack": {
      const hazardCount = count(isHazardSetter);
      mark(hazardCount >= 1, "hazard-setter", 18);
      if (hazardCount >= 2) {
        fulfilled.push("multiple-hazards");
        score += 8;
      }
      break;
    }
    case "poison-stall":
      mark(has(isPoisonProgress), "poison-progress", 14);
      mark(has(isStallSustain), "stall-sustain", 12);
      break;
    case "baton-pass":
      mark(hasMoveInTeam(team, "batonpass"), "baton-pass", 20);
      mark(has(isSetupUser), "passable-setup", 8);
      break;
    case "setup-offense":
      mark(has(isSetupUser), "setup-sweeper", 18);
      mark(count(isOffensivePressure) >= 2, "offensive-pressure", 10);
      break;
  }
  return {
    score,
    fulfilledRequirements: fulfilled,
    missingRequirements: missing,
  };
}

function scoreSignalsForArchetype(
  archetype: ShowdownTeamArchetypeV4,
  input: {speciesId: string; ability: string; moves: string[]; role: string},
): number {
  const ability = toID(input.ability);
  const moves = new Set((input.moves || []).map(toID));
  const role = input.role.toLowerCase();
  let score = 0;
  const hasMove = (...ids: string[]) => ids.some(id => moves.has(toID(id)));
  const hasAbility = (...ids: string[]) => ids.some(id => ability.includes(toID(id)));
  switch (archetype) {
    case "rain":
      if (hasAbility("drizzle")) score += 5;
      if (hasAbility("swiftswim", "raindish")) score += 3;
      if (hasMove("raindance", "hurricane", "thunder", "weatherball")) score += 1;
      break;
    case "sun":
      if (hasAbility("drought")) score += 5;
      if (hasAbility("chlorophyll", "solarpower", "protosynthesis")) score += 3;
      if (hasMove("sunnyday", "solarbeam", "solarblade", "weatherball")) score += 1;
      break;
    case "sand":
      if (hasAbility("sandstream")) score += 5;
      if (hasAbility("sandrush", "sandforce", "sandveil")) score += 3;
      if (hasMove("sandstorm", "shoreup")) score += 1;
      break;
    case "snow":
      if (hasAbility("snowwarning")) score += 5;
      if (hasAbility("slushrush", "icebody")) score += 3;
      if (hasMove("snowscape", "auroraveil", "blizzard")) score += 1;
      break;
    case "trick-room":
      if (hasMove("trickroom")) score += 5;
      if (role.includes("bulky") || role.includes("wallbreaker")) score += 1;
      break;
    case "tailwind":
      if (hasMove("tailwind")) score += 5;
      if (role.includes("fast")) score += 1;
      break;
    case "terrain":
      if (hasAbility("electricsurge", "grassysurge", "mistysurge", "psychicsurge")) score += 5;
      if (hasMove("electricterrain", "grassyterrain", "mistyterrain", "psychicterrain", "expandingforce", "terrainpulse")) score += 2;
      break;
    case "hazard-stack":
      if (hasMove("stealthrock", "spikes", "toxicspikes", "stickyweb", "mortalspin", "rapidspin")) score += 4;
      if (role.includes("support")) score += 1;
      break;
    case "poison-stall":
      if (hasMove("toxic", "toxicspikes", "protect", "substitute", "recover", "roost", "wish", "haze")) score += 2;
      if (hasAbility("regenerator", "poisonheal", "magicguard")) score += 2;
      if (role.includes("bulky") || role.includes("support")) score += 1;
      break;
    case "baton-pass":
      if (hasMove("batonpass")) score += 5;
      if (hasMove("substitute", "swordsdance", "nastyplot", "calmmind", "quiverdance", "shellsmash", "agility")) score += 1;
      break;
    case "setup-offense":
      if (hasMove("swordsdance", "nastyplot", "dragondance", "quiverdance", "calmmind", "shellsmash", "bulkup", "irondefense")) score += 4;
      if (role.includes("setup")) score += 3;
      if (role.includes("attacker") || role.includes("sweeper")) score += 1;
      break;
    case "balanced":
      return 1;
  }
  return score;
}

function isRainSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "drizzle") || hasMove(set, "raindance");
}

function isRainAbuser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "swiftswim", "raindish") || hasMove(set, "hurricane", "thunder", "weatherball");
}

function hasWaterPressure(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "surf", "hydropump", "liquidation", "waterfall", "wavecrash", "scald", "weatherball");
}

function isRainCoverageMember(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return !isRainSetter(set) && !isRainAbuser(set) && isCoverageOrUtilityMember(set);
}

function isSunSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "drought") || hasMove(set, "sunnyday");
}

function isSunAbuser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "chlorophyll", "solarpower", "protosynthesis") || hasMove(set, "solarbeam", "solarblade", "weatherball");
}

function hasSunPressure(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "flamethrower", "fireblast", "heatwave", "flareblitz", "weatherball", "solarbeam", "solarblade");
}

function isSunCoverageMember(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return !isSunSetter(set) && !isSunAbuser(set) && isCoverageOrUtilityMember(set);
}

function isConflictingWeatherSetter(set: ShowdownRandomTeamPokemonSetV4, archetype: Extract<ShowdownTeamArchetypeV4, "rain" | "sun" | "sand" | "snow">): boolean {
  if (archetype !== "rain" && isRainSetter(set)) return true;
  if (archetype !== "sun" && isSunSetter(set)) return true;
  if (archetype !== "sand" && isSandSetter(set)) return true;
  if (archetype !== "snow" && isSnowSetter(set)) return true;
  return false;
}

function isSandSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "sandstream") || hasMove(set, "sandstorm");
}

function isSandAbuser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "sandrush", "sandforce", "sandveil") || hasMove(set, "shoreup");
}

function isSandCoreMember(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "sandstream", "sandrush", "sandforce", "sandveil") ||
    hasMove(set, "earthquake", "earthpower", "stoneedge", "rockslide", "stealthrock", "shoreup", "rapidspin") ||
    ["rock", "steel", "ground"].some(type => toID(set.teraType || "") === type);
}

function hasSandPressure(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "earthquake", "earthpower", "stoneedge", "rockslide", "stealthrock", "shoreup");
}

function isSnowSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "snowwarning") || hasMove(set, "snowscape", "hail");
}

function isSnowAbuser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "slushrush", "icebody") || hasMove(set, "auroraveil", "blizzard");
}

function hasSnowPressure(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "blizzard", "freezedry", "icebeam", "iciclecrash", "auroraveil");
}

function isTrickRoomSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "trickroom");
}

function isBulkyOrSlowAttacker(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "recover", "roost", "slackoff", "wish", "bodypress", "gyroball", "curse") ||
    hasAbility(set, "regenerator", "unaware", "sturdy") ||
    /slow|bulky|wall|tank/i.test(String((set as {role?: string}).role || ""));
}

function isTrickRoomFailsafe(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return !isTrickRoomSetter(set) && (isFastPressure(set) || isPriorityUser(set) || hasMove(set, "uturn", "voltswitch", "partingshot"));
}

function isFastPressure(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "uturn", "voltswitch", "knockoff", "hurricane", "bravebird", "acrobatics") ||
    hasAbility(set, "speedboost", "prankster");
}

function isCoverageOrUtilityMember(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return isOffensivePressure(set) ||
    isHazardSetter(set) ||
    isFastPressure(set) ||
    isStallSustain(set) ||
    hasMove(set, "rapidspin", "defog", "uturn", "voltswitch", "partingshot", "knockoff", "toxic", "willowisp", "thunderwave");
}

function isPriorityUser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "aquajet", "extremespeed", "suckerpunch", "iceshard", "machpunch", "bulletpunch", "shadowsneak", "vacuumwave", "firstimpression");
}

function isTerrainSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "electricsurge", "grassysurge", "mistysurge", "psychicsurge") ||
    hasMove(set, "electricterrain", "grassyterrain", "mistyterrain", "psychicterrain");
}

function isTerrainAbuser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "expandingforce", "terrainpulse", "grassyglide", "risingvoltage");
}

function isHazardSetter(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "stealthrock", "spikes", "toxicspikes", "stickyweb");
}

function isPoisonProgress(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "toxic", "toxicspikes", "willowisp", "spore");
}

function isStallSustain(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "protect", "substitute", "recover", "roost", "wish", "haze") ||
    hasAbility(set, "regenerator", "poisonheal", "magicguard");
}

function isSetupUser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "swordsdance", "nastyplot", "dragondance", "quiverdance", "calmmind", "shellsmash", "bulkup", "irondefense", "coil");
}

function isOffensivePressure(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return isSetupUser(set) || hasMove(set, "closecombat", "earthquake", "hydropump", "dracometeor", "knockoff", "stoneedge", "thunderbolt", "moonblast", "shadowball", "liquidation");
}

function hasMoveInTeam(team: ShowdownRandomTeamPokemonSetV4[], ...ids: string[]): boolean {
  return team.some(set => hasMove(set, ...ids));
}

function hasMove(set: ShowdownRandomTeamPokemonSetV4, ...ids: string[]): boolean {
  const moves = new Set((set.moves || []).map(toID));
  return ids.some(id => moves.has(toID(id)));
}

function hasAbility(set: ShowdownRandomTeamPokemonSetV4, ...ids: string[]): boolean {
  const ability = toID(set.ability);
  return ids.some(id => ability.includes(toID(id)));
}

function seedFromString(seed: string): number[] {
  let a = 0x9e3779b9;
  let b = 0x243f6a88;
  let c = 0xb7e15162;
  let d = 0xdeadbeef;
  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index);
    a = Math.imul(a ^ code, 2654435761) >>> 0;
    b = Math.imul(b + code + index, 1597334677) >>> 0;
    c = Math.imul(c ^ (code << (index % 8)), 2246822519) >>> 0;
    d = Math.imul(d + (code ^ index), 3266489917) >>> 0;
  }
  return [a, b, c, d];
}

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.map(toID).filter(Boolean)));
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function padSeed(seed: number[]): number[] {
  const padded = seed.slice(0, 4);
  while (padded.length < 4) padded.push(seedFromString(`seed-${padded.length}-${padded[0] || 0}`)[padded.length]!);
  return padded;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}
