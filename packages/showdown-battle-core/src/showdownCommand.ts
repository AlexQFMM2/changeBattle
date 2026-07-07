export type ShowdownSpecialChoiceV4 = "mega" | "megax" | "megay" | "ultra" | "zmove" | "max" | "terastallize";
export type ShowdownSpecialSystemV4 = "mega" | "zmove" | "max" | "terastallize";
export type ShowdownAllowedSpecialSystemsV4 = Partial<Record<ShowdownSpecialSystemV4, boolean>> | readonly ShowdownSpecialSystemV4[];

export type ShowdownChoiceValidationReasonV4 =
  | "missing-request"
  | "empty-choice"
  | "parse-error"
  | "wrong-phase"
  | "wrong-choice-count"
  | "invalid-move"
  | "disabled-move"
  | "invalid-switch"
  | "duplicate-switch"
  | "slot-must-pass"
  | "missing-target"
  | "invalid-target"
  | "forbidden-target";

export type ShowdownParsedChoiceV4 =
  | {kind: "move"; index: number; target?: string; special?: ShowdownSpecialChoiceV4}
  | {kind: "switch"; index: number}
  | {kind: "team"; index: number}
  | {kind: "pass"}
  | {kind: "shift"}
  | {kind: "testfight"}
  | {kind: "auto"};

export type ShowdownChoiceValidationResultV4 =
  | {ok: true; choice: string}
  | {
    ok: false;
    reason: ShowdownChoiceValidationReasonV4;
    choice: string;
    message: string;
    playerMessage: string;
  };

export type ShowdownChoiceValidationMoveRequestV4 = {
  move?: string;
  id?: string;
  pp?: number;
  target?: string;
  disabled?: boolean;
};

export type ShowdownChoiceValidationRequestV4 = {
  wait?: boolean;
  teamPreview?: boolean;
  targetable?: boolean;
  active?: Array<{
    moves?: ShowdownChoiceValidationMoveRequestV4[];
    maxMoves?: ShowdownChoiceValidationMoveRequestV4[] | {maxMoves?: ShowdownChoiceValidationMoveRequestV4[]};
    zMoves?: Array<ShowdownChoiceValidationMoveRequestV4 | null>;
    canZMove?: Array<ShowdownChoiceValidationMoveRequestV4 | null>;
    canDynamax?: unknown;
    trapped?: boolean;
    maybeTrapped?: boolean;
  } | null>;
  forceSwitch?: boolean[];
  side?: {
    pokemon?: Array<{
      condition?: string;
      active?: boolean;
      fainted?: boolean;
      commanding?: boolean;
    }>;
  };
};

export type ShowdownChoiceValidationInputV4 = {
  request?: ShowdownChoiceValidationRequestV4 | null;
  choice: string;
};

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
export const SHOWDOWN_CHOOSABLE_TARGETS_V4: readonly string[] = ["normal", "any", "adjacentally", "adjacentallyorself", "adjacentfoe"] as const;

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

export function showdownSpecialSystemAllowedForRuleSetV4(system: ShowdownSpecialSystemV4, ruleSet?: string, _mode?: string): boolean {
  if (ruleSet === "gen7") return system === "mega" || system === "zmove";
  if (ruleSet === "gen8") return system === "max";
  if (ruleSet === "gen9") return system === "terastallize";
  return false;
}

export function showdownSpecialSystemAllowedV4(system: ShowdownSpecialSystemV4, ruleSet?: string, mode?: string, allowedSystems?: ShowdownAllowedSpecialSystemsV4): boolean {
  if (!showdownSpecialSystemAllowedForRuleSetV4(system, ruleSet, mode)) return false;
  if (!allowedSystems) return true;
  if (allowedSystemsIsArray(allowedSystems)) return allowedSystems.includes(system);
  return Boolean(allowedSystems[system]);
}

function allowedSystemsIsArray(value: ShowdownAllowedSpecialSystemsV4): value is readonly ShowdownSpecialSystemV4[] {
  return Array.isArray(value);
}

export function showdownSpecialChoiceAllowedForRuleSetV4(choice: ShowdownSpecialChoiceV4, ruleSet?: string, mode?: string, allowedSystems?: ShowdownAllowedSpecialSystemsV4): boolean {
  const system = showdownSpecialSystemForChoiceV4(choice);
  return Boolean(system && showdownSpecialSystemAllowedV4(system, ruleSet, mode, allowedSystems));
}

