#!/usr/bin/env node
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";

const BASE_URL = "https://wiki.52poke.com/wiki/";
const DEFAULT_DEVTOOLS_URL = "http://127.0.0.1:9222";
const DEFAULT_OUT_DIR = "work/52poke-move-animations";
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_MAX_ASSETS = 10;
const DEFAULT_MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const MEDIA_EXTENSIONS = new Set(["gif", "webm", "mp4", "apng", "png", "jpg", "jpeg", "webp"]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function usage() {
  console.error("Usage: node tools/fetch_52poke_move_animations.mjs [options] <招式名...>");
  console.error("");
  console.error("Options:");
  console.error("  --file <path>             Read move names, one per line");
  console.error("  --out <dir>               Output directory (default: work/52poke-move-animations)");
  console.error("  --devtools <url>          Chrome DevTools URL (default: http://127.0.0.1:9222)");
  console.error("  --concurrency <n>         Worker tab count (default: 2)");
  console.error("  --max-assets <n>          Max media files per move (default: 10)");
  console.error("  --max-media-bytes <n>     Max bytes per downloaded media file (default: 26214400)");
  console.error("  --resume                  Skip moves with an existing per-move manifest");
}

function parseArgs(argv) {
  const options = {
    outDir: DEFAULT_OUT_DIR,
    devtoolsUrl: DEFAULT_DEVTOOLS_URL,
    concurrency: DEFAULT_CONCURRENCY,
    maxAssets: DEFAULT_MAX_ASSETS,
    maxMediaBytes: DEFAULT_MAX_MEDIA_BYTES,
    resume: false,
    file: "",
    moves: [],
  };

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
    } else if (arg === "--file") {
      options.file = readValue();
    } else if (arg === "--out") {
      options.outDir = readValue();
    } else if (arg === "--devtools") {
      options.devtoolsUrl = readValue().replace(/\/$/, "");
    } else if (arg === "--concurrency") {
      options.concurrency = Number(readValue());
    } else if (arg === "--max-assets") {
      options.maxAssets = Number(readValue());
    } else if (arg === "--max-media-bytes") {
      options.maxMediaBytes = Number(readValue());
    } else if (arg === "--resume") {
      options.resume = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.moves.push(arg);
    }
  }

  return options;
}

function movePageName(moveName) {
  return `${moveName.trim()}（招式）`;
}

function wikiUrlForMove(moveName) {
  return `${BASE_URL}${encodeURIComponent(movePageName(moveName))}#${encodeURIComponent("招式动画")}`;
}

function sanitizeFileName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "move";
}

function extensionFor(url, contentType = "") {
  const cleanPath = new URL(url).pathname;
  const fromUrl = path.extname(cleanPath).replace(".", "").toLowerCase();
  if (MEDIA_EXTENSIONS.has(fromUrl)) return fromUrl;
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "bin";
}

