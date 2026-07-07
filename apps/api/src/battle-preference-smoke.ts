import {
  battleSystemsForRuleSetV4,
  createTrainingRunApi,
  normalizeBattlePreferenceV4,
} from "./training.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const normalized = normalizeBattlePreferenceV4({
  allowedGenerations: [9, 3, 3, 1],
  ruleSet: "gen7",
  legendaryBattle: true,
  battleBagEnabled: false,
});
assert(JSON.stringify(normalized.allowedGenerations) === JSON.stringify([1, 3, 9]), "generations should be unique and sorted");
assert(JSON.stringify(normalized.enabledBattleSystems) === JSON.stringify(["mega", "zmove"]), "gen7 should enable mega and zmove");
assert(normalized.competitionMode === "standard", "competition mode should default to standard");
assert(normalized.legendaryBattle === true, "legendaryBattle should persist");
assert(normalized.battleBagEnabled === false, "battleBagEnabled false should persist");

const fallback = normalizeBattlePreferenceV4({allowedGenerations: [9], ruleSet: "gen9"});
assert(JSON.stringify(fallback.allowedGenerations) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]), "less than three generations should fall back");
assert(normalizeBattlePreferenceV4({competitionMode: "single"}).competitionMode === "single", "single competition mode should persist");
assert(normalizeBattlePreferenceV4({competitionMode: "leagueLoop"}).competitionMode === "leagueLoop", "league loop competition mode should normalize for future use");
assert(JSON.stringify(battleSystemsForRuleSetV4("gen8")) === JSON.stringify(["dynamax"]), "gen8 should enable dynamax");
assert(JSON.stringify(battleSystemsForRuleSetV4("gen9")) === JSON.stringify(["terastal"]), "gen9 should enable terastal");
assert(JSON.stringify(battleSystemsForRuleSetV4("standard")) === JSON.stringify([]), "standard should not enable special systems");

const api = createTrainingRunApi({
  getPokemonDetail: (speciesId: string) => ({
    id: speciesId,
    name: speciesId,
    nameZh: speciesId,
    types: ["Normal"],
    abilities: [{id: "overgrow", name: "Overgrow", nameZh: "茂盛"}],
    baseStats: {hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80},
    spriteUrl: "",
    shinySpriteUrl: "",
    frontSpriteUrl: "",
    backSpriteUrl: "",
    frontShinySpriteUrl: "",
    backShinySpriteUrl: "",
    iconUrl: "",
    iconStyle: "",
    sprites: {
      frontUrl: "",
      backUrl: "",
      frontShinyUrl: "",
      backShinyUrl: "",
      fallbackFrontUrl: "",
      fallbackBackUrl: "",
      fallbackFrontShinyUrl: "",
      fallbackBackShinyUrl: "",
      iconUrl: "",
      iconStyle: "",
    },
  }),
  getPokemonSelfLearnSkills: () => [],
  getMoveDetail: (moveId: string) => ({
    id: moveId,
    name: moveId,
    nameZh: moveId,
    type: "Normal",
    category: "Physical",
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    target: "normal",
    priority: 0,
    flags: {},
    learnSources: [],
  }),
  getItemDetail: (itemId: string) => ({
    id: itemId,
    itemID: itemId,
    name: itemId,
    nameZh: itemId,
    iconUrl: "",
    category: "system",
    cost: 0,
    canSale: false,
    canBattleUse: false,
    canUse: false,
    canUseToPokemon: false,
    canTake: false,
  }),
  calculatePokemonStats: () => ({stats: {hp: 150, atk: 80, def: 80, spa: 80, spd: 80, spe: 80}}),
} as never, {
  async loadTrainingRun() {
    return null;
  },
  async saveTrainingRun(run) {
    return run;
  },
  async deleteTrainingRun() {},
});

const run = api.createTrainingRunGame({
  id: "profile",
  name: "偏好测试",
  avatarAsset: "/avatar.png",
  battlePreference: normalizeBattlePreferenceV4({ruleSet: "gen9", battleBagEnabled: false}),
});
assert(run.battlePreference.ruleSet === "gen9", "run should snapshot profile ruleSet");
assert(run.battlePreference.competitionMode === "standard", "training run should keep default competition mode");
assert(run.scenario.ruleSet === "gen9", "scenario should follow preference ruleSet");
assert(run.players.p1?.bag.battleBagEnabled === false, "player bag should follow battle bag preference");
assert(run.players.p1?.bag.items.some(item => item.itemID === "system-tera-orb"), "gen9 run should include tera orb");

console.log("[battle-preference-smoke] ok");
