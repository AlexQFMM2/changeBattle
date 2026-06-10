import type {CurrentRunData, ItemCategory, LocalSave, ShopItem, ShopOffer, ShopState, StarChartState, StarterItemGroup, StarterUpgradeState, StarterUpgradeView, TalentView} from "@changebattle/shared";

export const DEFAULT_BATTLES = 7;
export const COINS_PER_BP = 100;
export const BP_SCALE = COINS_PER_BP;
export const MAX_BP = 99999;
export const TRUST_OVERFLOW_COIN_PER_LEVEL = 50;
export const BADGE_LEVEL_CAPS: Record<number, number> = {1: 50, 2: 55};
export const WIN_BP_REWARD = 5 * BP_SCALE;
export const STARTER_ANGEL_FUND_COINS = 1000;
export const SHOP_OFFER_COUNT = 3;
export const SHOP_OFFER_COUNT_GAMBLER = 4;
export const SHOP_CANDIDATE_COUNT = 4;
export const SHOP_CANDIDATE_COUNT_GAMBLER = 8;
export const PREMIUM_HELD_ITEM_MIN_COST = 800;
export const PREMIUM_TM_MIN_POWER = 90;
export const STARTER_COINS_DEFAULT = 0;
export const STARTER_ITEM_MAX_LEVEL = 4;
export const STARTER_ITEM_DEFAULT_QUALITY_LEVEL = 1;
export const STARTER_ITEM_DEFAULT_QUANTITY_LEVEL = 2;
export const STARTER_POKEMON_INSPECT_MAX_LEVEL = 6;
export const SHOP_ROLL_COST_FIRST = 0;
export const SHOP_ROLL_COST_NEXT = 75;
export const SHOP_ROLL_COST_GAMBLER_PAID = Math.floor(SHOP_ROLL_COST_NEXT * 1.5);
export const SHOP_GUEST_FREE_ROLLS = 3;
export const MOVE_DRAW_COST = 1 * BP_SCALE;
export const MOVE_DRAW_COUNT = 8;
export const MOVE_DRAW_COUNT_GAMBLER = 16;
export const RANDOMIZE_PART_COST = 0.5 * BP_SCALE;
export const RANDOMIZE_ALL_COST = 1.5 * BP_SCALE;
export const SCOUT_BASIC_COST = 0;
export const SCOUT_ONE_COST = 0;
export const SCOUT_ALL_COST = 50;
export const REROUTE_LIMIT = 3;
export const RECYCLE_RECEIPT_RATE = 0.15;
export const PORTFOLIO_BONUS_PER_TYPE = 200;
export const BAG_REFUND_RATE = 0.25;
export const BAG_REFUND_RATE_PREMIUM = 0.5;
export const BAG_REFUND_RATE_LOSS = 0.1;
export const BAG_REFUND_RATE_LOSS_PREMIUM = 0.2;
export const EXCHANGE_CAREFUL_RATIO = 0.75;
export const BOSS_EXCHANGE_COST = 2 * BP_SCALE;
export const REST_EXCHANGE_COSTS = [0, 1 * BP_SCALE, 2 * BP_SCALE] as const;
export const REST_HP_COSTS = {1: 0, 2: 0, 3: 0} as const;
export const REST_PP_COSTS = {1: 0, 2: 0, 3: 0} as const;
export const REST_STATUS_COSTS = {1: 0, 2: 0, 3: 0} as const;
export const ADJUST_STATS_COST = 10 * BP_SCALE;

export const STARTER_ITEM_GROUPS: Array<{id: StarterItemGroup; name: string}> = [
  {id: "battle", name: "战斗道具"},
  {id: "recovery", name: "恢复道具"},
  {id: "berry", name: "树果"},
  {id: "tm", name: "技能机器"},
];

const STARTER_ITEM_UPGRADE_NAMES: Record<StarterItemGroup, {quality: string; quantity: string}> = {
  battle: {quality: "器械鉴定", quantity: "战术货架"},
  recovery: {quality: "良药甄选", quantity: "急救药箱"},
  berry: {quality: "果香识货", quantity: "丰收果篮"},
  tm: {quality: "招式精读", quantity: "备课讲义"},
};

export const STARTER_UPGRADE_IDS = [
  ...STARTER_ITEM_GROUPS.flatMap(group => [`item_quality:${group.id}`, `item_quantity:${group.id}`]),
  "pokemon_reroll",
  "pokemon_single_reroll",
] as const;

