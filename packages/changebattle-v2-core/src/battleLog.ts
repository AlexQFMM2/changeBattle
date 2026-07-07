import type {ShowdownPlayerIdV4} from "./runGame.js";

export type TrainingBattleLogEntryV4 = {
  id: string;
  key: string;
  at: string;
  sessionId: string;
  nodeId: string;
  turn: number;
  rawLogIndex: number;
  eventType: "move" | "damage" | "heal" | "faint" | "win" | "other";
  damage?: number;
  healing?: number;
  sourcePlayerId?: ShowdownPlayerIdV4;
  sourcePokemonKey?: string;
  sourcePokemonName?: string;
  targetPlayerId?: ShowdownPlayerIdV4;
  targetPokemonKey?: string;
  targetPokemonName?: string;
  moveId?: string;
  moveName?: string;
  moveType?: string;
  moveCategory?: string;
  movePower?: number;
  moveEffectKind?: "damage" | "setup" | "recovery" | "status" | "field" | "protect" | "pivot" | "other";
  directness?: "direct" | "indirect" | "unknown";
  rawLine: string;
};

export type BattleLogPokemonSummaryV4 = {
  pokemonKey: string;
  playerId?: ShowdownPlayerIdV4;
  pokemonName?: string;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  healing: number;
  usedRounds: number[];
  kdaScore: number;
  mvpScore: number;
};

export type BattleLogParticipantRoleV4 = "source" | "target";

export type BattleLogSummaryOptionsV4 = {
  playerId?: ShowdownPlayerIdV4 | "all";
  includeIndirectDamageDealt?: boolean;
  resolvePokemonKey?: (entry: TrainingBattleLogEntryV4, role: BattleLogParticipantRoleV4) => string | null | undefined;
  getRoundIndex?: (entry: TrainingBattleLogEntryV4) => number;
};

export function normalizeBattleLogEntryV4(value: unknown, index = 0): TrainingBattleLogEntryV4 | null {
  if (!isRecord(value)) return null;
  const eventType = ["move", "damage", "heal", "faint", "win", "other"].includes(String(value.eventType))
    ? value.eventType as TrainingBattleLogEntryV4["eventType"]
    : "other";
  const key = normalizeNonEmptyText(value.key ?? value.id ?? `battle-${index}`);
  const directness = value.directness === "direct" || value.directness === "indirect" || value.directness === "unknown"
    ? value.directness
    : undefined;
  return {
    id: normalizeNonEmptyText(value.id) || key || `battle-log-${index}`,
    key: key || `battle-log-key-${index}`,
    at: normalizeIsoText(value.at) || new Date(0).toISOString(),
    sessionId: normalizeNonEmptyText(value.sessionId),
    nodeId: normalizeNonEmptyText(value.nodeId),
    turn: clampInt(value.turn, 0, 999, 0),
    rawLogIndex: clampInt(value.rawLogIndex, 0, 99999, index),
    eventType,
    damage: normalizeOptionalPositiveNumber(value.damage),
    healing: normalizeOptionalPositiveNumber(value.healing),
    sourcePlayerId: normalizeShowdownPlayerId(value.sourcePlayerId),
    sourcePokemonKey: normalizeOptionalText(value.sourcePokemonKey),
    sourcePokemonName: normalizeOptionalText(value.sourcePokemonName),
    targetPlayerId: normalizeShowdownPlayerId(value.targetPlayerId),
    targetPokemonKey: normalizeOptionalText(value.targetPokemonKey),
    targetPokemonName: normalizeOptionalText(value.targetPokemonName),
    moveId: normalizeOptionalId(value.moveId),
    moveName: normalizeOptionalText(value.moveName),
    moveType: normalizeOptionalText(value.moveType),
    moveCategory: normalizeOptionalText(value.moveCategory),
    movePower: normalizeOptionalPositiveNumber(value.movePower),
    moveEffectKind: normalizeMoveEffectKind(value.moveEffectKind),
    directness,
    rawLine: String(value.rawLine || ""),
  };
}

export function normalizeBattleLogV4(value: unknown): TrainingBattleLogEntryV4[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const normalized = normalizeBattleLogEntryV4(entry, index);
    return normalized ? [normalized] : [];
  });
}

