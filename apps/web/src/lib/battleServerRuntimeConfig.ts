import {
  DEFAULT_BATTLE_SERVER_CONFIG_V4,
  battleServerBaseUrlForConfigV4,
  normalizeBattleServerBaseUrl,
  normalizeBattleServerConfigV4,
  type AssetCacheStatusV4,
  type BattleServerConfigV4,
  type BattleServerHealthResultV4,
  type DesktopAppBridge,
} from "@changebattle-v2/api";

const STORAGE_KEY = "changebattle-v2:battle-server-config";

export type BattleServerRuntimeConfigBridgeV4 = Pick<
  DesktopAppBridge,
  "getBattleServerConfig" | "setBattleServerConfig" | "testBattleServer" | "startOfflineBattleServer" | "stopOfflineBattleServer" | "getOfflineBattleServerStatus" | "getAssetCacheStatus" | "clearAssetCache"
>;

export async function loadBattleServerRuntimeConfig(bridge?: BattleServerRuntimeConfigBridgeV4): Promise<BattleServerConfigV4> {
  if (bridge?.getBattleServerConfig) {
    try {
      return normalizeBattleServerConfigV4(await bridge.getBattleServerConfig());
    } catch {
      // Fall through to local config.
    }
  }
  if (typeof window === "undefined") return normalizeBattleServerConfigV4(null);
  try {
    return normalizeBattleServerConfigV4(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return normalizeBattleServerConfigV4(null);
  }
}

export async function saveBattleServerRuntimeConfig(config: BattleServerConfigV4, bridge?: BattleServerRuntimeConfigBridgeV4): Promise<BattleServerConfigV4> {
  const normalized = normalizeBattleServerConfigV4(config);
  if (bridge?.setBattleServerConfig) return normalizeBattleServerConfigV4(await bridge.setBattleServerConfig(normalized));
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function testBattleServerRuntimeUrl(url: string, bridge?: BattleServerRuntimeConfigBridgeV4): Promise<BattleServerHealthResultV4> {
  const root = normalizeBattleServerBaseUrl(url);
  const startedAt = Date.now();
  if (!root) return {ok: false, url, elapsedMs: 0, error: "invalid_url", message: "服务器地址无效。"};
  if (bridge?.testBattleServer) return bridge.testBattleServer(root);
  try {
    const response = await fetch(`${root}/health`, {method: "GET"});
    const payload = await response.json().catch(() => null) as any;
    const elapsedMs = Date.now() - startedAt;
    if (!response.ok || payload?.ok !== true) return {ok: false, url: root, elapsedMs, error: "health_failed", message: "服务器健康检查失败。"};
    return {
      ok: true,
      url: root,
      elapsedMs,
      service: typeof payload.service === "string" ? payload.service : undefined,
      version: typeof payload.version === "string" ? payload.version : undefined,
      redis: typeof payload.redis === "string" ? payload.redis : undefined,
      storage: typeof payload.storage === "string" ? payload.storage : undefined,
    };
  } catch {
    return {ok: false, url: root, elapsedMs: Date.now() - startedAt, error: "network_error", message: "无法连接服务器。"};
  }
}

export async function clearAssetRuntimeCache(config: BattleServerConfigV4, bridge?: BattleServerRuntimeConfigBridgeV4): Promise<BattleServerConfigV4> {
  if (bridge?.clearAssetCache) {
    const status = await bridge.clearAssetCache();
    return normalizeBattleServerConfigV4({...config, assetCache: {...config.assetCache, ...status}});
  }
  const next = normalizeBattleServerConfigV4({...config, assetCache: {...config.assetCache, cachedBytes: 0, cachedFileCount: 0, lastUpdatedAt: new Date().toISOString()}});
  return saveBattleServerRuntimeConfig(next, bridge);
}

export async function getAssetRuntimeCacheStatus(config: BattleServerConfigV4, bridge?: BattleServerRuntimeConfigBridgeV4): Promise<AssetCacheStatusV4> {
  if (bridge?.getAssetCacheStatus) return bridge.getAssetCacheStatus();
  return {...config.assetCache, available: true};
}

export function battleServerConfigWithEnvFallback(config: BattleServerConfigV4 | null, envUrl?: string): BattleServerConfigV4 {
  const normalized = normalizeBattleServerConfigV4(config || DEFAULT_BATTLE_SERVER_CONFIG_V4);
  const cleanEnvUrl = normalizeBattleServerBaseUrl(envUrl || "");
  if (cleanEnvUrl && normalized.mode === "official" && normalized.officialUrl === DEFAULT_BATTLE_SERVER_CONFIG_V4.officialUrl) {
    return {...normalized, officialUrl: cleanEnvUrl};
  }
  return normalized;
}

export function battleServerBaseUrl(config: BattleServerConfigV4 | null, envUrl?: string): string {
  return battleServerBaseUrlForConfigV4(battleServerConfigWithEnvFallback(config, envUrl));
}
