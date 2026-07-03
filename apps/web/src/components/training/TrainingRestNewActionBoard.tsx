import {REST_CENTER_PAPER_ACTIONS_V4} from "@changebattle-v2/api";
import {assetUrl} from "../../lib/assetUrl";
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

const DEFAULT_REST_ACTION_ENTRIES: TrainingRestNewActionEntry[] = REST_CENTER_PAPER_ACTIONS_V4.map(entry => ({
  label: entry.label,
  iconSrc: entry.id === "training-ground" ? "aboutIcon/train.png" : entry.iconSrc,
  iconText: entry.iconText,
  disabled: entry.disabled,
  action: entry.action,
}));

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
  const resolvedIconSrc = assetUrl(iconSrc);
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick} disabled={disabled}>
      {resolvedIconSrc ? <img src={resolvedIconSrc} alt="" draggable={false} /> : <span>{iconText || "?"}</span>}
      <strong>{label}</strong>
    </button>
  );
}
