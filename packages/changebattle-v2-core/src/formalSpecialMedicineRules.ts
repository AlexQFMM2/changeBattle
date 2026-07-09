import {getPokemonDisplayNameV4, TRAINING_STAT_IDS_V4, type LocalPokemonV4, type StatTableV4, type TrainingStatIdV4, type TrainingStatusV4} from "./pokemonInstance.js";

export type FormalSpecialMedicineAbilityV4 = {id: string; name?: string; nameZh?: string; hidden?: boolean};

export type FormalSpecialMedicineApplyResultV4 =
  | {ok: true; pokemon: LocalPokemonV4; message: string}
  | {ok: false; reason: string};

export function isProtectedSoulmateItemUseTargetV4(pokemon: Pick<LocalPokemonV4, "formalSourceKind" | "originKind"> | null | undefined): boolean {
  return pokemon?.formalSourceKind === "soulmate-vault" || pokemon?.originKind === "soulmate";
}

export function applyFormalSpecialMedicineToPokemonV4(input: {
  pokemon: LocalPokemonV4;
  medicineId: string;
  pokemonAbilities?: FormalSpecialMedicineAbilityV4[];
  allAbilities?: FormalSpecialMedicineAbilityV4[];
  calculateMaxHp?: (pokemon: LocalPokemonV4) => number;
  rngSeed?: string;
}): FormalSpecialMedicineApplyResultV4 {
  const rng = createStableRng(input.rngSeed || `${input.pokemon.localPokemonId}:${input.pokemon.speciesId}:${input.medicineId}`);
  const medicineId = normalizeId(input.medicineId);
  const name = getPokemonDisplayNameV4(input.pokemon);
  switch (medicineId) {
    case "sulfurglasswater": {
      let pokemon = transferIvEvPairs(input.pokemon, [
        ["hp", "spe"],
        ["def", "atk"],
        ["spd", "spa"],
      ]);
      pokemon = recalculateMaxHp(pokemon, input.calculateMaxHp);
      pokemon = {...pokemon, entryHp: pokemon.maxHp <= 0 ? 0 : 1};
      return {ok: true, pokemon, message: `${name} 喝下硫磺玻璃水，身体被压榨成了速攻形态。`};
    }
    case "steeltonic": {
      let pokemon = transferIvEvPairs(input.pokemon, [
        ["spe", "hp"],
        ["atk", "def"],
        ["spa", "spd"],
      ]);
      pokemon = recalculateMaxHp(pokemon, input.calculateMaxHp);
      pokemon = {...pokemon, entryHp: pokemon.maxHp};
      pokemon = drainRandomMovePp(pokemon, 1, rng);
      return {ok: true, pokemon, message: `${name} 使用钢铁药剂，身体沉重下来，1 个技能的 PP 归 0。`};
    }
    case "boletefluid": {
      let pokemon = drainRandomMovePp(input.pokemon, 3, rng);
      pokemon = {
        ...pokemon,
        ivs: fullIvTable(31),
        evs: evSpreadForBattleStyle(pokemon, rng),
        entryStatus: "psn",
      };
      pokemon = recalculateMaxHp(pokemon, input.calculateMaxHp);
      pokemon = rescaleEntryHp(input.pokemon, pokemon);
      return {ok: true, pokemon, message: `${name} 喝下见手青液，个体和努力被粗暴重铸，3 个技能的 PP 归 0，并陷入中毒。`};
    }
    case "mutationcapsule": {
      const abilities = input.pokemonAbilities || [];
      if (!abilities.length) return {ok: false, reason: "目标没有可随机异化的特性池。"};
      const ability = pickDifferentAbility(abilities, input.pokemon.abilityId, rng);
      if (!ability) return {ok: false, reason: "目标没有可随机异化的特性。"};
      let pokemon = applyAbility(input.pokemon, ability);
      if (ability.hidden) {
        const stat = pickOne(TRAINING_STAT_IDS_V4, rng) || "hp";
        pokemon = {...pokemon, ivs: {...pokemon.ivs, [stat]: clampInt(pokemon.ivs[stat] - 15, 0, 31)}};
      } else {
        pokemon = addEvToRandomStat(pokemon, 30, rng);
      }
      pokemon = recalculateMaxHp(pokemon, input.calculateMaxHp);
      pokemon = rescaleEntryHp(input.pokemon, pokemon);
      return {ok: true, pokemon, message: `${name} 的特性异化为 ${ability.nameZh || ability.name || ability.id}。`};
    }
    case "redheatneedle": {
      const pokemon = {
        ...input.pokemon,
        nature: "Adamant",
        ivs: {...input.pokemon.ivs, atk: 31, spa: 0},
        evs: normalizeEvTotal({...input.pokemon.evs, atk: 252, spa: 0}, ["atk"]),
        entryStatus: "brn" as TrainingStatusV4,
      };
      return {ok: true, pokemon, message: `${name} 被红温针改造成物攻形态，并陷入灼伤。`};
    }
    case "coolingneedle": {
      const pokemon = {
        ...input.pokemon,
        nature: "Modest",
        ivs: {...input.pokemon.ivs, spa: 31, atk: 0},
        evs: normalizeEvTotal({...input.pokemon.evs, spa: 252, atk: 0}, ["spa"]),
        entryStatus: "frz" as TrainingStatusV4,
      };
      return {ok: true, pokemon, message: `${name} 被退烧针改造成特攻形态，并陷入冰冻。`};
    }
    case "emetic": {
      const total = statTotal(input.pokemon.evs);
      if (total < 30) return {ok: false, reason: "努力值不足，催吐剂无法发动。"};
      const pokemon = {
        ...input.pokemon,
        evs: reduceTotalEv(input.pokemon.evs, 30),
        entryHp: input.pokemon.maxHp,
        entryStatus: "" as TrainingStatusV4,
      };
      return {ok: true, pokemon, message: `${name} 使用催吐剂，扣除了 30 点努力值并恢复满状态。`};
    }
    case "strangeherb": {
      if (!input.allAbilities?.length) return {ok: false, reason: "缺少全特性池，陌生草药无法使用。"};
      const ability = pickDifferentAbility(input.allAbilities, input.pokemon.abilityId, rng);
      if (!ability) return {ok: false, reason: "没有可随机获得的特性。"};
      const pokemon = applyAbility(input.pokemon, ability);
      return {ok: true, pokemon, message: `${name} 吃下陌生草药，特性变为 ${ability.nameZh || ability.name || ability.id}。`};
    }
    case "pulseplasma": {
      let pokemon = {
        ...input.pokemon,
        nature: speedNatureForPokemon(input.pokemon, rng),
        ivs: {...input.pokemon.ivs, hp: 0, def: 0, spd: 0, spe: 31},
        evs: normalizeEvTotal({...input.pokemon.evs, hp: 0, def: 0, spd: 0, spe: 252}, ["spe"]),
        entryStatus: "par" as TrainingStatusV4,
      };
      pokemon = recalculateMaxHp(pokemon, input.calculateMaxHp);
      pokemon = {...pokemon, entryHp: Math.max(1, Math.floor(Math.max(1, pokemon.maxHp) / 2))};
      return {ok: true, pokemon, message: `${name} 被脉冲电浆改造成高速形态，并陷入麻痹。`};
    }
    case "fakefatty": {
      if (input.pokemon.level >= 100) return {ok: false, reason: "目标等级已满，假胖子没有效果。"};
      let pokemon = {
        ...input.pokemon,
        level: Math.min(100, input.pokemon.level + 10),
        ivs: fullIvTable(0),
        evs: fullEvTable(0),
      };
      pokemon = recalculateMaxHp(pokemon, input.calculateMaxHp);
      pokemon = rescaleEntryHp(input.pokemon, pokemon);
      return {ok: true, pokemon, message: `${name} 看起来膨胀了许多，但个体和努力全部清零。`};
    }
    default:
      return {ok: false, reason: "未知的特效药。"};
  }
}

