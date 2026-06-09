import {Fragment} from "react";
import type {BagItemView, BattleMoveRequest, BattleState, BattleTimelineEvent, BossDexRecord, DesktopGameState, MoveSummary, RentalPokemon, RuntimePokemon, SpriteMapEntry, TalentView, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import battleEffectAssets from "../../../../data/battle_effect_assets.json";
import bossDialogueAssets from "../../../../data/boss_dialogues.json";

export const STAT_ROWS = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
] as const;

export type BattleEffectEntry = {
  visual: string;
  renderer?: "css" | "image" | "spritesheet";
  asset?: string;
  frames?: number;
  frame_width?: number;
  frame_height?: number;
  scale?: number;
  duration_ms?: number;
  anchor?: "target" | "field" | "side";
  target?: "source" | "opponent";
};

export type BattleVisualCue = {
  visual: string;
  renderer?: "css" | "image" | "spritesheet";
  asset?: string;
  frames?: number;
  frame_width?: number;
  frame_height?: number;
  scale?: number;
  side?: "p1" | "p2";
  targetSide?: "p1" | "p2";
  anchor: "target" | "field" | "side";
  durationMs: number;
};

export const BATTLE_EFFECTS = battleEffectAssets as {defaults: {duration_ms: number; anchor: "target" | "field" | "side"}; entries: Record<string, BattleEffectEntry>};
const BATTLE_CSS_EFFECT_SPEEDUP_MS = 500;
export const TYPE_ID_BY_ZH: Record<string, string> = {
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
export const STATUS_ID_BY_ZH: Record<string, string> = {
  灼伤: "brn",
  麻痹: "par",
  中毒: "psn",
  剧毒: "tox",
  睡眠: "slp",
  冰冻: "frz",
  混乱: "confusion",
  替身: "substitute",
  寄生种子: "leechseed",
  畏缩: "flinch",
  束缚: "trapped",
  挑衅: "taunt",
  再来一次: "encore",
  定身法: "disable",
  着迷: "attract",
  诅咒: "curse",
  封印: "imprison",
};
export const STATUS_ID_ALIASES: Record<string, string> = {
  burn: "brn",
  burned: "brn",
  paralysis: "par",
  paralyzed: "par",
  poison: "psn",
  poisoned: "psn",
  toxic: "tox",
  badlypoisoned: "tox",
  sleep: "slp",
  asleep: "slp",
  freeze: "frz",
  frozen: "frz",
  substitute: "substitute",
  leechseed: "leechseed",
  flinch: "flinch",
  trapped: "trapped",
  partiallytrapped: "trapped",
  taunt: "taunt",
  encore: "encore",
  disable: "disable",
  attract: "attract",
  curse: "curse",
  confusion: "confusion",
  confused: "confusion",
  imprison: "imprison",
  healblock: "healblock",
};
export const VOLATILE_STATUS_IDS = new Set(["substitute", "leechseed", "flinch", "trapped", "taunt", "encore", "disable", "attract", "curse", "imprison", "healblock"]);
export const SUBSTITUTE_DOLL_PATH = "assets/battle/substitute-doll.png";
export const TALENT_EQUIP_LIMIT = 7;
export const TALENT_CATALOG: TalentView[] = [
  {id: "starter_angel_fund", name: "天使基金", category: "开局筹备", cost: 20, desc: "开局获得 1000 金币，提前获得第一轮运营空间；剩余启动资金不会在结算时折算为 BP。"},
  {id: "starter_mentor_eye", name: "伯乐本乐", category: "开局筹备", cost: 25, desc: "开局选中的每只宝可梦有 33% 概率升 1 阶，仅限数值模板，最高 4 阶。"},
  {id: "starter_bag_expansion", name: "扩容背包", category: "开局筹备", cost: 20, desc: "开局道具每一类最多可以选择 2 个。"},
  {id: "starter_soulmate", name: "灵魂伴侣", category: "开局筹备", cost: 30, desc: "从上一局队伍和最后敌方队伍中追加回忆候选。"},
  {id: "exchange_trust", name: "不负信赖", category: "交换筑队", cost: 20, desc: "每场结束后可选择队内 1 只宝可梦提升 2 级，最高 55 级；溢出等级转为金币。"},
  {id: "exchange_gym_recognition", name: "馆主认可", category: "交换筑队", cost: 15, desc: "馆主和四天王宝可梦不再受默认只能交换 1 只的限制。"},
  {id: "exchange_careful", name: "爱护有加", category: "交换筑队", cost: 8, desc: "交换获得的宝可梦满 HP、满 PP 加入，并获取目标身上的道具。"},
  {id: "exchange_elite_training", name: "英才教育", category: "交换筑队", cost: 12, desc: "交换来的宝可梦品质更高；只改变阶级数值，不改变技能、特性和道具。"},
  {id: "exchange_stalwart", name: "坚毅不倒", category: "交换筑队", cost: 20, desc: "每场胜利后，存活宝可梦至少恢复到半血，濒死宝可梦恢复到 1/4 最大 HP。"},
  {id: "exchange_factory_freedom", name: "工厂自由", category: "交换筑队", cost: 40, desc: "所有交换免费，但不解除 Boss 交换次数限制。"},
  {id: "intel_rumor", name: "小道消息", category: "情报规划", cost: 30, desc: "休整时可查看本局训练师顺序，并逐步揭示他们的阵容。"},
  {id: "intel_god_eye", name: "上帝之眼", category: "情报规划", cost: 8, desc: "对战时显示技能打击效果，允许查看图鉴，并显示个体值和努力值。"},
  {id: "intel_shop_strategy", name: "神机妙算", category: "情报规划", cost: 18, desc: "商店抽奖前可额外花费金币指定道具方向。"},
  {id: "intel_reroute", name: "公子驾到", category: "情报规划", cost: 25, desc: "休整时可强行更换一个未挑战的同等级对手，每局最多 3 次。"},
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
  {id: "economy_premium_guest", name: "贵客专属", category: "经济运营", cost: 25, desc: "结束时自动处理剩余道具；通关或中断返还效率从 25% 提高到 50%，失败时从 10% 提高到 20%。"},
];

export type TrainerDialogueMoment = "intro" | "defeat" | "victory";
export type TrainerDialogueState = {
  kind: "intro" | "outro";
  speaker: string;
  title: string;
  lines: string[];
  index: number;
  trainer?: TrainerNpcView;
  playerTrainer?: TrainerNpcView;
  bossRecord?: BossDexRecord;
};

export type TrainerDialogueSet = Record<TrainerDialogueMoment, string[]>;
export type BossDialogueVariant = "default" | "first_meeting" | "after_player_win" | "after_player_loss" | "rematch";
export type BossDialogueEntry = TrainerDialogueSet[] | Partial<Record<BossDialogueVariant, TrainerDialogueSet[]>>;
export type BossDialogueCatalog = Record<string, BossDialogueEntry>;

export const BOSS_DIALOGUE_CATALOG = bossDialogueAssets as BossDialogueCatalog;

export const TRAINER_TYPE_LABELS: Record<TrainerNpcView["type"], string> = {
  player: "训练师",
  normal: "路人训练师",
  gym: "馆主",
  elite4: "四天王",
  champion: "冠军",
  avatar: "训练师",
};

export const NORMAL_DIALOGUE_SETS: Array<{keywords: string[]; lines: TrainerDialogueSet}> = [
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

export const BOSS_DIALOGUE_SETS: Record<Exclude<TrainerNpcView["type"], "player" | "normal" | "avatar">, TrainerDialogueSet> = {
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

export function toId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function stableIndex(value: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash % length;
}

export function trainerDisplayName(trainer?: TrainerNpcView): string {
  if (!trainer) return "训练师";
  const zh = String(trainer.name_zh || "").trim();
  if (zh && !/^[A-Z0-9_ -]+$/.test(zh)) return zh;
  const raw = `${trainer.id || ""} ${trainer.name_en || ""} ${zh}`.toLowerCase();
  if (raw.includes("plasma") && raw.includes("grunt")) return "等离子团团员";
  const en = String(trainer.name_en || zh || trainer.id || "").replace(/^DP[_-]|^HGSS[_-]|^SPR[_-](?:BW|B2W2)?[_-]/i, "");
  return en.replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()).trim() || "训练师";
}

export function trainerDialogueTitle(trainer?: TrainerNpcView): string {
  if (!trainer) return "训练师";
  const label = TRAINER_TYPE_LABELS[trainer.type] || "训练师";
  if (trainer.type === "normal") return label;
  return trainer.role || label;
}

export function trainerDialogueRole(trainer?: TrainerNpcView): string {
  const title = trainerDialogueTitle(trainer);
  return ["馆主", "四天王", "冠军"].includes(title) ? title : "";
}

export function formatDialogueLine(line: string, trainer?: TrainerNpcView): string {
  return line.replace(/\{name\}/g, trainerDisplayName(trainer)).replace(/\{role\}/g, trainerDialogueRole(trainer));
}

export function normalDialogueSet(trainer?: TrainerNpcView): TrainerDialogueSet {
  const haystack = `${trainer?.id || ""} ${trainer?.name_en || ""} ${trainer?.name_zh || ""} ${trainer?.notes || ""}`.toLowerCase();
  return NORMAL_DIALOGUE_SETS.find(set => set.keywords.length && set.keywords.some(keyword => haystack.includes(keyword)))?.lines || NORMAL_DIALOGUE_SETS[NORMAL_DIALOGUE_SETS.length - 1].lines;
}

export function bossDialogueVariant(record?: BossDexRecord): BossDialogueVariant {
  if (!record || Number(record.completed || 0) <= 0) return "first_meeting";
  if (record.last_result === "win") return "after_player_win";
  if (record.last_result === "loss") return "after_player_loss";
  return "rematch";
}

export function bossDialogueGroups(trainer?: TrainerNpcView, variant: BossDialogueVariant = "default"): TrainerDialogueSet[] {
  if (!trainer || !["gym", "elite4", "champion"].includes(trainer.type)) return [];
  const entry = BOSS_DIALOGUE_CATALOG[trainer.id];
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  return entry[variant] || entry.rematch || entry.default || [];
}

export function trainerDialogueLines(trainer: TrainerNpcView | undefined, moment: TrainerDialogueMoment, groupIndex?: number, variant: BossDialogueVariant = "default"): string[] {
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

export function battleDialogueKey(activeBattle: BattleState | null): string {
  if (!activeBattle) return "";
  const trainerId = activeBattle.enemy_trainer?.id || "trainer";
  const teamKey = activeBattle.enemy_display.map(pokemon => pokemon.species_id || pokemon.species || pokemon.name).join("|");
  return `${trainerId}:${bossDialogueVariant(activeBattle.enemy_boss_record)}:${teamKey}`;
}

export function typeId(value: string | undefined): string {
  const raw = String(value || "");
  return TYPE_ID_BY_ZH[raw] || toId(raw) || "normal";
}

export function moveCategoryId(category: string | undefined, categoryZh: string | undefined): "physical" | "special" | "status" | "" {
  const raw = `${category || ""} ${categoryZh || ""}`;
  const id = toId(raw);
  if (id.includes("physical") || raw.includes("物理")) return "physical";
  if (id.includes("special") || raw.includes("特殊")) return "special";
  if (id.includes("status") || id.includes("non" + "damage") || raw.includes("变化")) return "status";
  return "";
}

export function statusEffectId(value: string | undefined): string {
  const raw = String(value || "");
  const id = STATUS_ID_BY_ZH[raw] || toId(raw);
  return STATUS_ID_ALIASES[id] || id;
}

export function userFacingError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "发生未知错误。");
  const remoteMatch = raw.match(/Error invoking remote method '[^']+': Error:\s*(.+)$/);
  return (remoteMatch?.[1] || raw).replace(/^Error:\s*/, "").trim() || "发生未知错误。";
}

export function battleEffectEntry(key: string): BattleEffectEntry | undefined {
  return BATTLE_EFFECTS.entries[key];
}

export function firstBattleEffectEntry(keys: string[]): BattleEffectEntry | undefined {
  for (const key of keys) {
    const entry = battleEffectEntry(key);
    if (entry) return entry;
  }
  return undefined;
}

export function moveEffectKeys(moveId: string, typeIdValue: string, categoryId: string): string[] {
  return [
    moveId ? `move:${moveId}` : "",
    categoryId ? `move_type:${typeIdValue}:${categoryId}` : "",
    `move_type:${typeIdValue}`,
    categoryId ? `move_type:normal:${categoryId}` : "",
    "move_type:normal",
  ].filter(Boolean);
}

export function moveCueTargetSide(entry: BattleEffectEntry | undefined, actingSide: "p1" | "p2", eventTargetSide: "p1" | "p2" | undefined): "p1" | "p2" {
  const opponentSide = actingSide === "p1" ? "p2" : "p1";
  if (entry?.target === "source") return actingSide;
  if (entry?.target === "opponent") return opponentSide;
  return eventTargetSide || opponentSide;
}

export function eventTargetsDisplayedActive(event: BattleTimelineEvent, displayedNames: {p1: string; p2: string}, displayedShowdownIds?: {p1: string; p2: string}): boolean {
  if (!event.targetSide) return true;
  const eventShowdownId = String(event.target_showdown_id || "").trim();
  const activeShowdownId = String(displayedShowdownIds?.[event.targetSide] || "").trim();
  if (eventShowdownId) return Boolean(activeShowdownId) && eventShowdownId === activeShowdownId;
  if (!event.target_id) return true;
  const activeRaw = String(displayedNames[event.targetSide] || "").trim();
  const targetRaw = String(event.target_id || "").trim();
  if (activeRaw && targetRaw && activeRaw === targetRaw) return true;
  const activeId = toId(activeRaw);
  const targetId = toId(targetRaw);
  if (activeId && targetId) return activeId === targetId;
  return true;
}

export function statusEffectKeys(effect: string | undefined, fallback = "generic"): string[] {
  const id = statusEffectId(effect);
  const keys = id ? [`status:${id}`] : [];
  if (VOLATILE_STATUS_IDS.has(id)) keys.push("status:volatile");
  keys.push(`status:${fallback}`, "status:generic");
  return keys;
}

export function boostEffectKeys(event: BattleTimelineEvent): string[] {
  const effect = toId(event.effect);
  if (effect.includes("clear")) return ["boost:clear", "boost:generic", "battle_action:boost"];
  if (effect === "swap" || effect === "copy" || effect === "invert") return [`boost:${effect}`, "boost:generic", "battle_action:boost"];
  if (typeof event.boost_amount === "number") {
    if (event.boost_amount > 0) return [`boost:${effect}-up`, "boost:up", "boost:generic", "battle_action:boost"];
    if (event.boost_amount < 0) return [`boost:${effect}-down`, "boost:down", "boost:generic", "battle_action:boost"];
  }
  if (event.text.includes("下降") || event.text.includes("降低")) return ["boost:down", "boost:generic", "battle_action:boost"];
  if (event.text.includes("提高") || event.text.includes("上升")) return ["boost:up", "boost:generic", "battle_action:boost"];
  return ["boost:generic", "battle_action:boost"];
}

export function weatherEffectKeys(event: BattleTimelineEvent): string[] {
  const raw = `${event.effect || ""} ${event.text || ""}`;
  const id = toId(raw);
  if (id.includes("none") || raw.includes("恢复正常") || raw.includes("无")) return ["weather:none", "weather:generic"];
  if (id.includes("rain") || raw.includes("雨")) return ["weather:rain", "weather:generic"];
  if (id.includes("sun") || id.includes("harshsunlight") || raw.includes("晴") || raw.includes("日照")) return ["weather:sun", "weather:generic"];
  if (id.includes("sand") || raw.includes("沙暴")) return ["weather:sand", "weather:generic"];
  if (id.includes("snow") || raw.includes("雪")) return ["weather:snow", "weather:hail", "weather:generic"];
  if (id.includes("hail") || raw.includes("冰雹")) return ["weather:hail", "weather:snow", "weather:generic"];
  return ["weather:generic"];
}

export function fieldEffectKeys(event: BattleTimelineEvent): string[] {
  const raw = `${event.effect || ""} ${event.text || ""}`;
  const id = toId(raw);
  const sideKeys: string[] = [];
  if (id.includes("auroraveil") || raw.includes("极光幕")) sideKeys.push("side_condition:auroraveil");
  if (id.includes("reflect") || raw.includes("反射壁")) sideKeys.push("side_condition:reflect");
  if (id.includes("lightscreen") || raw.includes("光墙")) sideKeys.push("side_condition:lightscreen");
  if (id.includes("stickyweb") || raw.includes("黏黏网")) sideKeys.push("side_condition:stickyweb");
  if (id.includes("stealthrock") || raw.includes("隐形岩")) sideKeys.push("side_condition:stealthrock");
  if (id.includes("toxicspikes") || raw.includes("毒菱")) sideKeys.push("side_condition:toxicspikes");
  if (id.includes("spikes") || raw.includes("撒菱")) sideKeys.push("side_condition:spikes");
  if (id.includes("tailwind") || raw.includes("顺风")) sideKeys.push("side_condition:tailwind");
  const fieldKeys: string[] = [];
  if (id.includes("trickroom") || raw.includes("戏法空间")) fieldKeys.push("field:trickroom");
  if (id.includes("electricterrain") || raw.includes("电气场地") || raw.includes("电气")) fieldKeys.push("field:electricterrain");
  if (id.includes("grassyterrain") || raw.includes("青草场地") || raw.includes("青草")) fieldKeys.push("field:grassyterrain");
  if (id.includes("mistyterrain") || raw.includes("薄雾场地") || raw.includes("薄雾")) fieldKeys.push("field:mistyterrain");
  if (id.includes("psychicterrain") || raw.includes("精神场地") || raw.includes("精神")) fieldKeys.push("field:psychicterrain");
  return [...sideKeys, ...fieldKeys, "field:generic"];
}

export function cueFromEntry(entry: BattleEffectEntry | undefined, event: BattleTimelineEvent, fallbackVisual: string, side?: "p1" | "p2", targetSide?: "p1" | "p2"): BattleVisualCue {
  const renderer = entry?.renderer || "css";
  const durationMs = entry?.duration_ms || BATTLE_EFFECTS.defaults.duration_ms;
  return {
    visual: entry?.visual || fallbackVisual,
    renderer,
    asset: entry?.asset,
    frames: entry?.frames,
    frame_width: entry?.frame_width,
    frame_height: entry?.frame_height,
    scale: entry?.scale,
    side: side || event.side,
    targetSide: targetSide || event.targetSide,
    anchor: entry?.anchor || BATTLE_EFFECTS.defaults.anchor,
    durationMs: renderer === "css" ? Math.max(450, durationMs - BATTLE_CSS_EFFECT_SPEEDUP_MS) : durationMs,
  };
}

export function assetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return window.changeBattle?.assetUrl(path);
}

