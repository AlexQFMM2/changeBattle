import type {
  DexMoveSummary,
  DexPokemonDetail,
  DexStatId,
  ShowdownDexService,
} from "@changebattle-v2/showdown-dex-core";

export type ShowdownPlayerIdV4 = "p1" | "p2" | "p3" | "p4";
export type TrainingModeV4 = "singles" | "doubles" | "coop";
export type TrainingRuleSetV4 = "standard" | "gen7" | "gen8" | "gen9";
export type TrainingControllerV4 = "local" | "ai" | "script";
export type TrainingAllianceV4 = "near" | "far";
export type TrainingGenderV4 = "M" | "F" | "N";

export type TrainingUserProfileInputV4 = {
  id: string;
  name: string;
  avatarAsset: string;
};

export type TrainingRunGameV4 = {
  version: 1;
  id: string;
  source: "training";
  status: "configuring";
  profileId: string;
  createdAt: string;
  updatedAt: string;
  scenario: TrainingScenarioV4;
};

export type TrainingScenarioV4 = {
  id: string;
  name: string;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  battleCount: 1 | 2;
  players: TrainingPlayerDraftV4[];
  selectedNpcIds: Partial<Record<ShowdownPlayerIdV4, string>>;
};

export type TrainingPlayerDraftV4 = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  avatar: string;
  controller: TrainingControllerV4;
  alliance: TrainingAllianceV4;
  localTeam: LocalTeamV4;
  bag: BagStateV4;
};

export type LocalTeamV4 = {
  id: string;
  name: string;
  pokemon: LocalPokemonV4[];
};

export type LocalPokemonV4 = {
  localPokemonId: string;
  speciesId: string;
  name: string;
  nameZh: string;
  nickname?: string;
  level: number;
  gender: TrainingGenderV4;
  shiny: boolean;
  itemId: string;
  abilityId: string;
  abilityName: string;
  abilityNameZh: string;
  nature: string;
  moves: TrainingMoveSlotV4[];
  evs: StatTableV4;
  ivs: StatTableV4;
  spriteUrl?: string;
  shinySpriteUrl?: string;
  iconUrl?: string;
  iconStyle?: string;
};

export type TrainingMoveSlotV4 = {
  moveId: string;
  name: string;
  nameZh: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | null;
  pp: number;
};

export type StatTableV4 = Record<DexStatId, number>;

export type BagStateV4 = {
  items: Array<{itemId: string; count: number}>;
};

export type TrainingNpcV4 = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  alliance: TrainingAllianceV4;
  preferredTypes: string[];
  signatureSpeciesIds: string[];
};

export type TrainingRunStorageAdapter = {
  loadTrainingRun(): Promise<TrainingRunGameV4 | null>;
  saveTrainingRun(run: TrainingRunGameV4): Promise<TrainingRunGameV4>;
  deleteTrainingRun(): Promise<void>;
};

export type TrainingRunApi = {
  loadTrainingRun(): Promise<TrainingRunGameV4 | null>;
  saveTrainingRun(run: TrainingRunGameV4): Promise<TrainingRunGameV4>;
  deleteTrainingRun(): Promise<void>;
  createTrainingRunGame(profile: TrainingUserProfileInputV4): TrainingRunGameV4;
  createDefaultTrainingScenario(profile: TrainingUserProfileInputV4): TrainingScenarioV4;
  updateTrainingScenario(run: TrainingRunGameV4, patch: Partial<TrainingScenarioV4>): TrainingRunGameV4;
  randomizeTrainingScenario(run: TrainingRunGameV4, options?: {includeRuleSet?: boolean; includeMode?: boolean}): TrainingRunGameV4;
  randomizeTeam(playerId: ShowdownPlayerIdV4, size: number, preferredSpeciesIds?: string[]): LocalTeamV4;
  createTrainingNpcCatalog(): TrainingNpcV4[];
};

const TRAINING_RUN_VERSION = 1 as const;
const DEFAULT_TRAINING_RUN_KEY = "changebattle-v2:web:training-run";
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const DEFAULT_NATURE = "Serious";
const DEFAULT_ITEM_ID = "";
const DEFAULT_SPECIES = ["pikachu", "charizard", "blastoise", "venusaur", "lucario", "gardevoir", "dragonite", "gengar"];
const PLAYER_SPECIES = ["pikachu", "eevee", "lucario", "charizard", "gardevoir", "dragonite", "greninja", "venusaur"];
const ENEMY_SPECIES = ["raticate", "arbok", "golem", "machamp", "gengar", "gyarados", "snorlax", "tyranitar"];
const ALLY_SPECIES = ["eevee", "raichu", "blastoise", "venusaur", "arcanine", "lapras", "scizor", "togekiss"];
const FALLBACK_MOVES = ["tackle", "quickattack", "protect", "rest"];

