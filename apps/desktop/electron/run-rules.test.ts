import assert from "node:assert/strict";
import type {CurrentRunData, LocalSave, ShopOffer, TalentView} from "@changebattle/shared";
import {
  BP_SCALE,
  DIRECT_MOVE_COST,
  MOVE_DRAW_COST,
  RANDOMIZE_PART_COST,
  SCOUT_ALL_COST,
  SCOUT_BASIC_COST,
  SCOUT_ONE_COST,
  SECOND_TEAM_ROAR_COST,
  SHOP_ROLL_COST_FIRST,
  SHOP_ROLL_COST_GAMBLER_PAID,
  SHOP_ROLL_COST_NEXT,
  TALENTS,
  TALENT_EQUIP_LIMIT,
  addRunBp,
  applyProphetFirstMover,
  canDirectMove,
  canExchangeBoss,
  canScoutNext,
  canSecondTeamRoar,
  candidateCountForTalents,
  clearBonus,
  currentBp,
  exchangeCost,
  exchangeFullState,
  exchangeKeepsItem,
  exchangeStateRatio,
  gainedBp,
  hasTalent,
  itemCategory,
  moveDrawCost,
  moveDrawCount,
  pricedForShop,
  refundableBagBaseBpFromCosts,
  scoutCost,
  sellPriceForItem,
  settleProphetFirstMover,
  shopDuplicateBonusForOffers,
  shopCandidateCount,
  shopNextRollCost,
  shopOfferCount,
  spendBp,
  starterPurchaseLimit,
  statResetCost,
  talent,
} from "./run-rules.js";

function talents(ids: string[]): TalentView[] {
  return ids.map(id => talent(id));
}

function run(ids: string[] = [], patch: Partial<CurrentRunData> = {}): CurrentRunData {
  return {
    status: "awaiting_rest",
    seed: 1234,
    battles: 7,
    next_battle: 1,
    battle_no: 0,
    wins: 0,
    talents: talents(ids),
    player_team: [],
    player_display: [],
    bag_items: {},
    non_refundable_bag_items: {},
    rest_status: {exchanges: 0, taken_enemy_slots: []},
    ...patch,
  };
}

