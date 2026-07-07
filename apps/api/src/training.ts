import type {
  DexItemDetail,
  DexMoveSummary,
  DexPokemonDetail,
  DexStatId,
  ShowdownDexService,
} from "@changebattle-v2/showdown-dex-core";
import {
  BATTLE_GENERATION_OPTIONS_V4,
  BATTLE_RULE_PRESET_OPTIONS_V4,
  BATTLE_SYSTEM_OPTIONS_V4,
  DEFAULT_BATTLE_PREFERENCE_V4,
  battleSystemsForRuleSetV4,
  getCurrentTrainingNodeV4,
  getNextTrainingNodeV4,
  getPokemonDisplayNameV4,
  getPokemonIdentityKeyV4,
  normalizeBattleLogV4,
  normalizeCoinLogV4,
  normalizeBagStateV4 as normalizeCoreBagStateV4,
  normalizeBattlePreferenceV4,
  normalizeFormalCompetitionModeV4,
  normalizeLocalPokemonV4,
  normalizeLocalTeamV4,
  normalizePlayerItemInstanceV4,
  normalizeTrainingRunNodeStateV4,
  normalizeTrainingRunStatusV4,
  type BattlePreferenceV4,
  type BattleSystemPreferenceV4,
  type BagStateV4,
  type FormalCompetitionModeV4,
  type LocalPokemonLocksV4,
  type LocalPokemonV4,
  type LocalTeamV4,
  type PlayerItemInstanceV4,
  type PlayerItemTypeV4,
  type PokemonPowerProfileV4,
  type ShowdownPlayerIdV4,
  type StatTableV4,
  type TrainingAllianceV4,
  type TrainingBattleGamePlaceholderV4,
  type TrainingBattleLogEntryV4,
  type TrainingCoinLogEntryV4,
  type TrainingControllerV4,
  type TrainingGenderV4,
  type TrainingModeV4,
  type TrainingMoveSlotV4,
  type TrainingPlayerDraftV4,
  type TrainingRunGameNodeV4,
  type TrainingRunGameV4,
  type TrainingRunNodeStateV4,
  type TrainingRunResultV4,
  type TrainingRunStatusV4,
  type TrainingRuleSetV4,
  type TrainingScenarioV4,
  type TrainingStatusV4,
} from "@changebattle-v2/core";

export {
  BATTLE_GENERATION_OPTIONS_V4,
  BATTLE_RULE_PRESET_OPTIONS_V4,
  BATTLE_SYSTEM_OPTIONS_V4,
  DEFAULT_BATTLE_PREFERENCE_V4,
  battleSystemsForRuleSetV4,
  getCurrentTrainingNodeV4,
  getNextTrainingNodeV4,
  getPokemonDisplayNameV4,
  getPokemonIdentityKeyV4,
  normalizeBattleLogV4,
  normalizeCoinLogV4,
  normalizeCoreBagStateV4 as normalizeBagStateV4,
  normalizeBattlePreferenceV4,
  normalizeFormalCompetitionModeV4,
  normalizeLocalPokemonV4,
  normalizeLocalTeamV4,
  normalizePlayerItemInstanceV4,
  normalizeTrainingRunNodeStateV4,
  normalizeTrainingRunStatusV4,
  type BattlePreferenceV4,
  type BattleSystemPreferenceV4,
  type BagStateV4,
  type FormalCompetitionModeV4,
  type LocalPokemonLocksV4,
  type LocalPokemonV4,
  type LocalTeamV4,
  type PlayerItemInstanceV4,
  type PlayerItemTypeV4,
  type ShowdownPlayerIdV4,
  type StatTableV4,
  type TrainingAllianceV4,
  type TrainingBattleGamePlaceholderV4,
  type TrainingBattleLogEntryV4,
  type TrainingCoinLogEntryV4,
  type TrainingControllerV4,
  type TrainingGenderV4,
  type TrainingModeV4,
  type TrainingMoveSlotV4,
  type TrainingPlayerDraftV4,
  type TrainingRunGameNodeV4,
  type TrainingRunGameV4,
  type TrainingRunNodeStateV4,
  type TrainingRunResultV4,
  type TrainingRunStatusV4,
  type TrainingRuleSetV4,
  type TrainingScenarioV4,
  type TrainingStatusV4,
};

export type TrainingUserProfileInputV4 = {
  id: string;
  name: string;
  avatarAsset: string;
  battlePreference?: Partial<BattlePreferenceV4>;
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
  createTrainingRunFromScenario(run: TrainingRunGameV4): TrainingRunGameV4;
  enterTrainingRest(run: TrainingRunGameV4): TrainingRunGameV4;
  getCurrentTrainingNode(run: TrainingRunGameV4): TrainingRunGameNodeV4 | null;
  getNextTrainingNode(run: TrainingRunGameV4): TrainingRunGameNodeV4 | null;
  randomizeTrainingScenario(run: TrainingRunGameV4, options?: {includeRuleSet?: boolean; includeMode?: boolean}): TrainingRunGameV4;
  randomizeTeam(playerId: ShowdownPlayerIdV4, size: number, preferredSpeciesIds?: string[]): LocalTeamV4;
  createItemInstance: (itemID: string, options?: Partial<PlayerItemInstanceV4>) => PlayerItemInstanceV4;
  normalizeBagState: (bag: unknown, ruleSet?: TrainingRuleSetV4) => BagStateV4;
  ensureDefaultSystemItemsForRuleSet: (bag: BagStateV4, ruleSet: TrainingRuleSetV4) => BagStateV4;
  createTrainingNpcCatalog(): TrainingNpcV4[];
};