const TALENT_DEFINITIONS: TalentView[] = [
  {id: "starter_angel_fund", name: "天使基金", category: "开局筹备", cost: 20, desc: "开局获得 1000 金币，提前获得第一轮运营空间；剩余启动资金不会在结算时折算为 BP。"},
  {id: "starter_mentor_eye", name: "伯乐本乐", category: "开局筹备", cost: 25, desc: "开局选中的每只宝可梦有 33% 概率升 1 阶，仅限数值模板，最高 4 阶。"},
  {id: "starter_bag_expansion", name: "扩容背包", category: "开局筹备", cost: 20, desc: "开局道具每一类最多可以选择 2 个。"},
  {id: "starter_soulmate", name: "灵魂伴侣", category: "开局筹备", cost: 30, desc: "后续用于从上一局队伍和最后一场敌方队伍中追加回忆候选。"},
  {id: "exchange_trust", name: "不负信赖", category: "交换筑队", cost: 20, desc: "每场结束后可选择队内 1 只宝可梦提升 2 级，最高 55 级；溢出等级转为金币。"},
  {id: "exchange_gym_recognition", name: "馆主认可", category: "交换筑队", cost: 15, desc: "馆主和四天王宝可梦不再受默认只能交换 1 只的限制。"},
  {id: "exchange_careful", name: "爱护有加", category: "交换筑队", cost: 8, desc: "交换获得的宝可梦满 HP、满 PP 加入，并获取目标身上的道具。"},
  {id: "exchange_elite_training", name: "英才教育", category: "交换筑队", cost: 12, desc: "交换来的宝可梦品质更高；只改变阶级数值，不改变技能、特性和道具。"},
  {id: "exchange_stalwart", name: "坚毅不倒", category: "交换筑队", cost: 20, desc: "每场胜利后，队内存活宝可梦恢复一半最大 HP，濒死宝可梦恢复到 1/4 最大 HP。"},
  {id: "exchange_factory_freedom", name: "工厂自由", category: "交换筑队", cost: 40, desc: "所有交换免费，但不解除 Boss 交换次数限制。"},
  {id: "intel_rumor", name: "小道消息", category: "情报规划", cost: 30, desc: "休整时可查看本局训练师顺序，并逐步揭示他们的阵容。"},
  {id: "intel_god_eye", name: "上帝之眼", category: "情报规划", cost: 8, desc: "对战时显示技能打击效果，允许查看图鉴，并显示个体值和努力值。"},
  {id: "intel_reroute", name: "公子驾到", category: "情报规划", cost: 25, desc: "休整时可强行更换一个未挑战的同等级对手，每局最多 3 次。"},
  {id: "intel_named_challenge", name: "指名挑战", category: "情报规划", cost: 25, desc: "开局前指定本局冠军路线的最终 Boss；只在最终战为冠军时生效。"},
  {id: "growth_risky", name: "铤而走险", category: "养成改造", cost: 12, desc: "局内金币花费和休整页消耗道具可能出现更好或更坏的结果。"},
  {id: "growth_more_choices", name: "顺手牵羊", category: "养成改造", cost: 10, desc: "商店老虎机、商店候选池和技能随机候选给出更多选择。"},
  {id: "growth_fate", name: "时也命也", category: "养成改造", cost: 12, desc: "重置数值时可能免费，也可能付出更高代价。"},
  {id: "growth_vip_guest", name: "座上贵宾", category: "养成改造", cost: 20, desc: "每次休整获得额外免费商店抽奖机会，后续付费抽奖变贵。"},
  {id: "growth_all_in", name: "孤注一掷", category: "养成改造", cost: 50, desc: "每局限一次，生成一只 4 阶宝可梦用于交换；胜利后触发金币翻倍奖励。"},
  {id: "growth_lead_change", name: "临阵换将", category: "养成改造", cost: 8, desc: "允许在休整页更换首发宝可梦。"},
  {id: "economy_bp_exchange", name: "有借有换", category: "经济运营", cost: 10, desc: "对局中可按 1BP => 50金币兑换救急资金。"},
  {id: "economy_recycle_receipt", name: "回收票据", category: "经济运营", cost: 15, desc: "挑战结束时，根据道具出售与背包返还经营额追加 15% 金币收益。"},
  {id: "economy_portfolio", name: "投资组合", category: "经济运营", cost: 20, desc: "通关结算时，按本局金币消费覆盖类型返利；每类 200 金币。"},
  {id: "economy_amulet_coin", name: "护符金币", category: "经济运营", cost: 35, desc: "所有正向金币入账获得 1.35 倍收益。"},
  {id: "economy_shiny_collector", name: "闪光收藏家", category: "经济运营", cost: 40, desc: "交换获得的宝可梦均为闪光，且闪光带来的金币加成提高。"},
  {id: "economy_bargainer", name: "讲价高手", category: "经济运营", cost: 20, desc: "道具回收商奇遇出现时，出售道具获得 75% 原价。"},
  {id: "economy_premium_guest", name: "贵客专属", category: "经济运营", cost: 25, desc: "结束时自动处理剩余道具；通关或中断返还效率从 25% 提高到 50%，失败时从 10% 提高到 20%。"},
];

export const TALENTS: TalentView[] = TALENT_DEFINITIONS;

type StarNodeCategory = "星核" | "开局筹备" | "整备器械" | "情报规划" | "交换筑队" | "养成改造" | "经济运营" | "奇遇预留";
type StarChartNodeDefinition = TalentView & {
  category: StarNodeCategory;
  max_level: number;
  costs: number[];
  requires?: Array<{id: string; level?: number}>;
  effects: string[];
  kind: NonNullable<TalentView["kind"]>;
  x: number;
  y: number;
};

function talentNode(id: string, patch: Partial<StarChartNodeDefinition>): StarChartNodeDefinition {
  const talent = TALENT_DEFINITIONS.find(entry => entry.id === id);
  if (!talent) throw new Error(`Unknown talent node: ${id}`);
  return {
    ...talent,
    category: (patch.category || talent.category) as StarNodeCategory,
    max_level: patch.max_level || 1,
    costs: patch.costs || [Number(talent.cost || 0)],
    requires: patch.requires || [],
    effects: patch.effects || [talent.desc],
    kind: patch.kind || "talent",
    x: Number(patch.x || 0),
    y: Number(patch.y || 0),
    disabled: patch.disabled ?? talent.disabled,
  };
}

