import assert from "node:assert/strict";
import {
  formalBattleSystemLabelV4,
  formalGameModeLabelV4,
  formalMedicalInsuranceTierLabelV4,
  formalNpcTeamPreferenceLabelV4,
  formalRoundStageLabelV4,
  formalSettlementOutcomeLabelV4,
  formalSettlementReasonLabelV4,
  formalStarterRoleLabelV4,
  formalTrainingGroundLessonTableV4,
} from "./index.js";

assert.equal(formalRoundStageLabelV4(0), "小组赛揭幕战");
assert.equal(formalRoundStageLabelV4(6), "决赛");
assert.equal(formalRoundStageLabelV4(8), "第 9 场");
assert.equal(formalGameModeLabelV4("doubles"), "双打-AI");
assert.equal(formalBattleSystemLabelV4("terastal"), "太晶化");
assert.equal(formalMedicalInsuranceTierLabelV4("premium"), "冠军医疗保险");
assert.equal(formalSettlementReasonLabelV4("surrender"), "玩家投降");
assert.equal(formalSettlementOutcomeLabelV4("abandoned"), "中途放弃");
assert.equal(formalNpcTeamPreferenceLabelV4("rain"), "雨天队");
assert.equal(formalStarterRoleLabelV4("speed-control"), "速度控制");

const lessons = formalTrainingGroundLessonTableV4();
assert.equal(lessons.length, 4);
for (const lesson of lessons) {
  assert.ok(lesson.title);
  assert.ok(lesson.teacherLabel);
  assert.ok(lesson.summary);
  assert.ok(lesson.dialogue);
}

assert.equal(lessons.find(lesson => lesson.kind === "egg")?.title, "遗传学");
assert.equal(lessons.find(lesson => lesson.kind === "self-study")?.summary, "由宝可梦自主学习，根据课堂状态调整个体值和努力值。");
