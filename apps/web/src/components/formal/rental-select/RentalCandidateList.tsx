import {AnimatePresence} from "motion/react";
import type {RentalPokemon} from "../formalRentalTypes";
import {RentalCandidateCard} from "./RentalCandidateCard";
import {rentalPokemonKey} from "./rentalSelectModel";
import "./RentalCandidateList.css";

export function RentalCandidateList({candidates, selected, focusIndex, onFocus, onToggle, variant = "list"}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; onFocus: (index: number) => void; onToggle: (index: number) => void; variant?: "list" | "thumbnail"; soulmateSlotCount?: number}) {
  if (!candidates.length) {
    return (
      <section className="rental-candidate-list empty">
        <strong>正在生成候选</strong>
        <span>请稍候，租赁队伍数据准备中。</span>
      </section>
    );
  }
  const entries = candidates.map((pokemon, index) => ({pokemon, index}));
  const visibleEntries = variant === "thumbnail" ? entries.filter(entry => !selected.includes(entry.index)) : entries;
  const columnCount = Math.max(6, Math.min(12, visibleEntries.length || candidates.length));
  const listClassName = `rental-candidate-list ${variant === "thumbnail" ? "thumbnail" : ""} columns-${columnCount}`;
  return (
    <section className={listClassName} aria-label="租赁候选列表">
      <div className="rental-candidate-list-regular">
        <AnimatePresence mode="popLayout">
          {visibleEntries.map(({pokemon, index}) => (
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
      </div>
    </section>
  );
}
