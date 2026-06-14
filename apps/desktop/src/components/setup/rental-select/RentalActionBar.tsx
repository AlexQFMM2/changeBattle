import "./RentalActionBar.css";

export function RentalActionBar({selectedCount, candidateCount, focusIndex, runSeed, originLabel, onStart}: {selectedCount: number; candidateCount: number; focusIndex: number; runSeed?: number; originLabel: string; onStart: () => void | Promise<void>}) {
  const ready = selectedCount === 3;
  return (
    <footer className="rental-action-bar">
      <div>
        <span>随机种子 {typeof runSeed === "number" ? runSeed : "--"}</span>
        <span>候选 {candidateCount ? focusIndex + 1 : 0}/{candidateCount}</span>
        <span>{originLabel}</span>
        <strong>已选 {selectedCount}/3</strong>
      </div>
      <button type="button" disabled={!ready} onClick={() => void onStart()}>开始游戏</button>
    </footer>
  );
}
