import type {CSSProperties} from "react";
import type {BagCategoryView, BagItemView, BattleRecordEntry, BattleSetting, BattleTurnPokemonState, BattleTurnRecord, DesktopDexEntry, LocalSave, MoveSummary, NightSkyRow, PlayerPokemonState, RentalPokemon, RestEventOption, RestState, ResultSummaryState, ShopItem, ShopOffer, SpriteMapEntry, StarterChoiceState, StarterItemGroup, StarterItemGroupState, TalentView, TrainerCatalogState} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
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

export const battleSettingPreviewSetting: BattleSetting = normalizeBattleSetting(DEFAULT_BATTLE_SETTING);

export const battleSettingMinRegionsPreviewSetting: BattleSetting = normalizeBattleSetting({
  allowed_generations: [1, 2, 3],
  battle_rule_preset: "none",
  legendary_battle: false,
});

export const battleSettingGen9PreviewSetting: BattleSetting = normalizeBattleSetting({
  allowed_generations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  battle_rule_preset: "gen9",
  legendary_battle: true,
});

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

export const dexPreviewMoves: MoveSummary[] = [
  {id: "thunderbolt", name: "Thunderbolt", name_zh: "十万伏特", type: "Electric", type_zh: "电", category: "special", category_zh: "特殊", power: 90, accuracy: 100, pp: 15, priority: 0, short_desc: "Preview move.", short_desc_zh: "预览技能。", desc: "Preview move.", desc_zh: "预览技能。", learn_sources: ["levelup", "machine"]},
  {id: "airslash", name: "Air Slash", name_zh: "空气斩", type: "Flying", type_zh: "飞行", category: "special", category_zh: "特殊", power: 75, accuracy: 95, pp: 15, priority: 0, short_desc: "Preview move.", short_desc_zh: "预览技能。", desc: "Preview move.", desc_zh: "预览技能。", learn_sources: ["egg"]},
  {id: "superlongpreviewmove", name: "Super Long Preview Move", name_zh: "非常非常长的技能名称测试极限版", type: "Psychic", type_zh: "超能力", category: "status", category_zh: "变化", power: 0, accuracy: null, pp: 5, priority: 0, short_desc: "Long preview move.", short_desc_zh: "很长的预览技能。", desc: "Long preview move.", desc_zh: "很长的预览技能。", learn_sources: ["event"]},
];

export const dexPreviewPokemon: DesktopDexEntry = {
  id: "pikachu",
  name: "Pikachu",
  name_zh: "皮卡丘",
  category: "pokemon",
  desc_zh: "组件预览宝可梦。",
  types: ["Electric"],
  types_zh: ["电"],
  sprite: {
    species_id: "pikachu",
    name: "Pikachu",
    national_dex: 25,
    sprite_index: 25,
    base_species: "pikachu",
    forme: "",
    confidence: "component-gallery-preview",
    source: "component-gallery-preview",
    paths: {front_normal: "assets/pokemon-showdown/gen5/pikachu.png", back_normal: "assets/pokemon-showdown/gen5-back/pikachu.png", front_shiny: "assets/pokemon-showdown/gen5/pikachu.png", back_shiny: "assets/pokemon-showdown/gen5-back/pikachu.png", front_normal_full: "assets/pokemon-showdown/gen5/pikachu.png", front_shiny_full: "assets/pokemon-showdown/gen5/pikachu.png"},
  },
  base_stats: {hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90},
  heightm: 0.4,
  weightkg: 6,
  gender_ratio: {M: 0.5, F: 0.5},
  abilities: [
    {id: "static", name: "Static", name_zh: "静电", desc_zh: "受到接触攻击时可能麻痹对手。"},
    {id: "lightningrod", name: "Lightning Rod", name_zh: "避雷针", desc_zh: "吸收电属性招式并提升特攻。", hidden: true},
  ],
  learnset: dexPreviewMoves,
  usage_count: 42,
};

export const dexPreviewLongPokemon: DesktopDexEntry = {
  ...dexPreviewPokemon,
  id: "long-pokemon-preview",
  name: "Very Long Preview Pokemon Forme",
  name_zh: "非常非常长的宝可梦形态名称测试",
  desc_zh: "这是一段非常长的宝可梦说明，用来确认图鉴详情内部滚动稳定，不会撑破 640×320 的窗口布局。",
};

export const dexPreviewMove: DesktopDexEntry = {
  id: "hurricane",
  name: "Hurricane",
  name_zh: "暴风",
  category: "moves",
  desc_zh: "用强烈的风席卷对手进行攻击，有时会使目标混乱。",
  type: "Flying",
  type_zh: "飞行",
  move_category: "Special",
  move_category_zh: "特殊",
  power: 110,
  accuracy: 70,
  pp: 10,
  priority: 0,
};

export const dexPreviewItem: DesktopDexEntry = {
  id: "leftovers",
  name: "Leftovers",
  name_zh: "吃剩的东西",
  category: "items",
  desc_zh: "携带后每回合回复少量 HP。用于检查道具说明长文本在详情面板中的展示。",
  icon_asset: "",
};

