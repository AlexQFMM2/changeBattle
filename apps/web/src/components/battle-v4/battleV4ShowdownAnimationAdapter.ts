import type {BattleAnimationKindV4, BattleProtocolEventV4, BattleProtocolSeatV4} from "./battleV4Playback";

export type ShowdownAnimationSourceV4 = "BattleMoveAnims" | "BattleOtherAnims" | "BattleStatusAnims" | "fallback" | "native";

export type ShowdownActorAnimPropsV4 = Partial<{
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  xscale: number;
  yscale: number;
}>;

export type ShowdownSpriteActorV4 = {
  seat: BattleProtocolSeatV4;
  ident: string;
  side: "near" | "far" | "";
  slotIndex: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  xscale: number;
  yscale: number;
};

export type ShowdownEffectSpriteV4 = {
  effectId: string;
  assetPath: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  blendMode?: "normal" | "screen" | "multiply";
};

export type ShowdownAnimationStepV4 =
  | {type: "showEffect"; effectId: string; from: ShowdownSpriteActorV4; to: ShowdownSpriteActorV4; durationMs: number; easing?: string; fade?: "in" | "out" | "both" | "none"; sprite: ShowdownEffectSpriteV4}
  | {type: "actorAnim"; actor: ShowdownSpriteActorV4; props: ShowdownActorAnimPropsV4; durationMs: number; easing?: string}
  | {type: "delay"; actor?: ShowdownSpriteActorV4; durationMs: number}
  | {type: "wait"; durationMs: number}
  | {type: "backgroundEffect"; color: string; durationMs: number; opacity: number}
  | {type: "resultAnim"; actor: ShowdownSpriteActorV4; text: string; tone: "good" | "bad" | "neutral" | "status" | "weather" | ""}
  | {type: "damageAnim"; actor: ShowdownSpriteActorV4; damage: number | null}
  | {type: "healAnim"; actor: ShowdownSpriteActorV4; heal: number | null}
  | {type: "checkpoint"; checkpointId: string};

export type ShowdownAnimationTimelineV4 = {
  id: string;
  animationKey: string;
  source: ShowdownAnimationSourceV4;
  protocolSequence: number;
  turn: number | null;
  actorSeat: BattleProtocolSeatV4;
  targetSeats: BattleProtocolSeatV4[];
  effectSprite: string;
  steps: ShowdownAnimationStepV4[];
  checkpoints: string[];
  fallback: boolean;
};

export type ShowdownAnimationContextV4 = {
  event: BattleProtocolEventV4;
  kind: BattleAnimationKindV4;
  checkpointId: string;
  message: string;
  resultText: string;
  resultTone: "good" | "bad" | "neutral" | "status" | "weather" | "";
  durationMs: number;
};

export type ShowdownAnimationExecutionOptionsV4 = {
  skip?: boolean;
  onStep?: (step: ShowdownAnimationStepV4, timeline: ShowdownAnimationTimelineV4) => void | Promise<void>;
  onCheckpoint?: (checkpointId: string, timeline: ShowdownAnimationTimelineV4) => void | Promise<void>;
};

export type ShowdownAnimationExecutionResultV4 = {
  timelineId: string;
  animationKey: string;
  consumedSteps: number;
  consumedCheckpoints: string[];
  skipped: boolean;
};

export type ShowdownAnimationKeySelectionV4 = {
  animationKey: string;
  source: ShowdownAnimationSourceV4;
  fallback: boolean;
};

const FIRST_BATCH_OTHER_ANIMS = new Set([
  "hitmark",
  "attack",
  "contactattack",
  "fastattack",
  "fastanimspecial",
  "heal",
  "shake",
  "sound",
]);

const FIRST_BATCH_STATUS_ANIMS = new Set([
  "brn",
  "psn",
  "slp",
  "par",
  "frz",
  "flinch",
  "attracted",
  "cursed",
  "confused",
  "confusedselfhit",
]);

const FIRST_BATCH_MOVE_ANIMS = new Set([
  "eruption",
  "weatherball",
  "earthquake",
  "bulldoze",
  "gigaimpact",
  "heavyslam",
  "seismictoss",
  "transform",
  "protect",
  "recover",
  "rest",
]);

