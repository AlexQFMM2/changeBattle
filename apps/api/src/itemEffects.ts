import type {DexItemDetail, DexItemRecoveryEffect, DexItemTrainingEffect, DexMoveSummary, DexPokemonDetail, DexPokemonEvolutionEdge, DexStatId} from "@changebattle-v2/showdown-dex-core";
import {addPlayerVaultItemV4, applyFormalSpecialMedicineToPokemonV4, applyPlayerVaultEvolutionV4, isProtectedSoulmateItemUseTargetV4, normalizePlayerVaultV4, previewPlayerVaultEvolutionCandidatesV4, type PlayerItemRecordV4, type PlayerPokemonRecordV4, type PlayerVaultEvolutionCandidateV4, type PlayerVaultV4} from "@changebattle-v2/core";
import type {BagStateV4, LocalPokemonV4, PlayerItemInstanceV4, StatTableV4, TrainingMoveSlotV4, TrainingStatusV4} from "./training.js";

export type ConsumableItemApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; bag: BagStateV4; message: string; hpRecovered: number; ppRecovered: number; statusCured: boolean; revived: boolean; healedMoveIndex: number | null}
  | {ok: false; reason: string};

export type TrainingItemApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; bag: BagStateV4; message: string}
  | {ok: false; reason: string};

export type TmItemApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; bag: BagStateV4; message: string; moveSlot: number}
  | {ok: false; reason: string};

export type PlayerVaultMoveTeachingViewResultV4 =
  | {ok: true; item: PlayerItemRecordV4; itemName: string; pokemon: PlayerPokemonRecordV4; pokemonName: string; sourceLabel: string; oncePerPokemon: boolean; alreadyUsed: boolean; unavailableReason?: string; unavailableMove?: DexMoveSummary; moves: DexMoveSummary[]}
  | {ok: false; reason: string};

export type PlayerVaultMoveTeachingApplyResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; message: string}
  | {ok: false; reason: string};

export type PlayerVaultFriendshipItemApplyResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; message: string; friendshipDelta: number}
  | {ok: false; reason: string};

export type PlayerVaultNumericItemPreviewResultV4 =
  | {ok: true; item: PlayerItemRecordV4; itemName: string; pokemon: PlayerPokemonRecordV4; pokemonName: string; changes: Array<{label: string; before: string; after: string}>}
  | {ok: false; reason: string};

export type PlayerVaultNumericItemApplyResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; message: string; changes: Array<{label: string; before: string; after: string}>}
  | {ok: false; reason: string};

export type PlayerVaultHeldItemApplyResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; message: string; replacedItemId?: string}
  | {ok: false; reason: string};

export type PlayerVaultHeldItemUnequipResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; message: string; unequippedItemId: string}
  | {ok: false; reason: string};

export type PlayerVaultEvolutionViewTargetV4 = {
  toSpeciesId: string;
  toName: string;
  toSpriteUrl: string;
  friendshipRequirement: number;
  statChanges: Array<{label: string; before: string; after: string}>;
};

export type PlayerVaultEvolutionPreviewResultV4 =
  | {ok: true; item: PlayerItemRecordV4; itemName: string; pokemon: PlayerPokemonRecordV4; pokemonName: string; fromSpeciesId: string; fromName: string; fromSpriteUrl: string; targets: PlayerVaultEvolutionViewTargetV4[]}
  | {ok: false; reason: string};

export type PlayerVaultEvolutionApplyResultV4 =
  | {ok: true; vault: PlayerVaultV4; pokemon: PlayerPokemonRecordV4; beforePokemon: PlayerPokemonRecordV4; message: string; fromName: string; toName: string; fromSpriteUrl: string; toSpriteUrl: string}
  | {ok: false; reason: string};

type PlayerVaultMoveTeachingDexV4 = {
  toDexId(value: string): string;
  getItemDetail(itemId: string): DexItemDetail;
  getPokemonDetail(speciesId: string): DexPokemonDetail | null;
  translateDexLabel?: (table: "stats" | "natures", value: string) => string;
  getPokemonSkillsBySource(speciesId: string, source: string): DexMoveSummary[];
  getPokemonMachineSkills?(speciesId: string): DexMoveSummary[];
  searchDex(request: {category: "moves"; query?: string; limit?: number}): {rows: Array<{id: string}>};
  getMoveDetail(moveId: string): DexMoveSummary;
  calculatePokemonStats?: (input: {speciesId: string; level?: number; nature?: string; evs?: StatTableV4; ivs?: StatTableV4}) => {stats: Record<string, number>};
  getPokemonEvolutionTree?: (speciesId: string) => {edges: DexPokemonEvolutionEdge[]};
};

const RECOVERABLE_STATUS = new Set<TrainingStatusV4>(["brn", "par", "psn", "tox", "slp", "frz"]);
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const NATURE_NAMES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
];

export function canUseRecoveryItemV4(item: PlayerItemInstanceV4 | null | undefined, detail: DexItemDetail | null | undefined): boolean {
  return Boolean(item && recoveryEffectForItemV4(item, detail));
}

export function recoveryEffectForItemV4(item: PlayerItemInstanceV4 | null | undefined, detail: DexItemDetail | null | undefined): DexItemRecoveryEffect | null {
  if (detail?.recoveryEffect) return detail.recoveryEffect;
  const id = normalizeItemId(item?.itemID || detail?.id || "");
  return FALLBACK_RECOVERY_EFFECTS[id] || null;
}

export function applyRecoveryItemToPokemonV4(input: {
  item: PlayerItemInstanceV4;
  detail?: DexItemDetail | null;
  pokemon: LocalPokemonV4;
  bag: BagStateV4;
  team?: LocalPokemonV4[];
}): ConsumableItemApplyResultV4 {
  const effect = recoveryEffectForItemV4(input.item, input.detail);
  if (!effect) return {ok: false, reason: "该道具当前不能立即使用。"};

  const before = input.pokemon;
  let next = clonePokemon(before);
  let hpRecovered = 0;
  let ppRecovered = 0;
  let statusCured = false;
  let revived = false;
  let healedMoveIndex: number | null = null;
  const fainted = before.entryHp <= 0;

  if (effect.revive) {
    if (!fainted) return {ok: false, reason: "目标没有濒死，不能使用复活道具。"};
    const targetHp = effect.revive === "full" ? before.maxHp : Math.max(1, Math.floor(before.maxHp / 2));
    next.entryHp = clampInt(targetHp, 1, before.maxHp);
    next.entryStatus = "";
    hpRecovered = next.entryHp;
    statusCured = before.entryStatus !== "";
    revived = true;
  } else if (effect.hp) {
    if (fainted) return {ok: false, reason: "目标已经濒死，请使用复活道具。"};
    const targetHp = hpTargetForEffect(effect.hp, before);
    next.entryHp = clampInt(Math.max(before.entryHp, targetHp), 0, before.maxHp);
    hpRecovered = Math.max(0, next.entryHp - before.entryHp);
  }

  if (effect.cureStatus) {
    const canCure = statusMatches(effect.cureStatus, next.entryStatus);
    if (canCure) {
      next.entryStatus = "";
      statusCured = true;
    }
  }

  if (effect.pp) {
    const ppResult = applyPpRecovery(next.moves, effect.pp);
    if (ppResult.recovered > 0) {
      next = {...next, moves: ppResult.moves};
      ppRecovered = ppResult.recovered;
      healedMoveIndex = ppResult.moveIndex;
    }
  }

  if (hpRecovered <= 0 && ppRecovered <= 0 && !statusCured && !revived) {
    return {ok: false, reason: "目标当前不需要这个道具。"};
  }

  const nextBag = consumeItemInstance(input.bag, input.item.id);
  const name = before.nameZh || before.name;
  const itemName = input.item.name || input.detail?.nameZh || input.detail?.name || input.item.itemID;
  return {
    ok: true,
    pokemon: clearHeldReferenceIfConsumed(next, input.item),
    bag: nextBag,
    message: buildRecoveryMessage(name, itemName, {hpRecovered, ppRecovered, statusCured, revived, healedMoveIndex, pokemon: next}),
    hpRecovered,
    ppRecovered,
    statusCured,
    revived,
    healedMoveIndex,
  };
}

