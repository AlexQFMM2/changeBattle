import type {DexItemDetail, DexItemRecoveryEffect, DexItemTrainingEffect, DexPokemonDetail, DexStatId} from "@changebattle-v2/showdown-dex-core";
import type {BagStateV4, LocalPokemonV4, PlayerItemInstanceV4, StatTableV4, TrainingMoveSlotV4, TrainingStatusV4} from "./training.js";

export type ConsumableItemApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; bag: BagStateV4; message: string; hpRecovered: number; ppRecovered: number; statusCured: boolean; revived: boolean; healedMoveIndex: number | null}
  | {ok: false; reason: string};

export type TrainingItemApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; bag: BagStateV4; message: string}
  | {ok: false; reason: string};

const RECOVERABLE_STATUS = new Set<TrainingStatusV4>(["brn", "par", "psn", "tox", "slp", "frz"]);
const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const STAT_LABELS: Record<DexStatId, string> = {hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"};
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
  calculateMaxHp?: (pokemon: LocalPokemonV4) => number;
}): TrainingItemApplyResultV4 {
  const effect = trainingEffectForItemV4(input.item, input.detail);
  if (!effect) return {ok: false, reason: "该道具当前不能训练使用。"};
  const before = input.pokemon;
  let next = clonePokemon(before);
  let message = "";

  if (effect.kind === "ev") {
    const nextEvs = applyEvEffect(before.evs, effect);
    if (!nextEvs) return {ok: false, reason: `${STAT_LABELS[effect.stat]}努力值当前不需要这个道具。`};
    next = {...next, evs: nextEvs};
    message = `${before.nameZh || before.name} 的${STAT_LABELS[effect.stat]}努力值变为 ${nextEvs[effect.stat]}。`;
  } else if (effect.kind === "nature") {
    if (before.nature === effect.nature) return {ok: false, reason: "目标已经是这个性格。"};
    next = {...next, nature: effect.nature};
    message = `${before.nameZh || before.name} 的性格调整为 ${effect.nature}。`;
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
  }

  const nextBag = consumeItemInstance(input.bag, input.item.id);
  return {
    ok: true,
    pokemon: clearHeldReferenceIfConsumed(next, input.item),
    bag: nextBag,
    message,
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
