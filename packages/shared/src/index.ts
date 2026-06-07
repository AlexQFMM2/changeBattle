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
};

export type SpriteIndexMap = {
  version: number;
  asset_base: string;
  entries: Record<string, SpriteMapEntry>;
};

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
  stage_tier?: 1 | 2 | 3 | 4;
  species_tier?: 1 | 2 | 3 | 4;
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
  tags?: string[];
  sprite?: SpriteMapEntry;
  types?: string[];
  types_zh?: string[];
  base_stats?: Record<string, number>;
  learnset?: MoveSummary[];
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

export const SHOWDOWN_SLOT_IDS = {
  p1: ["pokeball", "greatball", "ultraball", "masterball", "premierball", "luxuryball"],
  p2: ["premierball", "luxuryball", "duskball", "healball", "quickball", "timerball"],
} as const;

export type BattleSideId = keyof typeof SHOWDOWN_SLOT_IDS;

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
  }>;
};

export type BattleTracker = {
  turn: number;
  active: Record<"p1" | "p2", {name?: string; display_name?: string; species_id?: string; sprite?: SpriteMapEntry; condition?: string; status?: string; substitute?: boolean; showdown_id?: string}>;
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
  side?: "p1" | "p2";
  targetSide?: "p1" | "p2";
  source?: string;
  source_id?: string;
  source_showdown_id?: string;
  target?: string;
  target_id?: string;
  target_showdown_id?: string;
  target_species_id?: string;
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

export type BattleState = {
  ended: boolean;
  winner: string | null;
  request: BattleRequestView | null;
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
  enemy_boss_record?: BossDexRecord;
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
  scout?: ScoutState;
  night_sky?: NightSkyState;
  review?: ReviewState;
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

export type ItemCategory = "consumable" | "held" | "tm";

export type BagItemView = {
  id: string;
  name: string;
  name_zh: string;
  count: number;
  category: ItemCategory;
  icon_asset?: string;
  cost?: number;
  sell_price?: number;
  move_id?: string;
  move_name?: string;
  move_name_zh?: string;
  desc?: string;
  desc_zh?: string;
};

export type BagCategoryView = Record<ItemCategory, BagItemView[]>;

export type TalentView = {
  id: string;
  name: string;
  category: string;
  desc: string;
  cost?: number;
  disabled?: boolean;
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
  group: "开局道具" | "开局选牌";
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

export type ShopState = {
  roll_count: number;
  next_roll_cost: number | null;
  slot_count?: number;
  free_rolls_remaining?: number;
  preferred_roll_cost?: number;
  slot_discounts?: number[];
  offers: ShopOffer[];
  purchased_offer_id?: string | null;
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

export type StarterItemState = {
  offers: ShopOffer[];
  purchased: string[];
  max_purchases?: number;
};

export type RestAction =
  | {type: "next"}
  | {type: "abort"}
  | {type: "restore_hp"; slots: number[]}
  | {type: "restore_pp"; slots: number[]; moveSlot?: number}
  | {type: "restore_status"; slots: number[]}
  | {type: "exchange"; ownIndex: number; enemyIndex: number}
  | {type: "box_exchange"; ownIndex: number; boxIndex: number}
  | {type: "all_in_exchange"; ownIndex: number}
  | {type: "trust_level"; slot: number}
  | {type: "set_lead"; slot: number}
  | {type: "bp_to_coins"; bp: number}
  | {type: "reroute_next"}
  | {type: "buy_item"; itemId: string}
  | {type: "roll_shop"; preferredCategory?: "healing" | "pp" | "berry" | "battle" | "tm"}
  | {type: "buy_shop_offer"; offerId: string}
  | {type: "buy_starter_item"; offerId: string}
  | {type: "skip_starter_item"}
  | {type: "sell_item"; itemId: string}
  | {type: "equip_item"; itemId: string; slot: number}
  | {type: "unequip_item"; slot: number}
  | {type: "use_item"; itemId: string; slot: number; moveSlot?: number; context?: "rest" | "battle"}
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

export type ResultSummaryState = {
  outcome: "win" | "loss" | "abort";
  headline: string;
  subtitle?: string;
  rows: ResultSummaryRow[];
  player_team?: RentalPokemon[];
  enemy_team?: RentalPokemon[];
  enemy_trainer?: TrainerNpcView;
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

export type CurrentRunData = {
  status: "ready" | "awaiting_rest" | "awaiting_exchange";
  seed: number;
  battles: number;
  next_battle?: number;
  battle_no?: number;
  wins: number;
  reroll_count?: number;
  shop_roll_count?: number;
  shop_offers?: ShopOffer[];
  shop_purchased_offer_id?: string | null;
  shop_last_roll_bonus?: ShopState["last_roll_bonus"];
  starter_item_offers?: ShopOffer[];
  starter_item_purchased?: string[];
  non_refundable_bag_items?: Record<string, number>;
  bag_item_meta?: Record<string, Partial<ShopOffer>>;
  move_draws?: Record<string, PricedMove[]>;
  scout?: ScoutState;
  night_sky?: NightSkyState;
  review?: ReviewState;
  reroute_used?: number;
  forced_trainer_ids?: Record<string, string>;
  named_champion_id?: string | null;
  recycle_receipt_value?: number;
  economy_spend_types?: string[];
  talents?: TalentView[];
  boss_type?: "normal" | "gym" | "champion" | "elite4";
  boss_stage?: string;
  boss_route?: string;
  enemy_team_pool_id?: string;
  generation_stage?: string;
  player_trainer?: TrainerNpcView;
  enemy_trainer?: TrainerNpcView;
  enemy_boss_record?: BossDexRecord;
  run_start_bp?: number;
  temporary_bp_debt?: number;
  coins?: number;
  non_convertible_coins?: number;
  coins_earned_this_run?: number;
  second_team_roar_used?: boolean;
  all_in_exchange_used?: boolean;
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
    all_in_result?: {
      old_name: string;
      new_name: string;
    } | null;
  };
};


export type TrainerGender = "male" | "female" | "other";

export type TrainerNpcType = "player" | "normal" | "gym" | "elite4" | "champion" | "avatar";

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
  starter_upgrades?: StarterUpgradeState;
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
