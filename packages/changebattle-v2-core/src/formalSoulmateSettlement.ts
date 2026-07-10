import {summarizeBattleLogByPokemonV4, type BattleLogPokemonSummaryV4, type TrainingBattleLogEntryV4} from "./battleLog.js";
import type {LocalPokemonV4} from "./pokemonInstance.js";

export type FormalSoulmateBattleFriendshipDeltaV4 = {
  localPokemonId: string;
  sourcePlayerPokemonId: string;
  displayName: string;
  before: number;
  after: number;
  delta: number;
  winDelta: number;
  faintDelta: number;
  participated: boolean;
  fainted: boolean;
};

export type FormalSoulmateBattleFriendshipSummaryV4 = {
  nodeId: string;
  won: boolean;
  createdAt: string;
  deltas: FormalSoulmateBattleFriendshipDeltaV4[];
};

export function isFormalSoulmateLocalPokemonV4(pokemon: Pick<LocalPokemonV4, "formalSourceKind" | "originKind"> | null | undefined): boolean {
  return pokemon?.formalSourceKind === "soulmate-vault" || pokemon?.originKind === "soulmate";
}

export function calculateFormalSoulmateFriendshipSettlementV4(input: {
  nodeId: string;
  team: LocalPokemonV4[];
  battleLog: TrainingBattleLogEntryV4[];
  won: boolean;
  createdAt?: string;
  resolvePokemonKey?: (entry: TrainingBattleLogEntryV4, role: "source" | "target") => string | null | undefined;
}): FormalSoulmateBattleFriendshipSummaryV4 {
  const nodeId = normalizeText(input.nodeId);
  const createdAt = normalizeText(input.createdAt) || new Date().toISOString();
  const soulmatePokemon = input.team.filter(pokemon => isFormalSoulmateLocalPokemonV4(pokemon) && normalizeText(pokemon.sourcePlayerPokemonId));
  if (!nodeId || !soulmatePokemon.length) {
    return {nodeId, won: Boolean(input.won), createdAt, deltas: []};
  }
  const summaryByKey = battleSummaryByKey(input.battleLog, {
    resolvePokemonKey: input.resolvePokemonKey,
  });
  const localById = new Map(soulmatePokemon.map(pokemon => [normalizeText(pokemon.sourcePlayerPokemonId), pokemon]));
  const deltas: FormalSoulmateBattleFriendshipDeltaV4[] = [];
  for (const local of input.team) {
    const sourcePlayerPokemonId = normalizeText(local.sourcePlayerPokemonId);
    if (!sourcePlayerPokemonId || localById.get(sourcePlayerPokemonId) !== local) continue;
    const summary = summaryForLocalPokemon(summaryByKey, local);
    const participated = Boolean(summary && (
      summary.usedRounds.length > 0
      || summary.damageDealt > 0
      || summary.damageTaken > 0
      || summary.healing > 0
      || summary.kills > 0
      || summary.deaths > 0
    ));
    const fainted = Boolean(summary && summary.deaths > 0);
    const winDelta = input.won ? (participated ? 15 : 10) : 0;
    const faintDelta = fainted ? -3 : 0;
    const delta = winDelta + faintDelta;
    const before = clampFriendship(local.friendship);
    const after = clampFriendship(before + delta);
    deltas.push({
      localPokemonId: local.localPokemonId,
      sourcePlayerPokemonId,
      displayName: formalSoulmateDisplayNameV4(local),
      before,
      after,
      delta: after - before,
      winDelta,
      faintDelta,
      participated,
      fainted,
    });
  }
  return {
    nodeId,
    won: Boolean(input.won),
    createdAt,
    deltas,
  };
}

function battleSummaryByKey(log: TrainingBattleLogEntryV4[], options: {
  resolvePokemonKey?: (entry: TrainingBattleLogEntryV4, role: "source" | "target") => string | null | undefined;
}): Map<string, BattleLogPokemonSummaryV4> {
  const map = new Map<string, BattleLogPokemonSummaryV4>();
  summarizeBattleLogByPokemonV4(log, {
    playerId: "p1",
    includeIndirectDamageDealt: true,
    resolvePokemonKey: options.resolvePokemonKey,
  }).forEach(summary => {
    map.set(normalizeBattleKey(summary.pokemonKey), summary);
  });
  return map;
}

function summaryForLocalPokemon(summaryByKey: Map<string, BattleLogPokemonSummaryV4>, pokemon: LocalPokemonV4): BattleLogPokemonSummaryV4 | null {
  const keys = [
    pokemon.localPokemonId,
    pokemon.showdownId,
    pokemon.nickname,
    pokemon.nameZh,
    pokemon.name,
    pokemon.speciesId,
  ].map(normalizeBattleKey).filter(Boolean);
  for (const key of keys) {
    const summary = summaryByKey.get(key);
    if (summary) return summary;
  }
  return null;
}

function formalSoulmateDisplayNameV4(local: LocalPokemonV4): string {
  return local.nickname || local.nameZh || local.name || local.speciesId;
}

function clampFriendship(value: unknown): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, Math.min(255, next));
}

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeBattleKey(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}
