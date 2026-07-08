export type FormalShopCategoryV4 = "recovery" | "berry" | "battle" | "tm" | "training" | "parenting" | "evolution";

export type FormalShopProductViewV4 = {
  slotId: string;
  itemID: string;
  type: FormalShopCategoryV4;
  name: string;
  price: number;
  summary: string;
  stock: number;
  iconUrl?: string;
  iconStyle?: string;
};

export type FormalShopGenerationRuleIdV4 = "standard" | "pendingSettlement";

export type FormalShopGenerationRuleV4 = {
  id: FormalShopGenerationRuleIdV4;
  itemPools: Record<FormalShopCategoryV4, string[]>;
  slotsPerCategory: Record<FormalShopCategoryV4, number>;
  fixedSlots: boolean;
};

export const FORMAL_SHOP_CATEGORY_LABELS: Record<FormalShopCategoryV4, string> = {
  recovery: "恢复药",
  berry: "树果",
  battle: "战斗道具",
  tm: "技能机器",
  training: "训练道具",
  parenting: "养育道具",
  evolution: "进化道具",
};

export const FORMAL_SHOP_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "tm", "training", "parenting", "evolution"];

export const FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "training", "parenting", "evolution", "tm"];

export const FORMAL_SHOP_COMMON_BERRY_POOL = ["oranberry", "leppaberry", "sitrusberry", "lumberry"];

export const FORMAL_SHOP_RESIST_BERRY_POOL = [
  "occaberry", "passhoberry", "wacanberry", "rindoberry", "yacheberry", "chopleberry",
  "kebiaberry", "shucaberry", "cobaberry", "payapaberry", "tangaberry", "chartiberry",
  "kasibberry", "habanberry", "colburberry", "babiriberry", "chilanberry", "roseliberry",
];

export const FORMAL_SHOP_CONFUSION_BERRY_POOL = ["figyberry", "wikiberry", "magoberry", "aguavberry", "iapapaberry"];

const FORMAL_SHOP_EV_STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const FORMAL_SHOP_EV_SMALL_ITEM_POOL = FORMAL_SHOP_EV_STAT_IDS.flatMap(stat => [`ev${stat}small`, `ev${stat}downsmall`]);
const FORMAL_SHOP_EV_COMMON_ITEM_POOL = FORMAL_SHOP_EV_STAT_IDS.flatMap(stat => [`ev${stat}plus`, `ev${stat}down`]);
const FORMAL_SHOP_EV_RESET_ITEM_POOL = FORMAL_SHOP_EV_STAT_IDS.flatMap(stat => [`ev${stat}zero`, `ev${stat}downlarge`]);
const FORMAL_SHOP_EV_LARGE_ITEM_POOL = FORMAL_SHOP_EV_STAT_IDS.flatMap(stat => [`ev${stat}large`, `ev${stat}max`]);
export const FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL = [
  ...FORMAL_SHOP_EV_SMALL_ITEM_POOL,
  ...FORMAL_SHOP_EV_COMMON_ITEM_POOL,
  ...FORMAL_SHOP_EV_RESET_ITEM_POOL,
  ...FORMAL_SHOP_EV_LARGE_ITEM_POOL,
  "hpup", "protein", "iron", "calcium", "zinc", "carbos",
  "bottlecap", "goldbottlecap", "graybottlecap", "adamantmint", "modestmint",
  "jollymint", "timidmint", "calmmint", "boldmint",
];
export const FORMAL_SHOP_PARENTING_ITEM_POOL = ["heartscale", "standardtextbook", "redthread", "lostmanual", "forbiddenmanual"];
export const FORMAL_SHOP_EVOLUTION_ITEM_POOL = [
  "universal-evolution-stone", "linking-cord", "firestone", "waterstone", "thunderstone",
  "leafstone", "moonstone", "sunstone", "shinystone", "duskstone", "dawnstone",
  "icestone", "kingsrock", "metalcoat", "dragonscale", "upgrade", "dubiousdisc",
  "protector", "electirizer", "magmarizer", "razorclaw", "razorfang", "reapercloth",
  "prismscale", "sachet", "whippeddream", "sweetapple", "tartapple", "syrupyapple",
  "blackaugurite", "peatblock", "auspiciousarmor", "maliciousarmor", "galaricacuff",
  "galaricawreath", "chippedpot", "crackedpot", "unremarkableteacup", "masterpieceteacup",
  "metalalloy",
];

