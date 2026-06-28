import {createLocalShowdownDex} from "./localDex.js";
import {BattlePokemonIconIndexes} from "./data/pokemon-icon-indexes.js";
import {ZhCnDetails} from "./data/i18n/zh-cn-details.js";
import {ZhCnOverrides} from "./data/i18n/zh-cn-overrides.js";
import {
  TrainerData,
  TrainerBossProfiles,
  TrainerDialogues,
  TrainerRepresentatives,
  TrainerTeamPools,
  type TrainerBossProfileData,
  type TrainerDataEntry,
  type TrainerDialogueLineData,
  type TrainerDialogueSetData,
  type TrainerRepresentativeData,
  type TrainerTeamPoolData,
  type TrainerTeamPokemonData,
} from "./data/trainers.js";
import {
  BossTrainerPresetMatrixSummaries,
  BossTrainerPresetTeamCount,
  BossTrainerPresetTeamsDataFile,
  type BossTrainerPresetMatrixSummaryData,
  type BossTrainerPresetTeamData,
} from "./data/boss-preset-teams.js";
import {
  BossTrainerPresetTeamPreviewsCompact,
  type BossTrainerPresetTeamPreviewData,
  type BossTrainerPresetTeamPreviewPokemonData,
} from "./data/boss-preset-team-previews.js";
import {
  PokemonSpeciesRankById,
  PokemonSpeciesRankEntries,
  type PokemonSpeciesRankData,
  type PokemonSpeciesRankEntryData,
} from "./data/pokemon-species-ranks.js";

export {BossTrainerPresetMatrixSummaries, BossTrainerPresetTeamCount, BossTrainerPresetTeamsDataFile};
export {PokemonSpeciesRankById, PokemonSpeciesRankEntries};
export type {BossTrainerPresetMatrixSummaryData, BossTrainerPresetTeamData, BossTrainerPresetTeamPreviewData, BossTrainerPresetTeamPreviewPokemonData, PokemonSpeciesRankData, PokemonSpeciesRankEntryData};

export type DexCategory = "pokemon" | "moves" | "abilities" | "items" | "trainers";
export type DexStatId = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type DexLearnSource = "levelup" | "machine" | "tutor" | "egg" | "event" | "transfer" | "other";
export type DexItemKind = "berry" | "recovery" | "revive" | "pp" | "tm" | "training" | "system" | "system-battle" | "valuable" | "special" | "held" | "battle" | "other";
export type DexItemSource = "showdown" | "v1-game" | "overlay" | "system";
export type DexItemRecoveryEffect = {
  hp?: {kind: "fixed"; amount: number} | {kind: "full"} | {kind: "fraction"; numerator: number; denominator: number};
  revive?: "half" | "full";
  pp?: {scope: "one" | "all"; amount?: number; full?: boolean};
  cureStatus?: "all" | Array<"brn" | "par" | "psn" | "tox" | "slp" | "frz">;
};
export type DexItemTrainingEffect =
  | {kind: "ev"; stat: DexStatId; mode: "add" | "reduce"; amount?: number; target?: number}
  | {kind: "nature"; nature: string}
  | {kind: "ability"; mode: "capsule" | "patch"}
  | {kind: "iv"; mode: "silver" | "gold" | "gray"}
  | {kind: "level"; amount: number};

export type DexSearchRequest = {
  category?: DexCategory | "all";
  query?: string;
  offset?: number;
  limit?: number;
  filters?: Record<string, string | string[] | undefined>;
};

export type DexSearchRow = {
  id: string;
  category: DexCategory;
  name: string;
  nameZh: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  sprite?: DexPokemonSprites;
  iconUrl?: string;
  iconStyle?: string;
};

export type DexSearchResult = {
  category: DexCategory | "all";
  query: string;
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  rows: DexSearchRow[];
};

export type DexPokemonSprites = {
  resourcePrefix: string;
  spriteId?: string;
  baseSpriteId?: string;
  iconUrl?: string;
  iconStyle?: string;
  frontUrl?: string;
  backUrl?: string;
  frontShinyUrl?: string;
  backShinyUrl?: string;
  fallbackFrontUrl?: string;
  fallbackBackUrl?: string;
  fallbackFrontShinyUrl?: string;
  fallbackBackShinyUrl?: string;
  animatedFrontUrl?: string;
  animatedBackUrl?: string;
  animatedFrontShinyUrl?: string;
  animatedBackShinyUrl?: string;
  fallbackAnimatedFrontUrl?: string;
  fallbackAnimatedBackUrl?: string;
  fallbackAnimatedFrontShinyUrl?: string;
  fallbackAnimatedBackShinyUrl?: string;
  gen5AnimatedFrontUrl?: string;
  gen5AnimatedBackUrl?: string;
  gen5AnimatedFrontShinyUrl?: string;
  gen5AnimatedBackShinyUrl?: string;
};

export type DexPokemonDetail = {
  id: string;
  name: string;
  nameZh: string;
  num: number;
  baseSpecies?: string;
  forme?: string;
  cosmeticFormes?: string[];
  otherFormes?: string[];
  battleOnly?: string | string[];
  changesFrom?: string;
  isMega?: boolean;
  canGigantamax?: string;
  isNonstandard?: string | null;
  types: string[];
  heightm?: number;
  weightkg?: number;
  genderRatio?: Record<string, number>;
  color?: string;
  baseStats: Record<DexStatId, number>;
  abilities: Array<{id: string; name: string; nameZh: string; hidden?: boolean; description?: string}>;
  eggGroups: string[];
  evolutionChain: DexPokemonLink[];
  formes: DexPokemonLink[];
  cryUrl?: string;
  sprites: DexPokemonSprites;
  learnset: DexMoveSummary[];
  learnsetGroups: Record<DexLearnSource, DexMoveSummary[]>;
};

export type DexPokemonLink = {
  id: string;
  name: string;
  nameZh: string;
  num: number;
  sprite?: DexPokemonSprites;
};

export type DexMoveSummary = {
  id: string;
  name: string;
  nameZh: string;
  typeId?: string;
  categoryId?: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | null;
  pp: number;
  priority: number;
  target?: string;
  flags?: string[];
  description?: string;
  learnSources?: DexLearnSource[];
};

export type DexMoveDetail = DexMoveSummary & {
  learners: Array<{pokemon: DexSearchRow; sources: DexLearnSource[]}>;
  flagsText: string[];
};

export type DexAbilityDetail = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  holders: Array<{pokemon: DexSearchRow; hidden?: boolean; unavailable?: boolean}>;
};

export type DexItemDetail = {
  id: string;
  name: string;
  nameZh: string;
  kind: DexItemKind;
  kindLabel: string;
  description: string;
  source?: DexItemSource;
  sourceLabel?: string;
  effectSummary?: string;
  recoveryEffect?: DexItemRecoveryEffect;
  trainingEffect?: DexItemTrainingEffect;
  canBattleUse?: boolean;
  canUse?: boolean;
  canUseToPokemon?: boolean;
  canTake?: boolean;
  canSale?: boolean;
  cost?: number;
  futureInstanceCompatible?: boolean;
  moveId?: string;
  moveName?: string;
  moveNameZh?: string;
  iconUrl?: string;
  iconStyle?: string;
};

export type DexTrainerType = "normal" | "gym" | "elite4" | "champion" | "villain" | "player" | "avatar";

export type DexTrainerDialogueLine = {
  intro: string[];
  defeat: string[];
  victory: string[];
};

export type DexTrainerDialogueSet = Record<string, DexTrainerDialogueLine[]>;

export type DexTrainerRepresentative = {
  speciesId: string;
  species: string;
  speciesZh: string;
  count: number;
  sourceNames: string[];
  sprite?: DexPokemonSprites;
};

export type DexTrainerTeamPokemon = {
  slot: number;
  speciesId: string;
  species: string;
  speciesZh: string;
  sourceSpeciesRank: string;
  sourceStageRank: string;
  sourcePowerProfile: string;
  sprite?: DexPokemonSprites;
};

export type DexTrainerTeamPoolSummary = {
  poolId: string;
  battleRulePreset: string;
  trainerId: string;
  trainerNameZh: string;
  teamIndex: number;
  source: string;
  pokemon: DexTrainerTeamPokemon[];
};

export type DexTrainerBossProfile = {
  trainerId: string;
  battlePreference: "offense" | "defense" | "support" | "balanced";
  aiLevel: "gymLeader" | "eliteFour" | "champion";
  powerProfile: "boss" | "champion";
  teamPreferences: Array<"balanced" | "rain" | "sun" | "sand" | "snow" | "trick-room" | "tailwind" | "terrain" | "hazard-stack" | "poison-stall" | "baton-pass" | "setup-offense">;
  originalPreferredSpeciesIds: string[];
  preferredSpeciesIds: string[];
  diagnostics: {
    source: string;
    representativeCount: number;
    expandedCount: number;
    expansionSources: string[];
    inferredFrom: string[];
    messages: string[];
  };
};

export type DexTrainerSummary = {
  id: string;
  trainerType: DexTrainerType;
  trainerTypeLabel: string;
  sourceType: string;
  region: string;
  role: string;
  sourceTier: string;
  name: string;
  nameZh: string;
  frontAsset: string;
  frontGifAsset?: string;
  backAsset?: string;
  avatarAsset: string;
  teamPoolIds: string[];
  notes: string[];
  bossProfile?: DexTrainerBossProfile;
  bossPresetMatrix?: BossTrainerPresetMatrixSummaryData;
  representativePokemon: DexTrainerRepresentative[];
  teamPoolCount: number;
  dialogueStateCount: number;
  isBoss: boolean;
};