export const dexPreviewAbility: DesktopDexEntry = {
  id: "intimidate",
  name: "Intimidate",
  name_zh: "威吓",
  category: "abilities",
  desc_zh: "出场时降低对手的攻击。双打或特殊规则下仍按当前运行时规则结算。",
};

export const talentPreviewCatalog: TalentView[] = [
  {id: "root_trainer_star", name: "训练家星图", category: "核心", desc: "星图核心，默认点亮。", level: 1, max_level: 1, kind: "root", x: 0, y: 0},
  {id: "starter_angel_fund", name: "天使基金", category: "开局筹备", desc: "开局获得额外金币，提前获得运营空间。", level: 2, max_level: 3, costs: [20, 35, 50], effects: ["开局金币 +400。", "开局金币 +700。", "开局金币 +1000。"], requires: [{id: "root_trainer_star"}], x: -250, y: -105},
  {id: "gear_bag", name: "整备背包", category: "整备器械", desc: "提升道具携带空间。", level: 0, max_level: 2, costs: [25, 45], effects: ["背包格 +1。", "背包格 +2。"], requires: [{id: "root_trainer_star"}], x: 230, y: -110},
  {id: "intel_god_eye", name: "洞察之眼", category: "情报规划", desc: "查看候选宝可梦训练情况。", level: 3, max_level: 3, costs: [30, 45, 60], effects: ["显示部分训练信息。", "显示更多训练信息。", "完全显示训练信息。"], requires: [{id: "root_trainer_star"}], x: -130, y: 205},
  {id: "exchange_trust", name: "不负信赖", category: "交换筑队", desc: "交换阶段可以保留更多选择权。", level: 0, max_level: 3, cost: 30, requires: [{id: "gear_bag", level: 1}], x: 365, y: 120},
  {id: "growth_more_choices", name: "顺手牵羊", category: "养成改造", desc: "商店和招式抽取时给出更多候选。", level: 1, max_level: 4, costs: [20, 35, 50, 65], requires: [{id: "intel_god_eye", level: 1}], x: -360, y: 175},
  {id: "economy_amulet_coin", name: "护符金币", category: "经济运营", desc: "结算时提升 BP 与金币收益。", level: 0, max_level: 3, cost: 28, requires: [{id: "starter_angel_fund", level: 2}], x: -430, y: -250},
  {id: "event_preview_meteor", name: "很长很长的奇遇预览节点名字", category: "奇遇预留", desc: "后续奇遇池预留节点，用于检查超长标题和说明文字在抽屉内的滚动表现。", level: 0, max_level: 1, kind: "event_preview", disabled: true, effects: ["后续开放。"], requires: [{id: "root_trainer_star"}], x: 410, y: -245},
];

export const talentLockedPreviewCatalog: TalentView[] = talentPreviewCatalog.map(node => node.kind === "root" ? node : {...node, level: 0});

const historySpriteDex: Record<string, number> = {
  pikachu: 25,
  charizard: 6,
  venusaur: 3,
  blastoise: 9,
  gengar: 94,
  dragonite: 149,
  garchomp: 445,
  lucario: 448,
  gardevoir: 282,
  metagross: 376,
  gyarados: 130,
  sylveon: 700,
};

function previewPokemonSprite(id: string, name: string): SpriteMapEntry {
  const front = `assets/pokemon-showdown/gen5/${id}.png`;
  const back = `assets/pokemon-showdown/gen5-back/${id}.png`;
  return {
    species_id: id,
    name,
    national_dex: historySpriteDex[id] || 0,
    sprite_index: historySpriteDex[id] || 0,
    base_species: id,
    forme: "",
    confidence: "component-gallery-preview",
    source: "component-gallery-preview",
    paths: {
      front_normal: front,
      back_normal: back,
      front_shiny: front,
      back_shiny: back,
      front_normal_full: front,
      front_shiny_full: front,
    },
  };
}

function previewPokemon(id: string, nameZh: string, typesZh: string[] = ["一般"]): RentalPokemon {
  const moves: MoveSummary[] = [
    {id: `${id}-strike`, name: "Preview Strike", name_zh: "预览打击", type: "Normal", type_zh: "一般", category: "Physical", category_zh: "物理", power: 80, accuracy: 100, pp: 15, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: "稳定输出技能。"},
    {id: `${id}-blast`, name: "Preview Blast", name_zh: "预览光束", type: "Fire", type_zh: "火", category: "Special", category_zh: "特殊", power: 95, accuracy: 90, pp: 10, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: "用于检查技能列表滚动的长说明文本。"},
  ];
  return {
    run_member_id: `preview-${id}`,
    showdown_id: id,
    name: id,
    species: id,
    species_zh: nameZh,
    species_id: id,
    level: 50,
    gender: "",
    types: typesZh.map(type => type.toLowerCase()),
    types_zh: typesZh,
    ability: "preview",
    ability_zh: "预览特性",
    ability_id: "preview",
    ability_desc: "",
    ability_desc_zh: "组件预览用特性。",
    item: "",
    item_zh: "无道具",
    item_id: "",
    item_desc: "",
    item_desc_zh: "",
    moves,
    base_stats: {hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80},
    stats: {hp: 155, atk: 100, def: 100, spa: 100, spd: 100, spe: 100},
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
    ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    nature: "Hardy",
    nature_zh: "勤奋",
    nature_plus: "",
    nature_minus: "",
    role: "preview",
    role_zh: "预览",
    sprite: previewPokemonSprite(id, id),
  };
}

