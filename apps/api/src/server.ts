import http from "node:http";
import crypto from "node:crypto";
import net from "node:net";
import {createInMemoryBattleService} from "@changebattle-v2/showdown-battle-core";
import {claimFormalSettlementBp, createChangeBattleV2Api, type BattlePreferenceV4, type FormalBattleResultFinalizeReasonV4, type FormalGameModeV4, type FormalGameRunV4, type FormalSettlementReasonV4, type PlayerVaultV4, type ShowdownPlayerIdV4, type TrainingRunGameV4, type UserProfileV2} from "./index.js";

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
  roomFinalResultTtlMs: number;
  roomDisconnectedAfterMs: number;
  roomClosedAfterMs: number;
  roomSweepIntervalMs: number;
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

type FormalRoomRestActionStoredResultV1 = {
  actionType: string;
  message: string;
  revision: number;
  moneyDelta: number;
  createdAt: string;
};

type FormalRoomDraftSyncStoredResultV1 = {
  label: string;
  revision: number;
  createdAt: string;
};

type FormalRoomFinalResultV1 = {
  clientRequestId: string;
  settlementId: string;
  formalRun: FormalGameRunV4;
  profile: UserProfileV2;
  playerVault: PlayerVaultV4;
  summary: {
    reason: FormalSettlementReasonV4;
    bpGained: number;
    depositedItemCount: number;
    rejectedItemCount: number;
  };
  createdAt: string;
  expiresAt: string;
};

type FormalRoomFinalResultResponseV1 = {
  room: ReturnType<typeof publicRoom>;
  formalRun: FormalGameRunV4;
  profile: UserProfileV2;
  playerVault: PlayerVaultV4;
  settlementId: string;
  summary: FormalRoomFinalResultV1["summary"];
  reused: boolean;
};

type FormalLobbyMemberV1 = {
  memberId: string;
  roomCustomId: string;
  name: string;
  avatarAsset?: string;
  frontAsset?: string;
  role: "host" | "guest";
  connectionState: "online" | "disconnected";
  ready: boolean;
  joinedAt: string;
  updatedAt: string;
};

type FormalLobbyMatchStatusV1 = "not_started" | "started_group_stage" | "started_top8_stage" | "ended";

type FormalLobbyMatchV1 = {
  matchId: string;
  title: string;
  mode: FormalGameModeV4;
  config: {
    mode: FormalGameModeV4;
    battlePreferenceSnapshot: BattlePreferenceV4 | Record<string, unknown>;
  };
  status: FormalLobbyMatchStatusV1;
  phaseLabel: "未开始" | "小组赛阶段" | "8强阶段" | "已结束";
  createdBy: string;
  participantMemberIds: string[];
  formalRun: FormalGameRunV4;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
};

