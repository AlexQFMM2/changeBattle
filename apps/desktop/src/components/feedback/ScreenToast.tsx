import {useEffect} from "react";
import type {CSSProperties} from "react";
import {createPortal} from "react-dom";

export function ScreenToast({message, durationMs = 1000, tone = "normal", onDone}: {message: string; durationMs?: number; tone?: "normal" | "danger"; onDone?: () => void}) {
  useEffect(() => {
    if (!onDone) return;
    const timer = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDone]);

  return createPortal(
    <div className={`screen-toast flow ${tone === "danger" ? "danger" : ""}`} style={{"--message-duration": `${durationMs}ms`} as CSSProperties} role="status" aria-live="polite">
      {message}
    </div>,
    document.body,
  );
}