function rentalPreviewPokemon(id: string, nameZh: string, typesZh: string[], extra: Partial<RentalPokemon> = {}): RentalPokemon {
  return {
    ...previewPokemon(id, nameZh, typesZh),
    item_zh: "讲究围巾",
    item: "choicescarf",
    item_id: "choicescarf",
    nature_zh: "爽朗",
    nature: "Jolly",
    role_zh: "高速输出",
    role: "sweeper",
    ...extra,
  };
}

export const rentalPreviewCandidates: RentalPokemon[] = [
  rentalPreviewPokemon("pikachu", "皮卡丘", ["电"], {item_zh: "电气球"}),
  rentalPreviewPokemon("charizard", "喷火龙", ["火", "飞行"], {item_zh: "喷火龙进化石X", item_battle_system: "mega"}),
  rentalPreviewPokemon("venusaur", "妙蛙花", ["草", "毒"], {item_zh: "突击背心"}),
  rentalPreviewPokemon("blastoise", "水箭龟", ["水"], {item_zh: "水Z", item_battle_system: "zmove"}),
  rentalPreviewPokemon("gengar", "耿鬼", ["幽灵", "毒"], {is_mythical: true, item_zh: "气势披带"}),
  rentalPreviewPokemon("dragonite", "快龙", ["龙", "飞行"], {is_legendary: true, item_zh: "弱点保险"}),
  rentalPreviewPokemon("garchomp", "烈咬陆鲨", ["龙", "地面"], {item_zh: "生命宝珠"}),
  rentalPreviewPokemon("lucario", "路卡利欧", ["格斗", "钢"], {item_zh: "极巨腕带", item_battle_system: "dynamax"}),
  rentalPreviewPokemon("gardevoir", "沙奈朵", ["超能力", "妖精"], {item_zh: "太晶珠", item_battle_system: "terastal"}),
  rentalPreviewPokemon("metagross", "巨金怪", ["钢", "超能力"], {item_zh: "金属膜"}),
  rentalPreviewPokemon("gyarados", "暴鲤龙", ["水", "飞行"], {item_zh: "文柚果"}),
  rentalPreviewPokemon("sylveon", "名字非常非常长的仙子伊布候选测试", ["妖精"], {item_zh: "博识眼镜"}),
];

export const rentalPreviewLongCandidates: RentalPokemon[] = rentalPreviewCandidates.map((pokemon, index) => index === 0
  ? {...pokemon, species_zh: "名字超级超级长的租赁候选宝可梦测试", item_zh: "名字也很长的特殊携带道具测试"}
  : pokemon);

function restPreviewMoves(id: string, longText = false): MoveSummary[] {
  return [
    {id: `${id}-thunderbolt`, name: "Thunderbolt", name_zh: longText ? "名字非常非常长的十万伏特强化测试" : "十万伏特", type: "Electric", type_zh: "电", category: "Special", category_zh: "特殊", power: 90, accuracy: 100, pp: 15, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: "稳定特殊输出。"},
    {id: `${id}-quick-attack`, name: "Quick Attack", name_zh: "电光一闪", type: "Normal", type_zh: "一般", category: "Physical", category_zh: "物理", power: 40, accuracy: 100, pp: 30, priority: 1, short_desc: "", short_desc_zh: "", desc: "", desc_zh: "先制攻击，用于收尾。"},
    {id: `${id}-grass-knot`, name: "Grass Knot", name_zh: "打草结", type: "Grass", type_zh: "草", category: "Special", category_zh: "特殊", power: 80, accuracy: 100, pp: 20, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: "根据目标体重变化威力。"},
    {id: `${id}-protect`, name: "Protect", name_zh: "守住", type: "Normal", type_zh: "一般", category: "Status", category_zh: "变化", power: 0, accuracy: 0, pp: 10, priority: 4, short_desc: "", short_desc_zh: "", desc: "", desc_zh: "防住大多数攻击。"},
  ];
}

function restPreviewPokemon(id: string, nameZh: string, typesZh: string[], extra: Partial<RentalPokemon> = {}, longMoves = false): RentalPokemon {
  return {
    ...rentalPreviewPokemon(id, nameZh, typesZh, extra),
    moves: restPreviewMoves(id, longMoves),
  };
}

function restPreviewPlayerState(pokemon: RentalPokemon, index: number, condition: string, ppScale = 1): PlayerPokemonState {
  const hp = Number(condition.match(/^(\d+)/)?.[1] || 100);
  return {
    run_member_id: pokemon.run_member_id || `preview-rest-${index}`,
    showdown_id: pokemon.showdown_id || pokemon.species_id,
    slot: index + 1,
    ident: `p1: ${pokemon.species}`,
    details: `${pokemon.species}, L${pokemon.level}`,
    species: pokemon.species,
    hp,
    maxhp: 100,
    status: condition.includes(" slp") ? "slp" : condition.includes(" par") ? "par" : condition.includes(" psn") ? "psn" : "",
    fainted: condition.includes("fnt") || hp <= 0,
    active: index === 0,
    item: pokemon.item || "",
    condition,
    moves: pokemon.moves.map((move, moveIndex) => ({slot: moveIndex + 1, id: move.id, move: move.name, pp: Math.max(0, Math.floor((move.pp || 10) * ppScale)), maxpp: move.pp || 10})),
  };
}