function transferIvEvPairs(pokemon: LocalPokemonV4, pairs: Array<[TrainingStatIdV4, TrainingStatIdV4]>): LocalPokemonV4 {
  const ivs = {...pokemon.ivs};
  const evs = {...pokemon.evs};
  for (const [from, to] of pairs) {
    ivs[to] = clampInt(ivs[to] + ivs[from], 0, 31);
    evs[to] = clampInt(evs[to] + evs[from], 0, 252);
    ivs[from] = 0;
    evs[from] = 0;
  }
  return {...pokemon, ivs, evs: normalizeEvTotal(evs)};
}

function fullIvTable(value: number): StatTableV4 {
  return Object.fromEntries(TRAINING_STAT_IDS_V4.map(stat => [stat, clampInt(value, 0, 31)])) as StatTableV4;
}

function fullEvTable(value: number): StatTableV4 {
  return Object.fromEntries(TRAINING_STAT_IDS_V4.map(stat => [stat, clampInt(value, 0, 252)])) as StatTableV4;
}

function recalculateMaxHp(pokemon: LocalPokemonV4, calculateMaxHp?: (pokemon: LocalPokemonV4) => number): LocalPokemonV4 {
  if (!calculateMaxHp) return pokemon;
  const maxHp = Math.max(1, Math.floor(Number(calculateMaxHp(pokemon) || pokemon.maxHp || 1)));
  return {...pokemon, maxHp, entryHp: clampInt(pokemon.entryHp, 0, maxHp)};
}

