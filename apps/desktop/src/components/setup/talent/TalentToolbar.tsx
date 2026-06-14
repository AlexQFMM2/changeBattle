import "./TalentToolbar.css";

export function TalentToolbar({unlockedCount, bp, onZoomOut, onActualSize, onZoomIn, onReset, onBack, longTitle = false}: {unlockedCount: number; bp: number; onZoomOut: () => void; onActualSize: () => void; onZoomIn: () => void; onReset: () => void; onBack: () => void; longTitle?: boolean}) {
  return (
    <div className="talent-toolbar">
      <div className="talent-toolbar-title">
        <strong>{longTitle ? "训练家星图长标题压力测试" : "训练家星图"}</strong>
        <span>点亮 {unlockedCount} · BP {bp}</span>
      </div>
      <div className="talent-toolbar-zoom" aria-label="星图缩放">
        <button onClick={onZoomOut} aria-label="缩小星图">-</button>
        <button onClick={onActualSize} aria-label="重置为 1:1">1:1</button>
        <button onClick={onZoomIn} aria-label="放大星图">+</button>
      </div>
      <div className="talent-toolbar-nav">
        <button onClick={onReset}>重置</button>
        <button onClick={onBack}>返回</button>
      </div>
    </div>
  );
}