function restPreviewState(team: RentalPokemon[], conditions: string[], ppScale = 1): RestState {
  const bagCategories = createBagPreviewCategories();
  return {
    battle_no: 3,
    battles: 7,
    wins: 2,
    battle_points: 268,
    coins: 420,
    player_display: team,
    enemy_display: rentalPreviewCandidates.slice(3, 6),
    player_state: team.map((pokemon, index) => restPreviewPlayerState(pokemon, index, conditions[index] || "100/100", ppScale)),
    bag_items: Object.fromEntries(Object.values(bagCategories).flat().map(item => [item.id, item.count])),
    bag_categories: bagCategories,
    talents: [],
    shop: {roll_count: 1, next_roll_cost: 20, slot_count: 3, offers: [], purchased_offer_id: null, purchased_offer_counts: {}, purchased_item_counts: {}},
    night_sky: {rows: createNightSkyPreviewRows("normal")},
    rest_event: {required: true, options: createRestEventPreviewOptions("normal")},
    taken_enemy_slots: [],
    exchange_count: 0,
    costs: {exchange: 0, restore_hp: {1: 20, 2: 30, 3: 40}, restore_pp: {1: 20, 2: 30, 3: 40}, restore_status: {1: 20, 2: 30, 3: 40}, adjust_stats: 100, randomize_part: 50, randomize_all: 150, move_draw: 100, scout_basic: 50, scout_one: 100, scout_all: 200},
  };
}

export function createBagPreviewCategories(): BagCategoryView {
  return {
    consumable: [
      {id: "potion", name: "Potion", name_zh: "伤药", count: 3, category: "consumable", cost: 20, desc_zh: "回复少量 HP。"},
      {id: "antidote", name: "Antidote", name_zh: "解毒药", count: 2, category: "consumable", cost: 20, desc_zh: "治愈一只宝可梦的中毒状态。"},
      {id: "maxpotion", name: "Max Potion", name_zh: "全满药", count: 0, category: "consumable", cost: 250, desc_zh: "完全回复 HP。用于检查无库存道具。"},
      {id: "hpup", name: "HP Up", name_zh: "HP 增强剂", count: 1, category: "consumable", cost: 9800, desc_zh: "提高一只宝可梦的 HP 基础点数。"},
      {id: "long-name-consumable", name: "Very Long Potion Name", name_zh: "名字非常非常长的恢复道具测试样本", count: 12, category: "consumable", cost: 20, desc_zh: "这段说明很长，用来检查详情面板内部换行，不应该进入左侧列表，也不应该撑破右侧操作区。"},
    ],
    held: [
      {id: "leftovers", name: "Leftovers", name_zh: "剩饭", count: 2, category: "held", cost: 4000, desc_zh: "携带后每回合少量回复 HP。"},
      {id: "charizarditex", name: "Charizardite X", name_zh: "喷火龙进化石X", count: 1, category: "held", item_battle_system: "mega", cost: 8000, desc_zh: "喷火龙携带后可以 Mega 进化。"},
      {id: "firiumz", name: "Firium Z", name_zh: "火 Z", count: 1, category: "held", item_battle_system: "zmove", cost: 6000, desc_zh: "火属性 Z 纯晶。"},
    ],
    tm: [
      {id: "tm:thunderbolt", name: "TM Thunderbolt", name_zh: "技能机器 十万伏特", count: 1, category: "tm", move_id: "thunderbolt", move_name: "Thunderbolt", move_name_zh: "十万伏特", move_type: "Electric", move_type_zh: "电", desc_zh: "向对手发出强力电击进行攻击，有时会让对手麻痹。"},
      {id: "tm:flamethrower", name: "TM Flamethrower", name_zh: "技能机器 喷射火焰", count: 0, category: "tm", move_id: "flamethrower", move_name: "Flamethrower", move_name_zh: "喷射火焰", move_type: "Fire", move_type_zh: "火", desc_zh: "发射烈焰攻击。用于检查无库存技能机器。"},
    ],
  };
}

export const bagPreviewItems: BagItemView[] = Object.values(createBagPreviewCategories()).flat();

export const restPreviewTeam = [
  restPreviewPokemon("pikachu", "皮卡丘", ["电"], {item_zh: "电气球", item: "lightball", item_id: "lightball", item_desc_zh: "皮卡丘携带后攻击和特攻提升。"}),
  restPreviewPokemon("charizard", "喷火龙", ["火", "飞行"], {item_zh: "喷火龙进化石X", item: "charizarditex", item_id: "charizarditex", item_battle_system: "mega"}),
  restPreviewPokemon("venusaur", "妙蛙花", ["草", "毒"], {item_zh: "突击背心", item: "assaultvest", item_id: "assaultvest"}),
];

