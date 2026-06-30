import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";
import type {
  BattleServiceApiV4,
  BattleServiceCreateInputV4,
  BattleServicePlayerIdV4,
  BattleServicePlayerInputV4,
  BattleServicePokemonSetV4,
  BattleServiceRequestV4,
  BattleServiceSessionInputV4,
  BattleServiceSnapshotV4,
  BattleServiceSubmitChoiceInputV4,
  BattleServiceSubmitTrainerItemInputV4,
  BattleAiDecisionDebugV4,
  ShowdownIdPoolStateV4,
  ShowdownTeamPokemonMappingV4,
  ShowdownPlayerIdV4,
  LocalPokemonLikeForBattleV4,
} from "./types.js";
import type {TrainingPlayerDraftV4, TrainingRunGameNodeV4} from "./types.js";
import {filterShowdownChoiceForRuleSetV4, showdownSpecialSystemAllowedForRuleSetV4} from "./showdownCommand.js";
import {battleAiRequestKeyV4, chooseAiBattleChoiceV4, fallbackLegalChoiceV4, normalizeBattleAiProfileV4, type BattleAiChoiceResultV4} from "./ai.js";

export * from "./showdownCommand.js";
export * from "./ai.js";
export * from "./teamGenerator.js";
export * from "./battleProfiles.js";

const require = createRequire(import.meta.url);
const vendorRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../vendor/showdown");
const showdown = require(path.join(vendorRoot, "sim/index.js")) as {
  BattleStream: new (options?: {keepAlive?: boolean; debug?: boolean}) => BattleStreamLike;
  Teams: {pack(team: BattleServicePokemonSetV4[]): string};
  getPlayerStreams(stream: BattleStreamLike): PlayerStreamsLike;
};

type StreamLike = {
  write(chunk: string): Promise<void> | void;
  [Symbol.asyncIterator](): AsyncIterableIterator<string>;
};

type BattleStreamLike = StreamLike;

type PlayerStreamsLike = Record<"omniscient" | ShowdownPlayerIdV4, StreamLike>;

type RuntimeSession = {
  id: string;
  stream: BattleStreamLike;
  streams: PlayerStreamsLike;
  snapshot: BattleServiceSnapshotV4;
  lastRequests: Partial<Record<ShowdownPlayerIdV4, BattleServiceRequestV4>>;
  invalidChoiceStreaks: Partial<Record<ShowdownPlayerIdV4, {requestKey: string; count: number}>>;
  aiTasks: Partial<Record<ShowdownPlayerIdV4, RuntimeAiTask>>;
  closed: boolean;
};

type RuntimeAiTask = {
  requestKey: string;
  startedAt: number;
  deadlineAt: number;
  done: boolean;
  result?: BattleAiChoiceResultV4;
  promise: Promise<void>;
};

type TrainerItemRuntimeAction = {
  activeIndex: number;
  itemInstanceId: string;
  targetKey: string;
};

type RecoveryEffect = {
  hp?: {kind: "fixed"; amount: number} | {kind: "full"} | {kind: "fraction"; numerator: number; denominator: number};
  revive?: "half" | "full";
  pp?: {scope: "one" | "all"; amount?: number; full?: boolean};
  cureStatus?: "all" | string[];
};

const sessions = new Map<string, RuntimeSession>();
const AI_THINK_TIME_MS = 10_000;
const SHOWDOWN_ID_POOL_V4 = [
  "pokeball",
  "greatball",
  "ultraball",
  "masterball",
  "premierball",
  "luxuryball",
  "duskball",
  "healball",
  "quickball",
  "timerball",
  "repeatball",
  "netball",
  "nestball",
  "diveball",
  "cherishball",
  "fastball",
  "friendball",
  "heavyball",
  "levelball",
  "loveball",
  "lureball",
  "moonball",
  "dreamball",
  "beastball",
] as const;

const RECOVERY_EFFECTS: Record<string, RecoveryEffect> = {
  potion: {hp: {kind: "fixed", amount: 20}},
  superpotion: {hp: {kind: "fixed", amount: 60}},
  hyperpotion: {hp: {kind: "fixed", amount: 120}},
  maxpotion: {hp: {kind: "full"}},
  fullrestore: {hp: {kind: "full"}, cureStatus: "all"},
  freshwater: {hp: {kind: "fixed", amount: 30}},
  sodapop: {hp: {kind: "fixed", amount: 50}},
  lemonade: {hp: {kind: "fixed", amount: 70}},
  moomoomilk: {hp: {kind: "fixed", amount: 100}},
  fullheal: {cureStatus: "all"},
  healpowder: {cureStatus: "all"},
  antidote: {cureStatus: ["psn", "tox"]},
  burnheal: {cureStatus: ["brn"]},
  iceheal: {cureStatus: ["frz"]},
  awakening: {cureStatus: ["slp"]},
  paralyzeheal: {cureStatus: ["par"]},
  energypowder: {hp: {kind: "fixed", amount: 60}},
  energyroot: {hp: {kind: "fixed", amount: 120}},
  revive: {revive: "half"},
  maxrevive: {revive: "full"},
  revivalherb: {revive: "full"},
  ether: {pp: {scope: "one", amount: 10}},
  maxether: {pp: {scope: "one", full: true}},
  elixir: {pp: {scope: "all", amount: 10}},
  maxelixir: {pp: {scope: "all", full: true}},
  oranberry: {hp: {kind: "fixed", amount: 10}},
  sitrusberry: {hp: {kind: "fraction", numerator: 1, denominator: 4}},
  leppaberry: {pp: {scope: "one", amount: 10}},
  lumberry: {cureStatus: "all"},
};

export function compileBattleSessionInput(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): BattleServiceSessionInputV4 {
  if ("nodeId" in input) return input;
  const nodePlayers = input.node.participants || {};
  const showdownIdPool = createShowdownIdPoolState();
  const usedShowdownIdentityTokens = new Set(showdownIdPool.used);
  const players = playerIdsForNode(input.node)
    .map(playerId => nodePlayers[playerId] || input.players[playerId])
    .filter(Boolean)
    .map(player => compilePlayer(player!, usedShowdownIdentityTokens, showdownIdPool));
  return {
    runId: input.runId,
    nodeId: input.node.id,
    mode: input.node.mode,
    ruleSet: input.node.ruleSet,
    seed: input.node.seed,
    players,
    showdownIdPool,
  };
}

export function createInMemoryBattleService(): BattleServiceApiV4 {
  return {
    async createBattleSession(input) {
      return createBattleSession(input);
    },
    async submitChoice(input) {
      return submitChoice(input);
    },
    async submitTrainerItem(input) {
      return submitTrainerItem(input);
    },
    async getSnapshot(sessionId) {
      return getSnapshot(sessionId);
    },
    async closeSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.closed = true;
        session.aiTasks = {};
        sessions.delete(sessionId);
      }
    },
  };
}

