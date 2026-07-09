import {normalizePlayerVaultV4, playerItemRecordKeyV4, type PlayerItemRecordV4, type PlayerPokemonRecordV4, type PlayerVaultV4} from "./playerVault.js";
import {normalizeSoulmateEvolutionRequirementV4, soulmateEvolutionFriendshipRequirementForChainV4, type SoulmateEvolutionRequirementV4} from "./soulmate.js";

export type PlayerVaultEvolutionEdgeV4 = {
  fromSpeciesId: string;
  toSpeciesId: string;
  evoType?: string;
  evoItem?: string;
  evoItemId?: string;
};

export type PlayerVaultEvolutionCandidateV4 = {
  edge: PlayerVaultEvolutionEdgeV4;
  toSpeciesId: string;
  requirement: SoulmateEvolutionRequirementV4;
  friendshipRequirement: number | null;
};

export type PlayerVaultEvolutionCandidateResultV4 =
  | {ok: true; item: PlayerItemRecordV4; pokemon: PlayerPokemonRecordV4; candidates: PlayerVaultEvolutionCandidateV4[]}
  | {ok: false; reason: string; item?: PlayerItemRecordV4; pokemon?: PlayerPokemonRecordV4};

export type PlayerVaultEvolutionApplyResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; beforePokemon: PlayerPokemonRecordV4; candidate: PlayerVaultEvolutionCandidateV4}
  | {ok: false; reason: string; vault: PlayerVaultV4};

export function previewPlayerVaultEvolutionCandidatesV4(input: {
  vault: PlayerVaultV4 | undefined | null;
  itemKey: string;
  pokemonId: string;
  evolutionEdges: PlayerVaultEvolutionEdgeV4[];
  evolutionStageCount: number;
}): PlayerVaultEvolutionCandidateResultV4 {
  const vault = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultEvolutionItemByKeyV4(vault, input.itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = vault.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。", item};
  const nextEdges = input.evolutionEdges.filter(edge => edge.fromSpeciesId === pokemon.speciesId);
  if (!nextEdges.length) return {ok: false, reason: "当前形态暂无可用进化。", item, pokemon};
  const withRequirements = nextEdges.map(edge => {
    const requirement = normalizeSoulmateEvolutionRequirementV4(edge);
    const friendshipRequirement = soulmateEvolutionFriendshipRequirementForChainV4(evolutionIndexForEdge(input.evolutionEdges, edge), input.evolutionStageCount);
    return {edge, requirement, friendshipRequirement};
  });
  const itemMatches = withRequirements.filter(entry => entry.requirement.itemId === item.itemId);
  if (!itemMatches.length) return {ok: false, reason: "这个道具不能让目标宝可梦进化。", item, pokemon};
  const friendship = Math.max(0, Math.floor(Number(pokemon.friendship || 0)));
  const candidates = itemMatches.flatMap(entry => {
    if (entry.friendshipRequirement === null || friendship < entry.friendshipRequirement) return [];
    return [{
      edge: entry.edge,
      toSpeciesId: entry.edge.toSpeciesId,
      requirement: entry.requirement,
      friendshipRequirement: entry.friendshipRequirement,
    }];
  });
  if (!candidates.length) {
    const needed = Math.min(...itemMatches.map(entry => entry.friendshipRequirement ?? Number.POSITIVE_INFINITY));
    return {ok: false, reason: Number.isFinite(needed) ? `亲密度不足，需要 ${needed}。` : "亲密度不足。", item, pokemon};
  }
  return {ok: true, item, pokemon, candidates};
}

export function applyPlayerVaultEvolutionV4(input: {
  vault: PlayerVaultV4 | undefined | null;
  itemKey: string;
  pokemonId: string;
  toSpeciesId: string;
  evolutionEdges: PlayerVaultEvolutionEdgeV4[];
  evolutionStageCount: number;
}): PlayerVaultEvolutionApplyResultV4 {
  const vault = normalizePlayerVaultV4(input.vault);
  const preview = previewPlayerVaultEvolutionCandidatesV4(input);
  if (!preview.ok) return {ok: false, reason: preview.reason, vault};
  const targetSpeciesId = normalizeText(input.toSpeciesId);
  const candidate = preview.candidates.find(entry => entry.toSpeciesId === targetSpeciesId);
  if (!candidate) return {ok: false, reason: "请选择可用的进化目标。", vault};
  const beforePokemon = preview.pokemon;
  const nextPokemon: PlayerPokemonRecordV4 = {
    ...beforePokemon,
    speciesId: candidate.toSpeciesId,
  };
  const itemKey = playerItemRecordKeyV4(preview.item);
  const nextVault = normalizePlayerVaultV4({
    ...vault,
    items: vault.items.flatMap(item => {
      if (playerItemRecordKeyV4(item) !== itemKey) return [item];
      if (item.quantity <= 1) return [];
      return [{...item, quantity: item.quantity - 1}];
    }),
    pokemon: vault.pokemon.map(pokemon => pokemon.playerPokemonId === nextPokemon.playerPokemonId ? nextPokemon : pokemon),
  });
  return {ok: true, vault: nextVault, pokemon: nextPokemon, beforePokemon, candidate};
}

function findPlayerVaultEvolutionItemByKeyV4(vault: PlayerVaultV4, itemKey: string): PlayerItemRecordV4 | null {
  return vault.items.find(item => playerItemRecordKeyV4(item) === itemKey || item.itemId === itemKey) || null;
}

function evolutionIndexForEdge(edges: PlayerVaultEvolutionEdgeV4[], target: PlayerVaultEvolutionEdgeV4): number {
  const incoming = new Map(edges.map(edge => [edge.toSpeciesId, edge.fromSpeciesId]));
  let index = 0;
  let cursor = target.fromSpeciesId;
  const visited = new Set<string>();
  while (incoming.has(cursor) && !visited.has(cursor)) {
    visited.add(cursor);
    index += 1;
    cursor = incoming.get(cursor)!;
  }
  return Math.max(0, index);
}

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}
