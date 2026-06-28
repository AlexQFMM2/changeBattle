import type {DexItemDetail, DexItemRecoveryEffect} from "@changebattle-v2/showdown-dex-core";
import type {BagStateV4, LocalPokemonV4, PlayerItemInstanceV4, TrainingMoveSlotV4, TrainingStatusV4} from "./training.js";

export type ConsumableItemApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; bag: BagStateV4; message: string; hpRecovered: number; ppRecovered: number; statusCured: boolean; revived: boolean; healedMoveIndex: number | null}
  | {ok: false; reason: string};

const RECOVERABLE_STATUS = new Set<TrainingStatusV4>(["brn", "par", "psn", "tox", "slp", "frz"]);

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
