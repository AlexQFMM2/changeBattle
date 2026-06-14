import {useState} from "react";
import type {DesktopGameState} from "@changebattle/shared";
import {motion} from "motion/react";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import type {RestActionHandler} from "./restActionTypes";
import "./RestEventPrompt.css";

type RestState = NonNullable<DesktopGameState["rest"]>;

export function RestEventPrompt({rest, onAction}: {rest: RestState; onAction: RestActionHandler}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const options = rest.rest_event?.options || [];

  async function choose(eventId: string, eventName: string) {
    if (busyId) return;
    setBusyId(eventId);
    try {
      await Promise.resolve(onAction({type: "choose_rest_event", eventId}, `奇遇：${eventName}`));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PokopiaModal className="rest-event-modal" closeDisabled labelledBy="rest-event-title" onClose={() => undefined}>
      {() => (
        <motion.section className="rest-event-content" variants={pokopiaItemVariants}>
          <header>
            <div>
              <h2 id="rest-event-title">休整奇遇</h2>
              <p>本次休整开始前，必须选择一张事件卡。</p>
            </div>
          </header>
          <div className="rest-event-card-grid">
            {options.map(option => (
              <button className={`rest-event-card tone-${option.tone || "safe"}`} disabled={Boolean(busyId)} onClick={() => void choose(option.id, option.name)} key={`rest-event-${option.id}`}>
                <strong>{option.name}</strong>
                <div className="rest-event-card-body">
                  <section>
                    <b>介绍：</b>
                    <p>{option.intro || option.desc}</p>
                  </section>
                  <section>
                    <b>效果：</b>
                    <ul>
                      {(option.effects?.length ? option.effects : [option.desc, option.detail].filter((value): value is string => Boolean(value))).map((effect, index) => <li key={`${option.id}-effect-${index}`}>{effect}</li>)}
                    </ul>
                  </section>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      )}
    </PokopiaModal>
  );
}
