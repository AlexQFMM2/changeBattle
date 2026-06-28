import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, FormalGameRunV4} from "@changebattle-v2/api";
import {formalStarterCandidateToRentalPokemonV4} from "@changebattle-v2/api";
import {RentalSelectPage} from "./rental-select/RentalSelectPage";
import "./FormalStarterSelectPage.css";

export function FormalStarterSelectPage({api, run, onRunChange, onDone, onBack}: {
  api: ChangeBattleV2Api;
  run: FormalGameRunV4;
  onRunChange: (run: FormalGameRunV4) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<number[]>(run.selectedStarterIndexes || []);
  const [focusIndex, setFocusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const requiredCount = api.selectedCountForFormalMode(run.mode);
  const candidates = useMemo(() => run.starterCandidates.map(formalStarterCandidateToRentalPokemonV4), [run.starterCandidates]);

  function toggle(index: number) {
    setError(null);
    setSelected(current => {
      if (current.includes(index)) return current.filter(value => value !== index);
      if (current.length >= requiredCount) return [...current.slice(1), index];
      return [...current, index];
    });
  }

  function randomSelect() {
    setError(null);
    const indexes = run.starterCandidates.map((_candidate, index) => index);
    setSelected(indexes.sort(() => Math.random() - 0.5).slice(0, requiredCount));
  }

  async function start() {
    try {
      const next = api.selectFormalStarterPokemon(run, selected);
      const saved = await api.saveFormalGameRun(next);
      onRunChange(saved);
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "选择初始队伍失败。");
    }
  }

  return (
    <section className="formal-starter-select-page">
      <button className="formal-starter-select-back" type="button" onClick={onBack}>返回主页</button>
      <RentalSelectPage
        candidates={candidates}
        selected={selected}
        focusIndex={focusIndex}
        setFocusIndex={setFocusIndex}
        onToggle={toggle}
        onStart={start}
        onBack={onBack}
        runSeed={seedNumber(run.seed)}
        requiredCount={requiredCount}
        revealTraining
        onRandomSelect={randomSelect}
        onClearSelected={() => setSelected([])}
        showScoutControls={false}
      />
      {error ? <div className="formal-starter-select-error" role="alert">{error}</div> : null}
    </section>
  );
}

function seedNumber(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(31, hash) + seed.charCodeAt(index) | 0;
  }
  return Math.abs(hash);
}
