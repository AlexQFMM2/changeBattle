import http from "node:http";
import crypto from "node:crypto";
import net from "node:net";
import {pathToFileURL} from "node:url";
import {createInMemoryBattleService} from "@changebattle-v2/showdown-battle-core";
import {addPlayerVaultItemV4} from "@changebattle-v2/core";
import {claimFormalSettlementBp, createChangeBattleV2Api, invalidUserProfileAssetFieldsV4, normalizePlayerVault, type BattlePreferenceV4, type FormalBattleResultFinalizeReasonV4, type FormalGameModeV4, type FormalGameRunV4, type FormalShopProductViewV4, type LocalPokemonV4, type PlayerItemInstanceV4, type PlayerVaultV4, type ShowdownPlayerIdV4, type FormalSettlementReasonV4, type TrainingPlayerDraftV4, type TrainingRunGameV4, type UserProfileV2} from "./index.js";
import {applyRecoveryItemToPokemonV4, applyTmItemToPokemonV4, applyTrainingItemToPokemonV4, canUseRecoveryItemV4, canUseTmItemV4, canUseTrainingItemV4, clearConsumedItemFromTeamV4, tmUseFailureReasonV4} from "./itemEffects.js";
import {matchLegacyFormalRoomRoute} from "./legacyFormalRoomRoutes.js";
import {createMemoryRedisLikeProvider, createRedisSocketProvider, type RedisLikeCommandProvider} from "./roomStore.js";
import {applyTrainingLessonV5, buildScopedFormalRoomViewV5, buyShopCartProductsV5, buyShopProductV5, chooseMedicalInsuranceV5, commitFinalSettlementFromRunGameV5, commitSelfBagMutationV5, createRunGameV5FromStarterRun, ensureDefaultSystemItemsForSelfV5, exchangeSelfPokemonV5, finalizeBattleResultFromSnapshotV5, getMedicalInsuranceTierForChoiceV5, getPokemonExchangeViewV5, getTrainingGroundLessonForInputV5, healSelfTeamV5, ingestGeneratedParticipantV5, markBattleRunningV5, prepareBattleSessionFromRunGameV5, prepareFinalSettlementFromRunGameV5, prepareRestRoundV5, refreshShopProductsV5, reorderPlayerTeamV5, rerollSelfPokemonStatsV5, selectStarterPokemonV5, sellBagItemsV5, unlockOpponentPreviewV5, viewScopeForRunGameV5, type RunGameV5, type ViewScopeNameV5} from "./runGameV5.js";
import {generateFormalCoopAllyParticipantV5, generateFormalRoundParticipantsV5} from "./formalParticipantGenerationV5.js";
import {normalizeBattlePreferenceV4} from "./training.js";

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
  enableLegacyFormalRoutes: boolean;
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

type FormalRoomFinalResultV1 = {
  clientRequestId: string;
  settlementId: string;
  formalRun: FormalGameRunV4 | null;
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
  formalRun?: FormalGameRunV4 | null;
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
  formalRun: FormalGameRunV4 | null;
  runGameV5?: RunGameV5 | null;
  settlementSummary?: unknown;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  cleanupAt?: string;
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

export type BattleApiServerOptions = {
  host?: string;
  port?: number;
  basePath?: string;
  roomStore?: RedisLikeCommandProvider;
  storageKind?: "redis" | "memory";
  battleService?: ReturnType<typeof createInMemoryBattleService>;
  configOverrides?: Partial<ServerConfig>;
};

export type BattleApiServerHandle = {
  server: http.Server;
  baseUrl: string;
  actualPort: number;
  start(): Promise<BattleApiServerHandle>;
  close(): Promise<void>;
};

let service = createInMemoryBattleService();
let formalApi = createChangeBattleV2Api();
let config = loadConfig();
let roomStore: RedisLikeCommandProvider | null = config.redisUrl ? createRedisSocketProvider(config.redisUrl) : null;
let sessionMeta = new Map<string, SessionMeta>();
let loggedAiDecisionCounts = new Map<string, number>();
let roomLocks = new Map<string, Promise<void>>();
let roomSockets = new Map<string, Set<RoomWsClient>>();
const roomIndexKey = "cb:rooms";
let roomCreateInFlightCount = 0;
let roomSweepTimer: NodeJS.Timeout | null = null;
let activeServerHandle: BattleApiServerHandle | null = null;

function createHttpRequestHandler(): http.RequestListener {
  return async (request, response) => {
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
        storage: roomStore?.storageKind || "disabled",
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
    const roomMatchViewMatch = /^\/rooms\/([^/]+)\/matches\/([^/]+)\/view$/.exec(pathname);
    const roomMatchCommandMatch = /^\/rooms\/([^/]+)\/matches\/([^/]+)\/commands\/([^/]+)$/.exec(pathname);
    const legacyFormalRouteMatch = matchLegacyFormalRoomRoute(request.method || "", pathname);
    const roomFinalResultMatch = /^\/rooms\/([^/]+)\/final-result$/.exec(pathname);
    const roomBattleSnapshotMatch = /^\/rooms\/([^/]+)\/battle\/snapshot$/.exec(pathname);
    const roomBattleTimelineMatch = /^\/rooms\/([^/]+)\/battle\/playback-timeline$/.exec(pathname);
    const roomBattleChoiceMatch = /^\/rooms\/([^/]+)\/battle\/choices$/.exec(pathname);

    if (legacyFormalRouteMatch) {
      if (config.enableLegacyFormalRoutes) {
        throw new HttpError(410, "legacy_formal_adapter_unmounted", "旧正式流程房间接口已拆离主服务；如需诊断旧存档，请单独挂载 dev-only legacy adapter。");
      }
      throw new HttpError(410, "legacy_formal_route_disabled", "旧正式流程房间接口已隔离，请使用 match-scoped scoped view 和具体 command。");
    }

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
      sendJson(response, 200, {room: publicRoom(room), match: publicMatch(match)});
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
    if (request.method === "GET" && roomMatchViewMatch) {
      const roomId = decodeURIComponent(roomMatchViewMatch[1]!);
      const matchId = decodeURIComponent(roomMatchViewMatch[2]!);
      const scope = parseViewScopeV5(url.searchParams.get("scope"));
      const room = await loadAuthorizedRoom(roomId, request);
      sendJson(response, 200, buildFormalScopedMatchView(room, matchId, scope));
      return;
    }
    if (request.method === "POST" && roomMatchCommandMatch) {
      const roomId = decodeURIComponent(roomMatchCommandMatch[1]!);
      const matchId = decodeURIComponent(roomMatchCommandMatch[2]!);
      const commandName = decodeURIComponent(roomMatchCommandMatch[3]!);
      const body = await readJson(request);
      const result = await withRoomLock(roomId, async () => handleFormalMatchCommand(roomId, request, matchId, commandName, body));
      sendJson(response, 200, result);
      log("info", "room-match-command", {requestId, roomId, matchId, commandName, revision: result.revision, elapsedMs: Date.now() - startedAt});
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
      const snapshot = await createBattleSessionWithRuntimeGuard(input);
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
  };
}

function attachBattleApiServerUpgradeHandler(server: http.Server): void {
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
}

export function createBattleApiServer(options: BattleApiServerOptions = {}): BattleApiServerHandle {
  const baseConfig = loadConfig();
  const nextConfig: ServerConfig = {
    ...baseConfig,
    ...options.configOverrides,
    host: options.host || options.configOverrides?.host || baseConfig.host,
    port: options.port ?? options.configOverrides?.port ?? baseConfig.port,
    basePath: normalizeBasePath(options.basePath ?? options.configOverrides?.basePath ?? baseConfig.basePath),
    startedAt: Date.now(),
  };
  config = nextConfig;
  service = options.battleService || createInMemoryBattleService();
  formalApi = createChangeBattleV2Api();
  roomStore = options.roomStore || (options.storageKind === "memory"
    ? createMemoryRedisLikeProvider()
    : config.redisUrl
      ? createRedisSocketProvider(config.redisUrl)
      : null);
  sessionMeta = new Map<string, SessionMeta>();
  loggedAiDecisionCounts = new Map<string, number>();
  roomLocks = new Map<string, Promise<void>>();
  roomSockets = new Map<string, Set<RoomWsClient>>();
  roomCreateInFlightCount = 0;
  if (roomSweepTimer) {
    clearInterval(roomSweepTimer);
    roomSweepTimer = null;
  }

  const server = http.createServer(createHttpRequestHandler());
  attachBattleApiServerUpgradeHandler(server);

  const handle: BattleApiServerHandle = {
    server,
    baseUrl: `http://${config.host}:${config.port}${config.basePath}`,
    actualPort: config.port,
    async start() {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          const address = server.address();
          const actualPort = typeof address === "object" && address ? address.port : config.port;
          handle.actualPort = actualPort;
          handle.baseUrl = `http://${config.host}:${actualPort}${config.basePath}`;
          log("info", "server-listening", {
            host: config.host,
            port: actualPort,
            basePath: config.basePath,
            maxSessions: config.maxSessions,
            sessionTtlMs: config.sessionTtlMs,
            storage: roomStore?.storageKind || "disabled",
          });
          void markRestartedBattleRooms();
          roomSweepTimer = setInterval(() => {
            void sweepRoomLifecycle();
          }, config.roomSweepIntervalMs);
          roomSweepTimer.unref();
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(config.port, config.host);
      });
      return handle;
    },
    async close() {
      if (roomSweepTimer) {
        clearInterval(roomSweepTimer);
        roomSweepTimer = null;
      }
      for (const clients of roomSockets.values()) {
        for (const client of clients) closeWsClient(client, 1001, "server_shutdown");
      }
      roomSockets.clear();
      for (const sessionId of Array.from(sessionMeta.keys())) {
        await closeSession(sessionId).catch(error => {
          log("warn", "session-close-failed", {sessionId, error: error instanceof Error ? error.message : String(error)});
        });
      }
      await new Promise<void>((resolve, reject) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close(error => {
          if (error) reject(error);
          else resolve();
        });
      });
      await roomStore?.close?.().catch(error => {
        log("warn", "room-store-close-failed", {error: error instanceof Error ? error.message : String(error)});
      });
      if (activeServerHandle === handle) activeServerHandle = null;
    },
  };
  return handle;
}