export type DexTrainerDetail = DexTrainerSummary & {
  dialogues: DexTrainerDialogueSet;
  teamPools: DexTrainerTeamPoolSummary[];
  teamPoolPresetCounts: Record<string, number>;
  presetTeamPreviews: DexTrainerPresetTeamPreview[];
};

export type DexTrainerPresetTeamPreviewPokemon = BossTrainerPresetTeamPreviewPokemonData & {
  sprite?: DexPokemonSprites;
};

export type DexTrainerPresetTeamPreview = Omit<BossTrainerPresetTeamPreviewData, "pokemon"> & {
  pokemon: DexTrainerPresetTeamPreviewPokemon[];
};

export type DexSystemReforgeKind = "mega" | "z-crystal" | "tera";

export type DexSystemBattleReforgePokemonInput = {
  speciesId: string;
  name?: string;
  nameZh?: string;
  moves?: Array<{moveId?: string; id?: string; type?: string; typeId?: string}>;
};

export type DexSystemBattleReforgeOption = {
  id: string;
  kind: DexSystemReforgeKind;
  name: string;
  nameZh: string;
  description: string;
  iconUrl?: string;
  iconStyle?: string;
  mappedItemId?: string;
  mappedTeraType?: string;
  mappedTeraTypeZh?: string;
  type?: string;
  typeZh?: string;
  appliesTo?: string[];
  requiredMoveId?: string;
  requiredMoveName?: string;
  requiredMoveNameZh?: string;
};

export type DexStatsInput = {
  speciesId: string;
  level?: number;
  nature?: string;
  evs?: Partial<Record<DexStatId, number>>;
  ivs?: Partial<Record<DexStatId, number>>;
};

export type DexStatsResult = {
  level: number;
  nature: string;
  stats: Record<DexStatId, number>;
};

export type DexPokemonMaxStatsInput = {
  speciesId: string;
  level?: number;
};

export type DexPokemonMaxStatsResult = {
  speciesId: string;
  level: number;
  stats: Record<DexStatId, number>;
};

export type ShowdownDexLike = {
  species: {
    get(id: string): any;
    all(): any[];
    getFullLearnset?(id: string): Array<{learnset?: Record<string, string[]>}>;
  };
  moves: {get(id: string): any; all(): any[]};
  abilities: {get(id: string): any; all(): any[]};
  items: {get(id: string): any; all(): any[]};
  natures?: {get(id: string): any};
};

export type ShowdownDexServiceOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
};

export type ShowdownDexService = ReturnType<typeof createShowdownDexService>;

const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const DEFAULT_RESOURCE_PREFIX = "/showdown/";
const TYPE_IDS = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
const TYPE_ID_BY_ZH: Record<string, string> = {
  一般: "normal",
  普通: "normal",
  火: "fire",
  水: "water",
  电: "electric",
  草: "grass",
  冰: "ice",
  格斗: "fighting",
  毒: "poison",
  地面: "ground",
  飞行: "flying",
  超能力: "psychic",
  虫: "bug",
  岩石: "rock",
  幽灵: "ghost",
  龙: "dragon",
  恶: "dark",
  钢: "steel",
  妖精: "fairy",
};
const ITEM_KIND_LABEL: Record<DexItemKind, string> = {
  berry: "树果",
  recovery: "恢复道具",
  revive: "复活道具",
  pp: "PP 道具",
  tm: "技能机器",
  training: "训练道具",
  system: "系统道具",
  "system-battle": "系统战斗道具",
  valuable: "贵重/剧情道具",
  special: "特殊道具",
  held: "携带道具",
  battle: "战斗道具",
  other: "其他道具",
};
const ITEM_SOURCE_LABEL: Record<DexItemSource, string> = {
  showdown: "Showdown",
  "v1-game": "V1 游戏道具",
  overlay: "Showdown + V1",
  system: "系统道具",
};

type ItemRegistryEntry = {
  id: string;
  name: string;
  nameZh: string;
  kind: DexItemKind;
  source: DexItemSource;
  description: string;
  effectSummary?: string;
  recoveryEffect?: DexItemRecoveryEffect;
  trainingEffect?: DexItemTrainingEffect;
  iconAsset?: string;
  canBattleUse: boolean;
  canUse: boolean;
  canUseToPokemon: boolean;
  canTake: boolean;
  canSale: boolean;
  cost: number;
  futureInstanceCompatible: boolean;
  tags?: string[];
};

const TRAINING_STAT_ITEMS: Array<{stat: DexStatId; label: string; english: string; iconId: string}> = [
  {stat: "hp", label: "HP", english: "HP", iconId: "hpup"},
  {stat: "atk", label: "攻击", english: "Attack", iconId: "protein"},
  {stat: "def", label: "防御", english: "Defense", iconId: "iron"},
  {stat: "spa", label: "特攻", english: "Sp. Atk", iconId: "calcium"},
  {stat: "spd", label: "特防", english: "Sp. Def", iconId: "zinc"},
  {stat: "spe", label: "速度", english: "Speed", iconId: "carbos"},
];

const NATURE_MINT_ITEMS: Array<{nature: string; label: string}> = [
  ["Hardy", "勤奋"], ["Lonely", "怕寂寞"], ["Brave", "勇敢"], ["Adamant", "固执"], ["Naughty", "顽皮"],
  ["Bold", "大胆"], ["Docile", "坦率"], ["Relaxed", "悠闲"], ["Impish", "淘气"], ["Lax", "乐天"],
  ["Timid", "胆小"], ["Hasty", "急躁"], ["Serious", "认真"], ["Jolly", "爽朗"], ["Naive", "天真"],
  ["Modest", "内敛"], ["Mild", "慢吞吞"], ["Quiet", "冷静"], ["Bashful", "害羞"], ["Rash", "马虎"],
  ["Calm", "温和"], ["Gentle", "温顺"], ["Sassy", "自大"], ["Careful", "慎重"], ["Quirky", "浮躁"],
].map(([nature, label]) => ({nature, label}));

