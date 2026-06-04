import {app, BrowserWindow, Menu, ipcMain, protocol} from "electron";
import {existsSync} from "node:fs";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {BattleSession, GameService} from "@changebattle/game-service";
import type {CurrentRunData, DesktopGameState, GeneratedTeam, LocalSave, MoveSummary, PlayerPokemonState, PokemonEditOptions, PokemonSet, PricedMove, RentalPokemon, RestAction, RestState, ShopItem, TrainerGender} from "@changebattle/shared";
import {SaveStore} from "./save-store.js";

declare const __dirname: string;

const DEFAULT_BATTLES = 7;
const WIN_BP_REWARD = 5;
const REST_EXCHANGE_COSTS = [0, 1, 2];
const REST_HP_COSTS = {1: 1, 2: 2, 3: 3} as const;
const REST_PP_COSTS = {1: 0, 2: 1, 3: 2} as const;
const REST_STATUS_COSTS = {1: 0, 2: 0, 3: 1} as const;
const ADJUST_STATS_COST = 10;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

protocol.registerSchemesAsPrivileged([
  {scheme: "changebattle-asset", privileges: {standard: true, secure: true, supportFetchAPI: true, stream: true}},
]);

function findProjectRoot(): string {
  const resourcePath = process.resourcesPath;
  const candidates = [
    process.env.CHANGEBATTLE_PROJECT_ROOT,
    resourcePath,
    resourcePath ? path.resolve(resourcePath, "..") : "",
    process.cwd(),
    path.resolve(process.cwd(), "../.."),
    path.resolve(__dirname, "../../.."),
    path.resolve(__dirname, "../../../.."),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "data", "sprite_index_map.json"))) return candidate;
  }
  return path.resolve(process.cwd(), "../..");
}

const projectRoot = findProjectRoot();

function findShowdownRoot(): string | undefined {
  const candidates = [
    process.env.SHOWDOWN_PATH,
    path.join(projectRoot, "vendor", "pokemon-showdown"),
    path.join(projectRoot, "resources", "vendor", "pokemon-showdown"),
  ].filter(Boolean) as string[];
  return candidates.find(candidate => existsSync(path.join(candidate, "dist", "sim", "index.js")));
}

const gameService = new GameService({projectRoot, showdownPath: findShowdownRoot()});
let saveStore: SaveStore | null = null;
let pendingCandidates: GeneratedTeam | null = null;
let activeBattle: BattleSession | null = null;
let activeBattleNo = 0;
let goodsCache: Map<string, {item_type: string; item_id: string; item_cost: number}> | null = null;

function installChineseMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {label: "游戏", submenu: [{role: "reload", label: "重新加载"}, {role: "forceReload", label: "强制重新加载"}, {type: "separator"}, {role: "quit", label: "退出"}]},
    {label: "编辑", submenu: [{role: "undo", label: "撤销"}, {role: "redo", label: "重做"}, {type: "separator"}, {role: "cut", label: "剪切"}, {role: "copy", label: "复制"}, {role: "paste", label: "粘贴"}, {role: "selectAll", label: "全选"}]},
    {label: "视图", submenu: [{role: "toggleDevTools", label: "开发者工具"}, {type: "separator"}, {role: "resetZoom", label: "实际大小"}, {role: "zoomIn", label: "放大"}, {role: "zoomOut", label: "缩小"}, {type: "separator"}, {role: "togglefullscreen", label: "全屏"}]},
    {label: "窗口", submenu: [{role: "minimize", label: "最小化"}, {role: "close", label: "关闭窗口"}]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#f4f0e8",
    webPreferences: {preload: path.join(__dirname, "../preload/preload.mjs"), contextIsolation: true, nodeIntegration: false, sandbox: false},
  });
  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

function emptyStats() {
  return {battle_points: 0, battles: 0, wins: 0, losses: 0, win_rate: 0, set_win_streak: 0, best_set_win_streak: 0, rank_status: "未开放"};
}

function refreshStats(save: LocalSave): void {
  const stats = {...emptyStats(), ...(save.stats || {})};
  stats.battle_points = Math.max(0, Math.min(9999, Number(stats.battle_points || 0)));
  stats.battles = Number(stats.battles || 0);
  stats.wins = Number(stats.wins || 0);
  stats.losses = Number(stats.losses || 0);
  stats.win_rate = stats.battles ? Math.round((stats.wins / stats.battles) * 1000) / 10 : 0;
  stats.set_win_streak = Number(stats.set_win_streak || 0);
  stats.best_set_win_streak = Math.max(Number(stats.best_set_win_streak || 0), stats.set_win_streak);
  save.stats = stats;
}

