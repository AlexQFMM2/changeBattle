export type LocalizedName = {
  en: string;
  zhCn?: string;
};

export type SpriteVariant =
  | "front_normal"
  | "back_normal"
  | "front_shiny"
  | "back_shiny"
  | "front_normal_full"
  | "front_shiny_full";

export type SpriteMapEntry = {
  species_id: string;
  name: string;
  national_dex: number;
  sprite_index: number;
  base_species: string;
  forme: string;
  confidence: "national-dex-direct" | "base-species-fallback" | string;
  source: string;
  sprite_id?: string;
  paths: Record<SpriteVariant, string>;
  fallback_paths?: Record<SpriteVariant, string>;
  icon_asset?: string;
  icon_shiny_asset?: string;
  cry_asset?: string;
};

export type SpriteIndexMap = {
  version: number;
  asset_base: string;
  entries: Record<string, SpriteMapEntry>;
};

export type MoveLearnSource = "levelup" | "machine" | "tutor" | "egg" | "event" | "transfer" | "other";

export type MoveSummary = {
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
  learn_sources?: MoveLearnSource[];
  learn_source_labels?: string[];
};

export type RentalPokemon = {
  run_member_id?: string;
  showdown_id?: string;
  name: string;
  species: string;
  species_zh: string;
  species_id: string;
  level: number;
  gender: string;
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
  item_battle_system?: BattleSystemId;
  tera_type?: string;
  tera_type_zh?: string;
  moves: MoveSummary[];
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
  stage_tier?: 1 | 2 | 3 | 4;
  species_tier?: 1 | 2 | 3 | 4 | 5 | 6 | 10;
  generation_profile?: "tier1" | "tier2" | "tier3" | "tier4" | "champion";
  sprite?: SpriteMapEntry;
};

export type GeneratedTeam = {
  seed: number[];
  team: PokemonSet[];
  display: RentalPokemon[];
  packed: string;
};

export type DesktopDexCategory = "pokemon" | "abilities" | "moves" | "items" | "trainers";

export type BossDexLastResult = "win" | "loss" | null;

export type BossDexSeenPokemon = {
  key: string;
  team_index: number;
  slot: number;
  species_id: string;
  pokemon: RentalPokemon;
};

export type BossDexRecord = {
  encounters: number;
  completed: number;
  wins: number;
  losses: number;
  event_tags?: string[];
  last_result?: BossDexLastResult;
  first_seen_at?: string;
  last_seen_at?: string;
  last_battled_at?: string;
  seen_pool_slots: string[];
  seen_pokemon: Record<string, BossDexSeenPokemon>;
};

export type BossDexPoolSlot = {
  key: string;
  team_index: number;
  slot: number;
  species_id: string;
  species?: string;
  species_tier?: 1 | 2 | 3 | 4 | 5 | 6 | 10;
  battle_rule_preset?: BattleRulePreset;
  generation_profile?: string;
  unlocked: boolean;
  pokemon?: RentalPokemon;
};

export type BossDexPoolRow = {
  team_index: number;
  slots: BossDexPoolSlot[];
};

export type DesktopDexEntry = {
  id: string;
  name: string;
  name_zh: string;
  category: DesktopDexCategory;
  desc?: string;
  desc_zh?: string;
  icon_asset?: string;
  tags?: string[];
  sprite?: SpriteMapEntry;
  types?: string[];
  types_zh?: string[];
  base_stats?: Record<string, number>;
  learnset?: MoveSummary[];
  usage_count?: number;
  type?: string;
  type_zh?: string;
  move_category?: string;
  move_category_zh?: string;
  power?: number;
  accuracy?: number | null;
  pp?: number;
  priority?: number;
  trainer?: TrainerNpcView;
  unlocked?: boolean;
  trainer_tags?: string[];
  boss_record?: BossDexRecord;
  boss_pool_rows?: BossDexPoolRow[];
  boss_summary?: string;
};

export type DesktopDexSearchResult = {
  category: DesktopDexCategory;
  query: string;
  offset: number;
  limit: number;
  total: number;
  has_more: boolean;
  entries: DesktopDexEntry[];
};

export type StarterChoiceState = {
  seed: number;
  coins?: number;
  offers: ShopOffer[];
  purchased?: ShopOffer | null;
  purchased_list?: ShopOffer[];
  max_purchases?: number;
  item_groups?: StarterItemGroupState[];
  whole_rerolls_remaining?: number;
  single_rerolls_remaining?: number;
  inspect_count?: number;
};

export type StarterItemGroup = "battle" | "recovery" | "berry" | "tm";

export type StarterItemGroupState = {
  id: StarterItemGroup;
  name: string;
  quality_level: number;
  quantity_level: number;
  max_quality_level: number;
  max_quantity_level: number;
  offers: ShopOffer[];
  purchased_offer_id?: string | null;
  purchased_offer_ids?: string[];
};

