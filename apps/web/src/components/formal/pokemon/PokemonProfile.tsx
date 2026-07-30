import {useMemo, useState, type CSSProperties} from "react";
import {dexLabelToId, type ChangeBattleV2Api} from "@changebattle-v2/api";
import type {RentalPokemon} from "../formalRentalTypes";
import {MoveCard} from "../move/MoveCard";
import {PokemonSprite, displayName} from "../formalUi";
import "./PokemonProfile.css";

const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type DetailTab = "basic" | "stats" | "moves";

export type PokemonProfileMovePresentation = "detail" | "card";

export function PokemonProfile({api, pokemon, selected = false}: {api: ChangeBattleV2Api; pokemon: RentalPokemon; selected?: boolean; compact?: boolean; revealTraining?: boolean; movePresentation?: PokemonProfileMovePresentation}) {
  const [tab, setTab] = useState<DetailTab>("basic");
  return (
    <article className="formal-pokemon-profile">
      <header className="formal-pokemon-profile-tabs" aria-label="宝可梦详情分类">
        <button className={tab === "basic" ? "active" : ""} type="button" onClick={() => setTab("basic")}>基础信息</button>
        <button className={tab === "stats" ? "active" : ""} type="button" onClick={() => setTab("stats")}>能力值</button>
        <button className={tab === "moves" ? "active" : ""} type="button" onClick={() => setTab("moves")}>技能</button>
        {selected ? <span>已选中</span> : null}
      </header>
      {tab === "basic" ? <FormalPokemonBasic pokemon={pokemon} /> : null}
      {tab === "stats" ? <FormalPokemonStats api={api} pokemon={pokemon} /> : null}
      {tab === "moves" ? <FormalPokemonMoves pokemon={pokemon} /> : null}
    </article>
  );
}

function FormalPokemonBasic({pokemon}: {pokemon: RentalPokemon}) {
  const typeLabels = pokemon.types_zh?.length ? pokemon.types_zh : pokemon.types || [];
  return (
    <section className="formal-pokemon-basic-tab">
      <div className="formal-pokemon-basic-identity">
        <h3>{displayName(pokemon)} <small>Lv.{pokemon.level}</small></h3>
        <div className="formal-pokemon-basic-body">
          <PokemonSprite className="formal-pokemon-detail-sprite" pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
          <div className="formal-pokemon-basic-namebox">
            <div className="formal-pokemon-type-row">
              {typeLabels.map((type, index) => <b className={`type-${typeClassId(pokemon.types?.[index] || type)}`} key={`${type}-${index}`}>{type}</b>)}
            </div>
            <span>特性：{pokemon.ability_zh || pokemon.ability || "未知"}</span>
            <span>性格：{pokemon.nature_zh || pokemon.nature || "未知"}</span>
            <span>道具：{pokemon.item_zh || "无"}</span>
          </div>
        </div>
      </div>
      <div className="formal-pokemon-basic-moves" aria-label="技能概览">
        {pokemon.moves.slice(0, 4).map((move, index) => (
          <FormalPokemonMoveCard move={move} index={index} compact key={`${move.id || move.name || index}`} />
        ))}
      </div>
    </section>
  );
}

function typeClassId(value: unknown): string {
  return dexLabelToId("types", String(value || "")) || "normal";
}

function FormalPokemonStats({api, pokemon}: {api: ChangeBattleV2Api; pokemon: RentalPokemon}) {
  const calculatedStats = useMemo(() => {
    try {
      return api.dex.calculatePokemonStats({
        speciesId: pokemon.species_id,
        level: pokemon.level,
        nature: pokemon.nature || "Serious",
        evs: pokemon.evs,
        ivs: pokemon.ivs,
      }).stats;
    } catch {
      return pokemon.stats || {};
    }
  }, [api, pokemon.evs, pokemon.ivs, pokemon.level, pokemon.nature, pokemon.species_id, pokemon.stats]);
  const maxPotentialStats = useMemo(() => {
    return api.dex.getPokemonMaxStats({
      speciesId: pokemon.species_id,
      level: pokemon.level,
    }).stats;
  }, [api, pokemon.level, pokemon.species_id]);
  return (
    <section className="formal-pokemon-stats-tab">
      <dl className="formal-pokemon-stat-list">
        {STAT_IDS.map(stat => {
          const value = Number(calculatedStats?.[stat] || pokemon.stats?.[stat] || 0);
          const statMax = Math.max(Number(maxPotentialStats?.[stat] || value || 1), 1);
          const statRate = Math.max(4, Math.min(100, value / statMax * 100));
          return (
            <div className={`formal-pokemon-stat-row stat-tone-${stat}`} key={stat}>
              <dt>{api.translateDexLabel("stats", stat)}</dt>
              <dd>
                <strong style={{"--formal-pokemon-profile-stat-rate": `${statRate}%`} as CSSProperties}>
                  <span>{value}</span>
                  <i aria-hidden="true" />
                </strong>
                <span>{pokemon.ivs?.[stat] ?? "--"}</span>
                <span>{pokemon.evs?.[stat] ?? "--"}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function FormalPokemonMoves({pokemon}: {pokemon: RentalPokemon}) {
  return (
    <section className="formal-pokemon-moves-tab">
      <div className="formal-pokemon-move-grid">
        {pokemon.moves.map((move, index) => (
          <FormalPokemonMoveCard move={move} index={index} key={`${move.id || move.name || index}`} />
        ))}
      </div>
    </section>
  );
}

function FormalPokemonMoveCard({move, index, compact = false}: {move: RentalPokemon["moves"][number]; index: number; compact?: boolean}) {
  return (
    <MoveCard
      className="formal-profile-move-card"
      size="sheet"
      name={move.name_zh || move.name || `技能 ${index + 1}`}
      moveType={move.type || move.type_zh}
      typeLabel={move.type_zh || move.type || "一般"}
      category={move.category_zh || move.category || "变化"}
      pp={move.pp}
      maxPp={move.pp}
      power={move.power || "--"}
      accuracy={move.accuracy ?? "必中"}
      meta={compact ? [`威力 ${move.power || "--"}`, `命中 ${move.accuracy ?? "必中"}`] : undefined}
    />
  );
}