function normalizeSave(save: LocalSave): LocalSave {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.trainer = save.trainer || {name: "训练师", gender: "other"};
  save.current_run = save.current_run || null;
  refreshStats(save);
  if (save.current_run) normalizeCurrentRun(save.current_run);
  return save;
}

async function loadSave(): Promise<LocalSave | null> {
  if (!saveStore) throw new Error("SaveStore 尚未初始化");
  const save = await saveStore.load();
  return save ? normalizeSave(save) : null;
}

async function persist(save: LocalSave): Promise<LocalSave> {
  if (!saveStore) throw new Error("SaveStore 尚未初始化");
  return saveStore.save(normalizeSave(save));
}

function gameState(partial: Partial<DesktopGameState>): DesktopGameState {
  return {screen: "title", save: null, ...partial} as DesktopGameState;
}

function currentBp(save: LocalSave): number {
  return Number((save.stats || emptyStats()).battle_points || 0);
}

function addBp(save: LocalSave, amount: number): void {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.stats.battle_points = Math.min(9999, currentBp(save) + Math.max(0, amount));
  refreshStats(save);
}

function spendBp(save: LocalSave, cost: number): void {
  const normalizedCost = Math.max(0, Number(cost || 0));
  if (currentBp(save) < normalizedCost) throw new Error(`BP 不足，需要 ${normalizedCost}BP。`);
  save.stats.battle_points = currentBp(save) - normalizedCost;
  refreshStats(save);
}

function recordBattleResult(save: LocalSave, winner: string | null): void {
  const stats = {...emptyStats(), ...(save.stats || {})};
  stats.battles = Number(stats.battles || 0) + 1;
  if (winner === "Player") {
    stats.wins = Number(stats.wins || 0) + 1;
    save.stats = stats;
    addBp(save, WIN_BP_REWARD);
  } else {
    stats.losses = Number(stats.losses || 0) + 1;
    stats.set_win_streak = 0;
    save.stats = stats;
    refreshStats(save);
  }
}

function clearBonus(save: LocalSave): {setStreak: number; bonus: number} {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  const setStreak = Number(save.stats.set_win_streak || 0) + 1;
  save.stats.set_win_streak = setStreak;
  save.stats.best_set_win_streak = Math.max(Number(save.stats.best_set_win_streak || 0), setStreak);
  const bonus = setStreak * 2 + 7;
  addBp(save, bonus);
  return {setStreak, bonus};
}

function toId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function loadGoods(): Promise<Map<string, {item_type: string; item_id: string; item_cost: number}>> {
  if (goodsCache) return goodsCache;
  const goods = new Map<string, {item_type: string; item_id: string; item_cost: number}>();
  const filePath = path.join(projectRoot, "data", "goods.csv");
  if (existsSync(filePath)) {
    const raw = await readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue;
      const [item_id, item_type, , item_cost] = line.split(",");
      const key = `${toId(item_type)}:${toId(item_id)}`;
      goods.set(key, {item_type: toId(item_type), item_id: toId(item_id), item_cost: Math.max(0, Number(item_cost || 0))});
    }
  }
  goodsCache = goods;
  return goods;
}

async function goodsCost(itemType: string, itemId: string, fallback = 0): Promise<number> {
  const goods = await loadGoods();
  return goods.get(`${toId(itemType)}:${toId(itemId)}`)?.item_cost ?? Math.max(0, Number(fallback || 0));
}

function spendText(cost: number): string {
  return Number(cost || 0) <= 0 ? "免费" : `花费 ${Number(cost)}BP`;
}

function defaultMoveCost(power: number | undefined): number {
  const value = Number(power || 0);
  if (value >= 120) return 5;
  if (value > 90) return 4;
  if (value > 60) return 3;
  if (value > 30) return 2;
  return 1;
}

async function moveGoodsCost(move: MoveSummary): Promise<number> {
  return goodsCost("skill", move.id || move.name, defaultMoveCost(move.power));
}

function displayMoveMaxPp(move: any): number {
  return Math.max(1, Math.floor(Number(move?.pp || 1) * 8 / 5));
}

function stateCondition(state: PlayerPokemonState): string {
  const hp = Math.max(0, Number(state.hp || 0));
  const maxhp = Math.max(1, Number(state.maxhp || 1));
  if (hp <= 0) return "0 fnt";
  return `${hp}/${maxhp}${state.status ? ` ${state.status}` : ""}`;
}

