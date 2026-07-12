// Battle V4 是本项目的底层战斗逻辑；active 身份连续性、switch/detailschange 和 choice 闭环
// 全面参考 Pokemon Showdown Client 的 battle.ts / battle-choices.ts，并翻译为本项目的 snapshot/projection 架构。
// 后续修改或排查战斗页 bug 时，优先横向对比本实现与 Showdown Client 的差异，再决定如何落到本项目架构。
// 严禁随意修改；只有确认 Showdown Client 对应实现来源与差异后，才允许调整这里的战斗行为。
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
  maxpp?: number;
  target?: string;
  disabled?: boolean;
  serverForced?: boolean;
};

export type ShowdownChoiceValidationRequestV4 = {
  wait?: boolean;
  teamPreview?: boolean;
  chosenTeamSize?: number;
  maxChosenTeamSize?: number;
  targetable?: boolean;
  active?: Array<{
    moves?: ShowdownChoiceValidationMoveRequestV4[];
    maxMoves?: ShowdownChoiceValidationMoveRequestV4[] | {maxMoves?: ShowdownChoiceValidationMoveRequestV4[]};
    zMoves?: Array<ShowdownChoiceValidationMoveRequestV4 | null>;
    canZMove?: Array<ShowdownChoiceValidationMoveRequestV4 | null>;
    canDynamax?: unknown;
    trapped?: boolean;
    maybeTrapped?: boolean;
    maybeDisabled?: boolean;
    maybeLocked?: boolean;
  } | null>;
  forceSwitch?: boolean[];
  side?: {
    pokemon?: Array<{
      ident?: string;
      details?: string;
      condition?: string;
      active?: boolean;
      fainted?: boolean;
      commanding?: boolean;
    }>;
  };
};
type ShowdownChoiceValidationSidePokemonRowV4 = NonNullable<NonNullable<ShowdownChoiceValidationRequestV4["side"]>["pokemon"]>[number];

export type ShowdownChoiceValidationInputV4 = {
  request?: ShowdownChoiceValidationRequestV4 | null;
  choice: string;
};

export type ShowdownChoiceNormalizedRequestV4 = ShowdownChoiceValidationRequestV4 & {
  requestType: "move" | "switch" | "team" | "wait";
  noCancel?: boolean;
  activeSidePokemon?: Array<ShowdownChoiceValidationSidePokemonRowV4 | null>;
  activeTeamIndexes?: number[];
};

type ShowdownBuilderMoveChoiceV4 = {
  choiceType: "move";
  move: number;
  targetLoc: number;
  mega: boolean;
  megax: boolean;
  megay: boolean;
  ultra: boolean;
  z: boolean;
  max: boolean;
  tera: boolean;
};

type ShowdownBuilderSwitchChoiceV4 = {choiceType: "switch" | "team"; targetPokemon: number};
type ShowdownBuilderChoiceV4 = ShowdownBuilderMoveChoiceV4 | ShowdownBuilderSwitchChoiceV4 | {choiceType: "shift" | "testfight"};

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
  if (!targetable || !move) return false;
  if (showdownMoveIsServerForcedV4(move)) return false;
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

export function normalizeShowdownChoiceRequestV4(request: ShowdownChoiceValidationRequestV4 | undefined | null): ShowdownChoiceNormalizedRequestV4 | undefined {
  if (!request) return undefined;
  const requestType = request.wait
    ? "wait"
    : request.teamPreview
      ? "team"
      : request.forceSwitch
        ? "switch"
        : "move";
  const sidePokemon = request.side?.pokemon || [];
  const activeSidePokemon = resolveShowdownChoiceActiveRows(request, sidePokemon);
  const active = request.active?.map((entry, index) => {
    if (!entry) return null;
    const row = activeSidePokemon[index];
    if (row && (row.fainted || row.commanding || conditionIsFainted(row.condition))) return null;
    return normalizeShowdownChoiceActiveRequest(entry);
  });
  const forceSwitch = request.forceSwitch?.slice();
  return {
    ...request,
    noCancel: Boolean((request as {noCancel?: boolean}).noCancel || request.wait),
    requestType,
    targetable: Boolean(request.targetable || requestType === "move" && (active?.length || 0) > 1),
    active,
    forceSwitch,
    activeSidePokemon,
    activeTeamIndexes: activeSidePokemon.map(row => row ? sidePokemon.indexOf(row) : -1),
  };
}

