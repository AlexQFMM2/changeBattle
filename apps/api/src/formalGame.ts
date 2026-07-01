import type {
  DexMoveSummary,
  DexItemDetail,
  DexPokemonDetail,
  DexSearchRow,
  DexStatId,
  DexTrainerDetail,
  ShowdownDexService,
} from "@changebattle-v2/showdown-dex-core";
import {
  DEFAULT_TRAINER_AVATAR,
  FALLBACK_MOVES,
  FALLBACK_SPECIES,
  FORMAL_NPC_TEAM_PREFERENCE_LABELS,
  FORMAL_ROUND_COUNT,
  FORMAL_RUN_VERSION,
  FORMAL_SHOP_CATEGORY_LABELS,
  FORMAL_SHOP_CATEGORY_ORDER,
  FORMAL_SHOP_BATTLE_ITEM_PRICE_TIERS,
  FORMAL_SHOP_ITEM_BASE_WEIGHTS,
  FORMAL_SHOP_PRICE_OVERRIDES,
  FORMAL_SHOP_ITEM_POOL,
  FORMAL_SHOP_PRICE_LIMITS,
  FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER,
  FORMAL_SHOP_SELL_RATE,
  FORMAL_SHOP_SLOTS_PER_CATEGORY,
  FORMAL_STARTER_ROLE_LABELS,
  FORMAL_STARTER_SHINY_RATE,
  FORMAL_STARTING_MONEY,
  NATURES,
  NATURE_ZH,
  NORMAL_NPC_NAMES,
  NPC_BATTLE_PREFERENCES,
  NPC_BOSS_ITEMS,
  NPC_ELITE_ITEMS,
  NPC_NORMAL_ITEMS,
  NPC_ROOKIE_ITEMS,
  NPC_TEAM_PREFERENCES,
  ROLE_TYPE_HINTS,
  ROUND_DISTRIBUTIONS,
  STARTER_MAX_LEGENDARY_CANDIDATES,
  STARTER_ROLE_PLAN,
  type CoopPartnerPreferenceV4,
  type FormalNpcBattlePreferenceV4,
  type FormalNpcTeamPreferenceV4,
  type FormalNpcTypeV4,
  type FormalShopProductViewV4,
  type FormalShopCategoryV4,
  type FormalStarterRoleV4,
  type PokemonPowerProfileV4,
} from "@changebattle-v2/core";
import {FormalPokemonSpeciesRankById, type FormalPokemonSpeciesRankData} from "./formalSpeciesRanks.js";
import {cloneStarChartV4, formalShopAutoRestockForStarChartV4, formalShopRowsForStarChartV4, starChartHasBattlePracticeMasteryV4, starChartHasEastAsiaEducationV4, starChartHasEmergencyMedicalCareV4, starChartHasFreeMedicalCareV4, starChartHasOpponentRumorV4, starChartHasOutpatientMedicalCareV4, starterCandidateCountForStarChart, type StarChartStateV4} from "./starChart.js";
import {
  normalizeBattlePreferenceV4,
  type BattlePreferenceV4,
  type BagStateV4,
  type TrainingBattleLogEntryV4,
  type TrainingCoinLogEntryV4,
  type LocalPokemonV4,
  type LocalTeamV4,
  type PlayerItemInstanceV4,
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
import {createBattleGameFromNodeDraft, type BattleGameV4, type BattleSessionCreateInputV4, type BattleSessionSnapshotV4} from "./battle.js";

export type FormalGameModeV4 = "singles" | "doubles" | "coop";
export type FormalGameStatusV4 = "starterPreparing" | "starterSelecting" | "starterSelected" | "roundPlanPending" | "roundPlanning" | "resting" | "ended";
export type PokemonSpeciesRankV4 = FormalPokemonSpeciesRankData;
export type {
  CoopPartnerPreferenceV4,
  FormalNpcBattlePreferenceV4,
  FormalNpcTeamPreferenceV4,
  FormalNpcTypeV4,
  FormalShopCategoryV4,
  FormalStarterRoleV4,
  PokemonPowerProfileV4,
};
export {FORMAL_STARTER_SHINY_RATE};

export type FormalShopItemV4 = {
  slotId: string;
  category: FormalShopCategoryV4;
  itemID: string;
  stock: number;
  generatedAt: string;
};

export type FormalRestShopV4 = {
  nodeId: string;
  seed: string;
  categories: Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  updatedAt: string;
};

export type FormalShopTransactionResultV4 = {
  ok: boolean;
  run: FormalGameRunV4;
  message: string;
  shop: FormalRestShopV4 | null;
};

export type {FormalShopProductViewV4};

export type FormalRestPokemonStatRerollPartV4 = "ivs" | "evs";

export type FormalRestPokemonStatRerollInputV4 = {
  pokemonId: string;
  part: FormalRestPokemonStatRerollPartV4;
  lockedStats?: DexStatId[];
};

export type FormalRestPokemonStatRerollResultV4 = {
  ok: boolean;
  run: FormalGameRunV4;
  message: string;
  cost: number;
};

export type FormalRestOpponentPreviewUnlockInputV4 = {
  unlockKey: string;
};

export type FormalRestOpponentPreviewUnlockResultV4 = {
  ok: boolean;
  run: FormalGameRunV4;
  message: string;
  cost: number;
};

export type FormalTrainingGroundLessonKindV4 = "tutor" | "egg" | "self-learn" | "self-study";

export type FormalTrainingGroundLessonSourceV4 = "tutor" | "egg" | "levelup" | "self-study";

export type FormalTrainingGroundStateV4 = {
  nodeId: string;
  lessonRoll: number;
  updatedAt: string;
};

export type FormalTrainingGroundLessonViewV4 = {
  lessonId: string;
  kind: FormalTrainingGroundLessonKindV4;
  teacherLabel: string;
  introText: string;
  completeText: string;
  fee: number;
  source: FormalTrainingGroundLessonSourceV4;
};

export type FormalTrainingGroundApplyInputV4 = {
  pokemonId: string;
  moveId?: string;
  replaceMoveIndex?: number;
};

export type FormalTrainingGroundSelfStudyEventV4 = "playful" | "normal" | "focused";

export type FormalTrainingGroundSelfStudyChangeV4 = {
  levelBefore: number;
  levelAfter: number;
  ivsBefore: StatTableV4;
  ivsAfter: StatTableV4;
  evsBefore: StatTableV4;
  evsAfter: StatTableV4;
};

export type FormalTrainingGroundResultV4 = {
  ok: boolean;
  run: FormalGameRunV4;
  message: string;
  lesson: FormalTrainingGroundLessonViewV4 | null;
  selfStudyEvent?: FormalTrainingGroundSelfStudyEventV4;
  selfStudyChange?: FormalTrainingGroundSelfStudyChangeV4;
};

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

const PLAYER_BACK_IMAGES = [
  "/npc/player-back/black-bw-touya-back-b2e0a77d.png",
  "/npc/player-back/dawn-dp-dawn-back-65c7fd06.png",
  "/npc/player-back/ethan-hgss-gold-back-46e97197.png",
  "/npc/player-back/lucas-pt-lucas-back-3199c0fb.png",
  "/npc/player-back/lyra-hgss-kotone-back-d2d0db32.png",
  "/npc/player-back/nate-b2w2-nate-back-e0cef62f.png",
  "/npc/player-back/rosa-b2w2-rosa-back-405f562e.png",
  "/npc/player-back/white-bw-touko-back-4156e303.png",
];

const POWER_PROFILE_ORDER: PokemonPowerProfileV4[] = ["rookie", "normal", "elite", "boss", "champion"];
const FORMAL_OPPONENT_RUMOR_COST = 10;

export type FormalShopRestockContextV4 = {
  roundIndex: number;
  money: number;
  teamSize: number;
  hpPressure: number;
  faintedCount: number;
  statusCount: number;
  lowPpCount: number;
  emptyHeldItemSlots: number;
  physicalAttackers: number;
  specialAttackers: number;
  bulkyPokemon: number;
  poisonPokemon: number;
  lowLevelPokemon: number;
  imperfectIvPokemon: number;
};

const FORMAL_SHOP_HP_ITEM_IDS = new Set([
  "potion", "superpotion", "hyperpotion", "maxpotion", "freshwater", "sodapop",
  "lemonade", "moomoomilk", "energypowder", "energyroot",
]);
const FORMAL_SHOP_REVIVE_ITEM_IDS = new Set(["revive", "maxrevive", "revivalherb"]);
const FORMAL_SHOP_STATUS_ITEM_IDS = new Set(["fullheal", "healpowder", "antidote", "burnheal", "iceheal", "awakening", "paralyzeheal", "lumberry"]);
const FORMAL_SHOP_PP_ITEM_IDS = new Set(["ether", "maxether", "elixir", "maxelixir", "leppaberry", "ppup", "ppmax"]);
const FORMAL_SHOP_OUTPUT_ITEM_IDS = new Set(["lifeorb", "choicescarf", "choiceband", "choicespecs", "expertbelt", "focussash"]);
const FORMAL_SHOP_BULKY_ITEM_IDS = new Set(["leftovers", "rockyhelmet", "eviolite", "assaultvest", "blacksludge", "sitrusberry"]);
const FORMAL_SHOP_STRONG_ITEM_IDS = new Set(["focussash", "choiceband", "choicescarf", "choicespecs", "lifeorb", "assaultvest", "heavydutyboots", "fullrestore", "maxrevive", "revivalherb", "maxelixir", "goldbottlecap", "rarecandy"]);
const FORMAL_SHOP_PHYSICAL_TM_IDS = new Set(["tm:earthquake", "tm:rockslide", "tm:swordsdance"]);
const FORMAL_SHOP_SPECIAL_TM_IDS = new Set(["tm:thunderbolt", "tm:icebeam", "tm:flamethrower", "tm:surf", "tm:psychic", "tm:shadowball", "tm:calmmind"]);

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
  shopByNodeId?: Record<string, FormalRestShopV4>;
  trainingGroundByNodeId?: Record<string, FormalTrainingGroundStateV4>;
  roundSettlementByNodeId?: Record<string, FormalRoundSettlementV4>;
  settlement: FormalGameSettlementV4 | null;
};

export type FormalRoundSettlementV4 = {
  nodeId: string;
  rewardCoins: number;
  reviveCost: number;
  netCoins: number;
  revivedPokemonIds: string[];
  emergencyHealedPokemonIds: string[];
  outpatientHealedPokemonIds: string[];
  leveledPokemonIds: string[];
  createdAt: string;
};

export type FormalSettlementReasonV4 = "complete" | "loss" | "surrender" | "abandon";

export type FormalGameSettlementV4 = {
  id: string;
  outcome: "win" | "loss" | "abandoned";
  reason: FormalSettlementReasonV4;
  bpGained: number;
  wonRounds: number;
  coinSummary: {
    income: number;
    expense: number;
    net: number;
    balance: number;
  };
  pokemonStats: FormalSettlementPokemonStatsV4[];
  mvpPokemonKey: string;
  diagnostics: string[];
  createdAt: string;
  claimedAt?: string;
};

export type FormalSettlementPokemonStatsV4 = {
  pokemonKey: string;
  localPokemonId: string;
  speciesId: string;
  name: string;
  nameZh: string;
  iconUrl?: string;
  iconStyle?: string;
  spriteUrl?: string;
  shiny: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  healing: number;
  usedRounds: number[];
  kdaScore: number;
  mvpScore: number;
  isMvp: boolean;
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
  prepareFormalBattleSession(run: FormalGameRunV4): FormalBattleSessionPreparationV4;
  appendCoinLogEntryV4(run: FormalGameRunV4, entry: FormalCoinLogInputV4): FormalGameRunV4;
  appendBattleLogEntriesFromSnapshotV4(run: FormalGameRunV4, snapshot: BattleSessionSnapshotV4): FormalGameRunV4;
  settleFormalBattleRoundV4(run: FormalGameRunV4): FormalGameRunV4;
  prepareFormalSettlement(run: FormalGameRunV4, reason: FormalSettlementReasonV4): FormalGameRunV4;
  getFormalRestShop(run: FormalGameRunV4): FormalRestShopV4 | null;
  getFormalRestShopProducts(run: FormalGameRunV4): FormalShopProductViewV4[];
  buyFormalRestShopItem(run: FormalGameRunV4, slotId: string): FormalShopTransactionResultV4;
  sellFormalRestBagItems(run: FormalGameRunV4, itemInstanceIds: string[]): FormalShopTransactionResultV4;
  rerollFormalRestPokemonStats(run: FormalGameRunV4, input: FormalRestPokemonStatRerollInputV4): FormalRestPokemonStatRerollResultV4;
  unlockFormalRestOpponentPreview(run: FormalGameRunV4, input: FormalRestOpponentPreviewUnlockInputV4): FormalRestOpponentPreviewUnlockResultV4;
  getFormalTrainingGroundLesson(run: FormalGameRunV4): FormalTrainingGroundLessonViewV4 | null;
  advanceFormalTrainingGroundLesson(run: FormalGameRunV4): FormalGameRunV4;
  applyFormalTrainingGroundLesson(run: FormalGameRunV4, input: FormalTrainingGroundApplyInputV4): FormalTrainingGroundResultV4;
  selectedCountForFormalMode(mode: FormalGameModeV4): number;
};

export type FormalBattleSessionPreparationV4 = {
  restRunSnapshot: TrainingRunGameV4;
  battleGame: BattleGameV4;
  sessionInput: BattleSessionCreateInputV4;
};

