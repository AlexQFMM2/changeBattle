import assert from "node:assert/strict";
import type {BagItemView, BattleState, BattleTimelineEvent, CurrentRunData, LocalSave, PricedMove, ShopOffer, TalentView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {buildRuntimeResultSummary, normalEnemySpeciesTiersForBattle, recordRuntimeBattleStats, settleBasicBattleResult} from "@changebattle/game-runtime";
import {cloneBattleViewSnapshot, dedupeBattleViewPartySnapshot} from "../src/components/battle/battlePartySnapshot.ts";
import {buildBattleDisplaySteps} from "../src/components/battle/timelineFlow.ts";
import {resolveTmMoveIdForSlot, tmMoveSearchQuery} from "../src/components/bag/bagModel.ts";
import {pokemonDexDetailTabs} from "../src/components/dex/learnsetGroups.ts";
import {debugPokemon} from "../src/lib/ui.tsx";
import {
  BP_SCALE,
  MOVE_DRAW_COST,
  RANDOMIZE_ALL_COST,
  RANDOMIZE_PART_COST,
  SCOUT_ALL_COST,
  SCOUT_BASIC_COST,
  SCOUT_ONE_COST,
  SHOP_ROLL_COST_FIRST,
  SHOP_ROLL_COST_GAMBLER_PAID,
  SHOP_ROLL_COST_NEXT,
  SOUL_SWAP_TURN_LIMIT,
  SCORE_BET_MIN_STAKE,
  STAR_CHART_NODES,
  TALENTS,
  TRAINING_SHOP_GROUP_WEIGHTS,
  addCoins,
  applyAllInExchange,
  applyRestShopDiscountCoupon,
  applyRestShopKindDiscount,
  addRunBp,
  addBattleRewardCoins,
  battleRewardCoinBreakdown,
  canDirectMove,
  canExchangeBoss,
  canScoutNext,
  candidateCountForTalents,
  clearBonus,
  convertibleCoinsForSettlement,
  currentBp,
  currentCoins,
  enableTestModeForSave,
  enemyAiProfileForRunRoute,
  exchangeCost,
  exchangeFullState,
  exchangeKeepsItem,
  exchangeStateRatio,
  fullStateForPokemon,
  gainedBp,
  hasTalent,
  isPremiumHeldShopEntry,
  isRestShopDiscountCoupon,
  isTaskRewardItemId,
  isTrainingShopItemId,
  itemCategory,
  moveDrawCost,
  moveDrawCount,
  normalizeStarterUpgrades,
  normalizeTalentViews,
  portfolioBonus,
  portfolioSpendTypeForLabel,
  profiteerShopItemIds,
  profiteerShopPrice,
  premiumMachineMoveCandidates,
  pricedForShop,
  recordPortfolioSpend,
  refundableBagBaseBpFromCosts,
  rookieNormalNpcAiProfile,
  runQuestStatus,
  scoutCost,
  sellPriceForItem,
  scoreBetMaxStakeForCoins,
  scoreBetMultiplier,
  scoreBetPayout,
  shopCandidateCount,
  shopDuplicateBonusForOffers,
  shopNextRollCost,
  shopOfferCount,
  shouldForceSoulSwapTimeout,
  soulSwapAllowedForNextBattle,
  soulSwapEnemyAiProfile,
  startRunQuest,
  spendBp,
  spendCoins,
  spendRunCoins,
  settleScoreBetResult,
  starNodeLevel,
  starterCoinsForSeed,
  starterNonConvertibleCoinsForTalents,
  starterUpgradeLevel,
  statResetCost,
  talent,
  tmIconAssetForMoveType,
  trainingShopGroupForItemId,
  updateRunQuestAfterBattle,
  updateRunQuestAfterRest,
  barterRunShopOffer,
  buyRunShopOffer,
  forgeRunItems,
  forgeRunSpecialItem,
  sellRunBagItem,
} from "./run-rules.js";

function talents(ids: string[]): TalentView[] {
  return ids.map(id => talent(id));
}

function talentAtLevel(id: string, level: number): TalentView {
  return {...talent(id), level};
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

function testEnableTestMode(): void {
  const next = enableTestModeForSave(save(12));
  assert.equal(next.stats.battle_points, 99999);
  assert.equal(starNodeLevel(next.star_chart, "intel_rumor"), 3);
  assert.equal(starNodeLevel(next.star_chart, "growth_all_in"), 1);
  assert.equal(starNodeLevel(next.star_chart, "item_quantity:battle"), 4);
  assert.equal(next.starter_upgrades?.item_quantity?.battle, 4);
  assert.ok(next.talent_unlocks?.includes("intel_rumor"));
  assert.ok(next.talent_unlocks?.includes("growth_all_in"));
  const activeRunSave = save(0);
  activeRunSave.current_run = run(["intel_rumor"]);
  const activeRunNext = enableTestModeForSave(activeRunSave);
  assert.equal(activeRunNext.current_run?.talents?.find(entry => entry.id === "intel_rumor")?.level, 3);
  assert.equal(activeRunNext.current_run?.talents?.some(entry => entry.id === "growth_all_in"), true);
  const normalized = normalizeTalentViews([talentAtLevel("intel_rumor", 3)]);
  assert.equal(normalized.find(entry => entry.id === "intel_rumor")?.level, 3);
  const multiLevelActiveNodes = STAR_CHART_NODES.filter(node => (node.kind === "talent" || node.kind === "badge") && node.max_level > 1);
  const normalizedMultiLevel = normalizeTalentViews(multiLevelActiveNodes.map(node => ({id: node.id, level: node.max_level} as TalentView)));
  for (const node of multiLevelActiveNodes) {
    const normalizedNode = normalizedMultiLevel.find(entry => entry.id === node.id);
    assert.equal(normalizedNode?.level, node.max_level, `${node.id} should keep level ${node.max_level}`);
    assert.equal(normalizedNode?.kind, node.kind, `${node.id} should keep kind ${node.kind}`);
  }
}

async function testAllInExchangePenalty(): Promise<void> {
  const display = ["Alpha", "Beta", "Gamma"].map((species, index) => ({...debugPokemon(species, `测试${index + 1}`), level: 30, showdown_id: `testball${index + 1}`}));
  const playerState = display.map((pokemon, index) => fullStateForPokemon(pokemon, index + 1));
  const testRun = run(["growth_all_in"], {
    player_team: display.map((pokemon, index) => ({species: pokemon.species, level: pokemon.level, moves: ["tackle"], showdown_id: `testball${index + 1}`}) as any),
    player_display: display,
    player_state: playerState,
  });
  const generatedDisplay = {...debugPokemon("Delta", "测试替换"), level: 30, showdown_id: "replacementball"};
  await applyAllInExchange(save(0), testRun, 0, {
    raw: {species: generatedDisplay.species, level: generatedDisplay.level, moves: ["tackle"], showdown_id: "replacementball"} as any,
    display: generatedDisplay,
  }, {describeTeam: async () => []});
  assert.equal(testRun.player_state?.[0]?.status, "");
  assert.equal(testRun.player_state?.[1]?.hp, Math.max(1, Math.floor(Number(testRun.player_state?.[1]?.maxhp || 1) / 2)));
  assert.equal(testRun.player_state?.[1]?.status, "slp");
  assert.equal(testRun.player_state?.[2]?.hp, Math.max(1, Math.floor(Number(testRun.player_state?.[2]?.maxhp || 1) / 2)));
  assert.equal(testRun.player_state?.[2]?.status, "slp");
  assert.equal(testRun.rest_status?.all_in_pending_next, true);
}

function testTalentCatalog(): void {
  assert.equal(TALENTS.length, 27);
  assert.deepEqual(TALENTS.filter(entry => entry.disabled).map(entry => entry.id), []);
  assert.equal(talent("starter_angel_fund").name, "天使基金");
  assert.equal(talent("exchange_stalwart").cost, 20);
  assert.equal(talent("growth_all_in").name, "孤注一掷");
  assert.throws(() => talent("intel_shop_strategy"));
  assert.throws(() => talent("exchange_safe_box"));
  assert.throws(() => talent("prophet_next_scout"));
}

function testStarterTalents(): void {
  assert.equal(candidateCountForTalents([]), 6);
  assert.equal(starterCoinsForSeed(1), 0);
  assert.equal(starterCoinsForSeed(1, talents(["starter_angel_fund"])), 300);
  assert.equal(starterCoinsForSeed(1, [talentAtLevel("starter_angel_fund", 2)]), 600);
  assert.equal(starterCoinsForSeed(1, [talentAtLevel("starter_angel_fund", 3)]), 1000);
  assert.equal(starterNonConvertibleCoinsForTalents([talentAtLevel("starter_angel_fund", 3)]), 1000);
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
  assert.equal(moveDrawCount(run(["growth_more_choices"])), 10);
  assert.equal(moveDrawCount(run([], {talents: [talentAtLevel("growth_more_choices", 4)]})), 24);
  assert.equal(shopOfferCount(run()), 3);
  assert.equal(shopOfferCount(run(["growth_more_choices"])), 4);
  assert.equal(shopOfferCount(run([], {talents: [talentAtLevel("growth_more_choices", 4)]})), 7);
  assert.equal(shopCandidateCount(run()), 4);
  assert.equal(shopCandidateCount(run(["growth_more_choices"])), 5);
  assert.equal(shopCandidateCount(run([], {talents: [talentAtLevel("growth_more_choices", 4)]})), 8);
  assert.equal(MOVE_DRAW_COST, 100);
  assert.equal(RANDOMIZE_PART_COST, 50);
  assert.equal(RANDOMIZE_ALL_COST, 150);
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
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: talents(["economy_premium_guest"])}, {potion: 200, berry: 300}), 150);
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: [talentAtLevel("economy_premium_guest", 3)]}, {potion: 200, berry: 300}), 250);
  assert.equal(refundableBagBaseBpFromCosts(bagRun, {potion: 200, berry: 300}, "loss"), 50);
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: talents(["economy_premium_guest"])}, {potion: 200, berry: 300}, "loss"), 60);
  assert.equal(refundableBagBaseBpFromCosts({...bagRun, talents: [talentAtLevel("economy_premium_guest", 3)]}, {potion: 200, berry: 300}, "loss"), 100);

  assert.equal(gainedBp(run(), 100), 100);
  assert.equal(gainedBp(run(["economy_amulet_coin"]), 100), 110);
  assert.equal(gainedBp(run([], {talents: [talentAtLevel("economy_amulet_coin", 3)]}), 100), 135);
  assert.equal(gainedBp(run([], {player_display: [{shiny: true} as any]}), 100), 110);
  assert.equal(gainedBp(run(["economy_shiny_collector"], {player_display: [{shiny: true} as any]}), 100), 130);
  assert.equal(gainedBp(run([], {talents: [talent("economy_shiny_collector"), talentAtLevel("economy_amulet_coin", 3)], player_display: [{shiny: true} as any]}), 100), 175);
  assert.deepEqual(battleRewardCoinBreakdown(run([], {talents: [talentAtLevel("economy_amulet_coin", 3)]}), 500), {base: 500, shinyBonus: 0, amuletBonus: 175, total: 675});
  const rewardRun = run([], {talents: [talentAtLevel("economy_amulet_coin", 3)]});
  assert.equal(addBattleRewardCoins(rewardRun, 500), 675);
  assert.equal(currentCoins(rewardRun), 675);
  assert.deepEqual((rewardRun.coin_ledger || []).map(entry => ({label: entry.label, amount: entry.amount})), [
    {label: "护符金币", amount: 175},
    {label: "战斗对局奖励", amount: 500},
  ]);

  const playerSave = save(0);
  assert.equal(addRunBp(playerSave, run([], {talents: [talentAtLevel("economy_amulet_coin", 3)]}), 200), 270);
  assert.equal(currentBp(playerSave), 0);
  const bonusSave = save(0);
  bonusSave.stats.set_win_streak = 1;
  assert.equal(clearBonus(bonusSave, run([], {talents: [talentAtLevel("economy_amulet_coin", 3)]})).bonus, Math.floor((2 * 2 + 7) * BP_SCALE * 1.35));

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

  const lossSave = save(0);
  const lossRun = run([], {coins: 2000, bag_items: {potion: 2}, recycle_receipt_value: 100});
  lossSave.current_run = lossRun;
  const lossSettlement = settleBasicBattleResult(lossSave, lossRun, {winner: "Enemy"} as any, {
    playerWon: false,
    defaultBattles: 7,
    itemCosts: {potion: 200},
  });
  assert.equal(lossSettlement.outcome, "loss");
  assert.equal(lossSettlement.settled.refundBase, 40);
  assert.equal(lossSettlement.settled.convertedCoins, 2040);
  assert.equal(lossSettlement.settled.convertedBp, 20);
  assert.equal(currentCoins(lossRun), 0);
  assert.equal(lossSave.current_run, null);

  const summaryRun = run([], {coins: 0});
  addCoins(summaryRun, 500, "battle-reward:base", "战斗对局奖励");
  spendCoins(summaryRun, 120, "shop-buy:potion", "商店购买");
  const summary = buildRuntimeResultSummary({
    outcome: "win",
    headline: "通关",
    wins: 7,
    run: summaryRun,
    settled: {paidBack: 0, refundBase: 0, refundGained: 0, receiptBonus: 0, portfolioBonus: 0, portfolioTypes: [], convertedCoins: 380, excludedCoins: 0, convertedBp: 3},
    defaultBattles: 7,
  });
  assert.equal(summary.coin_ledger?.length, 2);
  assert.equal(summary.coin_rows?.find(row => row.label === "本局收入流水")?.value, "500金币");
  assert.equal(summary.coin_rows?.find(row => row.label === "本局支出流水")?.value, "120金币");
  assert.equal(summary.coin_rows?.find(row => row.label === "金币折算 BP")?.value, "380金币 -> 3BP");
}

