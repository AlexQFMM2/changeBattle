import {formalCreateRngV4, formalShuffleV4} from "./formalPowerProfileRules.js";
import {formalToIdV4} from "./formalSpeciesRules.js";

export type FormalTrainingGroundLessonKindV4 = "tutor" | "egg" | "self-learn" | "self-study";
export type FormalTrainingGroundLessonSourceV4 = "tutor" | "egg" | "levelup" | "self-study";
export type FormalTrainingGroundSelfStudyEventV4 = "playful" | "normal" | "focused";

export type FormalTrainingGroundLessonRuleV4 = {
  kind: FormalTrainingGroundLessonKindV4;
  teacherLabel: string;
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

export function formalTrainingGroundLessonTableV4(): FormalTrainingGroundLessonRuleV4[] {
  return [
    {
      kind: "tutor",
      teacherLabel: "老奶奶",
      introText: "一位年迈慈祥的奶奶正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "教授课程结束了。",
      fee: 200,
      source: "tutor",
    },
    {
      kind: "egg",
      teacherLabel: "老爷爷",
      introText: "一位沉稳严厉的爷爷正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "蛋招式课程结束了。",
      fee: 200,
      source: "egg",
    },
    {
      kind: "self-learn",
      teacherLabel: "年轻小姐",
      introText: "一位漂亮美丽的姐姐正在教学，是否让宝可梦进入学习？旁听费 200 金币。",
      completeText: "自学招式课程结束了。",
      fee: 200,
      source: "levelup",
    },
    {
      kind: "self-study",
      teacherLabel: "自习课",
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

export function formalRollTrainingGroundSelfStudyEventV4(input: {nature?: string}, rng: () => number, eastAsiaEducation = false): FormalTrainingGroundSelfStudyEventV4 {
  const weights = formalTrainingGroundSelfStudyEventWeightsV4(input, eastAsiaEducation);
  const roll = rng();
  if (roll < weights.playful) return "playful";
  if (roll >= 1 - weights.focused) return "focused";
  return "normal";
}

export function formalTrainingGroundSelfStudyGainRuleV4(event: FormalTrainingGroundSelfStudyEventV4): FormalTrainingGroundSelfStudyGainRuleV4 {
  if (event === "focused") return {iv: [12, 30], ev: [35, 50]};
  if (event === "normal") return {iv: [5, 15], ev: [12, 40]};
  return {iv: [-5, 10], ev: [-10, 15]};
}

export function formalTrainingGroundSelfStudyEventWeightsV4(input: {nature?: string}, eastAsiaEducation = false): FormalTrainingGroundSelfStudyWeightsV4 {
  const nature = formalToIdV4(input.nature);
  const focusedNatures = new Set(["serious", "hardy", "adamant", "modest", "jolly", "timid", "bold", "calm", "careful", "impish"]);
  const playfulNatures = new Set(["relaxed", "lax", "gentle", "quiet", "docile", "naive"]);
  let playful = eastAsiaEducation ? 0.35 : 0.3;
  let focused = eastAsiaEducation ? 0.15 : 0.1;
  const natureScale = eastAsiaEducation ? 0.5 : 1;
  if (focusedNatures.has(nature)) {
    playful -= 0.05 * natureScale;
    focused += 0.05 * natureScale;
  } else if (playfulNatures.has(nature)) {
    playful += 0.08 * natureScale;
    focused -= 0.03 * natureScale;
  }
  playful = Math.max(0.15, Math.min(0.45, playful));
  focused = Math.max(0.05, Math.min(0.2, focused));
  return {playful, focused, normal: Math.max(0, 1 - playful - focused)};
}
