import {createHash} from "node:crypto";
import {spawn, type ChildProcess} from "node:child_process";
import {existsSync, readFileSync, promises as fs} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {Worker} from "node:worker_threads";
import {app, BrowserWindow, ipcMain, protocol, shell, type IpcMainInvokeEvent} from "electron";
import {createInMemoryBattleService} from "@changebattle-v2/showdown-battle-core";
import {
  DEFAULT_CHANGE_BATTLE_BATTLE_SERVICE_URL,
  battleServerBaseUrlForConfigV4,
  normalizeBattleServerBaseUrl,
  normalizeBattleServerConfigV4,
  type AssetCacheStatusV4,
  type BattleServerConfigV4,
  type BattleServerHealthResultV4,
  type BattleSessionCreateInputV4,
  type BattleSessionSnapshotV4,
  type BattleTrainerItemSubmitV4,
  type CoopPartnerPreferenceV4,
  type DesktopUpdateStatusV4,
  type FormalBattleResultFinalizeReasonV4,
  type FormalBattleResultFinalizeResultV4,
  type FormalBattleSessionPreparationV4,
  type FormalGameModeV4,
  type FormalGameRunV4,
  type FormalMedicalInsuranceChoiceResultV4,
  type FormalMedicalInsuranceChoiceV4,
  type FormalMedicalInsuranceEffectsV4,
  type FormalMedicalInsuranceOfferV4,
  type FormalRestTeamHealResultV4,
  type FormalSettlementReasonV4,
  type FormalTrainingGroundLessonViewV4,
  type PlayerVaultV4,
  type ShowdownPlaybackTimelineV4,
  type ShowdownPlayerIdV4,
  type TrainingRunGameV4,
  type UserProfileV2,
} from "@changebattle-v2/api";
import {CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4, changeBattleDesktopUpdateIsNewerV4, changeBattleDesktopUpdateManifestUrlsV4, changeBattleDesktopUpdateOfficialSiteUrlV4, compareDesktopUpdateFileManifestsV4, desktopUpdateObjectUrlForFileV4, isDesktopUpdateIncrementalManagedPathV4, normalizeChangeBattleDesktopVersionV4, parseChangeBattleDesktopUpdateManifestV4, parseDesktopUpdateFileManifestV4, validateDesktopUpdateManagedPathV4, type ChangeBattleDesktopUpdateCheckResultV4, type ChangeBattleDesktopUpdateManifestV4, type DesktopUpdateFileDiffV4, type DesktopUpdateFileManifestV4, type DesktopUpdateManagedFileV4} from "@changebattle-v2/core";
import type {BattleServiceApiV4} from "@changebattle-v2/showdown-battle-core";
import {DesktopSaveStoreV2} from "./desktopSaveStore.js";
import {rendererAssetFilePath} from "./rendererAssetResolver.js";

let mainWindow: BrowserWindow | null = null;
let formalComputeWorker: Worker | null = null;
let battleService: BattleServiceApiV4 | null = null;
let saveStore: DesktopSaveStoreV2 | null = null;
let formalComputeRequestId = 0;
const formalComputePending = new Map<number, {resolve: (value: any) => void; reject: (error: Error) => void}>();
const rendererReadyRetryMs = 180;
const rendererReadyTimeoutMs = 90_000;
const desktopUpdateFetchTimeoutMs = 6_000;
const desktopAppUserModelId = "com.changebattle.v2";
const defaultPublicBattleServiceUrl = DEFAULT_CHANGE_BATTLE_BATTLE_SERVICE_URL;
const defaultPublicAssetBaseUrl = "https://assets.65h26i.top/beta";
const battleServerConfigFileName = ".battleServer.json";
const battleServerTypoConfigFileName = ".batterServer";

protocol.registerSchemesAsPrivileged([
  {scheme: "changebattle-asset", privileges: {standard: true, secure: true, supportFetchAPI: true}},
]);

app.setName("ChangeBattle V2 Dex Desktop");
app.setAppUserModelId(desktopAppUserModelId);
app.setPath("userData", path.join(app.getPath("appData"), "@changebattle-v2", "desktop"));

let desktopUpdateStatus: DesktopUpdateStatusV4 = {
  phase: "idle",
  currentVersion: desktopAppVersion(),
  officialSiteUrl: CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
};
let desktopUpdateRunning = false;
let desktopUpdateChild: ChildProcess | null = null;

