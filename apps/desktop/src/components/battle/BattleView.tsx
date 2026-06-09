import {Fragment, useEffect, useMemo, useRef, useState} from "react";
import type {CSSProperties} from "react";
import type {AppStatus, BagCategoryView, BagItemView, BattleBackgroundView, BattleMoveRequest, BattleState, BattleTimelineEvent, DesktopGameState, MoveSummary, RentalPokemon, RuntimePokemon} from "@changebattle/shared";
import {BATTLE_SYSTEM_OPTIONS} from "@changebattle/shared";
import {ItemIcon, PokemonSprite, STAT_ROWS, SUBSTITUTE_DOLL_PATH, abilityDescription, activePokemon, assetUrl, battleDialogueKey, battleEffectEntry, boostEffectKeys, bossDialogueGroups, bossDialogueVariant, bpCostLabel, coinCostLabel, conditionText, cueFromEntry, displayForRuntime, displayName, displayFromActive, enemyPartySlots, eventTargetsDisplayedActive, fieldEffectKeys, findDisplay, findDisplayByShowdownId, firstBattleEffectEntry, hpTone, itemCategoryLabel, moveCategoryId, moveCueTargetSide, moveDescription, moveEffectKeys, moveSummaryByName, moveSummaryFor, parseHp, playPokemonCry, playerPartySlots, runtimeName, statLine, statusCode, statusEffectKeys, statusLabel, timelineFaintedState, toId, trainerDialogueLines, trainerDialogueTitle, trainerDisplayName, trainerImageUrl, typeId, weatherEffectKeys} from "../../lib/ui";
import type {BattleEffectEntry, BattleVisualCue, PartyStatusSlot, TrainerDialogueMoment, TrainerDialogueState} from "../../lib/ui";
import {ScreenToast} from "../feedback/ScreenToast";
import {MoveCard} from "../move/MoveCard";
import {buildBattleDisplaySteps, eventCanMutateDisplayedActive} from "./timelineFlow";
import battleBackgroundCsv from "../../../../../assets/battle-backgrounds/backgrounds.csv?raw";

const BATTLE_BACKGROUNDS = parseBattleBackgroundCsv(battleBackgroundCsv);
const FALLBACK_BATTLE_BACKGROUND = BATTLE_BACKGROUNDS.find(background => background.id === "mountain-route") || BATTLE_BACKGROUNDS[0];
const BATTLE_PANEL_MODES = new Set<AppStatus>(["battleMain", "moveMenu", "teamMenu", "statusMenu"]);
const IMPLEMENTED_BATTLE_SYSTEMS = new Set(["zmove"]);

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
  const active = request.active?.[0] as ({moves?: BattleMoveRequest[]; trapped?: boolean} | undefined);
  const moves = active?.moves || [];
  if (moves.length !== 1) return false;
  const move = moves[0];
  return Boolean(active?.trapped) || (move.pp === undefined && move.maxpp === undefined && !move.disabled);
}

function visualCueForEvent(event: BattleTimelineEvent, battle: BattleState, displayedNames: {p1: string; p2: string}, displayedShowdownIds?: {p1: string; p2: string}): BattleVisualCue | null {
  if (event.type === "move") {
    const actingSide = event.side || "p1";
    const team = actingSide === (battle.player_side || "p1") ? battle.player_display : battle.enemy_display;
    const pokemon = findDisplayByShowdownId(team, event.source_showdown_id || displayedShowdownIds?.[actingSide]) || findDisplay(team, event.source_id || displayedNames[actingSide]);
    const summary = moveSummaryByName(pokemon, event.move);
    const moveId = summary?.id ? toId(summary.id) : toId(event.move);
    const entry = firstBattleEffectEntry(moveEffectKeys(moveId, typeId(summary?.type || summary?.type_zh), moveCategoryId(summary?.category, summary?.category_zh)));
    return cueFromEntry(entry, event, entry?.visual || "normal-hit", actingSide, moveCueTargetSide(entry, actingSide, event.targetSide));
  }
  if (event.type === "item" && (event.effect === "Z招式" || /Z 力量|Z-Power|Z-Move/i.test(event.text))) {
    const side = event.side || event.targetSide || "p1";
    return {visual: "z-aura", renderer: "css", side, targetSide: side, anchor: "target", durationMs: 1500};
  }
  if ((event.type === "damage" || event.type === "heal") && !eventTargetsDisplayedActive(event, displayedNames, displayedShowdownIds)) return null;
  if (event.type === "damage") return cueFromEntry(battleEffectEntry("battle_action:damage"), event, "impact");
  if (event.type === "heal") return cueFromEntry(battleEffectEntry("battle_action:heal"), event, "heal");
  if (event.type === "faint") return cueFromEntry(battleEffectEntry("battle_action:faint"), event, "faint");
  if (event.type === "miss") return cueFromEntry(battleEffectEntry("battle_action:miss"), event, "miss");
  if (event.type === "crit") return cueFromEntry(battleEffectEntry("battle_action:crit"), event, "crit");
  if (event.type === "effectiveness") return cueFromEntry(battleEffectEntry("battle_action:effectiveness"), event, "effectiveness");
  if (event.type === "switch") return cueFromEntry(battleEffectEntry("battle_action:switch_in"), event, "switch-in", event.side || event.targetSide, event.targetSide || event.side);
  if (event.type === "form") return cueFromEntry(battleEffectEntry("battle_action:form"), event, "ability", event.side, event.targetSide || event.side);
  if (event.type === "substitute") {
    const entry = firstBattleEffectEntry(statusEffectKeys("substitute", "volatile"));
    return cueFromEntry(entry, event, entry?.visual || "substitute", event.side, event.targetSide);
  }
  if (event.type === "boost") {
    const entry = firstBattleEffectEntry(boostEffectKeys(event));
    return cueFromEntry(entry, event, entry?.visual || "boost");
  }
  if (event.type === "item") return cueFromEntry(battleEffectEntry("battle_action:item"), event, "item");
  if (event.type === "ability") return cueFromEntry(battleEffectEntry("battle_action:ability"), event, "ability");
  if (event.type === "status") {
    const entry = firstBattleEffectEntry(statusEffectKeys(event.effect));
    return cueFromEntry(entry, event, entry?.visual || "status");
  }
  if (event.type === "weather") {
    const entry = firstBattleEffectEntry(weatherEffectKeys(event));
    return cueFromEntry(entry, event, entry?.visual || "field");
  }
  if (event.type === "field") {
    const entry = firstBattleEffectEntry(fieldEffectKeys(event));
    return cueFromEntry(entry, event, entry?.visual || "field");
  }
  return null;
}

