import type {CurrentRunData, ItemCategory, LocalSave, ShopItem, ShopOffer, ShopState, TalentView} from "@changebattle/shared";

export const DEFAULT_BATTLES = 7;
export const BP_SCALE = 100;
export const MAX_BP = 9999 * BP_SCALE;
export const TALENT_EQUIP_LIMIT = 5;
export const WIN_BP_REWARD = 5 * BP_SCALE;
export const REROLL_COSTS = [0, 1 * BP_SCALE, 2 * BP_SCALE] as const;
export const SHOP_OFFER_COUNT = 3;
export const SHOP_OFFER_COUNT_GAMBLER = 4;
export const SHOP_CANDIDATE_COUNT = 4;
export const SHOP_CANDIDATE_COUNT_GAMBLER = 8;
export const STARTER_ITEM_OFFER_COUNT = 5;
export const STARTER_ITEM_REROLL_COST = 1 * BP_SCALE;
export const SHOP_ROLL_COST_FIRST = 0;
export const SHOP_ROLL_COST_NEXT = 150;
export const SHOP_ROLL_COST_GAMBLER_PAID = Math.floor(SHOP_ROLL_COST_NEXT * 1.5);
export const SHOP_GUEST_FREE_ROLLS = 3;
export const SHOP_PREFERRED_ROLL_COST = 1 * BP_SCALE;
export const MOVE_DRAW_COST = 2 * BP_SCALE;
export const MOVE_DRAW_COUNT = 2;
export const MOVE_DRAW_COUNT_GAMBLER = 4;
export const DIRECT_MOVE_COST = 3 * BP_SCALE;
export const RANDOMIZE_PART_COST = 1 * BP_SCALE;
export const RANDOMIZE_ALL_COST = 2 * BP_SCALE;
export const SCOUT_BASIC_COST = 0;
export const SCOUT_ONE_COST = 0;
export const SCOUT_ALL_COST = 3 * BP_SCALE;
export const SECOND_TEAM_ROAR_COST = 10 * BP_SCALE;
export const EXCHANGE_CAREFUL_RATIO = 0.75;
export const BOSS_EXCHANGE_COST = 2 * BP_SCALE;
export const REST_EXCHANGE_COSTS = [0, 1 * BP_SCALE, 2 * BP_SCALE] as const;
export const REST_HP_COSTS = {1: 0, 2: 0, 3: 0} as const;
export const REST_PP_COSTS = {1: 0, 2: 0, 3: 0} as const;
export const REST_STATUS_COSTS = {1: 0, 2: 0, 3: 0} as const;
export const ADJUST_STATS_COST = 10 * BP_SCALE;