function prepNode(id: string, name: string, patch: Partial<StarChartNodeDefinition>): StarChartNodeDefinition {
  return {
    id,
    name,
    category: "整备器械",
    desc: patch.desc || "",
    max_level: patch.max_level || 1,
    costs: patch.costs || [0],
    requires: patch.requires || [],
    effects: patch.effects || [],
    kind: patch.kind || "starter_upgrade",
    x: Number(patch.x || 0),
    y: Number(patch.y || 0),
  };
}

export const STAR_CHART_NODES: StarChartNodeDefinition[] = [
  {
    id: "root_trainer_star",
    name: "训练家星核",
    category: "星核",
    desc: "所有路线的起点。",
    max_level: 1,
    costs: [0],
    requires: [],
    effects: ["星图起点，默认点亮。"],
    kind: "root",
    x: 0,
    y: 0,
  },

  talentNode("starter_angel_fund", {category: "开局筹备", max_level: 3, costs: [8, 12, 20], requires: [{id: "root_trainer_star"}], effects: ["Lv1：开局 300 金币。", "Lv2：开局 600 金币。", "Lv3：开局 1000 金币，启动资金不参与结算折算。"], x: -230, y: -110}),
  talentNode("starter_mentor_eye", {category: "开局筹备", max_level: 3, costs: [10, 15, 25], requires: [{id: "starter_angel_fund"}], effects: ["Lv1：选中宝可梦 15% 概率数值升 1 阶。", "Lv2：概率提高到 25%。", "Lv3：概率提高到 33%。"], x: -390, y: -165}),
  talentNode("starter_bag_expansion", {category: "开局筹备", costs: [20], requires: [{id: "starter_angel_fund"}], x: -390, y: -65}),
  talentNode("starter_soulmate", {category: "开局筹备", costs: [30], requires: [{id: "starter_mentor_eye", level: 2}], x: -545, y: -205}),

  prepNode("item_quantity:battle", "战术货架", {max_level: 4, costs: [5, 10, 20, 35], requires: [{id: "root_trainer_star"}], effects: ["提高战斗道具开局候选数量。"], x: -60, y: -170}),
  prepNode("item_quality:battle", "器械鉴定", {max_level: 4, costs: [0, 5, 10, 20], requires: [{id: "item_quantity:battle", level: 2}], effects: ["提高战斗道具开局质量。"], x: -120, y: -305}),
  prepNode("item_quantity:recovery", "急救药箱", {max_level: 4, costs: [5, 10, 20, 35], requires: [{id: "root_trainer_star"}], effects: ["提高恢复道具开局候选数量。"], x: 50, y: -185}),
  prepNode("item_quality:recovery", "良药甄选", {max_level: 4, costs: [0, 5, 10, 20], requires: [{id: "item_quantity:recovery", level: 2}], effects: ["提高恢复道具开局质量。"], x: 90, y: -320}),
  prepNode("item_quantity:berry", "丰收果篮", {max_level: 4, costs: [5, 10, 20, 35], requires: [{id: "item_quantity:recovery", level: 2}], effects: ["提高树果开局候选数量。"], x: 180, y: -250}),
  prepNode("item_quality:berry", "果香识货", {max_level: 4, costs: [0, 5, 10, 20], requires: [{id: "item_quantity:berry", level: 2}], effects: ["提高树果开局质量。"], x: 280, y: -350}),
  prepNode("item_quantity:tm", "备课讲义", {max_level: 4, costs: [5, 10, 20, 35], requires: [{id: "item_quantity:battle", level: 2}], effects: ["提高技能机器开局候选数量。"], x: -215, y: -255}),
  prepNode("item_quality:tm", "招式精读", {max_level: 4, costs: [0, 5, 10, 20], requires: [{id: "item_quantity:tm", level: 2}], effects: ["提高技能机器开局质量。"], x: -335, y: -345}),
  prepNode("pokemon_reroll", "牌有问题", {max_level: 4, costs: [3, 6, 10, 15], requires: [{id: "root_trainer_star"}], effects: ["增加整体重换开局候选宝可梦的次数。"], x: 0, y: -370}),
  prepNode("pokemon_single_reroll", "我要发功", {max_level: 4, costs: [5, 10, 20, 35], requires: [{id: "pokemon_reroll", level: 2}], effects: ["增加单独重随一只开局宝可梦的次数。"], x: 0, y: -520}),

  talentNode("intel_rumor", {category: "情报规划", max_level: 3, costs: [10, 20, 30], requires: [{id: "root_trainer_star"}], effects: ["Lv1：拥有进度图，可以看到 7 个 NPC 顺序。", "Lv2：免费查看 7 个 NPC 每人 1 只宝可梦，不保证首发。", "Lv3：可花 50 金币解锁指定 NPC 的 3 只宝可梦。"], x: 215, y: -105}),
  talentNode("intel_god_eye", {category: "情报规划", max_level: 3, costs: [8, 12, 18], requires: [{id: "root_trainer_star"}], effects: ["Lv1：战斗显示克制与图鉴入口。", "Lv2：显示个体值、努力值和训练信息。", "Lv3：开局选人直接显示完整训练信息，替代验牌。"], x: 270, y: -10}),
  talentNode("intel_reroute", {category: "情报规划", costs: [25], requires: [{id: "intel_rumor"}], x: 385, y: -135}),
  talentNode("intel_named_challenge", {category: "奇遇预留", costs: [25], requires: [{id: "intel_rumor", level: 2}], effects: ["后续奇遇池：指定本局冠军路线最终 Boss。"], kind: "event_preview", disabled: true, x: 525, y: -185}),

  talentNode("exchange_careful", {category: "交换筑队", costs: [8], requires: [{id: "root_trainer_star"}], x: -210, y: 115}),
  talentNode("exchange_elite_training", {category: "交换筑队", costs: [12], requires: [{id: "exchange_careful"}], x: -365, y: 75}),
  talentNode("exchange_stalwart", {category: "交换筑队", costs: [20], requires: [{id: "exchange_careful"}], x: -365, y: 175}),
  talentNode("exchange_gym_recognition", {category: "交换筑队", costs: [15], requires: [{id: "exchange_elite_training"}], x: -520, y: 45}),
  talentNode("exchange_factory_freedom", {category: "交换筑队", costs: [40], requires: [{id: "exchange_stalwart"}], x: -535, y: 210}),

  talentNode("exchange_trust", {category: "养成改造", max_level: 3, costs: [10, 16, 24], requires: [{id: "root_trainer_star"}], effects: ["Lv1：每场培养 1 只宝可梦 +1 级。", "Lv2：每场培养 1 只宝可梦 +2 级。", "Lv3：每场培养 1 只宝可梦 +4 级。溢出每级补偿 50 金币。"], x: -95, y: 185}),
  talentNode("growth_more_choices", {category: "养成改造", max_level: 4, costs: [10, 15, 20, 30], requires: [{id: "root_trainer_star"}], effects: ["Lv1：商店额外 +1 空位，技能候选额外 +2。", "Lv2：商店额外 +2 空位，技能候选额外 +4。", "Lv3：商店额外 +3 空位，技能候选额外 +8。", "Lv4：商店额外 +4 空位，技能候选额外 +16。"], x: 90, y: 185}),
  talentNode("growth_all_in", {category: "养成改造", costs: [50], requires: [{id: "growth_more_choices", level: 2}], x: -265, y: 405}),
  talentNode("growth_lead_change", {category: "养成改造", costs: [8], requires: [{id: "exchange_trust"}], x: -115, y: 335}),
  talentNode("growth_risky", {category: "奇遇预留", costs: [12], requires: [{id: "growth_more_choices"}], effects: ["后续随机 Buff 事件：休整消费高波动。"], kind: "event_preview", disabled: true, x: -65, y: 485}),
  talentNode("growth_fate", {category: "奇遇预留", costs: [12], requires: [{id: "growth_more_choices"}], effects: ["后续随机 Buff 事件：数值重置命运事件。"], kind: "event_preview", disabled: true, x: 85, y: 470}),
  talentNode("growth_vip_guest", {category: "奇遇预留", costs: [20], requires: [{id: "growth_more_choices"}], effects: ["后续随机 Buff 事件：商店贵宾事件。"], kind: "event_preview", disabled: true, x: -185, y: 545}),

  {
    id: "badge_level_cap",
    name: "徽章权限",
    category: "养成改造",
    desc: "提高可控制和到手宝可梦等级上限。",
    max_level: 2,
    costs: [12, 22],
    requires: [{id: "root_trainer_star"}],
    effects: ["Lv1：只能控制 50 级以下宝可梦；交换/到手宝可梦等级上限 50。", "Lv2：只能控制 55 级以下宝可梦；交换/到手宝可梦等级上限 55。"],
    kind: "badge",
    x: -245,
    y: 210,
  },

  talentNode("economy_bp_exchange", {category: "经济运营", max_level: 3, costs: [10, 16, 24], requires: [{id: "root_trainer_star"}], x: 205, y: 115}),
  talentNode("economy_recycle_receipt", {category: "经济运营", costs: [15], requires: [{id: "economy_bp_exchange"}], x: 355, y: 70}),
  talentNode("economy_portfolio", {category: "经济运营", costs: [20], requires: [{id: "economy_bp_exchange"}], x: 360, y: 175}),
  talentNode("economy_amulet_coin", {category: "经济运营", max_level: 3, costs: [12, 22, 35], requires: [{id: "economy_recycle_receipt"}], effects: ["Lv1：正向金币入账 1.1 倍。", "Lv2：正向金币入账 1.2 倍。", "Lv3：正向金币入账 1.35 倍。"], x: 515, y: 35}),
  talentNode("economy_shiny_collector", {category: "经济运营", costs: [40], requires: [{id: "economy_amulet_coin", level: 2}], x: 670, y: -10}),
  talentNode("economy_bargainer", {category: "经济运营", costs: [20], requires: [{id: "economy_portfolio"}], x: 520, y: 205}),
  talentNode("economy_premium_guest", {category: "经济运营", max_level: 3, costs: [10, 18, 25], requires: [{id: "economy_bargainer"}], effects: ["Lv1：背包返还效率小幅提高。", "Lv2：背包返还效率中幅提高。", "Lv3：通关/中断 50%，失败 20%。"], x: 670, y: 250}),
];

