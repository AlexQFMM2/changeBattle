import {Fragment, useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import type {CSSProperties} from "react";
import type {AppStatus, BagCategoryView, BagItemView, BattleMoveRequest, BattleState, BattleTimelineEvent, DesktopDexCategory, DesktopDexEntry, DesktopDexSearchResult, DesktopGameState, LocalSave, MoveSummary, PokemonEditOptions, PricedMove, RentalPokemon, RestAction, RuntimePokemon, ShopItem, ShopOffer, SpriteMapEntry, TalentView, TrainerCatalogState, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import battleEffectAssets from "../../../data/battle_effect_assets.json";
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
const BP_SCALE = 100;
const TALENT_EQUIP_LIMIT = 5;
const EXCHANGE_TALENTS: TalentView[] = [
  {id: "exchange_lossless", name: "爱护有加", category: "交换", cost: 2 * BP_SCALE, desc: "交换获得的宝可梦会恢复到 3/4 HP 和 3/4 PP。"},
  {id: "exchange_pickpocket", name: "顺手牵羊", category: "交换", cost: 3 * BP_SCALE, desc: "交换时如果目标携带道具，会一并拿过来。"},
  {id: "exchange_gym_recognition", name: "馆主认可", category: "交换", cost: 15 * BP_SCALE, desc: "馆主和四天王宝可梦不再受默认只能交换 1 只的限制。"},
  {id: "exchange_factory_freedom", name: "工厂自由", category: "交换", cost: 30 * BP_SCALE, desc: "所有交换免费。"},
  {id: "exchange_second_team_roar", name: "二队的怒吼", category: "交换", cost: 50 * BP_SCALE, desc: "三只都阵亡后，可选择损失 1000BP 重新 6 选 3 并重打当前场次；一局一次。"},
  {id: "exchange_safe_box", name: "无损交易", category: "交换", cost: 50 * BP_SCALE, desc: "拥有一个特殊宝可梦盒子，本局遇到的宝可梦会寄存在其中，后续可再次交换回来。"},
];
const GAMBLER_TALENTS: TalentView[] = [
  {id: "gambler_move_draw_4", name: "灵感爆棚", category: "赌徒", cost: 5 * BP_SCALE, desc: "技能随机时候选数量从 2 个提升到 3 个。"},
  {id: "gambler_shop_offer_5", name: "大手一挥", category: "赌徒", cost: 5 * BP_SCALE, desc: "商店老虎机格子数量从 3 个提升到 4 个。"},
  {id: "gambler_free_stat_reset", name: "时也命也", category: "赌徒", cost: 10 * BP_SCALE, desc: "重置数值时 60% 概率免费、30% 概率双倍消耗、10% 概率正常消耗。"},
  {id: "gambler_random_cost_1", name: "座上贵宾", category: "赌徒", cost: 20 * BP_SCALE, desc: "每次休整获得一次免费商店抽奖；本次休整后续商店抽奖消耗为基础费用的 1.3 倍，免费次数不结转。"},
  {id: "gambler_streak_bp_risk", name: "压上杠杆", category: "赌徒", cost: 50 * BP_SCALE, desc: "每场胜利有概率把本场基础 BP 变为 1.4/1.6/1.8/2.0/2.5 倍；失败时不获得背包返还，并将 BP 回到本局开始前。"},
  {id: "gambler_all_in_exchange", name: "孤注一掷", category: "赌徒", cost: 50 * BP_SCALE, desc: "每局比赛限一次，生成一只三阶宝可梦用于交换；交换后另外两只宝可梦半血并陷入睡眠，且立即结束本次休整。"},
];
const PROPHET_TALENTS: TalentView[] = [
  {id: "prophet_first_mover", name: "上帝之眼", category: "先知", cost: 5 * BP_SCALE, desc: "对战时可以预测每个技能大概能打对方多少 HP，并允许在对战时查看图鉴。"},
  {id: "prophet_next_scout", name: "未卜先知", category: "先知", cost: 10 * BP_SCALE, desc: "每次休整可免费查看下一场随机 1 只对手宝可梦的图片和名字；花费 300BP 可查看全部。"},
  {id: "prophet_history_review", name: "温故知新", category: "先知", cost: 15 * BP_SCALE, desc: "休整页允许查看上一轮对手的宝可梦详情。"},
  {id: "prophet_direct_move", name: "运筹帷幄", category: "先知", cost: 20 * BP_SCALE, desc: "调整技能时不再随机，可直接从可学习技能池选择一个技能替换，每次 300BP。"},
  {id: "prophet_candidate_12", name: "慧眼识珠", category: "先知", cost: 50 * BP_SCALE, desc: "开局从 12 只候选宝可梦中选择，而不是 6 只。"},
  {id: "prophet_future_boss", name: "预知未来", category: "先知", cost: 50 * BP_SCALE, desc: "可以直接看到本局关底训练师的详细阵容。"},
];
const BUSINESS_TALENTS: TalentView[] = [
  {id: "business_starter_3", name: "有备无患", category: "经营", cost: 5 * BP_SCALE, desc: "开局可以选择 3 个起始道具。"},
  {id: "business_discount_70", name: "贵客专享", category: "经营", cost: 15 * BP_SCALE, desc: "购买道具时专享 70% 折扣，向下取整。"},
  {id: "business_refund_70", name: "精打细算", category: "经营", cost: 20 * BP_SCALE, desc: "背包返还时返还 70%，而不是 50%。"},
  {id: "business_sell_full", name: "奇货可居", category: "经营", cost: 30 * BP_SCALE, desc: "卖出道具时能原价出售。"},
  {id: "business_amulet_coin", name: "护符金币", category: "经营", cost: 50 * BP_SCALE, desc: "所有 BP 正向结算时按 1.5 倍结算。"},
  {id: "business_shiny_collector", name: "闪光收藏家", category: "经营", cost: 50 * BP_SCALE, desc: "任意交换获得的宝可梦均为闪光，且闪光带来的 BP 加成变为 1.3 倍。"},
];
const TALENT_CATALOG = [...EXCHANGE_TALENTS, ...GAMBLER_TALENTS, ...PROPHET_TALENTS, ...BUSINESS_TALENTS];

function toId(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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

function itemCategoryLabel(category?: string): string {
  if (category === "consumable") return "消耗道具";
  if (category === "tm") return "技能机器";
  return "携带道具";
}

function starterDiscountLabel(discount?: number): string {
  if (!discount || discount >= 1) return "原价";
  return `-${Math.round(discount * 100)}%`;
}

function restoreCostSuffix(costs: Record<1 | 2 | 3, number>, selectedCount: number, currentCount: number): string {
  const count = selectedCount || currentCount;
  return count > 0 ? `（${bpCostLabel(costs[Math.min(3, count) as 1 | 2 | 3])}）` : "（无需恢复）";
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

function statLine(pokemon: RentalPokemon, stat: string): string {
  const marker = pokemon.nature_plus === stat ? " ↑" : pokemon.nature_minus === stat ? " ↓" : "";
  return `${pokemon.stats[stat] ?? "?"} (${pokemon.base_stats[stat] ?? "?"} | ${pokemon.ivs[stat] ?? 31} | ${pokemon.evs[stat] ?? 0})${marker}`;
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
  const save: LocalSave = {version: 1, bp_scale: BP_SCALE, trainer: {name: "自动测试", gender: "other"}, stats: {battle_points: 9900, battles: 0, wins: 0, losses: 0, rank_status: "未开放"}, talent_unlocks: [], talent_equipped: [], current_run: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
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
    }),
    prepareStarterItems: async () => ({screen: "starterItems", save, starter: {seed: 1, offers: [], purchased: null}, message: "自动测试开局道具"}),
    chooseStarterItem: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    cancelPreparation: async () => ({screen: "mainMenu", save, message: "自动测试返回主菜单"}),
    getTalentConfig: async () => ({catalog: TALENT_CATALOG, unlocked: TALENT_CATALOG.slice(0, 1), equipped: []}),
    unlockTalent: async id => ({catalog: TALENT_CATALOG, unlocked: TALENT_CATALOG.filter(talent => talent.id === id), equipped: [], save}),
    configureTalents: async ids => ({catalog: TALENT_CATALOG, unlocked: TALENT_CATALOG, equipped: TALENT_CATALOG.filter(talent => ids.includes(talent.id)), save}),
    prepareCandidates: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    beginChallenge: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    continueRun: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    battleChoice: async () => ({screen: "battleMain", save, battle: debugBattle(true), message: "自动测试胜利", pending_transition: {screen: "result", save, battle: debugBattle(true), message: "自动测试结算"}}),
    secondTeamRoar: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: [], display: [], packed: ""}, selected_indexes: [], message: "自动测试二队"}),
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
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [starter, setStarter] = useState<DesktopGameState["starter"]>(null);
  const [battleBag, setBattleBag] = useState<BagCategoryView | null>(null);
  const [exchange, setExchange] = useState<DesktopGameState["exchange"]>(null);
  const [rest, setRest] = useState<DesktopGameState["rest"]>(null);
  const [rescue, setRescue] = useState<DesktopGameState["rescue"]>(null);
  const [pendingTransition, setPendingTransition] = useState<DesktopGameState | null>(null);
  const [dexOpen, setDexOpen] = useState(false);
  const [message, setMessage] = useState("欢迎来到 ChangeBattle。选择读取存档或开始新游戏。");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    }
    setStarter(state.starter || null);
    setBattle(state.battle || null);
    setBattleBag(state.battle_bag || null);
    setExchange(state.exchange || null);
    setRest(state.rest || null);
    setRescue(state.rescue || null);
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

  async function cancelPreparation() {
    await runAction(() => window.changeBattle!.cancelPreparation());
  }

  function backToStarterItems() {
    setSelected([]);
    setFocusIndex(0);
    setScreen("starterItems");
    setMessage("已返回开局道具。");
  }

  async function beginChallenge(nextSelected = selected, runSeed = seed) {
    await runAction(() => window.changeBattle!.beginChallenge(nextSelected, runSeed, 7));
  }

  function toggleCandidate(index: number) {
    setSelected(current => {
      if (current.includes(index)) return current.filter(value => value !== index);
      if (current.length < 3) return [...current, index];
      return [...current.slice(0, 2), index];
    });
  }

  async function battleChoice(choice: string) {
    await runAction(() => window.changeBattle!.battleChoice(choice), undefined, false);
  }

  async function secondTeamRoar(useRescue: boolean) {
    await runAction(() => window.changeBattle!.secondTeamRoar(useRescue));
  }

  async function finishExchange(ownIndex: number | null, enemyIndex: number | null) {
    await runAction(() => window.changeBattle!.exchange(ownIndex, enemyIndex));
  }

  async function restAction(action: RestAction) {
    await runAction(() => window.changeBattle!.restAction(action), undefined, !["roll_shop", "buy_shop_offer"].includes(action.type));
  }

  function openDex() {
    const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "prophet_first_mover"));
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
    if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onTalent={() => setScreen("talentConfig")} onInfo={() => setScreen("userInfo")} onTitle={() => setScreen("title")} />;
    if (screen === "userInfo") return <PlayerSettings title="玩家设置" save={save} name={save?.trainer.name || trainerName} catalog={trainerCatalog} onSaved={setSave} onBack={() => setScreen("mainMenu")} saveLabel="保存设置" />;
    if (screen === "talentConfig") return <TalentConfigView save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "starterItems") return <StarterItemsView starter={starter} save={save} onChoose={chooseStarterItem} onBack={cancelPreparation} />;
    if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} onStart={() => beginChallenge()} onBack={starter ? backToStarterItems : undefined} />;
    if (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen)) return <BattleView battle={battle} battleBag={battleBag} mode={screen} setMode={setScreen} onChoice={battleChoice} pendingTransition={pendingTransition} onBattleAnimationDone={applyState} />;
    if (screen === "secondTeamRoar") return <SecondTeamRoarView rescue={rescue} message={message} onChoose={secondTeamRoar} />;
    if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
    if (screen === "rest") return <RestView rest={rest} message={message} onAction={restAction} />;
    if (screen === "result") return <ResultView message={message} onBack={() => setScreen("mainMenu")} />;
    return null;
  }, [screen, save, trainerName, trainerCatalog, selectedPlayerId, selectedAvatarAsset, seed, candidates, selected, focusIndex, starter, battle, battleBag, exchange, rest, rescue, pendingTransition, message]);

  const isBattleScreen = ["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen);
  const transientMessage = error || (!isBattleScreen && screen !== "rest" ? message : "");
  const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "prophet_first_mover"));
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