const EV_TRAINING_ITEM_ENTRIES = TRAINING_STAT_ITEMS.flatMap(({stat, label, english, iconId}) => [
  v1Item(`ev-${stat}-max`, `${english} Max Serum`, `${label}全满提升剂`, "training", `使${label}努力值提升到 252。`, {cost: 18000, trainingEffect: {kind: "ev", stat, mode: "add", target: 252}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-large`, `${english} Large Serum`, `${label}大提升剂`, "training", `使${label}努力值至少提升到 100。`, {cost: 10000, trainingEffect: {kind: "ev", stat, mode: "add", target: 100}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-plus`, `${english} Serum`, `${label}提升剂`, "training", `使${label}努力值提升 10 点。`, {cost: 3000, trainingEffect: {kind: "ev", stat, mode: "add", amount: 10}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-small`, `${english} Micro Serum`, `${label}小提升剂`, "training", `使${label}努力值提升 1 点。`, {cost: 500, trainingEffect: {kind: "ev", stat, mode: "add", amount: 1}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-zero`, `${english} Reset Tonic`, `${label}清零药`, "training", `使${label}努力值降低到 0。`, {cost: 3000, trainingEffect: {kind: "ev", stat, mode: "reduce", target: 0}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-down-large`, `${english} Large Down Tonic`, `${label}大降低药`, "training", `使${label}努力值降低到 100。`, {cost: 2000, trainingEffect: {kind: "ev", stat, mode: "reduce", target: 100}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-down`, `${english} Down Tonic`, `${label}降低药`, "training", `使${label}努力值降低 10 点。`, {cost: 1000, trainingEffect: {kind: "ev", stat, mode: "reduce", amount: 10}, iconAsset: `runtime/items/${iconId}/icon.png`}),
  v1Item(`ev-${stat}-down-small`, `${english} Micro Down Tonic`, `${label}小降低药`, "training", `使${label}努力值降低 1 点。`, {cost: 200, trainingEffect: {kind: "ev", stat, mode: "reduce", amount: 1}, iconAsset: `runtime/items/${iconId}/icon.png`}),
]);

const NATURE_MINT_ENTRIES = NATURE_MINT_ITEMS.map(({nature, label}) =>
  v1Item(`${toID(nature)}mint`, `${nature} Mint`, `${label}薄荷`, "training", `把宝可梦性格调整为${label}。`, {cost: 12000, trainingEffect: {kind: "nature", nature}, iconAsset: natureMintIconAsset(nature)})
);

const V1_GAME_ITEM_ENTRIES: ItemRegistryEntry[] = [
  v1Item("potion", "Potion", "回复药", "recovery", "恢复 20 点 HP。", {cost: 300, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 20}}}),
  v1Item("superpotion", "Super Potion", "好伤药", "recovery", "恢复 60 点 HP。", {cost: 700, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 60}}}),
  v1Item("hyperpotion", "Hyper Potion", "绝好伤药", "recovery", "恢复 120 点 HP。", {cost: 1200, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 120}}}),
  v1Item("maxpotion", "Max Potion", "全满药", "recovery", "恢复全部 HP。", {cost: 2500, canBattleUse: true, recoveryEffect: {hp: {kind: "full"}}}),
  v1Item("fullrestore", "Full Restore", "全复药", "recovery", "恢复指定宝可梦全部 HP，并解除其异常状态。", {cost: 3000, canBattleUse: true, recoveryEffect: {hp: {kind: "full"}, cureStatus: "all"}}),
  v1Item("freshwater", "Fresh Water", "美味之水", "recovery", "恢复 30 点 HP。", {cost: 200, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 30}}}),
  v1Item("sodapop", "Soda Pop", "劲爽汽水", "recovery", "恢复 50 点 HP。", {cost: 300, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 50}}}),
  v1Item("lemonade", "Lemonade", "果汁牛奶", "recovery", "恢复 70 点 HP。", {cost: 350, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 70}}}),
  v1Item("moomoomilk", "Moomoo Milk", "哞哞鲜奶", "recovery", "恢复 100 点 HP。", {cost: 500, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 100}}}),
  v1Item("fullheal", "Full Heal", "万灵药", "recovery", "解除异常状态。", {cost: 600, canBattleUse: true, recoveryEffect: {cureStatus: "all"}}),
  v1Item("healpowder", "Heal Powder", "万能粉", "recovery", "解除异常状态。", {cost: 450, canBattleUse: true, recoveryEffect: {cureStatus: "all"}}),
  v1Item("antidote", "Antidote", "解毒药", "recovery", "解除中毒状态。", {cost: 100, canBattleUse: true, recoveryEffect: {cureStatus: ["psn", "tox"]}}),
  v1Item("burnheal", "Burn Heal", "灼伤药", "recovery", "解除灼伤状态。", {cost: 250, canBattleUse: true, recoveryEffect: {cureStatus: ["brn"]}}),
  v1Item("iceheal", "Ice Heal", "解冻药", "recovery", "解除冰冻状态。", {cost: 250, canBattleUse: true, recoveryEffect: {cureStatus: ["frz"]}}),
  v1Item("awakening", "Awakening", "解眠药", "recovery", "解除睡眠状态。", {cost: 250, canBattleUse: true, recoveryEffect: {cureStatus: ["slp"]}}),
  v1Item("paralyzeheal", "Paralyze Heal", "解麻药", "recovery", "解除麻痹状态。", {cost: 200, canBattleUse: true, recoveryEffect: {cureStatus: ["par"]}}),
  v1Item("energypowder", "Energy Powder", "元气粉", "recovery", "恢复 60 点 HP。", {cost: 500, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 60}}}),
  v1Item("energyroot", "Energy Root", "元气根", "recovery", "恢复 120 点 HP。", {cost: 800, canBattleUse: true, recoveryEffect: {hp: {kind: "fixed", amount: 120}}}),
  v1Item("revive", "Revive", "活力碎片", "revive", "让濒死宝可梦复活，并恢复一半 HP。", {cost: 1500, canBattleUse: true, recoveryEffect: {revive: "half"}}),
  v1Item("maxrevive", "Max Revive", "活力块", "revive", "让濒死宝可梦复活，并恢复全部 HP。", {cost: 4000, canBattleUse: true, recoveryEffect: {revive: "full"}}),
  v1Item("revivalherb", "Revival Herb", "复活草", "revive", "让濒死宝可梦复活，并恢复全部 HP。", {cost: 2800, canBattleUse: true, recoveryEffect: {revive: "full"}}),
  v1Item("ether", "Ether", "PP 单项小补剂", "pp", "让 1 个招式恢复 10 点 PP。", {cost: 1200, canBattleUse: true, recoveryEffect: {pp: {scope: "one", amount: 10}}}),
  v1Item("maxether", "Max Ether", "PP 单项全补剂", "pp", "让 1 个招式恢复全部 PP。", {cost: 2000, canBattleUse: true, recoveryEffect: {pp: {scope: "one", full: true}}}),
  v1Item("elixir", "Elixir", "PP 多项小补剂", "pp", "让所有招式恢复 10 点 PP。", {cost: 3000, canBattleUse: true, recoveryEffect: {pp: {scope: "all", amount: 10}}}),
  v1Item("maxelixir", "Max Elixir", "PP 多项全补剂", "pp", "让所有招式恢复全部 PP。", {cost: 4500, canBattleUse: true, recoveryEffect: {pp: {scope: "all", full: true}}}),
  v1Item("oranberry", "Oran Berry", "橙橙果", "berry", "恢复 10 点 HP。", {cost: 80, canBattleUse: true, canTake: true, recoveryEffect: {hp: {kind: "fixed", amount: 10}}}),
  v1Item("sitrusberry", "Sitrus Berry", "文柚果", "berry", "恢复最大 HP 的 1/4。", {cost: 160, canBattleUse: true, canTake: true, recoveryEffect: {hp: {kind: "fraction", numerator: 1, denominator: 4}}}),
  v1Item("leppaberry", "Leppa Berry", "苹野果", "berry", "让 1 个招式恢复 10 点 PP。", {cost: 160, canBattleUse: true, canTake: true, recoveryEffect: {pp: {scope: "one", amount: 10}}}),
  v1Item("lumberry", "Lum Berry", "木子果", "berry", "解除异常状态。", {cost: 240, canBattleUse: true, canTake: true, recoveryEffect: {cureStatus: "all"}}),
  ...EV_TRAINING_ITEM_ENTRIES,
  ...NATURE_MINT_ENTRIES,
  v1Item("rarecandy", "Rare Candy", "神奇糖果", "training", "休整页使用，使宝可梦提升 1 级。", {cost: 4800, canBattleUse: false, trainingEffect: {kind: "level", amount: 1}}),
  v1Item("hpup", "HP Up", "HP 增强剂", "training", "休整页使用，提升 HP 努力值 100 点。", {cost: 10000, canBattleUse: false, trainingEffect: {kind: "ev", stat: "hp", mode: "add", target: 100}}),
  v1Item("protein", "Protein", "攻击增强剂", "training", "休整页使用，提升攻击努力值 100 点。", {cost: 10000, canBattleUse: false, trainingEffect: {kind: "ev", stat: "atk", mode: "add", target: 100}}),
  v1Item("iron", "Iron", "防御增强剂", "training", "休整页使用，提升防御努力值 100 点。", {cost: 10000, canBattleUse: false, trainingEffect: {kind: "ev", stat: "def", mode: "add", target: 100}}),
  v1Item("calcium", "Calcium", "特攻增强剂", "training", "休整页使用，提升特攻努力值 100 点。", {cost: 10000, canBattleUse: false, trainingEffect: {kind: "ev", stat: "spa", mode: "add", target: 100}}),
  v1Item("zinc", "Zinc", "特防增强剂", "training", "休整页使用，提升特防努力值 100 点。", {cost: 10000, canBattleUse: false, trainingEffect: {kind: "ev", stat: "spd", mode: "add", target: 100}}),
  v1Item("carbos", "Carbos", "速度增强剂", "training", "休整页使用，提升速度努力值 100 点。", {cost: 10000, canBattleUse: false, trainingEffect: {kind: "ev", stat: "spe", mode: "add", target: 100}}),
  v1Item("ppup", "PP Up", "PP 提升剂", "training", "提高 1 个招式的 PP 上限。", {cost: 9800, canBattleUse: false}),
  v1Item("ppmax", "PP Max", "PP 极限提升剂", "training", "将 1 个招式的 PP 上限提升到最大。", {cost: 16000, canBattleUse: false}),
  v1Item("abilitycapsule", "Ability Capsule", "特性胶囊", "training", "休整页使用，在普通特性之间切换。", {cost: 16000, canBattleUse: false, trainingEffect: {kind: "ability", mode: "capsule"}}),
  v1Item("abilitypatch", "Ability Patch", "特性膏药", "training", "休整页使用，切换为隐藏特性。", {cost: 32000, canBattleUse: false, trainingEffect: {kind: "ability", mode: "patch"}}),
  v1Item("bottlecap", "Bottle Cap", "银色王冠", "training", "休整页使用，指定 1 项个体值提升到 31。", {cost: 12000, canBattleUse: false, trainingEffect: {kind: "iv", mode: "silver"}}),
  v1Item("goldbottlecap", "Gold Bottle Cap", "金色王冠", "training", "休整页使用，全部个体值提升到 31。", {cost: 30000, canBattleUse: false, trainingEffect: {kind: "iv", mode: "gold"}}),
  v1Item("graybottlecap", "Gray Bottle Cap", "灰色王冠", "training", "休整页使用，使 1 项个体值降低到 0。", {cost: 8000, canBattleUse: false, trainingEffect: {kind: "iv", mode: "gray"}, iconAsset: "runtime/items/goldbottlecap/icon.png"}),
  v1Item("system-mega-stone", "Universal Mega Ore", "通用Mega石", "system-battle", "工厂制造的幻之 Mega 石，只要对你的宝可梦使用，就能回应你的心。", {source: "system", effectSummary: "重铸并使用后，可让一只适合的宝可梦携带专属 Mega 石。", canUse: true, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "specIcon/mega2.png", tags: ["Mega", "mega进化", "超级进化", "系统战斗道具"]}),
  v1Item("system-z-crystal", "Universal Z-Crystal", "通用Z纯晶", "system-battle", "工厂制造的幻之 Z 纯晶，可以让宝可梦发挥出任何能用的 Z 招式。", {source: "system", effectSummary: "重铸并使用后，可让一只适合的宝可梦携带对应 Z 纯晶。", canUse: true, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "specIcon/Z2.png", tags: ["Z招式", "Z-Move", "纯晶", "系统战斗道具"]}),
  v1Item("system-dynamax-band", "Prototype Dynamax Band", "极巨化手环", "system-battle", "工厂和加勒尔联盟合作的极巨化手环，蕴含在任何地区都能极巨化的能量。", {source: "system", effectSummary: "拥有后，可在支持极巨化的规则中使用极巨化。", canUse: false, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "specIcon/jjh2.png", tags: ["极巨化", "Dynamax", "Max", "系统战斗道具"]}),
  v1Item("system-tera-orb", "Universal Tera Orb", "通用太晶珠", "system-battle", "工厂自研的太晶珠，蕴含一切属性的力量。", {source: "system", effectSummary: "重铸后，可在支持太晶化的规则中配置并使用太晶化。", canUse: true, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "specIcon/tjh2.png", tags: ["太晶化", "Terastallize", "太晶珠", "系统战斗道具"]}),
];

