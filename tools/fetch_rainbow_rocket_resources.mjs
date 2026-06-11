#!/usr/bin/env node
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORK_DIR = path.join(ROOT, "work", "rainbow_rocket");
const ASSET_DIR = path.join(WORK_DIR, "assets");
const OUT_PATH = path.join(WORK_DIR, "resources.json");
const REVIEW_PATH = path.join(WORK_DIR, "review.md");
const BASE_URL = "https://wiki.52poke.com/wiki/";
const DEVTOOLS_URL = process.env.CHROME_DEVTOOLS_URL || "http://127.0.0.1:9222";
const CONCURRENCY = 3;

const SECTION_DEFS = [
  {id: "pokemon", label: "宝可梦", headings: ["宝可梦", "寶可夢"]},
  {id: "dialogue", label: "对话", headings: ["对话", "對話"]},
  {id: "portrait", label: "画像", headings: ["画像", "畫像"]},
];

const ROSTER = [
  {name: "坂木", name_en: "Giovanni", organization: "火箭队", page: "坂木", has_local_front: true, has_local_avatar: true},
  {name: "赤焰松", name_en: "Maxie", organization: "熔岩队", page: "赤焰松"},
  {name: "水梧桐", name_en: "Archie", organization: "海洋队", page: "水梧桐"},
  {name: "赤日", name_en: "Cyrus", organization: "银河队", page: "赤日"},
  {name: "魁奇思", name_en: "Ghetsis", organization: "等离子队", page: "魁奇思"},
  {name: "弗拉达利", name_en: "Lysandre", organization: "闪焰队", page: "弗拉达利"},
  {name: "露莎米奈", name_en: "Lusamine", organization: "以太基金会", page: "露莎米奈"},
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slug(value) {
  return String(value || "asset")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "asset";
}

function shortHash(value) {
  return crypto.createHash("sha1").update(String(value || "")).digest("hex").slice(0, 10);
}

function extFromUrl(url, mime = "") {
  if (/webp/i.test(mime)) return ".webp";
  if (/png/i.test(mime)) return ".png";
  if (/gif/i.test(mime)) return ".gif";
  if (/jpe?g/i.test(mime)) return ".jpg";
  const clean = String(url || "").split("?")[0];
  const ext = path.extname(clean).toLowerCase();
  if (/^\.(png|jpg|jpeg|gif|webp)$/.test(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  return ".png";
}

async function readExisting() {
  if (!existsSync(OUT_PATH)) return {generated_at: "", roster: ROSTER, entries: {}};
  try {
    return JSON.parse(await readFile(OUT_PATH, "utf8"));
  } catch {
    return {generated_at: "", roster: ROSTER, entries: {}};
  }
}

async function devtoolsJson(pathname, options = {}) {
  const response = await fetch(`${DEVTOOLS_URL}${pathname}`, options);
  if (!response.ok) throw new Error(`DevTools ${pathname} HTTP ${response.status}`);
  return response.json();
}

function connectPage(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const waiters = new Map();

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, {once: true});
    socket.addEventListener("error", reject, {once: true});
  });

  socket.addEventListener("message", event => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const {resolve, reject} = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    const queue = waiters.get(message.method);
    if (queue?.length) queue.shift()(message.params || {});
  });

  function send(method, params = {}) {
    const id = nextId;
    nextId += 1;
    const promise = new Promise((resolve, reject) => pending.set(id, {resolve, reject}));
    socket.send(JSON.stringify({id, method, params}));
    return promise;
  }

  function waitFor(method, timeoutMs = 25000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const queue = waiters.get(method) || [];
      queue.push(params => {
        clearTimeout(timer);
        resolve(params);
      });
      waiters.set(method, queue);
    });
  }

  return {opened, send, waitFor, close: () => socket.close()};
}

async function createWorkerPage() {
  const target = await devtoolsJson(`/json/new?${encodeURIComponent("about:blank")}`, {method: "PUT"});
  const page = connectPage(target.webSocketDebuggerUrl);
  await page.opened;
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  return {id: target.id, page};
}

