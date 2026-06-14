import {useEffect, useMemo, useState} from "react";
import type {BattleRecordEntry, SaveBattleRecordsTable} from "@changebattle/shared";
import {ResultView} from "../ResultView";
import {HistoryActionBar} from "./HistoryActionBar";
import {RunRecordDetailPanel} from "./RunRecordDetailPanel";
import {RunRecordList} from "./RunRecordList";
import {settlementRecords} from "./historyUtils";
import "./BattleHistoryPage.css";

export type BattleHistoryPageProps = {
  onBack: () => void;
  previewRecords?: BattleRecordEntry[];
  previewLoading?: boolean;
  previewError?: string | null;
  previewNoResultView?: boolean;
};

export function BattleHistoryPage({onBack, previewRecords, previewLoading = false, previewError = null, previewNoResultView = false}: BattleHistoryPageProps) {
  const [recordsTable, setRecordsTable] = useState<SaveBattleRecordsTable>({version: 1, records: previewRecords || []});
  const [selectedRecord, setSelectedRecord] = useState<BattleRecordEntry | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(previewLoading);
  const [error, setError] = useState<string | null>(previewError);
  const isPreview = Boolean(previewRecords);

  useEffect(() => {
    if (!isPreview) return;
    setRecordsTable({version: 1, records: previewRecords || []});
    setLoading(previewLoading);
    setError(previewError);
  }, [isPreview, previewError, previewLoading, previewRecords]);

  useEffect(() => {
    if (isPreview) return;
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
  }, [isPreview]);

  const records = useMemo(() => settlementRecords(recordsTable.records), [recordsTable.records]);
  const activeRecord = records.find(record => record.id === activeRecordId) || records[0] || null;
  const message = loading ? "读取历史战绩中..." : error || "暂无结算记录。";
  const tone = error ? "error" : loading ? "loading" : "normal";
  const status = error ? "ERROR" : loading ? "LOADING" : "RECORDS";

  useEffect(() => {
    if (activeRecordId && records.some(record => record.id === activeRecordId)) return;
    setActiveRecordId(records[0]?.id || null);
  }, [activeRecordId, records]);

  if (!previewNoResultView && selectedRecord?.result_summary) {
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
        <HistoryActionBar status={status} tone={tone} subtitle={error || "查看历史挑战的完整结算记录。"} onBack={onBack} />
        <main className="battle-history-body">
          <RunRecordList
            records={loading || error ? [] : records}
            activeRecordId={activeRecord?.id || null}
            message={message}
            onPreviewRecord={record => setActiveRecordId(record.id)}
            onOpenRecord={record => {
              setActiveRecordId(record.id);
              if (!previewNoResultView) setSelectedRecord(record);
            }}
          />
          <RunRecordDetailPanel record={loading || error ? null : activeRecord} />
        </main>
      </section>
    </div>
  );
}