export const STAR_CHART_NODE_BY_ID = new Map(STAR_CHART_NODES.map(node => [node.id, node]));

export function normalizeStarChart(input?: StarChartState | null, legacyTalentIds: string[] = [], starterUpgrades?: StarterUpgradeState | null): StarChartState {
  const nodes: Record<string, number> = {};
  const starter = normalizeStarterUpgrades(starterUpgrades);
  const hasExplicitChart = Boolean(input?.nodes);
  nodes.root_trainer_star = 1;
  for (const [id, rawLevel] of Object.entries(input?.nodes || {})) {
    const node = STAR_CHART_NODE_BY_ID.get(id);
    if (!node) continue;
    nodes[id] = Math.max(0, Math.min(node.max_level, Math.floor(Number(rawLevel || 0))));
  }
  if (!hasExplicitChart) {
    for (const id of legacyTalentIds || []) {
      const node = STAR_CHART_NODE_BY_ID.get(id);
      if (node && node.kind !== "event_preview") nodes[id] = Math.max(nodes[id] || 0, 1);
    }
    for (const group of STARTER_ITEM_GROUPS) {
      nodes[`item_quality:${group.id}`] = Math.max(nodes[`item_quality:${group.id}`] || 0, Number(starter.item_quality?.[group.id] || 1));
      nodes[`item_quantity:${group.id}`] = Math.max(nodes[`item_quantity:${group.id}`] || 0, Number(starter.item_quantity?.[group.id] || 2));
    }
    nodes.pokemon_reroll = Math.max(nodes.pokemon_reroll || 0, Number(starter.pokemon_reroll || 0));
    nodes.pokemon_single_reroll = Math.max(nodes.pokemon_single_reroll || 0, Number(starter.pokemon_single_reroll || 0));
    const inspect = Number(starter.pokemon_inspect || 0);
    if (inspect >= 6) nodes.intel_god_eye = Math.max(nodes.intel_god_eye || 0, 3);
    else if (inspect >= 3) nodes.intel_god_eye = Math.max(nodes.intel_god_eye || 0, 2);
    else if (inspect >= 1) nodes.intel_god_eye = Math.max(nodes.intel_god_eye || 0, 1);
  }
  for (const node of STAR_CHART_NODES) {
    nodes[node.id] = Math.max(0, Math.min(node.max_level, Math.floor(Number(nodes[node.id] || 0))));
  }
  nodes.root_trainer_star = 1;
  return {nodes};
}

