#!/usr/bin/env node
import {createHash} from "node:crypto";
import {cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(rootDir, "release");
const changebattleReleaseDir = path.join(releaseDir, "changebattle");
const allowedPrefixes = ["apps/", "resources/"];
const allowedRootFiles = new Set(["package.json"]);
const generatedLocalManifestName = "update-manifest.json";
const manifestVersion = 2;

const options = parseArgs(process.argv.slice(2));
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
const version = options.version || packageJson.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`Version must look like X.Y.Z, got: ${version}`);
}

const portableRoot = path.resolve(options.portableRoot || path.join(releaseDir, `ChangeBattle-V2-Desk-portable-v${version}`));
if (!existsSync(portableRoot)) {
  fail(`Portable staging directory does not exist: ${portableRoot}`);
}

const previousManifest = readPreviousManifest(options.previousManifest);
const previousShas = new Set((previousManifest?.files || []).map(file => file.sha256).filter(Boolean));
const manifestDir = path.join(changebattleReleaseDir, "manifests");
const objectsDir = path.join(changebattleReleaseDir, "objects");
mkdirSync(manifestDir, {recursive: true});
rmSync(objectsDir, {recursive: true, force: true});
mkdirSync(objectsDir, {recursive: true});

const seenShas = new Set();
let stagedObjectCount = 0;
let stagedObjectBytes = 0;

const files = listFiles(portableRoot)
  .map(filePath => toPortableRelativePath(portableRoot, filePath))
  .filter(isIncrementalManagedPath)
  .sort()
  .map(relativePath => {
    const source = path.join(portableRoot, relativePath);
    const sha256 = sha256File(source);
    const size = statSync(source).size;
    if (!previousShas.has(sha256) && !seenShas.has(sha256)) {
      const target = path.join(objectsDir, sha256.slice(0, 2), sha256);
      mkdirSync(path.dirname(target), {recursive: true});
      cpSync(source, target);
      stagedObjectCount += 1;
      stagedObjectBytes += size;
    }
    seenShas.add(sha256);
    return {
      path: relativePath,
      sha256,
      size,
    };
  });

const manifest = {
  manifestVersion,
  version,
  files,
};

const summary = {
  manifestVersion,
  version,
  previousManifestFound: Boolean(previousManifest),
  requiresFullObjectUpload: !previousManifest,
  totalFiles: files.length,
  totalUniqueObjects: seenShas.size,
  stagedObjectCount,
  stagedObjectBytes,
};

writeFileSync(path.join(manifestDir, `v${version}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(path.join(manifestDir, "current.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(path.join(portableRoot, generatedLocalManifestName), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(path.join(changebattleReleaseDir, "object-update-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.info(`Generated ${path.relative(rootDir, path.join(manifestDir, `v${version}.json`))}`);
console.info(`Generated ${path.relative(rootDir, path.join(manifestDir, "current.json"))}`);
console.info(`Generated ${path.relative(rootDir, path.join(portableRoot, generatedLocalManifestName))}`);
console.info(`Staged ${stagedObjectCount}/${seenShas.size} objects (${stagedObjectBytes} bytes) in ${path.relative(rootDir, objectsDir)}`);
if (!previousManifest) {
  console.warn("Previous manifest was not supplied or invalid; object staging contains every unique managed file.");
}

function parseArgs(argv) {
  const parsed = {
    version: "",
    portableRoot: "",
    previousManifest: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--") && !parsed.version) {
      parsed.version = arg;
    } else if (arg === "--portable-root") {
      parsed.portableRoot = argv[++index] || "";
    } else if (arg === "--previous-manifest") {
      parsed.previousManifest = argv[++index] || "";
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function readPreviousManifest(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.files)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function listFiles(root) {
  const files = [];
  const entries = readdirSync(root, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function toPortableRelativePath(root, filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function isIncrementalManagedPath(relativePath) {
  if (!validateManagedPath(relativePath)) return false;
  if (relativePath === generatedLocalManifestName) return false;
  if (allowedRootFiles.has(relativePath)) return true;
  return allowedPrefixes.some(prefix => relativePath.startsWith(prefix));
}

function validateManagedPath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || /^[A-Za-z]:/.test(relativePath)) return false;
  const normalized = relativePath.trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (normalized !== relativePath) return false;
  return !normalized.split("/").some(part => !part || part === "..");
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
