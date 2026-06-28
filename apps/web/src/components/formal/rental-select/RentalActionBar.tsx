import "./RentalActionBar.css";

export function RentalActionBar({selectedCount, candidateCount, focusIndex, runSeed, originLabel, requiredCount = 3, showOriginLabel = true, onStart, onRandomSelect, onClearSelected}: {selectedCount: number; candidateCount: number; focusIndex: number; runSeed?: number; originLabel: string; requiredCount?: number; showOriginLabel?: boolean; onStart: () => void | Promise<void>; onRandomSelect?: () => void; onClearSelected?: () => void}) {
  const ready = selectedCount === requiredCount;
  return (
    <footer className="rental-action-bar">
      <div>
        <span>随机种子 {typeof runSeed === "number" ? runSeed : "--"}</span>
        <span>候选 {candidateCount ? focusIndex + 1 : 0}/{candidateCount}</span>
        {showOriginLabel ? <span>{originLabel}</span> : null}
        <strong>已选 {selectedCount}/{requiredCount}</strong>
      </div>
      <div className="rental-action-bar-tools">
        {onRandomSelect ? <button type="button" onClick={onRandomSelect}>随机选择</button> : null}
        {onClearSelected ? <button type="button" onClick={onClearSelected}>清空</button> : null}
      </div>
      <button type="button" disabled={!ready} onClick={() => void onStart()}>开始游戏</button>
    </footer>
  );
}
