export type StarChartStateV4 = {
  nodes: Record<string, number>;
};

export type StarChartNodeKindV4 = "talent" | "starter_upgrade" | "event_preview" | "root" | "badge";

export type StarChartTalentEffectIdV4 =
  | "starter_candidate_bonus"
  | "starting_money"
  | "special_training_lock"
  | "training_ground_group_stage_discount"
  | "self_study_stable_range"
  | "self_study_nature_risk"
  | "shop_row_bonus"
  | "settlement_bp_dividend"
  | "opponent_preview_unlock"
  | "exchange_full_hp"
  | "exchange_power_boost"
  | "exchange_keep_item"
  | "second_exchange"
  | "medical_insurance"
  | "post_battle_revive_half_hp"
  | "post_battle_heal_alive_quarter_hp"
  | "carry_prep_items";

export type StarChartTalentEffectV4 = {
  id: StarChartTalentEffectIdV4;
  value?: number;
};

export type StarChartNodeViewV4 = {
  id: string;
  name: string;
  category: string;
  desc: string;
  cost?: number;
  disabled?: boolean;
  level?: number;
  max_level?: number;
  costs?: number[];
  requires?: Array<{id: string; level?: number}>;
  effects?: string[];
  runtimeEffects?: StarChartTalentEffectV4[];
  kind?: StarChartNodeKindV4;
  x?: number;
  y?: number;
};

export const MAX_BP_V4 = 99999;

export const MORE_CHOICES_NODE_IDS = ["starter_more_choices_1", "starter_more_choices_2", "starter_more_choices_3", "starter_more_choices_4"] as const;

export const SPECIAL_TRAINING_LOCK_NODE_ID = "rest_special_training_lock" as const;
export const COMPULSORY_EDUCATION_NODE_ID = "rest_compulsory_education" as const;
export const EAST_ASIA_EDUCATION_NODE_ID = "rest_east_asia_education" as const;
export const SHOP_MORE_STOCK_NODE_IDS = ["shop_luxury_counter_1", "shop_luxury_counter_2"] as const;
export const FREE_MEDICAL_CARE_NODE_ID = "rest_free_medical_care" as const;
export const MEDICAL_INSURANCE_NODE_ID = FREE_MEDICAL_CARE_NODE_ID;
export const EMERGENCY_MEDICAL_CARE_NODE_ID = "rest_emergency_medical_care" as const;
export const OUTPATIENT_MEDICAL_CARE_NODE_ID = "rest_outpatient_medical_care" as const;
export const OPPONENT_RUMOR_NODE_ID = "rest_opponent_rumor" as const;
export const LOSSLESS_EXCHANGE_NODE_ID = "rest_lossless_exchange" as const;
export const ELITE_EXCHANGE_EDUCATION_NODE_ID = "rest_elite_exchange_education" as const;
export const EXCHANGE_ITEM_STEAL_NODE_ID = "rest_exchange_item_steal" as const;
export const SECOND_EXCHANGE_NODE_ID = "rest_second_exchange" as const;
export const TRAVEL_FUND_NODE_ID = "starter_travel_fund" as const;
export const ELITE_FUND_NODE_ID = "starter_elite_fund" as const;
export const CHAMPION_FUND_NODE_ID = "starter_champion_fund" as const;
export const VICTORY_DIVIDEND_NODE_ID = "economy_victory_dividend" as const;
export const CARRY_PREP_ITEMS_NODE_ID = "economy_carry_prep_items" as const;

