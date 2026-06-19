import type {AudioSettings, BattleAiHint, BattleSetting, BattleState, BattleTimelineEvent, DesktopDexCategory, DesktopDexEntry, DesktopGameState, LocalSave, PlayerPokemonState, RentalPokemon, RestAction, RestState, SaveBattleRecordsTable, ShopOffer, TrainerCatalogState, TrainerProfile} from "@changebattle/shared";
import {DEFAULT_AUDIO_SETTINGS, DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {enableTestModeForSave} from "@changebattle/game-runtime";
import {buildBattleDisplaySteps, type BattleDisplayStep} from "../components/battle/timelineFlow";
import {TALENT_CATALOG, debugBattle, debugMove, debugPokemon} from "../lib/ui";

export type BrowserTestScenario = "automated" | "battle-basic" | "battle-flinch" | "entry-weather" | "duplicate-status" | "dynamax-end-meowth" | "rest-shop" | "rainbow-rocket" | "dex";

export type BrowserTestHook = {
  getScenario(): BrowserTestScenario;
  getLastAction(): string;
  getState(): DesktopGameState | null;
  getBattle(): BattleState | null;
  getTimelineSteps(): BattleDisplayStep[];
  getInitialState(): DesktopGameState | null;
};

const PLAYER_TRAINER = {
  id: "player:debug",
  type: "player" as const,
  name_zh: "自动测试",
  front_asset: "assets/npc/player-front/斗也-bw_black.png",
  back_asset: "assets/npc/player-back/斗也-bw_touya_back.png",
  avatar_asset: "assets/npc/avatars/斗也-blackchallenge.png",
};

const ENEMY_TRAINER = {
  id: "normal:debug",
  type: "normal" as const,
  name_zh: "测试训练师",
  front_asset: "assets/npc/normal/dp_battle_girl-2-dp_battle_girl.png",
};

const CANDIDATES = Array.from({length: 6}, (_, index) => debugPokemon(`Candidate${index + 1}`, `候选${index + 1}`));

export function installBrowserTestBridge(): void {
  if (!import.meta.env.DEV || window.changeBattle) return;
  const params = new URLSearchParams(location.search);
  const scenario = scenarioFromParams(params);
  if (!scenario) return;

  let save = createSave(scenario !== "automated");
  let lastAction = "install";
  let state: DesktopGameState | null = initialStateForScenario(scenario, save);

  const setState = (next: DesktopGameState): DesktopGameState => {
    state = next;
    if (next.save) save = next.save;
    return next;
  };
  const battleForScenario = () => battleStateForScenario(scenario);
  const restForScenario = () => restStateForScenario(save, scenario);
  const resultForScenario = (battle: BattleState) => resultStateForBattle(save, battle);

  window.changeBattle = {
    generateCandidates: async () => generatedCandidates(),
    assetUrl: path => path,
    loadSave: async () => save,
    createNewSave: async (trainer: TrainerProfile) => {
      lastAction = "createNewSave";
      save = {...save, trainer, current_run: null};
      return save;
    },
    deleteSave: async () => {
      lastAction = "deleteSave";
      save = createSave(false);
      state = null;
    },
    updateTrainer: async (trainer: TrainerProfile) => {
      lastAction = "updateTrainer";
      save = {...save, trainer};
      return save;
    },
    battleRecords: async (): Promise<SaveBattleRecordsTable> => ({version: 1, records: []}),
    enableTestMode: async () => {
      lastAction = "enableTestMode";
      save = enableTestModeForSave({...save});
      return save;
    },
    startBattleTraining: async () => {
      lastAction = "startBattleTraining";
      return setState({screen: "battleTraining", save, battle: battleForScenario(), battle_bag: {consumable: [], held: [], tm: []}, message: "自动测试训练场"});
    },
    getBattleSetting: async () => ({setting: normalizeBattleSetting(save.battle_setting), save}),
    updateBattleSetting: async (setting: BattleSetting) => {
      lastAction = "updateBattleSetting";
      save = {...save, battle_setting: normalizeBattleSetting(setting)};
      return {setting: save.battle_setting!, save};
    },
    getAudioSettings: async () => ({settings: save.audio_settings || DEFAULT_AUDIO_SETTINGS, save}),
    updateAudioSettings: async (settings: Partial<AudioSettings>) => {
      lastAction = "updateAudioSettings";
      const volume = Number(settings.bgm_volume ?? save.audio_settings?.bgm_volume ?? DEFAULT_AUDIO_SETTINGS.bgm_volume);
      save = {...save, audio_settings: {bgm_enabled: settings.bgm_enabled ?? save.audio_settings?.bgm_enabled ?? DEFAULT_AUDIO_SETTINGS.bgm_enabled, bgm_volume: Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : DEFAULT_AUDIO_SETTINGS.bgm_volume))}};
      return {settings: save.audio_settings!, save};
    },
    trainerCatalog: async () => trainerCatalog(),
    prepareStarterItems: async () => {
      lastAction = "prepareStarterItems";
      return setState({screen: "starterItems", save, starter: {seed: 1, coins: 0, offers: [], purchased: null}, message: "自动测试开局道具"});
    },
    chooseStarterItem: async () => {
      lastAction = "chooseStarterItem";
      return setState({screen: "rentalSelect", save, candidates: generatedCandidates(), selected_indexes: [0, 1, 2], message: "自动测试候选"});
    },
    cancelPreparation: async () => {
      lastAction = "cancelPreparation";
      return setState({screen: "mainMenu", save, message: "自动测试返回主菜单"});
    },
    getTalentConfig: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    unlockTalent: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    configureTalents: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    setNamedChallenge: async trainerId => {
      lastAction = "setNamedChallenge";
      save = {...save, named_champion_id: trainerId};
      return {catalog: TALENT_CATALOG, unlocked: [], equipped: [], save};
    },
    getStarterUpgrades: async () => ({catalog: [], save}),
    upgradeStarter: async () => ({catalog: [], save}),
    prepareCandidates: async () => {
      lastAction = "prepareCandidates";
      return setState({screen: "rentalSelect", save, candidates: generatedCandidates(), selected_indexes: [0, 1, 2], message: "自动测试候选"});
    },
    rerollStarterCandidate: async index => {
      lastAction = `rerollStarterCandidate:${index}`;
      return setState({screen: "rentalSelect", save, starter: {seed: 1, coins: 0, offers: [], purchased: null, single_rerolls_remaining: 0, inspect_count: 0}, candidates: generatedCandidates(), selected_indexes: [0, 1, 2], message: "自动测试单只重随"});
    },
    beginChallenge: async () => {
      lastAction = "beginChallenge";
      const battle = battleForScenario();
      return setState({screen: "battleMain", save, battle, message: "自动测试对局"});
    },
    continueRun: async () => {
      lastAction = "continueRun";
      if (scenario === "rest-shop" || scenario === "rainbow-rocket") return setState({screen: "rest", save, rest: restForScenario(), message: "自动测试休整"});
      const battle = battleForScenario();
      return setState({screen: "battleMain", save, battle, message: "自动测试对局"});
    },
    battleChoice: async choice => {
      lastAction = `battleChoice:${choice}`;
      const battle = endedBattleForScenario(scenario);
      return setState({screen: "battleMain", save, battle, message: "自动测试胜利", pending_transition: resultForScenario(battle)});
    },
    battleHint: async (): Promise<BattleAiHint> => {
      lastAction = "battleHint";
      return {
        choice: "move 1",
        title: "使用测试招式",
        reason: "测试环境推荐第一招，方便验证 AI 提示弹窗和执行建议链路。",
        score: 100,
        alternatives: [],
      };
    },
    autoAdvanceBattle: async () => {
      lastAction = "autoAdvanceBattle";
      const battle = battleForScenario();
      return setState({screen: "battleMain", save, battle, message: "自动测试推进"});
    },
    exchange: async () => {
      lastAction = "exchange";
      return setState({screen: "result", save, message: "自动测试交换"});
    },
    restAction: async (action: RestAction) => {
      lastAction = `restAction:${action.type}`;
      if (scenario === "rainbow-rocket") {
        const rest = state?.rest || restForScenario();
        if (action.type === "rainbow_rocket_support" && rest.rainbow_rocket_support) {
          const pool = action.source === "route" ? rest.rainbow_rocket_support.route_display : rest.rainbow_rocket_support.factory_display;
          const picked = pool[action.candidateIndex];
          if (picked) {
            if (rest.player_display.length < rest.rainbow_rocket_support.max_team_size || action.targetIndex === null || action.targetIndex === undefined) {
              rest.player_display = [...rest.player_display, picked].slice(0, rest.rainbow_rocket_support.max_team_size);
              rest.player_state = rest.player_display.map((pokemon, index) => playerState(pokemon, index, "100/100"));
            } else {
              rest.player_display[action.targetIndex] = picked;
              rest.player_state[action.targetIndex] = playerState(picked, action.targetIndex, "100/100");
            }
            rest.rainbow_rocket_support.picks_used += 1;
          }
          return setState({screen: "rest", save, rest, message: "自动测试：彩虹火箭队支援"});
        }
        if (action.type === "rainbow_rocket_support_done" && rest.rainbow_rocket_support) {
          rest.rainbow_rocket_support.completed = true;
          return setState({screen: "rest", save, rest, message: "自动测试：支援确认"});
        }
        if (action.type === "rainbow_rocket_restore") return setState({screen: "rest", save, rest, message: "自动测试：工厂治疗"});
      }
      if (action.type === "next") return setState({screen: "battleMain", save, battle: battleForScenario(), message: "自动测试下一场"});
      if (action.type === "abort") return setState(resultForScenario(endedBattleForScenario(scenario)));
      return setState({screen: "rest", save, rest: restForScenario(), message: `自动测试休整：${action.type}`});
    },
    shopItems: async () => shopOffers().map(offer => ({...offer, cost: offer.cost || 20})),
    learnableMoves: async () => [pricedMove("flamethrower", "喷射火焰", 100), pricedMove("waterfall", "攀瀑", 100)],
    editOptions: async () => ({abilities: [{id: "blaze", name: "Blaze", name_zh: "猛火", desc: "", desc_zh: "自动测试特性。"}], natures: [{id: "serious", name: "Serious", name_zh: "认真", plus: "", minus: "", plus_zh: "", minus_zh: ""}]}),
    dexSearch: async (category: DesktopDexCategory, query = "", offset = 0, limit = 8) => dexSearch(category, query, offset, limit),
    getBattleState: async () => state?.battle || battleForScenario(),
  };

  window.__changeBattleTest = {
    getScenario: () => scenario,
    getLastAction: () => lastAction,
    getState: () => state,
    getBattle: () => state?.battle || null,
    getTimelineSteps: () => buildBattleDisplaySteps(state?.battle?.timeline_events || []),
    getInitialState: () => initialStateForScenario(scenario, save),
  };
}

