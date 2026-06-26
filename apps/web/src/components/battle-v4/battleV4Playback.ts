import {useEffect, useMemo, useRef, useState} from "react";
import type {AppDebugConfigV4, BattleSessionSnapshotV4, BattleViewModelV4, BattleViewSlotV4, LocalPokemonV4, ShowdownPlayerIdV4} from "@changebattle-v2/api";
import {battleDebugLog} from "@changebattle-v2/api";

export type BattleProtocolArgsV4 = [string, ...string[]];
export type BattleProtocolKwArgsV4 = Record<string, string>;
export type BattleProtocolSeatV4 = "p1A" | "p1B" | "p2A" | "p2B" | "";

type BattleVisibleSlotV4 = BattleViewSlotV4 & {
  baseSpeciesId?: string;
  volatileFormeSpeciesId?: string;
  transformedSpeciesId?: string;
  oldSpriteState?: BattleSlotSpriteStateV4;
};

type BattleSlotSpriteStateV4 = Pick<
  BattleViewSlotV4,
  "speciesId" | "spriteUrl" | "frontSpriteUrl" | "backSpriteUrl" | "frontShinySpriteUrl" | "backShinySpriteUrl" | "iconUrl" | "iconStyle"
>;

export type BattleProtocolEventV4 = {
  sequence: number;
  rawLine: string;
  args: BattleProtocolArgsV4;
  kwArgs: BattleProtocolKwArgsV4;
  eventType: string;
  turn: number;
  playerId?: string;
  seat: BattleProtocolSeatV4;
  targetSeat: BattleProtocolSeatV4;
  actorName: string;
  targetName: string;
  moveId: string;
  moveName: string;
  condition: string;
  status: string;
};

export type BattleMessageEventV4 = {
  sequence: number;
  rawLine: string;
  args: BattleProtocolArgsV4;
  kwArgs: BattleProtocolKwArgsV4;
  eventType: string;
  message: string;
  turn: number;
};

export type BattleAnimationKindV4 =
  | "switchOut"
  | "switchIn"
  | "moveStart"
  | "moveEffect"
  | "hit"
  | "damage"
  | "heal"
  | "ability"
  | "weather"
  | "transform"
  | "result"
  | "status"
  | "faint"
  | "message"
  | "turn";

export type BattleAnimationEventV4 = {
  checkpointId: string;
  sequence: number;
  kind: BattleAnimationKindV4;
  rawLine: string;
  args: BattleProtocolArgsV4;
  kwArgs: BattleProtocolKwArgsV4;
  actorSeat: BattleProtocolSeatV4;
  targetSeat: BattleProtocolSeatV4;
  actorName: string;
  targetName: string;
  moveId: string;
  moveName: string;
  condition: string;
  status: string;
  durationMs: number;
  effectSprite: string;
  message: string;
  resultText: string;
  resultTone: "good" | "bad" | "neutral" | "status" | "weather" | "";
  weatherId: string;
  hpLabel: string;
};

export type BattlePlaybackDebugV4 = {
  lastConsumedRawIndex: number;
  hasProtocolState: boolean;
  currentAnimation: BattleAnimationEventV4 | null;
  currentMessage: BattleMessageEventV4 | null;
  protocolEvents: BattleProtocolEventV4[];
  messageEvents: BattleMessageEventV4[];
  animationEvents: BattleAnimationEventV4[];
  animationConsumption: Array<{
    checkpointId: string;
    kind: BattleAnimationKindV4;
    rawLine: string;
    at: string;
    visibleSlotSeatsBefore?: string[];
    visibleSlotSeatsAfter?: string[];
  }>;
  rawIncrements: Array<{
    at: string;
    sessionId: string;
    previousIndex: number;
    rawLength: number;
    rawLines: string[];
    protocolEventCount: number;
    messageEventCount: number;
    animationEventCount: number;
    animationKinds: BattleAnimationKindV4[];
  }>;
  renderProbe: {
    visibleSlotSeats: string[];
    protocolPlaybackStarted: boolean;
    activeAnimationSeat: string;
    activeAnimationKind: string;
    activeAnimationCheckpointId: string;
  };
  queueLength: number;
  skipAnimations: boolean;
};

export type BattlePlaybackStateV4 = {
  nearTeam: BattleViewSlotV4[];
  farTeam: BattleViewSlotV4[];
  messagebar: BattleMessageEventV4 | null;
  activeAnimation: BattleAnimationEventV4 | null;
  hasProtocolState: boolean;
  debug: BattlePlaybackDebugV4;
};

export type BattleV4PreviewPlaybackState = {
  nearTeam: BattleViewSlotV4[];
  farTeam: BattleViewSlotV4[];
  messagebar: BattleMessageEventV4 | null;
  activeAnimation: BattleAnimationEventV4 | null;
  playing: boolean;
  done: boolean;
  debug: {
    protocolEvents: BattleProtocolEventV4[];
    messageEvents: BattleMessageEventV4[];
    animationEvents: BattleAnimationEventV4[];
    animationKinds: BattleAnimationKindV4[];
  };
};

const RAW_NO_DEFAULT_COMMANDS = new Set([
  "chatmsg",
  "chatmsg-raw",
  "raw",
  "error",
  "html",
  "inactive",
  "inactiveoff",
  "warning",
  "fieldhtml",
  "controlshtml",
  "pagehtml",
  "bigerror",
  "debug",
  "tier",
  "challstr",
  "customgroups",
  "popup",
  "",
]);

const THREE_PART_COMMANDS = new Set(["c", "chat", "uhtml", "uhtmlchange", "queryresponse", "showteam"]);
const FOUR_PART_COMMANDS = new Set(["c:", "pm"]);
const MIN_ANIMATION_DURATION_MS = 1000;
const ANIMATION_GAP_MS = 500;

