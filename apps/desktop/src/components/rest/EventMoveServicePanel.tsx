import {useEffect, useMemo, useState} from "react";
import type {PricedMove, RestState} from "@changebattle/shared";
import {motion} from "motion/react";
import {MoveReplacePanel} from "../bag/MoveReplacePanel";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {toId} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import {EventMoveCardGrid} from "./EventMoveCardGrid";
import {EventMoveServiceTeamPicker} from "./EventMoveServiceTeamPicker";
import "./EventMoveServicePanel.css";

type EventMoveServicePanelProps = {
  rest: RestState;
  service: "tutor" | "egg";
  embedded?: boolean;
  onClose: () => void;
  onAction: RestActionHandler;
  learnableMoves?: (slot: number) => Promise<PricedMove[]>;
  previewInitialStep?: "select" | "replace";
  previewMoves?: PricedMove[];
  previewLoading?: boolean;
};

export function EventMoveServicePanel({rest, service, embedded = false, onClose, onAction, learnableMoves, previewInitialStep = "select", previewMoves, previewLoading = false}: EventMoveServicePanelProps) {
  const [slot, setSlot] = useState(0);
  const [moves, setMoves] = useState<PricedMove[]>(previewMoves || []);
  const [moveId, setMoveId] = useState("");
  const [loading, setLoading] = useState(previewLoading);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"select" | "replace">(previewInitialStep);
  const [selectedMoveSlot, setSelectedMoveSlot] = useState<number | null>(null);
  const pokemon = rest.player_display[slot] || rest.player_display[0];
  const state = rest.player_state?.[slot];
  const source = service === "egg" ? "egg" : "tutor";
  const title = service === "egg" ? "培育屋爷爷" : "讲师老奶奶";
  const serviceLabel = service === "egg" ? "遗传" : "教授";
  const serviceCost = 100;
  const selectedMove = useMemo(() => moves.find(move => toId(move.id || move.name) === moveId) || moves[0] || null, [moveId, moves]);
  const disabled = busy || loading || !selectedMove || Number(rest.coins || 0) < serviceCost;

  useEffect(() => {
    if (previewMoves) {
      setMoves(previewMoves);
      setMoveId(toId(previewMoves[0]?.id || previewMoves[0]?.name || ""));
      setLoading(previewLoading);
      return;
    }
    let cancelled = false;
    const loader = learnableMoves || ((targetSlot: number) => window.changeBattle?.learnableMoves(targetSlot) || Promise.resolve([]));
    setLoading(true);
    setMoves([]);
    setMoveId("");
    setStep("select");
    setSelectedMoveSlot(null);
    void loader(slot).then(list => {
      if (cancelled) return;
      const known = new Set((pokemon?.moves || []).map(move => toId(move.id || move.name)));
      const filtered = list.filter(move => (move.learn_sources || []).includes(source) && !known.has(toId(move.id || move.name)));
      setMoves(filtered);
      setMoveId(toId(filtered[0]?.id || filtered[0]?.name || ""));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [learnableMoves, pokemon, previewLoading, previewMoves, slot, source]);

  function chooseSlot(nextSlot: number) {
    setSlot(nextSlot);
    setStep("select");
    setSelectedMoveSlot(null);
  }

  function selectMove(nextMoveId: string) {
    setMoveId(nextMoveId);
    setStep("select");
    setSelectedMoveSlot(null);
  }

  function closeReplaceModal() {
    setStep("select");
    setSelectedMoveSlot(null);
  }

  async function confirmReplace() {
    if (busy || !selectedMove || selectedMoveSlot === null) return;
    setBusy(true);
    try {
      const result = await onAction({type: "event_learn_move", service, slot, moveSlot: selectedMoveSlot, moveId: toId(selectedMove.id || selectedMove.name)}, "事件技能已学习");
      if (result !== false) {
        setStep("select");
        setSelectedMoveSlot(null);
        if (!previewMoves) {
          const loader = learnableMoves || ((targetSlot: number) => window.changeBattle?.learnableMoves(targetSlot) || Promise.resolve([]));
          const list = await loader(slot);
          const known = new Set((pokemon?.moves || []).map(move => toId(move.id || move.name)));
          const filtered = list.filter(move => (move.learn_sources || []).includes(source) && !known.has(toId(move.id || move.name)));
          setMoves(filtered);
          setMoveId(toId(filtered[0]?.id || filtered[0]?.name || ""));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <>
      <section className="event-move-service-panel">
        <header>
          <div>
            <h2>{title}</h2>
            <p>每次花 {serviceCost} 金币学习 1 个{serviceLabel}招式，本次休整内不限次数。</p>
          </div>
          <div className="event-move-service-actions">
            <button disabled={disabled} type="button" onClick={() => { setStep("replace"); setSelectedMoveSlot(null); }}>{busy ? "学习中" : "确认学习"}</button>
            <button type="button" onClick={onClose}>返回</button>
          </div>
        </header>
        <div className="event-move-service-layout">
          <EventMoveServiceTeamPicker team={rest.player_display} selectedSlot={slot} onSelectSlot={chooseSlot} />
          <main>
            <EventMoveCardGrid moves={moves} selectedMoveId={moveId} loading={loading} serviceLabel={serviceLabel} onSelectMove={selectMove} />
          </main>
        </div>
      </section>
      {step === "replace" && pokemon && selectedMove ? (
        <PokopiaModal className="event-move-replace-modal" labelledBy="event-move-replace-title" onClose={closeReplaceModal}>
          {requestClose => (
            <motion.section className="event-move-replace-content" variants={pokopiaItemVariants}>
              <header>
                <div>
                  <h2 id="event-move-replace-title">确认学习</h2>
                  <p>{pokemon.species_zh || pokemon.name} 准备学习 {selectedMove.name_zh || selectedMove.name}</p>
                </div>
                <button type="button" onClick={() => requestClose()}>关闭</button>
              </header>
              <MoveReplacePanel pokemon={pokemon} state={state} newMove={selectedMove} selectedMoveSlot={selectedMoveSlot} busy={busy} onSelectMoveSlot={setSelectedMoveSlot} onConfirm={() => void confirmReplace()} onCancel={() => requestClose()} />
            </motion.section>
          )}
        </PokopiaModal>
      ) : null}
    </>
  );

  return embedded ? content : <div className="modal-layer">{content}</div>;
}
