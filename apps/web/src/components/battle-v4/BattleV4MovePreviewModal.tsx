import {useEffect, useMemo, useState, type CSSProperties} from "react";
import type {BattleViewSlotV4, ChangeBattleV2Api, DexMoveDetail} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {useBattleV4PreviewPlayback, type BattleAnimationEventV4, type BattleProtocolSeatV4} from "./battleV4Playback";
import "./BattleV4Page.css";
import "./BattleV4MovePreviewModal.css";

export type BattleV4MovePreviewMode = "singles" | "doubles";

export function BattleV4MovePreviewModal({move, initialMode = "singles", onClose}: {
  api: ChangeBattleV2Api;
  move: DexMoveDetail;
  initialMode?: BattleV4MovePreviewMode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<BattleV4MovePreviewMode>(initialMode);
  const [replaySeed, setReplaySeed] = useState(0);
  const slots = useMemo(() => buildBattleV4MovePreviewSlots(mode), [mode]);
  const rawLines = useMemo(() => buildBattleV4MovePreviewScript(move, mode), [mode, move]);
  const playback = useBattleV4PreviewPlayback(rawLines, slots, `${move.id}-${mode}-${replaySeed}`);
  const message = localizePreviewMessage(playback.messagebar?.message || "", playback.activeAnimation, move);
  const animationKindsLabel = playback.debug.animationKinds.join(",");

  useEffect(() => {
    console.info("[BattleV4][move-preview]", {
      moveId: move.id,
      mode,
      rawLines,
      animationKinds: animationKindsLabel.split(",").filter(Boolean),
    });
  }, [animationKindsLabel, mode, move.id, rawLines]);

  function chooseMode(nextMode: BattleV4MovePreviewMode) {
    setMode(nextMode);
    setReplaySeed(seed => seed + 1);
  }

  return (
    <div className="battle-v4-preview-layer" role="dialog" aria-modal="true" aria-label="技能动画预览">
      <section className="battle-v4-preview-modal">
        <header className="battle-v4-preview-header">
          <div>
            <span>动画预览</span>
            <h3>{move.nameZh || move.name}</h3>
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
        />
        <footer className={`battle-v4-preview-meta move-type-${typeIdFor(move.typeId || move.type)}`}>
          <span>{move.type}</span>
          <span>{move.category}</span>
          <span>威力 {move.power || "-"}</span>
          <span>命中 {move.accuracy ?? "必中"}</span>
          <span>{mode === "doubles" ? "双打 / 合作" : "单打"}</span>
        </footer>
      </section>
    </div>
  );
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

function PreviewArena({near, far, message, animation}: {
  near: BattleViewSlotV4[];
  far: BattleViewSlotV4[];
  message: string;
  animation: BattleAnimationEventV4 | null;
}) {
  const nearSlots = sortPreviewSlots(near, "near");
  const farSlots = sortPreviewSlots(far, "far");
  return (
    <div className="battle-v4-preview-arena battle-v4-arena" aria-label="预览战斗场地">
      <div className="battle-v4-scene-overlay" />
      {message ? <div className={`battle-v4-messagebar kind-${animation?.kind || "message"}`}><span>{message}</span></div> : null}
      <PreviewFx animation={animation} />
      <PreviewResult animation={animation} />
      <div className="battle-v4-enemy-panels">
        {farSlots.map(slot => <PreviewHpPanel slot={slot} compact key={`${slot.seat}-hp`} />)}
      </div>
      <div className="battle-v4-player-panels">
        {nearSlots.map((slot, index) => <PreviewHpPanel slot={slot} current={slot.active} commanding={index === 0} key={`${slot.seat}-hp`} />)}
      </div>
      <div className="battle-v4-model-layer">
        {farSlots.map(slot => <PreviewPokemonSlot slot={slot} animation={animation} key={slot.seat} />)}
        {nearSlots.map((slot, index) => <PreviewPokemonSlot slot={slot} commanding={index === 0} animation={animation} key={slot.seat} />)}
      </div>
    </div>
  );
}

function PreviewFx({animation}: {animation: BattleAnimationEventV4 | null}) {
  if (!animation || animation.kind === "turn" || animation.kind === "message") return null;
  const targetClass = animation.targetSeat ? `target-${animation.targetSeat.toLowerCase()}` : `target-${animation.actorSeat.toLowerCase()}`;
  return (
    <div className={`battle-v4-fx-layer ${targetClass} kind-${animation.kind}`} aria-hidden="true">
      <i className="battle-v4-fx-sprite" style={{"--battle-v4-fx-image": `url("/showdown/fx/${animation.effectSprite}.png")`} as CSSProperties} />
    </div>
  );
}

function PreviewResult({animation}: {animation: BattleAnimationEventV4 | null}) {
  if (!animation?.resultText && animation?.kind !== "damage") return null;
  const seat = animation.targetSeat || animation.actorSeat || "";
  const text = animation.kind === "damage" ? "-35%" : animation.resultText;
  if (!text) return null;
  return (
    <div className={`battle-v4-result-pop target-${seat.toLowerCase() || "center"} tone-${animation.resultTone || "neutral"} kind-${animation.kind}`} aria-hidden="true">
      {text}
    </div>
  );
}

function PreviewPokemonSlot({slot, commanding = false, animation}: {
  slot: BattleViewSlotV4;
  commanding?: boolean;
  animation: BattleAnimationEventV4 | null;
}) {
  const animationClass = previewPokemonAnimationClass(slot.seat, animation);
  return (
    <article className={`battle-v4-pokemon ${slot.side} ${slot.position.toLowerCase()} species-${typeIdFor(slot.speciesId)} ${commanding ? "commanding" : ""} ${slot.fainted ? "fainted" : ""} ${animationClass}`}>
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

function localizePreviewMessage(message: string, animation: BattleAnimationEventV4 | null, move: DexMoveDetail): string {
  if (!message || !animation) return message;
  if (animation.kind === "moveStart" || animation.kind === "moveEffect") return `图图犬使用了${move.nameZh || move.name}！`;
  return message
    .replace(/\bSmeargle\b/g, "图图犬")
    .replace(/\bBlissey\b/g, "吉利蛋")
    .replace(/\bDitto\b/g, "百变怪")
    .replace(/\bChansey\b/g, "吉利蛋")
    .replace(new RegExp(`\\b${escapeRegExp(move.name)}\\b`, "g"), move.nameZh || move.name)
    .replace(/\bmove:\s*/gi, "");
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
