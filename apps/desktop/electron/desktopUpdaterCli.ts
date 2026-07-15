import {createHash} from "node:crypto";
import {promises as fs} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import type {DesktopUpdateStatusV4} from "@changebattle-v2/api";
import {
  CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
  changeBattleDesktopUpdateIsNewerV4,
  changeBattleDesktopUpdateManifestUrlsV4,
  changeBattleDesktopUpdateOfficialSiteUrlV4,
  compareDesktopUpdateFileManifestsV4,
  desktopUpdateObjectUrlForFileV4,
  isDesktopUpdateIncrementalManagedPathV4,
  normalizeChangeBattleDesktopVersionV4,
  parseChangeBattleDesktopUpdateManifestV4,
  parseDesktopUpdateFileManifestV4,
  validateDesktopUpdateManagedPathV4,
  type ChangeBattleDesktopUpdateManifestV4,
  type DesktopUpdateFileDiffV4,
  type DesktopUpdateFileManifestV4,
  type DesktopUpdateManagedFileV4,
} from "@changebattle-v2/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fetchTimeoutMs = Number(process.env.CHANGEBATTLE_UPDATE_FETCH_TIMEOUT_MS || 10_000);
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check-only");
const verbose = args.has("--verbose") || process.env.CHANGEBATTLE_UPDATE_VERBOSE === "1";

let lastStatus: DesktopUpdateStatusV4 | null = null;

runDesktopUpdaterCli()
  .then(status => {
    process.exit(status.phase === "failed" || status.phase === "cancelled" ? 1 : 0);
  })
  .catch(error => {
    const reason = error instanceof Error ? error.message : String(error);
    emitStatus({
      phase: "failed",
      currentVersion: desktopAppVersion(),
      officialSiteUrl: lastStatus?.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
      reason,
    });
    process.exit(1);
  });