type FormalComputeMethodMap = {
  createFormalGameWithStarterCandidates: {
    args: [UserProfileV2, {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}, PlayerVaultV4 | null | undefined];
    result: FormalGameRunV4;
  };
  prepareFormalRoundPlan: {args: [FormalGameRunV4]; result: FormalGameRunV4};
  prepareFormalBattleSession: {args: [FormalGameRunV4]; result: FormalBattleSessionPreparationV4};
  getFormalMedicalInsuranceOffer: {args: [FormalGameRunV4]; result: FormalMedicalInsuranceOfferV4};
  chooseFormalMedicalInsurance: {args: [FormalGameRunV4, FormalMedicalInsuranceChoiceV4]; result: FormalMedicalInsuranceChoiceResultV4};
  formalMedicalInsuranceEffectsForRun: {args: [FormalGameRunV4]; result: FormalMedicalInsuranceEffectsV4};
  healFormalRestTeam: {args: [FormalGameRunV4]; result: FormalRestTeamHealResultV4};
  getFormalTrainingGroundLessons: {args: [FormalGameRunV4]; result: FormalTrainingGroundLessonViewV4[]};
  prepareFormalSettlement: {args: [FormalGameRunV4, UserProfileV2, FormalSettlementReasonV4]; result: {run: FormalGameRunV4; profile: UserProfileV2}};
  settleFormalBattleRound: {args: [FormalGameRunV4]; result: FormalGameRunV4};
  finalizeFormalBattleResult: {args: [FormalGameRunV4, BattleSessionSnapshotV4, FormalBattleResultFinalizeReasonV4 | undefined, {playbackTimeline?: ShowdownPlaybackTimelineV4 | null} | undefined]; result: FormalBattleResultFinalizeResultV4};
};

