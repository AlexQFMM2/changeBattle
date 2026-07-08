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
  formalShopGenerationRuleV4,
  formalShopItemPoolForCategoryV4,
  FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY,
  FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL,
  FORMAL_SHOP_PARENTING_ITEM_POOL,
  FORMAL_SHOP_EVOLUTION_ITEM_POOL,
  FORMAL_SHOP_ITEM_POOL,
  formalTrainingGroundLessonTableV4,
  soulmateEvolutionFriendshipRequirementV4,
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
assert.equal(soulmateEvolutionFriendshipRequirementV4(0), 100);
assert.equal(soulmateEvolutionFriendshipRequirementV4(1), 200);
assert.equal(soulmateEvolutionFriendshipRequirementV4(2), null);
assert.deepEqual(FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY, {
  recovery: 0,
  berry: 0,
  battle: 1,
  training: 2,
  parenting: 2,
  evolution: 2,
  tm: 2,
});
assert.ok(FORMAL_SHOP_PARENTING_ITEM_POOL.includes("heartscale"));
assert.ok(FORMAL_SHOP_PARENTING_ITEM_POOL.includes("forbiddenmanual"));
assert.ok(FORMAL_SHOP_EVOLUTION_ITEM_POOL.includes("universal-evolution-stone"));
assert.ok(FORMAL_SHOP_EVOLUTION_ITEM_POOL.includes("linking-cord"));
assert.ok(!FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.some(itemID => ["rarecandy", "ppup", "ppmax", "abilitycapsule", "abilitypatch"].includes(itemID)));
assert.ok(FORMAL_SHOP_ITEM_POOL.recovery.length > 0);
assert.equal(formalShopGenerationRuleV4(false).id, "standard");
assert.equal(formalShopGenerationRuleV4(true).id, "pendingSettlement");
assert.deepEqual(formalShopItemPoolForCategoryV4("recovery", true), []);
assert.deepEqual(formalShopItemPoolForCategoryV4("berry", true), []);
assert.equal(formalShopItemPoolForCategoryV4("training", true), FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL);
assert.equal(formalShopItemPoolForCategoryV4("training", false), FORMAL_SHOP_ITEM_POOL.training);

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
