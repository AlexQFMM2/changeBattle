import {useEffect, useState, type CSSProperties} from "react";
import type {SpriteSequenceV4} from "./spriteAnimationCatalog";
import "./SpriteSequencePlayer.css";

export type SpriteSequencePlayerProps = {
  sequence: SpriteSequenceV4;
  className?: string;
  ariaLabel?: string;
};

export function SpriteSequencePlayer({sequence, className, ariaLabel}: SpriteSequencePlayerProps) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const frameCount = Math.max(1, sequence.frameCount);
  const frameWidth = Math.max(1, sequence.frameWidth);
  const frameHeight = Math.max(1, sequence.frameHeight);
  const stepX = Math.max(1, sequence.stepX);
  const durationMs = Math.max(1, sequence.durationMs);
  const repeatDelayMs = Math.max(0, sequence.repeatDelayMs || 0);
  const delayedLoop = sequence.loop && repeatDelayMs > 0;
  const sheetWidth = stepX * frameCount;
  const playStepCount = sequence.loop && !delayedLoop ? frameCount : Math.max(1, frameCount - 1);
  const shiftX = sequence.loop && !delayedLoop ? sheetWidth : stepX * Math.max(0, frameCount - 1);
  const classNames = ["sprite-sequence-player", className].filter(Boolean).join(" ");
  const style = {
    "--sprite-sequence-player-frame-width": `${frameWidth}px`,
    "--sprite-sequence-player-frame-height": `${frameHeight}px`,
    "--sprite-sequence-player-sheet-width": `${sheetWidth}px`,
    "--sprite-sequence-player-sheet-shift-x": `${shiftX}px`,
    "--sprite-sequence-player-step-count": playStepCount,
    "--sprite-sequence-player-duration": `${durationMs}ms`,
    "--sprite-sequence-player-iteration-count": sequence.loop && !delayedLoop ? "infinite" : "1",
    "--sprite-sequence-player-fill-mode": sequence.loop && !delayedLoop ? "none" : "both",
  } as CSSProperties;

  useEffect(() => {
    setCycleIndex(0);
    if (!delayedLoop || !sequence.src) return undefined;
    const intervalId = window.setInterval(() => {
      setCycleIndex((current) => current + 1);
    }, durationMs + repeatDelayMs);
    return () => window.clearInterval(intervalId);
  }, [delayedLoop, durationMs, repeatDelayMs, sequence.id, sequence.src]);

  return (
    <span
      className={classNames}
      style={style}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {sequence.src ? (
        <span
          key={delayedLoop ? `${sequence.id}:${cycleIndex}` : sequence.id}
          className="sprite-sequence-player-strip"
          style={{"--sprite-sequence-player-image": `url("${sequence.src}")`} as CSSProperties}
        />
      ) : null}
    </span>
  );
}