function MainMenu({save, onStart, onTalent, onInfo, onTitle}: {save: LocalSave | null; onStart: () => void; onTalent: () => void; onInfo: () => void; onTitle: () => void}) {
  return <div className="title-screen small"><h1>{save?.trainer.name || "训练师"}</h1><p>Rank：{save?.stats.rank_status || "未开放"}　BP：{save?.stats.battle_points || 0}</p><div className="command-menu"><button onClick={onStart}>{save?.current_run ? "继续对局" : "开始对局"}</button><button onClick={onTalent}>天赋配置</button><button onClick={onInfo}>玩家设置</button><button onClick={onTitle}>返回标题</button></div></div>;
}

const DEX_TABS: Array<{id: DesktopDexCategory; label: string}> = [
  {id: "pokemon", label: "宝可梦"},
  {id: "abilities", label: "特性"},
  {id: "moves", label: "技能"},
  {id: "items", label: "道具"},
];
const DEX_PAGE_SIZE = 8;

function dexEntryText(entry: DesktopDexEntry): string {
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
    const timer = window.setTimeout(() => {
      void window.changeBattle!.dexSearch(category, query, currentPage * DEX_PAGE_SIZE, DEX_PAGE_SIZE).then(result => {
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
  }, [category, query, currentPage]);

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
        <input className="dex-search-input" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="搜索名称、英文、属性、说明" />
        <div className="dex-modal-body">
          <div className="dex-result-list">
            {loading ? <p>读取本地图鉴...</p> : null}
            {error ? <p>{error}</p> : null}
            {!loading && !error && entries.length === 0 ? <p>没有匹配结果。</p> : null}
            {entries.map(entry => (
              <button className={selected?.id === entry.id ? "selected" : ""} onClick={() => setSelectedId(entry.id)} key={`${entry.category}-${entry.id}`}>
                {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : null}
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

function DexEntryDetail({entry}: {entry: DesktopDexEntry | null}) {
  if (!entry) return <section className="dex-entry-detail empty"><p>选择一个条目。</p></section>;
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
  const selected = catalog.find(talent => talent.id === selectedId) || catalog[0];
  const selectedUnlocked = selected ? unlocked.has(selected.id) : false;
  const selectedEquipped = selected ? equipped.includes(selected.id) : false;
  const selectedAffordable = selected ? (save?.stats.battle_points || 0) >= (selected.cost || 0) : false;
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
    return `${talent.category === "交换" ? "exchange" : talent.category === "赌徒" ? "gambler" : talent.category === "先知" ? "prophet" : "business"} ${selectedId === talent.id ? "selected" : ""} ${unlocked.has(talent.id) ? "unlocked" : "locked"} ${equipped.includes(talent.id) ? "equipped" : ""}`;
  }

  async function unlockSelected() {
    if (!selected || selectedUnlocked || !selectedAffordable) return;
    const config = await window.changeBattle?.unlockTalent(selected.id);
    if (!config) return;
    setUnlocked(new Set((config.unlocked || []).map(talent => talent.id)));
    setEquipped((config.equipped || []).map(talent => talent.id));
    if (config.save) onSaved(config.save);
  }

  async function equipSelected() {
    if (!selected || !selectedUnlocked || selectedEquipped || equipped.length >= TALENT_EQUIP_LIMIT) return;
    const nextIds = [...equipped, selected.id];
    const config = await window.changeBattle?.configureTalents(nextIds);
    setEquipped((config?.equipped || []).map(talent => talent.id));
    if (config?.save) onSaved(config.save);
  }

  async function unequipSelected() {
    if (!selected) return;
    const nextIds = equipped.filter(id => id !== selected.id);
    const config = await window.changeBattle?.configureTalents(nextIds);
    setEquipped((config?.equipped || []).map(talent => talent.id));
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
        <nav className="talent-tabs">
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
        <footer className="talent-footer-note">为你的后续挑战选择祝福和风险。</footer>
      </section>
      <section className="talent-detail-panel">
        {selected ? (
          <div className="talent-detail-copy">
            <span>{selected.category}</span>
            <h3>{selected.name}</h3>
            <strong>{bpCostLabel(selected.cost || 0)} 需要</strong>
            <p>{selected.desc}</p>
            <small>{selectedEquipped ? "已携带" : selectedUnlocked ? "已解锁" : selectedAffordable ? "可解锁" : "BP 不足"}</small>
          </div>
        ) : null}
        <div className="talent-actions">
          <button disabled={!selected || selectedUnlocked || !selectedAffordable} onClick={unlockSelected}>解锁</button>
          <button disabled={!selected || !selectedUnlocked || selectedEquipped || equipped.length >= TALENT_EQUIP_LIMIT} onClick={equipSelected}>装备</button>
          <button disabled={!selectedEquipped} onClick={unequipSelected}>卸下</button>
          <button onClick={onBack}>返回</button>
        </div>
      </section>
    </div>
  );
}

function StarterItemsView({starter, save, onChoose, onBack}: {starter: DesktopGameState["starter"]; save: LocalSave | null; onChoose: (offerId: string | null) => void | Promise<void>; onBack: () => void | Promise<void>}) {
  const offers = starter?.offers || [];
  const purchasedOffers = starter?.purchased_list || (starter?.purchased ? [starter.purchased] : []);
  const purchasedIds = new Set(purchasedOffers.map(offer => offer.offer_id));
  const maxPurchases = starter?.max_purchases || 1;
  return (
    <div className="starter-page">
      <header>
        <div>
          <h2>开局道具</h2>
          <p>BP {save?.stats.battle_points || 0}　随机种子 {starter?.seed ?? "--"}　已购买 {purchasedOffers.length}/{maxPurchases}</p>
        </div>
        <div className="starter-actions">
          <button disabled={Boolean(purchasedOffers.length)} onClick={() => onChoose("__reroll__")}>重新随机（100BP）</button>
          <button onClick={() => onChoose(null)}>跳过</button>
          <button onClick={onBack}>返回</button>
        </div>
      </header>
      <section className="starter-offers">
        {offers.length ? offers.map(offer => (
          <button className={`starter-offer ${purchasedIds.has(offer.offer_id) ? "selected" : ""}`} disabled={purchasedIds.has(offer.offer_id) || purchasedOffers.length >= maxPurchases} onClick={() => onChoose(offer.offer_id)} key={offer.offer_id}>
            <ItemIcon item={offer} />
            <strong>{offer.name_zh || offer.name}</strong>
            <span><b className={offer.discount && offer.discount < 1 ? "discount-badge" : "price-badge"}>{starterDiscountLabel(offer.discount)}</b><i>{bpCostLabel(offer.cost)}{purchasedIds.has(offer.offer_id) ? "　已购买" : ""}</i></span>
            <small>{itemCategoryLabel(offer.category)}　{offer.desc_zh || offer.desc || offer.name}</small>
          </button>
        )) : <p>正在抽取开局道具...</p>}
      </section>
    </div>
  );
}

function RentalSelect({candidates, selected, focusIndex, setFocusIndex, onToggle, onStart, onBack}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; setFocusIndex: (index: number) => void; onToggle: (index: number) => void; onStart: () => void | Promise<void>; onBack?: () => void | Promise<void>}) {
  const pokemon = candidates[focusIndex];
  if (!pokemon) return <div className="loading-panel"><strong>正在生成租赁候选...</strong></div>;
  const focusedSelected = selected.includes(focusIndex);
  const selectLabel = focusedSelected ? "取消选中" : selected.length >= 3 ? "替换第3只" : "选中";
  return <div className="dex-layout"><PokemonProfile pokemon={pokemon} selected={focusedSelected} /><div className="dex-actions"><span>候选 {focusIndex + 1}/{candidates.length}</span><span>已选择：{selected.map(index => displayName(candidates[index])).join(" / ") || "无"}</span><div className="command-row">{onBack ? <button onClick={onBack}>返回开局道具</button> : null}<button onClick={() => setFocusIndex((focusIndex + candidates.length - 1) % candidates.length)}>上一只</button><button onClick={() => setFocusIndex((focusIndex + 1) % candidates.length)}>下一只</button><button onClick={() => onToggle(focusIndex)}>{selectLabel}</button><button disabled={selected.length !== 3} onClick={onStart}>开始挑战</button></div></div></div>;
}

function PokemonProfile({pokemon, selected = false, runtime, compact = false}: {pokemon: RentalPokemon; selected?: boolean; runtime?: RuntimePokemon; compact?: boolean}) {
  return <div className={`pokemon-profile ${compact ? "compact" : ""}`}><aside className="profile-card"><span>No.{pokemon.sprite?.national_dex || "?"}</span><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge="full" /><h2>{displayName(pokemon)}</h2><p>{pokemon.species}</p><p>Lv{pokemon.level} {pokemon.gender}</p>{selected ? <strong>已选中</strong> : null}</aside><section className="profile-info"><h3>{pokemon.types_zh.join(" / ")}　{pokemon.nature_zh}</h3><div className="info-strip"><span>特性</span><strong>{pokemon.ability_zh}</strong><span>道具</span><strong>{pokemon.item_zh || "无"}</strong><span>HP</span><strong>{runtime ? conditionText(runtime.condition) : pokemon.stats.hp}</strong></div><div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat)}</strong></div>)}</div><div className="moves-panel">{pokemon.moves.map(move => <div className="move-detail" key={move.id}><strong>{move.name_zh}</strong><span>{move.type_zh}/{move.category_zh}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span><p>{move.desc_zh || move.desc || "暂无说明"}</p></div>)}</div></section></div>;
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

function BattleView({battle, battleBag, mode, setMode, onChoice, pendingTransition, onBattleAnimationDone}: {battle: BattleState | null; battleBag: BagCategoryView | null; mode: AppStatus; setMode: (mode: AppStatus) => void; onChoice: (choice: string) => void; pendingTransition: DesktopGameState | null; onBattleAnimationDone: (state: DesktopGameState) => void}) {
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
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [itemTargetIndex, setItemTargetIndex] = useState(0);
  const [battleItemOpen, setBattleItemOpen] = useState(false);
  const previousTimelineKeys = useRef<string[]>([]);
  const previousRecentEvents = useRef<string[]>([]);
  const displayConditionsRef = useRef(displayConditions);
  const displayedActiveNamesRef = useRef(displayedActiveNames);
  const displayedSubstitutesRef = useRef(displayedSubstitutes);
  const previousBattlePresent = useRef(false);
  const eventTimers = useRef<number[]>([]);
  const playbackRun = useRef(0);
  const finishRequested = useRef(false);

  useEffect(() => { displayConditionsRef.current = displayConditions; }, [displayConditions]);
  useEffect(() => { displayedActiveNamesRef.current = displayedActiveNames; }, [displayedActiveNames]);
  useEffect(() => { displayedSubstitutesRef.current = displayedSubstitutes; }, [displayedSubstitutes]);
  useEffect(() => {
    const battlePresent = Boolean(battle);
    if (battlePresent && !previousBattlePresent.current) {
      setTrainerIntroActive(true);
      setIntroActive(false);
      const trainerTimer = window.setTimeout(() => {
        setTrainerIntroActive(false);
        setIntroActive(true);
      }, 1750);
      const pokemonTimer = window.setTimeout(() => setIntroActive(false), 2950);
      previousBattlePresent.current = true;
      return () => {
        window.clearTimeout(trainerTimer);
        window.clearTimeout(pokemonTimer);
      };
    }
    previousBattlePresent.current = battlePresent;
    if (!battlePresent) {
      setIntroActive(false);
      setTrainerIntroActive(false);
    }
  }, [Boolean(battle)]);

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
        finishRequested.current = true;
        onBattleAnimationDone(pendingTransition);
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
        finishRequested.current = true;
        onBattleAnimationDone(pendingTransition);
      }
    }

    void playQueue();
    return () => {
      eventTimers.current.forEach(timer => window.clearTimeout(timer));
      eventTimers.current = [];
    };
  }, [timelineKey, recentKey]);

  if (!battle) return <div className="loading-panel"><strong>正在进入对局...</strong></div>;
  const controlsDisabled = playbackActive || introActive || trainerIntroActive;
  const displayPlayer = findDisplay(battle.player_display, displayedActiveNames.p1) || player.display;
  const displayEnemy = findDisplay(battle.enemy_display, displayedActiveNames.p2) || enemy.display;
  const playerSprite = displayedSubstitutes.p1 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const enemySprite = displayedSubstitutes.p2 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const activePlayerIndex = Math.max(0, battle.request?.side?.pokemon?.findIndex(pokemon => pokemon.active) ?? 0);
  const messageDuration = currentTimelineEvent ? timelineDuration(currentTimelineEvent, displayConditions[currentTimelineEvent.targetSide || "p1"]) : 1600;
  const messageMs = currentTimelineEvent?.notice_title ? Math.max(2200, messageDuration) : Math.max(900, messageDuration);
  const detailOpen = detailIndex !== null || mode === "teamMenu";
  const detailInitialIndex = detailIndex ?? activePlayerIndex;
  return <div className="battle-layout"><section className={`battle-field ${trainerIntroActive ? "trainer-intro" : ""} ${introActive ? "battle-intro" : ""} ${battleAnimationClass(currentTimelineEvent)}`}><FieldEffectsOverlay battle={battle} /><BattleEffectLayer cue={currentVisualCue} />{trainerIntroActive ? <TrainerIntroOverlay battle={battle} /> : null}<div className="turn-badge">第 {battle.tracker.turn} 回合</div><div className="battle-corner-actions"><button disabled={controlsDisabled} onClick={() => setMode("statusMenu")}>状态</button><button className="danger-button" disabled={controlsDisabled} onClick={() => onChoice("forfeit")}>认输</button></div><FighterPanel side="enemy" pokemon={displayEnemy} condition={displayConditions.p2} status={battle.tracker.active.p2.status} substitute={displayedSubstitutes.p2} transitionMs={hpTransitionMs.p2} /><div className="battle-sprites"><PokemonSprite className={`back-sprite ${displayedSubstitutes.p1 ? "substitute-sprite" : ""} ${faintedSides.p1 ? "sprite-fainted" : ""}`} pokemon={displayedSubstitutes.p1 ? undefined : displayPlayer} src={playerSprite} variant="back_normal" alt={displayPlayer ? displayName(displayPlayer) : "我方宝可梦"} entrance={!displayedSubstitutes.p1 && introActive} onClick={() => setDetailIndex(activePlayerIndex)} /><PokemonSprite className={`front-sprite ${displayedSubstitutes.p2 ? "substitute-sprite" : ""} ${faintedSides.p2 ? "sprite-fainted" : ""}`} pokemon={displayedSubstitutes.p2 ? undefined : displayEnemy} src={enemySprite} alt={displayEnemy ? displayName(displayEnemy) : "对手宝可梦"} entrance={!displayedSubstitutes.p2 && introActive} /></div><FighterPanel side="player" pokemon={displayPlayer} condition={displayConditions.p1} status={battle.tracker.active.p1.status} substitute={displayedSubstitutes.p1} transitionMs={hpTransitionMs.p1} onClick={() => setDetailIndex(activePlayerIndex)} />{currentTimelineEvent ? <div key={currentTimelineEvent.id} className={`battle-message-pop ${currentTimelineEvent.notice_title ? "structured" : ""}`} style={{"--message-duration": `${messageMs}ms`} as CSSProperties}>{currentTimelineEvent.notice_title ? <><strong>{currentTimelineEvent.notice_title}</strong>{currentTimelineEvent.notice_detail ? <small>{currentTimelineEvent.notice_detail}</small> : null}</> : currentTimelineEvent.text}</div> : null}</section><section className="battle-bottom"><div className="battle-log"><strong>上一回合</strong>{shownEvents.map((event, index) => <p className={event === currentTimelineEvent?.text ? "current-event" : ""} key={`${event}-${index}`}>{event}</p>)}</div><div className={`battle-action-panel ${controlsDisabled ? "battle-controls-disabled" : ""}`}>{mode === "moveMenu" ? <MoveMenu battle={battle} disabled={controlsDisabled} onMove={index => onChoice(`move ${index}`)} onBack={() => setMode("battleMain")} /> : <MainBattleCommands forceSwitch={Boolean(battle.request?.forceSwitch)} disabled={controlsDisabled} setMode={setMode} onBag={() => { setItemTargetIndex(activePlayerIndex); setBattleItemOpen(true); }} />}</div></section>{mode === "statusMenu" ? <StatusModal battle={battle} onBack={() => setMode("battleMain")} /> : null}{detailOpen ? <PokemonDetailModal battle={battle} initialIndex={detailInitialIndex} disabled={controlsDisabled} onSwitch={index => onChoice(`switch ${index}`)} onClose={() => { setDetailIndex(null); if (mode === "teamMenu") setMode("battleMain"); }} /> : null}{battleItemOpen ? <BattleItemModal battle={battle} bag={battleBag} initialTarget={itemTargetIndex} onClose={() => setBattleItemOpen(false)} onUse={(itemId, target, moveSlot) => { setBattleItemOpen(false); onChoice(`item ${itemId} ${target + 1}${moveSlot ? ` ${moveSlot}` : ""}`); }} /> : null}</div>;
}

