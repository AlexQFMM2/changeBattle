import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import type {
  ShowdownPlaybackGroupV4,
  ShowdownPlaybackSceneCallKindV4,
  ShowdownPlaybackSceneCallV4,
  ShowdownPlaybackTimelineV4,
  ShowdownPlaybackWaitModeV4,
} from "./types.js";

const COMPILER_VERSION = "showdown-client-playback-v2";
const SHOWDOWN_CLIENT_SCRIPT_ORDER = [
  "battle-dex-data.js",
  "battle-dex.js",
  "battle-text-parser.js",
  "battle-log.js",
  "battle-animations.js",
  "battle-animations-moves.js",
  "battle-scene-stub.js",
  "battle-teams.js",
  "battle.js",
];
const PLAYBACK_SIGNAL_METHODS = new Set([
  "message",
  "animSummon",
  "animUnsummon",
  "animDragIn",
  "animDragOut",
  "runMoveAnim",
  "runOtherAnim",
  "runPrepareAnim",
  "runResidualAnim",
  "runStatusAnim",
  "damageAnim",
  "healAnim",
  "animFaint",
  "resultAnim",
  "abilityActivateAnim",
  "updateStatbar",
  "updateWeather",
  "incrementTurn",
  "finishAnimations",
]);

type ShowdownVmContextV4 = Record<string, any> & {
  Battle?: new (options: {log: string[]; paused?: boolean; isReplay?: boolean; debug?: boolean}) => ShowdownClientBattleLikeV4;
  BattleSceneStub?: new (...args: unknown[]) => unknown;
  __changeBattlePlaybackRawStep?: number | null;
};

type ShowdownClientBattleLikeV4 = {
  currentStep?: number;
  atQueueEnd?: boolean;
  turn?: number;
  shouldStep(): boolean;
  nextStep(): void;
  scene?: {battle?: ShowdownClientBattleLikeV4};
};

type CapturedSceneCallV4 = {
  method: string;
  rawStep: number | null;
  turn: number | null;
  args: unknown[];
};

export function compileShowdownPlaybackTimelineFromRawLog(
  rawLog: readonly string[],
  options: {sessionId?: string; previousIndex?: number} = {},
): ShowdownPlaybackTimelineV4 {
  const startedAt = Date.now();
  const normalizedRawLog = rawLog.map(line => String(line || ""));
  const context = getShowdownClientContext();
  const calls: CapturedSceneCallV4[] = [];
  patchSceneProbe(context, calls);
  if (!context.Battle) throw new Error("Showdown client Battle constructor unavailable.");
  const battle = new context.Battle({log: normalizedRawLog, paused: false, isReplay: true, debug: true});
  if (battle.scene) battle.scene.battle = battle;
  let guard = 0;
  while (battle.shouldStep() && guard < 2000) {
    guard += 1;
    battle.nextStep();
  }
  if (guard >= 2000) throw new Error("Showdown playback compiler exceeded step guard.");
  const allCalls = calls.filter(call => PLAYBACK_SIGNAL_METHODS.has(call.method)).map((call, index) => normalizeSceneCall(call, index, normalizedRawLog));
  const allGroups = mergeProtocolStateGroups(
    assignRawIndicesToGroups(groupShowdownCalls(allCalls, normalizedRawLog), normalizedRawLog),
    normalizedRawLog,
  );
  const previousIndex = clampPreviousIndex(options.previousIndex, normalizedRawLog.length);
  const groups = filterGroupsByPreviousIndex(allGroups, previousIndex).map((group, index) => ({...group, index, id: `sd-${index}-${group.rawIndices.join("-") || "scene"}`}));
  return {
    sessionId: options.sessionId,
    rawFrom: previousIndex,
    rawTo: normalizedRawLog.length,
    rawLogLength: normalizedRawLog.length,
    groups,
    debug: {
      calls: allCalls,
      compilerElapsedMs: Date.now() - startedAt,
      guard,
      currentStep: typeof battle.currentStep === "number" ? battle.currentStep : null,
      atQueueEnd: Boolean(battle.atQueueEnd),
    },
    compilerVersion: COMPILER_VERSION,
  };
}

