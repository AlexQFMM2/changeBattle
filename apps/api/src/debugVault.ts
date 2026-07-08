import type {ShowdownDexService} from "@changebattle-v2/showdown-dex-core";
import {
  addPlayerVaultItemV4,
  addPlayerVaultPokemonV4,
  createPlayerVaultEggPokemonRecordV4,
  normalizePlayerVaultV4,
  playerVaultStorageCapacityV4,
  type PlayerPokemonRecordV4,
  type PlayerVaultV4,
} from "@changebattle-v2/core";

export type DebugPlayerVaultItemAddResultV4 =
  | {ok: true; vault: PlayerVaultV4; message: string}
  | {ok: false; reason: string};

export type DebugPlayerVaultPokemonAddResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; message: string}
  | {ok: false; reason: string};

export function addDebugPlayerVaultItemV4(dex: ShowdownDexService, vault: PlayerVaultV4 | undefined | null, itemId: string, quantity = 1): DebugPlayerVaultItemAddResultV4 {
  const normalizedVault = normalizePlayerVaultV4(vault);
  const normalizedItemId = dex.toDexId(itemId);
  if (!normalizedItemId) return {ok: false, reason: "请选择道具。"};
  let detail: ReturnType<ShowdownDexService["getItemDetail"]>;
  try {
    detail = dex.getItemDetail(normalizedItemId);
  } catch {
    return {ok: false, reason: "没有找到这个道具。"};
  }
  const amount = Math.max(1, Math.min(999, Math.floor(Number(quantity || 1))));
  const result = addPlayerVaultItemV4(normalizedVault, {
    itemId: detail.id || normalizedItemId,
    quantity: amount,
    sourceKind: "debug",
    boxKind: "storage",
  });
  if (result.rejectedItemCount > 0) return {ok: false, reason: "道具箱已满。"};
  return {
    ok: true,
    vault: result.vault,
    message: `已添加调试道具：${detail.nameZh || detail.name || detail.id} x${amount}。`,
  };
}

export function addDebugPlayerVaultPokemonV4(dex: ShowdownDexService, vault: PlayerVaultV4 | undefined | null, speciesId: string): DebugPlayerVaultPokemonAddResultV4 {
  const normalizedVault = normalizePlayerVaultV4(vault);
  const normalizedSpeciesId = dex.toDexId(speciesId);
  if (!normalizedSpeciesId) return {ok: false, reason: "请选择宝可梦。"};
  let detail: ReturnType<ShowdownDexService["getPokemonDetail"]>;
  try {
    detail = dex.getPokemonDetail(normalizedSpeciesId);
  } catch {
    return {ok: false, reason: "没有找到这个宝可梦。"};
  }
  if (normalizedVault.pokemon.length >= playerVaultStorageCapacityV4(normalizedVault, "pokemon")) {
    return {ok: false, reason: "宝可梦箱已满。"};
  }
  const pokemon = createPlayerVaultEggPokemonRecordV4({
    dex,
    speciesId: detail.id,
    originKind: "debug-custom",
    seed: `debug:${detail.id}:${Date.now()}:${normalizedVault.pokemon.length}`,
    friendship: 100,
    shinyRate: 0,
  });
  if (!pokemon) return {ok: false, reason: "调试宝可梦生成失败。"};
  return {
    ok: true,
    vault: addPlayerVaultPokemonV4(normalizedVault, pokemon),
    pokemon,
    message: `已添加调试宝可梦：${detail.nameZh || detail.name || detail.id}。`,
  };
}