function testCoinLedgerAndTrainingRules(): void {
  assert.equal(isTrainingShopItemId("pomegberry"), true);
  assert.equal(isTrainingShopItemId("hpup"), true);
  assert.equal(isTrainingShopItemId("bottlecap"), true);
  assert.equal(isTrainingShopItemId("goldbottlecap"), true);
  assert.equal(isTrainingShopItemId("rarecandy"), true);
  assert.equal(isTrainingShopItemId("leftovers"), false);
  assert.equal(isTrainingShopItemId("potion"), false);
  assert.deepEqual(TRAINING_SHOP_GROUP_WEIGHTS, {ev_berry: 30, vitamin: 30, cap: 10, ability: 10, mint: 10, candy: 10});
  assert.equal(trainingShopGroupForItemId("pomegberry"), "ev_berry");
  assert.equal(trainingShopGroupForItemId("hpup"), "vitamin");
  assert.equal(trainingShopGroupForItemId("bottlecap"), "cap");
  assert.equal(trainingShopGroupForItemId("abilitypatch"), "ability");
  assert.equal(trainingShopGroupForItemId("adamantmint"), "mint");
  assert.equal(trainingShopGroupForItemId("rarecandy"), "candy");

  const ledgerRun = run([], {coins: 100});
  addCoins(ledgerRun, 50, "sponsor-delivery");
  spendRunCoins(ledgerRun, 30, "shop-roll:training", {alreadyPriced: true});
  assert.equal(currentCoins(ledgerRun), 120);
  assert.equal(ledgerRun.coin_ledger?.length, 2);
  assert.deepEqual(ledgerRun.coin_ledger?.map(entry => [entry.type, entry.amount, entry.before, entry.after, entry.label]), [
    ["spend", 30, 150, 120, "商店抽奖"],
    ["gain", 50, 100, 150, "赞助到账"],
  ]);

  for (let index = 0; index < 120; index += 1) addCoins(ledgerRun, 1, "gain");
  assert.equal(ledgerRun.coin_ledger?.length, 100);
  assert.equal(ledgerRun.coin_ledger?.[0]?.after, currentCoins(ledgerRun));
}