function getShowdownClientContext(): ShowdownVmContextV4 {
  const context = createShowdownVmContext();
  for (const fileName of SHOWDOWN_CLIENT_SCRIPT_ORDER) {
    loadShowdownClientScript(context, fileName);
  }
  return context;
}

function createShowdownVmContext(): ShowdownVmContextV4 {
  const context: ShowdownVmContextV4 = {console, setTimeout, clearTimeout, process};
  context.global = context;
  context.window = context;
  context.Config = {
    whitelist: [],
    routes: {
      client: "play.pokemonshowdown.com",
      dex: "dex.pokemonshowdown.com",
      replays: "replay.pokemonshowdown.com",
    },
  };
  context.BattleSound = {
    setMute() {},
    loadBgm() {},
    playBgm() {},
    stopBgm() {},
    playEffect() {},
  };
  context.document = {
    createElement: () => ({
      style: {},
      appendChild() {},
      removeChild() {},
      classList: {add() {}, remove() {}},
      innerHTML: "",
      textContent: "",
      setAttribute() {},
      getAttribute() { return ""; },
    }),
  };
  context.navigator = {userAgent: "node"};
  context.localStorage = {getItem() { return null; }, setItem() {}, removeItem() {}};
  context.$ = function jqueryStub() {
    return {
      length: 0,
      width() { return 1000; },
      height() { return 600; },
      on() { return this; },
      off() { return this; },
      append() { return this; },
      appendTo() { return this; },
      empty() { return this; },
      css() { return this; },
      children() { return this; },
      last() { return this; },
      delay() { return this; },
      animate() { return this; },
      promise() {
        return {
          then(callback?: () => void) { if (callback) callback(); },
          done(callback?: () => void) { if (callback) callback(); },
        };
      },
      add() { return this; },
      remove() { return this; },
      html() { return this; },
      text() { return this; },
      find() { return this; },
      attr() { return this; },
    };
  };
  context.$.fx = {off: true};
  context.$.easing = {};
  return context;
}

function loadShowdownClientScript(context: ShowdownVmContextV4, fileName: string): void {
  const scriptPath = path.join(showdownClientJsDir(), fileName);
  const source = fs.readFileSync(scriptPath, "utf8");
  vm.runInNewContext(source, context, {filename: scriptPath});
}

function showdownClientJsDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = showdownClientJsDirCandidates(currentDir);
  const found = candidates.find(candidate => fs.existsSync(path.join(candidate, "battle.js")));
  if (!found) throw new Error(`Showdown client playback vendor 未找到。已检查：${candidates.join(", ")}`);
  return found;
}

function showdownClientJsDirCandidates(currentDir: string): string[] {
  const candidates: string[] = [];
  addShowdownClientCandidate(candidates, process.env.CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT);
  addShowdownClientCandidate(candidates, process.env.CHANGEBATTLE_PROJECT_ROOT && path.join(process.env.CHANGEBATTLE_PROJECT_ROOT, "packages", "showdown-battle-core", "vendor", "showdown-client", "js"));
  addShowdownClientCandidate(candidates, path.resolve(currentDir, "../vendor/showdown-client/js"));
  addShowdownClientCandidate(candidates, path.resolve(currentDir, "../dist/vendor/showdown-client/js"));
  for (const root of parentDirectories(currentDir)) {
    addShowdownClientCandidate(candidates, path.join(root, "packages", "showdown-battle-core", "vendor", "showdown-client", "js"));
    addShowdownClientCandidate(candidates, path.join(root, "vendor", "showdown-client", "js"));
  }
  for (const root of parentDirectories(process.cwd())) {
    addShowdownClientCandidate(candidates, path.join(root, "packages", "showdown-battle-core", "vendor", "showdown-client", "js"));
    addShowdownClientCandidate(candidates, path.join(root, "vendor", "showdown-client", "js"));
  }
  return candidates;
}

function addShowdownClientCandidate(candidates: string[], candidate: string | undefined | false): void {
  if (!candidate) return;
  const resolved = path.resolve(candidate);
  if (!candidates.includes(resolved)) candidates.push(resolved);
}

function parentDirectories(start: string): string[] {
  const roots: string[] = [];
  let current = path.resolve(start);
  while (true) {
    roots.push(current);
    const parent = path.dirname(current);
    if (parent === current) return roots;
    current = parent;
  }
}

