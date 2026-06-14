import type {BattleRecordEntry} from "@changebattle/shared";
import {HistoryPokemonSprite} from "./HistoryPokemonSprite";
import {formatRecordDate, outcomeText, recordOutcome, recordPokemon, recordProgressCount, recordSubtitle, recordTeamCount, recordTitle, recordTotalBattles} from "./historyUtils";
import "./RunRecordDetailPanel.css";

export function RunRecordDetailPanel({record}: {record: BattleRecordEntry | null}) {
  if (!record) {
    return (
      <aside className="run-record-detail-panel empty">
        <span>SUMMARY</span>
        <strong>暂无记录</strong>
        <p>完成一整局挑战后，结算记录会显示在这里。</p>
      </aside>
    );
  }
  const outcome = recordOutcome(record);
  const pokemon = recordPokemon(record, 6);
  const progressCount = recordProgressCount(record);
  const totalBattles = recordTotalBattles(record);
  const teamCount = recordTeamCount(record);
  const summary = record.result_summary;
  const bpRow = summary?.bp_rows?.[0] || summary?.rows?.find(row => row.value.includes("BP"));
  const coinRow = summary?.coin_rows?.[0] || summary?.rows?.find(row => row.value.includes("金币"));
  return (
    <aside className={`run-record-detail-panel ${outcome}`}>
      <header>
        <span>{outcomeText(outcome)}挑战</span>
        <strong>{recordTitle(record)}</strong>
        <p>{recordSubtitle(record)}</p>
      </header>
      <dl className="run-record-detail-stats">
        <div>
          <dt>时间</dt>
          <dd>{formatRecordDate(record.created_at)}</dd>
        </div>
        <div>
          <dt>进度</dt>
          <dd>{progressCount ? `${progressCount}${totalBattles ? `/${totalBattles}` : ""}` : "--"}</dd>
        </div>
        <div>
          <dt>队伍</dt>
          <dd>{teamCount || "--"} 只</dd>
        </div>
      </dl>
      <div className="run-record-detail-rewards">
        <span>{bpRow ? `${bpRow.label}: ${bpRow.value}` : "BP: --"}</span>
        <span>{coinRow ? `${coinRow.label}: ${coinRow.value}` : "金币: --"}</span>
      </div>
      <div className="run-record-detail-team" aria-label="本局队伍">
        {pokemon.length ? pokemon.map((entry, index) => (
          <HistoryPokemonSprite pokemon={entry} key={`${record.id}-detail-${entry.run_member_id || entry.species_id || index}`} />
        )) : <small>无队伍记录</small>}
      </div>
      <small className="run-record-detail-hint">点击左侧记录查看完整结算</small>
    </aside>
  );
}