export function filterShowdownChoiceForRuleSetV4(choice: string, ruleSet: string, mode: string, allowedSystems?: ShowdownAllowedSpecialSystemsV4): string {
  return choice.split(",").map(part => {
    const trimmed = part.trim();
    const parsed = parseShowdownChoiceCommandV4(trimmed);
    if (!parsed || parsed.kind !== "move" || !parsed.special) return trimmed;
    if (showdownSpecialChoiceAllowedForRuleSetV4(parsed.special, ruleSet, mode, allowedSystems)) return stringifyShowdownChoiceCommandV4(parsed);
    return stringifyShowdownChoiceCommandV4({...parsed, special: undefined});
  }).join(", ");
}

export function showdownMoveNeedsExplicitTargetV4(move: {id?: string; target?: string} | undefined | null, targetable = true): boolean {
  if (!targetable || !move?.target) return false;
  if (showdownNormalizeMoveTargetV4(move.id) === "recharge") return false;
  const target = showdownNormalizeMoveTargetV4(move.target);
  return showdownTargetTypeAllowsChoiceV4(target);
}

export function showdownNormalizeMoveTargetV4(value: string | undefined): string {
  return String(value || "normal").replace(/[^a-z]/gi, "").toLowerCase() || "normal";
}

export function showdownTargetTypeAllowsChoiceV4(targetType: string | undefined): boolean {
  const target = showdownNormalizeMoveTargetV4(targetType);
  return SHOWDOWN_CHOOSABLE_TARGETS_V4.includes(target);
}

export function validateShowdownChoiceCommandV4(input: ShowdownChoiceValidationInputV4): ShowdownChoiceValidationResultV4 {
  const request = input.request || undefined;
  const choice = String(input.choice || "").trim();
  if (!request) return invalidChoice("missing-request", choice, "missing battle request", "当前没有可提交的战斗指令。");
  if (!choice) return invalidChoice("empty-choice", choice, "empty choice", "战斗指令不能为空。");
  if (request.wait) return invalidChoice("wrong-phase", choice, "request is waiting", "现在还不能提交指令。");
  if (request.teamPreview) return validateTeamPreviewChoice(request, choice);
  if (request.forceSwitch?.some(Boolean)) return validateForceSwitchChoice(request, choice);
  if (request.active?.length) return validateMoveTurnChoice(request, choice);
  return choice === "pass"
    ? {ok: true, choice}
    : invalidChoice("wrong-phase", choice, "no actionable request", "当前不是可行动阶段。");
}

function validateTeamPreviewChoice(request: ShowdownChoiceValidationRequestV4, choice: string): ShowdownChoiceValidationResultV4 {
  if (!/^team\s+\d+(?:,\s*\d+)*$/i.test(choice)) {
    return invalidChoice("wrong-phase", choice, "team preview requires team choice", "请选择出战顺序。");
  }
  const count = request.side?.pokemon?.length || 1;
  const indexes = choice.slice(choice.toLowerCase().indexOf("team") + 4).split(",").map(part => Number(part.trim()));
  if (!indexes.length || indexes.some(index => !Number.isInteger(index) || index < 1 || index > count)) {
    return invalidChoice("invalid-switch", choice, `invalid team preview indexes: ${indexes.join(",")}`, "出战顺序里有无效位置。");
  }
  return {ok: true, choice};
}

function validateForceSwitchChoice(request: ShowdownChoiceValidationRequestV4, choice: string): ShowdownChoiceValidationResultV4 {
  const choices = splitShowdownChoiceListV4(choice);
  const expected = request.forceSwitch?.length || 0;
  if (choices.length !== expected) {
    return invalidChoice("wrong-choice-count", choice, `expected ${expected} switch choices, got ${choices.length}`, "换人指令数量不正确。");
  }
  const usedSwitches = new Set<number>();
  for (let index = 0; index < expected; index += 1) {
    const mustSwitch = Boolean(request.forceSwitch?.[index]);
    const parsed = parseShowdownChoiceCommandV4(choices[index]);
    if (!mustSwitch) {
      if (parsed?.kind !== "pass") {
        return invalidChoice("slot-must-pass", choice, `slot ${index + 1} must pass`, "当前有位置不能行动，需要跳过。");
      }
      continue;
    }
    if (parsed?.kind === "pass" && !hasSwitchCandidate(request, usedSwitches)) continue;
    if (!parsed || parsed.kind !== "switch") {
      return invalidChoice("wrong-phase", choice, `slot ${index + 1} must switch`, "当前必须换人。");
    }
    const switchError = validateSwitchIndex(request, parsed.index, usedSwitches);
    if (switchError) return invalidChoice(switchError.reason, choice, switchError.message, switchError.playerMessage);
  }
  return {ok: true, choice};
}