export type FormalCoinLogInputV4 = {
  key?: string;
  amount: number;
  source: string;
  label: string;
  roundIndex?: number;
  at?: string;
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

const DEFAULT_FORMAL_RUN_KEY = "changebattle-v2:web:formal-run";
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const STARTER_ALLOWED_RANKS = new Set<PokemonSpeciesRankV4>(["rank4", "rank5", "rank6"]);
const DEFAULT_SYSTEM_ITEMS_BY_RULE_SET: Record<TrainingRuleSetV4, string[]> = {
  standard: [],
  gen7: ["system-mega-stone", "system-z-crystal"],
  gen8: ["system-dynamax-band"],
  gen9: ["system-tera-orb"],
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
      settlement: null,
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
      settlement: null,
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
      settlement: null,
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
        diagnostics.push("coop-ally:deferred-to-battle-transition");
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
      settlement: null,
      updatedAt: new Date().toISOString(),
    });
  }

  function appendCoinLogEntryV4(run: FormalGameRunV4, entry: FormalCoinLogInputV4): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    const restRunSnapshot = normalized.restRunSnapshot;
    if (!restRunSnapshot) return normalized;
    const amount = Math.round(Number(entry.amount || 0));
    const balanceBefore = normalized.money;
    const balanceAfter = clampInt(balanceBefore + amount, 0, 999999, balanceBefore);
    const now = entry.at || new Date().toISOString();
    const logEntry: TrainingCoinLogEntryV4 = {
      id: createId("coin-log"),
      key: entry.key || `${entry.source}:${entry.roundIndex ?? normalized.currentRoundIndex}:${now}:${amount}`,
      at: now,
      roundIndex: clampInt(entry.roundIndex, 0, FORMAL_ROUND_COUNT - 1, normalized.currentRoundIndex),
      kind: amount > 0 ? "income" : amount < 0 ? "expense" : "adjustment",
      amount,
      balanceBefore,
      balanceAfter,
      source: entry.source || "formal",
      label: entry.label || "金币变动",
    };
    const existingKeys = new Set((restRunSnapshot.coinLog || []).map(item => item.key));
    const coinLog = existingKeys.has(logEntry.key) ? restRunSnapshot.coinLog || [] : [...(restRunSnapshot.coinLog || []), logEntry];
    return normalizeFormalRun({
      ...normalized,
      money: balanceAfter,
      restRunSnapshot: {
        ...restRunSnapshot,
        coinLog,
        updatedAt: now,
      },
      updatedAt: now,
    });
  }

  function appendBattleLogEntriesFromSnapshotV4(run: FormalGameRunV4, snapshot: BattleSessionSnapshotV4): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    const restRunSnapshot = normalized.restRunSnapshot;
    if (!restRunSnapshot) return normalized;
    const existingKeys = new Set((restRunSnapshot.battleLog || []).map(entry => entry.key));
    const parsed = parseBattleLogEntriesFromSnapshot(snapshot, existingKeys);
    if (!parsed.length) return normalized;
    const now = new Date().toISOString();
    return normalizeFormalRun({
      ...normalized,
      restRunSnapshot: {
        ...restRunSnapshot,
        battleLog: [...(restRunSnapshot.battleLog || []), ...parsed],
        updatedAt: now,
      },
      updatedAt: now,
    });
  }

  function prepareFormalBattleSession(run: FormalGameRunV4): FormalBattleSessionPreparationV4 {
    const normalized = normalizeFormalRun(run);
    const restRunSnapshot = normalized.restRunSnapshot;
    if (!restRunSnapshot) throw new Error("缺少正式休整快照。");
    const node = currentFormalRestNode(normalized);
    if (!node) throw new Error("当前没有可进入的正式战斗节点。");
    const round = normalized.roundPlan.find(entry => entry.id === node.id) || normalized.roundPlan[node.index];
    if (!round) throw new Error("缺少当前正式对局计划。");

    let nextRestRunSnapshot = restRunSnapshot;
    let nextNode = node;
    if (normalized.mode === "coop" && !nextNode.participants.p3) {
      const usedNpcSpecies = new Set<string>();
      for (const npc of round.npcs) {
        round.participants[npc.playerId]?.localTeam.pokemon.forEach(pokemon => usedNpcSpecies.add(baseSpeciesId(pokemon.speciesId)));
      }
      const built = createFormalNpcParticipant({
        run: normalized,
        trainerType: "elite",
        playerId: "p3",
        roundIndex: node.index,
        slotIndex: 2,
        alliance: "near",
        controller: "script",
        usedNpcSpecies,
        rng: createRng(`${normalized.seed}:round:${node.index + 1}:coop-ally:${normalized.coopPartnerPreference || "balanced"}`),
        partnerPreference: normalized.coopPartnerPreference,
      });
      nextRestRunSnapshot = patchFormalRestParticipant(restRunSnapshot, node.id, built.player);
      nextNode = nextRestRunSnapshot.gameMap.find(entry => entry.id === node.id) || nextNode;
    }

    const {battleGame, sessionInput} = createBattleGameFromNodeDraft({
      runId: nextRestRunSnapshot.id,
      node: nextNode,
      playersById: {...nextRestRunSnapshot.players, ...(nextNode.participants || {})},
    });
    return {restRunSnapshot: nextRestRunSnapshot, battleGame, sessionInput};
  }

  function settleFormalBattleRoundV4(run: FormalGameRunV4): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    const restRunSnapshot = normalized.restRunSnapshot;
    if (!restRunSnapshot) return normalized;
    const wonNode = [...restRunSnapshot.gameMap]
      .filter(node => node.state === "won" && !normalized.roundSettlementByNodeId?.[node.id])
      .sort((a, b) => b.index - a.index)[0];
    if (!wonNode) return normalized;
    const p1 = restRunSnapshot.players.p1;
    if (!p1) return normalized;
    const now = new Date().toISOString();
    const hasFreeCare = starChartHasFreeMedicalCareV4(normalized.starChartSnapshot);
    const hasEmergencyCare = starChartHasEmergencyMedicalCareV4(normalized.starChartSnapshot);
    const hasOutpatientCare = starChartHasOutpatientMedicalCareV4(normalized.starChartSnapshot);
    const hasPracticeMastery = starChartHasBattlePracticeMasteryV4(normalized.starChartSnapshot);
    const damagedPokemonIds = hasPracticeMastery ? collectRoundDamageDealerPokemonIds(normalized, wonNode.id) : new Set<string>();
    const revivedPokemonIds: string[] = [];
    const emergencyHealedPokemonIds: string[] = [];
    const outpatientHealedPokemonIds: string[] = [];
    const leveledPokemonIds: string[] = [];
    const nextPokemon = p1.localTeam.pokemon.map(pokemon => {
      const maxHp = Math.max(1, Math.floor(Number(pokemon.maxHp || 1)));
      const beforeHp = clampInt(pokemon.entryHp, 0, maxHp, maxHp);
      const wasFainted = beforeHp <= 0;
      let next = {...pokemon, entryHp: beforeHp, maxHp};
      if (wasFainted) {
        revivedPokemonIds.push(pokemon.localPokemonId);
        const targetHp = hasEmergencyCare ? Math.ceil(maxHp / 2) : 1;
        next = {...next, entryHp: clampInt(targetHp, 1, maxHp, 1)};
        if (hasEmergencyCare) emergencyHealedPokemonIds.push(pokemon.localPokemonId);
        return next;
      }
      if (hasPracticeMastery && damagedPokemonIds.has(settlementPokemonKey(pokemon))) {
        const leveled = levelUpFormalPokemonAfterBattle(next, target => {
          const detail = safePokemon(target.speciesId);
          return dex.calculatePokemonStats({
            speciesId: detail.id,
            level: target.level,
            nature: target.nature || "Serious",
            evs: target.evs,
            ivs: target.ivs,
          }).stats.hp;
        });
        if (leveled.level > next.level) {
          next = leveled;
          leveledPokemonIds.push(pokemon.localPokemonId);
        }
      }
      if (hasOutpatientCare && next.entryHp < next.maxHp) {
        const healedHp = clampInt(next.entryHp + Math.ceil(next.maxHp / 4), 0, next.maxHp, next.entryHp);
        if (healedHp > next.entryHp) {
          next = {...next, entryHp: healedHp};
          outpatientHealedPokemonIds.push(pokemon.localPokemonId);
        }
      }
      return next;
    });
    const reviveCost = hasFreeCare ? 0 : revivedPokemonIds.length * 50;
    const settlement: FormalRoundSettlementV4 = {
      nodeId: wonNode.id,
      rewardCoins: 500,
      reviveCost,
      netCoins: 500 - reviveCost,
      revivedPokemonIds,
      emergencyHealedPokemonIds,
      outpatientHealedPokemonIds,
      leveledPokemonIds,
      createdAt: now,
    };
    const nextP1 = {...p1, localTeam: {...p1.localTeam, pokemon: nextPokemon}};
    const nextRestRun = patchFormalRestP1(restRunSnapshot, nextP1, now);
    const withSettlement = normalizeFormalRun({
      ...normalized,
      restRunSnapshot: nextRestRun,
      roundSettlementByNodeId: {
        ...(normalized.roundSettlementByNodeId || {}),
        [wonNode.id]: settlement,
      },
      updatedAt: now,
    });
    const withReward = appendShopCoinLogFast(withSettlement, {
      key: `round-settlement-reward:${wonNode.id}`,
      amount: 500,
      source: "round-settlement",
      label: `第 ${wonNode.index + 1} 场胜利奖励`,
      roundIndex: wonNode.index,
      at: now,
    });
    if (reviveCost <= 0) return withReward;
    return appendShopCoinLogFast(withReward, {
      key: `round-settlement-medical:${wonNode.id}`,
      amount: -reviveCost,
      source: "round-settlement",
      label: `第 ${wonNode.index + 1} 场工厂医疗`,
      roundIndex: wonNode.index,
      at: now,
    });
  }

  function getFormalRestShop(run: FormalGameRunV4): FormalRestShopV4 | null {
    const node = currentFormalRestNode(run);
    if (!node) return null;
    return ensureFormalRestShopFast(run, node.id);
  }

  function getFormalRestShopProducts(run: FormalGameRunV4): FormalShopProductViewV4[] {
    return createFormalShopProductViewsV4(getFormalRestShop(run), getItemDetailSafe, {getMoveDetail: getMoveDetailSafe});
  }

  function buyFormalRestShopItem(run: FormalGameRunV4, slotId: string): FormalShopTransactionResultV4 {
    const node = currentFormalRestNode(run);
    if (!node || !run.restRunSnapshot) return shopTransactionResult(false, run, "当前没有可用的正式休整商店。");
    const shop = ensureFormalRestShopFast(run, node.id);
    const located = findFormalShopItem(shop, slotId);
    if (!located) return shopTransactionResult(false, {...run, shopByNodeId: {...(run.shopByNodeId || {}), [shop.nodeId]: shop}}, "商品不存在。", shop);
    const {item, category, index} = located;
    if (item.stock <= 0) return shopTransactionResult(false, {...run, shopByNodeId: {...(run.shopByNodeId || {}), [shop.nodeId]: shop}}, "该商品已经售罄。", shop);
    const detail = getItemDetailSafe(item.itemID);
    const price = formalShopItemPriceV4(item, detail, getMoveDetailSafe);
    if (!detail || price <= 0) return shopTransactionResult(false, run, "该商品暂不可购买。", shop);
    if (run.money < price) return shopTransactionResult(false, run, "金币不足。", shop);
    const p1 = run.restRunSnapshot.players.p1;
    if (!p1) return shopTransactionResult(false, run, "缺少玩家背包。", shop);
    const bag = normalizeFormalBag(p1.bag);
    if (bag.items.length >= bag.maxSize) return shopTransactionResult(false, run, "背包已满。", shop);
    const now = new Date().toISOString();
    const nextItem = formalShopItemInstance(item.itemID, detail, price);
    const nextP1 = {...p1, bag: {...bag, items: [...bag.items, nextItem]}};
    const nextRestRun = patchFormalRestP1(run.restRunSnapshot, nextP1, now);
    const autoRestock = formalShopAutoRestockForStarChartV4(run.starChartSnapshot);
    const restockContext = createFormalShopRestockContext({...run, money: run.money - price, restRunSnapshot: nextRestRun});
    const nextSlotItem = autoRestock
      ? createFormalShopSlot(run, shop.nodeId, category, index, Date.now(), now, new Set(shop.categories[category].map(entry => entry.itemID)), restockContext)
      : {...item, stock: 0, generatedAt: now};
    const nextShop = {
      ...shop,
      categories: {
        ...shop.categories,
        [category]: shop.categories[category].map((entry, entryIndex) => entryIndex === index ? nextSlotItem : entry),
      },
      updatedAt: now,
    };
    const withPurchase = {
      ...run,
      restRunSnapshot: nextRestRun,
      shopByNodeId: {...(run.shopByNodeId || {}), [shop.nodeId]: nextShop},
      updatedAt: now,
    };
    const withLog = appendShopCoinLogFast(withPurchase, {
      key: `shop-buy:${shop.nodeId}:${slotId}:${now}`,
      amount: -price,
      source: "shop",
      label: `购买 ${detail.nameZh || detail.name}`,
      roundIndex: node.index,
      at: now,
    });
    return shopTransactionResult(true, withLog, `已购买 ${detail.nameZh || detail.name}。`, withLog.shopByNodeId?.[shop.nodeId] || nextShop);
  }

  function sellFormalRestBagItems(run: FormalGameRunV4, itemInstanceIds: string[]): FormalShopTransactionResultV4 {
    const node = currentFormalRestNode(run);
    const restRunSnapshot = run.restRunSnapshot;
    const p1 = restRunSnapshot?.players.p1;
    if (!node || !restRunSnapshot || !p1) return shopTransactionResult(false, run, "当前没有可出售的玩家背包。");
    const selectedIds = new Set(itemInstanceIds.filter(Boolean));
    if (!selectedIds.size) return shopTransactionResult(false, run, "请选择要卖出的道具。", getFormalRestShop(run));
    const bag = normalizeFormalBag(p1.bag);
    const heldItemIds = formalHeldItemInstanceIds(p1);
    let total = 0;
    const soldNames: string[] = [];
    const nextItems = bag.items.filter(item => {
      if (!selectedIds.has(item.id)) return true;
      const detail = getItemDetailSafe(item.itemID);
      const price = formalShopSellPrice(item, detail);
      if (!item.canSale || heldItemIds.has(item.id) || price <= 0) return true;
      total += price;
      soldNames.push(item.name || detail?.nameZh || detail?.name || item.itemID);
      return false;
    });
    if (nextItems.length === bag.items.length || total <= 0) return shopTransactionResult(false, run, "选中的道具不可出售。", getFormalRestShop(run));
    const now = new Date().toISOString();
    const nextP1 = {...p1, bag: {...bag, items: nextItems}};
    const nextRestRun = patchFormalRestP1(restRunSnapshot, nextP1, now);
    const withSale = {
      ...run,
      restRunSnapshot: nextRestRun,
      updatedAt: now,
    };
    const withLog = appendShopCoinLogFast(withSale, {
      key: `shop-sell:${node.id}:${now}:${Array.from(selectedIds).join(",")}`,
      amount: total,
      source: "shop",
      label: `出售 ${soldNames.slice(0, 2).join("、")}${soldNames.length > 2 ? ` 等 ${soldNames.length} 件` : ""}`,
      roundIndex: node.index,
      at: now,
    });
    return shopTransactionResult(true, withLog, `已卖出 ${soldNames.length} 件道具，获得 ${total} 金币。`, getFormalRestShop(withLog));
  }

  function rerollFormalRestPokemonStats(run: FormalGameRunV4, input: FormalRestPokemonStatRerollInputV4): FormalRestPokemonStatRerollResultV4 {
    const normalized = normalizeFormalRun(run);
    const node = currentFormalRestNode(normalized);
    const restRunSnapshot = normalized.restRunSnapshot;
    const p1 = restRunSnapshot?.players.p1;
    if (!node || !restRunSnapshot || !p1) return statRerollResult(false, normalized, "当前没有可调整的队伍。", 0);
    const part = input.part === "evs" ? "evs" : "ivs";
    const lockedStats = normalizeStatLockList(input.lockedStats);
    const cost = formalRestPokemonStatRerollCost(lockedStats.length);
    if (normalized.money < cost) return statRerollResult(false, normalized, "金币不足。", cost);
    const pokemonIndex = p1.localTeam.pokemon.findIndex(pokemon => pokemon.localPokemonId === input.pokemonId);
    const pokemon = pokemonIndex >= 0 ? p1.localTeam.pokemon[pokemonIndex] : null;
    if (!pokemon) return statRerollResult(false, normalized, "请选择要调整的宝可梦。", cost);
    const now = new Date().toISOString();
    const rng = createRng(`${normalized.seed}:${node.id}:rest-stat-reroll:${part}:${pokemon.localPokemonId}:${now}`);
    const nextStats = rerollStatsWithinCap(
      part === "ivs" ? pokemon.ivs : pokemon.evs,
      part === "ivs" ? pokemon.ivTotalCap ?? 186 : pokemon.evTotalCap ?? 510,
      part === "ivs" ? 31 : 252,
      lockedStats,
      rng,
    );
    const detail = safePokemon(pokemon.speciesId);
    const nextIvs = part === "ivs" ? nextStats : pokemon.ivs;
    const nextEvs = part === "evs" ? nextStats : pokemon.evs;
    const maxHp = dex.calculatePokemonStats({
      speciesId: detail.id,
      level: pokemon.level,
      nature: pokemon.nature || "Serious",
      evs: nextEvs,
      ivs: nextIvs,
    }).stats.hp;
    const hpRatio = pokemon.maxHp > 0 ? pokemon.entryHp / pokemon.maxHp : 1;
    const nextPokemon = {
      ...pokemon,
      speciesId: detail.id,
      ivs: nextIvs,
      evs: nextEvs,
      maxHp,
      entryHp: clampInt(Math.round(maxHp * hpRatio), 0, maxHp, maxHp),
    };
    const nextP1 = {
      ...p1,
      localTeam: {
        ...p1.localTeam,
        pokemon: p1.localTeam.pokemon.map((entry, index) => index === pokemonIndex ? nextPokemon : entry),
      },
    };
    const nextRestRun = patchFormalRestP1(restRunSnapshot, nextP1, now);
    const withUpdate = {
      ...normalized,
      restRunSnapshot: nextRestRun,
      updatedAt: now,
    };
    const label = part === "ivs" ? "随机个体值" : "随机努力值";
    const withLog = appendShopCoinLogFast(withUpdate, {
      key: `team-reroll:${node.id}:${pokemon.localPokemonId}:${part}:${now}`,
      amount: -cost,
      source: "team-reroll",
      label: `${label} ${pokemon.nameZh || pokemon.name}`,
      roundIndex: node.index,
      at: now,
    });
    return statRerollResult(true, withLog, `花费 ${cost} 金币，${part === "ivs" ? "个体值" : "努力值"}已重新分配。`, cost);
  }

  function unlockFormalRestOpponentPreview(run: FormalGameRunV4, input: FormalRestOpponentPreviewUnlockInputV4): FormalRestOpponentPreviewUnlockResultV4 {
    const normalized = normalizeFormalRun(run);
    const node = currentFormalRestNode(normalized);
    const restRunSnapshot = normalized.restRunSnapshot;
    const unlockKey = String(input.unlockKey || "").trim();
    const cost = FORMAL_OPPONENT_RUMOR_COST;
    if (!node || !restRunSnapshot) return opponentPreviewUnlockResult(false, normalized, "当前没有可打听的对手情报。", cost);
    if (!unlockKey) return opponentPreviewUnlockResult(false, normalized, "请选择要打听的宝可梦。", cost);
    if (restRunSnapshot.restPreviewUnlocks?.[unlockKey]) {
      return opponentPreviewUnlockResult(true, normalized, "这只宝可梦的情报已经解锁。", 0);
    }
    if (!starChartHasOpponentRumorV4(normalized.starChartSnapshot)) {
      return opponentPreviewUnlockResult(false, normalized, "需要点亮星图「小道消息」后才能打听对手情报。", cost);
    }
    if (normalized.money < cost) return opponentPreviewUnlockResult(false, normalized, "金币不足。", cost);
    const now = new Date().toISOString();
    const nextRun = {
      ...normalized,
      restRunSnapshot: {
        ...restRunSnapshot,
        restPreviewUnlocks: {
          ...(restRunSnapshot.restPreviewUnlocks || {}),
          [unlockKey]: true as const,
        },
        updatedAt: now,
      },
      updatedAt: now,
    };
    const withLog = appendShopCoinLogFast(nextRun, {
      key: `opponent-rumor:${node.id}:${unlockKey}`,
      amount: -cost,
      source: "opponent-rumor",
      label: "打听对手情报",
      roundIndex: node.index,
      at: now,
    });
    return opponentPreviewUnlockResult(true, withLog, `花费 ${cost} 金币，已了解这只宝可梦的情报。`, cost);
  }

  function getFormalTrainingGroundLesson(run: FormalGameRunV4): FormalTrainingGroundLessonViewV4 | null {
    const normalized = normalizeFormalRun(run);
    const node = currentFormalRestNode(normalized);
    if (!node) return null;
    const state = ensureFormalTrainingGroundState(normalized, node.id);
    return createFormalTrainingGroundLesson(normalized, node.id, state.lessonRoll);
  }

  function advanceFormalTrainingGroundLesson(run: FormalGameRunV4): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    const node = currentFormalRestNode(normalized);
    if (!node) return normalized;
    const now = new Date().toISOString();
    const state = ensureFormalTrainingGroundState(normalized, node.id);
    return normalizeFormalRun({
      ...normalized,
      trainingGroundByNodeId: {
        ...(normalized.trainingGroundByNodeId || {}),
        [node.id]: {
          nodeId: node.id,
          lessonRoll: state.lessonRoll + 1,
          updatedAt: now,
        },
      },
      updatedAt: now,
    });
  }

  function applyFormalTrainingGroundLesson(run: FormalGameRunV4, input: FormalTrainingGroundApplyInputV4): FormalTrainingGroundResultV4 {
    const normalized = normalizeFormalRun(run);
    const node = currentFormalRestNode(normalized);
    const lesson = getFormalTrainingGroundLesson(normalized);
    const restRunSnapshot = normalized.restRunSnapshot;
    const p1 = restRunSnapshot?.players.p1;
    if (!node || !lesson || !restRunSnapshot || !p1) return trainingGroundResult(false, normalized, "当前没有可用的训练场课程。", lesson);
    if (normalized.money < lesson.fee) return trainingGroundResult(false, normalized, "金币不足，先去赚一点再来上课吧。", lesson);
    const pokemonIndex = p1.localTeam.pokemon.findIndex(pokemon => pokemon.localPokemonId === input.pokemonId);
    const pokemon = pokemonIndex >= 0 ? p1.localTeam.pokemon[pokemonIndex] : null;
    if (!pokemon) return trainingGroundResult(false, normalized, "请选择要进入课堂的宝可梦。", lesson);
    if (lesson.kind === "self-study") {
      return applyFormalTrainingGroundSelfStudy(normalized, node, p1, pokemon, pokemonIndex, lesson);
    }
    return applyFormalTrainingGroundMoveLesson(normalized, node, p1, pokemon, pokemonIndex, lesson, input);
  }

  function applyFormalTrainingGroundMoveLesson(
    run: FormalGameRunV4,
    node: TrainingRunGameNodeV4,
    p1: TrainingPlayerDraftV4,
    pokemon: LocalPokemonV4,
    pokemonIndex: number,
    lesson: FormalTrainingGroundLessonViewV4,
    input: FormalTrainingGroundApplyInputV4,
  ): FormalTrainingGroundResultV4 {
    const moveId = toID(input.moveId);
    if (!moveId) return trainingGroundResult(false, run, "请选择要学习的招式。", lesson);
    const movePool = formalTrainingGroundMovePool(lesson.kind, pokemon.speciesId);
    const selectedMove = movePool.find(move => toID(move.id) === moveId) || null;
    if (!selectedMove) return trainingGroundResult(false, run, "这堂课不能学习这个招式。", lesson);
    if (pokemon.moves.some(move => toID(move.moveId) === moveId)) return trainingGroundResult(false, run, `${pokemon.nameZh || pokemon.name}已经会这个招式了。`, lesson);
    const replaceMoveIndex = clampInt(input.replaceMoveIndex, 0, 3, -1);
    if (replaceMoveIndex < 0 || replaceMoveIndex >= pokemon.moves.length) return trainingGroundResult(false, run, "请选择要替换的招式。", lesson);
    if (pokemon.locks?.moves?.[replaceMoveIndex]) return trainingGroundResult(false, run, "这个招式槽被锁定，不能替换。", lesson);
    const nextMove = moveSlotFromSummary(selectedMove);
    const nextPokemon = {
      ...pokemon,
      moves: pokemon.moves.map((move, index) => index === replaceMoveIndex ? nextMove : move),
    };
    const message = `${pokemon.nameZh || pokemon.name}学会了${nextMove.nameZh || nextMove.name}。${lesson.completeText}`;
    return commitFormalTrainingGroundPokemonUpdate(run, node, p1, pokemonIndex, nextPokemon, lesson, message);
  }

  function applyFormalTrainingGroundSelfStudy(
    run: FormalGameRunV4,
    node: TrainingRunGameNodeV4,
    p1: TrainingPlayerDraftV4,
    pokemon: LocalPokemonV4,
    pokemonIndex: number,
    lesson: FormalTrainingGroundLessonViewV4,
  ): FormalTrainingGroundResultV4 {
    const state = ensureFormalTrainingGroundState(run, node.id);
    const rng = createRng(`${run.seed}:${node.id}:training-ground:self-study:${state.lessonRoll}:${pokemon.localPokemonId}`);
    const event = rollFormalTrainingGroundSelfStudyEvent(pokemon, rng, starChartHasEastAsiaEducationV4(run.starChartSnapshot));
    const beforeIvs = normalizeStats(pokemon.ivs, 31, 31);
    const beforeEvs = normalizeStats(pokemon.evs, 0, 252);
    const levelBefore = clampInt(pokemon.level, 1, 100, 50);
    const beforeProfile = normalizePokemonInstancePowerProfile(pokemon, beforeIvs, beforeEvs);
    const oldIvCap = normalizePokemonIvTotalCap(pokemon.ivTotalCap, beforeProfile, statTotal(beforeIvs));
    const oldEvCap = normalizePokemonEvTotalCap(pokemon.evTotalCap, beforeProfile, statTotal(beforeEvs));
    const profileSteps = event === "focused" ? 2 : event === "normal" ? 1 : 0;
    const nextProfile = advancePowerProfile(beforeProfile, profileSteps);
    const rolledIvCap = profileSteps > 0 ? rollPowerProfileIvCap(nextProfile, rng) : oldIvCap;
    const rolledEvCap = profileSteps > 0 ? rollPowerProfileEvCap(nextProfile, rng) : oldEvCap;
    const nextIvCap = nextProfile === "champion" ? 186 : Math.max(oldIvCap, rolledIvCap, statTotal(beforeIvs));
    const nextEvCap = nextProfile === "champion" ? 510 : Math.max(oldEvCap, rolledEvCap, statTotal(beforeEvs));
    const nextIvTarget = event === "playful" ? partialTrainingTarget(statTotal(beforeIvs), nextIvCap, 0.25, 1) : nextIvCap;
    const nextEvTarget = event === "playful" ? partialTrainingTarget(statTotal(beforeEvs), nextEvCap, 0.25, 8) : nextEvCap;
    const levelDelta = event === "focused" ? 4 : event === "normal" ? 2 : 1;
    const nextIvs = raiseStatTableToTotal(beforeIvs, nextIvTarget, 31, shuffledStats(rng), rng);
    const nextEvs = raiseStatTableToTotal(beforeEvs, nextEvTarget, 252, shuffledStats(rng), rng);
    const levelAfter = clampInt(levelBefore + levelDelta, 1, 100, levelBefore);
    const detail = safePokemon(pokemon.speciesId);
    const maxHp = dex.calculatePokemonStats({speciesId: detail.id, level: levelAfter, nature: pokemon.nature || "Serious", evs: nextEvs, ivs: nextIvs}).stats.hp;
    const hpRatio = pokemon.maxHp > 0 ? pokemon.entryHp / pokemon.maxHp : 1;
    const nextPokemon = {
      ...pokemon,
      speciesId: detail.id,
      level: levelAfter,
      ivs: nextIvs,
      evs: nextEvs,
      powerProfile: nextProfile,
      ivTotalCap: nextIvCap,
      evTotalCap: nextEvCap,
      maxHp,
      entryHp: clampInt(Math.round(maxHp * hpRatio), 0, maxHp, maxHp),
    };
    const eventText = event === "playful"
      ? "贪玩了一节课，但也学到了一点东西"
      : event === "focused"
        ? "认真学习了一整节课，数值等级大幅提升"
        : "踏踏实实自习了一节课，数值等级提升了";
    const message = `${pokemon.nameZh || pokemon.name}${eventText}。${lesson.completeText}`;
    const result = commitFormalTrainingGroundPokemonUpdate(run, node, p1, pokemonIndex, nextPokemon, lesson, message);
    return {
      ...result,
      selfStudyEvent: event,
      selfStudyChange: {
        levelBefore,
        levelAfter,
        ivsBefore: beforeIvs,
        ivsAfter: nextIvs,
        evsBefore: beforeEvs,
        evsAfter: nextEvs,
      },
    };
  }

  function commitFormalTrainingGroundPokemonUpdate(
    run: FormalGameRunV4,
    node: TrainingRunGameNodeV4,
    p1: TrainingPlayerDraftV4,
    pokemonIndex: number,
    nextPokemon: LocalPokemonV4,
    lesson: FormalTrainingGroundLessonViewV4,
    message: string,
  ): FormalTrainingGroundResultV4 {
    const restRunSnapshot = run.restRunSnapshot;
    if (!restRunSnapshot) return trainingGroundResult(false, run, "当前没有可用的训练场课程。", lesson);
    const now = new Date().toISOString();
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map((pokemon, index) => index === pokemonIndex ? nextPokemon : pokemon),
    };
    const nextP1 = {...p1, localTeam: nextTeam};
    const nextRestRun = patchFormalRestP1(restRunSnapshot, nextP1, now);
    const withLesson = {
      ...run,
      restRunSnapshot: nextRestRun,
      trainingGroundByNodeId: {
        ...(run.trainingGroundByNodeId || {}),
        [node.id]: ensureFormalTrainingGroundState(run, node.id),
      },
      updatedAt: now,
    };
    const withLog = appendShopCoinLogFast(withLesson, {
      key: `training-ground:${node.id}:${lesson.lessonId}:${nextPokemon.localPokemonId}:${now}`,
      amount: -lesson.fee,
      source: "training-ground",
      label: `训练场 ${lesson.teacherLabel}`,
      roundIndex: node.index,
      at: now,
    });
    return trainingGroundResult(true, normalizeFormalRun(withLog), message, lesson);
  }

  function formalTrainingGroundMovePool(kind: FormalTrainingGroundLessonKindV4, speciesId: string): DexMoveSummary[] {
    try {
      if (kind === "tutor") return dex.getPokemonTutorSkills(speciesId);
      if (kind === "egg") return dex.getPokemonEggSkills(speciesId);
      if (kind === "self-learn") return dex.getPokemonSelfLearnSkills(speciesId);
    } catch {
      return [];
    }
    return [];
  }

  function moveSlotFromSummary(move: DexMoveSummary): TrainingMoveSlotV4 {
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
  }

  function getItemDetailSafe(itemID: string): DexItemDetail | null {
    try {
      return dex.getItemDetail(itemID);
    } catch {
      return null;
    }
  }

  function getMoveDetailSafe(moveId: string): DexMoveSummary | null {
    try {
      return dex.getMoveDetail(moveId);
    } catch {
      return null;
    }
  }

  function prepareFormalSettlement(run: FormalGameRunV4, reason: FormalSettlementReasonV4): FormalGameRunV4 {
    const normalized = normalizeFormalRun(run);
    if (normalized.settlement) return normalized;
    const restRunSnapshot = normalized.restRunSnapshot;
    const now = new Date().toISOString();
    const wonRounds = restRunSnapshot?.gameMap.filter(node => node.state === "won").length || 0;
    const completedAll = Boolean(restRunSnapshot?.gameMap.length && wonRounds >= restRunSnapshot.gameMap.length);
    const outcome = reason === "abandon" ? "abandoned" : completedAll ? "win" : "loss";
    const coinLog = restRunSnapshot?.coinLog || [];
    const income = coinLog.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
    const expense = coinLog.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    const pokemonStats = buildSettlementPokemonStats(normalized);
    const mvp = pokemonStats[0] || null;
    const settlement: FormalGameSettlementV4 = {
      id: createId("formal-settlement"),
      outcome,
      reason,
      bpGained: calculateSettlementBp(normalized),
      wonRounds,
      coinSummary: {
        income,
        expense,
        net: income - expense,
        balance: normalized.money,
      },
      pokemonStats,
      mvpPokemonKey: mvp?.pokemonKey || "",
      diagnostics: pokemonStats.length ? [] : ["no-player-pokemon-stats"],
      createdAt: now,
    };
    return normalizeFormalRun({
      ...normalized,
      status: "ended",
      settlement,
      restRunSnapshot: restRunSnapshot ? {
        ...restRunSnapshot,
        status: "ended",
        result: {
          outcome,
          reason: settlementReasonLabel(reason),
        },
        updatedAt: now,
      } : null,
      updatedAt: now,
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
      shopByNodeId: normalizeFormalShopByNodeId(run.shopByNodeId, run),
      trainingGroundByNodeId: normalizeFormalTrainingGroundByNodeId(run.trainingGroundByNodeId),
      roundSettlementByNodeId: normalizeFormalRoundSettlementByNodeId(run.roundSettlementByNodeId),
      settlement: normalizeSettlement(run.settlement),
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
    const powerProfile = normalizePokemonInstancePowerProfile(pokemon, ivs, evs);
    const ivTotalCap = normalizePokemonIvTotalCap(pokemon.ivTotalCap, powerProfile, statTotal(ivs));
    const evTotalCap = normalizePokemonEvTotalCap(pokemon.evTotalCap, powerProfile, statTotal(evs));
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
      powerProfile,
      ivTotalCap,
      evTotalCap,
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
      bag: createFormalBag(run.battlePreference.battleBagEnabled, run.battlePreference.ruleSet),
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
    const powerProfile = powerProfileForFormalRoundNpc(input.trainerType, input.run.streak, input.roundIndex, input.controller === "script");
    const boss = isBoss ? selectBossTrainer(input.trainerType, input.rng) : null;
    const visual = boss ? null : selectTrainerVisual(input.rng, input.controller === "script");
    const name = boss?.nameZh || visual?.nameZh || normalNpcName(input.trainerType, input.controller === "script", input.rng);
    const avatar = boss?.avatarAsset || fullBodyTrainerAsset(visual) || DEFAULT_TRAINER_AVATAR;
    const backImage = input.playerId === "p3" && input.alliance === "near" ? pickPlayerBackImage(input.rng) : undefined;
    const teamResult = boss
      ? createBossLocalTeam(input.run, boss, input.playerId, teamPreference, powerProfile, input.usedNpcSpecies, input.rng)
      : createNpcLocalTeam(input.run, {
        playerId: input.playerId,
        teamPreference,
        battlePreference,
        trainerType: input.trainerType,
        powerProfile,
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
      powerProfile,
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
        ...(backImage ? {backImage} : {}),
        controller: input.controller,
        alliance: input.alliance,
        localTeam: teamResult.team,
        bag: createFormalBag(input.run.battlePreference.battleBagEnabled, input.run.battlePreference.ruleSet),
      },
    };
  }

  function createBossLocalTeam(
    run: FormalGameRunV4,
    boss: FormalBossTrainerCandidateV4,
    playerId: ShowdownPlayerIdV4,
    fallbackTeamPreference: FormalNpcTeamPreferenceV4,
    powerProfile: PokemonPowerProfileV4,
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
        powerProfile,
        usedNpcSpecies,
        rng,
      });
    }
    const battleTeamSize = selectedCountForFormalMode(run.mode);
    const pokemon = selected.pokemon.slice(0, battleTeamSize).map((entry, index) => {
      const detail = safePokemon(entry.speciesId);
      const role = roleForTeamPreference(selected.teamArchetype as FormalNpcTeamPreferenceV4, index);
      const local = createStarterPokemon(dex, detail, {
        index,
        role,
        powerProfile,
        rng,
        seed: `${run.seed}:${boss.id}:${selected.variantIndex}`,
      });
      const item = itemIdFromName(entry.item) || pickOne(NPC_BOSS_ITEMS, rng) || "";
      usedNpcSpecies.add(baseSpeciesId(detail.id));
      return {
        ...local,
        localPokemonId: `${playerId}-boss-${index + 1}-${detail.id}`,
        itemId: item,
        heldItemInstanceId: undefined,
        level: local.level,
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
    powerProfile: PokemonPowerProfileV4;
    usedNpcSpecies: Set<string>;
    rng: () => number;
  }): {team: LocalTeamV4; diagnostics: string[]} {
    const diagnostics = [`npc-theme:${input.teamPreference}`, `npc-ai:${input.battlePreference}`];
    const rows = collectPokemonRows(dex, run.battlePreference);
    const themed = filterRowsForNpcTeam(rows, input.teamPreference, input.battlePreference);
    const pool = themed.length >= 6 ? themed : rows;
    const selected: Array<DexSearchRow & {rank: PokemonSpeciesRankV4; generation: number}> = [];
    const usedInTeam = new Set<string>();
    const battleTeamSize = selectedCountForFormalMode(run.mode);
    for (let index = 0; index < battleTeamSize; index += 1) {
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
    const pokemon = selected.map((row, index) => {
      const detail = safePokemon(row.id);
      const local = createStarterPokemon(dex, detail, {
        index,
        role: roleForTeamPreference(input.teamPreference, index),
        powerProfile: input.powerProfile,
        rng: input.rng,
        seed: `${run.seed}:${input.playerId}:${input.teamPreference}`,
      });
      return {
        ...local,
        localPokemonId: `${input.playerId}-npc-${index + 1}-${detail.id}`,
        itemId: pickNpcItemForPowerProfile(input.powerProfile, input.rng),
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
      coinLog: [],
      battleLog: [],
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
      const backImage = typedPlayerId === "p3" && player.alliance === "near"
        ? player.backImage || pickPlayerBackImage(createRng(`player-back:${player.name}:${typedPlayerId}`))
        : player.backImage;
      return [typedPlayerId, {...player, avatar: normalizeNpcFullBodyAvatar(player.avatar, `${player.name}:${typedPlayerId}`), ...(backImage ? {backImage} : {})}];
    }).filter(([, player]) => Boolean(player))) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
  }

  function normalizeNpcFullBodyAvatar(avatar: string, seed: string): string {
    if (avatar && !avatar.includes("/npc/avatars/")) return avatar;
    const visual = selectTrainerVisual(createRng(`npc-visual:${seed}`), false);
    return fullBodyTrainerAsset(visual) || avatar || DEFAULT_TRAINER_AVATAR;
  }

  function pickPlayerBackImage(rng: () => number): string {
    return pickOne(PLAYER_BACK_IMAGES, rng) || PLAYER_BACK_IMAGES[0]!;
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
    prepareFormalBattleSession,
    appendCoinLogEntryV4,
    appendBattleLogEntriesFromSnapshotV4,
    settleFormalBattleRoundV4,
    prepareFormalSettlement,
    getFormalRestShop,
    getFormalRestShopProducts,
    buyFormalRestShopItem,
    sellFormalRestBagItems,
    rerollFormalRestPokemonStats,
    unlockFormalRestOpponentPreview,
    getFormalTrainingGroundLesson,
    advanceFormalTrainingGroundLesson,
    applyFormalTrainingGroundLesson,
    selectedCountForFormalMode,
  };
}

export function createFormalShopProductViewsV4(
  shop: FormalRestShopV4 | null | undefined,
  getItemDetail: (itemID: string) => DexItemDetail | null | undefined,
  options: {getMoveDetail?: (moveId: string) => DexMoveSummary | null | undefined} = {},
): FormalShopProductViewV4[] {
  if (!shop) return [];
  const products: FormalShopProductViewV4[] = [];
  for (const category of FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER) {
    const slotCount = Math.max(shop.categories[category]?.length || 0, FORMAL_SHOP_SLOTS_PER_CATEGORY[category] || 3);
    for (let index = 0; index < slotCount; index += 1) {
      const item = shop.categories[category]?.[index] || null;
      if (!item) continue;
      const detail = safeFormalShopProductDetail(getItemDetail, item.itemID);
      products.push({
        slotId: item.slotId,
        itemID: item.itemID,
        type: category,
        name: formalShopProductName(item, detail),
        price: formalShopItemPriceV4(item, detail, options.getMoveDetail),
        summary: formalShopProductSummary(detail),
        stock: Math.max(0, Math.floor(Number(item.stock || 0))),
        iconUrl: detail?.iconUrl || undefined,
        iconStyle: detail?.iconStyle || undefined,
      });
    }
  }
  return products;
}

function safeFormalShopProductDetail(getItemDetail: (itemID: string) => DexItemDetail | null | undefined, itemID: string): DexItemDetail | null {
  try {
    return getItemDetail(itemID) || null;
  } catch {
    return null;
  }
}

function formalShopProductName(item: FormalShopItemV4, detail: DexItemDetail | null): string {
  if (item.category === "tm") {
    return detail?.moveNameZh || detail?.moveName || stripFormalShopTmPrefix(detail?.nameZh || detail?.name || item.itemID);
  }
  return detail?.nameZh || detail?.name || item.itemID || "未知道具";
}

function formalShopProductSummary(detail: DexItemDetail | null): string {
  return detail?.description || detail?.effectSummary || "这是很实用的道具，要带上吗？";
}

export function formalShopItemPriceV4(
  item: Pick<FormalShopItemV4, "category" | "itemID"> | {category?: FormalShopCategoryV4; itemID: string},
  detail: DexItemDetail | null | undefined,
  getMoveDetail?: (moveId: string) => DexMoveSummary | null | undefined,
): number {
  const itemID = toID(item.itemID);
  const override = FORMAL_SHOP_PRICE_OVERRIDES[itemID];
  if (Number.isFinite(override)) return Math.max(1, Math.floor(override));
  const category = item.category || formalShopCategoryFromDetail(detail);
  if (category === "tm" || detail?.kind === "tm") return formalShopTmPrice(detail, getMoveDetail);
  if (category === "battle" || detail?.kind === "battle" || detail?.kind === "held") return formalShopBattlePrice(itemID);
  if (category === "training" || detail?.kind === "training") return formalShopTrainingPrice(detail);
  if (category === "recovery" || detail?.kind === "recovery" || detail?.kind === "revive" || detail?.kind === "pp") return formalShopRecoveryPrice(detail);
  if (category === "berry" || detail?.kind === "berry") return clampFormalShopPrice(detail?.cost || FORMAL_SHOP_PRICE_LIMITS.berry.min, "berry");
  return Math.max(1, Math.floor(Number(detail?.cost || 50)));
}

function formalShopCategoryFromDetail(detail: DexItemDetail | null | undefined): FormalShopCategoryV4 | undefined {
  if (detail?.kind === "tm") return "tm";
  if (detail?.kind === "battle" || detail?.kind === "held") return "battle";
  if (detail?.kind === "training") return "training";
  if (detail?.kind === "berry") return "berry";
  if (detail?.kind === "recovery" || detail?.kind === "revive" || detail?.kind === "pp") return "recovery";
  return undefined;
}

function formalShopTmPrice(detail: DexItemDetail | null | undefined, getMoveDetail?: (moveId: string) => DexMoveSummary | null | undefined): number {
  const moveId = detail?.moveId || "";
  const move = moveId && getMoveDetail ? safeFormalShopMoveDetail(getMoveDetail, moveId) : null;
  const power = Math.max(0, Math.floor(Number(move?.power || 0)));
  if (power <= 0) return 100;
  if (power <= 60) return 150;
  if (power <= 80) return 200;
  if (power <= 100) return 250;
  return 300;
}

function safeFormalShopMoveDetail(getMoveDetail: (moveId: string) => DexMoveSummary | null | undefined, moveId: string): DexMoveSummary | null {
  try {
    return getMoveDetail(moveId) || null;
  } catch {
    return null;
  }
}

function formalShopBattlePrice(itemID: string): number {
  for (const [rawPrice, itemIDs] of Object.entries(FORMAL_SHOP_BATTLE_ITEM_PRICE_TIERS)) {
    if (itemIDs.includes(itemID)) return clampFormalShopPrice(rawPrice, "battle");
  }
  return 450;
}

function formalShopTrainingPrice(detail: DexItemDetail | null | undefined): number {
  const effect = detail?.trainingEffect;
  if (effect?.kind === "ev") {
    const value = Math.abs(Number(effect.amount ?? effect.target ?? 0));
    return clampFormalShopPrice(Math.max(10, value * 2), "training");
  }
  return 50;
}

function formalShopRecoveryPrice(detail: DexItemDetail | null | undefined): number {
  const effect = detail?.recoveryEffect;
  if (!effect) return clampFormalShopPrice(detail?.cost || FORMAL_SHOP_PRICE_LIMITS.recovery.min, "recovery");
  if (effect.revive === "full") return 150;
  if (effect.revive === "half") return 100;
  if (effect.pp?.scope === "all" && effect.pp.full) return 150;
  if (effect.pp?.scope === "all") return 100;
  if (effect.pp?.scope === "one" && effect.pp.full) return 80;
  if (effect.pp?.scope === "one") return 40;
  if (effect.hp?.kind === "full" && effect.cureStatus) return 150;
  if (effect.hp?.kind === "full") return 130;
  if (effect.hp?.kind === "fixed") return clampFormalShopPrice(effect.hp.amount, "recovery");
  if (effect.hp?.kind === "fraction") return 80;
  if (effect.cureStatus === "all") return 30;
  if (Array.isArray(effect.cureStatus) && effect.cureStatus.length) return 10;
  return FORMAL_SHOP_PRICE_LIMITS.recovery.min;
}

function clampFormalShopPrice(value: unknown, category: keyof typeof FORMAL_SHOP_PRICE_LIMITS): number {
  const limits = FORMAL_SHOP_PRICE_LIMITS[category];
  const price = Math.floor(Number(value || 0));
  if (!Number.isFinite(price)) return limits.min;
  return Math.min(limits.max, Math.max(limits.min, price));
}

function stripFormalShopTmPrefix(name: string): string {
  return name.replace(/^技能机器[：:]\s*/, "").replace(/^TM[：:]\s*/i, "") || name;
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
  const ivTotalCap = rollPowerProfileIvCap(options.powerProfile, options.rng);
  const evTotalCap = rollPowerProfileEvCap(options.powerProfile, options.rng);
  const evs = evsForPowerProfileCap(evTotalCap, options.role, options.rng);
  const ivs = distributeStatBudget(ivTotalCap, 31, STAT_IDS, options.rng);
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
    powerProfile: options.powerProfile,
    ivTotalCap,
    evTotalCap,
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
  const roleMoves = preferredMovesForRole(learnset, role, rng);
  const fallbackPool = learnset.length ? learnset : FALLBACK_MOVES.map(moveId => safeMove(dex, moveId));
  let selected: DexMoveSummary[];
  if (powerProfile === "rookie") {
    selected = shuffle(fallbackPool, rng).slice(0, 4);
  } else if (powerProfile === "normal") {
    const goodCount = randomInt(1, 2, rng);
    const goodMoves = roleMoves.slice(0, goodCount);
    const randomMoves = shuffle(fallbackPool.filter(move => !goodMoves.some(good => good.id === move.id)), rng).slice(0, 4 - goodMoves.length);
    selected = [...goodMoves, ...randomMoves];
  } else {
    selected = roleMoves.slice(0, 4);
  }
  const moveIds = uniqueById(selected).map(move => move.id);
  return normalizeMoves(dex, moveIds, 4);
}

function preferredMovesForRole(moves: DexMoveSummary[], role: FormalStarterRoleV4, rng: () => number): DexMoveSummary[] {
  const damaging = moves.filter(move => move.power > 0 && move.pp > 0);
  const support = moves.filter(move => move.power === 0 && move.pp > 0);
  if (role === "offense" || role === "flex-offense") return uniqueById([...shuffle(damaging, rng).slice(0, 3), ...shuffle(support, rng).slice(0, 1), ...shuffle(moves, rng)]);
  if (role === "defense" || role === "flex-defense") return uniqueById([...shuffle(damaging, rng).slice(0, 2), ...shuffle(support, rng).slice(0, 2), ...shuffle(moves, rng)]);
  if (role === "support") return uniqueById([...preferMoves(moves, ["protect", "wish", "healbell", "aromatherapy", "helpinghand", "reflect", "lightscreen"], rng).slice(0, 3), ...shuffle(damaging, rng).slice(0, 1), ...shuffle(moves, rng)]);
  if (role === "speed-control") return uniqueById([...preferMoves(moves, ["tailwind", "thunderwave", "icywind", "electroweb", "trickroom"], rng).slice(0, 2), ...shuffle(damaging, rng).slice(0, 2), ...shuffle(moves, rng)]);
  if (role === "disruption") return uniqueById([...preferMoves(moves, ["stealthrock", "spikes", "toxicspikes", "stickyweb", "toxic", "willowisp", "taunt"], rng).slice(0, 2), ...shuffle(damaging, rng).slice(0, 2), ...shuffle(moves, rng)]);
  if (role === "trick-room") return uniqueById([...preferMoves(moves, ["trickroom", "protect"], rng).slice(0, 2), ...shuffle(damaging, rng).slice(0, 2), ...shuffle(moves, rng)]);
  if (role === "weather") return uniqueById([...preferMoves(moves, ["raindance", "sunnyday", "sandstorm", "snowscape", "hail"], rng).slice(0, 1), ...shuffle(damaging, rng).slice(0, 3), ...shuffle(moves, rng)]);
  return uniqueById([...shuffle(damaging, rng).slice(0, 2), ...shuffle(support, rng).slice(0, 2), ...shuffle(moves, rng)]);
}

function uniqueById<T extends {id: string}>(moves: T[]): T[] {
  const seen = new Set<string>();
  return moves.filter(move => {
    if (seen.has(move.id)) return false;
    seen.add(move.id);
    return true;
  });
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
  const rule = powerProfileRule(profile);
  return randomInt(rule.level[0], rule.level[1], rng);
}

function ivsForPowerProfile(profile: PokemonPowerProfileV4, rng: () => number): StatTableV4 {
  const total = rollPowerProfileIvCap(profile, rng);
  return distributeStatBudget(total, 31, STAT_IDS, rng);
}

function evsForPowerProfile(profile: PokemonPowerProfileV4, role: FormalStarterRoleV4, rng: () => number): StatTableV4 {
  const budget = rollPowerProfileEvCap(profile, rng);
  return evsForPowerProfileCap(budget, role, rng);
}

function evsForPowerProfileCap(evTotalCap: number, role: FormalStarterRoleV4, rng: () => number): StatTableV4 {
  const priority: DexStatId[] = role === "defense" || role === "flex-defense" || role === "support" || role === "disruption"
    ? ["hp", "def", "spd", "atk", "spa", "spe"]
    : role === "trick-room"
      ? ["hp", "atk", "spa", "def", "spd", "spe"]
      : role === "speed-control"
        ? ["spe", "hp", "def", "spd", "atk", "spa"]
      : ["spe", "atk", "spa", "hp", "def", "spd"];
  return distributeStatBudget(evTotalCap, 252, priority, rng);
}

function powerProfileRule(profile: PokemonPowerProfileV4): {level: [number, number]; ivTotal: [number, number]; evTotal: [number, number]} {
  if (profile === "rookie") return {level: [45, 50], ivTotal: [50, 90], evTotal: [100, 200]};
  if (profile === "normal") return {level: [49, 53], ivTotal: [80, 120], evTotal: [80, 280]};
  if (profile === "elite") return {level: [52, 55], ivTotal: [110, 150], evTotal: [260, 400]};
  if (profile === "boss") return {level: [56, 60], ivTotal: [140, 180], evTotal: [390, 510]};
  return {level: [61, 65], ivTotal: [186, 186], evTotal: [510, 510]};
}

function rollPowerProfileIvCap(profile: PokemonPowerProfileV4, rng: () => number): number {
  const rule = powerProfileRule(profile);
  return randomInt(rule.ivTotal[0], rule.ivTotal[1], rng);
}

function rollPowerProfileEvCap(profile: PokemonPowerProfileV4, rng: () => number): number {
  const rule = powerProfileRule(profile);
  return randomInt(rule.evTotal[0], rule.evTotal[1], rng);
}

function powerProfileIndex(profile: PokemonPowerProfileV4): number {
  return Math.max(0, POWER_PROFILE_ORDER.indexOf(profile));
}

function advancePowerProfile(profile: PokemonPowerProfileV4, steps: number): PokemonPowerProfileV4 {
  return POWER_PROFILE_ORDER[Math.min(POWER_PROFILE_ORDER.length - 1, powerProfileIndex(profile) + Math.max(0, Math.floor(steps)))] || "rookie";
}

function normalizePokemonInstancePowerProfile(pokemon: Partial<LocalPokemonV4>, ivs: StatTableV4, evs: StatTableV4): PokemonPowerProfileV4 {
  if (pokemon.powerProfile) return normalizePowerProfile(pokemon.powerProfile);
  const ivTotal = statTotal(ivs);
  const evTotal = statTotal(evs);
  return inferPowerProfileForTotals(ivTotal, evTotal, "elite");
}

function inferPowerProfileForTotals(ivTotal: number, evTotal: number, maxProfile: PokemonPowerProfileV4 = "champion"): PokemonPowerProfileV4 {
  const maxIndex = powerProfileIndex(maxProfile);
  for (const profile of POWER_PROFILE_ORDER.slice(0, maxIndex + 1)) {
    const rule = powerProfileRule(profile);
    if (ivTotal <= rule.ivTotal[1] && evTotal <= rule.evTotal[1]) return profile;
  }
  return POWER_PROFILE_ORDER[maxIndex] || "elite";
}

function normalizePokemonIvTotalCap(value: unknown, profile: PokemonPowerProfileV4, currentTotal: number): number {
  const rule = powerProfileRule(profile);
  const fallback = Math.max(rule.ivTotal[1], currentTotal);
  return clampInt(value, Math.max(rule.ivTotal[0], currentTotal), 186, fallback);
}

function normalizePokemonEvTotalCap(value: unknown, profile: PokemonPowerProfileV4, currentTotal: number): number {
  const rule = powerProfileRule(profile);
  const fallback = Math.max(rule.evTotal[1], currentTotal);
  return clampInt(value, Math.max(rule.evTotal[0], currentTotal), 510, fallback);
}

function statTotal(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, value) => sum + Math.max(0, Math.floor(Number(value || 0))), 0);
}

