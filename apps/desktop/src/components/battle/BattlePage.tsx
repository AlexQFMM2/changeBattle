import type {CSSProperties, ReactNode} from "react";
import "./BattlePage.css";

export function BattlePage({dialogueActive, speed, onClick, partyBoard, field, bottom, overlays}: {dialogueActive?: boolean; speed: 1 | 2; onClick?: () => void; partyBoard?: ReactNode; field: ReactNode; bottom: ReactNode; overlays?: ReactNode}) {
  return (
    <div className={`battle-layout ${dialogueActive ? "battle-dialogue-active" : ""}`} data-battle-speed={speed} onClick={onClick}>
      {!dialogueActive ? partyBoard : null}
      {field}
      {bottom}
      {overlays}
    </div>
  );
}

export type BattlePageCssVars = CSSProperties;