function normalizeShowdownChoiceActiveRequest(active: NonNullable<ShowdownChoiceValidationRequestV4["active"]>[number]): NonNullable<ShowdownChoiceValidationRequestV4["active"]>[number] {
  if (!active) return active;
  const rawMaxMoves = active.maxMoves;
  const maxMoves = Array.isArray(rawMaxMoves) ? rawMaxMoves : rawMaxMoves?.maxMoves;
  const zMoves = active.zMoves || active.canZMove;
  const baseMoves = active.moves || [];
  const moves = baseMoves.map((move, index) => {
    const serverForced = showdownMoveLooksServerForcedV4(move, baseMoves.length);
    return {
      ...move,
      serverForced,
      target: serverForced ? move.target : showdownNormalizeMoveTargetV4(move.target),
      maxMove: maxMoves?.[index] ? {...maxMoves[index]!, target: showdownNormalizeMoveTargetV4(maxMoves[index]!.target)} : (move as {maxMove?: ShowdownChoiceValidationMoveRequestV4}).maxMove,
      zMove: zMoves?.[index] ? {...zMoves[index]!, target: showdownNormalizeMoveTargetV4(zMoves[index]!.target)} : (move as {zMove?: ShowdownChoiceValidationMoveRequestV4}).zMove,
    };
  });
  return {
    ...active,
    moves,
    ...(maxMoves?.length ? {maxMoves} : {}),
    ...(zMoves?.length ? {zMoves} : {}),
  };
}

export function showdownMoveIsServerForcedV4(move: {id?: string; target?: string; pp?: number; maxpp?: number; disabled?: boolean; serverForced?: boolean} | undefined | null): boolean {
  return Boolean(move?.serverForced);
}

function showdownMoveLooksServerForcedV4(move: ShowdownChoiceValidationMoveRequestV4, moveCount: number): boolean {
  if (move.target) return false;
  if (moveCount !== 1) return false;
  if (typeof move.pp === "number" || typeof move.maxpp === "number") return false;
  if (typeof move.disabled === "boolean") return false;
  return Boolean(move.id || move.move);
}

function resolveShowdownChoiceActiveRows(request: ShowdownChoiceValidationRequestV4, sidePokemon: ShowdownChoiceValidationSidePokemonRowV4[]): Array<ShowdownChoiceValidationSidePokemonRowV4 | null> {
  const used = new Set<number>();
  const count = request.active?.length || request.forceSwitch?.length || 0;
  const activeRows = sidePokemon.map((row, index) => ({row, index})).filter(entry => entry.row.active);
  return Array.from({length: count}, (_, activeIndex) => {
    const ordered = activeRows[activeIndex];
    const picked = ordered && !used.has(ordered.index)
      ? ordered
      : activeRows.find(entry => !used.has(entry.index));
    const fallback = !activeRows.length
      ? sidePokemon.map((row, index) => ({row, index})).find(entry => entry.index >= activeIndex && !used.has(entry.index))
      : null;
    const next = picked || fallback;
    if (!next) return null;
    used.add(next.index);
    return next.row;
  });
}

export class ShowdownChoiceBuilderV4 {
  request: ShowdownChoiceNormalizedRequestV4;
  noCancel: boolean;
  choices: string[] = [];
  current: ShowdownBuilderMoveChoiceV4 = emptyBuilderMoveChoiceV4();
  alreadySwitchingIn: number[] = [];
  alreadyMega = false;
  alreadyMax = false;
  alreadyZ = false;
  alreadyTera = false;

  constructor(request: ShowdownChoiceValidationRequestV4) {
    this.request = normalizeShowdownChoiceRequestV4(request) || ({requestType: "wait", noCancel: true} as ShowdownChoiceNormalizedRequestV4);
    this.noCancel = Boolean(this.request.noCancel || this.request.requestType === "wait");
    this.fillPasses();
  }