function save(bp: number): LocalSave {
  return {
    version: 1,
    bp_scale: BP_SCALE,
    trainer: {name: "测试员", gender: "other"},
    stats: {battle_points: bp, battles: 0, wins: 0, losses: 0, rank_status: "未开放"},
    current_run: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function assertThrowsWithoutChangingBp(action: () => void, playerSave: LocalSave): void {
  const before = currentBp(playerSave);
  assert.throws(action, /BP 不足/);
  assert.equal(currentBp(playerSave), before);
}

function testExchangeTalents(): void {
  const plain = run();
  assert.equal(exchangeCost(plain, 0), 0);
  assert.equal(exchangeCost(plain, 1), 1 * BP_SCALE);
  assert.equal(exchangeCost(plain, 2), 2 * BP_SCALE);
  assert.equal(exchangeFullState(plain), false);
  assert.equal(exchangeStateRatio(plain), 0.5);
  assert.equal(exchangeKeepsItem(plain), false);
  const plainGym = run([], {boss_type: "gym"});
  const plainElite4 = run([], {boss_type: "elite4"});
  assert.equal(canExchangeBoss(plainGym, 0), true);
  assert.equal(canExchangeBoss(plainGym, 1), false);
  assert.equal(exchangeCost(plainGym, 0), 2 * BP_SCALE);
  assert.equal(canExchangeBoss(plainElite4, 0), true);
  assert.equal(canExchangeBoss(plainElite4, 1), false);
  assert.equal(exchangeCost(plainElite4, 0), 2 * BP_SCALE);
  assert.equal(canExchangeBoss(run([], {boss_type: "normal"}), 2), true);

  assert.equal(exchangeFullState(run(["exchange_lossless"])), true);
  assert.equal(exchangeStateRatio(run(["exchange_lossless"])), 1);
  assert.equal(exchangeKeepsItem(run(["exchange_lossless"])), true);
  assert.equal(exchangeKeepsItem(run(["exchange_pickpocket"])), false);

  const gymRecognized = run(["exchange_gym_recognition"], {boss_type: "gym"});
  assert.equal(canExchangeBoss(gymRecognized, 0), true);
  assert.equal(canExchangeBoss(gymRecognized, 1), true);
  assert.equal(exchangeCost(gymRecognized, 0), 0);
  assert.equal(exchangeCost(gymRecognized, 1), 1 * BP_SCALE);
  const elite4Recognized = run(["exchange_gym_recognition"], {boss_type: "elite4"});
  assert.equal(canExchangeBoss(elite4Recognized, 0), true);
  assert.equal(canExchangeBoss(elite4Recognized, 1), true);
  assert.equal(exchangeCost(elite4Recognized, 0), 0);
  assert.equal(canExchangeBoss(run(["exchange_gym_recognition"], {boss_type: "champion"}), 0), false);
  assert.equal(exchangeFullState(gymRecognized), false);
  assert.equal(exchangeStateRatio(gymRecognized), 0.5);
  assert.equal(exchangeKeepsItem(gymRecognized), false);

  assert.equal(exchangeCost(run(["exchange_factory_freedom"]), 2), 0);
  assert.equal(canSecondTeamRoar(plain), false);
  assert.equal(canSecondTeamRoar(run(["exchange_second_team_roar"])), true);
  assert.equal(canSecondTeamRoar(run(["exchange_second_team_roar"], {second_team_roar_used: true})), false);
  assert.equal(SECOND_TEAM_ROAR_COST, 10 * BP_SCALE);
}

function testGamblerTalents(): void {
  assert.equal(moveDrawCount(run()), 2);
  assert.equal(moveDrawCount(run(["gambler_move_draw_4"])), 2);
  assert.equal(moveDrawCount(run(["gambler_shop_offer_5"])), 4);
  assert.equal(shopOfferCount(run()), 3);
  assert.equal(shopOfferCount(run(["gambler_shop_offer_5"])), 4);
  assert.equal(shopCandidateCount(run()), 4);
  assert.equal(shopCandidateCount(run(["gambler_shop_offer_5"])), 8);

  assert.equal(statResetCost(run(), RANDOMIZE_PART_COST, "ivs", 0.2), RANDOMIZE_PART_COST);
  assert.equal(statResetCost(run(["gambler_free_stat_reset"]), RANDOMIZE_PART_COST, "ivs", 0.2), 0);
  assert.equal(statResetCost(run(["gambler_free_stat_reset"]), RANDOMIZE_PART_COST, "ivs", 0.7), RANDOMIZE_PART_COST * 2);
  assert.equal(statResetCost(run(["gambler_free_stat_reset"]), RANDOMIZE_PART_COST, "ivs", 0.95), RANDOMIZE_PART_COST);

  assert.equal(shopNextRollCost(run()), SHOP_ROLL_COST_FIRST);
  assert.equal(shopNextRollCost(run([], {shop_roll_count: 1})), SHOP_ROLL_COST_NEXT);
  assert.equal(moveDrawCost(run()), MOVE_DRAW_COST);
  const lowStake = run(["gambler_random_cost_1"], {shop_roll_count: 0});
  assert.equal(shopNextRollCost(lowStake), 0);
  assert.equal(shopNextRollCost(run(["gambler_random_cost_1"], {shop_roll_count: 5, rest_status: {exchanges: 0, taken_enemy_slots: [], free_shop_roll_used: true}})), SHOP_ROLL_COST_GAMBLER_PAID);
  assert.equal(shopNextRollCost(run(["gambler_random_cost_1"], {shop_roll_count: 5, rest_status: {exchanges: 0, taken_enemy_slots: [], free_shop_rolls_remaining: 1}})), 0);
  assert.equal(moveDrawCost(lowStake), MOVE_DRAW_COST);

  assert.equal(hasTalent(run(["gambler_streak_bp_risk"]).talents, "gambler_streak_bp_risk"), true);
}

function testProphetTalents(): void {
  const plainSave = save(2000);
  assert.deepEqual(applyProphetFirstMover(plainSave, []), {active: false, amount: 0});
  assert.equal(currentBp(plainSave), 2000);

  const poorSave = save(999);
  assert.deepEqual(applyProphetFirstMover(poorSave, talents(["prophet_first_mover"])), {active: false, amount: 0});
  assert.equal(currentBp(poorSave), 999);

  const richSave = save(1000);
  assert.deepEqual(applyProphetFirstMover(richSave, talents(["prophet_first_mover"])), {active: false, amount: 0});
  assert.equal(currentBp(richSave), 1000);
  assert.equal(settleProphetFirstMover(richSave, run(["prophet_first_mover"], {temporary_bp_debt: 10 * BP_SCALE})), 0);
  assert.equal(currentBp(richSave), 1000);

  assert.equal(candidateCountForTalents([]), 6);
  assert.equal(candidateCountForTalents(talents(["prophet_candidate_12"])), 12);
  assert.equal(canScoutNext(run()), false);
  assert.equal(canScoutNext(run(["prophet_next_scout"])), true);
  assert.equal(scoutCost("basic"), SCOUT_BASIC_COST);
  assert.equal(scoutCost("one"), SCOUT_ONE_COST);
  assert.equal(scoutCost("all"), SCOUT_ALL_COST);
  assert.equal(SCOUT_ONE_COST, 0);
  assert.equal(SCOUT_ALL_COST, 3 * BP_SCALE);
  assert.equal(canDirectMove(run()), false);
  assert.equal(canDirectMove(run(["prophet_direct_move"])), true);
  assert.equal(DIRECT_MOVE_COST, 3 * BP_SCALE);
}

function testBusinessTalents(): void {
  const item = {id: "leftovers", name: "Leftovers", name_zh: "剩饭", cost: 501, desc: "", desc_zh: ""};
  assert.equal(starterPurchaseLimit([]), 1);
  assert.equal(starterPurchaseLimit(talents(["business_starter_3"])), 3);
  assert.equal(pricedForShop(item, []), 501);
  assert.equal(pricedForShop(item, talents(["business_discount_70"])), 350);
  assert.equal(sellPriceForItem(item, run()), 250);
  assert.equal(sellPriceForItem(item, run(["business_sell_full"])), 501);

  const bagRun = run([], {bag_items: {potion: 2, berry: 1}, non_refundable_bag_items: {potion: 1}});
  assert.equal(refundableBagBaseBpFromCosts(bagRun, {potion: 200, berry: 300}), 250);
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: talents(["business_refund_70"])}, {potion: 200, berry: 300}), 500);
  assert.equal(gainedBp(run(), 101), 101);
  assert.equal(gainedBp(run(["business_amulet_coin"]), 101), 151);
  assert.equal(gainedBp(run([], {player_display: [{shiny: true} as any]}), 100), 110);
  assert.equal(gainedBp(run([], {player_display: [{shiny: true} as any, {shiny: true} as any]}), 100), 121);
  assert.equal(gainedBp(run(["business_shiny_collector"], {player_display: [{shiny: true} as any]}), 100), 130);
  assert.equal(gainedBp(run(["business_shiny_collector"], {player_display: [{shiny: true} as any, {shiny: true} as any]}), 100), 169);
  assert.equal(gainedBp(run(["business_shiny_collector", "business_amulet_coin"], {player_display: [{shiny: true} as any]}), 100), 195);

  const playerSave = save(0);
  assert.equal(addRunBp(playerSave, run(["business_amulet_coin"]), 200), 300);
  assert.equal(currentBp(playerSave), 300);
  const bonusSave = save(0);
  bonusSave.stats.set_win_streak = 1;
  assert.equal(clearBonus(bonusSave, run(["business_amulet_coin"])).bonus, Math.floor((2 * 2 + 7) * BP_SCALE * 1.5));
}