export type PokemonSet = Record<string, any>;

export const SHOWDOWN_ID_POOL = [
  "pokeball",
  "greatball",
  "ultraball",
  "masterball",
  "premierball",
  "luxuryball",
  "duskball",
  "healball",
  "quickball",
  "timerball",
  "repeatball",
  "netball",
  "nestball",
  "diveball",
  "cherishball",
  "fastball",
  "friendball",
  "heavyball",
  "levelball",
  "loveball",
  "lureball",
  "moonball",
  "dreamball",
  "beastball",
] as const;

export const SHOWDOWN_SLOT_IDS = {
  p1: ["pokeball", "greatball", "ultraball", "masterball", "premierball", "luxuryball"],
  p2: ["premierball", "luxuryball", "duskball", "healball", "quickball", "timerball"],
} as const;

export type BattleSideId = keyof typeof SHOWDOWN_SLOT_IDS;
export type ShowdownIdPoolState = {available: string[]; used: string[]};

export function battleSlotShowdownId(side: BattleSideId, slot: number): string {
  const balls = SHOWDOWN_SLOT_IDS[side];
  return balls[Math.max(0, Number(slot || 1) - 1)] || balls[0];
}

export function battleSlotForShowdownId(side: BattleSideId, showdownId: string | undefined): number | null {
  const id = String(showdownId || "").trim().toLowerCase();
  if (!id) return null;
  const index = (SHOWDOWN_SLOT_IDS[side] as readonly string[]).indexOf(id);
  return index >= 0 ? index + 1 : null;
}

export type RuntimePokemon = {
  ident: string;
  details?: string;
  condition: string;
  active?: boolean;
  item?: string;
  pokeball?: string;
};

export type BattleMoveRequest = {
  id: string;
  move: string;
  pp?: number;
  maxpp?: number;
  disabled?: boolean;
  target?: string;
};

export type BattleRequestView = {
  wait?: boolean;
  forceSwitch?: boolean[];
  teamPreview?: boolean;
  side: {
    pokemon: RuntimePokemon[];
  };
  active?: Array<{
    moves: BattleMoveRequest[];
    canZMove?: Array<{move: string; target?: string} | null>;
    canMegaEvo?: boolean | string;
    canDynamax?: boolean;
    canTerastallize?: string | boolean;
    maxMoves?: {
      maxMoves: Array<{move: string; target?: string}>;
      gigantamax?: string;
    };
  }>;
};

export type BattleTracker = {
  turn: number;
  active: Record<"p1" | "p2", {name?: string; display_name?: string; species_id?: string; sprite?: SpriteMapEntry; types?: string[]; types_zh?: string[]; base_stats?: Record<string, number>; ability?: string; ability_zh?: string; ability_id?: string; ability_desc?: string; ability_desc_zh?: string; condition?: string; status?: string; substitute?: boolean; showdown_id?: string; dynamaxed?: boolean; gigantamaxed?: boolean; terastallized?: boolean; tera_type?: string; tera_type_zh?: string; original_species_id?: string; original_name?: string; original_display_name?: string; original_sprite?: SpriteMapEntry}>;
  boosts: Record<"p1" | "p2", Record<string, number>>;
  side_conditions: Record<"p1" | "p2", string[]>;
  weather: string;
  field: string[];
  pp: Record<string, Record<string, {name: string; pp?: number; maxpp?: number}>>;
};

export type BattleTimelineEventType =
  | "message"
  | "move"
  | "miss"
  | "damage"
  | "heal"
  | "effectiveness"
  | "crit"
  | "status"
  | "boost"
  | "item"
  | "ability"
  | "switch"
  | "form"
  | "substitute"
  | "faint"
  | "weather"
  | "field"
  | "debug"
  | "win";

export type BattleTimelineEvent = {
  id: string;
  type: BattleTimelineEventType;
  text: string;
  turn?: number;
  side?: "p1" | "p2";
  targetSide?: "p1" | "p2";
  source?: string;
  source_id?: string;
  source_showdown_id?: string;
  target?: string;
  target_id?: string;
  target_showdown_id?: string;
  target_species_id?: string;
  tera_type?: string;
  tera_type_zh?: string;
  notice_title?: string;
  notice_detail?: string;
  move?: string;
  effect?: string;
  boost_amount?: number;
  condition?: string;
  sprite?: SpriteMapEntry;
  substitute?: boolean;
  hp?: {current: number; max: number; text: string} | null;
};

export type BattleBackgroundView = {
  id: string;
  name: string;
  src: string;
  [key: string]: string | undefined;
};

