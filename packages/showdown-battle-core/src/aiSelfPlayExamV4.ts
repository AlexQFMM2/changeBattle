import {
  advanceBattleAutoChoicesV4,
  createInMemoryBattleService,
  generateShowdownRandomTeamV4,
  type ShowdownRandomTeamGeneratorDiagnosticsV4,
  type ShowdownRandomTeamPokemonSetV4,
  type ShowdownTeamArchetypeV4,
} from "./index.js";
import type {
  BattleAiDecisionDebugV4,
  BattleAiLevelV4,
  BattleAiPreferenceV4,
  BattleServicePokemonSetV4,
  BattleServiceSessionInputV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
  TrainingModeV4,
  TrainingRuleSetV4,
} from "./types.js";

export type BattleAiSelfPlaySideSpecV4 = {
  archetype: ShowdownTeamArchetypeV4;
  aiLevel: BattleAiLevelV4;
  preference: BattleAiPreferenceV4;
};

export type BattleAiSelfPlayQuestionV4 = {
  id: string;
  seed: string;
  ruleSet: TrainingRuleSetV4;
  mode: Extract<TrainingModeV4, "singles">;
  teamSize: number;
  forceLevel: number;
  archetypeAttempts: number;
  strictArchetype: boolean;
  maxTurns: number;
  p1: BattleAiSelfPlaySideSpecV4;
  p2: BattleAiSelfPlaySideSpecV4;
};

export type BattleAiSelfPlayQuestionResultV4 = {
  question: BattleAiSelfPlayQuestionV4;
  status: "ended" | "max-turns" | "stalled" | "team-generation-failed";
  winner: ShowdownPlayerIdV4 | null;
  turns: number;
  elapsedMs: number;
  teams: Record<"p1" | "p2", {
    archetype: ShowdownTeamArchetypeV4;
    pokemon: string[];
    diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4;
  }>;
  metrics: {
    aiDecisionCount: number;
    timeoutCount: number;
    averageDecisionMs: number;
    minimaxDecisionCount: number;
    numericGuardDecisionCount: number;
    switchCount: number;
    protectCount: number;
    setupCount: number;
    hazardCount: number;
    weatherCount: number;
    maxSearchedDepth: number;
  };
  notableChoices: Array<{
    turn?: number;
    playerId: ShowdownPlayerIdV4;
    choice: string;
    level: BattleAiLevelV4;
    score: number;
    strategy?: string;
    searchedDepth?: number;
    valueBreakdown?: Record<string, number>;
  }>;
  finalSnapshotSummary: {
    status: BattleServiceSnapshotV4["status"];
    rawLogTail: string[];
    inputLogTail: string[];
  };
};

export type BattleAiSelfPlayExamInputV4 = {
  seed?: string;
  ruleSet?: TrainingRuleSetV4;
  teamSize?: number;
  forceLevel?: number;
  archetypeAttempts?: number;
  strictArchetype?: boolean;
  maxTurns?: number;
  archetypes?: ShowdownTeamArchetypeV4[];
  gamesPerPair?: number;
  p1Level?: BattleAiLevelV4;
  p2Level?: BattleAiLevelV4;
  p1Preference?: BattleAiPreferenceV4;
  p2Preference?: BattleAiPreferenceV4;
};

export type BattleAiSelfPlayExamReportV4 = {
  generatedAt: string;
  input: Required<BattleAiSelfPlayExamInputV4>;
  questions: BattleAiSelfPlayQuestionV4[];
  results: BattleAiSelfPlayQuestionResultV4[];
  summary: {
    total: number;
    ended: number;
    maxTurns: number;
    stalled: number;
    teamGenerationFailed: number;
    p1Wins: number;
    p2Wins: number;
    averageTurns: number;
    averageQuestionElapsedMs: number;
    averageDecisionMs: number;
    timeoutCount: number;
    maxSearchedDepth: number;
    slowestQuestion?: {id: string; elapsedMs: number};
  };
};

const DEFAULT_ARCHETYPES: ShowdownTeamArchetypeV4[] = ["rain", "sand", "trick-room", "hazard-stack", "setup-offense", "balanced"];
const DEFAULT_INPUT: Required<BattleAiSelfPlayExamInputV4> = {
  seed: "ai-self-play",
  ruleSet: "gen9",
  teamSize: 3,
  forceLevel: 50,
  archetypeAttempts: 64,
  strictArchetype: false,
  maxTurns: 40,
  archetypes: DEFAULT_ARCHETYPES,
  gamesPerPair: 1,
  p1Level: "champion",
  p2Level: "gymLeader",
  p1Preference: "balanced",
  p2Preference: "balanced",
};

