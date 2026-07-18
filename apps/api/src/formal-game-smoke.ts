import type {DexItemDetail, DexPokemonDetail, DexSearchRequest, DexSearchResult, DexTrainerDetail} from "@changebattle-v2/showdown-dex-core";
import {getPokemonBattleProfileV4} from "@changebattle-v2/showdown-battle-core/battleProfiles";
import {
  FORMAL_SHOP_COMMON_BERRY_POOL,
  FORMAL_SHOP_CONFUSION_BERRY_POOL,
  FORMAL_SHOP_ITEM_BASE_WEIGHTS,
  FORMAL_ROUND_COUNT,
  FORMAL_SHOP_CATEGORY_ORDER,
  FORMAL_COMPANION_ENTRY_NODE_IDS,
  FORMAL_SHOP_ITEM_POOL,
  FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL,
  FORMAL_SHOP_PRICE_OVERRIDES,
  FORMAL_SHOP_PRICE_LIMITS,
  FORMAL_SHOP_SPECIAL_MEDICINE_ITEM_POOL,
  FORMAL_SHOP_RESIST_BERRY_POOL,
  FORMAL_SHOP_SELL_RATE,
  FORMAL_SHOP_SLOTS_PER_CATEGORY,
  FORMAL_STARTING_MONEY,
  CHAMPION_FUND_NODE_ID,
  ELITE_FUND_NODE_ID,
  ELITE_EXCHANGE_EDUCATION_NODE_ID,
  EMERGENCY_MEDICAL_CARE_NODE_ID,
  EXCHANGE_ITEM_STEAL_NODE_ID,
  FREE_MEDICAL_CARE_NODE_ID,
  LOSSLESS_EXCHANGE_NODE_ID,
  OPPONENT_RUMOR_NODE_ID,
  OUTPATIENT_MEDICAL_CARE_NODE_ID,
  PENDING_SETTLEMENT_PURCHASE_BONUS_NODE_ID,
  PENDING_SETTLEMENT_SHOP_EXPORT_NODE_ID,
  SECOND_EXCHANGE_NODE_ID,
  SOULMATE_BASE_FRIENDSHIP_BONUS_NODE_ID,
  SOULMATE_HELD_ITEM_ENTRY_NODE_ID,
  SOULMATE_REWARD_NODE_ID,
  SOULMATE_SHINY_RATE_BONUS_NODE_ID,
  STAR_CHART_NODES_V4,
  STARTER_ROLE_PLAN,
  TRAVEL_FUND_NODE_ID,
  VICTORY_DIVIDEND_NODE_ID,
  formalMoveQualityRuleForSourceV4,
  formalNpcLevelBonusForTypeV4,
  formalNpcPowerProfileForTypeV4,
  formalPowerProfileRuleV4,
  formalTrainingGroundDynamicSelfStudyGainRuleV4,
  formalTrainingGroundSelfStudyEventWeightsV4,
  formalTrainingGroundStableSelfStudyGainRuleV4,
  createSoulmateCandidateListV4,
  normalizeSoulmateEvolutionRequirementV4,
  getNatureEffectsV4,
  normalizePlayerVaultV4,
  setPlayerVaultPokemonBattleMarkedV4,
  validateFormalShopCatalogV4,
  type PokemonPowerProfileV4,
} from "@changebattle-v2/core";
import {FORMAL_STARTER_SHINY_RATE, createFormalGameRunApi, formalShopItemPriceV4, formalShopRestockItemWeightV4, formalStarterCandidateToRentalPokemonV4, isRandomGeneratableSpeciesFormV4, type FormalGameRunV4, type FormalShopRestockContextV4} from "./formalGame.js";
import {addDebugPlayerVaultItemV4, addDebugPlayerVaultPokemonV4} from "./debugVault.js";
import {
  CARRY_PREP_ITEMS_NODE_ID,
  COMPULSORY_EDUCATION_NODE_ID,
  enableTestModeForProfileV4,
  FORMAL_SHOP_AUTO_RESTOCK_ENABLED,
  formalStartingMoneyForStarChartV4,
  formalShopRowsForStarChartV4,
  getUnlockedStarChartRuntimeEffectsV4,
  normalizeStarChartV4,
  starChartHasEastAsiaEducationV4,
  starChartHasEliteExchangeEducationV4,
  starChartHasEmergencyMedicalCareV4,
  starChartHasExchangeItemStealV4,
  starChartHasFreeMedicalCareV4,
  starChartHasLosslessExchangeV4,
  starChartHasMedicalInsuranceV4,
  starChartHasOpponentRumorV4,
  starChartHasOutpatientMedicalCareV4,
  starChartHasRuntimeEffectV4,
  starChartHasSecondExchangeV4,
  starChartHasPendingSettlementPurchaseBonusV4,
  starChartHasPendingSettlementShopExportV4,
  starChartHasSoulmateHeldItemEntryV4,
  starChartHasSoulmateRewardV4,
  starChartHasSpecialTrainingLockV4,
  starChartHasVictoryDividendV4,
  soulmateBaseFriendshipForStarChartV4,
  soulmateShinyRateForStarChartV4,
  soulmateVaultStarterSlotCountForStarChartV4,
  starterCandidateCountForStarChart,
  unlockStarChartNodeForProfileV4,
  type StarChartStateV4,
} from "./starChart.js";
import {normalizeBattlePreferenceV4} from "./training.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function toTestId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const MOCK_MEGA_CAPABLE_SPECIES = new Set(["charizard", "venusaur", "blastoise"]);

const pokemonDetails = [
  mockPokemon("pikachu", "皮卡丘", 25, ["Electric"], 320),
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
  mockPokemon("greninjabond", "甲贺忍蛙（牵绊变身）", 658, ["Water", "Dark"], 530, {baseSpecies: "Greninja", forme: "Bond"}),
  mockPokemon("flygon", "沙漠蜻蜓", 330, ["Ground", "Dragon"], 520),
  mockPokemon("breloom", "斗笠菇", 286, ["Grass", "Fighting"], 460),
  mockPokemon("venusaur", "妙蛙花", 3, ["Grass", "Poison"], 525),
  mockPokemon("blastoise", "水箭龟", 9, ["Water"], 530),
  mockPokemon("gyarados", "暴鲤龙", 130, ["Water", "Flying"], 540),
  mockPokemon("snorlax", "卡比兽", 143, ["Normal"], 540),
  mockPokemon("charmander", "小火龙", 4, ["Fire"], 309),
];
const pokemonById = new Map(pokemonDetails.map(detail => [detail.id, detail]));
const formalBattleItemIds = new Set(FORMAL_SHOP_ITEM_POOL.battle);
const formalTrainingItemIds = new Set(FORMAL_SHOP_ITEM_POOL.training);
const formalRecoveryItemIds = new Set(FORMAL_SHOP_ITEM_POOL.recovery);
const MOCK_SELF_LEARN_MOVE_IDS = ["tackle", "watergun", "protect", "raindance", "trickroom", "flamethrower", "hydropump", "waterfall", "gigadrain", "sludgebomb"];
const MOCK_TUTOR_MOVE_IDS = ["protect", "raindance", "thunderbolt"];
const MOCK_EGG_MOVE_IDS = ["toxic", "willowisp", "substitute"];
const MOCK_MACHINE_MOVE_IDS = ["watergun", "hydropump", "waterfall", "thunderbolt", "volttackle", "icebeam", "flamethrower", "hurricane", "gigadrain", "sludgebomb", "energyball", "surf", "earthquake", "protect"];
const mockTrainerDetails = [
  mockTrainer("gym:关都地区:小刚:1", "gym", "关都地区", "小刚"),
  mockTrainer("champion:关都地区:青绿:1", "champion", "关都地区", "青绿"),
  mockTrainer("villain:彩虹火箭队:坂木:1", "villain", "彩虹火箭队", "坂木"),
];
const mockTrainerById = new Map(mockTrainerDetails.map(trainer => [trainer.id, trainer]));

function mockEvolutionRoot(speciesId: string) {
  if (toTestId(speciesId) === "charizard") return {id: "charmander", name: "charmander", nameZh: "小火龙"};
  return {id: toTestId(speciesId), name: String(speciesId), nameZh: String(speciesId)};
}

function mockEvolutionEdges(speciesId: string) {
  if (toTestId(speciesId) === "charmander") return [
    {fromSpeciesId: "charmander", fromSpeciesName: "charmander", fromSpeciesNameZh: "小火龙", toSpeciesId: "charizard", toSpeciesName: "charizard", toSpeciesNameZh: "喷火龙", evoLevel: 16},
    {fromSpeciesId: "charmander", fromSpeciesName: "charmander", fromSpeciesNameZh: "小火龙", toSpeciesId: "scyther", toSpeciesName: "scyther", toSpeciesNameZh: "飞天螳螂", evoType: "trade" as const},
    {fromSpeciesId: "charmander", fromSpeciesName: "charmander", fromSpeciesNameZh: "小火龙", toSpeciesId: "lapras", toSpeciesName: "lapras", toSpeciesNameZh: "拉普拉斯", evoType: "useItem" as const, evoItem: "Fire Stone", evoItemId: "firestone"},
  ];
  return [];
}

const mockDex = {
  toDexId(value: unknown) {
    return toTestId(value);
  },
  searchDex(request: DexSearchRequest = {}): DexSearchResult {
    const offset = Number(request.offset || 0);
    const limit = Number(request.limit || 20);
    if (request.category === "trainers") {
      const query = String(request.query || "");
      const trainerRows = mockTrainerDetails
        .filter(trainer => {
          if (query === "type:villain") return trainer.trainerType === "villain";
          if (query.startsWith("type:")) return trainer.trainerType === query.slice(5);
          return !query || trainer.region.includes(query) || trainer.nameZh.includes(query) || trainer.id.includes(query);
        })
        .map(trainer => ({
          id: trainer.id,
          category: "trainers" as const,
          name: trainer.name,
          nameZh: trainer.nameZh,
          subtitle: `${trainer.region} / ${trainer.trainerTypeLabel}`,
          description: "",
          tags: [trainer.id, trainer.nameZh, trainer.region, `type:${trainer.trainerType}`],
        }));
      return {category: "trainers", query, offset, limit, total: trainerRows.length, hasMore: offset + limit < trainerRows.length, rows: trainerRows.slice(offset, offset + limit)};
    }
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
  getPokemonEvolutionRoot(speciesId: string) {
    return mockEvolutionRoot(speciesId);
  },
  getPokemonEvolutionEdges(speciesId: string) {
    return mockEvolutionEdges(speciesId);
  },
  getPokemonEvolutionTree(speciesId: string) {
    return {root: mockEvolutionRoot(speciesId), chain: [mockEvolutionRoot(speciesId)].filter(Boolean), edges: mockEvolutionEdges(speciesId)};
  },
  getPokemonSelfLearnSkills() {
    return MOCK_SELF_LEARN_MOVE_IDS.map(moveDetail);
  },
  getPokemonTutorSkills() {
    return MOCK_TUTOR_MOVE_IDS.map(moveDetail);
  },
  getPokemonEggSkills() {
    return MOCK_EGG_MOVE_IDS.map(moveDetail);
  },
  getPokemonMachineSkills() {
    return MOCK_MACHINE_MOVE_IDS.map(moveDetail);
  },
  getMoveDetail(id: string) {
    return moveDetail(id);
  },
  getItemDetail(id: string) {
    return itemDetail(id);
  },
  getTrainerDetail(id: string) {
    return mockTrainerById.get(id) || mockTrainerDetails[0]!;
  },
  getSystemBattleReforgeOptions(itemId: string, pokemon: {speciesId?: string; moves?: Array<{moveId?: string; id?: string; type?: string; typeId?: string}>} | null | undefined) {
    const megaStones: Record<string, {id: string; name: string; nameZh: string}> = {
      charizard: {id: "charizarditex", name: "Charizardite X", nameZh: "喷火龙进化石Ｘ"},
      venusaur: {id: "venusaurite", name: "Venusaurite", nameZh: "妙蛙花进化石"},
      blastoise: {id: "blastoisinite", name: "Blastoisinite", nameZh: "水箭龟进化石"},
    };
    const megaStone = pokemon?.speciesId ? megaStones[pokemon.speciesId] : undefined;
    if (itemId === "system-mega-stone" && megaStone) {
      return [{
        id: `mega:${megaStone.id}`,
        kind: "mega",
        name: megaStone.name,
        nameZh: megaStone.nameZh,
        description: "让宝可梦进行 Mega 进化。",
        mappedItemId: megaStone.id,
      }];
    }
    if (itemId === "system-z-crystal" && pokemon?.speciesId === "pikachu" && (pokemon?.moves || []).some(move => move.moveId === "volttackle" || move.id === "volttackle")) {
      return [{
        id: "z-crystal:pikaniumz",
        kind: "z-crystal",
        name: "Pikanium Z",
        nameZh: "皮卡丘Ｚ",
        description: "把伏特攻击转化为专属 Z 招式。",
        mappedItemId: "pikaniumz",
        requiredMoveId: "volttackle",
        requiredMoveName: "Volt Tackle",
        requiredMoveNameZh: "伏特攻击",
        type: "Electric",
        typeZh: "电",
      }];
    }
    if (itemId === "system-z-crystal" && (pokemon?.moves || []).some(move => move.moveId === "flamethrower" || move.id === "flamethrower" || move.type === "火" || move.typeId === "fire")) {
      return [{
        id: "z-crystal:firiumz",
        kind: "z-crystal",
        name: "Firium Z",
        nameZh: "火Ｚ",
        description: "把火属性招式转化为 Z 招式。",
        mappedItemId: "firiumz",
        type: "Fire",
        typeZh: "火",
      }];
    }
    if (itemId === "system-tera-orb") {
      return [{
        id: "tera:fire",
        kind: "tera",
        name: "Fire Tera",
        nameZh: "火太晶",
        description: "调律为火属性太晶。",
        mappedTeraType: "Fire",
        mappedTeraTypeZh: "火",
      }];
    }
    return [];
  },
  calculatePokemonStats({level}: {level: number}) {
    return {stats: {hp: 100 + level, atk: 80, def: 80, spa: 80, spd: 80, spe: 80}};
  },
} as never;

const api = createFormalGameRunApi(mockDex, {
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
    evolutionEdges: [],
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

function mockTrainer(id: string, trainerType: DexTrainerDetail["trainerType"], region: string, nameZh: string): DexTrainerDetail {
  return {
    id,
    trainerType,
    trainerTypeLabel: trainerType === "gym" ? "馆主" : trainerType === "champion" ? "冠军" : trainerType === "villain" ? "反派头目" : trainerType,
    sourceType: trainerType,
    region,
    role: trainerType,
    sourceTier: "",
    name: nameZh,
    nameZh,
    frontAsset: "",
    avatarAsset: "",
    teamPoolIds: [],
    notes: [],
    representativePokemon: [],
    teamPoolCount: 0,
    dialogueStateCount: 0,
    isBoss: true,
    dialogues: {},
    teamPools: [],
    teamPoolPresetCounts: {},
    presetTeamPreviews: [],
  };
}

function moveDetail(id: string) {
  const moveTypes: Record<string, string> = {
    watergun: "水",
    hydropump: "水",
    waterfall: "水",
    raindance: "水",
    trickroom: "超能力",
    flamethrower: "火",
    hurricane: "飞行",
    gigadrain: "草",
    sludgebomb: "毒",
    energyball: "草",
    thunderbolt: "电",
    volttackle: "电",
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
    hydropump: 110,
    waterfall: 80,
    rockslide: 75,
    thunderbolt: 90,
    volttackle: 120,
    icebeam: 90,
    flamethrower: 90,
    hurricane: 110,
    gigadrain: 75,
    sludgebomb: 90,
    energyball: 90,
    psychic: 90,
    shadowball: 80,
    surf: 90,
    earthquake: 100,
  };
  const status = id === "protect" || id === "raindance" || id === "trickroom" || id === "willowisp" || id === "toxic" || id === "calmmind" || id === "swordsdance" || id === "substitute";
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
  if (FORMAL_SHOP_SPECIAL_MEDICINE_ITEM_POOL.includes(id)) return {kind: "special-medicine", medicineId: id};
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
const natureEffects = getNatureEffectsV4();
assert(natureEffects.length === 25, "nature catalog should include 25 standard natures");
assert(natureEffects.find(nature => nature.id === "Adamant")?.plus === "atk" && natureEffects.find(nature => nature.id === "Adamant")?.minus === "spa", "Adamant should boost attack and lower special attack");
assert(natureEffects.find(nature => nature.id === "Brave")?.plus === "atk" && natureEffects.find(nature => nature.id === "Brave")?.minus === "spe", "Brave should boost attack and lower speed");
assert(natureEffects.find(nature => nature.id === "Serious")?.plus === "" && natureEffects.find(nature => nature.id === "Serious")?.minus === "", "Serious should be neutral");
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
assert(prepared.starterCandidates.every(candidate => candidate.pokemon.level === 50), "formal starter candidates should all start at level 50");
assert(prepared.starterCandidates.every(candidate => ["normal", "elite"].includes(candidate.pokemon.powerProfile || "")), "player starter power profile should be limited to normal or elite");
assert(prepared.starterCandidates.filter(candidate => candidate.pokemon.powerProfile === "normal").length === 5, "starter candidates should roll about 80% normal power profile for base six");
assert(prepared.starterCandidates.filter(candidate => candidate.pokemon.powerProfile === "elite").length === 1, "starter candidates should roll about 20% elite power profile for base six");
assert(formalNpcPowerProfileForTypeV4("rookie", 0, 0) === "rookie", "core NPC rules should map rookie to rookie profile");
assert(formalNpcPowerProfileForTypeV4("normal", 0, 1) === "normal", "core NPC rules should map normal to normal profile");
assert(formalNpcPowerProfileForTypeV4("elite", 0, 2) === "elite", "core NPC rules should map elite to elite profile");
assert(formalNpcPowerProfileForTypeV4("villain", 3, 6) === "champion", "core NPC rules should map villain to champion profile late run");
assert(formalNpcLevelBonusForTypeV4("rookie") === -2 && formalNpcLevelBonusForTypeV4("normal") === -1, "core NPC rules should soften early trainer levels");
assert(formalNpcLevelBonusForTypeV4("elite") === 0, "core NPC rules should keep elite trainers at player max level");
assert(formalNpcLevelBonusForTypeV4("gym") === 1 && formalNpcLevelBonusForTypeV4("elite4") === 1, "core NPC rules should give boss-tier trainers +1 level");
assert(formalNpcLevelBonusForTypeV4("champion") === 2 && formalNpcLevelBonusForTypeV4("villain") === 2, "core NPC rules should give champion-tier trainers +2 levels");
assert(formalMoveQualityRuleForSourceV4({kind: "player-starter"}).correctMoveCount === 1, "core move rules should require one correct player starter move");
assert(formalMoveQualityRuleForSourceV4({kind: "npc", trainerType: "normal"}).correctMoveCount === 2, "core move rules should require two correct normal NPC moves");
assert(formalMoveQualityRuleForSourceV4({kind: "npc", trainerType: "elite"}).correctMoveCount === 3, "core move rules should require three correct elite NPC moves");
assert(formalMoveQualityRuleForSourceV4({kind: "npc", trainerType: "villain", preset: true}).correctMoveCount === 4, "core move rules should let villain presets refill to four correct moves");
const mockStarterLearnableMoveIds = new Set([
  ...MOCK_SELF_LEARN_MOVE_IDS,
  ...MOCK_MACHINE_MOVE_IDS,
  ...MOCK_TUTOR_MOVE_IDS,
  ...MOCK_EGG_MOVE_IDS,
].map(toTestId));
prepared.starterCandidates.forEach((candidate, index) => {
  const profileIds = [candidate.pokemon.speciesId, pokemonById.get(candidate.pokemon.speciesId)?.baseSpecies || ""].map(toTestId).filter(Boolean);
  const recommendedMoveIds = new Set(profileIds.flatMap(speciesId => getPokemonBattleProfileV4(speciesId).suggestedMoveIds.map(toTestId)));
  const learnableRecommendedMoveIds = Array.from(recommendedMoveIds).filter(moveId => mockStarterLearnableMoveIds.has(moveId));
  if (!learnableRecommendedMoveIds.length) return;
  const generatedMoveIds = new Set(candidate.pokemon.moves.map(move => toTestId(move.moveId)));
  assert(learnableRecommendedMoveIds.some(moveId => generatedMoveIds.has(moveId)), `starter candidate ${index + 1} should keep one recommended learnable move`);
});
prepared.starterCandidates.forEach((candidate, index) => {
  const maxStarterIv = candidate.pokemon.powerProfile === "normal" ? 26 : 28;
  assert(Object.values(candidate.pokemon.ivs).every(value => value <= maxStarterIv), `starter candidate ${index + 1} should leave IV growth room`);
});
prepared.starterCandidates.forEach((candidate, index) => assertPokemonPowerProfile(candidate.pokemon, `starter candidate ${index + 1}`, ["normal", "elite"], {checkLevel: false}));
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.generation >= 1 && candidate.diagnostics.generation <= 3), "allowedGenerations should filter candidates");
assert(prepared.battlePreference.battleBagEnabled === true, "formal run should keep battlePreference snapshot battle bag flag");
assert(prepared.battlePreference.legendaryBattle === false, "formal run should keep battlePreference snapshot legendary flag");
assert(prepared.battlePreference.ruleSet === "standard", "formal run should keep battlePreference snapshot rule set");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.filters.battleBagEnabled === true), "starter diagnostics should preserve run battle bag snapshot");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.filters.legendaryBattle === false), "starter diagnostics should preserve run legendary snapshot");
assert(prepared.starterCandidates.every(candidate => candidate.diagnostics.filters.ruleSet === "standard"), "starter diagnostics should preserve run rule set snapshot");
const starterStatCandidate = prepared.starterCandidates[0]!;
const starterStatView = formalStarterCandidateToRentalPokemonV4(starterStatCandidate);
const starterCalculatedStats = {hp: 100 + starterStatCandidate.pokemon.level, atk: 80, def: 80, spa: 80, spd: 80, spe: 80};
assert(starterStatCandidate.display.stats?.atk === starterCalculatedStats.atk, "formal starter display stats should store calculated battle stats");
assert(starterStatView.stats.atk === starterCalculatedStats.atk, "formal starter rental view should expose calculated battle stats");
assert(starterStatView.stats.atk !== starterStatCandidate.pokemon.ivs.atk + starterStatCandidate.pokemon.evs.atk, "formal starter stats should not be IV plus EV");
assert(FORMAL_STARTER_SHINY_RATE === 1 / 30, "formal starter shiny rate should be 1/30");
assert(FORMAL_ROUND_COUNT === 7, "formal round count should stay 7");
assert(FORMAL_STARTING_MONEY === 0, "formal base starting money should be star-chart driven");
assert(STARTER_ROLE_PLAN.slice(0, 6).join(",") === "weather,trick-room,offense,offense,support,defense", "starter role plan first 6 roles should stay stable");
assert(prepared.starterCandidates.every(candidate => candidate.speciesRank !== "legendary"), "legendaryBattle false should exclude legendary rank");
assert(prepared.starterCandidates.every(candidate => ["rank4", "rank5", "rank6"].includes(candidate.speciesRank)), "player starter candidates should only use rank4-rank6");
assert(prepared.starterCandidates.filter(candidate => candidate.speciesRank === "rank5" || candidate.speciesRank === "rank6").length >= 2, "starter quality floor should keep at least two high-rank choices in base six");
assert(prepared.starterCandidates.filter(candidate => candidate.speciesRank === "rank6").length >= 1, "starter quality floor should keep at least one top-rank choice in base six");
assert(prepared.starterCandidates.every(candidate => !["squirtle", "charizardmegax", "charizardgmax", "walkingwake", "blacephalon", "greninjabond"].includes(candidate.pokemon.speciesId)), "starter filters should remove low rank, legendary, mega, gmax, and battle-only forms");
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
assert(regionalFormPrepared.starterCandidates.every(candidate => candidate.pokemon.speciesId !== "charizardmegax"), "starter filters should keep blocking mega forms");
assert(isRandomGeneratableSpeciesFormV4("ninetalesalola", pokemonById.get("ninetalesalola")!), "regional forms should be allowed");
assert(!isRandomGeneratableSpeciesFormV4("greninjabond", pokemonById.get("greninjabond")!), "battle bond Greninja form should not be random generatable");

