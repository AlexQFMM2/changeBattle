export type FormalRoundSettlementV4 = {
  nodeId: string;
  rewardCoins: number;
  reviveCost: number;
  netCoins: number;
  revivedPokemonIds: string[];
  emergencyHealedPokemonIds: string[];
  outpatientHealedPokemonIds: string[];
  leveledPokemonIds: string[];
  createdAt: string;
};

export type FormalSettlementReasonV4 = "complete" | "loss" | "surrender" | "abandon";

export type FormalGameSettlementV4 = {
  id: string;
  outcome: "win" | "loss" | "abandoned";
  reason: FormalSettlementReasonV4;
  bpGained: number;
  wonRounds: number;
  totalRounds: number;
  coinSummary: {
    income: number;
    expense: number;
    net: number;
    balance: number;
  };
  pokemonStats: FormalSettlementPokemonStatsV4[];
  mvpPokemonKey: string;
  diagnostics: string[];
  createdAt: string;
  claimedAt?: string;
  playerVaultItemsClaimedAt?: string;
  playerVaultItemsClaimedCount?: number;
  playerVaultItemsRejectedCount?: number;
};

export type FormalSettlementPokemonStatsV4 = {
  pokemonKey: string;
  localPokemonId: string;
  speciesId: string;
  name: string;
  nameZh: string;
  iconUrl?: string;
  iconStyle?: string;
  spriteUrl?: string;
  shiny: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  healing: number;
  usedRounds: number[];
  kdaScore: number;
  mvpScore: number;
  isMvp: boolean;
};

export type FormalSettlementSummaryV4 = {
  outcome: FormalGameSettlementV4["outcome"];
  reason: FormalSettlementReasonV4;
  bpGained: number;
  wonRounds: number;
  totalRounds: number;
  income: number;
  expense: number;
  net: number;
  balance: number;
  mvp: FormalSettlementPokemonStatsV4 | null;
};

export function normalizeFormalRoundSettlementV4(value: unknown, nodeId = ""): FormalRoundSettlementV4 {
  const raw = isRecord(value) ? value : {};
  return {
    nodeId: normalizeNonEmptyText(raw.nodeId) || nodeId,
    rewardCoins: clampInt(raw.rewardCoins, 0, 999999, 0),
    reviveCost: clampInt(raw.reviveCost, 0, 999999, 0),
    netCoins: clampInt(raw.netCoins, -999999, 999999, 0),
    revivedPokemonIds: normalizeStringList(raw.revivedPokemonIds),
    emergencyHealedPokemonIds: normalizeStringList(raw.emergencyHealedPokemonIds),
    outpatientHealedPokemonIds: normalizeStringList(raw.outpatientHealedPokemonIds),
    leveledPokemonIds: normalizeStringList(raw.leveledPokemonIds),
    createdAt: normalizeIsoText(raw.createdAt) || new Date(0).toISOString(),
  };
}

export function normalizeFormalSettlementReasonV4(reason: unknown): FormalSettlementReasonV4 {
  return reason === "complete" || reason === "loss" || reason === "surrender" || reason === "abandon" ? reason : "loss";
}

export function normalizeFormalGameSettlementV4(value: unknown, options: {idFallback?: string; totalRoundsFallback?: number; createdAtFallback?: string} = {}): FormalGameSettlementV4 | null {
  if (!isRecord(value)) return null;
  const reason = normalizeFormalSettlementReasonV4(value.reason);
  const outcome = value.outcome === "win" || value.outcome === "loss" || value.outcome === "abandoned"
    ? value.outcome
    : reason === "abandon" ? "abandoned" : "loss";
  const pokemonStats = normalizeFormalSettlementPokemonStatsListV4(value.pokemonStats);
  return {
    id: normalizeNonEmptyText(value.id) || options.idFallback || "formal-settlement",
    outcome,
    reason,
    bpGained: clampInt(value.bpGained, 0, 999999, 0),
    wonRounds: clampInt(value.wonRounds, 0, 999999, 0),
    totalRounds: clampInt(value.totalRounds, 1, 999999, value.wonRounds || options.totalRoundsFallback || 1),
    coinSummary: {
      income: clampInt(value.coinSummary?.income, 0, 999999, 0),
      expense: clampInt(value.coinSummary?.expense, 0, 999999, 0),
      net: clampInt(value.coinSummary?.net, -999999, 999999, 0),
      balance: clampInt(value.coinSummary?.balance, 0, 999999, 0),
    },
    pokemonStats,
    mvpPokemonKey: normalizeNonEmptyText(value.mvpPokemonKey) || pokemonStats[0]?.pokemonKey || "",
    diagnostics: normalizeStringList(value.diagnostics),
    createdAt: normalizeIsoText(value.createdAt) || options.createdAtFallback || new Date(0).toISOString(),
    claimedAt: normalizeOptionalIsoText(value.claimedAt),
    playerVaultItemsClaimedAt: normalizeOptionalIsoText(value.playerVaultItemsClaimedAt),
    playerVaultItemsClaimedCount: clampInt(value.playerVaultItemsClaimedCount, 0, 999999, 0),
    playerVaultItemsRejectedCount: clampInt(value.playerVaultItemsRejectedCount, 0, 999999, 0),
  };
}

