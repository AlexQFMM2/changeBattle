import fs from "node:fs";
import path from "node:path";
import {
  generateBattleAiSelfPlayQuestionsV4,
  renderBattleAiSelfPlayExamMarkdownV4,
  runBattleAiSelfPlayQuestionV4,
  type BattleAiSelfPlayExamReportV4,
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
  forceLevel: numberArg(args.forceLevel, 50),
  archetypeAttempts: numberArg(args.archetypeAttempts, 64),
  strictArchetype: booleanArg(args.strictArchetype, false),
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
const questions = generateBattleAiSelfPlayQuestionsV4(input);
const results: BattleAiSelfPlayExamReportV4["results"] = [];
for (const [index, question] of questions.entries()) {
  console.log(`[ai-self-play] question ${index + 1}/${questions.length} ${question.id} started`);
  const result = await runBattleAiSelfPlayQuestionV4(question);
  results.push(result);
  console.log(`[ai-self-play] question ${index + 1}/${questions.length} ${question.id} status=${result.status} winner=${result.winner || "-"} turns=${result.turns} elapsedMs=${result.elapsedMs} avgDecisionMs=${Math.round(result.metrics.averageDecisionMs * 100) / 100} maxDepth=${result.metrics.maxSearchedDepth}`);
}
const report: BattleAiSelfPlayExamReportV4 = {
  generatedAt: new Date().toISOString(),
  input: input as Required<BattleAiSelfPlayExamInputV4>,
  questions,
  results,
  summary: {
    total: results.length,
    ended: results.filter(result => result.status === "ended").length,
    maxTurns: results.filter(result => result.status === "max-turns").length,
    stalled: results.filter(result => result.status === "stalled").length,
    teamGenerationFailed: results.filter(result => result.status === "team-generation-failed").length,
    p1Wins: results.filter(result => result.winner === "p1").length,
    p2Wins: results.filter(result => result.winner === "p2").length,
    averageTurns: average(results.map(result => result.turns)),
    averageQuestionElapsedMs: average(results.map(result => result.elapsedMs)),
    averageDecisionMs: average(results.map(result => result.metrics.averageDecisionMs).filter(Boolean)),
    timeoutCount: results.reduce((sum, result) => sum + result.metrics.timeoutCount, 0),
    maxSearchedDepth: Math.max(0, ...results.map(result => result.metrics.maxSearchedDepth)),
    slowestQuestion: slowestResult(results),
    teamCoreCompleteByArchetype: summarizeTeamCoreComplete(results),
  },
};
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
  return String(value || "rain,sun,trick-room,balanced")
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean);
}

function numberArg(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanArg(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (["true", "1", "yes", "y"].includes(value.toLowerCase())) return true;
  if (["false", "0", "no", "n"].includes(value.toLowerCase())) return false;
  return fallback;
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

function average(values: number[]): number {
  const filtered = values.filter(value => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function slowestResult(results: BattleAiSelfPlayExamReportV4["results"]): BattleAiSelfPlayExamReportV4["summary"]["slowestQuestion"] {
  const slowest = results.slice().sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  return slowest ? {id: slowest.question.id, elapsedMs: slowest.elapsedMs} : undefined;
}

function summarizeTeamCoreComplete(results: BattleAiSelfPlayExamReportV4["results"]): BattleAiSelfPlayExamReportV4["summary"]["teamCoreCompleteByArchetype"] {
  const summary: BattleAiSelfPlayExamReportV4["summary"]["teamCoreCompleteByArchetype"] = {};
  for (const result of results) {
    for (const side of ["p1", "p2"] as const) {
      const archetype = result.question[side].archetype;
      const bucket = summary[archetype] ||= {total: 0, complete: 0, missing: 0, rate: 0};
      bucket.total += 1;
      if (result.teams[side].diagnostics.archetype?.coreComplete) bucket.complete += 1;
      else bucket.missing += 1;
    }
  }
  for (const bucket of Object.values(summary)) {
    bucket.rate = bucket.total ? bucket.complete / bucket.total : 0;
  }
  return summary;
}
