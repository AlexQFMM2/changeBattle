export type ShowdownPlayerIdV4 = "p1" | "p2" | "p3" | "p4";
export type TrainingModeV4 = "singles" | "doubles" | "coop";
export type TrainingRuleSetV4 = "standard" | "gen7" | "gen8" | "gen9";
export type TrainingPlayerDraftV4 = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  avatar: string;
  controller: "local" | "ai" | "script";
  alliance: "near" | "far";
  localTeam: {
    id: string;
    name: string;
    pokemon: LocalPokemonLikeForBattleV4[];
  };
  bag: {items: Array<{itemId: string; count: number}>};
};
export type TrainingRunGameNodeV4 = {
  id: string;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  seed: string;
  p1: ShowdownPlayerIdV4 | null;
  p2: ShowdownPlayerIdV4 | null;
  p3: ShowdownPlayerIdV4 | null;
  p4: ShowdownPlayerIdV4 | null;
  participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
};

export type BattleServicePlayerIdV4 = ShowdownPlayerIdV4;

export type BattleServiceCreateInputV4 = {
  runId: string;
  node: TrainingRunGameNodeV4;
  players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
};

export type BattleServiceSessionStatusV4 = "creating" | "running" | "ended" | "blocked";

export type BattleServicePokemonSetV4 = {
  species: string;
  name: string;
  pokeball?: string;
  entryHp?: number;
  entryStatus?: string;
  maxHp?: number;
  item?: string;
  ability: string;
  moves: string[];
  nature: string;
  evs: Record<string, number>;
  ivs: Record<string, number>;
  gender?: string;
  shiny?: boolean;
  level: number;
  teraType?: string;
};

export type ShowdownTeamPokemonMappingV4 = {
  playerId: ShowdownPlayerIdV4;
  teamIndex: number;
  choiceIndex: number;
  localPokemonId: string;
  showdownIdentityToken: string;
  showdownId: string;
  pokeballId: string;
  speciesId: string;
  displayName: string;
};

export type ShowdownIdPoolStateV4 = {
  used: string[];
  available: string[];
};

export type BattleServicePlayerInputV4 = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  controller: "local" | "ai" | "script";
  alliance: "near" | "far";
  team: BattleServicePokemonSetV4[];
  draft: TrainingPlayerDraftV4;
  teamMapping?: ShowdownTeamPokemonMappingV4[];
};

export type BattleServiceSessionInputV4 = {
  runId: string;
  nodeId: string;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  seed: string;
  players: BattleServicePlayerInputV4[];
  showdownIdPool?: ShowdownIdPoolStateV4;
};

export type BattleServiceMoveRequestV4 = {
  move: string;
  id: string;
  pp?: number;
  maxpp?: number;
  target?: string;
  disabled?: boolean;
};

export type BattleServiceSidePokemonV4 = {
  ident: string;
  details: string;
  condition: string;
  active?: boolean;
  fainted?: boolean;
  commanding?: boolean;
  stats?: Record<string, number>;
  moves?: string[];
  baseAbility?: string;
  item?: string;
  ability?: string;
  pokeball?: string;
  teraType?: string;
};

export type BattleServiceRequestV4 = {
  rqid?: number;
  wait?: boolean;
  teamPreview?: boolean;
  targetable?: boolean;
  active?: Array<{
    moves?: BattleServiceMoveRequestV4[];
    maxMoves?: BattleServiceMoveRequestV4[] | {gigantamax?: boolean; maxMoves?: BattleServiceMoveRequestV4[]};
    zMoves?: Array<BattleServiceMoveRequestV4 | null>;
    trapped?: boolean;
    maybeTrapped?: boolean;
    canMegaEvo?: boolean | string;
    canMegaEvoX?: boolean | string;
    canMegaEvoY?: boolean | string;
    canUltraBurst?: boolean | string;
    canDynamax?: boolean | string;
    canTerastallize?: boolean | string;
    canZMove?: Array<BattleServiceMoveRequestV4 | null>;
    gigantamax?: boolean;
  } | null>;
  forceSwitch?: boolean[];
  side?: {
    id: ShowdownPlayerIdV4;
    name: string;
    pokemon: BattleServiceSidePokemonV4[];
  };
};

export type BattleServiceActivePokemonV4 = {
  ident: string;
  playerId: ShowdownPlayerIdV4;
  slot: string;
  species: string;
  details: string;
  condition: string;
  hp: number;
  maxHp: number;
  status: string;
  fainted: boolean;
};

export type BattleServiceSnapshotV4 = {
  id: string;
  runId: string;
  nodeId: string;
  status: BattleServiceSessionStatusV4;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  turn: number;
  winner: ShowdownPlayerIdV4 | null;
  error: string | null;
  players: BattleServicePlayerInputV4[];
  showdownIdPool?: ShowdownIdPoolStateV4;
  requests: Partial<Record<ShowdownPlayerIdV4, BattleServiceRequestV4>>;
  active: BattleServiceActivePokemonV4[];
  rawLog: string[];
  debug: {
    inputLog: string[];
    lastChoices: Array<{playerId: ShowdownPlayerIdV4; choice: string; at: string}>;
    playerStreams: Array<{playerId: ShowdownPlayerIdV4; at: string; chunk: string; request: boolean; lines: string[]}>;
    latestSidePokemon?: Partial<Record<ShowdownPlayerIdV4, BattleServiceSidePokemonV4[]>>;
  };
  createdAt: string;
  updatedAt: string;
};

export type BattleServiceSubmitChoiceInputV4 = {
  sessionId: string;
  playerId: ShowdownPlayerIdV4;
  choice: string;
};

export type BattleServiceApiV4 = {
  createBattleSession(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): Promise<BattleServiceSnapshotV4>;
  submitChoice(input: BattleServiceSubmitChoiceInputV4): Promise<BattleServiceSnapshotV4>;
  getSnapshot(sessionId: string): Promise<BattleServiceSnapshotV4>;
  closeSession(sessionId: string): Promise<void>;
};

export type LocalPokemonLikeForBattleV4 = {
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  speciesId: string;
  name: string;
  nameZh: string;
  nickname?: string;
  level: number;
  gender: "M" | "F" | "N";
  shiny: boolean;
  itemId: string;
  abilityId: string;
  moves: Array<{moveId: string}>;
  nature: string;
  evs: Record<string, number>;
  ivs: Record<string, number>;
  entryHp?: number;
  entryStatus?: string;
  maxHp?: number;
};