async function devtoolsJson(devtoolsUrl, requestPath, options = {}) {
  const response = await fetch(`${devtoolsUrl}${requestPath}`, options);
  if (!response.ok) throw new Error(`DevTools ${requestPath} HTTP ${response.status}`);
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

  function waitFor(method, timeoutMs = 20000) {
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

  return {
    opened,
    send,
    waitFor,
    close: () => socket.close(),
  };
}

async function createWorkerPage(devtoolsUrl) {
  const target = await devtoolsJson(devtoolsUrl, `/json/new?${encodeURIComponent("about:blank")}`, {method: "PUT"});
  const page = connectPage(target.webSocketDebuggerUrl);
  await page.opened;
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  return {id: target.id, page};
}

async function closeWorkerPage(devtoolsUrl, worker) {
  try {
    worker.page.close();
    await devtoolsJson(devtoolsUrl, `/json/close/${worker.id}`);
  } catch {
    // Best-effort cleanup only.
  }
}

async function evaluate(worker, expression) {
  const result = await worker.page.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function navigateAndExtract(worker, url) {
  const load = worker.page.waitFor("Page.loadEventFired", 25000).catch(() => null);
  await worker.page.send("Page.navigate", {url});
  await load;
  await sleep(700);

  const expression = `(() => {
    const headingText = node => String(node?.innerText || "")
      .replace(/\\[[^\\]]+\\]/g, "")
      .replace(/编辑|編輯|编辑源代码|編輯原始碼/g, "")
      .trim();
    const normalize = text => String(text || "")
      .replace(/\\r/g, "")
      .replace(/[ \\t]+\\n/g, "\\n")
      .replace(/\\n{3,}/g, "\\n\\n")
      .split("\\n")
      .map(line => line.trim())
      .filter(Boolean)
      .join("\\n")
      .trim();
    const bestSrcFromSrcset = srcset => {
      const parts = String(srcset || "").split(",").map(item => item.trim()).filter(Boolean);
      const parsed = parts.map(item => {
        const [url, descriptor = ""] = item.split(/\\s+/);
        const score = Number(descriptor.replace(/[^0-9.]/g, "")) || 0;
        return {url, score};
      }).filter(item => item.url);
      parsed.sort((a, b) => b.score - a.score);
      return parsed[0]?.url || "";
    };
    const absolute = value => {
      try { return new URL(value, location.href).href; } catch { return ""; }
    };
    const mediaExt = url => {
      const path = new URL(url).pathname.toLowerCase();
      const match = path.match(/\\.([a-z0-9]+)$/);
      return match?.[1] || "";
    };
    const wanted = new Set(${JSON.stringify([...MEDIA_EXTENSIONS])});
    const mediaUrlRe = /(?:(?:https?:)?\\/\\/|\\/)[^"'\\s<>)]*\\.(?:gif|webm|mp4|apng|png|jpe?g|webp)(?:\\?[^"'\\s<>)]*)?/ig;
    const headings = Array.from(document.querySelectorAll("h2,h3,h4,h5,h6"));
    const heading = headings.find(node => ["招式动画", "招式動畫"].includes(headingText(node)));
    if (!heading) return {found: false, title: document.title, url: location.href, text: "", candidates: []};
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
    const candidates = [];
    const push = (rawUrl, label, kind) => {
      const url = absolute(rawUrl);
      if (!url) return;
      const ext = mediaExt(url);
      if (!wanted.has(ext)) return;
      candidates.push({url, label: normalize(label).slice(0, 120), kind, ext});
    };
    const pushFromValue = (value, label, kind) => {
      const text = String(value || "");
      for (const match of text.matchAll(mediaUrlRe)) {
        push(match[0], label, kind);
      }
      if (/\\.(gif|webm|mp4|apng|png|jpe?g|webp)(?:\\?|$)/i.test(text)) {
        for (const item of text.split(/[\\s,]+/).map(part => part.trim()).filter(Boolean)) {
          push(item.replace(/^url\\(["']?/, "").replace(/["']?\\)$/, ""), label, kind);
        }
      }
    };
    container.querySelectorAll("img").forEach(img => {
      push(bestSrcFromSrcset(img.getAttribute("srcset")) || img.getAttribute("data-src") || img.getAttribute("src"), img.alt || img.title || "", "img");
    });
    container.querySelectorAll("video,source").forEach(media => {
      push(media.getAttribute("src"), media.title || media.getAttribute("type") || "", media.tagName.toLowerCase());
    });
    container.querySelectorAll("a[href]").forEach(anchor => {
      push(anchor.getAttribute("href"), anchor.innerText || anchor.title || "", "link");
    });
    container.querySelectorAll("*").forEach(element => {
      const label = element.getAttribute("alt") || element.getAttribute("title") || element.textContent || "";
      for (const attribute of Array.from(element.attributes || [])) {
        pushFromValue(attribute.value, label, "attribute");
      }
    });
    const unique = [];
    const seen = new Set();
    for (const item of candidates) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      unique.push(item);
    }
    return {found: true, title: document.title, url: location.href, text: normalize(container.innerText), candidates: unique};
  })()`;

  return evaluate(worker, expression);
}

async function downloadInBrowser(worker, url, maxMediaBytes) {
  const expression = `(async () => {
    const url = ${JSON.stringify(url)};
    const maxMediaBytes = ${Number(maxMediaBytes)};
    const response = await fetch(url, {credentials: "include"});
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxMediaBytes) {
      return {ok: false, status: response.status, url: response.url, contentType: response.headers.get("content-type") || "", bytes: arrayBuffer.byteLength, error: "media-too-large"};
    }
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return {ok: response.ok, status: response.status, url: response.url, contentType: response.headers.get("content-type") || "", bytes: arrayBuffer.byteLength, base64: btoa(binary)};
  })()`;
  return evaluate(worker, expression);
}

async function downloadDirect(url, maxMediaBytes) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 ChangeBattle move-animation-reference-fetcher",
      "referer": "https://wiki.52poke.com/",
    },
  });
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxMediaBytes) {
    return {
      ok: false,
      status: response.status,
      url: response.url,
      contentType: response.headers.get("content-type") || "",
      bytes: arrayBuffer.byteLength,
      error: "media-too-large",
    };
  }
  return {
    ok: response.ok,
    status: response.status,
    url: response.url,
    contentType: response.headers.get("content-type") || "",
    bytes: arrayBuffer.byteLength,
    buffer: Buffer.from(arrayBuffer),
  };
}

