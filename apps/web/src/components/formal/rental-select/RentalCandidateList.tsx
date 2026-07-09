import {AnimatePresence} from "motion/react";
import type {RentalPokemon} from "../formalRentalTypes";
import {RentalCandidateCard} from "./RentalCandidateCard";
import {rentalPokemonKey} from "./rentalSelectModel";
import "./RentalCandidateList.css";

export function RentalCandidateList({candidates, selected, focusIndex, onFocus, onToggle, variant = "list", soulmateSlotCount = 0}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; onFocus: (index: number) => void; onToggle: (index: number) => void; variant?: "list" | "thumbnail"; soulmateSlotCount?: number}) {
  if (!candidates.length) {
    return (
      <section className="rental-candidate-list empty">
        <strong>正在生成候选</strong>
        <span>请稍候，租赁队伍数据准备中。</span>
      </section>
    );
  }
  const entries = candidates.map((pokemon, index) => ({pokemon, index}));
  const soulmateEntries = entries.filter(entry => isSoulmateCandidate(entry.pokemon)).slice(0, Math.max(0, soulmateSlotCount));
  const regularEntries = entries.filter(entry => !isSoulmateCandidate(entry.pokemon));
  const visibleRegularEntries = variant === "thumbnail" ? regularEntries.filter(entry => !selected.includes(entry.index)) : regularEntries;
  const visibleSoulmateEntries = variant === "thumbnail" ? soulmateEntries : [];
  const columnCount = Math.max(6, Math.min(12, visibleRegularEntries.length || regularEntries.length || candidates.length));
  const listClassName = `rental-candidate-list ${variant === "thumbnail" ? "thumbnail" : ""} ${soulmateSlotCount > 0 && variant === "thumbnail" ? "with-soulmate-slots" : ""} columns-${columnCount}`;
  return (
    <section className={listClassName} aria-label="租赁候选列表">
      <div className="rental-candidate-list-regular">
        <AnimatePresence mode="popLayout">
          {visibleRegularEntries.map(({pokemon, index}) => (
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
      {variant === "thumbnail" && soulmateSlotCount > 0 ? (
        <aside className="rental-candidate-soulmate-rail" aria-label="同行许可候选">
          {Array.from({length: Math.max(0, soulmateSlotCount)}).map((_, slotIndex) => {
            const entry = visibleSoulmateEntries[slotIndex];
            return entry ? (
              <RentalCandidateCard
                pokemon={entry.pokemon}
                index={entry.index}
                focused={entry.index === focusIndex}
                selected={selected.includes(entry.index)}
                onFocus={() => onFocus(entry.index)}
                onToggle={() => onToggle(entry.index)}
                variant="thumbnail"
                key={rentalPokemonKey(entry.pokemon, entry.index)}
              />
            ) : <SoulmateEmptySlot key={`soulmate-empty-${slotIndex}`} />;
          })}
        </aside>
      ) : null}
    </section>
  );
}

function isSoulmateCandidate(pokemon: RentalPokemon): boolean {
  return pokemon.starter_source_kind === "soulmate-vault";
}

function SoulmateEmptySlot() {
  return (
    <div className="rental-candidate-soulmate-empty" aria-label="同行许可空位">
      <span>同行</span>
    </div>
  );
}
