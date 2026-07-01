export type StarChartStateV4 = {
  nodes: Record<string, number>;
};

export type StarChartNodeKindV4 = "talent" | "starter_upgrade" | "event_preview" | "root" | "badge";

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
  kind?: StarChartNodeKindV4;
  x?: number;
  y?: number;
};

export const MAX_BP_V4 = 99999;

export const MORE_CHOICES_NODE_IDS = ["starter_more_choices_1", "starter_more_choices_2", "starter_more_choices_3", "starter_more_choices_4"] as const;

export const SPECIAL_TRAINING_LOCK_NODE_ID = "rest_special_training_lock" as const;
export const EAST_ASIA_EDUCATION_NODE_ID = "rest_east_asia_education" as const;
export const SHOP_MORE_STOCK_NODE_IDS = ["shop_luxury_counter_1", "shop_luxury_counter_2"] as const;
export const SHOP_AUTO_RESTOCK_NODE_ID = "shop_auto_restock" as const;
export const FREE_MEDICAL_CARE_NODE_ID = "rest_free_medical_care" as const;
export const EMERGENCY_MEDICAL_CARE_NODE_ID = "rest_emergency_medical_care" as const;
export const OUTPATIENT_MEDICAL_CARE_NODE_ID = "rest_outpatient_medical_care" as const;
export const BATTLE_PRACTICE_MASTERY_NODE_ID = "battle_practice_mastery" as const;
export const OPPONENT_RUMOR_NODE_ID = "rest_opponent_rumor" as const;

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
    costs: [10],
    requires: [{id: "root_trainer_star"}],
    effects: ["初始宝可梦候选数量 +1。"],
    kind: "starter_upgrade",
    x: -180,
    y: -75,
  },
  {
    id: "starter_more_choices_2",
    name: "多多益善 II",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [12],
    requires: [{id: "starter_more_choices_1"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    kind: "starter_upgrade",
    x: -330,
    y: -130,
  },
  {
    id: "starter_more_choices_3",
    name: "多多益善 III",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [15],
    requires: [{id: "starter_more_choices_2"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    kind: "starter_upgrade",
    x: -480,
    y: -185,
  },
  {
    id: "starter_more_choices_4",
    name: "多多益善 IV",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [20],
    requires: [{id: "starter_more_choices_3"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    kind: "starter_upgrade",
    x: -630,
    y: -240,
  },
  {
    id: SPECIAL_TRAINING_LOCK_NODE_ID,
    name: "专项特训",
    category: "养成改造",
    desc: "队伍详情页解锁能力锁，随机个体值/努力值时可以保留指定能力。",
    max_level: 1,
    costs: [20],
    requires: [{id: "root_trainer_star"}],
    effects: ["队伍详情页显示能力锁；锁住的能力不会参与本次随机。"],
    kind: "talent",
    x: 185,
    y: 95,
  },
  {
    id: EAST_ASIA_EDUCATION_NODE_ID,
    name: "东亚教育",
    category: "养成改造",
    desc: "训练场自学时，性格影响被压低，课堂表现更容易走向极端。",
    max_level: 1,
    costs: [15],
    requires: [{id: SPECIAL_TRAINING_LOCK_NODE_ID}],
    effects: ["自学基础概率变为：贪玩 35%、认真 15%、一般 50%；性格偏移减半。"],
    kind: "talent",
    x: 355,
    y: 165,
  },
  {
    id: SHOP_MORE_STOCK_NODE_IDS[0],
    name: "琳琅柜台 I",
    category: "经济运营",
    desc: "商店柜台解锁第二行，每类货物多摆出 1 件。",
    max_level: 1,
    costs: [10],
    requires: [{id: "root_trainer_star"}],
    effects: ["商店每类商品从 1 件提升到 2 件。"],
    kind: "talent",
    x: 175,
    y: -105,
  },
  {
    id: SHOP_MORE_STOCK_NODE_IDS[1],
    name: "琳琅柜台 II",
    category: "经济运营",
    desc: "商店柜台解锁第三行，货架恢复完整陈列。",
    max_level: 1,
    costs: [15],
    requires: [{id: SHOP_MORE_STOCK_NODE_IDS[0]}],
    effects: ["商店每类商品从 2 件提升到 3 件。"],
    kind: "talent",
    x: 345,
    y: -175,
  },
  {
    id: SHOP_AUTO_RESTOCK_NODE_ID,
    name: "货架回声",
    category: "经济运营",
    desc: "购买商品后，商店会立刻补上一件新货。",
    max_level: 1,
    costs: [20],
    requires: [{id: "root_trainer_star"}],
    effects: ["开启购买后的自动补货；未点亮时商品买完即售罄。"],
    kind: "talent",
    x: 175,
    y: -255,
  },
  {
    id: OPPONENT_RUMOR_NODE_ID,
    name: "小道消息",
    category: "情报筹备",
    desc: "休整中心可以花金币打听下一场对手的一只宝可梦情报。",
    max_level: 1,
    costs: [10],
    requires: [{id: "root_trainer_star"}],
    effects: ["休整中心可花 10 金币解锁下一场对手的一只宝可梦预览。"],
    kind: "talent",
    x: -175,
    y: -255,
  },
  {
    id: FREE_MEDICAL_CARE_NODE_ID,
    name: "免费医疗",
    category: "医疗保障",
    desc: "胜利后进入休整页时，工厂免费复活濒死宝可梦。",
    max_level: 1,
    costs: [20],
    requires: [{id: "root_trainer_star"}],
    effects: ["单局结算时免除濒死复活的 50 金币费用。"],
    kind: "talent",
    x: -175,
    y: 95,
  },
  {
    id: EMERGENCY_MEDICAL_CARE_NODE_ID,
    name: "专业急诊",
    category: "医疗保障",
    desc: "胜利后复活濒死宝可梦时，恢复到半血。",
    max_level: 1,
    costs: [25],
    requires: [{id: FREE_MEDICAL_CARE_NODE_ID}],
    effects: ["濒死宝可梦复活目标从 1 HP 提升到半血。"],
    kind: "talent",
    x: -345,
    y: 165,
  },
  {
    id: OUTPATIENT_MEDICAL_CARE_NODE_ID,
    name: "普通门诊",
    category: "医疗保障",
    desc: "胜利后，未濒死宝可梦也能获得基础治疗。",
    max_level: 1,
    costs: [25],
    requires: [{id: EMERGENCY_MEDICAL_CARE_NODE_ID}],
    effects: ["非濒死宝可梦恢复 1/4 最大生命值。"],
    kind: "talent",
    x: -515,
    y: 235,
  },
  {
    id: BATTLE_PRACTICE_MASTERY_NODE_ID,
    name: "熟能生巧",
    category: "养成改造",
    desc: "胜利后，没有濒死且造成过伤害的宝可梦等级 +1。",
    max_level: 1,
    costs: [30],
    requires: [{id: SPECIAL_TRAINING_LOCK_NODE_ID}],
    effects: ["胜利后，出战并造成直接伤害且没有濒死的宝可梦等级 +1。"],
    kind: "talent",
    x: 530,
    y: 235,
  },
];
