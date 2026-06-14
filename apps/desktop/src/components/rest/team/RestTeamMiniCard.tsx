import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import {PokemonHpBar} from "../../common/PokemonHpBar";
import {PokemonSprite, displayName} from "../../../lib/ui";
import {restPokemonHpModel, restPokemonStatusLabel} from "./restTeamModel";
import "./RestTeamMiniCard.css";

export function RestTeamMiniCard({pokemon, state, index, selected, onSelect}: {pokemon: RentalPokemon; state?: PlayerPokemonState; index: number; selected?: boolean; onSelect?: () => void}) {
  const hp = restPokemonHpModel(state);
  const status = restPokemonStatusLabel(state);
  return (
    <button className={`rest-team-mini-card ${selected ? "selected" : ""} ${hp.status ? `status-${hp.status}` : ""}`} type="button" onClick={onSelect}>
      <span className="rest-team-mini-card-index">{index + 1}</span>
      {status ? <em>{status}</em> : null}
      <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
      <strong>{displayName(pokemon)}</strong>
      <PokemonHpBar current={hp.hp?.current ?? hp.percent} max={hp.hp?.max ?? 100} className="rest-team-mini-card-hp" />
    </button>
  );
}