const V1_GAME_ITEM_BY_ID = new Map(V1_GAME_ITEM_ENTRIES.map(entry => [toID(entry.id), entry]));
const TRAINER_TYPE_LABEL: Record<DexTrainerType, string> = {
  normal: "路人训练师",
  gym: "馆主",
  elite4: "四天王",
  champion: "冠军",
  villain: "反派头目",
  player: "玩家",
  avatar: "头像",
};
const BOSS_TRAINER_TYPES = new Set<DexTrainerType>(["gym", "elite4", "champion", "villain"]);
const TRAINER_BY_ID = new Map<string, TrainerDataEntry>(TrainerData.map(trainer => [trainer.id, trainer]));
const TRAINER_TEAM_POOLS_BY_TRAINER = groupByTrainerTeamPools(TrainerTeamPools);

export function createShowdownDexService(options: ShowdownDexServiceOptions = {}) {
  const dex = options.dex || createLocalShowdownDex();
  const resourcePrefix = normalizeResourcePrefix(options.resourcePrefix || DEFAULT_RESOURCE_PREFIX);
  const translate = options.translate || defaultTranslate;

  function requireDex(): ShowdownDexLike {
    return dex;
  }

  function searchDex(request: DexSearchRequest = {}): DexSearchResult {
    const activeDex = requireDex();
    const category = request.category || "all";
    const query = String(request.query || "");
    const offset = Math.max(0, Number(request.offset || 0));
    const limit = Math.max(1, Math.min(100, Number(request.limit || 20)));
    const categories: DexCategory[] = category === "all" ? ["pokemon", "moves", "abilities", "items", "trainers"] : [category];
    const rows = categories.flatMap(current => rowsForCategory(activeDex, current));
    const ranked = rows
      .map(row => ({row, rank: rankRow(row, query)}))
      .filter(entry => entry.rank !== null)
      .sort((a, b) => Number(a.rank) - Number(b.rank) || categoryOrder(a.row.category) - categoryOrder(b.row.category) || a.row.name.localeCompare(b.row.name));
    const page = ranked.slice(offset, offset + limit).map(entry => entry.row);
    return {category, query, offset, limit, total: ranked.length, hasMore: offset + page.length < ranked.length, rows: page};
  }

  function getPokemonDetail(id: string): DexPokemonDetail {
    const activeDex = requireDex();
    const species = activeDex.species.get(id);
    assertExists(species, "Pokemon", id);
    return {
      id: species.id,
      name: species.name,
      nameZh: translate("pokemon", species.name),
      num: Number(species.num || 0),
      baseSpecies: species.baseSpecies || species.name,
      forme: species.forme || "",
      cosmeticFormes: species.cosmeticFormes || [],
      otherFormes: species.otherFormes || [],
      battleOnly: species.battleOnly,
      changesFrom: species.changesFrom,
      isMega: Boolean(species.isMega),
      canGigantamax: species.canGigantamax,
      isNonstandard: species.isNonstandard || null,
      types: species.types || [],
      baseStats: normalizeStats(species.baseStats || {}),
      abilities: Object.entries(species.abilities || {}).map(([slot, value]) => {
        const ability = activeDex.abilities.get(String(value || ""));
        const name = ability?.exists ? ability.name : String(value || "");
        return {id: ability?.id || toID(name), name, nameZh: translate("abilities", name), hidden: String(slot).toUpperCase() === "H", description: translatedDescription("abilities", name, ability?.desc || ability?.shortDesc || "")};
      }),
      heightm: species.heightm,
      weightkg: species.weightkg,
      genderRatio: species.genderRatio || undefined,
      color: species.color || "",
      eggGroups: species.eggGroups || [],
      evolutionChain: evolutionChain(species.id),
      formes: formesFor(species.id),
      cryUrl: resolvePokemonCry(species.id),
      sprites: resolvePokemonSprites({speciesId: species.id}),
      learnset: getPokemonLearnset(species.id),
      learnsetGroups: getPokemonLearnsetGroups(species.id),
    };
  }

  function getMoveDetail(id: string): DexMoveDetail {
    const activeDex = requireDex();
    const move = activeDex.moves.get(id);
    assertExists(move, "Move", id);
    return {...moveSummary(activeDex, move, [], translate), learners: getMoveLearners(move.id), flagsText: Object.keys(move.flags || {})};
  }

  function getAbilityDetail(id: string): DexAbilityDetail {
    const activeDex = requireDex();
    const ability = activeDex.abilities.get(id);
    assertExists(ability, "Ability", id);
    return {
      id: ability.id,
      name: ability.name,
      nameZh: translate("abilities", ability.name),
      description: translatedDescription("abilities", ability.name, ability.desc || ability.shortDesc || ""),
      holders: activeDex.species.all()
        .filter(species => includeSpecies(species))
        .flatMap(species => {
          const slot = Object.entries(species.abilities || {}).find(([, value]) => toID(value) === ability.id);
          return slot ? [{pokemon: pokemonRow(activeDex, species), hidden: String(slot[0]).toUpperCase() === "H", unavailable: Boolean(species.isNonstandard && species.isNonstandard !== "Past")}] : [];
        }),
    };
  }

  function getItemDetail(id: string): DexItemDetail {
    const activeDex = requireDex();
    if (isTmItemId(id)) {
      const moveId = id.slice(3);
      const move = activeDex.moves.get(moveId);
      assertExists(move, "Move", moveId);
      return tmItemDetail(activeDex, move);
    }
    const item = activeDex.items.get(id);
    const overlay = V1_GAME_ITEM_BY_ID.get(toID(id));
    if (!item?.exists && overlay) return registryItemDetail(overlay);
    assertExists(item, "Item", id);
    return showdownItemDetail(item, overlay);
  }

  function getTmItemDetail(moveIdOrTmId: string): DexItemDetail {
    const normalized = normalizeTmItemId(moveIdOrTmId);
    return getItemDetail(normalized);
  }

  function getTrainerDetail(trainerId: string): DexTrainerDetail {
    const trainer = TRAINER_BY_ID.get(trainerId);
    if (!trainer) throw new Error(`Trainer not found: ${trainerId}`);
    const summary = trainerSummary(trainer);
    const teamPools = (TRAINER_TEAM_POOLS_BY_TRAINER.get(trainer.id) || []).map(teamPoolSummary);
    const teamPoolPresetCounts = teamPools.reduce<Record<string, number>>((acc, pool) => {
      acc[pool.battleRulePreset] = (acc[pool.battleRulePreset] || 0) + 1;
      return acc;
    }, {});
    return {
      ...summary,
      dialogues: normalizeTrainerDialogues(TrainerDialogues[trainer.id]),
      teamPools,
      teamPoolPresetCounts,
      presetTeamPreviews: trainerPresetTeamPreviews(trainer.id),
    };
  }

  function getSystemBattleReforgeOptions(itemId: string, pokemon: DexSystemBattleReforgePokemonInput | null | undefined): DexSystemBattleReforgeOption[] {
    const normalized = toID(itemId);
    if (normalized === "systemmegastone") return megaReforgeOptions(pokemon);
    if (normalized === "systemzcrystal") return zCrystalReforgeOptions(pokemon);
    if (normalized === "systemteraorb") return teraReforgeOptions();
    return [];
  }

  function getPokemonLearnset(speciesId: string): DexMoveSummary[] {
    const activeDex = requireDex();
    const seen = new Map<string, Set<DexLearnSource>>();
    for (const entry of activeDex.species.getFullLearnset?.(speciesId) || []) {
      for (const [moveId, codes] of Object.entries(entry.learnset || {})) {
        const move = activeDex.moves.get(moveId);
        if (!move?.exists) continue;
        const current = seen.get(move.id) || new Set<DexLearnSource>();
        learnSources(codes as string[]).forEach(source => current.add(source));
        seen.set(move.id, current);
      }
    }
    return Array.from(seen.entries()).map(([moveId, sources]) => moveSummary(activeDex, activeDex.moves.get(moveId), Array.from(sources), translate));
  }

  function getPokemonLearnsetGroups(speciesId: string): Record<DexLearnSource, DexMoveSummary[]> {
    return groupLearnset(getPokemonLearnset(speciesId));
  }

  function getPokemonSkillsBySource(speciesId: string, source: DexLearnSource): DexMoveSummary[] {
    return getPokemonLearnsetGroups(speciesId)[source] || [];
  }

  function getMoveLearners(moveId: string): Array<{pokemon: DexSearchRow; sources: DexLearnSource[]}> {
    const activeDex = requireDex();
    const id = toID(moveId);
    return activeDex.species.all()
      .filter(species => includeSpecies(species))
      .flatMap(species => {
        const sources = new Set<DexLearnSource>();
        for (const entry of activeDex.species.getFullLearnset?.(species.id) || []) {
          const codes = entry.learnset?.[id];
          if (codes) learnSources(codes).forEach(source => sources.add(source));
        }
        return sources.size ? [{pokemon: pokemonRow(activeDex, species), sources: Array.from(sources)}] : [];
      });
  }

  function calculatePokemonStats(input: DexStatsInput): DexStatsResult {
    const activeDex = requireDex();
    const species = activeDex.species.get(input.speciesId);
    assertExists(species, "Pokemon", input.speciesId);
    const level = clamp(Number(input.level || 100), 1, 100);
    const nature = String(input.nature || "Serious");
    const natureData = activeDex.natures?.get(nature) || {};
    const stats = Object.fromEntries(STAT_IDS.map(stat => {
      const iv = Number(input.ivs?.[stat] ?? 31);
      const ev = Number(input.evs?.[stat] ?? 0);
      return [stat, calculatePokemonStat(species, stat, level, iv, ev, natureData)];
    })) as Record<DexStatId, number>;
    return {level, nature, stats};
  }

  function getPokemonMaxStats(input: DexPokemonMaxStatsInput): DexPokemonMaxStatsResult {
    const activeDex = requireDex();
    const species = activeDex.species.get(input.speciesId);
    assertExists(species, "Pokemon", input.speciesId);
    const level = clamp(Number(input.level || 100), 1, 100);
    const stats = Object.fromEntries(STAT_IDS.map(stat => {
      const natureData = stat === "hp" ? {} : {plus: stat};
      return [stat, calculatePokemonStat(species, stat, level, 31, 255, natureData)];
    })) as Record<DexStatId, number>;
    return {speciesId: species.id, level, stats};
  }

  function resolvePokemonSprites(input: {speciesId: string}): DexPokemonSprites {
    const species = requireDex().species.get(input.speciesId);
    const icon = resolvePokemonIcon(species?.id || input.speciesId);
    const spriteId = species?.spriteid || species?.id || toID(input.speciesId);
    return {
      resourcePrefix,
      spriteId,
      baseSpriteId: spriteId,
      iconUrl: icon.url,
      iconStyle: icon.style,
      frontUrl: `${resourcePrefix}sprites/ani/${spriteId}.gif`,
      backUrl: `${resourcePrefix}sprites/ani-back/${spriteId}.gif`,
      frontShinyUrl: `${resourcePrefix}sprites/ani-shiny/${spriteId}.gif`,
      backShinyUrl: `${resourcePrefix}sprites/ani-back-shiny/${spriteId}.gif`,
      animatedFrontUrl: `${resourcePrefix}sprites/ani/${spriteId}.gif`,
      animatedBackUrl: `${resourcePrefix}sprites/ani-back/${spriteId}.gif`,
      animatedFrontShinyUrl: `${resourcePrefix}sprites/ani-shiny/${spriteId}.gif`,
      animatedBackShinyUrl: `${resourcePrefix}sprites/ani-back-shiny/${spriteId}.gif`,
    };
  }

  function resolveTypeIcon(type: string) {
    return {url: `${resourcePrefix}sprites/types/${encodeURIComponent(type)}.png`};
  }

  function resolveCategoryIcon(category: string) {
    return {url: `${resourcePrefix}sprites/categories/${encodeURIComponent(category)}.png`};
  }

  function resolveItemIcon(itemId: string) {
    const item = requireDex().items.get(itemId);
    const num = Number(item?.spritenum || 0);
    const top = Math.floor(num / 16) * 24;
    const left = (num % 16) * 24;
    return {url: `${resourcePrefix}sprites/itemicons-sheet.png`, style: `background:transparent url(${resourcePrefix}sprites/itemicons-sheet.png?v1) no-repeat scroll -${left}px -${top}px`};
  }

  function resolveRegistryItemIcon(asset: string) {
    const path = asset.replace(/^assets\//, "").replace(/^\/+/, "");
    return {url: `${resourcePrefix.replace(/showdown\/$/, "")}${path}`, style: undefined as string | undefined};
  }

  function resolvePokemonIcon(speciesId: string) {
    const species = requireDex().species.get(speciesId);
    const id = species?.id || toID(speciesId);
    let num = Number(species?.num || 0);
    if (num < 0 || num > 1025) num = 0;
    num = BattlePokemonIconIndexes[id] || num;
    const top = Math.floor(num / 12) * 30;
    const left = (num % 12) * 40;
    return {url: `${resourcePrefix}sprites/pokemonicons-sheet.png`, style: `background:transparent url(${resourcePrefix}sprites/pokemonicons-sheet.png?v22) no-repeat scroll -${left}px -${top}px`};
  }

  function rowsForCategory(activeDex: ShowdownDexLike, category: DexCategory): DexSearchRow[] {
    if (category === "pokemon") return activeDex.species.all().filter(includeSpecies).map(species => pokemonRow(activeDex, species));
    if (category === "moves") return activeDex.moves.all().filter(entry => entry.exists).map(move => ({id: move.id, category: "moves", name: move.name, nameZh: translate("moves", move.name), subtitle: `${translate("types", move.type || "")} / ${translate("categories", move.category || "")}`, description: translatedDescription("moves", move.name, move.shortDesc || move.desc || ""), tags: [move.id, move.name, translate("moves", move.name), move.type, translate("types", move.type || ""), move.category, translate("categories", move.category || "")].filter(Boolean)}));
    if (category === "abilities") return activeDex.abilities.all().filter(entry => entry.exists).map(ability => ({id: ability.id, category: "abilities", name: ability.name, nameZh: translate("abilities", ability.name), subtitle: "特性", description: translatedDescription("abilities", ability.name, ability.shortDesc || ability.desc || ""), tags: [ability.id, ability.name, translate("abilities", ability.name)]}));
    if (category === "items") return itemRows(activeDex);
    if (category === "trainers") return trainerRows();
    return [];
  }

  function trainerRows(): DexSearchRow[] {
    return TrainerData.map(trainer => {
      const summary = trainerSummary(trainer);
      const dialoguePreview = firstTrainerDialogueLine(summary.id);
      return {
        id: summary.id,
        category: "trainers",
        name: summary.name,
        nameZh: summary.nameZh,
        subtitle: [summary.region || "未知地区", summary.trainerTypeLabel, summary.role].filter(Boolean).join(" / "),
        description: dialoguePreview || trainerDescription(summary),
        tags: trainerTags(summary),
        iconUrl: summary.avatarAsset || summary.frontGifAsset || summary.frontAsset,
      };
    });
  }

  function trainerSummary(trainer: TrainerDataEntry): DexTrainerSummary {
    const trainerType = trainer.trainerType as DexTrainerType;
    const representativePokemon = (TrainerRepresentatives[trainer.id] || []).slice(0, 12).map(representativeSummary);
    const teamPoolCount = TRAINER_TEAM_POOLS_BY_TRAINER.get(trainer.id)?.length || 0;
    const dialogueStateCount = Object.keys(TrainerDialogues[trainer.id] || {}).length;
    return {
      id: trainer.id,
      trainerType,
      trainerTypeLabel: TRAINER_TYPE_LABEL[trainerType] || trainerType,
      sourceType: trainer.sourceType,
      region: trainer.region,
      role: trainer.role,
      sourceTier: trainer.sourceTier,
      name: trainer.name,
      nameZh: trainer.nameZh,
      frontAsset: trainer.frontAsset,
      frontGifAsset: trainer.frontGifAsset || undefined,
      backAsset: trainer.backAsset || undefined,
      avatarAsset: trainer.avatarAsset || trainer.frontGifAsset || trainer.frontAsset,
      teamPoolIds: trainer.teamPoolIds,
      notes: trainer.notes,
      bossProfile: normalizeBossProfile(TrainerBossProfiles[trainer.id]),
      bossPresetMatrix: BossTrainerPresetMatrixSummaries[trainer.id],
      representativePokemon,
      teamPoolCount,
      dialogueStateCount,
      isBoss: BOSS_TRAINER_TYPES.has(trainerType),
    };
  }

  function representativeSummary(entry: TrainerRepresentativeData): DexTrainerRepresentative {
    return {
      speciesId: entry.speciesId,
      species: entry.species,
      speciesZh: translate("pokemon", entry.species),
      count: entry.count,
      sourceNames: entry.sourceNames,
      sprite: resolvePokemonSprites({speciesId: entry.speciesId}),
    };
  }

  function teamPoolSummary(entry: TrainerTeamPoolData): DexTrainerTeamPoolSummary {
    return {
      poolId: entry.poolId,
      battleRulePreset: entry.battleRulePreset,
      trainerId: entry.trainerId,
      trainerNameZh: entry.trainerNameZh,
      teamIndex: entry.teamIndex,
      source: entry.source,
      pokemon: entry.pokemon.map(teamPokemonSummary),
    };
  }

  function teamPokemonSummary(entry: TrainerTeamPokemonData): DexTrainerTeamPokemon {
    return {
      slot: entry.slot,
      speciesId: entry.speciesId,
      species: entry.species,
      speciesZh: translate("pokemon", entry.species),
      sourceSpeciesRank: entry.sourceSpeciesRank,
      sourceStageRank: entry.sourceStageRank,
      sourcePowerProfile: entry.sourcePowerProfile,
      sprite: resolvePokemonSprites({speciesId: entry.speciesId}),
    };
  }

  function trainerPresetTeamPreviews(trainerId: string): DexTrainerPresetTeamPreview[] {
    return BossTrainerPresetTeamPreviewsCompact
      .filter(([currentTrainerId]) => currentTrainerId === trainerId)
      .map(([currentTrainerId, ruleSetPreset, mode, variantIndex, teamArchetype, pokemon]) => ({
        trainerId: currentTrainerId,
        ruleSetPreset,
        mode,
        variantIndex,
        teamArchetype,
        pokemon: pokemon.map(([species, item, ability, level]) => {
          const speciesData = requireDex().species.get(species);
          const speciesId = speciesData?.id || toID(species);
          const speciesName = speciesData?.name || species;
          return {
            speciesId,
            species: speciesName,
            speciesZh: translate("pokemon", speciesName),
            item,
            ability,
            level,
            sprite: resolvePokemonSprites({speciesId}),
          };
        }),
      }));
  }

  function itemRows(activeDex: ShowdownDexLike): DexSearchRow[] {
    const rows = new Map<string, DexSearchRow>();
    for (const item of activeDex.items.all().filter(entry => entry.exists)) {
      const overlay = V1_GAME_ITEM_BY_ID.get(item.id);
      rows.set(item.id, itemDetailToRow(showdownItemDetail(item, overlay)));
    }
    for (const entry of V1_GAME_ITEM_ENTRIES) {
      if (!rows.has(entry.id)) rows.set(entry.id, itemDetailToRow(registryItemDetail(entry)));
    }
    for (const move of activeDex.moves.all().filter(entry => entry.exists && includeDataEntry(entry))) {
      const detail = tmItemDetail(activeDex, move);
      rows.set(detail.id, itemDetailToRow(detail));
    }
    return Array.from(rows.values());
  }

  function showdownItemDetail(item: any, overlay?: ItemRegistryEntry): DexItemDetail {
    const kind = overlay?.kind || itemKind(item);
    const icon = overlay?.iconAsset ? resolveRegistryItemIcon(overlay.iconAsset) : resolveItemIcon(item.id);
    const source: DexItemSource = overlay ? "overlay" : "showdown";
    const description = overlay?.description || translatedDescription("items", item.name, item.desc || item.shortDesc || "");
    return {
      id: item.id,
      name: item.name,
      nameZh: overlay?.nameZh || translate("items", item.name),
      kind,
      kindLabel: ITEM_KIND_LABEL[kind],
      description,
      source,
      sourceLabel: ITEM_SOURCE_LABEL[source],
      effectSummary: overlay?.effectSummary || description,
      recoveryEffect: overlay?.recoveryEffect,
      trainingEffect: overlay?.trainingEffect,
      canBattleUse: overlay?.canBattleUse ?? false,
      canUse: overlay?.canUse ?? false,
      canUseToPokemon: overlay?.canUseToPokemon ?? false,
      canTake: overlay?.canTake ?? true,
      canSale: overlay?.canSale ?? true,
      cost: overlay?.cost ?? 500,
      futureInstanceCompatible: true,
      iconUrl: icon.url,
      iconStyle: grayBottleCapStyle(item.id, icon.style),
    };
  }

  function registryItemDetail(entry: ItemRegistryEntry): DexItemDetail {
    const icon = resolveRegistryItemIcon(entry.iconAsset || `runtime/items/${entry.id}/icon.png`);
    return {
      id: entry.id,
      name: entry.name,
      nameZh: entry.nameZh,
      kind: entry.kind,
      kindLabel: ITEM_KIND_LABEL[entry.kind],
      description: entry.description,
      source: entry.source,
      sourceLabel: ITEM_SOURCE_LABEL[entry.source],
      effectSummary: entry.effectSummary || entry.description,
      recoveryEffect: entry.recoveryEffect,
      trainingEffect: entry.trainingEffect,
      canBattleUse: entry.canBattleUse,
      canUse: entry.canUse,
      canUseToPokemon: entry.canUseToPokemon,
      canTake: entry.canTake,
      canSale: entry.canSale,
      cost: entry.cost,
      futureInstanceCompatible: entry.futureInstanceCompatible,
      iconUrl: icon.url,
      iconStyle: grayBottleCapStyle(entry.id, icon.style),
    };
  }

  function tmItemDetail(activeDex: ShowdownDexLike, move: any): DexItemDetail {
    const typeName = move.type || "Normal";
    const typeZh = translate("types", typeName);
    const moveNameZh = translate("moves", move.name);
    const icon = resolveRegistryItemIcon(`runtime/items/machine${toID(typeName) || "normal"}/icon.png`);
    return {
      id: `tm:${move.id}`,
      name: `TM ${move.name}`,
      nameZh: `技能机器：${moveNameZh || move.name}`,
      kind: "tm",
      kindLabel: ITEM_KIND_LABEL.tm,
      description: `工厂刻录的技能机器，外壳会随招式属性显示不同颜色；使用后可以让宝可梦学会 ${moveNameZh || move.name}。`,
      source: "v1-game",
      sourceLabel: ITEM_SOURCE_LABEL["v1-game"],
      effectSummary: `技能机器模板。属性：${typeZh || typeName}，威力：${Number(move.basePower || 0) || "-"}，命中：${move.accuracy === true ? "-" : Number(move.accuracy || 0) || "-"}。`,
      canBattleUse: false,
      canUse: true,
      canUseToPokemon: true,
      canTake: false,
      canSale: true,
      cost: defaultTmCost(move),
      futureInstanceCompatible: true,
      moveId: move.id,
      moveName: move.name,
      moveNameZh,
      iconUrl: icon.url,
      iconStyle: icon.style,
    };
  }

  function itemDetailToRow(detail: DexItemDetail): DexSearchRow {
    return {
      id: detail.id,
      category: "items",
      name: detail.name,
      nameZh: detail.nameZh,
      subtitle: detail.kindLabel,
      description: detail.description,
      tags: [
        detail.id,
        detail.name,
        detail.nameZh,
        detail.kind,
        detail.kindLabel,
        detail.sourceLabel || "",
        detail.effectSummary || "",
        detail.moveId || "",
        detail.moveName || "",
        detail.moveNameZh || "",
        ...(V1_GAME_ITEM_BY_ID.get(detail.id)?.tags || []),
      ].filter(Boolean),
      iconUrl: detail.iconUrl,
      iconStyle: detail.iconStyle,
    };
  }

  function megaReforgeOptions(pokemon: DexSystemBattleReforgePokemonInput | null | undefined): DexSystemBattleReforgeOption[] {
    if (!pokemon?.speciesId) return [];
    const activeDex = requireDex();
    const species = activeDex.species.get(pokemon.speciesId);
    const speciesNames = new Set([species?.name, species?.baseSpecies, pokemon.speciesId, pokemon.name].filter(Boolean).map(value => String(value)));
    return activeDex.items.all()
      .filter(item => item?.exists && item.megaStone && itemAppliesToAny(item, speciesNames))
      .map(item => itemReforgeOption(item, "mega"))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function zCrystalReforgeOptions(pokemon: DexSystemBattleReforgePokemonInput | null | undefined): DexSystemBattleReforgeOption[] {
    const activeDex = requireDex();
    const moveIds = new Set((pokemon?.moves || []).map(move => toID(move.moveId || move.id)).filter(Boolean));
    const moveTypes = new Set((pokemon?.moves || []).map(move => moveTypeIdForReforge(activeDex, move)).filter(Boolean));
    const species = pokemon?.speciesId ? activeDex.species.get(pokemon.speciesId) : null;
    const speciesNames = new Set([species?.name, species?.baseSpecies, pokemon?.speciesId, pokemon?.name].filter(Boolean).map(value => String(value)));
    return activeDex.items.all()
      .filter(item => item?.exists && (item.zMove || item.zMoveType))
      .filter(item => {
        if (item.zMoveFrom) return moveIds.has(toID(item.zMoveFrom)) && itemAppliesToAny(item, speciesNames);
        if (item.itemUser?.length && !itemAppliesToAny(item, speciesNames)) return false;
        return Boolean(item.zMoveType && moveTypes.has(toID(item.zMoveType)));
      })
      .map(item => itemReforgeOption(item, "z-crystal", item.zMoveType || "", item.zMoveFrom || ""))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function teraReforgeOptions(): DexSystemBattleReforgeOption[] {
    return TYPE_IDS.map(type => {
      const typeId = toID(type);
      const typeZh = translate("types", type);
      return {
        id: `tera:${typeId}`,
        kind: "tera",
        name: `${type} Tera`,
        nameZh: `${typeZh}太晶`,
        description: `把通用太晶珠调律为${typeZh}属性。`,
        mappedTeraType: type,
        mappedTeraTypeZh: typeZh,
        type,
        typeZh,
      };
    });
  }

  function itemReforgeOption(item: any, kind: DexSystemReforgeKind, type = "", requiredMove = ""): DexSystemBattleReforgeOption {
    const detail = showdownItemDetail(item);
    const move = requiredMove ? requireDex().moves.get(requiredMove) : null;
    const typeZh = type ? translate("types", type) : "";
    return {
      id: `${kind}:${item.id}`,
      kind,
      name: item.name,
      nameZh: detail.nameZh || item.name,
      description: detail.effectSummary || detail.description,
      iconUrl: detail.iconUrl,
      iconStyle: detail.iconStyle,
      mappedItemId: item.id,
      type: type || undefined,
      typeZh: typeZh || undefined,
      appliesTo: Array.isArray(item.itemUser) ? item.itemUser : [],
      requiredMoveId: move?.id || (requiredMove ? toID(requiredMove) : undefined),
      requiredMoveName: move?.name || requiredMove || undefined,
      requiredMoveNameZh: move?.name ? translate("moves", move.name) : undefined,
    };
  }

  function itemAppliesToAny(item: any, speciesNames: Set<string>): boolean {
    if (!speciesNames.size) return false;
    if (Array.isArray(item.itemUser) && item.itemUser.some((name: string) => speciesNames.has(name))) return true;
    const megaStone = item.megaStone || {};
    return Object.keys(megaStone).some(name => speciesNames.has(name)) || Object.values(megaStone).some(name => speciesNames.has(String(name)));
  }

  function moveTypeIdForReforge(activeDex: ShowdownDexLike, move: {moveId?: string; id?: string; type?: string; typeId?: string}): string {
    const raw = String(move.typeId || move.type || "").trim();
    const explicit = toID(raw) || TYPE_ID_BY_ZH[raw] || "";
    if (explicit) return explicit;
    const moveId = toID(move.moveId || move.id);
    const detail = moveId ? activeDex.moves.get(moveId) : null;
    return toID(detail?.type || "");
  }

  function pokemonRow(activeDex: ShowdownDexLike, species: any): DexSearchRow {
    const types = (species.types || []) as string[];
    return {id: species.id, category: "pokemon", name: species.name, nameZh: translate("pokemon", species.name), subtitle: `${types.map(type => translate("types", type)).join(" / ")} No.${species.num || "--"}`, tags: [species.id, species.name, translate("pokemon", species.name), String(species.num || ""), ...types, ...types.map(type => translate("types", type))].filter(Boolean), sprite: resolvePokemonSprites({speciesId: species.id})};
  }

  return {
    searchDex,
    getPokemonDetail,
    getMoveDetail,
    getAbilityDetail,
    getItemDetail,
    getTmItemDetail,
    getTrainerDetail,
    getSystemBattleReforgeOptions,
    getPokemonLearnset,
    getPokemonLearnsetGroups,
    getPokemonSkillsBySource,
    getPokemonSelfLearnSkills: (speciesId: string) => getPokemonSkillsBySource(speciesId, "levelup"),
    getPokemonTutorSkills: (speciesId: string) => getPokemonSkillsBySource(speciesId, "tutor"),
    getPokemonEggSkills: (speciesId: string) => getPokemonSkillsBySource(speciesId, "egg"),
    getPokemonMachineSkills: (speciesId: string) => getPokemonSkillsBySource(speciesId, "machine"),
    getMoveLearners,
    calculatePokemonStats,
    getPokemonMaxStats,
    resolvePokemonSprites,
    resolveTypeIcon,
    resolveCategoryIcon,
    resolveItemIcon,
  };

  function evolutionChain(speciesId: string): DexPokemonLink[] {
    const activeDex = requireDex();
    const start = activeDex.species.get(speciesId);
    if (!start?.exists) return [];
    let root = start;
    const visited = new Set<string>();
    while (root.prevo && !visited.has(root.id)) {
      visited.add(root.id);
      const prevo = activeDex.species.get(root.prevo);
      if (!prevo?.exists) break;
      root = prevo;
    }
    const result: DexPokemonLink[] = [];
    const walk = (current: any) => {
      if (!current?.exists || result.some(entry => entry.id === current.id)) return;
      result.push(pokemonLink(current));
      for (const evo of current.evos || []) walk(activeDex.species.get(evo));
    };
    walk(root);
    return result;
  }

  function formesFor(speciesId: string): DexPokemonLink[] {
    const activeDex = requireDex();
    const species = activeDex.species.get(speciesId);
    if (!species?.exists) return [];
    const ids = [species.baseSpecies, ...(species.otherFormes || []), ...(species.cosmeticFormes || [])].filter(Boolean);
    return Array.from(new Set(ids.map(toID)))
      .map(id => activeDex.species.get(id))
      .filter(entry => entry?.exists && entry.id !== species.id)
      .map(pokemonLink);
  }

  function pokemonLink(species: any): DexPokemonLink {
    return {id: species.id, name: species.name, nameZh: translate("pokemon", species.name), num: Number(species.num || 0), sprite: resolvePokemonSprites({speciesId: species.id})};
  }

  function resolvePokemonCry(speciesId: string): string {
    const species = requireDex().species.get(speciesId);
    const cryId = species?.baseSpecies ? toID(species.baseSpecies) : species?.id || toID(speciesId);
    return `${resourcePrefix}audio/cries/${cryId}.mp3`;
  }
}

export function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function groupByTrainerTeamPools(teamPools: TrainerTeamPoolData[]): Map<string, TrainerTeamPoolData[]> {
  const result = new Map<string, TrainerTeamPoolData[]>();
  for (const pool of teamPools) {
    const current = result.get(pool.trainerId) || [];
    current.push(pool);
    result.set(pool.trainerId, current);
  }
  for (const pools of result.values()) {
    pools.sort((a, b) => a.battleRulePreset.localeCompare(b.battleRulePreset) || a.poolId.localeCompare(b.poolId) || a.teamIndex - b.teamIndex);
  }
  return result;
}

function normalizeTrainerDialogues(dialogues: TrainerDialogueSetData | undefined): DexTrainerDialogueSet {
  const result: DexTrainerDialogueSet = {};
  for (const [state, lines] of Object.entries(dialogues || {})) {
    result[state] = lines.map(normalizeTrainerDialogueLine);
  }
  return result;
}

function normalizeTrainerDialogueLine(line: TrainerDialogueLineData): DexTrainerDialogueLine {
  return {
    intro: Array.isArray(line.intro) ? line.intro : [],
    defeat: Array.isArray(line.defeat) ? line.defeat : [],
    victory: Array.isArray(line.victory) ? line.victory : [],
  };
}

function normalizeBossProfile(profile: TrainerBossProfileData | undefined): DexTrainerBossProfile | undefined {
  if (!profile) return undefined;
  return {
    trainerId: profile.trainerId,
    battlePreference: profile.battlePreference,
    aiLevel: profile.aiLevel,
    powerProfile: profile.powerProfile,
    teamPreferences: Array.isArray(profile.teamPreferences) ? profile.teamPreferences : ["balanced"],
    originalPreferredSpeciesIds: Array.isArray(profile.originalPreferredSpeciesIds) ? profile.originalPreferredSpeciesIds : [],
    preferredSpeciesIds: Array.isArray(profile.preferredSpeciesIds) ? profile.preferredSpeciesIds : [],
    diagnostics: {
      source: profile.diagnostics?.source || "unknown",
      representativeCount: Number(profile.diagnostics?.representativeCount || 0),
      expandedCount: Number(profile.diagnostics?.expandedCount || 0),
      expansionSources: Array.isArray(profile.diagnostics?.expansionSources) ? profile.diagnostics.expansionSources : [],
      inferredFrom: Array.isArray(profile.diagnostics?.inferredFrom) ? profile.diagnostics.inferredFrom : [],
      messages: Array.isArray(profile.diagnostics?.messages) ? profile.diagnostics.messages : [],
    },
  };
}

function firstTrainerDialogueLine(trainerId: string): string {
  const dialogues = normalizeTrainerDialogues(TrainerDialogues[trainerId]);
  const order = ["first_meeting", "default", "rematch", "after_player_win", "after_player_loss"];
  for (const state of order) {
    const line = dialogues[state]?.[0];
    const text = line?.intro?.[0] || line?.defeat?.[0] || line?.victory?.[0];
    if (text) return text;
  }
  return "";
}

function trainerDescription(summary: DexTrainerSummary): string {
  if (summary.isBoss) {
    const poolLabel = summary.teamPoolCount ? `${summary.teamPoolCount} 个固定队伍候选` : "固定队伍候选待补";
    const representativeLabel = summary.representativePokemon.length ? `代表宝可梦 ${summary.representativePokemon.slice(0, 3).map(entry => entry.speciesZh || entry.species).join(" / ")}` : "代表宝可梦待补";
    return `${summary.trainerTypeLabel} · ${poolLabel} · ${representativeLabel}`;
  }
  return [summary.region, summary.role || summary.trainerTypeLabel, summary.notes[0] || ""].filter(Boolean).join(" · ") || summary.trainerTypeLabel;
}

function trainerTags(summary: DexTrainerSummary): string[] {
  const tags = [
    summary.id,
    summary.name,
    summary.nameZh,
    summary.region,
    summary.role,
    summary.trainerType,
    summary.trainerTypeLabel,
    `type:${summary.trainerType}`,
    summary.isBoss ? "boss" : "",
    summary.trainerType === "villain" ? "event:special" : "",
    ...summary.notes,
    ...summary.teamPoolIds,
    ...summary.representativePokemon.flatMap(entry => [entry.speciesId, entry.species, entry.speciesZh]),
  ];
  return Array.from(new Set(tags.filter(Boolean)));
}

function includeSpecies(species: any): boolean {
  return species?.exists && Number(species.num || 0) > 0 && (!species.isNonstandard || species.isNonstandard === "Past" || species.isNonstandard === "Future");
}

function moveSummary(dex: ShowdownDexLike, move: any, sources: DexLearnSource[] = [], translate: (table: string, value: string) => string = defaultTranslate): DexMoveSummary {
  return {id: move.id, name: move.name, nameZh: translate("moves", move.name), typeId: move.type || "", categoryId: move.category || "", type: translate("types", move.type || ""), category: translate("categories", move.category || ""), power: Number(move.basePower || 0), accuracy: move.accuracy === true ? null : Number(move.accuracy || 0), pp: Number(move.pp || 0), priority: Number(move.priority || 0), target: move.target || "", flags: Object.keys(move.flags || {}), description: translatedDescription("moves", move.name, move.desc || move.shortDesc || ""), learnSources: sources};
}

function defaultTranslate(table: string, value: string): string {
  if (!value) return value;
  const key = normalizeTranslateTable(table);
  const section = (ZhCnOverrides as Record<string, Record<string, string>>)[key];
  return section?.[value] || value;
}

function translatedDescription(table: "moves" | "abilities" | "items", name: string, fallback: string): string {
  const section = (ZhCnDetails as Record<string, Record<string, {description?: string}>>)[table];
  return section?.[name]?.description || fallback;
}

function normalizeTranslateTable(table: string): string {
  if (table === "pokemon") return "species";
  return table;
}

function groupLearnset(moves: DexMoveSummary[]): Record<DexLearnSource, DexMoveSummary[]> {
  const groups = {
    levelup: [],
    machine: [],
    tutor: [],
    egg: [],
    event: [],
    transfer: [],
    other: [],
  } as Record<DexLearnSource, DexMoveSummary[]>;
  for (const move of moves) {
    const sources = move.learnSources?.length ? move.learnSources : ["other" as const];
    for (const source of sources) groups[source].push(move);
  }
  return groups;
}

function learnSources(codes: string[] = []): DexLearnSource[] {
  const result = new Set<DexLearnSource>();
  for (const code of codes) {
    const marker = String(code || "").replace(/^\d+/, "").charAt(0).toUpperCase();
    if (marker === "L") result.add("levelup");
    else if (marker === "M") result.add("machine");
    else if (marker === "T") result.add("tutor");
    else if (marker === "E") result.add("egg");
    else if (marker === "S") result.add("event");
    else if (marker === "V" || marker === "D") result.add("transfer");
    else result.add("other");
  }
  return Array.from(result);
}

function normalizeStats(stats: Partial<Record<DexStatId, number>>): Record<DexStatId, number> {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, Number(stats[stat] || 0)])) as Record<DexStatId, number>;
}

