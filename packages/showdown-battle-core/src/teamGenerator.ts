import type {TrainingModeV4, TrainingRuleSetV4, ShowdownPlayerIdV4} from "./types.js";

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
  seed?: string | number | number[];
  teamSize?: number;
  playerId?: ShowdownPlayerIdV4;
  localTeamName?: string;
  pokemonFilter?: string[] | ShowdownPokemonFilterV4;
  teamArchetype?: ShowdownTeamArchetypeV4;
  archetypeAttempts?: number;
  strictArchetype?: boolean;
};

export type ShowdownRandomTeamGeneratorDiagnosticsV4 = {
  ok: boolean;
  requestedRuleSet: TrainingRuleSetV4;
  resolvedRuleSet: Exclude<TrainingRuleSetV4, "standard">;
  requestedMode: TrainingModeV4;
  formatId: string | null;
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
    matchedPoolSize: number;
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
  showdownTeamsPromise ||= import("../vendor/showdown/sim/index.js").then(module => {
    const loaded = module as unknown as Partial<ShowdownTeamsApiV4> & {default?: Partial<ShowdownTeamsApiV4>};
    if (loaded.default?.Teams) return loaded.default.Teams;
    if (!loaded.Teams) throw new Error("Showdown Teams vendor 未加载。");
    return loaded.Teams;
  });
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
  const formatId = FORMAT_BY_RULESET_MODE[resolvedRuleSet][requestedMode];
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
    seed,
    teamSize: input.teamSize ? clampInt(input.teamSize, 1, 6) : null,
    pokemonFilter: null,
    archetype: null,
    messages: [],
    elapsedMs: 0,
  };

  if (!formatId) {
    diagnostics.messages.push(`${resolvedRuleSet} ${requestedMode} 暂无可用的 Showdown 随机队伍格式。`);
    diagnostics.elapsedMs = Date.now() - startedAt;
    return {formatId, pokemonSets: [], packedTeam: "", exportedTeam: "", diagnostics};
  }

  try {
    const teamsApi = await getShowdownTeams();
    let best: {team: ShowdownRandomTeamPokemonSetV4[]; score: number; matchedPoolSize: number} | null = null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const generator = teamsApi.getGenerator(formatId, seedForAttempt(seed, attempt));
      const poolDiagnostics = applyGeneratorPoolFilters(generator, {
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
      const team = generator.getTeam(null).map(normalizeGeneratedSet);
      const score = scoreTeamForArchetype(team, teamArchetype);
      if (!best || score > best.score || (score === best.score && team.length > best.team.length)) {
        best = {team, score, matchedPoolSize: poolDiagnostics.archetypeMatchedPoolSize};
      }
    }
    const generated = best?.team || [];
    const pokemonSets = input.teamSize ? generated.slice(0, clampInt(input.teamSize, 1, 6)) : generated;
    const packedTeam = teamsApi.pack(pokemonSets);
    const exportedTeam = teamsApi.export(pokemonSets);
    diagnostics.ok = pokemonSets.length > 0;
    diagnostics.teamSize = pokemonSets.length;
    if (diagnostics.archetype && best) {
      diagnostics.archetype.bestScore = best.score;
      diagnostics.archetype.matchedPoolSize = best.matchedPoolSize;
    }
    if (!pokemonSets.length) diagnostics.messages.push("Showdown 生成结果为空。");
    diagnostics.elapsedMs = Date.now() - startedAt;
    return {formatId, pokemonSets, packedTeam, exportedTeam, diagnostics};
  } catch (error) {
    diagnostics.messages.push(error instanceof Error ? error.message : String(error));
    diagnostics.elapsedMs = Date.now() - startedAt;
    return {formatId, pokemonSets: [], packedTeam: "", exportedTeam: "", diagnostics};
  }
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

function scoreTeamForArchetype(team: ShowdownRandomTeamPokemonSetV4[], archetype: ShowdownTeamArchetypeV4): number {
  if (archetype === "balanced") return team.length;
  return team.reduce((total, set) => total + scoreSignalsForArchetype(archetype, {
    speciesId: set.species,
    ability: set.ability,
    moves: set.moves || [],
    role: "",
  }), 0);
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
