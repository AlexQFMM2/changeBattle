import {useEffect, useRef, useState} from "react";
import type {AppDebugConfigV4} from "@changebattle-v2/api";
import type {BattlePlaybackStepConsumptionV4, BattlePlaybackStepV4, BattleProtocolSeatV4} from "./battleV4Playback";
import type {ShowdownAnimationStepV4} from "./battleV4ShowdownAnimationAdapter";
import type {BattleVisualCommandV4} from "./battleV4VisualScene";
import type {BattleV4ScheduledTimelineStep, BattleV4TimelineRunnerDebug} from "./useBattleV4ShowdownTimelineRunner";

export type BattleV4SceneWork = {
  key: string;
  promise: Promise<void>;
};

export class BattleV4SceneWorkRuntime {
  activeAnimations: Promise<void>[] = [];
  timeOffset = 0;
  minDelay = 0;
  interruptionCount = 0;

  startAnimations(): void {
    this.activeAnimations = [];
    this.timeOffset = 0;
    this.minDelay = 0;
    this.interruptionCount++;
  }

  waitFor(work: BattleV4SceneWork): void {
    this.activeAnimations.push(work.promise);
  }

  wait(time: number): void {
    this.timeOffset += Math.max(0, time);
  }

  finishAnimations(): Promise<void> | undefined {
    if (this.minDelay || this.timeOffset) {
      this.activeAnimations.push(delayBattleV4SceneWork(Math.max(this.minDelay, this.timeOffset), "scene-delay").promise);
    }
    if (!this.activeAnimations.length) return undefined;
    return Promise.allSettled(this.activeAnimations).then(() => undefined);
  }
}

export const EMPTY_TIMELINE_RUNNER_DEBUG: BattleV4TimelineRunnerDebug = {
  groupId: "",
  groupStartedAt: "",
  scheduledHandles: [],
  blockingHandles: [],
  expectedFinishMs: 0,
  actualFinishAt: "",
};

export type BattleV4ShowdownSchedulerPlanItem = {
  step: BattlePlaybackStepV4;
  consumeCount: number;
  openingSeats: BattleProtocolSeatV4[];
  scheduledSteps: BattleV4ScheduledTimelineStep[];
  blockingWorkCount: number;
  expectedFinishMs: number;
  finishReason: BattlePlaybackStepConsumptionV4["reason"];
  sceneCallSignature: string;
};

type UseBattleV4ShowdownSchedulerOptions = {
  stepQueue: BattlePlaybackStepV4[];
  activeStep: BattlePlaybackStepV4 | null;
  paused: boolean;
  skipAnimations: boolean;
  preferBackendGroups: boolean;
  allowOpeningSwitchBatch: boolean;
  hpTweenDurationMs: number;
  playbackSpeedScale?: number;
  debugConfig?: AppDebugConfigV4;
  resetKey: string;
  onConsumeSteps: (count: number) => void;
  onStepStart: (payload: {
    step: BattlePlaybackStepV4;
    startedAt: string;
    openingSeats: BattleProtocolSeatV4[];
    scheduledSteps: BattleV4ScheduledTimelineStep[];
  }) => void;
  onScheduledStep: (scheduled: BattleV4ScheduledTimelineStep, step: BattlePlaybackStepV4) => void;
  onCheckpoint: (scheduled: BattleV4ScheduledTimelineStep, openingSeats: BattleProtocolSeatV4[]) => void;
  onStepFinish: (step: BattlePlaybackStepV4, reason: BattlePlaybackStepConsumptionV4["reason"]) => void;
};