export function generateBattleAiSelfPlayQuestionsV4(input: BattleAiSelfPlayExamInputV4 = {}): BattleAiSelfPlayQuestionV4[] {
  const normalized = normalizeExamInput(input);
  const questions: BattleAiSelfPlayQuestionV4[] = [];
  for (let index = 0; index < normalized.archetypes.length; index += 1) {
    const p1Archetype = normalized.archetypes[index]!;
    const p2Archetype = normalized.archetypes[(index + 1) % normalized.archetypes.length]!;
    for (let game = 0; game < normalized.gamesPerPair; game += 1) {
      questions.push({
        id: `q${String(questions.length + 1).padStart(3, "0")}-${p1Archetype}-vs-${p2Archetype}`,
        seed: `${normalized.seed}:${p1Archetype}:vs:${p2Archetype}:${game + 1}`,
        ruleSet: normalized.ruleSet,
        mode: "singles",
        teamSize: normalized.teamSize,
        forceLevel: normalized.forceLevel,
        archetypeAttempts: normalized.archetypeAttempts,
        strictArchetype: normalized.strictArchetype,
        maxTurns: normalized.maxTurns,
        p1: {archetype: p1Archetype, aiLevel: normalized.p1Level, preference: normalized.p1Preference},
        p2: {archetype: p2Archetype, aiLevel: normalized.p2Level, preference: normalized.p2Preference},
      });
    }
  }
  return questions;
}

export async function runBattleAiSelfPlayExamV4(input: BattleAiSelfPlayExamInputV4 = {}): Promise<BattleAiSelfPlayExamReportV4> {
  const normalized = normalizeExamInput(input);
  const questions = generateBattleAiSelfPlayQuestionsV4(normalized);
  const results: BattleAiSelfPlayQuestionResultV4[] = [];
  for (const question of questions) {
    results.push(await runBattleAiSelfPlayQuestionV4(question));
  }
  return {
    generatedAt: new Date().toISOString(),
    input: normalized,
    questions,
    results,
    summary: summarizeResults(results),
  };
}

export async function runBattleAiSelfPlayQuestionV4(question: BattleAiSelfPlayQuestionV4): Promise<BattleAiSelfPlayQuestionResultV4> {
  const startedAt = Date.now();
  const [p1Team, p2Team] = await Promise.all([
    generateShowdownRandomTeamV4({
      ruleSet: question.ruleSet,
      mode: question.mode,
      seed: `${question.seed}:p1`,
      teamSize: question.teamSize,
      playerId: "p1",
      teamArchetype: question.p1.archetype,
      archetypeAttempts: question.archetypeAttempts,
      strictArchetype: question.strictArchetype,
    }),
    generateShowdownRandomTeamV4({
      ruleSet: question.ruleSet,
      mode: question.mode,
      seed: `${question.seed}:p2`,
      teamSize: question.teamSize,
      playerId: "p2",
      teamArchetype: question.p2.archetype,
      archetypeAttempts: question.archetypeAttempts,
      strictArchetype: question.strictArchetype,
    }),
  ]);
  const emptySummary = {
    status: "team-generation-failed" as const,
    winner: null,
    turns: 0,
    elapsedMs: Date.now() - startedAt,
    teams: {
      p1: teamSummary(question.p1.archetype, p1Team.pokemonSets, p1Team.diagnostics, question.forceLevel),
      p2: teamSummary(question.p2.archetype, p2Team.pokemonSets, p2Team.diagnostics, question.forceLevel),
    },
    metrics: emptyMetrics(),
    notableChoices: [],
    finalSnapshotSummary: {status: "blocked" as const, rawLogTail: [], inputLogTail: []},
  };
  if (!p1Team.diagnostics.ok || !p2Team.diagnostics.ok) {
    return {question, ...emptySummary};
  }

  const service = createInMemoryBattleService();
  let snapshot = await service.createBattleSession(buildSessionInput(question, p1Team.pokemonSets, p2Team.pokemonSets));
  let stableCount = 0;
  let lastProgressKey = progressKey(snapshot);
  while (snapshot.status === "running" && snapshot.turn < question.maxTurns) {
    snapshot = await advanceBattleAutoChoicesV4(snapshot.id);
    const nextProgressKey = progressKey(snapshot);
    if (nextProgressKey === lastProgressKey) stableCount += 1;
    else stableCount = 0;
    lastProgressKey = nextProgressKey;
    if (stableCount >= 3) break;
  }
  await service.closeSession(snapshot.id);
  const status = snapshot.status === "ended" ? "ended" : stableCount >= 3 ? "stalled" : "max-turns";
  return {
    question,
    status,
    winner: snapshot.winner,
    turns: snapshot.turn,
    elapsedMs: Date.now() - startedAt,
    teams: {
      p1: teamSummary(question.p1.archetype, p1Team.pokemonSets, p1Team.diagnostics, question.forceLevel),
      p2: teamSummary(question.p2.archetype, p2Team.pokemonSets, p2Team.diagnostics, question.forceLevel),
    },
    metrics: metricsFromSnapshot(snapshot),
    notableChoices: notableChoicesFromSnapshot(snapshot),
    finalSnapshotSummary: {
      status: snapshot.status,
      rawLogTail: (snapshot.rawLog || []).slice(-40),
      inputLogTail: (snapshot.debug.inputLog || []).slice(-30),
    },
  };
}

