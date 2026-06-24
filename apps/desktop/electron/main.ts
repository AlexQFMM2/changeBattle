import {app, BrowserWindow} from "electron";

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "ChangeBattle V2 Dex",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.CHANGEBATTLE_V2_DESKTOP_DEV_URL || "http://127.0.0.1:5181";
  await mainWindow.loadURL(devUrl);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) void createWindow();
});