function validateMoveTurnChoice(request: ShowdownChoiceValidationRequestV4, choice: string): ShowdownChoiceValidationResultV4 {
  const active = request.active || [];
  const choices = splitShowdownChoiceListV4(choice);
  if (choices.length !== active.length) {
    return invalidChoice("wrong-choice-count", choice, `expected ${active.length} active choices, got ${choices.length}`, "本回合指令数量不正确。");
  }
  const usedSwitches = new Set<number>();
  for (let activeIndex = 0; activeIndex < active.length; activeIndex += 1) {
    const parsed = parseShowdownChoiceCommandV4(choices[activeIndex]);
    if (!parsed) return invalidChoice("parse-error", choice, `cannot parse choice part: ${choices[activeIndex]}`, "战斗指令格式不正确。");
    const canCommand = activeSlotCanCommand(request, activeIndex);
    if (!canCommand) {
      if (parsed.kind !== "pass") {
        return invalidChoice("slot-must-pass", choice, `slot ${activeIndex + 1} cannot command`, "当前有宝可梦无法行动，需要跳过。");
      }
      continue;
    }
    if (parsed.kind === "pass") {
      return invalidChoice("wrong-phase", choice, `slot ${activeIndex + 1} must move or switch`, "当前宝可梦必须出招或换人。");
    }
    if (parsed.kind === "switch") {
      if (active[activeIndex]?.trapped || active[activeIndex]?.maybeTrapped) {
        return invalidChoice("invalid-switch", choice, `slot ${activeIndex + 1} is trapped`, "当前宝可梦不能替换下场。");
      }
      const switchError = validateSwitchIndex(request, parsed.index, usedSwitches);
      if (switchError) return invalidChoice(switchError.reason, choice, switchError.message, switchError.playerMessage);
      continue;
    }
    if (parsed.kind !== "move") {
      return invalidChoice("wrong-phase", choice, `move turn cannot use ${parsed.kind}`, "当前请选择招式或换人。");
    }
    const move = moveForParsedChoice(active[activeIndex], parsed);
    if (!move) return invalidChoice("invalid-move", choice, `invalid move index ${parsed.index} for slot ${activeIndex + 1}`, "选择的招式不存在。");
    if (move.disabled || (move.pp ?? 1) <= 0) {
      return invalidChoice("disabled-move", choice, `move ${move.id || move.move || parsed.index} is disabled`, "这个招式当前不能使用。");
    }
    const targetError = validateMoveTargetLoc(request, activeIndex, move, parsed.target);
    if (targetError) return invalidChoice(targetError.reason, choice, targetError.message, targetError.playerMessage);
  }
  return {ok: true, choice};
}

function splitShowdownChoiceListV4(choice: string): string[] {
  const trimmed = choice.trim();
  if (/^team\s+/i.test(trimmed)) return [trimmed];
  return trimmed.split(",").map(part => part.trim()).filter(Boolean);
}

function activeSlotCanCommand(request: ShowdownChoiceValidationRequestV4, activeIndex: number): boolean {
  if (!request.active?.[activeIndex]) return false;
  const row = request.side?.pokemon?.[activeIndex];
  if (!row) return true;
  return !row.fainted && !row.commanding && !conditionIsFainted(row.condition);
}

function conditionIsFainted(condition: string | undefined): boolean {
  return Boolean(condition?.includes("fnt") || /^\s*0(?:\D|$)/.test(condition || ""));
}

function validateSwitchIndex(
  request: ShowdownChoiceValidationRequestV4,
  switchIndex: number,
  usedSwitches: Set<number>,
): {reason: ShowdownChoiceValidationReasonV4; message: string; playerMessage: string} | null {
  if (usedSwitches.has(switchIndex)) {
    return {reason: "duplicate-switch", message: `duplicate switch ${switchIndex}`, playerMessage: "不能让多个位置换上同一只宝可梦。"};
  }
  const activeCount = request.forceSwitch?.length || request.active?.length || 0;
  const row = request.side?.pokemon?.[switchIndex - 1];
  if (!row || switchIndex <= activeCount || row.active || conditionIsFainted(row.condition)) {
    return {reason: "invalid-switch", message: `invalid switch ${switchIndex}`, playerMessage: "这个换人目标不可用。"};
  }
  usedSwitches.add(switchIndex);
  return null;
}

