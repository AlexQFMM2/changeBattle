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
  ShowdownIdPoolStateV4,
  ShowdownTeamPokemonMappingV4,
  ShowdownPlayerIdV4,
  LocalPokemonLikeForBattleV4,
} from "./types.js";
import type {TrainingPlayerDraftV4, TrainingRunGameNodeV4} from "./types.js";
import {filterShowdownChoiceForRuleSetV4, showdownSpecialSystemAllowedForRuleSetV4} from "./showdownCommand.js";

export * from "./showdownCommand.js";

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
  closed: boolean;
};

const sessions = new Map<string, RuntimeSession>();
const HUMAN_PLAYERS = new Set<ShowdownPlayerIdV4>(["p1"]);
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
    async getSnapshot(sessionId) {
      return getSnapshot(sessionId);
    },
    async closeSession(sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.closed = true;
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
      debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}},
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

export async function getSnapshot(sessionId: string): Promise<BattleServiceSnapshotV4> {
  const session = getSession(sessionId);
  await flushReadyAutoChoices(session);
  return clone(session.snapshot);
}

export async function closeSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}

export function randomLegalChoice(request: BattleServiceRequestV4 | undefined): string {
  if (!request) return "pass";
  if (request.wait) return "";
  if (request.teamPreview) {
    const count = request.side?.pokemon?.length || 1;
    return `team ${Array.from({length: count}, (_, index) => index + 1).join(",")}`;
  }
  if (request.forceSwitch?.some(Boolean)) {
    const reservedSwitches = new Set<number>();
    const choices = request.forceSwitch.map(mustSwitch => mustSwitch ? legalSwitchChoice(request, reservedSwitches) : "pass");
    return choices.join(", ");
  }
  if (request.active?.length) {
    const activeRequests = fixedActiveRequests(request);
    const needsTargetableMoves = Boolean(request.targetable || activeRequests.length > 1);
    return activeRequests.map((active, activeIndex) => {
      if (!active) return "pass";
      const moves = (active.moves || []).map((move, index) => ({move, index})).filter(entry => !entry.move.disabled && (entry.move.pp ?? 1) > 0);
      if (!moves.length) return "move 1";
      const picked = moves[Math.floor(Math.random() * moves.length)]!;
      return `move ${picked.index + 1}${defaultTargetSuffix(request, activeIndex, picked.move, needsTargetableMoves)}`;
    }).join(", ");
  }
  return "pass";
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
  await submitAiChoices(session);
}

async function submitAiChoices(session: RuntimeSession): Promise<void> {
  for (let guard = 0; guard < 10 && session.snapshot.status === "running"; guard += 1) {
    const pending = session.snapshot.players
      .filter(player => !HUMAN_PLAYERS.has(player.playerId) && shouldAutoChoose(session.snapshot.requests[player.playerId]))
      .map(player => ({playerId: player.playerId, choice: randomLegalChoice(session.snapshot.requests[player.playerId])}));
    if (!pending.length) return;
    for (const entry of pending) {
      if (!entry.choice) continue;
      await writePlayerChoice(session, entry.playerId, entry.choice, "ai");
    }
    touch(session);
    await waitForRequests(session, 700);
  }
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

function upsertActive(session: RuntimeSession, ident: string, details: string, condition: string): void {
  const parsed = parseIdent(ident);
  if (!parsed) return;
  const nextCondition = condition || "0/1";
  const hp = parseCondition(nextCondition);
  const existing = session.snapshot.active.find(active => active.slot === parsed.slot);
  const next = {
    ident: parsed.ident,
    playerId: parsed.playerId,
    slot: parsed.slot,
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
    if (session.snapshot.players.some(player => shouldAutoChoose(session.snapshot.requests[player.playerId]) || HUMAN_PLAYERS.has(player.playerId) && session.snapshot.requests[player.playerId] && !session.snapshot.requests[player.playerId]?.wait)) {
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
} from "./types.js";
