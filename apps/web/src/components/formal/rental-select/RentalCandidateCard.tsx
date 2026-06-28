import {motion} from "motion/react";
import type {RentalPokemon} from "../formalRentalTypes";
import {PokemonIcon, PokemonSprite, displayName} from "../formalUi";
import {rentalPokemonKey, rentalSpecialBadges} from "./rentalSelectModel";
import "./RentalCandidateCard.css";

export function RentalCandidateCard({pokemon, index, focused, selected, onFocus, onToggle, variant = "list"}: {pokemon: RentalPokemon; index: number; focused: boolean; selected: boolean; onFocus: () => void; onToggle?: () => void; variant?: "list" | "thumbnail"}) {
  const badges = rentalSpecialBadges(pokemon);
  const typeLabels = pokemon.types_zh?.length ? pokemon.types_zh : pokemon.types || [];
  if (variant === "thumbnail") {
    return (
      <motion.button
        className={`rental-candidate-card rental-candidate-card-thumbnail ${focused ? "focused" : ""} ${selected ? "selected" : ""} ${badges.length ? "special" : ""}`}
        type="button"
        onClick={() => {
          onFocus();
          onToggle?.();
        }}
        aria-label={`选择 ${displayName(pokemon)}`}
        title={[displayName(pokemon), ...badges].join(" / ")}
        layout
        layoutId={`rental-card-${rentalPokemonKey(pokemon, index)}`}
        initial={{opacity: 0, y: 18, scale: 0.78}}
        animate={{opacity: 1, y: 0, scale: 1}}
        exit={{opacity: 0, y: -16, scale: 0.78}}
        whileHover={{scale: 1.1, rotate: -5}}
        whileTap={{scale: 1.03, rotate: -3, y: 1}}
        transition={{type: "spring", stiffness: 420, damping: 32, mass: 0.72}}
      >
        <PokemonIcon className="rental-candidate-thumbnail-icon" pokemon={pokemon} alt={displayName(pokemon)} />
      </motion.button>
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
