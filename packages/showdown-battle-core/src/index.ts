// Battle V4 是本项目的底层战斗逻辑；active 身份连续性、switch/detailschange 和 choice 闭环
// 全面参考 Pokemon Showdown Client 的 battle.ts / battle-choices.ts，并翻译为本项目的 snapshot/projection 架构。
// 后续修改或排查战斗页 bug 时，优先横向对比本实现与 Showdown Client 的差异，再决定如何落到本项目架构。
// 严禁随意修改；只有确认 Showdown Client 对应实现来源与差异后，才允许调整这里的战斗行为。
import type {
  BattleServiceApiV4,
  BattleServiceCreateInputV4,
  BattleServiceMoveRequestV4,
  BattleServicePlayerIdV4,
  BattleServicePlayerInputV4,
  BattleServicePokemonSetV4,
  BattleServicePermanentFormeChangeInputV4,
  BattleServicePermanentFormeChangeResultV4,
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
  BattleSpecialSystemV4,
  BattleTeamPokemonStateV4,
  BattleRosterPokemonV4,
  BattleRosterStateV4,
  BattleServiceActivePokemonV4,
  BattleServiceSidePokemonV4,
  ShowdownPlaybackTimelineV4,
} from "./types.js";
import type {TrainingPlayerDraftV4, TrainingRunGameNodeV4} from "./types.js";
import {filterShowdownChoiceForRuleSetV4, showdownMoveNeedsExplicitTargetV4, showdownNormalizeMoveTargetV4, showdownSpecialSystemAllowedForRuleSetV4, validateShowdownChoiceCommandV4, type ShowdownChoiceValidationResultV4} from "./showdownCommand.js";
import {battleAiRequestKeyV4, chooseAiBattleChoiceV4, fallbackLegalChoiceV4, normalizeBattleAiProfileV4, type BattleAiChoiceResultV4} from "./ai.js";
import {loadShowdownSimV4} from "./showdownVendor.js";
import {compileShowdownPlaybackTimelineFromRawLog} from "./playbackCompiler.js";
import {battleKeyFromRosterIdentityV4, canonicalBattleKeyV4, isProtocolBattleKeyV4} from "./battleIdentity.js";

export * from "./showdownCommand.js";
export * from "./ai.js";
export * from "./aiMoveEvaluator.js";
export * from "./aiSearchEngineV4.js";
export * from "./aiTeamRoleAnalyzerV4.js";
export * from "./aiValueFunctionV4.js";
export * from "./aiOutcomeBucketsV4.js";
export * from "./teamGenerator.js";
export * from "./battleProfiles.js";
export * from "./battleIdentity.js";

type ShowdownRuntimeApiV4 = {
  BattleStream: new (options?: {keepAlive?: boolean; debug?: boolean}) => BattleStreamLike;
  Teams: {pack(team: BattleServicePokemonSetV4[]): string};
  getPlayerStreams(stream: BattleStreamLike): PlayerStreamsLike;
};

type ShowdownStartFormatSpecV4 = {
  id: string;
  name: string;
  mod: string;
  gameType?: "singles" | "doubles" | "multi";
  playerCount: number;
  debug: boolean;
  ruleset: string[];
  banlist: string[];
  restricted: string[];
  unbanlist: string[];
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
const playbackTimelineCache = new Map<string, ShowdownPlaybackTimelineV4>();
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

const SYSTEM_ITEM_TO_SPECIAL_SYSTEM: Record<string, BattleSpecialSystemV4> = {
  "system-mega-stone": "mega",
  "system-z-crystal": "zmove",
  "system-dynamax-band": "max",
  "system-tera-orb": "terastallize",
};

function normalizeBattleServicePlayers(players: BattleServicePlayerInputV4[], ruleSet: string): BattleServicePlayerInputV4[] {
  return players.map(player => ({
    ...player,
    allowedSpecialSystems: normalizeAllowedSpecialSystems(player.allowedSpecialSystems || specialSystemsFromBag(player.draft?.bag?.items || []), ruleSet),
  }));
}

function specialSystemsFromBag(items: TrainingPlayerDraftV4["bag"]["items"] = []): BattleSpecialSystemV4[] {
  const systems = new Set<BattleSpecialSystemV4>();
  for (const item of items || []) {
    const itemId = String(item.itemID || item.itemId || "");
    const system = SYSTEM_ITEM_TO_SPECIAL_SYSTEM[itemId];
    if (system) systems.add(system);
  }
  return [...systems];
}

function normalizeAllowedSpecialSystems(systems: readonly BattleSpecialSystemV4[] | undefined, ruleSet: string): BattleSpecialSystemV4[] {
  return [...new Set(systems || [])].filter(system => showdownSpecialSystemAllowedForRuleSetV4(system, ruleSet));
}

export function compileBattleSessionInput(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): BattleServiceSessionInputV4 {
  if ("nodeId" in input) {
    return {
      ...input,
      players: normalizeBattleServicePlayers(input.players, input.ruleSet),
    };
  }
  const nodePlayers = input.node.participants || {};
  const showdownIdPool = createShowdownIdPoolState();
  const usedShowdownIdentityTokens = new Set(showdownIdPool.used);
  const players = playerIdsForNode(input.node)
    .map(playerId => nodePlayers[playerId] || input.players[playerId])
    .filter(Boolean)
    .map(player => compilePlayer(player!, usedShowdownIdentityTokens, showdownIdPool, input.node.ruleSet));
  return {
    runId: input.runId,
    nodeId: input.node.id,
    mode: input.node.mode,
    ruleSet: input.node.ruleSet,
    seed: input.node.seed,
    players: normalizeBattleServicePlayers(players, input.node.ruleSet),
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
    async applyPermanentFormeChange(input) {
      return applyPermanentFormeChange(input);
    },
    async getSnapshot(sessionId) {
      return getSnapshot(sessionId);
    },
    async getPlaybackTimeline(sessionId, previousIndex) {
      return getPlaybackTimeline(sessionId, previousIndex);
    },
    async closeSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.closed = true;
        session.aiTasks = {};
        sessions.delete(sessionId);
        clearPlaybackTimelineCacheForSession(sessionId);
      }
    },
  };
}

export async function createBattleSession(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): Promise<BattleServiceSnapshotV4> {
  const showdown = await loadShowdownRuntimeApiV4();
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
      teamStateByPlayer: {},
      battleRosterByPlayer: {},
      rawLog: [],
      debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, latestRequests: {}, latestMovePpByPokemon: {}, aiDecisions: []},
      createdAt: now,
      updatedAt: now,
    },
  };
  sessions.set(id, session);
  attachReaders(session);
  const startInput = await buildStartInput(compiled);
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
  const player = playerById(session, input.playerId);
  const choice = sanitizeChoiceForRuleSet(input.choice.trim(), session.snapshot.ruleSet, session.snapshot.mode, player?.allowedSpecialSystems);
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
  const player = playerById(session, input.playerId);
  const choice = sanitizeChoiceForRuleSet(input.choice.trim(), session.snapshot.ruleSet, session.snapshot.mode, player?.allowedSpecialSystems);
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
  const fallbackChoice = choice.split(",").some(part => part.trim() === "pass")
    ? choice.split(",").map((part, index) =>
      part.trim() === "pass" && actions.some(action => action.requestActiveIndex === index)
        ? trainerItemPlaceholderChoice(request, index)
        : part.trim()
    ).join(", ")
    : choice;
  assertChoiceValidForSession(session, input.playerId, fallbackChoice, "human");
  side.clearChoice();
  const accepted = side.choose(fallbackChoice);
  if (accepted && fallbackChoice !== choice) session.snapshot.debug.inputLog.push(`[BattleV4][trainer-item-placeholder] ${choice} -> ${fallbackChoice}`);
  if (!accepted) throw new Error(side.choice?.error || "战斗道具占位指令无效。");
  const sideActions = side.choice.actions || [];
  for (const trainerAction of actions) {
    const existingIndex = sideActions.findIndex((entry: any) => entry?.pokemon === trainerAction.pokemon);
    if (existingIndex >= 0) sideActions[existingIndex] = trainerAction;
    else sideActions.splice(Math.min(trainerAction.requestActiveIndex, sideActions.length), 0, trainerAction);
  }
  side.choice.actions = sideActions;
  session.snapshot.debug.lastChoices.push({playerId: input.playerId, choice: `[trainer-item] ${fallbackChoice}`, at: new Date().toISOString()});
  session.snapshot.debug.inputLog.push(`>${input.playerId} ${fallbackChoice} [trainer-item]`);
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

