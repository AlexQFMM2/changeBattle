import "./TrainingRestConfirmDialog.css";

export function TrainingRestConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
  ariaLabel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="training-rest-new-confirm" role="dialog" aria-label={ariaLabel}>
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
        <footer>
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" className={danger ? "danger" : ""} onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}
