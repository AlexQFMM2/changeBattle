import {app, BrowserWindow, Menu, ipcMain, protocol} from "electron";
import {existsSync, readFileSync} from "node:fs";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {GameService, type TrainerItemBattleSession} from "@changebattle/game-service";
import type {BagCategoryView, BattleState, CurrentRunData, DesktopGameState, GeneratedTeam, ItemCategory, LocalSave, MoveSummary, PlayerPokemonState, PokemonEditOptions, PokemonSet, PricedMove, RentalPokemon, RestAction, RestState, ShopItem, ShopOffer, TalentView, TrainerCatalogState, TrainerNpcType, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import {
  ADJUST_STATS_COST,
  BP_SCALE,
  DEFAULT_BATTLES,
  DIRECT_MOVE_COST,
  RANDOMIZE_ALL_COST,
  RANDOMIZE_PART_COST,
  REROLL_COSTS,
  REST_HP_COSTS,
  REST_PP_COSTS,
  REST_STATUS_COSTS,
  REVIEW_PREVIOUS_COST,
  SCOUT_ALL_COST,
  SCOUT_BASIC_COST,
  SCOUT_ONE_COST,
  SECOND_TEAM_ROAR_COST,
  STARTER_ITEM_OFFER_COUNT,
  STARTER_ITEM_REROLL_COST,
  TALENTS,
  TALENT_EQUIP_LIMIT,
  WIN_BP_REWARD,
  addBp,
  addRunBp,
  applyProphetFirstMover,
  canExchangeBoss,
  canSecondTeamRoar,
  candidateCountForTalents,
  clearBonus,
  currentBp,
  emptyStats,
  exchangeCost,
  exchangeKeepsItem,
  exchangeStateRatio,
  gamblerFailureBp,
  gamblerStreakRoll,
  hasTalent,
  isTmItemId,
  itemCategory,
  itemKey,
  moveDrawCost,
  moveDrawCount,
  pricedForShop,
  refreshStats,
  sellPriceForItem,
  settleProphetFirstMover,
  shopDuplicateBonusForOffers,
  shopNextRollCost,
  shopOfferCount,
  spendBp,
  starterPurchaseLimit,
  statResetCost,
  talentsForIds,
  toId,
} from "./run-rules.js";
import {SaveStore} from "./save-store.js";

declare const __dirname: string;

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
let pendingStarter: {seed: number; offers: ShopOffer[]; purchased: ShopOffer[]; talents: TalentView[]} | null = null;
let pendingRescue: {seed: number; battleNo: number; candidates: GeneratedTeam} | null = null;
let configuredTalents: TalentView[] = [];
let activeBattle: TrainerItemBattleSession | null = null;
let activeBattleNo = 0;
let goodsCache: Map<string, {item_type: string; item_id: string; item_cost: number}> | null = null;
let shopPoolCache: ShopPoolEntry[] | null = null;
let bossTeamPoolCache: BossTeamPoolRow[] | null = null;

type TalentConfigState = {catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null};
type BossRoute = {type: "normal" | "gym" | "champion" | "elite4"; stage: string; route: string; pool: Array<{type: TrainerNpcType; tier?: string}>};
type GenerationProfile = "tier1" | "tier2" | "tier3" | "tier4" | "champion";
type ShopPoolBucket = "healing" | "tm" | "held" | "berry" | "pp";
type ShopPoolEntry = {
  id: string;
  kind: "item" | "tm";
  category: ItemCategory;
  cost: number;
  weight: number;
  enabled: boolean;
  notes?: string;
};
type BossTeamPoolRow = {pool_id: string; trainer_id: string; team_index: number; slot: number; species_id: string; generation_profile: GenerationProfile};

const SHOP_BUCKET_WEIGHTS: Record<ShopPoolBucket, number> = {
  healing: 65,
  pp: 15,
  berry: 10,
  tm: 5,
  held: 5,
};

const GUARANTEED_SHOP_ITEMS: Array<{id: string; cost: number}> = [
  {id: "potion", cost: 50},
  {id: "superpotion", cost: 50},
  {id: "hyperpotion", cost: 100},
  {id: "maxpotion", cost: 150},
  {id: "fullrestore", cost: 100},
  {id: "revive", cost: 100},
  {id: "maxrevive", cost: 200},
  {id: "revivalherb", cost: 200},
  {id: "fullheal", cost: 50},
  {id: "healpowder", cost: 50},
  {id: "antidote", cost: 50},
  {id: "burnheal", cost: 50},
  {id: "iceheal", cost: 50},
  {id: "awakening", cost: 50},
  {id: "paralyzeheal", cost: 50},
];

const LOCAL_ITEM_DETAILS: Record<string, {name: string; name_zh: string; desc: string; desc_zh: string}> = {
  potion: {name: "Potion", name_zh: "伤药", desc: "Restores 20 HP.", desc_zh: "恢复 20 点 HP。"},
  superpotion: {name: "Super Potion", name_zh: "好伤药", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  hyperpotion: {name: "Hyper Potion", name_zh: "厉害伤药", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  maxpotion: {name: "Max Potion", name_zh: "全满药", desc: "Fully restores HP.", desc_zh: "恢复全部 HP。"},
  fullrestore: {name: "Full Restore", name_zh: "全复药", desc: "Fully restores HP and cures status.", desc_zh: "恢复全部 HP，并解除异常状态。"},
  freshwater: {name: "Fresh Water", name_zh: "美味之水", desc: "Restores 30 HP.", desc_zh: "恢复 30 点 HP。"},
  sodapop: {name: "Soda Pop", name_zh: "劲爽汽水", desc: "Restores 50 HP.", desc_zh: "恢复 50 点 HP。"},
  lemonade: {name: "Lemonade", name_zh: "果汁牛奶", desc: "Restores 70 HP.", desc_zh: "恢复 70 点 HP。"},
  moomoomilk: {name: "Moomoo Milk", name_zh: "哞哞鲜奶", desc: "Restores 100 HP.", desc_zh: "恢复 100 点 HP。"},
  revive: {name: "Revive", name_zh: "活力碎片", desc: "Revives a fainted Pokemon with half HP.", desc_zh: "让濒死宝可梦复活，并恢复一半 HP。"},
  maxrevive: {name: "Max Revive", name_zh: "元气药块", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
  revivalherb: {name: "Revival Herb", name_zh: "复活草", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
  energypowder: {name: "Energy Powder", name_zh: "元气粉", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  energyroot: {name: "Energy Root", name_zh: "元气根", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  fullheal: {name: "Full Heal", name_zh: "万灵药", desc: "Cures status conditions.", desc_zh: "解除异常状态。"},
  healpowder: {name: "Heal Powder", name_zh: "万能粉", desc: "Cures status conditions.", desc_zh: "解除异常状态。"},
  antidote: {name: "Antidote", name_zh: "解毒药", desc: "Cures poisoning.", desc_zh: "解除中毒状态。"},
  burnheal: {name: "Burn Heal", name_zh: "灼伤药", desc: "Cures a burn.", desc_zh: "解除灼伤状态。"},
  iceheal: {name: "Ice Heal", name_zh: "解冻药", desc: "Cures freezing.", desc_zh: "解除冰冻状态。"},
  awakening: {name: "Awakening", name_zh: "解眠药", desc: "Cures sleep.", desc_zh: "解除睡眠状态。"},
  paralyzeheal: {name: "Paralyze Heal", name_zh: "解麻药", desc: "Cures paralysis.", desc_zh: "解除麻痹状态。"},
  ether: {name: "Ether", name_zh: "PP 单项小补剂", desc: "Restores 10 PP to one move.", desc_zh: "让 1 个招式恢复 10 点 PP。"},
  maxether: {name: "Max Ether", name_zh: "PP 单项全补剂", desc: "Fully restores PP to one move.", desc_zh: "让 1 个招式恢复全部 PP。"},
  elixir: {name: "Elixir", name_zh: "PP 多项小补剂", desc: "Restores 10 PP to all moves.", desc_zh: "让所有招式恢复 10 点 PP。"},
  maxelixir: {name: "Max Elixir", name_zh: "PP 多项全补剂", desc: "Fully restores PP to all moves.", desc_zh: "让所有招式恢复全部 PP。"},
};

const npcCatalog = loadNpcCatalog();

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

function scaleBpValue(value: unknown, factor: number): number {
  return Math.max(0, Math.floor(Number(value || 0) * factor));
}

function scaleBpRows(rows: unknown, factor: number): number[][] {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => Array.isArray(row) ? row.map(value => scaleBpValue(value, factor)) : []);
}

function migrateRunBpScale(run: CurrentRunData, factor: number): void {
  run.bp_earned_this_run = scaleBpValue(run.bp_earned_this_run, factor);
  run.run_start_bp = scaleBpValue(run.run_start_bp, factor);
  run.temporary_bp_debt = scaleBpValue(run.temporary_bp_debt, factor);
  run.bp_investments = Array.isArray(run.bp_investments) ? run.bp_investments.map(value => scaleBpValue(value, factor)) : run.bp_investments;
  run.move_investments = scaleBpRows(run.move_investments, factor);
  run.shop_offers = (run.shop_offers || []).map(offer => ({...offer, cost: scaleBpValue(offer.cost, factor)}));
  run.starter_item_offers = (run.starter_item_offers || []).map(offer => ({...offer, cost: scaleBpValue(offer.cost, factor)}));
  run.bag_item_meta = Object.fromEntries(Object.entries(run.bag_item_meta || {}).map(([id, meta]) => [id, {...meta, cost: scaleBpValue(meta?.cost, factor)}]));
}

function migrateSaveBpScale(save: LocalSave): void {
  const previousScale = Number(save.bp_scale || 1);
  if (previousScale === BP_SCALE) return;
  const factor = BP_SCALE / Math.max(1, previousScale);
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.stats.battle_points = scaleBpValue(save.stats.battle_points, factor);
  if (save.current_run) migrateRunBpScale(save.current_run, factor);
  save.bp_scale = BP_SCALE;
}

function normalizeSave(save: LocalSave): LocalSave {
  migrateSaveBpScale(save);
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.trainer = normalizeTrainerProfile(save.trainer);
  save.talent_unlocks = Array.from(new Set((save.talent_unlocks || []).filter(id => TALENTS.some(talent => talent.id === id))));
  save.talent_equipped = (save.talent_equipped || []).filter(id => save.talent_unlocks!.includes(id)).slice(0, TALENT_EQUIP_LIMIT);
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

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

function normalizeNpcRow(row: Record<string, string>): TrainerNpcView | null {
  if (row.enabled === "0") return null;
  const type = row.type as TrainerNpcType;
  if (!["player", "normal", "gym", "elite4", "champion", "avatar"].includes(type)) return null;
  return {
    id: row.id,
    type,
    region: row.region || undefined,
    role: row.role || undefined,
    tier: row.tier || undefined,
    name_zh: row.name_zh || row.name_en || row.id,
    name_en: row.name_en || undefined,
    front_asset: row.front_asset || undefined,
    front_gif_asset: row.front_gif_asset || undefined,
    back_asset: row.back_asset || undefined,
    avatar_asset: row.avatar_asset || undefined,
    team_pool_ids: row.team_pool_ids ? row.team_pool_ids.split("|").filter(Boolean) : [],
    notes: row.notes || undefined,
  };
}

function loadNpcCatalog(): TrainerNpcView[] {
  const csvPath = path.join(projectRoot, "data", "npc_trainers.csv");
  if (!existsSync(csvPath)) return [];
  const lines = readFileSync(csvPath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
    return normalizeNpcRow(row);
  }).filter((entry): entry is TrainerNpcView => Boolean(entry));
}

function trainerCatalogState(): TrainerCatalogState {
  return {
    players: npcCatalog.filter(entry => entry.type === "player" && entry.front_asset && entry.back_asset),
    avatars: npcCatalog.filter(entry => entry.type === "avatar" && entry.avatar_asset),
  };
}

function defaultPlayerTrainer(): TrainerNpcView {
  const catalog = trainerCatalogState();
  return catalog.players[0] || {id: "player:default", type: "player", name_zh: "训练师"};
}

function defaultAvatarAssetFor(player: TrainerNpcView): string | undefined {
  return player.avatar_asset || trainerCatalogState().avatars[0]?.avatar_asset;
}

function trainerFromProfile(profile: TrainerProfile): TrainerNpcView {
  const configured = npcCatalog.find(entry => entry.type === "player" && entry.id === profile.player_npc_id);
  const fallback = defaultPlayerTrainer();
  const player = configured || fallback;
  return {
    ...player,
    name_zh: profile.name?.trim() || player.name_zh || "训练师",
    avatar_asset: profile.avatar_asset || player.avatar_asset || defaultAvatarAssetFor(player),
  };
}

function normalizeTrainerProfile(profile?: TrainerProfile): TrainerProfile {
  const fallback = defaultPlayerTrainer();
  const player = npcCatalog.find(entry => entry.type === "player" && entry.id === profile?.player_npc_id) || fallback;
  return {
    name: profile?.name?.trim() || "训练师",
    gender: profile?.gender || "other",
    player_npc_id: player.id,
    front_asset: player.front_asset,
    front_gif_asset: player.front_gif_asset,
    back_asset: player.back_asset,
    avatar_asset: profile?.avatar_asset || player.avatar_asset || defaultAvatarAssetFor(player),
  };
}

function simpleHash(...values: Array<string | number>): number {
  let hash = 2166136261;
  for (const value of values.join(":")) {
    hash ^= value.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickStable<T>(values: T[], ...salt: Array<string | number>): T | undefined {
  if (!values.length) return undefined;
  return values[simpleHash(...salt) % values.length];
}

function trainerPoolForRoute(route: BossRoute): TrainerNpcView[] {
  if (route.type === "normal") return npcCatalog.filter(entry => entry.type === "normal" && entry.front_asset);
  return npcCatalog.filter(entry => {
    if (!entry.front_asset) return false;
    return route.pool.some(pool => entry.type === pool.type && (!pool.tier || entry.tier === pool.tier));
  });
}

function chooseTrainerForRoute(route: BossRoute, run: CurrentRunData, battleNo: number): TrainerNpcView {
  const pool = trainerPoolForRoute(route);
  const fallback = npcCatalog.find(entry => entry.type === "normal" && entry.front_asset) || {id: "normal:default", type: "normal" as const, name_zh: "路人训练师"};
  const selected = pickStable(pool, run.seed || 0, battleNo, route.route) || fallback;
  const teamPool = selected.team_pool_ids?.length ? pickStable(selected.team_pool_ids, run.seed || 0, battleNo, selected.id) : undefined;
  return {...selected, team_pool_id: teamPool};
}

function decorateBattleState(state: BattleState, run?: CurrentRunData | null): BattleState {
  if (!run) return state;
  const playerTalents = run.talents || [];
  return {
    ...state,
    player_trainer: run.player_trainer,
    enemy_trainer: run.enemy_trainer,
    player_talents: playerTalents,
    show_move_effectiveness: hasTalent(playerTalents, "prophet_first_mover"),
  };
}

function recordBattleResult(save: LocalSave, winner: string | null, run?: CurrentRunData): number {
  const stats = {...emptyStats(), ...(save.stats || {})};
  stats.battles = Number(stats.battles || 0) + 1;
  let gained = 0;
  if (winner === "Player") {
    stats.wins = Number(stats.wins || 0) + 1;
    save.stats = stats;
    gained = addRunBp(save, run, WIN_BP_REWARD);
  } else {
    stats.losses = Number(stats.losses || 0) + 1;
    stats.set_win_streak = 0;
    save.stats = stats;
    refreshStats(save);
  }
  return gained;
}

async function refundableBagBaseBp(run: CurrentRunData): Promise<number> {
  normalizeCurrentRun(run);
  const rate = hasTalent(run.talents, "business_refund_70") ? 0.7 : 0.5;
  let total = 0;
  for (const [id, rawCount] of Object.entries(run.bag_items || {})) {
    const count = Math.max(0, Number(rawCount || 0));
    const locked = Math.max(0, Number(run.non_refundable_bag_items?.[itemKey(id)] || 0));
    const refundable = Math.max(0, count - locked);
    if (!refundable) continue;
    const item = await itemDetailsById(id);
    total += Math.max(0, Number(item.cost || 0)) * refundable;
  }
  return Math.floor(total * rate);
}

async function settleRunEnd(save: LocalSave, run: CurrentRunData, options: {refundBag?: boolean; gamblerFailure?: boolean} = {}): Promise<{paidBack: number; refundBase: number; refundGained: number}> {
  if (options.gamblerFailure) {
    save.stats.battle_points = gamblerFailureBp(run);
    refreshStats(save);
    return {paidBack: 0, refundBase: 0, refundGained: 0};
  }
  const paidBack = settleProphetFirstMover(save, run);
  const refundBase = options.refundBag === false ? 0 : await refundableBagBaseBp(run);
  const refundGained = refundBase ? addRunBp(save, run, refundBase) : 0;
  return {paidBack, refundBase, refundGained};
}

function tmItemId(moveId: string | undefined): string {
  return `tm:${toId(moveId)}`;
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

function itemIconAsset(itemId: string, fallback = "assets/placeholders/item.png"): string {
  const normalized = itemKey(itemId);
  if (!normalized) return fallback;
  const iconPath = path.join(projectRoot, "assets", "items", `${normalized}.png`);
  return existsSync(iconPath) ? `assets/items/${normalized}.png` : fallback;
}

function tmIconAsset(): string {
  return "assets/placeholders/move.png";
}

async function loadShopPool(): Promise<ShopPoolEntry[]> {
  if (shopPoolCache) return shopPoolCache;
  const filePath = path.join(projectRoot, "data", "shop_pool.csv");
  const entries: ShopPoolEntry[] = [];
  if (existsSync(filePath)) {
    const raw = await readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue;
      const [idRaw, kindRaw, categoryRaw, costRaw, weightRaw, enabledRaw, notesRaw] = line.split(",");
      const kind = toId(kindRaw) === "tm" ? "tm" : "item";
      const categoryId = toId(categoryRaw);
      const category: ItemCategory = kind === "tm" ? "tm" : categoryId === "consumable" ? "consumable" : "held";
      const id = kind === "tm" && idRaw.trim() === "*" ? "*" : itemKey(idRaw);
      if (!id) continue;
      entries.push({
        id,
        kind,
        category,
        cost: Math.max(0, Number(costRaw || 0)),
        weight: Math.max(0, Number(weightRaw || 1)),
        enabled: String(enabledRaw ?? "1").trim() !== "0",
        notes: notesRaw || "",
      });
    }
  }
  shopPoolCache = entries.filter(entry => entry.enabled && entry.weight > 0);
  return shopPoolCache;
}

function weightedPick<T extends {weight?: number}>(values: T[], rng: () => number): T | null {
  const total = values.reduce((sum, value) => sum + Math.max(0, Number(value.weight || 1)), 0);
  if (total <= 0) return values[0] || null;
  let cursor = rng() * total;
  for (const value of values) {
    cursor -= Math.max(0, Number(value.weight || 1));
    if (cursor <= 0) return value;
  }
  return values[values.length - 1] || null;
}

function shopPoolBucketForEntry(entry: ShopPoolEntry): ShopPoolBucket | null {
  if (entry.kind === "tm") return "tm";
  const id = itemKey(entry.id);
  const text = `${id} ${entry.notes || ""}`.toLowerCase();
  if (id.endsWith("berry") || text.includes("berry")) return "berry";
  if (/ether|elixir/.test(id) || /\bpp\b/.test(text)) return "pp";
  if (entry.category === "consumable") return "healing";
  if (entry.category === "held") return "held";
  return null;
}

function weightedShopBucket<T>(
  buckets: Partial<Record<ShopPoolBucket, T[]>>,
  rng: () => number,
): ShopPoolBucket | null {
  const available = (Object.keys(SHOP_BUCKET_WEIGHTS) as ShopPoolBucket[])
    .filter(bucket => (buckets[bucket] || []).length > 0)
    .map(bucket => ({bucket, weight: SHOP_BUCKET_WEIGHTS[bucket]}));
  return weightedPick(available, rng)?.bucket || null;
}

function seededRng(seed: number, salt = 0): () => number {
  let state = (Number(seed || 1) ^ salt ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffleByRng<T>(values: T[], rng: () => number): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

async function itemDetailsById(itemId: string): Promise<ShopItem> {
  const normalized = itemKey(itemId);
  if (isTmItemId(normalized)) {
    const moveId = normalized.slice(3);
    const cost = await goodsCost("skill", moveId, 2 * BP_SCALE);
    return {id: normalized, name: `TM ${moveId}`, name_zh: `技能机器 ${moveId}`, cost, desc: `Teaches ${moveId}.`, desc_zh: `让宝可梦学会 ${moveId}。`, icon_asset: tmIconAsset()};
  }
  const item = (await gameService.itemOptions()).find(option => itemKey(option.id || option.name) === normalized);
  const localItem = LOCAL_ITEM_DETAILS[normalized];
  const fallbackName = itemId || normalized;
  const cost = await goodsCost("item", normalized, 5 * BP_SCALE);
  const icon_asset = itemIconAsset(normalized);
  return item
    ? {...item, id: normalized, cost, icon_asset}
    : localItem
      ? {id: normalized, ...localItem, cost, icon_asset}
      : {id: normalized, name: fallbackName, name_zh: fallbackName, cost, desc: "", desc_zh: "", icon_asset};
}

async function bagCategories(run: CurrentRunData): Promise<BagCategoryView> {
  const result: BagCategoryView = {consumable: [], held: [], tm: []};
  for (const [id, count] of Object.entries(run.bag_items || {})) {
    if (Number(count || 0) <= 0) continue;
    const item = await itemDetailsById(id);
    const normalized = itemKey(item.id || id);
    const meta = run.bag_item_meta?.[normalized];
    const displayItem = {
      ...item,
      name: meta?.name || item.name,
      name_zh: meta?.name_zh || item.name_zh,
      desc: meta?.desc || item.desc,
      desc_zh: meta?.desc_zh || item.desc_zh,
      icon_asset: meta?.icon_asset || item.icon_asset,
    };
    let category = (meta?.category as ItemCategory | undefined) || itemCategory(item);
    if (category === "consumable" && !(await gameService.hasConsumableItemEffect(normalized))) category = "held";
    const sellPrice = sellPriceForItem(item, run);
    const moveId = isTmItemId(normalized) ? normalized.slice(3) : undefined;
    result[category].push({
      ...displayItem,
      id: normalized,
      count: Number(count),
      category,
      icon_asset: displayItem.icon_asset,
      sell_price: sellPrice,
      move_id: meta?.move_id || moveId,
      move_name: meta?.move_name || moveId,
      move_name_zh: meta?.move_name_zh || (moveId ? displayItem.name_zh.replace(/^技能机器\s*/, "") : undefined),
    });
  }
  return result;
}

function rememberBagItemMeta(run: CurrentRunData, offer: Partial<ShopOffer> | ShopItem): void {
  const id = itemKey(offer.id || offer.name);
  if (!id) return;
  const categorySource = {
    id,
    name: offer.name || id,
    desc: offer.desc || "",
    desc_zh: offer.desc_zh || "",
  };
  run.bag_item_meta = {
    ...(run.bag_item_meta || {}),
    [id]: {
      id,
      name: offer.name,
      name_zh: offer.name_zh,
      desc: offer.desc,
      desc_zh: offer.desc_zh,
      icon_asset: (offer as Partial<ShopOffer>).icon_asset,
      category: (offer as Partial<ShopOffer>).category || itemCategory(categorySource),
      move_id: (offer as Partial<ShopOffer>).move_id,
      move_name: (offer as Partial<ShopOffer>).move_name,
      move_name_zh: (offer as Partial<ShopOffer>).move_name_zh,
    },
  };
}

async function tmOfferFromMove(move: MoveSummary, index: number, source: "shop" | "starter", discount = 1, talents: TalentView[] = []): Promise<ShopOffer> {
  const moveId = toId(move.id || move.name);
  const baseCost = Math.floor((await moveGoodsCost(move)) * discount);
  const base = {
    id: tmItemId(moveId),
    name: `TM ${move.name || moveId}`,
    name_zh: `技能机器 ${move.name_zh || move.name || moveId}`,
    cost: baseCost,
    desc: `Teaches ${move.name || moveId}.`,
    desc_zh: `让宝可梦学会 ${move.name_zh || move.name || moveId}。`,
  };
  return {
    ...base,
    cost: pricedForShop(base, talents),
    offer_id: `${source}-tm-${index}-${moveId}`,
    category: "tm",
    icon_asset: tmIconAsset(),
    discount,
    source,
    move_id: moveId,
    move_name: move.name || moveId,
    move_name_zh: move.name_zh || move.name || moveId,
  };
}

async function tmOptionsForRun(run: CurrentRunData, source: "shop" | "starter", limit = 24): Promise<ShopOffer[]> {
  const seen = new Set<string>();
  const moves: MoveSummary[] = [];
  for (const rawSet of run.player_team || []) {
    for (const move of await gameService.learnableMoves(rawSet)) {
      const moveId = toId(move.id || move.name);
      if (!moveId || seen.has(moveId)) continue;
      seen.add(moveId);
      moves.push(move);
    }
  }
  const rng = seededRng(Number(run.seed || 1), 0x7a11 + Number(run.battle_no || run.next_battle || 0));
  return Promise.all(shuffleByRng(moves, rng).slice(0, limit).map((move, index) => tmOfferFromMove(move, index, source, 1, run.talents || [])));
}

async function starterTmOptions(runSeed: number, talents: TalentView[] = [], limit = 24): Promise<ShopOffer[]> {
  const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(runSeed, 77), "gen7randombattle", 6);
  const seen = new Set<string>();
  const moves: MoveSummary[] = [];
  for (const pokemon of generated.display || []) {
    for (const move of pokemon.moves || []) {
      const moveId = toId(move.id || move.name);
      if (!moveId || seen.has(moveId)) continue;
      seen.add(moveId);
      moves.push(move);
    }
  }
  const rng = seededRng(runSeed, 0x5a77);
  return Promise.all(shuffleByRng(moves, rng).slice(0, limit).map((move, index) => tmOfferFromMove(move, index, "starter", 1, talents)));
}

async function shopOfferFromPoolEntry(entry: ShopPoolEntry, index: number, talents: TalentView[]): Promise<ShopOffer | null> {
  const item = (await gameService.itemOptions()).find(option => itemKey(option.id || option.name) === entry.id);
  const localItem = LOCAL_ITEM_DETAILS[entry.id];
  if (!item && !localItem) return null;
  const detail = item || {id: entry.id, ...localItem, cost: entry.cost || 5 * BP_SCALE, icon_asset: itemIconAsset(entry.id)};
  const base = {...detail, id: entry.id, cost: entry.cost || detail.cost || 5 * BP_SCALE, icon_asset: itemIconAsset(entry.id)};
  return {
    ...detail,
    id: entry.id,
    cost: pricedForShop(base, talents),
    icon_asset: itemIconAsset(entry.id),
    offer_id: `shop-pool-${index}-${entry.id}`,
    category: entry.category,
    source: "shop",
  };
}

async function guaranteedShopOffer(index: number, run: CurrentRunData, rng: () => number): Promise<ShopOffer | null> {
  const guaranteed = GUARANTEED_SHOP_ITEMS[Math.floor(rng() * GUARANTEED_SHOP_ITEMS.length)] || GUARANTEED_SHOP_ITEMS[0];
  const entry: ShopPoolEntry = {id: guaranteed.id, kind: "item", category: "consumable", cost: guaranteed.cost, weight: 1, enabled: true, notes: "guaranteed recovery"};
  const offer = await shopOfferFromPoolEntry(entry, index, run.talents || []);
  return offer ? {...offer, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-guaranteed-${guaranteed.id}`} : null;
}

async function rollShopOffers(run: CurrentRunData): Promise<ShopOffer[]> {
  const pool = await loadShopPool();
  const itemEntries = pool.filter(entry => entry.kind === "item");
  const tmEnabled = pool.some(entry => entry.kind === "tm" && entry.id === "*");
  const itemOffers = (await Promise.all(itemEntries.map((entry, index) => shopOfferFromPoolEntry(entry, index, run.talents || []))))
    .filter((item): item is ShopOffer => Boolean(item))
    .map((item, index) => {
      const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(item.id || item.name));
      return {...item, offer_id: `shop-item-${index}-${itemKey(item.id || item.name)}`, weight: entry?.weight || 1};
    });
  const tmOffers = tmEnabled ? (await tmOptionsForRun(run, "shop")).map(offer => ({...offer, weight: 1})) : [];
  const buckets: Partial<Record<ShopPoolBucket, Array<ShopOffer & {weight?: number}>>> = {
    healing: [],
    held: [],
    pp: [],
    berry: [],
    tm: tmOffers,
  };
  for (const offer of itemOffers) {
    const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(offer.id || offer.name));
    const bucket = entry ? shopPoolBucketForEntry(entry) : null;
    if (bucket && bucket !== "tm") buckets[bucket]?.push(offer);
  }
  const rng = seededRng(Number(run.seed || 1), 0x5100 + Number(run.shop_roll_count || 0) * 97 + Number(run.battle_no || run.next_battle || 0));
  const count = shopOfferCount(run);
  const result: ShopOffer[] = [];
  for (let index = 0; index < count; index += 1) {
    const bucket = weightedShopBucket(buckets, rng);
    const selected = bucket ? weightedPick(buckets[bucket] || [], rng) : null;
    if (!selected) break;
    const {weight: _weight, ...offer} = selected as ShopOffer & {weight?: number};
    result.push({...offer, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-${itemKey(offer.id || offer.name)}`});
  }
  const hasGuaranteed = result.some(offer => GUARANTEED_SHOP_ITEMS.some(item => item.id === itemKey(offer.id || offer.name)));
  if (!hasGuaranteed) {
    const guaranteed = await guaranteedShopOffer(0, run, rng);
    if (guaranteed) {
      if (result.length) result[0] = guaranteed;
      else result.push(guaranteed);
    }
  }
  return result;
}

async function starterItemOffers(runSeed: number, talents: TalentView[] = []): Promise<ShopOffer[]> {
  const pool = await loadShopPool();
  const itemEntries = pool.filter(entry => entry.kind === "item");
  const itemOptions = await gameService.itemOptions();
  const baseItems: Array<ShopOffer & {weight?: number}> = [];
  itemEntries.forEach((entry, index) => {
    const item = itemOptions.find(option => itemKey(option.id || option.name) === entry.id);
    const localItem = LOCAL_ITEM_DETAILS[entry.id];
    if (!item && !localItem) return;
    const detail = item || {id: entry.id, ...localItem, cost: entry.cost || 5 * BP_SCALE};
    baseItems.push({...detail, id: entry.id, cost: entry.cost || detail.cost || 5 * BP_SCALE, category: entry.category, icon_asset: itemIconAsset(entry.id), offer_id: `starter-pool-${index}-${entry.id}`, source: "starter", weight: entry.weight || 1});
  });
  const tmEnabled = pool.some(entry => entry.kind === "tm" && entry.id === "*");
  const tmOffers = tmEnabled ? (await starterTmOptions(runSeed, talents)).map(offer => ({...offer, weight: 1})) : [];
  const buckets: Partial<Record<ShopPoolBucket, Array<ShopOffer & {weight?: number}>>> = {
    healing: [],
    held: [],
    pp: [],
    berry: [],
    tm: tmOffers,
  };
  for (const offer of baseItems) {
    const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(offer.id || offer.name));
    const bucket = entry ? shopPoolBucketForEntry(entry) : null;
    if (bucket && bucket !== "tm") buckets[bucket]?.push(offer);
  }
  const rng = seededRng(runSeed, 0x57a27);
  const selected: ShopOffer[] = [];
  const used = new Set<string>();
  while (selected.length < STARTER_ITEM_OFFER_COUNT) {
    const bucket = weightedShopBucket(buckets, rng);
    const poolForBucket = bucket ? (buckets[bucket] || []).filter(offer => !used.has(itemKey(offer.id || offer.name))) : [];
    if (poolForBucket.length <= 0) {
      const fallback = (Object.values(buckets).flat() as Array<ShopOffer & {weight?: number}>).filter(offer => !used.has(itemKey(offer.id || offer.name)));
      const picked = weightedPick(fallback, rng);
      if (!picked) break;
      const {weight: _weight, ...offer} = picked;
      used.add(itemKey(offer.id || offer.name));
      selected.push(offer);
      continue;
    }
    const picked = weightedPick(poolForBucket, rng);
    if (!picked) break;
    const {weight: _weight, ...offer} = picked;
    used.add(itemKey(offer.id || offer.name));
    selected.push(offer);
  }
  return selected.map((item, index) => {
    const discount = index === 0 ? 0.7 : index === 1 ? 0.5 : index === 2 ? 0.3 : 1;
    const discountedCost = Math.floor(Number(item.cost || 5 * BP_SCALE) * discount);
    const baseOffer = {...item, cost: discountedCost};
    const category = itemCategory(item);
    return {
      ...item,
      cost: pricedForShop(baseOffer, talents),
      offer_id: `starter-${index}-${itemKey(item.id || item.name)}`,
      category,
      discount,
      source: "starter",
    };
  });
}

function routeBossForBattle(setStreak: number, battleNo: number): BossRoute {
  if (battleNo === 3) {
    if (setStreak <= 0) return {type: "gym", stage: "tier1", route: "battle3:gym:tier1", pool: [{type: "gym", tier: "tier1"}]};
    if (setStreak === 1) return {type: "gym", stage: "tier2", route: "battle3:gym:tier2", pool: [{type: "gym", tier: "tier2"}]};
    return {type: "gym", stage: "tier3_or_elite4", route: "battle3:gym-tier3-or-elite4", pool: [{type: "gym", tier: "tier3"}, {type: "elite4", tier: "elite4"}]};
  }
  if (battleNo === 7) {
    if (setStreak <= 0) return {type: "gym", stage: "tier2", route: "battle7:gym:tier2", pool: [{type: "gym", tier: "tier2"}]};
    if (setStreak === 1) return {type: "gym", stage: "tier3_or_elite4", route: "battle7:gym-tier3-or-elite4", pool: [{type: "gym", tier: "tier3"}, {type: "elite4", tier: "elite4"}]};
    return {type: "champion", stage: "champion", route: "battle7:champion", pool: [{type: "champion", tier: "champion"}]};
  }
  return {type: "normal", stage: "normal", route: "normal", pool: [{type: "normal"}]};
}

function starterProfilesForStreak(setStreak: number, count: number): GenerationProfile[] {
  const base: GenerationProfile[] = setStreak <= 0
    ? ["tier1", "tier1", "tier1", "tier1", "tier2", "tier2"]
    : setStreak === 1
      ? ["tier1", "tier1", "tier1", "tier2", "tier2", "tier3"]
      : ["tier1", "tier2", "tier2", "tier3", "tier3", "tier3"];
  return Array.from({length: Math.max(1, count)}, (_value, index) => base[index % base.length]);
}

function profilesForRoute(route: BossRoute): GenerationProfile[] {
  if (route.type === "champion") return ["champion", "champion", "champion"];
  if (route.type === "elite4" || route.stage.includes("tier3")) return ["tier3", "tier4", "tier4"];
  if (route.stage === "tier2") return ["tier2", "tier3", "tier3"];
  if (route.stage === "tier1") return ["tier1", "tier2", "tier2"];
  return ["tier1", "tier1", "tier2"];
}

function normalEnemyProfilesForRoute(route: BossRoute): GenerationProfile[] {
  if (route.type !== "normal") return profilesForRoute(route);
  if (route.stage === "before_tier2") return ["tier2", "tier2", "tier3"];
  if (route.stage === "before_tier3") return ["tier3", "tier3", "tier4"];
  return ["tier1", "tier1", "tier2"];
}

function normalEnemyProfilesForBattle(setStreak: number, battleNo: number): GenerationProfile[] {
  const nextBoss = routeBossForBattle(setStreak, battleNo < 3 ? 3 : 7);
  if (nextBoss.type === "champion" || nextBoss.stage.includes("tier3")) return ["tier3", "tier3", "tier4"];
  if (nextBoss.stage === "tier2") return ["tier2", "tier2", "tier3"];
  return ["tier1", "tier1", "tier2"];
}

function loadBossTeamPools(): BossTeamPoolRow[] {
  if (bossTeamPoolCache) return bossTeamPoolCache;
  const csvPath = path.join(projectRoot, "data", "boss_team_pools.csv");
  if (!existsSync(csvPath)) {
    bossTeamPoolCache = [];
    return bossTeamPoolCache;
  }
  const lines = readFileSync(csvPath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  bossTeamPoolCache = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""])) as Record<string, string>;
    return {
      pool_id: row.pool_id,
      trainer_id: row.trainer_id,
      team_index: Number(row.team_index || 0),
      slot: Number(row.slot || 0),
      species_id: row.species_id,
      generation_profile: (row.generation_profile || "tier1") as GenerationProfile,
    };
  }).filter(row => row.pool_id && row.species_id && row.team_index && row.slot);
  return bossTeamPoolCache;
}

function bossTeamForTrainer(trainer: TrainerNpcView, run: CurrentRunData, battleNo: number): {speciesIds: string[]; profiles: GenerationProfile[]} | null {
  const poolId = trainer.team_pool_id || trainer.team_pool_ids?.[0];
  if (!poolId) return null;
  const rows = loadBossTeamPools().filter(row => row.pool_id === poolId);
  if (!rows.length) return null;
  const teamIndexes = [...new Set(rows.map(row => row.team_index))].sort((a, b) => a - b);
  const teamIndex = pickStable(teamIndexes, run.seed || 0, battleNo, trainer.id, poolId) || teamIndexes[0];
  const selected = rows.filter(row => row.team_index === teamIndex).sort((a, b) => a.slot - b.slot).slice(0, 3);
  if (selected.length < 3) return null;
  return {speciesIds: selected.map(row => row.species_id), profiles: selected.map(row => row.generation_profile)};
}

async function generateOpponentPreview(save: LocalSave, run: CurrentRunData, battleNo: number): Promise<{route: BossRoute; trainer: TrainerNpcView; enemies: RentalPokemon[]; label: string}> {
  const route = routeBossForBattle(Number(save.stats?.set_win_streak || 0), battleNo);
  const routeSalt = route.type === "normal" ? 100 : route.type === "champion" ? 700 : route.stage.includes("tier3") ? 603 : route.stage === "tier2" ? 602 : 601;
  const trainer = chooseTrainerForRoute(route, run, battleNo);
  const bossTeam = route.type === "normal" ? null : bossTeamForTrainer(trainer, run, battleNo);
  const profiles = bossTeam?.profiles || (route.type === "normal" ? normalEnemyProfilesForBattle(Number(save.stats?.set_win_streak || 0), battleNo) : profilesForRoute(route));
  const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), routeSalt + battleNo), "gen7randombattle", profiles.length, {profiles, speciesIds: bossTeam?.speciesIds, purpose: route.type === "normal" ? "normal" : "boss"});
  const label = route.type === "normal" ? "普通 NPC" : route.type === "champion" ? "冠军" : route.type === "elite4" ? "四天王" : `${route.stage.replace("tier", "")}档馆主`;
  return {route, trainer, enemies: generated.display.slice(0, 3), label};
}

