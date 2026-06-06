import {Fragment, useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import type {CSSProperties} from "react";
import type {AppStatus, BagCategoryView, BagItemView, BattleMoveRequest, BattleState, BattleTimelineEvent, BossDexRecord, DesktopDexCategory, DesktopDexEntry, DesktopDexSearchResult, DesktopGameState, LocalSave, MoveSummary, PokemonEditOptions, PricedMove, RentalPokemon, RestAction, RuntimePokemon, ShopItem, ShopOffer, SpriteMapEntry, StarterUpgradeView, TalentView, TrainerCatalogState, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import battleEffectAssets from "../../../data/battle_effect_assets.json";
import bossDialogueAssets from "../../../data/boss_dialogues.json";
import "./styles.css";

const STAT_ROWS = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
] as const;

type BattleEffectEntry = {
  visual: string;
  duration_ms?: number;
  anchor?: "target" | "field" | "side";
};

type BattleVisualCue = {
  visual: string;
  side?: "p1" | "p2";
  targetSide?: "p1" | "p2";
  anchor: "target" | "field" | "side";
  durationMs: number;
};

const BATTLE_EFFECTS = battleEffectAssets as {defaults: {duration_ms: number; anchor: "target" | "field" | "side"}; entries: Record<string, BattleEffectEntry>};
const TYPE_ID_BY_ZH: Record<string, string> = {
  一般: "normal",
  火: "fire",
  水: "water",
  电: "electric",
  草: "grass",
  冰: "ice",
  格斗: "fighting",
  毒: "poison",
  地面: "ground",
  飞行: "flying",
  超能力: "psychic",
  虫: "bug",
  岩石: "rock",
  幽灵: "ghost",
  龙: "dragon",
  恶: "dark",
  钢: "steel",
  妖精: "fairy",
};
const STATUS_ID_BY_ZH: Record<string, string> = {
  灼伤: "brn",
  麻痹: "par",
  中毒: "psn",
  剧毒: "tox",
  睡眠: "slp",
  冰冻: "frz",
  混乱: "confusion",
};
const SUBSTITUTE_DOLL_PATH = "assets/battle/substitute-doll.png";
const TALENT_EQUIP_LIMIT = 5;
const TALENT_CATALOG: TalentView[] = [
  {id: "starter_angel_fund", name: "天使基金", category: "开局筹备", cost: 20, desc: "开局获得 1000 金币，提前获得第一轮运营空间。"},
  {id: "starter_mentor_eye", name: "伯乐本乐", category: "开局筹备", cost: 25, desc: "开局选中的每只宝可梦有 33% 概率升 1 阶，仅限数值模板，最高 4 阶。"},
  {id: "starter_bag_expansion", name: "扩容背包", category: "开局筹备", cost: 20, desc: "开局道具每一类最多可以选择 2 个。"},
  {id: "starter_soulmate", name: "灵魂伴侣", category: "开局筹备", cost: 30, desc: "从上一局队伍和最后敌方队伍中追加回忆候选。"},
  {id: "exchange_trust", name: "不负信赖", category: "交换筑队", cost: 20, desc: "每场结束后可选择队内 1 只宝可梦提升 2 级，最高 55 级；溢出等级转为金币。"},
  {id: "exchange_gym_recognition", name: "馆主认可", category: "交换筑队", cost: 15, desc: "馆主和四天王宝可梦不再受默认只能交换 1 只的限制。"},
  {id: "exchange_careful", name: "爱护有加", category: "交换筑队", cost: 8, desc: "交换获得的宝可梦满 HP、满 PP 加入，并获取目标身上的道具。"},
  {id: "exchange_elite_training", name: "英才教育", category: "交换筑队", cost: 12, desc: "交换来的宝可梦品质更高；只改变阶级数值，不改变技能、特性和道具。"},
  {id: "exchange_factory_freedom", name: "工厂自由", category: "交换筑队", cost: 40, desc: "所有交换免费，但不解除 Boss 交换次数限制。"},
  {id: "intel_rumor", name: "小道消息", category: "情报规划", cost: 30, desc: "休整时可查看本局训练师顺序，并逐步揭示他们的阵容。"},
  {id: "intel_god_eye", name: "上帝之眼", category: "情报规划", cost: 8, desc: "对战时显示技能打击效果，允许查看图鉴，并显示个体值和努力值。"},
  {id: "intel_shop_strategy", name: "神机妙算", category: "情报规划", cost: 18, desc: "商店抽奖前可额外花费金币指定道具方向。"},
  {id: "intel_reroute", name: "公子驾到", category: "情报规划", cost: 25, desc: "休整时可强行更换下一场同等级对手，每局最多 3 次；冠军战不可改道。"},
  {id: "intel_named_challenge", name: "指名挑战", category: "情报规划", cost: 25, desc: "开局前指定本局冠军路线的最终 Boss；只在最终战为冠军时生效。"},
  {id: "growth_risky", name: "铤而走险", category: "养成改造", cost: 12, desc: "局内金币花费和休整页消耗道具可能出现更好或更坏的结果。"},
  {id: "growth_more_choices", name: "顺手牵羊", category: "养成改造", cost: 10, desc: "商店老虎机、商店候选池和技能随机候选给出更多选择。"},
  {id: "growth_fate", name: "时也命也", category: "养成改造", cost: 12, desc: "重置数值时可能免费，也可能付出更高代价。"},
  {id: "growth_vip_guest", name: "座上贵宾", category: "养成改造", cost: 20, desc: "每次休整获得额外免费商店抽奖机会，后续付费抽奖变贵。"},
  {id: "growth_all_in", name: "孤注一掷", category: "养成改造", cost: 50, desc: "每局限一次，生成一只 4 阶宝可梦用于交换；胜利后触发金币翻倍奖励。"},
  {id: "growth_lead_change", name: "临阵换将", category: "养成改造", cost: 8, desc: "允许在休整页更换首发宝可梦。"},
  {id: "economy_bp_exchange", name: "有借有换", category: "经济运营", cost: 10, desc: "对局中可按 1BP => 50金币兑换救急资金。"},
  {id: "economy_recycle_receipt", name: "回收票据", category: "经济运营", cost: 15, desc: "挑战结束时，根据道具出售与背包返还经营额追加 15% 金币收益。"},
  {id: "economy_portfolio", name: "投资组合", category: "经济运营", cost: 20, desc: "通关结算时，按本局金币消费覆盖类型返利；每类 200 金币。"},
  {id: "economy_amulet_coin", name: "护符金币", category: "经济运营", cost: 35, desc: "所有正向金币入账获得 1.35 倍收益。"},
  {id: "economy_shiny_collector", name: "闪光收藏家", category: "经济运营", cost: 40, desc: "交换获得的宝可梦均为闪光，且闪光带来的金币加成提高。"},
  {id: "economy_bargainer", name: "讲价高手", category: "经济运营", cost: 20, desc: "道具回收商出现时，出售道具获得 75% 原价。"},
  {id: "economy_premium_guest", name: "贵客专属", category: "经济运营", cost: 25, desc: "结束时自动处理剩余道具，并将可返还道具结算效率从 50% 提高到 75%。"},
];

type TrainerDialogueMoment = "intro" | "defeat" | "victory";
type TrainerDialogueState = {
  kind: "intro" | "outro";
  speaker: string;
  title: string;
  lines: string[];
  index: number;
};

type TrainerDialogueSet = Record<TrainerDialogueMoment, string[]>;
type BossDialogueVariant = "default" | "first_meeting" | "after_player_win" | "after_player_loss" | "rematch";
type BossDialogueEntry = TrainerDialogueSet[] | Partial<Record<BossDialogueVariant, TrainerDialogueSet[]>>;
type BossDialogueCatalog = Record<string, BossDialogueEntry>;

const BOSS_DIALOGUE_CATALOG = bossDialogueAssets as BossDialogueCatalog;

const TRAINER_TYPE_LABELS: Record<TrainerNpcView["type"], string> = {
  player: "训练师",
  normal: "路人训练师",
  gym: "馆主",
  elite4: "四天王",
  champion: "冠军",
  avatar: "训练师",
};

const NORMAL_DIALOGUE_SETS: Array<{keywords: string[]; lines: TrainerDialogueSet}> = [
  {
    keywords: ["fisherman", "swimmer", "sailor"],
    lines: {
      intro: ["{name} 把精灵球握紧了！"],
      defeat: ["浪头过去了……这次是你赢了。"],
      victory: ["节奏被我抓住了，胜负就是这样翻过来的。"],
    },
  },
  {
    keywords: ["blackbelt", "black-belt", "battle girl", "battle-girl", "cueball", "biker"],
    lines: {
      intro: ["{name} 气势汹汹地走上前来！"],
      defeat: ["力气用尽了……你的宝可梦更强。"],
      victory: ["这就是修炼的成果！"],
    },
  },
  {
    keywords: ["scientist", "engineer", "super nerd", "school", "psychic"],
    lines: {
      intro: ["{name} 正在观察你的队伍。"],
      defeat: ["数据完全被你改写了……我认输。"],
      victory: ["推演成立，胜负也在预料之中。"],
    },
  },
  {
    keywords: ["lady", "beauty", "lass", "parasol", "socialite", "gentleman"],
    lines: {
      intro: ["{name} 优雅地向你发起挑战！"],
      defeat: ["真是一场漂亮的战斗，我输得心服口服。"],
      victory: ["承让了，优雅也是实力的一部分。"],
    },
  },
  {
    keywords: ["bug", "bird", "ranger", "breeder", "pokefan", "aroma"],
    lines: {
      intro: ["{name} 和宝可梦一起摆好了架势！"],
      defeat: ["你的配合更默契，这次是我输了。"],
      victory: ["看见了吗？这就是我和伙伴的默契。"],
    },
  },
  {
    keywords: [],
    lines: {
      intro: ["{name} 前来挑战！"],
      defeat: ["厉害……我会记住这场战斗的。"],
      victory: ["这场胜利，我就收下了。"],
    },
  },
];

const BOSS_DIALOGUE_SETS: Record<Exclude<TrainerNpcView["type"], "player" | "normal" | "avatar">, TrainerDialogueSet> = {
  gym: {
    intro: ["{role}{name} 站到了场地中央。", "来吧，让我看看你的实力。"],
    defeat: ["你已经越过了我的考验。"],
    victory: ["还差一点火候。整理队伍后再来挑战吧。"],
  },
  elite4: {
    intro: ["四天王{name} 静静等候着你。", "能走到这里，说明你已经足够强大。"],
    defeat: ["漂亮。你有继续向前的资格。"],
    victory: ["联盟的道路不会轻易让人通过。"],
  },
  champion: {
    intro: ["冠军{name} 向你投来平静的目光。", "把你的旅途、选择和伙伴，全都放进这场战斗吧。"],
    defeat: ["我被打败了。你和宝可梦的光芒，确实抵达了这里。"],
    victory: ["现在的你还没有到达终点。继续前进吧。"],
  },
};

function toId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stableIndex(value: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash % length;
}

function trainerDisplayName(trainer?: TrainerNpcView): string {
  if (!trainer) return "训练师";
  const zh = String(trainer.name_zh || "").trim();
  if (zh && !/^[A-Z0-9_ -]+$/.test(zh)) return zh;
  const en = String(trainer.name_en || zh || trainer.id || "").replace(/^DP[_-]|^HGSS[_-]|^SPR[_-](?:BW|B2W2)?[_-]/i, "");
  return en.replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()).trim() || "训练师";
}

function trainerDialogueTitle(trainer?: TrainerNpcView): string {
  if (!trainer) return "训练师";
  const label = TRAINER_TYPE_LABELS[trainer.type] || "训练师";
  if (trainer.type === "normal") return label;
  return trainer.role || label;
}

function trainerDialogueRole(trainer?: TrainerNpcView): string {
  const title = trainerDialogueTitle(trainer);
  return ["馆主", "四天王", "冠军"].includes(title) ? title : "";
}

function formatDialogueLine(line: string, trainer?: TrainerNpcView): string {
  return line.replace(/\{name\}/g, trainerDisplayName(trainer)).replace(/\{role\}/g, trainerDialogueRole(trainer));
}

function normalDialogueSet(trainer?: TrainerNpcView): TrainerDialogueSet {
  const haystack = `${trainer?.id || ""} ${trainer?.name_en || ""} ${trainer?.name_zh || ""} ${trainer?.notes || ""}`.toLowerCase();
  return NORMAL_DIALOGUE_SETS.find(set => set.keywords.length && set.keywords.some(keyword => haystack.includes(keyword)))?.lines || NORMAL_DIALOGUE_SETS[NORMAL_DIALOGUE_SETS.length - 1].lines;
}

function bossDialogueVariant(record?: BossDexRecord): BossDialogueVariant {
  if (!record || Number(record.completed || 0) <= 0) return "first_meeting";
  if (record.last_result === "win") return "after_player_win";
  if (record.last_result === "loss") return "after_player_loss";
  return "rematch";
}

function bossDialogueGroups(trainer?: TrainerNpcView, variant: BossDialogueVariant = "default"): TrainerDialogueSet[] {
  if (!trainer || !["gym", "elite4", "champion"].includes(trainer.type)) return [];
  const entry = BOSS_DIALOGUE_CATALOG[trainer.id];
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  return entry[variant] || entry.rematch || entry.default || [];
}

function trainerDialogueLines(trainer: TrainerNpcView | undefined, moment: TrainerDialogueMoment, groupIndex?: number, variant: BossDialogueVariant = "default"): string[] {
  const bossGroups = bossDialogueGroups(trainer, variant);
  if (bossGroups.length) {
    const index = typeof groupIndex === "number" ? Math.max(0, Math.min(groupIndex, bossGroups.length - 1)) : stableIndex(`${trainer?.id || "boss"}:${moment}`, bossGroups.length);
    const lines = bossGroups[index]?.[moment] || bossGroups[0]?.[moment] || [];
    if (lines.length) return lines.map(line => formatDialogueLine(line, trainer));
  }
  const set = trainer?.type === "gym" || trainer?.type === "elite4" || trainer?.type === "champion" ? BOSS_DIALOGUE_SETS[trainer.type] : normalDialogueSet(trainer);
  if (!trainer || trainer.type === "normal") {
    const pool = set[moment];
    const line = pool[stableIndex(`${trainer?.id || "trainer"}:${moment}`, pool.length)] || pool[0];
    return [formatDialogueLine(line, trainer)];
  }
  return set[moment].map(line => formatDialogueLine(line, trainer));
}

function battleDialogueKey(activeBattle: BattleState | null): string {
  if (!activeBattle) return "";
  const trainerId = activeBattle.enemy_trainer?.id || "trainer";
  const teamKey = activeBattle.enemy_display.map(pokemon => pokemon.species_id || pokemon.species || pokemon.name).join("|");
  return `${trainerId}:${bossDialogueVariant(activeBattle.enemy_boss_record)}:${teamKey}`;
}

function typeId(value: string | undefined): string {
  const raw = String(value || "");
  return TYPE_ID_BY_ZH[raw] || toId(raw) || "normal";
}

function statusEffectId(value: string | undefined): string {
  const raw = String(value || "");
  return STATUS_ID_BY_ZH[raw] || toId(raw);
}

function battleEffectEntry(key: string): BattleEffectEntry | undefined {
  return BATTLE_EFFECTS.entries[key];
}

function cueFromEntry(entry: BattleEffectEntry | undefined, event: BattleTimelineEvent, fallbackVisual: string, side?: "p1" | "p2", targetSide?: "p1" | "p2"): BattleVisualCue {
  return {
    visual: entry?.visual || fallbackVisual,
    side: side || event.side,
    targetSide: targetSide || event.targetSide,
    anchor: entry?.anchor || BATTLE_EFFECTS.defaults.anchor,
    durationMs: entry?.duration_ms || BATTLE_EFFECTS.defaults.duration_ms,
  };
}

function assetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return window.changeBattle?.assetUrl(path);
}

function pokemonImageUrl(pokemon?: {sprite?: SpriteMapEntry; shiny?: boolean}, variant: "front_normal" | "back_normal" = "front_normal"): string | undefined {
  const paths = pokemon?.sprite?.paths;
  if (!paths) return undefined;
  const shinyVariant = variant === "back_normal" ? "back_shiny" : "front_shiny";
  const normalFullVariant = variant === "front_normal" ? "front_normal_full" : "front_normal";
  const shinyFullVariant = variant === "front_normal" ? "front_shiny_full" : shinyVariant;
  const path = pokemon?.shiny
    ? paths[shinyVariant] || paths[shinyFullVariant] || paths[variant] || paths[normalFullVariant] || paths.front_normal
    : paths[variant] || paths[normalFullVariant] || paths.front_normal;
  return assetUrl(path);
}

function PokemonSprite({pokemon, src, alt, variant = "front_normal", className = "", badge = "short", entrance = false, onClick}: {pokemon?: {sprite?: SpriteMapEntry; shiny?: boolean}; src?: string; alt: string; variant?: "front_normal" | "back_normal"; className?: string; badge?: "short" | "full" | false; entrance?: boolean; onClick?: () => void}) {
  const shiny = Boolean(pokemon?.shiny);
  const badgeText = badge === "full" ? "闪光" : "闪";
  return (
    <span className={`pokemon-sprite ${className} ${shiny ? "is-shiny" : ""} ${shiny && entrance ? "shiny-entrance" : ""} ${onClick ? "clickable-sprite" : ""}`} onClick={onClick}>
      <img src={src || pokemonImageUrl(pokemon, variant)} alt={alt} />
      {shiny && badge ? <i className={`shiny-badge ${badge === "full" ? "full" : ""}`}>{badgeText}</i> : null}
    </span>
  );
}

function itemImageUrl(item?: {icon_asset?: string}): string {
  return assetUrl(item?.icon_asset || "assets/placeholders/item.png") || "";
}

function ItemIcon({item}: {item?: {id?: string; icon_asset?: string; name?: string; name_zh?: string}}) {
  const isTm = /^tm:/i.test(String(item?.id || ""));
  if (isTm) return <span className="item-icon tm-icon">TM</span>;
  return <img className="item-icon" src={itemImageUrl(item)} alt={item?.name_zh || item?.name || "道具"} />;
}

function trainerImageUrl(trainer?: Pick<TrainerNpcView, "front_asset" | "front_gif_asset" | "back_asset" | "avatar_asset">, slot: "front" | "frontGif" | "back" | "avatar" = "front"): string | undefined {
  if (slot === "frontGif") return assetUrl(trainer?.front_gif_asset || trainer?.front_asset);
  if (slot === "back") return assetUrl(trainer?.back_asset || trainer?.front_asset);
  if (slot === "avatar") return assetUrl(trainer?.avatar_asset || trainer?.front_asset);
  return assetUrl(trainer?.front_asset);
}

function profileFromSelection(name: string, player?: TrainerNpcView, avatarAsset?: string): TrainerProfile {
  return {
    name: name.trim() || "训练师",
    gender: "other",
    player_npc_id: player?.id,
    front_asset: player?.front_asset,
    front_gif_asset: player?.front_gif_asset,
    back_asset: player?.back_asset,
    avatar_asset: avatarAsset || player?.avatar_asset,
  };
}

function displayName(pokemon?: RentalPokemon): string {
  return pokemon?.species_zh || pokemon?.species || "未知";
}

function conditionText(condition?: string): string {
  if (!condition) return "?";
  return condition.replace(" fnt", " 濒死").replace(" brn", " 灼伤").replace(" par", " 麻痹").replace(" psn", " 中毒").replace(" tox", "剧毒").replace(" slp", " 睡眠").replace(" frz", " 冰冻");
}

function parseHp(condition?: string): {current: number; max: number; text: string} | null {
  const match = String(condition || "").match(/(\d+)\/(\d+)/);
  if (!match) return null;
  return {current: Number(match[1]), max: Number(match[2]), text: `${match[1]}/${match[2]}`};
}

function hpTone(hp: {current: number; max: number} | null): "high" | "mid" | "low" {
  if (!hp || hp.max <= 0) return "low";
  const ratio = hp.current / hp.max;
  if (ratio > 0.5) return "high";
  if (ratio > 0.3) return "mid";
  return "low";
}

function statusCode(condition?: string, explicit?: string): string {
  const raw = String(explicit || condition || "").trim();
  if (raw.includes(" fnt") || raw === "fnt" || raw.startsWith("0 ")) return "fnt";
  for (const code of ["brn", "par", "psn", "tox", "slp", "frz"]) {
    if (raw.includes(` ${code}`) || raw === code) return code;
  }
  return "";
}

function statusLabel(code: string): string {
  return {brn: "灼伤", par: "麻痹", psn: "中毒", tox: "剧毒", slp: "睡眠", frz: "冰冻", fnt: "濒死"}[code] || "";
}

