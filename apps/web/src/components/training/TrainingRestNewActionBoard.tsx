import "./TrainingRestNewActionBoard.css";

export type TrainingRestNewActionBoardProps = {
  activeAction: string;
  onAction: (action: string) => void;
};

export function TrainingRestNewActionBoard({activeAction, onAction}: TrainingRestNewActionBoardProps) {
  const active = activeAction === "图鉴";
  return (
    <section className="training-rest-new-left-action-panel" aria-label="休整图鉴与功能入口">
      <RestPaperAction label="图鉴" iconSrc="/ui/book.png" active={active} onClick={() => onAction("图鉴")} />
      {Array.from({length: 7}, (_, index) => <RestPaperAction label="未开放" iconText="?" disabled key={index} />)}
    </section>
  );
}

function RestPaperAction({
  label,
  iconSrc,
  iconText,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  iconSrc?: string;
  iconText?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick} disabled={disabled}>
      {iconSrc ? <img src={iconSrc} alt="" draggable={false} /> : <span>{iconText || "?"}</span>}
      <strong>{label}</strong>
    </button>
  );
}
