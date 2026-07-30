import {DEFAULT_BATTLE_SERVICE_URL} from "./battle.js";

export type PostServiceActionNameV4 =
  | "rooms.start"
  | "rooms.get"
  | "rooms.heartbeat"
  | "rooms.delete"
  | "rooms.matches.create"
  | "rooms.matches.get"
  | "rooms.matches.ready"
  | "rooms.matches.unready"
  | "rooms.matches.start"
  | "rooms.matches.view"
  | "rooms.matches.commands.selectStarters"
  | "rooms.matches.commands.prepareRound"
  | "rooms.matches.commands.teamReorder"
  | "rooms.matches.commands.teamHeal"
  | "rooms.matches.commands.pokemonExchange"
  | "rooms.matches.commands.shopBuy"
  | "rooms.matches.commands.shopBuyCart"
  | "rooms.matches.commands.shopRefresh"
  | "rooms.matches.commands.shopSell"
  | "rooms.matches.commands.trainingApply"
  | "rooms.matches.commands.pokemonRerollStats"
  | "rooms.matches.commands.bagUse"
  | "rooms.matches.commands.bagEquip"
  | "rooms.matches.commands.bagUnequip"
  | "rooms.matches.commands.bagDiscard"
  | "rooms.matches.commands.opponentPreviewUnlock"
  | "rooms.matches.commands.insuranceBuy"
  | "rooms.matches.commands.soulmateEggClaim"
  | "rooms.matches.commands.prepareBattle"
  | "rooms.matches.commands.battleChoice"
  | "rooms.matches.commands.finalizeBattle"
  | "rooms.matches.commands.finalizeRun"
  | "rooms.matches.commands.ackFinalResult"
  | "rooms.getBattleSnapshot"
  | "rooms.getBattlePlaybackTimeline"
  | "rooms.submitBattleChoice"
  | "rooms.getFinalResult"
  | "battle.createSession";

export type PostServiceResultV4<T> =
  | {ok: true; data: T; statusCode: number; elapsedMs: number}
  | {ok: false; error: string; message: string; retryable: boolean; backend: "server-api"; statusCode?: number; elapsedMs: number};

export type PostServiceConnectionStateV4 = {
  state: "idle" | "connecting" | "online" | "syncing" | "reconnecting" | "failed";
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastRttMs: number | null;
  failureCount: number;
};

export type PostServiceClientV4 = {
  postApi<T = unknown>(actionName: PostServiceActionNameV4, input?: unknown, options?: PostServiceRequestOptionsV4): Promise<PostServiceResultV4<T>>;
  getConnectionState(): PostServiceConnectionStateV4;
};