function spendText(cost: number): string {
  return Number(cost || 0) <= 0 ? "免费" : `花费 ${Number(cost)}BP`;
}

function defaultMoveCost(power: number | undefined): number {
  const value = Number(power || 0);
  if (value >= 120) return 5 * BP_SCALE;
  if (value > 90) return 4 * BP_SCALE;
  if (value > 60) return 3 * BP_SCALE;
  if (value > 30) return 2 * BP_SCALE;
  return 1 * BP_SCALE;
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

async function consumeBagItem(run: CurrentRunData, itemId: string): Promise<ShopItem> {
  const normalized = itemKey(itemId);
  const count = Number(run.bag_items?.[normalized] || 0);
  if (count <= 0) throw new Error("背包里没有这个道具。");
  const item = await itemDetailsById(normalized);
  if (!(await gameService.hasConsumableItemEffect(normalized))) throw new Error("这个道具不能作为消耗道具使用。");
  run.bag_items = {...(run.bag_items || {}), [normalized]: count - 1};
  if (!run.bag_items[normalized]) {
    delete run.bag_items[normalized];
    if (run.bag_item_meta) delete run.bag_item_meta[normalized];
  }
  const locked = Number(run.non_refundable_bag_items?.[normalized] || 0);
  if (locked > 0) {
    run.non_refundable_bag_items = {...(run.non_refundable_bag_items || {}), [normalized]: locked - 1};
    if (!run.non_refundable_bag_items[normalized]) delete run.non_refundable_bag_items[normalized];
  }
  return item;
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

function shinyPokemon(pokemon: RentalPokemon): RentalPokemon {
  return {...pokemon, shiny: true};
}

function ensureStarterShiny(generated: GeneratedTeam, seed: number): GeneratedTeam {
  if (generated.display.some(pokemon => pokemon.shiny)) return generated;
  const count = Math.max(1, generated.display.length);
  const index = Math.floor(seededRng(seed, 0x51f1e)() * count);
  generated.team[index] = {...generated.team[index], shiny: true};
  generated.display[index] = shinyPokemon(generated.display[index]);
  return generated;
}

function addToExchangeBox(run: CurrentRunData, team: PokemonSet[], display: RentalPokemon[], states?: PlayerPokemonState[]): void {
  if (!hasTalent(run.talents, "exchange_safe_box")) return;
  const box = run.exchange_box || {team: [], display: [], state: []};
  const seen = new Set(box.team.map((pokemon, index) => `${toId(pokemon.species || box.display[index]?.species_id || box.display[index]?.species)}:${index}`));
  for (let index = 0; index < display.length; index += 1) {
    const raw = team[index];
    const shown = display[index];
    if (!raw || !shown) continue;
    const key = `${toId(raw.species || shown.species_id || shown.species)}:${box.team.length + index}`;
    if (seen.has(key)) continue;
    box.team.push(JSON.parse(JSON.stringify(raw)));
    box.display.push(JSON.parse(JSON.stringify(shown)));
    box.state.push(states?.[index] ? JSON.parse(JSON.stringify(states[index])) : fullStateForPokemon(shown, box.state.length + 1));
  }
  run.exchange_box = box;
}

function halfStateForPokemon(pokemon: RentalPokemon, slot: number): PlayerPokemonState {
  return partialStateForPokemon(pokemon, slot, 0.5);
}

function partialStateForPokemon(pokemon: RentalPokemon, slot: number, ratio: number): PlayerPokemonState {
  const state = fullStateForPokemon(pokemon, slot);
  const normalizedRatio = Math.max(0, Math.min(1, Number(ratio || 0)));
  state.hp = normalizedRatio >= 1 ? state.maxhp : Math.max(1, Math.floor(state.maxhp * normalizedRatio));
  state.moves = state.moves.map(move => ({...move, pp: normalizedRatio >= 1 ? move.maxpp : Math.max(1, Math.floor(move.maxpp * normalizedRatio))}));
  return refreshStateCondition(state);
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
  run.bag_items = Object.fromEntries(Object.entries(run.bag_items || {}).map(([id, count]) => [itemKey(id), Math.max(0, Number(count || 0))] as const).filter(([, count]) => count > 0));
  run.reroll_count = Number(run.reroll_count || 0);
  run.shop_roll_count = Number(run.shop_roll_count || 0);
  run.shop_offers = (run.shop_offers || []).map(offer => ({...offer, category: offer.category || itemCategory(offer)}));
  run.shop_purchased_offer_id = run.shop_purchased_offer_id || null;
  run.shop_last_roll_bonus = run.shop_last_roll_bonus || null;
  run.starter_item_offers = (run.starter_item_offers || []).map(offer => ({...offer, category: offer.category || itemCategory(offer), source: "starter"}));
  run.starter_item_purchased = run.starter_item_purchased || [];
  run.non_refundable_bag_items = Object.fromEntries(Object.entries(run.non_refundable_bag_items || {}).map(([id, count]) => [itemKey(id), Math.max(0, Number(count || 0))] as const).filter(([, count]) => count > 0));
  run.bag_item_meta = Object.fromEntries(Object.entries(run.bag_item_meta || {}).map(([id, meta]) => [itemKey(id), {...meta, id: itemKey(meta?.id || id)}] as const));
  run.talents = run.talents || [];
  run.temporary_bp_debt = Math.max(0, Number(run.temporary_bp_debt || 0));
  run.second_team_roar_used = Boolean(run.second_team_roar_used);
  run.all_in_exchange_used = Boolean(run.all_in_exchange_used);
  run.exchange_box = {
    team: (run.exchange_box?.team || []).filter(Boolean),
    display: (run.exchange_box?.display || []).filter(Boolean),
    state: (run.exchange_box?.state || []).filter(Boolean),
  };
  run.rest_status = {
    exchanges: Number(run.rest_status?.exchanges || 0),
    taken_enemy_slots: (run.rest_status?.taken_enemy_slots || []).map(Number).filter(slot => slot >= 1 && slot <= 3),
    free_shop_roll_used: Boolean(run.rest_status?.free_shop_roll_used),
    free_scout_used: Boolean(run.rest_status?.free_scout_used),
    restore_hp_used: Boolean(run.rest_status?.restore_hp_used),
    restore_pp_used: Boolean(run.rest_status?.restore_pp_used),
    restore_status_used: Boolean(run.rest_status?.restore_status_used),
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

async function restState(save: LocalSave, run: CurrentRunData, message?: string): Promise<DesktopGameState> {
  normalizeCurrentRun(run);
  const exchangeCount = Number(run.rest_status?.exchanges || 0);
  const restExchangeCost = exchangeCount >= 3 ? null : exchangeCost(run, exchangeCount);
  const rest: RestState = {
    battle_no: Number(run.battle_no || Math.max(1, Number(run.next_battle || 1) - 1)),
    battles: Number(run.battles || DEFAULT_BATTLES),
    wins: Number(run.wins || 0),
    battle_points: currentBp(save),
    player_display: run.player_display || [],
    enemy_display: run.enemy_display || [],
    player_state: normalizePlayerState(run),
    bag_items: run.bag_items || {},
    bag_categories: await bagCategories(run),
    talents: run.talents || [],
    shop: {
      roll_count: Number(run.shop_roll_count || 0),
      next_roll_cost: shopNextRollCost(run),
      slot_count: shopOfferCount(run),
      offers: run.shop_offers || [],
      purchased_offer_id: run.shop_purchased_offer_id || null,
      last_roll_bonus: run.shop_last_roll_bonus || null,
    },
    starter_items: {
      offers: run.starter_item_offers || [],
      purchased: run.starter_item_purchased || [],
      max_purchases: starterPurchaseLimit(run.talents),
    },
    move_draws: run.move_draws || {},
    scout: run.scout,
    review: run.review,
    future_boss: run.future_boss,
    free_scout_used: Boolean(run.rest_status?.free_scout_used),
    free_shop_roll_used: Boolean(run.rest_status?.free_shop_roll_used),
    restore_hp_used: Boolean(run.rest_status?.restore_hp_used),
    restore_pp_used: Boolean(run.rest_status?.restore_pp_used),
    restore_status_used: Boolean(run.rest_status?.restore_status_used),
    exchange_box: run.exchange_box?.display || [],
    all_in_used: Boolean(run.all_in_exchange_used),
    taken_enemy_slots: run.rest_status?.taken_enemy_slots || [],
    exchange_count: exchangeCount,
    costs: {
      exchange: restExchangeCost,
      restore_hp: REST_HP_COSTS,
      restore_pp: REST_PP_COSTS,
      restore_status: REST_STATUS_COSTS,
      adjust_stats: ADJUST_STATS_COST,
      randomize_part: RANDOMIZE_PART_COST,
      randomize_all: RANDOMIZE_ALL_COST,
      move_draw: moveDrawCost(run),
      direct_move: DIRECT_MOVE_COST,
      scout_basic: SCOUT_BASIC_COST,
      scout_one: SCOUT_ONE_COST,
      scout_all: SCOUT_ALL_COST,
      review_previous: REVIEW_PREVIOUS_COST,
    },
  };
  return gameState({screen: "rest", save, rest, message});
}

async function prepareCandidates(seed?: number): Promise<DesktopGameState> {
  const save = await loadSave();
  const runSeed = seed || Math.floor(Math.random() * 0xffffffff);
  const count = candidateCountForTalents(talentsForIds(save?.talent_equipped).slice(0, TALENT_EQUIP_LIMIT));
  pendingCandidates = ensureStarterShiny(await gameService.generateRentalCandidates(gameService.deriveSeed(runSeed, 1), "gen7randombattle", count, {profiles: starterProfilesForStreak(Number(save?.stats?.set_win_streak || 0), count), purpose: "starter"}), runSeed);
  return gameState({screen: "rentalSelect", save, candidates: pendingCandidates, selected_indexes: [], message: `随机种子：${runSeed}`});
}

async function prepareStarterItems(seed?: number): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const runSeed = seed || Math.floor(Math.random() * 0xffffffff);
  const talents: TalentView[] = talentsForIds(save.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  configuredTalents = talents;
  const offers = await starterItemOffers(runSeed, talents);
  pendingStarter = {seed: runSeed, offers, purchased: [], talents};
  pendingCandidates = null;
  return gameState({screen: "starterItems", save, starter: {seed: runSeed, offers, purchased: null, purchased_list: [], max_purchases: starterPurchaseLimit(talents)}, message: "选择一个开局道具，或跳过。"});
}

async function talentConfig(): Promise<TalentConfigState> {
  const save = await loadSave();
  const unlocked = talentsForIds(save?.talent_unlocks);
  const equipped = talentsForIds(save?.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  configuredTalents = equipped;
  return {catalog: TALENTS, unlocked, equipped, save};
}

async function unlockTalent(id: string): Promise<TalentConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const talent = TALENTS.find(entry => entry.id === id);
  if (!talent) throw new Error("天赋不存在。");
  save.talent_unlocks = save.talent_unlocks || [];
  if (!save.talent_unlocks.includes(id)) {
    spendBp(save, Number(talent.cost || 0));
    save.talent_unlocks.push(id);
  }
  const next = await persist(save);
  const unlocked = talentsForIds(next.talent_unlocks);
  const equipped = talentsForIds(next.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  configuredTalents = equipped;
  return {catalog: TALENTS, unlocked, equipped, save: next};
}

async function configureTalents(ids: string[]): Promise<TalentConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const unlocked = new Set(save.talent_unlocks || []);
  const wanted = (ids || []).filter(id => unlocked.has(id)).slice(0, TALENT_EQUIP_LIMIT);
  save.talent_equipped = wanted;
  const next = await persist(save);
  const equipped = talentsForIds(next.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  configuredTalents = equipped;
  return {catalog: TALENTS, unlocked: talentsForIds(next.talent_unlocks), equipped, save: next};
}

async function chooseStarterItem(offerId: string | null): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  if (!pendingStarter) {
    const seed = Math.floor(Math.random() * 0xffffffff);
    const talents: TalentView[] = [];
    pendingStarter = {seed, offers: await starterItemOffers(seed, talents), purchased: [], talents};
  }
  if (offerId === "__reroll__") {
    if (pendingStarter.purchased.length) throw new Error("已购买开局道具后不能重新随机。");
    spendBp(save, STARTER_ITEM_REROLL_COST);
    const nextSeed = Math.floor(Math.random() * 0xffffffff);
    pendingStarter = {...pendingStarter, seed: nextSeed, offers: await starterItemOffers(nextSeed, pendingStarter.talents), purchased: []};
    pendingCandidates = null;
    const nextSave = await persist(save);
    return gameState({
      screen: "starterItems",
      save: nextSave,
      starter: {seed: pendingStarter.seed, offers: pendingStarter.offers, purchased: null, purchased_list: [], max_purchases: starterPurchaseLimit(pendingStarter.talents)},
      message: `已重新随机开局道具，花费 ${STARTER_ITEM_REROLL_COST}BP。`,
    });
  }
  if (offerId) {
    const offer = pendingStarter.offers.find(item => item.offer_id === offerId);
    if (!offer) throw new Error("开局道具不存在。");
    if (pendingStarter.purchased.some(item => item.offer_id === offer.offer_id)) throw new Error("这个开局道具已经购买过了。");
    const limit = starterPurchaseLimit(pendingStarter.talents);
    if (pendingStarter.purchased.length >= limit) throw new Error(`本局最多选择 ${limit} 个开局道具。`);
    spendBp(save, Number(offer.cost || 0));
    pendingStarter.purchased.push(offer);
    await persist(save);
    const nextSave = await loadSave();
    if (pendingStarter.purchased.length < starterPurchaseLimit(pendingStarter.talents)) {
      return gameState({
        screen: "starterItems",
        save: nextSave,
        starter: {seed: pendingStarter.seed, offers: pendingStarter.offers, purchased: pendingStarter.purchased[pendingStarter.purchased.length - 1] || null, purchased_list: pendingStarter.purchased, max_purchases: starterPurchaseLimit(pendingStarter.talents)},
        message: `已购买 ${offer.name_zh || offer.name}。还可以继续购买，或点击跳过进入选队。`,
      });
    }
  }
  const count = candidateCountForTalents(pendingStarter.talents);
  pendingCandidates = ensureStarterShiny(await gameService.generateRentalCandidates(gameService.deriveSeed(pendingStarter.seed, 1), "gen7randombattle", count, {profiles: starterProfilesForStreak(Number(save.stats?.set_win_streak || 0), count), purpose: "starter"}), pendingStarter.seed);
  return gameState({screen: "rentalSelect", save: await loadSave(), starter: {seed: pendingStarter.seed, offers: pendingStarter.offers, purchased: pendingStarter.purchased[pendingStarter.purchased.length - 1] || null, purchased_list: pendingStarter.purchased, max_purchases: starterPurchaseLimit(pendingStarter.talents)}, candidates: pendingCandidates, selected_indexes: [], message: `随机种子：${pendingStarter.seed}`});
}

async function beginChallenge(selectedIndexes: number[], runSeed: number, battles = DEFAULT_BATTLES): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  if (pendingRescue) {
    const run = save.current_run as CurrentRunData | null;
    if (!run) throw new Error("二队触发失败：当前挑战不存在。");
    if (selectedIndexes.length !== 3) throw new Error("需要选择 3 只宝可梦。");
    const playerTeam = selectedIndexes.map(index => pendingRescue!.candidates.team[index]);
    const playerDisplay = selectedIndexes.map(index => pendingRescue!.candidates.display[index]);
    run.player_team = playerTeam;
    run.player_display = playerDisplay;
    run.player_state = playerDisplay.map((pokemon, index) => fullStateForPokemon(pokemon, index + 1));
    run.status = "ready";
    run.next_battle = pendingRescue.battleNo;
    delete run.battle_no;
    delete run.enemy_raw;
    delete run.enemy_display;
    pendingRescue = null;
    const next = await persist(save);
    return startNextBattle(next);
  }
  const effectiveSeed = pendingStarter?.seed || runSeed;
  if (!pendingCandidates) {
    const count = candidateCountForTalents(pendingStarter?.talents || []);
    pendingCandidates = ensureStarterShiny(await gameService.generateRentalCandidates(gameService.deriveSeed(effectiveSeed, 1), "gen7randombattle", count, {profiles: starterProfilesForStreak(Number(save.stats?.set_win_streak || 0), count), purpose: "starter"}), effectiveSeed);
  }
  if (selectedIndexes.length !== 3) throw new Error("需要选择 3 只宝可梦。");
  const playerTeam = selectedIndexes.map(index => pendingCandidates!.team[index]);
  const playerDisplay = selectedIndexes.map(index => pendingCandidates!.display[index]);
  const starterItemIds = (pendingStarter?.purchased || []).map(item => itemKey(item.id || item.name)).filter(Boolean);
  const starterBagItems = Object.fromEntries(starterItemIds.map(id => [id, starterItemIds.filter(value => value === id).length]));
  const starterBagMeta = Object.fromEntries((pendingStarter?.purchased || []).map(item => [itemKey(item.id || item.name), {
    id: itemKey(item.id || item.name),
    name: item.name,
    name_zh: item.name_zh,
    desc: item.desc,
    desc_zh: item.desc_zh,
    category: item.category,
    move_id: item.move_id,
    move_name: item.move_name,
    move_name_zh: item.move_name_zh,
  }]));
  const runTalents = pendingStarter?.talents || [];
  const temporaryBp = applyProphetFirstMover(save, runTalents);
  save.current_run = {
    status: "awaiting_rest",
    seed: effectiveSeed,
    battles,
    next_battle: 1,
    battle_no: 0,
    wins: 0,
    reroll_count: 0,
    shop_roll_count: 0,
    shop_offers: [],
    starter_item_offers: pendingStarter?.offers || [],
    starter_item_purchased: (pendingStarter?.purchased || []).map(item => item.offer_id),
    non_refundable_bag_items: starterBagItems,
    bag_item_meta: starterBagMeta,
    talents: runTalents,
    boss_type: "normal",
    boss_stage: "initial",
    boss_route: "initial",
    player_trainer: trainerFromProfile(save.trainer),
    run_start_bp: currentBp(save) - temporaryBp.amount,
    temporary_bp_debt: temporaryBp.amount,
    second_team_roar_used: false,
    all_in_exchange_used: false,
    exchange_box: {team: [], display: [], state: []},
    player_team: playerTeam,
    player_display: playerDisplay,
    player_state: playerDisplay.map((pokemon, index) => fullStateForPokemon(pokemon, index + 1)),
    bp_earned_this_run: 0,
    bp_investments: [0, 0, 0],
    move_investments: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    bag_items: starterBagItems,
    rest_status: {exchanges: 0, taken_enemy_slots: []},
  };
  pendingStarter = null;
  const next = await persist(save);
  return await restState(next, next.current_run as CurrentRunData, "出发前可以先整理队伍。");
}

async function continueRun(): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save?.current_run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  if (save.current_run.status === "awaiting_exchange" || save.current_run.status === "awaiting_rest") return await restState(save, save.current_run);
  return startNextBattle(save);
}

async function startNextBattle(save: LocalSave): Promise<DesktopGameState> {
  const run = save.current_run as CurrentRunData | null;
  if (!run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  normalizeCurrentRun(run);
  const battleNo = Number(run.next_battle || 1);
  if (battleNo > Number(run.battles || DEFAULT_BATTLES)) {
    const settled = await settleRunEnd(save, run);
    const {setStreak, bonus} = clearBonus(save, run);
    save.current_run = null;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: `通关！完成 ${run.wins || run.battles} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}BP${settled.refundGained ? `，背包返还 ${settled.refundGained}BP` : ""}${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}。`});
  }
  const route = routeBossForBattle(Number(save.stats?.set_win_streak || 0), battleNo);
  const enemyTrainer = chooseTrainerForRoute(route, run, battleNo);
  const routeSalt = route.type === "normal" ? 100 : route.type === "champion" ? 700 : route.stage.includes("tier3") ? 603 : route.stage === "tier2" ? 602 : 601;
  const bossTeam = route.type === "normal" ? null : bossTeamForTrainer(enemyTrainer, run, battleNo);
  const profiles = bossTeam?.profiles || (route.type === "normal" ? normalEnemyProfilesForBattle(Number(save.stats?.set_win_streak || 0), battleNo) : profilesForRoute(route));
  const enemyGenerated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), routeSalt + battleNo), "gen7randombattle", profiles.length, {profiles, speciesIds: bossTeam?.speciesIds, purpose: route.type === "normal" ? "normal" : "boss"});
  const enemyTeam = enemyGenerated.team.slice(0, 3);
  const enemyDisplay = enemyGenerated.display.slice(0, 3);
  run.boss_type = enemyTrainer.type === "elite4" ? "elite4" : enemyTrainer.type === "champion" ? "champion" : enemyTrainer.type === "gym" ? "gym" : "normal";
  run.boss_stage = route.stage;
  run.boss_route = route.route;
  run.enemy_team_pool_id = enemyTrainer.team_pool_id;
  run.generation_stage = profiles.join("|");
  run.player_trainer = trainerFromProfile(save.trainer);
  run.enemy_trainer = enemyTrainer;
  run.enemy_raw = enemyTeam;
  run.enemy_display = enemyDisplay;
  activeBattleNo = battleNo;
  activeBattle = await gameService.createBattleSession({
    playerTeam: run.player_team,
    enemyTeam,
    playerDisplay: run.player_display,
    enemyDisplay,
    playerState: normalizePlayerState(run),
    seed: gameService.deriveSeed(Number(run.seed), 200 + battleNo),
  });
  const label = run.boss_type === "normal" ? "普通 NPC" : run.boss_type === "champion" ? "冠军" : run.boss_type === "elite4" ? "四天王" : `${route.stage.startsWith("tier") ? route.stage.replace("tier", "") : "高"}档馆主`;
  return gameState({screen: "battleMain", save, battle: decorateBattleState(activeBattle.getState(), run), battle_bag: await bagCategories(run), message: `第 ${battleNo}/${run.battles} 场：${label} ${enemyTrainer.name_zh}`});
}