export type BattleSystemId = "mega" | "zmove" | "dynamax" | "terastal";
export type BattleRulePreset = "none" | "gen7" | "gen8" | "gen9";

export type BattleSetting = {
  allowed_generations: number[];
  battle_rule_preset: BattleRulePreset;
  enabled_battle_systems: BattleSystemId[];
  legendary_battle: boolean;
};

export const BATTLE_GENERATION_OPTIONS = [
  {generation: 1, region: "关都"},
  {generation: 2, region: "城都"},
  {generation: 3, region: "丰缘"},
  {generation: 4, region: "神奥"},
  {generation: 5, region: "合众"},
  {generation: 6, region: "卡洛斯"},
  {generation: 7, region: "阿罗拉"},
  {generation: 8, region: "伽勒尔"},
  {generation: 9, region: "帕底亚"},
] as const;

export const BATTLE_SYSTEM_OPTIONS: Array<{id: BattleSystemId; name: string}> = [
  {id: "mega", name: "Mega"},
  {id: "zmove", name: "Z 招式"},
  {id: "dynamax", name: "极巨化"},
  {id: "terastal", name: "太晶化"},
];

export const BATTLE_RULE_PRESET_OPTIONS: Array<{id: BattleRulePreset; name: string; systems: BattleSystemId[]; max_generation?: number}> = [
  {id: "none", name: "无特殊系统", systems: []},
  {id: "gen7", name: "第七世代规则", systems: ["mega", "zmove"], max_generation: 7},
  {id: "gen8", name: "第八世代规则", systems: ["dynamax"], max_generation: 8},
  {id: "gen9", name: "第九世代规则", systems: ["terastal"], max_generation: 9},
];

export const DEFAULT_BATTLE_SETTING: BattleSetting = {
  allowed_generations: [1, 2, 3, 4, 5, 6, 7],
  battle_rule_preset: "none",
  enabled_battle_systems: [],
  legendary_battle: false,
};

export function battleSystemsForRulePreset(preset: BattleRulePreset): BattleSystemId[] {
  return [...(BATTLE_RULE_PRESET_OPTIONS.find(option => option.id === preset)?.systems || [])];
}

function inferBattleRulePreset(input?: Partial<BattleSetting> | null): BattleRulePreset {
  const explicit = input?.battle_rule_preset;
  if (BATTLE_RULE_PRESET_OPTIONS.some(option => option.id === explicit)) return explicit as BattleRulePreset;
  const systems = new Set(input?.enabled_battle_systems || []);
  if (systems.has("dynamax")) return "gen8";
  if (systems.has("terastal")) return "gen9";
  if (systems.has("mega") || systems.has("zmove")) return "gen7";
  return DEFAULT_BATTLE_SETTING.battle_rule_preset;
}

export function normalizeBattleSetting(input?: Partial<BattleSetting> | null): BattleSetting {
  const validGenerations = new Set<number>(BATTLE_GENERATION_OPTIONS.map(option => option.generation));
  const generationList = Array.from(new Set((input?.allowed_generations || DEFAULT_BATTLE_SETTING.allowed_generations)
    .map(value => Math.floor(Number(value)))
    .filter(value => validGenerations.has(value))));
  const allowed_generations = generationList.length >= 3 ? generationList : [...DEFAULT_BATTLE_SETTING.allowed_generations];
  const battle_rule_preset = inferBattleRulePreset(input);
  const enabled_battle_systems = battleSystemsForRulePreset(battle_rule_preset);
  return {
    allowed_generations,
    battle_rule_preset,
    enabled_battle_systems,
    legendary_battle: Boolean(input?.legendary_battle),
  };
}

export type BattleState = {
  ended: boolean;
  winner: string | null;
  request: BattleRequestView | null;
  player_side?: BattleSideId;
  enemy_side?: BattleSideId;
  tracker: BattleTracker;
  recent_events: string[];
  timeline_events: BattleTimelineEvent[];
  player_team: PokemonSet[];
  player_display: RentalPokemon[];
  enemy_team: PokemonSet[];
  enemy_display: RentalPokemon[];
  player_trainer?: TrainerNpcView;
  enemy_trainer?: TrainerNpcView;
  player_talents?: TalentView[];
  show_move_effectiveness?: boolean;
  battle_setting?: BattleSetting;
  music_scene?: "battle" | "boss";
  enemy_boss_record?: BossDexRecord;
  battle_background?: BattleBackgroundView;
  battle_event_statuses?: RestEventStatusView[];
  contest_score?: number;
  contest_marks?: RestContestState;
};

export type AudioSettings = {
  bgm_enabled: boolean;
  bgm_volume: number;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bgm_enabled: true,
  bgm_volume: 0.2,
};