const NPC_CATALOG: TrainingNpcV4[] = [
  {
    id: "blue",
    name: "小茂",
    title: "均衡型对手",
    avatar: "/npc/avatars/blue-asset-8ef926da.webp",
    alliance: "far",
    preferredTypes: ["Fire", "Water", "Grass"],
    signatureSpeciesIds: ["charizard", "blastoise", "venusaur"],
  },
  {
    id: "cynthia",
    name: "竹兰",
    title: "冠军级压测",
    avatar: "/npc/avatars/cynthia-vscynthia-7b500adf.png",
    alliance: "far",
    preferredTypes: ["Dragon", "Ghost", "Ground"],
    signatureSpeciesIds: ["garchomp", "spiritomb", "roserade"],
  },
  {
    id: "red",
    name: "赤红",
    title: "高强度轮换",
    avatar: "/npc/avatars/red-asset-18b76b7d.webp",
    alliance: "far",
    preferredTypes: ["Electric", "Water", "Normal"],
    signatureSpeciesIds: ["pikachu", "snorlax", "lapras"],
  },
  {
    id: "nate-ally",
    name: "共平",
    title: "合作队友",
    avatar: "/npc/avatars/11-asset-fdb7e61e.webp",
    alliance: "near",
    preferredTypes: ["Water", "Fighting", "Electric"],
    signatureSpeciesIds: ["blastoise", "lucario", "raichu"],
  },
  {
    id: "rosa-ally",
    name: "鸣依",
    title: "支援队友",
    avatar: "/npc/avatars/6-asset-a73f3e71.webp",
    alliance: "near",
    preferredTypes: ["Grass", "Fairy", "Fire"],
    signatureSpeciesIds: ["venusaur", "gardevoir", "arcanine"],
  },
];

