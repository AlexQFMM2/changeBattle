import {existsSync, mkdirSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {builtinModules} from "node:module";
import {pathToFileURL} from "node:url";
import path from "node:path";
import {build} from "esbuild";

const projectRoot = path.resolve(import.meta.dirname, "..");
const defaultShowdownRoot = path.resolve(projectRoot, "../pokemonShowdowm/pokemon-showdown");
const showdownRoot = path.resolve(process.env.SHOWDOWN_PATH || defaultShowdownRoot);
const simEntry = path.join(showdownRoot, "dist", "sim", "index.js");
const showdownVirtualRoot = "/showdown";
const showdownSimDir = `${showdownVirtualRoot}/dist/sim`;
const dataRoot = path.join(showdownRoot, "dist", "data");
const workDir = path.join(projectRoot, "tmp", "mobile-showdown-smoke");
const generatedEntry = path.join(workDir, "entry.mjs");
const bundleFile = path.resolve(projectRoot, process.env.CHANGEBATTLE_MOBILE_SHOWDOWN_BUNDLE || path.join("tmp", "mobile-showdown-smoke", "showdown-mobile-smoke.mjs"));
const skipSmoke = process.env.CHANGEBATTLE_MOBILE_SHOWDOWN_SKIP_SMOKE === "1";

if (!existsSync(simEntry)) {
  throw new Error(`Pokemon Showdown sim entry not found: ${simEntry}`);
}

function slash(value) {
  return value.replace(/\\/g, "/");
}

function walkJsFiles(root) {
  if (!existsSync(root)) return [];
  const result = [];
  for (const entry of readdirSync(root, {withFileTypes: true})) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      result.push(full);
    }
  }
  return result;
}

function moduleKeys(filePath) {
  const relative = slash(path.relative(showdownRoot, filePath));
  const virtualPath = `${showdownVirtualRoot}/${relative}`;
  return [virtualPath, virtualPath.replace(/\.js$/, "")];
}

function importPath(filePath) {
  const relative = slash(path.relative(workDir, filePath));
  return relative.startsWith(".") ? relative : `./${relative}`;
}

const allowedDataFiles = new Set([
  "abilities.js",
  "aliases.js",
  "conditions.js",
  "formats-data.js",
  "items.js",
  "learnsets.js",
  "moves.js",
  "natures.js",
  "pokedex.js",
  "pokemongo.js",
  "rulesets.js",
  "scripts.js",
  "typechart.js",
]);
const allowedTextFiles = new Set(["abilities.js", "default.js", "items.js", "moves.js", "pokedex.js"]);
const blockedMods = new Set(["mods"]);
const blockedDataMods = new Set(["gen9ssb"]);
const allowedMods = new Set(existsSync(path.join(dataRoot, "mods"))
  ? readdirSync(path.join(dataRoot, "mods"), {withFileTypes: true}).filter(entry => entry.isDirectory() && !blockedMods.has(entry.name)).map(entry => entry.name)
  : []);

const dataFiles = walkJsFiles(dataRoot)
  .filter(file => {
    if (file.endsWith(".d.ts")) return false;
    const relative = slash(path.relative(dataRoot, file));
    if (relative.startsWith("mods/")) {
      const mod = relative.split("/")[1];
      if (!allowedMods.has(mod)) return false;
      if (blockedDataMods.has(mod)) return false;
    }
    if (relative.startsWith("text/")) return allowedTextFiles.has(path.basename(file));
    return allowedDataFiles.has(path.basename(file));
  })
  .sort((a, b) => a.localeCompare(b));
const configFiles = [path.join(showdownRoot, "dist", "config", "formats.js")].filter(existsSync);

const modNames = existsSync(path.join(dataRoot, "mods"))
  ? readdirSync(path.join(dataRoot, "mods"), {withFileTypes: true}).filter(entry => entry.isDirectory() && allowedMods.has(entry.name)).map(entry => entry.name).sort()
  : [];

const imports = [];
const mapEntries = [];
for (const [index, file] of [...dataFiles, ...configFiles].entries()) {
  const ident = `dataModule${index}`;
  imports.push(`import * as ${ident} from ${JSON.stringify(importPath(file))};`);
  for (const key of moduleKeys(file)) {
    mapEntries.push(`${JSON.stringify(key)}: ${ident}`);
  }
}
const customFormatsKeys = moduleKeys(path.join(showdownRoot, "dist", "config", "custom-formats.js"));
for (const key of customFormatsKeys) {
  mapEntries.push(`${JSON.stringify(key)}: {Formats: []}`);
}

const entrySource = `${imports.join("\n")}
import * as sim from ${JSON.stringify(importPath(simEntry))};

globalThis.__changeBattleShowdownModules = {
  ...(globalThis.__changeBattleShowdownModules || {}),
  ${mapEntries.join(",\n  ")}
};
globalThis.__changeBattleShowdownMods = ${JSON.stringify(modNames)};

export const BattleStream = sim.BattleStream;
export const Dex = sim.Dex;
export const Teams = sim.Teams;
export const getPlayerStreams = sim.getPlayerStreams;
export default sim;
`;