function testRestShopDiscountCoupons(): void {
  assert.equal(isRestShopDiscountCoupon("trainingcoupon"), true);
  assert.equal(isTaskRewardItemId("tmcoupon"), true);
  assert.equal(isTaskRewardItemId("potion"), false);

  const couponRun = run([], {
    coins: 500,
    bag_items: {recoverycoupon: 2, tmcoupon: 1},
    rest_status: {exchanges: 0, taken_enemy_slots: []},
  });
  assert.equal(applyRestShopKindDiscount(couponRun, "recovery", 50), 50);
  const message = applyRestShopDiscountCoupon(couponRun, "recoverycoupon");
  assert.match(message, /5 折/);
  assert.equal(couponRun.bag_items?.recoverycoupon, 1);
  assert.equal(applyRestShopKindDiscount(couponRun, "recovery", 50), 25);
  assert.equal(applyRestShopKindDiscount(couponRun, "held", 75), 75);
  assert.equal(moveDrawCost(couponRun), MOVE_DRAW_COST);

  const repeat = applyRestShopDiscountCoupon(couponRun, "recoverycoupon");
  assert.match(repeat, /已生效/);
  assert.equal(couponRun.bag_items?.recoverycoupon, 1);

  const pricedOffer: ShopOffer = {id: "potion", name: "Potion", name_zh: "回复药", desc: "", desc_zh: "", cost: applyRestShopKindDiscount(couponRun, "recovery", 20), category: "consumable", offer_id: "offer-potion"};
  buyRunShopOffer(couponRun, pricedOffer);
  assert.equal(currentCoins(couponRun), 490);
  assert.equal(couponRun.coin_ledger?.[0]?.amount, 10);
  assert.equal(couponRun.coin_ledger?.[0]?.label, "商店购买");
  assert.equal(couponRun.shop_purchased_item_counts?.potion, 1);
  assert.equal(couponRun.shop_purchased_offer_counts?.["offer-potion"], 1);
  const nextDisplayedCost = applyRestShopKindDiscount(couponRun, "recovery", 20 + 10);
  assert.equal(nextDisplayedCost, 15);

  const taskRun = run([], {
    coins: 100,
    bag_items: {tmcoupon: 1, potion: 3},
    rest_status: {exchanges: 0, taken_enemy_slots: [], recycler_available: true, event_barter_active: true},
  });
  assert.throws(() => sellRunBagItem(save(0), taskRun, "tmcoupon", {cost: 100, name: "TM Coupon", name_zh: "技能机器商店折扣券"}), /任务奖励道具不能出售/);
  assert.throws(() => forgeRunItems(taskRun, ["tmcoupon", "potion", "potion"], []), /任务奖励道具不能用于重铸/);
  assert.throws(() => forgeRunSpecialItem(taskRun, "tmcoupon", {id: "leftovers", name: "Leftovers", name_zh: "剩饭", desc: "", desc_zh: "", cost: 800}, 50), /任务奖励道具不能用于重铸/);
  assert.throws(() => barterRunShopOffer(taskRun, {id: "leftovers", name: "Leftovers", name_zh: "剩饭", desc: "", desc_zh: "", cost: 100, category: "held", offer_id: "leftovers-offer"}, [{item: {id: "tmcoupon", name: "TM Coupon", name_zh: "技能机器商店折扣券", desc: "", desc_zh: "", cost: 100}}]), /任务奖励道具不能用于以物易物/);
}

