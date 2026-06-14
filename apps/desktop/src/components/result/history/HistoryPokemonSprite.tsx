import type {RentalPokemon} from "@changebattle/shared";
import {pokemonImageUrl} from "../../../lib/ui";
import "./HistoryPokemonSprite.css";

export function HistoryPokemonSprite({pokemon}: {pokemon: RentalPokemon}) {
  const src = pokemonImageUrl(pokemon);
  if (!src) return <span className="history-pokemon-sprite empty" aria-hidden="true" />;
  return (
    <span className="history-pokemon-sprite" aria-hidden="true">
      <img src={src} alt="" onError={event => event.currentTarget.classList.add("failed")} />
    </span>
  );
}
