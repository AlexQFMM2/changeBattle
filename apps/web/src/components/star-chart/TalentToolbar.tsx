import "./TalentToolbar.css";

export function TalentToolbar({unlockedCount, bp, statusText = "", busy = false, onZoomOut, onActualSize, onZoomIn, onClear, onBack, longTitle = false}: {unlockedCount: number; bp: number; statusText?: string; busy?: boolean; onZoomOut: () => void; onActualSize: () => void; onZoomIn: () => void; onClear: () => void; onBack: () => void; longTitle?: boolean}) {
  return (
    <div className="talent-toolbar">
      <div className="talent-toolbar-title">
        <strong>{longTitle ? "训练家星图长标题压力测试" : "训练家星图"}</strong>
        <span>点亮 {unlockedCount} · BP {bp}</span>
        {statusText ? <span>{statusText}</span> : null}
      </div>
      <div className="talent-toolbar-zoom" aria-label="星图缩放">
        <button onClick={onZoomOut} disabled={busy} aria-label="缩小星图">-</button>
        <button onClick={onActualSize} disabled={busy} aria-label="重置视角">1:1</button>
        <button onClick={onZoomIn} disabled={busy} aria-label="放大星图">+</button>
      </div>
      <div className="talent-toolbar-nav">
        <button onClick={onClear} disabled={busy}>清空</button>
        <button onClick={onBack} disabled={busy}>{busy ? "保存中" : "返回"}</button>
      </div>
    </div>
  );
}