function refreshStateCondition(state: PlayerPokemonState): PlayerPokemonState {
  state.hp = Math.max(0, Math.min(Number(state.hp || 0), Number(state.maxhp || 1)));
  state.fainted = state.hp <= 0;
  if (state.fainted) state.status = "";
  state.condition = stateCondition(state);
  return state;
}

function fullStateForPokemon(pokemon: RentalPokemon, slot: number): PlayerPokemonState {
  const maxhp = Math.max(1, Number(pokemon.stats?.hp || 1));
  return {
    slot,
    ident: `p1: ${pokemon.species || pokemon.name || slot}`,
    details: pokemon.species || pokemon.name || "",
    species: pokemon.species || pokemon.name || "",
    hp: maxhp,
    maxhp,
    status: "",
    fainted: false,
    active: slot === 1,
    item: toId(pokemon.item_id || pokemon.item),
    condition: `${maxhp}/${maxhp}`,
    moves: (pokemon.moves || []).map((move, index) => {
      const maxpp = displayMoveMaxPp(move);
      return {slot: index + 1, id: toId(move.id || move.name), move: move.name || move.id || "", pp: maxpp, maxpp};
    }),
  };
}

function adjustedStateAfterEdit(oldState: PlayerPokemonState, newDisplay: RentalPokemon, slot: number): PlayerPokemonState {
  const next = fullStateForPokemon(newDisplay, slot);
  const oldMax = Math.max(1, Number(oldState.maxhp || next.maxhp || 1));
  const oldHp = Math.max(0, Number(oldState.hp || 0));
  const newMax = Math.max(1, Number(next.maxhp || 1));
  if (oldHp <= 0 || oldState.fainted) next.hp = 0;
  else if (oldHp >= oldMax) next.hp = newMax;
  else next.hp = Math.max(1, Math.min(newMax, Math.round(oldHp * newMax / oldMax)));
  next.status = oldState.status || "";
  const oldPp = new Map((oldState.moves || []).map(move => [toId(move.id || move.move), move]));
  next.moves = next.moves.map(move => {
    const previous = oldPp.get(move.id);
    return previous ? {...move, pp: Math.max(0, Math.min(Number(previous.pp ?? move.pp), move.maxpp))} : move;
  });
  return refreshStateCondition(next);
}

function normalizePlayerState(run: CurrentRunData): PlayerPokemonState[] {
  const existing = [...(run.player_state || [])];
  const states = (run.player_display || []).map((pokemon, index) => {
    const full = fullStateForPokemon(pokemon, index + 1);
    const state = {...full, ...(existing[index] || {})};
    state.slot = index + 1;
    state.ident = state.ident || full.ident;
    state.details = state.details || full.details;
    state.species = state.species || full.species;
    state.maxhp = Number(state.maxhp || full.maxhp);
    state.hp = Number(state.hp ?? full.hp);
    state.status = state.status || "";
    state.item = state.item || full.item;
    const currentMoves = new Map((state.moves || []).map(move => [toId(move.id || move.move), move]));
    state.moves = full.moves.map(move => {
      const current = currentMoves.get(move.id);
      return {...move, pp: Math.max(0, Math.min(Number(current?.pp ?? move.pp), move.maxpp))};
    });
    return refreshStateCondition(state);
  });
  run.player_state = states;
  return states;
}

function normalizeCurrentRun(run: CurrentRunData): CurrentRunData {
  if (run.status === "awaiting_exchange") run.status = "awaiting_rest";
  run.bp_earned_this_run = Number(run.bp_earned_this_run || 0);
  run.bp_investments = Array.from({length: run.player_display?.length || 3}, (_, index) => Number(run.bp_investments?.[index] || 0));
  run.move_investments = Array.from({length: run.player_display?.length || 3}, (_, index) => {
    const row = run.move_investments?.[index] || [];
    return [0, 1, 2, 3].map(slot => Number(row[slot] || 0));
  });
  run.bag_items = Object.fromEntries(Object.entries(run.bag_items || {}).map(([id, count]) => [toId(id), Math.max(0, Number(count || 0))] as const).filter(([, count]) => count > 0));
  run.rest_status = {
    exchanges: Number(run.rest_status?.exchanges || 0),
    taken_enemy_slots: (run.rest_status?.taken_enemy_slots || []).map(Number).filter(slot => slot >= 1 && slot <= 3),
  };
  normalizePlayerState(run);
  return run;
}

