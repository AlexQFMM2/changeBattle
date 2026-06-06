import {app, BrowserWindow, Menu, ipcMain, protocol} from "electron";
import {existsSync, readFileSync} from "node:fs";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {GameService, type BattleAiPersonality, type BattleAiProfileInput, type TrainerItemBattleSession} from "@changebattle/game-service";
import type {BagCategoryView, BattleState, BossDexPoolRow, BossDexRecord, BossDexSeenPokemon, CurrentRunData, DesktopDexCategory, DesktopDexEntry, DesktopDexSearchResult, DesktopGameState, GeneratedTeam, ItemCategory, LocalSave, MoveSummary, PlayerPokemonState, PokemonEditOptions, PokemonSet, PricedMove, RentalPokemon, RestAction, RestState, ShopItem, ShopOffer, StarterItemGroup, StarterItemGroupState, StarterUpgradeState, StarterUpgradeView, TalentView, TrainerCatalogState, TrainerNpcType, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import {
  ADJUST_STATS_COST,
  BP_SCALE,
  DEFAULT_BATTLES,
  RANDOMIZE_ALL_COST,
  RANDOMIZE_PART_COST,
  REROUTE_LIMIT,
  RECYCLER_EVENT_CHANCE,
  RECYCLE_RECEIPT_RATE,
  REST_HP_COSTS,
  REST_PP_COSTS,
  REST_STATUS_COSTS,
  SCOUT_ALL_COST,
  SCOUT_BASIC_COST,
  SCOUT_ONE_COST,
  SHOP_GUEST_FREE_ROLLS,
  SHOP_PREFERRED_ROLL_COST,
  STARTER_ITEM_GROUPS,
  STARTER_ITEM_MAX_LEVEL,
  TALENTS,
  TALENT_EQUIP_LIMIT,
  WIN_BP_REWARD,
  addBp,
  addRunBp,
  addCoins,
  applyProphetFirstMover,
  canExchangeBoss,
  candidateCountForTalents,
  clearBonus,
  coinsToBp,
  currentBp,
  currentCoins,
  emptyStats,
  exchangeCost,
  exchangeKeepsItem,
  exchangeStateRatio,
  hasTalent,
  isTmItemId,
  itemCategory,
  itemKey,
  moveDrawCost,
  moveDrawCount,
  normalizeStarterUpgrades,
  portfolioBonus,
  pricedForRun,
  pricedForShop,
  recordPortfolioSpend,
  refreshStats,
  sellPriceForItem,
  settleProphetFirstMover,
  shopDuplicateBonusForOffers,
  shopCandidateCount,
  shopNextRollCost,
  shopOfferCount,
  spendBp,
  spendCoins,
  starterCoinsForSeed,
  starterUpgradeCatalog,
  starterUpgradeCost,
  starterUpgradeLevel,
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
type PendingStarterState = {
  seed: number;
  coins: number;
  offers: ShopOffer[];
  purchased: ShopOffer[];
  talents: TalentView[];
  upgrades: StarterUpgradeState;
  wholeRerollsUsed: number;
  singleRerollsUsed: number;
};

let saveStore: SaveStore | null = null;
let pendingCandidates: GeneratedTeam | null = null;
let pendingStarter: PendingStarterState | null = null;
let configuredTalents: TalentView[] = [];
let activeBattle: TrainerItemBattleSession | null = null;
let activeBattleNo = 0;
let battleChoiceInFlight = false;
let goodsCache: Map<string, {item_type: string; item_id: string; item_cost: number}> | null = null;
let shopPoolCache: ShopPoolEntry[] | null = null;
let starterItemPoolCache: StarterItemPoolEntry[] | null = null;
let bossTeamPoolCache: BossTeamPoolRow[] | null = null;

type TalentConfigState = {catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null};
type StarterUpgradeConfigState = {catalog: StarterUpgradeView[]; save?: LocalSave | null};
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
type StarterItemPoolEntry = ShopPoolEntry & {
  starter_group: StarterItemGroup;
  tier: number;
  discountable: boolean;
};
type BossTeamPoolRow = {pool_id: string; trainer_id: string; team_index: number; slot: number; species_id: string; species?: string; generation_profile: GenerationProfile};

const SHOP_BUCKET_WEIGHTS: Record<ShopPoolBucket, number> = {
  healing: 65,
  pp: 15,
  berry: 10,
  tm: 5,
  held: 5,
};

const GUARANTEED_SHOP_ITEMS: Array<{id: string; cost: number}> = [
  {id: "potion", cost: 50},
  {id: "superpotion", cost: 100},
  {id: "hyperpotion", cost: 200},
  {id: "maxpotion", cost: 250},
  {id: "fullrestore", cost: 300},
  {id: "revive", cost: 200},
  {id: "maxrevive", cost: 300},
  {id: "revivalherb", cost: 300},
  {id: "fullheal", cost: 50},
  {id: "healpowder", cost: 50},
  {id: "antidote", cost: 50},
  {id: "burnheal", cost: 50},
  {id: "iceheal", cost: 50},
  {id: "awakening", cost: 50},
  {id: "paralyzeheal", cost: 50},
];

const LOCAL_ITEM_DETAILS: Record<string, {name: string; name_zh: string; desc: string; desc_zh: string}> = {
  potion: {name: "Potion", name_zh: "回复药", desc: "Restores 20 HP.", desc_zh: "恢复 20 点 HP。"},
  superpotion: {name: "Super Potion", name_zh: "好伤药", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  hyperpotion: {name: "Hyper Potion", name_zh: "绝好伤药", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  maxpotion: {name: "Max Potion", name_zh: "全满药", desc: "Fully restores HP.", desc_zh: "恢复全部 HP。"},
  fullrestore: {name: "Full Restore", name_zh: "全复药", desc: "Fully restores HP and cures status.", desc_zh: "恢复全部 HP，并解除异常状态。"},
  freshwater: {name: "Fresh Water", name_zh: "美味之水", desc: "Restores 30 HP.", desc_zh: "恢复 30 点 HP。"},
  sodapop: {name: "Soda Pop", name_zh: "劲爽汽水", desc: "Restores 50 HP.", desc_zh: "恢复 50 点 HP。"},
  lemonade: {name: "Lemonade", name_zh: "果汁牛奶", desc: "Restores 70 HP.", desc_zh: "恢复 70 点 HP。"},
  moomoomilk: {name: "Moomoo Milk", name_zh: "哞哞鲜奶", desc: "Restores 100 HP.", desc_zh: "恢复 100 点 HP。"},
  revive: {name: "Revive", name_zh: "活力碎片", desc: "Revives a fainted Pokemon with half HP.", desc_zh: "让濒死宝可梦复活，并恢复一半 HP。"},
  maxrevive: {name: "Max Revive", name_zh: "活力块", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
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

function freshRestStatus(talents: TalentView[] | undefined, extra: CurrentRunData["rest_status"] = {}): CurrentRunData["rest_status"] {
  const baseFreeRolls = hasTalent(talents, "growth_vip_guest") ? SHOP_GUEST_FREE_ROLLS : 0;
  const extraFreeRolls = Number(extra.free_shop_rolls_remaining || 0);
  return {
    exchanges: 0,
    taken_enemy_slots: [],
    ...extra,
    free_shop_rolls_remaining: Math.max(0, baseFreeRolls + extraFreeRolls),
    trust_level_used: Boolean(extra.trust_level_used),
    lead_change_used: Boolean(extra.lead_change_used),
    recycler_available: Boolean(extra.recycler_available),
  };
}

function bpRiskRoll(run: CurrentRunData, label: string): number {
  return seededRng(Number(run.seed || 1), 0xbad500 + Number(run.battle_no || run.next_battle || 0) * 97 + toId(label).length * 31 + Date.now())();
}

function spendRunBp(save: LocalSave, run: CurrentRunData, cost: number, label: string, options: {alreadyPriced?: boolean} = {}): {paid: number; message: string} {
  void save;
  const baseCost = options.alreadyPriced ? Math.max(0, Math.floor(Number(cost || 0))) : pricedForRun(run, cost);
  if (baseCost <= 0) return {paid: 0, message: "免费"};
  if (!hasTalent(run.talents, "growth_risky")) {
    spendCoins(run, baseCost);
    recordPortfolioSpend(run, label, baseCost);
    return {paid: baseCost, message: spendText(baseCost)};
  }
  const roll = bpRiskRoll(run, label);
  if (roll < 0.4) {
    return {paid: 0, message: `铤而走险触发：本次花费为 0（原价 ${baseCost}金币）`};
  }
  if (roll < 0.6) {
    const paid = Math.ceil(baseCost * 1.5);
    spendCoins(run, paid);
    recordPortfolioSpend(run, label, paid);
    return {paid, message: `铤而走险触发：消耗增加 1.5 倍，花费 ${paid}金币`};
  }
  if (roll < 0.7) {
    addCoins(run, baseCost);
    return {paid: 0, message: `铤而走险触发：本次免费，并额外获得 ${baseCost}金币`};
  }
  spendCoins(run, baseCost);
  recordPortfolioSpend(run, label, baseCost);
  return {paid: baseCost, message: spendText(baseCost)};
}

function adjustBagItem(run: CurrentRunData, itemId: string, delta: number): void {
  const id = itemKey(itemId);
  const nextCount = Math.max(0, Number(run.bag_items?.[id] || 0) + delta);
  run.bag_items = {...(run.bag_items || {}), [id]: nextCount};
  if (!nextCount) {
    delete run.bag_items[id];
    if (run.bag_item_meta) delete run.bag_item_meta[id];
  }
}

async function grantBagItem(run: CurrentRunData, itemId: string, count: number): Promise<string> {
  const item = await itemDetailsById(itemId);
  adjustBagItem(run, item.id, Math.max(0, count));
  rememberBagItemMeta(run, item);
  return `${item.name_zh || item.name} x${count}`;
}

function rollRecyclerEvent(run: CurrentRunData, battleNo: number): boolean {
  const rng = seededRng(Number(run.seed || 1), 0x9ec0 + battleNo * 131 + Number(run.wins || 0) * 17);
  return rng() < RECYCLER_EVENT_CHANCE;
}

async function grantVictoryRewards(run: CurrentRunData, isBoss: boolean, battleNo: number): Promise<{items: string[]; restBonus: CurrentRunData["rest_status"]}> {
  const items: string[] = [];
  const recyclerAvailable = rollRecyclerEvent(run, battleNo);
  if (isBoss) {
    items.push(await grantBagItem(run, "fullrestore", 2));
    items.push(await grantBagItem(run, "maxelixir", 2));
    return {items, restBonus: {free_shop_rolls_remaining: 1, shop_slot_discounts: [0.3, 0.5, 0.7, 0.3], recycler_available: recyclerAvailable}};
  }
  const rng = seededRng(Number(run.seed || 1), 0x711c70 + battleNo * 73 + Number(run.wins || 0) * 17);
  items.push(await grantBagItem(run, rng() < 0.3 ? "fullheal" : "leppaberry", 2));
  items.push(await grantBagItem(run, rng() < 0.7 ? "hyperpotion" : "revive", 1));
  items.push(await grantBagItem(run, "fullrestore", 1));
  return {items, restBonus: {recycler_available: recyclerAvailable}};
}

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
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    case ".svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
}

function cp936MojibakePath(relativePath: string): string | null {
  try {
    const converted = new TextDecoder("gbk").decode(Buffer.from(relativePath, "utf8"));
    return converted && converted !== relativePath ? converted : null;
  } catch {
    return null;
  }
}

async function readAssetFile(relativePath: string): Promise<{filePath: string; bytes: Buffer}> {
  const filePath = path.resolve(projectRoot, relativePath);
  if (!filePath.startsWith(projectRoot + path.sep)) throw Object.assign(new Error("Forbidden"), {status: 403});
  try {
    return {filePath, bytes: await readFile(filePath)};
  } catch (error) {
    const fallbackPath = cp936MojibakePath(relativePath);
    if (!fallbackPath) throw error;
    const fallbackFilePath = path.resolve(projectRoot, fallbackPath);
    if (!fallbackFilePath.startsWith(projectRoot + path.sep)) throw Object.assign(new Error("Forbidden"), {status: 403});
    return {filePath: fallbackFilePath, bytes: await readFile(fallbackFilePath)};
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
  void save;
}

function emptyBossDexRecord(): BossDexRecord {
  return {
    encounters: 0,
    completed: 0,
    wins: 0,
    losses: 0,
    last_result: null,
    seen_pool_slots: [],
    seen_pokemon: {},
  };
}

function normalizeBossDexRecord(record?: Partial<BossDexRecord> | null): BossDexRecord {
  const seenPokemon = Object.fromEntries(Object.entries(record?.seen_pokemon || {}).filter(([, value]) => Boolean(value?.pokemon))) as Record<string, BossDexSeenPokemon>;
  return {
    ...emptyBossDexRecord(),
    ...record,
    encounters: Math.max(0, Number(record?.encounters || 0)),
    completed: Math.max(0, Number(record?.completed || 0)),
    wins: Math.max(0, Number(record?.wins || 0)),
    losses: Math.max(0, Number(record?.losses || 0)),
    last_result: record?.last_result === "win" || record?.last_result === "loss" ? record.last_result : null,
    seen_pool_slots: Array.from(new Set((record?.seen_pool_slots || []).filter(Boolean))),
    seen_pokemon: seenPokemon,
  };
}

function normalizeBossDex(dex?: Record<string, BossDexRecord> | null): Record<string, BossDexRecord> {
  return Object.fromEntries(Object.entries(dex || {}).map(([id, record]) => [id, normalizeBossDexRecord(record)]));
}

function normalizeSave(save: LocalSave): LocalSave {
  migrateSaveBpScale(save);
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.trainer = normalizeTrainerProfile(save.trainer);
  save.talent_unlocks = Array.from(new Set((save.talent_unlocks || []).filter(id => TALENTS.some(talent => talent.id === id && !talent.disabled))));
  save.talent_equipped = (save.talent_equipped || []).filter(id => save.talent_unlocks!.includes(id)).slice(0, TALENT_EQUIP_LIMIT);
  save.starter_upgrades = normalizeStarterUpgrades(save.starter_upgrades);
  save.boss_dex = normalizeBossDex(save.boss_dex);
  save.run_memory = {
    player_species_ids: Array.from(new Set((save.run_memory?.player_species_ids || []).map(toId).filter(Boolean))).slice(0, 6),
    enemy_species_ids: Array.from(new Set((save.run_memory?.enemy_species_ids || []).map(toId).filter(Boolean))).slice(0, 6),
  };
  save.current_run = save.current_run || null;
  refreshStats(save);
  if (save.current_run) normalizeCurrentRun(save.current_run);
  return save;
}

function rememberRunForSoulmate(save: LocalSave, run: CurrentRunData): void {
  save.run_memory = {
    player_species_ids: Array.from(new Set((run.player_team || []).map(pokemon => toId(pokemon.species || pokemon.name)).filter(Boolean))).slice(0, 6),
    enemy_species_ids: Array.from(new Set((run.enemy_raw || []).map(pokemon => toId(pokemon.species || pokemon.name)).filter(Boolean))).slice(0, 6),
  };
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
    champions: npcCatalog.filter(entry => entry.type === "champion" && entry.front_asset),
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
  const forcedId = run.forced_trainer_ids?.[String(battleNo)];
  const forced = forcedId ? pool.find(entry => entry.id === forcedId) : undefined;
  const namedChampion = route.type === "champion" && run.named_champion_id ? pool.find(entry => entry.id === run.named_champion_id) : undefined;
  const selected = forced || namedChampion || pickStable(pool, run.seed || 0, battleNo, route.route) || fallback;
  const teamPool = selected.team_pool_ids?.length ? pickStable(selected.team_pool_ids, run.seed || 0, battleNo, selected.id, forcedId || "") : undefined;
  return {...selected, team_pool_id: teamPool};
}

function rerouteTrainerForRoute(route: BossRoute, run: CurrentRunData, battleNo: number): TrainerNpcView {
  if (route.type === "champion") throw new Error("冠军战不能改道。");
  const pool = trainerPoolForRoute(route);
  if (pool.length <= 1) throw new Error("当前路线没有其他同等级对手。");
  const current = chooseTrainerForRoute(route, run, battleNo);
  const candidates = pool.filter(entry => entry.id !== current.id);
  const picked = pickStable(candidates, run.seed || 0, battleNo, route.route, Number(run.reroute_used || 0) + 1, Date.now());
  if (!picked) throw new Error("当前路线没有可替换的对手。");
  const teamPool = picked.team_pool_ids?.length ? pickStable(picked.team_pool_ids, run.seed || 0, battleNo, picked.id, "reroute", Number(run.reroute_used || 0) + 1) : undefined;
  return {...picked, team_pool_id: teamPool};
}

function decorateBattleState(state: BattleState, run?: CurrentRunData | null): BattleState {
  if (!run) return state;
  const playerTalents = run.talents || [];
  return {
    ...state,
    player_trainer: run.player_trainer,
    enemy_trainer: run.enemy_trainer,
    enemy_boss_record: run.enemy_boss_record,
    player_talents: playerTalents,
    show_move_effectiveness: hasTalent(playerTalents, "intel_god_eye"),
  };
}

function starterChoiceState(starter: PendingStarterState) {
  const upgrades = normalizeStarterUpgrades(starter.upgrades);
  const groupLimit = hasTalent(starter.talents, "starter_bag_expansion") ? 2 : 1;
  const groups: StarterItemGroupState[] = STARTER_ITEM_GROUPS.map(group => ({
    id: group.id,
    name: group.name,
    quality_level: Number(upgrades.item_quality?.[group.id] || 1),
    quantity_level: Number(upgrades.item_quantity?.[group.id] || 0),
    max_quality_level: STARTER_ITEM_MAX_LEVEL,
    max_quantity_level: STARTER_ITEM_MAX_LEVEL,
    offers: starter.offers.filter(offer => offer.starter_group === group.id),
    purchased_offer_id: starter.purchased.find(offer => offer.starter_group === group.id)?.offer_id || null,
    purchased_offer_ids: starter.purchased.filter(offer => offer.starter_group === group.id).map(offer => offer.offer_id),
  }));
  const wholeRerollLimit = starterUpgradeLevel(upgrades, "pokemon_reroll");
  const singleRerollLimit = starterUpgradeLevel(upgrades, "pokemon_single_reroll");
  return {
    seed: starter.seed,
    coins: starter.coins,
    offers: starter.offers,
    purchased: starter.purchased[starter.purchased.length - 1] || null,
    purchased_list: starter.purchased,
    max_purchases: STARTER_ITEM_GROUPS.filter(group => Number(upgrades.item_quantity?.[group.id] || 0) > 0).length * groupLimit,
    item_groups: groups,
    whole_rerolls_remaining: Math.max(0, wholeRerollLimit - starter.wholeRerollsUsed),
    single_rerolls_remaining: Math.max(0, singleRerollLimit - starter.singleRerollsUsed),
    inspect_count: starterUpgradeLevel(upgrades, "pokemon_inspect"),
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
    refreshStats(save);
  } else {
    stats.losses = Number(stats.losses || 0) + 1;
    stats.set_win_streak = 0;
    save.stats = stats;
    refreshStats(save);
  }
  if (run) recordBossBattleResult(save, run, winner);
  return gained;
}

async function refundableBagBaseBp(run: CurrentRunData): Promise<number> {
  normalizeCurrentRun(run);
  const rate = hasTalent(run.talents, "economy_premium_guest") ? 0.75 : 0.5;
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

async function settleRunEnd(save: LocalSave, run: CurrentRunData, options: {refundBag?: boolean; completed?: boolean} = {}): Promise<{paidBack: number; refundBase: number; refundGained: number; receiptBonus: number; portfolioBonus: number; portfolioTypes: string[]; convertedCoins: number; convertedBp: number}> {
  const paidBack = settleProphetFirstMover(save, run);
  const refundBase = options.refundBag === false ? 0 : await refundableBagBaseBp(run);
  const refundGained = refundBase ? addRunBp(save, run, refundBase) : 0;
  const receiptBase = Number(run.recycle_receipt_value || 0) + refundBase;
  const receiptBonus = hasTalent(run.talents, "economy_recycle_receipt") && receiptBase > 0 ? addRunBp(save, run, Math.floor(receiptBase * RECYCLE_RECEIPT_RATE)) : 0;
  const portfolio = portfolioBonus(run);
  const portfolioGained = options.completed && portfolio.bonus > 0 ? addRunBp(save, run, portfolio.bonus) : 0;
  const convertedCoins = currentCoins(run);
  const convertedBp = coinsToBp(convertedCoins);
  if (convertedBp > 0) addBp(save, convertedBp);
  run.coins = 0;
  return {paidBack, refundBase, refundGained, receiptBonus, portfolioBonus: portfolioGained, portfolioTypes: portfolio.types, convertedCoins, convertedBp};
}

function settlementText(settled: Awaited<ReturnType<typeof settleRunEnd>>): string {
  return `${settled.refundGained ? `，背包返还 ${settled.refundGained}金币` : ""}${settled.receiptBonus ? `，回收票据 +${settled.receiptBonus}金币` : ""}${settled.portfolioBonus ? `，投资组合 +${settled.portfolioBonus}金币（${settled.portfolioTypes.join(" / ")}）` : ""}`;
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

async function loadStarterItemPool(): Promise<StarterItemPoolEntry[]> {
  if (starterItemPoolCache) return starterItemPoolCache;
  const filePath = path.join(projectRoot, "data", "starter_item_pool.csv");
  const entries: StarterItemPoolEntry[] = [];
  if (existsSync(filePath)) {
    const raw = await readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue;
      const [idRaw, kindRaw, categoryRaw, starterGroupRaw, tierRaw, costRaw, weightRaw, enabledRaw, discountableRaw, notesRaw] = line.split(",");
      const kind = toId(kindRaw) === "tm" ? "tm" : "item";
      const categoryId = toId(categoryRaw);
      const category: ItemCategory = kind === "tm" ? "tm" : categoryId === "consumable" ? "consumable" : "held";
      const starterGroup = toId(starterGroupRaw) as StarterItemGroup;
      if (!STARTER_ITEM_GROUPS.some(group => group.id === starterGroup)) continue;
      const id = kind === "tm" && idRaw.trim() === "*" ? "*" : itemKey(idRaw);
      if (!id) continue;
      entries.push({
        id,
        kind,
        category,
        starter_group: starterGroup,
        tier: Math.max(1, Math.min(STARTER_ITEM_MAX_LEVEL, Number(tierRaw || 1))),
        cost: Math.max(0, Number(costRaw || 0)),
        weight: Math.max(0, Number(weightRaw || 1)),
        enabled: String(enabledRaw ?? "1").trim() !== "0",
        discountable: String(discountableRaw ?? "1").trim() !== "0",
        notes: notesRaw || "",
      });
    }
  }
  starterItemPoolCache = entries.filter(entry => entry.enabled && entry.weight > 0);
  return starterItemPoolCache;
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

type ShopPreferredCategory = "healing" | "pp" | "berry" | "battle" | "tm";

function preferredShopBuckets(preferredCategory?: ShopPreferredCategory): ShopPoolBucket[] | null {
  if (!preferredCategory) return null;
  if (preferredCategory === "healing") return ["healing"];
  if (preferredCategory === "pp") return ["pp"];
  if (preferredCategory === "berry") return ["berry"];
  if (preferredCategory === "battle") return ["held"];
  if (preferredCategory === "tm") return ["tm"];
  return null;
}

async function rollShopOffers(run: CurrentRunData, preferredCategory?: ShopPreferredCategory): Promise<ShopOffer[]> {
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
  const forcedBuckets = preferredShopBuckets(preferredCategory);
  const candidateLimit = shopCandidateCount(run);
  for (let index = 0; index < count; index += 1) {
    const bucket = forcedBuckets ? weightedPick(forcedBuckets.filter(entry => (buckets[entry] || []).length > 0).map(entry => ({bucket: entry, weight: SHOP_BUCKET_WEIGHTS[entry]})), rng)?.bucket : weightedShopBucket(buckets, rng);
    const bucketPool = bucket ? shuffleByRng(buckets[bucket] || [], rng).slice(0, Math.max(1, candidateLimit)) : [];
    const selected = bucket ? weightedPick(bucketPool, rng) : null;
    if (!selected) break;
    const {weight: _weight, ...offer} = selected as ShopOffer & {weight?: number};
    const slotDiscount = Number(run.rest_status?.shop_slot_discounts?.[index] || 0);
    const cost = slotDiscount > 0 ? Math.floor(Number(offer.cost || 0) * slotDiscount) : Number(offer.cost || 0);
    result.push({...offer, cost, discount: slotDiscount || offer.discount, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-${itemKey(offer.id || offer.name)}`});
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

function starterGroupName(groupId: StarterItemGroup): string {
  return STARTER_ITEM_GROUPS.find(group => group.id === groupId)?.name || groupId;
}

function starterOfferWeight(entry: StarterItemPoolEntry, qualityLevel: number): number {
  const base = Math.max(0, Number(entry.weight || 1));
  if (entry.tier === qualityLevel) return base * 3;
  if (entry.tier === qualityLevel - 1) return base * 2;
  return base;
}

async function starterItemOffers(runSeed: number, talents: TalentView[] = [], upgrades?: StarterUpgradeState): Promise<ShopOffer[]> {
  const pool = await loadStarterItemPool();
  const itemOptions = await gameService.itemOptions();
  const normalizedUpgrades = normalizeStarterUpgrades(upgrades);
  const rng = seededRng(runSeed, 0x57a27);
  const result: ShopOffer[] = [];
  for (const group of STARTER_ITEM_GROUPS) {
    const quantityLevel = Number(normalizedUpgrades.item_quantity?.[group.id] || 0);
    if (quantityLevel <= 0) continue;
    const qualityLevel = Number(normalizedUpgrades.item_quality?.[group.id] || 1);
    const used = new Set<string>();
    const entries = pool.filter(entry => entry.starter_group === group.id && entry.tier <= qualityLevel);
    const tmTemplate = entries.find(entry => entry.kind === "tm" && entry.id === "*");
    const tmOffers = tmTemplate
      ? (await starterTmOptions(runSeed, talents)).map((offer, index) => ({
        ...offer,
        cost: 0,
        weight: starterOfferWeight(tmTemplate, qualityLevel),
        discountable: tmTemplate.discountable,
        starter_group: group.id,
        starter_group_label: group.name,
        item_tier: tmTemplate.tier,
        offer_id: `starter-${group.id}-tm-${index}-${itemKey(offer.id || offer.name)}`,
      }))
      : [];
    const itemOffers: Array<ShopOffer & {weight?: number}> = [];
    entries.filter(entry => entry.kind === "item").forEach((entry, index) => {
      const item = itemOptions.find(option => itemKey(option.id || option.name) === entry.id);
      const localItem = LOCAL_ITEM_DETAILS[entry.id];
      if (!item && !localItem) return;
      const detail = item || {id: entry.id, ...localItem, cost: entry.cost || 1};
      itemOffers.push({
        ...detail,
        id: entry.id,
        cost: 0,
        category: entry.category,
        icon_asset: itemIconAsset(entry.id),
        offer_id: `starter-${group.id}-${index}-${entry.id}`,
        source: "starter",
        weight: starterOfferWeight(entry, qualityLevel),
        discountable: entry.discountable,
        starter_group: group.id,
        starter_group_label: group.name,
        item_tier: entry.tier,
      });
    });
    const candidates = [...itemOffers, ...tmOffers];
    for (let index = 0; index < quantityLevel; index += 1) {
      const available = candidates.filter(offer => !used.has(itemKey(offer.id || offer.name)));
      const picked = weightedPick(available, rng);
      if (!picked) break;
      used.add(itemKey(picked.id || picked.name));
      const {weight: _weight, ...offer} = picked;
      result.push({...offer, offer_id: `starter-${group.id}-${index}-${itemKey(offer.id || offer.name)}`});
    }
  }
  return result;
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

function starterProfilesForStreak(setStreak: number, count: number, talents: TalentView[] = []): GenerationProfile[] {
  void talents;
  const base: GenerationProfile[] = setStreak <= 0
    ? ["tier1", "tier1", "tier1", "tier2", "tier2", "tier2"]
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

function championPersonalityForTrainer(trainer?: TrainerNpcView): BattleAiPersonality {
  const text = [trainer?.id, trainer?.name_zh, trainer?.name_en, trainer?.notes].filter(Boolean).join("|").toLowerCase();
  if (/赤红|red/.test(text)) return "aggressive";
  if (/小茂|青绿|blue|green/.test(text)) return "adaptive";
  if (/阿渡|lance/.test(text)) return "aggressive";
  if (/大吾|steven/.test(text)) return "defensive";
  if (/米可利|wallace/.test(text)) return "status";
  if (/竹兰|cynthia|shirona/.test(text)) return "adaptive";
  if (/阿戴克|alder|adeku/.test(text)) return "aggressive";
  if (/艾莉丝|iris/.test(text)) return "setup";
  if (/卡露妮|diantha|karune/.test(text)) return "setup";
  if (/库库伊|kukui/.test(text)) return "aggressive";
  if (/丹帝|leon/.test(text)) return "aggressive";
  if (/也慈|geeta/.test(text)) return "defensive";
  if (/妮莫|nemona/.test(text)) return "aggressive";
  return "balanced";
}

function enemyAiForRoute(route: BossRoute, trainer?: TrainerNpcView): BattleAiProfileInput {
  if (route.type === "champion") return {level: "champion", personality: championPersonalityForTrainer(trainer)};
  if (route.type === "elite4") return "elite4";
  if (route.type === "gym" && route.stage.includes("tier3")) return "gym_high";
  if (route.type === "gym") return "gym_low";
  return "normal";
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
      species: row.species || undefined,
      generation_profile: (row.generation_profile || "tier1") as GenerationProfile,
    };
  }).filter(row => row.pool_id && row.species_id && row.team_index && row.slot);
  return bossTeamPoolCache;
}

function bossTeamForTrainer(trainer: TrainerNpcView, run: CurrentRunData, battleNo: number): {teamIndex: number; rows: BossTeamPoolRow[]; speciesIds: string[]; profiles: GenerationProfile[]} | null {
  const poolId = trainer.team_pool_id || trainer.team_pool_ids?.[0];
  if (!poolId) return null;
  const rows = loadBossTeamPools().filter(row => row.pool_id === poolId);
  if (!rows.length) return null;
  const teamIndexes = [...new Set(rows.map(row => row.team_index))].sort((a, b) => a - b);
  const teamIndex = pickStable(teamIndexes, run.seed || 0, battleNo, trainer.id, poolId) || teamIndexes[0];
  const selected = rows.filter(row => row.team_index === teamIndex).sort((a, b) => a.slot - b.slot).slice(0, 3);
  if (selected.length < 3) return null;
  return {teamIndex, rows: selected, speciesIds: selected.map(row => row.species_id), profiles: selected.map(row => row.generation_profile)};
}

function bossPoolSlotKey(poolId: string | undefined, teamIndex: number, slot: number, speciesId: string): string {
  return `${poolId || "pool"}:${teamIndex}:${slot}:${speciesId}`;
}

function isBossTrainer(trainer?: TrainerNpcView): boolean {
  return Boolean(trainer && ["gym", "elite4", "champion"].includes(trainer.type));
}

function recordBossEncounter(save: LocalSave, run: CurrentRunData, trainer: TrainerNpcView, bossTeam: ReturnType<typeof bossTeamForTrainer>, display: RentalPokemon[]): BossDexRecord | undefined {
  if (!isBossTrainer(trainer) || !bossTeam) return undefined;
  const now = new Date().toISOString();
  save.boss_dex = normalizeBossDex(save.boss_dex);
  const previous = normalizeBossDexRecord(save.boss_dex[trainer.id]);
  const poolId = trainer.team_pool_id || trainer.team_pool_ids?.[0];
  const seenPokemon = {...previous.seen_pokemon};
  const seenPoolSlots = new Set(previous.seen_pool_slots);
  for (const row of bossTeam.rows) {
    const key = bossPoolSlotKey(poolId, row.team_index, row.slot, row.species_id);
    const pokemon = display[row.slot - 1];
    seenPoolSlots.add(key);
    if (pokemon) {
      seenPokemon[key] = {
        key,
        team_index: row.team_index,
        slot: row.slot,
        species_id: row.species_id,
        pokemon,
      };
    }
  }
  const next = normalizeBossDexRecord({
    ...previous,
    encounters: previous.encounters + 1,
    first_seen_at: previous.first_seen_at || now,
    last_seen_at: now,
    seen_pool_slots: Array.from(seenPoolSlots),
    seen_pokemon: seenPokemon,
  });
  save.boss_dex[trainer.id] = next;
  run.enemy_boss_record = next;
  return next;
}

function recordBossBattleResult(save: LocalSave, run: CurrentRunData, winner: string | null): void {
  const trainer = run.enemy_trainer;
  if (!isBossTrainer(trainer)) return;
  save.boss_dex = normalizeBossDex(save.boss_dex);
  const previous = normalizeBossDexRecord(save.boss_dex[trainer!.id]);
  const playerWon = winner === "Player";
  const next = normalizeBossDexRecord({
    ...previous,
    completed: previous.completed + 1,
    wins: previous.wins + (playerWon ? 1 : 0),
    losses: previous.losses + (playerWon ? 0 : 1),
    last_result: playerWon ? "win" : "loss",
    last_battled_at: new Date().toISOString(),
  });
  save.boss_dex![trainer!.id] = next;
  run.enemy_boss_record = next;
}

function trainerDexTypeLabel(type: TrainerNpcType): string {
  if (type === "champion") return "冠军";
  if (type === "elite4") return "四天王";
  if (type === "gym") return "馆主";
  return "训练师";
}

function bossPoolRowsForDex(trainer: TrainerNpcView, record: BossDexRecord | undefined): BossDexPoolRow[] {
  const poolIds = trainer.team_pool_ids?.length ? trainer.team_pool_ids : trainer.team_pool_id ? [trainer.team_pool_id] : [];
  const rows = loadBossTeamPools().filter(row => poolIds.includes(row.pool_id)).sort((a, b) => a.team_index - b.team_index || a.slot - b.slot);
  const byTeam = new Map<number, BossTeamPoolRow[]>();
  for (const row of rows) {
    const list = byTeam.get(row.team_index) || [];
    list.push(row);
    byTeam.set(row.team_index, list);
  }
  return [...byTeam.entries()].map(([teamIndex, teamRows]) => ({
    team_index: teamIndex,
    slots: teamRows.sort((a, b) => a.slot - b.slot).slice(0, 3).map(row => {
      const key = bossPoolSlotKey(row.pool_id, row.team_index, row.slot, row.species_id);
      const seen = record?.seen_pokemon?.[key];
      return {
        key,
        team_index: row.team_index,
        slot: row.slot,
        species_id: row.species_id,
        species: row.species,
        generation_profile: row.generation_profile,
        unlocked: Boolean(seen),
        pokemon: seen?.pokemon,
      };
    }),
  }));
}

function bossSummary(record?: BossDexRecord): string {
  if (!record?.encounters) return "尚未遭遇";
  const last = record.last_result === "win" ? "上次胜利" : record.last_result === "loss" ? "上次失败" : "尚未结算";
  return `交手 ${record.completed || 0} 次　胜 ${record.wins || 0} / 负 ${record.losses || 0}　${last}`;
}

function trainerDexSearch(save: LocalSave | null, query = "", offset = 0, limit = 8): DesktopDexSearchResult {
  const normalizedOffset = Math.max(0, Number(offset || 0));
  const cappedLimit = Math.max(1, Math.min(120, Number(limit || 8)));
  const typeMatch = String(query || "").match(/\btype:(gym|elite4|champion)\b/i);
  const typeFilter = typeMatch?.[1] as TrainerNpcType | undefined;
  const cleanQuery = String(query || "").replace(/\btype:(gym|elite4|champion)\b/ig, "").trim().toLowerCase();
  const cleanId = toId(cleanQuery);
  const bossDex = normalizeBossDex(save?.boss_dex);
  const bosses = npcCatalog.filter(entry => isBossTrainer(entry) && entry.front_asset && (!typeFilter || entry.type === typeFilter));
  const entries: DesktopDexEntry[] = bosses.map((trainer, index) => {
    const record = bossDex[trainer.id];
    const unlocked = Boolean(record?.encounters);
    const typeLabel = trainerDexTypeLabel(trainer.type);
    const hiddenName = `${trainer.region || "未知地区"}${typeLabel} #${index + 1}`;
    const nameZh = unlocked ? trainer.name_zh : "？？？";
    const name = unlocked ? (trainer.name_en || trainer.name_zh) : "???";
    return {
      id: trainer.id,
      name,
      name_zh: nameZh,
      category: "trainers" as const,
      desc_zh: unlocked ? `${trainer.region || "未知地区"}${typeLabel}` : hiddenName,
      tags: unlocked
        ? [trainer.id, trainer.name_zh, trainer.name_en || "", trainer.region || "", trainer.role || "", trainerDexTypeLabel(trainer.type), trainer.notes || ""]
        : [trainer.region || "", trainer.role || "", trainerDexTypeLabel(trainer.type), hiddenName],
      trainer: unlocked ? trainer : {...trainer, name_zh: "？？？", name_en: "???", front_asset: undefined, front_gif_asset: undefined, avatar_asset: undefined},
      unlocked,
      boss_record: record,
      boss_pool_rows: bossPoolRowsForDex(trainer, record),
      boss_summary: bossSummary(record),
    };
  }).filter(entry => {
    if (!cleanQuery && !cleanId) return true;
    const rawParts = entry.unlocked ? [entry.id, entry.name, entry.name_zh, entry.desc_zh, ...(entry.tags || [])] : [entry.desc_zh, ...(entry.tags || [])];
    const parts = rawParts.filter(Boolean).map(value => String(value).toLowerCase());
    const ids = parts.map(value => toId(value));
    return parts.some(value => value.includes(cleanQuery)) || ids.some(value => value.includes(cleanId));
  }).sort((a, b) => {
    const typeOrder = {gym: 0, elite4: 1, champion: 2} as Record<string, number>;
    return (typeOrder[a.trainer?.type || ""] ?? 9) - (typeOrder[b.trainer?.type || ""] ?? 9) || String(a.trainer?.region || "").localeCompare(String(b.trainer?.region || "")) || a.id.localeCompare(b.id);
  });
  const page = entries.slice(normalizedOffset, normalizedOffset + cappedLimit);
  return {
    category: "trainers",
    query: String(query || ""),
    offset: normalizedOffset,
    limit: cappedLimit,
    total: entries.length,
    has_more: normalizedOffset + page.length < entries.length,
    entries: page,
  };
}

async function generateOpponentPreview(save: LocalSave, run: CurrentRunData, battleNo: number): Promise<{route: BossRoute; trainer: TrainerNpcView; enemies: RentalPokemon[]; label: string}> {
  const route = routeBossForBattle(Number(save.stats?.set_win_streak || 0), battleNo);
  const routeSalt = route.type === "normal" ? 100 : route.type === "champion" ? 700 : route.stage.includes("tier3") ? 603 : route.stage === "tier2" ? 602 : 601;
  const trainer = chooseTrainerForRoute(route, run, battleNo);
  const bossTeam = route.type === "normal" ? null : bossTeamForTrainer(trainer, run, battleNo);
  const profiles = bossTeam?.profiles || (route.type === "normal" ? normalEnemyProfilesForBattle(Number(save.stats?.set_win_streak || 0), battleNo) : profilesForRoute(route));
  const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), routeSalt + battleNo), "gen7randombattle", profiles.length, {profiles, speciesIds: bossTeam?.speciesIds, purpose: route.type === "normal" ? "normal" : "boss"});
  const label = route.type === "normal" ? "普通 NPC" : route.type === "champion" ? "冠军" : route.type === "elite4" ? "四天王" : "馆主";
  return {route, trainer, enemies: generated.display.slice(0, 3), label};
}

async function buildNightSkyState(save: LocalSave, run: CurrentRunData): Promise<CurrentRunData["night_sky"] | undefined> {
  if (!hasTalent(run.talents, "intel_rumor")) return undefined;
  const previousRows = run.night_sky?.rows || [];
  const rows = [];
  const battles = Math.max(1, Number(run.battles || DEFAULT_BATTLES));
  for (let battleNo = 1; battleNo <= battles; battleNo += 1) {
    const previous = previousRows.find(row => Number(row.battle_no) === battleNo);
    const preview = await generateOpponentPreview(save, run, battleNo);
    const revealed = Math.max(0, Math.min(3, previous?.unlocked ? 3 : Number(previous?.revealed || 0)));
    rows.push({
      battle_no: battleNo,
      label: preview.label,
      trainer: preview.trainer,
      revealed,
      unlocked: Boolean(previous?.unlocked || revealed >= 3),
      enemies: preview.enemies.slice(0, 3).map((enemy, index) => index < revealed ? enemy : null),
    });
  }
  run.night_sky = {rows};
  return run.night_sky;
}

function spendText(cost: number): string {
  return Number(cost || 0) <= 0 ? "免费" : `花费 ${Number(cost)}金币`;
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

function ensureStarterShiny(generated: GeneratedTeam, seed: number, talents: TalentView[], setStreak: number): GeneratedTeam {
  void seed;
  void talents;
  void setStreak;
  return generated;
}

function markStarterOrigin(generated: GeneratedTeam, origin: "current" | "memory"): GeneratedTeam {
  return {
    ...generated,
    team: generated.team.map(pokemon => ({...pokemon, starter_origin: origin})),
    display: generated.display.map(pokemon => ({...pokemon, starter_origin: origin} as RentalPokemon)),
  };
}

async function generateStarterCandidatesForSave(save: LocalSave, seed: number, talents: TalentView[], count: number): Promise<GeneratedTeam> {
  const setStreak = Number(save.stats?.set_win_streak || 0);
  const profiles = starterProfilesForStreak(setStreak, count, talents);
  const current = markStarterOrigin(ensureStarterShiny(await gameService.generateRentalCandidates(gameService.deriveSeed(seed, 1), "gen7randombattle", count, {profiles, purpose: "starter"}), seed, talents, setStreak), "current");
  if (!hasTalent(talents, "starter_soulmate")) return current;
  const memorySpecies = Array.from(new Set([...(save.run_memory?.player_species_ids || []), ...(save.run_memory?.enemy_species_ids || [])].map(toId).filter(Boolean))).slice(0, 12);
  if (!memorySpecies.length) return current;
  const memoryProfiles = Array.from({length: memorySpecies.length}, (_value, index) => profiles[index % profiles.length] || "tier1" as GenerationProfile);
  const memory = markStarterOrigin(await gameService.generateRentalCandidates(gameService.deriveSeed(seed, 0x5017), "gen7randombattle", memorySpecies.length, {profiles: memoryProfiles, speciesIds: memorySpecies, purpose: "starter"}), "memory");
  return {
    seed: current.seed,
    team: [...current.team, ...memory.team],
    display: [...current.display, ...memory.display],
    packed: current.packed,
  };
}

async function applyStarterMentorEye(team: PokemonSet[], display: RentalPokemon[], seed: number, talents: TalentView[]): Promise<{team: PokemonSet[]; display: RentalPokemon[]; upgraded: number}> {
  if (!hasTalent(talents, "starter_mentor_eye")) return {team, display, upgraded: 0};
  const nextTeam = team.map(pokemon => ({...pokemon}));
  let upgraded = 0;
  for (let index = 0; index < nextTeam.length; index += 1) {
    const shown = display[index];
    const currentTier = Math.max(1, Math.min(4, Number(shown?.stage_tier || nextTeam[index]?.stage_tier || 1)));
    if (currentTier >= 4) continue;
    const rng = seededRng(seed, 0xbe10 + index * 101);
    if (rng() >= 0.33) continue;
    const profile = `tier${currentTier + 1}` as GenerationProfile;
    const speciesId = shown?.species_id || nextTeam[index]?.species;
    const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(seed, 0xb010 + index * 131), "gen7randombattle", 1, {profiles: [profile], speciesIds: [speciesId], purpose: "starter"});
    const template = generated.team[0];
    if (!template) continue;
    nextTeam[index] = {
      ...nextTeam[index],
      level: template.level,
      ivs: template.ivs,
      evs: template.evs,
      nature: template.nature,
      stage_tier: template.stage_tier,
      species_tier: template.species_tier,
      generation_profile: template.generation_profile,
    };
    upgraded += 1;
  }
  if (!upgraded) return {team, display, upgraded: 0};
  return {team: nextTeam, display: await gameService.describeTeam(nextTeam), upgraded};
}

function addToExchangeBox(run: CurrentRunData, team: PokemonSet[], display: RentalPokemon[], states?: PlayerPokemonState[]): void {
  void run;
  void team;
  void display;
  void states;
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
  run.coins = currentCoins(run);
  run.coins_earned_this_run = Number(run.coins_earned_this_run || 0);
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
  run.talents = talentsForIds(run.talents.map(talent => talent.id));
  run.reroute_used = Math.max(0, Math.floor(Number(run.reroute_used || 0)));
  run.forced_trainer_ids = Object.fromEntries(Object.entries(run.forced_trainer_ids || {}).map(([battleNo, trainerId]) => [String(Math.max(1, Math.floor(Number(battleNo || 0)))), String(trainerId || "")]).filter(([, trainerId]) => trainerId));
  run.named_champion_id = run.named_champion_id || null;
  run.recycle_receipt_value = Math.max(0, Math.floor(Number(run.recycle_receipt_value || 0)));
  run.economy_spend_types = Array.from(new Set((run.economy_spend_types || []).map(String).filter(Boolean)));
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
    free_shop_rolls_remaining: Math.max(0, Number(run.rest_status?.free_shop_rolls_remaining || 0)),
    trust_level_used: Boolean(run.rest_status?.trust_level_used),
    lead_change_used: Boolean(run.rest_status?.lead_change_used),
    shop_slot_discounts: (run.rest_status?.shop_slot_discounts || []).map(Number).filter(value => value > 0 && value <= 1),
    shop_preferred_roll_used: Boolean(run.rest_status?.shop_preferred_roll_used),
    free_scout_used: Boolean(run.rest_status?.free_scout_used),
    restore_hp_used: Boolean(run.rest_status?.restore_hp_used),
    restore_pp_used: Boolean(run.rest_status?.restore_pp_used),
    restore_status_used: Boolean(run.rest_status?.restore_status_used),
    all_in_pending_next: Boolean(run.rest_status?.all_in_pending_next),
    recycler_available: Boolean(run.rest_status?.recycler_available),
    all_in_result: run.rest_status?.all_in_result || null,
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
  const nightSky = await buildNightSkyState(save, run);
  const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
  const nextPreview = hasTalent(run.talents, "intel_reroute") && nextBattleNo <= Number(run.battles || DEFAULT_BATTLES)
    ? await generateOpponentPreview(save, run, nextBattleNo)
    : null;
  const rest: RestState = {
    battle_no: Number(run.battle_no || Math.max(1, Number(run.next_battle || 1) - 1)),
    battles: Number(run.battles || DEFAULT_BATTLES),
    wins: Number(run.wins || 0),
    battle_points: currentBp(save),
    coins: currentCoins(run),
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
      free_rolls_remaining: Number(run.rest_status?.free_shop_rolls_remaining || 0),
      preferred_roll_cost: hasTalent(run.talents, "intel_shop_strategy") ? SHOP_PREFERRED_ROLL_COST : undefined,
      slot_discounts: run.rest_status?.shop_slot_discounts || [],
      offers: run.shop_offers || [],
      purchased_offer_id: run.shop_purchased_offer_id || null,
      last_roll_bonus: run.shop_last_roll_bonus || null,
    },
    starter_items: {
      offers: run.starter_item_offers || [],
      purchased: run.starter_item_purchased || [],
      max_purchases: Math.max(0, Number(run.starter_item_purchased?.length || 0)),
    },
    move_draws: run.move_draws || {},
    scout: run.scout,
    night_sky: nightSky,
    next_opponent_preview: nextPreview ? {battle_no: nextBattleNo, label: nextPreview.label, trainer: nextPreview.trainer} : undefined,
    reroute_used: Number(run.reroute_used || 0),
    reroute_limit: REROUTE_LIMIT,
    recycler_available: Boolean(run.rest_status?.recycler_available),
    recycle_receipt_value: Number(run.recycle_receipt_value || 0),
    portfolio_types: run.economy_spend_types || [],
    free_scout_used: Boolean(run.rest_status?.free_scout_used),
    free_shop_roll_used: Boolean(run.rest_status?.free_shop_roll_used),
    trust_level_used: Boolean(run.rest_status?.trust_level_used),
    lead_change_used: Boolean(run.rest_status?.lead_change_used),
    restore_hp_used: Boolean(run.rest_status?.restore_hp_used),
    restore_pp_used: Boolean(run.rest_status?.restore_pp_used),
    restore_status_used: Boolean(run.rest_status?.restore_status_used),
    exchange_box: run.exchange_box?.display || [],
    all_in_used: Boolean(run.all_in_exchange_used),
    all_in_pending_next: Boolean(run.rest_status?.all_in_pending_next),
    all_in_result: run.rest_status?.all_in_result || null,
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
      scout_basic: SCOUT_BASIC_COST,
      scout_one: SCOUT_ONE_COST,
      scout_all: SCOUT_ALL_COST,
    },
  };
  return gameState({screen: "rest", save, rest, message});
}

async function prepareCandidates(seed?: number): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const runSeed = seed || Math.floor(Math.random() * 0xffffffff);
  const talents = pendingStarter?.talents || talentsForIds(save?.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  const count = candidateCountForTalents(talents);
  if (pendingStarter) {
    const limit = starterUpgradeLevel(pendingStarter.upgrades, "pokemon_reroll");
    if (pendingCandidates && pendingStarter.wholeRerollsUsed >= limit) throw new Error("牌有问题次数不足，无法整体重换。");
    pendingStarter = {...pendingStarter, seed: runSeed, wholeRerollsUsed: pendingCandidates ? pendingStarter.wholeRerollsUsed + 1 : pendingStarter.wholeRerollsUsed};
  }
  pendingCandidates = await generateStarterCandidatesForSave(save, runSeed, talents, count);
  return gameState({
    screen: "rentalSelect",
    save,
    starter: pendingStarter ? starterChoiceState(pendingStarter) : undefined,
    candidates: pendingCandidates,
    selected_indexes: [],
    message: `随机种子：${runSeed}`,
  });
}

async function rerollStarterCandidate(index: number): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  if (!pendingStarter || !pendingCandidates) throw new Error("当前不在开局选队阶段。");
  const slot = Math.floor(Number(index || 0));
  if (slot < 0 || slot >= pendingCandidates.display.length) throw new Error("候选编号无效。");
  if ((pendingCandidates.display[slot] as RentalPokemon & {starter_origin?: string}).starter_origin === "memory") throw new Error("回忆候选不能单独重随。");
  const limit = starterUpgradeLevel(pendingStarter.upgrades, "pokemon_single_reroll");
  if (pendingStarter.singleRerollsUsed >= limit) throw new Error("我要发功次数不足，无法单独重随。");
  const count = candidateCountForTalents(pendingStarter.talents);
  const setStreak = Number(save.stats?.set_win_streak || 0);
  const profiles = starterProfilesForStreak(setStreak, count, pendingStarter.talents);
  const nextSeed = gameService.deriveSeed(pendingStarter.seed, 5000 + pendingStarter.singleRerollsUsed * 97 + slot);
  const generated = markStarterOrigin(ensureStarterShiny(await gameService.generateRentalCandidates(nextSeed, "gen7randombattle", 1, {profiles: [profiles[slot % profiles.length] || "tier1"], purpose: "starter"}), nextSeed, pendingStarter.talents, setStreak), "current");
  pendingCandidates.team[slot] = generated.team[0];
  pendingCandidates.display[slot] = generated.display[0];
  pendingStarter = {...pendingStarter, singleRerollsUsed: pendingStarter.singleRerollsUsed + 1};
  return gameState({
    screen: "rentalSelect",
    save,
    starter: starterChoiceState(pendingStarter),
    candidates: pendingCandidates,
    selected_indexes: [],
    message: `我要发功发动，已重随第 ${slot + 1} 只候选。`,
  });
}

async function prepareStarterItems(seed?: number): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const runSeed = seed || Math.floor(Math.random() * 0xffffffff);
  const talents: TalentView[] = talentsForIds(save.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  const upgrades = normalizeStarterUpgrades(save.starter_upgrades);
  configuredTalents = talents;
  const offers = await starterItemOffers(runSeed, talents, upgrades);
  pendingStarter = {seed: runSeed, coins: starterCoinsForSeed(runSeed, talents), offers, purchased: [], talents, upgrades, wholeRerollsUsed: 0, singleRerollsUsed: 0};
  pendingCandidates = null;
  if (!offers.length) return chooseStarterItem(null);
  return gameState({screen: "starterItems", save, starter: starterChoiceState(pendingStarter), message: "选择一个开局道具，或跳过。"});
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
  if (talent.disabled) throw new Error("这个天赋暂不可用。");
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

async function setNamedChallenge(trainerId: string | null): Promise<TalentConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const id = trainerId || null;
  if (id && !npcCatalog.some(entry => entry.type === "champion" && entry.id === id)) throw new Error("只能指定冠军作为最终 Boss。");
  save.named_champion_id = id;
  const next = await persist(save);
  const equipped = talentsForIds(next.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  configuredTalents = equipped;
  return {catalog: TALENTS, unlocked: talentsForIds(next.talent_unlocks), equipped, save: next};
}

async function starterUpgradeConfig(): Promise<StarterUpgradeConfigState> {
  const save = await loadSave();
  return {catalog: starterUpgradeCatalog(save?.starter_upgrades), save};
}

function setStarterUpgradeLevel(upgrades: StarterUpgradeState, id: string, level: number): StarterUpgradeState {
  const next = normalizeStarterUpgrades(upgrades);
  const [kind, groupRaw] = id.split(":");
  const group = groupRaw as StarterItemGroup | undefined;
  if (kind === "item_quality" && group && STARTER_ITEM_GROUPS.some(entry => entry.id === group)) next.item_quality = {...next.item_quality, [group]: level};
  else if (kind === "item_quantity" && group && STARTER_ITEM_GROUPS.some(entry => entry.id === group)) next.item_quantity = {...next.item_quantity, [group]: level};
  else if (id === "pokemon_reroll") next.pokemon_reroll = level;
  else if (id === "pokemon_inspect") next.pokemon_inspect = level;
  else if (id === "pokemon_single_reroll") next.pokemon_single_reroll = level;
  else throw new Error("开局筹备项目不存在。");
  return normalizeStarterUpgrades(next);
}

async function upgradeStarter(id: string): Promise<StarterUpgradeConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const upgrades = normalizeStarterUpgrades(save.starter_upgrades);
  const currentLevel = starterUpgradeLevel(upgrades, id);
  const cost = starterUpgradeCost(id, currentLevel);
  if (cost === null || cost === undefined) throw new Error("这个项目已经满级。");
  spendBp(save, cost);
  save.starter_upgrades = setStarterUpgradeLevel(upgrades, id, currentLevel + 1);
  const next = await persist(save);
  return {catalog: starterUpgradeCatalog(next.starter_upgrades), save: next};
}

async function chooseStarterItem(offerId: string | null): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  if (!pendingStarter) {
    const seed = Math.floor(Math.random() * 0xffffffff);
    const talents = talentsForIds(save.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
    const upgrades = normalizeStarterUpgrades(save.starter_upgrades);
    pendingStarter = {seed, coins: starterCoinsForSeed(seed, talents), offers: await starterItemOffers(seed, talents, upgrades), purchased: [], talents, upgrades, wholeRerollsUsed: 0, singleRerollsUsed: 0};
  }
  const starter = pendingStarter;
  if (offerId) {
    const offer = starter.offers.find(item => item.offer_id === offerId);
    if (!offer) throw new Error("开局道具不存在。");
    if (starter.purchased.some(item => item.offer_id === offer.offer_id)) throw new Error("这个开局道具已经购买过了。");
    const groupLimit = hasTalent(starter.talents, "starter_bag_expansion") ? 2 : 1;
    if (offer.starter_group && starter.purchased.filter(item => item.starter_group === offer.starter_group).length >= groupLimit) throw new Error(`${offer.starter_group_label || starterGroupName(offer.starter_group)}最多选择 ${groupLimit} 个。`);
    starter.purchased.push(offer);
    const maxPurchases = STARTER_ITEM_GROUPS.reduce((sum, group) => sum + Math.min(groupLimit, starter.offers.filter(offer => offer.starter_group === group.id).length), 0);
    if (starter.purchased.length < maxPurchases) {
      return gameState({
        screen: "starterItems",
        save,
        starter: starterChoiceState(starter),
        message: `已选择 ${offer.name_zh || offer.name}。还可以继续选择其他类别，或点击跳过进入选队。`,
      });
    }
  }
  const count = candidateCountForTalents(starter.talents);
  pendingCandidates = await generateStarterCandidatesForSave(save, starter.seed, starter.talents, count);
  return gameState({screen: "rentalSelect", save, starter: starterChoiceState(starter), candidates: pendingCandidates, selected_indexes: [], message: `随机种子：${starter.seed}`});
}

async function cancelPreparation(): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  pendingStarter = null;
  pendingCandidates = null;
  return gameState({screen: "mainMenu", save, message: "已返回主菜单，本次准备已取消。"});
}

async function beginChallenge(selectedIndexes: number[], runSeed: number, battles = DEFAULT_BATTLES): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const effectiveSeed = pendingStarter?.seed || runSeed;
  const runTalents = pendingStarter?.talents || talentsForIds(save.talent_equipped).slice(0, TALENT_EQUIP_LIMIT);
  if (!pendingCandidates) {
    const count = candidateCountForTalents(runTalents);
    pendingCandidates = await generateStarterCandidatesForSave(save, effectiveSeed, runTalents, count);
  }
  if (selectedIndexes.length !== 3) throw new Error("需要选择 3 只宝可梦。");
  const selectedOrigins = selectedIndexes.map(index => (pendingCandidates!.display[index] as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current");
  if (hasTalent(runTalents, "starter_soulmate")) {
    const memoryCount = selectedOrigins.filter(origin => origin === "memory").length;
    const currentCount = selectedOrigins.length - memoryCount;
    if (memoryCount > 1) throw new Error("灵魂伴侣最多选择 1 只回忆候选。");
    if (memoryCount === 1 && currentCount !== 2) throw new Error("选择回忆候选后，需要再选择 2 只本局候选。");
    if (memoryCount === 0 && currentCount !== 3) throw new Error("未选择回忆候选时，需要选择 3 只本局候选。");
  } else if (selectedOrigins.some(origin => origin === "memory")) {
    throw new Error("需要天赋「灵魂伴侣」才能选择回忆候选。");
  }
  const selectedTeam = selectedIndexes.map(index => pendingCandidates!.team[index]);
  const selectedDisplay = selectedIndexes.map(index => pendingCandidates!.display[index]);
  const mentored = await applyStarterMentorEye(selectedTeam, selectedDisplay, effectiveSeed, runTalents);
  const playerTeam = mentored.team;
  const playerDisplay = mentored.display;
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
    reroute_used: 0,
    forced_trainer_ids: {},
    named_champion_id: hasTalent(runTalents, "intel_named_challenge") ? save.named_champion_id || null : null,
    recycle_receipt_value: 0,
    economy_spend_types: [],
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
    coins: pendingStarter?.coins ?? starterCoinsForSeed(effectiveSeed, runTalents),
    coins_earned_this_run: pendingStarter?.coins ?? starterCoinsForSeed(effectiveSeed, runTalents),
    bp_earned_this_run: 0,
    bp_investments: [0, 0, 0],
    move_investments: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    bag_items: starterBagItems,
    rest_status: freshRestStatus(runTalents),
  };
  pendingStarter = null;
  const next = await persist(save);
  return await restState(next, next.current_run as CurrentRunData, mentored.upgraded ? `伯乐本乐发动：${mentored.upgraded} 只宝可梦获得数值升阶。出发前可以先整理队伍。` : "出发前可以先整理队伍。");
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
    const {setStreak, bonus} = clearBonus(save, run);
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run, {completed: true});
    save.current_run = null;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: `通关！完成 ${run.wins || run.battles} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}金币${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}。`});
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
    enemyAi: enemyAiForRoute(route, enemyTrainer),
  });
  const encounteredBoss = recordBossEncounter(save, run, enemyTrainer, bossTeam, enemyDisplay);
  const stateSave = encounteredBoss ? await persist(save) : save;
  const stateRun = stateSave.current_run as CurrentRunData;
  const label = run.boss_type === "normal" ? "普通 NPC" : run.boss_type === "champion" ? "冠军" : run.boss_type === "elite4" ? "四天王" : "馆主";
  return gameState({screen: "battleMain", save: stateSave, battle: decorateBattleState(activeBattle.getState(), stateRun), battle_bag: await bagCategories(stateRun), message: `第 ${battleNo}/${run.battles} 场：${label} ${enemyTrainer.name_zh}`});
}

