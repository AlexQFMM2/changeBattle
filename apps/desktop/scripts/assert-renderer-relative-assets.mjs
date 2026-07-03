import fs from "node:fs";
import path from "node:path";

const rendererRoot = path.resolve(process.cwd(), "out/renderer");
const assetRoots = [
  "aboutIcon",
  "battle",
  "battle-backgrounds",
  "board",
  "music",
  "npc",
  "runtime",
  "shop",
  "showdown",
  "specIcon",
  "title",
  "training",
  "training-ground",
  "ui",
];
const extensions = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "mp4",
  "webm",
  "ogg",
  "mp3",
  "csv",
  "json",
];

const rootPattern = assetRoots.join("|");
const extPattern = extensions.join("|");
const forbiddenPatterns = [
  new RegExp(String.raw`(?:["'\`(=]\s*)/(?:${rootPattern})/[^"'\`)\s]*\.(?:${extPattern})(?:[?#][^"'\`)\s]*)?`, "g"),
  new RegExp(String.raw`url\(\s*["']?/(?:${rootPattern})/[^"'\`)\s]*\.(?:${extPattern})(?:[?#][^"'\`)\s]*)?`, "g"),
  /file:\/\/\/[A-Za-z]:\//g,
];

const scanned = [];
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(?:html|js|css)$/i.test(entry.name)) continue;
    scanned.push(fullPath);
    const text = fs.readFileSync(fullPath, "utf8");
    for (const pattern of forbiddenPatterns) {
      for (const match of text.matchAll(pattern)) {
        failures.push({
          file: path.relative(process.cwd(), fullPath),
          value: match[0].slice(0, 220),
        });
      }
    }
  }
}

if (!fs.existsSync(rendererRoot)) {
  throw new Error(`Renderer output not found: ${rendererRoot}`);
}

walk(rendererRoot);

if (failures.length) {
  console.error("[assert-renderer-relative-assets] found absolute renderer asset paths:");
  for (const failure of failures.slice(0, 80)) {
    console.error(`- ${failure.file}: ${failure.value}`);
  }
  if (failures.length > 80) console.error(`... ${failures.length - 80} more`);
  process.exit(1);
}

console.info(`[assert-renderer-relative-assets] ok (${scanned.length} files scanned)`);