export async function createBattleSession(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): Promise<BattleServiceSnapshotV4> {
  const compiled = compileBattleSessionInput(input);
  const id = createId("battle-session");
  const stream = new showdown.BattleStream({keepAlive: true, debug: true});
  const streams = showdown.getPlayerStreams(stream);
  const now = new Date().toISOString();
  const session: RuntimeSession = {
    id,
    stream,
    streams,
    closed: false,
    lastRequests: {},
    invalidChoiceStreaks: {},
    aiTasks: {},
    snapshot: {
      id,
      runId: compiled.runId,
      nodeId: compiled.nodeId,
      status: "creating",
      mode: compiled.mode,
      ruleSet: compiled.ruleSet,
      turn: 0,
      winner: null,
      error: null,
      players: compiled.players,
      showdownIdPool: compiled.showdownIdPool,
      requests: {},
      active: [],
      rawLog: [],
      debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, aiDecisions: []},
      createdAt: now,
      updatedAt: now,
    },
  };
  sessions.set(id, session);
  attachReaders(session);
  const startInput = buildStartInput(compiled);
  session.snapshot.debug.inputLog.push(startInput);
  await streams.omniscient.write(startInput);
  session.snapshot.status = "running";
  touch(session);
  await applyInitialPokemonState(session, compiled);
  await waitForRequests(session, 900);
  await submitTeamPreviewChoices(session);
  await submitAiChoices(session);
  return clone(session.snapshot);
}

export async function submitChoice(input: BattleServiceSubmitChoiceInputV4): Promise<BattleServiceSnapshotV4> {
  const session = getSession(input.sessionId);
  if (session.snapshot.status === "ended") return clone(session.snapshot);
  const choice = sanitizeChoiceForRuleSet(input.choice.trim(), session.snapshot.ruleSet, session.snapshot.mode);
  if (!choice) throw new Error("choice 不能为空。");
  if (choice !== input.choice.trim()) {
    session.snapshot.debug.inputLog.push(`[BattleV4][ruleset-special-filter] ${session.snapshot.ruleSet} sanitized choice: ${input.choice.trim()} -> ${choice}`);
  }
  if (choice === "forfeit") {
    session.snapshot.debug.inputLog.push(`>forcelose ${input.playerId}`);
    await session.streams.omniscient.write(`>forcelose ${input.playerId}`);
  } else {
    await writePlayerChoice(session, input.playerId, choice, "human");
  }
  touch(session);
  await waitForRequests(session, 700);
  await submitTeamPreviewChoices(session);
  await submitAiChoices(session);
  await waitForRequests(session, 700);
  return clone(session.snapshot);
}

export async function submitTrainerItem(input: BattleServiceSubmitTrainerItemInputV4): Promise<BattleServiceSnapshotV4> {
  const session = getSession(input.sessionId);
  if (session.snapshot.status === "ended") return clone(session.snapshot);
  const choice = sanitizeChoiceForRuleSet(input.choice.trim(), session.snapshot.ruleSet, session.snapshot.mode);
  if (!choice) throw new Error("choice 不能为空。");
  const trainerItems = input.trainerItems || [];
  if (!trainerItems.length) throw new Error("战斗道具指令无效。");
  const battle = (session.stream as any).battle;
  const side = battleSide(session, input.playerId);
  if (!battle || !side) throw new Error("当前对战尚未开始。");
  const request = session.snapshot.requests[input.playerId];
  if (!request || request.wait) throw new Error("现在不能使用道具。");
  if (request.forceSwitch?.some(Boolean)) throw new Error("当前必须换人，不能使用战斗道具。");
  if (!request.active?.length) throw new Error("当前不是出招阶段，不能使用战斗道具。");
  installTrainerItemRunAction(session);
  const actions = trainerItems.map(action => buildTrainerItemAction(session, input.playerId, action));
  side.clearChoice();
  let accepted = side.choose(choice);
  if (!accepted && choice.split(",").some(part => part.trim() === "pass")) {
    const fallbackChoice = choice.split(",").map((part, index) => part.trim() === "pass" && actions.some(action => action.requestActiveIndex === index) ? "move 1" : part.trim()).join(", ");
    side.clearChoice();
    accepted = side.choose(fallbackChoice);
    if (accepted) session.snapshot.debug.inputLog.push(`[BattleV4][trainer-item-placeholder] ${choice} -> ${fallbackChoice}`);
  }
  if (!accepted) throw new Error(side.choice?.error || "战斗道具占位指令无效。");
  const sideActions = side.choice.actions || [];
  for (const trainerAction of actions) {
    const existingIndex = sideActions.findIndex((entry: any) => entry?.pokemon === trainerAction.pokemon);
    if (existingIndex >= 0) sideActions[existingIndex] = trainerAction;
    else sideActions.splice(Math.min(trainerAction.requestActiveIndex, sideActions.length), 0, trainerAction);
  }
  side.choice.actions = sideActions;
  session.snapshot.debug.lastChoices.push({playerId: input.playerId, choice: `[trainer-item] ${choice}`, at: new Date().toISOString()});
  session.snapshot.debug.inputLog.push(`>${input.playerId} ${choice} [trainer-item]`);
  if (battle.allChoicesDone()) {
    battle.commitChoices();
    battle.sendUpdates();
  }
  touch(session);
  await waitForRequests(session, 700);
  await submitTeamPreviewChoices(session);
  await submitAiChoices(session);
  await waitForRequests(session, 700);
  return clone(session.snapshot);
}

export async function getSnapshot(sessionId: string): Promise<BattleServiceSnapshotV4> {
  const session = getSession(sessionId);
  await flushReadyAutoChoices(session);
  return clone(session.snapshot);
}

export async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    session.closed = true;
    session.aiTasks = {};
    sessions.delete(sessionId);
  }
}

export function randomLegalChoice(request: BattleServiceRequestV4 | undefined): string {
  return fallbackLegalChoiceV4(request);
}

function fixedActiveRequests(request: BattleServiceRequestV4): NonNullable<BattleServiceRequestV4["active"]> {
  return (request.active || []).map((active, index) => sidePokemonCanCommand(request.side?.pokemon?.[index]) ? active : null);
}

function sidePokemonCanCommand(pokemon: NonNullable<BattleServiceRequestV4["side"]>["pokemon"][number] | undefined): boolean {
  if (!pokemon) return true;
  return !pokemon.fainted && !pokemon.commanding && !conditionIsFainted(pokemon.condition);
}

function conditionIsFainted(condition: string | undefined): boolean {
  return Boolean(condition?.includes("fnt") || /^\s*0(?:\D|$)/.test(condition || ""));
}

function defaultTargetSuffix(request: BattleServiceRequestV4, activeIndex: number, move: {id?: string; target?: string}, targetable: boolean): string {
  if (!targetable || !moveNeedsExplicitTarget(move.target)) return "";
  if (normalizeMoveTarget(move.id) === "recharge") return "";
  const target = normalizeMoveTarget(move.target);
  if (target === "adjacentally" || target === "adjacentallyorself") {
    const allyIndex = request.active?.findIndex((active, index) => index !== activeIndex && Boolean(active)) ?? -1;
    return allyIndex >= 0 ? ` -${allyIndex + 1}` : "";
  }
  const foeCount = Math.max(1, request.active?.length || 1);
  return ` +${Math.min(activeIndex + 1, foeCount)}`;
}

function moveNeedsExplicitTarget(target: string | undefined): boolean {
  if (!target) return false;
  const id = normalizeMoveTarget(target);
  return id === "normal" ||
    id === "any" ||
    id === "adjacentally" ||
    id === "adjacentallyorself" ||
    id === "adjacentfoe";
}

