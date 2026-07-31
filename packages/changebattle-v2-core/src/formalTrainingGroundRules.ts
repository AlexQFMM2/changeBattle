import {formalCreateRngV4, formalShuffleV4} from "./formalPowerProfileRules.js";
import {formalToIdV4} from "./formalSpeciesRules.js";

export type FormalTrainingGroundLessonKindV4 = "tutor" | "egg" | "self-learn" | "self-study";
export type FormalTrainingGroundLessonSourceV4 = "tutor" | "egg" | "levelup" | "self-study";
export type FormalTrainingGroundSelfStudyEventV4 = "playful" | "normal" | "focused";

export type FormalTrainingGroundLessonRuleV4 = {
  kind: FormalTrainingGroundLessonKindV4;
  title: string;
  teacherLabel: string;
  summary: string;
  dialogue: string;
  introText: string;
  completeText: string;
  fee: number;
  source: FormalTrainingGroundLessonSourceV4;
};

export type FormalTrainingGroundSelfStudyWeightsV4 = {
  playful: number;
  normal: number;
  focused: number;
};

export type FormalTrainingGroundSelfStudyGainRuleV4 = {
  iv: readonly [number, number];
  ev: readonly [number, number];
};

export type FormalTrainingGroundDynamicSelfStudyInputV4 = {
  ivTotal?: number;
  evTotal?: number;
};

export const FORMAL_TRAINING_GROUND_GROUP_STAGE_DISCOUNT_ROUNDS_V4 = 2;
export const FORMAL_TRAINING_GROUND_SELF_STUDY_IV_TARGET_V4 = 181;
export const FORMAL_TRAINING_GROUND_SELF_STUDY_EV_TARGET_V4 = 510;
export const FORMAL_TRAINING_GROUND_SELF_STUDY_NATURE_RISK_TARGETS_V4 = ["Lonely", "Timid", "Modest", "Mild", "Gentle"] as const;

export function formalTrainingGroundLessonTableV4(): FormalTrainingGroundLessonRuleV4[] {
  return [
    {
      kind: "tutor",
      title: "实践课",
      teacherLabel: "老奶奶",
      summary: "由联盟来的老奶奶上课，能教授宝可梦难以学习的招式。",
      dialogue: "联盟来的老奶奶会带来实战课程，教授宝可梦那些平时难以学习的招式。想让哪只宝可梦上课？",
      introText: "一位年迈慈祥的奶奶正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "教授课程结束了。",
      fee: 200,
      source: "tutor",
    },
    {
      kind: "egg",
      title: "遗传学",
      teacherLabel: "老爷爷",
      summary: "由培育屋的老爷爷上课，能令宝可梦学会那些与生俱来的招式。",
      dialogue: "培育屋的老爷爷会讲解招式的遗传来源，让宝可梦学会那些与生俱来的招式。想让哪只宝可梦来听课？",
      introText: "一位沉稳严厉的爷爷正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "蛋招式课程结束了。",
      fee: 200,
      source: "egg",
    },
    {
      kind: "self-learn",
      title: "冥想课",
      teacherLabel: "年轻小姐",
      summary: "由年轻的姐姐上课，能让宝可梦静下心来修炼，说不定能回忆一些招式。",
      dialogue: "年轻的姐姐会引导宝可梦静下心来修炼，说不定能回忆起一些曾经掌握或能够领悟的招式。",
      introText: "一位漂亮美丽的姐姐正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "自学招式课程结束了。",
      fee: 200,
      source: "levelup",
    },
    {
      kind: "self-study",
      title: "自习课",
      teacherLabel: "自习课",
      summary: "由宝可梦自主学习，根据课堂状态调整个体值和努力值。",
      dialogue: "自习课交给宝可梦自主学习。它们会根据课堂状态调整个体值和努力值。",
      introText: "教室里现在没有老师，大家都在埋头自习，是否让宝可梦自主学习？座位费 200 金币。",
      completeText: "自习课结束了。",
      fee: 200,
      source: "self-study",
    },
  ];
}

export function formalTrainingGroundLessonForRollV4(seed: string, nodeId: string, lessonRoll: number, lessons = formalTrainingGroundLessonTableV4()): FormalTrainingGroundLessonRuleV4 {
  if (!lessons.length) throw new Error("training ground lesson table is empty");
  const safeRoll = Math.max(0, Math.floor(Number(lessonRoll || 0)));
  const cycleSize = lessons.length;
  const cycleIndex = Math.floor(safeRoll / cycleSize);
  const slotIndex = safeRoll % cycleSize;
  const deck = formalShuffleV4(lessons, formalCreateRngV4(`${seed}:${nodeId}:training-ground-cycle:${cycleIndex}`));
  if (cycleIndex > 0 && deck.length > 1) {
    const previousDeck = formalShuffleV4(lessons, formalCreateRngV4(`${seed}:${nodeId}:training-ground-cycle:${cycleIndex - 1}`));
    formalNormalizeTrainingGroundDeckBoundaryV4(deck, previousDeck);
  }
  return deck[slotIndex] || deck[0] || lessons[0]!;
}