export const restPreviewSixTeam = [
  ...restPreviewTeam,
  restPreviewPokemon("blastoise", "水箭龟", ["水"], {item_zh: "文柚果", item: "sitrusberry", item_id: "sitrusberry"}),
  restPreviewPokemon("gengar", "耿鬼", ["幽灵", "毒"], {item_zh: "气势披带", item: "focussash", item_id: "focussash"}),
  restPreviewPokemon("dragonite", "快龙", ["龙", "飞行"], {item_zh: "弱点保险", item: "weaknesspolicy", item_id: "weaknesspolicy"}),
];

export const restPreviewLongTeam = [
  restPreviewPokemon("sylveon", "名字非常非常长的仙子伊布队伍展示测试", ["妖精"], {item_zh: "名字同样非常非常长的携带道具展示测试", item: "wiseglasses", item_id: "wiseglasses", ability_zh: "很长很长的预览特性名称测试", ability_desc_zh: "这是一段很长的特性说明，用于检查详情面板内部滚动和文本换行，不应该撑破 640x320 的工具区。"}, true),
  ...restPreviewTeam.slice(1),
];

export const restPreviewStateNormal = restPreviewState(restPreviewTeam, ["88/100", "100/100", "76/100"]);
export const restPreviewStateSix = restPreviewState(restPreviewSixTeam, ["88/100", "100/100", "76/100", "66/100", "52/100 par", "100/100"]);
export const restPreviewStateLowHp = restPreviewState(restPreviewSixTeam, ["18/100", "0 fnt", "44/100 slp", "66/100", "52/100 par", "100/100"], 0.2);
export const restPreviewStateLong = restPreviewState(restPreviewLongTeam, ["72/100 psn", "100/100", "76/100"], 0.35);

export function restEventStateForPreview(stateId: string): RestState {
  return {
    ...restPreviewStateNormal,
    rest_event: {required: true, options: createRestEventPreviewOptions(stateId)},
  };
}

export function nightSkyStateForPreview(stateId: string): RestState {
  return {
    ...restPreviewStateNormal,
    battle_no: stateId === "revealed" ? 2 : 1,
    talents: stateId === "hiddenTrainer" ? [] : [
      {id: "intel_rumor", name: "小道消息", category: "intel", desc: "预览中允许揭示未来对手。", level: 3, cost: 0},
      {id: "intel_reroute", name: "公子驾到", category: "intel", desc: "预览中允许更换未来对手。", level: 1, cost: 0},
    ],
    night_sky: {rows: stateId === "empty" ? [] : createNightSkyPreviewRows(stateId)},
  };
}

function createRestEventPreviewOptions(stateId: string): RestEventOption[] {
  const longText = "这是一段非常长的事件描述，用来检查休整奇遇卡片内部滚动和文本换行。它应该停留在卡片内部，不撑破 640 x 320 的游戏画布，也不影响其它事件卡的高度。";
  const options: RestEventOption[] = [
    {id: "rest-preview-safe", name: "温和补给", tone: "safe", desc: "获得稳定补给。", intro: "联盟补给员留下了一份可靠的治疗包。", effects: ["获得少量金币。", "随机回复一名队员的 HP。"]},
    {id: "rest-preview-trade", name: "以物易物", tone: "trade", desc: "交换一件道具。", intro: "旅行商希望用稀有材料换走你的普通道具。", effects: ["失去一个低价值道具。", "获得一个随机携带物。"]},
    {id: "rest-preview-risk", name: "危险捷径", tone: "risk", desc: "冒险换取奖励。", intro: stateId === "longText" ? longText : "你发现了一条危险但诱人的近路。", effects: stateId === "longText" ? [longText, "下一场胜利时金币奖励提高。"] : ["下一场敌方等级提高。", "胜利后获得额外金币。"]},
  ];
  return stateId === "manyOptions" ? [...options, {id: "rest-preview-extra", name: "额外委托", tone: "safe", desc: "额外事件预览。", intro: "用于检查多事件选项时的布局稳定性。", effects: ["不会访问 runtime。"]}] : options;
}

function createNightSkyPreviewRows(stateId: string): NightSkyRow[] {
  return Array.from({length: 7}, (_value, index) => {
    const battleNo = index + 1;
    const hidden = stateId === "hiddenTrainer" && index >= 2;
    const revealed = stateId === "revealed" || index < 2 ? 3 : index === 2 ? 1 : 0;
    const unlocked = stateId === "revealed" || revealed >= 3;
    const enemies = rentalPreviewCandidates.slice(index % 4, index % 4 + 3);
    return {
      battle_no: battleNo,
      label: battleNo === 7 ? "最终战" : stateId === "longText" ? "名字很长的预览路线训练师挑战" : "挑战",
      trainer: {id: `preview-trainer-${index}`, type: battleNo === 7 ? "champion" : "normal", name_zh: battleNo === 7 ? "预览冠军" : "预览训练师"},
      trainer_visible: !hidden,
      encountered: battleNo <= 1,
      revealed,
      unlocked,
      enemies: enemies.map((enemy, enemyIndex) => enemyIndex < revealed ? enemy : null),
    };
  });
}

