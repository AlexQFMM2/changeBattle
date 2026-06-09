import {execFileSync, spawnSync} from "node:child_process";
import {existsSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const assetDir = path.join(projectRoot, "assets", "z-moves");
const manifestPath = path.join(assetDir, "manifest.json");
const maxWidth = 220;
const maxHeight = 90;

function spriteFiles() {
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return manifest.files
      .filter(entry => entry.ok !== false && entry.fileName)
      .map(entry => entry.fileName);
  }
  return readdirSync(assetDir).filter(name => /\.(png|webp)$/i.test(name));
}

function probe(filePath) {
  const result = spawnSync("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "json",
    filePath,
  ], {encoding: "utf8"});
  if (result.status !== 0 && !result.stdout) throw result.error || new Error(result.stderr || `ffprobe failed for ${filePath}`);
  const output = result.stdout;
  return JSON.parse(output).streams?.[0] || {width: 0, height: 0};
}

const scaleFilter = `scale='if(gt(iw/ih,${maxWidth}/${maxHeight}),min(iw,${maxWidth}),-2)':'if(gt(iw/ih,${maxWidth}/${maxHeight}),-2,min(ih,${maxHeight}))'`;
const results = new Map();

for (const fileName of spriteFiles()) {
  const inputPath = path.join(assetDir, fileName);
  if (!existsSync(inputPath)) continue;
  const sourceBytes = statSync(inputPath).size;
  const source = probe(inputPath);
  const outputName = fileName.replace(/\.(png|webp)$/i, ".webp");
  const outputPath = path.join(assetDir, outputName);
  const tempPath = `${outputPath}.tmp`;
  execFileSync("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", inputPath,
    "-vf", scaleFilter,
    "-c:v", "libwebp",
    "-quality", "82",
    "-compression_level", "6",
    "-lossless", "0",
    "-f", "webp",
    tempPath,
  ], {stdio: "inherit"});
  if (fileName !== outputName && existsSync(outputPath)) unlinkSync(outputPath);
  renameSync(tempPath, outputPath);
  if (fileName !== outputName) unlinkSync(inputPath);
  const output = probe(outputPath);
  const bytes = statSync(outputPath).size;
  results.set(fileName, {outputName, sourceBytes, bytes, source, output});
  console.log(`${fileName} -> ${outputName}: ${sourceBytes} -> ${bytes} bytes`);
}

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.optimized = {
    tool: "ffmpeg",
    format: "webp",
    quality: 82,
    maxWidth,
    maxHeight,
  };
  manifest.files = manifest.files.map(entry => {
    const result = results.get(entry.fileName);
    if (!result) return entry;
    return {
      ...entry,
      fileName: result.outputName,
      sourceBytes: result.sourceBytes,
      bytes: result.bytes,
      sourceWidth: result.source.width,
      sourceHeight: result.source.height,
      width: result.output.width,
      height: result.output.height,
    };
  });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