const TRAINING_RUN_VERSION = 1 as const;
const DEFAULT_TRAINING_RUN_KEY = "changebattle-v2:web:training-run";
const DEFAULT_BAG_MAX_SIZE = 50;
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const DEFAULT_NATURE = "Serious";
const DEFAULT_ITEM_ID = "";
const DEFAULT_SPECIES = ["pikachu", "charizard", "blastoise", "venusaur", "lucario", "gardevoir", "dragonite", "gengar"];
const PLAYER_SPECIES = ["pikachu", "eevee", "lucario", "charizard", "gardevoir", "dragonite", "greninja", "venusaur"];
const ENEMY_SPECIES = ["raticate", "arbok", "golem", "machamp", "gengar", "gyarados", "snorlax", "tyranitar"];
const ALLY_SPECIES = ["eevee", "raichu", "blastoise", "venusaur", "arcanine", "lapras", "scizor", "togekiss"];
const FALLBACK_MOVES = ["tackle", "quickattack", "protect", "rest"];
const RANDOM_NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
];
const RANDOM_ITEMS = [
  "", "leftovers", "choicescarf", "choiceband", "choicespecs", "lifeorb",
  "focussash", "assaultvest", "sitrusberry", "lumberry", "heavydutyboots",
  "rockyhelmet", "eviolite", "expertbelt", "airballoon",
];
const RANDOM_STATUS: TrainingStatusV4[] = ["", "", "", "", "brn", "par", "psn", "tox", "slp", "frz"];
const PLAYER_BACK_IMAGES = [
  "npc/player-back/black-bw-touya-back-b2e0a77d.png",
  "npc/player-back/dawn-dp-dawn-back-65c7fd06.png",
  "npc/player-back/ethan-hgss-gold-back-46e97197.png",
  "npc/player-back/lucas-pt-lucas-back-3199c0fb.png",
  "npc/player-back/lyra-hgss-kotone-back-d2d0db32.png",
  "npc/player-back/nate-b2w2-nate-back-e0cef62f.png",
  "npc/player-back/rosa-b2w2-rosa-back-405f562e.png",
  "npc/player-back/white-bw-touko-back-4156e303.png",
];

const DEFAULT_SYSTEM_ITEMS_BY_RULE_SET: Record<TrainingRuleSetV4, string[]> = {
  standard: [],
  gen7: ["system-mega-stone", "system-z-crystal"],
  gen8: ["system-dynamax-band"],
  gen9: ["system-tera-orb"],
};
const MANAGED_SYSTEM_ITEM_IDS = new Set(Object.values(DEFAULT_SYSTEM_ITEMS_BY_RULE_SET).flat());

const NPC_CATALOG: TrainingNpcV4[] = [
  {
    id: "blue",
    name: "小茂",
    title: "均衡型对手",
    avatar: "npc/avatars/blue-asset-8ef926da.webp",
    alliance: "far",
    preferredTypes: ["Fire", "Water", "Grass"],
    signatureSpeciesIds: ["charizard", "blastoise", "venusaur"],
  },
  {
    id: "cynthia",
    name: "竹兰",
    title: "冠军级压测",
    avatar: "npc/avatars/cynthia-vscynthia-7b500adf.png",
    alliance: "far",
    preferredTypes: ["Dragon", "Ghost", "Ground"],
    signatureSpeciesIds: ["garchomp", "spiritomb", "roserade"],
  },
  {
    id: "red",
    name: "赤红",
    title: "高强度轮换",
    avatar: "npc/boss/red-red-c813612f.gif",
    alliance: "far",
    preferredTypes: ["Electric", "Water", "Normal"],
    signatureSpeciesIds: ["pikachu", "snorlax", "lapras"],
  },
  {
    id: "nate-ally",
    name: "共平",
    title: "合作队友",
    avatar: "npc/avatars/11-asset-fdb7e61e.webp",
    alliance: "near",
    preferredTypes: ["Water", "Fighting", "Electric"],
    signatureSpeciesIds: ["blastoise", "lucario", "raichu"],
  },
  {
    id: "rosa-ally",
    name: "鸣依",
    title: "支援队友",
    avatar: "npc/avatars/6-asset-a73f3e71.webp",
    alliance: "near",
    preferredTypes: ["Grass", "Fairy", "Fire"],
    signatureSpeciesIds: ["venusaur", "gardevoir", "arcanine"],
  },
];