export function summarizeBattleLogByPokemonV4(log: unknown, options: BattleLogSummaryOptionsV4 = {}): BattleLogPokemonSummaryV4[] {
  const summaries = new Map<string, BattleLogPokemonSummaryV4>();
  const includePlayer = options.playerId || "all";
  const ensureSummary = (entry: TrainingBattleLogEntryV4, role: BattleLogParticipantRoleV4): BattleLogPokemonSummaryV4 | null => {
    const playerId = role === "source" ? entry.sourcePlayerId : entry.targetPlayerId;
    if (includePlayer !== "all" && playerId !== includePlayer) return null;
    const pokemonKey = normalizeNonEmptyText(options.resolvePokemonKey?.(entry, role))
      || normalizeNonEmptyText(role === "source" ? entry.sourcePokemonKey : entry.targetPokemonKey)
      || normalizeNonEmptyText(role === "source" ? entry.sourcePokemonName : entry.targetPokemonName);
    if (!pokemonKey) return null;
    const current = summaries.get(pokemonKey);
    if (current) return current;
    const created: BattleLogPokemonSummaryV4 = {
      pokemonKey,
      playerId,
      pokemonName: role === "source" ? entry.sourcePokemonName : entry.targetPokemonName,
      kills: 0,
      deaths: 0,
      assists: 0,
      damageDealt: 0,
      damageTaken: 0,
      healing: 0,
      usedRounds: [],
      kdaScore: 0,
      mvpScore: 0,
    };
    summaries.set(pokemonKey, created);
    return created;
  };
  const markRound = (summary: BattleLogPokemonSummaryV4, entry: TrainingBattleLogEntryV4) => {
    const roundIndex = options.getRoundIndex ? options.getRoundIndex(entry) : 0;
    const normalizedRoundIndex = clampInt(roundIndex, 0, 999, 0);
    if (!summary.usedRounds.includes(normalizedRoundIndex)) summary.usedRounds.push(normalizedRoundIndex);
  };
  for (const entry of normalizeBattleLogV4(log)) {
    if (entry.eventType === "move") {
      const source = ensureSummary(entry, "source");
      if (source) markRound(source, entry);
    }
    if (entry.eventType === "damage" && entry.damage) {
      const source = ensureSummary(entry, "source");
      if (source) {
        if (entry.directness === "direct" || options.includeIndirectDamageDealt) source.damageDealt += entry.damage;
        markRound(source, entry);
      }
      const target = ensureSummary(entry, "target");
      if (target) {
        target.damageTaken += entry.damage;
        markRound(target, entry);
      }
    }
    if (entry.eventType === "heal" && entry.healing) {
      const target = ensureSummary(entry, "target");
      if (target) {
        target.healing += entry.healing;
        markRound(target, entry);
      }
    }
    if (entry.eventType === "faint") {
      const source = entry.directness === "direct" ? ensureSummary(entry, "source") : null;
      const target = ensureSummary(entry, "target");
      if (source && source.pokemonKey !== target?.pokemonKey) {
        source.kills += 1;
        markRound(source, entry);
      }
      if (target) {
        target.deaths += 1;
        markRound(target, entry);
      }
    }
  }
  const values = Array.from(summaries.values());
  values.forEach(summary => {
    summary.kdaScore = (summary.kills + summary.assists * 0.5 + 1) / Math.max(1, summary.deaths);
    summary.mvpScore = summary.kills * 120 + summary.assists * 40 - summary.deaths * 35 + summary.damageDealt + summary.damageTaken * 0.35 + summary.healing * 0.25 + summary.usedRounds.length * 10;
    summary.usedRounds.sort((a, b) => a - b);
  });
  return values.sort((a, b) => b.mvpScore - a.mvpScore || b.damageDealt - a.damageDealt || b.damageTaken - a.damageTaken || String(a.pokemonName || a.pokemonKey).localeCompare(String(b.pokemonName || b.pokemonKey)));
}

export function getBattleLogParticipantKeysV4(log: unknown, options: Pick<BattleLogSummaryOptionsV4, "playerId" | "resolvePokemonKey"> = {}): string[] {
  return summarizeBattleLogByPokemonV4(log, options).map(summary => summary.pokemonKey);
}

export function getPokemonParticipantsForSoulmateV4(log: unknown, options: Pick<BattleLogSummaryOptionsV4, "playerId" | "resolvePokemonKey" | "getRoundIndex"> = {}): BattleLogPokemonSummaryV4[] {
  return summarizeBattleLogByPokemonV4(log, options).filter(summary => summary.usedRounds.length > 0);
}

export function getPokemonEligibleForSoulmateV4(log: unknown, options: Pick<BattleLogSummaryOptionsV4, "playerId" | "resolvePokemonKey" | "getRoundIndex"> = {}): BattleLogPokemonSummaryV4[] {
  return summarizeBattleLogByPokemonV4(log, options).filter(summary => summary.damageDealt > 0);
}

function normalizeMoveEffectKind(value: unknown): TrainingBattleLogEntryV4["moveEffectKind"] | undefined {
  const text = String(value || "");
  if (["damage", "setup", "recovery", "status", "field", "protect", "pivot", "other"].includes(text)) return text as TrainingBattleLogEntryV4["moveEffectKind"];
  return undefined;
}

function normalizeShowdownPlayerId(value: unknown): ShowdownPlayerIdV4 | undefined {
  return value === "p1" || value === "p2" || value === "p3" || value === "p4" ? value : undefined;
}

function normalizeOptionalPositiveNumber(value: unknown): number | undefined {
  const next = Math.round(Number(value));
  return Number.isFinite(next) && next > 0 ? next : undefined;
}

function normalizeOptionalId(value: unknown): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^tm:/i.test(raw)) return `tm:${toID(raw.slice(3))}`;
  return toID(raw);
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = normalizeNonEmptyText(value);
  return text || undefined;
}

function normalizeNonEmptyText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeIsoText(value: unknown): string {
  const text = normalizeNonEmptyText(value);
  if (!text) return "";
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.round(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
