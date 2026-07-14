export type ShowdownPlayerIdV4 = "p1" | "p2" | "p3" | "p4";
export type TrainingModeV4 = "singles" | "doubles" | "coop";
export type TrainingRuleSetV4 = "standard" | "gen7" | "gen8" | "gen9";
export type BattleSpecialSystemV4 = "mega" | "zmove" | "max" | "terastallize";
export type BattleAiLevelV4 = "rookie" | "normal" | "elite" | "gymLeader" | "eliteFour" | "champion";
export type BattleAiPreferenceV4 = "offense" | "defense" | "support" | "balanced";
export type BattleAiProfileV4 = {
  level: BattleAiLevelV4;
  preference?: BattleAiPreferenceV4;
};
export type BattleAiFeatureVectorV4 = Record<string, number>;
export type BattleAiCapabilityProfileV4 = {
  useMinimax: boolean;
  useRoleAnalysis: boolean;
  useOutcomeBuckets: boolean;
  useSwitchValue: boolean;
  useDynamicDepth: boolean;
  useOpponentSwitchReply: boolean;
  riskTolerance: number;
};
export type BattleAiOutcomeBucketV4 =
  | "ko"
  | "joint-ko"
  | "threaten-ko"
  | "self-ko-risk"
  | "revenge-kill-risk"
  | "safe-switch"
  | "unsafe-switch"
  | "setup-weather"
  | "enable-wincon"
  | "preserve-wincon"
  | "hazard-progress"
  | "status-progress";