async function createWindow() {
  const icon = desktopWindowIconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#f4f0e8",
    title: "ChangeBattle V2 Dex",
    ...(icon ? {icon} : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "../preload/preload.cjs"),
    },
  });

  if (process.env.ELECTRON_BOOT_RENDERER_URL) {
    await loadBootPage(mainWindow);
    void loadRendererWhenReady(mainWindow, process.env.ELECTRON_BOOT_RENDERER_URL);
  } else if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function desktopWindowIconPath(): string | undefined {
  const candidates = [
    path.join(desktopPortableRoot(), "resources", "app-icon.png"),
    path.resolve(__dirname, "../../resources/app-icon.png"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function loadBootPage(window: BrowserWindow) {
  const bootHtml = process.env.ELECTRON_BOOT_HTML || path.join(__dirname, "../renderer/index.html");
  await window.loadFile(bootHtml);
}

async function loadRendererWhenReady(window: BrowserWindow, rendererUrl: string) {
  const startedAt = Date.now();
  while (!window.isDestroyed() && Date.now() - startedAt < rendererReadyTimeoutMs) {
    if (await rendererUrlReady(rendererUrl)) {
      if (!window.isDestroyed()) await window.loadURL(rendererUrl);
      return;
    }
    await delay(rendererReadyRetryMs);
  }
  console.warn(`[changebattle-v2:desktop] renderer dev server was not ready after ${rendererReadyTimeoutMs}ms: ${rendererUrl}`);
}

async function rendererUrlReady(rendererUrl: string): Promise<boolean> {
  try {
    const response = await fetch(rendererUrl, {method: "GET"});
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function registerRendererAssetFileResolver() {
  protocol.interceptFileProtocol("file", (request, callback) => {
    const resolved = rendererAssetFilePath(request.url, path.join(__dirname, "../renderer"));
    callback(resolved || fileURLToPath(request.url));
  });
}

function registerChangeBattleAssetCacheProtocol() {
  protocol.handle("changebattle-asset", async request => {
    const relativePath = assetRelativePathFromProtocolUrl(request.url);
    if (!relativePath) return new Response("Bad asset path", {status: 400});
    const config = await loadDesktopBattleServerConfig();
    const cdnUrl = `${defaultPublicAssetBaseUrl}/${relativePath}`;
    if (!config.assetCache.enabled) return fetch(cdnUrl);
    const root = await ensureDesktopAssetsRoot();
    const filePath = safeAssetCacheFilePath(root, relativePath);
    if (!filePath) return new Response("Bad asset path", {status: 400});
    if (existsSync(filePath)) {
      return new Response(await fs.readFile(filePath), {headers: {"content-type": contentTypeForAsset(relativePath)}});
    }
    const response = await fetch(cdnUrl);
    if (!response.ok) return response;
    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, bytes);
    void refreshDesktopAssetCacheStats().catch(error => {
      console.warn("[changebattle-v2:desktop] asset cache stats refresh failed", error);
    });
    return new Response(bytes, {headers: {"content-type": response.headers.get("content-type") || contentTypeForAsset(relativePath)}});
  });
}

async function loadDesktopBattleServerConfig(): Promise<BattleServerConfigV4> {
  const found = await readDesktopBattleServerConfigFile();
  const envUrl = normalizeBattleServerBaseUrl(String(process.env.CHANGEBATTLE_DESKTOP_BATTLE_SERVICE_URL || process.env.VITE_CHANGEBATTLE_BATTLE_SERVICE_URL || "").trim());
  const config = normalizeBattleServerConfigV4(found?.config || null);
  if (!found && envUrl) return {...config, officialUrl: envUrl};
  return config;
}

async function readDesktopBattleServerConfigFile(): Promise<{config: BattleServerConfigV4; path: string} | null> {
  for (const filePath of desktopBattleServerConfigCandidates()) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return {config: normalizeBattleServerConfigV4(JSON.parse(raw)), path: filePath};
    } catch {
      // Try the next location; corrupted config falls back to defaults for v1.
    }
  }
  return null;
}

async function saveDesktopBattleServerConfig(config: BattleServerConfigV4): Promise<BattleServerConfigV4> {
  const normalized = normalizeBattleServerConfigV4(config);
  const raw = JSON.stringify(normalized, null, 2);
  for (const filePath of [desktopPrimaryBattleServerConfigPath(), desktopFallbackBattleServerConfigPath()]) {
    try {
      await fs.mkdir(path.dirname(filePath), {recursive: true});
      await fs.writeFile(filePath, raw, "utf8");
      return normalized;
    } catch {
      // Portable roots may be read-only; fall back to userData.
    }
  }
  return normalized;
}

function desktopBattleServerConfigCandidates(): string[] {
  return [
    desktopPrimaryBattleServerConfigPath(),
    path.join(path.dirname(desktopPrimaryBattleServerConfigPath()), battleServerTypoConfigFileName),
    desktopFallbackBattleServerConfigPath(),
  ];
}

function desktopPrimaryBattleServerConfigPath(): string {
  return path.join(desktopPortableRoot(), "config", battleServerConfigFileName);
}

function desktopFallbackBattleServerConfigPath(): string {
  return path.join(app.getPath("userData"), "config", battleServerConfigFileName);
}

async function withAssetCacheStatus(config: BattleServerConfigV4): Promise<BattleServerConfigV4> {
  const status = await desktopAssetCacheStatus();
  return normalizeBattleServerConfigV4({...config, assetCache: {...config.assetCache, ...status}});
}

async function testBattleServerUrl(inputUrl: string): Promise<BattleServerHealthResultV4> {
  const root = normalizeBattleServerBaseUrl(inputUrl);
  const startedAt = Date.now();
  if (!root) return {ok: false, url: inputUrl, elapsedMs: 0, error: "invalid_url", message: "服务器地址无效。"};
  try {
    const response = await fetch(`${root}/health`, {method: "GET"});
    const payload = await response.json().catch(() => null) as any;
    const elapsedMs = Date.now() - startedAt;
    if (!response.ok || payload?.ok !== true) {
      return {ok: false, url: root, elapsedMs, error: "health_failed", message: "服务器健康检查失败。"};
    }
    return {
      ok: true,
      url: root,
      elapsedMs,
      service: typeof payload.service === "string" ? payload.service : undefined,
      version: typeof payload.version === "string" ? payload.version : undefined,
      redis: typeof payload.redis === "string" ? payload.redis : undefined,
      storage: typeof payload.storage === "string" ? payload.storage : undefined,
    };
  } catch {
    return {ok: false, url: root, elapsedMs: Date.now() - startedAt, error: "network_error", message: "无法连接服务器。"};
  }
}

async function desktopAssetCacheStatus(): Promise<AssetCacheStatusV4> {
  const config = normalizeBattleServerConfigV4((await readDesktopBattleServerConfigFile())?.config || null);
  const root = await ensureDesktopAssetsRoot();
  const stats = await scanDirectoryStats(root);
  return {
    enabled: config.assetCache.enabled,
    rootDir: root,
    cachedBytes: stats.bytes,
    cachedFileCount: stats.files,
    lastUpdatedAt: config.assetCache.lastUpdatedAt,
    available: true,
  };
}

async function refreshDesktopAssetCacheStats(): Promise<void> {
  const config = await loadDesktopBattleServerConfig();
  const status = await desktopAssetCacheStatus();
  await saveDesktopBattleServerConfig({
    ...config,
    assetCache: {
      ...config.assetCache,
      rootDir: status.rootDir,
      cachedBytes: status.cachedBytes,
      cachedFileCount: status.cachedFileCount,
      lastUpdatedAt: new Date().toISOString(),
    },
  });
}

async function ensureDesktopAssetsRoot(): Promise<string> {
  for (const root of [path.join(desktopPortableRoot(), "assets"), path.join(app.getPath("userData"), "assets")]) {
    try {
      await fs.mkdir(root, {recursive: true});
      return root;
    } catch {
      // Try fallback.
    }
  }
  return path.join(app.getPath("userData"), "assets");
}

async function scanDirectoryStats(root: string): Promise<{bytes: number; files: number}> {
  let bytes = 0;
  let files = 0;
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, {withFileTypes: true}).catch(() => []);
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(filePath);
      else if (entry.isFile()) {
        const stat = await fs.stat(filePath).catch(() => null);
        if (stat) {
          files += 1;
          bytes += stat.size;
        }
      }
    }
  }
  await walk(root);
  return {bytes, files};
}