function normalizeMoveTarget(value: string | undefined): string {
  return String(value || "normal").replace(/[^a-z]/gi, "").toLowerCase() || "normal";
}

function legalSwitchChoice(request: BattleServiceRequestV4, reservedSwitches = new Set<number>()): string {
  const reservedActiveSlots = request.forceSwitch?.length || request.active?.length || 0;
  const candidates = (request.side?.pokemon || [])
    .map((pokemon, index) => ({pokemon, index}))
    .filter(entry => indexIsSwitchableBench(entry.index, reservedActiveSlots, entry.pokemon) && !reservedSwitches.has(entry.index + 1));
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  if (picked) reservedSwitches.add(picked.index + 1);
  return picked ? `switch ${picked.index + 1}` : "pass";
}

function indexIsSwitchableBench(index: number, reservedActiveSlots: number, pokemon: NonNullable<BattleServiceRequestV4["side"]>["pokemon"][number]): boolean {
  return index >= reservedActiveSlots && !pokemon.active && !pokemon.condition.includes("fnt");
}

async function flushReadyAutoChoices(session: RuntimeSession): Promise<void> {
  await submitTeamPreviewChoices(session);
  scheduleAiChoices(session);
  await submitAiChoices(session);
}

async function submitAiChoices(session: RuntimeSession): Promise<void> {
  for (let guard = 0; guard < 10 && session.snapshot.status === "running"; guard += 1) {
    scheduleAiChoices(session);
    await Promise.resolve();
    const pending = readyAiChoices(session);
    if (!pending.length) return;
    for (const entry of pending) {
      if (!entry.choice) continue;
      appendAiDecisionDebug(session, entry.debug);
      await writePlayerChoice(session, entry.playerId, entry.choice, "ai");
      delete session.aiTasks[entry.playerId];
    }
    touch(session);
    await waitForRequests(session, 700);
  }
}

function scheduleAiChoices(session: RuntimeSession): void {
  for (const player of session.snapshot.players) {
    const request = session.snapshot.requests[player.playerId];
    if (!isAiPlayer(player) || !shouldAutoChoose(request)) {
      delete session.aiTasks[player.playerId];
      continue;
    }
    const requestKey = battleAiRequestKeyV4(player.playerId, request);
    const existing = session.aiTasks[player.playerId];
    if (existing?.requestKey === requestKey) continue;
    const startedAt = Date.now();
    const task: RuntimeAiTask = {
      requestKey,
      startedAt,
      deadlineAt: startedAt + AI_THINK_TIME_MS,
      done: false,
      promise: Promise.resolve().then(() => {
        const result = chooseAiBattleChoiceV4({
          request,
          snapshot: clone(session.snapshot),
          playerId: player.playerId,
          aiProfile: normalizeBattleAiProfileV4(player.aiProfile || player.draft?.aiProfile),
          rngSeed: `${session.snapshot.runId}:${session.snapshot.nodeId}:${session.snapshot.turn}`,
          timeBudgetMs: AI_THINK_TIME_MS,
        });
        task.result = result;
        task.done = true;
      }).catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        const choice = fallbackLegalChoiceV4(request);
        const profile = normalizeBattleAiProfileV4(player.aiProfile || player.draft?.aiProfile);
        task.result = {
          choice,
          elapsedMs: Date.now() - startedAt,
          timedOut: true,
          debug: {
            playerId: player.playerId,
            rqid: request?.rqid,
            requestKey,
            level: profile.level,
            preference: profile.preference,
            elapsedMs: Date.now() - startedAt,
            timedOut: true,
            candidateCount: 0,
            selectedChoice: choice,
            selectedScore: 0,
            topCandidates: [],
          },
        };
        task.done = true;
        session.snapshot.debug.inputLog.push(`[BattleV4][ai-error][${player.playerId}] ${message}`);
      }),
    };
    session.aiTasks[player.playerId] = task;
  }
}

function readyAiChoices(session: RuntimeSession): Array<{playerId: ShowdownPlayerIdV4; choice: string; debug: BattleAiDecisionDebugV4}> {
  const now = Date.now();
  const entries: Array<{playerId: ShowdownPlayerIdV4; choice: string; debug: BattleAiDecisionDebugV4}> = [];
  for (const player of session.snapshot.players) {
    const request = session.snapshot.requests[player.playerId];
    const task = session.aiTasks[player.playerId];
    if (!isAiPlayer(player) || !request || !task) continue;
    const requestKey = battleAiRequestKeyV4(player.playerId, request);
    if (task.requestKey !== requestKey) {
      delete session.aiTasks[player.playerId];
      continue;
    }
    if (!task.done && now < task.deadlineAt) continue;
    const result = task.result || timeoutAiResult(player, request, task);
    entries.push({playerId: player.playerId, choice: result.choice, debug: result.debug});
  }
  return entries;
}

function timeoutAiResult(player: BattleServicePlayerInputV4, request: BattleServiceRequestV4, task: RuntimeAiTask): BattleAiChoiceResultV4 {
  const choice = fallbackLegalChoiceV4(request);
  const profile = normalizeBattleAiProfileV4(player.aiProfile || player.draft?.aiProfile);
  return {
    choice,
    elapsedMs: Date.now() - task.startedAt,
    timedOut: true,
    debug: {
      playerId: player.playerId,
      rqid: request.rqid,
      requestKey: task.requestKey,
      level: profile.level,
      preference: profile.preference,
      elapsedMs: Date.now() - task.startedAt,
      timedOut: true,
      candidateCount: 0,
      selectedChoice: choice,
      selectedScore: 0,
      topCandidates: [],
    },
  };
}

function appendAiDecisionDebug(session: RuntimeSession, debug: BattleAiDecisionDebugV4): void {
  session.snapshot.debug.aiDecisions = [...(session.snapshot.debug.aiDecisions || []), debug].slice(-100);
  session.snapshot.debug.inputLog.push(`[BattleV4][ai-choice][${debug.playerId}] ${debug.selectedChoice} score=${debug.selectedScore} candidates=${debug.candidateCount} elapsed=${debug.elapsedMs}ms${debug.timedOut ? " timeout" : ""}`);
}

function isAiPlayer(player: BattleServicePlayerInputV4): boolean {
  return player.controller === "ai";
}

function isLocalPlayer(player: BattleServicePlayerInputV4): boolean {
  return player.controller === "local";
}

async function applyInitialPokemonState(session: RuntimeSession, input: BattleServiceSessionInputV4): Promise<void> {
  const commands: string[] = [];
  for (const player of input.players) {
    for (const [index, pokemon] of player.team.entries()) {
      const slot = index + 1;
      const hp = normalizeInitialHp(pokemon);
      if (hp !== null) commands.push(`>editbattle hp ${player.playerId}, ${slot}, ${hp}`);
      const status = normalizeInitialStatus(pokemon.entryStatus);
      if (status) commands.push(`>eval ${initialStatusEval(player.playerId, slot, status)}`);
    }
  }
  if (!commands.length) return;
  const inputLog = commands.join("\n");
  session.snapshot.debug.inputLog.push(inputLog);
  await session.streams.omniscient.write(inputLog);
  touch(session);
  await new Promise(resolve => setTimeout(resolve, 25));
}

