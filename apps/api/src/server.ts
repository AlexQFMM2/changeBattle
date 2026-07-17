import http from "node:http";
import crypto from "node:crypto";
import net from "node:net";
import {createInMemoryBattleService} from "@changebattle-v2/showdown-battle-core";
import {createChangeBattleV2Api, type FormalBattleResultFinalizeReasonV4, type FormalGameModeV4, type FormalGameRunV4, type PlayerVaultV4, type ShowdownPlayerIdV4, type TrainingRunGameV4, type UserProfileV2} from "./index.js";

type ServerConfig = {
  host: string;
  port: number;
  basePath: string;
  maxBodyBytes: number;
  maxSessions: number;
  sessionTtlMs: number;
  debugLogs: boolean;
  token: string;
  corsOrigin: string;
  redisUrl: string;
  roomMaxCount: number;
  roomMaxBytes: number;
  roomMemorySafetyBytes: number;
  roomCreateMaxConcurrency: number;
  startedAt: number;
  version: string;
};

type SessionMeta = {
  createdAt: number;
  updatedAt: number;
};

type RoomConnectionState = "online" | "disconnected" | "closed";
type RoomStatus = string;

type FormalRoomActiveBattleV1 = {
  sessionId: string;
  nodeId: string;
  battleGameId: string;
  clientRequestId: string;
  status: "preparing" | "running" | "finalized";
  createdAt: string;
  updatedAt: string;
  choiceActionIds: string[];
  finalizeRequestId?: string;
  finalizeResult?: FormalRoomBattleFinalizeResultV1;
};

type FormalRoomBattleFinalizeResultV1 = {
  destination: "rest" | "settlement";
  reason?: FormalBattleResultFinalizeReasonV4;
  playerVault?: PlayerVaultV4;
  settlementNotice?: string;
};

type FormalRoomRecordV1 = {
  roomId: string;
  roomTokenHash: string;
  formalRun: FormalGameRunV4;
  activeBattle?: FormalRoomActiveBattleV1 | null;
  revision: number;
  status: RoomStatus;
  connectionState: RoomConnectionState;
  closeReason: string | null;
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string;
  expiresAt: string;
};

type RedisStatus = "disabled" | "ok" | "unavailable";

const service = createInMemoryBattleService();
const formalApi = createChangeBattleV2Api();
const config = loadConfig();
const sessionMeta = new Map<string, SessionMeta>();
const loggedAiDecisionCounts = new Map<string, number>();
const roomLocks = new Map<string, Promise<void>>();
const roomIndexKey = "cb:rooms";
let roomCreateInFlightCount = 0;

