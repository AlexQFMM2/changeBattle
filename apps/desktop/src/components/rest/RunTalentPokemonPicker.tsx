import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import {PokemonHpBar} from "../common/PokemonHpBar";
import {PokemonSprite, displayName} from "../../lib/ui";
import {restPokemonHpModel, restPokemonStatusLabel} from "./team/restTeamModel";
import "./RunTalentPokemonPicker.css";

export type RunTalentPokemonPickerEntry = {
  pokemon: RentalPokemon;
  state?: PlayerPokemonState;
  slot: number;
  disabled?: boolean;
  disabledReason?: string;
  used?: boolean;
};

export function RunTalentPokemonPicker({entries, selectedSlot, onSelectSlot}: {entries: RunTalentPokemonPickerEntry[]; selectedSlot: number; onSelectSlot: (slot: number) => void}) {
  return (
    <div className="run-talent-pokemon-picker" aria-label="选择队伍宝可梦">
      {entries.map(entry => {
        const name = displayName(entry.pokemon);
        const hp = restPokemonHpModel(entry.state);
        const status = restPokemonStatusLabel(entry.state);
        const hpCurrent = hp.hp?.current ?? hp.percent;
        const hpMax = hp.hp?.max ?? 100;
        return (
          <button
            className={`run-talent-pokemon-card ${selectedSlot === entry.slot ? "selected" : ""} ${entry.used ? "used" : ""}`}
            type="button"
            disabled={entry.disabled}
            onClick={() => onSelectSlot(entry.slot)}
            title={entry.disabledReason || name}
            key={`${entry.pokemon.species_id}-${entry.slot}`}
          >
            <span className="run-talent-pokemon-index">{entry.slot + 1}</span>
            {status ? <em>{status}</em> : null}
            <PokemonSprite pokemon={entry.pokemon} alt={name} badge={false} />
            <span className="run-talent-pokemon-copy">
              <strong>{name}</strong>
              <small>Lv{entry.pokemon.level || "?"}</small>
              <PokemonHpBar current={hpCurrent} max={hpMax} text={hp.text} className="run-talent-pokemon-hp" />
            </span>
            {entry.disabledReason ? <i>{entry.disabledReason}</i> : null}
          </button>
        );
      })}
    </div>
  );
}
