import type {CSSProperties, ReactNode} from "react";
import "./BattleField.css";

export function BattleField({
  className = "",
  style,
  trainerIntro,
  fieldEffects,
  effectLayer,
  toolbar,
  eventStatusStrip,
  enemyPanel,
  playerPanel,
  sprites,
  message,
  turn,
}: {
  className?: string;
  style?: CSSProperties;
  trainerIntro?: ReactNode;
  fieldEffects?: ReactNode;
  effectLayer?: ReactNode;
  toolbar?: ReactNode;
  eventStatusStrip?: ReactNode;
  enemyPanel?: ReactNode;
  playerPanel?: ReactNode;
  sprites?: ReactNode;
  message?: ReactNode;
  turn: number;
}) {
  return (
    <section className={`battle-field ${className}`} style={style}>
      <div className="battle-platforms" aria-hidden="true">
        <i className="battle-platform player-platform" />
        <i className="battle-platform enemy-platform" />
      </div>
      {fieldEffects}
      {effectLayer}
      {trainerIntro}
      <div className="turn-badge">第 {turn} 回合</div>
      {toolbar}
      {eventStatusStrip}
      {enemyPanel}
      <div className="battle-sprites">{sprites}</div>
      {playerPanel}
      {message}
    </section>
  );
}