export function useBattleV4ShowdownScheduler(options: UseBattleV4ShowdownSchedulerOptions) {
  const {
    stepQueue,
    activeStep,
    paused,
    skipAnimations,
    preferBackendGroups,
    allowOpeningSwitchBatch,
    hpTweenDurationMs,
    playbackSpeedScale = 1,
    resetKey,
  } = options;
  const [activeTimelineStep, setActiveTimelineStep] = useState<ShowdownAnimationStepV4 | null>(null);
  const [activeTimelineStepIndex, setActiveTimelineStepIndex] = useState(-1);
  const [renderedTimelineSteps, setRenderedTimelineSteps] = useState<ShowdownAnimationStepV4[]>([]);
  const [renderedTimelineHandles, setRenderedTimelineHandles] = useState<BattleV4ScheduledTimelineStep[]>([]);
  const [debug, setDebug] = useState<BattleV4TimelineRunnerDebug>(EMPTY_TIMELINE_RUNNER_DEBUG);
  const [activeWorkCount, setActiveWorkCount] = useState(0);
  const sceneRuntimeRef = useRef(new BattleV4SceneWorkRuntime());
  const interruptionCountRef = useRef(0);
  const playingRef = useRef(false);
  const timerRefs = useRef<number[]>([]);
  const callbacksRef = useRef({
    onConsumeSteps: options.onConsumeSteps,
    onStepStart: options.onStepStart,
    onScheduledStep: options.onScheduledStep,
    onCheckpoint: options.onCheckpoint,
    onStepFinish: options.onStepFinish,
  });

  useEffect(() => {
    callbacksRef.current = {
      onConsumeSteps: options.onConsumeSteps,
      onStepStart: options.onStepStart,
      onScheduledStep: options.onScheduledStep,
      onCheckpoint: options.onCheckpoint,
      onStepFinish: options.onStepFinish,
    };
  }, [options.onConsumeSteps, options.onStepStart, options.onScheduledStep, options.onCheckpoint, options.onStepFinish]);

  useEffect(() => () => {
    timerRefs.current.forEach(timer => window.clearTimeout(timer));
    timerRefs.current = [];
  }, []);

  useEffect(() => {
    sceneRuntimeRef.current.startAnimations();
    timerRefs.current.forEach(timer => window.clearTimeout(timer));
    timerRefs.current = [];
    playingRef.current = false;
    setActiveTimelineStep(null);
    setActiveTimelineStepIndex(-1);
    setRenderedTimelineSteps([]);
    setRenderedTimelineHandles([]);
    setDebug(EMPTY_TIMELINE_RUNNER_DEBUG);
    setActiveWorkCount(0);
  }, [resetKey]);

  useEffect(() => {
    if (paused || playingRef.current || activeStep || skipAnimations || !stepQueue.length) return;

    const time = Date.now();
    const scene = sceneRuntimeRef.current;
    scene.startAnimations();
    interruptionCountRef.current = scene.interruptionCount;
    timerRefs.current.forEach(timer => window.clearTimeout(timer));
    timerRefs.current = [];

    const plan = createBattleV4ShowdownSchedulerPlan(stepQueue, {
      preferBackendGroups,
      allowOpeningSwitchBatch,
      hpTweenDurationMs,
      playbackSpeedScale,
      maxSteps: 1,
    })[0];
    if (!plan) return;
    const {step: playbackStep, consumeCount, openingSeats, scheduledSteps, blockingWorkCount, expectedFinishMs, finishReason} = plan;

    playingRef.current = true;
    const startedAt = new Date().toISOString();
    const blockingHandles = scheduledSteps
      .filter(item => item.blocking)
      .map(item => ({key: item.key, index: item.index, type: item.step.type, finishMs: item.offsetMs + item.durationMs}));

    callbacksRef.current.onConsumeSteps(consumeCount);
    setRenderedTimelineSteps([]);
    setRenderedTimelineHandles([]);
    setActiveTimelineStep(null);
    setActiveTimelineStepIndex(-1);
    setActiveWorkCount(blockingWorkCount);
    setDebug({
      groupId: playbackStep.id,
      groupStartedAt: startedAt,
      scheduledHandles: scheduledSteps.map(item => ({
        key: item.key,
        eventCheckpointId: item.eventCheckpointId,
        index: item.index,
        type: item.step.type,
        offsetMs: item.offsetMs,
        durationMs: item.durationMs,
        blocking: item.blocking,
      })),
      blockingHandles,
      expectedFinishMs,
      actualFinishAt: "",
    });
    callbacksRef.current.onStepStart({step: playbackStep, startedAt, openingSeats, scheduledSteps});

    const startedEvents = new Set<string>();
    const runScheduledStep = (scheduled: BattleV4ScheduledTimelineStep) => {
      if (interruptionCountRef.current !== scene.interruptionCount) return;
      if (!startedEvents.has(scheduled.eventCheckpointId)) {
        startedEvents.add(scheduled.eventCheckpointId);
        callbacksRef.current.onScheduledStep(scheduled, playbackStep);
      }
      setActiveTimelineStep(scheduled.step);
      setActiveTimelineStepIndex(scheduled.index);
      if (scheduled.step.type !== "checkpoint") {
        setRenderedTimelineSteps(steps => [...steps, scheduled.step].slice(-8));
        setRenderedTimelineHandles(handles => [scheduled, ...handles.filter(handle => handle.key !== scheduled.key)].slice(0, 8));
        const clearTimer = window.setTimeout(() => {
          setRenderedTimelineHandles(handles => handles.filter(handle => handle.key !== scheduled.key));
        }, Math.max(80, scheduled.durationMs));
        timerRefs.current.push(clearTimer);
      } else {
        callbacksRef.current.onCheckpoint(scheduled, openingSeats);
      }
    };

    for (const scheduled of scheduledSteps) {
      const timer = window.setTimeout(() => runScheduledStep(scheduled), scheduled.offsetMs);
      timerRefs.current.push(timer);
      if (scheduled.blocking && playbackStep.waitMode !== "immediate") {
        scene.waitFor(delayBattleV4SceneWork(scheduled.offsetMs + scheduled.durationMs, scheduled.key));
      }
    }

    if (playbackStep.minDurationMs) scene.wait(playbackStep.minDurationMs);
    const animations = playbackStep.waitMode === "immediate" ? undefined : scene.finishAnimations();
    if (playbackStep.waitMode === "simult") scene.timeOffset = 0;
    const finish = () => {
      if (interruptionCountRef.current !== scene.interruptionCount) return;
      setDebug(current => ({...current, actualFinishAt: new Date().toISOString()}));
      setActiveWorkCount(0);
      playingRef.current = false;
      callbacksRef.current.onStepFinish(playbackStep, finishReason);
    };

    if (Date.now() - time > 300) {
      const interruptionCount = scene.interruptionCount;
      const timer = window.setTimeout(() => {
        if (interruptionCount === scene.interruptionCount) {
          animations ? animations.then(finish) : finish();
        }
      }, 1);
      timerRefs.current.push(timer);
      return;
    }

    animations ? animations.then(finish) : finish();
  }, [stepQueue, activeStep, paused, skipAnimations, preferBackendGroups, allowOpeningSwitchBatch, hpTweenDurationMs, playbackSpeedScale]);

  return {
    activeTimelineStep,
    activeTimelineStepIndex,
    renderedTimelineSteps,
    renderedTimelineHandles,
    debug,
    activeWorkCount,
  };
}

