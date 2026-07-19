import type {
  FormalRoomV1,
  PostServiceConnectionStateV4,
  PostServiceResultV4,
} from "@changebattle-v2/api";

export type FormalRoomSyncClientV4 = {
  getRevision(): number | null;
  getConnectionState(): PostServiceConnectionStateV4;
  dispose(): void;
};

export type FormalRoomSyncClientConfigV4 = {
  baseUrl?: string;
  roomId: string;
  roomToken: string;
  onConnectionState: (state: PostServiceConnectionStateV4) => void;
  onRoomUpdated: (payload: {room: FormalRoomV1; revision: number}) => void;
  onRoomClosed: (message: string) => void;
  fallbackHeartbeat: () => Promise<PostServiceResultV4<FormalRoomV1>>;
};

const WS_CONNECT_TIMEOUT_MS = 3500;

export function createFormalRoomSyncClient(config: FormalRoomSyncClientConfigV4): FormalRoomSyncClientV4 {
  let socket: WebSocket | null = null;
  let disposed = false;
  let terminalClosed = false;
  let ready = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let readyPromise: Promise<void> | null = null;
  let readyResolve: (() => void) | null = null;
  let readyReject: ((error: Error) => void) | null = null;
  let revision: number | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let httpCommandActive = 0;
  const baseState = {
    lastSuccessAt: null,
    lastErrorAt: null,
    lastRttMs: null,
    failureCount: 0,
  };
  let state: PostServiceConnectionStateV4 = {state: "idle", ...baseState};

  function setState(patch: Partial<PostServiceConnectionStateV4>): void {
    state = {...state, ...patch};
    config.onConnectionState(state);
  }

  function setWsBackgroundFailure(): void {
    if (terminalClosed) return;
    if (httpCommandActive > 0) return;
    setState({state: "reconnecting", lastErrorAt: new Date().toISOString(), failureCount: state.failureCount + 1});
  }

  function connect(): Promise<void> {
    if (disposed) return Promise.reject(new Error("room sync disposed"));
    if (terminalClosed) return Promise.reject(new Error("room closed"));
    if (ready && socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (readyPromise) return readyPromise;
    if (typeof WebSocket === "undefined") return Promise.reject(new Error("WebSocket unavailable"));
    if (httpCommandActive <= 0) setState({state: state.failureCount > 0 ? "reconnecting" : "connecting"});
    readyPromise = new Promise<void>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
      const timer = setTimeout(() => {
        rejectReady(new Error("WebSocket 连接超时。"));
        try {
          socket?.close(4000, "connect_timeout");
        } catch {
          // Ignore browser close errors.
        }
      }, WS_CONNECT_TIMEOUT_MS);
      try {
        socket = new WebSocket(roomWsUrl(config.baseUrl, config.roomId));
      } catch (error) {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error("WebSocket 创建失败。"));
        readyPromise = null;
        return;
      }
      socket.onopen = () => {
        socket?.send(JSON.stringify({type: "auth", roomToken: config.roomToken}));
      };
      socket.onmessage = event => {
        handleMessage(String(event.data));
        if (ready) clearTimeout(timer);
      };
      socket.onerror = () => {
        setWsBackgroundFailure();
      };
      socket.onclose = () => {
        clearTimeout(timer);
        ready = false;
        readyPromise = null;
        rejectReady(new Error("WebSocket 已断开。"));
        if (!disposed && !terminalClosed) scheduleReconnect();
      };
    });
    return readyPromise;
  }

  function resolveReady(): void {
    ready = true;
    readyPromise = null;
    readyResolve?.();
    readyResolve = null;
    readyReject = null;
    startHeartbeat();
  }

  function rejectReady(error: Error): void {
    readyReject?.(error);
    readyPromise = null;
    readyResolve = null;
    readyReject = null;
  }

  function scheduleReconnect(): void {
    if (disposed || terminalClosed || reconnectTimer) return;
    stopHeartbeat();
    if (httpCommandActive <= 0) setState({state: "reconnecting"});
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect().catch(() => undefined);
    }, 1200);
  }

  function handleMessage(raw: string): void {
    let message: any;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (message?.type === "room.ready" || message?.type === "room.updated") {
      revision = Number(message.revision ?? message.room?.revision ?? revision);
      if (message.room) {
        config.onRoomUpdated({room: message.room, revision: revision || 0});
      }
      setState({
        state: "online",
        lastSuccessAt: new Date().toISOString(),
        failureCount: 0,
      });
      if (message.type === "room.ready") resolveReady();
      return;
    }
    if (message?.type === "room.closed") {
      const reason = String(message.reason || "房间已经关闭。");
      terminalClosed = true;
      ready = false;
      stopHeartbeat();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      rejectReady(new Error(reason));
      setState({state: "failed", lastErrorAt: new Date().toISOString(), failureCount: state.failureCount + 1});
      config.onRoomClosed(reason);
      try {
        socket?.close(1000, "room_closed");
      } catch {
        // Ignore browser close errors.
      }
    }
  }

  function startHeartbeat(): void {
    if (heartbeatTimer || disposed) return;
    heartbeatTimer = setInterval(() => {
      void sendHttpHeartbeat();
    }, 60000);
  }

  function stopHeartbeat(): void {
    if (!heartbeatTimer) return;
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  async function sendHttpHeartbeat(): Promise<void> {
    if (disposed) return;
    httpCommandActive += 1;
    try {
      const response = await config.fallbackHeartbeat();
      if (!response.ok) {
        setState(response.retryable
          ? {state: "failed", lastErrorAt: new Date().toISOString(), failureCount: state.failureCount + 1}
          : {state: "online", lastSuccessAt: new Date().toISOString(), failureCount: 0});
        return;
      }
      revision = Number(response.data.revision ?? revision);
      config.onRoomUpdated({room: response.data, revision: revision || 0});
      setState({state: "online", lastSuccessAt: new Date().toISOString(), failureCount: 0});
    } finally {
      httpCommandActive = Math.max(0, httpCommandActive - 1);
    }
  }

  function dispose(): void {
    disposed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    stopHeartbeat();
    try {
      socket?.close(1000, "room_sync_dispose");
    } catch {
      // Ignore browser close errors.
    }
    socket = null;
  }

  void connect().catch(() => undefined);

  return {
    getRevision: () => revision,
    getConnectionState: () => state,
    dispose,
  };
}

function roomWsUrl(baseUrl: string | undefined, roomId: string): string {
  const root = (baseUrl || "https://api.65h26i.top/changebattle/battle").replace(/\/$/, "");
  const url = new URL(`${root}/rooms/${encodeURIComponent(roomId)}/ws`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