async function closeWorkerPage(worker) {
  try {
    worker.page.close();
    await devtoolsJson(`/json/close/${worker.id}`);
  } catch {
    // Best-effort cleanup.
  }
}

async function navigate(worker, url) {
  const load = worker.page.waitFor("Page.loadEventFired", 25000).catch(() => null);
  await worker.page.send("Page.navigate", {url});
  await load;
  await sleep(600);
}

async function extractSection(worker, url, section) {
  await navigate(worker, url);
  const expression = `(() => {
    const targetHeadings = ${JSON.stringify(section.headings)};
    const normalize = text => String(text || "")
      .replace(/\\r/g, "")
      .replace(/[ \\t]+\\n/g, "\\n")
      .replace(/\\n{3,}/g, "\\n\\n")
      .split("\\n")
      .map(line => line.trim())
      .filter(line => line && !["编辑", "编辑源代码"].includes(line))
      .join("\\n")
      .trim();
    const headings = Array.from(document.querySelectorAll("h2,h3,h4,h5,h6"));
    const heading = headings.find(node => targetHeadings.includes(node.innerText.trim().replace(/\\[.*?\\]/g, "")));
    if (!heading) return {found: false, title: document.title, url: location.href, text: "", images: []};
    const level = Number(heading.tagName.slice(1));
    const nodes = [];
    let node = heading.nextElementSibling;
    while (node) {
      if (/^H[2-6]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= level) break;
      nodes.push(node.cloneNode(true));
      node = node.nextElementSibling;
    }
    const container = document.createElement("div");
    for (const child of nodes) {
      child.querySelectorAll("script,style,.mw-editsection,.navbox,.metadata,.noprint").forEach(item => item.remove());
      container.appendChild(child);
    }
    const images = Array.from(container.querySelectorAll("img"))
      .map(img => {
        const src = img.currentSrc || img.src || img.getAttribute("data-src") || "";
        const href = img.closest("a")?.href || "";
        const title = img.getAttribute("alt") || img.getAttribute("title") || img.closest("a")?.getAttribute("title") || "";
        return {
          title,
          src: src ? new URL(src, location.href).href : "",
          href: href ? new URL(href, location.href).href : "",
          width: Number(img.naturalWidth || img.width || 0),
          height: Number(img.naturalHeight || img.height || 0),
        };
      })
      .filter(image => image.src && !/Wikilogo|assets\\/wiki-wordmark|\\.svg/i.test(image.src));
    return {found: true, title: document.title, url: location.href, text: normalize(container.innerText), images};
  })()`;
  const result = await worker.page.send("Runtime.evaluate", {expression, returnByValue: true, awaitPromise: true});
  return result.result?.value || {found: false, title: "", url, text: "", images: []};
}

