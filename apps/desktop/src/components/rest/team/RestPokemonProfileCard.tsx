import type {PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import type {CSSProperties} from "react";
import {PokemonSprite, displayName} from "../../../lib/ui";
import {restPokemonHpModel, restPokemonLevelLabel, restPokemonStatusLabel} from "./restTeamModel";
import "./RestPokemonProfileCard.css";

export function RestPokemonProfileCard({pokemon, state}: {pokemon: RentalPokemon; state?: PlayerPokemonState}) {
  const hp = restPokemonHpModel(state);
  const status = restPokemonStatusLabel(state);
  const typeLabels = pokemon.types_zh?.length ? pokemon.types_zh : pokemon.types || [];
  return (
    <section className="rest-pokemon-profile-card">
      <header>
        <span>No.{pokemon.sprite?.national_dex || "?"}</span>
        <span>{restPokemonLevelLabel(pokemon)}</span>
        {pokemon.shiny ? <b>闪光</b> : null}
      </header>
      <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
      <h3>{displayName(pokemon)}</h3>
      <p>{pokemon.species}</p>
      <div className="rest-pokemon-profile-types">{typeLabels.map(type => <span key={type}>{type}</span>)}</div>
      <div className="rest-pokemon-profile-hp">
        <span>HP</span>
        <strong>{hp.text}</strong>
        <i><b className={`hp-${hp.tone}`} style={{width: `${hp.percent}%`} as CSSProperties} /></i>
      </div>
      <dl>
        <div><dt>性格</dt><dd>{pokemon.nature_zh || pokemon.nature || "未知"}</dd></div>
        <div><dt>等级</dt><dd>{restPokemonLevelLabel(pokemon)}</dd></div>
        <div><dt>特性</dt><dd>{pokemon.ability_zh || pokemon.ability}</dd></div>
        <div><dt>道具</dt><dd>{pokemon.item_zh || "无"}</dd></div>
        {status ? <div><dt>状态</dt><dd>{status}</dd></div> : null}
      </dl>
    </section>
  );
}