export const FORMAL_SHOP_PRICE_LIMITS = {
  tm: {min: 50, max: 200},
  battle: {min: 150, max: 450},
  training: {min: 10, max: 400},
  parenting: {min: 80, max: 800},
  evolution: {min: 120, max: 300},
  recovery: {min: 10, max: 150},
  berry: {min: 5, max: 30},
} as const;

export const FORMAL_SHOP_BATTLE_ITEM_PRICE_TIERS: Record<number, string[]> = {
  150: ["airballoon", "shellbell", "blacksludge"],
  220: ["expertbelt", "rockyhelmet"],
  300: ["leftovers", "eviolite", "assaultvest", "heavydutyboots"],
  380: ["lifeorb", "choicescarf", "choiceband", "choicespecs"],
  450: ["focussash"],
};

export const FORMAL_SHOP_PRICE_OVERRIDES: Record<string, number> = {
  potion: 20,
  superpotion: 60,
  hyperpotion: 120,
  maxpotion: 130,
  fullrestore: 150,
  freshwater: 30,
  sodapop: 50,
  lemonade: 70,
  moomoomilk: 100,
  fullheal: 30,
  healpowder: 30,
  antidote: 10,
  burnheal: 10,
  iceheal: 10,
  awakening: 10,
  paralyzeheal: 10,
  energypowder: 60,
  energyroot: 120,
  revive: 100,
  maxrevive: 150,
  revivalherb: 150,
  ether: 40,
  maxether: 80,
  elixir: 100,
  maxelixir: 150,
  oranberry: 5,
  leppaberry: 15,
  sitrusberry: 20,
  lumberry: 30,
  ...Object.fromEntries(FORMAL_SHOP_RESIST_BERRY_POOL.map(itemID => [itemID, 15])),
  ...Object.fromEntries(FORMAL_SHOP_CONFUSION_BERRY_POOL.map(itemID => [itemID, 25])),
  leftovers: 300,
  lifeorb: 380,
  choicescarf: 380,
  choiceband: 380,
  choicespecs: 380,
  focussash: 450,
  assaultvest: 300,
  rockyhelmet: 220,
  eviolite: 300,
  expertbelt: 220,
  airballoon: 150,
  heavydutyboots: 300,
  blacksludge: 150,
  shellbell: 150,
  evhpsmall: 10,
  evhpdownsmall: 10,
  evatksmall: 10,
  evatkdownsmall: 10,
  evdefsmall: 10,
  evdefdownsmall: 10,
  evspasmall: 10,
  evspadownsmall: 10,
  evspdsmall: 10,
  evspddownsmall: 10,
  evspesmall: 10,
  evspedownsmall: 10,
  evhpplus: 20,
  evhpdown: 20,
  evatkplus: 20,
  evatkdown: 20,
  evdefplus: 20,
  evdefdown: 20,
  evspaplus: 20,
  evspadown: 20,
  evspdplus: 20,
  evspddown: 20,
  evspeplus: 20,
  evspedown: 20,
  evhpzero: 50,
  evhpdownlarge: 50,
  evatkzero: 50,
  evatkdownlarge: 50,
  evdefzero: 50,
  evdefdownlarge: 50,
  evspazero: 50,
  evspadownlarge: 50,
  evspdzero: 50,
  evspddownlarge: 50,
  evspezero: 50,
  evspedownlarge: 50,
  evhplarge: 100,
  evhpmax: 200,
  evatklarge: 100,
  evatkmax: 200,
  evdeflarge: 100,
  evdefmax: 200,
  evspalarge: 100,
  evspamax: 200,
  evspdlarge: 100,
  evspdmax: 200,
  evspelarge: 100,
  evspemax: 200,
  rarecandy: 400,
  hpup: 200,
  protein: 200,
  iron: 200,
  calcium: 200,
  zinc: 200,
  carbos: 200,
  goldbottlecap: 400,
  bottlecap: 100,
  graybottlecap: 100,
  adamantmint: 50,
  modestmint: 50,
  jollymint: 50,
  timidmint: 50,
  calmmint: 50,
  boldmint: 50,
  abilitycapsule: 100,
  abilitypatch: 200,
  ppup: 100,
  ppmax: 200,
  heartscale: 120,
  standardtextbook: 180,
  redthread: 220,
  lostmanual: 360,
  forbiddenmanual: 800,
  "universal-evolution-stone": 180,
  "linking-cord": 220,
  linkingcord: 220,
  firestone: 150,
  waterstone: 150,
  thunderstone: 150,
  leafstone: 150,
  moonstone: 150,
  sunstone: 150,
  shinystone: 180,
  duskstone: 180,
  dawnstone: 180,
  icestone: 180,
  kingsrock: 180,
  metalcoat: 180,
  dragonscale: 180,
  upgraded: 180,
  upgrade: 180,
  dubiousdisc: 200,
  protector: 200,
  electirizer: 200,
  magmarizer: 200,
  razorclaw: 200,
  razorfang: 200,
  reapercloth: 200,
  prismscale: 200,
  sachet: 200,
  whippeddream: 200,
  sweetapple: 150,
  tartapple: 150,
  syrupyapple: 200,
  blackaugurite: 220,
  peatblock: 220,
  auspiciousarmor: 220,
  maliciousarmor: 220,
  galaricacuff: 220,
  galaricawreath: 220,
  chippedpot: 180,
  crackedpot: 150,
  unremarkableteacup: 180,
  masterpieceteacup: 240,
  metalalloy: 220,
  "tm:protect": 50,
  "tm:substitute": 80,
  "tm:willowisp": 80,
  "tm:toxic": 80,
  "tm:calmmind": 100,
  "tm:swordsdance": 100,
  "tm:trickroom": 100,
  "tm:rockslide": 120,
  "tm:thunderbolt": 150,
  "tm:icebeam": 150,
  "tm:flamethrower": 150,
  "tm:surf": 150,
  "tm:psychic": 150,
  "tm:shadowball": 150,
  "tm:earthquake": 200,
};