const banner = `
globalThis.global = globalThis.global || globalThis;
globalThis.process = globalThis.process || {env: {}};
globalThis.Config = globalThis.Config || {nofswriting: true};
const global = globalThis;
const Config = globalThis.Config;
const process = globalThis.process;
const __dirname = ${JSON.stringify(showdownSimDir)};
const __cbPath = {
  sep: "/",
  resolve(...parts) {
    const raw = parts.filter(Boolean).join("/");
    const absolute = raw.startsWith("/") ? raw : "/" + raw;
    const out = [];
    for (const part of absolute.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") out.pop();
      else out.push(part);
    }
    return "/" + out.join("/");
  },
  join(...parts) { return this.resolve(...parts); },
  dirname(value) {
    const normalized = this.resolve(value);
    return normalized.slice(0, normalized.lastIndexOf("/")) || "/";
  },
};
const __cbFs = {
  readdirSync(value) {
    const normalized = __cbPath.resolve(value);
    if (normalized.endsWith("/dist/data/mods")) return globalThis.__changeBattleShowdownMods || [];
    return [];
  },
};
const __cbNodeStub = new Proxy(function unsupportedNodeApi() {}, {
  get(_target, key) {
    if (key === "default") return __cbNodeStub;
    if (key === "promises") return {};
    return __cbNodeStub;
  },
  apply(_target, _thisArg, args) {
    throw new Error("Unsupported mobile Showdown Node API call: " + JSON.stringify(args));
  },
  construct() {
    return {};
  },
});
const require = id => {
  const modules = globalThis.__changeBattleShowdownModules || {};
  const normalized = typeof id === "string" ? __cbPath.resolve(id) : id;
  if (modules[id]) return modules[id];
  if (modules[normalized]) return modules[normalized];
  if (modules[normalized + ".js"]) return modules[normalized + ".js"];
  if (id === "fs" || id === "node:fs") return __cbFs;
  if (id === "path" || id === "node:path") return __cbPath;
  if (id === "node:util") return {isDeepStrictEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b)};
  if (id === "node:assert" || id === "assert") return {strict: {equal() {}, deepEqual() {}, ok(value) { if (!value) throw new Error("assertion failed"); }}};
  if (${JSON.stringify([...builtinModules, ...builtinModules.map(name => `node:${name}`)])}.includes(id)) return __cbNodeStub;
  throw new Error("Unsupported mobile Showdown require: " + id);
};
`;

rmSync(workDir, {recursive: true, force: true});
mkdirSync(workDir, {recursive: true});
mkdirSync(path.dirname(bundleFile), {recursive: true});
writeFileSync(generatedEntry, entrySource, "utf8");

await build({
  entryPoints: [generatedEntry],
  outfile: bundleFile,
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2020",
  banner: {js: banner},
  loader: {
    ".map": "text",
    ".tsbuildinfo": "text",
  },
  external: [
    ...builtinModules,
    ...builtinModules.map(name => `node:${name}`),
    "fs",
    "path",
    "assert",
    "node:*",
    "mysql2",
    "node-oom-heapdump",
    "pg",
    "sql-template-strings",
  ],
  logLevel: "silent",
});

if (skipSmoke) {
  console.log(JSON.stringify({
    ok: true,
    bundle: path.relative(projectRoot, bundleFile),
    data_modules: dataFiles.length,
    mods: modNames.length,
  }, null, 2));
  process.exit(0);
}

const showdown = await import(pathToFileURL(bundleFile).href);
showdown.Dex.includeData();

const stream = new showdown.BattleStream();
const output = [];
void (async () => {
  for await (const chunk of stream) output.push(String(chunk));
})();
void stream.write(`>start {"formatid":"gen9customgame","seed":[1,2,3,4]}`);
void stream.write(`>player p1 {"name":"AppP1","team":"Pikachu||static|thunderbolt,quickattack||85,,,,85||||50]Eevee||runaway|quickattack,swift||85,,,,85||||50"}`);
void stream.write(`>player p2 {"name":"AppP2","team":"Meowth||pickup|scratch,growl||85,,,,85||||50]Persian||limber|scratch,swift||85,,,,85||||50"}`);
void stream.write(`>p1 team 12`);
void stream.write(`>p2 team 12`);
void stream.write(`>p1 move 1`);
void stream.write(`>p2 move 1`);
void stream.writeEnd();

await new Promise(resolve => setTimeout(resolve, 100));
const text = output.join("\n");
if (!text.includes("|move|") && !text.includes("|turn|")) {
  throw new Error(`Mobile Showdown smoke did not produce battle output:\n${text.slice(0, 2000)}`);
}
console.log(JSON.stringify({
  ok: true,
  bundle: path.relative(projectRoot, bundleFile),
  data_modules: dataFiles.length,
  mods: modNames.length,
  output_excerpt: text.split("\n").slice(0, 12),
}, null, 2));
