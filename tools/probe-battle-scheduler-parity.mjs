#!/usr/bin/env node
import {
  callSignature,
  compileTimelineFromDiagnostics,
  diagnosticsConsumption,
  findTimelineWarnings,
  groupSignature,
  loadFrontendSchedulerPlan,
  parseProbeArgs,
  printTableSummary,
  readDiagnostics,
  schedulerSignatureForGroup,
  summarizeConsumption,
} from "./battle-playback-probe-lib.mjs";

const BASE_HP_TWEEN_MS = 350;

async function main() {
  const args = parseProbeArgs(process.argv.slice(2));
  const {diagnostics, rawLog} = readDiagnostics(args.diagnosticsPath);
  const timeline = await compileTimelineFromDiagnostics(diagnostics, rawLog, {useSavedTimeline: args.useSavedTimeline});
  const createBattleV4ShowdownSchedulerPlan = await loadFrontendSchedulerPlan();
  const steps = timeline.groups.map(stepFromBackendGroup);
  const plan = createBattleV4ShowdownSchedulerPlan(steps, {
    preferBackendGroups: true,
    allowOpeningSwitchBatch: false,
    hpTweenDurationMs: BASE_HP_TWEEN_MS,
    maxSteps: steps.length,
  });
  const backendRows = timeline.groups.map((group, index) => ({
    index,
    groupId: group.id,
    raw: group.rawIndices.length ? group.rawIndices.join(",") : "scene",
    signature: groupSignature(group),
    schedulerSignature: schedulerSignatureForGroup(group),
    summary: group.summary,
  }));
  const planRows = plan.map((item, index) => ({
    index,
    stepId: item.step.id,
    consumeCount: item.consumeCount,
    signature: item.sceneCallSignature || "(empty)",
    blockingWorkCount: item.blockingWorkCount,
    expectedFinishMs: item.expectedFinishMs,
    finishReason: item.finishReason,
  }));
  const consumptionRows = summarizeConsumption(diagnosticsConsumption(diagnostics));
  const backendSignatures = backendRows.map(row => row.schedulerSignature);
  const planSignatures = planRows.map(row => row.signature);
  const signatureMatch = backendSignatures.join("\n") === planSignatures.join("\n");
  const groupOrderMatch = backendRows.map(row => row.groupId).join("\n") === planRows.map(row => row.stepId).join("\n");
  const consumedGroupIds = consumptionRows.map(row => row.showdownGroupId).filter(Boolean);
  const backendGroupIds = backendRows.map(row => row.groupId);
  const consumedPrefixMatch = consumedGroupIds.every((groupId, index) => groupId === backendGroupIds[index]);
  const warnings = findTimelineWarnings(timeline, rawLog);

  if (args.json || args.full) {
    console.log(JSON.stringify({
      diagnosticsPath: args.diagnosticsPath,
      rawLogLength: rawLog.length,
      backendRows,
      planRows,
      consumptionRows,
      groupOrderMatch,
      signatureMatch,
      consumedPrefixMatch,
      warnings,
      timeline: args.full ? timeline : undefined,
      plan: args.full ? plan : undefined,
    }, null, 2));
    return;
  }

  console.log(`Diagnostics: ${args.diagnosticsPath}`);
  console.log(`rawLogLength=${rawLog.length} backendGroups=${backendRows.length} schedulerSteps=${planRows.length}`);
  console.log(`backend group order === scheduler step order: ${groupOrderMatch ? "YES" : "NO"}`);
  console.log(`backend scheduler-signature === scheduler signature: ${signatureMatch ? "YES" : "NO"}`);
  if (consumptionRows.length) {
    console.log(`diagnostics consumed group prefix === backend groups: ${consumedPrefixMatch ? "YES" : "NO"} (${consumedGroupIds.length} consumed)`);
  }

  printTableSummary("Backend Groups", backendRows.map(row => {
    return `${String(row.index).padStart(2, "0")} ${row.groupId.padEnd(14)} raw=${String(row.raw).padEnd(10)} ${row.signature} :: ${row.summary}`;
  }));
  printTableSummary("Frontend Scheduler Plan", planRows.map(row => {
    return `${String(row.index).padStart(2, "0")} ${row.stepId.padEnd(14)} consume=${String(row.consumeCount).padEnd(2)} work=${String(row.blockingWorkCount).padEnd(2)} finish=${String(row.expectedFinishMs).padEnd(4)} ${row.signature} :: ${row.finishReason}`;
  }));
  if (consumptionRows.length) {
    printTableSummary("Diagnostics Actual Consumption", consumptionRows.map(row => {
      return `${String(row.index).padStart(2, "0")} ${String(row.showdownGroupId || "").padEnd(14)} seq=${String(row.sequence).padEnd(3)} ${row.signature || row.kind} :: ${row.message || ""}`;
    }));
  }
  if (warnings.length) {
    printTableSummary("Warnings", warnings.map(item => `! ${item}`));
  }
}