export function clearConsumedItemFromTeamV4(team: LocalPokemonV4[], item: PlayerItemInstanceV4): LocalPokemonV4[] {
  return team.map(pokemon => clearHeldReferenceIfConsumed(pokemon, item));
}

export function canUseTrainingItemV4(item: PlayerItemInstanceV4 | null | undefined, detail: DexItemDetail | null | undefined): boolean {
  return Boolean(item && trainingEffectForItemV4(item, detail));
}

export function trainingEffectForItemV4(item: PlayerItemInstanceV4 | null | undefined, detail: DexItemDetail | null | undefined): DexItemTrainingEffect | null {
  if (detail?.trainingEffect) return detail.trainingEffect;
  const id = normalizeItemId(item?.itemID || detail?.id || "");
  return FALLBACK_TRAINING_EFFECTS[id] || null;
}

export function applyTrainingItemToPokemonV4(input: {
  item: PlayerItemInstanceV4;
  detail?: DexItemDetail | null;
  pokemon: LocalPokemonV4;
  bag: BagStateV4;
  pokemonDetail?: DexPokemonDetail | null;
  allAbilities?: Array<{id: string; name?: string; nameZh?: string; hidden?: boolean}>;
  calculateMaxHp?: (pokemon: LocalPokemonV4) => number;
  rngSeed?: string;
  translateDexLabel?: (table: "stats" | "natures", value: string) => string;
}): TrainingItemApplyResultV4 {
  const effect = trainingEffectForItemV4(input.item, input.detail);
  if (!effect) return {ok: false, reason: "该道具当前不能训练使用。"};
  const before = input.pokemon;
  if (effect.kind === "special-medicine" && isProtectedSoulmateItemUseTargetV4(before)) {
    return {ok: false, reason: "灵魂伴侣不能使用特效药。"};
  }
  let next = clonePokemon(before);
  let message = "";

  if (effect.kind === "ev") {
    const nextEvs = applyEvEffect(before.evs, effect);
    const statLabel = input.translateDexLabel?.("stats", effect.stat) || effect.stat;
    if (!nextEvs) return {ok: false, reason: `${statLabel}努力值当前不需要这个道具。`};
    next = {...next, evs: nextEvs};
    message = `${before.nameZh || before.name} 的${statLabel}努力值变为 ${nextEvs[effect.stat]}。`;
  } else if (effect.kind === "nature") {
    if (before.nature === effect.nature) return {ok: false, reason: "目标已经是这个性格。"};
    next = {...next, nature: effect.nature};
    message = `${before.nameZh || before.name} 的性格调整为 ${input.translateDexLabel?.("natures", effect.nature) || effect.nature}。`;
  } else if (effect.kind === "ability") {
    const ability = nextAbilityForEffect(before, input.pokemonDetail || null, effect.mode);
    if (!ability) return {ok: false, reason: effect.mode === "patch" ? "目标没有可切换的隐藏特性。" : "目标没有可切换的普通特性。"};
    next = {...next, abilityId: ability.id, abilityName: ability.name, abilityNameZh: ability.nameZh || ability.name};
    message = `${before.nameZh || before.name} 的特性变为 ${next.abilityNameZh || next.abilityName || next.abilityId}。`;
  } else if (effect.kind === "iv") {
    const nextIvs = applyIvEffect(before.ivs, effect.mode);
    if (!nextIvs) return {ok: false, reason: "目标个体值当前不需要这个道具。"};
    next = {...next, ivs: nextIvs};
    message = `${before.nameZh || before.name} 的个体值已调整。`;
  } else if (effect.kind === "level") {
    if (before.level >= 100) return {ok: false, reason: "目标等级已满。"};
    const level = Math.min(100, before.level + Math.max(1, effect.amount));
    const oldMaxHp = Math.max(1, before.maxHp);
    const oldHp = before.entryHp;
    next = {...next, level};
    const nextMaxHp = input.calculateMaxHp?.(next) || before.maxHp;
    next = {
      ...next,
      maxHp: nextMaxHp,
      entryHp: oldHp <= 0 ? 0 : Math.max(1, Math.min(nextMaxHp, Math.round(nextMaxHp * oldHp / oldMaxHp))),
    };
    message = `${before.nameZh || before.name} 升到了 Lv.${level}。`;
  } else if (effect.kind === "special-medicine") {
    const result = applyFormalSpecialMedicineToPokemonV4({
      pokemon: before,
      medicineId: effect.medicineId,
      pokemonAbilities: input.pokemonDetail?.abilities || [],
      allAbilities: input.allAbilities || [],
      calculateMaxHp: input.calculateMaxHp,
      rngSeed: input.rngSeed || `${before.localPokemonId}:${before.speciesId}:${input.item.id}:${input.item.itemID}:${effect.medicineId}`,
    });
    if (!result.ok) return result;
    next = result.pokemon;
    message = result.message;
  }

  const nextBag = consumeItemInstance(input.bag, input.item.id);
  return {
    ok: true,
    pokemon: clearHeldReferenceIfConsumed(next, input.item),
    bag: nextBag,
    message,
  };
}

export function canUseTmItemV4(item: PlayerItemInstanceV4 | null | undefined, detail: DexItemDetail | null | undefined): boolean {
  return Boolean(tmMoveIdForItemV4(item, detail));
}

export function tmMoveIdForItemV4(item: PlayerItemInstanceV4 | null | undefined, detail: DexItemDetail | null | undefined): string {
  if (detail?.kind === "tm" && detail.moveId) return normalizeItemId(detail.moveId);
  const itemId = normalizeItemId(item?.itemID || detail?.id || "");
  return itemId.startsWith("tm") ? itemId.slice(2) : "";
}

export function canPokemonLearnTmMoveV4(pokemon: LocalPokemonV4, moveId: string, machineMoves: DexMoveSummary[]): boolean {
  const normalizedMoveId = normalizeItemId(moveId);
  return Boolean(normalizedMoveId && machineMoves.some(move => normalizeItemId(move.id) === normalizedMoveId));
}

