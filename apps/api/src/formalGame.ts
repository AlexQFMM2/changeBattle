import type {
  DexMoveSummary,
  DexPokemonDetail,
  DexSearchRow,
  DexStatId,
  ShowdownDexService,
} from "@changebattle-v2/showdown-dex-core";
import {
  normalizeBattlePreferenceV4,
  type BattlePreferenceV4,
  type LocalPokemonV4,
  type LocalTeamV4,
  type StatTableV4,
  type TrainingGenderV4,
  type TrainingMoveSlotV4,
  type TrainingRuleSetV4,
  type TrainingStatusV4,
  type TrainingUserProfileInputV4,
} from "./training.js";

export type FormalGameModeV4 = "singles" | "doubles" | "coop";
export type FormalGameStatusV4 = "starterPreparing" | "starterSelecting" | "starterSelected" | "roundPlanPending" | "ended";
export type FormalStarterRoleV4 = "weather" | "trick-room" | "offense" | "defensive-pivot" | "balanced";
export type PokemonSpeciesRankV4 = "rank1" | "rank2" | "rank3" | "rank4" | "rank5" | "rank6" | "legendary";
export type PokemonPowerProfileV4 = "rookie" | "normal" | "elite" | "boss" | "champion";
export type CoopPartnerPreferenceV4 = "offense" | "defense" | "support" | "balanced";

export type FormalStarterCandidateDiagnosticsV4 = {
  role: FormalStarterRoleV4;
  speciesRank: PokemonSpeciesRankV4;
  powerProfile: PokemonPowerProfileV4;
  generation: number;
  poolSize: number;
  filters: {
    allowedGenerations: number[];
    legendaryBattle: boolean;
    ruleSet: TrainingRuleSetV4;
  };
  messages: string[];
};

export type FormalStarterCandidateV4 = {
  id: string;
  role: FormalStarterRoleV4;
  speciesRank: PokemonSpeciesRankV4;
  powerProfile: PokemonPowerProfileV4;
  pokemon: LocalPokemonV4;
  display: {
    nationalDex: number;
    types: string[];
    typesZh: string[];
    baseStats: Record<string, number>;
    heightm?: number;
    weightkg?: number;
  };
  diagnostics: FormalStarterCandidateDiagnosticsV4;
};

export type FormalGameRunV4 = {
  version: 1;
  id: string;
  source: "formal";
  mode: FormalGameModeV4;
  status: FormalGameStatusV4;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  seed: string;
  streak: number;
  battlePreference: BattlePreferenceV4;
  coopPartnerPreference?: CoopPartnerPreferenceV4;
  starterCandidates: FormalStarterCandidateV4[];
  selectedStarterIndexes: number[];
  playerTeam: LocalTeamV4 | null;
};

export type FormalGameRunStorageAdapter = {
  loadFormalGameRun(): Promise<FormalGameRunV4 | null>;
  saveFormalGameRun(run: FormalGameRunV4): Promise<FormalGameRunV4>;
  deleteFormalGameRun(): Promise<void>;
};

export type FormalGameRunApi = {
  loadFormalGameRun(): Promise<FormalGameRunV4 | null>;
  saveFormalGameRun(run: FormalGameRunV4): Promise<FormalGameRunV4>;
  deleteFormalGameRun(): Promise<void>;
  createFormalGameRun(profile: TrainingUserProfileInputV4, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}): FormalGameRunV4;
  prepareFormalStarterCandidates(run: FormalGameRunV4, options?: {count?: number; seed?: string}): FormalGameRunV4;
  selectFormalStarterPokemon(run: FormalGameRunV4, selectedIndexes: number[]): FormalGameRunV4;
  selectedCountForFormalMode(mode: FormalGameModeV4): number;
};

export type FormalRentalMoveViewV4 = {
  id: string;
  name: string;
  name_zh: string;
  type: string;
  type_zh: string;
  category: string;
  category_zh: string;
  power: number;
  accuracy: number | null;
  pp: number;
  priority: number;
  short_desc: string;
  short_desc_zh: string;
  desc: string;
  desc_zh: string;
};