export function formalNormalizeTrainingGroundDeckBoundaryV4<T extends {kind: string}>(deck: T[], previousDeck: T[]) {
  const previousLast = previousDeck[previousDeck.length - 1];
  if (!previousLast || deck[0]?.kind !== previousLast.kind) return;
  const swapIndex = deck.findIndex((lesson, index) => index > 0 && lesson.kind !== previousLast.kind);
  if (swapIndex <= 0) return;
  [deck[0], deck[swapIndex]] = [deck[swapIndex]!, deck[0]!];
}

export function formalTrainingGroundLessonKindFromIdV4(lessonId: string): FormalTrainingGroundLessonKindV4 | "" {
  const suffix = String(lessonId || "").split(":").pop() || "";
  return suffix === "tutor" || suffix === "egg" || suffix === "self-learn" || suffix === "self-study" ? suffix : "";
}

export function formalRollTrainingGroundSelfStudyEventV4(input: {nature?: string}, rng: () => number): FormalTrainingGroundSelfStudyEventV4 {
  const weights = formalTrainingGroundSelfStudyEventWeightsV4(input);
  const roll = rng();
  if (roll < weights.playful) return "playful";
  if (roll >= 1 - weights.focused) return "focused";
  return "normal";
}

export function formalTrainingGroundDynamicSelfStudyGainRuleV4(
  event: FormalTrainingGroundSelfStudyEventV4,
  input: FormalTrainingGroundDynamicSelfStudyInputV4,
): FormalTrainingGroundSelfStudyGainRuleV4 {
  const rule = selfStudyDynamicRuleForEvent(event);
  return {
    iv: dynamicSelfStudyRange(input.ivTotal, FORMAL_TRAINING_GROUND_SELF_STUDY_IV_TARGET_V4, rule.iv),
    ev: dynamicSelfStudyRange(input.evTotal, FORMAL_TRAINING_GROUND_SELF_STUDY_EV_TARGET_V4, rule.ev),
  };
}

export function formalTrainingGroundStableSelfStudyGainRuleV4(rule: FormalTrainingGroundSelfStudyGainRuleV4): FormalTrainingGroundSelfStudyGainRuleV4 {
  return {
    iv: [Math.ceil((rule.iv[0] + rule.iv[1]) / 2), rule.iv[1]],
    ev: [Math.ceil((rule.ev[0] + rule.ev[1]) / 2), rule.ev[1]],
  };
}

function selfStudyDynamicRuleForEvent(event: FormalTrainingGroundSelfStudyEventV4) {
  if (event === "focused") return {iv: {minRate: 0.3, maxRate: 0.42, minimum: 24}, ev: {minRate: 0.32, maxRate: 0.42, minimum: 65}};
  if (event === "normal") return {iv: {minRate: 0.22, maxRate: 0.32, minimum: 18}, ev: {minRate: 0.22, maxRate: 0.32, minimum: 45}};
  return {iv: {minRate: 0.12, maxRate: 0.2, minimum: 10}, ev: {minRate: 0.14, maxRate: 0.22, minimum: 30}};
}

function dynamicSelfStudyRange(
  currentTotal: unknown,
  targetTotal: number,
  rule: {minRate: number; maxRate: number; minimum: number},
): readonly [number, number] {
  const current = Math.max(0, Math.floor(Number(currentTotal || 0)));
  const missing = Math.max(0, Math.floor(targetTotal) - current);
  if (missing <= 0) return [0, 0];
  if (missing <= rule.minimum) return [missing, missing];
  const min = Math.min(missing, Math.max(rule.minimum, Math.ceil(missing * rule.minRate)));
  const max = Math.min(missing, Math.max(min, Math.ceil(missing * rule.maxRate)));
  return [min, max];
}

export function formalTrainingGroundLessonFeeV4(baseFee: number, input: {roundIndex?: number; groupStageDiscount?: number | false | null} = {}): number {
  const fee = Math.max(0, Math.floor(Number(baseFee || 0)));
  const roundIndex = Math.max(0, Math.floor(Number(input.roundIndex ?? 0)));
  const discount = Number(input.groupStageDiscount || 0);
  if (roundIndex >= FORMAL_TRAINING_GROUND_GROUP_STAGE_DISCOUNT_ROUNDS_V4 || !Number.isFinite(discount) || discount <= 0 || discount >= 1) return fee;
  return Math.max(1, Math.floor(fee * discount));
}

export function formalTrainingGroundSelfStudyEventWeightsV4(input: {nature?: string}): FormalTrainingGroundSelfStudyWeightsV4 {
  const nature = formalToIdV4(input.nature);
  const focusedNatures = new Set(["serious", "hardy", "adamant", "modest", "jolly", "timid", "bold", "calm", "careful", "impish"]);
  const playfulNatures = new Set(["relaxed", "lax", "gentle", "quiet", "docile", "naive"]);
  let playful = 0.3;
  let focused = 0.1;
  if (focusedNatures.has(nature)) {
    playful -= 0.05;
    focused += 0.05;
  } else if (playfulNatures.has(nature)) {
    playful += 0.08;
    focused -= 0.03;
  }
  playful = Math.max(0.15, Math.min(0.45, playful));
  focused = Math.max(0.05, Math.min(0.2, focused));
  return {playful, focused, normal: Math.max(0, 1 - playful - focused)};
}