export const dexPreviewTrainerUnlocked: DesktopDexEntry = {
  id: "trainer-cynthia",
  name: "Cynthia",
  name_zh: "竹兰",
  category: "trainers",
  desc_zh: "神奥冠军。",
  unlocked: true,
  trainer: {id: "cynthia", type: "champion", region: "神奥", role: "冠军", name_zh: "竹兰", name_en: "Cynthia", front_asset: "trainers/front/cynthia.png", front_gif_asset: "trainers/front/cynthia.gif", avatar_asset: "trainers/avatars/cynthia.png"},
  trainer_tags: ["冠军", "神奥", "特殊事件"],
  boss_summary: "以烈咬陆鲨为核心的高压冠军队伍，擅长多属性联防和终盘清场。",
  boss_record: {encounters: 5, completed: 4, wins: 2, losses: 2, last_result: "win", seen_pool_slots: ["1-0", "1-1"], seen_pokemon: {}},
  boss_pool_rows: [
    {
      team_index: 1,
      slots: [
        {key: "1-0", team_index: 1, slot: 0, species_id: "garchomp", unlocked: true, pokemon: previewPokemon("garchomp", "烈咬陆鲨", ["龙", "地面"])},
        {key: "1-1", team_index: 1, slot: 1, species_id: "milotic", unlocked: true, pokemon: previewPokemon("milotic", "美纳斯", ["水"])},
        {key: "1-2", team_index: 1, slot: 2, species_id: "spiritomb", unlocked: false},
      ],
    },
  ],
};

export const dexPreviewTrainerLocked: DesktopDexEntry = {
  id: "trainer-unknown",
  name: "Unknown Trainer",
  name_zh: "未知训练师",
  category: "trainers",
  desc_zh: "尚未遭遇。遇到后才会显示真实身份、头像和特殊事件标签。",
  unlocked: false,
  trainer_tags: ["未知"],
  boss_record: {encounters: 0, completed: 0, wins: 0, losses: 0, last_result: null, seen_pool_slots: [], seen_pokemon: {}},
};

export const dexPreviewEntries: DesktopDexEntry[] = [
  dexPreviewPokemon,
  dexPreviewLongPokemon,
  dexPreviewMove,
  dexPreviewItem,
  dexPreviewAbility,
  dexPreviewTrainerUnlocked,
  dexPreviewTrainerLocked,
];

const historyPreviewTeam = [
  previewPokemon("pikachu", "皮卡丘", ["电"]),
  previewPokemon("charizard", "喷火龙", ["火", "飞行"]),
  previewPokemon("venusaur", "妙蛙花", ["草", "毒"]),
  previewPokemon("blastoise", "水箭龟", ["水"]),
  previewPokemon("gengar", "耿鬼", ["幽灵", "毒"]),
  previewPokemon("dragonite", "快龙", ["龙", "飞行"]),
];

function historySummary(outcome: ResultSummaryState["outcome"], headline: string, subtitle: string, team = historyPreviewTeam): ResultSummaryState {
  return {
    outcome,
    headline,
    subtitle,
    run_seed: 260614,
    total_battles: 7,
    rows: [
      {label: "连胜", value: outcome === "win" ? "7" : outcome === "loss" ? "5" : "3"},
      {label: "BP", value: outcome === "win" ? "+48 BP" : "+12 BP"},
      {label: "金币", value: outcome === "win" ? "+2400 金币" : "+600 金币"},
    ],
    bp_rows: [{label: "BP", value: outcome === "win" ? "+48 BP" : "+12 BP"}],
    coin_rows: [{label: "金币", value: outcome === "win" ? "+2400 金币" : "+600 金币"}],
    used_pokemon: team.map((pokemon, index) => ({
      pokemon,
      kills: index + 1,
      deaths: index > 3 ? 1 : 0,
      assists: index,
      damage_dealt: 1200 - index * 120,
      damage_taken: 500 + index * 80,
    })),
    progress: Array.from({length: 7}, (_value, index) => {
      const battleNo = index + 1;
      return {
        battle_no: battleNo,
        label: battleNo === 7 ? "最终战" : battleNo === 3 ? "馆主战" : "挑战",
        outcome: outcome === "win" || battleNo <= 5 ? "win" : battleNo === 6 ? outcome : "pending",
      };
    }),
    player_team: team,
  };
}

function previewTurnPokemon(pokemon: RentalPokemon, slot: number, active = false, fainted = false): BattleTurnPokemonState {
  return {
    slot,
    name: pokemon.species_zh || pokemon.name,
    species_id: pokemon.species_id,
    showdown_id: pokemon.showdown_id,
    hp: fainted ? 0 : 88 - slot * 8,
    max_hp: 100,
    hp_text: `${fainted ? 0 : 88 - slot * 8}/100`,
    active,
    status: fainted ? "" : slot === 1 ? "par" : "",
    fainted,
  };
}