let starProfile = {...profile, battlePoints: 100, starChart: normalizeStarChartV4()};
assert(starterCandidateCountForStarChart(starProfile.starChart) === 6, "root-only star chart should grant 6 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_1");
assert(starProfile.battlePoints === 98, "more choices I should cost 2 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 7, "more choices I should grant 7 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_2");
assert(starProfile.battlePoints === 95, "more choices II should cost 3 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 8, "more choices II should grant 8 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_3");
assert(starProfile.battlePoints === 91, "more choices III should cost 4 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 9, "more choices III should grant 9 starter candidates");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "starter_more_choices_4");
assert(starProfile.battlePoints === 86, "more choices IV should cost 5 BP");
assert(starterCandidateCountForStarChart(starProfile.starChart) === 10, "more choices IV should grant 10 starter candidates");
assert(getUnlockedStarChartRuntimeEffectsV4(starProfile.starChart).filter(effect => effect.id === "starter_candidate_bonus").length === 4, "more choices should expose four starter candidate runtime effects");
assert(!starChartHasSpecialTrainingLockV4(starProfile.starChart), "special training lock should be off before unlock");
starProfile = {...starProfile, battlePoints: 100};
let failedEastAsiaWithoutCompulsory = false;
try {
  unlockStarChartNodeForProfileV4(starProfile, "rest_east_asia_education");
} catch {
  failedEastAsiaWithoutCompulsory = true;
}
assert(failedEastAsiaWithoutCompulsory, "east asia education should require compulsory education first");
let failedSpecialTrainingWithoutEastAsia = false;
try {
  unlockStarChartNodeForProfileV4(starProfile, "rest_special_training_lock");
} catch {
  failedSpecialTrainingWithoutEastAsia = true;
}
assert(failedSpecialTrainingWithoutEastAsia, "special training lock should require east asia education first");
starProfile = unlockStarChartNodeForProfileV4(starProfile, COMPULSORY_EDUCATION_NODE_ID);
assert(starProfile.battlePoints === 98, "compulsory education should cost 2 BP");
assert(starChartHasRuntimeEffectV4(starProfile.starChart, "training_ground_group_stage_discount"), "compulsory education should unlock group-stage lesson discount");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "rest_east_asia_education");
assert(starProfile.battlePoints === 94, "east asia education should cost 4 BP");
assert(starChartHasEastAsiaEducationV4(starProfile.starChart), "east asia education should unlock self-study stable range and nature risk");
assert(starChartHasRuntimeEffectV4(starProfile.starChart, "self_study_stable_range"), "east asia education should unlock stable self-study ranges");
assert(starChartHasRuntimeEffectV4(starProfile.starChart, "self_study_nature_risk"), "east asia education should unlock self-study nature risk");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "rest_special_training_lock");
assert(starProfile.battlePoints === 89, "special training lock should cost 5 BP");
assert(starChartHasSpecialTrainingLockV4(starProfile.starChart), "special training lock should unlock ability locks");
assert(starChartHasRuntimeEffectV4(starProfile.starChart, "special_training_lock"), "special training lock should be declared as a runtime effect");
assert(formalShopRowsForStarChartV4(starProfile.starChart) === 1, "shop rows should start at one row");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "shop_luxury_counter_1");
assert(starProfile.battlePoints === 86, "luxury counter I should cost 3 BP");
assert(formalShopRowsForStarChartV4(starProfile.starChart) === 2, "luxury counter I should unlock second shop row");
let failedHeldItemWithoutFund = false;
try {
  unlockStarChartNodeForProfileV4({...starProfile, battlePoints: 100}, CARRY_PREP_ITEMS_NODE_ID);
} catch {
  failedHeldItemWithoutFund = true;
}
assert(failedHeldItemWithoutFund, "love-to-hold should require the soulmate item branch first");
starProfile = unlockStarChartNodeForProfileV4(starProfile, "shop_luxury_counter_2");
assert(starProfile.battlePoints === 82, "luxury counter II should cost 4 BP");
assert(formalShopRowsForStarChartV4(starProfile.starChart) === 3, "luxury counter II should unlock third shop row");
assert(FORMAL_SHOP_AUTO_RESTOCK_ENABLED, "shop auto restock should be enabled by default");
assert(formalStartingMoneyForStarChartV4(starProfile.starChart) === 0, "root-only star chart should start with zero formal money");
starProfile = {...starProfile, battlePoints: 200};
starProfile = unlockStarChartNodeForProfileV4(starProfile, TRAVEL_FUND_NODE_ID);
assert(starProfile.battlePoints === 199, "travel fund should cost 1 BP");
assert(formalStartingMoneyForStarChartV4(starProfile.starChart) === 500, "travel fund should set formal starting money to 500");
starProfile = unlockStarChartNodeForProfileV4(starProfile, ELITE_FUND_NODE_ID);
assert(starProfile.battlePoints === 197, "elite fund should cost 2 BP");
assert(formalStartingMoneyForStarChartV4(starProfile.starChart) === 1000, "elite fund should set formal starting money to 1000");
starProfile = unlockStarChartNodeForProfileV4(starProfile, CHAMPION_FUND_NODE_ID);
assert(starProfile.battlePoints === 193, "champion fund should cost 4 BP");
assert(formalStartingMoneyForStarChartV4(starProfile.starChart) === 1500, "champion fund should set formal starting money to 1500");
starProfile = unlockStarChartNodeForProfileV4(starProfile, VICTORY_DIVIDEND_NODE_ID);
assert(starProfile.battlePoints === 186, "victory dividend should cost 7 BP");
assert(starChartHasVictoryDividendV4(starProfile.starChart), "victory dividend should unlock settlement BP bonus");
starProfile = {...starProfile, battlePoints: 200};
for (const removedNodeId of ["shop_auto_restock", "starter_emergency_backpack", "starter_launch_kit", "starter_move_preview", "battle_practice_mastery"]) {
  assert(!STAR_CHART_NODES_V4.some(node => node.id === removedNodeId), `${removedNodeId} should be removed from star chart catalog`);
  let failedDisabledGiftUnlock = false;
  try {
    unlockStarChartNodeForProfileV4(starProfile, removedNodeId);
  } catch {
    failedDisabledGiftUnlock = true;
  }
  assert(failedDisabledGiftUnlock, `${removedNodeId} should be removed from star chart unlocks`);
}
assert(!starChartHasOpponentRumorV4(starProfile.starChart), "opponent rumor should be off before unlock");
assert(!starChartHasSoulmateRewardV4(starProfile.starChart), "soulmate reward should be off before unlock");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, SOULMATE_REWARD_NODE_ID);
assert(starProfile.battlePoints === 94, "soulmate reward should cost 6 BP");
assert(starChartHasSoulmateRewardV4(starProfile.starChart), "soulmate reward should unlock pending settlement egg dialogue");
assert(soulmateShinyRateForStarChartV4(starProfile.starChart) === 1 / 30, "soulmate shiny rate should default to 1/30");
assert(soulmateBaseFriendshipForStarChartV4(starProfile.starChart) === 70, "soulmate base friendship should default to 70");
starProfile = unlockStarChartNodeForProfileV4(starProfile, PENDING_SETTLEMENT_SHOP_EXPORT_NODE_ID);
assert(starProfile.battlePoints === 89, "imported formula should cost 5 BP");
assert(starChartHasPendingSettlementShopExportV4(starProfile.starChart), "imported formula should unlock pending settlement shop export");
starProfile = unlockStarChartNodeForProfileV4(starProfile, PENDING_SETTLEMENT_PURCHASE_BONUS_NODE_ID);
assert(starProfile.battlePoints === 83, "childcare fund should cost 6 BP");
assert(starChartHasPendingSettlementPurchaseBonusV4(starProfile.starChart), "childcare fund should unlock one purchase bonus");
let companionEntryProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, SOULMATE_REWARD_NODE_ID);
companionEntryProfile = unlockStarChartNodeForProfileV4(companionEntryProfile, FORMAL_COMPANION_ENTRY_NODE_IDS[0]);
assert(companionEntryProfile.battlePoints === 88, "companion entry I should require soulmate reward and cost 6 BP");
assert(soulmateVaultStarterSlotCountForStarChartV4(companionEntryProfile.starChart) === 1, "companion entry I should grant one vault starter slot");
companionEntryProfile = unlockStarChartNodeForProfileV4(companionEntryProfile, FORMAL_COMPANION_ENTRY_NODE_IDS[1]);
assert(companionEntryProfile.battlePoints === 80, "companion entry II should cost 8 BP");
assert(soulmateVaultStarterSlotCountForStarChartV4(companionEntryProfile.starChart) === 2, "companion entry II should grant two vault starter slots");
companionEntryProfile = unlockStarChartNodeForProfileV4(companionEntryProfile, SOULMATE_HELD_ITEM_ENTRY_NODE_ID);
assert(companionEntryProfile.battlePoints === 72, "love-to-hold should cost 8 BP");
assert(starChartHasSoulmateHeldItemEntryV4(companionEntryProfile.starChart), "love-to-hold should unlock held item entry");
const soulmateGrowthStarProfile = unlockStarChartNodeForProfileV4(unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, SOULMATE_REWARD_NODE_ID), SOULMATE_SHINY_RATE_BONUS_NODE_ID);
assert(soulmateShinyRateForStarChartV4(soulmateGrowthStarProfile.starChart) === 1 / 8, "european parents should raise soulmate shiny rate to 1/8");
const soulmateFriendshipStarProfile = unlockStarChartNodeForProfileV4(soulmateGrowthStarProfile, SOULMATE_BASE_FRIENDSHIP_BONUS_NODE_ID);
assert(soulmateBaseFriendshipForStarChartV4(soulmateFriendshipStarProfile.starChart) === 120, "love at first sight should raise base friendship to 120");
const soulmateRun = api.createFormalGameRun(soulmateFriendshipStarProfile, {mode: "singles", seed: "soulmate-smoke-seed"});
const soulmateRestRun = {
  id: "soulmate-rest-run",
  source: "training" as const,
  status: "battleEndedPendingSettlement" as const,
  scenario: {mode: "singles" as const},
  players: {
    p1: {
      id: "p1",
      name: "玩家",
      controller: "human" as const,
      alliance: "player" as const,
      localTeam: {
        id: "soulmate-team",
        name: "灵魂伴侣测试队",
        pokemon: [{
          localPokemonId: "formal-p1-1-charizard",
          showdownId: "charizard",
          speciesId: "charizard",
          name: "charizard",
          nameZh: "喷火龙",
          level: 50,
          gender: "M" as const,
          shiny: false,
          abilityId: "blaze",
          nature: "Hardy",
          moves: [{moveId: "flamethrower", pp: 15, maxPp: 15, remainingPp: 15}],
          evs: {hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20},
          ivs: {hp: 31, atk: 30, def: 29, spa: 28, spd: 27, spe: 26},
          entryHp: 150,
          maxHp: 150,
          entryStatus: "",
        }],
      },
      bag: {items: [], maxSize: 20},
    },
  },
  battleLog: [{
    id: "soulmate-log-1",
    key: "soulmate-log-1",
    at: "2026-01-01T00:00:00.000Z",
    sessionId: "battle-1",
    nodeId: "final",
    turn: 1,
    rawLogIndex: 1,
    eventType: "move" as const,
    sourcePlayerId: "p1" as const,
    sourcePokemonKey: "p1a: Charizard",
    sourcePokemonName: "喷火龙",
    targetPokemonKey: "foe-blastoise",
    moveId: "flamethrower",
    rawLine: "|move|p1a: Charizard|Flamethrower|p2a: Blastoise",
  }],
} as never;
const soulmatePendingRun: FormalGameRunV4 = {...soulmateRun, restRunSnapshot: soulmateRestRun, status: "resting"};
const soulmatePrepare = api.prepareFormalSoulmateEggHatch(soulmatePendingRun, "soulmate-candidate-formal-p1-1-charizard");
assert(soulmatePrepare.ok, `soulmate egg prepare should succeed: ${soulmatePrepare.message}`);
assert(soulmatePrepare.pokemon?.speciesId === "charmander", "soulmate egg should hatch evolution root species");
assert(soulmatePrepare.pokemon?.level === 50, "soulmate egg should hatch at level 50");
assert(soulmatePrepare.pokemon?.friendship === 120, "soulmate egg should use star chart friendship bonus");
assert(soulmatePrepare.pokemon?.originKind === "soulmate", "soulmate egg should mark origin kind");
assert(Object.values(soulmatePrepare.pokemon?.evs || {}).every(value => value === 0), "soulmate egg should reset EVs");
assert(Object.values(soulmatePrepare.pokemon?.ivs || {}).every(value => value >= 0 && value <= 31), "soulmate egg IVs should stay within legal range");
assert(JSON.stringify(soulmatePrepare.pokemon?.ivs) !== JSON.stringify({hp: 31, atk: 30, def: 29, spa: 28, spd: 27, spe: 26}), "soulmate egg should not inherit rental pokemon IVs");
assert(JSON.stringify(soulmatePrepare.pokemon?.ivs) !== JSON.stringify({hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}), "soulmate egg should not default to perfect IVs");
const soulmateClaim = api.claimFormalSoulmateEgg(soulmatePendingRun, normalizePlayerVaultV4(), "soulmate-candidate-formal-p1-1-charizard", "小焰");
assert(soulmateClaim.ok, `soulmate egg claim should succeed: ${soulmateClaim.message}`);
assert(soulmateClaim.playerVault.pokemon.length === 1, "soulmate egg claim should deposit one pokemon");
assert(soulmateClaim.pokemon?.nickname === "小焰", "soulmate egg claim should persist nickname");
assert(Boolean(soulmateClaim.run.soulmateEggClaimedAt), "soulmate egg claim should mark run claimed");
const soulmateClaimAgain = api.claimFormalSoulmateEgg(soulmateClaim.run, soulmateClaim.playerVault, "soulmate-candidate-formal-p1-1-charizard", "重复");
assert(soulmateClaimAgain.ok, "soulmate duplicate claim should be idempotent when vault still has pokemon");
assert(soulmateClaimAgain.playerVault.pokemon.length === 1, "soulmate duplicate claim should not duplicate pokemon");
const fullVault = normalizePlayerVaultV4({pokemonStoragePageCount: 1, pokemon: Array.from({length: 24}, (_, index) => ({
  playerPokemonId: `box-${index}`,
  speciesId: "pikachu",
  gender: "N",
  nature: "Hardy",
  abilityId: "static",
  evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
  ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
  moves: [{moveId: "tackle"}],
  friendship: 70,
  shiny: false,
  metAt: "2026-01-01T00:00:00.000Z",
  honors: [],
}))});
const soulmateFullClaim = api.claimFormalSoulmateEgg(soulmatePendingRun, fullVault, "soulmate-candidate-formal-p1-1-charizard");
assert(!soulmateFullClaim.ok && !soulmateFullClaim.run.soulmateEggClaimedAt, "soulmate claim should fail without marking run when vault is full");

