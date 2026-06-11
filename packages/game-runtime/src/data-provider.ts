export type RuntimeDataProvider = {
  readText(path: string): Promise<string>;
  readTextSync?(path: string): string | null | undefined;
  readJson<T = unknown>(path: string): Promise<T>;
  exists(path: string): Promise<boolean>;
  existsSync?(path: string): boolean;
};

export function normalizeRuntimePath(path: string): string {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

export function createRecordDataProvider(files: Record<string, string>): RuntimeDataProvider {
  const normalized = new Map(Object.entries(files).map(([key, value]) => [normalizeRuntimePath(key), value]));
  return {
    async readText(path) {
      const key = normalizeRuntimePath(path);
      const value = normalized.get(key);
      if (value === undefined) throw new Error(`Runtime data file not found: ${key}`);
      return value;
    },
    readTextSync(path) {
      return normalized.get(normalizeRuntimePath(path)) ?? null;
    },
    async readJson<T = unknown>(path: string): Promise<T> {
      return JSON.parse(await this.readText(path)) as T;
    },
    async exists(path) {
      return normalized.has(normalizeRuntimePath(path));
    },
    existsSync(path) {
      return normalized.has(normalizeRuntimePath(path));
    },
  };
}

export function createFetchDataProvider(basePath = ""): RuntimeDataProvider {
  const prefix = normalizeRuntimePath(basePath);
  const urlFor = (path: string) => {
    const key = normalizeRuntimePath(path);
    return prefix ? `${prefix.replace(/\/$/, "")}/${key}` : key;
  };
  return {
    async readText(path) {
      const url = urlFor(path);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Runtime data fetch failed: ${url} (${response.status})`);
      return response.text();
    },
    async readJson<T = unknown>(path: string): Promise<T> {
      return JSON.parse(await this.readText(path)) as T;
    },
    async exists(path) {
      const response = await fetch(urlFor(path), {method: "HEAD"}).catch(() => null);
      return Boolean(response?.ok);
    },
  };
}