function normalizeInitialHp(pokemon: BattleServicePokemonSetV4): number | null {
  if (pokemon.entryHp === undefined || pokemon.entryHp === null) return null;
  const fallbackMax = Math.max(1, Number(pokemon.maxHp || pokemon.entryHp || 1));
  const hp = Math.max(0, Math.min(fallbackMax, Math.round(Number(pokemon.entryHp))));
  return hp < fallbackMax ? hp : null;
}

function normalizeInitialStatus(status: string | undefined): string {
  const value = String(status || "").toLowerCase();
  return value === "brn" || value === "par" || value === "psn" || value === "tox" || value === "slp" || value === "frz" ? value : "";
}

function initialStatusEval(playerId: ShowdownPlayerIdV4, slot: number, status: string): string {
  const sideIndex = Number(playerId.slice(1)) - 1;
  const pokemonIndex = Math.max(0, slot - 1);
  const duration = status === "slp" ? "; p.statusState.time = 2; p.statusState.startTime = 2" : "";
  return [
    `const p = battle.sides[${sideIndex}].pokemon[${pokemonIndex}]`,
    `p.status = '${status}'`,
    `p.statusState = battle.initEffectState({id: '${status}', target: p})${duration}`,
    `if (p.isActive) battle.add('-status', p, '${status}', '[silent]')`,
    "'ok'",
  ].join("; ");
}

async function submitTeamPreviewChoices(session: RuntimeSession): Promise<void> {
  for (let guard = 0; guard < 4 && session.snapshot.status === "running"; guard += 1) {
    const pending = session.snapshot.players
      .map(player => ({playerId: player.playerId, request: session.snapshot.requests[player.playerId]}))
      .filter(entry => entry.request?.teamPreview)
      .map(entry => ({playerId: entry.playerId, choice: randomLegalChoice(entry.request)}));
    if (!pending.length) return;
    for (const entry of pending) {
      if (!entry.choice) continue;
      await writePlayerChoice(session, entry.playerId, entry.choice, "team-preview");
    }
    touch(session);
    await waitForRequests(session, 700);
  }
}

async function writePlayerChoice(session: RuntimeSession, playerId: ShowdownPlayerIdV4, choice: string, source: "human" | "ai" | "team-preview"): Promise<void> {
  session.snapshot.debug.lastChoices.push({playerId, choice, at: new Date().toISOString()});
  session.snapshot.debug.inputLog.push(`>${playerId} ${choice}`);
  if (session.snapshot.requests[playerId]) session.lastRequests[playerId] = clone(session.snapshot.requests[playerId]);
  delete session.snapshot.requests[playerId];
  try {
    await session.streams[playerId].write(choice);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    session.snapshot.status = "blocked";
    session.snapshot.error = `[${source}] ${playerId} choice failed: ${choice}; ${message}`;
    session.snapshot.debug.inputLog.push(`[BattleV4][error] ${session.snapshot.error}`);
    touch(session);
    throw error;
  }
}

function shouldAutoChoose(request: BattleServiceRequestV4 | undefined): boolean {
  return Boolean(request && !request.wait && !request.teamPreview);
}

function attachReaders(session: RuntimeSession): void {
  void readOmniscient(session);
  for (const player of session.snapshot.players) {
    void readPlayerStream(session, player.playerId);
  }
}

async function readOmniscient(session: RuntimeSession): Promise<void> {
  try {
    for await (const chunk of session.streams.omniscient) {
      if (session.closed) return;
      session.snapshot.rawLog.push(...chunk.split("\n").filter(Boolean));
      session.snapshot.rawLog = session.snapshot.rawLog.slice(-500);
      applyRawChunk(session, chunk);
      touch(session);
    }
  } catch (error) {
    session.snapshot.status = "blocked";
    session.snapshot.error = error instanceof Error ? error.message : String(error);
    touch(session);
  }
}

async function readPlayerStream(session: RuntimeSession, playerId: ShowdownPlayerIdV4): Promise<void> {
  try {
    for await (const chunk of session.streams[playerId]) {
      if (session.closed) return;
      const request = requestFromChunk(chunk);
      recordPlayerStreamChunk(session, playerId, chunk, Boolean(request));
      if (request) {
        const sanitizedRequest = sanitizeRequestForRuleSet(request, session.snapshot.ruleSet, session.snapshot.mode);
        session.snapshot.requests[playerId] = sanitizedRequest;
        session.lastRequests[playerId] = clone(sanitizedRequest);
        rememberLatestSidePokemon(session, playerId, sanitizedRequest);
        delete session.invalidChoiceStreaks[playerId];
        delete session.aiTasks[playerId];
        touch(session);
      }
    }
  } catch (error) {
    session.snapshot.status = "blocked";
    session.snapshot.error = error instanceof Error ? error.message : String(error);
    touch(session);
  }
}

function rememberLatestSidePokemon(session: RuntimeSession, playerId: ShowdownPlayerIdV4, request: BattleServiceRequestV4): void {
  const pokemon = request.side?.pokemon;
  if (!pokemon?.length) return;
  session.snapshot.debug.latestSidePokemon = {
    ...(session.snapshot.debug.latestSidePokemon || {}),
    [playerId]: clone(pokemon),
  };
}

function recordPlayerStreamChunk(session: RuntimeSession, playerId: ShowdownPlayerIdV4, chunk: string, request: boolean): void {
  session.snapshot.debug.playerStreams.push({
    playerId,
    at: new Date().toISOString(),
    chunk,
    request,
    lines: chunk.split("\n").filter(Boolean),
  });
  session.snapshot.debug.playerStreams = session.snapshot.debug.playerStreams.slice(-200);
  const invalidLine = chunk.split("\n").find(line => line.includes("[Invalid choice]") || line.startsWith("|error|"));
  if (invalidLine) {
    session.snapshot.error = invalidLine;
    const previousRequest = session.lastRequests[playerId];
    if (previousRequest) session.snapshot.requests[playerId] = clone(previousRequest);
    session.snapshot.debug.inputLog.push(`[BattleV4][player-stream-error][${playerId}] ${invalidLine}`);
    recordInvalidChoice(session, playerId, invalidLine, previousRequest);
  }
  touch(session);
}

function recordInvalidChoice(session: RuntimeSession, playerId: ShowdownPlayerIdV4, invalidLine: string, request: BattleServiceRequestV4 | undefined): void {
  const requestKey = request ? JSON.stringify({
    rqid: request.rqid,
    wait: request.wait,
    teamPreview: request.teamPreview,
    forceSwitch: request.forceSwitch,
    active: request.active?.map((active, index) => ({
      exists: Boolean(active),
      condition: request.side?.pokemon?.[index]?.condition,
      active: request.side?.pokemon?.[index]?.active,
      moves: active?.moves?.map(move => ({id: move.id, target: move.target, disabled: move.disabled, pp: move.pp})),
    })),
  }) : "missing";
  const previous = session.invalidChoiceStreaks[playerId];
  const count = previous?.requestKey === requestKey ? previous.count + 1 : 1;
  session.invalidChoiceStreaks[playerId] = {requestKey, count};
  session.snapshot.debug.inputLog.push(`[BattleV4][invalid-choice][${playerId}] count=${count} ${invalidLine}`);
  if (count >= 3) {
    session.snapshot.status = "blocked";
    session.snapshot.error = `[${playerId}] repeated invalid choice (${count}): ${invalidLine}`;
    session.snapshot.debug.inputLog.push(`[BattleV4][blocked] repeated invalid choice for ${playerId}; request=${requestKey}`);
  }
}

