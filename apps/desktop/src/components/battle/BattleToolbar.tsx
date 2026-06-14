import "./BattleToolbar.css";

export type BattleAnimationSpeed = 1 | 2;

export function BattleToolbar({
  speed,
  onSpeedChange,
  onAiHint,
  aiHintLoading,
  aiHintDisabled,
  aiAutoplayEnabled,
  aiAutoplayPending,
  aiAutoplayDisabled,
  onAiAutoplayToggle,
}: {
  speed: BattleAnimationSpeed;
  onSpeedChange?: (speed: BattleAnimationSpeed) => void;
  onAiHint?: () => void;
  aiHintLoading?: boolean;
  aiHintDisabled?: boolean;
  aiAutoplayEnabled?: boolean;
  aiAutoplayPending?: boolean;
  aiAutoplayDisabled?: boolean;
  onAiAutoplayToggle?: () => void;
}) {
  return (
    <div className="battle-toolbar" aria-label="战斗辅助工具">
      <button className="battle-toolbar-button battle-ai-tool" type="button" title="AI 提示" disabled={aiHintDisabled || aiHintLoading} onClick={onAiHint}>{aiHintLoading ? "计算中" : "AI提示"}</button>
      <div className="battle-speed-control" role="group" aria-label="战斗倍速">
        {[1, 2].map(value => {
          const nextSpeed = value as BattleAnimationSpeed;
          return (
            <button
              className={speed === nextSpeed ? "selected" : ""}
              type="button"
              aria-pressed={speed === nextSpeed}
              onClick={() => onSpeedChange?.(nextSpeed)}
              key={nextSpeed}
            >
              {nextSpeed}x
            </button>
          );
        })}
      </div>
      <button className={`battle-toolbar-button battle-ai-tool ${aiAutoplayEnabled ? "selected" : ""}`} type="button" title={aiAutoplayEnabled ? "关闭 AI 代打" : "开启 AI 代打"} aria-pressed={Boolean(aiAutoplayEnabled)} disabled={aiAutoplayDisabled} onClick={onAiAutoplayToggle}>{aiAutoplayPending ? "代打中" : "AI代打"}</button>
    </div>
  );
}
