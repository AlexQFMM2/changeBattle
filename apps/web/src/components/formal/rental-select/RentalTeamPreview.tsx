import {AnimatePresence, motion} from "motion/react";
import type {RentalPokemon} from "../formalRentalTypes";
import {PokemonIcon, displayName} from "../formalUi";
import {rentalPokemonKey} from "./rentalSelectModel";
import "./RentalTeamPreview.css";

export type RentalTeamPreviewEntry = {
  index: number;
  pokemon: RentalPokemon;
};

export function RentalTeamPreview({entries, requiredCount = 3, onToggle}: {entries: RentalTeamPreviewEntry[]; requiredCount?: number; onToggle: (index: number) => void}) {
  return (
    <section className="rental-team-preview" aria-label="已选队伍">
      <header>
        <strong>已选队伍</strong>
        <span>{entries.length}/{requiredCount}</span>
      </header>
      <div className="rental-team-preview-body">
        <div className="rental-team-preview-slots">
          <AnimatePresence mode="popLayout">
            {entries.map(entry => {
              const pokemon = entry.pokemon;
              const key = rentalPokemonKey(pokemon, entry.index);
            return (
              <motion.button
                className="rental-team-preview-slot filled"
                type="button"
                onClick={() => onToggle(entry.index)}
                aria-label={`移回候选 ${displayName(pokemon)}`}
                title={displayName(pokemon)}
                layout
                layoutId={`rental-card-${key}`}
                initial={{opacity: 0, y: 12, scale: 0.82}}
                animate={{opacity: 1, y: 0, scale: 1}}
                exit={{opacity: 0, y: 18, scale: 0.78}}
                whileHover={{scale: 1.1, rotate: -5}}
                whileTap={{scale: 1.03, rotate: -3, y: 1}}
                transition={{type: "spring", stiffness: 420, damping: 32, mass: 0.72}}
                key={key}
              >
                <PokemonIcon pokemon={pokemon} alt={displayName(pokemon)} />
              </motion.button>
            );
          })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
