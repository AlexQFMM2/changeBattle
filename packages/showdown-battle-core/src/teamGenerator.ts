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

export type ShowdownTeamGenerationPurposeV4 = "player-starter" | "npc-battle" | "boss-battle" | "ai-exam";
export type ShowdownTeamGenerationQualityV4 = "loose" | "structured" | "strict";

export type ShowdownTeamGenerationProfileHintsV4 = {
  preferredArchetypes?: ShowdownTeamArchetypeV4[];
  weakAgainst?: string[];
  overusedPatterns?: string[];
  recentLossReasons?: string[];
};

export type ShowdownDoublesRecommendedLeadPairV4 = {
  indexes: [number, number];
  species: [string, string];
  score: number;
  reasons: string[];
};

export type ShowdownDoublesTeamDiagnosticsV4 = {
  protectCount: number;
  speedControlCount: number;
  spreadAttackerCount: number;
  utilityControlCount: number;
  fakeOutCount: number;
  redirectionCount: number;
  weatherSetterCount: number;
  weatherAbuserCount: number;
  trickRoomSetterCount: number;
  trickRoomAttackerCount: number;
  leadPairScore: number;
  recommendedLeadPairs: ShowdownDoublesRecommendedLeadPairV4[];
  antiSynergy: string[];
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
  purpose?: ShowdownTeamGenerationPurposeV4;
  quality?: ShowdownTeamGenerationQualityV4;
  playerProfileHints?: ShowdownTeamGenerationProfileHintsV4;
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
    purpose?: ShowdownTeamGenerationPurposeV4;
    quality?: ShowdownTeamGenerationQualityV4;
    structureScore?: number;
    selectedSubsetScore?: number;
    candidateTeamScore?: number;
    selectedFromCandidateSize?: number;
    coreComplete?: boolean;
    fulfilledRequirements?: string[];
    missingRequirements?: string[];
    doubles?: ShowdownDoublesTeamDiagnosticsV4;
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
  coreComplete: boolean;
  fulfilledRequirements: string[];
  missingRequirements: string[];
  doubles?: ShowdownDoublesTeamDiagnosticsV4;
};