export function starNodeLevel(chart: StarChartState | undefined | null, id: string): number {
  const node = STAR_CHART_NODE_BY_ID.get(id);
  if (!node) return 0;
  return Math.max(0, Math.min(node.max_level, Math.floor(Number(chart?.nodes?.[id] || 0))));
}

export function starNodeUnlocked(chart: StarChartState | undefined | null, node: Pick<StarChartNodeDefinition, "requires">): boolean {
  return (node.requires || []).every(requirement => starNodeLevel(chart, requirement.id) >= Math.max(1, Number(requirement.level || 1)));
}

export function starNodeUpgradeCost(chart: StarChartState | undefined | null, id: string): number | null {
  const node = STAR_CHART_NODE_BY_ID.get(id);
  if (!node || node.disabled || node.kind === "event_preview" || node.kind === "root") return null;
  const level = starNodeLevel(chart, id);
  if (level >= node.max_level) return null;
  return node.costs[level] ?? node.costs[node.costs.length - 1] ?? null;
}

export function starChartCatalog(chart?: StarChartState | null): TalentView[] {
  return STAR_CHART_NODES.filter(node => node.kind !== "event_preview").map(node => ({
    ...node,
    level: starNodeLevel(chart, node.id),
    disabled: Boolean(node.disabled),
  }));
}

export function activeTalentIdsForStarChart(chart?: StarChartState | null): string[] {
  return STAR_CHART_NODES
    .filter(node => (node.kind === "talent" || node.kind === "badge") && starNodeLevel(chart, node.id) > 0)
    .map(node => node.id);
}

export function talentsForStarChart(chart?: StarChartState | null): TalentView[] {
  const normalized = normalizeStarChart(chart);
  return activeTalentIdsForStarChart(normalized).map(id => {
    const node = STAR_CHART_NODE_BY_ID.get(id);
    const talent = TALENT_DEFINITIONS.find(entry => entry.id === id) || node;
    if (!talent) throw new Error(`Unknown star chart active node: ${id}`);
    return {...talent, category: node?.category || talent.category, level: starNodeLevel(normalized, id), max_level: node?.max_level || 1};
  });
}

