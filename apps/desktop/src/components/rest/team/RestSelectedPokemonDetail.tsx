import type {DesktopGameState, PlayerPokemonState, RentalPokemon, RestAction} from "@changebattle/shared";
import {PokemonHpBar} from "../../common/PokemonHpBar";
import {MoveCard} from "../../move/MoveCard";
import {PokemonSprite, coinCostLabel, displayName} from "../../../lib/ui";
import type {RestPokemonFocus} from "./restTeamModel";
import {restPokemonFocusBody, restPokemonFocusTitle, restPokemonHpModel, restPokemonMoveLabel, restPokemonStatRows} from "./restTeamModel";
import "./RestSelectedPokemonDetail.css";

type RestState = NonNullable<DesktopGameState["rest"]>;

export function RestSelectedPokemonDetail({rest, pokemon, state, slot, focus, onFocus, onMove, onUseItem, onUnequip, onStats, onAction}: {rest: RestState; pokemon: RentalPokemon; state?: PlayerPokemonState; slot: number; focus: RestPokemonFocus; onFocus: (focus: RestPokemonFocus) => void; onMove?: (slot: number, moveSlot?: number) => void; onUseItem?: (slot: number) => void; onUnequip?: (slot: number) => void; onStats?: (slot: number) => void; onAction?: (action: RestAction) => void | Promise<unknown>}) {
  const hp = restPokemonHpModel(state);
  const typeLabels = pokemon.types_zh?.length ? pokemon.types_zh : pokemon.types || [];
  const revealTraining = Boolean((rest.talents || []).some(talent => talent.id === "intel_god_eye"));

  return (
    <section className="rest-selected-pokemon-detail">
      <section className="rest-selected-pokemon-main">
        <div className="rest-selected-pokemon-identity">
          <span>No.{pokemon.sprite?.national_dex || "?"}</span>
          <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
          <h3>{displayName(pokemon)}</h3>
          <small>{pokemon.species}</small>
          <div className="rest-selected-pokemon-types">{typeLabels.map(type => <b key={type}>{type}</b>)}</div>
        </div>
        <div className="rest-selected-pokemon-facts">
          <button className={focus.type === "nature" ? "selected" : ""} type="button" onClick={() => onFocus({type: "nature"})}><span>性格</span><strong>{pokemon.nature_zh || pokemon.nature || "未知"}</strong></button>
          <button className={focus.type === "ability" ? "selected" : ""} type="button" onClick={() => onFocus({type: "ability"})}><span>特性</span><strong>{pokemon.ability_zh || pokemon.ability}</strong></button>
          <button className={focus.type === "item" ? "selected" : ""} type="button" onClick={() => onFocus({type: "item"})}><span>道具</span><strong>{pokemon.item_zh || "无"}</strong></button>
        </div>
        <div className="rest-selected-pokemon-hp">
          <span>HP</span>
          <strong>{hp.text}</strong>
          <PokemonHpBar current={hp.hp?.current ?? hp.percent} max={hp.hp?.max ?? 100} text={hp.text} className="rest-selected-pokemon-hp-bar" />
        </div>
        <div className="rest-selected-move-row" aria-label="技能">
          {Array.from({length: 4}, (_value, index) => {
            const move = pokemon.moves[index];
            if (!move) return <button className="rest-selected-move-empty" type="button" key={`empty-${index}`}>空</button>;
            return (
              <MoveCard
                size="sheet"
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

      <section className="rest-selected-pokemon-stats">
        <button className="rest-selected-reroll-all" type="button" onClick={() => onAction?.({type: "randomize_all_stats", slot})}>
          <span>🎲 全部重随</span>
          <b>{coinCostLabel(rest.costs.randomize_all)}</b>
        </button>
        <div className="rest-selected-reroll-lines">
          <p><span>性格：{pokemon.nature_zh || pokemon.nature || "未知"}</span><button type="button" onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "nature"})}>🎲 随机 <b>{coinCostLabel(rest.costs.randomize_part)}</b></button></p>
          <p><span>特性：{pokemon.ability_zh || pokemon.ability}</span><button type="button" onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "ability"})}>🎲 随机 <b>{coinCostLabel(rest.costs.randomize_part)}</b></button></p>
        </div>
        <div className="rest-selected-reroll-stat-buttons">
          <button type="button" onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "ivs"})}>🎲 个体 <b>{coinCostLabel(rest.costs.randomize_part)}</b></button>
          <button type="button" onClick={() => onAction?.({type: "randomize_stat_part", slot, part: "evs"})}>🎲 努力 <b>{coinCostLabel(rest.costs.randomize_part)}</b></button>
        </div>
        <div className="rest-selected-stat-list">
          {restPokemonStatRows(pokemon, revealTraining).map(row => (
            <p key={row.stat}><span>{row.label}</span><strong>{row.value}</strong></p>
          ))}
        </div>
        <footer className="rest-selected-action-footer">
          {pokemon.item_id ? <button type="button" onClick={() => onUnequip?.(slot)}>卸下道具</button> : null}
          <button type="button" onClick={() => onMove?.(slot)}>🎲 技能随机</button>
        </footer>
      </section>

      <section className="rest-selected-description">
        <h3>{restPokemonFocusTitle(pokemon, focus)}</h3>
        <p>{restPokemonFocusBody(pokemon, focus)}</p>
      </section>
    </section>
  );
}
