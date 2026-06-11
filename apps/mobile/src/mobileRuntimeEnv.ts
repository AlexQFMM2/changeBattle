import type {RuntimeEnvironment} from "@changebattle/game-runtime";
import {createMobileDataProvider} from "./mobileDataProvider";
import {createMobileSaveStore} from "./mobileSaveStore";
import {createMobileShowdownLoader, type MobileShowdownModule} from "./mobileShowdownLoader";

export function createMobileRuntimeEnvironment(): RuntimeEnvironment<MobileShowdownModule> {
  return {
    data: createMobileDataProvider(),
    saves: createMobileSaveStore(),
    assets: {
      assetUrl(relativePath) {
        if (/^(https?:|data:|blob:)/i.test(relativePath)) return relativePath;
        return relativePath.replace(/^\/+/, "");
      },
    },
    showdown: createMobileShowdownLoader(),
    logger: {
      debug(scope, message, data) {
        if (import.meta.env.DEV) console.debug(`[changebattle:${scope}] ${message}`, data);
      },
    },
    uuid: {
      randomUUID() {
        return globalThis.crypto?.randomUUID?.() || `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      },
    },
    now: () => new Date(),
  };
}