const soulmateVaultPokemon = {
  playerPokemonId: "vault-starmie-1",
  speciesId: "starmie",
  nickname: "小海星",
  battleMarked: true,
  level: 88,
  originKind: "soulmate" as const,
  gender: "N" as const,
  nature: "Timid",
  abilityId: "analytic",
  heldItemId: "leftovers",
  evs: {hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252},
  ivs: {hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31},
  moves: [{moveId: "surf"}, {moveId: "icebeam"}, {moveId: "recover"}, {moveId: "thunderbolt"}],
  friendship: 210,
  shiny: true,
  metAt: "2026-01-01T00:00:00.000Z",
  honors: ["灵魂伴侣"],
};
const unmarkedVaultPokemon = {
  ...soulmateVaultPokemon,
  playerPokemonId: "vault-pikachu-1",
  speciesId: "pikachu",
  nickname: "小电",
  battleMarked: false,
  originKind: "debug-custom" as const,
  abilityId: "static",
  heldItemId: "lifeorb",
  shiny: false,
};
const soulmateVault = normalizePlayerVaultV4({pokemon: [unmarkedVaultPokemon, soulmateVaultPokemon]});
const markedVault = setPlayerVaultPokemonBattleMarkedV4(soulmateVault, "vault-pikachu-1", true);
assert(markedVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-pikachu-1")?.battleMarked, "battle mark helper should mark target pokemon");
const soulmateOnlyProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, SOULMATE_REWARD_NODE_ID);
assert(soulmateVaultStarterSlotCountForStarChartV4(soulmateOnlyProfile.starChart) === 0, "soulmate reward should not grant vault starter slots");
const soulmateOnlyPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(soulmateOnlyProfile, {mode: "singles", seed: "formal-smoke-soulmate-vault-disabled-seed"}), {playerVault: soulmateVault});
assert(soulmateOnlyPrepared.starterCandidates.every(candidate => candidate.pokemon.formalSourceKind !== "soulmate-vault"), "soulmate reward alone should not append vault starter candidates");
const companionEntryBaseProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, SOULMATE_REWARD_NODE_ID);
const companionEntryOneProfile = unlockStarChartNodeForProfileV4(companionEntryBaseProfile, FORMAL_COMPANION_ENTRY_NODE_IDS[0]);
assert(soulmateVaultStarterSlotCountForStarChartV4(companionEntryOneProfile.starChart) === 1, "companion entry I should grant one vault starter slot");
const soulmateVaultPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(companionEntryOneProfile, {mode: "singles", seed: "formal-smoke-soulmate-vault-seed"}), {playerVault: soulmateVault});
const soulmateVaultCandidate = soulmateVaultPrepared.starterCandidates.find(candidate => candidate.pokemon.formalSourceKind === "soulmate-vault");
assert(soulmateVaultPrepared.starterCandidates.length === 7, "companion entry I should append one vault starter candidate");
assert(soulmateVaultCandidate?.pokemon.sourcePlayerPokemonId === "vault-starmie-1", "marked vault pokemon should be preferred for soulmate starter candidate");
assert(soulmateVaultCandidate.pokemon.nickname === "小海星", "vault starter candidate should preserve nickname");
assert(soulmateVaultCandidate.pokemon.level === 88, "vault starter candidate should preserve trained level");
assert(soulmateVaultCandidate.pokemon.ivs.atk === 0 && soulmateVaultCandidate.pokemon.evs.spa === 252, "vault starter candidate should preserve IVs and EVs");
assert(soulmateVaultCandidate.pokemon.shiny, "vault starter candidate should preserve shiny");
assert(!soulmateVaultCandidate.pokemon.itemId, "companion entry I should not bring held item");
let companionEntryHeldProfile = unlockStarChartNodeForProfileV4(companionEntryOneProfile, FORMAL_COMPANION_ENTRY_NODE_IDS[1]);
assert(soulmateVaultStarterSlotCountForStarChartV4(companionEntryHeldProfile.starChart) === 2, "companion entry II should grant two vault starter slots");
companionEntryHeldProfile = unlockStarChartNodeForProfileV4(companionEntryHeldProfile, SOULMATE_HELD_ITEM_ENTRY_NODE_ID);
assert(starChartHasSoulmateHeldItemEntryV4(companionEntryHeldProfile.starChart), "love-to-hold should unlock held item entry");
const soulmateLevelThreePrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(companionEntryHeldProfile, {mode: "singles", seed: "formal-smoke-soulmate-vault-level-three-seed"}), {playerVault: soulmateVault});
const soulmateLevelThreeCandidates = soulmateLevelThreePrepared.starterCandidates.filter(candidate => candidate.pokemon.formalSourceKind === "soulmate-vault");
assert(soulmateLevelThreeCandidates.length === 2, "companion entry II should append two vault starter candidates when available");
assert(soulmateLevelThreeCandidates.some(candidate => candidate.pokemon.itemId === "leftovers"), "love-to-hold should bring held item into local team candidate");
const soulmateSelectedRun = api.selectFormalStarterPokemon(soulmateLevelThreePrepared, [0, 1, 6]);
const selectedSoulmate = soulmateSelectedRun.playerTeam?.pokemon.find(pokemon => pokemon.formalSourceKind === "soulmate-vault");
assert(selectedSoulmate?.nickname === "小海星", "selected soulmate vault pokemon should keep nickname in player team");
assert(selectedSoulmate?.itemId === "leftovers", "selected soulmate vault pokemon should keep held item when level three is unlocked");
const debugItemAdd = addDebugPlayerVaultItemV4(mockDex as any, normalizePlayerVaultV4(), "potion", 3);
assert(debugItemAdd.ok, `debug item add should succeed: ${debugItemAdd.ok ? debugItemAdd.message : debugItemAdd.reason}`);
if (debugItemAdd.ok) {
  assert(debugItemAdd.vault.items[0]?.sourceKind === "debug", "debug item should mark source kind");
  assert(debugItemAdd.vault.items[0]?.quantity === 3, "debug item should keep requested quantity");
}
const debugTmItemAdd = addDebugPlayerVaultItemV4(mockDex as any, normalizePlayerVaultV4(), "tm:surf", 1);
assert(debugTmItemAdd.ok, `debug TM item add should preserve virtual item id: ${debugTmItemAdd.ok ? debugTmItemAdd.message : debugTmItemAdd.reason}`);
if (debugTmItemAdd.ok) {
  assert(debugTmItemAdd.vault.items[0]?.itemId === "tm:surf", "debug TM item should keep tm:move item id");
  assert(debugTmItemAdd.vault.items[0]?.sourceKind === "debug", "debug TM item should mark source kind");
}
const debugPokemonAdd = addDebugPlayerVaultPokemonV4(mockDex as any, normalizePlayerVaultV4(), "charizard");
assert(debugPokemonAdd.ok, `debug pokemon add should succeed: ${debugPokemonAdd.ok ? debugPokemonAdd.message : debugPokemonAdd.reason}`);
if (debugPokemonAdd.ok) {
  assert(debugPokemonAdd.pokemon.originKind === "debug-custom", "debug pokemon should mark origin kind");
  assert(debugPokemonAdd.pokemon.speciesId === "charmander", "debug pokemon should use egg root species");
}
const debugPokemonFullAdd = addDebugPlayerVaultPokemonV4(mockDex as any, fullVault, "pikachu");
assert(!debugPokemonFullAdd.ok, "debug pokemon add should fail when vault is full");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, OPPONENT_RUMOR_NODE_ID);
assert(starProfile.battlePoints === 97, "opponent rumor should cost 3 BP");
assert(starChartHasOpponentRumorV4(starProfile.starChart), "opponent rumor should unlock paid opponent preview");
starProfile = {...starProfile, battlePoints: 200};
starProfile = unlockStarChartNodeForProfileV4(starProfile, LOSSLESS_EXCHANGE_NODE_ID);
assert(starProfile.battlePoints === 194, "lossless exchange should cost 6 BP");
assert(starChartHasLosslessExchangeV4(starProfile.starChart), "lossless exchange should unlock full-hp exchange");
starProfile = unlockStarChartNodeForProfileV4(starProfile, ELITE_EXCHANGE_EDUCATION_NODE_ID);
assert(starProfile.battlePoints === 186, "elite exchange education should cost 8 BP");
assert(starChartHasEliteExchangeEducationV4(starProfile.starChart), "elite exchange education should unlock exchange power profile boost");
starProfile = unlockStarChartNodeForProfileV4(starProfile, EXCHANGE_ITEM_STEAL_NODE_ID);
assert(starProfile.battlePoints === 178, "exchange item steal should cost 8 BP");
assert(starChartHasExchangeItemStealV4(starProfile.starChart), "exchange item steal should keep exchanged held item");
starProfile = unlockStarChartNodeForProfileV4(starProfile, SECOND_EXCHANGE_NODE_ID);
assert(starProfile.battlePoints === 168, "second exchange should cost 10 BP");
assert(starChartHasSecondExchangeV4(starProfile.starChart), "second exchange should unlock paid second exchange");
starProfile = {...starProfile, battlePoints: 100};
starProfile = unlockStarChartNodeForProfileV4(starProfile, FREE_MEDICAL_CARE_NODE_ID);
assert(starProfile.battlePoints === 95, "medical insurance should cost 5 BP");
assert(starChartHasFreeMedicalCareV4(starProfile.starChart), "legacy free medical helper should remain compatible");
assert(starChartHasMedicalInsuranceV4(starProfile.starChart), "medical insurance should unlock the insurance offer");
starProfile = unlockStarChartNodeForProfileV4(starProfile, EMERGENCY_MEDICAL_CARE_NODE_ID);
assert(starProfile.battlePoints === 89, "emergency medical care should cost 6 BP");
assert(starChartHasEmergencyMedicalCareV4(starProfile.starChart), "emergency medical care should unlock half-hp revive");
starProfile = unlockStarChartNodeForProfileV4(starProfile, OUTPATIENT_MEDICAL_CARE_NODE_ID);
assert(starProfile.battlePoints === 83, "outpatient medical care should cost 6 BP");
assert(starChartHasOutpatientMedicalCareV4(starProfile.starChart), "outpatient medical care should unlock alive pokemon healing");
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
assert(starterCandidateCountForStarChart(testModeProfile.starChart) === 10, "test mode should unlock starter choice nodes");
assert(STAR_CHART_NODES_V4
  .filter(node => !node.disabled && node.kind !== "event_preview")
  .every(node => (testModeProfile.starChart?.nodes[node.id] || 0) >= Math.max(1, Math.floor(Number(node.max_level || 1)))), "test mode should unlock all available star chart nodes");

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
assert(legendaryPrepared.starterCandidates.some(candidate => candidate.speciesRank === "legendary"), "legendaryBattle true should surface one legendary starter choice when the pool allows it");
assert(legendaryPrepared.starterCandidates.filter(candidate => candidate.speciesRank === "rank5" || candidate.speciesRank === "rank6" || candidate.speciesRank === "legendary").length >= 4, "ten starter candidates should keep several high-rank choices without making every choice top-tier");

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

const roundPlanned = await api.prepareFormalRoundPlan(selected);
const economyReadyRun = {...roundPlanned, money: 3000};
const rookieOpponent = roundPlanned.roundPlan[0]!.participants.p2!.localTeam.pokemon;
assert(roundPlanned.status === "resting", "formal round plan should enter resting status");
assert(roundPlanned.money === 0, "root-only formal run should start with zero money");
assert(roundPlanned.roundPlan.length === 7, "formal round plan should create seven rounds");
assert(roundPlanned.restRunSnapshot?.gameMap.length === 7, "formal rest snapshot should expose seven map nodes");
assert(roundPlanned.competitionMode === "standard", "formal run should default to standard competition mode");
assert(roundPlanned.restRunSnapshot?.competitionMode === "standard", "formal rest snapshot should keep competition mode");
assert(roundPlanned.roundPlan[0]?.participants.p2?.localTeam.pokemon.length === 3, "formal round planning should generate the first opponent");
assert(!roundPlanned.roundPlan[1]?.participants.p2, "formal round planning should defer the second opponent");
assert(roundPlanned.restRunSnapshot?.gameMap[0]?.participants.p2?.localTeam.pokemon.length === 3, "formal rest snapshot should expose first opponent");
assert(!roundPlanned.restRunSnapshot?.gameMap[1]?.participants.p2, "formal rest snapshot should hide future opponents");
assert(Array.isArray(roundPlanned.restRunSnapshot?.coinLog) && roundPlanned.restRunSnapshot?.coinLog.length === 0, "formal rest snapshot should start with empty coinLog");
assert(Array.isArray(roundPlanned.restRunSnapshot?.battleLog) && roundPlanned.restRunSnapshot?.battleLog.length === 0, "formal rest snapshot should start with empty battleLog");
assert(roundPlanned.restRunSnapshot?.currentNodeId === roundPlanned.restRunSnapshot?.gameMap[0]?.id, "formal rest snapshot should point at first round");
assert(roundPlanned.roundPlan[0]?.participants.p1?.localTeam.pokemon.every(pokemon => pokemon.itemId === ""), "formal player team should remain itemless in round plan");
const singleProfile = {...profile, battlePreference: normalizeBattlePreferenceV4({...profile.battlePreference, competitionMode: "single"})};
const singleSelected = api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(singleProfile, {mode: "singles", seed: "formal-smoke-single-mode-seed"})), [0, 1, 2]);
const singlePlanned = await api.prepareFormalRoundPlan(singleSelected);
assert(singlePlanned.competitionMode === "single", "single formal run should snapshot competition mode");
assert(singlePlanned.roundPlan.length === 1, "single formal run should create one round");
assert(singlePlanned.restRunSnapshot?.gameMap.length === 1, "single formal rest snapshot should expose one map node");
assert(singlePlanned.restRunSnapshot?.scenario.battleCount === 1, "single formal rest scenario should expose one battle");
const championFundProfile = unlockStarChartNodeForProfileV4(unlockStarChartNodeForProfileV4(unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, TRAVEL_FUND_NODE_ID), ELITE_FUND_NODE_ID), CHAMPION_FUND_NODE_ID);
const championFundRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(championFundProfile, {mode: "singles", seed: "formal-smoke-champion-fund-seed"})), [0, 1, 2]));
assert(championFundRun.money === 1500, "champion fund formal run should start with 1500 money");
const giftRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "singles", seed: "formal-smoke-starter-gifts-seed"})), [0, 1, 2]));
const giftItems = giftRun.restRunSnapshot!.players.p1!.bag.items;
assert(giftItems.filter(item => item.itemID === "superpotion").length === 0, "starter gift super potions should be removed");
assert(["muscleband", "wiseglasses", "shellbell"].every(itemID => !giftItems.some(item => item.itemID === itemID)), "starter held item gifts should be removed");
const giftTms = giftItems.filter(item => item.itemID.startsWith("tm:"));
assert(giftTms.length === 0, "starter TM gifts should be removed");
assert(roundPlanned.roundPlan.filter(round => round.participants.p2).every(round => (round.participants.p2?.localTeam.pokemon.length || 0) === 3), "generated singles formal opponents should bring three pokemon");
assert(roundPlanned.roundPlan.filter(round => round.participants.p2).every(round => {
  const team = round.participants.p2?.localTeam.pokemon || [];
  return new Set(team.map(pokemon => pokemon.speciesId)).size === team.length;
}), "formal opponent teams should avoid internal duplicate species");
rookieOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `rookie NPC ${index + 1}`, ["rookie"]));
rookieOpponent.forEach((pokemon, index) => assert(pokemon.level === 48, `rookie NPC ${index + 1} should use player max level minus two`));
assert(rookieOpponent.every(pokemon => !["choicescarf", "choiceband", "choicespecs", "lifeorb", "focussash", "assaultvest", "heavydutyboots"].includes(pokemon.itemId)), "rookie NPC should not hold strong battle items");
const eliteNpcRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "singles", streak: 2, seed: "formal-smoke-elite-npc-seed"})), [0, 1, 2]));
const eliteOpponent = eliteNpcRun.roundPlan[0]!.participants.p2!.localTeam.pokemon;
eliteOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `elite NPC ${index + 1}`, ["elite"], {checkLevel: false}));
eliteOpponent.forEach((pokemon, index) => assert(pokemon.level === 50, `elite NPC ${index + 1} should use player max level without a dynamic level bonus`));
eliteOpponent.forEach((pokemon, index) => assertRecommendedMoveCount(pokemon, 3, `elite NPC ${index + 1}`));

