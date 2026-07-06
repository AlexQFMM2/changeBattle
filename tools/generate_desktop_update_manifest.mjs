#!/usr/bin/env node
import {createHash} from "node:crypto";
import {cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(rootDir, "release");
const changebattleReleaseDir = path.join(releaseDir, "changebattle");
const args = process.argv.slice(2);
const options = parseArgs(args);
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
const version = options.version || packageJson.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`Version must look like X.Y.Z, got: ${version}`);
}

const zipPath = path.join(releaseDir, `ChangeBattle-V2-Desk-portable-v${version}.zip`);
const sha256 = existsSync(zipPath) ? sha256File(zipPath) : "";
const commit = git(["rev-parse", "--short", "HEAD"]) || "";
const date = formatLocalDate(new Date());
const downloadPageUrl = options.downloadPageUrl || process.env.CHANGEBATTLE_DOWNLOAD_PAGE_URL || "https://65h26i.top/changebattle/";
const downloadPageTemplatePath = options.template || process.env.CHANGEBATTLE_DOWNLOAD_PAGE_TEMPLATE || path.join(rootDir, "tools", "release", "download-page-template.html");
const downloadPageImageDir = process.env.CHANGEBATTLE_DOWNLOAD_PAGE_IMAGE_DIR || path.join(rootDir, "tools", "release", "download-page-images");
const mirrors = options.mirrors.length ? options.mirrors : parseMirrors(process.env.CHANGEBATTLE_RELEASE_MIRRORS || "");
const notes = options.notes.length ? options.notes : parseNotes(process.env.CHANGEBATTLE_RELEASE_NOTES || "");

const manifest = {
  manifestVersion: 1,
  channel: options.channel || process.env.CHANGEBATTLE_RELEASE_CHANNEL || "stable",
  version,
  date,
  title: options.title || `ChangeBattle V2 Desk v${version}`,
  notes: notes.length ? notes : [
    "桌面端有新版本可用。",
    "请打开下载页获取最新 portable 包。",
  ],
  downloadPageUrl,
  mirrors,
  sha256,
  mandatory: options.mandatory,
};

