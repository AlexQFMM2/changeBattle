import {useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction} from "react";
import type {AppDebugConfigV4, BattleSessionSnapshotV4, BattleViewModelV4, BattleViewSlotV4, LocalPokemonV4, ShowdownPlayerIdV4} from "@changebattle-v2/api";
import {battleDebugLog} from "@changebattle-v2/api";
import {
  effectSpriteForShowdownAnimationV4,
  projectShowdownAnimationTimelineV4,
  selectShowdownAnimationKeyV4,
  type ShowdownAnimationSourceV4,
  type ShowdownAnimationStepV4,
  type ShowdownAnimationTimelineV4,
  type ShowdownAnimationFidelityV4,
} from "./battleV4ShowdownAnimationAdapter";
import {createBattleV4MessageQueue, type BattleMessageQueueItemV4} from "./battleV4MessageFlow";
import {executeBattleV4Protocol, type BattleRuntimeStateV4, type BattleSemanticEventV4} from "./battleV4ProtocolExecutor";
import {
  applyBattleV4HpTweenFrame,
  applyBattleV4HpTweenTarget,
  applyBattleV4PersistentFieldVisuals,
  applyBattleV4PersistentSideConditionVisuals,
  applyBattleV4VisualCommandSettle,
  applyBattleV4VisualCommandStart,
  createBattleV4VisualCommands,
  visualSlotsFromRuntimeState,
  type BattleHpTweenV4,
  type BattleVisualCommandV4,
} from "./battleV4VisualScene";

export type BattleProtocolArgsV4 = [string, ...string[]];
export type BattleProtocolKwArgsV4 = Record<string, string>;
export type BattleProtocolSeatV4 =
  | "p1A" | "p1B"
  | "p2A" | "p2B"
  | "p3A" | "p3B"
  | "p4A" | "p4B"
  | "";

type BattleSwitchInVisualCommandV4 = BattleVisualCommandV4 & {
  semanticEvent: BattleSemanticEventV4 & {kind: "switchIn"; seat: BattleProtocolSeatV4; rawLine: string};
};

type BattleVisibleSlotV4 = BattleViewSlotV4 & {
  baseSpeciesId?: string;
  volatileFormeSpeciesId?: string;
  transformedSpeciesId?: string;
  oldSpriteState?: BattleSlotSpriteStateV4;
  teraType?: string;
  terastallized?: boolean;
  dynamaxActive?: boolean;
  specialFormeKind?: "mega" | "primal" | "ultra" | "";
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
  seatExplicit: boolean;
  targetSeat: BattleProtocolSeatV4;
  targetSeatExplicit: boolean;
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
  actorSeatExplicit: boolean;
  targetSeat: BattleProtocolSeatV4;
  targetSeatExplicit: boolean;
  actorName: string;
  targetName: string;
  moveId: string;
  moveName: string;
  condition: string;
  status: string;
  durationMs: number;
  effectSprite: string;
  selectedAnimationKey: string;
  animationSource: ShowdownAnimationSourceV4;
  animationTimeline: ShowdownAnimationTimelineV4;
  adapterFidelity: ShowdownAnimationFidelityV4;
  sourceKey: string;
  aliasTargetKey: string;
  compositeTargets: string[];
  showdownInstructionCount: number;
  missingFxAssets: string[];
  timelineSteps: ShowdownAnimationTimelineV4["steps"];
  message: string;
  resultText: string;
  resultTone: "good" | "bad" | "neutral" | "status" | "weather" | "";
  weatherId: string;
  hpLabel: string;
};

export type BattleV4PersistentFieldVisuals = {
  weatherId: string;
  terrainId: string;
  roomId: string;
  gravityActive: boolean;
  sourceRawLine: string;
  resourcePath: string;
  resourceKind: "video" | "image" | "";
  adapterFidelity: ShowdownAnimationFidelityV4;
  renderedWeatherLayer: string;
  missingFxAssets: string[];
};

export type BattleV4SideConditionSideV4 = "near" | "far";

export type BattleV4SideConditionVisualV4 = {
  id: string;
  label: string;
  side: BattleV4SideConditionSideV4;
  sourceRawLine: string;
  adapterFidelity: ShowdownAnimationFidelityV4;
};

export type BattleV4PersistentSideConditionVisuals = {
  near: BattleV4SideConditionVisualV4[];
  far: BattleV4SideConditionVisualV4[];
  sourceRawLine: string;
  adapterFidelity: ShowdownAnimationFidelityV4;
};

export type BattlePlaybackDebugV4 = {
  lastConsumedRawIndex: number;
  hasProtocolState: boolean;
  currentAnimation: BattleAnimationEventV4 | null;
  openingSwitchInSeats: BattleProtocolSeatV4[];
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
    selectedAnimationKey?: string;
    timelineSteps?: ShowdownAnimationTimelineV4["steps"];
    consumedCheckpoints?: string[];
    activeTimelineStepIndex?: number;
    activeTimelineStep?: ShowdownAnimationStepV4 | null;
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
    selectedAnimationKeys: string[];
  }>;
  renderProbe: {
    visibleSlotSeats: string[];
    protocolPlaybackStarted: boolean;
    activeAnimationSeat: string;
    activeAnimationKind: string;
    activeAnimationCheckpointId: string;
    activeTimelineId: string;
    activeTimelineStepIndex: number;
    activeTimelineStep: ShowdownAnimationStepV4 | null;
    openingSwitchInSeats: BattleProtocolSeatV4[];
    renderedTimelineSteps: ShowdownAnimationStepV4[];
    persistentFieldVisuals: BattleV4PersistentFieldVisuals;
    persistentSideConditionVisuals: BattleV4PersistentSideConditionVisuals;
  };
  persistentWeatherState: BattleV4PersistentFieldVisuals;
  renderedWeatherLayer: string;
  missingFxAssets: string[];
  activeTimelineId: string;
  activeTimelineStep: ShowdownAnimationStepV4 | null;
  activeTimelineStepIndex: number;
  renderedTimelineSteps: ShowdownAnimationStepV4[];
  semanticEvents: BattleSemanticEventV4[];
  runtimeState: BattleRuntimeStateV4 | null;
  visualQueue: BattleVisualCommandV4[];
  messageQueue: BattleMessageQueueItemV4[];
  hpTweens: BattleHpTweenV4[];
  persistentFieldVisuals: BattleV4PersistentFieldVisuals;
  persistentSideConditionVisuals: BattleV4PersistentSideConditionVisuals;
  timelineExecutionProbe: {
    activeTimelineId: string;
    activeTimelineStepIndex: number;
    activeTimelineStepType: string;
    renderedStepCount: number;
    consumedCheckpointCount: number;
  };
  queueLength: number;
  skipAnimations: boolean;
  paused: boolean;
};

export type BattlePlaybackStateV4 = {
  nearTeam: BattleViewSlotV4[];
  farTeam: BattleViewSlotV4[];
  messagebar: BattleMessageEventV4 | null;
  activeAnimation: BattleAnimationEventV4 | null;
  openingSwitchInSeats: BattleProtocolSeatV4[];
  activeTimelineStep: ShowdownAnimationStepV4 | null;
  activeTimelineStepIndex: number;
  renderedTimelineSteps: ShowdownAnimationStepV4[];
  persistentFieldVisuals: BattleV4PersistentFieldVisuals;
  persistentSideConditionVisuals: BattleV4PersistentSideConditionVisuals;
  hasProtocolState: boolean;
  debug: BattlePlaybackDebugV4;
};