export function tmUseFailureReasonV4(input: {
  item: PlayerItemInstanceV4 | null | undefined;
  detail?: DexItemDetail | null;
  pokemon?: LocalPokemonV4 | null;
  machineMoves?: DexMoveSummary[];
}): string {
  const moveId = tmMoveIdForItemV4(input.item, input.detail);
  if (!moveId) return "该道具不是技能机器。";
  if (!input.pokemon) return "请选择宝可梦。";
  if (isProtectedSoulmateItemUseTargetV4(input.pokemon)) return "灵魂伴侣不能使用技能机器。";
  if (input.pokemon.moves.some(move => normalizeItemId(move.moveId) === moveId)) return "目标已经学会这个招式。";
  if (!canPokemonLearnTmMoveV4(input.pokemon, moveId, input.machineMoves || [])) return "目标无法通过技能机器学习这个招式。";
  return "";
}

export function applyTmItemToPokemonV4(input: {
  item: PlayerItemInstanceV4;
  detail?: DexItemDetail | null;
  pokemon: LocalPokemonV4;
  bag: BagStateV4;
  machineMoves: DexMoveSummary[];
  moveSlot: number;
}): TmItemApplyResultV4 {
  const reason = tmUseFailureReasonV4(input);
  if (reason) return {ok: false, reason};
  const moveId = tmMoveIdForItemV4(input.item, input.detail);
  const move = input.machineMoves.find(entry => normalizeItemId(entry.id) === moveId);
  if (!move) return {ok: false, reason: "目标无法通过技能机器学习这个招式。"};
  const moveSlot = clampInt(input.moveSlot, 0, 3);
  const nextMove = moveSlotFromDexMove(move);
  const nextPokemon = clearHeldReferenceIfConsumed({
    ...clonePokemon(input.pokemon),
    moves: input.pokemon.moves.map((current, index) => index === moveSlot ? nextMove : current),
  }, input.item);
  const nextBag = consumeItemInstance(input.bag, input.item.id);
  const pokemonName = input.pokemon.nameZh || input.pokemon.name;
  const moveName = move.nameZh || move.name || move.id;
  return {
    ok: true,
    pokemon: nextPokemon,
    bag: nextBag,
    moveSlot,
    message: `${pokemonName} 学会了 ${moveName}。`,
  };
}

export function getPlayerVaultMoveTeachingViewV4(
  dex: PlayerVaultMoveTeachingDexV4,
  vault: PlayerVaultV4 | undefined | null,
  itemKey: string,
  pokemonId: string,
  query = "",
): PlayerVaultMoveTeachingViewResultV4 {
  const normalized = normalizePlayerVaultV4(vault);
  const item = findPlayerVaultItemByKeyV4(normalized, itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const detail = safeVaultItemDetailV4(dex, item.itemId);
  if (detail?.kind === "tm" && detail.moveId) {
    const move = safeVaultMoveDetailV4(dex, detail.moveId);
    if (!move) return {ok: false, reason: "技能机器对应技能不存在。"};
    const learned = new Set(pokemon.moves.map(entry => dex.toDexId(entry.moveId)));
    const canLearn = dex.getPokemonMachineSkills?.(pokemon.speciesId).some(entry => dex.toDexId(entry.id) === dex.toDexId(move.id)) ?? true;
    const unavailableReason = learned.has(dex.toDexId(move.id))
      ? "目标已经学会这个招式。"
      : canLearn ? undefined : "目标无法通过技能机器学习这个招式。";
    return {
      ok: true,
      item,
      itemName: detail.nameZh || detail.name || item.itemId,
      pokemon,
      pokemonName: playerVaultPokemonShortNameV4(dex, pokemon),
      sourceLabel: "技能机器",
      oncePerPokemon: false,
      alreadyUsed: Boolean(unavailableReason),
      unavailableReason,
      unavailableMove: unavailableReason ? move : undefined,
      moves: unavailableReason ? [] : [move],
    };
  }
  const effect = detail?.moveTeachingEffect;
  if (!effect) return {ok: false, reason: "该道具不能用于学习技能。"};
  const moves = playerVaultMoveTeachingPoolV4(dex, pokemon, effect, query);
  return {
    ok: true,
    item,
    itemName: detail?.nameZh || detail?.name || item.itemId,
    pokemon,
    pokemonName: playerVaultPokemonShortNameV4(dex, pokemon),
    sourceLabel: playerVaultMoveTeachingSourceLabelV4(effect),
    oncePerPokemon: effect.kind === "any" && Boolean(effect.oncePerPokemon),
    alreadyUsed: effect.kind === "any" && Boolean(effect.oncePerPokemon && pokemon.growthFlags?.forbiddenManualUsedAt),
    moves,
  };
}

export function applyPlayerVaultMoveTeachingItemV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string; moveId: string; moveSlot: number},
): PlayerVaultMoveTeachingApplyResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultItemByKeyV4(normalized, input.itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const detail = safeVaultItemDetailV4(dex, item.itemId);
  if (detail?.kind === "tm" && detail.moveId) {
    const move = safeVaultMoveDetailV4(dex, detail.moveId);
    if (!move) return {ok: false, reason: "技能机器对应技能不存在。"};
    const learned = new Set(pokemon.moves.map(entry => dex.toDexId(entry.moveId)));
    if (learned.has(dex.toDexId(move.id))) return {ok: false, reason: "目标已经学会这个招式。"};
    const canLearn = dex.getPokemonMachineSkills?.(pokemon.speciesId).some(entry => dex.toDexId(entry.id) === dex.toDexId(move.id)) ?? true;
    if (!canLearn) return {ok: false, reason: "目标无法通过技能机器学习这个招式。"};
    return applyPlayerVaultMoveRecordV4(dex, normalized, item, pokemon, move, input.moveSlot, false);
  }
  const effect = detail?.moveTeachingEffect;
  if (!effect) return {ok: false, reason: "该道具不能用于学习技能。"};
  if (effect.kind === "any" && effect.oncePerPokemon && pokemon.growthFlags?.forbiddenManualUsedAt) {
    return {ok: false, reason: "这只宝可梦已经使用过禁断的秘籍。"};
  }
  const moveId = dex.toDexId(input.moveId);
  const move = playerVaultMoveTeachingPoolV4(dex, pokemon, effect, "").find(entry => dex.toDexId(entry.id) === moveId);
  if (!move) return {ok: false, reason: "目标无法通过这个道具学习该技能。"};
  if (pokemon.moves.some(entry => dex.toDexId(entry.moveId) === moveId)) return {ok: false, reason: "目标已经学会这个招式。"};
  return applyPlayerVaultMoveRecordV4(dex, normalized, item, pokemon, move, input.moveSlot, effect.kind === "any" && Boolean(effect.oncePerPokemon));
}

export function previewPlayerVaultNumericItemUseV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string},
): PlayerVaultNumericItemPreviewResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultItemByKeyV4(normalized, input.itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const preview = previewPlayerVaultNumericItemRecordV4(dex, item, pokemon);
  if (!preview.ok) return preview;
  return {
    ok: true,
    item,
    itemName: preview.itemName,
    pokemon,
    pokemonName: playerVaultPokemonShortNameV4(dex, pokemon),
    changes: preview.changes,
  };
}