export function normalizeFormalSettlementPokemonStatsListV4(value: unknown): FormalSettlementPokemonStatsV4[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeFormalSettlementPokemonStatsV4);
}

export function normalizeFormalSettlementPokemonStatsV4(value: unknown): FormalSettlementPokemonStatsV4 {
  const raw = isRecord(value) ? value : {};
  const pokemonKey = normalizeNonEmptyText(raw.pokemonKey ?? raw.localPokemonId ?? raw.speciesId) || "pokemon-stat";
  return {
    pokemonKey,
    localPokemonId: normalizeNonEmptyText(raw.localPokemonId),
    speciesId: normalizeNonEmptyText(raw.speciesId),
    name: normalizeNonEmptyText(raw.name ?? raw.nameZh ?? raw.speciesId),
    nameZh: normalizeNonEmptyText(raw.nameZh ?? raw.name ?? raw.speciesId),
    iconUrl: normalizeOptionalText(raw.iconUrl),
    iconStyle: normalizeOptionalText(raw.iconStyle),
    spriteUrl: normalizeOptionalText(raw.spriteUrl),
    shiny: Boolean(raw.shiny),
    kills: clampInt(raw.kills, 0, 999, 0),
    deaths: clampInt(raw.deaths, 0, 999, 0),
    assists: clampInt(raw.assists, 0, 999, 0),
    damageDealt: clampInt(raw.damageDealt, 0, 999999, 0),
    damageTaken: clampInt(raw.damageTaken, 0, 999999, 0),
    healing: clampInt(raw.healing, 0, 999999, 0),
    usedRounds: Array.isArray(raw.usedRounds) ? Array.from(new Set(raw.usedRounds.map(round => clampInt(round, 0, 999, 0)))).sort((a, b) => a - b) : [],
    kdaScore: finiteNumber(raw.kdaScore, 0),
    mvpScore: finiteNumber(raw.mvpScore, 0),
    isMvp: Boolean(raw.isMvp),
  };
}

export function summarizeFormalSettlementV4(settlement: FormalGameSettlementV4 | null | undefined): FormalSettlementSummaryV4 | null {
  const normalized = normalizeFormalGameSettlementV4(settlement);
  if (!normalized) return null;
  return {
    outcome: normalized.outcome,
    reason: normalized.reason,
    bpGained: normalized.bpGained,
    wonRounds: normalized.wonRounds,
    totalRounds: normalized.totalRounds,
    income: normalized.coinSummary.income,
    expense: normalized.coinSummary.expense,
    net: normalized.coinSummary.net,
    balance: normalized.coinSummary.balance,
    mvp: getFormalSettlementMvpV4(normalized),
  };
}

export function getFormalSettlementMvpV4(settlement: FormalGameSettlementV4 | null | undefined): FormalSettlementPokemonStatsV4 | null {
  const normalized = normalizeFormalGameSettlementV4(settlement);
  if (!normalized) return null;
  return normalized.pokemonStats.find(stat => stat.pokemonKey === normalized.mvpPokemonKey)
    || normalized.pokemonStats.find(stat => stat.isMvp)
    || normalized.pokemonStats[0]
    || null;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(normalizeNonEmptyText).filter(Boolean)));
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = normalizeNonEmptyText(value);
  return text || undefined;
}

function normalizeNonEmptyText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeOptionalIsoText(value: unknown): string | undefined {
  const text = normalizeIsoText(value);
  return text || undefined;
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

function finiteNumber(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