export function createTrainingRunApi(dex: ShowdownDexService, storage: TrainingRunStorageAdapter = createBrowserTrainingRunAdapter()): TrainingRunApi {
  function createDefaultTrainingScenario(profile: TrainingUserProfileInputV4): TrainingScenarioV4 {
    const enemyNpc = enemyNpcs()[0]!;
    const battlePreference = normalizeBattlePreferenceV4(profile.battlePreference);
    return normalizeScenario({
      id: createId("training-scenario"),
      name: "训练场测试",
      mode: "singles",
      ruleSet: battlePreference.ruleSet,
      battleCount: 1,
      selectedNpcIds: {p2: enemyNpc.id},
      players: [
        createPlayer("p1", profile.name, profile.avatarAsset, "local", "near", randomizeTeam("p1", 3)),
        createPlayer("p2", enemyNpc.name, enemyNpc.avatar, "ai", "far", randomizeTeam("p2", 3, enemyNpc.signatureSpeciesIds)),
      ],
    }, profile, battlePreference);
  }

  function createTrainingRunGame(profile: TrainingUserProfileInputV4): TrainingRunGameV4 {
    const now = new Date().toISOString();
    const battlePreference = normalizeBattlePreferenceV4(profile.battlePreference);
    const scenario = createDefaultTrainingScenario(profile);
    return {
      version: TRAINING_RUN_VERSION,
      id: createId("training-run"),
      source: "training",
      status: "configuring",
      profileId: profile.id,
      createdAt: now,
      updatedAt: now,
      scenario,
      players: playersRecordFromScenario(scenario),
      currentNodeId: null,
      gameMap: [],
      result: null,
      battlePreference,
      coinLog: [],
      battleLog: [],
    };
  }

  function updateTrainingScenario(run: TrainingRunGameV4, patch: Partial<TrainingScenarioV4>): TrainingRunGameV4 {
    const battlePreference = normalizeBattlePreferenceV4(run.battlePreference);
    const scenario = normalizeScenario({...run.scenario, ...patch}, profileFromRun(run), battlePreference);
    return normalizeRun({
      ...run,
      battlePreference: {...battlePreference, ruleSet: scenario.ruleSet, enabledBattleSystems: battleSystemsForRuleSetV4(scenario.ruleSet)},
      status: "configuring",
      updatedAt: new Date().toISOString(),
      scenario,
      players: playersRecordFromScenario(scenario),
      currentNodeId: null,
      gameMap: [],
      result: null,
    });
  }

  function createTrainingRunFromScenario(run: TrainingRunGameV4): TrainingRunGameV4 {
    const profile = profileFromRun(run);
    const battlePreference = normalizeBattlePreferenceV4(run.battlePreference);
    const scenario = normalizeScenario(run.scenario, profile, battlePreference);
    const players = playersRecordFromScenario(scenario);
    const gameMap = createGameMapFromScenarioForRun(scenario);
    return normalizeRun({
      ...run,
      battlePreference: {...battlePreference, ruleSet: scenario.ruleSet, enabledBattleSystems: battleSystemsForRuleSetV4(scenario.ruleSet)},
      status: "resting",
      updatedAt: new Date().toISOString(),
      scenario,
      players,
      currentNodeId: gameMap[0]?.id || null,
      gameMap,
      result: null,
    });
  }

  function enterTrainingRest(run: TrainingRunGameV4): TrainingRunGameV4 {
    const next = run.gameMap?.length ? run : createTrainingRunFromScenario(run);
    return normalizeRun({
      ...next,
      status: "resting",
      updatedAt: new Date().toISOString(),
    });
  }

  function getCurrentTrainingNode(run: TrainingRunGameV4): TrainingRunGameNodeV4 | null {
    const normalized = normalizeRun(run);
    return getCurrentTrainingNodeV4(normalized);
  }

  function getNextTrainingNode(run: TrainingRunGameV4): TrainingRunGameNodeV4 | null {
    const normalized = normalizeRun(run);
    return getNextTrainingNodeV4(normalized);
  }

  function randomizeTrainingScenario(run: TrainingRunGameV4, options: {includeRuleSet?: boolean; includeMode?: boolean} = {}): TrainingRunGameV4 {
    const modes: TrainingModeV4[] = ["singles", "doubles", "coop"];
    const ruleSets: TrainingRuleSetV4[] = ["standard", "gen7", "gen8", "gen9"];
    const mode = options.includeMode ? pick(modes) : run.scenario.mode;
    const ruleSet = options.includeRuleSet ? pick(ruleSets) : run.scenario.ruleSet;
    const profile = profileFromRun(run);
    const enemy = pick(enemyNpcs());
    const ally = pick(allyNpcs());
    const battlePreference = normalizeBattlePreferenceV4(run.battlePreference);
    const scenario = normalizeScenario({
      ...run.scenario,
      mode,
      ruleSet,
      battleCount: Math.random() > 0.5 ? 2 : 1,
      selectedNpcIds: mode === "coop" ? {p2: enemy.id, p3: ally.id, p4: pick(enemyNpcs()).id} : {p2: enemy.id},
      players: playersForMode(mode, profile, enemy, ally, true),
    }, profile, battlePreference);
    return normalizeRun({...run, battlePreference: {...battlePreference, ruleSet: scenario.ruleSet, enabledBattleSystems: battleSystemsForRuleSetV4(scenario.ruleSet)}, status: "configuring", scenario, players: playersRecordFromScenario(scenario), gameMap: [], currentNodeId: null, result: null, updatedAt: new Date().toISOString()});
  }

  function randomizeTeam(playerId: ShowdownPlayerIdV4, size: number, preferredSpeciesIds?: string[]): LocalTeamV4 {
    const pool = preferredSpeciesIds?.length ? preferredSpeciesIds : speciesPoolFor(playerId);
    const pokemon = Array.from({length: Math.max(1, Math.min(6, size))}, (_, index) => createPokemon(pick(pool), index, true));
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
      createPlayer("p3", ally.name, ally.avatar, "script", "near", randomizeTeam("p3", size, randomized ? ally.signatureSpeciesIds : undefined), randomPlayerBackImage()),
      createPlayer("p4", enemy2.name, enemy2.avatar, "ai", "far", randomizeTeam("p4", size, randomized ? enemy2.signatureSpeciesIds : undefined)),
    ];
  }

  function normalizeRun(run: TrainingRunGameV4): TrainingRunGameV4 {
    const battlePreference = normalizeBattlePreferenceV4(run.battlePreference || {ruleSet: run.scenario?.ruleSet});
    const scenario = normalizeScenario(run.scenario, profileFromRun(run), battlePreference);
    const players = normalizePlayersRecord(run.players, scenario);
    const hasGameMap = Array.isArray(run.gameMap) && run.gameMap.length > 0;
    const normalizedGameMap = hasGameMap ? normalizeGameMap(run.gameMap, scenario) : [];
    const pendingSettlement = run.status === "battleEndedPendingSettlement";
    const gameMap = pendingSettlement
      ? normalizedGameMap.map((node, index) => run.gameMap[index]?.state === "won" ? {...node, state: "won" as const} : node)
      : normalizedGameMap;
    const currentNodeId = run.currentNodeId && gameMap.some(node => node.id === run.currentNodeId)
      ? run.currentNodeId
      : gameMap.find(node => node.state === "ready" || node.state === "running" || node.state === "preparing")?.id || null;
    return {
      version: TRAINING_RUN_VERSION,
      id: run.id || createId("training-run"),
      source: "training",
      status: normalizeTrainingRunStatusV4(run.status, gameMap),
      profileId: run.profileId || "",
      createdAt: run.createdAt || new Date().toISOString(),
      updatedAt: run.updatedAt || run.createdAt || new Date().toISOString(),
      scenario,
      players,
      currentNodeId,
      gameMap,
      result: run.result || null,
      battlePreference: {...battlePreference, ruleSet: scenario.ruleSet, enabledBattleSystems: battleSystemsForRuleSetV4(scenario.ruleSet)},
      competitionMode: normalizeFormalCompetitionModeV4(run.competitionMode || battlePreference.competitionMode),
      restPreviewUnlocks: normalizeRestPreviewUnlocks(run.restPreviewUnlocks),
      coinLog: normalizeCoinLogV4(run.coinLog),
      battleLog: normalizeBattleLogV4(run.battleLog),
    };
  }

  function normalizeScenario(scenario: TrainingScenarioV4, profile: Pick<TrainingUserProfileInputV4, "name" | "avatarAsset">, battlePreference = normalizeBattlePreferenceV4()): TrainingScenarioV4 {
    const mode = scenario.mode || "singles";
    const playerMap = new Map((scenario.players || []).map(player => [player.playerId, player]));
    const enemy = npcById(scenario.selectedNpcIds?.p2) || enemyNpcs()[0]!;
    const ally = npcById(scenario.selectedNpcIds?.p3) || allyNpcs()[0]!;
    const ruleSet = scenario.ruleSet || battlePreference.ruleSet;
    const players = playerIdsForMode(mode).map(playerId => {
      const existing = playerMap.get(playerId);
      if (existing) return withRuleSetBag(normalizePlayer(existing, mode), ruleSet, battlePreference);
      if (playerId === "p1") return withRuleSetBag(createPlayer("p1", profile.name, profile.avatarAsset, "local", "near", randomizeTeam("p1", defaultTeamSize(mode))), ruleSet, battlePreference);
      if (playerId === "p3") return withRuleSetBag(createPlayer("p3", ally.name, ally.avatar, "script", "near", randomizeTeam("p3", defaultTeamSize(mode), ally.signatureSpeciesIds), randomPlayerBackImage()), ruleSet, battlePreference);
      const npc = playerId === "p4" ? pick(enemyNpcs()) : enemy;
      return withRuleSetBag(createPlayer(playerId, npc.name, npc.avatar, "ai", "far", randomizeTeam(playerId, defaultTeamSize(mode), npc.signatureSpeciesIds)), ruleSet, battlePreference);
    });
    return {
      id: scenario.id || createId("training-scenario"),
      name: scenario.name || "训练场测试",
      mode,
      ruleSet,
      battleCount: normalizeBattleCount(scenario.battleCount),
      selectedNpcIds: scenario.selectedNpcIds || {p2: enemy.id},
      players,
    };
  }

  function withRuleSetBag(player: TrainingPlayerDraftV4, ruleSet: TrainingRuleSetV4, battlePreference = normalizeBattlePreferenceV4()): TrainingPlayerDraftV4 {
    const bag = ensureDefaultSystemItemsForRuleSetV4(normalizeBagStateV4(player.bag), ruleSet);
    return {...player, bag: {...bag, battleBagEnabled: battlePreference.battleBagEnabled}};
  }

  function normalizePlayer(player: TrainingPlayerDraftV4, mode: TrainingModeV4): TrainingPlayerDraftV4 {
    const minSize = defaultTeamSize(mode);
    const currentPokemon = (player.localTeam?.pokemon || []).map((pokemon, index) => normalizePokemon(pokemon, index));
    const filled = [...currentPokemon];
    while (filled.length < minSize) {
      filled.push(createPokemon(pick(speciesPoolFor(player.playerId)), filled.length));
    }
    const bag = normalizeBagStateV4(player.bag, undefined);
    const synced = syncPokemonHeldItemsToBag(filled.slice(0, 6), bag);
    return {
      playerId: player.playerId,
      name: player.name || player.playerId,
      avatar: player.avatar || "npc/avatars/1-asset-18b76b7d.webp",
      backImage: player.backImage,
      controller: player.controller || (player.playerId === "p1" ? "local" : "ai"),
      alliance: player.alliance || (player.playerId === "p1" || player.playerId === "p3" ? "near" : "far"),
      localTeam: {
        id: player.localTeam?.id || createId(`team-${player.playerId}`),
        name: player.localTeam?.name || `${player.playerId.toUpperCase()} 队伍`,
        pokemon: synced.pokemon,
      },
      bag: synced.bag,
    };
  }

  function syncPokemonHeldItemsToBag(pokemon: LocalPokemonV4[], bag: BagStateV4): {pokemon: LocalPokemonV4[]; bag: BagStateV4} {
    const items = [...bag.items];
    const usedInstanceIds = new Set<string>();
    const nextPokemon = pokemon.map(entry => {
      if (!entry.itemId) return {...entry, heldItemInstanceId: undefined};
      const currentInstance = entry.heldItemInstanceId
        ? items.find(item => item.id === entry.heldItemInstanceId && item.itemID === entry.itemId && !usedInstanceIds.has(item.id))
        : null;
      const instance = currentInstance || items.find(item => item.itemID === entry.itemId && !usedInstanceIds.has(item.id)) || createItemInstanceV4(entry.itemId);
      if (!items.some(item => item.id === instance.id)) items.push(instance);
      usedInstanceIds.add(instance.id);
      return {...entry, heldItemInstanceId: instance.id};
    });
    return {
      pokemon: nextPokemon,
      bag: {
        ...bag,
        items,
        maxSize: Math.max(bag.maxSize, items.length),
      },
    };
  }

  function createPlayer(playerId: ShowdownPlayerIdV4, name: string, avatar: string, controller: TrainingControllerV4, alliance: TrainingAllianceV4, localTeam: LocalTeamV4, backImage?: string): TrainingPlayerDraftV4 {
    return {playerId, name, avatar, ...(backImage ? {backImage} : {}), controller, alliance, localTeam, bag: normalizeBagStateV4(undefined)};
  }

  function randomPlayerBackImage(): string {
    return pick(PLAYER_BACK_IMAGES);
  }

  function createPokemon(speciesId: string, index: number, randomized = false): LocalPokemonV4 {
    const detail = pokemonDetail(speciesId);
    const ability = randomized ? pick(detail.abilities) || detail.abilities[0] : detail.abilities[0];
    const nature = randomized ? pick(RANDOM_NATURES) : DEFAULT_NATURE;
    const moves = selectMoves(dex.getPokemonSelfLearnSkills(detail.id), randomized);
    const evs = emptyStats(0);
    const ivs = emptyStats(31);
    const maxHp = calculateMaxHp(detail.id, 50, nature, evs, ivs);
    return {
      localPokemonId: createId(`pokemon-${index + 1}`),
      speciesId: detail.id,
      name: detail.name,
      nameZh: detail.nameZh,
      level: 50,
      gender: "N",
      shiny: randomized ? Math.random() < 0.12 : false,
      itemId: randomized ? pick(RANDOM_ITEMS) : DEFAULT_ITEM_ID,
      heldItemInstanceId: undefined,
      abilityId: ability?.id || "",
      abilityName: ability?.name || "",
      abilityNameZh: ability?.nameZh || ability?.name || "",
      nature,
      moves,
      evs,
      ivs,
      entryHp: randomized ? randomHp(maxHp) : maxHp,
      entryStatus: randomized ? pick(RANDOM_STATUS) : "",
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

  function normalizePokemon(pokemon: LocalPokemonV4, index: number): LocalPokemonV4 {
    const detail = pokemonDetail(pokemon.speciesId || DEFAULT_SPECIES[index % DEFAULT_SPECIES.length]!);
    const ability = detail.abilities.find(entry => entry.id === pokemon.abilityId) || detail.abilities[0];
    const moves = (pokemon.moves || []).filter(move => move.moveId).slice(0, 4).map(move => normalizeMoveSlot(move.moveId));
    const selfLearnMoves = selectMoves(dex.getPokemonSelfLearnSkills(detail.id));
    while (moves.length < 4) moves.push(selfLearnMoves[moves.length] || fallbackMove(moves.length));
    const evs = normalizeStats(pokemon.evs, 0);
    const ivs = normalizeStats(pokemon.ivs, 31);
    const level = clampInt(pokemon.level, 1, 100, 50);
    const nature = pokemon.nature || DEFAULT_NATURE;
    const maxHp = calculateMaxHp(detail.id, level, nature, evs, ivs);
    return {
      ...pokemon,
      localPokemonId: pokemon.localPokemonId || createId(`pokemon-${index + 1}`),
      speciesId: detail.id,
      name: detail.name,
      nameZh: detail.nameZh,
      level,
      gender: pokemon.gender || "N",
      shiny: Boolean(pokemon.shiny),
      itemId: pokemon.itemId || "",
      heldItemInstanceId: pokemon.itemId ? pokemon.heldItemInstanceId || undefined : undefined,
      abilityId: ability?.id || "",
      abilityName: ability?.name || "",
      abilityNameZh: ability?.nameZh || ability?.name || "",
      nature,
      moves: moves.map((move, moveIndex) => {
        const previous = pokemon.moves?.[moveIndex];
        return normalizeMovePp(move, previous?.moveId === move.moveId ? previous.remainingPp : undefined);
      }),
      evs,
      ivs,
      entryHp: clampInt(pokemon.entryHp ?? maxHp, 0, maxHp, maxHp),
      entryStatus: normalizeStatus(pokemon.entryStatus),
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

  function createItemInstanceV4(itemID: string, options: Partial<PlayerItemInstanceV4> = {}): PlayerItemInstanceV4 {
    const normalizedItemID = normalizeItemID(itemID);
    const detail = getItemDetailSafe(normalizedItemID);
    const name = options.name || detail?.nameZh || detail?.name || normalizedItemID;
    return {
      id: options.id || createId("item"),
      itemID: options.itemID || normalizedItemID,
      name,
      image: options.image || detail?.iconUrl || "",
      cost: normalizeNullableNumber(options.cost, detail?.cost ?? 0) ?? 0,
      canSale: options.canSale ?? detail?.canSale ?? true,
      type: options.type || playerItemTypeFromDetail(detail),
      canBattleUse: options.canBattleUse ?? detail?.canBattleUse ?? false,
      canUse: options.canUse ?? detail?.canUse ?? false,
      canUseToPokemon: options.canUseToPokemon ?? detail?.canUseToPokemon ?? false,
      canTake: options.canTake ?? detail?.canTake ?? false,
      effectRound: normalizeNullableNumber(options.effectRound, null) ?? null,
      getRound: normalizeNullableNumber(options.getRound, 0) ?? 0,
      maxUseCount: normalizeNullableNumber(options.maxUseCount, null) ?? null,
      useCount: normalizeNullableNumber(options.useCount, 0) ?? 0,
      mappedItemId: normalizeOptionalId(options.mappedItemId),
      mappedItemName: normalizeOptionalText(options.mappedItemName),
      mappedItemNameZh: normalizeOptionalText(options.mappedItemNameZh),
      mappedItemIconUrl: normalizeOptionalText(options.mappedItemIconUrl),
      mappedTeraType: normalizeOptionalText(options.mappedTeraType),
      mappedTeraTypeZh: normalizeOptionalText(options.mappedTeraTypeZh),
      systemReforgeKind: normalizeSystemReforgeKind(options.systemReforgeKind),
    };
  }

  function normalizeBagStateV4(bag: unknown, ruleSet?: TrainingRuleSetV4): BagStateV4 {
    const normalized = normalizeCoreBagStateV4(bag, {
      defaultMaxSize: DEFAULT_BAG_MAX_SIZE,
      itemNormalizer: normalizeBagItem,
    });
    return ruleSet ? ensureDefaultSystemItemsForRuleSetV4(normalized, ruleSet) : normalized;
  }

  function ensureDefaultSystemItemsForRuleSetV4(bag: BagStateV4, ruleSet: TrainingRuleSetV4): BagStateV4 {
    const normalized = normalizeBagStateV4(bag);
    const managedItems = new Set(DEFAULT_SYSTEM_ITEMS_BY_RULE_SET[ruleSet]);
    const retainedItems = normalized.items.filter(item => !MANAGED_SYSTEM_ITEM_IDS.has(item.itemID) || managedItems.has(item.itemID));
    const existing = new Set(retainedItems.map(item => item.itemID));
    const additions = DEFAULT_SYSTEM_ITEMS_BY_RULE_SET[ruleSet].filter(itemID => !existing.has(itemID));
    if (!additions.length && retainedItems.length === normalized.items.length) return normalized;
    const openSlots = Math.max(0, normalized.maxSize - retainedItems.length);
    const nextItems = [...retainedItems, ...additions.slice(0, openSlots).map(itemID => createItemInstanceV4(itemID))];
    return {...normalized, items: nextItems};
  }

  function normalizeBagItems(items: unknown): PlayerItemInstanceV4[] {
    if (!Array.isArray(items)) return [];
    return items.flatMap((item, index) => {
      const normalized = normalizeBagItem(item, index);
      return normalized ? [normalized] : [];
    });
  }

  function normalizeBagItem(item: unknown, index: number): PlayerItemInstanceV4 | null {
    if (!isRecord(item)) return null;
    const instanceItemID = normalizeItemID(item.itemID);
    if (!instanceItemID) return null;
    return createItemInstanceV4(instanceItemID, {
      id: typeof item.id === "string" && item.id ? item.id : createId(`item-${index + 1}`),
      name: typeof item.name === "string" ? item.name : undefined,
      image: typeof item.image === "string" ? item.image : undefined,
      cost: normalizeNullableNumber(item.cost, undefined) ?? undefined,
      canSale: typeof item.canSale === "boolean" ? item.canSale : undefined,
      type: normalizePlayerItemType(item.type),
      canBattleUse: typeof item.canBattleUse === "boolean" ? item.canBattleUse : undefined,
      canUse: typeof item.canUse === "boolean" ? item.canUse : undefined,
      canUseToPokemon: typeof item.canUseToPokemon === "boolean" ? item.canUseToPokemon : undefined,
      canTake: typeof item.canTake === "boolean" ? item.canTake : undefined,
      effectRound: normalizeNullableNumber(item.effectRound, null),
      getRound: normalizeNullableNumber(item.getRound, 0) ?? 0,
      maxUseCount: normalizeNullableNumber(item.maxUseCount, null),
      useCount: normalizeNullableNumber(item.useCount, 0) ?? 0,
      mappedItemId: typeof item.mappedItemId === "string" ? item.mappedItemId : undefined,
      mappedItemName: typeof item.mappedItemName === "string" ? item.mappedItemName : undefined,
      mappedItemNameZh: typeof item.mappedItemNameZh === "string" ? item.mappedItemNameZh : undefined,
      mappedItemIconUrl: typeof item.mappedItemIconUrl === "string" ? item.mappedItemIconUrl : undefined,
      mappedTeraType: typeof item.mappedTeraType === "string" ? item.mappedTeraType : undefined,
      mappedTeraTypeZh: typeof item.mappedTeraTypeZh === "string" ? item.mappedTeraTypeZh : undefined,
      systemReforgeKind: normalizeSystemReforgeKind(item.systemReforgeKind),
    });
  }

  function getItemDetailSafe(itemID: string): DexItemDetail | null {
    try {
      return dex.getItemDetail(itemID);
    } catch {
      return null;
    }
  }

  function playerItemTypeFromDetail(detail: DexItemDetail | null): PlayerItemTypeV4 {
    if (!detail) return "misc";
    if (detail.kind === "system") return "system";
    if (detail.kind === "system-battle") return "system-battle";
    if (detail.kind === "berry") return "berry";
    if (detail.kind === "recovery" || detail.kind === "revive" || detail.kind === "pp") return "medicine";
    if (detail.kind === "training") return "training";
    if (detail.kind === "evolution") return "evolution";
    if (detail.kind === "tm") return "tm";
    if (detail.kind === "held" || detail.kind === "special") return "held";
    if (detail.kind === "battle") return "battle";
    if (detail.kind === "valuable") return "key";
    return "misc";
  }

  function selectMoves(learnset: DexMoveSummary[], randomized = false): TrainingMoveSlotV4[] {
    const usable = learnset.filter(move => move.id && move.pp > 0);
    const selected = randomized ? shuffle(usable).slice(0, 4) : [...usable.slice(0, 2), ...shuffle(usable.slice(2)).slice(0, 2)].slice(0, 4);
    while (selected.length < 4) selected.push(moveSummary(FALLBACK_MOVES[selected.length] || "tackle"));
    return selected.map(move => {
      const slot = moveSlot(move);
      return randomized ? {...slot, remainingPp: randomPp(slot.maxPp)} : slot;
    });
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
      maxPp: move.pp,
      remainingPp: move.pp,
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
        maxPp: 0,
        remainingPp: 0,
      };
    }
  }

  function normalizeMovePp(move: TrainingMoveSlotV4, remainingPp: number | undefined): TrainingMoveSlotV4 {
    const maxPp = clampInt(move.maxPp ?? move.pp, 0, 99, move.pp);
    return {...move, maxPp, remainingPp: clampInt(remainingPp ?? maxPp, 0, maxPp, maxPp)};
  }

  function calculateMaxHp(speciesId: string, level: number, nature: string, evs: StatTableV4, ivs: StatTableV4): number {
    return dex.calculatePokemonStats({speciesId, level, nature, evs, ivs}).stats.hp;
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
    return {name: p1?.name || "训练师", avatarAsset: p1?.avatar || "npc/avatars/6-asset-a73f3e71.webp"};
  }

  function createGameMapFromScenarioForRun(scenario: TrainingScenarioV4): TrainingRunGameNodeV4[] {
    const ids = playerIdsForMode(scenario.mode);
    const basePlayers = playersRecordFromScenario(scenario);
    const p1 = basePlayers.p1!;
    const p3 = basePlayers.p3;
    const selectedEnemy = basePlayers.p2!;
    const selectedAlly = basePlayers.p3;
    const selectedEnemy2 = basePlayers.p4;
    const enemyPool = enemyNpcs();
    const allyPool = allyNpcs();
    return Array.from({length: scenario.battleCount}, (_, index) => {
      const enemyNpc = index === 0
        ? undefined
        : enemyPool[(index - 1) % enemyPool.length];
      const enemy2Npc = index === 0
        ? undefined
        : enemyPool[index % enemyPool.length];
      const allyNpc = index === 0
        ? undefined
        : allyPool[index % allyPool.length];
      const p2 = index === 0
        ? selectedEnemy
        : createPlayer("p2", enemyNpc?.name || selectedEnemy.name, enemyNpc?.avatar || selectedEnemy.avatar, "ai", "far", randomizeTeam("p2", defaultTeamSize(scenario.mode), enemyNpc?.signatureSpeciesIds));
      const nodeP3 = ids.includes("p3")
        ? (index === 0 && selectedAlly ? selectedAlly : createPlayer("p3", allyNpc?.name || p3?.name || "队友", allyNpc?.avatar || p3?.avatar || "npc/avatars/11-asset-fdb7e61e.webp", "script", "near", randomizeTeam("p3", defaultTeamSize(scenario.mode), allyNpc?.signatureSpeciesIds), randomPlayerBackImage()))
        : undefined;
      const nodeP4 = ids.includes("p4")
        ? (index === 0 && selectedEnemy2 ? selectedEnemy2 : createPlayer("p4", enemy2Npc?.name || "对手", enemy2Npc?.avatar || "npc/avatars/blue-asset-8ef926da.webp", "ai", "far", randomizeTeam("p4", defaultTeamSize(scenario.mode), enemy2Npc?.signatureSpeciesIds)))
        : undefined;
      return createGameMapNode(scenario, index, {
        p1,
        p2,
        ...(nodeP3 ? {p3: nodeP3} : {}),
        ...(nodeP4 ? {p4: nodeP4} : {}),
      });
    });
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
    createTrainingRunFromScenario,
    enterTrainingRest,
    getCurrentTrainingNode,
    getNextTrainingNode,
    randomizeTrainingScenario,
    randomizeTeam,
    createItemInstance: createItemInstanceV4,
    normalizeBagState: normalizeBagStateV4,
    ensureDefaultSystemItemsForRuleSet: ensureDefaultSystemItemsForRuleSetV4,
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

function playersRecordFromScenario(scenario: TrainingScenarioV4): Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> {
  return Object.fromEntries(scenario.players.map(player => [player.playerId, player])) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
}

function normalizePlayersRecord(players: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> | undefined, scenario: TrainingScenarioV4): Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> {
  const fromScenario = playersRecordFromScenario(scenario);
  return Object.fromEntries(playerIdsForMode(scenario.mode).map(playerId => [playerId, players?.[playerId] || fromScenario[playerId]]).filter(([, player]) => Boolean(player))) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
}

function createGameMapFromScenario(scenario: TrainingScenarioV4): TrainingRunGameNodeV4[] {
  const ids = playerIdsForMode(scenario.mode);
  const players = playersRecordFromScenario(scenario);
  return Array.from({length: scenario.battleCount}, (_, index) => createGameMapNode(scenario, index, {
    p1: players.p1!,
    p2: players.p2!,
    ...(ids.includes("p3") && players.p3 ? {p3: players.p3} : {}),
    ...(ids.includes("p4") && players.p4 ? {p4: players.p4} : {}),
  }));
}

function normalizeGameMap(nodes: TrainingRunGameNodeV4[], scenario: TrainingScenarioV4): TrainingRunGameNodeV4[] {
  const ids = playerIdsForMode(scenario.mode);
  const scenarioPlayers = playersRecordFromScenario(scenario);
  const normalized: TrainingRunGameNodeV4[] = nodes.slice(0, scenario.battleCount).map((node, index) => ({
    id: node.id || createId(`training-node-${index + 1}`),
    index,
    state: normalizeTrainingRunNodeStateV4(node.state, index),
    p1: "p1" as ShowdownPlayerIdV4,
    p2: "p2" as ShowdownPlayerIdV4,
    p3: ids.includes("p3") ? "p3" as ShowdownPlayerIdV4 : null,
    p4: ids.includes("p4") ? "p4" as ShowdownPlayerIdV4 : null,
    mode: scenario.mode,
    ruleSet: scenario.ruleSet,
    seed: node.seed || createId(`training-seed-${index + 1}`),
    participants: normalizeNodeParticipants(node.participants, scenarioPlayers, ids),
    battleGame: node.battleGame || null,
    createdAt: node.createdAt,
    startedAt: node.startedAt,
    endedAt: node.endedAt,
  }));
  while (normalized.length < scenario.battleCount) {
    const [node] = createGameMapFromScenario({...scenario, battleCount: 1});
    normalized.push({...node!, id: createId(`training-node-${normalized.length + 1}`), index: normalized.length, state: normalized.length === 0 ? "ready" : "locked"});
  }
  if (!normalized.some(node => ["ready", "preparing", "running"].includes(node.state)) && normalized[0]) {
    normalized[0] = {...normalized[0], state: "ready"};
  }
  return normalized;
}

function createGameMapNode(
  scenario: TrainingScenarioV4,
  index: number,
  participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>,
): TrainingRunGameNodeV4 {
  const ids = playerIdsForMode(scenario.mode);
  return {
    id: createId(`training-node-${index + 1}`),
    index,
    state: index === 0 ? "ready" : "locked",
    p1: "p1",
    p2: "p2",
    p3: ids.includes("p3") ? "p3" : null,
    p4: ids.includes("p4") ? "p4" : null,
    mode: scenario.mode,
    ruleSet: scenario.ruleSet,
    seed: createId(`training-seed-${index + 1}`),
    participants: normalizeNodeParticipants(participants, participants, ids),
    battleGame: null,
    createdAt: new Date().toISOString(),
  };
}

function normalizeNodeParticipants(
  participants: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> | undefined,
  fallback: Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>,
  ids: ShowdownPlayerIdV4[],
): Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>> {
  return Object.fromEntries(ids.map(playerId => [playerId, participants?.[playerId] || fallback[playerId]]).filter(([, player]) => Boolean(player))) as Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>;
}

function normalizeBattleCount(value: unknown): number {
  return clampInt(value, 1, 7, 1);
}

function normalizeRestPreviewUnlocks(value: unknown): Record<string, true> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, unlocked]) => unlocked).map(([key]) => [key, true])) as Record<string, true>;
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