export type FormalRentalPokemonViewV4 = {
  run_member_id?: string;
  showdown_id?: string;
  name: string;
  species: string;
  species_zh: string;
  species_id: string;
  level: number;
  gender: string;
  heightm?: number;
  weightkg?: number;
  types: string[];
  types_zh: string[];
  ability: string;
  ability_zh: string;
  ability_id: string;
  ability_desc: string;
  ability_desc_zh: string;
  item: string;
  item_zh: string;
  item_id: string;
  item_desc: string;
  item_desc_zh: string;
  moves: FormalRentalMoveViewV4[];
  base_stats: Record<string, number>;
  stats: Record<string, number>;
  evs: Record<string, number>;
  ivs: Record<string, number>;
  nature: string;
  nature_zh: string;
  nature_plus: string;
  nature_minus: string;
  role: string;
  role_zh: string;
  shiny?: boolean;
  is_legendary?: boolean;
  is_mythical?: boolean;
  starter_origin?: string;
  sprite?: {
    national_dex?: number;
    front_default?: string;
    front_shiny?: string;
    icon?: string;
    icon_style?: string;
  };
};

const FORMAL_RUN_VERSION = 1 as const;
const DEFAULT_FORMAL_RUN_KEY = "changebattle-v2:web:formal-run";
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const STARTER_ROLE_PLAN: FormalStarterRoleV4[] = [
  "weather",
  "trick-room",
  "offense",
  "offense",
  "defensive-pivot",
  "balanced",
  "balanced",
  "balanced",
  "balanced",
  "balanced",
];
const FALLBACK_SPECIES = ["pikachu", "eevee", "lucario", "charizard", "gardevoir", "dragonite", "greninja", "venusaur", "arcanine", "lapras"];
const FALLBACK_MOVES = ["tackle", "quickattack", "protect", "rest"];
const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
];
const NATURE_ZH: Record<string, string> = {
  Hardy: "勤奋",
  Lonely: "怕寂寞",
  Brave: "勇敢",
  Adamant: "固执",
  Naughty: "顽皮",
  Bold: "大胆",
  Docile: "坦率",
  Relaxed: "悠闲",
  Impish: "淘气",
  Lax: "乐天",
  Timid: "胆小",
  Hasty: "急躁",
  Serious: "认真",
  Jolly: "爽朗",
  Naive: "天真",
  Modest: "内敛",
  Mild: "慢吞吞",
  Quiet: "冷静",
  Bashful: "害羞",
  Rash: "马虎",
  Calm: "温和",
  Gentle: "温顺",
  Sassy: "自大",
  Careful: "慎重",
  Quirky: "浮躁",
};
const LEGENDARY_DEX_NUMBERS = new Set([
  144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 638, 639, 640, 641, 642, 643, 644,
  645, 646, 647, 648, 649, 716, 717, 718, 719, 720, 721, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800,
  801, 802, 807, 808, 809, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905, 1001, 1002, 1003, 1004,
  1007, 1008, 1014, 1015, 1016, 1017, 1024, 1025,
]);
const ROLE_TYPE_HINTS: Record<FormalStarterRoleV4, string[]> = {
  weather: ["Water", "Fire", "Rock", "Ice", "Ground", "Grass"],
  "trick-room": ["Psychic", "Ghost", "Fairy", "Rock", "Steel"],
  offense: ["Dragon", "Fire", "Electric", "Fighting", "Dark", "Flying"],
  "defensive-pivot": ["Steel", "Water", "Grass", "Poison", "Ground"],
  balanced: [],
};