const shop = api.getFormalRestShop(roundPlanned);
const shopProducts = api.getFormalRestShopProducts(roundPlanned);
const standardShopProductCount = (rows: number) => FORMAL_SHOP_CATEGORY_ORDER.reduce((sum, category) => sum + Math.max(0, Math.min(FORMAL_SHOP_SLOTS_PER_CATEGORY[category], rows)), 0);
assert(shopProducts.length === standardShopProductCount(1), "formal shop product view should expose one row for active standard shelves by default");
assert(shopProducts.every(product => product.slotId && product.itemID && product.name && product.summary && product.price > 0), "formal shop product view should include display fields");
assert(shopProducts.every(product => shop?.categories[product.type]?.some(item => item.slotId === product.slotId)), "formal shop product view should preserve slot mapping");
assert(shopProducts.some(product => product.type === "recovery"), "standard formal shop should expose recovery products");
assert(shopProducts.some(product => product.type === "berry"), "standard formal shop should expose berry products");
assert(shopProducts.some(product => product.type === "battle"), "standard formal shop should expose battle products");
assert(shopProducts.some(product => product.type === "training"), "standard formal shop should expose special medicines");
assert(shopProducts.some(product => product.type === "tm"), "standard formal shop should expose TMs");
assert(!shopProducts.some(product => product.type === "parenting" || product.type === "evolution"), "standard formal shop should hide growth and evolution products");
const pendingShopRun = {
  ...roundPlanned,
  money: 3000,
  restRunSnapshot: {
    ...roundPlanned.restRunSnapshot!,
    status: "battleEndedPendingSettlement" as const,
  },
  shopByNodeId: {},
};
const pendingShopProducts = api.getFormalRestShopProducts(pendingShopRun);
assert(pendingShopProducts.filter(product => product.type === "training").length === 2, "pending settlement shop should expose two training products");
assert(pendingShopProducts.filter(product => product.type === "evolution").length === 2, "pending settlement shop should expose two evolution products");
assert(pendingShopProducts.filter(product => product.type === "tm").length === 2, "pending settlement shop should expose two TM products");
assert(pendingShopProducts.filter(product => product.type === "battle").length === 1, "pending settlement shop should expose one battle product");
assert(!pendingShopProducts.some(product => product.type === "recovery" || product.type === "berry" || product.type === "parenting"), "pending settlement shop should hide recovery, berry, and standalone parenting products");
assert(!pendingShopProducts.some(product => ["rarecandy", "ppup", "ppmax"].includes(product.itemID)), "pending settlement training products should exclude candy and PP items");
const insuranceBlocked = api.chooseFormalMedicalInsurance(roundPlanned, "basic");
assert(!insuranceBlocked.ok && insuranceBlocked.run.money === roundPlanned.money, "medical insurance should require star chart unlock");
const insuranceProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, FREE_MEDICAL_CARE_NODE_ID);
const insuranceRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(insuranceProfile, {mode: "singles", seed: "formal-smoke-insurance-seed"})), [0, 1, 2]));
const insurancePoor = api.chooseFormalMedicalInsurance({...insuranceRun, money: 199}, "basic");
assert(!insurancePoor.ok && insurancePoor.run.money === 199, "medical insurance should reject insufficient money without deduction");
const insuranceDeclined = api.chooseFormalMedicalInsurance({...insuranceRun, money: 500}, "decline");
assert(insuranceDeclined.ok && insuranceDeclined.run.medicalInsuranceOfferSeen && !insuranceDeclined.run.medicalInsurance, "medical insurance decline should mark offer seen without purchase");
const insuranceStandard = api.chooseFormalMedicalInsurance({...insuranceRun, money: 1000}, "standard");
assert(insuranceStandard.ok && insuranceStandard.run.money === 500, "standard medical insurance should deduct 500 money");
assert(insuranceStandard.run.medicalInsurance?.reviveCostPerPokemon === 15, "standard medical insurance should lower revive cost to 15");
assert(insuranceStandard.run.medicalInsurance?.recoveryShopPriceMultiplier === 0.8, "standard medical insurance should discount recovery prices to 80%");
assert(insuranceStandard.run.restRunSnapshot?.coinLog?.some(entry => entry.source === "medical-insurance" && entry.amount === -500), "medical insurance purchase should append coin log");
const insuranceRecoveryProduct = api.getFormalRestShopProducts(insuranceStandard.run).find(product => product.type === "recovery");
if (insuranceRecoveryProduct) {
  const undiscounted = formalShopItemPriceV4({category: "recovery", itemID: insuranceRecoveryProduct.itemID}, itemDetail(insuranceRecoveryProduct.itemID), moveDetail);
  assert(insuranceRecoveryProduct.price === Math.max(1, Math.floor(undiscounted * 0.8)), "standard medical insurance should discount recovery product price to 80%");
}
const basicInsurance = api.chooseFormalMedicalInsurance({...insuranceRun, money: 1000}, "basic");
assert(basicInsurance.run.medicalInsurance?.recoveryShopPriceMultiplier === 0.9, "basic medical insurance should discount recovery prices to 90%");
const premiumInsurance = api.chooseFormalMedicalInsurance({...insuranceRun, money: 2000}, "premium");
assert(premiumInsurance.run.medicalInsurance?.recoveryShopPriceMultiplier === 0.5, "premium medical insurance should discount recovery prices to 50%");
const damagedInsuranceRun = {
  ...insuranceStandard.run,
  money: 500,
  restRunSnapshot: {
    ...insuranceStandard.run.restRunSnapshot!,
    players: {
      ...insuranceStandard.run.restRunSnapshot!.players,
      p1: {
        ...insuranceStandard.run.restRunSnapshot!.players.p1!,
        localTeam: {
          ...insuranceStandard.run.restRunSnapshot!.players.p1!.localTeam,
          pokemon: insuranceStandard.run.restRunSnapshot!.players.p1!.localTeam.pokemon.map((pokemon, index) => ({
            ...pokemon,
            entryHp: index === 0 ? 0 : Math.max(1, Math.floor(pokemon.maxHp / 3)),
            entryStatus: index === 1 ? "brn" : pokemon.entryStatus,
            moves: pokemon.moves.map(move => ({...move, remainingPp: 0})),
          })),
        },
      },
    },
  },
};
const healResult = api.healFormalRestTeam(damagedInsuranceRun);
assert(healResult.ok && healResult.cost === 200 && healResult.run.money === 300, "standard medical insurance should make full team heal cost 200");
assert(healResult.run.restRunSnapshot?.players.p1?.localTeam.pokemon.every(pokemon => pokemon.entryHp === pokemon.maxHp && !pokemon.entryStatus && pokemon.moves.every(move => move.remainingPp === move.maxPp)), "formal full team heal should restore HP status and PP");
assert(healResult.run.restRunSnapshot?.coinLog?.some(entry => entry.source === "rest-heal" && entry.amount === -200), "formal full team heal should append coin log");
const poorHealResult = api.healFormalRestTeam({...damagedInsuranceRun, money: 199});
assert(!poorHealResult.ok && poorHealResult.run.money === 199, "formal full team heal should reject insufficient money without mutation");
const counterOneProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, "shop_luxury_counter_1");
const counterOneRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(counterOneProfile, {mode: "singles", seed: "formal-smoke-counter-one-seed"})), [0, 1, 2]));
assert(api.getFormalRestShopProducts(counterOneRun).length === standardShopProductCount(2), "luxury counter I should expose two shop rows on active standard shelves");
const counterTwoProfile = unlockStarChartNodeForProfileV4(counterOneProfile, "shop_luxury_counter_2");
const counterTwoRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(counterTwoProfile, {mode: "singles", seed: "formal-smoke-counter-two-seed"})), [0, 1, 2]));
assert(api.getFormalRestShopProducts(counterTwoRun).length === standardShopProductCount(3), "luxury counter II should expose three shop rows on active standard shelves");
const tmProduct = shopProducts.find(product => product.type === "tm");
assert(tmProduct && !/^技能机器[：:]/.test(tmProduct.name), "formal shop TM product should display move name instead of TM item prefix");
assert(shopProducts.every(product => product.price > 0 && product.price <= 900), "formal shop products should use low formal prices instead of dex prices");
assert(Object.entries(FORMAL_SHOP_ITEM_POOL).every(([category, itemIDs]) => itemIDs.every(itemID => Number.isFinite(FORMAL_SHOP_PRICE_OVERRIDES[itemID]) && inRange(FORMAL_SHOP_PRICE_OVERRIDES[itemID]!, FORMAL_SHOP_PRICE_LIMITS[category as keyof typeof FORMAL_SHOP_PRICE_LIMITS].min, FORMAL_SHOP_PRICE_LIMITS[category as keyof typeof FORMAL_SHOP_PRICE_LIMITS].max))), "formal shop pool items should all have explicit core prices inside category ranges");
assert(shopProducts.filter(product => product.type === "tm").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.tm.min, FORMAL_SHOP_PRICE_LIMITS.tm.max)), "formal shop TM prices should stay in 50-200 range");
assert(shopProducts.filter(product => product.type === "battle").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.battle.min, FORMAL_SHOP_PRICE_LIMITS.battle.max)), "formal shop battle item prices should stay in 150-450 range");
assert(shopProducts.filter(product => product.type === "training").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.training.min, FORMAL_SHOP_PRICE_LIMITS.training.max)), "formal shop training prices should stay in 10-400 range");
assert(shopProducts.filter(product => product.type === "parenting").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.parenting.min, FORMAL_SHOP_PRICE_LIMITS.parenting.max)), "formal shop parenting prices should stay in 80-800 range");
assert(shopProducts.filter(product => product.type === "evolution").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.evolution.min, FORMAL_SHOP_PRICE_LIMITS.evolution.max)), "formal shop evolution prices should stay in 120-300 range");
assert(shopProducts.filter(product => product.type === "recovery").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.recovery.min, FORMAL_SHOP_PRICE_LIMITS.recovery.max)), "formal shop recovery prices should stay in 10-150 range");
assert(shopProducts.filter(product => product.type === "berry").every(product => inRange(product.price, FORMAL_SHOP_PRICE_LIMITS.berry.min, FORMAL_SHOP_PRICE_LIMITS.berry.max)), "formal shop berry prices should stay in 5-30 range");
assert([...FORMAL_SHOP_COMMON_BERRY_POOL, ...FORMAL_SHOP_RESIST_BERRY_POOL, ...FORMAL_SHOP_CONFUSION_BERRY_POOL].every(itemID => itemDetail(itemID).kind === "berry"), "formal shop berry pools should resolve as dex berry items");
assert(new Set(FORMAL_SHOP_ITEM_POOL.berry).size === FORMAL_SHOP_ITEM_POOL.berry.length, "formal shop berry pool should not include duplicate items");
assert(FORMAL_SHOP_ITEM_POOL.berry.every(itemID => [...FORMAL_SHOP_COMMON_BERRY_POOL, ...FORMAL_SHOP_RESIST_BERRY_POOL, ...FORMAL_SHOP_CONFUSION_BERRY_POOL].includes(itemID)), "formal shop berry pool should only include curated battle berries");
assert(formalShopItemPriceV4({category: "tm", itemID: "tm:protect"}, itemDetail("tm:protect"), moveDetail) === 50, "protect TM should cost 50");
assert(formalShopItemPriceV4({category: "tm", itemID: "tm:psychic"}, itemDetail("tm:psychic"), moveDetail) === 150, "psychic TM should cost 150");
assert(formalShopItemPriceV4({category: "tm", itemID: "tm:earthquake"}, itemDetail("tm:earthquake"), moveDetail) === 200, "earthquake TM should cost 200");
assert(formalShopItemPriceV4({category: "battle", itemID: "focussash"}, itemDetail("focussash"), moveDetail) === 450, "focus sash should use discounted top battle price tier");
const psychicShop = api.getFormalRestShop(roundPlanned)!;
const psychicSlot = {...psychicShop.categories.tm[0]!, itemID: "tm:psychic", stock: 1};
const psychicRun = {
  ...roundPlanned,
  money: 150,
  shopByNodeId: {
    ...(roundPlanned.shopByNodeId || {}),
    [psychicShop.nodeId]: {
      ...psychicShop,
      categories: {
        ...psychicShop.categories,
        tm: [psychicSlot, ...psychicShop.categories.tm.slice(1)],
      },
    },
  },
};
const psychicProduct = api.getFormalRestShopProducts(psychicRun).find(product => product.slotId === psychicSlot.slotId);
assert(psychicProduct?.price === 150, "psychic TM display price should come from the core static price table");
const psychicPurchase = api.buyFormalRestShopItem(psychicRun, psychicSlot.slotId);
assert(psychicPurchase.ok && psychicPurchase.run.money === 0, "150 money should buy psychic TM for 150 and leave zero");
assert(FORMAL_SHOP_ITEM_BASE_WEIGHTS.focussash < FORMAL_SHOP_ITEM_BASE_WEIGHTS.airballoon, "strong battle shop items should start rarer than light utility items");
assert(JSON.stringify(FORMAL_SHOP_ITEM_POOL.training) === JSON.stringify(FORMAL_SHOP_SPECIAL_MEDICINE_ITEM_POOL), "standard formal training shop should only offer special medicines");
assert(!FORMAL_SHOP_ITEM_POOL.training.includes("rarecandy"), "standard formal training shop should not offer rare candy");
assert(!FORMAL_SHOP_ITEM_POOL.training.includes("ppup"), "standard formal training shop should not offer PP Up");
assert(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("adamantmint"), "pending settlement training shop should retain mints");
assert(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("bottlecap"), "pending settlement training shop should retain bottle caps");
assert(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("abilitycapsule"), "pending settlement training shop should retain ability capsules");
assert(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("heartscale"), "pending settlement training shop should include growth items");
assert(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("forbiddenmanual"), "pending settlement training shop should include rare growth items");
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
const buyResult = api.buyFormalRestShopItem(economyReadyRun, boughtProduct.slotId);
assert(buyResult.ok, "formal shop buy should succeed for a displayed product");
assert(buyResult.run.money === economyReadyRun.money - boughtProduct.price, "formal shop buy should deduct displayed product price");
assert((api.getFormalRestShopProducts(buyResult.run).find(product => product.slotId === boughtProduct.slotId)?.stock || 0) > 0, "formal shop should auto restock by default after purchase");
const boughtItem = buyResult.run.restRunSnapshot?.players.p1?.bag.items.find(item => item.itemID === boughtProduct.itemID && item.cost === boughtProduct.price);
assert(boughtItem, "formal shop bought item should enter bag with displayed product price");
if (boughtItem) {
  const sellPrice = Math.floor(boughtProduct.price * FORMAL_SHOP_SELL_RATE);
  const sellResult = api.sellFormalRestBagItems(buyResult.run, [boughtItem.id]);
  assert(sellResult.ok, "formal shop sell should accept bought item");
  assert(sellResult.run.money === buyResult.run.money + sellPrice, "formal shop sell should derive value from formal shop price");
}
const trainingRestockShop = api.getFormalRestShop(roundPlanned)!;
const trainingRestockSlot = {...trainingRestockShop.categories.training[0]!, itemID: "emetic", stock: 1};
const trainingRestockRun = {
  ...roundPlanned,
  money: 3000,
  shopByNodeId: {
    ...(roundPlanned.shopByNodeId || {}),
    [trainingRestockShop.nodeId]: {
      ...trainingRestockShop,
      categories: {
        ...trainingRestockShop.categories,
        training: [trainingRestockSlot, ...trainingRestockShop.categories.training.slice(1)],
      },
    },
  },
};
const trainingRestockResult = api.buyFormalRestShopItem(trainingRestockRun, trainingRestockSlot.slotId);
const trainingRestockedProduct = api.getFormalRestShopProducts(trainingRestockResult.run).find(product => product.slotId === trainingRestockSlot.slotId);
assert(trainingRestockResult.ok && trainingRestockedProduct && FORMAL_SHOP_SPECIAL_MEDICINE_ITEM_POOL.includes(trainingRestockedProduct.itemID), "training shop restock should stay in the special medicine pool");

const pendingNoExportProduct = pendingShopProducts[0]!;
const pendingNoExportBuy = api.buyFormalRestShopItem(pendingShopRun, pendingNoExportProduct.slotId);
assert(pendingNoExportBuy.ok, "pending settlement shop buy should work without export unlock");
assert(!pendingNoExportBuy.run.pendingSettlementExportItemInstanceIds?.length, "pending settlement shop buy should not export items without imported formula");
const noExportVaultMerge = smokeMergeFormalRunBagIntoPlayerVault(pendingNoExportBuy.run);
assert(noExportVaultMerge.depositedItemCount === 0, "pending settlement shop item should not enter vault without export ids");
const legacyPrepVault = normalizePlayerVaultV4({items: [{itemId: "potion", quantity: 1, boxKind: "prep", slotIndex: 0}]});
assert(legacyPrepVault.items[0]?.boxKind === "storage", "legacy prep vault items should normalize to storage");

const pendingExportProfile = unlockStarChartNodeForProfileV4(unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, SOULMATE_REWARD_NODE_ID), PENDING_SETTLEMENT_SHOP_EXPORT_NODE_ID);
const pendingExportRun = {
  ...pendingShopRun,
  starChartSnapshot: pendingExportProfile.starChart,
  shopByNodeId: {},
};
const pendingExportProduct = api.getFormalRestShopProducts(pendingExportRun)[0]!;
const pendingExportBuy = api.buyFormalRestShopItem(pendingExportRun, pendingExportProduct.slotId);
assert(pendingExportBuy.ok && pendingExportBuy.run.pendingSettlementExportItemInstanceIds?.length === 1, "imported formula should mark pending settlement shop item for export");
const exportVaultMerge = smokeMergeFormalRunBagIntoPlayerVault(pendingExportBuy.run);
assert(exportVaultMerge.depositedItemCount === 1, "imported formula should deposit pending settlement shop item into player vault");

const pendingFundProfile = unlockStarChartNodeForProfileV4(pendingExportProfile, PENDING_SETTLEMENT_PURCHASE_BONUS_NODE_ID);
const pendingFundRun = {
  ...pendingShopRun,
  starChartSnapshot: pendingFundProfile.starChart,
  shopByNodeId: {},
};
const pendingFundProduct = api.getFormalRestShopProducts(pendingFundRun)[0]!;
const pendingFundBuy = api.buyFormalRestShopItem(pendingFundRun, pendingFundProduct.slotId);
assert(pendingFundBuy.ok, "childcare fund first purchase should succeed");
assert(pendingFundBuy.run.money === pendingFundRun.money - pendingFundProduct.price + 500, "childcare fund should grant 500 money on first pending settlement purchase");
assert(Boolean(pendingFundBuy.run.pendingSettlementPurchaseBonusClaimedAt), "childcare fund should mark the run bonus as claimed");
const pendingFundSecondProduct = api.getFormalRestShopProducts(pendingFundBuy.run).find(product => product.slotId !== pendingFundProduct.slotId) || api.getFormalRestShopProducts(pendingFundBuy.run)[0]!;
const pendingFundSecondBuy = api.buyFormalRestShopItem(pendingFundBuy.run, pendingFundSecondProduct.slotId);
assert(pendingFundSecondBuy.ok && pendingFundSecondBuy.run.money === pendingFundBuy.run.money - pendingFundSecondProduct.price, "childcare fund should not trigger twice in one run");

const autoRestockRun = await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "singles", seed: "formal-smoke-auto-restock-seed"})), [0, 1, 2]));
const autoRestockProduct = api.getFormalRestShopProducts(autoRestockRun)[0]!;
const autoRestockResult = api.buyFormalRestShopItem({...autoRestockRun, money: 3000}, autoRestockProduct.slotId);
const autoRestockedProduct = api.getFormalRestShopProducts(autoRestockResult.run).find(product => product.slotId === autoRestockProduct.slotId);
assert(autoRestockResult.ok && autoRestockedProduct && autoRestockedProduct.stock > 0, "formal shop should auto restock by default");

