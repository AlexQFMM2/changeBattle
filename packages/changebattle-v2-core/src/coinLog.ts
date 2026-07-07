export type TrainingCoinLogEntryV4 = {
  id: string;
  key: string;
  at: string;
  roundIndex: number;
  kind: "income" | "expense" | "adjustment";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  label: string;
};

export type TrainingCoinLogSummaryV4 = {
  income: number;
  expense: number;
  adjustment: number;
  net: number;
  latestBalance: number | null;
};

export function normalizeCoinLogEntryV4(value: unknown, index = 0): TrainingCoinLogEntryV4 | null {
  if (!isRecord(value)) return null;
  const amount = clampInt(value.amount, -999999, 999999, 0);
  const balanceBefore = clampInt(value.balanceBefore, 0, 999999, 0);
  const balanceAfter = clampInt(value.balanceAfter, 0, 999999, clampInt(balanceBefore + amount, 0, 999999, balanceBefore));
  const kind = value.kind === "income" || value.kind === "expense" || value.kind === "adjustment"
    ? value.kind
    : amount > 0 ? "income" : amount < 0 ? "expense" : "adjustment";
  const key = normalizeNonEmptyText(value.key ?? value.id ?? `coin-${index}`);
  return {
    id: normalizeNonEmptyText(value.id) || key || `coin-log-${index}`,
    key: key || `coin-log-key-${index}`,
    at: normalizeIsoText(value.at) || new Date(0).toISOString(),
    roundIndex: clampInt(value.roundIndex, 0, 999, 0),
    kind,
    amount,
    balanceBefore,
    balanceAfter,
    source: normalizeNonEmptyText(value.source) || "unknown",
    label: normalizeNonEmptyText(value.label) || "金币变动",
  };
}

export function normalizeCoinLogV4(value: unknown): TrainingCoinLogEntryV4[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const normalized = normalizeCoinLogEntryV4(entry, index);
    return normalized ? [normalized] : [];
  });
}

export function appendCoinLogEntryV4(log: unknown, entry: unknown): TrainingCoinLogEntryV4[] {
  const normalized = normalizeCoinLogV4(log);
  const next = normalizeCoinLogEntryV4(entry, normalized.length);
  if (!next) return normalized;
  if (normalized.some(item => item.key === next.key)) return normalized;
  return [...normalized, next];
}

export function summarizeCoinLogV4(log: unknown): TrainingCoinLogSummaryV4 {
  const normalized = normalizeCoinLogV4(log);
  const summary = normalized.reduce<TrainingCoinLogSummaryV4>((acc, entry) => {
    if (entry.amount > 0) acc.income += entry.amount;
    else if (entry.amount < 0) acc.expense += Math.abs(entry.amount);
    else acc.adjustment += entry.amount;
    acc.net += entry.amount;
    acc.latestBalance = entry.balanceAfter;
    return acc;
  }, {income: 0, expense: 0, adjustment: 0, net: 0, latestBalance: null});
  return summary;
}

export function filterCoinLogByRoundV4(log: unknown, roundIndex: number): TrainingCoinLogEntryV4[] {
  const normalizedRoundIndex = clampInt(roundIndex, 0, 999, 0);
  return normalizeCoinLogV4(log).filter(entry => entry.roundIndex === normalizedRoundIndex);
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