export function applyPlayerVaultNumericItemV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string},
): PlayerVaultNumericItemApplyResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultItemByKeyV4(normalized, input.itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const preview = previewPlayerVaultNumericItemRecordV4(dex, item, pokemon);
  if (!preview.ok) return preview;
  const nextItems = consumePlayerVaultItemRecordV4(normalized.items, item);
  const nextVault = normalizePlayerVaultV4({
    ...normalized,
    items: nextItems,
    pokemon: normalized.pokemon.map(entry => entry.playerPokemonId === preview.pokemon.playerPokemonId ? preview.pokemon : entry),
  });
  return {
    ok: true,
    vault: nextVault,
    pokemon: preview.pokemon,
    message: `对${playerVaultPokemonShortNameV4(dex, pokemon)}使用了${preview.itemName}。`,
    changes: preview.changes,
  };
}

export function applyPlayerVaultFriendshipItemV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string},
): PlayerVaultFriendshipItemApplyResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultItemByKeyV4(normalized, input.itemKey);
  const detail = item ? safeVaultItemDetailV4(dex, item.itemId) : null;
  const itemName = detail?.nameZh || detail?.name || item?.itemId || "道具";
  const result = applyPlayerVaultNumericItemV4(dex, input);
  if (!result.ok) return result;
  const friendshipChange = result.changes.find(entry => entry.label === "亲密度");
  const friendshipDelta = Math.max(0, Number(friendshipChange?.after || 0) - Number(friendshipChange?.before || 0));
  return {
    ok: true,
    vault: result.vault,
    pokemon: result.pokemon,
    message: friendshipDelta > 0
      ? `对${playerVaultPokemonShortNameV4(dex, result.pokemon)}使用了${itemName}，亲密度提升了 ${friendshipDelta} 点。`
      : result.message,
    friendshipDelta,
  };
}

export function applyPlayerVaultHeldItemV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string},
): PlayerVaultHeldItemApplyResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultItemByKeyV4(normalized, input.itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const detail = safeVaultItemDetailV4(dex, item.itemId);
  if (detail?.kind !== "battle" && detail?.kind !== "held") return {ok: false, reason: "该道具不能作为携带道具。"};
  if (pokemon.heldItemId === item.itemId) return {ok: false, reason: "这只宝可梦已经携带该道具。"};
  const nextPokemon: PlayerPokemonRecordV4 = {
    ...pokemon,
    heldItemId: item.itemId,
  };
  let nextVault = normalizePlayerVaultV4({
    ...normalized,
    items: consumePlayerVaultItemRecordV4(normalized.items, item),
    pokemon: normalized.pokemon.map(entry => entry.playerPokemonId === nextPokemon.playerPokemonId ? nextPokemon : entry),
  });
  if (pokemon.heldItemId) {
    nextVault = addPlayerVaultItemV4(nextVault, {itemId: pokemon.heldItemId, quantity: 1, boxKind: "storage"}).vault;
  }
  const itemName = detail.nameZh || detail.name || item.itemId;
  const replacedName = pokemon.heldItemId ? safeVaultItemDetailV4(dex, pokemon.heldItemId)?.nameZh || pokemon.heldItemId : "";
  return {
    ok: true,
    vault: nextVault,
    pokemon: nextPokemon,
    message: replacedName
      ? `${playerVaultPokemonShortNameV4(dex, pokemon)} 将 ${replacedName} 替换为 ${itemName}。`
      : `${playerVaultPokemonShortNameV4(dex, pokemon)} 携带了 ${itemName}。`,
    replacedItemId: pokemon.heldItemId,
  };
}

export function unequipPlayerVaultHeldItemV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; pokemonId: string},
): PlayerVaultHeldItemUnequipResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  if (!pokemon.heldItemId) return {ok: false, reason: "这只宝可梦没有携带道具。"};
  const unequippedItemId = pokemon.heldItemId;
  const nextPokemon: PlayerPokemonRecordV4 = {
    ...pokemon,
    heldItemId: undefined,
  };
  const added = addPlayerVaultItemV4({
    ...normalized,
    pokemon: normalized.pokemon.map(entry => entry.playerPokemonId === nextPokemon.playerPokemonId ? nextPokemon : entry),
  }, {itemId: unequippedItemId, quantity: 1, boxKind: "storage"});
  if (added.rejectedItemCount > 0) return {ok: false, reason: "道具箱已满，无法卸下携带道具。"};
  const detail = safeVaultItemDetailV4(dex, unequippedItemId);
  const itemName = detail?.nameZh || detail?.name || unequippedItemId;
  return {
    ok: true,
    vault: added.vault,
    pokemon: nextPokemon,
    message: `${playerVaultPokemonShortNameV4(dex, pokemon)} 卸下了 ${itemName}。`,
    unequippedItemId,
  };
}

export function previewPlayerVaultEvolutionItemUseV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string},
): PlayerVaultEvolutionPreviewResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const item = findPlayerVaultItemByKeyV4(normalized, input.itemKey);
  if (!item) return {ok: false, reason: "道具不存在。"};
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const detail = safeVaultItemDetailV4(dex, item.itemId);
  if (detail?.kind !== "evolution") return {ok: false, reason: "该道具不是进化道具。"};
  const tree = safeVaultEvolutionTreeV4(dex, pokemon.speciesId);
  const preview = previewPlayerVaultEvolutionCandidatesV4({
    vault: normalized,
    itemKey: input.itemKey,
    pokemonId: input.pokemonId,
    evolutionEdges: tree.edges,
    evolutionStageCount: vaultEvolutionStageCountV4(tree.edges),
  });
  if (!preview.ok) return {ok: false, reason: preview.reason.replace("目标宝可梦", playerVaultPokemonShortNameV4(dex, pokemon))};
  const fromDetail = safePokemonDetailV4(dex, pokemon.speciesId);
  return {
    ok: true,
    item,
    itemName: detail.nameZh || detail.name || item.itemId,
    pokemon,
    pokemonName: playerVaultPokemonShortNameV4(dex, pokemon),
    fromSpeciesId: pokemon.speciesId,
    fromName: fromDetail?.nameZh || fromDetail?.name || pokemon.speciesId,
    fromSpriteUrl: vaultPokemonFrontSpriteUrlV4(fromDetail, pokemon.shiny),
    targets: preview.candidates.map(candidate => evolutionCandidateViewV4(dex, pokemon, candidate)),
  };
}

