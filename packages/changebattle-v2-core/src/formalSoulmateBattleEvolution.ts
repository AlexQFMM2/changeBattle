import type {LocalPokemonV4} from "./pokemonInstance.js";
import type {PlayerPokemonRecordV4, PlayerVaultV4} from "./playerVault.js";
import {normalizePlayerVaultV4} from "./playerVault.js";
import type {PlayerVaultEvolutionEdgeV4} from "./playerVaultEvolution.js";
import {soulmateEvolutionFriendshipRequirementForChainV4} from "./soulmate.js";
import {isFormalSoulmateLocalPokemonV4} from "./formalSoulmateSettlement.js";

export const FORMAL_SOULMATE_BATTLE_EVOLUTION_CHANCE_V4 = 0.03;

export type FormalSoulmateBattleEvolutionCandidateV4 = {
  localPokemonId: string;
  sourcePlayerPokemonId: string;
  fromSpeciesId: string;
  toSpeciesId: string;
  displayName: string;
  friendshipRequirement: number;
  roll: number;
};

export type FormalSoulmateBattleEvolutionResultV4 =
  | {ok: true; candidate: FormalSoulmateBattleEvolutionCandidateV4}
  | {ok: false; reason: string};

export type FormalSoulmateBattleEvolutionRecordV4 = FormalSoulmateBattleEvolutionCandidateV4 & {
  battleNodeId: string;
  battleSessionId?: string;
  turn: number;
  createdAt: string;
};

export function evaluateFormalSoulmateBattleEvolutionV4(input: {
  localPokemon: LocalPokemonV4 | undefined | null;
  vault: PlayerVaultV4 | undefined | null;
  evolutionEdges: PlayerVaultEvolutionEdgeV4[];
  evolutionStageCount: number;
  seed: string;
  chance?: number;
  alreadyEvolvedSourcePlayerPokemonIds?: Iterable<string>;
}): FormalSoulmateBattleEvolutionResultV4 {
  const local = input.localPokemon;
  if (!local || !isFormalSoulmateLocalPokemonV4(local)) return {ok: false, reason: "not-soulmate"};
  const sourcePlayerPokemonId = normalizeText(local.sourcePlayerPokemonId);
  if (!sourcePlayerPokemonId) return {ok: false, reason: "missing-source-player-pokemon-id"};
  const already = new Set(Array.from(input.alreadyEvolvedSourcePlayerPokemonIds || []).map(normalizeText).filter(Boolean));
  if (already.has(sourcePlayerPokemonId)) return {ok: false, reason: "already-evolved"};
  const vault = normalizePlayerVaultV4(input.vault);
  const record = vault.pokemon.find(pokemon => pokemon.playerPokemonId === sourcePlayerPokemonId);
  if (!record) return {ok: false, reason: "missing-vault-pokemon"};
  const fromSpeciesId = normalizeText(local.speciesId || record.speciesId);
  const nextEdges = input.evolutionEdges.filter(edge => normalizeText(edge.fromSpeciesId) === fromSpeciesId);
  if (nextEdges.length !== 1) return {ok: false, reason: nextEdges.length > 1 ? "multi-target" : "no-next-evolution"};
  const edge = nextEdges[0]!;
  const friendshipRequirement = soulmateEvolutionFriendshipRequirementForChainV4(evolutionIndexForEdge(input.evolutionEdges, edge), input.evolutionStageCount);
  if (friendshipRequirement === null) return {ok: false, reason: "missing-friendship-requirement"};
  const friendship = Number.isFinite(Number(local.friendship)) ? local.friendship : record.friendship;
  if (clampFriendship(friendship) < friendshipRequirement) return {ok: false, reason: "friendship-too-low"};
  const chance = clampChance(input.chance ?? FORMAL_SOULMATE_BATTLE_EVOLUTION_CHANCE_V4);
  const roll = seededFractionV4(input.seed);
  if (roll >= chance) return {ok: false, reason: "roll-failed"};
  return {
    ok: true,
    candidate: {
      localPokemonId: local.localPokemonId,
      sourcePlayerPokemonId,
      fromSpeciesId,
      toSpeciesId: normalizeText(edge.toSpeciesId),
      displayName: formalSoulmateBattleEvolutionDisplayName(local, record),
      friendshipRequirement,
      roll,
    },
  };
}

export function applyFormalSoulmateBattleEvolutionToVaultV4(input: {
  vault: PlayerVaultV4 | undefined | null;
  sourcePlayerPokemonId: string;
  toSpeciesId: string;
}): PlayerVaultV4 {
  const vault = normalizePlayerVaultV4(input.vault);
  const sourcePlayerPokemonId = normalizeText(input.sourcePlayerPokemonId);
  const toSpeciesId = normalizeText(input.toSpeciesId);
  if (!sourcePlayerPokemonId || !toSpeciesId) return vault;
  return normalizePlayerVaultV4({
    ...vault,
    pokemon: vault.pokemon.map(pokemon => (
      pokemon.playerPokemonId === sourcePlayerPokemonId
        ? {...pokemon, speciesId: toSpeciesId}
        : pokemon
    )),
  });
}

function formalSoulmateBattleEvolutionDisplayName(local: LocalPokemonV4, record: PlayerPokemonRecordV4): string {
  return normalizeText(local.nickname) || normalizeText(record.nickname) || normalizeText(local.nameZh) || normalizeText(local.name) || normalizeText(record.speciesId) || normalizeText(local.speciesId);
}

function evolutionIndexForEdge(edges: PlayerVaultEvolutionEdgeV4[], target: PlayerVaultEvolutionEdgeV4): number {
  const incoming = new Map(edges.map(edge => [normalizeText(edge.toSpeciesId), normalizeText(edge.fromSpeciesId)]));
  let index = 0;
  let cursor = normalizeText(target.fromSpeciesId);
  const visited = new Set<string>();
  while (incoming.has(cursor) && !visited.has(cursor)) {
    visited.add(cursor);
    index += 1;
    cursor = incoming.get(cursor)!;
  }
  return Math.max(0, index);
}

function seededFractionV4(seed: string | number | undefined): number {
  const text = String(seed ?? "soulmate-battle-evolution");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0x100000000;
}

function clampChance(value: unknown): number {
  const next = Number(value);
  if (!Number.isFinite(next)) return FORMAL_SOULMATE_BATTLE_EVOLUTION_CHANCE_V4;
  return Math.max(0, Math.min(1, next));
}

function clampFriendship(value: unknown): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, Math.min(255, next));
}

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}
