import "./TrainingRestBoardTitle.css";

export function TrainingRestBoardTitle({side, children}: {side: "left" | "right"; children: string}) {
  return <span className={`training-rest-new-region training-rest-new-board-title ${side}`}>{children}</span>;
}
