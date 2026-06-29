import type {ShowdownPlayerIdV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./BattleV4TrainerNarrativeOverlay.css";

export type BattleV4NarrativePhase = "intro" | "outro";

export type BattleV4NarrativeTrainer = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  title: string;
  image: string;
  side: "near" | "far";
};

export type BattleV4NarrativeDialogue = {
  trainer: BattleV4NarrativeTrainer;
  lines: string[];
};

export function BattleV4TrainerNarrativeOverlay({
  phase,
  trainers,
  dialogue,
  dialogueIndex,
  onAdvance,
}: {
  phase: BattleV4NarrativePhase;
  trainers: BattleV4NarrativeTrainer[];
  dialogue: BattleV4NarrativeDialogue;
  dialogueIndex: number;
  onAdvance: () => void;
}) {
  const lineCount = Math.max(1, dialogue.lines.length);
  const safeIndex = Math.max(0, Math.min(dialogueIndex, lineCount - 1));
  const line = dialogue.lines[safeIndex] || "";
  const finalLabel = phase === "intro" ? "开始" : "结束";

  return (
    <div
      className={`battle-v4-trainer-narrative phase-${phase}`}
      role="button"
      tabIndex={0}
      aria-live="polite"
      onClick={onAdvance}
      onKeyDown={event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onAdvance();
      }}
    >
      <div className="battle-v4-trainer-narrative-scrim" />
      <div className="battle-v4-trainer-narrative-stands">
        {trainers.map(trainer => (
          <span className={`battle-v4-trainer-stand seat-${trainer.playerId} side-${trainer.side}`} key={`${trainer.playerId}:${trainer.name}:${trainer.image}`}>
            <i />
            {trainer.image ? (
              <ImageWithFallback src={trainer.image} alt={trainer.name} fallback={trainer.name.slice(0, 1) || "?"} />
            ) : (
              <b>{trainer.name.slice(0, 1) || "?"}</b>
            )}
            <em>{trainer.playerId}</em>
          </span>
        ))}
      </div>
      <div className="battle-v4-trainer-dialogue">
        <strong>{dialogue.trainer.name}</strong>
        <span>{dialogue.trainer.title}</span>
        <p>{line}</p>
        <i>{safeIndex < lineCount - 1 ? "▼" : finalLabel}</i>
      </div>
    </div>
  );
}
