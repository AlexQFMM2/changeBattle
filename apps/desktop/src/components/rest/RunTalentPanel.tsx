import type {ReactElement} from "react";
import type {RestState, TalentView} from "@changebattle/shared";
import {talentShortText} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import {RunTalentActionPanel} from "./RunTalentActionPanel";
import "./RunTalentPanel.css";

export function RunTalentPanel({talent, rest, onClose, onAction, embedded = false}: {talent: TalentView; rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="run-talent-panel" role="dialog" aria-label={talent.name}>
        <header className="run-talent-panel-header">
          <div>
            <h2>{talent.name}</h2>
            <p>{talentShortText(talent)}</p>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <div className="run-talent-panel-body">
          <RunTalentActionPanel talent={talent} rest={rest} onAction={onAction} />
        </div>
      </section>
    </EmbeddedOrModal>
  );
}

function EmbeddedOrModal({embedded, children}: {embedded?: boolean; children: ReactElement}) {
  return embedded ? children : <div className="modal-layer">{children}</div>;
}
