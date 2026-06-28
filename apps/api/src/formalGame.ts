import type {
  DexMoveSummary,
  DexPokemonDetail,
  DexSearchRow,
  DexStatId,
  DexTrainerDetail,
  ShowdownDexService,
} from "@changebattle-v2/showdown-dex-core";
import {FormalPokemonSpeciesRankById, type FormalPokemonSpeciesRankData} from "./formalSpeciesRanks.js";
import {cloneStarChartV4, starterCandidateCountForStarChart, type StarChartStateV4} from "./starChart.js";
import {
  normalizeBattlePreferenceV4,
  type BattlePreferenceV4,
  type BagStateV4,
  type LocalPokemonV4,
  type LocalTeamV4,
  type ShowdownPlayerIdV4,
  type StatTableV4,
  type TrainingGenderV4,
  type TrainingPlayerDraftV4,
  type TrainingMoveSlotV4,
  type TrainingRuleSetV4,
  type TrainingRunGameNodeV4,
  type TrainingRunGameV4,
  type TrainingStatusV4,
  type TrainingUserProfileInputV4,
} from "./training.js";

export type FormalGameModeV4 = "singles" | "doubles" | "coop";
export type FormalGameStatusV4 = "starterPreparing" | "starterSelecting" | "starterSelected" | "roundPlanPending" | "roundPlanning" | "resting" | "ended";
export type FormalStarterRoleV4 = "weather" | "trick-room" | "offense" | "support" | "defense" | "speed-control" | "disruption" | "flex-offense" | "flex-defense" | "balanced";
export type PokemonSpeciesRankV4 = FormalPokemonSpeciesRankData;
export type PokemonPowerProfileV4 = "rookie" | "normal" | "elite" | "boss" | "champion";
export type CoopPartnerPreferenceV4 = "offense" | "defense" | "support" | "balanced";
export type FormalNpcTypeV4 = "rookie" | "normal" | "elite" | "gym" | "elite4" | "champion" | "villain";
export type FormalNpcBattlePreferenceV4 = "offense" | "defense" | "support" | "balanced";
export type FormalNpcTeamPreferenceV4 = "balanced" | "rain" | "sun" | "sand" | "snow" | "trick-room" | "tailwind" | "terrain" | "hazard-stack" | "poison-stall" | "setup-offense";

export type FormalRoundNpcSnapshotV4 = {
  id: string;
  trainerId: string;
  trainerType: FormalNpcTypeV4;
  name: string;
  avatar: string;
  playerId: ShowdownPlayerIdV4;
  battlePreference: FormalNpcBattlePreferenceV4;
  teamPreference: FormalNpcTeamPreferenceV4;
  powerProfile: PokemonPowerProfileV4;
  isBoss: boolean;
  diagnostics: string[];
};

export type FormalRoundPlanV4 = {
  id: string;
  index: number;
  mode: FormalGameModeV4;
  ruleSet: TrainingRuleSetV4;
  difficulty: FormalNpcTypeV4;
  seed: string;
  npcs: FormalRoundNpcSnapshotV4[];
  participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
  diagnostics: string[];
};

type FormalBossTrainerCandidateV4 = Pick<DexTrainerDetail, "id" | "trainerType" | "nameZh" | "avatarAsset" | "bossProfile" | "presetTeamPreviews">;
type FormalTrainerVisualCandidateV4 = Pick<DexTrainerDetail, "id" | "trainerType" | "nameZh" | "frontAsset" | "frontGifAsset" | "avatarAsset">;

export type FormalStarterCandidateDiagnosticsV4 = {
  role: FormalStarterRoleV4;
  speciesRank: PokemonSpeciesRankV4;
  powerProfile: PokemonPowerProfileV4;
  generation: number;
  poolSize: number;
  filters: {
    allowedGenerations: number[];
    legendaryBattle: boolean;
    battleBagEnabled: boolean;
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
  starChartSnapshot: StarChartStateV4;
  coopPartnerPreference?: CoopPartnerPreferenceV4;
  starterCandidates: FormalStarterCandidateV4[];
  selectedStarterIndexes: number[];
  playerTeam: LocalTeamV4 | null;
  roundPlan: FormalRoundPlanV4[];
  restRunSnapshot: TrainingRunGameV4 | null;
  currentRoundIndex: number;
  money: number;
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
  createFormalGameRun(profile: FormalGameUserProfileInputV4, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}): FormalGameRunV4;
  prepareFormalStarterCandidates(run: FormalGameRunV4, options?: {count?: number; seed?: string}): FormalGameRunV4;
  selectFormalStarterPokemon(run: FormalGameRunV4, selectedIndexes: number[]): FormalGameRunV4;
  prepareFormalRoundPlan(run: FormalGameRunV4): FormalGameRunV4;
  selectedCountForFormalMode(mode: FormalGameModeV4): number;
};