function zImpactCueForEvent(event: BattleTimelineEvent, sourceSide: "p1" | "p2", durationMs: number): BattleVisualCue {
  return {
    visual: "z-impact",
    renderer: "css",
    side: sourceSide,
    targetSide: event.targetSide || (sourceSide === "p1" ? "p2" : "p1"),
    anchor: "target",
    durationMs: Math.max(1400, durationMs + 160),
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
  const raw = event.move || event.text.match(/使用\s+(.+?)(?:。|！|!|$)/)?.[1] || event.text;
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

export function BattleView({battle, battleBag, mode, onChoice, onAutoAdvance, choicePending, pendingTransition, onBattleAnimationDone}: {battle: BattleState | null; battleBag: BagCategoryView | null; mode: AppStatus; setMode: (mode: AppStatus) => void; onChoice: (choice: string) => Promise<boolean> | boolean | void; onAutoAdvance?: () => Promise<boolean> | boolean | void; choicePending?: boolean; pendingTransition: DesktopGameState | null; onBattleAnimationDone: (state: DesktopGameState) => void}) {
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
  const finalActiveShowdownIds = {
    p1: battle?.tracker.active.p1.showdown_id || player.runtime?.pokeball || "",
    p2: battle?.tracker.active.p2.showdown_id || "",
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
  const [displayedActiveShowdownIds, setDisplayedActiveShowdownIds] = useState(finalActiveShowdownIds);
  const [displayedSubstitutes, setDisplayedSubstitutes] = useState(finalSubstitutes);
  const [hpTransitionMs, setHpTransitionMs] = useState({p1: 1400, p2: 1400});
  const [faintedSides, setFaintedSides] = useState({p1: false, p2: false});
  const [introActive, setIntroActive] = useState(false);
  const [trainerIntroActive, setTrainerIntroActive] = useState(false);
  const [dialogue, setDialogue] = useState<TrainerDialogueState | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [itemTargetIndex, setItemTargetIndex] = useState(0);
  const [battleItemOpen, setBattleItemOpen] = useState(false);
  const [battleItemToast, setBattleItemToast] = useState<{id: number; message: string} | null>(null);
  const [panelMode, setPanelMode] = useState<AppStatus>(BATTLE_PANEL_MODES.has(mode) ? mode : "battleMain");
  const [autoAdvancePending, setAutoAdvancePending] = useState(false);
  const previousTimelineKeys = useRef<string[]>([]);
  const previousRecentEvents = useRef<string[]>([]);
  const displayConditionsRef = useRef(displayConditions);
  const displayedActiveNamesRef = useRef(displayedActiveNames);
  const displayedActiveShowdownIdsRef = useRef(displayedActiveShowdownIds);
  const displayedSubstitutesRef = useRef(displayedSubstitutes);
  const previousBattlePresent = useRef(false);
  const introDialoguePending = useRef(false);
  const bossDialogueSelection = useRef<{key: string; index: number} | null>(null);
  const pokemonIntroTimer = useRef<number | null>(null);
  const eventTimers = useRef<number[]>([]);
  const battleLogRef = useRef<HTMLDivElement | null>(null);
  const playbackRun = useRef(0);
  const finishRequested = useRef(false);
  const autoAdvanceInFlight = useRef(false);
  const lastAutoAdvanceKey = useRef("");
  const lastCryKeys = useRef({p1: "", p2: ""});
  const lastCryScopeKey = useRef("");

  function selectPanelMode(nextMode: AppStatus) {
    setPanelMode(BATTLE_PANEL_MODES.has(nextMode) ? nextMode : "battleMain");
  }

  async function triggerAutoAdvance(key: string) {
    if (!onAutoAdvance || autoAdvanceInFlight.current || lastAutoAdvanceKey.current === key) return;
    autoAdvanceInFlight.current = true;
    lastAutoAdvanceKey.current = key;
    setAutoAdvancePending(true);
    setDetailIndex(null);
    setBattleItemOpen(false);
    selectPanelMode("battleMain");
    try {
      await onAutoAdvance();
    } finally {
      autoAdvanceInFlight.current = false;
      setAutoAdvancePending(false);
    }
  }

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
      const dialogueBattle = battle;
      const enemy = dialogueBattle?.enemy_trainer;
      introDialoguePending.current = true;
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
    if (mode !== "battleMain" && BATTLE_PANEL_MODES.has(mode)) setPanelMode(mode);
  }, [mode]);

  useEffect(() => {
    if (!battle?.request?.wait && !isForcedContinuationRequest(battle?.request || null)) lastAutoAdvanceKey.current = "";
  }, [Boolean(battle?.request?.wait), battle?.request?.active?.[0]?.moves?.length, battle?.tracker.turn]);

  useEffect(() => {
    const hasMoves = Boolean(battle?.request?.active?.[0]?.moves?.length);
    if (battle?.request?.forceSwitch || (panelMode === "moveMenu" && !hasMoves)) setPanelMode("battleMain");
  }, [battle?.request?.forceSwitch, battle?.request?.active?.[0]?.moves?.length, panelMode]);

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
    setDetailIndex(null);
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
      } else if ((battle.request?.wait || isForcedContinuationRequest(battle.request)) && !pendingTransition) {
        void triggerAutoAdvance(`idle:${timelineKey}:${recentKey}:${battle.tracker.turn}`);
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
      let pendingZMoveSide: "p1" | "p2" | null = null;
      let pendingZImpactSourceSide: "p1" | "p2" | null = null;
      const skipZVisualIds = new Set<string>();
      for (const step of buildBattleDisplaySteps(added)) {
        if (playbackRun.current !== runId) return;
        if (step.kind === "pause") {
          await wait(step.durationMs);
          continue;
        }
        const event = step.event;
        const duration = timelineDuration(event, displayConditionsRef.current[event.targetSide || "p1"]);
        const targetIsDisplayedActive = eventCanMutateDisplayedActive(event, displayedActiveNamesRef.current, displayedActiveShowdownIdsRef.current);
        if (step.kind === "message") {
          if (isZPowerEvent(event)) {
            const side = event.side || event.targetSide || "p1";
            const actorName = zActorName(event, displayedActiveNamesRef.current);
            pendingZMoveSide = side;
            skipZVisualIds.add(event.id);
            setCurrentVisualCue(targetIsDisplayedActive ? visualCueForEvent(event, activeBattle, displayedActiveNamesRef.current, displayedActiveShowdownIdsRef.current) : null);
            const powerEvent = {...event, id: `${event.id}:zpower`, text: `${actorName}让Z力量笼罩了全身`, effect: "z-move-call"} as BattleTimelineEvent;
            setCurrentTimelineEvent(powerEvent);
            setShownEvents(events => [...events, powerEvent.text].slice(-14));
            await wait(860);
            if (playbackRun.current !== runId) return;
            const releaseEvent = {...event, id: `${event.id}:zrelease`, text: `${actorName}开始释放Z招式`, effect: "z-move-call"} as BattleTimelineEvent;
            setCurrentTimelineEvent(releaseEvent);
            setShownEvents(events => [...events, releaseEvent.text].slice(-14));
            await wait(720);
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
            await wait(1180);
            continue;
          }
          if (event.type === "move" && pendingZImpactSourceSide && (event.side || "p1") !== pendingZImpactSourceSide) {
            pendingZImpactSourceSide = null;
          }
          setCurrentTimelineEvent(event);
          setShownEvents(events => [...events, event.text].slice(-14));
          await wait(Math.max(780, Math.min(2200, duration)));
          continue;
        }
        if (step.kind === "visual") {
          if (skipZVisualIds.has(event.id)) continue;
          const zImpactActive = event.type === "damage" && pendingZImpactSourceSide && event.targetSide && event.targetSide !== pendingZImpactSourceSide;
          const cue = zImpactActive
            ? zImpactCueForEvent(event, pendingZImpactSourceSide!, duration)
            : visualCueForEvent(event, activeBattle, displayedActiveNamesRef.current, displayedActiveShowdownIdsRef.current);
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
            await wait(180);
          }
          continue;
        }
        if (step.kind === "state") {
          if (event.type === "switch" && event.targetSide && event.target_id) {
            const oldName = displayedActiveNamesRef.current[event.targetSide];
            if (oldName && oldName !== event.target_id) {
              setCurrentVisualCue(cueFromEntry(battleEffectEntry("battle_action:switch_out"), event, "switch-out", event.targetSide, event.targetSide));
              await wait(520);
              setCurrentVisualCue(null);
            }
            const nextNames = {...displayedActiveNamesRef.current, [event.targetSide]: event.target_id};
            displayedActiveNamesRef.current = nextNames;
            setDisplayedActiveNames(nextNames);
            const nextShowdownIds = {...displayedActiveShowdownIdsRef.current, [event.targetSide]: event.target_showdown_id || ""};
            displayedActiveShowdownIdsRef.current = nextShowdownIds;
            setDisplayedActiveShowdownIds(nextShowdownIds);
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
          }
          await wait(180);
        }
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
      displayedActiveShowdownIdsRef.current = finalActiveShowdownIds;
      displayedSubstitutesRef.current = finalSubstitutes;
      setDisplayConditions(finalConditions);
      setDisplayedActiveNames(finalActiveNames);
      setDisplayedActiveShowdownIds(finalActiveShowdownIds);
      setDisplayedSubstitutes(finalSubstitutes);
      setFaintedSides(timelineFaintedState(timelineEvents, finalFaintedSides));
      if (activeBattle.ended && pendingTransition && !finishRequested.current) {
        beginBattleOutro(activeBattle, pendingTransition);
      } else if ((activeBattle.request?.wait || isForcedContinuationRequest(activeBattle.request)) && !pendingTransition) {
        void triggerAutoAdvance(`play:${timelineKey}:${recentKey}:${activeBattle.tracker.turn}`);
      }
    }

    void playQueue();
    return () => {
      eventTimers.current.forEach(timer => window.clearTimeout(timer));
      eventTimers.current = [];
    };
  }, [timelineKey, recentKey, dialogue?.kind]);

  const displayPlayer = battle ? findDisplayByShowdownId(battle.player_display, displayedActiveShowdownIds.p1) || findDisplay(battle.player_display, displayedActiveNames.p1) || player.display : player.display;
  const displayEnemy = battle ? findDisplayByShowdownId(battle.enemy_display, displayedActiveShowdownIds.p2) || findDisplay(battle.enemy_display, displayedActiveNames.p2) || enemy.display : enemy.display;
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
    if (dialogue || trainerIntroActive) return;
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
  const hasQueuedPlayback = timelineEvents.some((event, index) => !previousTimelineKeys.current.includes(`${event.id}:${event.text}`)) || addedRecentEventTexts(previousRecentEvents.current, recentEvents).length > 0;
  const requestWaiting = Boolean(battle.request?.wait) || isForcedContinuationRequest(battle.request);
  const controlsDisabled = Boolean(choicePending) || autoAdvancePending || requestWaiting || playbackActive || hasQueuedPlayback || introActive || trainerIntroActive || Boolean(dialogue);
  const playerSprite = displayedSubstitutes.p1 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const enemySprite = displayedSubstitutes.p2 ? assetUrl(SUBSTITUTE_DOLL_PATH) : undefined;
  const activePlayerIndex = Math.max(0, battle.request?.side?.pokemon?.findIndex(pokemon => pokemon.active) ?? 0);
  const playerParty = playerPartySlots(battle, activePlayerIndex, displayConditions.p1, battle.tracker.active.p1.status || "", setDetailIndex);
  const enemyParty = enemyPartySlots(battle, displayedActiveNames.p2 || battle.tracker.active.p2.species_id || battle.tracker.active.p2.name || "", displayConditions.p2, battle.tracker.active.p2.status || "");
  const messageDuration = currentTimelineEvent ? timelineDuration(currentTimelineEvent, displayConditions[currentTimelineEvent.targetSide || "p1"]) : 1600;
  const messageMs = currentTimelineEvent?.notice_title ? Math.max(2200, messageDuration) : Math.max(900, messageDuration);
  const detailOpen = detailIndex !== null || panelMode === "teamMenu";
  const detailInitialIndex = detailIndex ?? activePlayerIndex;
  const trainerOverlayBattle = dialogue ? {...battle, player_trainer: dialogue.playerTrainer || battle.player_trainer, enemy_trainer: dialogue.trainer || battle.enemy_trainer, enemy_boss_record: dialogue.bossRecord || battle.enemy_boss_record} : battle;
  const battleBackground = battleBackgroundFor(battle);
  const battleBackgroundUrl = assetUrl(battleBackground?.src);
  const battleFieldStyle = battleBackgroundUrl ? {"--battle-background-image": `url("${battleBackgroundUrl}")`} as CSSProperties : undefined;
  return (
    <div className={`battle-layout ${dialogue ? "battle-dialogue-active" : ""}`} onClick={dialogue ? advanceBattleDialogue : undefined}>
      {!dialogue ? <BattlePartyBoard battle={battle} playerSlots={playerParty} enemySlots={enemyParty} onOpenStatus={() => selectPanelMode("statusMenu")} /> : null}
      <section className={`battle-field ${battleBackgroundUrl ? "has-battle-background" : ""} ${trainerIntroActive ? "trainer-intro" : ""} ${introActive ? "battle-intro" : ""} ${battleAnimationClass(currentTimelineEvent)}`} style={battleFieldStyle}>
        <div className="battle-platforms" aria-hidden="true">
          <i className="battle-platform player-platform" />
          <i className="battle-platform enemy-platform" />
        </div>
        <FieldEffectsOverlay battle={battle} />
        <BattleEffectLayer cue={currentVisualCue} />
        {trainerIntroActive ? <TrainerIntroOverlay battle={trainerOverlayBattle} /> : null}
        <div className="turn-badge">第 {battle.tracker.turn} 回合</div>
        <FighterPanel side="enemy" pokemon={displayEnemy} condition={displayConditions.p2} status={battle.tracker.active.p2.status} substitute={displayedSubstitutes.p2} transitionMs={hpTransitionMs.p2} />
        <div className="battle-sprites">
          <PokemonSprite className={`back-sprite ${displayedSubstitutes.p1 ? "substitute-sprite" : ""} ${faintedSides.p1 ? "sprite-fainted" : ""}`} pokemon={displayedSubstitutes.p1 ? undefined : displayPlayer} src={playerSprite} variant="back_normal" alt={displayPlayer ? displayName(displayPlayer) : "我方宝可梦"} entrance={!displayedSubstitutes.p1 && introActive} onClick={() => setDetailIndex(activePlayerIndex)} />
          <PokemonSprite className={`front-sprite ${displayedSubstitutes.p2 ? "substitute-sprite" : ""} ${faintedSides.p2 ? "sprite-fainted" : ""}`} pokemon={displayedSubstitutes.p2 ? undefined : displayEnemy} src={enemySprite} alt={displayEnemy ? displayName(displayEnemy) : "对手宝可梦"} entrance={!displayedSubstitutes.p2 && introActive} />
        </div>
        <FighterPanel side="player" pokemon={displayPlayer} condition={displayConditions.p1} status={battle.tracker.active.p1.status} substitute={displayedSubstitutes.p1} transitionMs={hpTransitionMs.p1} onClick={() => setDetailIndex(activePlayerIndex)} />
        {currentTimelineEvent ? <div key={currentTimelineEvent.id} className={`battle-message-pop ${currentTimelineEvent.notice_title ? "structured" : ""} ${currentTimelineEvent.effect === "z-move-call" ? "z-move-call" : ""} ${currentTimelineEvent.effect === "z-move-name" ? "z-move-name" : ""}`} style={{"--message-duration": `${messageMs}ms`} as CSSProperties}>{currentTimelineEvent.notice_title ? <><strong>{currentTimelineEvent.notice_title}</strong>{currentTimelineEvent.notice_detail ? <small>{currentTimelineEvent.notice_detail}</small> : null}</> : currentTimelineEvent.effect === "z-move-name" ? <ZMoveNameCutIn event={currentTimelineEvent} /> : currentTimelineEvent.text}</div> : null}
      </section>
      <section className={`battle-bottom ${dialogue ? "dialogue-bottom-active" : ""} ${panelMode === "moveMenu" && !dialogue ? "move-bottom-active" : ""}`}>
        {dialogue ? (
          <BattleDialogueBox dialogue={dialogue} />
        ) : (
          <>
            <div className="battle-log" ref={battleLogRef}><strong>上一回合</strong>{shownEvents.map((event, index) => <p className={event === currentTimelineEvent?.text ? "current-event" : ""} key={`${event}-${index}`}>{event}</p>)}</div>
            <div className={`battle-action-panel ${panelMode === "moveMenu" ? "move-action-panel" : ""} ${controlsDisabled ? "battle-controls-disabled" : ""}`}>{panelMode === "moveMenu" && !requestWaiting ? <MoveMenu battle={battle} disabled={controlsDisabled} onMove={(index, zMove) => onChoice(`move ${index}${zMove ? " zmove" : ""}`)} onBack={() => selectPanelMode("battleMain")} /> : <MainBattleCommands forceSwitch={Boolean(battle.request?.forceSwitch)} waiting={requestWaiting || autoAdvancePending} disabled={controlsDisabled} setMode={selectPanelMode} onBag={() => { setItemTargetIndex(activePlayerIndex); setBattleItemOpen(true); }} onForfeit={() => onChoice("forfeit")} />}</div>
          </>
        )}
      </section>
      {panelMode === "statusMenu" && !dialogue ? <StatusModal battle={battle} onBack={() => selectPanelMode("battleMain")} /> : null}
      {detailOpen && !dialogue ? <PokemonDetailModal battle={battle} initialIndex={detailInitialIndex} disabled={controlsDisabled} onSwitch={index => onChoice(`switch ${index}`)} onClose={() => { setDetailIndex(null); if (panelMode === "teamMenu") selectPanelMode("battleMain"); }} /> : null}
      {battleItemOpen && !dialogue ? <BattleItemModal battle={battle} bag={battleBag} initialTarget={itemTargetIndex} disabled={controlsDisabled} onClose={() => setBattleItemOpen(false)} onUse={async (itemId, target, moveSlot, notice) => {
        const ok = await onChoice(`item ${itemId} ${target + 1}${moveSlot ? ` ${moveSlot}` : ""}`);
        if (ok) {
          setBattleItemOpen(false);
          if (notice) setBattleItemToast({id: Date.now(), message: notice});
        }
        return Boolean(ok);
      }} /> : null}
      {battleItemToast ? <ScreenToast key={battleItemToast.id} message={battleItemToast.message} durationMs={1200} onDone={() => setBattleItemToast(null)} /> : null}
    </div>
  );
}