function distributeStatBudget(total: number, statCap: number, priority: DexStatId[], rng: () => number): StatTableV4 {
  const evs = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as StatTableV4;
  const order = [...priority, ...STAT_IDS.filter(stat => !priority.includes(stat))];
  let remaining = Math.max(0, Math.min(total, statCap * STAT_IDS.length));
  while (remaining > 0) {
    let progressed = false;
    for (const stat of order) {
      const open = statCap - evs[stat];
      if (open <= 0) continue;
      const maxAdd = Math.min(open, remaining);
      const add = maxAdd <= 8 ? maxAdd : randomInt(1, Math.min(maxAdd, 48), rng);
      evs[stat] += add;
      remaining -= add;
      progressed = true;
      if (remaining <= 0) break;
    }
    if (!progressed) break;
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

function powerProfileForFormalRoundNpc(type: FormalNpcTypeV4, streak: number, roundIndex: number, isCoopAlly = false): PokemonPowerProfileV4 {
  if (isCoopAlly) return "elite";
  if (type === "rookie") return "rookie";
  if (type === "normal") return "normal";
  if (type === "elite") return "elite";
  const safeStreak = Math.max(0, Math.floor(Number(streak || 0)));
  if (safeStreak <= 0) return "elite";
  if (safeStreak === 1) return type === "gym" ? "elite" : "boss";
  if (safeStreak === 2) return "boss";
  if (type === "champion" || type === "villain") return "champion";
  if (roundIndex >= 5 && type === "elite4") return "champion";
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

function pickNpcItemForPowerProfile(profile: PokemonPowerProfileV4, rng: () => number): string {
  if (profile === "rookie") return pickOne(NPC_ROOKIE_ITEMS, rng) || "";
  if (profile === "normal") return pickOne(NPC_NORMAL_ITEMS, rng) || "";
  if (profile === "elite") return pickOne(NPC_ELITE_ITEMS, rng) || "";
  return pickOne(NPC_BOSS_ITEMS, rng) || "";
}

function createFormalBag(battleBagEnabled: boolean, ruleSet: TrainingRuleSetV4): BagStateV4 {
  const items = DEFAULT_SYSTEM_ITEMS_BY_RULE_SET[ruleSet].map(createFormalSystemItem);
  return {maxSize: 50, items, battleBagEnabled};
}

function createFormalSystemItem(itemID: string): PlayerItemInstanceV4 {
  const names: Record<string, string> = {
    "system-mega-stone": "Mega系统",
    "system-z-crystal": "Z招式系统",
    "system-dynamax-band": "极巨化系统",
    "system-tera-orb": "太晶系统",
  };
  return {
    id: `formal-${itemID}`,
    itemID,
    name: names[itemID] || itemID,
    image: "",
    cost: 0,
    canSale: false,
    type: "system",
    canBattleUse: false,
    canUse: false,
    canUseToPokemon: false,
    canTake: false,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
    systemReforgeKind: itemID === "system-mega-stone" ? "mega" : itemID === "system-z-crystal" ? "z-crystal" : itemID === "system-tera-orb" ? "tera" : undefined,
  };
}

function currentFormalRestNode(run: FormalGameRunV4): TrainingRunGameNodeV4 | null {
  const snapshot = run.restRunSnapshot;
  if (!snapshot) return null;
  return snapshot.gameMap.find(node => node.id === snapshot.currentNodeId) || snapshot.gameMap.find(node => node.state === "ready") || snapshot.gameMap[0] || null;
}

function ensureFormalTrainingGroundState(run: FormalGameRunV4, nodeId: string): FormalTrainingGroundStateV4 {
  const current = run.trainingGroundByNodeId?.[nodeId];
  if (current) return normalizeFormalTrainingGroundState(current, nodeId);
  return {
    nodeId,
    lessonRoll: 0,
    updatedAt: run.updatedAt || run.createdAt || new Date().toISOString(),
  };
}

function createFormalTrainingGroundLesson(run: FormalGameRunV4, nodeId: string, lessonRoll: number): FormalTrainingGroundLessonViewV4 {
  const lessons: Array<Omit<FormalTrainingGroundLessonViewV4, "lessonId">> = [
    {
      kind: "tutor",
      teacherLabel: "老奶奶",
      introText: "一位年迈慈祥的奶奶正在教学，是否让宝可梦进入学习？旁听费 100 金币。",
      completeText: "教授课程结束了。",
      fee: 100,
      source: "tutor",
    },
    {
      kind: "egg",
      teacherLabel: "老爷爷",
      introText: "一位沉稳严厉的爷爷正在教学，是否让宝可梦进入学习？旁听费 100 金币。",
      completeText: "蛋招式课程结束了。",
      fee: 100,
      source: "egg",
    },
    {
      kind: "self-learn",
      teacherLabel: "年轻小姐",
      introText: "一位漂亮美丽的姐姐正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "自学招式课程结束了。",
      fee: 200,
      source: "levelup",
    },
    {
      kind: "self-study",
      teacherLabel: "自习课",
      introText: "教室里现在没有老师，大家都在埋头自习，是否让宝可梦自主学习？座位费 200 金币。",
      completeText: "自习课结束了。",
      fee: 200,
      source: "self-study",
    },
  ];
  const rng = createRng(`${run.seed}:${nodeId}:training-ground:${lessonRoll}`);
  const lesson = lessons[Math.floor(rng() * lessons.length)] || lessons[0]!;
  return {
    ...lesson,
    lessonId: `${nodeId}:lesson:${lessonRoll}:${lesson.kind}`,
  };
}

function trainingGroundResult(ok: boolean, run: FormalGameRunV4, message: string, lesson: FormalTrainingGroundLessonViewV4 | null): FormalTrainingGroundResultV4 {
  return {ok, run, message, lesson};
}

function statRerollResult(ok: boolean, run: FormalGameRunV4, message: string, cost: number): FormalRestPokemonStatRerollResultV4 {
  return {ok, run, message, cost};
}

function opponentPreviewUnlockResult(ok: boolean, run: FormalGameRunV4, message: string, cost: number): FormalRestOpponentPreviewUnlockResultV4 {
  return {ok, run, message, cost};
}

function formalRestPokemonStatRerollCost(lockedCount: number): number {
  return 10 + Math.max(0, Math.min(STAT_IDS.length, Math.floor(Number(lockedCount || 0)))) * 5;
}

function normalizeStatLockList(stats: DexStatId[] | undefined): DexStatId[] {
  const valid = new Set(STAT_IDS);
  return Array.from(new Set((stats || []).filter((stat): stat is DexStatId => valid.has(stat))));
}

function rerollStatsWithinCap(current: StatTableV4, totalCap: number, statCap: number, lockedStats: DexStatId[], rng: () => number): StatTableV4 {
  const locked = new Set(lockedStats);
  const next = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as StatTableV4;
  const normalized = normalizeStats(current, 0, statCap);
  const safeTotalCap = Math.max(0, Math.min(clampInt(totalCap, 0, statCap * STAT_IDS.length, statCap * STAT_IDS.length), statCap * STAT_IDS.length));
  let remaining = safeTotalCap;
  for (const stat of STAT_IDS) {
    if (!locked.has(stat)) continue;
    next[stat] = Math.max(0, Math.min(statCap, normalized[stat] || 0, remaining));
    remaining -= next[stat];
  }
  for (const stat of shuffle(STAT_IDS.filter(stat => !locked.has(stat)), rng)) {
    if (remaining <= 0) break;
    const value = randomInt(0, Math.min(statCap, remaining), rng);
    next[stat] = value;
    remaining -= value;
  }
  return next;
}

function rollFormalTrainingGroundSelfStudyEvent(pokemon: LocalPokemonV4, rng: () => number, eastAsiaEducation = false): FormalTrainingGroundSelfStudyEventV4 {
  const weights = formalTrainingGroundSelfStudyEventWeights(pokemon, eastAsiaEducation);
  const roll = rng();
  if (roll < weights.playful) return "playful";
  if (roll >= 1 - weights.focused) return "focused";
  return "normal";
}

function formalTrainingGroundSelfStudyEventWeights(pokemon: LocalPokemonV4, eastAsiaEducation = false): {playful: number; normal: number; focused: number} {
  const nature = toID(pokemon.nature);
  const focusedNatures = new Set(["serious", "hardy", "adamant", "modest", "jolly", "timid", "bold", "calm", "careful", "impish"]);
  const playfulNatures = new Set(["relaxed", "lax", "gentle", "quiet", "docile", "naive"]);
  // Keep this as the single offset point for nature today and star chart bonuses later.
  let playful = eastAsiaEducation ? 0.35 : 0.3;
  let focused = eastAsiaEducation ? 0.15 : 0.1;
  const natureScale = eastAsiaEducation ? 0.5 : 1;
  if (focusedNatures.has(nature)) {
    playful -= 0.05 * natureScale;
    focused += 0.05 * natureScale;
  } else if (playfulNatures.has(nature)) {
    playful += 0.08 * natureScale;
    focused -= 0.03 * natureScale;
  }
  playful = Math.max(0.15, Math.min(0.45, playful));
  focused = Math.max(0.05, Math.min(0.2, focused));
  return {playful, focused, normal: Math.max(0, 1 - playful - focused)};
}

function partialTrainingTarget(currentTotal: number, cap: number, ratio: number, minimumGain: number): number {
  const remaining = Math.max(0, cap - currentTotal);
  if (remaining <= 0) return currentTotal;
  return Math.min(cap, currentTotal + Math.max(minimumGain, Math.ceil(remaining * ratio)));
}

function normalizeFormalRoundSettlementByNodeId(value: unknown): Record<string, FormalRoundSettlementV4> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, Partial<FormalRoundSettlementV4>>)
    .filter(([nodeId]) => Boolean(nodeId))
    .map(([nodeId, settlement]) => [nodeId, normalizeFormalRoundSettlement(settlement, nodeId)]));
}

