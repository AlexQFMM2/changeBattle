import {useEffect, type CSSProperties} from "react";
import "./VaultUseNotice.css";

export type VaultUseNoticeTone = "normal" | "danger";

export type VaultUseNoticeState = {
  id: number;
  message: string;
  tone?: VaultUseNoticeTone;
};

export function VaultUseNotice({message, tone = "normal", durationMs = 1800, onDone}: {
  message: string;
  tone?: VaultUseNoticeTone;
  durationMs?: number;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!onDone) return;
    const timeout = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timeout);
  }, [durationMs, onDone]);

  return (
    <div
      className={`vault-use-notice ${tone === "danger" ? "danger" : ""}`}
      role="status"
      style={{"--vault-use-notice-duration": `${durationMs}ms`} as CSSProperties}
    >
      {message}
    </div>
  );
}