async function submitBattleChoice(choice: string): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save?.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
  let state: BattleState;
  let shouldPersist = false;
  if (choice.startsWith("item ")) {
    const [, itemId, slotRaw, moveSlotRaw] = choice.split(/\s+/);
    const run = save.current_run as CurrentRunData;
    const slot = Math.max(0, Number(slotRaw || 1) - 1);
    const states = activeBattle.getPlayerState();
    if (slot < 0 || slot >= states.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const normalizedItem = itemKey(itemId);
    if (Number(run.bag_items?.[normalizedItem] || 0) <= 0) throw new Error("背包里没有这个道具。");
    if (!(await gameService.hasConsumableItemEffect(normalizedItem))) throw new Error("这个道具不能在战斗中主动使用。");
    state = await activeBattle.chooseTrainerItem(normalizedItem, slot, moveSlotRaw ? Number(moveSlotRaw) : undefined);
    await consumeBagItem(run, normalizedItem);
    run.player_state = activeBattle.getPlayerState();
    shouldPersist = true;
  } else {
    state = choice === "forfeit" ? activeBattle.forfeit() : await activeBattle.choose(choice);
  }
  if (!state.ended) {
    const next = shouldPersist ? await persist(save) : save;
    return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, next.current_run as CurrentRunData), battle_bag: await bagCategories(next.current_run as CurrentRunData)});
  }
  const run = save.current_run as CurrentRunData;
  if (state.winner !== "Player" && canSecondTeamRoar(run)) {
    run.player_state = activeBattle.getPlayerState();
    const next = await persist(save);
    const transition = gameState({
      screen: "secondTeamRoar",
      save: next,
      rescue: {cost: SECOND_TEAM_ROAR_COST, battle_no: activeBattleNo, can_pay: currentBp(next) >= SECOND_TEAM_ROAR_COST},
      message: `二队的怒吼可以触发：支付 ${SECOND_TEAM_ROAR_COST}BP 重新选择 3 只宝可梦并重打当前场次。`,
    });
    return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(run), message: "队伍已全灭。是否使用二队的怒吼？", pending_transition: transition});
  }
  const winBp = recordBattleResult(save, state.winner, run);
  run.player_state = activeBattle.getPlayerState();
  if (state.winner !== "Player") {
    const wins = Number(run.wins || 0);
    const settled = await settleRunEnd(save, run, {gamblerFailure: hasTalent(run.talents, "gambler_streak_bp_risk")});
    save.current_run = null;
    const next = await persist(save);
    const lossMessage = hasTalent(run.talents, "gambler_streak_bp_risk") ? `挑战结束。连胜：${wins}。压上杠杆触发，BP 回到本局开始前。` : `挑战结束。连胜：${wins}${settled.refundGained ? `，背包返还 ${settled.refundGained}BP` : ""}${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}`;
    const transition = gameState({screen: "result", save: next, battle: decorateBattleState(state, run), message: lossMessage});
    return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(run), message: lossMessage, pending_transition: transition});
  }
  const wins = Number(run.wins || 0) + 1;
  const gamblerRoll = gamblerStreakRoll(run, activeBattleNo);
  const gainedStreakBonus = gamblerRoll?.extra ? addRunBp(save, run, gamblerRoll.extra) : 0;
  addToExchangeBox(run, state.enemy_team || run.enemy_raw || [], state.enemy_display || run.enemy_display || []);
  if (activeBattleNo >= Number(run.battles || DEFAULT_BATTLES)) {
    run.wins = wins;
    const settled = await settleRunEnd(save, run);
    const {setStreak, bonus} = clearBonus(save, run);
    save.current_run = null;
    const next = await persist(save);
    const message = `通关！完成 ${wins} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}BP${gainedStreakBonus ? `，压上杠杆 ${gamblerRoll?.multiplier.toFixed(1)}倍，额外 ${gainedStreakBonus}BP` : ""}${settled.refundGained ? `，背包返还 ${settled.refundGained}BP` : ""}${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}。`;
    const transition = gameState({screen: "result", save: next, battle: decorateBattleState(state, run), message});
    return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(run), message, pending_transition: transition});
  }
  save.current_run = {
    ...run,
    status: "awaiting_rest",
    battle_no: activeBattleNo,
    wins,
    enemy_raw: state.enemy_team,
    enemy_display: state.enemy_display,
    bp_earned_this_run: Number(run.bp_earned_this_run || 0) + winBp + gainedStreakBonus,
    rest_status: {exchanges: 0, taken_enemy_slots: []},
  };
  const next = await persist(save);
  const rewardText = `本场胜利！获得 ${winBp}BP${gainedStreakBonus ? `，压上杠杆 ${gamblerRoll?.multiplier.toFixed(1)}倍，额外 ${gainedStreakBonus}BP` : ""}。当前连胜：${wins}`;
  const transition = await restState(next, next.current_run as CurrentRunData, rewardText);
  return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(next.current_run as CurrentRunData), message: `本场胜利！当前连胜：${wins}`, pending_transition: transition});
}