export type BattleV4PreviewPlaybackState = {
  nearTeam: BattleViewSlotV4[];
  farTeam: BattleViewSlotV4[];
  messagebar: BattleMessageEventV4 | null;
  activeAnimation: BattleAnimationEventV4 | null;
  activeTimelineStep: ShowdownAnimationStepV4 | null;
  activeTimelineStepIndex: number;
  renderedTimelineSteps: ShowdownAnimationStepV4[];
  persistentFieldVisuals: BattleV4PersistentFieldVisuals;
  playing: boolean;
  done: boolean;
  debug: {
    protocolEvents: BattleProtocolEventV4[];
    messageEvents: BattleMessageEventV4[];
    animationEvents: BattleAnimationEventV4[];
    animationKinds: BattleAnimationKindV4[];
    selectedAnimationKeys: string[];
    persistentFieldVisuals: BattleV4PersistentFieldVisuals;
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
const ANIMATION_GAP_MS = 500;
const TIMELINE_STEP_DEFAULT_MS = 700;

export const EMPTY_PERSISTENT_FIELD_VISUALS: BattleV4PersistentFieldVisuals = {
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

export const EMPTY_PERSISTENT_SIDE_CONDITION_VISUALS: BattleV4PersistentSideConditionVisuals = {
  near: [],
  far: [],
  sourceRawLine: "",
  adapterFidelity: "fallback",
};

const WEATHER_VIDEO_IDS: Record<string, string> = {
  sunnyday: "sunnyday",
  desolateland: "sunnyday",
  raindance: "raindance",
  primordialsea: "raindance",
  sandstorm: "sandstorm",
  hail: "hail",
  snow: "hail",
  snowscape: "hail",
};

const WEATHER_IMAGE_IDS: Record<string, string> = {
  sunnyday: "weather-sunnyday.jpg",
  desolateland: "weather-sunnyday.jpg",
  raindance: "weather-raindance.jpg",
  primordialsea: "weather-raindance.jpg",
  sandstorm: "weather-sandstorm.png",
  hail: "weather-hail.png",
  snow: "weather-hail.png",
  snowscape: "weather-hail.png",
  deltastream: "weather-strongwind.png",
};

const FIELD_IMAGE_IDS: Record<string, string> = {
  electricterrain: "weather-electricterrain.png",
  grassyterrain: "weather-grassyterrain.png",
  mistyterrain: "weather-mistyterrain.png",
  psychicterrain: "weather-psychicterrain.png",
  trickroom: "weather-trickroom.png",
  magicroom: "weather-magicroom.png",
  wonderroom: "weather-wonderroom.png",
  gravity: "weather-gravity.png",
};

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
  return events.flatMap((event, index) => {
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
    case "-fieldstart":
    case "-fieldend":
      return [animationEvent(event, "weather", 1050, message)];
    case "-sidestart":
    case "-sideend":
      return [animationEvent(event, "result", 820, message)];
    case "detailschange":
    case "-formechange":
    case "-transform":
      return [animationEvent(event, "transform", 1100, message)];
    case "-zpower":
      return [animationEvent(event, "transform", 1050, message)];
    case "-mega":
    case "-primal":
    case "-burst":
      return isDuplicateSpecialFormeAnnouncement(events[index - 1], event) ? [] : [animationEvent(event, "transform", 1180, message)];
    case "-terastallize":
      return [animationEvent(event, "transform", 1180, message)];
    case "-start":
      return shouldAnimateVolatileStart(event) ? [animationEvent(event, "transform", 1180, message)] : [];
    case "custom":
      return isEndTerastallizeEvent(event) ? [animationEvent(event, "transform", 780, message)] : message ? [animationEvent(event, "message", 360, message)] : [];
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
    case "-enditem":
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

function runBattleV4HpTween(
  command: BattleVisualCommandV4,
  startedAt: number,
  frameRef: MutableRefObject<number | null>,
  setVisibleSlots: Dispatch<SetStateAction<BattleViewSlotV4[]>>,
): void {
  const event = command.semanticEvent;
  if (event.kind !== "damage" && event.kind !== "heal") return;
  const fromHp = event.oldHp;
  const toHp = event.newHp;
  const durationMs = 520;
  const tick = (now: number) => {
    const progress = Math.max(0, Math.min(1, (now - startedAt) / durationMs));
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const hp = fromHp + (toHp - fromHp) * eased;
    setVisibleSlots(slots => applyBattleV4HpTweenFrame(slots, command, hp));
    if (progress < 1) {
      frameRef.current = window.requestAnimationFrame(tick);
    } else {
      setVisibleSlots(slots => applyBattleV4HpTweenTarget(slots, command));
      frameRef.current = null;
    }
  };
  frameRef.current = window.requestAnimationFrame(tick);
}

function isDuplicateSpecialFormeAnnouncement(previous: BattleProtocolEventV4 | undefined, event: BattleProtocolEventV4): boolean {
  if (!previous || !previous.seatExplicit || !event.seatExplicit || previous.seat !== event.seat) return false;
  return previous.eventType === "detailschange" || previous.eventType === "-formechange";
}

export function useBattleV4Playback(
  snapshot: BattleSessionSnapshotV4 | null,
  viewModel: BattleViewModelV4 | null,
  options: {skipAnimations?: boolean; debugConfig?: AppDebugConfigV4; paused?: boolean} = {},
): BattlePlaybackStateV4 {
  const skipAnimations = Boolean(options.skipAnimations);
  const paused = Boolean(options.paused && !skipAnimations);
  const debugConfig = options.debugConfig;
  const [visibleSlots, setVisibleSlots] = useState<BattleViewSlotV4[]>([]);
  const [messageEvents, setMessageEvents] = useState<BattleMessageEventV4[]>([]);
  const [protocolEvents, setProtocolEvents] = useState<BattleProtocolEventV4[]>([]);
  const [animationEvents, setAnimationEvents] = useState<BattleAnimationEventV4[]>([]);
  const [semanticEvents, setSemanticEvents] = useState<BattleSemanticEventV4[]>([]);
  const [runtimeState, setRuntimeState] = useState<BattleRuntimeStateV4 | null>(null);
  const [messageQueue, setMessageQueue] = useState<BattleMessageQueueItemV4[]>([]);
  const [animationConsumption, setAnimationConsumption] = useState<BattlePlaybackDebugV4["animationConsumption"]>([]);
  const [rawIncrements, setRawIncrements] = useState<BattlePlaybackDebugV4["rawIncrements"]>([]);
  const [queue, setQueue] = useState<BattleVisualCommandV4[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<BattleAnimationEventV4 | null>(null);
  const [activeVisual, setActiveVisual] = useState<BattleVisualCommandV4 | null>(null);
  const [activeTimelineStep, setActiveTimelineStep] = useState<ShowdownAnimationStepV4 | null>(null);
  const [activeTimelineStepIndex, setActiveTimelineStepIndex] = useState(-1);
  const [openingSwitchInSeats, setOpeningSwitchInSeats] = useState<BattleProtocolSeatV4[]>([]);
  const [renderedTimelineSteps, setRenderedTimelineSteps] = useState<ShowdownAnimationStepV4[]>([]);
  const [persistentFieldVisuals, setPersistentFieldVisuals] = useState<BattleV4PersistentFieldVisuals>(EMPTY_PERSISTENT_FIELD_VISUALS);
  const [persistentSideConditionVisuals, setPersistentSideConditionVisuals] = useState<BattleV4PersistentSideConditionVisuals>(EMPTY_PERSISTENT_SIDE_CONDITION_VISUALS);
  const [messagebar, setMessagebar] = useState<BattleMessageEventV4 | null>(null);
  const [hpTweens, setHpTweens] = useState<BattleHpTweenV4[]>([]);
  const [hasProtocolState, setHasProtocolState] = useState(false);
  const sessionRef = useRef("");
  const rawIndexRef = useRef(0);
  const seededSessionRef = useRef("");
  const playingRef = useRef(false);
  const viewModelRef = useRef<BattleViewModelV4 | null>(viewModel);
  const snapshotRef = useRef<BattleSessionSnapshotV4 | null>(snapshot);
  const hpTweenFrameRef = useRef<number | null>(null);

  useEffect(() => {
    viewModelRef.current = viewModel;
    snapshotRef.current = snapshot;
  }, [snapshot, viewModel]);

  useEffect(() => () => {
    if (hpTweenFrameRef.current !== null) window.cancelAnimationFrame(hpTweenFrameRef.current);
  }, []);

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
      setSemanticEvents([]);
      setRuntimeState(null);
      setMessageQueue([]);
      setAnimationConsumption([]);
      setRawIncrements([]);
      setQueue([]);
      setActiveVisual(null);
      setActiveAnimation(null);
      setOpeningSwitchInSeats([]);
      setActiveTimelineStep(null);
      setActiveTimelineStepIndex(-1);
      setRenderedTimelineSteps([]);
      setPersistentFieldVisuals(EMPTY_PERSISTENT_FIELD_VISUALS);
      setPersistentSideConditionVisuals(EMPTY_PERSISTENT_SIDE_CONDITION_VISUALS);
      setMessagebar(null);
      setHpTweens([]);
      setHasProtocolState(false);
      playingRef.current = false;
      if (hpTweenFrameRef.current !== null) {
        window.cancelAnimationFrame(hpTweenFrameRef.current);
        hpTweenFrameRef.current = null;
      }
    }
    if (seededSessionRef.current !== snapshot.id) {
      seededSessionRef.current = snapshot.id;
      rawIndexRef.current = initialPlaybackRawIndex(snapshot.rawLog);
      setVisibleSlots([]);
    }
    if (paused) return;
    const previousIndex = rawIndexRef.current;
    const execution = executeBattleV4Protocol(snapshot, viewModel, previousIndex);
    setRuntimeState(execution.runtimeState);
    setProtocolEvents(execution.protocolEvents.slice(-240));
    if (snapshot.rawLog.length <= previousIndex) {
      if (skipAnimations) setVisibleSlots(visualSlotsFromRuntimeState(execution.runtimeState));
      return;
    }
    const nextProtocolEvents = execution.protocolEvents.filter(event => event.sequence >= previousIndex);
    const nextSemanticEvents = execution.semanticEvents;
    const nextMessageEvents = createBattleV4MessageQueue(nextSemanticEvents);
    const nextVisualCommands = createBattleV4VisualCommands(nextSemanticEvents);
    const nextAnimationEvents = nextVisualCommands.map(command => command.animationEvent).filter((event): event is BattleAnimationEventV4 => Boolean(event));
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
      selectedAnimationKeys: nextAnimationEvents.map(event => event.selectedAnimationKey),
    };
    setRawIncrements(items => [...items, rawIncrement].slice(-80));
    if (nextProtocolEvents.length || nextSemanticEvents.length) setHasProtocolState(true);
    battleDebugLog(debugConfig, "protocol", "playback-raw-increment", {
      ...rawIncrement,
      semanticEvents: nextSemanticEvents.map(event => ({kind: event.kind, rawLine: event.rawLine, sequence: event.sequence})),
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
        selectedAnimationKey: event.selectedAnimationKey,
        animationSource: event.animationSource,
        adapterFidelity: event.animationTimeline.adapterFidelity,
        sourceKey: event.animationTimeline.sourceKey,
        aliasTargetKey: event.animationTimeline.aliasTargetKey,
        compositeTargets: event.animationTimeline.compositeTargets,
        showdownInstructionCount: event.animationTimeline.showdownInstructionCount,
        missingFxAssets: event.animationTimeline.missingFxAssets,
        timelineSteps: event.timelineSteps,
        rawLine: event.rawLine,
      })),
      persistentFieldVisuals,
    });
    rawIndexRef.current = snapshot.rawLog.length;
    if (nextSemanticEvents.length) setSemanticEvents(events => [...events, ...nextSemanticEvents].slice(-240));
    if (nextMessageEvents.length) {
      setMessageEvents(events => [...events, ...nextMessageEvents].slice(-240));
      setMessageQueue(items => [...items, ...nextMessageEvents].slice(-120));
      setMessagebar(nextMessageEvents[nextMessageEvents.length - 1] || null);
    }
    if (nextVisualCommands.length) {
      setAnimationEvents(events => [...events, ...nextAnimationEvents].slice(-240));
      if (skipAnimations) {
        setVisibleSlots(visualSlotsFromRuntimeState(execution.runtimeState));
        setPersistentFieldVisuals(current => nextVisualCommands.reduce(applyBattleV4PersistentFieldVisuals, current));
        setPersistentSideConditionVisuals(current => nextVisualCommands.reduce(applyBattleV4PersistentSideConditionVisuals, current));
        setHasProtocolState(true);
        setAnimationConsumption(consumed => [
          ...consumed,
          ...nextVisualCommands.map(command => ({
            checkpointId: command.animationEvent?.checkpointId || command.id,
            kind: command.animationEvent?.kind || "message",
            rawLine: command.semanticEvent.rawLine,
            at: new Date().toISOString(),
            selectedAnimationKey: command.animationEvent?.selectedAnimationKey,
            timelineSteps: command.animationEvent?.timelineSteps,
            consumedCheckpoints: command.animationEvent?.animationTimeline.checkpoints || [command.id],
          })),
        ].slice(-240));
      } else {
        setQueue(items => [...items, ...nextVisualCommands]);
      }
    } else if (skipAnimations) {
      setVisibleSlots(visualSlotsFromRuntimeState(execution.runtimeState));
    }
  }, [snapshot, viewModel, skipAnimations, paused, debugConfig]);

  useEffect(() => {
    if (skipAnimations && viewModel) {
      setQueue([]);
      setActiveVisual(null);
      setActiveAnimation(null);
      setOpeningSwitchInSeats([]);
      setActiveTimelineStep(null);
      setActiveTimelineStepIndex(-1);
      setRenderedTimelineSteps([]);
      if (snapshot) {
        const execution = executeBattleV4Protocol(snapshot, viewModel, 0);
        setVisibleSlots(visualSlotsFromRuntimeState(execution.runtimeState));
      } else {
        setVisibleSlots(viewModel.slots);
      }
      setHasProtocolState(true);
      playingRef.current = false;
    }
  }, [skipAnimations, viewModel, snapshot]);

  useEffect(() => {
    if (paused || playingRef.current || activeVisual || skipAnimations || !queue.length) return;
    const [command, ...rest] = queue;
    if (!command) return;
    const openingSwitchInBatch = !visibleSlots.length ? leadingSwitchInCommands(queue) : [];
    if (openingSwitchInBatch.length > 1) {
      const primary = openingSwitchInBatch[0]!;
      const event = primary.animationEvent;
      const seats = openingSwitchInBatch.map(item => item.semanticEvent.seat);
      playingRef.current = true;
      setQueue(queue.slice(openingSwitchInBatch.length));
      setActiveVisual(event ? primary : null);
      setActiveAnimation(event);
      setOpeningSwitchInSeats(event ? seats : []);
      setActiveTimelineStepIndex(0);
      setActiveTimelineStep(event?.timelineSteps[0] || null);
      setRenderedTimelineSteps([]);
      setVisibleSlots(slots => {
        const startedSlots = openingSwitchInBatch.reduce(applyBattleV4VisualCommandStart, slots);
        return event ? startedSlots : applyBattleV4OpeningSwitchInSettle(startedSlots, seats, primary);
      });
      battleDebugLog(debugConfig, "protocol", "playback-consume-opening-switch-batch", {
        checkpointIds: openingSwitchInBatch.map(item => item.animationEvent?.checkpointId || item.id),
        seats,
        rawLines: openingSwitchInBatch.map(item => item.semanticEvent.rawLine),
      });
      if (!event) playingRef.current = false;
      return;
    }
    playingRef.current = true;
    setQueue(rest);
    setActiveVisual(command);
    const event = command.animationEvent;
    setActiveAnimation(event);
    setOpeningSwitchInSeats([]);
    setActiveTimelineStepIndex(0);
    setActiveTimelineStep(event?.timelineSteps[0] || null);
    setRenderedTimelineSteps([]);
    setVisibleSlots(slots => applyBattleV4VisualCommandStart(slots, command));
    if (command.semanticEvent.kind === "damage" || command.semanticEvent.kind === "heal") {
      const tween: BattleHpTweenV4 = {
        seat: command.semanticEvent.seat,
        fromHp: command.semanticEvent.oldHp,
        toHp: command.semanticEvent.newHp,
        maxHp: command.semanticEvent.maxHp,
        startedAt: new Date().toISOString(),
        durationMs: 350,
      };
      setHpTweens(items => [...items, tween].slice(-80));
      if (hpTweenFrameRef.current !== null) window.cancelAnimationFrame(hpTweenFrameRef.current);
      hpTweenFrameRef.current = window.requestAnimationFrame(() => {
        hpTweenFrameRef.current = window.requestAnimationFrame(startedAt => {
          runBattleV4HpTween(command, startedAt, hpTweenFrameRef, setVisibleSlots);
        });
      });
    }
    battleDebugLog(debugConfig, "protocol", "playback-consume-animation", {
      checkpointId: event?.checkpointId || command.id,
      kind: event?.kind || command.semanticEvent.kind,
      actorSeat: event?.actorSeat,
      targetSeat: event?.targetSeat,
      effectSprite: event?.effectSprite,
      selectedAnimationKey: event?.selectedAnimationKey,
      animationSource: event?.animationSource,
      timelineSteps: event?.timelineSteps,
      rawLine: command.semanticEvent.rawLine,
      remaining: rest.length,
    });
    if (!event) {
      setPersistentFieldVisuals(current => applyBattleV4PersistentFieldVisuals(current, command));
      setPersistentSideConditionVisuals(current => applyBattleV4PersistentSideConditionVisuals(current, command));
      setVisibleSlots(slots => applyBattleV4VisualCommandSettle(slots, command));
      setActiveVisual(null);
      playingRef.current = false;
    }
  }, [queue, activeVisual, skipAnimations, paused, debugConfig, visibleSlots.length]);

  useEffect(() => {
    if (paused || !activeVisual || !activeAnimation || skipAnimations) return;
    const command = activeVisual;
    const event = activeAnimation;
    const steps = event.timelineSteps.length ? event.timelineSteps : event.animationTimeline.steps;
    const step = steps[activeTimelineStepIndex] || null;
    if (!step) {
      const releaseTimer = window.setTimeout(() => {
        setVisibleSlots(slots => applyBattleV4OpeningSwitchInSettle(slots, openingSwitchInSeats, command));
        setActiveAnimation(null);
        setActiveVisual(null);
        setOpeningSwitchInSeats([]);
        setActiveTimelineStep(null);
        setActiveTimelineStepIndex(-1);
        setRenderedTimelineSteps([]);
        playingRef.current = false;
      }, ANIMATION_GAP_MS);
      return () => window.clearTimeout(releaseTimer);
    }
    setActiveTimelineStep(step);
    setRenderedTimelineSteps(stepsSoFar => [...stepsSoFar, step].slice(-32));
    if (step.type === "checkpoint") {
      setPersistentFieldVisuals(current => applyBattleV4PersistentFieldVisuals(current, command));
      setPersistentSideConditionVisuals(current => applyBattleV4PersistentSideConditionVisuals(current, command));
      setVisibleSlots(slots => {
        const nextSlots = applyBattleV4OpeningSwitchInSettle(slots, openingSwitchInSeats, command);
        setAnimationConsumption(consumed => [...consumed, {
          checkpointId: step.checkpointId,
          kind: event.kind,
          rawLine: event.rawLine,
          at: new Date().toISOString(),
          selectedAnimationKey: event.selectedAnimationKey,
          timelineSteps: event.timelineSteps,
          consumedCheckpoints: openingSwitchInSeats.length ? openingSwitchInSeats.map(seat => `${seat}-opening-switchIn`) : [step.checkpointId],
          activeTimelineStepIndex,
          activeTimelineStep: step,
          visibleSlotSeatsBefore: slots.map(formatVisibleSlotSeat),
          visibleSlotSeatsAfter: nextSlots.map(formatVisibleSlotSeat),
        }].slice(-240));
        return nextSlots;
      });
    }
    const stepTimer = window.setTimeout(() => {
      setActiveTimelineStepIndex(index => index + 1);
    }, timelineStepDurationMs(step));
    return () => window.clearTimeout(stepTimer);
  }, [activeVisual, activeAnimation, activeTimelineStepIndex, skipAnimations, paused, openingSwitchInSeats]);

  const hasProtocolFacts = Boolean(snapshot && snapshot.rawLog.length > initialPlaybackRawIndex(snapshot.rawLog));
  const shouldUseProtocolState = hasProtocolState || hasProtocolFacts || skipAnimations;
  const visibleNearTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "near"), [visibleSlots]);
  const visibleFarTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "far"), [visibleSlots]);
  return {
    nearTeam: visibleNearTeam,
    farTeam: visibleFarTeam,
    messagebar,
    activeAnimation,
    openingSwitchInSeats,
    activeTimelineStep,
    activeTimelineStepIndex,
    renderedTimelineSteps,
    persistentFieldVisuals,
    persistentSideConditionVisuals,
    hasProtocolState: shouldUseProtocolState,
    debug: {
      lastConsumedRawIndex: rawIndexRef.current,
      hasProtocolState: shouldUseProtocolState,
      currentAnimation: activeAnimation,
      openingSwitchInSeats,
      currentMessage: messagebar,
      protocolEvents,
      messageEvents,
      animationEvents,
      semanticEvents,
      runtimeState,
      visualQueue: queue,
      messageQueue,
      hpTweens,
      animationConsumption,
      rawIncrements,
      renderProbe: {
        visibleSlotSeats: visibleSlots.map(formatVisibleSlotSeat),
        protocolPlaybackStarted: shouldUseProtocolState,
        activeAnimationSeat: activeAnimation ? activeAnimation.targetSeat || activeAnimation.actorSeat : "",
        activeAnimationKind: activeAnimation?.kind || "",
        activeAnimationCheckpointId: activeAnimation?.checkpointId || "",
        activeTimelineId: activeAnimation?.animationTimeline.id || "",
        activeTimelineStepIndex,
        activeTimelineStep,
        openingSwitchInSeats,
        renderedTimelineSteps,
        persistentFieldVisuals,
        persistentSideConditionVisuals,
      },
      persistentWeatherState: persistentFieldVisuals,
      renderedWeatherLayer: persistentFieldVisuals.renderedWeatherLayer,
      missingFxAssets: persistentFieldVisuals.missingFxAssets,
      activeTimelineId: activeAnimation?.animationTimeline.id || "",
      activeTimelineStep,
      activeTimelineStepIndex,
      renderedTimelineSteps,
      persistentFieldVisuals,
      persistentSideConditionVisuals,
      timelineExecutionProbe: {
        activeTimelineId: activeAnimation?.animationTimeline.id || "",
        activeTimelineStepIndex,
        activeTimelineStepType: activeTimelineStep?.type || "",
        renderedStepCount: renderedTimelineSteps.length,
        consumedCheckpointCount: animationConsumption.reduce((count, item) => count + (item.consumedCheckpoints?.length || 0), 0),
      },
      queueLength: queue.length,
      skipAnimations,
      paused,
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
  const [activeTimelineStep, setActiveTimelineStep] = useState<ShowdownAnimationStepV4 | null>(null);
  const [activeTimelineStepIndex, setActiveTimelineStepIndex] = useState(-1);
  const [renderedTimelineSteps, setRenderedTimelineSteps] = useState<ShowdownAnimationStepV4[]>([]);
  const [persistentFieldVisuals, setPersistentFieldVisuals] = useState<BattleV4PersistentFieldVisuals>(EMPTY_PERSISTENT_FIELD_VISUALS);
  const [messagebar, setMessagebar] = useState<BattleMessageEventV4 | null>(null);
  const [done, setDone] = useState(false);
  const playingRef = useRef(false);

  useEffect(() => {
    setVisibleSlots(initialSlots);
    setQueue(projected.animationEvents);
    setActiveAnimation(null);
    setActiveTimelineStep(null);
    setActiveTimelineStepIndex(-1);
    setRenderedTimelineSteps([]);
    setPersistentFieldVisuals(EMPTY_PERSISTENT_FIELD_VISUALS);
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
    setActiveTimelineStepIndex(0);
    setActiveTimelineStep(event.timelineSteps[0] || null);
    setRenderedTimelineSteps([]);
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
    const steps = event.timelineSteps.length ? event.timelineSteps : event.animationTimeline.steps;
    const step = steps[activeTimelineStepIndex] || null;
    if (!step) {
      const releaseTimer = window.setTimeout(() => {
        setActiveAnimation(null);
        setActiveTimelineStep(null);
        setActiveTimelineStepIndex(-1);
        setRenderedTimelineSteps([]);
        playingRef.current = false;
        if (!queue.length) setDone(true);
      }, ANIMATION_GAP_MS);
      return () => window.clearTimeout(releaseTimer);
    }
    setActiveTimelineStep(step);
    setRenderedTimelineSteps(stepsSoFar => [...stepsSoFar, step].slice(-32));
    if (step.type === "checkpoint") {
      setPersistentFieldVisuals(current => applyPersistentFieldCheckpoint(current, event));
      setVisibleSlots(slots => applyAnimationCheckpoint(slots, event, null, null));
    }
    const stepTimer = window.setTimeout(() => {
      setActiveTimelineStepIndex(index => index + 1);
    }, timelineStepDurationMs(step));
    return () => window.clearTimeout(stepTimer);
  }, [activeAnimation, activeTimelineStepIndex, queue.length]);

  const nearTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "near"), [visibleSlots]);
  const farTeam = useMemo(() => visibleSlots.filter(slot => slot.side === "far"), [visibleSlots]);
  return {
    nearTeam,
    farTeam,
    messagebar,
    activeAnimation,
    activeTimelineStep,
    activeTimelineStepIndex,
    renderedTimelineSteps,
    persistentFieldVisuals,
    playing: Boolean(activeAnimation || queue.length),
    done,
    debug: {
      protocolEvents: projected.protocolEvents,
      messageEvents: projected.messageEvents,
      animationEvents: projected.animationEvents,
      animationKinds: projected.animationEvents.map(event => event.kind),
      selectedAnimationKeys: projected.animationEvents.map(event => event.selectedAnimationKey),
      persistentFieldVisuals,
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
  const actor = actorArgForEvent(eventType, args, kwArgs);
  const target = targetArgForEvent(eventType, args);
  const actorParts = parsePokemonProtocolIdent(actor);
  const targetParts = parsePokemonProtocolIdent(target);
  const moveName = moveNameForProtocolEvent(eventType, args, kwArgs);
  return {
    sequence,
    rawLine,
    args,
    kwArgs,
    eventType,
    turn,
    playerId: actorParts.playerId,
    seat: actorParts.seat,
    seatExplicit: actorParts.seatExplicit,
    targetSeat: targetParts.seat,
    targetSeatExplicit: targetParts.seatExplicit,
    actorName: actorParts.name || actor,
    targetName: targetParts.name || target,
    moveId: toId(moveName),
    moveName,
    condition: conditionArgFor(args),
    status: statusArgFor(args, kwArgs),
  };
}

function actorArgForEvent(eventType: string, args: BattleProtocolArgsV4, kwArgs: BattleProtocolKwArgsV4): string {
  if (eventType === "-weather" || eventType === "-fieldstart" || eventType === "-fieldend") return kwArgs.of || args[1] || "";
  if (eventType === "custom" && toId(args[1]) === "endterastallize") return args[2] || "";
  return args[1] || "";
}

function applyBattleV4OpeningSwitchInSettle(
  slots: BattleViewSlotV4[],
  openingSwitchInSeats: BattleProtocolSeatV4[],
  command: BattleVisualCommandV4,
): BattleViewSlotV4[] {
  if (!openingSwitchInSeats.length) return applyBattleV4VisualCommandSettle(slots, command);
  const seats = new Set(openingSwitchInSeats);
  return slots.map(slot => seats.has(slot.seat as BattleProtocolSeatV4) ? {...slot, active: true} : slot);
}

function leadingSwitchInCommands(queue: BattleVisualCommandV4[]): BattleSwitchInVisualCommandV4[] {
  const batch: BattleSwitchInVisualCommandV4[] = [];
  for (const command of queue) {
    if (command.semanticEvent.kind !== "switchIn") break;
    batch.push(command as BattleSwitchInVisualCommandV4);
  }
  return batch;
}

function timelineStepDurationMs(step: ShowdownAnimationStepV4): number {
  if (step.type === "checkpoint") return 0;
  if (step.type === "wait" || step.type === "delay") return Math.max(0, step.durationMs);
  if (step.type === "showEffect") return Math.max(60, typeof step.delayMs === "number" ? step.delayMs : step.durationMs);
  if (step.type === "actorAnim" || step.type === "backgroundEffect") {
    return Math.max(160, step.durationMs);
  }
  return TIMELINE_STEP_DEFAULT_MS;
}

function targetArgForEvent(eventType: string, args: BattleProtocolArgsV4): string {
  if (eventType === "move" || eventType === "-anim") return args[3] || "";
  if (eventType === "-transform") return args[2] || "";
  if (eventType === "-miss") return args[2] || "";
  if (eventType === "-supereffective" || eventType === "-resisted" || eventType === "-crit" || eventType === "-immune" || eventType === "-fail" || eventType === "-activate") return args[1] || "";
  return args[1] || "";
}

function moveNameForProtocolEvent(eventType: string, args: BattleProtocolArgsV4, kwArgs: BattleProtocolKwArgsV4): string {
  if (eventType === "move" || eventType === "-anim") return args[2] || "";
  if (eventType === "-weather") return cleanEffect(kwArgs.from || args[1] || "");
  if (eventType === "-fieldstart" || eventType === "-fieldend") return cleanEffect(args[1] || kwArgs.from || "");
  return kwArgs.move || args[3] || "";
}

function animationEvent(event: BattleProtocolEventV4, kind: BattleAnimationKindV4, durationMs: number, message: string): BattleAnimationEventV4 {
  const result = resultForProtocolEvent(event);
  const selection = selectShowdownAnimationKeyV4(event, kind);
  const effectSprite = effectSpriteForShowdownAnimationV4(selection.animationKey, kind, event);
  const checkpointId = `${event.sequence}-${kind}`;
  const animationTimeline = projectShowdownAnimationTimelineV4(selection.animationKey, {
    event,
    kind,
    checkpointId,
    message,
    resultText: result.text,
    resultTone: result.tone,
    durationMs,
  });
  return {
    checkpointId,
    sequence: event.sequence,
    kind,
    rawLine: event.rawLine,
    args: event.args,
    kwArgs: event.kwArgs,
    actorSeat: event.seat,
    actorSeatExplicit: event.seatExplicit,
    targetSeat: event.targetSeat || event.seat,
    targetSeatExplicit: event.targetSeatExplicit || event.seatExplicit,
    actorName: event.actorName,
    targetName: event.targetName,
    moveId: event.moveId,
    moveName: event.moveName,
    condition: event.condition,
    status: event.status,
    durationMs,
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
    message,
    resultText: result.text,
    resultTone: result.tone,
    weatherId: event.eventType === "-weather" ? toId(event.args[1]) : event.eventType === "-fieldstart" || event.eventType === "-fieldend" ? toId(cleanEffect(event.args[1])) : "",
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
      hp: scaleProtocolHpForSlot(parsed, slot),
      maxHp: slot.maxHp || parsed.maxHp,
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
    const seat = resolveTransformEventSeat(event, slots);
    return patchSlot(slots, seat, slot => patchSpecialSlotState(patchSlotForme(slot, event, slots), event));
  }
  return slots;
}

export function derivePersistentFieldVisualsFromRawLog(rawLog: string[]): BattleV4PersistentFieldVisuals {
  return derivePersistentFieldVisualsFromProtocol(projectBattleProtocolEventsV4(rawLog, 0), EMPTY_PERSISTENT_FIELD_VISUALS);
}

export function derivePersistentSideConditionVisualsFromRawLog(rawLog: string[]): BattleV4PersistentSideConditionVisuals {
  return derivePersistentSideConditionVisualsFromProtocol(projectBattleProtocolEventsV4(rawLog, 0), EMPTY_PERSISTENT_SIDE_CONDITION_VISUALS);
}

export function deriveSpecialSystemSlotsFromRawLog(slots: BattleViewSlotV4[], rawLog: string[]): BattleViewSlotV4[] {
  return deriveSpecialSystemSlotsFromProtocol(slots, projectBattleProtocolEventsV4(rawLog, 0));
}

export function deriveSpecialSystemSlotsFromProtocol(slots: BattleViewSlotV4[], events: BattleProtocolEventV4[]): BattleViewSlotV4[] {
  return events.reduce((current, event) => {
    if (!shouldApplySpecialSystemProtocolEvent(event)) return current;
    const animation = animationEvent(event, "transform", 0, "");
    const seat = resolveTransformEventSeat(animation, current);
    return patchSlot(current, seat, slot => patchSpecialSlotState(patchSlotForme(slot, animation, current), animation));
  }, slots);
}

function shouldApplySpecialSystemProtocolEvent(event: BattleProtocolEventV4): boolean {
  if (event.eventType === "detailschange" || event.eventType === "-formechange" || event.eventType === "-transform") return true;
  if (event.eventType === "-mega" || event.eventType === "-primal" || event.eventType === "-burst" || event.eventType === "-zpower" || event.eventType === "-terastallize") return true;
  if (event.eventType === "-start" && toId(event.args[2]) === "dynamax") return true;
  if (event.eventType === "-end" && toId(event.args[2]) === "dynamax") return true;
  if (event.eventType === "custom" && isEndTerastallizeEvent(event)) return true;
  return false;
}

export function derivePersistentFieldVisualsFromProtocol(
  events: BattleProtocolEventV4[],
  initial: BattleV4PersistentFieldVisuals = EMPTY_PERSISTENT_FIELD_VISUALS,
): BattleV4PersistentFieldVisuals {
  return events.reduce((current, event) => applyPersistentFieldProtocolEvent(current, event), initial);
}

export function derivePersistentSideConditionVisualsFromProtocol(
  events: BattleProtocolEventV4[],
  initial: BattleV4PersistentSideConditionVisuals = EMPTY_PERSISTENT_SIDE_CONDITION_VISUALS,
): BattleV4PersistentSideConditionVisuals {
  return events.reduce((current, event) => applyPersistentSideConditionProtocolEvent(current, event), initial);
}

function applyPersistentFieldCheckpoint(current: BattleV4PersistentFieldVisuals, event: BattleAnimationEventV4): BattleV4PersistentFieldVisuals {
  if (event.kind !== "weather") return current;
  return applyPersistentFieldProtocolEvent(current, {
    sequence: event.sequence,
    rawLine: event.rawLine,
    args: event.args,
    kwArgs: event.kwArgs,
    eventType: event.args[0] || "",
    turn: 0,
    playerId: "",
    seat: event.actorSeat,
    seatExplicit: event.actorSeatExplicit,
    targetSeat: event.targetSeat,
    targetSeatExplicit: event.targetSeatExplicit,
    actorName: event.actorName,
    targetName: event.targetName,
    moveId: event.moveId,
    moveName: event.moveName,
    condition: event.condition,
    status: event.status,
  });
}

function applyPersistentSideConditionCheckpoint(current: BattleV4PersistentSideConditionVisuals, event: BattleAnimationEventV4): BattleV4PersistentSideConditionVisuals {
  if (event.args[0] !== "-sidestart" && event.args[0] !== "-sideend") return current;
  return applyPersistentSideConditionProtocolEvent(current, {
    sequence: event.sequence,
    rawLine: event.rawLine,
    args: event.args,
    kwArgs: event.kwArgs,
    eventType: event.args[0] || "",
    turn: 0,
    playerId: "",
    seat: event.actorSeat,
    seatExplicit: event.actorSeatExplicit,
    targetSeat: event.targetSeat,
    targetSeatExplicit: event.targetSeatExplicit,
    actorName: event.actorName,
    targetName: event.targetName,
    moveId: event.moveId,
    moveName: event.moveName,
    condition: event.condition,
    status: event.status,
  });
}

function applyPersistentFieldProtocolEvent(current: BattleV4PersistentFieldVisuals, event: BattleProtocolEventV4): BattleV4PersistentFieldVisuals {
  if (event.eventType === "-weather") {
    const weatherId = normalizeWeatherId(toId(event.args[1]));
    if (!weatherId || weatherId === "none") return {...current, weatherId: "", sourceRawLine: event.rawLine, ...resourceFieldsForPersistentLayer("", current.terrainId || current.roomId || (current.gravityActive ? "gravity" : ""))};
    const resource = persistentLayerResource(weatherId, "weather");
    return {
      ...current,
      weatherId,
      sourceRawLine: event.rawLine,
      resourcePath: resource.path,
      resourceKind: resource.kind,
      renderedWeatherLayer: weatherId,
      adapterFidelity: "native",
      missingFxAssets: resource.missing ? [resource.missing] : [],
    };
  }
  if (event.eventType === "-fieldstart") {
    const fieldId = normalizeFieldId(toId(cleanEffect(event.args[1])));
    if (!fieldId) return current;
    const resource = persistentLayerResource(fieldId, "field");
    const next = {
      ...current,
      sourceRawLine: event.rawLine,
      resourcePath: resource.path,
      resourceKind: resource.kind,
      renderedWeatherLayer: current.weatherId || fieldId,
      adapterFidelity: "native" as ShowdownAnimationFidelityV4,
      missingFxAssets: resource.missing ? [resource.missing] : [],
    };
    if (fieldId.endsWith("terrain")) return {...next, terrainId: fieldId};
    if (fieldId === "gravity") return {...next, gravityActive: true};
    if (fieldId.endsWith("room")) return {...next, roomId: fieldId};
    return next;
  }
  if (event.eventType === "-fieldend") {
    const fieldId = normalizeFieldId(toId(cleanEffect(event.args[1])));
    const next = {...current, sourceRawLine: event.rawLine, adapterFidelity: "native" as ShowdownAnimationFidelityV4};
    if (fieldId.endsWith("terrain")) return refreshPersistentLayerResource({...next, terrainId: ""});
    if (fieldId === "gravity") return refreshPersistentLayerResource({...next, gravityActive: false});
    if (fieldId.endsWith("room")) return refreshPersistentLayerResource({...next, roomId: ""});
    return refreshPersistentLayerResource(next);
  }
  return current;
}

function applyPersistentSideConditionProtocolEvent(current: BattleV4PersistentSideConditionVisuals, event: BattleProtocolEventV4): BattleV4PersistentSideConditionVisuals {
  if (event.eventType !== "-sidestart" && event.eventType !== "-sideend") return current;
  const conditionId = normalizeSideConditionId(toId(cleanEffect(event.args[2] || event.args[1])));
  if (!conditionId) return current;
  const side = sideConditionSideForEvent(event);
  const list = current[side];
  const nextList = event.eventType === "-sideend"
    ? list.filter(item => item.id !== conditionId)
    : upsertSideConditionVisual(list, {
      id: conditionId,
      label: sideConditionLabel(conditionId),
      side,
      sourceRawLine: event.rawLine,
      adapterFidelity: "native",
    });
  return {
    ...current,
    [side]: nextList,
    sourceRawLine: event.rawLine,
    adapterFidelity: "native",
  };
}

function upsertSideConditionVisual(list: BattleV4SideConditionVisualV4[], item: BattleV4SideConditionVisualV4): BattleV4SideConditionVisualV4[] {
  return [...list.filter(existing => existing.id !== item.id), item].slice(-8);
}

function sideConditionSideForEvent(event: BattleProtocolEventV4): BattleV4SideConditionSideV4 {
  const sideArg = event.args[1] || event.kwArgs.of || "";
  if (/^p2/i.test(sideArg)) return "far";
  if (/^p4/i.test(sideArg)) return "far";
  return "near";
}

function normalizeSideConditionId(id: string): string {
  if (id === "stealthrock") return "stealthrock";
  if (id === "spikes") return "spikes";
  if (id === "toxicspikes") return "toxicspikes";
  if (id === "stickyweb") return "stickyweb";
  if (id === "reflect") return "reflect";
  if (id === "lightscreen") return "lightscreen";
  if (id === "auroraveil") return "auroraveil";
  if (id === "safeguard") return "safeguard";
  if (id === "mist") return "mist";
  if (id === "tailwind") return "tailwind";
  return "";
}

function refreshPersistentLayerResource(state: BattleV4PersistentFieldVisuals): BattleV4PersistentFieldVisuals {
  const activeId = state.weatherId || state.terrainId || state.roomId || (state.gravityActive ? "gravity" : "");
  return {...state, ...resourceFieldsForPersistentLayer(state.weatherId, activeId), renderedWeatherLayer: activeId};
}

function resourceFieldsForPersistentLayer(weatherId: string, activeId: string): Pick<BattleV4PersistentFieldVisuals, "resourcePath" | "resourceKind" | "missingFxAssets"> {
  if (!activeId) return {resourcePath: "", resourceKind: "", missingFxAssets: []};
  const resource = persistentLayerResource(activeId, weatherId ? "weather" : "field");
  return {resourcePath: resource.path, resourceKind: resource.kind, missingFxAssets: resource.missing ? [resource.missing] : []};
}

function persistentLayerResource(id: string, kind: "weather" | "field"): {path: string; kind: "video" | "image" | ""; missing: string} {
  if (kind === "weather") {
    const videoId = WEATHER_VIDEO_IDS[id];
    if (videoId) return {path: `/showdown/fx/weather-gen6-${videoId}.webm`, kind: "video", missing: ""};
    const image = WEATHER_IMAGE_IDS[id];
    if (image) return {path: `/showdown/fx/${image}`, kind: "image", missing: ""};
    return {path: "", kind: "", missing: `/showdown/fx/weather-${id}.png`};
  }
  const image = FIELD_IMAGE_IDS[id];
  if (image) return {path: `/showdown/fx/${image}`, kind: "image", missing: ""};
  return {path: "", kind: "", missing: `/showdown/fx/weather-${id}.png`};
}

function normalizeWeatherId(id: string): string {
  if (id === "sun") return "sunnyday";
  if (id === "rain") return "raindance";
  if (id === "snow") return "snowscape";
  return id;
}

function normalizeFieldId(id: string): string {
  if (id === "electricterrain" || id === "grassyterrain" || id === "mistyterrain" || id === "psychicterrain") return id;
  if (id === "trickroom" || id === "magicroom" || id === "wonderroom" || id === "gravity") return id;
  return id;
}

function resolveTransformEventSeat(event: BattleAnimationEventV4, slots: BattleViewSlotV4[]): BattleProtocolSeatV4 {
  if (event.actorSeatExplicit && event.actorSeat) return event.actorSeat;
  const parsed = parsePokemonProtocolIdent(event.args[1] || "");
  const playerId = parsed.playerId;
  const eventNameId = toId(parsed.name || event.actorName);
  const eventRootId = speciesRootId(eventNameId);
  if (!playerId || !eventRootId) return event.actorSeat || "";
  const scored = slots
    .filter(slot => slot.playerId === playerId)
    .map(slot => ({slot, score: scoreTransformSlotCandidate(slot, eventNameId, eventRootId)}))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return "";
  if (scored[1] && scored[1].score === scored[0]!.score) return "";
  return scored[0]!.slot.seat;
}

function scoreTransformSlotCandidate(slot: BattleViewSlotV4, eventNameId: string, eventRootId: string): number {
  const state = ensureVisibleSlotState(slot);
  const slotIds = [
    slot.name,
    slot.nameZh,
    slot.speciesId,
    state.baseSpeciesId,
    state.volatileFormeSpeciesId,
    state.transformedSpeciesId,
    currentSpeciesForme(slot),
  ].map(value => toId(value || "")).filter(Boolean);
  const exact = slotIds.some(id => id === eventNameId);
  const sameRoot = slotIds.some(id => speciesRootId(id) === eventRootId);
  if (!exact && !sameRoot) return 0;
  return (exact ? 20 : 10)
    + (slot.fainted ? 5 : 0)
    + (state.specialFormeKind ? 4 : 0)
    + (state.oldSpriteState ? 2 : 0)
    + (state.volatileFormeSpeciesId || state.transformedSpeciesId ? 2 : 0);
}

function speciesRootId(id: string): string {
  return toId(id)
    .replace(/megax$/, "")
    .replace(/megay$/, "")
    .replace(/mega$/, "")
    .replace(/primal$/, "")
    .replace(/gmax$/, "")
    .replace(/alola$/, "")
    .replace(/galar$/, "")
    .replace(/hisui$/, "")
    .replace(/paldea$/, "");
}

function patchSlotForme(slot: BattleViewSlotV4, event: BattleAnimationEventV4, slots: BattleViewSlotV4[]): BattleViewSlotV4 {
  const currentSlot = ensureVisibleSlotState(slot);
  if (event.rawLine.startsWith("|-terastallize|") || event.rawLine.startsWith("|-zpower|")) return currentSlot;
  if (event.rawLine.startsWith("|-start|") && toId(event.args[2]) === "dynamax") return currentSlot;
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

function patchSpecialSlotState(slot: BattleViewSlotV4, event: BattleAnimationEventV4): BattleViewSlotV4 {
  const current = ensureVisibleSlotState(slot);
  if (event.rawLine.startsWith("|-terastallize|")) {
    return {
      ...current,
      teraType: event.args[2] || "",
      terastallized: true,
      specialFormeKind: current.specialFormeKind || "",
    };
  }
  if (event.rawLine.startsWith("|custom|-endterastallize|")) {
    return {...current, teraType: "", terastallized: false};
  }
  if (event.rawLine.startsWith("|-start|") && toId(event.args[2]) === "dynamax") {
    return {...current, dynamaxActive: true};
  }
  if (event.rawLine.startsWith("|-end|") && toId(event.args[2]) === "dynamax") {
    return {...current, dynamaxActive: false};
  }
  if (event.rawLine.startsWith("|-mega|")) return {...current, specialFormeKind: "mega"};
  if (event.rawLine.startsWith("|-primal|")) return {...current, specialFormeKind: "primal"};
  if (event.rawLine.startsWith("|-burst|")) return {...current, specialFormeKind: "ultra"};
  if (event.rawLine.startsWith("|detailschange|")) {
    const kind = specialFormeKindForDetails(event.args[2] || "");
    return kind ? {...current, specialFormeKind: kind} : current;
  }
  return current;
}

function specialFormeKindForDetails(details: string): BattleVisibleSlotV4["specialFormeKind"] {
  const id = toId(details);
  if (id.includes("mega")) return "mega";
  if (id.includes("primal")) return "primal";
  if (id.includes("ultra")) return "ultra";
  return "";
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

function shouldAnimateVolatileStart(event: BattleProtocolEventV4): boolean {
  if (event.eventType !== "-start") return false;
  return toId(event.args[2]) === "dynamax";
}

function isEndTerastallizeEvent(event: BattleProtocolEventV4 | BattleAnimationEventV4): boolean {
  return event.rawLine.startsWith("|custom|-endterastallize|") || toId(event.args[1]) === "endterastallize";
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
    kyogreprimal: "kyogre-primal",
    groudonprimal: "groudon-primal",
    necrozmaultra: "necrozma-ultra",
  };
  if (known[speciesId]) return known[speciesId]!;
  const megaMatch = /^(.+?)mega([xy])?$/.exec(speciesId);
  if (megaMatch) return `${megaMatch[1]}-mega${megaMatch[2] || ""}`;
  const gmaxMatch = /^(.+?)gmax$/.exec(speciesId);
  if (gmaxMatch) return `${gmaxMatch[1]}-gmax`;
  const primalMatch = /^(.+?)primal$/.exec(speciesId);
  if (primalMatch) return `${primalMatch[1]}-primal`;
  const ultraMatch = /^(.+?)ultra$/.exec(speciesId);
  if (ultraMatch) return `${ultraMatch[1]}-ultra`;
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
  const conditionHp = condition ? scaleProtocolHpForMaxHp(condition, pokemon.maxHp) : null;
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
    hp: conditionHp ?? pokemon.entryHp,
    maxHp: pokemon.maxHp || condition?.maxHp || 0,
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
  const special = [
    slot.terastallized ? `tera=${slot.teraType || "?"}` : "",
    slot.dynamaxActive ? "dynamax" : "",
    slot.specialFormeKind ? `forme=${slot.specialFormeKind}` : "",
  ].filter(Boolean).join(",");
  return `${slot.seat}:${slot.name || slot.speciesId}${speciesSuffix}${slot.fainted ? ":fnt" : ""}:${slot.hp}/${slot.maxHp}${special ? `:${special}` : ""}`;
}

function initialPlaybackRawIndex(rawLines: string[]): number {
  const firstBattleEvent = rawLines.findIndex(line => {
    const {args} = parseBattleProtocolLineV4(line || "");
    return args[0] === "switch" ||
      args[0] === "drag" ||
      args[0] === "move" ||
      args[0] === "-damage" ||
      args[0] === "-heal" ||
      args[0] === "faint" ||
      args[0] === "-ability" ||
      args[0] === "-weather" ||
      args[0] === "-fieldstart" ||
      args[0] === "-fieldend";
  });
  return firstBattleEvent >= 0 ? firstBattleEvent : rawLines.length;
}

function scaleProtocolHpForSlot(parsed: {hp: number; maxHp: number; status: string; fainted: boolean}, slot: BattleViewSlotV4): number {
  if (parsed.fainted) return 0;
  return scaleProtocolHpForMaxHp(parsed, slot.maxHp) ?? parsed.hp;
}

function scaleProtocolHpForMaxHp(parsed: {hp: number; maxHp: number; fainted: boolean}, trueMaxHp: number): number | null {
  if (parsed.fainted) return 0;
  if (!trueMaxHp || !parsed.maxHp) return null;
  if (parsed.maxHp === trueMaxHp) return parsed.hp;
  return Math.max(0, Math.min(trueMaxHp, Math.round(parsed.hp / parsed.maxHp * trueMaxHp)));
}

function parsePokemonProtocolIdent(value: string): {playerId?: string; seat: BattleProtocolSeatV4; seatExplicit: boolean; name: string} {
  const match = /^(p[1-4])([a-z])?:\s*(.*)$/i.exec(value || "");
  if (!match) return {seat: "", seatExplicit: false, name: value || ""};
  const playerId = match[1]!.toLowerCase();
  const position = (match[2] || "").toLowerCase();
  return {
    playerId,
    seat: position ? seatForProtocolSlot(playerId, position) : "",
    seatExplicit: Boolean(position),
    name: match[3] || "",
  };
}

function seatForProtocolSlot(playerId: string, position: string): BattleProtocolSeatV4 {
  if (!/^p[1-4]$/.test(playerId)) return "";
  const slot = position === "b" ? "B" : "A";
  return `${playerId}${slot}` as BattleProtocolSeatV4;
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
    return healMessage(event, name);
  case "-enditem":
    return endItemMessage(event, name);
  case "-ability":
    return `${name}的${cleanEffect(event.args[2] || "特性")}发动了！`;
  case "-weather":
    return weatherMessage(event);
  case "-fieldstart":
    return fieldStartMessage(event);
  case "-fieldend":
    return `${fieldLabel(toId(cleanEffect(event.args[1])))}消失了。`;
  case "-sidestart":
    return `${sideConditionLabel(normalizeSideConditionId(toId(cleanEffect(event.args[2] || event.args[1]))))}展开了。`;
  case "-sideend":
    return `${sideConditionLabel(normalizeSideConditionId(toId(cleanEffect(event.args[2] || event.args[1]))))}消失了。`;
  case "-zpower":
    return `${name}释放了 Z 力量！`;
  case "-mega":
    return `${name}进行了 Mega 进化！`;
  case "-primal":
    return `${name}发生了原始回归！`;
  case "-burst":
    return `${name}进行了究极爆发！`;
  case "-terastallize":
    return `${name}太晶化成${event.args[2] || "未知"}属性！`;
  case "-start":
    return toId(event.args[2]) === "dynamax" ? `${name}极巨化了！` : "";
  case "-end":
    return toId(event.args[2]) === "dynamax" ? `${name}恢复了原本大小。` : "";
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

function resultForProtocolEvent(event: BattleProtocolEventV4): {text: string; tone: BattleAnimationEventV4["resultTone"]} {
  switch (event.eventType) {
  case "-ability":
    return {text: cleanEffect(event.args[2] || "特性"), tone: "good"};
  case "-weather":
    return {text: weatherLabel(toId(event.args[1])), tone: "weather"};
  case "-fieldstart":
  case "-fieldend":
    return {text: fieldLabel(toId(cleanEffect(event.args[1]))), tone: "weather"};
  case "-zpower":
    return {text: "Z 力量", tone: "good"};
  case "-mega":
    return {text: "Mega 进化", tone: "good"};
  case "-primal":
    return {text: "原始回归", tone: "good"};
  case "-burst":
    return {text: "究极爆发", tone: "good"};
  case "-terastallize":
    return {text: `${event.args[2] || ""} 太晶`, tone: "good"};
  case "-start":
    if (toId(event.args[2]) === "dynamax") return {text: "极巨化", tone: "good"};
    return {text: "", tone: ""};
  case "-end":
    if (toId(event.args[2]) === "dynamax") return {text: "极巨化结束", tone: "neutral"};
    return {text: "", tone: ""};
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
  case "-enditem":
    return {text: `吃掉${cleanEffect(event.args[2] || "道具")}`, tone: "good"};
  case "-status":
    return {text: resultTextForStatus(event.status), tone: "status"};
  case "-curestatus":
    return {text: `${resultTextForStatus(toId(event.args[2]))}解除`, tone: "good"};
  case "cant":
    return {text: resultTextForStatus(toId(event.args[2])) || "无法行动", tone: "neutral"};
  case "-damage":
  case "-heal":
    return {text: healResultText(event), tone: event.eventType === "-heal" ? "good" : "bad"};
  default:
    return {text: "", tone: ""};
  }
}

function healMessage(event: BattleProtocolEventV4, name: string): string {
  const source = healSourceText(event);
  return source ? `${name}因${source}回复了体力。` : `${name}回复了体力。`;
}

function healResultText(event: BattleProtocolEventV4): string {
  const source = healSourceText(event);
  return source ? `${source}恢复` : "";
}

function endItemMessage(event: BattleProtocolEventV4, name: string): string {
  const item = cleanEffect(event.args[2] || "道具");
  return event.kwArgs.eat ? `${name}吃掉了${item}。` : `${name}的${item}生效了。`;
}

function healSourceText(event: BattleProtocolEventV4): string {
  const from = event.kwArgs.from || "";
  if (/^item:/i.test(from)) return cleanEffect(from);
  if (/^ability:/i.test(from)) return cleanEffect(from);
  if (/^move:/i.test(from)) return cleanEffect(from);
  return cleanEffect(from);
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

function fieldStartMessage(event: BattleProtocolEventV4): string {
  const field = toId(cleanEffect(event.args[1]));
  if (field.endsWith("terrain")) return `${fieldLabel(field)}展开了！`;
  if (field.endsWith("room") || field === "gravity") return `${fieldLabel(field)}扭曲了空间！`;
  return `${fieldLabel(field)}开始了！`;
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

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    electricterrain: "电气场地",
    grassyterrain: "青草场地",
    mistyterrain: "薄雾场地",
    psychicterrain: "精神场地",
    trickroom: "戏法空间",
    magicroom: "魔法空间",
    wonderroom: "奇妙空间",
    gravity: "重力",
  };
  return labels[field] || cleanEffect(field) || "环境";
}

function sideConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    reflect: "反射壁",
    lightscreen: "光墙",
    auroraveil: "极光幕",
    safeguard: "神秘守护",
    mist: "白雾",
    stealthrock: "隐形岩",
    spikes: "撒菱",
    toxicspikes: "毒菱",
    stickyweb: "黏黏网",
    tailwind: "顺风",
  };
  return labels[condition] || cleanEffect(condition) || "场地状态";
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