  toString(): string {
    const choices = this.current.move ? this.choices.concat(this.stringChoice(this.current)) : this.choices;
    return choices.join(", ").replace(/, team /g, ", ");
  }

  isDone(): boolean {
    return this.choices.length >= this.requestLength();
  }

  isEmpty(): boolean {
    return this.choices.every(choice => choice === "pass") && !this.current.move;
  }

  index(): number {
    return this.choices.length;
  }

  requestLength(): number {
    switch (this.request.requestType) {
      case "move":
        return this.request.active?.length || 0;
      case "switch":
        return this.request.forceSwitch?.length || 0;
      case "team":
        return normalizedTeamPreviewSizeV4(this.request);
      case "wait":
        return 0;
      default:
        return 0;
    }
  }

  currentMoveRequest(index = this.index()): NonNullable<ShowdownChoiceValidationRequestV4["active"]>[number] | null {
    if (this.request.requestType !== "move") return null;
    return this.request.active?.[index] || null;
  }

  noMoreSwitchChoices(): boolean {
    if (this.request.requestType !== "switch") return false;
    const sidePokemon = this.request.side?.pokemon || [];
    for (let index = this.requestLength(); index < sidePokemon.length; index += 1) {
      const pokemon = sidePokemon[index];
      if (pokemon && !pokemon.fainted && !conditionIsFainted(pokemon.condition) && !this.alreadySwitchingIn.includes(index + 1)) return false;
    }
    return true;
  }

