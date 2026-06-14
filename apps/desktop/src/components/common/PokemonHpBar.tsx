import type {CSSProperties} from "react";
import "./PokemonHpBar.css";

export type PokemonHpBarTone = "high" | "mid" | "low";

export function pokemonHpTone(current: number, max: number): PokemonHpBarTone {
  if (!max || max <= 0) return "low";
  const ratio = current / max;
  if (ratio > 0.5) return "high";
  if (ratio >= 0.2) return "mid";
  return "low";
}

export function PokemonHpBar({current, max, text, className = ""}: {current: number; max: number; text?: string; className?: string}) {
  const safeCurrent = Number.isFinite(current) ? Math.max(0, current) : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const percent = Math.max(0, Math.min(100, (safeCurrent / safeMax) * 100));
  const tone = pokemonHpTone(safeCurrent, safeMax);
  return (
    <span className={`pokemon-hp-bar pokemon-hp-bar-${tone} ${className}`} title={text || `${safeCurrent}/${safeMax}`}>
      <b style={{width: `${percent}%`} as CSSProperties} />
    </span>
  );
}
