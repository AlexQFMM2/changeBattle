export type FormalShopCategoryV4 = "recovery" | "berry" | "battle" | "tm" | "training";

export type FormalStarterRoleV4 = "weather" | "trick-room" | "offense" | "support" | "defense" | "speed-control" | "disruption" | "flex-offense" | "flex-defense" | "balanced";

export type PokemonPowerProfileV4 = "rookie" | "normal" | "elite" | "boss" | "champion";

export type CoopPartnerPreferenceV4 = "offense" | "defense" | "support" | "balanced";

export type FormalNpcTypeV4 = "rookie" | "normal" | "elite" | "gym" | "elite4" | "champion" | "villain";

export type FormalNpcBattlePreferenceV4 = "offense" | "defense" | "support" | "balanced";

export type FormalNpcTeamPreferenceV4 = "balanced" | "rain" | "sun" | "sand" | "snow" | "trick-room" | "tailwind" | "terrain" | "hazard-stack" | "poison-stall" | "setup-offense";

export type StarChartStateV4 = {
  nodes: Record<string, number>;
};

export type StarChartNodeKindV4 = "talent" | "starter_upgrade" | "event_preview" | "root" | "badge";

export type StarChartNodeViewV4 = {
  id: string;
  name: string;
  category: string;
  desc: string;
  cost?: number;
  disabled?: boolean;
  level?: number;
  max_level?: number;
  costs?: number[];
  requires?: Array<{id: string; level?: number}>;
  effects?: string[];
  kind?: StarChartNodeKindV4;
  x?: number;
  y?: number;
};

export type RestCenterActionIdV4 = "pokedex" | "shop" | "team" | "bag" | "save" | "finish-rest" | "abandon-run";

export type RestCenterActionGroupV4 = "paper" | "left-side" | "right-side";

export type RestCenterActionEntryV4 = {
  id: RestCenterActionIdV4 | "placeholder";
  label: string;
  action: string;
  group: RestCenterActionGroupV4;
  iconSrc?: string;
  iconText?: string;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
};

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

export const FORMAL_RUN_VERSION = 1 as const;

export const FORMAL_STARTER_SHINY_RATE = 1 / 30;

export const FORMAL_ROUND_COUNT = 7;

export const FORMAL_STARTING_MONEY = 3000;

export const FORMAL_SHOP_SELL_RATE = 0.25;

export const MAX_BP_V4 = 99999;

export const STARTER_ROLE_PLAN: FormalStarterRoleV4[] = [
  "weather",
  "trick-room",
  "offense",
  "offense",
  "support",
  "defense",
  "speed-control",
  "disruption",
  "flex-defense",
  "flex-offense",
];

export const STARTER_MAX_LEGENDARY_CANDIDATES = 1;

export const FALLBACK_SPECIES = ["lucario", "charizard", "gardevoir", "dragonite", "greninja", "venusaur", "arcanine", "lapras", "gyarados", "snorlax"];

export const FALLBACK_MOVES = ["tackle", "quickattack", "protect", "rest"];

export const NPC_ROOKIE_ITEMS = ["", "", "", "oranberry", "sitrusberry", "lumberry"];

export const NPC_NORMAL_ITEMS = ["oranberry", "sitrusberry", "lumberry", "leftovers", "rockyhelmet"];

export const NPC_ELITE_ITEMS = ["sitrusberry", "lumberry", "leftovers", "rockyhelmet", "expertbelt", "airballoon", "focussash"];

export const NPC_BOSS_ITEMS = ["leftovers", "choicescarf", "choiceband", "choicespecs", "lifeorb", "focussash", "sitrusberry", "lumberry", "rockyhelmet", "assaultvest", "heavydutyboots"];

export const NPC_BATTLE_PREFERENCES: FormalNpcBattlePreferenceV4[] = ["offense", "defense", "support", "balanced"];

export const NPC_TEAM_PREFERENCES: FormalNpcTeamPreferenceV4[] = ["rain", "sun", "sand", "snow", "trick-room", "tailwind", "terrain", "hazard-stack", "poison-stall", "setup-offense", "balanced"];

