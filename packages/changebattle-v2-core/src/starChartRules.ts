import {
  MAX_BP_V4,
  STAR_CHART_NODES_V4,
  type StarChartNodeKindV4,
  type StarChartNodeViewV4,
  type StarChartStateV4,
  type StarChartTalentEffectIdV4,
  type StarChartTalentEffectV4,
} from "./starChartCatalog.js";

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

export function getUnlockedStarChartRuntimeEffectsV4(starChart?: StarChartStateV4 | null): StarChartTalentEffectV4[] {
  const normalized = normalizeStarChartV4(starChart);
  return STAR_CHART_NODES_V4.flatMap(node => starChartNodeLevelV4(normalized, node.id) > 0 ? node.runtimeEffects || [] : []);
}

export function starChartHasRuntimeEffectV4(starChart: StarChartStateV4 | undefined | null, effectId: StarChartTalentEffectIdV4): boolean {
  return getUnlockedStarChartRuntimeEffectsV4(starChart).some(effect => effect.id === effectId);
}

export function starChartRuntimeEffectValuesV4(starChart: StarChartStateV4 | undefined | null, effectId: StarChartTalentEffectIdV4): number[] {
  return getUnlockedStarChartRuntimeEffectsV4(starChart)
    .filter(effect => effect.id === effectId)
    .map(effect => Number(effect.value || 0))
    .filter(value => Number.isFinite(value));
}

export function starterCandidateCountForStarChart(starChart?: StarChartStateV4 | null): number {
  const extra = starChartRuntimeEffectValuesV4(starChart, "starter_candidate_bonus").reduce((sum, value) => sum + value, 0);
  return Math.max(6, Math.min(10, 6 + extra));
}

export function formalStartingMoneyForStarChartV4(starChart?: StarChartStateV4 | null): number {
  return Math.max(0, ...starChartRuntimeEffectValuesV4(starChart, "starting_money"));
}

export function starChartHasSpecialTrainingLockV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "special_training_lock");
}

export function starChartHasEastAsiaEducationV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "self_study_stable_range") || starChartHasRuntimeEffectV4(starChart, "self_study_nature_risk");
}

export function formalTrainingGroundDiscountForStarChartV4(starChart?: StarChartStateV4 | null): number {
  const values = starChartRuntimeEffectValuesV4(starChart, "training_ground_group_stage_discount")
    .filter(value => value > 0 && value < 1);
  return values.length ? Math.min(...values) : 0;
}

export function formalShopRowsForStarChartV4(starChart?: StarChartStateV4 | null): number {
  const extraRows = starChartRuntimeEffectValuesV4(starChart, "shop_row_bonus").reduce((sum, value) => sum + value, 0);
  return Math.max(1, Math.min(3, 1 + extraRows));
}

export function formalCarryPrepItemCountForStarChartV4(starChart?: StarChartStateV4 | null): number {
  return Math.max(0, ...starChartRuntimeEffectValuesV4(starChart, "carry_prep_items").map(value => Math.floor(value)));
}

export const FORMAL_SHOP_AUTO_RESTOCK_ENABLED = true;

export function starChartHasFreeMedicalCareV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasMedicalInsuranceV4(starChart);
}

export function starChartHasMedicalInsuranceV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "medical_insurance");
}

export function starChartHasVictoryDividendV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "settlement_bp_dividend");
}

export function starChartHasEmergencyMedicalCareV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "post_battle_revive_half_hp");
}

export function starChartHasOutpatientMedicalCareV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "post_battle_heal_alive_quarter_hp");
}

export function starChartHasOpponentRumorV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "opponent_preview_unlock");
}

export function starChartHasLosslessExchangeV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "exchange_full_hp");
}

export function starChartHasEliteExchangeEducationV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "exchange_power_boost");
}

export function starChartHasExchangeItemStealV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "exchange_keep_item");
}

export function starChartHasSecondExchangeV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "second_exchange");
}

export function starChartHasSoulmateRewardV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "soulmate_egg_reward");
}

export function soulmateVaultStarterSlotCountForStarChartV4(starChart?: StarChartStateV4 | null): number {
  const slots = starChartRuntimeEffectValuesV4(starChart, "soulmate_vault_starter_slot")
    .reduce((sum, value) => sum + Math.max(0, Math.floor(value)), 0);
  return Math.max(0, Math.min(2, slots));
}

export function starChartHasPendingSettlementShopExportV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "pending_settlement_shop_export");
}

export function starChartHasPendingSettlementPurchaseBonusV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "pending_settlement_purchase_bonus");
}

export function starChartHasSoulmateHeldItemEntryV4(starChart?: StarChartStateV4 | null): boolean {
  return starChartHasRuntimeEffectV4(starChart, "soulmate_held_item_entry");
}

export function soulmateShinyRateForStarChartV4(starChart?: StarChartStateV4 | null): number {
  return starChartHasRuntimeEffectV4(starChart, "soulmate_shiny_rate_bonus") ? 1 / 8 : 1 / 30;
}

export function soulmateBaseFriendshipForStarChartV4(starChart?: StarChartStateV4 | null): number {
  return Math.max(70, ...starChartRuntimeEffectValuesV4(starChart, "soulmate_base_friendship_bonus").map(value => Math.floor(value)));
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

export function clearStarChartUnlocksForProfileV4<T extends StarChartProfileV4>(profile: T, now = new Date()): T {
  const starChart = normalizeStarChartV4(profile.starChart);
  let refunded = 0;
  for (const node of STAR_CHART_NODES_V4) {
    if (node.kind === "root" || node.id === "root_trainer_star") continue;
    const level = starChartNodeLevelV4(starChart, node.id);
    for (let index = 0; index < level; index += 1) {
      refunded += Math.max(0, Math.floor(Number(node.costs?.[index] ?? node.cost ?? 0)));
    }
  }
  return {
    ...profile,
    battlePoints: normalizeBattlePointsV4(normalizeBattlePointsV4(profile.battlePoints) + refunded),
    starChart: normalizeStarChartV4({nodes: {root_trainer_star: 1}}),
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
