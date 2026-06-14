import type {RentalPokemon} from "@changebattle/shared";
import {PokemonHpBar} from "../common/PokemonHpBar";
import {PokemonSprite, conditionText, displayName, parseHp, statusCode, statusLabel} from "../../lib/ui";
import "./BagTargetPokemonList.css";

export type BagTargetPokemonEntry = {
  pokemon?: RentalPokemon;
  condition?: string;
  status?: string;
  heldItem?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function BagTargetPokemonList({team, selectedIndex, busyIndex = null, title = "选择宝可梦", emptyText = "当前没有可选择的宝可梦。", onSelect}: {team: BagTargetPokemonEntry[]; selectedIndex?: number; busyIndex?: number | null; title?: string; emptyText?: string; onSelect: (index: number) => void}) {
  return (
    <section className="bag-target-pokemon-list">
      <header><strong>{title}</strong></header>
      <div>
        {team.length ? team.slice(0, 6).map((entry, index) => {
          const hp = parseHp(entry.condition);
          const code = statusCode(entry.condition, entry.status);
          const disabled = Boolean(entry.disabled || busyIndex !== null);
          const current = hp?.current ?? (code === "fnt" ? 0 : 100);
          const max = hp?.max ?? 100;
          const targetBadge = busyIndex === index ? "处理中" : entry.disabledReason || "";
          return (
            <button className={`${selectedIndex === index ? "selected" : ""} ${code === "fnt" ? "fainted" : ""}`} disabled={disabled} type="button" onClick={() => onSelect(index)} key={`${entry.pokemon?.run_member_id || entry.pokemon?.showdown_id || entry.pokemon?.species_id || "slot"}-${index}`}>
              <span className="bag-target-index">{index + 1}</span>
              <PokemonSprite pokemon={entry.pokemon} alt={entry.pokemon ? displayName(entry.pokemon) : "未知"} />
              <strong>{entry.pokemon ? displayName(entry.pokemon) : "未知"}</strong>
              {code ? <em>{statusLabel(code)}</em> : null}
              <small>{entry.heldItem || "无道具"}</small>
              <PokemonHpBar current={current} max={max} text={hp?.text || conditionText(entry.condition)} className="bag-target-hp" />
              <span className="bag-target-hp-text">{hp?.text || conditionText(entry.condition) || `${current}/${max}`}</span>
              {targetBadge ? <span className="bag-target-badge">{targetBadge}</span> : null}
            </button>
          );
        }) : <p>{emptyText}</p>}
      </div>
    </section>
  );
}
