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
];