export const TALENTS: TalentView[] = [
  {id: "exchange_lossless", name: "爱护有加", category: "交换", cost: 2 * BP_SCALE, desc: "交换获得的宝可梦满 HP/满 PP 加入，并获取目标身上的道具。"},
  {id: "exchange_pickpocket", name: "英才教育", category: "交换", cost: 3 * BP_SCALE, desc: "交换来的宝可梦品质更高；只改变阶级数值，不改变技能、特性和道具。"},
  {id: "exchange_gym_recognition", name: "馆主认可", category: "交换", cost: 15 * BP_SCALE, desc: "馆主和四天王宝可梦不再受默认只能交换 1 只的限制。"},
  {id: "exchange_factory_freedom", name: "工厂自由", category: "交换", cost: 30 * BP_SCALE, desc: "所有交换免费。"},
  {id: "exchange_second_team_roar", name: "二队的怒吼", category: "交换", cost: 50 * BP_SCALE, desc: "三只宝可梦都阵亡后，可选择损失 1000BP 重新 6 选 3 并重打当前场次；每局一次。"},
  {id: "exchange_safe_box", name: "无损交易", category: "交换", cost: 50 * BP_SCALE, desc: "拥有一个特殊宝可梦盒子，本局遇到的宝可梦会寄存在其中，后续可再次交换回来。"},
  {id: "gambler_move_draw_4", name: "铤而走险", category: "赌徒", cost: 10 * BP_SCALE, desc: "对局中 BP 花费和休整页消耗道具可能出现更好或更坏的结果。"},
  {id: "gambler_shop_offer_5", name: "顺手牵羊", category: "赌徒", cost: 5 * BP_SCALE, desc: "商店老虎机格子数量从 3 个提升到 4 个，候选池从 4 个提升到 8 个，技能随机候选从 2 个提升到 4 个。"},
  {id: "gambler_free_stat_reset", name: "时也命也", category: "赌徒", cost: 10 * BP_SCALE, desc: "重置数值时可能免费，也可能付出更高代价。"},
  {id: "gambler_random_cost_1", name: "座上贵宾", category: "赌徒", cost: 20 * BP_SCALE, desc: "每次休整获得额外免费商店抽奖机会；本次休整后续商店抽奖消耗提高。"},
  {id: "gambler_streak_bp_risk", name: "好运连连", category: "赌徒", cost: 10 * BP_SCALE, desc: "开局更容易遇到强力宝可梦，并按连胜提高初始候选品质和闪光出现机会。"},
  {id: "gambler_all_in_exchange", name: "孤注一掷", category: "赌徒", cost: 50 * BP_SCALE, desc: "每局限一次，生成一只强力宝可梦用于交换；交换后另外两只半血并陷入睡眠，且立即结束本次休整。"},
  {id: "prophet_first_mover", name: "上帝之眼", category: "先知", cost: 2 * BP_SCALE, desc: "对战时显示技能打击效果，允许在对战时查看图鉴，并显示个体值和努力值。"},
  {id: "prophet_next_scout", name: "夜观天象", category: "先知", cost: 50 * BP_SCALE, desc: "休整时可查看本局训练师顺序，并逐步揭示他们的阵容。"},
  {id: "prophet_direct_move", name: "运筹帷幄", category: "先知", cost: 20 * BP_SCALE, desc: "调整技能时不再随机，可直接从可学习技能池选择一个技能替换，每次 300BP。"},
  {id: "prophet_candidate_12", name: "慧眼识珠", category: "先知", cost: 50 * BP_SCALE, desc: "开局从 12 只候选宝可梦中选择，而不是 6 只。"},
  {id: "business_starter_3", name: "有备无患", category: "经营", cost: 10 * BP_SCALE, desc: "开局可以选择 3 个免费起始道具。"},
  {id: "business_discount_70", name: "贵客专享", category: "经营", cost: 15 * BP_SCALE, desc: "对局中所有 BP 花费享受专享折扣，向下取整。"},
  {id: "business_refund_70", name: "精打细算", category: "经营", cost: 20 * BP_SCALE, desc: "背包返还时返还更多。"},
  {id: "business_sell_full", name: "奇货可居", category: "经营", cost: 30 * BP_SCALE, desc: "卖出道具时能原价出售。"},
  {id: "business_amulet_coin", name: "护符金币", category: "经营", cost: 50 * BP_SCALE, desc: "所有 BP 正向结算获得额外收益。"},
  {id: "business_shiny_collector", name: "闪光收藏家", category: "经营", cost: 50 * BP_SCALE, desc: "任意交换获得的宝可梦均为闪光，且闪光带来的 BP 加成提高。"},
  {id: "business_shop_strategy", name: "神机妙算", category: "经营", cost: 20 * BP_SCALE, desc: "商店抽奖前可额外花费 100BP 指定恢复药、PP 药、树果、战斗道具或技能机器。"},
];

export function emptyStats() {
  return {battle_points: 0, battles: 0, wins: 0, losses: 0, win_rate: 0, set_win_streak: 0, best_set_win_streak: 0, rank_status: "未开放"};
}

export function currentBp(save: LocalSave): number {
  return Number((save.stats || emptyStats()).battle_points || 0);
}

export function refreshStats(save: LocalSave): void {
  const stats = {...emptyStats(), ...(save.stats || {})};
  stats.battle_points = Math.max(0, Math.min(MAX_BP, Number(stats.battle_points || 0)));
  stats.battles = Number(stats.battles || 0);
  stats.wins = Number(stats.wins || 0);
  stats.losses = Number(stats.losses || 0);
  stats.win_rate = stats.battles ? Math.round((stats.wins / stats.battles) * 1000) / 10 : 0;
  stats.set_win_streak = Number(stats.set_win_streak || 0);
  stats.best_set_win_streak = Math.max(Number(stats.best_set_win_streak || 0), stats.set_win_streak);
  save.stats = stats;
}

export function addBp(save: LocalSave, amount: number): void {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  save.stats.battle_points = Math.min(MAX_BP, currentBp(save) + Math.max(0, amount));
  refreshStats(save);
}

export function spendBp(save: LocalSave, cost: number): void {
  const normalizedCost = Math.max(0, Number(cost || 0));
  if (currentBp(save) < normalizedCost) throw new Error(`BP 不足，需要 ${normalizedCost}BP。`);
  save.stats.battle_points = currentBp(save) - normalizedCost;
  refreshStats(save);
}

export function hasTalent(talents: TalentView[] | undefined, id: string): boolean {
  return Boolean((talents || []).some(talent => talent.id === id));
}

export function talent(id: string): TalentView {
  const found = TALENTS.find(entry => entry.id === id);
  if (!found) throw new Error(`Unknown talent: ${id}`);
  return found;
}