export type BattleAiSearchDebugV4 = {
  strategy: "numeric-guard" | "minimax";
  maxDepth: number;
  searchedDepth: number;
  visitedNodes: number;
  elapsedMs: number;
  truncatedReason?: "timeout" | "max-nodes" | "no-candidates" | "not-enabled";
  principalVariation?: Array<{choice: string; score: number; role: "self" | "foe"}>;
  leafScore?: number;
  candidateCount?: number;
  replyCount?: number;
  capabilities?: BattleAiCapabilityProfileV4;
  outcomeBuckets?: Array<{choice: string; buckets: BattleAiOutcomeBucketV4[]; score: number}>;
  targetOverrideEstimates?: Array<{
    switchChoice: string;
    replyChoice: string;
    targetIdent?: string;
    estimatedDamage: number;
    koChance: number;
  }>;
};
export type BattleAiDecisionDebugV4 = {
  playerId: ShowdownPlayerIdV4;
  rqid?: number;
  requestKey: string;
  level: BattleAiLevelV4;
  preference: BattleAiPreferenceV4;
  elapsedMs: number;
  timedOut: boolean;
  candidateCount: number;
  selectedChoice: string;
  selectedScore: number;
  search?: BattleAiSearchDebugV4;
  topCandidates: Array<{
    choice: string;
    score: number;
    features: BattleAiFeatureVectorV4;
    diagnostics?: Record<string, unknown>;
  }>;
};
export type TrainingPlayerDraftV4 = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  avatar: string;
  backImage?: string;
  controller: "local" | "ai" | "script";
  aiProfile?: BattleAiProfileV4;
  alliance: "near" | "far";
  localTeam: {
    id: string;
    name: string;
    pokemon: LocalPokemonLikeForBattleV4[];
  };
  bag: {
    maxSize?: number;
    items: Array<{
      id?: string;
      itemID?: string;
      itemId?: string;
      name?: string;
      canBattleUse?: boolean;
      type?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
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
  movePp?: BattleTeamMoveStateV4[];
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
  aiProfile?: BattleAiProfileV4;
  alliance: "near" | "far";
  team: BattleServicePokemonSetV4[];
  draft: TrainingPlayerDraftV4;
  teamMapping?: ShowdownTeamPokemonMappingV4[];
  allowedSpecialSystems?: BattleSpecialSystemV4[];
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
  move?: string;
  id?: string;
  pp?: number;
  maxpp?: number;
  target?: string;
  disabled?: boolean;
  serverForced?: boolean;
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
  chosenTeamSize?: number;
  maxChosenTeamSize?: number;
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
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
  species: string;
  details: string;
  condition: string;
  hp: number;
  maxHp: number;
  status: string;
  fainted: boolean;
};

export type BattleTeamMoveStateV4 = {
  moveId: string;
  remainingPp: number;
  maxPp: number;
};

export type BattleTeamPokemonStateV4 = {
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
  ident?: string;
  details?: string;
  hp: number;
  maxHp: number;
  status: string;
  fainted: boolean;
  moves?: BattleTeamMoveStateV4[];
};

export type BattleTeamStateV4 = {
  pokemonByToken: Record<string, BattleTeamPokemonStateV4>;
  updatedAt: string;
};

export type BattleRosterPokemonV4 = {
  key: string;
  searchId: string;
  ident: string;
  canonicalIdent: string;
  playerId: ShowdownPlayerIdV4;
  slot?: string;
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
  species: string;
  details: string;
  condition: string;
  hp: number;
  maxHp: number;
  status: string;
  fainted: boolean;
};

export type BattleRosterStateV4 = {
  pokemonByKey: Record<string, BattleRosterPokemonV4>;
  activeKeyBySlot: Record<string, string>;
  lastPokemonKeyBySlot?: Record<string, string>;
  updatedAt: string;
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
  teamStateByPlayer?: Partial<Record<ShowdownPlayerIdV4, BattleTeamStateV4>>;
  battleRosterByPlayer?: Partial<Record<ShowdownPlayerIdV4, BattleRosterStateV4>>;
  rawLog: string[];
  debug: {
    inputLog: string[];
    lastChoices: Array<{playerId: ShowdownPlayerIdV4; choice: string; at: string}>;
    playerStreams: Array<{playerId: ShowdownPlayerIdV4; at: string; chunk: string; request: boolean; lines: string[]}>;
    latestSidePokemon?: Partial<Record<ShowdownPlayerIdV4, BattleServiceSidePokemonV4[]>>;
    latestRequests?: Partial<Record<ShowdownPlayerIdV4, BattleServiceRequestV4>>;
    latestMovePpByPokemon?: Partial<Record<ShowdownPlayerIdV4, Record<string, BattleServiceMoveRequestV4[]>>>;
    aiDecisions?: BattleAiDecisionDebugV4[];
  };
  createdAt: string;
  updatedAt: string;
};

export type ShowdownPlaybackSceneCallKindV4 =
  | "switch"
  | "switchOut"
  | "dragIn"
  | "dragOut"
  | "move"
  | "otherAnim"
  | "prepare"
  | "residual"
  | "result"
  | "damage"
  | "heal"
  | "faint"
  | "status"
  | "ability"
  | "transform"
  | "weatherUpdate"
  | "turn"
  | "statbar"
  | "message"
  | "scene";

export type ShowdownPlaybackWaitModeV4 = "wait" | "simult" | "immediate";

export type ShowdownPlaybackSceneCallV4 = {
  id: string;
  kind: ShowdownPlaybackSceneCallKindV4;
  method: string;
  rawStep: number | null;
  turn: number | null;
  args: unknown[];
  label: string;
  rawLine?: string;
  rawIndex?: number;
  pokemon?: string;
  target?: string;
  move?: string;
  effect?: string;
  result?: string;
  value?: string;
};

export type ShowdownPlaybackGroupV4 = {
  id: string;
  index: number;
  turn: number | null;
  rawIndices: number[];
  rawLines: string[];
  calls: ShowdownPlaybackSceneCallV4[];
  waitMode: ShowdownPlaybackWaitModeV4;
  summary: string;
  finishStep: number | null;
};

export type ShowdownPlaybackTimelineV4 = {
  sessionId?: string;
  rawFrom: number;
  rawTo: number;
  rawLogLength: number;
  groups: ShowdownPlaybackGroupV4[];
  debug: {
    calls: ShowdownPlaybackSceneCallV4[];
    compilerElapsedMs: number;
    guard: number;
    currentStep: number | null;
    atQueueEnd: boolean;
  };
  compilerVersion: string;
};

export type BattleServicePlaybackTimelineInputV4 = {
  sessionId: string;
  previousIndex?: number;
};

export type BattleServiceSubmitChoiceInputV4 = {
  sessionId: string;
  playerId: ShowdownPlayerIdV4;
  choice: string;
};

export type BattleServiceSubmitTrainerItemInputV4 = {
  sessionId: string;
  playerId: ShowdownPlayerIdV4;
  choice: string;
  trainerItems: Array<{
    activeIndex: number;
    itemInstanceId: string;
    targetKey: string;
  }>;
};

export type BattleServicePermanentFormeChangeInputV4 = {
  sessionId: string;
  playerId: ShowdownPlayerIdV4;
  activeIndex: number;
  toSpeciesId: string;
  message?: string;
};

export type BattleServicePermanentFormeChangeResultV4 = {
  ok: boolean;
  message: string;
  snapshot: BattleServiceSnapshotV4;
  fromDetails?: string;
  toDetails?: string;
};

export type BattleServiceApiV4 = {
  createBattleSession(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): Promise<BattleServiceSnapshotV4>;
  submitChoice(input: BattleServiceSubmitChoiceInputV4): Promise<BattleServiceSnapshotV4>;
  submitTrainerItem(input: BattleServiceSubmitTrainerItemInputV4): Promise<BattleServiceSnapshotV4>;
  applyPermanentFormeChange(input: BattleServicePermanentFormeChangeInputV4): Promise<BattleServicePermanentFormeChangeResultV4>;
  getSnapshot(sessionId: string): Promise<BattleServiceSnapshotV4>;
  getPlaybackTimeline(sessionId: string, previousIndex?: number): Promise<ShowdownPlaybackTimelineV4>;
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
  moves: Array<{moveId: string; remainingPp?: number; maxPp?: number; pp?: number}>;
  nature: string;
  evs: Record<string, number>;
  ivs: Record<string, number>;
  entryHp?: number;
  entryStatus?: string;
  maxHp?: number;
  heldItemInstanceId?: string;
};
