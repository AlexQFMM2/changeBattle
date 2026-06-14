import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import type {CSSProperties} from "react";
import {PokemonSprite, displayName} from "../../../lib/ui";
import {restPokemonHpModel, restPokemonStatusLabel} from "./restTeamModel";
import "./RestPokemonSlot.css";

export function RestPokemonSlot({pokemon, state, index, selected, onSelect}: {pokemon: RentalPokemon; state?: PlayerPokemonState; index: number; selected?: boolean; onSelect?: () => void}) {
  const hp = restPokemonHpModel(state);
  const status = restPokemonStatusLabel(state);
  return (
    <button className={`rest-pokemon-slot ${selected ? "selected" : ""} ${hp.status ? `status-${hp.status}` : ""}`} type="button" onClick={onSelect}>
      <span className="rest-pokemon-slot-index">{index + 1}</span>
      <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
      <span className="rest-pokemon-slot-copy">
        <strong>{displayName(pokemon)}</strong>
        <small>{hp.text}{status ? ` · ${status}` : ""}</small>
      </span>
      <i className="rest-pokemon-slot-hp"><b className={`hp-${hp.tone}`} style={{width: `${hp.percent}%`} as CSSProperties} /></i>
      {status ? <em>{status}</em> : null}
    </button>
  );
}
