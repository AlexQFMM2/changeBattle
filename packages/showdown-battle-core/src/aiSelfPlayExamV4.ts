import {
  advanceBattleAutoChoicesV4,
  createInMemoryBattleService,
  generateShowdownRandomTeamV4,
  type ShowdownRandomTeamGeneratorDiagnosticsV4,
  type ShowdownRandomTeamPokemonSetV4,
  type ShowdownTeamGenerationPurposeV4,
  type ShowdownTeamGenerationQualityV4,
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
  mode: Extract<TrainingModeV4, "singles" | "doubles">;
  teamSize: number;
  forceLevel: number;
  archetypeAttempts: number;
  strictArchetype: boolean;
  purpose: ShowdownTeamGenerationPurposeV4;
  quality: ShowdownTeamGenerationQualityV4;
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
    doubleTargetCount: number;
    spreadMoveCount: number;
    friendlyFireRiskCount: number;
    allyComboCount: number;
    tailwindCount: number;
    trickRoomCount: number;
    fakeOutCount: number;
    teraCommitCount: number;
    dynamaxCommitCount: number;
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
    reasonTags?: string[];
  }>;
  blunderDiagnostics: BattleAiBlunderDiagnosticsV4;
  finalSnapshotSummary: {
    status: BattleServiceSnapshotV4["status"];
    rawLogTail: string[];
    inputLogTail: string[];
  };
};

export type BattleAiBlunderFindingV4 = {
  severity: "info" | "warning" | "severe";
  kind:
    | "timeout"
    | "stalled"
    | "max-turns"
    | "value-explosion"
    | "negative-choice-score"
    | "ineffective-move"
    | "repeat-ineffective-move"
    | "high-switch-rate"
    | "doubles-core-incomplete"
    | "friendly-fire-risk"
    | "low-value-fake-out";
  playerId?: ShowdownPlayerIdV4;
  turn?: number;
  choice?: string;
  detail: string;
};

export type BattleAiBlunderDiagnosticsV4 = {
  summary: {
    severe: number;
    warning: number;
    info: number;
    score: number;
  };
  findings: BattleAiBlunderFindingV4[];
};

export type BattleAiSelfPlayExamInputV4 = {
  seed?: string;
  ruleSet?: TrainingRuleSetV4;
  mode?: Extract<TrainingModeV4, "singles" | "doubles">;
  teamSize?: number;
  forceLevel?: number;
  archetypeAttempts?: number;
  strictArchetype?: boolean;
  purpose?: ShowdownTeamGenerationPurposeV4;
  quality?: ShowdownTeamGenerationQualityV4;
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
    teamCoreCompleteByArchetype: Record<string, {total: number; complete: number; missing: number; rate: number}>;
    blunders: {
      severe: number;
      warning: number;
      info: number;
      questionsWithSevere: number;
      questionsWithWarnings: number;
      topKinds: Array<{kind: BattleAiBlunderFindingV4["kind"]; count: number}>;
    };
  };
};

