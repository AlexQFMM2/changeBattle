import {AnimatePresence, motion} from "motion/react";
import {useEffect, useMemo, useState} from "react";
import {ImageWithFallback} from "./ImageWithFallback";
import "./GameEvolutionModal.css";

export type GameEvolutionModalPhase = "intro" | "evolving" | "result" | "details";

export type GameEvolutionModalTarget = {
  toSpeciesId: string;
  toName: string;
  toSpriteUrl?: string;
  friendshipRequirement?: number;
  statChanges?: Array<{label: string; before: string; after: string}>;
};

export function GameEvolutionModal({open, fromName, displayName, fromSpriteUrl, itemName, targets, initialPhase, onCancel, onConfirm}: {
  open: boolean;
  fromName: string;
  displayName: string;
  fromSpriteUrl?: string;
  itemName?: string;
  targets: GameEvolutionModalTarget[];
  initialPhase?: GameEvolutionModalPhase;
  onCancel: () => void;
  onConfirm: (toSpeciesId: string) => void;
}) {
  const targetsKey = targets.map(target => target.toSpeciesId).join("|");
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(targets[0]?.toSpeciesId || "");
  const [phase, setPhase] = useState<GameEvolutionModalPhase>(initialPhase || "intro");
  const selectedTarget = useMemo(
    () => targets.find(target => target.toSpeciesId === selectedSpeciesId) || targets[0],
    [targets, selectedSpeciesId],
  );

  useEffect(() => {
    setSelectedSpeciesId(targets[0]?.toSpeciesId || "");
    setPhase(initialPhase || "intro");
  }, [open, initialPhase, targetsKey]);

  function startEvolution() {
    if (!selectedTarget || phase !== "intro") return;
    setPhase("evolving");
    window.setTimeout(() => setPhase("result"), 1320);
  }

  function confirmDetails() {
    if (!selectedTarget) return;
    onConfirm(selectedTarget.toSpeciesId);
  }

  const targetName = selectedTarget?.toName || "进化目标";
  const targetSpriteUrl = selectedTarget?.toSpriteUrl || "";
  const statChanges = selectedTarget?.statChanges || [];
  const canCancel = phase === "intro" || phase === "details";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-layer game-evolution-modal-layer"
          role="presentation"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.12}}
        >
          <div className="game-evolution-modal-backdrop" aria-hidden="true" />
          <motion.section
            className={`game-evolution-modal phase-${phase}`}
            role="dialog"
            aria-modal="true"
            aria-label="宝可梦进化"
            initial={{scale: 0.96, opacity: 0, y: 8}}
            animate={{scale: 1, opacity: 1, y: 0}}
            exit={{scale: 0.96, opacity: 0, y: 8}}
            transition={{type: "spring", stiffness: 420, damping: 34, mass: 0.8}}
          >
            <header className="game-evolution-modal-header">
              <div>
                <strong>{phase === "details" ? `${fromName} → ${targetName}` : displayName}</strong>
                <span>{itemName ? `使用 ${itemName}` : "进化"}</span>
              </div>
              <button type="button" aria-label="关闭" onClick={onCancel} disabled={!canCancel}>×</button>
            </header>
            {phase === "details" ? (
              <EvolutionDetails
                fromName={fromName}
                fromSpriteUrl={fromSpriteUrl}
                targetName={targetName}
                targetSpriteUrl={targetSpriteUrl}
                statChanges={statChanges}
              />
            ) : (
              <EvolutionEvent
                phase={phase}
                fromName={fromName}
                displayName={displayName}
                fromSpriteUrl={fromSpriteUrl}
                targetName={targetName}
                targetSpriteUrl={targetSpriteUrl}
                targets={targets}
                selectedSpeciesId={selectedSpeciesId}
                onSelectTarget={setSelectedSpeciesId}
              />
            )}
            <footer className="game-evolution-modal-actions">
              {phase === "intro" ? (
                <>
                  <button type="button" onClick={onCancel}>取消</button>
                  <button type="button" className="primary" onClick={startEvolution} disabled={!selectedTarget}>进化</button>
                </>
              ) : null}
              {phase === "evolving" ? <span>光芒正在扩散...</span> : null}
              {phase === "result" ? <button type="button" className="primary" onClick={() => setPhase("details")}>查看变化</button> : null}
              {phase === "details" ? (
                <>
                  <button type="button" onClick={onCancel}>取消</button>
                  <button type="button" className="primary" onClick={confirmDetails}>确认</button>
                </>
              ) : null}
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function EvolutionEvent({phase, fromName, displayName, fromSpriteUrl, targetName, targetSpriteUrl, targets, selectedSpeciesId, onSelectTarget}: {
  phase: Exclude<GameEvolutionModalPhase, "details">;
  fromName: string;
  displayName: string;
  fromSpriteUrl?: string;
  targetName: string;
  targetSpriteUrl?: string;
  targets: GameEvolutionModalTarget[];
  selectedSpeciesId: string;
  onSelectTarget: (toSpeciesId: string) => void;
}) {
  return (
    <div className="game-evolution-modal-event">
      <p className="game-evolution-modal-message">
        {phase === "result" ? `${fromName}进化成了${targetName}！` : `${displayName}的样子有点奇怪。`}
      </p>
      <div className="game-evolution-modal-animation" aria-label={phase === "intro" ? `${displayName}的样子` : "进化动画"}>
        <figure className="from">
          <ImageWithFallback src={fromSpriteUrl} fallback={fromName.slice(0, 1) || "?"} alt={fromName} />
          <figcaption>{fromName}</figcaption>
        </figure>
        <figure className="to">
          <ImageWithFallback src={targetSpriteUrl} fallback={targetName.slice(0, 1) || "?"} alt={targetName} />
          <figcaption>{targetName}</figcaption>
        </figure>
        <i aria-hidden="true" />
      </div>
      {phase === "intro" && targets.length > 1 ? (
        <div className="game-evolution-modal-targets" aria-label="选择进化目标">
          {targets.map(target => (
            <button
              key={target.toSpeciesId}
              type="button"
              className={target.toSpeciesId === selectedSpeciesId ? "selected" : ""}
              onClick={() => onSelectTarget(target.toSpeciesId)}
            >
              {target.toName}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EvolutionDetails({fromName, fromSpriteUrl, targetName, targetSpriteUrl, statChanges}: {
  fromName: string;
  fromSpriteUrl?: string;
  targetName: string;
  targetSpriteUrl?: string;
  statChanges: Array<{label: string; before: string; after: string}>;
}) {
  return (
    <div className="game-evolution-modal-details">
      <div className="game-evolution-modal-compare">
        <figure>
          <ImageWithFallback src={fromSpriteUrl} fallback={fromName.slice(0, 1) || "?"} alt={fromName} />
          <figcaption>{fromName}</figcaption>
        </figure>
        <span aria-hidden="true">→</span>
        <figure>
          <ImageWithFallback src={targetSpriteUrl} fallback={targetName.slice(0, 1) || "?"} alt={targetName} />
          <figcaption>{targetName}</figcaption>
        </figure>
      </div>
      <div className="game-evolution-modal-stats">
        {statChanges.length ? statChanges.map(change => (
          <article key={`${change.label}:${change.before}:${change.after}`}>
            <span>{change.label}</span>
            <b>{change.before}</b>
            <i>{change.after}</i>
          </article>
        )) : <p>能力值没有明显变化。</p>}
      </div>
    </div>
  );
}
