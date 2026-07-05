export type FormalShopCategoryV4 = "recovery" | "berry" | "battle" | "tm" | "training";

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

export const FORMAL_SHOP_CATEGORY_LABELS: Record<FormalShopCategoryV4, string> = {
  recovery: "恢复药",
  berry: "树果",
  battle: "战斗道具",
  tm: "技能机器",
  training: "训练道具",
};

export const FORMAL_SHOP_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "tm", "training"];

export const FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "training", "tm"];

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

export const FORMAL_SHOP_PRICE_LIMITS = {
  tm: {min: 100, max: 300},
  battle: {min: 150, max: 450},
  training: {min: 10, max: 400},
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
  oranberry: 5,
  leppaberry: 15,
  sitrusberry: 20,
  lumberry: 30,
  ...Object.fromEntries(FORMAL_SHOP_RESIST_BERRY_POOL.map(itemID => [itemID, 15])),
  ...Object.fromEntries(FORMAL_SHOP_CONFUSION_BERRY_POOL.map(itemID => [itemID, 25])),
  rarecandy: 400,
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
};

export const FORMAL_SHOP_SLOTS_PER_CATEGORY: Record<FormalShopCategoryV4, number> = {
  recovery: 3,
  berry: 3,
  battle: 3,
  training: 3,
  tm: 3,
};

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
  }

  for (const category of FORMAL_SHOP_CATEGORY_ORDER) {
    if (!FORMAL_SHOP_ITEM_POOL[category]) messages.push(`FORMAL_SHOP_CATEGORY_ORDER has unknown category ${category}`);
  }

  for (const category of FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER) {
    if (!FORMAL_SHOP_ITEM_POOL[category]) messages.push(`FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER has unknown category ${category}`);
  }

  return messages;
}
