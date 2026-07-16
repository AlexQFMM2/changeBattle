const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeAssetPath(path: string): string {
  const rawPath = String(path || "").trim().replaceAll("\\", "/");

  if (!rawPath) {
    throw new Error("Asset path must not be empty");
  }

  if (ABSOLUTE_URL_PATTERN.test(rawPath) || rawPath.startsWith("//")) {
    throw new Error(`Asset path must be relative: ${path}`);
  }

  if (rawPath.includes("?") || rawPath.includes("#")) {
    throw new Error(`Asset path must not include query or hash: ${path}`);
  }

  const withoutLeadingSlash = rawPath.replace(/^\/+/, "");
  const segments = withoutLeadingSlash.split("/");

  if (segments.some(segment => !segment || segment === "." || segment === "..")) {
    throw new Error(`Asset path contains an unsafe segment: ${path}`);
  }

  return segments.join("/");
}

export function joinAssetBaseUrl(baseUrl: string, assetPath: string): string {
  const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) {
    throw new Error("Asset provider baseUrl must not be empty");
  }

  return `${normalizedBaseUrl}/${normalizeAssetPath(assetPath)}`;
}
