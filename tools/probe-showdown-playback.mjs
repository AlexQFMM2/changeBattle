import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const diagnosticsPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : "";
const compilerPath = path.join(repoRoot, "packages", "showdown-battle-core", "dist", "playbackCompiler.js");

if (!diagnosticsPath) {
  console.error("Usage: node tools/probe-showdown-playback.mjs <battle-v4-diagnostics.json>");
  process.exit(1);
}

if (!fs.existsSync(diagnosticsPath)) {
  console.error(`Diagnostics file not found: ${diagnosticsPath}`);
  process.exit(1);
}

if (!fs.existsSync(compilerPath)) {
  console.error("Playback compiler is not built. Run: pnpm --filter @changebattle-v2/showdown-battle-core build");
  process.exit(1);
}

const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, "utf8"));
const rawLog = Array.isArray(diagnostics.rawLog) ? diagnostics.rawLog : [];
const {compileShowdownPlaybackTimelineFromRawLog} = await import(pathToFileURL(compilerPath).href);
const timeline = compileShowdownPlaybackTimelineFromRawLog(rawLog, {sessionId: diagnostics.sessionId || diagnostics.snapshot?.id || "diagnostics"});

console.log(JSON.stringify({
  diagnosticsPath,
  rawLogLength: rawLog.length,
  timeline,
  currentPlaybackStepConsumption: diagnostics.playbackStepConsumption || diagnostics.playback?.playbackStepConsumption || [],
}, null, 2));
