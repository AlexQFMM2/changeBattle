import type {BattleState, BattleTimelineEvent, CoinLedgerEntry, CurrentRunData, ItemCategory, LocalSave, PlayerPokemonState, RestEventStatusView, RestScoreBetState, RestScoreBetTarget, ResultPokemonStatEvent, RunQuestId, RunQuestState, ShopItem, ShopKind, ShopOffer, ShopState, StarChartState, StarterItemGroup, StarterUpgradeState, StarterUpgradeView, TalentView} from "@changebattle/shared";
import {REST_SHOP_DISCOUNT_COUPONS, REST_SHOP_DISCOUNT_RATE} from "@changebattle/shared";

export type RuntimeBattleAiLevel = "normal" | "gym_low" | "gym_high" | "elite4" | "champion";
export type RuntimeBattleAiKnowledge = "active_only" | "party_species" | "party_sets" | "omniscient";
export type RuntimeBattleAiPersonality = "balanced" | "aggressive" | "defensive" | "status" | "setup" | "adaptive" | "rookie" | "soul_sick";
export type RuntimeBattleAiProfile = {
  level: RuntimeBattleAiLevel;
  knowledge: RuntimeBattleAiKnowledge;
  personality: RuntimeBattleAiPersonality;
  depth: 0 | 1 | 2 | 3;
  randomness: number;
  allowSwitch: boolean;
  prediction: number;
  statusAwareness: number;
  setupAwareness: number;
  switchAwareness: number;
  candidateMoves: number;
  candidateSwitches: number;
  opponentCandidates: number;
  timeBudgetMs: number;
};
export type RuntimeBattleAiProfileInput = RuntimeBattleAiLevel | Partial<RuntimeBattleAiProfile>;
type RuntimeBattleAiProfileObject = Partial<RuntimeBattleAiProfile>;

export type RuntimeBattleAiProfileOutput = RuntimeBattleAiProfileInput;

type RuntimeBattleAiProfileReturn<T> = T extends RuntimeBattleAiLevel ? RuntimeBattleAiLevel | RuntimeBattleAiProfileObject : T | RuntimeBattleAiProfileObject;

type RuntimeBattleAiProfileObjectInput = {
  level?: RuntimeBattleAiLevel;
  knowledge?: RuntimeBattleAiKnowledge;
  personality?: RuntimeBattleAiPersonality;
  depth?: 0 | 1 | 2 | 3;
  randomness?: number;
  allowSwitch?: boolean;
  prediction?: number;
  statusAwareness?: number;
  setupAwareness?: number;
  switchAwareness?: number;
  candidateMoves?: number;
  candidateSwitches?: number;
  opponentCandidates?: number;
  timeBudgetMs?: number;
};

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
export const SOUL_SWAP_TURN_LIMIT = 30;
export const SCORE_BET_MIN_STAKE = 100;
export const SCORE_BET_MAX_STAKE = 1000;
export const SCORE_BET_DEFAULT_TARGET: RestScoreBetTarget = 3;
export const SCORE_BET_MULTIPLIERS: Record<RestScoreBetTarget, number> = {1: 1.5, 2: 2, 3: 5};
export const SCORE_BET_MULTIPLIER_OPTIONS = [1.5, 2, 3, 5] as const;
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
export const TRAINING_EV_BERRY_ITEM_IDS = ["pomegberry", "kelpsyberry", "qualotberry", "hondewberry", "grepaberry", "tamatoberry"] as const;
export const TRAINING_VITAMIN_ITEM_IDS = ["hpup", "protein", "iron", "calcium", "zinc", "carbos"] as const;
export const TRAINING_CAP_ITEM_IDS = ["bottlecap", "goldbottlecap"] as const;
export const TRAINING_CANDY_ITEM_IDS = ["rarecandy"] as const;
export const TRAINING_ITEM_IDS = [...TRAINING_EV_BERRY_ITEM_IDS, ...TRAINING_VITAMIN_ITEM_IDS, ...TRAINING_CAP_ITEM_IDS, ...TRAINING_CANDY_ITEM_IDS] as const;
export const TRAINING_ITEM_PRICES: Record<string, number> = {
  pomegberry: 15,
  kelpsyberry: 15,
  qualotberry: 15,
  hondewberry: 15,
  grepaberry: 15,
  tamatoberry: 15,
  hpup: 200,
  protein: 200,
  iron: 200,
  calcium: 200,
  zinc: 200,
  carbos: 200,
  bottlecap: 200,
  goldbottlecap: 600,
  rarecandy: 300,
};
const TM_ICON_TYPE_IDS = new Set(["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"]);
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

export type RunQuestDefinition = {
  id: RunQuestId;
  name: string;
  desc: string;
  detail: string;
  intro: string;
  effects: string[];
  target: number;
  expires_after_battles?: number;
  expires_after_rests?: number;
  reward_coins: number;
  reward_item?: string;
};

