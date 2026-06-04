import {app, BrowserWindow, Menu, ipcMain, protocol} from "electron";
import {existsSync} from "node:fs";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {BattleSession, GameService} from "@changebattle/game-service";
import type {CurrentRunData, DesktopGameState, GeneratedTeam, LocalSave, PokemonSet, RentalPokemon, TrainerGender} from "@changebattle/shared";
import {SaveStore} from "./save-store.js";

declare const __dirname: string;

const DEFAULT_BATTLES = 7;

protocol.registerSchemesAsPrivileged([
  {scheme: "changebattle-asset", privileges: {standard: true, secure: true, supportFetchAPI: true, stream: true}},
]);

function findProjectRoot(): string {
  const candidates = [process.env.CHANGEBATTLE_PROJECT_ROOT, process.cwd(), path.resolve(process.cwd(), "../.."), path.resolve(__dirname, "../../.."), path.resolve(__dirname, "../../../..")].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "data", "sprite_index_map.json"))) return candidate;
  }
  return path.resolve(process.cwd(), "../..");
}

const projectRoot = findProjectRoot();
const gameService = new GameService({projectRoot});
let saveStore: SaveStore | null = null;
let pendingCandidates: GeneratedTeam | null = null;
let activeBattle: BattleSession | null = null;
let activeBattleNo = 0;

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
  return {battle_points: 0, battles: 0, wins: 0, losses: 0, rank_status: "未开放"};
}

function normalizeSave(save: LocalSave): LocalSave {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.trainer = save.trainer || {name: "训练师", gender: "other"};
  save.current_run = save.current_run || null;
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

function recordBattleResult(save: LocalSave, winner: string | null): void {
  const stats = save.stats || emptyStats();
  stats.battles = Number(stats.battles || 0) + 1;
  if (winner === "Player") {
    stats.wins = Number(stats.wins || 0) + 1;
    stats.battle_points = Number(stats.battle_points || 0) + 1;
  } else {
    stats.losses = Number(stats.losses || 0) + 1;
  }
  save.stats = stats;
}

function clearBonus(save: LocalSave): void {
  save.stats.battle_points = Number(save.stats.battle_points || 0) + 3;
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
  save.current_run = {status: "ready", seed: runSeed, battles, next_battle: 1, wins: 0, player_team: playerTeam, player_display: playerDisplay};
  await persist(save);
  return startNextBattle(save);
}

async function continueRun(): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save?.current_run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  if (save.current_run.status === "awaiting_exchange") return exchangeState(save, save.current_run);
  return startNextBattle(save);
}

async function startNextBattle(save: LocalSave): Promise<DesktopGameState> {
  const run = save.current_run as CurrentRunData | null;
  if (!run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  const battleNo = Number(run.next_battle || 1);
  if (battleNo > Number(run.battles || DEFAULT_BATTLES)) {
    clearBonus(save);
    save.current_run = null;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: `通关！完成 ${run.wins || run.battles} 连胜。`});
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
    clearBonus(save);
    save.current_run = null;
    const next = await persist(save);
    const transition = gameState({screen: "result", save: next, battle: state, message: `通关！完成 ${wins} 连胜。`});
    return gameState({screen: "battleMain", save: next, battle: state, message: `通关！完成 ${wins} 连胜。`, pending_transition: transition});
  }
  save.current_run = {...run, status: "awaiting_exchange", battle_no: activeBattleNo, wins, enemy_raw: state.enemy_team, enemy_display: state.enemy_display};
  const next = await persist(save);
  const transition = exchangeState(next, next.current_run as CurrentRunData, `本场胜利！当前连胜：${wins}`);
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
  ipcMain.handle("run:exchange", async (_event, ownIndex: number | null, enemyIndex: number | null) => finishExchange(ownIndex, enemyIndex));
  ipcMain.handle("run:getBattleState", async () => activeBattle?.getState() || null);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
