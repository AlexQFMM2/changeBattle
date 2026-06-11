import type {RuntimeDataProvider} from "@changebattle/game-runtime";
import {createFetchDataProvider, normalizeRuntimePath} from "@changebattle/game-runtime";

export function createMobileDataProvider(basePath = "/data"): RuntimeDataProvider {
  const provider = createFetchDataProvider(basePath);
  return {
    async readText(path) {
      return provider.readText(stripDataPrefix(path));
    },
    async readJson<T = unknown>(path: string): Promise<T> {
      return provider.readJson<T>(stripDataPrefix(path));
    },
    async exists(path) {
      return provider.exists(stripDataPrefix(path));
    },
  };
}

function stripDataPrefix(path: string): string {
  const normalized = normalizeRuntimePath(path);
  return normalized.startsWith("data/") ? normalized.slice("data/".length) : normalized;
}