export function selectShowdownAnimationKeyV4(event: BattleProtocolEventV4, kind: BattleAnimationKindV4): ShowdownAnimationKeySelectionV4 {
  const moveId = toId(event.moveId || event.moveName);
  const status = toId(event.status || event.args[2]);
  if (kind === "damage" || kind === "hit") return {animationKey: "hitmark", source: "BattleOtherAnims", fallback: false};
  if (kind === "heal") return {animationKey: "heal", source: "BattleOtherAnims", fallback: false};
  if (kind === "status") {
    const key = FIRST_BATCH_STATUS_ANIMS.has(status) ? status : statusFallbackForEvent(event);
    return {animationKey: key, source: FIRST_BATCH_STATUS_ANIMS.has(key) ? "BattleStatusAnims" : "BattleOtherAnims", fallback: !FIRST_BATCH_STATUS_ANIMS.has(key)};
  }
  if (kind === "result") return {animationKey: resultAnimationKeyForEvent(event), source: "BattleOtherAnims", fallback: true};
  if (kind === "moveStart") return {animationKey: moveId || "attack", source: moveId && FIRST_BATCH_MOVE_ANIMS.has(moveId) ? "BattleMoveAnims" : "fallback", fallback: !FIRST_BATCH_MOVE_ANIMS.has(moveId)};
  if (kind === "moveEffect") {
    if (moveId && FIRST_BATCH_MOVE_ANIMS.has(moveId)) return {animationKey: moveId, source: "BattleMoveAnims", fallback: true};
    const fallbackKey = fallbackMoveAnimationKey(event);
    return {animationKey: fallbackKey, source: "BattleOtherAnims", fallback: true};
  }
  if (kind === "ability" || kind === "weather") return {animationKey: "lightstatus", source: "BattleOtherAnims", fallback: true};
  if (kind === "transform") return {animationKey: moveId === "transform" ? "transform" : "shiny", source: moveId === "transform" ? "BattleMoveAnims" : "BattleOtherAnims", fallback: moveId !== "transform"};
  if (kind === "switchIn" || kind === "switchOut" || kind === "faint") return {animationKey: kind, source: "native", fallback: false};
  return {animationKey: kind || "message", source: "native", fallback: true};
}

export function projectShowdownAnimationTimelineV4(animationKey: string, context: ShowdownAnimationContextV4): ShowdownAnimationTimelineV4 {
  const selection = selectShowdownAnimationKeyV4(context.event, context.kind);
  const actor = actorForSeat(context.event.seat, context.event.actorName);
  const targetSeat = context.event.targetSeat || context.event.seat;
  const target = actorForSeat(targetSeat, context.event.targetName || context.event.actorName);
  const effectSprite = effectSpriteForAnimationKey(animationKey, context.kind, context.event);
  const checkpointId = context.checkpointId;
  const steps = stepsForAnimation(animationKey, effectSprite, actor, target, context);
  const checkpoints = steps.filter(step => step.type === "checkpoint").map(step => step.checkpointId);
  return {
    id: `${context.event.sequence}-${context.kind}-${animationKey}`,
    animationKey,
    source: selection.source,
    protocolSequence: context.event.sequence,
    turn: context.event.turn || null,
    actorSeat: context.event.seat,
    targetSeats: targetSeat ? [targetSeat] : [],
    effectSprite,
    steps,
    checkpoints: checkpoints.length ? checkpoints : [checkpointId],
    fallback: selection.fallback,
  };
}

export function effectSpriteForShowdownAnimationV4(animationKey: string, kind: BattleAnimationKindV4, event: BattleProtocolEventV4): string {
  return effectSpriteForAnimationKey(animationKey, kind, event);
}

