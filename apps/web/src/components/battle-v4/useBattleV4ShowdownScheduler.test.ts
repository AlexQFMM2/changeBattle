import {createBattleV4ShowdownSchedulerPlan} from "./useBattleV4ShowdownScheduler.js";
import {compileShowdownPlaybackTimelineFromRawLog} from "../../../../../packages/showdown-battle-core/src/playbackCompiler.js";
import type {BattlePlaybackStepV4} from "./battleV4Playback.js";
import type {BattleVisualCommandV4} from "./battleV4VisualScene.js";

const BASE_HP_TWEEN_MS = 350;
const BATTLE_V4_MOVE_PLAYBACK_SPEED_SCALE = 1.5;
const BATTLE_V4_RESULT_PLAYBACK_SPEED_SCALE = 1.5;
const BATTLE_V4_FAST_PLAYBACK_SPEED_SCALE = 1;
const BATTLE_V4_HP_TWEEN_DURATION_MS = 350;

function smoke() {
  const rawLog = [
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|singles",
    "|gen|9",
    "|tier|[Gen 9] Custom Game",
    "|rated|",
    "|rule|Species Clause: Limit one of each Pokemon",
    "|rule|HP Percentage Mod: HP is shown in percentages",
    "|rule|Cancel Mod: Prevents moves from locking in",
    "|",
    "|t:|1782889410",
    "|switch|p1a: Raichu|Raichu, L50|100/100",
    "|switch|p2a: Fearow|Fearow, L50|100/100",
    "|turn|1",
    "|move|p1a: Raichu|Spark|p2a: Fearow",
    "|-supereffective|p2a: Fearow",
    "|-damage|p2a: Fearow|34/100",
    "|-enditem|p2a: Fearow|Oran Berry|[eat]",
    "|-heal|p2a: Fearow|44/100|[from] item: Oran Berry",
    "|move|p2a: Fearow|Pursuit|p1a: Raichu",
    "|-damage|p1a: Raichu|72/100",
    "|upkeep",
    "|turn|2",
  ];
  const timeline = compileShowdownPlaybackTimelineFromRawLog(rawLog, {sessionId: "scheduler-parity", previousIndex: 0});
  const backendSignatures = timeline.groups.map(groupSignature);
  const steps = timeline.groups.map(group => stepFromBackendGroup(group));
  const plan = createBattleV4ShowdownSchedulerPlan(steps, {
    preferBackendGroups: true,
    allowOpeningSwitchBatch: true,
    hpTweenDurationMs: BATTLE_V4_HP_TWEEN_DURATION_MS,
    playbackSpeed: {
      move: BATTLE_V4_MOVE_PLAYBACK_SPEED_SCALE,
      result: BATTLE_V4_RESULT_PLAYBACK_SPEED_SCALE,
      fast: BATTLE_V4_FAST_PLAYBACK_SPEED_SCALE,
    },
  });
  const signatures = plan.map(item => item.sceneCallSignature);
  assertEqual(signatures.join("|"), backendSignatures.join("|"), "scheduler scene call order must match Showdown client compiler groups");
  assertEqual(plan.length, steps.length, "scheduler should consume exactly one backend group per step in backend mode");
  assertEqual(plan.reduce((sum, item) => sum + item.consumeCount, 0), steps.length, "scheduler should not repeat or skip backend groups");
  for (const item of plan.filter(entry => entry.sceneCallSignature.includes("damage") || entry.sceneCallSignature.includes("heal"))) {
    if (item.blockingWorkCount <= 0) throw new Error(`${item.step.id} should register blocking visual work`);
    if (item.expectedFinishMs < BATTLE_V4_HP_TWEEN_DURATION_MS) throw new Error(`${item.step.id} should wait for HP work: ${item.expectedFinishMs}`);
    assertEqual(item.finishReason, "visual", `${item.step.id} should finish as visual work`);
  }
  assertEqual(BATTLE_V4_HP_TWEEN_DURATION_MS, BASE_HP_TWEEN_MS, "HP tween should stay fast");
  const moveStep = plan.find(item => item.sceneCallSignature === "move");
  if (!moveStep?.scheduledSteps.some(step => step.durationMs >= Math.round(BASE_HP_TWEEN_MS * BATTLE_V4_MOVE_PLAYBACK_SPEED_SCALE))) {
    throw new Error("scheduler should slow move visual durations");
  }
  const switchStep = plan.find(item => item.sceneCallSignature === "switch");
  if (!switchStep?.scheduledSteps.every(step => step.durationMs === BASE_HP_TWEEN_MS)) {
    throw new Error("scheduler should keep switch-in animation fast");
  }
  const damageStep = plan.find(item => item.sceneCallSignature === "damage");
  if (!damageStep?.scheduledSteps.every(step => step.durationMs === BATTLE_V4_HP_TWEEN_DURATION_MS)) {
    throw new Error("scheduler should keep damage animation fast");
  }
  assertEqual(plan.find(item => item.sceneCallSignature === "turn")?.finishReason, "immediate", "turn should finish immediately");
  const dynamaxRawLog = [
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|singles",
    "|gen|8",
    "|tier|[Gen 8] Custom Game",
    "|",
    "|switch|p1a: Lapras|Lapras, L50|100/100",
    "|switch|p2a: Lucario|Lucario, L50|100/100",
    "|turn|1",
    "|-start|p1a: Lapras|Dynamax|",
    "|-heal|p1a: Lapras|200/200|[silent]",
    "|move|p1a: Lapras|Max Geyser|p2a: Lucario",
    "|-damage|p2a: Lucario|10/100",
    "|upkeep",
    "|turn|2",
  ];
  const dynamaxTimeline = compileShowdownPlaybackTimelineFromRawLog(dynamaxRawLog, {sessionId: "scheduler-dynamax", previousIndex: 0});
  const dynamaxSteps = dynamaxTimeline.groups.map(group => stepFromBackendGroup(group));
  const dynamaxPlan = createBattleV4ShowdownSchedulerPlan(dynamaxSteps, {
    preferBackendGroups: true,
    allowOpeningSwitchBatch: true,
    hpTweenDurationMs: BATTLE_V4_HP_TWEEN_DURATION_MS,
    playbackSpeed: {
      move: BATTLE_V4_MOVE_PLAYBACK_SPEED_SCALE,
      result: BATTLE_V4_RESULT_PLAYBACK_SPEED_SCALE,
      fast: BATTLE_V4_FAST_PLAYBACK_SPEED_SCALE,
    },
  });
  const dynamaxSignatures = dynamaxPlan.map(item => item.sceneCallSignature);
  const transformIndex = dynamaxSignatures.findIndex(signature => signature.includes("transform"));
  const healIndex = dynamaxSignatures.findIndex(signature => signature.includes("heal"));
  const moveIndex = dynamaxSignatures.indexOf("move");
  if (transformIndex < 0 || healIndex < 0 || moveIndex < 0 || !(transformIndex < healIndex && healIndex < moveIndex)) {
    throw new Error(`scheduler should consume dynamax transform before heal and max move: ${dynamaxSignatures.join(" -> ")}`);
  }
  console.log("battle-v4 showdown scheduler parity smoke ok", signatures.join(" -> "));
}

