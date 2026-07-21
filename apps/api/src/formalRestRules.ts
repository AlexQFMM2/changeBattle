import type {DexStatId} from "@changebattle-v2/showdown-dex-core";
import {
  FORMAL_SHOP_CATEGORY_ORDER,
  FORMAL_TRAINING_GROUND_SELF_STUDY_NATURE_RISK_TARGETS_V4,
  formalAdvancePowerProfileV4,
  formalCreateRngV4,
  formalInferPowerProfileForTotalsV4,
  formalNormalizePowerProfileV4,
  formalRollPowerProfileEvCapV4,
  formalRollPowerProfileIvCapV4,
  formalRollTrainingGroundSelfStudyEventV4,
  formalShopItemPoolForCategoryV4,
  formalShopSlotsForCategoryV4,
  formalShuffleV4,
  formalToIdV4,
  formalTrainingGroundDynamicSelfStudyGainRuleV4,
  formalTrainingGroundStableSelfStudyGainRuleV4,
} from "@changebattle-v2/core";
import {formalShopRowsForStarChartV4, starChartHasRuntimeEffectV4, starChartRuntimeEffectValuesV4, type StarChartStateV4} from "./starChart.js";
import type {FormalPokemonExchangeFlagsV4, FormalRestShopV4, FormalShopCategoryV4, FormalShopItemV4, FormalShopRestockContextV4} from "./formalGame.js";
import {formalShopRestockItemWeightV4} from "./formalGame.js";
import type {LocalPokemonV4, StatTableV4, TrainingStatusV4} from "./training.js";

const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];

export type FormalRestRulesMaxHpCalculatorV5 = (pokemon: LocalPokemonV4) => number | null | undefined;

export type FormalSelfStudyRuleInputV5 = {
  seed: string;
  nodeId: string;
  lessonRoll: number;
  selfStudyRoll: number;
  pokemon: LocalPokemonV4;
  starChart?: StarChartStateV4 | null;
  calculateMaxHp?: FormalRestRulesMaxHpCalculatorV5;
};

export type FormalSelfStudyRuleResultV5 = {
  pokemon: LocalPokemonV4;
  event: "playful" | "normal" | "focused";
  messageText: string;
  change: {
    levelBefore: number;
    levelAfter: number;
    natureBefore: string;
    natureAfter: string;
    ivsBefore: StatTableV4;
    ivsAfter: StatTableV4;
    evsBefore: StatTableV4;
    evsAfter: StatTableV4;
  };
};

export type FormalShopRuleContextInputV5 = {
  seed: string;
  nodeId: string;
  roundIndex: number;
  money: number;
  team: LocalPokemonV4[];
  starChart?: StarChartStateV4 | null;
  pendingSettlement?: boolean;
  updatedAt: string;
};

export type FormalShopRestockRuleInputV5 = FormalShopRuleContextInputV5 & {
  shop: FormalRestShopV4;
  slotId: string;
  restockRoll: number;
};

export type FormalStatRerollRuleInputV5 = {
  seed: string;
  nodeId: string;
  pokemon: LocalPokemonV4;
  part: "ivs" | "evs";
  lockedStats: DexStatId[];
  rerollRoll: number;
  calculateMaxHp?: FormalRestRulesMaxHpCalculatorV5;
};

export type FormalExchangePokemonRuleInputV5 = {
  seed: string;
  nodeId: string;
  pokemon: LocalPokemonV4;
  slotIndex: number;
  exchangeRoll: number;
  flags: FormalPokemonExchangeFlagsV4;
  receivedPokemonId?: string;
  calculateMaxHp?: FormalRestRulesMaxHpCalculatorV5;
};

