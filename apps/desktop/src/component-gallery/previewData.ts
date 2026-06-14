import type {CSSProperties} from "react";
import type {DesktopDexEntry, LocalSave, ShopItem, TrainerCatalogState} from "@changebattle/shared";
import type {MoveCardData} from "../components/move/MoveCard";
import type {MainMenuDexCard} from "../components/shell/mainMenuTypes";

export const moveCardPreviewData: Record<string, MoveCardData & {size?: "battle" | "sheet" | "dex" | "draw"; selected?: boolean; disabled?: boolean; className?: string; previewWidth?: number; style?: CSSProperties}> = {
  dex: {
    name: "日光束",
    moveType: "grass",
    typeLabel: "草",
    category: "特殊",
    pp: 10,
    power: 120,
    accuracy: 100,
    size: "dex",
    className: "quick-dex-move-card",
  },
  battle: {
    name: "暴风",
    moveType: "flying",
    typeLabel: "飞行",
    category: "特殊",
    pp: 15,
    maxPp: 16,
    power: 110,
    accuracy: 70,
    size: "battle",
  },
  complete: {
    name: "暴风",
    moveType: "flying",
    typeLabel: "飞行",
    category: "物理",
    pp: 15,
    maxPp: 16,
    power: 110,
    accuracy: 70,
    damageRange: "107%~127%",
    badge: "效果拔群",
    size: "battle",
    selected: true,
  },
  longText: {
    name: "超长名字测试技能光合作用极限爆发",
    moveType: "psychic",
    typeLabel: "超能力",
    category: "特殊",
    pp: 5,
    maxPp: 8,
    power: "变化",
    accuracy: "必中",
    damageRange: "伤害范围显示很长",
    badge: "不可替换",
    size: "dex",
    className: "quick-dex-move-card quick-dex-result-move-card",
  },
  disabled: {
    name: "破坏光线",
    moveType: "normal",
    typeLabel: "一般",
    category: "特殊",
    pp: 0,
    maxPp: 8,
    power: 150,
    accuracy: 90,
    size: "battle",
    disabled: true,
  },
  compact: {
    name: "电光一闪",
    moveType: "normal",
    typeLabel: "一般",
    category: "物理",
    pp: 30,
    power: 40,
    accuracy: 100,
    size: "sheet",
    previewWidth: 160,
    style: {
      "--move-card-height": "22px",
      "--move-card-name-row-height": "12px",
      "--move-card-meta-row-height": "8px",
      "--move-card-name-font-size": "5px",
      "--move-card-meta-font-size": "4px",
      "--move-card-badge-font-size": "4px",
      "--move-card-name-padding-x": "3px",
      "--move-card-meta-padding-x": "3px",
    } as CSSProperties,
  },
  wide: {
    name: "十万伏特",
    moveType: "electric",
    typeLabel: "电",
    category: "特殊",
    pp: 15,
    maxPp: 24,
    power: 90,
    accuracy: 100,
    damageRange: "64%~76%",
    badge: "稳定输出",
    size: "battle",
    previewWidth: 420,
    style: {
      "--move-card-height": "38px",
      "--move-card-name-row-height": "24px",
      "--move-card-meta-row-height": "11px",
      "--move-card-name-font-size": "9px",
      "--move-card-meta-font-size": "7px",
    } as CSSProperties,
  },
  tall: {
    name: "流星群",
    moveType: "dragon",
    typeLabel: "龙",
    category: "特殊",
    pp: 5,
    maxPp: 8,
    power: 130,
    accuracy: 90,
    damageRange: "88%~104%",
    badge: "降特攻",
    size: "draw",
    previewWidth: 260,
    style: {
      "--move-card-height": "54px",
      "--move-card-name-row-height": "34px",
      "--move-card-meta-row-height": "17px",
      "--move-card-name-font-size": "9px",
      "--move-card-meta-font-size": "7px",
      "--move-card-badge-font-size": "6px",
    } as CSSProperties,
  },
};

