import type {AssetCoreConfig} from "./types.js";

export const DEFAULT_CHANGE_BATTLE_ASSET_BASE_URL = "https://assets.65h26i.top/beta";

export const defaultAssetCoreConfig: AssetCoreConfig = {
  defaultProvider: "tx",
  providers: {
    tx: {
      baseUrl: DEFAULT_CHANGE_BATTLE_ASSET_BASE_URL,
    },
    qiniu: {
      baseUrl: "https://qiniu-assets.changebattle.cn/beta",
    },
    local: {
      baseUrl: "/assets",
    },
  },
};