async function downloadImage(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 ChangeBattleResourceBot/1.0",
      "referer": "https://wiki.52poke.com/",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return {
    mime: response.headers.get("content-type") || "",
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

function imageScore(image, preferVs) {
  const rawText = `${image.title || ""} ${image.src || ""} ${image.href || ""}`;
  let text = rawText;
  try {
    text = decodeURIComponent(rawText);
  } catch {
    text = rawText;
  }
  let score = 0;
  if (/设计|設計|主题|主題|表情|周年|彩虹火箭队_USUM|彩虹火箭隊_USUM|熔岩队_海洋队|熔岩隊_海洋隊|3DS/i.test(text)) score -= preferVs ? 15 : 160;
  if (/VS|Challenge|Masters|對戰|对战|头像|Icon/i.test(text)) score += preferVs ? 80 : -25;
  if (/Sprite|Spr_|HGSS|B2W2|Platinum|像素|正面/i.test(text)) score += preferVs ? -10 : 50;
  if (/\.gif/i.test(text)) score += preferVs ? -5 : 20;
  if (!preferVs && Number(image.height || 0) >= 160 && Number(image.width || 0) <= 180) score += 70;
  if (preferVs && Number(image.width || 0) >= 90 && Number(image.height || 0) <= 120) score += 45;
  score += Math.min(40, Number(image.width || 0) / 8);
  score += Math.min(40, Number(image.height || 0) / 8);
  return score;
}

function pickImage(images, preferVs) {
  return [...images]
    .filter(image => {
      if (!image.src) return false;
      const rawText = `${image.src} ${image.title}`;
      let text = rawText;
      try {
        text = decodeURIComponent(rawText);
      } catch {
        text = rawText;
      }
      if (/sprite-icon|smallimg|Bag_|Type_|Wikilogo/i.test(rawText)) return false;
      if (!preferVs && /设计|設計|主题|主題|表情|周年|彩虹火箭队_USUM|彩虹火箭隊_USUM|熔岩队_海洋队|熔岩隊_海洋隊|3DS/i.test(text)) return false;
      return true;
    })
    .sort((a, b) => imageScore(b, preferVs) - imageScore(a, preferVs))[0];
}

function downloadedAssetStillValid(asset) {
  if (!asset?.source_url) return true;
  const expectedExt = extFromUrl(asset.source_url, asset.mime || "");
  if (asset.file && expectedExt && path.extname(asset.file).toLowerCase() !== expectedExt) return false;
  let text = asset.source_url;
  try {
    text = decodeURIComponent(asset.source_url);
  } catch {
    text = asset.source_url;
  }
  if (asset.kind === "front" && /设计|設計|主题|主題|表情|周年|彩虹火箭队_USUM|彩虹火箭隊_USUM|熔岩队_海洋队|熔岩隊_海洋隊|3DS/i.test(text)) return false;
  return true;
}

async function downloadCandidate(worker, trainer, candidate, kind) {
  if (!candidate?.src) return null;
  await mkdir(ASSET_DIR, {recursive: true});
  const payload = await downloadImage(candidate.src);
  if (!payload?.buffer?.length) return null;
  const ext = extFromUrl(candidate.src, payload.mime);
  const fileName = `${slug(trainer.name_en || trainer.name)}-${kind}-${shortHash(candidate.src)}${ext}`;
  const filePath = path.join(ASSET_DIR, fileName);
  await writeFile(filePath, payload.buffer);
  return {
    kind,
    file: path.relative(WORK_DIR, filePath).replaceAll(path.sep, "/"),
    source_url: candidate.src,
    title: candidate.title || "",
    width: candidate.width || 0,
    height: candidate.height || 0,
    mime: payload.mime || "",
  };
}

async function fetchTrainer(worker, trainer, previous) {
  const entry = {
    ...(previous || {}),
    name: trainer.name,
    name_en: trainer.name_en,
    organization: trainer.organization,
    page: trainer.page,
    sections: previous?.sections || {},
    downloaded_assets: (previous?.downloaded_assets || []).filter(downloadedAssetStillValid),
    errors: [],
  };
  for (const section of SECTION_DEFS) {
    if (entry.sections?.[section.id]?.found) continue;
    const url = `${BASE_URL}${encodeURIComponent(trainer.page)}#${encodeURIComponent(section.label)}`;
    try {
      const extracted = await extractSection(worker, url, section);
      entry.sections[section.id] = {
        source_url: extracted.url || url,
        found: Boolean(extracted.found),
        title: extracted.title || "",
        text: extracted.text || "",
        images: extracted.images || [],
        error: extracted.found ? "" : `未找到${section.label}章节`,
      };
    } catch (error) {
      entry.sections[section.id] = {
        source_url: url,
        found: false,
        title: "",
        text: "",
        images: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const downloadedKinds = new Set((entry.downloaded_assets || []).map(asset => asset.kind));
  const portraitImages = entry.sections?.portrait?.images || [];
  const pokemonImages = entry.sections?.pokemon?.images || [];
  const imagePool = portraitImages.length ? portraitImages : [...pokemonImages, ...(entry.sections?.dialogue?.images || [])];
  const avatarPool = [...portraitImages, ...pokemonImages];
  const downloads = [];
  if (!trainer.has_local_front && !downloadedKinds.has("front")) {
    const picked = pickImage(imagePool, false);
    if (picked) downloads.push(["front", picked]);
  }
  if (!trainer.has_local_avatar && !downloadedKinds.has("avatar")) {
    const picked = pickImage(avatarPool, true) || pickImage(imagePool, false);
    if (picked) downloads.push(["avatar", picked]);
  }
  for (const [kind, picked] of downloads) {
    try {
      const downloaded = await downloadCandidate(worker, trainer, picked, kind);
      if (downloaded) entry.downloaded_assets.push(downloaded);
    } catch (error) {
      entry.errors.push(`${kind} 下载失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }
  entry.fetched_at = new Date().toISOString();
  return entry;
}

async function mapLimit(items, limit, workerFn) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
    const worker = await createWorkerPage();
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await workerFn(items[index], index, worker);
    }
    await closeWorkerPage(worker);
  });
  await Promise.all(runners);
  return results;
}

function reviewMarkdown(resources) {
  const lines = [
    "# 彩虹火箭队资源抓取审核",
    "",
    `生成时间：${resources.generated_at}`,
    "",
  ];
  for (const trainer of ROSTER) {
    const entry = resources.entries?.[trainer.name] || {};
    lines.push(`## ${trainer.name} / ${trainer.name_en}`);
    lines.push("");
    for (const section of SECTION_DEFS) {
      const data = entry.sections?.[section.id];
      lines.push(`- ${section.label}：${data?.found ? "ok" : `缺失${data?.error ? ` (${data.error})` : ""}`}`);
      if (data?.source_url) lines.push(`  - 来源：${data.source_url}`);
      if (data?.images?.length) lines.push(`  - 图片候选：${data.images.length}`);
    }
    for (const asset of entry.downloaded_assets || []) {
      lines.push(`- 下载 ${asset.kind}：${asset.file} (${asset.title || asset.source_url})`);
    }
    for (const error of entry.errors || []) lines.push(`- 错误：${error}`);
    const dialogue = entry.sections?.dialogue?.text || "";
    if (dialogue) {
      lines.push("", "```text", dialogue.slice(0, 900), dialogue.length > 900 ? "..." : "", "```");
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(WORK_DIR, {recursive: true});
  const resources = await readExisting();
  resources.roster = ROSTER;
  resources.entries ||= {};
  const targets = ROSTER;
  console.log(`Rainbow Rocket targets: ${targets.length}; concurrency: ${CONCURRENCY}`);
  const results = await mapLimit(targets, CONCURRENCY, async (trainer, index, worker) => {
    try {
      const entry = await fetchTrainer(worker, trainer, resources.entries[trainer.name]);
      const ok = SECTION_DEFS.filter(section => entry.sections?.[section.id]?.found).length;
      console.log(`[${index + 1}/${targets.length}] ${trainer.name}: ${ok}/${SECTION_DEFS.length} sections; assets ${entry.downloaded_assets?.length || 0}`);
      return [trainer.name, entry];
    } catch (error) {
      console.log(`[${index + 1}/${targets.length}] ${trainer.name}: ${error instanceof Error ? error.message : String(error)}`);
      return [trainer.name, {
        ...(resources.entries[trainer.name] || {}),
        name: trainer.name,
        name_en: trainer.name_en,
        organization: trainer.organization,
        page: trainer.page,
        sections: resources.entries[trainer.name]?.sections || {},
        downloaded_assets: resources.entries[trainer.name]?.downloaded_assets || [],
        errors: [error instanceof Error ? error.message : String(error)],
      }];
    }
  });
  for (const [name, entry] of results) resources.entries[name] = entry;
  resources.generated_at = new Date().toISOString();
  await writeFile(OUT_PATH, JSON.stringify(resources, null, 2) + "\n", "utf8");
  await writeFile(REVIEW_PATH, reviewMarkdown(resources), "utf8");
  console.log(`Wrote ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, REVIEW_PATH)}`);
}

await main();