export function applyPlayerVaultEvolutionItemV4(
  dex: PlayerVaultMoveTeachingDexV4,
  input: {vault: PlayerVaultV4 | undefined | null; itemKey: string; pokemonId: string; toSpeciesId: string},
): PlayerVaultEvolutionApplyResultV4 {
  const normalized = normalizePlayerVaultV4(input.vault);
  const pokemon = normalized.pokemon.find(entry => entry.playerPokemonId === input.pokemonId);
  if (!pokemon) return {ok: false, reason: "请选择宝可梦。"};
  const tree = safeVaultEvolutionTreeV4(dex, pokemon.speciesId);
  const result = applyPlayerVaultEvolutionV4({
    vault: normalized,
    itemKey: input.itemKey,
    pokemonId: input.pokemonId,
    toSpeciesId: input.toSpeciesId,
    evolutionEdges: tree.edges,
    evolutionStageCount: vaultEvolutionStageCountV4(tree.edges),
  });
  if (!result.ok) return result;
  const beforeDetail = safePokemonDetailV4(dex, result.beforePokemon.speciesId);
  const afterDetail = safePokemonDetailV4(dex, result.pokemon.speciesId);
  const fromName = beforeDetail?.nameZh || beforeDetail?.name || result.beforePokemon.speciesId;
  const toName = afterDetail?.nameZh || afterDetail?.name || result.pokemon.speciesId;
  return {
    ok: true,
    vault: result.vault,
    pokemon: result.pokemon,
    beforePokemon: result.beforePokemon,
    message: `${fromName} 进化成了 ${toName}。`,
    fromName,
    toName,
    fromSpriteUrl: vaultPokemonFrontSpriteUrlV4(beforeDetail, result.beforePokemon.shiny),
    toSpriteUrl: vaultPokemonFrontSpriteUrlV4(afterDetail, result.pokemon.shiny),
  };
}

function applyPpRecovery(moves: TrainingMoveSlotV4[], effect: NonNullable<DexItemRecoveryEffect["pp"]>): {moves: TrainingMoveSlotV4[]; recovered: number; moveIndex: number | null} {
  if (effect.scope === "all") {
    let recovered = 0;
    const nextMoves = moves.map(move => {
      const nextPp = effect.full ? move.maxPp : Math.min(move.maxPp, move.remainingPp + Math.max(0, effect.amount || 0));
      recovered += Math.max(0, nextPp - move.remainingPp);
      return {...move, remainingPp: nextPp};
    });
    return {moves: nextMoves, recovered, moveIndex: null};
  }

  const moveIndex = lowestPpRatioMoveIndex(moves);
  if (moveIndex < 0) return {moves, recovered: 0, moveIndex: null};
  const picked = moves[moveIndex]!;
  const nextPp = effect.full ? picked.maxPp : Math.min(picked.maxPp, picked.remainingPp + Math.max(0, effect.amount || 0));
  const recovered = Math.max(0, nextPp - picked.remainingPp);
  return {
    moves: moves.map((move, index) => index === moveIndex ? {...move, remainingPp: nextPp} : move),
    recovered,
    moveIndex,
  };
}

function findPlayerVaultItemByKeyV4(vault: PlayerVaultV4, itemKey: string): PlayerItemRecordV4 | null {
  return vault.items.find(item => playerVaultItemRecordKeyV4(item) === itemKey || item.itemId === itemKey) || null;
}

function playerVaultItemRecordKeyV4(item: PlayerItemRecordV4): string {
  return `${item.boxKind || "storage"}:${item.storagePageIndex || 0}:${item.slotIndex || 0}:${item.itemId}`;
}

function consumePlayerVaultItemRecordV4(items: PlayerItemRecordV4[], target: PlayerItemRecordV4): PlayerItemRecordV4[] {
  const targetKey = playerVaultItemRecordKeyV4(target);
  return items.flatMap(entry => {
    if (playerVaultItemRecordKeyV4(entry) !== targetKey) return [entry];
    if (entry.quantity <= 1) return [];
    return [{...entry, quantity: entry.quantity - 1}];
  });
}

function applyPlayerVaultMoveRecordV4(
  dex: PlayerVaultMoveTeachingDexV4,
  normalized: PlayerVaultV4,
  item: PlayerItemRecordV4,
  pokemon: PlayerPokemonRecordV4,
  move: DexMoveSummary,
  moveSlotInput: number,
  markForbiddenManualUsed: boolean,
): PlayerVaultMoveTeachingApplyResultV4 {
  const moveSlot = Math.max(0, Math.min(3, Math.floor(Number(moveSlotInput || 0))));
  const nextMoves = Array.from({length: 4}, (_, index) => pokemon.moves[index] || {moveId: ""})
    .map((entry, index) => index === moveSlot ? {moveId: move.id, remainingPp: move.pp, maxPp: move.pp} : entry)
    .filter(entry => Boolean(entry.moveId));
  const nextPokemon: PlayerPokemonRecordV4 = {
    ...pokemon,
    moves: nextMoves,
    growthFlags: markForbiddenManualUsed
      ? {...pokemon.growthFlags, forbiddenManualUsedAt: new Date().toISOString()}
      : pokemon.growthFlags,
  };
  const nextVault = normalizePlayerVaultV4({
    ...normalized,
    items: consumePlayerVaultItemRecordV4(normalized.items, item),
    pokemon: normalized.pokemon.map(entry => entry.playerPokemonId === nextPokemon.playerPokemonId ? nextPokemon : entry),
  });
  return {
    ok: true,
    vault: nextVault,
    pokemon: nextPokemon,
    message: `${playerVaultPokemonShortNameV4(dex, pokemon)} 学会了 ${move.nameZh || move.name || move.id}。`,
  };
}

function safeVaultItemDetailV4(dex: PlayerVaultMoveTeachingDexV4, itemId: string): DexItemDetail | null {
  try {
    return dex.getItemDetail(itemId);
  } catch {
    return null;
  }
}

function safeVaultMoveDetailV4(dex: PlayerVaultMoveTeachingDexV4, moveId: string): DexMoveSummary | null {
  try {
    return dex.getMoveDetail(moveId);
  } catch {
    return null;
  }
}

function playerVaultPokemonShortNameV4(dex: PlayerVaultMoveTeachingDexV4, pokemon: PlayerPokemonRecordV4): string {
  if (pokemon.nickname) return pokemon.nickname;
  try {
    const detail = dex.getPokemonDetail(pokemon.speciesId);
    return detail?.nameZh || detail?.name || pokemon.speciesId;
  } catch {
    return pokemon.speciesId;
  }
}

function previewPlayerVaultNumericItemRecordV4(
  dex: PlayerVaultMoveTeachingDexV4,
  item: PlayerItemRecordV4,
  pokemon: PlayerPokemonRecordV4,
): {ok: true; itemName: string; pokemon: PlayerPokemonRecordV4; changes: Array<{label: string; before: string; after: string}>} | {ok: false; reason: string} {
  const detail = safeVaultItemDetailV4(dex, item.itemId);
  const itemName = detail?.nameZh || detail?.name || item.itemId;
  if (detail?.friendshipEffect) {
    const maxFriendship = Math.max(0, Math.floor(Number(detail.friendshipEffect.max ?? 255)));
    const beforeFriendship = Math.max(0, Math.floor(Number(pokemon.friendship || 0)));
    const nextFriendship = Math.min(maxFriendship, beforeFriendship + Math.max(0, Math.floor(Number(detail.friendshipEffect.amount || 0))));
    if (nextFriendship <= beforeFriendship) return {ok: false, reason: "这只宝可梦的亲密度已经达到上限。"};
    return {
      ok: true,
      itemName,
      pokemon: {...pokemon, friendship: nextFriendship},
      changes: [{label: "亲密度", before: String(beforeFriendship), after: String(nextFriendship)}],
    };
  }
  if (detail?.trainingEffect) {
    const localPokemon = playerVaultPokemonToLocalPokemonV4(dex, pokemon);
    const result = applyTrainingItemToPokemonV4({
      item: playerVaultItemRecordToInstanceV4(item, detail),
      detail,
      pokemon: localPokemon,
      bag: {maxSize: 1, items: [playerVaultItemRecordToInstanceV4(item, detail)]},
      pokemonDetail: safePokemonDetailV4(dex, pokemon.speciesId),
      calculateMaxHp: next => dex.calculatePokemonStats?.({speciesId: next.speciesId, level: next.level, nature: next.nature, evs: next.evs, ivs: next.ivs}).stats.hp || next.maxHp,
      translateDexLabel: dex.translateDexLabel,
    });
    if (!result.ok) return result;
    const nextPokemon = localPokemonToPlayerVaultPokemonV4(pokemon, result.pokemon);
    const changes = numericChangesForPlayerVaultPokemonV4(dex, pokemon, nextPokemon);
    if (!changes.length) return {ok: false, reason: "目标当前不需要这个道具。"};
    return {ok: true, itemName, pokemon: nextPokemon, changes};
  }
  return {ok: false, reason: "该道具没有可预览的数值变化。"};
}