function normalizeFormalRoundSettlement(settlement: Partial<FormalRoundSettlementV4> | undefined, nodeId: string): FormalRoundSettlementV4 {
  return {
    nodeId: String(settlement?.nodeId || nodeId),
    rewardCoins: clampInt(settlement?.rewardCoins, 0, 999999, 0),
    reviveCost: clampInt(settlement?.reviveCost, 0, 999999, 0),
    netCoins: clampInt(settlement?.netCoins, -999999, 999999, 0),
    revivedPokemonIds: normalizeStringList(settlement?.revivedPokemonIds),
    emergencyHealedPokemonIds: normalizeStringList(settlement?.emergencyHealedPokemonIds),
    outpatientHealedPokemonIds: normalizeStringList(settlement?.outpatientHealedPokemonIds),
    leveledPokemonIds: normalizeStringList(settlement?.leveledPokemonIds),
    createdAt: settlement?.createdAt || new Date().toISOString(),
  };
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value) ? Array.from(new Set(value.map(String).filter(Boolean))) : [];
}

function collectRoundDamageDealerPokemonIds(run: FormalGameRunV4, nodeId: string): Set<string> {
  const localByBattleKey = buildCurrentRestPlayerBattleKeyMap(run);
  const result = new Set<string>();
  for (const entry of run.restRunSnapshot?.battleLog || []) {
    if (entry.nodeId !== nodeId || entry.eventType !== "damage" || !entry.damage || entry.directness !== "direct") continue;
    if (entry.sourcePlayerId !== "p1") continue;
    const sourceKey = entry.sourcePokemonKey ? localByBattleKey.get(entry.sourcePokemonKey) : undefined;
    if (sourceKey) result.add(sourceKey);
  }
  return result;
}