export function createFormalGameRunApi(dex: ShowdownDexService, storage: FormalGameRunStorageAdapter = createBrowserFormalGameRunAdapter()): FormalGameRunApi {
  function createFormalGameRun(profile: TrainingUserProfileInputV4, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}): FormalGameRunV4 {
    const now = new Date().toISOString();
    const mode = normalizeFormalMode(options.mode);
    const run: FormalGameRunV4 = {
      version: FORMAL_RUN_VERSION,
      id: createId("formal-run"),
      source: "formal",
      mode,
      status: "starterPreparing",
      profileId: profile.id,
      createdAt: now,
      updatedAt: now,
      seed: options.seed || createId("formal-seed"),
      streak: Math.max(0, Math.floor(Number(options.streak || 0))),
      battlePreference: normalizeBattlePreferenceV4(profile.battlePreference),
      coopPartnerPreference: mode === "coop" ? normalizeCoopPartnerPreference(options.coopPartnerPreference) : undefined,
      starterCandidates: [],
      selectedStarterIndexes: [],
      playerTeam: null,
    };
    return normalizeFormalRun(run);
  }

  function prepareFormalStarterCandidates(run: FormalGameRunV4, options: {count?: number; seed?: string} = {}): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    const seed = options.seed || normalized.seed;
    const candidates = createFormalStarterCandidatesV4(dex, {
      mode: normalized.mode,
      streak: normalized.streak,
      battlePreference: normalized.battlePreference,
      seed,
      count: options.count || 10,
    });
    return normalizeFormalRun({
      ...normalized,
      status: "starterSelecting",
      seed,
      starterCandidates: candidates,
      selectedStarterIndexes: [],
      playerTeam: null,
      updatedAt: new Date().toISOString(),
    });
  }

  function selectFormalStarterPokemon(run: FormalGameRunV4, selectedIndexes: number[]): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    const requiredCount = selectedCountForFormalMode(normalized.mode);
    const uniqueIndexes = Array.from(new Set(selectedIndexes.map(index => Math.floor(Number(index))).filter(index => Number.isFinite(index))));
    if (uniqueIndexes.length !== requiredCount) {
      throw new Error(`需要选择 ${requiredCount} 只宝可梦。`);
    }
    const selectedPokemon = uniqueIndexes.map(index => normalized.starterCandidates[index]?.pokemon);
    if (selectedPokemon.some(pokemon => !pokemon)) {
      throw new Error("选择中包含不存在的候选宝可梦。");
    }
    const playerTeam: LocalTeamV4 = {
      id: `formal-player-team-${normalized.id}`,
      name: "正式游戏初始队伍",
      pokemon: selectedPokemon.map((pokemon, index) => ({
        ...pokemon!,
        localPokemonId: pokemon!.localPokemonId || `formal-starter-${index + 1}`,
        itemId: "",
        heldItemInstanceId: undefined,
        entryHp: pokemon!.maxHp,
        entryStatus: "",
      })),
    };
    return normalizeFormalRun({
      ...normalized,
      status: "roundPlanPending",
      selectedStarterIndexes: uniqueIndexes,
      playerTeam,
      updatedAt: new Date().toISOString(),
    });
  }

  function normalizeFormalRun(run: FormalGameRunV4): FormalGameRunV4 {
    const mode = normalizeFormalMode(run.mode);
    const battlePreference = normalizeBattlePreferenceV4(run.battlePreference);
    const starterCandidates = Array.isArray(run.starterCandidates) ? run.starterCandidates.map(normalizeStarterCandidate) : [];
    const selectedStarterIndexes = Array.isArray(run.selectedStarterIndexes) ? Array.from(new Set(run.selectedStarterIndexes.map(index => Math.floor(Number(index))).filter(index => index >= 0 && index < starterCandidates.length))) : [];
    return {
      version: FORMAL_RUN_VERSION,
      id: run.id || createId("formal-run"),
      source: "formal",
      mode,
      status: normalizeFormalStatus(run.status, starterCandidates.length),
      profileId: run.profileId || "profile",
      createdAt: run.createdAt || new Date().toISOString(),
      updatedAt: run.updatedAt || new Date().toISOString(),
      seed: run.seed || createId("formal-seed"),
      streak: Math.max(0, Math.floor(Number(run.streak || 0))),
      battlePreference,
      coopPartnerPreference: mode === "coop" ? normalizeCoopPartnerPreference(run.coopPartnerPreference) : undefined,
      starterCandidates,
      selectedStarterIndexes,
      playerTeam: run.playerTeam ? normalizePlayerTeam(run.playerTeam) : null,
    };
  }

  function normalizeStarterCandidate(candidate: FormalStarterCandidateV4): FormalStarterCandidateV4 {
    const candidateBattlePreference = normalizeBattlePreferenceV4();
    return {
      ...candidate,
      role: normalizeStarterRole(candidate.role),
      speciesRank: normalizeSpeciesRank(candidate.speciesRank),
      powerProfile: normalizePowerProfile(candidate.powerProfile),
      pokemon: normalizeStarterPokemon(candidate.pokemon),
      display: candidate.display || displayFromDetail(safePokemon(candidate.pokemon?.speciesId)),
      diagnostics: candidate.diagnostics || {
        role: normalizeStarterRole(candidate.role),
        speciesRank: normalizeSpeciesRank(candidate.speciesRank),
        powerProfile: normalizePowerProfile(candidate.powerProfile),
        generation: generationForDexNum(candidate.pokemon?.speciesId ? safePokemon(candidate.pokemon.speciesId).num : 0),
        poolSize: 0,
        filters: {
          allowedGenerations: candidateBattlePreference.allowedGenerations,
          legendaryBattle: candidateBattlePreference.legendaryBattle,
          ruleSet: candidateBattlePreference.ruleSet,
        },
        messages: [],
      },
    };
  }

  function normalizePlayerTeam(team: LocalTeamV4): LocalTeamV4 {
    return {
      id: team.id || createId("formal-player-team"),
      name: team.name || "正式游戏初始队伍",
      pokemon: (team.pokemon || []).slice(0, 6).map(normalizeStarterPokemon),
    };
  }

  function normalizeStarterPokemon(pokemon: LocalPokemonV4): LocalPokemonV4 {
    const detail = safePokemon(pokemon.speciesId);
    const nature = pokemon.nature || "Serious";
    const evs = normalizeStats(pokemon.evs, 0, 252);
    const ivs = normalizeStats(pokemon.ivs, 31, 31);
    const level = clampInt(pokemon.level, 1, 100, 50);
    const maxHp = dex.calculatePokemonStats({speciesId: detail.id, level, nature, evs, ivs}).stats.hp;
    return {
      ...pokemon,
      speciesId: detail.id,
      name: detail.name,
      nameZh: detail.nameZh,
      level,
      gender: normalizeGender(pokemon.gender),
      nature,
      evs,
      ivs,
      itemId: "",
      heldItemInstanceId: undefined,
      moves: normalizeMoves(dex, pokemon.moves?.map(move => move.moveId) || [], 4),
      maxHp,
      entryHp: clampInt(pokemon.entryHp, 0, maxHp, maxHp),
      entryStatus: normalizeStatus(pokemon.entryStatus),
      spriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      shinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      frontSpriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      backSpriteUrl: detail.sprites.backUrl || detail.sprites.fallbackBackUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      frontShinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      backShinySpriteUrl: detail.sprites.backShinyUrl || detail.sprites.fallbackBackShinyUrl || detail.sprites.backUrl || detail.sprites.fallbackBackUrl || detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.iconUrl,
      iconUrl: detail.sprites.iconUrl,
      iconStyle: detail.sprites.iconStyle,
    };
  }

  function safePokemon(speciesId: string): DexPokemonDetail {
    try {
      return dex.getPokemonDetail(speciesId);
    } catch {
      return dex.getPokemonDetail("pikachu");
    }
  }

  return {
    loadFormalGameRun: async () => {
      const run = await storage.loadFormalGameRun();
      return run ? normalizeFormalRun(run) : null;
    },
    saveFormalGameRun: async run => storage.saveFormalGameRun(normalizeFormalRun(run)),
    deleteFormalGameRun: () => storage.deleteFormalGameRun(),
    createFormalGameRun,
    prepareFormalStarterCandidates,
    selectFormalStarterPokemon,
    selectedCountForFormalMode,
  };
}