  addChoice(choiceString: string): string | null {
    let choice: ShowdownBuilderChoiceV4 | null;
    try {
      choice = this.parseChoice(choiceString);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    if (!choice) return "You do not need to manually choose to pass; the client handles it for you automatically";
    const isLastChoice = this.choices.length + 1 >= this.requestLength();
    if (choice.choiceType === "move") {
      if (!choice.targetLoc && this.request.targetable) {
        const target = showdownNormalizeMoveTargetForBuilderV4(this.currentMove(choice)?.target);
        if (SHOWDOWN_CHOOSABLE_TARGETS_V4.includes(target)) {
          this.current = choice;
          return null;
        }
      }
      if (this.currentMoveRequest()?.maybeDisabled && isLastChoice) this.noCancel = true;
      if (choice.mega || choice.megax || choice.megay) this.alreadyMega = true;
      if (choice.z) this.alreadyZ = true;
      if (choice.max) this.alreadyMax = true;
      if (choice.tera) this.alreadyTera = true;
      this.current = emptyBuilderMoveChoiceV4();
    } else if (choice.choiceType === "switch" || choice.choiceType === "team") {
      if (this.currentMoveRequest()?.trapped) return "You are trapped and cannot switch out";
      if (this.alreadySwitchingIn.includes(choice.targetPokemon)) {
        if (choice.choiceType === "switch") return "You've already chosen to switch that Pokemon in";
        for (let index = 0; index < this.alreadySwitchingIn.length; index += 1) {
          if (this.alreadySwitchingIn[index] !== choice.targetPokemon) continue;
          this.alreadySwitchingIn.splice(index, 1);
          this.choices.splice(index, 1);
          return null;
        }
        return "Unexpected bug, please report this";
      }
      if (this.currentMoveRequest()?.maybeTrapped && isLastChoice) this.noCancel = true;
      this.alreadySwitchingIn.push(choice.targetPokemon);
    } else if (choice.choiceType === "testfight") {
      if (isLastChoice) this.noCancel = true;
    } else if (choice.choiceType === "shift") {
      if (this.index() === 1) return "Only Pokemon not already in the center can shift to the center";
    }
    this.choices.push(this.stringChoice(choice));
    this.fillPasses();
    return null;
  }

  fillPasses(): void {
    switch (this.request.requestType) {
      case "move":
        while (
          (this.choices.length < (this.request.active?.length || 0) && !this.request.active?.[this.choices.length]) ||
          this.request.side?.pokemon?.[this.choices.length]?.commanding
        ) {
          this.choices.push("pass");
        }
        break;
      case "switch": {
        const noMoreSwitchChoices = this.noMoreSwitchChoices();
        while (this.choices.length < (this.request.forceSwitch?.length || 0)) {
          if (!this.request.forceSwitch?.[this.choices.length] || noMoreSwitchChoices) this.choices.push("pass");
          else break;
        }
        break;
      }
      default:
        break;
    }
  }

  currentMove(choice = this.current, index = this.index()): ShowdownChoiceValidationMoveRequestV4 | null {
    const moveIndex = choice.move - 1;
    return this.currentMoveList(index, choice)?.[moveIndex] || null;
  }

  currentMoveList(index = this.index(), current: {max?: boolean; z?: boolean} = this.current): Array<ShowdownChoiceValidationMoveRequestV4 | null> | null {
    const moveRequest = this.currentMoveRequest(index);
    if (!moveRequest) return null;
    const maxMoves = Array.isArray(moveRequest.maxMoves) ? moveRequest.maxMoves : moveRequest.maxMoves?.maxMoves;
    if (current.max || (Boolean(maxMoves?.length) && !moveRequest.canDynamax)) {
      return maxMoves || null;
    }
    if (current.z) return moveRequest.zMoves || moveRequest.canZMove || null;
    return moveRequest.moves || null;
  }

  parseChoice(choiceString: string, index = this.choices.length): ShowdownBuilderChoiceV4 | null {
    const request = this.request;
    let choice = String(choiceString || "").trim();
    if (request.requestType === "wait") throw new Error("It's not your turn to choose anything");
    if (choice === "shift" || choice === "testfight") {
      if (request.requestType !== "move") throw new Error("You must switch in a Pokemon, not move.");
      return {choiceType: choice};
    }
    if (choice.startsWith("move ")) {
      if (request.requestType !== "move") throw new Error("You must switch in a Pokemon, not move.");
      const moveRequest = request.active?.[index];
      if (!moveRequest) throw new Error(`Move ${choice.slice(5).trim() || index + 1} is disabled`);
      choice = choice.slice(5).trim();
      const current = emptyBuilderMoveChoiceV4();
      while (true) {
        if (/\s(?:-|\+)?[1-3]$/.test(choice) && showdownChoiceIdV4(choice) !== "conversion2") {
          if (current.targetLoc) throw new Error("Move choice has multiple targets");
          current.targetLoc = parseInt(choice.slice(-2), 10);
          choice = choice.slice(0, -2).trim();
        } else if (choice.endsWith(" mega")) {
          current.mega = true;
          choice = choice.slice(0, -5);
        } else if (choice.endsWith(" megax")) {
          current.megax = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" megay")) {
          current.megay = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" zmove")) {
          current.z = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" ultra")) {
          current.ultra = true;
          choice = choice.slice(0, -6);
        } else if (choice.endsWith(" dynamax")) {
          current.max = true;
          choice = choice.slice(0, -8);
        } else if (choice.endsWith(" max")) {
          current.max = true;
          choice = choice.slice(0, -4);
        } else if (choice.endsWith(" terastallize")) {
          current.tera = true;
          choice = choice.slice(0, -13);
        } else if (choice.endsWith(" terastal")) {
          current.tera = true;
          choice = choice.slice(0, -9);
        } else {
          break;
        }
      }
      if (/^[0-9]+$/.test(choice)) {
        current.move = parseInt(choice, 10);
      } else {
        const moveId = showdownChoiceIdV4(choice).startsWith("hiddenpower") ? "hiddenpower" : showdownChoiceIdV4(choice);
        const baseMoves = moveRequest.moves || [];
        for (let moveIndex = 0; moveIndex < baseMoves.length; moveIndex += 1) {
          const move = baseMoves[moveIndex];
          if (moveId !== showdownChoiceIdV4(move?.id || move?.move)) continue;
          current.move = moveIndex + 1;
          if (move?.disabled) throw new Error(`Move "${move.move || move.id || current.move}" is disabled`);
          break;
        }
        const zMoves = moveRequest.zMoves || moveRequest.canZMove || [];
        if (!current.move) {
          for (let moveIndex = 0; moveIndex < zMoves.length; moveIndex += 1) {
            const move = zMoves[moveIndex];
            if (!move || moveId !== showdownChoiceIdV4(move.id || move.move)) continue;
            current.move = moveIndex + 1;
            current.z = true;
            break;
          }
        }
        const maxMoves = Array.isArray(moveRequest.maxMoves) ? moveRequest.maxMoves : moveRequest.maxMoves?.maxMoves || [];
        if (!current.move) {
          for (let moveIndex = 0; moveIndex < maxMoves.length; moveIndex += 1) {
            const move = maxMoves[moveIndex];
            if (moveId !== showdownChoiceIdV4(move?.id || move?.move)) continue;
            if (move?.disabled) throw new Error(`Move "${move.move || move.id || current.move}" is disabled`);
            current.move = moveIndex + 1;
            current.max = true;
            break;
          }
        }
      }
      if (current.max && !moveRequest.canDynamax) current.max = false;
      const move = this.currentMove(current, index);
      if (!move || move.disabled) throw new Error(`Move ${move?.move || move?.id || current.move} is disabled`);
      return current;
    }
    if (choice.startsWith("switch ") || choice.startsWith("team ")) {
      const isTeamPreview = request.requestType === "team";
      choice = choice.slice(choice.startsWith("team ") ? 5 : 7).trim();
      const current: ShowdownBuilderSwitchChoiceV4 = {choiceType: isTeamPreview ? "team" : "switch", targetPokemon: 0};
      if (choice === "notMine") throw new Error("You cannot decide for your partner!");
      if (/^[0-9]+$/.test(choice)) {
        current.targetPokemon = parseInt(choice, 10);
      } else {
        const match = this.matchPokemonChoice(choice);
        if (!match) throw new Error(`Couldn't find Pokemon "${choice}" to switch to`);
        current.targetPokemon = match;
      }
      if (!isTeamPreview && this.request.activeTeamIndexes?.includes(current.targetPokemon - 1)) throw new Error("That Pokemon is already in battle!");
      const target = request.side?.pokemon?.[current.targetPokemon - 1];
      if (!target) throw new Error(`Couldn't find Pokemon "${choice}" to switch to!`);
      if (target.fainted || conditionIsFainted(target.condition)) throw new Error(`${target.ident || choice} is fainted and cannot battle!`);
      return current;
    }
    if (choice === "pass") return null;
    throw new Error(`Unrecognized choice "${choice}"`);
  }

  stringChoice(choice: ShowdownBuilderChoiceV4 | null): string {
    if (!choice) return "pass";
    switch (choice.choiceType) {
      case "move": {
        const target = choice.targetLoc ? ` ${choice.targetLoc > 0 ? "+" : ""}${choice.targetLoc}` : "";
        return `move ${choice.move}${this.moveSpecial(choice)}${target}`;
      }
      case "switch":
      case "team":
        return `${choice.choiceType} ${choice.targetPokemon}`;
      case "shift":
      case "testfight":
        return choice.choiceType;
      default:
        return "pass";
    }
  }

  moveSpecial(choice: ShowdownBuilderMoveChoiceV4): string {
    return `${choice.max ? " max" : ""}${choice.mega ? " mega" : ""}${choice.megax ? " megax" : ""}${choice.megay ? " megay" : ""}${choice.ultra ? " ultra" : ""}${choice.z ? " zmove" : ""}${choice.tera ? " terastallize" : ""}`;
  }

  private matchPokemonChoice(choice: string): number {
    const choiceId = showdownChoiceIdV4(choice);
    const lowerChoice = choice.toLowerCase();
    let matchLevel = 0;
    let match = 0;
    const sidePokemon = this.request.side?.pokemon || [];
    for (let index = 0; index < sidePokemon.length; index += 1) {
      const pokemon = sidePokemon[index];
      const name = pokemon.ident?.replace(/^p[1-4]:\s*/i, "") || pokemon.details?.split(",")[0] || "";
      const speciesForme = pokemon.details?.split(",")[0] || name;
      let level = 0;
      if (choice === name) level = 10;
      else if (lowerChoice === name.toLowerCase()) level = 9;
      else if (choiceId === showdownChoiceIdV4(name)) level = 8;
      else if (choiceId === showdownChoiceIdV4(speciesForme)) level = 7;
      if (level > matchLevel) {
        match = index + 1;
        matchLevel = level;
      }
    }
    return match;
  }
}

