export type FormalStarterRoleV4 = "weather" | "trick-room" | "offense" | "support" | "defense" | "speed-control" | "disruption" | "flex-offense" | "flex-defense" | "balanced";

export type PokemonPowerProfileV4 = "rookie" | "normal" | "elite" | "boss" | "champion";

export type CoopPartnerPreferenceV4 = "offense" | "defense" | "support" | "balanced";

export type FormalNpcTypeV4 = "rookie" | "normal" | "elite" | "gym" | "elite4" | "champion" | "villain";

export type FormalNpcBattlePreferenceV4 = "offense" | "defense" | "support" | "balanced";

export type FormalNpcTeamPreferenceV4 = "balanced" | "rain" | "sun" | "sand" | "snow" | "trick-room" | "tailwind" | "terrain" | "hazard-stack" | "poison-stall" | "setup-offense";

export const FORMAL_RUN_VERSION = 1 as const;

export const FORMAL_STARTER_SHINY_RATE = 1 / 30;

export const FORMAL_ROUND_COUNT = 7;

export const FORMAL_STARTING_MONEY = 0;

export const FORMAL_SHOP_SELL_RATE = 0.25;

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

export const DEFAULT_TRAINER_AVATAR = "npc/avatars/1-asset-18b76b7d.webp";

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
