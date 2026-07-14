import {createShowdownDexService, toDexId, type ShowdownDexService} from "@changebattle-v2/showdown-dex-core";
import {evaluateBattleAiMoveV4, type BattleAiMoveEvaluationV4, type BattleAiMoveEvaluatorContextV4} from "./aiMoveEvaluator.js";
import {
  battleAiAccuracyRiskBucketV4,
  battleAiDamageBucketForEstimateV4,
  type BattleAiDamageBucketV4,
  type BattleAiFieldBucketV4,
  type BattleAiRiskBucketV4,
} from "./aiOutcomeBucketsV4.js";

export type BattleAiActionOutcomeV4 = {
  kind: "move";
  moveId: string;
  damageBucket: BattleAiDamageBucketV4;
  accuracyRiskBucket: BattleAiRiskBucketV4;
  fieldBuckets: BattleAiFieldBucketV4[];
  priority: number;
  damaging: boolean;
  koChance: number;
  expectedDamageRatio: number;
  expectedDamageRange: BattleAiMoveEvaluationV4["expectedDamageRange"];
  evaluation: BattleAiMoveEvaluationV4;
  diagnostics: Record<string, unknown>;
};

const DEFAULT_DEX = createShowdownDexService();

export function estimateBattleAiActionOutcomeV4(input: BattleAiMoveEvaluatorContextV4): BattleAiActionOutcomeV4 {
  const dex = input.dex || DEFAULT_DEX;
  const moveId = toDexId(input.move.id || input.move.move);
  const detail = safeMoveDetail(dex, moveId);
  const evaluation = evaluateBattleAiMoveV4(input);
  const damageBucket = battleAiDamageBucketForEstimateV4({
    typeMultiplier: evaluation.typeMultiplier,
    expectedDamageRatio: evaluation.expectedDamageRatio,
    koChance: evaluation.koChance,
  });
  const priority = Number((detail as {priority?: number} | null)?.priority || 0);
  const damaging = Boolean(detail && detail.power > 0 && detail.categoryId !== "status");
  return {
    kind: "move",
    moveId,
    damageBucket,
    accuracyRiskBucket: battleAiAccuracyRiskBucketV4(evaluation.accuracy),
    fieldBuckets: fieldBucketsForMove(moveId),
    priority,
    damaging,
    koChance: evaluation.koChance,
    expectedDamageRatio: evaluation.expectedDamageRatio,
    expectedDamageRange: evaluation.expectedDamageRange,
    evaluation,
    diagnostics: {
      ...evaluation.diagnostics,
      damageBucket,
      accuracyRiskBucket: battleAiAccuracyRiskBucketV4(evaluation.accuracy),
      priority,
      damaging,
      unmodeled: unmodeledEffectsForMove(moveId, damaging),
    },
  };
}

function safeMoveDetail(dex: ShowdownDexService, moveId: string) {
  if (!moveId) return null;
  try {
    return dex.getMoveDetail(moveId);
  } catch {
    return null;
  }
}

function fieldBucketsForMove(moveId: string): BattleAiFieldBucketV4[] {
  if (["raindance", "sunnyday", "sandstorm", "snowscape", "hail"].includes(moveId)) return ["weather-progress"];
  if (["electricterrain", "grassyterrain", "psychicterrain", "mistyterrain"].includes(moveId)) return ["terrain-progress"];
  if (moveId === "trickroom") return ["room-progress"];
  if (["tailwind", "icywind", "electroweb", "stringshot"].includes(moveId)) return ["speed-control-progress"];
  if (["stealthrock", "spikes", "toxicspikes", "stickyweb"].includes(moveId)) return ["hazard-progress"];
  return [];
}

function unmodeledEffectsForMove(moveId: string, damaging: boolean): string[] {
  const unmodeled: string[] = [];
  if (!damaging && !fieldBucketsForMove(moveId).length) unmodeled.push("status-effect");
  if (["suckerpunch", "firstimpression", "fakeout"].includes(moveId)) unmodeled.push("conditional-priority");
  if (["protect", "detect", "spikyshield", "kingsshield", "banefulbunker"].includes(moveId)) unmodeled.push("protect-counter");
  return unmodeled;
}