export function parseBattleProtocolLineV4(rawLine: string): {args: BattleProtocolArgsV4; kwArgs: BattleProtocolKwArgsV4} {
  if (!rawLine.startsWith("|")) return {args: ["", rawLine], kwArgs: {}};
  if (rawLine === "|") return {args: ["done"], kwArgs: {}};
  const firstPipe = rawLine.indexOf("|", 1);
  const command = firstPipe >= 0 ? rawLine.slice(1, firstPipe) : rawLine.slice(1);
  if (RAW_NO_DEFAULT_COMMANDS.has(command)) {
    return {args: [command, firstPipe >= 0 ? rawLine.slice(firstPipe + 1) : ""], kwArgs: {}};
  }
  if (THREE_PART_COMMANDS.has(command)) {
    const secondPipe = rawLine.indexOf("|", firstPipe + 1);
    return {args: [command, rawLine.slice(firstPipe + 1, secondPipe), rawLine.slice(secondPipe + 1)], kwArgs: {}};
  }
  if (FOUR_PART_COMMANDS.has(command)) {
    const secondPipe = rawLine.indexOf("|", firstPipe + 1);
    const thirdPipe = rawLine.indexOf("|", secondPipe + 1);
    return {args: [command, rawLine.slice(firstPipe + 1, secondPipe), rawLine.slice(secondPipe + 1, thirdPipe), rawLine.slice(thirdPipe + 1)], kwArgs: {}};
  }
  const args = rawLine.slice(1).split("|") as BattleProtocolArgsV4;
  const kwArgs: BattleProtocolKwArgsV4 = {};
  while (args.length > 1) {
    const lastArg = args[args.length - 1] || "";
    if (!lastArg.startsWith("[")) break;
    const bracketPos = lastArg.indexOf("]");
    if (bracketPos <= 0) break;
    kwArgs[lastArg.slice(1, bracketPos)] = lastArg.slice(bracketPos + 1).trim() || ".";
    args.pop();
  }
  return {args, kwArgs};
}

export function projectBattleProtocolEventsV4(rawLines: string[], previousIndex = 0): BattleProtocolEventV4[] {
  let turn = 0;
  for (let index = 0; index < Math.min(previousIndex, rawLines.length); index += 1) {
    const {args} = parseBattleProtocolLineV4(rawLines[index] || "");
    if (args[0] === "turn") turn = Number(args[1] || turn) || turn;
  }
  const events: BattleProtocolEventV4[] = [];
  for (let index = previousIndex; index < rawLines.length; index += 1) {
    const rawLine = rawLines[index] || "";
    const {args, kwArgs} = parseBattleProtocolLineV4(rawLine);
    if (args[0] === "request") continue;
    if (args[0] === "turn") turn = Number(args[1] || turn) || turn;
    events.push(buildProtocolEvent(index, rawLine, args, kwArgs, turn));
  }
  return events;
}

export function projectBattleMessageEventsV4(events: BattleProtocolEventV4[]): BattleMessageEventV4[] {
  return events
    .map(event => {
      const message = messageForProtocolEvent(event);
      return message ? {
        sequence: event.sequence,
        rawLine: event.rawLine,
        args: event.args,
        kwArgs: event.kwArgs,
        eventType: event.eventType,
        message,
        turn: event.turn,
      } : null;
    })
    .filter((event): event is BattleMessageEventV4 => Boolean(event));
}

export function projectBattleAnimationEventsV4(events: BattleProtocolEventV4[]): BattleAnimationEventV4[] {
  const messages = new Map(projectBattleMessageEventsV4(events).map(event => [event.sequence, event.message]));
  return events.flatMap(event => {
    const message = messages.get(event.sequence) || "";
    switch (event.eventType) {
    case "switch":
      return [animationEvent(event, "switchIn", 760, message)];
    case "drag":
      return [animationEvent(event, "switchIn", 720, message)];
    case "move":
      return [
        animationEvent(event, "moveStart", 700, message),
        animationEvent(event, "moveEffect", 820, message),
      ];
    case "-anim":
      return [animationEvent(event, "moveEffect", 820, message)];
    case "-ability":
      return [animationEvent(event, "ability", 1050, message)];
    case "-weather":
      return [animationEvent(event, "weather", 1250, message)];
    case "detailschange":
    case "-formechange":
    case "-transform":
      return [animationEvent(event, "transform", 1100, message)];
    case "-end":
      return shouldAnimateVolatileEnd(event) ? [animationEvent(event, "transform", 900, message)] : [];
    case "-damage":
      return [animationEvent(event, "damage", 760, message)];
    case "-heal":
      return [animationEvent(event, "heal", 760, message)];
    case "-crit":
    case "-supereffective":
    case "-resisted":
    case "-immune":
    case "-miss":
    case "-fail":
    case "-activate":
      return [animationEvent(event, "result", 820, message)];
    case "-status":
    case "-curestatus":
    case "cant":
      return [animationEvent(event, "status", 760, message)];
    case "faint":
      return [animationEvent(event, "faint", 980, message)];
    case "turn":
      return [animationEvent(event, "turn", 460, message)];
    default:
      return message ? [animationEvent(event, "message", 360, message)] : [];
    }
  });
}