function rotateFirstUsable(run: CurrentRunData): boolean {
  const states = normalizePlayerState(run);
  const first = states.findIndex(state => !state.fainted && state.hp > 0);
  if (first < 0) return false;
  if (first === 0) return true;
  for (const key of ["player_team", "player_display", "player_state", "bp_investments", "move_investments"] as const) {
    const values = [...((run as any)[key] || [])];
    if (first < values.length) [values[0], values[first]] = [values[first], values[0]];
    (run as any)[key] = values;
  }
  normalizePlayerState(run);
  return true;
}

function restState(save: LocalSave, run: CurrentRunData, message?: string): DesktopGameState {
  normalizeCurrentRun(run);
  const exchangeCount = Number(run.rest_status?.exchanges || 0);
  const exchangeCost = exchangeCount >= 3 ? null : REST_EXCHANGE_COSTS[Math.min(exchangeCount, REST_EXCHANGE_COSTS.length - 1)];
  const rest: RestState = {
    battle_no: Number(run.battle_no || Math.max(1, Number(run.next_battle || 1) - 1)),
    battles: Number(run.battles || DEFAULT_BATTLES),
    wins: Number(run.wins || 0),
    battle_points: currentBp(save),
    player_display: run.player_display || [],
    enemy_display: run.enemy_display || [],
    player_state: normalizePlayerState(run),
    bag_items: run.bag_items || {},
    taken_enemy_slots: run.rest_status?.taken_enemy_slots || [],
    exchange_count: exchangeCount,
    costs: {
      exchange: exchangeCost,
      restore_hp: REST_HP_COSTS,
      restore_pp: REST_PP_COSTS,
      restore_status: REST_STATUS_COSTS,
      adjust_stats: ADJUST_STATS_COST,
    },
  };
  return gameState({screen: "rest", save, rest, message});
}

async function prepareCandidates(seed?: number): Promise<DesktopGameState> {
  const save = await loadSave();
  const runSeed = seed || Math.floor(Math.random() * 0xffffffff);
  pendingCandidates = await gameService.generateRentalCandidates(gameService.deriveSeed(runSeed, 1));
  return gameState({screen: "rentalSelect", save, candidates: pendingCandidates, selected_indexes: [], message: `随机种子：${runSeed}`});
}

async function beginChallenge(selectedIndexes: number[], runSeed: number, battles = DEFAULT_BATTLES): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  if (!pendingCandidates) pendingCandidates = await gameService.generateRentalCandidates(gameService.deriveSeed(runSeed, 1));
  if (selectedIndexes.length !== 3) throw new Error("需要选择 3 只宝可梦。");
  const playerTeam = selectedIndexes.map(index => pendingCandidates!.team[index]);
  const playerDisplay = selectedIndexes.map(index => pendingCandidates!.display[index]);
  save.current_run = {
    status: "ready",
    seed: runSeed,
    battles,
    next_battle: 1,
    wins: 0,
    player_team: playerTeam,
    player_display: playerDisplay,
    player_state: playerDisplay.map((pokemon, index) => fullStateForPokemon(pokemon, index + 1)),
    bp_earned_this_run: 0,
    bp_investments: [0, 0, 0],
    move_investments: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    bag_items: {},
    rest_status: {exchanges: 0, taken_enemy_slots: []},
  };
  await persist(save);
  return startNextBattle(save);
}

async function continueRun(): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save?.current_run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  if (save.current_run.status === "awaiting_exchange" || save.current_run.status === "awaiting_rest") return restState(save, save.current_run);
  return startNextBattle(save);
}

async function startNextBattle(save: LocalSave): Promise<DesktopGameState> {
  const run = save.current_run as CurrentRunData | null;
  if (!run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  normalizeCurrentRun(run);
  const battleNo = Number(run.next_battle || 1);
  if (battleNo > Number(run.battles || DEFAULT_BATTLES)) {
    const {setStreak, bonus} = clearBonus(save);
    save.current_run = null;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: `通关！完成 ${run.wins || run.battles} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}BP。`});
  }
  const enemyGenerated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), 100 + battleNo));
  const enemyTeam = enemyGenerated.team.slice(0, 3);
  const enemyDisplay = enemyGenerated.display.slice(0, 3);
  activeBattleNo = battleNo;
  activeBattle = await gameService.createBattleSession({
    playerTeam: run.player_team,
    enemyTeam,
    playerDisplay: run.player_display,
    enemyDisplay,
    playerState: normalizePlayerState(run),
    seed: gameService.deriveSeed(Number(run.seed), 200 + battleNo),
  });
  return gameState({screen: "battleMain", save, battle: activeBattle.getState(), message: `第 ${battleNo}/${run.battles} 场`});
}

