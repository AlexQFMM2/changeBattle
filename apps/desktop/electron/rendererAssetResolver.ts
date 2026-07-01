import path from "node:path";

const rendererPublicDirs = new Set([
  "aboutIcon",
  "battle",
  "battle-backgrounds",
  "board",
  "music",
  "npc",
  "shop",
  "showdown",
  "specIcon",
  "title",
  "training",
  "training-ground",
  "ui",
]);

export function rendererAssetFilePath(url: string, rendererRoot: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "file:") return null;
  const pathname = decodeURIComponent(parsed.pathname).replace(/\\/g, "/");
  const parts = pathname.split("/").filter(Boolean);
  const publicDir = parts[0];
  if (!publicDir || !rendererPublicDirs.has(publicDir)) return null;
  return path.join(rendererRoot, ...parts);
}
