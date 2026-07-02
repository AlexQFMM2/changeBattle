import type {BattleViewSlotV4} from "@changebattle-v2/api";
import {
  effectSpriteForShowdownAnimationV4,
  projectShowdownAnimationTimelineV4,
  selectShowdownAnimationKeyV4,
  type ShowdownAnimationStepV4,
} from "./battleV4ShowdownAnimationAdapter";
import type {
  BattleAnimationEventV4,
  BattleAnimationKindV4,
  BattleProtocolSeatV4,
  BattleV4PersistentFieldVisuals,
  BattleV4PersistentSideConditionVisuals,
  BattleV4SideConditionVisualV4,
} from "./battleV4Playback";
import type {BattleRuntimeStateV4, BattleSemanticEventV4} from "./battleV4ProtocolExecutor";

const EMPTY_VISUAL_FIELD_STATE: BattleV4PersistentFieldVisuals = {
  weatherId: "",
  terrainId: "",
  roomId: "",
  gravityActive: false,
  sourceRawLine: "",
  resourcePath: "",
  resourceKind: "",
  adapterFidelity: "fallback",
  renderedWeatherLayer: "",
  missingFxAssets: [],
};

const EMPTY_VISUAL_SIDE_CONDITION_STATE: BattleV4PersistentSideConditionVisuals = {
  near: [],
  far: [],
  sourceRawLine: "",
  adapterFidelity: "fallback",
};
const BATTLE_V4_HP_ANIMATION_DURATION_MS = 720;

export type BattleHpTweenV4 = {
  seat: BattleProtocolSeatV4;
  fromHp: number;
  toHp: number;
  maxHp: number;
  startedAt: string;
  durationMs: number;
};

export type BattleVisualCommandV4 = {
  id: string;
  semanticEvent: BattleSemanticEventV4;
  animationEvent: BattleAnimationEventV4 | null;
  blocksCommands: boolean;
};

export type BattleVisualSceneStateV4 = {
  visualSlots: BattleViewSlotV4[];
  activeVisual: BattleVisualCommandV4 | null;
  fx: ShowdownAnimationStepV4[];
  resultPop: string;
  persistentFieldVisuals: BattleV4PersistentFieldVisuals;
  persistentSideConditionVisuals: BattleV4PersistentSideConditionVisuals;
  isBusy: boolean;
  visualQueue: BattleVisualCommandV4[];
  hpTweens: BattleHpTweenV4[];
};

export function createBattleV4VisualCommands(events: BattleSemanticEventV4[]): BattleVisualCommandV4[] {
  return events
    .map(createBattleV4VisualCommand)
    .filter((command): command is BattleVisualCommandV4 => Boolean(command));
}

export function visualSlotsFromRuntimeState(runtime: BattleRuntimeStateV4): BattleViewSlotV4[] {
  return Object.values(runtime.slots)
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot))
    .sort(compareSlotsForView);
}

export function applyBattleV4VisualCommandStart(slots: BattleViewSlotV4[], command: BattleVisualCommandV4): BattleViewSlotV4[] {
  const event = command.semanticEvent;
  if (event.kind === "switchIn" || event.kind === "dragIn") {
    return replaceSeat(slots, event.slot);
  }
  if (event.kind === "damage" || event.kind === "heal") {
    return patchSlot(slots, event.seat, slot => ({
      ...slot,
      hp: event.oldHp,
      maxHp: event.maxHp || slot.maxHp,
      status: event.status === "fnt" ? slot.status : event.status || slot.status,
      fainted: false,
    }));
  }
  return slots;
}

export function applyBattleV4HpTweenTarget(slots: BattleViewSlotV4[], command: BattleVisualCommandV4): BattleViewSlotV4[] {
  const event = command.semanticEvent;
  if (event.kind !== "damage" && event.kind !== "heal") return slots;
  return applyBattleV4HpTweenFrame(slots, command, event.newHp);
}

export function applyBattleV4HpTweenFrame(slots: BattleViewSlotV4[], command: BattleVisualCommandV4, hp: number): BattleViewSlotV4[] {
  const event = command.semanticEvent;
  if (event.kind !== "damage" && event.kind !== "heal") return slots;
  const nextHp = Math.max(0, Math.min(event.maxHp || Number.MAX_SAFE_INTEGER, hp));
  return patchSlot(slots, event.seat, slot => ({
    ...slot,
    hp: nextHp,
    maxHp: event.maxHp || slot.maxHp,
    status: event.status === "fnt" ? slot.status : event.status || slot.status,
    fainted: false,
  }));
}

