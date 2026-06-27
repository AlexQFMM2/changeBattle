export type ShowdownSpecialChoiceV4 = "mega" | "megax" | "megay" | "ultra" | "zmove" | "max" | "terastallize";
export type ShowdownSpecialSystemV4 = "mega" | "zmove" | "max" | "terastallize";

export type ShowdownParsedChoiceV4 =
  | {kind: "move"; index: number; target?: string; special?: ShowdownSpecialChoiceV4}
  | {kind: "switch"; index: number}
  | {kind: "team"; index: number}
  | {kind: "pass"}
  | {kind: "shift"}
  | {kind: "testfight"}
  | {kind: "auto"};

export const SHOWDOWN_SPECIAL_CHOICES_V4: readonly ShowdownSpecialChoiceV4[] = [
  "mega",
  "megax",
  "megay",
  "ultra",
  "zmove",
  "max",
  "terastallize",
] as const;

export const SHOWDOWN_TARGET_LOC_PATTERN_V4 = /^(?:-|\+)?[1-3]$/;

export function parseShowdownChoiceCommandV4(input: string | undefined): ShowdownParsedChoiceV4 | null {
  const parts = String(input || "").trim().split(/\s+/).filter(Boolean);
  const kind = parts[0];
  if (!kind) return null;
  if (kind === "pass" || kind === "skip") {
    return parts.length === 1 ? {kind: "pass"} : null;
  }
  if (kind === "shift") return parts.length === 1 ? {kind: "shift"} : null;
  if (kind === "testfight") return parts.length === 1 ? {kind: "testfight"} : null;
  if (kind === "auto" || kind === "default") return parts.length === 1 ? {kind: "auto"} : null;
  if (kind !== "move" && kind !== "switch" && kind !== "team") return null;
  const index = Number(parts[1]);
  if (!Number.isFinite(index) || index <= 0) return null;
  if (kind === "switch" || kind === "team") return parts.length === 2 ? {kind, index} : null;
  if (kind === "move") {
    const maybeSpecial = showdownSpecialChoiceFromTokenV4(parts[2] || "");
    const maybeTarget = maybeSpecial ? parts[3] : parts[2];
    if (maybeTarget && !SHOWDOWN_TARGET_LOC_PATTERN_V4.test(maybeTarget)) return null;
    if (parts.length > (maybeSpecial ? 4 : 3)) return null;
    return {
      kind,
      index,
      special: maybeSpecial || undefined,
      target: maybeTarget || undefined,
    };
  }
  return null;
}

export function stringifyShowdownChoiceCommandV4(choice: ShowdownParsedChoiceV4): string {
  if (choice.kind === "pass") return "pass";
  if (choice.kind === "shift") return "shift";
  if (choice.kind === "testfight") return "testfight";
  if (choice.kind === "auto") return "auto";
  if (choice.kind === "move") {
    return ["move", choice.index, choice.special ? showdownSpecialChoiceSuffixV4(choice.special) : "", choice.target].filter(Boolean).join(" ");
  }
  return `${choice.kind} ${choice.index}`;
}

export function appendShowdownSpecialChoiceSuffixV4(choice: string, special?: ShowdownSpecialChoiceV4 | null): string {
  const parsed = parseShowdownChoiceCommandV4(choice);
  if (!parsed || parsed.kind !== "move") return choice;
  return stringifyShowdownChoiceCommandV4({...parsed, special: special || undefined});
}

export function withShowdownMoveTargetSuffixV4(choice: string, target?: string): string {
  const parsed = parseShowdownChoiceCommandV4(choice);
  if (!parsed || parsed.kind !== "move") return [choice, target].filter(Boolean).join(" ");
  return stringifyShowdownChoiceCommandV4({...parsed, target: target || undefined});
}

export function showdownSpecialChoiceFromTokenV4(value: string): ShowdownSpecialChoiceV4 | null {
  const suffix = String(value || "").toLowerCase();
  if (suffix === "mega" || suffix === "megax" || suffix === "megay" || suffix === "ultra" || suffix === "zmove" || suffix === "terastallize") return suffix;
  if (suffix === "max") return "max";
  return null;
}

export function showdownSpecialChoiceSuffixV4(choice: ShowdownSpecialChoiceV4): string {
  return choice;
}

export function showdownSpecialSystemForChoiceV4(choice?: ShowdownSpecialChoiceV4 | null): ShowdownSpecialSystemV4 | null {
  if (!choice) return null;
  if (choice === "mega" || choice === "megax" || choice === "megay" || choice === "ultra") return "mega";
  if (choice === "zmove") return "zmove";
  if (choice === "max") return "max";
  if (choice === "terastallize") return "terastallize";
  return null;
}

export function showdownSpecialSystemAllowedForRuleSetV4(system: ShowdownSpecialSystemV4, ruleSet?: string, mode?: string): boolean {
  if (mode === "coop") return system === "terastallize";
  if (ruleSet === "gen7") return system === "mega" || system === "zmove";
  if (ruleSet === "gen8") return system === "max";
  if (ruleSet === "gen9" || ruleSet === "standard") return system === "terastallize";
  return system === "terastallize";
}

export function showdownSpecialChoiceAllowedForRuleSetV4(choice: ShowdownSpecialChoiceV4, ruleSet?: string, mode?: string): boolean {
  const system = showdownSpecialSystemForChoiceV4(choice);
  return Boolean(system && showdownSpecialSystemAllowedForRuleSetV4(system, ruleSet, mode));
}

export function filterShowdownChoiceForRuleSetV4(choice: string, ruleSet: string, mode: string): string {
  return choice.split(",").map(part => {
    const trimmed = part.trim();
    const parsed = parseShowdownChoiceCommandV4(trimmed);
    if (!parsed || parsed.kind !== "move" || !parsed.special) return trimmed;
    if (showdownSpecialChoiceAllowedForRuleSetV4(parsed.special, ruleSet, mode)) return stringifyShowdownChoiceCommandV4(parsed);
    return stringifyShowdownChoiceCommandV4({...parsed, special: undefined});
  }).join(", ");
}
