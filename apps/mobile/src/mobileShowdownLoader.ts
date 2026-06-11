import type {RuntimeShowdownLoader} from "@changebattle/game-runtime";

export type MobileShowdownModule = {
  BattleStream: unknown;
  Dex: {includeData?: () => void};
  Teams?: unknown;
  getPlayerStreams?: unknown;
  default?: unknown;
};

export function createMobileShowdownLoader(bundleUrl = "/showdown/showdown-mobile.mjs"): RuntimeShowdownLoader<MobileShowdownModule> {
  let cached: Promise<MobileShowdownModule> | null = null;
  return {
    load() {
      cached ||= import(/* @vite-ignore */ bundleUrl).then(module => {
        const showdown = module as MobileShowdownModule;
        showdown.Dex?.includeData?.();
        return showdown;
      });
      return cached;
    },
  };
}
