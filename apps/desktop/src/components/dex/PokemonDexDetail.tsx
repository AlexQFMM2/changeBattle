import {useEffect, useState} from "react";
import type {ReactNode} from "react";
import type {DesktopDexEntry, MoveSummary} from "@changebattle/shared";
import {MoveCard} from "../move/MoveCard";
import {STAT_ROWS} from "../../lib/ui";
import {POKEMON_INFO_TAB_ID, groupLearnsetBySource, pokemonDexDetailTabs} from "./learnsetGroups";
import {dexSpriteUrl, pokemonMetaLabel, type DexAbilitySummary, type DexVariant} from "./dexModel";
import "./PokemonDexDetail.css";

export function PokemonDexDetail({entry, variant = "full", action = null, onMoveSelect, onAbilitySelect}: {entry: DesktopDexEntry; variant?: DexVariant; action?: ReactNode; onMoveSelect?: (move: MoveSummary) => void; onAbilitySelect: (ability: DexAbilitySummary) => void}) {
  const [pokemonTab, setPokemonTab] = useState(POKEMON_INFO_TAB_ID);
  useEffect(() => {
    setPokemonTab(POKEMON_INFO_TAB_ID);
  }, [entry.category, entry.id]);
  const learnsetGroups = groupLearnsetBySource(entry.learnset || []);
  const pokemonTabs = pokemonDexDetailTabs(entry.learnset || []);
  const activePokemonTab = pokemonTabs.some(tab => tab.id === pokemonTab) ? pokemonTab : POKEMON_INFO_TAB_ID;
  const activeLearnsetGroup = learnsetGroups.find(group => group.id === activePokemonTab) || null;
  return (
    <>
      <div className={variant === "quick" ? "quick-dex-pokemon-tab-bar" : "dex-pokemon-tab-bar"}>
        <nav className={variant === "quick" ? "quick-dex-pokemon-subtabs" : "dex-pokemon-subtabs"}>
          {pokemonTabs.map(tab => (
            <button className={activePokemonTab === tab.id ? "selected" : ""} onClick={() => setPokemonTab(tab.id)} key={`${entry.id}-${tab.id}`}>
              <span>{tab.label}</span>
              {tab.count !== undefined ? <small>{tab.count}</small> : null}
            </button>
          ))}
        </nav>
        {action}
      </div>
      <div className={variant === "quick" ? "quick-dex-pokemon-tab-panel" : "dex-pokemon-tab-panel"}>
        {activePokemonTab === POKEMON_INFO_TAB_ID ? (
          <PokemonDexInfo entry={entry} variant={variant} onAbilitySelect={onAbilitySelect} />
        ) : (
          <PokemonDexLearnset entry={entry} variant={variant} group={activeLearnsetGroup} onMoveSelect={onMoveSelect} />
        )}
      </div>
    </>
  );
}

function PokemonDexInfo({entry, variant, onAbilitySelect}: {entry: DesktopDexEntry; variant: DexVariant; onAbilitySelect: (ability: DexAbilitySummary) => void}) {
  const sprite = dexSpriteUrl(entry);
  const rootClass = variant === "quick" ? "quick-dex-pokemon-info" : "dex-pokemon-info";
  const identityClass = variant === "quick" ? "quick-dex-pokemon-identity" : "dex-pokemon-identity";
  const badgesClass = variant === "quick" ? "quick-dex-badges" : "dex-type-row";
  const statClass = variant === "quick" ? "quick-dex-stat-grid" : "dex-stat-grid";
  const abilityClass = variant === "quick" ? "quick-dex-ability-panel" : "dex-ability-panel";
  const descClass = variant === "quick" ? "quick-dex-description" : "dex-entry-meta";
  return (
    <div className={rootClass}>
      <section className={identityClass}>
        {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : null}
        <div>
          <h3>{entry.name_zh || entry.name}</h3>
          <p>{variant === "quick" ? `${entry.name} / ${entry.id}` : `${entry.name}　${entry.id}`}（使用次数{entry.usage_count || 0}）</p>
        </div>
      </section>
      <div className={badgesClass}>{(entry.types_zh || entry.types || []).map(type => <span key={type}>{type}</span>)}</div>
      {pokemonMetaLabel(entry) ? <p className={descClass}>{pokemonMetaLabel(entry)}</p> : null}
      {entry.base_stats ? <div className={statClass}>{STAT_ROWS.map(([stat, label]) => variant === "quick" ? <p key={stat}><span>{label}</span><strong>{entry.base_stats?.[stat] || 0}</strong></p> : <div key={stat}><span>{label}</span><strong>{entry.base_stats?.[stat] || 0}</strong></div>)}</div> : null}
      <section className={abilityClass}>
        <h4>可能特性</h4>
        <div>
          {(entry.abilities || []).map(ability => (
            <button onClick={() => onAbilitySelect(ability)} key={ability.id}>
              <strong>{ability.name_zh || ability.name}</strong>
              {ability.hidden ? <span>隐藏</span> : null}
              <small>{ability.desc_zh || ability.name}</small>
            </button>
          ))}
          {!entry.abilities?.length ? (variant === "quick" ? <small>暂无特性数据。</small> : <p>暂无特性数据。</p>) : null}
        </div>
      </section>
    </div>
  );
}

function PokemonDexLearnset({entry, variant, group, onMoveSelect}: {entry: DesktopDexEntry; variant: DexVariant; group: ReturnType<typeof groupLearnsetBySource>[number] | null; onMoveSelect?: (move: MoveSummary) => void}) {
  if (!group) return <div className={variant === "quick" ? "quick-dex-learnset" : "dex-learnset-panel empty"}>{variant === "quick" ? <small>暂无技能池数据。</small> : <p>暂无技能池数据。</p>}</div>;
  if (variant === "quick") {
    return (
      <div className="quick-dex-learnset">
        <section className="quick-dex-learnset-group">
          <h4><span>{group.label}</span><small>{group.moves.length}</small></h4>
          <div>
            {group.moves.map(move => (
              <MoveCard
                size="dex"
                className="quick-dex-move-card"
                name={move.name_zh || move.name}
                moveType={move.type || move.type_zh}
                typeLabel={move.type_zh || move.type || "一般"}
                category={move.category_zh || move.category || "变化"}
                pp={move.pp || "--"}
                power={move.power || "--"}
                accuracy={move.accuracy ?? "必中"}
                onClick={() => onMoveSelect?.(move)}
                key={`${entry.id}-${group.id}-${move.id}`}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="dex-learnset-panel">
      <section className="dex-learnset-group">
        <h5><span>{group.label}</span><small>{group.moves.length}</small></h5>
        <div>
          {group.moves.map(move => (
            <article key={`${entry.id}-${group.id}-${move.id}`}>
              <strong>{move.name_zh || move.name}</strong>
              <span>{move.type_zh || move.type} / {move.category_zh || move.category}</span>
              <small>威力 {move.power || "--"}　命中 {move.accuracy ?? "必中"}　PP {move.pp || "--"}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
