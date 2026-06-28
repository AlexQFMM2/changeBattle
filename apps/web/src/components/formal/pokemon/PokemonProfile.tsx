import {useMemo, useState, type CSSProperties} from "react";
import type {RentalPokemon} from "../formalRentalTypes";
import {MoveCard} from "../move/MoveCard";
import {PokemonSprite, displayName} from "../formalUi";
import "./PokemonProfile.css";

const STAT_ROWS = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
] as const;

type DetailTab = "basic" | "stats" | "moves";

export type PokemonProfileMovePresentation = "detail" | "card";

export function PokemonProfile({pokemon, selected = false}: {pokemon: RentalPokemon; selected?: boolean; compact?: boolean; revealTraining?: boolean; movePresentation?: PokemonProfileMovePresentation}) {
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
      {tab === "stats" ? <FormalPokemonStats pokemon={pokemon} /> : null}
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
      <div className="formal-pokemon-basic-facts">
        <div><span>全国图鉴</span><strong>No.{pokemon.sprite?.national_dex || "?"}</strong></div>
        <div><span>定位</span><strong>{pokemon.role_zh || pokemon.role || "候选"}</strong></div>
        <div><span>身高</span><strong>{pokemon.heightm ? `${pokemon.heightm}m` : "--"}</strong></div>
        <div><span>体重</span><strong>{pokemon.weightkg ? `${pokemon.weightkg}kg` : "--"}</strong></div>
      </div>
    </section>
  );
}

function typeClassId(value: unknown): string {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (normalized) return normalized;
  return TYPE_ID_BY_ZH[raw] || "normal";
}

const TYPE_ID_BY_ZH: Record<string, string> = {
  一般: "normal",
  普通: "normal",
  火: "fire",
  水: "water",
  电: "electric",
  草: "grass",
  冰: "ice",
  格斗: "fighting",
  毒: "poison",
  地面: "ground",
  飞行: "flying",
  超能力: "psychic",
  虫: "bug",
  岩石: "rock",
  幽灵: "ghost",
  龙: "dragon",
  恶: "dark",
  钢: "steel",
  妖精: "fairy",
};

function FormalPokemonStats({pokemon}: {pokemon: RentalPokemon}) {
  const maxStats = useMemo(() => {
    return STAT_ROWS.reduce((max, [stat]) => Math.max(max, Number(pokemon.stats?.[stat] || 0)), 1);
  }, [pokemon.stats]);
  return (
    <section className="formal-pokemon-stats-tab">
      <dl className="formal-pokemon-stat-list">
        {STAT_ROWS.map(([stat, label]) => {
          const value = Number(pokemon.stats?.[stat] || 0);
          const statRate = Math.max(4, Math.min(100, value / maxStats * 100));
          return (
            <div className={`formal-pokemon-stat-row stat-tone-${stat}`} key={stat}>
              <dt>{label}</dt>
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
            key={`${move.id || move.name || index}`}
          />
        ))}
      </div>
    </section>
  );
}
