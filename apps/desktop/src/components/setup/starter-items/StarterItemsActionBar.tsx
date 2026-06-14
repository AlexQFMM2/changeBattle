import "./StarterItemsActionBar.css";

export function StarterItemsActionBar({summary, starting = false, onBack, onStart}: {summary: string; starting?: boolean; onBack: () => void | Promise<void>; onStart: () => void | Promise<void>}) {
  return (
    <footer className="starter-items-action-bar">
      <span>{summary}</span>
      <div className="starter-items-action-buttons">
        <button onClick={() => void onBack()} type="button">返回</button>
        <button disabled={starting} onClick={() => void onStart()} type="button">{starting ? "准备中" : "开始游戏"}</button>
      </div>
    </footer>
  );
}