export function starterUpgradesForStarChart(chart?: StarChartState | null): StarterUpgradeState {
  const normalized = normalizeStarChart(chart);
  const itemQuality: Partial<Record<StarterItemGroup, number>> = {};
  const itemQuantity: Partial<Record<StarterItemGroup, number>> = {};
  for (const group of STARTER_ITEM_GROUPS) {
    itemQuality[group.id] = Math.max(1, starNodeLevel(normalized, `item_quality:${group.id}`) || 1);
    itemQuantity[group.id] = Math.max(STARTER_ITEM_DEFAULT_QUANTITY_LEVEL, starNodeLevel(normalized, `item_quantity:${group.id}`) || STARTER_ITEM_DEFAULT_QUANTITY_LEVEL);
  }
  return {
    item_quality: itemQuality,
    item_quantity: itemQuantity,
    pokemon_reroll: starNodeLevel(normalized, "pokemon_reroll"),
    pokemon_inspect: 0,
    pokemon_single_reroll: starNodeLevel(normalized, "pokemon_single_reroll"),
  };
}

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

export function currentCoins(run: CurrentRunData | null | undefined): number {
  return Math.max(0, Math.floor(Number(run?.coins || 0)));
}

export function addCoins(run: CurrentRunData, amount: number): number {
  const gained = Math.max(0, Math.floor(Number(amount || 0)));
  run.coins = currentCoins(run) + gained;
  return gained;
}

export function spendCoins(run: CurrentRunData, cost: number): void {
  const normalizedCost = Math.max(0, Math.floor(Number(cost || 0)));
  if (currentCoins(run) < normalizedCost) throw new Error(`金币不足，需要 ${normalizedCost}金币。`);
  const locked = Math.max(0, Math.floor(Number(run.non_convertible_coins || 0)));
  run.non_convertible_coins = Math.max(0, locked - normalizedCost);
  run.coins = currentCoins(run) - normalizedCost;
}

export function coinsToBp(coins: number): number {
  return Math.floor(Math.max(0, Number(coins || 0)) / COINS_PER_BP);
}

export function starterCoinsForSeed(seed: number, talents: TalentView[] = []): number {
  void seed;
  return STARTER_COINS_DEFAULT + starterNonConvertibleCoinsForTalents(talents);
}

export function starterNonConvertibleCoinsForTalents(talents: TalentView[] = []): number {
  const level = talentLevel(talents, "starter_angel_fund");
  if (level >= 3) return STARTER_ANGEL_FUND_COINS;
  if (level === 2) return 600;
  if (level === 1) return 300;
  return 0;
}

export function convertibleCoinsForSettlement(run: CurrentRunData): {convertibleCoins: number; excludedCoins: number} {
  const coins = currentCoins(run);
  const excludedCoins = Math.min(coins, Math.max(0, Math.floor(Number(run.non_convertible_coins || 0))));
  return {convertibleCoins: Math.max(0, coins - excludedCoins), excludedCoins};
}

export function normalizeStarterUpgrades(upgrades?: StarterUpgradeState | null): StarterUpgradeState {
  const itemQuality: Partial<Record<StarterItemGroup, number>> = {};
  const itemQuantity: Partial<Record<StarterItemGroup, number>> = {};
  for (const group of STARTER_ITEM_GROUPS) {
    itemQuality[group.id] = Math.max(1, Math.min(STARTER_ITEM_MAX_LEVEL, Math.floor(Number(upgrades?.item_quality?.[group.id] ?? STARTER_ITEM_DEFAULT_QUALITY_LEVEL))));
    itemQuantity[group.id] = Math.max(STARTER_ITEM_DEFAULT_QUANTITY_LEVEL, Math.min(STARTER_ITEM_MAX_LEVEL, Math.floor(Number(upgrades?.item_quantity?.[group.id] ?? STARTER_ITEM_DEFAULT_QUANTITY_LEVEL))));
  }
  return {
    item_quality: itemQuality,
    item_quantity: itemQuantity,
    pokemon_reroll: Math.max(0, Math.min(STARTER_ITEM_MAX_LEVEL, Math.floor(Number(upgrades?.pokemon_reroll || 0)))),
    pokemon_inspect: Math.max(0, Math.min(STARTER_POKEMON_INSPECT_MAX_LEVEL, Math.floor(Number(upgrades?.pokemon_inspect || 0)))),
    pokemon_single_reroll: Math.max(0, Math.min(STARTER_ITEM_MAX_LEVEL, Math.floor(Number(upgrades?.pokemon_single_reroll || 0)))),
  };
}

export function starterUpgradeLevel(upgrades: StarterUpgradeState | undefined | null, id: string): number {
  const normalized = normalizeStarterUpgrades(upgrades);
  const [kind, groupRaw] = id.split(":");
  const group = groupRaw as StarterItemGroup | undefined;
  if (kind === "item_quality" && group) return Number(normalized.item_quality?.[group] || 1);
  if (kind === "item_quantity" && group) return Number(normalized.item_quantity?.[group] || 0);
  if (id === "pokemon_reroll") return Number(normalized.pokemon_reroll || 0);
  if (id === "pokemon_inspect") return Number(normalized.pokemon_inspect || 0);
  if (id === "pokemon_single_reroll") return Number(normalized.pokemon_single_reroll || 0);
  return 0;
}

export function starterUpgradeMaxLevel(id: string): number {
  if (id === "pokemon_inspect") return STARTER_POKEMON_INSPECT_MAX_LEVEL;
  return STARTER_ITEM_MAX_LEVEL;
}