function TrainerIntroOverlay({battle}: {battle: BattleState}) {
  const player = battle.player_trainer;
  const enemy = battle.enemy_trainer;
  const enemyName = enemy?.name_zh || "训练师";
  const playerImage = trainerImageUrl(player, "back");
  const enemyImage = trainerImageUrl(enemy, "frontGif");
  return (
    <div className="trainer-intro-layer">
      {playerImage ? <img className="trainer-sprite trainer-player" src={playerImage} alt={player?.name_zh || "玩家"} /> : null}
      {enemyImage ? <img className="trainer-sprite trainer-enemy" src={enemyImage} alt={enemyName} /> : null}
      <div className="trainer-intro-message"><strong>{enemyName} 前来挑战了</strong></div>
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

function MainBattleCommands({forceSwitch, disabled, setMode, onBag}: {forceSwitch: boolean; disabled?: boolean; setMode: (mode: AppStatus) => void; onBag: () => void}) {
  return <div className="command-grid battle-command-grid">{forceSwitch ? <button disabled={disabled} onClick={() => setMode("teamMenu")}>换人</button> : <button disabled={disabled} onClick={() => setMode("moveMenu")}>战斗</button>}<button disabled={disabled} onClick={() => setMode("teamMenu")}>宝可梦</button><button disabled={disabled || forceSwitch} onClick={onBag}>背包</button></div>;
}

function MoveMenu({battle, disabled, onMove, onBack}: {battle: BattleState; disabled?: boolean; onMove: (index: number) => void; onBack: () => void}) {
  const moves = battle.request?.active?.[0]?.moves || [];
  const active = activePokemon(battle, "p1").display;
  const target = activePokemon(battle, "p2").display;
  return <div className="move-menu">{moves.map((move, index) => { const summary = moveSummaryFor(active, move); const multiplier = moveEffectiveness(summary, target); const superEffective = Boolean(battle.show_move_effectiveness && multiplier > 1); const damageRange = moveDamageRangeLabel(summary, active, target, battle); return <button className={`move-choice ${moveTypeClass(summary)} ${superEffective ? "move-super-effective" : ""}`} key={move.id || index} disabled={disabled || move.disabled} onClick={() => onMove(index + 1)}><strong>{summary?.name_zh || move.move}{superEffective ? <i>克制</i> : null}</strong><span><b>{moveTypeLabel(summary)}</b> PP {move.pp}/{move.maxpp}{superEffective ? ` x${multiplier}` : ""}</span>{damageRange ? <small className="damage-range">[{damageRange}]</small> : null}</button>; })}<button className="menu-back" disabled={disabled} onClick={onBack}>返回</button></div>;
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
                  <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat)}</strong></div>)}</div>
                  <p><b>特性说明：</b>{pokemon.ability_desc_zh || pokemon.ability_desc || "暂无说明"}</p>
                  <p><b>道具说明：</b>{pokemon.item_desc_zh || pokemon.item_desc || "无道具"}</p>
                </div>
              </div>
            ) : (
              <div className="detail-moves">
                {pokemon.moves.map(move => <div className="move-detail" key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span><span>{ppText(move)}</span><p>{move.desc_zh || move.desc || "暂无说明"}</p></div>)}
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
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [talentOpen, setTalentOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [moveEditorSlot, setMoveEditorSlot] = useState<number | null>(null);
  const [statsEditorSlot, setStatsEditorSlot] = useState<number | null>(null);
  const [abortConfirmOpen, setAbortConfirmOpen] = useState(false);

  if (!rest) return <div className="loading-panel"><strong>正在整理队伍...</strong></div>;
  const allBagItems = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat();
  const hasScoutTalent = hasRunTalent(rest, "prophet_next_scout");
  const hasReviewTalent = hasRunTalent(rest, "prophet_history_review");
  const showScoutInsight = hasScoutTalent || Boolean(rest.scout);
  const showReviewInsight = hasReviewTalent || Boolean(rest.review?.enemies?.length);

  return (
    <div className="rest-page">
      <header className="rest-header">
        <div>
          <h2>休整菜单</h2>
          <p>第 {rest.battle_no}/{rest.battles} 场后　连胜 {rest.wins}　BP {rest.battle_points}</p>
          <button className="talent-inline-button" onClick={() => setTalentOpen(true)}>本局天赋：{rest.talents?.length ? rest.talents.map(talent => `${talent.name}（${talent.category}）`).join(" / ") : "当前无天赋"}</button>
          {message ? <p className="rest-message">{message}</p> : null}
        </div>
        <div className="rest-header-insights">
          {showScoutInsight ? (
            <button className="rest-scout-box compact" onClick={() => setTalentOpen(true)}>
              <strong>{rest.scout?.title || "尚未侦查下一场"}</strong>
              <span>{rest.scout?.summary || "使用未卜先知查看下一场对手。"}</span>
              {rest.scout?.enemies?.length ? <div>{rest.scout.enemies.map(enemy => <small key={enemy.species_id}>{displayName(enemy)}</small>)}</div> : null}
            </button>
          ) : null}
          {showReviewInsight ? (
            <button className="rest-scout-box compact" onClick={() => setTalentOpen(true)}>
              <strong>上一场回顾</strong>
              <span>{rest.review?.enemies?.length ? rest.review.enemies.map(enemy => displayName(enemy)).join(" / ") : "使用温故知新查看上一场对手详情。"}</span>
            </button>
          ) : null}
        </div>
        <div className="rest-header-actions">
          <button onClick={() => setRestoreOpen(true)}>恢复</button>
          <button onClick={() => setExchangeOpen(true)}>交换</button>
          <button onClick={() => setBagOpen(true)}>背包/出售</button>
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
      {restoreOpen ? <RestoreModal rest={rest} onClose={() => setRestoreOpen(false)} onAction={onAction} /> : null}
      {exchangeOpen ? <RestExchangeModal rest={rest} onClose={() => setExchangeOpen(false)} onAction={onAction} /> : null}
      {bagOpen ? <BagManageModal rest={rest} onClose={() => setBagOpen(false)} onAction={onAction} /> : null}
      {talentOpen ? <RunTalentModal rest={rest} onClose={() => setTalentOpen(false)} onAction={onAction} /> : null}
      {shopOpen ? <ShopModal shop={rest.shop} onClose={() => setShopOpen(false)} onRoll={() => onAction({type: "roll_shop"})} onBuy={offerId => onAction({type: "buy_shop_offer", offerId})} /> : null}
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
  return ["exchange_safe_box", "gambler_all_in_exchange", "prophet_next_scout", "prophet_history_review", "prophet_future_boss"].includes(id);
}

function RestPokemonModal({rest, initialSlot, onClose, onMove, onUnequip, onStats}: {rest: NonNullable<DesktopGameState["rest"]>; initialSlot: number; onClose: () => void; onMove: (slot: number) => void; onUnequip: (slot: number) => void; onStats: (slot: number) => void}) {
  const [slot, setSlot] = useState(initialSlot);
  const [tab, setTab] = useState<"info" | "moves" | "stats" | "items">("info");
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const state = rest.player_state[slot] || rest.player_state[0];
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
            {tab === "moves" ? <div className="detail-move-list">{pokemon.moves.map((move, index) => <article key={`${move.id}-${index}`}><strong>{index + 1}. {move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {state?.moves?.[index]?.pp ?? move.pp}/{state?.moves?.[index]?.maxpp ?? move.pp}</span><small>{move.desc_zh || move.desc || move.short_desc_zh || move.short_desc}</small></article>)}</div> : null}
            {tab === "stats" ? <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat)}</strong></div>)}</div> : null}
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

function RestoreModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [selected, setSelected] = useState(0);
  const [moveSlot, setMoveSlot] = useState(1);
  const targetState = rest.player_state[selected] || rest.player_state[0];
  useEffect(() => {
    setMoveSlot(targetState?.moves?.[0]?.slot || 1);
  }, [selected]);
  return (
    <div className="modal-layer">
      <section className="rest-edit-modal restore-modal">
        <header><h2>恢复</h2><button onClick={onClose}>关闭</button></header>
        <div className="restore-target-list">
          {rest.player_display.map((pokemon, index) => <button className={selected === index ? "selected" : ""} onClick={() => setSelected(index)} key={`${pokemon.species_id}-restore`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><strong>{displayName(pokemon)}</strong><span>{conditionText(rest.player_state[index]?.condition)}</span><small>{(rest.player_state[index]?.moves || []).map(move => `${move.move} ${move.pp}/${move.maxpp}`).join(" / ")}</small></button>)}
        </div>
        {targetState?.moves?.length ? <select value={moveSlot} onChange={event => setMoveSlot(Number(event.target.value))}>{targetState.moves.map(move => <option value={move.slot} key={`${move.id}-restore-pp-${move.slot}`}>{move.move} PP {move.pp}/{move.maxpp}</option>)}</select> : null}
        <div className="command-row">
          <button disabled={Boolean(rest.restore_hp_used)} onClick={() => onAction({type: "restore_hp", slots: [selected + 1]})}>{rest.restore_hp_used ? "恢复HP已使用" : "恢复HP（免费）"}</button>
          <button disabled={Boolean(rest.restore_pp_used)} onClick={() => onAction({type: "restore_pp", slots: [selected + 1], moveSlot})}>{rest.restore_pp_used ? "恢复PP已使用" : "恢复PP+10（免费）"}</button>
          <button disabled={Boolean(rest.restore_status_used)} onClick={() => onAction({type: "restore_status", slots: [selected + 1]})}>{rest.restore_status_used ? "恢复异常已使用" : "恢复异常（免费）"}</button>
        </div>
      </section>
    </div>
  );
}

function RestExchangeModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [own, setOwn] = useState(0);
  const [enemy, setEnemy] = useState(0);
  const [boxIndex, setBoxIndex] = useState(0);
  const canExchange = rest.costs.exchange !== null && rest.enemy_display.length > 0 && !rest.taken_enemy_slots.includes(enemy + 1);
  const box = rest.exchange_box || [];
  const canBoxExchange = hasRunTalent(rest, "exchange_safe_box") && box.length > 0;
  const canAllIn = hasRunTalent(rest, "gambler_all_in_exchange") && !rest.all_in_used;
  return (
    <div className="modal-layer">
      <section className="rest-edit-modal exchange-rest-modal">
        <header><div><h2>交换宝可梦</h2><p>本次费用：{bpCostLabel(rest.costs.exchange)}　已交换 {rest.exchange_count}/3</p></div><button onClick={onClose}>关闭</button></header>
        <div className="rest-exchange-grid">
          <div>{rest.player_display.map((pokemon, index) => <button className={`mini-pokemon-card ${own === index ? "selected" : ""}`} onClick={() => setOwn(index)} key={`${pokemon.species_id}-own-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span></button>)}</div>
          <div>{rest.enemy_display.map((pokemon, index) => <button className={`mini-pokemon-card ${enemy === index ? "selected" : ""}`} disabled={rest.taken_enemy_slots.includes(index + 1)} onClick={() => setEnemy(index)} key={`${pokemon.species_id}-enemy-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span>{rest.taken_enemy_slots.includes(index + 1) ? <small>已交换</small> : null}</button>)}</div>
        </div>
        {hasRunTalent(rest, "exchange_safe_box") ? <div className="safe-box-panel">
          <h3>无损交易盒</h3>
          <div className="safe-box-list">
            {box.length ? box.map((pokemon, index) => <button className={`mini-pokemon-card ${boxIndex === index ? "selected" : ""}`} onClick={() => setBoxIndex(index)} key={`${pokemon.species_id}-box-${index}`}><PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} /><span>{displayName(pokemon)}</span><small>{pokemon.item_zh || "无道具"}</small></button>) : <p>击败对手后，遇到的宝可梦会进入盒子。</p>}
          </div>
        </div> : null}
        <div className="command-row">
          <button disabled={!canExchange} onClick={() => onAction({type: "exchange", ownIndex: own, enemyIndex: enemy})}>确认交换</button>
          {hasRunTalent(rest, "exchange_safe_box") ? <button disabled={!canBoxExchange} onClick={() => onAction({type: "box_exchange", ownIndex: own, boxIndex})}>从盒子交换</button> : null}
          {hasRunTalent(rest, "gambler_all_in_exchange") ? <button disabled={!canAllIn} onClick={() => onAction({type: "all_in_exchange", ownIndex: own})}>{rest.all_in_used ? "孤注一掷已用" : "孤注一掷"}</button> : null}
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
            {items.length ? items.map(item => <button className={selected?.id === item.id ? "selected" : ""} onClick={() => setItemId(item.id)} key={item.id}><ItemIcon item={item} /><strong>{item.name_zh || item.name}</strong><span>x{item.count}　{itemCategoryLabel(item.category)}</span><small>售价 {bpCostLabel(item.sell_price)}　{item.desc_zh || item.desc || item.name}</small></button>) : <p>背包为空。</p>}
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
                <button onClick={() => selected && onAction({type: "sell_item", itemId: selected.id})}>出售（{bpCostLabel(selected.sell_price)}）</button>
              </div>
            </> : <p>背包为空。</p>}
          </section>
        </div>
      </section>
    </div>
  );
}