export function useBattleV4Playback(
  snapshot: BattleSessionSnapshotV4 | null,
  viewModel: BattleViewModelV4 | null,
  options: {skipAnimations?: boolean; debugConfig?: AppDebugConfigV4} = {},
): BattlePlaybackStateV4 {
  const skipAnimations = Boolean(options.skipAnimations);
  const debugConfig = options.debugConfig;
  const [visibleSlots, setVisibleSlots] = useState<BattleViewSlotV4[]>([]);
  const [messageEvents, setMessageEvents] = useState<BattleMessageEventV4[]>([]);
  const [protocolEvents, setProtocolEvents] = useState<BattleProtocolEventV4[]>([]);
  const [animationEvents, setAnimationEvents] = useState<BattleAnimationEventV4[]>([]);
  const [animationConsumption, setAnimationConsumption] = useState<BattlePlaybackDebugV4["animationConsumption"]>([]);
  const [rawIncrements, setRawIncrements] = useState<BattlePlaybackDebugV4["rawIncrements"]>([]);
  const [queue, setQueue] = useState<BattleAnimationEventV4[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<BattleAnimationEventV4 | null>(null);
  const [messagebar, setMessagebar] = useState<BattleMessageEventV4 | null>(null);
  const [hasProtocolState, setHasProtocolState] = useState(false);
  const sessionRef = useRef("");
  const rawIndexRef = useRef(0);
  const seededSessionRef = useRef("");
  const playingRef = useRef(false);
  const hasProtocolStateRef = useRef(false);
  const viewModelRef = useRef<BattleViewModelV4 | null>(viewModel);
  const snapshotRef = useRef<BattleSessionSnapshotV4 | null>(snapshot);

  useEffect(() => {
    viewModelRef.current = viewModel;
    snapshotRef.current = snapshot;
  }, [snapshot, viewModel]);

  useEffect(() => {
    if (!snapshot || !viewModel) return;
    if (sessionRef.current !== snapshot.id || rawIndexRef.current > snapshot.rawLog.length) {
      sessionRef.current = snapshot.id;
      rawIndexRef.current = 0;
      seededSessionRef.current = "";
      setVisibleSlots([]);
      setMessageEvents([]);
      setProtocolEvents([]);
      setAnimationEvents([]);
      setAnimationConsumption([]);
      setRawIncrements([]);
      setQueue([]);
      setActiveAnimation(null);
      setMessagebar(null);
      setHasProtocolState(false);
      hasProtocolStateRef.current = false;
      playingRef.current = false;
    }
    if (seededSessionRef.current !== snapshot.id) {
      seededSessionRef.current = snapshot.id;
      rawIndexRef.current = initialPlaybackRawIndex(snapshot.rawLog);
      setVisibleSlots([]);
      if (snapshot.rawLog.length <= rawIndexRef.current) return;
    }
    const previousIndex = rawIndexRef.current;
    if (snapshot.rawLog.length <= previousIndex) return;
    const nextProtocolEvents = projectBattleProtocolEventsV4(snapshot.rawLog, previousIndex);
    const nextMessageEvents = projectBattleMessageEventsV4(nextProtocolEvents);
    const nextAnimationEvents = projectBattleAnimationEventsV4(nextProtocolEvents);
    const rawIncrement = {
      at: new Date().toISOString(),
      sessionId: snapshot.id,
      previousIndex,
      rawLength: snapshot.rawLog.length,
      rawLines: snapshot.rawLog.slice(previousIndex),
      protocolEventCount: nextProtocolEvents.length,
      messageEventCount: nextMessageEvents.length,
      animationEventCount: nextAnimationEvents.length,
      animationKinds: nextAnimationEvents.map(event => event.kind),
    };
    setRawIncrements(items => [...items, rawIncrement].slice(-80));
    if (nextProtocolEvents.length) {
      hasProtocolStateRef.current = true;
      setHasProtocolState(true);
    }
    battleDebugLog(debugConfig, "protocol", "playback-raw-increment", {
      ...rawIncrement,
      protocolEvents: nextProtocolEvents.map(event => ({
        sequence: event.sequence,
        eventType: event.eventType,
        seat: event.seat,
        targetSeat: event.targetSeat,
        moveId: event.moveId,
        rawLine: event.rawLine,
      })),
      animationEvents: nextAnimationEvents.map(event => ({
        checkpointId: event.checkpointId,
        kind: event.kind,
        actorSeat: event.actorSeat,
        targetSeat: event.targetSeat,
        effectSprite: event.effectSprite,
        rawLine: event.rawLine,
      })),
    });
    rawIndexRef.current = snapshot.rawLog.length;
    if (nextProtocolEvents.length) setProtocolEvents(events => [...events, ...nextProtocolEvents].slice(-240));
    if (nextMessageEvents.length) {
      setMessageEvents(events => [...events, ...nextMessageEvents].slice(-240));
      if (skipAnimations || !nextAnimationEvents.length) {
        setMessagebar(nextMessageEvents[nextMessageEvents.length - 1] || null);
      }
    }
    if (nextAnimationEvents.length) {
      setAnimationEvents(events => [...events, ...nextAnimationEvents].slice(-240));
      if (skipAnimations) {
        setVisibleSlots(viewModel.slots);
        hasProtocolStateRef.current = true;
        setHasProtocolState(true);
        setAnimationConsumption(consumed => [
          ...consumed,
          ...nextAnimationEvents.map(event => ({checkpointId: event.checkpointId, kind: event.kind, rawLine: event.rawLine, at: new Date().toISOString()})),
        ].slice(-240));
      } else {
        setQueue(items => [...items, ...nextAnimationEvents]);
      }
    }
  }, [snapshot, viewModel, skipAnimations]);

  useEffect(() => {
    if (skipAnimations && viewModel) {
      setQueue([]);
      setActiveAnimation(null);
      setVisibleSlots(viewModel.slots);
      hasProtocolStateRef.current = true;
      setHasProtocolState(true);
      playingRef.current = false;
    }
  }, [skipAnimations, viewModel]);

  useEffect(() => {
    if (playingRef.current || activeAnimation || skipAnimations || !queue.length) return;
    const [event, ...rest] = queue;
    if (!event) return;
    playingRef.current = true;
    setQueue(rest);
    setActiveAnimation(event);
    battleDebugLog(debugConfig, "protocol", "playback-consume-animation", {
      checkpointId: event.checkpointId,
      kind: event.kind,
      actorSeat: event.actorSeat,
      targetSeat: event.targetSeat,
      effectSprite: event.effectSprite,
      rawLine: event.rawLine,
      remaining: rest.length,
    });
    if (event.message) {
      setMessagebar({
        sequence: event.sequence,
        rawLine: event.rawLine,
        args: [event.kind],
        kwArgs: {},
        eventType: event.kind,
        message: event.message,
        turn: 0,
      });
    }
  }, [queue, activeAnimation, skipAnimations, debugConfig]);

  useEffect(() => {
    if (!activeAnimation || skipAnimations) return;
    const event = activeAnimation;
    const duration = Math.max(MIN_ANIMATION_DURATION_MS, event.durationMs);
    const checkpointTimer = window.setTimeout(() => {
      setVisibleSlots(slots => {
        const nextSlots = applyAnimationCheckpoint(slots, event, viewModelRef.current, snapshotRef.current);
        setAnimationConsumption(consumed => [...consumed, {
          checkpointId: event.checkpointId,
          kind: event.kind,
          rawLine: event.rawLine,
          at: new Date().toISOString(),
          visibleSlotSeatsBefore: slots.map(formatVisibleSlotSeat),
          visibleSlotSeatsAfter: nextSlots.map(formatVisibleSlotSeat),
        }].slice(-240));
        return nextSlots;
      });
    }, duration);
    const releaseTimer = window.setTimeout(() => {
      setActiveAnimation(null);
      playingRef.current = false;
    }, duration + ANIMATION_GAP_MS);
    return () => {
      window.clearTimeout(checkpointTimer);
      window.clearTimeout(releaseTimer);
    };
  }, [activeAnimation, skipAnimations]);

  const hasProtocolFacts = Boolean(snapshot && snapshot.rawLog.length > initialPlaybackRawIndex(snapshot.rawLog));
  const shouldUseProtocolState = hasProtocolState || hasProtocolFacts || skipAnimations;
  const visibleNearTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "near"), [visibleSlots]);
  const visibleFarTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "far"), [visibleSlots]);
  return {
    nearTeam: visibleNearTeam,
    farTeam: visibleFarTeam,
    messagebar,
    activeAnimation,
    hasProtocolState: shouldUseProtocolState,
    debug: {
      lastConsumedRawIndex: rawIndexRef.current,
      hasProtocolState: shouldUseProtocolState,
      currentAnimation: activeAnimation,
      currentMessage: messagebar,
      protocolEvents,
      messageEvents,
      animationEvents,
      animationConsumption,
      rawIncrements,
      renderProbe: {
        visibleSlotSeats: visibleSlots.map(formatVisibleSlotSeat),
        protocolPlaybackStarted: shouldUseProtocolState,
        activeAnimationSeat: activeAnimation ? activeAnimation.targetSeat || activeAnimation.actorSeat : "",
        activeAnimationKind: activeAnimation?.kind || "",
        activeAnimationCheckpointId: activeAnimation?.checkpointId || "",
      },
      queueLength: queue.length,
      skipAnimations,
    },
  };
}