async function chooseSecondTeamRoar(useRescue: boolean): Promise<DesktopGameState> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!save || !run || !activeBattle) throw new Error("当前没有可处理的二队救援。");
  const state = activeBattle.getState();
  if (!state.ended || state.winner === "Player" || !canSecondTeamRoar(run)) throw new Error("当前不能触发二队的怒吼。");
  if (useRescue) {
    spendBp(save, SECOND_TEAM_ROAR_COST);
    run.second_team_roar_used = true;
    run.player_state = activeBattle.getPlayerState();
    const count = candidateCountForTalents(run.talents);
    pendingRescue = {
      seed: gameService.deriveSeed(Number(run.seed || Date.now()), 8800 + activeBattleNo),
      battleNo: activeBattleNo,
      candidates: await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed || Date.now()), 8800 + activeBattleNo), "gen7randombattle", count, {profiles: starterProfilesForStreak(Number(save.stats?.set_win_streak || 0), count), purpose: "rescue"}),
    };
    activeBattle = null;
    const next = await persist(save);
    return gameState({
      screen: "rentalSelect",
      save: next,
      candidates: pendingRescue.candidates,
      selected_indexes: [],
      message: `二队的怒吼已发动，损失 ${SECOND_TEAM_ROAR_COST}BP。重新选择 3 只宝可梦，重打当前场次。`,
    });
  }
  const wins = Number(run.wins || 0);
  recordBattleResult(save, state.winner, run);
  run.player_state = activeBattle.getPlayerState();
  const settled = await settleRunEnd(save, run, {gamblerFailure: hasTalent(run.talents, "gambler_streak_bp_risk")});
  save.current_run = null;
  activeBattle = null;
  activeBattleNo = 0;
  const next = await persist(save);
  const lossMessage = hasTalent(run.talents, "gambler_streak_bp_risk")
    ? `挑战结束。连胜：${wins}。压上杠杆触发，BP 回到本局开始前。`
    : `挑战结束。连胜：${wins}${settled.refundGained ? `，背包返还 ${settled.refundGained}BP` : ""}${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}`;
  return gameState({screen: "result", save: next, battle: decorateBattleState(state, run), message: lossMessage});
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
  const battleNo = Number(run.battle_no ?? 0);
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

