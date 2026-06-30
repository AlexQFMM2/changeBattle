import type {DexItemDetail, DexPokemonDetail, DexSearchRequest, DexSearchResult} from "@changebattle-v2/showdown-dex-core";
import {
  FORMAL_ROUND_COUNT,
  FORMAL_SHOP_CATEGORY_ORDER,
  FORMAL_SHOP_ITEM_POOL,
  FORMAL_SHOP_SLOTS_PER_CATEGORY,
  FORMAL_STARTING_MONEY,
  STARTER_ROLE_PLAN,
  validateFormalShopCatalogV4,
} from "@changebattle-v2/core";
import {FORMAL_STARTER_SHINY_RATE, createFormalGameRunApi} from "./formalGame.js";
import {
  enableTestModeForProfileV4,
  normalizeStarChartV4,
  starterCandidateCountForStarChart,
  unlockStarChartNodeForProfileV4,
  type StarChartStateV4,
} from "./starChart.js";
import {normalizeBattlePreferenceV4} from "./training.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const pokemonDetails = [
  mockPokemon("squirtle", "杰尼龟", 7, ["Water"], 314),
  mockPokemon("charizardmegax", "超级喷火龙X", 6, ["Fire", "Dragon"], 634, {baseSpecies: "Charizard", forme: "Mega-X", isMega: true}),
  mockPokemon("charizardgmax", "超极巨喷火龙", 6, ["Fire", "Flying"], 534, {baseSpecies: "Charizard", forme: "Gmax"}),
  mockPokemon("walkingwake", "波荡水", 1009, ["Water", "Dragon"], 590),
  mockPokemon("blacephalon", "砰头小丑", 806, ["Fire", "Ghost"], 570),
  mockPokemon("charizard", "喷火龙", 6, ["Fire", "Flying"], 534),
  mockPokemon("lapras", "拉普拉斯", 131, ["Water", "Ice"], 535),
  mockPokemon("scyther", "飞天螳螂", 123, ["Bug", "Flying"], 500),
  mockPokemon("gardevoir", "沙奈朵", 282, ["Psychic", "Fairy"], 518),
  mockPokemon("ninetalesalola", "九尾-阿罗拉", 38, ["Ice", "Fairy"], 505, {baseSpecies: "Ninetales", forme: "Alola"}),
  mockPokemon("lucario", "路卡利欧", 448, ["Fighting", "Steel"], 525),
  mockPokemon("greninja", "甲贺忍蛙", 658, ["Water", "Dark"], 530),
  mockPokemon("flygon", "沙漠蜻蜓", 330, ["Ground", "Dragon"], 520),
  mockPokemon("breloom", "斗笠菇", 286, ["Grass", "Fighting"], 460),
  mockPokemon("venusaur", "妙蛙花", 3, ["Grass", "Poison"], 525),
  mockPokemon("blastoise", "水箭龟", 9, ["Water"], 530),
  mockPokemon("gyarados", "暴鲤龙", 130, ["Water", "Flying"], 540),
  mockPokemon("snorlax", "卡比兽", 143, ["Normal"], 540),
];
const pokemonById = new Map(pokemonDetails.map(detail => [detail.id, detail]));

const api = createFormalGameRunApi({
  searchDex(request: DexSearchRequest = {}): DexSearchResult {
    const offset = Number(request.offset || 0);
    const limit = Number(request.limit || 20);
    const rows = pokemonDetails.map(detail => ({
      id: detail.id,
      category: "pokemon" as const,
      name: detail.name,
      nameZh: detail.nameZh,
      subtitle: detail.types.join(" / "),
      description: "",
      tags: [detail.id, detail.name, detail.nameZh, ...detail.types],
    }));
    return {category: "pokemon", query: "", offset, limit, total: rows.length, hasMore: offset + limit < rows.length, rows: rows.slice(offset, offset + limit)};
  },
  getPokemonDetail(id: string) {
    return pokemonById.get(id) || pokemonById.get("squirtle")!;
  },
  getPokemonSelfLearnSkills() {
    return ["tackle", "watergun", "protect", "raindance", "trickroom", "flamethrower"].map(moveDetail);
  },
  getMoveDetail(id: string) {
    return moveDetail(id);
  },
  getItemDetail(id: string) {
    return itemDetail(id);
  },
  calculatePokemonStats({level}: {level: number}) {
    return {stats: {hp: 100 + level, atk: 80, def: 80, spa: 80, spd: 80, spe: 80}};
  },
} as never, {
  async loadFormalGameRun() {
    return null;
  },
  async saveFormalGameRun(run) {
    return run;
  },
  async deleteFormalGameRun() {},
});

