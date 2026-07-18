import {DEFAULT_CHANGE_BATTLE_ASSET_BASE_URL, joinAssetBaseUrl} from "@changebattle-v2/assets-core";

const EXTERNAL_URL_PATTERN = /^(https?:|data:|blob:|file:|capacitor:|changebattle-asset:)/i;

type AssetCacheRuntimeConfig = {
  enabled: boolean;
  provider: "desktop" | "none";
};

let assetCacheRuntimeConfig: AssetCacheRuntimeConfig = {enabled: false, provider: "none"};

export function setAssetCacheRuntimeConfig(config: AssetCacheRuntimeConfig): void {
  assetCacheRuntimeConfig = config;
}

export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const rawPath = path.trim();
  if (!rawPath) return undefined;
  if (EXTERNAL_URL_PATTERN.test(rawPath) || rawPath.startsWith("//")) return rawPath;
  if (rawPath.startsWith("./") || rawPath.startsWith("../")) return rawPath;
  const cleanPath = rawPath.replace(/^\/+/, "").replace(/^assets\//, "").replace(/\/+$/, "");
  if (!cleanPath) return publicAssetBase();
  const [, assetPath, suffix = ""] = /^([^?#]*)([?#].*)?$/.exec(cleanPath) || [];
  if (assetCacheRuntimeConfig.enabled && assetCacheRuntimeConfig.provider === "desktop" && assetPath) {
    return `changebattle-asset://beta/${encodeAssetPath(assetPath)}${suffix}`;
  }
  return `${joinAssetBaseUrl(publicAssetBase(), assetPath || cleanPath)}${suffix}`;
}

export function cssAssetUrl(path?: string | null): string | undefined {
  const url = assetUrl(path);
  return url ? `url("${url}")` : undefined;
}

export function publicAssetBase(): string {
  const meta = import.meta as ImportMeta & {env?: {VITE_CHANGE_BATTLE_ASSET_BASE_URL?: string}};
  return meta.env?.VITE_CHANGE_BATTLE_ASSET_BASE_URL || DEFAULT_CHANGE_BATTLE_ASSET_BASE_URL;
}

export function showdownAssetPrefix(): string {
  return `${assetUrl("showdown") || joinAssetBaseUrl(publicAssetBase(), "showdown")}/`;
}

export function styleUrlAssetPath(url: string): string {
  const clean = url.trim().replace(/^["']|["']$/g, "");
  return assetUrl(clean) || clean;
}

function encodeAssetPath(path: string): string {
  return path.split("/").filter(Boolean).map(part => encodeURIComponent(part)).join("/");
}
