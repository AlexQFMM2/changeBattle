import type {ReactNode, RefObject} from "react";
import "./BattleCommandPanel.css";

export function BattleCommandPanel({dialogue, panelMode, controlsDisabled, shownEvents, currentEventText, logRef, actionContent}: {dialogue?: ReactNode; panelMode: string; controlsDisabled?: boolean; shownEvents: string[]; currentEventText?: string; logRef: RefObject<HTMLDivElement | null>; actionContent: ReactNode}) {
  return (
    <section className={`battle-bottom ${dialogue ? "dialogue-bottom-active" : ""} ${panelMode === "moveMenu" && !dialogue ? "move-bottom-active" : ""}`}>
      {dialogue ? (
        dialogue
      ) : (
        <>
          <div className="battle-log" ref={logRef}><strong>上一回合</strong>{shownEvents.map((event, index) => <p className={event === currentEventText ? "current-event" : ""} key={`${event}-${index}`}>{event}</p>)}</div>
          <div className={`battle-action-panel ${panelMode === "moveMenu" ? "move-action-panel" : ""} ${controlsDisabled ? "battle-controls-disabled" : ""}`}>
            {actionContent}
          </div>
        </>
      )}
    </section>
  );
}