export function delayBattleV4SceneWork(durationMs: number, key: string): BattleV4SceneWork {
  return {
    key,
    promise: new Promise(resolve => {
      window.setTimeout(resolve, Math.max(0, durationMs));
    }),
  };
}

export function mergeBattleV4PlaybackSteps(steps: BattlePlaybackStepV4[]): BattlePlaybackStepV4 | null {
  const first = steps[0];
  if (!first) return null;
  if (steps.length === 1) return first;
  const messages = steps.flatMap(step => step.messages);
  const commands = steps.flatMap(step => step.commands);
  return {
    id: steps.map(step => step.id).join("|"),
    sequence: first.sequence,
    rawLine: steps.map(step => step.rawLine).join("\n"),
    message: messages[0],
    messages,
    commands,
    showdownGroup: first.showdownGroup,
    sceneCalls: steps.flatMap(step => step.sceneCalls),
    waitMode: steps.some(step => step.waitMode === "wait") ? "wait" : steps.some(step => step.waitMode === "simult") ? "simult" : "immediate",
    minDurationMs: Math.max(...steps.map(step => step.minDurationMs)),
    kind: first.kind,
  };
}

export function createBattleV4ShowdownSchedulerPlan(
  stepQueue: BattlePlaybackStepV4[],
  options: {
    preferBackendGroups: boolean;
    allowOpeningSwitchBatch: boolean;
    hpTweenDurationMs: number;
    playbackSpeedScale?: number;
    maxSteps?: number;
  },
): BattleV4ShowdownSchedulerPlanItem[] {
  const result: BattleV4ShowdownSchedulerPlanItem[] = [];
  let queue = stepQueue;
  const maxSteps = Math.max(1, options.maxSteps ?? stepQueue.length);
  while (queue.length && result.length < maxSteps) {
    const groupSteps = options.preferBackendGroups ? [queue[0]!] : leadingBattleV4PlaybackStepGroup(queue, options.allowOpeningSwitchBatch && result.length === 0);
    const playbackStep = mergeBattleV4PlaybackSteps(groupSteps);
    if (!playbackStep) break;
    const openingSwitchInBatch = playbackStep.kind === "switchIn" && options.allowOpeningSwitchBatch && result.length === 0 ? leadingSwitchInCommands(playbackStep.commands) : [];
    const openingSeats = openingSwitchInBatch.length > 1 ? openingSwitchInBatch.map(item => item.semanticEvent.seat) : [];
    const scheduledSteps = scheduleBattleV4AnimationGroupForScheduler(
      playbackStep.commands.filter(command => command.animationEvent),
      options.hpTweenDurationMs,
      options.playbackSpeedScale ?? 1,
    );
    const expectedFinishMs = scheduledSteps.reduce((max, item) => Math.max(max, item.offsetMs + (item.blocking ? item.durationMs : 0)), 0);
    const scaledMinDurationMs = scaleBattleV4PlaybackMs(playbackStep.minDurationMs, options.playbackSpeedScale ?? 1);
    result.push({
      step: {...playbackStep, minDurationMs: scaledMinDurationMs},
      consumeCount: groupSteps.length || 1,
      openingSeats,
      scheduledSteps,
      blockingWorkCount: scheduledSteps.filter(item => item.blocking).length + (scaledMinDurationMs ? 1 : 0),
      expectedFinishMs: Math.max(expectedFinishMs, scaledMinDurationMs),
      finishReason: scheduledSteps.length ? "visual" : playbackStep.waitMode === "immediate" ? "immediate" : "message-only",
      sceneCallSignature: playbackStep.sceneCalls.map(call => call.kind === "otherAnim" ? `${call.kind}:${call.effect}` : call.kind).join("+"),
    });
    queue = queue.slice(groupSteps.length || 1);
  }
  return result;
}