function buildCurrentRestPlayerBattleKeyMap(run: FormalGameRunV4): Map<string, string> {
  const result = new Map<string, string>();
  for (const pokemon of run.restRunSnapshot?.players.p1?.localTeam.pokemon || []) {
    const settlementKey = settlementPokemonKey(pokemon);
    const aliases = [
      pokemon.nickname,
      pokemon.nameZh,
      pokemon.name,
      pokemon.speciesId,
      pokemon.localPokemonId,
      pokemon.showdownIdentityToken,
      pokemon.showdownId,
      pokemon.pokeballId,
    ].map(battleKeyNameId).filter(Boolean);
    ["a", "b", "c", "d"].forEach(position => aliases.forEach(alias => result.set(`p1${position}:${alias}`, settlementKey)));
    result.set(settlementKey, settlementKey);
  }
  return result;
}

function levelUpFormalPokemonAfterBattle(pokemon: LocalPokemonV4, calculateMaxHp: (pokemon: LocalPokemonV4) => number): LocalPokemonV4 {
  const levelBefore = clampInt(pokemon.level, 1, 100, 50);
  if (levelBefore >= 100) return pokemon;
  const levelAfter = levelBefore + 1;
  const oldMaxHp = Math.max(1, Math.floor(Number(pokemon.maxHp || 1)));
  const oldEntryHp = clampInt(pokemon.entryHp, 0, oldMaxHp, oldMaxHp);
  const maxHp = Math.max(1, Math.floor(Number(calculateMaxHp({...pokemon, level: levelAfter}) || oldMaxHp)));
  const hpGain = Math.max(0, maxHp - oldMaxHp);
  return {
    ...pokemon,
    level: levelAfter,
    maxHp,
    entryHp: clampInt(oldEntryHp + hpGain, oldEntryHp, maxHp, oldEntryHp),
  };
}