export function applyFormalSelfStudyRuleV5(input: FormalSelfStudyRuleInputV5): FormalSelfStudyRuleResultV5 {
  const pokemon = input.pokemon;
  const lessonRoll = Math.max(0, Math.floor(Number(input.lessonRoll || 0)));
  const selfStudyRoll = Math.max(0, Math.floor(Number(input.selfStudyRoll || 0)));
  const rng = formalCreateRngV4(`${input.seed}:${input.nodeId}:training-ground:self-study:${lessonRoll}:${selfStudyRoll}:${pokemon.localPokemonId}`);
  const event = formalRollTrainingGroundSelfStudyEventV4(pokemon, rng);
  const beforeIvs = normalizeStatsV5(pokemon.ivs, 31, 31);
  const beforeEvs = normalizeStatsV5(pokemon.evs, 0, 252);
  const levelBefore = clampIntV5(pokemon.level, 1, 100, 50);
  const baseRule = formalTrainingGroundDynamicSelfStudyGainRuleV4(event, {
    ivTotal: statTotalV5(beforeIvs),
    evTotal: statTotalV5(beforeEvs),
  });
  const selfStudyRule = starChartHasRuntimeEffectV4(input.starChart, "self_study_stable_range")
    ? formalTrainingGroundStableSelfStudyGainRuleV4(baseRule)
    : baseRule;
  const ivDelta = randomIntV5(selfStudyRule.iv[0], selfStudyRule.iv[1], rng);
  const evDelta = randomIntV5(selfStudyRule.ev[0], selfStudyRule.ev[1], rng);
  const nextIvTarget = clampIntV5(statTotalV5(beforeIvs) + ivDelta, 0, 31 * STAT_IDS.length, statTotalV5(beforeIvs));
  const nextEvTarget = clampIntV5(statTotalV5(beforeEvs) + evDelta, 0, 510, statTotalV5(beforeEvs));
  const nextIvs = adjustStatTableToTotalV5(beforeIvs, nextIvTarget, 31, shuffledStatsV5(rng), rng);
  const nextEvs = adjustStatTableToTotalV5(beforeEvs, nextEvTarget, 252, shuffledStatsV5(rng), rng);
  const levelAfter = levelBefore;
  const natureBefore = pokemon.nature || "Serious";
  const natureRisk = starChartHasRuntimeEffectV4(input.starChart, "self_study_nature_risk")
    ? Math.max(0, Math.min(1, Math.max(...starChartRuntimeEffectValuesV4(input.starChart, "self_study_nature_risk"))))
    : 0;
  const natureAfter = natureRisk > 0 && rng() < natureRisk
    ? pickOneV5(FORMAL_TRAINING_GROUND_SELF_STUDY_NATURE_RISK_TARGETS_V4, rng) || natureBefore
    : natureBefore;
  const maxHp = calculateMaxHpV5({...pokemon, level: levelAfter, nature: natureAfter, ivs: nextIvs, evs: nextEvs}, input.calculateMaxHp);
  const hpRatio = pokemon.maxHp > 0 ? pokemon.entryHp / pokemon.maxHp : 1;
  const eventText = event === "playful"
    ? "贪玩了一节课，基础训练有些起伏"
    : event === "focused"
      ? "认真学习了一整节课，数值明显提升"
      : "踏踏实实自习了一节课，数值稳步提升";
  return {
    pokemon: {
      ...pokemon,
      level: levelAfter,
      nature: natureAfter,
      ivs: nextIvs,
      evs: nextEvs,
      powerProfile: pokemon.powerProfile,
      ivTotalCap: pokemon.ivTotalCap,
      evTotalCap: pokemon.evTotalCap,
      maxHp,
      entryHp: clampIntV5(Math.round(maxHp * hpRatio), 0, maxHp, maxHp),
    },
    event,
    messageText: eventText,
    change: {
      levelBefore,
      levelAfter,
      natureBefore,
      natureAfter,
      ivsBefore: beforeIvs,
      ivsAfter: nextIvs,
      evsBefore: beforeEvs,
      evsAfter: nextEvs,
    },
  };
}

