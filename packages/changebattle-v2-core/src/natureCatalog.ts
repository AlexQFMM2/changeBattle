import {NATURES, NATURE_ZH} from "./formalGameCatalog.js";

export type BattleStatIdV4 = "atk" | "def" | "spa" | "spd" | "spe";

export type NatureEffectV4 = {
  id: string;
  name: string;
  nameZh: string;
  plus: BattleStatIdV4 | "";
  minus: BattleStatIdV4 | "";
};

export const BATTLE_STAT_LABELS_ZH_V4: Record<BattleStatIdV4, string> = {
  atk: "攻击",
  def: "防御",
  spa: "特攻",
  spd: "特防",
  spe: "速度",
};

const NATURE_EFFECTS: Record<string, {plus: BattleStatIdV4 | ""; minus: BattleStatIdV4 | ""}> = {
  Hardy: {plus: "", minus: ""},
  Lonely: {plus: "atk", minus: "def"},
  Brave: {plus: "atk", minus: "spe"},
  Adamant: {plus: "atk", minus: "spa"},
  Naughty: {plus: "atk", minus: "spd"},
  Bold: {plus: "def", minus: "atk"},
  Docile: {plus: "", minus: ""},
  Relaxed: {plus: "def", minus: "spe"},
  Impish: {plus: "def", minus: "spa"},
  Lax: {plus: "def", minus: "spd"},
  Timid: {plus: "spe", minus: "atk"},
  Hasty: {plus: "spe", minus: "def"},
  Serious: {plus: "", minus: ""},
  Jolly: {plus: "spe", minus: "spa"},
  Naive: {plus: "spe", minus: "spd"},
  Modest: {plus: "spa", minus: "atk"},
  Mild: {plus: "spa", minus: "def"},
  Quiet: {plus: "spa", minus: "spe"},
  Bashful: {plus: "", minus: ""},
  Rash: {plus: "spa", minus: "spd"},
  Calm: {plus: "spd", minus: "atk"},
  Gentle: {plus: "spd", minus: "def"},
  Sassy: {plus: "spd", minus: "spe"},
  Careful: {plus: "spd", minus: "spa"},
  Quirky: {plus: "", minus: ""},
};

export const NATURE_EFFECTS_V4: NatureEffectV4[] = NATURES.map(nature => ({
  id: nature,
  name: nature,
  nameZh: NATURE_ZH[nature] || nature,
  plus: NATURE_EFFECTS[nature]?.plus || "",
  minus: NATURE_EFFECTS[nature]?.minus || "",
}));

export function natureEffectLabelV4(stat: BattleStatIdV4 | ""): string {
  return stat ? BATTLE_STAT_LABELS_ZH_V4[stat] : "无";
}

export function getNatureEffectsV4(): NatureEffectV4[] {
  return NATURE_EFFECTS_V4.map(effect => ({...effect}));
}