function raiseStatTableToTotal(stats: StatTableV4, targetTotal: number, statCap: number, priority: DexStatId[], rng: () => number): StatTableV4 {
  const next = normalizeStats(stats, 0, statCap);
  let remaining = Math.max(0, Math.min(targetTotal, statCap * STAT_IDS.length) - statTotal(next));
  const order = [...priority, ...STAT_IDS.filter(stat => !priority.includes(stat))];
  while (remaining > 0) {
    let progressed = false;
    for (const stat of order) {
      const open = statCap - next[stat];
      if (open <= 0) continue;
      const maxAdd = Math.min(open, remaining);
      const add = maxAdd <= 8 ? maxAdd : randomInt(1, Math.min(maxAdd, 32), rng);
      next[stat] += add;
      remaining -= add;
      progressed = true;
      if (remaining <= 0) break;
    }
    if (!progressed) break;
  }
  return next;
}

function shuffledStats(rng: () => number): DexStatId[] {
  return [...STAT_IDS].sort(() => rng() - 0.5);
}

function ensureFormalRestShopFast(run: FormalGameRunV4, nodeId: string): FormalRestShopV4 {
  return normalizeFormalShop(run.shopByNodeId?.[nodeId], run, nodeId) || createFormalRestShop(run, nodeId);
}

function findFormalShopItem(shop: FormalRestShopV4, slotId: string): {category: FormalShopCategoryV4; item: FormalShopItemV4; index: number} | null {
  for (const category of FORMAL_SHOP_CATEGORY_ORDER) {
    const index = shop.categories[category].findIndex(item => item.slotId === slotId);
    if (index >= 0) return {category, item: shop.categories[category][index]!, index};
  }
  return null;
}

function formalShopItemInstance(itemID: string, detail: DexItemDetail, price: number): PlayerItemInstanceV4 {
  return {
    id: createId("shop-item"),
    itemID,
    name: detail.nameZh || detail.name || itemID,
    image: detail.iconUrl || "",
    cost: Math.max(0, Math.floor(Number(price || 0))),
    canSale: detail.canSale ?? true,
    type: formalPlayerItemTypeFromDetail(detail),
    canBattleUse: detail.canBattleUse ?? false,
    canUse: detail.canUse ?? false,
    canUseToPokemon: detail.canUseToPokemon ?? false,
    canTake: detail.canTake ?? false,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
  };
}

function formalPlayerItemTypeFromDetail(detail: DexItemDetail): PlayerItemInstanceV4["type"] {
  if (detail.kind === "system" || detail.kind === "system-battle") return detail.kind;
  if (detail.kind === "recovery" || detail.kind === "revive" || detail.kind === "pp") return "medicine";
  if (detail.kind === "tm") return "tm";
  if (detail.kind === "berry") return "berry";
  if (detail.kind === "training") return "training";
  if (detail.kind === "battle" || detail.kind === "held") return detail.kind;
  if (detail.kind === "special") return "misc";
  return "misc";
}

function normalizeFormalBag(bag: BagStateV4 | undefined): BagStateV4 {
  const maxSize = Math.max(1, Math.floor(Number(bag?.maxSize || 50)));
  return {
    maxSize,
    items: (bag?.items || []).slice(0, maxSize),
    battleBagEnabled: Boolean(bag?.battleBagEnabled),
  };
}

function patchFormalRestP1(restRunSnapshot: TrainingRunGameV4, p1: TrainingPlayerDraftV4, updatedAt: string): TrainingRunGameV4 {
  return {
    ...restRunSnapshot,
    players: {...restRunSnapshot.players, p1},
    scenario: {
      ...restRunSnapshot.scenario,
      players: restRunSnapshot.scenario.players.map(player => player.playerId === "p1" ? p1 : player),
    },
    gameMap: restRunSnapshot.gameMap.map(node => node.id === restRunSnapshot.currentNodeId
      ? {...node, participants: {...node.participants, p1}}
      : node),
    updatedAt,
  };
}

function patchFormalRestParticipant(restRunSnapshot: TrainingRunGameV4, nodeId: string, player: TrainingPlayerDraftV4): TrainingRunGameV4 {
  const updatedAt = new Date().toISOString();
  const currentPlayers = {...restRunSnapshot.players, [player.playerId]: player};
  const scenarioPlayers = restRunSnapshot.scenario.players.some(entry => entry.playerId === player.playerId)
    ? restRunSnapshot.scenario.players.map(entry => entry.playerId === player.playerId ? player : entry)
    : [...restRunSnapshot.scenario.players, player];
  return {
    ...restRunSnapshot,
    players: currentPlayers,
    scenario: {
      ...restRunSnapshot.scenario,
      selectedNpcIds: {...restRunSnapshot.scenario.selectedNpcIds, [player.playerId]: player.name},
      players: scenarioPlayers,
    },
    gameMap: restRunSnapshot.gameMap.map(node => node.id === nodeId
      ? {...node, participants: {...node.participants, [player.playerId]: player}}
      : node),
    updatedAt,
  };
}

function formalHeldItemInstanceIds(player: TrainingPlayerDraftV4): Set<string> {
  return new Set(player.localTeam.pokemon.map(pokemon => pokemon.heldItemInstanceId).filter(Boolean) as string[]);
}

function formalShopSellPrice(item: PlayerItemInstanceV4, detail: DexItemDetail | null): number {
  const price = Math.max(0, Number(item.cost || formalShopItemPriceV4({itemID: item.itemID}, detail)));
  return Math.floor(price * FORMAL_SHOP_SELL_RATE);
}

function appendShopCoinLogFast(run: FormalGameRunV4, entry: FormalCoinLogInputV4): FormalGameRunV4 {
  const restRunSnapshot = run.restRunSnapshot;
  if (!restRunSnapshot) return run;
  const amount = Math.round(Number(entry.amount || 0));
  const balanceBefore = clampInt(run.money, 0, 999999, FORMAL_STARTING_MONEY);
  const balanceAfter = clampInt(balanceBefore + amount, 0, 999999, balanceBefore);
  const now = entry.at || new Date().toISOString();
  const logEntry: TrainingCoinLogEntryV4 = {
    id: createId("coin-log"),
    key: entry.key || `${entry.source}:${entry.roundIndex ?? run.currentRoundIndex}:${now}:${amount}`,
    at: now,
    roundIndex: clampInt(entry.roundIndex, 0, FORMAL_ROUND_COUNT - 1, run.currentRoundIndex),
    kind: amount > 0 ? "income" : amount < 0 ? "expense" : "adjustment",
    amount,
    balanceBefore,
    balanceAfter,
    source: entry.source || "formal",
    label: entry.label || "金币变动",
  };
  const existingKeys = new Set((restRunSnapshot.coinLog || []).map(item => item.key));
  const coinLog = existingKeys.has(logEntry.key) ? restRunSnapshot.coinLog || [] : [...(restRunSnapshot.coinLog || []), logEntry];
  return {
    ...run,
    money: balanceAfter,
    restRunSnapshot: {
      ...restRunSnapshot,
      coinLog,
      updatedAt: now,
    },
    updatedAt: now,
  };
}

function shopTransactionResult(ok: boolean, run: FormalGameRunV4, message: string, shop: FormalRestShopV4 | null = null): FormalShopTransactionResultV4 {
  return {ok, run, message, shop};
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
  return FORMAL_NPC_TEAM_PREFERENCE_LABELS[preference] || preference;
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
  return FORMAL_STARTER_ROLE_LABELS[role] || role;
}

function normalizeSettlement(settlement: FormalGameSettlementV4 | null | undefined): FormalGameSettlementV4 | null {
  if (!settlement) return null;
  const reason = normalizeSettlementReason(settlement.reason);
  const outcome = settlement.outcome === "win" || settlement.outcome === "loss" || settlement.outcome === "abandoned"
    ? settlement.outcome
    : reason === "abandon" ? "abandoned" : "loss";
  const pokemonStats = Array.isArray(settlement.pokemonStats) ? settlement.pokemonStats.map(normalizeSettlementPokemonStats) : [];
  return {
    id: settlement.id || createId("formal-settlement"),
    outcome,
    reason,
    bpGained: clampInt(settlement.bpGained, 0, 999999, 0),
    wonRounds: clampInt(settlement.wonRounds, 0, FORMAL_ROUND_COUNT, 0),
    coinSummary: {
      income: clampInt(settlement.coinSummary?.income, 0, 999999, 0),
      expense: clampInt(settlement.coinSummary?.expense, 0, 999999, 0),
      net: clampInt(settlement.coinSummary?.net, -999999, 999999, 0),
      balance: clampInt(settlement.coinSummary?.balance, 0, 999999, 0),
    },
    pokemonStats,
    mvpPokemonKey: settlement.mvpPokemonKey || pokemonStats[0]?.pokemonKey || "",
    diagnostics: Array.isArray(settlement.diagnostics) ? settlement.diagnostics.map(String) : [],
    createdAt: settlement.createdAt || new Date().toISOString(),
    claimedAt: settlement.claimedAt || undefined,
  };
}

function normalizeFormalShopByNodeId(value: unknown, run: Partial<FormalGameRunV4>): Record<string, FormalRestShopV4> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, FormalRestShopV4>).flatMap(([nodeId, shop]) => {
    const normalized = normalizeFormalShop(shop, run, nodeId);
    return normalized ? [[nodeId, normalized]] : [];
  }));
}

function normalizeFormalTrainingGroundByNodeId(value: unknown): Record<string, FormalTrainingGroundStateV4> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, FormalTrainingGroundStateV4>).map(([nodeId, state]) => [
    nodeId,
    normalizeFormalTrainingGroundState(state, nodeId),
  ]));
}

function normalizeFormalTrainingGroundState(state: Partial<FormalTrainingGroundStateV4> | null | undefined, fallbackNodeId: string): FormalTrainingGroundStateV4 {
  return {
    nodeId: state?.nodeId || fallbackNodeId,
    lessonRoll: Math.max(0, Math.floor(Number(state?.lessonRoll || 0))),
    updatedAt: state?.updatedAt || new Date().toISOString(),
  };
}

function normalizeFormalShop(shop: Partial<FormalRestShopV4> | null | undefined, run: Partial<FormalGameRunV4>, fallbackNodeId: string): FormalRestShopV4 | null {
  if (!shop) return null;
  const nodeId = String(shop.nodeId || fallbackNodeId || "");
  if (!nodeId) return null;
  const seed = String(shop.seed || `${run.seed || "formal-shop"}:${nodeId}`);
  const categories = Object.fromEntries(FORMAL_SHOP_CATEGORY_ORDER.map(category => {
    const rawItems = Array.isArray(shop.categories?.[category]) ? shop.categories![category] : [];
    const slotCount = formalShopSlotsForCategory(run, category);
    const normalizedItems = rawItems.slice(0, slotCount).map((item, index) => normalizeFormalShopItem(item, category, index, nodeId, seed));
    while (normalizedItems.length < slotCount) {
      normalizedItems.push(createFormalShopSlot(run, nodeId, category, normalizedItems.length, normalizedItems.length, shop.updatedAt || new Date().toISOString(), new Set(normalizedItems.map(entry => entry.itemID))));
    }
    return [category, normalizedItems];
  })) as Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  return {
    nodeId,
    seed,
    categories,
    updatedAt: shop.updatedAt || new Date().toISOString(),
  };
}