function stepFromBackendGroup(group: ReturnType<typeof compileShowdownPlaybackTimelineFromRawLog>["groups"][number]): BattlePlaybackStepV4 {
  const primaryKind = playbackKindForGroup(group);
  const commands = group.calls
    .map(call => commandForSceneCall(call))
    .filter((item): item is BattleVisualCommandV4 => Boolean(item));
  const waitMode = group.waitMode === "immediate" || primaryKind === "turn" ? "immediate" : group.waitMode === "simult" ? "simult" : "wait";
  return {
    id: group.id,
    sequence: group.rawIndices[0] ?? group.index,
    rawLine: group.rawLines.join("\n"),
    messages: [],
    commands,
    showdownGroup: group,
    sceneCalls: group.calls,
    waitMode,
    minDurationMs: commands.length ? 120 : waitMode === "immediate" ? 0 : 420,
    kind: primaryKind,
  };
}

function commandForSceneCall(call: ReturnType<typeof compileShowdownPlaybackTimelineFromRawLog>["groups"][number]["calls"][number]): BattleVisualCommandV4 | null {
  const semanticKind = semanticKindForCall(call);
  if (!semanticKind) return null;
  const timelineStepType = timelineStepTypeForCall(call);
  const sequence = call.rawIndex ?? call.rawStep ?? 0;
  const callKey = `${sequence}-${call.kind}-${call.label || ""}`;
  const rawLine = call.rawLine || "";
  return {
    id: `${callKey}-${semanticKind}`,
    semanticEvent: {
      kind: semanticKind,
      sequence,
      rawLine,
      seat: "p2A",
      oldHp: 100,
      newHp: 60,
      maxHp: 100,
      status: "",
    } as any,
    animationEvent: {
      checkpointId: `${callKey}-${semanticKind}`,
      kind: animationKindForSemanticKind(semanticKind),
      args: [rawLine.includes("-supereffective") ? "-supereffective" : ""],
      rawLine,
      actorSeat: "p1A",
      targetSeat: "p2A",
      actorName: "Raichu",
      targetName: "Fearow",
      selectedAnimationKey: semanticKind,
      timelineSteps: [{type: timelineStepType, durationMs: BASE_HP_TWEEN_MS, actor: {seat: "p1A"}}],
      animationTimeline: {steps: [{type: timelineStepType, durationMs: BASE_HP_TWEEN_MS, actor: {seat: "p1A"}}]},
    } as any,
    blocksCommands: true,
  };
}

