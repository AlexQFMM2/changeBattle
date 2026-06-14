import type {RentalPokemon} from "@changebattle/shared";
import type {RestPokemonFocus} from "./restTeamModel";
import {restPokemonFocusBody, restPokemonFocusTitle} from "./restTeamModel";
import "./RestPokemonInfoPanel.css";

export function RestPokemonInfoPanel({pokemon, focus, onFocus, onMove, onUseItem, onUnequip, onStats}: {pokemon: RentalPokemon; focus: RestPokemonFocus; onFocus: (focus: RestPokemonFocus) => void; onMove?: () => void; onUseItem?: () => void; onUnequip?: () => void; onStats?: () => void}) {
  return (
    <section className="rest-pokemon-info-panel">
      <nav>
        <button className={focus.type === "nature" ? "selected" : ""} onClick={() => onFocus({type: "nature"})}>性格</button>
        <button className={focus.type === "ability" ? "selected" : ""} onClick={() => onFocus({type: "ability"})}>特性</button>
        <button className={focus.type === "item" ? "selected" : ""} onClick={() => onFocus({type: "item"})}>道具</button>
      </nav>
      <article>
        <h3>{restPokemonFocusTitle(pokemon, focus)}</h3>
        <p>{restPokemonFocusBody(pokemon, focus)}</p>
      </article>
      <footer>
        {focus.type === "move" ? <button onClick={onMove}>更换该技能</button> : null}
        {focus.type === "item" && pokemon.item_id ? <button onClick={onUnequip}>卸下道具</button> : null}
        {onUseItem ? <button onClick={onUseItem}>使用道具</button> : null}
        {onStats ? <button onClick={onStats}>重置数值</button> : null}
      </footer>
    </section>
  );
}