type ShowdownTeamSelectionV4 = {
  team: ShowdownRandomTeamPokemonSetV4[];
  score: number;
  structure: ShowdownTeamArchetypeStructureV4;
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
  const purpose = normalizeGenerationPurpose(input.purpose);
  const quality = normalizeGenerationQuality(input.quality, purpose, input.strictArchetype);
  const attempts = teamArchetype === "balanced" && !pokemonFilter.requestedSpeciesIds.length && !pokemonFilter.excludedSpeciesIds.length
    ? 1
    : clampInt(input.archetypeAttempts || 16, 1, 64);
  const targetTeamSize = input.teamSize ? clampInt(input.teamSize, 1, 6) : null;
  const diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4 = {
    ok: false,
    requestedRuleSet,
    resolvedRuleSet,
    requestedMode,
    formatId,
    fallbackFormatId: input.formatOverride && input.formatOverride !== nativeFormatId ? input.formatOverride : undefined,
    seed,
    teamSize: targetTeamSize,
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
    let best: {
      team: ShowdownRandomTeamPokemonSetV4[];
      score: number;
      structure: ShowdownTeamArchetypeStructureV4;
      candidateTeamScore: number;
      selectedFromCandidateSize: number;
      matchedPoolSize: number;
    } | null = null;
    const accumulatedSets: ShowdownRandomTeamPokemonSetV4[] = [];
    const fallbackMessages = new Set<string>();
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const attemptSeed = seedForAttempt(seed, attempt);
      const generator = teamsApi.getGenerator(formatId, attemptSeed);
      let poolDiagnostics = applyGeneratorPoolFilters(generator, {
        mode: requestedMode,
        pokemonFilter,
        teamArchetype,
        strictArchetype: shouldUseStrictPool(input.strictArchetype, quality),
      });
      if (attempt === 0) {
        diagnostics.pokemonFilter = poolDiagnostics.pokemonFilter;
        diagnostics.archetype = {
          id: teamArchetype,
          attempts,
          bestScore: 0,
          purpose,
          quality,
          matchedPoolSize: poolDiagnostics.archetypeMatchedPoolSize,
        };
        diagnostics.messages.push(...poolDiagnostics.messages);
      }
      if (shouldUseStrictPool(input.strictArchetype, quality)) {
        accumulatedSets.push(...syntheticArchetypeSetsFromGenerator(generator, requestedMode, teamArchetype, input.aiLevel, attemptSeed));
      }
      let team = safeGenerateTeam(generator);
      if (!team.length && shouldUseStrictPool(input.strictArchetype, quality)) {
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
      const candidateTeamStructure = evaluateTeamStructureForMode(normalizedTeam, teamArchetype, requestedMode);
      const candidateTeamScore = scoreTeamForMode(normalizedTeam, teamArchetype, requestedMode, candidateTeamStructure, input.playerProfileHints);
      const qualityAdjustedTeam = applyAiLevelMoveQualityToTeam(normalizedTeam, input.aiLevel, attemptSeed, teamArchetype, requestedMode);
      accumulatedSets.push(...qualityAdjustedTeam);
      const selected = selectBestTeamSubsetForArchetype(qualityAdjustedTeam, {
        teamSize: targetTeamSize,
        archetype: teamArchetype,
        mode: requestedMode,
        quality,
        playerProfileHints: input.playerProfileHints,
      });
      if (!best || compareTeamSelection(selected, best) > 0) {
        best = {
          team: selected.team,
          score: selected.score,
          structure: selected.structure,
          candidateTeamScore,
          selectedFromCandidateSize: normalizedTeam.length,
          matchedPoolSize: poolDiagnostics.archetypeMatchedPoolSize,
        };
      }
      if (quality === "strict" && selected.structure.coreComplete) {
        break;
      }
    }
    if (quality === "strict" && targetTeamSize && best && !best.structure.coreComplete) {
      const pooledCandidates = pooledSubsetCandidates(accumulatedSets, teamArchetype, requestedMode, targetTeamSize, input.playerProfileHints);
      const pooledSelection = selectBestTeamSubsetForArchetype(pooledCandidates, {
        teamSize: targetTeamSize,
        archetype: teamArchetype,
        mode: requestedMode,
        quality,
        playerProfileHints: input.playerProfileHints,
      });
      if (compareTeamSelection(pooledSelection, best) > 0) {
        best = {
          team: pooledSelection.team,
          score: pooledSelection.score,
          structure: pooledSelection.structure,
          candidateTeamScore: scoreTeamForMode(pooledCandidates, teamArchetype, requestedMode, evaluateTeamStructureForMode(pooledCandidates, teamArchetype, requestedMode), input.playerProfileHints),
          selectedFromCandidateSize: pooledCandidates.length,
          matchedPoolSize: best.matchedPoolSize,
        };
      }
    }
    diagnostics.messages.push(...fallbackMessages);
    const pokemonSets = best?.team || [];
    const finalStructure = evaluateTeamStructureForMode(pokemonSets, teamArchetype, requestedMode);
    const finalScore = scoreTeamForMode(pokemonSets, teamArchetype, requestedMode, finalStructure, input.playerProfileHints);
    const packedTeam = teamsApi.pack(pokemonSets);
    const exportedTeam = teamsApi.export(pokemonSets);
    diagnostics.ok = pokemonSets.length > 0;
    diagnostics.teamSize = pokemonSets.length;
    if (diagnostics.archetype && best) {
      diagnostics.archetype.bestScore = finalScore;
      diagnostics.archetype.structureScore = finalStructure.score;
      diagnostics.archetype.selectedSubsetScore = best.score;
      diagnostics.archetype.candidateTeamScore = best.candidateTeamScore;
      diagnostics.archetype.selectedFromCandidateSize = best.selectedFromCandidateSize;
      diagnostics.archetype.coreComplete = finalStructure.coreComplete;
      diagnostics.archetype.fulfilledRequirements = finalStructure.fulfilledRequirements;
      diagnostics.archetype.missingRequirements = finalStructure.missingRequirements;
      diagnostics.archetype.doubles = finalStructure.doubles;
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

function normalizeGenerationPurpose(purpose: ShowdownRandomTeamGeneratorInputV4["purpose"]): ShowdownTeamGenerationPurposeV4 {
  return purpose || "npc-battle";
}

function normalizeGenerationQuality(
  quality: ShowdownRandomTeamGeneratorInputV4["quality"],
  purpose: ShowdownTeamGenerationPurposeV4,
  strictArchetype: boolean | undefined,
): ShowdownTeamGenerationQualityV4 {
  if (quality) return quality;
  if (strictArchetype) return "strict";
  switch (purpose) {
    case "player-starter":
      return "loose";
    case "boss-battle":
    case "ai-exam":
      return "strict";
    case "npc-battle":
      return "structured";
  }
}

function shouldUseStrictPool(strictArchetype: boolean | undefined, quality: ShowdownTeamGenerationQualityV4): boolean {
  return Boolean(strictArchetype || quality === "strict");
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
      const matched = randomSetDataMatchesArchetypePool(speciesId, data, input.teamArchetype, input.strictArchetype);
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

function selectBestTeamSubsetForArchetype(
  team: ShowdownRandomTeamPokemonSetV4[],
  input: {
    teamSize: number | null;
    archetype: ShowdownTeamArchetypeV4;
    mode: TrainingModeV4;
    quality: ShowdownTeamGenerationQualityV4;
    playerProfileHints?: ShowdownTeamGenerationProfileHintsV4;
  },
): ShowdownTeamSelectionV4 {
  const targetSize = input.teamSize ? Math.min(input.teamSize, team.length) : team.length;
  const subsets = targetSize >= team.length ? [team] : combinations(team, targetSize);
  let best: ShowdownTeamSelectionV4 | null = null;
  for (const subset of subsets) {
    const structure = evaluateTeamStructureForMode(subset, input.archetype, input.mode);
    const baseScore = scoreTeamForMode(subset, input.archetype, input.mode, structure, input.playerProfileHints);
    const score = baseScore + qualityAdjustmentForStructure(structure, input.quality);
    const selected = {team: subset, score, structure};
    if (!best || compareTeamSelection(selected, best) > 0) best = selected;
  }
  return best || {
    team: [],
    score: Number.NEGATIVE_INFINITY,
    structure: evaluateTeamStructureForMode([], input.archetype, input.mode),
  };
}

function combinations<T>(values: T[], size: number): T[][] {
  if (size <= 0) return [[]];
  if (size >= values.length) return [values.slice()];
  const result: T[][] = [];
  const walk = (start: number, picked: T[]) => {
    if (picked.length === size) {
      result.push(picked.slice());
      return;
    }
    const remaining = size - picked.length;
    for (let index = start; index <= values.length - remaining; index += 1) {
      picked.push(values[index]!);
      walk(index + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return result;
}

function pooledSubsetCandidates(
  sets: ShowdownRandomTeamPokemonSetV4[],
  archetype: ShowdownTeamArchetypeV4,
  mode: TrainingModeV4,
  teamSize: number,
  playerProfileHints?: ShowdownTeamGenerationProfileHintsV4,
): ShowdownRandomTeamPokemonSetV4[] {
  const unique = new Map<string, ShowdownRandomTeamPokemonSetV4>();
  for (const set of sets) {
    const key = `${toID(set.species)}:${toID(set.ability)}:${(set.moves || []).map(toID).sort().join(",")}:${toID(set.item || "")}`;
    if (!unique.has(key)) unique.set(key, set);
  }
  const limit = teamSize <= 3 ? 24 : teamSize <= 4 ? 20 : 16;
  return Array.from(unique.values())
    .map((set, index) => {
      const structure = evaluateTeamStructureForMode([set], archetype, mode);
      return {
        set,
        index,
        score: scoreTeamForMode([set], archetype, mode, structure, playerProfileHints) + singleSetCoreSignalForMode(set, archetype, mode),
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(teamSize, limit))
    .map(entry => entry.set);
}

function singleSetCoreSignal(set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4): number {
  return singleSetCoreSignalForMode(set, archetype, "singles");
}

function singleSetCoreSignalForMode(set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4, mode: TrainingModeV4): number {
  const doublesSignal = isDoublesLikeMode(mode) ? doublesSingleSetSignal(set, archetype) : 0;
  switch (archetype) {
    case "rain":
      return doublesSignal + (isRainSetter(set) ? 40 : 0) + (isRainAbuser(set) ? 28 : 0) + (isRainCoverageMember(set) ? 6 : 0);
    case "sun":
      return doublesSignal + (isSunSetter(set) ? 40 : 0) + (isSunAbuser(set) ? 28 : 0) + (isSunCoverageMember(set) ? 6 : 0) - (isConflictingWeatherSetter(set, "sun") ? 50 : 0);
    case "trick-room":
      return doublesSignal + (isTrickRoomSetter(set) ? 52 : 0) + (isDoublesTrickRoomAttacker(set) ? 22 : isBulkyOrSlowAttacker(set) ? 18 : 0) + (isTrickRoomFailsafe(set) ? 8 : 0);
    case "setup-offense":
      return doublesSignal + (isSetupUser(set) ? 32 : 0) + (isOffensivePressure(set) ? 18 : 0);
    case "sand":
      return doublesSignal + (isSandSetter(set) ? 30 : 0) + (isSandAbuser(set) ? 18 : 0) + (isSandCoreMember(set) ? 8 : 0);
    case "snow":
      return doublesSignal + (isSnowSetter(set) ? 30 : 0) + (isSnowAbuser(set) ? 18 : 0);
    case "tailwind":
      return doublesSignal + (hasMove(set, "tailwind") ? 32 : isFastPressure(set) ? 8 : 0);
    case "terrain":
      return doublesSignal + (isTerrainSetter(set) ? 28 : 0) + (isTerrainAbuser(set) ? 12 : 0);
    case "hazard-stack":
      return doublesSignal + (isHazardSetter(set) ? 26 : 0);
    case "poison-stall":
      return doublesSignal + (isPoisonProgress(set) ? 16 : 0) + (isStallSustain(set) ? 12 : 0);
    case "baton-pass":
      return doublesSignal + (hasMove(set, "batonpass") ? 30 : 0) + (isSetupUser(set) ? 10 : 0);
    case "balanced":
      return doublesSignal;
  }
}

function qualityAdjustmentForStructure(
  structure: ShowdownTeamArchetypeStructureV4,
  quality: ShowdownTeamGenerationQualityV4,
): number {
  if (quality === "loose") return structure.coreComplete ? 8 : 0;
  if (quality === "structured") return structure.coreComplete ? 24 : -Math.max(0, structure.missingRequirements.length) * 10;
  return structure.coreComplete ? 60 : -Math.max(1, structure.missingRequirements.length) * 40;
}

function compareTeamSelection(
  left: ShowdownTeamSelectionV4,
  right: Pick<ShowdownTeamSelectionV4, "team" | "score" | "structure">,
): number {
  if (left.structure.coreComplete !== right.structure.coreComplete) return left.structure.coreComplete ? 1 : -1;
  if (left.score !== right.score) return left.score - right.score;
  const leftDoubles = left.structure.doubles;
  const rightDoubles = right.structure.doubles;
  if (leftDoubles || rightDoubles) {
    const leftAnti = leftDoubles?.antiSynergy.length || 0;
    const rightAnti = rightDoubles?.antiSynergy.length || 0;
    if (leftAnti !== rightAnti) return rightAnti - leftAnti;
    const leftLead = leftDoubles?.leadPairScore || 0;
    const rightLead = rightDoubles?.leadPairScore || 0;
    if (leftLead !== rightLead) return leftLead - rightLead;
    const leftProtect = leftDoubles?.protectCount || 0;
    const rightProtect = rightDoubles?.protectCount || 0;
    if (leftProtect !== rightProtect) return leftProtect - rightProtect;
  }
  if (left.structure.missingRequirements.length !== right.structure.missingRequirements.length) {
    return right.structure.missingRequirements.length - left.structure.missingRequirements.length;
  }
  if (left.structure.fulfilledRequirements.length !== right.structure.fulfilledRequirements.length) {
    return left.structure.fulfilledRequirements.length - right.structure.fulfilledRequirements.length;
  }
  return left.team.length - right.team.length;
}

function applyAiLevelMoveQualityToTeam(
  team: ShowdownRandomTeamPokemonSetV4[],
  aiLevel: BattleAiLevelV4 | undefined,
  seed: number[] | null,
  archetype: ShowdownTeamArchetypeV4,
  mode: TrainingModeV4 = "singles",
): ShowdownRandomTeamPokemonSetV4[] {
  if (!aiLevel) return team;
  const moveSlots = moveSlotsForAiLevel(aiLevel);
  return team.map((set, index) => {
    const moves = uniqueIds(set.moves || []);
    if (moves.length <= moveSlots) return {...set, moves};
    return {
      ...set,
      moves: chooseMovesForAiLevel(set, moves, moveSlots, archetype, mode, `${(seed || []).join(":")}:${aiLevel}:${index}`),
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
  mode: TrainingModeV4,
  seedKey: string,
): string[] {
  const scored = moves.map((move, index) => ({
    move,
    index,
    score: movePriorityForMode(move, set, archetype, mode) + deterministicJitter(`${seedKey}:${set.species}:${move}`),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored
    .slice(0, Math.max(1, Math.min(4, moveSlots)))
    .sort((a, b) => a.index - b.index)
    .map(entry => entry.move);
}

function movePriorityForArchetype(move: string, set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4): number {
  return movePriorityForMode(move, set, archetype, "singles");
}

function movePriorityForMode(move: string, set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4, mode: TrainingModeV4): number {
  const moveId = toID(move);
  let score = 1;
  if (isHighValueGeneralMove(moveId)) score += 4;
  if (isPriorityMoveId(moveId)) score += 2;
  if (isRecoveryMoveId(moveId)) score += 2;
  if (isDoublesLikeMode(mode)) score += doublesMovePriority(moveId, set, archetype);
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

function syntheticArchetypeSetsFromGenerator(
  generator: ShowdownRandomTeamGeneratorLikeV4,
  mode: TrainingModeV4,
  archetype: ShowdownTeamArchetypeV4,
  aiLevel: BattleAiLevelV4 | undefined,
  seed: number[] | null,
): ShowdownRandomTeamPokemonSetV4[] {
  const candidates: Array<{set: ShowdownRandomTeamPokemonSetV4; score: number}> = [];
  for (const tableName of randomSetTableNames(mode)) {
    const table = generator[tableName];
    if (!table) continue;
    for (const [speciesId, data] of Object.entries(table)) {
      const bestSet = (data.sets || [])
        .map(set => ({
          data: set,
          score: scoreSignalsForArchetype(archetype, {
            speciesId,
            ability: (set.abilities || []).join(" "),
            moves: set.movepool || [],
            role: set.role || "",
          }),
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (!bestSet || bestSet.score <= 0) continue;
      const ability = bestSet.data.abilities?.[0] || "";
      const allMoves = uniqueIds(bestSet.data.movepool || []);
      const speciesName = syntheticSpeciesName(speciesId);
      const draft: ShowdownRandomTeamPokemonSetV4 = {
        name: speciesName,
        species: speciesName,
        item: "Leftovers",
        ability,
        moves: allMoves,
        nature: "Serious",
        evs: {},
        ivs: {},
        level: data.level || 50,
        teraType: bestSet.data.teraTypes?.[0],
      };
      const moveSlots = moveSlotsForAiLevel(aiLevel || "champion");
      candidates.push({
        set: {...draft, moves: chooseMovesForAiLevel(draft, allMoves, moveSlots, archetype, mode, `${(seed || []).join(":")}:synthetic:${speciesId}`)},
        score: bestSet.score + singleSetCoreSignal(draft, archetype),
      });
    }
  }
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 32)
    .map(entry => normalizeGeneratedSet(entry.set));
}

function syntheticSpeciesName(speciesId: string): string {
  const id = toID(speciesId);
  const suffixes: Array<[string, string]> = [
    ["galar", "-Galar"],
    ["hisui", "-Hisui"],
    ["alola", "-Alola"],
    ["paldea", "-Paldea"],
    ["therian", "-Therian"],
    ["origin", "-Origin"],
    ["wellspring", "-Wellspring"],
    ["hearthflame", "-Hearthflame"],
    ["cornerstone", "-Cornerstone"],
  ];
  for (const [suffix, label] of suffixes) {
    if (id.endsWith(suffix) && id.length > suffix.length) {
      return `${titleSpeciesId(id.slice(0, -suffix.length))}${label}`;
    }
  }
  return titleSpeciesId(id);
}

function titleSpeciesId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join("-");
}

function randomSetDataMatchesArchetypePool(
  speciesId: string,
  data: ShowdownRandomSetDataV4,
  archetype: ShowdownTeamArchetypeV4,
  strictArchetype: boolean,
): boolean {
  if (strictArchetype && archetype === "trick-room") {
    return (data.sets || []).some(set => (set.movepool || []).some(move => toID(move) === "trickroom"));
  }
  return scoreRandomSetDataForArchetype(speciesId, data, archetype) > 0;
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

function scoreTeamForArchetype(
  team: ShowdownRandomTeamPokemonSetV4[],
  archetype: ShowdownTeamArchetypeV4,
  structure = evaluateTeamStructureForArchetype(team, archetype),
  playerProfileHints?: ShowdownTeamGenerationProfileHintsV4,
): number {
  if (archetype === "balanced") return team.length + scorePlayerProfileHintsForTeam(team, archetype, playerProfileHints);
  const signalScore = team.reduce((total, set) => total + scoreSignalsForArchetype(archetype, {
    speciesId: set.species,
    ability: set.ability,
    moves: set.moves || [],
    role: "",
  }), 0);
  return signalScore + structure.score + scorePlayerProfileHintsForTeam(team, archetype, playerProfileHints);
}

function scoreTeamForMode(
  team: ShowdownRandomTeamPokemonSetV4[],
  archetype: ShowdownTeamArchetypeV4,
  mode: TrainingModeV4,
  structure = evaluateTeamStructureForMode(team, archetype, mode),
  playerProfileHints?: ShowdownTeamGenerationProfileHintsV4,
): number {
  if (!isDoublesLikeMode(mode)) return scoreTeamForArchetype(team, archetype, structure, playerProfileHints);
  const signalScore = team.reduce((total, set) => total + scoreSignalsForArchetype(archetype, {
    speciesId: set.species,
    ability: set.ability,
    moves: set.moves || [],
    role: "",
  }) + doublesSingleSetSignal(set, archetype), 0);
  const doubles = structure.doubles;
  const leadScore = doubles ? Math.min(36, Math.max(0, doubles.leadPairScore)) : 0;
  const antiSynergyPenalty = doubles ? doubles.antiSynergy.length * 10 : 0;
  return signalScore + structure.score + leadScore - antiSynergyPenalty + scorePlayerProfileHintsForTeam(team, archetype, playerProfileHints);
}

function evaluateTeamStructureForMode(
  team: ShowdownRandomTeamPokemonSetV4[],
  archetype: ShowdownTeamArchetypeV4,
  mode: TrainingModeV4,
): ShowdownTeamArchetypeStructureV4 {
  return isDoublesLikeMode(mode)
    ? evaluateDoublesTeamStructureForArchetype(team, archetype)
    : evaluateTeamStructureForArchetype(team, archetype);
}

function evaluateTeamStructureForArchetype(team: ShowdownRandomTeamPokemonSetV4[], archetype: ShowdownTeamArchetypeV4): ShowdownTeamArchetypeStructureV4 {
  if (archetype === "balanced") {
    return {score: team.length, coreComplete: true, fulfilledRequirements: ["balanced-team"], missingRequirements: []};
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
    coreComplete: missing.length === 0,
    fulfilledRequirements: fulfilled,
    missingRequirements: missing,
  };
}

function evaluateDoublesTeamStructureForArchetype(team: ShowdownRandomTeamPokemonSetV4[], archetype: ShowdownTeamArchetypeV4): ShowdownTeamArchetypeStructureV4 {
  const fulfilled: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const count = (predicate: (set: ShowdownRandomTeamPokemonSetV4) => boolean): number => team.filter(predicate).length;
  const has = (predicate: (set: ShowdownRandomTeamPokemonSetV4) => boolean): boolean => team.some(predicate);
  const protectCount = count(isProtectUser);
  const speedControlCount = count(isDoublesSpeedControl);
  const spreadAttackerCount = count(isDoublesSpreadAttacker);
  const utilityControlCount = count(isDoublesUtilityControl);
  const fakeOutCount = count(isFakeOutUser);
  const redirectionCount = count(isRedirectionSupport);
  const weatherSetterCount = count(set => isRainSetter(set) || isSunSetter(set) || isSandSetter(set) || isSnowSetter(set));
  const weatherAbuserCount = count(set => isRainAbuser(set) || isSunAbuser(set) || isSandAbuser(set) || isSnowAbuser(set));
  const trickRoomSetterCount = count(isTrickRoomSetter);
  const trickRoomAttackerCount = count(isDoublesTrickRoomAttacker);
  const mark = (ok: boolean, requirement: string, points: number) => {
    if (ok) {
      fulfilled.push(requirement);
      score += points;
    } else {
      missing.push(requirement);
      score -= Math.ceil(points * 0.7);
    }
  };

  mark(protectCount >= Math.min(2, team.length), "doubles-protect-core", 22);
  mark(speedControlCount >= 1, "doubles-speed-control", 20);
  mark(spreadAttackerCount >= 1, "doubles-spread-attacker", 16);
  mark(utilityControlCount >= 1, "doubles-utility-control", 16);
  if (fakeOutCount > 0) {
    fulfilled.push("fake-out-user");
    score += 8;
  }
  if (redirectionCount > 0) {
    fulfilled.push("redirection-support");
    score += 8;
  }

  switch (archetype) {
    case "rain":
      mark(has(isRainSetter), "rain-setter", 20);
      mark(has(isRainAbuser), "rain-abuser", 16);
      mark(hasDistinctWeatherSetterAndAbuser(team, isRainSetter, isRainAbuser), "rain-distinct-core", 18);
      if (has(isRainCoverageMember)) {
        fulfilled.push("off-plan-coverage");
        score += 5;
      }
      if (has(set => isConflictingWeatherSetter(set, "rain"))) score -= 18;
      break;
    case "sun":
      mark(has(isSunSetter), "sun-setter", 20);
      mark(has(isSunAbuser), "sun-abuser", 16);
      mark(hasDistinctWeatherSetterAndAbuser(team, isSunSetter, isSunAbuser), "sun-distinct-core", 18);
      if (has(isSunCoverageMember)) {
        fulfilled.push("off-plan-coverage");
        score += 5;
      }
      if (has(set => isConflictingWeatherSetter(set, "sun"))) score -= 18;
      break;
    case "trick-room":
      mark(trickRoomSetterCount >= 1, "trick-room-setter", 24);
      mark(trickRoomAttackerCount >= 1, "trick-room-attacker", 18);
      if (has(isTrickRoomFailsafe)) {
        fulfilled.push("outside-trick-room-failsafe");
        score += 8;
      }
      break;
    case "tailwind":
      mark(hasMoveInTeam(team, "tailwind"), "tailwind-setter", 22);
      mark(count(set => isFastPressure(set) || isDoublesSpreadAttacker(set)) >= 1, "tailwind-pressure", 14);
      break;
    case "terrain":
      mark(has(isTerrainSetter), "terrain-setter", 18);
      mark(has(isTerrainAbuser), "terrain-abuser", 10);
      break;
    case "sand":
      mark(has(isSandSetter), "sand-setter", 16);
      if (has(isSandAbuser) || count(isSandCoreMember) >= 2) {
        fulfilled.push("sand-core");
        score += 10;
      } else {
        missing.push("sand-core");
        score -= 8;
      }
      break;
    case "snow":
      mark(has(isSnowSetter), "snow-setter", 16);
      mark(hasMoveInTeam(team, "auroraveil") || has(isSnowAbuser), "aurora-veil-or-snow-abuser", 10);
      break;
    case "setup-offense":
      mark(has(isSetupUser) || count(isOffensivePressure) >= 2, "doubles-offensive-pressure", 14);
      break;
    case "balanced":
      fulfilled.push("doubles-balanced-core");
      score += team.length;
      break;
    case "hazard-stack":
    case "poison-stall":
    case "baton-pass":
      if (has(isDoublesUtilityControl)) {
        fulfilled.push("doubles-utility-adapter");
        score += 8;
      }
      break;
  }

  const antiSynergy = doublesAntiSynergy(team, archetype, {
    protectCount,
    speedControlCount,
    spreadAttackerCount,
    utilityControlCount,
    trickRoomSetterCount,
  });
  score -= antiSynergy.length * 8;
  const recommendedLeadPairs = recommendDoublesLeadPairs(team, archetype);
  const leadPairScore = recommendedLeadPairs[0]?.score || 0;
  score += Math.min(24, Math.max(0, leadPairScore));
  const doubles: ShowdownDoublesTeamDiagnosticsV4 = {
    protectCount,
    speedControlCount,
    spreadAttackerCount,
    utilityControlCount,
    fakeOutCount,
    redirectionCount,
    weatherSetterCount,
    weatherAbuserCount,
    trickRoomSetterCount,
    trickRoomAttackerCount,
    leadPairScore,
    recommendedLeadPairs,
    antiSynergy,
  };
  return {
    score,
    coreComplete: missing.length === 0 && antiSynergy.length === 0,
    fulfilledRequirements: fulfilled,
    missingRequirements: missing,
    doubles,
  };
}

function scorePlayerProfileHintsForTeam(
  team: ShowdownRandomTeamPokemonSetV4[],
  archetype: ShowdownTeamArchetypeV4,
  hints: ShowdownTeamGenerationProfileHintsV4 | undefined,
): number {
  if (!hints) return 0;
  let score = 0;
  const normalizedPreferred = new Set((hints.preferredArchetypes || []).map(value => String(value)));
  if (normalizedPreferred.has(archetype)) score += 4;
  const hintTokens = [
    ...(hints.weakAgainst || []),
    ...(hints.overusedPatterns || []),
    ...(hints.recentLossReasons || []),
  ].map(toID).filter(Boolean);
  for (const token of hintTokens) {
    if (token.includes("speed") || token.includes("fast") || token.includes("tailwind")) score += team.some(isFastPressure) ? 3 : 0;
    if (token.includes("setup") || token.includes("boost")) score += team.some(set => hasMove(set, "haze", "encore", "roar", "whirlwind", "taunt") || hasAbility(set, "unaware")) ? 4 : 0;
    if (token.includes("rain")) score += team.some(set => isConflictingWeatherSetter(set, "rain")) ? 3 : 0;
    if (token.includes("sun")) score += team.some(set => isConflictingWeatherSetter(set, "sun")) ? 3 : 0;
    if (token.includes("hazard")) score += team.some(set => hasMove(set, "rapidspin", "defog", "courtchange")) ? 3 : 0;
    if (token.includes("stall") || token.includes("wall")) score += team.some(set => hasMove(set, "taunt", "trick", "knockoff", "encore")) ? 3 : 0;
  }
  return Math.min(18, score);
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

function isDoublesLikeMode(mode: TrainingModeV4): boolean {
  return mode === "doubles" || mode === "coop";
}

function doublesSingleSetSignal(set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4): number {
  let score = 0;
  if (isProtectUser(set)) score += 8;
  if (isDoublesSpeedControl(set)) score += 10;
  if (isDoublesSpreadAttacker(set)) score += 8;
  if (isDoublesUtilityControl(set)) score += 10;
  if (isFakeOutUser(set)) score += 8;
  if (isRedirectionSupport(set)) score += 8;
  if (isAllyComboEnabler(set) || isAllyComboAbuser(set)) score += 6;
  if (archetype === "trick-room" && isDoublesTrickRoomAttacker(set)) score += 12;
  if (archetype === "tailwind" && (hasMove(set, "tailwind") || isFastPressure(set))) score += 8;
  if ((archetype === "rain" && (isRainSetter(set) || isRainAbuser(set))) || (archetype === "sun" && (isSunSetter(set) || isSunAbuser(set)))) score += 8;
  return score;
}

function doublesMovePriority(moveId: string, set: ShowdownRandomTeamPokemonSetV4, archetype: ShowdownTeamArchetypeV4): number {
  let score = 0;
  if (["protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "silktrap", "burningbulwark"].includes(moveId)) score += 10;
  if (["fakeout", "tailwind", "trickroom", "icywind", "electroweb", "bulldoze", "helpinghand", "followme", "ragepowder", "wideguard", "quickguard", "taunt", "encore", "partingshot"].includes(moveId)) score += 9;
  if (["rockslide", "heatwave", "dazzlinggleam", "earthquake", "surf", "discharge", "blizzard", "muddywater", "hypervoice", "eruption", "waterspout", "makeitrain", "expandingforce", "snarl"].includes(moveId)) score += 7;
  if (isAllyComboEnabler(set) && ["surf", "discharge", "earthquake", "bulldoze", "flamethrower", "thunderbolt", "energyball"].includes(moveId)) score += 4;
  if (archetype === "trick-room" && moveId === "trickroom") score += 10;
  if (archetype === "tailwind" && moveId === "tailwind") score += 10;
  if (archetype === "rain" && ["surf", "muddywater", "hydropump", "raindance", "hurricane", "thunder"].includes(moveId)) score += 5;
  if (archetype === "sun" && ["heatwave", "eruption", "sunnyday", "solarbeam", "solarblade"].includes(moveId)) score += 5;
  return score;
}

function isProtectUser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "silktrap", "burningbulwark");
}

function isDoublesSpeedControl(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "tailwind", "trickroom", "icywind", "electroweb", "stringshot", "bulldoze", "thunderwave") ||
    hasAbility(set, "prankster");
}

function isDoublesSpreadAttacker(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "rockslide", "heatwave", "dazzlinggleam", "earthquake", "surf", "discharge", "blizzard", "muddywater", "hypervoice", "eruption", "waterspout", "makeitrain", "expandingforce", "snarl");
}

function isFakeOutUser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "fakeout");
}

function isRedirectionSupport(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "followme", "ragepowder");
}

function isDoublesUtilityControl(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return isFakeOutUser(set) ||
    isRedirectionSupport(set) ||
    hasAbility(set, "intimidate") ||
    hasMove(set, "wideguard", "quickguard", "taunt", "encore", "helpinghand", "partingshot", "snarl", "willowisp", "spore");
}

function isDoublesTrickRoomAttacker(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return isBulkyOrSlowAttacker(set) ||
    hasMove(set, "eruption", "waterspout", "gyroball", "bodypress", "heavyslam", "trickroom") ||
    hasAbility(set, "ironfist", "sheerforce", "solidrock", "filter");
}

function isAllyComboEnabler(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "surf", "discharge", "earthquake", "bulldoze", "flamethrower", "thunderbolt", "energyball", "charm", "faketears", "scaryface");
}

function isAllyComboAbuser(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "flashfire", "lightningrod", "stormdrain", "waterabsorb", "voltabsorb", "sapsipper", "motordrive", "contrary", "levitate", "eartheater") ||
    toID(set.item || "") === "weaknesspolicy";
}

function hasDangerousAdjacentSpread(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasMove(set, "earthquake", "surf", "discharge", "boomburst", "explosion");
}

function isEarthquakePartner(set: ShowdownRandomTeamPokemonSetV4): boolean {
  return hasAbility(set, "levitate", "telepathy", "eartheater") || isProtectUser(set) || hasMove(set, "wideguard");
}

function doublesAntiSynergy(
  team: ShowdownRandomTeamPokemonSetV4[],
  archetype: ShowdownTeamArchetypeV4,
  counts: {protectCount: number; speedControlCount: number; spreadAttackerCount: number; utilityControlCount: number; trickRoomSetterCount: number},
): string[] {
  const anti: string[] = [];
  if (team.length >= 4 && counts.protectCount === 0) anti.push("no-protect");
  if (team.length >= 4 && counts.speedControlCount === 0 && archetype !== "balanced") anti.push("no-speed-control");
  if (team.length >= 4 && counts.spreadAttackerCount === 0 && counts.utilityControlCount === 0) anti.push("single-target-only");
  if (team.some(hasDangerousAdjacentSpread) && !team.some(isAllyComboAbuser) && counts.protectCount < 2 && !team.some(isEarthquakePartner)) {
    anti.push("unsafe-adjacent-spread");
  }
  if ((archetype === "rain" || archetype === "sun" || archetype === "sand" || archetype === "snow") && team.some(set => isConflictingWeatherSetter(set, archetype))) {
    anti.push("conflicting-weather");
  }
  if (archetype === "trick-room" && counts.trickRoomSetterCount > 0 && team.filter(isFastPressure).length >= Math.max(2, team.length - 1)) {
    anti.push("trick-room-too-fast");
  }
  return anti;
}

function hasDistinctWeatherSetterAndAbuser(
  team: ShowdownRandomTeamPokemonSetV4[],
  isSetter: (set: ShowdownRandomTeamPokemonSetV4) => boolean,
  isAbuser: (set: ShowdownRandomTeamPokemonSetV4) => boolean,
): boolean {
  return team.some((setter, setterIndex) => isSetter(setter) && team.some((abuser, abuserIndex) => abuserIndex !== setterIndex && isAbuser(abuser)));
}

function recommendDoublesLeadPairs(team: ShowdownRandomTeamPokemonSetV4[], archetype: ShowdownTeamArchetypeV4): ShowdownDoublesRecommendedLeadPairV4[] {
  if (team.length < 2) return [];
  return combinations(team.map((set, index) => ({set, index})), 2)
    .map(pair => scoreDoublesLeadPair(pair[0]!, pair[1]!, archetype))
    .sort((a, b) => b.score - a.score || a.indexes[0] - b.indexes[0] || a.indexes[1] - b.indexes[1])
    .slice(0, 3)
    .map(entry => ({
      indexes: entry.indexes,
      species: entry.species,
      score: Math.round(entry.score * 100) / 100,
      reasons: entry.reasons,
    }));
}

function scoreDoublesLeadPair(
  left: {set: ShowdownRandomTeamPokemonSetV4; index: number},
  right: {set: ShowdownRandomTeamPokemonSetV4; index: number},
  archetype: ShowdownTeamArchetypeV4,
): ShowdownDoublesRecommendedLeadPairV4 {
  const a = left.set;
  const b = right.set;
  const reasons: string[] = [];
  let score = 0;
  const add = (ok: boolean, reason: string, points: number) => {
    if (ok) {
      reasons.push(reason);
      score += points;
    }
  };
  const aUtility = isDoublesUtilityControl(a) || isDoublesSpeedControl(a);
  const bUtility = isDoublesUtilityControl(b) || isDoublesSpeedControl(b);
  const aOffense = isOffensivePressure(a) || isDoublesSpreadAttacker(a);
  const bOffense = isOffensivePressure(b) || isDoublesSpreadAttacker(b);
  add(aUtility && bOffense || bUtility && aOffense, "utility-plus-pressure", 18);
  add(isFakeOutUser(a) && (isDoublesSpeedControl(b) || isTrickRoomSetter(b) || isSetupUser(b)) || isFakeOutUser(b) && (isDoublesSpeedControl(a) || isTrickRoomSetter(a) || isSetupUser(a)), "fake-out-enables-setup", 18);
  add(isRedirectionSupport(a) && (isTrickRoomSetter(b) || isSetupUser(b)) || isRedirectionSupport(b) && (isTrickRoomSetter(a) || isSetupUser(a)), "redirection-enables-setup", 16);
  add(isDoublesSpeedControl(a) && bOffense || isDoublesSpeedControl(b) && aOffense, "speed-control-plus-pressure", 14);
  add(archetype === "rain" && (isRainSetter(a) && isRainAbuser(b) || isRainSetter(b) && isRainAbuser(a)), "weather-setter-plus-abuser", 20);
  add(archetype === "sun" && (isSunSetter(a) && isSunAbuser(b) || isSunSetter(b) && isSunAbuser(a)), "weather-setter-plus-abuser", 20);
  add(archetype === "trick-room" && (isTrickRoomSetter(a) && isDoublesTrickRoomAttacker(b) || isTrickRoomSetter(b) && isDoublesTrickRoomAttacker(a)), "trick-room-plus-attacker", 20);
  add(isAllyComboEnabler(a) && isAllyComboAbuser(b) || isAllyComboEnabler(b) && isAllyComboAbuser(a), "ally-combo-window", 12);
  if (isDoublesUtilityControl(a) && isDoublesUtilityControl(b) && !aOffense && !bOffense) {
    reasons.push("low-pressure-double-support");
    score -= 12;
  }
  if (hasDangerousAdjacentSpread(a) && !isEarthquakePartner(b) || hasDangerousAdjacentSpread(b) && !isEarthquakePartner(a)) {
    reasons.push("friendly-fire-risk");
    score -= 14;
  }
  return {
    indexes: [left.index, right.index],
    species: [a.species, b.species],
    score,
    reasons,
  };
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
