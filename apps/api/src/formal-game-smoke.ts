import type {DexItemDetail, DexPokemonDetail, DexSearchRequest, DexSearchResult} from "@changebattle-v2/showdown-dex-core";
import {getPokemonBattleProfileV4} from "@changebattle-v2/showdown-battle-core/battleProfiles";
import {
  FORMAL_SHOP_COMMON_BERRY_POOL,
  FORMAL_SHOP_CONFUSION_BERRY_POOL,
  FORMAL_SHOP_ITEM_BASE_WEIGHTS,
  FORMAL_ROUND_COUNT,
  FORMAL_SHOP_CATEGORY_ORDER,
  FORMAL_SHOP_ITEM_POOL,
  FORMAL_SHOP_PRICE_LIMITS,
  FORMAL_SHOP_RESIST_BERRY_POOL,
  FORMAL_SHOP_SELL_RATE,
  FORMAL_SHOP_SLOTS_PER_CATEGORY,
  FORMAL_STARTING_MONEY,
  BATTLE_PRACTICE_MASTERY_NODE_ID,
  EMERGENCY_MEDICAL_CARE_NODE_ID,
  FREE_MEDICAL_CARE_NODE_ID,
  OUTPATIENT_MEDICAL_CARE_NODE_ID,
  STARTER_ROLE_PLAN,
  validateFormalShopCatalogV4,
  type PokemonPowerProfileV4,
} from "@changebattle-v2/core";
import {FORMAL_STARTER_SHINY_RATE, createFormalGameRunApi, formalShopItemPriceV4, formalShopRestockItemWeightV4, type FormalShopRestockContextV4} from "./formalGame.js";
import {
  enableTestModeForProfileV4,
  formalShopAutoRestockForStarChartV4,
  formalShopRowsForStarChartV4,
  normalizeStarChartV4,
  starChartHasBattlePracticeMasteryV4,
  starChartHasEastAsiaEducationV4,
  starChartHasEmergencyMedicalCareV4,
  starChartHasFreeMedicalCareV4,
  starChartHasOutpatientMedicalCareV4,
  starChartHasSpecialTrainingLockV4,
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
const formalBattleItemIds = new Set(FORMAL_SHOP_ITEM_POOL.battle);
const formalTrainingItemIds = new Set(FORMAL_SHOP_ITEM_POOL.training);
const formalRecoveryItemIds = new Set(FORMAL_SHOP_ITEM_POOL.recovery);

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
  getPokemonTutorSkills() {
    return ["protect", "raindance", "thunderbolt"].map(moveDetail);
  },
  getPokemonEggSkills() {
    return ["toxic", "willowisp", "substitute"].map(moveDetail);
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
  const movePowers: Record<string, number> = {
    protect: 0,
    raindance: 0,
    trickroom: 0,
    willowisp: 0,
    toxic: 0,
    calmmind: 0,
    swordsdance: 0,
    substitute: 0,
    watergun: 40,
    rockslide: 75,
    thunderbolt: 90,
    icebeam: 90,
    flamethrower: 90,
    psychic: 90,
    shadowball: 80,
    surf: 90,
    earthquake: 100,
  };
  const status = id === "protect" || id === "raindance" || id === "trickroom";
  return {
    id,
    name: id,
    nameZh: id,
    type: moveTypes[id] || "一般",
    category: status || movePowers[id] === 0 ? "变化" : "特殊",
    power: movePowers[id] ?? (status ? 0 : 40),
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
  const kind = isTm
    ? "tm"
    : id.endsWith("berry")
      ? "berry"
      : formalBattleItemIds.has(id)
        ? "held"
        : formalTrainingItemIds.has(id)
          ? "training"
          : formalRecoveryItemIds.has(id)
            ? itemRecoveryKind(id)
            : "recovery";
  return {
    id,
    name: isTm ? `TM: ${moveId}` : id,
    nameZh: isTm ? `技能机器：${moveId}` : id,
    kind,
    kindLabel: isTm ? "技能机器" : "道具",
    description: isTm ? "" : `${id} 描述`,
    effectSummary: isTm ? `${moveId} 招式学习器` : `${id} 效果`,
    cost: isTm ? 12000 : 3000,
    recoveryEffect: itemRecoveryEffect(id),
    trainingEffect: itemTrainingEffect(id),
    canBattleUse: kind === "berry" || kind === "recovery" || kind === "revive" || kind === "pp",
    canTake: kind === "berry" || kind === "held",
    moveId: isTm ? moveId : undefined,
    moveName: isTm ? moveId : undefined,
    moveNameZh: isTm ? `${moveId}技能` : undefined,
    iconUrl: `/items/${id}.png`,
    iconStyle: "",
  };
}

function itemRecoveryKind(id: string): DexItemDetail["kind"] {
  if (["revive", "maxrevive", "revivalherb"].includes(id)) return "revive";
  if (["ether", "maxether", "elixir", "maxelixir"].includes(id)) return "pp";
  return "recovery";
}

function itemRecoveryEffect(id: string): DexItemDetail["recoveryEffect"] {
  const fixedHp: Record<string, number> = {
    potion: 20,
    freshwater: 30,
    sodapop: 50,
    superpotion: 60,
    energypowder: 60,
    lemonade: 70,
    moomoomilk: 100,
    hyperpotion: 120,
    energyroot: 120,
    oranberry: 10,
  };
  if (fixedHp[id]) return {hp: {kind: "fixed", amount: fixedHp[id]}};
  if (id === "sitrusberry") return {hp: {kind: "fraction", numerator: 1, denominator: 4}};
  if (id === "maxpotion") return {hp: {kind: "full"}};
  if (id === "fullrestore") return {hp: {kind: "full"}, cureStatus: "all"};
  if (id === "fullheal" || id === "healpowder" || id === "lumberry") return {cureStatus: "all"};
  if (["antidote", "burnheal", "iceheal", "awakening", "paralyzeheal"].includes(id)) return {cureStatus: ["psn"]};
  if (id === "revive") return {revive: "half"};
  if (id === "maxrevive" || id === "revivalherb") return {revive: "full"};
  if (id === "ether" || id === "leppaberry") return {pp: {scope: "one", amount: 10}};
  if (id === "maxether") return {pp: {scope: "one", full: true}};
  if (id === "elixir") return {pp: {scope: "all", amount: 10}};
  if (id === "maxelixir") return {pp: {scope: "all", full: true}};
  return undefined;
}

function itemTrainingEffect(id: string): DexItemDetail["trainingEffect"] {
  const evStats: Record<string, "hp" | "atk" | "def" | "spa" | "spd" | "spe"> = {
    hpup: "hp",
    protein: "atk",
    iron: "def",
    calcium: "spa",
    zinc: "spd",
    carbos: "spe",
  };
  if (evStats[id]) return {kind: "ev", stat: evStats[id], mode: "add", target: 100};
  if (id === "rarecandy") return {kind: "level", amount: 1};
  if (id.endsWith("mint")) return {kind: "nature", nature: id.replace(/mint$/, "")};
  if (id === "abilitycapsule") return {kind: "ability", mode: "capsule"};
  if (id === "abilitypatch") return {kind: "ability", mode: "patch"};
  if (id === "bottlecap") return {kind: "iv", mode: "silver"};
  if (id === "goldbottlecap") return {kind: "iv", mode: "gold"};
  if (id === "graybottlecap") return {kind: "iv", mode: "gray"};
  return undefined;
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
const venusaurBattleProfile = getPokemonBattleProfileV4("venusaur");
assert(venusaurBattleProfile.roles.some(role => role.id === "Bulky Support"), "venusaur battle profile should include Bulky Support role");
assert(venusaurBattleProfile.roles.some(role => role.id === "Bulky Attacker"), "venusaur battle profile should include Bulky Attacker role");
assert(venusaurBattleProfile.roles.some(role => role.label === "耐久辅助"), "venusaur battle profile should map role label");
const charizardBattleProfile = getPokemonBattleProfileV4("charizard");
assert(charizardBattleProfile.roles.some(role => role.id === "Fast Attacker" || role.id === "Setup Sweeper"), "charizard battle profile should include offensive roles");
assert(getPokemonBattleProfileV4("missingno-local-test").roles.length === 0, "missing species battle profile should be empty");
assert(api.selectedCountForFormalMode("singles") === 3, "singles should select 3");
assert(api.selectedCountForFormalMode("doubles") === 4, "doubles should select 4");
assert(api.selectedCountForFormalMode("coop") === 2, "coop should select 2");
assert(prepared.starterCandidates.every(candidate => candidate.pokemon.itemId === ""), "player starters should not hold items");
assert(prepared.starterCandidates.every(candidate => !candidate.pokemon.heldItemInstanceId), "player starters should not bind held item instances");
assert(prepared.starterCandidates.every(candidate => ["rookie", "normal", "elite"].includes(candidate.pokemon.powerProfile || "")), "player starter power profile should not exceed elite");
prepared.starterCandidates.forEach((candidate, index) => assertPokemonPowerProfile(candidate.pokemon, `starter candidate ${index + 1}`, ["rookie", "normal", "elite"]));
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
assert(prepared.starterCandidates.map(candidate => candidate.pokemon.speciesId).join(",") === preparedAgain.starterCandidates.map(candidate => candidate.pokemon.speciesId).join(","), "same seed should be stable");
assert(prepared.starterCandidates.map(candidate => candidate.role).join(",") === "weather,trick-room,offense,offense,support,defense", "base six starter roles should match formal plan");
for (const role of ["weather", "trick-room", "offense", "support", "defense"]) {
  assert(prepared.starterCandidates.some(candidate => candidate.role === role), `missing starter role ${role}`);
}

const regionalFormProfile = {
  ...profile,
  battlePreference: normalizeBattlePreferenceV4({
    ...profile.battlePreference,
    allowedGenerations: [1],
  }),
};
const regionalFormRun = api.createFormalGameRun(regionalFormProfile, {mode: "singles", seed: "formal-smoke-regional-form-seed"});
const regionalFormPrepared = api.prepareFormalStarterCandidates(regionalFormRun, {count: 10});
assert(regionalFormPrepared.starterCandidates.some(candidate => candidate.pokemon.speciesId === "ninetalesalola"), "regional forms should be allowed");

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
assert(!starChartHasSpecialTrainingLockV4(starProfile.starChart), "special training lock should be off before unlock");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, "rest_special_training_lock");
assert(starProfile.battlePoints === 80, "special training lock should cost 20 BP");
assert(starChartHasSpecialTrainingLockV4(starProfile.starChart), "special training lock should unlock ability locks");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "rest_east_asia_education");
assert(starProfile.battlePoints === 65, "east asia education should cost 15 BP");
assert(starChartHasEastAsiaEducationV4(starProfile.starChart), "east asia education should unlock self-study probability tuning");
assert(formalShopRowsForStarChartV4(starProfile.starChart) === 1, "shop rows should start at one row");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "shop_luxury_counter_1");
assert(starProfile.battlePoints === 55, "luxury counter I should cost 10 BP");
assert(formalShopRowsForStarChartV4(starProfile.starChart) === 2, "luxury counter I should unlock second shop row");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "shop_luxury_counter_2");
assert(starProfile.battlePoints === 40, "luxury counter II should cost 15 BP");
assert(formalShopRowsForStarChartV4(starProfile.starChart) === 3, "luxury counter II should unlock third shop row");
assert(!formalShopAutoRestockForStarChartV4(starProfile.starChart), "shop auto restock should be off before unlock");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, "shop_auto_restock");
assert(starProfile.battlePoints === 80, "shop auto restock should cost 20 BP");
assert(formalShopAutoRestockForStarChartV4(starProfile.starChart), "shop auto restock should unlock purchase restocking");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, FREE_MEDICAL_CARE_NODE_ID);
assert(starProfile.battlePoints === 80, "free medical care should cost 20 BP");
assert(starChartHasFreeMedicalCareV4(starProfile.starChart), "free medical care should unlock revive fee waiver");
starProfile = unlockStarChartNodeForProfileV4(starProfile, EMERGENCY_MEDICAL_CARE_NODE_ID);
assert(starProfile.battlePoints === 55, "emergency medical care should cost 25 BP");
assert(starChartHasEmergencyMedicalCareV4(starProfile.starChart), "emergency medical care should unlock half-hp revive");
starProfile = unlockStarChartNodeForProfileV4(starProfile, OUTPATIENT_MEDICAL_CARE_NODE_ID);
assert(starProfile.battlePoints === 30, "outpatient medical care should cost 25 BP");
assert(starChartHasOutpatientMedicalCareV4(starProfile.starChart), "outpatient medical care should unlock alive pokemon healing");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, BATTLE_PRACTICE_MASTERY_NODE_ID);
assert(starProfile.battlePoints === 70, "battle practice mastery should cost 30 BP");
assert(starChartHasBattlePracticeMasteryV4(starProfile.starChart), "battle practice mastery should unlock battle level gain");

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
rookieOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `rookie NPC ${index + 1}`, ["rookie"]));
assert(rookieOpponent.every(pokemon => !["choicescarf", "choiceband", "choicespecs", "lifeorb", "focussash", "assaultvest", "heavydutyboots"].includes(pokemon.itemId)), "rookie NPC should not hold strong battle items");
normalOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `normal NPC ${index + 1}`, ["normal"]));
eliteOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `elite NPC ${index + 1}`, ["elite"]));
scaledGymOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `streak 0 gym NPC ${index + 1}`, ["elite"]));