export function starterUpgradeCost(id: string, currentLevel: number): number | null {
  const maxLevel = starterUpgradeMaxLevel(id);
  const level = Math.max(0, Math.floor(Number(currentLevel || 0)));
  if (level >= maxLevel) return null;
  if (id.startsWith("item_quality:")) return [0, 5, 10, 20][level] ?? 20;
  if (id.startsWith("item_quantity:")) return [5, 10, 20, 35][level] ?? 35;
  if (id === "pokemon_reroll") return [3, 6, 10, 15][level] ?? 15;
  if (id === "pokemon_inspect") return [2, 3, 5, 8, 12, 18][level] ?? 18;
  if (id === "pokemon_single_reroll") return [5, 10, 20, 35][level] ?? 35;
  return null;
}

export function starterUpgradeCatalog(upgrades?: StarterUpgradeState | null): StarterUpgradeView[] {
  const normalized = normalizeStarterUpgrades(upgrades);
  const itemRows = STARTER_ITEM_GROUPS.flatMap(group => {
    const qualityId = `item_quality:${group.id}`;
    const quantityId = `item_quantity:${group.id}`;
    const qualityLevel = starterUpgradeLevel(normalized, qualityId);
    const quantityLevel = starterUpgradeLevel(normalized, quantityId);
    const rows: StarterUpgradeView[] = [
      {
        id: quantityId,
        name: STARTER_ITEM_UPGRADE_NAMES[group.id].quantity,
        group: "道具数量" as const,
        desc: `每级增加 1 个${group.name}候选；每类最多免费带走 1 个。`,
        level: quantityLevel,
        max_level: STARTER_ITEM_MAX_LEVEL,
        cost: starterUpgradeCost(quantityId, quantityLevel),
      },
    ];
    if (quantityLevel > 0) {
      rows.push(
        {
          id: qualityId,
          name: STARTER_ITEM_UPGRADE_NAMES[group.id].quality,
          group: "道具质量" as const,
          desc: `限制并提高${group.name}的可出现等级。当前最高可出 ${qualityLevel} 级。`,
          level: qualityLevel,
          max_level: STARTER_ITEM_MAX_LEVEL,
          cost: starterUpgradeCost(qualityId, qualityLevel),
        },
      );
    }
    return rows;
  });
  const pokemonRows: StarterUpgradeView[] = [
    {
      id: "pokemon_reroll",
      name: "牌有问题",
      group: "开局选牌",
      desc: "增加整体重换开局候选宝可梦的次数。",
      level: starterUpgradeLevel(normalized, "pokemon_reroll"),
      max_level: STARTER_ITEM_MAX_LEVEL,
      cost: starterUpgradeCost("pokemon_reroll", starterUpgradeLevel(normalized, "pokemon_reroll")),
    },
    {
      id: "pokemon_single_reroll",
      name: "我要发功",
      group: "开局选牌",
      desc: "增加单独重随一只开局宝可梦的次数。",
      level: starterUpgradeLevel(normalized, "pokemon_single_reroll"),
      max_level: STARTER_ITEM_MAX_LEVEL,
      cost: starterUpgradeCost("pokemon_single_reroll", starterUpgradeLevel(normalized, "pokemon_single_reroll")),
    },
  ];
  return [...itemRows, ...pokemonRows];
}

export function hasTalent(talents: TalentView[] | undefined, id: string): boolean {
  return talentLevel(talents, id) > 0;
}

export function talentLevel(talents: TalentView[] | undefined, id: string): number {
  const found = (talents || []).find(talent => talent.id === id);
  return found ? Math.max(1, Math.floor(Number(found.level || 1))) : 0;
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
  if (shinyCount > 0) total *= Math.pow(hasTalent(run?.talents, "economy_shiny_collector") ? 1.3 : 1.1, shinyCount);
  const amuletLevel = talentLevel(run?.talents, "economy_amulet_coin");
  if (amuletLevel > 0) total *= amuletLevel >= 3 ? 1.35 : amuletLevel === 2 ? 1.2 : 1.1;
  return Math.floor(total);
}

export function addRunBp(save: LocalSave, run: CurrentRunData | null | undefined, amount: number): number {
  void save;
  const gained = gainedBp(run, amount);
  if (run) addCoins(run, gained);
  return gained;
}

export function clearBonus(save: LocalSave, run?: CurrentRunData): {setStreak: number; bonus: number} {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  const setStreak = Number(save.stats.set_win_streak || 0) + 1;
  save.stats.set_win_streak = setStreak;
  save.stats.best_set_win_streak = Math.max(Number(save.stats.best_set_win_streak || 0), setStreak);
  const bonus = gainedBp(run, (setStreak * 2 + 7) * BP_SCALE);
  if (run) addCoins(run, bonus);
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
  return hasTalent(run.talents, "exchange_careful");
}

export function exchangeFullState(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "exchange_careful");
}

export function exchangeStateRatio(run: CurrentRunData): number {
  if (exchangeFullState(run)) return 1;
  return hasTalent(run.talents, "exchange_careful") ? EXCHANGE_CAREFUL_RATIO : 0.5;
}

