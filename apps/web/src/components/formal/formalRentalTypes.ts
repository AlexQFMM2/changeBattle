import type {FormalRentalPokemonViewV4} from "@changebattle-v2/api";

export type BattleSystemId = "mega" | "zmove" | "dynamax" | "terastal";
export type RentalPokemon = FormalRentalPokemonViewV4 & {
  item_battle_system?: BattleSystemId;
  tera_type?: string;
  tera_type_zh?: string;
};