async function submitBattleChoice(choice: string): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save?.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
  const state = choice === "forfeit" ? activeBattle.forfeit() : await activeBattle.choose(choice);
  if (!state.ended) return gameState({screen: "battleMain", save, battle: state});
  recordBattleResult(save, state.winner);
  const run = save.current_run as CurrentRunData;
  run.player_state = activeBattle.getPlayerState();
  if (state.winner !== "Player") {
    const wins = Number(run.wins || 0);
    save.current_run = null;
    const next = await persist(save);
    const transition = gameState({screen: "result", save: next, battle: state, message: `挑战结束。连胜：${wins}`});
    return gameState({screen: "battleMain", save: next, battle: state, message: `挑战结束。连胜：${wins}`, pending_transition: transition});
  }
  const wins = Number(run.wins || 0) + 1;
  if (activeBattleNo >= Number(run.battles || DEFAULT_BATTLES)) {
    run.wins = wins;
    const {setStreak, bonus} = clearBonus(save);
    save.current_run = null;
    const next = await persist(save);
    const message = `通关！完成 ${wins} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}BP。`;
    const transition = gameState({screen: "result", save: next, battle: state, message});
    return gameState({screen: "battleMain", save: next, battle: state, message, pending_transition: transition});
  }
  save.current_run = {
    ...run,
    status: "awaiting_rest",
    battle_no: activeBattleNo,
    wins,
    enemy_raw: state.enemy_team,
    enemy_display: state.enemy_display,
    bp_earned_this_run: Number(run.bp_earned_this_run || 0) + WIN_BP_REWARD,
    rest_status: {exchanges: 0, taken_enemy_slots: []},
  };
  const next = await persist(save);
  const transition = restState(next, next.current_run as CurrentRunData, `本场胜利！获得 ${WIN_BP_REWARD}BP。当前连胜：${wins}`);
  return gameState({screen: "battleMain", save: next, battle: state, message: `本场胜利！当前连胜：${wins}`, pending_transition: transition});
}

function exchangeState(save: LocalSave, run: CurrentRunData, message?: string): DesktopGameState {
  return gameState({
    screen: "exchange",
    save,
    exchange: {battle_no: Number(run.battle_no || 1), wins: Number(run.wins || 0), player_display: run.player_display, enemy_display: run.enemy_display || []},
    message,
  });
}

async function finishExchange(ownIndex: number | null, enemyIndex: number | null): Promise<DesktopGameState> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!save || !run || run.status !== "awaiting_exchange") throw new Error("当前不在交换阶段。");
  const playerTeam = [...run.player_team];
  const playerDisplay = [...run.player_display];
  if (ownIndex !== null && enemyIndex !== null && run.enemy_raw && run.enemy_display) {
    playerTeam[ownIndex] = run.enemy_raw[enemyIndex];
    playerDisplay[ownIndex] = run.enemy_display[enemyIndex];
  }
  save.current_run = {status: "ready", seed: run.seed, battles: run.battles, next_battle: Number(run.battle_no || 1) + 1, wins: run.wins, player_team: playerTeam, player_display: playerDisplay};
  const next = await persist(save);
  return startNextBattle(next);
}

async function finishRestForNextBattle(save: LocalSave, run: CurrentRunData): Promise<DesktopGameState> {
  if (!rotateFirstUsable(run)) throw new Error("队伍没有可出战宝可梦，请先恢复 HP。");
  const battleNo = Number(run.battle_no || 1);
  save.current_run = {
    ...run,
    status: "ready",
    next_battle: battleNo + 1,
    rest_status: {exchanges: 0, taken_enemy_slots: []},
  };
  delete save.current_run.battle_no;
  delete save.current_run.enemy_raw;
  delete save.current_run.enemy_display;
  const next = await persist(save);
  return startNextBattle(next);
}

function normalizeStatsInput(input: Record<string, number> | undefined, defaultValue: number): Record<string, number> {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, Number(input?.[stat] ?? defaultValue)]));
}