function stepFromBackendGroup(group) {
  const primaryKind = playbackKindForGroup(group);
  const commands = group.calls
    .map(commandForSceneCall)
    .filter(Boolean);
  return {
    id: group.id,
    sequence: group.rawIndices[0] ?? group.index,
    rawLine: group.rawLines.join("\n"),
    messages: [],
    commands,
    showdownGroup: group,
    sceneCalls: group.calls,
    waitMode: group.waitMode === "immediate" || primaryKind === "turn" ? "immediate" : group.waitMode === "simult" ? "simult" : "wait",
    minDurationMs: commands.length ? 120 : group.waitMode === "immediate" ? 0 : 420,
    kind: primaryKind,
  };
}

function commandForSceneCall(call) {
  const semanticKind = semanticKindForCall(call);
  if (!semanticKind) return null;
  const sequence = call.rawIndex ?? call.rawStep ?? 0;
  const targetSeat = showdownIdentToProbeSeat(call.target || call.pokemon || "");
  const actorSeat = showdownIdentToProbeSeat(call.pokemon || call.target || "");
  const rawLine = call.rawLine || "";
  const eventKind = animationKindForSemanticKind(semanticKind);
  return {
    id: `${sequence}-${call.kind}-${semanticKind}-${call.label || ""}`,
    semanticEvent: {
      kind: semanticKind,
      sequence,
      rawLine,
      seat: targetSeat || actorSeat || "p2A",
      oldHp: 100,
      newHp: semanticKind === "heal" ? 80 : 60,
      maxHp: 100,
      status: "",
    },
    animationEvent: {
      checkpointId: `${sequence}-${call.kind}-${callSignature(call)}`,
      kind: eventKind,
      args: [resultEventArg(call)],
      rawLine,
      actorSeat: actorSeat || "p1A",
      targetSeat: targetSeat || actorSeat || "p2A",
      actorName: call.pokemon || "",
      targetName: call.target || call.pokemon || "",
      selectedAnimationKey: call.move || call.effect || semanticKind,
      timelineSteps: [{type: timelineStepTypeForCall(call), durationMs: BASE_HP_TWEEN_MS, actor: {seat: actorSeat || "p1A"}}],
      animationTimeline: {steps: [{type: timelineStepTypeForCall(call), durationMs: BASE_HP_TWEEN_MS, actor: {seat: actorSeat || "p1A"}}]},
    },
    blocksCommands: true,
  };
}

function playbackKindForGroup(group) {
  if (group.calls.some(call => call.kind === "switch")) return "switchIn";
  if (group.calls.some(call => call.kind === "dragIn")) return "dragIn";
  if (group.calls.some(call => call.kind === "switchOut" || call.kind === "dragOut")) return "switchOut";
  if (group.calls.some(call => call.kind === "move")) return "move";
  if (group.calls.some(call => call.kind === "damage")) return "damage";
  if (group.calls.some(call => call.kind === "heal")) return "heal";
  if (group.calls.some(call => call.kind === "faint")) return "faint";
  if (group.calls.some(call => call.kind === "transform")) return "transform";
  if (group.calls.some(call => call.kind === "result" || call.kind === "otherAnim")) return "result";
  if (group.calls.some(call => call.kind === "turn")) return "turn";
  return "message";
}

function semanticKindForCall(call) {
  if (call.kind === "switch") return "switchIn";
  if (call.kind === "dragIn") return "dragIn";
  if (call.kind === "switchOut" || call.kind === "dragOut") return "switchOut";
  if (call.kind === "move") return "move";
  if (call.kind === "damage") return "damage";
  if (call.kind === "heal") return "heal";
  if (call.kind === "faint") return "faint";
  if (call.kind === "transform") return "transform";
  if (call.kind === "result" || call.kind === "otherAnim") return "result";
  return "";
}

function animationKindForSemanticKind(kind) {
  if (kind === "switchIn" || kind === "dragIn") return "switchIn";
  if (kind === "switchOut") return "switchOut";
  if (kind === "move") return "moveEffect";
  if (kind === "damage") return "damage";
  if (kind === "heal") return "heal";
  if (kind === "faint") return "faint";
  if (kind === "transform") return "transform";
  return "result";
}

function timelineStepTypeForCall(call) {
  if (call.kind === "switch" || call.kind === "dragIn" || call.kind === "switchOut" || call.kind === "dragOut") return "actorAnim";
  if (call.kind === "move") return "showEffect";
  if (call.kind === "damage") return "damageAnim";
  if (call.kind === "heal") return "healAnim";
  if (call.kind === "faint") return "actorAnim";
  if (call.kind === "transform") return "showEffect";
  return "resultAnim";
}

function resultEventArg(call) {
  if (call.result === "Super-effective") return "-supereffective";
  if (call.result === "Resisted") return "-resisted";
  if (call.result === "Critical hit") return "-crit";
  return "";
}

function showdownIdentToProbeSeat(value) {
  const raw = String(value || "");
  if (raw.startsWith("p1a:") || raw.startsWith("p1:")) return "p1A";
  if (raw.startsWith("p1b:")) return "p1B";
  if (raw.startsWith("p2a:") || raw.startsWith("p2:")) return "p2A";
  if (raw.startsWith("p2b:")) return "p2B";
  return "";
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