function bpCostLabel(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return "-";
  return Number(cost || 0) <= 0 ? "免费" : `${cost}BP`;
}

function coinCostLabel(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return "-";
  return Number(cost || 0) <= 0 ? "免费" : `${cost}金币`;
}

function itemCategoryLabel(category?: string): string {
  if (category === "consumable") return "消耗道具";
  if (category === "tm") return "技能机器";
  return "携带道具";
}

function restoreCostSuffix(costs: Record<1 | 2 | 3, number>, selectedCount: number, currentCount: number): string {
  const count = selectedCount || currentCount;
  return count > 0 ? `（${coinCostLabel(costs[Math.min(3, count) as 1 | 2 | 3])}）` : "（无需恢复）";
}

function talentShortText(talent: TalentView): string {
  const cleanCopy: Record<string, string> = {
    starter_angel_fund: "开局获得 1000 金币。",
    starter_mentor_eye: "选中的开局宝可梦有概率只提升数值模板。",
    starter_bag_expansion: "每类开局道具最多可以带走 2 个。",
    starter_soulmate: "开局追加上一局记忆候选，最多选择 1 只。",
    exchange_trust: "每场后可培养 1 只宝可梦提升等级。",
    exchange_gym_recognition: "重要训练师的宝可梦交换限制会放宽。",
    exchange_careful: "交换获得的宝可梦会以完整状态加入，并带来目标身上的道具。",
    exchange_elite_training: "只提升交换宝可梦的阶级数值；技能、特性和道具不会改变。",
    exchange_factory_freedom: "交换不再消耗金币。",
    intel_rumor: "休整时可查看本局训练师顺序并揭示阵容。",
    intel_god_eye: "对战和详情页显示更多隐藏信息。",
    intel_shop_strategy: "商店抽奖前可指定道具类型。",
    intel_reroute: "休整时可更换下一场同等级对手，每局最多 3 次。",
    intel_named_challenge: "开局前指定本局冠军路线的最终 Boss。",
    growth_risky: "对局花费和休整道具可能出现更好或更坏的结果。",
    growth_more_choices: "商店与技能随机会给出更多选择。",
    growth_fate: "重置数值时可能免费，也可能付出更高代价。",
    growth_vip_guest: "每次休整获得额外免费商店抽奖，后续抽奖消耗提高。",
    growth_all_in: "每局可生成一只 4 阶宝可梦用于交换，胜利后金币翻倍。",
    growth_lead_change: "休整页可以调整下一场首发。",
    economy_bp_exchange: "休整页可把 BP 兑换成局内金币。",
    economy_recycle_receipt: "结束时按道具回收和背包返还经营额追加收益。",
    economy_portfolio: "通关时按本局金币消费覆盖类型发放返利。",
    economy_amulet_coin: "金币正向结算获得额外收益。",
    economy_shiny_collector: "交换获得的宝可梦均为闪光，闪光收益提高。",
    economy_bargainer: "道具回收商出现时出售价格提高。",
    economy_premium_guest: "可返还道具结算效率提高。",
  };
  if (cleanCopy[talent.id]) return cleanCopy[talent.id];
  const text = String(talent.desc || "").trim().replace(/\d+(?:\.\d+)?%?/g, "").replace(/[一二三四五六七八九十]+阶/g, "阶级");
  const match = text.match(/^(.+?[。！？])/);
  return match?.[1] || text.split(/[；;]/, 1)[0] || text;
}

function timelineFaintedState(events: BattleTimelineEvent[], fallback: {p1: boolean; p2: boolean}): {p1: boolean; p2: boolean} {
  const next = {...fallback};
  for (const event of events) {
    if (!event.targetSide) continue;
    if (event.type === "switch") next[event.targetSide] = false;
    if (event.type === "faint") next[event.targetSide] = true;
  }
  return next;
}

function runtimeName(runtime?: RuntimePokemon): string {
  const ident = runtime?.ident || "";
  if (ident.includes(":")) return ident.split(":", 2)[1].trim();
  const details = runtime?.details || "";
  return details ? details.split(",", 1)[0].trim() : ident;
}

function findDisplay(team: RentalPokemon[], name?: string): RentalPokemon | undefined {
  const key = toId(name);
  return team.find(pokemon => toId(pokemon.species) === key || toId(pokemon.name) === key || pokemon.species_id === key);
}

type ActiveTrackerDisplay = BattleState["tracker"]["active"]["p1"];

function displayFromActive(active: ActiveTrackerDisplay | undefined, base?: RentalPokemon): RentalPokemon | undefined {
  if (!active?.sprite && !active?.display_name && !active?.species_id) return base;
  const species = active?.name || active?.display_name || base?.species || "Unknown";
  return {
    name: species,
    species,
    species_zh: active?.display_name || base?.species_zh || species,
    species_id: active?.species_id || base?.species_id || toId(species),
    level: base?.level || 50,
    gender: base?.gender || "",
    types: base?.types || [],
    types_zh: base?.types_zh || [],
    ability: base?.ability || "",
    ability_zh: base?.ability_zh || "",
    ability_id: base?.ability_id || "",
    ability_desc: base?.ability_desc || "",
    ability_desc_zh: base?.ability_desc_zh || "",
    item: base?.item || "",
    item_zh: base?.item_zh || "",
    item_id: base?.item_id || "",
    item_desc: base?.item_desc || "",
    item_desc_zh: base?.item_desc_zh || "",
    moves: base?.moves || [],
    base_stats: base?.base_stats || {},
    stats: base?.stats || {},
    evs: base?.evs || {},
    ivs: base?.ivs || {},
    nature: base?.nature || "",
    nature_zh: base?.nature_zh || "",
    nature_plus: base?.nature_plus || "",
    nature_minus: base?.nature_minus || "",
    role: base?.role || "",
    role_zh: base?.role_zh || "",
    sprite: active?.sprite || base?.sprite,
  };
}

function activePokemon(battle: BattleState | null | undefined, side: "p1" | "p2"): {runtime?: RuntimePokemon; display?: RentalPokemon; active?: ActiveTrackerDisplay} {
  const runtime = side === "p1"
    ? battle?.request?.side?.pokemon?.find(pokemon => pokemon.active)
    : undefined;
  const active = battle?.tracker.active[side];
  const activeName = active?.species_id || active?.name || (side === "p1" ? runtimeName(runtime) : "");
  const team = side === "p1" ? battle?.player_display || [] : battle?.enemy_display || [];
  const allDisplays = [...(battle?.player_display || []), ...(battle?.enemy_display || [])];
  const base = findDisplay(team, activeName) || findDisplay(allDisplays, activeName) || findDisplay(team, runtimeName(runtime));
  return {runtime, active, display: displayFromActive(active, base)};
}

function statLine(pokemon: RentalPokemon, stat: string, revealTraining = false): string {
  const marker = pokemon.nature_plus === stat ? " ↑" : pokemon.nature_minus === stat ? " ↓" : "";
  return revealTraining
    ? `${pokemon.stats[stat] ?? "?"} (${pokemon.base_stats[stat] ?? "?"} | ${pokemon.ivs[stat] ?? 31} | ${pokemon.evs[stat] ?? 0})${marker}`
    : `${pokemon.stats[stat] ?? "?"} (${pokemon.base_stats[stat] ?? "?"} | ?? | ??)${marker}`;
}

function moveDescription(move: MoveSummary): string {
  return move.desc_zh || move.short_desc_zh || "暂无中文说明。";
}

function statMarker(pokemon: RentalPokemon, stat: string): string {
  return pokemon.nature_plus === stat ? "↑" : pokemon.nature_minus === stat ? "↓" : "";
}

function moveSummaryFor(pokemon: RentalPokemon | undefined, requestMove: BattleMoveRequest): MoveSummary | undefined {
  const key = toId(requestMove.id || requestMove.move);
  return pokemon?.moves.find(move => move.id === key || toId(move.name) === key || toId(move.name_zh) === key);
}

function moveSummaryByName(pokemon: RentalPokemon | undefined, moveName: string | undefined): MoveSummary | undefined {
  const key = toId(moveName);
  return pokemon?.moves.find(move => move.id === key || toId(move.name) === key || toId(move.name_zh) === key);
}

function debugMove(id: string, name: string, type = "Fire"): MoveSummary {
  return {id, name, name_zh: name, type, type_zh: type === "Fire" ? "火" : "一般", category: "Physical", category_zh: "物理", power: 120, accuracy: 100, pp: 5, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: ""};
}

function debugPokemon(species: string, zh: string): RentalPokemon {
  const move = debugMove("explosion", "大爆炸", "Normal");
  return {
    name: species, species, species_zh: zh, species_id: toId(species), level: 50, gender: "", types: ["Normal"], types_zh: ["一般"],
    ability: "Blaze", ability_zh: "猛火", ability_id: "blaze", ability_desc: "", ability_desc_zh: "",
    item: "", item_zh: "", item_id: "", item_desc: "", item_desc_zh: "",
    moves: [move], base_stats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100},
    stats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100},
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    nature: "Serious", nature_zh: "认真", nature_plus: "", nature_minus: "", role: "debug", role_zh: "测试",
  };
}