function validateStatAdjustments(rawSet: PokemonSet, options: PokemonEditOptions): void {
  const ivs = normalizeStatsInput(rawSet.ivs, 31);
  const evs = normalizeStatsInput(rawSet.evs, 0);
  for (const stat of STAT_IDS) {
    if (ivs[stat] < 0 || ivs[stat] > 31) throw new Error("个体值必须在 0-31 之间。");
    if (evs[stat] < 0 || evs[stat] > 255) throw new Error("努力值单项必须在 0-255 之间。");
  }
  const evTotal = STAT_IDS.reduce((sum, stat) => sum + Number(evs[stat] || 0), 0);
  if (evTotal > 510) throw new Error(`努力值总和 ${evTotal} 超过 510。`);
  const abilityIds = new Set(options.abilities.map(ability => toId(ability.name || ability.id)));
  if (abilityIds.size && !abilityIds.has(toId(rawSet.ability))) throw new Error("特性不是该宝可梦的合法特性。");
  const natureIds = new Set(options.natures.map(nature => toId(nature.name)));
  if (natureIds.size && !natureIds.has(toId(rawSet.nature || "Serious"))) throw new Error("性格不是合法性格。");
}

async function handleRestAction(action: RestAction): Promise<DesktopGameState> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!save || !run || (run.status !== "awaiting_rest" && run.status !== "awaiting_exchange")) throw new Error("当前不在休整阶段。");
  normalizeCurrentRun(run);
  if (action.type === "next") return finishRestForNextBattle(save, run);
  if (action.type === "abort") {
    save.stats = {...emptyStats(), ...(save.stats || {}), set_win_streak: 0};
    refreshStats(save);
    save.current_run = null;
    activeBattle = null;
    activeBattleNo = 0;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: "本局挑战已中断，当前连胜已归零。历史最高连胜已保留。"});
  }

  const states = normalizePlayerState(run);
  if (action.type === "restore_hp" || action.type === "restore_pp" || action.type === "restore_status") {
    const slots = [...new Set(action.slots)].filter(slot => slot >= 1 && slot <= states.length);
    if (!slots.length) throw new Error("请选择要恢复的宝可梦。");
    const costMap = action.type === "restore_hp" ? REST_HP_COSTS : action.type === "restore_pp" ? REST_PP_COSTS : REST_STATUS_COSTS;
    const cost = costMap[Math.min(3, slots.length) as 1 | 2 | 3];
    spendBp(save, cost);
    for (const slot of slots) {
      const state = states[slot - 1];
      if (action.type === "restore_hp") {
        state.hp = state.maxhp;
        state.fainted = false;
      } else if (action.type === "restore_pp") {
        for (const move of state.moves) move.pp = move.maxpp;
      } else {
        state.status = "";
      }
      refreshStateCondition(state);
    }
    run.player_state = states;
    const next = await persist(save);
    return restState(next, next.current_run as CurrentRunData, `已恢复，${spendText(cost)}。`);
  }

  if (action.type === "exchange") {
    if (!run.enemy_raw || !run.enemy_display) throw new Error("没有可交换的敌方队伍。");
    const own = action.ownIndex + 1;
    const foe = action.enemyIndex + 1;
    if (own < 1 || own > 3 || foe < 1 || foe > 3) throw new Error("交换编号需要在 1-3 之间。");
    const restStatus = run.rest_status || {exchanges: 0, taken_enemy_slots: []};
    const exchanges = Number(restStatus.exchanges || 0);
    if (exchanges >= 3) throw new Error("本次休整最多交换 3 只。");
    if ((restStatus.taken_enemy_slots || []).includes(foe)) throw new Error("这只敌方宝可梦已经被交换过了。");
    const cost = await goodsCost("service", `exchange_${exchanges + 1}`, REST_EXCHANGE_COSTS[Math.min(exchanges, REST_EXCHANGE_COSTS.length - 1)]);
    spendBp(save, cost);
    const investments = run.bp_investments || [0, 0, 0];
    const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    const refund = Math.floor(Number(investments[action.ownIndex] || 0) / 2) + Math.floor((moveInvestments[action.ownIndex] || []).reduce((sum, value) => sum + Number(value || 0), 0) / 2);
    if (refund) addBp(save, refund);
    const oldItem = toId(run.player_display[action.ownIndex]?.item_id || run.player_team[action.ownIndex]?.item);
    if (oldItem) run.bag_items = {...(run.bag_items || {}), [oldItem]: Number(run.bag_items?.[oldItem] || 0) + 1};
    run.player_team[action.ownIndex] = run.enemy_raw[action.enemyIndex];
    run.player_display[action.ownIndex] = run.enemy_display[action.enemyIndex];
    run.player_state = normalizePlayerState(run);
    run.player_state[action.ownIndex] = fullStateForPokemon(run.player_display[action.ownIndex], own);
    investments[action.ownIndex] = 0;
    moveInvestments[action.ownIndex] = [0, 0, 0, 0];
    run.bp_investments = investments;
    run.move_investments = moveInvestments;
    run.rest_status = {exchanges: exchanges + 1, taken_enemy_slots: [...(restStatus.taken_enemy_slots || []), foe]};
    const next = await persist(save);
    return restState(next, next.current_run as CurrentRunData, `已交换，${spendText(cost)}${refund ? `，返还 ${refund}BP` : ""}。`);
  }

  if (action.type === "buy_item") {
    const itemId = toId(action.itemId);
    const cost = await goodsCost("item", itemId, 5);
    spendBp(save, cost);
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    const next = await persist(save);
    return restState(next, next.current_run as CurrentRunData, `已购买道具，${spendText(cost)}。`);
  }

  if (action.type === "equip_item" || action.type === "unequip_item") {
    const slot = action.slot + 1;
    if (slot < 1 || slot > run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const oldItem = toId(run.player_display[action.slot]?.item_id || run.player_team[action.slot]?.item);
    if (oldItem) run.bag_items = {...(run.bag_items || {}), [oldItem]: Number(run.bag_items?.[oldItem] || 0) + 1};
    if (action.type === "equip_item") {
      const itemId = toId(action.itemId);
      const count = Number(run.bag_items?.[itemId] || 0);
      if (count <= 0) throw new Error("背包里没有这个道具。");
      run.bag_items = {...(run.bag_items || {}), [itemId]: count - 1};
      if (!run.bag_items[itemId]) delete run.bag_items[itemId];
      run.player_team[action.slot].item = itemId;
    } else {
      run.player_team[action.slot].item = "";
    }
    const described = await gameService.describeTeam([run.player_team[action.slot]]);
    run.player_display[action.slot] = described[0] || run.player_display[action.slot];
    run.player_state = normalizePlayerState(run);
    run.player_state[action.slot].item = toId(run.player_display[action.slot].item_id || run.player_team[action.slot].item);
    const next = await persist(save);
    return restState(next, next.current_run as CurrentRunData, action.type === "equip_item" ? "已装备道具。" : "已卸下道具。");
  }

  if (action.type === "adjust_move") {
    const slot = action.slot;
    const moveSlot = action.moveSlot;
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const rawSet = JSON.parse(JSON.stringify(run.player_team[slot])) as PokemonSet;
    const currentMoves = [...(rawSet.moves || [])];
    if (moveSlot < 0 || moveSlot >= currentMoves.length) throw new Error("招式格子无效。");
    const legalMoves = await gameService.learnableMoves(rawSet);
    const selected = legalMoves.find(move => move.id === toId(action.moveId) || toId(move.name) === toId(action.moveId));
    if (!selected) throw new Error("这不是该宝可梦的合法可学招式。");
    const otherMoves = new Set(currentMoves.map((move: string) => toId(move)));
    otherMoves.delete(toId(currentMoves[moveSlot]));
    if (otherMoves.has(selected.id)) throw new Error("不能重复学习同一个招式。");
    const cost = await moveGoodsCost(selected);
    const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    const oldInvestment = Number(moveInvestments[slot]?.[moveSlot] || 0);
    const refund = Math.floor(oldInvestment / 2);
    if (currentBp(save) + refund < cost) throw new Error(`BP 不足，需要 ${cost}BP；旧技能可返还 ${refund}BP。`);
    currentMoves[moveSlot] = selected.name || selected.id;
    rawSet.moves = currentMoves;
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    if (refund) addBp(save, refund);
    spendBp(save, cost);
    run.player_team[slot] = rawSet;
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    run.player_state = nextStates;
    moveInvestments[slot] = moveInvestments[slot] || [0, 0, 0, 0];
    moveInvestments[slot][moveSlot] = cost;
    run.move_investments = moveInvestments;
    const next = await persist(save);
    return restState(next, next.current_run as CurrentRunData, `已学习 ${selected.name_zh}，${spendText(cost)}${refund ? `，返还 ${refund}BP` : ""}。`);
  }

  if (action.type === "adjust_stats") {
    const slot = action.slot;
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const rawSet = JSON.parse(JSON.stringify(run.player_team[slot])) as PokemonSet;
    rawSet.ivs = normalizeStatsInput(action.ivs, 31);
    rawSet.evs = normalizeStatsInput(action.evs, 0);
    rawSet.ability = action.ability || rawSet.ability || run.player_display[slot].ability;
    rawSet.nature = action.nature || rawSet.nature || run.player_display[slot].nature || "Serious";
    const options = await gameService.editOptions(rawSet);
    validateStatAdjustments(rawSet, options);
    const cost = await goodsCost("service", "adjust_stats", ADJUST_STATS_COST);
    spendBp(save, cost);
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    run.player_team[slot] = rawSet;
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    run.player_state = nextStates;
    const investments = run.bp_investments || [0, 0, 0];
    investments[slot] = Number(investments[slot] || 0) + cost;
    run.bp_investments = investments;
    const next = await persist(save);
    return restState(next, next.current_run as CurrentRunData, `已保存能力值调整，${spendText(cost)}。`);
  }

  return restState(save, run);
}