function playerVaultPokemonToLocalPokemonV4(dex: PlayerVaultMoveTeachingDexV4, pokemon: PlayerPokemonRecordV4): LocalPokemonV4 {
  const detail = safePokemonDetailV4(dex, pokemon.speciesId);
  const speciesName = detail?.name || pokemon.speciesId;
  const speciesNameZh = detail?.nameZh || speciesName;
  const ability = detail?.abilities.find(entry => entry.id === pokemon.abilityId);
  const level = Math.max(1, Math.min(100, Math.floor(Number(pokemon.level || 50))));
  const maxHp = dex.calculatePokemonStats?.({speciesId: pokemon.speciesId, level, nature: pokemon.nature, evs: pokemon.evs, ivs: pokemon.ivs}).stats.hp || 1;
  return {
    localPokemonId: pokemon.playerPokemonId,
    speciesId: pokemon.speciesId,
    name: pokemon.nickname || speciesName,
    nameZh: pokemon.nickname || speciesNameZh,
    level,
    gender: pokemon.gender,
    shiny: pokemon.shiny,
    itemId: pokemon.heldItemId || "",
    heldItemInstanceId: undefined,
    abilityId: pokemon.abilityId,
    abilityName: ability?.name || pokemon.abilityId,
    abilityNameZh: ability?.nameZh || ability?.name || pokemon.abilityId,
    nature: pokemon.nature,
    moves: pokemon.moves.map(move => playerVaultMoveToLocalMoveV4(dex, move.moveId)),
    evs: pokemon.evs,
    ivs: pokemon.ivs,
    entryHp: maxHp,
    entryStatus: "",
    maxHp,
  };
}

function localPokemonToPlayerVaultPokemonV4(base: PlayerPokemonRecordV4, local: LocalPokemonV4): PlayerPokemonRecordV4 {
  return {
    ...base,
    level: local.level,
    nature: local.nature,
    abilityId: local.abilityId,
    evs: local.evs,
    ivs: local.ivs,
  };
}

function playerVaultMoveToLocalMoveV4(dex: PlayerVaultMoveTeachingDexV4, moveId: string): TrainingMoveSlotV4 {
  const move = safeVaultMoveDetailV4(dex, moveId);
  return move ? moveSlotFromDexMove(move) : {moveId, name: moveId, nameZh: moveId, type: "-", category: "-", power: 0, accuracy: null, pp: 0, maxPp: 0, remainingPp: 0};
}

function playerVaultItemRecordToInstanceV4(item: PlayerItemRecordV4, detail: DexItemDetail): PlayerItemInstanceV4 {
  return {
    id: playerVaultItemRecordKeyV4(item),
    itemID: item.itemId,
    name: detail.nameZh || detail.name || item.itemId,
    image: detail.iconUrl || "",
    cost: detail.cost || 0,
    canSale: Boolean(detail.canSale),
    type: playerItemTypeForDexKindV4(detail.kind),
    canBattleUse: Boolean(detail.canBattleUse),
    canUse: Boolean(detail.canUse),
    canUseToPokemon: Boolean(detail.canUseToPokemon),
    canTake: Boolean(detail.canTake),
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
  };
}

function playerItemTypeForDexKindV4(kind: DexItemDetail["kind"]): PlayerItemInstanceV4["type"] {
  if (kind === "recovery" || kind === "revive" || kind === "pp") return "medicine";
  if (kind === "valuable") return "key";
  if (kind === "parenting" || kind === "special" || kind === "other") return "misc";
  return kind;
}

function safePokemonDetailV4(dex: PlayerVaultMoveTeachingDexV4, speciesId: string): DexPokemonDetail | null {
  try {
    return dex.getPokemonDetail(speciesId);
  } catch {
    return null;
  }
}

function safeVaultEvolutionTreeV4(dex: PlayerVaultMoveTeachingDexV4, speciesId: string): {edges: DexPokemonEvolutionEdge[]} {
  try {
    return dex.getPokemonEvolutionTree?.(speciesId) || {edges: []};
  } catch {
    return {edges: []};
  }
}

function evolutionCandidateViewV4(dex: PlayerVaultMoveTeachingDexV4, pokemon: PlayerPokemonRecordV4, candidate: PlayerVaultEvolutionCandidateV4): PlayerVaultEvolutionViewTargetV4 {
  const toDetail = safePokemonDetailV4(dex, candidate.toSpeciesId);
  const beforeStats = vaultPokemonStatMapV4(dex, pokemon);
  const afterStats = vaultPokemonStatMapV4(dex, {...pokemon, speciesId: candidate.toSpeciesId});
  return {
    toSpeciesId: candidate.toSpeciesId,
    toName: toDetail?.nameZh || toDetail?.name || candidate.toSpeciesId,
    toSpriteUrl: vaultPokemonFrontSpriteUrlV4(toDetail, pokemon.shiny),
    friendshipRequirement: candidate.friendshipRequirement || 0,
    statChanges: STAT_IDS.flatMap(stat => {
      const before = Math.max(0, Math.floor(Number(beforeStats[stat] || 0)));
      const after = Math.max(0, Math.floor(Number(afterStats[stat] || 0)));
      if (before === after) return [];
      return [{label: dex.translateDexLabel?.("stats", stat) || stat, before: String(before), after: String(after)}];
    }),
  };
}

function vaultPokemonStatMapV4(dex: PlayerVaultMoveTeachingDexV4, pokemon: PlayerPokemonRecordV4): Record<string, number> {
  try {
    return dex.calculatePokemonStats?.({speciesId: pokemon.speciesId, level: pokemon.level || 50, nature: pokemon.nature, evs: pokemon.evs, ivs: pokemon.ivs}).stats || {};
  } catch {
    return {};
  }
}

function vaultPokemonFrontSpriteUrlV4(detail: DexPokemonDetail | null, shiny: boolean): string {
  if (!detail) return "";
  return shiny
    ? detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl || ""
    : detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl || "";
}

