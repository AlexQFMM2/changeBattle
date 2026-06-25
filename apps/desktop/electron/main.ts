import {existsSync} from "node:fs";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {app, BrowserWindow, ipcMain, type IpcMainInvokeEvent} from "electron";
import type {UserProfileV2} from "@changebattle-v2/api";

let mainWindow: BrowserWindow | null = null;

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
