import {Fragment, useEffect, useMemo, useRef, useState} from "react";
import type {CSSProperties} from "react";
import type {AppStatus, BagCategoryView, BagItemView, BattleAiHint, BattleBackgroundView, BattleMoveRequest, BattleState, BattleTimelineEvent, BattleTurnPokemonState, BattleTurnRecord, DesktopGameState, MoveSummary, RentalPokemon, RestEventStatusView, RuntimePokemon} from "@changebattle/shared";
import {BATTLE_SYSTEM_OPTIONS} from "@changebattle/shared";
import {ItemIcon, PokemonSprite, STAT_ROWS, SUBSTITUTE_DOLL_PATH, abilityDescription, activePokemon, assetUrl, battleDialogueKey, battleEffectEntry, boostEffectKeys, bossDialogueGroups, bossDialogueVariant, bpCostLabel, coinCostLabel, conditionText, cueFromEntry, displayForRuntime, displayName, displayFromActive, eventTargetsDisplayedActive, fieldEffectKeys, findDisplay, findDisplayByShowdownId, firstBattleEffectEntry, hpTone, moveCategoryId, moveCueTargetSide, moveDescription, moveEffectKeys, moveSummaryByName, moveSummaryFor, parseHp, playPokemonCry, runtimeName, statLine, statusCode, statusEffectKeys, statusLabel, timelineFaintedState, toId, trainerDialogueLines, trainerDialogueTitle, trainerDisplayName, trainerImageUrl, typeId, weatherEffectKeys} from "../../lib/ui";
import type {BattleEffectEntry, BattleVisualCue, PartyStatusSlot, TrainerDialogueMoment, TrainerDialogueState} from "../../lib/ui";
import {ScreenToast} from "../feedback/ScreenToast";
import {EventInfoModal} from "../feedback/EventInfoModal";
import {BagActionPanel, type BagActionStep} from "../bag/BagActionPanel";
import {BagFilterTabs} from "../bag/BagFilterTabs";
import {BagItemList} from "../bag/BagItemList";
import {BAG_FILTERS, bagFilterForItem, type BagFilterKey} from "../bag/bagModel";
import {MoveCard} from "../move/MoveCard";
import {QuickDexModal} from "../dex/QuickDexModal";
import {BattleAiHintModal} from "./BattleAiHintModal";
import {BattleCommandPanel} from "./BattleCommandPanel";
import {BattleField} from "./BattleField";
import {BattleFighterPanel} from "./BattleFighterPanel";
import {BattleMoveMenu} from "./BattleMoveMenu";
import {BattleMainCommands} from "./BattleMainCommands";
import {BattlePage} from "./BattlePage";
import {BattlePartyBoard} from "./BattlePartyBoard";
import {BattleBagPanel} from "./BattleBagPanel";
import {BattlePokemonDetail} from "./BattlePokemonDetail";
import {BattleTeamMenu} from "./BattleTeamMenu";
import {BattleToolbar} from "./BattleToolbar";
import {BattleTurnRecordPanel} from "./BattleTurnRecordPanel";
import {cloneBattleViewSnapshot, dedupeBattleViewPartySnapshot} from "./battlePartySnapshot";
import {buildBattleDisplaySteps, eventCanMutateDisplayedActive} from "./timelineFlow";
import battleBackgroundCsv from "../../../../../assets/battle-backgrounds/backgrounds.csv?raw";

const BATTLE_BACKGROUNDS = parseBattleBackgroundCsv(battleBackgroundCsv);
const FALLBACK_BATTLE_BACKGROUND = BATTLE_BACKGROUNDS.find(background => background.id === "mountain-route") || BATTLE_BACKGROUNDS[0];
const BATTLE_PANEL_MODES = new Set<AppStatus>(["battleMain", "moveMenu", "teamMenu", "statusMenu"]);
const IMPLEMENTED_BATTLE_SYSTEMS = new Set(["mega", "zmove", "dynamax", "terastal"]);
const BATTLE_ANIMATION_SPEEDUP_MS = 500;
const DEFAULT_BATTLE_ANIMATION_SPEED = 1;
type BattleAnimationSpeed = 1 | 2;
const FORCED_CONTINUATION_MOVE_IDS = new Set([
  "fly", "dive", "dig", "bounce", "phantomforce", "shadowforce", "skydrop",
  "solarbeam", "solarblade", "meteorbeam", "skullbash", "razorwind", "skyattack",
  "iceburn", "freezeshock", "geomancy",
  "outrage", "thrash", "petaldance", "rollout", "iceball", "uproar", "bravebird",
]);

function battleDebugLog(message: string, data?: unknown): void {
  if (data === undefined) console.info(`[changebattle:battle] ${message}`);
  else console.info(`[changebattle:battle] ${message}`, data);
}

type ActiveDisplaySnapshot = BattleState["tracker"]["active"]["p1"];
type BattleViewSide = NonNullable<BattleState["battle_view"]>["player"];
type BattleViewSlot = BattleViewSide["slots"][number];
type BattleViewModel = NonNullable<BattleState["battle_view"]>;
type BattleMoveChoiceMode = "zmove" | "mega" | "max" | "terastallize";
type BattleMoveClickDebugContext = {
  choice: string;
  index: number;
  mode?: BattleMoveChoiceMode;
  moveName: string;
  moveId?: string;
  moveRequest: Pick<BattleMoveRequest, "id" | "move" | "pp" | "maxpp" | "disabled" | "target">;
  active?: {name?: string; species?: string; showdownId?: string; condition?: string};
  target?: {name?: string; species?: string; showdownId?: string; condition?: string};
  disabled: boolean;
  disabledReasons: {
    controls?: boolean;
    move?: boolean;
    zMove?: boolean;
    dynamaxMove?: boolean;
  };
};

type BattleViewProps = {
  battle: BattleState | null;
  battleBag: BagCategoryView | null;
  mode: AppStatus;
  setMode: (mode: AppStatus) => void;
  onChoice: (choice: string) => Promise<boolean> | boolean | void;
  onAutoAdvance?: () => Promise<boolean> | boolean | void;
  onBattleHint?: () => Promise<BattleAiHint>;
  choicePending?: boolean;
  pendingTransition: DesktopGameState | null;
  onBattleAnimationDone: (state: DesktopGameState) => void;
  battleAnimationSpeed?: BattleAnimationSpeed;
  onBattleAnimationSpeedChange?: (speed: BattleAnimationSpeed) => void;
};

function genderMark(gender: string | undefined): string {
  if (/^m$/i.test(String(gender || ""))) return "♂";
  if (/^f$/i.test(String(gender || ""))) return "♀";
  return "";
}

function parseBattleBackgroundCsv(csv: string): BattleBackgroundView[] {
  return csv.trim().split(/\r?\n/).slice(1).map(line => {
    const [id = "", name = "", src = ""] = line.split(",");
    return {id: id.trim(), name: name.trim(), src: src.trim()};
  }).filter(entry => entry.id && entry.src);
}

function battleBackgroundFor(battle: BattleState | null): BattleBackgroundView | null {
  return battle?.battle_background || FALLBACK_BATTLE_BACKGROUND || null;
}

function isForcedContinuationRequest(request: BattleState["request"]): boolean {
  if (!request || request.wait || request.teamPreview || request.forceSwitch) return false;
  const moves = request.active?.[0]?.moves || [];
  if (moves.length !== 1) return false;
  const move = moves[0];
  const moveId = toId(move.id || move.move);
  return Boolean(moveId && moveId !== "struggle" && FORCED_CONTINUATION_MOVE_IDS.has(moveId) && move.pp === undefined && move.maxpp === undefined && !move.disabled);
}

function isForceSwitchRequest(request: BattleState["request"]): boolean {
  return Boolean(request?.forceSwitch?.some(Boolean));
}

function normalizedShowdownId(value: string | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function runtimeMatchesSlot(runtime: RuntimePokemon | undefined, slot: BattleViewSlot | undefined): boolean {
  if (!runtime || !slot) return false;
  const runtimeId = normalizedShowdownId(runtime.pokeball);
  if (runtimeId && runtimeId === normalizedShowdownId(slot.showdown_id || slot.runtime?.pokeball || slot.display?.showdown_id)) return true;
  const runtimeIdent = toId(runtime.ident || runtime.details);
  const slotIdent = toId(slot.runtime?.ident || slot.runtime?.details || slot.display?.species || slot.display?.name);
  return Boolean(runtimeIdent && slotIdent && runtimeIdent === slotIdent);
}

function battleRequestIndexForSlot(battle: BattleState, slot: BattleViewSlot | undefined): number | null {
  if (!slot) return null;
  const requestPokemon = battle.request?.side?.pokemon || [];
  const byId = normalizedShowdownId(slot.showdown_id || slot.runtime?.pokeball || slot.display?.showdown_id);
  if (byId) {
    const index = requestPokemon.findIndex(runtime => normalizedShowdownId(runtime.pokeball) === byId);
    if (index >= 0) return index;
  }
  const runtimeIndex = requestPokemon.findIndex(runtime => runtimeMatchesSlot(runtime, slot));
  if (runtimeIndex >= 0) return runtimeIndex;
  return slot.slot ? slot.slot - 1 : null;
}

function switchChoiceIndexForSlot(battle: BattleState, slot: BattleViewSlot | undefined): number | null {
  const requestIndex = battleRequestIndexForSlot(battle, slot);
  return requestIndex === null ? null : requestIndex + 1;
}

function aiAutoplayRequestKey(battle: BattleState | null): string {
  if (!battle?.request || battle.request.wait || battle.request.teamPreview || battle.ended) return "";
  const activeMoves = (battle.request.active?.[0]?.moves || [])
    .map((move, index) => `${index + 1}:${move.id || move.move}:${move.pp ?? ""}:${move.disabled ? 1 : 0}`)
    .join(",");
  const sideState = (battle.request.side?.pokemon || [])
    .map(pokemon => `${pokemon.ident}:${pokemon.condition}:${pokemon.active ? 1 : 0}`)
    .join("|");
  const forceSwitch = battle.request.forceSwitch?.map(value => value ? 1 : 0).join(",") || "";
  return [battle.tracker.turn, forceSwitch, activeMoves, sideState].join("#");
}

function userFacingBattleError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error || "操作失败，请稍后再试。");
}

function visualCueForEvent(event: BattleTimelineEvent, battle: BattleState, displayedNames: {p1: string; p2: string}, displayedShowdownIds?: {p1: string; p2: string}, speed: BattleAnimationSpeed = DEFAULT_BATTLE_ANIMATION_SPEED): BattleVisualCue | null {
  if (event.type === "move") {
    const actingSide = event.side || "p1";
    const team = actingSide === (battle.player_side || "p1") ? battle.player_display : battle.enemy_display;
    const pokemon = findDisplayByShowdownId(team, event.source_showdown_id || displayedShowdownIds?.[actingSide]) || findDisplay(team, event.source_id || displayedNames[actingSide]);
    const summary = runtimeMoveSummary(moveSummaryByName(pokemon, event.move), pokemon, battle, actingSide);
    const moveId = summary?.id ? toId(summary.id) : toId(event.move);
    const entry = firstBattleEffectEntry(moveEffectKeys(moveId, typeId(summary?.type || summary?.type_zh), moveCategoryId(summary?.category, summary?.category_zh)));
    return scaleBattleVisualCue(cueFromEntry(entry, event, entry?.visual || "normal-hit", actingSide, moveCueTargetSide(entry, actingSide, event.targetSide)), speed);
  }
  if (event.type === "item" && (event.effect === "Z招式" || /Z 力量|Z-Power|Z-Move/i.test(event.text))) {
    const side = event.side || event.targetSide || "p1";
    return {visual: "z-aura", renderer: "css", side, targetSide: side, anchor: "target", durationMs: battleAnimationDuration(1500, speed)};
  }
  if ((event.type === "damage" || event.type === "heal") && !eventTargetsDisplayedActive(event, displayedNames, displayedShowdownIds)) return null;
  if (event.type === "damage") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:damage"), event, "impact"), speed);
  if (event.type === "heal") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:heal"), event, "heal"), speed);
  if (event.type === "faint") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:faint"), event, "faint"), speed);
  if (event.type === "miss") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:miss"), event, "miss"), speed);
  if (event.type === "crit") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:crit"), event, "crit"), speed);
  if (event.type === "effectiveness") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:effectiveness"), event, "effectiveness"), speed);
  if (event.type === "switch") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_in"), event, "switch-in", event.side || event.targetSide, event.targetSide || event.side), speed);
  if (event.type === "form" && /超级进化|进化石|Mega/i.test(event.text || event.effect || "")) {
    const side = event.side || event.targetSide || "p1";
    return {visual: "mega-evolve", renderer: "css", side, targetSide: side, anchor: "target", durationMs: battleAnimationDuration(1600, speed)};
  }
  if (event.type === "form" && event.effect === "Terastallize") {
    const side = event.side || event.targetSide || "p1";
    return {visual: "terastalize", renderer: "css", side, targetSide: side, anchor: "target", durationMs: battleAnimationDuration(1500, speed)};
  }
  if (event.type === "form" && /DynamaxEnd|极巨化结束|结束/.test(event.text || event.effect || "")) {
    const side = event.side || event.targetSide || "p1";
    return {visual: "dynamax-end", renderer: "css", side, targetSide: side, anchor: "target", durationMs: battleAnimationDuration(1500, speed)};
  }
  if (event.type === "form" && /超极巨|Gigantamax|Gmax/i.test(event.text || event.effect || "")) {
    const side = event.side || event.targetSide || "p1";
    return {visual: "gigantamax", renderer: "css", side, targetSide: side, anchor: "target", durationMs: battleAnimationDuration(1900, speed)};
  }
  if (event.type === "form" && /极巨化|Dynamax/i.test(event.text || event.effect || "")) {
    const side = event.side || event.targetSide || "p1";
    return {visual: "dynamax", renderer: "css", side, targetSide: side, anchor: "target", durationMs: battleAnimationDuration(1700, speed)};
  }
  if (event.type === "form") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:form"), event, "ability", event.side, event.targetSide || event.side), speed);
  if (event.type === "substitute") {
    const entry = firstBattleEffectEntry(statusEffectKeys("substitute", "volatile"));
    return scaleBattleVisualCue(cueFromEntry(entry, event, entry?.visual || "substitute", event.side, event.targetSide), speed);
  }
  if (event.type === "boost") {
    const entry = firstBattleEffectEntry(boostEffectKeys(event));
    return scaleBattleVisualCue(cueFromEntry(entry, event, entry?.visual || "boost"), speed);
  }
  if (event.type === "item") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:item"), event, "item"), speed);
  if (event.type === "ability") return scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:ability"), event, "ability"), speed);
  if (event.type === "status") {
    const entry = firstBattleEffectEntry(statusEffectKeys(event.effect));
    return scaleBattleVisualCue(cueFromEntry(entry, event, entry?.visual || "status"), speed);
  }
  if (event.type === "weather") {
    const entry = firstBattleEffectEntry(weatherEffectKeys(event));
    return scaleBattleVisualCue(cueFromEntry(entry, event, entry?.visual || "field"), speed);
  }
  if (event.type === "field") {
    const entry = firstBattleEffectEntry(fieldEffectKeys(event));
    return scaleBattleVisualCue(cueFromEntry(entry, event, entry?.visual || "field"), speed);
  }
  return null;
}

function zImpactCueForEvent(event: BattleTimelineEvent, sourceSide: "p1" | "p2", durationMs: number, speed: BattleAnimationSpeed): BattleVisualCue {
  return {
    visual: "z-impact",
    renderer: "css",
    side: sourceSide,
    targetSide: event.targetSide || (sourceSide === "p1" ? "p2" : "p1"),
    anchor: "target",
    durationMs: battleAnimationDuration(Math.max(1400, durationMs + 160), speed),
  };
}

function isZPowerEvent(event: BattleTimelineEvent): boolean {
  return event.type === "item" && (event.effect === "Z招式" || /Z 力量|Z-Power|Z-Move/i.test(event.text));
}