export function applyBattleV4VisualCommandSettle(slots: BattleViewSlotV4[], command: BattleVisualCommandV4): BattleViewSlotV4[] {
  const event = command.semanticEvent;
  if (event.kind === "faint") {
    return patchSlot(slots, event.seat, slot => ({...slot, hp: 0, status: "fnt", fainted: true}));
  }
  if (event.kind === "status" || event.kind === "cureStatus") {
    return patchSlot(slots, event.seat, slot => ({...slot, status: event.newStatus}));
  }
  return applyBattleV4HpTweenTarget(slots, command);
}

export function applyBattleV4PersistentFieldVisuals(current: BattleV4PersistentFieldVisuals, command: BattleVisualCommandV4): BattleV4PersistentFieldVisuals {
  const event = command.semanticEvent;
  if (event.kind === "weather") {
    const weatherId = event.active ? event.id : "";
    return {
      ...current,
      weatherId,
      sourceRawLine: event.rawLine,
      renderedWeatherLayer: weatherId,
    };
  }
  if (event.kind === "field") {
    const terrainId = event.id.includes("terrain") && event.active ? event.id : event.id.includes("terrain") ? "" : current.terrainId;
    const roomId = event.id.includes("room") && event.active ? event.id : event.id.includes("room") ? "" : current.roomId;
    return {
      ...current,
      terrainId,
      roomId,
      gravityActive: event.id === "gravity" ? event.active : current.gravityActive,
      sourceRawLine: event.rawLine,
    };
  }
  return current;
}

export function applyBattleV4PersistentSideConditionVisuals(current: BattleV4PersistentSideConditionVisuals, command: BattleVisualCommandV4): BattleV4PersistentSideConditionVisuals {
  const event = command.semanticEvent;
  if (event.kind !== "sideCondition") return current;
  const side = sideConditionSideForSeat(event.protocolEvent.seat || event.protocolEvent.targetSeat);
  const nextItem: BattleV4SideConditionVisualV4 = {
    id: event.id,
    label: event.label,
    side,
    sourceRawLine: event.rawLine,
    adapterFidelity: "native",
  };
  const list = event.active
    ? [...current[side].filter(item => item.id !== event.id), nextItem]
    : current[side].filter(item => item.id !== event.id);
  return {...current, [side]: list, sourceRawLine: event.rawLine, adapterFidelity: "native"};
}

export function emptyBattleV4VisualSceneState(): BattleVisualSceneStateV4 {
  return {
    visualSlots: [],
    activeVisual: null,
    fx: [],
    resultPop: "",
    persistentFieldVisuals: EMPTY_VISUAL_FIELD_STATE,
    persistentSideConditionVisuals: EMPTY_VISUAL_SIDE_CONDITION_STATE,
    isBusy: false,
    visualQueue: [],
    hpTweens: [],
  };
}

function createBattleV4VisualCommand(event: BattleSemanticEventV4): BattleVisualCommandV4 | null {
  const kind = animationKindForSemanticEvent(event);
  const animationEvent = kind ? animationEventForSemanticEvent(event, kind) : null;
  if (!animationEvent && (event.kind === "turn" || event.kind === "message")) return null;
  return {
    id: `${event.sequence}-${event.kind}`,
    semanticEvent: event,
    animationEvent,
    blocksCommands: event.kind !== "turn" && event.kind !== "message",
  };
}

function animationKindForSemanticEvent(event: BattleSemanticEventV4): BattleAnimationKindV4 | "" {
  if (event.kind === "switchIn" || event.kind === "dragIn") return "switchIn";
  if (event.kind === "move") return "moveEffect";
  if (event.kind === "damage") return "damage";
  if (event.kind === "heal") return "heal";
  if (event.kind === "faint") return "faint";
  if (event.kind === "status" || event.kind === "cureStatus") return "status";
  if (event.kind === "result") return "result";
  if (event.kind === "weather" || event.kind === "field") return "weather";
  if (event.kind === "sideCondition") return "result";
  if (event.kind === "win") return "result";
  return "";
}

