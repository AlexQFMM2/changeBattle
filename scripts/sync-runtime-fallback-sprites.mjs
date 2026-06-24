import {copyFile, mkdir, readFile, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const defaultRuntimeRoot = path.resolve(root, "../changeBattle/assets/runtime/pokemon");
const runtimeRoot = process.env.CHANGEBATTLE_V1_RUNTIME_POKEMON || defaultRuntimeRoot;
const missingFile = path.join(root, "assets/showdown/sprites/missing-sprites.json");
const spriteRoot = path.join(root, "assets/showdown/sprites");
const manifestFile = path.join(spriteRoot, "runtime-overrides.json");

const directionMap = {
  ani: {oldPrefix: "front_normal"},
  "ani-back": {oldPrefix: "back_normal"},
  "ani-shiny": {oldPrefix: "front_shiny"},
  "ani-back-shiny": {oldPrefix: "back_shiny"},
};

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function listDirSafe(dir) {
  try {
    return await import("node:fs/promises").then(fs => fs.readdir(dir));
  } catch {
    return [];
  }
}

function findOldFile(files, prefix) {
  return files.find(file => file.startsWith(`${prefix}-`) && /\.(png|webp|gif)$/i.test(file));
}

async function main() {
  const missing = await readJson(missingFile);
  const copied = [];
  const unavailable = [];
  const seen = new Set();

  for (const entry of missing) {
    const direction = directionMap[entry.dir];
    if (!direction || !entry.id || !entry.speciesId) continue;
    const key = `${entry.dir}/${entry.id}.gif`;
    if (seen.has(key)) continue;
    seen.add(key);

    const oldDir = path.join(runtimeRoot, entry.speciesId);
    const files = await listDirSafe(oldDir);
    const oldFile = findOldFile(files, direction.oldPrefix);
    if (!oldFile) {
      unavailable.push({...entry, expectedOldPrefix: direction.oldPrefix, oldDir});
      continue;
    }

    const outDir = path.join(spriteRoot, entry.dir);
    const outFile = path.join(outDir, `${entry.id}.gif`);
    await mkdir(outDir, {recursive: true});
    if (!existsSync(outFile)) await copyFile(path.join(oldDir, oldFile), outFile);
    copied.push({
      id: entry.id,
      speciesId: entry.speciesId,
      dir: entry.dir,
      target: `sprites/${entry.dir}/${entry.id}.gif`,
      targetPath: outFile,
      source: path.join(oldDir, oldFile),
      note: "runtime PNG copied into V2 missing Showdown sprite path; remove using this manifest to reset",
    });
  }

  await mkdir(spriteRoot, {recursive: true});
  await writeFile(manifestFile, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: runtimeRoot,
    missingFile,
    resetHint: "Delete every copied[].targetPath to restore the pure Showdown mirror; keep missing-sprites.json as the authoritative 404 list.",
    copiedCount: copied.length,
    unavailableCount: unavailable.length,
    copied,
    unavailable,
  }, null, 2)}\n`);
  console.log(`Runtime fallback sync complete: ${copied.length} copied, ${unavailable.length} unavailable.`);
  console.log(`Manifest: ${manifestFile}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
