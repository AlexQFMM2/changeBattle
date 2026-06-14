import type {CSSProperties} from "react";
import type {BattleRecordEntry, BattleSetting, DesktopDexEntry, LocalSave, RentalPokemon, ResultSummaryState, ShopItem, ShopOffer, SpriteMapEntry, StarterChoiceState, StarterItemGroup, StarterItemGroupState, TalentView, TrainerCatalogState} from "@changebattle/shared";
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
    moves: [],
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