const shop = api.getFormalRestShop(roundPlanned);
const shopProducts = api.getFormalRestShopProducts(roundPlanned);
assert(shopProducts.length === FORMAL_SHOP_CATEGORY_ORDER.length, "formal shop product view should expose one row by default");
assert(shopProducts.every(product => product.slotId && product.itemID && product.name && product.summary && product.price > 0), "formal shop product view should include display fields");
assert(shopProducts.every(product => shop?.categories[product.type]?.some(item => item.slotId === product.slotId)), "formal shop product view should preserve slot mapping");
const counterOneProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, "shop_luxury_counter_1");
const counterOneRun = api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(counterOneProfile, {mode: "singles", seed: "formal-smoke-counter-one-seed"})), [0, 1, 2]));
assert(api.getFormalRestShopProducts(counterOneRun).length === FORMAL_SHOP_CATEGORY_ORDER.length * 2, "luxury counter I should expose two shop rows");
const counterTwoProfile = unlockStarChartNodeForProfileV4(counterOneProfile, "shop_luxury_counter_2");
const counterTwoRun = api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(counterTwoProfile, {mode: "singles", seed: "formal-smoke-counter-two-seed"})), [0, 1, 2]));
assert(api.getFormalRestShopProducts(counterTwoRun).length === FORMAL_SHOP_CATEGORY_ORDER.length * 3, "luxury counter II should expose three shop rows");
const tmProduct = shopProducts.find(product => product.type === "tm");
assert(tmProduct && !/^技能机器[：:]/.test(tmProduct.name), "formal shop TM product should display move name instead of TM item prefix");
assert(shopProducts.every(product => product.price > 0 && product.price <= 900), "formal shop products should use low formal prices instead of dex prices");
assert(shopProducts.filter(product => product.type === "tm").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.tm.min, FORMAL_SHOP_PRICE_LIMITS.tm.max)), "formal shop TM prices should stay in 100-300 range");
assert(shopProducts.filter(product => product.type === "battle").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.battle.min, FORMAL_SHOP_PRICE_LIMITS.battle.max)), "formal shop battle item prices should stay in 300-900 range");
assert(shopProducts.filter(product => product.type === "training").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.training.min, FORMAL_SHOP_PRICE_LIMITS.training.max)), "formal shop training prices should stay in 10-400 range");
assert(shopProducts.filter(product => product.type === "recovery").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.recovery.min, FORMAL_SHOP_PRICE_LIMITS.recovery.max)), "formal shop recovery prices should stay in 10-150 range");
assert(shopProducts.filter(product => product.type === "berry").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.berry.min, FORMAL_SHOP_PRICE_LIMITS.berry.max)), "formal shop berry prices should stay in 5-30 range");
assert([...FORMAL_SHOP_COMMON_BERRY_POOL, ...FORMAL_SHOP_RESIST_BERRY_POOL, ...FORMAL_SHOP_CONFUSION_BERRY_POOL].every(itemID => itemDetail(itemID).kind === "berry"), "formal shop berry pools should resolve as dex berry items");
assert(new Set(FORMAL_SHOP_ITEM_POOL.berry).size === FORMAL_SHOP_ITEM_POOL.berry.length, "formal shop berry pool should not include duplicate items");
assert(FORMAL_SHOP_ITEM_POOL.berry.every(itemID => [...FORMAL_SHOP_COMMON_BERRY_POOL, ...FORMAL_SHOP_RESIST_BERRY_POOL, ...FORMAL_SHOP_CONFUSION_BERRY_POOL].includes(itemID)), "formal shop berry pool should only include curated battle berries");
assert(formalShopItemPriceV4({category: "tm", itemID: "tm:trickroom"}, itemDetail("tm:trickroom"), moveDetail) === 100, "status TM should cost 100");
assert(formalShopItemPriceV4({category: "tm", itemID: "tm:earthquake"}, itemDetail("tm:earthquake"), moveDetail) === 250, "100-power TM should cost 250");
assert(formalShopItemPriceV4({category: "battle", itemID: "focussash"}, itemDetail("focussash"), moveDetail) === 900, "focus sash should use top battle price tier");
assert(FORMAL_SHOP_ITEM_BASE_WEIGHTS.focussash < FORMAL_SHOP_ITEM_BASE_WEIGHTS.airballoon, "strong battle shop items should start rarer than light utility items");
const calmRestockContext: FormalShopRestockContextV4 = {
  roundIndex: 0,
  money: FORMAL_STARTING_MONEY,
  teamSize: 6,
  hpPressure: 0,
  faintedCount: 0,
  statusCount: 0,
  lowPpCount: 0,
  emptyHeldItemSlots: 0,
  physicalAttackers: 0,
  specialAttackers: 0,
  bulkyPokemon: 0,
  poisonPokemon: 0,
  lowLevelPokemon: 0,
  imperfectIvPokemon: 0,
};
const injuredRestockContext: FormalShopRestockContextV4 = {...calmRestockContext, hpPressure: 2, faintedCount: 1, statusCount: 1, lowPpCount: 2};
assert(formalShopRestockItemWeightV4("recovery", "potion", injuredRestockContext) > formalShopRestockItemWeightV4("recovery", "potion", calmRestockContext), "formal shop restock should favor HP recovery when team is injured");
assert(formalShopRestockItemWeightV4("recovery", "revive", injuredRestockContext) > formalShopRestockItemWeightV4("recovery", "revive", calmRestockContext), "formal shop restock should favor revive items when pokemon faint");
assert(formalShopRestockItemWeightV4("berry", "lumberry", injuredRestockContext) > formalShopRestockItemWeightV4("berry", "lumberry", calmRestockContext), "formal shop restock should favor status berries when pokemon have status");
assert(formalShopRestockItemWeightV4("recovery", "ether", injuredRestockContext) > formalShopRestockItemWeightV4("recovery", "ether", calmRestockContext), "formal shop restock should favor PP recovery when moves run low");
const boughtProduct = shopProducts.find(product => product.type === "berry") || shopProducts[0]!;
const buyResult = api.buyFormalRestShopItem(roundPlanned, boughtProduct.slotId);
assert(buyResult.ok, "formal shop buy should succeed for a displayed product");
assert(buyResult.run.money === roundPlanned.money - boughtProduct.price, "formal shop buy should deduct displayed product price");
assert(api.getFormalRestShopProducts(buyResult.run).find(product => product.slotId === boughtProduct.slotId)?.stock === 0, "formal shop should not auto restock before star chart unlock");
const boughtItem = buyResult.run.restRunSnapshot?.players.p1?.bag.items.find(item => item.itemID === boughtProduct.itemID && item.cost === boughtProduct.price);
assert(boughtItem, "formal shop bought item should enter bag with displayed product price");
if (boughtItem) {
  const sellPrice = Math.floor(boughtProduct.price * FORMAL_SHOP_SELL_RATE);
  const sellResult = api.sellFormalRestBagItems(buyResult.run, [boughtItem.id]);
  assert(sellResult.ok, "formal shop sell should accept bought item");
  assert(sellResult.run.money === buyResult.run.money + sellPrice, "formal shop sell should derive value from formal shop price");
}

const autoRestockProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, "shop_auto_restock");
const autoRestockRun = api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(autoRestockProfile, {mode: "singles", seed: "formal-smoke-auto-restock-seed"})), [0, 1, 2]));
const autoRestockProduct = api.getFormalRestShopProducts(autoRestockRun)[0]!;
const autoRestockResult = api.buyFormalRestShopItem(autoRestockRun, autoRestockProduct.slotId);
const autoRestockedProduct = api.getFormalRestShopProducts(autoRestockResult.run).find(product => product.slotId === autoRestockProduct.slotId);
assert(autoRestockResult.ok && autoRestockedProduct && autoRestockedProduct.stock > 0, "formal shop should auto restock after star chart unlock");

const statRerollPokemon = roundPlanned.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const statRerollPoor = api.rerollFormalRestPokemonStats({...roundPlanned, money: 9}, {pokemonId: statRerollPokemon.localPokemonId, part: "ivs", lockedStats: []});
assert(!statRerollPoor.ok && statRerollPoor.cost === 10 && statRerollPoor.run.money === 9, "formal stat reroll should reject insufficient funds without changing money");
const statRerollBeforeHpIv = statRerollPokemon.ivs.hp;
const statRerollBeforeAtkIv = statRerollPokemon.ivs.atk;
const statRerollResult = api.rerollFormalRestPokemonStats(roundPlanned, {pokemonId: statRerollPokemon.localPokemonId, part: "ivs", lockedStats: ["hp", "atk"]});
const statRerollAfter = statRerollResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(statRerollResult.ok, "formal stat reroll should apply");
assert(statRerollResult.cost === 20, "formal stat reroll should cost 10 plus 5 per lock");
assert(statRerollResult.run.money === roundPlanned.money - 20, "formal stat reroll should deduct cost");
assert(statRerollAfter.ivs.hp === statRerollBeforeHpIv && statRerollAfter.ivs.atk === statRerollBeforeAtkIv, "formal stat reroll should preserve locked stats");
assert(statTotal(statRerollAfter.ivs) <= (statRerollAfter.ivTotalCap || 186), "formal stat reroll IV total should stay within cap");
assert(statRerollResult.run.restRunSnapshot?.coinLog?.some(entry => entry.source === "team-reroll" && entry.amount === -20), "formal stat reroll should append coin log");

