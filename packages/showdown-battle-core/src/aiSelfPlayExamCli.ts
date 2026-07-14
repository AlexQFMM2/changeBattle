import fs from "node:fs";
import path from "node:path";
import {
  renderBattleAiSelfPlayExamMarkdownV4,
  runBattleAiSelfPlayExamV4,
  type BattleAiSelfPlayExamInputV4,
} from "./aiSelfPlayExamV4.js";
import type {BattleAiLevelV4, BattleAiPreferenceV4, TrainingRuleSetV4} from "./types.js";
import type {ShowdownTeamArchetypeV4} from "./teamGenerator.js";

const args = parseArgs(process.argv.slice(2));
const startedAt = Date.now();
const input: BattleAiSelfPlayExamInputV4 = {
  seed: args.seed || "ai-self-play",
  ruleSet: asRuleSet(args.ruleSet || "gen9"),
  teamSize: numberArg(args.teamSize, 3),
  maxTurns: numberArg(args.maxTurns, 40),
  gamesPerPair: numberArg(args.games, 1),
  archetypes: csv(args.archetypes).map(asArchetype),
  p1Level: asAiLevel(args.p1Level || "champion"),
  p2Level: asAiLevel(args.p2Level || "gymLeader"),
  p1Preference: asPreference(args.p1Preference || "balanced"),
  p2Preference: asPreference(args.p2Preference || "balanced"),
};
const outDir = path.resolve(args.outDir || `debug/ai-self-play/${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(outDir, {recursive: true});

console.log(`[ai-self-play] starting ${JSON.stringify(input)}`);
const report = await runBattleAiSelfPlayExamV4(input);
const jsonFile = path.join(outDir, "report.json");
const mdFile = path.join(outDir, "report.md");
fs.writeFileSync(jsonFile, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdFile, renderBattleAiSelfPlayExamMarkdownV4(report));
console.log(`[ai-self-play] wrote ${jsonFile}`);
console.log(`[ai-self-play] wrote ${mdFile}`);
console.log(`[ai-self-play] summary ${JSON.stringify(report.summary)} elapsed=${Date.now() - startedAt}ms`);

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = "true";
    }
  }
  return parsed;
}

function csv(value: string | undefined): string[] {
  return String(value || "rain,sand,trick-room,hazard-stack,setup-offense,balanced")
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean);
}

function numberArg(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asRuleSet(value: string): TrainingRuleSetV4 {
  if (value === "standard" || value === "gen7" || value === "gen8" || value === "gen9") return value;
  throw new Error(`invalid --ruleSet ${value}`);
}

function asAiLevel(value: string): BattleAiLevelV4 {
  if (value === "rookie" || value === "normal" || value === "elite" || value === "gymLeader" || value === "eliteFour" || value === "champion") return value;
  throw new Error(`invalid ai level ${value}`);
}

function asPreference(value: string): BattleAiPreferenceV4 {
  if (value === "offense" || value === "defense" || value === "support" || value === "balanced") return value;
  throw new Error(`invalid preference ${value}`);
}

function asArchetype(value: string): ShowdownTeamArchetypeV4 {
  const valid = new Set([
    "balanced",
    "rain",
    "sun",
    "sand",
    "snow",
    "trick-room",
    "tailwind",
    "terrain",
    "hazard-stack",
    "poison-stall",
    "baton-pass",
    "setup-offense",
  ]);
  if (valid.has(value)) return value as ShowdownTeamArchetypeV4;
  throw new Error(`invalid archetype ${value}`);
}
