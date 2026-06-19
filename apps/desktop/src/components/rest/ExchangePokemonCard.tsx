import type {RentalPokemon} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../lib/ui";
import {restPokemonLevelLabel} from "./team/restTeamModel";
import "./ExchangePokemonCard.css";

export function ExchangePokemonCard({pokemon, index, selected, disabled, disabledReason, sideLabel, onSelect}: {pokemon: RentalPokemon; index: number; selected?: boolean; disabled?: boolean; disabledReason?: string; sideLabel?: string; onSelect: () => void}) {
  const name = displayName(pokemon);
  return (
    <button className={`exchange-pokemon-card ${selected ? "selected" : ""}`} type="button" disabled={disabled} title={disabledReason || name} onClick={onSelect}>
      <span className="exchange-pokemon-card-index">{index + 1}</span>
      {disabledReason ? <em>{disabledReason}</em> : null}
      <PokemonSprite pokemon={pokemon} alt={name} badge={false} />
      <span className="exchange-pokemon-card-copy">
        <strong>{name}</strong>
        <small>{sideLabel || `${restPokemonLevelLabel(pokemon)} · ${pokemon.item_zh || pokemon.item || "无道具"}`}</small>
      </span>
    </button>
  );
}