export const STAR_CHART_NODES_V4: StarChartNodeViewV4[] = [
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
  {
    id: "starter_more_choices_1",
    name: "多多益善 I",
    category: "开局筹备",
    desc: "初始宝可梦候选数量 +1。",
    max_level: 1,
    costs: [3],
    requires: [{id: "root_trainer_star"}],
    effects: ["初始宝可梦候选数量 +1。"],
    runtimeEffects: [{id: "starter_candidate_bonus", value: 1}],
    kind: "starter_upgrade",
    x: -160,
    y: -360,
  },
  {
    id: "starter_more_choices_2",
    name: "多多益善 II",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [4],
    requires: [{id: "starter_more_choices_1"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    runtimeEffects: [{id: "starter_candidate_bonus", value: 1}],
    kind: "starter_upgrade",
    x: -320,
    y: -360,
  },
  {
    id: "starter_more_choices_3",
    name: "多多益善 III",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [5],
    requires: [{id: "starter_more_choices_2"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    runtimeEffects: [{id: "starter_candidate_bonus", value: 1}],
    kind: "starter_upgrade",
    x: -480,
    y: -360,
  },
  {
    id: "starter_more_choices_4",
    name: "多多益善 IV",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [7],
    requires: [{id: "starter_more_choices_3"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    runtimeEffects: [{id: "starter_candidate_bonus", value: 1}],
    kind: "starter_upgrade",
    x: -640,
    y: -360,
  },
  {
    id: SPECIAL_TRAINING_LOCK_NODE_ID,
    name: "专项特训",
    category: "养成改造",
    desc: "队伍详情页解锁能力锁，随机个体值/努力值时可以保留指定能力。",
    max_level: 1,
    costs: [6],
    requires: [{id: EAST_ASIA_EDUCATION_NODE_ID}],
    effects: ["队伍详情页显示能力锁；锁住的能力不会参与本次随机。"],
    runtimeEffects: [{id: "special_training_lock"}],
    kind: "talent",
    x: 640,
    y: 60,
  },
  {
    id: COMPULSORY_EDUCATION_NODE_ID,
    name: "义务教育",
    category: "养成改造",
    desc: "小组赛阶段训练场课程费用减半。",
    max_level: 1,
    costs: [3],
    requires: [{id: "root_trainer_star"}],
    effects: ["小组赛阶段（第 1、2 回合）训练场所有课程费用减半。"],
    runtimeEffects: [{id: "training_ground_group_stage_discount", value: 0.5}],
    kind: "talent",
    x: 160,
    y: 120,
  },
  {
    id: EAST_ASIA_EDUCATION_NODE_ID,
    name: "东亚教育",
    category: "养成改造",
    desc: "训练场自习收益更稳定，但有概率改变性格。",
    max_level: 1,
    costs: [5],
    requires: [{id: COMPULSORY_EDUCATION_NODE_ID}],
    effects: ["自习收益范围改为中位数～最大值；每次自习后有 10% 概率变为怕寂寞、胆小、内敛、慢吞吞、温顺之一。"],
    runtimeEffects: [{id: "self_study_stable_range"}, {id: "self_study_nature_risk", value: 0.1}],
    kind: "talent",
    x: 400,
    y: 90,
  },
  {
    id: SHOP_MORE_STOCK_NODE_IDS[0],
    name: "琳琅柜台 I",
    category: "经济运营",
    desc: "商店柜台解锁第二行，每类货物多摆出 1 件。",
    max_level: 1,
    costs: [4],
    requires: [{id: "root_trainer_star"}],
    effects: ["商店每类商品从 1 件提升到 2 件。"],
    runtimeEffects: [{id: "shop_row_bonus", value: 1}],
    kind: "talent",
    x: 160,
    y: -300,
  },
  {
    id: SHOP_MORE_STOCK_NODE_IDS[1],
    name: "琳琅柜台 II",
    category: "经济运营",
    desc: "商店柜台解锁第三行，货架恢复完整陈列。",
    max_level: 1,
    costs: [5],
    requires: [{id: SHOP_MORE_STOCK_NODE_IDS[0]}],
    effects: ["商店每类商品从 2 件提升到 3 件。"],
    runtimeEffects: [{id: "shop_row_bonus", value: 1}],
    kind: "talent",
    x: 320,
    y: -300,
  },
  {
    id: CARRY_PREP_ITEMS_NODE_ID,
    name: "随身携带",
    category: "经济运营",
    desc: "第一次进入正式休整页时，从预备背包随机携带少量道具。",
    max_level: 1,
    costs: [6],
    requires: [{id: SHOP_MORE_STOCK_NODE_IDS[0]}],
    effects: ["第一次进入正式休整页时，从预备背包随机携带最多 3 种道具，每种 1 个。"],
    runtimeEffects: [{id: "carry_prep_items", value: 3}],
    kind: "talent",
    x: 320,
    y: -180,
  },
  {
    id: TRAVEL_FUND_NODE_ID,
    name: "旅途基金",
    category: "开局筹备",
    desc: "正式流程初始金币设为 500。",
    max_level: 1,
    costs: [1],
    requires: [{id: "root_trainer_star"}],
    effects: ["正式流程初始金币设为 500。"],
    runtimeEffects: [{id: "starting_money", value: 500}],
    kind: "talent",
    x: -160,
    y: -160,
  },
  {
    id: ELITE_FUND_NODE_ID,
    name: "精英基金",
    category: "开局筹备",
    desc: "正式流程初始金币设为 1000。",
    max_level: 1,
    costs: [3],
    requires: [{id: TRAVEL_FUND_NODE_ID}],
    effects: ["正式流程初始金币设为 1000。"],
    runtimeEffects: [{id: "starting_money", value: 1000}],
    kind: "talent",
    x: -320,
    y: -160,
  },
  {
    id: CHAMPION_FUND_NODE_ID,
    name: "冠军基金",
    category: "开局筹备",
    desc: "正式流程初始金币设为 1500。",
    max_level: 1,
    costs: [5],
    requires: [{id: ELITE_FUND_NODE_ID}],
    effects: ["正式流程初始金币设为 1500。"],
    runtimeEffects: [{id: "starting_money", value: 1500}],
    kind: "talent",
    x: -480,
    y: -160,
  },
  {
    id: VICTORY_DIVIDEND_NODE_ID,
    name: "胜利分红",
    category: "经济运营",
    desc: "最终结算时，根据剩余金币获得额外 BP。",
    max_level: 1,
    costs: [9],
    requires: [{id: ELITE_FUND_NODE_ID}],
    effects: ["最终结算额外获得 floor(当前金币 * 1%) BP，不消耗金币。"],
    runtimeEffects: [{id: "settlement_bp_dividend", value: 0.01}],
    kind: "talent",
    x: -480,
    y: -260,
  },
  {
    id: OPPONENT_RUMOR_NODE_ID,
    name: "小道消息",
    category: "情报筹备",
    desc: "休息室可以花金币打听下一场对手的一只宝可梦情报。",
    max_level: 1,
    costs: [4],
    requires: [{id: "root_trainer_star"}],
    effects: ["休息室可花 10 金币解锁下一场对手的一只宝可梦预览。"],
    runtimeEffects: [{id: "opponent_preview_unlock"}],
    kind: "talent",
    x: 160,
    y: -100,
  },
  {
    id: LOSSLESS_EXCHANGE_NODE_ID,
    name: "无损交换",
    category: "交换契约",
    desc: "交换来的宝可梦以满血状态加入队伍。",
    max_level: 1,
    costs: [8],
    requires: [{id: "root_trainer_star"}],
    effects: ["交换来的宝可梦不再是半血，而是满血。"],
    runtimeEffects: [{id: "exchange_full_hp"}],
    kind: "talent",
    x: 160,
    y: 340,
  },
  {
    id: ELITE_EXCHANGE_EDUCATION_NODE_ID,
    name: "精英教育",
    category: "交换契约",
    desc: "交换来的宝可梦会接受一次强化培养。",
    max_level: 1,
    costs: [10],
    requires: [{id: LOSSLESS_EXCHANGE_NODE_ID}],
    effects: ["交换来的宝可梦数值阶段提升 1 级。"],
    runtimeEffects: [{id: "exchange_power_boost", value: 1}],
    kind: "talent",
    x: 320,
    y: 280,
  },
  {
    id: EXCHANGE_ITEM_STEAL_NODE_ID,
    name: "顺手牵羊",
    category: "交换契约",
    desc: "交换时连同对方携带的道具一起拿过来。",
    max_level: 1,
    costs: [10],
    requires: [{id: LOSSLESS_EXCHANGE_NODE_ID}],
    effects: ["交换来的宝可梦保留对手携带道具。"],
    runtimeEffects: [{id: "exchange_keep_item"}],
    kind: "talent",
    x: 320,
    y: 400,
  },
  {
    id: SECOND_EXCHANGE_NODE_ID,
    name: "换一送一",
    category: "交换契约",
    desc: "每场胜利后可以花金币进行第二次交换。",
    max_level: 1,
    costs: [13],
    requires: [{id: ELITE_EXCHANGE_EDUCATION_NODE_ID}, {id: EXCHANGE_ITEM_STEAL_NODE_ID}],
    effects: ["允许花费 200 金币进行第二次交换。"],
    runtimeEffects: [{id: "second_exchange"}],
    kind: "talent",
    x: 500,
    y: 340,
  },
  {
    id: FREE_MEDICAL_CARE_NODE_ID,
    name: "医疗保险",
    category: "医疗保障",
    desc: "开局时可以购买医疗保险，降低战后救助费用并解锁恢复品折扣。",
    max_level: 1,
    costs: [6],
    requires: [{id: "root_trainer_star"}],
    effects: ["开局可一次性购买 200 / 500 / 1200 金币三档医疗保险。"],
    runtimeEffects: [{id: "medical_insurance"}],
    kind: "talent",
    x: -160,
    y: 300,
  },
  {
    id: EMERGENCY_MEDICAL_CARE_NODE_ID,
    name: "专业急诊",
    category: "医疗保障",
    desc: "胜利后复活濒死宝可梦时，恢复到半血。",
    max_level: 1,
    costs: [8],
    requires: [{id: FREE_MEDICAL_CARE_NODE_ID}],
    effects: ["濒死宝可梦复活目标从 1 HP 提升到半血。"],
    runtimeEffects: [{id: "post_battle_revive_half_hp"}],
    kind: "talent",
    x: -320,
    y: 300,
  },
  {
    id: OUTPATIENT_MEDICAL_CARE_NODE_ID,
    name: "普通门诊",
    category: "医疗保障",
    desc: "胜利后，未濒死宝可梦也能获得基础治疗。",
    max_level: 1,
    costs: [8],
    requires: [{id: EMERGENCY_MEDICAL_CARE_NODE_ID}],
    effects: ["非濒死宝可梦恢复 1/4 最大生命值。"],
    runtimeEffects: [{id: "post_battle_heal_alive_quarter_hp", value: 0.25}],
    kind: "talent",
    x: -480,
    y: 300,
  },
];