function testProfiteerShopRules(): void {
  const baseRun = run();
  assert.deepEqual(profiteerShopItemIds(baseRun), ["maxpotion", "revive", "fullheal"]);
  assert.deepEqual(profiteerShopItemIds(run([], {talents: [talentAtLevel("growth_more_choices", 1)]})), ["maxpotion", "revive", "fullheal", "maxether"]);
  assert.deepEqual(profiteerShopItemIds(run([], {talents: [talentAtLevel("growth_more_choices", 4)]})), ["maxpotion", "revive", "fullheal", "maxether", "maxelixir", "fullrestore", "revivalherb"]);
  assert.equal(profiteerShopPrice(160), 240);
  assert.equal(profiteerShopPrice(15), 23);
  assert.equal(profiteerShopPrice(0), 0);
}

function testRunQuests(): void {
  const aceRun = run([], {coins: 0});
  assert.match(startRunQuest(aceRun, "ace_trial"), /王牌试炼/);
  assert.throws(() => startRunQuest(aceRun, "type_expert"), /已有进行中的任务/);
  assert.equal(updateRunQuestAfterBattle(aceRun, {
    playerWon: true,
    statEvents: [
      {battle_no: 1, turn: 1, pokemon_key: "alpha", kind: "kill", value: 2},
      {battle_no: 1, turn: 2, pokemon_key: "alpha", kind: "kill", value: 3},
    ],
    timelineEvents: [],
    playerSide: "p1",
  }), "任务完成：王牌试炼，获得 500金币、训练商店折扣券。");
  assert.equal(aceRun.active_quest, undefined);
  assert.equal(currentCoins(aceRun), 500);
  assert.equal(aceRun.bag_items?.trainingcoupon, 1);
  assert.equal(aceRun.coin_ledger?.[0]?.label, "王牌试炼奖励");

  const championRun = run();
  startRunQuest(championRun, "winning_champion");
  assert.equal(updateRunQuestAfterBattle(championRun, {playerWon: true, playerState: [{hp: 1, maxhp: 10} as any], timelineEvents: [], playerSide: "p1"}), "任务失败：常胜冠军。");
  assert.equal(championRun.active_quest, undefined);

  const typeRun = run([], {coins: 0});
  startRunQuest(typeRun, "type_expert");
  assert.equal(updateRunQuestAfterBattle(typeRun, {
    playerWon: true,
    timelineEvents: Array.from({length: 8}, (_, index) => ({id: `e${index}`, type: "effectiveness", text: "效果拔群！", effect: "super effective"} as BattleTimelineEvent)),
    playerSide: "p1",
  }), "任务完成：属性专家，获得 500金币、技能机器商店折扣券。");
  assert.equal(typeRun.bag_items?.tmcoupon, 1);

  const typeStatusRun = run([], {coins: 0});
  startRunQuest(typeStatusRun, "type_expert");
  assert.equal(runQuestStatus(typeStatusRun, "battle", {
    timelineEvents: Array.from({length: 3}, (_, index) => ({id: `se${index}`, type: "effectiveness", text: "效果拔群！", effect: "super effective"} as BattleTimelineEvent)),
  })?.label, "属性专家 3/8");

  const itemRun = run([], {rest_status: {exchanges: 0, taken_enemy_slots: [], battle_item_uses_current: 5}});
  startRunQuest(itemRun, "item_master");
  assert.equal(updateRunQuestAfterBattle(itemRun, {playerWon: true, timelineEvents: [], playerSide: "p1"}), "任务完成：药系天王，获得 500金币、恢复商店折扣券。");
  assert.equal(itemRun.bag_items?.recoverycoupon, 1);

  const itemStatusRun = run([], {rest_status: {exchanges: 0, taken_enemy_slots: [], battle_item_uses_current: 3}});
  startRunQuest(itemStatusRun, "item_master");
  assert.equal(runQuestStatus(itemStatusRun, "battle")?.label, "药系天王 3/5");

  const aceStatusRun = run();
  startRunQuest(aceStatusRun, "ace_trial");
  assert.equal(runQuestStatus(aceStatusRun, "battle", {
    playerSide: "p1",
    timelineEvents: [
      {id: "m1", type: "move", text: "Pikachu 使用 Thunderbolt。", side: "p1", source: "Pikachu", source_showdown_id: "p1: Pikachu"} as BattleTimelineEvent,
      {id: "f1", type: "faint", text: "对手倒下了。", targetSide: "p2", target: "Enemy"} as BattleTimelineEvent,
      {id: "m2", type: "move", text: "Pikachu 使用 Thunderbolt。", side: "p1", source: "Pikachu", source_showdown_id: "p1: Pikachu"} as BattleTimelineEvent,
      {id: "f2", type: "faint", text: "对手倒下了。", targetSide: "p2", target: "Enemy 2"} as BattleTimelineEvent,
    ],
  })?.label, "王牌试炼 2/5");

  const frugalRun = run([], {coins: 1500});
  startRunQuest(frugalRun, "frugal_challenge");
  spendCoins(frugalRun, 400, "shop-buy:potion");
  assert.equal(updateRunQuestAfterRest(frugalRun), null);
  assert.equal(frugalRun.active_quest?.progress.value, 1);
  spendCoins(frugalRun, 500, "shop-buy:tm");
  assert.equal(updateRunQuestAfterRest(frugalRun), "任务完成：节俭挑战，获得 1000金币。");
  assert.equal(frugalRun.active_quest, undefined);
  assert.equal(currentCoins(frugalRun), 1600);

  const failRun = run([], {coins: 1000});
  startRunQuest(failRun, "frugal_challenge");
  spendCoins(failRun, 501, "shop-buy:expensive");
  assert.equal(updateRunQuestAfterRest(failRun), "任务失败：节俭挑战。");
  assert.equal(failRun.active_quest, undefined);
}