function normalizeStatus(status: unknown): TrainingStatusV4 {
  return ["brn", "par", "psn", "tox", "slp", "frz"].includes(String(status)) ? String(status) as TrainingStatusV4 : "";
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.round(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function normalizeNullableNumber(value: unknown, fallback: number | null | undefined): number | null | undefined {
  if (value === null) return null;
  if (value === undefined || value === "") return fallback;
  const next = Math.round(Number(value));
  return Number.isFinite(next) ? next : fallback;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeItemID(value: unknown): string {
  const raw = String(value || "").trim();
  if (/^tm:/i.test(raw)) return `tm:${toID(raw.slice(3))}`;
  if (shouldKeepHyphenatedItemID(raw)) return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "");
  return toID(raw);
}

function shouldKeepHyphenatedItemID(value: string): boolean {
  return /^system-/i.test(value) || /^universal-evolution-stone$/i.test(value) || /^linking-cord$/i.test(value);
}

function normalizeOptionalId(value: unknown): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^tm:/i.test(raw)) return `tm:${toID(raw.slice(3))}`;
  return toID(raw);
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = String(value || "").trim();
  return text || undefined;
}

function normalizeSystemReforgeKind(value: unknown): PlayerItemInstanceV4["systemReforgeKind"] {
  return value === "mega" || value === "z-crystal" || value === "tera" ? value : undefined;
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizePlayerItemType(value: unknown): PlayerItemTypeV4 | undefined {
  const text = String(value || "");
  const allowed: PlayerItemTypeV4[] = ["system", "system-battle", "held", "medicine", "berry", "training", "evolution", "battle", "tm", "key", "misc"];
  return allowed.includes(text as PlayerItemTypeV4) ? text as PlayerItemTypeV4 : undefined;
}

function createId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}-${cryptoApi.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)] || values[0]!;
}

function randomHp(maxHp: number): number {
  const roll = Math.random();
  if (roll < 0.08) return 0;
  if (roll < 0.16) return 1;
  if (roll < 0.34) return Math.max(1, Math.floor(maxHp / 2));
  return Math.max(1, Math.floor(maxHp * (0.35 + Math.random() * 0.65)));
}

function randomPp(maxPp: number): number {
  if (maxPp <= 0) return 0;
  if (Math.random() < 0.65) return maxPp;
  return Math.floor(Math.random() * (maxPp + 1));
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
