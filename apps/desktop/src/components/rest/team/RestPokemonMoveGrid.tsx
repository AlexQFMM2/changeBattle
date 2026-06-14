import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import {MoveCard} from "../../move/MoveCard";
import type {RestPokemonFocus} from "./restTeamModel";
import {restPokemonMoveLabel} from "./restTeamModel";
import "./RestPokemonMoveGrid.css";

export function RestPokemonMoveGrid({pokemon, state, focus, onFocus}: {pokemon: RentalPokemon; state?: PlayerPokemonState; focus: RestPokemonFocus; onFocus: (focus: RestPokemonFocus) => void}) {
  const moves = pokemon.moves.slice(0, 4);
  return (
    <section className="rest-pokemon-move-grid">
      <header><strong>技能</strong><span>{moves.length}/4</span></header>
      <div>
        {Array.from({length: 4}, (_value, index) => {
          const move = moves[index];
          if (!move) return <article className="rest-pokemon-move-empty" key={`empty-move-${index}`}>空技能位</article>;
          return (
            <MoveCard
              size="battle"
              selected={focus.type === "move" && focus.moveIndex === index}
              name={restPokemonMoveLabel(pokemon, state, move, index)}
              moveType={move.type || move.type_zh}
              typeLabel={move.type_zh || move.type || "一般"}
              category={move.category_zh || move.category || "变化"}
              pp={state?.moves?.[index]?.pp ?? move.pp}
              maxPp={state?.moves?.[index]?.maxpp ?? move.pp}
              power={move.power || "--"}
              accuracy={move.accuracy ?? "必中"}
              onClick={() => onFocus({type: "move", moveIndex: index})}
              key={`${move.id || move.name}-${index}`}
            />
          );
        })}
      </div>
    </section>
  );
}