function rankRow(row: DexSearchRow, query: string): number | null {
  const needle = String(query || "").trim().toLowerCase();
  const needleId = toID(needle);
  if (!needle && !needleId) return 0;
  const parts = [row.id, row.name, row.nameZh, row.subtitle, row.description, ...row.tags].filter(Boolean).map(value => String(value).toLowerCase());
  const ids = parts.map(toID).filter(Boolean);
  if (parts.some(part => part === needle) || ids.some(id => id === needleId)) return 0;
  if (parts.some(part => part.startsWith(needle)) || (needleId && ids.some(id => id.startsWith(needleId)))) return 1;
  if (parts.some(part => part.includes(needle)) || (needleId && ids.some(id => id.includes(needleId)))) return 2;
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every(token => parts.some(part => part.includes(token)))) return 3;
  return null;
}

function categoryOrder(category: DexCategory): number {
  return {pokemon: 1, moves: 2, abilities: 3, items: 4, trainers: 5}[category];
}

function itemKind(item: any): DexItemKind {
  const id = toID(item?.id || item?.name);
  if (item?.isBerry || id.endsWith("berry")) return "berry";
  if (/revive|revivalherb|sacredash/.test(id)) return "revive";
  if (/ether|elixir|ppup|ppmax/.test(id)) return "pp";
  if (/potion|restore|heal|water|sodapop|lemonade|milk|herb|powder|root|antidote|awakening|burnheal|iceheal|paralyzeheal/.test(id)) return "recovery";
  if (/mint|abilitycapsule|abilitypatch|protein|iron|calcium|zinc|carbos|hpup/.test(id)) return "training";
  if (/ticket|pass|coupon|key|charm|flute|rod|bike|bicycle|coin|case/.test(id)) return "valuable";
  if (item?.megaStone || item?.zMove || item?.zMoveType || /iumz|ite$|itex$|itey$|max|tera/.test(id)) return "special";
  if (item?.fling || item?.onPlate || item?.onDrive || item?.onMemory || item?.onGem || item?.onTakeItem || item?.onStart || item?.onResidual || item?.onModifyAtk || item?.onModifySpA || item?.onModifySpe || item?.onModifyMove || item?.onBasePower) return "held";
  return "battle";
}