function vaultEvolutionStageCountV4(edges: Array<{fromSpeciesId: string; toSpeciesId: string}>): number {
  const incoming = new Map(edges.map(edge => [edge.toSpeciesId, edge.fromSpeciesId]));
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const next = outgoing.get(edge.fromSpeciesId) || [];
    next.push(edge.toSpeciesId);
    outgoing.set(edge.fromSpeciesId, next);
  }
  const roots = new Set(edges.map(edge => edge.fromSpeciesId).filter(speciesId => !incoming.has(speciesId)));
  const stack = [...roots].map(speciesId => ({speciesId, depth: 0, visited: new Set<string>()}));
  let maxDepth = edges.length ? 1 : 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (current.visited.has(current.speciesId)) continue;
    const visited = new Set(current.visited);
    visited.add(current.speciesId);
    const nextSpecies = outgoing.get(current.speciesId) || [];
    if (!nextSpecies.length) {
      maxDepth = Math.max(maxDepth, current.depth);
      continue;
    }
    for (const next of nextSpecies) stack.push({speciesId: next, depth: current.depth + 1, visited});
  }
  return maxDepth;
}

function numericChangesForPlayerVaultPokemonV4(dex: PlayerVaultMoveTeachingDexV4, before: PlayerPokemonRecordV4, after: PlayerPokemonRecordV4): Array<{label: string; before: string; after: string}> {
  const changes: Array<{label: string; before: string; after: string}> = [];
  if ((before.level || 50) !== (after.level || 50)) changes.push({label: "等级", before: `Lv.${before.level || 50}`, after: `Lv.${after.level || 50}`});
  if (before.nature !== after.nature) changes.push({label: "性格", before: dex.translateDexLabel?.("natures", before.nature) || before.nature, after: dex.translateDexLabel?.("natures", after.nature) || after.nature});
  if (before.abilityId !== after.abilityId) changes.push({label: "特性", before: abilityLabelV4(dex, before), after: abilityLabelV4(dex, after)});
  for (const stat of STAT_IDS) {
    if (before.evs[stat] !== after.evs[stat]) changes.push({label: `${dex.translateDexLabel?.("stats", stat) || stat}努力`, before: String(before.evs[stat]), after: String(after.evs[stat])});
    if (before.ivs[stat] !== after.ivs[stat]) changes.push({label: `${dex.translateDexLabel?.("stats", stat) || stat}个体`, before: String(before.ivs[stat]), after: String(after.ivs[stat])});
  }
  return changes;
}

function abilityLabelV4(dex: PlayerVaultMoveTeachingDexV4, pokemon: PlayerPokemonRecordV4): string {
  const detail = safePokemonDetailV4(dex, pokemon.speciesId);
  const ability = detail?.abilities.find(entry => entry.id === pokemon.abilityId);
  return ability?.nameZh || ability?.name || pokemon.abilityId || "未知";
}

function playerVaultMoveTeachingPoolV4(
  dex: PlayerVaultMoveTeachingDexV4,
  pokemon: PlayerPokemonRecordV4,
  effect: NonNullable<DexItemDetail["moveTeachingEffect"]>,
  query: string,
): DexMoveSummary[] {
  const byId = new Map<string, DexMoveSummary>();
  const push = (moves: DexMoveSummary[]) => {
    for (const move of moves) byId.set(dex.toDexId(move.id), move);
  };
  if (effect.kind === "any") {
    for (const row of dex.searchDex({category: "moves", query, limit: query.trim() ? 80 : 40}).rows) {
      try {
        const move = dex.getMoveDetail(row.id);
        byId.set(dex.toDexId(move.id), move);
      } catch {
        // Ignore stale search rows.
      }
    }
  } else {
    for (const source of effect.sources) push(dex.getPokemonSkillsBySource(pokemon.speciesId, source));
  }
  const learned = new Set(pokemon.moves.map(move => dex.toDexId(move.moveId)));
  const needle = query.trim().toLowerCase();
  return Array.from(byId.values())
    .filter(move => !learned.has(dex.toDexId(move.id)))
    .filter(move => !needle || [move.id, move.name, move.nameZh, move.type, move.category].some(value => String(value || "").toLowerCase().includes(needle)))
    .slice(0, effect.kind === "any" ? 80 : 200);
}

function playerVaultMoveTeachingSourceLabelV4(effect: NonNullable<DexItemDetail["moveTeachingEffect"]>): string {
  if (effect.kind === "any") return "任意技能";
  const labels: Record<string, string> = {
    levelup: "自学技能",
    tutor: "教授技能",
    egg: "遗传技能",
    event: "活动技能",
    transfer: "迁移技能",
    other: "特殊来源技能",
    machine: "技能机器",
  };
  return effect.sources.map(source => labels[source] || source).join(" / ");
}


function moveSlotFromDexMove(move: DexMoveSummary): TrainingMoveSlotV4 {
  return {
    moveId: move.id,
    name: move.name,
    nameZh: move.nameZh,
    type: move.type,
    category: move.category,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    maxPp: move.pp,
    remainingPp: move.pp,
  };
}

