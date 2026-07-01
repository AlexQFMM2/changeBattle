import {existsSync} from "node:fs";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {app, BrowserWindow, ipcMain, type IpcMainInvokeEvent} from "electron";
import {createChangeBattleV2Api, type BattleSessionSnapshotV4, type CoopPartnerPreferenceV4, type FormalGameModeV4, type FormalGameRunV4, type FormalSettlementReasonV4, type UserProfileV2} from "@changebattle-v2/api";

let mainWindow: BrowserWindow | null = null;
const formalComputeApi = createChangeBattleV2Api();

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
  const run = formalComputeApi.createFormalGameRun(profile, options);
  return formalComputeApi.prepareFormalStarterCandidates(run);
});

ipcMain.handle("formalGame:prepareRoundPlan", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return formalComputeApi.prepareFormalRoundPlan(run);
});

ipcMain.handle("formalGame:prepareBattleSession", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4) => {
  return formalComputeApi.prepareFormalBattleSession(run);
});

ipcMain.handle("formalGame:prepareSettlement", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, profile: UserProfileV2, reason: FormalSettlementReasonV4) => {
  const prepared = formalComputeApi.prepareFormalSettlement(run, reason);
  const nextProfile = prepared.settlement && !prepared.settlement.claimedAt
    ? await formalComputeApi.claimFormalSettlementBp(profile, prepared.settlement)
    : profile;
  const nextRun = prepared.settlement && !prepared.settlement.claimedAt
    ? {
      ...prepared,
      settlement: {...prepared.settlement, claimedAt: new Date().toISOString()},
      updatedAt: new Date().toISOString(),
    }
    : prepared;
  return {run: nextRun, profile: nextProfile};
});

ipcMain.handle("formalGame:settleBattleRound", async (_event: IpcMainInvokeEvent, run: FormalGameRunV4, snapshot: BattleSessionSnapshotV4) => {
  return formalComputeApi.settleFormalBattleRoundV4(formalComputeApi.appendBattleLogEntriesFromSnapshotV4(run, snapshot));
});

function userProfilePath(): string {
  return path.join(app.getPath("userData"), "profile", "user-profile.json");
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) void createWindow();
});