export const ROUND_DISTRIBUTIONS: Record<"0" | "1" | "2" | "3", FormalNpcTypeV4[]> = {
  "0": ["rookie", "normal", "gym", "normal", "normal", "elite", "gym"],
  "1": ["normal", "elite", "gym", "elite", "gym", "elite", "elite4"],
  "2": ["elite", "elite", "elite4", "elite", "gym", "elite4", "champion"],
  "3": ["elite", "gym", "elite", "elite4", "elite4", "elite4", "champion"],
};

export const NORMAL_NPC_NAMES = {
  rookie: ["短裤少年", "迷你裙", "捕虫少年", "露营少年", "学生"],
  normal: ["精英训练家", "宝可梦巡护员", "背包客", "空手道王", "大姐姐"],
  elite: ["王牌训练家", "资深训练家", "战术教练", "对战女郎", "道馆助教"],
  ally: ["精英队友", "战术搭档", "支援训练家", "合作专家", "双打拍档"],
} as const;

export const DEFAULT_TRAINER_AVATAR = "/npc/avatars/1-asset-18b76b7d.webp";

export const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
];

export const NATURE_ZH: Record<string, string> = {
  Hardy: "勤奋",
  Lonely: "怕寂寞",
  Brave: "勇敢",
  Adamant: "固执",
  Naughty: "顽皮",
  Bold: "大胆",
  Docile: "坦率",
  Relaxed: "悠闲",
  Impish: "淘气",
  Lax: "乐天",
  Timid: "胆小",
  Hasty: "急躁",
  Serious: "认真",
  Jolly: "爽朗",
  Naive: "天真",
  Modest: "内敛",
  Mild: "慢吞吞",
  Quiet: "冷静",
  Bashful: "害羞",
  Rash: "马虎",
  Calm: "温和",
  Gentle: "温顺",
  Sassy: "自大",
  Careful: "慎重",
  Quirky: "浮躁",
};

export const ROLE_TYPE_HINTS: Record<FormalStarterRoleV4, string[]> = {
  weather: ["Water", "Fire", "Rock", "Ice", "Ground", "Grass"],
  "trick-room": ["Psychic", "Ghost", "Fairy", "Rock", "Steel"],
  offense: ["Dragon", "Fire", "Electric", "Fighting", "Dark", "Flying"],
  support: ["Fairy", "Grass", "Psychic", "Water", "Normal"],
  defense: ["Steel", "Water", "Grass", "Poison", "Ground"],
  "speed-control": ["Electric", "Flying", "Psychic", "Fairy", "Bug"],
  disruption: ["Poison", "Ghost", "Dark", "Steel", "Ground", "Grass"],
  "flex-defense": ["Steel", "Water", "Grass", "Poison", "Ground"],
  "flex-offense": ["Dragon", "Fire", "Electric", "Fighting", "Dark", "Flying"],
  balanced: [],
};

export const FORMAL_NPC_TEAM_PREFERENCE_LABELS: Record<FormalNpcTeamPreferenceV4, string> = {
  balanced: "平衡队",
  rain: "雨天队",
  sun: "晴天队",
  sand: "沙暴队",
  snow: "雪天队",
  "trick-room": "空间队",
  tailwind: "顺风队",
  terrain: "场地队",
  "hazard-stack": "撒场队",
  "poison-stall": "消耗队",
  "setup-offense": "强化攻队",
};

export const FORMAL_STARTER_ROLE_LABELS: Record<FormalStarterRoleV4, string> = {
  weather: "天气组件",
  "trick-room": "空间组件",
  offense: "进攻核心",
  support: "辅助手",
  defense: "防御手",
  "speed-control": "速度控制",
  disruption: "干扰撒场",
  "flex-defense": "防辅补位",
  "flex-offense": "攻击补位",
  balanced: "平衡补位",
};

export const MORE_CHOICES_NODE_IDS = ["starter_more_choices_1", "starter_more_choices_2", "starter_more_choices_3", "starter_more_choices_4"] as const;