function normalizeFormalShopItem(item: Partial<FormalShopItemV4>, category: FormalShopCategoryV4, index: number, nodeId: string, seed: string): FormalShopItemV4 {
  const itemID = normalizeFormalShopPoolItemId(category, item.itemID) || pickFormalShopPoolItem(category, createRng(`${seed}:${category}:${index}`), new Set(), createFormalShopRestockContext({seed}));
  return {
    slotId: item.slotId || `${nodeId}:${category}:${index}`,
    category,
    itemID,
    stock: clampInt(item.stock, 0, 99, 1),
    generatedAt: item.generatedAt || new Date().toISOString(),
  };
}

function createFormalRestShop(run: Partial<FormalGameRunV4>, nodeId: string): FormalRestShopV4 {
  const now = new Date().toISOString();
  const seed = `${run.seed || "formal-shop"}:${nodeId}`;
  const restockContext = createFormalShopRestockContext(run);
  const categories = Object.fromEntries(FORMAL_SHOP_CATEGORY_ORDER.map(category => {
    const used = new Set<string>();
    const items = Array.from({length: formalShopSlotsForCategory(run, category)}, (_, index) => {
      const item = createFormalShopSlot(run, nodeId, category, index, index, now, used, restockContext);
      used.add(item.itemID);
      return item;
    });
    return [category, items];
  })) as Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  return {nodeId, seed, categories, updatedAt: now};
}

function formalShopSlotsForCategory(run: Partial<FormalGameRunV4>, category: FormalShopCategoryV4): number {
  const maxSlots = FORMAL_SHOP_SLOTS_PER_CATEGORY[category] || 3;
  const rows = formalShopRowsForStarChartV4(run.starChartSnapshot);
  return Math.max(1, Math.min(maxSlots, rows));
}

function createFormalShopSlot(run: Partial<FormalGameRunV4>, nodeId: string, category: FormalShopCategoryV4, index: number, rollIndex: number, now: string, used: Set<string>, restockContext = createFormalShopRestockContext(run)): FormalShopItemV4 {
  const seed = `${run.seed || "formal-shop"}:${nodeId}:${category}:${index}:${rollIndex}:${used.size}`;
  const itemID = pickFormalShopPoolItem(category, createRng(seed), used, restockContext);
  return {
    slotId: `${nodeId}:${category}:${index}`,
    category,
    itemID,
    stock: 1,
    generatedAt: now,
  };
}

function pickFormalShopPoolItem(category: FormalShopCategoryV4, rng: () => number, used: Set<string>, restockContext: FormalShopRestockContextV4): string {
  const pool = FORMAL_SHOP_ITEM_POOL[category].filter(itemID => !used.has(itemID));
  const fallbackPool = pool.length ? pool : FORMAL_SHOP_ITEM_POOL[category];
  return pickWeightedFormalShopItem(category, fallbackPool, rng, restockContext) || FORMAL_SHOP_ITEM_POOL[category][0]!;
}

function createFormalShopRestockContext(run: Partial<FormalGameRunV4>): FormalShopRestockContextV4 {
  const team = run.restRunSnapshot?.players.p1?.localTeam.pokemon || run.playerTeam?.pokemon || [];
  const aliveTeam = team.filter(pokemon => pokemon.entryHp > 0);
  const hpPressure = team.reduce((sum, pokemon) => {
    const maxHp = Math.max(1, Number(pokemon.maxHp || pokemon.entryHp || 1));
    if (pokemon.entryHp <= 0) return sum + 1;
    return sum + Math.max(0, 1 - Math.max(0, Math.min(maxHp, pokemon.entryHp)) / maxHp);
  }, 0);
  return {
    roundIndex: clampInt(run.currentRoundIndex, 0, FORMAL_ROUND_COUNT - 1, 0),
    money: clampInt(run.money, 0, 999999, FORMAL_STARTING_MONEY),
    teamSize: team.length,
    hpPressure,
    faintedCount: team.filter(pokemon => pokemon.entryHp <= 0).length,
    statusCount: aliveTeam.filter(pokemon => Boolean(pokemon.entryStatus)).length,
    lowPpCount: aliveTeam.reduce((sum, pokemon) => sum + (pokemon.moves || []).filter(move => move.maxPp > 0 && move.remainingPp / move.maxPp <= 0.35).length, 0),
    emptyHeldItemSlots: aliveTeam.filter(pokemon => !pokemon.itemId && !pokemon.heldItemInstanceId).length,
    physicalAttackers: aliveTeam.filter(pokemon => countMoveCategory(pokemon, "physical") > countMoveCategory(pokemon, "special")).length,
    specialAttackers: aliveTeam.filter(pokemon => countMoveCategory(pokemon, "special") > countMoveCategory(pokemon, "physical")).length,
    bulkyPokemon: aliveTeam.filter(pokemon => pokemon.maxHp >= 150 || (pokemon.evs.hp + pokemon.evs.def + pokemon.evs.spd) >= 180).length,
    poisonPokemon: aliveTeam.filter(pokemon => /poison/i.test(pokemon.speciesId) || pokemon.name.includes("毒") || pokemon.nameZh.includes("毒")).length,
    lowLevelPokemon: aliveTeam.filter(pokemon => pokemon.level < 100).length,
    imperfectIvPokemon: aliveTeam.filter(pokemon => Object.values(pokemon.ivs).some(value => value < 31)).length,
  };
}

function pickWeightedFormalShopItem(category: FormalShopCategoryV4, itemIDs: string[], rng: () => number, restockContext: FormalShopRestockContextV4): string | undefined {
  const weighted = itemIDs.map(itemID => ({
    itemID,
    weight: formalShopRestockItemWeightV4(category, itemID, restockContext),
  })).filter(entry => entry.weight > 0);
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return pickOne(itemIDs, rng);
  let roll = rng() * totalWeight;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.itemID;
  }
  return weighted[weighted.length - 1]?.itemID;
}

export function formalShopRestockItemWeightV4(category: FormalShopCategoryV4, itemID: string, restockContext: FormalShopRestockContextV4): number {
  const normalizedItemID = normalizeShopItemID(itemID);
  let weight = Math.max(1, Math.floor(Number(FORMAL_SHOP_ITEM_BASE_WEIGHTS[normalizedItemID] ?? 5)));
  weight += Math.min(4, restockContext.roundIndex);

  if (FORMAL_SHOP_STRONG_ITEM_IDS.has(normalizedItemID)) {
    weight -= Math.max(0, 3 - restockContext.roundIndex);
    if (restockContext.money < 300) weight -= 3;
  }
  if (category === "battle" || category === "berry") {
    weight += Math.min(4, restockContext.emptyHeldItemSlots);
  }
  if (FORMAL_SHOP_HP_ITEM_IDS.has(normalizedItemID) || normalizedItemID === "oranberry" || normalizedItemID === "sitrusberry") {
    weight += Math.min(8, Math.ceil(restockContext.hpPressure * 3));
  }
  if (FORMAL_SHOP_REVIVE_ITEM_IDS.has(normalizedItemID)) {
    weight += restockContext.faintedCount * (normalizedItemID === "revive" ? 8 : 5);
  }
  if (FORMAL_SHOP_STATUS_ITEM_IDS.has(normalizedItemID)) {
    weight += restockContext.statusCount * 5;
  }
  if (FORMAL_SHOP_PP_ITEM_IDS.has(normalizedItemID)) {
    weight += Math.min(8, restockContext.lowPpCount * 3);
  }
  if (FORMAL_SHOP_OUTPUT_ITEM_IDS.has(normalizedItemID)) {
    weight += Math.min(6, Math.max(restockContext.physicalAttackers, restockContext.specialAttackers) * 2);
  }
  if (normalizedItemID === "choiceband") weight += restockContext.physicalAttackers * 3;
  if (normalizedItemID === "choicespecs") weight += restockContext.specialAttackers * 3;
  if (FORMAL_SHOP_BULKY_ITEM_IDS.has(normalizedItemID)) {
    weight += restockContext.bulkyPokemon * 3;
  }
  if (normalizedItemID === "blacksludge") {
    weight += restockContext.poisonPokemon * 6;
  }
  if (normalizedItemID === "rarecandy") {
    weight += Math.min(6, restockContext.lowLevelPokemon * 2);
  }
  if (normalizedItemID === "bottlecap" || normalizedItemID === "graybottlecap" || normalizedItemID === "goldbottlecap") {
    weight += Math.min(6, restockContext.imperfectIvPokemon * 2);
  }
  if (FORMAL_SHOP_PHYSICAL_TM_IDS.has(normalizedItemID)) {
    weight += Math.min(6, restockContext.physicalAttackers * 2);
  }
  if (FORMAL_SHOP_SPECIAL_TM_IDS.has(normalizedItemID)) {
    weight += Math.min(6, restockContext.specialAttackers * 2);
  }
  if (normalizedItemID === "tm:trickroom" && restockContext.bulkyPokemon >= 2) {
    weight += 4;
  }
  if (restockContext.money < 120 && category !== "berry" && !FORMAL_SHOP_HP_ITEM_IDS.has(normalizedItemID)) {
    weight -= 2;
  }
  return Math.max(1, Math.min(40, Math.round(weight)));
}

function countMoveCategory(pokemon: LocalPokemonV4, category: "physical" | "special"): number {
  return (pokemon.moves || []).filter(move => {
    const normalizedCategory = toID(move.category);
    return category === "physical"
      ? normalizedCategory === "physical" || move.category === "物理"
      : normalizedCategory === "special" || move.category === "特殊";
  }).length;
}

function normalizeFormalShopPoolItemId(category: FormalShopCategoryV4, value: unknown): string {
  const itemID = normalizeShopItemID(value);
  return FORMAL_SHOP_ITEM_POOL[category].includes(itemID) ? itemID : "";
}

function normalizeShopItemID(value: unknown): string {
  const raw = String(value || "").trim().toLowerCase();
  if (/^tm:/i.test(raw)) return `tm:${toID(raw.slice(3))}`;
  return toID(raw);
}

function normalizeSettlementPokemonStats(stats: FormalSettlementPokemonStatsV4): FormalSettlementPokemonStatsV4 {
  return {
    pokemonKey: String(stats.pokemonKey || stats.localPokemonId || stats.speciesId || createId("pokemon-stat")),
    localPokemonId: String(stats.localPokemonId || ""),
    speciesId: String(stats.speciesId || ""),
    name: String(stats.name || stats.nameZh || stats.speciesId || ""),
    nameZh: String(stats.nameZh || stats.name || stats.speciesId || ""),
    iconUrl: stats.iconUrl || undefined,
    iconStyle: stats.iconStyle || undefined,
    spriteUrl: stats.spriteUrl || undefined,
    shiny: Boolean(stats.shiny),
    kills: clampInt(stats.kills, 0, 999, 0),
    deaths: clampInt(stats.deaths, 0, 999, 0),
    assists: clampInt(stats.assists, 0, 999, 0),
    damageDealt: clampInt(stats.damageDealt, 0, 999999, 0),
    damageTaken: clampInt(stats.damageTaken, 0, 999999, 0),
    healing: clampInt(stats.healing, 0, 999999, 0),
    usedRounds: Array.isArray(stats.usedRounds) ? Array.from(new Set(stats.usedRounds.map(round => clampInt(round, 0, FORMAL_ROUND_COUNT - 1, 0)))) : [],
    kdaScore: Number.isFinite(Number(stats.kdaScore)) ? Number(stats.kdaScore) : 0,
    mvpScore: Number.isFinite(Number(stats.mvpScore)) ? Number(stats.mvpScore) : 0,
    isMvp: Boolean(stats.isMvp),
  };
}

function normalizeSettlementReason(reason: unknown): FormalSettlementReasonV4 {
  return reason === "complete" || reason === "loss" || reason === "surrender" || reason === "abandon" ? reason : "loss";
}

function parseBattleLogEntriesFromSnapshot(snapshot: BattleSessionSnapshotV4, existingKeys: Set<string>): TrainingBattleLogEntryV4[] {
  const entries: TrainingBattleLogEntryV4[] = [];
  let currentMove: {playerId?: ShowdownPlayerIdV4; pokemonKey?: string; pokemonName?: string; moveId?: string; moveName?: string} | null = null;
  const hpMaxByBattleKey = buildBattleHpMaxMap(snapshot);
  const hpByBattleKey = new Map<string, {hp: number; maxHp: number}>();
  const maybePush = (entry: TrainingBattleLogEntryV4) => {
    if (!existingKeys.has(entry.key)) entries.push(entry);
  };
  for (let index = 0; index < snapshot.rawLog.length; index += 1) {
    const rawLine = snapshot.rawLog[index] || "";
    const key = `${snapshot.id}:${index}:${rawLine}`;
    const parts = rawLine.split("|");
    const command = parts[1] || "";
    if (command === "turn") {
      currentMove = null;
      continue;
    }
    if (command === "move") {
      const actor = parseBattleIdent(parts[2]);
      const moveName = parts[3] || "";
      currentMove = {
        playerId: actor.playerId,
        pokemonKey: actor.key,
        pokemonName: actor.name,
        moveId: toID(moveName),
        moveName,
      };
      maybePush(createBattleLogEntry(snapshot, index, rawLine, key, {
        eventType: "move",
        sourcePlayerId: actor.playerId,
        sourcePokemonKey: actor.key,
        sourcePokemonName: actor.name,
        moveId: toID(moveName),
        moveName,
        directness: "direct",
      }));
      continue;
    }
    if (command === "switch" || command === "drag") {
      const target = parseBattleIdent(parts[2]);
      const hpState = hpStateFromProtocol(parts[4] || "", target.key ? hpMaxByBattleKey.get(target.key) : undefined);
      if (hpState && target.key) hpByBattleKey.set(target.key, hpState);
      continue;
    }
    if (command === "-damage") {
      const target = parseBattleIdent(parts[2]);
      const maxHp = target.key ? hpMaxByBattleKey.get(target.key) : undefined;
      const hpState = hpStateFromProtocol(parts[3] || "", maxHp);
      const previousHp = target.key ? hpByBattleKey.get(target.key)?.hp : undefined;
      const damage = hpState
        ? previousHp === undefined ? Math.max(0, hpState.maxHp - hpState.hp) : Math.max(0, previousHp - hpState.hp)
        : parts[3]?.includes("fnt") ? 1 : 0;
      if (hpState && target.key) hpByBattleKey.set(target.key, hpState);
      maybePush(createBattleLogEntry(snapshot, index, rawLine, key, {
        eventType: "damage",
        damage,
        sourcePlayerId: currentMove?.playerId,
        sourcePokemonKey: currentMove?.pokemonKey,
        sourcePokemonName: currentMove?.pokemonName,
        targetPlayerId: target.playerId,
        targetPokemonKey: target.key,
        targetPokemonName: target.name,
        moveId: currentMove?.moveId,
        moveName: currentMove?.moveName,
        directness: currentMove ? "direct" : "indirect",
      }));
      continue;
    }
    if (command === "-heal") {
      const target = parseBattleIdent(parts[2]);
      const maxHp = target.key ? hpMaxByBattleKey.get(target.key) : undefined;
      const hpState = hpStateFromProtocol(parts[3] || "", maxHp);
      const previousHp = target.key ? hpByBattleKey.get(target.key)?.hp : undefined;
      const healing = hpState
        ? previousHp === undefined ? 0 : Math.max(0, hpState.hp - previousHp)
        : 0;
      if (hpState && target.key) hpByBattleKey.set(target.key, hpState);
      maybePush(createBattleLogEntry(snapshot, index, rawLine, key, {
        eventType: "heal",
        healing,
        targetPlayerId: target.playerId,
        targetPokemonKey: target.key,
        targetPokemonName: target.name,
        directness: "unknown",
      }));
      continue;
    }
    if (command === "faint") {
      const target = parseBattleIdent(parts[2]);
      if (target.key) hpByBattleKey.set(target.key, {hp: 0, maxHp: hpByBattleKey.get(target.key)?.maxHp || hpMaxByBattleKey.get(target.key) || 0});
      maybePush(createBattleLogEntry(snapshot, index, rawLine, key, {
        eventType: "faint",
        sourcePlayerId: currentMove?.playerId,
        sourcePokemonKey: currentMove?.pokemonKey,
        sourcePokemonName: currentMove?.pokemonName,
        targetPlayerId: target.playerId,
        targetPokemonKey: target.key,
        targetPokemonName: target.name,
        directness: currentMove ? "direct" : "indirect",
      }));
      continue;
    }
    if (command === "win") {
      maybePush(createBattleLogEntry(snapshot, index, rawLine, key, {eventType: "win", directness: "unknown"}));
    }
  }
  return entries;
}