export type ExchangeState = {
  battle_no: number;
  wins: number;
  player_display: RentalPokemon[];
  enemy_display: RentalPokemon[];
};

export type PlayerPokemonState = {
  run_member_id?: string;
  showdown_id?: string;
  slot: number;
  ident: string;
  details: string;
  species: string;
  hp: number;
  maxhp: number;
  status: string;
  fainted: boolean;
  active: boolean;
  item: string;
  condition: string;
  moves: Array<{
    slot: number;
    id: string;
    move: string;
    pp: number;
    maxpp: number;
  }>;
};

export type RestState = {
  battle_no: number;
  battles: number;
  wins: number;
  battle_points: number;
  coins: number;
  player_display: RentalPokemon[];
  enemy_display: RentalPokemon[];
  player_state: PlayerPokemonState[];
  bag_items: Record<string, number>;
  bag_categories?: BagCategoryView;
  talents?: TalentView[];
  shop?: ShopState;
  starter_items?: StarterItemState;
  move_draws?: Record<string, PricedMove[]>;
  move_draw_rolls?: Record<string, number>;
  scout?: ScoutState;
  night_sky?: NightSkyState;
  review?: ReviewState;
  champion_options?: TrainerNpcView[];
  named_champion_id?: string | null;
  named_challenge_decided?: boolean;
  next_opponent_preview?: {
    battle_no: number;
    label: string;
    trainer: TrainerNpcView;
  };
  reroute_used?: number;
  reroute_limit?: number;
  recycler_available?: boolean;
  recycle_receipt_value?: number;
  portfolio_types?: string[];
  free_scout_used?: boolean;
  free_shop_roll_used?: boolean;
  trust_level_used?: boolean;
  lead_change_used?: boolean;
  restore_hp_used?: boolean;
  restore_pp_used?: boolean;
  restore_status_used?: boolean;
  exchange_box?: RentalPokemon[];
  all_in_used?: boolean;
  all_in_pending_next?: boolean;
  all_in_result?: {
    old_name: string;
    new_name: string;
  } | null;
  score_bet?: RestScoreBetState;
  rest_event?: RestEventState;
  rest_event_statuses?: RestEventStatusView[];
  rainbow_rocket_support?: {
    battle_no: number;
    invasion?: boolean;
    completed?: boolean;
    picks_used: number;
    picks_required: number;
    max_team_size: number;
    factory_display: RentalPokemon[];
    route_display: RentalPokemon[];
    route_trainer?: TrainerNpcView;
  };
  event_services?: {
    doctor?: boolean;
    tutor?: boolean;
    egg?: boolean;
    raid_exchange?: boolean;
    raid_exchange_battle_no?: number;
    level_points?: number;
    score_bet?: boolean;
  };
  taken_enemy_slots: number[];
  exchange_count: number;
  costs: {
    exchange: number | null;
    restore_hp: Record<1 | 2 | 3, number>;
    restore_pp: Record<1 | 2 | 3, number>;
    restore_status: Record<1 | 2 | 3, number>;
    adjust_stats: number;
    randomize_part?: number;
    randomize_all?: number;
    move_draw?: number;
    scout_basic?: number;
    scout_one?: number;
    scout_all?: number;
  };
};

export type RestEventTone = "safe" | "trade" | "risk";

export type RestEventOption = {
  id: string;
  name: string;
  desc: string;
  detail?: string;
  intro?: string;
  effects?: string[];
  tone?: RestEventTone;
};

export type RestEventState = {
  required: boolean;
  selected_id?: string | null;
  options: RestEventOption[];
};

export type RestEventStatusView = {
  id: string;
  label: string;
  detail?: string;
  tone?: RestEventTone;
};

export type RestScoreBetTarget = 1 | 2 | 3;

export type RestScoreBetState = {
  target_alive: RestScoreBetTarget;
  stake: number;
  multiplier: number;
  multiplier_options?: number[];
  max_stake?: number;
  payout?: number;
};

export type RestContestState = {
  score?: number;
  liked?: Record<string, string>;
  disliked?: Record<string, string>;
};

export type ItemCategory = "consumable" | "held" | "tm";

export type BagItemView = {
  id: string;
  name: string;
  name_zh: string;
  count: number;
  category: ItemCategory;
  item_battle_system?: BattleSystemId;
  icon_asset?: string;
  cost?: number;
  sell_price?: number;
  move_id?: string;
  move_name?: string;
  move_name_zh?: string;
  desc?: string;
  desc_zh?: string;
  locked?: boolean;
  lock_reason?: string;
};

export type BagCategoryView = Record<ItemCategory, BagItemView[]>;

