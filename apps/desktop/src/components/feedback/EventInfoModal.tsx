import {useEffect} from "react";
import type {RestEventStatusView} from "@changebattle/shared";

export function EventInfoModal({status, context, onClose}: {status: RestEventStatusView; context?: string; onClose: () => void}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-layer event-info-layer" role="presentation" onClick={event => { event.stopPropagation(); onClose(); }}>
      <section className={`event-info-modal tone-${status.tone || "safe"}`} role="dialog" aria-modal="true" aria-labelledby="event-info-title" onClick={event => event.stopPropagation()}>
        <header>
          <span>{context || "事件说明"}</span>
          <button onClick={onClose}>关闭</button>
        </header>
        <h2 id="event-info-title">{status.label}</h2>
        <p>{status.detail || "这个事件已经生效，当前没有额外说明。"}</p>
      </section>
    </div>
  );
}