function animationEventForSemanticEvent(event: BattleSemanticEventV4, kind: BattleAnimationKindV4): BattleAnimationEventV4 {
  const protocolEvent = event.protocolEvent;
  const result = resultForSemanticEvent(event);
  const selection = selectShowdownAnimationKeyV4(protocolEvent, kind);
  const effectSprite = effectSpriteForShowdownAnimationV4(selection.animationKey, kind, protocolEvent);
  const checkpointId = `${event.sequence}-${event.kind}`;
  const animationTimeline = projectShowdownAnimationTimelineV4(selection.animationKey, {
    event: protocolEvent,
    kind,
    checkpointId,
    message: "",
    resultText: result.text,
    resultTone: result.tone,
    durationMs: durationForKind(kind),
  });
  return {
    checkpointId,
    sequence: event.sequence,
    kind,
    rawLine: event.rawLine,
    args: protocolEvent.args,
    kwArgs: protocolEvent.kwArgs,
    actorSeat: protocolEvent.seat,
    actorSeatExplicit: protocolEvent.seatExplicit,
    targetSeat: protocolEvent.targetSeat || protocolEvent.seat,
    targetSeatExplicit: protocolEvent.targetSeatExplicit || protocolEvent.seatExplicit,
    actorName: protocolEvent.actorName,
    targetName: protocolEvent.targetName,
    moveId: protocolEvent.moveId,
    moveName: protocolEvent.moveName,
    condition: protocolEvent.condition,
    status: protocolEvent.status,
    durationMs: durationForKind(kind),
    effectSprite,
    selectedAnimationKey: selection.animationKey,
    animationSource: selection.source,
    animationTimeline,
    adapterFidelity: animationTimeline.adapterFidelity,
    sourceKey: animationTimeline.sourceKey,
    aliasTargetKey: animationTimeline.aliasTargetKey,
    compositeTargets: animationTimeline.compositeTargets,
    showdownInstructionCount: animationTimeline.showdownInstructionCount,
    missingFxAssets: animationTimeline.missingFxAssets,
    timelineSteps: animationTimeline.steps,
    message: "",
    resultText: result.text,
    resultTone: result.tone,
    weatherId: event.kind === "weather" ? event.id : "",
    hpLabel: event.kind === "damage" || event.kind === "heal" ? event.label : "",
  };
}

function resultForSemanticEvent(event: BattleSemanticEventV4): {text: string; tone: BattleAnimationEventV4["resultTone"]} {
  if (event.kind === "damage") return {text: event.label, tone: "bad"};
  if (event.kind === "heal") return {text: event.label, tone: "good"};
  if (event.kind === "result") return {text: event.text, tone: event.tone};
  if (event.kind === "status" || event.kind === "cureStatus") return {text: event.label, tone: "status"};
  if (event.kind === "weather" || event.kind === "field" || event.kind === "sideCondition") return {text: event.label, tone: "weather"};
  if (event.kind === "win") return {text: event.winner, tone: "good"};
  return {text: "", tone: ""};
}

function durationForKind(kind: BattleAnimationKindV4): number {
  if (kind === "switchIn") return 760;
  if (kind === "damage" || kind === "heal") return BATTLE_V4_HP_ANIMATION_DURATION_MS;
  if (kind === "faint") return 820;
  if (kind === "moveEffect") return 720;
  if (kind === "weather") return 900;
  return 520;
}

function replaceSeat(slots: BattleViewSlotV4[], nextSlot: BattleViewSlotV4): BattleViewSlotV4[] {
  return [...slots.filter(slot => slot.seat !== nextSlot.seat), nextSlot].sort(compareSlotsForView);
}

function patchSlot(slots: BattleViewSlotV4[], seat: BattleProtocolSeatV4, patcher: (slot: BattleViewSlotV4) => BattleViewSlotV4): BattleViewSlotV4[] {
  return slots.map(slot => slot.seat === seat ? patcher(slot) : slot);
}

function compareSlotsForView(a: BattleViewSlotV4, b: BattleViewSlotV4): number {
  const sideRank = a.side === b.side ? 0 : a.side === "far" ? -1 : 1;
  if (sideRank) return sideRank;
  const positionRank = a.position.localeCompare(b.position);
  if (positionRank) return positionRank;
  return a.playerId.localeCompare(b.playerId);
}

function sideConditionSideForSeat(seat: BattleProtocolSeatV4): "near" | "far" {
  return seat.startsWith("p2") || seat.startsWith("p4") ? "far" : "near";
}
