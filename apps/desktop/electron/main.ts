import {app, BrowserWindow, Menu, ipcMain, protocol} from "electron";
import {randomUUID} from "node:crypto";
import {appendFileSync, existsSync, mkdirSync, readFileSync} from "node:fs";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {GameService, type BattleAiPersonality, type BattleAiProfileInput, type TrainerItemBattleSession} from "@changebattle/game-service";
import type {BagCategoryView, BattleBackgroundView, BattleRecordEntry, BattleRulePreset, BattleSetting, BattleState, BattleTimelineEvent, BossDexPoolRow, BossDexRecord, BossDexSeenPokemon, CurrentRunData, DesktopDexCategory, DesktopDexEntry, DesktopDexSearchResult, DesktopGameState, GeneratedTeam, ItemCategory, LocalSave, MoveSummary, PlannedBattleData, PlayerPokemonState, PokemonEditOptions, PokemonSet, PricedMove, RentalPokemon, RestAction, RestEventOption, RestState, ResultPokemonStatEvent, ResultPokemonSummary, ResultSummaryState, ShopItem, ShopOffer, StarChartState, StarterItemGroup, StarterItemGroupState, StarterUpgradeState, StarterUpgradeView, TalentView, TrainerCatalogState, TrainerNpcType, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, SHOWDOWN_ID_POOL, normalizeBattleSetting} from "@changebattle/shared";
import {
  ADJUST_STATS_COST,
  BADGE_LEVEL_CAPS,
  BP_SCALE,
  DEFAULT_BATTLES,
  RANDOMIZE_ALL_COST,
  RANDOMIZE_PART_COST,
  REROUTE_LIMIT,
  RECYCLE_RECEIPT_RATE,
  REST_HP_COSTS,
  REST_PP_COSTS,
  REST_STATUS_COSTS,
  SCOUT_ALL_COST,
  SCOUT_BASIC_COST,
  SCOUT_ONE_COST,
  SHOP_GUEST_FREE_ROLLS,
  STARTER_ITEM_GROUPS,
  STARTER_ITEM_MAX_LEVEL,
  STAR_CHART_NODE_BY_ID,
  STAR_CHART_NODES,
  TALENTS,
  TRUST_OVERFLOW_COIN_PER_LEVEL,
  WIN_BP_REWARD,
  addBp,
  addRunBp,
  addCoins,
  applyProphetFirstMover,
  bagRefundRate,
  canExchangeBoss,
  candidateCountForTalents,
  clearBonus,
  coinsToBp,
  convertibleCoinsForSettlement,
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
  normalizeStarChart,
  portfolioBonus,
  pricedForRun,
  pricedForShop,
  recordPortfolioSpend,
  refreshStats,
  sellPriceForItem,
  settleProphetFirstMover,
  shopDuplicateBonusForOffers,
  shopCandidateCount,
  shopOfferCount,
  spendBp,
  spendCoins,
  starterCoinsForSeed,
  starterNonConvertibleCoinsForTalents,
  starterUpgradeCatalog,
  starterUpgradeCost,
  starterUpgradeLevel,
  starChartCatalog,
  starNodeLevel,
  starNodeUnlocked,
  starNodeUpgradeCost,
  starterUpgradesForStarChart,
  statResetCost,
  talentsForIds,
  talentsForStarChart,
  talentLevel,
  toId,
} from "./run-rules.js";
import {SaveStore} from "./save-store.js";

declare const __dirname: string;

const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const CHAMPION_BACKGROUND_ID = "champion-stage";
const FALLBACK_BATTLE_BACKGROUND: BattleBackgroundView = {id: "mountain-route", name: "山地", src: "assets/battle-backgrounds/mountain-route.png"};
const e2eUserDataDir = process.env.CHANGEBATTLE_E2E_USER_DATA_DIR;
const e2eRemoteDebuggingPort = process.env.CHANGEBATTLE_E2E_REMOTE_DEBUGGING_PORT;
const e2eEnabled = process.env.CHANGEBATTLE_E2E === "1";

if (e2eUserDataDir) {
  app.setPath("userData", e2eUserDataDir);
}
if (e2eRemoteDebuggingPort) {
  app.commandLine.appendSwitch("remote-debugging-port", e2eRemoteDebuggingPort);
  app.commandLine.appendSwitch("remote-allow-origins", "*");
}

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
const desktopLogEnabled = process.env.CHANGEBATTLE_DISABLE_LOG !== "1";
const desktopLogDir = process.env.CHANGEBATTLE_LOG_DIR || path.join(projectRoot, "logs");
const desktopLogStamp = new Date().toISOString().replace(/[:.]/g, "-");
const desktopLogFile = process.env.CHANGEBATTLE_LOG_FILE || path.join(desktopLogDir, `desktop-debug-${desktopLogStamp}.jsonl`);
const battleLogFile = process.env.CHANGEBATTLE_BATTLE_LOG_FILE || path.join(desktopLogDir, `battle-${desktopLogStamp}.json`);
const desktopDebugLogEnabled = process.env.CHANGEBATTLE_DESKTOP_DEBUG_LOG === "1";
if (desktopLogEnabled) {
  process.env.CHANGEBATTLE_LOG_FILE = desktopLogFile;
  process.env.CHANGEBATTLE_BATTLE_LOG_FILE = battleLogFile;
  process.env.CHANGEBATTLE_DEBUG_SHOWDOWN ||= "0";
}

function logJson(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => entry instanceof Error ? {name: entry.name, message: entry.message, stack: entry.stack} : entry);
}

function logLine(scope: string, message: string, data?: unknown): void {
  if (!desktopLogEnabled || !desktopDebugLogEnabled) return;
  try {
    mkdirSync(path.dirname(desktopLogFile), {recursive: true});
    appendFileSync(desktopLogFile, `${logJson({ts: new Date().toISOString(), scope, event: message, data})}\n`, "utf8");
  } catch {
    // Logging must never break the game loop.
  }
}

function handleIpc(channel: string, handler: (...args: any[]) => Promise<unknown> | unknown): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    logLine("ipc", `${channel}:start`, {args});
    try {
      const result = await handler(...args);
      logLine("ipc", `${channel}:ok`);
      return result;
    } catch (error) {
      logLine("ipc", `${channel}:error`, error);
      throw error;
    }
  });
}

logLine("desktop", "startup", {argv: process.argv, projectRoot, logFile: desktopLogFile, battleLogFile, showdownDebug: process.env.CHANGEBATTLE_DEBUG_SHOWDOWN});
process.on("uncaughtException", error => logLine("process", "uncaughtException", error));
process.on("unhandledRejection", error => logLine("process", "unhandledRejection", error));

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
  battleSetting: BattleSetting;
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

type TalentConfigState = {catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null};
type StarterUpgradeConfigState = {catalog: StarterUpgradeView[]; save?: LocalSave | null};
type BossRoute = {type: "normal" | "gym" | "champion" | "elite4"; stage: string; route: string; pool: Array<{type: TrainerNpcType; tier?: string}>};
type GenerationProfile = "tier1" | "tier2" | "tier3" | "tier4" | "champion";
type SpeciesTier = 1 | 2 | 3 | 4 | 5 | 6 | 10;
type ShopKind = "recovery" | "held" | "tm";
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
type BossTeamPoolRow = {pool_id: string; battle_rule_preset: BattleRulePreset; trainer_id: string; team_index: number; slot: number; species_id: string; species?: string; species_tier?: SpeciesTier; generation_profile: GenerationProfile};

const SHOP_BUCKET_WEIGHTS: Record<ShopPoolBucket, number> = {
  healing: 65,
  pp: 15,
  berry: 10,
  tm: 5,
  held: 5,
};

const SHOP_KIND_CONFIG: Record<ShopKind, {title: string; theme: "green" | "blue" | "purple"; rollCost: number; buckets: ShopPoolBucket[]}> = {
  recovery: {title: "回复商店", theme: "green", rollCost: 50, buckets: ["healing", "berry", "pp"]},
  held: {title: "道具商店", theme: "blue", rollCost: 75, buckets: ["held"]},
  tm: {title: "技能商店", theme: "purple", rollCost: 75, buckets: ["tm"]},
};
const SPECIAL_FORGE_COST = 50;
const TERA_ORB_TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
const TERA_ORB_TYPE_ZH: Record<string, string> = {Normal: "一般", Fire: "火", Water: "水", Electric: "电", Grass: "草", Ice: "冰", Fighting: "格斗", Poison: "毒", Ground: "地面", Flying: "飞行", Psychic: "超能力", Bug: "虫", Rock: "岩石", Ghost: "幽灵", Dragon: "龙", Dark: "恶", Steel: "钢", Fairy: "妖精"};

const GUARANTEED_SHOP_ITEMS: Array<{id: string; cost: number}> = [
  {id: "potion", cost: 20},
  {id: "superpotion", cost: 50},
  {id: "hyperpotion", cost: 120},
  {id: "maxpotion", cost: 160},
  {id: "fullrestore", cost: 200},
  {id: "revive", cost: 120},
  {id: "maxrevive", cost: 200},
  {id: "revivalherb", cost: 160},
  {id: "fullheal", cost: 30},
  {id: "healpowder", cost: 20},
  {id: "antidote", cost: 10},
  {id: "burnheal", cost: 10},
  {id: "iceheal", cost: 10},
  {id: "awakening", cost: 10},
  {id: "paralyzeheal", cost: 10},
];
const SHOP_REPEAT_PURCHASE_SURCHARGE = 10;

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

type RestEventDefinition = RestEventOption & {
  apply(save: LocalSave, run: CurrentRunData): Promise<string>;
};

const REST_EVENT_DEFINITIONS: RestEventDefinition[] = [
  {
    id: "recycler_appraisal",
    name: "旧货估价",
    desc: "本次休整解锁道具回收商。",
    detail: "只有选择这张奇遇后，休整栏才会出现道具回收商按钮。讲价高手会提高本次出售价格。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), recycler_available: true};
      return "旧货估价：道具回收商来到了休整区。";
    },
  },
  {
    id: "sponsor_delivery",
    name: "赞助到账",
    desc: "立刻获得 120 金币。",
    detail: "稳定补一点运营预算，但不直接给回复道具。",
    tone: "safe",
    async apply(_save, run) {
      const gained = addCoins(run, 120);
      return `赞助到账：获得 ${gained}金币。`;
    },
  },
  {
    id: "clinic_coupon",
    name: "诊所抵用券",
    desc: "本次休整获得 1 次免费商店抽奖。",
    detail: "不会直接恢复队伍，可以优先用在回复商店找续航。",
    tone: "safe",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), free_shop_rolls_remaining: Number(run.rest_status?.free_shop_rolls_remaining || 0) + 1};
      return "诊所抵用券：本次休整获得 1 次免费商店抽奖。";
    },
  },
  {
    id: "countryside",
    name: "田园风光",
    desc: "随机恢复两只未濒死宝可梦到满状态，但本次休整没有商店。",
    detail: "适合队伍残血时救急；商店整轮关闭。",
    tone: "trade",
    async apply(_save, run) {
      const restored = restoreRandomPartyMembers(run, 2, "countryside");
      run.rest_status = {...(run.rest_status || {}), event_shop_disabled: true};
      return `田园风光：${restored || "没有"}宝可梦恢复到满状态，本次休整商店关闭。`;
    },
  },
  {
    id: "bad_doctor_brothers",
    name: "蹩脚医生兄弟",
    desc: "选择哥哥或弟弟的一种治疗方案。",
    detail: "哥哥治异常和 PP 但扣血；弟弟救 HP 但附带异常。",
    tone: "risk",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_doctor_pending: true};
      return "蹩脚医生兄弟：请选择哥哥或弟弟的治疗方案。";
    },
  },
  {
    id: "blood_donation",
    name: "献血光荣",
    desc: "全队未濒死宝可梦扣除 1/4 当前 HP，获得 200 金币。",
    detail: "至少保留 1 HP，濒死宝可梦不参与。",
    tone: "trade",
    async apply(_save, run) {
      const count = damagePartyFraction(run, 0.25);
      const gained = addCoins(run, 200);
      return `献血光荣：${count} 只宝可梦贡献了体力，获得 ${gained}金币。`;
    },
  },
  {
    id: "major_surgery",
    name: "重伤手术",
    desc: "本次低级恢复道具失效；下次休整全队满状态。",
    detail: "全满药、全复药、复活和 PP 药剂仍可用。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_low_tier_recovery_disabled: true, event_pending_full_restore: true};
      return "重伤手术：本次低级恢复道具失效，下次休整全队恢复满状态。";
    },
  },
  {
    id: "power_outage_profiteer",
    name: "乘火打劫",
    desc: "本次恢复效果减半，商店抽奖和购买价格提高。",
    detail: "纯负面事件，商店价格为 1.5 倍。",
    tone: "risk",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_recovery_multiplier: 0.5, event_shop_price_multiplier: 1.5};
      return "乘火打劫：本次休整恢复减半，商店价格上涨。";
    },
  },
  {
    id: "potion_trial",
    name: "药剂试喝",
    desc: "随机获得一种轻恢复，并额外获得 50 金币。",
    detail: "可能全队回血、解异常，或随机一只满状态。",
    tone: "safe",
    async apply(_save, run) {
      const result = applyPotionTrial(run);
      const gained = addCoins(run, 50);
      return `药剂试喝：${result}，获得 ${gained}金币补贴。`;
    },
  },
  {
    id: "camping_pot",
    name: "露营锅",
    desc: "把背包内所有树果转换成回复药类道具。",
    detail: "至少需要 3 个树果；不足时仍消耗树果但不产药，并令队伍饥饿，本次休整和下一战背包恢复减半。",
    tone: "trade",
    async apply(_save, run) {
      const text = await convertBerriesToMedicine(run);
      return `露营锅：${text}`;
    },
  },
  {
    id: "forgetful_river_god",
    name: "健忘的河神",
    desc: "30% 没收 1/4 背包道具，20% 道具翻倍，50% 无事发生。",
    detail: "不影响宝可梦当前携带物，特殊系统道具默认受保护。",
    tone: "risk",
    async apply(_save, run) {
      return applyRiverGod(run);
    },
  },
  {
    id: "safe_airline",
    name: "安全航空",
    desc: "落地后全队恢复满状态，但普通战斗携带道具会被托运。",
    detail: "会卸下宝可梦身上的普通战斗道具；下次休整归还到背包。",
    tone: "trade",
    async apply(_save, run) {
      const count = await checkBattleItems(run);
      const restored = fullRestoreParty(run);
      return `安全航空：${restored} 只宝可梦落地后恢复满状态，${count} 个普通战斗道具已托运，下次休整归还到背包。`;
    },
  },
  {
    id: "barter_village",
    name: "以物易物",
    desc: "商店抽奖免费，购买只能用背包道具交换。",
    detail: "材料价值需达到商品价格 70%，不找零。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_barter_active: true};
      return "以物易物：本次商店抽奖免费，购买只能用背包道具交换。";
    },
  },
  {
    id: "devil_treasure",
    name: "飞天魔鬼的宝藏",
    desc: "获得高等级战斗道具和 1000 金币，但恢复道具被诅咒。",
    detail: "本次休整与下一战不能使用 HP/异常/复活类背包恢复道具。",
    tone: "risk",
    async apply(_save, run) {
      const rewards = await grantDevilTreasure(run);
      const gained = addCoins(run, 1000);
      run.rest_status = {...(run.rest_status || {}), event_rest_healing_blocked: true, event_next_battle_healing_blocked: true};
      return `飞天魔鬼的宝藏：获得 ${rewards.join("、")} 和 ${gained}金币，但恢复道具受到诅咒。`;
    },
  },
  {
    id: "contest_stage",
    name: "华丽大赛",
    desc: "下一战按裁判喜欢/讨厌的技能累积华丽分。",
    detail: "胜利后按分数给金币；高分战败会被裁判判作成功。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_contest_next: buildContestMarks(run)};
      return "华丽大赛：下一战将出现裁判喜欢和讨厌的技能。";
    },
  },
  {
    id: "tutor_granny",
    name: "讲师老奶奶",
    desc: "本次休整可花 200 金币学习 1 个教授招式。",
    detail: "只显示当前宝可梦合法且未掌握的 tutor 来源招式。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_tutor_service_available: true};
      return "讲师老奶奶：本次休整解锁教授招式学习服务。";
    },
  },
  {
    id: "daycare_grandpa",
    name: "培育屋爷爷",
    desc: "本次休整可花 200 金币学习 1 个遗传招式。",
    detail: "只显示当前宝可梦合法且未掌握的 egg 来源招式。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_egg_service_available: true};
      return "培育屋爷爷：本次休整解锁遗传招式学习服务。";
    },
  },
  {
    id: "last_minute_escape",
    name: "临阵脱逃",
    desc: "队内一只宝可梦离队，补发同物种同档位的新个体。",
    detail: "配置会重随，可能变好也可能变坏。",
    tone: "risk",
    async apply(_save, run) {
      if ((run.player_team || []).length <= 1) return "临阵脱逃：队伍人数太少，工厂没有触发替换。";
      return replaceEscapedPokemon(run);
    },
  },
  {
    id: "scary_raid",
    name: "骇人奇袭",
    desc: "查看下一场完整队伍，并允许和对方交换 1 只宝可梦。",
    detail: "包括馆主、四天王和冠军；交换后小道消息与真实队伍同步。",
    tone: "trade",
    async apply(_save, run) {
      const battleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
      run.rest_status = {...(run.rest_status || {}), event_raid_exchange_available: true, event_raid_exchange_battle_no: battleNo};
      await revealNightSkyBattle(_save, run, battleNo);
      return `骇人奇袭：已解锁第 ${battleNo} 场完整队伍和一次奇袭交换。`;
    },
  },
  {
    id: "invisible_hand",
    name: "看不见的大手",
    desc: "后续未锁定对手重新随机。",
    detail: "会刷新小道消息；命名冠军不被替换。",
    tone: "risk",
    async apply(save, run) {
      const count = await rerandomizeFutureBattles(save, run);
      return `看不见的大手：${count} 场未来对手已被重新安排。`;
    },
  },
  {
    id: "soul_swap",
    name: "灵魂互换",
    desc: "下一战双方操作队伍互换，胜负仍按原阵营结算。",
    detail: "如果你操作 NPC 队伍打赢自己的原队伍，本局按挑战失败处理。",
    tone: "risk",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_soul_swap_next: true};
      return "灵魂互换：下一战你将操作对手队伍，胜负按原阵营结算。";
    },
  },
  {
    id: "reluctant_team",
    name: "恋恋不舍",
    desc: "本次休整无法交换宝可梦，获得 4 点可分配等级。",
    detail: "等级分配仍受徽章权限上限限制。",
    tone: "trade",
    async apply(_save, run) {
      run.rest_status = {...(run.rest_status || {}), event_exchange_disabled: true, event_level_points: Number(run.rest_status?.event_level_points || 0) + 4};
      return "恋恋不舍：本次无法交换宝可梦，获得 4 点可分配等级。";
    },
  },
];

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
    named_challenge_decided: Boolean(extra.named_challenge_decided),
  };
}

function carryRestStatusForBattle(run: CurrentRunData): CurrentRunData["rest_status"] {
  const status = run.rest_status || {};
  return {
    ...(status.all_in_pending_next ? {all_in_pending_next: true, all_in_result: status.all_in_result || null} : {}),
    ...(Number(status.event_recovery_multiplier || 1) < 1 ? {event_recovery_multiplier: status.event_recovery_multiplier, event_hungry: Boolean(status.event_hungry)} : {}),
    ...(status.event_pending_full_restore ? {event_pending_full_restore: true} : {}),
    ...(status.event_checked_bag_items ? {event_checked_bag_items: status.event_checked_bag_items} : {}),
    ...(status.event_next_battle_healing_blocked ? {event_next_battle_healing_blocked: true} : {}),
    ...(status.event_contest_next ? {event_contest_next: status.event_contest_next} : {}),
    ...(status.event_soul_swap_next ? {event_soul_swap_next: true} : {}),
    ...(status.event_rerandomized_locked_battles?.length ? {event_rerandomized_locked_battles: status.event_rerandomized_locked_battles} : {}),
  };
}

function carryRestStatusAfterBattle(run: CurrentRunData, extra: CurrentRunData["rest_status"] = {}): CurrentRunData["rest_status"] {
  const status = run.rest_status || {};
  return {
    ...extra,
    ...(status.event_pending_full_restore ? {event_pending_full_restore: true} : {}),
    ...(status.event_checked_bag_items ? {event_checked_bag_items: status.event_checked_bag_items} : {}),
    ...(status.event_rerandomized_locked_battles?.length ? {event_rerandomized_locked_battles: status.event_rerandomized_locked_battles} : {}),
  };
}

function restEventView(event: RestEventDefinition | RestEventOption): RestEventOption {
  return {id: event.id, name: event.name, desc: event.desc, detail: event.detail, tone: event.tone};
}

function ensureRestEventOptions(run: CurrentRunData): void {
  if (run.status !== "awaiting_rest") return;
  if (run.rest_status?.rest_event_selected_id) return;
  if (run.rest_status?.rest_event_options?.length) return;
  const rng = seededRng(Number(run.seed || 1), 0x7e57 + Number(run.battle_no || 0) * 173 + Number(run.next_battle || 1) * 37 + Number(run.wins || 0) * 19);
  const pool = REST_EVENT_DEFINITIONS.filter(event => event.id !== "last_minute_escape" || (run.player_team || []).length > 1);
  const picked = shuffleByRng(pool, rng).slice(0, 3).map(restEventView);
  run.rest_status = {...(run.rest_status || {}), rest_event_options: picked, rest_event_selected_id: null};
}

function restEventRequired(run: CurrentRunData): boolean {
  return run.status === "awaiting_rest" && Boolean(run.rest_status?.rest_event_options?.length) && !run.rest_status?.rest_event_selected_id;
}

async function chooseRestEvent(save: LocalSave, run: CurrentRunData, eventId: string): Promise<string> {
  ensureRestEventOptions(run);
  if (!restEventRequired(run)) throw new Error("当前没有待选择的休整奇遇。");
  const rawId = String(eventId || "").trim();
  const normalizedId = toId(rawId);
  const option = run.rest_status?.rest_event_options?.find(event => event.id === rawId || toId(event.id) === normalizedId);
  if (!option) throw new Error("休整奇遇不存在。");
  const event = REST_EVENT_DEFINITIONS.find(entry => entry.id === option.id || toId(entry.id) === normalizedId);
  if (!event) throw new Error("休整奇遇配置缺失。");
  run.rest_status = {...(run.rest_status || {}), rest_event_selected_id: event.id};
  return event.apply(save, run);
}

function eventRng(run: CurrentRunData, label: string, extra = 0): () => number {
  const salt = 0xe700 + Number(run.battle_no || run.next_battle || 0) * 193 + toId(label).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + extra * 997;
  return seededRng(Number(run.seed || 1), salt);
}

function fullRestoreState(state: PlayerPokemonState): void {
  state.hp = Math.max(1, Number(state.maxhp || 1));
  state.status = "";
  state.moves = (state.moves || []).map(move => ({...move, pp: Math.max(0, Number(move.maxpp || move.pp || 0))}));
  refreshStateCondition(state);
}

function fullRestoreParty(run: CurrentRunData): number {
  const states = normalizePlayerState(run);
  for (const state of states) fullRestoreState(state);
  run.player_state = states;
  return states.length;
}