export const RUN_QUEST_DEFINITIONS: RunQuestDefinition[] = [
  {
    id: "ace_trial",
    name: "王牌试炼",
    desc: "3 场战斗内，同一只宝可梦击倒 5 只宝可梦。",
    detail: "从领取任务开始连续 3 场统计；同一只宝可梦累计击倒达到 5 即完成。",
    intro: "工厂裁判递来一张王牌挑战书：真正的核心成员，应该能在连续战斗里打出统治力。",
    effects: ["接下来 3 场战斗内，同一只宝可梦累计击倒 5 只宝可梦。", "完成奖励：500 金币与训练商店折扣券。"],
    target: 5,
    expires_after_battles: 3,
    reward_coins: 500,
    reward_item: "trainingcoupon",
  },
  {
    id: "winning_champion",
    name: "常胜冠军",
    desc: "连续赢下 3 场，且每场存活数量均大于等于 2。",
    detail: "只看领取后的连续 3 场；任一场失败或存活数不足 2，任务失败。",
    intro: "冠军奖杯的复制品摆在休整桌上。旁边的小字写着：胜利不只要赢，还要赢得漂亮。",
    effects: ["连续赢下 3 场战斗。", "每场结束时己方存活数量必须大于等于 2。", "完成奖励：500 金币与战斗道具商店折扣券。"],
    target: 3,
    expires_after_battles: 3,
    reward_coins: 500,
    reward_item: "battleitemcoupon",
  },
  {
    id: "type_expert",
    name: "属性专家",
    desc: "3 场战斗内，打出 8 次效果绝佳。",
    detail: "从领取任务开始连续 3 场累计效果绝佳次数。",
    intro: "属性讲师把一份弱点表推到你面前：知识本身没有伤害，但会让招式打得很疼。",
    effects: ["接下来 3 场战斗内，累计打出 8 次效果绝佳。", "完成奖励：500 金币与技能机器商店折扣券。"],
    target: 8,
    expires_after_battles: 3,
    reward_coins: 500,
    reward_item: "tmcoupon",
  },
  {
    id: "item_master",
    name: "药系天王",
    desc: "3 场战斗内，任意一场战斗中使用 5 次道具。",
    detail: "从领取任务开始连续 3 场统计；任意单场战斗道具使用次数达到 5 即完成。",
    intro: "补给员把药箱扣上，认真说：药也有战术，关键是你敢不敢在场上用。",
    effects: ["接下来 3 场战斗内，任意一场战斗中使用 5 次道具。", "完成奖励：500 金币与恢复商店折扣券。"],
    target: 5,
    expires_after_battles: 3,
    reward_coins: 500,
    reward_item: "recoverycoupon",
  },
  {
    id: "frugal_challenge",
    name: "节俭挑战",
    desc: "接下来 2 次休整花费均不超过 500 金币。",
    detail: "统计所有金币支出；任一次休整支出超过 500，任务失败。",
    intro: "财务员拍了拍账本：强大的训练师也要学会控制预算。",
    effects: ["接下来 2 次休整中，每次所有金币支出均不超过 500。", "完成奖励：1000 金币。"],
    target: 2,
    expires_after_rests: 2,
    reward_coins: 1000,
  },
];

export const RUN_QUEST_DEFINITION_BY_ID = Object.fromEntries(RUN_QUEST_DEFINITIONS.map(quest => [quest.id, quest])) as Record<RunQuestId, RunQuestDefinition>;

export function soulSwapEnemyAiProfile(): RuntimeBattleAiProfileObjectInput {
  return {
    level: "normal",
    personality: "soul_sick",
    depth: 0,
    randomness: 0.2,
    allowSwitch: false,
    prediction: 0,
    statusAwareness: 0.15,
    setupAwareness: 0.1,
    switchAwareness: 0,
    candidateMoves: 4,
    candidateSwitches: 0,
    opponentCandidates: 1,
    timeBudgetMs: 10,
  };
}

export function rookieNormalNpcAiProfile(): RuntimeBattleAiProfileObjectInput {
  return {
    level: "normal",
    knowledge: "party_species",
    personality: "rookie",
    depth: 0,
    randomness: 0.36,
    allowSwitch: true,
    prediction: 0.05,
    statusAwareness: 0.22,
    setupAwareness: 0.12,
    switchAwareness: 0.08,
    candidateMoves: 2,
    candidateSwitches: 1,
    opponentCandidates: 1,
    timeBudgetMs: 25,
  };
}

export function enemyAiProfileForRunRoute<T extends RuntimeBattleAiProfileInput>(run: CurrentRunData | null | undefined, routeType: string, fallback: T): RuntimeBattleAiProfileReturn<T> {
  if (routeType === "normal" && Number(run?.wins || 0) <= 0) return rookieNormalNpcAiProfile() as RuntimeBattleAiProfileReturn<T>;
  return fallback as RuntimeBattleAiProfileReturn<T>;
}