export type TalentView = {
  id: string;
  name: string;
  category: string;
  desc: string;
  cost?: number;
  disabled?: boolean;
  level?: number;
  max_level?: number;
  costs?: number[];
  requires?: Array<{id: string; level?: number}>;
  effects?: string[];
  kind?: "talent" | "starter_upgrade" | "event_preview" | "root" | "badge";
  x?: number;
  y?: number;
};

export type StarChartState = {
  nodes: Record<string, number>;
};

export type StarterUpgradeState = {
  item_quality?: Partial<Record<StarterItemGroup, number>>;
  item_quantity?: Partial<Record<StarterItemGroup, number>>;
  pokemon_reroll?: number;
  pokemon_inspect?: number;
  pokemon_single_reroll?: number;
};

export type StarterUpgradeView = {
  id: string;
  name: string;
  group: "道具数量" | "道具质量" | "开局选牌";
  desc: string;
  level: number;
  max_level: number;
  cost?: number | null;
};

export type ShopOffer = ShopItem & {
  offer_id: string;
  category: ItemCategory;
  icon_asset?: string;
  discount?: number;
  discountable?: boolean;
  source?: "shop" | "starter";
  starter_group?: StarterItemGroup;
  starter_group_label?: string;
  item_tier?: number;
  move_id?: string;
  move_name?: string;
  move_name_zh?: string;
};

export type ShopKind = "recovery" | "held" | "tm" | "mega" | "zmove";

export type ShopState = {
  kind?: ShopKind;
  title?: string;
  theme?: "green" | "blue" | "purple" | "orange";
  available_kinds?: ShopKind[];
  roll_count: number;
  next_roll_cost: number | null;
  slot_count?: number;
  free_rolls_remaining?: number;
  preferred_roll_cost?: number;
  slot_discounts?: number[];
  offers: ShopOffer[];
  offers_by_kind?: Partial<Record<ShopKind, ShopOffer[]>>;
  purchased_offer_id?: string | null;
  purchased_offer_counts?: Record<string, number>;
  purchased_item_counts?: Record<string, number>;
  last_roll_bonus?: {
    item_id: string;
    name: string;
    name_zh: string;
    count: number;
    match_count: number;
    icon_asset?: string;
  } | null;
};

export type ScoutState = {
  level: "basic" | "one" | "all";
  title: string;
  summary: string;
  enemies: RentalPokemon[];
};

export type NightSkyRow = {
  battle_no: number;
  label: string;
  trainer: TrainerNpcView;
  route_type?: TrainerNpcType;
  trainer_visible?: boolean;
  encountered?: boolean;
  named_visible?: boolean;
  revealed: number;
  unlocked?: boolean;
  enemies: Array<RentalPokemon | null>;
};

export type NightSkyState = {
  rows: NightSkyRow[];
};

export type ReviewState = {
  enemies: RentalPokemon[];
  title?: string;
  summary?: string;
};

export type StatId = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type StarterItemState = {
  offers: ShopOffer[];
  purchased: string[];
  max_purchases?: number;
};

export type RestAction =
  | {type: "next"}
  | {type: "abort"}
  | {type: "choose_rest_event"; eventId: string}
  | {type: "choose_doctor_treatment"; branch: "status" | "hp"}
  | {type: "event_learn_move"; service: "tutor" | "egg"; slot: number; moveSlot: number; moveId: string}
  | {type: "event_barter_buy"; offerId: string; itemIds: string[]}
  | {type: "event_raid_exchange"; ownIndex: number; enemyIndex: number}
  | {type: "rainbow_rocket_support"; source: "factory" | "route"; candidateIndex: number; targetIndex?: number | null}
  | {type: "rainbow_rocket_support_done"}
  | {type: "rainbow_rocket_restore"; slots: number[]}
  | {type: "event_apply_level"; slot: number}
  | {type: "event_score_bet_adjust"; targetAlive?: RestScoreBetTarget; stake?: number; multiplier?: number}
  | {type: "restore_hp"; slots: number[]}
  | {type: "restore_pp"; slots: number[]; moveSlot?: number}
  | {type: "restore_status"; slots: number[]}
  | {type: "exchange"; ownIndex: number; enemyIndex: number}
  | {type: "box_exchange"; ownIndex: number; boxIndex: number}
  | {type: "all_in_exchange"; ownIndex: number}
  | {type: "trust_level"; slot: number}
  | {type: "set_lead"; slot: number}
  | {type: "bp_to_coins"; bp: number}
  | {type: "reroute_next"; battleNo?: number}
  | {type: "set_named_champion"; trainerId: string | null}
  | {type: "buy_item"; itemId: string}
  | {type: "roll_shop"; shopKind?: ShopKind}
  | {type: "buy_shop_offer"; offerId: string}
  | {type: "forge_items"; itemIds: string[]}
  | {type: "forge_special_item"; itemId: string}
  | {type: "forge_tera_orb"}
  | {type: "buy_starter_item"; offerId: string}
  | {type: "skip_starter_item"}
  | {type: "sell_item"; itemId: string}
  | {type: "equip_item"; itemId: string; slot: number}
  | {type: "unequip_item"; slot: number}
  | {type: "use_item"; itemId: string; slot: number; moveSlot?: number; stat?: StatId; context?: "rest" | "battle"}
  | {type: "use_tm"; itemId: string; slot: number; moveSlot: number}
  | {type: "draw_moves"; slot: number; moveSlot: number}
  | {type: "apply_drawn_move"; slot: number; moveSlot: number; moveId: string}
  | {type: "scout_next"; level: "basic" | "one" | "all"}
  | {type: "night_sky_scout"; battleNo: number; level: "one" | "all"}
  | {type: "randomize_stat_part"; slot: number; part: "ability" | "nature" | "ivs" | "evs"}
  | {type: "randomize_all_stats"; slot: number}
  | {type: "adjust_move"; slot: number; moveSlot: number; moveId: string}
  | {type: "adjust_stats"; slot: number; ivs: Record<string, number>; evs: Record<string, number>; ability: string; nature: string};