function zActorName(event: BattleTimelineEvent, displayedNames: {p1: string; p2: string}): string {
  const textName = event.text.match(/^(.+?)\s*(?:被|让|開始|开始)/)?.[1]?.trim();
  return textName || event.source || event.target || displayedNames[event.side || event.targetSide || "p1"] || "宝可梦";
}

function zMoveDisplayName(event: BattleTimelineEvent): string {
  const raw = event.move || event.text.match(/使用\s+(.+?)(?:。|！|!|$)/)?.[1] || event.text.match(/\bused\s+(.+?)(?:。|！|!|\.|$)/i)?.[1] || event.text;
  const label = zMoveDisplayLabel(raw);
  return label.endsWith("！") || label.endsWith("!") ? label : `${label}！`;
}

const Z_MOVE_SPRITE_FILES = new Map([
  ["究极无敌大冲撞", "究极无敌大冲撞 Sprite.webp"], ["Breakneck Blitz", "究极无敌大冲撞 Sprite.webp"],
  ["全力无双激烈拳", "全力无双激烈拳 Sprite.webp"], ["All-Out Pummeling", "全力无双激烈拳 Sprite.webp"],
  ["极速俯冲轰烈撞", "极速俯冲轰烈撞 Sprite.webp"], ["Supersonic Skystrike", "极速俯冲轰烈撞 Sprite.webp"],
  ["强酸剧毒灭绝雨", "强酸剧毒灭绝雨 Sprite.webp"], ["Acid Downpour", "强酸剧毒灭绝雨 Sprite.webp"],
  ["地隆啸天大终结", "地隆啸天大终结 Sprite.webp"], ["Tectonic Rage", "地隆啸天大终结 Sprite.webp"],
  ["毁天灭地巨岩坠", "毁天灭地巨岩坠 Sprite.webp"], ["Continental Crush", "毁天灭地巨岩坠 Sprite.webp"],
  ["绝对捕食回旋斩", "绝对捕食回旋斩 Sprite.webp"], ["Savage Spin-Out", "绝对捕食回旋斩 Sprite.webp"],
  ["无尽暗夜之诱惑", "无尽暗夜之诱惑 Sprite.webp"], ["Never-Ending Nightmare", "无尽暗夜之诱惑 Sprite.webp"],
  ["超绝螺旋连击", "超绝螺旋连击 Sprite.webp"], ["Corkscrew Crash", "超绝螺旋连击 Sprite.webp"],
  ["超强极限爆焰弹", "超强极限爆焰弹 Sprite.webp"], ["Inferno Overdrive", "超强极限爆焰弹 Sprite.webp"],
  ["超级水流大漩涡", "超级水流大漩涡 Sprite.webp"], ["Hydro Vortex", "超级水流大漩涡 Sprite.webp"],
  ["绚烂缤纷花怒放", "绚烂缤纷花怒放 Sprite.webp"], ["Bloom Doom", "绚烂缤纷花怒放 Sprite.webp"],
  ["终极伏特狂雷闪", "终极伏特狂雷闪 Sprite.webp"], ["Gigavolt Havoc", "终极伏特狂雷闪 Sprite.webp"],
  ["至高精神破坏波", "至高精神破坏波 Sprite.webp"], ["Shattered Psyche", "至高精神破坏波 Sprite.webp"],
  ["激狂大地万里冰", "激狂大地万里冰 Sprite.webp"], ["Subzero Slammer", "激狂大地万里冰 Sprite.webp"],
  ["究极巨龙震天地", "究极巨龙震天地 Sprite.webp"], ["Devastating Drake", "究极巨龙震天地 Sprite.webp"],
  ["黑洞吞噬万物灭", "黑洞吞噬万物灭 Sprite.webp"], ["Black Hole Eclipse", "黑洞吞噬万物灭 Sprite.webp"],
  ["可爱星星飞天撞", "可爱星星飞天撞 Sprite.webp"], ["Twinkle Tackle", "可爱星星飞天撞 Sprite.webp"],
  ["认真起来大爆击", "认真起来大爆击 Sprite.webp"], ["Pulverizing Pancake", "认真起来大爆击 Sprite.webp"],
  ["驾雷驭电戏冲浪", "驾雷驭电戏冲浪 Sprite.webp"], ["Stoked Sparksurfer", "驾雷驭电戏冲浪 Sprite.webp"],
  ["皮卡皮卡必杀击", "皮卡皮卡必杀击 Sprite.webp"], ["Catastropika", "皮卡皮卡必杀击 Sprite.webp"],
  ["千万伏特", "千万伏特 Sprite.webp"], ["10,000,000 Volt Thunderbolt", "千万伏特 Sprite.webp"],
  ["九彩升华齐聚顶", "九彩升华齐聚顶 Sprite.webp"], ["Extreme Evoboost", "九彩升华齐聚顶 Sprite.webp"],
  ["巨人卫士・阿罗拉", "巨人卫士・阿罗拉 Sprite.webp"], ["Guardian of Alola", "巨人卫士・阿罗拉 Sprite.webp"],
  ["起源超新星大爆炸", "起源超新星大爆炸S Sprite.webp"], ["Genesis Supernova", "起源超新星大爆炸S Sprite.webp"],
  ["遮天蔽日暗影箭", "遮天蔽日暗影箭S Sprite.webp"], ["Sinister Arrow Raid", "遮天蔽日暗影箭S Sprite.webp"],
  ["极恶飞跃粉碎击", "极恶飞跃粉碎击 Sprite.webp"], ["Malicious Moonsault", "极恶飞跃粉碎击 Sprite.webp"],
  ["海神庄严交响乐", "海神庄严交响乐 Sprite.webp"], ["Oceanic Operetta", "海神庄严交响乐 Sprite.webp"],
  ["七星夺魂腿", "七星夺魂腿 Sprite.webp"], ["Soul-Stealing 7-Star Strike", "七星夺魂腿 Sprite.webp"],
  ["炽魂热舞烈音爆", "炽魂热舞烈音爆 Sprite.webp"], ["Clangorous Soulblaze", "炽魂热舞烈音爆 Sprite.webp"],
  ["亲密无间大乱揍", "亲密无间大乱揍 Sprite.webp"], ["Let's Snuggle Forever", "亲密无间大乱揍 Sprite.webp"],
  ["狼啸石牙飓风暴", "狼啸石牙飓风暴 Sprite.webp"], ["Splintered Stormshards", "狼啸石牙飓风暴 Sprite.webp"],
  ["日光回旋下苍穹", "日光回旋下苍穹 Sprite.webp"], ["Searing Sunraze Smash", "日光回旋下苍穹 Sprite.webp"],
  ["月华飞溅落灵霄", "月华飞溅落灵霄 Sprite.webp"], ["Menacing Moonraze Maelstrom", "月华飞溅落灵霄 Sprite.webp"],
  ["焚天灭世炽光爆", "焚天灭世炽光爆 Sprite.webp"], ["Light That Burns the Sky", "焚天灭世炽光爆 Sprite.webp"],
]);

const Z_MOVE_NAME_ZH = new Map([
  ["Breakneck Blitz", "究极无敌大冲撞"],
  ["All-Out Pummeling", "全力无双激烈拳"],
  ["Supersonic Skystrike", "极速俯冲轰烈撞"],
  ["Acid Downpour", "强酸剧毒灭绝雨"],
  ["Tectonic Rage", "地隆啸天大终结"],
  ["Continental Crush", "毁天灭地巨岩坠"],
  ["Savage Spin-Out", "绝对捕食回旋斩"],
  ["Never-Ending Nightmare", "无尽暗夜之诱惑"],
  ["Corkscrew Crash", "超绝螺旋连击"],
  ["Inferno Overdrive", "超强极限爆焰弹"],
  ["Hydro Vortex", "超级水流大漩涡"],
  ["Bloom Doom", "绚烂缤纷花怒放"],
  ["Gigavolt Havoc", "终极伏特狂雷闪"],
  ["Shattered Psyche", "至高精神破坏波"],
  ["Subzero Slammer", "激狂大地万里冰"],
  ["Devastating Drake", "究极巨龙震天地"],
  ["Black Hole Eclipse", "黑洞吞噬万物灭"],
  ["Twinkle Tackle", "可爱星星飞天撞"],
  ["Pulverizing Pancake", "认真起来大爆击"],
  ["Stoked Sparksurfer", "驾雷驭电戏冲浪"],
  ["Catastropika", "皮卡皮卡必杀击"],
  ["10,000,000 Volt Thunderbolt", "千万伏特"],
  ["Extreme Evoboost", "九彩升华齐聚顶"],
  ["Guardian of Alola", "巨人卫士・阿罗拉"],
  ["Genesis Supernova", "起源超新星大爆炸"],
  ["Sinister Arrow Raid", "遮天蔽日暗影箭"],
  ["Malicious Moonsault", "极恶飞跃粉碎击"],
  ["Oceanic Operetta", "海神庄严交响乐"],
  ["Soul-Stealing 7-Star Strike", "七星夺魂腿"],
  ["Clangorous Soulblaze", "炽魂热舞烈音爆"],
  ["Let's Snuggle Forever", "亲密无间大乱揍"],
  ["Splintered Stormshards", "狼啸石牙飓风暴"],
  ["Searing Sunraze Smash", "日光回旋下苍穹"],
  ["Menacing Moonraze Maelstrom", "月华飞溅落灵霄"],
  ["Light That Burns the Sky", "焚天灭世炽光爆"],
]);

function cleanZMoveName(text: string): string {
  return text.replace(/[!！。.]/g, "").trim();
}

function zMoveSpriteFile(text: string): string | undefined {
  const cleaned = cleanZMoveName(text);
  const exact = Z_MOVE_SPRITE_FILES.get(cleaned);
  if (exact) return exact;
  const normalized = toId(cleaned);
  return [...Z_MOVE_SPRITE_FILES.entries()].find(([name]) => toId(name) === normalized)?.[1];
}

function zMoveDisplayLabel(text: string, pokemon?: RentalPokemon): string {
  const cleaned = cleanZMoveName(text);
  const fileName = zMoveSpriteFile(text);
  if (fileName) return fileName.replace(/(?:[ST])? Sprite\.(?:png|webp)$/, "");
  const mapped = Z_MOVE_NAME_ZH.get(cleaned) || [...Z_MOVE_NAME_ZH.entries()].find(([name]) => toId(name) === toId(cleaned))?.[1];
  if (mapped) return mapped;
  const statusZMove = cleaned.match(/^Z[-\s](.+)$/i);
  if (statusZMove) {
    const summary = moveSummaryByName(pokemon, statusZMove[1]);
    return `Z-${summary?.name_zh || statusZMove[1]}`;
  }
  return moveSummaryByName(pokemon, cleaned)?.name_zh || text;
}

function zMoveSpritePath(text: string): string | null {
  const fileName = zMoveSpriteFile(text);
  return fileName ? `assets/z-moves/${fileName}` : null;
}

const DYNAMAX_MOVE_ZH = new Map([
  ["maxstrike", "极巨攻击"], ["Max Strike", "极巨攻击"],
  ["maxknuckle", "极巨拳斗"], ["Max Knuckle", "极巨拳斗"],
  ["maxairstream", "极巨飞冲"], ["Max Airstream", "极巨飞冲"],
  ["maxooze", "极巨酸毒"], ["Max Ooze", "极巨酸毒"],
  ["maxquake", "极巨大地"], ["Max Quake", "极巨大地"],
  ["maxrockfall", "极巨岩石"], ["Max Rockfall", "极巨岩石"],
  ["maxflutterby", "极巨虫蛊"], ["Max Flutterby", "极巨虫蛊"],
  ["maxphantasm", "极巨幽魂"], ["Max Phantasm", "极巨幽魂"],
  ["maxsteelspike", "极巨钢铁"], ["Max Steelspike", "极巨钢铁"],
  ["maxflare", "极巨火爆"], ["Max Flare", "极巨火爆"],
  ["maxgeyser", "极巨水流"], ["Max Geyser", "极巨水流"],
  ["maxovergrowth", "极巨草原"], ["Max Overgrowth", "极巨草原"],
  ["maxlightning", "极巨闪电"], ["Max Lightning", "极巨闪电"],
  ["maxmindstorm", "极巨超能"], ["Max Mindstorm", "极巨超能"],
  ["maxhailstorm", "极巨寒冰"], ["Max Hailstorm", "极巨寒冰"],
  ["maxwyrmwind", "极巨龙骑"], ["Max Wyrmwind", "极巨龙骑"],
  ["maxdarkness", "极巨恶霸"], ["Max Darkness", "极巨恶霸"],
  ["maxstarfall", "极巨妖精"], ["Max Starfall", "极巨妖精"],
  ["maxguard", "极巨防壁"], ["Max Guard", "极巨防壁"],
  ["gmaxwildfire", "超极巨地狱灭焰"], ["G-Max Wildfire", "超极巨地狱灭焰"],
  ["gmaxbefuddle", "超极巨蝶影蛊惑"], ["G-Max Befuddle", "超极巨蝶影蛊惑"],
  ["gmaxvoltcrash", "超极巨万雷轰顶"], ["G-Max Volt Crash", "超极巨万雷轰顶"],
  ["gmaxgoldrush", "超极巨特大金币"], ["G-Max Gold Rush", "超极巨特大金币"],
  ["gmaxchistrike", "超极巨会心一击"], ["G-Max Chi Strike", "超极巨会心一击"],
  ["gmaxterror", "超极巨幻影幽魂"], ["G-Max Terror", "超极巨幻影幽魂"],
  ["gmaxfoamburst", "超极巨激漩泡涡"], ["G-Max Foam Burst", "超极巨激漩泡涡"],
  ["gmaxresonance", "超极巨极光旋律"], ["G-Max Resonance", "超极巨极光旋律"],
  ["gmaxcuddle", "超极巨热情拥抱"], ["G-Max Cuddle", "超极巨热情拥抱"],
  ["gmaxreplenish", "超极巨资源再生"], ["G-Max Replenish", "超极巨资源再生"],
  ["gmaxmalodor", "超极巨臭气冲天"], ["G-Max Malodor", "超极巨臭气冲天"],
  ["gmaxmeltdown", "超极巨液金熔击"], ["G-Max Meltdown", "超极巨液金熔击"],
  ["gmaxdrumsolo", "超极巨狂擂乱打"], ["G-Max Drum Solo", "超极巨狂擂乱打"],
  ["gmaxfireball", "超极巨破阵火球"], ["G-Max Fireball", "超极巨破阵火球"],
  ["gmaxhydrosnipe", "超极巨狙击神射"], ["G-Max Hydrosnipe", "超极巨狙击神射"],
  ["gmaxwindrage", "超极巨旋风袭卷"], ["G-Max Wind Rage", "超极巨旋风袭卷"],
  ["gmaxgravitas", "超极巨天道七星"], ["G-Max Gravitas", "超极巨天道七星"],
  ["gmaxstonesurge", "超极巨岩阵以待"], ["G-Max Stonesurge", "超极巨岩阵以待"],
  ["gmaxvolcalith", "超极巨炎石喷发"], ["G-Max Volcalith", "超极巨炎石喷发"],
  ["gmaxtartness", "超极巨酸不溜丢"], ["G-Max Tartness", "超极巨酸不溜丢"],
  ["gmaxsweetness", "超极巨琼浆玉液"], ["G-Max Sweetness", "超极巨琼浆玉液"],
  ["gmaxsandblast", "超极巨沙尘漫天"], ["G-Max Sandblast", "超极巨沙尘漫天"],
  ["gmaxstunshock", "超极巨异毒电场"], ["G-Max Stun Shock", "超极巨异毒电场"],
  ["gmaxcentiferno", "超极巨百火焚野"], ["G-Max Centiferno", "超极巨百火焚野"],
  ["gmaxsmite", "超极巨天谴雷诛"], ["G-Max Smite", "超极巨天谴雷诛"],
  ["gmaxsnooze", "超极巨睡魔降临"], ["G-Max Snooze", "超极巨睡魔降临"],
  ["gmaxfinale", "超极巨幸福圆满"], ["G-Max Finale", "超极巨幸福圆满"],
  ["gmaxdepletion", "超极巨劣化衰变"], ["G-Max Depletion", "超极巨劣化衰变"],
  ["gmaxoneblow", "超极巨夺命一击"], ["G-Max One Blow", "超极巨夺命一击"],
  ["gmaxrapidflow", "超极巨流水连击"], ["G-Max Rapid Flow", "超极巨流水连击"],
  ["gmaxvinelash", "超极巨灰飞鞭灭"], ["G-Max Vine Lash", "超极巨灰飞鞭灭"],
  ["gmaxcannonade", "超极巨水炮轰灭"], ["G-Max Cannonade", "超极巨水炮轰灭"],
]);

