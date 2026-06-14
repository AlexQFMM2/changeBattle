import type {RentalPokemon} from "@changebattle/shared";
import {PokemonSprite, displayName} from "../../../lib/ui";
import {rentalSpecialBadges} from "./rentalSelectModel";
import "./RentalCandidateCard.css";

export function RentalCandidateCard({pokemon, index, focused, selected, onFocus, onToggle, variant = "list"}: {pokemon: RentalPokemon; index: number; focused: boolean; selected: boolean; onFocus: () => void; onToggle?: () => void; variant?: "list" | "thumbnail"}) {
  const badges = rentalSpecialBadges(pokemon);
  const typeLabels = pokemon.types_zh?.length ? pokemon.types_zh : pokemon.types || [];
  if (variant === "thumbnail") {
    return (
      <button className={`rental-candidate-card rental-candidate-card-thumbnail ${focused ? "focused" : ""} ${selected ? "selected" : ""} ${badges.length ? "special" : ""}`} type="button" onClick={onFocus} aria-label={`${displayName(pokemon)}${selected ? "，已选" : ""}`} title={[displayName(pokemon), ...badges].join(" / ")}>
        <span className="rental-candidate-card-index">{index + 1}</span>
        <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
        {selected ? <em className="rental-candidate-card-check">✓</em> : null}
        {badges.length ? <span className="rental-candidate-card-badges">{badges.slice(0, 2).map(label => <b key={label}>{label}</b>)}</span> : null}
      </button>
    );
  }
  return (
    <article className={`rental-candidate-card ${focused ? "focused" : ""} ${selected ? "selected" : ""} ${badges.length ? "special" : ""}`}>
      <button className="rental-candidate-card-main" type="button" onClick={onFocus} aria-label={`查看 ${displayName(pokemon)}`}>
        <span className="rental-candidate-card-index">{index + 1}</span>
        <PokemonSprite pokemon={pokemon} alt={displayName(pokemon)} badge={false} />
        <span className="rental-candidate-card-copy">
          <strong>{displayName(pokemon)}</strong>
          <small>{typeLabels.join(" / ") || "未知属性"}</small>
        </span>
        {badges.length ? <span className="rental-candidate-card-badges">{badges.slice(0, 2).map(label => <b key={label}>{label}</b>)}</span> : null}
      </button>
      <button className="rental-candidate-card-toggle" type="button" onClick={onToggle}>{selected ? "取消" : "选中"}</button>
    </article>
  );
}
