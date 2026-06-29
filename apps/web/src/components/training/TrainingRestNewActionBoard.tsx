import "./TrainingRestNewActionBoard.css";

export type TrainingRestNewActionEntry = {
  label: string;
  iconSrc?: string;
  iconText?: string;
  disabled?: boolean;
  action?: string;
};

export type TrainingRestNewActionBoardProps = {
  activeAction: string;
  onAction: (action: string) => void;
  entries?: TrainingRestNewActionEntry[];
};

const DEFAULT_REST_ACTION_ENTRIES: TrainingRestNewActionEntry[] = [
  {label: "图鉴", iconSrc: "/ui/book.png", action: "图鉴"},
  {label: "交换", iconSrc: "/aboutIcon/exchange.png", action: "交换"},
  {label: "遗传", iconSrc: "/aboutIcon/daycare-grandpa.png", action: "培育屋爷爷"},
  {label: "教授", iconSrc: "/aboutIcon/tutor-grandma.png", action: "教授奶奶"},
  {label: "未开放", iconText: "?", disabled: true},
  {label: "未开放", iconText: "?", disabled: true},
  {label: "未开放", iconText: "?", disabled: true},
  {label: "未开放", iconText: "?", disabled: true},
];

export function TrainingRestNewActionBoard({activeAction, onAction, entries = DEFAULT_REST_ACTION_ENTRIES}: TrainingRestNewActionBoardProps) {
  return (
    <section className="training-rest-new-left-action-panel" aria-label="休整图鉴与功能入口">
      {entries.slice(0, 8).map((entry, index) => (
        <RestPaperAction
          label={entry.label}
          iconSrc={entry.iconSrc}
          iconText={entry.iconText}
          active={activeAction === (entry.action || entry.label)}
          disabled={entry.disabled}
          onClick={entry.disabled ? undefined : () => onAction(entry.action || entry.label)}
          key={`${entry.label}-${index}`}
        />
      ))}
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
