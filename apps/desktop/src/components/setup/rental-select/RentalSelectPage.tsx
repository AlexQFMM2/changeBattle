import {useEffect} from "react";
import type {RentalPokemon} from "@changebattle/shared";
import {RentalActionBar} from "./RentalActionBar";
import {RentalCandidateList} from "./RentalCandidateList";
import {RentalPokemonDetail} from "./RentalPokemonDetail";
import {RentalTeamPreview} from "./RentalTeamPreview";
import {ScoutControls} from "./ScoutControls";
import {rentalOriginLabel} from "./rentalSelectModel";
import "./RentalSelectPage.css";

export type RentalSelectPageProps = {
  candidates: RentalPokemon[];
  selected: number[];
  focusIndex: number;
  setFocusIndex: (index: number) => void;
  onToggle: (index: number) => void;
  onStart: () => void | Promise<void>;
  onBack?: () => void | Promise<void>;
  onReroll?: () => void | Promise<void>;
  onSingleReroll?: () => void | Promise<void>;
  onInspect?: () => void;
  runSeed?: number;
  wholeRerollsRemaining?: number;
  singleRerollsRemaining?: number;
  inspectRemaining?: number;
  revealTraining?: boolean;
  inspected?: boolean;
};

export function RentalSelectPage({candidates, selected, focusIndex, setFocusIndex, onToggle, onStart, onBack, onReroll, onSingleReroll, onInspect, runSeed, wholeRerollsRemaining = 0, singleRerollsRemaining = 0, inspectRemaining = 0, revealTraining = false, inspected = false}: RentalSelectPageProps) {
  const safeFocusIndex = candidates[focusIndex] ? focusIndex : 0;
  const focusedPokemon = candidates[safeFocusIndex] || null;
  const selectedTeam = selected.map(index => candidates[index]).filter((pokemon): pokemon is RentalPokemon => Boolean(pokemon)).slice(0, 3);

  useEffect(() => {
    if (candidates.length && focusIndex !== safeFocusIndex) setFocusIndex(safeFocusIndex);
  }, [candidates.length, focusIndex, safeFocusIndex, setFocusIndex]);

  return (
    <div className="rental-select-page">
      <RentalActionBar selectedCount={selectedTeam.length} candidateCount={candidates.length} focusIndex={safeFocusIndex} runSeed={runSeed} originLabel={rentalOriginLabel(focusedPokemon || undefined)} onStart={onStart} />
      <main className="rental-select-page-main">
        <RentalPokemonDetail pokemon={focusedPokemon} selected={selected.includes(safeFocusIndex)} revealTraining={revealTraining} onToggle={() => focusedPokemon ? onToggle(safeFocusIndex) : undefined} />
        <aside className="rental-select-page-side">
          <RentalTeamPreview team={selectedTeam} />
          <ScoutControls
            onBack={onBack}
            onReroll={onReroll}
            onSingleReroll={onSingleReroll}
            onInspect={onInspect}
            wholeRerollsRemaining={wholeRerollsRemaining}
            singleRerollsRemaining={singleRerollsRemaining}
            inspectRemaining={inspectRemaining}
            inspected={inspected}
          />
        </aside>
      </main>
      <RentalCandidateList candidates={candidates} selected={selected} focusIndex={safeFocusIndex} onFocus={setFocusIndex} onToggle={onToggle} variant="thumbnail" />
    </div>
  );
}
