import type {RentalPokemon} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../lib/ui";
import "./EventMoveServiceTeamPicker.css";

type EventMoveServiceTeamPickerProps = {
  team: RentalPokemon[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
};

export function EventMoveServiceTeamPicker({team, selectedSlot, onSelectSlot}: EventMoveServiceTeamPickerProps) {
  return (
    <aside className="event-move-service-team-picker" aria-label="选择学习技能的宝可梦">
      {team.slice(0, 6).map((pokemon, index) => (
        <button className={selectedSlot === index ? "selected" : ""} type="button" aria-label={displayName(pokemon)} title={displayName(pokemon)} onClick={() => onSelectSlot(index)} key={`event-move-service-team-${pokemon.species_id}-${index}`}>
          <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} />
          <span>{displayName(pokemon)}</span>
          <small>Lv.{pokemon.level || "--"}</small>
        </button>
      ))}
    </aside>
  );
}