function mockPokemon(id: string, nameZh: string, num: number, types: string[], bst: number, patch: Partial<DexPokemonDetail> = {}): DexPokemonDetail {
  const each = Math.floor(bst / 6);
  return {
    id,
    name: id,
    nameZh,
    num,
    baseSpecies: patch.baseSpecies || id,
    forme: patch.forme || "",
    isMega: patch.isMega,
    battleOnly: patch.battleOnly,
    types,
    baseStats: {hp: each, atk: each, def: each, spa: each, spd: each, spe: each},
    abilities: [{id: "overgrow", name: "Overgrow", nameZh: "茂盛"}],
    eggGroups: [],
    evolutionChain: [],
    formes: [],
    sprites: {
      resourcePrefix: "",
      frontUrl: `/pokemon/${id}.png`,
      iconUrl: `/pokemon/${id}-icon.png`,
    },
    learnset: [],
    learnsetGroups: {
      other: [],
      egg: [],
      levelup: [],
      machine: [],
      tutor: [],
      event: [],
      transfer: [],
    },
    ...patch,
  };
}

function moveDetail(id: string) {
  const moveTypes: Record<string, string> = {
    watergun: "水",
    raindance: "水",
    trickroom: "超能力",
    flamethrower: "火",
    protect: "一般",
  };
  const status = id === "protect" || id === "raindance" || id === "trickroom";
  return {
    id,
    name: id,
    nameZh: id,
    type: moveTypes[id] || "一般",
    category: status ? "变化" : "特殊",
    power: status ? 0 : 40,
    accuracy: status ? null : 100,
    pp: status ? 10 : 25,
    priority: 0,
    target: "normal",
    flags: [],
    description: "",
    learnSources: [],
  };
}

function itemDetail(id: string): DexItemDetail {
  const isTm = id.startsWith("tm:");
  const moveId = isTm ? id.slice(3) : "";
  return {
    id,
    name: isTm ? `TM: ${moveId}` : id,
    nameZh: isTm ? `技能机器：${moveId}` : id,
    kind: isTm ? "tm" : id.includes("berry") ? "berry" : "recovery",
    kindLabel: isTm ? "技能机器" : "道具",
    description: isTm ? "" : `${id} 描述`,
    effectSummary: isTm ? `${moveId} 招式学习器` : `${id} 效果`,
    cost: isTm ? 1000 : 300,
    moveId: isTm ? moveId : undefined,
    moveName: isTm ? moveId : undefined,
    moveNameZh: isTm ? `${moveId}技能` : undefined,
    iconUrl: `/items/${id}.png`,
    iconStyle: "",
  };
}

function allMoreChoicesChart(): StarChartStateV4 {
  return {
    nodes: {
      root_trainer_star: 1,
      starter_more_choices_1: 1,
      starter_more_choices_2: 1,
      starter_more_choices_3: 1,
      starter_more_choices_4: 1,
    },
  };
}

const profile = {
  id: "formal-profile",
  name: "正式游戏测试",
  avatarAsset: "/avatar.png",
  battlePoints: 0,
  starChart: normalizeStarChartV4(),
  battlePreference: normalizeBattlePreferenceV4({
    allowedGenerations: [1, 2, 3],
    ruleSet: "standard",
    legendaryBattle: false,
    battleBagEnabled: true,
  }),
};

