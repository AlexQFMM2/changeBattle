import type {ShowdownPlayerIdV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {TrainingRestShopDialogue} from "../training/TrainingRestShopDialogue";
import "./BattleV4TrainerNarrativeOverlay.css";

export type BattleV4NarrativePhase = "intro" | "outro";

export type BattleV4NarrativeTrainer = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  title: string;
  image: string;
  side: "near" | "far";
  isReferee?: boolean;
};

export type BattleV4NarrativeDialogue = {
  trainer: BattleV4NarrativeTrainer;
  lines: string[];
  entries?: Array<{
    trainer: BattleV4NarrativeTrainer;
    text: string;
  }>;
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
  const entries = dialogue.entries || [];
  const lineCount = Math.max(1, entries.length || dialogue.lines.length);
  const safeIndex = Math.max(0, Math.min(dialogueIndex, lineCount - 1));
  const activeEntry = entries[safeIndex] || null;
  const activeTrainer = activeEntry?.trainer || dialogue.trainer;
  const line = activeEntry?.text || dialogue.lines[safeIndex] || "";
  const finalLabel = phase === "intro" ? "开始" : "结束";
  const advanceLabel = safeIndex < lineCount - 1 ? "继续" : finalLabel;
  const speakerKind = activeTrainer.isReferee || activeTrainer.name === "裁判" ? "referee" : "trainer";
  const standingTrainers = activeTrainer.isReferee
    ? trainers
    : trainers.filter(trainer => trainer.playerId !== activeTrainer.playerId);

  return (
    <div
      className={`battle-v4-trainer-narrative phase-${phase} speaker-${speakerKind}`}
      role="presentation"
      tabIndex={0}
      aria-live="polite"
      onKeyDown={event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onAdvance();
      }}
    >
      <div className="battle-v4-trainer-narrative-scrim" />
      <div className="battle-v4-trainer-narrative-stands">
        {standingTrainers.map(trainer => (
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
      <TrainingRestShopDialogue
        speaker={activeTrainer.name}
        itemName={activeTrainer.title}
        text={line}
        portraitSrc={activeTrainer.image}
        actions={[
          {
            label: advanceLabel,
            meta: safeIndex < lineCount - 1 ? `${safeIndex + 1}/${lineCount}` : "",
            primary: true,
            onClick: onAdvance,
          },
        ]}
      />
      <button
        className="battle-v4-trainer-dialogue-click-mask"
        type="button"
        aria-label={advanceLabel}
        onClick={onAdvance}
      />
    </div>
  );
}