const DEFAULT_ARCHETYPES: ShowdownTeamArchetypeV4[] = ["rain", "sun", "trick-room", "balanced"];
const DEFAULT_DOUBLES_ARCHETYPES: ShowdownTeamArchetypeV4[] = ["rain", "sun", "trick-room", "tailwind", "balanced"];
const DEFAULT_INPUT: Required<BattleAiSelfPlayExamInputV4> = {
  seed: "ai-self-play",
  ruleSet: "gen9",
  mode: "singles",
  teamSize: 3,
  forceLevel: 50,
  archetypeAttempts: 64,
  strictArchetype: false,
  purpose: "ai-exam",
  quality: "strict",
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
        mode: normalized.mode,
        teamSize: normalized.teamSize,
        forceLevel: normalized.forceLevel,
        archetypeAttempts: normalized.archetypeAttempts,
        strictArchetype: normalized.strictArchetype,
        purpose: normalized.purpose,
        quality: normalized.quality,
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
    summary: summarizeBattleAiSelfPlayResultsV4(results),
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
      aiLevel: question.p1.aiLevel,
      purpose: question.purpose,
      quality: question.quality,
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
      aiLevel: question.p2.aiLevel,
      purpose: question.purpose,
      quality: question.quality,
    }),
  ]);
  const generatedTeams = {
    p1: teamSummary(question.p1.archetype, p1Team.pokemonSets, p1Team.diagnostics, question.forceLevel),
    p2: teamSummary(question.p2.archetype, p2Team.pokemonSets, p2Team.diagnostics, question.forceLevel),
  };
  const emptySummary = {
    status: "team-generation-failed" as const,
    winner: null,
    turns: 0,
    elapsedMs: Date.now() - startedAt,
    teams: generatedTeams,
    metrics: emptyMetrics(),
    notableChoices: [],
    blunderDiagnostics: analyzeTeamGenerationBlunders(question, generatedTeams),
    finalSnapshotSummary: {status: "blocked" as const, rawLogTail: [], inputLogTail: []},
  };
  if (!p1Team.diagnostics.ok || !p2Team.diagnostics.ok || strictDoublesCoreIncomplete(question, p1Team.diagnostics) || strictDoublesCoreIncomplete(question, p2Team.diagnostics)) {
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
  const metrics = metricsFromSnapshot(snapshot);
  return {
    question,
    status,
    winner: snapshot.winner,
    turns: snapshot.turn,
    elapsedMs: Date.now() - startedAt,
    teams: generatedTeams,
    metrics,
    notableChoices: notableChoicesFromSnapshot(snapshot),
    blunderDiagnostics: analyzeBlundersFromSnapshot(snapshot, status, metrics, question, generatedTeams),
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
    `- mode: ${report.input.mode}`,
    `- teamSize: ${report.input.teamSize}`,
    `- forceLevel: ${report.input.forceLevel}`,
    `- archetypeAttempts: ${report.input.archetypeAttempts}`,
    `- strictArchetype: ${report.input.strictArchetype}`,
    `- purpose: ${report.input.purpose}`,
    `- quality: ${report.input.quality}`,
    `- games: ${report.summary.total}`,
    `- ended/maxTurns/stalled/failed: ${report.summary.ended}/${report.summary.maxTurns}/${report.summary.stalled}/${report.summary.teamGenerationFailed}`,
    `- wins p1/p2: ${report.summary.p1Wins}/${report.summary.p2Wins}`,
    `- averageTurns: ${round(report.summary.averageTurns)}`,
    `- averageQuestionElapsedMs: ${round(report.summary.averageQuestionElapsedMs)}`,
    `- averageDecisionMs: ${round(report.summary.averageDecisionMs)}`,
    `- timeoutCount: ${report.summary.timeoutCount}`,
    `- maxSearchedDepth: ${report.summary.maxSearchedDepth}`,
    `- slowestQuestion: ${report.summary.slowestQuestion ? `${report.summary.slowestQuestion.id} (${round(report.summary.slowestQuestion.elapsedMs)}ms)` : "-"}`,
    `- teamCoreCompleteByArchetype: ${coreCompleteSummary(report.summary.teamCoreCompleteByArchetype)}`,
    `- blunders: severe=${report.summary.blunders.severe}, warning=${report.summary.blunders.warning}, info=${report.summary.blunders.info}, questionsWithSevere=${report.summary.blunders.questionsWithSevere}, questionsWithWarnings=${report.summary.blunders.questionsWithWarnings}`,
    `- blunderTopKinds: ${report.summary.blunders.topKinds.map(entry => `${entry.kind}:${entry.count}`).join(", ") || "-"}`,
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
    lines.push(`- p1 doubles: ${doublesDiagnosticsSummary(result.teams.p1.diagnostics)}`);
    lines.push(`- p2 doubles: ${doublesDiagnosticsSummary(result.teams.p2.diagnostics)}`);
    lines.push(`- metrics: decisions=${result.metrics.aiDecisionCount}, timeouts=${result.metrics.timeoutCount}, switches=${result.metrics.switchCount}, protect=${result.metrics.protectCount}, setup=${result.metrics.setupCount}, hazard=${result.metrics.hazardCount}, weather=${result.metrics.weatherCount}`);
    lines.push(`- doubles metrics: doubleTarget=${result.metrics.doubleTargetCount}, spread=${result.metrics.spreadMoveCount}, friendlyFireRisk=${result.metrics.friendlyFireRiskCount}, allyCombo=${result.metrics.allyComboCount}, fakeOut=${result.metrics.fakeOutCount}, tailwind=${result.metrics.tailwindCount}, trickRoom=${result.metrics.trickRoomCount}, tera=${result.metrics.teraCommitCount}, dynamax=${result.metrics.dynamaxCommitCount}`);
    lines.push(`- blunders: severe=${result.blunderDiagnostics.summary.severe}, warning=${result.blunderDiagnostics.summary.warning}, info=${result.blunderDiagnostics.summary.info}, score=${result.blunderDiagnostics.summary.score}`);
    const findings = result.blunderDiagnostics.findings.slice(0, 5);
    if (findings.length) {
      lines.push(`- blunderFindings: ${findings.map(formatBlunderFinding).join("; ")}`);
    }
    lines.push("");
    lines.push("| player | choice | level | strategy | depth | score | value highlights | reason tags |");
    lines.push("| --- | --- | --- | --- | ---: | ---: | --- | --- |");
    for (const choice of result.notableChoices.slice(0, 8)) {
      lines.push(`| ${choice.playerId} | ${choice.choice} | ${choice.level} | ${choice.strategy || "-"} | ${choice.searchedDepth || 0} | ${round(choice.score)} | ${valueHighlights(choice.valueBreakdown)} | ${(choice.reasonTags || []).join(", ") || "-"} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function normalizeExamInput(input: BattleAiSelfPlayExamInputV4): Required<BattleAiSelfPlayExamInputV4> {
  const mode = input.mode || DEFAULT_INPUT.mode;
  const modeDefaults = mode === "doubles"
    ? {teamSize: 4, maxTurns: 20, archetypes: DEFAULT_DOUBLES_ARCHETYPES}
    : {teamSize: DEFAULT_INPUT.teamSize, maxTurns: DEFAULT_INPUT.maxTurns, archetypes: DEFAULT_ARCHETYPES};
  return {
    ...DEFAULT_INPUT,
    ...input,
    mode,
    archetypes: input.archetypes?.length ? input.archetypes : modeDefaults.archetypes,
    gamesPerPair: Math.max(1, Math.min(20, Math.floor(input.gamesPerPair || DEFAULT_INPUT.gamesPerPair))),
    teamSize: Math.max(1, Math.min(6, Math.floor(input.teamSize || modeDefaults.teamSize))),
    forceLevel: Math.max(1, Math.min(100, Math.floor(input.forceLevel || DEFAULT_INPUT.forceLevel))),
    archetypeAttempts: Math.max(1, Math.min(64, Math.floor(input.archetypeAttempts || DEFAULT_INPUT.archetypeAttempts))),
    strictArchetype: input.strictArchetype ?? DEFAULT_INPUT.strictArchetype,
    purpose: input.purpose || DEFAULT_INPUT.purpose,
    quality: input.quality || DEFAULT_INPUT.quality,
    maxTurns: Math.max(1, Math.min(200, Math.floor(input.maxTurns || modeDefaults.maxTurns))),
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

function strictDoublesCoreIncomplete(question: BattleAiSelfPlayQuestionV4, diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4): boolean {
  return question.mode === "doubles" && question.quality === "strict" && diagnostics.ok && diagnostics.archetype?.coreComplete === false;
}

function analyzeTeamGenerationBlunders(
  question: BattleAiSelfPlayQuestionV4,
  teams: BattleAiSelfPlayQuestionResultV4["teams"],
): BattleAiBlunderDiagnosticsV4 {
  return summarizeBlunderFindings(teamCoreFindings(question, teams));
}

function teamCoreFindings(
  question: BattleAiSelfPlayQuestionV4,
  teams: BattleAiSelfPlayQuestionResultV4["teams"],
): BattleAiBlunderFindingV4[] {
  if (question.mode !== "doubles" || question.quality !== "strict") return [];
  const findings: BattleAiBlunderFindingV4[] = [];
  for (const side of ["p1", "p2"] as const) {
    const archetype = teams[side].diagnostics.archetype;
    if (!archetype || archetype.coreComplete !== false) continue;
    findings.push({
      severity: "warning",
      kind: "doubles-core-incomplete",
      playerId: side,
      detail: `${side} ${question[side].archetype} strict doubles core incomplete; missing=${(archetype.missingRequirements || []).join(", ") || "-"}; anti=${archetype.doubles?.antiSynergy.join(", ") || "-"}`,
    });
  }
  return findings;
}

function doublesDiagnosticsSummary(diagnostics: ShowdownRandomTeamGeneratorDiagnosticsV4): string {
  const doubles = diagnostics.archetype?.doubles;
  if (!doubles) return "-";
  return [
    `protect=${doubles.protectCount}`,
    `speed=${doubles.speedControlCount}`,
    `spread=${doubles.spreadAttackerCount}`,
    `utility=${doubles.utilityControlCount}`,
    `lead=${round(doubles.leadPairScore)}`,
    `anti=${doubles.antiSynergy.join(",") || "-"}`,
    `leads=${doubles.recommendedLeadPairs.slice(0, 2).map(pair => `${pair.species.join("+")}(${round(pair.score)})`).join(";") || "-"}`,
  ].join(", ");
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
    doubleTargetCount: 0,
    spreadMoveCount: 0,
    friendlyFireRiskCount: 0,
    allyComboCount: 0,
    tailwindCount: 0,
    trickRoomCount: 0,
    fakeOutCount: 0,
    teraCommitCount: 0,
    dynamaxCommitCount: 0,
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
  metrics.protectCount = countMoveIds(decisions, ["protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "silktrap", "burningbulwark"]);
  metrics.setupCount = countMoveIds(decisions, ["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "quiverdance", "shellsmash"]);
  metrics.hazardCount = countMoveIds(decisions, ["stealthrock", "spikes", "toxicspikes", "stickyweb"]);
  metrics.weatherCount = countMoveIds(decisions, ["raindance", "sunnyday", "sandstorm", "snowscape", "hail"]);
  metrics.doubleTargetCount = countSelectedReasonTag(decisions, "double-target-foe");
  metrics.spreadMoveCount = decisions.filter(decision => selectedMoveTargets(decision).some(target => target === "alladjacent" || target === "alladjacentfoes") || selectedReasonTags(decision).some(tag => tag === "spread-foes" || tag === "spread-pressure")).length;
  metrics.friendlyFireRiskCount = countSelectedReasonTag(decisions, "avoid-ally-damage") + countSelectedReasonTag(decisions, "spread-friendly-fire-risk");
  metrics.allyComboCount = countSelectedReasonTag(decisions, "ally-combo");
  metrics.tailwindCount = countMoveIds(decisions, ["tailwind"]);
  metrics.trickRoomCount = countMoveIds(decisions, ["trickroom"]);
  metrics.fakeOutCount = countMoveIds(decisions, ["fakeout"]);
  metrics.teraCommitCount = countSelectedReasonTag(decisions, "commit-tera");
  metrics.dynamaxCommitCount = countSelectedReasonTag(decisions, "commit-dynamax");
  metrics.maxSearchedDepth = Math.max(0, ...decisions.map(decision => decision.search?.searchedDepth || 0));
  return metrics;
}

function countMoveIds(decisions: BattleAiDecisionDebugV4[], moveIds: string[]): number {
  const moveSet = new Set(moveIds);
  return decisions.filter(decision => selectedMoveIds(decision).some(moveId => moveSet.has(moveId))).length;
}

function countSelectedReasonTag(decisions: BattleAiDecisionDebugV4[], tag: string): number {
  return selectedDecisionCountWithReasonTag(decisions, tag);
}

function selectedDecisionCountWithReasonTag(decisions: BattleAiDecisionDebugV4[], tag: string): number {
  return decisions.filter(decision => selectedReasonTags(decision).includes(tag)).length;
}

function selectedReasonTags(decision: BattleAiDecisionDebugV4): string[] {
  const selected = decision.search?.reasonTags?.find(entry => entry.choice === decision.selectedChoice);
  return selected?.tags || [];
}

function selectedTopCandidate(decision: BattleAiDecisionDebugV4): BattleAiDecisionDebugV4["topCandidates"][number] | undefined {
  return decision.topCandidates.find(candidate => candidate.choice === decision.selectedChoice);
}

function selectedMoveIds(decision: BattleAiDecisionDebugV4): string[] {
  const diagnostics = selectedTopCandidate(decision)?.diagnostics;
  if (!diagnostics) return [];
  const ids = new Set<string>();
  const moveId = normalizeId(diagnostics.moveId);
  if (moveId) ids.add(moveId);
  for (const part of diagnosticParts(diagnostics)) {
    const partMoveId = normalizeId(part.moveId);
    if (partMoveId) ids.add(partMoveId);
  }
  return [...ids];
}

function selectedMoveTargets(decision: BattleAiDecisionDebugV4): string[] {
  const diagnostics = selectedTopCandidate(decision)?.diagnostics;
  if (!diagnostics) return [];
  const targets = new Set<string>();
  const target = normalizeId(diagnostics.target);
  if (target) targets.add(target);
  for (const part of diagnosticParts(diagnostics)) {
    const partTarget = normalizeId(part.target);
    if (partTarget) targets.add(partTarget);
  }
  return [...targets];
}

function diagnosticParts(diagnostics: Record<string, unknown>): Array<Record<string, unknown>> {
  return Array.isArray(diagnostics.parts)
    ? diagnostics.parts.filter((part): part is Record<string, unknown> => Boolean(part) && typeof part === "object" && !Array.isArray(part))
    : [];
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
      reasonTags: selectedReasonTags(decision),
    }));
}

export function summarizeBattleAiSelfPlayResultsV4(results: BattleAiSelfPlayQuestionResultV4[]): BattleAiSelfPlayExamReportV4["summary"] {
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
    teamCoreCompleteByArchetype: summarizeTeamCoreComplete(results),
    blunders: summarizeBlunders(results),
  };
}

function summarizeTeamCoreComplete(results: BattleAiSelfPlayQuestionResultV4[]): BattleAiSelfPlayExamReportV4["summary"]["teamCoreCompleteByArchetype"] {
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

function slowestResult(results: BattleAiSelfPlayQuestionResultV4[]): BattleAiSelfPlayExamReportV4["summary"]["slowestQuestion"] {
  const slowest = results.slice().sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  return slowest ? {id: slowest.question.id, elapsedMs: slowest.elapsedMs} : undefined;
}

function reportNotes(result: BattleAiSelfPlayQuestionResultV4): string {
  const notes: string[] = [];
  if (result.metrics.timeoutCount) notes.push(`timeouts:${result.metrics.timeoutCount}`);
  if (result.blunderDiagnostics.summary.severe) notes.push(`severe:${result.blunderDiagnostics.summary.severe}`);
  if (result.blunderDiagnostics.summary.warning) notes.push(`warnings:${result.blunderDiagnostics.summary.warning}`);
  if (result.metrics.switchCount) notes.push(`switch:${result.metrics.switchCount}`);
  if (result.metrics.hazardCount) notes.push(`hazard:${result.metrics.hazardCount}`);
  if (result.metrics.weatherCount) notes.push(`weather:${result.metrics.weatherCount}`);
  return notes.join(", ") || "-";
}

function coreCompleteSummary(summary: BattleAiSelfPlayExamReportV4["summary"]["teamCoreCompleteByArchetype"]): string {
  return Object.entries(summary)
    .map(([archetype, bucket]) => `${archetype}:${bucket.complete}/${bucket.total} (${round(bucket.rate * 100)}%)`)
    .join(", ") || "-";
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

function analyzeBlundersFromSnapshot(
  snapshot: BattleServiceSnapshotV4,
  status: BattleAiSelfPlayQuestionResultV4["status"],
  metrics: BattleAiSelfPlayQuestionResultV4["metrics"],
  question: BattleAiSelfPlayQuestionV4,
  teams: BattleAiSelfPlayQuestionResultV4["teams"],
): BattleAiBlunderDiagnosticsV4 {
  const findings: BattleAiBlunderFindingV4[] = [...teamCoreFindings(question, teams)];
  if (status === "stalled") {
    findings.push({severity: "severe", kind: "stalled", detail: "battle progress stopped for multiple auto-advance cycles"});
  } else if (status === "max-turns") {
    findings.push({severity: "warning", kind: "max-turns", detail: `battle reached max turn limit at turn ${snapshot.turn}`});
  }
  if (metrics.timeoutCount > 0) {
    findings.push({severity: "warning", kind: "timeout", detail: `${metrics.timeoutCount} AI decisions hit their search timeout`});
  }
  if (metrics.switchCount >= 10 && snapshot.turn > 0 && metrics.switchCount > snapshot.turn * 1.2) {
    findings.push({
      severity: "warning",
      kind: "high-switch-rate",
      detail: `${metrics.switchCount} AI switches across ${snapshot.turn} turns; review for switch loops or forced-switch churn`,
    });
  }
  if (metrics.friendlyFireRiskCount >= 2) {
    findings.push({
      severity: "warning",
      kind: "friendly-fire-risk",
      detail: `${metrics.friendlyFireRiskCount} selected doubles actions carried ally-damage or spread-friendly-fire risk tags`,
    });
  }
  if (metrics.fakeOutCount >= 2 && selectedDecisionCountWithReasonTag(snapshot.debug.aiDecisions || [], "fake-out-low-value") >= 2) {
    findings.push({
      severity: "warning",
      kind: "low-value-fake-out",
      detail: "AI repeatedly selected Fake Out while value function marked it as low value",
    });
  }
  for (const finding of ineffectiveMoveFindings(snapshot.rawLog || [])) {
    findings.push(finding);
  }
  for (const decision of snapshot.debug.aiDecisions || []) {
    if (decision.selectedScore <= -100) {
      findings.push({
        severity: "warning",
        kind: "negative-choice-score",
        playerId: decision.playerId,
        choice: decision.selectedChoice,
        detail: `selected ${decision.selectedChoice} with strongly negative score ${round(decision.selectedScore)}`,
      });
    }
    const breakdown = decision.search?.valueBreakdown || {};
    for (const [key, value] of Object.entries(breakdown)) {
      const threshold = key === "leaf" ? 5_000 : 1_000;
      if (Math.abs(Number(value)) > threshold) {
        findings.push({
          severity: "severe",
          kind: "value-explosion",
          playerId: decision.playerId,
          choice: decision.selectedChoice,
          detail: `valueBreakdown.${key}=${round(Number(value))} exceeded diagnostic bound`,
        });
      }
    }
  }
  return summarizeBlunderFindings(findings);
}

function ineffectiveMoveFindings(rawLog: string[]): BattleAiBlunderFindingV4[] {
  const findings: BattleAiBlunderFindingV4[] = [];
  const repeated = new Map<string, number>();
  let turn = 0;
  let lastMove: {playerId?: ShowdownPlayerIdV4; moveName: string; target?: string; turn: number} | null = null;
  for (const line of rawLog) {
    const parts = line.split("|");
    if (parts[1] === "turn") {
      turn = Number(parts[2] || turn) || turn;
      lastMove = null;
      continue;
    }
    if (parts[1] === "move") {
      lastMove = {
        playerId: playerIdFromSlot(parts[2]),
        moveName: parts[3] || "unknown move",
        target: parts[4] || undefined,
        turn,
      };
      continue;
    }
    if (parts[1] !== "-immune" || !lastMove) continue;
    const target = parts[2] || lastMove.target || "target";
    const key = `${lastMove.playerId || "?"}:${lastMove.moveName}:${target}`;
    const count = (repeated.get(key) || 0) + 1;
    repeated.set(key, count);
    findings.push({
      severity: count >= 2 ? "severe" : "warning",
      kind: count >= 2 ? "repeat-ineffective-move" : "ineffective-move",
      playerId: lastMove.playerId,
      turn: lastMove.turn,
      choice: lastMove.moveName,
      detail: `${lastMove.moveName} had no effect on ${target}${count >= 2 ? ` (${count} repeats for same target)` : ""}`,
    });
  }
  return findings;
}

function playerIdFromSlot(slot: string | undefined): ShowdownPlayerIdV4 | undefined {
  const match = String(slot || "").match(/^p([1-4])/);
  if (!match) return undefined;
  return `p${match[1]}` as ShowdownPlayerIdV4;
}

function normalizeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function emptyBlunderDiagnostics(): BattleAiBlunderDiagnosticsV4 {
  return summarizeBlunderFindings([]);
}

function summarizeBlunderFindings(findings: BattleAiBlunderFindingV4[]): BattleAiBlunderDiagnosticsV4 {
  const severe = findings.filter(finding => finding.severity === "severe").length;
  const warning = findings.filter(finding => finding.severity === "warning").length;
  const info = findings.filter(finding => finding.severity === "info").length;
  return {
    summary: {
      severe,
      warning,
      info,
      score: severe * 100 + warning * 10 + info,
    },
    findings,
  };
}

function summarizeBlunders(results: BattleAiSelfPlayQuestionResultV4[]): BattleAiSelfPlayExamReportV4["summary"]["blunders"] {
  const allFindings = results.flatMap(result => result.blunderDiagnostics.findings);
  const kindCounts = new Map<BattleAiBlunderFindingV4["kind"], number>();
  for (const finding of allFindings) {
    kindCounts.set(finding.kind, (kindCounts.get(finding.kind) || 0) + 1);
  }
  return {
    severe: allFindings.filter(finding => finding.severity === "severe").length,
    warning: allFindings.filter(finding => finding.severity === "warning").length,
    info: allFindings.filter(finding => finding.severity === "info").length,
    questionsWithSevere: results.filter(result => result.blunderDiagnostics.summary.severe > 0).length,
    questionsWithWarnings: results.filter(result => result.blunderDiagnostics.summary.warning > 0 || result.blunderDiagnostics.summary.severe > 0).length,
    topKinds: [...kindCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kind, count]) => ({kind, count})),
  };
}

function formatBlunderFinding(finding: BattleAiBlunderFindingV4): string {
  const prefix = `${finding.severity}/${finding.kind}`;
  const subject = [finding.playerId, finding.turn ? `t${finding.turn}` : "", finding.choice].filter(Boolean).join(" ");
  return `${prefix}${subject ? ` (${subject})` : ""}: ${finding.detail}`;
}

function average(values: number[]): number {
  const filtered = values.filter(value => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