const run = api.createFormalGameRun(profile, {mode: "singles", seed: "formal-smoke-seed"});
profile.battlePreference = normalizeBattlePreferenceV4({
  allowedGenerations: [9],
  ruleSet: "gen9",
  legendaryBattle: true,
  battleBagEnabled: false,
});
const prepared = api.prepareFormalStarterCandidates(run);
const preparedAgain = api.prepareFormalStarterCandidates(run);

assert(prepared.starterCandidates.length === 6, "root-only star chart should default formal starter candidates to 6");
assert(validateFormalShopCatalogV4().length === 0, "formal shop catalog should be valid");
for (const category of FORMAL_SHOP_CATEGORY_ORDER) {
  assert(FORMAL_SHOP_ITEM_POOL[category].length >= FORMAL_SHOP_SLOTS_PER_CATEGORY[category], `formal shop ${category} should have enough pool items`);
}
assert(api.prepareFormalStarterCandidates(run, {count: 12}).starterCandidates.length === 10, "random formal starter candidates should cap at 10");
assert(api.selectedCountForFormalMode("singles") === 3, "singles should select 3");
assert(api.selectedCountForFormalMode("doubles") === 4, "doubles should select 4");
assert(api.selectedCountForFormalMode("coop") === 2, "coop should select 2");
assert(prepared.starterCandidates.every(candidate => candidate.pokemon.itemId === ""), "player starters should not hold items");
assert(prepared.starterCandidates.every(candidate => !candidate.pokemon.heldItemInstanceId), "player starters should not bind held item instances");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.generation >= 1 && candidate.diagnostics.generation <= 3), "allowedGenerations should filter candidates");
assert(prepared.battlePreference.battleBagEnabled === true, "formal run should keep battlePreference snapshot battle bag flag");
assert(prepared.battlePreference.legendaryBattle === false, "formal run should keep battlePreference snapshot legendary flag");
assert(prepared.battlePreference.ruleSet === "standard", "formal run should keep battlePreference snapshot rule set");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.filters.battleBagEnabled === true), "starter diagnostics should preserve run battle bag snapshot");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.filters.legendaryBattle === false), "starter diagnostics should preserve run legendary snapshot");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.filters.ruleSet === "standard"), "starter diagnostics should preserve run rule set snapshot");
assert(FORMAL_STARTER_SHINY_RATE === 1 / 30, "formal starter shiny rate should be 1/30");
assert(FORMAL_ROUND_COUNT === 7, "formal round count should stay 7");
assert(FORMAL_STARTING_MONEY === 3000, "formal starting money should stay 3000");
assert(STARTER_ROLE_PLAN.slice(0, 6).join(",") === "weather,trick-room,offense,offense,support,defense", "starter role plan first 6 roles should stay stable");
assert(prepared.starterCandidates.every(candidate => candidate.speciesRank !== "legendary"), "legendaryBattle false should exclude legendary rank");
assert(prepared.starterCandidates.every(candidate => ["rank4", "rank5", "rank6"].includes(candidate.speciesRank)), "player starter candidates should only use rank4-rank6");
assert(prepared.starterCandidates.every(candidate => !["squirtle", "charizardmegax", "charizardgmax", "walkingwake", "blacephalon"].includes(candidate.pokemon.speciesId)), "starter filters should remove low rank, legendary, mega, and gmax species");
assert(prepared.starterCandidates.some(candidate => candidate.pokemon.speciesId === "ninetalesalola"), "regional forms should be allowed");
assert(prepared.starterCandidates.map(candidate => candidate.pokemon.speciesId).join(",") === preparedAgain.starterCandidates.map(candidate => candidate.pokemon.speciesId).join(","), "same seed should be stable");
assert(prepared.starterCandidates.map(candidate => candidate.role).join(",") === "weather,trick-room,offense,offense,support,defense", "base six starter roles should match formal plan");
for (const role of ["weather", "trick-room", "offense", "support", "defense"]) {
  assert(prepared.starterCandidates.some(candidate => candidate.role === role), `missing starter role ${role}`);
}