export function createFormalStarterCandidatesV4(dex: ShowdownDexService, input: {
  mode: FormalGameModeV4;
  streak: number;
  battlePreference: BattlePreferenceV4;
  seed: string;
  count?: number;
}): FormalStarterCandidateV4[] {
  const battlePreference = normalizeBattlePreferenceV4(input.battlePreference);
  const count = clampInt(input.count, 1, 12, 10);
  const rng = createRng(`${input.seed}:${input.mode}:${input.streak}:${battlePreference.ruleSet}`);
  const rows = collectPokemonRows(dex, battlePreference);
  const roles = Array.from({length: count}, (_value, index) => STARTER_ROLE_PLAN[index] || "balanced");
  const used = new Set<string>();
  return roles.map((role, index) => {
    const rolePool = filterRowsForRole(rows, role);
    const pool = rolePool.length ? rolePool : rows;
    const unused = pool.filter(row => !used.has(row.id));
    const selectedRow = pickOne(unused.length ? unused : pool, rng) || fallbackRow(index);
    used.add(selectedRow.id);
    const detail = safePokemonDetail(dex, selectedRow.id);
    const speciesRank = speciesRankForDetail(detail);
    const powerProfile = powerProfileForStreak(input.streak, index);
    const pokemon = createStarterPokemon(dex, detail, {
      index,
      role,
      powerProfile,
      rng,
      seed: input.seed,
    });
    return {
      id: `starter-${index + 1}-${detail.id}`,
      role,
      speciesRank,
      powerProfile,
      pokemon,
      display: displayFromDetail(detail),
      diagnostics: {
        role,
        speciesRank,
        powerProfile,
        generation: generationForDexNum(detail.num),
        poolSize: pool.length,
        filters: {
          allowedGenerations: battlePreference.allowedGenerations,
          legendaryBattle: battlePreference.legendaryBattle,
          ruleSet: battlePreference.ruleSet,
        },
        messages: [
          rolePool.length ? `role-pool:${role}` : `role-pool-fallback:${role}`,
          selectedRow.description || "",
        ].filter(Boolean),
      },
    };
  });
}