function BattlePartyBoard({battle, playerSlots, enemySlots, onOpenStatus}: {battle: BattleState; playerSlots: PartyStatusSlot[]; enemySlots: PartyStatusSlot[]; onOpenStatus: () => void}) {
  const weather = battle.tracker.weather && battle.tracker.weather !== "无" ? battle.tracker.weather : "无";
  const field = battle.tracker.field.join(" / ") || "无";
  const enemyLeft = enemySlots.filter(slot => !statusCode(slot.condition, slot.status).includes("fnt")).length;
  return (
    <div className="battle-party-board">
      <PartyStatusColumn side="player" title="我方" slots={playerSlots} />
      <button className="battle-center-status" onClick={onOpenStatus}>
        <strong>第 {battle.tracker.turn} 回合</strong>
        <span>天气 {weather}</span>
        <span>场地 {field}</span>
        <span>我方能力 {boostSummary(battle.tracker.boosts.p1)}</span>
        <span>对手能力 {boostSummary(battle.tracker.boosts.p2)}</span>
        <small>对手剩余 {enemyLeft}/3</small>
      </button>
      <PartyStatusColumn side="enemy" title="对手" slots={enemySlots} />
    </div>
  );
}

function PartyStatusColumn({side, title, slots}: {side: "player" | "enemy"; title: string; slots: PartyStatusSlot[]}) {
  return (
    <div className={`party-status-column ${side}`}>
      <strong>{title}</strong>
      <div className="party-status-slots">
        {slots.map(slot => <PartyStatusChip slot={slot} side={side} key={slot.key} />)}
      </div>
    </div>
  );
}