export type FormalGameUserProfileInputV4 = TrainingUserProfileInputV4 & {
  starChart?: StarChartStateV4 | null;
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
  "support",
  "defense",
  "speed-control",
  "disruption",
  "flex-defense",
  "flex-offense",
];
const STARTER_ALLOWED_RANKS = new Set<PokemonSpeciesRankV4>(["rank4", "rank5", "rank6"]);
const STARTER_MAX_LEGENDARY_CANDIDATES = 1;
export const FORMAL_STARTER_SHINY_RATE = 1 / 30;
const FORMAL_ROUND_COUNT = 7;
const FORMAL_STARTING_MONEY = 3000;
const FALLBACK_SPECIES = ["lucario", "charizard", "gardevoir", "dragonite", "greninja", "venusaur", "arcanine", "lapras", "gyarados", "snorlax"];
const FALLBACK_MOVES = ["tackle", "quickattack", "protect", "rest"];
const NPC_ITEMS = ["leftovers", "choicescarf", "choiceband", "choicespecs", "lifeorb", "focussash", "sitrusberry", "lumberry", "rockyhelmet", "assaultvest", "heavydutyboots"];
const NPC_BATTLE_PREFERENCES: FormalNpcBattlePreferenceV4[] = ["offense", "defense", "support", "balanced"];
const NPC_TEAM_PREFERENCES: FormalNpcTeamPreferenceV4[] = ["rain", "sun", "sand", "snow", "trick-room", "tailwind", "terrain", "hazard-stack", "poison-stall", "setup-offense", "balanced"];
const ROUND_DISTRIBUTIONS: Record<"0" | "1" | "2" | "3", FormalNpcTypeV4[]> = {
  "0": ["rookie", "normal", "gym", "normal", "normal", "elite", "gym"],
  "1": ["normal", "elite", "gym", "elite", "gym", "elite", "elite4"],
  "2": ["elite", "elite", "elite4", "elite", "gym", "elite4", "champion"],
  "3": ["elite", "gym", "elite", "elite4", "elite4", "elite4", "champion"],
};
const NORMAL_NPC_NAMES = {
  rookie: ["短裤少年", "迷你裙", "捕虫少年", "露营少年", "学生"],
  normal: ["精英训练家", "宝可梦巡护员", "背包客", "空手道王", "大姐姐"],
  elite: ["王牌训练家", "资深训练家", "战术教练", "对战女郎", "道馆助教"],
  ally: ["精英队友", "战术搭档", "支援训练家", "合作专家", "双打拍档"],
} as const;
const DEFAULT_TRAINER_AVATAR = "/npc/avatars/1-asset-18b76b7d.webp";
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
const ROLE_TYPE_HINTS: Record<FormalStarterRoleV4, string[]> = {
  weather: ["Water", "Fire", "Rock", "Ice", "Ground", "Grass"],
  "trick-room": ["Psychic", "Ghost", "Fairy", "Rock", "Steel"],
  offense: ["Dragon", "Fire", "Electric", "Fighting", "Dark", "Flying"],
  support: ["Fairy", "Grass", "Psychic", "Water", "Normal"],
  defense: ["Steel", "Water", "Grass", "Poison", "Ground"],
  "speed-control": ["Electric", "Flying", "Psychic", "Fairy", "Bug"],
  disruption: ["Poison", "Ghost", "Dark", "Steel", "Ground", "Grass"],
  "flex-defense": ["Steel", "Water", "Grass", "Poison", "Ground"],
  "flex-offense": ["Dragon", "Fire", "Electric", "Fighting", "Dark", "Flying"],
  balanced: [],
};