function assetRelativePathFromProtocolUrl(value: string): string {
  const url = new URL(value);
  const parts = [url.hostname, ...url.pathname.split("/")].filter(Boolean);
  if (parts[0] === "beta") parts.shift();
  return parts.join("/").replace(/^assets\//, "");
}

function safeAssetCacheFilePath(root: string, relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (!normalized.length || normalized.some(part => part === "." || part === "..")) return null;
  const target = path.resolve(root, ...normalized);
  const rootWithSep = path.resolve(root) + path.sep;
  return target.startsWith(rootWithSep) ? target : null;
}

function contentTypeForAsset(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".json") return "application/json";
  return "application/octet-stream";
}

ipcMain.handle("userProfile:load", async () => {
  console.info(`[changebattle-v2:desktop] loading profile from ${ensureSaveStore().path()}`);
  return ensureSaveStore().loadUserProfile();
});

ipcMain.handle("userProfile:save", async (_event: IpcMainInvokeEvent, profile: UserProfileV2) => {
  console.info(`[changebattle-v2:desktop] saving profile to ${ensureSaveStore().path()}`);
  return ensureSaveStore().saveUserProfile(profile);
});

ipcMain.handle("userProfile:delete", async () => {
  await ensureSaveStore().deleteAll();
});

ipcMain.handle("userProfile:path", async () => ensureSaveStore().path());

ipcMain.handle("desktopApp:openOfficialSite", async () => {
  await shell.openExternal(desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4);
});

ipcMain.handle("desktopApp:checkForUpdates", async () => {
  if (desktopUpdateDisabledForRuntime()) return desktopUpdateDisabledStatus();
  return runDesktopBackgroundUpdate({manual: true});
});

ipcMain.handle("desktopApp:getUpdateStatus", async () => desktopUpdateStatus);

ipcMain.handle("desktopApp:cancelUpdate", async () => {
  desktopUpdateChild?.kill();
});

ipcMain.handle("desktopApp:getBattleServiceConfig", async () => {
  const runtimeConfig = await loadDesktopBattleServerConfig();
  const configuredUrl = battleServerBaseUrlForConfigV4(runtimeConfig);
  const allowLocalFallback = process.env.CHANGEBATTLE_DESKTOP_ALLOW_LOCAL_BATTLE_SERVICE === "1";
  const url = configuredUrl || (allowLocalFallback ? "" : defaultPublicBattleServiceUrl);
  return url
    ? {backend: "server" as const, url}
    : {backend: "local-fallback" as const};
});

ipcMain.handle("desktopApp:getBattleServerConfig", async () => {
  return withAssetCacheStatus(await loadDesktopBattleServerConfig());
});

ipcMain.handle("desktopApp:setBattleServerConfig", async (_event: IpcMainInvokeEvent, input: BattleServerConfigV4) => {
  const normalized = normalizeBattleServerConfigV4(input);
  const saved = await saveDesktopBattleServerConfig(normalized);
  if (saved.assetCache.enabled) await ensureDesktopAssetsRoot();
  return withAssetCacheStatus(saved);
});