function restoreRandomPartyMembers(run: CurrentRunData, count: number, label: string): string {
  const states = normalizePlayerState(run);
  const rng = eventRng(run, label);
  const candidates = states.map((state, index) => ({state, index})).filter(entry => !entry.state.fainted && entry.state.hp > 0);
  const picked = shuffleByRng(candidates, rng).slice(0, Math.max(0, count));
  for (const entry of picked) fullRestoreState(entry.state);
  run.player_state = states;
  return picked.map(entry => run.player_display[entry.index]?.species_zh || run.player_display[entry.index]?.species || `第 ${entry.index + 1} 只`).join("、");
}

function damagePartyFraction(run: CurrentRunData, fraction: number): number {
  const states = normalizePlayerState(run);
  let count = 0;
  for (const state of states) {
    if (state.fainted || state.hp <= 0) continue;
    state.hp = Math.max(1, Math.floor(Number(state.hp || 1) * (1 - fraction)));
    refreshStateCondition(state);
    count += 1;
  }
  run.player_state = states;
  return count;
}

function healPartyFraction(run: CurrentRunData, fraction: number): number {
  const states = normalizePlayerState(run);
  let count = 0;
  for (const state of states) {
    if (state.fainted || state.hp <= 0) continue;
    state.hp = Math.min(Number(state.maxhp || 1), Number(state.hp || 0) + Math.max(1, Math.floor(Number(state.maxhp || 1) * fraction)));
    refreshStateCondition(state);
    count += 1;
  }
  run.player_state = states;
  return count;
}

function clearPartyStatus(run: CurrentRunData): number {
  const states = normalizePlayerState(run);
  let count = 0;
  for (const state of states) {
    if (state.status) count += 1;
    state.status = "";
    refreshStateCondition(state);
  }
  run.player_state = states;
  return count;
}

function applyRandomStatus(run: CurrentRunData, label: string): number {
  const states = normalizePlayerState(run);
  const rng = eventRng(run, label);
  const statuses = ["brn", "par", "psn", "slp"] as const;
  let count = 0;
  for (const state of states) {
    if (state.hp <= 0) continue;
    state.status = statuses[Math.floor(rng() * statuses.length)] || "psn";
    refreshStateCondition(state);
    count += 1;
  }
  run.player_state = states;
  return count;
}

function applyPotionTrial(run: CurrentRunData): string {
  const roll = eventRng(run, "potion_trial")();
  if (roll < 1 / 3) return `全队 ${healPartyFraction(run, 0.4)} 只宝可梦恢复了 40% HP`;
  if (roll < 2 / 3) return `全队解除了 ${clearPartyStatus(run)} 个异常状态`;
  const restored = restoreRandomPartyMembers(run, 1, "potion_trial_full");
  return `${restored || "没有宝可梦"}恢复到满状态`;
}

function isBerryItemId(itemId: string): boolean {
  return itemKey(itemId).endsWith("berry");
}

function isSpecialSystemItemId(itemId: string): boolean {
  const id = itemKey(itemId);
  return Boolean(gameService.battleSystemForItem(id));
}

async function isOrdinaryHeldItemId(itemId: string): Promise<boolean> {
  const id = itemKey(itemId);
  if (!id || isTmItemId(id) || isBerryItemId(id) || isSpecialSystemItemId(id)) return false;
  const item = await itemDetailsById(id);
  let category = itemCategory(item);
  if (category === "consumable" && !(await gameService.hasConsumableItemEffect(id))) category = "held";
  return category === "held";
}

async function isHpStatusReviveRecoveryItem(itemId: string): Promise<boolean> {
  const id = itemKey(itemId);
  if (isTmItemId(id) || isBerryItemId(id)) return true;
  if (!(await gameService.hasConsumableItemEffect(id))) return false;
  return !["ether", "maxether", "elixir", "maxelixir"].includes(id);
}

function isLowTierRecoveryItem(itemId: string): boolean {
  return ["potion", "superpotion", "hyperpotion", "freshwater", "sodapop", "lemonade", "moomoomilk", "energypowder", "energyroot", "fullheal", "healpowder", "antidote", "burnheal", "iceheal", "awakening", "paralyzeheal"].includes(itemKey(itemId)) || isBerryItemId(itemId);
}

async function assertRestItemUsableByEvents(run: CurrentRunData, itemId: string): Promise<void> {
  const id = itemKey(itemId);
  if (run.rest_status?.event_rest_healing_blocked && await isHpStatusReviveRecoveryItem(id)) throw new Error("恢复道具受到诅咒，本次休整不能使用。");
  if (run.rest_status?.event_low_tier_recovery_disabled && isLowTierRecoveryItem(id)) throw new Error("重伤手术期间，低级恢复道具暂时失效。");
}

async function assertBattleItemUsableByEvents(run: CurrentRunData, itemId: string): Promise<void> {
  if (run.rest_status?.event_next_battle_healing_blocked && await isHpStatusReviveRecoveryItem(itemId)) throw new Error("恢复道具受到诅咒，下一场战斗中不能使用。");
}

async function convertBerriesToMedicine(run: CurrentRunData): Promise<string> {
  const berryEntries = Object.entries(run.bag_items || {}).filter(([id, count]) => isBerryItemId(id) && Number(count || 0) > 0);
  const total = berryEntries.reduce((sum, [_id, count]) => sum + Number(count || 0), 0);
  if (total < 3) {
    for (const [id, count] of berryEntries) consumeBagItemCount(run, id, Number(count || 0));
    run.rest_status = {...(run.rest_status || {}), event_recovery_multiplier: Math.min(eventRecoveryMultiplier(run), 0.5), event_hungry: true};
    return total > 0
      ? `只找到 ${total} 个树果，锅里没煮出像样的东西；队伍陷入饥饿，本次休整和下一战背包恢复效果减半。`
      : "背包里没有树果，锅里什么也没煮出来；队伍陷入饥饿，本次休整和下一战背包恢复效果减半。";
  }
  for (const [id, count] of berryEntries) consumeBagItemCount(run, id, Number(count || 0));
  const rng = eventRng(run, "camping_pot", total);
  const rewards: string[] = [];
  const rolls = Math.max(1, Math.ceil(total / 2));
  for (let index = 0; index < rolls; index += 1) {
    const roll = rng();
    const itemId = total >= 8 && roll > 0.82 ? "fullrestore" : total >= 5 && roll > 0.65 ? "maxpotion" : roll > 0.42 ? "hyperpotion" : roll > 0.18 ? "superpotion" : "potion";
    rewards.push(await grantBagItem(run, itemId, 1));
  }
  return `消耗 ${total} 个树果，获得 ${rewards.join("、")}。`;
}

async function eventEligibleBagItemIds(run: CurrentRunData): Promise<string[]> {
  const ids: string[] = [];
  for (const [id, count] of Object.entries(run.bag_items || {})) {
    if (Number(count || 0) <= 0 || isSpecialSystemItemId(id)) continue;
    ids.push(itemKey(id));
  }
  return ids;
}

async function applyRiverGod(run: CurrentRunData): Promise<string> {
  const rng = eventRng(run, "forgetful_river_god");
  const roll = rng();
  const ids = await eventEligibleBagItemIds(run);
  if (!ids.length) return "健忘的河神：你的背包太空了，河神什么也没做。";
  if (roll < 0.3) {
    const total = ids.reduce((sum, id) => sum + Number(run.bag_items?.[id] || 0), 0);
    let removeCount = Math.max(1, Math.floor(total / 4));
    const shuffled = shuffleByRng(ids, rng);
    const removed: string[] = [];
    for (const id of shuffled) {
      while (removeCount > 0 && Number(run.bag_items?.[id] || 0) > 0) {
        consumeBagItemCount(run, id, 1);
        removed.push(id);
        removeCount -= 1;
      }
      if (removeCount <= 0) break;
    }
    return `健忘的河神：河神弄丢了 ${removed.length} 个背包道具。`;
  }
  if (roll < 0.5) {
    let doubled = 0;
    for (const id of ids) {
      const count = Number(run.bag_items?.[id] || 0);
      adjustBagItem(run, id, count);
      doubled += count;
    }
    return `健忘的河神：背包道具翻倍，额外获得 ${doubled} 个道具。`;
  }
  return "健忘的河神：河神想了半天，最后什么也没发生。";
}

async function checkBattleItems(run: CurrentRunData): Promise<number> {
  const checked: Record<string, number> = {...(run.rest_status?.event_checked_bag_items || {})};
  let count = 0;
  for (const [id, amount] of Object.entries(run.bag_items || {})) {
    if (Number(amount || 0) <= 0 || !(await isOrdinaryHeldItemId(id))) continue;
    checked[itemKey(id)] = Number(checked[itemKey(id)] || 0) + Number(amount || 0);
    consumeBagItemCount(run, id, Number(amount || 0));
    count += Number(amount || 0);
  }
  const states = normalizePlayerState(run);
  for (let index = 0; index < run.player_team.length; index += 1) {
    const itemId = itemKey(run.player_team[index]?.item || run.player_display[index]?.item_id || run.player_display[index]?.item || "");
    if (!itemId || !(await isOrdinaryHeldItemId(itemId))) continue;
    checked[itemId] = Number(checked[itemId] || 0) + 1;
    run.player_team[index].item = "";
    run.player_display[index] = {...run.player_display[index], item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
    if (states[index]) states[index].item = "";
    count += 1;
  }
  run.player_state = states;
  run.rest_status = {...(run.rest_status || {}), event_checked_bag_items: checked};
  return count;
}

async function returnCheckedBagItems(run: CurrentRunData): Promise<number> {
  const checked = run.rest_status?.event_checked_bag_items || {};
  let count = 0;
  for (const [id, amount] of Object.entries(checked)) {
    const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
    if (!safeAmount) continue;
    await grantBagItem(run, id, safeAmount);
    count += safeAmount;
  }
  if (run.rest_status) delete run.rest_status.event_checked_bag_items;
  return count;
}

async function grantDevilTreasure(run: CurrentRunData): Promise<string[]> {
  const pool = (await loadShopPool()).filter(entry => entry.enabled && entry.category === "held" && !isSpecialSystemItemId(entry.id) && !isBerryItemId(entry.id) && Number(entry.cost || 0) >= 300);
  const rng = eventRng(run, "devil_treasure");
  const picked = shuffleByRng(pool.length ? pool : await loadShopPool(), rng).slice(0, 2);
  const rewards: string[] = [];
  for (const entry of picked) rewards.push(await grantBagItem(run, entry.id, 1));
  return rewards.length ? rewards : ["没有找到合适的宝藏"];
}

function buildContestMarks(run: CurrentRunData): NonNullable<CurrentRunData["rest_status"]>["event_contest_next"] {
  const rng = eventRng(run, "contest_stage");
  const liked: Record<string, string> = {};
  const disliked: Record<string, string> = {};
  for (const pokemon of run.player_display || []) {
    const key = pokemon.showdown_id || pokemon.run_member_id || pokemon.species_id || pokemon.species || "";
    const moves = (pokemon.moves || []).map(move => toId(move.id || move.name)).filter(Boolean);
    if (!key || !moves.length) continue;
    const shuffled = shuffleByRng(moves, rng);
    liked[key] = shuffled[0];
    if (shuffled.length > 1) disliked[key] = shuffled[1];
  }
  return {score: 0, liked, disliked};
}

function contestMoveDelta(marked: NonNullable<CurrentRunData["rest_status"]>["event_contest_active"], event: BattleTimelineEvent): number {
  if (!marked) return 0;
  const sourceKeys = [
    event.source_showdown_id,
    event.source_id,
    event.source,
  ].map(value => String(value || "")).filter(Boolean);
  const moveId = toId(event.move || event.effect || "");
  if (!moveId) return 0;
  for (const key of sourceKeys) {
    const normalizedKey = toId(key);
    const liked = marked.liked?.[key] || marked.liked?.[normalizedKey];
    const disliked = marked.disliked?.[key] || marked.disliked?.[normalizedKey];
    if (liked && toId(liked) === moveId) return 1;
    if (disliked && toId(disliked) === moveId) return -1;
  }
  return 0;
}

function settleContestScore(run: CurrentRunData, state: BattleState): {score: number; bonusCoins: number; overrideWin: boolean} {
  const contest = run.rest_status?.event_contest_active;
  if (!contest) return {score: 0, bonusCoins: 0, overrideWin: false};
  const playerSide = state.player_side || "p1";
  let score = Math.max(0, Number(contest.score || 0));
  for (const event of state.timeline_events || []) {
    if (event.type !== "move" || event.side !== playerSide) continue;
    score = Math.max(0, score + contestMoveDelta(contest, event));
  }
  contest.score = score;
  const bonusCoins = Math.min(300, score * 30);
  const overrideWin = state.winner !== "Player" && score > 6;
  return {score, bonusCoins, overrideWin};
}

function previewContestScore(run: CurrentRunData, state: BattleState): number {
  const contest = run.rest_status?.event_contest_active;
  if (!contest) return 0;
  const playerSide = state.player_side || "p1";
  let score = Math.max(0, Number(contest.score || 0));
  for (const event of state.timeline_events || []) {
    if (event.type !== "move" || event.side !== playerSide) continue;
    score = Math.max(0, score + contestMoveDelta(contest, event));
  }
  return score;
}

async function revealNightSkyBattle(save: LocalSave, run: CurrentRunData, battleNo: number): Promise<void> {
  await buildNightSkyState(save, run);
  const row = run.night_sky?.rows?.find(entry => Number(entry.battle_no) === Number(battleNo));
  if (row) {
    row.revealed = 3;
    row.unlocked = true;
    row.enemies = (await generateOpponentPreview(save, run, battleNo)).enemies.slice(0, 3);
  }
}

async function rerandomizeFutureBattles(save: LocalSave, run: CurrentRunData): Promise<number> {
  const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
  const locked = new Set((run.rest_status?.event_rerandomized_locked_battles || []).map(Number).filter(Boolean));
  let count = 0;
  for (let battleNo = currentBattleNo + 1; battleNo <= Number(run.battles || DEFAULT_BATTLES); battleNo += 1) {
    if (locked.has(battleNo)) continue;
    if (battleNo === Number(run.battles || DEFAULT_BATTLES) && run.named_champion_id) continue;
    run.reroute_history = {...(run.reroute_history || {}), [String(battleNo)]: [...(run.reroute_history?.[String(battleNo)] || []), `event-${Date.now()}-${count}`]};
    await refreshPlannedBattle(save, run, battleNo);
    count += 1;
  }
  await buildNightSkyState(save, run);
  return count;
}

async function replaceEscapedPokemon(run: CurrentRunData): Promise<string> {
  const rng = eventRng(run, "last_minute_escape");
  const slot = Math.floor(rng() * run.player_team.length);
  const oldRaw = JSON.parse(JSON.stringify(run.player_team[slot])) as PokemonSet;
  const oldDisplay = JSON.parse(JSON.stringify(run.player_display[slot])) as RentalPokemon;
  const oldName = oldDisplay.species_zh || oldDisplay.species || oldRaw.species || "宝可梦";
  const profile = (oldRaw.generation_profile || oldDisplay.generation_profile || "tier3") as GenerationProfile;
  const speciesId = oldDisplay.species_id || oldRaw.species || oldRaw.name;
  const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed || 1), 0xee00 + Number(run.battle_no || run.next_battle || 0) * 31 + slot), "gen9randombattle", 1, {profiles: [profile], speciesIds: [speciesId], purpose: "normal", battleSetting: run.battle_setting});
  let nextRaw = generated.team[0];
  let nextDisplay = generated.display[0];
  if (!nextRaw || !nextDisplay) return `临阵脱逃：${oldName} 差点跑掉，但工厂没有找到替补。`;
  const oldShowdownId = oldRaw.showdown_id || oldDisplay.showdown_id || run.player_state?.[slot]?.showdown_id;
  addToExchangeBox(run, [oldRaw], [oldDisplay], run.player_state?.[slot] ? [run.player_state[slot]] : undefined);
  const newShowdownId = takeReplacementRunShowdownId(run, slot, oldShowdownId);
  writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);
  const capped = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplay);
  nextRaw = capped.raw;
  nextDisplay = capped.display;
  writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);
  run.player_team[slot] = nextRaw;
  run.player_display[slot] = nextDisplay;
  const states = normalizePlayerState(run);
  states[slot] = fullStateForPokemon(nextDisplay, slot + 1);
  writePlayerSlotShowdownId(run, slot, states, newShowdownId);
  run.player_state = states;
  const investments = run.bp_investments || [0, 0, 0];
  const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  investments[slot] = 0;
  moveInvestments[slot] = [0, 0, 0, 0];
  run.bp_investments = investments;
  run.move_investments = moveInvestments;
  return `临阵脱逃：${oldName} 离队，工厂补发了新的 ${nextDisplay.species_zh || nextDisplay.species || oldName}${capped.capped ? "，等级已受徽章权限压制" : ""}。`;
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

function consumeBagItemCount(run: CurrentRunData, itemId: string, count = 1): void {
  const id = itemKey(itemId);
  const current = Number(run.bag_items?.[id] || 0);
  if (current < count) throw new Error("背包材料数量不足。");
  adjustBagItem(run, id, -count);
  const locked = Number(run.non_refundable_bag_items?.[id] || 0);
  if (locked > 0) {
    run.non_refundable_bag_items = {...(run.non_refundable_bag_items || {}), [id]: Math.max(0, locked - count)};
    if (!run.non_refundable_bag_items[id]) delete run.non_refundable_bag_items[id];
  }
}

async function grantVictoryRewards(run: CurrentRunData, isBoss: boolean, battleNo: number): Promise<{items: string[]; restBonus: CurrentRunData["rest_status"]}> {
  void run;
  void isBoss;
  void battleNo;
  return {items: [], restBonus: {}};
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
    case ".ogg": return "audio/ogg";
    case ".mp3": return "audio/mpeg";
    case ".wav": return "audio/wav";
    case ".m4a": return "audio/mp4";
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
  save.star_chart = normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades);
  save.talent_unlocks = Array.from(new Set(talentsForStarChart(save.star_chart).map(talent => talent.id)));
  save.talent_equipped = [...save.talent_unlocks];
  save.starter_upgrades = starterUpgradesForStarChart(save.star_chart);
  save.battle_setting = normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING);
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

function activeTalentsForSave(save?: LocalSave | null): TalentView[] {
  if (!save) return [];
  return talentsForStarChart(normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades));
}

function starterUpgradesForSave(save?: LocalSave | null): StarterUpgradeState {
  return starterUpgradesForStarChart(normalizeStarChart(save?.star_chart, save?.talent_unlocks, save?.starter_upgrades));
}

function badgeLevelCapForTalents(talents: TalentView[] | undefined = []): number | null {
  const level = talentLevel(talents, "badge_level_cap");
  return level > 0 ? BADGE_LEVEL_CAPS[level] || null : null;
}

async function applyArrivalLevelCap(talents: TalentView[] | undefined, rawSet: PokemonSet, display: RentalPokemon): Promise<{raw: PokemonSet; display: RentalPokemon; capped: boolean}> {
  const cap = badgeLevelCapForTalents(talents);
  if (!cap || Math.floor(Number(rawSet.level || display.level || 1)) <= cap) return {raw: rawSet, display, capped: false};
  const raw = {...rawSet, level: cap};
  const [described] = await gameService.describeTeam([raw]);
  return {raw, display: described || {...display, level: cap}, capped: true};
}

async function applyArrivalLevelCapToTeam(talents: TalentView[] | undefined, team: PokemonSet[], display: RentalPokemon[]): Promise<{team: PokemonSet[]; display: RentalPokemon[]; capped: number}> {
  let capped = 0;
  const nextTeam: PokemonSet[] = [];
  const nextDisplay: RentalPokemon[] = [];
  for (let index = 0; index < team.length; index += 1) {
    const next = await applyArrivalLevelCap(talents, team[index], display[index]);
    if (next.capped) capped += 1;
    nextTeam.push(next.raw);
    nextDisplay.push(next.display);
  }
  return {team: nextTeam, display: nextDisplay, capped};
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

async function enableTestMode(): Promise<LocalSave> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  save.stats = {...emptyStats(), ...(save.stats || {}), battle_points: 99999};
  return persist(save);
}

async function e2ePatchSave(patch: Partial<LocalSave>): Promise<LocalSave> {
  if (!e2eEnabled) throw new Error("E2E IPC 未启用。");
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const next: LocalSave = {
    ...save,
    ...patch,
    stats: patch.stats ? {...save.stats, ...patch.stats} : save.stats,
    trainer: patch.trainer ? {...save.trainer, ...patch.trainer} : save.trainer,
  };
  return persist(next);
}

async function getBattleSetting(): Promise<{setting: BattleSetting; save?: LocalSave | null}> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  return {setting: normalizeBattleSetting(save.battle_setting), save};
}

async function updateBattleSetting(setting: Partial<BattleSetting>): Promise<{setting: BattleSetting; save?: LocalSave | null}> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const mergedSetting = {...normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING), ...setting};
  const rawGenerations = Array.from(new Set((mergedSetting.allowed_generations || [])
    .map(value => Math.floor(Number(value)))
    .filter(value => value >= 1 && value <= 9)));
  if (rawGenerations.length < 3) throw new Error("地区专爱至少需要选择 3 个地区。");
  const nextSetting = normalizeBattleSetting(mergedSetting);
  save.battle_setting = nextSetting;
  const next = await persist(save);
  return {setting: normalizeBattleSetting(next.battle_setting), save: next};
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

function loadBattleBackgroundCatalog(): BattleBackgroundView[] {
  const csvPath = path.join(projectRoot, "assets", "battle-backgrounds", "backgrounds.csv");
  if (!existsSync(csvPath)) return [FALLBACK_BATTLE_BACKGROUND];
  const lines = readFileSync(csvPath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""])) as Record<string, string>;
    return row.id && row.src ? row as BattleBackgroundView : null;
  }).filter((entry): entry is BattleBackgroundView => Boolean(entry));
  return rows.length ? rows : [FALLBACK_BATTLE_BACKGROUND];
}

function battleBackgroundForRun(run: CurrentRunData, trainer: TrainerNpcView, battleNo: number): BattleBackgroundView {
  const catalog = loadBattleBackgroundCatalog();
  const champion = catalog.find(entry => entry.id === CHAMPION_BACKGROUND_ID);
  if (trainer.type === "champion" && champion) return champion;
  const pool = catalog.filter(entry => entry.id !== CHAMPION_BACKGROUND_ID);
  const candidates = pool.length ? pool : catalog;
  const picked = pickStable(candidates, run.seed || 0, battleNo, trainer.id, trainer.team_pool_id || "", run.boss_route || "");
  return picked || FALLBACK_BATTLE_BACKGROUND;
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
  const pool = trainerPoolForRoute(route);
  if (pool.length <= 1) throw new Error("当前路线没有其他同等级对手。");
  const current = chooseTrainerForRoute(route, run, battleNo);
  const history = new Set((run.reroute_history?.[String(battleNo)] || []).filter(Boolean));
  history.add(current.id);
  const freshCandidates = pool.filter(entry => entry.id !== current.id && !history.has(entry.id));
  const candidates = freshCandidates.length ? freshCandidates : pool.filter(entry => entry.id !== current.id);
  const picked = pickStable(candidates, run.seed || 0, battleNo, route.route, Number(run.reroute_used || 0) + 1, history.size);
  if (!picked) throw new Error("当前路线没有可替换的对手。");
  const teamPool = picked.team_pool_ids?.length ? pickStable(picked.team_pool_ids, run.seed || 0, battleNo, picked.id, "reroute", Number(run.reroute_used || 0) + 1) : undefined;
  return {...picked, team_pool_id: teamPool};
}