const trainingLesson = api.getFormalTrainingGroundLesson(roundPlanned);
const trainingLessonAgain = api.getFormalTrainingGroundLesson(roundPlanned);
assert(trainingLesson && trainingLesson.lessonId === trainingLessonAgain?.lessonId, "formal training ground lesson should be stable for same run node and roll");
assert(!trainingLesson || trainingLesson.fee === expectedTrainingGroundLessonFee(trainingLesson.kind), "formal training ground lesson should use balanced fee table");
const nextTrainingRun = api.advanceFormalTrainingGroundLesson(roundPlanned);
const nextTrainingLesson = api.getFormalTrainingGroundLesson(nextTrainingRun);
assert((nextTrainingRun.trainingGroundByNodeId?.[roundPlanned.restRunSnapshot!.currentNodeId]?.lessonRoll || 0) === 1, "formal training ground advance should increment lessonRoll");
assert(nextTrainingLesson && nextTrainingLesson.lessonId !== trainingLesson?.lessonId, "formal training ground advance should draw next lesson");
assert(!nextTrainingLesson || nextTrainingLesson.fee === expectedTrainingGroundLessonFee(nextTrainingLesson.kind), "formal training ground next lesson should use balanced fee table");
const poorTrainingRun = {...roundPlanned, money: 0};
const poorTrainingResult = api.applyFormalTrainingGroundLesson(poorTrainingRun, {pokemonId: roundPlanned.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!.localPokemonId});
assert(!poorTrainingResult.ok && poorTrainingResult.run.money === 0, "formal training ground should reject insufficient funds without changing money");
let moveLessonRun = roundPlanned;
let moveLesson = api.getFormalTrainingGroundLesson(moveLessonRun);
for (let guard = 0; moveLesson && !["tutor", "egg"].includes(moveLesson.kind) && guard < 12; guard += 1) {
  moveLessonRun = api.advanceFormalTrainingGroundLesson(moveLessonRun);
  moveLesson = api.getFormalTrainingGroundLesson(moveLessonRun);
}
assert(moveLesson && ["tutor", "egg"].includes(moveLesson.kind), "formal training ground should be able to draw a tutor or egg move lesson");
assert(moveLesson.fee === 100, "formal tutor and egg lessons should cost 100");
const moveLessonPokemon = moveLessonRun.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const moveLessonCandidates = moveLesson.kind === "tutor"
  ? ["thunderbolt", "protect", "raindance"]
  : moveLesson.kind === "egg"
    ? ["toxic", "willowisp", "substitute"]
    : ["flamethrower", "trickroom", "watergun", "tackle"];
