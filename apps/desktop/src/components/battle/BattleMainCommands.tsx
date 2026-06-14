import type {AppStatus, BattleState} from "@changebattle/shared";
import "./BattleMainCommands.css";

export function BattleMainCommands({battle, forceSwitch, waiting, disabled, setMode, onBag, onDialgaGrace, onForfeit}: {battle: BattleState; forceSwitch: boolean; waiting?: boolean; disabled?: boolean; setMode: (mode: AppStatus) => void; onBag: () => void; onDialgaGrace: () => void; onForfeit: () => void}) {
  const graceTarget = battle.dialga_grace_target_turn ? `恢复至第 ${battle.dialga_grace_target_turn} 回合` : "等待回合记录";
  if (waiting) {
    return (
      <div className="command-grid battle-command-grid">
        <button disabled>战斗继续中</button>
        <button disabled>宝可梦</button>
        <button disabled>背包</button>
        <button disabled>恩典</button>
        <button className="danger-button" disabled={disabled} onClick={onForfeit}>认输</button>
      </div>
    );
  }
  return (
    <div className={`command-grid battle-command-grid ${battle.dialga_grace_available || battle.battle_event_statuses?.some(status => status.id === "dialga_grace") ? "has-special-command" : ""}`}>
      {forceSwitch ? <button disabled={disabled} onClick={() => setMode("teamMenu")}>换人</button> : <button disabled={disabled} onClick={() => setMode("moveMenu")}>战斗</button>}
      <button disabled={disabled} onClick={() => setMode("teamMenu")}>宝可梦</button>
      <button disabled={disabled || forceSwitch} onClick={onBag}>背包</button>
      {battle.battle_event_statuses?.some(status => status.id === "dialga_grace") ? <button className="special-command-button" title={graceTarget} disabled={disabled || !battle.dialga_grace_available} onClick={onDialgaGrace}>恩典</button> : null}
      <button className="danger-button" disabled={disabled} onClick={onForfeit}>认输</button>
    </div>
  );
}