export function pokemonCryUrl(source?: {sprite?: Pick<SpriteMapEntry, "cry_asset">} | Pick<SpriteMapEntry, "cry_asset">): string | undefined {
  const direct = "cry_asset" in (source || {}) ? (source as Pick<SpriteMapEntry, "cry_asset">).cry_asset : undefined;
  const path = direct || (source as {sprite?: Pick<SpriteMapEntry, "cry_asset">} | undefined)?.sprite?.cry_asset;
  return assetUrl(path);
}

const pokemonCryAudioByChannel = new Map<string, HTMLAudioElement>();

export function playPokemonCry(source?: {sprite?: Pick<SpriteMapEntry, "cry_asset">} | Pick<SpriteMapEntry, "cry_asset">, channel = "pokemon"): void {
  const url = pokemonCryUrl(source);
  if (!url || typeof Audio === "undefined") return;
  try {
    const audio = pokemonCryAudioByChannel.get(channel) || new Audio();
    pokemonCryAudioByChannel.set(channel, audio);
    audio.pause();
    if (audio.src !== url) audio.src = url;
    audio.currentTime = 0;
    audio.volume = 0.72;
    const playback = audio.play();
    if (playback) void playback.catch(() => undefined);
  } catch {
    // Browsers may block audio until a user gesture; gameplay should continue silently.
  }
}