export type ResultSummaryRow = {
  label: string;
  value: string;
  detail?: string;
};

export type ResultPokemonSummary = {
  pokemon: RentalPokemon;
  kills: number;
  deaths: number;
  assists: number;
  damage_dealt: number;
  damage_taken: number;
};

export type ResultPokemonStatEvent = {
  battle_no: number;
  turn: number;
  pokemon_key: string;
  target_key?: string;
  kind: "kill" | "death" | "assist" | "damage_dealt" | "damage_taken";
  value: number;
  source?: "move" | "status" | "item" | "ability" | "field" | "unknown";
};

export type ResultProgressRow = {
  battle_no: number;
  label: string;
  outcome?: "win" | "loss" | "abort" | "pending";
  trainer?: TrainerNpcView;
  trainer_visible?: boolean;
};

export type ResultSummaryState = {
  outcome: "win" | "loss" | "abort";
  headline: string;
  subtitle?: string;
  rows: ResultSummaryRow[];
  coin_rows?: ResultSummaryRow[];
  bp_rows?: ResultSummaryRow[];
  talents?: TalentView[];
  used_pokemon?: ResultPokemonSummary[];
  progress?: ResultProgressRow[];
  player_team?: RentalPokemon[];
  enemy_team?: RentalPokemon[];
  enemy_trainer?: TrainerNpcView;
};

export type SaveManifest = {
  version: 2;
  slot_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  recent_status?: string;
};

export type SaveUserTable = {
  version: 1;
  bp_scale?: number;
  trainer: TrainerProfile;
  stats: TrainerStats;
  audio_settings?: AudioSettings;
  run_memory?: {
    player_species_ids?: string[];
    enemy_species_ids?: string[];
  };
  created_at: string;
  updated_at: string;
};

export type SaveTalentTable = {
  version: 1;
  talent_unlocks: string[];
  talent_equipped: string[];
  named_champion_id?: string | null;
  star_chart?: StarChartState;
};

export type SaveStarterUpgradesTable = {
  version: 1;
  starter_upgrades?: StarterUpgradeState;
};

export type SaveBattleSettingTable = {
  version: 1;
  battle_setting: BattleSetting;
};

export type SaveBossDexTable = {
  version: 1;
  boss_dex: Record<string, BossDexRecord>;
};

export type SavePokemonRecordsTable = {
  version: 1;
  records: Record<string, unknown>;
};

export type SaveRunCheckpointTable = {
  version: 1;
  current_run: CurrentRunSave;
};

export type BattleRecordEntry = {
  id: string;
  created_at: string;
  run_seed: number;
  battle_no: number;
  total_battles: number;
  outcome: "win" | "loss" | "abort";
  winner: string | null;
  message: string;
  enemy_trainer?: TrainerNpcView;
  player_team: RentalPokemon[];
  enemy_team: RentalPokemon[];
  player_pokemon?: ResultPokemonSummary[];
  result_summary?: ResultSummaryState;
};

export type SaveBattleRecordsTable = {
  version: 1;
  records: BattleRecordEntry[];
};

export type ShopItem = {
  id: string;
  name: string;
  name_zh: string;
  cost: number;
  desc: string;
  desc_zh: string;
  icon_asset?: string;
};

export type PricedMove = MoveSummary & {
  cost: number;
};

export type AbilityOption = {
  id: string;
  name: string;
  name_zh: string;
  desc: string;
  desc_zh: string;
};

export type NatureOption = {
  id: string;
  name: string;
  name_zh: string;
  plus: string;
  minus: string;
  plus_zh: string;
  minus_zh: string;
};