function lowestPpRatioMoveIndex(moves: TrainingMoveSlotV4[]): number {
  let bestIndex = -1;
  let bestRatio = Number.POSITIVE_INFINITY;
  moves.forEach((move, index) => {
    if (move.maxPp <= 0 || move.remainingPp >= move.maxPp) return;
    const ratio = move.remainingPp / move.maxPp;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function hpTargetForEffect(effect: NonNullable<DexItemRecoveryEffect["hp"]>, pokemon: LocalPokemonV4): number {
  if (effect.kind === "full") return pokemon.maxHp;
  if (effect.kind === "fixed") return pokemon.entryHp + Math.max(0, effect.amount);
  const denominator = Math.max(1, effect.denominator);
  return pokemon.entryHp + Math.max(1, Math.floor(pokemon.maxHp * effect.numerator / denominator));
}

function statusMatches(effect: NonNullable<DexItemRecoveryEffect["cureStatus"]>, status: TrainingStatusV4): boolean {
  if (!RECOVERABLE_STATUS.has(status)) return false;
  if (effect === "all") return true;
  return effect.includes(status as Exclude<TrainingStatusV4, "">);
}

function applyEvEffect(evs: StatTableV4, effect: Extract<DexItemTrainingEffect, {kind: "ev"}>): StatTableV4 | null {
  const current = clampInt(evs[effect.stat], 0, 252);
  const total = STAT_IDS.reduce((sum, stat) => sum + clampInt(evs[stat], 0, 252), 0);
  let nextValue = current;
  if (effect.mode === "add") {
    const desired = effect.target !== undefined ? Math.max(current, effect.target) : current + Math.max(0, effect.amount || 0);
    const allowedByTotal = Math.max(0, 510 - total);
    nextValue = Math.min(252, desired, current + allowedByTotal);
  } else {
    const desired = effect.target !== undefined ? Math.min(current, effect.target) : current - Math.max(0, effect.amount || 0);
    nextValue = Math.max(0, desired);
  }
  if (nextValue === current) return null;
  return {...evs, [effect.stat]: nextValue};
}

function nextAbilityForEffect(pokemon: LocalPokemonV4, detail: DexPokemonDetail | null, mode: "capsule" | "patch"): DexPokemonDetail["abilities"][number] | null {
  const abilities = detail?.abilities || [];
  if (mode === "patch") {
    const hidden = abilities.find(ability => ability.hidden);
    if (!hidden || hidden.id === pokemon.abilityId) return null;
    return hidden;
  }
  const ordinary = abilities.filter(ability => !ability.hidden);
  if (ordinary.length < 2) return null;
  const currentIndex = ordinary.findIndex(ability => ability.id === pokemon.abilityId);
  return ordinary[(currentIndex + 1 + ordinary.length) % ordinary.length] || null;
}

function applyIvEffect(ivs: StatTableV4, mode: "silver" | "gold" | "gray"): StatTableV4 | null {
  if (mode === "gold") {
    if (STAT_IDS.every(stat => ivs[stat] >= 31)) return null;
    return Object.fromEntries(STAT_IDS.map(stat => [stat, 31])) as StatTableV4;
  }
  if (mode === "gray") {
    const stat = STAT_IDS
      .filter(candidate => ivs[candidate] > 0)
      .sort((a, b) => ivs[b] - ivs[a] || STAT_IDS.indexOf(a) - STAT_IDS.indexOf(b))[0];
    return stat ? {...ivs, [stat]: 0} : null;
  }
  const stat = STAT_IDS
    .filter(candidate => ivs[candidate] < 31)
    .sort((a, b) => ivs[a] - ivs[b] || STAT_IDS.indexOf(a) - STAT_IDS.indexOf(b))[0];
  return stat ? {...ivs, [stat]: 31} : null;
}

function consumeItemInstance(bag: BagStateV4, itemInstanceId: string): BagStateV4 {
  return {...bag, items: bag.items.filter(item => item.id !== itemInstanceId)};
}

function clearHeldReferenceIfConsumed(pokemon: LocalPokemonV4, item: PlayerItemInstanceV4): LocalPokemonV4 {
  if (pokemon.heldItemInstanceId === item.id || pokemon.itemId === item.itemID && !pokemon.heldItemInstanceId) {
    return {...pokemon, itemId: "", heldItemInstanceId: undefined};
  }
  return pokemon;
}

function buildRecoveryMessage(
  pokemonName: string,
  itemName: string,
  effect: Pick<Extract<ConsumableItemApplyResultV4, {ok: true}>, "hpRecovered" | "ppRecovered" | "statusCured" | "revived" | "healedMoveIndex"> & {pokemon: LocalPokemonV4},
): string {
  if (effect.revived) return `${pokemonName} 使用了${itemName}，恢复了战斗能力。`;
  if (effect.hpRecovered > 0) return `${pokemonName} 使用了${itemName}，恢复了 ${effect.hpRecovered} 点 HP。`;
  if (effect.ppRecovered > 0) {
    const move = effect.healedMoveIndex === null ? null : effect.pokemon.moves[effect.healedMoveIndex];
    return `${pokemonName} 使用了${itemName}，${move?.nameZh || move?.name || "招式"}恢复了 ${effect.ppRecovered} 点 PP。`;
  }
  if (effect.statusCured) return `${pokemonName} 使用了${itemName}，异常状态解除了。`;
  return `${pokemonName} 使用了${itemName}。`;
}

function clonePokemon(pokemon: LocalPokemonV4): LocalPokemonV4 {
  return {...pokemon, moves: pokemon.moves.map(move => ({...move}))};
}

function normalizeItemId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

const FALLBACK_RECOVERY_EFFECTS: Record<string, DexItemRecoveryEffect> = {
  potion: {hp: {kind: "fixed", amount: 20}},
  superpotion: {hp: {kind: "fixed", amount: 60}},
  hyperpotion: {hp: {kind: "fixed", amount: 120}},
  maxpotion: {hp: {kind: "full"}},
  fullrestore: {hp: {kind: "full"}, cureStatus: "all"},
  freshwater: {hp: {kind: "fixed", amount: 30}},
  sodapop: {hp: {kind: "fixed", amount: 50}},
  lemonade: {hp: {kind: "fixed", amount: 70}},
  moomoomilk: {hp: {kind: "fixed", amount: 100}},
  fullheal: {cureStatus: "all"},
  healpowder: {cureStatus: "all"},
  antidote: {cureStatus: ["psn", "tox"]},
  burnheal: {cureStatus: ["brn"]},
  iceheal: {cureStatus: ["frz"]},
  awakening: {cureStatus: ["slp"]},
  paralyzeheal: {cureStatus: ["par"]},
  energypowder: {hp: {kind: "fixed", amount: 60}},
  energyroot: {hp: {kind: "fixed", amount: 120}},
  revive: {revive: "half"},
  maxrevive: {revive: "full"},
  revivalherb: {revive: "full"},
  ether: {pp: {scope: "one", amount: 10}},
  maxether: {pp: {scope: "one", full: true}},
  elixir: {pp: {scope: "all", amount: 10}},
  maxelixir: {pp: {scope: "all", full: true}},
  oranberry: {hp: {kind: "fixed", amount: 10}},
  sitrusberry: {hp: {kind: "fraction", numerator: 1, denominator: 4}},
  leppaberry: {pp: {scope: "one", amount: 10}},
  lumberry: {cureStatus: "all"},
};

const FALLBACK_TRAINING_EFFECTS: Record<string, DexItemTrainingEffect> = {
  ...Object.fromEntries(STAT_IDS.flatMap(stat => [
    [`ev${stat}max`, {kind: "ev", stat, mode: "add", target: 252}],
    [`ev${stat}large`, {kind: "ev", stat, mode: "add", target: 100}],
    [`ev${stat}plus`, {kind: "ev", stat, mode: "add", amount: 10}],
    [`ev${stat}small`, {kind: "ev", stat, mode: "add", amount: 1}],
    [`ev${stat}zero`, {kind: "ev", stat, mode: "reduce", target: 0}],
    [`ev${stat}downlarge`, {kind: "ev", stat, mode: "reduce", target: 100}],
    [`ev${stat}down`, {kind: "ev", stat, mode: "reduce", amount: 10}],
    [`ev${stat}downsmall`, {kind: "ev", stat, mode: "reduce", amount: 1}],
  ])) as Record<string, DexItemTrainingEffect>,
  ...Object.fromEntries(NATURE_NAMES.map(nature => [`${normalizeItemId(nature)}mint`, {kind: "nature", nature}])) as Record<string, DexItemTrainingEffect>,
  rarecandy: {kind: "level", amount: 1},
  hpup: {kind: "ev", stat: "hp", mode: "add", target: 100},
  protein: {kind: "ev", stat: "atk", mode: "add", target: 100},
  iron: {kind: "ev", stat: "def", mode: "add", target: 100},
  calcium: {kind: "ev", stat: "spa", mode: "add", target: 100},
  zinc: {kind: "ev", stat: "spd", mode: "add", target: 100},
  carbos: {kind: "ev", stat: "spe", mode: "add", target: 100},
  abilitycapsule: {kind: "ability", mode: "capsule"},
  abilitypatch: {kind: "ability", mode: "patch"},
  bottlecap: {kind: "iv", mode: "silver"},
  goldbottlecap: {kind: "iv", mode: "gold"},
  graybottlecap: {kind: "iv", mode: "gray"},
};