export async function startBattleApiServerFromEnv(): Promise<BattleApiServerHandle> {
  activeServerHandle = createBattleApiServer();
  await activeServerHandle.start();
  return activeServerHandle;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startBattleApiServerFromEnv();
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

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
    enableLegacyFormalRoutes: booleanEnv("CHANGEBATTLE_ENABLE_LEGACY_FORMAL_ROUTES", false),
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

async function createBattleSessionWithRuntimeGuard(input: Parameters<typeof service.createBattleSession>[0]): Promise<Awaited<ReturnType<typeof service.createBattleSession>>> {
  try {
    return await service.createBattleSession(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Showdown vendor|ts-chacha20|sim[\\/]index\.js|battle-stream\.js/i.test(message)) {
      log("error", "battle-runtime-unavailable", {error: message});
      throw new HttpError(503, "battle_runtime_unavailable", "离线战斗运行时不可用，请重新安装完整的 Desk portable 包。");
    }
    throw error;
  }
}

async function createFormalRoom(body: any): Promise<Record<string, unknown>> {
  ensureRoomStoreAvailable();
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
  if (profileSnapshot) assertProfileSnapshotAssetFields(profileSnapshot);
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

async function createFormalLobbyMatch(roomId: string, request: http.IncomingMessage, body: any): Promise<{room: Record<string, unknown>; match: FormalLobbyMatchV1}> {
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  if ((current.matches || []).some(match => match.status !== "ended")) {
    throw new HttpError(409, "match_exists", "当前房间已有对局。");
  }
  const now = new Date();
  const member = getSelfMember(current);
  assertProfileSnapshotAssetFields(body?.profileSnapshot as Partial<UserProfileV2> | null | undefined);
  const mode = normalizeFormalRoomMode(body?.mode);
  const battlePreferenceSnapshot = normalizeBattlePreferenceV4(
    body?.battlePreferenceSnapshot && typeof body.battlePreferenceSnapshot === "object"
      ? body.battlePreferenceSnapshot
      : (body?.profileSnapshot as UserProfileV2 | undefined)?.battlePreference,
  );
  const starterRun = createInitialFormalRun({
    ...body,
    mode,
    battlePreferenceSnapshot,
    options: {...(body?.options && typeof body.options === "object" ? body.options : {}), mode},
  }, `${roomId}:${randomToken(8)}`);
  const matchId = randomToken(16);
  const runGameV5 = createRunGameV5FromStarterRun({
    roomId,
    matchId,
    createdByMemberId: member.memberId,
    roomCustomId: member.roomCustomId,
    profileSnapshot: body?.profileSnapshot as UserProfileV2,
    playerVaultSnapshot: body?.playerVaultSnapshot as PlayerVaultV4 | null | undefined,
    starterRun,
    now,
  });
  const match: FormalLobbyMatchV1 = {
    matchId,
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim().slice(0, 24) : formalModeMatchTitle(mode),
    mode,
    config: {
      mode,
      battlePreferenceSnapshot,
    },
    status: "not_started",
    phaseLabel: "未开始",
    createdBy: member.memberId,
    participantMemberIds: [member.memberId],
    formalRun: null,
    runGameV5,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const nextMembers = (current.members || []).map(entry => entry.memberId === member.memberId ? {...entry, ready: false, updatedAt: now.toISOString()} : entry);
  const next: FormalRoomRecordV1 = {
    ...touchRoom(current),
    members: nextMembers,
    matches: [match],
    activeMatchId: match.matchId,
    formalRun: null,
    revision: current.revision + 1,
    status: "open",
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {room: publicRoom(next), match: publicMatch(match)};
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
  return {room: publicRoom(next), match: publicMatch(findRoomMatch(next, matchId))};
}

async function startFormalLobbyMatch(roomId: string, request: http.IncomingMessage, matchId: string): Promise<{room: Record<string, unknown>; match: FormalLobbyMatchV1}> {
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  const match = findRoomMatch(current, matchId);
  if (!match.runGameV5) throw new HttpError(409, "v5_run_missing", "当前对局不是 V5 权威模型，请重新创建对局。");
  if (match.status !== "not_started") return {room: publicRoom(current), match: publicMatch(match)};
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
    formalRun: null,
    revision: current.revision + 1,
    status: "open",
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {room: publicRoom(next), match: publicMatch(startedMatch)};
}

function createInitialFormalRun(body: any, roomId: string): FormalGameRunV4 {
  const profileSnapshot = body?.profileSnapshot as UserProfileV2 | undefined;
  if (!profileSnapshot || typeof profileSnapshot !== "object") {
    throw new HttpError(400, "formal_flow_error", "缺少玩家画像快照。");
  }
  const mode = normalizeFormalRoomMode(body?.mode);
  const battlePreference = normalizeBattlePreferenceV4(
    body?.battlePreferenceSnapshot && typeof body.battlePreferenceSnapshot === "object"
      ? body.battlePreferenceSnapshot
      : profileSnapshot.battlePreference,
  );
  const runProfileSnapshot = {
    ...profileSnapshot,
    battlePreference,
  };
  const playerVaultSnapshot = body?.playerVaultSnapshot as PlayerVaultV4 | null | undefined;
  const options = body?.options && typeof body.options === "object" ? body.options : {};
  const seed = typeof body?.seed === "string" && body.seed.trim() ? body.seed : roomId;
  return runFormalStep(() => {
    const base = formalApi.createFormalGameRun(runProfileSnapshot, {
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

function publicMatch(match: FormalLobbyMatchV1): FormalLobbyMatchV1 {
  const {formalRun: _formalRun, runGameV5: _runGameV5, ...safeMatch} = match;
  return safeMatch as FormalLobbyMatchV1;
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

function requireCommandMatch(room: FormalRoomRecordV1, matchId: string): FormalLobbyMatchV1 {
  const match = findRoomMatch(room, matchId);
  if (room.activeMatchId && room.activeMatchId !== matchId) {
    throw new HttpError(409, "match_not_active", "当前对局不是房间内正在进行的对局。");
  }
  return match;
}

function buildFormalScopedMatchView(room: FormalRoomRecordV1, matchId: string, scopeInput: ViewScopeNameV5 | null = null, extras: Record<string, unknown> = {}): Record<string, unknown> & {revision: number} {
  const publicState = publicRoom(room) as any;
  const match = findRoomMatch(room, matchId);
  if (!match.runGameV5) throw new HttpError(409, "v5_run_missing", "当前对局不是 V5 权威模型，请重新创建对局。");
  const scope = scopeInput || viewScopeForRunGameV5(match.runGameV5);
  const scopedView = buildScopedFormalRoomViewV5(match.runGameV5, scope, publicState.activeBattle || null);
  return {
    room: publicState,
    match: publicMatch(match),
    revision: room.revision,
    phase: formalRoomPhaseFromState(room, match),
    scope,
    view: scopedView,
    activeBattle: publicState.activeBattle || null,
    finalResult: publicState.finalResult || null,
    ...extras,
  };
}

function formalRoomPhaseFromState(room: FormalRoomRecordV1, match: FormalLobbyMatchV1): string {
  const runGameV5 = match.runGameV5;
  if (!runGameV5) return "lobby";
  if (room.finalResult || runGameV5.finalResult || runGameV5.status === "ended") return "settlement";
  if (match.status === "not_started") return "lobby";
  if (room.activeBattle?.status === "preparing") return "battlePreparing";
  if (room.activeBattle?.status === "running") return "battle";
  if (runGameV5.status === "starter_selecting" || runGameV5.phase === "starter") return "starter";
  if (runGameV5.status === "round_preparing") return "roundPreparing";
  if (runGameV5.status === "battle_preparing") return "battlePreparing";
  if (runGameV5.status === "battling" || runGameV5.phase === "battle") return "battle";
  if (runGameV5.status === "battle_settling") return "settling";
  if (runGameV5.status === "settlement_ready" || runGameV5.phase === "settlement") return "settlement";
  return "rest";
}

function parseViewScopeV5(value: string | null): ViewScopeNameV5 | null {
  return value === "summary" || value === "starter" || value === "rest" || value === "battle" || value === "settlement" ? value : null;
}

function viewScopeForCommandV5(commandName: string): ViewScopeNameV5 {
  if (commandName === "select-starters") return "starter";
  if (commandName === "prepare-battle" || commandName === "battle-choice") return "battle";
  if (commandName === "finalize-run") return "settlement";
  if (commandName === "ack-final-result") return "summary";
  return "rest";
}

const FORMAL_REST_COMMAND_NAMES_V5 = new Set([
  "team.heal",
  "pokemon.exchange",
  "shop.buy",
  "shop.buy-cart",
  "shop.refresh",
  "shop.sell",
  "training.apply",
  "pokemon.reroll-stats",
  "bag.use",
  "bag.equip",
  "bag.unequip",
  "bag.discard",
  "opponent-preview.unlock",
  "insurance.buy",
  "soulmate-egg.claim",
]);

function isFormalRestCommandNameV5(commandName: string): boolean {
  return FORMAL_REST_COMMAND_NAMES_V5.has(commandName);
}

function formalRestActionFromCommandNameV5(commandName: string, payload: Record<string, unknown>): Record<string, unknown> {
  if (!isFormalRestCommandNameV5(commandName)) throw new HttpError(400, "unsupported_rest_command", "暂不支持这个休整命令。");
  return {type: commandName, ...payload};
}

async function handleFormalMatchCommand(roomId: string, request: http.IncomingMessage, matchId: string, commandName: string, body: any): Promise<Record<string, unknown> & {revision: number}> {
  const commandId = requiredString(body?.commandId, "commandId");
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};
  const baseRevision = body?.baseRevision;
  if (commandName === "sync-draft") {
    throw new HttpError(410, "unsupported_legacy_command", "新房间主线不再接受整份正式流程草稿。");
  }
  const current = await loadAuthorizedRoom(roomId, request);
  assertRoomOpen(current);
  if (baseRevision !== undefined && Number(baseRevision) !== current.revision) {
    throw new HttpError(409, "formal_revision_conflict", "正式流程状态已更新，请刷新后重试。");
  }
  const match = requireCommandMatch(current, matchId);
  if (commandName === "ack-final-result" && match.status === "ended" && match.cleanupAt) {
    return {
      room: publicRoom(current),
      match: publicMatch(match),
      revision: current.revision,
      phase: "settlement",
      scope: "summary",
      view: null,
      reused: true,
    };
  }
  if (!match.runGameV5) throw new HttpError(409, "v5_run_missing", "当前对局不是 V5 权威模型，请重新创建对局。");
  const repeated = match.runGameV5.commandLog[commandId];
  if (repeated) {
    if (commandName === "prepare-battle" && current.activeBattle?.sessionId) {
      return buildFormalScopedMatchView(current, matchId, "battle", {reused: true, sessionId: current.activeBattle.sessionId, result: repeated.result});
    }
    if (commandName === "finalize-battle" && current.activeBattle?.finalizeResult) {
      return buildFormalScopedMatchView(current, matchId, current.activeBattle.finalizeResult.destination === "settlement" ? "settlement" : "rest", {reused: true, destination: current.activeBattle.finalizeResult.destination, result: current.activeBattle.finalizeResult});
    }
    if (commandName === "finalize-run" && current.finalResult) {
      return buildFormalScopedMatchView(current, matchId, "settlement", {
        reused: true,
        profile: current.finalResult.profile,
        playerVault: current.finalResult.playerVault,
        settlementId: current.finalResult.settlementId,
        summary: current.finalResult.summary,
      });
    }
    return buildFormalScopedMatchView(current, matchId, viewScopeForCommandV5(commandName), {reused: true, result: repeated.result});
  }
  if (commandName === "select-starters") {
    const requiredCount = formalApi.selectedCountForFormalMode(match.runGameV5.config.mode);
    const runGameV5 = runFormalStep(() => selectStarterPokemonV5(match.runGameV5!, (payload as any).selectedIndexes || [], requiredCount, commandId));
    const next = advanceRoomMatchV5(current, matchId, runGameV5);
    await saveRoom(next);
    broadcastRoomUpdated(next);
    return buildFormalScopedMatchView(next, matchId, "starter", {reused: false});
  }
  if (commandName === "prepare-round") {
    const rounds = await runFormalStepAsync(() => generateFormalRoundParticipantsV5({
      matchId: match.runGameV5!.matchId,
      seed: match.runGameV5!.config.seed,
      streak: match.runGameV5!.streak,
      mode: match.runGameV5!.config.mode,
      competitionMode: match.runGameV5!.config.competitionMode,
      ruleSet: match.runGameV5!.config.ruleSet,
      battlePreference: match.runGameV5!.config.battlePreference,
      generateRandomBattleTeam: formalApi.generateRandomBattleTeamPreviewV4,
    }));
    const runGameV5 = runFormalStep(() => prepareRestRoundV5(match.runGameV5!, {commandId, rounds}));
    const next = advanceRoomMatchV5(current, matchId, runGameV5);
    await saveRoom(next);
    broadcastRoomUpdated(next);
    return buildFormalScopedMatchView(next, matchId, "rest", {reused: false});
  }
  if (commandName === "team.reorder") {
    const pokemonIds = Array.isArray((payload as any).pokemonIds) ? (payload as any).pokemonIds : [];
    const runGameV5 = runFormalStep(() => reorderPlayerTeamV5(match.runGameV5!, pokemonIds, commandId));
    const next = advanceRoomMatchV5(current, matchId, runGameV5);
    await saveRoom(next);
    broadcastRoomUpdated(next);
    return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: "队伍顺序已保存。"});
  }
  if (commandName === "rest-action") {
    throw new HttpError(410, "unsupported_legacy_command", "聚合休整命令已隔离，请使用具体 match-scoped command。");
  }
  if (isFormalRestCommandNameV5(commandName)) {
    const action = formalRestActionFromCommandNameV5(commandName, payload);
    const actionType = requiredString((action as any)?.type, "action.type");
    if (actionType === "team.heal") {
      const applied = runFormalStep(() => healSelfTeamV5(match.runGameV5!, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "shop.buy") {
      const slotId = requiredString((action as any)?.slotId, "slotId");
      const currentNodeId = match.runGameV5!.currentNodeId;
      const shop = currentNodeId ? match.runGameV5!.restState.shopByNodeId?.[currentNodeId] || null : null;
      const product = formalApi.createFormalShopProductViews(shop).find(entry => entry.slotId === slotId);
      if (!product) throw new HttpError(400, "formal_rest_action_failed", "商品不存在。");
      const applied = runFormalStep(() => buyShopProductV5(match.runGameV5!, product, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "shop.buy-cart") {
      const slotIds = Array.isArray((action as any)?.slotIds) ? (action as any).slotIds.map((value: unknown) => String(value || "").trim()).filter(Boolean) : [];
      const currentNodeId = match.runGameV5!.currentNodeId;
      const shop = currentNodeId ? match.runGameV5!.restState.shopByNodeId?.[currentNodeId] || null : null;
      const bySlotId = new Map(formalApi.createFormalShopProductViews(shop).map(entry => [entry.slotId, entry]));
      const products: Array<FormalShopProductViewV4 | null> = slotIds.map((slotId: string) => bySlotId.get(slotId) || null);
      if (!slotIds.length || products.some((product): product is null => !product)) throw new HttpError(400, "formal_rest_action_failed", "购物车包含不存在的商品。");
      const selectedProducts = products.filter((product): product is NonNullable<typeof product> => Boolean(product));
      const applied = runFormalStep(() => buyShopCartProductsV5(match.runGameV5!, selectedProducts, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "shop.refresh") {
      const applied = runFormalStep(() => refreshShopProductsV5(match.runGameV5!, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "shop.sell") {
      const itemInstanceIds = Array.isArray((action as any)?.itemInstanceIds) ? (action as any).itemInstanceIds.map((value: unknown) => String(value || "")).filter(Boolean) : [];
      const applied = runFormalStep(() => sellBagItemsV5(match.runGameV5!, itemInstanceIds, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "bag.use" || actionType === "bag.equip" || actionType === "bag.unequip" || actionType === "bag.discard") {
      const applied = runFormalStep(() => applyFormalBagActionV5(match.runGameV5!, actionType, action, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "pokemon.reroll-stats") {
      const input = (action as any)?.input && typeof (action as any).input === "object" ? (action as any).input : action;
      const applied = runFormalStep(() => rerollSelfPokemonStatsV5(match.runGameV5!, {
        pokemonId: requiredString(input?.pokemonId, "pokemonId"),
        part: input?.part,
        lockedStats: Array.isArray(input?.lockedStats) ? input.lockedStats : [],
      }, commandId, new Date(), {calculateMaxHp: calculateFormalPokemonMaxHp}));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "opponent-preview.unlock") {
      const input = (action as any)?.input && typeof (action as any).input === "object" ? (action as any).input : action;
      const applied = runFormalStep(() => unlockOpponentPreviewV5(match.runGameV5!, requiredString(input?.unlockKey, "unlockKey"), commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "insurance.buy") {
      const choice = String((action as any)?.choice || (action as any)?.tier || "basic");
      const tier = runFormalStep(() => getMedicalInsuranceTierForChoiceV5(match.runGameV5!, choice));
      const applied = runFormalStep(() => chooseMedicalInsuranceV5(match.runGameV5!, tier, commandId));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "pokemon.exchange") {
      const sourcePokemonId = requiredString((action as any)?.sourcePokemonId, "sourcePokemonId");
      const targetPokemonId = requiredString((action as any)?.targetPokemonId, "targetPokemonId");
      const view = getPokemonExchangeViewV5(match.runGameV5, {playerId: "p1"});
      const targetPokemon = view.opponent?.localTeam.pokemon.find(pokemon => pokemon.localPokemonId === targetPokemonId) || null;
      if (!targetPokemon) throw new HttpError(400, "invalid_pokemon", "请选择上一场对手队伍中的宝可梦。");
      const applied = runFormalStep(() => exchangeSelfPokemonV5(match.runGameV5!, {sourcePokemonId, targetPokemon, view}, commandId, new Date(), {calculateMaxHp: calculateFormalPokemonMaxHp}));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "training.apply") {
      const trainingInput = ((action as any)?.input && typeof (action as any).input === "object" ? (action as any).input : {}) as Record<string, unknown>;
      const lesson = getTrainingGroundLessonForInputV5(match.runGameV5, trainingInput as any);
      if (!lesson) throw new HttpError(400, "formal_rest_action_failed", "当前没有可用的训练场课程。");
      const pokemonId = requiredString(trainingInput.pokemonId, "pokemonId");
      const pokemon = match.runGameV5.pokemonById[pokemonId]?.localPokemon;
      if (!pokemon) throw new HttpError(400, "invalid_pokemon", "宝可梦不存在。");
      const moveSummary = findTrainingLessonMoveSummary(pokemon.speciesId, lesson.kind, typeof trainingInput.moveId === "string" ? trainingInput.moveId : "");
      const applied = runFormalStep(() => applyTrainingLessonV5(match.runGameV5!, {
        pokemonId,
        moveId: typeof trainingInput.moveId === "string" ? trainingInput.moveId : undefined,
        replaceMoveIndex: typeof trainingInput.replaceMoveIndex === "number" ? trainingInput.replaceMoveIndex : undefined,
        lessonId: typeof trainingInput.lessonId === "string" ? trainingInput.lessonId : undefined,
        lessonKind: typeof trainingInput.lessonKind === "string" ? trainingInput.lessonKind as any : undefined,
        rounds: trainingInput.rounds === undefined ? undefined : Number(trainingInput.rounds),
      }, lesson, moveSummary, commandId, new Date(), {calculateMaxHp: calculateFormalPokemonMaxHp}));
      const next = advanceRoomMatchV5(current, matchId, applied.run);
      await saveRoom(next);
      broadcastRoomUpdated(next);
      return buildFormalScopedMatchView(next, matchId, "rest", {reused: false, message: applied.result.message, result: applied.result});
    }
    if (actionType === "soulmate-egg.claim") {
      throw new HttpError(410, "v5_command_not_migrated", "灵魂蛋领取尚未迁移到纯 V5 实体命令。");
    }
    throw new HttpError(400, "unsupported_rest_action", "暂不支持这个休整操作。");
  }
  if (commandName === "prepare-battle") {
    if (current.activeBattle?.status !== "finalized" && current.activeBattle?.sessionId) {
      const snapshot = await getRoomBattleSnapshot(current);
      return buildFormalScopedMatchView(current, matchId, "battle", {
        reused: current.activeBattle.clientRequestId === commandId,
        sessionId: current.activeBattle.sessionId,
        result: {sessionId: current.activeBattle.sessionId, snapshotStatus: snapshot.status, turn: snapshot.turn},
      });
    }
    let battleRunGameV5 = match.runGameV5;
    const currentBattleNode = battleRunGameV5.gameMap.nodes.find(node => node.nodeId === battleRunGameV5.currentNodeId);
    if (battleRunGameV5.config.mode === "coop" && !currentBattleNode?.slots.p3) {
      if (!currentBattleNode) throw new HttpError(409, "formal_current_node_missing", "当前没有可进入战斗的节点。");
      const ally = await runFormalStepAsync(() => generateFormalCoopAllyParticipantV5({
        matchId: battleRunGameV5.matchId,
        seed: battleRunGameV5.config.seed,
        streak: battleRunGameV5.streak,
        mode: battleRunGameV5.config.mode,
        competitionMode: battleRunGameV5.config.competitionMode,
        ruleSet: battleRunGameV5.config.ruleSet,
        battlePreference: battleRunGameV5.config.battlePreference,
        generateRandomBattleTeam: formalApi.generateRandomBattleTeamPreviewV4,
        nodeId: currentBattleNode.nodeId,
        nodeIndex: currentBattleNode.index,
        nodeSeed: currentBattleNode.seed,
      }));
      battleRunGameV5 = ingestGeneratedParticipantV5(battleRunGameV5, ally);
    }
    battleRunGameV5 = ensureDefaultSystemItemsForSelfV5(battleRunGameV5);
    const prepared = runFormalStep(() => prepareBattleSessionFromRunGameV5(battleRunGameV5));
    const snapshot = await createBattleSessionWithRuntimeGuard(prepared.sessionInput);
    touchSession(snapshot.id);
    logAiDecisions(snapshot);
    const runningV5 = markBattleRunningV5(battleRunGameV5, {nodeId: prepared.sessionInput.nodeId, battleGameId: prepared.battleGame.id, commandId});
    const now = new Date().toISOString();
    const activeBattle: FormalRoomActiveBattleV1 = {
      sessionId: snapshot.id,
      nodeId: prepared.sessionInput.nodeId,
      battleGameId: prepared.battleGame.id,
      clientRequestId: commandId,
      status: "running",
      createdAt: now,
      updatedAt: now,
      choiceActionIds: [],
    };
    const next = {
      ...advanceRoomMatchV5(current, matchId, runningV5),
      activeBattle,
    };
    await saveRoom(next);
    broadcastRoomUpdated(next);
    return buildFormalScopedMatchView(next, matchId, "battle", {reused: false, sessionId: snapshot.id, result: {sessionId: snapshot.id, snapshotStatus: snapshot.status, turn: snapshot.turn}});
  }
  if (commandName === "battle-choice") {
    const snapshot = await submitFormalRoomBattleChoice(roomId, request, {
      clientActionId: commandId,
      playerId: (payload as any).playerId,
      choice: (payload as any).choice,
      trainerItems: (payload as any).trainerItems,
      expectedTurn: (payload as any).expectedTurn,
      expectedRqid: (payload as any).expectedRqid,
    });
    const room = await loadAuthorizedRoom(roomId, request);
    return buildFormalScopedMatchView(room, matchId, "battle", {
      result: {
        sessionId: snapshot.id,
        status: snapshot.status,
        turn: snapshot.turn,
        requestState: snapshot.requests?.p1?.wait ? "wait" : snapshot.requests?.p1 ? "action" : "none",
      },
    });
  }
  if (commandName === "finalize-battle") {
    const result = await finalizeFormalRoomBattleV5(current, match, commandId, payload);
    return buildFormalScopedMatchView(result.roomRecord, matchId, result.finalResult.destination === "settlement" ? "settlement" : "rest", {destination: result.finalResult.destination, result: result.finalResult});
  }
  if (commandName === "finalize-run") {
    const result = await finalizeFormalRoomRunV5KeepRoomOpen(current, match, commandId, payload);
    return buildFormalScopedMatchView(result.roomRecord, matchId, "settlement", {
      profile: result.profile,
      playerVault: result.playerVault,
      settlementId: result.settlementId,
      summary: result.summary,
      reused: result.reused,
    });
  }
  if (commandName === "ack-final-result") {
    if (match.status === "ended" && match.cleanupAt) {
      return buildFormalScopedMatchView(current, match.matchId, "summary", {reused: true});
    }
    const nowDate = new Date();
    const now = nowDate.toISOString();
    const cleanupAt = new Date(nowDate.getTime() + 60 * 1000).toISOString();
    const next: FormalRoomRecordV1 = {
      ...touchRoom(current),
      matches: (current.matches || []).map(entry => entry.matchId === matchId ? {...entry, status: "ended", phaseLabel: "已结束", endedAt: entry.endedAt || now, cleanupAt, settlementSummary: current.finalResult?.summary || entry.settlementSummary, runGameV5: null, formalRun: null, updatedAt: now} : entry),
      activeMatchId: current.activeMatchId === matchId ? null : current.activeMatchId,
      formalRun: current.activeMatchId === matchId ? null : current.formalRun,
      revision: current.revision + 1,
      status: "open",
    };
    await saveRoom(next);
    broadcastRoomUpdated(next);
    const nextMatch = findRoomMatch(next, match.matchId);
    return {
      room: publicRoom(next),
      match: publicMatch(nextMatch),
      revision: next.revision,
      phase: "settlement",
      scope: "summary",
      view: null,
      reused: false,
    };
  }
  throw new HttpError(404, "unknown_command", "未知房间指令。");
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

function assertProfileSnapshotAssetFields(profileSnapshot: Partial<UserProfileV2> | null | undefined): void {
  if (!profileSnapshot) return;
  const invalidFields = invalidUserProfileAssetFieldsV4(profileSnapshot);
  if (invalidFields.length) {
    throw new HttpError(400, "invalid_profile_avatar_asset", "头像资源设置无效，请重新设置头像。");
  }
}

function formalModeMatchTitle(mode: FormalGameModeV4): string {
  if (mode === "doubles") return "双打-AI";
  if (mode === "coop") return "合作-AI";
  return "单打-AI";
}

function advanceRoomMatchV5(room: FormalRoomRecordV1, matchId: string, runGameV5: RunGameV5): FormalRoomRecordV1 {
  assertRoomOpen(room);
  const now = new Date();
  const matches = (room.matches || []).map(match => match.matchId === matchId ? {
    ...match,
    runGameV5,
    formalRun: null,
    status: matchStatusFromRunGameV5(runGameV5),
    phaseLabel: matchPhaseLabelFromRunGameV5(runGameV5),
    updatedAt: now.toISOString(),
    endedAt: runGameV5.status === "ended" ? (match.endedAt || now.toISOString()) : match.endedAt,
  } : match);
  return {
    ...room,
    matches,
    activeMatchId: matchId,
    formalRun: null,
    revision: room.revision + 1,
    status: roomStatusFromRunGameV5(runGameV5),
    connectionState: room.connectionState === "closed" ? "closed" : "online",
    updatedAt: now.toISOString(),
    lastHeartbeatAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
}

function roomStatusFromRunGameV5(run: RunGameV5): RoomStatus {
  if (run.status === "ended") return "ended";
  if (run.status === "starter_selecting" || run.status === "round_preparing") return "preparing";
  return run.status === "battling" || run.status === "battle_preparing" || run.status === "battle_settling" ? "battling" : "running";
}

function matchStatusFromRunGameV5(run: RunGameV5): FormalLobbyMatchStatusV1 {
  if (run.status === "ended") return "ended";
  return "started_group_stage";
}

function matchPhaseLabelFromRunGameV5(run: RunGameV5): FormalLobbyMatchV1["phaseLabel"] {
  if (run.status === "ended") return "已结束";
  return "小组赛阶段";
}

function findTrainingLessonMoveSummary(speciesId: string, lessonKind: string, moveId: string): Partial<any> | null {
  const normalizedMoveId = moveId.trim().toLowerCase();
  if (!normalizedMoveId) return null;
  const pool = lessonKind === "tutor"
    ? formalApi.getPokemonTutorSkills(speciesId)
    : lessonKind === "egg"
      ? formalApi.getPokemonEggSkills(speciesId)
      : lessonKind === "self-learn"
        ? formalApi.getPokemonSelfLearnSkills(speciesId)
        : [];
  return pool.find(move => String(move.id || (move as any).moveId || "").toLowerCase() === normalizedMoveId) || null;
}

function applyFormalBagActionV5(run: RunGameV5, actionType: string, action: any, commandId: string): {run: RunGameV5; result: Record<string, unknown>} {
  const context = requireFormalBagActionContextV5(run, action?.itemInstanceId, action?.pokemonId);
  const {item, pokemon, bag, team} = context;
  if (actionType === "bag.discard") {
    if (!item) throw new HttpError(400, "invalid_item", "道具不存在。");
    const detail = safeItemDetail(item.itemID);
    if (isFormalSystemItem(item, detail)) throw new Error("系统道具不能丢弃。");
    const nextBagItems = bag.items.filter(entry => entry.id !== item.id);
    const nextPokemon = team.map(entry => entry.heldItemInstanceId === item.id ? {...entry, itemId: "", heldItemInstanceId: undefined} : entry);
    return commitSelfBagMutationV5(run, {commandName: actionType, commandId, message: `${item.name || detail?.nameZh || detail?.name || item.itemID} 已丢弃。`, bagItems: nextBagItems, pokemonUpdates: nextPokemon, result: {itemInstanceId: item.id}});
  }
  if (!pokemon) throw new HttpError(400, "invalid_pokemon", "宝可梦不存在。");
  if (actionType === "bag.unequip") {
    if (!pokemon.heldItemInstanceId && !pokemon.itemId) throw new Error("选中宝可梦没有携带道具。");
    const nextPokemon = {...pokemon, itemId: "", heldItemInstanceId: undefined};
    return commitSelfBagMutationV5(run, {commandName: actionType, commandId, message: `${pokemon.nameZh || pokemon.name} 已卸下携带道具。`, pokemonUpdates: [nextPokemon], result: {pokemonId: pokemon.localPokemonId}});
  }
  if (!item) throw new HttpError(400, "invalid_item", "道具不存在。");
  const detail = safeItemDetail(item.itemID);
  if (actionType === "bag.equip") {
    if (!canFormalEquipBagItem(item, detail)) throw new Error("该道具当前不能携带。");
    const heldPatch = heldItemPatchForFormalEquip(item);
    const exclusiveKind = formalSystemExclusiveKind(item);
    const nextPokemon = team.map(entry => {
      if (entry.localPokemonId === pokemon.localPokemonId) return {...entry, ...heldPatch};
      if (exclusiveKind && formalPokemonHasSystemExclusiveKind(entry, exclusiveKind)) return {...entry, itemId: "", heldItemInstanceId: undefined};
      if (entry.heldItemInstanceId === item.id) return {...entry, itemId: "", heldItemInstanceId: undefined};
      return entry;
    });
    return commitSelfBagMutationV5(run, {commandName: actionType, commandId, message: `${pokemon.nameZh || pokemon.name} 已携带 ${item.name || detail?.nameZh || detail?.name || item.itemID}。`, pokemonUpdates: nextPokemon, result: {itemInstanceId: item.id, pokemonId: pokemon.localPokemonId}});
  }
  if (actionType === "bag.use") {
    const result = applyBagUseEffectV5(run, {item, detail, pokemon, bag, team, moveSlot: action?.moveSlot});
    if (!result.ok) throw new Error(result.reason);
    return commitSelfBagMutationV5(run, {commandName: actionType, commandId, message: result.message, bagItems: result.bag.items, pokemonUpdates: result.pokemonUpdates, result: {itemInstanceId: item.id, pokemonId: pokemon.localPokemonId, moveSlot: result.moveSlot}});
  }
  throw new HttpError(400, "unsupported_rest_action", "暂不支持这个背包操作。");
}

function applyBagUseEffectV5(run: RunGameV5, context: {item: PlayerItemInstanceV4; detail: ReturnType<typeof safeItemDetail>; pokemon: LocalPokemonV4; bag: TrainingPlayerDraftV4["bag"]; team: LocalPokemonV4[]; moveSlot?: unknown}): {ok: true; message: string; bag: TrainingPlayerDraftV4["bag"]; pokemonUpdates: LocalPokemonV4[]; moveSlot?: number} | {ok: false; reason: string} {
  const {item, detail, pokemon, bag, team} = context;
  if (canUseTmItemV4(item, detail)) {
    if (typeof context.moveSlot !== "number") {
      return {ok: false, reason: tmUseFailureReasonV4({item, detail, pokemon, machineMoves: formalApi.getPokemonMachineSkills(pokemon.speciesId)}) || "请选择要替换的招式。"};
    }
    const result = applyTmItemToPokemonV4({item, detail, pokemon, bag, machineMoves: formalApi.getPokemonMachineSkills(pokemon.speciesId), moveSlot: context.moveSlot});
    if (!result.ok) return {ok: false, reason: result.reason};
    const pokemonUpdates = clearConsumedItemFromTeamV4(team, item).map(entry => entry.localPokemonId === pokemon.localPokemonId ? result.pokemon : entry);
    return {ok: true, message: result.message, bag: result.bag, pokemonUpdates, moveSlot: result.moveSlot};
  }
  const result = canUseRecoveryItemV4(item, detail)
    ? applyRecoveryItemToPokemonV4({item, detail, pokemon, bag, team})
    : canUseTrainingItemV4(item, detail)
      ? applyTrainingItemToPokemonV4({
        item,
        detail,
        pokemon,
        bag,
        pokemonDetail: safePokemonDetail(pokemon.speciesId),
        calculateMaxHp: next => calculateFormalPokemonMaxHp(next),
        rngSeed: `${run.runId}:${run.currentNodeId || "rest"}:${item.id}:${pokemon.localPokemonId}`,
        translateDexLabel: formalApi.translateDexLabel,
      })
      : {ok: false as const, reason: "该道具当前不能立即使用。"};
  if (!result.ok) return {ok: false, reason: result.reason};
  const pokemonUpdates = clearConsumedItemFromTeamV4(team, item).map(entry => entry.localPokemonId === pokemon.localPokemonId ? result.pokemon : entry);
  return {ok: true, message: result.message, bag: result.bag, pokemonUpdates};
}

function requireFormalBagActionContextV5(run: RunGameV5, itemInstanceId?: string, pokemonId?: string): {bag: TrainingPlayerDraftV4["bag"]; team: LocalPokemonV4[]; item?: PlayerItemInstanceV4; pokemon?: LocalPokemonV4} {
  const self = run.playersById[run.selfPlayerId];
  if (!self) throw new HttpError(409, "room_not_resting", "缺少玩家实体。");
  const bagEntity = run.bagsById[self.bagId];
  if (!bagEntity) throw new HttpError(409, "room_not_resting", "缺少玩家背包。");
  const bag = formalApi.normalizeBagState({
    maxSize: bagEntity.maxSize,
    battleBagEnabled: bagEntity.battleBagEnabled,
    items: bagEntity.itemInstanceIds.map(id => run.itemInstancesById[id]?.item).filter((entry): entry is PlayerItemInstanceV4 => Boolean(entry)),
  });
  const team = self.localTeamPokemonIds.map(id => run.pokemonById[id]?.localPokemon).filter((entry): entry is LocalPokemonV4 => Boolean(entry));
  const item = itemInstanceId ? bag.items.find(entry => entry.id === itemInstanceId) : undefined;
  if (itemInstanceId && !item) throw new HttpError(400, "invalid_item", "道具不存在。");
  const pokemon = pokemonId ? team.find(entry => entry.localPokemonId === pokemonId) : undefined;
  if (pokemonId && !pokemon) throw new HttpError(400, "invalid_pokemon", "宝可梦不存在。");
  return {bag, team, item, pokemon};
}

function applyFormalBagUseAction(run: FormalGameRunV4, input: {itemInstanceId: string; pokemonId: string; moveSlot?: unknown}): {ok: boolean; run: FormalGameRunV4; message: string; [key: string]: unknown} {
  const context = requireFormalBagActionContext(run, input.itemInstanceId, input.pokemonId);
  const {item, pokemon, p1, bag, team} = context;
  const detail = safeItemDetail(item.itemID);
  if (canUseTmItemV4(item, detail)) {
    if (typeof input.moveSlot !== "number") {
      const reason = tmUseFailureReasonV4({
        item,
        detail,
        pokemon,
        machineMoves: formalApi.getPokemonMachineSkills(pokemon.speciesId),
      });
      return {ok: false, run, message: reason || "请选择要替换的招式。"};
    }
    const result = applyTmItemToPokemonV4({
      item,
      detail,
      pokemon,
      bag,
      machineMoves: formalApi.getPokemonMachineSkills(pokemon.speciesId),
      moveSlot: input.moveSlot,
    });
    if (!result.ok) return {ok: false, run, message: result.reason};
    const nextTeam = {
      ...p1.localTeam,
      pokemon: clearConsumedItemFromTeamV4(team, item).map(entry => entry.localPokemonId === pokemon.localPokemonId ? result.pokemon : entry),
    };
    return {ok: true, run: patchFormalBagActionP1(run, {...p1, bag: result.bag, localTeam: nextTeam}), message: result.message, moveSlot: result.moveSlot};
  }
  const result = canUseRecoveryItemV4(item, detail)
    ? applyRecoveryItemToPokemonV4({item, detail, pokemon, bag, team})
    : canUseTrainingItemV4(item, detail)
      ? applyTrainingItemToPokemonV4({
        item,
        detail,
        pokemon,
        bag,
        pokemonDetail: safePokemonDetail(pokemon.speciesId),
        calculateMaxHp: next => calculateFormalPokemonMaxHp(next),
        rngSeed: `${run.id}:${run.currentRoundIndex}:${item.id}:${pokemon.localPokemonId}`,
        translateDexLabel: formalApi.translateDexLabel,
      })
      : {ok: false as const, reason: "该道具当前不能立即使用。"};
  if (!result.ok) return {ok: false, run, message: result.reason};
  const nextTeam = {
    ...p1.localTeam,
    pokemon: clearConsumedItemFromTeamV4(team, item).map(entry => entry.localPokemonId === pokemon.localPokemonId ? result.pokemon : entry),
  };
  return {ok: true, run: patchFormalBagActionP1(run, {...p1, bag: result.bag, localTeam: nextTeam}), message: result.message};
}

function applyFormalBagEquipAction(run: FormalGameRunV4, input: {itemInstanceId: string; pokemonId: string}): {ok: boolean; run: FormalGameRunV4; message: string; [key: string]: unknown} {
  const context = requireFormalBagActionContext(run, input.itemInstanceId, input.pokemonId);
  const {item, pokemon, p1} = context;
  const detail = safeItemDetail(item.itemID);
  if (!canFormalEquipBagItem(item, detail)) return {ok: false, run, message: "该道具当前不能携带。"};
  const heldPatch = heldItemPatchForFormalEquip(item);
  const exclusiveKind = formalSystemExclusiveKind(item);
  const nextTeam = {
    ...p1.localTeam,
    pokemon: p1.localTeam.pokemon.map(entry => {
      if (entry.localPokemonId === pokemon.localPokemonId) return {...entry, ...heldPatch};
      if (exclusiveKind && formalPokemonHasSystemExclusiveKind(entry, exclusiveKind)) return {...entry, itemId: "", heldItemInstanceId: undefined};
      if (entry.heldItemInstanceId === item.id) return {...entry, itemId: "", heldItemInstanceId: undefined};
      return entry;
    }),
  };
  return {
    ok: true,
    run: patchFormalBagActionP1(run, {...p1, localTeam: nextTeam}),
    message: `${pokemon.nameZh || pokemon.name} 已携带 ${item.name || detail?.nameZh || detail?.name || item.itemID}。`,
  };
}

function applyFormalBagUnequipAction(run: FormalGameRunV4, input: {pokemonId: string}): {ok: boolean; run: FormalGameRunV4; message: string; [key: string]: unknown} {
  const context = requireFormalBagActionContext(run, undefined, input.pokemonId);
  const {pokemon, p1} = context;
  if (!pokemon.heldItemInstanceId && !pokemon.itemId) return {ok: false, run, message: "选中宝可梦没有携带道具。"};
  const nextTeam = {
    ...p1.localTeam,
    pokemon: p1.localTeam.pokemon.map(entry => entry.localPokemonId === pokemon.localPokemonId ? {...entry, itemId: "", heldItemInstanceId: undefined} : entry),
  };
  return {ok: true, run: patchFormalBagActionP1(run, {...p1, localTeam: nextTeam}), message: `${pokemon.nameZh || pokemon.name} 已卸下携带道具。`};
}

function applyFormalBagDiscardAction(run: FormalGameRunV4, input: {itemInstanceId: string}): {ok: boolean; run: FormalGameRunV4; message: string; [key: string]: unknown} {
  const context = requireFormalBagActionContext(run, input.itemInstanceId);
  const {item, p1, bag} = context;
  const detail = safeItemDetail(item.itemID);
  if (isFormalSystemItem(item, detail)) return {ok: false, run, message: "系统道具不能丢弃。"};
  const nextBag = {...bag, items: bag.items.filter(entry => entry.id !== item.id)};
  const nextTeam = {
    ...p1.localTeam,
    pokemon: p1.localTeam.pokemon.map(entry => entry.heldItemInstanceId === item.id ? {...entry, itemId: "", heldItemInstanceId: undefined} : entry),
  };
  return {ok: true, run: patchFormalBagActionP1(run, {...p1, bag: nextBag, localTeam: nextTeam}), message: `${item.name || detail?.nameZh || detail?.name || item.itemID} 已丢弃。`};
}

function requireFormalBagActionContext(run: FormalGameRunV4, itemInstanceId?: string, pokemonId?: string): {p1: TrainingPlayerDraftV4; bag: TrainingPlayerDraftV4["bag"]; team: LocalPokemonV4[]; item: PlayerItemInstanceV4; pokemon: LocalPokemonV4};
function requireFormalBagActionContext(run: FormalGameRunV4, itemInstanceId?: string, pokemonId?: string): {p1: TrainingPlayerDraftV4; bag: TrainingPlayerDraftV4["bag"]; team: LocalPokemonV4[]; item?: PlayerItemInstanceV4; pokemon?: LocalPokemonV4} {
  const p1 = run.restRunSnapshot?.players.p1;
  if (!p1) throw new HttpError(409, "room_not_resting", "当前不是可操作的休整阶段。");
  const bag = formalApi.normalizeBagState(p1.bag);
  const team = p1.localTeam.pokemon || [];
  const item = itemInstanceId ? bag.items.find(entry => entry.id === itemInstanceId) : undefined;
  if (itemInstanceId && !item) throw new HttpError(400, "invalid_item", "道具不存在。");
  const pokemon = pokemonId ? team.find(entry => entry.localPokemonId === pokemonId) : undefined;
  if (pokemonId && !pokemon) throw new HttpError(400, "invalid_pokemon", "宝可梦不存在。");
  return {p1, bag, team, item, pokemon};
}

function patchFormalBagActionP1(run: FormalGameRunV4, p1: TrainingPlayerDraftV4): FormalGameRunV4 {
  const restRunSnapshot = run.restRunSnapshot;
  if (!restRunSnapshot) return run;
  const players = {...restRunSnapshot.players, p1};
  const scenarioPlayers = restRunSnapshot.scenario.players.map(player => player.playerId === "p1" ? p1 : player);
  const gameMap = restRunSnapshot.gameMap.map(node => node.id === restRunSnapshot.currentNodeId
    ? {...node, participants: {...node.participants, p1}}
    : node);
  return {
    ...run,
    restRunSnapshot: {
      ...restRunSnapshot,
      players,
      scenario: {...restRunSnapshot.scenario, players: scenarioPlayers},
      gameMap,
      updatedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}

function safeItemDetail(itemId: string) {
  try {
    return formalApi.getItemDetail(itemId);
  } catch {
    return null;
  }
}

function safePokemonDetail(speciesId: string) {
  try {
    return formalApi.getPokemonDetail(speciesId);
  } catch {
    return null;
  }
}

function calculateFormalPokemonMaxHp(pokemon: LocalPokemonV4): number {
  const detail = safePokemonDetail(pokemon.speciesId);
  const baseHp = Math.max(1, Math.floor(Number(detail?.baseStats?.hp || pokemon.maxHp || 1)));
  const level = Math.max(1, Math.min(100, Math.floor(Number(pokemon.level || 50))));
  const iv = Math.max(0, Math.min(31, Math.floor(Number(pokemon.ivs?.hp ?? 31))));
  const ev = Math.max(0, Math.min(255, Math.floor(Number(pokemon.evs?.hp ?? 0))));
  return Math.max(1, Math.floor(((2 * baseHp + iv + Math.floor(ev / 4)) * level) / 100) + level + 10);
}

function canFormalEquipBagItem(item: PlayerItemInstanceV4, detail: ReturnType<typeof safeItemDetail>): boolean {
  if (item.itemID === "system-tera-orb") return false;
  if ((item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal") && !item.mappedItemId) return false;
  return Boolean(item.canTake || detail?.canTake || ["battle", "held", "berry", "special"].includes(detail?.kind || item.type));
}

function heldItemPatchForFormalEquip(item: PlayerItemInstanceV4): Pick<LocalPokemonV4, "itemId" | "heldItemInstanceId"> {
  if ((item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal") && item.mappedItemId) return {itemId: item.mappedItemId, heldItemInstanceId: undefined};
  return {itemId: item.itemID, heldItemInstanceId: item.id};
}

function formalSystemExclusiveKind(item: PlayerItemInstanceV4): PlayerItemInstanceV4["systemReforgeKind"] {
  return item.systemReforgeKind === "mega" || item.systemReforgeKind === "z-crystal" ? item.systemReforgeKind : undefined;
}

function formalPokemonHasSystemExclusiveKind(pokemon: LocalPokemonV4, kind: PlayerItemInstanceV4["systemReforgeKind"]): boolean {
  if (!kind || !pokemon.itemId) return false;
  if (kind === "mega") return /ite(?:x|y)?$/.test(pokemon.itemId);
  if (kind === "z-crystal") return /iumz$/.test(pokemon.itemId);
  return false;
}

function isFormalSystemItem(item: PlayerItemInstanceV4, detail: ReturnType<typeof safeItemDetail>): boolean {
  return item.type === "system" || item.type === "system-battle" || item.itemID.startsWith("system-") || detail?.source === "system";
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

async function finalizeFormalRoomBattleV5(current: FormalRoomRecordV1, match: FormalLobbyMatchV1, commandId: string, payload: any): Promise<{roomRecord: FormalRoomRecordV1; finalResult: FormalRoomBattleFinalizeResultV1 & {room: Record<string, unknown>}}> {
  if (!match.runGameV5) throw new HttpError(409, "v5_run_missing", "当前对局不是 V5 权威模型，请重新创建对局。");
  const activeBattle = current.activeBattle;
  if (!activeBattle?.sessionId) throw new HttpError(409, "active_battle_missing", "当前房间没有可结算的战斗。");
  if (activeBattle.finalizeRequestId === commandId && activeBattle.finalizeResult) {
    return {
      roomRecord: current,
      finalResult: {...activeBattle.finalizeResult, room: publicRoom(current)},
    };
  }
  const snapshot = await getRoomBattleSnapshot(current);
  const reason = normalizeFinalizeReason(payload?.reason);
  let playerVault: PlayerVaultV4 | undefined;
  let settlementNotice = "";
  const finalized = runFormalStep(() => finalizeBattleResultFromSnapshotV5(match.runGameV5!, {
    snapshot,
    commandId,
    reason,
    settlementNotice,
  }));
  const finalResult: FormalRoomBattleFinalizeResultV1 = {
    destination: finalized.result.destination,
    reason: finalized.result.reason,
    playerVault,
    settlementNotice,
  };
  const runGameV5 = finalized.run;
  const now = new Date().toISOString();
  const next: FormalRoomRecordV1 = {
    ...advanceRoomMatchV5(current, match.matchId, runGameV5),
    activeBattle: {
      ...activeBattle,
      status: "finalized",
      updatedAt: now,
      finalizeRequestId: commandId,
      finalizeResult: finalResult,
    },
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  await closeSession(activeBattle.sessionId).catch(() => undefined);
  return {
    roomRecord: next,
    finalResult: {...finalResult, room: publicRoom(next)},
  };
}

async function finalizeFormalRoomRunV5KeepRoomOpen(current: FormalRoomRecordV1, match: FormalLobbyMatchV1, commandId: string, payload: any): Promise<FormalRoomFinalResultResponseV1 & {roomRecord: FormalRoomRecordV1}> {
  if (!match.runGameV5) throw new HttpError(409, "v5_run_missing", "当前对局不是 V5 权威模型，请重新创建对局。");
  if (current.finalResult) {
    return {...finalResultResponse(current, current.finalResult, current.finalResult.clientRequestId === commandId), roomRecord: current};
  }
  if (current.activeBattle?.status === "preparing" || current.activeBattle?.status === "running") {
    throw new HttpError(409, "room_not_settleable", "当前房间仍在战斗，不能最终结算。");
  }
  if (!match.runGameV5.gameMap.nodes.length) throw new HttpError(409, "room_not_settleable", "当前房间还没有可结算的正式流程。");
  const profileSnapshot = payload?.profileSnapshot as UserProfileV2 | undefined;
  if (!profileSnapshot || typeof profileSnapshot !== "object") {
    throw new HttpError(400, "bad_request", "缺少玩家画像快照。");
  }
  const playerVaultSnapshot = payload?.playerVaultSnapshot as PlayerVaultV4 | undefined;
  const reason = normalizeSettlementReason(payload?.reason);
  const now = new Date();
  let settlement = runFormalStep(() => prepareFinalSettlementFromRunGameV5(match.runGameV5!, reason, now));
  let profile = profileSnapshot;
  if (!settlement.claimedAt) {
    profile = claimFormalSettlementBp(profileSnapshot, settlement, now);
    settlement = {...settlement, claimedAt: now.toISOString()};
  }
  const mergeResult = mergeRunGameV5BagIntoPlayerVault(playerVaultSnapshot || null, match.runGameV5);
  const playerVault = mergeResult.vault;
  const depositedItemCount = mergeResult.depositedItemCount;
  const rejectedItemCount = mergeResult.rejectedItemCount;
  settlement = {
    ...settlement,
    playerVaultItemsClaimedAt: now.toISOString(),
    playerVaultItemsClaimedCount: depositedItemCount,
    playerVaultItemsRejectedCount: rejectedItemCount,
  };
  const expiresAt = new Date(now.getTime() + config.roomFinalResultTtlMs).toISOString();
  const finalResult: FormalRoomFinalResultV1 = {
    clientRequestId: commandId,
    settlementId: settlement.id,
    formalRun: null,
    profile,
    playerVault,
    summary: {
      reason,
      bpGained: Math.max(0, Math.round(Number(settlement.bpGained || 0))),
      depositedItemCount,
      rejectedItemCount,
    },
    createdAt: now.toISOString(),
    expiresAt,
  };
  const runGameV5 = commitFinalSettlementFromRunGameV5(match.runGameV5, {
    commandId,
    settlement,
    reason,
    summary: finalResult.summary,
  });
  const nextBase = advanceRoomMatchV5(current, match.matchId, runGameV5);
  const next: FormalRoomRecordV1 = {
    ...nextBase,
    status: "open",
    connectionState: "online",
    closeReason: null,
    finalResult,
    expiresAt: new Date(now.getTime() + config.sessionTtlMs).toISOString(),
  };
  await saveRoom(next);
  broadcastRoomUpdated(next);
  return {...finalResultResponse(next, finalResult, false), roomRecord: next};
}

function mergeRunGameV5BagIntoPlayerVault(vaultSnapshot: PlayerVaultV4 | null, run: RunGameV5): {vault: PlayerVaultV4; depositedItemCount: number; rejectedItemCount: number} {
  let vault = normalizePlayerVault(vaultSnapshot || null);
  let depositedItemCount = 0;
  let rejectedItemCount = 0;
  const self = run.playersById[run.selfPlayerId];
  const bag = self ? run.bagsById[self.bagId] : null;
  if (!bag) return {vault, depositedItemCount, rejectedItemCount};
  for (const itemInstanceId of bag.itemInstanceIds) {
    const item = run.itemInstancesById[itemInstanceId]?.item;
    if (!item) continue;
    const itemId = String(item.itemID || "").trim();
    if (!itemId || item.type === "system" || item.type === "system-battle") continue;
    const added = addPlayerVaultItemV4(vault, {itemId, quantity: 1, boxKind: "storage"});
    vault = added.vault;
    depositedItemCount += added.depositedItemCount;
    rejectedItemCount += added.rejectedItemCount;
  }
  return {vault, depositedItemCount, rejectedItemCount};
}

function getRoomFinalResult(room: FormalRoomRecordV1): FormalRoomFinalResultResponseV1 {
  const finalResult = room.finalResult;
  if (!finalResult) throw new HttpError(404, "final_result_not_found", "最终结算结果不存在或已过期。");
  if (Date.parse(finalResult.expiresAt) <= Date.now()) {
    throw new HttpError(410, "final_result_expired", "最终结算结果已过期。");
  }
  return finalResultResponse(room, finalResult, true);
}

function finalResultResponse(room: FormalRoomRecordV1, finalResult: FormalRoomFinalResultV1, reused: boolean, formalRunOverride: FormalGameRunV4 | null = null): FormalRoomFinalResultResponseV1 {
  const activeMatch = findActiveRoomMatch(room);
  const compatFormalRun = activeMatch?.runGameV5 ? null : finalResult.formalRun || formalRunOverride || activeMatch?.formalRun || null;
  return {
    room: publicRoom(room),
    ...(compatFormalRun ? {formalRun: compatFormalRun} : {}),
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
  ensureRoomStoreAvailable();
  const raw = await redisCommand("GET", roomKey(roomId));
  if (typeof raw !== "string") return null;
  const parsed = JSON.parse(raw) as FormalRoomRecordV1;
  return parsed && parsed.roomId === roomId ? parsed : null;
}

async function saveRoom(room: FormalRoomRecordV1, ttlMs = config.sessionTtlMs): Promise<void> {
  ensureRoomStoreAvailable();
  const compactRoom = compactRoomForSave(room);
  const raw = JSON.stringify(compactRoom);
  if (Buffer.byteLength(raw, "utf8") > config.roomMaxBytes) {
    throw new HttpError(413, "room_too_large", "房间数据过大。");
  }
  await redisCommand("SET", roomKey(compactRoom.roomId), raw, "PX", String(ttlMs));
}

function compactRoomForSave(room: FormalRoomRecordV1): FormalRoomRecordV1 {
  return room;
}

async function deleteRoom(roomId: string): Promise<void> {
  ensureRoomStoreAvailable();
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
  const {roomTokenHash: _roomTokenHash, activeBattle, finalResult: _finalResult, formalRun: _formalRun, ...safeRoom} = room;
  const activeMatch = findActiveRoomMatch(room);
  const matches = (room.matches || []).map(match => publicMatch(match));
  return {
    ...safeRoom,
    matches,
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
          sendWsJson(client, {type: "room.ready", room: publicRoom(next), revision: next.revision});
      broadcastRoomUpdated(next, client);
      log("info", "room-ws-authed", {roomId: client.roomId, clientId: client.id});
      return;
    }
    if (message?.type === "room.heartbeat" || message?.type === "room.get") {
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
  broadcastRoomMessage(room.roomId, {type: "room.updated", room: publicRoom(room), revision: room.revision}, except);
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
  if (!roomStore) return;
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

function cleanupEndedMatches(room: FormalRoomRecordV1, nowMs: number): FormalRoomRecordV1 {
  const matches = room.matches || [];
  if (!matches.length) return room;
  let changed = false;
  const nextMatches = matches.map(match => {
    if (match.status !== "ended") return match;
    if (!match.cleanupAt) return match;
    const cleanupMs = Date.parse(match.cleanupAt);
    if (!Number.isFinite(cleanupMs) || cleanupMs > nowMs) return match;
    changed = true;
    return {
      ...match,
      formalRun: null,
      runGameV5: null,
      settlementSummary: room.finalResult?.summary || match.settlementSummary || null,
      updatedAt: new Date(nowMs).toISOString(),
    };
  });
  if (!changed) return room;
  const activeMatchId = room.activeMatchId && nextMatches.some(match => match.matchId === room.activeMatchId && match.status !== "ended")
    ? room.activeMatchId
    : null;
  return {
    ...room,
    matches: nextMatches,
    activeMatchId,
    formalRun: activeMatchId ? room.formalRun : null,
    activeBattle: activeMatchId ? room.activeBattle : null,
    updatedAt: new Date(nowMs).toISOString(),
  };
}

async function sweepRoomLifecycle(): Promise<void> {
  if (!roomStore) return;
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
        const matchCleaned = cleanupEndedMatches(room, nowMs);
        if (matchCleaned !== room) {
          await saveRoom(matchCleaned, room.finalResult ? config.roomFinalResultTtlMs : config.sessionTtlMs);
          broadcastRoomUpdated(matchCleaned);
          log("info", "room-ended-matches-cleaned", {roomId, remainingMatches: matchCleaned.matches?.length || 0});
          return;
        }
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
  if (!roomStore) return "disabled";
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

function ensureRoomStoreAvailable(): void {
  if (!roomStore) throw new HttpError(503, "room_store_disabled", "服务器房间服务未启用。");
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
  ensureRoomStoreAvailable();
  return roomStore!.command(...parts);
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
  void activeServerHandle?.close().finally(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