function rescaleEntryHp(before: LocalPokemonV4, after: LocalPokemonV4): LocalPokemonV4 {
  if (before.entryHp <= 0) return {...after, entryHp: 0};
  const oldMaxHp = Math.max(1, before.maxHp);
  const nextHp = Math.round(after.maxHp * before.entryHp / oldMaxHp);
  return {...after, entryHp: clampInt(nextHp, 1, after.maxHp)};
}

function drainRandomMovePp(pokemon: LocalPokemonV4, count: number, rng: () => number): LocalPokemonV4 {
  const moves = pokemon.moves.filter(move => Boolean(move.moveId));
  const drainCount = Math.min(Math.max(0, count), moves.length);
  if (drainCount <= 0) return pokemon;
  const indexes = shuffleIndices(moves.length, rng).slice(0, drainCount);
  const drained = new Set(indexes);
  return {...pokemon, moves: moves.map((move, index) => drained.has(index) ? {...move, remainingPp: 0} : move)};
}

function shuffleIndices(length: number, rng: () => number): number[] {
  const values = Array.from({length}, (_, index) => index);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [values[index], values[swap]] = [values[swap]!, values[index]!];
  }
  return values;
}

function evSpreadForBattleStyle(pokemon: LocalPokemonV4, rng: () => number): StatTableV4 {
  const physical = moveCategoryCount(pokemon, "physical");
  const special = moveCategoryCount(pokemon, "special");
  if (physical > special) return evSpread(["atk", "spe", "hp"]);
  if (special > physical) return evSpread(["spa", "spe", "hp"]);
  return evSpread(shuffleStats(rng));
}

function evSpread(order: TrainingStatIdV4[]): StatTableV4 {
  const evs = fullEvTable(0);
  let remaining = 510;
  for (const stat of order) {
    if (remaining <= 0) break;
    const value = Math.min(252, remaining);
    evs[stat] = value;
    remaining -= value;
  }
  return evs;
}

function shuffleStats(rng: () => number): TrainingStatIdV4[] {
  const stats = [...TRAINING_STAT_IDS_V4];
  for (let index = stats.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [stats[index], stats[swap]] = [stats[swap]!, stats[index]!];
  }
  return stats;
}

