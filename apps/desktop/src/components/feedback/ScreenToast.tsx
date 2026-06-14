import {useEffect} from "react";
import type {CSSProperties} from "react";
import {createPortal} from "react-dom";
import "./ScreenToast.css";

export function ScreenToast({message, durationMs = 1000, tone = "normal", inline = false, style, onDone}: {message: string; durationMs?: number; tone?: "normal" | "danger"; inline?: boolean; style?: CSSProperties; onDone?: () => void}) {
  useEffect(() => {
    if (!onDone || inline) return;
    const timer = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, inline, onDone]);

  const toast = (
    <div className={`screen-toast flow ${tone === "danger" ? "danger" : ""}`} style={{"--message-duration": `${durationMs}ms`, ...style} as CSSProperties} role="status" aria-live="polite">
      {message}
    </div>
  );

  if (inline) return toast;
  return createPortal(
    toast,
    document.body,
  );
}
