export const DEFAULT_CHANGE_BATTLE_BATTLE_SERVICE_URL = "https://api.65h26i.top/changebattle/battle";

export type BattleServerModeV4 = "official" | "custom" | "desktop-offline";

export type BattleServerCustomConfigV4 = {
  protocol: "http" | "https";
  host: string;
  port: number;
  basePath: string;
  lastVerifiedAt: string | null;
};

export type AssetCacheConfigV4 = {
  enabled: boolean;
  rootDir: string;
  cachedBytes: number;
  cachedFileCount: number;
  lastUpdatedAt: string | null;
};

export type BattleServerConfigV4 = {
  version: 1;
  mode: BattleServerModeV4;
  officialUrl: string;
  custom: BattleServerCustomConfigV4;
  desktopOffline: {
    enabled: boolean;
    port: number;
    actualBaseUrl: string | null;
    lastStartedAt: string | null;
  };
  assetCache: AssetCacheConfigV4;
};

export type BattleServerHealthResultV4 =
  | {ok: true; url: string; elapsedMs: number; service?: string; version?: string; redis?: string; storage?: string}
  | {ok: false; url: string; elapsedMs: number; error: string; message: string};

export type AssetCacheStatusV4 = AssetCacheConfigV4 & {
  available: boolean;
};

export const DEFAULT_BATTLE_SERVER_CONFIG_V4: BattleServerConfigV4 = {
  version: 1,
  mode: "official",
  officialUrl: DEFAULT_CHANGE_BATTLE_BATTLE_SERVICE_URL,
  custom: {
    protocol: "http",
    host: "127.0.0.1",
    port: 5191,
    basePath: "/changebattle/battle",
    lastVerifiedAt: null,
  },
  desktopOffline: {
    enabled: false,
    port: 0,
    actualBaseUrl: null,
    lastStartedAt: null,
  },
  assetCache: {
    enabled: false,
    rootDir: "assets",
    cachedBytes: 0,
    cachedFileCount: 0,
    lastUpdatedAt: null,
  },
};

export function normalizeBattleServerConfigV4(input: Partial<BattleServerConfigV4> | null | undefined): BattleServerConfigV4 {
  const base = DEFAULT_BATTLE_SERVER_CONFIG_V4;
  const mode = input?.mode === "custom" || input?.mode === "desktop-offline" ? input.mode : "official";
  const officialUrl = normalizeBattleServerBaseUrl(input?.officialUrl || base.officialUrl) || base.officialUrl;
  const customInput: Partial<BattleServerCustomConfigV4> = input?.custom || {};
  const desktopOfflineInput: Partial<BattleServerConfigV4["desktopOffline"]> = input?.desktopOffline || {};
  const assetCacheInput: Partial<AssetCacheConfigV4> = input?.assetCache || {};
  return {
    version: 1,
    mode,
    officialUrl,
    custom: {
      protocol: customInput.protocol === "https" ? "https" : "http",
      host: typeof customInput.host === "string" && customInput.host.trim() ? customInput.host.trim() : base.custom.host,
      port: Number.isFinite(Number(customInput.port)) ? Math.max(1, Math.min(65535, Math.floor(Number(customInput.port)))) : 5191,
      basePath: normalizeBasePath(customInput.basePath || "/changebattle/battle"),
      lastVerifiedAt: typeof customInput.lastVerifiedAt === "string" ? customInput.lastVerifiedAt : null,
    },
    desktopOffline: {
      enabled: Boolean(desktopOfflineInput.enabled),
      port: Number.isFinite(Number(desktopOfflineInput.port)) ? Math.max(0, Math.min(65535, Math.floor(Number(desktopOfflineInput.port)))) : 0,
      actualBaseUrl: normalizeBattleServerBaseUrl(desktopOfflineInput.actualBaseUrl || "") || null,
      lastStartedAt: typeof desktopOfflineInput.lastStartedAt === "string" ? desktopOfflineInput.lastStartedAt : null,
    },
    assetCache: {
      enabled: Boolean(assetCacheInput.enabled),
      rootDir: typeof assetCacheInput.rootDir === "string" && assetCacheInput.rootDir.trim() ? assetCacheInput.rootDir.trim() : "assets",
      cachedBytes: Number.isFinite(Number(assetCacheInput.cachedBytes)) ? Math.max(0, Math.floor(Number(assetCacheInput.cachedBytes))) : 0,
      cachedFileCount: Number.isFinite(Number(assetCacheInput.cachedFileCount)) ? Math.max(0, Math.floor(Number(assetCacheInput.cachedFileCount))) : 0,
      lastUpdatedAt: typeof assetCacheInput.lastUpdatedAt === "string" ? assetCacheInput.lastUpdatedAt : null,
    },
  };
}

export function battleServerBaseUrlForConfigV4(config: BattleServerConfigV4): string {
  const normalized = normalizeBattleServerConfigV4(config);
  if (normalized.mode === "custom") {
    const host = normalized.custom.host.trim();
    if (!host) return normalized.officialUrl;
    return normalizeBattleServerBaseUrl(`${normalized.custom.protocol}://${host}:${normalized.custom.port}${normalized.custom.basePath}`) || normalized.officialUrl;
  }
  if (normalized.mode === "desktop-offline") {
    return normalized.desktopOffline.actualBaseUrl || normalized.officialUrl;
  }
  return normalized.officialUrl;
}

export function normalizeBattleServerBaseUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function normalizeBasePath(value: string): string {
  const clean = value.trim().replace(/\/+$/, "");
  if (!clean || clean === "/") return "";
  return clean.startsWith("/") ? clean : `/${clean}`;
}
