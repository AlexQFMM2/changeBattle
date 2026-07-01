import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import type {RentalPokemon} from "../formalRentalTypes";
import {PokemonProfile} from "../pokemon/PokemonProfile";
import "./RentalPokemonDetail.css";

export function RentalPokemonDetail({api, pokemon, selected, revealTraining, onToggle}: {api: ChangeBattleV2Api; pokemon: RentalPokemon | null; selected: boolean; revealTraining: boolean; onToggle: () => void}) {
  if (!pokemon) {
    return (
      <section className="rental-pokemon-detail empty">
        <strong>租赁候选</strong>
        <span>正在同步候选宝可梦。</span>
      </section>
    );
  }
  return (
    <section className="rental-pokemon-detail">
      <button className="rental-pokemon-detail-toggle" type="button" onClick={onToggle}>{selected ? "取消选中" : "选中"}</button>
      <PokemonProfile api={api} pokemon={pokemon} selected={selected} revealTraining={revealTraining} compact movePresentation="card" />
    </section>
  );
}