export const titlePreviewCatalog: TrainerCatalogState = {
  players: [
    {id: "may", type: "player", name_en: "May", name_zh: "小遥", avatar_asset: "trainers/avatars/may.png", front_asset: "trainers/front/may.png", front_gif_asset: "trainers/front/may.gif"},
    {id: "brendan", type: "player", name_en: "Brendan", name_zh: "小悠", avatar_asset: "trainers/avatars/brendan.png", front_asset: "trainers/front/brendan.png", front_gif_asset: "trainers/front/brendan.gif"},
    {id: "leaf", type: "player", name_en: "Leaf", name_zh: "叶子", avatar_asset: "trainers/avatars/leaf.png", front_asset: "trainers/front/leaf.png", front_gif_asset: "trainers/front/leaf.gif"},
    {id: "red", type: "player", name_en: "Red", name_zh: "赤红", avatar_asset: "trainers/avatars/red.png", front_asset: "trainers/front/red.png", front_gif_asset: "trainers/front/red.gif"},
  ],
  avatars: [
    {id: "avatar-may", type: "avatar", name_en: "May", name_zh: "小遥", avatar_asset: "trainers/avatars/may.png"},
    {id: "avatar-brendan", type: "avatar", name_en: "Brendan", name_zh: "小悠", avatar_asset: "trainers/avatars/brendan.png"},
    {id: "avatar-leaf", type: "avatar", name_en: "Leaf", name_zh: "叶子", avatar_asset: "trainers/avatars/leaf.png"},
    {id: "avatar-red", type: "avatar", name_en: "Red", name_zh: "赤红", avatar_asset: "trainers/avatars/red.png"},
    {id: "avatar-cynthia", type: "avatar", name_en: "Cynthia", name_zh: "竹兰", avatar_asset: "trainers/avatars/cynthia.png"},
  ],
};

export const playerSettingsManyCatalog: TrainerCatalogState = {
  players: [
    ...titlePreviewCatalog.players,
    {id: "dawn", type: "player", name_en: "Dawn", name_zh: "小光", avatar_asset: "trainers/avatars/dawn.png", front_asset: "trainers/front/dawn.png", front_gif_asset: "trainers/front/dawn.gif"},
    {id: "hilbert", type: "player", name_en: "Hilbert", name_zh: "斗也", avatar_asset: "trainers/avatars/hilbert.png", front_asset: "trainers/front/hilbert.png", front_gif_asset: "trainers/front/hilbert.gif"},
    {id: "rosa", type: "player", name_en: "Rosa", name_zh: "鸣依", avatar_asset: "trainers/avatars/rosa.png", front_asset: "trainers/front/rosa.png", front_gif_asset: "trainers/front/rosa.gif"},
    {id: "serena", type: "player", name_en: "Serena", name_zh: "莎莉娜", avatar_asset: "trainers/avatars/serena.png", front_asset: "trainers/front/serena.png", front_gif_asset: "trainers/front/serena.gif"},
  ],
  avatars: [
    ...titlePreviewCatalog.avatars,
    {id: "avatar-dawn", type: "avatar", name_en: "Dawn", name_zh: "小光", avatar_asset: "trainers/avatars/dawn.png"},
    {id: "avatar-hilbert", type: "avatar", name_en: "Hilbert", name_zh: "斗也", avatar_asset: "trainers/avatars/hilbert.png"},
    {id: "avatar-rosa", type: "avatar", name_en: "Rosa", name_zh: "鸣依", avatar_asset: "trainers/avatars/rosa.png"},
    {id: "avatar-serena", type: "avatar", name_en: "Serena", name_zh: "莎莉娜", avatar_asset: "trainers/avatars/serena.png"},
    {id: "avatar-lyra", type: "avatar", name_en: "Lyra", name_zh: "琴音", avatar_asset: "trainers/avatars/lyra.png"},
    {id: "avatar-ethan", type: "avatar", name_en: "Ethan", name_zh: "响", avatar_asset: "trainers/avatars/ethan.png"},
    {id: "avatar-gloria", type: "avatar", name_en: "Gloria", name_zh: "小优", avatar_asset: "trainers/avatars/gloria.png"},
    {id: "avatar-victor", type: "avatar", name_en: "Victor", name_zh: "胜", avatar_asset: "trainers/avatars/victor.png"},
  ],
};

export function createTitlePreviewSave(name = "小遥", battlePoints = 128): LocalSave {
  return {
    version: 1,
    trainer: {
      name,
      player_npc_id: "may",
      avatar_asset: "trainers/avatars/may.png",
      front_asset: "trainers/front/may.png",
      front_gif_asset: "trainers/front/may.gif",
    },
    stats: {
      battle_points: battlePoints,
      battles: 12,
      wins: 8,
      losses: 4,
      rank_status: "normal",
    },
    current_run: null,
    created_at: "2026-06-14T00:00:00.000Z",
    updated_at: "2026-06-14T00:00:00.000Z",
  };
}