export const FORMAL_SHOP_ITEM_BASE_WEIGHTS: Record<string, number> = {
  potion: 12,
  freshwater: 11,
  sodapop: 10,
  superpotion: 10,
  energypowder: 10,
  lemonade: 9,
  moomoomilk: 8,
  hyperpotion: 6,
  energyroot: 6,
  maxpotion: 3,
  fullrestore: 2,
  fullheal: 9,
  healpowder: 8,
  antidote: 11,
  burnheal: 10,
  iceheal: 10,
  awakening: 10,
  paralyzeheal: 10,
  revive: 5,
  maxrevive: 1,
  revivalherb: 1,
  ether: 7,
  maxether: 4,
  elixir: 3,
  maxelixir: 1,
  oranberry: 12,
  leppaberry: 9,
  sitrusberry: 8,
  lumberry: 6,
  ...Object.fromEntries(FORMAL_SHOP_RESIST_BERRY_POOL.map(itemID => [itemID, 4])),
  ...Object.fromEntries(FORMAL_SHOP_CONFUSION_BERRY_POOL.map(itemID => [itemID, 3])),
  airballoon: 8,
  shellbell: 7,
  blacksludge: 5,
  expertbelt: 5,
  rockyhelmet: 5,
  leftovers: 4,
  eviolite: 4,
  assaultvest: 3,
  heavydutyboots: 4,
  lifeorb: 3,
  choicescarf: 2,
  choiceband: 2,
  choicespecs: 2,
  focussash: 1,
  ...Object.fromEntries(FORMAL_SHOP_EV_SMALL_ITEM_POOL.map(itemID => [itemID, 22])),
  ...Object.fromEntries(FORMAL_SHOP_EV_COMMON_ITEM_POOL.map(itemID => [itemID, 18])),
  ...Object.fromEntries(FORMAL_SHOP_EV_RESET_ITEM_POOL.map(itemID => [itemID, 12])),
  ...Object.fromEntries(FORMAL_SHOP_EV_LARGE_ITEM_POOL.map(itemID => [itemID, 2])),
  hpup: 2,
  protein: 2,
  iron: 2,
  calcium: 2,
  zinc: 2,
  carbos: 2,
  ppup: 7,
  ppmax: 3,
  heartscale: 12,
  standardtextbook: 10,
  redthread: 8,
  lostmanual: 4,
  forbiddenmanual: 1,
  "universal-evolution-stone": 10,
  "linking-cord": 8,
  ...Object.fromEntries(FORMAL_SHOP_EVOLUTION_ITEM_POOL.filter(itemID => !["universal-evolution-stone", "linking-cord"].includes(itemID)).map(itemID => [itemID, 5])),
  abilitycapsule: 5,
  abilitypatch: 2,
  bottlecap: 2,
  graybottlecap: 3,
  goldbottlecap: 1,
  rarecandy: 1,
  adamantmint: 7,
  modestmint: 7,
  jollymint: 7,
  timidmint: 7,
  calmmint: 7,
  boldmint: 7,
  "tm:protect": 7,
  "tm:substitute": 5,
  "tm:willowisp": 5,
  "tm:toxic": 5,
  "tm:calmmind": 4,
  "tm:swordsdance": 4,
  "tm:trickroom": 4,
  "tm:rockslide": 4,
  "tm:thunderbolt": 3,
  "tm:icebeam": 3,
  "tm:flamethrower": 3,
  "tm:surf": 3,
  "tm:psychic": 3,
  "tm:shadowball": 3,
  "tm:earthquake": 2,
};

