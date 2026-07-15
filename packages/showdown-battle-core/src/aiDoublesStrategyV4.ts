import type {BattleServiceRequestV4} from "./types.js";
import {parseShowdownChoiceCommandV4, type ShowdownParsedChoiceV4} from "./showdownCommand.js";
import type {BattleAiCandidateV4} from "./aiSearchEngineV4.js";

export type BattleAiDoublesReasonTagV4 =
  | "double-target-foe"
  | "foe-target"
  | "ally-target"
  | "self-target"
  | "spread-foes"
  | "spread-friendly-fire-risk"
  | "avoid-ally-damage"
  | "ally-support";

export type BattleAiDoublesJointPartV4 = {
  slotIndex: number;
  choice: string;
  parsed: ShowdownParsedChoiceV4 | null;
  diagnostics?: Record<string, unknown>;
};

export type BattleAiDoublesJointScoreV4 = {
  choice: string;
  adjustment: number;
  tags: BattleAiDoublesReasonTagV4[];
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
  const tags = new Set<BattleAiDoublesReasonTagV4>();
  let adjustment = 0;
  const positiveTargets = new Map<string, number>();

  for (const part of parts) {
    if (!part.parsed || part.parsed.kind !== "move") continue;
    const diagnostics = part.diagnostics || {};
    const moveTarget = normalizeMoveTarget(diagnostics.target || moveRequestForPart(request, part)?.target || "");
    const category = String(diagnostics.category || "").toLowerCase();
    const expectedDamageRatio = Number(diagnostics.expectedDamageRatio || 0);
    const damaging = category !== "status" && expectedDamageRatio > 0;
    if (part.parsed.target?.startsWith("+")) {
      tags.add("foe-target");
      positiveTargets.set(part.parsed.target, (positiveTargets.get(part.parsed.target) || 0) + 1);
    }
    if (part.parsed.target?.startsWith("-")) {
      tags.add("ally-target");
      if (damaging) {
        tags.add("avoid-ally-damage");
        adjustment -= 95;
      } else {
        tags.add("ally-support");
        adjustment += 10;
      }
    }
    if (moveTarget === "self") {
      tags.add("self-target");
      adjustment += 3;
    }
    if (moveTarget === "alladjacentfoes") {
      tags.add("spread-foes");
      adjustment += 14;
    }
    if (moveTarget === "alladjacent") {
      tags.add("spread-friendly-fire-risk");
      adjustment -= 42;
    }
  }

  if ([...positiveTargets.values()].some(count => count >= 2)) {
    tags.add("double-target-foe");
    adjustment += 18;
  }

  return {
    choice: candidate.choice,
    adjustment,
    tags: [...tags],
    parts,
  };
}

export function battleAiDoublesReasonTagsForDebugV4(scoredCandidates: BattleAiDoublesJointScoreV4[]): Array<{choice: string; tags: string[]; score: number}> {
  return scoredCandidates
    .filter(entry => entry.tags.length || entry.adjustment !== 0)
    .sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment))
    .slice(0, 8)
    .map(entry => ({choice: entry.choice, tags: entry.tags, score: Math.round(entry.adjustment * 100) / 100}));
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

function moveRequestForPart(request: BattleServiceRequestV4, part: BattleAiDoublesJointPartV4) {
  if (!part.parsed || part.parsed.kind !== "move") return undefined;
  return request.active?.[part.slotIndex]?.moves?.[part.parsed.index - 1];
}

function flattenedDiagnostics(diagnostics: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!diagnostics) return [];
  if (Array.isArray(diagnostics.parts)) {
    return diagnostics.parts.flatMap(part => flattenedDiagnostics(isRecord(part) ? part : undefined));
  }
  return [diagnostics];
}

function normalizeMoveTarget(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
