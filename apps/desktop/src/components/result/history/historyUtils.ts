import type {BattleRecordEntry, RentalPokemon, ResultSummaryState} from "@changebattle/shared";

export function settlementRecords(records: BattleRecordEntry[]): BattleRecordEntry[] {
  return records
    .filter(record => Boolean(record.result_summary))
    .slice()
    .sort((left, right) => Date.parse(right.created_at || "") - Date.parse(left.created_at || ""));
}

export function recordSummary(record: BattleRecordEntry): ResultSummaryState | undefined {
  return record.result_summary;
}

export function recordOutcome(record: BattleRecordEntry): ResultSummaryState["outcome"] | BattleRecordEntry["outcome"] {
  return recordSummary(record)?.outcome || record.outcome;
}

export function recordPokemon(record: BattleRecordEntry, limit = 4): RentalPokemon[] {
  const summary = recordSummary(record);
  return (summary?.used_pokemon?.length ? summary.used_pokemon.map(entry => entry.pokemon) : summary?.player_team || record.player_team || []).slice(0, limit);
}

export function recordProgressCount(record: BattleRecordEntry): number {
  const summary = recordSummary(record);
  return summary?.progress?.length || Number(summary?.total_battles || record.total_battles || 0) || Number(record.battle_no || 0);
}

export function recordTotalBattles(record: BattleRecordEntry): number {
  const summary = recordSummary(record);
  return Number(summary?.total_battles || record.total_battles || 0);
}

export function recordTeamCount(record: BattleRecordEntry): number {
  const summary = recordSummary(record);
  const pokemon = recordPokemon(record, 99);
  return summary?.used_pokemon?.length || summary?.player_team?.length || record.player_team?.length || pokemon.length || 0;
}

export function outcomeText(outcome: ResultSummaryState["outcome"] | BattleRecordEntry["outcome"]): string {
  if (outcome === "win") return "通关";
  if (outcome === "loss") return "失败";
  return "中断";
}

export function outcomeTitle(outcome: ResultSummaryState["outcome"] | BattleRecordEntry["outcome"]): string {
  if (outcome === "win") return "已通关";
  if (outcome === "loss") return "挑战失败";
  return "已中断";
}

export function wholeRunSubtitle(outcome: ResultSummaryState["outcome"] | BattleRecordEntry["outcome"], progressCount: number, totalBattles: number): string {
  const progress = progressCount ? `${progressCount}${totalBattles ? `/${totalBattles}` : ""} 场` : "本局";
  return `${progress} · ${outcomeTitle(outcome)}`;
}

export function formatRecordDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function recordTitle(record: BattleRecordEntry): string {
  return recordSummary(record)?.headline || record.message || "挑战结算";
}

export function recordSubtitle(record: BattleRecordEntry): string {
  const outcome = recordOutcome(record);
  return recordSummary(record)?.subtitle || wholeRunSubtitle(outcome, recordProgressCount(record), recordTotalBattles(record));
}