function leadingBattleV4PlaybackStepGroup(queue: BattlePlaybackStepV4[], allowOpeningSwitchBatch: boolean): BattlePlaybackStepV4[] {
  const first = queue[0];
  if (!first) return [];
  if (allowOpeningSwitchBatch && first.kind === "switchIn") {
    const batch: BattlePlaybackStepV4[] = [];
    for (const step of queue) {
      if (step.kind !== "switchIn") break;
      batch.push(step);
    }
    return batch.length > 1 ? batch : [first];
  }
  const group = [first];
  if (!shouldGroupFollowingMinorEvents(first)) return group;
  for (const step of queue.slice(1)) {
    if (!isShowdownMinorFollowup(step)) break;
    group.push(step);
  }
  return group;
}

function leadingSwitchInCommands(queue: BattleVisualCommandV4[]): Array<BattleVisualCommandV4 & {semanticEvent: {kind: "switchIn"; seat: BattleProtocolSeatV4; rawLine: string}}> {
  const batch: Array<BattleVisualCommandV4 & {semanticEvent: {kind: "switchIn"; seat: BattleProtocolSeatV4; rawLine: string}}> = [];
  for (const command of queue) {
    if (command.semanticEvent.kind !== "switchIn") break;
    batch.push(command as BattleVisualCommandV4 & {semanticEvent: {kind: "switchIn"; seat: BattleProtocolSeatV4; rawLine: string}});
  }
  return batch;
}

function shouldGroupFollowingMinorEvents(step: BattlePlaybackStepV4): boolean {
  return step.kind === "move" ||
    step.kind === "result" ||
    step.kind === "damage" ||
    step.kind === "heal";
}

function isShowdownMinorFollowup(step: BattlePlaybackStepV4): boolean {
  return step.kind === "result" ||
    step.kind === "damage" ||
    step.kind === "heal" ||
    step.kind === "status" ||
    step.kind === "cureStatus";
}

function scheduleBattleV4AnimationGroupForScheduler(commands: BattleVisualCommandV4[], hpTweenDurationMs: number, playbackSpeedScale: number): BattleV4ScheduledTimelineStep[] {
  const scheduled: BattleV4ScheduledTimelineStep[] = [];
  let groupOffsetMs = 0;
  const targetLocks = new Map<string, number>();
  for (const command of commands) {
    const event = command.animationEvent;
    if (!event) continue;
    const eventSteps = event.timelineSteps.length ? event.timelineSteps : event.animationTimeline.steps;
    const targetKey = animationTargetKeyForScheduler(event);
    const eventOffsetMs = Math.max(groupOffsetMs, targetLocks.get(targetKey) || 0);
    const eventScheduled = scheduleBattleV4TimelineStepsForScheduler(command, eventSteps, eventOffsetMs, hpTweenDurationMs, playbackSpeedScale);
    scheduled.push(...eventScheduled);
    const eventFinishMs = eventScheduled.reduce((max, item) => Math.max(max, item.offsetMs + (item.blocking ? item.durationMs : 0)), eventOffsetMs);
    targetLocks.set(targetKey, eventFinishMs + scaleBattleV4PlaybackMs(followupGapMsForScheduler(command), playbackSpeedScale));
    groupOffsetMs += waitForAnimationsModeForScheduler(command) === "simult" ? 0 : eventFinishMs - groupOffsetMs;
  }
  return scheduled;
}

