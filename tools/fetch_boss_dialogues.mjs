#!/usr/bin/env node
import {readFile, writeFile} from "node:fs/promises";

const DOC_PATH = new URL("../docs/boss_dialogues.md", import.meta.url);
const BASE_URL = "https://wiki.52poke.com/wiki/";
const DEVTOOLS_URL = "http://127.0.0.1:9222";
const CONCURRENCY = 3;
const START_MARKER = "<!-- AUTO_FETCHED_DIALOGUE_START -->";
const END_MARKER = "<!-- AUTO_FETCHED_DIALOGUE_END -->";

const pageNameOverrides = new Map([
  ["小茂 / 青绿", "青绿"],
  ["青绿（馆主）", "青绿"],
  ["阿桔（馆主）", "阿桔"],
  ["阿桔（城都四天王）", "阿桔"],
  ["希巴（关都四天王）", "希巴"],
  ["希巴（城都四天王）", "希巴"],
  ["阿渡（关都四天王）", "阿渡"],
  ["阿渡（冠军）", "阿渡"],
  ["米可利（馆主）", "米可利"],
  ["米可利（冠军）", "米可利"],
  ["艾莉丝（馆主）", "艾莉丝"],
  ["艾莉丝（冠军）", "艾莉丝"],
  ["青木（馆主）", "青木"],
  ["青木（四天王）", "青木"],
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripTitleSuffix(title) {
  return title.replace(/[（(].*?[）)]/g, "").trim();
}

function pageNameFor(title) {
  return pageNameOverrides.get(title) || stripTitleSuffix(title);
}

async function devtoolsJson(path, options = {}) {
  const response = await fetch(`${DEVTOOLS_URL}${path}`, options);
  if (!response.ok) throw new Error(`DevTools ${path} HTTP ${response.status}`);
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

  function waitFor(method, timeoutMs = 15000) {
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
    // Best-effort cleanup only.
  }
}

async function navigateAndExtract(worker, url) {
  const load = worker.page.waitFor("Page.loadEventFired", 20000).catch(() => null);
  await worker.page.send("Page.navigate", {url});
  await load;
  await sleep(350);
  const expression = `(() => {
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
    const heading = headings.find(node => ["对话", "對話"].includes(node.innerText.trim()));
    if (!heading) return {found: false, title: document.title, url: location.href, text: ""};
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
    return {found: true, title: document.title, url: location.href, text: normalize(container.innerText)};
  })()`;
  const result = await worker.page.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result?.value || {found: false, title: "", url, text: ""};
}

async function fetchDialogue(worker, title) {
  const pageName = pageNameFor(title);
  const url = `${BASE_URL}${encodeURIComponent(pageName)}#${encodeURIComponent("对话")}`;
  const extracted = await navigateAndExtract(worker, url);
  if (!extracted.found) return {title, pageName, url: extracted.url || url, text: "", error: "未找到对话章节"};
  return {title, pageName, url: extracted.url || url, text: extracted.text, error: extracted.text ? "" : "对话章节为空"};
}

function parseSections(markdown) {
  const matches = [...markdown.matchAll(/^## (.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index;
    const bodyStart = start + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    return {title: match[1].trim(), start, bodyStart, end, block: markdown.slice(start, end)};
  });
}

function hasFetchedBlock(block) {
  return block.includes(START_MARKER) || block.includes(END_MARKER);
}

function hasManualContent(block) {
  const body = block
    .replace(/^## .+$/m, "")
    .replace(/开局：/g, "")
    .replace(/战败后：/g, "")
    .replace(/胜利后：/g, "")
    .replace(START_MARKER, "")
    .replace(END_MARKER, "")
    .trim();
  return body.length > 0;
}

function fetchedBlock(result) {
  const lines = [
    "",
    START_MARKER,
    `来源：${result.url}`,
    "",
  ];
  if (result.error) {
    lines.push(`抓取失败：${result.error}`);
  } else {
    lines.push(result.text);
  }
  lines.push("", END_MARKER, "");
  return lines.join("\n");
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

async function main() {
  const markdown = await readFile(DOC_PATH, "utf8");
  const sections = parseSections(markdown);
  const targets = sections.filter(section => !hasFetchedBlock(section.block) && !hasManualContent(section.block));
  console.log(`Boss sections: ${sections.length}; empty targets: ${targets.length}; concurrency: ${CONCURRENCY}`);
  const results = await mapLimit(targets, CONCURRENCY, async (section, index, worker) => {
    try {
      const result = await fetchDialogue(worker, section.title);
      console.log(`[${index + 1}/${targets.length}] ${section.title}: ${result.error || `${result.text.length} chars`}`);
      return [section.title, result];
    } catch (error) {
      console.log(`[${index + 1}/${targets.length}] ${section.title}: ${error instanceof Error ? error.message : String(error)}`);
      return [section.title, {title: section.title, pageName: pageNameFor(section.title), url: `${BASE_URL}${encodeURIComponent(pageNameFor(section.title))}?variant=zh-cn`, text: "", error: error instanceof Error ? error.message : String(error)}];
    }
  });
  const resultByTitle = new Map(results);
  let output = markdown;
  for (const section of [...sections].reverse()) {
    const result = resultByTitle.get(section.title);
    if (!result) continue;
    output = `${output.slice(0, section.end).replace(/\s*$/, "")}${fetchedBlock(result)}${output.slice(section.end)}`;
  }
  await writeFile(DOC_PATH, output);
  console.log(`Updated ${DOC_PATH.pathname}`);
}

await main();
