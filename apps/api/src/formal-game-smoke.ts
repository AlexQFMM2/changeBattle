import type {DexPokemonDetail, DexSearchRequest, DexSearchResult} from "@changebattle-v2/showdown-dex-core";
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

console.log("[formal-game-smoke] ok");
