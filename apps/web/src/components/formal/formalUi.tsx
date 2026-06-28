import type {RentalPokemon} from "./formalRentalTypes";
import type {CSSProperties} from "react";
import "./PokemonSprite.css";

export const STAT_ROWS = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
] as const;

export function displayName(pokemon: RentalPokemon): string {
  return pokemon.species_zh || pokemon.name || pokemon.species || pokemon.species_id;
}

export function statLine(pokemon: RentalPokemon, stat: string, revealTraining: boolean): string {
  if (!revealTraining) return "？？？";
  const value = pokemon.stats?.[stat];
  return typeof value === "number" ? String(value) : "--";
}

export function conditionText(condition: string | undefined): string {
  return condition || "正常";
}

export function moveDescription(move: RentalPokemon["moves"][number]): string {
  return move.desc_zh || move.short_desc_zh || move.desc || move.short_desc || "";
}

export function PokemonSprite({pokemon, alt, badge = false, className}: {pokemon: RentalPokemon; alt: string; badge?: boolean | "full"; className?: string}) {
  const spriteUrl = pokemon.shiny ? pokemon.sprite?.front_shiny || pokemon.sprite?.front_default : pokemon.sprite?.front_default;
  return (
    <span className={["pokemon-sprite", badge === "full" ? "pokemon-sprite-full" : "", className || ""].filter(Boolean).join(" ")}>
      {spriteUrl ? <img src={spriteUrl} alt={alt} draggable={false} /> : <span>{pokemon.species_zh?.slice(0, 1) || "?"}</span>}
      {badge ? <i>{pokemon.level}</i> : null}
    </span>
  );
}

export function PokemonIcon({pokemon, alt, className}: {pokemon: RentalPokemon; alt: string; className?: string}) {
  if (pokemon.sprite?.icon_style) {
    return <span className={["pokemon-icon", "picon", className || ""].filter(Boolean).join(" ")} aria-label={alt} style={styleFromCss(pokemon.sprite.icon_style)} />;
  }
  const iconUrl = pokemon.sprite?.icon;
  if (iconUrl && !iconUrl.includes("pokemonicons-sheet")) {
    return <span className={["pokemon-icon", className || ""].filter(Boolean).join(" ")}><img src={iconUrl} alt={alt} draggable={false} /></span>;
  }
  return <span className={["pokemon-icon", "empty", className || ""].filter(Boolean).join(" ")} aria-label={alt}>{pokemon.species_zh?.slice(0, 1) || "?"}</span>;
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