function scheduleBattleV4TimelineStepsForScheduler(
  command: BattleVisualCommandV4,
  steps: ShowdownAnimationStepV4[],
  groupOffsetMs: number,
  hpTweenDurationMs: number,
  playbackSpeedScale: number,
): BattleV4ScheduledTimelineStep[] {
  const event = command.animationEvent;
  if (!event) return [];
  const scheduled: BattleV4ScheduledTimelineStep[] = [];
  const actorEndBySeat = new Map<string, number>();
  let timeOffset = 0;
  steps.forEach((step, index) => {
    const base = {
      key: `${event.checkpointId}-${index}-${step.type}`,
      eventCheckpointId: event.checkpointId,
      eventKind: event.kind,
      eventRawLine: event.rawLine,
      eventSelectedAnimationKey: event.selectedAnimationKey,
      eventTimelineSteps: event.timelineSteps,
      command,
      index,
      step,
    };
    if (step.type === "checkpoint") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: 0, blocking: false});
      return;
    }
    if (step.type === "wait" || step.type === "delay") {
      const durationMs = scaleBattleV4PlaybackMs(step.durationMs, playbackSpeedScale);
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs, blocking: true});
      timeOffset += durationMs;
      return;
    }
    if (step.type === "actorAnim") {
      const actorKey = step.actor.seat || step.actor.ident || "actor";
      const offsetMs = Math.max(timeOffset, actorEndBySeat.get(actorKey) || 0);
      const durationMs = Math.max(scaleBattleV4PlaybackMs(80, playbackSpeedScale), scaleBattleV4PlaybackMs(step.durationMs, playbackSpeedScale));
      actorEndBySeat.set(actorKey, offsetMs + durationMs);
      scheduled.push({...base, offsetMs: groupOffsetMs + offsetMs, durationMs, blocking: true});
      return;
    }
    if (step.type === "showEffect") {
      const offsetMs = timeOffset + scaleBattleV4PlaybackMs(step.delayMs || 0, playbackSpeedScale);
      scheduled.push({...base, offsetMs: groupOffsetMs + offsetMs, durationMs: Math.max(scaleBattleV4PlaybackMs(60, playbackSpeedScale), scaleBattleV4PlaybackMs(step.durationMs, playbackSpeedScale)), blocking: true});
      return;
    }
    if (step.type === "backgroundEffect") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: Math.max(scaleBattleV4PlaybackMs(120, playbackSpeedScale), scaleBattleV4PlaybackMs(step.durationMs, playbackSpeedScale)), blocking: true});
      return;
    }
    if (step.type === "resultAnim") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: scaleBattleV4PlaybackMs(560, playbackSpeedScale), blocking: true});
      return;
    }
    if (step.type === "damageAnim" || step.type === "healAnim") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: hpTweenDurationMs, blocking: true});
      return;
    }
    scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: scaleBattleV4PlaybackMs(240, playbackSpeedScale), blocking: true});
  });
  const eventFinishMs = scheduled.reduce((max, item) => item.step.type === "checkpoint" ? max : Math.max(max, item.offsetMs + (item.blocking ? item.durationMs : 0)), groupOffsetMs);
  return scheduled.map(item => item.step.type === "checkpoint" ? {...item, offsetMs: eventFinishMs} : item);
}

function scaleBattleV4PlaybackMs(durationMs: number, playbackSpeedScale: number): number {
  if (!durationMs) return 0;
  return Math.max(0, Math.round(durationMs * Math.max(0.1, playbackSpeedScale)));
}

function waitForAnimationsModeForScheduler(command: BattleVisualCommandV4): true | false | "simult" {
  const event = command.animationEvent;
  if (event?.kind === "result") {
    const eventType = event.args[0] || "";
    if (eventType === "-crit" || eventType === "-supereffective" || eventType === "-resisted") return "simult";
  }
  return true;
}

function animationTargetKeyForScheduler(event: NonNullable<BattleVisualCommandV4["animationEvent"]>): string {
  return event.targetSeat || event.actorSeat || event.targetName || event.actorName || "field";
}

function followupGapMsForScheduler(command: BattleVisualCommandV4): number {
  const event = command.animationEvent;
  if (!event) return 0;
  if (event.kind === "result") return 80;
  if (event.kind === "damage" || event.kind === "heal") return 60;
  return 0;
}