function randomIvs(rng: () => number): Record<string, number> {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, randomInt(rng, 0, 31)]));
}

function randomEvs(rng: () => number): Record<string, number> {
  const evs = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as Record<string, number>;
  let remaining = 510;
  for (const stat of shuffleByRng([...STAT_IDS], rng)) {
    const value = randomInt(rng, 0, Math.min(255, remaining));
    evs[stat] = value;
    remaining -= value;
  }
  return evs;
}

async function applyRandomizedStats(run: CurrentRunData, slot: number, part: "ability" | "nature" | "ivs" | "evs" | "all"): Promise<void> {
  const rawSet = JSON.parse(JSON.stringify(run.player_team[slot])) as PokemonSet;
  const options = await gameService.editOptions(rawSet);
  const rng = seededRng(Number(run.seed || 1), 0x9000 + Number(run.battle_no || 0) * 31 + slot * 7 + Date.now());
  if (part === "ability" || part === "all") {
    const ability = shuffleByRng(options.abilities, rng)[0];
    if (ability) rawSet.ability = ability.name;
  }
  if (part === "nature" || part === "all") {
    const nature = shuffleByRng(options.natures, rng)[0];
    if (nature) rawSet.nature = nature.name;
  }
  if (part === "ivs" || part === "all") rawSet.ivs = randomIvs(rng);
  if (part === "evs" || part === "all") rawSet.evs = randomEvs(rng);
  validateStatAdjustments(rawSet, options);
  const [nextDisplay] = await gameService.describeTeam([rawSet]);
  const states = normalizePlayerState(run);
  run.player_team[slot] = rawSet;
  run.player_display[slot] = nextDisplay || run.player_display[slot];
  states[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
  run.player_state = states;
}

async function applyMoveToSlot(run: CurrentRunData, slot: number, moveSlot: number, moveId: string): Promise<MoveSummary> {
  if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
  const rawSet = JSON.parse(JSON.stringify(run.player_team[slot])) as PokemonSet;
  const currentMoves = [...(rawSet.moves || [])];
  if (moveSlot < 0 || moveSlot >= currentMoves.length) throw new Error("技能位置无效。");
  const legalMoves = await gameService.learnableMoves(rawSet);
  const selected = legalMoves.find(move => toId(move.id || move.name) === toId(moveId));
  if (!selected) throw new Error("这不是该宝可梦的合法可学招式。");
  const otherMoves = new Set(currentMoves.map((move: string) => toId(move)));
  otherMoves.delete(toId(currentMoves[moveSlot]));
  if (otherMoves.has(toId(selected.id || selected.name))) throw new Error("不能重复学习同一个招式。");
  currentMoves[moveSlot] = selected.name || selected.id;
  rawSet.moves = currentMoves;
  const [nextDisplay] = await gameService.describeTeam([rawSet]);
  const states = normalizePlayerState(run);
  run.player_team[slot] = rawSet;
  run.player_display[slot] = nextDisplay || run.player_display[slot];
  states[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
  run.player_state = states;
  return selected;
}

async function handleRestAction(action: RestAction): Promise<DesktopGameState> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!save || !run || (run.status !== "awaiting_rest" && run.status !== "awaiting_exchange")) throw new Error("当前不在休整阶段。");
  normalizeCurrentRun(run);
  if (action.type === "next") return finishRestForNextBattle(save, run);
  if (action.type === "abort") {
    save.stats = {...emptyStats(), ...(save.stats || {}), set_win_streak: 0};
    const settled = await settleRunEnd(save, run);
    refreshStats(save);
    save.current_run = null;
    activeBattle = null;
    activeBattleNo = 0;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: `本局挑战已中断，当前连胜已归零。历史最高连胜已保留。${settled.refundGained ? `背包返还 ${settled.refundGained}BP。` : ""}${settled.paidBack ? `临时BP扣回 ${settled.paidBack}BP。` : ""}`});
  }

  const states = normalizePlayerState(run);
  if (action.type === "restore_hp" || action.type === "restore_pp" || action.type === "restore_status") {
    const slots = [...new Set(action.slots)].filter(slot => slot >= 1 && slot <= states.length);
    if (!slots.length) throw new Error("请选择要恢复的宝可梦。");
    const slot = slots[0];
    const state = states[slot - 1];
    if (action.type === "restore_hp") {
      if (run.rest_status?.restore_hp_used) throw new Error("本次休整已经使用过恢复 HP。");
      if (state.hp >= state.maxhp && !state.fainted) throw new Error("这只宝可梦不需要恢复 HP。");
      state.hp = state.maxhp;
      state.fainted = false;
      run.rest_status = {...(run.rest_status || {}), restore_hp_used: true};
    } else if (action.type === "restore_pp") {
      if (run.rest_status?.restore_pp_used) throw new Error("本次休整已经使用过恢复 PP。");
      const wantedSlot = Number(action.moveSlot || 0);
      const move = state.moves.find(entry => entry.slot === wantedSlot) || state.moves.find(entry => entry.pp < entry.maxpp);
      if (!move) throw new Error("这只宝可梦不需要恢复 PP。");
      if (move.pp >= move.maxpp) throw new Error("这个技能不需要恢复 PP。");
      move.pp = Math.min(move.maxpp, move.pp + 10);
      run.rest_status = {...(run.rest_status || {}), restore_pp_used: true};
    } else {
      if (run.rest_status?.restore_status_used) throw new Error("本次休整已经使用过恢复异常。");
      if (!state.status) throw new Error("这只宝可梦没有异常状态。");
      state.status = "";
      run.rest_status = {...(run.rest_status || {}), restore_status_used: true};
    }
    refreshStateCondition(state);
    run.player_state = states;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, "已使用本次免费恢复。");
  }

  if (action.type === "use_item") {
    const slot = Number(action.slot);
    if (slot < 0 || slot >= states.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const item = await consumeBagItem(run, action.itemId);
    const text = await gameService.applyConsumableItemEffectToState(item.id, states[slot], action.moveSlot);
    run.player_state = states;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, text);
  }

  if (action.type === "sell_item") {
    const itemId = itemKey(action.itemId);
    const count = Number(run.bag_items?.[itemId] || 0);
    if (count <= 0) throw new Error("背包里没有这个道具。");
    const item = await itemDetailsById(itemId);
    const price = sellPriceForItem(item, run);
    run.bag_items = {...(run.bag_items || {}), [itemId]: count - 1};
    if (!run.bag_items[itemId]) {
      delete run.bag_items[itemId];
      if (run.bag_item_meta) delete run.bag_item_meta[itemId];
    }
    const locked = Number(run.non_refundable_bag_items?.[itemId] || 0);
    if (locked > 0) {
      run.non_refundable_bag_items = {...(run.non_refundable_bag_items || {}), [itemId]: locked - 1};
      if (!run.non_refundable_bag_items[itemId]) delete run.non_refundable_bag_items[itemId];
    }
    const gained = addRunBp(save, run, price);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已出售 ${item.name_zh || item.name}，获得 ${gained}BP。`);
  }

  if (action.type === "exchange") {
    if (!run.enemy_raw || !run.enemy_display) throw new Error("没有可交换的敌方队伍。");
    const own = action.ownIndex + 1;
    const foe = action.enemyIndex + 1;
    if (own < 1 || own > 3 || foe < 1 || foe > 3) throw new Error("交换编号需要在 1-3 之间。");
    const restStatus = run.rest_status || {exchanges: 0, taken_enemy_slots: []};
    const exchanges = Number(restStatus.exchanges || 0);
    if (!canExchangeBoss(run, exchanges)) throw new Error(run.boss_type === "champion" ? "冠军的宝可梦暂时不能交换。" : "馆主/四天王宝可梦默认只能交换 1 只；携带馆主认可后可继续交换。");
    if (exchanges >= 3) throw new Error("本次休整最多交换 3 只。");
    if ((restStatus.taken_enemy_slots || []).includes(foe)) throw new Error("这只敌方宝可梦已经被交换过了。");
    const cost = exchangeCost(run, exchanges);
    spendBp(save, cost);
    const investments = run.bp_investments || [0, 0, 0];
    const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    const oldItem = itemKey(run.player_display[action.ownIndex]?.item_id || run.player_team[action.ownIndex]?.item);
    if (oldItem) run.bag_items = {...(run.bag_items || {}), [oldItem]: Number(run.bag_items?.[oldItem] || 0) + 1};
    const keepItem = exchangeKeepsItem(run);
    const oldRaw = JSON.parse(JSON.stringify(run.player_team[action.ownIndex]));
    const oldDisplay = JSON.parse(JSON.stringify(run.player_display[action.ownIndex]));
    const oldState = JSON.parse(JSON.stringify(states[action.ownIndex]));
    const nextRaw = {...run.enemy_raw[action.enemyIndex], item: keepItem ? run.enemy_raw[action.enemyIndex].item : ""};
    const nextDisplayBase = keepItem ? {...run.enemy_display[action.enemyIndex]} : {...run.enemy_display[action.enemyIndex], item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
    run.player_team[action.ownIndex] = hasTalent(run.talents, "business_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
    run.player_display[action.ownIndex] = hasTalent(run.talents, "business_shiny_collector") ? shinyPokemon(nextDisplayBase) : nextDisplayBase;
    run.player_state = normalizePlayerState(run);
    const ratio = exchangeStateRatio(run);
    run.player_state[action.ownIndex] = partialStateForPokemon(run.player_display[action.ownIndex], own, ratio);
    addToExchangeBox(run, [oldRaw], [oldDisplay], [oldState]);
    investments[action.ownIndex] = 0;
    moveInvestments[action.ownIndex] = [0, 0, 0, 0];
    run.bp_investments = investments;
    run.move_investments = moveInvestments;
    run.rest_status = {...restStatus, exchanges: exchanges + 1, taken_enemy_slots: [...(restStatus.taken_enemy_slots || []), foe]};
    const next = await persist(save);
    const stateText = ratio >= 1 ? "满 HP/满 PP" : ratio >= 0.75 ? "3/4 HP/3/4 PP" : "半 HP/半 PP";
    const itemText = keepItem ? "保留目标携带道具" : "不携带道具";
    return await restState(next, next.current_run as CurrentRunData, `已交换，${spendText(cost)}。新宝可梦以${stateText}加入，且${itemText}。`);
  }

  if (action.type === "box_exchange") {
    if (!hasTalent(run.talents, "exchange_safe_box")) throw new Error("需要天赋「无损交易」。");
    const own = Number(action.ownIndex);
    const boxIndex = Number(action.boxIndex);
    const box = run.exchange_box || {team: [], display: [], state: []};
    if (own < 0 || own >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    if (boxIndex < 0 || boxIndex >= box.display.length) throw new Error("盒子里没有这只宝可梦。");
    const currentRaw = JSON.parse(JSON.stringify(run.player_team[own]));
    const currentDisplay = JSON.parse(JSON.stringify(run.player_display[own]));
    const currentState = JSON.parse(JSON.stringify(states[own]));
    const boxedRaw = JSON.parse(JSON.stringify(box.team[boxIndex]));
    const boxedDisplay = JSON.parse(JSON.stringify(box.display[boxIndex]));
    run.player_team[own] = hasTalent(run.talents, "business_shiny_collector") ? {...boxedRaw, shiny: true} : boxedRaw;
    run.player_display[own] = hasTalent(run.talents, "business_shiny_collector") ? shinyPokemon(boxedDisplay) : boxedDisplay;
    run.player_state = normalizePlayerState(run);
    run.player_state[own] = refreshStateCondition({...fullStateForPokemon(run.player_display[own], own + 1), ...(box.state[boxIndex] || {})});
    run.player_state[own].slot = own + 1;
    box.team[boxIndex] = currentRaw;
    box.display[boxIndex] = currentDisplay;
    box.state[boxIndex] = currentState;
    run.exchange_box = box;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已从无损交易盒换回 ${run.player_display[own].species_zh || run.player_display[own].species}。`);
  }

  if (action.type === "all_in_exchange") {
    if (!hasTalent(run.talents, "gambler_all_in_exchange")) throw new Error("需要天赋「孤注一掷」。");
    if (run.all_in_exchange_used) throw new Error("本局已经使用过孤注一掷。");
    const own = Number(action.ownIndex);
    if (own < 0 || own >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
    const profiles = normalEnemyProfilesForBattle(Number(save.stats?.set_win_streak || 0), nextBattleNo);
    const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), 0xa111 + nextBattleNo * 17 + own), "gen7randombattle", 1, {profiles: [profiles[profiles.length - 1] || "tier2"], purpose: "normal"});
    const nextRaw = generated.team[0];
    const nextDisplay = generated.display[0];
    if (!nextRaw || !nextDisplay) throw new Error("孤注一掷生成失败。");
    addToExchangeBox(run, [run.player_team[own]], [run.player_display[own]], [states[own]]);
    run.player_team[own] = hasTalent(run.talents, "business_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
    run.player_display[own] = hasTalent(run.talents, "business_shiny_collector") ? shinyPokemon(nextDisplay) : nextDisplay;
    run.player_state = normalizePlayerState(run);
    run.player_state[own] = fullStateForPokemon(run.player_display[own], own + 1);
    for (let index = 0; index < run.player_state.length; index += 1) {
      if (index === own) continue;
      const state = run.player_state[index];
      state.hp = Math.max(1, Math.floor(state.maxhp / 2));
      state.status = "slp";
      refreshStateCondition(state);
    }
    run.all_in_exchange_used = true;
    const next = await persist(save);
    return await finishRestForNextBattle(next, next.current_run as CurrentRunData);
  }

  if (action.type === "buy_item") {
    const itemId = itemKey(action.itemId);
    const cost = await goodsCost("item", itemId, 5 * BP_SCALE);
    spendBp(save, cost);
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    rememberBagItemMeta(run, await itemDetailsById(itemId));
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已购买道具，${spendText(cost)}。`);
  }

  if (action.type === "roll_shop") {
    const cost = shopNextRollCost(run);
    spendBp(save, cost);
    if (hasTalent(run.talents, "gambler_random_cost_1")) {
      run.rest_status = {...(run.rest_status || {}), free_shop_roll_used: true};
    }
    run.shop_roll_count = Number(run.shop_roll_count || 0) + 1;
    run.shop_offers = await rollShopOffers(run);
    run.shop_purchased_offer_id = null;
    run.shop_last_roll_bonus = shopDuplicateBonusForOffers(run.shop_offers || []);
    if (run.shop_last_roll_bonus?.count) {
      const itemId = itemKey(run.shop_last_roll_bonus.item_id);
      run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + run.shop_last_roll_bonus.count};
      const bonusOffer = (run.shop_offers || []).find(offer => itemKey(offer.id || offer.name) === itemId);
      if (bonusOffer) rememberBagItemMeta(run, bonusOffer);
    }
    const next = await persist(save);
    const bonusText = run.shop_last_roll_bonus?.count ? `抽到 ${run.shop_last_roll_bonus.match_count} 连，免费获得 ${run.shop_last_roll_bonus.count} 个 ${run.shop_last_roll_bonus.name_zh || run.shop_last_roll_bonus.name}！` : "商店抽奖完成。";
    return await restState(next, next.current_run as CurrentRunData, `${bonusText}${cost ? ` ${spendText(cost)}。` : ""}`);
  }

  if (action.type === "buy_shop_offer") {
    if (run.shop_purchased_offer_id) throw new Error("本次抽奖已经购买过商品，请重新抽奖。");
    const offer = (run.shop_offers || []).find(item => item.offer_id === action.offerId);
    if (!offer) throw new Error("商品不存在，请先刷新商店。");
    const itemId = itemKey(offer.id || offer.name);
    spendBp(save, Number(offer.cost || 0));
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    rememberBagItemMeta(run, offer);
    run.shop_purchased_offer_id = offer.offer_id;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已购买 ${offer.name_zh || offer.name}，${spendText(offer.cost)}。`);
  }

  if (action.type === "use_tm") {
    const itemId = itemKey(action.itemId);
    if (!isTmItemId(itemId)) throw new Error("请选择技能机器。");
    const count = Number(run.bag_items?.[itemId] || 0);
    if (count <= 0) throw new Error("背包里没有这个技能机器。");
    const moveId = itemId.slice(3);
    await applyMoveToSlot(run, action.slot, action.moveSlot, moveId);
    run.bag_items = {...(run.bag_items || {}), [itemId]: count - 1};
    if (!run.bag_items[itemId]) {
      delete run.bag_items[itemId];
      if (run.bag_item_meta) delete run.bag_item_meta[itemId];
    }
    const locked = Number(run.non_refundable_bag_items?.[itemId] || 0);
    if (locked > 0) {
      run.non_refundable_bag_items = {...(run.non_refundable_bag_items || {}), [itemId]: locked - 1};
      if (!run.non_refundable_bag_items[itemId]) delete run.non_refundable_bag_items[itemId];
    }
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, "已使用技能机器。");
  }

  if (action.type === "draw_moves") {
    const slot = action.slot;
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const cost = moveDrawCost(run);
    spendBp(save, cost);
    const rawSet = run.player_team[slot];
    const currentMoves = new Set((rawSet.moves || []).map((move: string) => toId(move)));
    const legalMoves = (await gameService.learnableMoves(rawSet)).filter(move => !currentMoves.has(toId(move.id || move.name)));
    const rng = seededRng(Number(run.seed || 1), 0x7100 + slot * 17 + action.moveSlot * 101 + Number(run.battle_no || 0));
    const draws = shuffleByRng(legalMoves, rng).slice(0, moveDrawCount(run));
    run.move_draws = {...(run.move_draws || {}), [`${slot}:${action.moveSlot}`]: draws};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已抽取 ${draws.length} 个候选技能，${spendText(cost)}。`);
  }

  if (action.type === "apply_drawn_move") {
    const slot = action.slot;
    const moveSlot = action.moveSlot;
    const draws = run.move_draws?.[`${slot}:${moveSlot}`] || [];
    const selected = draws.find(move => move.id === toId(action.moveId) || toId(move.name) === toId(action.moveId));
    if (!selected) throw new Error("请选择已抽取的候选技能。");
    await applyMoveToSlot(run, slot, moveSlot, selected.id || selected.name);
    delete run.move_draws?.[`${slot}:${moveSlot}`];
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已学习 ${selected.name_zh || selected.name}。`);
  }

  if (action.type === "apply_direct_move") {
    if (!hasTalent(run.talents, "prophet_direct_move")) throw new Error("需要天赋「运筹帷幄」。");
    if (currentBp(save) < DIRECT_MOVE_COST) throw new Error(`BP 不足，需要 ${DIRECT_MOVE_COST}BP。`);
    await applyMoveToSlot(run, action.slot, action.moveSlot, action.moveId);
    spendBp(save, DIRECT_MOVE_COST);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已直接学习技能，${spendText(DIRECT_MOVE_COST)}。`);
  }

  if (action.type === "scout_next") {
    if (!hasTalent(run.talents, "prophet_next_scout")) throw new Error("需要天赋「未卜先知」。");
    const level = action.level === "all" ? "all" : "one";
    if (level === "one" && run.rest_status?.free_scout_used) throw new Error("本次休整已经使用过免费侦查。");
    const cost = level === "all" ? SCOUT_ALL_COST : SCOUT_ONE_COST;
    spendBp(save, cost);
    const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
    const preview = await generateOpponentPreview(save, run, nextBattleNo);
    const enemyPool = preview.enemies;
    const enemies = level === "one" ? [enemyPool[Math.floor(seededRng(Number(run.seed || 1), 0x5c07 + nextBattleNo * 19)() * enemyPool.length)]].filter(Boolean) : enemyPool;
    run.scout = {level, title: `第 ${nextBattleNo}/${run.battles} 场：${preview.label}`, summary: `下一场对手是 ${preview.trainer.name_zh}。`, enemies};
    if (level === "one") run.rest_status = {...(run.rest_status || {}), free_scout_used: true};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已侦查下一场，${spendText(cost)}。`);
  }

  if (action.type === "scout_final_boss") {
    if (!hasTalent(run.talents, "prophet_future_boss")) throw new Error("需要天赋「预知未来」。");
    const preview = await generateOpponentPreview(save, run, Number(run.battles || DEFAULT_BATTLES));
    run.future_boss = {
      title: `关底预知：${preview.label} ${preview.trainer.name_zh}`,
      summary: `第 ${run.battles}/${run.battles} 场的训练师阵容。`,
      enemies: preview.enemies,
    };
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, "已看见本局关底训练师阵容。");
  }

  if (action.type === "review_previous") {
    if (!hasTalent(run.talents, "prophet_history_review")) throw new Error("需要天赋「温故知新」。");
    if (!run.enemy_display?.length) throw new Error("暂无上一场对手信息。");
    spendBp(save, REVIEW_PREVIOUS_COST);
    run.review = {enemies: run.enemy_display};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已回顾上一场对手，${spendText(REVIEW_PREVIOUS_COST)}。`);
  }

  if (action.type === "randomize_stat_part" || action.type === "randomize_all_stats") {
    const slot = action.slot;
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const baseCost = action.type === "randomize_all_stats" ? RANDOMIZE_ALL_COST : RANDOMIZE_PART_COST;
    const cost = statResetCost(run, baseCost, action.type === "randomize_all_stats" ? "all" : action.part);
    spendBp(save, cost);
    await applyRandomizedStats(run, slot, action.type === "randomize_all_stats" ? "all" : action.part);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已随机重置，${spendText(cost)}。`);
  }

  if (action.type === "equip_item" || action.type === "unequip_item") {
    const slot = action.slot + 1;
    if (slot < 1 || slot > run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const oldItem = itemKey(run.player_display[action.slot]?.item_id || run.player_team[action.slot]?.item);
    const oldItemName = run.player_display[action.slot]?.item_zh || run.player_display[action.slot]?.item || oldItem;
    if (oldItem) run.bag_items = {...(run.bag_items || {}), [oldItem]: Number(run.bag_items?.[oldItem] || 0) + 1};
    if (action.type === "equip_item") {
      const itemId = itemKey(action.itemId);
      if (isTmItemId(itemId)) throw new Error("技能机器不能装备，只能在休整页使用。");
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
    const message = action.type === "equip_item"
      ? oldItem ? `已交换道具，${oldItemName} 回到了背包。` : "已装备道具。"
      : oldItem ? `${oldItemName} 回到了背包。` : "当前没有携带道具。";
    return await restState(next, next.current_run as CurrentRunData, message);
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
    return await restState(next, next.current_run as CurrentRunData, `已学习 ${selected.name_zh}，${spendText(cost)}${refund ? `，返还 ${refund}BP` : ""}。`);
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
    return await restState(next, next.current_run as CurrentRunData, `已保存能力值调整，${spendText(cost)}。`);
  }

  return await restState(save, run);
}

async function shopItems(query = ""): Promise<ShopItem[]> {
  const goods = await loadGoods();
  const needle = query.trim().toLowerCase();
  const items = (await gameService.itemOptions()).map(item => {
    const cost = goods.get(`item:${toId(item.id)}`)?.item_cost ?? 5 * BP_SCALE;
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
  ipcMain.handle("save:createNew", async (_event, trainer: TrainerProfile) => saveStore!.createNew(normalizeTrainerProfile(trainer)));
  ipcMain.handle("save:updateTrainer", async (_event, trainer: TrainerProfile) => saveStore!.updateTrainer(normalizeTrainerProfile(trainer)));
  ipcMain.handle("trainer:catalog", async () => trainerCatalogState());
  ipcMain.handle("game:generateCandidates", async (_event, seed?: number) => gameService.generateRentalCandidates(seed || Date.now()));
  ipcMain.handle("run:prepareStarterItems", async (_event, seed?: number) => prepareStarterItems(seed));
  ipcMain.handle("run:chooseStarterItem", async (_event, offerId?: string | null) => chooseStarterItem(offerId || null));
  ipcMain.handle("talents:get", async () => talentConfig());
  ipcMain.handle("talents:unlock", async (_event, id: string) => unlockTalent(id));
  ipcMain.handle("talents:configure", async (_event, ids: string[]) => configureTalents(ids));
  ipcMain.handle("run:prepareCandidates", async (_event, seed?: number) => prepareCandidates(seed));
  ipcMain.handle("run:beginChallenge", async (_event, selectedIndexes: number[], seed: number, battles?: number) => beginChallenge(selectedIndexes, seed, battles));
  ipcMain.handle("run:continue", async () => continueRun());
  ipcMain.handle("run:battleChoice", async (_event, choice: string) => submitBattleChoice(choice));
  ipcMain.handle("run:secondTeamRoar", async (_event, useRescue: boolean) => chooseSecondTeamRoar(Boolean(useRescue)));
  ipcMain.handle("run:exchange", async (_event, ownIndex: number | null, enemyIndex: number | null) => {
    if (ownIndex === null || enemyIndex === null) return handleRestAction({type: "next"});
    return handleRestAction({type: "exchange", ownIndex, enemyIndex});
  });
  ipcMain.handle("run:restAction", async (_event, action: RestAction) => handleRestAction(action));
  ipcMain.handle("shop:items", async (_event, query?: string) => shopItems(query || ""));
  ipcMain.handle("pokemon:learnableMoves", async (_event, slot: number, query?: string) => learnableMoves(slot, query || ""));
  ipcMain.handle("pokemon:editOptions", async (_event, slot: number) => editOptions(slot));
  ipcMain.handle("run:getBattleState", async () => {
    const save = await loadSave();
    return activeBattle ? decorateBattleState(activeBattle.getState(), save?.current_run as CurrentRunData | null) : null;
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