let moveLessonMove = moveLessonCandidates[0]!;
let moveTrainingResult = api.applyFormalTrainingGroundLesson(moveLessonRun, {pokemonId: moveLessonPokemon.localPokemonId, moveId: moveLessonMove, replaceMoveIndex: 0});
for (const candidateMove of moveLessonCandidates.slice(1)) {
  if (moveTrainingResult.ok) break;
  moveLessonMove = candidateMove;
  moveTrainingResult = api.applyFormalTrainingGroundLesson(moveLessonRun, {pokemonId: moveLessonPokemon.localPokemonId, moveId: moveLessonMove, replaceMoveIndex: 0});
}
assert(moveTrainingResult.ok, `formal training ground move lesson should apply a valid source move: ${moveLesson.kind}/${moveLessonMove}/${moveTrainingResult.message}`);
assert(moveTrainingResult.run.money === moveLessonRun.money - moveLesson.fee, "formal training ground move lesson should deduct fee");
assert(moveTrainingResult.run.restRunSnapshot?.players.p1?.localTeam.pokemon[0]?.moves[0]?.moveId === moveLessonMove, "formal training ground move lesson should replace selected move slot");
let selfStudyRun = roundPlanned;
let selfStudyLesson = api.getFormalTrainingGroundLesson(selfStudyRun);
for (let guard = 0; selfStudyLesson?.kind !== "self-study" && guard < 8; guard += 1) {
  selfStudyRun = api.advanceFormalTrainingGroundLesson(selfStudyRun);
  selfStudyLesson = api.getFormalTrainingGroundLesson(selfStudyRun);
}
assert(selfStudyLesson?.kind === "self-study", "formal training ground should be able to draw a self-study lesson");
assert(selfStudyLesson.fee === 200, "formal self-study lesson should cost 200");
const selfStudyPokemon = selfStudyRun.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const selfStudyBeforeIvTotal = statTotal(selfStudyPokemon.ivs);
const selfStudyBeforeEvTotal = statTotal(selfStudyPokemon.evs);
const selfStudyBeforeIvCap = selfStudyPokemon.ivTotalCap || selfStudyBeforeIvTotal;
const selfStudyBeforeEvCap = selfStudyPokemon.evTotalCap || selfStudyBeforeEvTotal;
const selfStudyBeforeProfileIndex = powerProfileIndex(selfStudyPokemon.powerProfile || "rookie");
const selfStudyResult = api.applyFormalTrainingGroundLesson(selfStudyRun, {pokemonId: selfStudyPokemon.localPokemonId});
const selfStudyAfter = selfStudyResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(selfStudyResult.ok, "formal training ground self-study should apply");
assert(selfStudyResult.run.money === selfStudyRun.money - selfStudyLesson.fee, "formal training ground self-study should deduct fee");
assert(selfStudyResult.selfStudyEvent === "playful" || selfStudyResult.selfStudyEvent === "normal" || selfStudyResult.selfStudyEvent === "focused", "formal training ground self-study should report known event");
assert(selfStudyAfter.level >= 1 && selfStudyAfter.level <= 100, "formal training ground self-study should keep level in bounds");
assert(Object.values(selfStudyAfter.ivs).every(value => inRange(value, 0, 31)), "formal training ground self-study should keep IVs in bounds");
assert(Object.values(selfStudyAfter.evs).every(value => inRange(value, 0, 252)), "formal training ground self-study should keep EVs in bounds");
assert((selfStudyAfter.ivTotalCap || 0) >= selfStudyBeforeIvCap, "formal training ground self-study should not lower IV cap");
assert((selfStudyAfter.evTotalCap || 0) >= selfStudyBeforeEvCap, "formal training ground self-study should not lower EV cap");
assert(statTotal(selfStudyAfter.ivs) >= selfStudyBeforeIvTotal, "formal training ground self-study should not lower IV total");
assert(statTotal(selfStudyAfter.evs) >= selfStudyBeforeEvTotal, "formal training ground self-study should not lower EV total");
assert(statTotal(selfStudyAfter.ivs) <= (selfStudyAfter.ivTotalCap || 186), "formal training ground self-study IV total should stay within cap");
assert(statTotal(selfStudyAfter.evs) <= (selfStudyAfter.evTotalCap || 510), "formal training ground self-study EV total should stay within cap");
assert(powerProfileIndex(selfStudyAfter.powerProfile || "rookie") >= selfStudyBeforeProfileIndex, "formal training ground self-study should not lower power profile");
assertPokemonPowerProfile(selfStudyAfter, "self-study pokemon", undefined, {checkLevel: false});

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
const battleLogP1Team = withBattleLog.restRunSnapshot!.players.p1!.localTeam.pokemon;
const faintedSettlementRestRun = {
  ...withBattleLog.restRunSnapshot!,
  gameMap: withBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
  players: {
    ...withBattleLog.restRunSnapshot!.players,
    p1: {
      ...withBattleLog.restRunSnapshot!.players.p1!,
      localTeam: {
        ...withBattleLog.restRunSnapshot!.players.p1!.localTeam,
        pokemon: battleLogP1Team.map((pokemon, index) => index === 0 ? {...pokemon, entryHp: 0} : pokemon),
      },
    },
  },
};
const roundSettlementNoStar = api.settleFormalBattleRoundV4({...withBattleLog, restRunSnapshot: faintedSettlementRestRun});
const noStarSettlement = roundSettlementNoStar.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id];
assert(noStarSettlement?.rewardCoins === 500, "round settlement should award 500 coins");
assert(noStarSettlement?.reviveCost === 50, "round settlement should charge 50 coins per fainted pokemon without free care");
assert(noStarSettlement?.netCoins === 450, "round settlement should record net coins after medical fee");
assert(roundSettlementNoStar.money === withBattleLog.money + 450, "round settlement should apply net coins to money");
assert(roundSettlementNoStar.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!.entryHp === 1, "round settlement should revive fainted pokemon to 1 HP without emergency care");
const roundSettlementNoStarAgain = api.settleFormalBattleRoundV4(roundSettlementNoStar);
assert(roundSettlementNoStarAgain.money === roundSettlementNoStar.money, "round settlement should be idempotent");
assert(Object.keys(roundSettlementNoStarAgain.roundSettlementByNodeId || {}).length === Object.keys(roundSettlementNoStar.roundSettlementByNodeId || {}).length, "round settlement should not duplicate settlement records");
const medicalBattlePokemon = battleLogP1Team.map((pokemon, index) => index === 0
  ? {...pokemon, entryHp: 20, level: 50, maxHp: 150}
  : index === 1
    ? {...pokemon, entryHp: 0, level: 50, maxHp: 150}
    : pokemon);