function grayBottleCapStyle(itemId: string, style?: string): string | undefined {
  if (toID(itemId) !== "graybottlecap") return style;
  return [style, "filter: grayscale(1) brightness(0.72) contrast(1.15)"].filter(Boolean).join("; ");
}

function natureMintIconAsset(nature: string): string {
  const id = toID(nature);
  const v1MintIconId = ["hardy", "docile", "bashful", "quirky"].includes(id) ? "seriousmint" : `${id}mint`;
  return `runtime/items/${v1MintIconId}/icon.png`;
}

function v1Item(
  id: string,
  name: string,
  nameZh: string,
  kind: DexItemKind,
  description: string,
  options: Partial<Omit<ItemRegistryEntry, "id" | "name" | "nameZh" | "kind" | "description">> = {},
): ItemRegistryEntry {
  const displayDescription = factoryItemDescription(nameZh, kind, description);
  return {
    id,
    name,
    nameZh,
    kind,
    source: options.source || "v1-game",
    description: displayDescription,
    effectSummary: options.effectSummary || description,
    recoveryEffect: options.recoveryEffect,
    trainingEffect: options.trainingEffect,
    iconAsset: options.iconAsset || `runtime/items/${id}/icon.png`,
    canBattleUse: options.canBattleUse ?? false,
    canUse: options.canUse ?? true,
    canUseToPokemon: options.canUseToPokemon ?? (kind !== "system" && kind !== "system-battle"),
    canTake: options.canTake ?? false,
    canSale: options.canSale ?? true,
    cost: options.cost ?? 500,
    futureInstanceCompatible: options.futureInstanceCompatible ?? true,
    tags: options.tags || [],
  };
}