export function createTrainingRunApi(dex: ShowdownDexService, storage: TrainingRunStorageAdapter = createBrowserTrainingRunAdapter()): TrainingRunApi {
  function createDefaultTrainingScenario(profile: TrainingUserProfileInputV4): TrainingScenarioV4 {
    const enemyNpc = enemyNpcs()[0]!;
    return normalizeScenario({
      id: createId("training-scenario"),
      name: "训练场测试",
      mode: "singles",
      ruleSet: "standard",
      battleCount: 1,
      selectedNpcIds: {p2: enemyNpc.id},
      players: [
        createPlayer("p1", profile.name, profile.avatarAsset, "local", "near", randomizeTeam("p1", 3)),
        createPlayer("p2", enemyNpc.name, enemyNpc.avatar, "ai", "far", randomizeTeam("p2", 3, enemyNpc.signatureSpeciesIds)),
      ],
    }, profile);
  }

  function createTrainingRunGame(profile: TrainingUserProfileInputV4): TrainingRunGameV4 {
    const now = new Date().toISOString();
    return {
      version: TRAINING_RUN_VERSION,
      id: createId("training-run"),
      source: "training",
      status: "configuring",
      profileId: profile.id,
      createdAt: now,
      updatedAt: now,
      scenario: createDefaultTrainingScenario(profile),
    };
  }

  function updateTrainingScenario(run: TrainingRunGameV4, patch: Partial<TrainingScenarioV4>): TrainingRunGameV4 {
    return normalizeRun({
      ...run,
      updatedAt: new Date().toISOString(),
      scenario: normalizeScenario({...run.scenario, ...patch}, profileFromRun(run)),
    });
  }

  function randomizeTrainingScenario(run: TrainingRunGameV4, options: {includeRuleSet?: boolean; includeMode?: boolean} = {}): TrainingRunGameV4 {
    const modes: TrainingModeV4[] = ["singles", "doubles", "coop"];
    const ruleSets: TrainingRuleSetV4[] = ["standard", "gen7", "gen8", "gen9"];
    const mode = options.includeMode ? pick(modes) : run.scenario.mode;
    const ruleSet = options.includeRuleSet ? pick(ruleSets) : run.scenario.ruleSet;
    const profile = profileFromRun(run);
    const enemy = pick(enemyNpcs());
    const ally = pick(allyNpcs());
    const scenario = normalizeScenario({
      ...run.scenario,
      mode,
      ruleSet,
      battleCount: Math.random() > 0.5 ? 2 : 1,
      selectedNpcIds: mode === "coop" ? {p2: enemy.id, p3: ally.id, p4: pick(enemyNpcs()).id} : {p2: enemy.id},
      players: playersForMode(mode, profile, enemy, ally, true),
    }, profile);
    return normalizeRun({...run, scenario, updatedAt: new Date().toISOString()});
  }

  function randomizeTeam(playerId: ShowdownPlayerIdV4, size: number, preferredSpeciesIds?: string[]): LocalTeamV4 {
    const pool = preferredSpeciesIds?.length ? preferredSpeciesIds : speciesPoolFor(playerId);
    const pokemon = Array.from({length: Math.max(1, Math.min(6, size))}, (_, index) => createPokemon(pool[index % pool.length] || pick(pool), index));
    return {id: createId(`team-${playerId}`), name: `${playerId.toUpperCase()} 队伍`, pokemon};
  }

  function playersForMode(mode: TrainingModeV4, profile: Pick<TrainingUserProfileInputV4, "name" | "avatarAsset">, enemy: TrainingNpcV4, ally: TrainingNpcV4, randomized: boolean): TrainingPlayerDraftV4[] {
    const size = defaultTeamSize(mode);
    const p1 = createPlayer("p1", profile.name, profile.avatarAsset, "local", "near", randomizeTeam("p1", size));
    const p2 = createPlayer("p2", enemy.name, enemy.avatar, "ai", "far", randomizeTeam("p2", size, randomized ? enemy.signatureSpeciesIds : undefined));
    if (mode !== "coop") return [p1, p2];
    const enemy2 = pick(enemyNpcs().filter(npc => npc.id !== enemy.id));
    return [
      p1,
      p2,
      createPlayer("p3", ally.name, ally.avatar, "script", "near", randomizeTeam("p3", size, randomized ? ally.signatureSpeciesIds : undefined)),
      createPlayer("p4", enemy2.name, enemy2.avatar, "ai", "far", randomizeTeam("p4", size, randomized ? enemy2.signatureSpeciesIds : undefined)),
    ];
  }

  function normalizeRun(run: TrainingRunGameV4): TrainingRunGameV4 {
    return {
      version: TRAINING_RUN_VERSION,
      id: run.id || createId("training-run"),
      source: "training",
      status: "configuring",
      profileId: run.profileId || "",
      createdAt: run.createdAt || new Date().toISOString(),
      updatedAt: run.updatedAt || run.createdAt || new Date().toISOString(),
      scenario: normalizeScenario(run.scenario, profileFromRun(run)),
    };
  }

  function normalizeScenario(scenario: TrainingScenarioV4, profile: Pick<TrainingUserProfileInputV4, "name" | "avatarAsset">): TrainingScenarioV4 {
    const mode = scenario.mode || "singles";
    const playerMap = new Map((scenario.players || []).map(player => [player.playerId, player]));
    const enemy = npcById(scenario.selectedNpcIds?.p2) || enemyNpcs()[0]!;
    const ally = npcById(scenario.selectedNpcIds?.p3) || allyNpcs()[0]!;
    const players = playerIdsForMode(mode).map(playerId => {
      const existing = playerMap.get(playerId);
      if (existing) return normalizePlayer(existing, mode);
      if (playerId === "p1") return createPlayer("p1", profile.name, profile.avatarAsset, "local", "near", randomizeTeam("p1", defaultTeamSize(mode)));
      if (playerId === "p3") return createPlayer("p3", ally.name, ally.avatar, "script", "near", randomizeTeam("p3", defaultTeamSize(mode), ally.signatureSpeciesIds));
      const npc = playerId === "p4" ? pick(enemyNpcs()) : enemy;
      return createPlayer(playerId, npc.name, npc.avatar, "ai", "far", randomizeTeam(playerId, defaultTeamSize(mode), npc.signatureSpeciesIds));
    });
    return {
      id: scenario.id || createId("training-scenario"),
      name: scenario.name || "训练场测试",
      mode,
      ruleSet: scenario.ruleSet || "standard",
      battleCount: scenario.battleCount === 2 ? 2 : 1,
      selectedNpcIds: scenario.selectedNpcIds || {p2: enemy.id},
      players,
    };
  }

  function normalizePlayer(player: TrainingPlayerDraftV4, mode: TrainingModeV4): TrainingPlayerDraftV4 {
    const minSize = defaultTeamSize(mode);
    const currentPokemon = (player.localTeam?.pokemon || []).map((pokemon, index) => normalizePokemon(pokemon, index));
    const filled = [...currentPokemon];
    while (filled.length < minSize) {
      filled.push(createPokemon(pick(speciesPoolFor(player.playerId)), filled.length));
    }
    return {
      playerId: player.playerId,
      name: player.name || player.playerId,
      avatar: player.avatar || "/npc/avatars/1-asset-18b76b7d.webp",
      controller: player.controller || (player.playerId === "p1" ? "local" : "ai"),
      alliance: player.alliance || (player.playerId === "p1" || player.playerId === "p3" ? "near" : "far"),
      localTeam: {
        id: player.localTeam?.id || createId(`team-${player.playerId}`),
        name: player.localTeam?.name || `${player.playerId.toUpperCase()} 队伍`,
        pokemon: filled.slice(0, 6),
      },
      bag: player.bag || {items: []},
    };
  }

  function createPlayer(playerId: ShowdownPlayerIdV4, name: string, avatar: string, controller: TrainingControllerV4, alliance: TrainingAllianceV4, localTeam: LocalTeamV4): TrainingPlayerDraftV4 {
    return {playerId, name, avatar, controller, alliance, localTeam, bag: {items: []}};
  }

  function createPokemon(speciesId: string, index: number): LocalPokemonV4 {
    const detail = pokemonDetail(speciesId);
    const ability = detail.abilities[0];
    const moves = selectMoves(detail.learnset);
    return {
      localPokemonId: createId(`pokemon-${index + 1}`),
      speciesId: detail.id,
      name: detail.name,
      nameZh: detail.nameZh,
      level: 50,
      gender: "N",
      shiny: false,
      itemId: DEFAULT_ITEM_ID,
      abilityId: ability?.id || "",
      abilityName: ability?.name || "",
      abilityNameZh: ability?.nameZh || ability?.name || "",
      nature: DEFAULT_NATURE,
      moves,
      evs: emptyStats(0),
      ivs: emptyStats(31),
      spriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      shinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      iconUrl: detail.sprites.iconUrl,
      iconStyle: detail.sprites.iconStyle,
    };
  }

  function normalizePokemon(pokemon: LocalPokemonV4, index: number): LocalPokemonV4 {
    const detail = pokemonDetail(pokemon.speciesId || DEFAULT_SPECIES[index % DEFAULT_SPECIES.length]!);
    const ability = detail.abilities.find(entry => entry.id === pokemon.abilityId) || detail.abilities[0];
    const moves = (pokemon.moves || []).filter(move => move.moveId).slice(0, 4).map(move => normalizeMoveSlot(move.moveId));
    while (moves.length < 4) moves.push(selectMoves(detail.learnset)[moves.length] || fallbackMove(moves.length));
    return {
      ...pokemon,
      localPokemonId: pokemon.localPokemonId || createId(`pokemon-${index + 1}`),
      speciesId: detail.id,
      name: detail.name,
      nameZh: detail.nameZh,
      level: clampInt(pokemon.level, 1, 100, 50),
      gender: pokemon.gender || "N",
      shiny: Boolean(pokemon.shiny),
      itemId: pokemon.itemId || "",
      abilityId: ability?.id || "",
      abilityName: ability?.name || "",
      abilityNameZh: ability?.nameZh || ability?.name || "",
      nature: pokemon.nature || DEFAULT_NATURE,
      moves,
      evs: normalizeStats(pokemon.evs, 0),
      ivs: normalizeStats(pokemon.ivs, 31),
      spriteUrl: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      shinySpriteUrl: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      iconUrl: detail.sprites.iconUrl,
      iconStyle: detail.sprites.iconStyle,
    };
  }

  function selectMoves(learnset: DexMoveSummary[]): TrainingMoveSlotV4[] {
    const usable = learnset.filter(move => move.id && move.pp > 0);
    const selected = [...usable.slice(0, 2), ...shuffle(usable.slice(2)).slice(0, 2)].slice(0, 4);
    while (selected.length < 4) selected.push(moveSummary(FALLBACK_MOVES[selected.length] || "tackle"));
    return selected.map(moveSlot);
  }

  function moveSlot(move: DexMoveSummary): TrainingMoveSlotV4 {
    return {
      moveId: move.id,
      name: move.name,
      nameZh: move.nameZh,
      type: move.type,
      category: move.category,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
    };
  }

  function fallbackMove(index: number): TrainingMoveSlotV4 {
    return moveSlot(moveSummary(FALLBACK_MOVES[index] || "tackle"));
  }

  function normalizeMoveSlot(moveId: string): TrainingMoveSlotV4 {
    try {
      return moveSlot(moveSummary(moveId));
    } catch {
      return {
        moveId,
        name: moveId,
        nameZh: moveId,
        type: "",
        category: "",
        power: 0,
        accuracy: null,
        pp: 0,
      };
    }
  }

  function moveSummary(moveId: string): DexMoveSummary {
    return dex.getMoveDetail(moveId);
  }

  function pokemonDetail(speciesId: string): DexPokemonDetail {
    try {
      return dex.getPokemonDetail(speciesId);
    } catch {
      return dex.getPokemonDetail("pikachu");
    }
  }

  function profileFromRun(run: Pick<TrainingRunGameV4, "profileId"> & Partial<TrainingRunGameV4>): Pick<TrainingUserProfileInputV4, "name" | "avatarAsset"> {
    const p1 = run.scenario?.players?.find(player => player.playerId === "p1");
    return {name: p1?.name || "训练师", avatarAsset: p1?.avatar || "/npc/avatars/6-asset-a73f3e71.webp"};
  }

  return {
    loadTrainingRun: async () => {
      const run = await storage.loadTrainingRun();
      return run ? normalizeRun(run) : null;
    },
    saveTrainingRun: async run => storage.saveTrainingRun(normalizeRun(run)),
    deleteTrainingRun: () => storage.deleteTrainingRun(),
    createTrainingRunGame,
    createDefaultTrainingScenario,
    updateTrainingScenario,
    randomizeTrainingScenario,
    randomizeTeam,
    createTrainingNpcCatalog,
  };
}

