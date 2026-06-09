import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const DEFAULT_SOURCE = "docs/z招式神百源码.html";
const DEFAULT_OUT_DIR = "assets/z-moves";

const Z_MOVE_SPRITE_FILES = [
  "究极无敌大冲撞 Sprite.png",
  "全力无双激烈拳 Sprite.png",
  "极速俯冲轰烈撞 Sprite.png",
  "强酸剧毒灭绝雨 Sprite.png",
  "地隆啸天大终结 Sprite.png",
  "毁天灭地巨岩坠 Sprite.png",
  "绝对捕食回旋斩 Sprite.png",
  "无尽暗夜之诱惑 Sprite.png",
  "超绝螺旋连击 Sprite.png",
  "超强极限爆焰弹 Sprite.png",
  "超级水流大漩涡 Sprite.png",
  "绚烂缤纷花怒放 Sprite.png",
  "终极伏特狂雷闪 Sprite.png",
  "至高精神破坏波 Sprite.png",
  "激狂大地万里冰 Sprite.png",
  "究极巨龙震天地 Sprite.png",
  "黑洞吞噬万物灭 Sprite.png",
  "可爱星星飞天撞 Sprite.png",
  "认真起来大爆击 Sprite.png",
  "驾雷驭电戏冲浪 Sprite.png",
  "皮卡皮卡必杀击 Sprite.png",
  "千万伏特 Sprite.png",
  "九彩升华齐聚顶 Sprite.png",
  "巨人卫士・阿罗拉 Sprite.png",
  "起源超新星大爆炸S Sprite.png",
  "遮天蔽日暗影箭S Sprite.png",
  "极恶飞跃粉碎击 Sprite.png",
  "海神庄严交响乐 Sprite.png",
  "七星夺魂腿 Sprite.png",
  "炽魂热舞烈音爆 Sprite.png",
  "亲密无间大乱揍 Sprite.png",
  "狼啸石牙飓风暴 Sprite.png",
  "日光回旋下苍穹 Sprite.png",
  "月华飞溅落灵霄 Sprite.png",
  "焚天灭世炽光爆 Sprite.png",
];

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalizeUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`;
  return rawUrl;
}

function decodedUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function htmlNameForFile(fileName) {
  return fileName.replace(/\s+/g, "_");
}

function extractUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/\s(?:src|data-loginonly-srcset)="([^"]+)"/g)) {
    const value = match[1];
    if (value.includes(" 1.5x") || value.includes(" 2x")) {
      for (const entry of value.split(",")) {
        const [url] = entry.trim().split(/\s+/);
        urls.push(normalizeUrl(url));
      }
    } else {
      urls.push(normalizeUrl(value));
    }
  }
  return Array.from(new Set(urls.filter(Boolean)));
}

function bestUrlForFile(fileName, urls) {
  const htmlName = htmlNameForFile(fileName);
  const matches = urls
    .map(url => ({url, decoded: decodedUrl(url)}))
    .filter(entry => entry.decoded.includes(htmlName));
  if (!matches.length) return null;
  const original = matches.find(entry => !entry.decoded.includes("/thumb/"));
  if (original) return original.url;
  const largeThumb = matches
    .map(entry => {
      const size = entry.decoded.match(/\/(\d+)px-[^/]+$/)?.[1];
      return {...entry, size: Number(size || 0)};
    })
    .sort((a, b) => b.size - a.size)[0];
  return largeThumb?.url || matches[0].url;
}

async function download(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 ChangeBattle z-move-sprite-fetcher",
      "referer": "https://wiki.52poke.com/",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const sourcePath = argValue("--source", DEFAULT_SOURCE);
  const outDir = argValue("--out", DEFAULT_OUT_DIR);
  const html = await readFile(sourcePath, "utf8");
  const urls = extractUrls(html);
  await mkdir(outDir, {recursive: true});
  const manifest = [];
  for (const fileName of Z_MOVE_SPRITE_FILES) {
    const url = bestUrlForFile(fileName, urls);
    if (!url) {
      manifest.push({fileName, ok: false, error: "url-not-found"});
      console.log(`missing ${fileName}`);
      continue;
    }
    try {
      const bytes = await download(url);
      const filePath = path.join(outDir, fileName);
      await writeFile(filePath, bytes);
      manifest.push({fileName, ok: true, url, bytes: bytes.length});
      console.log(`downloaded ${fileName} (${bytes.length} bytes)`);
    } catch (error) {
      manifest.push({fileName, ok: false, url, error: error instanceof Error ? error.message : String(error)});
      console.log(`failed ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  await writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify({source: sourcePath, files: manifest}, null, 2)}\n`);
  const okCount = manifest.filter(entry => entry.ok).length;
  if (okCount !== Z_MOVE_SPRITE_FILES.length) {
    throw new Error(`Downloaded ${okCount}/${Z_MOVE_SPRITE_FILES.length} Z move sprites`);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
