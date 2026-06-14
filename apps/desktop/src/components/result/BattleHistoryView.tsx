import {useEffect, useMemo, useState} from "react";
import type {BattleRecordEntry, ResultSummaryState, SaveBattleRecordsTable} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../lib/ui";
import {ResultView} from "./ResultView";

type BattleHistoryViewProps = {
  onBack: () => void;
};

export function BattleHistoryView({onBack}: BattleHistoryViewProps) {
  const [recordsTable, setRecordsTable] = useState<SaveBattleRecordsTable>({version: 1, records: []});
  const [selectedRecord, setSelectedRecord] = useState<BattleRecordEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settlementRecords = useMemo(() => {
    return recordsTable.records
      .filter(record => Boolean(record.result_summary))
      .slice()
      .sort((left, right) => Date.parse(right.created_at || "") - Date.parse(left.created_at || ""));
  }, [recordsTable.records]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void window.changeBattle!.battleRecords().then(table => {
      if (cancelled) return;
      setRecordsTable(table || {version: 1, records: []});
    }).catch(err => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : String(err));
      setRecordsTable({version: 1, records: []});
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (selectedRecord?.result_summary) {
    return (
      <ResultView
        message={selectedRecord.message}
        battle={null}
        summary={selectedRecord.result_summary}
        backLabel="返回战绩"
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="battle-history-page">
      <section className="battle-history-panel">
        <header className="battle-history-header">
          <div>
            <span>RECORDS</span>
            <h1>战绩</h1>
            <p>查看历史挑战的完整结算记录。</p>
          </div>
          <button onClick={onBack}>返回主界面</button>
        </header>
        <div className="battle-history-list">
          {loading ? <p className="battle-history-message">读取历史战绩中...</p> : null}
          {error ? <p className="battle-history-message">{error}</p> : null}
          {!loading && !error && !settlementRecords.length ? <p className="battle-history-message">暂无结算记录。</p> : null}
          {settlementRecords.map(record => (
            <BattleHistoryCard record={record} onClick={() => setSelectedRecord(record)} key={record.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BattleHistoryCard({record, onClick}: {record: BattleRecordEntry; onClick: () => void}) {
  const summary = record.result_summary as ResultSummaryState | undefined;
  const pokemon = (summary?.used_pokemon?.length ? summary.used_pokemon.map(entry => entry.pokemon) : record.player_team || []).slice(0, 4);
  const outcome = summary?.outcome || record.outcome;
  const totalBattles = Number(summary?.total_battles || record.total_battles || 0);
  const progressCount = summary?.progress?.length || totalBattles || record.battle_no || 0;
  const teamCount = (summary?.used_pokemon?.length || summary?.player_team?.length || record.player_team?.length || pokemon.length || 0);
  return (
    <button className={`battle-history-card ${outcome}`} onClick={onClick}>
      <div className="battle-history-card-main">
        <span>{outcomeText(outcome)}挑战</span>
        <strong>{summary?.headline || record.message || "挑战结算"}</strong>
        <small>{formatRecordDate(record.created_at)}　{summary?.subtitle || wholeRunSubtitle(outcome, progressCount, totalBattles)}</small>
      </div>
      <div className="battle-history-team" aria-label="本局宝可梦">
        {pokemon.map((entry, index) => (
          <PokemonSprite pokemon={entry} alt={displayName(entry)} key={`${record.id}-${entry.run_member_id || entry.species_id || index}`} />
        ))}
      </div>
      <div className="battle-history-meta">
        <span>整局</span>
        <small>{progressCount ? `${progressCount}${totalBattles ? `/${totalBattles}` : ""} 场战斗` : "查看结算"}{teamCount ? ` · ${teamCount} 只宝可梦` : ""}</small>
      </div>
    </button>
  );
}

function wholeRunSubtitle(outcome: ResultSummaryState["outcome"] | BattleRecordEntry["outcome"], progressCount: number, totalBattles: number): string {
  const progress = progressCount ? `${progressCount}${totalBattles ? `/${totalBattles}` : ""} 场` : "本局";
  if (outcome === "win") return `${progress} · 已通关`;
  if (outcome === "loss") return `${progress} · 挑战失败`;
  return `${progress} · 已中断`;
}

function outcomeText(outcome: ResultSummaryState["outcome"] | BattleRecordEntry["outcome"]): string {
  if (outcome === "win") return "通关";
  if (outcome === "loss") return "失败";
  return "中断";
}

function formatRecordDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
