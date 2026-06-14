import type {BattleState, BattleTurnPokemonState, RentalPokemon, ResultPokemonSummary, ResultProgressRow, ResultSummaryState} from "@changebattle/shared";

export function aliveText(team: BattleTurnPokemonState[]): string {
  const alive = team.filter(pokemon => !pokemon.fainted && pokemon.hp > 0).length;
  return `${alive}/${Math.max(1, team.length)}`;
}

export function fallbackUsedPokemon(summary: ResultSummaryState | null, battle: BattleState | null): ResultPokemonSummary[] {
  const team = summary?.player_team?.length ? summary.player_team : battle?.player_display || [];
  return team.map(pokemon => ({pokemon, kills: 0, deaths: 0, assists: 0, damage_dealt: 0, damage_taken: 0}));
}

export function fallbackProgress(summary: ResultSummaryState | null, battle: BattleState | null, outcome: ResultSummaryState["outcome"]): ResultProgressRow[] {
  const wins = Number(summary?.rows?.find(row => row.label === "连胜")?.value || 0);
  return Array.from({length: 7}, (_value, index) => {
    const battleNo = index + 1;
    return {
      battle_no: battleNo,
      label: battleNo === 7 ? "最终战" : battleNo === 3 ? "馆主战" : "挑战",
      outcome: battleNo <= wins ? "win" : battleNo === wins + 1 ? outcome : "pending",
      trainer: battleNo === wins + 1 ? summary?.enemy_trainer || battle?.enemy_trainer : undefined,
      trainer_visible: battleNo <= wins + 1,
    };
  });
}

export function outcomeLabel(outcome: ResultSummaryState["outcome"]): string {
  if (outcome === "win") return "WIN";
  if (outcome === "loss") return "LOST";
  return "ABORT";
}

export function playerWonBattleResult(battle: BattleState): boolean {
  const winner = String(battle.winner || "").toLowerCase();
  if (!winner || winner === "tie") return false;
  return !["enemy", "opponent", "对手"].includes(winner);
}

export function progressOutcomeText(outcome: ResultProgressRow["outcome"]): string {
  if (outcome === "win") return "已胜利";
  if (outcome === "loss") return "挑战失败";
  if (outcome === "abort") return "已中断";
  return "未挑战";
}

export function resultPokemonKey(pokemon: RentalPokemon | undefined): string {
  if (!pokemon) return "";
  return pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id || pokemon.name;
}
