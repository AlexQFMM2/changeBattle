import {cpSync, existsSync, mkdirSync, rmSync} from "node:fs";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const mobileRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const projectRoot = resolve(mobileRoot, "../..");
const dist = join(mobileRoot, "dist");
const excludedAssetRoots = new Set([
  "pokemon-green",
  "battle-effects-pack",
  "pokemon-showdown",
  "pokemon-pack",
  "pokemon-custom",
  "items-pack",
  "items",
]);

function shouldCopyStaticPath(path, rootName) {
  if (rootName !== "assets") return true;
  const normalized = path.replaceAll("\\", "/");
  const assetsRoot = join(projectRoot, "assets").replaceAll("\\", "/");
  if (normalized === assetsRoot) return true;
  if (!normalized.startsWith(`${assetsRoot}/`)) return true;
  const firstSegment = normalized.slice(assetsRoot.length + 1).split("/", 1)[0];
  return !excludedAssetRoots.has(firstSegment);
}

for (const name of ["assets", "data"]) {
  const source = join(projectRoot, name);
  const target = join(dist, name);
  if (!existsSync(source)) continue;
  if (name === "data" && existsSync(target)) rmSync(target, {recursive: true, force: true});
  mkdirSync(target, {recursive: true});
  cpSync(source, target, {
    recursive: true,
    filter: path => shouldCopyStaticPath(path, name),
  });
}