export function renderBattleAiSelfPlayExamMarkdownV4(report: BattleAiSelfPlayExamReportV4): string {
  const lines = [
    "# Battle V4 AI Self-Play Exam Report",
    "",
    `- generatedAt: ${report.generatedAt}`,
    `- seed: ${report.input.seed}`,
    `- ruleSet: ${report.input.ruleSet}`,
    `- teamSize: ${report.input.teamSize}`,
    `- forceLevel: ${report.input.forceLevel}`,
    `- archetypeAttempts: ${report.input.archetypeAttempts}`,
    `- strictArchetype: ${report.input.strictArchetype}`,
    `- games: ${report.summary.total}`,
    `- ended/maxTurns/stalled/failed: ${report.summary.ended}/${report.summary.maxTurns}/${report.summary.stalled}/${report.summary.teamGenerationFailed}`,
    `- wins p1/p2: ${report.summary.p1Wins}/${report.summary.p2Wins}`,
    `- averageTurns: ${round(report.summary.averageTurns)}`,
    `- averageQuestionElapsedMs: ${round(report.summary.averageQuestionElapsedMs)}`,
    `- averageDecisionMs: ${round(report.summary.averageDecisionMs)}`,
    `- timeoutCount: ${report.summary.timeoutCount}`,
    `- maxSearchedDepth: ${report.summary.maxSearchedDepth}`,
    `- slowestQuestion: ${report.summary.slowestQuestion ? `${report.summary.slowestQuestion.id} (${round(report.summary.slowestQuestion.elapsedMs)}ms)` : "-"}`,
    "",
    "## Questions",
    "",
    "| id | matchup | levels | status | winner | turns | elapsed ms | avg decision ms | max depth | notes |",
    "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const result of report.results) {
    lines.push(`| ${result.question.id} | ${result.question.p1.archetype} vs ${result.question.p2.archetype} | ${result.question.p1.aiLevel}/${result.question.p2.aiLevel} | ${result.status} | ${result.winner || "-"} | ${result.turns} | ${round(result.elapsedMs)} | ${round(result.metrics.averageDecisionMs)} | ${result.metrics.maxSearchedDepth} | ${reportNotes(result)} |`);
  }
  lines.push("", "## Per-Question Details", "");
  for (const result of report.results) {
    lines.push(`### ${result.question.id}: ${result.question.p1.archetype} vs ${result.question.p2.archetype}`);
    lines.push("");
    lines.push(`- status: ${result.status}`);
    lines.push(`- winner: ${result.winner || "-"}`);
    lines.push(`- turns: ${result.turns}`);
    lines.push(`- elapsedMs: ${round(result.elapsedMs)}`);
    lines.push(`- p1 team: ${result.teams.p1.pokemon.join(", ")}`);
    lines.push(`- p2 team: ${result.teams.p2.pokemon.join(", ")}`);
    lines.push(`- metrics: decisions=${result.metrics.aiDecisionCount}, timeouts=${result.metrics.timeoutCount}, switches=${result.metrics.switchCount}, protect=${result.metrics.protectCount}, setup=${result.metrics.setupCount}, hazard=${result.metrics.hazardCount}, weather=${result.metrics.weatherCount}`);
    lines.push("");
    lines.push("| player | choice | level | strategy | depth | score | value highlights |");
    lines.push("| --- | --- | --- | --- | ---: | ---: | --- |");
    for (const choice of result.notableChoices.slice(0, 8)) {
      lines.push(`| ${choice.playerId} | ${choice.choice} | ${choice.level} | ${choice.strategy || "-"} | ${choice.searchedDepth || 0} | ${round(choice.score)} | ${valueHighlights(choice.valueBreakdown)} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function normalizeExamInput(input: BattleAiSelfPlayExamInputV4): Required<BattleAiSelfPlayExamInputV4> {
  return {
    ...DEFAULT_INPUT,
    ...input,
    archetypes: input.archetypes?.length ? input.archetypes : DEFAULT_INPUT.archetypes,
    gamesPerPair: Math.max(1, Math.min(20, Math.floor(input.gamesPerPair || DEFAULT_INPUT.gamesPerPair))),
    teamSize: Math.max(1, Math.min(6, Math.floor(input.teamSize || DEFAULT_INPUT.teamSize))),
    forceLevel: Math.max(1, Math.min(100, Math.floor(input.forceLevel || DEFAULT_INPUT.forceLevel))),
    archetypeAttempts: Math.max(1, Math.min(64, Math.floor(input.archetypeAttempts || DEFAULT_INPUT.archetypeAttempts))),
    strictArchetype: input.strictArchetype ?? DEFAULT_INPUT.strictArchetype,
    maxTurns: Math.max(1, Math.min(200, Math.floor(input.maxTurns || DEFAULT_INPUT.maxTurns))),
  };
}

function buildSessionInput(
  question: BattleAiSelfPlayQuestionV4,
  p1Team: ShowdownRandomTeamPokemonSetV4[],
  p2Team: ShowdownRandomTeamPokemonSetV4[],
): BattleServiceSessionInputV4 {
  return {
    runId: `ai-self-play-${question.id}`,
    nodeId: question.id,
    mode: question.mode,
    ruleSet: question.ruleSet,
    seed: question.seed,
    players: [
      {
        playerId: "p1",
        name: `P1 ${question.p1.archetype}`,
        controller: "ai",
        alliance: "near",
        aiProfile: {level: question.p1.aiLevel, preference: question.p1.preference},
        team: p1Team.map(set => toBattlePokemonSet(set, question.forceLevel)),
        draft: null as never,
      },
      {
        playerId: "p2",
        name: `P2 ${question.p2.archetype}`,
        controller: "ai",
        alliance: "far",
        aiProfile: {level: question.p2.aiLevel, preference: question.p2.preference},
        team: p2Team.map(set => toBattlePokemonSet(set, question.forceLevel)),
        draft: null as never,
      },
    ],
  };
}

function toBattlePokemonSet(set: ShowdownRandomTeamPokemonSetV4, forceLevel: number): BattleServicePokemonSetV4 {
  return {
    species: set.species,
    name: set.name || set.species,
    item: set.item || "",
    ability: set.ability,
    moves: set.moves,
    nature: set.nature || "Serious",
    evs: normalizeStats(set.evs, 85),
    ivs: normalizeStats(set.ivs, 31),
    gender: set.gender,
    shiny: set.shiny,
    level: forceLevel || set.level || 50,
    teraType: set.teraType,
  };
}

function normalizeStats(stats: Record<string, number> | undefined, fallback: number): Record<string, number> {
  return {
    hp: Number(stats?.hp ?? fallback),
    atk: Number(stats?.atk ?? fallback),
    def: Number(stats?.def ?? fallback),
    spa: Number(stats?.spa ?? fallback),
    spd: Number(stats?.spd ?? fallback),
    spe: Number(stats?.spe ?? fallback),
  };
}

function progressKey(snapshot: BattleServiceSnapshotV4): string {
  return `${snapshot.status}:${snapshot.turn}:${snapshot.rawLog.length}:${snapshot.debug.inputLog.length}:${snapshot.debug.aiDecisions?.length || 0}`;
}

function teamSummary(
  archetype: ShowdownTeamArchetypeV4,
  pokemonSets: ShowdownRandomTeamPokemonSetV4[],
  diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4,
  forceLevel: number,
): BattleAiSelfPlayQuestionResultV4["teams"]["p1"] {
  return {
    archetype,
    pokemon: pokemonSets.map(set => `${set.species} L${forceLevel}${set.item ? ` @ ${set.item}` : ""} (${set.ability}) [${(set.moves || []).join(" / ")}]`),
    diagnostics,
  };
}

function emptyMetrics(): BattleAiSelfPlayQuestionResultV4["metrics"] {
  return {
    aiDecisionCount: 0,
    timeoutCount: 0,
    averageDecisionMs: 0,
    minimaxDecisionCount: 0,
    numericGuardDecisionCount: 0,
    switchCount: 0,
    protectCount: 0,
    setupCount: 0,
    hazardCount: 0,
    weatherCount: 0,
    maxSearchedDepth: 0,
  };
}

function metricsFromSnapshot(snapshot: BattleServiceSnapshotV4): BattleAiSelfPlayQuestionResultV4["metrics"] {
  const decisions = snapshot.debug.aiDecisions || [];
  const metrics = emptyMetrics();
  metrics.aiDecisionCount = decisions.length;
  metrics.timeoutCount = decisions.filter(decision => decision.timedOut).length;
  metrics.averageDecisionMs = average(decisions.map(decision => decision.elapsedMs));
  metrics.minimaxDecisionCount = decisions.filter(decision => decision.search?.strategy === "minimax").length;
  metrics.numericGuardDecisionCount = decisions.filter(decision => decision.search?.strategy === "numeric-guard").length;
  metrics.switchCount = decisions.filter(decision => decision.selectedChoice.includes("switch")).length;
  metrics.protectCount = decisions.filter(decision => decision.topCandidates.some(candidate => candidate.choice === decision.selectedChoice && candidate.diagnostics?.moveId === "protect")).length;
  metrics.setupCount = countMoveIds(decisions, ["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "quiverdance", "shellsmash"]);
  metrics.hazardCount = countMoveIds(decisions, ["stealthrock", "spikes", "toxicspikes", "stickyweb"]);
  metrics.weatherCount = countMoveIds(decisions, ["raindance", "sunnyday", "sandstorm", "snowscape", "hail"]);
  metrics.maxSearchedDepth = Math.max(0, ...decisions.map(decision => decision.search?.searchedDepth || 0));
  return metrics;
}

function countMoveIds(decisions: BattleAiDecisionDebugV4[], moveIds: string[]): number {
  const moveSet = new Set(moveIds);
  return decisions.filter(decision => decision.topCandidates.some(candidate => candidate.choice === decision.selectedChoice && moveSet.has(String(candidate.diagnostics?.moveId || "")))).length;
}

function notableChoicesFromSnapshot(snapshot: BattleServiceSnapshotV4): BattleAiSelfPlayQuestionResultV4["notableChoices"] {
  return (snapshot.debug.aiDecisions || [])
    .slice(-24)
    .map(decision => ({
      turn: snapshot.turn,
      playerId: decision.playerId,
      choice: decision.selectedChoice,
      level: decision.level,
      score: decision.selectedScore,
      strategy: decision.search?.strategy,
      searchedDepth: decision.search?.searchedDepth,
      valueBreakdown: decision.search?.valueBreakdown,
    }));
}

function summarizeResults(results: BattleAiSelfPlayQuestionResultV4[]): BattleAiSelfPlayExamReportV4["summary"] {
  return {
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
  };
}

function slowestResult(results: BattleAiSelfPlayQuestionResultV4[]): BattleAiSelfPlayExamReportV4["summary"]["slowestQuestion"] {
  const slowest = results.slice().sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  return slowest ? {id: slowest.question.id, elapsedMs: slowest.elapsedMs} : undefined;
}

function reportNotes(result: BattleAiSelfPlayQuestionResultV4): string {
  const notes: string[] = [];
  if (result.metrics.timeoutCount) notes.push(`timeouts:${result.metrics.timeoutCount}`);
  if (result.metrics.switchCount) notes.push(`switch:${result.metrics.switchCount}`);
  if (result.metrics.hazardCount) notes.push(`hazard:${result.metrics.hazardCount}`);
  if (result.metrics.weatherCount) notes.push(`weather:${result.metrics.weatherCount}`);
  return notes.join(", ") || "-";
}

function valueHighlights(breakdown: Record<string, number> | undefined): string {
  if (!breakdown) return "-";
  return Object.entries(breakdown)
    .filter(([, value]) => Math.abs(Number(value)) >= 8)
    .sort((a, b) => Math.abs(Number(b[1])) - Math.abs(Number(a[1])))
    .slice(0, 4)
    .map(([key, value]) => `${key}:${round(Number(value))}`)
    .join(", ") || "-";
}

function average(values: number[]): number {
  const filtered = values.filter(value => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
