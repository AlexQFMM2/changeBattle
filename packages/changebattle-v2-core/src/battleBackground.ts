import type {FormalNpcTypeV4} from "./formalGameCatalog.js";

export type BattleBackgroundIdV4 =
  | "grassland"
  | "forest"
  | "lakeside"
  | "tropical-beach"
  | "ocean-rafts"
  | "ceremonial-stage"
  | "snowfield"
  | "neon-downtown"
  | "champion-stage"
  | "mountain-route";

export type BattleBackgroundViewV4 = {
  id: BattleBackgroundIdV4;
  name: string;
  path: string;
};

export type BattleBackgroundSelectionInputV4 = {
  seed?: string | number;
  battleIndex?: number;
  trainerId?: string;
  trainerType?: FormalNpcTypeV4 | string;
  teamPoolId?: string;
  bossRoute?: string;
};

export const BATTLE_BACKGROUNDS_V4: readonly BattleBackgroundViewV4[] = [
  {id: "grassland", name: "草原", path: "battle-backgrounds/grassland.png"},
  {id: "forest", name: "森林", path: "battle-backgrounds/forest.png"},
  {id: "lakeside", name: "湖泊", path: "battle-backgrounds/lakeside.png"},
  {id: "tropical-beach", name: "沙滩", path: "battle-backgrounds/tropical-beach.png"},
  {id: "ocean-rafts", name: "海洋木筏", path: "battle-backgrounds/ocean-rafts.png"},
  {id: "ceremonial-stage", name: "仪式舞台", path: "battle-backgrounds/ceremonial-stage.png"},
  {id: "snowfield", name: "雪原", path: "battle-backgrounds/snowfield.png"},
  {id: "neon-downtown", name: "闹市夜景", path: "battle-backgrounds/neon-downtown.png"},
  {id: "champion-stage", name: "冠军舞台", path: "battle-backgrounds/champion-stage.png"},
  {id: "mountain-route", name: "山地", path: "battle-backgrounds/mountain-route.png"},
] as const;

export const CHAMPION_BATTLE_BACKGROUND_V4 = BATTLE_BACKGROUNDS_V4.find(entry => entry.id === "champion-stage")!;
export const FALLBACK_BATTLE_BACKGROUND_V4 = BATTLE_BACKGROUNDS_V4.find(entry => entry.id === "mountain-route")!;

/**
 * Restores the original desktop background rule: champions always use the
 * champion stage, while every other trainer gets a stable seeded choice from
 * the remaining catalog.
 */
export function selectBattleBackgroundV4(input: BattleBackgroundSelectionInputV4): BattleBackgroundViewV4 {
  if (input.trainerType === "champion") return CHAMPION_BATTLE_BACKGROUND_V4;
  const candidates = BATTLE_BACKGROUNDS_V4.filter(entry => entry.id !== CHAMPION_BATTLE_BACKGROUND_V4.id);
  if (!candidates.length) return FALLBACK_BATTLE_BACKGROUND_V4;
  const index = stableBattleBackgroundHashV4(
    input.seed ?? 0,
    input.battleIndex ?? 0,
    input.trainerId || "",
    input.teamPoolId || "",
    input.bossRoute || "",
  ) % candidates.length;
  return candidates[index] || FALLBACK_BATTLE_BACKGROUND_V4;
}

function stableBattleBackgroundHashV4(...values: Array<string | number>): number {
  let hash = 2166136261;
  for (const character of values.join(":")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
