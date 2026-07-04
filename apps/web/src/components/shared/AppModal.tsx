import type {ReactNode} from "react";
import {PokopiaModal} from "../motion/PokopiaModal";
import "./AppModal.css";

export function AppModal({
  children,
  className = "",
  labelledBy,
  onClose,
}: {
  children: ReactNode | ((requestClose: (force?: boolean) => void) => ReactNode);
  className?: string;
  labelledBy?: string;
  onClose: () => void;
}) {
  return (
    <PokopiaModal className={`app-modal ${className}`.trim()} labelledBy={labelledBy} onClose={onClose}>
      {children}
    </PokopiaModal>
  );
}

export function AppConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = "取消",
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AppModal className="app-confirm-modal" labelledBy="app-confirm-modal-title" onClose={onCancel}>
      {requestClose => (
        <section className="app-confirm-modal-content" aria-label={title}>
          <small>确认操作</small>
          <h2 id="app-confirm-modal-title">{title}</h2>
          <p>{message}</p>
          <footer>
            <button type="button" onClick={() => requestClose(true)}>{cancelLabel}</button>
            <button
              className={danger ? "danger" : ""}
              type="button"
              onClick={() => {
                requestClose(true);
                void onConfirm();
              }}
            >
              {confirmLabel}
            </button>
          </footer>
        </section>
      )}
    </AppModal>
  );
}