export type PokemonEditOptions = {
  abilities: AbilityOption[];
  natures: NatureOption[];
};

export type PlannedBattleData = {
  battle_no: number;
  route_type: "normal" | "gym" | "champion" | "elite4";
  route_stage: string;
  route_route: string;
  generation_stage: string;
  special_event?: "villain_intrusion" | "rainbow_rocket";
  enemy_team_pool_id?: string;
  enemy_trainer: TrainerNpcView;
  enemy_raw: PokemonSet[];
  enemy_display: RentalPokemon[];
  battle_background?: BattleBackgroundView;
};

export type RainbowRocketSupportState = {
  battle_no: number;
  invasion?: boolean;
  completed?: boolean;
  picks_used?: number;
  picks_required?: number;
  max_team_size?: number;
  factory_team: PokemonSet[];
  factory_display: RentalPokemon[];
  route_team: PokemonSet[];
  route_display: RentalPokemon[];
  route_trainer?: TrainerNpcView;
};

export type CurrentRunData = {
  status: "ready" | "in_battle" | "awaiting_rest" | "awaiting_exchange";
  seed: number;
  battles: number;
  next_battle?: number;
  battle_no?: number;
  wins: number;
  reroll_count?: number;
  shop_roll_count?: number;
  shop_kind?: ShopKind;
  shop_offers?: ShopOffer[];
  shop_offers_by_kind?: Partial<Record<ShopKind, ShopOffer[]>>;
  shop_purchased_offer_id?: string | null;
  shop_purchased_offer_counts?: Record<string, number>;
  shop_purchased_item_counts?: Record<string, number>;
  shop_last_roll_bonus?: ShopState["last_roll_bonus"];
  starter_item_offers?: ShopOffer[];
  starter_item_purchased?: string[];
  non_refundable_bag_items?: Record<string, number>;
  bag_item_meta?: Record<string, Partial<ShopOffer>>;
  move_draws?: Record<string, PricedMove[]>;
  move_draw_rolls?: Record<string, number>;
  scout?: ScoutState;
  night_sky?: NightSkyState;
  review?: ReviewState;
  reroute_used?: number;
  forced_trainer_ids?: Record<string, string>;
  reroute_history?: Record<string, string[]>;
  named_champion_id?: string | null;
  recycle_receipt_value?: number;
  economy_spend_types?: string[];
  talents?: TalentView[];
  battle_setting?: BattleSetting;
  tera_orb_type?: string;
  tera_orb_type_zh?: string;
  used_pokemon_display?: RentalPokemon[];
  used_pokemon_stats?: Record<string, Omit<ResultPokemonSummary, "pokemon">>;
  used_pokemon_stat_events?: ResultPokemonStatEvent[];
  boss_type?: "normal" | "gym" | "champion" | "elite4";
  special_run?: "rainbow_rocket";
  special_event?: "villain_intrusion" | "rainbow_rocket";
  boss_stage?: string;
  boss_route?: string;
  enemy_team_pool_id?: string;
  generation_stage?: string;
  player_trainer?: TrainerNpcView;
  enemy_trainer?: TrainerNpcView;
  enemy_boss_record?: BossDexRecord;
  battle_background?: BattleBackgroundView;
  run_start_bp?: number;
  temporary_bp_debt?: number;
  coins?: number;
  non_convertible_coins?: number;
  coins_earned_this_run?: number;
  second_team_roar_used?: boolean;
  all_in_exchange_used?: boolean;
  showdown_id_pool?: ShowdownIdPoolState;
  planned_battles?: PlannedBattleData[];
  original_planned_battles?: PlannedBattleData[];
  player_side?: BattleSideId;
  enemy_side?: BattleSideId;
  exchange_box?: {
    team: PokemonSet[];
    display: RentalPokemon[];
    state: PlayerPokemonState[];
  };
  player_team: PokemonSet[];
  player_display: RentalPokemon[];
  player_state?: PlayerPokemonState[];
  enemy_raw?: PokemonSet[];
  enemy_display?: RentalPokemon[];
  bp_earned_this_run?: number;
  bp_investments?: number[];
  move_investments?: number[][];
  bag_items?: Record<string, number>;
  rest_status?: {
    exchanges?: number;
    taken_enemy_slots?: number[];
    free_shop_roll_used?: boolean;
    free_shop_rolls_remaining?: number;
    trust_level_used?: boolean;
    lead_change_used?: boolean;
    shop_slot_discounts?: number[];
    shop_preferred_roll_used?: boolean;
    free_scout_used?: boolean;
    restore_hp_used?: boolean;
    restore_pp_used?: boolean;
    restore_status_used?: boolean;
    all_in_pending_next?: boolean;
    recycler_available?: boolean;
    rest_event_options?: RestEventOption[];
    rest_event_selected_id?: string | null;
    recent_rest_event_ids?: string[];
    all_in_result?: {
      old_name: string;
      new_name: string;
    } | null;
    named_challenge_decided?: boolean;
    event_shop_disabled?: boolean;
    event_shop_price_multiplier?: number;
    event_premium_shop_goods?: boolean;
    event_recovery_multiplier?: number;
    event_hungry?: boolean;
    event_low_tier_recovery_disabled?: boolean;
    event_pending_full_restore?: boolean;
    event_pending_full_restore_after_battle?: boolean;
    event_checked_bag_items?: Record<string, number>;
    event_rest_healing_blocked?: boolean;
    event_next_battle_healing_blocked?: boolean;
    event_barter_active?: boolean;
    event_doctor_pending?: boolean;
    event_tutor_service_available?: boolean;
    event_tutor_service_used?: boolean;
    event_egg_service_available?: boolean;
    event_egg_service_used?: boolean;
    event_contest_next?: RestContestState;
    event_contest_active?: RestContestState;
    event_raid_exchange_available?: boolean;
    event_raid_exchange_battle_no?: number;
    event_raid_exchange_used?: boolean;
    event_rerandomized_locked_battles?: number[];
    event_exchange_disabled?: boolean;
    event_level_points?: number;
    event_soul_swap_next?: boolean;
    event_soul_swap_active?: boolean;
    event_score_bet_next?: RestScoreBetState;
    event_score_bet_active?: RestScoreBetState;
    event_villain_intrusion_checked_battle_no?: number;
    event_villain_intrusion_active?: boolean;
    event_villain_intrusion_battle_no?: number;
    event_villain_intrusion_trainer_id?: string;
    rainbow_rocket_support?: RainbowRocketSupportState;
    rainbow_rocket_restore_used?: number[];
  };
};


