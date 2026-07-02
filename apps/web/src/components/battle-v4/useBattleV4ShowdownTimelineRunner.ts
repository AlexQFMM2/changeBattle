import {useEffect, useMemo, useRef, useState} from "react";
import type {BattleAnimationEventV4} from "./battleV4Playback";
import type {ShowdownAnimationStepV4} from "./battleV4ShowdownAnimationAdapter";
import type {BattleVisualCommandV4} from "./battleV4VisualScene";

export type BattleV4ScheduledTimelineStep = {
  key: string;
  eventCheckpointId: string;
  eventKind: BattleAnimationEventV4["kind"];
  eventRawLine: string;
  eventSelectedAnimationKey: string;
  eventTimelineSteps: ShowdownAnimationStepV4[];
  command: BattleVisualCommandV4;
  index: number;
  step: ShowdownAnimationStepV4;
  offsetMs: number;
  durationMs: number;
  blocking: boolean;
};

export type BattleV4TimelineRunnerDebug = {
  groupId: string;
  groupStartedAt: string;
  scheduledHandles: Array<{
    key: string;
    eventCheckpointId: string;
    index: number;
    type: ShowdownAnimationStepV4["type"];
    offsetMs: number;
    durationMs: number;
    blocking: boolean;
  }>;
  blockingHandles: Array<{
    key: string;
    index: number;
    type: ShowdownAnimationStepV4["type"];
    finishMs: number;
  }>;
  expectedFinishMs: number;
  actualFinishAt: string;
};

type UseBattleV4ShowdownTimelineRunnerOptions = {
  activeCommands: BattleVisualCommandV4[];
  paused: boolean;
  skipAnimations: boolean;
  enabled: boolean;
  onEventStart: (scheduled: BattleV4ScheduledTimelineStep) => void;
  onCheckpoint: (step: Extract<ShowdownAnimationStepV4, {type: "checkpoint"}>, scheduled: BattleV4ScheduledTimelineStep) => void;
  onFinish: () => void;
};