export const FORMAL_SHOP_ITEM_POOL: Record<FormalShopCategoryV4, string[]> = {
  recovery: [
    "potion", "superpotion", "hyperpotion", "maxpotion", "fullrestore",
    "freshwater", "sodapop", "lemonade", "moomoomilk", "fullheal",
    "healpowder", "antidote", "burnheal", "iceheal", "awakening",
    "paralyzeheal", "energypowder", "energyroot", "revive", "maxrevive",
    "revivalherb", "ether", "maxether", "elixir", "maxelixir",
  ],
  berry: [
    ...FORMAL_SHOP_COMMON_BERRY_POOL,
    ...FORMAL_SHOP_RESIST_BERRY_POOL,
    ...FORMAL_SHOP_CONFUSION_BERRY_POOL,
  ],
  battle: [
    "leftovers", "lifeorb", "choicescarf", "choiceband", "choicespecs",
    "focussash", "assaultvest", "rockyhelmet", "eviolite", "expertbelt",
    "airballoon", "heavydutyboots", "blacksludge", "shellbell",
  ],
  tm: [
    "tm:protect", "tm:thunderbolt", "tm:icebeam", "tm:flamethrower", "tm:earthquake",
    "tm:surf", "tm:psychic", "tm:shadowball", "tm:rockslide", "tm:calmmind",
    "tm:swordsdance", "tm:substitute", "tm:willowisp", "tm:toxic", "tm:trickroom",
  ],
  training: [
    ...FORMAL_SHOP_EV_SMALL_ITEM_POOL,
    ...FORMAL_SHOP_EV_COMMON_ITEM_POOL,
    ...FORMAL_SHOP_EV_RESET_ITEM_POOL,
    ...FORMAL_SHOP_EV_LARGE_ITEM_POOL,
    "rarecandy", "hpup", "protein", "iron", "calcium", "zinc", "carbos",
    "ppup", "ppmax", "abilitycapsule", "abilitypatch", "bottlecap",
    "goldbottlecap", "graybottlecap", "adamantmint", "modestmint", "jollymint",
    "timidmint", "calmmint", "boldmint",
  ],
  parenting: FORMAL_SHOP_PARENTING_ITEM_POOL,
  evolution: FORMAL_SHOP_EVOLUTION_ITEM_POOL,
};

export const FORMAL_PENDING_SETTLEMENT_SHOP_ITEM_POOL: Record<FormalShopCategoryV4, string[]> = {
  ...FORMAL_SHOP_ITEM_POOL,
  recovery: [],
  berry: [],
  battle: FORMAL_SHOP_ITEM_POOL.battle,
  training: FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL,
  parenting: FORMAL_SHOP_PARENTING_ITEM_POOL,
  evolution: FORMAL_SHOP_EVOLUTION_ITEM_POOL,
  tm: FORMAL_SHOP_ITEM_POOL.tm,
};

