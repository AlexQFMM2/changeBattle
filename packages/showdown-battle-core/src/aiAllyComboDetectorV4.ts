import type {BattleServiceRequestV4, BattleServiceSidePokemonV4} from "./types.js";

export type BattleAiAllyComboIdV4 =
  | "weakness-policy"
  | "contrary-stat-drop"
  | "flash-fire"
  | "lightning-rod"
  | "storm-drain"
  | "water-absorb"
  | "volt-absorb"
  | "sap-sipper"
  | "motor-drive"
  | "earth-immunity";

export type BattleAiAllyComboV4 = {
  comboId: BattleAiAllyComboIdV4;
  allyIdent?: string;
  benefit: number;
  risk: number;
  reasons: string[];
};

export type BattleAiAllyComboDetectInputV4 = {
  request: BattleServiceRequestV4;
  userSlotIndex: number;
  targetSlotIndex: number;
  diagnostics?: Record<string, unknown>;
};

const CONTRARY_STAT_DROP_MOVES = new Set([
  "charm",
  "fake tears",
  "faketears",
  "tickle",
  "scary face",
  "scaryface",
  "cotton spore",
  "cottonspore",
  "metal sound",
  "metalsound",
  "screech",
  "noble roar",
  "nobleroar",
  "parting shot",
  "partingshot",
]);

export function detectBattleAiAllyCombosV4(input: BattleAiAllyComboDetectInputV4): BattleAiAllyComboV4[] {
  const ally = activeRow(input.request, input.targetSlotIndex);
  if (!ally || ally.fainted || String(ally.condition || "").includes("fnt")) return [];
  const diagnostics = input.diagnostics || {};
  const moveId = normalizeId(diagnostics.moveId);
  const moveType = normalizeId(diagnostics.moveType);
  const category = normalizeId(diagnostics.category);
  const expectedDamageRatio = finiteNumber(diagnostics.expectedDamageRatio, 0);
  const koChance = finiteNumber(diagnostics.koChance, 0);
  const typeMultiplier = finiteNumber(diagnostics.typeMultiplier, 1);
  const ability = normalizeId(ally.ability || ally.baseAbility || "");
  const item = normalizeId(ally.item || "");
  const combos: BattleAiAllyComboV4[] = [];

  const add = (comboId: BattleAiAllyComboIdV4, benefit: number, risk: number, reasons: string[]) => {
    if (koChance >= 1 || hpRatioFromCondition(ally.condition) <= Math.max(0.05, expectedDamageRatio)) return;
    const outputWindow = allyHasOutputWindow(ally);
    combos.push({
      comboId,
      allyIdent: ally.ident,
      benefit: outputWindow ? benefit : Math.round(benefit * 0.35),
      risk: outputWindow ? risk : risk + 12,
      reasons: outputWindow ? [...reasons, "output-window"] : [...reasons, "limited-output-window"],
    });
  };

  if (item === "weaknesspolicy" && typeMultiplier > 1 && expectedDamageRatio > 0 && expectedDamageRatio <= 0.45) {
    add("weakness-policy", 58, expectedDamageRatio * 70, [`item:${item}`, `typeMultiplier:${typeMultiplier}`]);
  }
  if (ability === "contrary" && (category === "status" || expectedDamageRatio <= 0.05) && CONTRARY_STAT_DROP_MOVES.has(moveId)) {
    add("contrary-stat-drop", 46, 4, [`ability:${ability}`, `move:${moveId}`]);
  }
  if (ability === "flashfire" && moveType === "fire") add("flash-fire", 42, 0, [`ability:${ability}`, `type:${moveType}`]);
  if (ability === "lightningrod" && moveType === "electric") add("lightning-rod", 44, 0, [`ability:${ability}`, `type:${moveType}`]);
  if (ability === "stormdrain" && moveType === "water") add("storm-drain", 44, 0, [`ability:${ability}`, `type:${moveType}`]);
  if (ability === "waterabsorb" && moveType === "water") add("water-absorb", 38, 0, [`ability:${ability}`, `type:${moveType}`]);
  if (ability === "voltabsorb" && moveType === "electric") add("volt-absorb", 38, 0, [`ability:${ability}`, `type:${moveType}`]);
  if (ability === "sapsipper" && moveType === "grass") add("sap-sipper", 42, 0, [`ability:${ability}`, `type:${moveType}`]);
  if (ability === "motordrive" && moveType === "electric") add("motor-drive", 40, 0, [`ability:${ability}`, `type:${moveType}`]);
  if ((ability === "levitate" || ability === "eartheater") && moveType === "ground") {
    add("earth-immunity", ability === "eartheater" ? 38 : 26, 0, [`ability:${ability}`, `type:${moveType}`]);
  }

  return combos.sort((a, b) => b.benefit - b.risk - (a.benefit - a.risk));
}

export function battleAiAllyComboNetValueV4(combos: BattleAiAllyComboV4[]): number {
  return combos.reduce((sum, combo) => sum + combo.benefit - combo.risk, 0);
}

function activeRow(request: BattleServiceRequestV4, activeIndex: number): BattleServiceSidePokemonV4 | undefined {
  const activeRows = request.side?.pokemon?.filter(row => row.active) || [];
  return activeRows[activeIndex] || request.side?.pokemon?.[activeIndex];
}

function hpRatioFromCondition(condition: string): number {
  if (condition.includes("fnt")) return 0;
  const match = /^(\d+)\/(\d+)/.exec(condition.trim());
  if (!match) return 1;
  const hp = Number(match[1]);
  const maxHp = Number(match[2]);
  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return 1;
  return Math.max(0, Math.min(1, hp / maxHp));
}

function allyHasOutputWindow(ally: BattleServiceSidePokemonV4): boolean {
  const hpRatio = hpRatioFromCondition(ally.condition);
  const stats = ally.stats || {};
  const atk = Number(stats.atk || 0);
  const spa = Number(stats.spa || 0);
  const spe = Number(stats.spe || 0);
  const moves = (ally.moves || []).map(normalizeId);
  if (hpRatio >= 0.45 && (atk >= 105 || spa >= 105 || spe >= 110)) return true;
  return moves.some(move => [
    "protect",
    "suckerpunch",
    "aquajet",
    "extremespeed",
    "machpunch",
    "bulletpunch",
    "iceshard",
    "shadowsneak",
    "leafstorm",
    "thunderbolt",
    "hurricane",
    "flareblitz",
    "closecombat",
    "earthquake",
    "hydropump",
    "surf",
    "discharge",
  ].includes(move));
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