async function submitBattleChoice(choice: string): Promise<DesktopGameState> {
  if (battleChoiceInFlight) throw new Error("上一条战斗指令仍在处理，请稍等。");
  battleChoiceInFlight = true;
  try {
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
  const winBp = recordBattleResult(save, state.winner, run);
  run.player_state = activeBattle.getPlayerState();
  if (state.winner !== "Player") {
    const wins = Number(run.wins || 0);
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run);
    save.current_run = null;
    const next = await persist(save);
    const lossMessage = `挑战结束。连胜：${wins}${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}`;
    const transition = gameState({screen: "result", save: next, battle: decorateBattleState(state, run), message: lossMessage});
    return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(run), message: lossMessage, pending_transition: transition});
  }
  const wins = Number(run.wins || 0) + 1;
  addToExchangeBox(run, state.enemy_team || run.enemy_raw || [], state.enemy_display || run.enemy_display || []);
  const allInBonus = run.rest_status?.all_in_pending_next ? addCoins(run, currentCoins(run)) : 0;
  if (run.rest_status?.all_in_pending_next) run.rest_status = {...run.rest_status, all_in_pending_next: false};
  if (activeBattleNo >= Number(run.battles || DEFAULT_BATTLES)) {
    run.wins = wins;
    const {setStreak, bonus} = clearBonus(save, run);
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run, {completed: true});
    save.current_run = null;
    const next = await persist(save);
    const message = `通关！完成 ${wins} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}金币${allInBonus ? `，孤注一掷翻倍 +${allInBonus}金币` : ""}${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}。`;
    const transition = gameState({screen: "result", save: next, battle: decorateBattleState(state, run), message});
    return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(run), message, pending_transition: transition});
  }
  const victoryRewards = await grantVictoryRewards(run, run.boss_type !== "normal", activeBattleNo);
  save.current_run = {
    ...run,
    status: "awaiting_rest",
    battle_no: activeBattleNo,
    wins,
    enemy_raw: state.enemy_team,
    enemy_display: state.enemy_display,
    coins_earned_this_run: Number(run.coins_earned_this_run || 0) + winBp,
    bp_earned_this_run: Number(run.bp_earned_this_run || 0) + winBp,
    rest_status: freshRestStatus(run.talents, victoryRewards.restBonus),
  };
  const next = await persist(save);
  const rewardText = `本场胜利！获得 ${winBp}金币${allInBonus ? `；孤注一掷翻倍 +${allInBonus}金币` : ""}。奖励：${victoryRewards.items.join(" / ")}${victoryRewards.restBonus?.shop_slot_discounts?.length ? "；boss 商店奖励已生效" : ""}${victoryRewards.restBonus?.recycler_available ? "；道具回收商出现了" : ""}。当前连胜：${wins}`;
  const transition = await restState(next, next.current_run as CurrentRunData, rewardText);
  return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(next.current_run as CurrentRunData), message: `本场胜利！当前连胜：${wins}`, pending_transition: transition});
  } finally {
    battleChoiceInFlight = false;
  }
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
  const carryRestStatus: CurrentRunData["rest_status"] = run.rest_status?.all_in_pending_next
    ? {all_in_pending_next: true, all_in_result: run.rest_status.all_in_result || null}
    : {};
  save.current_run = {
    ...run,
    status: "ready",
    next_battle: battleNo + 1,
    rest_status: {exchanges: 0, taken_enemy_slots: [], ...carryRestStatus},
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
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run);
    refreshStats(save);
    save.current_run = null;
    activeBattle = null;
    activeBattleNo = 0;
    const next = await persist(save);
    return gameState({screen: "result", save: next, message: `本局挑战已中断，当前连胜已归零。历史最高连胜已保留。${settlementText(settled).replace(/^，/, "")}${settled.refundGained || settled.receiptBonus || settled.portfolioBonus ? "。" : ""}本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP。${settled.paidBack ? `临时BP扣回 ${settled.paidBack}BP。` : ""}`});
  }
  if (run.rest_status?.all_in_pending_next) throw new Error("孤注一掷已发动，本次休整即将结束。");

  const states = normalizePlayerState(run);
  if (action.type === "restore_hp" || action.type === "restore_pp" || action.type === "restore_status") {
    throw new Error("休整免费恢复已移除，请使用背包中的恢复道具。");
  }

  if (action.type === "bp_to_coins") {
    if (!hasTalent(run.talents, "economy_bp_exchange")) throw new Error("需要天赋「有借有换」。");
    const bp = Math.max(1, Math.floor(Number(action.bp || 0)));
    spendBp(save, bp);
    const gained = addCoins(run, bp * 50);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `有借有换：消耗 ${bp}BP，获得 ${gained}金币。`);
  }

  if (action.type === "reroute_next") {
    if (!hasTalent(run.talents, "intel_reroute")) throw new Error("需要天赋「公子驾到」。");
    if (Number(run.reroute_used || 0) >= REROUTE_LIMIT) throw new Error("本局改道次数已用尽。");
    const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
    if (nextBattleNo > Number(run.battles || DEFAULT_BATTLES)) throw new Error("本局已经没有下一场。");
    const route = routeBossForBattle(Number(save.stats?.set_win_streak || 0), nextBattleNo);
    const trainer = rerouteTrainerForRoute(route, run, nextBattleNo);
    run.forced_trainer_ids = {...(run.forced_trainer_ids || {}), [String(nextBattleNo)]: trainer.id};
    run.reroute_used = Number(run.reroute_used || 0) + 1;
    if (run.night_sky?.rows?.length) await buildNightSkyState(save, run);
    if (run.scout && Number(run.scout.title.match(/第\s*(\d+)/)?.[1] || 0) === nextBattleNo) delete run.scout;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `公子驾到：第 ${nextBattleNo} 场已改为 ${trainer.name_zh}。`);
  }

  if (action.type === "set_lead") {
    if (!hasTalent(run.talents, "growth_lead_change")) throw new Error("需要天赋「临阵换将」。");
    if (run.rest_status?.lead_change_used) throw new Error("本次休整已经调整过首发。");
    const slot = Math.floor(Number(action.slot || 0));
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    if (states[slot]?.fainted || Number(states[slot]?.hp || 0) <= 0) throw new Error("濒死宝可梦不能设为首发。");
    for (const key of ["player_team", "player_display", "player_state", "bp_investments", "move_investments"] as const) {
      const values = [...((run as any)[key] || [])];
      if (slot < values.length) [values[0], values[slot]] = [values[slot], values[0]];
      (run as any)[key] = values;
    }
    run.rest_status = {...(run.rest_status || {}), lead_change_used: true};
    normalizePlayerState(run);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, "临阵换将：首发已调整。");
  }

  if (action.type === "trust_level") {
    if (!hasTalent(run.talents, "exchange_trust")) throw new Error("需要天赋「不负信赖」。");
    if (run.rest_status?.trust_level_used) throw new Error("本次休整已经培养过信赖。");
    const slot = Math.floor(Number(action.slot || 0));
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const rawSet = {...run.player_team[slot]};
    const currentLevel = Math.max(1, Math.floor(Number(rawSet.level || run.player_display[slot]?.level || 50)));
    const nextLevel = Math.min(55, currentLevel + 2);
    const overflow = Math.max(0, currentLevel + 2 - 55);
    rawSet.level = nextLevel;
    run.player_team[slot] = rawSet;
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    run.player_state = nextStates;
    const coinText = overflow ? `，溢出 ${overflow} 级转换为 ${addRunBp(save, run, overflow * 100)}金币` : "";
    run.rest_status = {...(run.rest_status || {}), trust_level_used: true};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `不负信赖：${run.player_display[slot].species_zh || run.player_display[slot].species} 提升到 ${nextLevel} 级${coinText}。`);
  }

  if (action.type === "use_item") {
    const slot = Number(action.slot);
    if (slot < 0 || slot >= states.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const normalizedItem = itemKey(action.itemId);
    let riskText = "";
    let consumeItem = true;
    if (hasTalent(run.talents, "growth_risky")) {
      const roll = bpRiskRoll(run, `use-item:${normalizedItem}:${slot}`);
      if (roll < 0.1) {
        consumeItem = false;
        adjustBagItem(run, normalizedItem, 1);
        rememberBagItemMeta(run, await itemDetailsById(normalizedItem));
        riskText = "铤而走险触发：本次未消耗道具，并额外获得同款道具。";
      } else if (roll < 0.4) {
        consumeItem = false;
        riskText = "铤而走险触发：本次未消耗道具。";
      } else if (roll < 0.6) {
        await consumeBagItem(run, normalizedItem);
        const next = await persist(save);
        return await restState(next, next.current_run as CurrentRunData, "铤而走险触发：道具使用失败，并失去了该道具。");
      }
    }
    const item = consumeItem ? await consumeBagItem(run, normalizedItem) : await itemDetailsById(normalizedItem);
    const text = await gameService.applyConsumableItemEffectToState(item.id, states[slot], action.moveSlot);
    run.player_state = states;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, riskText ? `${riskText}${text ? ` ${text}` : ""}` : text);
  }

  if (action.type === "sell_item") {
    if (!run.rest_status?.recycler_available) throw new Error("当前没有道具回收商，不能出售道具。");
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
    run.recycle_receipt_value = Number(run.recycle_receipt_value || 0) + price;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `道具回收商回收了 ${item.name_zh || item.name}，获得 ${gained}金币。`);
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
    const spent = spendRunBp(save, run, cost, "exchange");
    const investments = run.bp_investments || [0, 0, 0];
    const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    const oldItem = itemKey(run.player_display[action.ownIndex]?.item_id || run.player_team[action.ownIndex]?.item);
    if (oldItem) run.bag_items = {...(run.bag_items || {}), [oldItem]: Number(run.bag_items?.[oldItem] || 0) + 1};
    const keepItem = exchangeKeepsItem(run);
    const oldRaw = JSON.parse(JSON.stringify(run.player_team[action.ownIndex]));
    const oldDisplay = JSON.parse(JSON.stringify(run.player_display[action.ownIndex]));
    const oldState = JSON.parse(JSON.stringify(states[action.ownIndex]));
    let nextRaw: PokemonSet = {...run.enemy_raw[action.enemyIndex], item: keepItem ? run.enemy_raw[action.enemyIndex].item : ""};
    let nextDisplayBase: RentalPokemon = keepItem ? {...run.enemy_display[action.enemyIndex]} : {...run.enemy_display[action.enemyIndex], item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
    if (hasTalent(run.talents, "exchange_elite_training")) {
      const currentTier = Math.max(1, Math.min(4, Number(nextDisplayBase.stage_tier || nextRaw.stage_tier || 1)));
      const profile = `tier${Math.min(4, currentTier + 1)}` as GenerationProfile;
      const speciesId = nextDisplayBase.species_id || nextRaw.species;
      const upgraded = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), 0xe300 + own * 41 + foe * 97 + exchanges), "gen7randombattle", 1, {profiles: [profile], speciesIds: [speciesId], purpose: "normal"});
      const template = upgraded.team[0];
      if (template) {
        nextRaw = {
          ...nextRaw,
          level: template.level,
          ivs: template.ivs,
          evs: template.evs,
          nature: template.nature,
          stage_tier: template.stage_tier,
          species_tier: template.species_tier,
          generation_profile: template.generation_profile,
        };
        const [described] = await gameService.describeTeam([nextRaw]);
        nextDisplayBase = described || nextDisplayBase;
        if (!keepItem) nextDisplayBase = {...nextDisplayBase, item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
      }
    }
    run.player_team[action.ownIndex] = hasTalent(run.talents, "economy_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
    run.player_display[action.ownIndex] = hasTalent(run.talents, "economy_shiny_collector") ? shinyPokemon(nextDisplayBase) : nextDisplayBase;
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
    return await restState(next, next.current_run as CurrentRunData, `已交换，${spent.message}。新宝可梦以${stateText}加入，且${itemText}${hasTalent(run.talents, "exchange_elite_training") ? "；英才教育已提升品质" : ""}。`);
  }

  if (action.type === "box_exchange") {
    throw new Error("旧版保险盒天赋已移除。");
  }

  if (action.type === "all_in_exchange") {
    if (!hasTalent(run.talents, "growth_all_in")) throw new Error("需要天赋「孤注一掷」。");
    if (run.all_in_exchange_used) throw new Error("本局已经使用过孤注一掷。");
    const own = Number(action.ownIndex);
    if (own < 0 || own >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
    const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), 0xa111 + nextBattleNo * 17 + own), "gen7randombattle", 1, {profiles: ["tier4"], purpose: "normal"});
    const nextRaw = generated.team[0];
    const nextDisplay = generated.display[0];
    if (!nextRaw || !nextDisplay) throw new Error("孤注一掷生成失败。");
    const oldName = run.player_display[own]?.species_zh || run.player_display[own]?.species || `第 ${own + 1} 只`;
    addToExchangeBox(run, [run.player_team[own]], [run.player_display[own]], [states[own]]);
    run.player_team[own] = hasTalent(run.talents, "economy_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
    run.player_display[own] = hasTalent(run.talents, "economy_shiny_collector") ? shinyPokemon(nextDisplay) : nextDisplay;
    run.player_state = normalizePlayerState(run);
    run.player_state[own] = fullStateForPokemon(run.player_display[own], own + 1);
    for (let index = 0; index < run.player_state.length; index += 1) {
      if (index === own) continue;
      const state = run.player_state[index];
      state.hp = Math.max(1, Math.floor(state.maxhp / 2));
      state.status = "slp";
      refreshStateCondition(state);
    }
    const investments = run.bp_investments || [0, 0, 0];
    const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    investments[own] = 0;
    moveInvestments[own] = [0, 0, 0, 0];
    run.bp_investments = investments;
    run.move_investments = moveInvestments;
    run.all_in_exchange_used = true;
    const newName = run.player_display[own]?.species_zh || run.player_display[own]?.species || "未知宝可梦";
    run.rest_status = {
      ...(run.rest_status || {}),
      all_in_pending_next: true,
      all_in_result: {old_name: oldName, new_name: newName},
    };
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `孤注一掷发动：${oldName} 被替换成了 ${newName}。另外两只宝可梦已变为半血并陷入睡眠，即将结束休整。`);
  }

  if (action.type === "buy_item") {
    const itemId = itemKey(action.itemId);
    const cost = await goodsCost("item", itemId, 5 * BP_SCALE);
    const spent = spendRunBp(save, run, cost, `buy-item:${itemId}`);
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    rememberBagItemMeta(run, await itemDetailsById(itemId));
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已购买道具，${spent.message}。`);
  }

  if (action.type === "roll_shop") {
    if (action.preferredCategory && !hasTalent(run.talents, "intel_shop_strategy")) throw new Error("需要天赋「神机妙算」。");
    const preferCost = action.preferredCategory ? spendRunBp(save, run, SHOP_PREFERRED_ROLL_COST, `shop-prefer:${action.preferredCategory}`) : null;
    const cost = shopNextRollCost(run);
    const spent = spendRunBp(save, run, cost, "shop-roll");
    if (Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0 && cost <= 0) {
      run.rest_status = {...(run.rest_status || {}), free_shop_rolls_remaining: Math.max(0, Number(run.rest_status?.free_shop_rolls_remaining || 0) - 1)};
    }
    run.rest_status = {...(run.rest_status || {}), free_shop_roll_used: true, shop_preferred_roll_used: Boolean(action.preferredCategory)};
    run.shop_roll_count = Number(run.shop_roll_count || 0) + 1;
    run.shop_offers = await rollShopOffers(run, action.preferredCategory);
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
    return await restState(next, next.current_run as CurrentRunData, `${bonusText}${preferCost ? ` 神机妙算：${preferCost.message}。` : ""}${spent.paid || cost ? ` 抽奖${spent.message}。` : ""}`);
  }

  if (action.type === "buy_shop_offer") {
    if (run.shop_purchased_offer_id) throw new Error("本次抽奖已经购买过商品，请重新抽奖。");
    const offer = (run.shop_offers || []).find(item => item.offer_id === action.offerId);
    if (!offer) throw new Error("商品不存在，请先刷新商店。");
    const itemId = itemKey(offer.id || offer.name);
    const spent = spendRunBp(save, run, Number(offer.cost || 0), `shop-buy:${itemId}`, {alreadyPriced: true});
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    rememberBagItemMeta(run, offer);
    run.shop_purchased_offer_id = offer.offer_id;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已购买 ${offer.name_zh || offer.name}，${spent.message}。`);
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
    const spent = spendRunBp(save, run, cost, "draw-moves");
    const rawSet = run.player_team[slot];
    const currentMoves = new Set((rawSet.moves || []).map((move: string) => toId(move)));
    const legalMoves = (await gameService.learnableMoves(rawSet)).filter(move => !currentMoves.has(toId(move.id || move.name)));
    const rng = seededRng(Number(run.seed || 1), 0x7100 + slot * 17 + action.moveSlot * 101 + Number(run.battle_no || 0));
    const draws = shuffleByRng(legalMoves, rng).slice(0, moveDrawCount(run));
    run.move_draws = {...(run.move_draws || {}), [`${slot}:${action.moveSlot}`]: draws};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已抽取 ${draws.length} 个候选技能，${spent.message}。`);
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

  if (action.type === "scout_next") {
    if (!hasTalent(run.talents, "intel_rumor")) throw new Error("需要天赋「小道消息」。");
    const level = action.level === "all" ? "all" : "one";
    if (level === "one" && run.rest_status?.free_scout_used) throw new Error("本次休整已经使用过免费侦查。");
    const cost = level === "all" ? SCOUT_ALL_COST : SCOUT_ONE_COST;
    const spent = spendRunBp(save, run, cost, "scout-next");
    const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
    const preview = await generateOpponentPreview(save, run, nextBattleNo);
    const enemyPool = preview.enemies;
    const enemies = level === "one" ? [enemyPool[Math.floor(seededRng(Number(run.seed || 1), 0x5c07 + nextBattleNo * 19)() * enemyPool.length)]].filter(Boolean) : enemyPool;
    run.scout = {level, title: `第 ${nextBattleNo}/${run.battles} 场：${preview.label}`, summary: `下一场对手是 ${preview.trainer.name_zh}。`, enemies};
    if (level === "one") run.rest_status = {...(run.rest_status || {}), free_scout_used: true};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已侦查下一场，${spent.message}。`);
  }

  if (action.type === "night_sky_scout") {
    if (!hasTalent(run.talents, "intel_rumor")) throw new Error("需要天赋「小道消息」。");
    const battleNo = Math.max(1, Math.min(Number(run.battles || DEFAULT_BATTLES), Number(action.battleNo || 1)));
    await buildNightSkyState(save, run);
    const rows = run.night_sky?.rows || [];
    const row = rows.find(entry => Number(entry.battle_no) === battleNo);
    if (!row) throw new Error("没有找到这场训练师信息。");
    if (action.level === "one") {
      if (Number(row.revealed || 0) >= 1) throw new Error("这一行已经免费查看过。");
      row.revealed = 1;
      row.unlocked = false;
    } else {
      if (!row.unlocked) spendRunBp(save, run, SCOUT_ALL_COST, `night-sky:${battleNo}`);
      row.revealed = 3;
      row.unlocked = true;
    }
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, action.level === "one" ? "小道消息：已揭示一只宝可梦。" : "小道消息：已解锁这一场完整阵容。");
  }

  if (action.type === "randomize_stat_part" || action.type === "randomize_all_stats") {
    const slot = action.slot;
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const baseCost = action.type === "randomize_all_stats" ? RANDOMIZE_ALL_COST : RANDOMIZE_PART_COST;
    const cost = statResetCost(run, baseCost, action.type === "randomize_all_stats" ? "all" : action.part);
    const spent = spendRunBp(save, run, cost, "randomize-stats");
    await applyRandomizedStats(run, slot, action.type === "randomize_all_stats" ? "all" : action.part);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已随机重置，${spent.message}。`);
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
    if (currentCoins(run) + refund < pricedForRun(run, cost)) throw new Error(`金币不足，需要 ${pricedForRun(run, cost)}金币；旧技能可返还 ${refund}金币。`);
    currentMoves[moveSlot] = selected.name || selected.id;
    rawSet.moves = currentMoves;
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    if (refund) addCoins(run, refund);
    const spent = spendRunBp(save, run, cost, "adjust-move");
    run.player_team[slot] = rawSet;
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    run.player_state = nextStates;
    moveInvestments[slot] = moveInvestments[slot] || [0, 0, 0, 0];
    moveInvestments[slot][moveSlot] = spent.paid;
    run.move_investments = moveInvestments;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已学习 ${selected.name_zh}，${spent.message}${refund ? `，返还 ${refund}金币` : ""}。`);
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
    const spent = spendRunBp(save, run, cost, "adjust-stats");
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    run.player_team[slot] = rawSet;
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    run.player_state = nextStates;
    const investments = run.bp_investments || [0, 0, 0];
    investments[slot] = Number(investments[slot] || 0) + spent.paid;
    run.bp_investments = investments;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已保存能力值调整，${spent.message}。`);
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

async function dexSearch(category: DesktopDexCategory, query = "", offset = 0, limit = 8): Promise<DesktopDexSearchResult> {
  if (category === "trainers") return trainerDexSearch(await loadSave(), query, offset, limit);
  return gameService.dexSearch(category, query, offset, limit);
}

app.whenReady().then(() => {
  installChineseMenu();
  saveStore = new SaveStore(app.getPath("userData"));
  protocol.handle("changebattle-asset", async request => {
    const url = new URL(request.url);
    const rawPath = decodeURIComponent(url.pathname.replace(/^\//, ""));
    try {
      const {filePath, bytes} = await readAssetFile(rawPath);
      return new Response(new Uint8Array(bytes), {headers: {"content-type": contentTypeFor(filePath)}});
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? Number((error as {status?: number}).status) : 404;
      return new Response(status === 403 ? "Forbidden" : "Not found", {status});
    }
  });

  ipcMain.handle("save:load", async () => loadSave());
  ipcMain.handle("save:createNew", async (_event, trainer: TrainerProfile) => saveStore!.createNew(normalizeTrainerProfile(trainer)));
  ipcMain.handle("save:updateTrainer", async (_event, trainer: TrainerProfile) => saveStore!.updateTrainer(normalizeTrainerProfile(trainer)));
  ipcMain.handle("trainer:catalog", async () => trainerCatalogState());
  ipcMain.handle("game:generateCandidates", async (_event, seed?: number) => gameService.generateRentalCandidates(seed || Date.now()));
  ipcMain.handle("run:prepareStarterItems", async (_event, seed?: number) => prepareStarterItems(seed));
  ipcMain.handle("run:chooseStarterItem", async (_event, offerId?: string | null) => chooseStarterItem(offerId || null));
  ipcMain.handle("run:cancelPreparation", async () => cancelPreparation());
  ipcMain.handle("talents:get", async () => talentConfig());
  ipcMain.handle("talents:unlock", async (_event, id: string) => unlockTalent(id));
  ipcMain.handle("talents:configure", async (_event, ids: string[]) => configureTalents(ids));
  ipcMain.handle("talents:setNamedChallenge", async (_event, trainerId: string | null) => setNamedChallenge(trainerId));
  ipcMain.handle("starterUpgrades:get", async () => starterUpgradeConfig());
  ipcMain.handle("starterUpgrades:upgrade", async (_event, id: string) => upgradeStarter(id));
  ipcMain.handle("run:prepareCandidates", async (_event, seed?: number) => prepareCandidates(seed));
  ipcMain.handle("run:rerollStarterCandidate", async (_event, index: number) => rerollStarterCandidate(index));
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
  ipcMain.handle("dex:search", async (_event, category: DesktopDexCategory, query?: string, offset?: number, limit?: number) => dexSearch(category, query || "", offset || 0, limit || 8));
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
