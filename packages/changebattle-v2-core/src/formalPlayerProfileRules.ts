import type {FormalNpcTypeV4} from "./formalGameCatalog.js";

export type FormalMoveEffectKindRuleV4 = "damage" | "setup" | "recovery" | "status" | "field" | "protect" | "pivot" | "other";
export type FormalProfileTypeWeightsV4 = Record<string, number>;

export type FormalPlayerProfileRuleInputV4 = {
  weaknessTypes: FormalProfileTypeWeightsV4;
  moveTypes: FormalProfileTypeWeightsV4;
  attackStyle: "physical" | "special" | "mixed" | "status";
  speedStyle: "slow" | "fast" | "balanced";
  effectWeights: Partial<Record<FormalMoveEffectKindRuleV4, number>>;
  hasMoveUsage: boolean;
};

export function formalNormalizePlayerProfileV4(profile: FormalPlayerProfileRuleInputV4): FormalPlayerProfileRuleInputV4 {
  return {
    weaknessTypes: formalNormalizeTypeWeightsV4(profile.weaknessTypes),
    moveTypes: formalNormalizeTypeWeightsV4(profile.moveTypes),
    attackStyle: profile.attackStyle,
    speedStyle: profile.speedStyle,
    effectWeights: formalNormalizeEffectWeightsV4(profile.effectWeights),
    hasMoveUsage: Boolean(profile.hasMoveUsage),
  };
}

export function formalCombinePlayerProfilesV4(teamProfile: FormalPlayerProfileRuleInputV4, moveUsageProfile: FormalPlayerProfileRuleInputV4 | null): FormalPlayerProfileRuleInputV4 {
  if (!moveUsageProfile?.hasMoveUsage) return teamProfile;
  return formalNormalizePlayerProfileV4({
    weaknessTypes: formalScaleTypeWeightsV4(teamProfile.weaknessTypes, 0.6),
    moveTypes: formalMergeTypeWeightsV4(formalScaleTypeWeightsV4(teamProfile.moveTypes, 0.6), formalScaleTypeWeightsV4(moveUsageProfile.moveTypes, 0.4)),
    attackStyle: moveUsageProfile.attackStyle === "mixed" || moveUsageProfile.attackStyle === "status" ? teamProfile.attackStyle : moveUsageProfile.attackStyle,
    speedStyle: teamProfile.speedStyle,
    effectWeights: formalMergeEffectWeightsV4(formalScaleEffectWeightsV4(teamProfile.effectWeights, 0.6), formalScaleEffectWeightsV4(moveUsageProfile.effectWeights, 0.4)),
    hasMoveUsage: true,
  });
}

export function formalTargetingIntensityForTrainerTypeV4(type: FormalNpcTypeV4): number {
  if (type === "champion" || type === "villain") return 1.15;
  if (type === "gym" || type === "elite4") return 0.95;
  if (type === "elite") return 0.7;
  return 0.55;
}

export function formalAttackStyleFromCountsV4(physical: number, special: number, status: number): FormalPlayerProfileRuleInputV4["attackStyle"] {
  const total = physical + special + status;
  if (total <= 0 || status / total >= 0.55) return "status";
  if (physical >= special * 1.5) return "physical";
  if (special >= physical * 1.5) return "special";
  return "mixed";
}

function formalNormalizeTypeWeightsV4(weights: FormalProfileTypeWeightsV4): FormalProfileTypeWeightsV4 {
  const entries = Object.entries(weights).filter(([, value]) => value > 0);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return Object.fromEntries(entries.map(([key, value]) => [key, value / max]).filter(([key]) => Boolean(key))) as FormalProfileTypeWeightsV4;
}

function formalNormalizeEffectWeightsV4(weights: Partial<Record<FormalMoveEffectKindRuleV4, number>>): Partial<Record<FormalMoveEffectKindRuleV4, number>> {
  const entries = Object.entries(weights).filter(([, value]) => Number(value) > 0) as Array<[FormalMoveEffectKindRuleV4, number]>;
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return Object.fromEntries(entries.map(([key, value]) => [key, value / max])) as Partial<Record<FormalMoveEffectKindRuleV4, number>>;
}

function formalScaleTypeWeightsV4(weights: FormalProfileTypeWeightsV4, scale: number): FormalProfileTypeWeightsV4 {
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value * scale]));
}

function formalScaleEffectWeightsV4(weights: Partial<Record<FormalMoveEffectKindRuleV4, number>>, scale: number): Partial<Record<FormalMoveEffectKindRuleV4, number>> {
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Number(value || 0) * scale])) as Partial<Record<FormalMoveEffectKindRuleV4, number>>;
}

function formalMergeTypeWeightsV4(a: FormalProfileTypeWeightsV4, b: FormalProfileTypeWeightsV4): FormalProfileTypeWeightsV4 {
  const next: FormalProfileTypeWeightsV4 = {...a};
  Object.entries(b).forEach(([key, value]) => {
    next[key] = (next[key] || 0) + value;
  });
  return next;
}

function formalMergeEffectWeightsV4(a: Partial<Record<FormalMoveEffectKindRuleV4, number>>, b: Partial<Record<FormalMoveEffectKindRuleV4, number>>): Partial<Record<FormalMoveEffectKindRuleV4, number>> {
  const next = {...a};
  Object.entries(b).forEach(([key, value]) => {
    const kind = key as FormalMoveEffectKindRuleV4;
    next[kind] = (next[kind] || 0) + Number(value || 0);
  });
  return next;
}