type FormalRoomRecordV1 = {
  roomId: string;
  roomTokenHash: string;
  roomCustomId?: string;
  hostMemberId?: string;
  selfMemberId?: string;
  members?: FormalLobbyMemberV1[];
  matches?: FormalLobbyMatchV1[];
  activeMatchId?: string | null;
  formalRun?: FormalGameRunV4 | null;
  activeBattle?: FormalRoomActiveBattleV1 | null;
  restActionResults?: Record<string, FormalRoomRestActionStoredResultV1>;
  draftSyncResults?: Record<string, FormalRoomDraftSyncStoredResultV1>;
  finalResult?: FormalRoomFinalResultV1 | null;
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

type RoomWsClient = {
  id: string;
  socket: net.Socket;
  roomId: string;
  roomTokenHash: string | null;
  authed: boolean;
  buffer: Buffer;
  closed: boolean;
  createdAtMs: number;
  closeLogged: boolean;
  closeCode: number | null;
  closeReason: string | null;
  closeSource: string | null;
  fragmentedOpcode: number | null;
  fragmentedPayloads: Buffer[];
  authTimer: NodeJS.Timeout;
};

const service = createInMemoryBattleService();
const formalApi = createChangeBattleV2Api();
const config = loadConfig();
const sessionMeta = new Map<string, SessionMeta>();
const loggedAiDecisionCounts = new Map<string, number>();
const roomLocks = new Map<string, Promise<void>>();
const roomSockets = new Map<string, Set<RoomWsClient>>();
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
    const roomMatchesCreateMatch = /^\/rooms\/([^/]+)\/matches$/.exec(pathname);
    const roomMatchDetailMatch = /^\/rooms\/([^/]+)\/matches\/([^/]+)$/.exec(pathname);
    const roomMatchReadyMatch = /^\/rooms\/([^/]+)\/matches\/([^/]+)\/ready$/.exec(pathname);
    const roomMatchUnreadyMatch = /^\/rooms\/([^/]+)\/matches\/([^/]+)\/unready$/.exec(pathname);
    const roomMatchStartMatch = /^\/rooms\/([^/]+)\/matches\/([^/]+)\/start$/.exec(pathname);
    const roomSelectStartersMatch = /^\/rooms\/([^/]+)\/formal\/select-starters$/.exec(pathname);
    const roomPrepareRoundMatch = /^\/rooms\/([^/]+)\/formal\/prepare-round$/.exec(pathname);
    const roomRestActionMatch = /^\/rooms\/([^/]+)\/formal\/rest-action$/.exec(pathname);
    const roomSyncDraftMatch = /^\/rooms\/([^/]+)\/formal\/sync-rest-draft$/.exec(pathname);
    const roomPrepareBattleMatch = /^\/rooms\/([^/]+)\/formal\/prepare-battle$/.exec(pathname);
    const roomFinalizeBattleMatch = /^\/rooms\/([^/]+)\/formal\/finalize-battle$/.exec(pathname);
    const roomFinalizeRunMatch = /^\/rooms\/([^/]+)\/formal\/finalize-run$/.exec(pathname);
    const roomFinalResultMatch = /^\/rooms\/([^/]+)\/final-result$/.exec(pathname);
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
      assertRoomOpen(room);
      const next = touchRoom(room);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      sendJson(response, 200, publicRoom(next));
      log("info", "room-heartbeat", {requestId, roomId, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomMatchesCreateMatch) {
      const roomId = decodeURIComponent(roomMatchesCreateMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => createFormalLobbyMatch(roomId, request, body));
      sendJson(response, 200, result);
      log("info", "room-match-created", {requestId, roomId, matchId: result.match.matchId, revision: result.room.revision, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "GET" && roomMatchDetailMatch) {
      const roomId = decodeURIComponent(roomMatchDetailMatch[1]!);
      const matchId = decodeURIComponent(roomMatchDetailMatch[2]!);
      const room = await loadAuthorizedRoom(roomId, request);
      const match = findRoomMatch(room, matchId);
      sendJson(response, 200, {room: publicRoom(room), match});
      return;
    }
    if (request.method === "POST" && (roomMatchReadyMatch || roomMatchUnreadyMatch)) {
      const matched = roomMatchReadyMatch || roomMatchUnreadyMatch!;
      const roomId = decodeURIComponent(matched[1]!);
      const matchId = decodeURIComponent(matched[2]!);
      const ready = Boolean(roomMatchReadyMatch);
      const result = await withRoomLock(roomId, async () => setFormalLobbyMatchReady(roomId, request, matchId, ready));
      sendJson(response, 200, result);
      log("info", ready ? "room-match-ready" : "room-match-unready", {requestId, roomId, matchId, revision: result.room.revision, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomMatchStartMatch) {
      const roomId = decodeURIComponent(roomMatchStartMatch[1]!);
      const matchId = decodeURIComponent(roomMatchStartMatch[2]!);
      const result = await withRoomLock(roomId, async () => startFormalLobbyMatch(roomId, request, matchId));
      sendJson(response, 200, result);
      log("info", "room-match-started", {requestId, roomId, matchId, revision: result.room.revision, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomSelectStartersMatch) {
      const roomId = decodeURIComponent(roomSelectStartersMatch[1]!);
      const body = await readJson(request);
      const room = await withRoomLock(roomId, async () => {
        const current = await loadAuthorizedRoom(roomId, request);
        const formalRun = runFormalStep(() => formalApi.selectFormalStarterPokemon(requireActiveFormalRun(current), body?.selectedIndexes || []));
        const next = advanceRoom(current, formalRun);
        await saveRoom(next);
        broadcastRoomUpdated(next);
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
        const formalRun = await runFormalStepAsync(() => formalApi.prepareFormalRoundPlan(requireActiveFormalRun(current)));
        const next = advanceRoom(current, formalRun);
        await saveRoom(next);
        broadcastRoomUpdated(next);
        return next;
      });
      sendJson(response, 200, publicRoom(room));
      log("info", "room-formal-round-prepared", {requestId, roomId, revision: room.revision, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomSyncDraftMatch) {
      const roomId = decodeURIComponent(roomSyncDraftMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => syncFormalRoomDraft(roomId, roomTokenFromRequest(request), body));
      sendJson(response, 200, result);
      log("info", "room-formal-draft-synced", {requestId, roomId, revision: result.room.revision, label: result.label, elapsedMs: Date.now() - startedAt});
      return;
    }
    if (request.method === "POST" && roomRestActionMatch) {
      const roomId = decodeURIComponent(roomRestActionMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => applyFormalRoomRestAction(roomId, roomTokenFromRequest(request), body));
      sendJson(response, 200, result);
      log("info", "room-formal-rest-action", {
        requestId,
        roomId,
        actionType: result.actionType,
        revision: result.room.revision,
        moneyDelta: result.moneyDelta,
        elapsedMs: Date.now() - startedAt,
      });
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
    if (request.method === "POST" && roomFinalizeRunMatch) {
      const roomId = decodeURIComponent(roomFinalizeRunMatch[1]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => finalizeFormalRoomRun(roomId, request, body));
      sendJson(response, 200, result);
      log("info", "room-formal-run-finalized", {
        requestId,
        roomId,
        settlementId: result.settlementId,
        bpGained: result.summary.bpGained,
        reused: result.reused,
        elapsedMs: Date.now() - startedAt,
      });
      return;
    }
    if (request.method === "GET" && roomFinalResultMatch) {
      const roomId = decodeURIComponent(roomFinalResultMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      const result = getRoomFinalResult(room);
      sendJson(response, 200, result);
      return;
    }
    if (request.method === "DELETE" && roomMatch) {
      const roomId = decodeURIComponent(roomMatch[1]!);
      const room = await loadAuthorizedRoom(roomId, request);
      broadcastRoomClosed(room.roomId, "deleted");
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

server.on("upgrade", (request, socket) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${config.host}:${config.port}`}`);
    const pathname = normalizePathname(url.pathname);
    const match = /^\/rooms\/([^/]+)\/ws$/.exec(pathname);
    if (!match || request.headers.upgrade?.toLowerCase() !== "websocket") {
      socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
    const key = String(request.headers["sec-websocket-key"] || "");
    if (!key) {
      socket.write("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
    const accept = crypto
      .createHash("sha1")
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");
    socket.write([
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "\r\n",
    ].join("\r\n"));
    attachRoomWebSocket(socket as net.Socket, decodeURIComponent(match[1]!));
  } catch (error) {
    log("warn", "room-ws-upgrade-failed", {error: error instanceof Error ? error.message : String(error)});
    socket.destroy();
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
  void markRestartedBattleRooms();
});

setInterval(() => {
  void sweepRoomLifecycle();
}, config.roomSweepIntervalMs).unref();

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
    roomMaxCount: numberEnv("CHANGEBATTLE_ROOM_MAX_COUNT", 100, 0),
    roomMaxBytes: numberEnv("CHANGEBATTLE_ROOM_MAX_BYTES", 1024 * 1024),
    roomMemorySafetyBytes: numberEnv("CHANGEBATTLE_ROOM_MEMORY_SAFETY_BYTES", 32 * 1024 * 1024),
    roomCreateMaxConcurrency: numberEnv("CHANGEBATTLE_ROOM_CREATE_MAX_CONCURRENCY", 1),
    roomFinalResultTtlMs: numberEnv("CHANGEBATTLE_ROOM_FINAL_RESULT_TTL_MS", 30 * 60 * 1000),
    roomDisconnectedAfterMs: numberEnv("CHANGEBATTLE_ROOM_DISCONNECTED_AFTER_MS", 5 * 60 * 1000),
    roomClosedAfterMs: numberEnv("CHANGEBATTLE_ROOM_CLOSED_AFTER_MS", 10 * 60 * 1000),
    roomSweepIntervalMs: numberEnv("CHANGEBATTLE_ROOM_SWEEP_INTERVAL_MS", 60 * 1000),
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
  const memberId = randomToken(14);
  const roomCustomId = createRoomCustomId();
  const profileSnapshot = body?.profileSnapshot && typeof body.profileSnapshot === "object" ? body.profileSnapshot as Partial<UserProfileV2> : null;
  const memberName = typeof body?.memberName === "string" && body.memberName.trim()
    ? body.memberName.trim().slice(0, 16)
    : typeof profileSnapshot?.name === "string" && profileSnapshot.name.trim()
      ? profileSnapshot.name.trim().slice(0, 16)
      : "游客";
  const avatarAsset = typeof profileSnapshot?.avatarAsset === "string" ? profileSnapshot.avatarAsset : "";
  const frontAsset = typeof profileSnapshot?.frontAsset === "string" ? profileSnapshot.frontAsset : "";
  const member: FormalLobbyMemberV1 = {
    memberId,
    roomCustomId,
    name: memberName,
    ...(avatarAsset ? {avatarAsset} : {}),
    ...(frontAsset ? {frontAsset} : {}),
    role: "host",
    connectionState: "online",
    ready: false,
    joinedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const record: FormalRoomRecordV1 = {
    roomId,
    roomTokenHash: hashToken(roomToken),
    roomCustomId,
    hostMemberId: memberId,
    selfMemberId: memberId,
    members: [member],
    matches: [],
    activeMatchId: null,
    formalRun: null,
    revision: 1,
    status: "open",
    connectionState: "online",
    closeReason: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastHeartbeatAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
  await saveRoom(record);
  await redisCommand("SADD", roomIndexKey, roomId);
  return {...publicRoom(record), roomToken, selfMemberId: memberId, selfRoomCustomId: roomCustomId};
  } finally {
    roomCreateInFlightCount = Math.max(0, roomCreateInFlightCount - 1);
  }
}

async function createFormalLobbyMatch(roomId: string, request: http.IncomingMessage, body: any): Promise<{room: Record<string, unknown>; match: FormalLobbyMatchV1; formalRun: FormalGameRunV4}> {
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  if ((current.matches || []).some(match => match.status !== "ended")) {
    throw new HttpError(409, "match_exists", "当前房间已有对局。");
  }
  const now = new Date();
  const member = getSelfMember(current);
  const mode = normalizeFormalRoomMode(body?.mode);
  const formalRun = createInitialFormalRun({
    ...body,
    mode,
    options: {...(body?.options && typeof body.options === "object" ? body.options : {}), mode},
  }, `${roomId}:${randomToken(8)}`);
  const match: FormalLobbyMatchV1 = {
    matchId: randomToken(16),
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim().slice(0, 24) : formalModeMatchTitle(mode),
    mode,
    config: {
      mode,
      battlePreferenceSnapshot: body?.battlePreferenceSnapshot && typeof body.battlePreferenceSnapshot === "object" ? body.battlePreferenceSnapshot : {},
    },
    status: "not_started",
    phaseLabel: "未开始",
    createdBy: member.memberId,
    participantMemberIds: [member.memberId],
    formalRun,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const nextMembers = (current.members || []).map(entry => entry.memberId === member.memberId ? {...entry, ready: false, updatedAt: now.toISOString()} : entry);
  const next: FormalRoomRecordV1 = {
    ...touchRoom(current),
    members: nextMembers,
    matches: [match],
    activeMatchId: match.matchId,
    formalRun,
    revision: current.revision + 1,
    status: "open",
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {room: publicRoom(next), match, formalRun};
}

async function setFormalLobbyMatchReady(roomId: string, request: http.IncomingMessage, matchId: string, ready: boolean): Promise<{room: Record<string, unknown>; match: FormalLobbyMatchV1}> {
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  const match = findRoomMatch(current, matchId);
  if (match.status !== "not_started") throw new HttpError(409, "match_already_started", "对局已经开始。");
  const member = getSelfMember(current);
  const now = new Date();
  const nextMembers = (current.members || []).map(entry => entry.memberId === member.memberId ? {...entry, ready, updatedAt: now.toISOString()} : entry);
  const next: FormalRoomRecordV1 = {
    ...touchRoom(current),
    members: nextMembers,
    revision: current.revision + 1,
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {room: publicRoom(next), match: findRoomMatch(next, matchId)};
}

async function startFormalLobbyMatch(roomId: string, request: http.IncomingMessage, matchId: string): Promise<{room: Record<string, unknown>; match: FormalLobbyMatchV1; formalRun: FormalGameRunV4}> {
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  const match = findRoomMatch(current, matchId);
  if (match.status !== "not_started") return {room: publicRoom(current), match, formalRun: match.formalRun};
  const members = current.members || [];
  const participants = members.filter(member => match.participantMemberIds.includes(member.memberId));
  if (!participants.length || participants.some(member => !member.ready)) {
    throw new HttpError(409, "members_not_ready", "所有成员准备后才可以开始。");
  }
  const now = new Date();
  const startedMatch: FormalLobbyMatchV1 = {
    ...match,
    status: "started_group_stage",
    phaseLabel: "小组赛阶段",
    updatedAt: now.toISOString(),
    startedAt: now.toISOString(),
  };
  const next: FormalRoomRecordV1 = {
    ...touchRoom(current),
    matches: (current.matches || []).map(entry => entry.matchId === matchId ? startedMatch : entry),
    activeMatchId: matchId,
    formalRun: startedMatch.formalRun,
    revision: current.revision + 1,
    status: roomStatusFromFormalRun(startedMatch.formalRun),
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {room: publicRoom(next), match: startedMatch, formalRun: startedMatch.formalRun};
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
    if (error instanceof HttpError) throw error;
    throw formalFlowError(error);
  }
}

async function runFormalStepAsync<T>(step: () => Promise<T>): Promise<T> {
  try {
    return await step();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw formalFlowError(error);
  }
}

function formalFlowError(error: unknown): HttpError {
  const message = error instanceof Error ? error.message : String(error || "正式流程计算失败。");
  return new HttpError(400, "formal_flow_error", message || "正式流程计算失败。");
}

function roomIsClosed(room: FormalRoomRecordV1): boolean {
  return room.status === "closed" || room.connectionState === "closed" || Boolean(room.closeReason);
}

function assertRoomOpen(room: FormalRoomRecordV1): void {
  if (roomIsClosed(room)) {
    throw new HttpError(409, "room_closed", "房间已经关闭。");
  }
}

function requireActiveFormalRun(room: FormalRoomRecordV1): FormalGameRunV4 {
  const run = room.formalRun || findActiveRoomMatch(room)?.formalRun || null;
  if (!run) throw new HttpError(409, "match_not_started", "当前房间还没有开始对局。");
  return run;
}

function findActiveRoomMatch(room: FormalRoomRecordV1): FormalLobbyMatchV1 | null {
  const matches = room.matches || [];
  return matches.find(match => match.matchId === room.activeMatchId) || matches.find(match => match.status !== "ended") || null;
}

function findRoomMatch(room: FormalRoomRecordV1, matchId: string): FormalLobbyMatchV1 {
  const match = (room.matches || []).find(entry => entry.matchId === matchId);
  if (!match) throw new HttpError(404, "match_not_found", "对局不存在。");
  return match;
}

function getSelfMember(room: FormalRoomRecordV1): FormalLobbyMemberV1 {
  const memberId = room.selfMemberId || room.hostMemberId || "";
  const member = (room.members || []).find(entry => entry.memberId === memberId);
  if (!member) throw new HttpError(409, "room_member_missing", "房间成员不存在。");
  return member;
}

function createRoomCustomId(): string {
  return `G${Math.floor(100000 + Math.random() * 900000)}`;
}

function formalModeMatchTitle(mode: FormalGameModeV4): string {
  if (mode === "doubles") return "双打-AI";
  if (mode === "coop") return "合作-AI";
  return "单打-AI";
}

function advanceRoom(room: FormalRoomRecordV1, formalRun: FormalGameRunV4): FormalRoomRecordV1 {
  assertRoomOpen(room);
  const now = new Date();
  const activeMatchId = room.activeMatchId || findActiveRoomMatch(room)?.matchId || null;
  const matches = activeMatchId ? (room.matches || []).map(match => match.matchId === activeMatchId ? {
    ...match,
    formalRun,
    status: matchStatusFromFormalRun(formalRun),
    phaseLabel: matchPhaseLabelFromFormalRun(formalRun),
    updatedAt: now.toISOString(),
    endedAt: formalRun.settled ? (match.endedAt || now.toISOString()) : match.endedAt,
  } : match) : room.matches;
  return {
    ...room,
    formalRun,
    matches,
    activeMatchId,
    revision: room.revision + 1,
    status: roomStatusFromFormalRun(formalRun),
    connectionState: room.connectionState === "closed" ? "closed" : "online",
    updatedAt: now.toISOString(),
    lastHeartbeatAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
}

async function syncFormalRoomDraft(roomId: string, roomToken: string, body: any): Promise<{room: Record<string, unknown>; formalRun: FormalGameRunV4; label: string; reused: boolean}> {
  const clientActionId = requiredString(body?.clientActionId, "clientActionId");
  const current = await loadAuthorizedRoomByToken(roomId, roomToken);
  assertRoomOpen(current);
  const repeated = current.draftSyncResults?.[clientActionId];
  if (repeated) {
    const activeFormalRun = requireActiveFormalRun(current);
    return {
      room: publicRoom(current),
      formalRun: activeFormalRun,
      label: repeated.label,
      reused: true,
    };
  }
  if (current.activeBattle?.status === "preparing" || current.activeBattle?.status === "running") {
    throw new HttpError(409, "room_not_resting", "当前房间正在战斗，不能修改休整状态。");
  }
  if (body?.baseRevision !== undefined && Number(body.baseRevision) !== current.revision) {
    throw new HttpError(409, "formal_revision_conflict", "正式流程状态已更新，请刷新后重试。");
  }
  const draft = validateFormalRunDraft(current, body?.formalRunDraft || requireActiveFormalRun(current));
  validateFormalRestActionDraft(draft);
  const label = typeof body?.label === "string" && body.label.trim() ? body.label.trim().slice(0, 40) : "休整同步";
  const nextRoomBase = advanceRoom(current, draft);
  const now = new Date().toISOString();
  const draftSyncResults = pruneDraftSyncResults({
    ...(current.draftSyncResults || {}),
    [clientActionId]: {
      label,
      revision: nextRoomBase.revision,
      createdAt: now,
    },
  });
  const next = {
    ...nextRoomBase,
    draftSyncResults,
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {room: publicRoom(next), formalRun: requireActiveFormalRun(next), label, reused: false};
}

function roomStatusFromFormalRun(run: FormalGameRunV4): RoomStatus {
  return run.status || "preparing";
}

function matchStatusFromFormalRun(run: FormalGameRunV4): FormalLobbyMatchStatusV1 {
  if (run.settled || run.status === "ended") return "ended";
  return isFormalTop8Stage(run) ? "started_top8_stage" : "started_group_stage";
}

function matchPhaseLabelFromFormalRun(run: FormalGameRunV4): FormalLobbyMatchV1["phaseLabel"] {
  if (run.settled || run.status === "ended") return "已结束";
  return isFormalTop8Stage(run) ? "8强阶段" : "小组赛阶段";
}

function isFormalTop8Stage(run: FormalGameRunV4): boolean {
  return /top.?8|quarter|semi|final|boss/i.test(String((run.restRunSnapshot as any)?.phase || (run.restRunSnapshot as any)?.stage || (run as any).phase || ""));
}

async function prepareFormalRoomBattle(roomId: string, request: http.IncomingMessage, body: any): Promise<Record<string, unknown>> {
  const clientRequestId = requiredString(body?.clientRequestId, "clientRequestId");
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  if (current.activeBattle?.status !== "finalized" && current.activeBattle?.sessionId) {
    if (current.activeBattle.clientRequestId !== clientRequestId && current.activeBattle.status === "preparing") {
      throw new HttpError(409, "active_battle_exists", "当前房间已有战斗正在创建。");
    }
    const snapshot = await getRoomBattleSnapshot(current);
    return {
      room: publicRoom(current),
      formalRun: requireActiveFormalRun(current),
      sessionId: current.activeBattle.sessionId,
      snapshot: sanitizeSnapshot(snapshot),
      reused: true,
    };
  }
  const draft = validateFormalRunDraft(current, body?.formalRunDraft || requireActiveFormalRun(current));
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
  broadcastRoomUpdated(next);
  return {
    room: publicRoom(next),
    formalRun: requireActiveFormalRun(next),
    sessionId: snapshot.id,
    snapshot: sanitizeSnapshot(snapshot),
    reused: false,
  };
}

function validateFormalRunDraft(room: FormalRoomRecordV1, value: unknown): FormalGameRunV4 {
  if (!value || typeof value !== "object") throw new HttpError(400, "formal_flow_error", "缺少正式流程草稿。");
  const draft = value as FormalGameRunV4;
  const activeFormalRun = requireActiveFormalRun(room);
  if (draft.id !== activeFormalRun.id) throw new HttpError(409, "formal_run_mismatch", "正式流程房间不匹配。");
  if (draft.mode !== activeFormalRun.mode) throw new HttpError(409, "formal_run_mismatch", "正式流程模式不匹配。");
  if (Math.floor(Number(draft.currentRoundIndex || 0)) !== Math.floor(Number(activeFormalRun.currentRoundIndex || 0))) {
    throw new HttpError(409, "formal_revision_conflict", "正式流程轮次已经变化，请刷新后重试。");
  }
  if (!draft.restRunSnapshot) throw new HttpError(400, "formal_flow_error", "缺少休整快照。");
  if (!draft.playerTeam?.pokemon?.length) throw new HttpError(400, "formal_flow_error", "缺少玩家队伍。");
  return draft;
}

async function applyFormalRoomRestAction(roomId: string, roomToken: string, body: any): Promise<{room: Record<string, unknown>; formalRun: FormalGameRunV4; actionType: string; message: string; moneyDelta: number; result: unknown; reused: boolean}> {
  const clientActionId = requiredString(body?.clientActionId, "clientActionId");
  const current = await loadAuthorizedRoomByToken(roomId, roomToken);
  assertRoomOpen(current);
  const repeated = current.restActionResults?.[clientActionId];
  if (repeated) {
    const activeFormalRun = requireActiveFormalRun(current);
    return {
      room: publicRoom(current),
      formalRun: activeFormalRun,
      actionType: repeated.actionType,
      message: repeated.message,
      moneyDelta: repeated.moneyDelta,
      result: {ok: true, message: repeated.message},
      reused: true,
    };
  }
  if (current.activeBattle?.status === "preparing" || current.activeBattle?.status === "running") {
    throw new HttpError(409, "room_not_resting", "当前房间正在战斗，不能修改休整状态。");
  }
  if (body?.baseRevision !== undefined && Number(body.baseRevision) !== current.revision) {
    throw new HttpError(409, "formal_revision_conflict", "正式流程状态已更新，请刷新后重试。");
  }
  const draft = validateFormalRunDraft(current, body?.formalRunDraft || requireActiveFormalRun(current));
  validateFormalRestActionDraft(draft);
  const action = body?.action && typeof body.action === "object" ? body.action : null;
  const actionType = requiredString(action?.type, "action.type");
  const result = runFormalStep(() => applyFormalRestActionToRun(draft, actionType, action));
  if (!result.ok) throw new HttpError(400, "formal_rest_action_failed", result.message || "休整操作失败。");
  const nextRoomBase = advanceRoom(current, result.run);
  const moneyDelta = Math.floor(Number(requireActiveFormalRun(nextRoomBase).money || 0)) - Math.floor(Number(draft.money || 0));
  const now = new Date().toISOString();
  const restActionResults = pruneRestActionResults({
    ...(current.restActionResults || {}),
    [clientActionId]: {
      actionType,
      message: result.message,
      revision: nextRoomBase.revision,
      moneyDelta,
      createdAt: now,
    },
  });
  const next = {
    ...nextRoomBase,
    restActionResults,
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {
    room: publicRoom(next),
    formalRun: requireActiveFormalRun(next),
    actionType,
    message: result.message,
    moneyDelta,
    result,
    reused: false,
  };
}

function validateFormalRestActionDraft(run: FormalGameRunV4): void {
  const restStatus = run.restRunSnapshot?.status || "";
  if (run.status === "ended" || restStatus === "battlePreparing" || restStatus === "battling" || restStatus === "ended" || restStatus === "battleEndedPendingSettlement") {
    throw new HttpError(409, "room_not_resting", "当前不是可操作的休整阶段。");
  }
}

function applyFormalRestActionToRun(run: FormalGameRunV4, actionType: string, action: any): {ok: boolean; run: FormalGameRunV4; message: string} {
  if (actionType === "team.heal") {
    return formalApi.healFormalRestTeam(run);
  }
  if (actionType === "pokemon.exchange") {
    return formalApi.exchangeFormalRestPokemon(run, {
      sourcePokemonId: requiredString(action?.sourcePokemonId, "sourcePokemonId"),
      targetPokemonId: requiredString(action?.targetPokemonId, "targetPokemonId"),
    });
  }
  if (actionType === "shop.buy") {
    return formalApi.buyFormalRestShopItem(run, requiredString(action?.slotId, "slotId"));
  }
  if (actionType === "training.apply") {
    return formalApi.applyFormalTrainingGroundLesson(run, action?.input || {});
  }
  throw new HttpError(400, "unsupported_rest_action", "暂不支持这个休整操作。");
}

function pruneRestActionResults(results: Record<string, FormalRoomRestActionStoredResultV1>): Record<string, FormalRoomRestActionStoredResultV1> {
  const entries = Object.entries(results)
    .sort((a, b) => Date.parse(b[1].createdAt) - Date.parse(a[1].createdAt))
    .slice(0, 120)
    .map(([clientActionId, result]) => [
      clientActionId,
      {
        actionType: result.actionType,
        message: result.message,
        revision: Math.floor(Number(result.revision || 0)),
        moneyDelta: Math.floor(Number(result.moneyDelta || 0)),
        createdAt: result.createdAt,
      },
    ] satisfies [string, FormalRoomRestActionStoredResultV1]);
  return Object.fromEntries(entries);
}

function pruneDraftSyncResults(results: Record<string, FormalRoomDraftSyncStoredResultV1>): Record<string, FormalRoomDraftSyncStoredResultV1> {
  const entries = Object.entries(results)
    .sort((a, b) => Date.parse(b[1].createdAt) - Date.parse(a[1].createdAt))
    .slice(0, 120)
    .map(([clientActionId, result]) => [
      clientActionId,
      {
        label: result.label,
        revision: Math.floor(Number(result.revision || 0)),
        createdAt: result.createdAt,
      },
    ] satisfies [string, FormalRoomDraftSyncStoredResultV1]);
  return Object.fromEntries(entries);
}

async function getRoomBattleSnapshot(room: FormalRoomRecordV1): Promise<any> {
  assertRoomOpen(room);
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
  assertRoomOpen(current);
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
  assertRoomOpen(current);
  const activeBattle = current.activeBattle;
  if (!activeBattle?.sessionId) throw new HttpError(409, "active_battle_missing", "当前房间没有可结算的战斗。");
  if (activeBattle.finalizeRequestId === clientRequestId && activeBattle.finalizeResult) {
    return {...activeBattle.finalizeResult, formalRun: requireActiveFormalRun(current), room: publicRoom(current)};
  }
  const snapshot = await getRoomBattleSnapshot(current);
  const timeline = await service.getPlaybackTimeline(activeBattle.sessionId, 0).catch(() => null);
  const reason = normalizeFinalizeReason(body?.reason);
  const finalized = await runFormalStepAsync(() => formalApi.finalizeFormalBattleResultV4(requireActiveFormalRun(current), snapshot, reason, {playbackTimeline: timeline}));
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
  broadcastRoomUpdated(next);
  await closeSession(activeBattle.sessionId).catch(() => undefined);
  return {...finalResult, formalRun, room: publicRoom(next)};
}

async function finalizeFormalRoomRun(roomId: string, request: http.IncomingMessage, body: any): Promise<FormalRoomFinalResultResponseV1> {
  const clientRequestId = requiredString(body?.clientRequestId, "clientRequestId");
  const current = await loadAuthorizedRoom(roomId, request);
  if (current.finalResult) {
    return finalResultResponse(current, current.finalResult, current.finalResult.clientRequestId === clientRequestId);
  }
  if (current.connectionState === "closed" || current.closeReason) {
    throw new HttpError(409, "room_closed", "房间已经关闭。");
  }
  if (current.activeBattle?.status === "preparing" || current.activeBattle?.status === "running") {
    throw new HttpError(409, "room_not_settleable", "当前房间仍在战斗，不能最终结算。");
  }
  const activeFormalRun = requireActiveFormalRun(current);
  if (!activeFormalRun.restRunSnapshot) {
    throw new HttpError(409, "room_not_settleable", "当前房间还没有可结算的正式流程。");
  }
  const profileSnapshot = body?.profileSnapshot as UserProfileV2 | undefined;
  if (!profileSnapshot || typeof profileSnapshot !== "object") {
    throw new HttpError(400, "bad_request", "缺少玩家画像快照。");
  }
  const playerVaultSnapshot = body?.playerVaultSnapshot as PlayerVaultV4 | undefined;
  const reason = normalizeSettlementReason(body?.reason);
  const now = new Date();
  const prepared = runFormalStep(() => formalApi.prepareFormalSettlement(activeFormalRun, reason));
  let formalRun = prepared;
  let profile = profileSnapshot;
  if (prepared.settlement && !prepared.settlement.claimedAt) {
    profile = claimFormalSettlementBp(profileSnapshot, prepared.settlement, now);
    formalRun = {
      ...prepared,
      settlement: {...prepared.settlement, claimedAt: now.toISOString()},
      updatedAt: now.toISOString(),
    };
  }
  let playerVault = formalApi.syncFormalSoulmateLocalTeamToVault(formalRun, playerVaultSnapshot || null);
  let depositedItemCount = 0;
  let rejectedItemCount = 0;
  if (formalRun.settlement && !formalRun.settlement.playerVaultItemsClaimedAt) {
    const claimedAt = now.toISOString();
    if (formalRun.pendingSettlementExportItemInstanceIds?.length) {
      const mergeResult = formalApi.mergeFormalRunBagIntoPlayerVault(playerVault, formalRun);
      playerVault = mergeResult.vault;
      depositedItemCount = mergeResult.depositedItemCount;
      rejectedItemCount = mergeResult.rejectedItemCount;
    }
    formalRun = {
      ...formalRun,
      settlement: {
        ...formalRun.settlement,
        playerVaultItemsClaimedAt: claimedAt,
        playerVaultItemsClaimedCount: depositedItemCount,
        playerVaultItemsRejectedCount: rejectedItemCount,
      },
      updatedAt: claimedAt,
    };
  }
  if (!formalRun.settlement?.id) {
    throw new HttpError(400, "formal_flow_error", "最终结算生成失败。");
  }
  const expiresAt = new Date(now.getTime() + config.roomFinalResultTtlMs).toISOString();
  const finalResult: FormalRoomFinalResultV1 = {
    clientRequestId,
    settlementId: formalRun.settlement.id,
    formalRun,
    profile,
    playerVault,
    summary: {
      reason,
      bpGained: Math.max(0, Math.round(Number(formalRun.settlement.bpGained || 0))),
      depositedItemCount,
      rejectedItemCount,
    },
    createdAt: now.toISOString(),
    expiresAt,
  };
  const next: FormalRoomRecordV1 = {
    ...advanceRoom(current, formalRun),
    status: "ended",
    connectionState: "closed",
    closeReason: "finalized",
    finalResult,
    expiresAt,
  };
  await saveRoom(next, config.roomFinalResultTtlMs);
  broadcastRoomUpdated(next);
  broadcastRoomClosed(next.roomId, "finalized");
  return finalResultResponse(next, finalResult, false);
}

function getRoomFinalResult(room: FormalRoomRecordV1): FormalRoomFinalResultResponseV1 {
  const finalResult = room.finalResult;
  if (!finalResult) throw new HttpError(404, "final_result_not_found", "最终结算结果不存在或已过期。");
  if (Date.parse(finalResult.expiresAt) <= Date.now()) {
    throw new HttpError(410, "final_result_expired", "最终结算结果已过期。");
  }
  return finalResultResponse(room, finalResult, true);
}

function finalResultResponse(room: FormalRoomRecordV1, finalResult: FormalRoomFinalResultV1, reused: boolean): FormalRoomFinalResultResponseV1 {
  return {
    room: publicRoom(room),
    formalRun: finalResult.formalRun,
    profile: finalResult.profile,
    playerVault: finalResult.playerVault,
    settlementId: finalResult.settlementId,
    summary: finalResult.summary,
    reused,
  };
}

function normalizeFinalizeReason(value: unknown): FormalBattleResultFinalizeReasonV4 | undefined {
  return value === "loss" || value === "surrender" || value === "complete" ? value : undefined;
}

function normalizeSettlementReason(value: unknown): FormalSettlementReasonV4 {
  return value === "complete" || value === "loss" || value === "surrender" || value === "abandon" ? value : "loss";
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
  return loadAuthorizedRoomByToken(roomId, roomTokenFromRequest(request));
}

async function loadAuthorizedRoomByToken(roomId: string, roomToken: string): Promise<FormalRoomRecordV1> {
  const room = await loadRoom(roomId);
  if (!room) throw new HttpError(404, "room_not_found", "房间不存在或已过期。");
  const tokenHash = roomToken.startsWith("sha256:") ? roomToken.slice("sha256:".length) : roomToken ? hashToken(roomToken) : "";
  if (!tokenHash || tokenHash !== room.roomTokenHash) {
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

async function saveRoom(room: FormalRoomRecordV1, ttlMs = config.sessionTtlMs): Promise<void> {
  ensureRedisEnabled();
  const compactRoom = compactRoomForSave(room);
  const raw = JSON.stringify(compactRoom);
  if (Buffer.byteLength(raw, "utf8") > config.roomMaxBytes) {
    throw new HttpError(413, "room_too_large", "房间数据过大。");
  }
  await redisCommand("SET", roomKey(compactRoom.roomId), raw, "PX", String(ttlMs));
}

function compactRoomForSave(room: FormalRoomRecordV1): FormalRoomRecordV1 {
  if (!room.restActionResults && !room.draftSyncResults) return room;
  return {
    ...room,
    restActionResults: room.restActionResults ? pruneRestActionResults(room.restActionResults) : undefined,
    draftSyncResults: room.draftSyncResults ? pruneDraftSyncResults(room.draftSyncResults) : undefined,
  };
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
  const {roomTokenHash: _roomTokenHash, activeBattle, restActionResults: _restActionResults, draftSyncResults: _draftSyncResults, finalResult: _finalResult, ...safeRoom} = room;
  const activeMatch = findActiveRoomMatch(room);
  const formalRun = room.formalRun || activeMatch?.formalRun || null;
  return {
    ...safeRoom,
    formalRun,
    finalResult: room.finalResult ? {
      settlementId: room.finalResult.settlementId,
      createdAt: room.finalResult.createdAt,
      expiresAt: room.finalResult.expiresAt,
    } : null,
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

function attachRoomWebSocket(socket: net.Socket, roomId: string): void {
  let client!: RoomWsClient;
  const authTimer = setTimeout(() => closeWsClient(client, 4401, "auth_timeout"), 5000);
  client = {
    id: createRequestId(),
    socket,
    roomId,
    roomTokenHash: null,
    authed: false,
    buffer: Buffer.alloc(0),
    closed: false,
    createdAtMs: Date.now(),
    closeLogged: false,
    closeCode: null,
    closeReason: null,
    closeSource: null,
    fragmentedOpcode: null,
    fragmentedPayloads: [],
    authTimer,
  };
  socket.on("data", chunk => {
    try {
      client.buffer = Buffer.concat([client.buffer, chunk]);
      if (client.buffer.byteLength > config.maxBodyBytes + 1024) {
        closeWsClient(client, 4400, "message_too_large");
        return;
      }
      drainWsFrames(client);
    } catch (error) {
      sendWsJson(client, {type: "server.error", error: "ws_parse_error", message: "WebSocket 消息解析失败。"});
      closeWsClient(client, 4400, "parse_error");
      log("warn", "room-ws-parse-failed", {roomId, clientId: client.id, error: error instanceof Error ? error.message : String(error)});
    }
  });
  socket.on("close", hadError => {
    markWsCloseDetails(client, hadError ? "socket_close_error" : "socket_close", client.closeCode, client.closeReason);
    unregisterWsClient(client);
  });
  socket.on("error", error => {
    markWsCloseDetails(client, "socket_error", client.closeCode, error instanceof Error ? error.message : String(error));
    unregisterWsClient(client);
  });
}

function drainWsFrames(client: RoomWsClient): void {
  while (client.buffer.byteLength >= 2) {
    const parsed = readWsFrame(client.buffer);
    if (!parsed) return;
    client.buffer = client.buffer.subarray(parsed.consumed);
    if (parsed.opcode === 0x8) {
      const closePayload = parseWsClosePayload(parsed.payload);
      markWsCloseDetails(client, "client_close_frame", closePayload.code, closePayload.reason || "client_close");
      closeWsClient(client, 1000, "client_close");
      return;
    }
    if (parsed.opcode === 0x9) {
      sendWsFrame(client.socket, parsed.payload, 0xA);
      continue;
    }
    if (parsed.opcode === 0x0) {
      if (client.fragmentedOpcode === null) {
        log("warn", "room-ws-unexpected-continuation", {roomId: client.roomId, clientId: client.id});
        closeWsClient(client, 4400, "unexpected_continuation");
        return;
      }
      client.fragmentedPayloads.push(parsed.payload);
      if (!parsed.fin) continue;
      const opcode = client.fragmentedOpcode;
      const payload = Buffer.concat(client.fragmentedPayloads);
      client.fragmentedOpcode = null;
      client.fragmentedPayloads = [];
      if (opcode === 0x1) void handleRoomWsMessage(client, payload.toString("utf8"));
      continue;
    }
    if (parsed.opcode !== 0x1) continue;
    if (!parsed.fin) {
      client.fragmentedOpcode = parsed.opcode;
      client.fragmentedPayloads = [parsed.payload];
      continue;
    }
    void handleRoomWsMessage(client, parsed.payload.toString("utf8"));
  }
}

function readWsFrame(buffer: Buffer): {fin: boolean; opcode: number; payload: Buffer; consumed: number} | null {
  if (buffer.byteLength < 2) return null;
  const first = buffer[0]!;
  const second = buffer[1]!;
  const fin = (first & 0x80) !== 0;
  const opcode = first & 0x0f;
  const masked = (second & 0x80) !== 0;
  let length = second & 0x7f;
  let offset = 2;
  if (length === 126) {
    if (buffer.byteLength < offset + 2) return null;
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.byteLength < offset + 8) return null;
    const bigLength = buffer.readBigUInt64BE(offset);
    if (bigLength > BigInt(config.maxBodyBytes)) throw new Error("ws_message_too_large");
    length = Number(bigLength);
    offset += 8;
  }
  const maskOffset = offset;
  if (masked) offset += 4;
  if (buffer.byteLength < offset + length) return null;
  const payload = Buffer.from(buffer.subarray(offset, offset + length));
  if (masked) {
    const mask = buffer.subarray(maskOffset, maskOffset + 4);
    for (let index = 0; index < payload.byteLength; index += 1) {
      payload[index] = payload[index]! ^ mask[index % 4]!;
    }
  }
  return {fin, opcode, payload, consumed: offset + length};
}

function parseWsClosePayload(payload: Buffer): {code: number | null; reason: string} {
  if (payload.byteLength < 2) return {code: null, reason: ""};
  return {
    code: payload.readUInt16BE(0),
    reason: payload.subarray(2).toString("utf8"),
  };
}

async function handleRoomWsMessage(client: RoomWsClient, raw: string): Promise<void> {
  let message: any;
  try {
    message = JSON.parse(raw);
  } catch {
    sendWsJson(client, {type: "server.error", error: "bad_json", message: "WebSocket 消息不是合法 JSON。"});
    log("warn", "room-ws-bad-json", {roomId: client.roomId, clientId: client.id, bytes: Buffer.byteLength(raw, "utf8")});
    return;
  }
  try {
    if (!client.authed) {
      if (message?.type !== "auth") {
        closeWsClient(client, 4401, "auth_required");
        return;
      }
      const roomToken = requiredString(message?.roomToken, "roomToken");
      const room = await loadAuthorizedRoomByToken(client.roomId, roomToken);
      if (roomIsClosed(room)) {
        sendWsJson(client, {type: "room.closed", room: publicRoom(room), reason: room.closeReason || "closed"});
        closeWsClient(client, 4409, room.closeReason || "room_closed");
        log("info", "room-ws-closed-rejected", {roomId: client.roomId, clientId: client.id, reason: room.closeReason || "closed"});
        return;
      }
      client.authed = true;
      client.roomTokenHash = hashToken(roomToken);
      clearTimeout(client.authTimer);
      registerWsClient(client);
      const next = touchRoom(room);
      await saveRoom(next);
      sendWsJson(client, {type: "room.ready", room: publicRoom(next), formalRun: next.formalRun || findActiveRoomMatch(next)?.formalRun || null, revision: next.revision});
      broadcastRoomUpdated(next, client);
      log("info", "room-ws-authed", {roomId: client.roomId, clientId: client.id});
      return;
    }
    if (message?.type === "room.heartbeat" || message?.type === "room.get" || message?.type === "rest.syncDraft" || message?.type === "rest.action") {
      sendWsJson(client, {
        type: "server.error",
        error: "client_ws_action_disabled",
        action: message?.type,
        message: "房间 WebSocket 只用于服务器通知，客户端操作请走 HTTP API。",
      });
      log("warn", "room-ws-client-action-disabled", {roomId: client.roomId, clientId: client.id, action: message?.type});
      return;
    }
    sendWsJson(client, {type: "server.error", error: "unknown_ws_action", message: "未知房间消息。"});
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : "battle_service_error";
    const messageText = error instanceof HttpError ? error.publicMessage : "房间同步失败。";
    const payload = {type: "server.error", action: message?.type || "unknown", error: code, message: messageText, retryable: status >= 500 || status === 408 || status === 429};
    sendWsJson(client, payload);
    log("warn", "room-ws-message-failed", {roomId: client.roomId, clientId: client.id, action: message?.type, error: error instanceof Error ? error.message : String(error)});
  }
}

function registerWsClient(client: RoomWsClient): void {
  let sockets = roomSockets.get(client.roomId);
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(client.roomId, sockets);
  }
  sockets.add(client);
}

function unregisterWsClient(client: RoomWsClient): void {
  if (client.closed) return;
  client.closed = true;
  clearTimeout(client.authTimer);
  logWsClose(client);
  const sockets = roomSockets.get(client.roomId);
  sockets?.delete(client);
  if (sockets && sockets.size === 0) {
    roomSockets.delete(client.roomId);
  }
}

function markWsCloseDetails(client: RoomWsClient, source: string, code: number | null, reason: string | null): void {
  if (!client.closeSource) client.closeSource = source;
  if (client.closeCode === null && code !== null) client.closeCode = code;
  if (!client.closeReason && reason) client.closeReason = reason;
}

function logWsClose(client: RoomWsClient): void {
  if (client.closeLogged) return;
  client.closeLogged = true;
  log("info", "room-ws-closed", {
    roomId: client.roomId,
    clientId: client.id,
    authed: client.authed,
    source: client.closeSource || "unknown",
    code: client.closeCode,
    reason: client.closeReason,
    durationMs: Date.now() - client.createdAtMs,
    bytesRead: client.socket.bytesRead,
    bytesWritten: client.socket.bytesWritten,
  });
}

function broadcastRoomUpdated(room: FormalRoomRecordV1 | undefined, except?: RoomWsClient): void {
  if (!room) return;
  broadcastRoomMessage(room.roomId, {type: "room.updated", room: publicRoom(room), formalRun: room.formalRun || findActiveRoomMatch(room)?.formalRun || null, revision: room.revision}, except);
}

function broadcastRoomClosed(roomId: string, reason: string): void {
  broadcastRoomMessage(roomId, {type: "room.closed", reason});
}

function broadcastRoomMessage(roomId: string, message: unknown, except?: RoomWsClient): void {
  const sockets = roomSockets.get(roomId);
  if (!sockets?.size) return;
  for (const client of sockets) {
    if (client === except || !client.authed || client.closed) continue;
    sendWsJson(client, message);
  }
}

function sendWsJson(client: RoomWsClient, value: unknown): void {
  if (client.closed || client.socket.destroyed) return;
  sendWsFrame(client.socket, Buffer.from(JSON.stringify(value), "utf8"), 0x1);
}

function sendWsFrame(socket: net.Socket, payload: Buffer, opcode: number): void {
  const length = payload.byteLength;
  let header: Buffer;
  if (length < 126) {
    header = Buffer.from([0x80 | opcode, length]);
  } else if (length <= 0xffff) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  socket.write(Buffer.concat([header, payload]));
}

function closeWsClient(client: RoomWsClient, code: number, reason: string): void {
  if (client.closed) return;
  markWsCloseDetails(client, "server_close", code, reason);
  const reasonBuffer = Buffer.from(reason.slice(0, 80), "utf8");
  const payload = Buffer.alloc(2 + reasonBuffer.byteLength);
  payload.writeUInt16BE(code, 0);
  reasonBuffer.copy(payload, 2);
  sendWsFrame(client.socket, payload, 0x8);
  client.socket.end();
  unregisterWsClient(client);
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

async function markRestartedBattleRooms(): Promise<void> {
  if (!config.redisUrl) return;
  try {
    await cleanupRoomIndex();
    const members = await redisCommand("SMEMBERS", roomIndexKey);
    if (!Array.isArray(members)) return;
    for (const roomId of members) {
      if (typeof roomId !== "string") continue;
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room || room.closeReason || room.finalResult) return;
        if (room.activeBattle?.status !== "preparing" && room.activeBattle?.status !== "running") return;
        const now = new Date().toISOString();
        const next: FormalRoomRecordV1 = {
          ...room,
          status: "closed",
          connectionState: "closed",
          closeReason: "server-restarted",
          activeBattle: room.activeBattle ? {...room.activeBattle, updatedAt: now} : room.activeBattle,
          updatedAt: now,
        };
        await saveRoom(next);
        broadcastRoomClosed(roomId, "server-restarted");
        log("warn", "room-closed-server-restarted", {roomId, sessionId: room.activeBattle?.sessionId});
      });
    }
  } catch (error) {
    log("warn", "room-restart-scan-failed", {error: error instanceof Error ? error.message : String(error)});
  }
}

async function sweepRoomLifecycle(): Promise<void> {
  if (!config.redisUrl) return;
  try {
    await cleanupRoomIndex();
    const members = await redisCommand("SMEMBERS", roomIndexKey);
    if (!Array.isArray(members)) return;
    const nowMs = Date.now();
    for (const roomId of members) {
      if (typeof roomId !== "string") continue;
      await withRoomLock(roomId, async () => {
        const room = await loadRoom(roomId);
        if (!room) return;
        if (room.finalResult) return;
        if (room.connectionState === "closed" || room.closeReason) return;
        const lastActiveMs = Date.parse(room.lastHeartbeatAt || room.updatedAt || room.createdAt);
        if (!Number.isFinite(lastActiveMs)) return;
        const idleMs = nowMs - lastActiveMs;
        if (idleMs >= config.roomClosedAfterMs) {
          const now = new Date(nowMs).toISOString();
          const activeSessionId = room.activeBattle?.sessionId || "";
          const next: FormalRoomRecordV1 = {
            ...room,
            status: "closed",
            connectionState: "closed",
            closeReason: "timeout",
            updatedAt: now,
          };
          await saveRoom(next, config.roomFinalResultTtlMs);
          if (activeSessionId) {
            await closeSession(activeSessionId).catch(error => {
              log("warn", "room-timeout-session-close-failed", {roomId, sessionId: activeSessionId, error: error instanceof Error ? error.message : String(error)});
            });
          }
          broadcastRoomClosed(roomId, "timeout");
          log("warn", "room-closed-timeout", {roomId, idleMs});
          return;
        }
        if (idleMs >= config.roomDisconnectedAfterMs && room.connectionState !== "disconnected") {
          const next: FormalRoomRecordV1 = {
            ...room,
            connectionState: "disconnected",
            updatedAt: new Date(nowMs).toISOString(),
          };
          await saveRoom(next);
          broadcastRoomUpdated(next);
          log("info", "room-disconnected", {roomId, idleMs});
        }
      });
    }
  } catch (error) {
    log("warn", "room-lifecycle-sweep-failed", {error: error instanceof Error ? error.message : String(error)});
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

function numberEnv(name: string, fallback: number, min = 1): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= min ? value : fallback;
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