function decorateBattleState(state: BattleState, run?: CurrentRunData | null): BattleState {
  if (!run) return state;
  const playerTalents = run.talents || [];
  const contestScore = previewContestScore(run, state);
  const battleEventStatuses: RestState["rest_event_statuses"] = [];
  if (run.rest_status?.event_contest_active) battleEventStatuses.push({id: "contest", label: "华丽大赛", detail: `当前华丽分 ${contestScore}`, tone: "trade"});
  if (Number(run.rest_status?.event_recovery_multiplier || 1) < 1) battleEventStatuses.push({id: "recovery_down", label: run.rest_status?.event_hungry ? "饥饿" : "恢复减半", detail: "本场背包恢复道具效果减半。", tone: "risk"});
  if (run.rest_status?.event_next_battle_healing_blocked) battleEventStatuses.push({id: "healing_blocked", label: "恢复诅咒", detail: "本场不能使用 HP/异常/复活类背包恢复道具。", tone: "risk"});
  if (run.rest_status?.event_soul_swap_active) battleEventStatuses.push({id: "soul_swap", label: "灵魂互换", detail: "你正在操作对手队伍，胜负按原阵营结算。", tone: "risk"});
  return {
    ...state,
    player_trainer: run.player_trainer,
    enemy_trainer: run.enemy_trainer,
    enemy_boss_record: run.enemy_boss_record,
    battle_background: run.battle_background,
    player_talents: playerTalents,
    show_move_effectiveness: hasTalent(playerTalents, "intel_god_eye"),
    battle_setting: normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING),
    battle_event_statuses: battleEventStatuses,
    contest_score: contestScore,
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
    inspect_count: 0,
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

async function refundableBagBaseBp(run: CurrentRunData, outcome: "normal" | "loss" = "normal"): Promise<number> {
  normalizeCurrentRun(run);
  const rate = bagRefundRate(run, outcome);
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

async function settleRunEnd(save: LocalSave, run: CurrentRunData, options: {refundBag?: boolean; completed?: boolean; outcome?: "normal" | "loss"} = {}): Promise<{paidBack: number; refundBase: number; refundGained: number; receiptBonus: number; portfolioBonus: number; portfolioTypes: string[]; convertedCoins: number; excludedCoins: number; convertedBp: number}> {
  const paidBack = settleProphetFirstMover(save, run);
  const refundBase = options.refundBag === false ? 0 : await refundableBagBaseBp(run, options.outcome || "normal");
  const refundGained = refundBase ? addRunBp(save, run, refundBase) : 0;
  const receiptBase = Number(run.recycle_receipt_value || 0) + refundBase;
  const receiptBonus = hasTalent(run.talents, "economy_recycle_receipt") && receiptBase > 0 ? addRunBp(save, run, Math.floor(receiptBase * RECYCLE_RECEIPT_RATE)) : 0;
  const portfolio = portfolioBonus(run);
  const portfolioGained = options.completed && portfolio.bonus > 0 ? addRunBp(save, run, portfolio.bonus) : 0;
  const {convertibleCoins: convertedCoins, excludedCoins} = convertibleCoinsForSettlement(run);
  const convertedBp = coinsToBp(convertedCoins);
  if (convertedBp > 0) addBp(save, convertedBp);
  run.coins = 0;
  run.non_convertible_coins = 0;
  return {paidBack, refundBase, refundGained, receiptBonus, portfolioBonus: portfolioGained, portfolioTypes: portfolio.types, convertedCoins, excludedCoins, convertedBp};
}

function settlementText(settled: Awaited<ReturnType<typeof settleRunEnd>>): string {
  return `${settled.refundGained ? `，背包返还 ${settled.refundGained}金币` : ""}${settled.receiptBonus ? `，回收票据 +${settled.receiptBonus}金币` : ""}${settled.portfolioBonus ? `，投资组合 +${settled.portfolioBonus}金币（${settled.portfolioTypes.join(" / ")}）` : ""}${settled.excludedCoins ? `，天使基金剩余 ${settled.excludedCoins}金币不折算` : ""}`;
}

type SettledRunEnd = Awaited<ReturnType<typeof settleRunEnd>>;

function resultPokemonKey(pokemon: Pick<RentalPokemon, "run_member_id" | "showdown_id" | "species_id" | "name">): string {
  return pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id || toId(pokemon.name);
}

function emptyResultPokemonStats(): Omit<ResultPokemonSummary, "pokemon"> {
  return {kills: 0, deaths: 0, assists: 0, damage_dealt: 0, damage_taken: 0};
}

function rememberRunPokemonAppearances(run: CurrentRunData, team: RentalPokemon[] | undefined): void {
  if (!team?.length) return;
  const existing = new Map((run.used_pokemon_display || []).map(pokemon => [resultPokemonKey(pokemon), pokemon]));
  for (const pokemon of team) existing.set(resultPokemonKey(pokemon), pokemon);
  run.used_pokemon_display = Array.from(existing.values());
}

function mergeResultPokemonStats(target: Omit<ResultPokemonSummary, "pokemon">, source: Partial<Omit<ResultPokemonSummary, "pokemon">>): Omit<ResultPokemonSummary, "pokemon"> {
  return {
    kills: Number(target.kills || 0) + Number(source.kills || 0),
    deaths: Number(target.deaths || 0) + Number(source.deaths || 0),
    assists: Number(target.assists || 0) + Number(source.assists || 0),
    damage_dealt: Number(target.damage_dealt || 0) + Number(source.damage_dealt || 0),
    damage_taken: Number(target.damage_taken || 0) + Number(source.damage_taken || 0),
  };
}

function timelineHpKey(event: BattleTimelineEvent): string {
  return `${event.targetSide || ""}:${event.target_showdown_id || event.target_id || event.target || ""}`;
}

function timelinePokemonKey(event: BattleTimelineEvent): string {
  const id = toId(String(event.target_showdown_id || event.target_id || event.target || ""));
  return event.targetSide && id ? `${event.targetSide}:${id}` : "";
}

function timelineCurrentHp(event: BattleTimelineEvent): number | null {
  if (event.hp) return Math.max(0, Number(event.hp.current || 0));
  if (/\bfnt\b/i.test(String(event.condition || ""))) return 0;
  return null;
}

function rememberTimelineHp(event: BattleTimelineEvent, knownHp: Map<string, number>): void {
  const id = timelineHpKey(event);
  const current = timelineCurrentHp(event);
  if (current === null || id.endsWith(":")) return;
  knownHp.set(id, current);
}

function hpDelta(event: BattleTimelineEvent, knownHp: Map<string, number>): number {
  const id = timelineHpKey(event);
  const current = timelineCurrentHp(event);
  if (current === null || id.endsWith(":")) return 0;
  const previous = knownHp.has(id) ? Number(knownHp.get(id) || 0) : Math.max(current, Number(event.hp?.max || current || 0));
  knownHp.set(id, current);
  return Math.max(0, previous - current);
}

function statEventToStats(event: ResultPokemonStatEvent): Partial<Omit<ResultPokemonSummary, "pokemon">> {
  if (event.kind === "kill") return {kills: event.value};
  if (event.kind === "death") return {deaths: event.value};
  if (event.kind === "assist") return {assists: event.value};
  if (event.kind === "damage_dealt") return {damage_dealt: event.value};
  if (event.kind === "damage_taken") return {damage_taken: event.value};
  return {};
}

function aggregatePokemonStatEvents(events: ResultPokemonStatEvent[] | undefined): Record<string, Omit<ResultPokemonSummary, "pokemon">> {
  const stats: Record<string, Omit<ResultPokemonSummary, "pokemon">> = {};
  for (const event of events || []) {
    const key = String(event.pokemon_key || "");
    const value = Math.max(0, Number(event.value || 0));
    if (!key || !value) continue;
    stats[key] = mergeResultPokemonStats(stats[key] || emptyResultPokemonStats(), statEventToStats({...event, value}));
  }
  return stats;
}

function statEventSource(event: BattleTimelineEvent): ResultPokemonStatEvent["source"] {
  const effect = toId(event.effect || "");
  if (!effect) return event.type === "damage" ? "move" : "unknown";
  if (["spikes", "stealthrock", "toxicspikes", "stickyweb"].includes(effect)) return "field";
  if (["brn", "psn", "tox", "confusion", "leechseed", "curse", "nightmare"].includes(effect)) return "status";
  if (event.type === "item") return "item";
  if (event.type === "ability") return "ability";
  return "unknown";
}

function collectBattlePokemonStatEvents(run: CurrentRunData, battle: BattleState): ResultPokemonStatEvent[] {
  const byShowdownId = new Map<string, string>();
  const byIdent = new Map<string, string>();
  const duplicateIdents = new Set<string>();
  const addIdent = (value: unknown, key: string): void => {
    const id = toId(String(value || ""));
    if (!id) return;
    const existing = byIdent.get(id);
    if (existing && existing !== key) {
      duplicateIdents.add(id);
      byIdent.delete(id);
    } else if (!duplicateIdents.has(id)) {
      byIdent.set(id, key);
    }
  };
  battle.player_display.forEach(pokemon => {
    const key = resultPokemonKey(pokemon);
    if (pokemon.showdown_id) byShowdownId.set(pokemon.showdown_id, key);
    addIdent(pokemon.species_id, key);
    addIdent(pokemon.species, key);
    addIdent(pokemon.name, key);
  });
  const battleNo = Math.max(1, Number(run.battle_no || run.next_battle || 0));
  const statEvents: ResultPokemonStatEvent[] = [];
  const pushStatEvent = (pokemonKey: string, timelineEvent: BattleTimelineEvent, kind: ResultPokemonStatEvent["kind"], value: number, targetKey = "", source: ResultPokemonStatEvent["source"] = "unknown"): void => {
    const normalizedValue = Math.max(0, Math.floor(Number(value || 0)));
    if (!pokemonKey || !normalizedValue) return;
    statEvents.push({
      battle_no: battleNo,
      turn: Math.max(1, Number(timelineEvent.turn || battle.tracker?.turn || 1)),
      pokemon_key: pokemonKey,
      target_key: targetKey || undefined,
      kind,
      value: normalizedValue,
      source,
    });
  };
  const contributorsByEnemy = new Map<string, Set<string>>();
  const knownHp = new Map<string, number>();
  let lastPlayerAttackerKey = "";
  for (const event of battle.timeline_events || []) {
    if (event.type === "switch") {
      rememberTimelineHp(event, knownHp);
      continue;
    }
    if (event.type === "heal" && event.hp) {
      rememberTimelineHp(event, knownHp);
      continue;
    }
    if (event.type === "move" && event.side === "p1") {
      const key = byShowdownId.get(event.source_showdown_id || "") || byIdent.get(toId(event.source_id || event.source || ""));
      if (key) lastPlayerAttackerKey = key;
      continue;
    }
    if (event.type === "damage") {
      const delta = hpDelta(event, knownHp);
      if (delta <= 0) continue;
      if (event.targetSide === "p2" && lastPlayerAttackerKey) {
        const targetKey = timelinePokemonKey(event);
        pushStatEvent(lastPlayerAttackerKey, event, "damage_dealt", delta, targetKey, statEventSource(event));
        if (targetKey) {
          const contributors = contributorsByEnemy.get(targetKey) || new Set<string>();
          contributors.add(lastPlayerAttackerKey);
          contributorsByEnemy.set(targetKey, contributors);
        }
      } else if (event.targetSide === "p1") {
        const key = byShowdownId.get(event.target_showdown_id || "") || byIdent.get(toId(event.target_id || event.target || ""));
        if (key) pushStatEvent(key, event, "damage_taken", delta, timelinePokemonKey(event), statEventSource(event));
      }
      continue;
    }
    if (event.type === "faint") {
      if (event.targetSide === "p2" && lastPlayerAttackerKey) {
        const targetKey = timelinePokemonKey(event);
        pushStatEvent(lastPlayerAttackerKey, event, "kill", 1, targetKey, "unknown");
        for (const contributorKey of contributorsByEnemy.get(targetKey) || []) {
          if (contributorKey !== lastPlayerAttackerKey) pushStatEvent(contributorKey, event, "assist", 1, targetKey, "unknown");
        }
        if (targetKey) contributorsByEnemy.delete(targetKey);
      } else if (event.targetSide === "p1") {
        const key = byShowdownId.get(event.target_showdown_id || "") || byIdent.get(toId(event.target_id || event.target || ""));
        if (key) pushStatEvent(key, event, "death", 1, timelinePokemonKey(event), "unknown");
      }
    }
  }
  return statEvents;
}

function recordRunBattleStats(run: CurrentRunData, battle: BattleState): ResultPokemonStatEvent[] {
  rememberRunPokemonAppearances(run, battle.player_display);
  const statEvents = collectBattlePokemonStatEvents(run, battle);
  run.used_pokemon_stat_events = [...(run.used_pokemon_stat_events || []), ...statEvents];
  return statEvents;
}

function resultUsedPokemon(run: CurrentRunData | null | undefined, fallbackTeam: RentalPokemon[]): ResultPokemonSummary[] {
  const seen = new Map<string, RentalPokemon>();
  for (const pokemon of [...(run?.used_pokemon_display || []), ...(run?.player_display || []), ...(run?.exchange_box?.display || []), ...fallbackTeam]) {
    seen.set(resultPokemonKey(pokemon), pokemon);
  }
  const eventStats = aggregatePokemonStatEvents(run?.used_pokemon_stat_events);
  return Array.from(seen.entries()).map(([key, pokemon]) => ({
    pokemon,
    ...mergeResultPokemonStats(run?.used_pokemon_stats?.[key] || emptyResultPokemonStats(), eventStats[key] || emptyResultPokemonStats()),
  }));
}

function battlePokemonSummaries(run: CurrentRunData, battle: BattleState, events: ResultPokemonStatEvent[]): ResultPokemonSummary[] {
  const eventStats = aggregatePokemonStatEvents(events);
  return battle.player_display.map(pokemon => {
    const key = resultPokemonKey(pokemon);
    return {
      pokemon,
      ...mergeResultPokemonStats(run.used_pokemon_stats?.[key] || emptyResultPokemonStats(), eventStats[key] || emptyResultPokemonStats()),
    };
  });
}

function buildBattleRecord(options: {run: CurrentRunData; battle: BattleState; message: string; outcome: BattleRecordEntry["outcome"]; statEvents: ResultPokemonStatEvent[]; resultSummary?: ResultSummaryState}): BattleRecordEntry {
  const run = options.run;
  const battle = options.battle;
  return {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    run_seed: Number(run.seed || 0),
    battle_no: Math.max(1, Number(run.battle_no || activeBattleNo || run.next_battle || 1)),
    total_battles: Math.max(1, Number(run.battles || DEFAULT_BATTLES)),
    outcome: options.outcome,
    winner: battle.winner,
    message: options.message,
    enemy_trainer: run.enemy_trainer,
    player_team: battle.player_display,
    enemy_team: battle.enemy_display || run.enemy_display || [],
    player_pokemon: battlePokemonSummaries(run, battle, options.statEvents),
    result_summary: options.resultSummary,
  };
}

function buildRunRecord(options: {run: CurrentRunData; message: string; outcome: BattleRecordEntry["outcome"]; resultSummary?: ResultSummaryState}): BattleRecordEntry {
  const run = options.run;
  return {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    run_seed: Number(run.seed || 0),
    battle_no: Math.max(1, Number(run.battle_no || run.next_battle || 1)),
    total_battles: Math.max(1, Number(run.battles || DEFAULT_BATTLES)),
    outcome: options.outcome,
    winner: options.outcome === "win" ? "Player" : options.outcome,
    message: options.message,
    enemy_trainer: run.enemy_trainer,
    player_team: run.player_display || [],
    enemy_team: run.enemy_display || [],
    player_pokemon: resultUsedPokemon(run, run.player_display || []),
    result_summary: options.resultSummary,
  };
}

function resultProgressRows(options: {run?: CurrentRunData | null; wins: number; outcome: ResultSummaryState["outcome"]; battle?: BattleState | null}): ResultSummaryState["progress"] {
  const run = options.run;
  const rows = run?.night_sky?.rows || [];
  const total = Math.max(7, Number(run?.battles || rows.length || DEFAULT_BATTLES));
  if (rows.length) {
    return rows.map(row => ({
      battle_no: row.battle_no,
      label: row.label,
      trainer: row.trainer,
      trainer_visible: Boolean(row.trainer_visible || row.encountered),
      outcome: row.battle_no <= options.wins ? "win" : row.battle_no === options.wins + 1 ? options.outcome : "pending",
    }));
  }
  return Array.from({length: total}, (_value, index) => {
    const battleNo = index + 1;
    return {
      battle_no: battleNo,
      label: battleNo === total ? "最终战" : battleNo === 3 ? "馆主战" : "挑战",
      trainer: battleNo === options.wins + 1 ? options.battle?.enemy_trainer || run?.enemy_trainer : undefined,
      trainer_visible: battleNo <= options.wins + 1,
      outcome: battleNo <= options.wins ? "win" : battleNo === options.wins + 1 ? options.outcome : "pending",
    };
  });
}

function buildResultSummary(options: {
  outcome: ResultSummaryState["outcome"];
  headline: string;
  subtitle?: string;
  wins: number;
  settled: SettledRunEnd;
  battle?: BattleState | null;
  run?: CurrentRunData | null;
  battleReward?: number;
  clearBonus?: number;
  allInBonus?: number;
}): ResultSummaryState {
  const settled = options.settled;
  const coinRows: ResultSummaryState["coin_rows"] = [];
  if (options.battleReward !== undefined) coinRows.push({label: "本场胜利奖励", value: `${options.battleReward}金币`, detail: "击败本场训练师获得"});
  if (options.clearBonus !== undefined) coinRows.push({label: "连续通关奖励", value: `${options.clearBonus}金币`, detail: "完成整轮挑战获得"});
  if (options.allInBonus) coinRows.push({label: "孤注一掷翻倍", value: `${options.allInBonus}金币`, detail: "获胜后按当前金币翻倍"});
  coinRows.push(
    {label: "道具卖出总计", value: `${settled.refundGained}金币`, detail: "结算时按当前背包返还比例折算"},
    {label: "回收票据", value: `${settled.receiptBonus}金币`, detail: "按本局回收流水追加"},
    {label: "投资组合", value: `${settled.portfolioBonus}金币`, detail: settled.portfolioTypes.length ? settled.portfolioTypes.join(" / ") : "本局未触发"},
    {label: "天使基金不折算", value: `${settled.excludedCoins}金币`, detail: "开局基金剩余部分不进入 BP 折算"},
  );
  const bpRows: ResultSummaryState["bp_rows"] = [
    {label: "金币折算 BP", value: `${settled.convertedCoins}金币 -> ${settled.convertedBp}BP`, detail: "结算时向下取整"},
  ];
  if (settled.paidBack) bpRows.push({label: "临时 BP 扣回", value: `${settled.paidBack}BP`, detail: "先手预言等临时 BP 在结算时扣回"});
  const rows: ResultSummaryState["rows"] = [
    {label: "结果", value: options.outcome === "win" ? "WIN" : options.outcome === "loss" ? "LOST" : "ABORT", detail: options.headline},
    {label: "连胜", value: `${options.wins}`},
    ...coinRows,
    ...bpRows,
  ];
  const playerTeam = options.battle?.player_display || options.run?.player_display || [];
  return {
    outcome: options.outcome,
    headline: options.headline,
    subtitle: options.subtitle,
    rows,
    coin_rows: coinRows,
    bp_rows: bpRows,
    talents: options.battle?.player_talents?.length ? options.battle.player_talents : options.run?.talents || [],
    used_pokemon: resultUsedPokemon(options.run, playerTeam),
    progress: resultProgressRows({run: options.run, wins: options.wins, outcome: options.outcome, battle: options.battle}),
    player_team: playerTeam,
    enemy_team: options.battle?.enemy_display || options.run?.enemy_display || [],
    enemy_trainer: options.battle?.enemy_trainer || options.run?.enemy_trainer,
  };
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

const ITEM_ICON_ALIASES: Record<string, string> = {
  berry: "oranberry",
  berserkgene: "mentalherb",
  bitterberry: "persimberry",
  burntberry: "aspearberry",
  goldberry: "sitrusberry",
  iceberry: "aspearberry",
  mail: "airmail",
  mintberry: "chestoberry",
  miracleberry: "lumberry",
  mysteryberry: "leppaberry",
  pinkbow: "silkscarf",
  polkadotbow: "silkscarf",
  przcureberry: "cheriberry",
  psncureberry: "pechaberry",
};

const Z_CRYSTAL_ICON_TYPES: Record<string, string> = {
  aloraichiumz: "electric",
  buginiumz: "bug",
  darkiniumz: "dark",
  decidiumz: "ghost",
  dragoniumz: "dragon",
  eeviumz: "normal",
  electriumz: "electric",
  fairiumz: "fairy",
  fightiniumz: "fighting",
  firiumz: "fire",
  flyiniumz: "flying",
  ghostiumz: "ghost",
  grassiumz: "grass",
  groundiumz: "ground",
  iciumz: "ice",
  inciniumz: "dark",
  kommoniumz: "dragon",
  lunaliumz: "ghost",
  lycaniumz: "rock",
  marshadiumz: "ghost",
  mewniumz: "psychic",
  mimikiumz: "fairy",
  normaliumz: "normal",
  pikaniumz: "electric",
  pikashuniumz: "electric",
  poisoniumz: "poison",
  primariumz: "water",
  psychiumz: "psychic",
  rockiumz: "rock",
  snorliumz: "normal",
  solganiumz: "steel",
  steeliumz: "steel",
  tapuniumz: "fairy",
  ultranecroziumz: "psychic",
  wateriumz: "water",
};

function itemIconAssetByAssetId(assetId: string): string | null {
  const normalized = itemKey(assetId);
  if (!normalized) return null;
  const packIconPath = path.join(projectRoot, "assets", "items-pack", `${normalized}.png`);
  if (existsSync(packIconPath)) return `assets/items-pack/${normalized}.png`;
  const iconPath = path.join(projectRoot, "assets", "items", `${normalized}.png`);
  return existsSync(iconPath) ? `assets/items/${normalized}.png` : null;
}

function itemIconAsset(itemId: string, fallback = "assets/placeholders/item.png"): string {
  const normalized = itemKey(itemId);
  if (!normalized) return fallback;
  const direct = itemIconAssetByAssetId(normalized);
  if (direct) return direct;
  const alias = ITEM_ICON_ALIASES[normalized];
  if (alias) {
    const aliasAsset = itemIconAssetByAssetId(alias);
    if (aliasAsset) return aliasAsset;
  }
  const zType = Z_CRYSTAL_ICON_TYPES[normalized];
  if (zType) {
    const zAsset = itemIconAssetByAssetId(`${zType}gem`) || itemIconAssetByAssetId(`${zType}memory`);
    if (zAsset) return zAsset;
  }
  return fallback;
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

async function itemBaseCostById(itemId: string, fallback = 5 * BP_SCALE): Promise<number> {
  const normalized = itemKey(itemId);
  const shopEntry = (await loadShopPool()).find(entry => entry.kind === "item" && entry.id === normalized);
  if (shopEntry) return shopEntry.cost;
  const guaranteed = GUARANTEED_SHOP_ITEMS.find(entry => entry.id === normalized);
  if (guaranteed) return guaranteed.cost;
  const starterEntry = (await loadStarterItemPool()).find(entry => entry.kind === "item" && entry.id === normalized);
  if (starterEntry) return starterEntry.cost;
  return goodsCost("item", normalized, fallback);
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

function battleSettingAllowsItem(itemId: string, setting?: BattleSetting | null): boolean {
  const normalized = itemKey(itemId);
  if (!normalized) return false;
  const system = gameService.battleSystemForItem(normalized);
  if (!system) return true;
  return normalizeBattleSetting(setting || DEFAULT_BATTLE_SETTING).enabled_battle_systems.includes(system);
}

function isSpecialBattleItem(itemId: string): boolean {
  const normalized = itemKey(itemId);
  return Boolean(normalized && gameService.battleSystemForItem(normalized));
}

function isRegularHeldShopItem(entry: ShopPoolEntry): boolean {
  return entry.kind === "item" && entry.category === "held" && !isSpecialBattleItem(entry.id);
}

function normalizeShopKind(value: unknown): ShopKind {
  return value === "held" || value === "tm" || value === "recovery" ? value : "recovery";
}

function shopNextRollCostForKind(run: CurrentRunData, kind: ShopKind): number {
  if (Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0) return 0;
  return Math.ceil(SHOP_KIND_CONFIG[kind].rollCost * eventShopPriceMultiplier(run));
}

function eventShopPriceMultiplier(run: CurrentRunData): number {
  return Math.max(0.1, Number(run.rest_status?.event_shop_price_multiplier || 1));
}

function eventRecoveryMultiplier(run: CurrentRunData): number {
  return Math.max(0, Number(run.rest_status?.event_recovery_multiplier || 1));
}

type ForgeItemKind = "recovery" | "berry" | "pp" | "held" | "tm" | "special";

async function forgeKindForItem(itemId: string): Promise<ForgeItemKind> {
  const id = itemKey(itemId);
  if (isTmItemId(id)) return "tm";
  if (isSpecialBattleItem(id)) return "special";
  const item = await itemDetailsById(id);
  const text = `${id} ${item.desc || ""} ${item.desc_zh || ""}`.toLowerCase();
  if (id.endsWith("berry") || text.includes("berry") || text.includes("树果")) return "berry";
  if (/ether|elixir/.test(id) || /\bpp\b/.test(text)) return "pp";
  const category = itemCategory(item);
  return category === "held" ? "held" : "recovery";
}

async function forgePoolForKind(kind: Exclude<ForgeItemKind, "special">, run: CurrentRunData, excluded: Set<string>): Promise<string[]> {
  if (kind === "tm") {
    return (await gameService.machineMoves())
      .map(move => tmItemId(move.id || move.name))
      .filter(id => id && !excluded.has(itemKey(id)));
  }
  const pool = await loadShopPool();
  return pool
    .filter(entry => {
      const bucket = shopPoolBucketForEntry(entry);
      if (kind === "held") return isRegularHeldShopItem(entry);
      if (kind === "berry") return bucket === "berry";
      if (kind === "pp") return bucket === "pp";
      return bucket === "healing";
    })
    .filter(entry => battleSettingAllowsItem(entry.id, run.battle_setting))
    .map(entry => itemKey(entry.id))
    .filter(id => id && !excluded.has(id));
}

async function rollForgeRewards(run: CurrentRunData, itemIds: string[]): Promise<string[]> {
  const normalized = itemIds.map(itemKey).filter(Boolean);
  if (normalized.length !== 3) throw new Error("熔炉需要投入 3 个道具。");
  const counts = new Map<string, number>();
  for (const id of normalized) counts.set(id, Number(counts.get(id) || 0) + 1);
  for (const [id, count] of counts) {
    if (Number(run.bag_items?.[id] || 0) < count) throw new Error("背包材料数量不足。");
  }
  const kinds = await Promise.all(normalized.map(id => forgeKindForItem(id)));
  if (kinds.includes("special")) throw new Error("Mega 石和 Z 纯晶请使用特殊熔炉。");
  const sameKind = kinds.every(kind => kind === kinds[0]);
  const rewardCount = sameKind ? 2 : 1;
  const rng = seededRng(Number(run.seed || 1), 0xf067 + Number(run.battle_no || run.next_battle || 0) * 43 + normalized.join("|").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  const excluded = new Set(normalized);
  const rewards: string[] = [];
  for (let index = 0; index < rewardCount; index += 1) {
    const targetKind = sameKind ? kinds[0] as Exclude<ForgeItemKind, "special"> : shuffleByRng(kinds as Array<Exclude<ForgeItemKind, "special">>, rng)[0];
    const pool = await forgePoolForKind(targetKind, run, new Set([...excluded, ...rewards.map(itemKey)]));
    const reward = shuffleByRng(pool, rng)[0];
    if (reward) rewards.push(reward);
  }
  if (!rewards.length) throw new Error("当前材料没有可用的重铸池。");
  return rewards;
}

function specialForgePoolForItem(itemId: string): string[] {
  const id = itemKey(itemId);
  const system = gameService.battleSystemForItem(id);
  if (system === "mega") return gameService.megaStoneItemIds().filter(value => itemKey(value) !== id);
  if (system === "zmove") return gameService.zCrystalItemIds().filter(value => itemKey(value) !== id);
  return [];
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

function battleSettingHasTerastal(setting?: BattleSetting | null): boolean {
  const normalized = normalizeBattleSetting(setting || DEFAULT_BATTLE_SETTING);
  return normalized.battle_rule_preset === "gen9" && normalized.enabled_battle_systems.includes("terastal");
}

function randomTeraOrbType(seed: number, salt = 0): {type: string; typeZh: string} {
  const rng = seededRng(seed || 1, 0x7465 + salt);
  const type = TERA_ORB_TYPES[Math.floor(rng() * TERA_ORB_TYPES.length)] || "Normal";
  return {type, typeZh: TERA_ORB_TYPE_ZH[type] || type};
}

function applyTeraOrbToRunTeam(run: CurrentRunData): void {
  if (!battleSettingHasTerastal(run.battle_setting)) {
    delete run.tera_orb_type;
    delete run.tera_orb_type_zh;
    run.player_team = (run.player_team || []).map(set => {
      const next = {...set};
      delete next.teraType;
      return next;
    });
    run.player_display = (run.player_display || []).map(pokemon => ({...pokemon, tera_type: undefined, tera_type_zh: undefined}));
    return;
  }
  if (!run.tera_orb_type) {
    const rolled = randomTeraOrbType(Number(run.seed || 1));
    run.tera_orb_type = rolled.type;
    run.tera_orb_type_zh = rolled.typeZh;
  }
  const type = run.tera_orb_type;
  const typeZh = run.tera_orb_type_zh || TERA_ORB_TYPE_ZH[type] || type;
  run.tera_orb_type_zh = typeZh;
  run.player_team = (run.player_team || []).map(set => ({...set, teraType: type}));
  run.player_display = (run.player_display || []).map(pokemon => ({...pokemon, tera_type: type, tera_type_zh: typeZh}));
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
  const cost = await itemBaseCostById(normalized);
  const icon_asset = item?.icon_asset || itemIconAsset(normalized);
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
      cost: Math.max(0, Number(meta?.cost ?? item.cost ?? 0)),
      desc: meta?.desc || item.desc,
      desc_zh: meta?.desc_zh || item.desc_zh,
      icon_asset: meta?.icon_asset || item.icon_asset,
    };
    let category = (meta?.category as ItemCategory | undefined) || itemCategory(item);
    if (category === "consumable" && !(await gameService.hasConsumableItemEffect(normalized))) category = "held";
    const sellPrice = sellPriceForItem(displayItem, run);
    const moveId = isTmItemId(normalized) ? normalized.slice(3) : undefined;
    result[category].push({
      ...displayItem,
      id: normalized,
      count: Number(count),
      category,
      item_battle_system: gameService.battleSystemForItem(normalized) || undefined,
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
      cost: Math.max(0, Math.floor(Number((offer as Partial<ShopOffer>).cost ?? 0))),
      icon_asset: (offer as Partial<ShopOffer>).icon_asset,
      category: (offer as Partial<ShopOffer>).category || itemCategory(categorySource),
      move_id: (offer as Partial<ShopOffer>).move_id,
      move_name: (offer as Partial<ShopOffer>).move_name,
      move_name_zh: (offer as Partial<ShopOffer>).move_name_zh,
    },
  };
}

function shopItemPurchaseCount(run: CurrentRunData, itemId: string): number {
  return Math.max(0, Math.floor(Number(run.shop_purchased_item_counts?.[itemKey(itemId)] || 0)));
}

function pricedShopOfferForRun(run: CurrentRunData, offer: ShopOffer, extraPurchases = 0): ShopOffer {
  const itemId = itemKey(offer.id || offer.name);
  const purchased = shopItemPurchaseCount(run, itemId) + Math.max(0, Math.floor(Number(extraPurchases || 0)));
  const surcharge = purchased * SHOP_REPEAT_PURCHASE_SURCHARGE;
  return {...offer, cost: Math.ceil((Math.max(0, Math.floor(Number(offer.cost || 0))) + surcharge) * eventShopPriceMultiplier(run))};
}

function pricedShopOffersForRun(run: CurrentRunData): ShopOffer[] {
  return (run.shop_offers || []).map(offer => pricedShopOfferForRun(run, offer));
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
      if (source === "shop" && !(move.learn_sources || []).includes("machine")) continue;
      seen.add(moveId);
      moves.push(move);
    }
  }
  const rng = seededRng(Number(run.seed || 1), 0x7a11 + Number(run.battle_no || run.next_battle || 0));
  return Promise.all(shuffleByRng(moves, rng).slice(0, limit).map((move, index) => tmOfferFromMove(move, index, source, 1, run.talents || [])));
}

async function tmShopOptionsForRun(run: CurrentRunData): Promise<ShopOffer[]> {
  const rng = seededRng(Number(run.seed || 1), 0x7a91 + Number(run.shop_roll_count || 0) * 131 + Number(run.battle_no || run.next_battle || 0));
  const usableByCurrentTeam = new Map<string, MoveSummary>();
  for (const rawSet of run.player_team || []) {
    for (const move of await gameService.learnableMoves(rawSet)) {
      if (!(move.learn_sources || []).includes("machine")) continue;
      const moveId = toId(move.id || move.name);
      if (moveId && !usableByCurrentTeam.has(moveId)) usableByCurrentTeam.set(moveId, move);
    }
  }
  const machineMoves = await gameService.machineMoves();
  const unusable = machineMoves.filter(move => !usableByCurrentTeam.has(toId(move.id || move.name)));
  const pickedUsable = shuffleByRng(Array.from(usableByCurrentTeam.values()), rng).slice(0, 2);
  const pickedUnusable = shuffleByRng(unusable, rng).slice(0, 1);
  const picks = [...pickedUsable, ...pickedUnusable];
  return Promise.all(picks.map((move, index) => tmOfferFromMove(move, index, "shop", 1, run.talents || [])));
}

async function starterTmOptions(runSeed: number, talents: TalentView[] = [], battleSetting: BattleSetting = normalizeBattleSetting(DEFAULT_BATTLE_SETTING), limit = 24): Promise<ShopOffer[]> {
  const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(runSeed, 77), "gen9randombattle", 6, {battleSetting, purpose: "starter"});
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

async function shopOfferFromPoolEntry(entry: ShopPoolEntry, index: number, talents: TalentView[], battleSetting?: BattleSetting | null): Promise<ShopOffer | null> {
  if (!battleSettingAllowsItem(entry.id, battleSetting)) return null;
  const item = (await gameService.itemOptions()).find(option => itemKey(option.id || option.name) === entry.id);
  const localItem = LOCAL_ITEM_DETAILS[entry.id];
  if (!item && !localItem) return null;
  const icon_asset = item?.icon_asset || itemIconAsset(entry.id);
  const detail = item || {id: entry.id, ...localItem, cost: entry.cost || 5 * BP_SCALE, icon_asset};
  const base = {...detail, id: entry.id, cost: entry.cost || detail.cost || 5 * BP_SCALE, icon_asset};
  return {
    ...detail,
    id: entry.id,
    cost: pricedForShop(base, talents),
    icon_asset,
    offer_id: `shop-pool-${index}-${entry.id}`,
    category: entry.category,
    source: "shop",
  };
}

async function guaranteedShopOffer(index: number, run: CurrentRunData, rng: () => number): Promise<ShopOffer | null> {
  const guaranteed = GUARANTEED_SHOP_ITEMS[Math.floor(rng() * GUARANTEED_SHOP_ITEMS.length)] || GUARANTEED_SHOP_ITEMS[0];
  const entry: ShopPoolEntry = {id: guaranteed.id, kind: "item", category: "consumable", cost: guaranteed.cost, weight: 1, enabled: true, notes: "guaranteed recovery"};
  const offer = await shopOfferFromPoolEntry(entry, index, run.talents || [], run.battle_setting);
  return offer ? {...offer, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-guaranteed-${guaranteed.id}`} : null;
}

async function rollShopOffers(run: CurrentRunData, shopKind: ShopKind = "recovery"): Promise<ShopOffer[]> {
  const kind = normalizeShopKind(shopKind);
  if (kind === "tm") {
    return (await tmShopOptionsForRun(run)).map((offer, index) => ({...offer, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-${itemKey(offer.id || offer.name)}`}));
  }
  const pool = await loadShopPool();
  const itemEntries = pool.filter(entry => {
    if (!battleSettingAllowsItem(entry.id, run.battle_setting)) return false;
    if (kind === "held") return isRegularHeldShopItem(entry);
    return entry.kind === "item";
  });
  const itemOffers = (await Promise.all(itemEntries.map((entry, index) => shopOfferFromPoolEntry(entry, index, run.talents || [], run.battle_setting))))
    .filter((item): item is ShopOffer => Boolean(item))
    .map((item, index) => {
      const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(item.id || item.name));
      return {...item, offer_id: `shop-item-${index}-${itemKey(item.id || item.name)}`, weight: entry?.weight || 1};
    });
  const buckets: Partial<Record<ShopPoolBucket, Array<ShopOffer & {weight?: number}>>> = {
    healing: [],
    held: [],
    pp: [],
    berry: [],
    tm: [],
  };
  for (const offer of itemOffers) {
    const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(offer.id || offer.name));
    const bucket = entry ? shopPoolBucketForEntry(entry) : null;
    if (bucket && bucket !== "tm" && SHOP_KIND_CONFIG[kind].buckets.includes(bucket)) buckets[bucket]?.push(offer);
  }
  const rng = seededRng(Number(run.seed || 1), 0x5100 + Number(run.shop_roll_count || 0) * 97 + Number(run.battle_no || run.next_battle || 0));
  const count = shopOfferCount(run);
  const result: ShopOffer[] = [];
  const candidateLimit = shopCandidateCount(run);
  for (let index = 0; index < count; index += 1) {
    const allowedBuckets = SHOP_KIND_CONFIG[kind].buckets;
    const bucket = weightedPick(allowedBuckets.filter(entry => (buckets[entry] || []).length > 0).map(entry => ({bucket: entry, weight: SHOP_BUCKET_WEIGHTS[entry]})), rng)?.bucket;
    const bucketPool = bucket ? shuffleByRng(buckets[bucket] || [], rng).slice(0, Math.max(1, candidateLimit)) : [];
    const selected = bucket ? weightedPick(bucketPool, rng) : null;
    if (!selected) break;
    const {weight: _weight, ...offer} = selected as ShopOffer & {weight?: number};
    const slotDiscount = Number(run.rest_status?.shop_slot_discounts?.[index] || 0);
    const cost = slotDiscount > 0 ? Math.floor(Number(offer.cost || 0) * slotDiscount) : Number(offer.cost || 0);
    result.push({...offer, cost, discount: slotDiscount || offer.discount, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-${itemKey(offer.id || offer.name)}`});
  }
  const hasGuaranteed = result.some(offer => GUARANTEED_SHOP_ITEMS.some(item => item.id === itemKey(offer.id || offer.name)));
  if (kind === "recovery" && !hasGuaranteed) {
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

async function starterItemOffers(runSeed: number, talents: TalentView[] = [], upgrades?: StarterUpgradeState, battleSetting: BattleSetting = normalizeBattleSetting(DEFAULT_BATTLE_SETTING)): Promise<ShopOffer[]> {
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
      ? (await starterTmOptions(runSeed, talents, battleSetting)).map((offer, index) => ({
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
    entries.filter(entry => entry.kind === "item" && battleSettingAllowsItem(entry.id, battleSetting)).forEach((entry, index) => {
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

function routeForRunBattle(save: LocalSave, run: CurrentRunData, battleNo: number): BossRoute {
  if (run.named_champion_id && battleNo === Number(run.battles || DEFAULT_BATTLES)) {
    return {type: "champion", stage: "champion", route: "named:champion", pool: [{type: "champion", tier: "champion"}]};
  }
  return routeBossForBattle(Number(save.stats?.set_win_streak || 0), battleNo);
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

function starterSpeciesTiersForStreak(setStreak: number, count: number): SpeciesTier[] {
  const base: SpeciesTier[] = setStreak <= 0
    ? [3, 4, 4, 4, 5, 5]
    : setStreak === 1
      ? [4, 4, 5, 5, 5, 6]
      : [4, 5, 5, 6, 6, 6];
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
      battle_rule_preset: (["none", "gen7", "gen8", "gen9"].includes(row.battle_rule_preset) ? row.battle_rule_preset : "none") as BattleRulePreset,
      trainer_id: row.trainer_id,
      team_index: Number(row.team_index || 0),
      slot: Number(row.slot || 0),
      species_id: row.species_id,
      species: row.species || undefined,
      species_tier: Number(row.species_tier || 0) as SpeciesTier || undefined,
      generation_profile: (row.generation_profile || "tier1") as GenerationProfile,
    };
  }).filter(row => row.pool_id && row.species_id && row.team_index && row.slot);
  return bossTeamPoolCache;
}

function bossTeamForTrainer(trainer: TrainerNpcView, run: CurrentRunData, battleNo: number): {teamIndex: number; rows: BossTeamPoolRow[]; speciesIds: string[]; profiles: GenerationProfile[]} | null {
  const poolId = trainer.team_pool_id || trainer.team_pool_ids?.[0];
  if (!poolId) return null;
  const preset = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING).battle_rule_preset;
  const allPoolRows = loadBossTeamPools().filter(row => row.pool_id === poolId);
  const trainerRows = allPoolRows.filter(row => row.trainer_id === trainer.id);
  const poolRows = trainerRows.length ? trainerRows : allPoolRows;
  const rows = poolRows.filter(row => row.battle_rule_preset === preset);
  const fallbackRows = rows.length ? rows : poolRows.filter(row => row.battle_rule_preset === "none");
  if (!fallbackRows.length) return null;
  const selectedPreset = rows.length ? preset : "none";
  const teamIndexes = [...new Set(fallbackRows.map(row => row.team_index))].sort((a, b) => a - b);
  const teamIndex = pickStable(teamIndexes, run.seed || 0, battleNo, trainer.id, poolId, selectedPreset) || teamIndexes[0];
  const selected = fallbackRows.filter(row => row.team_index === teamIndex).sort((a, b) => a.slot - b.slot).slice(0, 3);
  if (selected.length < 3) return null;
  return {teamIndex, rows: selected, speciesIds: selected.map(row => row.species_id), profiles: selected.map(row => row.generation_profile)};
}

async function buildPlannedBattle(save: LocalSave, run: CurrentRunData, battleNo: number): Promise<PlannedBattleData> {
  const route = routeForRunBattle(save, run, battleNo);
  const enemyTrainer = chooseTrainerForRoute(route, run, battleNo);
  const routeSalt = route.type === "normal" ? 100 : route.type === "champion" ? 700 : route.stage.includes("tier3") ? 603 : route.stage === "tier2" ? 602 : 601;
  const bossTeam = route.type === "normal" ? null : bossTeamForTrainer(enemyTrainer, run, battleNo);
  const profiles = bossTeam?.profiles || (route.type === "normal" ? normalEnemyProfilesForBattle(Number(save.stats?.set_win_streak || 0), battleNo) : profilesForRoute(route));
  const enemyGenerated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), routeSalt + battleNo), "gen9randombattle", profiles.length, {profiles, speciesIds: bossTeam?.speciesIds, purpose: route.type === "normal" ? "normal" : "boss", battleSetting: run.battle_setting});
  const enemyRaw = enemyGenerated.team.slice(0, 3);
  const enemyDisplay = enemyGenerated.display.slice(0, 3);
  ensureTeamRunMemberIds(enemyRaw, enemyDisplay);
  assignEnemyShowdownIds(enemyRaw, enemyDisplay);
  return {
    battle_no: battleNo,
    route_type: route.type,
    route_stage: route.stage,
    route_route: route.route,
    generation_stage: profiles.join("|"),
    enemy_team_pool_id: enemyTrainer.team_pool_id,
    enemy_trainer: enemyTrainer,
    enemy_raw: enemyRaw,
    enemy_display: enemyDisplay,
    battle_background: battleBackgroundForRun({...run, boss_route: route.route}, enemyTrainer, battleNo),
  };
}

async function buildPlannedBattles(save: LocalSave, run: CurrentRunData): Promise<PlannedBattleData[]> {
  const total = Math.max(1, Number(run.battles || DEFAULT_BATTLES));
  const planned: PlannedBattleData[] = [];
  for (let battleNo = 1; battleNo <= total; battleNo += 1) planned.push(await buildPlannedBattle(save, run, battleNo));
  return planned;
}

async function refreshPlannedBattle(save: LocalSave, run: CurrentRunData, battleNo: number): Promise<void> {
  const planned = await buildPlannedBattle(save, run, battleNo);
  run.planned_battles = [...(run.planned_battles || []).filter(entry => Number(entry.battle_no) !== battleNo), planned]
    .sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
}

async function ensurePlannedBattle(save: LocalSave, run: CurrentRunData, battleNo: number): Promise<PlannedBattleData> {
  const existing = (run.planned_battles || []).find(entry => Number(entry.battle_no) === battleNo);
  if (existing) return existing;
  const planned = await buildPlannedBattle(save, run, battleNo);
  run.planned_battles = [...(run.planned_battles || []), planned].sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
  return planned;
}

function bossPoolSlotKey(poolId: string | undefined, preset: BattleRulePreset | undefined, teamIndex: number, slot: number, speciesId: string): string {
  return `${poolId || "pool"}:${preset || "none"}:${teamIndex}:${slot}:${speciesId}`;
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
    const key = bossPoolSlotKey(poolId, row.battle_rule_preset, row.team_index, row.slot, row.species_id);
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
  const allRows = loadBossTeamPools().filter(row => poolIds.includes(row.pool_id) && row.battle_rule_preset === "none");
  const trainerRows = allRows.filter(row => row.trainer_id === trainer.id);
  const rows = (trainerRows.length ? trainerRows : allRows).sort((a, b) => a.team_index - b.team_index || a.slot - b.slot);
  const byTeam = new Map<number, BossTeamPoolRow[]>();
  for (const row of rows) {
    const list = byTeam.get(row.team_index) || [];
    list.push(row);
    byTeam.set(row.team_index, list);
  }
  return [...byTeam.entries()].map(([teamIndex, teamRows]) => ({
    team_index: teamIndex,
    slots: teamRows.sort((a, b) => a.slot - b.slot).slice(0, 3).map(row => {
      const key = bossPoolSlotKey(row.pool_id, row.battle_rule_preset, row.team_index, row.slot, row.species_id);
      const seen = record?.seen_pokemon?.[key];
      return {
        key,
        team_index: row.team_index,
        slot: row.slot,
        species_id: row.species_id,
        species: row.species,
        species_tier: row.species_tier,
        battle_rule_preset: row.battle_rule_preset,
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
  const planned = await ensurePlannedBattle(save, run, battleNo);
  const route = {type: planned.route_type, stage: planned.route_stage, route: planned.route_route, pool: []} as BossRoute;
  const trainer = planned.enemy_trainer;
  const enemies = (planned.enemy_display || []).slice(0, 3);
  const label = route.type === "normal" ? "普通 NPC" : route.type === "champion" ? "冠军" : route.type === "elite4" ? "四天王" : "馆主";
  return {route, trainer, enemies, label};
}

async function buildNightSkyState(save: LocalSave, run: CurrentRunData): Promise<CurrentRunData["night_sky"] | undefined> {
  const previousRows = run.night_sky?.rows || [];
  const rows = [];
  const battles = Math.max(1, Number(run.battles || DEFAULT_BATTLES));
  const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
  const rumorLevel = talentLevel(run.talents, "intel_rumor");
  for (let battleNo = 1; battleNo <= battles; battleNo += 1) {
    const previous = previousRows.find(row => Number(row.battle_no) === battleNo);
    const preview = await generateOpponentPreview(save, run, battleNo);
    const encountered = battleNo <= currentBattleNo;
    const namedVisible = Boolean(preview.route.type === "champion" && run.named_champion_id && preview.trainer.id === run.named_champion_id);
    const trainerVisible = encountered || rumorLevel >= 1 || namedVisible;
    const revealed = encountered ? 3 : Math.max(0, Math.min(3, previous?.unlocked ? 3 : Number(previous?.revealed || 0)));
    rows.push({
      battle_no: battleNo,
      label: preview.label,
      trainer: preview.trainer,
      route_type: preview.route.type,
      trainer_visible: trainerVisible,
      encountered,
      named_visible: namedVisible,
      revealed,
      unlocked: Boolean(previous?.unlocked || revealed >= 3),
      enemies: preview.enemies.slice(0, 3).map((enemy, index) => trainerVisible && index < revealed ? enemy : null),
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
  if (value >= 120) return 800;
  if (value > 90) return 650;
  if (value > 60) return 500;
  if (value > 30) return 400;
  return 300;
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

function runMemberId(value: unknown): string {
  return String((value as {run_member_id?: unknown} | undefined)?.run_member_id || "").trim();
}

function normalizeShowdownId(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

const SHOWDOWN_ID_SET = new Set<string>(SHOWDOWN_ID_POOL);

function isValidShowdownId(value: unknown): string {
  const id = normalizeShowdownId(value);
  return SHOWDOWN_ID_SET.has(id) ? id : "";
}

function candidateShowdownId(...values: unknown[]): string {
  for (const value of values) {
    const id = isValidShowdownId(value);
    if (id) return id;
  }
  return "";
}

function writePokemonShowdownId(raw: PokemonSet | undefined, display: RentalPokemon | undefined, state: PlayerPokemonState | undefined, id: string): void {
  if (raw) {
    raw.showdown_id = id;
    raw.pokeball = id;
  }
  if (display) display.showdown_id = id;
  if (state) state.showdown_id = id;
}

function stablePlayerSlotShowdownId(run: CurrentRunData, slot: number, ...fallbacks: unknown[]): string {
  return candidateShowdownId(...fallbacks, run.player_team?.[slot]?.showdown_id, run.player_display?.[slot]?.showdown_id, run.player_state?.[slot]?.showdown_id, run.player_team?.[slot]?.pokeball)
    || takeRunShowdownId(run);
}

function writePlayerSlotShowdownId(run: CurrentRunData, slot: number, states?: PlayerPokemonState[], id?: string): string {
  const stableId = id || stablePlayerSlotShowdownId(run, slot, states?.[slot]?.showdown_id);
  writePokemonShowdownId(run.player_team?.[slot], run.player_display?.[slot], states?.[slot], stableId);
  return stableId;
}

function nextPoolId(queue: string[], used: Set<string>): string {
  while (queue.length) {
    const id = isValidShowdownId(queue.shift());
    if (id && !used.has(id)) return id;
  }
  const fallback = SHOWDOWN_ID_POOL.find(id => !used.has(id));
  if (!fallback) throw new Error("Showdown ID 池已耗尽。");
  return fallback;
}

function normalizeRunShowdownIdPool(run: CurrentRunData): void {
  const preferredQueue = [
    ...(run.showdown_id_pool?.available || []),
    ...SHOWDOWN_ID_POOL,
  ].map(isValidShowdownId).filter(Boolean);
  const queue = Array.from(new Set(preferredQueue));
  const used = new Set<string>();
  const length = Math.max(run.player_team?.length || 0, run.player_display?.length || 0, run.player_state?.length || 0);
  for (let index = 0; index < length; index += 1) {
    const raw = run.player_team?.[index];
    const display = run.player_display?.[index];
    const state = run.player_state?.[index];
    let id = candidateShowdownId(raw?.showdown_id, display?.showdown_id, state?.showdown_id, raw?.pokeball);
    if (!id || used.has(id)) id = nextPoolId(queue, used);
    used.add(id);
    writePokemonShowdownId(raw, display, state, id);
  }
  const available = [
    ...queue,
    ...SHOWDOWN_ID_POOL,
  ].map(isValidShowdownId).filter(id => id && !used.has(id));
  run.showdown_id_pool = {used: Array.from(used), available: Array.from(new Set(available))};
}

function takeRunShowdownId(run: CurrentRunData): string {
  normalizeRunShowdownIdPool(run);
  const used = new Set((run.showdown_id_pool?.used || []).map(isValidShowdownId).filter(Boolean));
  const available = [...(run.showdown_id_pool?.available || [])].map(isValidShowdownId).filter(Boolean);
  const id = nextPoolId(available, used);
  used.add(id);
  run.showdown_id_pool = {used: Array.from(used), available: available.filter(value => value !== id)};
  return id;
}

function releaseRunShowdownId(run: CurrentRunData, id: unknown): void {
  const released = isValidShowdownId(id);
  if (!released) return;
  normalizeRunShowdownIdPool(run);
  const used = (run.showdown_id_pool?.used || []).filter(value => isValidShowdownId(value) !== released);
  const available = (run.showdown_id_pool?.available || []).filter(value => isValidShowdownId(value) && isValidShowdownId(value) !== released);
  available.push(released);
  run.showdown_id_pool = {used, available};
}

function takeReplacementRunShowdownId(run: CurrentRunData, slot: number, oldId: unknown): string {
  normalizeRunShowdownIdPool(run);
  const released = isValidShowdownId(oldId);
  const used = new Set<string>();
  const length = Math.max(run.player_team?.length || 0, run.player_display?.length || 0, run.player_state?.length || 0);
  for (let index = 0; index < length; index += 1) {
    if (index === slot) continue;
    const id = candidateShowdownId(run.player_team?.[index]?.showdown_id, run.player_display?.[index]?.showdown_id, run.player_state?.[index]?.showdown_id, run.player_team?.[index]?.pokeball);
    if (id) used.add(id);
  }
  const available = [...(run.showdown_id_pool?.available || []), ...SHOWDOWN_ID_POOL]
    .map(isValidShowdownId)
    .filter(id => id && !used.has(id) && id !== released);
  const queue = Array.from(new Set(available));
  const id = nextPoolId(queue, used);
  used.add(id);
  const rest = [...queue, ...SHOWDOWN_ID_POOL]
    .map(isValidShowdownId)
    .filter(value => value && !used.has(value) && value !== released);
  const uniqueRest = Array.from(new Set(rest));
  if (released && !used.has(released)) uniqueRest.push(released);
  run.showdown_id_pool = {used: Array.from(used), available: uniqueRest};
  return id;
}

function createRunMemberId(): string {
  return `rpm_${randomUUID()}`;
}

function ensureTeamRunMemberIds(team: PokemonSet[] = [], display: RentalPokemon[] = []): void {
  const length = Math.max(team.length, display.length);
  for (let index = 0; index < length; index += 1) {
    const raw = team[index] as PokemonSet | undefined;
    const shown = display[index] as RentalPokemon | undefined;
    const id = runMemberId(raw) || runMemberId(shown) || createRunMemberId();
    if (raw) raw.run_member_id = id;
    if (shown) shown.run_member_id = id;
  }
}

function ensureTeamShowdownIds(team: PokemonSet[] = [], display: RentalPokemon[] = [], states: PlayerPokemonState[] | undefined): void {
  const length = Math.max(team.length, display.length, states?.length || 0);
  const used = new Set<string>();
  const queue = [...SHOWDOWN_ID_POOL];
  for (let index = 0; index < length; index += 1) {
    let id = candidateShowdownId(team[index]?.showdown_id, display[index]?.showdown_id, states?.[index]?.showdown_id, team[index]?.pokeball);
    if (!id || used.has(id)) id = nextPoolId(queue, used);
    used.add(id);
    writePokemonShowdownId(team[index], display[index], states?.[index], id);
  }
}

function assignEnemyShowdownIds(team: PokemonSet[] = [], display: RentalPokemon[] = []): void {
  ensureTeamShowdownIds(team, display, undefined);
}

function shortStateIdent(ident: unknown): string {
  return String(ident || "").replace(/^p[12]:\s*/, "").trim();
}

function addIdentityKey(keys: Set<string>, prefix: string, value: unknown): void {
  const normalized = toId(String(value || ""));
  if (normalized) keys.add(`${prefix}:${normalized}`);
}

function addSpeciesIdentityKeys(keys: Set<string>, value: unknown): void {
  const raw = String(value || "").trim();
  if (!raw) return;
  addIdentityKey(keys, "species", raw);
  addIdentityKey(keys, "details_species", raw.split(",", 1)[0]);
}

function addMoveIdentityKey(keys: Set<string>, species: unknown, moves: unknown): void {
  const speciesId = toId(String(species || ""));
  if (!speciesId || !Array.isArray(moves)) return;
  const moveIds = moves.map((move: any) => toId(move?.id || move?.move || move?.name || move)).filter(Boolean).sort();
  if (moveIds.length) keys.add(`species_moves:${speciesId}:${moveIds.join(",")}`);
}

function stateIdentityKeys(state: Partial<PlayerPokemonState>): Set<string> {
  const keys = new Set<string>();
  addIdentityKey(keys, "showdown_id", state.showdown_id);
  addIdentityKey(keys, "run_member", runMemberId(state));
  const short = shortStateIdent(state.ident);
  addIdentityKey(keys, "ident", short);
  addSpeciesIdentityKeys(keys, state.details);
  addSpeciesIdentityKeys(keys, state.species);
  addMoveIdentityKey(keys, state.species || state.details || short, state.moves || []);
  return keys;
}

function pokemonIdentityKeys(raw: PokemonSet | undefined, pokemon: RentalPokemon | undefined): Set<string> {
  const keys = new Set<string>();
  addIdentityKey(keys, "showdown_id", raw?.showdown_id || pokemon?.showdown_id);
  addIdentityKey(keys, "run_member", runMemberId(raw) || runMemberId(pokemon));
  addIdentityKey(keys, "ident", raw?.name || raw?.species);
  addIdentityKey(keys, "ident", pokemon?.name || pokemon?.species || pokemon?.species_id);
  addSpeciesIdentityKeys(keys, raw?.species || raw?.name);
  addSpeciesIdentityKeys(keys, pokemon?.species || pokemon?.name || pokemon?.species_id);
  addIdentityKey(keys, "species_id", pokemon?.species_id);
  addMoveIdentityKey(keys, raw?.species || raw?.name || pokemon?.species || pokemon?.name || pokemon?.species_id, raw?.moves || pokemon?.moves || []);
  return keys;
}

function findExistingStateForPokemon(existing: PlayerPokemonState[], raw: PokemonSet | undefined, pokemon: RentalPokemon | undefined, used: Set<number>): PlayerPokemonState | undefined {
  const wantedId = runMemberId(raw) || runMemberId(pokemon);
  if (wantedId) {
    const index = existing.findIndex((state, stateIndex) => !used.has(stateIndex) && runMemberId(state) === wantedId);
    if (index >= 0) {
      used.add(index);
      return existing[index];
    }
  }
  const keys = pokemonIdentityKeys(raw, pokemon);
  let bestIndex = -1;
  let bestScore = 0;
  for (let index = 0; index < existing.length; index += 1) {
    if (used.has(index)) continue;
    const stateKeys = stateIdentityKeys(existing[index]);
    let score = 0;
    for (const key of keys) {
      if (!stateKeys.has(key)) continue;
      if (key.startsWith("species_moves:")) score += 20;
      else if (key.startsWith("showdown_id:")) score += 2;
      else if (key.startsWith("ident:") || key.startsWith("species:") || key.startsWith("details_species:") || key.startsWith("species_id:")) score += 10;
      else if (key.startsWith("run_member:")) score += 100;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  if (bestIndex < 0 || bestScore <= 0) return undefined;
  used.add(bestIndex);
  return existing[bestIndex];
}

function fullStateForPokemon(pokemon: RentalPokemon, slot: number): PlayerPokemonState {
  const maxhp = Math.max(1, Number(pokemon.stats?.hp || 1));
  const showdownId = candidateShowdownId(pokemon.showdown_id) || SHOWDOWN_ID_POOL[Math.max(0, slot - 1)] || SHOWDOWN_ID_POOL[0];
  return {
    run_member_id: runMemberId(pokemon) || undefined,
    showdown_id: showdownId,
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

async function generateStarterCandidatesForSave(save: LocalSave, seed: number, talents: TalentView[], count: number, setting?: BattleSetting): Promise<GeneratedTeam> {
  const setStreak = Number(save.stats?.set_win_streak || 0);
  const profiles = starterProfilesForStreak(setStreak, count, talents);
  const speciesTiers = starterSpeciesTiersForStreak(setStreak, count);
  const battleSetting = normalizeBattleSetting(setting || save.battle_setting || DEFAULT_BATTLE_SETTING);
  const current = markStarterOrigin(ensureStarterShiny(await gameService.generateRentalCandidates(gameService.deriveSeed(seed, 1), "gen9randombattle", count, {profiles, speciesTiers, purpose: "starter", battleSetting}), seed, talents, setStreak), "current");
  if (!hasTalent(talents, "starter_soulmate")) return current;
  const memorySpecies = Array.from(new Set([...(save.run_memory?.player_species_ids || []), ...(save.run_memory?.enemy_species_ids || [])].map(toId).filter(Boolean))).slice(0, 12);
  if (!memorySpecies.length) return current;
  const memoryProfiles = Array.from({length: memorySpecies.length}, (_value, index) => profiles[index % profiles.length] || "tier1" as GenerationProfile);
  const memory = markStarterOrigin(await gameService.generateRentalCandidates(gameService.deriveSeed(seed, 0x5017), "gen9randombattle", memorySpecies.length, {profiles: memoryProfiles, speciesIds: memorySpecies, purpose: "starter", battleSetting}), "memory");
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
    const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(seed, 0xb010 + index * 131), "gen9randombattle", 1, {profiles: [profile], speciesIds: [speciesId], purpose: "starter", battleSetting: normalizeBattleSetting(DEFAULT_BATTLE_SETTING)});
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
  ensureTeamRunMemberIds(run.player_team || [], run.player_display || []);
  const existing = [...(run.player_state || [])];
  normalizeRunShowdownIdPool(run);
  const usedExisting = new Set<number>();
  const states = (run.player_display || []).map((pokemon, index) => {
    const full = fullStateForPokemon(pokemon, index + 1);
    const matched = findExistingStateForPokemon(existing, run.player_team?.[index], pokemon, usedExisting);
    const state = {...full};
    if (matched) {
      const oldMax = Math.max(1, Number(matched.maxhp || full.maxhp || 1));
      const oldHp = Math.max(0, Number(matched.hp ?? full.hp));
      if (oldHp <= 0 || matched.fainted) state.hp = 0;
      else if (oldHp >= oldMax) state.hp = full.maxhp;
      else state.hp = Math.max(1, Math.min(full.maxhp, Math.round(oldHp * full.maxhp / oldMax)));
      state.status = matched.status || "";
      state.item = matched.item || full.item;
      const currentMoves = new Map((matched.moves || []).map(move => [toId(move.id || move.move), move]));
      state.moves = full.moves.map(move => {
        const current = currentMoves.get(move.id);
        return {...move, pp: Math.max(0, Math.min(Number(current?.pp ?? move.pp), move.maxpp))};
      });
    }
    state.run_member_id = runMemberId(run.player_team?.[index]) || runMemberId(pokemon) || full.run_member_id || createRunMemberId();
    if (run.player_team?.[index]) run.player_team[index].run_member_id = state.run_member_id;
    if (run.player_display?.[index]) run.player_display[index].run_member_id = state.run_member_id;
    const showdownId = candidateShowdownId(run.player_team?.[index]?.showdown_id, run.player_display?.[index]?.showdown_id, matched?.showdown_id, full.showdown_id) || takeRunShowdownId(run);
    state.showdown_id = showdownId;
    if (run.player_team?.[index]) {
      run.player_team[index].showdown_id = showdownId;
      run.player_team[index].pokeball = showdownId;
    }
    if (run.player_display?.[index]) run.player_display[index].showdown_id = showdownId;
    state.slot = index + 1;
    state.ident = full.ident;
    state.details = full.details;
    state.species = full.species;
    state.maxhp = full.maxhp;
    state.hp = Number(state.hp ?? full.hp);
    state.status = state.status || "";
    state.active = index === 0;
    return refreshStateCondition(state);
  });
  run.player_state = states;
  normalizeRunShowdownIdPool(run);
  return states;
}

function applyStalwartRecovery(run: CurrentRunData): boolean {
  if (!hasTalent(run.talents, "exchange_stalwart")) return false;
  const states = normalizePlayerState(run);
  let changed = false;
  for (const state of states) {
    const maxhp = Math.max(1, Number(state.maxhp || 1));
    const hp = Math.max(0, Number(state.hp || 0));
    const targetHp = hp > 0 && !state.fainted
      ? Math.max(hp, Math.ceil(maxhp / 2))
      : Math.max(1, Math.ceil(maxhp / 4));
    if (targetHp !== hp || state.fainted) {
      state.hp = Math.min(maxhp, targetHp);
      state.fainted = false;
      changed = true;
    }
    refreshStateCondition(state);
  }
  run.player_state = states;
  return changed;
}

function normalizeCurrentRun(run: CurrentRunData): CurrentRunData {
  if (run.status === "awaiting_exchange") run.status = "awaiting_rest";
  run.coins = currentCoins(run);
  run.non_convertible_coins = Math.max(0, Math.min(run.coins, Math.floor(Number(run.non_convertible_coins || 0))));
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
  run.shop_kind = normalizeShopKind(run.shop_kind);
  run.shop_offers = (run.shop_offers || []).map(offer => ({...offer, category: offer.category || itemCategory(offer)}));
  run.shop_purchased_offer_id = run.shop_purchased_offer_id || null;
  run.shop_purchased_offer_counts = Object.fromEntries(Object.entries(run.shop_purchased_offer_counts || {}).map(([offerId, count]) => [offerId, Math.max(0, Math.floor(Number(count || 0)))] as const).filter(([, count]) => count > 0));
  run.shop_purchased_item_counts = Object.fromEntries(Object.entries(run.shop_purchased_item_counts || {}).map(([itemId, count]) => [itemKey(itemId), Math.max(0, Math.floor(Number(count || 0)))] as const).filter(([itemId, count]) => itemId && count > 0));
  run.shop_last_roll_bonus = run.shop_last_roll_bonus || null;
  run.starter_item_offers = (run.starter_item_offers || []).map(offer => ({...offer, category: offer.category || itemCategory(offer), source: "starter"}));
  run.starter_item_purchased = run.starter_item_purchased || [];
  run.non_refundable_bag_items = Object.fromEntries(Object.entries(run.non_refundable_bag_items || {}).map(([id, count]) => [itemKey(id), Math.max(0, Number(count || 0))] as const).filter(([, count]) => count > 0));
  run.bag_item_meta = Object.fromEntries(Object.entries(run.bag_item_meta || {}).map(([id, meta]) => [itemKey(id), {...meta, id: itemKey(meta?.id || id)}] as const));
  run.talents = run.talents || [];
  run.talents = talentsForIds(run.talents.map(talent => talent.id));
  run.battle_setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
  applyTeraOrbToRunTeam(run);
  run.reroute_used = Math.max(0, Math.floor(Number(run.reroute_used || 0)));
  run.forced_trainer_ids = Object.fromEntries(Object.entries(run.forced_trainer_ids || {}).map(([battleNo, trainerId]) => [String(Math.max(1, Math.floor(Number(battleNo || 0)))), String(trainerId || "")]).filter(([, trainerId]) => trainerId));
  run.reroute_history = Object.fromEntries(Object.entries(run.reroute_history || {}).map(([battleNo, trainerIds]) => [String(Math.max(1, Math.floor(Number(battleNo || 0)))), Array.from(new Set((trainerIds || []).map(String).filter(Boolean)))] as const).filter(([, trainerIds]) => trainerIds.length));
  run.named_champion_id = run.named_champion_id || null;
  run.recycle_receipt_value = Math.max(0, Math.floor(Number(run.recycle_receipt_value || 0)));
  run.economy_spend_types = Array.from(new Set((run.economy_spend_types || []).map(String).filter(Boolean)));
  run.used_pokemon_display = (run.used_pokemon_display || []).filter(Boolean);
  run.used_pokemon_stats = Object.fromEntries(Object.entries(run.used_pokemon_stats || {}).map(([key, stats]) => [key, {
    kills: Math.max(0, Number(stats.kills || 0)),
    deaths: Math.max(0, Number(stats.deaths || 0)),
    assists: Math.max(0, Number(stats.assists || 0)),
    damage_dealt: Math.max(0, Number(stats.damage_dealt || 0)),
    damage_taken: Math.max(0, Number(stats.damage_taken || 0)),
  }]));
  const statKinds = new Set<ResultPokemonStatEvent["kind"]>(["kill", "death", "assist", "damage_dealt", "damage_taken"]);
  const statSources = new Set<ResultPokemonStatEvent["source"]>(["move", "status", "item", "ability", "field", "unknown"]);
  run.used_pokemon_stat_events = (run.used_pokemon_stat_events || []).map(event => ({
    battle_no: Math.max(1, Math.floor(Number(event.battle_no || 1))),
    turn: Math.max(1, Math.floor(Number(event.turn || 1))),
    pokemon_key: String(event.pokemon_key || ""),
    target_key: String(event.target_key || "") || undefined,
    kind: statKinds.has(event.kind) ? event.kind : "damage_dealt",
    value: Math.max(0, Math.floor(Number(event.value || 0))),
    source: statSources.has(event.source) ? event.source : "unknown",
  })).filter(event => event.pokemon_key && event.value > 0);
  run.temporary_bp_debt = Math.max(0, Number(run.temporary_bp_debt || 0));
  run.second_team_roar_used = Boolean(run.second_team_roar_used);
  run.all_in_exchange_used = Boolean(run.all_in_exchange_used);
  normalizeRunShowdownIdPool(run);
  run.planned_battles = (run.planned_battles || []).filter(Boolean).sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
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
    rest_event_options: (run.rest_status?.rest_event_options || [])
      .map(event => restEventView(event))
      .filter(event => REST_EVENT_DEFINITIONS.some(definition => definition.id === event.id))
      .slice(0, 3),
    rest_event_selected_id: run.rest_status?.rest_event_selected_id ? toId(run.rest_status.rest_event_selected_id) : null,
    all_in_result: run.rest_status?.all_in_result || null,
    named_challenge_decided: Boolean(run.rest_status?.named_challenge_decided),
    event_shop_disabled: Boolean(run.rest_status?.event_shop_disabled),
    event_shop_price_multiplier: Math.max(0, Number(run.rest_status?.event_shop_price_multiplier || 0)) || undefined,
    event_recovery_multiplier: Math.max(0, Number(run.rest_status?.event_recovery_multiplier || 0)) || undefined,
    event_hungry: Boolean(run.rest_status?.event_hungry),
    event_low_tier_recovery_disabled: Boolean(run.rest_status?.event_low_tier_recovery_disabled),
    event_pending_full_restore: Boolean(run.rest_status?.event_pending_full_restore),
    event_checked_bag_items: Object.fromEntries(Object.entries(run.rest_status?.event_checked_bag_items || {}).map(([id, count]) => [itemKey(id), Math.max(0, Math.floor(Number(count || 0)))] as const).filter(([, count]) => count > 0)),
    event_rest_healing_blocked: Boolean(run.rest_status?.event_rest_healing_blocked),
    event_next_battle_healing_blocked: Boolean(run.rest_status?.event_next_battle_healing_blocked),
    event_barter_active: Boolean(run.rest_status?.event_barter_active),
    event_doctor_pending: Boolean(run.rest_status?.event_doctor_pending),
    event_tutor_service_available: Boolean(run.rest_status?.event_tutor_service_available),
    event_tutor_service_used: Boolean(run.rest_status?.event_tutor_service_used),
    event_egg_service_available: Boolean(run.rest_status?.event_egg_service_available),
    event_egg_service_used: Boolean(run.rest_status?.event_egg_service_used),
    event_contest_next: run.rest_status?.event_contest_next || undefined,
    event_contest_active: run.rest_status?.event_contest_active || undefined,
    event_raid_exchange_available: Boolean(run.rest_status?.event_raid_exchange_available),
    event_raid_exchange_battle_no: run.rest_status?.event_raid_exchange_battle_no ? Math.max(1, Math.floor(Number(run.rest_status.event_raid_exchange_battle_no))) : undefined,
    event_raid_exchange_used: Boolean(run.rest_status?.event_raid_exchange_used),
    event_rerandomized_locked_battles: (run.rest_status?.event_rerandomized_locked_battles || []).map(Number).filter(value => value > 0),
    event_exchange_disabled: Boolean(run.rest_status?.event_exchange_disabled),
    event_level_points: Math.max(0, Math.floor(Number(run.rest_status?.event_level_points || 0))),
    event_soul_swap_next: Boolean(run.rest_status?.event_soul_swap_next),
    event_soul_swap_active: Boolean(run.rest_status?.event_soul_swap_active),
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

async function applyRestDelayedEffects(run: CurrentRunData): Promise<string[]> {
  const messages: string[] = [];
  if (run.rest_status?.event_checked_bag_items && Object.keys(run.rest_status.event_checked_bag_items).length) {
    const count = await returnCheckedBagItems(run);
    if (count) messages.push(`安全航空归还了 ${count} 个托运道具。`);
  }
  if (run.rest_status?.event_pending_full_restore) {
    fullRestoreParty(run);
    delete run.rest_status.event_pending_full_restore;
    messages.push("重伤手术完成：全队恢复到满状态。");
  }
  if (run.rest_status?.event_contest_active) delete run.rest_status.event_contest_active;
  if (run.rest_status?.event_next_battle_healing_blocked) delete run.rest_status.event_next_battle_healing_blocked;
  if (run.rest_status?.event_soul_swap_active) delete run.rest_status.event_soul_swap_active;
  return messages;
}

function restEventStatuses(run: CurrentRunData): RestState["rest_event_statuses"] {
  const status = run.rest_status || {};
  const entries: RestState["rest_event_statuses"] = [];
  if (status.event_shop_disabled) entries.push({id: "shop_disabled", label: "商店关闭", detail: "本次休整不能使用商店。", tone: "risk"});
  if (Number(status.event_shop_price_multiplier || 1) > 1) entries.push({id: "shop_price", label: `商店 x${Number(status.event_shop_price_multiplier).toFixed(1)}`, detail: "本次商店抽奖与购买价格提高。", tone: "risk"});
  if (Number(status.event_recovery_multiplier || 1) < 1) entries.push({id: "recovery_down", label: status.event_hungry ? "饥饿" : "恢复减半", detail: status.event_hungry ? "本次休整和下一战背包恢复道具效果减半。" : "背包和事件恢复效果减半。", tone: "risk"});
  if (status.event_low_tier_recovery_disabled) entries.push({id: "low_recovery_disabled", label: "低级恢复失效", detail: "低级回复药、状态药和树果不能使用。", tone: "risk"});
  if (status.event_rest_healing_blocked) entries.push({id: "healing_blocked", label: "恢复诅咒", detail: "本次休整不能使用 HP/异常/复活类恢复道具。", tone: "risk"});
  if (status.event_checked_bag_items && Object.keys(status.event_checked_bag_items).length) entries.push({id: "checked_items", label: "道具托运中", detail: "托运道具会在下次休整归还到背包。", tone: "risk"});
  if (status.event_barter_active) entries.push({id: "barter", label: "以物易物", detail: "商店抽奖免费，购买只能用背包道具交换。", tone: "trade"});
  if (status.event_exchange_disabled) entries.push({id: "exchange_disabled", label: "无法交换", detail: "本次休整不能交换宝可梦。", tone: "risk"});
  if (Number(status.event_level_points || 0) > 0) entries.push({id: "level_points", label: `可分配等级 ${status.event_level_points}`, detail: "可分给当前队伍宝可梦。", tone: "safe"});
  if (status.event_doctor_pending) entries.push({id: "doctor", label: "医生等待选择", detail: "请选择哥哥或弟弟的治疗方案。", tone: "trade"});
  if (status.event_tutor_service_available && !status.event_tutor_service_used) entries.push({id: "tutor", label: "讲师老奶奶", detail: "可花 200 金币学习 1 个教授招式。", tone: "trade"});
  if (status.event_egg_service_available && !status.event_egg_service_used) entries.push({id: "egg", label: "培育屋爷爷", detail: "可花 200 金币学习 1 个遗传招式。", tone: "trade"});
  if (status.event_raid_exchange_available && !status.event_raid_exchange_used) entries.push({id: "raid_exchange", label: "骇人奇袭", detail: "可与下一位对手交换 1 只宝可梦。", tone: "trade"});
  if (status.event_contest_next) entries.push({id: "contest", label: "华丽大赛", detail: "下一战会按裁判标记累计华丽分。", tone: "trade"});
  if (status.event_soul_swap_next) entries.push({id: "soul_swap", label: "灵魂互换", detail: "下一战操作队伍互换，胜负按原阵营结算。", tone: "risk"});
  return entries;
}

async function restState(save: LocalSave, run: CurrentRunData, message?: string): Promise<DesktopGameState> {
  normalizeCurrentRun(run);
  const delayedMessages = await applyRestDelayedEffects(run);
  const restMessage = [message, ...delayedMessages].filter(Boolean).join(" ");
  ensureRestEventOptions(run);
  const exchangeCount = Number(run.rest_status?.exchanges || 0);
  const restExchangeCost = exchangeCount >= 3 ? null : exchangeCost(run, exchangeCount);
  const nightSky = await buildNightSkyState(save, run);
  const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
  const nextPreview = hasTalent(run.talents, "intel_reroute") && nextBattleNo <= Number(run.battles || DEFAULT_BATTLES)
    ? await generateOpponentPreview(save, run, nextBattleNo)
    : null;
  const rest: RestState = {
    battle_no: Number(run.battle_no ?? Math.max(0, Number(run.next_battle || 1) - 1)),
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
      kind: normalizeShopKind(run.shop_kind),
      title: SHOP_KIND_CONFIG[normalizeShopKind(run.shop_kind)].title,
      theme: SHOP_KIND_CONFIG[normalizeShopKind(run.shop_kind)].theme,
      roll_count: Number(run.shop_roll_count || 0),
      next_roll_cost: shopNextRollCostForKind(run, normalizeShopKind(run.shop_kind)),
      slot_count: normalizeShopKind(run.shop_kind) === "tm" ? 3 : shopOfferCount(run),
      free_rolls_remaining: Number(run.rest_status?.free_shop_rolls_remaining || 0),
      slot_discounts: run.rest_status?.shop_slot_discounts || [],
      offers: pricedShopOffersForRun(run),
      purchased_offer_id: run.shop_purchased_offer_id || null,
      purchased_offer_counts: run.shop_purchased_offer_counts || {},
      purchased_item_counts: run.shop_purchased_item_counts || {},
      last_roll_bonus: run.shop_last_roll_bonus || null,
    },
    starter_items: {
      offers: run.starter_item_offers || [],
      purchased: run.starter_item_purchased || [],
      max_purchases: Math.max(0, Number(run.starter_item_purchased?.length || 0)),
    },
    move_draws: run.move_draws || {},
    move_draw_rolls: run.move_draw_rolls || {},
    scout: run.scout,
    night_sky: nightSky,
    champion_options: trainerCatalogState().champions || [],
    named_champion_id: run.named_champion_id || null,
    named_challenge_decided: Boolean(run.rest_status?.named_challenge_decided),
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
    rest_event: {
      required: restEventRequired(run),
      selected_id: run.rest_status?.rest_event_selected_id || null,
      options: run.rest_status?.rest_event_options || [],
    },
    rest_event_statuses: restEventStatuses(run),
    event_services: {
      doctor: Boolean(run.rest_status?.event_doctor_pending),
      tutor: Boolean(run.rest_status?.event_tutor_service_available && !run.rest_status?.event_tutor_service_used),
      egg: Boolean(run.rest_status?.event_egg_service_available && !run.rest_status?.event_egg_service_used),
      raid_exchange: Boolean(run.rest_status?.event_raid_exchange_available && !run.rest_status?.event_raid_exchange_used),
      raid_exchange_battle_no: run.rest_status?.event_raid_exchange_battle_no,
      level_points: Math.max(0, Number(run.rest_status?.event_level_points || 0)),
    },
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
  return gameState({screen: "rest", save, rest, message: restMessage || message});
}

async function prepareCandidates(seed?: number): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const runSeed = seed || Math.floor(Math.random() * 0xffffffff);
  const talents = pendingStarter?.talents || activeTalentsForSave(save);
  const count = candidateCountForTalents(talents);
  if (pendingStarter) {
    const limit = starterUpgradeLevel(pendingStarter.upgrades, "pokemon_reroll");
    if (pendingCandidates && pendingStarter.wholeRerollsUsed >= limit) throw new Error("牌有问题次数不足，无法整体重换。");
    pendingStarter = {...pendingStarter, seed: runSeed, wholeRerollsUsed: pendingCandidates ? pendingStarter.wholeRerollsUsed + 1 : pendingStarter.wholeRerollsUsed};
  }
  pendingCandidates = await generateStarterCandidatesForSave(save, runSeed, talents, count, pendingStarter?.battleSetting);
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
  const speciesTiers = starterSpeciesTiersForStreak(setStreak, count);
  const nextSeed = gameService.deriveSeed(pendingStarter.seed, 5000 + pendingStarter.singleRerollsUsed * 97 + slot);
  const generated = markStarterOrigin(ensureStarterShiny(await gameService.generateRentalCandidates(nextSeed, "gen9randombattle", 1, {profiles: [profiles[slot % profiles.length] || "tier1"], speciesTiers: [speciesTiers[slot % speciesTiers.length] || 2], purpose: "starter", battleSetting: pendingStarter.battleSetting}), nextSeed, pendingStarter.talents, setStreak), "current");
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
  const talents: TalentView[] = activeTalentsForSave(save);
  const upgrades = starterUpgradesForSave(save);
  const battleSetting = normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING);
  configuredTalents = talents;
  const offers = await starterItemOffers(runSeed, talents, upgrades, battleSetting);
  pendingStarter = {seed: runSeed, coins: starterCoinsForSeed(runSeed, talents), offers, purchased: [], talents, upgrades, battleSetting, wholeRerollsUsed: 0, singleRerollsUsed: 0};
  pendingCandidates = null;
  if (!offers.length) return chooseStarterItem(null);
  return gameState({screen: "starterItems", save, starter: starterChoiceState(pendingStarter), message: "选择一个开局道具，或跳过。"});
}

async function talentConfig(): Promise<TalentConfigState> {
  const save = await loadSave();
  const chart = normalizeStarChart(save?.star_chart, save?.talent_unlocks, save?.starter_upgrades);
  const catalog = starChartCatalog(chart);
  const unlocked = catalog.filter(node => Number(node.level || 0) > 0);
  const equipped = activeTalentsForSave(save);
  configuredTalents = equipped;
  return {catalog, unlocked, equipped, star_chart: chart, save};
}

async function unlockTalent(id: string): Promise<TalentConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const node = STAR_CHART_NODE_BY_ID.get(id);
  if (!node) throw new Error("星图节点不存在。");
  if (node.disabled || node.kind === "event_preview") throw new Error("这个节点是后续奇遇预留，暂不可解锁。");
  const chart = normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades);
  if (!starNodeUnlocked(chart, node)) throw new Error("前置节点尚未点亮。");
  const cost = starNodeUpgradeCost(chart, id);
  if (cost === null) throw new Error("这个节点已经满级。");
  spendBp(save, cost);
  chart.nodes[id] = Math.min(node.max_level, starNodeLevel(chart, id) + 1);
  save.star_chart = chart;
  const next = await persist(save);
  const nextChart = normalizeStarChart(next.star_chart, next.talent_unlocks, next.starter_upgrades);
  const catalog = starChartCatalog(nextChart);
  const unlocked = catalog.filter(entry => Number(entry.level || 0) > 0);
  const equipped = activeTalentsForSave(next);
  configuredTalents = equipped;
  return {catalog, unlocked, equipped, star_chart: nextChart, save: next};
}

async function configureTalents(ids: string[]): Promise<TalentConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  void ids;
  const next = await persist(save);
  const chart = normalizeStarChart(next.star_chart, next.talent_unlocks, next.starter_upgrades);
  const catalog = starChartCatalog(chart);
  const unlocked = catalog.filter(entry => Number(entry.level || 0) > 0);
  const equipped = activeTalentsForSave(next);
  configuredTalents = equipped;
  return {catalog, unlocked, equipped, star_chart: chart, save: next};
}

async function setNamedChallenge(trainerId: string | null): Promise<TalentConfigState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  const id = trainerId || null;
  if (id && !npcCatalog.some(entry => entry.type === "champion" && entry.id === id)) throw new Error("只能指定冠军作为最终 Boss。");
  save.named_champion_id = id;
  const next = await persist(save);
  const chart = normalizeStarChart(next.star_chart, next.talent_unlocks, next.starter_upgrades);
  const catalog = starChartCatalog(chart);
  const equipped = activeTalentsForSave(next);
  configuredTalents = equipped;
  return {catalog, unlocked: catalog.filter(entry => Number(entry.level || 0) > 0), equipped, star_chart: chart, save: next};
}

async function starterUpgradeConfig(): Promise<StarterUpgradeConfigState> {
  const save = await loadSave();
  return {catalog: starterUpgradeCatalog(starterUpgradesForSave(save)), save};
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
  const chart = normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades);
  const node = STAR_CHART_NODE_BY_ID.get(id);
  if (!node || node.kind !== "starter_upgrade") throw new Error("开局筹备项目不存在。");
  const currentLevel = starNodeLevel(chart, id);
  const cost = starNodeUpgradeCost(chart, id);
  if (cost === null || cost === undefined) throw new Error("这个项目已经满级。");
  if (!starNodeUnlocked(chart, node)) throw new Error("前置节点尚未点亮。");
  spendBp(save, cost);
  chart.nodes[id] = Math.min(node.max_level, currentLevel + 1);
  save.star_chart = chart;
  const next = await persist(save);
  return {catalog: starterUpgradeCatalog(starterUpgradesForSave(next)), save: next};
}

async function chooseStarterItem(offerId: string | null): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  if (!pendingStarter) {
    const seed = Math.floor(Math.random() * 0xffffffff);
    const talents = activeTalentsForSave(save);
    const upgrades = starterUpgradesForSave(save);
    const battleSetting = normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING);
    pendingStarter = {seed, coins: starterCoinsForSeed(seed, talents), offers: await starterItemOffers(seed, talents, upgrades, battleSetting), purchased: [], talents, upgrades, battleSetting, wholeRerollsUsed: 0, singleRerollsUsed: 0};
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
  pendingCandidates = await generateStarterCandidatesForSave(save, starter.seed, starter.talents, count, starter.battleSetting);
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
  const runTalents = pendingStarter?.talents || activeTalentsForSave(save);
  const runBattleSetting = normalizeBattleSetting(pendingStarter?.battleSetting || save.battle_setting || DEFAULT_BATTLE_SETTING);
  if (!pendingCandidates) {
    const count = candidateCountForTalents(runTalents);
    pendingCandidates = await generateStarterCandidatesForSave(save, effectiveSeed, runTalents, count, pendingStarter?.battleSetting);
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
  const cappedStarter = await applyArrivalLevelCapToTeam(runTalents, mentored.team, mentored.display);
  const playerTeam = cappedStarter.team;
  const playerDisplay = cappedStarter.display;
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
    battle_setting: runBattleSetting,
    reroute_used: 0,
    forced_trainer_ids: {},
    reroute_history: {},
    named_champion_id: null,
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
    player_state: [],
    coins: pendingStarter?.coins ?? starterCoinsForSeed(effectiveSeed, runTalents),
    non_convertible_coins: starterNonConvertibleCoinsForTalents(runTalents),
    coins_earned_this_run: 0,
    bp_earned_this_run: 0,
    bp_investments: [0, 0, 0],
    move_investments: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    bag_items: starterBagItems,
    rest_status: freshRestStatus(runTalents),
  };
  const run = save.current_run as CurrentRunData;
  normalizePlayerState(run);
  run.planned_battles = await buildPlannedBattles(save, run);
  pendingStarter = null;
  const next = await persist(save);
  const mentorText = mentored.upgraded ? `伯乐本乐发动：${mentored.upgraded} 只宝可梦获得数值升阶。` : "";
  const capText = cappedStarter.capped ? `徽章权限生效：${cappedStarter.capped} 只到手宝可梦等级已压到上限。` : "";
  return await restState(next, next.current_run as CurrentRunData, `${mentorText}${capText}出发前可以先整理队伍。`);
}

async function continueRun(): Promise<DesktopGameState> {
  const save = await loadSave();
  if (!save?.current_run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
  if (save.current_run.status === "in_battle") return await settleInterruptedBattle(save, save.current_run);
  if (save.current_run.status === "awaiting_exchange" || save.current_run.status === "awaiting_rest") return await restState(save, save.current_run);
  return startNextBattle(save);
}

async function settleInterruptedBattle(save: LocalSave, run: CurrentRunData): Promise<DesktopGameState> {
  normalizeCurrentRun(run);
  const battleNo = Number(run.battle_no || run.next_battle || 1);
  run.battle_no = battleNo;
  const wins = Number(run.wins || 0);
  recordBattleResult(save, "interrupted", run);
  rememberRunForSoulmate(save, run);
  const settled = await settleRunEnd(save, run, {outcome: "loss"});
  save.current_run = null;
  activeBattle = null;
  activeBattleNo = 0;
  const next = await persist(save);
  const enemyName = run.enemy_trainer?.name_zh || run.enemy_trainer?.name_en || "本场对手";
  const message = `读档时发现第 ${battleNo} 场战斗未完成，判定挑战失败。对手：${enemyName}。连胜：${wins}${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}`;
  const resultSummary = buildResultSummary({outcome: "loss", headline: "挑战失败", subtitle: `第 ${battleNo} 场战斗中断，已按失败结算`, wins, settled, run});
  await saveStore?.appendBattleRecord(buildRunRecord({run, message, outcome: "loss", resultSummary}));
  return gameState({screen: "result", save: next, message, result_summary: resultSummary});
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
    const message = `通关！完成 ${run.wins || run.battles} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}金币${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}。`;
    return gameState({screen: "result", save: next, message, result_summary: buildResultSummary({outcome: "win", headline: "通关", subtitle: `完成 ${run.wins || run.battles} 连胜`, wins: Number(run.wins || run.battles || 0), settled, run, clearBonus: bonus})});
  }
  if (!run.planned_battles?.length) run.planned_battles = await buildPlannedBattles(save, run);
  const planned = run.planned_battles.find(entry => Number(entry.battle_no) === battleNo);
  if (!planned) throw new Error(`缺少第 ${battleNo} 场预生成 NPC 数据。`);
  const enemyTrainer = planned.enemy_trainer;
  const enemyTeam = JSON.parse(JSON.stringify(planned.enemy_raw || [])) as PokemonSet[];
  const enemyDisplay = JSON.parse(JSON.stringify(planned.enemy_display || [])) as RentalPokemon[];
  const route = {type: planned.route_type, stage: planned.route_stage, route: planned.route_route, pool: []} as BossRoute;
  const bossTeam = planned.route_type === "normal" ? null : bossTeamForTrainer(enemyTrainer, run, battleNo);
  run.boss_type = planned.route_type;
  run.boss_stage = planned.route_stage;
  run.boss_route = planned.route_route;
  run.enemy_team_pool_id = planned.enemy_team_pool_id;
  run.generation_stage = planned.generation_stage;
  run.player_trainer = trainerFromProfile(save.trainer);
  run.enemy_trainer = enemyTrainer;
  run.battle_background = planned.battle_background || battleBackgroundForRun(run, enemyTrainer, battleNo);
  run.status = "in_battle";
  run.battle_no = battleNo;
  run.next_battle = battleNo;
  if (run.rest_status?.event_contest_next) {
    run.rest_status = {...run.rest_status, event_contest_active: run.rest_status.event_contest_next};
    delete run.rest_status.event_contest_next;
  }
  if (run.rest_status?.event_soul_swap_next) {
    run.rest_status = {...run.rest_status, event_soul_swap_active: true};
    delete run.rest_status.event_soul_swap_next;
  }
  delete run.enemy_boss_record;
  run.enemy_raw = enemyTeam;
  run.enemy_display = enemyDisplay;
  const battleStartSave = await persist(save);
  const battleStartRun = battleStartSave.current_run as CurrentRunData;
  const soulSwapActive = Boolean(battleStartRun.rest_status?.event_soul_swap_active);
  activeBattleNo = battleNo;
  activeBattle = await gameService.createBattleSession({
    playerTeam: soulSwapActive ? enemyTeam : battleStartRun.player_team,
    enemyTeam: soulSwapActive ? battleStartRun.player_team : enemyTeam,
    playerDisplay: soulSwapActive ? enemyDisplay : battleStartRun.player_display,
    enemyDisplay: soulSwapActive ? battleStartRun.player_display : enemyDisplay,
    playerState: soulSwapActive ? undefined : normalizePlayerState(battleStartRun),
    seed: gameService.deriveSeed(Number(run.seed), 200 + battleNo),
    battleSetting: battleStartRun.battle_setting,
    enemyAi: enemyAiForRoute(route, enemyTrainer),
  });
  const encounteredBoss = recordBossEncounter(battleStartSave, battleStartRun, enemyTrainer, bossTeam, enemyDisplay);
  const stateSave = encounteredBoss ? await persist(battleStartSave) : battleStartSave;
  const stateRun = stateSave.current_run as CurrentRunData;
  const label = run.boss_type === "normal" ? "普通 NPC" : run.boss_type === "champion" ? "冠军" : run.boss_type === "elite4" ? "四天王" : "馆主";
  return gameState({screen: "battleMain", save: stateSave, battle: decorateBattleState(activeBattle.getState(), stateRun), battle_bag: await bagCategories(stateRun), message: `第 ${battleNo}/${run.battles} 场：${label} ${enemyTrainer.name_zh}`});
}

async function finishBattleState(save: LocalSave, state: BattleState): Promise<DesktopGameState> {
  if (!save.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
  const run = save.current_run as CurrentRunData;
  const soulSwapActive = Boolean(run.rest_status?.event_soul_swap_active);
  run.player_state = soulSwapActive ? activeBattle.getEnemyState() : activeBattle.getPlayerState();
  const contest = settleContestScore(run, state);
  const effectivePlayerWin = (soulSwapActive ? state.winner !== "Player" : state.winner === "Player") || contest.overrideWin;
  const effectiveWinner = effectivePlayerWin ? "Player" : state.winner === "tie" ? "tie" : "Enemy";
  const winBp = recordBattleResult(save, effectiveWinner, run);
  const statEvents = recordRunBattleStats(run, state);
  if (!effectivePlayerWin) {
    const wins = Number(run.wins || 0);
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run, {outcome: "loss"});
    save.current_run = null;
    const next = await persist(save);
    const enemyName = run.enemy_trainer?.name_zh || run.enemy_trainer?.name_en || "对手训练师";
    const lossReason = soulSwapActive && state.winner === "Player" ? "灵魂互换：你操作对手队伍获胜，按挑战失败结算。" : `挑战结束。败给 ${enemyName}。`;
    const lossMessage = `${lossReason}连胜：${wins}${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}`;
    const resultBattle = decorateBattleState(state, run);
    const resultSummary = buildResultSummary({outcome: "loss", headline: "挑战失败", subtitle: `败给 ${enemyName}`, wins, settled, battle: resultBattle, run});
    await saveStore?.appendBattleRecord(buildBattleRecord({run, battle: resultBattle, message: lossMessage, outcome: "loss", statEvents, resultSummary}));
    const transition = gameState({screen: "result", save: next, battle: resultBattle, message: lossMessage, result_summary: resultSummary});
    return gameState({screen: "battleMain", save: next, battle: resultBattle, battle_bag: await bagCategories(run), message: lossMessage, pending_transition: transition});
  }
  const wins = Number(run.wins || 0) + 1;
  addToExchangeBox(run, soulSwapActive ? (state.player_team || run.enemy_raw || []) : (state.enemy_team || run.enemy_raw || []), soulSwapActive ? (state.player_display || run.enemy_display || []) : (state.enemy_display || run.enemy_display || []));
  const stalwartRecovered = applyStalwartRecovery(run);
  const allInBonus = run.rest_status?.all_in_pending_next ? addCoins(run, currentCoins(run)) : 0;
  const contestBonus = contest.bonusCoins ? addCoins(run, contest.bonusCoins) : 0;
  if (run.rest_status?.all_in_pending_next) run.rest_status = {...run.rest_status, all_in_pending_next: false};
  if (activeBattleNo >= Number(run.battles || DEFAULT_BATTLES)) {
    run.wins = wins;
    const {setStreak, bonus} = clearBonus(save, run);
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run, {completed: true});
    save.current_run = null;
    const next = await persist(save);
    const message = `通关！完成 ${wins} 连胜。连续通关 ${setStreak} 次，奖励 ${bonus}金币${allInBonus ? `，孤注一掷翻倍 +${allInBonus}金币` : ""}${contestBonus ? `，华丽大赛 +${contestBonus}金币` : ""}${contest.overrideWin ? "，裁判介入改判成功" : ""}${soulSwapActive ? "，灵魂互换按原队伍胜利结算" : ""}${stalwartRecovered ? "，坚毅不倒已恢复队伍" : ""}${settlementText(settled)}；本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP${settled.paidBack ? `，临时BP扣回 ${settled.paidBack}BP` : ""}。`;
    const resultBattle = decorateBattleState(state, run);
    const resultSummary = buildResultSummary({outcome: "win", headline: "通关", subtitle: `完成 ${wins} 连胜`, wins, settled, battle: resultBattle, run, battleReward: winBp, clearBonus: bonus, allInBonus});
    await saveStore?.appendBattleRecord(buildBattleRecord({run, battle: resultBattle, message, outcome: "win", statEvents, resultSummary}));
    const transition = gameState({screen: "result", save: next, battle: resultBattle, message, result_summary: resultSummary});
    return gameState({screen: "battleMain", save: next, battle: resultBattle, battle_bag: await bagCategories(run), message, pending_transition: transition});
  }
  const victoryRewards = await grantVictoryRewards(run, run.boss_type !== "normal", activeBattleNo);
  save.current_run = {
    ...run,
    status: "awaiting_rest",
    battle_no: activeBattleNo,
    next_battle: activeBattleNo + 1,
    wins,
    enemy_raw: soulSwapActive ? (state.player_team || run.enemy_raw) : state.enemy_team,
    enemy_display: soulSwapActive ? (state.player_display || run.enemy_display) : state.enemy_display,
    coins_earned_this_run: Number(run.coins_earned_this_run || 0) + winBp,
    bp_earned_this_run: Number(run.bp_earned_this_run || 0) + winBp,
    rest_status: freshRestStatus(run.talents, carryRestStatusAfterBattle(run, victoryRewards.restBonus)),
  };
  const next = await persist(save);
  const rewardText = `对局胜利，获得 ${winBp}金币${allInBonus ? `；孤注一掷翻倍 +${allInBonus}金币` : ""}${contestBonus ? `；华丽大赛 +${contestBonus}金币` : ""}${contest.overrideWin ? "；裁判介入改判成功" : ""}${soulSwapActive ? "；灵魂互换按原队伍胜利结算" : ""}${stalwartRecovered ? "；坚毅不倒已恢复队伍" : ""}。当前连胜：${wins}`;
  await saveStore?.appendBattleRecord(buildBattleRecord({run, battle: decorateBattleState(state, run), message: rewardText, outcome: "win", statEvents}));
  const transition = {...await restState(next, next.current_run as CurrentRunData), toast_message: rewardText};
  return gameState({screen: "battleMain", save: next, battle: decorateBattleState(state, run), battle_bag: await bagCategories(next.current_run as CurrentRunData), message: `本场胜利！当前连胜：${wins}`, pending_transition: transition});
}

async function submitBattleChoice(choice: string): Promise<DesktopGameState> {
  if (battleChoiceInFlight) throw new Error("上一条战斗指令仍在处理，请稍等。");
  battleChoiceInFlight = true;
  try {
    const save = await loadSave();
    if (!save?.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
    const zMoveMatch = choice.match(/^move\s+(\d+)\s+zmove$/i);
    const megaMatch = choice.match(/^move\s+(\d+)\s+mega$/i);
    const maxMatch = choice.match(/^move\s+(\d+)\s+max$/i);
    const teraMatch = choice.match(/^move\s+(\d+)\s+terastallize$/i);
    if (zMoveMatch) {
      const run = save.current_run as CurrentRunData;
      const setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
      if (!setting.enabled_battle_systems.includes("zmove")) throw new Error("本局未开启 Z 招式系统。");
      const moveSlot = Math.max(1, Math.floor(Number(zMoveMatch[1] || 0)));
      const request = activeBattle.getState().request;
      const canZMove = request?.active?.[0]?.canZMove || [];
      if (!canZMove.some(Boolean)) throw new Error("当前没有可用的 Z 招式。");
      if (!canZMove[moveSlot - 1]) throw new Error("这个技能不能升级为 Z 招式。");
    }
    if (megaMatch) {
      const run = save.current_run as CurrentRunData;
      const setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
      if (!setting.enabled_battle_systems.includes("mega")) throw new Error("本局未开启 Mega 系统。");
      const moveSlot = Math.max(1, Math.floor(Number(megaMatch[1] || 0)));
      const active = activeBattle.getState().request?.active?.[0];
      const move = active?.moves?.[moveSlot - 1];
      if (!active?.canMegaEvo) throw new Error("当前没有可用的 Mega 进化。");
      if (!move || move.disabled) throw new Error("这个技能不能用于 Mega 进化回合。");
    }
    if (maxMatch) {
      const run = save.current_run as CurrentRunData;
      const setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
      if (setting.battle_rule_preset !== "gen8" || !setting.enabled_battle_systems.includes("dynamax")) throw new Error("本局未开启极巨化系统。");
      const moveSlot = Math.max(1, Math.floor(Number(maxMatch[1] || 0)));
      const active = activeBattle.getState().request?.active?.[0];
      const move = active?.moves?.[moveSlot - 1];
      if (!active?.canDynamax) throw new Error("当前不能进行极巨化。");
      if (!move || move.disabled) throw new Error("这个技能不能用于极巨化回合。");
    }
    if (teraMatch) {
      const run = save.current_run as CurrentRunData;
      const setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
      if (setting.battle_rule_preset !== "gen9" || !setting.enabled_battle_systems.includes("terastal")) throw new Error("本局未开启太晶化系统。");
      const moveSlot = Math.max(1, Math.floor(Number(teraMatch[1] || 0)));
      const active = activeBattle.getState().request?.active?.[0];
      const move = active?.moves?.[moveSlot - 1];
      if (!active?.canTerastallize) throw new Error("当前不能进行太晶化。");
      if (!move || move.disabled) throw new Error("这个技能不能用于太晶化回合。");
    }
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
      await assertBattleItemUsableByEvents(run, normalizedItem);
      state = await activeBattle.chooseTrainerItem(normalizedItem, slot, moveSlotRaw ? Number(moveSlotRaw) : undefined, eventRecoveryMultiplier(run));
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
    return finishBattleState(save, state);
  } finally {
    battleChoiceInFlight = false;
  }
}

async function autoAdvanceBattle(): Promise<DesktopGameState> {
  if (battleChoiceInFlight) throw new Error("上一条战斗指令仍在处理，请稍等。");
  battleChoiceInFlight = true;
  try {
    const save = await loadSave();
    if (!save?.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
    const state = await activeBattle.advanceIfWaiting();
    if (!state.ended) {
      return gameState({screen: "battleMain", save, battle: decorateBattleState(state, save.current_run as CurrentRunData), battle_bag: await bagCategories(save.current_run as CurrentRunData)});
    }
    return finishBattleState(save, state);
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
    rememberRunPokemonAppearances(run, playerDisplay);
    playerTeam[ownIndex] = run.enemy_raw[enemyIndex];
    playerDisplay[ownIndex] = run.enemy_display[enemyIndex];
    rememberRunPokemonAppearances(run, playerDisplay);
  }
  const nextRun: CurrentRunData = {...run, status: "ready", next_battle: Number(run.battle_no || 1) + 1, player_team: playerTeam, player_display: playerDisplay};
  delete nextRun.battle_no;
  delete nextRun.enemy_raw;
  delete nextRun.enemy_display;
  delete nextRun.enemy_trainer;
  delete nextRun.enemy_boss_record;
  delete nextRun.battle_background;
  delete nextRun.boss_type;
  delete nextRun.boss_stage;
  delete nextRun.boss_route;
  delete nextRun.enemy_team_pool_id;
  delete nextRun.generation_stage;
  save.current_run = nextRun;
  const next = await persist(save);
  return startNextBattle(next);
}

async function finishRestForNextBattle(save: LocalSave, run: CurrentRunData): Promise<DesktopGameState> {
  if (!rotateFirstUsable(run)) throw new Error("队伍没有可出战宝可梦，请先恢复 HP。");
  const battleNo = Number(run.battle_no ?? 0);
  const carryRestStatus = carryRestStatusForBattle(run);
  save.current_run = {
    ...run,
    status: "ready",
    next_battle: battleNo + 1,
    rest_status: {exchanges: 0, taken_enemy_slots: [], ...carryRestStatus},
  };
  delete save.current_run.battle_no;
  delete save.current_run.enemy_raw;
  delete save.current_run.enemy_display;
  delete save.current_run.battle_background;
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
  const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball);
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
  writePlayerSlotShowdownId(run, slot, states, stableId);
  run.player_state = states;
}

async function applyMoveToSlot(run: CurrentRunData, slot: number, moveSlot: number, moveId: string): Promise<MoveSummary> {
  if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
  const rawSet = JSON.parse(JSON.stringify(run.player_team[slot])) as PokemonSet;
  const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball);
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
  writePlayerSlotShowdownId(run, slot, states, stableId);
  run.player_state = states;
  return selected;
}

async function handleRestAction(action: RestAction): Promise<DesktopGameState> {
  const save = await loadSave();
  const run = save?.current_run as CurrentRunData | null;
  if (!save || !run || (run.status !== "awaiting_rest" && run.status !== "awaiting_exchange")) throw new Error("当前不在休整阶段。");
  normalizeCurrentRun(run);
  ensureRestEventOptions(run);
  if (action.type === "choose_rest_event") {
    const message = await chooseRestEvent(save, run, action.eventId);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, message);
  }
  if (action.type === "abort") {
    save.stats = {...emptyStats(), ...(save.stats || {}), set_win_streak: 0};
    rememberRunForSoulmate(save, run);
    const settled = await settleRunEnd(save, run);
    refreshStats(save);
    save.current_run = null;
    activeBattle = null;
    activeBattleNo = 0;
    const next = await persist(save);
    const message = `本局挑战已中断，当前连胜已归零。历史最高连胜已保留。${settlementText(settled).replace(/^，/, "")}${settled.refundGained || settled.receiptBonus || settled.portfolioBonus ? "。" : ""}本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP。${settled.paidBack ? `临时BP扣回 ${settled.paidBack}BP。` : ""}`;
    const resultSummary = buildResultSummary({outcome: "abort", headline: "挑战中断", subtitle: "当前连胜归零，历史最高连胜保留", wins: Number(run.wins || 0), settled, run});
    await saveStore?.appendBattleRecord(buildRunRecord({run, message, outcome: "abort", resultSummary}));
    return gameState({screen: "result", save: next, message, result_summary: resultSummary});
  }
  if (restEventRequired(run)) throw new Error("请先选择本次休整奇遇。");
  if (action.type === "next") return finishRestForNextBattle(save, run);
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
    const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
    const battleNo = Math.max(1, Math.min(Number(run.battles || DEFAULT_BATTLES), Math.floor(Number(action.battleNo || run.next_battle || currentBattleNo + 1 || 1))));
    if (battleNo <= currentBattleNo) throw new Error("已经挑战过的对手不能更换。");
    if (battleNo > Number(run.battles || DEFAULT_BATTLES)) throw new Error("本局已经没有这场对战。");
    const route = routeForRunBattle(save, run, battleNo);
    const currentTrainer = chooseTrainerForRoute(route, run, battleNo);
    const trainer = rerouteTrainerForRoute(route, run, battleNo);
    run.forced_trainer_ids = {...(run.forced_trainer_ids || {}), [String(battleNo)]: trainer.id};
    const history = Array.from(new Set([...(run.reroute_history?.[String(battleNo)] || []), currentTrainer.id, trainer.id].filter(Boolean)));
    run.reroute_history = {...(run.reroute_history || {}), [String(battleNo)]: history};
    run.reroute_used = Number(run.reroute_used || 0) + 1;
    await refreshPlannedBattle(save, run, battleNo);
    await buildNightSkyState(save, run);
    if (run.scout && Number(run.scout.title.match(/第\s*(\d+)/)?.[1] || 0) === battleNo) delete run.scout;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `公子驾到：第 ${battleNo} 场已改为 ${trainer.name_zh}。`);
  }

  if (action.type === "set_named_champion") {
    if (!hasTalent(run.talents, "intel_named_challenge")) throw new Error("需要天赋「指名挑战」。");
    const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
    if (currentBattleNo > 0 || Number(run.next_battle || 1) > 1) throw new Error("指名挑战只能在第一场对局前使用。");
    const trainerId = action.trainerId || null;
    if (trainerId && !npcCatalog.some(entry => entry.type === "champion" && entry.id === trainerId)) throw new Error("只能指定冠军作为最终 Boss。");
    run.named_champion_id = trainerId;
    save.named_champion_id = trainerId;
    run.rest_status = {...(run.rest_status || {}), named_challenge_decided: true};
    await refreshPlannedBattle(save, run, Number(run.battles || DEFAULT_BATTLES));
    await buildNightSkyState(save, run);
    const championName = trainerId ? npcCatalog.find(entry => entry.id === trainerId)?.name_zh || "指定 Boss" : "随机最终 Boss";
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, trainerId ? `指名挑战：最终 Boss 已指定为 ${championName}。` : "指名挑战：最终 Boss 已恢复随机。");
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
    const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball, states[slot]?.showdown_id);
    const currentLevel = Math.max(1, Math.floor(Number(rawSet.level || run.player_display[slot]?.level || 50)));
    const trustLevel = talentLevel(run.talents, "exchange_trust");
    const gainLevel = trustLevel >= 3 ? 4 : trustLevel >= 2 ? 2 : 1;
    const nextLevel = Math.min(55, currentLevel + gainLevel);
    const overflow = Math.max(0, currentLevel + gainLevel - 55);
    rawSet.level = nextLevel;
    run.player_team[slot] = rawSet;
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    writePlayerSlotShowdownId(run, slot, nextStates, stableId);
    run.player_state = nextStates;
    const coinText = overflow ? `，溢出 ${overflow} 级转换为 ${addRunBp(save, run, overflow * TRUST_OVERFLOW_COIN_PER_LEVEL)}金币` : "";
    run.rest_status = {...(run.rest_status || {}), trust_level_used: true};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `不负信赖：${run.player_display[slot].species_zh || run.player_display[slot].species} 提升到 ${nextLevel} 级${coinText}。`);
  }

  if (action.type === "choose_doctor_treatment") {
    if (!run.rest_status?.event_doctor_pending) throw new Error("当前没有待选择的医生治疗。");
    const states = normalizePlayerState(run);
    if (action.branch === "status") {
      for (const state of states) {
        state.status = "";
        state.moves = (state.moves || []).map(move => ({...move, pp: Math.max(0, Number(move.maxpp || move.pp || 0))}));
        if (!state.fainted && state.hp > 0) state.hp = Math.max(1, Math.floor(Number(state.hp || 1) / 2));
        refreshStateCondition(state);
      }
      run.player_state = states;
      run.rest_status = {...(run.rest_status || {}), event_doctor_pending: false};
      const next = await persist(save);
      return await restState(next, next.current_run as CurrentRunData, "蹩脚医生哥哥：全队解除异常并恢复 PP，但未濒死宝可梦 HP 减半。");
    }
    for (const state of states) {
      const maxhp = Math.max(1, Number(state.maxhp || 1));
      state.hp = state.fainted || state.hp <= 0 ? Math.max(1, Math.floor(maxhp / 2)) : maxhp;
      refreshStateCondition(state);
    }
    run.player_state = states;
    applyRandomStatus(run, "bad_doctor_hp");
    run.rest_status = {...(run.rest_status || {}), event_doctor_pending: false};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, "蹩脚医生弟弟：全队恢复 HP，濒死宝可梦复活到半血，但都陷入了异常状态。");
  }

  if (action.type === "event_learn_move") {
    const service = action.service === "egg" ? "egg" : "tutor";
    const availableKey = service === "egg" ? "event_egg_service_available" : "event_tutor_service_available";
    const usedKey = service === "egg" ? "event_egg_service_used" : "event_tutor_service_used";
    if (!(run.rest_status as any)?.[availableKey]) throw new Error(service === "egg" ? "本次没有培育屋爷爷。" : "本次没有讲师老奶奶。");
    if ((run.rest_status as any)?.[usedKey]) throw new Error("本次技能服务已经使用过。");
    const slot = Math.floor(Number(action.slot));
    const moveSlot = Math.floor(Number(action.moveSlot));
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const rawSet = run.player_team[slot];
    const selected = (await gameService.learnableMoves(rawSet)).find(move => toId(move.id || move.name) === toId(action.moveId));
    if (!selected || !(selected.learn_sources || []).includes(service)) throw new Error(service === "egg" ? "这不是该宝可梦的合法遗传招式。" : "这不是该宝可梦的合法教授招式。");
    const spent = spendRunBp(save, run, 200, `event-learn-${service}`);
    await applyMoveToSlot(run, slot, moveSlot, selected.id || selected.name);
    run.rest_status = {...(run.rest_status || {}), [usedKey]: true};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `${service === "egg" ? "培育屋爷爷" : "讲师老奶奶"}：${run.player_display[slot]?.species_zh || "宝可梦"} 学会了 ${selected.name_zh || selected.name}，${spent.message}。`);
  }

  if (action.type === "event_apply_level") {
    const points = Math.max(0, Math.floor(Number(run.rest_status?.event_level_points || 0)));
    if (points <= 0) throw new Error("当前没有可分配等级。");
    const slot = Math.floor(Number(action.slot));
    if (slot < 0 || slot >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const cap = badgeLevelCapForTalents(run.talents) || 100;
    const rawSet = {...run.player_team[slot]};
    const currentLevel = Math.max(1, Math.floor(Number(rawSet.level || run.player_display[slot]?.level || 50)));
    if (currentLevel >= cap) throw new Error(`徽章权限限制，当前最高只能控制 ${cap} 级。`);
    const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball, states[slot]?.showdown_id);
    rawSet.level = Math.min(cap, currentLevel + 1);
    run.player_team[slot] = rawSet;
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    writePlayerSlotShowdownId(run, slot, nextStates, stableId);
    run.player_state = nextStates;
    run.rest_status = {...(run.rest_status || {}), event_level_points: points - 1};
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `恋恋不舍：${run.player_display[slot].species_zh || run.player_display[slot].species} 提升到 ${rawSet.level} 级。`);
  }

  if (action.type === "use_item") {
    const slot = Number(action.slot);
    if (slot < 0 || slot >= states.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const normalizedItem = itemKey(action.itemId);
    await assertRestItemUsableByEvents(run, normalizedItem);
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
    const beforeHp = states[slot]?.hp ?? 0;
    const item = consumeItem ? await consumeBagItem(run, normalizedItem) : await itemDetailsById(normalizedItem);
    const text = await gameService.applyConsumableItemEffectToState(item.id, states[slot], action.moveSlot);
    if (eventRecoveryMultiplier(run) !== 1 && states[slot]) {
      const maxhp = Math.max(1, Number(states[slot].maxhp || 1));
      if (states[slot].hp > beforeHp) {
        states[slot].hp = Math.min(maxhp, beforeHp + Math.max(1, Math.floor((states[slot].hp - beforeHp) * eventRecoveryMultiplier(run))));
        refreshStateCondition(states[slot]);
      }
    }
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
    const meta = run.bag_item_meta?.[itemId];
    const displayItem = {...item, cost: Math.max(0, Number(meta?.cost ?? item.cost ?? 0))};
    const price = sellPriceForItem(displayItem, run);
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

  if (action.type === "forge_items") {
    const itemIds = (action.itemIds || []).map(itemKey).filter(Boolean);
    const rewards = await rollForgeRewards(run, itemIds);
    for (const id of itemIds) consumeBagItemCount(run, id, 1);
    const rewardTexts: string[] = [];
    for (const reward of rewards) rewardTexts.push(await grantBagItem(run, reward, 1));
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `熔炉重铸完成，获得 ${rewardTexts.join("、")}。`);
  }

  if (action.type === "forge_special_item") {
    const itemId = itemKey(action.itemId);
    if (Number(run.bag_items?.[itemId] || 0) <= 0) throw new Error("背包里没有这个特殊道具。");
    const pool = specialForgePoolForItem(itemId);
    if (!pool.length) throw new Error("这个道具不能使用特殊熔炉。");
    const spent = spendRunBp(save, run, SPECIAL_FORGE_COST, "forge-special");
    const rng = seededRng(Number(run.seed || 1), 0x5f09 + Number(run.battle_no || run.next_battle || 0) * 79 + itemId.length * 17);
    const reward = shuffleByRng(pool, rng)[0];
    consumeBagItemCount(run, itemId, 1);
    const rewardText = await grantBagItem(run, reward, 1);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `特殊熔炉完成，获得 ${rewardText}，${spent.message}。`);
  }

  if (action.type === "forge_tera_orb") {
    if (!battleSettingHasTerastal(run.battle_setting)) throw new Error("本局没有开启太晶化。");
    applyTeraOrbToRunTeam(run);
    const current = run.tera_orb_type || "Normal";
    const options = TERA_ORB_TYPES.filter(type => type !== current);
    const spent = spendRunBp(save, run, SPECIAL_FORGE_COST, "forge-tera-orb");
    const rng = seededRng(Number(run.seed || 1), 0x7e4a + Number(run.battle_no || run.next_battle || 0) * 101 + current.length * 13);
    const nextType = shuffleByRng(options, rng)[0] || "Normal";
    run.tera_orb_type = nextType;
    run.tera_orb_type_zh = TERA_ORB_TYPE_ZH[nextType] || nextType;
    applyTeraOrbToRunTeam(run);
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `太晶珠重铸完成，变为${run.tera_orb_type_zh || nextType}属性，${spent.message}。`);
  }

  if (action.type === "event_raid_exchange") {
    if (!run.rest_status?.event_raid_exchange_available || run.rest_status?.event_raid_exchange_used) throw new Error("当前没有可用的奇袭交换。");
    const battleNo = Number(run.rest_status.event_raid_exchange_battle_no || run.next_battle || 1);
    const planned = await ensurePlannedBattle(save, run, battleNo);
    const own = Math.floor(Number(action.ownIndex));
    const enemy = Math.floor(Number(action.enemyIndex));
    if (own < 0 || own >= run.player_team.length || enemy < 0 || enemy >= planned.enemy_raw.length) throw new Error("交换编号需要在 1-3 之间。");
    const oldRaw = JSON.parse(JSON.stringify(run.player_team[own])) as PokemonSet;
    const oldDisplay = JSON.parse(JSON.stringify(run.player_display[own])) as RentalPokemon;
    const oldState = JSON.parse(JSON.stringify(states[own])) as PlayerPokemonState;
    const oldItem = itemKey(oldRaw.item || oldDisplay.item_id || oldDisplay.item);
    if (oldItem) {
      adjustBagItem(run, oldItem, 1);
      oldRaw.item = "";
      oldDisplay.item = "";
      oldDisplay.item_id = "";
      oldDisplay.item_zh = "";
      oldDisplay.item_desc = "";
      oldDisplay.item_desc_zh = "";
    }
    const targetRaw = JSON.parse(JSON.stringify(planned.enemy_raw[enemy])) as PokemonSet;
    const targetDisplay = JSON.parse(JSON.stringify(planned.enemy_display[enemy])) as RentalPokemon;
    const oldShowdownId = oldRaw.showdown_id || oldDisplay.showdown_id || oldState.showdown_id;
    const newShowdownId = takeReplacementRunShowdownId(run, own, oldShowdownId);
    let nextRaw = targetRaw;
    let nextDisplay = targetDisplay;
    const cappedArrival = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplay);
    nextRaw = cappedArrival.raw;
    nextDisplay = cappedArrival.display;
    writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);
    run.player_team[own] = nextRaw;
    run.player_display[own] = nextDisplay;
    const nextStates = normalizePlayerState(run);
    nextStates[own] = fullStateForPokemon(nextDisplay, own + 1);
    writePlayerSlotShowdownId(run, own, nextStates, newShowdownId);
    run.player_state = nextStates;
    addToExchangeBox(run, [oldRaw], [oldDisplay], [oldState]);
    planned.enemy_raw[enemy] = oldRaw;
    planned.enemy_display[enemy] = oldDisplay;
    assignEnemyShowdownIds(planned.enemy_raw, planned.enemy_display);
    run.planned_battles = [...(run.planned_battles || []).filter(entry => Number(entry.battle_no) !== battleNo), planned].sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
    run.rest_status = {
      ...(run.rest_status || {}),
      event_raid_exchange_used: true,
      event_rerandomized_locked_battles: Array.from(new Set([...(run.rest_status?.event_rerandomized_locked_battles || []), battleNo])),
    };
    await buildNightSkyState(save, run);
    const investments = run.bp_investments || [0, 0, 0];
    const moveInvestments = run.move_investments || [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    investments[own] = 0;
    moveInvestments[own] = [0, 0, 0, 0];
    run.bp_investments = investments;
    run.move_investments = moveInvestments;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `骇人奇袭：换来了 ${nextDisplay.species_zh || nextDisplay.species}${cappedArrival.capped ? "，等级已受徽章权限压制" : ""}。`);
  }

  if (action.type === "exchange") {
    if (!run.enemy_raw || !run.enemy_display) throw new Error("没有可交换的敌方队伍。");
    if (run.rest_status?.event_exchange_disabled) throw new Error("恋恋不舍：本次休整无法交换宝可梦。");
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
    const oldShowdownId = oldRaw.showdown_id || oldDisplay.showdown_id || oldState.showdown_id;
    const newShowdownId = takeReplacementRunShowdownId(run, action.ownIndex, oldShowdownId);
    let nextRaw: PokemonSet = {...run.enemy_raw[action.enemyIndex], item: keepItem ? run.enemy_raw[action.enemyIndex].item : ""};
    let nextDisplayBase: RentalPokemon = keepItem ? {...run.enemy_display[action.enemyIndex]} : {...run.enemy_display[action.enemyIndex], item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
    if (hasTalent(run.talents, "exchange_elite_training")) {
      const currentTier = Math.max(1, Math.min(4, Number(nextDisplayBase.stage_tier || nextRaw.stage_tier || 1)));
      const profile = `tier${Math.min(4, currentTier + 1)}` as GenerationProfile;
      const speciesId = nextDisplayBase.species_id || nextRaw.species;
      const upgraded = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), 0xe300 + own * 41 + foe * 97 + exchanges), "gen9randombattle", 1, {profiles: [profile], speciesIds: [speciesId], purpose: "normal", battleSetting: run.battle_setting});
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
    const cappedArrival = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplayBase);
    nextRaw = cappedArrival.raw;
    nextDisplayBase = cappedArrival.display;
    if (!keepItem) nextDisplayBase = {...nextDisplayBase, item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
    writePokemonShowdownId(nextRaw, nextDisplayBase, undefined, newShowdownId);
    run.player_team[action.ownIndex] = hasTalent(run.talents, "economy_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
    run.player_display[action.ownIndex] = hasTalent(run.talents, "economy_shiny_collector") ? shinyPokemon(nextDisplayBase) : nextDisplayBase;
    writePokemonShowdownId(run.player_team[action.ownIndex], run.player_display[action.ownIndex], undefined, newShowdownId);
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
    return await restState(next, next.current_run as CurrentRunData, `已交换，${spent.message}。新宝可梦以${stateText}加入，且${itemText}${hasTalent(run.talents, "exchange_elite_training") ? "；英才教育已提升品质" : ""}${cappedArrival.capped ? "；徽章权限已压制到手等级" : ""}。`);
  }

  if (action.type === "box_exchange") {
    throw new Error("旧版保险盒天赋已移除。");
  }

  if (action.type === "all_in_exchange") {
    if (!hasTalent(run.talents, "growth_all_in")) throw new Error("需要天赋「孤注一掷」。");
    if (run.rest_status?.event_exchange_disabled) throw new Error("恋恋不舍：本次休整无法交换宝可梦。");
    if (run.all_in_exchange_used) throw new Error("本局已经使用过孤注一掷。");
    const own = Number(action.ownIndex);
    if (own < 0 || own >= run.player_team.length) throw new Error("宝可梦编号需要在 1-3 之间。");
    const nextBattleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
    const generated = await gameService.generateRentalCandidates(gameService.deriveSeed(Number(run.seed), 0xa111 + nextBattleNo * 17 + own), "gen9randombattle", 1, {profiles: ["tier4"], purpose: "normal", battleSetting: run.battle_setting});
    let nextRaw = generated.team[0];
    let nextDisplay = generated.display[0];
    if (!nextRaw || !nextDisplay) throw new Error("孤注一掷生成失败。");
    const cappedArrival = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplay);
    nextRaw = cappedArrival.raw;
    nextDisplay = cappedArrival.display;
    const oldName = run.player_display[own]?.species_zh || run.player_display[own]?.species || `第 ${own + 1} 只`;
    const oldShowdownId = run.player_team[own]?.showdown_id || run.player_display[own]?.showdown_id || states[own]?.showdown_id;
    addToExchangeBox(run, [run.player_team[own]], [run.player_display[own]], [states[own]]);
    const newShowdownId = takeReplacementRunShowdownId(run, own, oldShowdownId);
    writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);
    run.player_team[own] = hasTalent(run.talents, "economy_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
    run.player_display[own] = hasTalent(run.talents, "economy_shiny_collector") ? shinyPokemon(nextDisplay) : nextDisplay;
    writePokemonShowdownId(run.player_team[own], run.player_display[own], undefined, newShowdownId);
    run.player_state = normalizePlayerState(run);
    run.player_state[own] = fullStateForPokemon(run.player_display[own], own + 1);
    writePlayerSlotShowdownId(run, own, run.player_state, newShowdownId);
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
    return await restState(next, next.current_run as CurrentRunData, `孤注一掷发动：${oldName} 被替换成了 ${newName}${cappedArrival.capped ? "，徽章权限已压制到手等级" : ""}。另外两只宝可梦已变为半血并陷入睡眠，即将结束休整。`);
  }

  if (action.type === "buy_item") {
    if (run.rest_status?.event_shop_disabled) throw new Error("本次休整没有商店。");
    if (run.rest_status?.event_barter_active) throw new Error("以物易物期间不能使用金币购买，请投入背包道具交换。");
    const itemId = itemKey(action.itemId);
    const cost = await itemBaseCostById(itemId);
    const spent = spendRunBp(save, run, cost, `buy-item:${itemId}`);
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    rememberBagItemMeta(run, await itemDetailsById(itemId));
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已购买道具，${spent.message}。`);
  }

  if (action.type === "roll_shop") {
    const snapshot = JSON.parse(JSON.stringify(run)) as CurrentRunData;
    try {
      if (run.rest_status?.event_shop_disabled) throw new Error("本次休整没有商店。");
      const shopKind = normalizeShopKind(action.shopKind);
      const cost = run.rest_status?.event_barter_active ? 0 : shopNextRollCostForKind(run, shopKind);
      if (currentCoins(run) < cost) throw new Error(`金币不足，需要 ${cost}金币。`);
      const spent = spendRunBp(save, run, cost, `shop-roll:${shopKind}`);
      if (Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0 && cost <= 0) {
        run.rest_status = {...(run.rest_status || {}), free_shop_rolls_remaining: Math.max(0, Number(run.rest_status?.free_shop_rolls_remaining || 0) - 1)};
      }
      run.rest_status = {...(run.rest_status || {}), free_shop_roll_used: true, shop_preferred_roll_used: false};
      run.shop_kind = shopKind;
      run.shop_roll_count = Number(run.shop_roll_count || 0) + 1;
      run.shop_offers = await rollShopOffers(run, shopKind);
      run.shop_purchased_offer_id = null;
      run.shop_purchased_offer_counts = {};
      run.shop_purchased_item_counts = {};
      run.shop_last_roll_bonus = shopKind === "tm" ? null : shopDuplicateBonusForOffers(run.shop_offers || []);
      if (run.shop_last_roll_bonus?.count) {
        const itemId = itemKey(run.shop_last_roll_bonus.item_id);
        run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + run.shop_last_roll_bonus.count};
        const bonusOffer = (run.shop_offers || []).find(offer => itemKey(offer.id || offer.name) === itemId);
        if (bonusOffer) rememberBagItemMeta(run, bonusOffer);
      }
      const next = await persist(save);
      const bonusText = run.shop_last_roll_bonus?.count ? `抽到 ${run.shop_last_roll_bonus.match_count} 连，免费获得 ${run.shop_last_roll_bonus.count} 个 ${run.shop_last_roll_bonus.name_zh || run.shop_last_roll_bonus.name}！` : "商店抽奖完成。";
      return await restState(next, next.current_run as CurrentRunData, `${SHOP_KIND_CONFIG[shopKind].title}：${bonusText}${spent.paid || cost ? ` 抽奖${spent.message}。` : ""}`);
    } catch (error) {
      for (const key of Object.keys(run)) delete (run as any)[key];
      Object.assign(run, snapshot);
      throw error;
    }
  }

  if (action.type === "buy_shop_offer") {
    if (run.rest_status?.event_barter_active) throw new Error("以物易物期间不能使用金币购买，请投入背包道具交换。");
    const offer = (run.shop_offers || []).find(item => item.offer_id === action.offerId);
    if (!offer) throw new Error("商品不存在，请先刷新商店。");
    const itemId = itemKey(offer.id || offer.name);
    const pricedOffer = pricedShopOfferForRun(run, offer);
    const spent = spendRunBp(save, run, Number(pricedOffer.cost || 0), `shop-buy:${itemId}`, {alreadyPriced: true});
    run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + 1};
    rememberBagItemMeta(run, offer);
    run.shop_purchased_offer_counts = {...(run.shop_purchased_offer_counts || {}), [offer.offer_id]: Number(run.shop_purchased_offer_counts?.[offer.offer_id] || 0) + 1};
    run.shop_purchased_item_counts = {...(run.shop_purchased_item_counts || {}), [itemId]: shopItemPurchaseCount(run, itemId) + 1};
    run.shop_purchased_offer_id = offer.offer_id;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `已购买 ${offer.name_zh || offer.name}，${spent.message}。`);
  }

  if (action.type === "event_barter_buy") {
    if (!run.rest_status?.event_barter_active) throw new Error("当前不是以物易物商店。");
    const offer = (run.shop_offers || []).find(item => item.offer_id === action.offerId);
    if (!offer) throw new Error("商品不存在，请先刷新商店。");
    const materialIds = (action.itemIds || []).map(itemKey).filter(Boolean);
    if (materialIds.length < 1 || materialIds.length > 3) throw new Error("以物易物需要投入 1-3 个背包道具。");
    const materialCounts = materialIds.reduce<Record<string, number>>((acc, id) => ({...acc, [id]: Number(acc[id] || 0) + 1}), {});
    let value = 0;
    for (const [id, needed] of Object.entries(materialCounts)) {
      if (isSpecialSystemItemId(id)) throw new Error("特殊系统道具不能用于以物易物。");
      if (Number(run.bag_items?.[id] || 0) < needed) throw new Error("以物易物材料数量不足。");
      const item = await itemDetailsById(id);
      const meta = run.bag_item_meta?.[id];
      value += sellPriceForItem({...item, cost: Math.max(0, Number(meta?.cost ?? item.cost ?? 0))}, run) * needed;
    }
    const pricedOffer = pricedShopOfferForRun(run, offer);
    const required = Math.ceil(Number(pricedOffer.cost || 0) * 0.7);
    if (value < required) throw new Error(`投入道具价值不足，需要至少 ${required}。`);
    for (const [id, needed] of Object.entries(materialCounts)) consumeBagItemCount(run, id, needed);
    const itemId = itemKey(offer.id || offer.name);
    adjustBagItem(run, itemId, 1);
    rememberBagItemMeta(run, offer);
    run.shop_purchased_offer_counts = {...(run.shop_purchased_offer_counts || {}), [offer.offer_id]: Number(run.shop_purchased_offer_counts?.[offer.offer_id] || 0) + 1};
    run.shop_purchased_item_counts = {...(run.shop_purchased_item_counts || {}), [itemId]: shopItemPurchaseCount(run, itemId) + 1};
    run.shop_purchased_offer_id = offer.offer_id;
    const next = await persist(save);
    return await restState(next, next.current_run as CurrentRunData, `以物易物：换得 ${offer.name_zh || offer.name}。`);
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
    const legalMoves = (await gameService.learnableMoves(rawSet)).filter(move => {
      const sources = move.learn_sources || [];
      return !currentMoves.has(toId(move.id || move.name)) && (sources.includes("levelup") || sources.includes("egg"));
    });
    const drawKey = `${slot}:${action.moveSlot}`;
    const drawRoll = Number(run.move_draw_rolls?.[drawKey] || 0) + 1;
    run.move_draw_rolls = {...(run.move_draw_rolls || {}), [drawKey]: drawRoll};
    const rng = seededRng(Number(run.seed || 1), 0x7100 + slot * 17 + action.moveSlot * 101 + Number(run.battle_no || 0) + drawRoll * 997);
    const draws = shuffleByRng(legalMoves, rng).slice(0, moveDrawCount(run));
    run.move_draws = {...(run.move_draws || {}), [drawKey]: draws};
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
    const rumorLevel = talentLevel(run.talents, "intel_rumor");
    if (rumorLevel <= 0) throw new Error("需要天赋「小道消息」。");
    const battleNo = Math.max(1, Math.min(Number(run.battles || DEFAULT_BATTLES), Number(action.battleNo || 1)));
    await buildNightSkyState(save, run);
    const rows = run.night_sky?.rows || [];
    const row = rows.find(entry => Number(entry.battle_no) === battleNo);
    if (!row) throw new Error("没有找到这场训练师信息。");
    const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
    if (battleNo <= currentBattleNo) throw new Error("已经挑战过的对手无需侦查。");
    if (action.level === "one") {
      if (rumorLevel < 2) throw new Error("需要小道消息 Lv2 才能免费查看一只宝可梦。");
      if (Number(row.revealed || 0) >= 1) throw new Error("这一行已经免费查看过。");
      row.revealed = 1;
      row.unlocked = false;
    } else {
      if (rumorLevel < 3) throw new Error("需要小道消息 Lv3 才能解锁完整阵容。");
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
    writePlayerSlotShowdownId(run, action.slot, run.player_state);
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
    const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball, states[slot]?.showdown_id);
    if (refund) addCoins(run, refund);
    const spent = spendRunBp(save, run, cost, "adjust-move");
    run.player_team[slot] = rawSet;
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    writePlayerSlotShowdownId(run, slot, nextStates, stableId);
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
    const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball, states[slot]?.showdown_id);
    const options = await gameService.editOptions(rawSet);
    validateStatAdjustments(rawSet, options);
    const cost = await goodsCost("service", "adjust_stats", ADJUST_STATS_COST);
    const spent = spendRunBp(save, run, cost, "adjust-stats");
    const [nextDisplay] = await gameService.describeTeam([rawSet]);
    run.player_team[slot] = rawSet;
    run.player_display[slot] = nextDisplay || run.player_display[slot];
    const nextStates = normalizePlayerState(run);
    nextStates[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
    writePlayerSlotShowdownId(run, slot, nextStates, stableId);
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

  handleIpc("save:load", async () => loadSave());
  handleIpc("save:createNew", async (trainer: TrainerProfile) => saveStore!.createNew(normalizeTrainerProfile(trainer)));
  handleIpc("save:delete", async () => saveStore!.delete());
  handleIpc("save:updateTrainer", async (trainer: TrainerProfile) => saveStore!.updateTrainer(normalizeTrainerProfile(trainer)));
  handleIpc("save:battleRecords", async () => saveStore!.battleRecords());
  handleIpc("save:testMode", async () => enableTestMode());
  if (e2eEnabled) {
    handleIpc("e2e:patchSave", async (patch: Partial<LocalSave>) => e2ePatchSave(patch));
  }
  handleIpc("battleSetting:get", async () => getBattleSetting());
  handleIpc("battleSetting:update", async (setting: Partial<BattleSetting>) => updateBattleSetting(setting));
  handleIpc("trainer:catalog", async () => trainerCatalogState());
  handleIpc("game:generateCandidates", async (seed?: number) => gameService.generateRentalCandidates(seed || Date.now()));
  handleIpc("run:prepareStarterItems", async (seed?: number) => prepareStarterItems(seed));
  handleIpc("run:chooseStarterItem", async (offerId?: string | null) => chooseStarterItem(offerId || null));
  handleIpc("run:cancelPreparation", async () => cancelPreparation());
  handleIpc("talents:get", async () => talentConfig());
  handleIpc("talents:unlock", async (id: string) => unlockTalent(id));
  handleIpc("talents:configure", async (ids: string[]) => configureTalents(ids));
  handleIpc("talents:setNamedChallenge", async (trainerId: string | null) => setNamedChallenge(trainerId));
  handleIpc("starterUpgrades:get", async () => starterUpgradeConfig());
  handleIpc("starterUpgrades:upgrade", async (id: string) => upgradeStarter(id));
  handleIpc("run:prepareCandidates", async (seed?: number) => prepareCandidates(seed));
  handleIpc("run:rerollStarterCandidate", async (index: number) => rerollStarterCandidate(index));
  handleIpc("run:beginChallenge", async (selectedIndexes: number[], seed: number, battles?: number) => beginChallenge(selectedIndexes, seed, battles));
  handleIpc("run:continue", async () => continueRun());
  handleIpc("run:battleChoice", async (choice: string) => submitBattleChoice(choice));
  handleIpc("run:autoAdvanceBattle", async () => autoAdvanceBattle());
  handleIpc("run:exchange", async (ownIndex: number | null, enemyIndex: number | null) => {
    if (ownIndex === null || enemyIndex === null) return handleRestAction({type: "next"});
    return handleRestAction({type: "exchange", ownIndex, enemyIndex});
  });
  handleIpc("run:restAction", async (action: RestAction) => handleRestAction(action));
  handleIpc("shop:items", async (query?: string) => shopItems(query || ""));
  handleIpc("pokemon:learnableMoves", async (slot: number, query?: string) => learnableMoves(slot, query || ""));
  handleIpc("pokemon:editOptions", async (slot: number) => editOptions(slot));
  handleIpc("dex:search", async (category: DesktopDexCategory, query?: string, offset?: number, limit?: number) => dexSearch(category, query || "", offset || 0, limit || 8));
  handleIpc("run:getBattleState", async () => {
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