function buildBattleHpMaxMap(snapshot: BattleSessionSnapshotV4): Map<string, number> {
  const result = new Map<string, number>();
  const add = (key: string, maxHp: unknown) => {
    const normalizedKey = normalizeBattlePokemonKey(key);
    const hp = Math.round(Number(maxHp));
    if (normalizedKey && Number.isFinite(hp) && hp > 0) result.set(normalizedKey, hp);
  };
  const addAliases = (playerId: ShowdownPlayerIdV4, position: string, pokemon: LocalPokemonV4 | undefined) => {
    if (!pokemon) return;
    const slot = `${playerId}${position || "a"}`;
    const names = [
      pokemon.nickname,
      pokemon.nameZh,
      pokemon.name,
      pokemon.speciesId,
      pokemon.showdownIdentityToken,
      pokemon.showdownId,
      pokemon.pokeballId,
      pokemon.localPokemonId,
    ];
    names.forEach(name => add(`${slot}:${battleKeyNameId(name)}`, pokemon.maxHp));
  };
  snapshot.players.forEach(player => {
    player.draft.localTeam.pokemon.forEach((pokemon, teamIndex) => {
      const mapping = player.teamMapping?.find(entry => entry.localPokemonId === pokemon.localPokemonId || entry.teamIndex === teamIndex);
      const position = teamIndex === 1 ? "b" : "a";
      addAliases(player.playerId, position, pokemon);
      addAliases(player.playerId, "a", pokemon);
      if (mapping) {
        add(`${player.playerId}${position}:${battleKeyNameId(mapping.displayName)}`, pokemon.maxHp);
        add(`${player.playerId}a:${battleKeyNameId(mapping.displayName)}`, pokemon.maxHp);
        add(`${player.playerId}${position}:${battleKeyNameId(mapping.showdownIdentityToken)}`, pokemon.maxHp);
        add(`${player.playerId}a:${battleKeyNameId(mapping.showdownIdentityToken)}`, pokemon.maxHp);
        add(`${player.playerId}${position}:${battleKeyNameId(mapping.showdownId)}`, pokemon.maxHp);
        add(`${player.playerId}a:${battleKeyNameId(mapping.showdownId)}`, pokemon.maxHp);
      }
    });
  });
  snapshot.active.forEach(active => {
    const ident = parseBattleIdent(active.ident);
    add(ident.key, active.maxHp);
    const position = ident.key.match(/^(p[1-4][a-d]):/)?.[1]?.slice(2) || active.slot || "a";
    const pokemon = snapshot.players.find(player => player.playerId === active.playerId)?.draft.localTeam.pokemon.find(entry =>
      entry.localPokemonId === active.localPokemonId ||
      entry.showdownIdentityToken === active.showdownIdentityToken ||
      entry.showdownId === active.showdownId ||
      entry.pokeballId === active.pokeballId ||
      entry.speciesId === active.species
    );
    addAliases(active.playerId, position, pokemon);
    add(`${active.playerId}${position || "a"}:${battleKeyNameId(active.showdownIdentityToken || "")}`, active.maxHp);
    add(`${active.playerId}${position || "a"}:${battleKeyNameId(active.showdownId || "")}`, active.maxHp);
    add(`${active.playerId}${position || "a"}:${battleKeyNameId(active.pokeballId || "")}`, active.maxHp);
    add(`${active.playerId}${position || "a"}:${battleKeyNameId(active.species || "")}`, active.maxHp);
  });
  return result;
}

function createBattleLogEntry(
  snapshot: BattleSessionSnapshotV4,
  rawLogIndex: number,
  rawLine: string,
  key: string,
  patch: Partial<TrainingBattleLogEntryV4>,
): TrainingBattleLogEntryV4 {
  return {
    id: createId("battle-log"),
    key,
    at: snapshot.updatedAt || new Date().toISOString(),
    sessionId: snapshot.id,
    nodeId: snapshot.nodeId,
    turn: snapshot.turn,
    rawLogIndex,
    eventType: patch.eventType || "other",
    damage: patch.damage,
    healing: patch.healing,
    sourcePlayerId: patch.sourcePlayerId,
    sourcePokemonKey: patch.sourcePokemonKey,
    sourcePokemonName: patch.sourcePokemonName,
    targetPlayerId: patch.targetPlayerId,
    targetPokemonKey: patch.targetPokemonKey,
    targetPokemonName: patch.targetPokemonName,
    moveId: patch.moveId,
    moveName: patch.moveName,
    directness: patch.directness,
    rawLine,
  };
}

function parseBattleIdent(value: string | undefined): {playerId?: ShowdownPlayerIdV4; key: string; name: string} {
  const raw = String(value || "");
  const match = raw.match(/^(p[1-4])([a-d])?:\s*(.+)$/i);
  const playerId = normalizeShowdownPlayerId(match?.[1]?.toLowerCase());
  const position = (match?.[2] || "a").toLowerCase();
  const name = (match?.[3] || raw).trim();
  return {
    playerId,
    key: playerId ? normalizeBattlePokemonKey(`${playerId}${position}:${battleKeyNameId(name)}`) : battleKeyNameId(name),
    name,
  };
}

function normalizeBattlePokemonKey(key: string): string {
  const match = String(key || "").match(/^(p[1-4][a-d]):(.+)$/i);
  if (!match) return battleKeyNameId(key);
  return `${match[1].toLowerCase()}:${battleKeyNameId(match[2])}`;
}

function battleKeyNameId(value: unknown): string {
  const ascii = toID(value);
  if (ascii) return ascii;
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function hpStateFromProtocol(condition: string, trueMaxHp?: number): {hp: number; maxHp: number} | null {
  if (condition.includes("fnt")) {
    const maxHp = Math.max(0, Math.round(Number(trueMaxHp || 0)));
    return maxHp > 0 ? {hp: 0, maxHp} : null;
  }
  const match = condition.match(/^(\d+)\/(\d+)/);
  if (!match) return null;
  const protocolHp = Number(match[1]);
  const protocolMaxHp = Number(match[2]);
  if (!Number.isFinite(protocolHp) || !Number.isFinite(protocolMaxHp) || protocolMaxHp <= 0) return null;
  const maxHp = Math.round(Number(trueMaxHp || 0));
  if (maxHp > 0 && maxHp !== protocolMaxHp) {
    return {
      hp: Math.max(0, Math.min(maxHp, Math.round(protocolHp / protocolMaxHp * maxHp))),
      maxHp,
    };
  }
  return {hp: protocolHp, maxHp: protocolMaxHp};
}

function buildSettlementPokemonStats(run: FormalGameRunV4): FormalSettlementPokemonStatsV4[] {
  const playerPokemon = collectPlayerSettlementPokemon(run);
  const pokemonByKey = new Map<string, LocalPokemonV4>();
  playerPokemon.forEach(pokemon => pokemonByKey.set(settlementPokemonKey(pokemon), pokemon));
  const stats = new Map<string, FormalSettlementPokemonStatsV4>();
  const ensureStat = (key: string | undefined) => {
    if (!key) return null;
    const pokemon = pokemonByKey.get(key);
    if (!pokemon) return null;
    const existing = stats.get(key);
    if (existing) return existing;
    const created: FormalSettlementPokemonStatsV4 = {
      pokemonKey: key,
      localPokemonId: pokemon.localPokemonId,
      speciesId: pokemon.speciesId,
      name: pokemon.name,
      nameZh: pokemon.nameZh || pokemon.name,
      iconUrl: pokemon.iconUrl,
      iconStyle: pokemon.iconStyle,
      spriteUrl: pokemon.frontSpriteUrl || pokemon.spriteUrl || pokemon.iconUrl,
      shiny: Boolean(pokemon.shiny),
      kills: 0,
      deaths: 0,
      assists: 0,
      damageDealt: 0,
      damageTaken: 0,
      healing: 0,
      usedRounds: [],
      kdaScore: 0,
      mvpScore: 0,
      isMvp: false,
    };
    stats.set(key, created);
    return created;
  };
  const localByBattleKey = buildPlayerBattleKeyMap(run);
  for (const entry of run.restRunSnapshot?.battleLog || []) {
    const sourceKey = entry.sourcePokemonKey ? localByBattleKey.get(entry.sourcePokemonKey) : undefined;
    const targetKey = entry.targetPokemonKey ? localByBattleKey.get(entry.targetPokemonKey) : undefined;
    if (entry.eventType === "damage" && entry.damage) {
      const sourceStat = ensureStat(sourceKey);
      if (sourceStat) {
        const stat = sourceStat;
        stat.damageDealt += entry.directness === "direct" ? entry.damage : 0;
        addUsedRound(stat, roundIndexForNode(run, entry.nodeId));
      }
      const targetStat = ensureStat(targetKey);
      if (targetStat) {
        const stat = targetStat;
        stat.damageTaken += entry.damage;
        addUsedRound(stat, roundIndexForNode(run, entry.nodeId));
      }
    }
    const healingTargetStat = entry.eventType === "heal" && entry.healing ? ensureStat(targetKey) : null;
    if (healingTargetStat && entry.healing) {
      const stat = healingTargetStat;
      stat.healing += entry.healing;
      addUsedRound(stat, roundIndexForNode(run, entry.nodeId));
    }
    if (entry.eventType === "faint") {
      const sourceStat = sourceKey !== targetKey ? ensureStat(sourceKey) : null;
      if (sourceStat) {
        const stat = sourceStat;
        stat.kills += 1;
        addUsedRound(stat, roundIndexForNode(run, entry.nodeId));
      }
      const targetStat = ensureStat(targetKey);
      if (targetStat) {
        const stat = targetStat;
        stat.deaths += 1;
        addUsedRound(stat, roundIndexForNode(run, entry.nodeId));
      }
    }
  }
  const values = Array.from(stats.values());
  values.forEach(stat => {
    stat.kdaScore = (stat.kills + stat.assists * 0.5 + 1) / Math.max(1, stat.deaths);
    stat.mvpScore = stat.kills * 120 + stat.assists * 40 - stat.deaths * 35 + stat.damageDealt + stat.damageTaken * 0.35 + stat.healing * 0.25 + stat.usedRounds.length * 10;
  });
  values.sort((a, b) => b.mvpScore - a.mvpScore || b.damageDealt - a.damageDealt || b.damageTaken - a.damageTaken || a.nameZh.localeCompare(b.nameZh));
  if (values[0]) values[0].isMvp = true;
  return values;
}

function collectPlayerSettlementPokemon(run: FormalGameRunV4): LocalPokemonV4[] {
  const byId = new Map<string, LocalPokemonV4>();
  const add = (pokemon: LocalPokemonV4 | undefined) => {
    if (!pokemon) return;
    byId.set(pokemon.localPokemonId || pokemon.speciesId, pokemon);
  };
  const selectedPokemon = run.playerTeam?.pokemon || [];
  const sourcePokemon = selectedPokemon.length ? selectedPokemon : (run.restRunSnapshot?.players.p1?.localTeam.pokemon || []);
  sourcePokemon.forEach(add);
  return Array.from(byId.values());
}

function buildPlayerBattleKeyMap(run: FormalGameRunV4): Map<string, string> {
  const result = new Map<string, string>();
  const playerPokemon = collectPlayerSettlementPokemon(run);
  const add = (pokemon: LocalPokemonV4 | undefined, settlementKey = pokemon ? settlementPokemonKey(pokemon) : "") => {
    if (!pokemon) return;
    const aliases = [
      pokemon.nickname,
      pokemon.nameZh,
      pokemon.name,
      pokemon.speciesId,
      pokemon.localPokemonId,
      pokemon.showdownIdentityToken,
      pokemon.showdownId,
      pokemon.pokeballId,
    ].map(battleKeyNameId).filter(Boolean);
    ["a", "b", "c", "d"].forEach(position => aliases.forEach(alias => result.set(`p1${position}:${alias}`, settlementKey)));
    result.set(settlementKey, settlementKey);
  };
  playerPokemon.forEach(pokemon => add(pokemon));
  const unused = new Set(playerPokemon.map(pokemon => settlementPokemonKey(pokemon)));
  const mapSnapshotPokemon = (pokemon: LocalPokemonV4 | undefined, index: number) => {
    if (!pokemon) return;
    let match = playerPokemon[index];
    if (!match || match.speciesId !== pokemon.speciesId) {
      match = playerPokemon.find(candidate => unused.has(settlementPokemonKey(candidate)) && candidate.speciesId === pokemon.speciesId) || match;
    }
    if (!match) return;
    const key = settlementPokemonKey(match);
    unused.delete(key);
    add(pokemon, key);
  };
  run.restRunSnapshot?.players.p1?.localTeam.pokemon.forEach(mapSnapshotPokemon);
  return result;
}

function settlementPokemonKey(pokemon: LocalPokemonV4): string {
  return pokemon.localPokemonId || `${pokemon.speciesId}:${toID(pokemon.nameZh || pokemon.name)}`;
}

function addUsedRound(stat: FormalSettlementPokemonStatsV4, roundIndex: number) {
  if (!stat.usedRounds.includes(roundIndex)) stat.usedRounds.push(roundIndex);
}

function roundIndexForNode(run: FormalGameRunV4, nodeId: string): number {
  const node = run.restRunSnapshot?.gameMap.find(entry => entry.id === nodeId) || run.roundPlan.find(entry => entry.id === nodeId);
  return clampInt(node?.index, 0, FORMAL_ROUND_COUNT - 1, run.currentRoundIndex);
}

function calculateSettlementBp(run: FormalGameRunV4): number {
  const wonNodeIds = new Set((run.restRunSnapshot?.gameMap || []).filter(node => node.state === "won").map(node => node.id));
  return run.roundPlan
    .filter(round => wonNodeIds.has(round.id))
    .reduce((sum, round) => sum + Math.round(bpCoefficientForNpcType(round.difficulty) * Math.max(1, run.streak + 1)), 0);
}

function bpCoefficientForNpcType(type: FormalNpcTypeV4): number {
  if (type === "gym") return 1;
  if (type === "elite4") return 1.5;
  if (type === "champion" || type === "villain") return 1.8;
  return 0.5;
}

function settlementReasonLabel(reason: FormalSettlementReasonV4): string {
  if (reason === "complete") return "正式游戏通关结算";
  if (reason === "surrender") return "玩家投降";
  if (reason === "abandon") return "休整页放弃比赛";
  return "正式游戏战斗失败";
}

function normalizeShowdownPlayerId(value: unknown): ShowdownPlayerIdV4 | undefined {
  return value === "p1" || value === "p2" || value === "p3" || value === "p4" ? value : undefined;
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

function pickOne<T>(values: readonly T[], rng: () => number): T | undefined {
  if (!values.length) return undefined;
  return values[Math.floor(rng() * values.length)] || values[0];
}

function shuffle<T>(values: readonly T[], rng: () => number): T[] {
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