export function createFormalGameRunApi(dex: ShowdownDexService, storage: FormalGameRunStorageAdapter = createBrowserFormalGameRunAdapter()): FormalGameRunApi {
  function createFormalGameRun(profile: FormalGameUserProfileInputV4, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}): FormalGameRunV4 {
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
      starChartSnapshot: cloneStarChartV4(profile.starChart),
      coopPartnerPreference: mode === "coop" ? normalizeCoopPartnerPreference(options.coopPartnerPreference) : undefined,
      starterCandidates: [],
      selectedStarterIndexes: [],
      playerTeam: null,
      roundPlan: [],
      restRunSnapshot: null,
      currentRoundIndex: 0,
      money: FORMAL_STARTING_MONEY,
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
      count: options.count || starterCandidateCountForStarChart(normalized.starChartSnapshot),
    });
    return normalizeFormalRun({
      ...normalized,
      status: "starterSelecting",
      seed,
      starterCandidates: candidates,
      selectedStarterIndexes: [],
      playerTeam: null,
      roundPlan: [],
      restRunSnapshot: null,
      currentRoundIndex: 0,
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
      roundPlan: [],
      restRunSnapshot: null,
      currentRoundIndex: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  function prepareFormalRoundPlan(run: FormalGameRunV4): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    if (!normalized.playerTeam?.pokemon.length) {
      throw new Error("需要先确认初始队伍。");
    }
    const rng = createRng(`${normalized.seed}:round-plan:${normalized.mode}:${normalized.streak}`);
    const usedNpcSpecies = new Set<string>();
    const player = createFormalPlayerDraft(normalized);
    const distribution = roundDistributionForStreak(normalized.streak);
    const roundPlan: FormalRoundPlanV4[] = distribution.map((difficulty, index) => {
      const seed = `${normalized.seed}:round:${index + 1}`;
      const roundRng = createRng(seed);
      const roundDifficulty = maybeReplaceChampionWithVillain(difficulty, roundRng);
      const participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> = {p1: player};
      const npcs: FormalRoundNpcSnapshotV4[] = [];
      const diagnostics: string[] = [];
      const enemyTypes = normalized.mode === "coop" ? [roundDifficulty, roundDifficulty] : [roundDifficulty];
      enemyTypes.forEach((trainerType, enemyIndex) => {
        const playerId = enemyIndex === 0 ? "p2" : "p4";
        const built = createFormalNpcParticipant({
          run: normalized,
          trainerType,
          playerId,
          roundIndex: index,
          slotIndex: enemyIndex,
          alliance: "far",
          controller: "ai",
          usedNpcSpecies,
          rng: roundRng,
        });
        participants[playerId] = built.player;
        npcs.push(built.npc);
        diagnostics.push(...built.diagnostics);
      });
      if (normalized.mode === "coop") {
        const built = createFormalNpcParticipant({
          run: normalized,
          trainerType: "elite",
          playerId: "p3",
          roundIndex: index,
          slotIndex: 2,
          alliance: "near",
          controller: "script",
          usedNpcSpecies,
          rng: roundRng,
          partnerPreference: normalized.coopPartnerPreference,
        });
        participants.p3 = built.player;
        npcs.push(built.npc);
        diagnostics.push("coop-ally:elite");
        diagnostics.push(...built.diagnostics);
      }
      return {
        id: `formal-round-${index + 1}`,
        index,
        mode: normalized.mode,
        ruleSet: normalized.battlePreference.ruleSet,
        difficulty: roundDifficulty,
        seed,
        npcs,
        participants,
        diagnostics,
      };
    });
    const restRunSnapshot = createFormalRestRunSnapshot(normalized, player, roundPlan);
    return normalizeFormalRun({
      ...normalized,
      status: "resting",
      roundPlan,
      restRunSnapshot,
      currentRoundIndex: 0,
      money: normalized.money || FORMAL_STARTING_MONEY,
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
      starChartSnapshot: cloneStarChartV4(run.starChartSnapshot),
      coopPartnerPreference: mode === "coop" ? normalizeCoopPartnerPreference(run.coopPartnerPreference) : undefined,
      starterCandidates,
      selectedStarterIndexes,
      playerTeam: run.playerTeam ? normalizePlayerTeam(run.playerTeam) : null,
      roundPlan: Array.isArray(run.roundPlan) ? run.roundPlan.map(normalizeRoundPlan) : [],
      restRunSnapshot: run.restRunSnapshot ? normalizeFormalRestRunSnapshot(run.restRunSnapshot) : null,
      currentRoundIndex: clampInt(run.currentRoundIndex, 0, FORMAL_ROUND_COUNT - 1, 0),
      money: clampInt(run.money, 0, 999999, FORMAL_STARTING_MONEY),
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
          battleBagEnabled: candidateBattlePreference.battleBagEnabled,
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

  function createFormalPlayerDraft(run: FormalGameRunV4): TrainingPlayerDraftV4 {
    const team = run.playerTeam || {id: `formal-player-team-${run.id}`, name: "正式游戏初始队伍", pokemon: []};
    return {
      playerId: "p1",
      name: "玩家",
      avatar: "/npc/avatars/6-asset-a73f3e71.webp",
      controller: "local",
      alliance: "near",
      localTeam: {
        ...team,
        pokemon: team.pokemon.map((pokemon, index) => ({
          ...pokemon,
          localPokemonId: `formal-p1-${index + 1}-${pokemon.speciesId}`,
          itemId: "",
          heldItemInstanceId: undefined,
          entryHp: pokemon.maxHp,
          entryStatus: "",
        })),
      },
      bag: createEmptyBag(run.battlePreference.battleBagEnabled),
    };
  }

  function createFormalNpcParticipant(input: {
    run: FormalGameRunV4;
    trainerType: FormalNpcTypeV4;
    playerId: ShowdownPlayerIdV4;
    roundIndex: number;
    slotIndex: number;
    alliance: "near" | "far";
    controller: "ai" | "script";
    usedNpcSpecies: Set<string>;
    rng: () => number;
    partnerPreference?: CoopPartnerPreferenceV4;
  }): {player: TrainingPlayerDraftV4; npc: FormalRoundNpcSnapshotV4; diagnostics: string[]} {
    const diagnostics: string[] = [];
    const isBoss = isBossTrainerType(input.trainerType);
    const battlePreference = input.partnerPreference || pickOne(NPC_BATTLE_PREFERENCES, input.rng) || "balanced";
    const teamPreference = teamPreferenceForNpc(input.trainerType, battlePreference, input.rng);
    const boss = isBoss ? selectBossTrainer(input.trainerType, input.rng) : null;
    const visual = boss ? null : selectTrainerVisual(input.rng, input.controller === "script");
    const name = boss?.nameZh || visual?.nameZh || normalNpcName(input.trainerType, input.controller === "script", input.rng);
    const avatar = boss?.avatarAsset || fullBodyTrainerAsset(visual) || DEFAULT_TRAINER_AVATAR;
    const teamResult = boss
      ? createBossLocalTeam(input.run, boss, input.playerId, teamPreference, input.usedNpcSpecies, input.rng)
      : createNpcLocalTeam(input.run, {
        playerId: input.playerId,
        teamPreference,
        battlePreference,
        trainerType: input.trainerType,
        usedNpcSpecies: input.usedNpcSpecies,
        rng: input.rng,
      });
    diagnostics.push(...teamResult.diagnostics);
    const npc: FormalRoundNpcSnapshotV4 = {
      id: `formal-npc-${input.roundIndex + 1}-${input.playerId}`,
      trainerId: boss?.id || `generated:${input.trainerType}:${input.roundIndex + 1}:${input.playerId}`,
      trainerType: input.trainerType,
      name,
      avatar,
      playerId: input.playerId,
      battlePreference,
      teamPreference,
      powerProfile: powerProfileForNpc(input.trainerType),
      isBoss,
      diagnostics,
    };
    return {
      npc,
      diagnostics,
      player: {
        playerId: input.playerId,
        name,
        avatar,
        controller: input.controller,
        alliance: input.alliance,
        localTeam: teamResult.team,
        bag: createEmptyBag(input.run.battlePreference.battleBagEnabled),
      },
    };
  }

  function createBossLocalTeam(
    run: FormalGameRunV4,
    boss: FormalBossTrainerCandidateV4,
    playerId: ShowdownPlayerIdV4,
    fallbackTeamPreference: FormalNpcTeamPreferenceV4,
    usedNpcSpecies: Set<string>,
    rng: () => number,
  ): {team: LocalTeamV4; diagnostics: string[]} {
    const diagnostics: string[] = [`boss:${boss.id}`];
    const ruleSetPreset = run.battlePreference.ruleSet === "standard" ? "none" : run.battlePreference.ruleSet;
    const previews = boss.presetTeamPreviews
      .filter(team => team.mode === run.mode && team.ruleSetPreset === ruleSetPreset)
      .filter(team => team.pokemon.length >= 6)
      .filter(team => run.battlePreference.legendaryBattle || team.pokemon.every(pokemon => speciesRankForDetail(safePokemon(pokemon.speciesId)) !== "legendary"))
      .filter(team => team.pokemon.every(pokemon => run.battlePreference.allowedGenerations.includes(generationForDexNum(safePokemon(pokemon.speciesId).num))));
    const candidates = previews.length ? previews : boss.presetTeamPreviews.filter(team => team.mode === run.mode).filter(team => team.pokemon.length >= 6);
    if (!previews.length) diagnostics.push("boss-static-filter-relaxed");
    const selected = [...candidates].sort((a, b) => {
      const overlapA = a.pokemon.filter(pokemon => usedNpcSpecies.has(baseSpeciesId(pokemon.speciesId))).length;
      const overlapB = b.pokemon.filter(pokemon => usedNpcSpecies.has(baseSpeciesId(pokemon.speciesId))).length;
      if (overlapA !== overlapB) return overlapA - overlapB;
      return stableScore(`${a.trainerId}:${a.ruleSetPreset}:${a.mode}:${a.variantIndex}`) - stableScore(`${b.trainerId}:${b.ruleSetPreset}:${b.mode}:${b.variantIndex}`);
    })[0];
    if (!selected) {
      diagnostics.push("boss-static-missing-generated-fallback");
      return createNpcLocalTeam(run, {
        playerId,
        teamPreference: fallbackTeamPreference,
        battlePreference: boss.bossProfile?.battlePreference || "balanced",
        trainerType: boss.trainerType as FormalNpcTypeV4,
        usedNpcSpecies,
        rng,
      });
    }
    const pokemon = selected.pokemon.slice(0, 6).map((entry, index) => {
      const detail = safePokemon(entry.speciesId);
      const role = roleForTeamPreference(selected.teamArchetype as FormalNpcTeamPreferenceV4, index);
      const local = createStarterPokemon(dex, detail, {
        index,
        role,
        powerProfile: powerProfileForNpc(boss.trainerType as FormalNpcTypeV4),
        rng,
        seed: `${run.seed}:${boss.id}:${selected.variantIndex}`,
      });
      const item = itemIdFromName(entry.item) || pickOne(NPC_ITEMS, rng) || "";
      usedNpcSpecies.add(baseSpeciesId(detail.id));
      return {
        ...local,
        localPokemonId: `${playerId}-boss-${index + 1}-${detail.id}`,
        itemId: item,
        heldItemInstanceId: undefined,
        level: clampInt(entry.level, 1, 100, local.level),
        abilityName: entry.ability || local.abilityName,
        abilityNameZh: entry.ability || local.abilityNameZh,
      };
    });
    diagnostics.push(`boss-static:${selected.ruleSetPreset}:${selected.mode}:${selected.variantIndex}`);
    diagnostics.push(`team-archetype:${selected.teamArchetype}`);
    return {team: {id: `formal-team-${playerId}-${boss.id}`, name: `${boss.nameZh} 队伍`, pokemon}, diagnostics};
  }

  function createNpcLocalTeam(run: FormalGameRunV4, input: {
    playerId: ShowdownPlayerIdV4;
    teamPreference: FormalNpcTeamPreferenceV4;
    battlePreference: FormalNpcBattlePreferenceV4;
    trainerType: FormalNpcTypeV4;
    usedNpcSpecies: Set<string>;
    rng: () => number;
  }): {team: LocalTeamV4; diagnostics: string[]} {
    const diagnostics = [`npc-theme:${input.teamPreference}`, `npc-ai:${input.battlePreference}`];
    const rows = collectPokemonRows(dex, run.battlePreference);
    const themed = filterRowsForNpcTeam(rows, input.teamPreference, input.battlePreference);
    const pool = themed.length >= 6 ? themed : rows;
    const selected: Array<DexSearchRow & {rank: PokemonSpeciesRankV4; generation: number}> = [];
    const usedInTeam = new Set<string>();
    for (let index = 0; index < 6; index += 1) {
      const role = roleForTeamPreference(input.teamPreference, index);
      const rolePool = filterRowsForRole(pool, role);
      const candidates = (rolePool.length ? rolePool : pool)
        .filter(row => !usedInTeam.has(baseSpeciesId(row.id)))
        .filter(row => !input.usedNpcSpecies.has(baseSpeciesId(row.id)));
      const relaxed = (rolePool.length ? rolePool : pool).filter(row => !usedInTeam.has(baseSpeciesId(row.id)));
      const picked = pickOne(candidates.length ? candidates : relaxed, input.rng) || fallbackRow(index);
      if (!candidates.length) diagnostics.push(`species-dedupe-relaxed:${index + 1}`);
      selected.push(picked);
      usedInTeam.add(baseSpeciesId(picked.id));
      input.usedNpcSpecies.add(baseSpeciesId(picked.id));
    }
    const powerProfile = powerProfileForNpc(input.trainerType);
    const pokemon = selected.map((row, index) => {
      const detail = safePokemon(row.id);
      const local = createStarterPokemon(dex, detail, {
        index,
        role: roleForTeamPreference(input.teamPreference, index),
        powerProfile,
        rng: input.rng,
        seed: `${run.seed}:${input.playerId}:${input.teamPreference}`,
      });
      return {
        ...local,
        localPokemonId: `${input.playerId}-npc-${index + 1}-${detail.id}`,
        itemId: pickOne(NPC_ITEMS, input.rng) || "",
        heldItemInstanceId: undefined,
      };
    });
    return {
      diagnostics,
      team: {
        id: `formal-team-${input.playerId}-${input.teamPreference}`,
        name: `${input.playerId.toUpperCase()} ${teamPreferenceLabel(input.teamPreference)}`,
        pokemon,
      },
    };
  }

  function createFormalRestRunSnapshot(run: FormalGameRunV4, player: TrainingPlayerDraftV4, roundPlan: FormalRoundPlanV4[]): TrainingRunGameV4 {
    const first = roundPlan[0];
    const firstParticipants = first?.participants || {p1: player};
    const scenarioPlayers = ["p1", "p2", "p3", "p4"]
      .map(playerId => firstParticipants[playerId as ShowdownPlayerIdV4])
      .filter(Boolean) as TrainingPlayerDraftV4[];
    const scenario = {
      id: `formal-scenario-${run.id}`,
      name: "正式游戏",
      mode: run.mode,
      ruleSet: run.battlePreference.ruleSet,
      battleCount: FORMAL_ROUND_COUNT,
      selectedNpcIds: Object.fromEntries(roundPlan[0]?.npcs.map(npc => [npc.playerId, npc.trainerId]) || []) as Partial<Record<ShowdownPlayerIdV4, string>>,
      players: scenarioPlayers,
    };
    const gameMap: TrainingRunGameNodeV4[] = roundPlan.map(round => ({
      id: round.id,
      index: round.index,
      state: round.index === 0 ? "ready" : "locked",
      p1: "p1",
      p2: "p2",
      p3: run.mode === "coop" ? "p3" : null,
      p4: run.mode === "coop" ? "p4" : null,
      mode: round.mode,
      ruleSet: round.ruleSet,
      seed: round.seed,
      participants: round.participants,
      battleGame: null,
      createdAt: new Date().toISOString(),
    }));
    return {
      version: 1,
      id: `formal-rest-${run.id}`,
      source: "training",
      status: "resting",
      profileId: run.profileId,
      createdAt: run.createdAt,
      updatedAt: new Date().toISOString(),
      scenario,
      players: firstParticipants,
      currentNodeId: gameMap[0]?.id || null,
      gameMap,
      result: null,
      battlePreference: run.battlePreference,
      restPreviewUnlocks: {},
    };
  }

  function normalizeRoundPlan(round: FormalRoundPlanV4): FormalRoundPlanV4 {
    return {
      id: round.id || createId("formal-round"),
      index: clampInt(round.index, 0, FORMAL_ROUND_COUNT - 1, 0),
      mode: normalizeFormalMode(round.mode),
      ruleSet: normalizeBattlePreferenceV4({ruleSet: round.ruleSet}).ruleSet,
      difficulty: normalizeNpcType(round.difficulty),
      seed: round.seed || createId("formal-round-seed"),
      npcs: Array.isArray(round.npcs) ? round.npcs.map(normalizeNpcSnapshot) : [],
      participants: round.participants || {},
      diagnostics: Array.isArray(round.diagnostics) ? round.diagnostics.map(String) : [],
    };
  }

  function normalizeNpcSnapshot(npc: FormalRoundNpcSnapshotV4): FormalRoundNpcSnapshotV4 {
    return {
      id: npc.id || createId("formal-npc"),
      trainerId: npc.trainerId || npc.id || "generated:npc",
      trainerType: normalizeNpcType(npc.trainerType),
      name: npc.name || "训练家",
      avatar: npc.avatar || DEFAULT_TRAINER_AVATAR,
      playerId: normalizePlayerId(npc.playerId),
      battlePreference: normalizeNpcBattlePreference(npc.battlePreference),
      teamPreference: normalizeNpcTeamPreference(npc.teamPreference),
      powerProfile: normalizePowerProfile(npc.powerProfile),
      isBoss: Boolean(npc.isBoss),
      diagnostics: Array.isArray(npc.diagnostics) ? npc.diagnostics.map(String) : [],
    };
  }

  function normalizeFormalRestRunSnapshot(snapshot: TrainingRunGameV4): TrainingRunGameV4 {
    const players = normalizeFormalRestPlayers(snapshot.players || {});
    const gameMap = Array.isArray(snapshot.gameMap)
      ? snapshot.gameMap.map(node => ({...node, participants: normalizeFormalRestPlayers(node.participants || {})}))
      : [];
    return {
      ...snapshot,
      version: 1,
      source: "training",
      status: "resting",
      currentNodeId: snapshot.currentNodeId || gameMap[0]?.id || null,
      gameMap,
      players,
      restPreviewUnlocks: snapshot.restPreviewUnlocks || {},
      battlePreference: normalizeBattlePreferenceV4(snapshot.battlePreference),
    };
  }

  function normalizeFormalRestPlayers(players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>): Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> {
    return Object.fromEntries(Object.entries(players).map(([playerId, player]) => {
      const typedPlayerId = normalizePlayerId(playerId);
      if (!player || typedPlayerId === "p1" || player.controller === "local") return [typedPlayerId, player];
      return [typedPlayerId, {...player, avatar: normalizeNpcFullBodyAvatar(player.avatar, `${player.name}:${typedPlayerId}`)}];
    }).filter(([, player]) => Boolean(player))) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
  }

  function normalizeNpcFullBodyAvatar(avatar: string, seed: string): string {
    if (avatar && !avatar.includes("/npc/avatars/")) return avatar;
    const visual = selectTrainerVisual(createRng(`npc-visual:${seed}`), false);
    return fullBodyTrainerAsset(visual) || avatar || DEFAULT_TRAINER_AVATAR;
  }

  function selectBossTrainer(trainerType: FormalNpcTypeV4, rng: () => number): FormalBossTrainerCandidateV4 | null {
    try {
      const result = dex.searchDex({category: "trainers", query: `type:${trainerType}`, limit: 100});
      const rows = result.rows.filter(row => row.category === "trainers");
      const candidates = rows.flatMap(row => {
        try {
          const detail = dex.getTrainerDetail(row.id);
          if (detail.trainerType !== trainerType) return [];
          if (!detail.presetTeamPreviews?.length && !detail.bossProfile) return [];
          return [{
            id: detail.id,
            trainerType: detail.trainerType,
            nameZh: detail.nameZh,
            avatarAsset: detail.frontGifAsset || detail.frontAsset || detail.avatarAsset,
            bossProfile: detail.bossProfile,
            presetTeamPreviews: detail.presetTeamPreviews || [],
          }];
        } catch {
          return [];
        }
      });
      return pickOne(candidates, rng) || null;
    } catch {
      return null;
    }
  }

  function selectTrainerVisual(rng: () => number, preferPlayer = false): FormalTrainerVisualCandidateV4 | null {
    const normal = trainerVisualsByType("normal");
    const player = trainerVisualsByType("player");
    const primary = preferPlayer ? player : normal.filter(entry => fullBodyTrainerAsset(entry));
    const fallback = preferPlayer ? normal : player;
    return pickOne(primary.length ? primary : fallback, rng) || null;
  }

  function trainerVisualsByType(type: "normal" | "player"): FormalTrainerVisualCandidateV4[] {
    try {
      const result = dex.searchDex({category: "trainers", query: `type:${type}`, limit: 300});
      return result.rows.flatMap(row => {
        try {
          const detail = dex.getTrainerDetail(row.id);
          if (detail.trainerType !== type) return [];
          return [{
            id: detail.id,
            trainerType: detail.trainerType,
            nameZh: detail.nameZh,
            frontAsset: detail.frontAsset,
            frontGifAsset: detail.frontGifAsset,
            avatarAsset: detail.avatarAsset,
          }];
        } catch {
          return [];
        }
      });
    } catch {
      return [];
    }
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
    prepareFormalRoundPlan,
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
  const count = clampInt(input.count, 1, 10, 10);
  const rng = createRng(`${input.seed}:${input.mode}:${input.streak}:${battlePreference.ruleSet}`);
  const rows = collectPokemonRows(dex, battlePreference);
  const roles = Array.from({length: count}, (_value, index) => STARTER_ROLE_PLAN[index] || "balanced");
  const used = new Set<string>();
  let legendaryCount = 0;
  return roles.map((role, index) => {
    const rolePool = filterRowsForRole(rows, role);
    const pool = filterLegendaryQuota(rolePool.length ? rolePool : rows, battlePreference, legendaryCount);
    const unused = pool.filter(row => !used.has(row.id));
    const selectedRow = pickOne(unused.length ? unused : pool, rng) || fallbackRow(index);
    used.add(selectedRow.id);
    if (selectedRow.rank === "legendary") legendaryCount += 1;
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
          battleBagEnabled: battlePreference.battleBagEnabled,
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
    if (!isRandomGeneratableSpeciesFormV4(row.id, detail)) return [];
    if (!allowedGenerations.has(generation)) return [];
    if (!battlePreference.legendaryBattle && rank === "legendary") return [];
    if (rank !== "legendary" && !STARTER_ALLOWED_RANKS.has(rank)) return [];
    return [{...row, rank, generation}];
  });
}

function filterRowsForRole<T extends DexSearchRow & {rank: PokemonSpeciesRankV4}>(rows: T[], role: FormalStarterRoleV4): T[] {
  const typeHints = ROLE_TYPE_HINTS[role] || [];
  return rows.filter(row => {
    const rankOk = row.rank === "legendary" || STARTER_ALLOWED_RANKS.has(row.rank);
    const typeOk = !typeHints.length || typeHints.some(type => row.tags.includes(type) || row.tags.includes(type.toLowerCase()));
    if (role === "trick-room") return rankOk && typeOk;
    if (role === "support") return rankOk && typeOk;
    if (role === "defense") return rankOk && typeOk;
    if (role === "speed-control") return rankOk && typeOk;
    if (role === "disruption") return rankOk && typeOk;
    if (role === "flex-defense") return rankOk && typeOk;
    if (role === "flex-offense") return rankOk && typeOk;
    if (role === "offense") return rankOk && typeOk;
    if (role === "weather") return rankOk && typeOk;
    return rankOk;
  });
}

function filterLegendaryQuota<T extends DexSearchRow & {rank: PokemonSpeciesRankV4}>(rows: T[], battlePreference: BattlePreferenceV4, currentLegendaryCount: number): T[] {
  if (!battlePreference.legendaryBattle) return rows.filter(row => row.rank !== "legendary");
  if (currentLegendaryCount >= STARTER_MAX_LEGENDARY_CANDIDATES) return rows.filter(row => row.rank !== "legendary");
  return rows;
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
    shiny: options.rng() < FORMAL_STARTER_SHINY_RATE,
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
  if (role === "offense" || role === "flex-offense") selected.push(...shuffle(damaging, rng).slice(0, 3), ...shuffle(support, rng).slice(0, 1));
  else if (role === "defense" || role === "flex-defense") selected.push(...shuffle(damaging, rng).slice(0, 2), ...shuffle(support, rng).slice(0, 2));
  else if (role === "support") selected.push(...preferMoves(learnset, ["protect", "wish", "healbell", "aromatherapy", "helpinghand", "reflect", "lightscreen"], rng).slice(0, 3), ...shuffle(damaging, rng).slice(0, 1));
  else if (role === "speed-control") selected.push(...preferMoves(learnset, ["tailwind", "thunderwave", "icywind", "electroweb", "trickroom"], rng).slice(0, 2), ...shuffle(damaging, rng).slice(0, 2));
  else if (role === "disruption") selected.push(...preferMoves(learnset, ["stealthrock", "spikes", "toxicspikes", "stickyweb", "toxic", "willowisp", "taunt"], rng).slice(0, 2), ...shuffle(damaging, rng).slice(0, 2));
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
  const direct = FormalPokemonSpeciesRankById[detail.id];
  if (direct) return direct;
  const baseId = toID(detail.baseSpecies || detail.name);
  return FormalPokemonSpeciesRankById[baseId] || "rank4";
}

export function isRandomGeneratableSpeciesFormV4(speciesId: string, detail: DexPokemonDetail): boolean {
  const id = toID(speciesId || detail.id);
  const forme = toID(detail.forme || "");
  if (!id || detail.num <= 0) return false;
  if (detail.isNonstandard && detail.isNonstandard !== "Past" && detail.isNonstandard !== "Future") return false;
  if (detail.isMega || forme.includes("mega") || id.endsWith("mega") || id.includes("megax") || id.includes("megay")) return false;
  if (forme.includes("gmax") || id.endsWith("gmax") || id.includes("gmax")) return false;
  if (detail.battleOnly || forme.includes("ultra") || forme.includes("totem") || forme.includes("tera") || forme.includes("terastal") || forme.includes("stellar")) return false;
  if (detail.changesFrom && !isAllowedRegionalOrStableVariant(forme)) return false;
  if (isBlockedBattleForm(id, forme)) return false;
  return true;
}

function isAllowedRegionalOrStableVariant(forme: string): boolean {
  return forme === "alola" || forme === "galar" || forme === "hisui" || forme === "paldea";
}

function isBlockedBattleForm(id: string, forme: string): boolean {
  const blockedFormes = [
    "zen",
    "galarzen",
    "school",
    "blade",
    "busted",
    "complete",
    "ash",
    "sunshine",
    "sunny",
    "rainy",
    "snowy",
    "meteor",
    "gulping",
    "gorging",
    "hangry",
    "noice",
    "hero",
    "crowned",
    "eternamax",
    "terastal",
    "stellar",
  ];
  if (blockedFormes.some(blocked => forme === blocked || forme.includes(blocked))) return true;
  return id.includes("totem") || id.includes("eternamax") || id.includes("ultra") || id.includes("crowned");
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
  const priority: DexStatId[] = role === "defense" || role === "flex-defense" || role === "support" || role === "disruption"
    ? ["hp", "def", "spd", "atk", "spa", "spe"]
    : role === "trick-room"
      ? ["hp", "atk", "spa", "def", "spd", "spe"]
      : role === "speed-control"
        ? ["spe", "hp", "def", "spd", "atk", "spa"]
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

function roundDistributionForStreak(streak: number): FormalNpcTypeV4[] {
  if (streak <= 0) return ROUND_DISTRIBUTIONS["0"];
  if (streak === 1) return ROUND_DISTRIBUTIONS["1"];
  if (streak === 2) return ROUND_DISTRIBUTIONS["2"];
  return ROUND_DISTRIBUTIONS["3"];
}

function maybeReplaceChampionWithVillain(type: FormalNpcTypeV4, rng: () => number): FormalNpcTypeV4 {
  if (type !== "champion") return type;
  return rng() < 0.25 ? "villain" : "champion";
}

function isBossTrainerType(type: FormalNpcTypeV4): boolean {
  return type === "gym" || type === "elite4" || type === "champion" || type === "villain";
}

function powerProfileForNpc(type: FormalNpcTypeV4): PokemonPowerProfileV4 {
  if (type === "rookie") return "rookie";
  if (type === "normal") return "normal";
  if (type === "elite") return "elite";
  if (type === "champion" || type === "villain") return "champion";
  return "boss";
}

function teamPreferenceForNpc(type: FormalNpcTypeV4, battlePreference: FormalNpcBattlePreferenceV4, rng: () => number): FormalNpcTeamPreferenceV4 {
  if (type === "champion") return pickOne(["balanced", "setup-offense", "tailwind", "terrain"], rng) || "balanced";
  if (type === "villain") return pickOne(["poison-stall", "hazard-stack", "setup-offense", "balanced"], rng) || "balanced";
  if (type === "gym") return pickOne(["rain", "sun", "sand", "snow", "terrain", "balanced"], rng) || "balanced";
  if (type === "elite4") return pickOne(["trick-room", "tailwind", "hazard-stack", "setup-offense", "balanced"], rng) || "balanced";
  if (battlePreference === "offense") return pickOne(["setup-offense", "tailwind", "rain", "sun"], rng) || "setup-offense";
  if (battlePreference === "defense") return pickOne(["sand", "snow", "poison-stall", "balanced"], rng) || "balanced";
  if (battlePreference === "support") return pickOne(["trick-room", "terrain", "hazard-stack", "tailwind"], rng) || "balanced";
  return pickOne(NPC_TEAM_PREFERENCES, rng) || "balanced";
}

function roleForTeamPreference(teamPreference: FormalNpcTeamPreferenceV4, index: number): FormalStarterRoleV4 {
  if (teamPreference === "trick-room") return index < 2 ? "trick-room" : index < 4 ? "offense" : "defense";
  if (teamPreference === "tailwind") return index === 0 ? "speed-control" : index < 4 ? "offense" : "support";
  if (teamPreference === "hazard-stack" || teamPreference === "poison-stall") return index < 2 ? "disruption" : index < 4 ? "defense" : "offense";
  if (teamPreference === "setup-offense") return index < 4 ? "offense" : index === 4 ? "speed-control" : "support";
  if (teamPreference === "rain" || teamPreference === "sun" || teamPreference === "sand" || teamPreference === "snow") return index === 0 ? "weather" : index < 4 ? "offense" : "defense";
  if (teamPreference === "terrain") return index === 0 ? "support" : index < 4 ? "offense" : "defense";
  return index < 2 ? "offense" : index < 4 ? "defense" : "support";
}

function filterRowsForNpcTeam<T extends DexSearchRow & {rank: PokemonSpeciesRankV4}>(rows: T[], teamPreference: FormalNpcTeamPreferenceV4, battlePreference: FormalNpcBattlePreferenceV4): T[] {
  const roleHints = [
    ...ROLE_TYPE_HINTS[roleForTeamPreference(teamPreference, 0)],
    ...ROLE_TYPE_HINTS[roleForTeamPreference(teamPreference, 1)],
    ...teamPreferenceTypeHints(teamPreference),
  ];
  const uniqueHints = Array.from(new Set(roleHints));
  if (!uniqueHints.length && battlePreference === "balanced") return rows;
  return rows.filter(row => uniqueHints.some(type => row.tags.includes(type) || row.tags.includes(type.toLowerCase())));
}

function teamPreferenceTypeHints(teamPreference: FormalNpcTeamPreferenceV4): string[] {
  if (teamPreference === "rain") return ["Water", "Electric", "Flying", "Grass"];
  if (teamPreference === "sun") return ["Fire", "Grass", "Ground", "Dragon"];
  if (teamPreference === "sand") return ["Rock", "Ground", "Steel"];
  if (teamPreference === "snow") return ["Ice", "Water", "Steel"];
  if (teamPreference === "terrain") return ["Electric", "Grass", "Psychic", "Fairy"];
  return [];
}

function normalNpcName(type: FormalNpcTypeV4, ally: boolean, rng: () => number): string {
  if (ally) return pickOne([...NORMAL_NPC_NAMES.ally], rng) || "精英队友";
  if (type === "rookie") return pickOne([...NORMAL_NPC_NAMES.rookie], rng) || "新人训练家";
  if (type === "elite") return pickOne([...NORMAL_NPC_NAMES.elite], rng) || "精英训练家";
  return pickOne([...NORMAL_NPC_NAMES.normal], rng) || "路人训练家";
}

function createEmptyBag(battleBagEnabled: boolean): BagStateV4 {
  return {maxSize: 50, items: [], battleBagEnabled};
}

function fullBodyTrainerAsset(trainer: FormalTrainerVisualCandidateV4 | null | undefined): string {
  return trainer?.frontGifAsset || trainer?.frontAsset || "";
}

function baseSpeciesId(speciesId: string): string {
  const id = toID(speciesId);
  return id
    .replace(/mega(x|y)?$/, "")
    .replace(/gmax$/, "")
    .replace(/alola$/, "")
    .replace(/galar$/, "")
    .replace(/hisui$/, "")
    .replace(/paldea$/, "");
}

function itemIdFromName(name: string | undefined): string {
  return toID(name || "");
}

function stableScore(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  }
  return Math.abs(hash);
}

function teamPreferenceLabel(preference: FormalNpcTeamPreferenceV4): string {
  const labels: Record<FormalNpcTeamPreferenceV4, string> = {
    balanced: "平衡队",
    rain: "雨天队",
    sun: "晴天队",
    sand: "沙暴队",
    snow: "雪天队",
    "trick-room": "空间队",
    tailwind: "顺风队",
    terrain: "场地队",
    "hazard-stack": "撒场队",
    "poison-stall": "消耗队",
    "setup-offense": "强化攻队",
  };
  return labels[preference] || preference;
}

function normalizeFormalMode(mode: unknown): FormalGameModeV4 {
  return mode === "doubles" || mode === "coop" ? mode : "singles";
}

function normalizeFormalStatus(status: unknown, candidateCount: number): FormalGameStatusV4 {
  if (status === "starterSelected" || status === "roundPlanPending" || status === "roundPlanning" || status === "resting" || status === "ended") return status;
  if (status === "starterSelecting") return candidateCount ? "starterSelecting" : "starterPreparing";
  return "starterPreparing";
}

function normalizeCoopPartnerPreference(value: unknown): CoopPartnerPreferenceV4 {
  return value === "offense" || value === "defense" || value === "support" || value === "balanced" ? value : "balanced";
}

function normalizeStarterRole(value: unknown): FormalStarterRoleV4 {
  return value === "weather" || value === "trick-room" || value === "offense" || value === "support" || value === "defense" || value === "speed-control" || value === "disruption" || value === "flex-offense" || value === "flex-defense" || value === "balanced" ? value : "balanced";
}

function normalizeSpeciesRank(value: unknown): PokemonSpeciesRankV4 {
  return value === "rank1" || value === "rank2" || value === "rank3" || value === "rank4" || value === "rank5" || value === "rank6" || value === "legendary" ? value : "rank4";
}

function normalizePowerProfile(value: unknown): PokemonPowerProfileV4 {
  return value === "rookie" || value === "normal" || value === "elite" || value === "boss" || value === "champion" ? value : "normal";
}

function normalizeNpcType(value: unknown): FormalNpcTypeV4 {
  return value === "rookie" || value === "normal" || value === "elite" || value === "gym" || value === "elite4" || value === "champion" || value === "villain" ? value : "normal";
}

function normalizeNpcBattlePreference(value: unknown): FormalNpcBattlePreferenceV4 {
  return value === "offense" || value === "defense" || value === "support" || value === "balanced" ? value : "balanced";
}

function normalizeNpcTeamPreference(value: unknown): FormalNpcTeamPreferenceV4 {
  return value === "balanced" || value === "rain" || value === "sun" || value === "sand" || value === "snow" || value === "trick-room" || value === "tailwind" || value === "terrain" || value === "hazard-stack" || value === "poison-stall" || value === "setup-offense" ? value : "balanced";
}

function normalizePlayerId(value: unknown): ShowdownPlayerIdV4 {
  return value === "p1" || value === "p2" || value === "p3" || value === "p4" ? value : "p2";
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
  if (role === "support") return "辅助手";
  if (role === "defense") return "防御手";
  if (role === "speed-control") return "速度控制";
  if (role === "disruption") return "干扰撒场";
  if (role === "flex-defense") return "防辅补位";
  if (role === "flex-offense") return "攻击补位";
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