const medicalSettlementRestRun = {
  ...withBattleLog.restRunSnapshot!,
  gameMap: withBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
  players: {
    ...withBattleLog.restRunSnapshot!.players,
    p1: {
      ...withBattleLog.restRunSnapshot!.players.p1!,
      localTeam: {
        ...withBattleLog.restRunSnapshot!.players.p1!.localTeam,
        pokemon: medicalBattlePokemon,
      },
    },
  },
};
const roundSettlementMedical = api.settleFormalBattleRoundV4({...withBattleLog, starChartSnapshot: starProfile.starChart, restRunSnapshot: medicalSettlementRestRun});
const medicalSettlement = roundSettlementMedical.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id];
assert(medicalSettlement?.reviveCost === 0, "free medical care should waive revive cost");
assert(medicalSettlement?.emergencyHealedPokemonIds.length === 1, "emergency care should record half-hp revive targets");
assert(medicalSettlement?.outpatientHealedPokemonIds.length === 1, "outpatient care should record alive healing targets");
assert(medicalSettlement?.leveledPokemonIds.length === 1, "battle practice mastery should level alive direct damage dealers");
assert(roundSettlementMedical.money === withBattleLog.money + 500, "free medical care settlement should keep full reward");
const medicalAfterTeam = roundSettlementMedical.restRunSnapshot!.players.p1!.localTeam.pokemon;
assert(medicalAfterTeam[1]!.entryHp === 75, "emergency care should revive fainted pokemon to half HP");
assert(medicalAfterTeam[0]!.level === 51, "battle practice mastery should increase level by one");
assert(medicalAfterTeam[0]!.entryHp > 20, "outpatient care should heal alive pokemon after level gain");
const lostSettlementRestRun = {
  ...withBattleLog.restRunSnapshot!,
  gameMap: withBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "lost" as const} : node),
};
const lostRoundSettlement = api.settleFormalBattleRoundV4({...withBattleLog, restRunSnapshot: lostSettlementRestRun});
assert(!lostRoundSettlement.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id], "round settlement should not run for lost battles");
assert(lostRoundSettlement.money === withBattleLog.money, "lost battle should not grant round settlement coins");
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
championOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `late champion/villain ${index + 1}`, ["champion"]));

const coopPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "coop", seed: "formal-smoke-coop-seed"}));
const coopSelected = api.selectFormalStarterPokemon(coopPrepared, [0, 1]);
const coopPlanned = api.prepareFormalRoundPlan(coopSelected);
assert(coopPlanned.roundPlan.length === 7, "coop formal plan should still create seven rounds");
assert(coopPlanned.roundPlan.flatMap(round => round.npcs).length === 14, "coop formal plan should create 14 opponents before battle ally dispatch");
assert(coopPlanned.roundPlan.every(round => round.participants.p2 && !round.participants.p3 && round.participants.p4), "coop formal rounds should defer p3 until battle transition");
assert(coopPlanned.roundPlan.every(round =>
  (round.participants.p2?.localTeam.pokemon.length || 0) === 2
  && (round.participants.p4?.localTeam.pokemon.length || 0) === 2
), "coop formal opponent participants should bring two pokemon each");
const coopBattlePrepared = api.prepareFormalBattleSession(coopPlanned);
assert(coopBattlePrepared.restRunSnapshot.players.p3?.controller === "script", "coop battle preparation should dispatch script ally p3");
assert(coopBattlePrepared.restRunSnapshot.gameMap[0]?.participants.p3?.localTeam.pokemon.length === 2, "coop battle ally should bring two pokemon");
assert(coopBattlePrepared.sessionInput.players.some(player => player.playerId === "p3" && player.controller === "script"), "coop battle session input should include script ally p3");

