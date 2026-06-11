import type {RuntimeEnvironment} from "@changebattle/game-runtime";
import {createMobileDataProvider} from "./mobileDataProvider";
import {createMobileSaveStore} from "./mobileSaveStore";
import {createMobileShowdownLoader, type MobileShowdownModule} from "./mobileShowdownLoader";

const LEGACY_ASSET_PATHS: Record<string, string> = {
  "assets/npc/player-front/斗也-bw_black.png": "assets/npc/player-front/black-bw-black-c8f5411e.png",
  "assets/npc/player-back/斗也-bw_touya_back.png": "assets/npc/player-back/black-bw-touya-back-b2e0a77d.png",
  "assets/npc/avatars/斗也-blackchallenge.png": "assets/npc/avatars/black-blackchallenge-59553dba.png",
  "assets/npc/normal/dp_battle_girl-2-dp_battle_girl.png": "assets/npc/normal/dp-battle-girl-2-dp-battle-girl-4c7f4ba3.png",
};

export function createMobileRuntimeEnvironment(): RuntimeEnvironment<MobileShowdownModule> {
  return {
    data: createMobileDataProvider(),
    saves: createMobileSaveStore(),
    assets: {
      assetUrl(relativePath) {
        if (/^(https?:|data:|blob:)/i.test(relativePath)) return relativePath;
        const cleanPath = relativePath.replace(/^\/+/, "");
        const migratedPath = LEGACY_ASSET_PATHS[cleanPath] || cleanPath;
        try {
          return encodeURI(migratedPath);
        } catch {
          return migratedPath;
        }
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