const statRerollPokemon = roundPlanned.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const statRerollPoor = api.rerollFormalRestPokemonStats({...roundPlanned, money: 9}, {pokemonId: statRerollPokemon.localPokemonId, part: "ivs", lockedStats: []});
assert(!statRerollPoor.ok && statRerollPoor.cost === 10 && statRerollPoor.run.money === 9, "formal stat reroll should reject insufficient funds without changing money");
const statRerollBeforeHpIv = statRerollPokemon.ivs.hp;
const statRerollBeforeAtkIv = statRerollPokemon.ivs.atk;
const statRerollBeforeIvTotal = statTotal(statRerollPokemon.ivs);
const statRerollResult = api.rerollFormalRestPokemonStats(economyReadyRun, {pokemonId: statRerollPokemon.localPokemonId, part: "ivs", lockedStats: ["hp", "atk"]});
const statRerollAfter = statRerollResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(statRerollResult.ok, "formal stat reroll should apply");
assert(statRerollResult.cost === 20, "formal stat reroll should cost 10 plus 5 per lock");
assert(statRerollResult.run.money === economyReadyRun.money - 20, "formal stat reroll should deduct cost");
assert(statRerollAfter.ivs.hp === statRerollBeforeHpIv && statRerollAfter.ivs.atk === statRerollBeforeAtkIv, "formal stat reroll should preserve locked stats");
assert(statTotal(statRerollAfter.ivs) === statRerollBeforeIvTotal, "formal stat reroll IV total should preserve current total instead of old cap");
assert(statRerollResult.run.restRunSnapshot?.coinLog?.some(entry => entry.source === "team-reroll" && entry.amount === -20), "formal stat reroll should append coin log");

const previewNode = roundPlanned.restRunSnapshot!.gameMap.find(node => node.id === roundPlanned.restRunSnapshot!.currentNodeId)!;
const previewOpponent = previewNode.participants.p2!.localTeam.pokemon[0]!;
const previewUnlockKey = `${previewNode.id}:p2:${previewOpponent.localPokemonId}`;
const previewWithoutStar = api.unlockFormalRestOpponentPreview(roundPlanned, {unlockKey: previewUnlockKey});
assert(!previewWithoutStar.ok && previewWithoutStar.run.money === roundPlanned.money, "formal opponent preview should require opponent rumor star chart");
const rumorProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, OPPONENT_RUMOR_NODE_ID);
const rumorRun = {...(await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(rumorProfile, {mode: "singles", seed: "formal-smoke-opponent-rumor-seed"})), [0, 1, 2]))), money: 100};
const rumorNode = rumorRun.restRunSnapshot!.gameMap.find(node => node.id === rumorRun.restRunSnapshot!.currentNodeId)!;
const rumorPokemon = rumorNode.participants.p2!.localTeam.pokemon[0]!;
const rumorUnlockKey = `${rumorNode.id}:p2:${rumorPokemon.localPokemonId}`;
const poorRumorResult = api.unlockFormalRestOpponentPreview({...rumorRun, money: 9}, {unlockKey: rumorUnlockKey});
assert(!poorRumorResult.ok && poorRumorResult.run.money === 9, "formal opponent preview should reject insufficient funds without changing money");
const rumorResult = api.unlockFormalRestOpponentPreview(rumorRun, {unlockKey: rumorUnlockKey});
assert(rumorResult.ok, "formal opponent preview should unlock with star chart");
assert(rumorResult.cost === 10, "formal opponent preview should cost 10 coins");
assert(rumorResult.run.money === rumorRun.money - 10, "formal opponent preview should deduct 10 coins");
assert(rumorResult.run.restRunSnapshot?.restPreviewUnlocks?.[rumorUnlockKey], "formal opponent preview should persist unlock key");
assert(rumorResult.run.restRunSnapshot?.coinLog?.some(entry => entry.source === "opponent-rumor" && entry.amount === -10), "formal opponent preview should append coin log");
const rumorAgain = api.unlockFormalRestOpponentPreview(rumorResult.run, {unlockKey: rumorUnlockKey});
assert(rumorAgain.ok && rumorAgain.run.money === rumorResult.run.money && rumorAgain.cost === 0, "formal opponent preview should not charge repeated unlocks");

