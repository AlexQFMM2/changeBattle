import type {BattleState, BattleTrainingConfig, BattleTrainingPokemonConfig} from "@changebattle/shared";
import type {StatId} from "@changebattle/shared";
import {
  TRAINING_MAX_TEAM_SIZE,
  TRAINING_STAT_IDS as STAT_IDS,
  TRAINING_STAT_LABELS as STAT_LABELS,
  TRAINING_TERA_TYPES as TERA_TYPES,
  configWithTeams,
  defaultTrainingConfig,
  normalizeTrainingPokemon,
  normalizeTrainingTeam,
  trainingDisplayName,
  trainingPokemon,
  trainingStats,
  type TrainingEditorTab,
  type TrainingSide,
} from "@changebattle/game-runtime";

export type BattleAnimationSpeed = 1 | 2;
export type {StatId, TrainingEditorTab, TrainingSide};
export {
  STAT_IDS,
  STAT_LABELS,
  TERA_TYPES,
  TRAINING_MAX_TEAM_SIZE,
  configWithTeams,
  defaultTrainingConfig,
  normalizeTrainingPokemon,
  normalizeTrainingTeam,
  trainingDisplayName,
  trainingPokemon,
  trainingStats,
};

export type TrainingLogEntry = {
  id: number;
  kind: "start" | "choice" | "auto" | "error";
  choice?: string;
  elapsedMs?: number;
  before?: unknown;
  after?: unknown;
  error?: string;
};

export function cloneTrainingPokemon(pokemon: BattleTrainingPokemonConfig): BattleTrainingPokemonConfig {
  return JSON.parse(JSON.stringify(pokemon)) as BattleTrainingPokemonConfig;
}

export function cloneTrainingConfig(config: BattleTrainingConfig): BattleTrainingConfig {
  return JSON.parse(JSON.stringify(config)) as BattleTrainingConfig;
}

export function battleSnapshot(battle: BattleState | null): unknown {
  if (!battle) return null;
  return {
    ended: battle.ended,
    winner: battle.winner,
    turn: battle.tracker.turn,
    request: battle.request ? {
      wait: battle.request.wait,
      forceSwitch: battle.request.forceSwitch,
      activeMoves: battle.request.active?.[0]?.moves?.map((move, index) => ({index: index + 1, id: move.id, move: move.move, pp: move.pp, maxpp: move.maxpp, disabled: move.disabled})),
      side: battle.request.side?.pokemon?.map((pokemon, index) => ({index: index + 1, ident: pokemon.ident, condition: pokemon.condition, active: pokemon.active, pokeball: pokemon.pokeball})),
    } : null,
    recentEvents: battle.recent_events.slice(-12),
    timelineEvents: battle.timeline_events.slice(-12).map(event => ({id: event.id, type: event.type, text: event.text, move: event.move, side: event.side, targetSide: event.targetSide})),
  };
}

export function stamp(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
