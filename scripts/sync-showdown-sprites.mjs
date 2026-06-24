import {mkdir, readFile, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = "https://play.pokemonshowdown.com";
const outRoot = path.join(root, "assets/showdown/sprites");
const dataFile = path.join(root, "packages/showdown-dex-core/src/data/pokedex.ts");
const manifestFile = path.join(outRoot, "manifest.json");
const missingFile = path.join(outRoot, "missing-sprites.json");
const dirs = ["ani", "ani-back", "ani-shiny", "ani-back-shiny"];
const iconSheets = ["pokemonicons-sheet.png", "pokemonicons-pokeball-sheet.png", "itemicons-sheet.png"];
const concurrency = Number(process.env.SHOWDOWN_SPRITE_SYNC_CONCURRENCY || 24);

function toID(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function spriteId(species) {
  const id = toID(species.id || species.name);
  const baseId = toID(species.baseSpecies || species.name || id);
  const forme = toID(species.forme || "");
  let result = baseId === id ? baseId : `${baseId}-${forme}`;
  if (result.endsWith("totem")) result = result.slice(0, -5);
  if (result === "greninja-bond") result = "greninja";
  if (result === "rockruff-dusk") result = "rockruff";
  if (result.endsWith("-")) result = result.slice(0, -1);
  return result;
}

async function loadPokedex() {
  const raw = await readFile(dataFile, "utf8");
  const transformed = raw
    .replace(/\/\/ @ts-nocheck\s*/g, "")
    .replace(/\/\/ Copied[^\n]*\n/g, "")
    .replace(/export const Pokedex\s*=/, "return ");
  const pokedex = Function(transformed)();
  return Object.entries(pokedex)
    .map(([id, species]) => ({...species, id}))
    .filter(species => species.num > 0);
}

async function download(url, file) {
  if (existsSync(file)) return "cached";
  const response = await fetch(url);
  if (!response.ok) return `missing:${response.status}`;
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, buffer);
  return "downloaded";
}

async function main() {
  const species = await loadPokedex();
  const sprites = Array.from(new Map(species.map(entry => [spriteId(entry), entry])).entries())
    .map(([id, entry]) => ({id, speciesId: entry.id, name: entry.name, baseSpecies: entry.baseSpecies || entry.name}));
  const manifest = {source, generatedAt: new Date().toISOString(), dirs, iconSheets, count: sprites.length, sprites};
  const missing = [];
  let downloaded = 0;
  let cached = 0;
  let checked = 0;
  const tasks = [];

  for (const sprite of sprites) {
    for (const dir of dirs) {
      const url = `${source}/sprites/${dir}/${sprite.id}.gif`;
      const file = path.join(outRoot, dir, `${sprite.id}.gif`);
      tasks.push({sprite, dir, url, file});
    }
  }

  for (const sheet of iconSheets) {
    const url = `${source}/sprites/${sheet}`;
    const file = path.join(outRoot, sheet);
    tasks.push({sprite: {id: sheet, speciesId: "", name: sheet, baseSpecies: ""}, dir: "icons", url, file});
  }

  let taskIndex = 0;
  async function worker() {
    while (taskIndex < tasks.length) {
      const task = tasks[taskIndex++];
      const result = await download(task.url, task.file);
      if (result === "downloaded") downloaded++;
      else if (result === "cached") cached++;
      else missing.push({...task.sprite, dir: task.dir, url: task.url, reason: result});
      checked++;
      if (checked % 200 === 0 || checked === tasks.length) {
        console.log(`Checked ${checked}/${tasks.length}; downloaded ${downloaded}, cached ${cached}, missing ${missing.length}.`);
      }
    }
  }

  await Promise.all(Array.from({length: concurrency}, () => worker()));

  await mkdir(outRoot, {recursive: true});
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(missingFile, `${JSON.stringify(missing, null, 2)}\n`);
  console.log(`Showdown sprites sync complete: ${downloaded} downloaded, ${cached} cached, ${missing.length} missing.`);
  console.log(`Manifest: ${manifestFile}`);
  console.log(`Missing: ${missingFile}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