function groupSignature(group: ReturnType<typeof compileShowdownPlaybackTimelineFromRawLog>["groups"][number]): string {
  return group.calls.map(call => call.kind === "otherAnim" ? `${call.kind}:${call.effect}` : call.kind).join("+");
}

function playbackKindForGroup(group: ReturnType<typeof compileShowdownPlaybackTimelineFromRawLog>["groups"][number]): BattlePlaybackStepV4["kind"] {
  if (group.calls.some(call => call.kind === "switch")) return "switchIn";
  if (group.calls.some(call => call.kind === "move")) return "move";
  if (group.calls.some(call => call.kind === "damage")) return "damage";
  if (group.calls.some(call => call.kind === "heal")) return "heal";
  if (group.calls.some(call => call.kind === "transform")) return "transform";
  if (group.calls.some(call => call.kind === "result" || call.kind === "otherAnim")) return "result";
  if (group.calls.some(call => call.kind === "turn")) return "turn";
  return "message";
}

function semanticKindForCall(call: ReturnType<typeof compileShowdownPlaybackTimelineFromRawLog>["groups"][number]["calls"][number]): string {
  if (call.kind === "switch") return "switchIn";
  if (call.kind === "move") return "move";
  if (call.kind === "damage") return "damage";
  if (call.kind === "heal") return "heal";
  if (call.kind === "transform") return "transform";
  if (call.kind === "result" || call.kind === "otherAnim") return "result";
  return "";
}

function animationKindForSemanticKind(kind: string): string {
  if (kind === "switchIn") return "switchIn";
  if (kind === "move") return "moveEffect";
  if (kind === "damage") return "damage";
  if (kind === "heal") return "heal";
  if (kind === "transform") return "transform";
  return "result";
}

function timelineStepTypeForCall(call: ReturnType<typeof compileShowdownPlaybackTimelineFromRawLog>["groups"][number]["calls"][number]): string {
  if (call.kind === "switch") return "actorAnim";
  if (call.kind === "move") return "showEffect";
  if (call.kind === "damage") return "damageAnim";
  if (call.kind === "heal") return "healAnim";
  if (call.kind === "transform") return "showEffect";
  return "resultAnim";
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nexpected: ${String(expected)}\nactual: ${String(actual)}`);
  }
}

smoke();