export function talentsForIds(ids: string[] = []): TalentView[] {
  const wanted = new Set(ids);
  return TALENTS.filter(entry => wanted.has(entry.id));
}

export function gainedBp(run: CurrentRunData | null | undefined, amount: number): number {
  let total = Math.max(0, Number(amount || 0));
  const shinyCount = (run?.player_display || []).filter(pokemon => pokemon.shiny).length;
  if (shinyCount > 0) total *= Math.pow(hasTalent(run?.talents, "business_shiny_collector") ? 1.3 : 1.1, shinyCount);
  if (hasTalent(run?.talents, "business_amulet_coin")) total *= 1.5;
  return Math.floor(total);
}

export function addRunBp(save: LocalSave, run: CurrentRunData | null | undefined, amount: number): number {
  const gained = gainedBp(run, amount);
  addBp(save, gained);
  return gained;
}

export function clearBonus(save: LocalSave, run?: CurrentRunData): {setStreak: number; bonus: number} {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  const setStreak = Number(save.stats.set_win_streak || 0) + 1;
  save.stats.set_win_streak = setStreak;
  save.stats.best_set_win_streak = Math.max(Number(save.stats.best_set_win_streak || 0), setStreak);
  const bonus = gainedBp(run, (setStreak * 2 + 7) * BP_SCALE);
  addBp(save, bonus);
  return {setStreak, bonus};
}

export function exchangeCost(run: CurrentRunData, exchangeCount: number): number {
  if (hasTalent(run.talents, "exchange_factory_freedom")) return 0;
  if ((run.boss_type === "gym" || run.boss_type === "elite4") && !hasTalent(run.talents, "exchange_gym_recognition")) return BOSS_EXCHANGE_COST;
  return REST_EXCHANGE_COSTS[Math.min(exchangeCount, REST_EXCHANGE_COSTS.length - 1)];
}

export function canExchangeBoss(run: CurrentRunData, exchangeCount: number): boolean {
  if (!run.boss_type || run.boss_type === "normal") return true;
  if (run.boss_type === "champion") return false;
  if (run.boss_type === "gym" || run.boss_type === "elite4") {
    return hasTalent(run.talents, "exchange_gym_recognition") || exchangeCount === 0;
  }
  return false;
}

export function exchangeKeepsItem(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "exchange_lossless");
}

export function exchangeFullState(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "exchange_lossless");
}

export function exchangeStateRatio(run: CurrentRunData): number {
  if (exchangeFullState(run)) return 1;
  return hasTalent(run.talents, "exchange_lossless") ? EXCHANGE_CAREFUL_RATIO : 0.5;
}

export function canSecondTeamRoar(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "exchange_second_team_roar") && !run.second_team_roar_used;
}

export function candidateCountForTalents(talents: TalentView[] | undefined): number {
  return hasTalent(talents, "prophet_candidate_12") ? 12 : 6;
}

export function applyProphetFirstMover(save: LocalSave, talents: TalentView[]): {active: boolean; amount: number} {
  void save;
  void talents;
  return {active: false, amount: 0};
}

export function settleProphetFirstMover(save: LocalSave, run?: CurrentRunData | null): number {
  void save;
  void run;
  return 0;
}

export function settleLegacyProphetDebt(save: LocalSave, run?: CurrentRunData | null): number {
  const amount = Number(run?.temporary_bp_debt || 0);
  if (amount <= 0) return 0;
  spendBp(save, Math.min(amount, currentBp(save)));
  return amount;
}

export function starterPurchaseLimit(talents: TalentView[] | undefined): number {
  return hasTalent(talents, "business_starter_3") ? 3 : 1;
}

export function pricedForShop(item: ShopItem, talents: TalentView[] | undefined): number {
  const baseCost = Math.max(0, Number(item.cost || 5 * BP_SCALE));
  return hasTalent(talents, "business_discount_70") ? Math.floor(baseCost * 0.7) : baseCost;
}

export function pricedForRun(run: CurrentRunData | null | undefined, cost: number): number {
  const baseCost = Math.max(0, Math.floor(Number(cost || 0)));
  return hasTalent(run?.talents, "business_discount_70") ? Math.floor(baseCost * 0.7) : baseCost;
}

export function shopOfferCount(run: CurrentRunData): number {
  return hasTalent(run.talents, "gambler_shop_offer_5") ? SHOP_OFFER_COUNT_GAMBLER : SHOP_OFFER_COUNT;
}

export function shopCandidateCount(run: CurrentRunData): number {
  return hasTalent(run.talents, "gambler_shop_offer_5") ? SHOP_CANDIDATE_COUNT_GAMBLER : SHOP_CANDIDATE_COUNT;
}

