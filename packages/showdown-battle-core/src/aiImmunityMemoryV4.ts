import type {BattleServiceMoveRequestV4, BattleServiceSnapshotV4, ShowdownPlayerIdV4} from "./types.js";

export type BattleAiImmunityMemoryEntryV4 = {
  playerId?: ShowdownPlayerIdV4;
  moveId: string;
  targetKeys: string[];
  targetLabel: string;
  turn: number;
};

export type BattleAiImmunityMemoryV4 = {
  entries: BattleAiImmunityMemoryEntryV4[];
};

export type BattleAiImmunityMemoryMatchV4 = {
  penalty: number;
  targetLabel: string;
  turn: number;
  confidence: "exact" | "move-active-foe" | "move-history";
};

type LoggedMoveV4 = {
  playerId?: ShowdownPlayerIdV4;
  userSlot?: string;
  moveName: string;
  target?: string;
  turn: number;
  immuneTargets: string[];
  effectiveTargets: string[];
};

export function buildBattleAiImmunityMemoryV4(snapshot: BattleServiceSnapshotV4): BattleAiImmunityMemoryV4 {
  const entries: BattleAiImmunityMemoryEntryV4[] = [];
  let turn = 0;
  let currentMove: LoggedMoveV4 | null = null;
  const flushMove = () => {
    if (!currentMove || !currentMove.immuneTargets.length) {
      currentMove = null;
      return;
    }
    entries.push(...entriesFromLoggedMove(currentMove));
    currentMove = null;
  };
  for (const line of snapshot.rawLog || []) {
    const parts = line.split("|");
    if (parts[1] === "turn") {
      flushMove();
      turn = Number(parts[2] || turn) || turn;
      continue;
    }
    if (parts[1] === "move") {
      flushMove();
      currentMove = {
        playerId: playerIdFromSlot(parts[2]),
        userSlot: parts[2],
        moveName: parts[3] || "unknown move",
        target: parts[4] || undefined,
        turn,
        immuneTargets: [],
        effectiveTargets: [],
      };
      continue;
    }
    if (!currentMove) continue;
    if (parts[1] === "-immune") {
      currentMove.immuneTargets.push(parts[2] || currentMove.target || "target");
    } else if (isPositiveMoveEffectLine(parts)) {
      const target = parts[2] || currentMove.target;
      if (target) currentMove.effectiveTargets.push(target);
    }
  }
  flushMove();
  return {entries};
}

export function battleAiImmunityMemoryMatchForMoveV4(input: {
  memory: BattleAiImmunityMemoryV4;
  snapshot: BattleServiceSnapshotV4;
  playerId: ShowdownPlayerIdV4;
  targetLoc?: string;
  move: BattleServiceMoveRequestV4;
  diagnostics?: Record<string, unknown>;
}): BattleAiImmunityMemoryMatchV4 | null {
  const moveId = normalizeId(input.move.id || input.move.move);
  if (!moveId || isSpreadTarget(input.move.target)) return null;
  const targetKeys = unique([
    ...targetKeysForCandidate(input.snapshot, input.playerId, input.targetLoc),
    ...targetKeysFromDiagnostics(input.diagnostics),
  ]);
  if (targetKeys.length) {
    const match = input.memory.entries.find(entry =>
      entry.playerId === input.playerId &&
      entry.moveId === moveId &&
      entry.targetKeys.some(key => targetKeys.includes(key))
    );
    if (match) return {penalty: -260, targetLabel: match.targetLabel, turn: match.turn, confidence: "exact"};
  }
  const activeFoeKeys = activeFoeTargetKeys(input.snapshot, input.playerId);
  const moveActiveFoeMatch = input.memory.entries.find(entry =>
    entry.playerId === input.playerId &&
    entry.moveId === moveId &&
    entry.targetKeys.some(key => activeFoeKeys.includes(key))
  );
  if (moveActiveFoeMatch) return {penalty: -420, targetLabel: moveActiveFoeMatch.targetLabel, turn: moveActiveFoeMatch.turn, confidence: "move-active-foe"};
  const moveHistoryMatch = input.memory.entries.find(entry => entry.playerId === input.playerId && entry.moveId === moveId);
  return moveHistoryMatch ? {penalty: -360, targetLabel: moveHistoryMatch.targetLabel, turn: moveHistoryMatch.turn, confidence: "move-history"} : null;
}