function requestFromChunk(chunk: string): BattleServiceRequestV4 | null {
  const line = chunk.split("\n").find(entry => entry.startsWith("|request|"));
  if (!line) return null;
  const raw = line.slice("|request|".length);
  try {
    return JSON.parse(raw) as BattleServiceRequestV4;
  } catch {
    return null;
  }
}

function sanitizeRequestForRuleSet(request: BattleServiceRequestV4, ruleSet: string, mode: string): BattleServiceRequestV4 {
  if (!request.active?.length) return request;
  return {
    ...request,
    active: request.active.map(active => {
      if (!active) return active;
      const allowed = allowedSpecialSystemsForRuleSet(ruleSet, mode);
      return {
        ...active,
        canMegaEvo: allowed.mega ? active.canMegaEvo : false,
        canMegaEvoX: allowed.mega ? active.canMegaEvoX : false,
        canMegaEvoY: allowed.mega ? active.canMegaEvoY : false,
        canUltraBurst: allowed.mega ? active.canUltraBurst : false,
        canZMove: allowed.zmove ? active.canZMove : undefined,
        zMoves: allowed.zmove ? active.zMoves : undefined,
        canDynamax: allowed.max ? active.canDynamax : false,
        maxMoves: allowed.max ? active.maxMoves : undefined,
        gigantamax: allowed.max ? active.gigantamax : false,
        canTerastallize: allowed.tera ? active.canTerastallize : false,
      };
    }),
  };
}

function sanitizeChoiceForRuleSet(choice: string, ruleSet: string, mode: string): string {
  return filterShowdownChoiceForRuleSetV4(choice, ruleSet, mode);
}

function allowedSpecialSystemsForRuleSet(ruleSet: string, mode: string): {mega: boolean; zmove: boolean; max: boolean; tera: boolean} {
  return {
    mega: showdownSpecialSystemAllowedForRuleSetV4("mega", ruleSet, mode),
    zmove: showdownSpecialSystemAllowedForRuleSetV4("zmove", ruleSet, mode),
    max: showdownSpecialSystemAllowedForRuleSetV4("max", ruleSet, mode),
    tera: showdownSpecialSystemAllowedForRuleSetV4("terastallize", ruleSet, mode),
  };
}

function applyRawChunk(session: RuntimeSession, chunk: string): void {
  for (const line of chunk.split("\n")) {
    const parts = line.split("|");
    if (parts[1] === "turn") {
      session.snapshot.turn = Number(parts[2]) || session.snapshot.turn;
    }
    if (parts[1] === "switch" || parts[1] === "drag" || parts[1] === "replace") {
      upsertActive(session, parts[2] || "", parts[3] || "", parts[4] || "");
    }
    if (parts[1] === "-damage" || parts[1] === "-heal" || parts[1] === "-sethp") {
      patchActiveCondition(session, parts[2] || "", parts[3] || "");
    }
    if (parts[1] === "-status") {
      patchActiveStatus(session, parts[2] || "", parts[3] || "");
    }
    if (parts[1] === "-curestatus") {
      patchActiveStatus(session, parts[2] || "", "");
    }
    if (parts[1] === "faint") {
      patchActiveCondition(session, parts[2] || "", "0 fnt");
    }
    if (parts[1] === "win") {
      const winnerName = parts[2] || "";
      session.snapshot.winner = playerIdByName(session.snapshot.players, winnerName);
      session.snapshot.status = "ended";
    }
    if (parts[1] === "tie") {
      session.snapshot.winner = null;
      session.snapshot.status = "ended";
    }
  }
}

function buildTrainerItemAction(session: RuntimeSession, playerId: ShowdownPlayerIdV4, action: TrainerItemRuntimeAction): any {
  const player = session.snapshot.players.find(entry => entry.playerId === playerId);
  if (!player) throw new Error(`玩家不存在：${playerId}`);
  const side = battleSide(session, playerId);
  if (!side) throw new Error("当前对战尚未开始。");
  const activeIndex = Math.max(0, Math.floor(Number(action.activeIndex || 0)));
  const active = side.active?.[activeIndex];
  if (!active || active.fainted || active.hp <= 0) throw new Error("当前宝可梦无法行动，不能使用战斗道具。");
  const item = findBagItem(player.draft.bag?.items || [], action.itemInstanceId);
  if (!item) throw new Error("背包中找不到这个道具。");
  if (item.canBattleUse === false) throw new Error("这个道具不能在战斗中使用。");
  const itemId = normalizeIdentityToken(item.itemID || item.itemId || "");
  const effect = RECOVERY_EFFECTS[itemId];
  if (!effect) throw new Error("这个道具当前不能立即使用。");
  const resolved = resolveTrainerItemTarget(session, player, action.targetKey);
  if (!resolved.localPokemon) throw new Error("找不到目标宝可梦。");
  const battlePokemon = findBattlePokemon(session, playerId, resolved.mapping?.teamIndex ?? resolved.teamIndex, action.targetKey);
  const validation = applyTrainerItemEffectToLocalPokemon(resolved.localPokemon, effect);
  if (!validation.ok) throw new Error(validation.reason);
  return {
    choice: "trainerItem",
    requestActiveIndex: activeIndex,
    pokemon: active,
    target: battlePokemon,
    targetLocalPokemonId: resolved.localPokemon.localPokemonId,
    itemInstanceId: action.itemInstanceId,
    itemId,
    itemName: item.name || item.itemID || item.itemId || "道具",
    effect,
    playerId,
    order: 102,
    priority: 0,
    speed: 1,
  };
}

function executeTrainerItemAction(session: RuntimeSession, playerId: ShowdownPlayerIdV4, action: any): void {
  const player = session.snapshot.players.find(entry => entry.playerId === playerId);
  if (!player) throw new Error(`玩家不存在：${playerId}`);
  const item = findBagItem(player.draft.bag?.items || [], action.itemInstanceId);
  if (!item) throw new Error("背包中找不到这个道具。");
  const localPokemon = player.draft.localTeam.pokemon.find(pokemon => pokemon.localPokemonId === action.targetLocalPokemonId);
  if (!localPokemon) throw new Error("找不到目标宝可梦。");
  const result = applyTrainerItemEffectToLocalPokemon(localPokemon, action.effect);
  if (!result.ok) throw new Error(result.reason);

  const nextTeam = player.draft.localTeam.pokemon.map(pokemon => {
    const cleared = clearConsumedItemReference(pokemon, item);
    return cleared.localPokemonId === result.pokemon.localPokemonId ? {...result.pokemon} : cleared;
  });
  const nextBag = {
    ...player.draft.bag,
    items: (player.draft.bag?.items || []).filter(entry => (entry.id || entry.itemID || entry.itemId) !== action.itemInstanceId),
  };
  player.draft = {
    ...player.draft,
    localTeam: {...player.draft.localTeam, pokemon: nextTeam},
    bag: nextBag,
  };

  if (action.target) applyTrainerItemEffectToBattlePokemon(session, action.target, action.effect, result, action.itemName);
  else addTrainerItemProtocol(session, `|-message|${displayPokemonName(result.pokemon)} 使用了 ${item.name || item.itemID || item.itemId || "道具"}。`);
  session.snapshot.debug.inputLog.push(`[BattleV4][trainer-item] ${playerId} active=${action.requestActiveIndex} item=${action.itemId} target=${action.targetLocalPokemonId}`);
  touch(session);
}

