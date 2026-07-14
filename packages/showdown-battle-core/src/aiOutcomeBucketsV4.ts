import type {BattleAiOutcomeBucketV4} from "./types.js";

export type BattleAiDamageBucketV4 =
  | "immune"
  | "negligible"
  | "chip"
  | "pressure"
  | "two-hit-ko"
  | "near-ko"
  | "possible-ko"
  | "guaranteed-ko";

export type BattleAiRiskBucketV4 =
  | "low-accuracy"
  | "medium-accuracy"
  | "high-accuracy"
  | "guaranteed-hit";

export type BattleAiFieldBucketV4 =
  | "weather-progress"
  | "terrain-progress"
  | "room-progress"
  | "speed-control-progress"
  | "hazard-progress";

export function battleAiOutcomeBucketScoreV4(buckets: BattleAiOutcomeBucketV4[]): number {
  const weights: Record<BattleAiOutcomeBucketV4, number> = {
    "ko": 82,
    "joint-ko": 76,
    "threaten-ko": 22,
    "self-ko-risk": -92,
    "revenge-kill-risk": -30,
    "safe-switch": 16,
    "unsafe-switch": -46,
    "setup-weather": 18,
    "enable-wincon": 28,
    "preserve-wincon": 24,
    "hazard-progress": 20,
    "status-progress": 12,
  };
  return uniqueBuckets(buckets).reduce((sum, bucket) => sum + weights[bucket], 0);
}

export function battleAiDamageBucketForEstimateV4(input: {
  typeMultiplier: number;
  expectedDamageRatio: number;
  koChance: number;
}): BattleAiDamageBucketV4 {
  if (input.typeMultiplier <= 0) return "immune";
  if (input.koChance >= 1) return "guaranteed-ko";
  if (input.koChance > 0) return "possible-ko";
  if (input.expectedDamageRatio >= 0.85) return "near-ko";
  if (input.expectedDamageRatio >= 0.5) return "two-hit-ko";
  if (input.expectedDamageRatio >= 0.3) return "pressure";
  if (input.expectedDamageRatio >= 0.08) return "chip";
  return "negligible";
}

export function battleAiAccuracyRiskBucketV4(accuracy: number): BattleAiRiskBucketV4 {
  if (accuracy >= 100) return "guaranteed-hit";
  if (accuracy >= 90) return "high-accuracy";
  if (accuracy >= 75) return "medium-accuracy";
  return "low-accuracy";
}

export function battleAiDamageBucketScoreV4(bucket: BattleAiDamageBucketV4): number {
  const weights: Record<BattleAiDamageBucketV4, number> = {
    "immune": -80,
    "negligible": -18,
    "chip": 4,
    "pressure": 16,
    "two-hit-ko": 34,
    "near-ko": 54,
    "possible-ko": 68,
    "guaranteed-ko": 88,
  };
  return weights[bucket];
}

export function battleAiRiskBucketScoreV4(bucket: BattleAiRiskBucketV4): number {
  const weights: Record<BattleAiRiskBucketV4, number> = {
    "guaranteed-hit": 8,
    "high-accuracy": 4,
    "medium-accuracy": -6,
    "low-accuracy": -20,
  };
  return weights[bucket];
}

function uniqueBuckets<T>(buckets: T[]): T[] {
  return [...new Set(buckets)];
}
