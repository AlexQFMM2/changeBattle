import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {builtinModules} from "node:module";
import {pathToFileURL} from "node:url";
import path from "node:path";
import {build} from "esbuild";

const projectRoot = path.resolve(import.meta.dirname, "..");
const showdownRootCandidates = [
  process.env.SHOWDOWN_PATH,
  path.resolve(projectRoot, "../vendor/pokemon-showdown"),
  path.resolve(projectRoot, "../pokemonShowdowm/pokemon-showdown"),
  path.resolve(projectRoot, "release/changeBattle-cli-win/vendor/pokemon-showdown"),
].filter(Boolean);
const showdownRoot = showdownRootCandidates.find(candidate => existsSync(path.join(candidate, "dist", "sim", "index.js")))
  || path.resolve(showdownRootCandidates[0]);
const simEntry = path.join(showdownRoot, "dist", "sim", "index.js");
const showdownVirtualRoot = "/showdown";
const showdownSimDir = `${showdownVirtualRoot}/dist/sim`;
const dataRoot = path.join(showdownRoot, "dist", "data");
const workDir = path.join(projectRoot, "tmp", "mobile-showdown-smoke");
const generatedEntry = path.join(workDir, "entry.mjs");
const bundleFile = path.resolve(projectRoot, process.env.CHANGEBATTLE_MOBILE_SHOWDOWN_BUNDLE || path.join("tmp", "mobile-showdown-smoke", "showdown-mobile-smoke.mjs"));
const skipSmoke = process.env.CHANGEBATTLE_MOBILE_SHOWDOWN_SKIP_SMOKE === "1";

if (!existsSync(simEntry)) {
  throw new Error(`Pokemon Showdown sim entry not found. Tried: ${showdownRootCandidates.map(candidate => path.join(candidate, "dist", "sim", "index.js")).join(", ")}`);
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
    if (relative.startsWith("random-battles/")) return path.basename(file) === "teams.js";
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
const moduleIdentByKey = new Map();
for (const [index, file] of [...dataFiles, ...configFiles].entries()) {
  const ident = `dataModule${index}`;
  imports.push(`import * as ${ident} from ${JSON.stringify(importPath(file))};`);
  for (const key of moduleKeys(file)) {
    mapEntries.push(`${JSON.stringify(key)}: ${ident}`);
    moduleIdentByKey.set(key, ident);
  }
}
function addModuleAlias(fromKey, toKey) {
  const ident = moduleIdentByKey.get(toKey) || moduleIdentByKey.get(`${toKey}.js`);
  if (!ident || moduleIdentByKey.has(fromKey)) return;
  mapEntries.push(`${JSON.stringify(fromKey)}: ${ident}`);
  moduleIdentByKey.set(fromKey, ident);
}
for (const modName of modNames) {
  for (const fileName of allowedDataFiles) {
    const relative = fileName.replace(/\.js$/, "");
    const modKey = `/showdown/dist/data/mods/${modName}/${relative}`;
    const targetKey = modName === "gen7" && fileName === "learnsets.js"
      ? `/showdown/dist/data/mods/gen7sm/${relative}`
      : `/showdown/dist/data/${relative}`;
    addModuleAlias(modKey, targetKey);
    addModuleAlias(`${modKey}.js`, `${targetKey}.js`);
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

const bundledSource = readFileSync(bundleFile, "utf8");
const randomBattleGlobBridge = `globRequire_data_random_battles_teams = function changeBattleRandomBattleTeams(path2) {
      const modules = globalThis.__changeBattleShowdownModules || {};
      const normalized = __cbPath.resolve(path2);
      const relativeToSim = __cbPath.resolve(__dirname, path2);
      const candidates = [path2, normalized, normalized + ".js", relativeToSim, relativeToSim + ".js"];
      for (const candidate of candidates) {
        const module = modules[candidate];
        if (module) {
          const defaultExport = module.default && module.default.default ? module.default.default : module.default;
          return defaultExport ? {...module, default: defaultExport} : module;
        }
      }
      throw new Error("Module not found in bundle: " + path2);
    };`;
if (bundledSource.includes("globRequire_data_random_battles_teams = __glob({});")) {
  writeFileSync(bundleFile, bundledSource.replace("globRequire_data_random_battles_teams = __glob({});", randomBattleGlobBridge), "utf8");
}

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
const generatedTeam = showdown.Teams.generate("gen9randombattle", {seed: [1, 2, 3, 4]});
if (!Array.isArray(generatedTeam) || generatedTeam.length < 6) {
  throw new Error(`Mobile Showdown random battle generator failed: ${JSON.stringify(generatedTeam).slice(0, 500)}`);
}
const gen7Learnsets = globalThis.__changeBattleShowdownModules?.["/showdown/dist/data/mods/gen7/learnsets"];
if (!gen7Learnsets?.Learnsets) {
  throw new Error("Mobile Showdown gen7 learnsets alias is missing.");
}

const stream = new showdown.BattleStream();
const output = [];
void (async () => {
  for await (const chunk of stream) output.push(String(chunk));
})();
const smokeP1Team = showdown.Teams.pack([
  {species: "Pikachu", ability: "Static", moves: ["Thunderbolt", "Quick Attack"], evs: {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85}, level: 50},
  {species: "Eevee", ability: "Run Away", moves: ["Quick Attack", "Swift"], evs: {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85}, level: 50},
]);
const smokeP2Team = showdown.Teams.pack([
  {species: "Meowth", ability: "Pickup", moves: ["Scratch", "Growl"], evs: {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85}, level: 50},
  {species: "Persian", ability: "Limber", moves: ["Scratch", "Swift"], evs: {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85}, level: 50},
]);
void stream.write(`>start {"formatid":"gen9customgame","seed":[1,2,3,4]}`);
void stream.write(`>player p1 ${JSON.stringify({name: "AppP1", team: smokeP1Team})}`);
void stream.write(`>player p2 ${JSON.stringify({name: "AppP2", team: smokeP2Team})}`);
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

const gen7Stream = new showdown.BattleStream();
const gen7Output = [];
void (async () => {
  for await (const chunk of gen7Stream) gen7Output.push(String(chunk));
})();
void gen7Stream.write(`>start {"formatid":"gen7customgame","seed":[5,6,7,8]}`);
void gen7Stream.write(`>player p1 ${JSON.stringify({name: "Gen7P1", team: smokeP1Team})}`);
void gen7Stream.write(`>player p2 ${JSON.stringify({name: "Gen7P2", team: smokeP2Team})}`);
void gen7Stream.write(`>p1 team 12`);
void gen7Stream.write(`>p2 team 12`);
void gen7Stream.write(`>p1 move 1`);
void gen7Stream.write(`>p2 move 1`);
void gen7Stream.writeEnd();

await new Promise(resolve => setTimeout(resolve, 100));
const gen7Text = gen7Output.join("\n");
if (!gen7Text.includes("|move|") && !gen7Text.includes("|turn|")) {
  throw new Error(`Mobile Showdown gen7 smoke did not produce battle output:\n${gen7Text.slice(0, 2000)}`);
}
console.log(JSON.stringify({
  ok: true,
  bundle: path.relative(projectRoot, bundleFile),
  data_modules: dataFiles.length,
  mods: modNames.length,
  random_team_size: generatedTeam.length,
  output_excerpt: text.split("\n").slice(0, 12),
}, null, 2));