export async function executeShowdownAnimationTimelineV4(
  timeline: ShowdownAnimationTimelineV4,
  options: ShowdownAnimationExecutionOptionsV4 = {},
): Promise<ShowdownAnimationExecutionResultV4> {
  const consumedCheckpoints: string[] = [];
  for (const step of timeline.steps) {
    await options.onStep?.(step, timeline);
    if (step.type === "checkpoint") {
      consumedCheckpoints.push(step.checkpointId);
      await options.onCheckpoint?.(step.checkpointId, timeline);
    }
    if (!options.skip && (step.type === "wait" || step.type === "delay")) {
      await wait(step.durationMs);
    }
  }
  return {
    timelineId: timeline.id,
    animationKey: timeline.animationKey,
    consumedSteps: timeline.steps.length,
    consumedCheckpoints,
    skipped: Boolean(options.skip),
  };
}

function stepsForAnimation(
  animationKey: string,
  effectSprite: string,
  actor: ShowdownSpriteActorV4,
  target: ShowdownSpriteActorV4,
  context: ShowdownAnimationContextV4,
): ShowdownAnimationStepV4[] {
  const checkpoint = {type: "checkpoint" as const, checkpointId: context.checkpointId};
  if (context.kind === "moveStart") {
    return [
      {type: "actorAnim", actor, props: {y: actor.y - 12, scale: 1.08}, durationMs: 260, easing: "easeOut"},
      {type: "wait", durationMs: 140},
      checkpoint,
    ];
  }
  if (context.kind === "moveEffect") {
    return [
      ...backgroundStepsForMove(animationKey),
      {type: "showEffect", effectId: effectSprite, from: actor, to: target, durationMs: Math.max(420, context.durationMs - 220), easing: "easeOut", fade: "both", sprite: effectSpriteFor(effectSprite, actor)},
      {type: "actorAnim", actor: target, props: {x: target.x + (target.side === "far" ? 10 : -10)}, durationMs: 180, easing: "easeInOut"},
      checkpoint,
    ];
  }
  if (context.kind === "damage") return [{type: "showEffect", effectId: "hitmark", from: target, to: target, durationMs: 280, fade: "both", sprite: effectSpriteFor("impact", target)}, {type: "damageAnim", actor: target, damage: null}, checkpoint];
  if (context.kind === "heal") return [{type: "showEffect", effectId: "heal", from: actor, to: actor, durationMs: 520, fade: "both", sprite: effectSpriteFor("shine", actor)}, {type: "healAnim", actor, heal: null}, checkpoint];
  if (context.kind === "status") return [{type: "showEffect", effectId: animationKey, from: actor, to: actor, durationMs: 520, fade: "both", sprite: effectSpriteFor(effectSprite, actor)}, {type: "resultAnim", actor, text: context.resultText, tone: "status"}, checkpoint];
  if (context.kind === "result") return [{type: "resultAnim", actor: target, text: context.resultText, tone: context.resultTone}, {type: "wait", durationMs: 220}, checkpoint];
  if (context.kind === "ability" || context.kind === "weather") return [{type: "backgroundEffect", color: context.kind === "weather" ? "#f3d45a" : "#b7ff27", durationMs: 560, opacity: .42}, {type: "resultAnim", actor, text: context.resultText, tone: context.kind === "weather" ? "weather" : "good"}, checkpoint];
  if (context.kind === "transform") return [{type: "showEffect", effectId: "shine", from: actor, to: actor, durationMs: 560, fade: "both", sprite: effectSpriteFor("shine", actor)}, {type: "actorAnim", actor, props: {scale: 1.18, opacity: .72}, durationMs: 420, easing: "easeInOut"}, checkpoint];
  return [{type: "wait", durationMs: Math.max(180, context.durationMs)}, checkpoint];
}

function backgroundStepsForMove(animationKey: string): ShowdownAnimationStepV4[] {
  if (animationKey === "eruption" || /fire|flame|blast|burn/.test(animationKey)) return [{type: "backgroundEffect", color: "#ff7a32", durationMs: 420, opacity: .28}];
  if (animationKey === "earthquake" || animationKey === "bulldoze") return [{type: "backgroundEffect", color: "#b98442", durationMs: 360, opacity: .24}];
  if (/thunder|volt|spark|electro/.test(animationKey)) return [{type: "backgroundEffect", color: "#ffe35a", durationMs: 360, opacity: .3}];
  if (/water|hydro|surf/.test(animationKey)) return [{type: "backgroundEffect", color: "#4aa5ff", durationMs: 360, opacity: .24}];
  return [];
}