export function candidateCountForTalents(talents: TalentView[] | undefined): number {
  void talents;
  return 6;
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

export function pricedForShop(item: ShopItem, talents: TalentView[] | undefined): number {
  const baseCost = Math.max(0, Number(item.cost || 5 * BP_SCALE));
  void talents;
  return baseCost;
}

export function pricedForRun(run: CurrentRunData | null | undefined, cost: number): number {
  const baseCost = Math.max(0, Math.floor(Number(cost || 0)));
  void run;
  return baseCost;
}

export function shopOfferCount(run: CurrentRunData): number {
  return SHOP_OFFER_COUNT + Math.max(0, Math.min(4, talentLevel(run.talents, "growth_more_choices")));
}

export function shopCandidateCount(run: CurrentRunData): number {
  return SHOP_CANDIDATE_COUNT + Math.max(0, Math.min(4, talentLevel(run.talents, "growth_more_choices")));
}

export function isPremiumHeldShopEntry(entry: {kind?: string; category?: ItemCategory; cost?: number}, isSpecialBattleItem = false): boolean {
  return entry.kind === "item" && entry.category === "held" && !isSpecialBattleItem && Math.max(0, Number(entry.cost || 0)) >= PREMIUM_HELD_ITEM_MIN_COST;
}

export function premiumMachineMoveCandidates<T extends {id?: string; name?: string; power?: number; learn_sources?: string[]}>(moves: T[], limit = Number.POSITIVE_INFINITY): T[] {
  const machineMoves = moves
    .filter(move => (move.learn_sources || []).includes("machine"))
    .sort((a, b) => Number(b.power || 0) - Number(a.power || 0) || String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")));
  const highPower = machineMoves.filter(move => Number(move.power || 0) >= PREMIUM_TM_MIN_POWER);
  if (highPower.length) return highPower.slice(0, limit);
  const maxPower = Number(machineMoves[0]?.power || 0);
  return machineMoves.filter(move => Number(move.power || 0) === maxPower).slice(0, limit);
}

export function shopNextRollCost(run: CurrentRunData): number {
  if (Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0) return 0;
  if (hasTalent(run.talents, "growth_vip_guest")) {
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
  const level = Math.max(0, Math.min(4, talentLevel(run.talents, "growth_more_choices")));
  return MOVE_DRAW_COUNT + (level ? Math.pow(2, level) : 0);
}

export function moveDrawCost(run: CurrentRunData): number {
  return MOVE_DRAW_COST;
}

export function statResetCost(run: CurrentRunData, baseCost: number, part: string, roll?: number): number {
  if (!hasTalent(run.talents, "growth_fate")) return baseCost;
  const chance = roll ?? seededRng(Number(run.seed || 1), 0xf3ee + Number(run.battle_no || run.next_battle || 0) * 41 + toId(part).length * 67 + Date.now())();
  if (chance < 0.6) return 0;
  if (chance < 0.9) return baseCost * 2;
  return baseCost;
}

export function sellPriceForItem(item: Pick<ShopItem, "cost">, run: CurrentRunData): number {
  const base = Math.max(0, Number(item.cost || 0));
  if (hasTalent(run.talents, "economy_bargainer")) return Math.floor(base * 0.75);
  return Math.floor(base / 2);
}

export function portfolioSpendTypeForLabel(label: string): string | null {
  const key = toId(label);
  if (key.startsWith("exchange")) return "交换";
  if (key.startsWith("shop") || key.startsWith("buyitem")) return "商店";
  if (key.startsWith("drawmoves") || key.startsWith("adjustmove")) return "技能";
  if (key.startsWith("randomizestats") || key.startsWith("adjuststats")) return "数值";
  if (key.startsWith("scoutnext") || key.startsWith("nightsky")) return "情报";
  return null;
}

export function recordPortfolioSpend(run: CurrentRunData, label: string, paid: number): void {
  if (!hasTalent(run.talents, "economy_portfolio") || paid <= 0) return;
  const type = portfolioSpendTypeForLabel(label);
  if (!type) return;
  run.economy_spend_types = Array.from(new Set([...(run.economy_spend_types || []), type]));
}

export function portfolioBonus(run: CurrentRunData): {types: string[]; bonus: number} {
  const types = Array.from(new Set((run.economy_spend_types || []).filter(Boolean)));
  return {types, bonus: hasTalent(run.talents, "economy_portfolio") ? types.length * PORTFOLIO_BONUS_PER_TYPE : 0};
}

export function refundableBagBaseBpFromCosts(run: CurrentRunData, itemCosts: Record<string, number>, outcome: "normal" | "loss" = "normal"): number {
  const rate = bagRefundRate(run, outcome);
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

export function bagRefundRate(run: CurrentRunData, outcome: "normal" | "loss" = "normal"): number {
  const level = talentLevel(run.talents, "economy_premium_guest");
  if (outcome === "loss") return level >= 3 ? BAG_REFUND_RATE_LOSS_PREMIUM : level === 2 ? 0.16 : level === 1 ? 0.12 : BAG_REFUND_RATE_LOSS;
  return level >= 3 ? BAG_REFUND_RATE_PREMIUM : level === 2 ? 0.4 : level === 1 ? 0.3 : BAG_REFUND_RATE;
}

export function canScoutNext(run: CurrentRunData): boolean {
  return hasTalent(run.talents, "intel_rumor");
}

export function scoutCost(level: "basic" | "one" | "all"): number {
  return level === "all" ? SCOUT_ALL_COST : level === "one" ? SCOUT_ONE_COST : SCOUT_BASIC_COST;
}

export function canDirectMove(run: CurrentRunData): boolean {
  void run;
  return false;
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