function factoryItemDescription(nameZh: string, kind: DexItemKind, description: string): string {
  const text = description.trim();
  if (!text || text.includes("工厂")) return text || "暂无说明。";
  const action = text.replace(/。+$/, "");
  if (kind === "recovery" || kind === "revive" || kind === "pp") {
    return `工厂特供的 ${nameZh}，以成本价提供给所有训练师；使用后可以${action}。`;
  }
  if (kind === "training") {
    return `工厂训练部配发的 ${nameZh}，用于训练场休整；使用后可以${action}。`;
  }
  if (kind === "battle") {
    return `工厂战术部准备的 ${nameZh}，用于短时间调整战斗节奏；使用后可以${action}。`;
  }
  if (kind === "valuable" || kind === "system") {
    return `工厂登记在册的 ${nameZh}，属于重要功能道具；${action}。`;
  }
  return text;
}

function isTmItemId(id: string): boolean {
  return /^tm:/i.test(String(id || ""));
}

function normalizeTmItemId(moveIdOrTmId: string): string {
  const raw = String(moveIdOrTmId || "").trim();
  return isTmItemId(raw) ? `tm:${toID(raw.slice(3))}` : `tm:${toID(raw)}`;
}

function includeDataEntry(entry: any): boolean {
  return entry?.exists && (!entry.isNonstandard || entry.isNonstandard === "Past" || entry.isNonstandard === "Future");
}

function defaultTmCost(move: any): number {
  const power = Number(move?.basePower || 0);
  if (power >= 120) return 800;
  if (power > 90) return 650;
  if (power > 60) return 500;
  if (power > 30) return 400;
  return 300;
}

function assertExists(entry: any, label: string, id: string): void {
  if (!entry?.exists) throw new Error(`${label} not found: ${id}`);
}

function calculatePokemonStat(species: any, stat: DexStatId, level: number, ivInput: number, evInput: number, natureData: any): number {
  const base = Number(species.baseStats?.[stat] || 0);
  const iv = clamp(ivInput, 0, 31);
  const ev = clamp(evInput, 0, 255);
  if (stat === "hp") return species.id === "shedinja" ? 1 : Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  const neutral = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const modifier = natureData.plus === stat ? 1.1 : natureData.minus === stat ? 0.9 : 1;
  return Math.floor(neutral * modifier);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeResourcePrefix(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
