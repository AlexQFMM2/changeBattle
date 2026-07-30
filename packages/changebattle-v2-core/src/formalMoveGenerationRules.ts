import type {
  FormalNpcTypeV4,
  FormalStarterRoleV4,
} from "./formalGameCatalog.js";
import {formalNpcGenerationTierForTypeV4} from "./formalTeamGenerationRules.js";

export type FormalMoveQualitySourceV4 =
  | {kind: "player-starter"}
  | {kind: "npc"; trainerType: FormalNpcTypeV4; preset?: boolean};

export type FormalMoveQualityRuleV4 = {
  correctMoveCount: number;
  preferPresetMoves: boolean;
};

export function formalMoveQualityRuleForSourceV4(source: FormalMoveQualitySourceV4): FormalMoveQualityRuleV4 {
  if (source.kind === "player-starter") return {correctMoveCount: 3, preferPresetMoves: false};
  const tier = formalNpcGenerationTierForTypeV4(source.trainerType);
  if (source.preset) return {correctMoveCount: tier === "champion" ? 4 : 3, preferPresetMoves: true};
  if (tier === "rookie" || tier === "normal") return {correctMoveCount: 3, preferPresetMoves: false};
  if (tier === "elite") return {correctMoveCount: 3, preferPresetMoves: false};
  return {correctMoveCount: tier === "champion" ? 4 : 3, preferPresetMoves: true};
}

export function formalRolePreferredMoveIdsV4(role: FormalStarterRoleV4): string[] {
  if (role === "support") return ["protect", "wish", "healbell", "aromatherapy", "helpinghand", "reflect", "lightscreen"];
  if (role === "speed-control") return ["tailwind", "thunderwave", "icywind", "electroweb", "trickroom"];
  if (role === "disruption") return ["stealthrock", "spikes", "toxicspikes", "stickyweb", "toxic", "willowisp", "taunt"];
  if (role === "trick-room") return ["trickroom", "protect"];
  if (role === "weather") return ["raindance", "sunnyday", "sandstorm", "snowscape", "hail"];
  return [];
}
