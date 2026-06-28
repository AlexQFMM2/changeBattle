import "./TrainingRestSideBoard.css";

export type TrainingRestSideBoardSide = "left" | "right";

export type TrainingRestSideBoardAction = {
  label: string;
  primary?: boolean;
  danger?: boolean;
};

export function TrainingRestSideBoard({
  side,
  actions,
  activeAction,
  onAction,
}: {
  side: TrainingRestSideBoardSide;
  actions: TrainingRestSideBoardAction[];
  activeAction: string;
  onAction: (action: string) => void;
}) {
  return (
    <nav className={`training-rest-new-region training-rest-new-side-board ${side}`} aria-label={side === "left" ? "左侧休整操作" : "右侧休整操作"}>
      <div>
        {actions.map(action => (
          <button
            className={`${activeAction === action.label ? "active" : ""} ${action.primary ? "primary" : ""} ${action.danger ? "danger" : ""}`}
            type="button"
            onClick={() => onAction(action.label)}
            key={action.label}
          >
            {action.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
