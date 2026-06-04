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
  sprite?: SpriteMapEntry;
};

export type GeneratedTeam = {
  seed: number[];
  team: PokemonSet[];
  display: RentalPokemon[];
  packed: string;
};

export type PokemonSet = Record<string, any>;

export type RuntimePokemon = {
  ident: string;
  details?: string;
  condition: string;
  active?: boolean;
  item?: string;
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
  active: Record<"p1" | "p2", {name?: string; condition?: string; status?: string}>;
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
  target?: string;
  target_id?: string;
  move?: string;
  effect?: string;
  condition?: string;
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
};

export type ExchangeState = {
  battle_no: number;
  wins: number;
  player_display: RentalPokemon[];
  enemy_display: RentalPokemon[];
};

export type CurrentRunData = {
  status: "ready" | "awaiting_exchange";
  seed: number;
  battles: number;
  next_battle?: number;
  battle_no?: number;
  wins: number;
  player_team: PokemonSet[];
  player_display: RentalPokemon[];
  enemy_raw?: PokemonSet[];
  enemy_display?: RentalPokemon[];
};


export type TrainerGender = "male" | "female" | "other";

export type TrainerProfile = {
  name: string;
  gender: TrainerGender;
};

export type TrainerStats = {
  battle_points: number;
  battles: number;
  wins: number;
  losses: number;
  rank_status: string;
};

export type CurrentRunSave = CurrentRunData | null;

export type AppStatus =
  | "title"
  | "newGame"
  | "mainMenu"
  | "userInfo"
  | "rentalSelect"
  | "battleMain"
  | "moveMenu"
  | "teamMenu"
  | "statusMenu"
  | "exchange"
  | "result";

export type DesktopGameState = {
  screen: AppStatus;
  save: LocalSave | null;
  candidates?: GeneratedTeam;
  selected_indexes?: number[];
  battle?: BattleState | null;
  exchange?: ExchangeState | null;
  message?: string;
  pending_transition?: DesktopGameState | null;
};

export type LocalSave = {
  version: 1;
  trainer: TrainerProfile;
  stats: TrainerStats;
  current_run: CurrentRunSave;
  created_at: string;
  updated_at: string;
};