function patchSceneProbe(context: ShowdownVmContextV4, calls: CapturedSceneCallV4[]): void {
  patchBattleRunProbe(context);
  const sceneProto = context.BattleSceneStub?.prototype;
  if (!sceneProto) throw new Error("Showdown client BattleSceneStub unavailable.");
  for (const method of PLAYBACK_SIGNAL_METHODS) {
    const original = sceneProto[method];
    sceneProto[method] = function patchedSceneMethod(this: {battle?: ShowdownClientBattleLikeV4}, ...args: unknown[]) {
      calls.push({
        rawStep: typeof context.__changeBattlePlaybackRawStep === "number" ? context.__changeBattlePlaybackRawStep : typeof this.battle?.currentStep === "number" ? this.battle.currentStep : null,
        turn: typeof this.battle?.turn === "number" ? this.battle.turn : null,
        method,
        args: args.map(formatShowdownArg),
      });
      return original && original.apply(this, args);
    };
  }
}

function patchBattleRunProbe(context: ShowdownVmContextV4): void {
  const battleProto = context.Battle?.prototype;
  if (!battleProto?.run) throw new Error("Showdown client Battle.run unavailable.");
  const originalRun = battleProto.run;
  battleProto.run = function patchedBattleRun(this: ShowdownClientBattleLikeV4 & {stepQueue?: string[]}, str: string, preempt?: boolean) {
    const previousRawStep = context.__changeBattlePlaybackRawStep ?? null;
    const currentStep = typeof this.currentStep === "number" ? this.currentStep : -1;
    const directMatch = currentStep >= 0 && this.stepQueue?.[currentStep] === str ? currentStep : -1;
    const rawStep = directMatch >= 0 ? directMatch : Array.isArray(this.stepQueue) ? this.stepQueue.indexOf(str) : -1;
    context.__changeBattlePlaybackRawStep = rawStep >= 0 ? rawStep : null;
    try {
      return originalRun.call(this, str, preempt);
    } finally {
      context.__changeBattlePlaybackRawStep = previousRawStep;
    }
  };
}

function formatShowdownArg(arg: unknown): unknown {
  if (arg && typeof arg === "object" && "ident" in arg && "name" in arg) return pokemonLabel(arg as {ident?: string; name?: string});
  if (Array.isArray(arg)) return arg.map(item => item && typeof item === "object" && "ident" in item ? pokemonLabel(item as {ident?: string; name?: string}) : item);
  return arg;
}

function pokemonLabel(pokemon: {ident?: string; name?: string} | null): string {
  return pokemon ? (pokemon.ident || pokemon.name || "") : "";
}

function normalizeSceneCall(call: CapturedSceneCallV4, index: number, rawLog: string[]): ShowdownPlaybackSceneCallV4 {
  const rawIndex = rawIndexForStep(rawLog, call.rawStep);
  const kind = sceneCallKind(call.method);
  const normalized: ShowdownPlaybackSceneCallV4 = {
    id: `call-${index}`,
    kind,
    method: call.method,
    rawStep: call.rawStep,
    turn: call.turn,
    args: call.args,
    label: sceneCallLabel(call.method, call.args),
    rawIndex,
    rawLine: rawIndex >= 0 ? rawLog[rawIndex] : undefined,
  };
  enrichSceneCall(normalized);
  return normalized;
}

function rawIndexForStep(rawLog: string[], rawStep: number | null): number {
  if (rawStep === null) return -1;
  if (rawStep >= 0 && rawStep < rawLog.length) return rawStep;
  return -1;
}

function sceneCallKind(method: string): ShowdownPlaybackSceneCallKindV4 {
  switch (method) {
  case "animSummon": return "switch";
  case "animUnsummon": return "switchOut";
  case "animDragIn": return "dragIn";
  case "animDragOut": return "dragOut";
  case "runMoveAnim": return "move";
  case "runOtherAnim": return "otherAnim";
  case "runPrepareAnim": return "prepare";
  case "runResidualAnim": return "residual";
  case "runStatusAnim": return "status";
  case "damageAnim": return "damage";
  case "healAnim": return "heal";
  case "animFaint": return "faint";
  case "resultAnim": return "result";
  case "abilityActivateAnim": return "ability";
  case "updateWeather": return "weatherUpdate";
  case "incrementTurn": return "turn";
  case "updateStatbar": return "statbar";
  case "message": return "message";
  default: return "scene";
  }
}

