import {formalBattleSystemLabelV4} from "@changebattle-v2/api";
import type {BattleSystemId, RentalPokemon} from "../formalRentalTypes";

export function rentalBattleSystemLabel(system: BattleSystemId): string {
  return formalBattleSystemLabelV4(system);
}

export function rentalSpecialBadges(pokemon: RentalPokemon): string[] {
  return [
    pokemon.is_mythical ? "幻兽" : "",
    !pokemon.is_mythical && pokemon.is_legendary ? "神兽" : "",
    pokemon.item_battle_system ? rentalBattleSystemLabel(pokemon.item_battle_system) : "",
  ].filter(Boolean);
}

export function rentalPokemonKey(pokemon: RentalPokemon, index: number): string {
  return pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id || pokemon.name || `candidate-${index}`;
}

export function rentalOriginLabel(pokemon: RentalPokemon | undefined): string {
  const origin = (pokemon as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current";
  return origin === "memory" ? "回忆候选" : "本局候选";
}