function previewTurnRecord(id: string, turn: number, summary: string): BattleTurnRecord {
  return {
    id,
    turn,
    title: turn ? `第 ${turn} 回合` : "开局站位",
    summary,
    player_action: {side: "p1", kind: "move", label: turn ? "十万伏特" : "首发确认"},
    enemy_action: {side: "p2", kind: "move", label: turn ? "地震" : "对手首发"},
    result_tags: turn % 2 ? ["有效打击"] : ["轮换"],
    event_texts: [summary],
    end_state: {
      player_team: historyPreviewTeam.slice(0, 3).map((pokemon, index) => previewTurnPokemon(pokemon, index + 1, index === 0, turn > 2 && index === 2)),
      enemy_team: historyPreviewTeam.slice(3, 6).map((pokemon, index) => previewTurnPokemon(pokemon, index + 1, index === 0, turn > 1 && index === 1)),
      weather: "",
      field: [],
      side_conditions: {p1: [], p2: []},
    },
  };
}

function historyRecord(id: string, outcome: BattleRecordEntry["outcome"], createdAt: string, headline: string, subtitle: string, team = historyPreviewTeam): BattleRecordEntry {
  return {
    id,
    created_at: createdAt,
    run_seed: 260614,
    battle_no: outcome === "win" ? 7 : outcome === "loss" ? 6 : 4,
    total_battles: 7,
    outcome,
    winner: outcome === "win" ? "Player" : outcome,
    message: headline,
    player_team: team,
    enemy_team: [],
    result_summary: historySummary(outcome, headline, subtitle, team),
  };
}

export const battleHistoryPreviewRecords: BattleRecordEntry[] = [
  historyRecord("preview-run-win", "win", "2026-06-14T09:12:00.000Z", "冠军路线通关", "7/7 场 · 已通关"),
  historyRecord("preview-run-loss", "loss", "2026-06-13T20:45:00.000Z", "败给最终战前的强敌", "6/7 场 · 挑战失败", historyPreviewTeam.slice(0, 4)),
  historyRecord("preview-run-abort", "abort", "2026-06-12T18:20:00.000Z", "中途撤退的挑战", "4/7 场 · 已中断", []),
];

export const battleHistoryLongPreviewRecords: BattleRecordEntry[] = [
  historyRecord(
    "preview-run-long",
    "win",
    "2026-06-14T10:30:00.000Z",
    "这是一条非常非常长的整局挑战结算标题用于检查省略表现",
    "这段副标题同样很长，用来确认列表行、右侧摘要和按钮区域不会被撑破。"
  ),
  ...battleHistoryPreviewRecords,
];

export const battleHistoryManyPreviewRecords: BattleRecordEntry[] = Array.from({length: 12}, (_value, index) => {
  const base = battleHistoryPreviewRecords[index % battleHistoryPreviewRecords.length];
  return {
    ...base,
    id: `${base.id}-${index}`,
    created_at: `2026-06-${String(14 - Math.floor(index / 2)).padStart(2, "0")}T${String(9 + index).padStart(2, "0")}:12:00.000Z`,
    message: `${base.message} #${index + 1}`,
    result_summary: base.result_summary ? {...base.result_summary, headline: `${base.result_summary.headline} #${index + 1}`} : undefined,
  };
});

export const resultPreviewSummary = historySummary("win", "冠军路线通关", "7/7 场 · 已通关 · 本局奖励已写入训练师记录");

export const resultLossPreviewSummary = historySummary("loss", "惜败最终战", "6/7 场 · 挑战失败，保留本局已获得奖励", historyPreviewTeam.slice(0, 4));

export const resultAbortPreviewSummary = historySummary("abort", "中途撤退", "4/7 场 · 已中断", historyPreviewTeam.slice(0, 2));

export const resultLongPreviewSummary: ResultSummaryState = {
  ...historySummary("win", "这是一条非常非常长的结算标题用于检查顶部区域省略表现", "这段副标题同样很长，用来确认结算页标题栏不会把返回按钮挤出 640x320 视口。"),
  coin_rows: [
    {label: "基础金币奖励非常长", value: "+2400 金币", detail: "长说明测试：包含天赋、连胜、事件奖励后仍必须省略。"},
    {label: "额外事件金币奖励", value: "+800 金币", detail: "预览长文本。"},
  ],
};

export const resultEmptyPreviewSummary: ResultSummaryState = {
  outcome: "abort",
  headline: "暂无结算数据",
  subtitle: "用于检查空队伍和空进度表现。",
  rows: [{label: "结算说明", value: "无变动"}],
  coin_rows: [],
  used_pokemon: [],
  progress: [],
};

export const resultPreviewRecordWithTurns: BattleRecordEntry = {
  ...historyRecord("preview-result-turns", "win", "2026-06-14T12:00:00.000Z", "冠军路线通关", "7/7 场 · 已通关"),
  battle_no: 7,
  turn_records: [
    previewTurnRecord("preview-turn-start", 0, "双方完成首发站位，皮卡丘面对水箭龟。"),
    previewTurnRecord("preview-turn-1", 1, "皮卡丘使用十万伏特造成有效打击，对手回合使用地震压低血量。"),
    previewTurnRecord("preview-turn-2", 2, "玩家换入妙蛙花吃下关键攻击，并准备终盘清场。"),
  ],
};