export async function applyPermanentFormeChange(input: BattleServicePermanentFormeChangeInputV4): Promise<BattleServicePermanentFormeChangeResultV4> {
  const session = getSession(input.sessionId);
  const battle = (session.stream as any).battle;
  const side = battleSide(session, input.playerId);
  if (!battle || !side) {
    return {ok: false, message: "当前对战尚未开始。", snapshot: clone(session.snapshot)};
  }
  if (session.snapshot.status !== "running" || battle.ended) {
    return {ok: false, message: "当前对战已经结束。", snapshot: clone(session.snapshot)};
  }
  const activeIndex = Math.max(0, Math.floor(Number(input.activeIndex || 0)));
  const pokemon = side.active?.[activeIndex];
  if (!pokemon || pokemon.fainted) {
    return {ok: false, message: "目标宝可梦不在场。", snapshot: clone(session.snapshot)};
  }
  const toSpeciesId = normalizeIdentityToken(input.toSpeciesId);
  if (!toSpeciesId) {
    return {ok: false, message: "目标形态无效。", snapshot: clone(session.snapshot)};
  }
  const request = session.snapshot.requests[input.playerId];
  if (!request || request.wait || request.teamPreview || request.forceSwitch?.some(Boolean) || !request.active?.length) {
    return {ok: false, message: "当前不是可行动回合。", snapshot: clone(session.snapshot)};
  }
  const fromDetails = String(pokemon.details || pokemon.species?.name || "");
  const evolutionEffect = battle.dex.conditions.get("evolution");
  const changed = pokemon.formeChange(toSpeciesId, evolutionEffect, true);
  if (!changed) {
    return {ok: false, message: "形态变化失败。", snapshot: clone(session.snapshot), fromDetails};
  }
  if (input.message) battle.add("-message", String(input.message));
  battle.makeRequest();
  battle.sendUpdates();
  touch(session);
  await waitForRequests(session, 700);
  return {
    ok: true,
    message: "形态变化完成。",
    snapshot: clone(session.snapshot),
    fromDetails,
    toDetails: String(pokemon.details || pokemon.species?.name || ""),
  };
}

function trainerItemPlaceholderChoice(request: BattleServiceRequestV4, activeIndex: number): string {
  const active = request.active?.[activeIndex];
  const moveIndex = active?.moves?.findIndex(move => !move.disabled) ?? -1;
  if (!active || moveIndex < 0) return "pass";
  const move = moveRequestForRuntimeChoice(active, moveIndex);
  return `move ${moveIndex + 1}${defaultTargetSuffix(request, activeIndex, move, Boolean(request.targetable || (request.active || []).length > 1))}`;
}

export async function getSnapshot(sessionId: string): Promise<BattleServiceSnapshotV4> {
  const session = getSession(sessionId);
  await flushReadyAutoChoices(session);
  return clone(session.snapshot);
}

export async function getPlaybackTimeline(sessionId: string, previousIndex = 0): Promise<ShowdownPlaybackTimelineV4> {
  const session = getSession(sessionId);
  await flushReadyAutoChoices(session);
  const rawLogLength = session.snapshot.rawLog.length;
  const cacheKey = `${sessionId}:${rawLogLength}`;
  let compiled = playbackTimelineCache.get(cacheKey);
  if (!compiled) {
    clearPlaybackTimelineCacheForSession(sessionId);
    compiled = compileShowdownPlaybackTimelineFromRawLog(session.snapshot.rawLog, {sessionId, previousIndex: 0});
    playbackTimelineCache.set(cacheKey, compiled);
  }
  const rawFrom = Math.max(0, Math.min(rawLogLength, Math.floor(Number(previousIndex) || 0)));
  return clone({
    ...compiled,
    rawFrom,
    groups: rawFrom
      ? compiled.groups.filter(group => !group.rawIndices.length || group.rawIndices.some(index => index >= rawFrom))
      : compiled.groups,
  });
}

export function __testApplyBattleProtocolLinesV4(snapshot: BattleServiceSnapshotV4, lines: string[]): BattleServiceSnapshotV4 {
  const noopStream: StreamLike = {
    write() {},
    async *[Symbol.asyncIterator]() {},
  };
  const session: RuntimeSession = {
    id: snapshot.id,
    stream: noopStream,
    streams: {omniscient: noopStream, p1: noopStream, p2: noopStream, p3: noopStream, p4: noopStream},
    snapshot: clone(snapshot),
    lastRequests: {},
    invalidChoiceStreaks: {},
    aiTasks: {},
    closed: false,
  };
  session.snapshot.rawLog.push(...lines);
  applyRawChunk(session, lines.join("\n"));
  return clone(session.snapshot);
}

export async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    session.closed = true;
    session.aiTasks = {};
    sessions.delete(sessionId);
    clearPlaybackTimelineCacheForSession(sessionId);
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
  if (!showdownMoveNeedsExplicitTargetV4(move, targetable)) return "";
  const target = showdownNormalizeMoveTargetV4(move.target);
  if (target === "adjacentally" || target === "adjacentallyorself") {
    const allyIndex = request.active?.findIndex((active, index) => index !== activeIndex && Boolean(active)) ?? -1;
    return allyIndex >= 0 ? ` -${allyIndex + 1}` : "";
  }
  const foeCount = Math.max(1, request.active?.length || 1);
  return ` +${Math.min(activeIndex + 1, foeCount)}`;
}

