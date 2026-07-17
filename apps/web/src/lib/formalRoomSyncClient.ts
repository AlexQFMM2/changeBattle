import type {
  FormalGameRunV4,
  FormalRoomDraftSyncResultV1,
  FormalRoomRestActionResultV1,
  FormalRoomRestActionV1,
  FormalRoomV1,
  PostServiceConnectionStateV4,
  PostServiceResultV4,
} from "@changebattle-v2/api";

export type FormalRoomSyncClientV4 = {
  syncDraft(input: {formalRunDraft: FormalGameRunV4; label: string; clientActionId?: string}): Promise<FormalRoomDraftSyncResultV1>;
  submitRestAction(input: {formalRunDraft: FormalGameRunV4; action: FormalRoomRestActionV1; clientActionId: string; label: string}): Promise<FormalRoomRestActionResultV1>;
  getRevision(): number | null;
  dispose(): void;
};

export type FormalRoomSyncClientConfigV4 = {
  baseUrl?: string;
  roomId: string;
  roomToken: string;
  onConnectionState: (state: PostServiceConnectionStateV4) => void;
  onRoomUpdated: (payload: {room: FormalRoomV1; formalRun: FormalGameRunV4; revision: number}) => void;
  onRoomClosed: (message: string) => void;
  fallbackSyncDraft: (input: {clientActionId: string; baseRevision?: number; formalRunDraft: FormalGameRunV4; label?: string}) => Promise<PostServiceResultV4<FormalRoomDraftSyncResultV1>>;
  fallbackRestAction: (input: {clientActionId: string; baseRevision?: number; formalRunDraft: FormalGameRunV4; action: FormalRoomRestActionV1}) => Promise<PostServiceResultV4<FormalRoomRestActionResultV1>>;
};

type PendingMutation = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

const WS_CONNECT_TIMEOUT_MS = 3500;

