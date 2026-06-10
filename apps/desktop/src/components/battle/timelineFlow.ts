import type {BattleTimelineEvent} from "@changebattle/shared";
import {toId} from "../../lib/ui";

export type BattleSide = "p1" | "p2";

export type BattleDisplayStep =
  | {kind: "message"; event: BattleTimelineEvent}
  | {kind: "visual"; event: BattleTimelineEvent}
  | {kind: "hp"; event: BattleTimelineEvent}
  | {kind: "state"; event: BattleTimelineEvent}
  | {kind: "pause"; event?: BattleTimelineEvent; durationMs: number};

const MESSAGE_ONLY_TYPES = new Set(["message", "debug", "win"]);
const NOTICE_VISUAL_TYPES = new Set(["miss", "crit", "effectiveness"]);
const STATEFUL_VISUAL_TYPES = new Set(["boost", "status", "item", "ability", "weather", "field", "substitute", "faint"]);
const ENTRY_EFFECT_TYPES = new Set(["ability", "weather", "field", "item", "message"]);

export function buildBattleDisplaySteps(events: BattleTimelineEvent[]): BattleDisplayStep[] {
  const steps: BattleDisplayStep[] = [];
  for (const event of orderEntryPhaseEvents(events)) {
    if (MESSAGE_ONLY_TYPES.has(event.type)) {
      steps.push({kind: "message", event});
      continue;
    }
    if (event.type === "move") {
      steps.push({kind: "message", event}, {kind: "visual", event});
      continue;
    }
    if (event.type === "damage" || event.type === "heal") {
      steps.push({kind: "visual", event}, {kind: "hp", event}, {kind: "message", event});
      continue;
    }
    if (event.type === "switch") {
      steps.push({kind: "message", event}, {kind: "state", event}, {kind: "visual", event});
      continue;
    }
    if (event.type === "form") {
      steps.push({kind: "message", event}, {kind: "visual", event}, {kind: "state", event});
      continue;
    }
    if (NOTICE_VISUAL_TYPES.has(event.type)) {
      steps.push({kind: "message", event}, {kind: "visual", event});
      continue;
    }
    if (STATEFUL_VISUAL_TYPES.has(event.type)) {
      steps.push({kind: "message", event}, {kind: "visual", event}, {kind: "state", event});
      continue;
    }
    steps.push({kind: "message", event});
  }
  return steps;
}

function orderEntryPhaseEvents(events: BattleTimelineEvent[]): BattleTimelineEvent[] {
  const ordered: BattleTimelineEvent[] = [];
  for (let index = 0; index < events.length; index += 1) {
    const first = events[index];
    const second = events[index + 1];
    if (first?.type !== "switch" || second?.type !== "switch") {
      ordered.push(first);
      continue;
    }
    const firstSide = first.targetSide || first.side;
    const secondSide = second.targetSide || second.side;
    if (!firstSide || !secondSide || firstSide === secondSide) {
      ordered.push(first);
      continue;
    }
    const entryEffects: BattleTimelineEvent[] = [];
    let cursor = index + 2;
    while (cursor < events.length && isEntryEffectForSide(events[cursor], firstSide, secondSide)) {
      entryEffects.push(events[cursor]);
      cursor += 1;
    }
    if (!entryEffects.length) {
      ordered.push(first);
      continue;
    }
    ordered.push(
      first,
      ...entryEffects.filter(event => eventSide(event) === firstSide),
      second,
      ...entryEffects.filter(event => eventSide(event) === secondSide),
      ...entryEffects.filter(event => {
        const side = eventSide(event);
        return side !== firstSide && side !== secondSide;
      })
    );
    index = cursor - 1;
  }
  return ordered;
}

function eventSide(event: BattleTimelineEvent): BattleSide | undefined {
  return event.targetSide || event.side;
}

function isEntryEffectForSide(event: BattleTimelineEvent | undefined, firstSide: BattleSide, secondSide: BattleSide): boolean {
  if (!event || !ENTRY_EFFECT_TYPES.has(event.type)) return false;
  const side = eventSide(event);
  return !side || side === firstSide || side === secondSide;
}

export function eventCanMutateDisplayedActive(event: BattleTimelineEvent, displayedNames: Record<BattleSide, string>, displayedShowdownIds: Record<BattleSide, string>): boolean {
  if (!event.targetSide) return true;
  if (event.type === "form" && (event.effect === "DynamaxEnd" || event.text.includes("极巨化结束"))) return true;
  const eventShowdownId = String(event.target_showdown_id || "").trim().toLowerCase();
  const activeShowdownId = String(displayedShowdownIds[event.targetSide] || "").trim().toLowerCase();
  if (eventShowdownId || activeShowdownId) return Boolean(eventShowdownId && activeShowdownId && eventShowdownId === activeShowdownId);
  const targetId = toId(event.target_id || "");
  const activeId = toId(displayedNames[event.targetSide] || "");
  if (targetId || activeId) return Boolean(targetId && activeId && targetId === activeId);
  return false;
}