function scenarioFromParams(params: URLSearchParams): BrowserTestScenario | null {
  const raw = params.get("scenario") || "";
  if (isScenario(raw)) return raw;
  return params.has("automated") ? "automated" : null;
}

function isScenario(value: string): value is BrowserTestScenario {
  return ["battle-basic", "battle-flinch", "entry-weather", "duplicate-status", "dynamax-end-meowth", "rest-shop", "rainbow-rocket", "dex"].includes(value);
}

function createSave(hasRun: boolean): LocalSave {
  return {
    version: 1,
    bp_scale: 1,
    trainer: {name: "自动测试", gender: "other", player_npc_id: PLAYER_TRAINER.id, avatar_asset: PLAYER_TRAINER.avatar_asset},
    stats: {battle_points: 99, battles: 0, wins: 0, losses: 0, rank_status: "未开放"},
    talent_unlocks: [],
    talent_equipped: [],
    starter_upgrades: {},
    battle_setting: normalizeBattleSetting(DEFAULT_BATTLE_SETTING),
    current_run: hasRun ? ({status: "ready_to_battle", seed: 1, battles: 7, next_battle: 1, battle_no: 0, wins: 0, player_team: [], player_display: []} as any) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function generatedCandidates() {
  return {seed: [1, 2, 3, 4], team: CANDIDATES.map(pokemon => ({species: pokemon.species, showdown_id: pokemon.showdown_id})), display: CANDIDATES, packed: ""};
}

function trainerCatalog(): TrainerCatalogState {
  return {
    players: [PLAYER_TRAINER],
    avatars: [{id: "avatar:debug", type: "avatar", name_zh: "斗也", avatar_asset: PLAYER_TRAINER.avatar_asset}],
    champions: [{id: "champion:debug", type: "champion", name_zh: "调试冠军", front_asset: ENEMY_TRAINER.front_asset}],
  };
}

function initialStateForScenario(scenario: BrowserTestScenario, save: LocalSave): DesktopGameState | null {
  if (scenario === "automated") return null;
  if (scenario === "rest-shop") return {screen: "rest", save, rest: restStateForScenario(save), message: "Web 场景：休整商店"};
  if (scenario === "rainbow-rocket") return {screen: "rest", save, rest: restStateForScenario(save, scenario), message: "Web 场景：彩虹火箭队"};
  if (scenario === "dex") return {screen: "mainMenu", save: {...save, current_run: null}, message: "Web 场景：图鉴"};
  return {screen: "battleMain", save, battle: battleStateForScenario(scenario), message: `Web 场景：${scenario}`};
}

function battleStateForScenario(scenario: BrowserTestScenario): BattleState {
  if (scenario === "battle-flinch") return flinchBattle(false);
  if (scenario === "entry-weather") return entryWeatherBattle();
  if (scenario === "duplicate-status") return duplicateStatusBattle();
  if (scenario === "dynamax-end-meowth") return dynamaxMeowthBattle(false);
  return debugBattle(false);
}

function endedBattleForScenario(scenario: BrowserTestScenario): BattleState {
  if (scenario === "battle-flinch") return flinchBattle(true);
  if (scenario === "dynamax-end-meowth") return dynamaxMeowthBattle(true);
  return debugBattle(true);
}

function withCommonBattleFields(battle: BattleState): BattleState {
  return {
    ...battle,
    player_trainer: PLAYER_TRAINER,
    enemy_trainer: ENEMY_TRAINER,
    battle_background: {id: "debug", name: "自动测试场地", src: "assets/battle-backgrounds/arena.svg"},
    show_move_effectiveness: true,
  };
}

function flinchBattle(ended: boolean): BattleState {
  const player = pokemonWithMove("PlayerMon", "爆焰龟兽", "waterfall", "攀瀑", "Water");
  const enemy = debugPokemon("EnemyMon", "爆肌蚊");
  const timeline: BattleTimelineEvent[] = ended ? [
    {id: "flinch-1", type: "move", text: "爆焰龟兽 使用 攀瀑。", side: "p1", source: "爆焰龟兽", source_id: "PlayerMon", source_showdown_id: "pokeball", move: "攀瀑"},
    {id: "flinch-2", type: "damage", text: "爆肌蚊 HP: 62/100", targetSide: "p2", target: "爆肌蚊", target_id: "EnemyMon", target_showdown_id: "greatball", condition: "62/100", hp: {current: 62, max: 100, text: "62/100"}},
    {id: "flinch-3", type: "message", text: "爆肌蚊 因为畏缩无法动弹！", targetSide: "p2", target: "爆肌蚊", target_id: "EnemyMon", target_showdown_id: "greatball", effect: "畏缩"},
  ] : [];
  return withCommonBattleFields({
    ended: false,
    winner: null,
    request: {side: {pokemon: [runtimePokemon(player, "p1: PlayerMon", "pokeball", "100/100", true)]}, active: [{moves: [{id: "waterfall", move: "Waterfall", pp: 15, maxpp: 15}]}]},
    player_side: "p1",
    enemy_side: "p2",
    tracker: tracker("PlayerMon", "EnemyMon", ended ? "100/100" : "100/100", ended ? "62/100" : "100/100"),
    recent_events: ended ? timeline.map(event => event.text) : ["爆焰龟兽 上场了。", "爆肌蚊 上场了。"],
    timeline_events: timeline,
    player_team: [{species: "PlayerMon", pokeball: "pokeball", showdown_id: "pokeball"}],
    player_display: [{...player, showdown_id: "pokeball"}],
    enemy_team: [{species: "EnemyMon", pokeball: "greatball", showdown_id: "greatball"}],
    enemy_display: [{...enemy, showdown_id: "greatball"}],
  });
}

function entryWeatherBattle(): BattleState {
  const pelipper = debugPokemon("Pelipper", "大嘴鸥");
  const torkoal = debugPokemon("Torkoal", "煤炭龟");
  const timeline: BattleTimelineEvent[] = [
    {id: "entry-1", type: "switch", text: "大嘴鸥登场了。", targetSide: "p1", target: "大嘴鸥", target_id: "Pelipper", target_showdown_id: "pokeball"},
    {id: "entry-2", type: "switch", text: "煤炭龟登场了。", targetSide: "p2", target: "煤炭龟", target_id: "Torkoal", target_showdown_id: "greatball"},
    {id: "entry-3", type: "ability", text: "大嘴鸥的降雨。", side: "p1", source: "大嘴鸥", source_id: "Pelipper", source_showdown_id: "pokeball", effect: "降雨"},
    {id: "entry-4", type: "weather", text: "下起了雨。", side: "p1", effect: "雨天"},
    {id: "entry-5", type: "ability", text: "煤炭龟的日照。", side: "p2", source: "煤炭龟", source_id: "Torkoal", source_showdown_id: "greatball", effect: "日照"},
    {id: "entry-6", type: "weather", text: "阳光变强了。", side: "p2", effect: "晴天"},
  ];
  return withCommonBattleFields({
    ended: false,
    winner: null,
    request: {side: {pokemon: [runtimePokemon(pelipper, "p1: Pelipper", "pokeball", "100/100", true)]}, active: [{moves: [{id: "surf", move: "Surf", pp: 15, maxpp: 15}]}]},
    player_side: "p1",
    enemy_side: "p2",
    tracker: {...tracker("Pelipper", "Torkoal"), weather: "晴天"},
    recent_events: timeline.map(event => event.text),
    timeline_events: timeline,
    player_team: [{species: "Pelipper", pokeball: "pokeball", showdown_id: "pokeball"}],
    player_display: [{...pelipper, showdown_id: "pokeball"}],
    enemy_team: [{species: "Torkoal", pokeball: "greatball", showdown_id: "greatball"}],
    enemy_display: [{...torkoal, showdown_id: "greatball"}],
  });
}

function duplicateStatusBattle(): BattleState {
  const first = {...debugPokemon("Eevee", "伊布A"), showdown_id: "pokeball"};
  const second = {...debugPokemon("Eevee", "伊布B"), showdown_id: "greatball"};
  const enemy = {...debugPokemon("EnemyMon", "爆肌蚊"), showdown_id: "ultraball"};
  return withCommonBattleFields({
    ended: false,
    winner: null,
    request: {side: {pokemon: [runtimePokemon(first, "p1: Eevee", "pokeball", "45/100 brn", true), runtimePokemon(second, "p1: Eevee", "greatball", "100/100", false)]}, active: [{moves: [{id: "tackle", move: "Tackle", pp: 35, maxpp: 35}]}]},
    player_side: "p1",
    enemy_side: "p2",
    tracker: {...tracker("Eevee", "EnemyMon", "45/100 brn", "100/100"), active: {p1: {name: "Eevee", display_name: "伊布A", condition: "45/100 brn", status: "brn", showdown_id: "pokeball"}, p2: {name: "EnemyMon", display_name: "爆肌蚊", condition: "100/100", status: "", showdown_id: "ultraball"}}},
    recent_events: ["伊布A 被烧伤了。", "伊布B 状态正常。"],
    timeline_events: [{id: "dup-1", type: "status", text: "伊布A 被烧伤了。", targetSide: "p1", target: "伊布A", target_id: "Eevee", target_showdown_id: "pokeball", effect: "烧伤"}],
    player_team: [{species: "Eevee", pokeball: "pokeball", showdown_id: "pokeball"}, {species: "Eevee", pokeball: "greatball", showdown_id: "greatball"}],
    player_display: [first, second],
    enemy_team: [{species: "EnemyMon", pokeball: "ultraball", showdown_id: "ultraball"}],
    enemy_display: [enemy],
  });
}

function dynamaxMeowthBattle(ended: boolean): BattleState {
  const meowth = meowthPokemon(false);
  const meowthGmax = meowthPokemon(true);
  const enemy = debugPokemon("Eevee", "伊布");
  const timeline: BattleTimelineEvent[] = ended ? [
    {id: "meowth-end-1", type: "move", text: "超极巨喵喵 使用 超极巨特大金币。", side: "p1", source: "超极巨喵喵", source_id: "Meowth-Gmax", source_showdown_id: "pokeball", move: "超极巨特大金币"},
    {id: "meowth-end-2", type: "damage", text: "伊布 HP: 59/100", targetSide: "p2", target: "伊布", target_id: "Eevee", target_showdown_id: "greatball", condition: "59/100", hp: {current: 59, max: 100, text: "59/100"}},
    {id: "meowth-end-3", type: "form", text: "超极巨喵喵 的极巨化结束了。", side: "p1", targetSide: "p1", target: "喵喵", target_id: "Meowth", target_showdown_id: "pokeball", target_species_id: "meowth", sprite: meowth.sprite, effect: "DynamaxEnd"},
    {id: "meowth-end-4", type: "heal", text: "喵喵 回复到 108/108", targetSide: "p1", target: "喵喵", target_id: "Meowth", target_showdown_id: "pokeball", condition: "108/108", hp: {current: 108, max: 108, text: "108/108"}},
  ] : [];
  const active = ended
    ? {name: "Meowth", display_name: "喵喵", species_id: "meowth", sprite: meowth.sprite, condition: "108/108", status: "", showdown_id: "pokeball", dynamaxed: false, gigantamaxed: false}
    : {name: "Meowth-Gmax", display_name: "超极巨喵喵", species_id: "meowthgmax", sprite: meowthGmax.sprite, condition: "216/216", status: "", showdown_id: "pokeball", dynamaxed: true, gigantamaxed: true, original_species_id: "meowth", original_name: "Meowth", original_display_name: "喵喵", original_sprite: meowth.sprite};
  return withCommonBattleFields({
    ended: false,
    winner: null,
    request: {side: {pokemon: [runtimePokemon(meowth, "p1: Meowth", "pokeball", ended ? "108/108" : "216/216", true)]}, active: [{moves: [{id: "payday", move: "Pay Day", pp: 16, maxpp: 16}]}]},
    player_side: "p1",
    enemy_side: "p2",
    tracker: {...tracker("Meowth", "Eevee", ended ? "108/108" : "216/216", ended ? "59/100" : "100/100"), turn: 4, active: {p1: active, p2: {name: "Eevee", display_name: "伊布", condition: ended ? "59/100" : "100/100", status: "", showdown_id: "greatball"}}},
    recent_events: ended ? timeline.map(event => event.text) : ["超极巨喵喵 使用 超极巨特大金币。"],
    timeline_events: timeline,
    player_team: [{species: "Meowth", pokeball: "pokeball", showdown_id: "pokeball"}],
    player_display: [{...meowth, showdown_id: "pokeball"}],
    enemy_team: [{species: "Eevee", pokeball: "greatball", showdown_id: "greatball"}],
    enemy_display: [{...enemy, showdown_id: "greatball"}],
    battle_setting: {...normalizeBattleSetting(DEFAULT_BATTLE_SETTING), battle_rule_preset: "gen8", enabled_battle_systems: ["dynamax"]},
  });
}

function restStateForScenario(save: LocalSave, scenario: BrowserTestScenario = "rest-shop"): RestState {
  const player = CANDIDATES.slice(0, 3);
  const enemy = [debugPokemon("EnemyMon1", "爆肌蚊"), debugPokemon("EnemyMon2", "路卡利欧"), debugPokemon("EnemyMon3", "胡地")];
  const rainbowFactory = CANDIDATES.slice(3, 6).map((pokemon, index) => ({...pokemon, species_zh: `工厂支援${index + 1}`}));
  const rainbowRoute = [debugPokemon("RouteSupport1", "原赛程支援1"), debugPokemon("RouteSupport2", "原赛程支援2"), debugPokemon("RouteSupport3", "原赛程支援3")];
  const isRainbowRocket = scenario === "rainbow-rocket";
  return {
    battle_no: 1,
    battles: 7,
    wins: isRainbowRocket ? 0 : 1,
    battle_points: save.stats.battle_points,
    coins: isRainbowRocket ? 2000 : 300,
    player_display: player,
    enemy_display: enemy,
    player_state: player.map((pokemon, index) => playerState(pokemon, index, index === 0 ? "80/100" : "100/100")),
    bag_items: {potion: 2},
    bag_categories: {consumable: [{id: "potion", name: "Potion", name_zh: "回复药", count: 2, category: "consumable", cost: 20, desc_zh: "回复少量 HP。"}], held: [], tm: []},
    talents: [],
    shop: {roll_count: 1, next_roll_cost: isRainbowRocket ? null : 20, slot_count: 3, offers: isRainbowRocket ? [] : shopOffers(), purchased_offer_id: null, purchased_offer_counts: {}, purchased_item_counts: {}},
    night_sky: {rows: Array.from({length: 7}, (_value, index) => ({battle_no: index + 1, label: index === 6 ? "最终战" : "挑战", trainer: ENEMY_TRAINER, trainer_visible: true, revealed: index < 1 ? 3 : 0, enemies: index < 1 ? enemy : [null, null, null]}))},
    taken_enemy_slots: [],
    exchange_count: 0,
    rest_event_statuses: isRainbowRocket ? [{id: "rainbow_rocket", label: "彩虹火箭队", detail: "赛程已被劫持：普通奇遇和商店关闭。", tone: "risk"}] : undefined,
    event_services: isRainbowRocket ? {tutor: true, egg: true, raid_exchange: false} : undefined,
    rainbow_rocket_support: isRainbowRocket ? {
      battle_no: 1,
      invasion: true,
      completed: false,
      picks_used: 0,
      picks_required: 3,
      max_team_size: 6,
      factory_display: rainbowFactory,
      route_display: rainbowRoute,
      route_trainer: {...ENEMY_TRAINER, name_zh: "原赛程馆主"},
    } : undefined,
    costs: {exchange: 0, restore_hp: {1: 20, 2: 30, 3: 40}, restore_pp: {1: 20, 2: 30, 3: 40}, restore_status: {1: 20, 2: 30, 3: 40}, adjust_stats: 100, randomize_part: 50, randomize_all: 150, move_draw: 100, scout_basic: 50, scout_one: 100, scout_all: 200},
  };
}

function resultStateForBattle(save: LocalSave, battle: BattleState): DesktopGameState {
  const player = battle.player_display[0] || debugPokemon("PlayerMon", "爆焰龟兽");
  return {
    screen: "result",
    save,
    battle,
    message: "自动测试结算",
    result_summary: {
      outcome: "win",
      headline: "胜利结算",
      subtitle: "自动测试结算",
      rows: [{label: "测试", value: "完成"}],
      coin_rows: [{label: "金币", value: "+0"}],
      used_pokemon: [{pokemon: player, kills: 1, deaths: battle.tracker.active.p1.condition?.includes("0") ? 1 : 0, assists: 0, damage_dealt: 100, damage_taken: 0}],
      progress: Array.from({length: 7}, (_value, index) => ({battle_no: index + 1, label: index === 6 ? "最终战" : "挑战", outcome: index === 0 ? "win" : "pending", trainer: ENEMY_TRAINER, trainer_visible: true})),
      enemy_trainer: ENEMY_TRAINER,
    },
  };
}

function shopOffers(): ShopOffer[] {
  return [
    {offer_id: "offer:potion", id: "potion", name: "Potion", name_zh: "回复药", desc: "", desc_zh: "回复少量 HP。", cost: 20, category: "consumable"},
    {offer_id: "offer:oran", id: "oranberry", name: "Oran Berry", name_zh: "橙橙果", desc: "", desc_zh: "携带后回复 HP。", cost: 30, category: "held"},
    {offer_id: "offer:tm-waterfall", id: "tm:waterfall", name: "TM Waterfall", name_zh: "技能机器 攀瀑", desc: "", desc_zh: "教会宝可梦攀瀑。", cost: 100, category: "tm", move_id: "waterfall", move_name: "Waterfall", move_name_zh: "攀瀑"},
  ];
}

function dexSearch(category: DesktopDexCategory, query: string, offset: number, limit: number) {
  const entries = dexEntries(category).filter(entry => {
    const text = `${entry.id} ${entry.name} ${entry.name_zh} ${entry.desc_zh || ""}`.toLowerCase();
    return !query || text.includes(query.toLowerCase().replace(/type:[a-z0-9]+/g, "").trim());
  });
  return {category, query, offset, limit, total: entries.length, has_more: offset + limit < entries.length, entries: entries.slice(offset, offset + limit)};
}

function dexEntries(category: DesktopDexCategory): DesktopDexEntry[] {
  if (category === "pokemon") {
    return [
      {id: "pikachu", name: "Pikachu", name_zh: "皮卡丘", category, desc_zh: "自动测试图鉴条目。", types: ["Electric"], types_zh: ["电"], sprite: spriteEntry("pikachu", "Pikachu", 25, "assets/audio/pokemon-cries/pikachu.ogg"), base_stats: {hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90}, abilities: [{id: "static", name: "Static", name_zh: "静电"}, {id: "lightningrod", name: "Lightning Rod", name_zh: "避雷针", hidden: true}], learnset: [{...debugMove("thunderbolt", "十万伏特", "Electric"), learn_sources: ["levelup", "machine"]}, {...debugMove("fakeout", "击掌奇袭", "Normal"), learn_sources: ["egg"]}]},
      {id: "eevee", name: "Eevee", name_zh: "伊布", category, desc_zh: "用于同物种测试。", types: ["Normal"], types_zh: ["一般"], sprite: spriteEntry("eevee", "Eevee", 133, "assets/audio/pokemon-cries/eevee.ogg"), base_stats: {hp: 55, atk: 55, def: 50, spa: 45, spd: 65, spe: 55}, abilities: [{id: "runaway", name: "Run Away", name_zh: "逃跑"}, {id: "adaptability", name: "Adaptability", name_zh: "适应力"}], learnset: [{...debugMove("quickattack", "电光一闪", "Normal"), learn_sources: ["levelup"]}]},
    ];
  }
  if (category === "moves") return [{id: "waterfall", name: "Waterfall", name_zh: "攀瀑", category, desc_zh: "有概率使目标畏缩。", type: "Water", type_zh: "水", move_category: "Physical", move_category_zh: "物理", power: 80, accuracy: 100, pp: 15}];
  if (category === "items") return [{id: "potion", name: "Potion", name_zh: "回复药", category, desc_zh: "回复少量 HP。"}];
  if (category === "abilities") return [{id: "drizzle", name: "Drizzle", name_zh: "降雨", category, desc_zh: "出场时下雨。"}];
  return [{id: ENEMY_TRAINER.id, name: "Debug Trainer", name_zh: ENEMY_TRAINER.name_zh, category, desc_zh: "自动测试训练师。", unlocked: true, trainer: ENEMY_TRAINER}];
}

function pokemonWithMove(species: string, zh: string, moveId: string, moveName: string, type = "Normal"): RentalPokemon {
  const pokemon = debugPokemon(species, zh);
  return {...pokemon, moves: [debugMove(moveId, moveName, type)]};
}

function meowthPokemon(gmax: boolean): RentalPokemon {
  const speciesId = gmax ? "meowthgmax" : "meowth";
  const name = gmax ? "Meowth-Gmax" : "Meowth";
  const pokemon = {...debugPokemon(name, gmax ? "超极巨喵喵" : "喵喵"), species_id: speciesId, level: 46, stats: {hp: 108, atk: 46, def: 49, spa: 44, spd: 45, spe: 94}, moves: [debugMove("payday", "聚宝功", "Normal")]};
  return {...pokemon, sprite: spriteEntryWithPaths(speciesId, name, 52, `assets/pokemon-showdown/gen5/${gmax ? "meowth-gmax" : "meowth"}.png`, `assets/pokemon-showdown/gen5-back/${gmax ? "meowth-gmax" : "meowth"}.png`, "assets/audio/pokemon-cries/meowth.ogg")};
}

function pricedMove(id: string, name: string, cost: number) {
  return {...debugMove(id, name, id === "waterfall" ? "Water" : "Fire"), cost};
}

function tracker(player: string, enemy: string, playerCondition = "100/100", enemyCondition = "100/100") {
  return {
    turn: 1,
    active: {p1: {name: player, condition: playerCondition, status: statusFromCondition(playerCondition), showdown_id: "pokeball"}, p2: {name: enemy, condition: enemyCondition, status: statusFromCondition(enemyCondition), showdown_id: "greatball"}},
    boosts: {p1: {}, p2: {}},
    side_conditions: {p1: [], p2: []},
    weather: "无",
    field: [],
    pp: {},
  };
}

function runtimePokemon(pokemon: RentalPokemon, ident: string, showdownId: string, condition: string, active: boolean) {
  return {
    ident,
    details: `${pokemon.species}, L${pokemon.level || 50}`,
    condition,
    active,
    item: pokemon.item || "",
    pokeball: showdownId,
    showdown_id: showdownId,
    moves: pokemon.moves.map((move, index) => ({slot: index + 1, id: move.id, move: move.name || move.id, pp: move.pp || 10, maxpp: move.pp || 10})),
  };
}

function playerState(pokemon: RentalPokemon, index: number, condition: string): PlayerPokemonState {
  const hp = Number(condition.match(/^(\d+)/)?.[1] || 100);
  return {
    run_member_id: `web-rpm-${index}`,
    showdown_id: ["pokeball", "greatball", "ultraball"][index] || "masterball",
    slot: index + 1,
    ident: `p1: ${pokemon.species}`,
    details: `${pokemon.species}, L${pokemon.level || 50}`,
    species: pokemon.species,
    hp,
    maxhp: 100,
    status: statusFromCondition(condition),
    fainted: condition.includes("fnt"),
    active: index === 0,
    item: pokemon.item || "",
    condition,
    moves: pokemon.moves.map((move, moveIndex) => ({slot: moveIndex + 1, id: move.id, move: move.name || move.id, pp: move.pp || 10, maxpp: move.pp || 10})),
  };
}

function statusFromCondition(condition: string): string {
  return condition.includes(" brn") ? "brn" : condition.includes(" par") ? "par" : condition.includes(" slp") ? "slp" : condition.includes(" frz") ? "frz" : "";
}

function emptySpritePaths() {
  return {front_normal: "", back_normal: "", front_shiny: "", back_shiny: "", front_normal_full: "", front_shiny_full: ""};
}

function spriteEntry(speciesId: string, name: string, nationalDex: number, cryAsset: string) {
  return {
    species_id: speciesId,
    name,
    national_dex: nationalDex,
    sprite_index: nationalDex,
    base_species: speciesId,
    forme: "",
    confidence: "web-test",
    source: "web-test",
    paths: emptySpritePaths(),
    cry_asset: cryAsset,
  };
}

function spriteEntryWithPaths(speciesId: string, name: string, nationalDex: number, front: string, back: string, cryAsset: string) {
  const paths = {front_normal: front, back_normal: back, front_shiny: front, back_shiny: back, front_normal_full: front, front_shiny_full: front};
  return {...spriteEntry(speciesId, name, nationalDex, cryAsset), paths};
}