mkdirSync(changebattleReleaseDir, {recursive: true});
writeFileSync(path.join(changebattleReleaseDir, "latest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(path.join(changebattleReleaseDir, "index.html"), renderDownloadPage(manifest, commit), "utf8");
syncDownloadPageImages(downloadPageImageDir, path.join(changebattleReleaseDir, "image"));

console.info(`Generated ${path.relative(rootDir, path.join(changebattleReleaseDir, "latest.json"))}`);
console.info(`Generated ${path.relative(rootDir, path.join(changebattleReleaseDir, "index.html"))}`);
if (!sha256) console.warn(`Release zip not found, sha256 left empty: ${path.relative(rootDir, zipPath)}`);

function parseArgs(argv) {
  const parsed = {
    version: "",
    channel: "",
    title: "",
    downloadPageUrl: "",
    mirrors: [],
    notes: [],
    template: "",
    mandatory: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--") && !parsed.version) {
      parsed.version = arg;
    } else if (arg === "--channel") {
      parsed.channel = argv[++index] || "";
    } else if (arg === "--title") {
      parsed.title = argv[++index] || "";
    } else if (arg === "--download-page-url") {
      parsed.downloadPageUrl = argv[++index] || "";
    } else if (arg === "--mirror") {
      const mirror = parseMirror(argv[++index] || "");
      if (mirror) parsed.mirrors.push(mirror);
    } else if (arg === "--note") {
      const note = argv[++index] || "";
      if (note) parsed.notes.push(note);
    } else if (arg === "--template") {
      parsed.template = argv[++index] || "";
    } else if (arg === "--mandatory") {
      parsed.mandatory = true;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function parseMirrors(raw) {
  return raw.split(/\n|,/).map(parseMirror).filter(Boolean);
}

function parseMirror(raw) {
  const value = raw.trim();
  if (!value) return null;
  const separatorIndex = value.indexOf("=");
  if (separatorIndex <= 0) return {name: "下载镜像", url: value};
  return {
    name: value.slice(0, separatorIndex).trim(),
    url: value.slice(separatorIndex + 1).trim(),
  };
}

function parseNotes(raw) {
  return raw.split(/\n/).map(note => note.trim()).filter(Boolean);
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function git(gitArgs) {
  try {
    return execFileSync("git", gitArgs, {cwd: rootDir, encoding: "utf8"}).trim();
  } catch {
    return "";
  }
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderDownloadPage(manifest, commit) {
  const templated = renderTemplateDownloadPage(manifest, commit);
  if (templated) return templated;

  const mirrorLinks = manifest.mirrors.length
    ? manifest.mirrors.map(mirror => `<li><a href="${escapeHtml(mirror.url)}">${escapeHtml(mirror.name)}</a></li>`).join("\n")
    : "<li>下载镜像待补充；请查看发布帖或联系作者获取最新包。</li>";
  const notes = manifest.notes.map(note => `<li>${escapeHtml(note)}</li>`).join("\n");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(manifest.title)}</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #111814; color: #f4fff7; }
    main { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
    h1 { margin: 0 0 12px; font-size: 28px; }
    section { margin-top: 28px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.14); }
    details { margin-top: 28px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.14); }
    summary { cursor: pointer; color: rgba(244,255,247,.78); font-weight: 800; }
    a { color: #8ee377; font-weight: 800; }
    code { color: #d8ffe0; word-break: break-all; }
    .muted { color: rgba(244,255,247,.72); }
  </style>
</head>
<body>
  <main>
    <p class="muted">ChangeBattle V2 Desktop</p>
    <h1>${escapeHtml(manifest.title)}</h1>
    <p>最新版本：<strong>v${escapeHtml(manifest.version)}</strong></p>
    <section>
      <h2>下载</h2>
      <ul>
        ${mirrorLinks}
      </ul>
    </section>
    <section>
      <h2>更新内容</h2>
      <ul>
        ${notes}
      </ul>
    </section>
    <details>
      <summary>高级校验信息</summary>
      <p>SHA-256：<code>${escapeHtml(manifest.sha256 || "暂无")}</code></p>
      <p>Commit：<code>${escapeHtml(commit || "unknown")}</code></p>
      <p class="muted">生成日期：${escapeHtml(manifest.date)}</p>
    </details>
  </main>
</body>
</html>
`;
}

function renderTemplateDownloadPage(manifest, commit) {
  if (!downloadPageTemplatePath || !existsSync(downloadPageTemplatePath)) return "";
  const manifestJson = JSON.stringify(manifest, null, 6);
  return readFileSync(downloadPageTemplatePath, "utf8")
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(manifest.title)}</title>`)
    .replace(
      /<script type="application\/json" id="latestManifest">[\s\S]*?<\/script>/,
      `<script type="application/json" id="latestManifest">\n${manifestJson}\n  </script>`,
    )
    .replace(/SHA-256：<code id="sha256Text">[\s\S]*?<\/code>/, 'SHA-256：<code id="sha256Text">读取中...</code>')
    .replace(/<p>页面生成：<span id="year"><\/span><\/p>\s*/g, "")
    .replace(/<p>Manifest：<code>latest\.json<\/code><\/p>\s*/g, "")
    .replace(/<strong id="carouselStatus">第 1 \/ \d+ 张<\/strong>/, '<strong id="carouselStatus">第 1 / 8 张</strong>');
}

function syncDownloadPageImages(sourceDir, targetDir) {
  if (!sourceDir || !existsSync(sourceDir)) return;
  rmSync(targetDir, {recursive: true, force: true});
  mkdirSync(path.dirname(targetDir), {recursive: true});
  cpSync(sourceDir, targetDir, {recursive: true});
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
