import type {BattleRecordEntry, BattleTurnRecord} from "@changebattle/shared";
import {aliveText} from "./resultUtils";
import {TurnDetailPanel} from "./TurnDetailPanel";
import "./BattleRoundList.css";

export function BattleRoundList({record, selectedTurn, onSelectTurn, onBack}: {record: BattleRecordEntry; selectedTurn: BattleTurnRecord | null; onSelectTurn: (turn: BattleTurnRecord) => void; onBack: () => void}) {
  const turns = record.turn_records || [];
  return (
    <section className="result-round-panel">
      <header>
        <div>
          <strong>第 {record.battle_no} 场回合记录</strong>
          <span>{turns.length} 个节点</span>
        </div>
        <button onClick={onBack}>返回</button>
      </header>
      <div className="result-round-list">
        {turns.map(turn => (
          <button className={selectedTurn?.id === turn.id ? "selected" : ""} onClick={() => onSelectTurn(turn)} key={turn.id}>
            <i>{turn.turn || "开局"}</i>
            <span>{turn.summary}</span>
            <small>{aliveText(turn.end_state.player_team)} / {aliveText(turn.end_state.enemy_team)}</small>
          </button>
        ))}
      </div>
      <TurnDetailPanel turn={selectedTurn} />
    </section>
  );
}