export function createBrowserTrainingRunAdapter(storageKey = DEFAULT_TRAINING_RUN_KEY): TrainingRunStorageAdapter {
  return {
    async loadTrainingRun() {
      if (!hasBrowserStorage()) return null;
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) as TrainingRunGameV4 : null;
    },
    async saveTrainingRun(run) {
      if (hasBrowserStorage()) window.localStorage.setItem(storageKey, JSON.stringify(run, null, 2));
      return clone(run);
    },
    async deleteTrainingRun() {
      if (hasBrowserStorage()) window.localStorage.removeItem(storageKey);
    },
  };
}

export function createTrainingNpcCatalog(): TrainingNpcV4[] {
  return clone(NPC_CATALOG);
}

function playerIdsForMode(mode: TrainingModeV4): ShowdownPlayerIdV4[] {
  return mode === "coop" ? ["p1", "p2", "p3", "p4"] : ["p1", "p2"];
}

function defaultTeamSize(mode: TrainingModeV4): number {
  if (mode === "singles") return 3;
  if (mode === "doubles") return 4;
  return 2;
}

function speciesPoolFor(playerId: ShowdownPlayerIdV4): string[] {
  if (playerId === "p1") return PLAYER_SPECIES;
  if (playerId === "p3") return ALLY_SPECIES;
  return ENEMY_SPECIES;
}

function enemyNpcs(): TrainingNpcV4[] {
  return NPC_CATALOG.filter(npc => npc.alliance === "far");
}

function allyNpcs(): TrainingNpcV4[] {
  return NPC_CATALOG.filter(npc => npc.alliance === "near");
}

function npcById(id: string | undefined): TrainingNpcV4 | undefined {
  return NPC_CATALOG.find(npc => npc.id === id);
}

function emptyStats(value: number): StatTableV4 {
  return {hp: value, atk: value, def: value, spa: value, spd: value, spe: value};
}

function normalizeStats(stats: Partial<StatTableV4> | undefined, fallback: number): StatTableV4 {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, clampInt(stats?.[stat], 0, stat === "hp" ? 252 : 252, fallback)])) as StatTableV4;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.round(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function createId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}-${cryptoApi.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)] || values[0]!;
}

function shuffle<T>(values: T[]): T[] {
  return [...values].sort(() => Math.random() - 0.5);
}

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
