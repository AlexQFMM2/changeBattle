#!/usr/bin/env node
import {
  compileTimelineFromDiagnostics,
  findTimelineWarnings,
  parseProbeArgs,
  printTableSummary,
  readDiagnostics,
  summarizeTimeline,
} from "./battle-playback-probe-lib.mjs";

async function main() {
  const args = parseProbeArgs(process.argv.slice(2));
  const {diagnostics, rawLog} = readDiagnostics(args.diagnosticsPath);
  const timeline = await compileTimelineFromDiagnostics(diagnostics, rawLog, {useSavedTimeline: args.useSavedTimeline});
  const groups = summarizeTimeline(timeline);
  const warnings = findTimelineWarnings(timeline, rawLog);

  if (args.json || args.full) {
    console.log(JSON.stringify({
      diagnosticsPath: args.diagnosticsPath,
      rawLogLength: rawLog.length,
      timeline: args.full ? timeline : undefined,
      groups,
      warnings,
    }, null, 2));
    return;
  }

  console.log(`Diagnostics: ${args.diagnosticsPath}`);
  console.log(`rawLogLength=${rawLog.length} timelineGroups=${timeline.groups.length} compiler=${timeline.compilerVersion || "unknown"}`);
  printTableSummary("Backend Showdown Timeline Groups", groups.map(group => {
    const raw = group.rawIndices.length ? group.rawIndices.join(",") : "scene";
    return `${String(group.index).padStart(2, "0")} ${group.id.padEnd(14)} raw=${raw.padEnd(10)} wait=${group.waitMode.padEnd(9)} ${group.signature} :: ${group.summary}`;
  }));
  if (warnings.length) {
    printTableSummary("Warnings", warnings.map(item => `! ${item}`));
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