async function fetchMoveAnimation(worker, options, moveName) {
  const url = wikiUrlForMove(moveName);
  const moveDir = path.join(options.outDir, sanitizeFileName(moveName));
  const manifestPath = path.join(moveDir, "manifest.json");
  if (options.resume && existsSync(manifestPath)) {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  }
  await mkdir(moveDir, {recursive: true});
  const extracted = await navigateAndExtract(worker, url);

  const downloads = [];
  const candidates = (extracted.candidates || []).slice(0, options.maxAssets);
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      let downloaded;
      try {
        downloaded = await downloadInBrowser(worker, candidate.url, options.maxMediaBytes);
      } catch (error) {
        downloaded = {ok: false, error: error instanceof Error ? error.message : String(error)};
      }
      let buffer = downloaded.base64 ? Buffer.from(downloaded.base64, "base64") : null;
      let method = "browser";
      if (!downloaded.ok || !buffer) {
        downloaded = await downloadDirect(candidate.url, options.maxMediaBytes);
        buffer = downloaded.buffer || null;
        method = "direct";
      }
      if (!downloaded.ok || !buffer) {
        downloads.push({...candidate, ok: false, status: downloaded.status, bytes: downloaded.bytes, error: downloaded.error || `HTTP ${downloaded.status}`});
        continue;
      }
      const ext = extensionFor(downloaded.url || candidate.url, downloaded.contentType);
      const fileName = `${String(index + 1).padStart(2, "0")}-${sanitizeFileName(candidate.label || moveName)}.${ext}`;
      const outputPath = path.join(moveDir, fileName);
      await writeFile(outputPath, buffer);
      downloads.push({
        ...candidate,
        ok: true,
        method,
        status: downloaded.status,
        contentType: downloaded.contentType,
        bytes: downloaded.bytes,
        file: path.relative(options.outDir, outputPath),
      });
    } catch (error) {
      downloads.push({...candidate, ok: false, error: error instanceof Error ? error.message : String(error)});
    }
  }

  const result = {
    move: moveName,
    pageName: movePageName(moveName),
    requestedUrl: url,
    pageUrl: extracted.url || url,
    pageTitle: extracted.title || "",
    found: Boolean(extracted.found),
    text: extracted.text || "",
    candidates: extracted.candidates || [],
    downloads,
    error: extracted.found ? "" : "未找到招式动画章节",
  };
  await writeFile(manifestPath, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

async function mapLimit(items, limit, workerFactory, workerCleanup, workerFn) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
    const worker = await workerFactory();
    try {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await workerFn(items[index], index, worker);
      }
    } finally {
      await workerCleanup(worker);
    }
  });
  await Promise.all(runners);
  return results;
}

function markdownFor(results, options) {
  const lines = [
    "# 52poke move animation references",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Source pattern: \`https://wiki.52poke.com/wiki/\${招式名}（招式）#招式动画\``,
    "",
    "| Move | Found | Downloads | Page | Notes |",
    "| --- | --- | ---: | --- | --- |",
  ];
  for (const result of results) {
    const downloadCount = result.downloads.filter(item => item.ok).length;
    const notes = result.error || `${result.candidates.length} media candidates`;
    lines.push(`| ${result.move} | ${result.found ? "yes" : "no"} | ${downloadCount} | ${result.pageUrl} | ${notes} |`);
  }
  lines.push("", `Output dir: \`${options.outDir}\``);
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.file) {
    const text = await readFile(options.file, "utf8");
    options.moves.push(...text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#")));
  }
  options.moves = [...new Set(options.moves.map(move => move.trim()).filter(Boolean))];
  if (!options.moves.length) {
    usage();
    process.exit(1);
  }
  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) options.concurrency = DEFAULT_CONCURRENCY;

  await mkdir(options.outDir, {recursive: true});
  console.log(`Moves: ${options.moves.length}; concurrency: ${options.concurrency}; out: ${options.outDir}`);
  const results = await mapLimit(
    options.moves,
    options.concurrency,
    () => createWorkerPage(options.devtoolsUrl),
    worker => closeWorkerPage(options.devtoolsUrl, worker),
    async (moveName, index, worker) => {
      try {
        const result = await fetchMoveAnimation(worker, options, moveName);
        const ok = result.downloads.filter(item => item.ok).length;
        console.log(`[${index + 1}/${options.moves.length}] ${moveName}: ${result.error || `${ok}/${result.candidates.length} downloaded`}`);
        return result;
      } catch (error) {
        const result = {
          move: moveName,
          pageName: movePageName(moveName),
          requestedUrl: wikiUrlForMove(moveName),
          pageUrl: wikiUrlForMove(moveName),
          pageTitle: "",
          found: false,
          text: "",
          candidates: [],
          downloads: [],
          error: error instanceof Error ? error.message : String(error),
        };
        console.log(`[${index + 1}/${options.moves.length}] ${moveName}: ${result.error}`);
        return result;
      }
    },
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourcePattern: "https://wiki.52poke.com/wiki/${招式名}（招式）#招式动画",
    moves: results,
  };
  await writeFile(path.join(options.outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(options.outDir, "index.md"), markdownFor(results, options));
  console.log(`Wrote ${path.join(options.outDir, "manifest.json")}`);
}

await main();
