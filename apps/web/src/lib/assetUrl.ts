const EXTERNAL_URL_PATTERN = /^(https?:|data:|blob:|file:|capacitor:)/i;

export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (EXTERNAL_URL_PATTERN.test(path)) return path;
  if (path.startsWith("./") || path.startsWith("../")) return path;
  const cleanPath = path.replace(/^\/+/, "").replace(/^assets\//, "");
  if (!cleanPath) return publicAssetBase();
  const [, assetPath, suffix = ""] = /^([^?#]*)([?#].*)?$/.exec(cleanPath) || [];
  const base = publicAssetBase();
  return `${base}${(assetPath || cleanPath).split("/").map(encodeURIComponent).join("/")}${suffix}`;
}

export function cssAssetUrl(path?: string | null): string | undefined {
  const url = assetUrl(path);
  return url ? `url("${url}")` : undefined;
}

export function publicAssetBase(): string {
  const meta = import.meta as ImportMeta & {env?: {BASE_URL?: string}};
  const base = meta.env?.BASE_URL || "/";
  if (base === "./" || base === ".") return "./";
  return base.endsWith("/") ? base : `${base}/`;
}

export function showdownAssetPrefix(): string {
  return assetUrl("showdown/") || `${publicAssetBase()}showdown/`;
}

export function styleUrlAssetPath(url: string): string {
  const clean = url.trim().replace(/^["']|["']$/g, "");
  return assetUrl(clean) || clean;
}