function entriesFromLoggedMove(move: LoggedMoveV4): BattleAiImmunityMemoryEntryV4[] {
  const enemyImmuneTargets = move.immuneTargets.filter(target => !sameSideBattleSlot(move.userSlot, target));
  const enemyEffectiveTargets = unique(move.effectiveTargets.filter(target => !sameSideBattleSlot(move.userSlot, target) && !move.immuneTargets.includes(target)));
  if (!enemyImmuneTargets.length || enemyEffectiveTargets.length) return [];
  const moveId = normalizeId(move.moveName);
  if (!moveId) return [];
  return enemyImmuneTargets.map(target => ({
    playerId: move.playerId,
    moveId,
    targetKeys: targetKeysFromBattleLogTarget(target),
    targetLabel: target,
    turn: move.turn,
  }));
}

function targetKeysForCandidate(snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4, targetLoc: string | undefined): string[] {
  if (!targetLoc?.startsWith("+")) return [];
  const targetIndex = Number(targetLoc.slice(1)) - 1;
  if (!Number.isFinite(targetIndex) || targetIndex < 0) return [];
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  const foePlayerIds = snapshot.players
    .filter(entry => entry.playerId !== playerId && entry.alliance !== player?.alliance)
    .map(entry => entry.playerId);
  const target = snapshot.active.filter(active => foePlayerIds.includes(active.playerId) && !active.fainted)[targetIndex];
  if (!target) return [];
  return unique([
    `slot:${normalizeSlot(target.slot)}`,
    `species:${normalizeId(target.species)}`,
    `ident:${normalizeId(target.ident)}`,
    `label:${normalizeId(`${target.slot}: ${target.species}`)}`,
  ].filter(key => !key.endsWith(":")));
}

function targetKeysFromBattleLogTarget(target: string): string[] {
  const match = target.match(/^(p[1-4][a-z]?):\s*(.+)$/i);
  const slot = match?.[1] || "";
  const species = match?.[2] || target;
  return unique([
    slot ? `slot:${normalizeSlot(slot)}` : "",
    species ? `species:${normalizeId(species)}` : "",
    species ? `ident:${normalizeId(target)}` : "",
    `label:${normalizeId(target)}`,
  ].filter(Boolean));
}

function targetKeysFromDiagnostics(diagnostics: Record<string, unknown> | undefined): string[] {
  if (!diagnostics) return [];
  const slots = stringArrayValue(diagnostics.targetSlots);
  const species = stringArrayValue(diagnostics.targetSpeciesIds);
  const idents = stringArrayValue(diagnostics.targetIdents);
  return unique([
    ...slots.map(slot => `slot:${normalizeSlot(slot)}`),
    ...species.map(entry => `species:${normalizeId(entry)}`),
    ...idents.map(ident => `ident:${normalizeId(ident)}`),
  ].filter(key => !key.endsWith(":")));
}

function activeFoeTargetKeys(snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4): string[] {
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  const foePlayerIds = snapshot.players
    .filter(entry => entry.playerId !== playerId && entry.alliance !== player?.alliance)
    .map(entry => entry.playerId);
  return unique(snapshot.active
    .filter(active => foePlayerIds.includes(active.playerId) && !active.fainted)
    .flatMap(active => [
      `slot:${normalizeSlot(active.slot)}`,
      `species:${normalizeId(active.species)}`,
      `ident:${normalizeId(active.ident)}`,
      `label:${normalizeId(`${active.slot}: ${active.species}`)}`,
    ])
    .filter(key => !key.endsWith(":")));
}

function isSpreadTarget(target: string | undefined): boolean {
  const normalized = normalizeId(target);
  return normalized === "alladjacent" || normalized === "alladjacentfoes";
}

function isPositiveMoveEffectLine(parts: string[]): boolean {
  return parts[1] === "-damage" || parts[1] === "-boost" || parts[1] === "-unboost" || parts[1] === "-status" || parts[1] === "-start";
}

function sameSideBattleSlot(left: string | undefined, right: string | undefined): boolean {
  const leftMatch = String(left || "").match(/^p([1-4])/);
  const rightMatch = String(right || "").match(/^p([1-4])/);
  return Boolean(leftMatch && rightMatch && leftMatch[1] === rightMatch[1]);
}

function playerIdFromSlot(slot: string | undefined): ShowdownPlayerIdV4 | undefined {
  const match = String(slot || "").match(/^p([1-4])/);
  return match ? `p${match[1]}` as ShowdownPlayerIdV4 : undefined;
}

function normalizeSlot(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map(entry => String(entry || "")).filter(Boolean) : [];
}