export function useBattleV4PreviewPlayback(
  rawLines: string[],
  initialSlots: BattleViewSlotV4[],
  seed: string,
): BattleV4PreviewPlaybackState {
  const projected = useMemo(() => {
    const protocolEvents = projectBattleProtocolEventsV4(rawLines, 0);
    const messageEvents = projectBattleMessageEventsV4(protocolEvents);
    const animationEvents = projectBattleAnimationEventsV4(protocolEvents);
    return {protocolEvents, messageEvents, animationEvents};
  }, [rawLines]);
  const [visibleSlots, setVisibleSlots] = useState<BattleViewSlotV4[]>(initialSlots);
  const [queue, setQueue] = useState<BattleAnimationEventV4[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<BattleAnimationEventV4 | null>(null);
  const [messagebar, setMessagebar] = useState<BattleMessageEventV4 | null>(null);
  const [done, setDone] = useState(false);
  const playingRef = useRef(false);

  useEffect(() => {
    setVisibleSlots(initialSlots);
    setQueue(projected.animationEvents);
    setActiveAnimation(null);
    setMessagebar(null);
    setDone(projected.animationEvents.length === 0);
    playingRef.current = false;
  }, [initialSlots, projected.animationEvents, seed]);

  useEffect(() => {
    if (playingRef.current || activeAnimation || !queue.length) return;
    const [event, ...rest] = queue;
    if (!event) return;
    playingRef.current = true;
    setQueue(rest);
    setActiveAnimation(event);
    if (event.message) {
      setMessagebar({
        sequence: event.sequence,
        rawLine: event.rawLine,
        args: [event.kind],
        kwArgs: {},
        eventType: event.kind,
        message: event.message,
        turn: 0,
      });
    }
  }, [activeAnimation, queue]);

  useEffect(() => {
    if (!activeAnimation) return;
    const event = activeAnimation;
    const duration = Math.max(MIN_ANIMATION_DURATION_MS, event.durationMs);
    const checkpointTimer = window.setTimeout(() => {
      setVisibleSlots(slots => applyAnimationCheckpoint(slots, event, null, null));
    }, duration);
    const releaseTimer = window.setTimeout(() => {
      setActiveAnimation(null);
      playingRef.current = false;
      if (!queue.length) setDone(true);
    }, duration + ANIMATION_GAP_MS);
    return () => {
      window.clearTimeout(checkpointTimer);
      window.clearTimeout(releaseTimer);
    };
  }, [activeAnimation, queue.length]);

  const nearTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "near"), [visibleSlots]);
  const farTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "far"), [visibleSlots]);
  return {
    nearTeam,
    farTeam,
    messagebar,
    activeAnimation,
    playing: Boolean(activeAnimation || queue.length),
    done,
    debug: {
      protocolEvents: projected.protocolEvents,
      messageEvents: projected.messageEvents,
      animationEvents: projected.animationEvents,
      animationKinds: projected.animationEvents.map(event => event.kind),
    },
  };
}

function buildProtocolEvent(
  sequence: number,
  rawLine: string,
  args: BattleProtocolArgsV4,
  kwArgs: BattleProtocolKwArgsV4,
  turn: number,
): BattleProtocolEventV4 {
  const eventType = args[0] || "";
  const actor = eventType === "-weather" ? kwArgs.of || args[1] || "" : args[1] || "";
  const target = targetArgForEvent(eventType, args);
  const actorParts = parsePokemonProtocolIdent(actor);
  const targetParts = parsePokemonProtocolIdent(target);
  const moveName = eventType === "move" || eventType === "-anim" ? args[2] || "" : kwArgs.move || args[3] || "";
  return {
    sequence,
    rawLine,
    args,
    kwArgs,
    eventType,
    turn,
    playerId: actorParts.playerId,
    seat: actorParts.seat,
    targetSeat: targetParts.seat,
    actorName: actorParts.name || actor,
    targetName: targetParts.name || target,
    moveId: toId(moveName),
    moveName,
    condition: conditionArgFor(args),
    status: statusArgFor(args, kwArgs),
  };
}

function targetArgForEvent(eventType: string, args: BattleProtocolArgsV4): string {
  if (eventType === "move" || eventType === "-anim") return args[3] || "";
  if (eventType === "-transform") return args[2] || "";
  if (eventType === "-miss") return args[2] || "";
  if (eventType === "-supereffective" || eventType === "-resisted" || eventType === "-crit" || eventType === "-immune" || eventType === "-fail" || eventType === "-activate") return args[1] || "";
  return args[1] || "";
}

