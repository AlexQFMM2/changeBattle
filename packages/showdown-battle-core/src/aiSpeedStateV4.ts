import {createShowdownDexService, toDexId, type ShowdownDexService} from "@changebattle-v2/showdown-dex-core";
import type {
  BattleServiceActivePokemonV4,
  BattleServiceSidePokemonV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
} from "./types.js";

export type BattleAiSpeedFieldStateV4 = {
  weather?: "rain" | "sun" | "sand" | "snow";
  trickRoom: boolean;
  tailwindByPlayer: Partial<Record<ShowdownPlayerIdV4, boolean>>;
};

export type BattleAiSpeedStateV4 = {
  speciesId: string;
  types: string[];
  stats: Record<string, number>;
  baseSpeed: number;
  rawSpeed: number;
  effectiveSpeed: number;
  estimatedStats: boolean;
  status?: string;
  ability?: string;
  item?: string;
  modifiers: string[];
};

export type BattleAiBuildSpeedStateInputV4 = {
  snapshot: BattleServiceSnapshotV4;
  playerId: ShowdownPlayerIdV4;
  active?: BattleServiceActivePokemonV4;
  row?: BattleServiceSidePokemonV4;
  dex?: ShowdownDexService;
};

const DEFAULT_DEX = createShowdownDexService();
const WEATHER_SPEED_ABILITIES: Record<string, BattleAiSpeedFieldStateV4["weather"]> = {
  swiftswim: "rain",
  chlorophyll: "sun",
  sandrush: "sand",
  slushrush: "snow",
};

export function buildBattleAiSpeedFieldStateV4(snapshot: BattleServiceSnapshotV4): BattleAiSpeedFieldStateV4 {
  const tailwindByPlayer: Partial<Record<ShowdownPlayerIdV4, boolean>> = {};
  let trickRoom = false;
  for (const line of snapshot.rawLog || []) {
    const normalized = line.toLowerCase();
    if (normalized.includes("|-fieldstart|") && normalizeId(normalized).includes("trickroom")) trickRoom = true;
    if (normalized.includes("|-fieldend|") && normalizeId(normalized).includes("trickroom")) trickRoom = false;
    for (const playerId of ["p1", "p2", "p3", "p4"] satisfies ShowdownPlayerIdV4[]) {
      if (normalized.includes("|-sidestart|") && normalized.includes(playerId) && normalizeId(normalized).includes("tailwind")) {
        tailwindByPlayer[playerId] = true;
      }
      if (normalized.includes("|-sideend|") && normalized.includes(playerId) && normalizeId(normalized).includes("tailwind")) {
        tailwindByPlayer[playerId] = false;
      }
    }
  }
  return {
    weather: currentWeather(snapshot),
    trickRoom,
    tailwindByPlayer,
  };
}

export function buildBattleAiSpeedStateV4(input: BattleAiBuildSpeedStateInputV4): BattleAiSpeedStateV4 {
  const dex = input.dex || DEFAULT_DEX;
  const speciesId = toDexId(speciesFromRowOrActive(input.row, input.active));
  const rowSpeed = finiteNumber(input.row?.stats?.spe);
  const species = speciesId ? safePokemonDetail(dex, speciesId) : null;
  const level = levelFromDetails(input.row?.details || input.active?.details || "");
  const baseSpeed = Number(species?.baseStats.spe || rowSpeed || 50);
  const rawSpeed = rowSpeed ?? estimateNonHpStat(baseSpeed, level);
  const stats = {
    ...Object.fromEntries(Object.entries(species?.baseStats || {}).map(([stat, value]) => [stat, stat === "hp" ? Number(value) : estimateNonHpStat(Number(value), level)])),
    ...(input.row?.stats || {}),
    spe: rawSpeed,
  };
  const field = buildBattleAiSpeedFieldStateV4(input.snapshot);
  const status = normalizeId(input.active?.status || statusFromCondition(input.row?.condition || ""));
  const ability = normalizeId(input.row?.ability || input.row?.baseAbility || "");
  const item = normalizeId(input.row?.item || "");
  const modifiers: string[] = [];
  let effectiveSpeed = rawSpeed;
  if (status === "par") {
    effectiveSpeed = Math.floor(effectiveSpeed / 2);
    modifiers.push("paralysis");
  }
  if (field.tailwindByPlayer[input.playerId]) {
    effectiveSpeed *= 2;
    modifiers.push("tailwind");
  }
  if (WEATHER_SPEED_ABILITIES[ability] && WEATHER_SPEED_ABILITIES[ability] === field.weather) {
    effectiveSpeed *= 2;
    modifiers.push(`${field.weather}-ability`);
  }
  if (item === "choicescarf") {
    effectiveSpeed = Math.floor(effectiveSpeed * 1.5);
    modifiers.push("choice-scarf");
  }
  if (field.trickRoom) modifiers.push("trick-room");
  return {
    speciesId,
    types: species?.types || [],
    stats,
    baseSpeed,
    rawSpeed,
    effectiveSpeed,
    estimatedStats: rowSpeed === undefined,
    status: status || undefined,
    ability: ability || undefined,
    item: item || undefined,
    modifiers,
  };
}

export function battleAiActsBeforeBySpeedV4(self: BattleAiSpeedStateV4 | undefined, foe: BattleAiSpeedStateV4 | undefined, field: BattleAiSpeedFieldStateV4): boolean | null {
  if (!self || !foe) return null;
  if (self.effectiveSpeed === foe.effectiveSpeed) return null;
  return field.trickRoom ? self.effectiveSpeed < foe.effectiveSpeed : self.effectiveSpeed > foe.effectiveSpeed;
}

function speciesFromRowOrActive(row: BattleServiceSidePokemonV4 | undefined, active: BattleServiceActivePokemonV4 | undefined): string {
  return String(row?.details?.split(",")[0] || active?.species || active?.details?.split(",")[0] || "");
}

function safePokemonDetail(dex: ShowdownDexService, speciesId: string) {
  try {
    return dex.getPokemonDetail(speciesId);
  } catch {
    return null;
  }
}

function estimateNonHpStat(base: number, level: number): number {
  return Math.max(1, Math.floor(((2 * base + 31 + Math.floor(85 / 4)) * level) / 100) + 5);
}

function levelFromDetails(details: string): number {
  const match = details.match(/L(\d+)/i);
  return match ? Math.max(1, Number(match[1]) || 50) : 50;
}

function statusFromCondition(condition: string): string {
  const parts = condition.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] || "" : "";
}

function currentWeather(snapshot: BattleServiceSnapshotV4): BattleAiSpeedFieldStateV4["weather"] {
  const line = snapshot.rawLog.slice().reverse().find(entry => entry.includes("|-weather|"))?.toLowerCase() || "";
  if (line.includes("raindance") || line.includes("rain")) return "rain";
  if (line.includes("sunnyday") || line.includes("harsh sunlight") || line.includes("sun")) return "sun";
  if (line.includes("sandstorm")) return "sand";
  if (line.includes("snow") || line.includes("hail")) return "snow";
  return undefined;
}

function finiteNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
