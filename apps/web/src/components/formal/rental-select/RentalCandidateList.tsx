import {AnimatePresence} from "motion/react";
import type {RentalPokemon} from "../formalRentalTypes";
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
  const columnCount = Math.max(6, Math.min(12, candidates.length));
  const visibleCandidates = variant === "thumbnail" ? candidates.map((pokemon, index) => ({pokemon, index})).filter(entry => !selected.includes(entry.index)) : candidates.map((pokemon, index) => ({pokemon, index}));
  return (
    <section className={`rental-candidate-list ${variant === "thumbnail" ? "thumbnail" : ""} columns-${columnCount}`} aria-label="租赁候选列表">
      <AnimatePresence mode="popLayout">
        {visibleCandidates.map(({pokemon, index}) => (
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
      </AnimatePresence>
    </section>
  );
}