ipcMain.handle("desktopApp:testBattleServer", async (_event: IpcMainInvokeEvent, url: string) => {
  return testBattleServerUrl(url);
});

ipcMain.handle("desktopApp:getAssetCacheStatus", async () => {
  return desktopAssetCacheStatus();
});

ipcMain.handle("desktopApp:clearAssetCache", async () => {
  const root = await ensureDesktopAssetsRoot();
  await fs.rm(root, {recursive: true, force: true});
  await fs.mkdir(root, {recursive: true});
  const config = await loadDesktopBattleServerConfig();
  await saveDesktopBattleServerConfig({...config, assetCache: {...config.assetCache, cachedBytes: 0, cachedFileCount: 0, lastUpdatedAt: new Date().toISOString()}});
  return desktopAssetCacheStatus();
});

ipcMain.handle("playerVault:load", async () => {
  return ensureSaveStore().loadPlayerVault();
});

ipcMain.handle("playerVault:save", async (_event: IpcMainInvokeEvent, vault: PlayerVaultV4) => {
  return ensureSaveStore().savePlayerVault(vault);
});

ipcMain.handle("playerVault:delete", async () => {
  await ensureSaveStore().deletePlayerVault();
});

ipcMain.handle("trainingRun:load", async () => {
  return ensureSaveStore().loadTrainingRun();
});

ipcMain.handle("trainingRun:save", async (_event: IpcMainInvokeEvent, run: TrainingRunGameV4) => {
  return ensureSaveStore().saveTrainingRun(run);
});

ipcMain.handle("trainingRun:delete", async () => {
  await ensureSaveStore().deleteTrainingRun();
});

ipcMain.handle("formalRun:load", async () => {
  return ensureSaveStore().loadFormalGameRun();
});

ipcMain.handle("formalRun:save", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return ensureSaveStore().saveFormalGameRun(run);
});

ipcMain.handle("formalRun:delete", async () => {
  await ensureSaveStore().deleteFormalGameRun();
});

ipcMain.handle("formalGame:createWithStarterCandidates", async (_event: IpcMainInvokeEvent, profile: UserProfileV2, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}, playerVault?: PlayerVaultV4 | null) => {
  return callFormalComputeWorker("createFormalGameWithStarterCandidates", profile, options, playerVault);
});

ipcMain.handle("formalGame:prepareRoundPlan", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("prepareFormalRoundPlan", run);
});

ipcMain.handle("formalGame:prepareBattleSession", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("prepareFormalBattleSession", run);
});

ipcMain.handle("formalGame:getMedicalInsuranceOffer", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("getFormalMedicalInsuranceOffer", run);
});

ipcMain.handle("formalGame:chooseMedicalInsurance", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, choice: FormalMedicalInsuranceChoiceV4) => {
  return callFormalComputeWorker("chooseFormalMedicalInsurance", run, choice);
});

ipcMain.handle("formalGame:medicalInsuranceEffectsForRun", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("formalMedicalInsuranceEffectsForRun", run);
});

ipcMain.handle("formalGame:healRestTeam", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("healFormalRestTeam", run);
});

ipcMain.handle("formalGame:getTrainingGroundLessons", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("getFormalTrainingGroundLessons", run);
});

ipcMain.handle("formalGame:prepareSettlement", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, profile: UserProfileV2, reason: FormalSettlementReasonV4) => {
  return callFormalComputeWorker("prepareFormalSettlement", run, profile, reason);
});

ipcMain.handle("formalGame:settleBattleRound", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("settleFormalBattleRound", run);
});

ipcMain.handle("formalGame:finalizeBattleResult", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, sessionId: string, reason?: FormalBattleResultFinalizeReasonV4, options?: {playbackTimeline?: ShowdownPlaybackTimelineV4 | null}) => {
  const service = ensureBattleService();
  const snapshot = await service.getSnapshot(sessionId) as unknown as BattleSessionSnapshotV4;
  const playbackTimeline = options?.playbackTimeline ?? await loadDesktopPlaybackTimeline(service, sessionId);
  return callFormalComputeWorker("finalizeFormalBattleResult", run, snapshot, reason, {playbackTimeline});
});

ipcMain.handle("battleService:createSession", async (_event: IpcMainInvokeEvent, input: BattleSessionCreateInputV4) => {
  return ensureBattleService().createBattleSession(input);
});