export function useBattleV4ShowdownTimelineRunner(options: UseBattleV4ShowdownTimelineRunnerOptions) {
  const {activeCommands, paused, skipAnimations, enabled, onEventStart, onCheckpoint, onFinish} = options;
  const [activeTimelineStep, setActiveTimelineStep] = useState<ShowdownAnimationStepV4 | null>(null);
  const [activeTimelineStepIndex, setActiveTimelineStepIndex] = useState(-1);
  const [renderedTimelineSteps, setRenderedTimelineSteps] = useState<ShowdownAnimationStepV4[]>([]);
  const [renderedTimelineHandles, setRenderedTimelineHandles] = useState<BattleV4ScheduledTimelineStep[]>([]);
  const [debug, setDebug] = useState<BattleV4TimelineRunnerDebug>({
    groupId: "",
    groupStartedAt: "",
    scheduledHandles: [],
    blockingHandles: [],
    expectedFinishMs: 0,
    actualFinishAt: "",
  });
  const onEventStartRef = useRef(onEventStart);
  const onCheckpointRef = useRef(onCheckpoint);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onEventStartRef.current = onEventStart;
    onCheckpointRef.current = onCheckpoint;
    onFinishRef.current = onFinish;
  }, [onEventStart, onCheckpoint, onFinish]);

  const groupKey = activeCommands.map(command => command.animationEvent?.checkpointId || command.id).join("|");
  const scheduledSteps = useMemo(() => scheduleBattleV4AnimationGroup(activeCommands), [activeCommands]);

  useEffect(() => {
    setActiveTimelineStep(null);
    setActiveTimelineStepIndex(-1);
    setRenderedTimelineSteps([]);
    setRenderedTimelineHandles([]);
    if (!activeCommands.length) {
      setDebug(current => current.groupId ? {...current, groupId: "", scheduledHandles: [], blockingHandles: [], expectedFinishMs: 0} : current);
    }
  }, [groupKey, activeCommands.length]);

  useEffect(() => {
    if (!enabled || paused || skipAnimations || !activeCommands.length) return;
    const timers: number[] = [];
    const startedEvents = new Set<string>();
    let cancelled = false;
    const startedAt = new Date().toISOString();
    const expectedFinishMs = scheduledSteps.reduce((max, item) => Math.max(max, item.offsetMs + (item.blocking ? item.durationMs : 0)), 0);
    const blockingHandles = scheduledSteps
      .filter(item => item.blocking)
      .map(item => ({key: item.key, index: item.index, type: item.step.type, finishMs: item.offsetMs + item.durationMs}));
    setDebug({
      groupId: groupKey,
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
    for (const scheduled of scheduledSteps) {
      if (scheduled.step.type === "checkpoint") continue;
      const timer = window.setTimeout(() => {
        if (cancelled) return;
        if (!startedEvents.has(scheduled.eventCheckpointId)) {
          startedEvents.add(scheduled.eventCheckpointId);
          onEventStartRef.current(scheduled);
        }
        setActiveTimelineStep(scheduled.step);
        setActiveTimelineStepIndex(scheduled.index);
        setRenderedTimelineSteps(steps => [...steps, scheduled.step].slice(-32));
        setRenderedTimelineHandles(handles => [...handles, scheduled].slice(-32));
      }, scheduled.offsetMs);
      timers.push(timer);
    }
    const checkpoints = scheduledSteps.filter((item): item is BattleV4ScheduledTimelineStep & {step: Extract<ShowdownAnimationStepV4, {type: "checkpoint"}>} => item.step.type === "checkpoint");
    for (const checkpoint of checkpoints) {
      const timer = window.setTimeout(() => {
        if (cancelled) return;
        setActiveTimelineStep(checkpoint.step);
        setActiveTimelineStepIndex(checkpoint.index);
        setRenderedTimelineSteps(steps => [...steps, checkpoint.step].slice(-32));
        setRenderedTimelineHandles(handles => [...handles, checkpoint].slice(-32));
        onCheckpointRef.current(checkpoint.step, checkpoint);
      }, checkpoint.offsetMs);
      timers.push(timer);
    }
    const finishTimer = window.setTimeout(() => {
      if (cancelled) return;
      setDebug(current => ({...current, actualFinishAt: new Date().toISOString()}));
      onFinishRef.current();
    }, expectedFinishMs);
    timers.push(finishTimer);
    return () => {
      cancelled = true;
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [enabled, paused, skipAnimations, activeCommands.length, groupKey, scheduledSteps]);

  return {
    activeTimelineStep,
    activeTimelineStepIndex,
    renderedTimelineSteps,
    renderedTimelineHandles,
    debug,
  };
}

function scheduleBattleV4AnimationGroup(commands: BattleVisualCommandV4[]): BattleV4ScheduledTimelineStep[] {
  const scheduled: BattleV4ScheduledTimelineStep[] = [];
  let groupOffsetMs = 0;
  const targetLocks = new Map<string, number>();
  for (const command of commands) {
    const event = command.animationEvent;
    if (!event) continue;
    const eventSteps = event.timelineSteps.length ? event.timelineSteps : event.animationTimeline.steps;
    const targetKey = animationTargetKey(event);
    const eventOffsetMs = Math.max(groupOffsetMs, targetLocks.get(targetKey) || 0);
    const eventScheduled = scheduleBattleV4TimelineSteps(command, event, eventSteps, eventOffsetMs);
    scheduled.push(...eventScheduled);
    const eventFinishMs = eventScheduled.reduce((max, item) => Math.max(max, item.offsetMs + (item.blocking ? item.durationMs : 0)), eventOffsetMs);
    targetLocks.set(targetKey, eventFinishMs + followupGapMsForEvent(event));
    groupOffsetMs += waitForAnimationsModeForEvent(event) === "simult" ? 0 : eventFinishMs - groupOffsetMs;
  }
  return scheduled;
}

function scheduleBattleV4TimelineSteps(command: BattleVisualCommandV4, event: BattleAnimationEventV4, steps: ShowdownAnimationStepV4[], groupOffsetMs: number): BattleV4ScheduledTimelineStep[] {
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
      const durationMs = Math.max(0, step.durationMs);
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs, blocking: true});
      timeOffset += durationMs;
      return;
    }
    if (step.type === "actorAnim") {
      const actorKey = step.actor.seat || step.actor.ident || "actor";
      const offsetMs = Math.max(timeOffset, actorEndBySeat.get(actorKey) || 0);
      const durationMs = Math.max(80, step.durationMs);
      actorEndBySeat.set(actorKey, offsetMs + durationMs);
      scheduled.push({...base, offsetMs: groupOffsetMs + offsetMs, durationMs, blocking: true});
      return;
    }
    if (step.type === "showEffect") {
      const offsetMs = timeOffset + Math.max(0, step.delayMs || 0);
      scheduled.push({...base, offsetMs: groupOffsetMs + offsetMs, durationMs: Math.max(60, step.durationMs), blocking: true});
      return;
    }
    if (step.type === "backgroundEffect") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: Math.max(120, step.durationMs), blocking: true});
      return;
    }
    if (step.type === "resultAnim") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: 560, blocking: true});
      return;
    }
    if (step.type === "damageAnim" || step.type === "healAnim") {
      scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: 640, blocking: true});
      return;
    }
    scheduled.push({...base, offsetMs: groupOffsetMs + timeOffset, durationMs: 240, blocking: true});
  });
  const eventFinishMs = scheduled.reduce((max, item) => item.step.type === "checkpoint" ? max : Math.max(max, item.offsetMs + (item.blocking ? item.durationMs : 0)), groupOffsetMs);
  return scheduled.map(item => item.step.type === "checkpoint" ? {...item, offsetMs: eventFinishMs} : item);
}

function waitForAnimationsModeForEvent(event: BattleAnimationEventV4): true | false | "simult" {
  if (event.kind === "result") {
    const eventType = event.args[0] || "";
    if (eventType === "-crit" || eventType === "-supereffective" || eventType === "-resisted") return "simult";
  }
  return true;
}

function animationTargetKey(event: BattleAnimationEventV4): string {
  return event.targetSeat || event.actorSeat || event.targetName || event.actorName || "field";
}

function followupGapMsForEvent(event: BattleAnimationEventV4): number {
  if (event.kind === "result") return 80;
  if (event.kind === "damage" || event.kind === "heal") return 60;
  return 0;
}