function mergeProtocolStateGroups(groups: ShowdownPlaybackGroupV4[], rawLog: string[]): ShowdownPlaybackGroupV4[] {
  const covered = new Set(groups.flatMap(group => group.rawIndices));
  const protocolGroups = rawLog
    .map((rawLine, rawIndex) => ({rawLine, rawIndex, call: protocolSceneCallForRawLine(rawLine, rawIndex)}))
    .filter((entry): entry is {rawLine: string; rawIndex: number; call: ShowdownPlaybackSceneCallV4} => Boolean(entry.call));
  const protocolCallsByRawIndex = new Map<number, ShowdownPlaybackSceneCallV4[]>();
  for (const entry of protocolGroups) {
    if (!covered.has(entry.rawIndex)) continue;
    const calls = protocolCallsByRawIndex.get(entry.rawIndex) || [];
    calls.push(entry.call);
    protocolCallsByRawIndex.set(entry.rawIndex, calls);
  }
  const mergedGroups = groups.map(group => {
    const protocolCalls = group.rawIndices.flatMap(index => protocolCallsByRawIndex.get(index) || []);
    if (!protocolCalls.length) return group;
    const calls = [...protocolCalls, ...group.calls.filter(call => !protocolCalls.some(protocolCall => protocolCall.kind === call.kind && protocolCall.rawIndex === call.rawIndex && protocolCall.effect === call.effect))];
    return {
      ...group,
      calls,
      waitMode: waitModeForGroup(calls),
      summary: calls.map(call => call.label).filter(Boolean).join(" -> "),
    };
  });
  const additions = protocolGroups
    .filter(entry => !covered.has(entry.rawIndex))
    .map(entry => playbackGroupForProtocolState(entry.call, entry.rawLine, entry.rawIndex));
  if (!additions.length) return mergedGroups;
  return [...mergedGroups, ...additions]
    .sort((a, b) => groupSortIndex(a) - groupSortIndex(b))
    .map((group, index) => ({...group, index, id: `sd-${index}-${group.rawIndices.join("-") || "scene"}`}));
}

function protocolSceneCallForRawLine(rawLine: string, rawIndex: number): ShowdownPlaybackSceneCallV4 | null {
  return transformSceneCallForRawLine(rawLine, rawIndex) || persistentFieldSceneCallForRawLine(rawLine, rawIndex);
}

function transformSceneCallForRawLine(rawLine: string, rawIndex: number): ShowdownPlaybackSceneCallV4 | null {
  const args = protocolArgs(rawLine);
  const command = args[0] || "";
  if (!isTransformProtocolCommand(args)) return null;
  const pokemon = transformPokemonArg(args);
  const effect = transformEffectId(args);
  return {
    id: `call-protocol-transform-${rawIndex}`,
    kind: "transform",
    method: "protocolTransform",
    rawStep: rawIndex,
    turn: null,
    args,
    label: `transform ${effect || command} ${pokemon || ""}`.trim(),
    rawIndex,
    rawLine,
    pokemon,
    target: command === "-transform" ? args[2] || "" : pokemon,
    effect,
  };
}

function persistentFieldSceneCallForRawLine(rawLine: string, rawIndex: number): ShowdownPlaybackSceneCallV4 | null {
  const args = protocolArgs(rawLine);
  const command = args[0] || "";
  if (command !== "-weather" && command !== "-fieldstart" && command !== "-fieldend") return null;
  const effect = command === "-weather" ? toId(args[1] || "") : toId(cleanEffect(args[1] || ""));
  return {
    id: `call-protocol-field-${rawIndex}`,
    kind: "weatherUpdate",
    method: command === "-weather" ? "protocolWeather" : "protocolField",
    rawStep: rawIndex,
    turn: null,
    args,
    label: `${command === "-weather" ? "weather" : "field"} ${effect || command}`.trim(),
    rawIndex,
    rawLine,
    effect,
  };
}

