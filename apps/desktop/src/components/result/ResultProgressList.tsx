import type {BattleRecordEntry, ResultProgressRow} from "@changebattle/shared";
import {trainerDisplayName, trainerImageUrl} from "../../lib/ui";
import {progressOutcomeText} from "./resultUtils";
import "./ResultProgressList.css";

export function ResultProgressList({progressRows, selectedBattleNo, selectedProgress, selectedBattleRecord, recordsLoaded, roundPanelOpen, children, onSelectProgress, onOpenRounds}: {progressRows: ResultProgressRow[]; selectedBattleNo: number; selectedProgress: ResultProgressRow | null; selectedBattleRecord: BattleRecordEntry | null; recordsLoaded: boolean; roundPanelOpen: boolean; children?: React.ReactNode; onSelectProgress: (battleNo: number) => void; onOpenRounds: () => void}) {
  return (
    <aside className="result-progress-panel">
      <header>
        <strong>挑战进度</strong>
        <span>{selectedProgress ? `第 ${selectedProgress.battle_no} 场` : "--"}</span>
      </header>
      <div className="result-progress-track">
        {progressRows.map(row => (
          <button className={`${row.outcome || "pending"} ${row.battle_no === selectedBattleNo ? "selected" : ""}`} onClick={() => onSelectProgress(row.battle_no)} key={row.battle_no}>
            <i>{row.battle_no}</i>
            <span>{row.label}</span>
          </button>
        ))}
      </div>
      {roundPanelOpen ? children : (
        <ProgressDetail
          row={selectedProgress}
          record={selectedBattleRecord}
          recordsLoaded={recordsLoaded}
          onOpenRounds={selectedBattleRecord?.turn_records?.length ? onOpenRounds : undefined}
        />
      )}
    </aside>
  );
}

export function ProgressDetail({row, record, recordsLoaded, onOpenRounds}: {row: ResultProgressRow | null; record?: BattleRecordEntry | null; recordsLoaded?: boolean; onOpenRounds?: () => void}) {
  if (!row) return <article className="result-progress-detail">暂无进度记录。</article>;
  const visible = Boolean(row.trainer && row.trainer_visible);
  const image = visible ? trainerImageUrl(row.trainer, "front") || trainerImageUrl(row.trainer, "frontGif") : "";
  return (
    <article className={`result-progress-detail ${visible ? "" : "unknown"}`}>
      {image ? <img src={image} alt={trainerDisplayName(row.trainer)} /> : <i>?</i>}
      <div>
        <strong>{visible && row.trainer ? trainerDisplayName(row.trainer) : "未知训练家"}</strong>
        <span>{row.label}</span>
        <small>{progressOutcomeText(row.outcome)}</small>
        {onOpenRounds ? <button className="result-round-open" onClick={onOpenRounds}>查看回合</button> : recordsLoaded && record ? <small>这场战斗暂无回合记录</small> : null}
      </div>
    </article>
  );
}