function fallbackMoveAnimationKey(event: BattleProtocolEventV4): string {
  const moveId = toId(event.moveId || event.moveName);
  if (/punch|kick|slam|tackle|impact|claw|slash|bite|seismic|heavy/.test(moveId)) return "contactattack";
  if (/sound|voice|song|metal/.test(moveId)) return "sound";
  if (/quick|aqua|shadow|sneak/.test(moveId)) return "fastattack";
  return "fastanimspecial";
}

function resultAnimationKeyForEvent(event: BattleProtocolEventV4): string {
  if (event.eventType === "-miss" || event.eventType === "-immune" || event.eventType === "-fail") return "shake";
  if (event.eventType === "-supereffective" || event.eventType === "-crit") return "hitmark";
  return "lightstatus";
}

function statusFallbackForEvent(event: BattleProtocolEventV4): string {
  const status = toId(event.status || event.args[2]);
  if (status === "recharge" || status === "flinch") return "shake";
  if (status === "confusion") return "confused";
  return "selfstatus";
}

function effectSpriteForAnimationKey(animationKey: string, kind: BattleAnimationKindV4, event: BattleProtocolEventV4): string {
  const key = toId(animationKey || event.moveId || event.moveName);
  if (kind === "damage" || key === "hitmark" || key === "contactattack" || key === "attack") return "impact";
  if (kind === "heal" || key === "heal" || key === "recover" || key === "rest") return "shine";
  if (kind === "status" || key === "lightstatus" || key === "selfstatus") return "wisp";
  if (key === "brn" || /eruption|fire|flame|burn|blast|heat|flare|pyro/.test(key)) return "fireball";
  if (key === "psn" || /poison|sludge|toxic|venom/.test(key)) return "poisonwisp";
  if (key === "par" || /thunder|volt|spark|shock|electro|bolt/.test(key)) return "electroball";
  if (key === "frz" || /ice|snow|freeze|blizzard/.test(key)) return "iceball";
  if (/water|aqua|hydro|surf|steam/.test(key)) return "waterwisp";
  if (/leaf|grass|seed|petal|vine/.test(key)) return "leaf1";
  if (/shadow|ghost|dark|night/.test(key)) return "shadowball";
  if (/psych|confusion|psy|confused/.test(key)) return "mistball";
  if (/slash|cut|claw/.test(key)) return "leftslash";
  if (kind === "transform" || key === "transform" || key === "shiny") return "shine";
  if (kind === "weather") return "shine";
  if (kind === "switchIn" || kind === "switchOut") return "pokeball";
  return "impact";
}

function actorForSeat(seat: BattleProtocolSeatV4, ident: string): ShowdownSpriteActorV4 {
  const coords = actorCoords(seat);
  return {
    seat,
    ident,
    side: seat.startsWith("p1") ? "near" : seat.startsWith("p2") ? "far" : "",
    slotIndex: seat.endsWith("B") ? 1 : 0,
    ...coords,
    scale: 1,
    opacity: 1,
    xscale: 1,
    yscale: 1,
  };
}

function actorCoords(seat: BattleProtocolSeatV4): Pick<ShowdownSpriteActorV4, "x" | "y" | "z"> {
  if (seat === "p1A") return {x: 86, y: 191, z: 20};
  if (seat === "p1B") return {x: 244, y: 191, z: 20};
  if (seat === "p2A") return {x: 489, y: 95, z: 20};
  if (seat === "p2B") return {x: 357, y: 95, z: 20};
  return {x: 320, y: 132, z: 20};
}

function effectSpriteFor(effectId: string, actor: ShowdownSpriteActorV4): ShowdownEffectSpriteV4 {
  return {
    effectId,
    assetPath: `/showdown/fx/${effectId}.png`,
    x: actor.x,
    y: actor.y,
    z: actor.z + 10,
    scale: 1,
    opacity: 1,
    blendMode: "screen",
  };
}

function wait(durationMs: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, Math.max(0, durationMs)));
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