function installTrainerItemRunAction(session: RuntimeSession): void {
  const battle = (session.stream as any).battle;
  if (!battle || battle.__changeBattleV2TrainerItemPatch) return;
  const originalRunAction = battle.runAction.bind(battle);
  battle.runAction = (action: any) => {
    if (action?.choice !== "trainerItem") return originalRunAction(action);
    executeTrainerItemAction(session, action.playerId || "p1", action);
    return undefined;
  };
  battle.__changeBattleV2TrainerItemPatch = true;
}

function battleSide(session: RuntimeSession, playerId: ShowdownPlayerIdV4): any | null {
  const battle = (session.stream as any).battle;
  const sideIndex = Number(playerId.slice(1)) - 1;
  return battle?.sides?.[sideIndex] || null;
}

function resolveTrainerItemTarget(session: RuntimeSession, player: BattleServicePlayerInputV4, targetKey: string) {
  const key = normalizeIdentityToken(targetKey);
  const localTeam = player.draft.localTeam.pokemon;
  const mapping = player.teamMapping?.find(entry =>
    normalizeIdentityToken(entry.showdownIdentityToken) === key ||
    normalizeIdentityToken(entry.showdownId) === key ||
    normalizeIdentityToken(entry.pokeballId) === key ||
    normalizeIdentityToken(entry.localPokemonId) === key
  ) || null;
  if (mapping) {
    return {
      localPokemon: localTeam.find(pokemon => pokemon.localPokemonId === mapping.localPokemonId) || localTeam[mapping.teamIndex] || null,
      mapping,
      teamIndex: mapping.teamIndex,
    };
  }
  const teamIndex = localTeam.findIndex(pokemon =>
    normalizeIdentityToken(pokemon.localPokemonId) === key ||
    normalizeIdentityToken(pokemon.showdownIdentityToken) === key ||
    normalizeIdentityToken(pokemon.showdownId) === key ||
    normalizeIdentityToken(pokemon.pokeballId) === key
  );
  return {localPokemon: teamIndex >= 0 ? localTeam[teamIndex]! : null, mapping: null, teamIndex};
}

function findBattlePokemon(session: RuntimeSession, playerId: ShowdownPlayerIdV4, teamIndex: number, targetKey: string): any | null {
  const battle = (session.stream as any).battle;
  const sideIndex = Number(playerId.slice(1)) - 1;
  const side = battle?.sides?.[sideIndex];
  if (!side) return null;
  const key = normalizeIdentityToken(targetKey);
  return side.pokemon?.find((pokemon: any, index: number) => index === teamIndex || normalizeIdentityToken(pokemon.set?.pokeball) === key) || null;
}

function applyTrainerItemEffectToBattlePokemon(session: RuntimeSession, pokemon: any, effect: RecoveryEffect, result: Extract<ReturnType<typeof applyTrainerItemEffectToLocalPokemon>, {ok: true}>, itemName: string): void {
  const battle = (session.stream as any).battle;
  if (!battle || !pokemon) return;
  battle.add("-message", `${displayBattlePokemonName(pokemon)} 使用了 ${itemName}。`);
  if (effect.revive && pokemon.hp <= 0) {
    pokemon.hp = Number(result.pokemon.entryHp || 1);
    pokemon.fainted = false;
    pokemon.faintQueued = false;
    pokemon.status = "";
    pokemon.statusState = {};
    if (pokemon.side) {
      pokemon.side.pokemonLeft = Math.max(Number(pokemon.side.pokemonLeft || 0), pokemon.side.pokemon.filter((entry: any) => !entry.fainted && entry.hp > 0).length);
    }
    battle.add("-heal", pokemon, `${Math.max(0, Number(pokemon.hp || 0))}/${Math.max(1, Number(pokemon.maxhp || result.pokemon.maxHp || 1))}`, `[from] item: ${itemName}`);
  }
  if (result.hpRecovered > 0 && pokemon.hp > 0) {
    pokemon.hp = Math.min(pokemon.maxhp || result.pokemon.maxHp || pokemon.hp, Math.max(pokemon.hp, Number(result.pokemon.entryHp || pokemon.hp)));
    if (pokemon.isActive) battle.add("-heal", pokemon, pokemon.getHealth, `[from] item: ${itemName}`);
  }
  if (result.statusCured && pokemon.status) {
    pokemon.cureStatus?.();
    pokemon.status = "";
  }
  if (result.ppRecovered > 0) {
    syncBattlePokemonPp(pokemon, result.pokemon);
    battle.add("-message", `${displayBattlePokemonName(pokemon)} 恢复了 ${result.ppRecovered} 点 PP。`);
  }
  battle.sendUpdates?.();
}

function addTrainerItemProtocol(session: RuntimeSession, line: string): void {
  session.snapshot.rawLog.push(line);
  applyRawChunk(session, line);
}

function syncBattlePokemonPp(battlePokemon: any, localPokemon: LocalPokemonLikeForBattleV4): void {
  for (const localMove of localPokemon.moves || []) {
    const slot = battlePokemon.moveSlots?.find((entry: any) => normalizeIdentityToken(entry.id || entry.move) === normalizeIdentityToken(localMove.moveId));
    if (slot && typeof (localMove as any).remainingPp === "number") slot.pp = (localMove as any).remainingPp;
  }
}

function applyTrainerItemEffectToLocalPokemon(pokemon: LocalPokemonLikeForBattleV4, effect: RecoveryEffect):
  | {ok: true; pokemon: LocalPokemonLikeForBattleV4; hpRecovered: number; ppRecovered: number; statusCured: boolean}
  | {ok: false; reason: string} {
  const beforeHp = Number(pokemon.entryHp ?? pokemon.maxHp ?? 1);
  const maxHp = Math.max(1, Number(pokemon.maxHp || beforeHp || 1));
  const fainted = beforeHp <= 0;
  let next = {...pokemon, moves: (pokemon.moves || []).map(move => ({...move}))};
  let hpRecovered = 0;
  let ppRecovered = 0;
  let statusCured = false;
  if (effect.revive) {
    if (!fainted) return {ok: false, reason: "目标没有濒死，不能使用复活道具。"};
    next.entryHp = effect.revive === "full" ? maxHp : Math.max(1, Math.floor(maxHp / 2));
    next.entryStatus = "";
    hpRecovered = next.entryHp;
    statusCured = Boolean(pokemon.entryStatus);
  } else if (effect.hp) {
    if (fainted) return {ok: false, reason: "目标已经濒死，请使用复活道具。"};
    const target = hpTargetForBattleEffect(effect.hp, beforeHp, maxHp);
    next.entryHp = Math.min(maxHp, Math.max(beforeHp, target));
    hpRecovered = Math.max(0, next.entryHp - beforeHp);
  }
  if (effect.cureStatus && statusMatchesBattle(effect.cureStatus, String(next.entryStatus || ""))) {
    next.entryStatus = "";
    statusCured = true;
  }
  if (effect.pp) {
    const pp = applyBattlePpRecovery(next.moves as any[], effect.pp);
    next.moves = pp.moves as any;
    ppRecovered = pp.recovered;
  }
  if (hpRecovered <= 0 && ppRecovered <= 0 && !statusCured) return {ok: false, reason: "目标当前不需要这个道具。"};
  return {ok: true, pokemon: next, hpRecovered, ppRecovered, statusCured};
}