let starProfile = {...profile, battlePoints: 100, starChart: normalizeStarChartV4()};
assert(starterCandidateCountForStarChart(starProfile.starChart) === 6, "root-only star chart should grant 6 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_1");
assert(starProfile.battlePoints === 90, "more choices I should cost 10 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 7, "more choices I should grant 7 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_2");
assert(starProfile.battlePoints === 78, "more choices II should cost 12 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 8, "more choices II should grant 8 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_3");
assert(starProfile.battlePoints === 63, "more choices III should cost 15 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 9, "more choices III should grant 9 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_4");
assert(starProfile.battlePoints === 43, "more choices IV should cost 20 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 10, "more choices IV should grant 10 starter candidates");

const fullStarRun = api.createFormalGameRun(starProfile, {mode: "singles", seed: "formal-smoke-full-star-seed"});
const fullStarPrepared = api.prepareFormalStarterCandidates(fullStarRun);
assert(fullStarPrepared.starterCandidates.length === 10, "full more choices star chart should prepare 10 candidates");
assert(fullStarPrepared.starterCandidates.slice(6, 10).map(candidate => candidate.role).join(",") === "speed-control,disruption,flex-defense,flex-offense", "extended starter roles should match formal plan");

const frozenRun = api.createFormalGameRun(profile, {mode: "singles", seed: "formal-smoke-frozen-star-seed"});
const changedAfterRun = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, "starter_more_choices_1");
assert(starterCandidateCountForStarChart(changedAfterRun.starChart) === 7, "changed profile should have 7 starter candidates");
assert(api.prepareFormalStarterCandidates(frozenRun).starterCandidates.length === 6, "formal run should freeze star chart snapshot at creation");

let failedStarUnlock = false;
try {
  unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, "starter_more_choices_2");
} catch {
  failedStarUnlock = true;
}
assert(failedStarUnlock, "star chart should reject unlock when prerequisite is missing");

failedStarUnlock = false;
try {
  unlockStarChartNodeForProfileV4(profile, "starter_more_choices_1");
} catch {
  failedStarUnlock = true;
}
assert(failedStarUnlock, "star chart should reject unlock when BP is insufficient");

failedStarUnlock = false;
try {
  unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_1");
} catch {
  failedStarUnlock = true;
}
assert(failedStarUnlock, "star chart should reject repeated unlock");

const testModeProfile = enableTestModeForProfileV4(profile);
assert(testModeProfile.battlePoints === 99999, "test mode should set BP to 99999");
assert(starterCandidateCountForStarChart(testModeProfile.starChart) === 6, "test mode should not unlock star chart nodes");

const legendaryProfile = {
  ...profile,
  starChart: allMoreChoicesChart(),
  battlePreference: normalizeBattlePreferenceV4({
    allowedGenerations: [1, 2, 3, 7, 9],
    ruleSet: "standard",
    legendaryBattle: true,
    battleBagEnabled: true,
  }),
};
const legendaryRun = api.createFormalGameRun(legendaryProfile, {mode: "singles", seed: "formal-smoke-legendary-seed"});
const legendaryPrepared = api.prepareFormalStarterCandidates(legendaryRun);
assert(legendaryPrepared.starterCandidates.filter(candidate => candidate.speciesRank === "legendary").length <= 1, "legendaryBattle true should cap starter legendary candidates");

let failed = false;
try {
  api.selectFormalStarterPokemon(prepared, [0, 1]);
} catch {
  failed = true;
}
assert(failed, "selecting too few starters should fail");

const selected = api.selectFormalStarterPokemon(prepared, [0, 1, 2]);
assert(selected.status === "roundPlanPending", "selected run should wait for round plan");
assert(selected.playerTeam?.pokemon.length === 3, "selected player team should contain 3 pokemon");
assert(selected.playerTeam.pokemon.every(pokemon => pokemon.itemId === ""), "selected player team should stay itemless");

const roundPlanned = api.prepareFormalRoundPlan(selected);
const rookieOpponent = roundPlanned.roundPlan[0]!.participants.p2!.localTeam.pokemon;
const normalOpponent = roundPlanned.roundPlan[1]!.participants.p2!.localTeam.pokemon;
const scaledGymOpponent = roundPlanned.roundPlan[2]!.participants.p2!.localTeam.pokemon;
const eliteOpponent = roundPlanned.roundPlan[5]!.participants.p2!.localTeam.pokemon;
assert(roundPlanned.status === "resting", "formal round plan should enter resting status");
assert(roundPlanned.roundPlan.length === 7, "formal round plan should create seven rounds");
assert(roundPlanned.restRunSnapshot?.gameMap.length === 7, "formal rest snapshot should expose seven map nodes");
assert(Array.isArray(roundPlanned.restRunSnapshot?.coinLog) && roundPlanned.restRunSnapshot?.coinLog.length === 0, "formal rest snapshot should start with empty coinLog");
assert(Array.isArray(roundPlanned.restRunSnapshot?.battleLog) && roundPlanned.restRunSnapshot?.battleLog.length === 0, "formal rest snapshot should start with empty battleLog");
assert(roundPlanned.restRunSnapshot?.currentNodeId === roundPlanned.restRunSnapshot?.gameMap[0]?.id, "formal rest snapshot should point at first round");
assert(roundPlanned.roundPlan[0]?.participants.p1?.localTeam.pokemon.every(pokemon => pokemon.itemId === ""), "formal player team should remain itemless in round plan");
assert(roundPlanned.roundPlan.every(round => (round.participants.p2?.localTeam.pokemon.length || 0) === 3), "singles formal opponents should bring three pokemon");
assert(roundPlanned.roundPlan.every(round => {
  const team = round.participants.p2?.localTeam.pokemon || [];
  return new Set(team.map(pokemon => pokemon.speciesId)).size === team.length;
}), "formal opponent teams should avoid internal duplicate species");
assert(rookieOpponent.every(pokemon => pokemon.level <= 50 && statTotal(pokemon.ivs) <= 50 && statTotal(pokemon.evs) <= 100), "rookie NPC stats should stay in rookie bounds");
assert(rookieOpponent.every(pokemon => !["choicescarf", "choiceband", "choicespecs", "lifeorb", "focussash", "assaultvest", "heavydutyboots"].includes(pokemon.itemId)), "rookie NPC should not hold strong battle items");
assert(normalOpponent.every(pokemon => pokemon.level <= 53 && inRange(statTotal(pokemon.ivs), 40, 70) && inRange(statTotal(pokemon.evs), 80, 200)), "normal NPC stats should stay in normal bounds");
assert(eliteOpponent.every(pokemon => pokemon.level <= 55 && inRange(statTotal(pokemon.ivs), 60, 120) && inRange(statTotal(pokemon.evs), 180, 300)), "elite NPC stats should stay in elite bounds");
assert(scaledGymOpponent.every(pokemon => pokemon.level <= 55 && statTotal(pokemon.ivs) <= 120 && statTotal(pokemon.evs) <= 300), "streak 0 gym should scale down instead of using boss rush values");

const shop = api.getFormalRestShop(roundPlanned);
const shopProducts = api.getFormalRestShopProducts(roundPlanned);
assert(shopProducts.length === FORMAL_SHOP_CATEGORY_ORDER.length * 3, "formal shop product view should expose 5x3 products");
assert(shopProducts.every(product => product.slotId && product.itemID && product.name && product.summary && product.price > 0), "formal shop product view should include display fields");
assert(shopProducts.every(product => shop?.categories[product.type]?.some(item => item.slotId === product.slotId)), "formal shop product view should preserve slot mapping");
const tmProduct = shopProducts.find(product => product.type === "tm");
assert(tmProduct && !/^技能机器[：:]/.test(tmProduct.name), "formal shop TM product should display move name instead of TM item prefix");

const withCoinLog = api.appendCoinLogEntryV4(roundPlanned, {amount: -10, source: "preview-unlock", label: "解锁预览", key: "coin:preview:1"});
assert(withCoinLog.money === roundPlanned.money - 10, "coin log should update formal money");
assert(withCoinLog.restRunSnapshot?.coinLog?.length === 1, "coin log should append one entry");
assert(withCoinLog.restRunSnapshot.coinLog[0]?.balanceBefore === roundPlanned.money, "coin log should record balance before");
assert(withCoinLog.restRunSnapshot.coinLog[0]?.balanceAfter === withCoinLog.money, "coin log should record balance after");
const withDuplicateCoinLog = api.appendCoinLogEntryV4(withCoinLog, {amount: -10, source: "preview-unlock", label: "解锁预览", key: "coin:preview:1"});
assert(withDuplicateCoinLog.restRunSnapshot?.coinLog?.length === 1, "coin log should dedupe by key");

const firstPlayerPokemon = withCoinLog.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const firstEnemyPokemon = {...withCoinLog.roundPlan[0]!.participants.p2!.localTeam.pokemon[0]!, maxHp: 200};
const battlePlayers = [
  {
    playerId: "p1",
    name: "P1",
    controller: "local",
    alliance: "near",
    team: [],
    draft: withCoinLog.restRunSnapshot!.players.p1!,
  },
  {
    playerId: "p2",
    name: "P2",
    controller: "ai",
    alliance: "far",
    team: [],
    draft: {
      ...withCoinLog.roundPlan[0]!.participants.p2!,
      localTeam: {
        ...withCoinLog.roundPlan[0]!.participants.p2!.localTeam,
        pokemon: [firstEnemyPokemon],
      },
    },
  },
];
const battleSnapshotBase = {
  id: "formal-smoke-session",
  runId: withCoinLog.restRunSnapshot!.id,
  nodeId: withCoinLog.roundPlan[0]!.id,
  status: "ended",
  mode: "singles",
  ruleSet: "standard",
  turn: 2,
  winner: "p1",
  error: null,
  players: battlePlayers,
  requests: {},
  active: [],
  debug: {inputLog: [], lastChoices: [], playerStreams: []},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const battleSnapshotPartial = {
  ...battleSnapshotBase,
  status: "running",
  rawLog: [
    `|move|p1a: ${firstPlayerPokemon.nameZh}|Tackle|p2a: ${firstEnemyPokemon.nameZh}`,
    `|-damage|p2a: ${firstEnemyPokemon.nameZh}|80/100`,
  ],
} as never;
const battleSnapshot = {
  ...battleSnapshotBase,
  rawLog: [
    `|move|p1a: ${firstPlayerPokemon.nameZh}|Tackle|p2a: ${firstEnemyPokemon.nameZh}`,
    `|-damage|p2a: ${firstEnemyPokemon.nameZh}|80/100`,
    `|-damage|p2a: ${firstEnemyPokemon.nameZh}|50/100`,
    `|faint|p2a: ${firstEnemyPokemon.nameZh}`,
    "|win|P1",
  ],
} as never;
const withPartialBattleLog = api.appendBattleLogEntriesFromSnapshotV4(withCoinLog, battleSnapshotPartial);
const withBattleLog = api.appendBattleLogEntriesFromSnapshotV4(withPartialBattleLog, battleSnapshot);
assert((withBattleLog.restRunSnapshot?.battleLog?.length || 0) >= 3, "battle log should append protocol entries");
const withDuplicateBattleLog = api.appendBattleLogEntriesFromSnapshotV4(withBattleLog, battleSnapshot);
assert(withDuplicateBattleLog.restRunSnapshot?.battleLog?.length === withBattleLog.restRunSnapshot?.battleLog?.length, "battle log should dedupe snapshot lines");
const loggedDamage = (withBattleLog.restRunSnapshot?.battleLog || []).filter(entry => entry.eventType === "damage").reduce((sum, entry) => sum + (entry.damage || 0), 0);
assert(loggedDamage === 100, "battle log should replay rawLog HP baseline and scale public percentage HP to true max HP");
const wonRestRun = {
  ...withBattleLog.restRunSnapshot!,
  gameMap: withBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
};
const settlementRun = api.prepareFormalSettlement({...withBattleLog, restRunSnapshot: wonRestRun}, "loss");
assert(settlementRun.status === "ended", "settlement should end formal run");
assert(settlementRun.settlement?.wonRounds === 1, "settlement should count won rounds");
assert(settlementRun.settlement?.bpGained === 1, "settlement should calculate BP from normal NPC coefficient at streak 0");
assert(settlementRun.settlement?.pokemonStats[0]?.pokemonKey, "settlement should include pokemon stats and MVP");
assert((settlementRun.settlement?.pokemonStats.length || 0) <= (selected.playerTeam?.pokemon.length || 0), "settlement stats should only include logged player pokemon");
const settlementRunAgain = api.prepareFormalSettlement(settlementRun, "loss");
assert(settlementRunAgain.settlement?.id === settlementRun.settlement?.id, "settlement should be idempotent once prepared");

const doublesPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "doubles", seed: "formal-smoke-doubles-seed"}));
const doublesSelected = api.selectFormalStarterPokemon(doublesPrepared, [0, 1, 2, 3]);
const doublesPlanned = api.prepareFormalRoundPlan(doublesSelected);
assert(doublesPlanned.roundPlan.every(round => (round.participants.p2?.localTeam.pokemon.length || 0) === 4), "doubles formal opponents should bring four pokemon");