export function selectedCountForFormalMode(mode: FormalGameModeV4): number {
  if (mode === "doubles") return 4;
  if (mode === "coop") return 2;
  return 3;
}

export function formalStarterCandidateToRentalPokemonV4(candidate: FormalStarterCandidateV4): FormalRentalPokemonViewV4 {
  const pokemon = candidate.pokemon;
  const baseStats = candidate.display?.baseStats || Object.fromEntries(STAT_IDS.map(stat => [stat, 0]));
  const stats = {
    hp: pokemon.maxHp,
    atk: pokemon.evs.atk + pokemon.ivs.atk,
    def: pokemon.evs.def + pokemon.ivs.def,
    spa: pokemon.evs.spa + pokemon.ivs.spa,
    spd: pokemon.evs.spd + pokemon.ivs.spd,
    spe: pokemon.evs.spe + pokemon.ivs.spe,
  };
  return {
    run_member_id: pokemon.localPokemonId,
    showdown_id: pokemon.showdownId || pokemon.speciesId,
    name: pokemon.nickname || pokemon.name,
    species: pokemon.name,
    species_zh: pokemon.nameZh,
    species_id: pokemon.speciesId,
    level: pokemon.level,
    gender: pokemon.gender,
    heightm: candidate.display?.heightm,
    weightkg: candidate.display?.weightkg,
    types: candidate.display?.types || [],
    types_zh: candidate.display?.typesZh || candidate.display?.types || [],
    ability: pokemon.abilityName,
    ability_zh: pokemon.abilityNameZh,
    ability_id: pokemon.abilityId,
    ability_desc: "",
    ability_desc_zh: "",
    item: "",
    item_zh: "无",
    item_id: "",
    item_desc: "",
    item_desc_zh: "",
    moves: pokemon.moves.map(move => ({
      id: move.moveId,
      name: move.name,
      name_zh: move.nameZh,
      type: move.type,
      type_zh: moveTypeZh(move.type),
      category: move.category,
      category_zh: moveCategoryZh(move.category),
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      priority: 0,
      short_desc: "",
      short_desc_zh: "",
      desc: "",
      desc_zh: "",
    })),
    base_stats: baseStats,
    stats,
    evs: pokemon.evs,
    ivs: pokemon.ivs,
    nature: pokemon.nature,
    nature_zh: NATURE_ZH[pokemon.nature] || pokemon.nature,
    nature_plus: "",
    nature_minus: "",
    role: candidate.role,
    role_zh: starterRoleLabel(candidate.role),
    shiny: pokemon.shiny,
    is_legendary: candidate.speciesRank === "legendary",
    starter_origin: "current",
    sprite: {
      national_dex: candidate.display?.nationalDex,
      front_default: pokemon.frontSpriteUrl || pokemon.spriteUrl,
      front_shiny: pokemon.frontShinySpriteUrl || pokemon.shinySpriteUrl,
      icon: pokemon.iconUrl,
      icon_style: pokemon.iconStyle,
    },
  };
}

function displayFromDetail(detail: DexPokemonDetail): FormalStarterCandidateV4["display"] {
  return {
    nationalDex: detail.num,
    types: detail.types || [],
    typesZh: (detail.types || []).map(typeLabelZh),
    baseStats: detail.baseStats,
    heightm: detail.heightm,
    weightkg: detail.weightkg,
  };
}

function typeLabelZh(type: string): string {
  const labels: Record<string, string> = {
    Normal: "一般",
    Fire: "火",
    Water: "水",
    Electric: "电",
    Grass: "草",
    Ice: "冰",
    Fighting: "格斗",
    Poison: "毒",
    Ground: "地面",
    Flying: "飞行",
    Psychic: "超能力",
    Bug: "虫",
    Rock: "岩石",
    Ghost: "幽灵",
    Dragon: "龙",
    Dark: "恶",
    Steel: "钢",
    Fairy: "妖精",
  };
  return labels[type] || type;
}

function moveTypeZh(type: string): string {
  return typeLabelZh(type);
}

function moveCategoryZh(category: string): string {
  const labels: Record<string, string> = {
    Physical: "物理",
    Special: "特殊",
    Status: "变化",
  };
  return labels[category] || category;
}

