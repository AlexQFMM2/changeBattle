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

export type StarChartProfileInputV4 = {
  battlePoints?: number;
  starChart?: StarChartStateV4 | null;
};

export type StarChartProfileV4 = StarChartProfileInputV4 & {
  updatedAt?: string;
};

const MAX_BP_V4 = 99999;
const MORE_CHOICES_NODE_IDS = ["starter_more_choices_1", "starter_more_choices_2", "starter_more_choices_3", "starter_more_choices_4"] as const;

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

export const STAR_CHART_NODE_BY_ID_V4 = new Map(STAR_CHART_NODES_V4.map(node => [node.id, node]));

export function normalizeBattlePointsV4(value: unknown): number {
  return Math.max(0, Math.min(MAX_BP_V4, Math.floor(Number(value || 0))));
}

export function normalizeStarChartV4(input?: StarChartStateV4 | null): StarChartStateV4 {
  const nodes: Record<string, number> = {root_trainer_star: 1};
  for (const [id, rawLevel] of Object.entries(input?.nodes || {})) {
    const node = STAR_CHART_NODE_BY_ID_V4.get(id);
    if (!node) continue;
    const max = Math.max(1, Math.floor(Number(node.max_level || 1)));
    nodes[id] = Math.max(0, Math.min(max, Math.floor(Number(rawLevel || 0))));
  }
  for (const node of STAR_CHART_NODES_V4) {
    const max = Math.max(1, Math.floor(Number(node.max_level || 1)));
    nodes[node.id] = Math.max(0, Math.min(max, Math.floor(Number(nodes[node.id] || 0))));
  }
  nodes.root_trainer_star = 1;
  return {nodes};
}

export function cloneStarChartV4(input?: StarChartStateV4 | null): StarChartStateV4 {
  return normalizeStarChartV4(input);
}

export function starChartNodeLevelV4(chart: StarChartStateV4 | undefined | null, id: string): number {
  const node = STAR_CHART_NODE_BY_ID_V4.get(id);
  if (!node) return 0;
  const normalized = normalizeStarChartV4(chart);
  const max = Math.max(1, Math.floor(Number(node.max_level || 1)));
  return Math.max(0, Math.min(max, Math.floor(Number(normalized.nodes[id] || 0))));
}

export function starChartNodeReadyV4(chart: StarChartStateV4 | undefined | null, node: Pick<StarChartNodeViewV4, "requires">): boolean {
  const normalized = normalizeStarChartV4(chart);
  return (node.requires || []).every(requirement => starChartNodeLevelV4(normalized, requirement.id) >= Math.max(1, Number(requirement.level || 1)));
}

export function starChartNodeCostV4(chart: StarChartStateV4 | undefined | null, id: string): number | null {
  const node = STAR_CHART_NODE_BY_ID_V4.get(id);
  if (!node || node.disabled || node.kind === "event_preview" || node.kind === "root") return null;
  const level = starChartNodeLevelV4(chart, id);
  const max = Math.max(1, Number(node.max_level || 1));
  if (level >= max) return null;
  return node.costs?.[level] ?? node.cost ?? null;
}

export function getStarChartCatalogV4(profileOrChart?: StarChartProfileInputV4 | StarChartStateV4 | null): StarChartNodeViewV4[] {
  const chart = isChart(profileOrChart) ? profileOrChart : profileOrChart?.starChart;
  const normalized = normalizeStarChartV4(chart);
  return STAR_CHART_NODES_V4.map(node => ({
    ...node,
    level: starChartNodeLevelV4(normalized, node.id),
    disabled: Boolean(node.disabled),
  }));
}

export function starterCandidateCountForStarChart(starChart?: StarChartStateV4 | null): number {
  const normalized = normalizeStarChartV4(starChart);
  const extra = MORE_CHOICES_NODE_IDS.reduce((sum, id) => sum + (starChartNodeLevelV4(normalized, id) > 0 ? 1 : 0), 0);
  return Math.max(6, Math.min(10, 6 + extra));
}

export function unlockStarChartNodeForProfileV4<T extends StarChartProfileV4>(profile: T, nodeId: string, now = new Date()): T {
  const node = STAR_CHART_NODE_BY_ID_V4.get(nodeId);
  if (!node) throw new Error("星图节点不存在。");
  const starChart = normalizeStarChartV4(profile.starChart);
  const battlePoints = normalizeBattlePointsV4(profile.battlePoints);
  const currentLevel = starChartNodeLevelV4(starChart, nodeId);
  const max = Math.max(1, Number(node.max_level || 1));
  const cost = starChartNodeCostV4(starChart, nodeId);
  if (node.kind === "root" || node.disabled || node.kind === "event_preview" || cost === null || currentLevel >= max) {
    throw new Error("该节点已经点亮或暂不可点亮。");
  }
  if (!starChartNodeReadyV4(starChart, node)) {
    throw new Error("前置节点未满足。");
  }
  if (battlePoints < cost) {
    throw new Error(`BP 不足，需要 ${cost}BP。`);
  }
  return {
    ...profile,
    battlePoints: battlePoints - cost,
    starChart: {
      nodes: {
        ...starChart.nodes,
        [nodeId]: currentLevel + 1,
      },
    },
    updatedAt: now.toISOString(),
  };
}

export function enableTestModeForProfileV4<T extends StarChartProfileV4>(profile: T, now = new Date()): T {
  return {
    ...profile,
    battlePoints: MAX_BP_V4,
    starChart: normalizeStarChartV4(profile.starChart),
    updatedAt: now.toISOString(),
  };
}

function isChart(value: StarChartProfileInputV4 | StarChartStateV4 | null | undefined): value is StarChartStateV4 {
  return Boolean(value && "nodes" in value);
}
