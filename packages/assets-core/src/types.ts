import type {AssetKey} from "./generated/assetRegistry.js";

export type AssetProviderName = "tx" | "qiniu" | "local";

export type AssetProviderConfig = {
  baseUrl: string;
};

export type AssetCoreConfig = {
  defaultProvider: AssetProviderName;
  providers: Record<AssetProviderName, AssetProviderConfig>;
};

export type AssetRegistryEntry = {
  path: string;
  source: "csv" | "scan";
  description?: string;
};

export type AssetToolInput = AssetKey | string;

export type AssetToolOptions = {
  provider?: AssetProviderName;
  baseUrl?: string;
  config?: AssetCoreConfig;
  allowRawPath?: boolean;
};