export function createBrowserFormalGameRunAdapter(storageKey = DEFAULT_FORMAL_RUN_KEY): FormalGameRunStorageAdapter {
  return {
    async loadFormalGameRun() {
      if (!hasBrowserStorage()) return null;
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) as FormalGameRunV4 : null;
    },
    async saveFormalGameRun(run) {
      if (hasBrowserStorage()) window.localStorage.setItem(storageKey, JSON.stringify(run));
      return run;
    },
    async deleteFormalGameRun() {
      if (hasBrowserStorage()) window.localStorage.removeItem(storageKey);
    },
  };
}

function collectPokemonRows(dex: ShowdownDexService, battlePreference: BattlePreferenceV4): Array<DexSearchRow & {rank: PokemonSpeciesRankV4; generation: number}> {
  const result = dex.searchDex({category: "pokemon", query: "", limit: 100});
  const rows: DexSearchRow[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore && offset < 2000) {
    const page = dex.searchDex({category: "pokemon", query: "", offset, limit: 100});
    rows.push(...page.rows);
    hasMore = page.hasMore;
    offset += 100;
  }
  if (!rows.length) rows.push(...result.rows);
  const allowedGenerations = new Set(battlePreference.allowedGenerations);
  return rows.flatMap(row => {
    const detail = safePokemonDetail(dex, row.id);
    const generation = generationForDexNum(detail.num);
    const rank = speciesRankForDetail(detail);
    if (!allowedGenerations.has(generation)) return [];
    if (!battlePreference.legendaryBattle && rank === "legendary") return [];
    return [{...row, rank, generation}];
  });
}

function filterRowsForRole<T extends DexSearchRow & {rank: PokemonSpeciesRankV4}>(rows: T[], role: FormalStarterRoleV4): T[] {
  const typeHints = ROLE_TYPE_HINTS[role] || [];
  return rows.filter(row => {
    const rankOk = role === "balanced" || row.rank === "rank3" || row.rank === "rank4" || row.rank === "rank5" || row.rank === "rank6";
    const typeOk = !typeHints.length || typeHints.some(type => row.tags.includes(type) || row.tags.includes(type.toLowerCase()));
    if (role === "trick-room") return rankOk && typeOk;
    if (role === "defensive-pivot") return rankOk && typeOk;
    if (role === "offense") return rankOk && typeOk;
    if (role === "weather") return rankOk && typeOk;
    return rankOk;
  });
}

function createStarterPokemon(dex: ShowdownDexService, detail: DexPokemonDetail, options: {
  index: number;
  role: FormalStarterRoleV4;
  powerProfile: PokemonPowerProfileV4;
  rng: () => number;
  seed: string;
}): LocalPokemonV4 {
  const ability = pickOne(detail.abilities, options.rng) || detail.abilities[0];
  const level = levelForPowerProfile(options.powerProfile, options.rng);
  const nature = pickOne(NATURES, options.rng) || "Serious";
  const evs = evsForPowerProfile(options.powerProfile, options.role, options.rng);
  const ivs = ivsForPowerProfile(options.powerProfile, options.rng);
  const moves = normalizeMovesForDetail(dex, detail, options.role, options.powerProfile, options.rng);
  const maxHp = dex.calculatePokemonStats({speciesId: detail.id, level, nature, evs, ivs}).stats.hp;
  return {
    localPokemonId: `formal-starter-${options.index + 1}-${detail.id}`,
    showdownId: detail.id,
    speciesId: detail.id,
    name: detail.name,
    nameZh: detail.nameZh,
    level,
    gender: "N",
    shiny: options.rng() < 0.02,
    itemId: "",
    heldItemInstanceId: undefined,
    abilityId: ability?.id || "",
    abilityName: ability?.name || "",
    abilityNameZh: ability?.nameZh || ability?.name || "",
    nature,
    moves,
    evs,
    ivs,
    entryHp: maxHp,
    entryStatus: "",
    maxHp,
    spriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    shinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    frontSpriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    backSpriteUrl: detail.sprites.backUrl || detail.sprites.fallbackBackUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    frontShinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
    backShinySpriteUrl: detail.sprites.backShinyUrl || detail.sprites.fallbackBackShinyUrl || detail.sprites.backUrl || detail.sprites.fallbackBackUrl || detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.iconUrl,
    iconUrl: detail.sprites.iconUrl,
    iconStyle: detail.sprites.iconStyle,
  };
}