export function createMainMenuPreviewSave(name = "小遥", battlePoints = 268): LocalSave {
  return {
    ...createTitlePreviewSave(name, battlePoints),
    stats: {
      battle_points: battlePoints,
      battles: 42,
      wins: 29,
      losses: 13,
      rank_status: "normal",
    },
    run_memory: {
      player_species_ids: ["pikachu", "charizard", "venusaur"],
    },
  };
}

function previewDexEntry(id: string, name: string, nameZh: string, category: DesktopDexEntry["category"]): DesktopDexEntry {
  return {id, name, name_zh: nameZh, category};
}

function previewShopItem(id: string, name: string, nameZh: string): ShopItem {
  return {
    id,
    name,
    name_zh: nameZh,
    desc: "Preview item",
    desc_zh: "预览道具",
    cost: 120,
    icon_asset: "",
  };
}

export const mainMenuFavoritePreviewCards: MainMenuDexCard[] = [
  {id: "favorite-pikachu", label: "皮卡丘", eyebrow: "最常用", category: "pokemon", entry: previewDexEntry("pikachu", "Pikachu", "皮卡丘", "pokemon")},
  {id: "favorite-charizard", label: "喷火龙", eyebrow: "常用 2", category: "pokemon", entry: previewDexEntry("charizard", "Charizard", "喷火龙", "pokemon")},
  {id: "favorite-venusaur", label: "妙蛙花", eyebrow: "常用 3", category: "pokemon", entry: previewDexEntry("venusaur", "Venusaur", "妙蛙花", "pokemon")},
];

export const mainMenuLongFavoritePreviewCards: MainMenuDexCard[] = [
  {id: "favorite-long-1", label: "超级长名字宝可梦展示测试", eyebrow: "最常用但是很长", category: "pokemon", entry: previewDexEntry("long-pokemon-1", "Long Pokemon", "超级长名字宝可梦展示测试", "pokemon")},
  {id: "favorite-long-2", label: "名字很长的喷火龙形态", eyebrow: "常用 2", category: "pokemon", entry: previewDexEntry("long-pokemon-2", "Long Charizard", "名字很长的喷火龙形态", "pokemon")},
  {id: "favorite-long-3", label: "妙蛙花特殊形态测试", eyebrow: "常用 3", category: "pokemon", entry: previewDexEntry("long-pokemon-3", "Long Venusaur", "妙蛙花特殊形态测试", "pokemon")},
];

export const mainMenuDiscoveryPreviewCards: MainMenuDexCard[] = [
  {id: "item-leftovers", label: "吃剩的东西", eyebrow: "随机道具", category: "items", entry: previewDexEntry("leftovers", "Leftovers", "吃剩的东西", "items"), shopItem: previewShopItem("leftovers", "Leftovers", "吃剩的东西")},
  {id: "pokemon-eevee", label: "伊布", eyebrow: "随机宝可梦", category: "pokemon", entry: previewDexEntry("eevee", "Eevee", "伊布", "pokemon")},
  {id: "tm-thunderbolt", label: "十万伏特", eyebrow: "技能机器", category: "moves", entry: previewDexEntry("thunderbolt", "Thunderbolt", "十万伏特", "moves")},
  {id: "ability-intimidate", label: "威吓", eyebrow: "随机特性", category: "abilities", entry: previewDexEntry("intimidate", "Intimidate", "威吓", "abilities")},
];

export const mainMenuLongDiscoveryPreviewCards: MainMenuDexCard[] = [
  {id: "item-long", label: "名字非常长的随机道具测试", eyebrow: "随机道具标签很长", category: "items", entry: previewDexEntry("long-item", "Long Item", "名字非常长的随机道具测试", "items"), shopItem: previewShopItem("long-item", "Long Item", "名字非常长的随机道具测试")},
  {id: "pokemon-long", label: "名字非常长的随机宝可梦", eyebrow: "随机宝可梦", category: "pokemon", entry: previewDexEntry("long-pokemon", "Long Pokemon", "名字非常长的随机宝可梦", "pokemon")},
  {id: "tm-long", label: "超长技能机器名字测试", eyebrow: "技能机器", category: "moves", entry: previewDexEntry("long-move", "Long Move", "超长技能机器名字测试", "moves")},
  {id: "ability-long", label: "很长很长的特性名字", eyebrow: "随机特性", category: "abilities", entry: previewDexEntry("long-ability", "Long Ability", "很长很长的特性名字", "abilities")},
];