async function runDesktopUpdaterCli(): Promise<DesktopUpdateStatusV4> {
  const currentVersion = desktopAppVersion();
  const officialSiteUrl = CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4;
  emitStatus({phase: "checking", currentVersion, officialSiteUrl});

  if (desktopUpdateDisabledForRuntime()) {
    log("portable update disabled");
    emitStatus({phase: "idle", currentVersion, officialSiteUrl});
    return lastStatus!;
  }

  const manifestUrls = changeBattleDesktopUpdateManifestUrlsV4(process.env.CHANGEBATTLE_UPDATE_MANIFEST_URLS);
  log(`manifest urls: ${manifestUrls.join(", ")}`);
  const manifestResult = await fetchFirstUpdateManifest(manifestUrls);
  if (!manifestResult) {
    emitStatus({
      phase: "failed",
      currentVersion,
      officialSiteUrl,
      reason: "没有可用的更新清单。",
    });
    return lastStatus!;
  }

  const {manifest, manifestUrl} = manifestResult;
  log(`latest manifest ok: ${manifestUrl} version=${manifest.version}`);
  const remoteOfficialSiteUrl = changeBattleDesktopUpdateOfficialSiteUrlV4(manifest);
  const updateAvailable = Boolean(manifest.objectBaseUrl) || manifest.manifestVersion >= 2 || changeBattleDesktopUpdateIsNewerV4(currentVersion, manifest.version);
  if (!manifest.objectBaseUrl && manifest.manifestVersion < 2 && !updateAvailable) {
    emitStatus({
      phase: "up-to-date",
      currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl: remoteOfficialSiteUrl,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    return lastStatus!;
  }

  const incrementalBaseUrl = manifest.objectBaseUrl || manifest.incrementalBaseUrl;
  if (manifest.requiresFullPackage || !manifest.fileManifestUrl || !incrementalBaseUrl) {
    emitStatus({
      phase: "full-package-required",
      currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl: remoteOfficialSiteUrl,
      reason: manifest.requiresFullPackageReason || "该版本需要下载完整包。",
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    return lastStatus!;
  }

  const portableRoot = desktopPortableRoot();
  log(`portable root: ${portableRoot}`);
  log(`fetch file manifest: ${manifest.fileManifestUrl}`);
  const remoteManifest = await fetchDesktopFileManifest(manifest.fileManifestUrl);
  if (remoteManifest.version !== manifest.version) {
    throw new Error(`远端文件清单版本不匹配：latest=${manifest.version}, files=${remoteManifest.version}`);
  }

  const protectedRemoteFiles = remoteManifest.files.filter(file => !isDesktopUpdateIncrementalManagedPathV4(file.path));
  if (protectedRemoteFiles.length) {
    emitStatus({
      phase: "full-package-required",
      currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl: remoteOfficialSiteUrl,
      reason: `该版本包含启动链路文件变更，需要下载完整包：${protectedRemoteFiles.map(file => file.path).join(", ")}`,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    return lastStatus!;
  }

  log("read local update-manifest.json");
  const localManifest = await readDesktopLocalFileManifest(portableRoot);
  log("scan local managed files and calculate sha256");
  const actualLocalManifest = await buildDesktopActualLocalFileManifest(portableRoot, localManifest, remoteManifest);
  const diff = compareDesktopUpdateFileManifestsV4(actualLocalManifest, remoteManifest);
  log(`diff: changed=${diff.changedFiles.length}, deleted=${diff.deletedFiles.length}, bytes=${diff.totalSize}`);

  if (!diff.changedFiles.length && !diff.deletedFiles.length) {
    emitStatus({
      phase: "up-to-date",
      currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl: remoteOfficialSiteUrl,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    return lastStatus!;
  }

  emitStatus({
    phase: "available",
    currentVersion,
    remoteVersion: manifest.version,
    officialSiteUrl: remoteOfficialSiteUrl,
    notes: manifest.notes,
    incrementalSize: diff.totalSize,
    fullPackageSize: manifest.fullPackage?.size,
  });
  if (checkOnly) return lastStatus!;

  const objectStoreUpdate = Boolean(manifest.objectBaseUrl);
  const stagingRoot = path.join(portableRoot, ".update-staging", `v${remoteManifest.version}`);
  const backupRoot = path.join(portableRoot, ".update-backup", `v${remoteManifest.version}`);
  await downloadDesktopIncrementalFiles({
    files: diff.changedFiles,
    baseUrl: incrementalBaseUrl,
    objectStore: objectStoreUpdate,
    stagingRoot,
    statusBase: {
      currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl: remoteOfficialSiteUrl,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    },
  });
  emitStatus({
    phase: "verifying",
    currentVersion,
    remoteVersion: manifest.version,
    officialSiteUrl: remoteOfficialSiteUrl,
    totalSize: diff.totalSize,
    notes: manifest.notes,
    fullPackageSize: manifest.fullPackage?.size,
  });
  log("verify staged files");
  await verifyDesktopStagedFiles(stagingRoot, diff.changedFiles);

  emitStatus({
    phase: "replacing",
    currentVersion,
    remoteVersion: manifest.version,
    officialSiteUrl: remoteOfficialSiteUrl,
    totalSize: diff.totalSize,
    notes: manifest.notes,
    fullPackageSize: manifest.fullPackage?.size,
  });
  log("replace managed files");
  await replaceDesktopManagedFiles({portableRoot, stagingRoot, backupRoot, diff});
  await writeDesktopLocalFileManifest(portableRoot, remoteManifest);
  await fs.rm(stagingRoot, {recursive: true, force: true});

  emitStatus({
    phase: "complete",
    currentVersion,
    remoteVersion: manifest.version,
    officialSiteUrl: remoteOfficialSiteUrl,
    totalSize: diff.totalSize,
    notes: manifest.notes,
    fullPackageSize: manifest.fullPackage?.size,
  });
  return lastStatus!;
}

async function fetchFirstUpdateManifest(urls: string[]): Promise<{manifestUrl: string; manifest: ChangeBattleDesktopUpdateManifestV4} | null> {
  let lastReason = "";
  for (const manifestUrl of urls) {
    try {
      log(`fetch latest.json: ${manifestUrl}`);
      const json = await fetchUpdateJson(manifestUrl);
      const manifest = parseChangeBattleDesktopUpdateManifestV4(json);
      if (!manifest) {
        lastReason = `更新清单格式无效：${manifestUrl}`;
        log(lastReason);
        continue;
      }
      return {manifestUrl, manifest};
    } catch (error) {
      lastReason = `${manifestUrl}: ${error instanceof Error ? error.message : String(error)}`;
      log(lastReason);
    }
  }
  if (lastReason) throw new Error(lastReason);
  return null;
}

async function fetchUpdateJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: {"Accept": "application/json"},
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDesktopFileManifest(fileManifestUrl: string): Promise<DesktopUpdateFileManifestV4> {
  const json = await fetchUpdateJson(fileManifestUrl);
  const manifest = parseDesktopUpdateFileManifestV4(json);
  if (!manifest) throw new Error("远端文件清单格式无效。");
  return manifest;
}

async function readDesktopLocalFileManifest(portableRoot: string): Promise<DesktopUpdateFileManifestV4 | null> {
  try {
    const text = await fs.readFile(path.join(portableRoot, "update-manifest.json"), "utf8");
    return parseDesktopUpdateFileManifestV4(JSON.parse(text));
  } catch {
    return null;
  }
}

async function writeDesktopLocalFileManifest(portableRoot: string, manifest: DesktopUpdateFileManifestV4) {
  await fs.writeFile(path.join(portableRoot, "update-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function buildDesktopActualLocalFileManifest(
  portableRoot: string,
  localManifest: DesktopUpdateFileManifestV4 | null,
  remoteManifest: DesktopUpdateFileManifestV4,
): Promise<DesktopUpdateFileManifestV4> {
  const paths = new Set<string>();
  for (const file of remoteManifest.files) {
    if (isDesktopUpdateIncrementalManagedPathV4(file.path)) paths.add(file.path);
  }
  for (const file of localManifest?.files || []) {
    if (isDesktopUpdateIncrementalManagedPathV4(file.path)) paths.add(file.path);
  }

  const files: DesktopUpdateManagedFileV4[] = [];
  let index = 0;
  for (const relativePath of [...paths].sort()) {
    index += 1;
    if (verbose && index % 250 === 0) log(`scan progress: ${index}/${paths.size}`);
    const absolutePath = resolveDesktopManagedPath(portableRoot, relativePath);
    if (!(await pathExists(absolutePath))) continue;
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) continue;
    files.push({
      path: relativePath,
      sha256: await sha256Path(absolutePath),
      size: stats.size,
    });
  }

  return {
    manifestVersion: remoteManifest.manifestVersion,
    version: localManifest?.version || desktopAppVersion(),
    files,
  };
}

async function downloadDesktopIncrementalFiles(input: {
  files: DesktopUpdateManagedFileV4[];
  baseUrl: string;
  objectStore: boolean;
  stagingRoot: string;
  statusBase: Omit<Extract<DesktopUpdateStatusV4, {phase: "downloading"}>, "phase" | "downloadedSize" | "totalSize">;
}) {
  await fs.rm(input.stagingRoot, {recursive: true, force: true});
  let downloadedSize = 0;
  const totalSize = input.files.reduce((sum, file) => sum + file.size, 0);
  emitStatus({phase: "downloading", ...input.statusBase, downloadedSize, totalSize});
  for (const file of input.files) {
    const downloadUrl = input.objectStore ? desktopUpdateObjectUrlForFileV4(input.baseUrl, file) : new URL(file.url || file.path, input.baseUrl).toString();
    if (!downloadUrl) throw new Error(`增量对象地址无效：${file.path}`);
    log(`download: ${file.path} ${file.size}B`);
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`下载失败 ${file.path}: HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const target = resolveDesktopManagedPath(input.stagingRoot, file.path);
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.writeFile(target, buffer);
    downloadedSize += file.size;
    emitStatus({phase: "downloading", ...input.statusBase, downloadedSize: Math.min(downloadedSize, totalSize), totalSize});
  }
}

async function verifyDesktopStagedFiles(stagingRoot: string, files: DesktopUpdateManagedFileV4[]) {
  for (const file of files) {
    const staged = resolveDesktopManagedPath(stagingRoot, file.path);
    const digest = await sha256Path(staged);
    if (digest !== file.sha256) throw new Error(`文件校验失败：${file.path}`);
  }
}

async function replaceDesktopManagedFiles(input: {portableRoot: string; stagingRoot: string; backupRoot: string; diff: DesktopUpdateFileDiffV4}) {
  await fs.rm(input.backupRoot, {recursive: true, force: true});
  const replaced: string[] = [];
  try {
    for (const file of input.diff.changedFiles) {
      const target = resolveDesktopManagedPath(input.portableRoot, file.path);
      const staged = resolveDesktopManagedPath(input.stagingRoot, file.path);
      const backup = resolveDesktopManagedPath(input.backupRoot, file.path);
      if (await pathExists(target)) {
        await fs.mkdir(path.dirname(backup), {recursive: true});
        await fs.copyFile(target, backup);
      }
      await fs.mkdir(path.dirname(target), {recursive: true});
      await fs.copyFile(staged, target);
      replaced.push(file.path);
    }
    for (const file of input.diff.deletedFiles) {
      const target = resolveDesktopManagedPath(input.portableRoot, file.path);
      if (!(await pathExists(target))) continue;
      const backup = resolveDesktopManagedPath(input.backupRoot, file.path);
      await fs.mkdir(path.dirname(backup), {recursive: true});
      await fs.copyFile(target, backup);
      await fs.rm(target, {force: true});
      replaced.push(file.path);
    }
  } catch (error) {
    await rollbackDesktopManagedFiles(input.portableRoot, input.backupRoot, replaced);
    throw error;
  }
}

async function rollbackDesktopManagedFiles(portableRoot: string, backupRoot: string, replaced: string[]) {
  for (const relativePath of [...replaced].reverse()) {
    const target = resolveDesktopManagedPath(portableRoot, relativePath);
    const backup = resolveDesktopManagedPath(backupRoot, relativePath);
    if (await pathExists(backup)) {
      await fs.mkdir(path.dirname(target), {recursive: true});
      await fs.copyFile(backup, target);
    } else {
      await fs.rm(target, {force: true});
    }
  }
}

function resolveDesktopManagedPath(root: string, relativePath: string): string {
  const normalized = relativePath.trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (!validateDesktopUpdateManagedPathV4(normalized) || !isDesktopUpdateIncrementalManagedPathV4(normalized)) {
    throw new Error(`非法增量更新路径：${relativePath}`);
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...normalized.split("/"));
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`增量更新路径越界：${relativePath}`);
  }
  return resolved;
}

async function sha256Path(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  hash.update(await fs.readFile(filePath));
  return hash.digest("hex");
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function desktopPortableRoot(): string {
  return path.resolve(process.env.CHANGEBATTLE_PORTABLE_ROOT || process.env.CHANGEBATTLE_PROJECT_ROOT || path.resolve(__dirname, "../../.."));
}

function desktopUpdateDisabledForRuntime(): boolean {
  return process.env.CHANGEBATTLE_PORTABLE_UPDATE_ENABLED !== "1" || process.env.CHANGEBATTLE_DISABLE_UPDATE_CHECK === "1";
}

function desktopAppVersion(): string {
  return normalizeChangeBattleDesktopVersionV4(process.env.CHANGEBATTLE_DESKTOP_VERSION || "0.0.0");
}

function emitStatus(status: DesktopUpdateStatusV4) {
  lastStatus = status;
  process.stdout.write(`${JSON.stringify({type: "status", status})}\n`);
}

function log(message: string) {
  if (verbose) process.stderr.write(`[changebattle-updater] ${message}\n`);
}