function testScoreBetRules(): void {
  assert.equal(scoreBetMultiplier(3), 5);
  assert.equal(scoreBetPayout(100, 3), 300);
  assert.equal(scoreBetPayout(100, 2), 200);
  assert.equal(scoreBetPayout(101, 1.5), 151);
  assert.equal(scoreBetMaxStakeForCoins(100, 0), SCORE_BET_MIN_STAKE);
  assert.equal(scoreBetMaxStakeForCoins(900, 100), 500);
  assert.equal(scoreBetMaxStakeForCoins(5000, 100), 1000);

  const bet = {target_alive: 3 as const, stake: 100, multiplier: 5};
  assert.deepEqual(settleScoreBetResult(bet, true, 3, 0), {hit: true, payout: 500, targetAlive: 3, stake: 100, message: "重金下注命中 3:0（5x），返还 500金币。"});
  assert.equal(settleScoreBetResult(bet, true, 2, 0)?.hit, false);
  assert.equal(settleScoreBetResult({...bet, target_alive: 2 as const, multiplier: 2}, true, 3, 0)?.hit, false);
  assert.equal(settleScoreBetResult({...bet, target_alive: 1 as const, multiplier: 1.5}, true, 1, 0)?.hit, true);
  assert.equal(settleScoreBetResult({...bet, target_alive: 1 as const, multiplier: 5}, true, 1, 0)?.payout, 500);
  assert.equal(settleScoreBetResult(bet, true, 3, 1)?.hit, false);
  assert.equal(settleScoreBetResult(bet, false, 3, 0)?.hit, false);
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

function testBattleSettingDefaults(): void {
  assert.deepEqual(DEFAULT_BATTLE_SETTING.allowed_generations, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(DEFAULT_BATTLE_SETTING.enabled_battle_systems, []);
  assert.equal(DEFAULT_BATTLE_SETTING.legendary_battle, false);

  assert.deepEqual(normalizeBattleSetting({allowed_generations: [8, 9]}).allowed_generations, DEFAULT_BATTLE_SETTING.allowed_generations);
  assert.deepEqual(normalizeBattleSetting({allowed_generations: [9, 8, 8, 7]}).allowed_generations, [9, 8, 7]);
  assert.deepEqual(normalizeBattleSetting({battle_rule_preset: "gen7"}).enabled_battle_systems, ["mega", "zmove"]);
  assert.deepEqual(normalizeBattleSetting({battle_rule_preset: "gen8"}).enabled_battle_systems, ["dynamax"]);
  assert.deepEqual(normalizeBattleSetting({battle_rule_preset: "gen9"}).enabled_battle_systems, ["terastal"]);
  assert.deepEqual(normalizeBattleSetting({enabled_battle_systems: ["mega", "mega", "bad" as any]}).enabled_battle_systems, ["mega", "zmove"]);
  assert.equal(normalizeBattleSetting({legendary_battle: true}).legendary_battle, true);
}

function offer(id: string, index: number): ShopOffer {
  return {id, name: id, name_zh: id, cost: 100, desc: "", desc_zh: "", offer_id: `offer-${index}`, category: "held", source: "shop"};
}

function testShopDuplicateBonus(): void {
  assert.equal(shopDuplicateBonusForOffers([offer("a", 0), offer("b", 1), offer("c", 2)]), null);
  assert.deepEqual(shopDuplicateBonusForOffers([offer("a", 0), offer("a", 1), offer("c", 2)]), {item_id: "a", name: "a", name_zh: "a", count: 1, match_count: 2, icon_asset: undefined});
  assert.deepEqual(shopDuplicateBonusForOffers([offer("a", 0), offer("b", 1), offer("a", 2), offer("a", 3), offer("b", 4)]), {item_id: "a", name: "a", name_zh: "a", count: 2, match_count: 3, icon_asset: undefined});
}

function testPremiumShopHelpers(): void {
  assert.equal(isPremiumHeldShopEntry({kind: "item", category: "held", cost: 800}), true);
  assert.equal(isPremiumHeldShopEntry({kind: "item", category: "held", cost: 799}), false);
  assert.equal(isPremiumHeldShopEntry({kind: "item", category: "consumable", cost: 1000}), false);
  assert.equal(isPremiumHeldShopEntry({kind: "item", category: "held", cost: 1000}, true), false);

  const high = premiumMachineMoveCandidates([
    {id: "tackle", name: "Tackle", power: 40, learn_sources: ["machine"]},
    {id: "flamethrower", name: "Flamethrower", power: 90, learn_sources: ["machine"]},
    {id: "surf", name: "Surf", power: 90, learn_sources: ["machine"]},
    {id: "blastburn", name: "Blast Burn", power: 150, learn_sources: ["levelup"]},
  ], 2);
  assert.deepEqual(high.map(move => move.id), ["flamethrower", "surf"]);

  const fallback = premiumMachineMoveCandidates([
    {id: "swift", name: "Swift", power: 60, learn_sources: ["machine"]},
    {id: "magicalleaf", name: "Magical Leaf", power: 60, learn_sources: ["machine"]},
    {id: "pound", name: "Pound", power: 40, learn_sources: ["machine"]},
  ], 3);
  assert.deepEqual(fallback.map(move => move.id), ["magicalleaf", "swift"]);
}

function testTmIconAssets(): void {
  assert.equal(tmIconAssetForMoveType("Bug"), "assets/runtime/items/machinebug/icon.png");
  assert.equal(tmIconAssetForMoveType("Fire"), "assets/runtime/items/machinefire/icon.png");
  assert.equal(tmIconAssetForMoveType("???"), "assets/runtime/items/machinenormal/icon.png");
  assert.equal(tmIconAssetForMoveType(undefined), "assets/runtime/items/machinenormal/icon.png");
}

function testPokemonDexDetailTabs(): void {
  const tabs = pokemonDexDetailTabs([
    {id: "tackle", name: "Tackle", name_zh: "撞击", type: "Normal", category: "Physical", learn_sources: ["levelup"]},
    {id: "fakeout", name: "Fake Out", name_zh: "击掌奇袭", type: "Normal", category: "Physical", learn_sources: ["egg"]},
    {id: "knockoff", name: "Knock Off", name_zh: "拍落", type: "Dark", category: "Physical", learn_sources: ["tutor"]},
    {id: "thunderbolt", name: "Thunderbolt", name_zh: "十万伏特", type: "Electric", category: "Special", learn_sources: ["machine"]},
  ] as any);
  assert.deepEqual(tabs.map(tab => tab.label), ["基本信息", "自学技能", "遗传技能", "教授技能", "技能机器"]);
  const specialTabs = pokemonDexDetailTabs([{id: "celebrate", name: "Celebrate", name_zh: "庆祝", type: "Normal", category: "Status", learn_sources: ["event"]}] as any);
  assert.deepEqual(specialTabs.map(tab => tab.label), ["基本信息", "特殊来源"]);
}

function testBattleTimelineEntryOrdering(): void {
  const events: BattleTimelineEvent[] = [
    {id: "s1", type: "switch", text: "大嘴鸥 上场了。", side: "p1", targetSide: "p1"},
    {id: "s2", type: "switch", text: "煤炭龟 上场了。", side: "p2", targetSide: "p2"},
    {id: "w1", type: "weather", text: "大嘴鸥 的降雨。", side: "p1", targetSide: "p1"},
    {id: "w2", type: "weather", text: "煤炭龟 的日照。", side: "p2", targetSide: "p2"},
  ];
  const seen: string[] = [];
  for (const step of buildBattleDisplaySteps(events)) {
    if (step.event?.id && seen.at(-1) !== step.event.id) seen.push(step.event.id);
  }
  assert.deepEqual(seen, ["s1", "w1", "s2", "w2"]);
}

function testBattleTimelineMissSkipsMoveVisual(): void {
  const events: BattleTimelineEvent[] = [
    {id: "m1", type: "move", text: "好胜毛蟹 使用 吸取拳。", side: "p1", source: "好胜毛蟹", source_id: "Crabominable", source_showdown_id: "pokeball", move: "吸取拳", turn: 1},
    {id: "x1", type: "miss", text: "好胜毛蟹 的攻击没有命中 步哨鼠。", side: "p1", targetSide: "p2", source: "好胜毛蟹", source_id: "Crabominable", target: "步哨鼠", target_id: "Watchog", target_showdown_id: "pokeball", turn: 1},
  ];
  assert.deepEqual(buildBattleDisplaySteps(events).map(step => `${step.kind}:${step.event?.id}`), ["message:m1", "message:x1", "visual:x1"]);
}

function testBattlePartySnapshotHelpers(): void {
  const view = {
    player: {
      side: "p1",
      active_index: 0,
      slots: [
        {key: "a", slot: 1, showdown_id: "ball-a", run_member_id: "member-a", revealed: true, active: true, fainted: false, condition: "100/100", hp: 100, max_hp: 100, status: "", moves: []},
        {key: "dup-key", slot: 2, showdown_id: "ball-b", run_member_id: "member-b", revealed: true, active: false, fainted: false, condition: "100/100", hp: 100, max_hp: 100, status: "", moves: []},
        {key: "dup-key", slot: 3, showdown_id: "ball-c", run_member_id: "member-c", revealed: true, active: false, fainted: false, condition: "100/100", hp: 100, max_hp: 100, status: "", moves: []},
      ],
    },
    enemy: {
      side: "p2",
      active_index: 0,
      slots: [
        {key: "enemy-a", slot: 1, showdown_id: "enemy-ball", run_member_id: "enemy-a", revealed: true, active: true, fainted: false, condition: "100/100", hp: 100, max_hp: 100, status: "", moves: []},
        {key: "enemy-b", slot: 2, showdown_id: "enemy-ball", run_member_id: "enemy-b", revealed: true, active: false, fainted: false, condition: "", hp: 0, max_hp: 100, status: "", moves: []},
      ],
    },
  } as NonNullable<BattleState["battle_view"]>;
  const cloned = cloneBattleViewSnapshot(view)!;
  cloned.player.slots[0].condition = "1/100";
  assert.equal(view.player.slots[0].condition, "100/100");
  const deduped = dedupeBattleViewPartySnapshot(view)!;
  assert.deepEqual(deduped.player.slots.map(slot => slot.key), ["a", "dup-key"]);
  assert.deepEqual(deduped.enemy.slots.map(slot => slot.key), ["enemy-a"]);
}

function testRuntimeBattleStats(): void {
  const battleRun = run([], {battle_no: 2, player_display: [{name: "狼人", species_id: "lycanroc", showdown_id: "lycanroc", level: 50} as any]});
  const battle = {
    ...battleStateAtTurn(3, true),
    winner: "Player",
    player_display: battleRun.player_display,
    enemy_display: [{name: "对手", species_id: "watchog", showdown_id: "watchog", level: 50} as any],
    timeline_events: [
      {id: "m1", type: "move", text: "狼人 使用 尖石攻击。", side: "p1", source: "狼人", source_id: "Lycanroc", source_showdown_id: "lycanroc", turn: 1},
      {id: "d1", type: "damage", text: "对手 HP: 40/100", targetSide: "p2", target: "对手", target_id: "Watchog", target_showdown_id: "watchog", hp: {current: 40, max: 100, text: "40/100"}, turn: 1},
      {id: "m2", type: "move", text: "对手 使用 撞击。", side: "p2", source: "对手", source_id: "Watchog", source_showdown_id: "watchog", turn: 2},
      {id: "d2", type: "damage", text: "狼人 HP: 70/100", targetSide: "p1", target: "狼人", target_id: "Lycanroc", target_showdown_id: "lycanroc", hp: {current: 70, max: 100, text: "70/100"}, turn: 2},
      {id: "m3", type: "move", text: "狼人 使用 咬碎。", side: "p1", source: "狼人", source_id: "Lycanroc", source_showdown_id: "lycanroc", turn: 3},
      {id: "d3", type: "damage", text: "对手 HP: 0/100", targetSide: "p2", target: "对手", target_id: "Watchog", target_showdown_id: "watchog", hp: {current: 0, max: 100, text: "0/100"}, turn: 3},
      {id: "f1", type: "faint", text: "对手倒下了。", targetSide: "p2", target: "对手", target_id: "Watchog", target_showdown_id: "watchog", turn: 3},
    ],
  } as BattleState;
  const events = recordRuntimeBattleStats(battleRun, battle);
  assert.deepEqual(events.map(event => [event.kind, event.value]), [["damage_dealt", 60], ["damage_taken", 30], ["damage_dealt", 40], ["kill", 1]]);
  const summary = buildRuntimeResultSummary({outcome: "win", headline: "通关", wins: 7, run: battleRun, battle, defaultBattles: 7});
  assert.deepEqual(summary.used_pokemon?.map(entry => [entry.kills, entry.damage_dealt, entry.damage_taken]), [[1, 100, 30]]);
}

function battleStateAtTurn(turn: number, ended = false): BattleState {
  return {
    ended,
    winner: ended ? "Player" : null,
    request: null,
    tracker: {
      turn,
      active: {p1: {}, p2: {}},
      boosts: {p1: {}, p2: {}},
      side_conditions: {p1: [], p2: []},
      weather: "",
      field: [],
      pp: {},
    },
    recent_events: [],
    timeline_events: [],
    player_team: [],
    player_display: [],
    enemy_team: [],
    enemy_display: [],
  };
}

function testSoulSwapRules(): void {
  const profile = soulSwapEnemyAiProfile();
  assert.equal(typeof profile, "object");
  assert.equal((profile as any).personality, "soul_sick");
  assert.equal((profile as any).allowSwitch, false);
  assert.equal((profile as any).depth, 0);

  assert.equal(shouldForceSoulSwapTimeout(run([], {rest_status: {event_soul_swap_active: true}}), battleStateAtTurn(SOUL_SWAP_TURN_LIMIT - 1)), false);
  assert.equal(shouldForceSoulSwapTimeout(run([], {rest_status: {event_soul_swap_active: true}}), battleStateAtTurn(SOUL_SWAP_TURN_LIMIT)), true);
  assert.equal(shouldForceSoulSwapTimeout(run([], {rest_status: {}}), battleStateAtTurn(SOUL_SWAP_TURN_LIMIT)), false);
  assert.equal(shouldForceSoulSwapTimeout(run([], {rest_status: {event_soul_swap_active: true}}), battleStateAtTurn(SOUL_SWAP_TURN_LIMIT, true)), false);

  assert.equal(soulSwapAllowedForNextBattle(run([], {next_battle: 2})), true);
  assert.equal(soulSwapAllowedForNextBattle(run([], {next_battle: 3})), false);
  assert.equal(soulSwapAllowedForNextBattle(run([], {next_battle: 7})), false);
  assert.equal(soulSwapAllowedForNextBattle(run([], {next_battle: 3, planned_battles: [{battle_no: 3, route_type: "normal"} as any]})), true);
  assert.equal(soulSwapAllowedForNextBattle(run([], {next_battle: 2, planned_battles: [{battle_no: 2, route_type: "gym"} as any]})), false);
}

function testRookieAiRules(): void {
  const profile = rookieNormalNpcAiProfile();
  assert.equal(typeof profile, "object");
  assert.equal((profile as any).personality, "rookie");
  assert.equal((profile as any).depth, 0);
  assert.equal((profile as any).randomness, 0.36);
  assert.equal((profile as any).switchAwareness, 0.08);

  assert.equal((enemyAiProfileForRunRoute(run([], {wins: 0}), "normal", "normal") as any).personality, "rookie");
  assert.equal(enemyAiProfileForRunRoute(run([], {wins: 1}), "normal", "normal"), "normal");
  assert.equal(enemyAiProfileForRunRoute(run([], {wins: 0}), "gym", "gym_low"), "gym_low");
  assert.deepEqual(enemyAiProfileForRunRoute(run([], {wins: 0}), "champion", {level: "champion", personality: "adaptive"} as any), {level: "champion", personality: "adaptive"});
  assert.equal((soulSwapEnemyAiProfile() as any).personality, "soul_sick");
}

function testNormalEnemySpeciesTierRules(): void {
  assert.deepEqual(normalEnemySpeciesTiersForBattle(0, 1, 1), [3, 4, 4]);
  assert.deepEqual(normalEnemySpeciesTiersForBattle(0, 1, 2), [3, 4, 5]);
  assert.deepEqual(normalEnemySpeciesTiersForBattle(0, 4, 1), [3, 4, 5]);
  assert.deepEqual(normalEnemySpeciesTiersForBattle(0, 4, 2), [3, 4, 6]);
  assert.deepEqual(normalEnemySpeciesTiersForBattle(1, 4, 1), [4, 5, 6]);
  assert.deepEqual(normalEnemySpeciesTiersForBattle(1, 4, 2), [3, 5, 6]);

  const stable = normalEnemySpeciesTiersForBattle(0, 4, 1234);
  assert.deepEqual(normalEnemySpeciesTiersForBattle(0, 4, 1234), stable);
  assert.equal(stable[0], 3);
  assert.equal(stable[1], 4);
  assert.ok([5, 6].includes(stable[2]), JSON.stringify(stable));
  assert.notDeepEqual(normalEnemySpeciesTiersForBattle(0, 4, 1235), stable);
}

function testTmBagMoveResolutionUsesTargetMoveQuery(): void {
  const sunnyDay = {id: "sunnyday", name: "Sunny Day", name_zh: "大晴天", power: 0, cost: 300, learn_sources: ["machine"]} as PricedMove;
  const legacyChineseTm = {id: "tm:", name: "TM", name_zh: "技能机器 大晴天", count: 1, category: "tm"} as BagItemView;
  const normalTm = {...legacyChineseTm, id: "tm:sunnyday", move_id: "sunnyday"} as BagItemView;
  const fillerMoves = Array.from({length: 60}, (_, index) => ({id: `power${index}`, name: `Power ${index}`, name_zh: `强力${index}`, power: 100 - index, cost: 100}) as PricedMove);

  assert.equal(tmMoveSearchQuery(normalTm), "sunnyday");
  assert.equal(tmMoveSearchQuery(legacyChineseTm), "大晴天");
  assert.equal(resolveTmMoveIdForSlot(legacyChineseTm, [sunnyDay]), "sunnyday");
  assert.equal(resolveTmMoveIdForSlot(legacyChineseTm, fillerMoves), "");
}

testTalentCatalog();
testEnableTestMode();
await testAllInExchangePenalty();
testStarterTalents();
testExchangeTalents();
testGrowthTalents();
testIntelTalents();
testEconomyTalents();
testCoinLedgerAndTrainingRules();
testRestShopDiscountCoupons();
testProfiteerShopRules();
testRunQuests();
testScoreBetRules();
testDefaultsAndHelpers();
testBattleSettingDefaults();
testShopDuplicateBonus();
testPremiumShopHelpers();
testTmIconAssets();
testPokemonDexDetailTabs();
testBattleTimelineEntryOrdering();
testBattleTimelineMissSkipsMoveVisual();
testBattlePartySnapshotHelpers();
testRuntimeBattleStats();
testTmBagMoveResolutionUsesTargetMoveQuery();
testSoulSwapRules();
testRookieAiRules();
testNormalEnemySpeciesTierRules();

console.log("Desk talent rule tests passed.");
