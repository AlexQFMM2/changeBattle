import type {TrainingLogEntry} from "./battleTrainingModel";
import "./BattleTrainingLogDrawer.css";

export function BattleTrainingLogDrawer({logs, open, compact = false, onToggle, onExport}: {
  logs: TrainingLogEntry[];
  open: boolean;
  compact?: boolean;
  onToggle: () => void;
  onExport?: () => void;
}) {
  return (
    <aside className={`battle-training-log-drawer ${compact ? "compact" : ""} ${open ? "open" : ""}`}>
      <header>
        <strong>记录</strong>
        <span>{logs.length}</span>
        {onExport ? <button type="button" onClick={onExport}>导出</button> : null}
        <button type="button" onClick={onToggle}>{open ? "收起" : "展开"}</button>
      </header>
      {open ? (
        <div className="battle-training-log-list">
          {logs.length ? logs.slice(0, compact ? 5 : 8).map(log => (
            <details key={log.id}>
              <summary>{log.kind}{log.choice ? ` · ${log.choice}` : ""}{typeof log.elapsedMs === "number" ? ` · ${log.elapsedMs}ms` : ""}</summary>
              <pre>{JSON.stringify(log, null, 2)}</pre>
            </details>
          )) : <p>启动战斗或点击技能后会记录 request / timeline。</p>}
        </div>
      ) : null}
    </aside>
  );
}
