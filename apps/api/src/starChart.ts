import {
  MAX_BP_V4,
  MORE_CHOICES_NODE_IDS,
  BATTLE_PRACTICE_MASTERY_NODE_ID,
  CHAMPION_FUND_NODE_ID,
  ELITE_FUND_NODE_ID,
  ELITE_EXCHANGE_EDUCATION_NODE_ID,
  EMERGENCY_BACKPACK_NODE_ID,
  EMERGENCY_MEDICAL_CARE_NODE_ID,
  EAST_ASIA_EDUCATION_NODE_ID,
  EXCHANGE_ITEM_STEAL_NODE_ID,
  FREE_MEDICAL_CARE_NODE_ID,
  LAUNCH_KIT_NODE_ID,
  LOSSLESS_EXCHANGE_NODE_ID,
  MEDICAL_INSURANCE_NODE_ID,
  MOVE_PREVIEW_NODE_ID,
  OPPONENT_RUMOR_NODE_ID,
  OUTPATIENT_MEDICAL_CARE_NODE_ID,
  SECOND_EXCHANGE_NODE_ID,
  SHOP_AUTO_RESTOCK_NODE_ID,
  SHOP_MORE_STOCK_NODE_IDS,
  STAR_CHART_NODES_V4,
  SPECIAL_TRAINING_LOCK_NODE_ID,
  TRAVEL_FUND_NODE_ID,
  VICTORY_DIVIDEND_NODE_ID,
  type StarChartNodeKindV4,
  type StarChartNodeViewV4,
  type StarChartStateV4,
} from "@changebattle-v2/core";

export {BATTLE_PRACTICE_MASTERY_NODE_ID, CHAMPION_FUND_NODE_ID, ELITE_EXCHANGE_EDUCATION_NODE_ID, ELITE_FUND_NODE_ID, EMERGENCY_BACKPACK_NODE_ID, EMERGENCY_MEDICAL_CARE_NODE_ID, EAST_ASIA_EDUCATION_NODE_ID, EXCHANGE_ITEM_STEAL_NODE_ID, FREE_MEDICAL_CARE_NODE_ID, LAUNCH_KIT_NODE_ID, LOSSLESS_EXCHANGE_NODE_ID, MAX_BP_V4, MEDICAL_INSURANCE_NODE_ID, MORE_CHOICES_NODE_IDS, MOVE_PREVIEW_NODE_ID, OPPONENT_RUMOR_NODE_ID, OUTPATIENT_MEDICAL_CARE_NODE_ID, SECOND_EXCHANGE_NODE_ID, SHOP_AUTO_RESTOCK_NODE_ID, SHOP_MORE_STOCK_NODE_IDS, SPECIAL_TRAINING_LOCK_NODE_ID, STAR_CHART_NODES_V4, TRAVEL_FUND_NODE_ID, VICTORY_DIVIDEND_NODE_ID};
export type {StarChartNodeKindV4, StarChartNodeViewV4, StarChartStateV4};

export type StarChartProfileInputV4 = {
  battlePoints?: number;
  starChart?: StarChartStateV4 | null;
};

export type StarChartProfileV4 = StarChartProfileInputV4 & {
  updatedAt?: string;
};

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

export function formalStartingMoneyForStarChartV4(starChart?: StarChartStateV4 | null): number {
  if (starChartNodeLevelV4(starChart, CHAMPION_FUND_NODE_ID) > 0) return 1500;
  if (starChartNodeLevelV4(starChart, ELITE_FUND_NODE_ID) > 0) return 1000;
  if (starChartNodeLevelV4(starChart, TRAVEL_FUND_NODE_ID) > 0) return 500;
  return 0;
}

export function starChartHasSpecialTrainingLockV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, SPECIAL_TRAINING_LOCK_NODE_ID) > 0;
}

export function starChartHasEastAsiaEducationV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, EAST_ASIA_EDUCATION_NODE_ID) > 0;
}

export function formalShopRowsForStarChartV4(starChart?: StarChartStateV4 | null): number {
  const normalized = normalizeStarChartV4(starChart);
  const extraRows = SHOP_MORE_STOCK_NODE_IDS.reduce((sum, id) => sum + (starChartNodeLevelV4(normalized, id) > 0 ? 1 : 0), 0);
  return Math.max(1, Math.min(3, 1 + extraRows));
}

export function formalShopAutoRestockForStarChartV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, SHOP_AUTO_RESTOCK_NODE_ID) > 0;
}

export function starChartHasFreeMedicalCareV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, FREE_MEDICAL_CARE_NODE_ID) > 0;
}

export function starChartHasMedicalInsuranceV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, MEDICAL_INSURANCE_NODE_ID) > 0;
}

export function starChartHasTravelFundV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, TRAVEL_FUND_NODE_ID) > 0;
}

export function starChartHasEliteFundV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, ELITE_FUND_NODE_ID) > 0;
}

export function starChartHasChampionFundV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, CHAMPION_FUND_NODE_ID) > 0;
}

export function starChartHasVictoryDividendV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, VICTORY_DIVIDEND_NODE_ID) > 0;
}

export function starChartHasEmergencyBackpackV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, EMERGENCY_BACKPACK_NODE_ID) > 0;
}

export function starChartHasLaunchKitV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, LAUNCH_KIT_NODE_ID) > 0;
}

export function starChartHasMovePreviewV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, MOVE_PREVIEW_NODE_ID) > 0;
}

export function starChartHasEmergencyMedicalCareV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, EMERGENCY_MEDICAL_CARE_NODE_ID) > 0;
}

export function starChartHasOutpatientMedicalCareV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, OUTPATIENT_MEDICAL_CARE_NODE_ID) > 0;
}

export function starChartHasBattlePracticeMasteryV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, BATTLE_PRACTICE_MASTERY_NODE_ID) > 0;
}

export function starChartHasOpponentRumorV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, OPPONENT_RUMOR_NODE_ID) > 0;
}

export function starChartHasLosslessExchangeV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, LOSSLESS_EXCHANGE_NODE_ID) > 0;
}

export function starChartHasEliteExchangeEducationV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, ELITE_EXCHANGE_EDUCATION_NODE_ID) > 0;
}

export function starChartHasExchangeItemStealV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, EXCHANGE_ITEM_STEAL_NODE_ID) > 0;
}

export function starChartHasSecondExchangeV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartNodeLevelV4(starChart, SECOND_EXCHANGE_NODE_ID) > 0;
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