function animationEvent(event: BattleProtocolEventV4, kind: BattleAnimationKindV4, durationMs: number, message: string): BattleAnimationEventV4 {
  const result = resultForProtocolEvent(event);
  return {
    checkpointId: `${event.sequence}-${kind}`,
    sequence: event.sequence,
    kind,
    rawLine: event.rawLine,
    args: event.args,
    kwArgs: event.kwArgs,
    actorSeat: event.seat,
    targetSeat: event.targetSeat || event.seat,
    actorName: event.actorName,
    targetName: event.targetName,
    moveId: event.moveId,
    moveName: event.moveName,
    condition: event.condition,
    status: event.status,
    durationMs,
    effectSprite: effectSpriteForMove(event.moveId, kind),
    message,
    resultText: result.text,
    resultTone: result.tone,
    weatherId: event.eventType === "-weather" ? toId(event.args[1]) : "",
    hpLabel: "",
  };
}

function applyAnimationCheckpoint(
  slots: BattleViewSlotV4[],
  event: BattleAnimationEventV4,
  viewModel: BattleViewModelV4 | null,
  snapshot: BattleSessionSnapshotV4 | null,
): BattleViewSlotV4[] {
  if (event.kind === "switchIn") {
    const nextSlot = slotFromSwitchEvent(event, snapshot, viewModel);
    if (!nextSlot) return slots;
    const withoutSeat = slots.filter(slot => slot.seat !== nextSlot.seat);
    return [...withoutSeat, resetSlotFormeState(nextSlot)].sort(compareSlotsForView);
  }
  if (event.kind === "faint") return patchSlot(slots, event.actorSeat, slot => ({...slot, hp: 0, status: "fnt", fainted: true}));
  if (event.kind === "damage" || event.kind === "heal") {
    const parsed = parseCondition(event.condition);
    if (!parsed) return slots;
    return patchSlot(slots, event.actorSeat, slot => ({
      ...slot,
      hp: parsed.hp,
      maxHp: parsed.maxHp || slot.maxHp,
      status: parsed.status || slot.status,
      fainted: parsed.fainted,
    }));
  }
  if (event.kind === "status" && event.status) {
    return patchSlot(slots, event.actorSeat, slot => ({
      ...slot,
      status: event.status === "clear" ? "" : event.status,
      fainted: event.status === "fnt" ? true : slot.fainted,
    }));
  }
  if (event.kind === "transform") {
    return patchSlot(slots, event.actorSeat, slot => patchSlotForme(slot, event, slots));
  }
  return slots;
}

function patchSlotForme(slot: BattleViewSlotV4, event: BattleAnimationEventV4, slots: BattleViewSlotV4[]): BattleViewSlotV4 {
  const currentSlot = ensureVisibleSlotState(slot);
  if (event.rawLine.startsWith("|-end|")) return restoreSlotFormeState(currentSlot);
  const targetSlot = event.rawLine.startsWith("|-transform|")
    ? slots.find(entry => entry.seat === event.targetSeat)
    : undefined;
  const speciesId = transformedSpeciesIdForEvent(event, targetSlot);
  if (!speciesId) return slot;
  const isTransform = event.rawLine.startsWith("|-transform|");
  const isPermanent = event.rawLine.startsWith("|detailschange|");
  const nextSlot: BattleVisibleSlotV4 = {
    ...currentSlot,
    baseSpeciesId: isPermanent ? speciesId : currentSlot.baseSpeciesId || currentSlot.speciesId,
    volatileFormeSpeciesId: isPermanent ? undefined : speciesId,
    transformedSpeciesId: isTransform ? speciesId : undefined,
    oldSpriteState: isPermanent ? undefined : currentSlot.oldSpriteState || spriteStateFromSlot(currentSlot),
  };
  if (!isTransform) {
    const name = cleanSpeciesForme(event.args[2] || speciesId);
    nextSlot.name = name;
    nextSlot.nameZh = name;
  }
  return applySlotSpriteForme(nextSlot, speciesId, targetSlot);
}

function transformedSpeciesIdForEvent(event: BattleAnimationEventV4, targetSlot?: BattleViewSlotV4): string {
  if (event.rawLine.startsWith("|detailschange|")) return toId((event.args[2] || "").split(",")[0]);
  if (event.rawLine.startsWith("|-formechange|")) return toId(event.args[2] || "");
  if (event.rawLine.startsWith("|-transform|")) {
    return toId(event.args[3] || currentSpeciesForme(targetSlot) || event.targetName || "");
  }
  return "";
}

function shouldAnimateVolatileEnd(event: BattleProtocolEventV4): boolean {
  if (event.eventType !== "-end") return false;
  const effectId = toId(event.args[2]);
  return effectId === "formechange" || effectId === "transform" || effectId === "dynamax";
}

function ensureVisibleSlotState(slot: BattleViewSlotV4): BattleVisibleSlotV4 {
  const state = slot as BattleVisibleSlotV4;
  if (!state.baseSpeciesId) state.baseSpeciesId = state.speciesId;
  return state;
}

function resetSlotFormeState(slot: BattleViewSlotV4): BattleVisibleSlotV4 {
  const state = slot as BattleVisibleSlotV4;
  return {
    ...state,
    baseSpeciesId: state.speciesId,
    volatileFormeSpeciesId: undefined,
    transformedSpeciesId: undefined,
    oldSpriteState: undefined,
  };
}

function restoreSlotFormeState(slot: BattleVisibleSlotV4): BattleVisibleSlotV4 {
  if (!slot.oldSpriteState) {
    return {
      ...slot,
      baseSpeciesId: slot.baseSpeciesId || slot.speciesId,
      volatileFormeSpeciesId: undefined,
      transformedSpeciesId: undefined,
    };
  }
  return {
    ...slot,
    ...slot.oldSpriteState,
    baseSpeciesId: slot.baseSpeciesId || slot.oldSpriteState.speciesId,
    volatileFormeSpeciesId: undefined,
    transformedSpeciesId: undefined,
    oldSpriteState: undefined,
  };
}

