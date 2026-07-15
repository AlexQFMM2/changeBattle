import fs from "node:fs";
import path from "node:path";
import {
  generateShowdownRandomTeamV4,
  type ShowdownRandomTeamGeneratorDiagnosticsV4,
  type ShowdownRandomTeamPokemonSetV4,
  type ShowdownTeamGenerationPurposeV4,
  type ShowdownTeamGenerationQualityV4,
  type ShowdownTeamArchetypeV4,
} from "./teamGenerator.js";
import type {BattleAiLevelV4, TrainingModeV4, TrainingRuleSetV4} from "./types.js";

type TeamGenerationReportInputV4 = {
  seed: string;
  ruleSet: TrainingRuleSetV4;
  mode: TrainingModeV4;
  teamSize: number;
  samplesPerArchetype: number;
  archetypeAttempts: number;
  aiLevel: BattleAiLevelV4;
  purpose: ShowdownTeamGenerationPurposeV4;
  quality?: ShowdownTeamGenerationQualityV4;
  includeLoose: boolean;
  includeStrict: boolean;
  archetypes: ShowdownTeamArchetypeV4[];
};

type TeamGenerationReportResultV4 = {
  id: string;
  archetype: ShowdownTeamArchetypeV4;
  strictArchetype: boolean;
  sampleIndex: number;
  elapsedMs: number;
  ok: boolean;
  pokemon: string[];
  diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4;
};

type TeamGenerationReportV4 = {
  generatedAt: string;
  input: TeamGenerationReportInputV4;
  results: TeamGenerationReportResultV4[];
  summary: {
    total: number;
    ok: number;
    failed: number;
    looseOk: number;
    strictOk: number;
    strictFallbacks: number;
    averageElapsedMs: number;
    byArchetype: Record<string, {
      total: number;
      ok: number;
      failed: number;
      coreComplete: number;
      coreCompleteRate: number;
      averageBestScore: number;
      averageStructureScore: number;
      averageProtectCount: number;
      averageSpeedControlCount: number;
      averageSpreadAttackerCount: number;
      averageUtilityControlCount: number;
      averageLeadPairScore: number;
      fulfilledRequirements: string[];
      missingRequirements: string[];
    }>;
  };
};

const args = parseArgs(process.argv.slice(2));
const reportMode = asMode(args.mode || "singles");
const input: TeamGenerationReportInputV4 = {
  seed: args.seed || "ai-team-generation",
  ruleSet: asRuleSet(args.ruleSet || "gen9"),
  mode: reportMode,
  teamSize: numberArg(args.teamSize, reportMode === "doubles" || reportMode === "coop" ? 4 : 3),
  samplesPerArchetype: numberArg(args.samples, 3),
  archetypeAttempts: numberArg(args.archetypeAttempts, 64),
  aiLevel: asAiLevel(args.aiLevel || "champion"),
  purpose: asPurpose(args.purpose || "ai-exam"),
  quality: args.quality ? asQuality(args.quality) : undefined,
  includeLoose: booleanArg(args.includeLoose, true),
  includeStrict: booleanArg(args.includeStrict, true),
  archetypes: csv(args.archetypes).map(asArchetype),
};
const outDir = path.resolve(args.outDir || "test");
fs.mkdirSync(outDir, {recursive: true});

console.log(`[ai-teams] starting ${JSON.stringify(input)}`);
const startedAt = Date.now();
const results: TeamGenerationReportResultV4[] = [];
for (const archetype of input.archetypes) {
  const strictValues = [
    ...(input.includeLoose ? [false] : []),
    ...(input.includeStrict ? [true] : []),
  ];
  for (const strictArchetype of strictValues) {
    for (let sampleIndex = 1; sampleIndex <= input.samplesPerArchetype; sampleIndex += 1) {
      const id = `${archetype}-${strictArchetype ? "strict" : "loose"}-${sampleIndex}`;
      const resultStartedAt = Date.now();
      const generated = await generateShowdownRandomTeamV4({
        ruleSet: input.ruleSet,
        mode: input.mode,
        seed: `${input.seed}:${id}`,
        teamSize: input.teamSize,
        teamArchetype: archetype,
        archetypeAttempts: input.archetypeAttempts,
        strictArchetype,
        aiLevel: input.aiLevel,
        purpose: input.purpose,
        quality: strictArchetype ? "strict" : input.quality || "structured",
      });
      const elapsedMs = Date.now() - resultStartedAt;
      const result: TeamGenerationReportResultV4 = {
        id,
        archetype,
        strictArchetype,
        sampleIndex,
        elapsedMs,
        ok: generated.diagnostics.ok,
        pokemon: generated.pokemonSets.map(formatPokemon),
        diagnostics: generated.diagnostics,
      };
      results.push(result);
      const archetypeDiagnostics = generated.diagnostics.archetype;
      console.log(`[ai-teams] ${id} ok=${result.ok} elapsedMs=${elapsedMs} best=${round(archetypeDiagnostics?.bestScore || 0)} structure=${round(archetypeDiagnostics?.structureScore || 0)} fulfilled=${(archetypeDiagnostics?.fulfilledRequirements || []).join(",") || "-"} missing=${(archetypeDiagnostics?.missingRequirements || []).join(",") || "-"}`);
    }
  }
}