function dynamaxMoveDisplayLabel(text: string, pokemon?: RentalPokemon): string {
  const raw = String(text || "").trim();
  if (!raw) return "";
  return DYNAMAX_MOVE_ZH.get(raw) || DYNAMAX_MOVE_ZH.get(toId(raw)) || moveSummaryByName(pokemon, raw)?.name_zh || raw;
}

function displayedActiveDisplay(battle: BattleState, side: "p1" | "p2", displayedName: string, displayedShowdownId: string, fallback?: RentalPokemon, activeOverride?: ActiveDisplaySnapshot): RentalPokemon | undefined {
  const team = side === (battle.player_side || "p1") ? battle.player_display : battle.enemy_display;
  const base = findDisplayByShowdownId(team, displayedShowdownId) || findDisplay(team, displayedName) || fallback;
  const active = activeOverride || battle.tracker.active[side];
  const displayedRawKeys = [displayedName].filter(Boolean).map(value => String(value).trim().toLowerCase());
  const displayedIdKeys = displayedRawKeys.map(toId).filter(Boolean);
  const activeRawKeys = [active?.name, active?.display_name, active?.species_id].filter(Boolean).map(value => String(value).trim().toLowerCase());
  const activeIdKeys = activeRawKeys.map(toId).filter(Boolean);
  const trackerIsDisplayed = activeRawKeys.some(key => displayedRawKeys.includes(key)) || activeIdKeys.some(key => displayedIdKeys.includes(key));
  return trackerIsDisplayed ? displayFromActive(active, base) || base : base;
}

function battleViewFor(battle: BattleState | null): BattleState["battle_view"] | undefined {
  if (!battle) return undefined;
  if (battle.battle_view) return battle.battle_view;
  const player = activePokemon(battle, "p1");
  const enemy = activePokemon(battle, "p2");
  const playerRows = battle.request?.side?.pokemon || [];
  const playerSlots = Array.from({length: Math.max(3, battle.player_display.length || playerRows.length)}, (_value, index): BattleViewSlot => {
    const runtime = playerRows[index];
    const display = displayForRuntime(battle.player_display, runtime, index) || battle.player_display[index];
    const active = Boolean(runtime?.active || index === playerRows.findIndex(row => row.active));
    const condition = runtime?.condition || (active ? battle.tracker.active.p1.condition : "") || "100/100";
    const hp = parseHp(condition);
    const status = statusCode(condition);
    return {
      key: display?.run_member_id || runtime?.pokeball || runtime?.ident || `player-${index + 1}`,
      slot: index + 1,
      showdown_id: runtime?.pokeball || display?.showdown_id,
      run_member_id: display?.run_member_id,
      revealed: true,
      active,
      fainted: status === "fnt",
      condition,
      hp: hp?.current ?? (status === "fnt" ? 0 : 100),
      max_hp: hp?.max ?? 100,
      status,
      moves: [],
      display: active ? player.display || display : display,
      runtime,
    };
  });
  const enemyCondition = battle.tracker.active.p2.condition || "100/100";
  const enemyHp = parseHp(enemyCondition);
  const enemySlots = battle.enemy_display.map((display, index): BattleViewSlot => {
    const active = index === 0 || String(display.showdown_id || "").toLowerCase() === String(battle.tracker.active.p2.showdown_id || "").toLowerCase();
    const condition = active ? enemyCondition : "";
    const status = statusCode(condition);
    return {
      key: display.run_member_id || display.showdown_id || `enemy-${index + 1}`,
      slot: index + 1,
      showdown_id: display.showdown_id,
      run_member_id: display.run_member_id,
      revealed: active,
      active,
      fainted: status === "fnt",
      condition,
      hp: active ? enemyHp?.current ?? (status === "fnt" ? 0 : 100) : 0,
      max_hp: active ? enemyHp?.max ?? 100 : 100,
      status,
      moves: [],
      display: active ? enemy.display || display : undefined,
    };
  });
  return {
    player: {side: battle.player_side || "p1", active_index: Math.max(0, playerSlots.findIndex(slot => slot.active)), slots: playerSlots},
    enemy: {side: battle.enemy_side || "p2", active_index: Math.max(0, enemySlots.findIndex(slot => slot.active)), slots: enemySlots},
  };
}

function activeBattleViewSlot(side: BattleViewSide | undefined): BattleViewSlot | undefined {
  if (!side?.slots.length) return undefined;
  return side.slots[side.active_index] || side.slots.find(slot => slot.active) || side.slots[0];
}

function battleViewSlotShowdownId(slot: BattleViewSlot | undefined): string | undefined {
  return slot?.showdown_id || slot?.runtime?.pokeball || slot?.display?.showdown_id;
}

function battleViewPartySlots(side: BattleViewSide | undefined, onSelect?: (index: number) => void): PartyStatusSlot[] {
  return (side?.slots || []).map((slot, index) => ({
    key: slot.key || `${side?.side || "side"}-${slot.slot || index + 1}`,
    label: String(slot.slot || index + 1),
    showdown_id: battleViewSlotShowdownId(slot),
    display: slot.revealed ? slot.display : undefined,
    condition: slot.revealed ? slot.condition : undefined,
    status: slot.status,
    active: slot.active,
    revealed: slot.revealed,
    onClick: onSelect && slot.revealed ? () => onSelect(index) : undefined,
  }));
}

function activeSnapshotsForBattle(battle: BattleState | null): Record<"p1" | "p2", ActiveDisplaySnapshot> {
  return {
    p1: {...(battle?.tracker.active.p1 || {})},
    p2: {...(battle?.tracker.active.p2 || {})},
  };
}

function snapshotFromTimelineEvent(current: ActiveDisplaySnapshot, event: BattleTimelineEvent): ActiveDisplaySnapshot {
  const effect = String(event.effect || "");
  const dynamaxEnd = effect === "DynamaxEnd" || event.text.includes("极巨化结束");
  const terastal = effect === "Terastallize";
  const gigantamax = effect === "Gigantamax" || /超极巨|Gigantamax|Gmax/i.test(event.text);
  const dynamax = !dynamaxEnd && (gigantamax || effect === "Dynamax" || /极巨化|Dynamax/i.test(event.text));
  const original = dynamax && !current.original_species_id
    ? {
      original_species_id: current.species_id,
      original_name: current.name,
      original_display_name: current.display_name,
      original_sprite: current.sprite,
    }
    : {};
  return {
    ...current,
    ...original,
    name: event.target_id || (dynamaxEnd ? current.original_name : current.name),
    display_name: event.target || (dynamaxEnd ? current.original_display_name : current.display_name),
    species_id: event.target_species_id || (dynamaxEnd ? current.original_species_id : current.species_id),
    sprite: event.sprite || (dynamaxEnd ? current.original_sprite : current.sprite),
    showdown_id: event.target_showdown_id || current.showdown_id,
    condition: event.condition || current.condition,
    ...(terastal ? {
      terastallized: true,
      tera_type: event.tera_type,
      tera_type_zh: event.tera_type_zh,
      types: event.tera_type ? [event.tera_type] : current.types,
      types_zh: event.tera_type_zh ? [event.tera_type_zh] : current.types_zh,
    } : {}),
    ...(dynamax ? {dynamaxed: true, gigantamaxed: gigantamax} : {}),
    ...(dynamaxEnd ? {
      dynamaxed: false,
      gigantamaxed: false,
      original_species_id: undefined,
      original_name: undefined,
      original_display_name: undefined,
      original_sprite: undefined,
    } : {}),
  };
}

function ZMoveNameCutIn({event}: {event: BattleTimelineEvent}) {
  const moveName = zMoveDisplayName(event);
  const spritePath = zMoveSpritePath(moveName);
  const [spriteState, setSpriteState] = useState<"loading" | "ready" | "failed">("loading");
  const spriteUrl = spritePath ? assetUrl(spritePath) : undefined;
  return (
    <span className={`z-move-name-content ${spriteState === "ready" ? "has-art" : ""}`}>
      {spriteUrl && spriteState !== "failed" ? <img className="z-move-name-art" src={spriteUrl} alt={moveName} onLoad={() => setSpriteState("ready")} onError={() => setSpriteState("failed")} /> : null}
      <span className="z-move-name-text">{moveName}</span>
    </span>
  );
}

function DynamaxMoveNameCutIn({event}: {event: BattleTimelineEvent}) {
  const moveName = dynamaxMoveDisplayLabel(event.move || event.text);
  return <span className="dynamax-move-name-text">{moveName.endsWith("！") || moveName.endsWith("!") ? moveName : `${moveName}！`}</span>;
}

function BattleEffectLayer({cue}: {cue: BattleVisualCue | null}) {
  if (!cue) return null;
  const sheetFrameWidth = cue.frame_width || 192;
  const sheetFrameHeight = cue.frame_height || 192;
  const sheetFrames = Math.max(1, cue.frames || 1);
  const style = {
    "--cue-duration": `${cue.durationMs}ms`,
    "--effect-image": cue.asset ? `url("${assetUrl(cue.asset)}")` : undefined,
    "--sheet-frame-width": `${sheetFrameWidth}px`,
    "--sheet-frame-height": `${sheetFrameHeight}px`,
    "--sheet-shift": `${Math.max(0, sheetFrames - 1) * sheetFrameWidth}px`,
    "--sheet-steps": Math.max(1, sheetFrames - 1),
    "--sheet-scale": cue.scale || 1,
  } as CSSProperties;
  const content = cue.renderer === "image" && cue.asset
    ? <div className={`battle-effect battle-image-effect effect-${cue.visual}`}><span /></div>
    : cue.renderer === "spritesheet" && cue.asset
      ? <div className={`battle-effect battle-spritesheet-effect effect-${cue.visual}`}><span /></div>
      : <div className={`battle-effect effect-${cue.visual}`}><i /><i /><i /><i /><i /><i /></div>;
  return <div className={`battle-effect-layer anchor-${cue.anchor} side-${cue.side || "none"} target-${cue.targetSide || "none"}`} style={style}>{content}</div>;
}