console.log("[formal-game-smoke] ok");

function statTotal(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, value) => sum + Number(value || 0), 0);
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function expectedTrainingGroundLessonFee(kind: string): number {
  if (kind === "tutor" || kind === "egg") return 100;
  return 200;
}

function assertPokemonPowerProfile(pokemon: {
  powerProfile?: PokemonPowerProfileV4;
  level: number;
  ivs: Record<string, number>;
  evs: Record<string, number>;
  ivTotalCap?: number;
  evTotalCap?: number;
}, label: string, allowedProfiles?: PokemonPowerProfileV4[], options: {checkLevel?: boolean} = {}) {
  const profile = pokemon.powerProfile || "rookie";
  if (allowedProfiles) assert(allowedProfiles.includes(profile), `${label} should use ${allowedProfiles.join("/")} power profile`);
  const rule = powerProfileRule(profile);
  const ivTotal = statTotal(pokemon.ivs);
  const evTotal = statTotal(pokemon.evs);
  const ivCap = pokemon.ivTotalCap ?? ivTotal;
  const evCap = pokemon.evTotalCap ?? evTotal;
  if (options.checkLevel !== false) assert(inRange(pokemon.level, rule.level[0], rule.level[1]), `${label} level should stay in ${profile} bounds`);
  assert(inRange(ivCap, rule.ivTotal[0], rule.ivTotal[1]), `${label} IV cap should stay in ${profile} bounds`);
  assert(inRange(evCap, rule.evTotal[0], rule.evTotal[1]), `${label} EV cap should stay in ${profile} bounds`);
  assert(ivTotal <= ivCap, `${label} IV total should not exceed instance cap`);
  assert(evTotal <= evCap, `${label} EV total should not exceed instance cap`);
}

function powerProfileRule(profile: PokemonPowerProfileV4): {level: [number, number]; ivTotal: [number, number]; evTotal: [number, number]} {
  if (profile === "rookie") return {level: [45, 50], ivTotal: [50, 90], evTotal: [100, 200]};
  if (profile === "normal") return {level: [49, 53], ivTotal: [80, 120], evTotal: [80, 280]};
  if (profile === "elite") return {level: [52, 55], ivTotal: [110, 150], evTotal: [260, 400]};
  if (profile === "boss") return {level: [56, 60], ivTotal: [140, 180], evTotal: [390, 510]};
  return {level: [61, 65], ivTotal: [186, 186], evTotal: [510, 510]};
}

function powerProfileIndex(profile: PokemonPowerProfileV4): number {
  const order: PokemonPowerProfileV4[] = ["rookie", "normal", "elite", "boss", "champion"];
  return Math.max(0, order.indexOf(profile));
}