export const STAR_CHART_NODES_V4: StarChartNodeViewV4[] = [
  {
    id: "root_trainer_star",
    name: "训练家星核",
    category: "星核",
    desc: "所有路线的起点。",
    max_level: 1,
    costs: [0],
    requires: [],
    effects: ["星图起点，默认点亮。"],
    kind: "root",
    x: 0,
    y: 0,
  },
  {
    id: "starter_more_choices_1",
    name: "多多益善 I",
    category: "开局筹备",
    desc: "初始宝可梦候选数量 +1。",
    max_level: 1,
    costs: [10],
    requires: [{id: "root_trainer_star"}],
    effects: ["初始宝可梦候选数量 +1。"],
    kind: "starter_upgrade",
    x: -180,
    y: -75,
  },
  {
    id: "starter_more_choices_2",
    name: "多多益善 II",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [12],
    requires: [{id: "starter_more_choices_1"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    kind: "starter_upgrade",
    x: -330,
    y: -130,
  },
  {
    id: "starter_more_choices_3",
    name: "多多益善 III",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [15],
    requires: [{id: "starter_more_choices_2"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    kind: "starter_upgrade",
    x: -480,
    y: -185,
  },
  {
    id: "starter_more_choices_4",
    name: "多多益善 IV",
    category: "开局筹备",
    desc: "初始宝可梦候选数量再 +1。",
    max_level: 1,
    costs: [20],
    requires: [{id: "starter_more_choices_3"}],
    effects: ["初始宝可梦候选数量再 +1。"],
    kind: "starter_upgrade",
    x: -630,
    y: -240,
  },
];

export const REST_CENTER_PAPER_ACTIONS_V4: RestCenterActionEntryV4[] = [
  {id: "pokedex", label: "图鉴", action: "图鉴", group: "paper", iconSrc: "/ui/book.png"},
  {id: "shop", label: "商店", action: "商店", group: "paper", iconSrc: "/aboutIcon/shop.png"},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
  {id: "placeholder", label: "未开放", action: "未开放", group: "paper", iconText: "?", disabled: true},
];

export const REST_CENTER_LEFT_SIDE_ACTIONS_V4: RestCenterActionEntryV4[] = [
  {id: "team", label: "我的队伍", action: "我的队伍", group: "left-side"},
  {id: "bag", label: "我的背包", action: "我的背包", group: "left-side"},
  {id: "save", label: "保存", action: "保存", group: "left-side"},
];

export const REST_CENTER_RIGHT_SIDE_ACTIONS_V4: RestCenterActionEntryV4[] = [
  {id: "finish-rest", label: "结束休整", action: "结束休整", group: "right-side", primary: true},
  {id: "abandon-run", label: "放弃比赛", action: "放弃比赛", group: "right-side", danger: true},
];

export const FORMAL_SHOP_CATEGORY_LABELS: Record<FormalShopCategoryV4, string> = {
  recovery: "恢复药",
  berry: "树果",
  battle: "战斗道具",
  tm: "技能机器",
  training: "训练道具",
};

export const FORMAL_SHOP_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "tm", "training"];

export const FORMAL_SHOP_PRODUCT_VIEW_CATEGORY_ORDER: FormalShopCategoryV4[] = ["recovery", "berry", "battle", "training", "tm"];

export const FORMAL_SHOP_ITEM_POOL: Record<FormalShopCategoryV4, string[]> = {
  recovery: [
    "potion", "superpotion", "hyperpotion", "maxpotion", "fullrestore",
    "freshwater", "sodapop", "lemonade", "moomoomilk", "fullheal",
    "healpowder", "antidote", "burnheal", "iceheal", "awakening",
    "paralyzeheal", "energypowder", "energyroot", "revive", "maxrevive",
    "revivalherb", "ether", "maxether", "elixir", "maxelixir",
  ],
  berry: [
    "oranberry", "sitrusberry", "leppaberry", "lumberry",
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
