import {useEffect, type CSSProperties} from "react";
import "./TrainingRestToast.css";

export type TrainingRestToastTone = "normal" | "danger";

export type TrainingRestToastProps = {
  message: string;
  tone?: TrainingRestToastTone;
  durationMs?: number;
  onDone?: () => void;
};

export function TrainingRestToast({message, tone = "normal", durationMs = 1800, onDone}: TrainingRestToastProps) {
  useEffect(() => {
    if (!onDone) return;
    const timeout = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timeout);
  }, [durationMs, onDone]);

  return (
    <div
      className={`training-rest-toast ${tone === "danger" ? "danger" : ""}`}
      role="status"
      style={{"--training-rest-toast-duration": `${durationMs}ms`} as CSSProperties}
    >
      {message}
    </div>
  );
}