function playbackGroupForProtocolState(call: ShowdownPlaybackSceneCallV4, rawLine: string, rawIndex: number): ShowdownPlaybackGroupV4 {
  return {
    id: `sd-protocol-${rawIndex}`,
    index: rawIndex,
    turn: call.turn,
    rawIndices: [rawIndex],
    rawLines: [rawLine],
    calls: [call],
    waitMode: "wait",
    summary: call.label,
    finishStep: null,
  };
}

function groupSortIndex(group: ShowdownPlaybackGroupV4): number {
  return group.rawIndices[0] ?? Number.MAX_SAFE_INTEGER;
}

function isTransformProtocolCommand(args: string[]): boolean {
  const command = args[0] || "";
  if (command === "detailschange" || command === "-formechange" || command === "-transform") return true;
  if (command === "-zpower" || command === "-mega" || command === "-primal" || command === "-burst" || command === "-terastallize") return true;
  if (command === "-start" || command === "-end") return toId(args[2] || "") === "dynamax";
  if (command === "custom") return toId(args[1] || "") === "endterastallize";
  return false;
}

function transformPokemonArg(args: string[]): string {
  if (args[0] === "custom" && toId(args[1] || "") === "endterastallize") return args[2] || "";
  return args[1] || "";
}

function transformEffectId(args: string[]): string {
  const command = args[0] || "";
  if (command === "-start" || command === "-end") return toId(args[2] || "");
  if (command === "custom" && toId(args[1] || "") === "endterastallize") return "terastallize";
  if (command === "detailschange" || command === "-formechange") return toId(args[2] || "");
  if (command === "-transform") return "transform";
  return toId(command.replace(/^-/, ""));
}

function enrichSceneCall(call: ShowdownPlaybackSceneCallV4): void {
  if (call.kind === "switch" || call.kind === "switchOut" || call.kind === "dragIn" || call.kind === "dragOut" || call.kind === "damage" || call.kind === "heal" || call.kind === "faint" || call.kind === "statbar") {
    call.pokemon = String(call.args[0] || "");
  }
  if (call.kind === "move" || call.kind === "prepare" || call.kind === "residual" || call.kind === "status" || call.kind === "otherAnim") {
    call.effect = String(call.args[0] || "");
    if (call.kind === "move") call.move = String(call.args[0] || "");
    if (call.args[1]) call.pokemon = String(call.args[1] || "");
    if (call.args[2]) call.target = String(call.args[2] || "");
  }
  if (call.kind === "result") {
    call.pokemon = String(call.args[0] || "");
    call.result = String(call.args[1] || "");
  }
  if (call.kind === "ability") {
    call.pokemon = String(call.args[0] || "");
    call.effect = String(call.args[1] || "");
  }
  if (call.kind === "damage" || call.kind === "heal") call.value = String(call.args[1] || "");
}

function groupShowdownCalls(calls: ShowdownPlaybackSceneCallV4[], rawLog: string[]): ShowdownPlaybackGroupV4[] {
  const groups: ShowdownPlaybackGroupV4[] = [];
  let current: ShowdownPlaybackSceneCallV4[] = [];
  for (const call of calls) {
    if (call.method === "finishAnimations") {
      pushPlaybackGroup(groups, current, call, rawLog);
      current = [];
      continue;
    }
    current.push(call);
  }
  pushPlaybackGroup(groups, current, null, rawLog);
  return groups;
}

function assignRawIndicesToGroups(groups: ShowdownPlaybackGroupV4[], rawLog: string[]): ShowdownPlaybackGroupV4[] {
  let cursor = 0;
  return groups.map(group => {
    const rawIndices: number[] = [];
    for (const call of group.calls) {
      const existingRawIndex = typeof call.rawIndex === "number" && call.rawIndex >= 0 ? call.rawIndex : -1;
      const matched = existingRawIndex >= 0 ? existingRawIndex : findRawIndexForCall(call, rawLog, cursor);
      if (matched < 0) continue;
      rawIndices.push(matched);
      call.rawIndex = matched;
      call.rawLine = rawLog[matched];
      if (existingRawIndex < 0) cursor = Math.max(cursor, matched + 1);
    }
    const uniqueRawIndices = [...new Set(rawIndices)].sort((a, b) => a - b);
    return {
      ...group,
      rawIndices: uniqueRawIndices,
      rawLines: uniqueRawIndices.map(index => rawLog[index] || ""),
    };
  });
}

