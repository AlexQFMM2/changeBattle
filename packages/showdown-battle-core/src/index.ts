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
  ShowdownPlayerIdV4,
  LocalPokemonLikeForBattleV4,
} from "./types.js";
import type {TrainingPlayerDraftV4, TrainingRunGameNodeV4} from "./types.js";

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
  closed: boolean;
};

const sessions = new Map<string, RuntimeSession>();
const HUMAN_PLAYERS = new Set<ShowdownPlayerIdV4>(["p1"]);

export function compileBattleSessionInput(input: BattleServiceCreateInputV4 | BattleServiceSessionInputV4): BattleServiceSessionInputV4 {
  if ("nodeId" in input) return input;
  const nodePlayers = input.node.participants || {};
  const players = playerIdsForNode(input.node)
    .map(playerId => nodePlayers[playerId] || input.players[playerId])
    .filter(Boolean)
    .map(player => compilePlayer(player!));
  return {
    runId: input.runId,
    nodeId: input.node.id,
    mode: input.node.mode,
    ruleSet: input.node.ruleSet,
    seed: input.node.seed,
    players,
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
      return clone(getSession(sessionId).snapshot);
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
      requests: {},
      active: [],
      rawLog: [],
      debug: {inputLog: [], lastChoices: []},
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
  await waitForRequests(session, 900);
  await submitAiChoices(session);
  return clone(session.snapshot);
}

export async function submitChoice(input: BattleServiceSubmitChoiceInputV4): Promise<BattleServiceSnapshotV4> {
  const session = getSession(input.sessionId);
  if (session.snapshot.status === "ended") return clone(session.snapshot);
  const choice = input.choice.trim();
  if (!choice) throw new Error("choice 不能为空。");
  session.snapshot.debug.lastChoices.push({playerId: input.playerId, choice, at: new Date().toISOString()});
  if (choice === "forfeit") {
    session.snapshot.debug.inputLog.push(`>forcelose ${input.playerId}`);
    await session.streams.omniscient.write(`>forcelose ${input.playerId}`);
  } else {
    session.snapshot.debug.inputLog.push(`>${input.playerId} ${choice}`);
    await session.streams[input.playerId].write(choice);
  }
  touch(session);
  await waitForRequests(session, 600);
  await submitAiChoices(session);
  return clone(session.snapshot);
}

export async function getSnapshot(sessionId: string): Promise<BattleServiceSnapshotV4> {
  return clone(getSession(sessionId).snapshot);
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
    const choices = request.forceSwitch.map(mustSwitch => mustSwitch ? legalSwitchChoice(request) : "pass");
    return choices.join(", ");
  }
  if (request.active?.length) {
    return request.active.map(active => {
      const moves = (active.moves || []).map((move, index) => ({move, index})).filter(entry => !entry.move.disabled && (entry.move.pp ?? 1) > 0);
      if (!moves.length) return "move 1";
      const picked = moves[Math.floor(Math.random() * moves.length)]!;
      return `move ${picked.index + 1}`;
    }).join(", ");
  }
  return "pass";
}

function legalSwitchChoice(request: BattleServiceRequestV4): string {
  const candidates = (request.side?.pokemon || [])
    .map((pokemon, index) => ({pokemon, index}))
    .filter(entry => !entry.pokemon.active && !entry.pokemon.condition.includes("fnt"));
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return picked ? `switch ${picked.index + 1}` : "pass";
}

async function submitAiChoices(session: RuntimeSession): Promise<void> {
  for (let guard = 0; guard < 10 && session.snapshot.status === "running"; guard += 1) {
    const pending = session.snapshot.players
      .filter(player => !HUMAN_PLAYERS.has(player.playerId) && shouldAutoChoose(session.snapshot.requests[player.playerId]))
      .map(player => ({playerId: player.playerId, choice: randomLegalChoice(session.snapshot.requests[player.playerId])}));
    if (!pending.length) return;
    for (const entry of pending) {
      if (!entry.choice) continue;
      session.snapshot.debug.lastChoices.push({playerId: entry.playerId, choice: entry.choice, at: new Date().toISOString()});
      session.snapshot.debug.inputLog.push(`>${entry.playerId} ${entry.choice}`);
      await session.streams[entry.playerId].write(entry.choice);
    }
    touch(session);
    await waitForRequests(session, 700);
  }
}

function shouldAutoChoose(request: BattleServiceRequestV4 | undefined): boolean {
  return Boolean(request && !request.wait);
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
      if (request) {
        session.snapshot.requests[playerId] = request;
        touch(session);
      }
    }
  } catch (error) {
    session.snapshot.status = "blocked";
    session.snapshot.error = error instanceof Error ? error.message : String(error);
    touch(session);
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

function compilePlayer(player: TrainingPlayerDraftV4): BattleServicePlayerInputV4 {
  return {
    playerId: player.playerId,
    name: player.name || player.playerId,
    controller: player.controller,
    alliance: player.alliance,
    team: player.localTeam.pokemon.map(compilePokemonSet),
    draft: player,
  };
}

function compilePokemonSet(pokemon: LocalPokemonLikeForBattleV4): BattleServicePokemonSetV4 {
  return {
    species: pokemon.speciesId,
    name: pokemon.nickname || pokemon.name || pokemon.nameZh || pokemon.speciesId,
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