export function buildFormalShopRestockContextV5(input: Pick<FormalShopRuleContextInputV5, "roundIndex" | "money" | "team">): FormalShopRestockContextV4 {
  const team = input.team || [];
  const aliveTeam = team.filter(pokemon => pokemon.entryHp > 0);
  const hpPressure = team.reduce((sum, pokemon) => {
    const maxHp = Math.max(1, Number(pokemon.maxHp || pokemon.entryHp || 1));
    if (pokemon.entryHp <= 0) return sum + 1;
    return sum + Math.max(0, 1 - Math.max(0, Math.min(maxHp, pokemon.entryHp)) / maxHp);
  }, 0);
  return {
    roundIndex: Math.max(0, Math.floor(Number(input.roundIndex || 0))),
    money: clampIntV5(input.money, 0, 999999, 1000),
    teamSize: team.length,
    hpPressure,
    faintedCount: team.filter(pokemon => pokemon.entryHp <= 0).length,
    statusCount: aliveTeam.filter(pokemon => Boolean(pokemon.entryStatus)).length,
    lowPpCount: aliveTeam.reduce((sum, pokemon) => sum + (pokemon.moves || []).filter(move => move.maxPp > 0 && move.remainingPp / move.maxPp <= 0.35).length, 0),
    emptyHeldItemSlots: aliveTeam.filter(pokemon => !pokemon.itemId && !pokemon.heldItemInstanceId).length,
    physicalAttackers: aliveTeam.filter(pokemon => countMoveCategoryV5(pokemon, "physical") > countMoveCategoryV5(pokemon, "special")).length,
    specialAttackers: aliveTeam.filter(pokemon => countMoveCategoryV5(pokemon, "special") > countMoveCategoryV5(pokemon, "physical")).length,
    bulkyPokemon: aliveTeam.filter(pokemon => pokemon.maxHp >= 150 || ((pokemon.evs?.hp || 0) + (pokemon.evs?.def || 0) + (pokemon.evs?.spd || 0)) >= 180).length,
    poisonPokemon: aliveTeam.filter(pokemon => /poison/i.test(pokemon.speciesId) || pokemon.name.includes("毒") || pokemon.nameZh.includes("毒")).length,
    lowLevelPokemon: aliveTeam.filter(pokemon => pokemon.level < 100).length,
    imperfectIvPokemon: aliveTeam.filter(pokemon => Object.values(pokemon.ivs || {}).some(value => value < 31)).length,
  };
}

export function createFormalRestShopFromRuleContextV5(input: FormalShopRuleContextInputV5): FormalRestShopV4 {
  const restockContext = buildFormalShopRestockContextV5(input);
  const rows = formalShopRowsForStarChartV4(input.starChart);
  const categories = Object.fromEntries(FORMAL_SHOP_CATEGORY_ORDER.map(category => {
    const used = new Set<string>();
    const items = Array.from({length: formalShopSlotsForCategoryV4(category, Boolean(input.pendingSettlement), rows)}, (_, index) => {
      const item = createFormalShopSlotFromRuleContextV5(input, category, index, index, used, restockContext);
      used.add(item.itemID);
      return item;
    });
    return [category, items];
  })) as Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  return {nodeId: input.nodeId, seed: `${input.seed}:${input.nodeId}`, categories, updatedAt: input.updatedAt};
}

export function restockFormalShopSlotFromRuleContextV5(input: FormalShopRestockRuleInputV5): {shop: FormalRestShopV4; restocked: boolean} {
  const restockContext = buildFormalShopRestockContextV5(input);
  let restocked = false;
  const categories = Object.fromEntries(Object.entries(input.shop.categories).map(([rawCategory, items]) => {
    const category = rawCategory as FormalShopCategoryV4;
    return [category, items.map((item, index) => {
      if (item.slotId !== input.slotId) return item;
      restocked = true;
      const used = new Set((input.shop.categories[category] || []).map(entry => entry.itemID));
      return createFormalShopSlotFromRuleContextV5(input, category, index, input.restockRoll, used, restockContext);
    })];
  })) as Record<FormalShopCategoryV4, FormalShopItemV4[]>;
  return {
    shop: {
      ...input.shop,
      categories,
      updatedAt: input.updatedAt,
    },
    restocked,
  };
}

export function formalRestPokemonStatRerollCostV5(lockedCount: number): number {
  return 10 + Math.max(0, Math.min(STAT_IDS.length, Math.floor(Number(lockedCount || 0)))) * 5;
}