export const resultPreviewRecordNoTurns: BattleRecordEntry = {
  ...historyRecord("preview-result-no-turns", "loss", "2026-06-14T12:30:00.000Z", "惜败最终战", "6/7 场 · 挑战失败"),
  battle_no: 6,
  turn_records: [],
};

const starterPreviewGroups: Array<{id: StarterItemGroup; name: string}> = [
  {id: "recovery", name: "恢复道具"},
  {id: "berry", name: "树果"},
  {id: "tm", name: "技能机器"},
  {id: "battle", name: "战斗道具"},
];

function starterPreviewOffer(group: StarterItemGroup, index: number, name: string, category: ShopOffer["category"], desc = "预览用开局道具说明。"): ShopOffer {
  return {
    id: `${group}-${index}`,
    offer_id: `preview-${group}-${index}`,
    name,
    name_zh: name,
    desc,
    desc_zh: desc,
    cost: 0,
    category,
    source: "starter",
    starter_group: group,
    starter_group_label: starterPreviewGroups.find(entry => entry.id === group)?.name,
    item_tier: index + 1,
    icon_asset: "",
  };
}

function starterPreviewGroup(group: StarterItemGroup, name: string, offers: ShopOffer[], purchasedOfferIds: string[] = []): StarterItemGroupState {
  return {
    id: group,
    name,
    quality_level: 2,
    quantity_level: 1,
    max_quality_level: 3,
    max_quantity_level: 3,
    offers,
    purchased_offer_id: purchasedOfferIds[0] || null,
    purchased_offer_ids: purchasedOfferIds,
  };
}

const starterRecoveryOffers = [
  starterPreviewOffer("recovery", 0, "伤药", "consumable", "恢复少量 HP，适合前期兜底。"),
  starterPreviewOffer("recovery", 1, "好伤药", "consumable", "恢复更多 HP，稳定挑战节奏。"),
  starterPreviewOffer("recovery", 2, "全满药", "consumable", "完全恢复 HP。"),
  starterPreviewOffer("recovery", 3, "名字非常非常长的恢复道具测试", "consumable", "用于检查长道具名和长说明是否在组件内部省略或滚动。"),
];

const starterBerryOffers = [
  starterPreviewOffer("berry", 0, "文柚果", "held", "低血量时恢复 HP。"),
  starterPreviewOffer("berry", 1, "木子果", "held", "解除异常状态。"),
  starterPreviewOffer("berry", 2, "抗火果", "held", "降低一次火属性伤害。"),
  starterPreviewOffer("berry", 3, "抗冰果", "held", "降低一次冰属性伤害。"),
];

const starterTmOffers = [
  starterPreviewOffer("tm", 0, "十万伏特", "tm", "技能机器，提供稳定特殊输出。"),
  starterPreviewOffer("tm", 1, "急速折返", "tm", "技能机器，攻击后交换。"),
  starterPreviewOffer("tm", 2, "冥想", "tm", "技能机器，提升特攻与特防。"),
  starterPreviewOffer("tm", 3, "尖石攻击", "tm", "技能机器，高威力岩石物理攻击。"),
];

const starterBattleOffers = [
  starterPreviewOffer("battle", 0, "力量强化", "consumable", "战斗中提升攻击。"),
  starterPreviewOffer("battle", 1, "速度强化", "consumable", "战斗中提升速度。"),
  starterPreviewOffer("battle", 2, "命中强化", "consumable", "战斗中提升命中。"),
  starterPreviewOffer("battle", 3, "要害攻击", "consumable", "战斗中更容易命中要害。"),
];

export const starterItemsPreviewState: StarterChoiceState = {
  seed: 260614,
  coins: 0,
  offers: [...starterRecoveryOffers, ...starterBerryOffers, ...starterTmOffers, ...starterBattleOffers],
  purchased: null,
  purchased_list: [],
  max_purchases: 4,
  item_groups: [
    starterPreviewGroup("recovery", "恢复道具", starterRecoveryOffers),
    starterPreviewGroup("berry", "树果", starterBerryOffers),
    starterPreviewGroup("tm", "技能机器", starterTmOffers),
    starterPreviewGroup("battle", "战斗道具", starterBattleOffers),
  ],
};

export const starterItemsPurchasedPreviewState: StarterChoiceState = {
  ...starterItemsPreviewState,
  purchased: starterRecoveryOffers[0],
  purchased_list: [starterRecoveryOffers[0]],
  item_groups: [
    starterPreviewGroup("recovery", "恢复道具", starterRecoveryOffers, [starterRecoveryOffers[0].offer_id]),
    starterPreviewGroup("berry", "树果", starterBerryOffers),
    starterPreviewGroup("tm", "技能机器", starterTmOffers),
    starterPreviewGroup("battle", "战斗道具", starterBattleOffers),
  ],
};

export const starterItemsEmptyPreviewState: StarterChoiceState = {
  seed: 260614,
  coins: 0,
  offers: [],
  purchased: null,
  purchased_list: [],
  max_purchases: 0,
  item_groups: [],
};