async function shopItems(query = ""): Promise<ShopItem[]> {
  const goods = await loadGoods();
  const needle = query.trim().toLowerCase();
  const items = (await gameService.itemOptions()).map(item => {
    const cost = goods.get(`item:${toId(item.id)}`)?.item_cost ?? 5;
    return {...item, cost};
  });
  return items
    .filter(item => !needle || [item.id, item.name, item.name_zh, item.desc, item.desc_zh].join(" ").toLowerCase().includes(needle))
    .slice(0, 40);
}

async function learnableMoves(slot: number, query = ""): Promise<PricedMove[]> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!run || slot < 0 || slot >= run.player_team.length) return [];
  const goods = await loadGoods();
  const needle = query.trim().toLowerCase();
  const moves = await gameService.learnableMoves(run.player_team[slot]);
  return moves
    .map(move => ({...move, cost: goods.get(`skill:${toId(move.id)}`)?.item_cost ?? defaultMoveCost(move.power)}))
    .filter(move => !needle || [move.id, move.name, move.name_zh, move.desc, move.desc_zh, move.type, move.type_zh].join(" ").toLowerCase().includes(needle))
    .slice(0, 60);
}

async function editOptions(slot: number): Promise<PokemonEditOptions> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!run || slot < 0 || slot >= run.player_team.length) return {abilities: [], natures: []};
  return gameService.editOptions(run.player_team[slot]);
}