const report: TeamGenerationReportV4 = {
  generatedAt: new Date().toISOString(),
  input,
  results,
  summary: summarize(results),
};
const jsonFile = path.join(outDir, "team-generation-report.json");
const mdFile = path.join(outDir, "team-generation-report.md");
fs.writeFileSync(jsonFile, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdFile, renderMarkdown(report));
console.log(`[ai-teams] wrote ${jsonFile}`);
console.log(`[ai-teams] wrote ${mdFile}`);
console.log(`[ai-teams] summary ${JSON.stringify(report.summary)} elapsed=${Date.now() - startedAt}ms`);

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

function asMode(value: string): TrainingModeV4 {
  if (value === "singles" || value === "doubles" || value === "coop") return value;
  throw new Error(`invalid --mode ${value}`);
}

function asAiLevel(value: string): BattleAiLevelV4 {
  if (value === "rookie" || value === "normal" || value === "elite" || value === "gymLeader" || value === "eliteFour" || value === "champion") return value;
  throw new Error(`invalid --aiLevel ${value}`);
}

function asPurpose(value: string): ShowdownTeamGenerationPurposeV4 {
  if (value === "player-starter" || value === "npc-battle" || value === "boss-battle" || value === "ai-exam") return value;
  throw new Error(`invalid --purpose ${value}`);
}