const trainingLesson = api.getFormalTrainingGroundLesson(roundPlanned);
const trainingLessonAgain = api.getFormalTrainingGroundLesson(roundPlanned);
assert(trainingLesson && trainingLesson.lessonId === trainingLessonAgain?.lessonId, "formal training ground lesson should be stable for same run node and roll");
assert(!trainingLesson || trainingLesson.fee === expectedTrainingGroundLessonFee(trainingLesson.kind), "formal training ground lesson should use balanced fee table");
const soulmateVaultRestRun = {...(await api.prepareFormalRoundPlan(soulmateSelectedRun)), money: 500};
const protectedSoulmatePokemon = soulmateVaultRestRun.restRunSnapshot!.players.p1!.localTeam.pokemon.find(pokemon => pokemon.formalSourceKind === "soulmate-vault")!;
const protectedSoulmateHeldItem = soulmateVaultRestRun.restRunSnapshot!.players.p1!.bag.items.find(item => item.id === protectedSoulmatePokemon.heldItemInstanceId);
assert(protectedSoulmatePokemon.heldItemInstanceId && protectedSoulmateHeldItem?.itemID === "leftovers", "selected soulmate held item should be copied into formal rest bag");
assert(protectedSoulmateHeldItem?.sourceKind === "soulmate-vault-held" && protectedSoulmateHeldItem.canSale === false, "soulmate held item copy should be marked as run-local and unsellable");
const soulmateTrainingBlocked = api.applyFormalTrainingGroundLesson(soulmateVaultRestRun, {pokemonId: protectedSoulmatePokemon.localPokemonId, lessonKind: "self-study"});
assert(!soulmateTrainingBlocked.ok && soulmateTrainingBlocked.run.money === soulmateVaultRestRun.money, "formal training should reject soulmate vault pokemon without changing money");
const soulmateFriendshipBattleLogRun = {
  ...soulmateVaultRestRun,
  roundPlan: soulmateVaultRestRun.roundPlan.map((round, index) => index === 0 ? {
    ...round,
    npcs: round.npcs.map((npc, npcIndex) => npcIndex === 0 ? {...npc, trainerId: "gym:关都地区:小刚:1", trainerType: "gym" as const, name: "小刚"} : npc),
  } : round),
  restRunSnapshot: {
    ...soulmateVaultRestRun.restRunSnapshot!,
    gameMap: soulmateVaultRestRun.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
    battleLog: [
      {
        id: "formal-smoke:soulmate-damage",
        key: "formal-smoke:soulmate-damage",
        at: new Date(0).toISOString(),
        sessionId: "formal-smoke-soulmate-session",
        nodeId: soulmateVaultRestRun.roundPlan[0]!.id,
        turn: 1,
        rawLogIndex: 1,
        eventType: "damage" as const,
        damage: 40,
        sourcePlayerId: "p1" as const,
        sourcePokemonKey: `p1a: ${protectedSoulmatePokemon.nickname}`,
        sourcePokemonName: protectedSoulmatePokemon.nickname,
        targetPlayerId: "p2" as const,
        targetPokemonKey: "p2a: target",
        targetPokemonName: "target",
        directness: "direct" as const,
        rawLine: `|-damage|p2a: target|60/100|[from] move: Surf|[of] p1a: ${protectedSoulmatePokemon.nickname}`,
      },
      {
        id: "formal-smoke:soulmate-faint",
        key: "formal-smoke:soulmate-faint",
        at: new Date(0).toISOString(),
        sessionId: "formal-smoke-soulmate-session",
        nodeId: soulmateVaultRestRun.roundPlan[0]!.id,
        turn: 2,
        rawLogIndex: 2,
        eventType: "faint" as const,
        targetPlayerId: "p1" as const,
        targetPokemonKey: `p1a: ${protectedSoulmatePokemon.nickname}`,
        targetPokemonName: protectedSoulmatePokemon.nickname,
        rawLine: `|faint|p1a: ${protectedSoulmatePokemon.nickname}`,
      },
    ],
  },
};
const soulmateFriendshipSettlement = api.applyFormalSoulmateBattleFriendshipSettlement(soulmateFriendshipBattleLogRun, soulmateVault);
const settledLocalSoulmate = soulmateFriendshipSettlement.run.restRunSnapshot!.players.p1!.localTeam.pokemon.find(pokemon => pokemon.sourcePlayerPokemonId === "vault-starmie-1");
const unsettledVaultSoulmate = soulmateFriendshipSettlement.playerVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1");
assert(settledLocalSoulmate?.friendship === 222, "soulmate battle settlement should add win participation and faint penalty to the local run pokemon");
assert(unsettledVaultSoulmate?.friendship === 210, "soulmate battle settlement should not write friendship back to vault before final sync");
assert(soulmateFriendshipSettlement.summary?.deltas[0]?.delta === 12, "soulmate battle settlement should report net delta");
const soulmateFriendshipSettlementAgain = api.applyFormalSoulmateBattleFriendshipSettlement(soulmateFriendshipSettlement.run, soulmateFriendshipSettlement.playerVault);
assert(soulmateFriendshipSettlementAgain.alreadySettled, "soulmate battle settlement should be idempotent per node");
assert(soulmateFriendshipSettlementAgain.run.restRunSnapshot!.players.p1!.localTeam.pokemon.find(pokemon => pokemon.sourcePlayerPokemonId === "vault-starmie-1")?.friendship === 222, "soulmate battle settlement should not apply twice to local run pokemon");
assert(soulmateFriendshipSettlementAgain.playerVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1")?.friendship === 210, "soulmate battle settlement should still leave vault unchanged when already settled");
const syncedSoulmateVault = api.syncFormalSoulmateLocalTeamToVault(soulmateFriendshipSettlement.run, soulmateFriendshipSettlement.playerVault);
assert(syncedSoulmateVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1")?.friendship === 222, "final soulmate vault sync should persist local friendship");
assert(syncedSoulmateVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1")?.heldItemId === "leftovers", "final soulmate vault sync should persist only the soulmate held item");
assert(syncedSoulmateVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-pikachu-1")?.friendship === 210, "final soulmate vault sync should not touch unrelated vault pokemon friendship");
assert(syncedSoulmateVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-pikachu-1")?.heldItemId === "lifeorb", "final soulmate vault sync should not touch unrelated vault pokemon held item");
const lowLocalFriendshipRun = {
  ...soulmateFriendshipSettlement.run,
  restRunSnapshot: {
    ...soulmateFriendshipSettlement.run.restRunSnapshot!,
    players: {
      ...soulmateFriendshipSettlement.run.restRunSnapshot!.players,
      p1: {
        ...soulmateFriendshipSettlement.run.restRunSnapshot!.players.p1!,
        localTeam: {
          ...soulmateFriendshipSettlement.run.restRunSnapshot!.players.p1!.localTeam,
          pokemon: soulmateFriendshipSettlement.run.restRunSnapshot!.players.p1!.localTeam.pokemon.map(pokemon => (
            pokemon.sourcePlayerPokemonId === "vault-starmie-1" ? {...pokemon, friendship: 0} : pokemon
          )),
        },
      },
    },
  },
};
const guardedSoulmateVault = api.syncFormalSoulmateLocalTeamToVault(lowLocalFriendshipRun, soulmateVault);
assert(guardedSoulmateVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1")?.friendship === 210, "final soulmate vault sync should not clear vault friendship with a lower local value");
const soulmateHonorSettlement = api.applyFormalSoulmateHonorSettlement(soulmateFriendshipBattleLogRun, soulmateVault);
const honoredSoulmate = soulmateHonorSettlement.playerVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1");
const unhonoredPokemon = soulmateHonorSettlement.playerVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-pikachu-1");
assert(honoredSoulmate?.honors.includes("soulmate-honor-target:kanto:gym:关都地区:小刚:1"), "soulmate honor settlement should award defeated target to current vault-sourced pokemon");
assert(!unhonoredPokemon?.honors.includes("soulmate-honor-target:kanto:gym:关都地区:小刚:1"), "soulmate honor settlement should not award pokemon outside the current battle team");
const soulmateHonorSettlementAgain = api.applyFormalSoulmateHonorSettlement(soulmateHonorSettlement.run, soulmateHonorSettlement.playerVault);
assert(soulmateHonorSettlementAgain.alreadySettled, "soulmate honor settlement should be idempotent per node");
assert(soulmateHonorSettlementAgain.playerVault.pokemon.find(pokemon => pokemon.playerPokemonId === "vault-starmie-1")?.honors.filter(honor => honor === "soulmate-honor-target:kanto:gym:关都地区:小刚:1").length === 1, "soulmate honor settlement should not duplicate target marker");
const selectableLessons = api.getFormalTrainingGroundLessons(roundPlanned);
assert(selectableLessons.length === 4, "formal training ground should expose all selectable lessons");
assert(new Set(selectableLessons.map(lesson => lesson.kind)).size === 4, "formal training ground selectable lessons should cover every lesson kind");
const nextTrainingRun = api.advanceFormalTrainingGroundLesson(roundPlanned);
const nextTrainingLesson = api.getFormalTrainingGroundLesson(nextTrainingRun);
assert((nextTrainingRun.trainingGroundByNodeId?.[roundPlanned.restRunSnapshot!.currentNodeId]?.lessonRoll || 0) === 1, "formal training ground advance should increment lessonRoll");
assert(nextTrainingLesson && nextTrainingLesson.lessonId !== trainingLesson?.lessonId, "formal training ground advance should draw next lesson");
assert(!nextTrainingLesson || nextTrainingLesson.fee === expectedTrainingGroundLessonFee(nextTrainingLesson.kind), "formal training ground next lesson should use balanced fee table");
const compulsoryProfile = unlockStarChartNodeForProfileV4({...profile, battlePoints: 100}, COMPULSORY_EDUCATION_NODE_ID);
const compulsoryRun = {...(await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(compulsoryProfile, {mode: "singles", seed: "formal-smoke-compulsory-education-seed"})), [0, 1, 2]))), money: 500};
const compulsoryLesson = api.getFormalTrainingGroundLesson(compulsoryRun);
assert(compulsoryLesson?.fee === 100, "compulsory education should halve group-stage lesson display fee");
const compulsorySelfStudyPokemon = compulsoryRun.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const compulsorySelfStudyResult = api.applyFormalTrainingGroundLesson(compulsoryRun, {pokemonId: compulsorySelfStudyPokemon.localPokemonId, lessonKind: "self-study"});
assert(compulsorySelfStudyResult.ok && compulsorySelfStudyResult.run.money === 400, "compulsory education should halve actual lesson cost");
const compulsoryRoundThreeRun = {
  ...compulsoryRun,
  currentRoundIndex: 2,
  restRunSnapshot: {
    ...compulsoryRun.restRunSnapshot!,
    currentNodeId: compulsoryRun.restRunSnapshot!.gameMap[2]!.id,
  },
};
assert(api.getFormalTrainingGroundLesson(compulsoryRoundThreeRun)?.fee === 200, "compulsory education should not discount lessons after group stage");
let lessonDeckRun = roundPlanned;
const firstCycleKinds: string[] = [];
const firstEightKinds: string[] = [];
for (let index = 0; index < 8; index += 1) {
  const lesson = api.getFormalTrainingGroundLesson(lessonDeckRun);
  assert(lesson, "formal training ground shuffle deck should draw a lesson");
  firstEightKinds.push(lesson.kind);
  if (index < 4) firstCycleKinds.push(lesson.kind);
  lessonDeckRun = api.advanceFormalTrainingGroundLesson(lessonDeckRun);
}
assert(new Set(firstCycleKinds).size === 4, "formal training ground shuffle deck should cover every lesson kind once per cycle");
for (let index = 1; index < firstEightKinds.length; index += 1) {
  assert(firstEightKinds[index] !== firstEightKinds[index - 1], "formal training ground shuffle deck should avoid adjacent repeated lessons");
}
const poorTrainingRun = {...roundPlanned, money: 0};
const poorTrainingResult = api.applyFormalTrainingGroundLesson(poorTrainingRun, {pokemonId: roundPlanned.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!.localPokemonId, lessonKind: "self-study"});
assert(!poorTrainingResult.ok && poorTrainingResult.run.money === 0, "formal training ground should reject insufficient funds without changing money");
let moveLessonRun = economyReadyRun;
let moveLesson = api.getFormalTrainingGroundLessons(moveLessonRun).find(lesson => ["tutor", "egg"].includes(lesson.kind));
assert(moveLesson && ["tutor", "egg"].includes(moveLesson.kind), "formal training ground should be able to draw a tutor or egg move lesson");
assert(moveLesson.fee === 200, "formal tutor and egg lessons should cost 200");
const moveLessonPokemon = moveLessonRun.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const moveLessonCandidates = moveLesson.kind === "tutor"
  ? ["thunderbolt", "protect", "raindance"]
  : moveLesson.kind === "egg"
    ? ["toxic", "willowisp", "substitute"]
    : ["flamethrower", "trickroom", "watergun", "tackle"];
let moveLessonMove = moveLessonCandidates[0]!;
let moveTrainingResult = api.applyFormalTrainingGroundLesson(moveLessonRun, {pokemonId: moveLessonPokemon.localPokemonId, moveId: moveLessonMove, replaceMoveIndex: 0, lessonId: moveLesson.lessonId});
for (const candidateMove of moveLessonCandidates.slice(1)) {
  if (moveTrainingResult.ok) break;
  moveLessonMove = candidateMove;
  moveTrainingResult = api.applyFormalTrainingGroundLesson(moveLessonRun, {pokemonId: moveLessonPokemon.localPokemonId, moveId: moveLessonMove, replaceMoveIndex: 0, lessonId: moveLesson.lessonId});
}
assert(moveTrainingResult.ok, `formal training ground move lesson should apply a valid source move: ${moveLesson.kind}/${moveLessonMove}/${moveTrainingResult.message}`);
assert(moveTrainingResult.run.money === moveLessonRun.money - moveLesson.fee, "formal training ground move lesson should deduct fee");
assert(moveTrainingResult.run.restRunSnapshot?.players.p1?.localTeam.pokemon[0]?.moves[0]?.moveId === moveLessonMove, "formal training ground move lesson should replace selected move slot");
let selfStudyRun = economyReadyRun;
let selfStudyLesson = api.getFormalTrainingGroundLessons(selfStudyRun).find(lesson => lesson.kind === "self-study");
assert(selfStudyLesson?.kind === "self-study", "formal training ground should be able to draw a self-study lesson");
assert(selfStudyLesson.fee === 200, "formal self-study lesson should cost 200");
const selfStudyFocusedWeights = formalTrainingGroundSelfStudyEventWeightsV4({nature: "Serious"});
const selfStudyFocusedEastAsiaWeights = formalTrainingGroundSelfStudyEventWeightsV4({nature: "Serious"});
assert(selfStudyFocusedEastAsiaWeights.focused === selfStudyFocusedWeights.focused, "east asia education should no longer change self-study event weights");
const lowSelfStudyRule = formalTrainingGroundDynamicSelfStudyGainRuleV4("normal", {ivTotal: 90, evTotal: 120});
const highSelfStudyRule = formalTrainingGroundDynamicSelfStudyGainRuleV4("normal", {ivTotal: 170, evTotal: 470});
assert(lowSelfStudyRule.iv[0] === 11 && lowSelfStudyRule.iv[1] === 17, "low IV totals should get larger normal self-study catch-up gains");
assert(lowSelfStudyRule.ev[0] === 55 && lowSelfStudyRule.ev[1] === 78, "low EV totals should get larger normal self-study catch-up gains");
assert(highSelfStudyRule.iv.join(",") === "8,8", "high IV totals should use minimum normal self-study gains within remaining room");
assert(highSelfStudyRule.ev.join(",") === "28,28", "high EV totals should use minimum normal self-study gains within remaining room");
assert(formalTrainingGroundDynamicSelfStudyGainRuleV4("focused", {ivTotal: 180, evTotal: 509}).iv.join(",") === "1,1", "near-target IV self-study should clamp to remaining target room");
assert(formalTrainingGroundDynamicSelfStudyGainRuleV4("focused", {ivTotal: 180, evTotal: 509}).ev.join(",") === "1,1", "near-target EV self-study should clamp to remaining target room");
assert(formalTrainingGroundDynamicSelfStudyGainRuleV4("playful", {ivTotal: 181, evTotal: 510}).iv.join(",") === "0,0", "target IV total should stop self-study IV gain");
assert(formalTrainingGroundDynamicSelfStudyGainRuleV4("playful", {ivTotal: 181, evTotal: 510}).ev.join(",") === "0,0", "target EV total should stop self-study EV gain");
assert(formalTrainingGroundStableSelfStudyGainRuleV4(lowSelfStudyRule).iv.join(",") === "14,17", "stable self-study should start at the dynamic IV midpoint");
assert(formalTrainingGroundStableSelfStudyGainRuleV4(lowSelfStudyRule).ev.join(",") === "67,78", "stable self-study should start at the dynamic EV midpoint");
const sevenStudyTarget = simulateSelfStudyCatchUpTotals(100, 120, ["normal", "normal", "focused", "normal", "focused", "normal", "focused"], true);
assert(sevenStudyTarget.iv >= 176 && sevenStudyTarget.iv <= 181, "seven mixed self-study sessions should bring IV total close to the 181 target");
assert(sevenStudyTarget.ev === 510, "seven mixed self-study sessions should be able to reach the EV target");
const selfStudyPokemon = selfStudyRun.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const selfStudyBeforeIvTotal = statTotal(selfStudyPokemon.ivs);
const selfStudyBeforeEvTotal = statTotal(selfStudyPokemon.evs);
const selfStudyBeforePowerProfile = selfStudyPokemon.powerProfile || "normal";
const selfStudyResult = api.applyFormalTrainingGroundLesson(selfStudyRun, {pokemonId: selfStudyPokemon.localPokemonId, lessonKind: "self-study"});
const selfStudyAfter = selfStudyResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(selfStudyResult.ok, "formal training ground self-study should apply");
assert(selfStudyResult.run.money === selfStudyRun.money - selfStudyLesson.fee, "formal training ground self-study should deduct fee");
assert(selfStudyResult.selfStudyEvent === "playful" || selfStudyResult.selfStudyEvent === "normal" || selfStudyResult.selfStudyEvent === "focused", "formal training ground self-study should report known event");
assert(selfStudyAfter.level >= 1 && selfStudyAfter.level <= 100, "formal training ground self-study should keep level in bounds");
assert(Object.values(selfStudyAfter.ivs).every(value => inRange(value, 0, 31)), "formal training ground self-study should keep IVs in bounds");
assert(Object.values(selfStudyAfter.evs).every(value => inRange(value, 0, 252)), "formal training ground self-study should keep EVs in bounds");
assert(selfStudyAfter.ivTotalCap === selfStudyPokemon.ivTotalCap, "formal training ground self-study should leave stored IV cap metadata unchanged");
assert(selfStudyAfter.evTotalCap === selfStudyPokemon.evTotalCap, "formal training ground self-study should leave stored EV cap metadata unchanged");
const selfStudyGainRule = formalTrainingGroundDynamicSelfStudyGainRuleV4(selfStudyResult.selfStudyEvent, {
  ivTotal: selfStudyBeforeIvTotal,
  evTotal: selfStudyBeforeEvTotal,
});
const selfStudyIvDelta = statTotal(selfStudyAfter.ivs) - selfStudyBeforeIvTotal;
const selfStudyEvDelta = statTotal(selfStudyAfter.evs) - selfStudyBeforeEvTotal;
assert(selfStudyIvDelta >= selfStudyGainRule.iv[0] && selfStudyIvDelta <= selfStudyGainRule.iv[1], "formal training ground self-study IV delta should stay in event range");
assert(selfStudyEvDelta >= selfStudyGainRule.ev[0] && selfStudyEvDelta <= selfStudyGainRule.ev[1], "formal training ground self-study EV delta should stay in event range");
assert(selfStudyAfter.level === selfStudyPokemon.level, "formal training ground self-study should not change level");
assert(statTotal(selfStudyAfter.ivs) <= 181, "formal training ground self-study IV total should stay within target rules");
assert(statTotal(selfStudyAfter.evs) <= 510, "formal training ground self-study EV total should stay within rules");
assert((selfStudyAfter.powerProfile || "normal") === selfStudyBeforePowerProfile, "formal training ground self-study should keep power profile unchanged");
const selfStudyNodeId = selfStudyRun.restRunSnapshot!.currentNodeId!;
assert((selfStudyResult.run.trainingGroundByNodeId?.[selfStudyNodeId]?.selfStudyRoll || 0) === 1, "formal training ground self-study should advance self-study roll after first study");
const secondSelfStudyResult = api.applyFormalTrainingGroundLesson(selfStudyResult.run, {pokemonId: selfStudyPokemon.localPokemonId, lessonKind: "self-study"});
assert(secondSelfStudyResult.ok, "formal training ground should allow a second self-study on the same pokemon");
assert((secondSelfStudyResult.run.trainingGroundByNodeId?.[selfStudyNodeId]?.selfStudyRoll || 0) === 2, "formal training ground self-study should use a fresh roll for every study");
assert(secondSelfStudyResult.run.money === selfStudyResult.run.money - selfStudyLesson.fee, "formal training ground second self-study should deduct fee");
const eastAsiaProfile = unlockStarChartNodeForProfileV4(compulsoryProfile, "rest_east_asia_education");
const eastAsiaSelfStudyRun = {...(await api.prepareFormalRoundPlan(api.selectFormalStarterPokemon(api.prepareFormalStarterCandidates(api.createFormalGameRun(eastAsiaProfile, {mode: "singles", seed: "formal-smoke-east-asia-self-study-seed"})), [0, 1, 2]))), money: 500};
const eastAsiaSelfStudyPokemon = eastAsiaSelfStudyRun.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const eastAsiaSelfStudyBeforeIvTotal = statTotal(eastAsiaSelfStudyPokemon.ivs);
const eastAsiaSelfStudyBeforeEvTotal = statTotal(eastAsiaSelfStudyPokemon.evs);
const eastAsiaSelfStudyResult = api.applyFormalTrainingGroundLesson(eastAsiaSelfStudyRun, {pokemonId: eastAsiaSelfStudyPokemon.localPokemonId, lessonKind: "self-study"});
assert(eastAsiaSelfStudyResult.ok, "east asia education self-study should apply");
assert(eastAsiaSelfStudyResult.selfStudyChange?.natureBefore === eastAsiaSelfStudyPokemon.nature, "east asia education self-study should record nature before");
assert(eastAsiaSelfStudyResult.selfStudyChange?.natureAfter, "east asia education self-study should record nature after");
if (eastAsiaSelfStudyResult.selfStudyChange?.natureAfter !== eastAsiaSelfStudyResult.selfStudyChange?.natureBefore) {
  assert(["Lonely", "Timid", "Modest", "Mild", "Gentle"].includes(eastAsiaSelfStudyResult.selfStudyChange!.natureAfter!), "east asia education nature risk should pick a configured nature");
}
const eastAsiaSelfStudyAfter = eastAsiaSelfStudyResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(eastAsiaSelfStudyResult.selfStudyEvent, "east asia education self-study should report an event");
const eastAsiaGainRule = formalTrainingGroundStableSelfStudyGainRuleV4(formalTrainingGroundDynamicSelfStudyGainRuleV4(eastAsiaSelfStudyResult.selfStudyEvent, {
  ivTotal: eastAsiaSelfStudyBeforeIvTotal,
  evTotal: eastAsiaSelfStudyBeforeEvTotal,
}));
const eastAsiaIvRoom = Math.max(0, 181 - eastAsiaSelfStudyBeforeIvTotal);
const eastAsiaEvRoom = Math.max(0, 510 - eastAsiaSelfStudyBeforeEvTotal);
assert(statTotal(eastAsiaSelfStudyAfter.ivs) - eastAsiaSelfStudyBeforeIvTotal >= Math.min(eastAsiaGainRule.iv[0], eastAsiaIvRoom), "east asia education should use stable IV gain minimum within global room");
assert(statTotal(eastAsiaSelfStudyAfter.evs) - eastAsiaSelfStudyBeforeEvTotal >= Math.min(eastAsiaGainRule.ev[0], eastAsiaEvRoom), "east asia education should use stable EV gain minimum within global room");

const withCoinLog = api.appendCoinLogEntryV4(economyReadyRun, {amount: -10, source: "preview-unlock", label: "解锁预览", key: "coin:preview:1"});
assert(withCoinLog.money === economyReadyRun.money - 10, "coin log should update formal money");
assert(withCoinLog.restRunSnapshot?.coinLog?.length === 1, "coin log should append one entry");
assert(withCoinLog.restRunSnapshot.coinLog[0]?.balanceBefore === economyReadyRun.money, "coin log should record balance before");
assert(withCoinLog.restRunSnapshot.coinLog[0]?.balanceAfter === withCoinLog.money, "coin log should record balance after");
const withDuplicateCoinLog = api.appendCoinLogEntryV4(withCoinLog, {amount: -10, source: "preview-unlock", label: "解锁预览", key: "coin:preview:1"});
assert(withDuplicateCoinLog.restRunSnapshot?.coinLog?.length === 1, "coin log should dedupe by key");

const noExchangeView = api.getFormalRestExchangeView(roundPlanned);
assert(!noExchangeView.available && noExchangeView.exchangeCount === 0, "formal exchange should be unavailable before any won round");
assert(noExchangeView.opponent === null, "formal exchange should not show current opponent before a won round");
const exchangeRestRun = {
  ...withCoinLog.restRunSnapshot!,
  currentNodeId: withCoinLog.restRunSnapshot!.gameMap[1]!.id,
  gameMap: withCoinLog.restRunSnapshot!.gameMap.map((node, index) => index === 0
    ? {...node, state: "won" as const}
    : index === 1
      ? {...node, state: "ready" as const}
      : node),
};
const exchangeBaseRun = {...withCoinLog, restRunSnapshot: exchangeRestRun};
const exchangeView = api.getFormalRestExchangeView(exchangeBaseRun);
assert(exchangeView.available && exchangeView.nodeId === exchangeRestRun.gameMap[0]!.id, "formal exchange should target latest won round");
const soulmateExchangeRestRun = {
  ...soulmateVaultRestRun.restRunSnapshot!,
  currentNodeId: soulmateVaultRestRun.restRunSnapshot!.gameMap[1]!.id,
  gameMap: soulmateVaultRestRun.restRunSnapshot!.gameMap.map((node, index) => index === 0
    ? {...node, state: "won" as const}
    : index === 1
      ? {...node, state: "ready" as const}
      : node),
};
const soulmateExchangeRun = {...soulmateVaultRestRun, restRunSnapshot: soulmateExchangeRestRun};
const soulmateExchangeView = api.getFormalRestExchangeView(soulmateExchangeRun);
assert(!soulmateExchangeView.player?.localTeam.pokemon.some(pokemon => pokemon.localPokemonId === protectedSoulmatePokemon.localPokemonId), "formal exchange view should hide soulmate vault pokemon");
const soulmateExchangeTarget = soulmateExchangeView.opponent!.localTeam.pokemon[0]!;
const soulmateExchangeBlocked = api.exchangeFormalRestPokemon(soulmateExchangeRun, {sourcePokemonId: protectedSoulmatePokemon.localPokemonId, targetPokemonId: soulmateExchangeTarget.localPokemonId});
assert(!soulmateExchangeBlocked.ok && soulmateExchangeBlocked.run.restRunSnapshot!.players.p1!.localTeam.pokemon.some(pokemon => pokemon.localPokemonId === protectedSoulmatePokemon.localPokemonId), "formal exchange should reject protected soulmate pokemon without changing team");
const exchangeSource = exchangeView.player!.localTeam.pokemon[0]!;
const exchangeTarget = exchangeView.opponent!.localTeam.pokemon[0]!;
const exchangeResult = api.exchangeFormalRestPokemon(exchangeBaseRun, {sourcePokemonId: exchangeSource.localPokemonId, targetPokemonId: exchangeTarget.localPokemonId});
const exchangedPokemon = exchangeResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(exchangeResult.ok, "formal exchange should replace selected pokemon");
assert(exchangeResult.cost === 0 && exchangeResult.run.money === exchangeBaseRun.money, "formal first exchange should be free");
assert(exchangedPokemon.speciesId === exchangeTarget.speciesId, "formal exchange should receive target species");
assert(exchangedPokemon.localPokemonId !== exchangeTarget.localPokemonId, "formal exchange should create a new local pokemon id");
assert(exchangedPokemon.entryHp === Math.ceil(exchangedPokemon.maxHp / 2), "formal exchange should default to half HP");
assert(exchangedPokemon.entryStatus === "", "formal exchange should clear status");
assert(!exchangedPokemon.itemId && !exchangedPokemon.heldItemInstanceId, "formal exchange should drop item without star chart");
const secondExchangeBlocked = api.exchangeFormalRestPokemon(exchangeResult.run, {
  sourcePokemonId: exchangeResult.run.restRunSnapshot!.players.p1!.localTeam.pokemon[1]!.localPokemonId,
  targetPokemonId: exchangeView.opponent!.localTeam.pokemon[1]!.localPokemonId,
});
assert(!secondExchangeBlocked.ok && secondExchangeBlocked.run.money === exchangeResult.run.money, "formal second exchange should require star chart");
const exchangeStarProfile = unlockStarChartNodeForProfileV4(
  unlockStarChartNodeForProfileV4(
    unlockStarChartNodeForProfileV4(
      unlockStarChartNodeForProfileV4({...profile, battlePoints: 300}, LOSSLESS_EXCHANGE_NODE_ID),
      ELITE_EXCHANGE_EDUCATION_NODE_ID,
    ),
    EXCHANGE_ITEM_STEAL_NODE_ID,
  ),
  SECOND_EXCHANGE_NODE_ID,
);
const exchangeStarRun = {...exchangeBaseRun, starChartSnapshot: exchangeStarProfile.starChart};
const exchangeStarView = api.getFormalRestExchangeView(exchangeStarRun);
const exchangeStarTarget = {...exchangeStarView.opponent!.localTeam.pokemon[0]!, itemId: "leftovers", heldItemInstanceId: "npc-leftovers"};
const exchangeStarRestRun = {
  ...exchangeStarRun.restRunSnapshot!,
  gameMap: exchangeStarRun.restRunSnapshot!.gameMap.map((node, index) => index === 0
    ? {...node, participants: {...node.participants, p2: {...node.participants.p2!, localTeam: {...node.participants.p2!.localTeam, pokemon: node.participants.p2!.localTeam.pokemon.map((pokemon, pokemonIndex) => pokemonIndex === 0 ? exchangeStarTarget : pokemon)}}}}
    : node),
};
const exchangeStarPrepared = {...exchangeStarRun, restRunSnapshot: exchangeStarRestRun};
const exchangeStarFirst = api.exchangeFormalRestPokemon(exchangeStarPrepared, {sourcePokemonId: exchangeStarView.player!.localTeam.pokemon[0]!.localPokemonId, targetPokemonId: exchangeStarTarget.localPokemonId});
const exchangeStarPokemon = exchangeStarFirst.run.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(exchangeStarFirst.ok, "formal exchange star first exchange should apply");
assert(exchangeStarPokemon.entryHp === exchangeStarPokemon.maxHp, "lossless exchange should receive full HP");
assert(exchangeStarPokemon.itemId === "leftovers" && exchangeStarPokemon.heldItemInstanceId === "npc-leftovers", "exchange item steal should keep target item");
assert(powerProfileIndex(exchangeStarPokemon.powerProfile || "rookie") >= powerProfileIndex(exchangeStarTarget.powerProfile || "rookie"), "elite exchange education should not lower power profile");
const exchangeStarSecond = api.exchangeFormalRestPokemon(exchangeStarFirst.run, {
  sourcePokemonId: exchangeStarFirst.run.restRunSnapshot!.players.p1!.localTeam.pokemon[1]!.localPokemonId,
  targetPokemonId: exchangeStarView.opponent!.localTeam.pokemon[1]!.localPokemonId,
});
assert(exchangeStarSecond.ok && exchangeStarSecond.cost === 200 && exchangeStarSecond.run.money === exchangeStarFirst.run.money - 200, "second exchange star should allow paid second exchange");
assert(exchangeStarSecond.run.restRunSnapshot?.coinLog?.some(entry => entry.source === "pokemon-exchange" && entry.amount === -200), "paid exchange should append coin log");
const poorSecondExchange = api.exchangeFormalRestPokemon({...exchangeStarFirst.run, money: 199}, {
  sourcePokemonId: exchangeStarFirst.run.restRunSnapshot!.players.p1!.localTeam.pokemon[1]!.localPokemonId,
  targetPokemonId: exchangeStarView.opponent!.localTeam.pokemon[1]!.localPokemonId,
});
assert(!poorSecondExchange.ok && poorSecondExchange.run.money === 199, "paid second exchange should reject insufficient funds");

const firstPlayerPokemon = withCoinLog.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
const firstEnemyPokemon = {...withCoinLog.roundPlan[0]!.participants.p2!.localTeam.pokemon[0]!, maxHp: 200};
const firstPlayerMapping = {
  localPokemonId: firstPlayerPokemon.localPokemonId,
  teamIndex: 0,
  choiceIndex: 1,
  showdownIdentityToken: firstPlayerPokemon.showdownIdentityToken || firstPlayerPokemon.showdownId || firstPlayerPokemon.pokeballId || firstPlayerPokemon.localPokemonId,
  showdownId: firstPlayerPokemon.showdownId || firstPlayerPokemon.showdownIdentityToken || firstPlayerPokemon.localPokemonId,
  pokeballId: firstPlayerPokemon.pokeballId || firstPlayerPokemon.showdownIdentityToken || firstPlayerPokemon.localPokemonId,
  speciesId: firstPlayerPokemon.speciesId,
  displayName: firstPlayerPokemon.name,
};
const battlePlayers = [
  {
    playerId: "p1",
    name: "P1",
    controller: "local",
    alliance: "near",
    team: [],
    draft: withCoinLog.restRunSnapshot!.players.p1!,
    teamMapping: [firstPlayerMapping],
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
const soulmateCandidateSmoke = createSoulmateCandidateListV4({
  battleLog: [
    {
      id: "soulmate-log-p1-source",
      key: "soulmate-log-p1-source",
      at: new Date(0).toISOString(),
      sessionId: "soulmate-session",
      nodeId: withCoinLog.roundPlan[0]!.id,
      turn: 1,
      rawLogIndex: 1,
      eventType: "move",
      sourcePlayerId: "p1",
      sourcePokemonKey: `p1a:${firstPlayerPokemon.name}`,
      sourcePokemonName: firstPlayerPokemon.name,
      rawLine: "",
    },
    {
      id: "soulmate-log-p1-target",
      key: "soulmate-log-p1-target",
      at: new Date(0).toISOString(),
      sessionId: "soulmate-session",
      nodeId: withCoinLog.roundPlan[0]!.id,
      turn: 1,
      rawLogIndex: 2,
      eventType: "damage",
      damage: 10,
      sourcePlayerId: "p2",
      sourcePokemonKey: `p2a:${firstEnemyPokemon.name}`,
      sourcePokemonName: firstEnemyPokemon.name,
      targetPlayerId: "p1",
      targetPokemonKey: `p1a:${firstPlayerPokemon.name}`,
      targetPokemonName: firstPlayerPokemon.name,
      directness: "direct",
      rawLine: "",
    },
    {
      id: "soulmate-log-p1-alias",
      key: "soulmate-log-p1-alias",
      at: new Date(0).toISOString(),
      sessionId: "soulmate-session",
      nodeId: withCoinLog.roundPlan[0]!.id,
      turn: 2,
      rawLogIndex: 4,
      eventType: "move",
      sourcePlayerId: "p1",
      sourcePokemonKey: `p1b:${firstPlayerPokemon.speciesId}`,
      sourcePokemonName: firstPlayerPokemon.speciesId,
      rawLine: "",
    },
    {
      id: "soulmate-log-p2-only",
      key: "soulmate-log-p2-only",
      at: new Date(0).toISOString(),
      sessionId: "soulmate-session",
      nodeId: withCoinLog.roundPlan[0]!.id,
      turn: 1,
      rawLogIndex: 3,
      eventType: "move",
      sourcePlayerId: "p2",
      sourcePokemonKey: `p2a:${firstEnemyPokemon.name}`,
      sourcePokemonName: firstEnemyPokemon.name,
      rawLine: "",
    },
  ],
  team: withCoinLog.restRunSnapshot!.players.p1!.localTeam,
  resolvePokemonKey: summary => {
    const raw = String(summary.pokemonKey || "").toLowerCase().replace(/^p[1-4][a-d]?:/, "");
    return raw === firstPlayerPokemon.name.toLowerCase() ? firstPlayerPokemon.localPokemonId : null;
  },
});
assert(soulmateCandidateSmoke.length === 1, "soulmate candidates should include only p1 battleLog participants");
assert(soulmateCandidateSmoke[0]!.localPokemonId === firstPlayerPokemon.localPokemonId, "soulmate candidate should map battleLog participant to local pokemon");
assert(soulmateCandidateSmoke[0]!.usedRounds.join(",") === "0", "soulmate candidate aliases should merge into one local pokemon record");
assert(normalizeSoulmateEvolutionRequirementV4({evoLevel: 16} as never).itemId === "universal-evolution-stone", "level evolution should require universal evolution stone");
assert(normalizeSoulmateEvolutionRequirementV4({evoType: "levelFriendship"}).itemId === "universal-evolution-stone", "friendship evolution should require universal evolution stone");
assert(normalizeSoulmateEvolutionRequirementV4({evoType: "useItem", evoItem: "Fire Stone"}).itemId === "firestone", "item evolution should require exact evo item");
assert(normalizeSoulmateEvolutionRequirementV4({evoType: "trade"}).itemId === "linking-cord", "trade evolution should require linking cord");
const withRunningTeamState = api.appendBattleLogEntriesFromSnapshotV4(withCoinLog, {
  ...battleSnapshotBase,
  status: "running",
  winner: null,
  rawLog: [],
  teamStateByPlayer: {
    p1: {
      updatedAt: new Date().toISOString(),
      pokemonByToken: {
        [firstPlayerMapping.showdownIdentityToken]: {
          localPokemonId: firstPlayerMapping.localPokemonId,
          showdownIdentityToken: firstPlayerMapping.showdownIdentityToken,
          showdownId: firstPlayerMapping.showdownId,
          pokeballId: firstPlayerMapping.pokeballId,
          pokeball: firstPlayerMapping.showdownIdentityToken,
          hp: 33,
          maxHp: firstPlayerPokemon.maxHp,
          status: "brn",
          fainted: false,
          moves: [{moveId: firstPlayerPokemon.moves[0]!.moveId, remainingPp: 4, maxPp: firstPlayerPokemon.moves[0]!.maxPp}],
        },
      },
    },
  },
} as never);
const runningTeamStatePokemon = withRunningTeamState.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!;
assert(runningTeamStatePokemon.entryHp === 33 && runningTeamStatePokemon.entryStatus === "brn", "formal append snapshot should persist running localTeam HP/status sync");
assert(runningTeamStatePokemon.moves[0]?.remainingPp === 4, "formal append snapshot should persist running localTeam PP sync");
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
const loggedMove = (withBattleLog.restRunSnapshot?.battleLog || []).find(entry => entry.eventType === "move" && entry.moveId === "tackle");
assert(Boolean(loggedMove?.moveType) && Boolean(loggedMove?.moveCategory) && loggedMove?.moveEffectKind === "damage", "battle log move entries should include move metadata");
const loggedMoveDamage = (withBattleLog.restRunSnapshot?.battleLog || []).find(entry => entry.eventType === "damage" && entry.moveId === "tackle");
assert(Boolean(loggedMoveDamage?.moveType) && Boolean(loggedMoveDamage?.moveCategory) && loggedMoveDamage?.moveEffectKind === "damage", "battle log damage entries should inherit move metadata");
const loggedMoveFaint = (withBattleLog.restRunSnapshot?.battleLog || []).find(entry => entry.eventType === "faint" && entry.moveId === "tackle");
assert(Boolean(loggedMoveFaint?.moveType) && Boolean(loggedMoveFaint?.moveCategory) && loggedMoveFaint?.moveEffectKind === "damage", "battle log faint entries should inherit move metadata");
const exactHpBattleSnapshot = {
  ...battleSnapshotBase,
  id: "formal-smoke-exact-hp-session",
  rawLog: [
    "|switch|p2a: Raichu|Raichu, L50, M|240/240",
    `|move|p1a: ${firstPlayerPokemon.nameZh}|Leaf Blade|p2a: Raichu`,
    "|-damage|p2a: Raichu|152/240",
    `|move|p1a: ${firstPlayerPokemon.nameZh}|Leaf Blade|p2a: Raichu`,
    "|-damage|p2a: Raichu|68/240",
  ],
} as never;
const exactHpBattleLog = api.appendBattleLogEntriesFromSnapshotV4(withCoinLog, exactHpBattleSnapshot).restRunSnapshot?.battleLog || [];
const exactHpDamage = exactHpBattleLog.filter(entry => entry.eventType === "damage").reduce((sum, entry) => sum + (entry.damage || 0), 0);
assert(exactHpDamage === 172, "battle log should trust exact protocol HP values such as 240 -> 152 -> 68");
const protocolAttributionSnapshot = {
  ...battleSnapshotBase,
  id: "formal-smoke-protocol-attribution-session",
  rawLog: [
    "|switch|p2a: Raichu|Raichu, L50, M|240/240",
    `|move|p1a: ${firstPlayerPokemon.nameZh}|Leaf Blade|p2a: Raichu`,
    `|-damage|p2a: Raichu|200/240|[from] move: Leaf Blade|[of] p1a: ${firstPlayerPokemon.nameZh}`,
    `|-damage|p2a: Raichu|170/240|[from] brn|[of] p1a: ${firstPlayerPokemon.nameZh}`,
    `|-damage|p2a: Raichu|0 fnt|[from] psn|[of] p1a: ${firstPlayerPokemon.nameZh}`,
    "|faint|p2a: Raichu",
  ],
} as never;
const protocolAttributionRun = api.appendBattleLogEntriesFromSnapshotV4(withCoinLog, protocolAttributionSnapshot);
const protocolAttributionEntries = protocolAttributionRun.restRunSnapshot?.battleLog || [];
const protocolDirectDamage = protocolAttributionEntries.find(entry => entry.eventType === "damage" && entry.rawLine.includes("[from] move: Leaf Blade"));
const protocolResidualDamageWithSource = protocolAttributionEntries.find(entry => entry.eventType === "damage" && entry.rawLine.includes("[from] brn"));
const protocolResidualFaint = protocolAttributionEntries.find(entry => entry.eventType === "faint");
assert(protocolDirectDamage?.damage === 40 && protocolDirectDamage.directness === "direct" && protocolDirectDamage.sourcePlayerId === "p1", "protocol move damage should use current move and [of] source as direct attribution");
assert(protocolResidualDamageWithSource?.damage === 30 && protocolResidualDamageWithSource.directness === "indirect" && protocolResidualDamageWithSource.sourcePlayerId === "p1", "protocol residual damage may retain [of] source but must stay indirect");
assert(protocolResidualFaint?.directness === "indirect" && !protocolResidualFaint.sourcePlayerId, "protocol residual faint should not inherit prior direct damage");
const protocolAttributionWonRun = {
  ...protocolAttributionRun.restRunSnapshot!,
  gameMap: protocolAttributionRun.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
};
const protocolAttributionSettlement = api.prepareFormalSettlement({...protocolAttributionRun, restRunSnapshot: protocolAttributionWonRun}, "loss");
const protocolAttributionP1Stat = protocolAttributionSettlement.settlement?.pokemonStats.find(stat => stat.localPokemonId === firstPlayerPokemon.localPokemonId);
assert(protocolAttributionP1Stat?.damageDealt === 40 && protocolAttributionP1Stat.kills === 0, "protocol settlement should count only direct move damage and no residual kill");
const timelineSessionId = "formal-smoke-timeline-session";
const timelineRawLog = [
  `|move|p1a: ${firstPlayerPokemon.nameZh}|Tackle|p2a: ${firstEnemyPokemon.nameZh}`,
  `|-damage|p2a: ${firstEnemyPokemon.nameZh}|80/100`,
  `|-damage|p2a: ${firstEnemyPokemon.nameZh}|70/100|[from] brn`,
  `|-heal|p2a: ${firstEnemyPokemon.nameZh}|90/100|[from] item: Oran Berry`,
  `|-damage|p2a: ${firstEnemyPokemon.nameZh}|0 fnt|[from] psn`,
  `|faint|p2a: ${firstEnemyPokemon.nameZh}`,
  "|win|P1",
];
const timelineSnapshot = {
  ...battleSnapshotBase,
  id: timelineSessionId,
  rawLog: timelineRawLog,
} as never;
const timeline = {
  sessionId: timelineSessionId,
  rawFrom: 0,
  rawTo: timelineRawLog.length,
  rawLogLength: timelineRawLog.length,
  groups: timelineRawLog.map((rawLine: string, rawIndex: number) => ({
    id: `timeline-group-${rawIndex}`,
    index: rawIndex,
    turn: 1,
    rawIndices: [rawIndex],
    rawLines: [rawLine],
    calls: [{
      id: `timeline-call-${rawIndex}`,
      kind: rawLine.startsWith("|move|")
        ? "move"
        : rawLine.startsWith("|-damage|")
          ? "damage"
          : rawLine.startsWith("|-heal|")
            ? "heal"
            : rawLine.startsWith("|faint|")
              ? "faint"
              : rawLine.startsWith("|win|")
                ? "message"
                : "scene",
      method: "smoke",
      rawStep: rawIndex,
      turn: 1,
      args: [],
      label: rawLine,
      rawLine,
      rawIndex,
    }],
    waitMode: "wait",
    summary: rawLine,
    finishStep: null,
  })),
  debug: {calls: [], compilerElapsedMs: 0, guard: 0, currentStep: null, atQueueEnd: true},
  compilerVersion: "formal-smoke",
} as const;
const withTimelineBattleLog = api.appendBattleLogEntriesFromSnapshotV4(withCoinLog, timelineSnapshot, {playbackTimeline: timeline as never});
const timelineEntries = withTimelineBattleLog.restRunSnapshot?.battleLog || [];
const timelineDirectDamage = timelineEntries.find(entry => entry.eventType === "damage" && entry.moveId === "tackle");
const timelineResidualDamage = timelineEntries.find(entry => entry.eventType === "damage" && entry.rawLine.includes("[from] brn"));
const timelineResidualFaint = timelineEntries.find(entry => entry.eventType === "faint");
const timelineHeal = timelineEntries.find(entry => entry.eventType === "heal");
assert(timelineDirectDamage?.damage === 40 && timelineDirectDamage.directness === "direct", "timeline direct damage should inherit move context");
assert(timelineResidualDamage?.damage === 20 && timelineResidualDamage.directness === "indirect" && !timelineResidualDamage.sourcePlayerId, "timeline residual damage should not inherit previous move context");
assert(timelineHeal?.healing === 40, "timeline heal should use ordered HP delta");
assert(timelineResidualFaint?.directness === "indirect" && !timelineResidualFaint.sourcePlayerId, "timeline residual faint should not credit previous move kill");
const timelineWonRestRun = {
  ...withTimelineBattleLog.restRunSnapshot!,
  gameMap: withTimelineBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
};
const timelineSettlementRun = api.prepareFormalSettlement({...withTimelineBattleLog, restRunSnapshot: timelineWonRestRun}, "loss");
const timelineP1Stat = timelineSettlementRun.settlement?.pokemonStats.find(stat => stat.localPokemonId === firstPlayerPokemon.localPokemonId);
assert(timelineP1Stat?.damageDealt === 40 && timelineP1Stat.kills === 0, "timeline settlement should only credit direct damage and no residual kill");
const withSettlementBattleLog = {
  ...withBattleLog,
  restRunSnapshot: {
    ...withBattleLog.restRunSnapshot!,
    battleLog: [
      ...(withBattleLog.restRunSnapshot?.battleLog || []),
      {
        id: "formal-smoke:historical-raichu-damage",
        key: "formal-smoke:historical-raichu-damage",
        at: new Date(0).toISOString(),
        sessionId: "formal-smoke-session",
        nodeId: withBattleLog.roundPlan[0]!.id,
        turn: 2,
        rawLogIndex: 999,
        eventType: "damage" as const,
        damage: 123,
        sourcePlayerId: "p1" as const,
        sourcePokemonKey: "p1a: Raichu",
        sourcePokemonName: "Raichu",
        targetPlayerId: "p2" as const,
        targetPokemonKey: "p2a: Test Target",
        targetPokemonName: "Test Target",
        directness: "direct" as const,
        rawLine: "|-damage|p2a: Test Target|1/100|[from] move: Thunderbolt|[of] p1a: Raichu",
      },
    ],
  },
};
const finalizedBattleResult = await api.finalizeFormalBattleResultV4(withPartialBattleLog, battleSnapshot);
assert(finalizedBattleResult.destination === "rest", "formal battle finalize should route won non-final rounds back to rest");
assert(finalizedBattleResult.run.money === withPartialBattleLog.money + 500, "formal battle finalize should apply round reward once");
assert(finalizedBattleResult.run.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id], "formal battle finalize should write round settlement");
assert((finalizedBattleResult.run.restRunSnapshot?.battleLog?.length || 0) >= 3, "formal battle finalize should append final battle log entries");
const finalizedBattleResultAgain = await api.finalizeFormalBattleResultV4(finalizedBattleResult.run, battleSnapshot);
assert(finalizedBattleResultAgain.destination === "rest", "formal battle finalize retry should keep won non-final rounds on rest route");
assert(finalizedBattleResultAgain.run.money === finalizedBattleResult.run.money, "formal battle finalize should not duplicate rewards on retry");
assert(Object.keys(finalizedBattleResultAgain.run.roundSettlementByNodeId || {}).length === Object.keys(finalizedBattleResult.run.roundSettlementByNodeId || {}).length, "formal battle finalize should not duplicate settlement records on retry");
assert(finalizedBattleResultAgain.run.restRunSnapshot?.battleLog?.length === finalizedBattleResult.run.restRunSnapshot?.battleLog?.length, "formal battle finalize should not duplicate battle logs on retry");
const singleBattleSnapshot = {
  ...battleSnapshotBase,
  id: "formal-smoke-single-final-session",
  runId: singlePlanned.restRunSnapshot!.id,
  nodeId: singlePlanned.roundPlan[0]!.id,
  rawLog: [
    `|move|p1a: ${firstPlayerPokemon.nameZh}|Tackle|p2a: ${firstEnemyPokemon.nameZh}`,
    `|-damage|p2a: ${firstEnemyPokemon.nameZh}|80/100`,
    `|-damage|p2a: ${firstEnemyPokemon.nameZh}|50/100`,
    `|faint|p2a: ${firstEnemyPokemon.nameZh}`,
    "|win|P1",
  ],
} as never;
const singleFinalizedBattleResult = await api.finalizeFormalBattleResultV4(singlePlanned, singleBattleSnapshot);
assert(singleFinalizedBattleResult.destination === "settlement", "final formal battle should route to settlement transition");
assert(singleFinalizedBattleResult.run.restRunSnapshot?.status === "battleEndedPendingSettlement", "final formal battle should mark rest snapshot as pending settlement");
assert(singleFinalizedBattleResult.run.roundSettlementByNodeId?.[singlePlanned.roundPlan[0]!.id], "final formal battle should write round settlement before pending settlement rest");
assert(singleFinalizedBattleResult.run.money === singlePlanned.money + 500, "final formal battle should apply round reward before pending settlement rest");
assert(singleFinalizedBattleResult.run.settled === false && !singleFinalizedBattleResult.run.settlement, "final formal battle should not create final settlement before player confirms");
const singlePendingSettlement = api.prepareFormalSettlement(singleFinalizedBattleResult.run, "complete");
assert(singlePendingSettlement.status === "ended" && singlePendingSettlement.settlement?.outcome === "win", "pending settlement rest should still enter final settlement");
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
const roundSettlementNoStar = await api.settleFormalBattleRoundV4({...withBattleLog, restRunSnapshot: faintedSettlementRestRun});
const noStarSettlement = roundSettlementNoStar.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id];
assert(noStarSettlement?.rewardCoins === 500, "round settlement should award 500 coins");
assert(noStarSettlement?.reviveCost === 50, "round settlement should charge 50 coins per fainted pokemon without free care");
assert(noStarSettlement?.netCoins === 450, "round settlement should record net coins after medical fee");
assert(roundSettlementNoStar.money === withBattleLog.money + 450, "round settlement should apply net coins to money");
assert(roundSettlementNoStar.restRunSnapshot!.players.p1!.localTeam.pokemon[0]!.entryHp === 1, "round settlement should revive fainted pokemon to 1 HP without emergency care");
assert(roundSettlementNoStar.currentRoundIndex === 1, "round settlement should advance to the next round index");
assert(roundSettlementNoStar.restRunSnapshot!.currentNodeId === roundSettlementNoStar.restRunSnapshot!.gameMap[1]!.id, "round settlement should move current rest node to next round");
assert(roundSettlementNoStar.roundPlan[1]!.participants.p2?.localTeam.pokemon.length === 3, "round settlement should generate the next opponent after a win");
assert(roundSettlementNoStar.restRunSnapshot!.gameMap[1]!.participants.p2?.localTeam.pokemon.length === 3, "round settlement should expose generated next opponent in rest snapshot");
assert(!roundSettlementNoStar.restRunSnapshot!.gameMap[1]!.participants.p2?.localTeam.pokemon.some(pokemon => pokemon.moves.some(move => !move.moveId)), "targeted generation should keep generated opponent moves valid");
assert(!roundSettlementNoStar.roundPlan.flatMap(round => round.diagnostics).some(message => message.includes("target")), "targeted generation should not expose targeting diagnostics");
const normalOpponent = roundSettlementNoStar.roundPlan[1]!.participants.p2!.localTeam.pokemon;
normalOpponent.forEach((pokemon, index) => assertPokemonPowerProfile(pokemon, `normal NPC ${index + 1}`, ["normal"]));
normalOpponent.forEach((pokemon, index) => assertRecommendedMoveCount(pokemon, 2, `normal NPC ${index + 1}`));
const roundSettlementNoStarAgain = await api.settleFormalBattleRoundV4(roundSettlementNoStar);
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
const roundSettlementMedical = await api.settleFormalBattleRoundV4({...withBattleLog, starChartSnapshot: starProfile.starChart, restRunSnapshot: medicalSettlementRestRun});
const medicalSettlement = roundSettlementMedical.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id];
assert(medicalSettlement?.reviveCost === 50, "medical insurance star alone should not waive revive cost without purchase");
assert(medicalSettlement?.emergencyHealedPokemonIds.length === 1, "emergency care should record half-hp revive targets");
assert(medicalSettlement?.outpatientHealedPokemonIds.length === 1, "outpatient care should record alive healing targets");
assert(medicalSettlement?.leveledPokemonIds.length === 0, "removed battle practice mastery should not level alive direct damage dealers");
assert(roundSettlementMedical.money === withBattleLog.money + 450, "medical route without insurance purchase should still charge revive cost");
const medicalAfterTeam = roundSettlementMedical.restRunSnapshot!.players.p1!.localTeam.pokemon;
assert(medicalAfterTeam[1]!.entryHp === 75, "emergency care should revive fainted pokemon to half HP");
assert(medicalAfterTeam[0]!.level === medicalBattlePokemon[0]!.level, "removed battle practice mastery should keep level unchanged");
assert(medicalAfterTeam[0]!.entryHp > 20, "outpatient care should still heal alive pokemon");
const premiumSettlementRun = await api.settleFormalBattleRoundV4({
  ...withBattleLog,
  starChartSnapshot: starProfile.starChart,
  medicalInsurance: {
    tier: "premium",
    cost: 1200,
    reviveCostPerPokemon: 0,
    recoveryShopPriceMultiplier: 0.5,
    purchasedAt: new Date(0).toISOString(),
  },
  restRunSnapshot: medicalSettlementRestRun,
});
const premiumSettlement = premiumSettlementRun.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id];
assert(premiumSettlement?.reviveCost === 0, "premium medical insurance should waive revive cost");
assert(premiumSettlementRun.money === withBattleLog.money + 500, "premium medical insurance settlement should keep full reward");
const lostSettlementRestRun = {
  ...withBattleLog.restRunSnapshot!,
  gameMap: withBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "lost" as const} : node),
};
const lostRoundSettlement = await api.settleFormalBattleRoundV4({...withBattleLog, restRunSnapshot: lostSettlementRestRun});
assert(!lostRoundSettlement.roundSettlementByNodeId?.[withBattleLog.roundPlan[0]!.id], "round settlement should not run for lost battles");
assert(lostRoundSettlement.money === withBattleLog.money, "lost battle should not grant round settlement coins");
const wonRestRun = {
  ...withSettlementBattleLog.restRunSnapshot!,
  gameMap: withSettlementBattleLog.restRunSnapshot!.gameMap.map((node, index) => index === 0 ? {...node, state: "won" as const} : node),
};
const settlementRun = api.prepareFormalSettlement({...withSettlementBattleLog, restRunSnapshot: wonRestRun}, "loss");
assert(settlementRun.status === "ended", "settlement should end formal run");
assert(settlementRun.settlement?.wonRounds === 1, "settlement should count won rounds");
assert(settlementRun.settlement?.totalRounds === 7, "standard settlement should expose total round count");
assert(settlementRun.settlement?.bpGained === 1, "settlement should calculate BP from normal NPC coefficient at streak 0");
assert(settlementRun.settlement?.pokemonStats[0]?.pokemonKey, "settlement should include pokemon stats and MVP");
const raichuSettlementStat = settlementRun.settlement?.pokemonStats.find(stat => stat.pokemonKey.includes("raichu") || stat.name.toLowerCase().includes("raichu") || stat.nameZh.includes("雷丘"));
assert(raichuSettlementStat && raichuSettlementStat.damageDealt >= 123, "settlement stats should include player battleLog pokemon even when missing from final team");
const historicalNinetales = {
  ...withBattleLog.roundPlan[0]!.participants.p1!.localTeam.pokemon[0]!,
  localPokemonId: "historical-ninetales-alola",
  speciesId: "ninetalesalola",
  showdownId: "ninetalesalola",
  name: "Ninetales-Alola",
  nameZh: "九尾-阿罗拉",
};
const historicalDelphox = {
  ...withBattleLog.roundPlan[0]!.participants.p1!.localTeam.pokemon[1]!,
  localPokemonId: "historical-delphox",
  speciesId: "delphox",
  showdownId: "delphox",
  name: "Delphox",
  nameZh: "妖火红狐",
};
const historicalP1 = {
  ...withBattleLog.roundPlan[0]!.participants.p1!,
  localTeam: {
    ...withBattleLog.roundPlan[0]!.participants.p1!.localTeam,
    pokemon: [historicalNinetales, historicalDelphox, ...withBattleLog.roundPlan[0]!.participants.p1!.localTeam.pokemon.slice(2)],
  },
};
const historicalWonRestRun = {
  ...wonRestRun,
  players: {
    ...wonRestRun.players,
    p1: {
      ...wonRestRun.players.p1!,
      localTeam: {
        ...wonRestRun.players.p1!.localTeam,
        pokemon: wonRestRun.players.p1!.localTeam.pokemon.slice(2),
      },
    },
  },
  gameMap: wonRestRun.gameMap.map((node, index) => index === 0
    ? {...node, participants: {...node.participants, p1: historicalP1}, state: "won" as const}
    : node),
  battleLog: [
    ...(wonRestRun.battleLog || []),
    {
      id: "formal-smoke:historical-ninetales-damage",
      key: "formal-smoke:historical-ninetales-damage",
      at: new Date(0).toISOString(),
      sessionId: "formal-smoke-session",
      nodeId: withBattleLog.roundPlan[0]!.id,
      turn: 3,
      rawLogIndex: 1001,
      eventType: "damage" as const,
      damage: 222,
      sourcePlayerId: "p1" as const,
      sourcePokemonKey: "p1a: Ninetales",
      sourcePokemonName: "Ninetales",
      targetPlayerId: "p2" as const,
      targetPokemonKey: "p2a: Test Target",
      targetPokemonName: "Test Target",
      directness: "direct" as const,
      rawLine: "|-damage|p2a: Test Target|1/100|[from] move: Moonblast|[of] p1a: Ninetales",
    },
    {
      id: "formal-smoke:historical-delphox-damage",
      key: "formal-smoke:historical-delphox-damage",
      at: new Date(0).toISOString(),
      sessionId: "formal-smoke-session",
      nodeId: withBattleLog.roundPlan[0]!.id,
      turn: 4,
      rawLogIndex: 1002,
      eventType: "damage" as const,
      damage: 333,
      sourcePlayerId: "p1" as const,
      sourcePokemonKey: "p1a: Delphox",
      sourcePokemonName: "Delphox",
      targetPlayerId: "p2" as const,
      targetPokemonKey: "p2a: Test Target",
      targetPokemonName: "Test Target",
      directness: "direct" as const,
      rawLine: "|-damage|p2a: Test Target|1/100|[from] move: Flamethrower|[of] p1a: Delphox",
    },
  ],
};
const historicalSettlementRun = api.prepareFormalSettlement({
  ...withSettlementBattleLog,
  playerTeam: null,
  roundPlan: withSettlementBattleLog.roundPlan.map((round, index) => index === 0 ? {...round, participants: {...round.participants, p1: historicalP1}} : round),
  restRunSnapshot: historicalWonRestRun,
}, "loss");
const historicalNinetalesStat = historicalSettlementRun.settlement?.pokemonStats.find(stat => stat.localPokemonId === "historical-ninetales-alola");
const historicalDelphoxStat = historicalSettlementRun.settlement?.pokemonStats.find(stat => stat.localPokemonId === "historical-delphox");
assert(historicalNinetalesStat && historicalNinetalesStat.damageDealt >= 222, "settlement stats should map historical base-form battle keys back to player pokemon");
assert(historicalDelphoxStat && historicalDelphoxStat.damageDealt >= 333, "settlement stats should include historical player pokemon even when final players.p1 omits them");
const dividendSettlementRun = api.prepareFormalSettlement({...withBattleLog, starChartSnapshot: starProfile.starChart, money: 1234, restRunSnapshot: wonRestRun}, "loss");
assert(dividendSettlementRun.settlement?.bpGained === 13, "victory dividend should add floor(current money * 1%) BP");
assert(dividendSettlementRun.money === 1234, "victory dividend should not consume money");
assert(dividendSettlementRun.settlement?.diagnostics.some(entry => entry === "victory-dividend:+12bp"), "victory dividend should be recorded in settlement diagnostics");
const settlementRunAgain = api.prepareFormalSettlement(settlementRun, "loss");
assert(settlementRunAgain.settlement?.id === settlementRun.settlement?.id, "settlement should be idempotent once prepared");

const doublesPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "doubles", seed: "formal-smoke-doubles-seed"}));
const doublesSelected = api.selectFormalStarterPokemon(doublesPrepared, [0, 1, 2, 3]);
const doublesPlanned = await api.prepareFormalRoundPlan(doublesSelected);
assert(doublesPlanned.roundPlan[0]?.participants.p2?.localTeam.pokemon.length === 4, "doubles formal first opponent should bring four pokemon");
assert(!doublesPlanned.roundPlan[1]?.participants.p2, "doubles formal future opponents should be deferred");

const gen9Profile = {...profile, battlePreference: normalizeBattlePreferenceV4({...profile.battlePreference, ruleSet: "gen9"})};
const gen9Prepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(gen9Profile, {mode: "singles", seed: "formal-smoke-gen9-seed"}));
const gen9Selected = api.selectFormalStarterPokemon(gen9Prepared, [0, 1, 2]);
const gen9Planned = await api.prepareFormalRoundPlan(gen9Selected);
assert(gen9Planned.roundPlan[0]?.participants.p2?.bag.items.some(item => item.itemID === "system-tera-orb"), "gen9 formal NPC should receive tera system item");
const gen9OpponentDiagnostics = gen9Planned.roundPlan[0]?.npcs[0]?.diagnostics || [];
assert(gen9OpponentDiagnostics.some(entry => entry === "formal-team-generator:showdown"), "gen9 formal NPC should try Showdown structured team generation");
assert(gen9OpponentDiagnostics.some(entry => entry === "formal-team-generator:generations:9"), "gen9 formal NPC generation should preserve single-generation restriction");
assert(gen9OpponentDiagnostics.some(entry => entry === "formal-team-generator:systems:terastal"), "gen9 formal NPC generation should record terastal system context");
const gen8Profile = {...profile, battlePreference: normalizeBattlePreferenceV4({...profile.battlePreference, ruleSet: "gen8"})};
const gen8Prepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(gen8Profile, {mode: "singles", seed: "formal-smoke-gen8-seed"}));
const gen8Selected = api.selectFormalStarterPokemon(gen8Prepared, [0, 1, 2]);
const gen8Planned = await api.prepareFormalRoundPlan(gen8Selected);
assert(gen8Planned.roundPlan[0]?.participants.p2?.bag.items.some(item => item.itemID === "system-dynamax-band"), "gen8 formal NPC should receive Dynamax Band");
const gen7Profile = {...profile, battlePreference: normalizeBattlePreferenceV4({...profile.battlePreference, ruleSet: "gen7"})};
const gen7Prepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(gen7Profile, {mode: "singles", seed: "formal-smoke-gen7-seed"}));
const gen7StarterMegaCount = gen7Prepared.starterCandidates.filter(candidate => MOCK_MEGA_CAPABLE_SPECIES.has(candidate.pokemon.speciesId)).length;
assert(gen7StarterMegaCount >= 2, "gen7 formal starter candidates should include at least two Mega-capable pokemon");
const gen7Selected = api.selectFormalStarterPokemon(gen7Prepared, [0, 1, 2]);
const gen7Planned = await api.prepareFormalRoundPlan(gen7Selected);
const gen7NpcItems = gen7Planned.roundPlan[0]?.participants.p2?.bag.items || [];
assert(gen7NpcItems.some(item => item.itemID === "system-mega-stone"), "gen7 formal NPC should receive Mega system item");
assert(gen7NpcItems.some(item => item.itemID === "system-z-crystal"), "gen7 formal NPC should receive Z system item");
const mappedGen7NpcItems = gen7NpcItems.filter(item => item.mappedItemId);
const gen7NpcHeldInstanceIds = new Set((gen7Planned.roundPlan[0]?.participants.p2?.localTeam.pokemon || []).map(pokemon => pokemon.heldItemInstanceId).filter(Boolean));
assert(mappedGen7NpcItems.every(item => gen7NpcHeldInstanceIds.has(item.id)), "mapped gen7 formal NPC system items should be held by a pokemon");
const gen7NpcMegaItem = gen7NpcItems.find(item => item.itemID === "system-mega-stone");
const gen7NpcMegaHolder = (gen7Planned.roundPlan[0]?.participants.p2?.localTeam.pokemon || []).find(pokemon => pokemon.heldItemInstanceId === gen7NpcMegaItem?.id);
assert(gen7NpcMegaItem?.mappedItemId, "gen7 formal NPC Mega system item should be mapped to a concrete Mega Stone");
assert(gen7NpcMegaHolder && MOCK_MEGA_CAPABLE_SPECIES.has(gen7NpcMegaHolder.speciesId), "gen7 formal NPC should hold Mega Stone on a Mega-capable pokemon");
const gen7NpcZItem = gen7NpcItems.find(item => item.itemID === "system-z-crystal");
const gen7NpcZHolder = (gen7Planned.roundPlan[0]?.participants.p2?.localTeam.pokemon || []).find(pokemon => pokemon.heldItemInstanceId === gen7NpcZItem?.id);
if (gen7NpcZItem?.mappedItemId === "pikaniumz") {
  assert(gen7NpcZHolder?.moves.some(move => move.moveId === "volttackle"), "exclusive Pikachu Z should add Volt Tackle to the holder");
}

const championPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "singles", streak: 3, seed: "formal-smoke-champion-seed"}));
const championSelected = api.selectFormalStarterPokemon(championPrepared, [0, 1, 2]);
const championPlanned = await api.prepareFormalRoundPlan(championSelected);
assert(["champion", "villain"].includes(championPlanned.roundPlan[6]!.difficulty), "late formal skeleton should reserve champion/villain final battle");

const coopPrepared = api.prepareFormalStarterCandidates(api.createFormalGameRun(profile, {mode: "coop", seed: "formal-smoke-coop-seed"}));
const coopSelected = api.selectFormalStarterPokemon(coopPrepared, [0, 1]);
const coopPlanned = await api.prepareFormalRoundPlan(coopSelected);
assert(coopPlanned.roundPlan.length === 7, "coop formal plan should still create seven rounds");
assert(coopPlanned.roundPlan[0]!.npcs.length === 2, "coop formal first round should create two opponents before battle ally dispatch");
assert(coopPlanned.roundPlan.slice(1).every(round => round.npcs.length === 0), "coop formal future opponents should be deferred");
assert(coopPlanned.roundPlan[0]!.participants.p2 && !coopPlanned.roundPlan[0]!.participants.p3 && coopPlanned.roundPlan[0]!.participants.p4, "coop formal first round should defer p3 until battle transition");
assert(
  (coopPlanned.roundPlan[0]!.participants.p2?.localTeam.pokemon.length || 0) === 2
  && (coopPlanned.roundPlan[0]!.participants.p4?.localTeam.pokemon.length || 0) === 2,
  "coop formal first opponent participants should bring two pokemon each",
);
const coopBattlePrepared = await api.prepareFormalBattleSession(coopPlanned);
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

function simulateSelfStudyCatchUpTotals(ivTotal: number, evTotal: number, events: Array<"playful" | "normal" | "focused">, stable: boolean) {
  let iv = ivTotal;
  let ev = evTotal;
  for (const event of events) {
    const baseRule = formalTrainingGroundDynamicSelfStudyGainRuleV4(event, {ivTotal: iv, evTotal: ev});
    const rule = stable ? formalTrainingGroundStableSelfStudyGainRuleV4(baseRule) : baseRule;
    iv += rule.iv[1];
    ev += rule.ev[1];
  }
  return {iv, ev};
}

function expectedTrainingGroundLessonFee(kind: string): number {
  return 200;
}

function smokeMergeFormalRunBagIntoPlayerVault(run: FormalGameRunV4) {
  const exportIds = new Set(run.pendingSettlementExportItemInstanceIds || []);
  const exportedItems = (run.restRunSnapshot?.players.p1?.bag.items || []).filter(item => exportIds.has(item.id));
  return {
    vault: normalizePlayerVaultV4({
      items: exportedItems.map((item, index) => ({
        itemId: item.itemID,
        quantity: 1,
        boxKind: "storage",
        storagePageIndex: 0,
        slotIndex: index,
      })),
    }),
    depositedItemCount: exportedItems.length,
    rejectedItemCount: 0,
  };
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
  const rule = formalPowerProfileRuleV4(profile);
  return {level: [...rule.level] as [number, number], ivTotal: [...rule.ivTotal] as [number, number], evTotal: [...rule.evTotal] as [number, number]};
}

function powerProfileIndex(profile: PokemonPowerProfileV4): number {
  const order: PokemonPowerProfileV4[] = ["rookie", "normal", "elite", "boss", "champion"];
  return Math.max(0, order.indexOf(profile));
}

function assertRecommendedMoveCount(pokemon: {speciesId: string; moves: Array<{moveId?: string}>}, min: number, label: string) {
  const learnableRecommendedMoveIds = learnableRecommendedMoveIdsForPokemon(pokemon.speciesId);
  const expected = Math.min(min, learnableRecommendedMoveIds.length, 4);
  if (expected <= 0) return;
  const generatedMoveIds = new Set(pokemon.moves.map(move => toTestId(move.moveId)));
  const count = learnableRecommendedMoveIds.filter(moveId => generatedMoveIds.has(moveId)).length;
  assert(count >= expected, `${label} should keep ${expected} recommended learnable moves`);
}

function learnableRecommendedMoveIdsForPokemon(speciesId: string): string[] {
  const profileIds = [speciesId, pokemonById.get(speciesId)?.baseSpecies || ""].map(toTestId).filter(Boolean);
  const recommendedMoveIds = new Set(profileIds.flatMap(id => getPokemonBattleProfileV4(id).suggestedMoveIds.map(toTestId)));
  return Array.from(recommendedMoveIds).filter(moveId => mockStarterLearnableMoveIds.has(moveId));
}
