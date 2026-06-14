import type {RentalPokemon} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../../lib/ui";
import "./RentalTeamPreview.css";

export function RentalTeamPreview({team}: {team: RentalPokemon[]}) {
  return (
    <section className="rental-team-preview" aria-label="已选队伍">
      <header>
        <strong>已选队伍</strong>
        <span>{team.length}/3</span>
      </header>
      <div className="rental-team-preview-slots">
        {Array.from({length: 3}, (_value, index) => {
          const pokemon = team[index];
          return (
            <article className={`rental-team-preview-slot ${pokemon ? "filled" : ""}`} key={`rental-team-${index}`}>
              {pokemon ? (
                <>
                  <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
                  <span>{displayName(pokemon)}</span>
                </>
              ) : (
                <span>空位</span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
