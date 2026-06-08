import assert from "node:assert/strict";
import type {CurrentRunData, LocalSave, ShopOffer, TalentView} from "@changebattle/shared";
import {
  BP_SCALE,
  MOVE_DRAW_COST,
  RANDOMIZE_PART_COST,
  SCOUT_ALL_COST,
  SCOUT_BASIC_COST,
  SCOUT_ONE_COST,
  SHOP_ROLL_COST_FIRST,
  SHOP_ROLL_COST_GAMBLER_PAID,
  SHOP_ROLL_COST_NEXT,
  TALENTS,
  TALENT_EQUIP_LIMIT,
  addRunBp,
  canDirectMove,
  canExchangeBoss,
  canScoutNext,
  candidateCountForTalents,
  clearBonus,
  convertibleCoinsForSettlement,
  currentBp,
  currentCoins,
  exchangeCost,
  exchangeFullState,
  exchangeKeepsItem,
  exchangeStateRatio,
  gainedBp,
  hasTalent,
  itemCategory,
  moveDrawCost,
  moveDrawCount,
  normalizeStarterUpgrades,
  portfolioBonus,
  portfolioSpendTypeForLabel,
  pricedForShop,
  recordPortfolioSpend,
  refundableBagBaseBpFromCosts,
  scoutCost,
  sellPriceForItem,
  shopCandidateCount,
  shopDuplicateBonusForOffers,
  shopNextRollCost,
  shopOfferCount,
  spendBp,
  spendCoins,
  starterCoinsForSeed,
  starterNonConvertibleCoinsForTalents,
  starterUpgradeLevel,
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

function testTalentCatalog(): void {
  assert.equal(TALENT_EQUIP_LIMIT, 5);
  assert.equal(TALENTS.length, 28);
  assert.deepEqual(TALENTS.filter(entry => entry.disabled).map(entry => entry.id), []);
  assert.equal(talent("starter_angel_fund").name, "天使基金");
  assert.equal(talent("exchange_stalwart").cost, 20);
  assert.equal(talent("growth_all_in").name, "孤注一掷");
  assert.throws(() => talent("exchange_safe_box"));
  assert.throws(() => talent("prophet_next_scout"));
}

function testStarterTalents(): void {
  assert.equal(candidateCountForTalents([]), 6);
  assert.equal(starterCoinsForSeed(1), 0);
  assert.equal(starterCoinsForSeed(1, talents(["starter_angel_fund"])), 1000);
  assert.equal(starterNonConvertibleCoinsForTalents(talents(["starter_angel_fund"])), 1000);
  const upgrades = normalizeStarterUpgrades({item_quantity: {battle: 0, recovery: 0, berry: 0, tm: 0}});
  assert.equal(starterUpgradeLevel(upgrades, "item_quantity:battle"), 2);
  assert.equal(starterUpgradeLevel(upgrades, "item_quantity:recovery"), 2);
  assert.equal(starterUpgradeLevel(upgrades, "item_quantity:berry"), 2);
  assert.equal(starterUpgradeLevel(upgrades, "item_quantity:tm"), 2);
  assert.equal(starterUpgradeLevel(upgrades, "item_quality:battle"), 1);
}

function testExchangeTalents(): void {
  const plain = run();
  assert.equal(exchangeCost(plain, 0), 0);
  assert.equal(exchangeCost(plain, 1), 1 * BP_SCALE);
  assert.equal(exchangeCost(plain, 2), 2 * BP_SCALE);
  assert.equal(exchangeFullState(plain), false);
  assert.equal(exchangeStateRatio(plain), 0.5);
  assert.equal(exchangeKeepsItem(plain), false);

  const careful = run(["exchange_careful"]);
  assert.equal(exchangeFullState(careful), true);
  assert.equal(exchangeStateRatio(careful), 1);
  assert.equal(exchangeKeepsItem(careful), true);

  const plainGym = run([], {boss_type: "gym"});
  assert.equal(canExchangeBoss(plainGym, 0), true);
  assert.equal(canExchangeBoss(plainGym, 1), false);
  assert.equal(exchangeCost(plainGym, 0), 2 * BP_SCALE);

  const gymRecognized = run(["exchange_gym_recognition"], {boss_type: "gym"});
  assert.equal(canExchangeBoss(gymRecognized, 0), true);
  assert.equal(canExchangeBoss(gymRecognized, 1), true);
  assert.equal(exchangeCost(gymRecognized, 1), 1 * BP_SCALE);
  assert.equal(canExchangeBoss(run(["exchange_gym_recognition"], {boss_type: "champion"}), 0), false);

  assert.equal(exchangeCost(run(["exchange_factory_freedom"]), 2), 0);
}

function testGrowthTalents(): void {
  assert.equal(moveDrawCount(run()), 8);
  assert.equal(moveDrawCount(run(["growth_more_choices"])), 16);
  assert.equal(shopOfferCount(run()), 3);
  assert.equal(shopOfferCount(run(["growth_more_choices"])), 4);
  assert.equal(shopCandidateCount(run()), 4);
  assert.equal(shopCandidateCount(run(["growth_more_choices"])), 8);
  assert.equal(moveDrawCost(run()), MOVE_DRAW_COST);

  assert.equal(statResetCost(run(), RANDOMIZE_PART_COST, "ivs", 0.2), RANDOMIZE_PART_COST);
  assert.equal(statResetCost(run(["growth_fate"]), RANDOMIZE_PART_COST, "ivs", 0.2), 0);
  assert.equal(statResetCost(run(["growth_fate"]), RANDOMIZE_PART_COST, "ivs", 0.7), RANDOMIZE_PART_COST * 2);
  assert.equal(statResetCost(run(["growth_fate"]), RANDOMIZE_PART_COST, "ivs", 0.95), RANDOMIZE_PART_COST);

  assert.equal(shopNextRollCost(run()), SHOP_ROLL_COST_FIRST);
  assert.equal(shopNextRollCost(run([], {shop_roll_count: 1})), SHOP_ROLL_COST_NEXT);
  assert.equal(shopNextRollCost(run(["growth_vip_guest"], {shop_roll_count: 5, rest_status: {exchanges: 0, taken_enemy_slots: [], free_shop_rolls_remaining: 1}})), 0);
  assert.equal(shopNextRollCost(run(["growth_vip_guest"], {shop_roll_count: 5})), SHOP_ROLL_COST_GAMBLER_PAID);
}

function testIntelTalents(): void {
  assert.equal(canScoutNext(run()), false);
  assert.equal(canScoutNext(run(["intel_rumor"])), true);
  assert.equal(scoutCost("basic"), SCOUT_BASIC_COST);
  assert.equal(scoutCost("one"), SCOUT_ONE_COST);
  assert.equal(scoutCost("all"), SCOUT_ALL_COST);
  assert.equal(canDirectMove(run()), false);
}

function testEconomyTalents(): void {
  const item = {id: "leftovers", name: "Leftovers", name_zh: "剩饭", cost: 501, desc: "", desc_zh: ""};
  assert.equal(pricedForShop(item, []), 501);
  assert.equal(pricedForShop(item, talents(["economy_bargainer"])), 501);
  assert.equal(sellPriceForItem(item, run()), 250);
  assert.equal(sellPriceForItem(item, run(["economy_bargainer"])), 375);

  const bagRun = run([], {bag_items: {potion: 2, berry: 1}, non_refundable_bag_items: {potion: 1}});
  assert.equal(refundableBagBaseBpFromCosts(bagRun, {potion: 200, berry: 300}), 125);
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: talents(["economy_premium_guest"])}, {potion: 200, berry: 300}), 250);
  assert.equal(refundableBagBaseBpFromCosts(bagRun, {potion: 200, berry: 300}, "loss"), 50);
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: talents(["economy_premium_guest"])}, {potion: 200, berry: 300}, "loss"), 100);

  assert.equal(gainedBp(run(), 100), 100);
  assert.equal(gainedBp(run(["economy_amulet_coin"]), 100), 135);
  assert.equal(gainedBp(run([], {player_display: [{shiny: true} as any]}), 100), 110);
  assert.equal(gainedBp(run(["economy_shiny_collector"], {player_display: [{shiny: true} as any]}), 100), 130);
  assert.equal(gainedBp(run(["economy_shiny_collector", "economy_amulet_coin"], {player_display: [{shiny: true} as any]}), 100), 175);

  const playerSave = save(0);
  assert.equal(addRunBp(playerSave, run(["economy_amulet_coin"]), 200), 270);
  assert.equal(currentBp(playerSave), 0);
  const bonusSave = save(0);
  bonusSave.stats.set_win_streak = 1;
  assert.equal(clearBonus(bonusSave, run(["economy_amulet_coin"])).bonus, Math.floor((2 * 2 + 7) * BP_SCALE * 1.35));

  assert.equal(portfolioSpendTypeForLabel("shop-buy:potion"), "商店");
  assert.equal(portfolioSpendTypeForLabel("adjust-move"), "技能");
  const portfolioRun = run(["economy_portfolio"]);
  recordPortfolioSpend(portfolioRun, "shop-buy:potion", 100);
  recordPortfolioSpend(portfolioRun, "shop-roll", 50);
  recordPortfolioSpend(portfolioRun, "exchange", 100);
  assert.deepEqual(portfolioBonus(portfolioRun), {types: ["商店", "交换"], bonus: 400});

  const angelRun = run(["starter_angel_fund"], {coins: 1000, non_convertible_coins: 1000});
  assert.deepEqual(convertibleCoinsForSettlement(angelRun), {convertibleCoins: 0, excludedCoins: 1000});
  spendCoins(angelRun, 600);
  assert.equal(currentCoins(angelRun), 400);
  assert.deepEqual(convertibleCoinsForSettlement(angelRun), {convertibleCoins: 0, excludedCoins: 400});
  addRunBp(save(0), angelRun, 500);
  assert.deepEqual(convertibleCoinsForSettlement(angelRun), {convertibleCoins: 500, excludedCoins: 400});
  spendCoins(angelRun, 400);
  assert.deepEqual(convertibleCoinsForSettlement(angelRun), {convertibleCoins: 500, excludedCoins: 0});
}

function testDefaultsAndHelpers(): void {
  const plain = run();
  assert.equal(hasTalent(plain.talents, "exchange_careful"), false);
  assert.equal(itemCategory({id: "tm:thunderbolt", name: "TM Thunderbolt", name_zh: "技能机器 十万伏特", desc: "", desc_zh: ""}), "tm");
  assert.equal(itemCategory({id: "potion", name: "Potion", name_zh: "伤药", desc: "Restores HP", desc_zh: "恢复 HP"}), "consumable");

  const playerSave = save(50);
  assert.throws(() => spendBp(playerSave, 100), /BP 不足/);
  assert.equal(currentBp(playerSave), 50);
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
}

testTalentCatalog();
testStarterTalents();
testExchangeTalents();
testGrowthTalents();
testIntelTalents();
testEconomyTalents();
testDefaultsAndHelpers();
testShopDuplicateBonus();

console.log("Desk talent rule tests passed.");