function hpTargetForBattleEffect(effect: NonNullable<RecoveryEffect["hp"]>, hp: number, maxHp: number): number {
  if (effect.kind === "full") return maxHp;
  if (effect.kind === "fixed") return hp + effect.amount;
  return hp + Math.max(1, Math.floor(maxHp * effect.numerator / Math.max(1, effect.denominator)));
}

function applyBattlePpRecovery(moves: any[], effect: NonNullable<RecoveryEffect["pp"]>): {moves: any[]; recovered: number} {
  if (effect.scope === "all") {
    let recovered = 0;
    const nextMoves = moves.map(move => {
      const maxPp = Number(move.maxPp || move.pp || 0);
      const current = Number(move.remainingPp ?? maxPp);
      const next = effect.full ? maxPp : Math.min(maxPp, current + Math.max(0, effect.amount || 0));
      recovered += Math.max(0, next - current);
      return {...move, remainingPp: next};
    });
    return {moves: nextMoves, recovered};
  }
  let bestIndex = -1;
  let bestRatio = Number.POSITIVE_INFINITY;
  moves.forEach((move, index) => {
    const maxPp = Number(move.maxPp || move.pp || 0);
    const current = Number(move.remainingPp ?? maxPp);
    if (maxPp <= 0 || current >= maxPp) return;
    const ratio = current / maxPp;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestIndex = index;
    }
  });
  if (bestIndex < 0) return {moves, recovered: 0};
  const picked = moves[bestIndex]!;
  const maxPp = Number(picked.maxPp || picked.pp || 0);
  const current = Number(picked.remainingPp ?? maxPp);
  const next = effect.full ? maxPp : Math.min(maxPp, current + Math.max(0, effect.amount || 0));
  return {moves: moves.map((move, index) => index === bestIndex ? {...move, remainingPp: next} : move), recovered: Math.max(0, next - current)};
}

function statusMatchesBattle(effect: NonNullable<RecoveryEffect["cureStatus"]>, status: string): boolean {
  if (!status) return false;
  if (effect === "all") return true;
  return effect.includes(status);
}

function clearConsumedItemReference(pokemon: LocalPokemonLikeForBattleV4, item: {id?: string; itemID?: string; itemId?: string}): LocalPokemonLikeForBattleV4 {
  const itemId = item.itemID || item.itemId || "";
  if (pokemon.heldItemInstanceId === item.id || pokemon.itemId === itemId && !pokemon.heldItemInstanceId) {
    return {...pokemon, itemId: "", heldItemInstanceId: undefined};
  }
  return pokemon;
}

function findBagItem(items: Array<{id?: string; itemID?: string; itemId?: string; [key: string]: unknown}>, itemInstanceId: string) {
  return items.find(item => item.id === itemInstanceId || item.itemID === itemInstanceId || item.itemId === itemInstanceId) || null;
}

function displayPokemonName(pokemon: LocalPokemonLikeForBattleV4): string {
  return pokemon.nameZh || pokemon.name || pokemon.speciesId;
}

function displayBattlePokemonName(pokemon: any): string {
  return pokemon?.name || pokemon?.species?.name || pokemon?.baseSpecies?.name || "宝可梦";
}

function upsertActive(session: RuntimeSession, ident: string, details: string, condition: string): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  const nextCondition = condition || "0/1";
  const hp = parseCondition(nextCondition);
  const existing = session.snapshot.active.find(active => active.slot === parsed.slot);
  const identity = activeIdentityFromRequest(session, parsed.playerId, parsed.slot);
  const next = {
    ident: parsed.ident,
    playerId: parsed.playerId,
    slot: parsed.slot,
    ...identity,
    species: details.split(",")[0]?.trim() || parsed.name,
    details,
    condition: nextCondition,
    hp: hp.hp,
    maxHp: hp.maxHp,
    status: hp.status,
    fainted: hp.fainted,
  };
  session.snapshot.active = existing
    ? session.snapshot.active.map(active => active.slot === parsed.slot ? {...active, ...next} : active)
    : [...session.snapshot.active.filter(active => active.slot !== parsed.slot), next];
}

function activeIdentityFromRequest(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string): {
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
} {
  const player = session.snapshot.players.find(entry => entry.playerId === playerId);
  const row = activeSidePokemonRow(session, playerId, slot);
  const pokeball = row?.pokeball || "";
  const token = normalizeIdentityToken(pokeball);
  const mapping = token
    ? player?.teamMapping?.find(entry =>
      normalizeIdentityToken(entry.showdownIdentityToken) === token ||
      normalizeIdentityToken(entry.showdownId) === token ||
      normalizeIdentityToken(entry.pokeballId) === token
    )
    : null;
  return {
    localPokemonId: mapping?.localPokemonId,
    showdownIdentityToken: mapping?.showdownIdentityToken || token || undefined,
    showdownId: mapping?.showdownId || token || undefined,
    pokeballId: mapping?.pokeballId || token || undefined,
    pokeball: pokeball || token || undefined,
  };
}

function activeSidePokemonRow(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string) {
  const activeIndex = activeIndexFromSlot(slot);
  const rows = session.snapshot.requests[playerId]?.side?.pokemon || session.snapshot.debug.latestSidePokemon?.[playerId] || [];
  const activeRows = rows.filter(row => row.active && row.pokeball);
  if (activeRows.length === 1) return activeRows[0] || null;
  return activeRows.find(row => activeIndexFromIdent(row.ident) === activeIndex) || null;
}

function activeIndexFromIdent(ident: string): number {
  const parsed = parseIdent(ident);
  return parsed ? activeIndexFromSlot(parsed.slot) : 0;
}

function activeIndexFromSlot(slot: string): number {
  const suffix = slot.replace(/^p[1-4]/i, "").toLowerCase();
  return suffix ? Math.max(0, suffix.charCodeAt(0) - 97) : 0;
}

function patchActiveCondition(session: RuntimeSession, ident: string, condition: string): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  const hp = parseCondition(condition);
  session.snapshot.active = session.snapshot.active.map(active => active.ident === parsed.ident || active.slot === parsed.slot
    ? {...active, condition, hp: hp.hp, maxHp: hp.maxHp, status: hp.status || active.status, fainted: hp.fainted}
    : active);
}

function patchActiveStatus(session: RuntimeSession, ident: string, status: string): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  session.snapshot.active = session.snapshot.active.map(active => active.ident === parsed.ident || active.slot === parsed.slot
    ? {...active, status}
    : active);
}

function parseIdent(ident: string): {ident: string; playerId: ShowdownPlayerIdV4; slot: string; name: string} | null {
  const match = /^(p[1-4])([a-z]?):\s*(.+)$/i.exec(ident.trim());
  if (!match) return null;
  const playerId = match[1]!.toLowerCase() as ShowdownPlayerIdV4;
  const slot = `${playerId}${(match[2] || "a").toLowerCase()}`;
  return {ident: `${slot}: ${match[3]!.trim()}`, playerId, slot, name: match[3]!.trim()};
}