export type TrainerGender = "male" | "female" | "other";

export type TrainerNpcType = "player" | "normal" | "gym" | "elite4" | "champion" | "villain" | "avatar";

export type TrainerNpcView = {
  id: string;
  type: TrainerNpcType;
  region?: string;
  role?: string;
  tier?: string;
  name_zh: string;
  name_en?: string;
  front_asset?: string;
  front_gif_asset?: string;
  back_asset?: string;
  avatar_asset?: string;
  team_pool_ids?: string[];
  team_pool_id?: string;
  notes?: string;
};

export type TrainerCatalogState = {
  players: TrainerNpcView[];
  avatars: TrainerNpcView[];
  champions?: TrainerNpcView[];
};

export type TrainerProfile = {
  name: string;
  gender?: TrainerGender;
  player_npc_id?: string;
  front_asset?: string;
  front_gif_asset?: string;
  back_asset?: string;
  avatar_asset?: string;
};

export type TrainerStats = {
  battle_points: number;
  battles: number;
  wins: number;
  losses: number;
  pokemon_usage_counts?: Record<string, number>;
  win_rate?: number;
  set_win_streak?: number;
  best_set_win_streak?: number;
  rank_status: string;
};

export type CurrentRunSave = CurrentRunData | null;

export type AppStatus =
  | "title"
  | "newGame"
  | "mainMenu"
  | "userInfo"
  | "talentConfig"
  | "starterUpgrade"
  | "battleHistory"
  | "battleSetting"
  | "starterItems"
  | "rentalSelect"
  | "battleMain"
  | "moveMenu"
  | "teamMenu"
  | "statusMenu"
  | "exchange"
  | "rest"
  | "result";

export type DesktopGameState = {
  screen: AppStatus;
  save: LocalSave | null;
  candidates?: GeneratedTeam;
  starter?: StarterChoiceState | null;
  selected_indexes?: number[];
  battle?: BattleState | null;
  battle_bag?: BagCategoryView | null;
  exchange?: ExchangeState | null;
  rest?: RestState | null;
  message?: string;
  toast_message?: string;
  result_summary?: ResultSummaryState | null;
  pending_transition?: DesktopGameState | null;
};

export type LocalSave = {
  version: 1;
  bp_scale?: number;
  trainer: TrainerProfile;
  stats: TrainerStats;
  talent_unlocks?: string[];
  talent_equipped?: string[];
  star_chart?: StarChartState;
  starter_upgrades?: StarterUpgradeState;
  battle_setting?: BattleSetting;
  audio_settings?: AudioSettings;
  named_champion_id?: string | null;
  boss_dex?: Record<string, BossDexRecord>;
  run_memory?: {
    player_species_ids?: string[];
    enemy_species_ids?: string[];
  };
  current_run: CurrentRunSave;
  created_at: string;
  updated_at: string;
};
