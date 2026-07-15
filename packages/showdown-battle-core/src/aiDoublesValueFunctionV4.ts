import type {BattleServiceRequestV4} from "./types.js";
import type {ShowdownParsedChoiceV4} from "./showdownCommand.js";
import {
  battleAiAllyComboNetValueV4,
  detectBattleAiAllyCombosV4,
  type BattleAiAllyComboV4,
} from "./aiAllyComboDetectorV4.js";

export type BattleAiDoublesReasonTagV4 =
  | "double-target-foe"
  | "foe-target"
  | "ally-target"
  | "self-target"
  | "spread-foes"
  | "spread-friendly-fire-risk"
  | "avoid-ally-damage"
  | "ally-support"
  | "ally-combo"
  | "ko-current-threat"
  | "spread-pressure"
  | "protect-from-double-target"
  | "fake-out-stop-setup"
  | "fake-out-low-value"
  | "tailwind-speed-control"
  | "trick-room-value"
  | "trick-room-self-harm"
  | "weather-control"
  | "terrain-control"
  | "priority-pressure"
  | "commit-dynamax"
  | "hold-dynamax"
  | "commit-tera"
  | "hold-tera";

export type BattleAiDoublesJointPartV4 = {
  slotIndex: number;
  choice: string;
  parsed: ShowdownParsedChoiceV4 | null;
  diagnostics?: Record<string, unknown>;
};

export type BattleAiDoublesValueBreakdownV4 = {
  targeting: number;
  spread: number;
  friendlyFire: number;
  combo: number;
  protect: number;
  disruption: number;
  speedControl: number;
  field: number;
  priority: number;
  resource: number;
  risk: number;
};

export type BattleAiDoublesValueInputV4 = {
  request: BattleServiceRequestV4;
  choice: string;
  parts: BattleAiDoublesJointPartV4[];
};

export type BattleAiDoublesValueResultV4 = {
  adjustment: number;
  tags: BattleAiDoublesReasonTagV4[];
  combos: BattleAiAllyComboV4[];
  breakdown: BattleAiDoublesValueBreakdownV4;
};