export function rerollFormalStatsWithinTotalFromRuleContextV5(input: FormalStatRerollRuleInputV5): LocalPokemonV4 {
  const lockedStats = normalizeStatLockListV5(input.lockedStats);
  const currentStats = input.part === "ivs" ? input.pokemon.ivs : input.pokemon.evs;
  const normalized = input.part === "ivs" ? normalizeStatsV5(input.pokemon.ivs, 31, 31) : normalizeStatsV5(input.pokemon.evs, 0, 252);
  const nextStats = rerollStatsWithinTotalV5(
    currentStats,
    statTotalV5(normalized),
    input.part === "ivs" ? 31 : 252,
    lockedStats,
    formalCreateRngV4(`${input.seed}:${input.nodeId}:rest-stat-reroll:${input.part}:${input.pokemon.localPokemonId}:${input.rerollRoll}`),
  );
  const nextIvs = input.part === "ivs" ? nextStats : input.pokemon.ivs;
  const nextEvs = input.part === "evs" ? nextStats : input.pokemon.evs;
  const maxHp = calculateMaxHpV5({...input.pokemon, ivs: nextIvs, evs: nextEvs}, input.calculateMaxHp);
  const hpRatio = input.pokemon.maxHp > 0 ? input.pokemon.entryHp / input.pokemon.maxHp : 1;
  return {
    ...input.pokemon,
    ivs: nextIvs,
    evs: nextEvs,
    maxHp,
    entryHp: clampIntV5(Math.round(maxHp * hpRatio), 0, maxHp, maxHp),
  };
}

export function prepareExchangedPokemonFromRuleContextV5(input: FormalExchangePokemonRuleInputV5): LocalPokemonV4 {
  const roll = Math.max(0, Math.floor(Number(input.exchangeRoll || 0)));
  const slotIndex = Math.max(0, Math.floor(Number(input.slotIndex || 0)));
  const rng = formalCreateRngV4(`${input.seed}:${input.nodeId}:pokemon-exchange:${input.pokemon.localPokemonId}:${slotIndex}:${roll}`);
  const stablePokemonId = input.receivedPokemonId || `p1-exchange-${roll}-${slotIndex + 1}-${formalToIdV4(input.pokemon.speciesId || input.pokemon.name)}`;
  let next: LocalPokemonV4 = {
    ...input.pokemon,
    localPokemonId: stablePokemonId,
    showdownIdentityToken: undefined,
    showdownId: undefined,
    pokeballId: undefined,
    entryStatus: "" as TrainingStatusV4,
    itemId: input.flags.itemSteal ? input.pokemon.itemId : "",
    heldItemInstanceId: input.flags.itemSteal ? input.pokemon.heldItemInstanceId : undefined,
  };
  if (input.flags.eliteEducation) {
    next = strengthenExchangedPokemonV5(next, rng, input.calculateMaxHp);
  } else {
    next = {...next, maxHp: calculateMaxHpV5(next, input.calculateMaxHp)};
  }
  const maxHp = Math.max(1, Math.floor(Number(next.maxHp || 1)));
  return {
    ...next,
    entryHp: input.flags.lossless ? maxHp : clampIntV5(Math.ceil(maxHp / 2), 1, maxHp, 1),
  };
}

function createFormalShopSlotFromRuleContextV5(
  input: FormalShopRuleContextInputV5,
  category: FormalShopCategoryV4,
  index: number,
  rollIndex: number,
  used: Set<string>,
  restockContext: FormalShopRestockContextV4,
): FormalShopItemV4 {
  const seed = `${input.seed}:${input.nodeId}:${category}:${index}:${Math.max(0, Math.floor(Number(rollIndex || 0)))}:${used.size}`;
  const itemID = pickFormalShopPoolItemV5(category, formalCreateRngV4(seed), used, restockContext, Boolean(input.pendingSettlement));
  return {
    slotId: `${input.nodeId}:${category}:${index}`,
    category,
    itemID,
    stock: 1,
    generatedAt: input.updatedAt,
  };
}

function pickFormalShopPoolItemV5(category: FormalShopCategoryV4, rng: () => number, used: Set<string>, restockContext: FormalShopRestockContextV4, pendingSettlement = false): string {
  const sourcePool = formalShopItemPoolForCategoryV4(category, pendingSettlement);
  const pool = sourcePool.filter(itemID => !used.has(itemID));
  const fallbackPool = pool.length ? pool : sourcePool;
  return pickWeightedFormalShopItemV5(category, fallbackPool, rng, restockContext) || sourcePool[0]!;
}

