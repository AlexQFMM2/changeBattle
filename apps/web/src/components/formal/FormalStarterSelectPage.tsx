import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, FormalGameRunV4} from "@changebattle-v2/api";
import {formalStarterCandidateToRentalPokemonV4} from "@changebattle-v2/api";
import {RentalSelectPage} from "./rental-select/RentalSelectPage";
import {loadFormalRoomCredential} from "../../lib/formalRoomCredential";
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
  const soulmateSlotCount = api.soulmateVaultStarterSlotCountForStarChartV4(run.starChartSnapshot);
  const candidates = useMemo(() => run.starterCandidates.map(candidate => {
    const pokemon = formalStarterCandidateToRentalPokemonV4(candidate, api.dex);
    try {
      return {
        ...pokemon,
        stats: api.dex.calculatePokemonStats({
          speciesId: candidate.pokemon.speciesId,
          level: candidate.pokemon.level,
          nature: candidate.pokemon.nature,
          evs: candidate.pokemon.evs,
          ivs: candidate.pokemon.ivs,
        }).stats,
      };
    } catch {
      return pokemon;
    }
  }), [api, run.starterCandidates]);

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
    setSelected(pickStarterIndexesWithQualityFloor(run.starterCandidates, requiredCount));
  }

  async function start() {
    try {
      const credential = loadFormalRoomCredential();
      const next = credential
        ? await selectServerRoomStarters(api, credential.roomId, credential.roomToken, selected)
        : api.selectFormalStarterPokemon(run, selected);
      if (credential) {
        onRunChange(next);
        onDone();
        return;
      }
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
        api={api}
        candidates={candidates}
        selected={selected}
        focusIndex={focusIndex}
        setFocusIndex={setFocusIndex}
        onToggle={toggle}
        onStart={start}
        onBack={onBack}
        runSeed={seedNumber(run.seed)}
        requiredCount={requiredCount}
        soulmateSlotCount={soulmateSlotCount}
        revealTraining
        onRandomSelect={randomSelect}
        onClearSelected={() => setSelected([])}
        showScoutControls={false}
      />
      {error ? <div className="formal-starter-select-error" role="alert">{error}</div> : null}
    </section>
  );
}

async function selectServerRoomStarters(api: ChangeBattleV2Api, roomId: string, roomToken: string, selectedIndexes: number[]): Promise<FormalGameRunV4> {
  const credential = loadFormalRoomCredential();
  if (credential?.matchId) {
    const result = await api.submitFormalRoomMatchCommand({
      roomId,
      roomToken,
      matchId: credential.matchId,
      actionName: "rooms.matches.commands.selectStarters",
      commandId: `starter-${credential.matchId}`,
      payload: {selectedIndexes},
    });
    if (!result.ok) throw new Error(result.message);
    const run = result.data.view.formalRun;
    if (!run) throw new Error("房间内对局尚未开始。");
    return run;
  }
  const result = await api.selectFormalRoomStarters({roomId, roomToken, selectedIndexes});
  if (!result.ok) throw new Error(result.message);
  if (!result.data.formalRun) throw new Error("房间内对局尚未开始。");
  return result.data.formalRun;
}

function seedNumber(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(31, hash) + seed.charCodeAt(index) | 0;
  }
  return Math.abs(hash);
}

function pickStarterIndexesWithQualityFloor(candidates: FormalGameRunV4["starterCandidates"], requiredCount: number): number[] {
  if (requiredCount <= 0) return [];
  const scored = candidates.map((candidate, index) => ({
    index,
    score: starterCandidateDraftScore(candidate),
    types: new Set((candidate.display?.types || []).map(type => type.toLowerCase())),
  }));
  if (scored.length <= requiredCount) return scored.map(entry => entry.index);

  const selected: typeof scored = [];
  const topCorePool = scored
    .slice()
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(1, Math.min(scored.length, Math.ceil(scored.length * 0.45))));
  selected.push(weightedPick(topCorePool, entry => entry.score + Math.random() * 12) || topCorePool[0]!);

  while (selected.length < requiredCount) {
    const selectedIndexes = new Set(selected.map(entry => entry.index));
    const pool = scored.filter(entry => !selectedIndexes.has(entry.index));
    const pick = weightedPick(pool, entry => {
      const overlapPenalty = selected.reduce((total, selectedEntry) => {
        let overlap = 0;
        for (const type of entry.types) {
          if (selectedEntry.types.has(type)) overlap += 1;
        }
        return total + overlap * 10;
      }, 0);
      const qualityGapPenalty = Math.max(0, selected.length - 1) * Math.max(0, 50 - entry.score) * 0.35;
      return entry.score - overlapPenalty - qualityGapPenalty + Math.random() * 18;
    });
    selected.push(pick || pool[0]!);
  }

  return selected.map(entry => entry.index);
}

function weightedPick<T>(items: T[], scoreOf: (item: T) => number): T | null {
  if (!items.length) return null;
  const weights = items.map(item => Math.max(1, scoreOf(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index]!;
    if (roll <= 0) return items[index]!;
  }
  return items[items.length - 1]!;
}

function starterCandidateDraftScore(candidate: FormalGameRunV4["starterCandidates"][number]): number {
  const stats = candidate.display?.stats || {};
  const attack = Number(stats.atk || 0);
  const specialAttack = Number(stats.spa || 0);
  const speed = Number(stats.spe || 0);
  const bulk = (Number(stats.hp || 0) + Number(stats.def || 0) + Number(stats.spd || 0)) / 3;
  const rankScore = starterRankScore(candidate.speciesRank);
  const profileScore = candidate.powerProfile === "champion" ? 10 : candidate.powerProfile === "elite" ? 7 : 0;
  const moveScore = starterMoveSetScore(candidate, attack, specialAttack);
  return rankScore + profileScore + Math.min(18, Math.max(0, (Math.max(attack, specialAttack) - 80) / 4)) + Math.min(12, Math.max(0, (speed - 60) / 5)) + Math.min(10, Math.max(0, (bulk - 95) / 8)) + moveScore;
}

function starterRankScore(rank: string): number {
  if (rank === "legendary") return 70;
  if (rank === "rank6") return 62;
  if (rank === "rank5") return 52;
  if (rank === "rank4") return 40;
  if (rank === "rank3") return 30;
  if (rank === "rank2") return 20;
  return 10;
}

function starterMoveSetScore(candidate: FormalGameRunV4["starterCandidates"][number], attack: number, specialAttack: number): number {
  const types = new Set((candidate.display?.types || []).map(type => type.toLowerCase()));
  const damagingMoves = (candidate.pokemon.moves || [])
    .filter(move => Number(move.power || 0) > 0 && Number(move.remainingPp ?? move.pp ?? 0) > 0)
    .map(move => {
      const category = `${move.category || ""}`;
      const offense = category.includes("特殊") || category.toLowerCase() === "special" ? specialAttack : attack;
      const accuracy = move.accuracy === null ? 100 : Math.max(1, Math.min(100, Number(move.accuracy || 0)));
      const stab = types.has(`${move.type || ""}`.toLowerCase()) ? 1.18 : 1;
      return Number(move.power || 0) * (accuracy / 100) * Math.max(0.65, offense / 115) * stab;
    })
    .sort((left, right) => right - left);
  if (!damagingMoves.length) return -14;
  const topTwo = damagingMoves.slice(0, 2).reduce((sum, value) => sum + value, 0);
  const reliableMoveBonus = damagingMoves[0]! >= 95 ? 7 : damagingMoves[0]! >= 75 ? 3 : -6;
  return Math.min(28, topTwo / 12) + reliableMoveBonus;
}