function findRawIndexForCall(call: ShowdownPlaybackSceneCallV4, rawLog: string[], fromIndex: number): number {
  const predicates = rawPredicatesForCall(call);
  if (!predicates.length) return -1;
  for (const predicate of predicates) {
    for (let index = fromIndex; index < rawLog.length; index += 1) {
      if (predicate(rawLog[index] || "")) return index;
    }
  }
  return -1;
}

function rawPredicatesForCall(call: ShowdownPlaybackSceneCallV4): Array<(line: string) => boolean> {
  switch (call.kind) {
  case "switch":
  case "dragIn":
    return [line => rawCommand(line) === (call.kind === "dragIn" ? "drag" : "switch") && rawLineMatchesPokemon(line, call.pokemon)];
  case "switchOut":
  case "dragOut":
    return [line => rawCommand(line) === "replace" && rawLineMatchesPokemon(line, call.pokemon)];
  case "turn":
    return [line => rawCommand(line) === "turn"];
  case "move":
    return [line => rawCommand(line) === "move" && rawLineMatchesMove(line, call.move || call.effect)];
  case "result":
    return resultRawPredicates(call.result || "");
  case "damage":
    return [line => rawCommand(line) === "-damage" && rawLineMatchesPokemon(line, call.pokemon)];
  case "heal":
    return [line => rawCommand(line) === "-heal" && rawLineMatchesPokemon(line, call.pokemon)];
  case "faint":
    return [line => rawCommand(line) === "faint" && rawLineMatchesPokemon(line, call.pokemon)];
  case "otherAnim":
    if (call.effect === "consume") return [line => rawCommand(line) === "-enditem" && line.includes("[eat]")];
    if (call.effect === "heal") return [line => rawCommand(line) === "-heal"];
    return [line => rawCommand(line).startsWith("-") && line.toLowerCase().includes(toId(call.effect || ""))];
  case "status":
    return [line => rawCommand(line) === "-status" || rawCommand(line) === "-curestatus" || rawCommand(line) === "cant"];
  case "ability":
    return [line => rawCommand(line) === "-ability" || rawCommand(line) === "-activate"];
  case "transform":
    return [line => isTransformProtocolCommand(protocolArgs(line)) && rawLineMatchesPokemon(line, call.pokemon)];
  case "weatherUpdate":
  case "statbar":
    return [line => rawCommand(line) === "upkeep"];
  default:
    return [];
  }
}

function resultRawPredicates(result: string): Array<(line: string) => boolean> {
  const id = toId(result);
  if (id.includes("critical")) return [line => rawCommand(line) === "-crit"];
  if (id.includes("supereffective")) return [line => rawCommand(line) === "-supereffective"];
  if (id.includes("resisted")) return [line => rawCommand(line) === "-resisted"];
  if (id.includes("immune")) return [line => rawCommand(line) === "-immune"];
  if (id.includes("miss")) return [line => rawCommand(line) === "-miss"];
  if (id.includes("failed")) return [line => rawCommand(line) === "-fail"];
  return [line => rawCommand(line).startsWith("-") && line.toLowerCase().includes(id)];
}

function rawCommand(line: string): string {
  if (!line.startsWith("|")) return "";
  const nextPipe = line.indexOf("|", 1);
  return nextPipe >= 0 ? line.slice(1, nextPipe) : line.slice(1);
}

function protocolArgs(line: string): string[] {
  if (!line.startsWith("|")) return ["", line];
  if (line === "|") return ["done"];
  return line.slice(1).split("|");
}

function cleanEffect(value: string): string {
  return String(value || "").replace(/^move:\s*/i, "").replace(/^item:\s*/i, "").replace(/^ability:\s*/i, "");
}

function rawLineMatchesPokemon(line: string, pokemon: string | undefined): boolean {
  const wanted = pokemonNameId(pokemon || "");
  if (!wanted) return true;
  return line.split("|").some(part => pokemonNameId(part) === wanted || toId(part).includes(wanted));
}

function rawLineMatchesMove(line: string, move: string | undefined): boolean {
  const wanted = toId(move || "");
  if (!wanted) return true;
  return line.split("|").some(part => toId(part) === wanted);
}

