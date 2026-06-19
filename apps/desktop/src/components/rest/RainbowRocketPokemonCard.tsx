import type {RentalPokemon} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../lib/ui";
import {restPokemonLevelLabel} from "./team/restTeamModel";
import "./RainbowRocketPokemonCard.css";

export function RainbowRocketPokemonCard({pokemon, label, detail, selected, restoreSelected, disabled, onClick}: {pokemon: RentalPokemon; label?: string; detail?: string; selected?: boolean; restoreSelected?: boolean; disabled?: boolean; onClick?: () => void}) {
  return (
    <button className={`rainbow-rocket-pokemon-card ${selected ? "selected" : ""} ${restoreSelected ? "restore-selected" : ""}`} type="button" disabled={disabled} onClick={onClick}>
      <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
      <span>{label || displayName(pokemon)}</span>
      <small>{detail || `${restPokemonLevelLabel(pokemon)} · ${pokemon.item_zh || pokemon.item || "无道具"}`}</small>
    </button>
  );
}
