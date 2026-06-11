import {cpSync, existsSync, mkdirSync, rmSync} from "node:fs";
import {join, resolve} from "node:path";

const mobileRoot = resolve(new URL("..", import.meta.url).pathname);
const projectRoot = resolve(mobileRoot, "../..");
const dist = join(mobileRoot, "dist");

for (const name of ["assets", "data"]) {
  const source = join(projectRoot, name);
  const target = join(dist, name);
  if (!existsSync(source)) continue;
  if (existsSync(target)) rmSync(target, {recursive: true, force: true});
  mkdirSync(dist, {recursive: true});
  cpSync(source, target, {
    recursive: true,
    filter: path => !/[\\/]pokemon-green([\\/]|$)/.test(path) && !/[\\/]battle-effects-pack([\\/]|$)/.test(path),
  });
}
