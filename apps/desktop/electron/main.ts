import {existsSync} from "node:fs";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {Worker} from "node:worker_threads";
import {app, BrowserWindow, ipcMain, type IpcMainInvokeEvent} from "electron";
import type {BattleSessionSnapshotV4, CoopPartnerPreferenceV4, FormalBattleSessionPreparationV4, FormalGameModeV4, FormalGameRunV4, FormalSettlementReasonV4, UserProfileV2} from "@changebattle-v2/api";

let mainWindow: BrowserWindow | null = null;
let formalComputeWorker: Worker | null = null;
let formalComputeRequestId = 0;
const formalComputePending = new Map<number, {resolve: (value: any) => void; reject: (error: Error) => void}>();

type FormalComputeMethodMap = {
  createFormalGameWithStarterCandidates: {
    args: [UserProfileV2, {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}];
    result: FormalGameRunV4;
  };
  prepareFormalRoundPlan: {args: [FormalGameRunV4]; result: FormalGameRunV4};
  prepareFormalBattleSession: {args: [FormalGameRunV4]; result: FormalBattleSessionPreparationV4};
  prepareFormalSettlement: {args: [FormalGameRunV4, UserProfileV2, FormalSettlementReasonV4]; result: {run: FormalGameRunV4; profile: UserProfileV2}};
  settleFormalBattleRound: {args: [FormalGameRunV4, BattleSessionSnapshotV4]; result: FormalGameRunV4};
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

  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("userProfile:load", async () => {
  const filePath = userProfilePath();
  console.info(`[changebattle-v2:desktop] loading profile from ${filePath}`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, "utf8")) as UserProfileV2;
});

ipcMain.handle("userProfile:save", async (_event: IpcMainInvokeEvent, profile: UserProfileV2) => {
  const filePath = userProfilePath();
  console.info(`[changebattle-v2:desktop] saving profile to ${filePath}`);
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  return profile;
});

ipcMain.handle("userProfile:delete", async () => {
  await rm(userProfilePath(), {force: true});
});

ipcMain.handle("userProfile:path", async () => userProfilePath());

ipcMain.handle("formalGame:createWithStarterCandidates", async (_event: IpcMainInvokeEvent, profile: UserProfileV2, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}) => {
  return callFormalComputeWorker("createFormalGameWithStarterCandidates", profile, options);
});

ipcMain.handle("formalGame:prepareRoundPlan", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("prepareFormalRoundPlan", run);
});

ipcMain.handle("formalGame:prepareBattleSession", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return callFormalComputeWorker("prepareFormalBattleSession", run);
});

ipcMain.handle("formalGame:prepareSettlement", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, profile: UserProfileV2, reason: FormalSettlementReasonV4) => {
  return callFormalComputeWorker("prepareFormalSettlement", run, profile, reason);
});

ipcMain.handle("formalGame:settleBattleRound", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, snapshot: BattleSessionSnapshotV4) => {
  return callFormalComputeWorker("settleFormalBattleRound", run, snapshot);
});

function userProfilePath(): string {
  return path.join(app.getPath("userData"), "profile", "user-profile.json");
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
    else pending.reject(new Error(message.error || "正式流程计算失败。"));
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

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  formalComputeWorker?.terminate();
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) void createWindow();
});