function hasSwitchCandidate(request: ShowdownChoiceValidationRequestV4, usedSwitches: Set<number>): boolean {
  const activeCount = request.forceSwitch?.length || request.active?.length || 0;
  return Boolean(request.side?.pokemon?.some((row, index) => {
    const switchIndex = index + 1;
    return switchIndex > activeCount && !usedSwitches.has(switchIndex) && !row.active && !conditionIsFainted(row.condition);
  }));
}

function moveForParsedChoice(
  active: NonNullable<ShowdownChoiceValidationRequestV4["active"]>[number] | undefined,
  choice: Extract<ShowdownParsedChoiceV4, {kind: "move"}>,
): ShowdownChoiceValidationMoveRequestV4 | null {
  const moveIndex = choice.index - 1;
  const baseMove = active?.moves?.[moveIndex];
  if (!baseMove) return null;
  if (!choice.special && !active?.canDynamax) {
    const maxMoves = Array.isArray(active?.maxMoves) ? active?.maxMoves : active?.maxMoves?.maxMoves;
    if (maxMoves?.[moveIndex]) return maxMoves[moveIndex] || baseMove;
  }
  if (choice.special === "max") {
    const maxMoves = Array.isArray(active?.maxMoves) ? active?.maxMoves : active?.maxMoves?.maxMoves;
    return maxMoves?.[moveIndex] || baseMove;
  }
  if (choice.special === "zmove") {
    const zMoves = active?.zMoves || active?.canZMove || [];
    return zMoves[moveIndex] || baseMove;
  }
  return baseMove;
}

function validateMoveTargetLoc(
  request: ShowdownChoiceValidationRequestV4,
  activeIndex: number,
  move: ShowdownChoiceValidationMoveRequestV4,
  target: string | undefined,
): {reason: ShowdownChoiceValidationReasonV4; message: string; playerMessage: string} | null {
  const targetType = showdownNormalizeMoveTargetV4(move.target);
  const targetLoc = target ? Number(target) : 0;
  const activeCount = request.active?.length || 1;
  if (showdownNormalizeMoveTargetV4(move.id) === "recharge") return null;
  if (showdownTargetTypeAllowsChoiceV4(targetType)) {
    if (!targetLoc && activeCount >= 2) {
      return {reason: "missing-target", message: `${move.move || move.id || "move"} needs a target`, playerMessage: "这个招式需要选择目标。"};
    }
    if (!validShowdownTargetLocV4(targetLoc, activeIndex, activeCount, targetType)) {
      return {reason: "invalid-target", message: `invalid target ${target || "0"} for ${move.move || move.id || "move"} target=${move.target}`, playerMessage: "这个招式不能选择该目标。"};
    }
    return null;
  }
  if (targetLoc) {
    return {reason: "forbidden-target", message: `${move.move || move.id || "move"} cannot choose a target target=${move.target}`, playerMessage: "这个招式不能手动选择目标。"};
  }
  return null;
}

export function validShowdownTargetLocV4(targetLoc: number, activeIndex: number, activeCount: number, targetType: string): boolean {
  if (targetLoc === 0) return true;
  const numSlots = Math.max(1, activeCount);
  const sourceLoc = -(activeIndex + 1);
  if (Math.abs(targetLoc) > numSlots) return false;
  const isSelf = sourceLoc === targetLoc;
  const isFoe = targetLoc > 0;
  const acrossFromTargetLoc = -(numSlots + 1 - targetLoc);
  const isAdjacent = targetLoc > 0
    ? Math.abs(acrossFromTargetLoc - sourceLoc) <= 1
    : Math.abs(targetLoc - sourceLoc) === 1;
  switch (showdownNormalizeMoveTargetV4(targetType)) {
    case "randomnormal":
    case "scripted":
    case "normal":
      return isAdjacent;
    case "adjacentally":
      return isAdjacent && !isFoe;
    case "adjacentallyorself":
      return (isAdjacent && !isFoe) || isSelf;
    case "adjacentfoe":
      return isAdjacent && isFoe;
    case "any":
      return !isSelf;
    default:
      return false;
  }
}

function invalidChoice(
  reason: ShowdownChoiceValidationReasonV4,
  choice: string,
  message: string,
  playerMessage: string,
): ShowdownChoiceValidationResultV4 {
  return {ok: false, reason, choice, message, playerMessage};
}