function normalizeMovesForDetail(dex: ShowdownDexService, detail: DexPokemonDetail, role: FormalStarterRoleV4, powerProfile: PokemonPowerProfileV4, rng: () => number): TrainingMoveSlotV4[] {
  const learnset = dex.getPokemonSelfLearnSkills(detail.id);
  const damaging = learnset.filter(move => move.power > 0 && move.pp > 0);
  const support = learnset.filter(move => move.power === 0 && move.pp > 0);
  const selected: DexMoveSummary[] = [];
  if (role === "offense") selected.push(...shuffle(damaging, rng).slice(0, 3), ...shuffle(support, rng).slice(0, 1));
  else if (role === "defensive-pivot") selected.push(...shuffle(damaging, rng).slice(0, 2), ...shuffle(support, rng).slice(0, 2));
  else if (role === "trick-room") selected.push(...preferMoves(learnset, ["trickroom", "protect"], rng).slice(0, 2), ...shuffle(damaging, rng).slice(0, 2));
  else if (role === "weather") selected.push(...preferMoves(learnset, ["raindance", "sunnyday", "sandstorm", "snowscape", "hail"], rng).slice(0, 1), ...shuffle(damaging, rng).slice(0, 3));
  else selected.push(...shuffle(damaging, rng).slice(0, 2), ...shuffle(support, rng).slice(0, 2));
  const qualitySelected = powerProfile === "rookie" ? selected.slice(0, 4) : shuffle(selected, rng).slice(0, 4);
  const moveIds = qualitySelected.map(move => move.id);
  return normalizeMoves(dex, moveIds, 4);
}

function normalizeMoves(dex: ShowdownDexService, moveIds: string[], count: number): TrainingMoveSlotV4[] {
  const ids = [...moveIds];
  for (const fallback of FALLBACK_MOVES) {
    if (ids.length >= count) break;
    if (!ids.includes(fallback)) ids.push(fallback);
  }
  return ids.slice(0, count).map(moveId => {
    const move = safeMove(dex, moveId);
    return {
      moveId: move.id,
      name: move.name,
      nameZh: move.nameZh,
      type: move.type,
      category: move.category,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      maxPp: move.pp,
      remainingPp: move.pp,
    };
  });
}

function preferMoves(moves: DexMoveSummary[], preferredIds: string[], rng: () => number): DexMoveSummary[] {
  const preferred = moves.filter(move => preferredIds.includes(toID(move.id)));
  const rest = moves.filter(move => !preferredIds.includes(toID(move.id)));
  return [...shuffle(preferred, rng), ...shuffle(rest, rng)];
}

function speciesRankForDetail(detail: DexPokemonDetail): PokemonSpeciesRankV4 {
  if (LEGENDARY_DEX_NUMBERS.has(detail.num)) return "legendary";
  const bst = STAT_IDS.reduce((sum, stat) => sum + Number(detail.baseStats[stat] || 0), 0);
  if (bst < 250) return "rank1";
  if (bst < 340) return "rank2";
  if (bst < 430) return "rank3";
  if (bst < 500) return "rank4";
  if (bst < 570) return "rank5";
  return "rank6";
}

function powerProfileForStreak(streak: number, index: number): PokemonPowerProfileV4 {
  const safeStreak = Math.max(0, Math.floor(Number(streak || 0)));
  if (safeStreak <= 0) return index < 3 ? "rookie" : "normal";
  if (safeStreak === 1) return index < 2 ? "normal" : "elite";
  return "elite";
}

function levelForPowerProfile(profile: PokemonPowerProfileV4, rng: () => number): number {
  if (profile === "rookie") return randomInt(45, 50, rng);
  if (profile === "normal") return randomInt(45, 50, rng);
  if (profile === "elite") return randomInt(50, 54, rng);
  if (profile === "boss") return 55;
  return randomInt(58, 60, rng);
}

function ivsForPowerProfile(profile: PokemonPowerProfileV4, rng: () => number): StatTableV4 {
  const range = profile === "rookie" ? [8, 20] : profile === "normal" ? [16, 25] : profile === "elite" ? [24, 31] : [28, 31];
  return Object.fromEntries(STAT_IDS.map(stat => [stat, profile === "champion" ? 31 : randomInt(range[0], range[1], rng)])) as StatTableV4;
}