function RunTalentModal({rest, onClose, onAction}: {rest: NonNullable<DesktopGameState["rest"]>; onClose: () => void; onAction: (action: RestAction) => void | Promise<void>}) {
  const [allInSlot, setAllInSlot] = useState(0);
  const [boxOwnSlot, setBoxOwnSlot] = useState(0);
  const [boxSlot, setBoxSlot] = useState(0);
  const canAllIn = hasRunTalent(rest, "gambler_all_in_exchange") && !rest.all_in_used;
  const box = rest.exchange_box || [];
  const canBoxExchange = hasRunTalent(rest, "exchange_safe_box") && box.length > 0;

  function talentActionPanel(talent: TalentView) {
    if (talent.id === "prophet_next_scout") {
      return (
        <div className="talent-card-actions">
          <button disabled={Boolean(rest.free_scout_used)} onClick={() => onAction({type: "scout_next", level: "one"})}>{rest.free_scout_used ? "免费侦查已用" : `免费侦查1只（${bpCostLabel(rest.costs.scout_one)}）`}</button>
          <button onClick={() => onAction({type: "scout_next", level: "all"})}>侦查全部（{bpCostLabel(rest.costs.scout_all)}）</button>
        </div>
      );
    }
    if (talent.id === "prophet_history_review") {
      return <div className="talent-card-actions"><button disabled={!rest.enemy_display.length} onClick={() => onAction({type: "review_previous"})}>回顾上一场（{bpCostLabel(rest.costs.review_previous)}）</button></div>;
    }
    if (talent.id === "prophet_future_boss") {
      return <div className="talent-card-actions"><button onClick={() => onAction({type: "scout_final_boss"})}>预知关底</button></div>;
    }
    if (talent.id === "gambler_all_in_exchange") {
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
    if (talent.id === "exchange_safe_box") {
      return (
        <div className="talent-card-actions">
          <div className="talent-target-row compact">
            {rest.player_display.map((pokemon, index) => (
              <button className={boxOwnSlot === index ? "selected" : ""} disabled={!canBoxExchange} onClick={() => setBoxOwnSlot(index)} key={`${pokemon.species_id}-box-own-${index}`}>
                <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
                <span>{index + 1}. {displayName(pokemon)}</span>
              </button>
            ))}
          </div>
          <div className="talent-target-row compact">
            {box.length ? box.map((pokemon, index) => (
              <button className={boxSlot === index ? "selected" : ""} onClick={() => setBoxSlot(index)} key={`${pokemon.species_id}-box-talent-${index}`}>
                <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
                <span>{displayName(pokemon)}</span>
              </button>
            )) : <p>盒子为空，击败对手后遇到的宝可梦会先进入盒子。</p>}
          </div>
          <button disabled={!canBoxExchange} onClick={() => onAction({type: "box_exchange", ownIndex: boxOwnSlot, boxIndex: boxSlot})}>从盒子交换</button>
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
            <article className={isActiveRunTalent(talent.id) ? "active-talent-card" : ""} key={talent.id}>
              <strong>{talent.name}</strong>
              <span>{talent.category}</span>
              <p>{talent.desc}</p>
              {talentActionPanel(talent)}
            </article>
          )) : <p>当前无天赋。</p>}
        </div>
        {rest.scout ? <div className="rest-scout-box"><strong>{rest.scout.title}</strong><span>{rest.scout.summary}</span>{rest.scout.enemies.map(enemy => <small key={`${enemy.species_id}-scout`}>{displayName(enemy)}</small>)}</div> : null}
        {rest.future_boss?.enemies?.length ? <div className="review-list">{rest.future_boss.enemies.map(enemy => <article key={`${enemy.species_id}-future`}><PokemonSprite pokemon={enemy} alt={displayName(enemy)} /><strong>{displayName(enemy)}</strong><small>{enemy.ability_zh || enemy.ability} / {enemy.nature_zh || enemy.nature}</small><small>{enemy.item_zh || "无道具"}</small><small>{enemy.moves.map(move => move.name_zh || move.name).join(" / ")}</small></article>)}</div> : null}
        {rest.review?.enemies?.length ? <div className="review-list">{rest.review.enemies.map(enemy => <article key={`${enemy.species_id}-review`}><PokemonSprite pokemon={enemy} alt={displayName(enemy)} /><strong>{displayName(enemy)}</strong><small>{enemy.ability_zh || enemy.ability} / {enemy.nature_zh || enemy.nature}</small><small>{enemy.item_zh || "无道具"}</small><small>{enemy.moves.map(move => move.name_zh || move.name).join(" / ")}</small></article>)}</div> : null}
      </section>
    </div>
  );
}

