import type {BattleSystemId, RentalPokemon, RuntimePokemon} from "@changebattle/shared";
import {PokemonSprite, STAT_ROWS, conditionText, displayName, moveDescription, statLine} from "../../lib/ui";
import {MoveCard} from "../move/MoveCard";

const BATTLE_SYSTEM_LABELS: Record<BattleSystemId, string> = {
  mega: "Mega",
  zmove: "Z 招式",
  dynamax: "极巨化",
  terastal: "太晶化",
};

function specialPokemonLabels(pokemon: RentalPokemon): string[] {
  return [
    pokemon.is_mythical ? "幻兽" : "",
    !pokemon.is_mythical && pokemon.is_legendary ? "神兽" : "",
    pokemon.item_battle_system ? BATTLE_SYSTEM_LABELS[pokemon.item_battle_system] : "",
  ].filter(Boolean);
}

function learnSourceLabel(move: RentalPokemon["moves"][number]): string {
  return (move.learn_source_labels || []).join(" / ");
}

function movePp(move: RentalPokemon["moves"][number]): {pp?: number; maxPp?: number} {
  return {
    pp: move.pp,
    maxPp: move.pp,
  };
}

export type PokemonProfileMovePresentation = "detail" | "card";

export function PokemonProfile({pokemon, selected = false, runtime, compact = false, revealTraining = false, movePresentation = "detail"}: {pokemon: RentalPokemon; selected?: boolean; runtime?: RuntimePokemon; compact?: boolean; revealTraining?: boolean; movePresentation?: PokemonProfileMovePresentation}) {
  const specialLabels = specialPokemonLabels(pokemon);
  const hasSpecialItem = Boolean(pokemon.item_battle_system);
  const itemLabel = pokemon.item_zh || "无";
  const itemTitle = hasSpecialItem ? `${itemLabel}：${BATTLE_SYSTEM_LABELS[pokemon.item_battle_system!]} 系统道具` : itemLabel;
  const typeLabels = pokemon.types_zh?.length ? pokemon.types_zh : pokemon.types || [];
  return (
    <div className={`pokemon-profile ${compact ? "compact" : ""} ${specialLabels.length ? "special-profile" : ""}`}>
      <aside className="profile-card">
        <span>No.{pokemon.sprite?.national_dex || "?"}</span>
        {specialLabels.length ? <div className="profile-special-badges">{specialLabels.map(label => <b key={label}>{label}</b>)}</div> : null}
        <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge="full" />
        {typeLabels.length ? <div className="profile-type-row">{typeLabels.map(type => <span key={type}>{type}</span>)}</div> : null}
        <h2>{displayName(pokemon)}</h2>
        <p>{pokemon.species}</p>
        <p>Lv{pokemon.level}</p>
        {selected ? <strong>已选中</strong> : null}
      </aside>
      <section className="profile-info">
        <h3>{pokemon.types_zh.join(" / ")}　{pokemon.nature_zh}</h3>
        <div className="info-strip">
          <span>特性</span>
          <strong>{pokemon.ability_zh}</strong>
          <span className={hasSpecialItem ? "special-item-label" : ""}>道具</span>
          <strong className={hasSpecialItem ? "special-item-value" : ""} title={itemTitle}>{itemLabel}</strong>
          <span>HP</span>
          <strong>{runtime ? conditionText(runtime.condition) : pokemon.stats.hp}</strong>
        </div>
        {hasSpecialItem ? <div className="profile-item-hint">{itemTitle}</div> : null}
        <div className="stat-grid">{STAT_ROWS.map(([stat, label]) => <div key={stat}><span>{label}</span><strong>{statLine(pokemon, stat, revealTraining)}</strong></div>)}</div>
        <div className={`moves-panel ${movePresentation === "card" ? "move-card-panel" : ""}`}>
          {pokemon.moves.map((move, index) => (
            movePresentation === "card" ? (
              <MoveCard
                className="profile-move-card"
                size="sheet"
                name={move.name_zh || move.name || `技能 ${index + 1}`}
                moveType={move.type || move.type_zh}
                typeLabel={move.type_zh || move.type || "一般"}
                category={move.category_zh || move.category || "变化"}
                pp={movePp(move).pp}
                maxPp={movePp(move).maxPp}
                power={move.power || "--"}
                accuracy={move.accuracy ?? "必中"}
                key={`profile-card-${move.id || move.name || index}`}
              />
            ) : (
              <div className="move-detail" key={`profile-detail-${move.id || move.name || index}`}><strong>{move.name_zh}</strong><span>{move.type_zh}/{move.category_zh}</span><span>PP {movePp(move).pp}/{movePp(move).maxPp}</span><span>威力 {move.power || "--"}</span><span>命中 {move.accuracy ?? "必中"}</span>{learnSourceLabel(move) ? <span>来源 {learnSourceLabel(move)}</span> : null}<p>{revealTraining ? moveDescription(move) : "？？？"}</p></div>
            )
          ))}
        </div>
      </section>
    </div>
  );
}