function pickWeightedFormalShopItemV5(category: FormalShopCategoryV4, itemIDs: string[], rng: () => number, restockContext: FormalShopRestockContextV4): string | undefined {
  const weighted = itemIDs.map(itemID => ({
    itemID,
    weight: formalShopRestockItemWeightV4(category, itemID, restockContext),
  })).filter(entry => entry.weight > 0);
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return pickOneV5(itemIDs, rng);
  let roll = rng() * totalWeight;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.itemID;
  }
  return weighted[weighted.length - 1]?.itemID;
}

function strengthenExchangedPokemonV5(pokemon: LocalPokemonV4, rng: () => number, calculateMaxHp?: FormalRestRulesMaxHpCalculatorV5): LocalPokemonV4 {
  const beforeIvs = normalizeStatsV5(pokemon.ivs, 31, 31);
  const beforeEvs = normalizeStatsV5(pokemon.evs, 0, 252);
  const beforeProfile = formalNormalizePowerProfileV4(pokemon.powerProfile || formalInferPowerProfileForTotalsV4(statTotalV5(beforeIvs), statTotalV5(beforeEvs)));
  const nextProfile = formalAdvancePowerProfileV4(beforeProfile, 1);
  const oldIvCap = normalizePokemonIvTotalCapV5(pokemon.ivTotalCap, beforeProfile, statTotalV5(beforeIvs));
  const oldEvCap = normalizePokemonEvTotalCapV5(pokemon.evTotalCap, beforeProfile, statTotalV5(beforeEvs));
  const rolledIvCap = formalRollPowerProfileIvCapV4(nextProfile, rng);
  const rolledEvCap = formalRollPowerProfileEvCapV4(nextProfile, rng);
  const nextIvCap = nextProfile === "champion" ? 186 : Math.max(oldIvCap, rolledIvCap, statTotalV5(beforeIvs));
  const nextEvCap = nextProfile === "champion" ? 510 : Math.max(oldEvCap, rolledEvCap, statTotalV5(beforeEvs));
  const nextIvs = raiseStatTableToTotalV5(beforeIvs, nextIvCap, 31, shuffledStatsV5(rng), rng);
  const nextEvs = raiseStatTableToTotalV5(beforeEvs, nextEvCap, 252, shuffledStatsV5(rng), rng);
  const maxHp = calculateMaxHpV5({...pokemon, ivs: nextIvs, evs: nextEvs, powerProfile: nextProfile, ivTotalCap: nextIvCap, evTotalCap: nextEvCap}, calculateMaxHp);
  return {
    ...pokemon,
    ivs: nextIvs,
    evs: nextEvs,
    powerProfile: nextProfile,
    ivTotalCap: nextIvCap,
    evTotalCap: nextEvCap,
    maxHp,
  };
}

function normalizePokemonIvTotalCapV5(value: unknown, profile: NonNullable<LocalPokemonV4["powerProfile"]>, fallbackTotal: number): number {
  const profileCap = formalRollPowerProfileIvCapV4(profile, () => 0.999999);
  return clampIntV5(value, 0, 186, Math.max(0, Math.min(186, Math.max(fallbackTotal, profileCap))));
}

function normalizePokemonEvTotalCapV5(value: unknown, profile: NonNullable<LocalPokemonV4["powerProfile"]>, fallbackTotal: number): number {
  const profileCap = formalRollPowerProfileEvCapV4(profile, () => 0.999999);
  return clampIntV5(value, 0, 510, Math.max(0, Math.min(510, Math.max(fallbackTotal, profileCap))));
}

function rerollStatsWithinTotalV5(current: StatTableV4, totalValue: number, statCap: number, lockedStats: DexStatId[], rng: () => number): StatTableV4 {
  const locked = new Set(lockedStats);
  const next = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as StatTableV4;
  const normalized = normalizeStatsV5(current, 0, statCap);
  const safeTotal = Math.max(0, Math.min(clampIntV5(totalValue, 0, statCap * STAT_IDS.length, statCap * STAT_IDS.length), statCap * STAT_IDS.length));
  let remaining = safeTotal;
  for (const stat of STAT_IDS) {
    if (!locked.has(stat)) continue;
    next[stat] = Math.max(0, Math.min(statCap, normalized[stat] || 0));
    remaining -= next[stat];
  }
  if (remaining <= 0) return next;
  const unlocked = STAT_IDS.filter(stat => !locked.has(stat));
  while (remaining > 0) {
    let progressed = false;
    for (const stat of formalShuffleV4(unlocked, rng)) {
      const open = statCap - next[stat];
      if (open <= 0) continue;
      const value = randomIntV5(1, Math.min(open, remaining), rng);
      next[stat] += value;
      remaining -= value;
      progressed = true;
      if (remaining <= 0) break;
    }
    if (!progressed) break;
  }
  return next;
}