export function BattleView({battle, battleBag, mode, onChoice, onAutoAdvance, onBattleHint, choicePending, pendingTransition, onBattleAnimationDone, battleAnimationSpeed = DEFAULT_BATTLE_ANIMATION_SPEED, onBattleAnimationSpeedChange}: BattleViewProps) {
  const battleView = battleViewFor(battle);
  const playerActiveSlot = activeBattleViewSlot(battleView?.player);
  const enemyActiveSlot = activeBattleViewSlot(battleView?.enemy);
  const legacyPlayer = activePokemon(battle, "p1");
  const legacyEnemy = activePokemon(battle, "p2");
  const player = {runtime: playerActiveSlot?.runtime || legacyPlayer.runtime, display: playerActiveSlot?.display || legacyPlayer.display, active: battle?.tracker.active.p1};
  const enemy = {runtime: enemyActiveSlot?.runtime || legacyEnemy.runtime, display: enemyActiveSlot?.display || legacyEnemy.display, active: battle?.tracker.active.p2};
  const finalActiveNames = {
    p1: playerActiveSlot?.display?.species || playerActiveSlot?.display?.name || battle?.tracker.active.p1.name || runtimeName(player.runtime) || "",
    p2: enemyActiveSlot?.display?.species || enemyActiveSlot?.display?.name || battle?.tracker.active.p2.name || "",
  };
  const finalConditions = {
    p1: playerActiveSlot?.condition || player.runtime?.condition || battle?.tracker.active.p1.condition || "",
    p2: enemyActiveSlot?.condition || battle?.tracker.active.p2.condition || "",
  };
  const finalActiveShowdownIds = {
    p1: battleViewSlotShowdownId(playerActiveSlot) || player.runtime?.pokeball || battle?.tracker.active.p1.showdown_id || "",
    p2: battleViewSlotShowdownId(enemyActiveSlot) || battle?.tracker.active.p2.showdown_id || "",
  };
  const finalSubstitutes = {
    p1: Boolean(battle?.tracker.active.p1.substitute),
    p2: Boolean(battle?.tracker.active.p2.substitute),
  };
  const finalFaintedSides = {
    p1: Boolean(playerActiveSlot?.fainted) || statusCode(finalConditions.p1) === "fnt",
    p2: Boolean(enemyActiveSlot?.fainted) || statusCode(finalConditions.p2) === "fnt",
  };
  const recentEvents = battle?.recent_events.filter(event => event && !event.startsWith("--- 第")) || [];
  const turnEvents = battle ? lastEvents(battle, 14) : [];
  const timelineEvents = battle?.timeline_events || [];
  const timelineKey = timelineEvents.map(event => `${event.id}:${event.text}`).join("\n");
  const recentKey = recentEvents.join("\n");
  const battleSpeed = battleAnimationSpeed === 2 ? 2 : 1;
  const battleSpeedRef = useRef<BattleAnimationSpeed>(battleSpeed);
  const [shownEvents, setShownEvents] = useState(turnEvents);
  const [currentTimelineEvent, setCurrentTimelineEvent] = useState<BattleTimelineEvent | null>(null);
  const [currentVisualCue, setCurrentVisualCue] = useState<BattleVisualCue | null>(null);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [displayConditions, setDisplayConditions] = useState(finalConditions);
  const [displayedActiveNames, setDisplayedActiveNames] = useState(finalActiveNames);
  const [displayedActiveShowdownIds, setDisplayedActiveShowdownIds] = useState(finalActiveShowdownIds);
  const [displayedActiveSnapshots, setDisplayedActiveSnapshots] = useState(() => activeSnapshotsForBattle(battle));
  const [displayedSubstitutes, setDisplayedSubstitutes] = useState(finalSubstitutes);
  const [partyBoardSettleLock, setPartyBoardSettleLock] = useState(false);
  const [partyBoardPlaybackSnapshot, setPartyBoardPlaybackSnapshot] = useState<BattleViewModel | undefined>(() => dedupeBattleViewPartySnapshot(cloneBattleViewSnapshot(battleView)));
  const [hpTransitionMs, setHpTransitionMs] = useState({p1: 1400, p2: 1400});
  const [faintedSides, setFaintedSides] = useState({p1: false, p2: false});
  const [entryRevealLocked, setEntryRevealLocked] = useState(() => Boolean(battle));
  const [introActive, setIntroActive] = useState(false);
  const [trainerIntroActive, setTrainerIntroActive] = useState(false);
  const [dialogue, setDialogue] = useState<TrainerDialogueState | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [detailSelectedIndex, setDetailSelectedIndex] = useState<number | null>(null);
  const [switchChoiceSubmitting, setSwitchChoiceSubmitting] = useState(false);
  const [switchChoiceRequestKey, setSwitchChoiceRequestKey] = useState("");
  const [itemTargetIndex, setItemTargetIndex] = useState(0);
  const [battleItemOpen, setBattleItemOpen] = useState(false);
  const [battleItemToast, setBattleItemToast] = useState<{id: number; message: string} | null>(null);
  const [eventInfoStatus, setEventInfoStatus] = useState<RestEventStatusView | null>(null);
  const [battleDexQuery, setBattleDexQuery] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<AppStatus>(BATTLE_PANEL_MODES.has(mode) ? mode : "battleMain");
  const [autoAdvancePending, setAutoAdvancePending] = useState(false);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [aiHint, setAiHint] = useState<BattleAiHint | null>(null);
  const [aiHintError, setAiHintError] = useState<string | null>(null);
  const [aiAutoplayEnabled, setAiAutoplayEnabled] = useState(false);
  const [aiAutoplayPending, setAiAutoplayPending] = useState(false);
  const [aiAutoplayToast, setAiAutoplayToast] = useState<{id: number; message: string} | null>(null);
  const previousTimelineKeys = useRef<string[]>([]);
  const previousRecentEvents = useRef<string[]>([]);
  const displayConditionsRef = useRef(displayConditions);
  const displayedActiveNamesRef = useRef(displayedActiveNames);
  const displayedActiveShowdownIdsRef = useRef(displayedActiveShowdownIds);
  const displayedActiveSnapshotsRef = useRef(displayedActiveSnapshots);
  const displayedSubstitutesRef = useRef(displayedSubstitutes);
  const lastSettledBattleViewRef = useRef<BattleViewModel | undefined>(dedupeBattleViewPartySnapshot(cloneBattleViewSnapshot(battleView)));
  const previousBattlePresent = useRef(false);
  const introDialoguePending = useRef(false);
  const forceSwitchPanelOpen = useRef(false);
  const bossDialogueSelection = useRef<{key: string; index: number} | null>(null);
  const pokemonIntroTimer = useRef<number | null>(null);
  const eventTimers = useRef<number[]>([]);
  const partyBoardSettleTimer = useRef<number | null>(null);
  const battleLogRef = useRef<HTMLDivElement | null>(null);
  const playbackRun = useRef(0);
  const finishRequested = useRef(false);
  const autoAdvanceInFlight = useRef(false);
  const lastAutoAdvanceKey = useRef("");
  const aiAutoplayInFlight = useRef(false);
  const lastAiAutoplayKey = useRef("");
  const lastCryKeys = useRef({p1: "", p2: ""});
  const lastCryScopeKey = useRef("");
  const hasQueuedPlayback = Boolean(battle && (
    timelineEvents.some((event, index) => !previousTimelineKeys.current.includes(`${event.id}:${event.text}`))
    || addedRecentEventTexts(previousRecentEvents.current, recentEvents).length > 0
  ));
  const requestWaiting = Boolean(battle?.request?.wait) || isForcedContinuationRequest(battle?.request || null);
  const forceSwitch = isForceSwitchRequest(battle?.request || null);
  const battleRequestKey = aiAutoplayRequestKey(battle);
  const aiAutoplayKey = aiAutoplayRequestKey(battle);
  const baseBattleActionBlocked = Boolean(choicePending)
    || autoAdvancePending
    || requestWaiting
    || playbackActive
    || hasQueuedPlayback
    || introActive
    || trainerIntroActive
    || Boolean(dialogue);
  const battleActionBlocked = baseBattleActionBlocked || aiAutoplayPending;
  const controlsDisabled = battleActionBlocked || aiAutoplayEnabled;
  const aiHintDisabled = !onBattleHint
    || battleActionBlocked
    || aiAutoplayEnabled
    || Boolean(battle?.ended)
    || Boolean(battle?.request?.teamPreview);
  const aiAutoplayActionBlocked = !onBattleHint
    || baseBattleActionBlocked
    || Boolean(battle?.ended)
    || Boolean(battle?.request?.teamPreview)
    || !aiAutoplayKey;
  const aiAutoplayToggleDisabled = !onBattleHint || Boolean(battle?.ended);

  function selectPanelMode(nextMode: AppStatus) {
    const normalizedMode = BATTLE_PANEL_MODES.has(nextMode) ? nextMode : "battleMain";
    if (normalizedMode === "teamMenu") setDetailSelectedIndex(currentActivePlayerIndex());
    setPanelMode(normalizedMode);
  }

  async function handleMoveChoice(index: number, mode?: BattleMoveChoiceMode, context?: BattleMoveClickDebugContext): Promise<boolean | void> {
    const choice = `move ${index}${mode ? ` ${mode}` : ""}`;
    const startedAt = performance.now();
    battleDebugLog(`提交技能指令：${context?.moveName || choice}`, {
      choice,
      move: context,
      turn: battle?.tracker.turn,
      requestKey: battleRequestKey,
      panelMode,
      controlsDisabled,
      choicePending,
      requestWaiting,
      forceSwitch,
      playbackActive,
      hasQueuedPlayback,
      introActive,
      trainerIntroActive,
      dialogueActive: Boolean(dialogue),
    });
    try {
      const ok = await Promise.resolve(onChoice(choice));
      battleDebugLog(`技能指令返回：${context?.moveName || choice}`, {
        choice,
        ok,
        elapsedMs: Math.round(performance.now() - startedAt),
        nextPanelMode: panelMode,
      });
      return ok;
    } catch (error) {
      battleDebugLog(`技能指令异常：${context?.moveName || choice}`, {
        choice,
        error: userFacingBattleError(error),
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      throw error;
    }
  }

  function openPokemonDetail(index: number) {
    setDetailIndex(index);
    setDetailSelectedIndex(index);
    battleDebugLog("open detail", {index});
  }

  function closePokemonDetail() {
    setDetailIndex(null);
    setDetailSelectedIndex(null);
    setSwitchChoiceSubmitting(false);
    setSwitchChoiceRequestKey("");
  }

  async function handleDetailSwitch(slot: number): Promise<boolean | void> {
    if (switchChoiceSubmitting) return false;
    const view = battleViewFor(battle);
    const selectedSlot = view?.player.slots.find(entry => entry.slot === slot);
    battleDebugLog("submit switch", {
      slot,
      selectedIndex: detailSelectedIndex,
      name: selectedSlot?.display ? displayName(selectedSlot.display) : selectedSlot?.runtime ? runtimeName(selectedSlot.runtime) : selectedSlot?.key,
      active: selectedSlot?.active,
      condition: selectedSlot?.condition,
      requestKey: battleRequestKey,
      forceSwitch,
    });
    setSwitchChoiceSubmitting(true);
    setSwitchChoiceRequestKey(battleRequestKey);
    const ok = await Promise.resolve(onChoice(`switch ${slot}`));
    battleDebugLog("switch choice returned", {slot, ok});
    if (ok === false) {
      setSwitchChoiceSubmitting(false);
      setSwitchChoiceRequestKey("");
      return false;
    }
    return ok;
  }

  function currentActivePlayerIndex(): number {
    const view = battleViewFor(battle);
    const requestActiveIndex = battle?.request?.side?.pokemon?.findIndex(pokemon => pokemon.active) ?? -1;
    return Math.max(0, view?.player.active_index ?? requestActiveIndex);
  }

  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);

  useEffect(() => {
    if (!switchChoiceSubmitting || choicePending || battleRequestKey === switchChoiceRequestKey) return;
    battleDebugLog("clear submitting after request change", {battleRequestKey, switchChoiceRequestKey, forceSwitch});
    setSwitchChoiceSubmitting(false);
    setSwitchChoiceRequestKey("");
    if (forceSwitch) return;
    closePokemonDetail();
    if (panelMode === "teamMenu") selectPanelMode("battleMain");
  }, [switchChoiceSubmitting, switchChoiceRequestKey, choicePending, battleRequestKey, forceSwitch, panelMode]);

  async function triggerAutoAdvance(key: string) {
    if (!onAutoAdvance || autoAdvanceInFlight.current || lastAutoAdvanceKey.current === key) return;
    autoAdvanceInFlight.current = true;
    lastAutoAdvanceKey.current = key;
    setAutoAdvancePending(true);
    closePokemonDetail();
    setBattleItemOpen(false);
    selectPanelMode("battleMain");
    try {
      await onAutoAdvance();
    } finally {
      autoAdvanceInFlight.current = false;
      setAutoAdvancePending(false);
    }
  }

  async function handleAiHint() {
    if (!onBattleHint || aiHintLoading) return;
    setAiHintLoading(true);
    setAiHint(null);
    setAiHintError(null);
    try {
      setAiHint(await onBattleHint());
    } catch (error) {
      setAiHintError(userFacingBattleError(error));
    } finally {
      setAiHintLoading(false);
    }
  }

  async function executeAiHintChoice(choice: string) {
    const ok = await onChoice(choice);
    if (ok !== false) {
      setAiHint(null);
      setAiHintError(null);
    }
  }

  function toggleAiAutoplay() {
    const nextEnabled = !aiAutoplayEnabled;
    lastAiAutoplayKey.current = "";
    setAiAutoplayEnabled(nextEnabled);
    setAiHint(null);
    setAiHintError(null);
    closePokemonDetail();
    setBattleItemOpen(false);
    selectPanelMode("battleMain");
    setAiAutoplayToast({id: Date.now(), message: nextEnabled ? "AI代打已开启。" : "AI代打已关闭。"});
  }

  useEffect(() => {
    if (!aiAutoplayEnabled) {
      lastAiAutoplayKey.current = "";
      return;
    }
    if (!battle) {
      setAiAutoplayEnabled(false);
      return;
    }
    if (!aiAutoplayKey || aiAutoplayActionBlocked || aiHintLoading || aiHint || aiHintError || aiAutoplayInFlight.current) return;
    if (lastAiAutoplayKey.current === aiAutoplayKey) return;
    lastAiAutoplayKey.current = aiAutoplayKey;
    aiAutoplayInFlight.current = true;
    setAiAutoplayPending(true);
    closePokemonDetail();
    setBattleItemOpen(false);
    setAiHint(null);
    setAiHintError(null);
    selectPanelMode("battleMain");
    void (async () => {
      try {
        const hint = await onBattleHint!();
        const ok = await onChoice(hint.choice);
        if (ok === false) {
          setAiAutoplayEnabled(false);
          setAiAutoplayToast({id: Date.now(), message: "AI代打提交失败，已暂停。"});
        }
      } catch (error) {
        setAiAutoplayEnabled(false);
        setAiAutoplayToast({id: Date.now(), message: `AI代打已暂停：${userFacingBattleError(error)}`});
      } finally {
        aiAutoplayInFlight.current = false;
        setAiAutoplayPending(false);
      }
    })();
  }, [aiAutoplayEnabled, aiAutoplayKey, aiAutoplayActionBlocked, aiHintLoading, Boolean(aiHint), Boolean(aiHintError), onBattleHint, onChoice]);

  useEffect(() => {
    if (battle?.ended && aiAutoplayEnabled) {
      setAiAutoplayEnabled(false);
      lastAiAutoplayKey.current = "";
    }
  }, [battle?.ended, aiAutoplayEnabled]);

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
  useEffect(() => { displayedActiveShowdownIdsRef.current = displayedActiveShowdownIds; }, [displayedActiveShowdownIds]);
  useEffect(() => { displayedActiveSnapshotsRef.current = displayedActiveSnapshots; }, [displayedActiveSnapshots]);
  useEffect(() => { displayedSubstitutesRef.current = displayedSubstitutes; }, [displayedSubstitutes]);
  useEffect(() => {
    const log = battleLogRef.current;
    if (!log) return;
    const frame = window.requestAnimationFrame(() => {
      log.scrollTop = log.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [shownEvents.length, shownEvents[shownEvents.length - 1], currentTimelineEvent?.id]);
  useEffect(() => {
    const battlePresent = Boolean(battle);
    if (battlePresent && !previousBattlePresent.current) {
      window.getSelection()?.removeAllRanges();
      const dialogueBattle = battle;
      const enemy = dialogueBattle?.enemy_trainer;
      introDialoguePending.current = true;
      setEntryRevealLocked(true);
      setDialogue({
        kind: "intro",
        speaker: trainerDisplayName(enemy),
        title: trainerDialogueTitle(enemy),
        lines: trainerDialogueLines(enemy, "intro", selectedDialogueGroupIndex(dialogueBattle), bossDialogueVariant(dialogueBattle?.enemy_boss_record)),
        index: 0,
        trainer: enemy,
        playerTrainer: dialogueBattle?.player_trainer,
        bossRecord: dialogueBattle?.enemy_boss_record,
      });
      setTrainerIntroActive(true);
      setIntroActive(false);
      previousBattlePresent.current = true;
    }
    previousBattlePresent.current = battlePresent;
    if (!battlePresent) {
      introDialoguePending.current = false;
      bossDialogueSelection.current = null;
      setEntryRevealLocked(false);
      setIntroActive(false);
      setTrainerIntroActive(false);
      setDialogue(null);
      if (pokemonIntroTimer.current) {
        window.clearTimeout(pokemonIntroTimer.current);
        pokemonIntroTimer.current = null;
      }
    }
  }, [Boolean(battle)]);

  useEffect(() => {
    if (mode !== "battleMain" && BATTLE_PANEL_MODES.has(mode)) selectPanelMode(mode);
  }, [mode]);

  useEffect(() => {
    if (!battle?.request?.wait && !isForcedContinuationRequest(battle?.request || null)) lastAutoAdvanceKey.current = "";
  }, [Boolean(battle?.request?.wait), battle?.request?.active?.[0]?.moves?.length, battle?.tracker.turn]);

  useEffect(() => {
    const hasMoves = Boolean(battle?.request?.active?.[0]?.moves?.length);
    const forceSwitch = isForceSwitchRequest(battle?.request || null);
    if (forceSwitch) {
      if (aiAutoplayEnabled) return;
      if (playbackActive || hasQueuedPlayback || currentTimelineEvent) return;
      forceSwitchPanelOpen.current = true;
      selectPanelMode("teamMenu");
      setBattleItemOpen(false);
      return;
    }
    if (forceSwitchPanelOpen.current) {
      forceSwitchPanelOpen.current = false;
      if (panelMode === "teamMenu") selectPanelMode("battleMain");
    }
    if (panelMode === "moveMenu" && !hasMoves) selectPanelMode("battleMain");
  }, [battle?.request?.forceSwitch, battle?.request?.active?.[0]?.moves?.length, panelMode, playbackActive, hasQueuedPlayback, currentTimelineEvent?.id, aiAutoplayEnabled]);

  function playerWonBattle(activeBattle: BattleState): boolean {
    const winner = String(activeBattle.winner || "").toLowerCase();
    if (!winner || winner === "tie") return false;
    return !["enemy", "opponent", "对手"].includes(winner);
  }

  function beginBattleOutro(activeBattle: BattleState, transition: DesktopGameState | null) {
    if (!transition || finishRequested.current) return;
    finishRequested.current = true;
    const dialogueBattle = transition.battle || activeBattle;
    const enemy = dialogueBattle.enemy_trainer;
    const moment: TrainerDialogueMoment = playerWonBattle(activeBattle) ? "defeat" : "victory";
    closePokemonDetail();
    setBattleItemOpen(false);
    selectPanelMode("battleMain");
    setIntroActive(false);
    setTrainerIntroActive(true);
    setDialogue({
      kind: "outro",
      speaker: trainerDisplayName(enemy),
      title: trainerDialogueTitle(enemy),
      lines: trainerDialogueLines(enemy, moment, selectedDialogueGroupIndex(dialogueBattle), bossDialogueVariant(dialogueBattle.enemy_boss_record)),
      index: 0,
      trainer: enemy,
      playerTrainer: dialogueBattle.player_trainer,
      bossRecord: dialogueBattle.enemy_boss_record,
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
        setEntryRevealLocked(false);
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
      lastSettledBattleViewRef.current = undefined;
      setPartyBoardPlaybackSnapshot(undefined);
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setTrainerIntroActive(false);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayedActiveShowdownIds(finalActiveShowdownIds);
      setDisplayedActiveSnapshots(activeSnapshotsForBattle(null));
      setDisplayedSubstitutes(finalSubstitutes);
      setPartyBoardSettleLock(false);
      if (partyBoardSettleTimer.current) {
        window.clearTimeout(partyBoardSettleTimer.current);
        partyBoardSettleTimer.current = null;
      }
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
    const addedNeedsPartySettle = added.some(event => event.type === "faint" || event.type === "switch");

    if (!added.length) {
      const settledSnapshot = dedupeBattleViewPartySnapshot(cloneBattleViewSnapshot(battleViewFor(battle)));
      lastSettledBattleViewRef.current = settledSnapshot;
      setPartyBoardPlaybackSnapshot(undefined);
      setShownEvents(turnEvents);
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      const finalSnapshots = activeSnapshotsForBattle(battle);
      displayedActiveSnapshotsRef.current = finalSnapshots;
      setDisplayedActiveSnapshots(finalSnapshots);
      setDisplayedSubstitutes(finalSubstitutes);
      if (battle.ended && pendingTransition && !finishRequested.current) {
        beginBattleOutro(battle, pendingTransition);
      } else if ((battle.request?.wait || isForcedContinuationRequest(battle.request)) && !pendingTransition) {
        void triggerAutoAdvance(`idle:${timelineKey}:${recentKey}:${battle.tracker.turn}`);
      }
      return;
    }

    if (switchChoiceSubmitting) {
      battleDebugLog("close detail before playback", {timelineEvents: added.map(event => ({type: event.type, text: event.text, targetSide: event.targetSide, target: event.target}))});
      setSwitchChoiceSubmitting(false);
      setSwitchChoiceRequestKey("");
      closePokemonDetail();
      if (panelMode === "teamMenu") selectPanelMode("battleMain");
    }

    const activeBattle = battle;
    const playbackSnapshot = cloneBattleViewSnapshot(lastSettledBattleViewRef.current) || dedupeBattleViewPartySnapshot(cloneBattleViewSnapshot(battleViewFor(activeBattle)));
    setPartyBoardPlaybackSnapshot(playbackSnapshot);
    async function playQueue() {
      const currentSpeed = () => battleSpeedRef.current;
      const playbackStartedAt = performance.now();
      setPartyBoardPlaybackSnapshot(playbackSnapshot);
      setPlaybackActive(true);
      battleDebugLog("战斗动画流程开始", {
        runId,
        turn: activeBattle.tracker.turn,
        addedEvents: added.map(event => ({
          id: event.id,
          type: event.type,
          text: event.text,
          side: event.side,
          targetSide: event.targetSide,
          target: event.target,
          move: event.move,
        })),
        partySnapshot: {
          playerSlots: playbackSnapshot?.player.slots.length || 0,
          enemySlots: playbackSnapshot?.enemy.slots.length || 0,
        },
      });
      if (trainerIntroActive) {
        await wait(scaleBattleDuration(1750, currentSpeed()));
        if (playbackRun.current !== runId) return;
      }
      if (introActive) {
        await wait(scaleBattleDuration(920, currentSpeed()));
        if (playbackRun.current !== runId) return;
      }
      let pendingZMoveSide: "p1" | "p2" | null = null;
      let pendingZImpactSourceSide: "p1" | "p2" | null = null;
      const skipZVisualIds = new Set<string>();
      for (const step of buildBattleDisplaySteps(added)) {
        if (playbackRun.current !== runId) return;
        if (step.kind === "pause") {
          await wait(scaleBattleDuration(step.durationMs, currentSpeed()));
          continue;
        }
        const event = step.event;
        const duration = timelineDuration(event, displayConditionsRef.current[event.targetSide || "p1"], currentSpeed());
        const targetIsDisplayedActive = eventCanMutateDisplayedActive(event, displayedActiveNamesRef.current, displayedActiveShowdownIdsRef.current);
        battleDebugLog("战斗动画流程 step", {
          runId,
          kind: step.kind,
          duration,
          event: {
            id: event.id,
            type: event.type,
            text: event.text,
            side: event.side,
            targetSide: event.targetSide,
            target: event.target,
            move: event.move,
            condition: event.condition,
          },
          targetIsDisplayedActive,
        });
        if (step.kind === "message") {
          if (isZPowerEvent(event)) {
            const side = event.side || event.targetSide || "p1";
            const actorName = zActorName(event, displayedActiveNamesRef.current);
            pendingZMoveSide = side;
            skipZVisualIds.add(event.id);
            setCurrentVisualCue(targetIsDisplayedActive ? visualCueForEvent(event, activeBattle, displayedActiveNamesRef.current, displayedActiveShowdownIdsRef.current, currentSpeed()) : null);
            const powerEvent = {...event, id: `${event.id}:zpower`, text: `${actorName}让Z力量笼罩了全身`, effect: "z-move-call"} as BattleTimelineEvent;
            setCurrentTimelineEvent(powerEvent);
            setShownEvents(events => [...events, powerEvent.text].slice(-14));
            await wait(scaleBattleDuration(860, currentSpeed()));
            if (playbackRun.current !== runId) return;
            const releaseEvent = {...event, id: `${event.id}:zrelease`, text: `${actorName}开始释放Z招式`, effect: "z-move-call"} as BattleTimelineEvent;
            setCurrentTimelineEvent(releaseEvent);
            setShownEvents(events => [...events, releaseEvent.text].slice(-14));
            await wait(scaleBattleDuration(720, currentSpeed()));
            setCurrentVisualCue(null);
            continue;
          }
          if (event.type === "move" && pendingZMoveSide && (event.side || "p1") === pendingZMoveSide) {
            const sourceSide = event.side || pendingZMoveSide;
            pendingZMoveSide = null;
            pendingZImpactSourceSide = sourceSide;
            const nameEvent = {...event, id: `${event.id}:zname`, text: zMoveDisplayName(event), effect: "z-move-name"} as BattleTimelineEvent;
            setCurrentTimelineEvent(nameEvent);
            setShownEvents(events => [...events, event.text].slice(-14));
            await wait(scaleBattleDuration(1180, currentSpeed()));
            continue;
          }
          if (event.type === "move" && pendingZImpactSourceSide && (event.side || "p1") !== pendingZImpactSourceSide) {
            pendingZImpactSourceSide = null;
          }
          setCurrentTimelineEvent(event);
          setShownEvents(events => [...events, event.text].slice(-14));
          await wait(Math.max(scaleBattleDuration(780, currentSpeed()), Math.min(scaleBattleDuration(2200, currentSpeed()), duration)));
          continue;
        }
        if (step.kind === "visual") {
          if (skipZVisualIds.has(event.id)) continue;
          const zImpactActive = event.type === "damage" && pendingZImpactSourceSide && event.targetSide && event.targetSide !== pendingZImpactSourceSide;
          const cue = zImpactActive
            ? zImpactCueForEvent(event, pendingZImpactSourceSide!, duration, currentSpeed())
            : visualCueForEvent(event, activeBattle, displayedActiveNamesRef.current, displayedActiveShowdownIdsRef.current, currentSpeed());
          if (zImpactActive) pendingZImpactSourceSide = null;
          setCurrentVisualCue(targetIsDisplayedActive ? cue : null);
          await wait(duration);
          setCurrentVisualCue(null);
          continue;
        }
        if (step.kind === "hp") {
          if ((event.type === "damage" || event.type === "heal") && event.targetSide && targetIsDisplayedActive) {
            setHpTransitionMs(current => ({...current, [event.targetSide!]: duration}));
            if (event.condition) {
              const nextConditions = {...displayConditionsRef.current, [event.targetSide]: event.condition};
              displayConditionsRef.current = nextConditions;
              setDisplayConditions(nextConditions);
            }
            await wait(duration);
          } else {
            await wait(scaleBattleDuration(180, currentSpeed(), 90));
          }
          continue;
        }
        if (step.kind === "state") {
          if (event.type === "switch" && event.targetSide && event.target_id) {
            const oldName = displayedActiveNamesRef.current[event.targetSide];
            if (oldName && oldName !== event.target_id) {
              setCurrentVisualCue(scaleBattleVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_out"), event, "switch-out", event.targetSide, event.targetSide), currentSpeed()));
              await wait(scaleBattleDuration(520, currentSpeed()));
              setCurrentVisualCue(null);
            }
            const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
            displayedActiveNamesRef.current = nextNames;
            setDisplayedActiveNames(nextNames);
            const nextShowdownIds = {...displayedActiveShowdownIdsRef.current, [event.targetSide]: event.target_showdown_id || displayedActiveShowdownIdsRef.current[event.targetSide] || ""};
            displayedActiveShowdownIdsRef.current = nextShowdownIds;
            setDisplayedActiveShowdownIds(nextShowdownIds);
            const nextSnapshots = {...displayedActiveSnapshotsRef.current, [event.targetSide]: snapshotFromTimelineEvent(displayedActiveSnapshotsRef.current[event.targetSide], event)};
            displayedActiveSnapshotsRef.current = nextSnapshots;
            setDisplayedActiveSnapshots(nextSnapshots);
            const nextSubstitutes = {...displayedSubstitutesRef.current, [event.targetSide]: false};
            displayedSubstitutesRef.current = nextSubstitutes;
            setDisplayedSubstitutes(nextSubstitutes);
            setFaintedSides(current => ({...current, [event.targetSide!]: false}));
            if (event.condition) {
              const nextConditions = {...displayConditionsRef.current, [event.targetSide]: event.condition};
              displayConditionsRef.current = nextConditions;
              setDisplayConditions(nextConditions);
            }
          } else if (event.type === "form" && event.targetSide && event.target_id && targetIsDisplayedActive) {
            const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
            displayedActiveNamesRef.current = nextNames;
            setDisplayedActiveNames(nextNames);
            if (event.target_showdown_id) {
              const nextShowdownIds = {...displayedActiveShowdownIdsRef.current, [event.targetSide]: event.target_showdown_id};
              displayedActiveShowdownIdsRef.current = nextShowdownIds;
              setDisplayedActiveShowdownIds(nextShowdownIds);
            }
            const nextSnapshots = {...displayedActiveSnapshotsRef.current, [event.targetSide]: snapshotFromTimelineEvent(displayedActiveSnapshotsRef.current[event.targetSide], event)};
            displayedActiveSnapshotsRef.current = nextSnapshots;
            setDisplayedActiveSnapshots(nextSnapshots);
          } else if (event.type === "substitute" && event.targetSide && targetIsDisplayedActive) {
            const nextSubstitutes = {...displayedSubstitutesRef.current, [event.targetSide]: Boolean(event.substitute)};
            displayedSubstitutesRef.current = nextSubstitutes;
            setDisplayedSubstitutes(nextSubstitutes);
          } else if (event.type === "faint" && event.targetSide && targetIsDisplayedActive) {
            if (event.condition) {
              const nextConditions = {...displayConditionsRef.current, [event.targetSide]: event.condition};
              displayConditionsRef.current = nextConditions;
              setDisplayConditions(nextConditions);
            }
            setFaintedSides(current => ({...current, [event.targetSide!]: true}));
            const nextSnapshots = {...displayedActiveSnapshotsRef.current, [event.targetSide]: {...displayedActiveSnapshotsRef.current[event.targetSide], condition: event.condition || "0 fnt"}};
            displayedActiveSnapshotsRef.current = nextSnapshots;
            setDisplayedActiveSnapshots(nextSnapshots);
          }
          await wait(scaleBattleDuration(180, currentSpeed(), 90));
        }
      }
      if (playbackRun.current !== runId) return;
      await wait(scaleBattleDuration(420, currentSpeed()));
      if (playbackRun.current !== runId) return;
      battleDebugLog("战斗动画流程结束", {
        runId,
        turn: activeBattle.tracker.turn,
        elapsedMs: Math.round(performance.now() - playbackStartedAt),
        ended: activeBattle.ended,
        requestWait: activeBattle.request?.wait,
        forceSwitch: activeBattle.request?.forceSwitch,
        addedNeedsPartySettle,
      });
      setCurrentTimelineEvent(null);
      setCurrentVisualCue(null);
      setPlaybackActive(false);
      setShownEvents(lastEvents(activeBattle, 14));
      if (addedNeedsPartySettle) {
        setPartyBoardSettleLock(true);
        if (partyBoardSettleTimer.current) window.clearTimeout(partyBoardSettleTimer.current);
        partyBoardSettleTimer.current = window.setTimeout(() => {
          setPartyBoardSettleLock(false);
          setPartyBoardPlaybackSnapshot(undefined);
          partyBoardSettleTimer.current = null;
        }, scaleBattleDuration(1600, currentSpeed(), 700));
      } else {
        setPartyBoardSettleLock(false);
      }
      displayConditionsRef.current = finalConditions;
      displayedActiveNamesRef.current = finalActiveNames;
      displayedActiveShowdownIdsRef.current = finalActiveShowdownIds;
      const finalSnapshots = activeSnapshotsForBattle(activeBattle);
      displayedActiveSnapshotsRef.current = finalSnapshots;
      displayedSubstitutesRef.current = finalSubstitutes;
      setDisplayConditions(finalConditions);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayedActiveShowdownIds(finalActiveShowdownIds);
      setDisplayedActiveSnapshots(finalSnapshots);
      setDisplayedSubstitutes(finalSubstitutes);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      const settledSnapshot = dedupeBattleViewPartySnapshot(cloneBattleViewSnapshot(battleViewFor(activeBattle)));
      lastSettledBattleViewRef.current = settledSnapshot;
      if (activeBattle.ended && pendingTransition && !finishRequested.current) {
        beginBattleOutro(activeBattle, pendingTransition);
      } else if ((activeBattle.request?.wait || isForcedContinuationRequest(activeBattle.request)) && !pendingTransition) {
        void triggerAutoAdvance(`play:${timelineKey}:${recentKey}:${activeBattle.tracker.turn}`);
      }
      if (!addedNeedsPartySettle) setPartyBoardPlaybackSnapshot(undefined);
    }

    void playQueue();
    return () => {
      eventTimers.current.forEach(timer => window.clearTimeout(timer));
      eventTimers.current = [];
      if (partyBoardSettleTimer.current) {
        window.clearTimeout(partyBoardSettleTimer.current);
        partyBoardSettleTimer.current = null;
      }
    };
  }, [timelineKey, recentKey, dialogue?.kind]);

  const displayPlayer = battle ? displayedActiveDisplay(battle, "p1", displayedActiveNames.p1, displayedActiveShowdownIds.p1, playerActiveSlot?.display || player.display, displayedActiveSnapshots.p1) : player.display;
  const displayEnemy = battle ? displayedActiveDisplay(battle, "p2", displayedActiveNames.p2, displayedActiveShowdownIds.p2, enemyActiveSlot?.display || enemy.display, displayedActiveSnapshots.p2) : enemy.display;
  const battleCryScopeKey = battle
    ? `${battle.enemy_trainer?.id || ""}:${battle.player_display.map(pokemon => pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id).join("|")}:${battle.enemy_display.map(pokemon => pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id).join("|")}`
    : "";

  useEffect(() => {
    if (!battle) {
      lastCryKeys.current = {p1: "", p2: ""};
      lastCryScopeKey.current = "";
      return;
    }
    if (lastCryScopeKey.current !== battleCryScopeKey) {
      lastCryKeys.current = {p1: "", p2: ""};
      lastCryScopeKey.current = battleCryScopeKey;
    }
    if (introDialoguePending.current || entryRevealLocked || dialogue || trainerIntroActive || introActive) return;
    const playerCryKey = !displayedSubstitutes.p1 && displayPlayer?.sprite?.cry_asset
      ? `${displayPlayer.species_id || displayPlayer.sprite.species_id}:${displayPlayer.sprite.cry_asset}`
      : "";
    const enemyCryKey = !displayedSubstitutes.p2 && displayEnemy?.sprite?.cry_asset
      ? `${displayEnemy.species_id || displayEnemy.sprite.species_id}:${displayEnemy.sprite.cry_asset}`
      : "";
    const timers: number[] = [];
    if (playerCryKey && playerCryKey !== lastCryKeys.current.p1) {
      playPokemonCry(displayPlayer, "battle:p1");
    }
    if (enemyCryKey && enemyCryKey !== lastCryKeys.current.p2) {
      const delay = playerCryKey && playerCryKey !== lastCryKeys.current.p1 ? 180 : 0;
      const timer = window.setTimeout(() => playPokemonCry(displayEnemy, "battle:p2"), delay);
      timers.push(timer);
    }
    lastCryKeys.current = {p1: playerCryKey, p2: enemyCryKey};
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [
    Boolean(battle),
    battleCryScopeKey,
    dialogue,
    trainerIntroActive,
    introActive,
    entryRevealLocked,
    displayedSubstitutes.p1,
    displayedSubstitutes.p2,
    displayPlayer?.species_id,
    displayPlayer?.sprite?.species_id,
    displayPlayer?.sprite?.cry_asset,
    displayEnemy?.species_id,
    displayEnemy?.sprite?.species_id,
    displayEnemy?.sprite?.cry_asset,
  ]);

  if (!battle) return <div className="loading-panel"><strong>正在进入对局...</strong></div>;
  const playerSprite = displayedSubstitutes.p1 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const enemySprite = displayedSubstitutes.p2 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const activePlayerIndex = Math.max(0, battleView?.player.active_index ?? battle.request?.side?.pokemon?.findIndex(pokemon => pokemon.active) ?? 0);
  const shouldUsePlaybackPartySnapshot = hasQueuedPlayback || playbackActive || partyBoardSettleLock;
  const partyBoardBattleView = shouldUsePlaybackPartySnapshot && partyBoardPlaybackSnapshot ? partyBoardPlaybackSnapshot : battleView;
  const basePlayerParty = battleViewPartySlots(partyBoardBattleView?.player, openPokemonDetail);
  const baseEnemyParty = battleViewPartySlots(partyBoardBattleView?.enemy);
  const playerParty = shouldUsePlaybackPartySnapshot ? basePlayerParty : basePlayerParty.map(slot => {
    if (slot.active) {
      return {...slot, active: true, display: displayPlayer || slot.display, condition: displayConditions.p1, status: statusCode(displayConditions.p1, battle.tracker.active.p1.status)};
    }
    return slot;
  });
  const rawEnemyParty = shouldUsePlaybackPartySnapshot ? baseEnemyParty : baseEnemyParty.map(slot => {
    if (slot.active) {
      return {...slot, active: true, display: displayEnemy || slot.display, condition: displayConditions.p2, status: statusCode(displayConditions.p2, battle.tracker.active.p2.status), revealed: true};
    }
    return slot;
  });
  const hideActiveEnemyEntry = introActive || trainerIntroActive || Boolean(dialogue?.kind === "intro" && entryRevealLocked);
  const enemyParty = hideActiveEnemyEntry
    ? rawEnemyParty.map(slot => slot.active ? {...slot, display: undefined, condition: undefined, status: undefined, active: false, revealed: false} : slot)
    : rawEnemyParty;
  const messageDuration = currentTimelineEvent ? timelineDuration(currentTimelineEvent, displayConditions[currentTimelineEvent.targetSide || "p1"], battleSpeed) : scaleBattleDuration(1600, battleSpeed);
  const messageMs = currentTimelineEvent?.notice_title ? Math.max(scaleBattleDuration(2200, battleSpeed), messageDuration) : Math.max(scaleBattleDuration(900, battleSpeed), messageDuration);
  const detailOpen = detailIndex !== null || panelMode === "teamMenu";
  const detailInitialIndex = detailIndex ?? activePlayerIndex;
  const controlledDetailIndex = detailSelectedIndex ?? detailInitialIndex;
  const trainerOverlayBattle = dialogue ? {...battle, player_trainer: dialogue.playerTrainer || battle.player_trainer, enemy_trainer: dialogue.trainer || battle.enemy_trainer, enemy_boss_record: dialogue.bossRecord || battle.enemy_boss_record} : battle;
  const battleBackground = battleBackgroundFor(battle);
  const battleBackgroundUrl = assetUrl(battleBackground?.src);
  const battleFieldStyle = battleBackgroundUrl ? {"--battle-background-image": `url("${battleBackgroundUrl}")`} as CSSProperties : undefined;
  const playerDynamaxClass = !displayedSubstitutes.p1 && !faintedSides.p1 && displayedActiveSnapshots.p1.dynamaxed ? displayedActiveSnapshots.p1.gigantamaxed ? "sprite-gigantamaxed" : "sprite-dynamaxed" : "";
  const enemyDynamaxClass = !displayedSubstitutes.p2 && !faintedSides.p2 && displayedActiveSnapshots.p2.dynamaxed ? displayedActiveSnapshots.p2.gigantamaxed ? "sprite-gigantamaxed" : "sprite-dynamaxed" : "";
  const playerTeraClass = !displayedSubstitutes.p1 && !faintedSides.p1 && displayedActiveSnapshots.p1.terastallized ? "sprite-terastallized" : "";
  const enemyTeraClass = !displayedSubstitutes.p2 && !faintedSides.p2 && displayedActiveSnapshots.p2.terastallized ? "sprite-terastallized" : "";
  const currentMoveIsDynamax = currentTimelineEvent?.type === "move" && /^(?:G-Max|Max)\b|^(?:极巨|超极巨)/i.test(currentTimelineEvent.move || "");
  const openBattleDex = (pokemon: RentalPokemon) => {
    const query = pokemon.species_zh || pokemon.species || pokemon.species_id || displayName(pokemon);
    setBattleDexQuery(query);
  };
  return (
    <BattlePage
      dialogueActive={Boolean(dialogue)}
      speed={battleSpeed}
      onClick={dialogue ? advanceBattleDialogue : undefined}
      partyBoard={<BattlePartyBoard battle={battle} playerSlots={playerParty} enemySlots={enemyParty} onOpenStatus={() => selectPanelMode("statusMenu")} onOpenEnemyDex={battle.show_move_effectiveness ? openBattleDex : undefined} />}
      field={
        <BattleField
          className={`${battleBackgroundUrl ? "has-battle-background" : ""} ${trainerIntroActive ? "trainer-intro" : ""} ${introActive ? "battle-intro" : ""} ${battleAnimationClass(currentTimelineEvent)}`}
          style={battleFieldStyle}
          turn={battle.tracker.turn}
          fieldEffects={<FieldEffectsOverlay battle={battle} />}
          effectLayer={<BattleEffectLayer cue={currentVisualCue} />}
          trainerIntro={trainerIntroActive ? <TrainerIntroOverlay battle={trainerOverlayBattle} /> : null}
          toolbar={<BattleToolbar speed={battleSpeed} onSpeedChange={onBattleAnimationSpeedChange} onAiHint={handleAiHint} aiHintLoading={aiHintLoading} aiHintDisabled={aiHintDisabled} aiAutoplayEnabled={aiAutoplayEnabled} aiAutoplayPending={aiAutoplayPending} aiAutoplayDisabled={aiAutoplayToggleDisabled} onAiAutoplayToggle={toggleAiAutoplay} />}
          eventStatusStrip={battle.battle_event_statuses?.length ? (
            <div className="battle-event-status-strip">
              {battle.battle_event_statuses.map(status => (
                <button className={`tone-${status.tone || "safe"}`} title={status.detail || status.label} onClick={() => setEventInfoStatus(status)} key={`battle-event-${status.id}`}>
                  {status.label}{status.id === "contest" ? ` ${battle.contest_score || 0}` : ""}
                </button>
              ))}
            </div>
          ) : null}
          enemyPanel={<BattleFighterPanel side="enemy" pokemon={displayEnemy} condition={displayConditions.p2} status={battle.tracker.active.p2.status} substitute={displayedSubstitutes.p2} transitionMs={hpTransitionMs.p2} teraType={displayedActiveSnapshots.p2.tera_type_zh} />}
          sprites={<>
            <PokemonSprite className={`back-sprite ${displayedSubstitutes.p1 ? "substitute-sprite" : ""} ${faintedSides.p1 ? "sprite-fainted" : ""} ${playerDynamaxClass} ${playerTeraClass}`} pokemon={displayedSubstitutes.p1 ? undefined : displayPlayer} src={playerSprite} variant="back_normal" alt={displayPlayer ? displayName(displayPlayer) : "我方宝可梦"} entrance={!displayedSubstitutes.p1 && introActive} onClick={() => openPokemonDetail(activePlayerIndex)} />
            <PokemonSprite className={`front-sprite ${displayedSubstitutes.p2 ? "substitute-sprite" : ""} ${faintedSides.p2 ? "sprite-fainted" : ""} ${enemyDynamaxClass} ${enemyTeraClass}`} pokemon={displayedSubstitutes.p2 ? undefined : displayEnemy} src={enemySprite} alt={displayEnemy ? displayName(displayEnemy) : "对手宝可梦"} entrance={!displayedSubstitutes.p2 && introActive} />
          </>}
          playerPanel={<BattleFighterPanel side="player" pokemon={displayPlayer} condition={displayConditions.p1} status={battle.tracker.active.p1.status} substitute={displayedSubstitutes.p1} transitionMs={hpTransitionMs.p1} teraType={displayedActiveSnapshots.p1.tera_type_zh} onClick={() => openPokemonDetail(activePlayerIndex)} />}
          message={currentTimelineEvent ? <div key={currentTimelineEvent.id} className={`battle-message-pop ${currentTimelineEvent.notice_title ? "structured" : ""} ${currentTimelineEvent.effect === "z-move-call" ? "z-move-call" : ""} ${currentTimelineEvent.effect === "z-move-name" ? "z-move-name" : ""} ${currentMoveIsDynamax ? "dynamax-move-name" : ""}`} style={{"--message-duration": `${messageMs}ms`} as CSSProperties}>{currentTimelineEvent.notice_title ? <><strong>{currentTimelineEvent.notice_title}</strong>{currentTimelineEvent.notice_detail ? <small>{currentTimelineEvent.notice_detail}</small> : null}</> : currentTimelineEvent.effect === "z-move-name" ? <ZMoveNameCutIn event={currentTimelineEvent} /> : currentMoveIsDynamax ? <DynamaxMoveNameCutIn event={currentTimelineEvent} /> : currentTimelineEvent.text}</div> : null}
        />
      }
      bottom={
        <BattleCommandPanel
          dialogue={dialogue ? <BattleDialogueBox dialogue={dialogue} /> : undefined}
          panelMode={panelMode}
          controlsDisabled={controlsDisabled}
          shownEvents={shownEvents}
          currentEventText={currentTimelineEvent?.text}
          logRef={battleLogRef}
          actionContent={panelMode === "moveMenu" && !requestWaiting && !forceSwitch ? <MoveMenu battle={battle} disabled={controlsDisabled} onMove={handleMoveChoice} onBack={() => selectPanelMode("battleMain")} /> : <BattleMainCommands battle={battle} forceSwitch={forceSwitch} waiting={requestWaiting || autoAdvancePending} disabled={controlsDisabled} setMode={selectPanelMode} onBag={() => { setItemTargetIndex(activePlayerIndex); setBattleItemOpen(true); }} onDialgaGrace={() => onChoice("dialga_grace")} onForfeit={() => onChoice("forfeit")} />}
        />
      }
      overlays={<>
      {panelMode === "statusMenu" && !dialogue ? <StatusModal battle={battle} onBack={() => selectPanelMode("battleMain")} /> : null}
      {detailOpen && !dialogue ? <PokemonDetailModal battle={battle} selectedIndex={controlledDetailIndex} onSelectedIndexChange={setDetailSelectedIndex} disabled={controlsDisabled} forceSwitch={forceSwitch} switchSubmitting={switchChoiceSubmitting} onSwitch={handleDetailSwitch} onClose={() => { closePokemonDetail(); if (panelMode === "teamMenu") selectPanelMode("battleMain"); }} /> : null}
      {battleItemOpen && !dialogue ? <BattleItemModal battle={battle} bag={battleBag} initialTarget={itemTargetIndex} disabled={controlsDisabled} onClose={() => setBattleItemOpen(false)} onUse={async (itemId, target, moveSlot, notice) => {
        const ok = await onChoice(`item ${itemId} ${target + 1}${moveSlot ? ` ${moveSlot}` : ""}`);
        if (ok) {
          setBattleItemOpen(false);
          if (notice) setBattleItemToast({id: Date.now(), message: notice});
        }
        return Boolean(ok);
      }} /> : null}
      {battleItemToast ? <ScreenToast key={battleItemToast.id} message={battleItemToast.message} durationMs={1200} onDone={() => setBattleItemToast(null)} /> : null}
      {aiAutoplayToast ? <ScreenToast key={aiAutoplayToast.id} message={aiAutoplayToast.message} durationMs={1400} onDone={() => setAiAutoplayToast(null)} /> : null}
      {eventInfoStatus ? <EventInfoModal status={eventInfoStatus} context="战斗事件" onClose={() => setEventInfoStatus(null)} /> : null}
      {(aiHint || aiHintError) && !dialogue ? <BattleAiHintModal hint={aiHint} error={aiHintError} disabled={controlsDisabled || aiHintLoading} onExecute={executeAiHintChoice} onClose={() => { setAiHint(null); setAiHintError(null); }} /> : null}
      {battleDexQuery ? <QuickDexModal key={battleDexQuery} initialCategory="pokemon" initialQuery={battleDexQuery} onClose={() => setBattleDexQuery(null)} /> : null}
      </>}
    />
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

const TYPE_ZH_BY_ID: Record<string, string> = {
  normal: "一般",
  fire: "火",
  water: "水",
  electric: "电",
  grass: "草",
  ice: "冰",
  fighting: "格斗",
  poison: "毒",
  ground: "地面",
  flying: "飞行",
  psychic: "超能力",
  bug: "虫",
  rock: "岩石",
  ghost: "幽灵",
  dragon: "龙",
  dark: "恶",
  steel: "钢",
  fairy: "妖精",
};

const ARCEUS_FORM_TYPE_BY_ID: Record<string, string> = {
  arceusbug: "bug",
  arceusdark: "dark",
  arceusdragon: "dragon",
  arceuselectric: "electric",
  arceusfairy: "fairy",
  arceusfighting: "fighting",
  arceusfire: "fire",
  arceusflying: "flying",
  arceusghost: "ghost",
  arceusgrass: "grass",
  arceusground: "ground",
  arceusice: "ice",
  arceuspoison: "poison",
  arceuspsychic: "psychic",
  arceusrock: "rock",
  arceussteel: "steel",
  arceuswater: "water",
};

const PLATE_TYPE_BY_ITEM_ID: Record<string, string> = {
  flameplate: "fire",
  splashplate: "water",
  zapplate: "electric",
  meadowplate: "grass",
  icicleplate: "ice",
  fistplate: "fighting",
  toxicplate: "poison",
  earthplate: "ground",
  skyplate: "flying",
  mindplate: "psychic",
  insectplate: "bug",
  stoneplate: "rock",
  spookyplate: "ghost",
  dracoplate: "dragon",
  dreadplate: "dark",
  ironplate: "steel",
  pixieplate: "fairy",
};

function typeZh(type: string | undefined): string {
  const id = typeId(type);
  return TYPE_ZH_BY_ID[id] || type || "?";
}

function judgmentTypeForPokemon(pokemon: RentalPokemon | undefined): string | null {
  const speciesType = ARCEUS_FORM_TYPE_BY_ID[toId(pokemon?.species_id || pokemon?.species)];
  if (speciesType) return speciesType;
  const itemType = PLATE_TYPE_BY_ITEM_ID[toId(pokemon?.item_id || pokemon?.item)];
  return itemType || null;
}

function runtimeMoveSummary(summary: MoveSummary | undefined, pokemon: RentalPokemon | undefined, battle: BattleState, side: "p1" | "p2"): MoveSummary | undefined {
  if (!summary) return summary;
  const moveId = toId(summary.id || summary.name);
  if (moveId === "terablast") {
    const active = battle.tracker.active[side];
    const teraType = active?.terastallized ? typeId(active.tera_type || active.tera_type_zh) : "";
    if (!teraType) return summary;
    const category = Number(pokemon?.stats?.atk || 0) > Number(pokemon?.stats?.spa || 0) ? "Physical" : "Special";
    return {...summary, type: teraType, type_zh: typeZh(teraType), category, category_zh: category === "Physical" ? "物理" : "特殊"};
  }
  if (moveId === "judgment") {
    const judgmentType = judgmentTypeForPokemon(pokemon);
    if (!judgmentType) return summary;
    return {...summary, type: judgmentType, type_zh: typeZh(judgmentType)};
  }
  return summary;
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

function effectivenessBadgeClass(multiplier: number): string {
  if (multiplier > 1) return "move-effectiveness-super";
  if (multiplier < 1) return "move-effectiveness-resist";
  return "move-effectiveness-normal";
}

function contestMoveLabel(battle: BattleState, active: RentalPokemon | undefined, moveId: string | undefined): {label: string; tone: "liked" | "disliked"} | null {
  const normalizedMove = toId(moveId);
  const marks = battle.contest_marks;
  if (!normalizedMove || !marks) return null;
  const keys = [
    active?.showdown_id,
    active?.run_member_id,
    active?.species_id,
    active?.species,
  ].map(value => String(value || "")).filter(Boolean);
  for (const key of keys) {
    const normalizedKey = toId(key);
    const liked = marks.liked?.[key] || marks.liked?.[normalizedKey];
    if (liked && toId(liked) === normalizedMove) return {label: "裁判喜欢", tone: "liked"};
    const disliked = marks.disliked?.[key] || marks.disliked?.[normalizedKey];
    if (disliked && toId(disliked) === normalizedMove) return {label: "裁判不喜", tone: "disliked"};
  }
  return null;
}

function MoveMenu({battle, disabled, onMove, onBack}: {battle: BattleState; disabled?: boolean; onMove: (index: number, mode?: BattleMoveChoiceMode, context?: BattleMoveClickDebugContext) => Promise<boolean | void> | boolean | void; onBack: () => void}) {
  const activeRequest = battle.request?.active?.[0];
  const moves = activeRequest?.moves || [];
  const view = battleViewFor(battle);
  const activeSlot = activeBattleViewSlot(view?.player);
  const targetSlot = activeBattleViewSlot(view?.enemy);
  const active = activeSlot?.display || activePokemon(battle, "p1").display;
  const target = targetSlot?.display || activePokemon(battle, "p2").display;
  const enabledSystems = battle.battle_setting?.enabled_battle_systems || [];
  const visibleSystems = BATTLE_SYSTEM_OPTIONS.filter(option => enabledSystems.includes(option.id));
  const canZMove = activeRequest?.canZMove || [];
  const maxMoves = activeRequest?.maxMoves?.maxMoves || [];
  const zAvailable = enabledSystems.includes("zmove") && canZMove.some(Boolean);
  const megaAvailable = enabledSystems.includes("mega") && Boolean(activeRequest?.canMegaEvo);
  const dynamaxAvailable = enabledSystems.includes("dynamax") && Boolean(activeRequest?.canDynamax);
  const terastalAvailable = enabledSystems.includes("terastal") && Boolean(activeRequest?.canTerastallize);
  const isTerastallized = Boolean(battle.tracker.active.p1.terastallized);
  const isDynamaxed = Boolean(battle.tracker.active.p1.dynamaxed);
  const showMaxMoves = enabledSystems.includes("dynamax") && maxMoves.length > 0 && isDynamaxed;
  const [zMode, setZMode] = useState(false);
  const [megaMode, setMegaMode] = useState(false);
  const [dynamaxMode, setDynamaxMode] = useState(false);
  const [terastalMode, setTerastalMode] = useState(false);
  useEffect(() => {
    if (!zAvailable && zMode) setZMode(false);
  }, [zAvailable, zMode]);
  useEffect(() => {
    if (!megaAvailable && megaMode) setMegaMode(false);
  }, [megaAvailable, megaMode]);
  useEffect(() => {
    if (!dynamaxAvailable && dynamaxMode) setDynamaxMode(false);
  }, [dynamaxAvailable, dynamaxMode]);
  useEffect(() => {
    if (!terastalAvailable && terastalMode) setTerastalMode(false);
  }, [terastalAvailable, terastalMode]);
  return <BattleMoveMenu><div className="move-menu">{moves.map((move, index) => {
    const summary = runtimeMoveSummary(moveSummaryFor(active, move), active, battle, "p1");
    const zMove = canZMove[index];
    const maxMove = maxMoves[index];
    const multiplier = moveEffectiveness(summary, target);
    const showEffect = Boolean(battle.show_move_effectiveness);
    const superEffective = Boolean(showEffect && multiplier > 1);
    const damageRange = moveDamageRangeLabel(summary, active, target, battle);
    const zMoveDisabled = zMode && !zMove;
    const dynamaxMoveDisabled = dynamaxMode && !maxMove;
    const contestLabel = contestMoveLabel(battle, active, summary?.id || move.id || move.move);
    const badge = showEffect || contestLabel ? (
      <span className="move-badge-stack">
        {showEffect ? <span className={effectivenessBadgeClass(multiplier)}>{effectivenessLabel(multiplier)}</span> : null}
        {contestLabel ? <span className={`contest-badge contest-${contestLabel.tone}`}>{contestLabel.label}</span> : null}
      </span>
    ) : null;
    const mode: BattleMoveChoiceMode | undefined = zMode ? "zmove" : megaMode ? "mega" : dynamaxMode ? "max" : terastalMode ? "terastallize" : undefined;
    const moveName = zMode && zMove
      ? zMoveDisplayLabel(zMove.move, active)
      : (dynamaxMode || showMaxMoves) && maxMove
        ? dynamaxMoveDisplayLabel(maxMove.move, active)
        : summary?.name_zh || move.move;
    const moveDisabled = Boolean(disabled || move.disabled || zMoveDisabled || dynamaxMoveDisabled);
    const choice = `move ${index + 1}${mode ? ` ${mode}` : ""}`;
    const displayedAccuracy = (zMode && zMove) || ((dynamaxMode || showMaxMoves) && maxMove)
      ? "必中"
      : summary ? summary.accuracy ?? "必中" : undefined;
    return (
      <MoveCard
        size="battle"
        className={[superEffective ? "move-super-effective" : "", contestLabel ? `move-contest-${contestLabel.tone}` : ""].filter(Boolean).join(" ")}
        name={moveName}
        moveType={summary?.type || summary?.type_zh}
        typeLabel={moveTypeLabel(summary)}
        badge={badge}
        damageRange={damageRange}
        pp={move.pp}
        maxPp={move.maxpp}
        power={summary?.power || "--"}
        accuracy={displayedAccuracy}
        disabled={moveDisabled}
        onClick={() => {
          const context: BattleMoveClickDebugContext = {
            choice,
            index: index + 1,
            mode,
            moveName,
            moveId: summary?.id || move.id,
            moveRequest: {id: move.id, move: move.move, pp: move.pp, maxpp: move.maxpp, disabled: move.disabled, target: move.target},
            active: {
              name: active ? displayName(active) : activeSlot?.display?.name,
              species: active?.species || active?.species_zh || activeSlot?.display?.species,
              showdownId: active?.showdown_id || activeSlot?.showdown_id,
              condition: activeSlot?.condition || battle.tracker.active.p1.condition,
            },
            target: {
              name: target ? displayName(target) : targetSlot?.display?.name,
              species: target?.species || target?.species_zh || targetSlot?.display?.species,
              showdownId: target?.showdown_id || targetSlot?.showdown_id,
              condition: targetSlot?.condition || battle.tracker.active.p2.condition,
            },
            disabled: moveDisabled,
            disabledReasons: {
              controls: Boolean(disabled),
              move: Boolean(move.disabled),
              zMove: zMoveDisabled,
              dynamaxMove: dynamaxMoveDisabled,
            },
          };
          battleDebugLog(`玩家点击技能：${moveName}`, {
            ...context,
            turn: battle.tracker.turn,
            request: {
              wait: battle.request?.wait,
              forceSwitch: battle.request?.forceSwitch,
              activeMoveCount: moves.length,
            },
          });
          void onMove(index + 1, mode, context);
        }}
        key={move.id || index}
      />
    );
  })}<div className="move-footer"><button className="menu-back" disabled={disabled} onClick={onBack}>返回</button>{visibleSystems.length ? <div className="battle-system-row">{visibleSystems.map(system => {
    if (system.id === "mega") {
      return <button className={megaMode ? "selected" : ""} disabled={disabled || !megaAvailable} title={megaAvailable ? "确认使用 Mega 石后选择技能" : "当前不能 Mega 进化"} onClick={() => { setMegaMode(value => !value); setZMode(false); setDynamaxMode(false); setTerastalMode(false); }} key={system.id}>{megaMode ? "取消 Mega" : system.name}</button>;
    }
    if (system.id === "zmove") {
      return <button className={zMode ? "selected" : ""} disabled={disabled || !zAvailable} title={zAvailable ? "选择一个技能释放 Z 招式" : "当前没有可用的 Z 招式"} onClick={() => { setZMode(value => !value); setMegaMode(false); setDynamaxMode(false); setTerastalMode(false); }} key={system.id}>{zMode ? "取消 Z" : system.name}</button>;
    }
    if (system.id === "dynamax") {
      const label = isDynamaxed ? "极巨中" : dynamaxMode ? "取消极巨" : system.name;
      const title = dynamaxAvailable ? "确认极巨化后选择技能" : isDynamaxed ? "极巨化已经发动" : "当前不能极巨化";
      return <button className={dynamaxMode ? "selected" : ""} disabled={disabled || !dynamaxAvailable} title={title} onClick={() => { setDynamaxMode(value => !value); setZMode(false); setMegaMode(false); setTerastalMode(false); }} key={system.id}>{label}</button>;
    }
    if (system.id === "terastal") {
      const teraType = battle.tracker.active.p1.tera_type_zh || (typeof activeRequest?.canTerastallize === "string" ? typeZh(activeRequest.canTerastallize) : "");
      const label = isTerastallized ? "已太晶" : terastalMode ? "取消太晶" : system.name;
      const title = terastalAvailable ? `使用太晶珠${teraType ? `变为${teraType}属性` : ""}后选择技能` : isTerastallized ? "太晶化已经发动" : "当前不能太晶化";
      return <button className={terastalMode ? "selected" : ""} disabled={disabled || !terastalAvailable} title={title} onClick={() => { setTerastalMode(value => !value); setZMode(false); setMegaMode(false); setDynamaxMode(false); }} key={system.id}>{label}</button>;
    }
    return <button disabled title={`${system.name} 未接入`} key={system.id}>{IMPLEMENTED_BATTLE_SYSTEMS.has(system.id) ? system.name : `${system.name} 未接入`}</button>;
  })}</div> : null}</div></div></BattleMoveMenu>;
}

function TeamMenu({battle, disabled, onSwitch, onBack}: {battle: BattleState; disabled?: boolean; onSwitch: (index: number) => void; onBack: () => void}) {
  const slots = battleViewFor(battle)?.player.slots || [];
  const [focus, setFocus] = useState(0);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [detailSelectedIndex, setDetailSelectedIndex] = useState(0);
  return <BattleTeamMenu><div className="team-menu"><div className="team-list">{slots.map((slot, index) => { const display = slot.display; const status = statusCode(slot.condition, slot.status); return <div className={`team-row ${focus === index ? "selected" : ""}`} key={slot.key}><button className="team-summary" disabled={disabled} onClick={() => { setFocus(index); setDetailIndex(index); setDetailSelectedIndex(index); }}><span>{slot.active ? "▶" : `${slot.slot}.`}</span><strong>{display ? displayName(display) : slot.runtime ? runtimeName(slot.runtime) : "未知"}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<small>{conditionText(slot.condition)}　{slot.runtime?.item || ""}</small></button></div>; })}<button disabled={disabled} onClick={onBack}>返回</button></div>{detailIndex !== null ? <PokemonDetailModal battle={battle} selectedIndex={detailSelectedIndex} onSelectedIndexChange={setDetailSelectedIndex} disabled={disabled} onSwitch={onSwitch} onClose={() => setDetailIndex(null)} /> : null}</div></BattleTeamMenu>;
}

function PokemonDetailModal({battle, selectedIndex, onSelectedIndexChange, disabled, forceSwitch, switchSubmitting, onSwitch, onClose}: {battle: BattleState; selectedIndex: number; onSelectedIndexChange: (index: number) => void; disabled?: boolean; forceSwitch?: boolean; switchSubmitting?: boolean; onSwitch: (index: number) => Promise<boolean | void> | boolean | void; onClose: () => void}) {
  const slots = battleViewFor(battle)?.player.slots || [];
  const clampedSelectedIndex = Math.max(0, Math.min(selectedIndex, Math.max(0, slots.length - 1)));
  const [tab, setTab] = useState<"basic" | "moves">("basic");
  const slot = slots[clampedSelectedIndex] || slots[0];
  const runtime = slot?.runtime;
  const pokemon = slot?.display || battle.player_display[0];
  const status = statusCode(slot?.condition, slot?.status);
  const selectedSlot = slot?.slot;
  const switchChoiceIndex = switchChoiceIndexForSlot(battle, slot);
  const canSwitch = Boolean(switchChoiceIndex) && Boolean(slot) && !slot.active && status !== "fnt";
  const activeMoves = slot?.active ? battle.request?.active?.[0]?.moves || [] : [];
  const revealTraining = Boolean(battle.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const detailLockedText = "？？？";

  useEffect(() => {
    if (clampedSelectedIndex !== selectedIndex) onSelectedIndexChange(clampedSelectedIndex);
  }, [clampedSelectedIndex, selectedIndex, onSelectedIndexChange]);

  if (!pokemon) return null;

  async function submitSwitch() {
    if (!switchChoiceIndex || disabled || switchSubmitting || !canSwitch) return;
    battleDebugLog("resolve switch target", {
      uiSlot: selectedSlot,
      submittedSwitchIndex: switchChoiceIndex,
      targetShowdownId: normalizedShowdownId(slot?.showdown_id || slot?.runtime?.pokeball || pokemon.showdown_id),
      requestOrder: (battle.request?.side?.pokemon || []).map((entry, index) => ({
        switchIndex: index + 1,
        ident: entry.ident,
        pokeball: entry.pokeball,
        active: Boolean(entry.active),
        condition: entry.condition,
      })),
    });
    await Promise.resolve(onSwitch(switchChoiceIndex));
  }

  function ppText(move: MoveSummary): string {
    const slotMove = (slot?.moves || []).find(entry => toId(entry.id || entry.move) === toId(move.id || move.name));
    if (slotMove) return `PP ${slotMove.pp}/${slotMove.maxpp}`;
    const runtimeMove = activeMoves.find(entry => toId(entry.id || entry.move) === toId(move.id || move.name));
    if (!runtimeMove) return `PP ${move.pp}`;
    return `PP ${runtimeMove.pp ?? move.pp}/${runtimeMove.maxpp ?? move.pp}`;
  }

  return (
    <BattlePokemonDetail><div className="modal-layer">
      <section className="pokemon-detail-modal">
        <aside className="detail-team-list">
          {slots.map((entry, index) => {
            const display = entry.display;
            const code = statusCode(entry.condition, entry.status);
            return (
              <button className={clampedSelectedIndex === index ? "selected" : ""} disabled={disabled || switchSubmitting} onClick={() => {
                battleDebugLog("select detail slot", {
                  index,
                  slot: entry.slot,
                  name: display ? displayName(display) : entry.runtime ? runtimeName(entry.runtime) : entry.key,
                  active: entry.active,
                  condition: entry.condition,
                });
                onSelectedIndexChange(index);
              }} key={entry.key}>
                <PokemonSprite pokemon={display} alt={display ? displayName(display) : entry.runtime ? runtimeName(entry.runtime) : "未知"} />
                <span>{entry.active ? "▶ " : ""}{display ? displayName(display) : entry.runtime ? runtimeName(entry.runtime) : "未知"}</span>
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
              <p>{pokemon.species}　Lv{pokemon.level}{genderMark(pokemon.gender) ? ` ${genderMark(pokemon.gender)}` : ""}</p>
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
                    <span>HP</span><strong>{conditionText(slot?.condition)}</strong>
                    <span>道具</span><strong>{pokemon.item_zh || runtime?.item || "无"}</strong>
                    <span>定位</span><strong>{pokemon.role_zh || pokemon.role || "未标注"}</strong>
                  </div>
                  <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></div>)}</div>
                  <p><b>特性说明：</b>{revealTraining ? abilityDescription(pokemon) : detailLockedText}</p>
                  <p><b>道具说明：</b>{revealTraining ? pokemon.item_desc_zh || pokemon.item_desc || "无道具" : detailLockedText}</p>
                </div>
              </div>
            ) : (
              <div className="detail-moves">
                {pokemon.moves.map(move => {
                  const displayMove = slot?.active || toId(move.id || move.name) === "judgment"
                    ? runtimeMoveSummary(move, pokemon, battle, "p1") || move
                    : move;
                  const pp = ppText(displayMove).replace(/^PP\s*/, "").split("/");
                  return (
                    <MoveCard
                      className="battle-detail-move-card"
                      size="sheet"
                      name={displayMove.name_zh || displayMove.name}
                      moveType={displayMove.type || displayMove.type_zh}
                      typeLabel={displayMove.type_zh || displayMove.type || "一般"}
                      category={displayMove.category_zh || displayMove.category || "变化"}
                      pp={pp[0] || displayMove.pp || "--"}
                      maxPp={pp[1] || displayMove.pp}
                      power={displayMove.power || "--"}
                      accuracy={displayMove.accuracy ?? "必中"}
                      disabled
                      key={move.id}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <footer>
            <button disabled={disabled || switchSubmitting || !canSwitch} onClick={() => void submitSwitch()}>{switchSubmitting ? "换人中" : "换人"}</button>
            <button disabled={forceSwitch || switchSubmitting} title={forceSwitch ? "必须先换上可战斗的宝可梦" : undefined} onClick={onClose}>关闭</button>
          </footer>
        </section>
      </section>
    </div></BattlePokemonDetail>
  );
}

type BattlePpMoveOption = {
  slot: number;
  key: string;
  name: string;
  typeLabel?: string;
  pp?: number;
  maxpp?: number;
};

const SINGLE_MOVE_PP_ITEMS = new Set(["ether", "maxether", "leppaberry"]);

function isSingleMovePpItem(item: BagItemView | undefined): boolean {
  return SINGLE_MOVE_PP_ITEMS.has(toId(item?.id || item?.name || ""));
}

function ppMoveOptionsFor(display: RentalPokemon | undefined, activeMoves: BattleMoveRequest[]): BattlePpMoveOption[] {
  if (activeMoves.length) {
    return activeMoves.map((move, index) => {
      const summary = moveSummaryFor(display, move);
      return {
        slot: index + 1,
        key: `${move.id || move.move}-${index}`,
        name: summary?.name_zh || move.move,
        typeLabel: moveTypeLabel(summary),
        pp: move.pp,
        maxpp: move.maxpp,
      };
    });
  }
  return (display?.moves || []).map((move, index) => ({
    slot: index + 1,
    key: `${move.id || move.name}-${index}`,
    name: move.name_zh || move.name,
    typeLabel: moveTypeLabel(move),
    pp: undefined,
    maxpp: move.pp,
  }));
}

function ppMoveOptionsForSlot(slot: BattleViewSlot | undefined, display: RentalPokemon | undefined, activeMoves: BattleMoveRequest[]): BattlePpMoveOption[] {
  if (activeMoves.length) return ppMoveOptionsFor(display, activeMoves);
  if (slot?.moves?.length) {
    return slot.moves.map(move => {
      const summary = moveSummaryByName(display, move.id || move.move);
      return {
        slot: move.slot,
        key: `${move.id || move.move}-${move.slot}`,
        name: summary?.name_zh || move.move,
        typeLabel: moveTypeLabel(summary),
        pp: move.pp,
        maxpp: move.maxpp,
      };
    });
  }
  return ppMoveOptionsFor(display, activeMoves);
}

function BattleItemModal({battle, bag, initialTarget, disabled, onClose, onUse}: {battle: BattleState; bag: BagCategoryView | null; initialTarget: number; disabled?: boolean; onClose: () => void; onUse: (itemId: string, target: number, moveSlot?: number, notice?: string) => Promise<boolean> | boolean | void}) {
  const usableItems = useMemo(() => bag?.consumable || [], [bag]);
  const counts = useMemo(() => Object.fromEntries(BAG_FILTERS.map(entry => [entry.key, usableItems.filter(item => bagFilterForItem(item, entry.key)).length])) as Record<BagFilterKey, number>, [usableItems]);
  const firstAvailableFilter = BAG_FILTERS.find(entry => counts[entry.key])?.key || "recovery";
  const [filter, setFilter] = useState<BagFilterKey>(firstAvailableFilter);
  const items = useMemo(() => usableItems.filter(item => bagFilterForItem(item, filter)), [filter, usableItems]);
  const [step, setStep] = useState<BagActionStep>("detail");
  const [target, setTarget] = useState(Math.max(0, initialTarget));
  const [itemId, setItemId] = useState(() => items[0]?.id || usableItems[0]?.id || "");
  const [ppPicker, setPpPicker] = useState<{item: BagItemView; target: number} | null>(null);
  const [usingItem, setUsingItem] = useState(false);
  const [toast, setToast] = useState<{id: number; message: string; tone?: "normal" | "danger"} | null>(null);
  const selected = items.find(item => item.id === itemId) || items[0];
  const slots = battleViewFor(battle)?.player.slots || [];
  const revealItemDetails = Boolean(battle.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const selectedNeedsMove = isSingleMovePpItem(selected);
  const ppPickerSlot = ppPicker ? slots[ppPicker.target] || slots[0] : slots[target] || slots[0];
  const ppPickerDisplay = ppPickerSlot?.display || battle.player_display[ppPicker?.target ?? target] || battle.player_display[0];
  const ppPickerActiveMoves = ppPickerSlot?.active ? battle.request?.active?.[0]?.moves || [] : [];
  const ppPickerMoveOptions = ppMoveOptionsForSlot(ppPickerSlot, ppPickerDisplay, ppPickerActiveMoves);
  const team = slots.map(entry => {
    const display = entry.display;
    const itemUnavailable = !selected || selected.count <= 0;
    return {
      pokemon: display,
      condition: entry.condition,
      status: entry.status,
      heldItem: display?.item_zh || display?.item || entry.runtime?.item || "无道具",
      disabled: Boolean(disabled || usingItem || itemUnavailable),
      disabledReason: usingItem ? "处理中" : itemUnavailable ? "没有库存" : selectedNeedsMove ? "选择技能" : "使用",
    };
  });

  useEffect(() => {
    if (!counts[filter] && filter !== firstAvailableFilter) setFilter(firstAvailableFilter);
  }, [counts, filter, firstAvailableFilter]);

  useEffect(() => {
    if (itemId && !items.some(item => item.id === itemId)) setItemId(items[0]?.id || "");
    if (!itemId && items.length) setItemId(items[0].id);
  }, [itemId, items]);

  useEffect(() => {
    setStep("detail");
    setPpPicker(null);
  }, [selected?.id]);

  function showToast(message: string, tone: "normal" | "danger" = "normal") {
    setToast({id: Date.now(), message, tone});
  }

  function itemTargetBattleIndexFor(uiTargetIndex: number): number {
    const slot = slots[uiTargetIndex];
    const requestIndex = battleRequestIndexForSlot(battle, slot);
    const submittedBattleIndex = requestIndex ?? uiTargetIndex;
    battleDebugLog("resolve item target", {
      itemId: selected?.id,
      uiTargetIndex,
      submittedBattleIndex,
      targetShowdownId: normalizedShowdownId(slot?.showdown_id || slot?.runtime?.pokeball || slot?.display?.showdown_id),
      requestOrder: (battle.request?.side?.pokemon || []).map((entry, index) => ({
        battleIndex: index,
        ident: entry.ident,
        pokeball: entry.pokeball,
        active: Boolean(entry.active),
        condition: entry.condition,
      })),
    });
    return submittedBattleIndex;
  }

  async function submitSelectedItem(targetIndex: number) {
    if (!selected || usingItem) return;
    setTarget(targetIndex);
    if (selectedNeedsMove) {
      const slot = slots[targetIndex];
      const display = slot?.display || battle.player_display[targetIndex];
      const moves = ppMoveOptionsForSlot(slot, display, slot?.active ? battle.request?.active?.[0]?.moves || [] : []);
      if (!moves.length) {
        showToast("这个目标没有可选择的技能。", "danger");
        return;
      }
      setPpPicker({item: selected, target: targetIndex});
      return;
    }
    setUsingItem(true);
    try {
      const ok = await onUse(selected.id, itemTargetBattleIndexFor(targetIndex));
      if (ok === false) showToast("道具没有成功使用。", "danger");
      else setStep("detail");
    } finally {
      setUsingItem(false);
    }
  }

  async function submitPpMove(move: BattlePpMoveOption) {
    if (!ppPicker || usingItem) return;
    setUsingItem(true);
    try {
      const ok = await onUse(ppPicker.item.id, itemTargetBattleIndexFor(ppPicker.target), move.slot, `${move.name} 已恢复`);
      if (ok === false) showToast("道具没有成功使用。", "danger");
      else {
        setPpPicker(null);
        setStep("detail");
      }
    } finally {
      setUsingItem(false);
    }
  }

  return (
    <BattleBagPanel><div className="modal-layer battle-bag-layer">
      <section className="battle-bag-modal battle-rest-bag-modal">
        <header className="battle-bag-header">
          <div>
            <h2>战斗背包</h2>
            <p>战斗中只能使用消耗类道具。</p>
          </div>
          <button type="button" disabled={usingItem} onClick={onClose}>关闭</button>
        </header>
        <section className="rest-bag-tool-panel battle-rest-bag-panel">
          <aside className="rest-bag-left">
            <BagFilterTabs activeKey={filter} counts={counts} disabled={usingItem} onSelect={key => { setFilter(key); setStep("detail"); }} />
            <BagItemList items={items} selectedId={selected?.id} disabled={usingItem} emptyText="当前没有可在战斗中使用的消耗道具。" onSelect={id => { setItemId(id); setStep("detail"); }} />
          </aside>
          <BagActionPanel
            step={step}
            item={selected || null}
            targetTeam={team}
            targetTitle={selectedNeedsMove ? "选择宝可梦后再选择技能" : "点击宝可梦后立即使用"}
            selectedTarget={target}
            busyIndex={usingItem ? target : null}
            descriptionVisible={revealItemDetails}
            detailDisabled={disabled || usingItem || !selected || selected.count <= 0}
            detailUseLabel={selectedNeedsMove ? "选择目标" : "使用"}
            lockedReason={selectedNeedsMove ? "使用后选择要恢复 PP 的技能" : undefined}
            selectedMoveSlot={null}
            onUseDetail={() => setStep("pokemonPicker")}
            onBackToDetail={() => setStep("detail")}
            onSelectTarget={slot => void submitSelectedItem(slot)}
            onSelectStat={() => undefined}
            onSelectMoveSlot={() => undefined}
            onConfirmMoveReplace={() => undefined}
            onCancelMoveReplace={() => setStep("pokemonPicker")}
          />
        </section>
      </section>
        {ppPicker ? (
          <div className="battle-pp-picker-layer">
            <section className="battle-pp-picker-modal">
              <header>
                <div>
                  <h3>选择恢复的技能</h3>
                  <p>{ppPickerDisplay ? displayName(ppPickerDisplay) : "目标宝可梦"} / {ppPicker.item.name_zh || ppPicker.item.name}</p>
                </div>
                <button disabled={usingItem} onClick={() => setPpPicker(null)}>关闭</button>
              </header>
              <div className="battle-pp-picker-grid">
                {ppPickerMoveOptions.map(move => {
                  const ppKnown = typeof move.pp === "number" && typeof move.maxpp === "number";
                  const isFull = ppKnown && move.pp! >= move.maxpp!;
                  return (
                    <button className="battle-pp-skill-card" disabled={disabled || usingItem || isFull} onClick={() => submitPpMove(move)} key={move.key}>
                      <strong>{move.name}</strong>
                      <span>{move.typeLabel || "技能"}</span>
                      <small>{ppKnown ? `PP ${move.pp}/${move.maxpp}` : `PP --/${move.maxpp ?? "?"}`}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}
      {toast ? <ScreenToast key={toast.id} message={toast.message} tone={toast.tone} durationMs={1200} onDone={() => setToast(null)} /> : null}
    </div></BattleBagPanel>
  );
}

function StatusModal({battle, onBack}: {battle: BattleState; onBack: () => void}) {
  const [tab, setTab] = useState<"status" | "turns">("status");
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const turns = battle.turn_records || [];
  const selectedTurn = turns.find(turn => turn.id === selectedTurnId) || turns.at(-1) || null;
  return (
    <div className="modal-layer">
      <section className="status-modal">
        <header>
          <h2>对局状态</h2>
          <div className="status-modal-tabs">
            <button className={tab === "status" ? "selected" : ""} onClick={() => setTab("status")}>状态</button>
            <button className={tab === "turns" ? "selected" : ""} onClick={() => setTab("turns")}>回合</button>
          </div>
          <button onClick={onBack}>关闭</button>
        </header>
        {tab === "status" ? (
          <>
            <div className="status-grid"><p>回合：{battle.tracker.turn}</p><p>天气：{battle.tracker.weather || "无"}</p><p>全场：{battle.tracker.field.join(" / ") || "无"}</p><p>我方场地：{battle.tracker.side_conditions.p1.join(" / ") || "无"}</p><p>对手场地：{battle.tracker.side_conditions.p2.join(" / ") || "无"}</p><p>我方能力：{boostSummary(battle.tracker.boosts.p1)}</p><p>对手能力：{boostSummary(battle.tracker.boosts.p2)}</p></div>
            <h3>最近战报</h3>
            <div className="status-events">{lastEvents(battle, 14).map((event, index) => <small key={index}>{event}</small>)}</div>
          </>
        ) : (
          <BattleTurnRecordPanel turns={turns} selectedTurn={selectedTurn} onSelectTurn={turn => setSelectedTurnId(turn.id)} />
        )}
      </section>
    </div>
  );
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

function timelineDuration(event: BattleTimelineEvent, previousCondition?: string, speed: BattleAnimationSpeed = DEFAULT_BATTLE_ANIMATION_SPEED): number {
  if (event.type === "damage" || event.type === "heal") {
    const previous = parseHp(previousCondition);
    const next = event.hp || parseHp(event.condition);
    const ratio = previous && next && previous.max > 0 ? Math.abs(previous.current - next.current) / previous.max : 0.25;
    return battleAnimationDuration(Math.round(Math.max(900, Math.min(3200, 900 + ratio * 2600))), speed);
  }
  if (event.type === "move") return battleAnimationDuration(2600, speed);
  if (event.type === "faint") return battleAnimationDuration(2600, speed);
  if (event.type === "switch") return battleAnimationDuration(2300, speed);
  if (event.type === "win") return battleAnimationDuration(2600, speed);
  return battleAnimationDuration(2100, speed);
}

function battleAnimationDuration(ms: number, speed: BattleAnimationSpeed = DEFAULT_BATTLE_ANIMATION_SPEED): number {
  return scaleBattleDuration(Math.max(450, ms - BATTLE_ANIMATION_SPEEDUP_MS), speed, 260);
}

function scaleBattleDuration(ms: number, speed: BattleAnimationSpeed = DEFAULT_BATTLE_ANIMATION_SPEED, minMs = 160): number {
  const safeMs = Math.max(0, Math.round(ms));
  const multiplier = speed === 2 ? 2 : 1;
  return Math.max(minMs, Math.round(safeMs / multiplier));
}

function scaleBattleVisualCue(cue: BattleVisualCue, speed: BattleAnimationSpeed): BattleVisualCue {
  return {...cue, durationMs: scaleBattleDuration(cue.durationMs, speed, 260)};
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