function evsForPowerProfile(profile: PokemonPowerProfileV4, role: FormalStarterRoleV4, rng: () => number): StatTableV4 {
  const budget = profile === "rookie" ? 120 : profile === "normal" ? 240 : profile === "elite" ? 420 : profile === "boss" ? 500 : 508;
  const priority: DexStatId[] = role === "defensive-pivot"
    ? ["hp", "def", "spd", "atk", "spa", "spe"]
    : role === "trick-room"
      ? ["hp", "atk", "spa", "def", "spd", "spe"]
      : ["spe", "atk", "spa", "hp", "def", "spd"];
  const evs = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as StatTableV4;
  let remaining = budget;
  for (const stat of priority) {
    if (remaining <= 0) break;
    const value = Math.min(252, remaining, randomInt(40, 160, rng));
    evs[stat] = value;
    remaining -= value;
  }
  return evs;
}

function generationForDexNum(num: number): number {
  if (num <= 151) return 1;
  if (num <= 251) return 2;
  if (num <= 386) return 3;
  if (num <= 493) return 4;
  if (num <= 649) return 5;
  if (num <= 721) return 6;
  if (num <= 809) return 7;
  if (num <= 905) return 8;
  return 9;
}

function safePokemonDetail(dex: ShowdownDexService, speciesId: string): DexPokemonDetail {
  try {
    return dex.getPokemonDetail(speciesId);
  } catch {
    return dex.getPokemonDetail(FALLBACK_SPECIES[0]!);
  }
}

function safeMove(dex: ShowdownDexService, moveId: string): DexMoveSummary {
  try {
    return dex.getMoveDetail(moveId);
  } catch {
    return dex.getMoveDetail("tackle");
  }
}

function fallbackRow(index: number): DexSearchRow & {rank: PokemonSpeciesRankV4; generation: number} {
  const id = FALLBACK_SPECIES[index % FALLBACK_SPECIES.length]!;
  return {
    id,
    category: "pokemon",
    name: id,
    nameZh: id,
    subtitle: "",
    description: "fallback species",
    tags: [id],
    rank: "rank4",
    generation: 1,
  };
}

function normalizeFormalMode(mode: unknown): FormalGameModeV4 {
  return mode === "doubles" || mode === "coop" ? mode : "singles";
}

function normalizeFormalStatus(status: unknown, candidateCount: number): FormalGameStatusV4 {
  if (status === "starterSelected" || status === "roundPlanPending" || status === "ended") return status;
  if (status === "starterSelecting") return candidateCount ? "starterSelecting" : "starterPreparing";
  return "starterPreparing";
}

function normalizeCoopPartnerPreference(value: unknown): CoopPartnerPreferenceV4 {
  return value === "offense" || value === "defense" || value === "support" || value === "balanced" ? value : "balanced";
}

function normalizeStarterRole(value: unknown): FormalStarterRoleV4 {
  return value === "weather" || value === "trick-room" || value === "offense" || value === "defensive-pivot" || value === "balanced" ? value : "balanced";
}

function normalizeSpeciesRank(value: unknown): PokemonSpeciesRankV4 {
  return value === "rank1" || value === "rank2" || value === "rank3" || value === "rank4" || value === "rank5" || value === "rank6" || value === "legendary" ? value : "rank4";
}

function normalizePowerProfile(value: unknown): PokemonPowerProfileV4 {
  return value === "rookie" || value === "normal" || value === "elite" || value === "boss" || value === "champion" ? value : "normal";
}

function normalizeGender(gender: unknown): TrainingGenderV4 {
  return gender === "M" || gender === "F" ? gender : "N";
}

function normalizeStatus(status: unknown): TrainingStatusV4 {
  return status === "brn" || status === "par" || status === "psn" || status === "tox" || status === "slp" || status === "frz" ? status : "";
}

function normalizeStats(stats: Record<string, number> | undefined, fallback: number, max: number): StatTableV4 {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, clampInt(stats?.[stat], 0, max, fallback)])) as StatTableV4;
}

function starterRoleLabel(role: FormalStarterRoleV4): string {
  if (role === "weather") return "天气组件";
  if (role === "trick-room") return "空间组件";
  if (role === "offense") return "进攻核心";
  if (role === "defensive-pivot") return "防御中转";
  return "平衡补位";
}

function hasBrowserStorage(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function createId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}-${cryptoApi.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.round(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function randomInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickOne<T>(values: T[], rng: () => number): T | undefined {
  if (!values.length) return undefined;
  return values[Math.floor(rng() * values.length)] || values[0];
}

function shuffle<T>(values: T[], rng: () => number): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }
  return next;
}

function createRng(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6D2B79F5;
    let next = state;
    next = Math.imul(next ^ next >>> 15, next | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
