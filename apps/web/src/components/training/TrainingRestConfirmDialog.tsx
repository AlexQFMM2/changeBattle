import "./TrainingRestConfirmDialog.css";

export function TrainingRestConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "取消",
  danger = false,
  onCancel,
  onConfirm,
  ariaLabel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
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
          <button type="button" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={danger ? "danger" : ""} onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}