function emptyBuilderMoveChoiceV4(): ShowdownBuilderMoveChoiceV4 {
  return {choiceType: "move", move: 0, targetLoc: 0, mega: false, megax: false, megay: false, ultra: false, z: false, max: false, tera: false};
}

function showdownNormalizeMoveTargetForBuilderV4(value: string | undefined): string {
  return String(value || "").replace(/[^a-z]/gi, "").toLowerCase();
}

function showdownChoiceIdV4(value: string | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizedTeamPreviewSizeV4(request: ShowdownChoiceValidationRequestV4): number {
  const count = request.side?.pokemon?.length || 1;
  return Math.max(1, Math.min(count, Math.floor(Number(request.chosenTeamSize || request.maxChosenTeamSize || (request.teamPreview ? 1 : count)) || 1)));
}

export function validateShowdownChoiceCommandV4(input: ShowdownChoiceValidationInputV4): ShowdownChoiceValidationResultV4 {
  const request = normalizeShowdownChoiceRequestV4(input.request);
  const choice = String(input.choice || "").trim();
  if (!request) return invalidChoice("missing-request", choice, "missing battle request", "当前没有可提交的战斗指令。");
  if (!choice) return invalidChoice("empty-choice", choice, "empty choice", "战斗指令不能为空。");
  if (request.teamPreview) {
    const teamValidation = validateTeamPreviewChoice(request, choice);
    if (!teamValidation.ok) return teamValidation;
    const builderValidation = validateChoiceWithShowdownBuilderV4(request, choice);
    return builderValidation.ok ? teamValidation : builderValidation;
  }
  if (request.forceSwitch?.some(Boolean)) {
    const switchValidation = validateForceSwitchChoice(request, choice);
    if (!switchValidation.ok) return switchValidation;
    const builderValidation = validateChoiceWithShowdownBuilderV4(request, choice);
    return builderValidation.ok ? switchValidation : builderValidation;
  }
  const builderValidation = validateChoiceWithShowdownBuilderV4(request, choice);
  if (!builderValidation.ok) return builderValidation;
  if (request.wait) return invalidChoice("wrong-phase", choice, "request is waiting", "现在还不能提交指令。");
  if (request.active?.length) return validateMoveTurnChoice(request, choice);
  return choice === "pass"
    ? {ok: true, choice}
    : invalidChoice("wrong-phase", choice, "no actionable request", "当前不是可行动阶段。");
}

function validateChoiceWithShowdownBuilderV4(request: ShowdownChoiceNormalizedRequestV4, choice: string): ShowdownChoiceValidationResultV4 {
  const builder = new ShowdownChoiceBuilderV4(request);
  const choices = splitShowdownChoiceListForBuilderV4(request, choice);
  if (!choices.length && builder.requestLength() > 0) {
    return invalidChoice("empty-choice", choice, "empty choice", "战斗指令不能为空。");
  }
  for (const part of choices) {
    if (part === "pass" && builder.choices[builder.index() - 1] === "pass") continue;
    const error = builder.addChoice(part);
    if (error) {
      const reason = showdownBuilderErrorReasonV4(error);
      return invalidChoice(reason, choice, error, error);
    }
    if (builder.current.move) {
      const move = builder.currentMove(builder.current);
      return invalidChoice("missing-target", choice, `${move?.move || move?.id || "move"} needs a target`, "这个招式需要选择目标。");
    }
  }
  if (!builder.isDone()) {
    if (builder.current.move) {
      const move = builder.currentMove(builder.current);
      return invalidChoice("missing-target", choice, `${move?.move || move?.id || "move"} needs a target`, "这个招式需要选择目标。");
    }
    return invalidChoice("wrong-choice-count", choice, `expected ${builder.requestLength()} choices, got ${choices.length}`, "本回合指令数量不正确。");
  }
  return {ok: true, choice: builder.toString()};
}

function showdownBuilderErrorReasonV4(error: string): ShowdownChoiceValidationReasonV4 {
  if (/fainted|already in battle|switch|couldn't find pokemon|trapped/i.test(error)) return "invalid-switch";
  if (/disabled/i.test(error)) return "disabled-move";
  return "parse-error";
}

function splitShowdownChoiceListForBuilderV4(request: ShowdownChoiceNormalizedRequestV4, choice: string): string[] {
  const trimmed = choice.trim();
  if (request.requestType === "team" && /^team\s+/i.test(trimmed)) {
    return trimmed
      .replace(/^team\s+/i, "")
      .split(",")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => `team ${part}`);
  }
  return splitShowdownChoiceListV4(trimmed);
}

function validateTeamPreviewChoice(request: ShowdownChoiceValidationRequestV4, choice: string): ShowdownChoiceValidationResultV4 {
  if (!/^team\s+\d+(?:,\s*\d+)*$/i.test(choice)) {
    return invalidChoice("wrong-phase", choice, "team preview requires team choice", "请选择出战顺序。");
  }
  const count = request.side?.pokemon?.length || 1;
  const indexes = choice.slice(choice.toLowerCase().indexOf("team") + 4).split(",").map(part => Number(part.trim()));
  const expected = Math.max(1, Math.min(count, Math.floor(Number(request.chosenTeamSize || request.maxChosenTeamSize || count) || count)));
  if (indexes.length !== expected) {
    return invalidChoice("wrong-choice-count", choice, `expected ${expected} team choices, got ${indexes.length}`, "出战顺序数量不正确。");
  }
  if (!indexes.length || indexes.some(index => !Number.isInteger(index) || index < 1 || index > count)) {
    return invalidChoice("invalid-switch", choice, `invalid team preview indexes: ${indexes.join(",")}`, "出战顺序里有无效位置。");
  }
  if (new Set(indexes).size !== indexes.length) {
    return invalidChoice("duplicate-switch", choice, `duplicate team preview indexes: ${indexes.join(",")}`, "出战顺序里不能重复选择同一只宝可梦。");
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
      if (active[activeIndex]?.trapped) {
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
  const row = activeSidePokemonRow(request, activeIndex);
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
  const row = request.side?.pokemon?.[switchIndex - 1];
  if (!row || row.active || conditionIsFainted(row.condition)) {
    return {reason: "invalid-switch", message: `invalid switch ${switchIndex}`, playerMessage: "这个换人目标不可用。"};
  }
  usedSwitches.add(switchIndex);
  return null;
}

function hasSwitchCandidate(request: ShowdownChoiceValidationRequestV4, usedSwitches: Set<number>): boolean {
  return Boolean(request.side?.pokemon?.some((row, index) => {
    const switchIndex = index + 1;
    return !usedSwitches.has(switchIndex) && !row.active && !conditionIsFainted(row.condition);
  }));
}

function activeSidePokemonRow(request: ShowdownChoiceValidationRequestV4, activeIndex: number): ShowdownChoiceValidationSidePokemonRowV4 | undefined {
  const normalizedRow = (request as ShowdownChoiceNormalizedRequestV4).activeSidePokemon?.[activeIndex];
  if (normalizedRow) return normalizedRow;
  const activeRows = request.side?.pokemon?.filter(row => row.active) || [];
  return activeRows[activeIndex] || request.side?.pokemon?.[activeIndex];
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
  const targetLoc = target ? Number(target) : 0;
  const activeCount = request.active?.length || 1;
  if (showdownMoveIsServerForcedV4(move)) {
    return targetLoc
      ? {reason: "forbidden-target", message: `${move.move || move.id || "move"} cannot choose a target target=server-forced`, playerMessage: "这个招式不能手动选择目标。"}
      : null;
  }
  const targetType = showdownNormalizeMoveTargetV4(move.target);
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