export function createFormalRoomSyncClient(config: FormalRoomSyncClientConfigV4): FormalRoomSyncClientV4 {
  let socket: WebSocket | null = null;
  let disposed = false;
  let ready = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let readyPromise: Promise<void> | null = null;
  let readyResolve: (() => void) | null = null;
  let readyReject: ((error: Error) => void) | null = null;
  let queue: Promise<void> = Promise.resolve();
  let revision: number | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  const pending = new Map<string, PendingMutation>();
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

  function connect(): Promise<void> {
    if (disposed) return Promise.reject(new Error("room sync disposed"));
    if (ready && socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (readyPromise) return readyPromise;
    if (typeof WebSocket === "undefined") return Promise.reject(new Error("WebSocket unavailable"));
    setState({state: state.failureCount > 0 ? "reconnecting" : "connecting"});
    readyPromise = new Promise<void>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
      const timer = setTimeout(() => {
        rejectReady(new Error("WebSocket 连接超时。"));
        try {
          socket?.close();
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
        setState({state: "failed", lastErrorAt: new Date().toISOString(), failureCount: state.failureCount + 1});
      };
      socket.onclose = () => {
        clearTimeout(timer);
        ready = false;
        readyPromise = null;
        rejectReady(new Error("WebSocket 已断开。"));
        rejectPending(new Error("WebSocket 已断开。"));
        if (!disposed) scheduleReconnect();
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
    if (disposed || reconnectTimer) return;
    stopHeartbeat();
    setState({state: "reconnecting"});
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
      if (message.formalRun && message.room) {
        config.onRoomUpdated({room: message.room, formalRun: message.formalRun, revision: revision || 0});
      }
      setState({
        state: "online",
        lastSuccessAt: new Date().toISOString(),
        failureCount: 0,
      });
      if (message.type === "room.ready") resolveReady();
      return;
    }
    if (message?.type === "sync.ack") {
      const clientActionId = String(message.clientActionId || "");
      const entry = pending.get(clientActionId);
      if (!entry) return;
      pending.delete(clientActionId);
      if (message.data?.room?.revision !== undefined) revision = Number(message.data.room.revision);
      setState({
        state: "online",
        lastSuccessAt: new Date().toISOString(),
        failureCount: 0,
      });
      entry.resolve(message.data);
      return;
    }
    if (message?.type === "sync.failed") {
      const clientActionId = String(message.clientActionId || "");
      const entry = pending.get(clientActionId);
      if (!entry) return;
      pending.delete(clientActionId);
      setState(message.retryable
        ? {state: "failed", lastErrorAt: new Date().toISOString(), failureCount: state.failureCount + 1}
        : {state: "online", lastSuccessAt: new Date().toISOString(), failureCount: 0});
      entry.reject(new Error(String(message.message || "房间同步失败。")));
      return;
    }
    if (message?.type === "room.closed") {
      config.onRoomClosed(String(message.reason || "房间已经关闭。"));
      rejectPending(new Error("房间已经关闭。"));
    }
  }

  function sendWsMutation<T>(message: Record<string, unknown>, clientActionId: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!socket || socket.readyState !== WebSocket.OPEN || !ready) {
        reject(new Error("WebSocket 未连接。"));
        return;
      }
      pending.set(clientActionId, {resolve, reject});
      setState({state: "syncing"});
      socket.send(JSON.stringify(message));
    });
  }

  function startHeartbeat(): void {
    if (heartbeatTimer || disposed) return;
    heartbeatTimer = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN || !ready) return;
      try {
        socket.send(JSON.stringify({type: "room.heartbeat", clientActionId: createRoomClientActionId("heartbeat")}));
      } catch {
        // The close handler will drive reconnect if the socket is actually broken.
      }
    }, 60000);
  }

  function stopHeartbeat(): void {
    if (!heartbeatTimer) return;
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  async function withQueue<T>(task: () => Promise<T>): Promise<T> {
    const previous = queue;
    let release!: () => void;
    queue = new Promise(resolve => {
      release = resolve;
    });
    await previous.catch(() => undefined);
    try {
      return await task();
    } finally {
      release();
    }
  }

  async function syncDraft(input: {formalRunDraft: FormalGameRunV4; label: string; clientActionId?: string}): Promise<FormalRoomDraftSyncResultV1> {
    return withQueue(async () => {
      const clientActionId = input.clientActionId || createRoomClientActionId("draft");
      const baseRevision = revision ?? undefined;
      try {
        await connect();
        return await sendWsMutation<FormalRoomDraftSyncResultV1>({
          type: "rest.syncDraft",
          clientActionId,
          baseRevision,
          formalRunDraft: input.formalRunDraft,
          label: input.label,
        }, clientActionId);
      } catch {
        const fallback = await config.fallbackSyncDraft({clientActionId, baseRevision, formalRunDraft: input.formalRunDraft, label: input.label});
        if (!fallback.ok) throw new Error(fallback.message);
        revision = Number(fallback.data.room.revision);
        return fallback.data;
      }
    });
  }

  async function submitRestAction(input: {formalRunDraft: FormalGameRunV4; action: FormalRoomRestActionV1; clientActionId: string; label: string}): Promise<FormalRoomRestActionResultV1> {
    return withQueue(async () => {
      const baseRevision = revision ?? undefined;
      try {
        await connect();
        return await sendWsMutation<FormalRoomRestActionResultV1>({
          type: "rest.action",
          clientActionId: input.clientActionId,
          baseRevision,
          formalRunDraft: input.formalRunDraft,
          action: input.action,
          label: input.label,
        }, input.clientActionId);
      } catch {
        const fallback = await config.fallbackRestAction({clientActionId: input.clientActionId, baseRevision, formalRunDraft: input.formalRunDraft, action: input.action});
        if (!fallback.ok) throw new Error(fallback.message);
        revision = Number(fallback.data.room.revision);
        return fallback.data;
      }
    });
  }

  function rejectPending(error: Error): void {
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  }

  function dispose(): void {
    disposed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    stopHeartbeat();
    rejectPending(new Error("room sync disposed"));
    try {
      socket?.close();
    } catch {
      // Ignore browser close errors.
    }
    socket = null;
  }

  void connect().catch(() => undefined);

  return {
    syncDraft,
    submitRestAction,
    getRevision: () => revision,
    dispose,
  };
}

function roomWsUrl(baseUrl: string | undefined, roomId: string): string {
  const root = (baseUrl || "https://api.65h26i.top/changebattle/battle").replace(/\/$/, "");
  const url = new URL(`${root}/rooms/${encodeURIComponent(roomId)}/ws`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function createRoomClientActionId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