export function soulSwapAllowedForNextBattle(run: CurrentRunData | null | undefined): boolean {
  if (!run) return false;
  const battleNo = Math.max(1, Math.floor(Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1)));
  const planned = (run.planned_battles || []).find(entry => Number(entry.battle_no) === battleNo);
  if (planned?.route_type) return planned.route_type === "normal";
  return battleNo !== 3 && battleNo !== Math.max(1, Number(run.battles || DEFAULT_BATTLES));
}

export function shouldForceSoulSwapTimeout(run: CurrentRunData | null | undefined, state: BattleState | null | undefined): boolean {
  if (!run?.rest_status?.event_soul_swap_active || !state || state.ended) return false;
  return Number(state.tracker?.turn || 0) >= SOUL_SWAP_TURN_LIMIT;
}
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
  }
  if (!hasExplicitChart || starterUpgrades) {
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

export function fullStarChart(): StarChartState {
  return {
    nodes: Object.fromEntries(
      STAR_CHART_NODES
        .filter(node => !node.disabled && node.kind !== "event_preview")
        .map(node => [node.id, node.max_level]),
    ),
  };
}

export function enableTestModeForSave(save: LocalSave): LocalSave {
  const starChart = normalizeStarChart(fullStarChart());
  save.stats = {...emptyStats(), ...(save.stats || {}), battle_points: MAX_BP};
  save.star_chart = starChart;
  save.talent_unlocks = Array.from(new Set(talentsForStarChart(starChart).map(talent => talent.id)));
  save.starter_upgrades = starterUpgradesForStarChart(starChart);
  if (save.current_run) save.current_run.talents = talentsForStarChart(starChart);
  return save;
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
  return {battle_points: 0, battles: 0, wins: 0, losses: 0, pokemon_usage_counts: {}, win_rate: 0, set_win_streak: 0, best_set_win_streak: 0, rank_status: "未开放"};
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
  stats.pokemon_usage_counts = Object.fromEntries(Object.entries(stats.pokemon_usage_counts || {}).map(([id, count]) => [toId(id), Math.max(0, Math.floor(Number(count || 0)))]).filter(([id, count]) => Boolean(id && count)));
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

export function isTrainingShopItemId(itemId: string | undefined): boolean {
  const id = itemKey(itemId);
  return Boolean(id && (TRAINING_ITEM_IDS as readonly string[]).includes(id));
}

export function restShopDiscountCoupon(itemId: string | undefined): (typeof REST_SHOP_DISCOUNT_COUPONS)[string] | null {
  const id = itemKey(itemId);
  return id ? REST_SHOP_DISCOUNT_COUPONS[id] || null : null;
}

export function isRestShopDiscountCoupon(itemId: string | undefined): boolean {
  return Boolean(restShopDiscountCoupon(itemId));
}

export function isTaskRewardItemId(itemId: string | undefined): boolean {
  return isRestShopDiscountCoupon(itemId);
}

export function restShopKindDiscount(run: CurrentRunData | null | undefined, kind: ShopKind): number {
  const value = Number(run?.rest_status?.shop_kind_discounts?.[kind] || 1);
  return value > 0 && value < 1 ? value : 1;
}

export function applyRestShopKindDiscount(run: CurrentRunData | null | undefined, kind: ShopKind, cost: number): number {
  const base = Math.max(0, Math.floor(Number(cost || 0)));
  if (base <= 0) return 0;
  const discount = restShopKindDiscount(run, kind);
  if (discount >= 1) return base;
  return Math.max(1, Math.floor(base * discount));
}

export function applyRestShopDiscountCoupon(run: CurrentRunData, itemId: string, dryRun = false): string {
  const id = itemKey(itemId);
  const coupon = restShopDiscountCoupon(id);
  if (!coupon) throw new Error("这个道具不是商店折扣券。");
  if (Number(run.bag_items?.[id] || 0) <= 0) throw new Error("背包里没有这个道具。");
  const current = restShopKindDiscount(run, coupon.shopKind);
  if (current <= REST_SHOP_DISCOUNT_RATE) return `${coupon.name_zh}已生效，本次休整不会重复叠加。`;
  if (dryRun) return `${coupon.name_zh}可以使用。`;
  run.rest_status = {
    ...(run.rest_status || {}),
    shop_kind_discounts: {
      ...(run.rest_status?.shop_kind_discounts || {}),
      [coupon.shopKind]: REST_SHOP_DISCOUNT_RATE,
    },
  };
  run.bag_items = {...(run.bag_items || {}), [id]: Math.max(0, Number(run.bag_items?.[id] || 0) - 1)};
  if (run.bag_items[id] <= 0) {
    delete run.bag_items[id];
    if (run.bag_item_meta) delete run.bag_item_meta[id];
  }
  return `${coupon.name_zh}已使用：本次休整${coupon.shopKind === "training" ? "训练商店" : coupon.shopKind === "held" ? "道具商店" : coupon.shopKind === "tm" ? "技能商店" : "回复商店"}抽奖和购买 5 折。`;
}

function questDefinitionFor(id: string | undefined): RunQuestDefinition {
  const quest = RUN_QUEST_DEFINITION_BY_ID[id as RunQuestId];
  if (!quest) throw new Error(`未知任务：${id || ""}`);
  return quest;
}

function questRewardItemName(itemId: string | undefined): string {
  const coupon = restShopDiscountCoupon(itemId);
  return coupon?.name_zh || itemId || "";
}

function grantQuestReward(run: CurrentRunData, quest: RunQuestDefinition): string {
  const rewards: string[] = [];
  if (quest.reward_coins > 0) {
    const gained = addCoins(run, quest.reward_coins, `quest:${quest.id}`, `${quest.name}奖励`);
    rewards.push(`${gained}金币`);
  }
  if (quest.reward_item) {
    const id = itemKey(quest.reward_item);
    run.bag_items = {...(run.bag_items || {}), [id]: Number(run.bag_items?.[id] || 0) + 1};
    const coupon = restShopDiscountCoupon(id);
    if (coupon) {
      run.bag_item_meta = {
        ...(run.bag_item_meta || {}),
        [id]: {
          id,
          name: coupon.name,
          name_zh: coupon.name_zh,
          desc: coupon.desc,
          desc_zh: coupon.desc_zh,
          icon_asset: coupon.icon_asset,
          category: "consumable",
          cost: 0,
        },
      };
    }
    rewards.push(questRewardItemName(id));
  }
  return `任务完成：${quest.name}，获得 ${rewards.join("、")}。`;
}

export function startRunQuest(run: CurrentRunData, questId: RunQuestId): string {
  if (run.active_quest) throw new Error(`已有进行中的任务：${run.active_quest.name}。`);
  const quest = questDefinitionFor(questId);
  const cursor = run.coin_ledger?.[0]?.id;
  run.active_quest = {
    id: quest.id,
    name: quest.name,
    desc: quest.desc,
    started_battle_no: Math.max(0, Math.floor(Number(run.battle_no || run.next_battle || 0))),
    expires_after_battles: quest.expires_after_battles,
    expires_after_rests: quest.expires_after_rests,
    progress: {
      value: 0,
      target: quest.target,
      battle_count: 0,
      rest_count: 0,
      kills_by_pokemon: quest.id === "ace_trial" ? {} : undefined,
      rest_ledger_cursor_id: quest.id === "frugal_challenge" ? cursor : undefined,
    },
  };
  return `任务已领取：${quest.name}。${quest.desc}`;
}

export function runQuestStatus(run: CurrentRunData | null | undefined, context: "rest" | "battle" = "rest"): RestEventStatusView | null {
  const quest = run?.active_quest;
  if (!quest) return null;
  const definition = questDefinitionFor(quest.id);
  const value = Math.max(0, Math.floor(Number(quest.progress.value || 0)));
  const target = Math.max(1, Math.floor(Number(quest.progress.target || definition.target || 1)));
  if (context === "battle" && quest.id === "frugal_challenge") return null;
  return {
    id: `quest:${quest.id}`,
    label: `${quest.name} ${Math.min(value, target)}/${target}`,
    detail: `${quest.desc} 奖励：${definition.reward_coins ? `${definition.reward_coins}金币` : ""}${definition.reward_item ? `${definition.reward_coins ? " + " : ""}${questRewardItemName(definition.reward_item)}` : ""}`,
    tone: "trade",
  };
}

export function runQuestRestSpendSinceCursor(run: CurrentRunData, cursorId: string | undefined): number {
  let total = 0;
  for (const entry of run.coin_ledger || []) {
    if (cursorId && entry.id === cursorId) break;
    if (entry.type === "spend") total += Math.max(0, Math.floor(Number(entry.amount || 0)));
  }
  return total;
}

function questFailureMessage(quest: RunQuestState): string {
  return `任务失败：${quest.name}。`;
}

function questProgressDone(run: CurrentRunData, quest: RunQuestState, definition: RunQuestDefinition): string | null {
  if (Math.max(0, Number(quest.progress.value || 0)) < definition.target) return null;
  const message = grantQuestReward(run, definition);
  delete run.active_quest;
  return message;
}

export function updateRunQuestAfterRest(run: CurrentRunData): string | null {
  const quest = run.active_quest;
  if (!quest || quest.id !== "frugal_challenge") return null;
  const definition = questDefinitionFor(quest.id);
  const spent = runQuestRestSpendSinceCursor(run, quest.progress.rest_ledger_cursor_id);
  if (spent > 500) {
    const message = questFailureMessage(quest);
    delete run.active_quest;
    return message;
  }
  const restCount = Math.max(0, Math.floor(Number(quest.progress.rest_count || 0))) + 1;
  quest.progress.rest_count = restCount;
  quest.progress.value = restCount;
  const completed = questProgressDone(run, quest, definition);
  if (completed) return completed;
  quest.progress.rest_ledger_cursor_id = run.coin_ledger?.[0]?.id;
  if (definition.expires_after_rests && restCount >= definition.expires_after_rests) {
    const message = questFailureMessage(quest);
    delete run.active_quest;
    return message;
  }
  return null;
}

function battleItemUsesForPlayer(timelineEvents: BattleTimelineEvent[], playerSide: "p1" | "p2" = "p1"): number {
  return (timelineEvents || []).filter(event => event.type === "item" && (event.side === playerSide || event.targetSide === playerSide)).length;
}

function superEffectiveCount(timelineEvents: BattleTimelineEvent[]): number {
  return (timelineEvents || []).filter(event => event.type === "effectiveness" && /效果拔群|super effective/i.test(`${event.text} ${event.effect || ""}`)).length;
}

function alivePokemonCount(states: PlayerPokemonState[] | undefined): number {
  return (states || []).filter(state => !state.fainted && Math.max(0, Number(state.hp || 0)) > 0 && !/\bfnt\b/i.test(String(state.condition || ""))).length;
}

function fallbackKillEventsFromTimeline(timelineEvents: BattleTimelineEvent[], playerSide: "p1" | "p2" = "p1"): ResultPokemonStatEvent[] {
  const result: ResultPokemonStatEvent[] = [];
  let lastPlayerSource = "";
  for (const event of timelineEvents || []) {
    if (event.side === playerSide && (event.source_showdown_id || event.source_id || event.source)) {
      lastPlayerSource = String(event.source_showdown_id || event.source_id || event.source || "");
    }
    if (event.type !== "faint" || event.targetSide === playerSide || !lastPlayerSource) continue;
    result.push({
      battle_no: 0,
      turn: Math.max(0, Math.floor(Number(event.turn || 0))),
      pokemon_key: lastPlayerSource,
      kind: "kill",
      value: 1,
      source: "move",
    });
  }
  return result;
}

export function updateRunQuestAfterBattle(run: CurrentRunData, options: {playerWon: boolean; playerState?: PlayerPokemonState[]; statEvents?: ResultPokemonStatEvent[]; timelineEvents?: BattleTimelineEvent[]; playerSide?: "p1" | "p2"}): string | null {
  const quest = run.active_quest;
  if (!quest || quest.id === "frugal_challenge") return null;
  const definition = questDefinitionFor(quest.id);
  const battleCount = Math.max(0, Math.floor(Number(quest.progress.battle_count || 0))) + 1;
  quest.progress.battle_count = battleCount;
  if (!options.playerWon && quest.id === "winning_champion") {
    const message = questFailureMessage(quest);
    delete run.active_quest;
    return message;
  }
  if (quest.id === "ace_trial") {
    const byPokemon = {...(quest.progress.kills_by_pokemon || {})};
    const statEvents = options.statEvents?.length ? options.statEvents : fallbackKillEventsFromTimeline(options.timelineEvents || [], options.playerSide || "p1");
    for (const event of statEvents) {
      if (event.kind !== "kill") continue;
      byPokemon[event.pokemon_key] = Number(byPokemon[event.pokemon_key] || 0) + Math.max(0, Number(event.value || 0));
    }
    const best = Math.max(0, ...Object.values(byPokemon).map(value => Math.floor(Number(value || 0))));
    quest.progress.kills_by_pokemon = byPokemon;
    quest.progress.best_kills = best;
    quest.progress.value = best;
  } else if (quest.id === "winning_champion") {
    const alive = alivePokemonCount(options.playerState);
    if (!options.playerWon || alive < 2) {
      const message = questFailureMessage(quest);
      delete run.active_quest;
      return message;
    }
    const wins = Math.max(0, Math.floor(Number(quest.progress.consecutive_wins || 0))) + 1;
    quest.progress.consecutive_wins = wins;
    quest.progress.value = wins;
  } else if (quest.id === "type_expert") {
    quest.progress.value = Math.max(0, Math.floor(Number(quest.progress.value || 0))) + superEffectiveCount(options.timelineEvents || []);
  } else if (quest.id === "item_master") {
    const trackedUses = Math.max(0, Math.floor(Number(run.rest_status?.battle_item_uses_current || 0)));
    const uses = trackedUses || battleItemUsesForPlayer(options.timelineEvents || [], options.playerSide || "p1");
    quest.progress.max_items_used_in_battle = Math.max(Math.floor(Number(quest.progress.max_items_used_in_battle || 0)), uses);
    quest.progress.value = quest.progress.max_items_used_in_battle;
  }
  const completed = questProgressDone(run, quest, definition);
  if (completed) return completed;
  if (definition.expires_after_battles && battleCount >= definition.expires_after_battles) {
    const message = questFailureMessage(quest);
    delete run.active_quest;
    return message;
  }
  return null;
}

function coinLedgerLabel(reason: string, fallback: string): string {
  const labels: Record<string, string> = {
    gain: "金币收入",
    reward: "金币奖励",
    "battle-reward": "战斗奖励",
    "battle-reward:base": "战斗对局奖励",
    "battle-reward:shiny": "闪光加成",
    "battle-reward:amulet": "护符金币",
    "shop-duplicate": "商店重复奖励",
    settlement: "结算",
    "score-bet-adjust": "重金下注",
    "score-bet-refund": "重金下注返还",
    "bp-to-coins": "BP兑换金币",
    "all-in-bonus": "孤注一掷奖励",
    "contest-bonus": "华丽大赛奖励",
    "villain-intrusion-bonus": "反派乱入奖励",
    "rainbow-rocket-bonus": "彩虹火箭队奖励",
    "sponsor-delivery": "赞助到账",
    "blood-donation": "献血光荣",
    "potion-trial": "药剂试喝",
    "devil-treasure": "飞天魔鬼的宝藏",
    "move-refund": "技能返还",
    "score-bet-payout": "重金下注命中",
    "clear-bonus": "通关连胜奖励",
  };
  if (reason.startsWith("shop-roll:")) return "商店抽奖";
  if (reason.startsWith("shop-buy:")) return "商店购买";
  if (reason.startsWith("buy-item:")) return "购买道具";
  if (reason.startsWith("draw-moves")) return "技能抽奖";
  if (reason.startsWith("adjust-move")) return "技能学习";
  if (reason.startsWith("randomize-stats")) return "数值重置";
  if (reason.startsWith("night-sky")) return "夜观天象";
  if (reason.startsWith("exchange")) return "交换服务";
  if (reason.startsWith("forge")) return "锻造";
  if (reason.startsWith("scout")) return "侦察";
  if (reason.startsWith("event-learn")) return "奇遇招式学习";
  return labels[reason] || fallback;
}

export function recordCoinLedger(run: CurrentRunData, type: CoinLedgerEntry["type"], amount: number, before: number, after: number, reason: string, label?: string): void {
  const normalizedAmount = Math.max(0, Math.floor(Number(amount || 0)));
  if (normalizedAmount <= 0 || before === after) return;
  const at = new Date().toISOString();
  const entry: CoinLedgerEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    type,
    amount: normalizedAmount,
    before: Math.max(0, Math.floor(Number(before || 0))),
    after: Math.max(0, Math.floor(Number(after || 0))),
    reason,
    label: label || coinLedgerLabel(reason, type === "gain" ? "金币收入" : "金币支出"),
  };
  run.coin_ledger = [entry, ...(run.coin_ledger || [])].slice(0, 100);
}

export function addCoins(run: CurrentRunData, amount: number, reason = "gain", label?: string): number {
  const gained = Math.max(0, Math.floor(Number(amount || 0)));
  const before = currentCoins(run);
  run.coins = currentCoins(run) + gained;
  recordCoinLedger(run, "gain", gained, before, currentCoins(run), reason, label);
  return gained;
}

export function spendCoins(run: CurrentRunData, cost: number, reason = "spend", label?: string): void {
  const normalizedCost = Math.max(0, Math.floor(Number(cost || 0)));
  if (currentCoins(run) < normalizedCost) throw new Error(`金币不足，需要 ${normalizedCost}金币。`);
  const before = currentCoins(run);
  const locked = Math.max(0, Math.floor(Number(run.non_convertible_coins || 0)));
  run.non_convertible_coins = Math.max(0, locked - normalizedCost);
  run.coins = currentCoins(run) - normalizedCost;
  recordCoinLedger(run, "spend", normalizedCost, before, currentCoins(run), reason, label);
}

export function spendRunCoins(run: CurrentRunData, cost: number, label: string, options: {alreadyPriced?: boolean; nowMs?: number} = {}): {paid: number; message: string} {
  const baseCost = options.alreadyPriced ? Math.max(0, Math.floor(Number(cost || 0))) : pricedForRun(run, cost);
  if (baseCost <= 0) return {paid: 0, message: "免费"};
  if (!hasTalent(run.talents, "growth_risky")) {
    spendCoins(run, baseCost, label);
    recordPortfolioSpend(run, label, baseCost);
    return {paid: baseCost, message: spendText(baseCost)};
  }
  const roll = seededRng(Number(run.seed || 1), 0xbad500 + Number(run.battle_no || run.next_battle || 0) * 97 + toId(label).length * 31 + Math.floor(Number(options.nowMs ?? Date.now())))();
  if (roll < 0.4) {
    return {paid: 0, message: `铤而走险触发：本次花费为 0（原价 ${baseCost}金币）`};
  }
  if (roll < 0.6) {
    const paid = Math.ceil(baseCost * 1.5);
    spendCoins(run, paid, label);
    recordPortfolioSpend(run, label, paid);
    return {paid, message: `铤而走险触发：消耗增加 1.5 倍，花费 ${paid}金币`};
  }
  if (roll < 0.7) {
    addCoins(run, baseCost, label, "铤而走险返利");
    return {paid: 0, message: `铤而走险触发：本次免费，并额外获得 ${baseCost}金币`};
  }
  spendCoins(run, baseCost, label);
  recordPortfolioSpend(run, label, baseCost);
  return {paid: baseCost, message: spendText(baseCost)};
}

export function spendText(cost: number): string {
  return Number(cost || 0) <= 0 ? "免费" : `花费 ${Number(cost)}金币`;
}

export function scoreBetTarget(value: unknown, fallback: RestScoreBetTarget = SCORE_BET_DEFAULT_TARGET): RestScoreBetTarget {
  const target = Math.floor(Number(value || 0));
  return target === 1 || target === 2 || target === 3 ? target : fallback;
}

export function scoreBetMultiplier(target: RestScoreBetTarget): number {
  return SCORE_BET_MULTIPLIERS[target] || SCORE_BET_MULTIPLIERS[SCORE_BET_DEFAULT_TARGET];
}

export function scoreBetMultiplierChoice(value: unknown, fallback = scoreBetMultiplier(SCORE_BET_DEFAULT_TARGET)): number {
  const numeric = Number(value);
  const options = [...SCORE_BET_MULTIPLIER_OPTIONS];
  return options.find(option => Math.abs(option - numeric) < 0.001) || options.find(option => Math.abs(option - fallback) < 0.001) || scoreBetMultiplier(SCORE_BET_DEFAULT_TARGET);
}

export function scoreBetPayout(stake: number, multiplier: number): number {
  return Math.floor(Math.max(0, Math.floor(Number(stake || 0))) * scoreBetMultiplierChoice(multiplier));
}

export function scoreBetMaxStakeForCoins(coins: number, currentStake = 0): number {
  const available = Math.max(0, Math.floor(Number(coins || 0))) + Math.max(0, Math.floor(Number(currentStake || 0)));
  return Math.max(SCORE_BET_MIN_STAKE, Math.min(SCORE_BET_MAX_STAKE, Math.floor(available * 0.5)));
}

export function normalizeScoreBetState(bet: Partial<RestScoreBetState> | null | undefined, maxStake = SCORE_BET_MAX_STAKE): RestScoreBetState | undefined {
  if (!bet) return undefined;
  const target = scoreBetTarget(bet.target_alive);
  const stake = Math.max(SCORE_BET_MIN_STAKE, Math.min(Math.max(SCORE_BET_MIN_STAKE, Math.floor(Number(maxStake || SCORE_BET_MIN_STAKE))), Math.floor(Number(bet.stake || SCORE_BET_MIN_STAKE))));
  const multiplier = scoreBetMultiplierChoice(bet.multiplier, scoreBetMultiplier(target));
  return {
    target_alive: target,
    stake,
    multiplier,
    multiplier_options: [...SCORE_BET_MULTIPLIER_OPTIONS],
    max_stake: Math.max(SCORE_BET_MIN_STAKE, Math.floor(Number(maxStake || SCORE_BET_MIN_STAKE))),
    payout: scoreBetPayout(stake, multiplier),
  };
}

export function settleScoreBetResult(bet: RestScoreBetState | null | undefined, effectivePlayerWin: boolean, playerAlive: number, enemyAlive: number): {hit: boolean; payout: number; targetAlive: RestScoreBetTarget; stake: number; message: string} | null {
  const normalized = normalizeScoreBetState(bet);
  if (!normalized) return null;
  const targetAlive = normalized.target_alive;
  const stake = normalized.stake;
  const exactHit = Boolean(effectivePlayerWin) && Math.max(0, Math.floor(Number(playerAlive || 0))) === targetAlive && Math.max(0, Math.floor(Number(enemyAlive || 0))) === 0;
  const scoreText = `${Math.max(0, Math.floor(Number(playerAlive || 0)))}:0`;
  if (exactHit) {
    const payout = scoreBetPayout(stake, normalized.multiplier);
    return {hit: true, payout, targetAlive, stake, message: `重金下注命中 ${targetAlive}:0（${normalized.multiplier}x），返还 ${payout}金币。`};
  }
  const reason = !effectivePlayerWin ? "本场没有按原阵营获胜" : Math.max(0, Math.floor(Number(enemyAlive || 0))) > 0 ? `对方仍有 ${Math.max(0, Math.floor(Number(enemyAlive || 0)))} 只存活` : `实际比分 ${scoreText}`;
  return {hit: false, payout: 0, targetAlive, stake, message: `重金下注未命中 ${targetAlive}:0（${normalized.multiplier}x），${reason}，下注 ${stake}金币不返还。`};
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

export function normalizeTalentViews(talents: TalentView[] = []): TalentView[] {
  const seen = new Set<string>();
  const normalized: TalentView[] = [];
  for (const input of talents) {
    if (!input?.id || seen.has(input.id)) continue;
    const node = STAR_CHART_NODE_BY_ID.get(input.id);
    const base = TALENTS.find(entry => entry.id === input.id) || ((node?.kind === "talent" || node?.kind === "badge") ? node : undefined);
    if (!base) continue;
    const maxLevel = node?.max_level || input.max_level || base.max_level || 1;
    seen.add(input.id);
    normalized.push({
      ...base,
      kind: node?.kind || base.kind,
      category: node?.category || base.category,
      level: Math.max(1, Math.min(maxLevel, Math.floor(Number(input.level || base.level || 1)))),
      max_level: maxLevel,
    });
  }
  return normalized;
}

export function activeTalentsForSave(save?: LocalSave | null): TalentView[] {
  if (!save) return [];
  return talentsForStarChart(normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades));
}

export function starterUpgradesForSave(save?: LocalSave | null): StarterUpgradeState {
  return starterUpgradesForStarChart(normalizeStarChart(save?.star_chart, save?.talent_unlocks, save?.starter_upgrades));
}

export function gainedBp(run: CurrentRunData | null | undefined, amount: number): number {
  let total = Math.max(0, Number(amount || 0));
  const shinyCount = (run?.player_display || []).filter(pokemon => pokemon.shiny).length;
  if (shinyCount > 0) total *= Math.pow(hasTalent(run?.talents, "economy_shiny_collector") ? 1.3 : 1.1, shinyCount);
  const amuletLevel = talentLevel(run?.talents, "economy_amulet_coin");
  if (amuletLevel > 0) total *= amuletLevel >= 3 ? 1.35 : amuletLevel === 2 ? 1.2 : 1.1;
  return Math.floor(total);
}

export function battleRewardCoinBreakdown(run: CurrentRunData | null | undefined, amount: number): {base: number; shinyBonus: number; amuletBonus: number; total: number} {
  const base = Math.max(0, Math.floor(Number(amount || 0)));
  if (base <= 0) return {base: 0, shinyBonus: 0, amuletBonus: 0, total: 0};
  const shinyCount = (run?.player_display || []).filter(pokemon => pokemon.shiny).length;
  const shinyMultiplier = shinyCount > 0 ? Math.pow(hasTalent(run?.talents, "economy_shiny_collector") ? 1.3 : 1.1, shinyCount) : 1;
  const afterShiny = Math.floor(base * shinyMultiplier);
  const amuletLevel = talentLevel(run?.talents, "economy_amulet_coin");
  const amuletMultiplier = amuletLevel >= 3 ? 1.35 : amuletLevel === 2 ? 1.2 : amuletLevel === 1 ? 1.1 : 1;
  const total = Math.floor(base * shinyMultiplier * amuletMultiplier);
  const shinyBonus = Math.max(0, afterShiny - base);
  const amuletBonus = Math.max(0, total - base - shinyBonus);
  return {base, shinyBonus, amuletBonus, total};
}

export function addBattleRewardCoins(run: CurrentRunData | null | undefined, amount: number): number {
  const breakdown = battleRewardCoinBreakdown(run, amount);
  if (!run) return breakdown.total;
  if (breakdown.base > 0) addCoins(run, breakdown.base, "battle-reward:base", "战斗对局奖励");
  if (breakdown.shinyBonus > 0) addCoins(run, breakdown.shinyBonus, "battle-reward:shiny", "闪光加成");
  if (breakdown.amuletBonus > 0) addCoins(run, breakdown.amuletBonus, "battle-reward:amulet", "护符金币");
  return breakdown.total;
}

export function addRunBp(save: LocalSave, run: CurrentRunData | null | undefined, amount: number): number {
  void save;
  const gained = gainedBp(run, amount);
  if (run) addCoins(run, gained, "reward", "金币奖励");
  return gained;
}

export function clearBonus(save: LocalSave, run?: CurrentRunData): {setStreak: number; bonus: number} {
  save.stats = {...emptyStats(), ...(save.stats || {})};
  const setStreak = Number(save.stats.set_win_streak || 0) + 1;
  save.stats.set_win_streak = setStreak;
  save.stats.best_set_win_streak = Math.max(Number(save.stats.best_set_win_streak || 0), setStreak);
  const bonus = gainedBp(run, (setStreak * 2 + 7) * BP_SCALE);
  if (run) addCoins(run, bonus, "clear-bonus");
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

export function tmIconAssetForMoveType(moveType: string | undefined): string {
  const typeId = toId(moveType);
  return typeId && TM_ICON_TYPE_IDS.has(typeId) ? `assets/items-pack/machine${typeId}.png` : "assets/placeholders/move.png";
}

export function itemCategory(item: Pick<ShopItem, "id" | "name" | "desc" | "desc_zh"> & Partial<Pick<ShopItem, "name_zh">>): ItemCategory {
  if (isTmItemId(item.id)) return "tm";
  if (isRestShopDiscountCoupon(item.id)) return "consumable";
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