app.whenReady().then(() => {
  installChineseMenu();
  saveStore = new SaveStore(app.getPath("userData"));
  protocol.handle("changebattle-asset", async request => {
    const url = new URL(request.url);
    const rawPath = decodeURIComponent(url.pathname.replace(/^\//, ""));
    const filePath = path.resolve(projectRoot, rawPath);
    if (!filePath.startsWith(projectRoot + path.sep)) return new Response("Forbidden", {status: 403});
    try {
      const bytes = await readFile(filePath);
      return new Response(bytes, {headers: {"content-type": contentTypeFor(filePath)}});
    } catch {
      return new Response("Not found", {status: 404});
    }
  });

  ipcMain.handle("save:load", async () => loadSave());
  ipcMain.handle("save:createNew", async (_event, trainer: {name: string; gender: TrainerGender}) => saveStore!.createNew({name: trainer.name, gender: trainer.gender}));
  ipcMain.handle("save:updateTrainer", async (_event, trainer: {name: string; gender: TrainerGender}) => saveStore!.updateTrainer({name: trainer.name, gender: trainer.gender}));
  ipcMain.handle("game:generateCandidates", async (_event, seed?: number) => gameService.generateRentalCandidates(seed || Date.now()));
  ipcMain.handle("run:prepareCandidates", async (_event, seed?: number) => prepareCandidates(seed));
  ipcMain.handle("run:beginChallenge", async (_event, selectedIndexes: number[], seed: number, battles?: number) => beginChallenge(selectedIndexes, seed, battles));
  ipcMain.handle("run:continue", async () => continueRun());
  ipcMain.handle("run:battleChoice", async (_event, choice: string) => submitBattleChoice(choice));
  ipcMain.handle("run:exchange", async (_event, ownIndex: number | null, enemyIndex: number | null) => {
    if (ownIndex === null || enemyIndex === null) return handleRestAction({type: "next"});
    return handleRestAction({type: "exchange", ownIndex, enemyIndex});
  });
  ipcMain.handle("run:restAction", async (_event, action: RestAction) => handleRestAction(action));
  ipcMain.handle("shop:items", async (_event, query?: string) => shopItems(query || ""));
  ipcMain.handle("pokemon:learnableMoves", async (_event, slot: number, query?: string) => learnableMoves(slot, query || ""));
  ipcMain.handle("pokemon:editOptions", async (_event, slot: number) => editOptions(slot));
  ipcMain.handle("run:getBattleState", async () => activeBattle?.getState() || null);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
