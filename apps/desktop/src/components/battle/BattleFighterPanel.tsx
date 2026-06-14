import type {CSSProperties} from "react";
import type {RentalPokemon} from "@changebattle/shared";
import {PokemonHpBar} from "../common/PokemonHpBar";
import {conditionText, displayName, parseHp, statusCode, statusLabel} from "../../lib/ui";
import "./BattleFighterPanel.css";

function genderMark(gender: string | undefined): string {
  if (/^m$/i.test(String(gender || ""))) return "♂";
  if (/^f$/i.test(String(gender || ""))) return "♀";
  return "";
}

export function BattleFighterPanel({pokemon, condition, status, side, substitute, transitionMs, teraType, onClick}: {pokemon?: RentalPokemon; condition?: string; status?: string; side: "player" | "enemy"; substitute?: boolean; transitionMs?: number; teraType?: string; onClick?: () => void}) {
  const hp = parseHp(condition);
  const code = statusCode(condition, status);
  const gender = genderMark(pokemon?.gender);
  const current = hp?.current ?? (code === "fnt" ? 0 : 100);
  const max = hp?.max ?? 100;
  return (
    <div className={`fighter-panel ${side} ${onClick ? "clickable-panel" : ""}`} onClick={onClick}>
      <strong>{pokemon ? displayName(pokemon) : "未知"}</strong>
      <span>Lv{pokemon?.level || 50}{gender ? ` ${gender}` : ""}</span>
      {code ? <i className={`status-badge ${code}`}>{statusLabel(code)}</i> : null}
      {substitute ? <i className="substitute-badge">替身</i> : null}
      {teraType ? <i className="tera-badge">太晶：{teraType}</i> : null}
      <PokemonHpBar current={current} max={max} text={hp?.text || conditionText(condition)} className="battle-fighter-hp" />
      <small style={{"--hp-duration": `${transitionMs || 1400}ms`} as CSSProperties}>{hp?.text || conditionText(condition)}</small>
    </div>
  );
}