ipcMain.handle("battleService:submitChoice", async (_event: IpcMainInvokeEvent, sessionId: string, playerId: ShowdownPlayerIdV4, choice: string) => {
  return ensureBattleService().submitChoice({sessionId, playerId, choice});
});

ipcMain.handle("battleService:submitTrainerItem", async (_event: IpcMainInvokeEvent, input: BattleTrainerItemSubmitV4) => {
  return ensureBattleService().submitTrainerItem(input);
});

ipcMain.handle("battleService:applyPermanentFormeChange", async (_event: IpcMainInvokeEvent, input: Parameters<BattleServiceApiV4["applyPermanentFormeChange"]>[0]) => {
  return ensureBattleService().applyPermanentFormeChange(input);
});

ipcMain.handle("battleService:getSnapshot", async (_event: IpcMainInvokeEvent, sessionId: string) => {
  return ensureBattleService().getSnapshot(sessionId);
});

ipcMain.handle("battleService:getPlaybackTimeline", async (_event: IpcMainInvokeEvent, sessionId: string, previousIndex?: number) => {
  return ensureBattleService().getPlaybackTimeline(sessionId, previousIndex);
});

ipcMain.handle("battleService:closeSession", async (_event: IpcMainInvokeEvent, sessionId: string) => {
  return ensureBattleService().closeSession(sessionId);
});

function ensureBattleService(): BattleServiceApiV4 {
  battleService ||= createInMemoryBattleService();
  return battleService;
}