function PartyStatusChip({slot, side}: {slot: PartyStatusSlot; side: "player" | "enemy"}) {
  const hp = parseHp(slot.condition);
  const code = statusCode(slot.condition, slot.status);
  const tone = hpTone(hp);
  const revealed = side === "player" || slot.revealed;
  const body = (
    <>
      <span className="party-chip-label">{slot.active ? "▶" : slot.label}</span>
      <span className={`party-chip-sprite ${revealed ? "" : "unknown"}`}>
        {revealed && slot.display ? <PokemonSprite pokemon={slot.display} alt={displayName(slot.display)} badge={false} /> : <i>?</i>}
      </span>
      <span className="party-chip-info">
        <b>{revealed && slot.display ? displayName(slot.display) : "未登场"}</b>
        <small>{hp?.text || (revealed ? conditionText(slot.condition) : "未知")}</small>
        <span className="party-chip-hp"><i className={`hp-${tone}`} style={{width: `${hp ? Math.max(0, (hp.current / hp.max) * 100) : revealed ? 0 : 100}%`} as CSSProperties} /></span>
      </span>
      {code ? <i className={`status-badge ${code}`}>{statusLabel(code)}</i> : null}
    </>
  );
  return slot.onClick ? <button className={`party-status-chip ${slot.active ? "active" : ""}`} onClick={slot.onClick}>{body}</button> : <div className={`party-status-chip ${slot.active ? "active" : ""}`}>{body}</div>;
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

function MainBattleCommands({forceSwitch, waiting, disabled, setMode, onBag, onForfeit}: {forceSwitch: boolean; waiting?: boolean; disabled?: boolean; setMode: (mode: AppStatus) => void; onBag: () => void; onForfeit: () => void}) {
  if (waiting) return <div className="command-grid battle-command-grid"><button disabled>战斗继续中</button><button disabled>宝可梦</button><button disabled>背包</button><button className="danger-button" disabled={disabled} onClick={onForfeit}>认输</button></div>;
  return <div className="command-grid battle-command-grid">{forceSwitch ? <button disabled={disabled} onClick={() => setMode("teamMenu")}>换人</button> : <button disabled={disabled} onClick={() => setMode("moveMenu")}>战斗</button>}<button disabled={disabled} onClick={() => setMode("teamMenu")}>宝可梦</button><button disabled={disabled || forceSwitch} onClick={onBag}>背包</button><button className="danger-button" disabled={disabled} onClick={onForfeit}>认输</button></div>;
}

function MoveMenu({battle, disabled, onMove, onBack}: {battle: BattleState; disabled?: boolean; onMove: (index: number, zMove?: boolean) => void; onBack: () => void}) {
  const activeRequest = battle.request?.active?.[0];
  const moves = activeRequest?.moves || [];
  const active = activePokemon(battle, "p1").display;
  const target = activePokemon(battle, "p2").display;
  const enabledSystems = battle.battle_setting?.enabled_battle_systems || [];
  const visibleSystems = BATTLE_SYSTEM_OPTIONS.filter(option => enabledSystems.includes(option.id));
  const canZMove = activeRequest?.canZMove || [];
  const zAvailable = enabledSystems.includes("zmove") && canZMove.some(Boolean);
  const [zMode, setZMode] = useState(false);
  useEffect(() => {
    if (!zAvailable && zMode) setZMode(false);
  }, [zAvailable, zMode]);
  return <div className="move-menu">{moves.map((move, index) => {
    const summary = moveSummaryFor(active, move);
    const zMove = canZMove[index];
    const multiplier = moveEffectiveness(summary, target);
    const showEffect = Boolean(battle.show_move_effectiveness);
    const superEffective = Boolean(showEffect && multiplier > 1);
    const damageRange = moveDamageRangeLabel(summary, active, target, battle);
    const zMoveDisabled = zMode && !zMove;
    return (
      <MoveCard
        size="battle"
        className={superEffective ? "move-super-effective" : ""}
        name={zMode && zMove ? zMoveDisplayLabel(zMove.move, active) : summary?.name_zh || move.move}
        moveType={summary?.type || summary?.type_zh}
        typeLabel={moveTypeLabel(summary)}
        badge={showEffect ? effectivenessLabel(multiplier) : null}
        damageRange={damageRange}
        pp={move.pp}
        maxPp={move.maxpp}
        power={summary?.power || "--"}
        disabled={disabled || move.disabled || zMoveDisabled}
        onClick={() => onMove(index + 1, zMode)}
        key={move.id || index}
      />
    );
  })}<div className="move-footer"><button className="menu-back" disabled={disabled} onClick={onBack}>返回</button>{visibleSystems.length ? <div className="battle-system-row">{visibleSystems.map(system => system.id === "zmove"
    ? <button className={zMode ? "selected" : ""} disabled={disabled || !zAvailable} title={zAvailable ? "选择一个技能释放 Z 招式" : "当前没有可用的 Z 招式"} onClick={() => setZMode(value => !value)} key={system.id}>{zMode ? "取消 Z" : system.name}</button>
    : <button disabled title={`${system.name} 未接入`} key={system.id}>{IMPLEMENTED_BATTLE_SYSTEMS.has(system.id) ? system.name : `${system.name} 未接入`}</button>)}</div> : null}</div></div>;
}

function TeamMenu({battle, disabled, onSwitch, onBack}: {battle: BattleState; disabled?: boolean; onSwitch: (index: number) => void; onBack: () => void}) {
  const rows = battle.request?.side?.pokemon || [];
  const [focus, setFocus] = useState(0);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  return <div className="team-menu"><div className="team-list">{rows.map((runtime, index) => { const display = displayForRuntime(battle.player_display, runtime, index); const status = statusCode(runtime.condition); return <div className={`team-row ${focus === index ? "selected" : ""}`} key={runtime.ident}><button className="team-summary" disabled={disabled} onClick={() => { setFocus(index); setDetailIndex(index); }}><span>{runtime.active ? "▶" : `${index + 1}.`}</span><strong>{display ? displayName(display) : runtimeName(runtime)}</strong>{status ? <i className={`status-badge ${status}`}>{statusLabel(status)}</i> : null}<small>{conditionText(runtime.condition)}　{runtime.item || ""}</small></button></div>; })}<button disabled={disabled} onClick={onBack}>返回</button></div>{detailIndex !== null ? <PokemonDetailModal battle={battle} initialIndex={detailIndex} disabled={disabled} onSwitch={onSwitch} onClose={() => setDetailIndex(null)} /> : null}</div>;
}

function PokemonDetailModal({battle, initialIndex, disabled, onSwitch, onClose}: {battle: BattleState; initialIndex: number; disabled?: boolean; onSwitch: (index: number) => void; onClose: () => void}) {
  const rows = battle.request?.side?.pokemon || [];
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, Math.min(initialIndex, Math.max(0, rows.length - 1))));
  const [tab, setTab] = useState<"basic" | "moves">("basic");
  const runtime = rows[selectedIndex] || rows[0];
  const pokemon = displayForRuntime(battle.player_display, runtime, selectedIndex) || battle.player_display[0];
  const status = statusCode(runtime?.condition);
  const canSwitch = Boolean(runtime) && !runtime.active && status !== "fnt";
  const activeMoves = runtime?.active ? battle.request?.active?.[0]?.moves || [] : [];
  const revealTraining = Boolean(battle.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const detailLockedText = "？？？";

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
            const display = displayForRuntime(battle.player_display, entry, index);
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
                  <p><b>特性说明：</b>{revealTraining ? abilityDescription(pokemon) : detailLockedText}</p>
                  <p><b>道具说明：</b>{revealTraining ? pokemon.item_desc_zh || pokemon.item_desc || "无道具" : detailLockedText}</p>
                </div>
              </div>
            ) : (
              <div className="detail-moves">
                {pokemon.moves.map(move => <div className="move-detail" key={move.id}><strong>{move.name_zh || move.name}</strong><span>{move.type_zh}/{move.category_zh}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span><span>{ppText(move)}</span><p>{revealTraining ? moveDescription(move) : detailLockedText}</p></div>)}
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

function BattleItemModal({battle, bag, initialTarget, disabled, onClose, onUse}: {battle: BattleState; bag: BagCategoryView | null; initialTarget: number; disabled?: boolean; onClose: () => void; onUse: (itemId: string, target: number, moveSlot?: number, notice?: string) => Promise<boolean> | boolean | void}) {
  const [target, setTarget] = useState(Math.max(0, initialTarget));
  const [itemId, setItemId] = useState("");
  const [ppPicker, setPpPicker] = useState<{item: BagItemView; target: number} | null>(null);
  const [usingItem, setUsingItem] = useState(false);
  const [toast, setToast] = useState<{id: number; message: string; tone?: "normal" | "danger"} | null>(null);
  const items = bag?.consumable || [];
  const selected = items.find(item => item.id === itemId) || items[0];
  const rows = battle.request?.side?.pokemon || [];
  const targetRuntime = rows[target] || rows[0];
  const targetDisplay = displayForRuntime(battle.player_display, targetRuntime, target) || battle.player_display[0];
  const activeMoves = targetRuntime?.active ? battle.request?.active?.[0]?.moves || [] : [];
  const revealItemDetails = Boolean(battle.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const ppMoveOptions = ppMoveOptionsFor(targetDisplay, activeMoves);
  const selectedNeedsMove = isSingleMovePpItem(selected);

  function showToast(message: string, tone: "normal" | "danger" = "normal") {
    setToast({id: Date.now(), message, tone});
  }

  async function submitSelectedItem() {
    if (!selected || usingItem) return;
    if (selectedNeedsMove) {
      if (!ppMoveOptions.length) {
        showToast("这个目标没有可选择的技能。", "danger");
        return;
      }
      setPpPicker({item: selected, target});
      return;
    }
    setUsingItem(true);
    try {
      const ok = await onUse(selected.id, target);
      if (ok === false) showToast("道具没有成功使用。", "danger");
    } finally {
      setUsingItem(false);
    }
  }

  async function submitPpMove(move: BattlePpMoveOption) {
    if (!ppPicker || usingItem) return;
    setUsingItem(true);
    try {
      const ok = await onUse(ppPicker.item.id, ppPicker.target, move.slot, `${move.name} 已恢复`);
      if (ok === false) showToast("道具没有成功使用。", "danger");
    } finally {
      setUsingItem(false);
    }
  }

  return (
    <div className="modal-layer">
      <section className="shop-modal bag-manage-modal bag-flat-modal battle-bag-modal">
        <header><div><h2>战斗背包</h2><p>战斗中只能使用消耗类道具。</p></div><button disabled={usingItem} onClick={onClose}>关闭</button></header>
        <div className="bag-manage-layout battle-bag-layout">
          <div className="bag-flat-grid battle-bag-item-grid">
            {items.length ? items.map(item => (
              <button className={`bag-flat-item battle-bag-item ${selected?.id === item.id ? "selected" : ""}`} disabled={usingItem} onClick={() => setItemId(item.id)} key={item.id}>
                <ItemIcon item={item} />
                <span>
                  <strong>{item.name_zh || item.name}</strong>
                  <small>{revealItemDetails ? item.desc_zh || item.desc || item.name : "？？？"}</small>
                </span>
                <b>x{item.count}</b>
              </button>
            )) : <p className="bag-empty">当前没有可在战斗中使用的消耗道具。</p>}
          </div>
          <section className="bag-action-panel battle-bag-action">
            {selected ? <>
              <h3>{selected.name_zh || selected.name}</h3>
              <p>{itemCategoryLabel(selected.category)}　x{selected.count}</p>
              <div className="battle-target-list">
                {rows.map((entry, index) => {
                  const display = displayForRuntime(battle.player_display, entry, index);
                  return (
                    <button className={target === index ? "selected" : ""} disabled={usingItem} onClick={() => setTarget(index)} key={`${entry.ident}-item-target`}>
                      <PokemonSprite pokemon={display} alt={display ? displayName(display) : runtimeName(entry)} />
                      <span>{display ? displayName(display) : runtimeName(entry)}</span>
                      <small>{conditionText(entry.condition)}</small>
                    </button>
                  );
                })}
              </div>
              <p className="battle-bag-target-summary">{targetDisplay ? `目标：${displayName(targetDisplay)}` : "选择目标宝可梦"}{selectedNeedsMove ? "　使用后选择技能" : ""}</p>
              <div className="command-row"><button disabled={disabled || usingItem} onClick={submitSelectedItem}>{usingItem ? "使用中..." : selectedNeedsMove ? "选择技能" : "使用道具"}</button></div>
            </> : <p>当前没有可在战斗中使用的消耗道具。</p>}
          </section>
        </div>
        {ppPicker ? (
          <div className="battle-pp-picker-layer">
            <section className="battle-pp-picker-modal">
              <header>
                <div>
                  <h3>选择恢复的技能</h3>
                  <p>{targetDisplay ? displayName(targetDisplay) : "目标宝可梦"} / {ppPicker.item.name_zh || ppPicker.item.name}</p>
                </div>
                <button disabled={usingItem} onClick={() => setPpPicker(null)}>关闭</button>
              </header>
              <div className="battle-pp-picker-grid">
                {ppMoveOptions.map(move => {
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
      </section>
      {toast ? <ScreenToast key={toast.id} message={toast.message} tone={toast.tone} durationMs={1200} onDone={() => setToast(null)} /> : null}
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