const server = http.createServer(async (request, response) => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  const startedAt = Date.now();
  const requestId = createRequestId();
  try {
    if (!authorize(request)) {
      sendJson(response, 401, {error: "unauthorized"});
      log("warn", "request-unauthorized", {requestId, method: request.method, url: request.url});
      return;
    }

    sweepExpiredSessions();
    const url = new URL(request.url || "/", `http://${request.headers.host || `${config.host}:${config.port}`}`);
    const pathname = normalizePathname(url.pathname);

    if (request.method === "GET" && pathname === "/health") {
      const redis = await redisHealth();
      sendJson(response, 200, {
        ok: true,
        service: "changebattle-v2-battle-service",
        version: config.version,
        uptimeMs: Date.now() - config.startedAt,
        sessionCount: sessionMeta.size,
        redis,
      });
      return;
    }

    if (request.method === "POST" && pathname === "/rooms") {
      const body = await readJson(request);
      const room = await createFormalRoom(body);
      sendJson(response, 200, room);
      log("info", "room-created", {requestId, roomId: room.roomId, mode: body?.mode, elapsedMs: Date.now() - startedAt});
      return;
    }

    const roomMatch = /^\/rooms\/([^/]+)$/.exec(pathname);
    const roomHeartbeatMatch = /^\/rooms\/([^/]+)\/heartbeat$/.exec(pathname);
    const roomSelectStartersMatch = /^\/rooms\/([^/]+)\/formal\/select-starters$/.exec(pathname);
    const roomPrepareRoundMatch = /^\/rooms\/([^/]+)\/formal\/prepare-round$/.exec(pathname);
    const roomPrepareBattleMatch = /^\/rooms\/([^/]+)\/formal\/prepare-battle$/.exec(pathname);
    const roomFinalizeBattleMatch = /^\/rooms\/([^/]+)\/formal\/finalize-battle$/.exec(pathname);
    const roomBattleSnapshotMatch = /^\/rooms\/([^/]+)\/battle\/snapshot$/.exec(pathname);
    const roomBattleTimelineMatch = /^\/rooms\/([^/]+)\/battle\/playback-timeline$/.exec(pathname);
    const roomBattleChoiceMatch = /^\/rooms\/([^/]+)\/battle\/choices$/.exec(pathname);

    if (request.method === "GET" && roomMatch) {
      const roomId = decodeURIComponent(roomMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      sendJson(response, 200, publicRoom(room));
      return;
    }
    if (request.method === "POST" && roomHeartbeatMatch) {
      const roomId = decodeURIComponent(roomHeartbeatMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      const next = touchRoom(room);
      await saveRoom(next);
      sendJson(response, 200, publicRoom(next));
      log("info", "room-heartbeat", {requestId, roomId, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomSelectStartersMatch) {
      const roomId = decodeURIComponent(roomSelectStartersMatch[1]!);
      const body = await readJson(request);
      const room = await withRoomLock(roomId, async () => {
        const current = await loadAuthorizedRoom(roomId, request);
        const formalRun = runFormalStep(() => formalApi.selectFormalStarterPokemon(current.formalRun, body?.selectedIndexes || []));
        const next = advanceRoom(current, formalRun);
        await saveRoom(next);
        return next;
      });
      sendJson(response, 200, publicRoom(room));
      log("info", "room-formal-starters-selected", {requestId, roomId, revision: room.revision, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomPrepareRoundMatch) {
      const roomId = decodeURIComponent(roomPrepareRoundMatch[1]!);
      const room = await withRoomLock(roomId, async () => {
        const current = await loadAuthorizedRoom(roomId, request);
        const formalRun = await runFormalStepAsync(() => formalApi.prepareFormalRoundPlan(current.formalRun));
        const next = advanceRoom(current, formalRun);
        await saveRoom(next);
        return next;
      });
      sendJson(response, 200, publicRoom(room));
      log("info", "room-formal-round-prepared", {requestId, roomId, revision: room.revision, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomPrepareBattleMatch) {
      const roomId = decodeURIComponent(roomPrepareBattleMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => prepareFormalRoomBattle(roomId, request, body));
      sendJson(response, 200, result);
      log("info", "room-formal-battle-prepared", {requestId, roomId, sessionId: result.sessionId, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "GET" && roomBattleSnapshotMatch) {
      const roomId = decodeURIComponent(roomBattleSnapshotMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      const snapshot = await getRoomBattleSnapshot(room);
      sendJson(response, 200, sanitizeSnapshot(snapshot));
      return;
    }
    if (request.method === "GET" && roomBattleTimelineMatch) {
      const roomId = decodeURIComponent(roomBattleTimelineMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      const snapshot = await getRoomBattleSnapshot(room);
      const previousIndex = Number(url.searchParams.get("from") || 0);
      sendJson(response, 200, await service.getPlaybackTimeline(snapshot.id, previousIndex));
      return;
    }
    if (request.method === "POST" && roomBattleChoiceMatch) {
      const roomId = decodeURIComponent(roomBattleChoiceMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => submitFormalRoomBattleChoice(roomId, request, body));
      sendJson(response, 200, sanitizeSnapshot(result));
      log("info", "room-battle-choice-submitted", {requestId, roomId, sessionId: result.id, playerId: body?.playerId, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomFinalizeBattleMatch) {
      const roomId = decodeURIComponent(roomFinalizeBattleMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => finalizeFormalRoomBattle(roomId, request, body));
      sendJson(response, 200, result);
      log("info", "room-formal-battle-finalized", {requestId, roomId, destination: result.destination, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "DELETE" && roomMatch) {
      const roomId = decodeURIComponent(roomMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      await deleteRoom(room.roomId);
      sendJson(response, 200, {ok: true});
      log("info", "room-deleted", {requestId, roomId, elapsedMs: Date.now() - startedAt});
      return;
    }

    if (request.method === "POST" && pathname === "/sessions") {
      if (sessionMeta.size >= config.maxSessions) {
        sendJson(response, 503, {error: "session_limit_exceeded"});
        log("warn", "session-limit-exceeded", {requestId, sessionCount: sessionMeta.size, maxSessions: config.maxSessions});
        return;
      }
      const input = await readJson(request);
      const snapshot = await service.createBattleSession(input);
      touchSession(snapshot.id);
      logAiDecisions(snapshot);
      sendJson(response, 200, sanitizeSnapshot(snapshot));
      log("info", "session-created", {
        requestId,
        sessionId: snapshot.id,
        mode: snapshot.mode,
        ruleSet: snapshot.ruleSet,
        status: snapshot.status,
        elapsedMs: Date.now() - startedAt,
      });
      return;
    }

    const sessionMatch = /^\/sessions\/([^/]+)$/.exec(pathname);
    const playbackTimelineMatch = /^\/sessions\/([^/]+)\/playback-timeline$/.exec(pathname);
    const choiceMatch = /^\/sessions\/([^/]+)\/choice$/.exec(pathname);
    const trainerItemMatch = /^\/sessions\/([^/]+)\/trainer-item$/.exec(pathname);
    const formeChangeMatch = /^\/sessions\/([^/]+)\/forme-change$/.exec(pathname);

    if (request.method === "GET" && sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]!);
      touchSession(sessionId);
      const snapshot = await service.getSnapshot(sessionId);
      logAiDecisions(snapshot);
      sendJson(response, 200, sanitizeSnapshot(snapshot));
      return;
    }
    if (request.method === "GET" && playbackTimelineMatch) {
      const sessionId = decodeURIComponent(playbackTimelineMatch[1]!);
      touchSession(sessionId);
      sendJson(response, 200, await service.getPlaybackTimeline(sessionId, Number(url.searchParams.get("from") || 0)));
      return;
    }
    if (request.method === "DELETE" && sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]!);
      await closeSession(sessionId);
      sendJson(response, 200, {ok: true});
      log("info", "session-closed", {requestId, sessionId, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && choiceMatch) {
      const sessionId = decodeURIComponent(choiceMatch[1]!);
      const body = await readJson(request);
      touchSession(sessionId);
      const snapshot = await service.submitChoice({
        sessionId,
        playerId: body.playerId,
        choice: body.choice,
      });
      touchSession(snapshot.id);
      logAiDecisions(snapshot);
      sendJson(response, 200, sanitizeSnapshot(snapshot));
      log("info", "choice-submitted", {
        requestId,
        sessionId,
        playerId: body.playerId,
        elapsedMs: Date.now() - startedAt,
      });
      return;
    }
    if (request.method === "POST" && trainerItemMatch) {
      const sessionId = decodeURIComponent(trainerItemMatch[1]!);
      const body = await readJson(request);
      touchSession(sessionId);
      const snapshot = await service.submitTrainerItem({
        sessionId,
        playerId: body.playerId,
        choice: body.choice,
        trainerItems: body.trainerItems || [],
      });
      touchSession(snapshot.id);
      logAiDecisions(snapshot);
      sendJson(response, 200, sanitizeSnapshot(snapshot));
      return;
    }
    if (request.method === "POST" && formeChangeMatch) {
      const sessionId = decodeURIComponent(formeChangeMatch[1]!);
      const body = await readJson(request);
      touchSession(sessionId);
      const result = await service.applyPermanentFormeChange({
        sessionId,
        playerId: body.playerId,
        activeIndex: body.activeIndex,
        toSpeciesId: body.toSpeciesId,
        message: body.message,
      });
      sendJson(response, 200, result);
      return;
    }
    sendJson(response, 404, {error: "not_found"});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof HttpError ? error.status : message === "request_body_too_large" ? 413 : 500;
    const code = error instanceof HttpError ? error.code : status === 413 ? "request_body_too_large" : "battle_service_error";
    sendJson(response, status, {error: code, message: error instanceof HttpError ? error.publicMessage : safeErrorMessage(message)});
    log("error", "request-failed", {
      requestId,
      method: request.method,
      url: request.url,
      status,
      elapsedMs: Date.now() - startedAt,
      error: message,
    });
  }
});

server.listen(config.port, config.host, () => {
  log("info", "server-listening", {
    host: config.host,
    port: config.port,
    basePath: config.basePath,
    maxSessions: config.maxSessions,
    sessionTtlMs: config.sessionTtlMs,
  });
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

function loadConfig(): ServerConfig {
  return {
    host: process.env.CHANGEBATTLE_BATTLE_SERVICE_HOST || "127.0.0.1",
    port: numberEnv("CHANGEBATTLE_BATTLE_SERVICE_PORT", numberEnv("PORT", 5191)),
    basePath: normalizeBasePath(process.env.CHANGEBATTLE_BATTLE_SERVICE_BASE_PATH || ""),
    maxBodyBytes: numberEnv("CHANGEBATTLE_BATTLE_SERVICE_MAX_BODY_BYTES", 1024 * 1024),
    maxSessions: numberEnv("CHANGEBATTLE_BATTLE_SERVICE_MAX_SESSIONS", 200),
    sessionTtlMs: numberEnv("CHANGEBATTLE_BATTLE_SERVICE_SESSION_TTL_MS", 2 * 60 * 60 * 1000),
    debugLogs: booleanEnv("CHANGEBATTLE_BATTLE_SERVICE_DEBUG_LOGS", false),
    token: process.env.CHANGEBATTLE_BATTLE_SERVICE_TOKEN || "",
    corsOrigin: process.env.CHANGEBATTLE_BATTLE_SERVICE_CORS_ORIGIN || "*",
    redisUrl: process.env.CHANGEBATTLE_REDIS_URL || "",
    roomMaxCount: numberEnv("CHANGEBATTLE_ROOM_MAX_COUNT", 100),
    roomMaxBytes: numberEnv("CHANGEBATTLE_ROOM_MAX_BYTES", 1024 * 1024),
    roomMemorySafetyBytes: numberEnv("CHANGEBATTLE_ROOM_MEMORY_SAFETY_BYTES", 32 * 1024 * 1024),
    roomCreateMaxConcurrency: numberEnv("CHANGEBATTLE_ROOM_CREATE_MAX_CONCURRENCY", 1),
    startedAt: Date.now(),
    version: process.env.npm_package_version || process.env.CHANGEBATTLE_VERSION || "0.1.0",
  };
}

function setCorsHeaders(response: http.ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  response.setHeader("Access-Control-Allow-Headers", "authorization,content-type,x-changebattle-battle-token,x-changebattle-room-token");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
}

function authorize(request: http.IncomingMessage): boolean {
  if (!config.token) return true;
  const auth = String(request.headers.authorization || "");
  const headerToken = String(request.headers["x-changebattle-battle-token"] || "");
  return auth === `Bearer ${config.token}` || headerToken === config.token;
}

function normalizePathname(pathname: string): string {
  if (!config.basePath) return pathname || "/";
  if (pathname === config.basePath) return "/";
  if (pathname.startsWith(`${config.basePath}/`)) return pathname.slice(config.basePath.length) || "/";
  return pathname || "/";
}

function normalizeBasePath(value: string): string {
  const clean = value.trim().replace(/\/+$/, "");
  if (!clean || clean === "/") return "";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function sendJson(response: http.ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {"content-type": "application/json; charset=utf-8"});
  response.end(JSON.stringify(value));
}

async function readJson(request: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > config.maxBodyBytes) throw new Error("request_body_too_large");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitizeSnapshot(snapshot: any): any {
  if (!snapshot || typeof snapshot !== "object") return snapshot;
  const debug = snapshot.debug || {};
  return {
    ...snapshot,
    debug: {
      inputLog: [],
      lastChoices: [],
      playerStreams: [],
      latestSidePokemon: debug.latestSidePokemon || {},
      latestRequests: debug.latestRequests || {},
      latestMovePpByPokemon: debug.latestMovePpByPokemon || {},
      aiDecisions: [],
    },
  };
}

function logAiDecisions(snapshot: any): void {
  const sessionId = String(snapshot?.id || "");
  if (!sessionId) return;
  const decisions = Array.isArray(snapshot?.debug?.aiDecisions) ? snapshot.debug.aiDecisions : [];
  const previousCount = loggedAiDecisionCounts.get(sessionId) || 0;
  for (const decision of decisions.slice(previousCount)) {
    log("info", "battle-ai-choice", {
      sessionId,
      turn: snapshot.turn,
      playerId: decision.playerId,
      mode: snapshot.mode,
      aiLevel: decision.level,
      selectedChoice: decision.selectedChoice,
      elapsedMs: decision.elapsedMs,
      searchedDepth: decision.search?.searchedDepth,
      warnings: decision.timedOut ? ["timeout"] : [],
      ...(config.debugLogs ? {
        reasonTags: decision.search?.reasonTags || [],
        valueBreakdown: decision.search?.valueBreakdown || {},
        topCandidates: decision.topCandidates || [],
      } : {}),
    });
  }
  loggedAiDecisionCounts.set(sessionId, decisions.length);
}

function touchSession(sessionId: string): void {
  const now = Date.now();
  const previous = sessionMeta.get(sessionId);
  sessionMeta.set(sessionId, {createdAt: previous?.createdAt || now, updatedAt: now});
}

async function closeSession(sessionId: string): Promise<void> {
  await service.closeSession(sessionId);
  sessionMeta.delete(sessionId);
  loggedAiDecisionCounts.delete(sessionId);
}

function sweepExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, meta] of sessionMeta) {
    if (now - meta.updatedAt <= config.sessionTtlMs) continue;
    void closeSession(sessionId).catch(error => {
      log("warn", "session-expire-close-failed", {sessionId, error: error instanceof Error ? error.message : String(error)});
    });
    log("info", "session-expired", {sessionId, ageMs: now - meta.createdAt, idleMs: now - meta.updatedAt});
  }
}

class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, readonly publicMessage: string) {
    super(code);
  }
}

async function createFormalRoom(body: any): Promise<Record<string, unknown>> {
  ensureRedisEnabled();
  if (roomCreateInFlightCount >= config.roomCreateMaxConcurrency) {
    throw new HttpError(503, "server_busy", "服务器已爆满，稍等片刻再试试。");
  }
  roomCreateInFlightCount += 1;
  try {
  await assertRoomCapacity();
  const now = new Date();
  const roomId = randomToken(18);
  const roomToken = randomToken(32);
  const formalRun = createInitialFormalRun(body, roomId);
  const record: FormalRoomRecordV1 = {
    roomId,
    roomTokenHash: hashToken(roomToken),
    formalRun,
    revision: 1,
    status: roomStatusFromFormalRun(formalRun),
    connectionState: "online",
    closeReason: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastHeartbeatAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
  await saveRoom(record);
  await redisCommand("SADD", roomIndexKey, roomId);
  return {...publicRoom(record), roomToken};
  } finally {
    roomCreateInFlightCount = Math.max(0, roomCreateInFlightCount - 1);
  }
}

function createInitialFormalRun(body: any, roomId: string): FormalGameRunV4 {
  const profileSnapshot = body?.profileSnapshot as UserProfileV2 | undefined;
  if (!profileSnapshot || typeof profileSnapshot !== "object") {
    throw new HttpError(400, "formal_flow_error", "缺少玩家画像快照。");
  }
  const mode = normalizeFormalRoomMode(body?.mode);
  const playerVaultSnapshot = body?.playerVaultSnapshot as PlayerVaultV4 | null | undefined;
  const options = body?.options && typeof body.options === "object" ? body.options : {};
  const seed = typeof body?.seed === "string" && body.seed.trim() ? body.seed : roomId;
  return runFormalStep(() => {
    const base = formalApi.createFormalGameRun(profileSnapshot, {
      mode,
      seed,
      coopPartnerPreference: mode === "coop" ? normalizeCoopPartnerPreference((options as any).coopPartnerPreference) : undefined,
    });
    return formalApi.prepareFormalStarterCandidates(base, {playerVault: playerVaultSnapshot || null});
  });
}

function normalizeFormalRoomMode(value: unknown): FormalGameModeV4 {
  return value === "doubles" || value === "coop" ? value : "singles";
}

function normalizeCoopPartnerPreference(value: unknown): "balanced" | "offense" | "defense" | "support" {
  return value === "offense" || value === "defense" || value === "support" ? value : "balanced";
}

function runFormalStep<T>(step: () => T): T {
  try {
    return step();
  } catch (error) {
    throw formalFlowError(error);
  }
}

async function runFormalStepAsync<T>(step: () => Promise<T>): Promise<T> {
  try {
    return await step();
  } catch (error) {
    throw formalFlowError(error);
  }
}

function formalFlowError(error: unknown): HttpError {
  const message = error instanceof Error ? error.message : String(error || "正式流程计算失败。");
  return new HttpError(400, "formal_flow_error", message || "正式流程计算失败。");
}

function advanceRoom(room: FormalRoomRecordV1, formalRun: FormalGameRunV4): FormalRoomRecordV1 {
  const now = new Date();
  return {
    ...room,
    formalRun,
    revision: room.revision + 1,
    status: roomStatusFromFormalRun(formalRun),
    connectionState: room.connectionState === "closed" ? "closed" : "online",
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
}

function roomStatusFromFormalRun(run: FormalGameRunV4): RoomStatus {
  return run.status || "preparing";
}

async function prepareFormalRoomBattle(roomId: string, request: http.IncomingMessage, body: any): Promise<Record<string, unknown>> {
  const clientRequestId = requiredString(body?.clientRequestId, "clientRequestId");
  const current = await loadAuthorizedRoom(roomId, request);
  if (current.activeBattle?.status !== "finalized" && current.activeBattle?.sessionId) {
    if (current.activeBattle.clientRequestId !== clientRequestId && current.activeBattle.status === "preparing") {
      throw new HttpError(409, "active_battle_exists", "当前房间已有战斗正在创建。");
    }
    const snapshot = await getRoomBattleSnapshot(current);
    return {
      room: publicRoom(current),
      formalRun: current.formalRun,
      sessionId: current.activeBattle.sessionId,
      snapshot: sanitizeSnapshot(snapshot),
      reused: true,
    };
  }
  const draft = validateFormalRunDraft(current, body?.formalRunDraft || current.formalRun);
  const prepared = await runFormalStepAsync(() => formalApi.prepareFormalBattleSession(draft));
  const snapshot = await service.createBattleSession(prepared.sessionInput);
  touchSession(snapshot.id);
  logAiDecisions(snapshot);
  const now = new Date().toISOString();
  const formalRun = {
    ...draft,
    restRunSnapshot: markFormalRestBattleState(prepared.restRunSnapshot, prepared.sessionInput.nodeId, "running", prepared.battleGame.id),
    updatedAt: now,
  };
  const activeBattle: FormalRoomActiveBattleV1 = {
    sessionId: snapshot.id,
    nodeId: prepared.sessionInput.nodeId,
    battleGameId: prepared.battleGame.id,
    clientRequestId,
    status: "running",
    createdAt: now,
    updatedAt: now,
    choiceActionIds: [],
  };
  const next = {
    ...advanceRoom(current, formalRun),
    activeBattle,
  };
  await saveRoom(next);
  return {
    room: publicRoom(next),
    formalRun: next.formalRun,
    sessionId: snapshot.id,
    snapshot: sanitizeSnapshot(snapshot),
    reused: false,
  };
}

function validateFormalRunDraft(room: FormalRoomRecordV1, value: unknown): FormalGameRunV4 {
  if (!value || typeof value !== "object") throw new HttpError(400, "formal_flow_error", "缺少正式流程草稿。");
  const draft = value as FormalGameRunV4;
  if (draft.id !== room.formalRun.id) throw new HttpError(409, "formal_run_mismatch", "正式流程房间不匹配。");
  if (draft.mode !== room.formalRun.mode) throw new HttpError(409, "formal_run_mismatch", "正式流程模式不匹配。");
  if (Math.floor(Number(draft.currentRoundIndex || 0)) !== Math.floor(Number(room.formalRun.currentRoundIndex || 0))) {
    throw new HttpError(409, "formal_revision_conflict", "正式流程轮次已经变化，请刷新后重试。");
  }
  if (!draft.restRunSnapshot) throw new HttpError(400, "formal_flow_error", "缺少休整快照。");
  if (!draft.playerTeam?.pokemon?.length) throw new HttpError(400, "formal_flow_error", "缺少玩家队伍。");
  return draft;
}

async function getRoomBattleSnapshot(room: FormalRoomRecordV1): Promise<any> {
  const activeBattle = room.activeBattle;
  if (!activeBattle?.sessionId) throw new HttpError(409, "active_battle_missing", "当前房间没有进行中的战斗。");
  try {
    touchSession(activeBattle.sessionId);
    const snapshot = await service.getSnapshot(activeBattle.sessionId);
    logAiDecisions(snapshot);
    return snapshot;
  } catch {
    throw new HttpError(409, "battle_session_lost", "战斗服务已重启或战斗会话已丢失。");
  }
}

async function submitFormalRoomBattleChoice(roomId: string, request: http.IncomingMessage, body: any): Promise<any> {
  const clientActionId = requiredString(body?.clientActionId, "clientActionId");
  const current = await loadAuthorizedRoom(roomId, request);
  const activeBattle = current.activeBattle;
  if (!activeBattle?.sessionId) throw new HttpError(409, "active_battle_missing", "当前房间没有进行中的战斗。");
  if (activeBattle.choiceActionIds.includes(clientActionId)) {
    return getRoomBattleSnapshot(current);
  }
  const playerId = requiredString(body?.playerId, "playerId") as ShowdownPlayerIdV4;
  const choice = requiredString(body?.choice, "choice");
  const trainerItems = Array.isArray(body?.trainerItems) ? body.trainerItems : [];
  let snapshot: any;
  try {
    touchSession(activeBattle.sessionId);
    snapshot = trainerItems.length
      ? await service.submitTrainerItem({sessionId: activeBattle.sessionId, playerId, choice, trainerItems})
      : await service.submitChoice({sessionId: activeBattle.sessionId, playerId, choice});
    touchSession(snapshot.id);
    logAiDecisions(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("session")) throw new HttpError(409, "battle_session_lost", "战斗服务已重启或战斗会话已丢失。");
    throw error;
  }
  const now = new Date().toISOString();
  const next: FormalRoomRecordV1 = {
    ...current,
    activeBattle: {
      ...activeBattle,
      updatedAt: now,
      choiceActionIds: [...activeBattle.choiceActionIds, clientActionId].slice(-200),
    },
    updatedAt: now,
    expiresAt: new Date(Date.now() + config.sessionTtlMs).toISOString(),
  };
  await saveRoom(next);
  return snapshot;
}

async function finalizeFormalRoomBattle(roomId: string, request: http.IncomingMessage, body: any): Promise<Record<string, unknown>> {
  const clientRequestId = requiredString(body?.clientRequestId, "clientRequestId");
  const current = await loadAuthorizedRoom(roomId, request);
  const activeBattle = current.activeBattle;
  if (!activeBattle?.sessionId) throw new HttpError(409, "active_battle_missing", "当前房间没有可结算的战斗。");
  if (activeBattle.finalizeRequestId === clientRequestId && activeBattle.finalizeResult) {
    return {...activeBattle.finalizeResult, formalRun: current.formalRun, room: publicRoom(current)};
  }
  const snapshot = await getRoomBattleSnapshot(current);
  const timeline = await service.getPlaybackTimeline(activeBattle.sessionId, 0).catch(() => null);
  const reason = normalizeFinalizeReason(body?.reason);
  const finalized = await runFormalStepAsync(() => formalApi.finalizeFormalBattleResultV4(current.formalRun, snapshot, reason, {playbackTimeline: timeline}));
  let formalRun = finalized.run;
  let playerVault: PlayerVaultV4 | undefined;
  let settlementNotice = "";
  if (body?.playerVaultSnapshot) {
    const soulmateSettlement = formalApi.applyFormalSoulmateBattleFriendshipSettlement(formalRun, body.playerVaultSnapshot);
    const honorSettlement = formalApi.applyFormalSoulmateHonorSettlement(soulmateSettlement.run, body.playerVaultSnapshot);
    formalRun = honorSettlement.run;
    playerVault = honorSettlement.playerVault;
    settlementNotice = [formatSoulmateSettlementNotice(soulmateSettlement.summary), formatSoulmateHonorSettlementNotice(honorSettlement.summary)].filter(Boolean).join("；");
  }
  const finalResult: FormalRoomBattleFinalizeResultV1 = {
    destination: finalized.destination,
    reason: finalized.reason,
    playerVault,
    settlementNotice,
  };
  const now = new Date().toISOString();
  const next = {
    ...advanceRoom(current, formalRun),
    activeBattle: {
      ...activeBattle,
      status: "finalized" as const,
      updatedAt: now,
      finalizeRequestId: clientRequestId,
      finalizeResult: finalResult,
    },
  };
  await saveRoom(next);
  await closeSession(activeBattle.sessionId).catch(() => undefined);
  return {...finalResult, formalRun, room: publicRoom(next)};
}

function normalizeFinalizeReason(value: unknown): FormalBattleResultFinalizeReasonV4 | undefined {
  return value === "loss" || value === "surrender" || value === "complete" ? value : undefined;
}

function markFormalRestBattleState(run: TrainingRunGameV4, nodeId: string, state: "running" | "blocked", battleGameId: string): TrainingRunGameV4 {
  const now = new Date().toISOString();
  return {
    ...run,
    status: state === "running" ? "battling" : "blocked",
    gameMap: run.gameMap.map(node => node.id === nodeId
      ? {
        ...node,
        state,
        startedAt: state === "running" ? now : node.startedAt,
        battleGame: {
          id: node.battleGame?.id || battleGameId,
          status: state === "blocked" ? "blocked" : "running",
        },
      }
      : node),
    updatedAt: now,
  };
}

function formatSoulmateSettlementNotice(summary: any): string {
  const deltas = Array.isArray(summary?.deltas) ? summary.deltas.filter((delta: any) => Number(delta?.delta || 0) !== 0) : [];
  return deltas.map((delta: any) => `${delta.displayName || "伙伴"}亲密度 ${delta.delta > 0 ? "+" : ""}${delta.delta}`).join("、");
}

function formatSoulmateHonorSettlementNotice(summary: any): string {
  const awards = Array.isArray(summary?.awards) ? summary.awards : [];
  if (!awards.length) return "";
  const medalAwards = awards.filter((award: any) => award?.medalEarned);
  return (medalAwards.length ? medalAwards : awards)
    .map((award: any) => medalAwards.length
      ? `${award.displayName || "伙伴"}点亮了${award.badgeName || "荣誉"}`
      : `${award.displayName || "伙伴"}荣誉进度：击败${award.trainerName || "对手"}`)
    .join("、");
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, "bad_request", `缺少 ${label}。`);
  return value;
}

async function withRoomLock<T>(roomId: string, task: () => Promise<T>): Promise<T> {
  const previous = roomLocks.get(roomId) || Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const current = previous.catch(() => undefined).then(() => gate);
  roomLocks.set(roomId, current);
  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
    if (roomLocks.get(roomId) === current) roomLocks.delete(roomId);
  }
}

async function loadAuthorizedRoom(roomId: string, request: http.IncomingMessage): Promise<FormalRoomRecordV1> {
  const room = await loadRoom(roomId);
  if (!room) throw new HttpError(404, "room_not_found", "房间不存在或已过期。");
  const token = roomTokenFromRequest(request);
  if (!token || hashToken(token) !== room.roomTokenHash) {
    throw new HttpError(403, "room_forbidden", "房间凭证无效。");
  }
  return room;
}

async function loadRoom(roomId: string): Promise<FormalRoomRecordV1 | null> {
  ensureRedisEnabled();
  const raw = await redisCommand("GET", roomKey(roomId));
  if (typeof raw !== "string") return null;
  const parsed = JSON.parse(raw) as FormalRoomRecordV1;
  return parsed && parsed.roomId === roomId ? parsed : null;
}

async function saveRoom(room: FormalRoomRecordV1): Promise<void> {
  ensureRedisEnabled();
  const raw = JSON.stringify(room);
  if (Buffer.byteLength(raw, "utf8") > config.roomMaxBytes) {
    throw new HttpError(413, "room_too_large", "房间数据过大。");
  }
  await redisCommand("SET", roomKey(room.roomId), raw, "PX", String(config.sessionTtlMs));
}

async function deleteRoom(roomId: string): Promise<void> {
  ensureRedisEnabled();
  await redisCommand("DEL", roomKey(roomId));
  await redisCommand("SREM", roomIndexKey, roomId);
}

function touchRoom(room: FormalRoomRecordV1): FormalRoomRecordV1 {
  const now = new Date();
  return {
    ...room,
    connectionState: room.connectionState === "closed" ? "closed" : "online",
    updatedAt: now.toISOString(),
    lastHeartbeatAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
}

function publicRoom(room: FormalRoomRecordV1): Record<string, unknown> {
  const {roomTokenHash: _roomTokenHash, activeBattle, ...safeRoom} = room;
  return {
    ...safeRoom,
    activeBattle: activeBattle ? {
      sessionId: activeBattle.sessionId,
      nodeId: activeBattle.nodeId,
      battleGameId: activeBattle.battleGameId,
      status: activeBattle.status,
      createdAt: activeBattle.createdAt,
      updatedAt: activeBattle.updatedAt,
    } : null,
  };
}

async function assertRoomCapacity(): Promise<void> {
  const redis = await redisHealth();
  if (redis !== "ok") throw new HttpError(503, "redis_unavailable", "服务器状态不可用。");
  await cleanupRoomIndex();
  const count = Number(await redisCommand("SCARD", roomIndexKey));
  if (Number.isFinite(count) && count >= config.roomMaxCount) {
    throw new HttpError(503, "server_busy", "服务器已爆满，稍等片刻再试试。");
  }
  const memory = await redisMemoryInfo();
  if (memory && memory.maxmemory > 0 && memory.maxmemory - memory.used_memory < config.roomMemorySafetyBytes) {
    throw new HttpError(503, "server_busy", "服务器已爆满，稍等片刻再试试。");
  }
}

async function cleanupRoomIndex(): Promise<void> {
  const members = await redisCommand("SMEMBERS", roomIndexKey);
  if (!Array.isArray(members)) return;
  for (const roomId of members) {
    if (typeof roomId !== "string") continue;
    const exists = await redisCommand("GET", roomKey(roomId));
    if (typeof exists !== "string") await redisCommand("SREM", roomIndexKey, roomId);
  }
}

async function redisHealth(): Promise<RedisStatus> {
  if (!config.redisUrl) return "disabled";
  try {
    const pong = await redisCommand("PING");
    return pong === "PONG" ? "ok" : "unavailable";
  } catch {
    return "unavailable";
  }
}

async function redisMemoryInfo(): Promise<{used_memory: number; maxmemory: number} | null> {
  const info = await redisCommand("INFO", "memory");
  if (typeof info !== "string") return null;
  const fields = new Map<string, number>();
  for (const line of info.split(/\r?\n/)) {
    const [key, value] = line.split(":");
    if (!key || value === undefined) continue;
    const number = Number(value.trim());
    if (Number.isFinite(number)) fields.set(key, number);
  }
  return {
    used_memory: fields.get("used_memory") || 0,
    maxmemory: fields.get("maxmemory") || 0,
  };
}

function ensureRedisEnabled(): void {
  if (!config.redisUrl) throw new HttpError(503, "redis_disabled", "服务器房间服务未启用。");
}

function roomKey(roomId: string): string {
  return `cb:room:${roomId}`;
}

function roomTokenFromRequest(request: http.IncomingMessage): string {
  const auth = String(request.headers.authorization || "");
  if (auth.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  return String(request.headers["x-changebattle-room-token"] || "");
}

function randomToken(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function redisCommand(...parts: string[]): Promise<unknown> {
  const url = new URL(config.redisUrl);
  const host = url.hostname;
  const port = Number(url.port || 6379);
  const password = decodeURIComponent(url.password || "");
  const database = url.pathname && url.pathname !== "/" ? Number(url.pathname.slice(1)) : 0;
  const commands: string[][] = [];
  if (password) commands.push(["AUTH", password]);
  if (database) commands.push(["SELECT", String(database)]);
  commands.push(parts);
  const socket = net.createConnection({host, port});
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
      socket.setTimeout(5000, () => reject(new Error("redis_timeout")));
    });
    let last: unknown = null;
    for (const command of commands) {
      socket.write(encodeRedisCommand(command));
      last = await readRedisResponse(socket);
      if (last instanceof Error) throw last;
    }
    return last;
  } finally {
    socket.destroy();
  }
}

function encodeRedisCommand(parts: string[]): string {
  return `*${parts.length}\r\n${parts.map(part => {
    const buffer = Buffer.from(part);
    return `$${buffer.byteLength}\r\n${part}\r\n`;
  }).join("")}`;
}

function readRedisResponse(socket: net.Socket): Promise<unknown> {
  let buffer = Buffer.alloc(0);
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      const parsed = parseRedisValue(buffer, 0);
      if (!parsed) return;
      cleanup();
      resolve(parsed.value);
    };
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

function parseRedisValue(buffer: Buffer, offset: number): {value: unknown; next: number} | null {
  if (offset >= buffer.length) return null;
  const prefix = String.fromCharCode(buffer[offset]!);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd < 0) return null;
  const line = buffer.slice(offset + 1, lineEnd).toString("utf8");
  const next = lineEnd + 2;
  if (prefix === "+") return {value: line, next};
  if (prefix === "-") return {value: new Error(line), next};
  if (prefix === ":") return {value: Number(line), next};
  if (prefix === "$") {
    const length = Number(line);
    if (length < 0) return {value: null, next};
    const end = next + length;
    if (buffer.length < end + 2) return null;
    return {value: buffer.slice(next, end).toString("utf8"), next: end + 2};
  }
  if (prefix === "*") {
    const length = Number(line);
    if (length < 0) return {value: null, next};
    const values: unknown[] = [];
    let cursor = next;
    for (let index = 0; index < length; index += 1) {
      const parsed = parseRedisValue(buffer, cursor);
      if (!parsed) return null;
      values.push(parsed.value);
      cursor = parsed.next;
    }
    return {value: values, next: cursor};
  }
  return null;
}

function log(level: "info" | "warn" | "error", scope: string, data: Record<string, unknown> = {}): void {
  const payload = {at: new Date().toISOString(), level, scope, ...data};
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function safeErrorMessage(message: string): string {
  if (message === "request_body_too_large") return "请求体过大。";
  return "Battle API 请求失败。";
}

function createRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function numberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

function shutdown(signal: string): void {
  log("info", "server-shutdown", {signal});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
