import {defaultAssetCoreConfig} from "./config.js";
import {joinAssetBaseUrl} from "./assetPaths.js";
import {assetRegistry, type AssetKey} from "./generated/assetRegistry.js";
import type {AssetCoreConfig, AssetToolInput, AssetToolOptions} from "./types.js";

function isKnownAssetKey(input: string): input is AssetKey {
  return Object.prototype.hasOwnProperty.call(assetRegistry, input);
}

export function resolveAssetEntryPath(input: AssetToolInput, options: Pick<AssetToolOptions, "allowRawPath"> = {}): string {
  const key = String(input || "").trim();

  if (!key) {
    throw new Error("Asset key must not be empty");
  }

  if (isKnownAssetKey(key)) {
    return assetRegistry[key].path;
  }

  if (options.allowRawPath) {
    return key;
  }

  throw new Error(`Unknown asset key: ${key}`);
}

export function resolveAssetBaseUrl(config: AssetCoreConfig, options: Pick<AssetToolOptions, "provider" | "baseUrl"> = {}): string {
  if (options.baseUrl) {
    return options.baseUrl;
  }

  const providerName = options.provider ?? config.defaultProvider;
  const provider = config.providers[providerName];

  if (!provider) {
    throw new Error(`Unknown asset provider: ${providerName}`);
  }

  return provider.baseUrl;
}

export function createAssetsTool(config: AssetCoreConfig = defaultAssetCoreConfig) {
  return function configuredAssetsTool(input: AssetToolInput, options: Omit<AssetToolOptions, "config"> = {}): string {
    const path = resolveAssetEntryPath(input, options);
    const baseUrl = resolveAssetBaseUrl(config, options);
    return joinAssetBaseUrl(baseUrl, path);
  };
}

export function assetsTool(input: AssetToolInput, options: AssetToolOptions = {}): string {
  const config = options.config ?? defaultAssetCoreConfig;
  const path = resolveAssetEntryPath(input, options);
  const baseUrl = resolveAssetBaseUrl(config, options);
  return joinAssetBaseUrl(baseUrl, path);
}