function normalizeEvTotal(evs: StatTableV4, protectedStats: TrainingStatIdV4[] = []): StatTableV4 {
  const next = Object.fromEntries(TRAINING_STAT_IDS_V4.map(stat => [stat, clampInt(evs[stat], 0, 252)])) as StatTableV4;
  let overflow = statTotal(next) - 510;
  const protectedSet = new Set(protectedStats);
  for (const stat of TRAINING_STAT_IDS_V4.filter(stat => !protectedSet.has(stat)).sort((a, b) => next[b] - next[a])) {
    if (overflow <= 0) break;
    const delta = Math.min(next[stat], overflow);
    next[stat] -= delta;
    overflow -= delta;
  }
  for (const stat of TRAINING_STAT_IDS_V4.filter(stat => protectedSet.has(stat)).sort((a, b) => next[b] - next[a])) {
    if (overflow <= 0) break;
    const delta = Math.min(next[stat], overflow);
    next[stat] -= delta;
    overflow -= delta;
  }
  return next;
}

function reduceTotalEv(evs: StatTableV4, amount: number): StatTableV4 {
  const next = {...evs};
  let remaining = Math.max(0, Math.floor(amount));
  for (const stat of [...TRAINING_STAT_IDS_V4].sort((a, b) => next[b] - next[a] || TRAINING_STAT_IDS_V4.indexOf(a) - TRAINING_STAT_IDS_V4.indexOf(b))) {
    if (remaining <= 0) break;
    const delta = Math.min(next[stat], remaining);
    next[stat] -= delta;
    remaining -= delta;
  }
  return next;
}

function addEvToRandomStat(pokemon: LocalPokemonV4, amount: number, rng: () => number): LocalPokemonV4 {
  const candidates = TRAINING_STAT_IDS_V4.filter(stat => pokemon.evs[stat] < 252);
  const stat = pickOne(candidates, rng);
  if (!stat) return pokemon;
  const evs = {...pokemon.evs, [stat]: pokemon.evs[stat] + Math.max(0, Math.floor(amount))};
  return {...pokemon, evs: normalizeEvTotal(evs, [stat])};
}

function pickDifferentAbility<T extends FormalSpecialMedicineAbilityV4>(abilities: T[], currentId: string, rng: () => number): T | null {
  const normalizedCurrent = normalizeId(currentId);
  const pool = abilities.filter(ability => ability.id && normalizeId(ability.id) !== normalizedCurrent);
  return pickOne(pool.length ? pool : abilities, rng) || null;
}

function applyAbility(pokemon: LocalPokemonV4, ability: FormalSpecialMedicineAbilityV4): LocalPokemonV4 {
  return {
    ...pokemon,
    abilityId: ability.id,
    abilityName: ability.name || ability.id,
    abilityNameZh: ability.nameZh || ability.name || ability.id,
  };
}

function speedNatureForPokemon(pokemon: LocalPokemonV4, rng: () => number): string {
  const physical = moveCategoryCount(pokemon, "physical");
  const special = moveCategoryCount(pokemon, "special");
  if (physical > special) return "Jolly";
  if (special > physical) return "Timid";
  return pickOne(["Naive", "Hasty"], rng) || "Naive";
}

function moveCategoryCount(pokemon: LocalPokemonV4, category: "physical" | "special"): number {
  return pokemon.moves.filter(move => {
    const normalized = normalizeId(move.category);
    return category === "physical"
      ? normalized === "physical" || move.category === "物理"
      : normalized === "special" || move.category === "特殊";
  }).length;
}

function statTotal(stats: StatTableV4): number {
  return TRAINING_STAT_IDS_V4.reduce((sum, stat) => sum + clampInt(stats[stat], 0, 252), 0);
}

function pickOne<T>(values: readonly T[], rng: () => number): T | undefined {
  if (!values.length) return undefined;
  return values[Math.floor(rng() * values.length)] || values[0];
}

function createStableRng(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6D2B79F5;
    let next = state;
    next = Math.imul(next ^ next >>> 15, next | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

function normalizeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}
