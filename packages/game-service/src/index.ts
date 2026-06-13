import type {
  BattleAiHint,
  BattleAiHintAlternative,
  BattleRequestView,
  BattleSetting,
  BattleSystemId,
  BattleMoveRequest,
  BattleState,
  BattleTimelineEvent,
  BattleTurnAction,
  BattleTurnEndState,
  BattleTurnPokemonState,
  BattleTurnRecord,
  BattleTracker,
  DesktopDexCategory,
  DesktopDexEntry,
  DesktopDexSearchResult,
  GeneratedTeam,
  MoveLearnSource,
  MoveSummary,
  PokemonEditOptions,
  PokemonSet,
  PricedMove,
  RentalPokemon,
  RuntimePokemon,
  PlayerPokemonState,
  ShopItem,
  SpriteIndexMap,
  SpriteMapEntry,
  StatId,
} from "@changebattle/shared";
import {BATTLE_RULE_PRESET_OPTIONS, DEFAULT_BATTLE_SETTING, REST_SHOP_DISCOUNT_COUPONS, SHOWDOWN_ID_POOL, normalizeBattleSetting} from "@changebattle/shared";

const MIN_RENTAL_LEVEL = 45;
const MAX_RENTAL_LEVEL = 55;
const SHINY_RATE = 30;
const RENTAL_CANDIDATE_COUNT = 6;
const MAX_GENERATION_ATTEMPTS = 40;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const SIDE_NAMES = {p1: "玩家", p2: "对手"} as const;
const STANDARD_TERA_TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
const TRAINING_ABILITY_EFFECT_ITEM_IDS = ["abilitycapsule", "abilitypatch"] as const;
const TRAINING_MINT_EFFECT_ITEM_IDS = [
  "lonelymint", "adamantmint", "naughtymint", "bravemint",
  "boldmint", "impishmint", "laxmint", "relaxedmint",
  "modestmint", "mildmint", "rashmint", "quietmint",
  "calmmint", "gentlemint", "carefulmint", "sassymint",
  "timidmint", "hastymint", "jollymint", "naivemint",
  "seriousmint",
] as const;
const TRAINING_SPECIAL_EFFECT_ITEM_IDS = new Set<string>([...TRAINING_ABILITY_EFFECT_ITEM_IDS, ...TRAINING_MINT_EFFECT_ITEM_IDS]);
const MINT_NATURE_BY_ITEM_ID: Record<string, string> = Object.fromEntries(TRAINING_MINT_EFFECT_ITEM_IDS.map(id => [id, id.replace(/mint$/, "")]));
const PIKASHUNIUM_ALLOWED_PIKACHU_IDS = new Set(["pikachuoriginal", "pikachuhoenn", "pikachusinnoh", "pikachuunova", "pikachukalos", "pikachualola", "pikachupartner"]);
const PIKASHUNIUM_FALLBACK_PIKACHU_FORM = "Pikachu-Original";
const MOVE_LEARN_SOURCE_ORDER: MoveLearnSource[] = ["levelup", "machine", "tutor", "egg", "event", "transfer", "other"];
const MOVE_LEARN_SOURCE_LABELS: Record<MoveLearnSource, string> = {
  levelup: "自学",
  machine: "技能机器",
  tutor: "教授",
  egg: "遗传",
  event: "特殊",
  transfer: "转移",
  other: "其他",
};
const FALLBACK_HELD_ITEMS = ["Leftovers", "Sitrus Berry", "Life Orb", "Choice Scarf", "Choice Band", "Choice Specs", "Assault Vest", "Focus Sash", "Expert Belt"];
const ITEM_ICON_FALLBACK = "assets/placeholders/item.png";
const LOCAL_DEX_ITEMS = [
  ...Object.entries(REST_SHOP_DISCOUNT_COUPONS).map(([id, item]) => ({id, name: item.name, name_zh: item.name_zh, desc: item.desc, desc_zh: item.desc_zh, icon_asset: item.icon_asset})),
  {id: "potion", name: "Potion", name_zh: "回复药", desc: "Restores 20 HP.", desc_zh: "恢复 20 点 HP。"},
  {id: "freshwater", name: "Fresh Water", name_zh: "美味之水", desc: "Restores 30 HP.", desc_zh: "恢复 30 点 HP。"},
  {id: "sodapop", name: "Soda Pop", name_zh: "劲爽汽水", desc: "Restores 50 HP.", desc_zh: "恢复 50 点 HP。"},
  {id: "superpotion", name: "Super Potion", name_zh: "好伤药", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  {id: "lemonade", name: "Lemonade", name_zh: "果汁牛奶", desc: "Restores 70 HP.", desc_zh: "恢复 70 点 HP。"},
  {id: "moomoomilk", name: "Moomoo Milk", name_zh: "哞哞鲜奶", desc: "Restores 100 HP.", desc_zh: "恢复 100 点 HP。"},
  {id: "hyperpotion", name: "Hyper Potion", name_zh: "绝好伤药", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  {id: "maxpotion", name: "Max Potion", name_zh: "全满药", desc: "Fully restores HP.", desc_zh: "恢复全部 HP。"},
  {id: "fullrestore", name: "Full Restore", name_zh: "全复药", desc: "Fully restores HP and cures status.", desc_zh: "恢复全部 HP，并解除异常状态。"},
  {id: "revive", name: "Revive", name_zh: "活力碎片", desc: "Revives a fainted Pokemon with half HP.", desc_zh: "让濒死宝可梦复活，并恢复一半 HP。"},
  {id: "maxrevive", name: "Max Revive", name_zh: "活力块", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
  {id: "revivalherb", name: "Revival Herb", name_zh: "复活草", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
  {id: "energypowder", name: "Energy Powder", name_zh: "元气粉", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  {id: "energyroot", name: "Energy Root", name_zh: "元气根", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  {id: "fullheal", name: "Full Heal", name_zh: "万灵药", desc: "Cures status conditions.", desc_zh: "解除异常状态。"},
  {id: "healpowder", name: "Heal Powder", name_zh: "万能粉", desc: "Cures status conditions.", desc_zh: "解除异常状态。"},
  {id: "antidote", name: "Antidote", name_zh: "解毒药", desc: "Cures poisoning.", desc_zh: "解除中毒状态。"},
  {id: "burnheal", name: "Burn Heal", name_zh: "灼伤药", desc: "Cures a burn.", desc_zh: "解除灼伤状态。"},
  {id: "iceheal", name: "Ice Heal", name_zh: "解冻药", desc: "Cures freezing.", desc_zh: "解除冰冻状态。"},
  {id: "awakening", name: "Awakening", name_zh: "解眠药", desc: "Cures sleep.", desc_zh: "解除睡眠状态。"},
  {id: "paralyzeheal", name: "Paralyze Heal", name_zh: "解麻药", desc: "Cures paralysis.", desc_zh: "解除麻痹状态。"},
  {id: "ether", name: "Ether", name_zh: "PP 单项小补剂", desc: "Restores 10 PP to one move.", desc_zh: "让 1 个招式恢复 10 点 PP。"},
  {id: "maxether", name: "Max Ether", name_zh: "PP 单项全补剂", desc: "Fully restores PP to one move.", desc_zh: "让 1 个招式恢复全部 PP。"},
  {id: "elixir", name: "Elixir", name_zh: "PP 多项小补剂", desc: "Restores 10 PP to all moves.", desc_zh: "让所有招式恢复 10 点 PP。"},
  {id: "maxelixir", name: "Max Elixir", name_zh: "PP 多项全补剂", desc: "Fully restores PP to all moves.", desc_zh: "让所有招式恢复全部 PP。"},
  {id: "abilitycapsule", name: "Ability Capsule", name_zh: "特性胶囊", desc: "Changes to another regular ability.", desc_zh: "将宝可梦的特性切换为另一个普通特性。"},
  {id: "abilitypatch", name: "Ability Patch", name_zh: "特性膏药", desc: "Changes to the hidden ability.", desc_zh: "将宝可梦的特性切换为隐藏特性。"},
  {id: "lonelymint", name: "Lonely Mint", name_zh: "怕寂寞薄荷", desc: "Changes nature to Lonely.", desc_zh: "将宝可梦的性格调整为怕寂寞。"},
  {id: "adamantmint", name: "Adamant Mint", name_zh: "固执薄荷", desc: "Changes nature to Adamant.", desc_zh: "将宝可梦的性格调整为固执。"},
  {id: "naughtymint", name: "Naughty Mint", name_zh: "顽皮薄荷", desc: "Changes nature to Naughty.", desc_zh: "将宝可梦的性格调整为顽皮。"},
  {id: "bravemint", name: "Brave Mint", name_zh: "勇敢薄荷", desc: "Changes nature to Brave.", desc_zh: "将宝可梦的性格调整为勇敢。"},
  {id: "boldmint", name: "Bold Mint", name_zh: "大胆薄荷", desc: "Changes nature to Bold.", desc_zh: "将宝可梦的性格调整为大胆。"},
  {id: "impishmint", name: "Impish Mint", name_zh: "淘气薄荷", desc: "Changes nature to Impish.", desc_zh: "将宝可梦的性格调整为淘气。"},
  {id: "laxmint", name: "Lax Mint", name_zh: "乐天薄荷", desc: "Changes nature to Lax.", desc_zh: "将宝可梦的性格调整为乐天。"},
  {id: "relaxedmint", name: "Relaxed Mint", name_zh: "悠闲薄荷", desc: "Changes nature to Relaxed.", desc_zh: "将宝可梦的性格调整为悠闲。"},
  {id: "modestmint", name: "Modest Mint", name_zh: "内敛薄荷", desc: "Changes nature to Modest.", desc_zh: "将宝可梦的性格调整为内敛。"},
  {id: "mildmint", name: "Mild Mint", name_zh: "慢吞吞薄荷", desc: "Changes nature to Mild.", desc_zh: "将宝可梦的性格调整为慢吞吞。"},
  {id: "rashmint", name: "Rash Mint", name_zh: "马虎薄荷", desc: "Changes nature to Rash.", desc_zh: "将宝可梦的性格调整为马虎。"},
  {id: "quietmint", name: "Quiet Mint", name_zh: "冷静薄荷", desc: "Changes nature to Quiet.", desc_zh: "将宝可梦的性格调整为冷静。"},
  {id: "calmmint", name: "Calm Mint", name_zh: "温和薄荷", desc: "Changes nature to Calm.", desc_zh: "将宝可梦的性格调整为温和。"},
  {id: "gentlemint", name: "Gentle Mint", name_zh: "温顺薄荷", desc: "Changes nature to Gentle.", desc_zh: "将宝可梦的性格调整为温顺。"},
  {id: "carefulmint", name: "Careful Mint", name_zh: "慎重薄荷", desc: "Changes nature to Careful.", desc_zh: "将宝可梦的性格调整为慎重。"},
  {id: "sassymint", name: "Sassy Mint", name_zh: "自大薄荷", desc: "Changes nature to Sassy.", desc_zh: "将宝可梦的性格调整为自大。"},
  {id: "timidmint", name: "Timid Mint", name_zh: "胆小薄荷", desc: "Changes nature to Timid.", desc_zh: "将宝可梦的性格调整为胆小。"},
  {id: "hastymint", name: "Hasty Mint", name_zh: "急躁薄荷", desc: "Changes nature to Hasty.", desc_zh: "将宝可梦的性格调整为急躁。"},
  {id: "jollymint", name: "Jolly Mint", name_zh: "爽朗薄荷", desc: "Changes nature to Jolly.", desc_zh: "将宝可梦的性格调整为爽朗。"},
  {id: "naivemint", name: "Naive Mint", name_zh: "天真薄荷", desc: "Changes nature to Naive.", desc_zh: "将宝可梦的性格调整为天真。"},
  {id: "seriousmint", name: "Serious Mint", name_zh: "认真薄荷", desc: "Changes nature to Serious.", desc_zh: "将宝可梦的性格调整为认真。"},
].map((item, index) => ({...item, sort_order: index + 1}));
const ITEM_ICON_ALIASES: Record<string, string> = {
  berry: "oranberry",
  berserkgene: "mentalherb",
  bitterberry: "persimberry",
  burntberry: "aspearberry",
  goldberry: "sitrusberry",
  iceberry: "aspearberry",
  mail: "airmail",
  mintberry: "chestoberry",
  miracleberry: "lumberry",
  mysteryberry: "leppaberry",
  pinkbow: "silkscarf",
  polkadotbow: "silkscarf",
  przcureberry: "cheriberry",
  psncureberry: "pechaberry",
};
const Z_CRYSTAL_TYPE_BY_ID: Record<string, string> = {
  aloraichiumz: "electric",
  buginiumz: "bug",
  darkiniumz: "dark",
  decidiumz: "ghost",
  dragoniumz: "dragon",
  eeviumz: "normal",
  electriumz: "electric",
  fairiumz: "fairy",
  fightiniumz: "fighting",
  firiumz: "fire",
  flyiniumz: "flying",
  ghostiumz: "ghost",
  grassiumz: "grass",
  groundiumz: "ground",
  iciumz: "ice",
  inciniumz: "dark",
  kommoniumz: "dragon",
  lunaliumz: "ghost",
  lycaniumz: "rock",
  marshadiumz: "ghost",
  mewniumz: "psychic",
  mimikiumz: "fairy",
  normaliumz: "normal",
  pikaniumz: "electric",
  pikashuniumz: "electric",
  poisoniumz: "poison",
  primariumz: "water",
  psychiumz: "psychic",
  rockiumz: "rock",
  snorliumz: "normal",
  solganiumz: "steel",
  steeliumz: "steel",
  tapuniumz: "fairy",
  ultranecroziumz: "psychic",
  wateriumz: "water",
};
const MEGA_STONE_ID_EXCEPTIONS = new Set(["eviolite"]);
const SHOWDOWN_ID_SET = new Set<string>(SHOWDOWN_ID_POOL);

function runtimeEnv(name: string): string | undefined {
  return (globalThis as {process?: {env?: Record<string, string | undefined>}}).process?.env?.[name];
}

function battleLogLine(scope: string, message: string, data?: unknown): void {
  if (runtimeEnv("CHANGEBATTLE_DEBUG_DETAIL_LOG") !== "1") return;
  try {
    console.debug("[changebattle]", JSON.stringify({ts: new Date().toISOString(), scope, event: message, data}, (_key, value) => value instanceof Error ? {name: value.name, message: value.message, stack: value.stack} : value));
  } catch {
    // Diagnostics must not affect battle simulation.
  }
}

function battleTurnLogLine(entry: BattleTurnLogEntry): void {
  if (runtimeEnv("CHANGEBATTLE_DEBUG_DETAIL_LOG") !== "1") return;
  try {
    console.debug("[changebattle:battle]", entry);
  } catch {
    // Diagnostics must not affect battle simulation.
  }
}

type ShowdownModule = {
  Dex: any;
  Teams: any;
  BattleStream: any;
};

type TranslationData = Record<string, Record<string, string>>;
type DetailData = Record<string, Record<string, any>>;
type SideId = "p1" | "p2";
type SideMap = {player: SideId; enemy: SideId};
type Message = {type: string; data: string};
type LogMessage = Message & {lines: string[]};
type ParsedTimelineEvent = Omit<BattleTimelineEvent, "id">;
type RequestDiffLog = {
  kind: "heal";
  side: SideId;
  ident: string;
  showdown_id?: string;
  before: string;
  after: string;
  source: "request-diff";
  ability?: string;
  injected: boolean;
  skipped_reason?: string;
};
type BattleTurnLogEntry = {
  id: string;
  create: string;
  name: string;
  showdownDATA: LogMessage[];
  reduceData: {
    before_turn: number;
    after_turn: number;
    protocol_lines: string[];
    request_diffs: RequestDiffLog[];
    events: string[];
    timeline: BattleTimelineEvent[];
    tracker: BattleTracker;
  };
};
type SlotKeySpec = {slot: number; keys: Set<string>};
type GenerationProfile = "tier1" | "tier2" | "tier3" | "tier4" | "champion";
type StageTier = 1 | 2 | 3 | 4 | 5 | 6;
type SpeciesTier = StageTier | 10;
type TierRow = {species_id: string; species: string; tier: SpeciesTier; override_tier?: string; notes?: string};
type SpeciesTierRule = {tier: SpeciesTier; weight: number; preferNonNfe?: boolean};
type SpeciesPick = {speciesId: string; speciesTier: SpeciesTier};
export type BattleAiKnowledge = "active_only" | "party_species" | "party_sets" | "omniscient";
export type BattleAiPersonality = "balanced" | "aggressive" | "defensive" | "status" | "setup" | "adaptive" | "rookie" | "soul_sick";
export type BattleAiProfile = {
  level: "normal" | "gym_low" | "gym_high" | "elite4" | "champion";
  knowledge: BattleAiKnowledge;
  personality: BattleAiPersonality;
  depth: 0 | 1 | 2 | 3;
  randomness: number;
  allowSwitch: boolean;
  prediction: number;
  statusAwareness: number;
  setupAwareness: number;
  switchAwareness: number;
  candidateMoves: number;
  candidateSwitches: number;
  opponentCandidates: number;
  timeBudgetMs: number;
};
export type BattleAiProfileInput = BattleAiProfile["level"] | Partial<BattleAiProfile>;
type PlannedEnemyChoice = {key: string; choice?: string; promise: Promise<string>; startedAt: number};
type AiActionKind = "move" | "switch";
type AiCandidate = {side: SideId; kind: AiActionKind; choice: string; score: number; move?: any; moveRequest?: BattleMoveRequest; moveSlot?: number; battleSystem?: "mega" | "zmove" | "max" | "terastallize"; switchSlot?: number; pokemon?: RentalPokemon};
type AiPokemonState = {display: RentalPokemon; hp: number; maxHp: number; slot: number; active?: boolean};
type AiSearchState = {p1: AiPokemonState[]; p2: AiPokemonState[]; active: Record<SideId, number>};
type BattleAiPersonalityWeights = {damage: number; ko: number; status: number; setup: number; switch: number; defense: number; riskPenalty: number};
type ConsumableItemEffect = {
  id: string;
  hp: string;
  revive: "" | "half" | "full";
  pp: string;
  pp_scope: "" | "one" | "all";
  status: string;
  stat_kind: "" | "iv" | "ev";
  stat?: StatId;
  amount: number;
  scope: "" | "one" | "all";
  battle_usable: boolean;
  notes?: string;
};

export type TrainingItemEffect = {
  stat_kind: "iv" | "ev" | "ability" | "nature";
  stat?: StatId;
  amount: number;
  scope: "one" | "all";
  nature?: string;
};

export type GenerateRentalOptions = {
  profiles?: GenerationProfile[];
  stages?: StageTier[];
  speciesTiers?: SpeciesTier[];
  speciesIds?: string[];
  purpose?: "starter" | "normal" | "boss" | "rescue";
  battleSetting?: BattleSetting;
  speciesUsageCounts?: Record<string, number>;
};

export type GameServiceOptions = {
  projectRoot: string;
  showdownPath?: string;
  showdownModule?: ShowdownModule;
  showdownLoader?: () => ShowdownModule;
  randomUUID?: () => string;
  dataProvider?: {
    readText(relativePath: string): Promise<string>;
    readTextSync?(relativePath: string): string | null | undefined;
    exists?(relativePath: string): boolean | Promise<boolean>;
    existsSync?(relativePath: string): boolean;
  };
  assetExistsSync?: (relativePath: string) => boolean;
};

export type StartBattleOptions = {
  playerTeam: PokemonSet[];
  enemyTeam: PokemonSet[];
  playerDisplay: RentalPokemon[];
  enemyDisplay: RentalPokemon[];
  playerState?: PlayerPokemonState[];
  seed: number | number[];
  battleSetting?: BattleSetting;
  enemyAi?: BattleAiProfileInput;
};

const BATTLE_AI_PRESETS: Record<BattleAiProfile["level"], BattleAiProfile> = {
  normal: {
    level: "normal",
    knowledge: "party_species",
    personality: "balanced",
    depth: 0,
    randomness: 0.28,
    allowSwitch: true,
    prediction: 0.15,
    statusAwareness: 0.35,
    setupAwareness: 0.2,
    switchAwareness: 0.25,
    candidateMoves: 2,
    candidateSwitches: 1,
    opponentCandidates: 1,
    timeBudgetMs: 25,
  },
  gym_low: {
    level: "gym_low",
    knowledge: "party_species",
    personality: "balanced",
    depth: 1,
    randomness: 0.18,
    allowSwitch: true,
    prediction: 0.45,
    statusAwareness: 0.55,
    setupAwareness: 0.4,
    switchAwareness: 0.45,
    candidateMoves: 3,
    candidateSwitches: 1,
    opponentCandidates: 2,
    timeBudgetMs: 120,
  },
  gym_high: {
    level: "gym_high",
    knowledge: "party_sets",
    personality: "balanced",
    depth: 2,
    randomness: 0.12,
    allowSwitch: true,
    prediction: 0.65,
    statusAwareness: 0.72,
    setupAwareness: 0.58,
    switchAwareness: 0.68,
    candidateMoves: 3,
    candidateSwitches: 2,
    opponentCandidates: 3,
    timeBudgetMs: 280,
  },
  elite4: {
    level: "elite4",
    knowledge: "party_sets",
    personality: "balanced",
    depth: 2,
    randomness: 0.08,
    allowSwitch: true,
    prediction: 0.78,
    statusAwareness: 0.85,
    setupAwareness: 0.72,
    switchAwareness: 0.82,
    candidateMoves: 4,
    candidateSwitches: 2,
    opponentCandidates: 3,
    timeBudgetMs: 450,
  },
  champion: {
    level: "champion",
    knowledge: "omniscient",
    personality: "balanced",
    depth: 3,
    randomness: 0.05,
    allowSwitch: true,
    prediction: 0.9,
    statusAwareness: 0.95,
    setupAwareness: 0.88,
    switchAwareness: 0.9,
    candidateMoves: 4,
    candidateSwitches: 2,
    opponentCandidates: 4,
    timeBudgetMs: 900,
  },
};

const BATTLE_AI_PERSONALITY_WEIGHTS: Record<BattleAiPersonality, BattleAiPersonalityWeights> = {
  balanced: {damage: 1, ko: 1, status: 1, setup: 1, switch: 1, defense: 1, riskPenalty: 1},
  aggressive: {damage: 1.16, ko: 1.22, status: 0.86, setup: 1.04, switch: 0.82, defense: 0.86, riskPenalty: 0.72},
  defensive: {damage: 0.92, ko: 1.02, status: 1.04, setup: 0.94, switch: 1.22, defense: 1.24, riskPenalty: 1.18},
  status: {damage: 0.9, ko: 0.95, status: 1.32, setup: 0.96, switch: 1.08, defense: 1.12, riskPenalty: 1.05},
  setup: {damage: 0.98, ko: 1.06, status: 0.92, setup: 1.34, switch: 0.95, defense: 0.95, riskPenalty: 1},
  adaptive: {damage: 1.04, ko: 1.08, status: 1.08, setup: 1.08, switch: 1.1, defense: 1.08, riskPenalty: 0.95},
  rookie: {damage: 0.86, ko: 0.35, status: 0.48, setup: 0.38, switch: 0.3, defense: 0.68, riskPenalty: 0.75},
  soul_sick: {damage: 0.18, ko: 0.1, status: 0.4, setup: 0.25, switch: 0, defense: 0.35, riskPenalty: 0.2},
};

function battleAiProfile(input?: BattleAiProfileInput): BattleAiProfile {
  const base = typeof input === "string" ? BATTLE_AI_PRESETS[input] : BATTLE_AI_PRESETS[input?.level || "normal"];
  const merged = {...base, ...(typeof input === "object" ? input : {})};
  const personality = BATTLE_AI_PERSONALITY_WEIGHTS[merged.personality as BattleAiPersonality] ? merged.personality : "balanced";
  if (personality === "soul_sick") {
    merged.depth = 0;
    merged.allowSwitch = false;
    merged.switchAwareness = 0;
    merged.candidateSwitches = 0;
    merged.prediction = 0;
    merged.statusAwareness = Math.min(Number(merged.statusAwareness || 0), 0.25);
    merged.setupAwareness = Math.min(Number(merged.setupAwareness || 0), 0.2);
  }
  return {
    ...merged,
    personality,
    randomness: clampNumber(merged.randomness, 0, 1),
    prediction: clampNumber(merged.prediction, 0, 1),
    statusAwareness: clampNumber(merged.statusAwareness, 0, 1),
    setupAwareness: clampNumber(merged.setupAwareness, 0, 1),
    switchAwareness: clampNumber(merged.switchAwareness, 0, 1),
    candidateMoves: Math.max(1, Math.min(4, Math.floor(Number(merged.candidateMoves) || base.candidateMoves))),
    candidateSwitches: Math.max(0, Math.min(2, Math.floor(Number(merged.candidateSwitches) || base.candidateSwitches))),
    opponentCandidates: Math.max(1, Math.min(4, Math.floor(Number(merged.opponentCandidates) || base.opponentCandidates))),
    timeBudgetMs: Math.max(1, Math.min(1500, Number(merged.timeBudgetMs) || base.timeBudgetMs)),
  };
}

function clampNumber(value: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function createBattleSeedRng(seed: number | number[]): () => number {
  const seedValue = Array.isArray(seed) ? seed.reduce((acc, value) => acc ^ Number(value), 0) : Number(seed);
  let state = (Number.isFinite(seedValue) ? seedValue : 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function enemyPreviewOrder(enemyDisplay: RentalPokemon[], playerLead: RentalPokemon | undefined, random: () => number, dex: any): number[] {
  const indexes = Array.from({length: enemyDisplay.length}, (_value, index) => index);
  if (!indexes.length) return [];
  const scored = indexes.map(index => {
    const display = enemyDisplay[index];
    const pressure = display && playerLead ? previewBestMovePressure(display, playerLead, dex) : 0;
    return {index, score: pressure + random() * 8};
  }).sort((a, b) => b.score - a.score);
  const ordered = scored.map(entry => entry.index);
  for (const index of indexes) if (!ordered.includes(index)) ordered.push(index);
  return ordered;
}

function previewBestMovePressure(attacker: RentalPokemon, target: RentalPokemon, dex: any): number {
  const moves = attacker.moves || [];
  if (!moves.length) return 0;
  return Math.max(...moves.map(move => {
    const dexMove = dex.moves.get(move.id || move.name);
    return dexMove?.exists ? previewEstimatedMoveDamage(dexMove, attacker, target, dex) : 0;
  }));
}

function previewEstimatedMoveDamage(move: any, attacker: RentalPokemon | undefined, target: RentalPokemon | undefined, dex: any): number {
  if (!attacker || !target) return Number(move.basePower || move.damage || 35);
  if (!previewCanHit(move.type, target, dex)) return 0;
  const power = Number(move.basePower || move.damage || 50);
  const level = Number(attacker.level || 50);
  const category = move.category === "Special" ? "Special" : "Physical";
  const offensiveStat = category === "Special" ? "spa" : "atk";
  const defensiveStat = category === "Special" ? "spd" : "def";
  const attack = Math.max(1, Number(attacker.stats?.[offensiveStat] || attacker.base_stats?.[offensiveStat] || 70));
  const defense = Math.max(1, Number(target.stats?.[defensiveStat] || target.base_stats?.[defensiveStat] || 70));
  const stab = attacker.types?.includes(move.type) ? 1.5 : 1;
  const type = previewTypeMultiplier(move.type, target, dex);
  return (((2 * level / 5 + 2) * power * attack / defense) / 50 + 2) * stab * type;
}

function previewTypeMultiplier(moveType: string, target: RentalPokemon | undefined, dex: any): number {
  if (!moveType || !target) return 1;
  const species = dex.species.get(target.species_id || target.species || target.name);
  const typeTarget = species?.exists ? species : {types: target.types || []};
  if (!dex.getImmunity(moveType, typeTarget)) return 0;
  return 2 ** dex.getEffectiveness(moveType, typeTarget);
}

function previewCanHit(moveType: string, target: RentalPokemon | undefined, dex: any): boolean {
  return previewTypeMultiplier(moveType, target, dex) > 0;
}

export class GameService {
  readonly projectRoot: string;
  private readonly showdownLoader?: NonNullable<GameServiceOptions["showdownLoader"]>;
  private readonly uuidProvider?: NonNullable<GameServiceOptions["randomUUID"]>;
  private readonly dataProvider?: NonNullable<GameServiceOptions["dataProvider"]>;
  private readonly assetExistsSync?: NonNullable<GameServiceOptions["assetExistsSync"]>;
  private sim: ShowdownModule | null = null;
  private spriteMap: SpriteIndexMap | null = null;
  private itemResourceRegistry: {entries?: Record<string, {icon?: string; fallback_icon?: string}>} | null = null;
  private translations: TranslationData | null = null;
  private translationNormalized: TranslationData | null = null;
  private details: DetailData | null = null;
  private detailsNormalized: DetailData | null = null;
  private tierRows: TierRow[] | null = null;
  private consumableEffects: Map<string, ConsumableItemEffect> | null = null;

  constructor(options: GameServiceOptions) {
    this.projectRoot = options.projectRoot;
    void options.showdownPath;
    this.showdownLoader = options.showdownLoader;
    this.uuidProvider = options.randomUUID;
    this.dataProvider = options.dataProvider;
    this.assetExistsSync = options.assetExistsSync;
    this.sim = options.showdownModule || null;
  }

  async generateRentalCandidates(seed: number | number[] = Date.now(), format: string | GenerateRentalOptions = "gen9randombattle", count = RENTAL_CANDIDATE_COUNT, options: GenerateRentalOptions = {}): Promise<GeneratedTeam> {
    if (typeof format === "object") {
      options = format;
      format = "gen9randombattle";
      count = options.profiles?.length || options.stages?.length || options.speciesTiers?.length || options.speciesIds?.length || count;
    }
    const sim = this.loadShowdown();
    const seedArray = this.seedArray(seed);
    await this.loadDisplayData();
    if (options.profiles?.length || options.stages?.length || options.speciesTiers?.length || options.speciesIds?.length || options.battleSetting) {
      return this.generateProfiledCandidates(seedArray, format, count, options);
    }
    const team: PokemonSet[] = [];
    const display: RentalPokemon[] = [];
    const seenSpecies = new Set<string>();

    const targetCount = Math.max(1, Math.min(24, Number(count || RENTAL_CANDIDATE_COUNT)));
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS && team.length < targetCount; attempt += 1) {
      const attemptSeed = this.bumpSeed(seedArray, attempt);
      const generated = this.normalizeTeam(sim.Teams.generate(format, {seed: attemptSeed}));
      const rng = this.createRngFromSeed(attemptSeed, attempt + 1);
      for (const baseSet of generated) {
        if (team.length >= targetCount) break;
        const set = this.normalizeSetGender(this.sanitizeSetForBattleSetting(this.randomizeRentalSet(baseSet, rng), options), rng);
        const described = this.describeSet(set);
        if (seenSpecies.has(described.species_id)) continue;
        if (!this.hasUsableSprite(described)) continue;
        seenSpecies.add(described.species_id);
        team.push(set);
        display.push(described);
      }
    }

    if (team.length < targetCount) {
      throw new Error(`可用图片的租赁候选不足：${team.length}/${targetCount}`);
    }

    const guaranteeRng = this.createRngFromSeed(seedArray, 0x7a50);
    this.normalizePikachuFormsForZMoves(team, options);
    this.ensureSignatureMoves(team);
    this.ensureZMoveUser(team, options, guaranteeRng);
    this.ensureMegaUser(team, options, guaranteeRng);
    this.ensureDynamaxUsers(team, options);
    this.ensureTerastalTypes(team, options, guaranteeRng);
    display.splice(0, display.length, ...team.map(set => this.describeSet(set)));
    return {seed: seedArray, team, display, packed: sim.Teams.pack(team)};
  }

  async describeTeam(team: PokemonSet[]): Promise<RentalPokemon[]> {
    await this.loadDisplayData();
    return this.normalizeTeam(team).map(set => this.describeSet(set));
  }

  normalizeBattleTeam(team: PokemonSet[]): PokemonSet[] {
    return this.normalizeTeam(team);
  }

  speciesDisplay(rawSpecies: string): {species_id: string; name: string; name_zh: string; sprite?: SpriteMapEntry; types: string[]; types_zh: string[]; base_stats: Record<string, number>; ability: string; ability_zh: string; ability_id: string; ability_desc: string; ability_desc_zh: string; gender: string; heightm?: number; weightkg?: number} {
    const species = this.dataDex().species.get(rawSpecies);
    const speciesId = species.id || this.toId(rawSpecies);
    const name = species.name || rawSpecies;
    const types: string[] = species.types || [];
    const ability = String(species.abilities?.["0"] || "");
    return {
      species_id: speciesId,
      name,
      name_zh: this.zh("species", name),
      sprite: this.spriteMap?.entries[speciesId],
      types,
      types_zh: types.map(type => this.zh("types", type) || type),
      base_stats: species.baseStats || {},
      ability,
      ability_zh: ability ? this.zh("abilities", ability) : "",
      ability_id: this.toId(ability),
      ability_desc: ability ? (this.dataDex().abilities.get(ability)?.desc || this.dataDex().abilities.get(ability)?.shortDesc || "") : "",
      ability_desc_zh: ability ? this.abilityDescription(ability) : "",
      gender: this.fixedSpeciesGender(species),
      heightm: Number(species.heightm || 0) || undefined,
      weightkg: Number(species.weightkg || 0) || undefined,
    };
  }

  private itemIconAsset(itemId: string | undefined, item?: {name?: string; desc?: string; shortDesc?: string}): string {
    const rawItemId = String(itemId || item?.name || "");
    const normalized = this.toId(rawItemId);
    if (!normalized) return ITEM_ICON_FALLBACK;
    const registryIcon = this.itemResourceRegistry?.entries?.[normalized]?.icon;
    if (registryIcon && this.projectAssetExists(registryIcon)) return registryIcon;
    const direct = this.resolveItemIconAsset(normalized);
    if (direct) return direct;
    const alias = ITEM_ICON_ALIASES[normalized];
    if (alias) {
      const aliasAsset = this.resolveItemIconAsset(alias);
      if (aliasAsset) return aliasAsset;
    }
    const zType = Z_CRYSTAL_TYPE_BY_ID[normalized] || this.zCrystalType(item);
    if (zType) {
      const zAsset = this.resolveItemIconAsset(`${zType}gem`) || this.resolveItemIconAsset(`${zType}memory`);
      if (zAsset) return zAsset;
    }
    const machineType = this.machineTypeForItem(rawItemId, normalized, item);
    if (machineType) {
      const prefix = normalized.startsWith("tr") ? "machinetr" : "machine";
      const machineAsset = this.resolveItemIconAsset(`${prefix}${machineType}`) || this.resolveItemIconAsset(`machine${machineType}`);
      if (machineAsset) return machineAsset;
    }
    return ITEM_ICON_FALLBACK;
  }

  private resolveItemIconAsset(assetId: string): string | null {
    const normalized = this.toId(assetId);
    if (!normalized) return null;
    const runtimePath = `assets/runtime/items/${normalized}/icon.png`;
    return this.projectAssetExists(runtimePath) ? runtimePath : null;
  }

  private zCrystalType(item?: {desc?: string; shortDesc?: string}): string {
    const text = String(item?.desc || item?.shortDesc || "").toLowerCase();
    const match = text.match(/has an? ([a-z]+) move/) || text.match(/holder's ([a-z]+)-type/);
    return match ? this.toId(match[1]) : "";
  }

  private machineTypeForItem(rawItemId: string, itemId: string, item?: {desc?: string; shortDesc?: string}): string {
    const tmMoveId = rawItemId.match(/^tm:(.+)$/i)?.[1];
    if (tmMoveId) {
      const move = this.dataDex().moves.get(tmMoveId);
      return move?.exists ? this.toId(move.type) : "";
    }
    if (!/^(?:tr|tm)\d+$/i.test(itemId)) return "";
    const text = String(item?.desc || item?.shortDesc || "");
    const moveName = text.match(/move ([^.]+)\./i)?.[1];
    if (!moveName) return "";
    const move = this.dataDex().moves.get(moveName);
    return move?.exists ? this.toId(move.type) : "";
  }

  private itemDescriptionZh(item: any): string {
    return this.detailDescription("items", item.name) || this.generatedItemDescription(item);
  }

  private generatedItemDescription(item: any): string {
    const id = this.toId(item?.id || item?.name || "");
    const desc = String(item?.desc || item?.shortDesc || "");
    const moveName = desc.match(/move ([^.]+)\./i)?.[1];
    if (/^tr\d+$/i.test(id) && moveName) {
      const move = this.dataDex().moves.get(moveName);
      const moveLabel = this.zh("moves", move?.exists ? move.name : moveName);
      return `一次性使用。让宝可梦学会${moveLabel}。`;
    }
    const zType = Z_CRYSTAL_TYPE_BY_ID[id] || this.zCrystalType(item);
    if (zType) return `可用它来制造用于对战的${this.zh("types", zType)}属性Ｚ招式。`;
    if ((item as any)?.megaStone) return `让特定宝可梦在对战中进行超级进化的进化石。`;
    const powerType = desc.match(/holder's ([a-z]+)-type attacks have 1\.2x power/i)?.[1];
    if (powerType) return `携带后，${this.zh("types", powerType)}属性招式的威力会提高。`;
    if (/ball$/i.test(id) || /poke ball/i.test(desc)) return "用于捕捉野生宝可梦的球。";
    if (/evolves/i.test(desc)) return "用于让特定宝可梦进化的道具。";
    if (/single use/i.test(desc)) return "一次性使用的道具，会在满足条件时发动效果。";
    if (/holder/i.test(desc)) return "携带后，会在战斗中发动对应效果。";
    return "具有特殊效果的道具。";
  }

  private itemDexSortOrder(item: any): number {
    const num = Number(item?.num || 0);
    if (num > 0) return 1000 + num;
    return 900000;
  }

  async itemOptions(): Promise<ShopItem[]> {
    await this.loadDisplayData();
    const dex = this.dataDex();
    const localById = new Map(LOCAL_DEX_ITEMS.map(item => [this.toId(item.id), item]));
    const showdownItems: ShopItem[] = dex.items.all()
      .filter((item: any) => item.exists && this.includeDataEntry(item))
      .map((item: any) => {
        const local = localById.get(this.toId(item.id));
        return {
          id: item.id,
          name: local?.name || item.name,
          name_zh: local?.name_zh || this.zh("items", item.name),
          cost: 500,
          desc: local?.desc || item.desc || item.shortDesc || "",
          desc_zh: local?.desc_zh || this.itemDescriptionZh(item),
          icon_asset: (local as {icon_asset?: string} | undefined)?.icon_asset || this.itemIconAsset(item.id, item),
        };
      });
    const existing = new Set(showdownItems.map(item => this.toId(item.id)));
    const localItems = LOCAL_DEX_ITEMS
      .filter(item => !existing.has(this.toId(item.id)))
      .map(item => ({
        id: item.id,
        name: item.name,
        name_zh: item.name_zh,
        cost: 0,
        desc: item.desc,
        desc_zh: item.desc_zh,
        icon_asset: ("icon_asset" in item ? item.icon_asset : undefined) || this.itemIconAsset(item.id, item),
      }));
    return [...localItems, ...showdownItems];
  }

  battleSystemForItem(itemId: string): BattleSystemId | null {
    const id = this.toId(itemId);
    if (!id) return null;
    const item = this.dataDex().items.get(id) as any;
    const looksLikeMegaStone = !MEGA_STONE_ID_EXCEPTIONS.has(id) && (/ite(?:x|y|z)?$/.test(id) || id.endsWith("nitex") || id.endsWith("nitey"));
    if (item?.megaStone) return "mega";
    if (looksLikeMegaStone) return "mega";
    if (item?.zMove || item?.zMoveType || Z_CRYSTAL_TYPE_BY_ID[id] || id.endsWith("iumz")) return "zmove";
    if (/dynamax|maxmushroom|maxmushrooms|maxhoney/.test(id)) return "dynamax";
    if (/tera|terashard/.test(id)) return "terastal";
    return null;
  }

  zCrystalItemIds(): string[] {
    return this.dataDex().items.all()
      .filter((item: any) => item?.exists && this.battleSystemForItem(item.id) === "zmove")
      .map((item: any) => item.id)
      .sort();
  }

  megaStoneItemIds(): string[] {
    return this.dataDex().items.all()
      .filter((item: any) => item?.exists && this.battleSystemForItem(item.id) === "mega" && item.id !== "crucibellite")
      .map((item: any) => item.id)
      .sort();
  }

  async dexSearch(category: DesktopDexCategory, query = "", offset = 0, limit = 8): Promise<DesktopDexSearchResult> {
    await this.loadDisplayData();
    const dex = this.dataDex();
    const normalizedCategory: DesktopDexCategory = ["pokemon", "abilities", "moves", "items"].includes(category) ? category : "pokemon";
    const cappedLimit = Math.max(1, Math.min(120, Number(limit || 80)));
    const normalizedOffset = Math.max(0, Number(offset || 0));
    const needle = String(query || "").trim().toLowerCase();
    const needleId = this.toId(needle);
    type RankedDexEntry = DesktopDexEntry & {search_rank?: number; sort_order?: number};
    const searchRank = (entry: DesktopDexEntry, extraParts: string[] = []) => {
      if (!needle && !needleId) return 0;
      const names = [entry.id, entry.name, entry.name_zh].filter(Boolean).map(value => String(value).toLowerCase());
      const nameIds = names.map(value => this.toId(value));
      if (needle && names.some(value => value === needle)) return 0;
      if (needleId && nameIds.some(value => value === needleId)) return 0;
      if (needle && names.some(value => value.startsWith(needle))) return 1;
      if (needleId && nameIds.some(value => value.startsWith(needleId))) return 1;

      const tags = (entry.tags || []).filter(Boolean).map(value => String(value).toLowerCase());
      const tagIds = tags.map(value => this.toId(value));
      if (needle && tags.some(value => value === needle || value.startsWith(needle))) return 2;
      if (needleId && tagIds.some(value => value === needleId || value.startsWith(needleId))) return 2;
      if (needle && names.some(value => value.includes(needle))) return 3;
      if (needleId && nameIds.some(value => value.includes(needleId))) return 3;
      if (needle && tags.some(value => value.includes(needle))) return 4;
      if (needleId && tagIds.some(value => value.includes(needleId))) return 4;

      const descriptions = [entry.desc, entry.desc_zh].filter(Boolean).map(value => String(value).toLowerCase());
      const descriptionIds = descriptions.map(value => this.toId(value));
      if (needle && descriptions.some(value => value.includes(needle))) return 5;
      if (needleId && descriptionIds.some(value => value.includes(needleId))) return 5;

      const extras = extraParts.filter(Boolean).map(value => String(value).toLowerCase());
      const extraIds = extras.map(value => this.toId(value));
      if (needle && extras.some(value => value === needle || value.startsWith(needle) || value.includes(needle))) return 6;
      if (needleId && extraIds.some(value => value === needleId || value.startsWith(needleId) || value.includes(needleId))) return 6;
      return null;
    };
    const includeRank = (entry: RankedDexEntry, extraParts: string[] = []): RankedDexEntry | null => {
      const rank = searchRank(entry, extraParts);
      return rank === null ? null : {...entry, search_rank: rank};
    };
    const byRankThenName = (a: RankedDexEntry, b: RankedDexEntry) => Number(a.search_rank || 0) - Number(b.search_rank || 0) || a.name.localeCompare(b.name);
    const byRankThenItemOrder = (a: RankedDexEntry, b: RankedDexEntry) => Number(a.search_rank || 0) - Number(b.search_rank || 0)
      || Number(a.sort_order || 900000) - Number(b.sort_order || 900000)
      || (a.name_zh || a.name).localeCompare(b.name_zh || b.name, "zh-Hans-CN")
      || a.name.localeCompare(b.name);
    const byRankThenDex = (a: RankedDexEntry, b: RankedDexEntry) => Number(a.search_rank || 0) - Number(b.search_rank || 0) || Number(a.sprite?.national_dex || 9999) - Number(b.sprite?.national_dex || 9999) || a.name.localeCompare(b.name);
    let entries: RankedDexEntry[] = [];
    const shouldSearchLearnset = [...needle].length >= 2 || needleId.length >= 3;

    if (normalizedCategory === "pokemon") {
      entries = dex.species.all()
        .filter((species: any) => species.exists && species.num > 0 && this.includeDexSpeciesEntry(species))
        .map((species: any) => {
          const entry = {
            id: species.id,
            name: species.name,
            name_zh: this.zh("species", species.name),
            category: "pokemon" as const,
            tags: [species.id, String(species.num || ""), ...(species.types || []).map((typeName: string) => this.zh("types", typeName))],
            sprite: this.spriteMap?.entries[species.id],
            types: species.types || [],
            types_zh: (species.types || []).map((typeName: string) => this.zh("types", typeName)),
            base_stats: this.fullStats(species.baseStats || {}, 0),
            heightm: Number(species.heightm || 0) || undefined,
            weightkg: Number(species.weightkg || 0) || undefined,
            gender: String(species.gender || "") || undefined,
            gender_ratio: species.genderRatio ? {...species.genderRatio} : undefined,
            abilities: this.speciesAbilitySummaries(species),
          };
          return includeRank(entry, shouldSearchLearnset ? this.speciesLearnsetSearchParts(species.id, dex) : []);
        })
        .filter(Boolean)
        .sort((a: DesktopDexEntry, b: DesktopDexEntry) => Number(a.sprite?.national_dex || 9999) - Number(b.sprite?.national_dex || 9999) || a.name.localeCompare(b.name));
      if (needle || needleId) entries.sort(byRankThenDex);
    } else if (normalizedCategory === "abilities") {
      entries = dex.abilities.all()
        .filter((ability: any) => ability.exists && this.includeDataEntry(ability))
        .map((ability: any) => includeRank({
          id: ability.id,
          name: ability.name,
          name_zh: this.zh("abilities", ability.name),
          category: "abilities" as const,
          desc: ability.desc || ability.shortDesc || "",
          desc_zh: this.detailDescription("abilities", ability.name),
          tags: [ability.id],
        }))
        .filter(Boolean)
        .sort(byRankThenName);
    } else if (normalizedCategory === "moves") {
      entries = dex.moves.all()
        .filter((move: any) => move.exists && this.includeDataEntry(move))
        .map((move: any) => {
          const detail = this.detail("moves", move.name);
          return {
            id: move.id,
            name: move.name,
            name_zh: this.zh("moves", move.name),
            category: "moves" as const,
            desc: move.desc || move.shortDesc || "",
            desc_zh: detail?.description || "",
            tags: [move.id, move.type, move.category, this.zh("types", move.type), this.zh("categories", move.category)],
            type: move.type || "",
            type_zh: detail?.type?.zh_cn || this.zh("types", move.type || ""),
            move_category: move.category || "",
            move_category_zh: detail?.category?.zh_cn || this.zh("categories", move.category || ""),
            power: move.basePower || 0,
            accuracy: move.accuracy === true ? null : move.accuracy,
            pp: move.pp || 0,
            priority: move.priority || 0,
          };
        })
        .map((entry: DesktopDexEntry) => includeRank(entry))
        .filter(Boolean)
        .sort(byRankThenName);
    } else {
      const localEntries = LOCAL_DEX_ITEMS.map(item => includeRank({
        id: item.id,
        name: item.name,
        name_zh: item.name_zh,
        category: "items" as const,
        desc: item.desc,
        desc_zh: item.desc_zh,
        icon_asset: this.itemIconAsset(item.id, item),
        tags: [item.id, item.name, item.name_zh],
        sort_order: item.sort_order,
      }));
      const localItemIds = new Set(LOCAL_DEX_ITEMS.map(item => item.id));
      entries = [
        ...localEntries,
        ...dex.items.all()
        .filter((item: any) => item.exists && this.includeDexItemEntry(item))
        .filter((item: any) => !localItemIds.has(item.id))
        .map((item: any) => includeRank({
          id: item.id,
          name: item.name,
          name_zh: this.zh("items", item.name),
          category: "items" as const,
          desc: item.desc || item.shortDesc || "",
          desc_zh: this.itemDescriptionZh(item),
          icon_asset: this.itemIconAsset(item.id, item),
          tags: [item.id],
          sort_order: this.itemDexSortOrder(item),
        })),
      ]
        .filter(Boolean)
        .sort(byRankThenItemOrder);
    }

    const total = entries.length;
    const page = entries.slice(normalizedOffset, normalizedOffset + cappedLimit).map(({search_rank, sort_order, ...entry}) => entry.category === "pokemon" ? {...entry, learnset: this.speciesLearnset(entry.id, dex, 96)} : entry);
    return {
      category: normalizedCategory,
      query: String(query || ""),
      offset: normalizedOffset,
      limit: cappedLimit,
      total,
      has_more: normalizedOffset + page.length < total,
      entries: page,
    };
  }

  async learnableMoves(set: PokemonSet): Promise<PricedMove[]> {
    await this.loadDisplayData();
    const dex = this.dataDex();
    const species = dex.species.get(set.species || set.name);
    if (!species.exists) return [];
    const moves = this.learnsetMovesForSpecies(species.id, dex).map(summary => ({...summary, cost: this.defaultMoveCost(summary.power)}));
    return moves.sort((a, b) => (b.power || 0) - (a.power || 0) || a.name.localeCompare(b.name));
  }

  async machineMoves(): Promise<MoveSummary[]> {
    await this.loadDisplayData();
    const dex = this.dataDex();
    const seen = new Set<string>();
    for (const species of dex.species.all()) {
      if (!species.exists || !species.id) continue;
      for (const entry of dex.species.getFullLearnset(species.id) || []) {
        for (const [moveId, learnCodes] of Object.entries(entry.learnset || {})) {
          const move = dex.moves.get(moveId);
          if (!move.exists || !move.id || seen.has(move.id)) continue;
          if (move.isNonstandard && move.isNonstandard !== "Past") continue;
          if (this.learnSourcesFromCodes(learnCodes as string[]).includes("machine")) seen.add(move.id);
        }
      }
    }
    return Array.from(seen).map(moveId => this.moveDetails(moveId, dex, ["machine"])).sort((a, b) => (b.power || 0) - (a.power || 0) || a.name.localeCompare(b.name));
  }

  async editOptions(set: PokemonSet): Promise<PokemonEditOptions> {
    await this.loadDisplayData();
    const dex = this.dataDex();
    const species = dex.species.get(set.species || set.name);
    const seen = new Set<string>();
    const abilities = [];
    for (const [slot, abilityName] of Object.entries(species.abilities || {})) {
      const ability = dex.abilities.get(abilityName as string);
      const name = ability.exists ? ability.name : String(abilityName || "");
      const id = ability.exists ? ability.id : this.toId(name);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      abilities.push({
        id,
        name,
        name_zh: this.zh("abilities", name),
        desc: ability.exists ? (ability.desc || ability.shortDesc || "") : "",
        desc_zh: this.detailDescription("abilities", name),
        hidden: slot === "H",
      });
    }
    const natures = dex.natures.all().map((nature: any) => ({
      id: nature.id,
      name: nature.name,
      name_zh: this.zh("natures", nature.name),
      plus: nature.plus || "",
      minus: nature.minus || "",
      plus_zh: this.zh("stats", nature.plus || ""),
      minus_zh: this.zh("stats", nature.minus || ""),
    }));
    return {abilities, natures};
  }

  async getSpriteForSpecies(speciesId: string): Promise<SpriteMapEntry | undefined> {
    const spriteMap = await this.loadSpriteMap();
    return spriteMap.entries[speciesId];
  }

  async createBattleSession(options: StartBattleOptions): Promise<TrainerItemBattleSession> {
    await this.loadDisplayData();
    const session = new TrainerItemBattleSession(this, this.loadShowdown(), options);
    await session.start();
    return session;
  }

  enemyTeamPreviewOrder(playerDisplay: RentalPokemon[] = [], enemyDisplay: RentalPokemon[] = [], seed: number | number[] = Date.now()): number[] {
    const rng = createBattleSeedRng(seed);
    return enemyPreviewOrder(enemyDisplay, playerDisplay[0], rng, this.loadShowdown().Dex.mod("gen7"));
  }

  async hasConsumableItemEffect(itemId: string): Promise<boolean> {
    if (REST_SHOP_DISCOUNT_COUPONS[toId(itemId)]) return true;
    if (TRAINING_SPECIAL_EFFECT_ITEM_IDS.has(toId(itemId))) return true;
    return Boolean((await this.loadConsumableItemEffects()).get(toId(itemId)));
  }

  async hasBattleConsumableItemEffect(itemId: string): Promise<boolean> {
    if (REST_SHOP_DISCOUNT_COUPONS[toId(itemId)]) return false;
    const effect = (await this.loadConsumableItemEffects()).get(toId(itemId));
    return Boolean(effect?.battle_usable);
  }

  async trainingItemEffect(itemId: string): Promise<TrainingItemEffect | null> {
    const id = toId(itemId);
    if (id === "abilitycapsule" || id === "abilitypatch") {
      return {stat_kind: "ability", amount: id === "abilitypatch" ? 1 : 0, scope: "one"};
    }
    const mintNature = MINT_NATURE_BY_ITEM_ID[id];
    if (mintNature) {
      const nature = this.dataDex().natures.get(mintNature);
      return {stat_kind: "nature", nature: nature.exists ? nature.name : mintNature, amount: 0, scope: "one"};
    }
    const effect = (await this.loadConsumableItemEffects()).get(toId(itemId));
    if (!effect?.stat_kind) return null;
    return {
      stat_kind: effect.stat_kind,
      stat: effect.stat,
      amount: effect.amount,
      scope: effect.scope === "all" ? "all" : "one",
    };
  }

  async applyConsumableItemEffectToState(itemId: string, state: PlayerPokemonState, moveSlot?: number): Promise<string> {
    await this.loadDisplayData();
    if (REST_SHOP_DISCOUNT_COUPONS[toId(itemId)]) throw new Error("商店折扣券只能在休整页使用。");
    const effect = (await this.loadConsumableItemEffects()).get(toId(itemId));
    if (!effect) throw new Error("这个道具不能作为消耗道具使用。");
    if (effect.stat_kind) throw new Error("这个训练道具只能在休整页使用。");
    const itemName = this.plain("items", itemId);
    const result = applyConsumableEffectToMutableState(effect, state, itemName, moveSlot);
    return result.message;
  }

  loadShowdown(): ShowdownModule {
    if (!this.sim) {
      if (!this.showdownLoader) throw new Error("Showdown module is not configured.");
      this.sim = this.showdownLoader();
    }
    return this.sim;
  }

  private async readProjectText(relativePath: string): Promise<string> {
    if (this.dataProvider) return this.dataProvider.readText(relativePath);
    throw new Error(`GameService dataProvider is not configured: ${relativePath}`);
  }

  private readProjectTextSync(relativePath: string): string | null {
    if (this.dataProvider?.readTextSync) return this.dataProvider.readTextSync(relativePath) ?? null;
    return null;
  }

  private projectAssetExists(relativePath: string): boolean {
    if (this.assetExistsSync) return this.assetExistsSync(relativePath);
    if (this.dataProvider?.existsSync) return this.dataProvider.existsSync(relativePath);
    return false;
  }

  randomUUID(): string {
    return this.uuidProvider?.()
      || globalThis.crypto?.randomUUID?.()
      || `changebattle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private dataDex(): any {
    return this.loadShowdown().Dex.mod("gen9");
  }

  private includeDataEntry(entry: any): boolean {
    return !entry.isNonstandard || entry.isNonstandard === "Past";
  }

  private includeDexSpeciesEntry(species: any): boolean {
    if (this.includeDataEntry(species)) return true;
    if (species?.isNonstandard !== "Future") return false;
    if (!/^Mega(?:-|$)/i.test(String(species?.forme || ""))) return false;
    return Boolean(this.spriteMap?.entries?.[species.id]);
  }

  private includeDexItemEntry(item: any): boolean {
    if (this.includeDataEntry(item)) return true;
    if (item?.isNonstandard !== "Future") return false;
    if (this.battleSystemForItem(item.id) !== "mega") return false;
    const megaTargets = item?.megaStone && typeof item.megaStone === "object"
      ? Object.values(item.megaStone)
      : [item?.megaStone];
    return megaTargets.some(target => {
      const targetSpecies = this.dataDex().species.get(String(target || ""));
      return targetSpecies?.exists && this.includeDexSpeciesEntry(targetSpecies);
    });
  }

  seedArray(seed: number | number[]): number[] {
    if (Array.isArray(seed) && seed.length === 4) return seed.map(value => Number(value) & 0xffff);
    let value = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 1;
    const out: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      value = (value * 1664525 + 1013904223) >>> 0;
      out.push(value & 0xffff);
    }
    return out;
  }

  deriveSeed(base: number, salt: number): number {
    return (Number(base) * 1103515245 + 12345 + salt * 2654435761) >>> 0;
  }

  plain(section: string, value: string | undefined): string {
    return this.zh(section, value);
  }

  effectName(raw: string): string {
    const cleaned = raw.replace("[from] ", "").replace("[of] ", "");
    const hasMovePrefix = cleaned.startsWith("move: ");
    const value = cleaned
      .replace("move: ", "").replace("item: ", "").replace("ability: ", "");
    if (value === "drain") return "吸取效果";
    if (!hasMovePrefix && toId(value) === "confusion") return this.zh("statuses", "confusion") || "混乱";
    for (const section of ["moves", "items", "abilities", "statuses"]) {
      const translated = this.zh(section, value);
      if (translated !== value) return translated;
    }
    return value;
  }

  abilityDescription(rawAbility: string | undefined): string {
    const value = String(rawAbility || "").replace("ability: ", "");
    return this.detailDescription("abilities", value);
  }

  itemDescription(rawItem: string | undefined): string {
    const value = String(rawItem || "").replace("item: ", "");
    return this.detailDescription("items", value);
  }

  conditionText(condition: string | undefined): string {
    if (!condition) return "?";
    const parts = String(condition).split(" ");
    const last = parts[parts.length - 1];
    const translated = this.zh("statuses", last);
    if (translated !== last) parts[parts.length - 1] = translated;
    return parts.join(" ");
  }

  private async loadDisplayData(): Promise<void> {
    await this.loadSpriteMap();
    await this.loadItemResourceRegistry();
    await this.loadTranslations();
    await this.loadDetails();
    await this.loadTierRowsAsync();
  }

  private async loadSpriteMap(): Promise<SpriteIndexMap> {
    if (!this.spriteMap) {
      const raw = await this.readProjectText("data/sprite_index_map.json");
      this.spriteMap = JSON.parse(raw) as SpriteIndexMap;
    }
    return this.spriteMap;
  }

  private async loadItemResourceRegistry(): Promise<void> {
    if (this.itemResourceRegistry) return;
    try {
      const raw = await this.readProjectText("data/item_resource_registry.json");
      this.itemResourceRegistry = JSON.parse(raw);
    } catch {
      this.itemResourceRegistry = {entries: {}};
    }
  }

  private bumpSeed(seed: number[], attempt: number): number[] {
    if (attempt === 0) return seed;
    return seed.map((value, index) => (value + attempt * (9973 + index * 7919)) & 0xffff);
  }

  private normalizeTeam(team: PokemonSet[]): PokemonSet[] {
    return team.map((set, index) => this.normalizeSetGender({
      ...set,
      level: Number(set.level || 50),
      nature: set.nature || "Serious",
      moves: [...(set.moves || [])],
    }, this.genderRngForSet(set, index)));
  }

  private normalizeSetGender(set: PokemonSet, rng: () => number = this.genderRngForSet(set)): PokemonSet {
    const existing = this.normalizedPokemonGender(set.gender);
    if (existing !== null) return {...set, gender: existing};
    return {...set, gender: this.genderForSpecies(set.species || set.name, rng)};
  }

  private normalizedPokemonGender(value: unknown): string | null {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    if (/^(?:m|male|♂)$/i.test(raw)) return "M";
    if (/^(?:f|female|♀)$/i.test(raw)) return "F";
    if (/^(?:n|none|genderless|无)$/i.test(raw)) return "";
    return null;
  }

  private fixedSpeciesGender(species: any): string {
    const raw = this.normalizedPokemonGender(species?.gender);
    return raw === null ? "" : raw;
  }

  private genderForSpecies(rawSpecies: string | undefined, rng: () => number): string {
    const species = this.dataDex().species.get(rawSpecies || "");
    if (!species?.exists) return rng() < 0.5 ? "M" : "F";
    const fixed = this.normalizedPokemonGender(species.gender);
    if (fixed !== null) return fixed;
    const ratio = species.genderRatio || {};
    const male = Number(ratio.M);
    const female = Number(ratio.F);
    if (Number.isFinite(male) && Number.isFinite(female)) {
      if (male <= 0 && female <= 0) return "";
      if (male <= 0) return "F";
      if (female <= 0) return "M";
      return rng() < male / (male + female) ? "M" : "F";
    }
    return rng() < 0.5 ? "M" : "F";
  }

  private genderRngForSet(set: Partial<PokemonSet> | undefined, salt = 0): () => number {
    const key = `${set?.species || set?.name || ""}:${set?.level || ""}:${(set?.moves || []).join(",")}:${salt}`;
    let state = 0x9e3779b9;
    for (let index = 0; index < key.length; index += 1) state = ((state << 5) - state + key.charCodeAt(index)) >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private describeSet(set: PokemonSet): RentalPokemon {
    const dex = this.dataDex();
    const species = dex.species.get(set.species || set.name);
    const ability = dex.abilities.get(set.ability);
    const item = set.item ? dex.items.get(set.item) : null;
    const level = Math.max(1, Number(set.level || 50));
    const nature = this.natureModifiers(set.nature || "Serious");
    const ivs = this.fullStats(set.ivs || {}, 31);
    const evs = this.fullStats(set.evs || {}, 0);
    const speciesId = species.id || this.toId(set.species || set.name);
    const sprite = this.spriteMap?.entries[speciesId];
    const baseStats = this.fullStats(species.baseStats || {}, 0);
    const teraType = set.teraType ? String(set.teraType) : "";
    return {
      name: set.name || set.species,
      species: set.species,
      species_zh: this.zh("species", species.name || set.species),
      species_id: speciesId,
      level,
      gender: set.gender || "",
      heightm: Number(species.heightm || 0) || undefined,
      weightkg: Number(species.weightkg || 0) || undefined,
      types: species.types || [],
      types_zh: (species.types || []).map((typeName: string) => this.zh("types", typeName)),
      ability: ability.exists ? ability.name : (set.ability || ""),
      ability_zh: this.zh("abilities", ability.exists ? ability.name : set.ability),
      ability_id: ability.exists ? ability.id : "",
      ability_desc: ability.exists ? (ability.desc || ability.shortDesc || "") : "",
      ability_desc_zh: this.detailDescription("abilities", ability.exists ? ability.name : set.ability),
      item: item?.exists ? item.name : (set.item || ""),
      item_zh: this.zh("items", item?.exists ? item.name : set.item),
      item_id: item?.exists ? item.id : "",
      item_desc: item?.exists ? (item.desc || item.shortDesc || "") : "",
      item_desc_zh: this.detailDescription("items", item?.exists ? item.name : set.item),
      item_battle_system: item?.exists ? this.battleSystemForItem(item.id) || undefined : undefined,
      tera_type: teraType || undefined,
      tera_type_zh: teraType ? this.zh("types", teraType) : undefined,
      moves: (set.moves || []).map((moveId: string) => this.moveDetails(moveId, dex)),
      base_stats: baseStats,
      stats: this.calculatedStats(baseStats, ivs, evs, level, nature),
      evs,
      ivs,
      nature: nature.name,
      nature_zh: this.zh("natures", nature.name),
      nature_plus: nature.plus,
      nature_minus: nature.minus,
      role: set.role || "",
      role_zh: this.zh("roles", set.role || ""),
      shiny: Boolean(set.shiny),
      is_legendary: this.isLegendarySpecies(speciesId),
      is_mythical: ((species.tags || []) as string[]).some(tag => /mythical/i.test(String(tag))),
      stage_tier: set.stage_tier,
      species_tier: set.species_tier,
      generation_profile: set.generation_profile,
      sprite,
    };
  }

  private createRngFromSeed(seed: number[], salt = 0): () => number {
    let state = seed.reduce((acc, value, index) => (acc ^ ((Number(value) & 0xffff) << ((index % 2) * 16))) >>> 0, 0x9e3779b9 ^ salt);
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private randomInt(rng: () => number, min: number, max: number): number {
    return min + Math.floor(rng() * (max - min + 1));
  }

  private randomIvs(rng: () => number): Record<string, number> {
    return Object.fromEntries(STAT_IDS.map(stat => [stat, this.randomInt(rng, 0, 31)]));
  }

  private randomEvs(rng: () => number): Record<string, number> {
    const evs = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as Record<string, number>;
    let remaining = 510;
    const order = [...STAT_IDS].sort(() => rng() - 0.5);
    for (const stat of order) {
      const value = this.randomInt(rng, 0, Math.min(255, remaining));
      evs[stat] = value;
      remaining -= value;
    }
    return evs;
  }

  private randomMovesForSet(set: PokemonSet, rng: () => number): string[] {
    const dex = this.dataDex();
    const species = dex.species.get(set.species || set.name);
    const pool: string[] = [];
    const seen = new Set<string>();
    for (const entry of dex.species.getFullLearnset(species.id) || []) {
      for (const moveId of Object.keys(entry.learnset || {})) {
        const move = dex.moves.get(moveId);
        if (!move.exists || !move.id || seen.has(move.id)) continue;
        if (move.isNonstandard && move.isNonstandard !== "Past") continue;
        seen.add(move.id);
        pool.push(move.name || move.id);
      }
    }
    const shuffled = [...pool].sort(() => rng() - 0.5);
    const selected = shuffled.slice(0, 4);
    return selected.length >= 4 ? selected : [...(set.moves || [])].slice(0, 4);
  }

  randomizeRentalSet(baseSet: PokemonSet, rng: () => number): PokemonSet {
    const dex = this.dataDex();
    const natures = dex.natures.all();
    const nature = natures[this.randomInt(rng, 0, Math.max(0, natures.length - 1))]?.name || baseSet.nature || "Serious";
    return {
      ...baseSet,
      level: this.randomInt(rng, MIN_RENTAL_LEVEL, MAX_RENTAL_LEVEL),
      item: "",
      ivs: this.randomIvs(rng),
      evs: this.randomEvs(rng),
      nature,
      moves: this.randomMovesForSet(baseSet, rng),
      shiny: this.randomInt(rng, 1, SHINY_RATE) === 1,
    };
  }

  private generateProfiledCandidates(seedArray: number[], format: string, count: number, options: GenerateRentalOptions): GeneratedTeam {
    const sim = this.loadShowdown();
    const targetCount = Math.max(1, Math.min(24, Number(count || RENTAL_CANDIDATE_COUNT)));
    const requestedProfiles = this.requestedProfiles(options, targetCount);
    const requestedSpeciesTiers = this.requestedSpeciesTiers(options, targetCount);
    const speciesIds = (options.speciesIds || []).map(id => this.toId(id));
    const team: PokemonSet[] = [];
    const display: RentalPokemon[] = [];
    const seenSpecies = new Set<string>();
    const rng = this.createRngFromSeed(seedArray, 4100 + targetCount);
    const generator = this.randomGenerator(format, seedArray);

    const maxAttempts = Math.max(targetCount * 80, MAX_GENERATION_ATTEMPTS);
    for (let slot = 0, attempts = 0; slot < targetCount && attempts < maxAttempts; attempts += 1) {
      const profile = requestedProfiles[slot] || requestedProfiles[requestedProfiles.length - 1] || "tier1";
      const speciesPick = speciesIds[slot]
        ? {speciesId: speciesIds[slot], speciesTier: this.tierForSpecies(speciesIds[slot]) || this.profileStageTier(profile)}
        : requestedSpeciesTiers[slot]
          ? this.pickSpeciesForTier(requestedSpeciesTiers[slot], rng, seenSpecies, options)
          : this.pickSpeciesForProfile(profile, rng, seenSpecies, options);
      const baseSet = this.baseSetForSpecies(speciesPick.speciesId, generator, rng);
      const set = this.normalizeSetGender(this.sanitizeSetForBattleSetting(this.applyGenerationProfile(baseSet, profile, rng, speciesPick.speciesTier), options), rng);
      const described = this.describeSet(set);
      if (seenSpecies.has(described.species_id) && !speciesIds[slot]) continue;
      if (!this.hasUsableSprite(described) && !speciesIds[slot]) continue;
      seenSpecies.add(described.species_id);
      team.push(set);
      display.push(described);
      slot += 1;
    }
    if (team.length < targetCount) {
      this.fillProfiledCandidateFallback(seedArray, format, targetCount, options, team, display, seenSpecies);
    }
    if (team.length < targetCount) throw new Error(`可用图片的阶段候选不足：${team.length}/${targetCount}`);
    this.normalizePikachuFormsForZMoves(team, options);
    this.ensureSignatureMoves(team);
    this.ensureZMoveUser(team, options, rng);
    this.ensureMegaUser(team, options, rng);
    this.ensureDynamaxUsers(team, options);
    this.ensureTerastalTypes(team, options, rng);
    display.splice(0, display.length, ...team.map(set => this.describeSet(set)));
    return {seed: seedArray, team, display, packed: sim.Teams.pack(team)};
  }

  private fillProfiledCandidateFallback(seedArray: number[], format: string, targetCount: number, options: GenerateRentalOptions, team: PokemonSet[], display: RentalPokemon[], seenSpecies: Set<string>): void {
    const sim = this.loadShowdown();
    const rng = this.createRngFromSeed(seedArray, 0x51f1 + targetCount + team.length);
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS * 2 && team.length < targetCount; attempt += 1) {
      const generated = this.normalizeTeam(sim.Teams.generate(format || "gen9randombattle", {seed: this.bumpSeed(seedArray, 0x5000 + attempt)}));
      for (const baseSet of generated) {
        if (team.length >= targetCount) break;
        const set = this.sanitizeSetForBattleSetting(this.randomizeRentalSet(baseSet, rng), options);
        const described = this.describeSet(set);
        if (seenSpecies.has(described.species_id)) continue;
        if (!this.hasUsableSprite(described)) continue;
        seenSpecies.add(described.species_id);
        team.push(set);
        display.push(described);
      }
    }

    const relaxedOptions = {...options, battleSetting: undefined};
    const profiles = this.requestedProfiles(options, targetCount);
    const tierRows = this.loadTierRows();
    for (let attempt = 0; attempt < targetCount * 80 && team.length < targetCount; attempt += 1) {
      const profile = profiles[team.length] || profiles[profiles.length - 1] || "tier1";
      const rule = this.pickSpeciesTierRule(profile, rng);
      const pool = this.preferredSpeciesPool(tierRows.filter(row => row.tier === rule.tier && !seenSpecies.has(row.species_id)), rule);
      const fallbackPool = tierRows.filter(row => !seenSpecies.has(row.species_id));
      const sourcePool = pool.length ? pool : fallbackPool;
      const selected = sourcePool[this.randomInt(rng, 0, Math.max(0, sourcePool.length - 1))];
      if (!selected) break;
      const baseSet = this.baseSetForSpecies(selected.species_id, this.randomGenerator(format, this.bumpSeed(seedArray, 0x6500 + attempt)), rng);
      const set = this.sanitizeSetForBattleSetting(this.applyGenerationProfile(baseSet, profile, rng, selected.tier), options);
      const described = this.describeSet(set);
      if (seenSpecies.has(described.species_id)) continue;
      if (!this.hasUsableSprite(described)) continue;
      seenSpecies.add(described.species_id);
      team.push(set);
      display.push(described);
    }

    if (team.length < targetCount && !options.battleSetting) return;
    for (let attempt = 0; attempt < targetCount * 40 && team.length < targetCount; attempt += 1) {
      const profile = profiles[team.length] || profiles[profiles.length - 1] || "tier1";
      const speciesPick = this.pickSpeciesForProfile(profile, rng, seenSpecies, relaxedOptions);
      const baseSet = this.baseSetForSpecies(speciesPick.speciesId, this.randomGenerator(format, this.bumpSeed(seedArray, 0x7700 + attempt)), rng);
      const set = this.sanitizeSetForBattleSetting(this.applyGenerationProfile(baseSet, profile, rng, speciesPick.speciesTier), options);
      const described = this.describeSet(set);
      if (seenSpecies.has(described.species_id)) continue;
      if (!this.hasUsableSprite(described)) continue;
      seenSpecies.add(described.species_id);
      team.push(set);
      display.push(described);
    }
  }

  private requestedProfiles(options: GenerateRentalOptions, count: number): GenerationProfile[] {
    if (options.profiles?.length) return options.profiles.slice(0, count);
    if (options.stages?.length) return options.stages.slice(0, count).map(stage => `tier${stage}` as GenerationProfile);
    return Array.from({length: count}, () => "tier1" as GenerationProfile);
  }

  private requestedSpeciesTiers(options: GenerateRentalOptions, count: number): SpeciesTier[] {
    return (options.speciesTiers || []).slice(0, count).map(tier => {
      const value = Number(tier || 1);
      return (value === 10 ? 10 : Math.max(1, Math.min(6, value))) as SpeciesTier;
    });
  }

  private randomGenerator(format: string, seedArray: number[]): any {
    try {
      return this.loadShowdown().Teams.getGenerator(format || "gen9randombattle", seedArray);
    } catch {
      return null;
    }
  }

  private baseSetForSpecies(speciesId: string, generator: any, rng: () => number): PokemonSet {
    const dex = this.dataDex();
    const species = dex.species.get(speciesId);
    if (generator?.randomSet && species.exists) {
      try {
        return this.normalizeSetGender(this.normalizeTeam([generator.randomSet(species)])[0], rng);
      } catch {
        // Fall through to the local legal-set fallback.
      }
    }
    const abilities = Object.values(species.abilities || {}).filter(Boolean) as string[];
    const ability = abilities[this.randomInt(rng, 0, Math.max(0, abilities.length - 1))] || "";
    return this.normalizeSetGender({
      name: species.name || speciesId,
      species: species.name || speciesId,
      ability,
      item: "",
      moves: this.randomMovesForSet({species: species.name || speciesId, moves: []}, rng),
      nature: "Serious",
      evs: this.fullStats({}, 0),
      ivs: this.fullStats({}, 31),
      level: 50,
    }, rng);
  }

  private applyGenerationProfile(baseSet: PokemonSet, profile: GenerationProfile, rng: () => number, speciesTier?: SpeciesTier): PokemonSet {
    const normalizedProfile = profile === "champion" ? "champion" : profile;
    const stageTier = this.profileStageTier(profile);
    const dex = this.dataDex();
    const natures = dex.natures.all();
    const randomNature = () => natures[this.randomInt(rng, 0, Math.max(0, natures.length - 1))]?.name || "Serious";
    const heldItem = baseSet.item || FALLBACK_HELD_ITEMS[this.randomInt(rng, 0, FALLBACK_HELD_ITEMS.length - 1)];
    const set = {...baseSet, moves: [...(baseSet.moves || [])], shiny: this.randomInt(rng, 1, SHINY_RATE) === 1};
    const speciesStageTier = speciesTier || stageTier;
    if (normalizedProfile === "tier1") {
      return {...set, level: this.randomInt(rng, 45, 50), item: "", ivs: this.randomStatsWithTotal(rng, this.randomInt(rng, 0, 90), 31), evs: this.randomStatsWithTotal(rng, this.randomInt(rng, 0, 200), 255), nature: "Serious", stage_tier: stageTier, species_tier: speciesStageTier, generation_profile: normalizedProfile};
    }
    if (normalizedProfile === "tier2") {
      return {...set, level: this.randomInt(rng, 45, 50), item: heldItem, ivs: this.randomStatsWithTotal(rng, this.randomInt(rng, 60, 120), 31), evs: this.randomStatsWithTotal(rng, this.randomInt(rng, 180, 300), 255), nature: randomNature(), stage_tier: stageTier, species_tier: speciesStageTier, generation_profile: normalizedProfile};
    }
    if (normalizedProfile === "tier3") {
      return {...set, level: this.randomInt(rng, 50, 54), item: heldItem, ivs: this.randomStatsWithTotal(rng, this.randomInt(rng, 90, 150), 31), evs: this.randomStatsWithTotal(rng, this.randomInt(rng, 270, 450), 255), nature: baseSet.nature || randomNature(), stage_tier: stageTier, species_tier: speciesStageTier, generation_profile: normalizedProfile};
    }
    const level = normalizedProfile === "champion" ? this.randomInt(rng, 58, 60) : 55;
    return {...set, level, item: heldItem, ivs: this.fullStats({}, 31), evs: this.randomStatsWithTotal(rng, 510, 255), nature: baseSet.nature || randomNature(), stage_tier: 4, species_tier: speciesStageTier, generation_profile: normalizedProfile};
  }

  private randomStatsWithTotal(rng: () => number, total: number, maxPerStat: number): Record<string, number> {
    const cappedTotal = Math.max(0, Math.min(total, maxPerStat * STAT_IDS.length));
    const values = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as Record<string, number>;
    let remaining = cappedTotal;
    const order = [...STAT_IDS].sort(() => rng() - 0.5);
    for (let index = 0; index < order.length; index += 1) {
      const stat = order[index];
      const slotsLeft = order.length - index - 1;
      const min = Math.max(0, remaining - maxPerStat * slotsLeft);
      const max = Math.min(maxPerStat, remaining);
      const value = index === order.length - 1 ? remaining : this.randomInt(rng, min, max);
      values[stat] = value;
      remaining -= value;
    }
    return values;
  }

  private pickSpeciesForProfile(profile: GenerationProfile, rng: () => number, seenSpecies: Set<string>, options: GenerateRentalOptions): SpeciesPick {
    const rule = this.pickSpeciesTierRule(profile, rng);
    return this.pickSpeciesByRule(rule, rng, seenSpecies, options);
  }

  private pickSpeciesForTier(tier: SpeciesTier, rng: () => number, seenSpecies: Set<string>, options: GenerateRentalOptions): SpeciesPick {
    return this.pickSpeciesByRule({tier, weight: 1, preferNonNfe: true}, rng, seenSpecies, options);
  }

  private pickSpeciesByRule(rule: SpeciesTierRule, rng: () => number, seenSpecies: Set<string>, options: GenerateRentalOptions): SpeciesPick {
    const tierRows = this.loadTierRows();
    const setting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    const tierPool = tierRows.filter(row => row.tier === rule.tier && this.speciesAllowedByBattleSetting(row.species_id, setting, seenSpecies, options.purpose));
    const fallbackTierPool = tierRows.filter(row => this.speciesAllowedByBattleSetting(row.species_id, setting, seenSpecies, options.purpose));
    const sourcePool = tierPool.length ? tierPool : fallbackTierPool;
    if (!sourcePool.length) return {speciesId: "pikachu", speciesTier: rule.tier};
    const uniquePool = sourcePool.filter(row => !seenSpecies.has(row.species_id));
    const selectedPool = this.preferredSpeciesPool(uniquePool.length ? uniquePool : sourcePool, rule);
    const dex = this.dataDex();
    const generationFor = (speciesId: string) => Math.max(1, Math.min(9, Number(dex.species.get(speciesId)?.gen || 1)));
    const seenGenerations = [...seenSpecies].map(generationFor);
    const generationCounts = new Map<number, number>();
    for (let gen = 1; gen <= 9; gen += 1) generationCounts.set(gen, seenGenerations.filter(value => value === gen).length);
    const availableGenerations = [...new Set(selectedPool.map(row => generationFor(row.species_id)))].sort((a, b) => (generationCounts.get(a) || 0) - (generationCounts.get(b) || 0) || a - b);
    const targetGenerations = availableGenerations.filter(gen => (generationCounts.get(gen) || 0) === (generationCounts.get(availableGenerations[0]) || 0));
    const targetGen = targetGenerations[this.randomInt(rng, 0, Math.max(0, targetGenerations.length - 1))] || availableGenerations[0];
    const genPool = selectedPool.filter(row => generationFor(row.species_id) === targetGen);
    const finalPool = genPool.length ? genPool : selectedPool;
    const selected = this.pickSpeciesRowWithUsageBias(finalPool, rng, options);
    return {speciesId: selected?.species_id || "pikachu", speciesTier: selected?.tier || rule.tier};
  }

  private pickSpeciesRowWithUsageBias(pool: TierRow[], rng: () => number, options: GenerateRentalOptions): TierRow | undefined {
    if (!pool.length) return undefined;
    if (!options.speciesUsageCounts || options.purpose === "boss") return pool[this.randomInt(rng, 0, Math.max(0, pool.length - 1))];
    const usageCounts = options.speciesUsageCounts;
    const weights = pool.map(row => {
      const count = Math.max(0, Math.floor(Number(usageCounts[this.toId(row.species_id)] || 0)));
      if (count <= 0) return 16;
      return Math.max(1, Math.floor(16 / Math.pow(count + 1, 2)));
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = rng() * total;
    for (let index = 0; index < pool.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return pool[index];
    }
    return pool[pool.length - 1];
  }

  private battlePresetMaxGeneration(setting: BattleSetting): number | null {
    return BATTLE_RULE_PRESET_OPTIONS.find(option => option.id === setting.battle_rule_preset)?.max_generation || null;
  }

  private speciesAllowedByBattleSetting(speciesId: string, setting: BattleSetting, seenSpecies: Set<string>, purpose?: GenerateRentalOptions["purpose"]): boolean {
    if (purpose === "boss") return true;
    const species = this.dataDex().species.get(speciesId);
    const generation = Math.max(1, Math.min(9, Number(species?.gen || 1)));
    if (!setting.allowed_generations.includes(generation)) return false;
    const presetMaxGeneration = this.battlePresetMaxGeneration(setting);
    if (presetMaxGeneration && generation > presetMaxGeneration) return false;
    if (this.toId(speciesId) === "rayquaza" && (!setting.legendary_battle || !setting.enabled_battle_systems.includes("mega"))) return false;
    if (!setting.legendary_battle && this.tierForSpecies(speciesId) === 10) return false;
    if (!setting.legendary_battle && this.isLegendarySpecies(speciesId)) return false;
    if (setting.legendary_battle && this.isLegendarySpecies(speciesId)) {
      const existingLegendaryCount = [...seenSpecies].filter(id => this.isLegendarySpecies(id)).length;
      if (existingLegendaryCount >= 1) return false;
    }
    return true;
  }

  private isLegendarySpecies(speciesId: string): boolean {
    const species = this.dataDex().species.get(speciesId);
    const tags = (species?.tags || []) as string[];
    return Boolean(species?.isLegendary || species?.isMythical || tags.some(tag => /legendary|mythical/i.test(String(tag))));
  }

  private sanitizeSetForBattleSetting(set: PokemonSet, options: GenerateRentalOptions): PokemonSet {
    if (!options.battleSetting) return set;
    const setting = normalizeBattleSetting(options.battleSetting);
    const system = this.battleSystemForItem(set.item);
    if (!system || setting.enabled_battle_systems.includes(system)) return set;
    return {...set, item: ""};
  }

  private ensureDynamaxUsers(team: PokemonSet[], options: GenerateRentalOptions): void {
    const setting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    if (setting.battle_rule_preset !== "gen8" && !setting.enabled_battle_systems.includes("dynamax")) return;
    for (const set of team) {
      set.dynamaxLevel = Math.max(10, Number(set.dynamaxLevel || 10));
    }
  }

  private ensureTerastalTypes(team: PokemonSet[], options: GenerateRentalOptions, rng: () => number): void {
    const setting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    if (setting.battle_rule_preset !== "gen9" || !setting.enabled_battle_systems.includes("terastal")) return;
    for (const set of team) {
      set.teraType = this.pickTeraTypeForSet(set, rng);
    }
  }

  private pickTeraTypeForSet(set: PokemonSet, rng: () => number): string {
    const dex = this.dataDex();
    const moveTypes: string[] = (set.moves || [])
      .map((moveName: string) => dex.moves.get(moveName))
      .filter((move: any) => move?.exists && move.category !== "Status")
      .map((move: any) => String(move.type || ""))
      .filter((type: string) => STANDARD_TERA_TYPES.includes(type));
    const species = dex.species.get(set.species || set.name);
    const speciesTypes: string[] = (species?.types || []).filter((type: string) => STANDARD_TERA_TYPES.includes(type));
    const choices: string[] = [...new Set<string>(moveTypes.length ? moveTypes : speciesTypes)];
    return choices[this.randomInt(rng, 0, Math.max(0, choices.length - 1))] || "Normal";
  }

  private ensureZMoveUser(team: PokemonSet[], options: GenerateRentalOptions, rng: () => number): void {
    const setting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    if (!setting.enabled_battle_systems.includes("zmove")) return;
    for (const set of team) {
      const specialItems = this.specialZCrystalChoicesForSet(set);
      if (!specialItems.length) continue;
      const currentItemId = this.toId(set.item);
      const picked = specialItems.find(entry => entry.itemId === currentItemId) || specialItems[0];
      set.item = this.dataDex().items.get(picked.itemId)?.name || picked.itemId;
      this.ensureMoveForSet(set, picked.moveName);
    }
    if (team.some(set => this.zCrystalOptionsForSet(set).some(itemId => this.toId(set.item) === itemId))) return;
    const candidates = team
      .map((set, index) => ({set, index, items: this.zCrystalOptionsForSet(set)}))
      .filter(entry => entry.items.length > 0);
    if (!candidates.length) return;
    const picked = candidates[this.randomInt(rng, 0, candidates.length - 1)];
    picked.set.item = this.dataDex().items.get(picked.items[0])?.name || picked.items[0];
  }

  private normalizePikachuFormsForZMoves(team: PokemonSet[], options: GenerateRentalOptions): void {
    const setting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    if (!setting.enabled_battle_systems.includes("zmove")) return;
    const dex = this.dataDex();
    for (const set of team) {
      const species = dex.species.get(set.species || set.name);
      const speciesId = this.toId(species?.id || set.species || set.name);
      const baseSpeciesId = this.toId(species?.baseSpecies || set.species || set.name);
      const rawSpeciesId = this.toId(set.species || set.name);
      const isPikachuForm = speciesId === "pikachu" || baseSpeciesId === "pikachu" || speciesId.startsWith("pikachu") || rawSpeciesId.startsWith("pikachu");
      if (!isPikachuForm || speciesId === "pikachu" || PIKASHUNIUM_ALLOWED_PIKACHU_IDS.has(speciesId)) continue;
      set.species = PIKASHUNIUM_FALLBACK_PIKACHU_FORM;
      set.name = PIKASHUNIUM_FALLBACK_PIKACHU_FORM;
    }
  }

  private ensureSignatureMoves(team: PokemonSet[]): void {
    const dex = this.dataDex();
    for (const set of team) {
      const species = dex.species.get(set.species || set.name);
      const speciesId = this.toId(species?.id || set.species || set.name);
      const baseSpeciesId = this.toId(species?.baseSpecies || set.species || set.name);
      if (speciesId !== "pikachu" && baseSpeciesId !== "pikachu") continue;
      const zChoice = this.pikachuSignatureZChoiceForSet(set);
      if (zChoice) this.ensureMoveForSet(set, zChoice.moveName);
    }
  }

  private zCrystalOptionsForSet(set: PokemonSet): string[] {
    const choices = this.zCrystalChoicesForSet(set);
    return [...choices.special, ...choices.generic];
  }

  private ensureMoveForSet(set: PokemonSet, moveName: string): void {
    const dex = this.dataDex();
    const move = dex.moves.get(moveName);
    if (!move?.exists) return;
    const moveId = this.toId(move.id || move.name || moveName);
    const moves = [...(set.moves || [])].filter(Boolean);
    if (moves.some(existing => this.toId(existing) === moveId)) {
      set.moves = moves;
      return;
    }
    const moveLabel = move.name || moveName;
    if (moves.length < 4) {
      set.moves = [...moves, moveLabel];
      return;
    }
    const replaceIndex = moves
      .map((existing, index) => {
        const existingMove = dex.moves.get(existing);
        const categoryPenalty = existingMove?.category === "Status" ? 0 : 100;
        const power = Math.max(0, Number(existingMove?.basePower || 0));
        return {index, score: categoryPenalty + power};
      })
      .sort((a, b) => a.score - b.score || a.index - b.index)[0]?.index ?? 0;
    moves[replaceIndex] = moveLabel;
    set.moves = moves;
  }

  private ensureMegaUser(team: PokemonSet[], options: GenerateRentalOptions, rng: () => number): void {
    const setting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    if (!setting.enabled_battle_systems.includes("mega")) return;
    if (team.some(set => this.megaStoneOptionsForSet(set).some(itemId => this.toId(set.item) === itemId))) return;
    const candidates = team
      .map((set, index) => ({set, index, items: this.megaStoneOptionsForSet(set)}))
      .filter(entry => entry.items.length > 0);
    if (!candidates.length) return;
    const nonZCandidates = candidates.filter(entry => this.battleSystemForItem(entry.set.item) !== "zmove");
    const pool = nonZCandidates.length ? nonZCandidates : candidates;
    const picked = pool[this.randomInt(rng, 0, pool.length - 1)];
    const itemId = picked.items[this.randomInt(rng, 0, picked.items.length - 1)];
    picked.set.item = this.dataDex().items.get(itemId)?.name || itemId;
  }

  private megaStoneOptionsForSet(set: PokemonSet): string[] {
    const dex = this.dataDex();
    const species = dex.species.get(set.species || set.name);
    if (this.toId(species?.id || set.species || set.name) === "rayquaza") return [];
    const speciesIds = new Set([species?.id, species?.name, species?.baseSpecies, set.species, set.name].filter(Boolean).map(value => this.toId(String(value))));
    if (!speciesIds.size) return [];
    return this.megaStoneItemIds().filter(itemId => {
      const item = dex.items.get(itemId) as any;
      const megaEvolves = this.toId(item?.megaEvolves || "");
      if (megaEvolves && speciesIds.has(megaEvolves)) return true;
      if (item?.megaStone && typeof item.megaStone === "object") {
        return Object.keys(item.megaStone).some(baseSpecies => speciesIds.has(this.toId(baseSpecies)));
      }
      const megaStone = this.toId(item?.megaStone || "");
      if (!megaStone) return false;
      const target = dex.species.get(megaStone);
      return speciesIds.has(this.toId(target?.baseSpecies || ""));
    });
  }

  private zCrystalChoicesForSet(set: PokemonSet): {special: string[]; generic: string[]} {
    const dex = this.dataDex();
    const moves = (set.moves || []).map((moveName: string) => dex.moves.get(moveName)).filter((move: any) => move?.exists);
    if (!moves.length) return {special: [], generic: []};
    const zItems = this.zCrystalItemIds().map(id => dex.items.get(id)).filter((item: any) => item?.exists);
    const special = this.specialZCrystalChoicesForSet(set)
      .filter(choice => moves.some((move: any) => this.toId(move.id || move.name) === this.toId(choice.moveName)))
      .map(choice => choice.itemId);
    const generic = zItems.filter((item: any) => {
      if (item.zMove !== true || !item.zMoveType) return false;
      return moves.some((move: any) => move.type === item.zMoveType);
    }).map((item: any) => item.id);
    return {special, generic};
  }

  private specialZCrystalChoicesForSet(set: PokemonSet): Array<{itemId: string; moveName: string}> {
    const dex = this.dataDex();
    const pikachuChoice = this.pikachuSignatureZChoiceForSet(set);
    if (pikachuChoice && dex.items.get(pikachuChoice.itemId)?.exists) return [pikachuChoice];
    const species = dex.species.get(set.species || set.name);
    const speciesNames = new Set([species?.name, species?.baseSpecies, set.species, set.name].filter(Boolean).map(value => String(value)));
    const speciesIds = new Set([...speciesNames].map(value => this.toId(value)));
    return this.zCrystalItemIds()
      .map(id => dex.items.get(id))
      .filter((item: any) => item?.exists && item.zMoveFrom)
      .filter((item: any) => {
        const users = (item.itemUser || []) as string[];
        return !users.length || users.some(user => speciesNames.has(user) || speciesIds.has(this.toId(user)));
      })
      .map((item: any) => ({itemId: item.id, moveName: item.zMoveFrom}));
  }

  private pikachuSignatureZChoiceForSet(set: PokemonSet): {itemId: string; moveName: string} | null {
    const species = this.dataDex().species.get(set.species || set.name);
    const speciesId = this.toId(species?.id || set.species || set.name);
    const baseSpeciesId = this.toId(species?.baseSpecies || set.species || set.name);
    const rawSpeciesId = this.toId(set.species || set.name);
    const isPikachuForm = speciesId === "pikachu" || baseSpeciesId === "pikachu" || speciesId.startsWith("pikachu") || rawSpeciesId.startsWith("pikachu");
    if (!isPikachuForm) return null;
    if (speciesId === "pikachu") return {itemId: "pikaniumz", moveName: "Volt Tackle"};
    if (!PIKASHUNIUM_ALLOWED_PIKACHU_IDS.has(speciesId)) return null;
    return {itemId: "pikashuniumz", moveName: "Thunderbolt"};
  }

  private profileStageTier(profile: GenerationProfile): StageTier {
    if (profile === "champion") return 4;
    return Math.max(1, Math.min(4, Number(profile.replace("tier", "")) || 1)) as StageTier;
  }

  private pickSpeciesTierRule(profile: GenerationProfile, rng: () => number): SpeciesTierRule {
    const rules = this.speciesTierRulesForProfile(profile);
    const total = rules.reduce((sum, rule) => sum + Math.max(0, rule.weight), 0);
    let roll = rng() * total;
    for (const rule of rules) {
      roll -= Math.max(0, rule.weight);
      if (roll <= 0) return rule;
    }
    return rules[rules.length - 1] || {tier: this.profileStageTier(profile), weight: 1};
  }

  private speciesTierRulesForProfile(profile: GenerationProfile): SpeciesTierRule[] {
    if (profile === "tier1") {
      return [
        {tier: 1, weight: 1},
        {tier: 2, weight: 2},
        {tier: 3, weight: 3, preferNonNfe: true},
        {tier: 4, weight: 4, preferNonNfe: true},
      ];
    }
    if (profile === "tier2") {
      return [
        {tier: 2, weight: 3},
        {tier: 3, weight: 4, preferNonNfe: true},
        {tier: 4, weight: 2, preferNonNfe: true},
        {tier: 5, weight: 1, preferNonNfe: true},
      ];
    }
    if (profile === "tier3") {
      return [
        {tier: 3, weight: 2, preferNonNfe: true},
        {tier: 4, weight: 5, preferNonNfe: true},
        {tier: 5, weight: 3, preferNonNfe: true},
      ];
    }
    if (profile === "tier4") {
      return [
        {tier: 4, weight: 2, preferNonNfe: true},
        {tier: 5, weight: 4, preferNonNfe: true},
        {tier: 6, weight: 3, preferNonNfe: true},
        {tier: 10, weight: 1, preferNonNfe: true},
      ];
    }
    return [{tier: this.profileStageTier(profile), weight: 1, preferNonNfe: true}];
  }

  private preferredSpeciesPool(pool: TierRow[], rule: SpeciesTierRule): TierRow[] {
    if (!rule.preferNonNfe) return pool;
    const nonNfe = pool.filter(row => !this.isNfeTierRow(row));
    return nonNfe.length ? nonNfe : pool;
  }

  private isNfeTierRow(row: TierRow): boolean {
    return (row.notes || "").split("|").map(note => note.trim().toLowerCase()).includes("nfe");
  }

  private tierForSpecies(speciesId: string): SpeciesTier | null {
    const id = this.toId(speciesId);
    return this.loadTierRows().find(row => row.species_id === id)?.tier || null;
  }

  private loadTierRows(): TierRow[] {
    if (this.tierRows) return this.tierRows;
    const raw = this.readProjectTextSync("data/pokemon_tiers.csv");
    if (!raw) {
      this.tierRows = [];
      return this.tierRows;
    }
    this.tierRows = this.parseTierRows(raw);
    return this.tierRows;
  }

  private async loadTierRowsAsync(): Promise<TierRow[]> {
    if (this.tierRows) return this.tierRows;
    const raw = await this.readProjectText("data/pokemon_tiers.csv").catch(() => "");
    this.tierRows = raw ? this.parseTierRows(raw) : [];
    return this.tierRows;
  }

  private parseTierRows(raw: string): TierRow[] {
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const header = this.parseCsvLine(lines[0] || "");
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""])) as Record<string, string>;
      return {
        species_id: row.species_id,
        species: row.species,
        tier: Number(row.override_tier || row.tier || 1) as SpeciesTier,
        override_tier: row.override_tier,
        notes: row.notes,
      };
    }).filter(row => row.species_id && ((row.tier >= 1 && row.tier <= 6) || row.tier === 10));
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === "\"") {
        if (quoted && line[index + 1] === "\"") {
          cell += "\"";
          index += 1;
        } else quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else cell += char;
    }
    cells.push(cell);
    return cells;
  }

  private hasUsableSprite(pokemon: RentalPokemon): boolean {
    const spritePath = pokemon.sprite?.paths.front_normal;
    if (!spritePath || pokemon.sprite?.sprite_index === 0) return false;
    if (/^https?:\/\//i.test(spritePath)) return true;
    return this.projectAssetExists(spritePath);
  }

  private moveDetails(moveId: string, dex = this.dataDex(), learnSources: MoveLearnSource[] = []) {
    const move = dex.moves.get(moveId);
    const detail = this.detail("moves", move.name || moveId);
    const sources = Array.from(new Set(learnSources));
    return {
      id: move.id || moveId,
      name: move.name || moveId,
      name_zh: this.zh("moves", move.name || moveId),
      type: move.type || "",
      type_zh: detail?.type?.zh_cn || this.zh("types", move.type || ""),
      category: move.category || "",
      category_zh: detail?.category?.zh_cn || this.zh("categories", move.category || ""),
      power: move.basePower || 0,
      accuracy: move.accuracy === true ? null : move.accuracy,
      pp: move.pp || 0,
      priority: move.priority || 0,
      short_desc: move.shortDesc || "",
      short_desc_zh: detail?.description || "",
      desc: move.desc || move.shortDesc || "",
      desc_zh: detail?.description || "",
      learn_sources: sources.length ? sources : undefined,
      learn_source_labels: sources.length ? sources.map(source => MOVE_LEARN_SOURCE_LABELS[source] || "其他") : undefined,
    };
  }

  private natureModifiers(natureName: string) {
    const nature = this.dataDex().natures.get(natureName || "Serious");
    return {name: nature.name || "Serious", plus: nature.plus || "", minus: nature.minus || ""};
  }

  private defaultMoveCost(power: number | undefined): number {
    const value = Number(power || 0);
    if (value >= 120) return 500;
    if (value > 90) return 400;
    if (value > 60) return 300;
    if (value > 30) return 200;
    return 100;
  }

  private speciesLearnset(speciesId: string, dex = this.dataDex(), limit = 96) {
    const species = dex.species.get(speciesId);
    if (!species.exists) return [];
    const moves = this.learnsetMovesForSpecies(species.id, dex);
    return moves.sort((a, b) => (b.power || 0) - (a.power || 0) || a.name.localeCompare(b.name)).slice(0, limit);
  }

  private speciesAbilitySummaries(species: any): NonNullable<DesktopDexEntry["abilities"]> {
    const seen = new Set<string>();
    const result: NonNullable<DesktopDexEntry["abilities"]> = [];
    for (const [slot, abilityName] of Object.entries(species?.abilities || {})) {
      const ability = this.dataDex().abilities.get(String(abilityName || ""));
      const id = ability?.exists ? ability.id : this.toId(String(abilityName || ""));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const name = ability?.exists ? ability.name : String(abilityName || id);
      result.push({
        id,
        name,
        name_zh: this.zh("abilities", name),
        desc_zh: this.detailDescription("abilities", name),
        hidden: String(slot).toUpperCase() === "H",
      });
    }
    return result;
  }

  private learnsetMovesForSpecies(speciesId: string, dex = this.dataDex()): MoveSummary[] {
    const sourcesByMove = new Map<string, Set<MoveLearnSource>>();
    for (const entry of dex.species.getFullLearnset(speciesId) || []) {
      for (const [moveId, learnCodes] of Object.entries(entry.learnset || {})) {
        const move = dex.moves.get(moveId);
        if (!move.exists || !move.id) continue;
        if (move.isNonstandard && move.isNonstandard !== "Past") continue;
        const sourceSet = sourcesByMove.get(move.id) || new Set<MoveLearnSource>();
        for (const source of this.learnSourcesFromCodes(learnCodes as string[])) sourceSet.add(source);
        sourcesByMove.set(move.id, sourceSet);
      }
    }
    return Array.from(sourcesByMove.entries()).map(([moveId, sources]) => this.moveDetails(moveId, dex, Array.from(sources).sort((a, b) => MOVE_LEARN_SOURCE_ORDER.indexOf(a) - MOVE_LEARN_SOURCE_ORDER.indexOf(b))));
  }

  private learnSourcesFromCodes(codes: string[] = []): MoveLearnSource[] {
    const result = new Set<MoveLearnSource>();
    for (const code of codes || []) {
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

  private speciesLearnsetSearchParts(speciesId: string, dex = this.dataDex()): string[] {
    const species = dex.species.get(speciesId);
    if (!species.exists) return [];
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const entry of dex.species.getFullLearnset(species.id) || []) {
      for (const moveId of Object.keys(entry.learnset || {})) {
        if (seen.has(moveId)) continue;
        const move = dex.moves.get(moveId);
        if (!move.exists || !move.id) continue;
        if (move.isNonstandard && move.isNonstandard !== "Past") continue;
        seen.add(moveId);
        parts.push(move.id, move.name, this.zh("moves", move.name || move.id));
      }
    }
    return parts;
  }

  private calculatedStats(baseStats: Record<string, number>, ivs: Record<string, number>, evs: Record<string, number>, level: number, nature: {plus: string; minus: string}): Record<string, number> {
    const result: Record<string, number> = {};
    for (const stat of STAT_IDS) {
      const base = baseStats[stat] || 0;
      const value = Math.floor(((2 * base + ivs[stat] + Math.floor(evs[stat] / 4)) * level) / 100);
      if (stat === "hp") {
        result[stat] = value + level + 10;
      } else {
        let adjusted = value + 5;
        if (nature.plus === stat) adjusted = Math.floor(adjusted * 1.1);
        if (nature.minus === stat) adjusted = Math.floor(adjusted * 0.9);
        result[stat] = adjusted;
      }
    }
    return result;
  }

  private fullStats(input: Record<string, number>, defaultValue: number): Record<string, number> {
    const result: Record<string, number> = {};
    for (const stat of STAT_IDS) result[stat] = input[stat] === undefined ? defaultValue : Number(input[stat]);
    return result;
  }

  async loadConsumableItemEffects(): Promise<Map<string, ConsumableItemEffect>> {
    if (this.consumableEffects) return this.consumableEffects;
    const effects = new Map<string, ConsumableItemEffect>();
    const raw = await this.readProjectText("data/consumable_item_effects.csv").catch(() => "");
    if (raw) {
      const lines = raw.split(/\r?\n/).filter(line => line.trim());
      const header = parseCsvLine(lines[0] || "");
      for (const line of lines.slice(1)) {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
        const id = toId(row.id);
        if (!id) continue;
        effects.set(id, {
          id,
          hp: String(row.hp || ""),
          revive: row.revive === "half" || row.revive === "full" ? row.revive : "",
          pp: String(row.pp || ""),
          pp_scope: row.pp_scope === "one" || row.pp_scope === "all" ? row.pp_scope : "",
          status: String(row.status || "none"),
          stat_kind: row.stat_kind === "iv" || row.stat_kind === "ev" ? row.stat_kind : "",
          stat: parseStatId(row.stat),
          amount: Number(row.amount || 0),
          scope: row.scope === "one" || row.scope === "all" ? row.scope : "",
          battle_usable: row.battle_usable === "" ? true : row.battle_usable !== "0",
          notes: row.notes || "",
        });
      }
    }
    this.consumableEffects = effects;
    return effects;
  }

  private toId(value: string): string {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  private async loadTranslations(): Promise<TranslationData> {
    if (!this.translations) {
      const raw = await this.readProjectText("data/zh_cn_overrides.json");
      const parsed = JSON.parse(raw) as TranslationData;
      this.translations = parsed;
      this.translationNormalized = this.normalizeSections(parsed);
    }
    return this.translations;
  }

  private async loadDetails(): Promise<DetailData> {
    if (!this.details) {
      const raw = await this.readProjectText("data/zh_cn_details.json");
      const parsed = JSON.parse(raw) as DetailData;
      this.details = parsed;
      this.detailsNormalized = this.normalizeSections(parsed);
    }
    return this.details;
  }

  private normalizeSections<T extends Record<string, any>>(sections: T): T {
    const normalized: Record<string, any> = {};
    for (const [section, values] of Object.entries(sections)) {
      if (!values || typeof values !== "object") continue;
      normalized[section] = Object.fromEntries(Object.entries(values).map(([key, value]) => [this.toId(key), value]));
    }
    return normalized as T;
  }

  private zh(section: string, value: string | undefined): string {
    if (!value) return "";
    const direct = this.translations?.[section]?.[value];
    if (direct) return direct;
    const normalized = this.translationNormalized?.[section]?.[this.toId(value)];
    return normalized || value;
  }

  private detail(section: string, value: string | undefined): any {
    if (!value) return null;
    return this.details?.[section]?.[value] || this.detailsNormalized?.[section]?.[this.toId(value)] || null;
  }

  private detailDescription(section: string, value: string | undefined): string {
    const detail = this.detail(section, value);
    return detail?.description || "";
  }
}

export class BattleSession {
  protected readonly service: GameService;
  private readonly sim: ShowdownModule;
  private readonly playerTeam: PokemonSet[];
  private readonly enemyTeam: PokemonSet[];
  private readonly playerDisplay: RentalPokemon[];
  private readonly enemyDisplay: RentalPokemon[];
  private readonly initialPlayerState?: PlayerPokemonState[];
  private readonly playerSlotKeys: SlotKeySpec[];
  private readonly enemySlotKeys: SlotKeySpec[];
  private enemyAi: BattleAiProfile;
  private readonly seed: number | number[];
  private readonly battleSetting: BattleSetting;
  protected stream: any = null;
  private pendingMessages: Message[] = [];
  private pendingRawMessages: Message[] = [];
  private pendingRequestDiffs: RequestDiffLog[] = [];
  private pendingLineShowdownIds = new Map<string, string>();
  protected latestRequests: Record<string, BattleRequestView> = {};
  private plannedEnemyChoice: PlannedEnemyChoice | null = null;
  protected ended = false;
  private winner: string | null = null;
  private tracker = createBattleTracker();
  protected recentEvents: string[] = [];
  protected timelineEvents: BattleTimelineEvent[] = [];
  protected turnRecords: BattleTurnRecord[] = [];
  private timelineSeq = 0;
  private turnLogSeq = 0;
  private readonly battleLogId: string;
  private rngState: number;
  private sideMap: SideMap = {player: "p1", enemy: "p2"};

  constructor(service: GameService, sim: ShowdownModule, options: StartBattleOptions) {
    this.service = service;
    this.battleLogId = service.randomUUID();
    this.sim = sim;
    this.playerTeam = withShowdownTransportIds(service.normalizeBattleTeam(options.playerTeam));
    this.enemyTeam = withShowdownTransportIds(service.normalizeBattleTeam(options.enemyTeam));
    this.playerDisplay = withDisplayStableShowdownIds(options.playerDisplay, this.playerTeam);
    this.enemyDisplay = withDisplayStableShowdownIds(options.enemyDisplay, this.enemyTeam);
    this.initialPlayerState = options.playerState ? withStateStableShowdownIds(options.playerState, this.playerTeam, this.playerDisplay) : undefined;
    this.playerSlotKeys = buildSideSlotKeys(this.playerTeam, this.playerDisplay, this.initialPlayerState, "p1");
    this.enemySlotKeys = buildSideSlotKeys(this.enemyTeam, this.enemyDisplay, undefined, "p2");
    this.enemyAi = battleAiProfile(options.enemyAi);
    this.seed = options.seed;
    this.battleSetting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
    const seedValue = Array.isArray(options.seed) ? options.seed.reduce((acc, value) => acc ^ value, 0) : Number(options.seed);
    this.rngState = seedValue >>> 0;
  }

  private showdownBattleFormat(): string {
    if (this.battleSetting.battle_rule_preset === "gen8") return "gen8customgame";
    if (this.battleSetting.battle_rule_preset === "gen7") return "gen7customgame";
    return "gen9customgame";
  }

  private battleSystemEnabled(system: BattleSystemId): boolean {
    return this.battleSetting.enabled_battle_systems.includes(system);
  }

  private requestCanDynamax(request: BattleRequestView | null | undefined): boolean {
    return this.battleSystemEnabled("dynamax") && Boolean(request?.active?.[0]?.canDynamax);
  }

  private requestCanTerastallize(request: BattleRequestView | null | undefined): boolean {
    return this.battleSystemEnabled("terastal") && Boolean(request?.active?.[0]?.canTerastallize);
  }

  private requestCanMegaEvo(request: BattleRequestView | null | undefined): boolean {
    return this.battleSystemEnabled("mega") && Boolean(request?.active?.[0]?.canMegaEvo);
  }

  private requestCanZMove(request: BattleRequestView | null | undefined, index: number): unknown {
    return this.battleSystemEnabled("zmove") ? request?.active?.[0]?.canZMove?.[index] : undefined;
  }

  async start(): Promise<BattleState> {
    this.latestRequests = {};
    this.pendingMessages = [];
    this.pendingRawMessages = [];
    this.pendingRequestDiffs = [];
    this.pendingLineShowdownIds = new Map();
    this.ended = false;
    this.winner = null;
    this.tracker = createBattleTracker();
    this.recentEvents = [];
    this.timelineEvents = [];
    this.turnRecords = [];
    this.timelineSeq = 0;
    this.turnLogSeq = 0;
    this.stream = new this.sim.BattleStream({keepAlive: true});
    this.startReader();
    const init = [
      `>start ${JSON.stringify({formatid: this.showdownBattleFormat(), seed: this.service.seedArray(this.seed)})}`,
      `>player p1 ${JSON.stringify({name: "Player", team: this.sim.Teams.pack(this.playerTeam)})}`,
      `>player p2 ${JSON.stringify({name: "Enemy", team: this.sim.Teams.pack(this.enemyTeam)})}`,
    ].join("\n");
    await this.stream.write(init);
    await this.waitForMessages();
    this.consumePending();
    this.updateSideMapFromRequests();
    await this.chooseTeamPreview();
    this.updateSideMapFromRequests();
    if (this.initialPlayerState?.length) this.syncSideState(this.playerSide(), this.initialPlayerState);
    this.prepareEnemyChoice();
    return this.getState();
  }

  async choose(choice: string): Promise<BattleState> {
    if (!this.stream || this.ended) return this.getState();
    await this.chooseSide(this.playerSide(), choice);
    await this.resolveEnemyIfNeeded();
    this.prepareEnemyChoice();
    return this.getState();
  }

  async advanceIfWaiting(): Promise<BattleState> {
    if (!this.stream || this.ended) return this.getState();
    for (let guard = 0; guard < 6 && !this.ended; guard += 1) {
      const request = this.latestRequests[this.playerSide()];
      if (isForcedContinuationRequest(request)) {
        await this.chooseSide(this.playerSide(), "move 1");
        await this.resolveEnemyIfNeeded();
        continue;
      }
      if (request?.wait) {
        await this.resolveEnemyIfNeeded();
        continue;
      }
      break;
    }
    this.prepareEnemyChoice();
    return this.getState();
  }

  forfeit(): BattleState {
    if (!this.ended) {
      this.ended = true;
      this.winner = "Enemy";
      this.recentEvents.push("玩家认输。", "胜者：对手");
      this.timelineEvents.push(
        this.withTimelineId({type: "message", text: "玩家认输。", side: this.playerSide()}),
        this.withTimelineId({type: "win", text: "胜者：对手", side: this.enemySide()})
      );
      this.recordTurnSummary(this.tracker.turn || 0, this.timelineEvents.slice(-2));
    }
    return this.getState();
  }

  getState(): BattleState {
    return {
      ended: this.ended,
      winner: this.winner,
      request: this.latestRequests[this.playerSide()] || null,
      tracker: this.tracker,
      recent_events: this.recentEvents.slice(-30),
      timeline_events: this.timelineEvents.slice(-100),
      turn_records: this.turnRecords,
      player_team: this.playerTeam,
      player_display: this.playerDisplay,
      enemy_team: this.enemyTeam,
      enemy_display: this.enemyDisplay,
      player_side: this.playerSide(),
      enemy_side: this.enemySide(),
    };
  }

  getPlayerState(): PlayerPokemonState[] {
    return this.currentSideState(this.playerSide());
  }

  getEnemyState(): PlayerPokemonState[] {
    return this.currentSideState(this.enemySide());
  }

  syncPlayerState(states: PlayerPokemonState[]): BattleState {
    this.syncSideState(this.playerSide(), states);
    this.prepareEnemyChoice();
    return this.getState();
  }

  playerAiHint(): BattleAiHint {
    const request = this.latestRequests[this.playerSide()];
    if (!request || request.wait || request.teamPreview) throw new Error("当前不能请求 AI 提示。");
    const previousAi = this.enemyAi;
    try {
      this.enemyAi = battleAiProfile({
        level: "champion",
        knowledge: "active_only",
        personality: "adaptive",
        randomness: 0,
        allowSwitch: true,
        prediction: 0.88,
      });
      const candidates = this.playerAiHintCandidates(request);
      if (!candidates.length) throw new Error("当前没有可推荐的行动。");
      const alternatives = candidates.slice(0, 3).map(candidate => this.aiCandidateHint(candidate));
      return {...alternatives[0], alternatives: alternatives.slice(1)};
    } finally {
      this.enemyAi = previousAi;
    }
  }

  protected playerSide(): SideId {
    return this.sideMap.player;
  }

  protected enemySide(): SideId {
    return this.sideMap.enemy;
  }

  protected battleSide(side: SideId): any {
    return this.stream?.battle?.sides[side === "p2" ? 1 : 0];
  }

  private updateSideMapFromRequests(): void {
    const p1Score = sideTeamMatchScore(this.latestRequests.p1, this.playerTeam);
    const p2Score = sideTeamMatchScore(this.latestRequests.p2, this.playerTeam);
    if (!p1Score.available && !p2Score.available) return;
    if (p1Score.score > p2Score.score) {
      this.sideMap = {player: "p1", enemy: "p2"};
      return;
    }
    if (p2Score.score > p1Score.score) {
      this.sideMap = {player: "p2", enemy: "p1"};
      return;
    }
    throw new Error(`无法根据 Showdown 队伍识别玩家 side：p1=${p1Score.score}，p2=${p2Score.score}。`);
  }

  private async chooseTeamPreview(): Promise<void> {
    const playerRequest = this.latestRequests[this.playerSide()];
    const enemyRequest = this.latestRequests[this.enemySide()];
    if (playerRequest?.teamPreview) await this.chooseSide(this.playerSide(), this.playerTeamPreviewChoice(playerRequest));
    if (enemyRequest?.teamPreview) await this.chooseSide(this.enemySide(), this.enemyChoice(enemyRequest));
    this.updatePpMemory(this.latestRequests[this.playerSide()]);
  }

  private playerTeamPreviewChoice(request: BattleRequestView): string {
    const count = Math.max(1, request.side?.pokemon?.length || this.playerTeam.length || 3);
    return "team " + Array.from({length: count}, (_value, index) => index + 1).join("");
  }

  private async resolveEnemyIfNeeded(): Promise<void> {
    for (let guard = 0; guard < 6 && !this.ended; guard += 1) {
      const playerRequest = this.latestRequests[this.playerSide()];
      const enemyRequest = this.latestRequests[this.enemySide()];
      if (enemyRequest && !enemyRequest.wait) {
        await this.chooseSide(this.enemySide(), await this.consumeEnemyChoice(enemyRequest));
        continue;
      }
      if (!playerRequest || !playerRequest.wait) break;
      await this.waitForMessages();
      this.consumePending();
      const nextEnemyRequest = this.latestRequests[this.enemySide()];
      if (!nextEnemyRequest || nextEnemyRequest.wait) break;
    }
  }

  protected async chooseSide(side: SideId, choice: string): Promise<void> {
    await this.stream.write(`>${side} ${choice}`);
    await this.waitForMessages();
    this.consumePending();
    this.updatePpMemory(this.latestRequests[this.playerSide()]);
    if (side === this.enemySide()) this.prepareEnemyChoice();
  }

  protected async consumeEnemyChoice(request: BattleRequestView | null | undefined): Promise<string> {
    if (!request) return "default";
    const key = this.enemyRequestKey(request);
    if (this.plannedEnemyChoice?.key === key) {
      const choice = this.plannedEnemyChoice.choice || await this.plannedEnemyChoice.promise;
      this.plannedEnemyChoice = null;
      return choice;
    }
    return this.enemyChoice(request);
  }

  protected prepareEnemyChoice(): void {
    const request = this.latestRequests[this.enemySide()];
    if (!request || request.wait || this.ended) {
      this.plannedEnemyChoice = null;
      return;
    }
    const key = this.enemyRequestKey(request);
    if (this.plannedEnemyChoice?.key === key) return;
    const snapshot = cloneBattleRequests(this.latestRequests);
    const rngState = this.rngState;
    const planned: PlannedEnemyChoice = {
      key,
      startedAt: Date.now(),
      promise: new Promise(resolve => {
        setTimeout(() => {
          const previousRequests = this.latestRequests;
          const previousRng = this.rngState;
          try {
            this.latestRequests = snapshot;
            this.rngState = rngState;
            const choice = this.enemyChoice(snapshot[this.enemySide()]);
            const elapsed = Date.now() - planned.startedAt;
            if (elapsed > this.enemyAi.timeBudgetMs && protocolDebugEnabled()) {
              this.recentEvents.push(`AI 计算超时：${elapsed}ms / ${this.enemyAi.timeBudgetMs}ms`);
            }
            this.rngState = this.rngState === rngState ? previousRng : this.rngState;
            resolve(choice);
          } catch {
            this.rngState = previousRng;
            resolve(this.randomChoice(snapshot[this.enemySide()]));
          } finally {
            this.latestRequests = previousRequests;
          }
        }, 0);
      }),
    };
    planned.promise.then(choice => {
      if (this.plannedEnemyChoice?.key === key) this.plannedEnemyChoice.choice = choice;
    }).catch(() => undefined);
    this.plannedEnemyChoice = planned;
  }

  private enemyRequestKey(request: BattleRequestView): string {
    const activeMoves = (request.active?.[0]?.moves || []).map(move => `${move.id || move.move}:${move.pp}:${move.disabled ? 1 : 0}`).join(",");
    const sideState = (request.side?.pokemon || []).map(pokemon => `${pokemon.ident}:${pokemon.condition}:${pokemon.active ? 1 : 0}`).join("|");
    return [this.tracker.turn, request.teamPreview ? "team" : "", request.forceSwitch?.join(",") || "", activeMoves, sideState].join("#");
  }

  private startReader(): void {
    (async () => {
      for await (const chunk of this.stream) this.parseChunk(String(chunk));
    })().catch((error: Error) => {
      const data = error.stack || String(error);
      this.pendingMessages.push({type: "error", data});
      this.pendingRawMessages.push({type: "error", data});
    });
  }

  private parseChunk(chunk: string): void {
    const lines = chunk.split("\n");
    const type = lines.shift() || "";
    const data = lines.join("\n");
    if (protocolDebugEnabled()) battleLogLine("showdown", "chunk", {type, data, lines: data.split("\n")});
    this.pendingMessages.push({type, data});
    this.pendingRawMessages.push({type, data});
    if (type === "sideupdate") {
      const side = lines[0];
      for (const line of lines.slice(1)) {
        if (line.startsWith("|request|")) {
          const nextRequest = JSON.parse(line.slice("|request|".length));
          this.captureRequestHeals(side as SideId, this.latestRequests[side], nextRequest);
          this.latestRequests[side] = nextRequest;
        }
      }
    } else if (type === "update") {
      for (const line of lines) {
        if (line.startsWith("|win|")) {
          this.ended = true;
          this.winner = line.slice("|win|".length);
        } else if (line === "|tie") {
          this.ended = true;
          this.winner = "tie";
        }
      }
    } else if (type === "end") {
      this.ended = true;
    }
  }

  private consumePending(): void {
    if (!this.pendingMessages.length && !this.pendingRawMessages.length) return;
    const showdownDATA = logMessages(this.pendingRawMessages);
    const beforeTurn = this.tracker.turn;
    const protocolLines = splitLogLines(this.pendingMessages);
    const requestDiffs = this.pendingRequestDiffs.slice();
    const {events, timeline} = consumeLog(this.pendingMessages, this.tracker, this.service, this.latestRequests, this.pendingLineShowdownIds);
    this.applyRequestActiveToTracker("p1");
    this.applyRequestActiveToTracker("p2");
    const afterTurn = this.tracker.turn;
    const timelineWithIds = timeline.map(event => this.withTimelineId(event));
    this.logTurnSummary(beforeTurn, afterTurn, showdownDATA, protocolLines, requestDiffs, events, timelineWithIds);
    this.pendingMessages = [];
    this.pendingRawMessages = [];
    this.pendingRequestDiffs = [];
    this.pendingLineShowdownIds = new Map();
    this.recentEvents.push(...events);
    this.recentEvents = this.recentEvents.slice(-40);
    this.timelineEvents.push(...timelineWithIds);
    this.timelineEvents = this.timelineEvents.slice(-140);
    this.recordTurnSummary(afterTurn || beforeTurn || 0, timelineWithIds);
  }

  private logTurnSummary(beforeTurn: number, afterTurn: number, showdownDATA: LogMessage[], protocolLines: string[], requestDiffs: RequestDiffLog[], events: string[], timeline: BattleTimelineEvent[]): void {
    this.turnLogSeq += 1;
    const turn = afterTurn || beforeTurn || 0;
    battleTurnLogLine({
      id: `${this.battleLogId}:${this.turnLogSeq}`,
      create: new Date().toISOString(),
      name: turn > 0 ? `第 ${turn} 回合协议汇总 #${this.turnLogSeq}` : `战斗开局协议汇总 #${this.turnLogSeq}`,
      showdownDATA,
      reduceData: {
        before_turn: beforeTurn,
        after_turn: afterTurn,
        protocol_lines: protocolLines,
        request_diffs: requestDiffs,
        events,
        timeline,
        tracker: JSON.parse(JSON.stringify(this.tracker)) as BattleTracker,
      },
    });
  }

  protected recordTurnSummary(turn: number, timeline: BattleTimelineEvent[]): void {
    const meaningful = timeline.filter(event => event.text && event.type !== "debug");
    if (!meaningful.length && turn <= 0) return;
    const playerSide = this.playerSide();
    const enemySide = this.enemySide();
    const playerAction = this.actionForTurn(playerSide, meaningful);
    const enemyAction = this.actionForTurn(enemySide, meaningful);
    const eventTexts = meaningful.map(event => event.text).filter(Boolean).slice(-12);
    const summary = turnSummaryText(playerAction, enemyAction, eventTexts);
    const record: BattleTurnRecord = {
      id: `turn-${Math.max(0, turn)}`,
      turn: Math.max(0, turn),
      title: turn > 0 ? `第 ${turn} 回合` : "战斗开局",
      summary,
      player_action: playerAction,
      enemy_action: enemyAction,
      result_tags: turnResultTags(meaningful),
      event_texts: eventTexts,
      end_state: this.turnEndState(),
    };
    const existingIndex = this.turnRecords.findIndex(entry => entry.turn === record.turn);
    if (existingIndex >= 0) {
      const previous = this.turnRecords[existingIndex];
      this.turnRecords[existingIndex] = mergeTurnRecord(previous, record);
    } else {
      this.turnRecords.push(record);
      this.turnRecords.sort((left, right) => left.turn - right.turn);
    }
    this.turnRecords = this.turnRecords.slice(-80);
  }

  private actionForTurn(side: SideId, events: BattleTimelineEvent[]): BattleTurnAction | undefined {
    const direct = events.find(event => event.side === side && (event.type === "move" || event.type === "switch" || event.type === "item"));
    if (direct) return actionFromTimelineEvent(side, direct);
    const forfeit = events.find(event => event.type === "message" && event.side === side && /认输|forfeit/i.test(event.text));
    if (forfeit) return {side, kind: "forfeit", actor_name: SIDE_NAMES[side], label: forfeit.text};
    return undefined;
  }

  protected dialgaGraceTargetRecord(): BattleTurnRecord | null {
    const currentTurn = Math.max(1, Number(this.tracker.turn || this.turnRecords.at(-1)?.turn || 1));
    const targetTurn = Math.max(1, currentTurn - 3);
    const candidates = this.turnRecords.filter(record => record.turn > 0 && record.turn <= targetTurn && record.end_state?.player_team?.length);
    return candidates.at(-1) || this.turnRecords.find(record => record.end_state?.player_team?.length) || null;
  }

  private turnEndState(): BattleTurnEndState {
    return {
      player_team: this.turnPokemonStates(this.playerSide()),
      enemy_team: this.turnPokemonStates(this.enemySide()),
      weather: this.tracker.weather || "无",
      field: [...this.tracker.field],
      side_conditions: {
        p1: [...this.tracker.side_conditions.p1],
        p2: [...this.tracker.side_conditions.p2],
      },
    };
  }

  private turnPokemonStates(side: SideId): BattleTurnPokemonState[] {
    const display = this.displayForBattleSide(side);
    return this.currentSideState(side).map((state, index) => {
      const pokemon = findRentalByRuntime(display, state) || display[index];
      return {
        slot: Number(state.slot || index + 1),
        name: pokemon ? (pokemon.species_zh || pokemon.name || pokemon.species || state.species) : state.species || state.details || `Slot ${index + 1}`,
        showdown_id: state.showdown_id,
        species_id: pokemon?.species_id || toId(state.species || state.details),
        active: Boolean(state.active),
        hp: Math.max(0, Number(state.hp || 0)),
        max_hp: Math.max(1, Number(state.maxhp || 1)),
        hp_text: state.condition || stateCondition(state),
        status: state.status || statusFromCondition(state.condition),
        fainted: Boolean(state.fainted || Number(state.hp || 0) <= 0 || /\bfnt\b/i.test(state.condition || "")),
        pp: (state.moves || []).map(move => ({
          slot: Number(move.slot || 0),
          id: move.id,
          name: move.move,
          pp: Math.max(0, Number(move.pp || 0)),
          max_pp: Math.max(0, Number(move.maxpp || 0)),
        })),
      };
    });
  }

  private waitForMessages(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 25));
  }

  protected randomChoice(request: BattleRequestView | null | undefined): string {
    if (!request) return "default";
    if (request.teamPreview) {
      const indexes = Array.from({length: request.side?.pokemon?.length || 0}, (_, index) => index + 1);
      this.shuffle(indexes);
      return "team " + indexes.join("");
    }
    if (request.forceSwitch) {
      const switches = legalSwitchIndexes(request);
      return switches.length ? `switch ${this.pick(switches)}` : "default";
    }
    const moves = (request.active?.[0]?.moves || [])
      .map((move, index) => ({move, index: index + 1}))
      .filter(entry => !entry.move.disabled)
      .map(entry => entry.index);
    if (moves.length) {
      if (this.requestCanDynamax(request)) return `move ${this.pick(moves)} max`;
      if (this.requestCanTerastallize(request)) return `move ${this.pick(moves)} terastallize`;
      return this.requestCanMegaEvo(request) ? `move ${this.pick(moves)} mega` : `move ${this.pick(moves)}`;
    }
    const switches = legalSwitchIndexes(request);
    return switches.length ? `switch ${this.pick(switches)}` : "default";
  }

  protected enemyChoice(request: BattleRequestView | null | undefined): string {
    if (!request) return "default";
    if (request.teamPreview) return this.enemyTeamPreviewChoice(request);
    if (request.forceSwitch) return this.enemySwitchChoice(request);
    const searched = this.enemySearchChoice(request);
    if (searched) return searched;
    const switchChoice = this.enemyVoluntarySwitchChoice(request);
    if (switchChoice) return switchChoice;
    const moves = this.scoredEnemyMoves(request);
    if (moves.length) return this.pickScoredChoice(moves);
    return this.randomChoice(request);
  }

  private enemySearchChoice(request: BattleRequestView): string | null {
    if (this.enemyAi.depth <= 0) return null;
    const state = this.initialAiSearchState();
    if (!state) return null;
    const deadline = Date.now() + this.enemyAi.timeBudgetMs;
    const enemyCandidates = this.aiActionCandidates(this.enemySide(), state, request, this.enemyAi.candidateMoves, this.enemyAi.candidateSwitches);
    const playerCandidates = this.aiActionCandidates(this.playerSide(), state, this.latestRequests[this.playerSide()], this.enemyAi.opponentCandidates, 1, this.enemyAi.opponentCandidates);
    if (!enemyCandidates.length || !playerCandidates.length) return null;
    const scored: Array<{choice: string; score: number}> = [];
    for (const candidate of enemyCandidates) {
      if (Date.now() > deadline) break;
      scored.push({
        choice: candidate.choice,
        score: this.scoreSearchCandidate(state, candidate, playerCandidates, this.enemyAi.depth, deadline),
      });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.length ? this.pickScoredChoice(scored) : null;
  }

  private scoreSearchCandidate(state: AiSearchState, enemyAction: AiCandidate, playerCandidates: AiCandidate[], depth: number, deadline: number): number {
    const outcomes: number[] = [];
    for (const playerAction of playerCandidates) {
      if (Date.now() > deadline) break;
      const next = this.simulateAiTurn(state, enemyAction, playerAction);
      const value = depth > 1 ? this.aiSearchValue(next, depth - 1, deadline) : this.evaluateAiState(next);
      outcomes.push(value + enemyAction.score * 0.04 - playerAction.score * 0.015);
    }
    if (!outcomes.length) return this.evaluateAiState(state) + enemyAction.score * 0.04;
    const average = outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length;
    const worst = Math.min(...outcomes);
    return worst * this.enemyAi.prediction + average * (1 - this.enemyAi.prediction);
  }

  private aiSearchValue(state: AiSearchState, depth: number, deadline: number): number {
    if (depth <= 0 || Date.now() > deadline) return this.evaluateAiState(state);
    const searchedDepth = Math.max(0, this.enemyAi.depth - depth);
    const enemyMoveLimit = Math.max(2, this.enemyAi.candidateMoves - searchedDepth);
    const enemySwitchLimit = Math.max(0, Math.min(this.enemyAi.candidateSwitches, depth > 1 ? 1 : 0));
    const opponentLimit = Math.max(1, this.enemyAi.opponentCandidates - searchedDepth);
    const enemyCandidates = this.aiActionCandidates(this.enemySide(), state, undefined, enemyMoveLimit, enemySwitchLimit, enemyMoveLimit + enemySwitchLimit);
    const playerCandidates = this.aiActionCandidates(this.playerSide(), state, undefined, opponentLimit, 1, opponentLimit);
    if (!enemyCandidates.length || !playerCandidates.length) return this.evaluateAiState(state);
    let best = -Infinity;
    for (const enemyAction of enemyCandidates) {
      const score = this.scoreSearchCandidate(state, enemyAction, playerCandidates, depth, deadline);
      if (score > best) best = score;
      if (Date.now() > deadline) break;
    }
    return Number.isFinite(best) ? best : this.evaluateAiState(state);
  }

  private initialAiSearchState(): AiSearchState | null {
    const p1 = this.aiSideState("p1", this.displayForBattleSide("p1"), this.latestRequests.p1);
    const p2 = this.aiSideState("p2", this.displayForBattleSide("p2"), this.latestRequests.p2);
    if (!p1.pokemon.length || !p2.pokemon.length) return null;
    return {p1: p1.pokemon, p2: p2.pokemon, active: {p1: p1.active, p2: p2.active}};
  }

  private aiSideState(side: SideId, display: RentalPokemon[], request: BattleRequestView | undefined): {pokemon: AiPokemonState[]; active: number} {
    let active = 0;
    const pokemon = display.map((entry, index) => {
      const runtime = request?.side?.pokemon?.find(candidate => {
        const runtimeDisplay = side === "p1" ? findRentalByRuntime(this.playerDisplay, candidate.ident) : findRentalByRuntime(this.enemyDisplay, candidate.ident);
        return runtimeDisplay?.species_id === entry.species_id;
      });
      const hp = parseConditionHp(runtime?.condition);
      if (runtime?.active) active = index;
      const maxHp = Number(hp?.max || entry.stats?.hp || entry.base_stats?.hp || 1);
      const currentHp = String(runtime?.condition || "").endsWith(" fnt") ? 0 : Number(hp?.current ?? maxHp);
      return {display: entry, hp: Math.max(0, Math.min(maxHp, currentHp)), maxHp, slot: index + 1, active: Boolean(runtime?.active)};
    });
    return {pokemon, active};
  }

  private aiActionCandidates(side: SideId, state: AiSearchState, request: BattleRequestView | undefined, moveLimit: number, switchLimit: number, totalLimit = moveLimit + switchLimit): AiCandidate[] {
    const sideState = state[side];
    const activeIndex = state.active[side];
    const active = sideState[activeIndex];
    const opponent = this.aiActive(state, side === "p1" ? "p2" : "p1");
    if (!active || active.hp <= 0 || !opponent) return [];
    const moves = this.aiMoveCandidates(side, active, opponent, request).slice(0, moveLimit);
    const switches = this.aiSwitchCandidates(side, state, switchLimit);
    const combined = [...moves, ...switches].sort((a, b) => b.score - a.score).slice(0, Math.max(1, totalLimit));
    return combined.length ? combined : [{side, kind: "move", choice: "default", score: this.evaluateAiState(state)}];
  }

  private playerAiHintCandidates(request: BattleRequestView): AiCandidate[] {
    const state = this.playerVisibleAiSearchState();
    if (!state) return [];
    if (request.forceSwitch) return this.aiSwitchCandidates(this.playerSide(), state, 6).slice(0, 3);
    return this.aiActionCandidates(this.playerSide(), state, request, 4, 2, 6);
  }

  private playerVisibleAiSearchState(): AiSearchState | null {
    const playerSide = this.playerSide();
    const enemySide = this.enemySide();
    const player = this.aiSideState(playerSide, this.displayForBattleSide(playerSide), this.latestRequests[playerSide]);
    const enemy = this.visibleEnemyAiSideState(enemySide);
    if (!player.pokemon.length || !enemy.pokemon.length) return null;
    const state = {
      p1: playerSide === "p1" ? player.pokemon : enemy.pokemon,
      p2: playerSide === "p2" ? player.pokemon : enemy.pokemon,
      active: {
        p1: playerSide === "p1" ? player.active : enemy.active,
        p2: playerSide === "p2" ? player.active : enemy.active,
      },
    };
    return state;
  }

  private visibleEnemyAiSideState(side: SideId): {pokemon: AiPokemonState[]; active: number} {
    const runtime = this.activeRuntime(side);
    const display = runtime ? findRentalByRuntime(this.displayForBattleSide(side), runtime) : this.activeDisplay(side);
    if (!display) return {pokemon: [], active: 0};
    const hp = parseConditionHp(runtime?.condition);
    const maxHp = Math.max(1, Number(hp?.max || display.stats?.hp || display.base_stats?.hp || 1));
    const currentHp = String(runtime?.condition || "").endsWith(" fnt") ? 0 : Number(hp?.current ?? maxHp);
    return {
      pokemon: [{
        display,
        hp: Math.max(0, Math.min(maxHp, currentHp)),
        maxHp,
        slot: 1,
        active: true,
      }],
      active: 0,
    };
  }

  private aiCandidateHint(candidate: AiCandidate): BattleAiHintAlternative {
    return {
      choice: candidate.choice,
      choice_label: this.aiCandidateChoiceLabel(candidate),
      title: this.aiCandidateTitle(candidate),
      reason: this.aiCandidateReason(candidate),
      score: Math.round(candidate.score),
    };
  }

  private aiCandidateMoveName(candidate: AiCandidate): string {
    const raw = candidate.moveRequest?.id || candidate.move?.id || candidate.moveRequest?.move || candidate.move?.name || "";
    const translated = this.service.plain("moves", raw);
    if (translated && toId(translated) !== toId(raw)) return translated;
    return candidate.moveRequest?.move || candidate.move?.name || `第 ${candidate.moveSlot || "?"} 招`;
  }

  private aiCandidateChoiceLabel(candidate: AiCandidate): string {
    if (candidate.kind === "switch") return `换上第 ${candidate.switchSlot || "?"} 只`;
    if (candidate.kind === "move") {
      const slot = candidate.moveSlot || candidate.choice.match(/^move\s+(\d+)/i)?.[1] || "?";
      if (candidate.battleSystem === "mega") return `第 ${slot} 招 + Mega`;
      if (candidate.battleSystem === "zmove") return `第 ${slot} 招 + Z招式`;
      if (candidate.battleSystem === "max") return `第 ${slot} 招 + 极巨化`;
      if (candidate.battleSystem === "terastallize") return `第 ${slot} 招 + 太晶化`;
      return `第 ${slot} 招`;
    }
    return "默认行动";
  }

  private aiCandidateTitle(candidate: AiCandidate): string {
    if (candidate.kind === "switch") {
      const name = candidate.pokemon ? displayNameForAi(candidate.pokemon) : `第 ${candidate.switchSlot || "?"} 只`;
      return `换上 ${name}`;
    }
    if (candidate.kind === "move") {
      const moveName = this.aiCandidateMoveName(candidate);
      if (candidate.battleSystem === "mega") return `Mega 后使用 ${moveName}`;
      if (candidate.battleSystem === "zmove") return `释放 Z 招式：${moveName}`;
      if (candidate.battleSystem === "max") return `极巨化后使用 ${moveName}`;
      if (candidate.battleSystem === "terastallize") return `太晶化后使用 ${moveName}`;
      return `使用 ${moveName}`;
    }
    return "默认行动";
  }

  private aiCandidateReason(candidate: AiCandidate): string {
    if (candidate.kind === "switch") {
      const name = candidate.pokemon ? displayNameForAi(candidate.pokemon) : `第 ${candidate.switchSlot || "?"} 只`;
      return `冠军 AI 判断当前站场压力偏高，换上 ${name} 的综合评分更好，可以降低承伤或提高反打空间。`;
    }
    if (candidate.kind !== "move" || !candidate.move) return "当前没有找到更稳定的合法行动，建议走默认行动。";
    const active = this.activeDisplay(candidate.side);
    const target = this.activeDisplay(candidate.side === "p1" ? "p2" : "p1");
    const targetHp = this.activeHpValue(candidate.side === "p1" ? "p2" : "p1");
    const damage = Math.round(this.estimatedMoveDamage(candidate.move, active, target));
    const effectiveness = this.typeMultiplier(candidate.move.type, target);
    const parts: string[] = ["冠军 AI 在当前可见局势下给出最高评分。"];
    if (candidate.move.category === "Status" || !Number(candidate.move.basePower || candidate.move.damage)) {
      parts.push("这是变化类选择，主要价值在异常、强化、控场或节奏。");
    } else {
      parts.push(`预计伤害约 ${Math.max(0, damage)}。`);
      if (effectiveness >= 2) parts.push("属性克制对手。");
      else if (effectiveness > 0 && effectiveness < 1) parts.push("属性效果一般偏低。");
      else if (effectiveness <= 0) parts.push("属性可能无效，需要谨慎。");
      if (targetHp > 0 && damage >= targetHp) parts.push("有机会直接击倒当前对手。");
    }
    if (candidate.battleSystem === "mega") parts.push("同时发动 Mega 提升站场能力。");
    if (candidate.battleSystem === "zmove") parts.push("同时消耗 Z 招式争取爆发。");
    if (candidate.battleSystem === "max") parts.push("同时极巨化争取回合压制。");
    if (candidate.battleSystem === "terastallize") parts.push("同时太晶化改变攻防节奏。");
    return parts.join("");
  }

  private aiMoveCandidates(side: SideId, active: AiPokemonState, opponent: AiPokemonState, request: BattleRequestView | undefined): AiCandidate[] {
    const dex = this.sim.Dex.mod("gen7");
    const exactMovesAllowed = side === this.enemySide()
      || (side === this.playerSide() && Boolean(request?.active?.[0]?.moves?.length))
      || this.enemyAi.knowledge === "party_sets"
      || this.enemyAi.knowledge === "omniscient";
    if (exactMovesAllowed && request?.active?.[0]?.moves?.length) {
      const canMegaEvo = this.requestCanMegaEvo(request);
      const canDynamax = this.requestCanDynamax(request);
      const canTerastallize = this.requestCanTerastallize(request);
      const maxMoves = request.active[0].maxMoves?.maxMoves || [];
      return request.active[0].moves
        .map((moveRequest, index) => ({moveRequest, index: index + 1, move: dex.moves.get(moveRequest.id || moveRequest.move)}))
        .filter(entry => !entry.moveRequest.disabled && Number(entry.moveRequest.pp ?? 1) > 0 && entry.move?.exists)
        .flatMap(entry => {
          const score = this.scoreAiMove(side, entry.move, active, opponent);
          const base = {
            side,
            kind: "move" as const,
            move: entry.move,
            moveRequest: entry.moveRequest,
          };
          if (side === "p2" && this.avoidsBattleSystemAi()) return [{...base, choice: `move ${entry.index}`, score}];
          const candidates: AiCandidate[] = canDynamax && maxMoves[entry.index - 1] ? [{...base, choice: `move ${entry.index} max`, score: score + 78, moveSlot: entry.index, battleSystem: "max"}] : [];
          if (canTerastallize) candidates.push({...base, choice: `move ${entry.index} terastallize`, score: score + 76, moveSlot: entry.index, battleSystem: "terastallize"});
          if (canMegaEvo) candidates.push({...base, choice: `move ${entry.index} mega`, score: score + 75, moveSlot: entry.index, battleSystem: "mega"});
          const zMove = this.requestCanZMove(request, entry.index - 1);
          if (zMove) candidates.push({...base, choice: `move ${entry.index} zmove`, score: score + 80, moveSlot: entry.index, battleSystem: "zmove"});
          candidates.push({...base, choice: `move ${entry.index}`, score, moveSlot: entry.index});
          return candidates;
        })
        .sort((a, b) => b.score - a.score);
    }
    const sourceMoves = exactMovesAllowed
      ? (active.display.moves || []).map((move, index) => ({move: dex.moves.get(move.id || move.name), index: index + 1}))
      : this.predictedTypeMoves(active.display).map((move, index) => ({move, index: index + 1}));
    return sourceMoves
      .filter(entry => entry.move?.exists !== false)
      .map(entry => ({
        side,
        kind: "move" as const,
        choice: `move ${entry.index}`,
        move: entry.move,
        moveSlot: entry.index,
        score: this.scoreAiMove(side, entry.move, active, opponent),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private predictedTypeMoves(pokemon: RentalPokemon): any[] {
    const category = this.preferredAttackCategory(pokemon);
    return (pokemon.types?.length ? pokemon.types : ["Normal"]).map(type => ({
      exists: true,
      id: `predicted${toId(type)}`,
      name: `${type} attack`,
      type,
      category,
      basePower: 70,
      accuracy: 100,
      priority: 0,
    }));
  }

  private aiSwitchCandidates(side: SideId, state: AiSearchState, limit: number): AiCandidate[] {
    if (!this.enemyAi.allowSwitch || limit <= 0) return [];
    const opponent = this.aiActive(state, side === "p1" ? "p2" : "p1");
    if (!opponent) return [];
    const activeIndex = state.active[side];
    return state[side]
      .map((pokemon, index) => ({pokemon, index}))
      .filter(entry => entry.index !== activeIndex && entry.pokemon.hp > 0)
      .map(entry => {
        const personality = side === "p2" ? this.personalityWeights() : BATTLE_AI_PERSONALITY_WEIGHTS.balanced;
        const pressure = this.bestMovePressure(entry.pokemon.display, opponent.display);
        const incoming = this.aiIncomingDamage(side, entry.pokemon, state);
        const hpRatio = entry.pokemon.maxHp ? entry.pokemon.hp / entry.pokemon.maxHp : 1;
        const score = pressure * 0.8 * personality.damage - incoming * 0.55 * personality.defense + hpRatio * 28 * personality.switch + this.nextRandom() * 4;
        return {side, kind: "switch" as const, choice: `switch ${entry.pokemon.slot}`, switchSlot: entry.pokemon.slot, pokemon: entry.pokemon.display, score};
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private scoreAiMove(side: SideId, move: any, attacker: AiPokemonState, target: AiPokemonState): number {
    const accuracy = typeof move.accuracy === "number" ? move.accuracy / 100 : 1;
    const personality = side === "p2" ? this.personalityWeights() : BATTLE_AI_PERSONALITY_WEIGHTS.balanced;
    if (side === "p2" && this.isSoulSickAi()) return this.scoreSoulSickMove(move, attacker.display, target.display, target.hp) * accuracy;
    if (move.category === "Status" || !Number(move.basePower || move.damage)) {
      const statusBase = move.status ? 44 * this.enemyAi.statusAwareness * personality.status : 14;
      const setupBase = (move.boosts || move.self?.boosts) ? 38 * this.enemyAi.setupAwareness * personality.setup : 0;
      return (statusBase + setupBase) * accuracy;
    }
    const damage = this.estimatedMoveDamage(move, attacker.display, target.display) * accuracy;
    const effectiveness = this.typeMultiplier(move.type, target.display);
    let score = damage * personality.damage;
    if (effectiveness <= 0) score -= 120;
    else if (effectiveness >= 4) score += 48;
    else if (effectiveness >= 2) score += 26;
    else if (effectiveness < 1) score -= 18;
    if (attacker.display.types?.includes(move.type)) score += 12;
    if (damage >= target.hp && target.hp > 0) score += (side === "p2" ? 110 : 95) * personality.ko;
    if (move.recoil || move.hasCrashDamage) score -= 10 * personality.riskPenalty;
    if (move.selfdestruct) score -= (attacker.hp / Math.max(1, attacker.maxHp) > 0.25 ? 80 : 15) * personality.riskPenalty;
    return score;
  }

  private simulateAiTurn(state: AiSearchState, enemyAction: AiCandidate, playerAction: AiCandidate): AiSearchState {
    const next = this.cloneAiState(state);
    this.applyAiSwitch(next, playerAction);
    this.applyAiSwitch(next, enemyAction);
    const actions = [playerAction, enemyAction]
      .filter(action => action.kind === "move")
      .sort((a, b) => this.aiActionOrder(next, b) - this.aiActionOrder(next, a));
    for (const action of actions) this.applyAiMove(next, action);
    this.promoteFaintedAiActive(next, "p1");
    this.promoteFaintedAiActive(next, "p2");
    return next;
  }

  private cloneAiState(state: AiSearchState): AiSearchState {
    return {
      p1: state.p1.map(pokemon => ({...pokemon})),
      p2: state.p2.map(pokemon => ({...pokemon})),
      active: {...state.active},
    };
  }

  private applyAiSwitch(state: AiSearchState, action: AiCandidate): void {
    if (action.kind !== "switch" || !action.switchSlot) return;
    const index = state[action.side].findIndex(pokemon => pokemon.slot === action.switchSlot && pokemon.hp > 0);
    if (index >= 0) state.active[action.side] = index;
  }

  private applyAiMove(state: AiSearchState, action: AiCandidate): void {
    const attacker = this.aiActive(state, action.side);
    const targetSide = action.side === "p1" ? "p2" : "p1";
    const target = this.aiActive(state, targetSide);
    if (!attacker || !target || attacker.hp <= 0 || target.hp <= 0 || !action.move) return;
    if (action.move.category === "Status" || !Number(action.move.basePower || action.move.damage)) return;
    const accuracy = typeof action.move.accuracy === "number" ? action.move.accuracy / 100 : 1;
    const damage = this.estimatedMoveDamage(action.move, attacker.display, target.display) * accuracy;
    target.hp = Math.max(0, target.hp - damage);
    if (action.move.selfdestruct) attacker.hp = 0;
    if (action.move.recoil && damage > 0) attacker.hp = Math.max(0, attacker.hp - damage * 0.25);
  }

  private aiActionOrder(state: AiSearchState, action: AiCandidate): number {
    const active = this.aiActive(state, action.side);
    const priority = Number(action.move?.priority || 0);
    const speed = Number(active?.display.stats?.spe || active?.display.base_stats?.spe || 0);
    return priority * 10000 + speed;
  }

  private promoteFaintedAiActive(state: AiSearchState, side: SideId): void {
    const active = this.aiActive(state, side);
    if (active && active.hp > 0) return;
    const nextIndex = state[side].findIndex(pokemon => pokemon.hp > 0);
    if (nextIndex >= 0) state.active[side] = nextIndex;
  }

  private evaluateAiState(state: AiSearchState): number {
    const personality = this.personalityWeights();
    const enemyAlive = state[this.enemySide()].filter(pokemon => pokemon.hp > 0);
    const playerAlive = state[this.playerSide()].filter(pokemon => pokemon.hp > 0);
    if (!playerAlive.length) return 100000;
    if (!enemyAlive.length) return -100000;
    const enemyHp = enemyAlive.reduce((sum, pokemon) => sum + pokemon.hp / Math.max(1, pokemon.maxHp), 0);
    const playerHp = playerAlive.reduce((sum, pokemon) => sum + pokemon.hp / Math.max(1, pokemon.maxHp), 0);
    const enemyActive = this.aiActive(state, this.enemySide());
    const playerActive = this.aiActive(state, this.playerSide());
    const pressure = enemyActive && playerActive ? this.bestMovePressure(enemyActive.display, playerActive.display) - this.aiIncomingDamage(this.enemySide(), enemyActive, state) : 0;
    return enemyHp * 120 * personality.defense - playerHp * 120 * personality.damage + (enemyAlive.length - playerAlive.length) * 180 + pressure * 0.35 * personality.damage;
  }

  private aiIncomingDamage(side: SideId, defender: AiPokemonState, state: AiSearchState): number {
    const attacker = this.aiActive(state, side === "p1" ? "p2" : "p1");
    if (!attacker) return 0;
    const exact = side === "p1" || this.enemyAi.knowledge === "party_sets" || this.enemyAi.knowledge === "omniscient";
    const moves = exact
      ? (attacker.display.moves || []).map(move => this.sim.Dex.mod("gen7").moves.get(move.id || move.name)).filter((move: any) => move?.exists)
      : this.predictedTypeMoves(attacker.display);
    if (!moves.length) return 0;
    return Math.max(...moves.map((move: any) => this.estimatedMoveDamage(move, attacker.display, defender.display)));
  }

  private aiActive(state: AiSearchState, side: SideId): AiPokemonState | undefined {
    return state[side][state.active[side]];
  }

  private personalityWeights(): BattleAiPersonalityWeights {
    return BATTLE_AI_PERSONALITY_WEIGHTS[this.enemyAi.personality] || BATTLE_AI_PERSONALITY_WEIGHTS.balanced;
  }

  private enemyTeamPreviewChoice(request: BattleRequestView): string {
    const indexes = Array.from({length: request.side?.pokemon?.length || 0}, (_value, index) => index + 1);
    if (!indexes.length) return "default";
    return "team " + indexes.join("");
  }

  private enemySwitchChoice(request: BattleRequestView): string {
    const switches = this.scoredEnemySwitches(request);
    if (switches.length) return this.pickScoredChoice(switches);
    return this.randomChoice(request);
  }

  private enemyVoluntarySwitchChoice(request: BattleRequestView): string | null {
    if (!this.enemyAi.allowSwitch || this.enemyAi.switchAwareness <= 0) return null;
    const switches = this.scoredEnemySwitches(request);
    if (!switches.length) return null;
    const active = this.activeDisplay(this.enemySide());
    const player = this.activeDisplay(this.playerSide());
    if (!active || !player) return null;
    const hp = this.activeHpFraction(this.enemySide());
    const currentPressure = this.bestMovePressure(active, player);
    const incomingRisk = this.estimatedIncomingDamage(active);
    const bestSwitch = switches[0];
    const danger = incomingRisk > this.activeHpValue(this.enemySide()) * 0.85 || hp < 0.28 || currentPressure < 24;
    const enoughGain = bestSwitch.score > currentPressure + 18;
    const switchChance = this.enemyAi.switchAwareness * (danger ? 0.75 : 0.22) * (enoughGain ? 1 : 0.45);
    return this.nextRandom() < switchChance ? bestSwitch.choice : null;
  }

  private scoredEnemyMoves(request: BattleRequestView): Array<{choice: string; score: number}> {
    const canMegaEvo = this.requestCanMegaEvo(request);
    const canDynamax = this.requestCanDynamax(request);
    const canTerastallize = this.requestCanTerastallize(request);
    const maxMoves = request.active?.[0]?.maxMoves?.maxMoves || [];
    const moves = (request.active?.[0]?.moves || [])
      .map((move, index) => ({move, index: index + 1}))
      .filter(entry => !entry.move.disabled && Number(entry.move.pp ?? 1) > 0);
    const active = this.activeDisplay(this.enemySide());
    const target = this.activeDisplay(this.playerSide());
    return moves.flatMap(entry => {
      const score = this.scoreEnemyMove(entry.move, active, target);
      const zMove = this.requestCanZMove(request, entry.index - 1);
      if (this.avoidsBattleSystemAi()) return [{choice: `move ${entry.index}`, score}];
      const candidates = canDynamax && maxMoves[entry.index - 1] ? [{choice: `move ${entry.index} max`, score: score + 78}] : [];
      if (canTerastallize) candidates.push({choice: `move ${entry.index} terastallize`, score: score + 76});
      if (canMegaEvo) candidates.push({choice: `move ${entry.index} mega`, score: score + 75});
      if (zMove) candidates.push({choice: `move ${entry.index} zmove`, score: score + 80});
      candidates.push({choice: `move ${entry.index}`, score});
      return candidates;
    })
      .sort((a, b) => b.score - a.score);
  }

  private isSoulSickAi(): boolean {
    return this.enemyAi.personality === "soul_sick";
  }

  private isRookieAi(): boolean {
    return this.enemyAi.personality === "rookie";
  }

  private avoidsBattleSystemAi(): boolean {
    return this.isSoulSickAi() || this.isRookieAi();
  }

  private scoredEnemySwitches(request: BattleRequestView): Array<{choice: string; score: number}> {
    const player = this.activeDisplay(this.playerSide());
    return legalSwitchIndexes(request)
      .map(index => {
        const display = this.enemyDisplay[index - 1];
        const score = display && player ? this.scoreSwitchTarget(display, player) : 0;
        return {choice: `switch ${index}`, score};
      })
      .sort((a, b) => b.score - a.score);
  }

  private pickScoredChoice(entries: Array<{choice: string; score: number}>): string {
    if (!entries.length) return "default";
    if (this.nextRandom() < this.enemyAi.randomness) return this.pick(entries).choice;
    const fuzz = Math.max(4, 18 * this.enemyAi.randomness);
    const ranked = entries
      .map(entry => ({...entry, score: entry.score + (this.nextRandom() * 2 - 1) * fuzz}))
      .sort((a, b) => b.score - a.score);
    return ranked[0].choice;
  }

  private scoreEnemyMove(requestMove: BattleMoveRequest, attacker: RentalPokemon | undefined, target: RentalPokemon | undefined): number {
    const dex = this.sim.Dex.mod("gen7");
    const move = dex.moves.get(requestMove.id || requestMove.move);
    if (!move?.exists) return 10;
    const personality = this.personalityWeights();
    const accuracy = typeof move.accuracy === "number" ? move.accuracy / 100 : 1;
    const targetHp = this.activeHpValue(this.playerSide());
    if (this.isSoulSickAi()) return this.scoreSoulSickMove(move, attacker, target, targetHp) * accuracy;
    if (move.category === "Status" || !Number(move.basePower || move.damage)) {
      return this.scoreStatusMove(move, target) * accuracy;
    }
    const damage = this.estimatedMoveDamage(move, attacker, target);
    let score = damage * accuracy * personality.damage;
    const effectiveness = this.typeMultiplier(move.type, target);
    if (effectiveness <= 0) score -= 120;
    else if (effectiveness >= 4) score += 48;
    else if (effectiveness >= 2) score += 26;
    else if (effectiveness < 1) score -= 18;
    if (attacker?.types?.includes(move.type)) score += 12;
    if (Number(move.priority || 0) > 0 && this.activeHpFraction(this.enemySide()) < 0.35) score += 16;
    if (targetHp > 0 && damage >= targetHp) score += (90 + this.enemyAi.prediction * 35) * personality.ko;
    if (this.enemyAi.depth > 0) {
      const incoming = this.estimatedIncomingDamage(attacker);
      if (incoming >= this.activeHpValue(this.enemySide()) && damage < targetHp) score -= 24 * this.enemyAi.prediction;
      if (damage >= targetHp && incoming >= this.activeHpValue(this.enemySide())) score += 35 * this.enemyAi.prediction;
    }
    if (move.recoil || move.hasCrashDamage) score -= 10 * personality.riskPenalty;
    if (move.selfdestruct) score -= (this.activeHpFraction("p2") > 0.25 ? 80 : 15) * personality.riskPenalty;
    return score;
  }

  private scoreSoulSickMove(move: any, attacker: RentalPokemon | undefined, target: RentalPokemon | undefined, targetHp: number): number {
    const effectiveness = this.typeMultiplier(move.type, target);
    if (move.category === "Status" || !Number(move.basePower || move.damage)) {
      let score = 38;
      if (move.boosts || move.self?.boosts) score -= 10;
      if (move.status || move.volatileStatus) score += 4;
      if (effectiveness <= 0 && !move.status && !move.boosts && !move.self?.boosts) score += 36;
      return score + this.nextRandom() * 3;
    }
    const basePower = Math.max(1, Number(move.basePower || move.damage || 1));
    const damage = this.estimatedMoveDamage(move, attacker, target);
    let score = Math.max(0, 130 - basePower);
    if (effectiveness <= 0) score += 140;
    else if (effectiveness < 1) score += 72;
    else if (effectiveness >= 4) score -= 92;
    else if (effectiveness >= 2) score -= 58;
    if (attacker?.types?.includes(move.type)) score -= 10;
    if (targetHp > 0 && damage >= targetHp) score -= 130;
    if (Number(move.priority || 0) > 0 && this.activeHpFraction(this.enemySide()) < 0.35) score -= 16;
    if (move.recoil || move.hasCrashDamage) score += 8;
    if (move.selfdestruct) score += 24;
    return score + this.nextRandom() * 3;
  }

  private scoreStatusMove(move: any, target: RentalPokemon | undefined): number {
    const enemyHp = this.activeHpFraction(this.enemySide());
    const targetStatus = toId(this.activeRuntime(this.playerSide())?.condition?.split(" ").slice(1).join(" ") || "");
    const personality = this.personalityWeights();
    let score = 14;
    if (move.status && !targetStatus) score += 52 * this.enemyAi.statusAwareness * personality.status;
    if (move.volatileStatus) score += 24 * this.enemyAi.statusAwareness * personality.status;
    if (move.boosts || move.self?.boosts) score += (enemyHp > 0.45 ? 44 : 18) * this.enemyAi.setupAwareness * personality.setup;
    if (move.sideCondition || move.pseudoWeather || move.weather || move.terrain) score += 28 * Math.max(this.enemyAi.statusAwareness, this.enemyAi.setupAwareness);
    if (move.forceSwitch || move.selfSwitch) score += 10 * this.enemyAi.prediction;
    if (this.typeMultiplier(move.type, target) <= 0 && !move.status && !move.boosts && !move.self?.boosts) score -= 50;
    if (enemyHp < 0.22 && !move.priority) score -= 22;
    return score;
  }

  private scoreSwitchTarget(candidate: RentalPokemon, player: RentalPokemon): number {
    const personality = this.personalityWeights();
    const incoming = this.estimatedIncomingDamage(candidate);
    const pressure = this.bestMovePressure(candidate, player);
    const hp = Math.max(0.1, this.runtimeHpFraction(this.runtimeForDisplay(this.enemySide(), candidate)));
    return pressure * 0.8 * personality.damage - incoming * 0.55 * personality.defense + hp * 24 * personality.switch + this.nextRandom() * 6;
  }

  private bestMovePressure(attacker: RentalPokemon, target: RentalPokemon): number {
    const moves = attacker.moves || [];
    if (!moves.length) return 0;
    return Math.max(...moves.map(move => {
      const dexMove = this.sim.Dex.mod("gen7").moves.get(move.id || move.name);
      return dexMove?.exists ? this.estimatedMoveDamage(dexMove, attacker, target) : 0;
    }));
  }

  private estimatedIncomingDamage(defender: RentalPokemon | undefined): number {
    const player = this.activeDisplay(this.playerSide());
    if (!player || !defender) return 0;
    const canUseExactMoves = this.enemyAi.knowledge === "party_sets" || this.enemyAi.knowledge === "omniscient";
    if (canUseExactMoves) {
      const requestMoves = this.latestRequests[this.playerSide()]?.active?.[0]?.moves || [];
      const moveIds = requestMoves.length ? requestMoves.map(move => move.id || move.move) : (player.moves || []).map(move => move.id || move.name);
      if (!moveIds.length) return 0;
      return Math.max(...moveIds.map(moveId => {
        const move = this.sim.Dex.mod("gen7").moves.get(moveId);
        return move?.exists ? this.estimatedMoveDamage(move, player, defender) : 0;
      }));
    }
    const likelyTypes = player.types?.length ? player.types : ["Normal"];
    return Math.max(...likelyTypes.map(type => this.estimatedMoveDamage({type, basePower: 70, category: this.preferredAttackCategory(player)}, player, defender)));
  }

  private preferredAttackCategory(pokemon: RentalPokemon): "Physical" | "Special" {
    return Number(pokemon.stats?.spa || pokemon.base_stats?.spa || 0) > Number(pokemon.stats?.atk || pokemon.base_stats?.atk || 0) ? "Special" : "Physical";
  }

  private estimatedMoveDamage(move: any, attacker: RentalPokemon | undefined, target: RentalPokemon | undefined): number {
    if (!attacker || !target) return Number(move.basePower || move.damage || 35);
    if (!this.canHit(move.type, target)) return 0;
    const power = Number(move.basePower || move.damage || 50);
    const level = Number(attacker.level || 50);
    const category = move.category === "Special" ? "Special" : "Physical";
    const offensiveStat = category === "Special" ? "spa" : "atk";
    const defensiveStat = category === "Special" ? "spd" : "def";
    const attack = Math.max(1, Number(attacker.stats?.[offensiveStat] || attacker.base_stats?.[offensiveStat] || 70));
    const defense = Math.max(1, Number(target.stats?.[defensiveStat] || target.base_stats?.[defensiveStat] || 70));
    const stab = attacker.types?.includes(move.type) ? 1.5 : 1;
    const type = this.typeMultiplier(move.type, target);
    return (((2 * level / 5 + 2) * power * attack / defense) / 50 + 2) * stab * type;
  }

  private typeMultiplier(moveType: string, target: RentalPokemon | undefined): number {
    if (!moveType || !target) return 1;
    const dex = this.sim.Dex.mod("gen7");
    const species = dex.species.get(target.species_id || target.species || target.name);
    const typeTarget = species?.exists ? species : {types: target.types || []};
    if (!dex.getImmunity(moveType, typeTarget)) return 0;
    return 2 ** dex.getEffectiveness(moveType, typeTarget);
  }

  private canHit(moveType: string, target: RentalPokemon | undefined): boolean {
    return this.typeMultiplier(moveType, target) > 0;
  }

  private activeDisplay(side: SideId): RentalPokemon | undefined {
    const runtime = this.activeRuntime(side);
    if (!runtime) return undefined;
    return findRentalByRuntime(this.displayForBattleSide(side), runtime);
  }

  private activeRuntime(side: SideId): RuntimePokemon | undefined {
    return this.latestRequests[side]?.side?.pokemon?.find(pokemon => pokemon.active) || this.latestRequests[side]?.side?.pokemon?.[0];
  }

  private runtimeForDisplay(side: SideId, display: RentalPokemon): RuntimePokemon | undefined {
    const request = this.latestRequests[side];
    return request?.side?.pokemon?.find(pokemon => {
      const runtimeDisplay = findRentalByRuntime(this.displayForBattleSide(side), pokemon);
      return runtimeDisplay?.species_id === display.species_id;
    });
  }

  private activeHpValue(side: SideId): number {
    const hp = parseConditionHp(this.activeRuntime(side)?.condition);
    if (hp?.current !== undefined) return hp.current;
    const display = this.activeDisplay(side);
    return Number(display?.stats?.hp || display?.base_stats?.hp || 1);
  }

  private activeHpFraction(side: SideId): number {
    return this.runtimeHpFraction(this.activeRuntime(side));
  }

  private runtimeHpFraction(runtime: RuntimePokemon | undefined): number {
    const hp = parseConditionHp(runtime?.condition);
    if (!hp?.max) return String(runtime?.condition || "").endsWith(" fnt") ? 0 : 1;
    return Math.max(0, Math.min(1, hp.current / hp.max));
  }

  private updatePpMemory(request: BattleRequestView | null | undefined): void {
    if (!request) return;
    const active = request.side?.pokemon?.[0];
    const activeName = shortIdent(active?.ident || "");
    if (!activeName) return;
    const activeMoves = request.active?.[0]?.moves || [];
    if (!activeMoves.length) return;
    this.tracker.pp[activeName] = Object.fromEntries(activeMoves.map(move => [move.id || move.move, {name: move.move || move.id, pp: move.pp, maxpp: move.maxpp}]));
  }

  protected currentSideState(side: SideId): PlayerPokemonState[] {
    if (!this.stream?.battle) return [];
    const battleSide = this.battleSide(side);
    const sourceTeam = this.teamForBattleSide(side);
    const sourceDisplay = this.displayForBattleSide(side);
    const sourceStates = side === this.playerSide() ? this.initialPlayerState : undefined;
    const identityByShowdownId = sourceIdentityByShowdownId(sourceTeam, sourceDisplay, sourceStates);
    const states = battleSide.pokemon.map((pokemon: any, index: number) => {
      const state = pokemonStateFromBattle(pokemon, battleSide, index);
      const identity = identityByShowdownId.get(normalizeShowdownId(state.showdown_id));
      state.run_member_id = identity?.run_member_id
        || String(state.run_member_id || sourceTeam[index]?.run_member_id || sourceDisplay[index]?.run_member_id || sourceStates?.[index]?.run_member_id || "").trim()
        || undefined;
      return state;
    });
    return alignStatesToSlots(states, this.slotKeysForSide(side));
  }

  protected syncSideState(side: SideId, states: PlayerPokemonState[]): void {
    if (!this.stream?.battle) return;
    this.applySideState(side, states);
    this.refreshRequests();
    this.updatePpMemory(this.latestRequests[this.playerSide()]);
    if (side === this.playerSide()) this.applyPlayerStateToTracker(this.currentSideState(side));
  }

  protected applySideState(side: SideId, states: PlayerPokemonState[]): void {
    if (!this.stream?.battle) return;
    const battleSide = this.battleSide(side);
    const normalizedStates = withStateStableShowdownIds(states, this.teamForBattleSide(side), this.displayForBattleSide(side));
    const stateByShowdownId = new Map<string, PlayerPokemonState>();
    for (const state of normalizedStates) {
      const id = normalizeShowdownId(state.showdown_id);
      if (id) stateByShowdownId.set(id, state);
    }
    const stateBySlot = new Map(normalizedStates.map(state => [Number(state.slot), state]));
    const slotKeys = this.slotKeysForSide(side);
    const usedSlots = new Set<number>();
    for (let index = 0; index < battleSide.pokemon.length; index += 1) {
      const pokemon = battleSide.pokemon[index];
      const current = pokemonStateFromBattle(pokemon, battleSide, index);
      const slot = resolveStateSlot(current, slotKeys, usedSlots);
      const state = (current.showdown_id ? stateByShowdownId.get(normalizeShowdownId(current.showdown_id)) : undefined) || stateBySlot.get(slot);
      usedSlots.add(slot);
      if (!state) continue;
      const hp = Math.max(0, Math.min(Number(state.hp ?? pokemon.maxhp) || 0, pokemon.maxhp));
      pokemon.hp = hp;
      pokemon.fainted = hp <= 0;
      pokemon.faintQueued = false;
      pokemon.subFainted = null;
      const status = toId(state.status || "");
      pokemon.status = "";
      pokemon.statusState = {};
      if (status && hp > 0) silentlySetPokemonStatus(this.stream.battle, pokemon, status);
      const ppById = new Map<string, number>();
      const ppBySlot = new Map<number, number>();
      for (const move of state.moves || []) {
        ppById.set(toId(move.id || move.move), Number(move.pp));
        ppBySlot.set(Number(move.slot), Number(move.pp));
      }
      for (let moveIndex = 0; moveIndex < pokemon.moveSlots.length; moveIndex += 1) {
        const moveSlot = pokemon.moveSlots[moveIndex];
        const nextPp = ppById.has(moveSlot.id) ? ppById.get(moveSlot.id) : ppBySlot.get(moveIndex + 1);
        if (Number.isFinite(nextPp)) moveSlot.pp = Math.max(0, Math.min(Number(nextPp), moveSlot.maxpp));
      }
    }
    battleSide.pokemonLeft = battleSide.pokemon.filter((pokemon: any) => !pokemon.fainted && pokemon.hp > 0).length;
  }

  private slotKeysForSide(side: SideId): SlotKeySpec[] {
    return side === this.playerSide() ? this.playerSlotKeys : this.enemySlotKeys;
  }

  private teamForBattleSide(side: SideId): PokemonSet[] {
    return side === this.playerSide() ? this.playerTeam : this.enemyTeam;
  }

  private displayForBattleSide(side: SideId): RentalPokemon[] {
    return side === this.playerSide() ? this.playerDisplay : this.enemyDisplay;
  }

  private refreshRequests(): void {
    if (!this.stream?.battle?.requestState) return;
    const requests = this.stream.battle.getRequests(this.stream.battle.requestState);
    this.latestRequests.p1 = requests[0];
    this.latestRequests.p2 = requests[1];
    for (let index = 0; index < this.stream.battle.sides.length; index += 1) {
      const side = this.stream.battle.sides[index];
      side.activeRequest = requests[index];
      side.emitRequest(requests[index], true);
    }
  }

  private applyPlayerStateToTracker(states: PlayerPokemonState[]): void {
    if (!states.length) return;
    const active = states.find(state => state.active) || states[0];
    const runtimeLike = {
      ident: active.ident || active.species || active.details || "",
      details: active.details,
      condition: active.condition || stateCondition(active),
      active: true,
      item: active.item,
      pokeball: active.showdown_id,
    } as RuntimePokemon;
    this.applyRuntimeActiveToTracker(this.playerSide(), runtimeLike);
  }

  private applyRequestActiveToTracker(side: SideId): void {
    const runtime = this.latestRequests[side]?.side?.pokemon?.find(pokemon => pokemon.active) || this.latestRequests[side]?.side?.pokemon?.[0];
    if (!runtime) return;
    this.applyRuntimeActiveToTracker(side, runtime);
  }

  private applyRuntimeActiveToTracker(side: SideId, runtime: RuntimePokemon): void {
    const rawName = shortIdent(runtime.ident || "") || runtime.details || "";
    const team = this.displayForBattleSide(side);
    const display = findRentalByRuntime(team, runtime)
      || findRentalByRuntime(team, rawName)
      || this.service.speciesDisplay(rawName);
    const condition = runtime.condition || this.tracker.active[side]?.condition || "";
    const showdownId = normalizeShowdownId(runtime.pokeball) || this.tracker.active[side]?.showdown_id;
    const previous = this.tracker.active[side];
    const sameTrackedPokemon = Boolean(showdownId && previous?.showdown_id && normalizeShowdownId(previous.showdown_id) === showdownId);
    const runtimeGender = protocolGenderFromDetails((runtime as RuntimePokemon & {gender?: string}).gender)
      || protocolGenderFromDetails(runtime.details)
      || protocolGenderFromDetails(runtime.ident);
    const gender = runtimeGender || (sameTrackedPokemon ? previous?.gender || "" : ("gender" in display ? display.gender || "" : ""));
    this.tracker.active[side] = {
      ...previous,
      ...(sameTrackedPokemon ? {} : {
        name: display.name || rawName,
        display_name: ("species_zh" in display ? display.species_zh : display.name_zh) || display.name || rawName,
        species_id: display.species_id || toId(rawName),
        sprite: display.sprite,
        types: display.types,
        types_zh: display.types_zh,
        base_stats: display.base_stats,
        ability: display.ability,
        ability_zh: display.ability_zh,
        ability_id: display.ability_id,
        ability_desc: display.ability_desc,
        ability_desc_zh: display.ability_desc_zh,
      }),
      gender,
      condition,
      status: condition.split(" ").slice(1).join(" "),
      showdown_id: showdownId,
    };
  }

  private captureRequestHeals(side: SideId, previous: BattleRequestView | undefined, next: BattleRequestView): void {
    if (!previous?.side?.pokemon?.length || !next?.side?.pokemon?.length) return;
    const ambiguousIdents = duplicateRuntimeIdents(previous.side.pokemon, next.side.pokemon);
    const previousByShowdownId = new Map<string, RuntimePokemon>();
    for (const pokemon of previous.side.pokemon) {
      const id = normalizeShowdownId(pokemon.pokeball);
      if (id) previousByShowdownId.set(id, pokemon);
    }
    const previousByIdent = new Map(previous.side.pokemon.map(pokemon => [pokemon.ident, pokemon]));
    for (const pokemon of next.side.pokemon) {
      const showdownId = normalizeShowdownId(pokemon.pokeball);
      const before = (showdownId ? previousByShowdownId.get(showdownId) : undefined) || previousByIdent.get(pokemon.ident);
      if (!before || before.condition === pokemon.condition) continue;
      const oldHp = parseConditionHp(before.condition);
      const newHp = parseConditionHp(pokemon.condition);
      if (!oldHp || !newHp || newHp.current <= oldHp.current) continue;
      const ability = runtimeAbility(pokemon);
      if (!ability) continue;
      const diff: RequestDiffLog = {kind: "heal", side, ident: pokemon.ident, showdown_id: showdownId || undefined, before: before.condition, after: pokemon.condition, source: "request-diff", ability, injected: false};
      if (!showdownId && ambiguousIdents.has(pokemon.ident)) {
        diff.skipped_reason = "ambiguous-ident";
        this.pendingRequestDiffs.push(diff);
        continue;
      }
      if (hasPendingRealHeal(this.pendingMessages, pokemon.ident, pokemon.condition)) {
        diff.skipped_reason = "real-heal-already-present";
        this.pendingRequestDiffs.push(diff);
        continue;
      }
      battleLogLine("battle", "capture-request-heal", {side, ident: pokemon.ident, before: before.condition, after: pokemon.condition, ability});
      const line = `|-heal|${pokemon.ident}|${pokemon.condition}|[from] ability: Regenerator`;
      if (showdownId) this.pendingLineShowdownIds.set(line, showdownId);
      if (insertLineBeforeSideSwitch(this.pendingMessages, side, line)) {
        diff.injected = true;
        battleLogLine("battle", "inject-request-heal-before-switch", {side, ident: pokemon.ident, condition: pokemon.condition, ability});
      } else {
        diff.injected = true;
        diff.skipped_reason = "no-side-switch-anchor";
        battleLogLine("battle", "inject-request-heal-fallback", {side, ident: pokemon.ident, condition: pokemon.condition, ability});
        this.pendingMessages.push({type: "update", data: line});
      }
      this.pendingRequestDiffs.push(diff);
    }
  }

  private nextRandom(): number {
    this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
    return this.rngState / 0x100000000;
  }

  private pick<T>(values: T[]): T {
    return values[Math.floor(this.nextRandom() * values.length)];
  }

  private shuffle<T>(values: T[]): void {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(this.nextRandom() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
  }

  protected withTimelineId(event: ParsedTimelineEvent): BattleTimelineEvent {
    this.timelineSeq += 1;
    return {...event, id: `t${this.timelineSeq}`};
  }
}

function actionFromTimelineEvent(side: SideId, event: BattleTimelineEvent): BattleTurnAction {
  if (event.type === "move") {
    return {
      side,
      kind: "move",
      actor_name: event.source,
      actor_showdown_id: event.source_showdown_id,
      label: event.move ? `${event.source || SIDE_NAMES[side]} 使用 ${event.move}` : event.text,
      move_name: event.move,
      target_name: event.target,
    };
  }
  if (event.type === "switch") {
    return {
      side,
      kind: "switch",
      actor_name: event.target,
      actor_showdown_id: event.target_showdown_id,
      label: event.target ? `换上 ${event.target}` : event.text,
      target_name: event.target,
    };
  }
  if (event.type === "item") {
    return {
      side,
      kind: "item",
      actor_name: event.target || event.source,
      actor_showdown_id: event.target_showdown_id || event.source_showdown_id,
      label: event.effect ? `${event.target || event.source || SIDE_NAMES[side]} 触发 ${event.effect}` : event.text,
      target_name: event.target,
    };
  }
  return {side, kind: "unknown", label: event.text};
}

function turnSummaryText(playerAction: BattleTurnAction | undefined, enemyAction: BattleTurnAction | undefined, eventTexts: string[]): string {
  const actions = [
    playerAction?.label ? `我方：${playerAction.label}` : "",
    enemyAction?.label ? `对手：${enemyAction.label}` : "",
  ].filter(Boolean);
  if (actions.length) return actions.join("；");
  return eventTexts[0] || "本回合没有关键行动。";
}

function turnResultTags(events: BattleTimelineEvent[]): string[] {
  const tags = new Set<string>();
  for (const event of events) {
    if (event.type === "faint") tags.add("濒死");
    if (event.type === "damage") tags.add("伤害");
    if (event.type === "heal") tags.add("恢复");
    if (event.type === "status") tags.add("异常");
    if (event.type === "weather") tags.add("天气");
    if (event.type === "field") tags.add("场地");
    if (event.type === "boost") tags.add("能力变化");
    if (event.type === "win") tags.add("胜负");
  }
  return Array.from(tags);
}

function mergeTurnRecord(previous: BattleTurnRecord, next: BattleTurnRecord): BattleTurnRecord {
  const eventTexts = [...previous.event_texts, ...next.event_texts].filter(Boolean).slice(-18);
  const resultTags = Array.from(new Set([...previous.result_tags, ...next.result_tags]));
  const playerAction = previous.player_action?.kind && previous.player_action.kind !== "unknown" ? previous.player_action : next.player_action;
  const enemyAction = previous.enemy_action?.kind && previous.enemy_action.kind !== "unknown" ? previous.enemy_action : next.enemy_action;
  return {
    ...next,
    player_action: playerAction,
    enemy_action: enemyAction,
    summary: turnSummaryText(playerAction, enemyAction, eventTexts),
    result_tags: resultTags,
    event_texts: eventTexts,
  };
}

function statusFromCondition(condition: string | undefined): string {
  const parts = String(condition || "").trim().split(/\s+/).slice(1);
  return parts.find(part => part && part !== "fnt") || "";
}

function isForceSwitchRequest(request: BattleRequestView | null | undefined): boolean {
  return Boolean(request?.forceSwitch?.some(Boolean));
}

function playerStatesFromTurnRecord(record: BattleTurnRecord, currentStates: PlayerPokemonState[]): PlayerPokemonState[] {
  const byShowdownId = new Map(record.end_state.player_team.map(state => [normalizeShowdownId(state.showdown_id), state]).filter(([id]) => Boolean(id)) as Array<[string, BattleTurnPokemonState]>);
  const bySlot = new Map(record.end_state.player_team.map(state => [Number(state.slot), state]));
  return currentStates.map(state => {
    const snapshot = (state.showdown_id ? byShowdownId.get(normalizeShowdownId(state.showdown_id)) : undefined) || bySlot.get(Number(state.slot));
    if (!snapshot) return state;
    const maxhp = Math.max(1, Number(state.maxhp || snapshot.max_hp || 1));
    const hp = Math.max(0, Math.min(maxhp, Number(snapshot.hp || 0)));
    const status = hp > 0 && !snapshot.fainted ? statusFromCondition(snapshot.hp_text) || snapshot.status || "" : "";
    const ppById = new Map((snapshot.pp || []).map(move => [toId(move.id || move.name), move]));
    const ppBySlot = new Map((snapshot.pp || []).map(move => [Number(move.slot), move]));
    const moves = (state.moves || []).map(move => {
      const snapshotMove = ppById.get(toId(move.id || move.move)) || ppBySlot.get(Number(move.slot));
      return snapshotMove ? {...move, pp: Math.max(0, Math.min(Number(snapshotMove.pp || 0), Number(move.maxpp || snapshotMove.max_pp || 0)))} : move;
    });
    const next: PlayerPokemonState = {
      ...state,
      hp,
      status,
      fainted: snapshot.fainted || hp <= 0,
      moves,
    };
    next.condition = stateCondition(next);
    return next;
  });
}

export class TrainerItemBattleSession extends BattleSession {
  private trainerItemPatchInstalled = false;
  private trainerItemActionSeq = 0;
  private lastTrainerItemActionSeq = 0;
  private dialgaGracePatchInstalled = false;
  private dialgaGraceActionSeq = 0;
  private lastDialgaGraceActionSeq = 0;

  async chooseTrainerItem(itemId: string, targetSlot: number, moveSlot?: number, recoveryMultiplier = 1): Promise<BattleState> {
    if (!this.stream || this.ended) return this.getState();
    const battle = this.stream.battle;
    if (!battle) throw new Error("当前对战尚未开始。");
    const request = this.latestRequests[this.playerSide()];
    if (!request || request.wait) throw new Error("现在不能使用道具。");
    if (request.forceSwitch) throw new Error("当前必须换人，不能使用战斗道具。");
    if (!request.active?.length) throw new Error("当前不是出招阶段，不能使用战斗道具。");
    const side = this.battleSide(this.playerSide());
    const active = side.active[0];
    if (!active || active.fainted || active.hp <= 0) throw new Error("当前宝可梦无法行动，不能使用战斗道具。");
    const targetIndex = Math.max(0, Number(targetSlot || 0));
    const target = side.pokemon[targetIndex];
    if (!target) throw new Error("道具目标不存在。");
    const effect = (await this.service.loadConsumableItemEffects()).get(toId(itemId));
    if (!effect) throw new Error("这个道具不能在战斗中主动使用。");
    if (!effect.battle_usable || effect.stat_kind) throw new Error("这个道具不能在战斗中主动使用。");
    const itemName = this.service.plain("items", itemId) || itemId;
    assertConsumableEffectCanApplyToBattlePokemon(effect, target, moveSlot);
    this.installTrainerItemAction();
    const actionSeq = ++this.trainerItemActionSeq;
    side.clearChoice();
    side.choice.actions.push({
      choice: "trainerItem",
      pokemon: active,
      target,
      itemId: toId(itemId),
      itemName,
      effect,
      moveSlot,
      recoveryMultiplier,
      trainerItemActionSeq: actionSeq,
      order: 102,
      priority: 0,
      speed: 1,
    });
    const enemyRequest = this.latestRequests[this.enemySide()];
    if (enemyRequest && !enemyRequest.wait) await this.chooseSide(this.enemySide(), await this.consumeEnemyChoice(enemyRequest));
    else await this.chooseSide(this.enemySide(), "default");
    if (this.lastTrainerItemActionSeq !== actionSeq) throw new Error("战斗道具没有成功生效，请重试。");
    this.prepareEnemyChoice();
    return this.getState();
  }

  async useDialgaGrace(): Promise<BattleState> {
    if (!this.stream || this.ended) return this.getState();
    const battle = this.stream.battle;
    if (!battle) throw new Error("当前对战尚未开始。");
    const request = this.latestRequests[this.playerSide()];
    if (!request || request.wait || request.teamPreview || isForceSwitchRequest(request)) throw new Error("当前不能发动帝牙卢卡的恩典。");
    if (!request.active?.length) throw new Error("当前不是出招阶段，不能发动帝牙卢卡的恩典。");
    const side = this.battleSide(this.playerSide());
    const active = side.active[0];
    if (!active || active.fainted || active.hp <= 0) throw new Error("当前宝可梦无法行动，不能发动帝牙卢卡的恩典。");
    const target = this.dialgaGraceTargetRecord();
    if (!target) throw new Error("没有可恢复的回合节点。");
    this.installDialgaGraceAction();
    const actionSeq = ++this.dialgaGraceActionSeq;
    side.clearChoice();
    side.choice.actions.push({
      choice: "dialgaGrace",
      pokemon: active,
      restoreStates: playerStatesFromTurnRecord(target, this.currentSideState(this.playerSide())),
      targetTurn: target.turn,
      dialgaGraceActionSeq: actionSeq,
      order: 102,
      priority: 0,
      speed: 1,
    });
    const enemyRequest = this.latestRequests[this.enemySide()];
    if (enemyRequest && !enemyRequest.wait) await this.chooseSide(this.enemySide(), await this.consumeEnemyChoice(enemyRequest));
    else await this.chooseSide(this.enemySide(), "default");
    if (this.lastDialgaGraceActionSeq !== actionSeq) throw new Error("帝牙卢卡的恩典没有成功生效，请重试。");
    const notice = this.withTimelineId({
      type: "item",
      text: `帝牙卢卡的恩典发动，我方队伍状态恢复为第 ${Math.max(1, Number(target.turn || 1))} 回合。`,
      side: this.playerSide(),
      effect: "帝牙卢卡的恩典",
      turn: this.getState().tracker.turn,
    });
    this.timelineEvents.push(notice);
    this.timelineEvents = this.timelineEvents.slice(-140);
    this.recentEvents.push(notice.text);
    this.recentEvents = this.recentEvents.slice(-40);
    this.recordTurnSummary(this.getState().tracker.turn || target.turn || 0, [notice]);
    this.prepareEnemyChoice();
    return this.getState();
  }

  private installTrainerItemAction(): void {
    if (this.trainerItemPatchInstalled || !this.stream?.battle) return;
    const battle = this.stream.battle;
    const originalRunAction = battle.runAction.bind(battle);
    battle.runAction = (action: any) => {
      if (action?.choice !== "trainerItem") return originalRunAction(action);
      battle.add('-message', `${battlePokemonName(action.target)} 使用了 ${action.itemName}。`);
      applyConsumableEffectToBattlePokemon(battle, action.effect, action.target, action.itemId, action.itemName, action.moveSlot, action.recoveryMultiplier);
      this.lastTrainerItemActionSeq = Number(action.trainerItemActionSeq || 0);
      return undefined;
    };
    this.trainerItemPatchInstalled = true;
  }

  private installDialgaGraceAction(): void {
    if (this.dialgaGracePatchInstalled || !this.stream?.battle) return;
    const battle = this.stream.battle;
    const originalRunAction = battle.runAction.bind(battle);
    battle.runAction = (action: any) => {
      if (action?.choice !== "dialgaGrace") return originalRunAction(action);
      const targetTurn = Math.max(1, Number(action.targetTurn || 1));
      battle.add('-message', `帝牙卢卡的恩典发动，我方队伍状态恢复为第 ${targetTurn} 回合。`);
      this.applySideState(this.playerSide(), action.restoreStates || []);
      this.lastDialgaGraceActionSeq = Number(action.dialgaGraceActionSeq || 0);
      return undefined;
    };
    this.dialgaGracePatchInstalled = true;
  }
}

function createBattleTracker(): BattleTracker {
  return {
    turn: 1,
    active: {p1: {}, p2: {}},
    boosts: {p1: {}, p2: {}},
    side_conditions: {p1: [], p2: []},
    weather: "无",
    field: [],
    pp: {},
  };
}

function normalizeShowdownId(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function validShowdownId(value: unknown): string {
  const id = normalizeShowdownId(value);
  return SHOWDOWN_ID_SET.has(id) ? id : "";
}

function firstStableShowdownId(used: Set<string>, ...values: unknown[]): string {
  for (const value of values) {
    const id = validShowdownId(value);
    if (id && !used.has(id)) return id;
  }
  const fallback = SHOWDOWN_ID_POOL.find(id => !used.has(id));
  if (!fallback) throw new Error("Showdown ID 池已耗尽。");
  return fallback;
}

function withShowdownTransportIds(team: PokemonSet[] = []): PokemonSet[] {
  const used = new Set<string>();
  return team.map(pokemon => {
    const showdown_id = firstStableShowdownId(used, pokemon.showdown_id, pokemon.pokeball);
    used.add(showdown_id);
    return {...pokemon, showdown_id, pokeball: showdown_id};
  });
}

function withDisplayStableShowdownIds(display: RentalPokemon[] = [], team: PokemonSet[] = []): RentalPokemon[] {
  const used = new Set<string>();
  return display.map((pokemon, index) => {
    const showdown_id = firstStableShowdownId(used, team[index]?.showdown_id, team[index]?.pokeball, pokemon.showdown_id);
    used.add(showdown_id);
    return {...pokemon, gender: pokemon.gender || team[index]?.gender || "", showdown_id};
  });
}

function withStateStableShowdownIds(states: PlayerPokemonState[] = [], team: PokemonSet[] = [], display: RentalPokemon[] = []): PlayerPokemonState[] {
  const used = new Set<string>();
  return states.map((state, index) => {
    const showdown_id = firstStableShowdownId(used, team[index]?.showdown_id, display[index]?.showdown_id, team[index]?.pokeball, state.showdown_id);
    used.add(showdown_id);
    return {...state, slot: index + 1, showdown_id};
  });
}

function activeDisplay(service: GameService, rawSpecies: string | undefined): ReturnType<GameService["speciesDisplay"]> {
  return service.speciesDisplay(shortIdent(rawSpecies || "").split(",", 1)[0].trim());
}

function protocolGenderFromDetails(value: string | undefined): string {
  const parts = String(value || "").split(",").map(part => part.trim());
  if (parts.some(part => /^(?:m|male|♂)$/i.test(part))) return "M";
  if (parts.some(part => /^(?:f|female|♀)$/i.test(part))) return "F";
  return "";
}

function setActiveDisplay(tracker: BattleTracker, service: GameService, side: SideId, rawSpecies: string | undefined, condition?: string, clearSubstitute = false, showdownId?: string): void {
  const display = activeDisplay(service, rawSpecies);
  const previous = tracker.active[side] || {};
  const normalizedShowdownId = normalizeShowdownId(showdownId) || previous.showdown_id;
  const sameShowdownPokemon = Boolean(previous.showdown_id && normalizedShowdownId && previous.showdown_id === normalizedShowdownId);
  const sameVisibleSpecies = Boolean(!showdownId && previous.dynamaxed && previous.species_id && previous.species_id === display.species_id);
  const clearBattleForm = clearSubstitute && !sameShowdownPokemon && !sameVisibleSpecies;
  tracker.active[side] = {
    ...previous,
    name: display.name,
    display_name: display.name_zh,
    species_id: display.species_id,
    sprite: display.sprite,
    types: display.types,
    types_zh: display.types_zh,
    base_stats: display.base_stats,
    ability: display.ability,
    ability_zh: display.ability_zh,
    ability_id: display.ability_id,
    ability_desc: display.ability_desc,
    ability_desc_zh: display.ability_desc_zh,
    gender: protocolGenderFromDetails(rawSpecies) || (sameShowdownPokemon ? previous.gender : display.gender),
    condition: condition || previous.condition,
    showdown_id: normalizedShowdownId,
    ...(clearSubstitute ? {
      substitute: false,
    } : {}),
    ...(clearBattleForm ? {
      dynamaxed: false,
      gigantamaxed: false,
      terastallized: false,
      tera_type: undefined,
      tera_type_zh: undefined,
      original_species_id: undefined,
      original_name: undefined,
      original_display_name: undefined,
      original_sprite: undefined,
    } : {}),
  };
}

function beginDynamaxDisplay(tracker: BattleTracker, service: GameService, side: SideId, ident: string, isGmax: boolean): ParsedTimelineEvent {
  const current = tracker.active[side] || {};
  const baseDisplay = activeDisplay(service, ident);
  const original = current.original_species_id
    ? {}
    : {
      original_species_id: current.species_id || baseDisplay.species_id,
      original_name: current.name || baseDisplay.name,
      original_display_name: current.display_name || baseDisplay.name_zh,
      original_sprite: current.sprite || baseDisplay.sprite,
    };
  const target = current.display_name || translatedSpecies(service, ident);
  if (isGmax) {
    const baseName = current.name || shortIdent(ident);
    const display = service.speciesDisplay(`${baseName}-Gmax`);
    tracker.active[side] = {
      ...current,
      ...original,
      name: display.name,
      display_name: display.name_zh,
      species_id: display.species_id,
      sprite: display.sprite,
      types: display.types,
      types_zh: display.types_zh,
      base_stats: display.base_stats,
      ability: display.ability,
      ability_zh: display.ability_zh,
      ability_id: display.ability_id,
      ability_desc: display.ability_desc,
      ability_desc_zh: display.ability_desc_zh,
      dynamaxed: true,
      gigantamaxed: true,
    };
    const nextTarget = display.name_zh || target;
    return {type: "form", text: `${target} 超极巨化为 ${nextTarget}！`, side, targetSide: side, target: nextTarget, target_id: display.name, target_showdown_id: current.showdown_id, target_species_id: display.species_id, sprite: display.sprite, effect: "Gigantamax"};
  }
  tracker.active[side] = {...current, ...original, dynamaxed: true, gigantamaxed: false};
  return {type: "form", text: `${target} 极巨化了！`, side, targetSide: side, target, target_id: current.name || shortIdent(ident), target_showdown_id: current.showdown_id, target_species_id: current.species_id, sprite: current.sprite, effect: "Dynamax"};
}

function endDynamaxDisplay(tracker: BattleTracker, side: SideId, ident: string, service: GameService): ParsedTimelineEvent {
  const current = tracker.active[side] || {};
  const target = current.display_name || translatedSpecies(service, ident);
  const restoredDisplay = service.speciesDisplay(current.original_species_id || current.original_name || shortIdent(ident));
  tracker.active[side] = {
    ...current,
    name: current.original_name || restoredDisplay.name || current.name,
    display_name: current.original_display_name || restoredDisplay.name_zh || current.display_name,
    species_id: current.original_species_id || restoredDisplay.species_id || current.species_id,
    sprite: current.original_sprite || restoredDisplay.sprite || current.sprite,
    types: restoredDisplay.types || current.types,
    types_zh: restoredDisplay.types_zh || current.types_zh,
    base_stats: restoredDisplay.base_stats || current.base_stats,
    ability: restoredDisplay.ability || current.ability,
    ability_zh: restoredDisplay.ability_zh || current.ability_zh,
    ability_id: restoredDisplay.ability_id || current.ability_id,
    ability_desc: restoredDisplay.ability_desc || current.ability_desc,
    ability_desc_zh: restoredDisplay.ability_desc_zh || current.ability_desc_zh,
    dynamaxed: false,
    gigantamaxed: false,
    original_species_id: undefined,
    original_name: undefined,
    original_display_name: undefined,
    original_sprite: undefined,
  };
  const restoredTarget = tracker.active[side].display_name || target;
  return {type: "form", text: `${target} 的极巨化结束了。`, side, targetSide: side, target: restoredTarget, target_id: tracker.active[side].name || shortIdent(ident), target_showdown_id: tracker.active[side].showdown_id, target_species_id: tracker.active[side].species_id, sprite: tracker.active[side].sprite, effect: "DynamaxEnd"};
}

function beginTerastalDisplay(tracker: BattleTracker, service: GameService, side: SideId, ident: string, teraType: string): ParsedTimelineEvent {
  const current = tracker.active[side] || {};
  const target = current.display_name || translatedSpecies(service, ident);
  const typeName = String(teraType || "").trim() || "Normal";
  const typeZh = service.plain("types", typeName) || typeName;
  tracker.active[side] = {
    ...current,
    terastallized: true,
    tera_type: typeName,
    tera_type_zh: typeZh,
    types: [typeName],
    types_zh: [typeZh],
  };
  return {
    type: "form",
    text: `${target} 太晶化成了${typeZh}属性！`,
    side,
    targetSide: side,
    target,
    target_id: current.name || shortIdent(ident),
    target_showdown_id: current.showdown_id,
    target_species_id: current.species_id,
    sprite: current.sprite,
    effect: "Terastallize",
    tera_type: typeName,
    tera_type_zh: typeZh,
  };
}

function legalSwitchIndexes(request: BattleRequestView): number[] {
  return (request.side?.pokemon || [])
    .map((pokemon, index) => ({pokemon, index: index + 1}))
    .filter(({pokemon}) => !pokemon.active && !String(pokemon.condition || "").endsWith(" fnt"))
    .map(({index}) => index);
}

const FORCED_CONTINUATION_MOVE_IDS = new Set([
  "fly", "dive", "dig", "bounce", "phantomforce", "shadowforce", "skydrop",
  "solarbeam", "solarblade", "meteorbeam", "skullbash", "razorwind", "skyattack",
  "iceburn", "freezeshock", "geomancy",
  "outrage", "thrash", "petaldance", "rollout", "iceball", "uproar", "bravebird",
]);

function isForcedContinuationRequest(request: BattleRequestView | null | undefined): boolean {
  if (!request || request.wait || request.teamPreview || request.forceSwitch) return false;
  const active = request.active?.[0] as ({moves?: BattleRequestView["active"] extends Array<infer T> ? T extends {moves: infer M} ? M : never : never; trapped?: boolean} | undefined);
  const moves = active?.moves || [];
  if (moves.length !== 1) return false;
  const move = moves[0] as {pp?: number; maxpp?: number; disabled?: boolean};
  const moveId = toId((move as {id?: string; move?: string}).id || (move as {id?: string; move?: string}).move || "");
  return Boolean(moveId && moveId !== "struggle" && FORCED_CONTINUATION_MOVE_IDS.has(moveId) && move.pp === undefined && move.maxpp === undefined && !move.disabled);
}

function cloneBattleRequests(requests: Record<string, BattleRequestView>): Record<string, BattleRequestView> {
  return JSON.parse(JSON.stringify(requests || {})) as Record<string, BattleRequestView>;
}

function duplicateRuntimeIdents(...groups: RuntimePokemon[][]): Set<string> {
  const duplicated = new Set<string>();
  for (const group of groups) {
    const counts = new Map<string, number>();
    for (const pokemon of group) {
      const ident = String(pokemon.ident || "");
      if (!ident) continue;
      counts.set(ident, Number(counts.get(ident) || 0) + 1);
    }
    for (const [ident, count] of counts) {
      if (count > 1) duplicated.add(ident);
    }
  }
  return duplicated;
}

function runtimeAbility(pokemon: RuntimePokemon): string {
  const raw = (pokemon as RuntimePokemon & {ability?: string; baseAbility?: string}).ability || (pokemon as RuntimePokemon & {ability?: string; baseAbility?: string}).baseAbility || "";
  return toId(raw) === "regenerator" ? "Regenerator" : "";
}

function silentlySetPokemonStatus(battle: any, pokemon: any, status: string): void {
  const statusId = toId(status);
  if (!statusId) return;
  pokemon.status = statusId;
  pokemon.statusState = battle?.initEffectState ? battle.initEffectState({id: statusId, target: pokemon}) : {id: statusId, target: pokemon};
}

function logMessages(messages: Message[]): LogMessage[] {
  return messages.map(message => ({
    type: message.type,
    data: message.data,
    lines: String(message.data || "").split("\n"),
  }));
}

function splitLogLines(messages: Message[]): string[] {
  const lines: string[] = [];
  for (const message of messages) {
    if (message.type !== "update") continue;
    const rawLines = String(message.data || "").split("\n");
    for (let index = 0; index < rawLines.length; index += 1) {
      const line = rawLines[index];
      if (!line || line.startsWith("|request|")) continue;
      if (line.startsWith("|split|")) {
        const side = line.split("|")[2] as SideId | undefined;
        const secret = rawLines[index + 1] || "";
        const publicLine = rawLines[index + 2] || "";
        const selected = side === "p1" ? secret : publicLine;
        if (selected && !selected.startsWith("|request|")) lines.push(selected);
        index += 2;
        continue;
      }
      lines.push(line);
    }
  }
  return lines;
}

function isSideSwitchLine(line: string, side: SideId): boolean {
  const parts = line.split("|");
  return ["switch", "drag", "replace"].includes(parts[1] || "") && sideFromIdent(parts[2] || "") === side;
}

function insertLineBeforeSideSwitch(messages: Message[], side: SideId, lineToInsert: string): boolean {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];
    if (message.type !== "update") continue;
    const lines = String(message.data || "").split("\n");
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (line.startsWith("|split|")) {
        const splitSide = line.split("|")[2] as SideId | undefined;
        const secret = lines[lineIndex + 1] || "";
        const publicLine = lines[lineIndex + 2] || "";
        const selected = splitSide === "p1" ? secret : publicLine;
        if (splitSide === side && isSideSwitchLine(selected, side)) {
          lines.splice(lineIndex, 0, lineToInsert);
          message.data = lines.join("\n");
          return true;
        }
        lineIndex += 2;
        continue;
      }
      if (isSideSwitchLine(line, side)) {
        lines.splice(lineIndex, 0, lineToInsert);
        message.data = lines.join("\n");
        return true;
      }
    }
  }
  return false;
}

function sideFromIdent(raw: string): SideId | null {
  if (raw.startsWith("p1")) return "p1";
  if (raw.startsWith("p2")) return "p2";
  return null;
}

function isActiveIdent(tracker: BattleTracker, side: SideId | null, raw: string | undefined): boolean {
  if (!side || !raw) return false;
  const active = tracker.active[side];
  const target = toId(shortIdent(raw));
  if (!target) return false;
  return [
    active?.name,
    active?.display_name,
    active?.species_id,
    active?.original_name,
    active?.original_display_name,
    active?.original_species_id,
  ].some(value => toId(String(value || "")) === target);
}

function shortIdent(raw: string): string {
  let value = raw.split("|")[0].trim();
  if (value.includes(":")) value = value.split(":", 2)[1].trim();
  return value;
}

function toId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const MAJOR_STATUS_IDS = new Set(["brn", "par", "psn", "tox", "slp", "frz", "fnt"]);

function statusTokenList(raw: string | undefined): string[] {
  const seen = new Set<string>();
  return String(raw || "").split(/[\s,;/]+/).map(toId).filter(token => {
    if (!token || seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}

function withStatusToken(raw: string | undefined, token: string, enabled: boolean): string {
  const id = toId(token);
  const tokens = statusTokenList(raw).filter(value => value !== id);
  if (enabled && id) tokens.push(id);
  return tokens.join(" ");
}

function withoutMajorStatusTokens(raw: string | undefined): string {
  return statusTokenList(raw).filter(token => !MAJOR_STATUS_IDS.has(token)).join(" ");
}

function updateActiveStatusToken(tracker: BattleTracker, side: SideId | null, rawIdent: string | undefined, token: string, enabled: boolean): void {
  if (!side || !isActiveIdent(tracker, side, rawIdent)) return;
  tracker.active[side] = {...tracker.active[side], status: withStatusToken(tracker.active[side]?.status, token, enabled)};
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

function computeHpAmount(raw: string, maxhp: number): number {
  const value = String(raw || "").trim();
  if (!value) return 0;
  if (value === "full") return maxhp;
  if (value.endsWith("%")) return Math.max(1, Math.floor(maxhp * Number(value.slice(0, -1)) / 100));
  return Math.max(0, Number(value || 0));
}

function computePpAmount(raw: string, maxpp: number): number {
  const value = String(raw || "").trim();
  if (!value) return 0;
  if (value === "full") return maxpp;
  return Math.max(0, Number(value || 0));
}

function statusCanBeCured(effect: ConsumableItemEffect, status: string): boolean {
  const current = toId(status);
  if (!current || effect.status === "none") return false;
  if (effect.status === "all") return true;
  return effect.status.split("|").map(toId).includes(current);
}

function normalizeMoveSlot(moveSlot?: number): number {
  return Math.max(0, Number(moveSlot || 0));
}

function parseStatId(value: unknown): StatId | undefined {
  const id = toId(String(value || ""));
  return (STAT_IDS as readonly string[]).includes(id) ? id as StatId : undefined;
}

function stateDisplayName(state: PlayerPokemonState): string {
  return state.species || shortIdent(state.ident || "") || state.details || "宝可梦";
}

function refreshMutablePlayerState(state: PlayerPokemonState): void {
  state.hp = Math.max(0, Math.min(Number(state.hp || 0), Number(state.maxhp || 1)));
  state.fainted = state.hp <= 0;
  if (state.fainted) state.status = "";
  state.condition = stateCondition(state);
}

function applyConsumableEffectToMutableState(effect: ConsumableItemEffect, state: PlayerPokemonState, itemName: string, moveSlot?: number): {message: string; details: string[]} {
  const details: string[] = [];
  const beforeHp = Number(state.hp || 0);
  const wasFainted = state.fainted || beforeHp <= 0;
  if (effect.revive) {
    if (!wasFainted) throw new Error("目标没有濒死，不能使用这个复活道具。");
    state.hp = effect.revive === "full" ? state.maxhp : Math.max(1, Math.floor(state.maxhp / 2));
    state.fainted = false;
    state.status = "";
    details.push(`恢复到 ${state.hp}/${state.maxhp}`);
  } else if (wasFainted) {
    throw new Error("目标已经濒死，不能使用这个道具。");
  }

  const hpAmount = computeHpAmount(effect.hp, state.maxhp);
  if (hpAmount > 0 && !state.fainted && state.hp < state.maxhp) {
    const previous = state.hp;
    state.hp = Math.min(state.maxhp, state.hp + hpAmount);
    details.push(`恢复了 ${state.hp - previous} 点生命值`);
  }

  if (effect.pp_scope) {
    const moves = state.moves || [];
    const slot = normalizeMoveSlot(moveSlot);
    const targets = effect.pp_scope === "all"
      ? moves
      : slot ? moves.filter(move => move.slot === slot) : moves.filter(move => move.pp < move.maxpp).slice(0, 1);
    if (!targets.length) throw new Error("请选择需要恢复 PP 的技能。");
    let restored = 0;
    for (const move of targets) {
      if (move.pp >= move.maxpp) continue;
      const amount = computePpAmount(effect.pp, move.maxpp);
      const previous = move.pp;
      move.pp = Math.min(move.maxpp, move.pp + amount);
      restored += move.pp - previous;
    }
    if (restored > 0) details.push(`恢复了 ${restored} 点 PP`);
  }

  if (statusCanBeCured(effect, state.status)) {
    const status = state.status;
    state.status = "";
    details.push(`解除了 ${status}`);
  }

  refreshMutablePlayerState(state);
  if (!details.length) throw new Error("目标不需要这个道具。");
  const name = stateDisplayName(state);
  return {message: `${name} 使用了 ${itemName}。${details.join("，")}。`, details};
}

function battlePokemonName(pokemon: any): string {
  return pokemon?.name || pokemon?.species?.name || "宝可梦";
}

function battleHealthText(pokemon: any): string {
  return `${Math.max(0, Number(pokemon.hp || 0))}/${Math.max(1, Number(pokemon.maxhp || 1))}`;
}

function assertConsumableEffectCanApplyToBattlePokemon(effect: ConsumableItemEffect, target: any, moveSlot?: number): void {
  const wasFainted = Boolean(target.fainted || target.hp <= 0);
  let canApply = false;
  if (effect.revive) {
    if (!wasFainted) throw new Error("目标没有濒死，不能使用这个复活道具。");
    canApply = true;
  } else if (wasFainted) {
    throw new Error("目标已经濒死，不能使用这个道具。");
  }
  const hpAmount = computeHpAmount(effect.hp, target.maxhp);
  if (hpAmount > 0 && !wasFainted && target.hp < target.maxhp) canApply = true;
  if (effect.pp_scope) {
    const moves = target.moveSlots || [];
    const slot = normalizeMoveSlot(moveSlot);
    const targets = effect.pp_scope === "all"
      ? moves
      : slot ? moves.filter((move: any, index: number) => index + 1 === slot) : moves.filter((move: any) => move.pp < move.maxpp).slice(0, 1);
    if (!targets.length) throw new Error("请选择需要恢复 PP 的技能。");
    if (targets.some((move: any) => move.pp < move.maxpp)) canApply = true;
  }
  if (statusCanBeCured(effect, target.status)) canApply = true;
  if (!canApply) throw new Error("目标不需要这个道具。");
}

function applyConsumableEffectToBattlePokemon(battle: any, effect: ConsumableItemEffect, target: any, itemId: string, itemName: string, moveSlot?: number, recoveryMultiplier = 1): string[] {
  const details: string[] = [];
  const wasFainted = Boolean(target.fainted || target.hp <= 0);
  const multiplier = Math.max(0, Number(recoveryMultiplier || 1));
  if (effect.revive) {
    if (!wasFainted) throw new Error("目标没有濒死，不能使用这个复活道具。");
    const baseHp = effect.revive === "full" ? target.maxhp : Math.max(1, Math.floor(target.maxhp / 2));
    target.hp = Math.max(1, Math.floor(baseHp * multiplier));
    target.fainted = false;
    target.faintQueued = false;
    target.status = "";
    target.statusState = {};
    target.side.pokemonLeft = Math.max(Number(target.side.pokemonLeft || 0), target.side.pokemon.filter((pokemon: any) => !pokemon.fainted && pokemon.hp > 0).length);
    battle.add('-heal', target, battleHealthText(target), '[from] item: ' + itemId);
    details.push(`恢复到 ${battleHealthText(target)}`);
  } else if (wasFainted) {
    throw new Error("目标已经濒死，不能使用这个道具。");
  }

  const hpAmount = computeHpAmount(effect.hp, target.maxhp);
  if (hpAmount > 0 && !target.fainted && target.hp < target.maxhp) {
    const previous = target.hp;
    target.hp = Math.min(target.maxhp, target.hp + Math.max(1, Math.floor(hpAmount * multiplier)));
    battle.add('-heal', target, battleHealthText(target), '[from] item: ' + itemId);
    details.push(`恢复了 ${target.hp - previous} 点生命值`);
  }

  if (effect.pp_scope) {
    const moves = target.moveSlots || [];
    const slot = normalizeMoveSlot(moveSlot);
    const targets = effect.pp_scope === "all"
      ? moves
      : slot ? moves.filter((move: any, index: number) => index + 1 === slot) : moves.filter((move: any) => move.pp < move.maxpp).slice(0, 1);
    if (!targets.length) throw new Error("请选择需要恢复 PP 的技能。");
    let restored = 0;
    for (const move of targets) {
      if (move.pp >= move.maxpp) continue;
      const amount = computePpAmount(effect.pp, move.maxpp);
      const previous = move.pp;
      move.pp = Math.min(move.maxpp, move.pp + amount);
      restored += move.pp - previous;
    }
    if (restored > 0) {
      battle.add('-message', `${battlePokemonName(target)} 恢复了 ${restored} 点 PP。`);
      details.push(`恢复了 ${restored} 点 PP`);
    }
  }

  if (statusCanBeCured(effect, target.status)) {
    const before = target.status;
    target.cureStatus();
    details.push(`解除了 ${before}`);
  }

  if (!details.length) throw new Error("目标不需要这个道具。");
  return details;
}

function pokemonCondition(pokemon: any): string {
  if (!pokemon) return "?";
  if (!pokemon.hp || pokemon.fainted) return "0 fnt";
  return `${pokemon.hp}/${pokemon.maxhp}${pokemon.status ? ` ${pokemon.status}` : ""}`;
}

function pokemonStateFromBattle(pokemon: any, battleSide: any, index: number): PlayerPokemonState {
  const showdownId = normalizeShowdownId(pokemon?.pokeball || pokemon?.set?.showdown_id || pokemon?.set?.pokeball);
  return {
    run_member_id: String(pokemon?.set?.run_member_id || "").trim() || undefined,
    slot: index + 1,
    showdown_id: showdownId || undefined,
    ident: pokemon.fullname,
    details: pokemon.details,
    species: pokemon.species?.name || pokemon.set?.species || pokemon.name,
    condition: pokemonCondition(pokemon),
    hp: pokemon.hp || 0,
    maxhp: pokemon.maxhp || 0,
    status: pokemon.status || "",
    fainted: Boolean(pokemon.fainted || !pokemon.hp),
    active: battleSide.active.includes(pokemon),
    item: pokemon.item || "",
    moves: (pokemon.moveSlots || []).map((moveSlot: any, moveIndex: number) => ({
      slot: moveIndex + 1,
      id: moveSlot.id,
      move: moveSlot.move,
      pp: moveSlot.pp,
      maxpp: moveSlot.maxpp,
    })),
  };
}

function stateCondition(state: PlayerPokemonState): string {
  if (!state.hp || state.fainted) return "0 fnt";
  return `${state.hp}/${state.maxhp}${state.status ? ` ${state.status}` : ""}`;
}

function addSlotKey(keys: Set<string>, prefix: string, value: unknown): void {
  const normalized = toId(String(value || ""));
  if (normalized) keys.add(`${prefix}:${normalized}`);
}

function addSpeciesLikeKeys(keys: Set<string>, value: unknown): void {
  const raw = String(value || "").trim();
  if (!raw) return;
  addSlotKey(keys, "species", raw);
  addSlotKey(keys, "details_species", raw.split(",", 1)[0]);
}

function addMoveSignatureKey(keys: Set<string>, species: unknown, moves: unknown): void {
  const speciesId = toId(String(species || ""));
  if (!speciesId || !Array.isArray(moves)) return;
  const moveIds = moves.map((move: any) => toId(move?.id || move?.move || move?.name || move)).filter(Boolean).sort();
  if (moveIds.length) keys.add(`species_moves:${speciesId}:${moveIds.join(",")}`);
}

function keysForState(state: Partial<PlayerPokemonState>): Set<string> {
  const keys = new Set<string>();
  addSlotKey(keys, "showdown_id", state.showdown_id);
  addSlotKey(keys, "run_member", (state as PlayerPokemonState & {run_member_id?: string}).run_member_id);
  const short = shortIdent(state.ident || "");
  addSlotKey(keys, "ident", short);
  addSpeciesLikeKeys(keys, state.details);
  addSpeciesLikeKeys(keys, state.species);
  addSlotKey(keys, "item", state.item);
  addMoveSignatureKey(keys, state.species || state.details || short, state.moves || []);
  return keys;
}

function keysForSet(set: Partial<PokemonSet> | undefined): Set<string> {
  const keys = new Set<string>();
  if (!set) return keys;
  addSlotKey(keys, "showdown_id", set.showdown_id);
  addSlotKey(keys, "run_member", set.run_member_id);
  addSlotKey(keys, "ident", set.name || set.species);
  addSpeciesLikeKeys(keys, set.species || set.name);
  addSlotKey(keys, "ability", set.ability);
  addSlotKey(keys, "item", set.item);
  addMoveSignatureKey(keys, set.species || set.name, set.moves || []);
  return keys;
}

function keysForDisplay(pokemon: Partial<RentalPokemon> | undefined): Set<string> {
  const keys = new Set<string>();
  if (!pokemon) return keys;
  addSlotKey(keys, "showdown_id", pokemon.showdown_id);
  addSlotKey(keys, "run_member", pokemon.run_member_id);
  addSlotKey(keys, "ident", pokemon.name || pokemon.species || pokemon.species_id);
  addSpeciesLikeKeys(keys, pokemon.species || pokemon.name || pokemon.species_id);
  addSlotKey(keys, "species_id", pokemon.species_id);
  addSlotKey(keys, "ability", pokemon.ability_id || pokemon.ability);
  addSlotKey(keys, "item", pokemon.item_id || pokemon.item);
  addMoveSignatureKey(keys, pokemon.species || pokemon.name || pokemon.species_id, pokemon.moves || []);
  return keys;
}

function buildSideSlotKeys(team: PokemonSet[], display: RentalPokemon[], states: PlayerPokemonState[] | undefined, side: SideId): SlotKeySpec[] {
  const maxLength = Math.max(team.length, display.length, states?.length || 0);
  return Array.from({length: maxLength}, (_, index) => {
    const slot = index + 1;
    const keys = new Set<string>();
    for (const key of keysForSet(team[index])) keys.add(key);
    for (const key of keysForDisplay(display[index])) keys.add(key);
    for (const key of keysForState(states?.[index] || {})) keys.add(key);
    const fallbackName = display[index]?.species || display[index]?.name || team[index]?.species || team[index]?.name || states?.[index]?.species || states?.[index]?.details || slot;
    addSlotKey(keys, "ident", `${side}: ${fallbackName}`);
    keys.add(`slot:${slot}`);
    return {slot, keys};
  });
}

function resolveStateSlot(state: PlayerPokemonState, slotKeys: SlotKeySpec[], usedSlots: Set<number>): number {
  if (!slotKeys.length) return Number(state.slot) || 1;
  const keys = keysForState(state);
  for (const key of keys) {
    const match = slotKeys.find(spec => !usedSlots.has(spec.slot) && spec.keys.has(key));
    if (match) return match.slot;
  }
  const fallbackSlot = Number(state.slot);
  if (fallbackSlot && slotKeys.some(spec => spec.slot === fallbackSlot) && !usedSlots.has(fallbackSlot)) return fallbackSlot;
  return slotKeys.find(spec => !usedSlots.has(spec.slot))?.slot || fallbackSlot || 1;
}

function alignStatesToSlots(states: PlayerPokemonState[], slotKeys: SlotKeySpec[]): PlayerPokemonState[] {
  if (!slotKeys.length) return states;
  const usedSlots = new Set<number>();
  return states
    .map(state => {
      const slot = resolveStateSlot(state, slotKeys, usedSlots);
      usedSlots.add(slot);
      return {...state, slot};
    })
    .sort((a, b) => a.slot - b.slot);
}

function sourceIdentityByShowdownId(team: PokemonSet[] = [], display: RentalPokemon[] = [], states: PlayerPokemonState[] | undefined): Map<string, {run_member_id?: string; showdown_id: string}> {
  const identities = new Map<string, {run_member_id?: string; showdown_id: string}>();
  const length = Math.max(team.length, display.length, states?.length || 0);
  for (let index = 0; index < length; index += 1) {
    const showdownId = normalizeShowdownId(team[index]?.showdown_id || team[index]?.pokeball || display[index]?.showdown_id || states?.[index]?.showdown_id);
    if (!showdownId) continue;
    const runMemberId = String(team[index]?.run_member_id || display[index]?.run_member_id || states?.[index]?.run_member_id || "").trim() || undefined;
    identities.set(showdownId, {showdown_id: showdownId, run_member_id: runMemberId});
  }
  return identities;
}

function speciesIdForSet(pokemon: Partial<PokemonSet> | undefined): string {
  return toId(String(pokemon?.species || pokemon?.name || ""));
}

function speciesIdForRuntime(pokemon: RuntimePokemon | undefined): string {
  return toId(shortIdent(pokemon?.details || pokemon?.ident || "").split(",", 1)[0]);
}

function sideTeamMatchScore(request: BattleRequestView | undefined, team: PokemonSet[]): {available: boolean; score: number} {
  const runtimeTeam = request?.side?.pokemon || [];
  if (!runtimeTeam.length || !team.length) return {available: false, score: 0};
  const runtimeById = new Map<string, RuntimePokemon>();
  for (const pokemon of runtimeTeam) {
    const id = normalizeShowdownId(pokemon.pokeball);
    if (id) runtimeById.set(id, pokemon);
  }
  let score = 0;
  let matched = 0;
  for (const pokemon of team) {
    const id = normalizeShowdownId(pokemon.showdown_id || pokemon.pokeball);
    const expectedSpecies = speciesIdForSet(pokemon);
    const runtime = id ? runtimeById.get(id) : undefined;
    if (runtime) {
      matched += 1;
      score += 2;
      const runtimeSpecies = speciesIdForRuntime(runtime);
      if (expectedSpecies && runtimeSpecies && expectedSpecies === runtimeSpecies) score += 4;
      continue;
    }
    if (expectedSpecies && runtimeTeam.some(entry => speciesIdForRuntime(entry) === expectedSpecies)) score += 1;
  }
  return {available: true, score: score + matched};
}

function findRentalByRuntime(team: RentalPokemon[], runtime: RuntimePokemon | string): RentalPokemon | undefined {
  const showdownId = normalizeShowdownId(typeof runtime === "string" ? "" : runtime.pokeball);
  if (showdownId) {
    const byShowdownId = team.find(pokemon => normalizeShowdownId(pokemon.showdown_id) === showdownId);
    if (byShowdownId) return byShowdownId;
  }
  const key = toId(shortIdent(typeof runtime === "string" ? runtime : runtime.ident));
  return team.find(pokemon => toId(pokemon.species) === key || toId(pokemon.name) === key || pokemon.species_id === key);
}

function displayNameForAi(pokemon: RentalPokemon): string {
  return pokemon.species_zh || pokemon.name || pokemon.species || pokemon.species_id || "宝可梦";
}

function addUnique(values: string[], value: string): void {
  if (value && !values.includes(value)) values.push(value);
}

function removeValue(values: string[], value: string): void {
  const index = values.indexOf(value);
  if (index >= 0) values.splice(index, 1);
}

const STAT_LABEL_FALLBACKS: Record<string, string> = {
  atk: "攻击",
  def: "防御",
  spa: "特攻",
  spd: "特防",
  spe: "速度",
  accuracy: "命中",
  evasion: "回避",
};

const CANT_REASON_FALLBACKS: Record<string, string> = {
  flinch: "畏缩",
  par: "麻痹",
  paralysis: "麻痹",
  slp: "睡眠",
  sleep: "睡眠",
  frz: "冰冻",
  freeze: "冰冻",
  recharge: "再充电",
  confusion: "混乱",
  attract: "着迷",
  taunt: "挑衅",
  disable: "定身",
  truant: "偷懒",
  focuspunch: "集中猛击",
  powder: "粉尘",
  gravity: "重力",
  healblock: "回复封锁",
  imprisonment: "封印",
  throatlock: "地狱突刺",
};

function statLabel(service: GameService, stat: string): string {
  const id = toId(stat);
  return STAT_LABEL_FALLBACKS[id] || service.plain("stats", stat) || stat;
}

function cantReasonLabel(service: GameService, reason: string): string {
  const id = toId(reason);
  return CANT_REASON_FALLBACKS[id] || service.effectName(reason) || reason;
}

function boostText(service: GameService, stat: string, value: string): string {
  const translated = statLabel(service, stat);
  return `${translated}${Number(value) >= 0 ? "+" : ""}${value}`;
}

function effectTarget(parts: string[], start = 4): string {
  const owner = parts.slice(start).find(part => part.startsWith("[of] "));
  return owner ? owner.replace("[of] ", "") : "";
}

type ProtocolSource = {
  kind: "item" | "ability" | "move" | "effect" | "";
  name: string;
  label: string;
  raw: string;
  ownerIdent: string;
  ownerName: string;
};

function sourceLabel(raw: string, service: GameService): Omit<ProtocolSource, "ownerIdent" | "ownerName"> {
  if (raw.startsWith("item: ")) {
    const name = service.plain("items", raw.replace("item: ", ""));
    return {kind: "item", name, label: `道具${name}`, raw};
  }
  if (raw.startsWith("ability: ")) {
    const name = service.plain("abilities", raw.replace("ability: ", ""));
    return {kind: "ability", name, label: `特性${name}`, raw};
  }
  if (raw.startsWith("move: ")) {
    const name = service.plain("moves", raw.replace("move: ", ""));
    return {kind: "move", name, label: `招式${name}`, raw};
  }
  const name = service.effectName(raw);
  return {kind: "effect", name, label: name, raw};
}

function protocolSource(parts: string[], service: GameService, start = 4): ProtocolSource {
  let source: Omit<ProtocolSource, "ownerIdent" | "ownerName"> = {kind: "", name: "", label: "", raw: ""};
  let ownerIdent = "";
  for (const part of parts.slice(start)) {
    if (part.startsWith("[from] ")) source = sourceLabel(part.replace("[from] ", ""), service);
    else if (part.startsWith("[of] ")) ownerIdent = part.replace("[of] ", "");
  }
  return {
    ...source,
    ownerIdent,
    ownerName: ownerIdent ? translatedSpecies(service, ownerIdent) : "",
  };
}

function sourceEventType(source: ProtocolSource): ParsedTimelineEvent["type"] {
  if (source.kind === "item") return "item";
  if (source.kind === "ability") return "ability";
  return "message";
}

function eventSource(parts: string[], targetIdent: string | undefined, service: GameService): string {
  const source = protocolSource(parts, service);
  const target = service.plain("species", shortIdent(targetIdent || ""));
  if (source.name && source.name !== "吸取效果" && source.ownerName && source.ownerName !== target) return `${source.ownerName} 的${source.label}`;
  return source.label || source.name;
}

function sourceActivationText(source: ProtocolSource, fallbackOwner: string, suffix: string): string {
  const owner = source.ownerName || fallbackOwner;
  if (!source.name) return suffix;
  if (source.name === "吸取效果") return `吸取效果${suffix}`;
  return suffix ? `${owner} 的${source.label}发动，${suffix}` : `${owner} 的${source.label}发动。`;
}

function appendDescription(text: string, description: string): string {
  const clean = description.trim();
  return clean ? `${text}${clean}` : text;
}

function abilityNotice(service: GameService, target: string, rawAbility: string, fallbackAbility: string): Pick<ParsedTimelineEvent, "notice_title" | "notice_detail"> {
  const ability = service.plain("abilities", rawAbility.replace("ability: ", "")) || fallbackAbility;
  return {
    notice_title: `${target}的${ability}`,
    notice_detail: service.abilityDescription(rawAbility),
  };
}

function itemNotice(service: GameService, target: string, rawItem: string, fallbackItem: string, action = ""): Pick<ParsedTimelineEvent, "notice_title" | "notice_detail"> {
  const item = service.plain("items", rawItem.replace("item: ", "")) || fallbackItem;
  return {
    notice_title: `${target}使用了${item}`,
    notice_detail: action || service.itemDescription(rawItem),
  };
}

function sourceNotice(service: GameService, target: string, source: ProtocolSource, action = ""): Pick<ParsedTimelineEvent, "notice_title" | "notice_detail"> {
  if (source.kind === "ability") return abilityNotice(service, target, source.raw, source.name);
  if (source.kind === "item") return itemNotice(service, target, source.raw, source.name, action);
  return {};
}

function hasTag(parts: string[], tag: string): boolean {
  return parts.includes(tag);
}

function protocolDebugEnabled(): boolean {
  return runtimeEnv("CHANGEBATTLE_DEBUG_SHOWDOWN") === "1";
}

function isIgnoredProtocolTag(tag: string): boolean {
  return [
    "",
    "player",
    "teamsize",
    "gametype",
    "gen",
    "tier",
    "rule",
    "clearpoke",
    "poke",
    "teampreview",
    "start",
    "request",
    "upkeep",
    "t:",
    "inactive",
    "inactiveoff",
    "debug",
    "-center",
    "-anim",
  ].includes(tag);
}

function isInternalProtocolMove(move: string | undefined): boolean {
  return ["zsprite"].includes(toId(move || ""));
}

function isInternalProtocolEffect(effect: string | undefined): boolean {
  const id = toId(String(effect || "").replace(/^(?:move|ability|item):\s*/i, ""));
  return ["healreplacement"].includes(id);
}

function pokemonActionLabel(tag: string): string {
  return ({
    switch: "上场了",
    drag: "被拖上场",
    replace: "显露了真实身份",
    detailschange: "形态改变",
    "-formechange": "形态改变",
  } as Record<string, string>)[tag] || "变化";
}

function sideConditionText(side: SideId, action: "start" | "end", value: string): string {
  return `${SIDE_NAMES[side]} 场地${action === "start" ? "出现" : "移除"}：${value}`;
}

function setBoostValue(tracker: BattleTracker, side: SideId | null, stat: string, value: number): void {
  if (!side) return;
  tracker.boosts[side][stat] = Math.max(-6, Math.min(6, value));
}

function addBoostValue(tracker: BattleTracker, side: SideId | null, stat: string, value: number): void {
  if (!side) return;
  const current = Number(tracker.boosts[side][stat] || 0);
  setBoostValue(tracker, side, stat, current + value);
}

function clearBoostValue(tracker: BattleTracker, side: SideId | null, positive: boolean | null = null): void {
  if (!side) return;
  for (const [stat, value] of Object.entries(tracker.boosts[side])) {
    if (positive === null || (positive && value > 0) || (!positive && value < 0)) {
      delete tracker.boosts[side][stat];
    }
  }
}

function hasPendingRealHeal(messages: Message[], ident: string, condition: string): boolean {
  const target = shortIdent(ident);
  return splitLogLines(messages).some(line => {
    const parts = line.split("|");
    return parts[1] === "-heal" && shortIdent(parts[2] || "") === target && parts[3] === condition;
  });
}

function parseConditionHp(condition: string | undefined): BattleTimelineEvent["hp"] {
  const match = String(condition || "").match(/(\d+)\/(\d+)/);
  if (!match) return null;
  return {current: Number(match[1]), max: Number(match[2]), text: `${match[1]}/${match[2]}`};
}

function setHpCondition(raw: string | undefined, before: BattleTimelineEvent["hp"]): string {
  const value = String(raw || "");
  if (!value) return "";
  if (parseConditionHp(value) || /\bfnt\b/i.test(value)) return value;
  const current = Number(value);
  if (Number.isFinite(current) && before?.max) return `${Math.max(0, current)}/${before.max}`;
  return value;
}

function translatedSpecies(service: GameService, ident: string | undefined): string {
  return service.plain("species", shortIdent(ident || ""));
}

function runtimeShowdownIdForIdent(requests: Record<string, BattleRequestView> | undefined, tracker: BattleTracker, side: SideId | null, raw: string | undefined, condition?: string, explicit?: string): string | undefined {
  const explicitId = normalizeShowdownId(explicit);
  if (explicitId) return explicitId;
  if (!side || !raw) return undefined;
  const requestRows = requests?.[side]?.side?.pokemon || [];
  const targetShort = toId(shortIdent(raw));
  const matching = requestRows.filter(pokemon => {
    if (toId(shortIdent(pokemon.ident)) !== targetShort) return false;
    if (condition && pokemon.condition !== condition) return false;
    return true;
  });
  const active = matching.find(pokemon => pokemon.active) || requestRows.find(pokemon => pokemon.active && toId(shortIdent(pokemon.ident)) === targetShort);
  if (active?.pokeball) return normalizeShowdownId(active.pokeball);
  const currentActive = requestRows.find(pokemon => pokemon.active);
  if (currentActive?.pokeball && toId(shortIdent(currentActive.ident)) === targetShort) return normalizeShowdownId(currentActive.pokeball);
  const ids = Array.from(new Set(matching.map(pokemon => normalizeShowdownId(pokemon.pokeball)).filter(Boolean)));
  if (ids.length === 1) return ids[0];
  if (isActiveIdent(tracker, side, raw) && tracker.active[side]?.showdown_id) return tracker.active[side].showdown_id;
  return undefined;
}

function attachTimelineShowdownIds(event: ParsedTimelineEvent, line: string, tag: string, parts: string[], tracker: BattleTracker, requests: Record<string, BattleRequestView> | undefined, lineShowdownIds?: Map<string, string>): void {
  const explicit = lineShowdownIds?.get(line);
  if (event.targetSide && !event.target_showdown_id) {
    const targetRaw = [parts[2], parts[3], parts[4]].find(value => sideFromIdent(value || "") === event.targetSide);
    event.target_showdown_id = runtimeShowdownIdForIdent(requests, tracker, event.targetSide, targetRaw, event.condition, explicit);
  }
  if (event.side && !event.source_showdown_id) {
    const sourceRaw = sideFromIdent(parts[2] || "") === event.side ? parts[2] : undefined;
    event.source_showdown_id = runtimeShowdownIdForIdent(requests, tracker, event.side, sourceRaw, undefined, tag === "move" ? undefined : explicit);
  }
}

function consumeLog(messages: Message[], tracker: BattleTracker, service: GameService, requests?: Record<string, BattleRequestView>, lineShowdownIds?: Map<string, string>): {events: string[]; timeline: ParsedTimelineEvent[]} {
  const events: string[] = [];
  const timeline: ParsedTimelineEvent[] = [];
  let pendingEffectiveness: Array<{text: string; event: ParsedTimelineEvent}> = [];
  for (const line of splitLogLines(messages)) {
    const parts = line.split("|");
    const tag = parts[1] || "";
    let text: string | null = null;
    let timelineEvent: ParsedTimelineEvent | null = null;
    let afterEvents: Array<{text: string; event: ParsedTimelineEvent}> = [];
    if (tag === "turn" && parts[2]) {
      tracker.turn = Number(parts[2]) || tracker.turn;
      continue;
    } else if (["switch", "drag", "replace", "detailschange", "-formechange"].includes(tag) && parts[2]) {
      const side = sideFromIdent(parts[2]);
      const oldName = side ? tracker.active[side]?.display_name || translatedSpecies(service, parts[2]) : translatedSpecies(service, parts[2]);
      const nextDetails = parts[3] || parts[2];
      const nextDisplay = activeDisplay(service, nextDetails);
      const nextName = nextDisplay.name_zh;
      const targetId = nextDisplay.name;
      const condition = parts[4] || tracker.active[side || "p1"]?.condition || "?";
      const activeShowdownId = runtimeShowdownIdForIdent(requests, tracker, side, parts[2], condition, lineShowdownIds?.get(line));
      if (side) {
        setActiveDisplay(tracker, service, side, nextDetails, condition, tag === "switch" || tag === "drag", activeShowdownId);
        tracker.active[side].status = "";
        if (tag === "switch" || tag === "drag") tracker.boosts[side] = {};
      }
      text = tag === "detailschange" || tag === "-formechange"
        ? `${oldName} ${pokemonActionLabel(tag)}为 ${nextName}。`
        : `${nextName} ${pokemonActionLabel(tag)}。`;
      timelineEvent = {type: tag === "detailschange" || tag === "-formechange" ? "form" : "switch", text, side: side || undefined, targetSide: side || undefined, target: nextName, target_id: targetId, target_showdown_id: activeShowdownId, target_species_id: nextDisplay.species_id, sprite: nextDisplay.sprite, condition, hp: parseConditionHp(condition)};
    } else if (tag === "move" && parts[2] && parts[3]) {
      if (isInternalProtocolMove(parts[3])) continue;
      const side = sideFromIdent(parts[2]);
      const source = translatedSpecies(service, parts[2]);
      const sourceId = shortIdent(parts[2]);
      const move = service.plain("moves", parts[3]);
      text = `${source} 使用 ${move}。`;
      timelineEvent = {type: "move", text, side: side || undefined, source, source_id: sourceId, move};
    } else if (tag === "-terastallize" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      if (side) {
        timelineEvent = beginTerastalDisplay(tracker, service, side, parts[2], parts[3]);
        text = timelineEvent.text;
      }
    } else if (tag === "cant" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const reason = cantReasonLabel(service, parts[3]);
      const move = parts[4] ? service.plain("moves", parts[4]) : "";
      text = move ? `${target} 因 ${reason} 无法使出 ${move}。` : `${target} 因 ${reason} 无法行动。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: reason};
    } else if (tag === "-transform" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const source = translatedSpecies(service, parts[2]);
      const targetDisplay = activeDisplay(service, parts[3]);
      const target = targetDisplay.name_zh;
      const protocol = protocolSource(parts, service);
      if (side) setActiveDisplay(tracker, service, side, parts[3], tracker.active[side]?.condition);
      text = protocol.name ? sourceActivationText(protocol, source, `变身为 ${target}。`) : `${source} 变身为 ${target}。`;
      timelineEvent = {type: "form", text, side: side || undefined, targetSide: side || undefined, source, source_id: shortIdent(parts[2]), target, target_id: targetDisplay.name, target_species_id: targetDisplay.species_id, sprite: targetDisplay.sprite, effect: protocol.name || "变身"};
    } else if ((tag === "-damage" || tag === "-heal") && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const targetId = shortIdent(parts[2]);
      if (side && isActiveIdent(tracker, side, parts[2])) {
        tracker.active[side] = {...tracker.active[side], condition: parts[3]};
      }
      const protocol = protocolSource(parts, service);
      if (protocol.name && protocol.name !== "吸取效果") {
        text = sourceActivationText(protocol, target, `${target} HP: ${service.conditionText(parts[3])}`);
      } else if (protocol.name === "吸取效果") {
        text = `${target} 通过吸取效果回复到 ${service.conditionText(parts[3])}`;
      } else {
        text = tag === "-heal" ? `${target} 回复到 ${service.conditionText(parts[3])}` : `${target} HP: ${service.conditionText(parts[3])}`;
      }
      timelineEvent = {type: tag === "-heal" ? "heal" : "damage", text, targetSide: side || undefined, target, target_id: targetId, effect: protocol.label || protocol.name || undefined, condition: parts[3], hp: parseConditionHp(parts[3]), ...sourceNotice(service, target, protocol, tag === "-heal" ? "恢复了血量。" : "受到了伤害。")};
      if (tag === "-damage" && pendingEffectiveness.length) {
        afterEvents = pendingEffectiveness;
        pendingEffectiveness = [];
      }
    } else if (tag === "-sethp" && parts[2] && parts[3]) {
      const setHpEvents: Array<{text: string; event: ParsedTimelineEvent}> = [];
      for (let partIndex = 2; partIndex + 1 < parts.length; partIndex += 2) {
        const rawTarget = parts[partIndex];
        const rawHp = parts[partIndex + 1];
        const side = sideFromIdent(rawTarget);
        if (!side || !rawHp || rawHp.startsWith("[")) break;
        const target = translatedSpecies(service, rawTarget);
        const before = parseConditionHp(tracker.active[side].condition);
        const condition = setHpCondition(rawHp, before);
        const hp = parseConditionHp(condition);
        if (isActiveIdent(tracker, side, rawTarget)) tracker.active[side] = {...tracker.active[side], condition};
        const eventType = before && hp && hp.current > before.current ? "heal" : "damage";
        const eventText = `${target} HP 变为 ${service.conditionText(condition)}`;
        setHpEvents.push({
          text: eventText,
          event: {
            type: eventType,
            text: eventText,
            turn: tracker.turn,
            targetSide: side,
            target,
            target_id: shortIdent(rawTarget),
            target_showdown_id: runtimeShowdownIdForIdent(requests, tracker, side, rawTarget, condition, lineShowdownIds?.get(line)),
            condition,
            hp,
          },
        });
      }
      if (setHpEvents.length) {
        text = setHpEvents[0].text;
        timelineEvent = setHpEvents[0].event;
        afterEvents = setHpEvents.slice(1);
      }
    } else if (tag === "-status" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      updateActiveStatusToken(tracker, side, parts[2], parts[3], true);
      const target = translatedSpecies(service, parts[2]);
      const status = service.plain("statuses", parts[3]);
      const protocol = protocolSource(parts, service);
      text = protocol.name ? sourceActivationText(protocol, target, `${target} 陷入 ${status}`) : `${target} 陷入 ${status}`;
      timelineEvent = {type: protocol.kind === "item" || protocol.kind === "ability" ? sourceEventType(protocol) : "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: protocol.name || status};
    } else if (tag === "-curestatus" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      updateActiveStatusToken(tracker, side, parts[2], parts[3], false);
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 解除 ${service.plain("statuses", parts[3])}`;
      timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: service.plain("statuses", parts[3])};
    } else if (tag === "-cureteam" && parts[2]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      if (side && isActiveIdent(tracker, side, parts[2])) tracker.active[side] = {...tracker.active[side], status: withoutMajorStatusTokens(tracker.active[side]?.status)};
      text = `${target} 治愈了队伍的异常状态。`;
      timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-start" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      const effectId = toId(parts[3]);
      if (effectId === "substitute") {
        if (side && isActiveIdent(tracker, side, parts[2])) tracker.active[side] = {...tracker.active[side], substitute: true};
        text = `${target} 制造了替身。`;
        timelineEvent = {type: "substitute", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect, substitute: true};
      } else if (effectId === "dynamax") {
        if (side && isActiveIdent(tracker, side, parts[2])) {
          timelineEvent = beginDynamaxDisplay(tracker, service, side, parts[2], parts.some(value => toId(value) === "gmax"));
          text = timelineEvent.text;
        } else {
          text = `${target} 极巨化了！`;
          timelineEvent = {type: "form", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: "Dynamax"};
        }
      } else if (effectId === "confusion") {
        updateActiveStatusToken(tracker, side, parts[2], "confusion", true);
        text = `${target} 陷入混乱。`;
        timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: "confusion"};
      } else {
        text = `${target} 获得状态：${effect}`;
        timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect};
      }
    } else if (tag === "-end" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      const effectId = toId(parts[3]);
      if (effectId === "substitute") {
        if (side && isActiveIdent(tracker, side, parts[2])) tracker.active[side] = {...tracker.active[side], substitute: false};
        text = `${target} 的替身消失了。`;
        timelineEvent = {type: "substitute", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect, substitute: false};
      } else if (effectId === "dynamax") {
        if (side && (isActiveIdent(tracker, side, parts[2]) || tracker.active[side]?.dynamaxed)) {
          timelineEvent = endDynamaxDisplay(tracker, side, parts[2], service);
          text = timelineEvent.text;
        } else {
          text = `${target} 的极巨化结束了。`;
          timelineEvent = {type: "form", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: "DynamaxEnd"};
        }
      } else if (effectId === "confusion") {
        updateActiveStatusToken(tracker, side, parts[2], "confusion", false);
        text = `${target} 的混乱结束了。`;
        timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: "confusion"};
      } else {
        text = `${target} 的 ${effect} 结束了。`;
        timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect};
      }
    } else if ((tag === "-boost" || tag === "-unboost") && parts[2] && parts[3] && parts[4]) {
      const side = sideFromIdent(parts[2]);
      const amount = Number(parts[4]) * (tag === "-boost" ? 1 : -1);
      addBoostValue(tracker, side, parts[3], amount);
      const target = translatedSpecies(service, parts[2]);
      text = `${target} ${boostText(service, parts[3], String(amount))}`;
      timelineEvent = {type: "boost", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: parts[3], boost_amount: amount};
    } else if (tag === "-setboost" && parts[2] && parts[3] && parts[4]) {
      const side = sideFromIdent(parts[2]);
      const previous = side ? Number(tracker.boosts[side][parts[3]] || 0) : 0;
      const next = Number(parts[4]);
      setBoostValue(tracker, side, parts[3], next);
      const target = translatedSpecies(service, parts[2]);
      text = `${target} ${statLabel(service, parts[3])}变为 ${next >= 0 ? "+" : ""}${parts[4]}`;
      timelineEvent = {type: "boost", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: parts[3], boost_amount: next - previous};
    } else if (tag === "-swapboost" && parts[2] && parts[3]) {
      const sourceSide = sideFromIdent(parts[2]);
      const targetSide = sideFromIdent(parts[3]);
      const stats = (parts[4] || "").split(",").filter(Boolean);
      if (sourceSide && targetSide) {
        for (const stat of stats.length ? stats : Object.keys({...tracker.boosts[sourceSide], ...tracker.boosts[targetSide]})) {
          const sourceValue = tracker.boosts[sourceSide][stat] || 0;
          tracker.boosts[sourceSide][stat] = tracker.boosts[targetSide][stat] || 0;
          tracker.boosts[targetSide][stat] = sourceValue;
        }
      }
      text = `${translatedSpecies(service, parts[2])} 和 ${translatedSpecies(service, parts[3])} 交换了能力变化。`;
      timelineEvent = {type: "boost", text, side: sourceSide || undefined, targetSide: targetSide || undefined, effect: "swap"};
    } else if (tag === "-invertboost" && parts[2]) {
      const side = sideFromIdent(parts[2]);
      if (side) {
        for (const stat of Object.keys(tracker.boosts[side])) tracker.boosts[side][stat] = -tracker.boosts[side][stat];
      }
      text = `${translatedSpecies(service, parts[2])} 的能力变化反转了。`;
      timelineEvent = {type: "boost", text, targetSide: side || undefined, target: translatedSpecies(service, parts[2]), target_id: shortIdent(parts[2]), effect: "invert"};
    } else if (tag === "-clearboost" || tag === "-clearallboost") {
      if (tag === "-clearallboost") tracker.boosts = {p1: {}, p2: {}};
      else clearBoostValue(tracker, sideFromIdent(parts[2] || ""));
      text = tag === "-clearallboost" ? "双方能力变化被清除了。" : `${translatedSpecies(service, parts[2])} 的能力变化被清除了。`;
      timelineEvent = {type: "boost", text, targetSide: sideFromIdent(parts[2] || "") || undefined, effect: "clear", boost_amount: 0};
    } else if (tag === "-clearpositiveboost" && parts[2]) {
      clearBoostValue(tracker, sideFromIdent(parts[2]), true);
      text = `${translatedSpecies(service, parts[2])} 的正向能力变化被清除了。`;
      timelineEvent = {type: "boost", text, targetSide: sideFromIdent(parts[2]) || undefined, effect: "clearpositive", boost_amount: 0};
    } else if (tag === "-clearnegativeboost" && parts[2]) {
      clearBoostValue(tracker, sideFromIdent(parts[2]), false);
      text = `${translatedSpecies(service, parts[2])} 的负向能力变化被清除了。`;
      timelineEvent = {type: "boost", text, targetSide: sideFromIdent(parts[2]) || undefined, effect: "clearnegative", boost_amount: 0};
    } else if (tag === "-copyboost" && parts[2] && parts[3]) {
      const sourceSide = sideFromIdent(parts[2]);
      const targetSide = sideFromIdent(parts[3]);
      if (sourceSide && targetSide) tracker.boosts[targetSide] = {...tracker.boosts[sourceSide]};
      text = `${translatedSpecies(service, parts[3])} 复制了 ${translatedSpecies(service, parts[2])} 的能力变化。`;
      timelineEvent = {type: "boost", text, side: sourceSide || undefined, targetSide: targetSide || undefined, effect: "copy"};
    } else if (tag === "-supereffective") {
      text = "效果拔群！";
      timelineEvent = {type: "effectiveness", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
      attachTimelineShowdownIds(timelineEvent, line, tag, parts, tracker, requests, lineShowdownIds);
      pendingEffectiveness.push({text, event: timelineEvent});
      continue;
    } else if (tag === "-resisted") {
      text = "效果不理想。";
      timelineEvent = {type: "effectiveness", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
      attachTimelineShowdownIds(timelineEvent, line, tag, parts, tracker, requests, lineShowdownIds);
      pendingEffectiveness.push({text, event: timelineEvent});
      continue;
    } else if (tag === "-immune" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 没有效果。`;
      timelineEvent = {type: "effectiveness", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-miss" && parts[2]) {
      const source = translatedSpecies(service, parts[2]);
      const target = parts[3] ? translatedSpecies(service, parts[3]) : "";
      text = target ? `${source} 的攻击没有命中 ${target}。` : `${source} 的攻击没有命中。`;
      timelineEvent = {type: "miss", text, side: sideFromIdent(parts[2]) || undefined, targetSide: sideFromIdent(parts[3] || parts[2]) || undefined, source, source_id: shortIdent(parts[2]), target, target_id: parts[3] ? shortIdent(parts[3]) : undefined};
    } else if (tag === "-fail" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      const action = parts[3] ? service.effectName(parts[3]) : "行动";
      text = `${target} 的 ${action} 失败了。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: action};
    } else if (tag === "-block" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      const move = parts[4] ? service.plain("moves", parts[4]) : "";
      text = move ? `${target} 被 ${effect} 保护，挡下了 ${move}。` : `${target} 被 ${effect} 保护。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect};
    } else if (tag === "-notarget") {
      const target = parts[2] ? translatedSpecies(service, parts[2]) : "";
      text = target ? `${target} 不在场，招式失败了。` : "没有目标，招式失败了。";
      timelineEvent = {type: "miss", text, targetSide: sideFromIdent(parts[2] || "") || undefined, target, target_id: shortIdent(parts[2] || "")};
    } else if (tag === "-crit") {
      text = "会心一击！";
      timelineEvent = {type: "crit", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
    }
    else if (tag === "faint" && parts[2]) {
      const side = sideFromIdent(parts[2]);
      if (side && isActiveIdent(tracker, side, parts[2])) tracker.active[side] = {...tracker.active[side], condition: "0 濒死", substitute: false};
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 倒下了。`;
      timelineEvent = {type: "faint", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), condition: "0 fnt", hp: {current: 0, max: 1, text: "0/0"}};
    } else if (tag === "-weather" && parts[2]) {
      tracker.weather = parts[2] === "none" ? "无" : service.effectName(parts[2]);
      const protocol = protocolSource(parts, service, 3);
      if (hasTag(parts, "[upkeep]")) text = `${tracker.weather}还在持续。`;
      else if (tracker.weather === "无") text = "天气恢复正常。";
      else text = protocol.name ? sourceActivationText(protocol, protocol.ownerName, `天气变为${tracker.weather}。`) : `天气变为：${tracker.weather}`;
      timelineEvent = {type: "weather", text, side: sideFromIdent(protocol.ownerIdent) || undefined, targetSide: sideFromIdent(protocol.ownerIdent) || undefined, source: protocol.ownerName || undefined, source_id: protocol.ownerIdent ? shortIdent(protocol.ownerIdent) : undefined, effect: tracker.weather};
    } else if (tag === "-fieldstart" && parts[2]) {
      const value = service.effectName(parts[2]);
      addUnique(tracker.field, value);
      text = `场地效果开始：${value}`;
      timelineEvent = {type: "field", text, effect: value};
    } else if (tag === "-fieldend" && parts[2]) {
      const value = service.effectName(parts[2]);
      removeValue(tracker.field, value);
      text = `场地效果结束：${value}`;
      timelineEvent = {type: "field", text, effect: value};
    } else if ((tag === "-sidestart" || tag === "-sideend") && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      if (side) {
        const value = service.effectName(parts[3]);
        if (tag === "-sidestart") addUnique(tracker.side_conditions[side], value);
        else removeValue(tracker.side_conditions[side], value);
        text = sideConditionText(side, tag === "-sidestart" ? "start" : "end", value);
        timelineEvent = {type: "field", text, side, targetSide: side, effect: value};
      }
    } else if (tag === "-swapsideconditions") {
      [tracker.side_conditions.p1, tracker.side_conditions.p2] = [tracker.side_conditions.p2, tracker.side_conditions.p1];
      text = "双方场地状态交换了。";
      timelineEvent = {type: "field", text};
    } else if (tag === "-item" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const item = service.plain("items", parts[3].replace("item: ", ""));
      const protocol = protocolSource(parts, service);
      text = protocol.name ? sourceActivationText(protocol, target, `${target} 的道具显现：${item}`) : `${target} 的道具显现：${item}`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item, ...itemNotice(service, target, parts[3], item, "道具显现了。")};
    } else if (tag === "-enditem" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const item = service.plain("items", parts[3].replace("item: ", ""));
      const protocol = protocolSource(parts, service);
      const suffix = hasTag(parts, "[eat]") ? `${target} 吃掉了 ${item}。` : `${target} 消耗/失去道具：${item}`;
      text = protocol.name ? sourceActivationText(protocol, target, suffix) : suffix;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item, ...itemNotice(service, target, parts[3], item, hasTag(parts, "[eat]") ? "吃掉了道具。" : "道具被消耗或失去。")};
    } else if (tag === "-ability" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const ability = service.plain("abilities", parts[3].replace("ability: ", ""));
      const abilityDescription = service.abilityDescription(parts[3]);
      const source = eventSource(parts, parts[2], service);
      text = appendDescription(source ? `${target} 的特性变为 ${ability}（${source}）。` : `${target} 的特性${ability}发动。`, abilityDescription);
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: ability, ...abilityNotice(service, target, parts[3], ability)};
    } else if (tag === "-endability" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 的特性被抑制了。`;
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-activate" && parts[2] && parts[3]) {
      const hasPokemonTarget = Boolean(sideFromIdent(parts[2]));
      const targetIdent = hasPokemonTarget ? parts[2] : effectTarget(parts, 3);
      const target = targetIdent ? translatedSpecies(service, targetIdent) : "";
      const rawEffect = hasPokemonTarget ? parts[3] : parts[2];
      if (isInternalProtocolEffect(rawEffect)) continue;
      const effect = service.effectName(rawEffect);
      const protocol = sourceLabel(rawEffect, service);
      const fullSource: ProtocolSource = {...protocol, ownerIdent: targetIdent, ownerName: target};
      text = target ? sourceActivationText(fullSource, target, "") || `${target} 触发效果：${effect}` : `触发效果：${effect}`;
      if (protocol.kind === "ability") text = appendDescription(text, service.abilityDescription(rawEffect));
      timelineEvent = {type: sourceEventType(fullSource), text, targetSide: sideFromIdent(targetIdent) || undefined, target, target_id: targetIdent ? shortIdent(targetIdent) : undefined, effect, ...sourceNotice(service, target, fullSource)};
    } else if (tag === "-mega" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const nextDisplay = activeDisplay(service, parts[3]);
      const item = service.plain("items", parts[4] || "");
      if (side && nextDisplay.species_id.includes("mega")) setActiveDisplay(tracker, service, side, parts[3], tracker.active[side]?.condition);
      const active = side ? tracker.active[side] : undefined;
      text = `${target} 用 ${item} 进行了超级进化！`;
      timelineEvent = {type: "form", text, targetSide: side || undefined, target: active?.display_name || nextDisplay.name_zh, target_id: active?.name || nextDisplay.name, target_species_id: active?.species_id || nextDisplay.species_id, sprite: active?.sprite || nextDisplay.sprite, effect: item || "超级进化"};
    } else if (tag === "-primal" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 进行了原始回归！`;
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-burst" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const species = service.plain("species", parts[3]);
      const item = parts[4] ? service.plain("items", parts[4]) : "";
      text = `${target} ${item ? `借助 ${item} ` : ""}究极爆发为 ${species}！`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item || species};
    } else if (tag === "-zpower" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 被 Z 力量包围！`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: "Z招式"};
    } else if (tag === "-zbroken" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `Z 招式突破了 ${target} 的守护！`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: "Z招式"};
    } else if (tag === "-prepare" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const move = service.plain("moves", parts[3]);
      text = parts[4] ? `${target} 准备对 ${translatedSpecies(service, parts[4])} 使用 ${move}。` : `${target} 准备使用 ${move}。`;
      timelineEvent = {type: "move", text, side: sideFromIdent(parts[2]) || undefined, source: target, source_id: shortIdent(parts[2]), target: parts[4] ? translatedSpecies(service, parts[4]) : undefined, move};
    } else if (tag === "-mustrecharge" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 正在充电，无法行动。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-nothing") {
      text = "什么也没有发生。";
      timelineEvent = {type: "message", text};
    } else if (tag === "-hitcount" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 被击中 ${parts[3]} 次。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if ((tag === "-singlemove" || tag === "-singleturn") && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      const effectId = toId(parts[3]);
      text = effectId === "moveroost"
        ? `${target} 暂时落地了。`
        : tag === "-singleturn"
          ? `${target} 进入了 ${effect} 状态。`
          : `${target} 保持着 ${effect}。`;
      timelineEvent = {type: "status", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect};
    } else if (tag === "-message" && parts[2]) {
      text = parts.slice(2).join(" ");
      timelineEvent = {type: "message", text};
    } else if (tag === "-hint" && parts[2]) {
      text = `提示：${parts.slice(2).join(" ")}`;
      timelineEvent = {type: "message", text};
    } else if (tag === "win" && parts[2]) {
      text = `胜者：${parts[2] === "Player" ? "玩家" : parts[2] === "Enemy" ? "对手" : parts[2]}`;
      timelineEvent = {type: "win", text, side: parts[2] === "Player" ? "p1" : parts[2] === "Enemy" ? "p2" : undefined};
    } else if (tag === "tie") {
      text = "平局。";
      timelineEvent = {type: "win", text};
    } else if (!isIgnoredProtocolTag(tag)) {
      text = `Showdown事件：${line}`;
      timelineEvent = {type: "debug", text};
    }

    if (text !== null) {
      if (timelineEvent) timelineEvent.turn = tracker.turn;
      if (timelineEvent) attachTimelineShowdownIds(timelineEvent, line, tag, parts, tracker, requests, lineShowdownIds);
      if (protocolDebugEnabled() && timelineEvent && ["switch", "drag", "-heal", "-damage"].includes(tag)) {
        battleLogLine("timeline", tag || "event", {line, text, timelineEvent, active: tracker.active});
      }
      events.push(text);
      if (timelineEvent) timeline.push(timelineEvent);
    }
    for (const delayed of afterEvents) {
      delayed.event.turn = delayed.event.turn || tracker.turn;
      attachTimelineShowdownIds(delayed.event, line, tag, parts, tracker, requests, lineShowdownIds);
      events.push(delayed.text);
      timeline.push(delayed.event);
    }
  }
  for (const delayed of pendingEffectiveness) {
    events.push(delayed.text);
    timeline.push(delayed.event);
  }
  return {events, timeline};
}
