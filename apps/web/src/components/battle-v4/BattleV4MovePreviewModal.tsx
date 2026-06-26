import {useEffect, useMemo, useState, type CSSProperties} from "react";
import type {BattleViewSlotV4, ChangeBattleV2Api, DexMoveDetail} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {useBattleV4PreviewPlayback, type BattleAnimationEventV4, type BattleProtocolSeatV4} from "./battleV4Playback";
import {getBattleV4ActiveTimelineVisuals, type BattleV4TimelineVisuals} from "./battleV4TimelineVisuals";
import type {ShowdownAnimationStepV4} from "./battleV4ShowdownAnimationAdapter";
import "./BattleV4Page.css";
import "./BattleV4MovePreviewModal.css";

export type BattleV4MovePreviewMode = "singles" | "doubles";
export type BattleV4EnvironmentPreviewEntry = {
  id: string;
  name: string;
  nameZh: string;
  group: "weather" | "terrain" | "room";
  groupLabel: string;
  protocolId: string;
  moveId?: string;
  sourceType: "move" | "ability" | "placeholder";
  sourceLabel: string;
  description: string;
  tags: string[];
};

export function BattleV4MovePreviewModal({move, environment, initialMode = "singles", onClose}: {
  api: ChangeBattleV2Api;
  move?: DexMoveDetail;
  environment?: BattleV4EnvironmentPreviewEntry;
  initialMode?: BattleV4MovePreviewMode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<BattleV4MovePreviewMode>(initialMode);
  const [replaySeed, setReplaySeed] = useState(0);
  const slots = useMemo(() => buildBattleV4MovePreviewSlots(mode), [mode]);
  const subject = useMemo(
    () => environment ? {kind: "environment" as const, environment} : {kind: "move" as const, move: move!},
    [environment, move],
  );
  const subjectId = subject.kind === "environment" ? subject.environment.id : subject.move.id;
  const subjectName = subject.kind === "environment" ? subject.environment.nameZh : subject.move.nameZh || subject.move.name;
  const rawLines = useMemo(() => subject.kind === "environment" ? buildBattleV4EnvironmentPreviewScript(subject.environment, mode) : buildBattleV4MovePreviewScript(subject.move, mode), [mode, subject]);
  const playback = useBattleV4PreviewPlayback(rawLines, slots, `${subject.kind}-${subjectId}-${mode}-${replaySeed}`);
  const message = localizePreviewMessage(playback.messagebar?.message || "", playback.activeAnimation, subject);
  const animationKindsLabel = playback.debug.animationKinds.join(",");
  const selectedAnimationKeysLabel = playback.debug.selectedAnimationKeys.join(",");

  useEffect(() => {
    console.info("[BattleV4][move-preview]", {
      subjectKind: subject.kind,
      subjectId,
      mode,
      rawLines,
      animationKinds: animationKindsLabel.split(",").filter(Boolean),
      selectedAnimationKeys: selectedAnimationKeysLabel.split(",").filter(Boolean),
      animationTimelines: playback.debug.animationEvents.map(event => event.animationTimeline),
    });
  }, [animationKindsLabel, mode, subject.kind, subjectId, rawLines, selectedAnimationKeysLabel, playback.debug.animationEvents]);

  function chooseMode(nextMode: BattleV4MovePreviewMode) {
    setMode(nextMode);
    setReplaySeed(seed => seed + 1);
  }

  return (
    <div className="battle-v4-preview-layer" role="dialog" aria-modal="true" aria-label="动画预览">
      <section className="battle-v4-preview-modal">
        <header className="battle-v4-preview-header">
          <div>
            <span>动画预览</span>
            <h3>{subjectName}</h3>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <div className="battle-v4-preview-toolbar">
          <div className="battle-v4-preview-segments" role="group" aria-label="预览模式">
            <button type="button" className={mode === "singles" ? "selected" : ""} onClick={() => chooseMode("singles")}>单打预览</button>
            <button type="button" className={mode === "doubles" ? "selected" : ""} onClick={() => chooseMode("doubles")}>双打预览</button>
          </div>
          <button type="button" disabled={playback.playing && !playback.done} onClick={() => setReplaySeed(seed => seed + 1)}>
            {playback.playing && !playback.done ? "播放中" : "重新播放"}
          </button>
        </div>
        <PreviewArena
          near={playback.nearTeam}
          far={playback.farTeam}
          message={message}
          animation={playback.activeAnimation}
          activeTimelineStep={playback.activeTimelineStep}
        />
        <footer className={`battle-v4-preview-meta move-type-${subject.kind === "move" ? typeIdFor(subject.move.typeId || subject.move.type) : "status"}`}>
          {subject.kind === "move" ? (
            <>
              <span>{subject.move.type}</span>
              <span>{subject.move.category}</span>
              <span>威力 {subject.move.power || "-"}</span>
              <span>命中 {subject.move.accuracy ?? "必中"}</span>
            </>
          ) : (
            <>
              <span>{subject.environment.groupLabel}</span>
              <span>{subject.environment.sourceLabel}</span>
              <span>{subject.environment.protocolId}</span>
              <span>环境预览</span>
            </>
          )}
          <span>{mode === "doubles" ? "双打 / 合作" : "单打"}</span>
        </footer>
      </section>
    </div>
  );
}

export function buildBattleV4EnvironmentPreviewScript(entry: BattleV4EnvironmentPreviewEntry, mode: BattleV4MovePreviewMode): string[] {
  const lines = [
    "|start",
    "|switch|p1a: Smeargle|Smeargle, L50|100/100",
    "|switch|p2a: Blissey|Blissey, L50|100/100",
  ];
  if (mode === "doubles") {
    lines.push(
      "|switch|p1b: Ditto|Ditto, L50|100/100",
      "|switch|p2b: Chansey|Chansey, L50|100/100",
    );
  }
  if (entry.group === "weather") {
    const source = entry.sourceType === "ability" ? `[from] ability: ${entry.name}` : `[from] move: ${entry.name}`;
    lines.push(`|-weather|${entry.protocolId}|${source}|[of] p1a: Smeargle`);
  } else {
    const source = entry.sourceType === "move" ? `move: ${entry.name}` : entry.name;
    lines.push(`|-fieldstart|${source}|[of] p1a: Smeargle`);
  }
  return lines;
}

export function buildBattleV4MovePreviewScript(move: DexMoveDetail, mode: BattleV4MovePreviewMode): string[] {
  const lines = [
    "|start",
    "|switch|p1a: Smeargle|Smeargle, L50|100/100",
    "|switch|p2a: Blissey|Blissey, L50|100/100",
  ];
  if (mode === "doubles") {
    lines.push(
      "|switch|p1b: Ditto|Ditto, L50|100/100",
      "|switch|p2b: Chansey|Chansey, L50|100/100",
    );
  }
  lines.push(`|move|p1a: Smeargle|${move.name || move.id}|${previewMoveTargetIdent(move)}`);
  if (shouldPreviewDamage(move)) {
    lines.push("|-damage|p2a: Blissey|65/100");
    const effectivenessLine = previewEffectivenessLine(move);
    if (effectivenessLine) lines.push(effectivenessLine);
  } else {
    lines.push(`|-activate|${previewMoveTargetIdent(move)}|move: ${move.name || move.id}`);
  }
  return lines;
}

function PreviewArena({near, far, message, animation, activeTimelineStep}: {
  near: BattleViewSlotV4[];
  far: BattleViewSlotV4[];
  message: string;
  animation: BattleAnimationEventV4 | null;
  activeTimelineStep?: ShowdownAnimationStepV4 | null;
}) {
  const nearSlots = sortPreviewSlots(near, "near");
  const farSlots = sortPreviewSlots(far, "far");
  const visuals = useMemo(() => getBattleV4ActiveTimelineVisuals(animation, activeTimelineStep || null), [animation, activeTimelineStep]);
  return (
    <div className="battle-v4-preview-arena battle-v4-arena" aria-label="预览战斗场地">
      <div className="battle-v4-scene-overlay" />
      {message ? <div className={`battle-v4-messagebar kind-${animation?.kind || "message"}`}><span>{message}</span></div> : null}
      <PreviewWeather animation={animation} visuals={visuals} />
      <PreviewFx animation={animation} visuals={visuals} />
      <PreviewResult animation={animation} visuals={visuals} />
      <div className="battle-v4-enemy-panels">
        {farSlots.map(slot => <PreviewHpPanel slot={slot} compact key={`${slot.seat}-hp`} />)}
      </div>
      <div className="battle-v4-player-panels">
        {nearSlots.map((slot, index) => <PreviewHpPanel slot={slot} current={slot.active} commanding={index === 0} key={`${slot.seat}-hp`} />)}
      </div>
      <div className="battle-v4-model-layer">
        {farSlots.map(slot => <PreviewPokemonSlot slot={slot} animation={animation} visuals={visuals} key={slot.seat} />)}
        {nearSlots.map((slot, index) => <PreviewPokemonSlot slot={slot} commanding={index === 0} animation={animation} visuals={visuals} key={slot.seat} />)}
      </div>
    </div>
  );
}

function PreviewWeather({animation, visuals}: {animation: BattleAnimationEventV4 | null; visuals: BattleV4TimelineVisuals}) {
  if (!animation || !visuals.background.visible) return null;
  const style = {
    "--battle-v4-background-color": visuals.background.color,
    "--battle-v4-background-opacity": String(visuals.background.opacity),
    "--battle-v4-background-duration": `${visuals.background.durationMs}ms`,
  } as CSSProperties;
  return (
    <div className={`battle-v4-weather-layer weather-${visuals.background.weatherId || "effect"}`} style={style} aria-hidden="true">
      <span>{visuals.background.label}</span>
    </div>
  );
}

function PreviewFx({animation, visuals}: {animation: BattleAnimationEventV4 | null; visuals: BattleV4TimelineVisuals}) {
  if (!animation || !visuals.fx.visible) return null;
  const targetClass = visuals.fx.targetSeat ? `target-${visuals.fx.targetSeat.toLowerCase()}` : `target-${animation.actorSeat.toLowerCase()}`;
  return (
    <div className={`battle-v4-fx-layer ${targetClass} kind-${visuals.fx.kind || animation.kind}`} aria-hidden="true">
      <i className="battle-v4-fx-sprite" style={visuals.fx.style} />
    </div>
  );
}

function PreviewResult({animation, visuals}: {animation: BattleAnimationEventV4 | null; visuals: BattleV4TimelineVisuals}) {
  if (!animation || !visuals.result.visible) return null;
  const seat = visuals.result.targetSeat || animation.targetSeat || animation.actorSeat || "";
  const text = visuals.result.text;
  if (!text) return null;
  return (
    <div className={`battle-v4-result-pop target-${seat.toLowerCase() || "center"} tone-${visuals.result.tone || "neutral"} kind-${visuals.result.kind || animation.kind}`} aria-hidden="true">
      {text}
    </div>
  );
}

function PreviewPokemonSlot({slot, commanding = false, animation, visuals}: {
  slot: BattleViewSlotV4;
  commanding?: boolean;
  animation: BattleAnimationEventV4 | null;
  visuals: BattleV4TimelineVisuals;
}) {
  const timelineActor = visuals.actor?.seat === slot.seat ? visuals.actor : null;
  const animationClass = timelineActor?.className || previewPokemonAnimationClass(slot.seat, animation);
  return (
    <article className={`battle-v4-pokemon ${slot.side} ${slot.position.toLowerCase()} species-${typeIdFor(slot.speciesId)} ${commanding ? "commanding" : ""} ${slot.fainted ? "fainted" : ""} ${animationClass}`} style={timelineActor?.style}>
      <ImageWithFallback src={slot.spriteUrl || slot.frontSpriteUrl || slot.iconUrl} fallback={slot.iconUrl || "/showdown/sprites/pokemonicons-sheet.png"} alt={slot.nameZh || slot.name} />
    </article>
  );
}

function PreviewHpPanel({slot, compact = false, current = false, commanding = false}: {
  slot: BattleViewSlotV4;
  compact?: boolean;
  current?: boolean;
  commanding?: boolean;
}) {
  const hpRate = slot.maxHp ? Math.max(0, Math.min(100, slot.hp / slot.maxHp * 100)) : 0;
  return (
    <section className={`battle-v4-hp-panel ${slot.side} ${slot.position.toLowerCase()} ${compact ? "compact" : ""} ${current ? "current" : ""} ${commanding ? "commanding" : ""}`}>
      <div className="battle-v4-hp-portrait">
        <ImageWithFallback src={slot.iconUrl || slot.frontSpriteUrl || slot.spriteUrl} fallback={slot.frontSpriteUrl || slot.spriteUrl} alt={slot.nameZh || slot.name} />
      </div>
      <div className="battle-v4-hp-main">
        <div className="battle-v4-hp-name-row"><strong>{slot.nameZh || slot.name}</strong></div>
        <div className="battle-v4-hp-bar"><b style={{width: `${hpRate}%`}} /></div>
        <div className="battle-v4-hp-value-row"><span>{slot.side === "far" ? `${Math.round(hpRate)}%` : `${slot.hp}/${slot.maxHp}`}</span></div>
      </div>
    </section>
  );
}

function buildBattleV4MovePreviewSlots(mode: BattleV4MovePreviewMode): BattleViewSlotV4[] {
  const slots = [
    previewSlot("p1A", "p1", "near", "A", "smeargle", "Smeargle", "图图犬"),
      previewSlot("p2A", "p2", "far", "A", "blissey", "Blissey", "幸福蛋"),
  ];
  if (mode === "doubles") {
    slots.push(
      previewSlot("p1B", "p1", "near", "B", "ditto", "Ditto", "百变怪"),
      previewSlot("p2B", "p2", "far", "B", "chansey", "Chansey", "吉利蛋"),
    );
  }
  return slots;
}

function previewSlot(
  seat: BattleProtocolSeatV4,
  playerId: "p1" | "p2",
  side: "near" | "far",
  position: "A" | "B",
  speciesId: string,
  name: string,
  nameZh: string,
): BattleViewSlotV4 {
  return {
    seat: seat as BattleViewSlotV4["seat"],
    playerId,
    side,
    position,
    localPokemonId: `preview-${seat.toLowerCase()}`,
    showdownIdentityToken: name,
    showdownId: speciesId,
    pokeballId: "poke",
    active: true,
    fainted: false,
    name,
    nameZh,
    speciesId,
    level: 50,
    hp: 100,
    maxHp: 100,
    status: "",
    spriteUrl: side === "near" ? `/showdown/sprites/ani-back/${speciesId}.gif` : `/showdown/sprites/ani/${speciesId}.gif`,
    frontSpriteUrl: `/showdown/sprites/ani/${speciesId}.gif`,
    backSpriteUrl: `/showdown/sprites/ani-back/${speciesId}.gif`,
    frontShinySpriteUrl: `/showdown/sprites/ani-shiny/${speciesId}.gif`,
    backShinySpriteUrl: `/showdown/sprites/ani-back-shiny/${speciesId}.gif`,
    iconUrl: `/showdown/sprites/ani/${speciesId}.gif`,
    teamBallStates: ["normal", "empty", "empty", "empty", "empty", "empty"],
  };
}

function sortPreviewSlots(slots: BattleViewSlotV4[], side: "near" | "far"): BattleViewSlotV4[] {
  return [...slots].sort((a, b) => {
    const aRank = a.position === "B" ? 1 : 0;
    const bRank = b.position === "B" ? 1 : 0;
    return side === "far" ? bRank - aRank : aRank - bRank;
  });
}

function previewPokemonAnimationClass(seat: BattleProtocolSeatV4, animation: BattleAnimationEventV4 | null): string {
  if (!animation || !seat) return "";
  if (animation.kind === "moveStart" && animation.actorSeat === seat) return "anim-move-start";
  if (animation.kind === "moveEffect" && animation.actorSeat === seat) return "anim-move-cast";
  if ((animation.kind === "moveEffect" || animation.kind === "damage" || animation.kind === "status" || animation.kind === "result") && animation.targetSeat === seat) return `anim-target-${animation.kind}`;
  if (animation.kind === "heal" && animation.actorSeat === seat) return "anim-heal";
  if (animation.kind === "switchIn" && animation.actorSeat === seat) return "anim-switch-in";
  return "";
}

function localizePreviewMessage(
  message: string,
  animation: BattleAnimationEventV4 | null,
  subject: {kind: "move"; move: DexMoveDetail} | {kind: "environment"; environment: BattleV4EnvironmentPreviewEntry},
): string {
  if (!message || !animation) return message;
  if (subject.kind === "move" && (animation.kind === "moveStart" || animation.kind === "moveEffect")) return `图图犬使用了${subject.move.nameZh || subject.move.name}！`;
  if (subject.kind === "environment" && (animation.kind === "weather" || animation.kind === "result")) return environmentPreviewMessage(subject.environment);
  let localized = message
    .replace(/\bSmeargle\b/g, "图图犬")
    .replace(/\bBlissey\b/g, "吉利蛋")
    .replace(/\bDitto\b/g, "百变怪")
    .replace(/\bChansey\b/g, "吉利蛋")
    .replace(/\bmove:\s*/gi, "");
  if (subject.kind === "move") localized = localized.replace(new RegExp(`\\b${escapeRegExp(subject.move.name)}\\b`, "g"), subject.move.nameZh || subject.move.name);
  return localized;
}

function environmentPreviewMessage(entry: BattleV4EnvironmentPreviewEntry): string {
  if (entry.group === "weather") return `天气变成了${entry.nameZh}！`;
  if (entry.group === "terrain") return `${entry.nameZh}展开了！`;
  return `${entry.nameZh}扭曲了空间！`;
}

function previewMoveTargetIdent(move: DexMoveDetail): string {
  const target = normalizeMoveTarget(move.target);
  if (target === "self" || target === "allyteam" || target === "allyside") return "p1a: Smeargle";
  return "p2a: Blissey";
}

function shouldPreviewDamage(move: DexMoveDetail): boolean {
  if (!Number(move.power || 0)) return false;
  const category = typeIdFor(move.categoryId || move.category);
  if (category === "status") return false;
  return previewMoveTargetIdent(move).startsWith("p2");
}

function previewEffectivenessLine(move: DexMoveDetail): string {
  const multiplier = normalTypeMultiplier(move);
  if (multiplier <= 0) return "|-immune|p2a: Blissey";
  if (multiplier > 1) return "|-supereffective|p2a: Blissey";
  if (multiplier < 1) return "|-resisted|p2a: Blissey";
  return "";
}

function normalTypeMultiplier(move: DexMoveDetail): number {
  const typeId = typeIdFor(move.typeId || move.type);
  if (typeId === "fighting") return 2;
  if (typeId === "ghost") return 0;
  return 1;
}

function normalizeMoveTarget(value: string | undefined): string {
  return String(value || "normal").replace(/[^a-z]/gi, "").toLowerCase() || "normal";
}

function typeIdFor(value: string | undefined): string {
  const id = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (id === "elec") return "electric";
  if (id === "fight") return "fighting";
  if (id === "psy") return "psychic";
  return id;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