export function pokemonImageUrl(pokemon?: {sprite?: SpriteMapEntry; shiny?: boolean}, variant: "front_normal" | "back_normal" = "front_normal"): string | undefined {
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

export function PokemonSprite({pokemon, src, alt, variant = "front_normal", className = "", badge = "short", entrance = false, onClick}: {pokemon?: {sprite?: SpriteMapEntry; shiny?: boolean}; src?: string; alt: string; variant?: "front_normal" | "back_normal"; className?: string; badge?: "short" | "full" | false; entrance?: boolean; onClick?: () => void}) {
  const shiny = Boolean(pokemon?.shiny);
  const badgeText = badge === "full" ? "闪光" : "闪";
  const image = src || pokemonImageUrl(pokemon, variant);
  return (
    <span className={`pokemon-sprite ${className} ${shiny ? "is-shiny" : ""} ${shiny && entrance ? "shiny-entrance" : ""} ${onClick ? "clickable-sprite" : ""}`} onClick={onClick}>
      {image ? <img src={image} alt={alt} /> : <i className="shadow-orb">?</i>}
      {shiny && badge ? <i className={`shiny-badge ${badge === "full" ? "full" : ""}`}>{badgeText}</i> : null}
    </span>
  );
}

export function itemImageUrl(item?: {icon_asset?: string}): string {
  return assetUrl(item?.icon_asset || "assets/placeholders/item.png") || "";
}

export function ItemIcon({item}: {item?: {id?: string; icon_asset?: string; name?: string; name_zh?: string}}) {
  const isTm = /^tm:/i.test(String(item?.id || ""));
  if (isTm) return <span className="item-icon tm-icon">TM</span>;
  return <img className="item-icon" src={itemImageUrl(item)} alt={item?.name_zh || item?.name || "道具"} />;
}

export function trainerImageUrl(trainer?: Pick<TrainerNpcView, "front_asset" | "front_gif_asset" | "back_asset" | "avatar_asset">, slot: "front" | "frontGif" | "back" | "avatar" = "front"): string | undefined {
  if (slot === "frontGif") return assetUrl(trainer?.front_gif_asset || trainer?.front_asset);
  if (slot === "back") return assetUrl(trainer?.back_asset || trainer?.front_asset);
  if (slot === "avatar") return assetUrl(trainer?.avatar_asset || trainer?.front_asset);
  return assetUrl(trainer?.front_asset);
}

export function profileFromSelection(name: string, player?: TrainerNpcView, avatarAsset?: string): TrainerProfile {
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

export function displayName(pokemon?: RentalPokemon): string {
  return pokemon?.species_zh || pokemon?.species || "未知";
}

export function textKey(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[\s()[\]{}（）【】《》〈〉·'’.,，。:：_-]+/g, "");
}

export function baseFormKey(value: string | undefined): string {
  return textKey(String(value || "").replace(/[-(（].*$/, ""));
}

export function displayMatchKeys(pokemon: RentalPokemon | undefined): Set<string> {
  const keys = new Set<string>();
  if (!pokemon) return keys;
  for (const value of [pokemon.species_id, pokemon.species, pokemon.name, pokemon.species_zh]) {
    const id = toId(value);
    const text = textKey(value);
    const base = baseFormKey(value);
    if (id) keys.add(id);
    if (text) keys.add(text);
    if (base) keys.add(base);
  }
  const spriteName = pokemon.sprite?.name;
  if (spriteName) keys.add(toId(spriteName));
  return keys;
}

export function runtimeMatchKeys(name?: string): Set<string> {
  const keys = new Set<string>();
  const id = toId(name);
  const text = textKey(name);
  const base = baseFormKey(name);
  if (id) keys.add(id);
  if (text) keys.add(text);
  if (base) keys.add(base);
  return keys;
}

export function conditionText(condition?: string): string {
  if (!condition) return "?";
  return condition.replace(" fnt", " 濒死").replace(" brn", " 灼伤").replace(" par", " 麻痹").replace(" psn", " 中毒").replace(" tox", "剧毒").replace(" slp", " 睡眠").replace(" frz", " 冰冻");
}

export function parseHp(condition?: string): {current: number; max: number; text: string} | null {
  const match = String(condition || "").match(/(\d+)\/(\d+)/);
  if (!match) return null;
  return {current: Number(match[1]), max: Number(match[2]), text: `${match[1]}/${match[2]}`};
}

export function hpTone(hp: {current: number; max: number} | null): "high" | "mid" | "low" {
  if (!hp || hp.max <= 0) return "low";
  const ratio = hp.current / hp.max;
  if (ratio > 0.5) return "high";
  if (ratio > 0.3) return "mid";
  return "low";
}

export function statusCode(condition?: string, explicit?: string): string {
  const raw = String(explicit || condition || "").trim();
  if (raw.includes(" fnt") || raw === "fnt" || raw.startsWith("0 ")) return "fnt";
  const tokens = raw.split(/[\s,;/]+/).map(toId).filter(Boolean);
  if (tokens.includes("confusion") || tokens.includes("confused") || raw.includes("混乱")) return "confusion";
  for (const code of ["brn", "par", "psn", "tox", "slp", "frz"]) {
    if (tokens.includes(code) || raw === code) return code;
  }
  return "";
}

export function statusLabel(code: string): string {
  return {brn: "灼伤", par: "麻痹", psn: "中毒", tox: "剧毒", slp: "睡眠", frz: "冰冻", fnt: "濒死", confusion: "混乱"}[code] || "";
}

export function bpCostLabel(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return "-";
  return Number(cost || 0) <= 0 ? "免费" : `${cost}BP`;
}

export function coinCostLabel(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return "-";
  return Number(cost || 0) <= 0 ? "免费" : `${cost}金币`;
}

export function itemCategoryLabel(category?: string): string {
  if (category === "consumable") return "消耗道具";
  if (category === "tm") return "技能机器";
  return "携带道具";
}

export function restoreCostSuffix(costs: Record<1 | 2 | 3, number>, selectedCount: number, currentCount: number): string {
  const count = selectedCount || currentCount;
  return count > 0 ? `（${coinCostLabel(costs[Math.min(3, count) as 1 | 2 | 3])}）` : "（无需恢复）";
}

export function talentShortText(talent: TalentView): string {
  const cleanCopy: Record<string, string> = {
    starter_angel_fund: "开局获得 1000 金币，剩余启动资金不参与结算折算。",
    starter_mentor_eye: "选中的开局宝可梦有概率只提升数值模板。",
    starter_bag_expansion: "每类开局道具最多可以带走 2 个。",
    starter_soulmate: "开局追加上一局记忆候选，最多选择 1 只。",
    exchange_trust: "每场后可培养 1 只宝可梦提升等级。",
    exchange_gym_recognition: "重要训练师的宝可梦交换限制会放宽。",
    exchange_careful: "交换获得的宝可梦会以完整状态加入，并带来目标身上的道具。",
    exchange_elite_training: "只提升交换宝可梦的阶级数值；技能、特性和道具不会改变。",
    exchange_stalwart: "每场胜利后恢复队伍 HP，濒死成员也会被拉起。",
    exchange_factory_freedom: "交换不再消耗金币。",
    intel_rumor: "休整时可查看本局训练师顺序并揭示阵容。",
    intel_god_eye: "对战和详情页显示更多隐藏信息。",
    intel_shop_strategy: "商店抽奖前可指定道具类型。",
    intel_reroute: "休整时可更换一个未挑战的同等级对手，每局最多 3 次。",
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

export function timelineFaintedState(events: BattleTimelineEvent[], fallback: {p1: boolean; p2: boolean}): {p1: boolean; p2: boolean} {
  const next = {...fallback};
  for (const event of events) {
    if (!event.targetSide) continue;
    if (event.type === "switch") next[event.targetSide] = false;
    if (event.type === "faint") next[event.targetSide] = true;
  }
  return next;
}

export function runtimeName(runtime?: RuntimePokemon): string {
  const ident = runtime?.ident || "";
  if (ident.includes(":")) return ident.split(":", 2)[1].trim();
  const details = runtime?.details || "";
  return details ? details.split(",", 1)[0].trim() : ident;
}

export function findDisplay(team: RentalPokemon[], name?: string): RentalPokemon | undefined {
  const keys = runtimeMatchKeys(name);
  if (!keys.size) return undefined;
  return team.find(pokemon => {
    const pokemonKeys = displayMatchKeys(pokemon);
    for (const key of keys) if (pokemonKeys.has(key)) return true;
    return false;
  });
}

export function findDisplayByShowdownId(team: RentalPokemon[], showdownId?: string): RentalPokemon | undefined {
  const id = String(showdownId || "").trim().toLowerCase();
  return id ? team.find(pokemon => String(pokemon.showdown_id || "").trim().toLowerCase() === id) : undefined;
}

export type ActiveTrackerDisplay = BattleState["tracker"]["active"]["p1"];

function calculatedDisplayStats(baseStats: Record<string, number>, base?: RentalPokemon): Record<string, number> {
  if (!base) return {};
  const level = Number(base.level || 50);
  const ivs = base.ivs || {};
  const evs = base.evs || {};
  const result: Record<string, number> = {};
  for (const [stat] of STAT_ROWS) {
    const baseValue = Number(baseStats[stat] || 0);
    const iv = Number(ivs[stat] ?? 31);
    const ev = Number(evs[stat] ?? 0);
    const value = Math.floor(((2 * baseValue + iv + Math.floor(ev / 4)) * level) / 100);
    if (stat === "hp") {
      result[stat] = value + level + 10;
      continue;
    }
    let adjusted = value + 5;
    if (base.nature_plus === stat) adjusted = Math.floor(adjusted * 1.1);
    if (base.nature_minus === stat) adjusted = Math.floor(adjusted * 0.9);
    result[stat] = adjusted;
  }
  return result;
}

export function displayFromActive(active: ActiveTrackerDisplay | undefined, base?: RentalPokemon): RentalPokemon | undefined {
  if (!active?.sprite && !active?.display_name && !active?.species_id) return base;
  const species = active?.name || active?.display_name || base?.species || "Unknown";
  const baseStats = active?.base_stats || base?.base_stats || {};
  const stats = active?.base_stats ? calculatedDisplayStats(baseStats, base) : base?.stats || {};
  const formChanged = Boolean(active?.species_id && base?.species_id && active.species_id !== base.species_id);
  const useActiveAbility = formChanged || !base;
  return {
    name: species,
    species,
    species_zh: active?.display_name || base?.species_zh || species,
    species_id: active?.species_id || base?.species_id || toId(species),
    level: base?.level || 50,
    gender: base?.gender || "",
    types: active?.types || base?.types || [],
    types_zh: active?.types_zh || base?.types_zh || [],
    ability: useActiveAbility ? active?.ability || base?.ability || "" : base?.ability || "",
    ability_zh: useActiveAbility ? active?.ability_zh || base?.ability_zh || "" : base?.ability_zh || "",
    ability_id: useActiveAbility ? active?.ability_id || base?.ability_id || "" : base?.ability_id || "",
    ability_desc: useActiveAbility ? active?.ability_desc || base?.ability_desc || "" : base?.ability_desc || "",
    ability_desc_zh: useActiveAbility ? active?.ability_desc_zh || base?.ability_desc_zh || "" : base?.ability_desc_zh || "",
    item: base?.item || "",
    item_zh: base?.item_zh || "",
    item_id: base?.item_id || "",
    item_desc: base?.item_desc || "",
    item_desc_zh: base?.item_desc_zh || "",
    moves: base?.moves || [],
    base_stats: baseStats,
    stats,
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

export function activePokemon(battle: BattleState | null | undefined, side: "p1" | "p2"): {runtime?: RuntimePokemon; display?: RentalPokemon; active?: ActiveTrackerDisplay} {
  const playerSide = battle?.player_side || "p1";
  const isPlayerSide = side === playerSide;
  const rows = isPlayerSide ? battle?.request?.side?.pokemon || [] : [];
  const runtimeIndex = isPlayerSide ? rows.findIndex(pokemon => pokemon.active) : -1;
  const runtime = runtimeIndex >= 0 ? rows[runtimeIndex] : undefined;
  const active = battle?.tracker.active[side];
  const activeName = active?.species_id || active?.name || (isPlayerSide ? runtimeName(runtime) : "");
  const team = isPlayerSide ? battle?.player_display || [] : battle?.enemy_display || [];
  const allDisplays = [...(battle?.player_display || []), ...(battle?.enemy_display || [])];
  const base = findDisplayByShowdownId(team, active?.showdown_id || runtime?.pokeball) || findDisplay(team, activeName) || findDisplay(allDisplays, activeName) || findDisplay(team, runtimeName(runtime)) || (runtimeIndex >= 0 ? team[runtimeIndex] : undefined) || (!isPlayerSide ? team[0] : undefined);
  return {runtime, active, display: displayFromActive(active, base)};
}

export function displayForRuntime(team: RentalPokemon[], runtime: RuntimePokemon | undefined, index: number): RentalPokemon | undefined {
  return findDisplayByShowdownId(team, runtime?.pokeball) || findDisplay(team, runtimeName(runtime)) || team[index];
}

export function findDisplayIndex(team: RentalPokemon[], name?: string): number {
  const keys = runtimeMatchKeys(name);
  if (!keys.size) return -1;
  return team.findIndex(pokemon => {
    const pokemonKeys = displayMatchKeys(pokemon);
    for (const key of keys) if (pokemonKeys.has(key)) return true;
    return false;
  });
}

export function enemyDisplayIndex(team: RentalPokemon[], event: BattleTimelineEvent): number {
  if (event.target_showdown_id || event.source_showdown_id) {
    const id = String(event.target_showdown_id || event.source_showdown_id || "").trim().toLowerCase();
    const index = team.findIndex(pokemon => String(pokemon.showdown_id || "").trim().toLowerCase() === id);
    if (index >= 0) return index;
  }
  if (event.target_species_id) {
    const index = team.findIndex(pokemon => pokemon.species_id === event.target_species_id);
    if (index >= 0) return index;
  }
  return findDisplayIndex(team, event.target_id || event.source_id || event.target || event.source);
}

export type PartyStatusSlot = {
  key: string;
  label: string;
  display?: RentalPokemon;
  condition?: string;
  status?: string;
  active?: boolean;
  revealed?: boolean;
  onClick?: () => void;
};

export function playerPartySlots(battle: BattleState, activeIndex: number, activeCondition: string, activeStatus: string, onSelect: (index: number) => void): PartyStatusSlot[] {
  const runtimes = battle.request?.side?.pokemon || [];
  return Array.from({length: Math.max(3, battle.player_display.length || runtimes.length)}, (_value, index) => {
    const runtime = runtimes[index];
    const active = Boolean(runtime?.active || index === activeIndex);
    const display = displayForRuntime(battle.player_display, runtime, index) || battle.player_display[index];
    return {
      key: runtime?.ident || display?.run_member_id || `player-${index}`,
      label: String(index + 1),
      display,
      condition: active ? activeCondition : runtime?.condition,
      status: active ? activeStatus : undefined,
      active,
      revealed: true,
      onClick: display || runtime ? () => onSelect(index) : undefined,
    };
  }).slice(0, 3);
}

export function enemyPartySlots(battle: BattleState, activeName: string, activeCondition: string, activeStatus: string): PartyStatusSlot[] {
  const team = battle.enemy_display.slice(0, 3);
  const seen = new Map<number, {condition?: string; status?: string; active?: boolean}>();
  for (const event of battle.timeline_events || []) {
    if (event.targetSide !== "p2" && event.side !== "p2") continue;
    const index = enemyDisplayIndex(team, event);
    if (index < 0) continue;
    const previous = seen.get(index) || {};
    seen.set(index, {
      ...previous,
      condition: event.condition || previous.condition,
      status: event.condition ? undefined : previous.status,
    });
  }
  const activeIndex = findDisplayIndex(team, activeName);
  if (activeIndex >= 0) {
    seen.set(activeIndex, {...(seen.get(activeIndex) || {}), condition: activeCondition, status: activeStatus, active: true});
  }
  return Array.from({length: 3}, (_value, index) => {
    const visible = seen.get(index);
    return {
      key: team[index]?.run_member_id || team[index]?.species_id || `enemy-${index}`,
      label: String(index + 1),
      display: visible ? team[index] : undefined,
      condition: visible?.condition,
      status: visible?.status,
      active: visible?.active,
      revealed: Boolean(visible),
    };
  });
}

export function statLine(pokemon: RentalPokemon, stat: string, revealTraining = false): string {
  const marker = pokemon.nature_plus === stat ? " ↑" : pokemon.nature_minus === stat ? " ↓" : "";
  return revealTraining
    ? `${pokemon.stats[stat] ?? "?"} (${pokemon.base_stats[stat] ?? "?"} | ${pokemon.ivs[stat] ?? 31} | ${pokemon.evs[stat] ?? 0})${marker}`
    : `${pokemon.stats[stat] ?? "?"} (${pokemon.base_stats[stat] ?? "?"} | ?? | ??)${marker}`;
}

export function moveDescription(move: MoveSummary): string {
  return move.desc_zh || move.short_desc_zh || "暂无中文说明。";
}

export const ABILITY_DESC_FALLBACK_ZH: Record<string, string> = {
  mimicry: "宝可梦会根据当前场地改变自己的属性。电气场地时变为电属性，青草场地时变为草属性，薄雾场地时变为妖精属性，精神场地时变为超能力属性；没有场地时恢复原本属性。",
};

export function hasCjk(value: string | undefined): boolean {
  return /[\u3400-\u9fff]/.test(String(value || ""));
}

export function abilityDescription(pokemon: RentalPokemon): string {
  if (pokemon.ability_desc_zh) return pokemon.ability_desc_zh;
  const fallback = ABILITY_DESC_FALLBACK_ZH[toId(pokemon.ability_id || pokemon.ability)];
  if (fallback) return fallback;
  if (hasCjk(pokemon.ability_desc)) return pokemon.ability_desc;
  return "暂无中文特性说明。";
}

export function hasStarterItemChoices(starter: DesktopGameState["starter"]): boolean {
  return Boolean(starter?.item_groups?.some(group => group.offers.length > 0) || starter?.offers?.length);
}

export function statMarker(pokemon: RentalPokemon, stat: string): string {
  return pokemon.nature_plus === stat ? "↑" : pokemon.nature_minus === stat ? "↓" : "";
}

export function moveSummaryFor(pokemon: RentalPokemon | undefined, requestMove: BattleMoveRequest): MoveSummary | undefined {
  const key = toId(requestMove.id || requestMove.move);
  return pokemon?.moves.find(move => move.id === key || toId(move.name) === key || toId(move.name_zh) === key);
}

export function moveSummaryByName(pokemon: RentalPokemon | undefined, moveName: string | undefined): MoveSummary | undefined {
  const raw = String(moveName || "").trim();
  if (!raw) return undefined;
  const exact = pokemon?.moves.find(move => move.id === raw || move.name === raw || move.name_zh === raw);
  if (exact) return exact;
  const key = toId(raw);
  return key ? pokemon?.moves.find(move => move.id === key || toId(move.name) === key || toId(move.name_zh) === key) : undefined;
}

export function runtimeMoveLabel(pokemon: RentalPokemon | undefined, move: {id?: string; move?: string} | undefined, index: number): string {
  if (!move) return "";
  const summary = moveSummaryByName(pokemon, move.id || move.move) || pokemon?.moves[index];
  return summary?.name_zh || summary?.name || move.move || "";
}

export function debugMove(id: string, name: string, type = "Fire"): MoveSummary {
  return {id, name, name_zh: name, type, type_zh: type === "Fire" ? "火" : "一般", category: "Physical", category_zh: "物理", power: 120, accuracy: 100, pp: 5, priority: 0, short_desc: "", short_desc_zh: "", desc: "", desc_zh: ""};
}

export function debugPokemon(species: string, zh: string): RentalPokemon {
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

export function debugBattle(ended = false): BattleState {
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

export function mergeBattleSnapshot(current: BattleState | null, next: BattleState | null | undefined): BattleState | null {
  if (!next) return current;
  const enemyTrainer = next.enemy_trainer || current?.enemy_trainer;
  const enemyBossRecord = next.enemy_boss_record || (enemyTrainer?.id && enemyTrainer.id === current?.enemy_trainer?.id ? current?.enemy_boss_record : undefined);
  return {
    ...next,
    player_trainer: next.player_trainer || current?.player_trainer,
    enemy_trainer: enemyTrainer,
    enemy_boss_record: enemyBossRecord,
  };
}