function debugBattle(ended = false): BattleState {
  const player = debugPokemon("PlayerMon", "爆焰龟兽");
  const enemy = debugPokemon("EnemyMon", "爆肌蚊");
  const base = {
    request: {side: {pokemon: [{ident: "p1: PlayerMon", details: "PlayerMon, L50", condition: ended ? "0 fnt" : "100/100", active: true}]}, active: [{moves: [{id: "explosion", move: "Explosion", pp: 5, maxpp: 5}]}]},
    tracker: {turn: 1, active: {p1: {name: "PlayerMon", condition: ended ? "0 fnt" : "100/100", status: ""}, p2: {name: "EnemyMon", condition: ended ? "0 fnt" : "100/100", status: ""}}, boosts: {p1: {}, p2: {}}, side_conditions: {p1: [], p2: []}, weather: "无", field: [], pp: {}},
    recent_events: ended ? ["爆焰龟兽 使用 大爆炸。", "爆肌蚊 HP: 0/100", "效果拔群！", "爆肌蚊 倒下了。", "爆焰龟兽 HP: 0/100", "爆焰龟兽 倒下了。", "胜者：玩家"] : ["爆焰龟兽 上场了。", "爆肌蚊 上场了。"],
    timeline_events: ended ? [
      {id: "d1", type: "move", text: "爆焰龟兽 使用 大爆炸。", side: "p1", source: "爆焰龟兽", source_id: "PlayerMon", move: "大爆炸"},
      {id: "d2", type: "damage", text: "爆肌蚊 HP: 0/100", targetSide: "p2", target: "爆肌蚊", target_id: "EnemyMon", condition: "0/100", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d3", type: "effectiveness", text: "效果拔群！", targetSide: "p2"},
      {id: "d4", type: "faint", text: "爆肌蚊 倒下了。", targetSide: "p2", target: "爆肌蚊", target_id: "EnemyMon", condition: "0 fnt", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d5", type: "damage", text: "爆焰龟兽 HP: 0/100", targetSide: "p1", target: "爆焰龟兽", target_id: "PlayerMon", condition: "0/100", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d6", type: "faint", text: "爆焰龟兽 倒下了。", targetSide: "p1", target: "爆焰龟兽", target_id: "PlayerMon", condition: "0 fnt", hp: {current: 0, max: 100, text: "0/100"}},
      {id: "d7", type: "win", text: "胜者：玩家", side: "p1"},
    ] as BattleTimelineEvent[] : [],
    player_team: [{species: "PlayerMon"}], player_display: [player], enemy_team: [{species: "EnemyMon"}], enemy_display: [enemy],
    player_trainer: {id: "player:debug", type: "player", name_zh: "自动测试", back_asset: "assets/npc/player-back/斗也-bw_touya_back.png", front_asset: "assets/npc/player-front/斗也-bw_black.png"},
    enemy_trainer: {id: "normal:debug", type: "normal", name_zh: "测试训练师", front_asset: "assets/npc/normal/dp_battle_girl-2-dp_battle_girl.png"},
  };
  return {ended, winner: ended ? "Player" : null, ...base} as BattleState;
}

function installBrowserAutomationBridge() {
  if (!import.meta.env.DEV || !new URLSearchParams(location.search).has("automated") || window.changeBattle) return;
  const save: LocalSave = {version: 1, bp_scale: 1, trainer: {name: "自动测试", gender: "other"}, stats: {battle_points: 99, battles: 0, wins: 0, losses: 0, rank_status: "未开放"}, talent_unlocks: [], talent_equipped: [], starter_upgrades: {}, current_run: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
  const candidates = Array.from({length: 6}, (_, index) => debugPokemon(`Candidate${index + 1}`, `候选${index + 1}`));
  window.changeBattle = {
    generateCandidates: async () => ({seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}),
    assetUrl: path => path,
    loadSave: async () => save,
    createNewSave: async trainer => ({...save, trainer}),
    updateTrainer: async trainer => ({...save, trainer}),
    trainerCatalog: async () => ({
      players: [{id: "player:debug", type: "player", name_zh: "斗也", front_asset: "assets/npc/player-front/斗也-bw_black.png", back_asset: "assets/npc/player-back/斗也-bw_touya_back.png", avatar_asset: "assets/npc/avatars/斗也-blackchallenge.png"}],
      avatars: [{id: "avatar:debug", type: "avatar", name_zh: "斗也", avatar_asset: "assets/npc/avatars/斗也-blackchallenge.png"}],
      champions: [{id: "champion:debug", type: "champion", name_zh: "调试冠军", front_asset: "assets/npc/normal/dp_battle_girl-2-dp_battle_girl.png"}],
    }),
    prepareStarterItems: async () => ({screen: "starterItems", save, starter: {seed: 1, coins: 0, offers: [], purchased: null}, message: "自动测试开局道具"}),
    chooseStarterItem: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    cancelPreparation: async () => ({screen: "mainMenu", save, message: "自动测试返回主菜单"}),
    getTalentConfig: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: []}),
    unlockTalent: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    configureTalents: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    setNamedChallenge: async trainerId => {
      save.named_champion_id = trainerId;
      return {catalog: TALENT_CATALOG, unlocked: [], equipped: [], save};
    },
    getStarterUpgrades: async () => ({catalog: [], save}),
    upgradeStarter: async () => ({catalog: [], save}),
    prepareCandidates: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    rerollStarterCandidate: async () => ({screen: "rentalSelect", save, starter: {seed: 1, coins: 0, offers: [], purchased: null, single_rerolls_remaining: 0, inspect_count: 0}, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试单只重随"}),
    beginChallenge: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    continueRun: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    battleChoice: async () => ({screen: "battleMain", save, battle: debugBattle(true), message: "自动测试胜利", pending_transition: {screen: "result", save, battle: debugBattle(true), message: "自动测试结算"}}),
    exchange: async () => ({screen: "result", save, message: "自动测试交换"}),
    restAction: async () => ({screen: "mainMenu", save, message: "自动测试休整"}),
    shopItems: async () => [],
    learnableMoves: async () => [],
    editOptions: async () => ({abilities: [], natures: []}),
    dexSearch: async (category, query = "", offset = 0, limit = 8) => ({
      category,
      query,
      offset,
      limit,
      total: 1,
      has_more: false,
      entries: [{id: "debug", name: "Debug", name_zh: "调试条目", category, desc_zh: "自动测试图鉴条目。"}],
    }),
    getBattleState: async () => debugBattle(false),
  };
}

installBrowserAutomationBridge();

function App() {
  const [screen, setScreen] = useState<AppStatus>("title");
  const [save, setSave] = useState<LocalSave | null>(null);
  const [trainerName, setTrainerName] = useState("训练师");
  const [trainerCatalog, setTrainerCatalog] = useState<TrainerCatalogState>({players: [], avatars: []});
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedAvatarAsset, setSelectedAvatarAsset] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [candidates, setCandidates] = useState<RentalPokemon[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [inspectedIndexes, setInspectedIndexes] = useState<Set<number>>(() => new Set());
  const [inspectRemaining, setInspectRemaining] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [starter, setStarter] = useState<DesktopGameState["starter"]>(null);
  const [battleBag, setBattleBag] = useState<BagCategoryView | null>(null);
  const [exchange, setExchange] = useState<DesktopGameState["exchange"]>(null);
  const [rest, setRest] = useState<DesktopGameState["rest"]>(null);
  const [pendingTransition, setPendingTransition] = useState<DesktopGameState | null>(null);
  const [dexOpen, setDexOpen] = useState(false);
  const [message, setMessage] = useState("欢迎来到 ChangeBattle。选择读取存档或开始新游戏。");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [battleChoicePending, setBattleChoicePending] = useState(false);
  const battleChoicePendingRef = useRef(false);

  useEffect(() => {
    void window.changeBattle?.loadSave().then(loaded => {
      setSave(loaded);
      if (loaded) {
        setTrainerName(loaded.trainer.name);
        setSelectedPlayerId(loaded.trainer.player_npc_id || "");
        setSelectedAvatarAsset(loaded.trainer.avatar_asset || "");
      }
    });
  }, []);

  useEffect(() => {
    void window.changeBattle?.trainerCatalog().then(catalog => {
      setTrainerCatalog(catalog);
      setSelectedPlayerId(current => current || catalog.players[0]?.id || "");
      setSelectedAvatarAsset(current => current || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
    });
  }, []);

  function applyState(state: DesktopGameState) {
    setSave(state.save || null);
    if (state.candidates?.display) {
      setCandidates(state.candidates.display);
      setSelected(state.selected_indexes || []);
      setFocusIndex(0);
      setInspectedIndexes(new Set());
      setInspectRemaining(state.starter?.inspect_count ?? 0);
    }
    setStarter(state.starter || null);
    setBattle(state.battle || null);
    setBattleBag(state.battle_bag || null);
    setExchange(state.exchange || null);
    setRest(state.rest || null);
    setPendingTransition(state.pending_transition || null);
    setScreen(state.screen);
    setMessage(state.message || "");
  }

  async function runAction(action: () => Promise<DesktopGameState | LocalSave | null>, fallbackScreen?: AppStatus, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await action();
      if (result && "screen" in result) applyState(result);
      else if (result && "trainer" in result) setSave(result);
      if (fallbackScreen) setScreen(fallbackScreen);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function loadGame() {
    await runAction(async () => {
      const loaded = await window.changeBattle!.loadSave();
      if (!loaded) throw new Error("没有找到桌面端存档。请选择新游戏。");
      setTrainerName(loaded.trainer.name);
      setSelectedPlayerId(loaded.trainer.player_npc_id || "");
      setSelectedAvatarAsset(loaded.trainer.avatar_asset || "");
      setSave(loaded);
      if (loaded.current_run) return window.changeBattle!.continueRun();
      return {screen: "mainMenu", save: loaded, message: `欢迎回来，${loaded.trainer.name}。`};
    });
  }

  async function createNewGame() {
    await runAction(async () => {
      const player = trainerCatalog.players.find(entry => entry.id === selectedPlayerId) || trainerCatalog.players[0];
      const created = await window.changeBattle!.createNewSave(profileFromSelection(trainerName, player, selectedAvatarAsset));
      return {screen: "mainMenu", save: created, message: `新存档已创建：${created.trainer.name}`};
    });
  }

  async function prepareChallenge() {
    const nextSeed = Math.floor(Math.random() * 0xffffffff);
    setSeed(nextSeed);
    await runAction(() => window.changeBattle!.prepareStarterItems(nextSeed));
  }

  async function chooseStarterItem(offerId: string | null) {
    await runAction(() => window.changeBattle!.chooseStarterItem(offerId));
  }

  async function rerollCandidates() {
    const nextSeed = Math.floor(Math.random() * 0xffffffff);
    setSeed(nextSeed);
    setSelected([]);
    setFocusIndex(0);
    await runAction(() => window.changeBattle!.prepareCandidates(nextSeed));
  }

  async function rerollFocusedCandidate() {
    setSelected(current => current.filter(index => index !== focusIndex));
    await runAction(() => window.changeBattle!.rerollStarterCandidate(focusIndex));
  }

  function inspectFocusedCandidate() {
    if (inspectRemaining <= 0 || inspectedIndexes.has(focusIndex)) return;
    setInspectedIndexes(current => new Set([...current, focusIndex]));
    setInspectRemaining(current => Math.max(0, current - 1));
  }

  function openStarterUpgrade() {
    setScreen("starterUpgrade");
  }

  async function cancelPreparation() {
    await runAction(() => window.changeBattle!.cancelPreparation());
  }

  function backToStarterItems() {
    setSelected([]);
    setFocusIndex(0);
    setInspectedIndexes(new Set());
    setScreen("starterItems");
    setMessage("已返回开局道具。");
  }

  async function beginChallenge(nextSelected = selected, runSeed = seed) {
    await runAction(() => window.changeBattle!.beginChallenge(nextSelected, runSeed, 7));
  }

  function toggleCandidate(index: number) {
    setSelected(current => {
      if (current.includes(index)) return current.filter(value => value !== index);
      const origin = (candidates[index] as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current";
      const memorySelected = current.filter(value => ((candidates[value] as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current") === "memory").length;
      if (origin === "memory" && memorySelected >= 1) {
        setError("灵魂伴侣最多选择 1 只回忆候选。");
        return current;
      }
      const next = current.length < 3 ? [...current, index] : [...current.slice(0, 2), index];
      setError(null);
      return next;
    });
  }

  async function battleChoice(choice: string) {
    if (battleChoicePendingRef.current) return;
    battleChoicePendingRef.current = true;
    setBattleChoicePending(true);
    try {
      await runAction(() => window.changeBattle!.battleChoice(choice), undefined, false);
    } finally {
      battleChoicePendingRef.current = false;
      setBattleChoicePending(false);
    }
  }

  async function finishExchange(ownIndex: number | null, enemyIndex: number | null) {
    await runAction(() => window.changeBattle!.exchange(ownIndex, enemyIndex));
  }

  async function restAction(action: RestAction) {
    await runAction(() => window.changeBattle!.restAction(action), undefined, !["roll_shop", "buy_shop_offer"].includes(action.type));
  }

  function openDex() {
    const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
    const canOpenDex = screen === "mainMenu" || (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen) && battleHasDexTalent);
    if (!canOpenDex) {
      setError("当前页面不能打开图鉴。");
      return;
    }
    setError(null);
    setDexOpen(true);
  }

  const content = useMemo(() => {
    if (screen === "title") return <TitleScreen save={save} onLoad={loadGame} onNew={() => setScreen("newGame")} />;
    if (screen === "newGame") return <PlayerSettings title="训练师登记" name={trainerName} setName={setTrainerName} catalog={trainerCatalog} selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId} selectedAvatarAsset={selectedAvatarAsset} setSelectedAvatarAsset={setSelectedAvatarAsset} onSave={createNewGame} onBack={() => setScreen("title")} saveLabel="创建存档" />;
    if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onTalent={() => setScreen("talentConfig")} onStarterUpgrade={openStarterUpgrade} onInfo={() => setScreen("userInfo")} onTitle={() => setScreen("title")} />;
    if (screen === "userInfo") return <PlayerSettings title="玩家设置" save={save} name={save?.trainer.name || trainerName} catalog={trainerCatalog} onSaved={setSave} onBack={() => setScreen("mainMenu")} saveLabel="保存设置" />;
    if (screen === "talentConfig") return <TalentConfigView save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "starterUpgrade") return <StarterUpgradePage save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "starterItems") return <StarterItemsView starter={starter} onChoose={chooseStarterItem} onBack={cancelPreparation} />;
    if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} onStart={() => beginChallenge()} onBack={starter ? backToStarterItems : undefined} onReroll={rerollCandidates} onSingleReroll={rerollFocusedCandidate} onInspect={inspectFocusedCandidate} wholeRerollsRemaining={starter?.whole_rerolls_remaining ?? 0} singleRerollsRemaining={starter?.single_rerolls_remaining ?? 0} inspectRemaining={inspectRemaining} revealTraining={Boolean(save?.talent_equipped?.includes("intel_god_eye")) || inspectedIndexes.has(focusIndex)} inspected={inspectedIndexes.has(focusIndex)} />;
    if (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen)) return <BattleView battle={battle} battleBag={battleBag} mode={screen} setMode={setScreen} onChoice={battleChoice} choicePending={battleChoicePending} pendingTransition={pendingTransition} onBattleAnimationDone={applyState} />;
    if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
    if (screen === "rest") return <RestView rest={rest} message={message} onAction={restAction} />;
    if (screen === "result") return <ResultView message={message} onBack={() => setScreen("mainMenu")} />;
    return null;
  }, [screen, save, trainerName, trainerCatalog, selectedPlayerId, selectedAvatarAsset, seed, candidates, selected, focusIndex, starter, inspectedIndexes, inspectRemaining, battle, battleBag, battleChoicePending, exchange, rest, pendingTransition, message]);

  const isBattleScreen = ["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen);
  const transientMessage = error || (!isBattleScreen && screen !== "rest" ? message : "");
  const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const showDexButton = screen === "mainMenu" || (isBattleScreen && battleHasDexTalent);

  useEffect(() => {
    if (!showDexButton && dexOpen) setDexOpen(false);
  }, [showDexButton, dexOpen]);

  return (
    <main className="game-shell">
      <section className="game-screen">
        {content}
        {showDexButton ? <button className="floating-dex-button" title="打开图鉴" onClick={openDex}>图鉴</button> : null}
        {dexOpen ? <DexModal onClose={() => setDexOpen(false)} /> : null}
        {loading ? <div className="loading-overlay">正在进入对局...</div> : null}
        {transientMessage ? <div className={`screen-toast ${error ? "danger" : ""}`}>{transientMessage}</div> : null}
      </section>
    </main>
  );
}

function TitleScreen({save, onLoad, onNew}: {save: LocalSave | null; onLoad: () => void; onNew: () => void}) {
  return <div className="title-screen"><h1>ChangeBattle</h1><p>宝可梦对战工厂</p><div className="command-menu"><button onClick={onLoad}>读取存档</button><button onClick={onNew}>开始新游戏</button><button onClick={() => window.close()}>退出</button></div>{save ? <span className="save-hint">检测到存档：{save.trainer.name}</span> : <span className="save-hint">未读取存档</span>}</div>;
}

function MainMenu({save, onStart, onTalent, onStarterUpgrade, onInfo, onTitle}: {save: LocalSave | null; onStart: () => void; onTalent: () => void; onStarterUpgrade: () => void; onInfo: () => void; onTitle: () => void}) {
  return <div className="title-screen small"><h1>{save?.trainer.name || "训练师"}</h1><p>Rank：{save?.stats.rank_status || "未开放"}　BP：{save?.stats.battle_points || 0}</p><div className="command-menu"><button onClick={onStart}>{save?.current_run ? "继续对局" : "开始对局"}</button><button onClick={onTalent}>天赋配置</button><button onClick={onStarterUpgrade}>开局筹备</button><button onClick={onInfo}>玩家设置</button><button onClick={onTitle}>返回标题</button></div></div>;
}

const DEX_TABS: Array<{id: DesktopDexCategory; label: string}> = [
  {id: "pokemon", label: "宝可梦"},
  {id: "abilities", label: "特性"},
  {id: "moves", label: "技能"},
  {id: "items", label: "道具"},
  {id: "trainers", label: "训练师"},
];
const DEX_PAGE_SIZE = 8;
const TRAINER_DEX_FILTERS: Array<{id: "all" | "gym" | "elite4" | "champion"; label: string}> = [
  {id: "all", label: "全部"},
  {id: "gym", label: "馆主"},
  {id: "elite4", label: "四天王"},
  {id: "champion", label: "冠军"},
];

function dexEntryText(entry: DesktopDexEntry): string {
  if (entry.category === "trainers") return entry.boss_summary || entry.desc_zh || "尚未遭遇";
  if (entry.category === "pokemon") return `${entry.types_zh?.join(" / ") || entry.types?.join(" / ") || "未知属性"}　No.${entry.sprite?.national_dex || "--"}`;
  if (entry.category === "moves") return `${entry.type_zh || entry.type || "未知"} / ${entry.move_category_zh || entry.move_category || "变化"}　威力 ${entry.power || "--"}　命中 ${entry.accuracy ?? "必中"}　PP ${entry.pp || "--"}`;
  return entry.desc_zh || entry.desc || entry.id;
}

function dexSpriteUrl(entry: DesktopDexEntry): string {
  const path = String(entry.sprite?.paths.front_normal || entry.sprite?.paths.front_normal_full || "");
  return path ? assetUrl(path) || "" : "";
}

function DexModal({onClose}: {onClose: () => void}) {
  const [category, setCategory] = useState<DesktopDexCategory>("pokemon");
  const [trainerFilter, setTrainerFilter] = useState<"all" | "gym" | "elite4" | "champion">("all");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DesktopDexEntry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = entries.find(entry => entry.id === selectedId) || entries[0] || null;
  const pageCount = Math.max(1, Math.ceil(total / DEX_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntries([]);
    setSelectedId("");
    const timer = window.setTimeout(() => {
      const searchQuery = category === "trainers" && trainerFilter !== "all" ? `${query} type:${trainerFilter}` : query;
      void window.changeBattle!.dexSearch(category, searchQuery, currentPage * DEX_PAGE_SIZE, DEX_PAGE_SIZE).then(result => {
        if (cancelled) return;
        setEntries(result.entries || []);
        setTotal(result.total || 0);
        setSelectedId(current => result.entries.some(entry => entry.id === current) ? current : result.entries[0]?.id || "");
      }).catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setEntries([]);
        setTotal(0);
        setSelectedId("");
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [category, query, trainerFilter, currentPage]);

  return (
    <div className="modal-layer">
      <section className="dex-modal">
        <header>
          <div>
            <h2>图鉴</h2>
            <p>{entries.length}/{total} 个结果</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        <nav className="dex-tabs">
          {DEX_TABS.map(tab => <button className={category === tab.id ? "selected" : ""} onClick={() => { setCategory(tab.id); setSelectedId(""); setPage(0); }} key={tab.id}>{tab.label}</button>)}
        </nav>
        {category === "trainers" ? (
          <nav className="dex-subtabs">
            {TRAINER_DEX_FILTERS.map(filter => <button className={trainerFilter === filter.id ? "selected" : ""} onClick={() => { setTrainerFilter(filter.id); setSelectedId(""); setPage(0); }} key={filter.id}>{filter.label}</button>)}
          </nav>
        ) : null}
        <input className="dex-search-input" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="搜索名称、英文、属性、说明" />
        <div className="dex-modal-body">
          <div className="dex-result-list">
            {loading ? <p>读取本地图鉴...</p> : null}
            {error ? <p>{error}</p> : null}
            {!loading && !error && entries.length === 0 ? <p>没有匹配结果。</p> : null}
            {entries.map(entry => (
              <button className={`${selected?.id === entry.id ? "selected" : ""} ${entry.category === "trainers" && !entry.unlocked ? "locked" : ""}`} onClick={() => setSelectedId(entry.id)} key={`${entry.category}-${entry.id}`}>
                {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : null}
                {entry.category === "trainers" ? <TrainerDexAvatar entry={entry} /> : null}
                <strong>{entry.name_zh || entry.name}</strong>
                <span>{entry.name}</span>
                <small>{dexEntryText(entry)}</small>
              </button>
            ))}
            <nav className="dex-pager">
              <button disabled={loading || currentPage <= 0} onClick={() => setPage(value => Math.max(0, value - 1))}>上一页</button>
              <span>{currentPage + 1}/{pageCount}</span>
              <button disabled={loading || currentPage >= pageCount - 1} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>下一页</button>
            </nav>
          </div>
          <DexEntryDetail entry={selected} />
        </div>
      </section>
    </div>
  );
}

function TrainerDexAvatar({entry}: {entry: DesktopDexEntry}) {
  const trainer = entry.trainer;
  const image = entry.unlocked ? trainerImageUrl(trainer, "frontGif") : undefined;
  return image ? <img className="trainer-dex-avatar" src={image} alt={entry.name_zh || entry.name} /> : <i className="shadow-orb">?</i>;
}

function DexEntryDetail({entry}: {entry: DesktopDexEntry | null}) {
  if (!entry) return <section className="dex-entry-detail empty"><p>选择一个条目。</p></section>;
  if (entry.category === "trainers") return <TrainerDexDetail entry={entry} />;
  const sprite = dexSpriteUrl(entry);
  return (
    <section className="dex-entry-detail">
      <header>
        {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : null}
        <div>
          <h3>{entry.name_zh || entry.name}</h3>
          <p>{entry.name}　{entry.id}</p>
        </div>
      </header>
      {entry.category === "pokemon" ? (
        <>
          <div className="dex-type-row">{(entry.types_zh || entry.types || []).map(type => <span key={type}>{type}</span>)}</div>
          {entry.base_stats ? <div className="dex-stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{entry.base_stats?.[stat] || 0}</strong></div>)}</div> : null}
          <div className="dex-learnset-panel">
            <h4>技能池</h4>
            <div>
              {entry.learnset?.length ? entry.learnset.map(move => (
                <article key={`${entry.id}-${move.id}`}>
                  <strong>{move.name_zh || move.name}</strong>
                  <span>{move.type_zh || move.type} / {move.category_zh || move.category}</span>
                  <small>威力 {move.power || "--"}　命中 {move.accuracy ?? "必中"}　PP {move.pp || "--"}</small>
                </article>
              )) : <p>暂无技能池数据。</p>}
            </div>
          </div>
        </>
      ) : null}
      {entry.category === "moves" ? (
        <div className="dex-fact-grid">
          <p>属性：{entry.type_zh || entry.type || "--"}</p>
          <p>分类：{entry.move_category_zh || entry.move_category || "--"}</p>
          <p>威力：{entry.power || "--"}</p>
          <p>命中：{entry.accuracy ?? "必中"}</p>
          <p>PP：{entry.pp || "--"}</p>
          <p>优先度：{entry.priority || 0}</p>
        </div>
      ) : null}
      {entry.category !== "pokemon" ? <p className="dex-description">{entry.desc_zh || entry.desc || "暂无说明。"}</p> : null}
    </section>
  );
}

function TrainerDexDetail({entry}: {entry: DesktopDexEntry}) {
  const [detailPokemon, setDetailPokemon] = useState<RentalPokemon | null>(null);
  const trainer = entry.trainer;
  const image = entry.unlocked ? trainerImageUrl(trainer, "frontGif") : undefined;
  const record = entry.boss_record;
  const lastResult = record?.last_result === "win" ? "胜利" : record?.last_result === "loss" ? "失败" : "未结算";
  return (
    <section className={`dex-entry-detail trainer-dex-detail ${entry.unlocked ? "" : "locked"}`}>
      <header>
        {image ? <img src={image} alt={entry.name_zh || entry.name} /> : <i className="shadow-orb large">?</i>}
        <div>
          <h3>{entry.unlocked ? entry.name_zh : "未知训练师"}</h3>
          <p>{trainer?.region || "未知地区"}　{trainer?.role || (trainer?.type === "champion" ? "冠军" : trainer?.type === "elite4" ? "四天王" : "馆主")}</p>
        </div>
      </header>
      <div className="trainer-dex-stats">
        <span>交手 <strong>{record?.completed || 0}</strong></span>
        <span>胜 <strong>{record?.wins || 0}</strong></span>
        <span>负 <strong>{record?.losses || 0}</strong></span>
        <span>上次 <strong>{lastResult}</strong></span>
      </div>
      <p className="dex-description">{entry.unlocked ? "已记录这位强敌的遭遇资料。配置池展示的是对战中实际遇到过的预设宝可梦配置。" : "尚未遭遇。击败路上的训练师，直到这位强敌站到你面前。"}</p>
      <div className="trainer-pool-panel">
        <h4>遭遇配置池</h4>
        <div>
          {(entry.boss_pool_rows || []).map(row => (
            <article className="trainer-pool-row" key={`${entry.id}-${row.team_index}`}>
              <span>配置 {row.team_index}</span>
              <div>
                {row.slots.map(slot => slot.unlocked && slot.pokemon ? (
                  <button className="trainer-pool-slot unlocked" onClick={() => setDetailPokemon(slot.pokemon || null)} key={slot.key}>
                    <PokemonSprite pokemon={slot.pokemon} alt={displayName(slot.pokemon)} />
                    <strong>{displayName(slot.pokemon)}</strong>
                  </button>
                ) : (
                  <button className="trainer-pool-slot locked" disabled key={slot.key}>
                    <i className="shadow-orb">?</i>
                    <strong>未知</strong>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
      {detailPokemon ? (
        <div className="modal-layer nested">
          <section className="pokemon-detail-modal trainer-pokemon-detail">
            <header><h2>{displayName(detailPokemon)} 的预设配置</h2><button onClick={() => setDetailPokemon(null)}>关闭</button></header>
            <PokemonProfile pokemon={detailPokemon} compact revealTraining />
          </section>
        </div>
      ) : null}
    </section>
  );
}

function PlayerSettings({title, save, name, setName, catalog, selectedPlayerId, setSelectedPlayerId, selectedAvatarAsset, setSelectedAvatarAsset, onSave, onSaved, onBack, saveLabel}: {title: string; save?: LocalSave | null; name: string; setName?: (value: string) => void; catalog: TrainerCatalogState; selectedPlayerId?: string; setSelectedPlayerId?: (value: string) => void; selectedAvatarAsset?: string; setSelectedAvatarAsset?: (value: string) => void; onSave?: () => void | Promise<void>; onSaved?: (save: LocalSave) => void; onBack: () => void; saveLabel: string}) {
  const [localName, setLocalName] = useState(name || "训练师");
  const [localPlayerId, setLocalPlayerId] = useState(selectedPlayerId || save?.trainer.player_npc_id || catalog.players[0]?.id || "");
  const [localAvatar, setLocalAvatar] = useState(selectedAvatarAsset || save?.trainer.avatar_asset || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
  const currentName = setName ? name : localName;
  const currentPlayerId = setSelectedPlayerId ? selectedPlayerId || localPlayerId : localPlayerId;
  const currentAvatar = setSelectedAvatarAsset ? selectedAvatarAsset || localAvatar : localAvatar;
  const player = catalog.players.find(entry => entry.id === currentPlayerId) || catalog.players[0];
  const stats = save?.stats;
  const winRate = stats?.battles ? Math.round((stats.wins / stats.battles) * 1000) / 10 : 0;

  useEffect(() => {
    setLocalName(name || "训练师");
    setLocalPlayerId(selectedPlayerId || save?.trainer.player_npc_id || catalog.players[0]?.id || "");
    setLocalAvatar(selectedAvatarAsset || save?.trainer.avatar_asset || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
  }, [name, selectedPlayerId, selectedAvatarAsset, save?.trainer.player_npc_id, save?.trainer.avatar_asset, catalog.players, catalog.avatars]);

  function updateName(value: string) {
    setLocalName(value);
    setName?.(value);
  }

  function updatePlayer(id: string) {
    const next = catalog.players.find(entry => entry.id === id);
    setLocalPlayerId(id);
    setSelectedPlayerId?.(id);
    const nextAvatar = currentAvatar || next?.avatar_asset || catalog.avatars[0]?.avatar_asset || "";
    setLocalAvatar(nextAvatar);
    setSelectedAvatarAsset?.(nextAvatar);
  }

  function updateAvatar(asset: string) {
    setLocalAvatar(asset);
    setSelectedAvatarAsset?.(asset);
  }

  async function saveSettings() {
    if (onSave) {
      await onSave();
      return;
    }
    const next = await window.changeBattle!.updateTrainer(profileFromSelection(currentName, player, currentAvatar));
    onSaved?.(next);
    onBack();
  }

  return (
    <div className="player-settings-page">
      <header className="settings-header">
        <h2>{title}</h2>
        {save ? <span>BP {save.stats.battle_points}　胜率 {winRate}%</span> : <span>选择你的训练师形象</span>}
      </header>
      <section className="player-settings-layout">
        <aside className="player-name-panel">
          <label>昵称<input value={currentName} onChange={event => updateName(event.target.value)} /></label>
          <div className="selected-trainer-preview">
            {player ? <img src={trainerImageUrl(player, "frontGif")} alt={player.name_zh} /> : null}
            <strong>{currentName || "训练师"}</strong>
            <small>{player?.name_zh || "请选择角色"}</small>
          </div>
        </aside>
        <section className="player-picker">
          <h3>玩家角色</h3>
          <div className="player-character-grid">
            {catalog.players.length ? catalog.players.map(entry => {
              const active = entry.id === currentPlayerId;
              return <button className={active ? "selected" : ""} onClick={() => updatePlayer(entry.id)} key={entry.id}><img src={trainerImageUrl(entry, active ? "frontGif" : "front")} alt={entry.name_zh} /><span>{entry.name_zh}</span></button>;
            }) : <p>没有找到玩家角色资源。</p>}
          </div>
        </section>
        <section className="avatar-picker">
          <h3>头像</h3>
          <div className="avatar-grid">
            {catalog.avatars.length ? catalog.avatars.map(entry => {
              const asset = entry.avatar_asset || "";
              return <button className={asset === currentAvatar ? "selected" : ""} onClick={() => updateAvatar(asset)} key={entry.id}><img src={trainerImageUrl(entry, "avatar")} alt={entry.name_zh} /></button>;
            }) : <p>没有找到头像资源。</p>}
          </div>
        </section>
      </section>
      <div className="command-row"><button disabled={!player} onClick={saveSettings}>{saveLabel}</button><button onClick={onBack}>返回</button></div>
    </div>
  );
}

function TalentConfigView({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const talentPageSize = 20;
  const [catalog, setCatalog] = useState<TalentView[]>(TALENT_CATALOG);
  const [selectedId, setSelectedId] = useState(TALENT_CATALOG[0]?.id || "");
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set());
  const [equipped, setEquipped] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [talentPage, setTalentPage] = useState(0);
  const [champions, setChampions] = useState<TrainerNpcView[]>([]);
  const selected = catalog.find(talent => talent.id === selectedId) || catalog[0];
  const talentDisabled = Boolean(selected?.disabled);
  const selectedUnlocked = selected ? unlocked.has(selected.id) : false;
  const selectedEquipped = selected ? equipped.includes(selected.id) : false;
  const selectedAffordable = selected && !talentDisabled ? (save?.stats.battle_points || 0) >= (selected.cost || 0) : false;
  const categories = ["全部", ...new Set(catalog.map(talent => talent.category))];
  const visibleCategory = categories.includes(activeCategory) ? activeCategory : categories[0] || activeCategory;
  const visibleTalents = visibleCategory === "全部" ? catalog : catalog.filter(talent => talent.category === visibleCategory);
  const pageCount = Math.max(1, Math.ceil(visibleTalents.length / talentPageSize));
  const currentPage = Math.min(talentPage, pageCount - 1);
  const pagedTalents = visibleTalents.slice(currentPage * talentPageSize, (currentPage + 1) * talentPageSize);
  const gridSlots = Array.from({length: talentPageSize}, (_, index) => pagedTalents[index] || null);
  const equippedSlots = Array.from({length: TALENT_EQUIP_LIMIT}, (_, index) => catalog.find(talent => talent.id === equipped[index]) || null);

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getTalentConfig().then(config => {
      if (cancelled) return;
      const unlockedIds = (config.unlocked || []).map(talent => talent.id);
      const equippedIds = (config.equipped || []).map(talent => talent.id);
      const nextCatalog = config.catalog?.length ? config.catalog : TALENT_CATALOG;
      setCatalog(nextCatalog);
      setEquipped(equippedIds);
      setUnlocked(new Set([...unlockedIds, ...equippedIds]));
      if (config.save) onSaved(config.save);
      const nextSelected = nextCatalog.find(talent => talent.id === equippedIds[0]) || nextCatalog[0];
      if (nextSelected) {
        setSelectedId(nextSelected.id);
      }
    });
    return () => { cancelled = true; };
  }, [onSaved]);

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.trainerCatalog().then(catalog => {
      if (!cancelled) setChampions(catalog.champions || []);
    });
    return () => { cancelled = true; };
  }, []);

  function selectTalent(talent: TalentView) {
    setSelectedId(talent.id);
    if (visibleCategory !== "全部" && visibleCategory !== talent.category) setActiveCategory(talent.category);
  }

  function switchTalentCategory(category: string) {
    setActiveCategory(category);
    setTalentPage(0);
  }

  function talentClass(talent: TalentView | null): string {
    if (!talent) return "empty";
    const routeClass = talent.category === "开局筹备" ? "starter" : talent.category === "交换筑队" ? "exchange" : talent.category === "情报规划" ? "intel" : talent.category === "养成改造" ? "growth" : "economy";
    return `${routeClass} ${selectedId === talent.id ? "selected" : ""} ${unlocked.has(talent.id) ? "unlocked" : "locked"} ${equipped.includes(talent.id) ? "equipped" : ""} ${talent.disabled ? "disabled" : ""}`;
  }

  async function unlockSelected() {
    if (!selected || talentDisabled || selectedUnlocked || !selectedAffordable) return;
    const config = await window.changeBattle?.unlockTalent(selected.id);
    if (!config) return;
    setUnlocked(new Set((config.unlocked || []).map(talent => talent.id)));
    setEquipped((config.equipped || []).map(talent => talent.id));
    if (config.save) onSaved(config.save);
  }

  async function equipSelected() {
    if (!selected || talentDisabled || !selectedUnlocked || selectedEquipped || equipped.length >= TALENT_EQUIP_LIMIT) return;
    const nextIds = [...equipped, selected.id];
    const config = await window.changeBattle?.configureTalents(nextIds);
    setEquipped((config?.equipped || []).map(talent => talent.id));
    if (config?.save) onSaved(config.save);
  }

  async function unequipSelected() {
    if (!selected || talentDisabled) return;
    const nextIds = equipped.filter(id => id !== selected.id);
    const config = await window.changeBattle?.configureTalents(nextIds);
    setEquipped((config?.equipped || []).map(talent => talent.id));
    if (config?.save) onSaved(config.save);
  }

  async function chooseNamedChampion(trainerId: string) {
    const config = await window.changeBattle?.setNamedChallenge(trainerId || null);
    if (config?.save) onSaved(config.save);
  }

  return (
    <div className="talent-page">
      <section className="talent-board">
        <header className="talent-title-row">
          <h2>天赋配置</h2>
          <span>BP {save?.stats.battle_points || 0}</span>
        </header>
        <section className="equipped-talent-panel">
          <header>
            <strong>已装备天赋</strong>
            <span>{equipped.length}/{TALENT_EQUIP_LIMIT}</span>
          </header>
          <div className="equipped-talents">
            {equippedSlots.map((talent, index) => (
              <button className={`talent-slot ${talentClass(talent)}`} disabled={!talent} onClick={() => talent && selectTalent(talent)} key={`equipped-${index}`}>
                {talent ? <><span>{talent.category}</span><strong>{talent.name}</strong></> : <><span>空</span><strong>空槽</strong></>}
              </button>
            ))}
          </div>
        </section>
        <nav className="talent-tabs" aria-label="路线视图">
          {categories.map(category => (
            <button className={visibleCategory === category ? "selected" : ""} onClick={() => switchTalentCategory(category)} key={category}>
              {category}
            </button>
          ))}
        </nav>
        <div className="talent-grid">
          {gridSlots.map((talent, index) => (
            <button className={`talent-node ${talentClass(talent)}`} disabled={!talent} onClick={() => talent && selectTalent(talent)} key={talent?.id || `${visibleCategory}-empty-${index}`}>
              {talent ? <><span>{talent.category}</span><strong>{talent.name}</strong><small>{unlocked.has(talent.id) ? bpCostLabel(talent.cost || 0) : `锁定 ${bpCostLabel(talent.cost || 0)}`}</small></> : <span />}
            </button>
          ))}
        </div>
        <nav className="talent-pager">
          <button disabled={currentPage <= 0} onClick={() => setTalentPage(page => Math.max(0, page - 1))}>上一页</button>
          <span>{currentPage + 1}/{pageCount}</span>
          <button disabled={currentPage >= pageCount - 1} onClick={() => setTalentPage(page => Math.min(pageCount - 1, page + 1))}>下一页</button>
        </nav>
        <footer className="talent-footer-note">路线视图会影响开局、交换、情报、养成与经济运营。</footer>
      </section>
      <section className="talent-detail-panel">
        {selected ? (
          <div className="talent-detail-copy">
            <span>{selected.category}</span>
            <h3>{selected.name}</h3>
            <strong>{bpCostLabel(selected.cost || 0)} 需要</strong>
            <p>{talentShortText(selected)}</p>
            {selected.id === "intel_named_challenge" ? (
              <div className="talent-champion-picker">
                <label>最终 Boss</label>
                <select value={save?.named_champion_id || ""} onChange={event => chooseNamedChampion(event.target.value)}>
                  <option value="">默认随机冠军</option>
                  {champions.map(champion => <option value={champion.id} key={champion.id}>{champion.name_zh}</option>)}
                </select>
              </div>
            ) : null}
            <small>{talentDisabled ? "暂不可用" : selectedEquipped ? "已携带" : selectedUnlocked ? "已解锁" : selectedAffordable ? "可解锁" : "BP 不足"}</small>
          </div>
        ) : null}
        <div className="talent-actions">
          <button disabled={!selected || talentDisabled || selectedUnlocked || !selectedAffordable} onClick={unlockSelected}>解锁</button>
          <button disabled={!selected || talentDisabled || !selectedUnlocked || selectedEquipped || equipped.length >= TALENT_EQUIP_LIMIT} onClick={equipSelected}>装备</button>
          <button disabled={talentDisabled || !selectedEquipped} onClick={unequipSelected}>卸下</button>
          <button onClick={onBack}>返回</button>
        </div>
      </section>
    </div>
  );
}

function StarterUpgradePage({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const [catalog, setCatalog] = useState<StarterUpgradeView[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeGroup, setActiveGroup] = useState("开局道具");
  const selected = catalog.find(entry => entry.id === selectedId) || catalog[0];
  const selectedAffordable = selected ? (save?.stats.battle_points || 0) >= (selected.cost || 0) : false;
  const groups = [{id: "开局道具", label: "初始道具"}, {id: "开局选牌", label: "初始随机"}];
  const visible = catalog.filter(entry => entry.group === activeGroup);

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getStarterUpgrades().then(config => {
      if (cancelled) return;
      const nextCatalog = config.catalog || [];
      setCatalog(nextCatalog);
      if (config.save) onSaved(config.save);
      setSelectedId(current => current && nextCatalog.some(entry => entry.id === current) ? current : nextCatalog[0]?.id || "");
    });
    return () => { cancelled = true; };
  }, [onSaved]);

  async function upgradeSelected() {
    if (!selected || selected.cost === null || selected.cost === undefined || !selectedAffordable) return;
    const config = await window.changeBattle?.upgradeStarter(selected.id);
    if (!config) return;
    const nextCatalog = config.catalog || [];
    setCatalog(nextCatalog);
    setSelectedId(current => current && nextCatalog.some(entry => entry.id === current) ? current : nextCatalog.find(entry => entry.group === activeGroup)?.id || nextCatalog[0]?.id || "");
    if (config.save) onSaved(config.save);
  }

  function selectGroup(group: string) {
    setActiveGroup(group);
    const first = catalog.find(entry => entry.group === group);
    if (first) setSelectedId(first.id);
  }

  function upgradeBar(entry: StarterUpgradeView) {
    return Array.from({length: entry.max_level}, (_value, index) => (
      <i className={index < entry.level ? "filled" : ""} key={`${entry.id}-${index}`} />
    ));
  }

  return (
    <div className="starter-upgrade-page">
      <section className="starter-upgrade-shell">
        <div className="starter-upgrade-main">
          <nav className="starter-upgrade-tabs">
          {groups.map(group => (
            <button className={activeGroup === group.id ? "selected" : ""} onClick={() => selectGroup(group.id)} key={group.id}>
              {group.label}
            </button>
          ))}
          </nav>
          <div className="starter-upgrade-list">
          {visible.length ? visible.map(entry => (
            <button className={`starter-upgrade-row ${selectedId === entry.id ? "selected" : ""}`} onClick={() => setSelectedId(entry.id)} key={entry.id}>
              <span>{entry.name}</span>
              <div className="starter-upgrade-bars">{upgradeBar(entry)}</div>
              <b>{entry.level >= entry.max_level ? "MAX" : entry.cost === null || entry.cost === undefined ? "MAX" : `${entry.cost}BP`}</b>
            </button>
          )) : <p className="starter-upgrade-empty">暂无可升级项目。</p>}
          </div>
        </div>
        <aside className="starter-upgrade-detail">
        {selected ? (
          <div>
            <span>{selected.group}</span>
            <h3>{selected.name}</h3>
            <p>{selected.desc}</p>
            <strong>{selected.cost === null || selected.cost === undefined ? "已满级" : `花费 ${bpCostLabel(selected.cost)}`}</strong>
            <small>{selected.cost === null || selected.cost === undefined ? "已满级" : selectedAffordable ? `升级需要 ${bpCostLabel(selected.cost)}` : "BP 不足"}</small>
          </div>
        ) : null}
        <div className="starter-upgrade-actions">
          <button disabled={!selected || selected.cost === null || selected.cost === undefined || !selectedAffordable} onClick={upgradeSelected}>升级</button>
          <button onClick={onBack}>返回</button>
        </div>
        <footer>BP {save?.stats.battle_points || 0}</footer>
        </aside>
      </section>
    </div>
  );
}

function StarterItemsView({starter, onChoose, onBack}: {starter: DesktopGameState["starter"]; onChoose: (offerId: string | null) => void | Promise<void>; onBack: () => void | Promise<void>}) {
  const groupOrder = ["recovery", "berry", "tm", "battle"];
  const purchasedOffers = starter?.purchased_list || (starter?.purchased ? [starter.purchased] : []);
  const purchasedIds = new Set(purchasedOffers.map(offer => offer.offer_id));
  const groups = [...(starter?.item_groups || [])]
    .filter(group => group.offers.length > 0)
    .sort((a, b) => groupOrder.indexOf(a.id) - groupOrder.indexOf(b.id));
  const [pageIndex, setPageIndex] = useState(0);
  const [stagedOfferId, setStagedOfferId] = useState<string | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const currentIndex = Math.min(pageIndex, Math.max(0, groups.length - 1));
  const currentGroup = groups[currentIndex] || null;
  const perGroupLimit = (starter?.max_purchases || 0) > groups.length ? 2 : 1;
  const currentPurchasedIds = currentGroup?.purchased_offer_ids || (currentGroup?.purchased_offer_id ? [currentGroup.purchased_offer_id] : []);
  const groupLimit = Math.min(perGroupLimit, currentGroup?.offers.length || perGroupLimit);
  const groupLocked = currentPurchasedIds.length >= groupLimit;
  const selectedOfferId = stagedOfferId;
  const selectedOffer = currentGroup?.offers.find(offer => offer.offer_id === selectedOfferId) || null;
  const isLastPage = currentIndex >= groups.length - 1;
  const progress = groups.length ? `${currentIndex + 1}/${groups.length}` : "0/0";

  useEffect(() => {
    setPageIndex(index => Math.min(index, Math.max(0, groups.length - 1)));
  }, [groups.length]);

  useEffect(() => {
    setStagedOfferId(null);
    setSkipConfirmOpen(false);
  }, [currentGroup?.id]);

  async function continueWithoutSelection() {
    setSkipConfirmOpen(false);
    if (isLastPage) {
      await onChoose(null);
      return;
    }
    setPageIndex(index => Math.min(groups.length - 1, index + 1));
  }

  async function nextStep() {
    if (!currentGroup) {
      await onChoose(null);
      return;
    }
    if (selectedOffer && !currentPurchasedIds.includes(selectedOffer.offer_id)) {
      const willCompleteAllChoices = purchasedOffers.length + 1 >= (starter?.max_purchases || groups.length);
      const willLockGroup = currentPurchasedIds.length + 1 >= groupLimit;
      await onChoose(selectedOffer.offer_id);
      if (isLastPage && !willCompleteAllChoices) await onChoose(null);
      setStagedOfferId(null);
      if (!isLastPage && willLockGroup) setPageIndex(index => Math.min(groups.length - 1, index + 1));
      return;
    }
    if (!groupLocked) {
      setSkipConfirmOpen(true);
      return;
    }
    await continueWithoutSelection();
  }

  if (!currentGroup) {
    return (
      <div className="starter-page starter-wizard-page">
        <section className="starter-wizard-empty">
          <h2>开局道具</h2>
          <p>当前没有可选择的开局道具，直接进入选队。</p>
          <button onClick={() => onChoose(null)}>开始</button>
        </section>
      </div>
    );
  }

  return (
    <div className="starter-page starter-wizard-page">
      <header>
        <div>
          <h2>开局道具</h2>
          <p>{currentGroup.name}　{progress}　每类最多免费带走 {groupLimit} 个</p>
        </div>
        <div className="starter-actions">
          <button onClick={onBack}>返回</button>
        </div>
      </header>
      <section className="starter-wizard">
        <nav className="starter-wizard-steps">
          {groups.map((group, index) => (
            <span className={`${index < currentIndex ? "done" : ""} ${index === currentIndex ? "current" : ""}`} key={group.id}>{group.name}</span>
          ))}
        </nav>
        <div className="starter-group starter-wizard-card">
          <header>
            <strong>{currentGroup.name}（质量 Lv{currentGroup.quality_level} / 数量 Lv{currentGroup.quantity_level}）</strong>
            <span>{currentPurchasedIds.length}/{groupLimit}　{groupLocked ? "已锁定" : selectedOffer ? "待锁定" : "可跳过"}</span>
          </header>
          <div className="starter-group-offers">
            {currentGroup.offers.map(offer => {
              const selected = selectedOfferId === offer.offer_id;
              const purchased = currentPurchasedIds.includes(offer.offer_id);
              const locked = groupLocked || purchased;
              return (
                <button className={`starter-offer ${selected ? "selected" : ""}`} disabled={locked} onClick={() => setStagedOfferId(current => current === offer.offer_id ? null : offer.offer_id)} key={offer.offer_id}>
                  <ItemIcon item={offer} />
                  <strong>{offer.name_zh || offer.name}</strong>
                  <span><b className="price-badge">Lv{offer.item_tier || 1}</b><i>{purchasedIds.has(offer.offer_id) ? "已选择" : selected ? "待选" : "免费"}</i></span>
                  <small>{itemCategoryLabel(offer.category)}　{offer.desc_zh || offer.desc || offer.name}</small>
                </button>
              );
            })}
          </div>
        </div>
        <footer className="starter-wizard-footer">
          <div>
            <strong>{selectedOffer ? selectedOffer.name_zh || selectedOffer.name : "本页未选择"}</strong>
            <span>{selectedOffer ? "点击下一步后锁定本页选择。" : "不选择也可以继续，离开后本页就算跳过。"}</span>
          </div>
          <button onClick={nextStep}>{isLastPage ? "开始" : "下一步"}</button>
        </footer>
      </section>
      {skipConfirmOpen ? (
        <div className="starter-skip-confirm" role="dialog" aria-modal="true">
          <div>
            <span>{currentGroup.name}</span>
            <h3>本页还没有选择道具</h3>
            <p>继续后将跳过这一类开局道具，本页不能返回重选。</p>
            <div>
              <button onClick={() => setSkipConfirmOpen(false)}>取消</button>
              <button onClick={continueWithoutSelection}>{isLastPage ? "跳过并开始" : "继续"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RentalSelect({candidates, selected, focusIndex, setFocusIndex, onToggle, onStart, onBack, onReroll, onSingleReroll, onInspect, wholeRerollsRemaining = 0, singleRerollsRemaining = 0, inspectRemaining = 0, revealTraining = false, inspected = false}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; setFocusIndex: (index: number) => void; onToggle: (index: number) => void; onStart: () => void | Promise<void>; onBack?: () => void | Promise<void>; onReroll?: () => void | Promise<void>; onSingleReroll?: () => void | Promise<void>; onInspect?: () => void; wholeRerollsRemaining?: number; singleRerollsRemaining?: number; inspectRemaining?: number; revealTraining?: boolean; inspected?: boolean}) {
  const pokemon = candidates[focusIndex];
  if (!pokemon) return <div className="loading-panel"><strong>正在生成租赁候选...</strong></div>;
  const focusedSelected = selected.includes(focusIndex);
  const focusedOrigin = (pokemon as RentalPokemon & {starter_origin?: string}).starter_origin || "current";
  const originLabel = focusedOrigin === "memory" ? "回忆候选" : "本局候选";
  const selectLabel = focusedSelected ? "取消选中" : selected.length >= 3 ? "替换第3只" : "选中";
  const selectedSlots = Array.from({length: 3}, (_, index) => typeof selected[index] === "number" ? candidates[selected[index]] : null);
  return <div className="dex-layout rental-select-layout"><PokemonProfile pokemon={pokemon} selected={focusedSelected} revealTraining={revealTraining} /><div className="dex-actions"><span>候选 {focusIndex + 1}/{candidates.length}　{originLabel}　验牌 {inspectRemaining}</span><div className="selected-team-box"><strong>已选队伍</strong><div className="selected-team-slots">{selectedSlots.map((entry, index) => <button className={entry ? "filled" : ""} onClick={() => entry && setFocusIndex(selected[index])} disabled={!entry} key={`selected-slot-${index}`}>{entry ? <><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}{((entry as RentalPokemon & {starter_origin?: string}).starter_origin || "current") === "memory" ? "（回忆）" : ""}</span></> : <><i>{index + 1}</i><span>待选择</span></>}</button>)}</div></div><div className="command-row">{onBack ? <button onClick={onBack}>返回开局道具</button> : null}{onReroll ? <button disabled={wholeRerollsRemaining <= 0} onClick={onReroll}>牌有问题（{wholeRerollsRemaining}）</button> : null}{onSingleReroll ? <button disabled={singleRerollsRemaining <= 0 || focusedOrigin === "memory"} onClick={onSingleReroll}>我要发功（{singleRerollsRemaining}）</button> : null}{onInspect ? <button disabled={inspected || inspectRemaining <= 0} onClick={onInspect}>{inspected ? "已验牌" : `我要验牌（${inspectRemaining}）`}</button> : null}<button onClick={() => setFocusIndex((focusIndex + candidates.length - 1) % candidates.length)}>上一只</button><button onClick={() => setFocusIndex((focusIndex + 1) % candidates.length)}>下一只</button><button onClick={() => onToggle(focusIndex)}>{selectLabel}</button><button disabled={selected.length !== 3} onClick={onStart}>开始挑战</button></div></div></div>;
}

function PokemonProfile({pokemon, selected = false, runtime, compact = false, revealTraining = false}: {pokemon: RentalPokemon; selected?: boolean; runtime?: RuntimePokemon; compact?: boolean; revealTraining?: boolean}) {
  return <div className={`pokemon-profile ${compact ? "compact" : ""}`}><aside className="profile-card"><span>No.{pokemon.sprite?.national_dex || "?"}</span><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge="full" /><h2>{displayName(pokemon)}</h2><p>{pokemon.species}</p><p>Lv{pokemon.level} {pokemon.gender}</p>{selected ? <strong>已选中</strong> : null}</aside><section className="profile-info"><h3>{pokemon.types_zh.join(" / ")}　{pokemon.nature_zh}</h3><div className="info-strip"><span>特性</span><strong>{pokemon.ability_zh}</strong><span>道具</span><strong>{pokemon.item_zh || "无"}</strong><span>HP</span><strong>{runtime ? conditionText(runtime.condition) : pokemon.stats.hp}</strong></div><div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></div>)}</div><div className="moves-panel">{pokemon.moves.map(move => <div className="move-detail" key={move.id}><strong>{move.name_zh}</strong><span>{move.type_zh}/{move.category_zh}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span><p>{moveDescription(move)}</p></div>)}</div></section></div>;
}

function visualCueForEvent(event: BattleTimelineEvent, battle: BattleState, displayedNames: {p1: string; p2: string}): BattleVisualCue | null {
  if (event.type === "move") {
    const actingSide = event.side || "p1";
    const team = actingSide === "p1" ? battle.player_display : battle.enemy_display;
    const pokemon = findDisplay(team, event.source_id || displayedNames[actingSide]);
    const summary = moveSummaryByName(pokemon, event.move);
    const moveKey = event.move ? `move:${toId(event.move)}` : "";
    const typeKey = `move_type:${typeId(summary?.type || summary?.type_zh)}`;
    const entry = battleEffectEntry(moveKey) || battleEffectEntry(typeKey) || battleEffectEntry("move_type:normal");
    return cueFromEntry(entry, event, entry?.visual || "normal-hit", actingSide, event.targetSide || (actingSide === "p1" ? "p2" : "p1"));
  }
  if (event.type === "damage") return cueFromEntry(battleEffectEntry("battle_action:damage"), event, "impact");
  if (event.type === "heal") return cueFromEntry(battleEffectEntry("battle_action:heal"), event, "heal");
  if (event.type === "faint") return cueFromEntry(battleEffectEntry("battle_action:faint"), event, "faint");
  if (event.type === "boost") return cueFromEntry(battleEffectEntry("battle_action:boost"), event, "boost");
  if (event.type === "item") return cueFromEntry(battleEffectEntry("battle_action:item"), event, "item");
  if (event.type === "ability") return cueFromEntry(battleEffectEntry("battle_action:ability"), event, "ability");
  if (event.type === "status") {
    const key = event.effect ? `status:${statusEffectId(event.effect)}` : "";
    return cueFromEntry(battleEffectEntry(key) || battleEffectEntry("status:confusion"), event, "status");
  }
  if (event.type === "weather") {
    const effect = toId(event.effect || event.text);
    const key = effect.includes("rain") || event.text.includes("雨") ? "weather:rain" : effect.includes("sun") || event.text.includes("晴") ? "weather:sun" : effect.includes("hail") || event.text.includes("雪") || event.text.includes("冰雹") ? "weather:hail" : effect.includes("sand") || event.text.includes("沙暴") ? "weather:sand" : "";
    return cueFromEntry(battleEffectEntry(key), event, key ? key.replace("weather:", "") : "field");
  }
  if (event.type === "field") {
    const effect = toId(event.effect || event.text);
    const sideKey = effect.includes("stealthrock") || event.text.includes("隐形岩") ? "side_condition:stealthrock" : effect.includes("toxicspikes") || event.text.includes("毒菱") ? "side_condition:toxicspikes" : effect.includes("spikes") || event.text.includes("撒菱") ? "side_condition:spikes" : effect.includes("reflect") || event.text.includes("反射壁") ? "side_condition:reflect" : effect.includes("lightscreen") || event.text.includes("光墙") ? "side_condition:lightscreen" : "";
    const fieldKey = effect.includes("trickroom") || event.text.includes("戏法空间") ? "field:trickroom" : effect.includes("electricterrain") || event.text.includes("电气") ? "field:electricterrain" : effect.includes("grassyterrain") || event.text.includes("青草") ? "field:grassyterrain" : effect.includes("mistyterrain") || event.text.includes("薄雾") ? "field:mistyterrain" : effect.includes("psychicterrain") || event.text.includes("精神") ? "field:psychicterrain" : "";
    const entry = battleEffectEntry(sideKey) || battleEffectEntry(fieldKey);
    return cueFromEntry(entry, event, entry?.visual || "field");
  }
  return null;
}

function BattleEffectLayer({cue}: {cue: BattleVisualCue | null}) {
  if (!cue) return null;
  return <div className={`battle-effect-layer anchor-${cue.anchor} side-${cue.side || "none"} target-${cue.targetSide || "none"}`} style={{"--cue-duration": `${cue.durationMs}ms`} as CSSProperties}><div className={`battle-effect effect-${cue.visual}`}><i /><i /><i /><i /><i /><i /></div></div>;
}

function BattleView({battle, battleBag, mode, setMode, onChoice, choicePending, pendingTransition, onBattleAnimationDone}: {battle: BattleState | null; battleBag: BagCategoryView | null; mode: AppStatus; setMode: (mode: AppStatus) => void; onChoice: (choice: string) => void; choicePending?: boolean; pendingTransition: DesktopGameState | null; onBattleAnimationDone: (state: DesktopGameState) => void}) {
  const player = activePokemon(battle, "p1");
  const enemy = activePokemon(battle, "p2");
  const finalConditions = {
    p1: player.runtime?.condition || battle?.tracker.active.p1.condition || "",
    p2: battle?.tracker.active.p2.condition || "",
  };
  const finalActiveNames = {
    p1: battle?.tracker.active.p1.name || runtimeName(player.runtime) || "",
    p2: battle?.tracker.active.p2.name || "",
  };
  const finalSubstitutes = {
    p1: Boolean(battle?.tracker.active.p1.substitute),
    p2: Boolean(battle?.tracker.active.p2.substitute),
  };
  const finalFaintedSides = {
    p1: statusCode(finalConditions.p1) === "fnt",
    p2: statusCode(finalConditions.p2) === "fnt",
  };
  const recentEvents = battle?.recent_events.filter(event => event && !event.startsWith("--- 第")) || [];
  const turnEvents = battle ? lastEvents(battle, 14) : [];
  const timelineEvents = battle?.timeline_events || [];
  const timelineKey = timelineEvents.map(event => `${event.id}:${event.text}`).join("\n");
  const recentKey = recentEvents.join("\n");
  const [shownEvents, setShownEvents] = useState(turnEvents);
  const [currentTimelineEvent, setCurrentTimelineEvent] = useState<BattleTimelineEvent | null>(null);
  const [currentVisualCue, setCurrentVisualCue] = useState<BattleVisualCue | null>(null);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [displayConditions, setDisplayConditions] = useState(finalConditions);
  const [displayedActiveNames, setDisplayedActiveNames] = useState(finalActiveNames);
  const [displayedSubstitutes, setDisplayedSubstitutes] = useState(finalSubstitutes);
  const [hpTransitionMs, setHpTransitionMs] = useState({p1: 1400, p2: 1400});
  const [faintedSides, setFaintedSides] = useState({p1: false, p2: false});
  const [introActive, setIntroActive] = useState(false);
  const [trainerIntroActive, setTrainerIntroActive] = useState(false);
  const [dialogue, setDialogue] = useState<TrainerDialogueState | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [itemTargetIndex, setItemTargetIndex] = useState(0);
  const [battleItemOpen, setBattleItemOpen] = useState(false);
  const previousTimelineKeys = useRef<string[]>([]);
  const previousRecentEvents = useRef<string[]>([]);
  const displayConditionsRef = useRef(displayConditions);
  const displayedActiveNamesRef = useRef(displayedActiveNames);
  const displayedSubstitutesRef = useRef(displayedSubstitutes);
  const previousBattlePresent = useRef(false);
  const introDialoguePending = useRef(false);
  const bossDialogueSelection = useRef<{key: string; index: number} | null>(null);
  const pokemonIntroTimer = useRef<number | null>(null);
  const eventTimers = useRef<number[]>([]);
  const playbackRun = useRef(0);
  const finishRequested = useRef(false);

  function selectedDialogueGroupIndex(activeBattle: BattleState | null): number | undefined {
    if (!activeBattle) return undefined;
    const variant = bossDialogueVariant(activeBattle.enemy_boss_record);
    const groups = bossDialogueGroups(activeBattle.enemy_trainer, variant);
    if (!groups.length) return undefined;
    const key = battleDialogueKey(activeBattle);
    if (!bossDialogueSelection.current || bossDialogueSelection.current.key !== key) {
      bossDialogueSelection.current = {key, index: Math.floor(Math.random() * groups.length)};
    }
    return bossDialogueSelection.current.index;
  }

  useEffect(() => { displayConditionsRef.current = displayConditions; }, [displayConditions]);
  useEffect(() => { displayedActiveNamesRef.current = displayedActiveNames; }, [displayedActiveNames]);
  useEffect(() => { displayedSubstitutesRef.current = displayedSubstitutes; }, [displayedSubstitutes]);
  useEffect(() => {
    const battlePresent = Boolean(battle);
    if (battlePresent && !previousBattlePresent.current) {
      const enemy = battle?.enemy_trainer;
      introDialoguePending.current = true;
      setDialogue({
        kind: "intro",
        speaker: trainerDisplayName(enemy),
        title: trainerDialogueTitle(enemy),
        lines: trainerDialogueLines(enemy, "intro", selectedDialogueGroupIndex(battle), bossDialogueVariant(battle?.enemy_boss_record)),
        index: 0,
      });
      setTrainerIntroActive(true);
      setIntroActive(false);
      previousBattlePresent.current = true;
    }
    previousBattlePresent.current = battlePresent;
    if (!battlePresent) {
      introDialoguePending.current = false;
      bossDialogueSelection.current = null;
      setIntroActive(false);
      setTrainerIntroActive(false);
      setDialogue(null);
      if (pokemonIntroTimer.current) {
        window.clearTimeout(pokemonIntroTimer.current);
        pokemonIntroTimer.current = null;
      }
    }
  }, [Boolean(battle)]);

  function playerWonBattle(activeBattle: BattleState): boolean {
    const winner = String(activeBattle.winner || "").toLowerCase();
    if (!winner || winner === "tie") return false;
    return !["enemy", "opponent", "对手"].includes(winner);
  }

  function beginBattleOutro(activeBattle: BattleState, transition: DesktopGameState | null) {
    if (!transition || finishRequested.current) return;
    finishRequested.current = true;
    const enemy = activeBattle.enemy_trainer;
    const moment: TrainerDialogueMoment = playerWonBattle(activeBattle) ? "defeat" : "victory";
    setDetailIndex(null);
    setBattleItemOpen(false);
    setMode("battleMain");
    setIntroActive(false);
    setTrainerIntroActive(true);
    setDialogue({
      kind: "outro",
      speaker: trainerDisplayName(enemy),
      title: trainerDialogueTitle(enemy),
      lines: trainerDialogueLines(enemy, moment, selectedDialogueGroupIndex(activeBattle), bossDialogueVariant(activeBattle.enemy_boss_record)),
      index: 0,
    });
  }

  function advanceBattleDialogue() {
    if (!dialogue) return;
    if (dialogue.index < dialogue.lines.length - 1) {
      setDialogue(current => current ? {...current, index: current.index + 1} : current);
      return;
    }
    if (dialogue.kind === "intro") {
      introDialoguePending.current = false;
      setDialogue(null);
      setTrainerIntroActive(false);
      setIntroActive(true);
      if (pokemonIntroTimer.current) window.clearTimeout(pokemonIntroTimer.current);
      pokemonIntroTimer.current = window.setTimeout(() => {
        setIntroActive(false);
        pokemonIntroTimer.current = null;
      }, 1180);
      return;
    }
    setDialogue(null);
    setTrainerIntroActive(false);
    if (pendingTransition) onBattleAnimationDone(pendingTransition);
  }

  useEffect(() => {
    playbackRun.current += 1;
    const runId = playbackRun.current;
    eventTimers.current.forEach(timer => window.clearTimeout(timer));
    eventTimers.current = [];
    const wait = (ms: number) => new Promise<void>(resolve => {
      const timer = window.setTimeout(resolve, ms);
      eventTimers.current.push(timer);
    });

    if (!battle) {
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setTrainerIntroActive(false);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayedSubstitutes(finalSubstitutes);
      setDisplayConditions(finalConditions);
      setFaintedSides(finalFaintedSides);
      previousRecentEvents.current = [];
      return;
    }
    if (!battle.ended) finishRequested.current = false;
    if (introDialoguePending.current || dialogue) {
      setPlaybackActive(false);
      return;
    }

    const keys = timelineEvents.map(event => `${event.id}:${event.text}`);
    const known = new Set(previousTimelineKeys.current);
    const addedTimeline = timelineEvents.filter((event, index) => !known.has(keys[index]));
    previousTimelineKeys.current = keys;
    const addedTexts = addedRecentEventTexts(previousRecentEvents.current, recentEvents);
    previousRecentEvents.current = recentEvents;
    const timelinePool = [...addedTimeline];
    const addedFromRecent = addedTexts.map((text, index) => {
      const timelineIndex = timelinePool.findIndex(event => event.text === text);
      if (timelineIndex >= 0) {
        const [event] = timelinePool.splice(timelineIndex, 1);
        return event;
      }
      return {id: `recent-${playbackRun.current}-${index}`, type: "message", text} as BattleTimelineEvent;
    });
    const added = addedFromRecent.length ? [...addedFromRecent, ...timelinePool] : addedTimeline;

    if (!added.length) {
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      setDisplayedSubstitutes(finalSubstitutes);
      if (battle.ended && pendingTransition && !finishRequested.current) {
        beginBattleOutro(battle, pendingTransition);
      }
      return;
    }

    const activeBattle = battle;
    async function playQueue() {
      setPlaybackActive(true);
      if (trainerIntroActive) {
        await wait(1750);
        if (playbackRun.current !== runId) return;
      }
      if (introActive) {
        await wait(920);
        if (playbackRun.current !== runId) return;
      }
      for (const event of added) {
        if (playbackRun.current !== runId) return;
        const duration = timelineDuration(event, displayConditionsRef.current[event.targetSide || "p1"]);
        setCurrentTimelineEvent(event);
        setShownEvents(events => [...events, event.text].slice(-14));
        if (event.type === "switch" && event.targetSide && event.target_id) {
          const oldName = displayedActiveNamesRef.current[event.targetSide];
          if (oldName && oldName !== event.target_id) {
            setCurrentVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_out"), event, "switch-out", event.targetSide, event.targetSide));
            await wait(520);
          }
          const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
          displayedActiveNamesRef.current = nextNames;
          setDisplayedActiveNames(nextNames);
          const nextSubstitutes = {...displayedSubstitutesRef.current, [event.targetSide]: false};
          displayedSubstitutesRef.current = nextSubstitutes;
          setDisplayedSubstitutes(nextSubstitutes);
          setFaintedSides(current => ({...current, [event.targetSide!]: false}));
          setCurrentVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_in"), event, "switch-in", event.targetSide, event.targetSide));
        }
        if (event.type === "form" && event.targetSide && event.target_id) {
          const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
          displayedActiveNamesRef.current = nextNames;
          setDisplayedActiveNames(nextNames);
        }
        if (event.type === "substitute" && event.targetSide) {
          const nextSubstitutes = {...displayedSubstitutesRef.current, [event.targetSide]: Boolean(event.substitute)};
          displayedSubstitutesRef.current = nextSubstitutes;
          setDisplayedSubstitutes(nextSubstitutes);
        }
        if (event.type !== "switch") {
          setCurrentVisualCue(visualCueForEvent(event, activeBattle, displayedActiveNamesRef.current));
        }
        if (["damage", "heal"].includes(event.type) && event.targetSide) {
          await wait(Math.min(520, Math.max(260, duration * 0.22)));
          if (playbackRun.current !== runId) return;
          setHpTransitionMs(current => ({...current, [event.targetSide!]: duration}));
        }
        if (event.targetSide && event.condition && ["damage", "heal", "switch", "faint"].includes(event.type)) {
          const nextConditions = {...displayConditionsRef.current, [event.targetSide]: event.condition};
          displayConditionsRef.current = nextConditions;
          setDisplayConditions(nextConditions);
        }
        if (event.type === "faint" && event.targetSide) {
          setFaintedSides(current => ({...current, [event.targetSide!]: true}));
        }
        await wait(duration);
        setCurrentVisualCue(null);
      }
      if (playbackRun.current !== runId) return;
      await wait(420);
      if (playbackRun.current !== runId) return;
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setShownEvents(lastEvents(activeBattle, 14));
      displayConditionsRef.current = finalConditions;
      displayedActiveNamesRef.current = finalActiveNames;
      displayedSubstitutesRef.current = finalSubstitutes;
      setDisplayConditions(finalConditions);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayedSubstitutes(finalSubstitutes);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      if (activeBattle.ended && pendingTransition && !finishRequested.current) {
        beginBattleOutro(activeBattle, pendingTransition);
      }
    }

    void playQueue();
    return () => {
      eventTimers.current.forEach(timer => window.clearTimeout(timer));
      eventTimers.current = [];
    };
  }, [timelineKey, recentKey, dialogue?.kind]);

  if (!battle) return <div className="loading-panel"><strong>正在进入对局...</strong></div>;
  const hasQueuedPlayback = timelineEvents.some((event, index) => !previousTimelineKeys.current.includes(`${event.id}:${event.text}`)) || addedRecentEventTexts(previousRecentEvents.current, recentEvents).length > 0;
  const controlsDisabled = Boolean(choicePending) || playbackActive || hasQueuedPlayback || introActive || trainerIntroActive || Boolean(dialogue);
  const displayPlayer = findDisplay(battle.player_display, displayedActiveNames.p1) || player.display;
  const displayEnemy = findDisplay(battle.enemy_display, displayedActiveNames.p2) || enemy.display;
  const playerSprite = displayedSubstitutes.p1 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const enemySprite = displayedSubstitutes.p2 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const activePlayerIndex = Math.max(0, battle.request?.side?.pokemon?.findIndex(pokemon => pokemon.active) ?? 0);
  const messageDuration = currentTimelineEvent ? timelineDuration(currentTimelineEvent, displayConditions[currentTimelineEvent.targetSide || "p1"]) : 1600;
  const messageMs = currentTimelineEvent?.notice_title ? Math.max(2200, messageDuration) : Math.max(900, messageDuration);
  const detailOpen = detailIndex !== null || mode === "teamMenu";
  const detailInitialIndex = detailIndex ?? activePlayerIndex;
  return (
    <div className={`battle-layout ${dialogue ? "battle-dialogue-active" : ""}`} onClick={dialogue ? advanceBattleDialogue : undefined}>
      <section className={`battle-field ${trainerIntroActive ? "trainer-intro" : ""} ${introActive ? "battle-intro" : ""} ${battleAnimationClass(currentTimelineEvent)}`}>
        <div className="battle-platforms" aria-hidden="true">
          <i className="battle-platform player-platform" />
          <i className="battle-platform enemy-platform" />
        </div>
        <FieldEffectsOverlay battle={battle} />
        <BattleEffectLayer cue={currentVisualCue} />
        {trainerIntroActive ? <TrainerIntroOverlay battle={battle} /> : null}
        <div className="turn-badge">第 {battle.tracker.turn} 回合</div>
        <div className="battle-corner-actions">
          <button disabled={controlsDisabled} onClick={() => setMode("statusMenu")}>状态</button>
          <button className="danger-button" disabled={controlsDisabled} onClick={() => onChoice("forfeit")}>认输</button>
        </div>
        <FighterPanel side="enemy" pokemon={displayEnemy} condition={displayConditions.p2} status={battle.tracker.active.p2.status} substitute={displayedSubstitutes.p2} transitionMs={hpTransitionMs.p2} />
        <div className="battle-sprites">
          <PokemonSprite className={`back-sprite ${displayedSubstitutes.p1 ? "substitute-sprite" : ""} ${faintedSides.p1 ? "sprite-fainted" : ""}`} pokemon={displayedSubstitutes.p1 ? undefined : displayPlayer} src={playerSprite} variant="back_normal" alt={displayPlayer ? displayName(displayPlayer) : "我方宝可梦"} entrance={!displayedSubstitutes.p1 && introActive} onClick={() => setDetailIndex(activePlayerIndex)} />
          <PokemonSprite className={`front-sprite ${displayedSubstitutes.p2 ? "substitute-sprite" : ""} ${faintedSides.p2 ? "sprite-fainted" : ""}`} pokemon={displayedSubstitutes.p2 ? undefined : displayEnemy} src={enemySprite} alt={displayEnemy ? displayName(displayEnemy) : "对手宝可梦"} entrance={!displayedSubstitutes.p2 && introActive} />
        </div>
        <FighterPanel side="player" pokemon={displayPlayer} condition={displayConditions.p1} status={battle.tracker.active.p1.status} substitute={displayedSubstitutes.p1} transitionMs={hpTransitionMs.p1} onClick={() => setDetailIndex(activePlayerIndex)} />
        {currentTimelineEvent ? <div key={currentTimelineEvent.id} className={`battle-message-pop ${currentTimelineEvent.notice_title ? "structured" : ""}`} style={{"--message-duration": `${messageMs}ms`} as CSSProperties}>{currentTimelineEvent.notice_title ? <><strong>{currentTimelineEvent.notice_title}</strong>{currentTimelineEvent.notice_detail ? <small>{currentTimelineEvent.notice_detail}</small> : null}</> : currentTimelineEvent.text}</div> : null}
      </section>
      <section className={`battle-bottom ${dialogue ? "dialogue-bottom-active" : ""}`}>
        {dialogue ? (
          <BattleDialogueBox dialogue={dialogue} />
        ) : (
          <>
            <div className="battle-log"><strong>上一回合</strong>{shownEvents.map((event, index) => <p className={event === currentTimelineEvent?.text ? "current-event" : ""} key={`${event}-${index}`}>{event}</p>)}</div>
            <div className={`battle-action-panel ${controlsDisabled ? "battle-controls-disabled" : ""}`}>{mode === "moveMenu" ? <MoveMenu battle={battle} disabled={controlsDisabled} onMove={index => onChoice(`move ${index}`)} onBack={() => setMode("battleMain")} /> : <MainBattleCommands forceSwitch={Boolean(battle.request?.forceSwitch)} disabled={controlsDisabled} setMode={setMode} onBag={() => { setItemTargetIndex(activePlayerIndex); setBattleItemOpen(true); }} />}</div>
          </>
        )}
      </section>
      {mode === "statusMenu" && !dialogue ? <StatusModal battle={battle} onBack={() => setMode("battleMain")} /> : null}
      {detailOpen && !dialogue ? <PokemonDetailModal battle={battle} initialIndex={detailInitialIndex} disabled={controlsDisabled} onSwitch={index => onChoice(`switch ${index}`)} onClose={() => { setDetailIndex(null); if (mode === "teamMenu") setMode("battleMain"); }} /> : null}
      {battleItemOpen && !dialogue ? <BattleItemModal battle={battle} bag={battleBag} initialTarget={itemTargetIndex} onClose={() => setBattleItemOpen(false)} onUse={(itemId, target, moveSlot) => { setBattleItemOpen(false); onChoice(`item ${itemId} ${target + 1}${moveSlot ? ` ${moveSlot}` : ""}`); }} /> : null}
    </div>
  );
}

function TrainerIntroOverlay({battle}: {battle: BattleState}) {
  const player = battle.player_trainer;
  const enemy = battle.enemy_trainer;
  const enemyName = enemy?.name_zh || "训练师";
  const playerImage = trainerImageUrl(player, "back");
  const enemyImage = trainerImageUrl(enemy, "frontGif");
  return (
    <div className="trainer-intro-layer">
      {playerImage ? <span className="trainer-stand trainer-player-stand"><i /><img className="trainer-sprite trainer-player" src={playerImage} alt={player?.name_zh || "玩家"} /></span> : null}
      {enemyImage ? <span className="trainer-stand trainer-enemy-stand"><i /><img className="trainer-sprite trainer-enemy" src={enemyImage} alt={enemyName} /></span> : null}
    </div>
  );
}

function BattleDialogueBox({dialogue}: {dialogue: TrainerDialogueState}) {
  const line = dialogue.lines[dialogue.index] || "";
  return (
    <div className="battle-dialogue-box">
      <div className="battle-dialogue-name">
        <strong>{dialogue.speaker}</strong>
        <span>{dialogue.title}</span>
      </div>
      <p>{line}</p>
      <i aria-hidden="true">▼</i>
    </div>
  );
}

function FighterPanel({pokemon, condition, status, side, substitute, transitionMs, onClick}: {pokemon?: RentalPokemon; condition?: string; status?: string; side: "player" | "enemy"; substitute?: boolean; transitionMs?: number; onClick?: () => void}) {
  const hp = parseHp(condition);
  const code = statusCode(condition, status);
  const tone = hpTone(hp);
  return <div className={`fighter-panel ${side} ${onClick ? "clickable-panel" : ""}`} onClick={onClick}><strong>{pokemon ? displayName(pokemon) : "未知"}</strong><span>Lv{pokemon?.level || 50}</span>{code ? <i className={`status-badge ${code}`}>{statusLabel(code)}</i> : null}{substitute ? <i className="substitute-badge">替身</i> : null}<div className="hp-line"><i className={`hp-${tone}`} style={{width: `${hp ? Math.max(0, (hp.current / hp.max) * 100) : 0}%`, "--hp-duration": `${transitionMs || 1400}ms`} as CSSProperties} /></div><small>{hp?.text || conditionText(condition)}</small></div>;
}

function FieldEffectsOverlay({battle}: {battle: BattleState}) {
  const weather = battle.tracker.weather && battle.tracker.weather !== "无" ? [battle.tracker.weather] : [];
  return <div className="field-effects"><div className="field-effects-row global">{[...weather, ...battle.tracker.field].map(effect => <EffectBadge key={effect} effect={effect} />)}</div><div className="field-effects-row enemy-side">{battle.tracker.side_conditions.p2.map(effect => <EffectBadge key={effect} effect={effect} />)}</div><div className="field-effects-row player-side">{battle.tracker.side_conditions.p1.map(effect => <EffectBadge key={effect} effect={effect} />)}</div></div>;
}

function EffectBadge({effect}: {effect: string}) {
  return <span className="effect-badge"><b>{effectIcon(effect)}</b>{effect}</span>;
}

function effectIcon(effect: string): string {
  if (effect.includes("撒菱") || effect.includes("Spikes")) return "△";
  if (effect.includes("隐形岩") || effect.includes("Stealth Rock")) return "◆";
  if (effect.includes("毒菱") || effect.includes("Toxic Spikes")) return "◇";
  if (effect.includes("沙暴")) return "S";
  if (effect.includes("雨") || effect.includes("Rain")) return "R";
  if (effect.includes("晴") || effect.includes("Sun")) return "D";
  if (effect.includes("雪") || effect.includes("冰雹") || effect.includes("Hail")) return "H";
  if (effect.includes("电气") || effect.includes("青草") || effect.includes("薄雾") || effect.includes("精神")) return "T";
  return "*";
}

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: {rock: 0.5, ghost: 0, steel: 0.5},
  fire: {fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2},
  water: {fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5},
  electric: {water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5},
  grass: {fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5},
  ice: {fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5},
  fighting: {normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5},
  poison: {grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2},
  ground: {fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2},
  flying: {electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5},
  psychic: {fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5},
  bug: {fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5},
  rock: {fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5},
  ghost: {normal: 0, psychic: 2, ghost: 2, dark: 0.5},
  dragon: {dragon: 2, steel: 0.5, fairy: 0},
  dark: {fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5},
  steel: {fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2},
  fairy: {fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5},
};

function moveTypeClass(summary: MoveSummary | undefined): string {
  return `move-type-${typeId(summary?.type || summary?.type_zh) || "normal"}`;
}

function moveTypeLabel(summary: MoveSummary | undefined): string {
  const raw = summary?.type_zh || summary?.type || "?";
  return raw === "超能力" ? "超" : raw === "一般" ? "普" : raw;
}

function moveEffectiveness(summary: MoveSummary | undefined, target: RentalPokemon | undefined): number {
  const attackType = typeId(summary?.type || summary?.type_zh);
  if (!attackType || !target) return 1;
  const targetTypes = [...(target.types || []), ...(target.types_zh || [])].map(typeId).filter(Boolean);
  const uniqueTypes = [...new Set(targetTypes)];
  return uniqueTypes.reduce((multiplier, defenseType) => multiplier * (TYPE_CHART[attackType]?.[defenseType] ?? 1), 1);
}

function boostedStat(value: number | undefined, stage: number | undefined): number {
  const base = Math.max(1, Number(value || 1));
  const boost = Math.max(-6, Math.min(6, Number(stage || 0)));
  return boost >= 0 ? base * (2 + boost) / 2 : base * 2 / (2 - boost);
}

function moveDamageRangeLabel(summary: MoveSummary | undefined, attacker: RentalPokemon | undefined, target: RentalPokemon | undefined, battle: BattleState): string | null {
  if (!battle.show_move_effectiveness) return null;
  if (!summary || !attacker || !target) return "--";
  if (!Number(summary.power || 0) || /status/i.test(summary.category || "") || summary.category_zh === "变化") return "--";
  const category = /special/i.test(summary.category || "") || summary.category_zh === "特殊" ? "special" : "physical";
  const attackStat = category === "special" ? "spa" : "atk";
  const defenseStat = category === "special" ? "spd" : "def";
  const attack = boostedStat(attacker.stats?.[attackStat], battle.tracker.boosts.p1?.[attackStat]);
  const defense = boostedStat(target.stats?.[defenseStat], battle.tracker.boosts.p2?.[defenseStat]);
  const level = Number(attacker.level || 50);
  const baseDamage = Math.floor(Math.floor(Math.floor((2 * level / 5 + 2) * Number(summary.power) * attack / Math.max(1, defense)) / 50) + 2);
  const attackType = typeId(summary.type || summary.type_zh);
  const stab = attackType && [...(attacker.types || []), ...(attacker.types_zh || [])].map(typeId).includes(attackType) ? 1.5 : 1;
  const effectiveness = moveEffectiveness(summary, target);
  const maxHp = parseHp(battle.tracker.active.p2?.condition)?.max || Number(target.stats?.hp || 1);
  if (effectiveness <= 0) return "0%";
  const maxDamage = Math.floor(baseDamage * stab * effectiveness);
  const minDamage = Math.floor(maxDamage * 0.85);
  const minPercent = Math.max(0, Math.floor(minDamage / Math.max(1, maxHp) * 100));
  const maxPercent = Math.max(minPercent, Math.ceil(maxDamage / Math.max(1, maxHp) * 100));
  return `${minPercent}%~${maxPercent}%`;
}

function effectivenessLabel(multiplier: number): string {
  if (multiplier <= 0) return "没有效果";
  if (multiplier > 1) return "效果拔群";
  if (multiplier < 1) return "收效甚微";
  return "效果一般";
}

function MainBattleCommands({forceSwitch, disabled, setMode, onBag}: {forceSwitch: boolean; disabled?: boolean; setMode: (mode: AppStatus) => void; onBag: () => void}) {
  return <div className="command-grid battle-command-grid">{forceSwitch ? <button disabled={disabled} onClick={() => setMode("teamMenu")}>换人</button> : <button disabled={disabled} onClick={() => setMode("moveMenu")}>战斗</button>}<button disabled={disabled} onClick={() => setMode("teamMenu")}>宝可梦</button><button disabled={disabled || forceSwitch} onClick={onBag}>背包</button></div>;
}

function MoveMenu({battle, disabled, onMove, onBack}: {battle: BattleState; disabled?: boolean; onMove: (index: number) => void; onBack: () => void}) {
  const moves = battle.request?.active?.[0]?.moves || [];
  const active = activePokemon(battle, "p1").display;
  const target = activePokemon(battle, "p2").display;
  return <div className="move-menu">{moves.map((move, index) => { const summary = moveSummaryFor(active, move); const multiplier = moveEffectiveness(summary, target); const showEffect = Boolean(battle.show_move_effectiveness); const superEffective = Boolean(showEffect && multiplier > 1); const damageRange = moveDamageRangeLabel(summary, active, target, battle); return <button className={`move-choice ${moveTypeClass(summary)} ${superEffective ? "move-super-effective" : ""}`} key={move.id || index} disabled={disabled || move.disabled} onClick={() => onMove(index + 1)}><span className="move-name-row"><strong>{summary?.name_zh || move.move}</strong>{showEffect ? <i>{effectivenessLabel(multiplier)}</i> : null}{damageRange ? <small className="damage-range">{damageRange}</small> : null}</span><span className="move-meta-row"><b>{moveTypeLabel(summary)}</b><em>PP {move.pp}/{move.maxpp}</em><em>威力 {summary?.power || "--"}</em></span></button>; })}<div className="move-footer"><button className="menu-back" disabled={disabled} onClick={onBack}>返回</button><div className="battle-system-row"><button disabled title="后续系统槽">Mega</button><button disabled title="后续系统槽">Z</button><button disabled title="后续系统槽">极巨化</button><button disabled title="后续系统槽">太晶化</button></div></div></div>;
}

function TeamMenu({battle, disabled, onSwitch, onBack}: {battle: BattleState; disabled?: boolean; onSwitch: (index: number) => void; onBack: () => void}) {
  const rows = battle.request?.side?.pokemon || [];
  const [focus, setFocus] = useState(0);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  return <div className="team-menu"><div className="team-list">{rows.map((runtime, index) => { const display = findDisplay(battle.player_display, runtimeName(runtime)); const status = statusCode(runtime.condition); return <div className={`team-row ${focus === index ? "selected" : ""}`} key={runtime.ident}><button className="team-summary" disabled={disabled} onClick={() => { setFocus(index); setDetailIndex(index); }}><span>{runtime.active ? "▶" : `${index + 1}.`}</span><strong>{display ? displayName(display) : runtimeName(runtime)}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<small>{conditionText(runtime.condition)}　{runtime.item || ""}</small></button></div>; })}<button disabled={disabled} onClick={onBack}>返回</button></div>{detailIndex !== null ? <PokemonDetailModal battle={battle} initialIndex={detailIndex} disabled={disabled} onSwitch={onSwitch} onClose={() => setDetailIndex(null)} /> : null}</div>;
}

function PokemonDetailModal({battle, initialIndex, disabled, onSwitch, onClose}: {battle: BattleState; initialIndex: number; disabled?: boolean; onSwitch: (index: number) => void; onClose: () => void}) {
  const rows = battle.request?.side?.pokemon || [];
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, Math.min(initialIndex, Math.max(0, rows.length - 1))));
  const [tab, setTab] = useState<"basic" | "moves">("basic");
  const runtime = rows[selectedIndex] || rows[0];
  const pokemon = findDisplay(battle.player_display, runtimeName(runtime)) || battle.player_display[selectedIndex] || battle.player_display[0];
  const status = statusCode(runtime?.condition);
  const canSwitch = Boolean(runtime) && !runtime.active && status !== "fnt";
  const activeMoves = runtime?.active ? battle.request?.active?.[0]?.moves || [] : [];
  const revealTraining = Boolean(battle.player_talents?.some(talent => talent.id === "intel_god_eye"));

  useEffect(() => {
    setSelectedIndex(Math.max(0, Math.min(initialIndex, Math.max(0, rows.length - 1))));
  }, [initialIndex, rows.length]);

  if (!pokemon) return null;

  function ppText(move: MoveSummary): string {
    const runtimeMove = activeMoves.find(entry => toId(entry.id || entry.move) === toId(move.id || move.name));
    if (!runtimeMove) return `PP ${move.pp}`;
    return `PP ${runtimeMove.pp ?? move.pp}/${runtimeMove.maxpp ?? move.pp}`;
  }

  return (
    <div className="modal-layer">
      <section className="pokemon-detail-modal">
        <aside className="detail-team-list">
          {rows.map((entry, index) => {
            const display = findDisplay(battle.player_display, runtimeName(entry)) || battle.player_display[index];
            const code = statusCode(entry.condition);
            return (
              <button className={selectedIndex === index ? "selected" : ""} onClick={() => setSelectedIndex(index)} key={`${entry.ident}-${index}`}>
                <PokemonSprite pokemon={display} alt={display ? displayName(display) : runtimeName(entry)} />
                <span>{entry.active ? "▶ " : ""}{display ? displayName(display) : runtimeName(entry)}</span>
                {code ? <i className={`status-badge ${code}`}>{statusLabel(code)}</i> : null}
                <small>{conditionText(entry.condition)}</small>
              </button>
            );
          })}
        </aside>
        <section className="detail-main">
          <header>
            <div>
              <h2>{displayName(pokemon)}</h2>
              <p>{pokemon.species}　Lv{pokemon.level} {pokemon.gender}</p>
            </div>
            <div className="detail-tabs">
              <button className={tab === "basic" ? "selected" : ""} onClick={() => setTab("basic")}>基础信息</button>
              <button className={tab === "moves" ? "selected" : ""} onClick={() => setTab("moves")}>技能</button>
            </div>
          </header>
          <div className="detail-content">
            {tab === "basic" ? (
              <div className="detail-basic">
                <div className="detail-portrait">
                  <span>No.{pokemon.sprite?.national_dex || "?"}</span>
                  <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge="full" />
                  <strong>{pokemon.types_zh.join(" / ") || pokemon.types.join(" / ")}</strong>
                </div>
                <div className="detail-info">
                  <div className="info-strip">
                    <span>性格</span><strong>{pokemon.nature_zh || pokemon.nature || "未知"}</strong>
                    <span>特性</span><strong>{pokemon.ability_zh || pokemon.ability || "未知"}</strong>
                    <span>HP</span><strong>{conditionText(runtime?.condition)}</strong>
                    <span>道具</span><strong>{pokemon.item_zh || runtime?.item || "无"}</strong>
                    <span>定位</span><strong>{pokemon.role_zh || pokemon.role || "未标注"}</strong>
                  </div>
                  <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></div>)}</div>
                  <p><b>特性说明：</b>{pokemon.ability_desc_zh || pokemon.ability_desc || "暂无说明"}</p>
                  <p><b>道具说明：</b>{pokemon.item_desc_zh || pokemon.item_desc || "无道具"}</p>
                </div>
              </div>
            ) : (
              <div className="detail-moves">
                {pokemon.moves.map(move => <div className="move-detail" key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span><span>{ppText(move)}</span><p>{moveDescription(move)}</p></div>)}
              </div>
            )}
          </div>
          <footer>
            <button disabled={disabled || !canSwitch} onClick={() => { onSwitch(selectedIndex + 1); onClose(); }}>换人</button>
            <button onClick={onClose}>关闭</button>
          </footer>
        </section>
      </section>
    </div>
  );
}

function BattleItemModal({battle, bag, initialTarget, onClose, onUse}: {battle: BattleState; bag: BagCategoryView | null; initialTarget: number; onClose: () => void; onUse: (itemId: string, target: number, moveSlot?: number) => void}) {
  const [target, setTarget] = useState(Math.max(0, initialTarget));
  const [moveSlot, setMoveSlot] = useState(0);
  const [itemId, setItemId] = useState("");
  const items = bag?.consumable || [];
  const selected = items.find(item => item.id === itemId) || items[0];
  const rows = battle.request?.side?.pokemon || [];
  const targetRuntime = rows[target] || rows[0];
  const targetDisplay = findDisplay(battle.player_display, runtimeName(targetRuntime)) || battle.player_display[target] || battle.player_display[0];
  const activeMoves = targetRuntime?.active ? battle.request?.active?.[0]?.moves || [] : [];

  return (
    <div className="modal-layer">
      <section className="shop-modal bag-manage-modal battle-bag-modal">
        <header><div><h2>战斗背包</h2><p>战斗中只能使用消耗类道具。</p></div><button onClick={onClose}>关闭</button></header>
        <div className="bag-manage-layout">
          <div className="shop-list bag-item-list">
            {items.length ? items.map(item => <button className={selected?.id === item.id ? "selected" : ""} onClick={() => setItemId(item.id)} key={item.id}><ItemIcon item={item} /><strong>{item.name_zh || item.name}</strong><span>x{item.count}　{itemCategoryLabel(item.category)}</span><small>{item.desc_zh || item.desc || item.name}</small></button>) : <p>当前没有可在战斗中使用的消耗道具。</p>}
          </div>
          <section className="bag-action-panel">
            {selected ? <>
              <h3>{selected.name_zh || selected.name}</h3>
              <p>{itemCategoryLabel(selected.category)}　x{selected.count}</p>
              <div className="detail-team-list compact-targets">
                {rows.map((entry, index) => {
                  const display = findDisplay(battle.player_display, runtimeName(entry)) || battle.player_display[index];
                  return <button className={target === index ? "selected" : ""} onClick={() => { setTarget(index); setMoveSlot(0); }} key={`${entry.ident}-item-target`}><PokemonSprite pokemon={display} alt={display ? displayName(display) : runtimeName(entry)} /><span>{display ? displayName(display) : runtimeName(entry)}</span><small>{conditionText(entry.condition)}</small></button>;
                })}
              </div>
              {activeMoves.length ? <select value={moveSlot} onChange={event => setMoveSlot(Number(event.target.value))}><option value={0}>不指定技能</option>{activeMoves.map((move, index) => <option value={index + 1} key={`${move.id}-${index}`}>{move.move} PP {move.pp}/{move.maxpp}</option>)}</select> : null}
              <p>{targetDisplay ? `目标：${displayName(targetDisplay)}` : "选择目标宝可梦"}</p>
              <div className="command-row"><button onClick={() => onUse(selected.id, target, moveSlot || undefined)}>使用</button></div>
            </> : <p>当前没有可在战斗中使用的消耗道具。</p>}
          </section>
        </div>
      </section>
    </div>
  );
}

function StatusModal({battle, onBack}: {battle: BattleState; onBack: () => void}) {
  return <div className="modal-layer"><section className="status-modal"><header><h2>对局状态</h2><button onClick={onBack}>关闭</button></header><div className="status-grid"><p>回合：{battle.tracker.turn}</p><p>天气：{battle.tracker.weather || "无"}</p><p>全场：{battle.tracker.field.join(" / ") || "无"}</p><p>我方场地：{battle.tracker.side_conditions.p1.join(" / ") || "无"}</p><p>对手场地：{battle.tracker.side_conditions.p2.join(" / ") || "无"}</p><p>我方能力：{boostSummary(battle.tracker.boosts.p1)}</p><p>对手能力：{boostSummary(battle.tracker.boosts.p2)}</p></div><h3>最近战报</h3><div className="status-events">{lastEvents(battle, 14).map((event, index) => <small key={index}>{event}</small>)}</div></section></div>;
}

function lastEvents(battle: BattleState, limit = 5): string[] {
  return battle.recent_events.filter(event => event && !event.startsWith("--- 第")).slice(-limit);
}

function addedRecentEventTexts(previous: string[], current: string[]): string[] {
  let overlap = 0;
  const maxOverlap = Math.min(previous.length, current.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    const previousTail = previous.slice(previous.length - size);
    const currentHead = current.slice(0, size);
    if (previousTail.every((text, index) => text === currentHead[index])) {
      overlap = size;
      break;
    }
  }
  return current.slice(overlap);
}

function timelineDuration(event: BattleTimelineEvent, previousCondition?: string): number {
  const faster = (ms: number) => Math.max(500, ms - 500);
  if (event.type === "damage" || event.type === "heal") {
    const previous = parseHp(previousCondition);
    const next = event.hp || parseHp(event.condition);
    const ratio = previous && next && previous.max > 0 ? Math.abs(previous.current - next.current) / previous.max : 0.25;
    return faster(Math.round(Math.max(1000, Math.min(5000, 1000 + ratio * 4000))));
  }
  if (event.type === "move") return faster(2600);
  if (event.type === "faint") return faster(2600);
  if (event.type === "switch") return faster(2300);
  if (event.type === "win") return faster(2600);
  return faster(2100);
}

function battleAnimationClass(event: BattleTimelineEvent | null): string {
  if (!event) return "";
  if (event.type === "move" && event.side === "p1") return "player-acting";
  if (event.type === "move" && event.side === "p2") return "enemy-acting";
  if (event.type === "damage" && event.targetSide === "p1") return "player-hit";
  if (event.type === "damage" && event.targetSide === "p2") return "enemy-hit";
  if (event.type === "heal" && event.targetSide === "p1") return "player-heal";
  if (event.type === "heal" && event.targetSide === "p2") return "enemy-heal";
  if (event.type === "faint" && event.targetSide === "p1") return "player-faint";
  if (event.type === "faint" && event.targetSide === "p2") return "enemy-faint";
  return "";
}

function boostSummary(boosts: Record<string, number>): string {
  const labels: Record<string, string> = {atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度", accuracy: "命中", evasion: "闪避"};
  const rows = Object.entries(boosts).filter(([, value]) => value !== 0);
  if (!rows.length) return "无";
  return rows.map(([stat, value]) => `${labels[stat] || stat}${value > 0 ? "+" : ""}${value}`).join(" / ");
}

function ExchangeView({exchange, onSkip, onExchange}: {exchange: DesktopGameState["exchange"]; onSkip: () => void; onExchange: (ownIndex: number, enemyIndex: number) => void}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  if (!exchange) return null;
  return <div className="exchange-page"><h2>胜利后交换</h2><div className="exchange-columns"><div><h3>你的队伍</h3>{exchange.player_display.map((pokemon, index) => <button className={`exchange-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div><div><h3>敌方队伍</h3>{exchange.enemy_display.map((pokemon, index) => <button className={`exchange-card ${enemy === index ? "selected" : ""}`} onClick={() => setEnemy(index)} key={pokemon.species_id}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>)}</div></div><div className="command-row"><button onClick={() => onExchange(own, enemy)}>交换</button><button onClick={onSkip}>跳过</button></div></div>;
}

function RestView({rest, message, onAction}: {rest: DesktopGameState["rest"]; message?: string; onAction: (action: RestAction) => void | Promise<void>}) {
  const [pokemonModalSlot, setPokemonModalSlot] = useState<number | null>(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [recyclerOpen, setRecyclerOpen] = useState(false);
  const [talentOpen, setTalentOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [moveEditorSlot, setMoveEditorSlot] = useState<number | null>(null);
  const [statsEditorSlot, setStatsEditorSlot] = useState<number | null>(null);
  const [abortConfirmOpen, setAbortConfirmOpen] = useState(false);

  if (!rest) return <div className="loading-panel"><strong>正在整理队伍...</strong></div>;
  const allBagItems = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  const hasScoutTalent = hasRunTalent(rest, "intel_rumor");
  const nightSkyRows = rest.night_sky?.rows || [];
  const revealedSkyCount = nightSkyRows.reduce((sum, row) => sum + Math.min(3, Number(row.revealed || 0)), 0);

  return (
    <div className="rest-page">
      <header className="rest-header">
        <div>
          <h2>休整菜单</h2>
          <p>第 {rest.battle_no}/{rest.battles} 场后　连胜 {rest.wins}　金币 {rest.coins ?? 0}</p>
          <button className="talent-inline-button" onClick={() => setTalentOpen(true)}>本局天赋：{rest.talents?.length ? rest.talents.map(talent => `${talent.name}（${talent.category}）`).join(" / ") : "当前无天赋"}</button>
          {message ? <p className="rest-message">{message}</p> : null}
        </div>
        <div className="rest-header-insights">
          {hasScoutTalent ? (
            <button className="rest-scout-box compact" onClick={() => setTalentOpen(true)}>
              <strong>小道消息</strong>
              <span>本局训练师 {nightSkyRows.length || rest.battles} 行，已揭示 {revealedSkyCount} 只。</span>
            </button>
          ) : null}
        </div>
        <div className="rest-header-actions">
          <button onClick={() => setExchangeOpen(true)}>交换</button>
          <button onClick={() => setBagOpen(true)}>背包</button>
          {rest.recycler_available ? <button className="event-button" onClick={() => setRecyclerOpen(true)}>道具回收商</button> : null}
          <button onClick={() => setShopOpen(true)}>购买道具</button>
          <button className="danger-button" onClick={() => setAbortConfirmOpen(true)}>中断挑战</button>
          <button onClick={() => onAction({type: "next"})}>下一场</button>
        </div>
      </header>
      <section className="rest-team-panel">
        <h3>你的队伍</h3>
        <div className="rest-team-list">
          {rest.player_display.map((pokemon, index) => {
            const state = rest.player_state[index];
            const status = statusCode(state?.condition, state?.status);
            return <button className="rest-team-card" onClick={() => setPokemonModalSlot(index)} key={`${pokemon.species_id}-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><strong>{index + 1}. {displayName(pokemon)}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<span>{conditionText(state?.condition)}</span><small>{pokemon.item_zh || "无道具"}　{(state?.moves || []).map(move => `${move.move} ${move.pp}/${move.maxpp}`).join(" / ")}</small></button>;
          })}
        </div>
      </section>
      <section className="rest-summary-panel">
        <h3>局内资源</h3>
        <div className="rest-summary-grid">
          <button onClick={() => setBagOpen(true)}><strong>{allBagItems.reduce((sum, item) => sum + Number(item.count || 0), 0)}</strong><span>背包道具</span></button>
          <button onClick={() => setShopOpen(true)}><strong>{rest.shop?.offers?.length || 0}</strong><span>商店商品</span></button>
          <button onClick={() => setExchangeOpen(true)}><strong>{rest.exchange_count}/3</strong><span>已交换</span></button>
          <button onClick={() => setTalentOpen(true)}><strong>{rest.talents?.length || 0}/{TALENT_EQUIP_LIMIT}</strong><span>携带天赋</span></button>
        </div>
      </section>
      {pokemonModalSlot !== null ? <RestPokemonModal rest={rest} initialSlot={pokemonModalSlot} onClose={() => setPokemonModalSlot(null)} onMove={slot => { setPokemonModalSlot(null); setMoveEditorSlot(slot); }} onUnequip={slot => { setPokemonModalSlot(null); onAction({type: "unequip_item", slot}); }} onStats={slot => { setPokemonModalSlot(null); setStatsEditorSlot(slot); }} /> : null}
      {exchangeOpen ? <RestExchangeModal rest={rest} onClose={() => setExchangeOpen(false)} onAction={onAction} /> : null}
      {bagOpen ? <BagManageModal rest={rest} onClose={() => setBagOpen(false)} onAction={onAction} /> : null}
      {recyclerOpen ? <ItemRecyclerModal rest={rest} onClose={() => setRecyclerOpen(false)} onAction={onAction} /> : null}
      {talentOpen ? <RunTalentModal rest={rest} onClose={() => setTalentOpen(false)} onAction={onAction} /> : null}
      {shopOpen ? <ShopModal rest={rest} shop={rest.shop} onClose={() => setShopOpen(false)} onRoll={preferredCategory => onAction({type: "roll_shop", preferredCategory})} onBuy={offerId => onAction({type: "buy_shop_offer", offerId})} /> : null}
      {moveEditorSlot !== null ? <MoveAdjustModal rest={rest} initialSlot={moveEditorSlot} onClose={() => setMoveEditorSlot(null)} onAction={onAction} /> : null}
      {statsEditorSlot !== null ? <StatsAdjustModal rest={rest} initialSlot={statsEditorSlot} onClose={() => setStatsEditorSlot(null)} onAction={onAction} /> : null}
      {abortConfirmOpen ? (
        <div className="modal-layer">
          <section className="confirm-modal">
            <h2>中断挑战</h2>
            <p>确认后将直接结束本局挑战，当前连胜归零，历史最高连胜保留。</p>
            <div className="command-row">
              <button className="danger-button" onClick={() => { setAbortConfirmOpen(false); onAction({type: "abort"}); }}>确认中断</button>
              <button onClick={() => setAbortConfirmOpen(false)}>取消</button>
            </div>
          </section>
        </div>
      ) : null}
      {rest.all_in_pending_next ? (
        <div className="modal-layer">
          <section className="confirm-modal all-in-result-modal">
            <h2>孤注一掷</h2>
            <p>{rest.all_in_result ? `${rest.all_in_result.old_name} 被替换成了 ${rest.all_in_result.new_name}。` : "替换已经完成。"}</p>
            <p>队伍内另外两只宝可梦已陷入半血睡眠状态，即将结束休整。</p>
            <div className="command-row">
              <button onClick={() => onAction({type: "next"})}>进入下一场</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function hasRunTalent(rest: NonNullable<DesktopGameState["rest"]>, id: string): boolean {
  return Boolean(rest.talents?.some(talent => talent.id === id));
}

function isActiveRunTalent(id: string): boolean {
  return ["growth_all_in", "intel_rumor", "intel_shop_strategy", "intel_reroute", "exchange_trust", "growth_lead_change", "economy_bp_exchange", "economy_recycle_receipt", "economy_portfolio", "economy_bargainer"].includes(id);
}

function RestPokemonModal({rest, initialSlot, onClose, onMove, onUnequip, onStats}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot: number; onClose: () => void; onMove: (slot: number) => void; onUnequip: (slot: number) => void; onStats: (slot: number) => void}) {
  const [slot, setSlot] = useState(initialSlot);
  const [tab, setTab] = useState<"info" | "moves" | "stats" | "items">("info");
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const state = rest.player_state[slot] || rest.player_state[0];
  const revealTraining = hasRunTalent(rest, "intel_god_eye");
  if (!pokemon) return null;
  return (
    <div className="modal-layer">
      <section className="rest-pokemon-modal">
        <aside className="detail-team-list">
          {rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => setSlot(index)} key={`${entry.species_id}-rest-detail`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span><small>{conditionText(rest.player_state[index]?.condition)}</small></button>)}
        </aside>
        <main className="rest-pokemon-detail">
          <header>
            <div><h2>{displayName(pokemon)}</h2><p>Lv{pokemon.level}　{pokemon.types_zh?.join(" / ") || pokemon.types.join(" / ")}　{pokemon.item_zh || "无道具"}</p></div>
            <button onClick={onClose}>关闭</button>
          </header>
          <div className="detail-tabs">
            <button className={tab === "info" ? "selected" : ""} onClick={() => setTab("info")}>基础信息</button>
            <button className={tab === "moves" ? "selected" : ""} onClick={() => setTab("moves")}>技能</button>
            <button className={tab === "stats" ? "selected" : ""} onClick={() => setTab("stats")}>数值</button>
            <button className={tab === "items" ? "selected" : ""} onClick={() => setTab("items")}>道具</button>
          </div>
          <section className="detail-tab-panel">
            {tab === "info" ? <div className="detail-info-grid"><p>HP：{conditionText(state?.condition)}</p><p>性别：{pokemon.gender || "未知"}</p><p>特性：{pokemon.ability_zh || pokemon.ability}</p><p>性格：{pokemon.nature_zh || pokemon.nature}</p><p>闪光：{pokemon.shiny ? "是" : "否"}</p><p>职责：{pokemon.role_zh || pokemon.role || "无"}</p><p className="wide">{pokemon.ability_desc_zh || pokemon.ability_desc || "暂无特性说明"}</p></div> : null}
            {tab === "moves" ? <div className="detail-move-list">{pokemon.moves.map((move, index) => <article key={`${move.id}-${index}`}><strong>{index + 1}. {move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {state?.moves?.[index]?.pp ?? move.pp}/{state?.moves?.[index]?.maxpp ?? move.pp}</span><small>{moveDescription(move)}</small></article>)}</div> : null}
            {tab === "stats" ? <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></div>)}</div> : null}
            {tab === "items" ? <div className="detail-info-grid"><p>当前携带：{pokemon.item_zh || "无道具"}</p><p className="wide">{pokemon.item_desc_zh || pokemon.item_desc || "暂无道具说明"}</p><p>背包携带道具：{rest.bag_categories?.held?.length || 0}</p><p>技能机器：{rest.bag_categories?.tm?.length || 0}</p></div> : null}
          </section>
          <footer className="command-row">
            <button onClick={() => onMove(slot)}>更换技能</button>
            {pokemon.item_id ? <button onClick={() => onUnequip(slot)}>卸下道具</button> : null}
            <button onClick={() => onStats(slot)}>重置数值</button>
            <button onClick={onClose}>关闭</button>
          </footer>
        </main>
      </section>
    </div>
  );
}

function RestExchangeModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const canExchange = rest.costs.exchange !== null && rest.enemy_display.length > 0 && !rest.taken_enemy_slots.includes(enemy + 1);
  const canAllIn = hasRunTalent(rest, "growth_all_in") && !rest.all_in_used;
  return (
    <div className="modal-layer">
      <section className="rest-edit-modal exchange-rest-modal">
        <header><div><h2>交换宝可梦</h2><p>本次费用：{coinCostLabel(rest.costs.exchange)}　已交换 {rest.exchange_count}/3</p></div><button onClick={onClose}>关闭</button></header>
        <div className="rest-exchange-grid">
          <div>{rest.player_display.map((pokemon, index) => <button className={`mini-pokemon-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={`${pokemon.species_id}-own-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
          <div>{rest.enemy_display.map((pokemon, index) => <button className={`mini-pokemon-card ${enemy === index ? "selected" : ""}`} disabled={rest.taken_enemy_slots.includes(index + 1)} onClick={() => setEnemy(index)} key={`${pokemon.species_id}-enemy-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span>{rest.taken_enemy_slots.includes(index + 1) ? <small>已交换</small> : null}</button>)}</div>
        </div>
        <div className="command-row">
          <button disabled={!canExchange} onClick={() => onAction({type: "exchange", ownIndex: own, enemyIndex: enemy})}>确认交换</button>
          {hasRunTalent(rest, "growth_all_in") ? <button disabled={!canAllIn} onClick={() => onAction({type: "all_in_exchange", ownIndex: own})}>{rest.all_in_used ? "孤注一掷已用" : "孤注一掷"}</button> : null}
          <button onClick={onClose}>关闭</button>
        </div>
      </section>
    </div>
  );
}

function tmMoveId(item?: BagItemView): string {
  if (!item) return "";
  if (item.move_id) return toId(item.move_id);
  return item.id.startsWith("tm:") ? toId(item.id.slice(3)) : "";
}

function BagManageModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  const [itemId, setItemId] = useState(items[0]?.id || "");
  const [target, setTarget] = useState(0);
  const [moveSlot, setMoveSlot] = useState(0);
  const [tmLegalBySlot, setTmLegalBySlot] = useState<Record<number, string[]>>({});
  const [tmLoading, setTmLoading] = useState(false);
  const selected = items.find(item => item.id === itemId) || items[0];
  const targetPokemon = rest.player_display[target] || rest.player_display[0];
  const targetState = rest.player_state[target] || rest.player_state[0];
  const selectedMoveId = tmMoveId(selected);
  const isTm = selected?.category === "tm";
  const isConsumable = selected?.category === "consumable";
  const isHeld = selected?.category === "held";

  useEffect(() => {
    if (items.length && !items.some(item => item.id === itemId)) setItemId(items[0].id);
  }, [items, itemId]);

  useEffect(() => {
    let cancelled = false;
    setMoveSlot(0);
    setTmLegalBySlot({});
    if (!isTm || !selectedMoveId) return () => { cancelled = true; };
    setTmLoading(true);
    void Promise.all(rest.player_display.map((_pokemon, index) => window.changeBattle!.learnableMoves(index).then(moves => [index, moves.map(move => toId(move.id || move.name))] as const))).then(entries => {
      if (cancelled) return;
      setTmLegalBySlot(Object.fromEntries(entries));
    }).finally(() => {
      if (!cancelled) setTmLoading(false);
    });
    return () => { cancelled = true; };
  }, [isTm, selectedMoveId, rest.player_display]);

  function targetAlreadyKnows(slot: number): boolean {
    const pokemon = rest.player_display[slot];
    return Boolean(selectedMoveId && pokemon?.moves.some(move => toId(move.id || move.name) === selectedMoveId));
  }

  function targetCanLearn(slot: number): boolean {
    if (!isTm) return true;
    if (!selectedMoveId || targetAlreadyKnows(slot)) return false;
    return Boolean(tmLegalBySlot[slot]?.includes(selectedMoveId));
  }

  function targetHint(slot: number): string {
    if (!isTm) return conditionText(rest.player_state[slot]?.condition);
    if (tmLoading) return "读取可学习技能...";
    if (targetAlreadyKnows(slot)) return "已学会";
    return targetCanLearn(slot) ? "可以学习" : "不能学习";
  }

  function useSelectedItem() {
    if (!selected) return;
    if (isConsumable) {
      onAction({type: "use_item", itemId: selected.id, slot: target, moveSlot: moveSlot || undefined, context: "rest"});
      onClose();
    } else if (isTm) {
      if (!targetCanLearn(target)) return;
      onAction({type: "use_tm", itemId: selected.id, slot: target, moveSlot});
      onClose();
    } else if (isHeld) {
      onAction({type: "equip_item", itemId: selected.id, slot: target});
      onClose();
    }
  }

  function actionLabel(): string {
    if (!selected) return "选择道具";
    if (isConsumable) return "使用";
    if (isTm) return targetCanLearn(target) ? "学习" : "不能学习";
    return targetPokemon?.item_id ? "交换携带道具" : "携带";
  }

  return (
    <div className="modal-layer">
      <section className="shop-modal bag-manage-modal">
        <header><div><h2>本局背包</h2><p>选择道具后，再选择目标宝可梦。</p></div><button onClick={onClose}>关闭</button></header>
        <div className="bag-manage-layout">
          <div className="shop-list bag-item-list">
            {items.length ? items.map(item => <button className={selected?.id === item.id ? "selected" : ""} onClick={() => setItemId(item.id)} key={item.id}><ItemIcon item={item} /><strong>{item.name_zh || item.name}</strong><span>x{item.count}　{itemCategoryLabel(item.category)}</span><small>{item.desc_zh || item.desc || item.name}</small></button>) : <p>背包为空。</p>}
          </div>
          <section className="bag-action-panel">
            {selected ? <>
              <h3>{selected.name_zh || selected.name}</h3>
              <p>{itemCategoryLabel(selected.category)}　x{selected.count}</p>
              <div className="detail-team-list compact-targets">
                {rest.player_display.map((pokemon, index) => {
                  const disabled = isTm && !tmLoading && !targetCanLearn(index);
                  return <button className={target === index ? "selected" : ""} disabled={disabled} onClick={() => { setTarget(index); setMoveSlot(0); }} key={`${pokemon.species_id}-bag-target-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{targetHint(index)}</small></button>;
                })}
              </div>
              {isTm && targetPokemon ? <div className="move-slot-row">{targetPokemon.moves.map((move, index) => <button className={moveSlot === index ? "selected" : ""} disabled={!targetCanLearn(target)} onClick={() => setMoveSlot(index)} key={`${move.id}-tm-slot-${index}`}>{index + 1}. {move.name_zh}</button>)}</div> : null}
              {isConsumable && (targetState?.moves || []).length ? <select value={moveSlot} onChange={event => setMoveSlot(Number(event.target.value))}><option value={0}>不指定技能</option>{(targetState.moves || []).map(move => <option value={move.slot} key={`${move.id}-${move.slot}-bag`}>{move.move} PP {move.pp}/{move.maxpp}</option>)}</select> : null}
              {isHeld && targetPokemon?.item_id ? <p className="item-return-hint">当前携带 {targetPokemon.item_zh || targetPokemon.item}，装备后旧道具会回到背包。</p> : null}
              <div className="command-row">
                <button disabled={!selected || (isTm && (tmLoading || !targetCanLearn(target)))} onClick={useSelectedItem}>{actionLabel()}</button>
              </div>
            </> : <p>背包为空。</p>}
          </section>
        </div>
      </section>
    </div>
  );
}

function ItemRecyclerModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  return (
    <div className="modal-layer">
      <section className="shop-modal bag-manage-modal recycler-modal">
        <header>
          <div>
            <h2>道具回收商</h2>
            <p>本次休整可以出售背包道具。回收票据流水 {coinCostLabel(rest.recycle_receipt_value || 0)}</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="shop-list recycler-list">
          {items.length ? items.map(item => (
            <button onClick={() => onAction({type: "sell_item", itemId: item.id})} key={`recycler-${item.id}`}>
              <ItemIcon item={item} />
              <strong>{item.name_zh || item.name}</strong>
              <span>x{item.count}　回收 {coinCostLabel(item.sell_price)}</span>
              <small>{itemCategoryLabel(item.category)}　{item.desc_zh || item.desc || item.name}</small>
            </button>
          )) : <p>背包为空。</p>}
        </div>
      </section>
    </div>
  );
}

function RunTalentModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [allInSlot, setAllInSlot] = useState(0);
  const [trustSlot, setTrustSlot] = useState(0);
  const [leadSlot, setLeadSlot] = useState(0);
  const [bpAmount, setBpAmount] = useState(1);
  const canAllIn = hasRunTalent(rest, "growth_all_in") && !rest.all_in_used;

  function talentActionPanel(talent: TalentView) {
    if (talent.id === "intel_rumor") {
      const rows = rest.night_sky?.rows || [];
      return <div className="night-sky-board">{rows.length ? rows.map(row => {
        const trainerImage = trainerImageUrl(row.trainer, "avatar") || trainerImageUrl(row.trainer, "front");
        return (
          <article className="night-sky-row" key={`night-sky-${row.battle_no}`}>
            <div className="night-sky-trainer">{trainerImage ? <img src={trainerImage} alt={row.trainer.name_zh} /> : null}<span>第 {row.battle_no} 场</span><strong>{row.trainer.name_zh || row.trainer.id}</strong><small>{row.label}</small></div>
            <div className="night-sky-slots">{row.enemies.map((enemy, index) => enemy ? <div className="night-sky-pokemon" key={`${row.battle_no}-${enemy.species_id}-${index}`}><PokemonSprite pokemon={enemy} alt={displayName(enemy)} /><span>{displayName(enemy)}</span></div> : <div className="night-sky-pokemon night-sky-unknown" key={`${row.battle_no}-unknown-${index}`}><i>?</i><span>未查看</span></div>)}</div>
            <div className="night-sky-actions"><button disabled={Number(row.revealed || 0) >= 1} onClick={() => onAction({type: "night_sky_scout", battleNo: row.battle_no, level: "one"})}>免费查看一只</button><button disabled={Boolean(row.unlocked)} onClick={() => onAction({type: "night_sky_scout", battleNo: row.battle_no, level: "all"})}>300金币 解锁三只</button></div>
          </article>
        );
      }) : <p>小道消息尚未展开。</p>}</div>;
    }
    if (talent.id === "growth_all_in") {
      return (
        <div className="talent-card-actions">
          <div className="talent-target-row compact">
            {rest.player_display.map((pokemon, index) => (
              <button className={allInSlot === index ? "selected" : ""} disabled={Boolean(rest.all_in_used)} onClick={() => setAllInSlot(index)} key={`${pokemon.species_id}-all-in-${index}`}>
                <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
                <span>{index + 1}. {displayName(pokemon)}</span>
              </button>
            ))}
          </div>
          <button disabled={!canAllIn} onClick={() => onAction({type: "all_in_exchange", ownIndex: allInSlot})}>{rest.all_in_used ? "孤注一掷已用" : `孤注一掷：${displayName(rest.player_display[allInSlot])}`}</button>
        </div>
      );
    }
    if (talent.id === "intel_reroute") {
      const preview = rest.next_opponent_preview;
      const used = rest.reroute_used || 0;
      const limit = rest.reroute_limit || 3;
      return (
        <div className="talent-card-actions">
          <div className="talent-run-mini">
            <strong>{preview ? `第 ${preview.battle_no} 场：${preview.trainer.name_zh}` : "没有可改道的下一场"}</strong>
            <span>{preview?.label || "本局已接近结束"}　{used}/{limit}</span>
          </div>
          <button disabled={!preview || used >= limit || preview.trainer.type === "champion"} onClick={() => onAction({type: "reroute_next"})}>{used >= limit ? "次数已用尽" : "更换下一场对手"}</button>
        </div>
      );
    }
    if (talent.id === "exchange_trust") {
      return (
        <div className="talent-card-actions">
          <div className="talent-target-row compact">
            {rest.player_display.map((pokemon, index) => (
              <button className={trustSlot === index ? "selected" : ""} disabled={Boolean(rest.trust_level_used)} onClick={() => setTrustSlot(index)} key={`${pokemon.species_id}-trust-${index}`}>
                <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
                <span>{index + 1}. {displayName(pokemon)} Lv{pokemon.level}</span>
              </button>
            ))}
          </div>
          <button disabled={Boolean(rest.trust_level_used)} onClick={() => onAction({type: "trust_level", slot: trustSlot})}>{rest.trust_level_used ? "本次已培养" : "培养信赖"}</button>
        </div>
      );
    }
    if (talent.id === "growth_lead_change") {
      return (
        <div className="talent-card-actions">
          <div className="talent-target-row compact">
            {rest.player_display.map((pokemon, index) => (
              <button className={leadSlot === index ? "selected" : ""} disabled={Boolean(rest.lead_change_used) || Boolean(rest.player_state[index]?.fainted)} onClick={() => setLeadSlot(index)} key={`${pokemon.species_id}-lead-${index}`}>
                <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
                <span>{index + 1}. {displayName(pokemon)}</span>
              </button>
            ))}
          </div>
          <button disabled={Boolean(rest.lead_change_used) || leadSlot === 0} onClick={() => onAction({type: "set_lead", slot: leadSlot})}>{rest.lead_change_used ? "本次已调整" : "设为首发"}</button>
        </div>
      );
    }
    if (talent.id === "economy_bp_exchange") {
      return (
        <div className="talent-card-actions bp-exchange-actions">
          <input type="number" min={1} max={99} value={bpAmount} onChange={event => setBpAmount(Math.max(1, Math.floor(Number(event.target.value || 1))))} />
          <button onClick={() => onAction({type: "bp_to_coins", bp: bpAmount})}>兑换 {bpAmount * 50} 金币</button>
        </div>
      );
    }
    if (talent.id === "economy_recycle_receipt" || talent.id === "economy_portfolio" || talent.id === "economy_bargainer") {
      const primary = talent.id === "economy_portfolio" ? (rest.portfolio_types?.join(" / ") || "暂无覆盖") : talent.id === "economy_recycle_receipt" ? coinCostLabel(rest.recycle_receipt_value || 0) : rest.recycler_available ? "回收商已出现" : "等待回收商";
      const secondary = talent.id === "economy_portfolio" ? "本局消费覆盖类型" : talent.id === "economy_recycle_receipt" ? "本局回收票据流水" : "回收商事件状态";
      return (
        <div className="talent-card-actions">
          <div className="talent-run-mini">
            <strong>{primary}</strong>
            <span>{secondary}</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="modal-layer">
      <section className="shop-modal talent-run-modal">
        <header><div><h2>本局天赋</h2><p>{rest.talents?.length ? "当前天赋效果会影响休整与结算。" : "当前无天赋。"}</p></div><button onClick={onClose}>关闭</button></header>
        <div className="talent-run-list">
          {rest.talents?.length ? rest.talents.map(talent => (
            <article className={`${isActiveRunTalent(talent.id) ? "active-talent-card" : ""} ${talent.id === "intel_rumor" ? "night-sky-card" : ""}`} key={talent.id}>
              <strong>{talent.name}</strong>
              <span>{talent.category}</span>
              <p>{talentShortText(talent)}</p>
              {talentActionPanel(talent)}
            </article>
          )) : <p>当前无天赋。</p>}
        </div>
      </section>
    </div>
  );
}

type ShopPreferredCategory = "healing" | "pp" | "berry" | "battle" | "tm";

function ShopModal({rest, shop, onClose, onRoll, onBuy}: {rest: NonNullable<DesktopGameState["rest"]>; shop: NonNullable<DesktopGameState["rest"]>["shop"]; onClose: () => void; onRoll: (preferredCategory?: ShopPreferredCategory) => void | Promise<void>; onBuy: (offerId: string) => void | Promise<void>}) {
  const offers = shop?.offers || [];
  const slotCount = shop?.slot_count || offers.length || 3;
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(offers.length));
  const [preferredCategory, setPreferredCategory] = useState<"" | ShopPreferredCategory>("");
  const purchased = Boolean(shop?.purchased_offer_id);
  const bonus = shop?.last_roll_bonus || null;
  const canChooseCategory = hasRunTalent(rest, "intel_shop_strategy");

  useEffect(() => {
    if (!offers.length) setRevealed(false);
    else if (!rolling) setRevealed(true);
  }, [offers.length, rolling]);

  async function roll() {
    setRolling(true);
    setRevealed(false);
    await onRoll(preferredCategory || undefined);
    window.setTimeout(() => {
      setRolling(false);
      setRevealed(true);
    }, 1300);
  }

  async function buy(offerId: string) {
    await onBuy(offerId);
    onClose();
  }

  return (
    <div className="modal-layer">
      <section className="shop-modal slot-shop-modal">
        <header>
          <div>
            <h2>随机商店</h2>
            <p>抽奖次数 {shop?.roll_count || 0}　下次抽奖 {coinCostLabel(shop?.next_roll_cost)}　{slotCount} 格{shop?.free_rolls_remaining ? `　额外免费 ${shop.free_rolls_remaining}` : ""}</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        {canChooseCategory ? (
          <div className="segmented-row">
            <button className={!preferredCategory ? "selected" : ""} onClick={() => setPreferredCategory("")}>随机</button>
            <button className={preferredCategory === "healing" ? "selected" : ""} onClick={() => setPreferredCategory("healing")}>恢复药</button>
            <button className={preferredCategory === "pp" ? "selected" : ""} onClick={() => setPreferredCategory("pp")}>PP药</button>
            <button className={preferredCategory === "berry" ? "selected" : ""} onClick={() => setPreferredCategory("berry")}>树果</button>
            <button className={preferredCategory === "battle" ? "selected" : ""} onClick={() => setPreferredCategory("battle")}>战斗道具</button>
            <button className={preferredCategory === "tm" ? "selected" : ""} onClick={() => setPreferredCategory("tm")}>技能机器</button>
            <span>{preferredCategory ? `指定加收 ${coinCostLabel(shop?.preferred_roll_cost || 100)}` : "不指定类型"}</span>
          </div>
        ) : null}
        <div className="command-row"><button disabled={rolling} onClick={roll}>抽奖（{coinCostLabel(shop?.next_roll_cost)}）</button><button onClick={onClose}>跳过</button></div>
        <div className={`slot-reels ${rolling ? "rolling" : ""}`} style={{"--slot-count": slotCount} as CSSProperties}>
          {Array.from({length: slotCount}, (_, index) => {
            const offer = offers[index % Math.max(1, offers.length)];
            return <div className="slot-reel" key={`slot-${index}`}><ItemIcon item={offer} /><span>{rolling ? "抽取中" : offer ? offer.name_zh || offer.name : "?"}</span></div>;
          })}
        </div>
        {bonus && revealed ? <div className="slot-bonus-pop"><strong>抽到 {bonus.match_count} 连！</strong><span>免费获得 {bonus.count} 个 {bonus.name_zh || bonus.name}</span></div> : null}
        {revealed && offers.length ? <div className="shop-card-grid" style={{"--slot-count": slotCount} as CSSProperties}>
          {offers.map(item => {
            const isPurchased = shop?.purchased_offer_id === item.offer_id;
            const isBonus = bonus?.item_id === toId(item.id || item.name);
            return (
              <article className={`shop-card ${isPurchased ? "purchased" : ""} ${isBonus ? "bonus" : ""}`} key={item.offer_id}>
                <ItemIcon item={item} />
                <strong>{item.name_zh || item.name}</strong>
                <span>{itemCategoryLabel(item.category)}　{coinCostLabel(item.cost)}</span>
                <small>{item.desc_zh || item.desc || item.name}</small>
                {isBonus ? <b>{bonus?.match_count} 连奖励</b> : null}
                <button disabled={purchased} onClick={() => buy(item.offer_id)}>{isPurchased ? "已购买" : "购买这张"}</button>
              </article>
            );
          })}
        </div> : !rolling ? <p className="slot-empty">还没有商品。点击抽奖，本局第一次免费。</p> : null}
      </section>
    </div>
  );
}

function MoveAdjustModal({rest, initialSlot = 0, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot?: number; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [slot, setSlot] = useState(initialSlot);
  const [moveSlot, setMoveSlot] = useState(0);
  const playerDisplay = rest.player_display || [];
  const pokemon = playerDisplay[slot] || playerDisplay[0];
  const pokemonMoves = pokemon?.moves || [];
  const currentMove = pokemonMoves[moveSlot];
  const draws = rest.move_draws?.[`${slot}:${moveSlot}`] || [];
  const tmItems = rest.bag_categories?.tm || [];
  const moveColumnCount = 1 + (tmItems.length ? 1 : 0);

  return (
    <div className="modal-layer">
      <section className="rest-edit-modal move-editor-modal">
        <header><h2>更换技能</h2><button onClick={onClose}>关闭</button></header>
        <div className="editor-layout">
          <aside className="editor-side-list">{playerDisplay.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => { setSlot(index); setMoveSlot(0); }} key={`${entry.species_id}-move-editor-${index}`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span></button>)}</aside>
          <section className="editor-main">
            <h3>{displayName(pokemon)}：替换 {currentMove?.name_zh || "选择招式格"}</h3>
            <div className="move-slot-row">{pokemonMoves.map((move, index) => <button className={moveSlot === index ? "selected" : ""} onClick={() => setMoveSlot(index)} key={`${move.id}-${index}`}>{index + 1}. {move.name_zh}</button>)}</div>
            <div className="move-editor-columns" style={{"--move-column-count": moveColumnCount} as CSSProperties}>
              <section>
                <div className="command-row"><button onClick={() => onAction({type: "draw_moves", slot, moveSlot})}>抽取候选（{coinCostLabel(rest.costs.move_draw)}）</button></div>
                <div className="learnable-list">{draws.length ? draws.map(move => <button onClick={() => { onAction({type: "apply_drawn_move", slot, moveSlot, moveId: move.id}); onClose(); }} key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {move.pp}</span><small>{moveDescription(move)}</small></button>) : <p>先抽取候选技能，再选择一个替换当前招式。</p>}</div>
              </section>
              {tmItems.length ? <section>
                <h4>技能机器</h4>
                <div className="learnable-list">{tmItems.map(item => <button onClick={() => { onAction({type: "use_tm", itemId: item.id, slot, moveSlot}); onClose(); }} key={item.id}><strong>{item.name_zh || item.name}</strong><span>x{item.count}</span><small>{item.desc_zh || item.desc || item.name}</small></button>)}</div>
              </section> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function StatsAdjustModal({rest, initialSlot = 0, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot?: number; onClose: () => void; onAction: (action: RestAction) => void}) {
  const [slot, setSlot] = useState(initialSlot);
  const pokemon = rest.player_display[slot];
  return (
    <div className="modal-layer">
      <section className="rest-edit-modal stats-editor">
        <header><h2>重置数值</h2><button onClick={onClose}>关闭</button></header>
        <div className="editor-layout">
          <aside className="editor-side-list">{rest.player_display.map((entry, index) => <button className={slot === index ? "selected" : ""} onClick={() => setSlot(index)} key={`${entry.species_id}-stats-editor`}><PokemonSprite pokemon={entry} alt={displayName(entry)} /><span>{displayName(entry)}</span></button>)}</aside>
          <section className="editor-main stats-editor-main">
            <header className="stats-editor-title">
              <h3>{displayName(pokemon)}</h3>
              <button className="dice-button" onClick={() => onAction({type: "randomize_all_stats", slot})}>🎲（{coinCostLabel(rest.costs.randomize_all)}）</button>
            </header>
            <div className="stats-meta-grid">
              <div><span>性格</span><strong>{pokemon.nature_zh || pokemon.nature || "未知"}</strong><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "nature"})}>🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></div>
              <div><span>特性</span><strong>{pokemon.ability_zh || pokemon.ability || "未知"}</strong><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "ability"})}>🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></div>
            </div>
            <div className="stat-reset-table">
              <div className="stat-reset-head"><span /><span>能力值</span><span><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "ivs"})}>个体 🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></span><span><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "evs"})}>努力值 🎲（{coinCostLabel(rest.costs.randomize_part)}）</button></span></div>
              {STAT_ROWS.map(([stat, label]) => <div className="stat-reset-row" key={stat}><span>{label}<b>{statMarker(pokemon, stat)}</b></span><strong>{pokemon.stats[stat] ?? "?"}</strong><strong>{pokemon.ivs[stat] ?? "?"}</strong><strong>{pokemon.evs[stat] ?? "?"}</strong></div>)}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function ResultView({message, onBack}: {message: string; onBack: () => void}) {
  return <div className="title-screen small"><h1>结算</h1><p>{message}</p><button onClick={onBack}>返回主界面</button></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