function pokemonNameId(value: string): string {
  return toId(String(value || "").split(":").pop() || value);
}

function toId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pushPlaybackGroup(
  groups: ShowdownPlaybackGroupV4[],
  calls: ShowdownPlaybackSceneCallV4[],
  finishCall: ShowdownPlaybackSceneCallV4 | null,
  rawLog: string[],
): void {
  const visibleCalls = calls.filter(call => shouldKeepSceneCall(call, calls));
  if (!visibleCalls.length) return;
  const rawIndices = [...new Set(visibleCalls.map(call => call.rawIndex ?? -1).filter(index => index >= 0))].sort((a, b) => a - b);
  const index = groups.length;
  groups.push({
    id: `sd-${index}-${rawIndices.join("-") || "scene"}`,
    index,
    turn: visibleCalls.find(call => typeof call.turn === "number")?.turn ?? null,
    rawIndices,
    rawLines: rawIndices.map(index => rawLog[index] || ""),
    calls: visibleCalls,
    waitMode: waitModeForGroup(visibleCalls),
    summary: visibleCalls.map(call => call.label).filter(Boolean).join(" -> "),
    finishStep: finishCall?.rawStep ?? null,
  });
}

function shouldKeepSceneCall(call: ShowdownPlaybackSceneCallV4, groupCalls: ShowdownPlaybackSceneCallV4[]): boolean {
  if ((call.method === "updateStatbar" || call.method === "updateWeather") && !call.pokemon && groupCalls.every(entry => entry.method === "updateStatbar" || entry.method === "updateWeather")) {
    return false;
  }
  if (call.method !== "updateStatbar" && call.method !== "updateWeather") return true;
  return groupCalls.every(entry => entry.method === "updateStatbar" || entry.method === "updateWeather");
}

function waitModeForGroup(calls: ShowdownPlaybackSceneCallV4[]): ShowdownPlaybackWaitModeV4 {
  if (calls.every(call => call.kind === "turn" || call.kind === "weatherUpdate" || call.kind === "statbar")) return "immediate";
  if (calls.every(call => call.kind === "result")) return "simult";
  return "wait";
}

function filterGroupsByPreviousIndex(groups: ShowdownPlaybackGroupV4[], previousIndex: number): ShowdownPlaybackGroupV4[] {
  return groups.filter(group => {
    if (!group.rawIndices.length) return previousIndex === 0;
    return group.rawIndices.some(index => index >= previousIndex);
  });
}

function sceneCallLabel(method: string, args: unknown[]): string {
  switch (method) {
  case "animSummon":
    return `switch ${args[0] || ""}`;
  case "animUnsummon":
    return `switch-out ${args[0] || ""}`;
  case "animDragIn":
    return `drag-in ${args[0] || ""}`;
  case "animDragOut":
    return `drag-out ${args[0] || ""}`;
  case "runMoveAnim":
    return `move ${args[0] || ""}`;
  case "runOtherAnim":
    return `other ${args[0] || ""}`;
  case "runStatusAnim":
    return `status ${args[0] || ""}`;
  case "runPrepareAnim":
    return `prepare ${args[0] || ""}`;
  case "runResidualAnim":
    return `residual ${args[0] || ""}`;
  case "damageAnim":
    return `damage ${args[0] || ""} ${args[1] || ""}`;
  case "healAnim":
    return `heal ${args[0] || ""} ${args[1] || ""}`;
  case "animFaint":
    return `faint ${args[0] || ""}`;
  case "resultAnim":
    return `result ${args[1] || ""}`;
  case "abilityActivateAnim":
    return `ability ${args[1] || ""}`;
  case "incrementTurn":
    return "turn";
  case "updateWeather":
    return "weather/update";
  case "updateStatbar":
    return `statbar ${args[0] || ""}`;
  case "message":
    return `message ${String(args[0] || "").slice(0, 80)}`;
  default:
    return method;
  }
}

function clampPreviousIndex(previousIndex: number | undefined, rawLogLength: number): number {
  if (!Number.isFinite(previousIndex)) return 0;
  return Math.max(0, Math.min(rawLogLength, Math.floor(Number(previousIndex))));
}
