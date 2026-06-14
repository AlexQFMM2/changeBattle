import {useState} from "react";
import type {ReactElement} from "react";
import type {RestState} from "@changebattle/shared";
import type {RestActionHandler} from "./restActionTypes";
import "./DoctorEventPanel.css";

export function DoctorEventPanel({rest: _rest, onClose, onAction, embedded = false}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const [busy, setBusy] = useState<"status" | "hp" | null>(null);

  async function choose(branch: "status" | "hp") {
    if (busy) return;
    setBusy(branch);
    try {
      await onAction({type: "choose_doctor_treatment", branch}, branch === "status" ? "哥哥完成治疗" : "弟弟完成治疗");
    } finally {
      setBusy(null);
    }
  }

  const content = (
    <section className="doctor-event-panel" role="dialog" aria-label="蹩脚医生兄弟">
      <header>
        <div>
          <h2>蹩脚医生兄弟</h2>
          <p>两兄弟手艺都不太稳定，但今天你必须挑一个。</p>
        </div>
        <button type="button" onClick={onClose}>返回</button>
      </header>
      <div className="doctor-event-options">
        <button disabled={Boolean(busy)} type="button" onClick={() => void choose("status")}>
          <strong>哥哥：诊断异常</strong>
          <span>全队解除异常并回满 PP，未濒死宝可梦 HP 压到一半。</span>
        </button>
        <button disabled={Boolean(busy)} type="button" onClick={() => void choose("hp")}>
          <strong>弟弟：强行补血</strong>
          <span>全队回满 HP，濒死复活到一半，并随机附加可治愈异常。</span>
        </button>
      </div>
    </section>
  );

  return <EmbeddedOrModal embedded={embedded}>{content}</EmbeddedOrModal>;
}

function EmbeddedOrModal({embedded, children}: {embedded?: boolean; children: ReactElement}) {
  return embedded ? children : <div className="modal-layer">{children}</div>;
}