function moveRequestForRuntimeChoice(active: NonNullable<BattleServiceRequestV4["active"]>[number], moveIndex: number): BattleServiceMoveRequestV4 {
  const baseMove = active?.moves?.[moveIndex];
  if (!active?.canDynamax) {
    const maxMoves = Array.isArray(active?.maxMoves) ? active?.maxMoves : active?.maxMoves?.maxMoves;
    return maxMoves?.[moveIndex] || baseMove || {move: "", id: ""};
  }
  return baseMove || {move: "", id: ""};
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
    if (!isAutoChoicePlayer(player) || !shouldAutoChoose(request)) {
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
    if (!isAutoChoicePlayer(player) || !request || !task) continue;
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

function isAutoChoicePlayer(player: BattleServicePlayerInputV4): boolean {
  return player.controller === "ai" || player.controller === "script";
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
      const ppEval = initialMovePpEval(player.playerId, slot, pokemon.movePp);
      if (ppEval) commands.push(`>eval ${ppEval}`);
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

function initialMovePpEval(playerId: ShowdownPlayerIdV4, slot: number, movePp: BattleServicePokemonSetV4["movePp"] | undefined): string {
  const patches = (movePp || [])
    .map(move => ({
      id: normalizeIdentityToken(move.moveId),
      pp: Math.max(0, Math.floor(Number(move.remainingPp ?? move.maxPp ?? 0) || 0)),
    }))
    .filter(move => move.id);
  if (!patches.length) return "";
  const sideIndex = Number(playerId.slice(1)) - 1;
  const pokemonIndex = Math.max(0, slot - 1);
  return [
    `const p = battle.sides[${sideIndex}]?.pokemon?.[${pokemonIndex}]`,
    `const patches = ${JSON.stringify(patches)}`,
    "const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')",
    "if (p?.moveSlots) for (const patch of patches) { const slot = p.moveSlots.find(m => norm(m.id || m.move) === patch.id); if (slot) slot.pp = Math.max(0, Math.min(Number(slot.maxpp ?? slot.pp ?? patch.pp) || patch.pp, patch.pp)); }",
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
  const player = playerById(session, playerId);
  const initialChoice = sanitizeChoiceForRuleSet(choice, session.snapshot.ruleSet, session.snapshot.mode, player?.allowedSpecialSystems);
  if (initialChoice !== choice) {
    session.snapshot.debug.inputLog.push(`[BattleV4][ruleset-special-filter] ${session.snapshot.ruleSet} sanitized ${source} choice: ${choice} -> ${initialChoice}`);
  }
  const sanitizedChoice = resolveValidChoiceForWrite(session, playerId, initialChoice, source);
  if (!sanitizedChoice) return;
  session.snapshot.debug.lastChoices.push({playerId, choice: sanitizedChoice, at: new Date().toISOString()});
  session.snapshot.debug.inputLog.push(`>${playerId} ${sanitizedChoice}`);
  if (session.snapshot.requests[playerId]) session.lastRequests[playerId] = clone(session.snapshot.requests[playerId]);
  delete session.snapshot.requests[playerId];
  try {
    await session.streams[playerId].write(sanitizedChoice);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    session.snapshot.status = "blocked";
    session.snapshot.error = `[${source}] ${playerId} choice failed: ${sanitizedChoice}; ${message}`;
    session.snapshot.debug.inputLog.push(`[BattleV4][error] ${session.snapshot.error}`);
    touch(session);
    throw error;
  }
}

function assertChoiceValidForSession(session: RuntimeSession, playerId: ShowdownPlayerIdV4, choice: string, source: "human" | "ai" | "team-preview"): void {
  const validation = validateChoiceForSession(session, playerId, choice);
  if (validation.ok) return;
  recordPreflightInvalidChoice(session, playerId, source, validation);
  throw new Error(validation.playerMessage);
}

function resolveValidChoiceForWrite(session: RuntimeSession, playerId: ShowdownPlayerIdV4, choice: string, source: "human" | "ai" | "team-preview"): string | null {
  canonicalizeBattleRosterKeys(session);
  const invariantErrors = battleRosterInvariantErrors(session);
  if (invariantErrors.length) {
    session.snapshot.status = "blocked";
    session.snapshot.error = `[battle-roster-invariant] ${invariantErrors.join("; ")}`;
    session.snapshot.debug.inputLog.push(`[BattleV4][blocked] ${session.snapshot.error}`);
    touch(session);
    if (source === "human") throw new Error(session.snapshot.error);
    return null;
  }
  const validation = validateChoiceForSession(session, playerId, choice);
  if (validation.ok) return validation.choice;
  recordPreflightInvalidChoice(session, playerId, source, validation);
  if (source === "human") throw new Error(validation.playerMessage);
  const fallback = fallbackLegalChoiceV4(session.snapshot.requests[playerId]);
  const fallbackValidation = validateChoiceForSession(session, playerId, fallback);
  if (fallback && fallbackValidation.ok) {
    session.snapshot.debug.inputLog.push(`[BattleV4][${source}-fallback][${playerId}] ${choice} -> ${fallback}; reason=${validation.reason}`);
    return fallbackValidation.choice;
  }
  session.snapshot.status = "blocked";
  session.snapshot.error = `[${source}-invalid-choice] ${playerId}: ${validation.message}; fallback=${fallback || "(empty)"}; ${fallbackValidation.ok ? "" : fallbackValidation.message}`;
  session.snapshot.debug.inputLog.push(`[BattleV4][blocked] ${session.snapshot.error}; request=${choiceValidationRequestDebug(session, playerId)}`);
  delete session.aiTasks[playerId];
  touch(session);
  return null;
}

function validateChoiceForSession(session: RuntimeSession, playerId: ShowdownPlayerIdV4, choice: string): ShowdownChoiceValidationResultV4 {
  return validateShowdownChoiceCommandV4({
    request: session.snapshot.requests[playerId],
    choice,
  });
}

function battleRosterInvariantErrors(session: RuntimeSession): string[] {
  const errors: string[] = [];
  for (const [playerId, roster] of Object.entries(session.snapshot.battleRosterByPlayer || {}) as Array<[ShowdownPlayerIdV4, BattleRosterStateV4]>) {
    for (const [slot, key] of Object.entries(roster.activeKeyBySlot || {})) {
      if (!roster.pokemonByKey[key]) errors.push(`${playerId} ${slot} points to missing battleKey ${key}`);
    }
    const canonicalSeen = new Map<string, string>();
    for (const [key, pokemon] of Object.entries(roster.pokemonByKey || {})) {
      const canonical = battleKeyFromRosterIdentityV4(playerId, pokemon);
      if (canonical) {
        if (key !== canonical) errors.push(`${playerId} roster key ${key} must be ${canonical}`);
        const previous = canonicalSeen.get(canonical);
        if (previous && previous !== key) errors.push(`${playerId} duplicate canonical battleKey ${canonical}: ${previous}, ${key}`);
        canonicalSeen.set(canonical, key);
      } else if (!isProtocolBattleKeyV4(key)) {
        errors.push(`${playerId} roster key ${key} has no pokeball and is not protocol key`);
      }
    }
  }
  return errors;
}

function canonicalizeBattleRosterKeys(session: RuntimeSession): void {
  const previousByPlayer = session.snapshot.battleRosterByPlayer || {};
  let changed = false;
  const nextByPlayer = {...previousByPlayer};
  for (const [playerId, roster] of Object.entries(previousByPlayer) as Array<[ShowdownPlayerIdV4, BattleRosterStateV4]>) {
    const keyMap = new Map<string, string>();
    const pokemonByKey: Record<string, BattleRosterPokemonV4> = {};
    for (const [key, pokemon] of Object.entries(roster.pokemonByKey || {})) {
      const canonical = battleKeyFromRosterIdentityV4(playerId, pokemon);
      const nextKey = canonical || key;
      if (nextKey !== key) {
        changed = true;
        keyMap.set(key, nextKey);
      }
      pokemonByKey[nextKey] = {...pokemon, key: nextKey};
    }
    if (!keyMap.size) continue;
    const remap = (value: string) => keyMap.get(value) || value;
    nextByPlayer[playerId] = {
      ...roster,
      pokemonByKey,
      activeKeyBySlot: Object.fromEntries(Object.entries(roster.activeKeyBySlot || {}).map(([slot, key]) => [slot, remap(key)])),
      lastPokemonKeyBySlot: Object.fromEntries(Object.entries(roster.lastPokemonKeyBySlot || {}).map(([slot, key]) => [slot, remap(key)])),
      updatedAt: new Date().toISOString(),
    };
  }
  if (changed) {
    session.snapshot.battleRosterByPlayer = nextByPlayer;
    session.snapshot.debug.inputLog.push("[BattleV4][roster-canonicalize] migrated battle roster keys to playerId:pokeball");
    touch(session);
  }
}

function recordPreflightInvalidChoice(session: RuntimeSession, playerId: ShowdownPlayerIdV4, source: string, validation: Exclude<ShowdownChoiceValidationResultV4, {ok: true}>): void {
  session.snapshot.debug.inputLog.push(`[BattleV4][invalid-choice][${source}][${playerId}] reason=${validation.reason} choice=${validation.choice}; ${validation.message}; request=${choiceValidationRequestDebug(session, playerId)}`);
  touch(session);
}

function choiceValidationRequestDebug(session: RuntimeSession, playerId: ShowdownPlayerIdV4): string {
  const request = session.snapshot.requests[playerId] || session.lastRequests[playerId];
  if (!request) return "missing";
  return JSON.stringify({
    rqid: request.rqid,
    wait: request.wait,
    teamPreview: request.teamPreview,
    targetable: request.targetable,
    forceSwitch: request.forceSwitch,
    active: request.active?.map((active, index) => ({
      exists: Boolean(active),
      condition: request.side?.pokemon?.[index]?.condition,
      active: request.side?.pokemon?.[index]?.active,
      moves: active?.moves?.map(move => ({id: move.id, move: move.move, target: move.target, disabled: move.disabled, pp: move.pp})),
      maxMoves: Array.isArray(active?.maxMoves) ? active?.maxMoves?.map(move => ({id: move.id, move: move.move, target: move.target, disabled: move.disabled, pp: move.pp})) : active?.maxMoves?.maxMoves?.map(move => ({id: move.id, move: move.move, target: move.target, disabled: move.disabled, pp: move.pp})),
      zMoves: active?.zMoves?.map(move => move ? ({id: move.id, move: move.move, target: move.target, disabled: move.disabled, pp: move.pp}) : null),
    })),
  });
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
        const player = playerById(session, playerId);
        const sanitizedRequest = sanitizeRequestForRuleSet(request, session.snapshot.ruleSet, session.snapshot.mode, player?.allowedSpecialSystems);
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
  session.snapshot.debug.latestRequests = {
    ...(session.snapshot.debug.latestRequests || {}),
    [playerId]: clone(request),
  };
  rememberLatestMovePp(session, playerId, request);
  patchTeamStateFromRequest(session, playerId, request);
  const pokemon = request.side?.pokemon;
  if (!pokemon?.length) return;
  session.snapshot.debug.latestSidePokemon = {
    ...(session.snapshot.debug.latestSidePokemon || {}),
    [playerId]: clone(pokemon),
  };
}

function patchTeamStateFromRequest(session: RuntimeSession, playerId: ShowdownPlayerIdV4, request: BattleServiceRequestV4): void {
  const rows = request.side?.pokemon || [];
  if (!rows.length) return;
  const activeRows = rows.filter(row => row.active);
  rows.forEach(row => {
    const token = teamStateTokenForRow(row);
    if (!token) return;
    const condition = parseCondition(row.condition || "");
    upsertTeamPokemonState(session, playerId, token, {
      ...identityForTeamState(session, playerId, token),
      pokeball: row.pokeball || token,
      ident: row.ident,
      details: row.details,
      hp: condition.hp,
      maxHp: condition.maxHp,
      status: condition.status,
      fainted: Boolean(row.fainted || condition.fainted),
    });
  });
  activeRows.forEach((row, activeIndex) => {
    const token = teamStateTokenForRow(row);
    const moves = request.active?.[activeIndex]?.moves || [];
    if (!token || !moves.length) return;
    upsertTeamPokemonState(session, playerId, token, {
      ...identityForTeamState(session, playerId, token),
      pokeball: row.pokeball || token,
      ident: row.ident,
      details: row.details,
      moves: moves
        .filter(move => move.id || move.move)
        .map(move => ({
          moveId: normalizeIdentityToken(move.id || move.move),
          remainingPp: Math.max(0, Number(move.pp ?? 0) || 0),
          maxPp: Math.max(0, Number(move.maxpp ?? move.pp ?? 0) || 0),
        })),
    });
  });
}

function rememberLatestMovePp(session: RuntimeSession, playerId: ShowdownPlayerIdV4, request: BattleServiceRequestV4): void {
  const activeRows = request.side?.pokemon?.filter(row => row.active) || [];
  if (!activeRows.length || !request.active?.length) return;
  const previous = session.snapshot.debug.latestMovePpByPokemon?.[playerId] || {};
  const next = {...previous};
  activeRows.forEach((row, activeIndex) => {
    const token = normalizeIdentityToken(row.pokeball || row.ident || row.details);
    const moves = request.active?.[activeIndex]?.moves || [];
    if (!token || !moves.length) return;
    next[token] = clone(moves);
  });
  session.snapshot.debug.latestMovePpByPokemon = {
    ...(session.snapshot.debug.latestMovePpByPokemon || {}),
    [playerId]: next,
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

function sanitizeRequestForRuleSet(request: BattleServiceRequestV4, ruleSet: string, mode: string, allowedSystems?: readonly BattleSpecialSystemV4[]): BattleServiceRequestV4 {
  if (!request.active?.length) return request;
  return {
    ...request,
    active: request.active.map(active => {
      if (!active) return active;
      const allowed = allowedSpecialSystemsForRuleSet(ruleSet, mode, allowedSystems);
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

function sanitizeChoiceForRuleSet(choice: string, ruleSet: string, mode: string, allowedSystems?: readonly BattleSpecialSystemV4[]): string {
  return filterShowdownChoiceForRuleSetV4(choice, ruleSet, mode, allowedSystems);
}

function allowedSpecialSystemsForRuleSet(ruleSet: string, mode: string, allowedSystems?: readonly BattleSpecialSystemV4[]): {mega: boolean; zmove: boolean; max: boolean; tera: boolean} {
  const allow = (system: BattleSpecialSystemV4) => showdownSpecialSystemAllowedForRuleSetV4(system, ruleSet, mode) && Boolean(allowedSystems?.includes(system));
  return {
    mega: allow("mega"),
    zmove: allow("zmove"),
    max: allow("max"),
    tera: allow("terastallize"),
  };
}

function applyRawChunk(session: RuntimeSession, chunk: string): void {
  for (const line of chunk.split("\n")) {
    const parts = line.split("|");
    if (parts[1] === "turn") {
      session.snapshot.turn = Number(parts[2]) || session.snapshot.turn;
    }
    if (parts[1] === "upkeep") {
      clearRosterLastPokemonKeys(session);
    }
    if (parts[1] === "switch" || parts[1] === "drag" || parts[1] === "replace") {
      upsertActive(session, parts[2] || "", parts[3] || "", parts[4] || "");
    }
    if (parts[1] === "detailschange") {
      patchDetailsChange(session, parts[2] || "", parts[3] || "");
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
      patchActiveCondition(session, parts[2] || "", "0 fnt", {clearActiveSlot: true});
    }
    if (parts[1] === "win") {
      const winnerName = parts[2] || "";
      session.snapshot.winner = resolveBattleWinnerPlayerIdV4(session.snapshot.players, winnerName);
      session.snapshot.status = "ended";
    }
    if (parts[1] === "tie") {
      session.snapshot.winner = null;
      session.snapshot.status = "ended";
    }
  }
}

function currentActiveCondition(session: RuntimeSession, ident: string): string {
  const parsed = parseIdent(ident);
  if (!parsed) return "0/1";
  const rosterEntry = activeRosterPokemon(session, parsed.playerId, parsed.slot);
  if (rosterEntry?.condition) return rosterEntry.condition;
  const active = session.snapshot.active.find(entry => entry.slot === parsed.slot || entry.ident === parsed.ident);
  if (active?.condition) return active.condition;
  const row = activeSidePokemonRow(session, parsed.playerId, parsed.slot);
  return row?.condition || "0/1";
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
  syncTrainerItemTargetLocalPokemon(session, playerId, player, resolved.localPokemon, resolved.mapping?.teamIndex ?? resolved.teamIndex, action.targetKey, battlePokemon);
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
    order: 4,
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
  session.snapshot.debug.inputLog.push(`[BattleV4][trainer-item] ${playerId} active=${action.requestActiveIndex} item=${action.itemId} target=${action.targetLocalPokemonId}${result.noEffect ? " noEffect=true" : ""}`);
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

function syncTrainerItemTargetLocalPokemon(
  session: RuntimeSession,
  playerId: ShowdownPlayerIdV4,
  player: BattleServicePlayerInputV4,
  localPokemon: LocalPokemonLikeForBattleV4,
  teamIndex: number,
  targetKey: string,
  battlePokemon: any | null,
): LocalPokemonLikeForBattleV4 {
  const key = normalizeIdentityToken(targetKey);
  const rows = session.snapshot.requests[playerId]?.side?.pokemon || session.snapshot.debug.latestSidePokemon?.[playerId] || [];
  const row = rows.find((entry, index) =>
    normalizeIdentityToken(entry.pokeball) === key ||
    normalizeIdentityToken(entry.ident) === key ||
    index === teamIndex
  ) || null;
  const condition = row?.condition ? parseCondition(row.condition) : null;
  const battleHp = battlePokemon ? {
    hp: Math.max(0, Number(battlePokemon.hp ?? localPokemon.entryHp ?? 0) || 0),
    maxHp: Math.max(1, Number(battlePokemon.maxhp ?? localPokemon.maxHp ?? localPokemon.entryHp ?? 1) || 1),
    status: String(battlePokemon.status || localPokemon.entryStatus || ""),
    fainted: Boolean(battlePokemon.fainted) || Number(battlePokemon.hp || 0) <= 0,
  } : null;
  const hp = condition?.hp ?? battleHp?.hp ?? Number(localPokemon.entryHp ?? localPokemon.maxHp ?? 1);
  const maxHp = condition?.maxHp ?? battleHp?.maxHp ?? Math.max(1, Number(localPokemon.maxHp || hp || 1));
  const status = condition?.status ?? battleHp?.status ?? String(localPokemon.entryStatus || "");
  const fainted = condition?.fainted ?? battleHp?.fainted ?? hp <= 0;
  const moves = syncTrainerItemTargetMoves(session, playerId, row, localPokemon, battlePokemon);
  const synced = {
    ...localPokemon,
    moves,
    entryHp: Math.max(0, hp),
    maxHp: Math.max(1, maxHp),
    entryStatus: fainted ? "fnt" : status,
  };
  player.draft = {
    ...player.draft,
    localTeam: {
      ...player.draft.localTeam,
      pokemon: player.draft.localTeam.pokemon.map(pokemon => pokemon.localPokemonId === synced.localPokemonId ? synced : pokemon),
    },
  };
  session.snapshot.debug.inputLog.push(`[BattleV4][trainer-item-sync] ${playerId} target=${targetKey} hp=${synced.entryHp}/${synced.maxHp} status=${synced.entryStatus || ""}`);
  return synced;
}

function syncTrainerItemTargetMoves(
  session: RuntimeSession,
  playerId: ShowdownPlayerIdV4,
  row: BattleServiceSidePokemonV4 | null,
  localPokemon: LocalPokemonLikeForBattleV4,
  battlePokemon: any | null,
): LocalPokemonLikeForBattleV4["moves"] {
  const battleSlots = (battlePokemon?.moveSlots || []) as Array<{id?: string; move?: string; pp?: number; maxpp?: number; maxPp?: number}>;
  const key = row ? normalizeIdentityToken(row.pokeball || row.ident || row.details) : "";
  const latestMoves = key ? session.snapshot.debug.latestMovePpByPokemon?.[playerId]?.[key] || [] : [];
  return (localPokemon.moves || []).map(move => {
    const moveId = normalizeIdentityToken(move.moveId);
    const battleSlot = battleSlots.find(slot => normalizeIdentityToken(slot.id || slot.move) === moveId);
    if (battleSlot) {
      return {
        ...move,
        remainingPp: Math.max(0, Number(battleSlot.pp ?? (move as any).remainingPp ?? 0) || 0),
        maxPp: Math.max(0, Number(battleSlot.maxpp ?? battleSlot.maxPp ?? (move as any).maxPp ?? battleSlot.pp ?? 0) || 0),
      } as any;
    }
    const latestMove = latestMoves.find(entry => normalizeIdentityToken(entry.id || entry.move) === moveId);
    if (latestMove) {
      return {
        ...move,
        remainingPp: Math.max(0, Number(latestMove.pp ?? (move as any).remainingPp ?? 0) || 0),
        maxPp: Math.max(0, Number(latestMove.maxpp ?? (move as any).maxPp ?? latestMove.pp ?? 0) || 0),
      } as any;
    }
    return {...move};
  });
}

function findBattlePokemon(session: RuntimeSession, playerId: ShowdownPlayerIdV4, teamIndex: number, targetKey: string): any | null {
  const battle = (session.stream as any).battle;
  const sideIndex = Number(playerId.slice(1)) - 1;
  const side = battle?.sides?.[sideIndex];
  if (!side) return null;
  const key = normalizeIdentityToken(targetKey);
  return side.pokemon?.find((pokemon: any, index: number) => index === teamIndex || normalizeIdentityToken(pokemon.set?.pokeball) === key) || null;
}

function applyTrainerItemEffectToBattlePokemon(session: RuntimeSession, pokemon: any, effect: RecoveryEffect, result: ReturnType<typeof applyTrainerItemEffectToLocalPokemon>, itemName: string): void {
  const battle = (session.stream as any).battle;
  if (!battle || !pokemon) return;
  battle.add("-message", `${displayBattlePokemonName(pokemon)} 使用了 ${itemName}。`);
  if (result.noEffect) {
    battle.add("-message", "但是没有效果。");
    battle.sendUpdates?.();
    return;
  }
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
  {pokemon: LocalPokemonLikeForBattleV4; hpRecovered: number; ppRecovered: number; statusCured: boolean; noEffect: boolean} {
  const beforeHp = Number(pokemon.entryHp ?? pokemon.maxHp ?? 1);
  const maxHp = Math.max(1, Number(pokemon.maxHp || beforeHp || 1));
  const fainted = beforeHp <= 0;
  let next = {...pokemon, moves: (pokemon.moves || []).map(move => ({...move}))};
  let hpRecovered = 0;
  let ppRecovered = 0;
  let statusCured = false;
  if (effect.revive) {
    if (fainted) {
      next.entryHp = effect.revive === "full" ? maxHp : Math.max(1, Math.floor(maxHp / 2));
      next.entryStatus = "";
      hpRecovered = next.entryHp;
      statusCured = Boolean(pokemon.entryStatus);
    }
  } else if (effect.hp) {
    if (!fainted) {
      const target = hpTargetForBattleEffect(effect.hp, beforeHp, maxHp);
      next.entryHp = Math.min(maxHp, Math.max(beforeHp, target));
      hpRecovered = Math.max(0, next.entryHp - beforeHp);
    }
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
  return {pokemon: next, hpRecovered, ppRecovered, statusCured, noEffect: hpRecovered <= 0 && ppRecovered <= 0 && !statusCured};
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
  if (status === "fnt") return false;
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

function upsertActive(session: RuntimeSession, ident: string, details: string, condition: string, options: {preserveExistingIdentity?: boolean} = {}): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  const nextCondition = condition || "0/1";
  const hp = parseCondition(nextCondition);
  const existingRoster = activeRosterPokemon(session, parsed.playerId, parsed.slot);
  const existingActive = session.snapshot.active.find(active => active.slot === parsed.slot);
  const existing = existingRoster ? activeFromRosterPokemon(existingRoster) : existingActive;
  const identity = options.preserveExistingIdentity && existing
    ? identityFromActive(existing)
    : activeIdentityFromRequest(session, parsed.playerId, parsed.slot, undefined, details, parsed.name);
  const key = options.preserveExistingIdentity && existingRoster
    ? existingRoster.key
    : battleRosterKeyForSwitch(session, parsed, identity);
  const rosterPokemon: BattleRosterPokemonV4 = {
    key,
    searchId: battleRosterSearchId(parsed.ident, details),
    ident: parsed.ident,
    canonicalIdent: canonicalIdentFromParsed(parsed),
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
  upsertRosterPokemon(session, parsed.playerId, rosterPokemon, parsed.slot);
  deriveActiveFromRoster(session, parsed.playerId);
  const token = teamStateTokenForIdentity(identity) || teamStateTokenForActive(activeFromRosterPokemon(rosterPokemon));
  if (token) {
    upsertTeamPokemonState(session, parsed.playerId, token, {
      ...identity,
      ident: parsed.ident,
      details,
      hp: hp.hp,
      maxHp: hp.maxHp,
      status: hp.status,
      fainted: hp.fainted,
    });
  }
}

function patchDetailsChange(session: RuntimeSession, ident: string, details: string): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  if (parsed.slotExplicit) {
    upsertActive(session, ident, details, currentActiveCondition(session, ident), {preserveExistingIdentity: true});
    return;
  }
  const roster = session.snapshot.battleRosterByPlayer?.[parsed.playerId];
  const canonicalIdent = canonicalIdentFromParsed(parsed);
  const rosterEntry = Object.values(roster?.pokemonByKey || {}).find(entry => {
    if (Object.values(roster?.activeKeyBySlot || {}).includes(entry.key)) return false;
    return entry.canonicalIdent === canonicalIdent || entry.ident.replace(/^p([1-4])[a-z]:/i, "p$1:") === canonicalIdent;
  });
  if (!rosterEntry) {
    session.snapshot.debug.inputLog.push(`[BattleV4][detailschange-inactive-miss] ${ident} ${details}`);
    return;
  }
  const patchedRoster = {
    ...rosterEntry,
    searchId: battleRosterSearchId(canonicalIdent, details),
    ident: canonicalIdent,
    canonicalIdent,
    species: details.split(",")[0]?.trim() || rosterEntry.species,
    details,
  };
  upsertRosterPokemon(session, parsed.playerId, patchedRoster);
  const token = teamStateTokenForIdentity(patchedRoster) || normalizeIdentityToken(patchedRoster.ident);
  if (token) {
    upsertTeamPokemonState(session, parsed.playerId, token, {
      ...identityFromActive(activeFromRosterPokemon(patchedRoster)),
      ident: canonicalIdent,
      details,
    });
  }
}

function battleRosterKeyForSwitch(
  session: RuntimeSession,
  parsed: {playerId: ShowdownPlayerIdV4},
  identity: {localPokemonId?: string; showdownIdentityToken?: string; showdownId?: string; pokeballId?: string; pokeball?: string},
): string {
  const stableKey = battleRosterStableKey(session, parsed.playerId, identity);
  return stableKey || protocolBattleRosterKey(session, parsed.playerId);
}

function activeIdentityFromRequest(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string, existing?: BattleServiceActivePokemonV4, details = "", name = ""): {
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
} {
  const player = session.snapshot.players.find(entry => entry.playerId === playerId);
  const row = switchedSidePokemonRow(session, playerId, slot, existing, details, name);
  const token = firstIdentityToken(row?.pokeball);
  const mapping = mappingEntryForIdentityToken(player?.teamMapping || [], token);
  return {
    localPokemonId: mapping?.localPokemonId,
    showdownIdentityToken: mapping?.showdownIdentityToken || token || undefined,
    showdownId: mapping?.showdownId || token || undefined,
    pokeballId: mapping?.pokeballId || token || undefined,
    pokeball: row?.pokeball || token || undefined,
  };
}

function identityFromActive(active: BattleServiceActivePokemonV4): {
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
} {
  return {
    localPokemonId: active.localPokemonId,
    showdownIdentityToken: active.showdownIdentityToken,
    showdownId: active.showdownId,
    pokeballId: active.pokeballId,
    pokeball: active.pokeball,
  };
}

function upsertRosterPokemon(session: RuntimeSession, playerId: ShowdownPlayerIdV4, pokemon: BattleRosterPokemonV4, activeSlot?: string): void {
  const previousByPlayer = session.snapshot.battleRosterByPlayer || {};
  const previous = previousByPlayer[playerId] || {pokemonByKey: {}, activeKeyBySlot: {}, lastPokemonKeyBySlot: {}, updatedAt: ""};
  const legacyKeys = legacyBattleRosterKeysForPokemon(previous, playerId, pokemon);
  const current = previous.pokemonByKey[pokemon.key] || legacyKeys.map(key => previous.pokemonByKey[key]).find(Boolean);
  const nextPokemon = {...current, ...pokemon};
  const activeKeyBySlot = {...previous.activeKeyBySlot};
  const lastPokemonKeyBySlot = {...previous.lastPokemonKeyBySlot};
  for (const legacyKey of legacyKeys) {
    if (legacyKey === pokemon.key) continue;
    for (const [slot, key] of Object.entries(activeKeyBySlot)) {
      if (key === legacyKey) activeKeyBySlot[slot] = pokemon.key;
    }
    for (const [slot, key] of Object.entries(lastPokemonKeyBySlot)) {
      if (key === legacyKey) lastPokemonKeyBySlot[slot] = pokemon.key;
    }
  }
  if (activeSlot) {
    const previousActiveKey = activeKeyBySlot[activeSlot];
    if (previousActiveKey && previousActiveKey !== pokemon.key) lastPokemonKeyBySlot[activeSlot] = previousActiveKey;
    for (const [slot, key] of Object.entries(activeKeyBySlot)) {
      if (key === pokemon.key && slot !== activeSlot) delete activeKeyBySlot[slot];
    }
    activeKeyBySlot[activeSlot] = pokemon.key;
  }
  session.snapshot.battleRosterByPlayer = {
    ...previousByPlayer,
    [playerId]: {
      pokemonByKey: {
        ...Object.fromEntries(Object.entries(previous.pokemonByKey).filter(([key]) => key === pokemon.key || !legacyKeys.includes(key))),
        [pokemon.key]: nextPokemon,
      },
      activeKeyBySlot,
      lastPokemonKeyBySlot,
      updatedAt: new Date().toISOString(),
    },
  };
}

function clearRosterLastPokemonKeys(session: RuntimeSession): void {
  const previousByPlayer = session.snapshot.battleRosterByPlayer || {};
  session.snapshot.battleRosterByPlayer = Object.fromEntries(Object.entries(previousByPlayer).map(([playerId, roster]) => [
    playerId,
    {
      ...roster,
      lastPokemonKeyBySlot: {},
      updatedAt: new Date().toISOString(),
    },
  ])) as Record<ShowdownPlayerIdV4, BattleRosterStateV4>;
}

function activeRosterPokemon(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string): BattleRosterPokemonV4 | null {
  const roster = session.snapshot.battleRosterByPlayer?.[playerId];
  const key = roster?.activeKeyBySlot?.[slot];
  return key ? roster?.pokemonByKey?.[key] || null : null;
}

function deriveActiveFromRoster(session: RuntimeSession, playerId: ShowdownPlayerIdV4): void {
  const roster = session.snapshot.battleRosterByPlayer?.[playerId];
  if (!roster) return;
  const rosterActives = Object.entries(roster.activeKeyBySlot)
    .map(([slot, key]) => {
      const pokemon = roster.pokemonByKey[key];
      return pokemon ? activeFromRosterPokemon({...pokemon, slot}) : null;
    })
    .filter((entry): entry is BattleServiceActivePokemonV4 => Boolean(entry));
  session.snapshot.active = [
    ...session.snapshot.active.filter(active => active.playerId !== playerId),
    ...rosterActives,
  ].sort((a, b) => a.slot.localeCompare(b.slot));
}

function activeFromRosterPokemon(pokemon: BattleRosterPokemonV4): BattleServiceActivePokemonV4 {
  return {
    ident: pokemon.ident,
    playerId: pokemon.playerId,
    slot: pokemon.slot || `${pokemon.playerId}a`,
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: pokemon.showdownIdentityToken,
    showdownId: pokemon.showdownId,
    pokeballId: pokemon.pokeballId,
    pokeball: pokemon.pokeball,
    species: pokemon.species,
    details: pokemon.details,
    condition: pokemon.condition,
    hp: pokemon.hp,
    maxHp: pokemon.maxHp,
    status: pokemon.status,
    fainted: pokemon.fainted,
  };
}

function battleRosterStableKey(session: RuntimeSession, playerId: ShowdownPlayerIdV4, identity: {localPokemonId?: string; showdownIdentityToken?: string; showdownId?: string; pokeballId?: string; pokeball?: string}): string {
  const token = normalizeIdentityToken(identity.pokeball || identity.pokeballId || identity.showdownIdentityToken || identity.showdownId);
  if (!token) return "";
  return identityTokenIsUniqueForPlayer(session, playerId, token) ? canonicalBattleKeyV4(playerId, token) : "";
}

function identityTokenIsUniqueForPlayer(session: RuntimeSession, playerId: ShowdownPlayerIdV4, token: string): boolean {
  const player = session.snapshot.players.find(entry => entry.playerId === playerId);
  const mappingMatches = (player?.teamMapping || []).filter(entry =>
    identityTokensMatch(entry.showdownIdentityToken, token) ||
    identityTokensMatch(entry.showdownId, token) ||
    identityTokensMatch(entry.pokeballId, token)
  );
  if (mappingMatches.length > 0) return mappingMatches.length === 1;
  const rows = session.snapshot.requests[playerId]?.side?.pokemon || session.snapshot.debug.latestSidePokemon?.[playerId] || [];
  const rowMatches = rows.filter(row => identityTokensMatch(row.pokeball, token));
  if (rowMatches.length > 0) return rowMatches.length === 1;
  return true;
}

function legacyBattleRosterKeysForPokemon(previous: BattleRosterStateV4, playerId: ShowdownPlayerIdV4, pokemon: BattleRosterPokemonV4): string[] {
  const token = normalizeIdentityToken(pokemon.pokeball || pokemon.pokeballId || pokemon.showdownIdentityToken || pokemon.showdownId);
  const localPokemonId = normalizeIdentityToken(pokemon.localPokemonId);
  return Object.entries(previous.pokemonByKey || {})
    .filter(([key, entry]) => {
      if (key === pokemon.key || entry.playerId !== playerId) return false;
      if (isProtocolBattleKeyV4(key)) return false;
      if (token && [
        entry.pokeball,
        entry.pokeballId,
        entry.showdownIdentityToken,
        entry.showdownId,
      ].some(value => identityTokensMatch(value, token))) return true;
      return Boolean(localPokemonId && normalizeIdentityToken(entry.localPokemonId) === localPokemonId);
    })
    .map(([key]) => key);
}

function protocolBattleRosterKey(session: RuntimeSession, playerId: ShowdownPlayerIdV4): string {
  const roster = session.snapshot.battleRosterByPlayer?.[playerId];
  const used = new Set(Object.keys(roster?.pokemonByKey || {}));
  for (let index = used.size + 1; index < used.size + 10_000; index += 1) {
    const key = `protocol:${playerId}:${index}`;
    if (!used.has(key)) {
      session.snapshot.debug.inputLog.push(`[BattleV4][roster-protocol-key] ${playerId} missing pokeball identity; key=${key}`);
      return key;
    }
  }
  const key = `protocol:${playerId}:${Date.now()}`;
  session.snapshot.debug.inputLog.push(`[BattleV4][roster-protocol-key] ${playerId} missing pokeball identity; key=${key}`);
  return key;
}

function battleRosterSearchId(ident: string, details: string): string {
  const parsed = parseIdent(ident);
  const canonical = parsed ? canonicalIdentFromParsed(parsed) : ident.replace(/^p([1-4])[a-z]:/i, "p$1:");
  return `${canonical}|${details}`;
}

function canonicalIdentFromParsed(parsed: {playerId: ShowdownPlayerIdV4; name: string}): string {
  return `${parsed.playerId}: ${parsed.name}`;
}

function activeSidePokemonRow(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string, existing?: BattleServiceActivePokemonV4, details = "", name = "") {
  const activeIndex = activeIndexFromSlot(slot);
  const rows = session.snapshot.requests[playerId]?.side?.pokemon || session.snapshot.debug.latestSidePokemon?.[playerId] || [];
  const activeRows = rows.filter(row => row.active);
  const activeName = name || parseIdent(existing?.ident || "")?.name || "";
  const activeTokens = speciesTokensForProtocolPokemon(details.split(",")[0] || "", details, activeName);
  const existingToken = firstIdentityToken(existing?.pokeball, existing?.pokeballId, existing?.showdownIdentityToken, existing?.showdownId);
  if (existingToken) {
    const tokenRow = activeRows.find(row => identityTokensMatch(row.pokeball, existingToken) && (!activeTokens.size || protocolRowSpeciesMatches(row, activeTokens)));
    if (tokenRow) return tokenRow;
  }
  const orderedRow = activeRows[activeIndex];
  if (orderedRow && (!activeTokens.size || protocolRowSpeciesMatches(orderedRow, activeTokens))) return orderedRow;
  const speciesRow = activeTokens.size ? activeRows.find(row => protocolRowSpeciesMatches(row, activeTokens)) : null;
  if (speciesRow) return speciesRow;
  return null;
}

function switchedSidePokemonRow(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string, existing?: BattleServiceActivePokemonV4, details = "", name = "") {
  const rows = session.snapshot.requests[playerId]?.side?.pokemon || session.snapshot.debug.latestSidePokemon?.[playerId] || [];
  const activeName = name || parseIdent(existing?.ident || "")?.name || "";
  const activeTokens = speciesTokensForProtocolPokemon(details.split(",")[0] || "", details, activeName);
  if (!activeTokens.size) return activeSidePokemonRow(session, playerId, slot, existing, details, name);
  const currentActiveKeys = new Set(Object.values(session.snapshot.battleRosterByPlayer?.[playerId]?.activeKeyBySlot || {}));
  const lastKeyForSlot = session.snapshot.battleRosterByPlayer?.[playerId]?.lastPokemonKeyBySlot?.[slot] || "";
  const detailsText = normalizeBattleDetailsForMatch(details);
  const candidateRows = rows.filter(row => {
    if (row.fainted || parseCondition(row.condition || "").fainted) return false;
    if (!protocolRowSpeciesMatches(row, activeTokens)) return false;
    const rowKey = canonicalBattleKeyV4(playerId, row.pokeball);
    if (rowKey && rowKey === lastKeyForSlot && !session.snapshot.battleRosterByPlayer?.[playerId]?.activeKeyBySlot?.[slot]) return false;
    return true;
  });
  const inactiveRows = candidateRows.filter(row => !row.active);
  const exactInactive = inactiveRows.find(row => normalizeBattleDetailsForMatch(row.details) === detailsText);
  if (exactInactive) return exactInactive;
  if (inactiveRows.length === 1) return inactiveRows[0];
  const exactAny = candidateRows.find(row => normalizeBattleDetailsForMatch(row.details) === detailsText && !currentActiveKeys.has(canonicalBattleKeyV4(playerId, row.pokeball)));
  if (exactAny) return exactAny;
  const nonCurrentRows = candidateRows.filter(row => !currentActiveKeys.has(canonicalBattleKeyV4(playerId, row.pokeball)));
  if (nonCurrentRows.length === 1) return nonCurrentRows[0];
  return activeSidePokemonRow(session, playerId, slot, existing, details, name);
}

function normalizeBattleDetailsForMatch(details: string): string {
  return details.split(",").map(part => part.trim().toLowerCase()).join(",");
}

function firstIdentityToken(...values: Array<unknown>): string {
  return values.map(value => normalizeIdentityToken(value)).find(Boolean) || "";
}

function identityTokensMatch(value: unknown, token: string): boolean {
  return Boolean(token && normalizeIdentityToken(value) === token);
}

function mappingEntryForIdentityToken(mapping: ShowdownTeamPokemonMappingV4[], token: string): ShowdownTeamPokemonMappingV4 | null {
  if (!token) return null;
  return mapping.find(entry =>
    identityTokensMatch(entry.showdownIdentityToken, token) ||
    identityTokensMatch(entry.showdownId, token) ||
    identityTokensMatch(entry.pokeballId, token)
  ) || null;
}

function protocolRowSpeciesMatches(row: BattleServiceSidePokemonV4, tokens: Set<string>): boolean {
  const rowName = row.ident.split(":").pop() || "";
  const rowTokens = speciesTokensForProtocolPokemon(row.details.split(",")[0] || "", row.details, rowName);
  for (const token of rowTokens) {
    if (tokens.has(token) || tokens.has(baseSpeciesIdForProtocolMatch(token))) return true;
  }
  return false;
}

function speciesTokensForProtocolPokemon(...values: Array<string | undefined>): Set<string> {
  const tokens = values.map(value => normalizeIdentityToken(value)).filter(Boolean);
  return new Set([...tokens, ...tokens.map(baseSpeciesIdForProtocolMatch).filter(Boolean)]);
}

function baseSpeciesIdForProtocolMatch(value: string): string {
  return normalizeIdentityToken(value)
    .replace(/mega(x|y)?$/, "")
    .replace(/gmax$/, "")
    .replace(/alola$/, "")
    .replace(/galar$/, "")
    .replace(/hisui$/, "")
    .replace(/paldea$/, "")
    .replace(/bond$/, "");
}

function activeIndexFromIdent(ident: string): number {
  const parsed = parseIdent(ident);
  return parsed ? activeIndexFromSlot(parsed.slot) : 0;
}

function activeIndexFromSlot(slot: string): number {
  const suffix = slot.replace(/^p[1-4]/i, "").toLowerCase();
  return suffix ? Math.max(0, suffix.charCodeAt(0) - 97) : 0;
}

function patchActiveCondition(session: RuntimeSession, ident: string, condition: string, options: {clearActiveSlot?: boolean} = {}): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  const hp = parseCondition(condition);
  const rosterEntry = activeRosterPokemon(session, parsed.playerId, parsed.slot);
  if (rosterEntry) {
    const patchedRoster = {
      ...rosterEntry,
      ident: parsed.ident,
      canonicalIdent: canonicalIdentFromParsed(parsed),
      condition,
      hp: hp.hp,
      maxHp: hp.maxHp,
      status: hp.status || rosterEntry.status,
      fainted: hp.fainted,
    };
    upsertRosterPokemon(session, parsed.playerId, patchedRoster, parsed.slot);
    if (options.clearActiveSlot) clearRosterActiveSlot(session, parsed.playerId, parsed.slot, patchedRoster.key);
    deriveActiveFromRoster(session, parsed.playerId);
  }
  let patchedActive: BattleServiceActivePokemonV4 | null = null;
  session.snapshot.active = session.snapshot.active.map(active => active.ident === parsed.ident || active.slot === parsed.slot
    ? (patchedActive = {...active, condition, hp: hp.hp, maxHp: hp.maxHp, status: hp.status || active.status, fainted: hp.fainted})
    : active);
  const identity = patchedActive || activeIdentityFromRequest(session, parsed.playerId, parsed.slot);
  const token = teamStateTokenForIdentity(identity) || normalizeIdentityToken(parsed.ident);
  if (token) {
    upsertTeamPokemonState(session, parsed.playerId, token, {
      ...identity,
      ident: parsed.ident,
      hp: hp.hp,
      maxHp: hp.maxHp,
      status: hp.status,
      fainted: hp.fainted,
    });
  }
}

function clearRosterActiveSlot(session: RuntimeSession, playerId: ShowdownPlayerIdV4, slot: string, lastPokemonKey?: string): void {
  const previousByPlayer = session.snapshot.battleRosterByPlayer || {};
  const previous = previousByPlayer[playerId];
  if (!previous?.activeKeyBySlot?.[slot]) return;
  const key = previous.activeKeyBySlot[slot]!;
  const activeKeyBySlot = {...previous.activeKeyBySlot};
  delete activeKeyBySlot[slot];
  session.snapshot.battleRosterByPlayer = {
    ...previousByPlayer,
    [playerId]: {
      ...previous,
      activeKeyBySlot,
      lastPokemonKeyBySlot: {
        ...(previous.lastPokemonKeyBySlot || {}),
        [slot]: lastPokemonKey || key,
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

function patchActiveStatus(session: RuntimeSession, ident: string, status: string): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  const rosterEntry = activeRosterPokemon(session, parsed.playerId, parsed.slot);
  if (rosterEntry) {
    upsertRosterPokemon(session, parsed.playerId, {...rosterEntry, ident: parsed.ident, canonicalIdent: canonicalIdentFromParsed(parsed), status}, parsed.slot);
    deriveActiveFromRoster(session, parsed.playerId);
  }
  let patchedActive: BattleServiceActivePokemonV4 | null = null;
  session.snapshot.active = session.snapshot.active.map(active => active.ident === parsed.ident || active.slot === parsed.slot
    ? (patchedActive = {...active, status})
    : active);
  const identity = patchedActive || activeIdentityFromRequest(session, parsed.playerId, parsed.slot);
  const token = teamStateTokenForIdentity(identity) || normalizeIdentityToken(parsed.ident);
  if (token) {
    upsertTeamPokemonState(session, parsed.playerId, token, {
      ...identity,
      ident: parsed.ident,
      status,
      fainted: status === "fnt" ? true : undefined,
    });
  }
}

function upsertTeamPokemonState(
  session: RuntimeSession,
  playerId: ShowdownPlayerIdV4,
  token: string,
  patch: Partial<BattleTeamPokemonStateV4>,
): void {
  const normalizedToken = normalizeIdentityToken(token);
  if (!normalizedToken) return;
  const previousByPlayer = session.snapshot.teamStateByPlayer || {};
  const previous = previousByPlayer[playerId] || {pokemonByToken: {}, updatedAt: ""};
  const current = previous.pokemonByToken[normalizedToken] || {hp: 0, maxHp: 1, status: "", fainted: false};
  session.snapshot.teamStateByPlayer = {
    ...previousByPlayer,
    [playerId]: {
      pokemonByToken: {
        ...previous.pokemonByToken,
        [normalizedToken]: {
          ...current,
          ...patch,
          maxHp: Math.max(1, Number(patch.maxHp ?? current.maxHp ?? 1) || 1),
          hp: Math.max(0, Number(patch.hp ?? current.hp ?? 0) || 0),
          status: patch.status ?? current.status ?? "",
          fainted: patch.fainted ?? current.fainted ?? false,
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

function identityForTeamState(session: RuntimeSession, playerId: ShowdownPlayerIdV4, token: string): Partial<BattleTeamPokemonStateV4> {
  const normalizedToken = normalizeIdentityToken(token);
  const player = playerById(session, playerId);
  const mapping = player?.teamMapping?.find(entry =>
    normalizeIdentityToken(entry.showdownIdentityToken) === normalizedToken ||
    normalizeIdentityToken(entry.showdownId) === normalizedToken ||
    normalizeIdentityToken(entry.pokeballId) === normalizedToken
  );
  return {
    localPokemonId: mapping?.localPokemonId,
    showdownIdentityToken: mapping?.showdownIdentityToken || normalizedToken,
    showdownId: mapping?.showdownId || normalizedToken,
    pokeballId: mapping?.pokeballId || normalizedToken,
    pokeball: normalizedToken,
  };
}

function teamStateTokenForRow(row: BattleServiceSidePokemonV4): string {
  return normalizeIdentityToken(row.pokeball || row.ident || row.details);
}

function teamStateTokenForActive(active: BattleServiceActivePokemonV4): string {
  return normalizeIdentityToken(active.pokeball || active.pokeballId || active.showdownIdentityToken || active.showdownId || active.ident);
}

function teamStateTokenForIdentity(identity: {
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
}): string {
  return normalizeIdentityToken(identity.pokeball || identity.pokeballId || identity.showdownIdentityToken || identity.showdownId);
}

function parseIdent(ident: string): {ident: string; playerId: ShowdownPlayerIdV4; slot: string; name: string; slotExplicit: boolean} | null {
  const match = /^(p[1-4])([a-z]?):\s*(.+)$/i.exec(ident.trim());
  if (!match) return null;
  const playerId = match[1]!.toLowerCase() as ShowdownPlayerIdV4;
  const slotExplicit = Boolean(match[2]);
  const slot = `${playerId}${(match[2] || "a").toLowerCase()}`;
  return {ident: `${slot}: ${match[3]!.trim()}`, playerId, slot, name: match[3]!.trim(), slotExplicit};
}

function parseCondition(condition: string): {hp: number; maxHp: number; status: string; fainted: boolean} {
  if (!condition || condition.includes("fnt")) return {hp: 0, maxHp: 1, status: "fnt", fainted: true};
  const [hpText, statusText = ""] = condition.split(" ");
  const [hpRaw, maxRaw] = (hpText || "").split("/");
  const hp = Math.max(0, Number(hpRaw) || 0);
  const maxHp = Math.max(1, Number(maxRaw) || hp || 1);
  return {hp, maxHp, status: statusText, fainted: hp <= 0};
}

async function buildStartInput(input: BattleServiceSessionInputV4): Promise<string> {
  const showdown = await loadShowdownRuntimeApiV4();
  const spec = startSpec(input.ruleSet, input.mode);
  const lines = [`>start ${JSON.stringify(spec)}`];
  for (const player of input.players) {
    lines.push(`>player ${player.playerId} ${JSON.stringify({name: player.name, team: showdown.Teams.pack(player.team)})}`);
  }
  return lines.join("\n");
}

function startSpec(ruleSet: string, mode: string): {formatid: string} | {format: ShowdownStartFormatSpecV4} {
  const format = customFormatForRuleSetMode(ruleSet, mode);
  return format ? {format} : {formatid: formatId(ruleSet, mode)};
}

function customFormatForRuleSetMode(ruleSet: string, mode: string): ShowdownStartFormatSpecV4 | null {
  if (mode !== "coop") return null;
  const gen = ruleSet === "gen7" ? "gen7" : ruleSet === "gen8" ? "gen8" : "gen9";
  return {
    id: `changbattlev2${ruleSet}multicustomgame`,
    name: `[ChangeBattle V2 ${ruleSet.toUpperCase()}] Multi Custom Game`,
    mod: gen,
    gameType: "multi",
    playerCount: 4,
    debug: true,
    ruleset: ["Team Preview", "Cancel Mod", "Max Team Size = 24", "Max Move Count = 24", "Max Level = 9999", "Default Level = 100"],
    banlist: [],
    restricted: [],
    unbanlist: [],
  };
}

async function loadShowdownRuntimeApiV4(): Promise<ShowdownRuntimeApiV4> {
  return loadShowdownSimV4() as Promise<ShowdownRuntimeApiV4>;
}

function compilePlayer(player: TrainingPlayerDraftV4, usedShowdownIdentityTokens: Set<string> = new Set(), showdownIdPool = createShowdownIdPoolState(), ruleSet = "standard"): BattleServicePlayerInputV4 {
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
    allowedSpecialSystems: normalizeAllowedSpecialSystems(specialSystemsFromBag(player.bag?.items || []), ruleSet),
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
    movePp: (pokemon.moves || [])
      .filter((move: {moveId: string; remainingPp?: number; maxPp?: number; pp?: number}) => (
        move.moveId &&
        (typeof move.remainingPp === "number" || typeof move.maxPp === "number" || typeof move.pp === "number")
      ))
      .slice(0, 4)
      .map((move: {moveId: string; remainingPp?: number; maxPp?: number; pp?: number}) => ({
        moveId: move.moveId,
        remainingPp: Math.max(0, Number(move.remainingPp ?? move.maxPp ?? move.pp ?? 0) || 0),
        maxPp: Math.max(0, Number(move.maxPp ?? move.pp ?? move.remainingPp ?? 0) || 0),
      })),
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
  if (ruleSet === "gen9" || ruleSet === "standard") return `gen9${suffix}`;
  return "gen9customgame";
}

function playerIdByName(players: BattleServicePlayerInputV4[], name: string): BattleServicePlayerIdV4 | null {
  return players.find(player => player.name === name)?.playerId || null;
}

export function resolveBattleWinnerPlayerIdV4(players: BattleServicePlayerInputV4[], name: string): BattleServicePlayerIdV4 | null {
  const direct = playerIdByName(players, name);
  if (direct) return direct;
  const names = name
    .split(/\s*(?:&|,|\/|\+)\s*/g)
    .map(part => part.trim())
    .filter(Boolean);
  for (const part of names) {
    const playerId = playerIdByName(players, part);
    if (playerId) return playerId;
  }
  return null;
}

function playerById(session: RuntimeSession, playerId: ShowdownPlayerIdV4): BattleServicePlayerInputV4 | undefined {
  return session.snapshot.players.find(player => player.playerId === playerId);
}

function getSession(sessionId: string): RuntimeSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Battle session 不存在：${sessionId}`);
  return session;
}

function clearPlaybackTimelineCacheForSession(sessionId: string): void {
  for (const key of playbackTimelineCache.keys()) {
    if (key.startsWith(`${sessionId}:`)) playbackTimelineCache.delete(key);
  }
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
  BattleServicePermanentFormeChangeInputV4,
  BattleServicePermanentFormeChangeResultV4,
  BattleServiceRequestV4,
  BattleServiceSessionInputV4,
  BattleServiceSnapshotV4,
  BattleServiceSubmitChoiceInputV4,
  BattleServiceSubmitTrainerItemInputV4,
} from "./types.js";