function testCombinationsAndDefaults(): void {
  const plain = run();
  assert.equal(hasTalent(plain.talents, "exchange_lossless"), false);
  assert.equal(exchangeCost(plain, 1), 100);
  assert.equal(shopOfferCount(plain), 3);
  assert.equal(moveDrawCount(plain), 2);
  assert.equal(starterPurchaseLimit(plain.talents), 1);
  assert.equal(candidateCountForTalents(plain.talents), 6);
  assert.equal(gainedBp(plain, 100), 100);
  assert.equal(TALENT_EQUIP_LIMIT, 5);
  assert.equal(TALENTS.length, 23);
  assert.equal(talent("gambler_streak_bp_risk").name, "好运连连");
  assert.equal(talent("gambler_all_in_exchange").name, "孤注一掷");
  for (const id of ["exchange_safe_box", "prophet_next_scout", "business_shiny_collector"]) {
    assert.ok(talent(id));
  }

  const discountAndCoin = run(["business_discount_70", "business_amulet_coin"]);
  assert.equal(pricedForShop({id: "x", name: "X", name_zh: "X", cost: 100, desc: "", desc_zh: ""}, discountAndCoin.talents), 70);
  assert.equal(gainedBp(discountAndCoin, 100), 150);

  assert.equal(itemCategory({id: "tm:thunderbolt", name: "TM Thunderbolt", name_zh: "技能机器 十万伏特", desc: "", desc_zh: ""}), "tm");
  assert.notEqual(itemCategory({id: "tm:thunderbolt", name: "TM Thunderbolt", name_zh: "技能机器 十万伏特", desc: "", desc_zh: ""}), "consumable");
  assert.equal(itemCategory({id: "potion", name: "Potion", name_zh: "伤药", desc: "Restores HP", desc_zh: "恢复 HP"}), "consumable");

  const playerSave = save(50);
  assertThrowsWithoutChangingBp(() => spendBp(playerSave, 100), playerSave);
  spendBp(playerSave, 50);
  assert.equal(currentBp(playerSave), 0);
}

function offer(id: string, index: number): ShopOffer {
  return {id, name: id, name_zh: id, cost: 100, desc: "", desc_zh: "", offer_id: `offer-${index}`, category: "held", source: "shop"};
}

function testShopDuplicateBonus(): void {
  assert.equal(shopDuplicateBonusForOffers([offer("a", 0), offer("b", 1), offer("c", 2)]), null);
  assert.deepEqual(shopDuplicateBonusForOffers([offer("a", 0), offer("a", 1), offer("c", 2)]), {item_id: "a", name: "a", name_zh: "a", count: 1, match_count: 2, icon_asset: undefined});
  assert.deepEqual(shopDuplicateBonusForOffers([offer("a", 0), offer("b", 1), offer("a", 2), offer("a", 3), offer("b", 4)]), {item_id: "a", name: "a", name_zh: "a", count: 2, match_count: 3, icon_asset: undefined});
  assert.deepEqual(shopDuplicateBonusForOffers([offer("a", 0), offer("b", 1), offer("b", 2), offer("a", 3)]), {item_id: "a", name: "a", name_zh: "a", count: 1, match_count: 2, icon_asset: undefined});
}

testExchangeTalents();
testGamblerTalents();
testProphetTalents();
testBusinessTalents();
testCombinationsAndDefaults();
testShopDuplicateBonus();

console.log("Desk talent rule tests passed.");