export const FORMAL_SHOP_SLOTS_PER_CATEGORY: Record<FormalShopCategoryV4, number> = {
  recovery: 3,
  berry: 3,
  battle: 3,
  training: 3,
  parenting: 3,
  evolution: 3,
  tm: 3,
};

export const FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY: Record<FormalShopCategoryV4, number> = {
  recovery: 0,
  berry: 0,
  battle: 1,
  training: 2,
  parenting: 2,
  evolution: 2,
  tm: 2,
};

export const FORMAL_STANDARD_SHOP_GENERATION_RULE_V4: FormalShopGenerationRuleV4 = {
  id: "standard",
  itemPools: FORMAL_SHOP_ITEM_POOL,
  slotsPerCategory: FORMAL_SHOP_SLOTS_PER_CATEGORY,
  fixedSlots: false,
};

export const FORMAL_PENDING_SETTLEMENT_SHOP_GENERATION_RULE_V4: FormalShopGenerationRuleV4 = {
  id: "pendingSettlement",
  itemPools: FORMAL_PENDING_SETTLEMENT_SHOP_ITEM_POOL,
  slotsPerCategory: FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY,
  fixedSlots: true,
};

export function formalShopGenerationRuleV4(pendingSettlement = false): FormalShopGenerationRuleV4 {
  return pendingSettlement ? FORMAL_PENDING_SETTLEMENT_SHOP_GENERATION_RULE_V4 : FORMAL_STANDARD_SHOP_GENERATION_RULE_V4;
}

export function formalShopItemPoolForCategoryV4(category: FormalShopCategoryV4, pendingSettlement = false): string[] {
  return formalShopGenerationRuleV4(pendingSettlement).itemPools[category] || [];
}

export function formalShopSlotsForCategoryV4(category: FormalShopCategoryV4, pendingSettlement = false, rows = 1): number {
  const rule = formalShopGenerationRuleV4(pendingSettlement);
  const maxSlots = rule.slotsPerCategory[category] || 0;
  if (rule.fixedSlots) return Math.max(0, maxSlots);
  return Math.max(1, Math.min(maxSlots, rows));
}

export function validateFormalShopCatalogV4(): string[] {
  const messages: string[] = [];
  const expectedCategories = Object.keys(FORMAL_SHOP_ITEM_POOL) as FormalShopCategoryV4[];
  const orderedCategories = new Set(FORMAL_SHOP_CATEGORY_ORDER);
  const productViewCategories = new Set(FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER);

  for (const category of expectedCategories) {
    if (!orderedCategories.has(category)) messages.push(`FORMAL_SHOP_CATEGORY_ORDER missing ${category}`);
    if (!productViewCategories.has(category)) messages.push(`FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER missing ${category}`);
    if (!FORMAL_SHOP_CATEGORY_LABELS[category]) messages.push(`FORMAL_SHOP_CATEGORY_LABELS missing ${category}`);
    const slotCount = FORMAL_SHOP_SLOTS_PER_CATEGORY[category] || 0;
    const poolCount = FORMAL_SHOP_ITEM_POOL[category]?.length || 0;
    if (poolCount < slotCount) messages.push(`FORMAL_SHOP_ITEM_POOL.${category} has ${poolCount} items, needs at least ${slotCount}`);
    for (const itemID of FORMAL_SHOP_ITEM_POOL[category] || []) {
      const price = FORMAL_SHOP_PRICE_OVERRIDES[itemID];
      if (!Number.isFinite(price)) {
        messages.push(`FORMAL_SHOP_PRICE_OVERRIDES missing ${itemID}`);
        continue;
      }
      const limits = FORMAL_SHOP_PRICE_LIMITS[category];
      if (price < limits.min || price > limits.max) messages.push(`FORMAL_SHOP_PRICE_OVERRIDES.${itemID}=${price} outside ${category} range ${limits.min}-${limits.max}`);
    }
  }

  for (const category of FORMAL_SHOP_CATEGORY_ORDER) {
    if (!FORMAL_SHOP_ITEM_POOL[category]) messages.push(`FORMAL_SHOP_CATEGORY_ORDER has unknown category ${category}`);
  }

  for (const category of FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER) {
    if (!FORMAL_SHOP_ITEM_POOL[category]) messages.push(`FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER has unknown category ${category}`);
  }

  return messages;
}