function ShopModal({shop, onClose, onRoll, onBuy}: {shop: NonNullable<DesktopGameState["rest"]>["shop"]; onClose: () => void; onRoll: () => void | Promise<void>; onBuy: (offerId: string) => void | Promise<void>}) {
  const offers = shop?.offers || [];
  const slotCount = shop?.slot_count || offers.length || 3;
  const [rolling, setRolling] = useState(false);
  const [revealed, setRevealed] = useState(Boolean(offers.length));
  const purchased = Boolean(shop?.purchased_offer_id);
  const bonus = shop?.last_roll_bonus || null;

  useEffect(() => {
    if (!offers.length) setRevealed(false);
    else if (!rolling) setRevealed(true);
  }, [offers.length, rolling]);

  async function roll() {
    setRolling(true);
    setRevealed(false);
    await onRoll();
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
            <p>抽奖次数 {shop?.roll_count || 0}　下次抽奖 {bpCostLabel(shop?.next_roll_cost)}　{slotCount} 格</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="command-row"><button disabled={rolling} onClick={roll}>抽奖（{bpCostLabel(shop?.next_roll_cost)}）</button><button onClick={onClose}>跳过</button></div>
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
                <span>{itemCategoryLabel(item.category)}　{bpCostLabel(item.cost)}</span>
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
  const [directMoves, setDirectMoves] = useState<MoveSummary[]>([]);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const playerDisplay = rest.player_display || [];
  const pokemon = playerDisplay[slot] || playerDisplay[0];
  const pokemonMoves = pokemon?.moves || [];
  const currentMove = pokemonMoves[moveSlot];
  const draws = rest.move_draws?.[`${slot}:${moveSlot}`] || [];
  const tmItems = rest.bag_categories?.tm || [];
  const directEnabled = hasRunTalent(rest, "prophet_direct_move");
  const moveColumnCount = 1 + (directEnabled ? 1 : 0) + (tmItems.length ? 1 : 0);

  useEffect(() => {
    let cancelled = false;
    if (!directEnabled) {
      setDirectMoves([]);
      return () => { cancelled = true; };
    }
    setLoadingDirect(true);
    void window.changeBattle?.learnableMoves(slot).then(moves => {
      if (!cancelled) setDirectMoves(moves || []);
    }).finally(() => {
      if (!cancelled) setLoadingDirect(false);
    });
    return () => { cancelled = true; };
  }, [slot, directEnabled]);

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
                <div className="command-row"><button onClick={() => onAction({type: "draw_moves", slot, moveSlot})}>抽取候选（{bpCostLabel(rest.costs.move_draw)}）</button></div>
                <div className="learnable-list">{draws.length ? draws.map(move => <button onClick={() => { onAction({type: "apply_drawn_move", slot, moveSlot, moveId: move.id}); onClose(); }} key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}　威力 {move.power || "--"}　PP {move.pp}</span><small>{move.desc_zh || move.desc || "暂无说明"}</small></button>) : <p>先抽取候选技能，再选择一个替换当前招式。</p>}</div>
              </section>
              {directEnabled ? <section>
                <h4>直接选择</h4>
                <div className="learnable-list">{loadingDirect ? <p>正在读取可学习技能...</p> : directMoves.map(move => <button onClick={() => { onAction({type: "apply_direct_move", slot, moveSlot, moveId: move.id}); onClose(); }} key={`direct-${move.id}`}><strong>{move.name_zh || move.name}</strong><span>{bpCostLabel(rest.costs.direct_move)}　{move.type_zh}/{move.category_zh}</span><small>{move.desc_zh || move.desc || "暂无说明"}</small></button>)}</div>
              </section> : null}
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
              <button className="dice-button" onClick={() => onAction({type: "randomize_all_stats", slot})}>🎲（{bpCostLabel(rest.costs.randomize_all)}）</button>
            </header>
            <div className="stats-meta-grid">
              <div><span>性格</span><strong>{pokemon.nature_zh || pokemon.nature || "未知"}</strong><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "nature"})}>🎲（{bpCostLabel(rest.costs.randomize_part)}）</button></div>
              <div><span>特性</span><strong>{pokemon.ability_zh || pokemon.ability || "未知"}</strong><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "ability"})}>🎲（{bpCostLabel(rest.costs.randomize_part)}）</button></div>
            </div>
            <div className="stat-reset-table">
              <div className="stat-reset-head"><span /><span>能力值</span><span><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "ivs"})}>个体 🎲（{bpCostLabel(rest.costs.randomize_part)}）</button></span><span><button className="dice-button small" onClick={() => onAction({type: "randomize_stat_part", slot, part: "evs"})}>努力值 🎲（{bpCostLabel(rest.costs.randomize_part)}）</button></span></div>
              {STAT_ROWS.map(([stat, label]) => <div className="stat-reset-row" key={stat}><span>{label}<b>{statMarker(pokemon, stat)}</b></span><strong>{pokemon.stats[stat] ?? "?"}</strong><strong>{pokemon.ivs[stat] ?? "?"}</strong><strong>{pokemon.evs[stat] ?? "?"}</strong></div>)}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SecondTeamRoarView({rescue, message, onChoose}: {rescue: DesktopGameState["rescue"]; message?: string; onChoose: (useRescue: boolean) => void | Promise<void>}) {
  return (
    <div className="title-screen small second-team-page">
      <h1>二队的怒吼</h1>
      <p>{message || "队伍已经全灭，可以选择是否支付 BP 触发二队救援。"}</p>
      <p>第 {rescue?.battle_no || "--"} 场　费用 {bpCostLabel(rescue?.cost || 0)}</p>
      {!rescue?.can_pay ? <strong className="danger-copy">当前 BP 不足，无法发动。</strong> : null}
      <div className="command-row">
        <button disabled={!rescue?.can_pay} onClick={() => onChoose(true)}>使用二队的怒吼</button>
        <button className="danger-button" onClick={() => onChoose(false)}>放弃救援</button>
      </div>
    </div>
  );
}

function ResultView({message, onBack}: {message: string; onBack: () => void}) {
  return <div className="title-screen small"><h1>结算</h1><p>{message}</p><button onClick={onBack}>返回主界面</button></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
