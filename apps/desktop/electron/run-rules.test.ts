import assert from "node:assert/strict";
import type {BattleState, BattleTimelineEvent, CurrentRunData, LocalSave, ShopOffer, TalentView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {buildBattleDisplaySteps} from "../src/components/battle/timelineFlow.ts";
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
  applyAllInExchange,
  addRunBp,
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
  itemCategory,
  moveDrawCost,
  moveDrawCount,
  normalizeStarterUpgrades,
  normalizeTalentViews,
  portfolioBonus,
  portfolioSpendTypeForLabel,
  premiumMachineMoveCandidates,
  pricedForShop,
  recordPortfolioSpend,
  refundableBagBaseBpFromCosts,
  rookieNormalNpcAiProfile,
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
  spendBp,
  spendCoins,
  settleScoreBetResult,
  starNodeLevel,
  starterCoinsForSeed,
  starterNonConvertibleCoinsForTalents,
  starterUpgradeLevel,
  statResetCost,
  talent,
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

testTalentCatalog();
testEnableTestMode();
await testAllInExchangePenalty();
testStarterTalents();
testExchangeTalents();
testGrowthTalents();
testIntelTalents();
testEconomyTalents();
testScoreBetRules();
testDefaultsAndHelpers();
testBattleSettingDefaults();
testShopDuplicateBonus();
testPremiumShopHelpers();
testBattleTimelineEntryOrdering();
testBattleTimelineMissSkipsMoveVisual();
testSoulSwapRules();
testRookieAiRules();

console.log("Desk talent rule tests passed.");
