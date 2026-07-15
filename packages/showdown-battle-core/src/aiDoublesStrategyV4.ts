import type {BattleServiceRequestV4} from "./types.js";
import {parseShowdownChoiceCommandV4} from "./showdownCommand.js";
import type {BattleAiCandidateV4} from "./aiSearchEngineV4.js";
import {
  evaluateBattleAiDoublesJointValueV4,
  type BattleAiDoublesJointPartV4,
  type BattleAiDoublesReasonTagV4,
  type BattleAiDoublesValueBreakdownV4,
} from "./aiDoublesValueFunctionV4.js";
import type {BattleAiAllyComboV4} from "./aiAllyComboDetectorV4.js";

export type BattleAiDoublesJointScoreV4 = {
  choice: string;
  adjustment: number;
  tags: BattleAiDoublesReasonTagV4[];
  combos: BattleAiAllyComboV4[];
  valueBreakdown: BattleAiDoublesValueBreakdownV4;
  parts: BattleAiDoublesJointPartV4[];
};

export type BattleAiDoublesStrategyInputV4 = {
  request: BattleServiceRequestV4;
  candidates: BattleAiCandidateV4[];
};

export type BattleAiDoublesStrategyResultV4 = {
  candidate: BattleAiCandidateV4 | null;
  scoredCandidates: BattleAiDoublesJointScoreV4[];
};

export function chooseBattleAiDoublesActionV4(input: BattleAiDoublesStrategyInputV4): BattleAiDoublesStrategyResultV4 {
  const scoredCandidates = input.candidates.map(candidate => scoreBattleAiDoublesJointCandidateV4(input.request, candidate));
  let best: {candidate: BattleAiCandidateV4; score: BattleAiDoublesJointScoreV4; total: number} | null = null;
  for (const [index, candidate] of input.candidates.entries()) {
    const score = scoredCandidates[index]!;
    const total = candidate.score + score.adjustment;
    if (!best || total > best.total) best = {candidate, score, total};
  }
  return {candidate: best?.candidate || null, scoredCandidates};
}

export function scoreBattleAiDoublesJointCandidateV4(request: BattleServiceRequestV4, candidate: BattleAiCandidateV4): BattleAiDoublesJointScoreV4 {
  const parts = jointParts(candidate);
  const value = evaluateBattleAiDoublesJointValueV4({request, choice: candidate.choice, parts});

  return {
    choice: candidate.choice,
    adjustment: value.adjustment,
    tags: value.tags,
    combos: value.combos,
    valueBreakdown: value.breakdown,
    parts,
  };
}

export function battleAiDoublesReasonTagsForDebugV4(scoredCandidates: BattleAiDoublesJointScoreV4[]): Array<{choice: string; tags: string[]; score: number}> {
  return scoredCandidates
    .filter(entry => entry.tags.length || entry.adjustment !== 0)
    .sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment))
    .slice(0, 8)
    .map(entry => ({
      choice: entry.choice,
      tags: [...entry.tags, ...entry.combos.map(combo => `ally-combo:${combo.comboId}`)],
      score: Math.round(entry.adjustment * 100) / 100,
    }));
}

function jointParts(candidate: BattleAiCandidateV4): BattleAiDoublesJointPartV4[] {
  const choices = candidate.choice.split(",").map(part => part.trim()).filter(Boolean);
  const diagnostics = flattenedDiagnostics(candidate.diagnostics);
  let diagnosticIndex = 0;
  return choices.map((choice, slotIndex) => {
    const parsed = parseShowdownChoiceCommandV4(choice);
    const diagnosticsForPart = parsed?.kind === "move" ? diagnostics[diagnosticIndex++] : undefined;
    return {slotIndex, choice, parsed, diagnostics: diagnosticsForPart};
  });
}

function flattenedDiagnostics(diagnostics: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!diagnostics) return [];
  if (Array.isArray(diagnostics.parts)) {
    return diagnostics.parts.flatMap(part => flattenedDiagnostics(isRecord(part) ? part : undefined));
  }
  return [diagnostics];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
