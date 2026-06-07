#!/usr/bin/env node
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {spawn} from "node:child_process";
import path from "node:path";

const DEFAULT_INPUT_DIR = "work/52poke-move-animations";
const DEFAULT_TILE = "6x4";
const DEFAULT_FPS = 8;
const MEDIA_RE = /\.(gif|webm|mp4|apng|png|jpg|jpeg|webp)$/i;

function usage() {
  console.error("Usage: node tools/observe_move_animations.mjs [options]");
  console.error("");
  console.error("Options:");
  console.error("  --in <dir>        Fetch output directory (default: work/52poke-move-animations)");
  console.error("  --tile <cols>x<rows>  Contact sheet layout (default: 6x4)");
  console.error("  --fps <n>         Sampling fps for contact sheet (default: 8)");
}

function parseArgs(argv) {
  const options = {inputDir: DEFAULT_INPUT_DIR, tile: DEFAULT_TILE, fps: DEFAULT_FPS};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      const value = argv[index + 1];
      if (!value) throw new Error(`Missing value for ${arg}`);
      index += 1;
      return value;
    };
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (arg === "--in") {
      options.inputDir = readValue();
    } else if (arg === "--tile") {
      options.tile = readValue();
    } else if (arg === "--fps") {
      options.fps = Number(readValue());
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ["ignore", "pipe", "pipe"]});
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code}: ${stderr || stdout}`));
    });
  });
}

function tileFrameCount(tile) {
  const match = String(tile).match(/^(\d+)x(\d+)$/);
  if (!match) return 24;
  return Number(match[1]) * Number(match[2]);
}

function safeName(value) {
  return String(value || "media")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "media";
}

async function ffprobe(inputPath) {
  const {stdout} = await run("ffprobe", [
    "-v", "error",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    inputPath,
  ]);
  return JSON.parse(stdout);
}

async function contactSheet(inputPath, outputPath, options) {
  const frameCount = tileFrameCount(options.tile);
  const filter = `fps=${options.fps},scale=160:-1:flags=lanczos,tile=${options.tile}`;
  await run("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-vf", filter,
    "-frames:v", "1",
    "-q:v", "3",
    outputPath,
  ]);
  return {filter, frameCount};
}

function summarizeProbe(probe) {
  const video = (probe.streams || []).find(stream => stream.codec_type === "video") || {};
  return {
    format: probe.format?.format_name || "",
    duration: Number(probe.format?.duration || video.duration || 0) || null,
    size: Number(probe.format?.size || 0) || null,
    width: video.width || null,
    height: video.height || null,
    frames: video.nb_frames ? Number(video.nb_frames) : null,
    codec: video.codec_name || "",
    avgFrameRate: video.avg_frame_rate || "",
  };
}

async function readFetchManifest(inputDir) {
  const manifestPath = path.join(inputDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const items = [];
  for (const move of manifest.moves || []) {
    for (const download of move.downloads || []) {
      if (!download.ok || !download.file || !MEDIA_RE.test(download.file)) continue;
      items.push({move: move.move, pageUrl: move.pageUrl, sourceUrl: download.url, file: download.file});
    }
  }
  return items;
}

function markdownFor(records, options) {
  const lines = [
    "# Move animation ffmpeg observations",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Input dir: \`${options.inputDir}\``,
    "",
    "| Move | Media | Size | Duration | Contact sheet | Source |",
    "| --- | --- | --- | ---: | --- | --- |",
  ];
  for (const record of records) {
    const size = record.probe?.width && record.probe?.height ? `${record.probe.width}x${record.probe.height}` : "";
    const duration = record.probe?.duration ? record.probe.duration.toFixed(2) : "";
    lines.push(`| ${record.move} | ${record.file} | ${size} | ${duration} | ${record.contactSheet || ""} | ${record.sourceUrl || ""} |`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const items = await readFetchManifest(options.inputDir);
  const records = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const inputPath = path.join(options.inputDir, item.file);
    const moveDir = path.dirname(inputPath);
    const outputDir = path.join(moveDir, "observations");
    await mkdir(outputDir, {recursive: true});
    const base = safeName(path.basename(item.file, path.extname(item.file)));
    const sheetPath = path.join(outputDir, `${base}-sheet.jpg`);
    try {
      const probe = summarizeProbe(await ffprobe(inputPath));
      const sheet = await contactSheet(inputPath, sheetPath, options);
      const record = {
        ...item,
        probe,
        contactSheet: path.relative(options.inputDir, sheetPath),
        filter: sheet.filter,
      };
      records.push(record);
      console.log(`[${index + 1}/${items.length}] ${item.move}: ${record.contactSheet}`);
    } catch (error) {
      const record = {...item, error: error instanceof Error ? error.message : String(error)};
      records.push(record);
      console.log(`[${index + 1}/${items.length}] ${item.move}: ${record.error}`);
    }
  }

  await writeFile(path.join(options.inputDir, "observation.json"), `${JSON.stringify({generatedAt: new Date().toISOString(), records}, null, 2)}\n`);
  await writeFile(path.join(options.inputDir, "observation.md"), markdownFor(records, options));
  console.log(`Wrote ${path.join(options.inputDir, "observation.md")}`);
}

await main();