async function loadDesktopPlaybackTimeline(service: BattleServiceApiV4, sessionId: string): Promise<ShowdownPlaybackTimelineV4 | null> {
  try {
    return await service.getPlaybackTimeline(sessionId, 0) as unknown as ShowdownPlaybackTimelineV4;
  } catch (error) {
    console.warn("[changebattle-v2:desktop] playback timeline unavailable, fallback to rawLog settlement", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function ensureSaveStore(): DesktopSaveStoreV2 {
  saveStore ||= new DesktopSaveStoreV2(app.getPath("userData"));
  return saveStore;
}

function callFormalComputeWorker<TMethod extends keyof FormalComputeMethodMap>(
  method: TMethod,
  ...args: FormalComputeMethodMap[TMethod]["args"]
): Promise<FormalComputeMethodMap[TMethod]["result"]> {
  const worker = ensureFormalComputeWorker();
  const id = ++formalComputeRequestId;
  return new Promise((resolve, reject) => {
    formalComputePending.set(id, {resolve, reject});
    worker.postMessage({id, method, args});
  }) as Promise<FormalComputeMethodMap[TMethod]["result"]>;
}

function ensureFormalComputeWorker(): Worker {
  if (formalComputeWorker) return formalComputeWorker;
  formalComputeWorker = new Worker(path.join(__dirname, "formalComputeWorker.js"));
  formalComputeWorker.on("message", (message: {id?: number; ok?: boolean; result?: unknown; error?: string}) => {
    const id = Number(message.id);
    const pending = formalComputePending.get(id);
    if (!pending) return;
    formalComputePending.delete(id);
    if (message.ok) pending.resolve(message.result);
    else {
      const error = new Error(message.error || "正式流程计算失败。");
      console.error("[changebattle-v2:desktop] formal compute worker failed", error.message);
      pending.reject(error);
    }
  });
  formalComputeWorker.on("error", error => {
    rejectFormalComputePending(error instanceof Error ? error : new Error("正式流程计算 worker 异常。"));
    formalComputeWorker = null;
  });
  formalComputeWorker.on("exit", code => {
    if (code !== 0) rejectFormalComputePending(new Error(`正式流程计算 worker 已退出：${code}`));
    formalComputeWorker = null;
  });
  return formalComputeWorker;
}

function rejectFormalComputePending(error: Error) {
  for (const pending of formalComputePending.values()) pending.reject(error);
  formalComputePending.clear();
}

async function checkDesktopUpdate(signal?: AbortSignal): Promise<ChangeBattleDesktopUpdateCheckResultV4> {
  const currentVersion = desktopAppVersion();
  const manifestUrls = changeBattleDesktopUpdateManifestUrlsV4(process.env.CHANGEBATTLE_UPDATE_MANIFEST_URLS);
  let lastReason = "没有可用的更新地址。";

  for (const manifestUrl of manifestUrls) {
    try {
      const json = await fetchDesktopUpdateJson(manifestUrl, signal);
      const manifest = parseChangeBattleDesktopUpdateManifestV4(json);
      if (!manifest) {
        lastReason = `更新清单格式无效：${manifestUrl}`;
        continue;
      }
      const updateAvailable = Boolean(manifest.objectBaseUrl) || manifest.manifestVersion >= 2 || changeBattleDesktopUpdateIsNewerV4(currentVersion, manifest.version);
      return {
        ok: true,
        currentVersion,
        manifestUrl,
        manifest,
        updateAvailable,
        downloadUrl: changeBattleDesktopUpdateOfficialSiteUrlV4(manifest),
      };
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastReason = `${manifestUrl}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  return {ok: false, currentVersion, reason: lastReason};
}

async function fetchDesktopUpdateJson(manifestUrl: string, parentSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), desktopUpdateFetchTimeoutMs);
  const abortListener = () => controller.abort();
  if (parentSignal?.aborted) controller.abort();
  else parentSignal?.addEventListener("abort", abortListener, {once: true});
  try {
    const response = await fetch(manifestUrl, {
      headers: {"Accept": "application/json"},
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abortListener);
  }
}

async function runDesktopUpdaterCliUpdate(options: {manual?: boolean} = {}): Promise<DesktopUpdateStatusV4> {
  if (desktopUpdateDisabledForRuntime()) return desktopUpdateDisabledStatus();
  if (desktopUpdateRunning) return desktopUpdateStatus;
  desktopUpdateRunning = true;
  const currentVersion = desktopAppVersion();
  publishDesktopUpdateStatus({
    phase: "checking",
    currentVersion,
    officialSiteUrl: desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
  });

  const updaterScript = path.join(__dirname, "desktopUpdaterCli.js");
  const child = spawn(process.execPath, [updaterScript], {
    cwd: desktopPortableRoot(),
    env: {
      ...process.env,
      CHANGEBATTLE_UPDATE_VERBOSE: options.manual ? "1" : process.env.CHANGEBATTLE_UPDATE_VERBOSE,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  desktopUpdateChild = child;

  return new Promise(resolve => {
    let stdoutBuffer = "";
    let sawStatus = false;
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", chunk => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) {
        const status = parseDesktopUpdaterCliStatus(line);
        if (!status) continue;
        sawStatus = true;
        publishDesktopUpdateStatus(status);
      }
    });
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", chunk => {
      for (const line of String(chunk).split(/\r?\n/)) {
        if (line.trim()) console.info(line);
      }
    });
    child.on("error", error => {
      publishDesktopUpdateStatus({
        phase: "failed",
        currentVersion,
        officialSiteUrl: desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
        reason: error.message,
      });
    });
    child.on("close", (code, signal) => {
      if (desktopUpdateChild === child) desktopUpdateChild = null;
      desktopUpdateRunning = false;
      const pendingStatus = parseDesktopUpdaterCliStatus(stdoutBuffer);
      if (pendingStatus) {
        sawStatus = true;
        publishDesktopUpdateStatus(pendingStatus);
      }
      if (!sawStatus) {
        publishDesktopUpdateStatus({
          phase: "failed",
          currentVersion,
          officialSiteUrl: desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
          reason: `更新脚本没有返回状态：exit=${code ?? "null"}, signal=${signal ?? "null"}`,
        });
      } else if (code && desktopUpdateStatus.phase !== "failed" && desktopUpdateStatus.phase !== "cancelled") {
        publishDesktopUpdateStatus({
          phase: "failed",
          currentVersion,
          remoteVersion: "remoteVersion" in desktopUpdateStatus ? desktopUpdateStatus.remoteVersion : undefined,
          officialSiteUrl: desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
          reason: `更新脚本异常退出：exit=${code}, signal=${signal ?? "null"}`,
          notes: "notes" in desktopUpdateStatus ? desktopUpdateStatus.notes : undefined,
          fullPackageSize: "fullPackageSize" in desktopUpdateStatus ? desktopUpdateStatus.fullPackageSize : undefined,
        });
      }
      resolve(desktopUpdateStatus);
    });
  });
}

function parseDesktopUpdaterCliStatus(line: string): DesktopUpdateStatusV4 | null {
  if (!line.trim()) return null;
  try {
    const parsed = JSON.parse(line) as {type?: unknown; status?: unknown};
    if (parsed?.type !== "status" || !parsed.status || typeof parsed.status !== "object") return null;
    const status = parsed.status as Partial<DesktopUpdateStatusV4>;
    if (typeof status.phase !== "string" || typeof status.currentVersion !== "string" || typeof status.officialSiteUrl !== "string") return null;
    return status as DesktopUpdateStatusV4;
  } catch {
    return null;
  }
}

async function runDesktopBackgroundUpdate(options: {manual?: boolean} = {}): Promise<DesktopUpdateStatusV4> {
  return runDesktopUpdaterCliUpdate(options);
}

async function fetchDesktopFileManifest(fileManifestUrl: string, signal: AbortSignal): Promise<DesktopUpdateFileManifestV4> {
  const json = await fetchDesktopUpdateJson(fileManifestUrl, signal);
  const manifest = parseDesktopUpdateFileManifestV4(json);
  if (!manifest) throw new Error("远端文件清单格式无效。");
  return manifest;
}

async function readDesktopLocalFileManifest(): Promise<DesktopUpdateFileManifestV4 | null> {
  try {
    const text = await fs.readFile(path.join(desktopPortableRoot(), "update-manifest.json"), "utf8");
    return parseDesktopUpdateFileManifestV4(JSON.parse(text));
  } catch {
    return null;
  }
}

async function writeDesktopLocalFileManifest(manifest: DesktopUpdateFileManifestV4) {
  await fs.writeFile(path.join(desktopPortableRoot(), "update-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
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
  for (const relativePath of [...paths].sort()) {
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
  signal: AbortSignal;
}) {
  await fs.rm(input.stagingRoot, {recursive: true, force: true});
  let downloadedSize = 0;
  const totalSize = input.files.reduce((sum, file) => sum + file.size, 0);
  publishDesktopUpdateStatus({phase: "downloading", ...input.statusBase, downloadedSize, totalSize});
  for (const file of input.files) {
    const downloadUrl = input.objectStore ? desktopUpdateObjectUrlForFileV4(input.baseUrl, file) : new URL(file.url || file.path, input.baseUrl).toString();
    if (!downloadUrl) throw new Error(`增量对象地址无效：${file.path}`);
    const response = await fetch(downloadUrl, {signal: input.signal});
    if (!response.ok) throw new Error(`下载失败 ${file.path}: HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const target = resolveDesktopManagedPath(input.stagingRoot, file.path);
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.writeFile(target, buffer);
    downloadedSize += file.size;
    publishDesktopUpdateStatus({phase: "downloading", ...input.statusBase, downloadedSize: Math.min(downloadedSize, totalSize), totalSize});
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

function publishDesktopUpdateStatus(status: DesktopUpdateStatusV4) {
  desktopUpdateStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("desktopApp:updateStatus", status);
  }
}

function desktopPortableRoot(): string {
  return path.resolve(process.env.CHANGEBATTLE_PORTABLE_ROOT || process.env.CHANGEBATTLE_PROJECT_ROOT || path.resolve(__dirname, "../../.."));
}

function desktopPortableUpdateEnabled(): boolean {
  return process.env.CHANGEBATTLE_PORTABLE_UPDATE_ENABLED === "1";
}

function desktopUpdateDisabledForRuntime(): boolean {
  return !desktopPortableUpdateEnabled() || process.env.CHANGEBATTLE_DISABLE_UPDATE_CHECK === "1";
}

function desktopUpdateDisabledStatus(): DesktopUpdateStatusV4 {
  return {
    phase: "idle",
    currentVersion: desktopAppVersion(),
    officialSiteUrl: desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function desktopAppVersion(): string {
  const localManifestVersion = readDesktopLocalFileManifestVersionSync();
  if (localManifestVersion) return localManifestVersion;
  return normalizeChangeBattleDesktopVersionV4(process.env.CHANGEBATTLE_DESKTOP_VERSION || app.getVersion());
}

function readDesktopLocalFileManifestVersionSync(): string {
  try {
    const text = readFileSync(path.join(desktopPortableRoot(), "update-manifest.json"), "utf8");
    const manifest = parseDesktopUpdateFileManifestV4(JSON.parse(text));
    return manifest?.version ? normalizeChangeBattleDesktopVersionV4(manifest.version) : "";
  } catch {
    return "";
  }
}

app.whenReady().then(() => {
  registerRendererAssetFileResolver();
  registerChangeBattleAssetCacheProtocol();
  return createWindow();
});
app.on("window-all-closed", () => {
  formalComputeWorker?.terminate();
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) void createWindow();
});