function parseCondition(condition: string): {hp: number; maxHp: number; status: string; fainted: boolean} {
  if (!condition || condition.includes("fnt")) return {hp: 0, maxHp: 1, status: "fnt", fainted: true};
  const [hpText, statusText = ""] = condition.split(" ");
  const [hpRaw, maxRaw] = (hpText || "").split("/");
  const hp = Math.max(0, Number(hpRaw) || 0);
  const maxHp = Math.max(1, Number(maxRaw) || hp || 1);
  return {hp, maxHp, status: statusText, fainted: hp <= 0};
}

function buildStartInput(input: BattleServiceSessionInputV4): string {
  const spec = {
    formatid: formatId(input.ruleSet, input.mode),
  };
  const lines = [`>start ${JSON.stringify(spec)}`];
  for (const player of input.players) {
    lines.push(`>player ${player.playerId} ${JSON.stringify({name: player.name, team: showdown.Teams.pack(player.team)})}`);
  }
  return lines.join("\n");
}

function compilePlayer(player: TrainingPlayerDraftV4, usedShowdownIdentityTokens: Set<string> = new Set(), showdownIdPool = createShowdownIdPoolState()): BattleServicePlayerInputV4 {
  const identity = createPlayerBattleIdentity(player, usedShowdownIdentityTokens, showdownIdPool);
  return {
    playerId: player.playerId,
    name: player.name || player.playerId,
    controller: player.controller,
    aiProfile: player.aiProfile,
    alliance: player.alliance,
    team: identity.localTeam.pokemon.map(compilePokemonSet),
    draft: {
      ...player,
      localTeam: identity.localTeam,
    },
    teamMapping: identity.teamMapping,
  };
}

function compilePokemonSet(pokemon: LocalPokemonLikeForBattleV4): BattleServicePokemonSetV4 {
  return {
    species: pokemon.speciesId,
    name: pokemon.nickname || pokemon.name || pokemon.nameZh || pokemon.speciesId,
    pokeball: pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId,
    entryHp: pokemon.entryHp,
    entryStatus: pokemon.entryStatus,
    maxHp: pokemon.maxHp,
    item: pokemon.itemId || undefined,
    ability: pokemon.abilityId || "No Ability",
    moves: pokemon.moves.map((move: {moveId: string}) => move.moveId).filter(Boolean).slice(0, 4),
    nature: pokemon.nature || "Serious",
    evs: pokemon.evs,
    ivs: pokemon.ivs,
    gender: pokemon.gender === "N" ? undefined : pokemon.gender,
    shiny: pokemon.shiny,
    level: pokemon.level || 50,
  };
}

function createPlayerBattleIdentity(player: TrainingPlayerDraftV4, usedShowdownIdentityTokens: Set<string>, showdownIdPool: ShowdownIdPoolStateV4): {localTeam: TrainingPlayerDraftV4["localTeam"]; teamMapping: ShowdownTeamPokemonMappingV4[]} {
  const pokemon = player.localTeam.pokemon.map((entry, teamIndex) => {
    const existingToken = normalizeIdentityToken(entry.showdownIdentityToken || entry.showdownId || entry.pokeballId);
    const showdownIdentityToken = existingToken && !usedShowdownIdentityTokens.has(existingToken)
      ? existingToken
      : takeShowdownIdentityToken(usedShowdownIdentityTokens, showdownIdPool);
    usedShowdownIdentityTokens.add(showdownIdentityToken);
    if (!showdownIdPool.used.includes(showdownIdentityToken)) showdownIdPool.used = [...showdownIdPool.used, showdownIdentityToken];
    showdownIdPool.available = showdownIdPool.available.filter(candidate => candidate !== showdownIdentityToken);
    return {
      ...entry,
      showdownIdentityToken,
      showdownId: showdownIdentityToken,
      pokeballId: showdownIdentityToken,
    };
  });
  return {
    localTeam: {
      ...player.localTeam,
      pokemon,
    },
    teamMapping: pokemon.map((entry, teamIndex) => ({
      playerId: player.playerId,
      teamIndex,
      choiceIndex: teamIndex + 1,
      localPokemonId: entry.localPokemonId || `${player.playerId}-${teamIndex + 1}`,
      showdownIdentityToken: entry.showdownIdentityToken!,
      showdownId: entry.showdownId!,
      pokeballId: entry.pokeballId!,
      speciesId: entry.speciesId,
      displayName: entry.nickname || entry.nameZh || entry.name || entry.speciesId,
    })),
  };
}

function createShowdownIdPoolState(): ShowdownIdPoolStateV4 {
  return {
    used: [],
    available: [...SHOWDOWN_ID_POOL_V4],
  };
}

function takeShowdownIdentityToken(used: Set<string>, pool: ShowdownIdPoolStateV4): string {
  const token = pool.available.find(candidate => !used.has(candidate));
  if (!token) throw new Error("Showdown ID pool exhausted while creating Battle V4 session.");
  used.add(token);
  pool.used = [...pool.used, token];
  pool.available = pool.available.filter(candidate => candidate !== token);
  return token;
}

function normalizeIdentityToken(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function playerIdsForNode(node: TrainingRunGameNodeV4): ShowdownPlayerIdV4[] {
  return [node.p1, node.p2, node.p3, node.p4].filter(Boolean) as ShowdownPlayerIdV4[];
}

function gameType(mode: string): "singles" | "doubles" | "multi" {
  if (mode === "doubles") return "doubles";
  if (mode === "coop") return "multi";
  return "singles";
}

function formatId(ruleSet: string, mode: string): string {
  const suffix = mode === "doubles" ? "doublescustomgame" : "customgame";
  if (ruleSet === "gen7") return `gen7${suffix}`;
  if (ruleSet === "gen8") return `gen8${suffix}`;
  if (mode === "coop") return "gen9multirandombattle";
  if (ruleSet === "gen9" || ruleSet === "standard") return `gen9${suffix}`;
  return "gen9customgame";
}

function playerIdByName(players: BattleServicePlayerInputV4[], name: string): BattleServicePlayerIdV4 | null {
  return players.find(player => player.name === name)?.playerId || null;
}

function getSession(sessionId: string): RuntimeSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Battle session 不存在：${sessionId}`);
  return session;
}

function touch(session: RuntimeSession): void {
  session.snapshot.updatedAt = new Date().toISOString();
}

async function waitForRequests(session: RuntimeSession, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs && session.snapshot.status === "running") {
    await new Promise(resolve => setTimeout(resolve, 25));
    if (session.snapshot.players.some(player => shouldAutoChoose(session.snapshot.requests[player.playerId]) || isLocalPlayer(player) && session.snapshot.requests[player.playerId] && !session.snapshot.requests[player.playerId]?.wait)) {
      return;
    }
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type {
  BattleServiceApiV4,
  BattleServiceCreateInputV4,
  BattleServicePlayerInputV4,
  BattleServicePokemonSetV4,
  BattleServiceRequestV4,
  BattleServiceSessionInputV4,
  BattleServiceSnapshotV4,
  BattleServiceSubmitChoiceInputV4,
  BattleServiceSubmitTrainerItemInputV4,
} from "./types.js";
