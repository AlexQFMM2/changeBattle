import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

export const toolsDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(toolsDir, "..");

export function parseProbeArgs(argv) {
  const args = {diagnosticsPath: "", json: false, full: false, useSavedTimeline: false};
  for (const arg of argv) {
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--full") {
      args.full = true;
    } else if (arg === "--saved") {
      args.useSavedTimeline = true;
    } else if (!args.diagnosticsPath) {
      args.diagnosticsPath = path.resolve(process.cwd(), arg);
    }
  }
  return args;
}

export function readDiagnostics(diagnosticsPath) {
  if (!diagnosticsPath) throw new Error("Usage: node tools/<probe>.mjs <battle-v4-diagnostics.json> [--json] [--full] [--saved]");
  if (!fs.existsSync(diagnosticsPath)) throw new Error(`Diagnostics file not found: ${diagnosticsPath}`);
  const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, "utf8"));
  const rawLog = Array.isArray(diagnostics.rawLog) ? diagnostics.rawLog : [];
  return {diagnostics, rawLog};
}

export async function compileTimelineFromDiagnostics(diagnostics, rawLog, options = {}) {
  if (options.useSavedTimeline && diagnostics.showdownPlaybackTimeline?.groups?.length) return diagnostics.showdownPlaybackTimeline;
  const compilerPath = firstExistingPath([
    path.join(repoRoot, "packages", "showdown-battle-core", "dist", "playbackCompiler.js"),
    path.join(repoRoot, "packages", "showdown-battle-core", "dist-test", "playbackCompiler.js"),
  ]);
  if (!compilerPath) {
    throw new Error("Playback compiler is not built. Run: pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-battle-core build");
  }
  const {compileShowdownPlaybackTimelineFromRawLog} = await import(pathToFileURL(compilerPath).href);
  return compileShowdownPlaybackTimelineFromRawLog(rawLog, {
    sessionId: diagnostics.sessionId || diagnostics.snapshot?.id || "diagnostics",
    previousIndex: 0,
  });
}

export async function loadFrontendSchedulerPlan() {
  const schedulerPath = firstExistingPath([
    path.join(repoRoot, "apps", "web", "dist-test", "apps", "web", "src", "components", "battle-v4", "useBattleV4ShowdownScheduler.js"),
    path.join(repoRoot, "apps", "web", "dist-test", "components", "battle-v4", "useBattleV4ShowdownScheduler.js"),
  ]);
  if (!schedulerPath) {
    throw new Error("Frontend scheduler test build is missing. Run: pnpm --dir changeBattleV2 --filter @changebattle-v2/web test:scheduler");
  }
  const module = await import(pathToFileURL(schedulerPath).href);
  return module.createBattleV4ShowdownSchedulerPlan;
}

export function firstExistingPath(paths) {
  return paths.find(item => fs.existsSync(item)) || "";
}

export function groupSignature(group) {
  return group.calls.map(callSignature).join("+") || "(empty)";
}

export function schedulerSignatureForGroup(group) {
  return group.calls.map(call => call.kind === "otherAnim" ? `${call.kind}:${call.effect || ""}` : call.kind).join("+") || "(empty)";
}

export function callSignature(call) {
  if (call.kind === "otherAnim") return `${call.kind}:${call.effect || ""}`;
  if (call.kind === "result") return `${call.kind}:${call.result || call.label || ""}`;
  if (call.kind === "move") return `${call.kind}:${call.move || call.effect || call.label || ""}`;
  if (call.kind === "damage" || call.kind === "heal") return `${call.kind}:${call.pokemon || ""}`;
  if (call.kind === "switch" || call.kind === "dragIn" || call.kind === "dragOut" || call.kind === "switchOut" || call.kind === "transform") {
    return `${call.kind}:${call.pokemon || call.target || call.label || ""}`;
  }
  return call.kind;
}

export function summarizeTimeline(timeline) {
  return timeline.groups.map(group => {
    const rawIndices = group.rawIndices.filter(index => Number.isFinite(index) && index >= 0);
    return {
      index: group.index,
      id: group.id,
      waitMode: group.waitMode,
      rawIndices: group.rawIndices,
      rawSpan: rawIndices.length ? `${Math.min(...rawIndices)}-${Math.max(...rawIndices)}` : "scene-only",
      signature: groupSignature(group),
      schedulerSignature: schedulerSignatureForGroup(group),
      summary: group.summary,
      calls: group.calls.map(call => ({
        kind: call.kind,
        method: call.method,
        rawIndex: call.rawIndex,
        pokemon: call.pokemon,
        target: call.target,
        move: call.move,
        effect: call.effect,
        result: call.result,
        label: call.label,
        rawLine: call.rawLine,
      })),
    };
  });
}

export function findTimelineWarnings(timeline, rawLog = []) {
  const warnings = [];
  let highestRaw = -1;
  let firstSceneOnlyVisualGroup = null;
  for (const group of timeline.groups) {
    const rawIndices = group.rawIndices.filter(index => Number.isFinite(index) && index >= 0);
    if (!rawIndices.length) {
      if (group.calls.some(call => call.kind !== "statbar")) {
        warnings.push(`${group.id}: non-statbar scene group has no raw index (${groupSignature(group)})`);
        if (!firstSceneOnlyVisualGroup) firstSceneOnlyVisualGroup = group;
      }
      continue;
    }
    const groupMin = Math.min(...rawIndices);
    const groupMax = Math.max(...rawIndices);
    if (groupMin < highestRaw) {
      warnings.push(`${group.id}: raw index moved backwards (${groupMin} after ${highestRaw})`);
    }
    highestRaw = Math.max(highestRaw, groupMax);
  }
  if (firstSceneOnlyVisualGroup && highestRaw >= 0) {
    warnings.push(`scene-only visual groups exist after raw-indexed groups; verify compiler raw call mapping before debugging React scene (${firstSceneOnlyVisualGroup.id} is first)`);
  }
  const rawFaintIndices = rawLog
    .map((line, index) => ({line, index}))
    .filter(entry => String(entry.line).startsWith("|faint|"));
  for (const entry of rawFaintIndices) {
    const matched = timeline.groups.some(group => group.rawIndices.includes(entry.index) || group.calls.some(call => call.rawIndex === entry.index));
    if (!matched) warnings.push(`raw faint at ${entry.index} is not represented by any timeline group: ${entry.line}`);
  }
  return warnings;
}

export function diagnosticsConsumption(diagnostics) {
  const consumption = diagnostics.playbackStepConsumption || diagnostics.playback?.playbackStepConsumption || [];
  return Array.isArray(consumption) ? consumption : [];
}

export function summarizeConsumption(consumption) {
  return consumption.map((step, index) => ({
    index,
    stepId: step.stepId,
    sequence: step.sequence,
    kind: step.kind,
    showdownGroupId: step.showdownGroupId,
    signature: Array.isArray(step.sceneCalls) ? step.sceneCalls.map(callSignature).join("+") || "(empty)" : "",
    message: step.message,
    reason: step.reason,
    rawLine: step.rawLine,
  }));
}

export function printTableSummary(title, rows) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
  for (const row of rows) {
    console.log(row);
  }
}
