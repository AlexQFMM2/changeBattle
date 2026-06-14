import type {BattleRecordEntry} from "@changebattle/shared";
import {HistoryPokemonSprite} from "./HistoryPokemonSprite";
import {formatRecordDate, outcomeText, recordOutcome, recordPokemon, recordProgressCount, recordSubtitle, recordTeamCount, recordTitle, recordTotalBattles} from "./historyUtils";
import "./RunRecordList.css";

export type RunRecordListProps = {
  records: BattleRecordEntry[];
  activeRecordId?: string | null;
  message?: string;
  onPreviewRecord?: (record: BattleRecordEntry) => void;
  onOpenRecord?: (record: BattleRecordEntry) => void;
};

export function RunRecordList({records, activeRecordId, message, onPreviewRecord, onOpenRecord}: RunRecordListProps) {
  if (!records.length) {
    return (
      <div className="run-record-list">
        <p className="run-record-list-message">{message || "暂无结算记录。"}</p>
      </div>
    );
  }
  return (
    <div className="run-record-list">
      {records.map(record => (
        <RunRecordRow
          active={record.id === activeRecordId}
          key={record.id}
          record={record}
          onOpen={() => onOpenRecord?.(record)}
          onPreview={() => onPreviewRecord?.(record)}
        />
      ))}
    </div>
  );
}

function RunRecordRow({record, active, onOpen, onPreview}: {record: BattleRecordEntry; active?: boolean; onOpen: () => void; onPreview: () => void}) {
  const outcome = recordOutcome(record);
  const pokemon = recordPokemon(record, 4);
  const progressCount = recordProgressCount(record);
  const totalBattles = recordTotalBattles(record);
  const teamCount = recordTeamCount(record);
  return (
    <button
      className={`run-record-row ${outcome} ${active ? "active" : ""}`}
      onClick={onOpen}
      onFocus={onPreview}
      onMouseEnter={onPreview}
      type="button"
    >
      <div className="run-record-row-main">
        <span>{outcomeText(outcome)}挑战</span>
        <strong>{recordTitle(record)}</strong>
        <small>{formatRecordDate(record.created_at)}　{recordSubtitle(record)}</small>
      </div>
      <div className="run-record-row-team" aria-label="本局宝可梦">
        {pokemon.map((entry, index) => (
          <HistoryPokemonSprite pokemon={entry} key={`${record.id}-${entry.run_member_id || entry.species_id || index}`} />
        ))}
      </div>
      <div className="run-record-row-meta">
        <span>整局</span>
        <small>{progressCount ? `${progressCount}${totalBattles ? `/${totalBattles}` : ""} 场` : "结算"}{teamCount ? ` · ${teamCount} 只` : ""}</small>
      </div>
    </button>
  );
}
