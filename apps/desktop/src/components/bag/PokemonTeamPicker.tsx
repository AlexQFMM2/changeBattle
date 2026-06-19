import type {RentalPokemon} from "@changebattle/shared";
import {PokemonSprite, conditionText, displayName, hpTone, parseHp, statusCode, statusLabel} from "../../lib/ui";
import type {CSSProperties} from "react";
import {restPokemonLevelLabel} from "../rest/team/restTeamModel";
import "./PokemonTeamPicker.css";

export type PokemonTeamPickerEntry = {
  pokemon?: RentalPokemon;
  condition?: string;
  status?: string;
  heldItem?: string;
  disabled?: boolean;
  disabledReason?: string;
};

type PokemonTeamPickerProps = {
  team: PokemonTeamPickerEntry[];
  selectedIndex?: number;
  busyIndex?: number | null;
  onSelect: (index: number) => void;
  title?: string;
  emptyText?: string;
};

export function PokemonTeamPicker({team, selectedIndex, busyIndex = null, onSelect, title = "选择宝可梦", emptyText = "当前没有可选择的宝可梦。"}: PokemonTeamPickerProps) {
  return (
    <section className="pokemon-team-picker">
      <header><strong>{title}</strong></header>
      <div className="pokemon-team-picker-list">
        {team.length ? team.map((entry, index) => {
          const hp = parseHp(entry.condition);
          const code = statusCode(entry.condition, entry.status);
          const hpPercent = hp ? Math.max(0, (hp.current / hp.max) * 100) : code === "fnt" ? 0 : 100;
          const disabled = Boolean(entry.disabled || busyIndex !== null);
          return (
            <button className={`${selectedIndex === index ? "selected" : ""} ${code === "fnt" ? "fainted" : ""}`} disabled={disabled} onClick={() => onSelect(index)} key={`${entry.pokemon?.run_member_id || entry.pokemon?.showdown_id || entry.pokemon?.species_id || "slot"}-${index}`}>
              <PokemonSprite pokemon={entry.pokemon} alt={entry.pokemon ? displayName(entry.pokemon) : "未知"} />
              <span>
                <strong>{entry.pokemon ? displayName(entry.pokemon) : "未知"}</strong>
                <small>{entry.pokemon ? `${restPokemonLevelLabel(entry.pokemon)} · ` : ""}{conditionText(entry.condition)}{code ? ` ${statusLabel(code)}` : ""}</small>
              </span>
              <i className="pokemon-team-picker-hp"><b className={`hp-${hpTone(hp)}`} style={{width: `${hpPercent}%`} as CSSProperties} /></i>
              <em>{entry.heldItem || "无道具"}</em>
              <b>{busyIndex === index ? "处理中" : entry.disabledReason || "选择"}</b>
            </button>
          );
        }) : <p>{emptyText}</p>}
      </div>
    </section>
  );
}
