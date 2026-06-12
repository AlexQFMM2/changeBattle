import type {CSSProperties} from "react";
import type {PartyStatusSlot} from "../../lib/ui";
import {PokemonSprite, conditionText, displayName, hpTone, parseHp, statusCode} from "../../lib/ui";

const BATTLE_SMALL_STATUS_LABELS: Record<string, string> = {
  brn: "烧",
  par: "麻",
  psn: "毒",
  tox: "毒",
  slp: "睡",
  frz: "冰",
};

export function BattleSmallImage({slot, side, onClick}: {slot: PartyStatusSlot; side: "player" | "enemy"; onClick?: () => void}) {
  const hp = parseHp(slot.condition);
  const code = statusCode(slot.condition, slot.status);
  const revealed = side === "player" || slot.revealed;
  const fainted = code === "fnt";
  const knownPokemon = revealed && Boolean(slot.display);
  const hpPercent = hp ? Math.max(0, (hp.current / hp.max) * 100) : fainted ? 0 : 100;
  const tone = hp ? hpTone(hp) : fainted ? "low" : "high";
  const statusLabel = BATTLE_SMALL_STATUS_LABELS[code] || "";
  const body = (
    <>
      <span className="battle-small-index">{slot.active ? "▶" : slot.label}</span>
      <span className={`battle-small-sprite ${revealed ? "" : "unknown"}`}>
        {revealed && slot.display ? <PokemonSprite pokemon={slot.display} alt={displayName(slot.display)} badge={false} /> : <i>?</i>}
      </span>
      <strong>{knownPokemon ? displayName(slot.display) : "?"}</strong>
      <small>{hp?.text || (revealed ? conditionText(slot.condition) : "未知")}</small>
      <span className="battle-small-hp"><i className={`hp-${tone}`} style={{width: `${hpPercent}%`} as CSSProperties} /></span>
      {statusLabel ? <i className={`battle-small-status ${code}`}>{statusLabel}</i> : null}
    </>
  );
  const className = `battle-small-image party-status-chip ${slot.active ? "active" : ""} ${fainted ? "fainted" : ""}`;
  return onClick ? <button className={className} onClick={onClick}>{body}</button> : <div className={className}>{body}</div>;
}