function adjustStatTableToTotalV5(stats: StatTableV4, targetTotal: number, statCap: number, priority: DexStatId[], rng: () => number): StatTableV4 {
  const next = normalizeStatsV5(stats, 0, statCap);
  const safeTarget = clampIntV5(targetTotal, 0, statCap * STAT_IDS.length, statTotalV5(next));
  const currentTotal = statTotalV5(next);
  if (safeTarget >= currentTotal) return raiseStatTableToTotalV5(next, safeTarget, statCap, priority, rng);
  let remaining = currentTotal - safeTarget;
  const order = [...priority, ...STAT_IDS.filter(stat => !priority.includes(stat))];
  while (remaining > 0) {
    let progressed = false;
    for (const stat of order) {
      const open = next[stat];
      if (open <= 0) continue;
      const maxRemove = Math.min(open, remaining);
      const remove = maxRemove <= 8 ? maxRemove : randomIntV5(1, Math.min(maxRemove, 32), rng);
      next[stat] -= remove;
      remaining -= remove;
      progressed = true;
      if (remaining <= 0) break;
    }
    if (!progressed) break;
  }
  return next;
}

function raiseStatTableToTotalV5(stats: StatTableV4, targetTotal: number, statCap: number, priority: DexStatId[], rng: () => number): StatTableV4 {
  const next = normalizeStatsV5(stats, 0, statCap);
  let remaining = Math.max(0, Math.min(targetTotal, statCap * STAT_IDS.length) - statTotalV5(next));
  const order = [...priority, ...STAT_IDS.filter(stat => !priority.includes(stat))];
  while (remaining > 0) {
    let progressed = false;
    for (const stat of order) {
      const open = statCap - next[stat];
      if (open <= 0) continue;
      const maxAdd = Math.min(open, remaining);
      const add = maxAdd <= 8 ? maxAdd : randomIntV5(1, Math.min(maxAdd, 32), rng);
      next[stat] += add;
      remaining -= add;
      progressed = true;
      if (remaining <= 0) break;
    }
    if (!progressed) break;
  }
  return next;
}

function normalizeStatsV5(stats: Record<string, number> | undefined, fallback: number, max: number): StatTableV4 {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, clampIntV5(stats?.[stat], 0, max, fallback)])) as StatTableV4;
}

function normalizeStatLockListV5(stats: DexStatId[] | undefined): DexStatId[] {
  const valid = new Set(STAT_IDS);
  return Array.from(new Set((stats || []).filter((stat): stat is DexStatId => valid.has(stat))));
}

function statTotalV5(stats: StatTableV4): number {
  return STAT_IDS.reduce((sum, stat) => sum + Math.max(0, Math.floor(Number(stats[stat] || 0))), 0);
}

function shuffledStatsV5(rng: () => number): DexStatId[] {
  return [...STAT_IDS].sort(() => rng() - 0.5);
}

function countMoveCategoryV5(pokemon: LocalPokemonV4, category: "physical" | "special"): number {
  return (pokemon.moves || []).filter(move => {
    const normalizedCategory = formalToIdV4(move.category);
    return category === "physical"
      ? normalizedCategory === "physical" || move.category === "物理"
      : normalizedCategory === "special" || move.category === "特殊";
  }).length;
}

function calculateMaxHpV5(pokemon: LocalPokemonV4, calculateMaxHp?: FormalRestRulesMaxHpCalculatorV5): number {
  const calculated = calculateMaxHp?.(pokemon);
  return Math.max(1, Math.floor(Number(calculated || pokemon.maxHp || pokemon.entryHp || 1)));
}

function clampIntV5(value: unknown, min: number, max: number, fallback: number): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function randomIntV5(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickOneV5<T>(values: readonly T[], rng: () => number): T | undefined {
  if (!values.length) return undefined;
  return values[Math.floor(rng() * values.length)] || values[0];
}