const gen9Profile = {...profile, battlePreference: normalizeBattlePreferenceV4({...profile.battlePreference, ruleSet: "gen9"})};
const gen9Prepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(gen9Profile, {mode: "singles", seed: "formal-smoke-gen9-seed"}));
const gen9Selected = api.selectFormalStarterPokemon(gen9Prepared, [0, 1, 2]);
const gen9Planned = api.prepareFormalRoundPlan(gen9Selected);
assert(gen9Planned.roundPlan[0]?.participants.p2?.bag.items.some(item => item.itemID === "system-tera-orb"), "gen9 formal NPC should receive tera system item");

const championPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "singles", streak: 3, seed: "formal-smoke-champion-seed"}));
const championSelected = api.selectFormalStarterPokemon(championPrepared, [0, 1, 2]);
const championPlanned = api.prepareFormalRoundPlan(championSelected);
const championOpponent = championPlanned.roundPlan[6]!.participants.p2!.localTeam.pokemon;
assert(championOpponent.every(pokemon => pokemon.level <= 65 && statTotal(pokemon.ivs) <= 186 && statTotal(pokemon.evs) <= 510), "late champion/villain should cap at formal boss-rush bounds");

const coopPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "coop", seed: "formal-smoke-coop-seed"}));
const coopSelected = api.selectFormalStarterPokemon(coopPrepared, [0, 1]);
const coopPlanned = api.prepareFormalRoundPlan(coopSelected);
assert(coopPlanned.roundPlan.length === 7, "coop formal plan should still create seven rounds");
assert(coopPlanned.roundPlan.flatMap(round => round.npcs).length === 21, "coop formal plan should create 14 opponents and 7 allies");
assert(coopPlanned.roundPlan.every(round => round.participants.p2 && round.participants.p3 && round.participants.p4), "coop formal rounds should include p2/p3/p4");
assert(coopPlanned.roundPlan.every(round =>
  (round.participants.p2?.localTeam.pokemon.length || 0) === 2
  && (round.participants.p3?.localTeam.pokemon.length || 0) === 2
  && (round.participants.p4?.localTeam.pokemon.length || 0) === 2
), "coop formal NPC participants should bring two pokemon each");

console.log("[formal-game-smoke] ok");

function statTotal(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, value) => sum + Number(value || 0), 0);
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