function applySlotSpriteForme(slot: BattleVisibleSlotV4, speciesId: string, targetSlot?: BattleViewSlotV4): BattleViewSlotV4 {
  const fallback = spriteUrlsForSpecies(speciesId);
  const target = targetSlot ? ensureVisibleSlotState(targetSlot) : undefined;
  const frontSpriteUrl = firstLargeSprite(target?.frontSpriteUrl, fallback.frontSpriteUrl);
  const backSpriteUrl = firstLargeSprite(target?.backSpriteUrl, fallback.backSpriteUrl, target?.frontSpriteUrl, fallback.frontSpriteUrl);
  const frontShinySpriteUrl = firstLargeSprite(target?.frontShinySpriteUrl, fallback.frontShinySpriteUrl, frontSpriteUrl);
  const backShinySpriteUrl = firstLargeSprite(target?.backShinySpriteUrl, fallback.backShinySpriteUrl, backSpriteUrl);
  return {
    ...slot,
    speciesId,
    spriteUrl: slot.side === "near" ? backSpriteUrl : frontSpriteUrl,
    frontSpriteUrl,
    backSpriteUrl,
    frontShinySpriteUrl,
    backShinySpriteUrl,
    iconUrl: target?.iconUrl || "/showdown/sprites/pokemonicons-sheet.png",
    iconStyle: target?.iconStyle || slot.iconStyle,
  };
}

function spriteStateFromSlot(slot: BattleViewSlotV4): BattleSlotSpriteStateV4 {
  return {
    speciesId: slot.speciesId,
    spriteUrl: slot.spriteUrl,
    frontSpriteUrl: slot.frontSpriteUrl,
    backSpriteUrl: slot.backSpriteUrl,
    frontShinySpriteUrl: slot.frontShinySpriteUrl,
    backShinySpriteUrl: slot.backShinySpriteUrl,
    iconUrl: slot.iconUrl,
    iconStyle: slot.iconStyle,
  };
}

function spriteUrlsForSpecies(speciesId: string): Pick<BattleViewSlotV4, "frontSpriteUrl" | "backSpriteUrl" | "frontShinySpriteUrl" | "backShinySpriteUrl"> {
  const spriteId = showdownSpriteIdForSpecies(speciesId);
  return {
    frontSpriteUrl: `/showdown/sprites/ani/${spriteId}.gif`,
    backSpriteUrl: `/showdown/sprites/ani-back/${spriteId}.gif`,
    frontShinySpriteUrl: `/showdown/sprites/ani-shiny/${spriteId}.gif`,
    backShinySpriteUrl: `/showdown/sprites/ani-back-shiny/${spriteId}.gif`,
  };
}

function currentSpeciesForme(slot?: BattleViewSlotV4): string {
  if (!slot) return "";
  const state = ensureVisibleSlotState(slot);
  return state.volatileFormeSpeciesId || state.transformedSpeciesId || state.speciesId;
}

