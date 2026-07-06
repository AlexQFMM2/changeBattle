import path from "node:path";
import {fileURLToPath} from "node:url";
import {Worker} from "node:worker_threads";
import {app, BrowserWindow, dialog, ipcMain, protocol, shell, type IpcMainInvokeEvent} from "electron";
import {createInMemoryBattleService} from "@changebattle-v2/showdown-battle-core";
import type {BattleSessionCreateInputV4, BattleSessionSnapshotV4, BattleTrainerItemSubmitV4, CoopPartnerPreferenceV4, FormalBattleResultFinalizeReasonV4, FormalBattleResultFinalizeResultV4, FormalBattleSessionPreparationV4, FormalGameModeV4, FormalGameRunV4, FormalMedicalInsuranceChoiceResultV4, FormalMedicalInsuranceChoiceV4, FormalMedicalInsuranceEffectsV4, FormalMedicalInsuranceOfferV4, FormalRestTeamHealResultV4, FormalSettlementReasonV4, FormalTrainingGroundLessonViewV4, PlayerVaultV4, ShowdownPlayerIdV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";
import {CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_DOWNLOAD_PAGE_URL_V4, changeBattleDesktopUpdateIsNewerV4, changeBattleDesktopUpdateManifestUrlsV4, changeBattleDesktopUpdatePrimaryDownloadUrlV4, normalizeChangeBattleDesktopVersionV4, parseChangeBattleDesktopUpdateManifestV4, type ChangeBattleDesktopUpdateCheckResultV4} from "@changebattle-v2/core";
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

type FormalComputeMethodMap = {
  createFormalGameWithStarterCandidates: {
    args: [UserProfileV2, {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}];
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
  finalizeFormalBattleResult: {args: [FormalGameRunV4, BattleSessionSnapshotV4, FormalBattleResultFinalizeReasonV4 | undefined]; result: FormalBattleResultFinalizeResultV4};
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

ipcMain.handle("desktopApp:checkForUpdates", async () => {
  const result = await checkDesktopUpdate();
  await showDesktopUpdatePrompt(result, {manual: true});
  return desktopUpdateBridgeResult(result);
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

ipcMain.handle("formalGame:createWithStarterCandidates", async (_event: IpcMainInvokeEvent, profile: UserProfileV2, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}) => {
  return callFormalComputeWorker("createFormalGameWithStarterCandidates", profile, options);
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

ipcMain.handle("formalGame:finalizeBattleResult", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, sessionId: string, reason?: FormalBattleResultFinalizeReasonV4) => {
  const snapshot = await ensureBattleService().getSnapshot(sessionId) as unknown as BattleSessionSnapshotV4;
  return callFormalComputeWorker("finalizeFormalBattleResult", run, snapshot, reason);
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
  if (process.env.CHANGEBATTLE_DISABLE_UPDATE_CHECK === "1") {
    console.info("[changebattle-v2:desktop] desktop update check disabled by CHANGEBATTLE_DISABLE_UPDATE_CHECK=1");
    return;
  }
  setTimeout(() => {
    void checkDesktopUpdate().then(result => showDesktopUpdatePrompt(result, {manual: false})).catch(error => {
      console.warn("[changebattle-v2:desktop] desktop update check failed", error instanceof Error ? error.message : error);
    });
  }, desktopUpdateCheckDelayMs);
}

async function checkDesktopUpdate(): Promise<ChangeBattleDesktopUpdateCheckResultV4> {
  const currentVersion = desktopAppVersion();
  const manifestUrls = changeBattleDesktopUpdateManifestUrlsV4(process.env.CHANGEBATTLE_UPDATE_MANIFEST_URLS);
  let lastReason = "没有可用的更新地址。";

  for (const manifestUrl of manifestUrls) {
    try {
      const json = await fetchDesktopUpdateJson(manifestUrl);
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
        downloadUrl: changeBattleDesktopUpdatePrimaryDownloadUrlV4(manifest),
      };
    } catch (error) {
      lastReason = `${manifestUrl}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  return {ok: false, currentVersion, reason: lastReason};
}

async function fetchDesktopUpdateJson(manifestUrl: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), desktopUpdateFetchTimeoutMs);
  try {
    const response = await fetch(manifestUrl, {
      headers: {"Accept": "application/json"},
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function showDesktopUpdatePrompt(result: ChangeBattleDesktopUpdateCheckResultV4, options: {manual: boolean}) {
  if (!result.ok) {
    console.warn(`[changebattle-v2:desktop] desktop update check unavailable: ${result.reason}`);
    if (options.manual) {
      await showDesktopUpdateMessage({
        title: "ChangeBattle V2 更新",
        message: "检查更新失败",
        detail: `当前版本：${result.currentVersion}\n失败原因：${result.reason}`,
        downloadUrl: CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_DOWNLOAD_PAGE_URL_V4,
        type: "warning",
      });
    }
    return;
  }
  if (!result.updateAvailable) {
    console.info(`[changebattle-v2:desktop] desktop is up to date: ${result.currentVersion}`);
    if (options.manual) {
      await showDesktopUpdateMessage({
        title: "ChangeBattle V2 更新",
        message: "当前已是最新版本",
        detail: `当前版本：${result.currentVersion}`,
        downloadUrl: result.downloadUrl,
        type: "info",
      });
    }
    return;
  }

  const {manifest, currentVersion, downloadUrl} = result;
  const notes = manifest.notes?.length ? `\n\n更新内容：\n${manifest.notes.map((note: string) => `- ${note}`).join("\n")}` : "";
  const detail = `当前版本：${currentVersion}\n最新版本：${manifest.version}${notes}`;
  await showDesktopUpdateMessage({
    title: "ChangeBattle V2 更新",
    message: manifest.title || `目前有最新版本：${manifest.version}`,
    detail,
    downloadUrl,
    type: manifest.mandatory ? "warning" : "info",
  });
}

async function showDesktopUpdateMessage(input: {title: string; message: string; detail: string; downloadUrl: string; type: "info" | "warning"}) {
  const buttons = input.downloadUrl ? ["前往下载页", "稍后"] : ["知道了"];
  const response = mainWindow
    ? await dialog.showMessageBox(mainWindow, {
        type: input.type,
        title: input.title,
        message: input.message,
        detail: input.detail,
        buttons,
        defaultId: 0,
        cancelId: buttons.length - 1,
        noLink: true,
      })
    : await dialog.showMessageBox({
        type: input.type,
        title: input.title,
        message: input.message,
        detail: input.detail,
        buttons,
        defaultId: 0,
        cancelId: buttons.length - 1,
        noLink: true,
      });

  if (input.downloadUrl && response.response === 0) {
    await shell.openExternal(input.downloadUrl);
  }
}

function desktopUpdateBridgeResult(result: ChangeBattleDesktopUpdateCheckResultV4) {
  if (!result.ok) {
    return {ok: false, updateAvailable: false, currentVersion: result.currentVersion, reason: result.reason};
  }
  return {
    ok: true,
    updateAvailable: result.updateAvailable,
    currentVersion: result.currentVersion,
    remoteVersion: result.manifest.version,
  };
}

function desktopAppVersion(): string {
  return normalizeChangeBattleDesktopVersionV4(process.env.CHANGEBATTLE_DESKTOP_VERSION || app.getVersion());
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