export function shopNextRollCost(run: CurrentRunData): number {
  if (Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0) return 0;
  if (hasTalent(run.talents, "gambler_random_cost_1")) {
    return Number(run.shop_roll_count || 0) <= 0 ? SHOP_ROLL_COST_FIRST : SHOP_ROLL_COST_GAMBLER_PAID;
  }
  return Number(run.shop_roll_count || 0) <= 0 ? SHOP_ROLL_COST_FIRST : SHOP_ROLL_COST_NEXT;
}

export function shopDuplicateBonusForOffers(offers: ShopOffer[]): ShopState["last_roll_bonus"] {
  const groups = new Map<string, {offer: ShopOffer; indexes: number[]}>();
  offers.forEach((offer, index) => {
    const key = itemKey(offer.id || offer.name);
    if (!key) return;
    const group = groups.get(key) || {offer, indexes: []};
    group.indexes.push(index);
    groups.set(key, group);
  });
  let best: {offer: ShopOffer; indexes: number[]} | null = null;
  for (const group of groups.values()) {
    if (group.indexes.length < 2) continue;
    if (!best || group.indexes.length > best.indexes.length || (group.indexes.length === best.indexes.length && group.indexes[0] < best.indexes[0])) best = group;
  }
  if (!best) return null;
  const matchCount = Math.min(5, best.indexes.length);
  return {
    item_id: itemKey(best.offer.id || best.offer.name),
    name: best.offer.name,
    name_zh: best.offer.name_zh,
    count: matchCount - 1,
    match_count: matchCount,
    icon_asset: best.offer.icon_asset,
  };
}

export function moveDrawCount(run: CurrentRunData): number {
  return hasTalent(run.talents, "gambler_shop_offer_5") ? MOVE_DRAW_COUNT_GAMBLER : MOVE_DRAW_COUNT;
}

export function moveDrawCost(run: CurrentRunData): number {
  return MOVE_DRAW_COST;
}

export function statResetCost(run: CurrentRunData, baseCost: number, part: string, roll?: number): number {
  if (!hasTalent(run.talents, "gambler_free_stat_reset")) return baseCost;
  const chance = roll ?? seededRng(Number(run.seed || 1), 0xf3ee + Number(run.battle_no || run.next_battle || 0) * 41 + toId(part).length * 67 + Date.now())();
  if (chance < 0.6) return 0;
  if (chance < 0.9) return baseCost * 2;
  return baseCost;
}

export function sellPriceForItem(item: Pick<ShopItem, "cost">, run: CurrentRunData): number {
  const base = Math.max(0, Number(item.cost || 0));
  return hasTalent(run.talents, "business_sell_full") ? base : Math.floor(base / 2);
}

export function refundableBagBaseBpFromCosts(run: CurrentRunData, itemCosts: Record<string, number>): number {
  const rate = hasTalent(run.talents, "business_refund_70") ? 1 : 0.5;
  let total = 0;
  for (const [id, rawCount] of Object.entries(run.bag_items || {})) {
    const count = Math.max(0, Number(rawCount || 0));
    const locked = Math.max(0, Number(run.non_refundable_bag_items?.[itemKey(id)] || 0));
    const refundable = Math.max(0, count - locked);
    if (!refundable) continue;
    total += Math.max(0, Number(itemCosts[itemKey(id)] || 0)) * refundable;
  }
  return Math.floor(total * rate);
}

export function canScoutNext(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "prophet_next_scout");
}

export function scoutCost(level: "basic" | "one" | "all"): number {
  return level === "all" ? SCOUT_ALL_COST : level === "one" ? SCOUT_ONE_COST : SCOUT_BASIC_COST;
}

export function canDirectMove(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "prophet_direct_move");
}

export function itemKey(value: string | undefined): string {
  const raw = String(value || "").trim();
  if (/^tm:/i.test(raw)) return `tm:${toId(raw.slice(3))}`;
  return toId(raw);
}

export function isTmItemId(itemId: string | undefined): boolean {
  return /^tm:/i.test(String(itemId || ""));
}

export function itemCategory(item: Pick<ShopItem, "id" | "name" | "desc" | "desc_zh"> & Partial<Pick<ShopItem, "name_zh">>): ItemCategory {
  if (isTmItemId(item.id)) return "tm";
  const text = `${item.id} ${item.name} ${item.desc} ${item.desc_zh}`.toLowerCase();
  if (/technical machine|\btm\d*|\btr\d*|技能机器|招式学习器/.test(text)) return "tm";
  if (/potion|restore|heal|revive|ether|elixir|berry|herb|药|回复|恢复|解除|树果|果/.test(text)) return "consumable";
  return "held";
}

export function toId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function seededRng(seed: number, salt = 0): () => number {
  let state = (Number(seed || 1) ^ salt ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
