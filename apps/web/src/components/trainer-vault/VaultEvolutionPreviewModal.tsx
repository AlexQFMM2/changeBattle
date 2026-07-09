import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./VaultEvolutionPreviewModal.css";

export type VaultEvolutionPreviewModalState = Extract<ReturnType<ChangeBattleV2Api["previewPlayerVaultEvolutionItemUse"]>, {ok: true}>;

type EvolutionPhase = "idle" | "flash" | "done";

export function VaultEvolutionPreviewModal({preview, onCancel, onConfirm}: {
  preview: VaultEvolutionPreviewModalState;
  onCancel: () => void;
  onConfirm: (toSpeciesId: string) => void;
}) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(preview.targets[0]?.toSpeciesId || "");
  const [phase, setPhase] = useState<EvolutionPhase>("idle");
  const selectedTarget = useMemo(
    () => preview.targets.find(target => target.toSpeciesId === selectedSpeciesId) || preview.targets[0],
    [preview.targets, selectedSpeciesId],
  );

  useEffect(() => {
    setSelectedSpeciesId(preview.targets[0]?.toSpeciesId || "");
    setPhase("idle");
  }, [preview]);

  function confirmEvolution() {
    if (!selectedTarget || phase !== "idle") return;
    setPhase("flash");
    window.setTimeout(() => {
      setPhase("done");
      window.setTimeout(() => onConfirm(selectedTarget.toSpeciesId), 360);
    }, 1180);
  }

  const targetName = selectedTarget?.toName || "进化目标";

  return (
    <div className="vault-evolution-preview-modal-layer" role="presentation">
      <section className="vault-evolution-preview-modal" aria-label="确认进化">
        <header>
          <div>
            <strong>{preview.itemName}</strong>
            <span>{preview.pokemonName}</span>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭" disabled={phase !== "idle"}>×</button>
        </header>
        <div className={`vault-evolution-preview-stage vault-evolution-preview-stage-${phase}`}>
          <figure className="from">
            <ImageWithFallback src={preview.fromSpriteUrl} fallback={preview.fromName.slice(0, 1) || "?"} alt={preview.fromName} />
            <figcaption>{preview.fromName}</figcaption>
          </figure>
          <span className="vault-evolution-preview-arrow" aria-hidden="true">→</span>
          <figure className="to">
            <ImageWithFallback src={selectedTarget?.toSpriteUrl} fallback={targetName.slice(0, 1) || "?"} alt={targetName} />
            <figcaption>{targetName}</figcaption>
          </figure>
          <i aria-hidden="true" />
        </div>
        {preview.targets.length > 1 ? (
          <div className="vault-evolution-preview-targets" aria-label="选择进化目标">
            {preview.targets.map(target => (
              <button
                key={target.toSpeciesId}
                type="button"
                className={target.toSpeciesId === selectedSpeciesId ? "selected" : ""}
                disabled={phase !== "idle"}
                onClick={() => setSelectedSpeciesId(target.toSpeciesId)}
              >
                {target.toName}
              </button>
            ))}
          </div>
        ) : null}
        <div className="vault-evolution-preview-info">
          <span>亲密度门槛 {selectedTarget?.friendshipRequirement ?? 0}</span>
          <span>只改变形态，保留养成内容</span>
        </div>
        <div className="vault-evolution-preview-stats">
          {selectedTarget?.statChanges.length ? selectedTarget.statChanges.map(change => (
            <article key={`${change.label}:${change.before}:${change.after}`}>
              <span>{change.label}</span>
              <b>{change.before}</b>
              <i>{change.after}</i>
            </article>
          )) : <p>能力值没有明显变化。</p>}
        </div>
        <footer>
          <button type="button" onClick={onCancel} disabled={phase !== "idle"}>取消</button>
          <button type="button" className="primary" onClick={confirmEvolution} disabled={!selectedTarget || phase !== "idle"}>{phase === "idle" ? "进化" : "进化中..."}</button>
        </footer>
      </section>
    </div>
  );
}