export type PostServiceRequestOptionsV4 = {
  roomToken?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export type PostServiceClientConfigV4 = {
  baseUrl?: string;
  onConnectionState?: (state: PostServiceConnectionStateV4) => void;
};

type ActionDefinition = {
  method: "GET" | "POST" | "DELETE";
  path(input: any): string;
  body?(input: any): unknown;
  latencySample?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15000;

const ACTIONS: Record<PostServiceActionNameV4, ActionDefinition> = {
  "rooms.start": {
    method: "POST",
    path: () => "/rooms",
    body: input => input || {},
  },
  "rooms.get": {
    method: "GET",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}`,
    latencySample: true,
  },
  "rooms.heartbeat": {
    method: "POST",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/heartbeat`,
    body: input => input?.body || {},
    latencySample: true,
  },
  "rooms.delete": {
    method: "DELETE",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}`,
  },
  "rooms.matches.create": {
    method: "POST",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches`,
    body: input => ({
      clientRequestId: input?.clientRequestId,
      title: input?.title,
      mode: input?.mode,
      profileSnapshot: input?.profileSnapshot,
      playerVaultSnapshot: input?.playerVaultSnapshot,
      battlePreferenceSnapshot: input?.battlePreferenceSnapshot,
      seed: input?.seed,
      options: input?.options,
    }),
  },
  "rooms.matches.get": {
    method: "GET",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches/${encodeURIComponent(requiredString(input?.matchId, "matchId"))}`,
    latencySample: true,
  },
  "rooms.matches.ready": {
    method: "POST",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches/${encodeURIComponent(requiredString(input?.matchId, "matchId"))}/ready`,
    body: () => ({}),
  },
  "rooms.matches.unready": {
    method: "POST",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches/${encodeURIComponent(requiredString(input?.matchId, "matchId"))}/unready`,
    body: () => ({}),
  },
  "rooms.matches.start": {
    method: "POST",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches/${encodeURIComponent(requiredString(input?.matchId, "matchId"))}/start`,
    body: input => ({clientRequestId: input?.clientRequestId}),
  },
  "rooms.matches.view": {
    method: "GET",
    path: input => {
      const scope = typeof input?.scope === "string" && input.scope ? `?scope=${encodeURIComponent(input.scope)}` : "";
      return `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches/${encodeURIComponent(requiredString(input?.matchId, "matchId"))}/view${scope}`;
    },
    latencySample: true,
  },
  "rooms.matches.commands.selectStarters": {
    method: "POST",
    path: input => matchCommandPath(input, "select-starters"),
    body: commandBody,
  },
  "rooms.matches.commands.prepareRound": {
    method: "POST",
    path: input => matchCommandPath(input, "prepare-round"),
    body: commandBody,
  },
  "rooms.matches.commands.teamReorder": {
    method: "POST",
    path: input => matchCommandPath(input, "team.reorder"),
    body: commandBody,
  },
  "rooms.matches.commands.teamHeal": {
    method: "POST",
    path: input => matchCommandPath(input, "team.heal"),
    body: commandBody,
  },
  "rooms.matches.commands.pokemonExchange": {
    method: "POST",
    path: input => matchCommandPath(input, "pokemon.exchange"),
    body: commandBody,
  },
  "rooms.matches.commands.shopBuy": {
    method: "POST",
    path: input => matchCommandPath(input, "shop.buy"),
    body: commandBody,
  },
  "rooms.matches.commands.shopBuyCart": {
    method: "POST",
    path: input => matchCommandPath(input, "shop.buy-cart"),
    body: commandBody,
  },
  "rooms.matches.commands.shopRefresh": {
    method: "POST",
    path: input => matchCommandPath(input, "shop.refresh"),
    body: commandBody,
  },
  "rooms.matches.commands.shopSell": {
    method: "POST",
    path: input => matchCommandPath(input, "shop.sell"),
    body: commandBody,
  },
  "rooms.matches.commands.trainingApply": {
    method: "POST",
    path: input => matchCommandPath(input, "training.apply"),
    body: commandBody,
  },
  "rooms.matches.commands.pokemonRerollStats": {
    method: "POST",
    path: input => matchCommandPath(input, "pokemon.reroll-stats"),
    body: commandBody,
  },
  "rooms.matches.commands.bagUse": {
    method: "POST",
    path: input => matchCommandPath(input, "bag.use"),
    body: commandBody,
  },
  "rooms.matches.commands.bagEquip": {
    method: "POST",
    path: input => matchCommandPath(input, "bag.equip"),
    body: commandBody,
  },
  "rooms.matches.commands.bagUnequip": {
    method: "POST",
    path: input => matchCommandPath(input, "bag.unequip"),
    body: commandBody,
  },
  "rooms.matches.commands.bagDiscard": {
    method: "POST",
    path: input => matchCommandPath(input, "bag.discard"),
    body: commandBody,
  },
  "rooms.matches.commands.opponentPreviewUnlock": {
    method: "POST",
    path: input => matchCommandPath(input, "opponent-preview.unlock"),
    body: commandBody,
  },
  "rooms.matches.commands.insuranceBuy": {
    method: "POST",
    path: input => matchCommandPath(input, "insurance.buy"),
    body: commandBody,
  },
  "rooms.matches.commands.soulmateEggClaim": {
    method: "POST",
    path: input => matchCommandPath(input, "soulmate-egg.claim"),
    body: commandBody,
  },
  "rooms.matches.commands.prepareBattle": {
    method: "POST",
    path: input => matchCommandPath(input, "prepare-battle"),
    body: commandBody,
  },
  "rooms.matches.commands.battleChoice": {
    method: "POST",
    path: input => matchCommandPath(input, "battle-choice"),
    body: commandBody,
  },
  "rooms.matches.commands.finalizeBattle": {
    method: "POST",
    path: input => matchCommandPath(input, "finalize-battle"),
    body: commandBody,
  },
  "rooms.matches.commands.finalizeRun": {
    method: "POST",
    path: input => matchCommandPath(input, "finalize-run"),
    body: commandBody,
  },
  "rooms.matches.commands.ackFinalResult": {
    method: "POST",
    path: input => matchCommandPath(input, "ack-final-result"),
    body: commandBody,
  },
  "rooms.getBattleSnapshot": {
    method: "GET",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/battle/snapshot`,
  },
  "rooms.getBattlePlaybackTimeline": {
    method: "GET",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/battle/playback-timeline?from=${encodeURIComponent(String(input?.from || 0))}`,
  },
  "rooms.submitBattleChoice": {
    method: "POST",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/battle/choices`,
    body: input => ({
      clientActionId: input?.clientActionId,
      playerId: input?.playerId,
      choice: input?.choice,
      trainerItems: input?.trainerItems,
      expectedTurn: input?.expectedTurn,
      expectedRqid: input?.expectedRqid,
    }),
  },
  "rooms.getFinalResult": {
    method: "GET",
    path: input => `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/final-result`,
    latencySample: true,
  },
  "battle.createSession": {
    method: "POST",
    path: () => "/sessions",
    body: input => input || {},
  },
};

function matchCommandPath(input: any, command: string): string {
  return `/rooms/${encodeURIComponent(requiredString(input?.roomId, "roomId"))}/matches/${encodeURIComponent(requiredString(input?.matchId, "matchId"))}/commands/${command}`;
}

function commandBody(input: any): unknown {
  return {
    commandId: input?.commandId ?? input?.clientRequestId ?? input?.clientActionId,
    baseRevision: input?.baseRevision,
    payload: input?.payload || {},
  };
}

export function createPostServiceClient(config: PostServiceClientConfigV4 = {}): PostServiceClientV4 {
  const root = (config.baseUrl || DEFAULT_BATTLE_SERVICE_URL).replace(/\/$/, "");
  let connectionState: PostServiceConnectionStateV4 = {
    state: "idle",
    lastSuccessAt: null,
    lastErrorAt: null,
    lastRttMs: null,
    failureCount: 0,
  };

  function setConnectionState(patch: Partial<PostServiceConnectionStateV4>): void {
    connectionState = {...connectionState, ...patch};
    config.onConnectionState?.(connectionState);
  }

  return {
    async postApi<T = unknown>(actionName: PostServiceActionNameV4, input?: unknown, options: PostServiceRequestOptionsV4 = {}) {
      const action = ACTIONS[actionName];
      if (!action) {
        return failureResult("unknown_action", `未知服务器接口：${actionName}`, false, 0);
      }
      const startedAt = Date.now();
      const wasFailing = connectionState.failureCount > 0;
      if (wasFailing || !connectionState.lastSuccessAt) {
        setConnectionState({state: wasFailing ? "reconnecting" : "connecting"});
      }
      const controller = new AbortController();
      const timeout = windowSetTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
      const abortForwarder = () => controller.abort();
      options.signal?.addEventListener("abort", abortForwarder, {once: true});
      try {
        const response = await fetch(`${root}${action.path(input as any)}`, {
          method: action.method,
          headers: {
            "content-type": "application/json",
            ...(options.roomToken ? {authorization: `Bearer ${options.roomToken}`} : {}),
          },
          body: action.method === "GET" ? undefined : JSON.stringify(action.body ? action.body(input as any) : input || {}),
          signal: controller.signal,
        });
        const elapsedMs = Date.now() - startedAt;
        const payload = await readPayload(response);
        if (!response.ok) {
          const error = typeof payload?.error === "string" ? payload.error : `http_${response.status}`;
          const message = typeof payload?.message === "string" ? payload.message : "服务器请求失败。";
          const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
          setConnectionState(retryable
            ? {
              state: "failed",
              lastErrorAt: new Date().toISOString(),
              lastRttMs: elapsedMs,
              failureCount: connectionState.failureCount + 1,
            }
            : {
              state: "online",
              lastSuccessAt: new Date().toISOString(),
              lastRttMs: action.latencySample ? elapsedMs : connectionState.lastRttMs,
              failureCount: 0,
            });
          return {ok: false, error, message, retryable, backend: "server-api", statusCode: response.status, elapsedMs};
        }
        setConnectionState({
          state: "online",
          lastSuccessAt: new Date().toISOString(),
          lastRttMs: action.latencySample ? elapsedMs : connectionState.lastRttMs,
          failureCount: 0,
        });
        return {ok: true, data: payload as T, statusCode: response.status, elapsedMs};
      } catch (error) {
        const elapsedMs = Date.now() - startedAt;
        const aborted = controller.signal.aborted;
        setConnectionState({
          state: "failed",
          lastErrorAt: new Date().toISOString(),
          lastRttMs: elapsedMs,
          failureCount: connectionState.failureCount + 1,
        });
        return failureResult(aborted ? "timeout" : "network_error", aborted ? "服务器响应超时。" : "无法连接服务器。", true, elapsedMs);
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", abortForwarder);
      }
    },
    getConnectionState() {
      return connectionState;
    },
  };
}

export const defaultPostServiceClient = createPostServiceClient();

export function postApi<T = unknown>(actionName: PostServiceActionNameV4, input?: unknown, options?: PostServiceRequestOptionsV4): Promise<PostServiceResultV4<T>> {
  return defaultPostServiceClient.postApi<T>(actionName, input, options);
}

async function readPayload(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return {message: text};
  }
}

function failureResult(error: string, message: string, retryable: boolean, elapsedMs: number): PostServiceResultV4<never> {
  return {ok: false, error, message, retryable, backend: "server-api", elapsedMs};
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${label}`);
  return value;
}

function windowSetTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
  return setTimeout(callback, ms);
}
