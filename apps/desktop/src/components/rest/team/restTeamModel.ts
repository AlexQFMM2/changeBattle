import type {MoveSummary, PlayerPokemonState, RentalPokemon} from "@changebattle/shared";
import {abilityDescription, conditionText, hpTone, moveDescription, parseHp, runtimeMoveLabel, statLine, statusCode, statusLabel} from "../../../lib/ui";

export type RestPokemonFocus =
  | {type: "nature"}
  | {type: "ability"}
  | {type: "item"}
  | {type: "move"; moveIndex: number};

export function restPokemonHpModel(state?: PlayerPokemonState) {
  const hp = parseHp(state?.condition);
  const percent = hp && hp.max > 0 ? Math.max(0, Math.min(100, (hp.current / hp.max) * 100)) : statusCode(state?.condition, state?.status) === "fnt" ? 0 : 100;
  return {
    hp,
    percent,
    text: hp?.text || conditionText(state?.condition),
    tone: hpTone(hp),
    status: statusCode(state?.condition, state?.status),
  };
}

export function restPokemonStatusLabel(state?: PlayerPokemonState): string {
  const status = statusCode(state?.condition, state?.status);
  return status ? statusLabel(status) : "";
}

export function restPokemonFocusTitle(pokemon: RentalPokemon, focus: RestPokemonFocus): string {
  if (focus.type === "move") {
    const move = pokemon.moves[focus.moveIndex];
    return move?.name_zh || move?.name || `技能 ${focus.moveIndex + 1}`;
  }
  if (focus.type === "item") return pokemon.item_zh || "无道具";
  if (focus.type === "nature") return pokemon.nature_zh || pokemon.nature || "性格";
  return pokemon.ability_zh || pokemon.ability || "特性";
}

export function restPokemonFocusBody(pokemon: RentalPokemon, focus: RestPokemonFocus): string {
  if (focus.type === "move") {
    const move = pokemon.moves[focus.moveIndex];
    return move ? moveDescription(move) : "当前没有记录这个技能。";
  }
  if (focus.type === "item") return pokemon.item_desc_zh || pokemon.item_desc || "当前没有携带道具。";
  if (focus.type === "nature") return "性格会影响能力倾向。可以在休整阶段通过数值重置重新抽取。";
  return abilityDescription(pokemon);
}

export function restPokemonMoveLabel(pokemon: RentalPokemon, state: PlayerPokemonState | undefined, move: MoveSummary, index: number): string {
  return runtimeMoveLabel(pokemon, state?.moves?.[index], index) || move.name_zh || move.name || `技能 ${index + 1}`;
}

export function restPokemonStatRows(pokemon: RentalPokemon, revealTraining: boolean) {
  return ([
    ["hp", "HP"],
    ["atk", "攻击"],
    ["def", "防御"],
    ["spa", "特攻"],
    ["spd", "特防"],
    ["spe", "速度"],
  ] as const).map(([stat, label]) => ({stat, label, value: statLine(pokemon, stat, revealTraining)}));
}
