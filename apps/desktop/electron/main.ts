import {createHash} from "node:crypto";
import {readFileSync, promises as fs} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {Worker} from "node:worker_threads";
import {app, BrowserWindow, ipcMain, protocol, shell, type IpcMainInvokeEvent} from "electron";
import {createInMemoryBattleService} from "@changebattle-v2/showdown-battle-core";
import type {BattleSessionCreateInputV4, BattleSessionSnapshotV4, BattleTrainerItemSubmitV4, CoopPartnerPreferenceV4, DesktopUpdateStatusV4, FormalBattleResultFinalizeReasonV4, FormalBattleResultFinalizeResultV4, FormalBattleSessionPreparationV4, FormalGameModeV4, FormalGameRunV4, FormalMedicalInsuranceChoiceResultV4, FormalMedicalInsuranceChoiceV4, FormalMedicalInsuranceEffectsV4, FormalMedicalInsuranceOfferV4, FormalRestTeamHealResultV4, FormalSettlementReasonV4, FormalTrainingGroundLessonViewV4, PlayerVaultV4, ShowdownPlaybackTimelineV4, ShowdownPlayerIdV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";
import {CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4, changeBattleDesktopUpdateIsNewerV4, changeBattleDesktopUpdateManifestUrlsV4, changeBattleDesktopUpdateOfficialSiteUrlV4, compareDesktopUpdateFileManifestsV4, isDesktopUpdateIncrementalManagedPathV4, normalizeChangeBattleDesktopVersionV4, parseChangeBattleDesktopUpdateManifestV4, parseDesktopUpdateFileManifestV4, validateDesktopUpdateManagedPathV4, type ChangeBattleDesktopUpdateCheckResultV4, type ChangeBattleDesktopUpdateManifestV4, type DesktopUpdateFileManifestV4, type DesktopUpdateManagedFileV4} from "@changebattle-v2/core";
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
const desktopUpdateCheckDelayMs = 1_200;
const desktopUpdateFetchTimeoutMs = 6_000;

app.setName("ChangeBattle V2 Dex Desktop");
app.setPath("userData", path.join(app.getPath("appData"), "@changebattle-v2", "desktop"));

let desktopUpdateStatus: DesktopUpdateStatusV4 = {
  phase: "idle",
  currentVersion: desktopAppVersion(),
  officialSiteUrl: CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
};
let desktopUpdateRunning = false;
let desktopUpdateAbortController: AbortController | null = null;

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
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#f4f0e8",
    title: "ChangeBattle V2 Dex",
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
  desktopUpdateAbortController?.abort();
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

function scheduleDesktopUpdateCheck() {
  if (desktopUpdateDisabledForRuntime()) {
    console.info("[changebattle-v2:desktop] desktop update check skipped in dev/non-portable runtime");
    return;
  }
  if (process.env.CHANGEBATTLE_DISABLE_UPDATE_CHECK === "1") {
    console.info("[changebattle-v2:desktop] desktop update check disabled by CHANGEBATTLE_DISABLE_UPDATE_CHECK=1");
    return;
  }
  setTimeout(() => {
    void runDesktopBackgroundUpdate().catch(error => {
      console.warn("[changebattle-v2:desktop] desktop background update failed", error instanceof Error ? error.message : error);
    });
  }, desktopUpdateCheckDelayMs);
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
      const updateAvailable = changeBattleDesktopUpdateIsNewerV4(currentVersion, manifest.version);
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

async function runDesktopBackgroundUpdate(options: {manual?: boolean} = {}): Promise<DesktopUpdateStatusV4> {
  if (desktopUpdateDisabledForRuntime()) return desktopUpdateDisabledStatus();
  if (desktopUpdateRunning) return desktopUpdateStatus;
  desktopUpdateRunning = true;
  const controller = new AbortController();
  desktopUpdateAbortController = controller;
  const currentVersion = desktopAppVersion();
  publishDesktopUpdateStatus({
    phase: "checking",
    currentVersion,
    officialSiteUrl: desktopUpdateStatus.officialSiteUrl || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
  });

  let activeManifest: ChangeBattleDesktopUpdateManifestV4 | null = null;
  try {
    const result = await checkDesktopUpdate(controller.signal);
    if (!result.ok) {
      console.warn(`[changebattle-v2:desktop] desktop update check unavailable: ${result.reason}`);
      if (options.manual) {
        publishDesktopUpdateStatus({
          phase: "failed",
          currentVersion: result.currentVersion,
          officialSiteUrl: CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
          reason: result.reason,
        });
      } else {
        publishDesktopUpdateStatus({
          phase: "idle",
          currentVersion: result.currentVersion,
          officialSiteUrl: CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4,
        });
      }
      return desktopUpdateStatus;
    }

    const {manifest} = result;
    activeManifest = manifest;
    const officialSiteUrl = changeBattleDesktopUpdateOfficialSiteUrlV4(manifest);
    if (!result.updateAvailable) {
      console.info(`[changebattle-v2:desktop] desktop is up to date: ${result.currentVersion}`);
      publishDesktopUpdateStatus({phase: "up-to-date", currentVersion: result.currentVersion, officialSiteUrl});
      return desktopUpdateStatus;
    }

    if (!desktopPortableUpdateEnabled()) {
      console.info("[changebattle-v2:desktop] portable file replacement skipped outside release package");
      publishDesktopUpdateStatus(options.manual
        ? {
            phase: "full-package-required",
            currentVersion: result.currentVersion,
            remoteVersion: manifest.version,
            officialSiteUrl,
            reason: "当前不是 portable 更新环境，无法自动替换文件。",
            notes: manifest.notes,
            fullPackageSize: manifest.fullPackage?.size,
          }
        : {phase: "idle", currentVersion: result.currentVersion, officialSiteUrl});
      return desktopUpdateStatus;
    }

    if (manifest.requiresFullPackage || !manifest.fileManifestUrl || !manifest.incrementalBaseUrl) {
      publishDesktopUpdateStatus({
        phase: "full-package-required",
        currentVersion: result.currentVersion,
        remoteVersion: manifest.version,
        officialSiteUrl,
        reason: manifest.requiresFullPackageReason || "该版本需要下载完整包。",
        notes: manifest.notes,
        fullPackageSize: manifest.fullPackage?.size,
      });
      return desktopUpdateStatus;
    }

    const localManifest = await readDesktopLocalFileManifest();
    if (!localManifest) {
      publishDesktopUpdateStatus({
        phase: "full-package-required",
        currentVersion: result.currentVersion,
        remoteVersion: manifest.version,
        officialSiteUrl,
        reason: "当前安装包缺少本地更新基线，无法安全增量更新。",
        notes: manifest.notes,
        fullPackageSize: manifest.fullPackage?.size,
      });
      return desktopUpdateStatus;
    }

    const remoteManifest = await fetchDesktopFileManifest(manifest.fileManifestUrl, controller.signal);
    if (remoteManifest.version !== manifest.version) {
      throw new Error(`远端文件清单版本不匹配：latest=${manifest.version}, files=${remoteManifest.version}`);
    }
    const diff = compareDesktopUpdateFileManifestsV4(localManifest, remoteManifest);
    if (!diff.changedFiles.length) {
      publishDesktopUpdateStatus({phase: "up-to-date", currentVersion: result.currentVersion, officialSiteUrl});
      return desktopUpdateStatus;
    }

    publishDesktopUpdateStatus({
      phase: "available",
      currentVersion: result.currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl,
      notes: manifest.notes,
      incrementalSize: diff.totalSize,
      fullPackageSize: manifest.fullPackage?.size,
    });

    const portableRoot = desktopPortableRoot();
    const stagingRoot = path.join(portableRoot, ".update-staging", `v${remoteManifest.version}`);
    const backupRoot = path.join(portableRoot, ".update-backup", `v${remoteManifest.version}`);
    await downloadDesktopIncrementalFiles({
      files: diff.changedFiles,
      baseUrl: manifest.incrementalBaseUrl,
      stagingRoot,
      statusBase: {
        currentVersion: result.currentVersion,
        remoteVersion: manifest.version,
        officialSiteUrl,
        notes: manifest.notes,
        fullPackageSize: manifest.fullPackage?.size,
      },
      signal: controller.signal,
    });
    publishDesktopUpdateStatus({
      phase: "verifying",
      currentVersion: result.currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl,
      totalSize: diff.totalSize,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    await verifyDesktopStagedFiles(stagingRoot, diff.changedFiles);
    publishDesktopUpdateStatus({
      phase: "replacing",
      currentVersion: result.currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl,
      totalSize: diff.totalSize,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    await replaceDesktopManagedFiles({portableRoot, stagingRoot, backupRoot, files: diff.changedFiles});
    await writeDesktopLocalFileManifest(remoteManifest);
    await fs.rm(stagingRoot, {recursive: true, force: true});
    publishDesktopUpdateStatus({
      phase: "complete",
      currentVersion: result.currentVersion,
      remoteVersion: manifest.version,
      officialSiteUrl,
      totalSize: diff.totalSize,
      notes: manifest.notes,
      fullPackageSize: manifest.fullPackage?.size,
    });
    return desktopUpdateStatus;
  } catch (error) {
    const officialSiteUrl = activeManifest ? changeBattleDesktopUpdateOfficialSiteUrlV4(activeManifest) : CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4;
    const reason = error instanceof Error ? error.message : String(error);
    publishDesktopUpdateStatus({
      phase: isAbortError(error) ? "cancelled" : "failed",
      currentVersion,
      remoteVersion: activeManifest?.version,
      officialSiteUrl,
      reason: isAbortError(error) ? "已取消更新下载。" : reason,
      notes: activeManifest?.notes,
      fullPackageSize: activeManifest?.fullPackage?.size,
    });
    return desktopUpdateStatus;
  } finally {
    desktopUpdateRunning = false;
    if (desktopUpdateAbortController === controller) desktopUpdateAbortController = null;
  }
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

async function downloadDesktopIncrementalFiles(input: {
  files: DesktopUpdateManagedFileV4[];
  baseUrl: string;
  stagingRoot: string;
  statusBase: Omit<Extract<DesktopUpdateStatusV4, {phase: "downloading"}>, "phase" | "downloadedSize" | "totalSize">;
  signal: AbortSignal;
}) {
  await fs.rm(input.stagingRoot, {recursive: true, force: true});
  let downloadedSize = 0;
  const totalSize = input.files.reduce((sum, file) => sum + file.size, 0);
  publishDesktopUpdateStatus({phase: "downloading", ...input.statusBase, downloadedSize, totalSize});
  for (const file of input.files) {
    const response = await fetch(new URL(file.url || file.path, input.baseUrl).toString(), {signal: input.signal});
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

async function replaceDesktopManagedFiles(input: {portableRoot: string; stagingRoot: string; backupRoot: string; files: DesktopUpdateManagedFileV4[]}) {
  await fs.rm(input.backupRoot, {recursive: true, force: true});
  const replaced: string[] = [];
  try {
    for (const file of input.files) {
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
  return createWindow().then(() => {
    scheduleDesktopUpdateCheck();
  });
});
app.on("window-all-closed", () => {
  formalComputeWorker?.terminate();
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) void createWindow();
});