function showdownSpriteIdForSpecies(speciesId: string): string {
  const known: Record<string, string> = {
    cherrimsunshine: "cherrim-sunshine",
    castformsunny: "castform-sunny",
    castformrainy: "castform-rainy",
    castformsnowy: "castform-snowy",
    aegislashblade: "aegislash-blade",
    wishiwashischool: "wishiwashi-school",
    darmanitanzen: "darmanitan-zen",
    palafinhero: "palafin-hero",
  };
  if (known[speciesId]) return known[speciesId]!;
  return speciesId.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function slotFromSwitchEvent(
  event: BattleAnimationEventV4,
  snapshot: BattleSessionSnapshotV4 | null,
  viewModel: BattleViewModelV4 | null,
): BattleViewSlotV4 | null {
  const parsed = parseSwitchDetails(event);
  const playerId = parsed.playerId;
  if (!playerId || !event.actorSeat || !snapshot) {
    return viewModel?.slots.find(slot => slot.seat === event.actorSeat) || null;
  }
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  const side = player?.alliance === "far" ? "far" : "near";
  const team = player?.draft.localTeam.pokemon || [];
  const pokemon = resolveLocalPokemonForProtocolSwitch(parsed, team);
  if (!pokemon) return viewModel?.slots.find(slot => slot.seat === event.actorSeat) || null;
  const condition = parseCondition(parsed.condition || "");
  return {
    seat: event.actorSeat,
    playerId,
    side,
    position: event.actorSeat.endsWith("B") ? "B" : "A",
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: pokemon.showdownIdentityToken,
    showdownId: pokemon.showdownId,
    pokeballId: pokemon.pokeballId,
    active: true,
    fainted: condition?.fainted ?? pokemon.entryHp <= 0,
    name: pokemon.name,
    nameZh: pokemon.nameZh,
    speciesId: pokemon.speciesId,
    level: parsed.level || pokemon.level,
    hp: condition?.hp ?? pokemon.entryHp,
    maxHp: condition?.maxHp || pokemon.maxHp,
    status: condition?.status || pokemon.entryStatus,
    spriteUrl: side === "near"
      ? firstLargeSprite(pokemon.backSpriteUrl, pokemon.spriteUrl)
      : firstLargeSprite(pokemon.frontSpriteUrl, pokemon.spriteUrl),
    frontSpriteUrl: firstLargeSprite(pokemon.frontSpriteUrl, pokemon.spriteUrl),
    backSpriteUrl: firstLargeSprite(pokemon.backSpriteUrl, pokemon.spriteUrl),
    frontShinySpriteUrl: firstLargeSprite(pokemon.frontShinySpriteUrl, pokemon.shinySpriteUrl, pokemon.frontSpriteUrl, pokemon.spriteUrl),
    backShinySpriteUrl: firstLargeSprite(pokemon.backShinySpriteUrl, pokemon.shinySpriteUrl, pokemon.backSpriteUrl, pokemon.spriteUrl),
    iconUrl: pokemon.iconUrl || pokemon.spriteUrl || "",
    iconStyle: pokemon.iconStyle,
    teamBallStates: teamBallStates(team, pokemon.localPokemonId),
  };
}

function parseSwitchDetails(event: BattleAnimationEventV4): {
  playerId: ShowdownPlayerIdV4 | "";
  species: string;
  condition: string;
  level: number;
  gender: string;
  shiny: boolean;
} {
  const {playerId} = parsePokemonProtocolIdent(event.args?.[1] || "");
  const details = event.args?.[2] || event.actorName;
  const condition = event.args?.[3] || event.condition;
  const parts = details.split(",").map(part => part.trim()).filter(Boolean);
  const levelPart = parts.find(part => /^L\d+$/i.test(part));
  return {
    playerId: (playerId || "") as ShowdownPlayerIdV4 | "",
    species: parts[0] || event.actorName,
    condition,
    level: levelPart ? Number(levelPart.slice(1)) || 0 : 0,
    gender: parts.find(part => part === "M" || part === "F") || "",
    shiny: parts.some(part => toId(part) === "shiny"),
  };
}

function resolveLocalPokemonForProtocolSwitch(
  parsed: ReturnType<typeof parseSwitchDetails>,
  team: LocalPokemonV4[],
): LocalPokemonV4 | null {
  const species = toId(parsed.species);
  const condition = parseCondition(parsed.condition || "");
  const candidates = team.filter(pokemon =>
    toId(pokemon.speciesId) === species ||
    toId(pokemon.name) === species ||
    toId(pokemon.nameZh) === species ||
    toId(pokemon.nickname) === species
  );
  if (!candidates.length) return null;
  const byCondition = candidates.find(pokemon => {
    const hpMatches = condition ? pokemon.entryHp === condition.hp || pokemon.maxHp === condition.maxHp : true;
    const statusMatches = condition?.status ? pokemon.entryStatus === condition.status : true;
    const faintMatches = condition?.fainted ? pokemon.entryHp <= 0 : true;
    return hpMatches && statusMatches && faintMatches;
  });
  return byCondition || candidates[0] || null;
}

function firstLargeSprite(...values: Array<string | undefined>): string {
  return values.find(value => value && !value.includes("pokemonicons-sheet")) || "";
}

function teamBallStates(team: LocalPokemonV4[], activeLocalPokemonId: string): BattleViewSlotV4["teamBallStates"] {
  const states: BattleViewSlotV4["teamBallStates"] = team.slice(0, 6).map(pokemon => {
    if (pokemon.localPokemonId === activeLocalPokemonId) return "normal" as const;
    if (pokemon.entryHp <= 0) return "fainted" as const;
    if (pokemon.entryStatus) return "status" as const;
    return "normal" as const;
  });
  while (states.length < 6) states.push("empty");
  return states;
}

function compareSlotsForView(a: BattleViewSlotV4, b: BattleViewSlotV4): number {
  const sideOrder = a.side === b.side ? 0 : a.side === "far" ? -1 : 1;
  if (sideOrder) return sideOrder;
  return a.position.localeCompare(b.position);
}

function patchSlot(slots: BattleViewSlotV4[], seat: BattleProtocolSeatV4, patch: (slot: BattleViewSlotV4) => BattleViewSlotV4): BattleViewSlotV4[] {
  if (!seat) return slots;
  return slots.map(slot => slot.seat === seat ? patch(slot) : slot);
}

function formatVisibleSlotSeat(slot: BattleViewSlotV4): string {
  const speciesSuffix = slot.speciesId && toId(slot.name) !== toId(slot.speciesId) ? `[${slot.speciesId}]` : "";
  return `${slot.seat}:${slot.name || slot.speciesId}${speciesSuffix}${slot.fainted ? ":fnt" : ""}:${slot.hp}/${slot.maxHp}`;
}

function initialPlaybackRawIndex(rawLines: string[]): number {
  const startIndex = rawLines.findIndex(line => line === "|start");
  if (startIndex >= 0) return startIndex;
  const firstBattleEvent = rawLines.findIndex(line => {
    const {args} = parseBattleProtocolLineV4(line || "");
    return args[0] === "switch" ||
      args[0] === "drag" ||
      args[0] === "move" ||
      args[0] === "faint" ||
      args[0] === "-ability" ||
      args[0] === "-weather";
  });
  return firstBattleEvent >= 0 ? firstBattleEvent : rawLines.length;
}

function parsePokemonProtocolIdent(value: string): {playerId?: string; seat: BattleProtocolSeatV4; name: string} {
  const match = /^(p[1-4])([a-z])?:\s*(.*)$/i.exec(value || "");
  if (!match) return {seat: "", name: value || ""};
  const playerId = match[1]!.toLowerCase();
  const position = (match[2] || "a").toLowerCase();
  return {
    playerId,
    seat: seatForProtocolSlot(playerId, position),
    name: match[3] || "",
  };
}

function seatForProtocolSlot(playerId: string, position: string): BattleProtocolSeatV4 {
  if (playerId === "p3") return "p1B";
  if (playerId === "p4") return "p2B";
  if (playerId === "p1") return position === "b" ? "p1B" : "p1A";
  if (playerId === "p2") return position === "b" ? "p2B" : "p2A";
  return "";
}

function messageForProtocolEvent(event: BattleProtocolEventV4): string {
  const name = event.actorName || event.args[1] || "";
  const target = event.targetName || event.args[3] || "";
  const forme = event.args[2] || "";
  switch (event.eventType) {
  case "turn":
    return `Turn ${event.args[1] || event.turn}`;
  case "switch":
    return `${name} switched in!`;
  case "drag":
    return `${name} was dragged out!`;
  case "move":
    return `${name} 使用了${event.moveName || event.args[2] || "技能"}${target ? `！` : "！"}`;
  case "cant":
    return `${name}无法行动${event.args[2] ? `：${resultTextForStatus(toId(event.args[2]))}` : ""}。`;
  case "faint":
    return `${name}倒下了！`;
  case "-damage":
    return `${name}受到了伤害。`;
  case "-heal":
    return `${name}回复了体力。`;
  case "-ability":
    return `${name}的${cleanEffect(event.args[2] || "特性")}发动了！`;
  case "-weather":
    return weatherMessage(event);
  case "detailschange":
    return `${name}的样子改变了！`;
  case "-formechange":
    return forme ? `${name}变成了${forme}！` : `${name}的样子改变了！`;
  case "-transform":
    return `${name}变身了！`;
  case "-crit":
    return "击中了要害！";
  case "-supereffective":
    return "效果拔群！";
  case "-resisted":
    return "收效甚微...";
  case "-status":
    return `${name}${statusMessage(event.status)}。`;
  case "-curestatus":
    return `${name}的${resultTextForStatus(toId(event.args[2]))}解除了。`;
  case "-immune":
    return `${name}没有受到影响。`;
  case "-miss":
    return "可惜没有命中！";
  case "win":
    return `${event.args[1] || "训练师"}获得了胜利！`;
  case "error":
    return event.args[1] || "Battle error";
  default:
    return "";
  }
}

function conditionArgFor(args: BattleProtocolArgsV4): string {
  if (args[0] === "-damage" || args[0] === "-heal") return args[2] || "";
  return "";
}

function statusArgFor(args: BattleProtocolArgsV4, kwArgs: BattleProtocolKwArgsV4): string {
  if (args[0] === "-status") return toId(args[2]);
  if (args[0] === "-curestatus") return "clear";
  if (args[0] === "cant") return toId(args[2] || kwArgs.from || "");
  if (args[0] === "-damage" || args[0] === "-heal") return parseCondition(args[2] || "")?.status || "";
  return "";
}

function parseCondition(condition: string): {hp: number; maxHp: number; status: string; fainted: boolean} | null {
  if (!condition) return null;
  if (condition.includes("fnt")) return {hp: 0, maxHp: 0, status: "fnt", fainted: true};
  const match = /^(\d+)\/(\d+)(?:\s+([a-z]+))?/i.exec(condition);
  if (!match) return null;
  const hp = Number(match[1] || 0);
  const maxHp = Number(match[2] || 0);
  return {hp, maxHp, status: toId(match[3] || ""), fainted: hp <= 0};
}

function effectSpriteForMove(moveId: string, kind: BattleAnimationKindV4): string {
  if (kind === "damage" || kind === "hit") return "impact";
  if (kind === "heal") return "shine";
  if (kind === "status" || kind === "result" || kind === "ability") return "wisp";
  if (kind === "transform") return "shine";
  if (kind === "weather") return "shine";
  if (kind === "switchIn" || kind === "switchOut") return "pokeball";
  if (!moveId) return "impact";
  if (/eruption/.test(moveId)) return "fireball";
  if (/fire|flame|burn|blast|heat|flare|pyro/.test(moveId)) return "fireball";
  if (/water|aqua|hydro|surf|steam/.test(moveId)) return "waterwisp";
  if (/thunder|volt|spark|shock|electro|bolt/.test(moveId)) return "electroball";
  if (/ice|snow|freeze|blizzard/.test(moveId)) return "iceball";
  if (/leaf|grass|seed|petal|vine/.test(moveId)) return "leaf1";
  if (/poison|sludge|toxic|venom/.test(moveId)) return "poisonwisp";
  if (/shadow|ghost|dark|night/.test(moveId)) return "shadowball";
  if (/psych|confusion|psy/.test(moveId)) return "mistball";
  if (/slash|cut|claw/.test(moveId)) return "leftslash";
  return "impact";
}

function resultForProtocolEvent(event: BattleProtocolEventV4): {text: string; tone: BattleAnimationEventV4["resultTone"]} {
  switch (event.eventType) {
  case "-ability":
    return {text: cleanEffect(event.args[2] || "特性"), tone: "good"};
  case "-weather":
    return {text: weatherLabel(toId(event.args[1])), tone: "weather"};
  case "detailschange":
  case "-formechange":
    return {text: cleanSpeciesForme(event.args[2] || "形态变化"), tone: "good"};
  case "-transform":
    return {text: "Transformed", tone: "good"};
  case "-crit":
    return {text: "击中要害", tone: "bad"};
  case "-supereffective":
    return {text: "效果拔群", tone: "bad"};
  case "-resisted":
    return {text: "收效甚微", tone: "neutral"};
  case "-immune":
    return {text: "没有效果", tone: "neutral"};
  case "-miss":
    return {text: "未命中", tone: "neutral"};
  case "-fail":
    return {text: "失败", tone: "neutral"};
  case "-activate":
    return {text: cleanEffect(event.args[2] || "发动"), tone: "neutral"};
  case "-status":
    return {text: resultTextForStatus(event.status), tone: "status"};
  case "-curestatus":
    return {text: `${resultTextForStatus(toId(event.args[2]))}解除`, tone: "good"};
  case "cant":
    return {text: resultTextForStatus(toId(event.args[2])) || "无法行动", tone: "neutral"};
  case "-damage":
  case "-heal":
    return {text: "", tone: event.eventType === "-heal" ? "good" : "bad"};
  default:
    return {text: "", tone: ""};
  }
}

function weatherMessage(event: BattleProtocolEventV4): string {
  const weather = toId(event.args[1]);
  const source = event.actorName;
  if (weather === "sunnyday") return source ? `${source}的日照让阳光变强了！` : "阳光变强了！";
  if (weather === "raindance") return "开始下雨了！";
  if (weather === "sandstorm") return "沙暴刮起来了！";
  if (weather === "hail" || weather === "snow") return "开始下雪了！";
  if (!weather || weather === "none") return "天气恢复了正常。";
  return `${weatherLabel(weather)}开始了！`;
}

function weatherLabel(weather: string): string {
  const labels: Record<string, string> = {
    sunnyday: "晴天",
    raindance: "雨天",
    sandstorm: "沙暴",
    hail: "冰雹",
    snow: "雪景",
    desolateland: "大日照",
    primordialsea: "大雨",
    deltastream: "乱流",
  };
  return labels[weather] || cleanEffect(weather) || "天气";
}

function statusMessage(status: string): string {
  const labels: Record<string, string> = {
    brn: "被烧伤了",
    par: "麻痹了",
    psn: "中毒了",
    tox: "中了剧毒",
    slp: "睡着了",
    frz: "被冰冻了",
    fnt: "倒下了",
  };
  return labels[status] || "状态改变了";
}

function resultTextForStatus(status: string): string {
  const labels: Record<string, string> = {
    brn: "烧伤",
    par: "麻痹",
    psn: "中毒",
    tox: "剧毒",
    slp: "睡眠",
    frz: "冰冻",
    fnt: "倒下",
    recharge: "必须充能",
    flinch: "畏缩",
    attract: "着迷",
  };
  return labels[status] || cleanEffect(status);
}

function cleanEffect(value: string): string {
  return String(value || "").replace(/^(move|ability|item):/i, "").trim();
}

function cleanSpeciesForme(value: string): string {
  return String(value || "").split(",")[0]!.trim();
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
