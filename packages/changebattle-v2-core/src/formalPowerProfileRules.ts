import type {PokemonPowerProfileV4} from "./formalGameCatalog.js";

export type FormalPokemonNumericProfileRuleV4 = {
  profile: PokemonPowerProfileV4;
  level: readonly [number, number];
  ivTotal: readonly [number, number];
  evTotal: readonly [number, number];
};

export const FORMAL_POWER_PROFILE_ORDER_V4: PokemonPowerProfileV4[] = ["rookie", "normal", "elite", "boss", "champion"];

const FORMAL_POWER_PROFILE_RULES_V4: Record<PokemonPowerProfileV4, FormalPokemonNumericProfileRuleV4> = {
  rookie: {profile: "rookie", level: [45, 50], ivTotal: [50, 90], evTotal: [100, 200]},
  normal: {profile: "normal", level: [49, 53], ivTotal: [80, 120], evTotal: [80, 280]},
  elite: {profile: "elite", level: [52, 55], ivTotal: [110, 150], evTotal: [260, 400]},
  boss: {profile: "boss", level: [56, 60], ivTotal: [140, 180], evTotal: [390, 510]},
  champion: {profile: "champion", level: [61, 65], ivTotal: [186, 186], evTotal: [510, 510]},
};

export function formalPowerProfileRuleV4(profile: PokemonPowerProfileV4): FormalPokemonNumericProfileRuleV4 {
  return FORMAL_POWER_PROFILE_RULES_V4[formalNormalizePowerProfileV4(profile)];
}

export function formalNormalizePowerProfileV4(value: unknown): PokemonPowerProfileV4 {
  return value === "rookie" || value === "normal" || value === "elite" || value === "boss" || value === "champion" ? value : "normal";
}

export function formalPowerProfileIndexV4(profile: PokemonPowerProfileV4): number {
  return Math.max(0, FORMAL_POWER_PROFILE_ORDER_V4.indexOf(formalNormalizePowerProfileV4(profile)));
}

export function formalAdvancePowerProfileV4(profile: PokemonPowerProfileV4, steps: number): PokemonPowerProfileV4 {
  const index = formalPowerProfileIndexV4(profile) + Math.max(0, Math.floor(Number(steps || 0)));
  return FORMAL_POWER_PROFILE_ORDER_V4[Math.min(FORMAL_POWER_PROFILE_ORDER_V4.length - 1, index)] || "rookie";
}

export function formalInferPowerProfileForTotalsV4(ivTotal: number, evTotal: number, maxProfile: PokemonPowerProfileV4 = "champion"): PokemonPowerProfileV4 {
  const maxIndex = formalPowerProfileIndexV4(maxProfile);
  for (const profile of FORMAL_POWER_PROFILE_ORDER_V4.slice(0, maxIndex + 1)) {
    const rule = formalPowerProfileRuleV4(profile);
    if (ivTotal <= rule.ivTotal[1] && evTotal <= rule.evTotal[1]) return profile;
  }
  return FORMAL_POWER_PROFILE_ORDER_V4[maxIndex] || "elite";
}

export function formalStarterIvStatCapForPowerProfileV4(profile: PokemonPowerProfileV4): number {
  if (profile === "normal") return 26;
  if (profile === "elite") return 28;
  return 31;
}

export function formalRollPowerProfileIvCapV4(profile: PokemonPowerProfileV4, rng: () => number): number {
  const rule = formalPowerProfileRuleV4(profile);
  return formalRandomIntV4(rule.ivTotal[0], rule.ivTotal[1], rng);
}

export function formalRollPowerProfileEvCapV4(profile: PokemonPowerProfileV4, rng: () => number): number {
  const rule = formalPowerProfileRuleV4(profile);
  return formalRandomIntV4(rule.evTotal[0], rule.evTotal[1], rng);
}

export function formalClampIntV4(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

export function formalRandomIntV4(min: number, max: number, rng: () => number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return low + Math.floor(rng() * Math.max(1, high - low + 1));
}

export function formalCreateRngV4(seed: string): () => number {
  let state = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 0x01000193) >>> 0;
  }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function formalShuffleV4<T>(values: readonly T[], rng: () => number): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
  }
  return next;
}