const PROTECT_MOVES = new Set(["protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "silktrap", "burningbulwark"]);
const FAKE_OUT_MOVES = new Set(["fakeout"]);
const PRIORITY_MOVES = new Set(["suckerpunch", "aquajet", "extremespeed", "machpunch", "bulletpunch", "iceshard", "shadowsneak", "vacuumwave"]);
const TAILWIND_MOVES = new Set(["tailwind"]);
const TRICK_ROOM_MOVES = new Set(["trickroom"]);
const WEATHER_MOVES = new Set(["raindance", "sunnyday", "sandstorm", "snowscape", "hail"]);
const TERRAIN_MOVES = new Set(["electricterrain", "grassyterrain", "psychicterrain", "mistyterrain"]);
const SETUP_FIELD_MOVES = new Set(["trickroom", "tailwind"]);

export function evaluateBattleAiDoublesJointValueV4(input: BattleAiDoublesValueInputV4): BattleAiDoublesValueResultV4 {
  const tags = new Set<BattleAiDoublesReasonTagV4>();
  const combos: BattleAiAllyComboV4[] = [];
  const breakdown: BattleAiDoublesValueBreakdownV4 = {
    targeting: 0,
    spread: 0,
    friendlyFire: 0,
    combo: 0,
    protect: 0,
    disruption: 0,
    speedControl: 0,
    field: 0,
    priority: 0,
    resource: 0,
    risk: 0,
  };
  const positiveTargets = new Map<string, {count: number; pressure: number; ko: number}>();
  const foeSetupPressure = foeSetupThreatPressure(input.parts);
  const ownOffensePressure = input.parts.reduce((sum, part) => sum + damagingPressure(part), 0);
  const foeTargetPressure = new Map<string, number>();

  for (const part of input.parts) {
    if (!part.parsed || part.parsed.kind !== "move") continue;
    const diagnostics = part.diagnostics || {};
    const moveId = normalizeId(diagnostics.moveId || part.choice);
    const moveTarget = normalizeMoveTarget(diagnostics.target || moveRequestForPart(input.request, part)?.target || "");
    const category = String(diagnostics.category || "").toLowerCase();
    const expectedDamageRatio = finiteNumber(diagnostics.expectedDamageRatio, 0);
    const koChance = finiteNumber(diagnostics.koChance, 0);
    const damaging = category !== "status" && expectedDamageRatio > 0;
    const pressure = damagingPressure(part);

    if (part.parsed.target?.startsWith("+")) {
      tags.add("foe-target");
      const current = positiveTargets.get(part.parsed.target) || {count: 0, pressure: 0, ko: 0};
      positiveTargets.set(part.parsed.target, {
        count: current.count + 1,
        pressure: current.pressure + pressure,
        ko: Math.max(current.ko, koChance),
      });
      foeTargetPressure.set(part.parsed.target, (foeTargetPressure.get(part.parsed.target) || 0) + pressure);
      if (koChance >= 1 || expectedDamageRatio >= 0.8) {
        tags.add("ko-current-threat");
        breakdown.targeting += 18;
      } else if (expectedDamageRatio >= 0.5) {
        breakdown.targeting += 8;
      }
    }

    if (part.parsed.target?.startsWith("-")) {
      tags.add("ally-target");
      const targetSlotIndex = Math.abs(Number(part.parsed.target)) - 1;
      const detectedCombos = detectBattleAiAllyCombosV4({
        request: input.request,
        userSlotIndex: part.slotIndex,
        targetSlotIndex,
        diagnostics,
      });
      if (damaging) {
        if (detectedCombos.length) {
          tags.add("ally-combo");
          combos.push(...detectedCombos);
          breakdown.combo += battleAiAllyComboNetValueV4(detectedCombos);
        } else {
          tags.add("avoid-ally-damage");
          breakdown.friendlyFire -= 95;
        }
      } else if (detectedCombos.length) {
        tags.add("ally-combo");
        combos.push(...detectedCombos);
        breakdown.combo += battleAiAllyComboNetValueV4(detectedCombos);
      } else {
        tags.add("ally-support");
        breakdown.targeting += 10;
      }
    }

    if (moveTarget === "self") {
      tags.add("self-target");
      breakdown.targeting += 3;
    }
    if (moveTarget === "alladjacentfoes") {
      tags.add("spread-foes");
      tags.add("spread-pressure");
      breakdown.spread += 14 + Math.min(18, expectedDamageRatio * 24);
    }
    if (moveTarget === "alladjacent") {
      const spreadCombos = allySlotIndexes(input.request, part.slotIndex)
        .flatMap(targetSlotIndex => detectBattleAiAllyCombosV4({request: input.request, userSlotIndex: part.slotIndex, targetSlotIndex, diagnostics}));
      if (spreadCombos.length) {
        tags.add("ally-combo");
        combos.push(...spreadCombos);
        breakdown.combo += battleAiAllyComboNetValueV4(spreadCombos);
      } else {
        tags.add("spread-friendly-fire-risk");
        breakdown.friendlyFire -= 42;
      }
    }

    if (PROTECT_MOVES.has(moveId)) {
      const slotPressure = Math.max(
        expectedIncomingPressureForSlot(input.parts, part.slotIndex),
        finiteNumber(diagnostics.incomingPressureRatio, 0),
      );
      if (slotPressure >= 0.55 || doubleTargetedByFoe(input.parts, part.slotIndex) || Boolean(diagnostics.incomingDoubleTarget)) {
        tags.add("protect-from-double-target");
        breakdown.protect += 30;
      } else if (ownOffensePressure >= 1.2) {
        breakdown.protect -= 14;
      } else {
        breakdown.protect += 4;
      }
    }

    if (FAKE_OUT_MOVES.has(moveId)) {
      if (foeSetupPressure > 0 || pressure >= 0.25 || diagnosticIndicatesSetupTarget(diagnostics)) {
        tags.add("fake-out-stop-setup");
        breakdown.disruption += 28 + Math.min(14, foeSetupPressure);
      } else {
        tags.add("fake-out-low-value");
        breakdown.disruption -= 12;
      }
    }

    if (TAILWIND_MOVES.has(moveId)) {
      tags.add("tailwind-speed-control");
      breakdown.speedControl += teamSpeedLooksBehind(input.request) ? 30 : 14;
    }
    if (TRICK_ROOM_MOVES.has(moveId)) {
      if (teamSpeedLooksBehind(input.request)) {
        tags.add("trick-room-value");
        breakdown.speedControl += 28;
      } else {
        tags.add("trick-room-self-harm");
        breakdown.speedControl -= 26;
      }
    }
    if (WEATHER_MOVES.has(moveId)) {
      tags.add("weather-control");
      breakdown.field += fieldMoveHasTeamAbuser(input.request, moveId) ? 24 : 8;
    }
    if (TERRAIN_MOVES.has(moveId)) {
      tags.add("terrain-control");
      breakdown.field += 10;
    }
    if (PRIORITY_MOVES.has(moveId)) {
      tags.add("priority-pressure");
      breakdown.priority += koChance >= 1 || expectedDamageRatio >= 0.45 ? 18 : 5;
    }

    const specialTags = specialSystemTags(diagnostics);
    if (specialTags.includes("dynamax")) {
      if (specialTags.some(tag => ["max-speed", "max-weather", "max-defense-boost", "max-special-defense-boost", "max-attack-boost", "max-special-attack-boost"].includes(tag)) || koChance >= 1 || expectedDamageRatio >= 0.7) {
        tags.add("commit-dynamax");
        breakdown.resource += 24;
      } else {
        tags.add("hold-dynamax");
        breakdown.resource -= 16;
      }
    }
    if (specialTags.includes("terastallize")) {
      if (specialTags.some(tag => ["tera-defensive", "tera-wincon"].includes(tag)) || koChance >= 1 || expectedDamageRatio >= 0.7) {
        tags.add("commit-tera");
        breakdown.resource += 18;
      } else {
        tags.add("hold-tera");
        breakdown.resource -= 14;
      }
    }

    if (!damaging && !PROTECT_MOVES.has(moveId) && !FAKE_OUT_MOVES.has(moveId) && !TAILWIND_MOVES.has(moveId) && !TRICK_ROOM_MOVES.has(moveId) && !WEATHER_MOVES.has(moveId) && !TERRAIN_MOVES.has(moveId) && !SETUP_FIELD_MOVES.has(moveId)) {
      breakdown.risk -= 4;
    }
  }

  for (const target of positiveTargets.values()) {
    if (target.count >= 2) {
      tags.add("double-target-foe");
      breakdown.targeting += target.ko >= 1 || target.pressure >= 1 ? 34 : 18;
    }
  }

  return {
    adjustment: bounded(Object.values(breakdown).reduce((sum, value) => sum + value, 0), -140, 140),
    tags: [...tags],
    combos,
    breakdown: roundBreakdown(breakdown),
  };
}

function moveRequestForPart(request: BattleServiceRequestV4, part: BattleAiDoublesJointPartV4) {
  if (!part.parsed || part.parsed.kind !== "move") return undefined;
  return request.active?.[part.slotIndex]?.moves?.[part.parsed.index - 1];
}

function allySlotIndexes(request: BattleServiceRequestV4, userSlotIndex: number): number[] {
  return (request.active || [])
    .map((active, index) => ({active, index}))
    .filter(entry => entry.index !== userSlotIndex && Boolean(entry.active))
    .map(entry => entry.index);
}

function damagingPressure(part: BattleAiDoublesJointPartV4): number {
  const diagnostics = part.diagnostics || {};
  const category = String(diagnostics.category || "").toLowerCase();
  if (category === "status") return 0;
  return Math.max(0, finiteNumber(diagnostics.expectedDamageRatio, 0)) + Math.max(0, finiteNumber(diagnostics.koChance, 0)) * 0.35;
}

function foeSetupThreatPressure(parts: BattleAiDoublesJointPartV4[]): number {
  return parts.reduce((sum, part) => {
    const moveId = normalizeId(part.diagnostics?.moveId || part.choice);
    const target = part.parsed?.kind === "move" ? String(part.parsed.target || "") : "";
    if (!target.startsWith("+")) return sum;
    if (TAILWIND_MOVES.has(moveId) || TRICK_ROOM_MOVES.has(moveId)) return sum + 24;
    if (["swordsdance", "nastyplot", "dragondance", "calmmind", "quiverdance", "bulkup"].includes(moveId)) return sum + 14;
    return sum;
  }, 0);
}

function expectedIncomingPressureForSlot(parts: BattleAiDoublesJointPartV4[], ownSlotIndex: number): number {
  const targetLoc = `-${ownSlotIndex + 1}`;
  return parts.reduce((sum, part) => {
    if (part.parsed?.kind === "move" && part.parsed.target === targetLoc) return sum + damagingPressure(part);
    return sum;
  }, 0);
}

function doubleTargetedByFoe(parts: BattleAiDoublesJointPartV4[], ownSlotIndex: number): boolean {
  const targetLoc = `-${ownSlotIndex + 1}`;
  return parts.filter(part => part.parsed?.kind === "move" && part.parsed.target === targetLoc && damagingPressure(part) > 0).length >= 2;
}

function teamSpeedLooksBehind(request: BattleServiceRequestV4): boolean {
  const activeRows = request.side?.pokemon?.filter(row => row.active) || [];
  const speeds = activeRows.map(row => Number(row.stats?.spe || 0)).filter(speed => speed > 0);
  if (!speeds.length) return false;
  return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length < 95;
}

function fieldMoveHasTeamAbuser(request: BattleServiceRequestV4, moveId: string): boolean {
  const weather = weatherFromMove(moveId);
  if (!weather) return false;
  const abilityIds = new Set((request.side?.pokemon || []).map(row => normalizeId(row.ability || row.baseAbility || "")));
  if (weather === "rain") return abilityIds.has("swiftswim") || abilityIds.has("raindish") || abilityIds.has("hydration");
  if (weather === "sun") return abilityIds.has("chlorophyll") || abilityIds.has("solarpower") || abilityIds.has("protosynthesis");
  if (weather === "sand") return abilityIds.has("sandrush") || abilityIds.has("sandforce") || abilityIds.has("sandveil");
  if (weather === "snow") return abilityIds.has("slushrush") || abilityIds.has("icebody") || abilityIds.has("snowcloak");
  return false;
}

function weatherFromMove(moveId: string): "rain" | "sun" | "sand" | "snow" | null {
  if (moveId === "raindance") return "rain";
  if (moveId === "sunnyday") return "sun";
  if (moveId === "sandstorm") return "sand";
  if (moveId === "snowscape" || moveId === "hail") return "snow";
  return null;
}

function specialSystemTags(diagnostics: Record<string, unknown>): string[] {
  const raw = diagnostics.specialSystemTags;
  return Array.isArray(raw) ? raw.map(value => String(value)) : [];
}

function diagnosticIndicatesSetupTarget(diagnostics: Record<string, unknown>): boolean {
  if (diagnostics.targetSetup === true || diagnostics.foeLikelySetup === true) return true;
  const targetMove = normalizeId(diagnostics.targetLikelyMove || diagnostics.foeLikelyMove || "");
  return TAILWIND_MOVES.has(targetMove) || TRICK_ROOM_MOVES.has(targetMove);
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bounded(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundBreakdown(breakdown: BattleAiDoublesValueBreakdownV4): BattleAiDoublesValueBreakdownV4 {
  return Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, Math.round(value * 100) / 100])) as BattleAiDoublesValueBreakdownV4;
}

function normalizeMoveTarget(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
