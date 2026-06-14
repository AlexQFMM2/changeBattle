import type {RentalPokemon} from "@changebattle/shared";
import {RentalCandidateCard} from "./RentalCandidateCard";
import {rentalPokemonKey} from "./rentalSelectModel";
import "./RentalCandidateList.css";

export function RentalCandidateList({candidates, selected, focusIndex, onFocus, onToggle, variant = "list"}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; onFocus: (index: number) => void; onToggle: (index: number) => void; variant?: "list" | "thumbnail"}) {
  if (!candidates.length) {
    return (
      <section className="rental-candidate-list empty">
        <strong>正在生成候选</strong>
        <span>请稍候，租赁队伍数据准备中。</span>
      </section>
    );
  }
  return (
    <section className={`rental-candidate-list ${variant === "thumbnail" ? "thumbnail" : ""} columns-${candidates.length <= 6 ? 6 : 12}`} aria-label="租赁候选列表">
      {candidates.map((pokemon, index) => (
        <RentalCandidateCard
          pokemon={pokemon}
          index={index}
          focused={index === focusIndex}
          selected={selected.includes(index)}
          onFocus={() => onFocus(index)}
          onToggle={() => onToggle(index)}
          variant={variant}
          key={rentalPokemonKey(pokemon, index)}
        />
      ))}
    </section>
  );
}