function asQuality(value: string): ShowdownTeamGenerationQualityV4 {
  if (value === "loose" || value === "structured" || value === "strict") return value;
  throw new Error(`invalid --quality ${value}`);
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

function formatPokemon(set: ShowdownRandomTeamPokemonSetV4): string {
  const moves = (set.moves || []).join(" / ");
  return `${set.species} L${set.level || 50}${set.item ? ` @ ${set.item}` : ""} (${set.ability}) [${moves}]`;
}

function summarize(results: TeamGenerationReportResultV4[]): TeamGenerationReportV4["summary"] {
  const byArchetype: TeamGenerationReportV4["summary"]["byArchetype"] = {};
  for (const result of results) {
    const bucket = byArchetype[result.archetype] ||= {
      total: 0,
      ok: 0,
      failed: 0,
      coreComplete: 0,
      coreCompleteRate: 0,
      averageBestScore: 0,
      averageStructureScore: 0,
      averageProtectCount: 0,
      averageSpeedControlCount: 0,
      averageSpreadAttackerCount: 0,
      averageUtilityControlCount: 0,
      averageLeadPairScore: 0,
      fulfilledRequirements: [],
      missingRequirements: [],
    };
    bucket.total += 1;
    if (result.ok) bucket.ok += 1;
    else bucket.failed += 1;
    if (result.diagnostics.archetype?.coreComplete) bucket.coreComplete += 1;
  }
  for (const archetype of Object.keys(byArchetype)) {
    const matching = results.filter(result => result.archetype === archetype);
    const bucket = byArchetype[archetype]!;
    bucket.averageBestScore = average(matching.map(result => result.diagnostics.archetype?.bestScore || 0));
    bucket.averageStructureScore = average(matching.map(result => result.diagnostics.archetype?.structureScore || 0));
    bucket.averageProtectCount = average(matching.map(result => result.diagnostics.archetype?.doubles?.protectCount || 0));
    bucket.averageSpeedControlCount = average(matching.map(result => result.diagnostics.archetype?.doubles?.speedControlCount || 0));
    bucket.averageSpreadAttackerCount = average(matching.map(result => result.diagnostics.archetype?.doubles?.spreadAttackerCount || 0));
    bucket.averageUtilityControlCount = average(matching.map(result => result.diagnostics.archetype?.doubles?.utilityControlCount || 0));
    bucket.averageLeadPairScore = average(matching.map(result => result.diagnostics.archetype?.doubles?.leadPairScore || 0));
    bucket.coreCompleteRate = bucket.total ? bucket.coreComplete / bucket.total : 0;
    bucket.fulfilledRequirements = uniqueFlat(matching.map(result => result.diagnostics.archetype?.fulfilledRequirements || []));
    bucket.missingRequirements = uniqueFlat(matching.map(result => result.diagnostics.archetype?.missingRequirements || []));
  }
  return {
    total: results.length,
    ok: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    looseOk: results.filter(result => result.ok && !result.strictArchetype).length,
    strictOk: results.filter(result => result.ok && result.strictArchetype).length,
    strictFallbacks: results.filter(result => result.strictArchetype && result.diagnostics.messages.some(message => message.includes("strict archetype pool"))).length,
    averageElapsedMs: average(results.map(result => result.elapsedMs)),
    byArchetype,
  };
}

function renderMarkdown(report: TeamGenerationReportV4): string {
  const lines = [
    "# Battle V4 Team Generation Report",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- seed: ${report.input.seed}`,
    `- ruleSet/mode: ${report.input.ruleSet}/${report.input.mode}`,
    `- teamSize: ${report.input.teamSize}`,
    `- aiLevel: ${report.input.aiLevel}`,
    `- purpose: ${report.input.purpose}`,
    `- quality: ${report.input.quality || "(derived)"}`,
    `- samplesPerArchetype: ${report.input.samplesPerArchetype}`,
    `- archetypeAttempts: ${report.input.archetypeAttempts}`,
    `- includeLoose/includeStrict: ${report.input.includeLoose}/${report.input.includeStrict}`,
    `- total/ok/failed: ${report.summary.total}/${report.summary.ok}/${report.summary.failed}`,
    `- looseOk/strictOk/strictFallbacks: ${report.summary.looseOk}/${report.summary.strictOk}/${report.summary.strictFallbacks}`,
    `- averageElapsedMs: ${round(report.summary.averageElapsedMs)}`,
    "",
    "## Archetype Summary",
    "",
    "| archetype | ok/total | core complete | avg best | avg structure | avg doubles | fulfilled | missing |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ];
  for (const [archetype, summary] of Object.entries(report.summary.byArchetype)) {
    const doublesSummary = `P${round(summary.averageProtectCount)}/S${round(summary.averageSpeedControlCount)}/A${round(summary.averageSpreadAttackerCount)}/U${round(summary.averageUtilityControlCount)}/L${round(summary.averageLeadPairScore)}`;
    lines.push(`| ${archetype} | ${summary.ok}/${summary.total} | ${summary.coreComplete}/${summary.total} (${round(summary.coreCompleteRate * 100)}%) | ${round(summary.averageBestScore)} | ${round(summary.averageStructureScore)} | ${doublesSummary} | ${summary.fulfilledRequirements.join(", ") || "-"} | ${summary.missingRequirements.join(", ") || "-"} |`);
  }
  lines.push("", "## Samples", "");
  for (const result of report.results) {
    const archetype = result.diagnostics.archetype;
    lines.push(`### ${result.id}`);
    lines.push("");
    lines.push(`- ok: ${result.ok}`);
    lines.push(`- elapsedMs: ${result.elapsedMs}`);
    lines.push(`- bestScore: ${round(archetype?.bestScore || 0)}`);
    lines.push(`- structureScore: ${round(archetype?.structureScore || 0)}`);
    lines.push(`- coreComplete: ${archetype?.coreComplete ?? false}`);
    lines.push(`- purpose/quality: ${archetype?.purpose || "-"} / ${archetype?.quality || "-"}`);
    lines.push(`- fulfilled: ${(archetype?.fulfilledRequirements || []).join(", ") || "-"}`);
    lines.push(`- missing: ${(archetype?.missingRequirements || []).join(", ") || "-"}`);
    if (archetype?.doubles) {
      lines.push(`- doubles: protect=${archetype.doubles.protectCount}, speed=${archetype.doubles.speedControlCount}, spread=${archetype.doubles.spreadAttackerCount}, utility=${archetype.doubles.utilityControlCount}, fakeOut=${archetype.doubles.fakeOutCount}, redirection=${archetype.doubles.redirectionCount}, lead=${round(archetype.doubles.leadPairScore)}, anti=${archetype.doubles.antiSynergy.join(", ") || "-"}`);
      lines.push(`- recommendedLeadPairs: ${archetype.doubles.recommendedLeadPairs.map(pair => `${pair.species.join("+")}(${round(pair.score)}:${pair.reasons.join("/") || "-"})`).join(" | ") || "-"}`);
    }
    lines.push(`- moveQuality: ${result.diagnostics.moveQuality ? `${result.diagnostics.moveQuality.aiLevel}, slots=${result.diagnostics.moveQuality.minMoveSlots}-${result.diagnostics.moveQuality.maxMoveSlots}, adjusted=${result.diagnostics.moveQuality.adjustedPokemon.join(", ") || "-"}` : "-"}`);
    lines.push(`- messages: ${result.diagnostics.messages.join(" | ") || "-"}`);
    lines.push("");
    for (const pokemon of result.pokemon) {
      lines.push(`- ${pokemon}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function uniqueFlat(values: string[][]): string[] {
  return Array.from(new Set(values.flat())).sort();
}

function average(values: number[]): number {
  const filtered = values.filter(value => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
